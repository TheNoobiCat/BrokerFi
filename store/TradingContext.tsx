'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useMemo, useRef } from 'react'
import { useAccount, useWalletClient } from 'wagmi'
import { type WalletClient } from 'viem'
import { useSession } from '@/store/SessionContext'
import { usePathname } from 'next/navigation'
import { InstrumentData } from '@/blockchain/priceFeeds'
import { PythDatafeed } from '@/services/pyth/PythDatafeed'
import { getAssetBySlug, assetToInstrument, AssetData } from '@/services/assets'
import { openPerpsPosition, closePerpsPosition, placeLimitOrder } from '@/services/perps'
import { getSessionData } from '@/services/keyVault'
import { getUSDCAddress } from '@/services/perpsMarkets'
import { fetchContractPositions, cancelOrder as cancelOrderContract, ContractPosition } from '@/services/perps'
import { useUI } from '@/store/UIContext'
import { useUserOrders } from '@/hooks/useUserOrders'
import { getPerpsMarkets } from '@/services/contractsConfig'

interface Position {
  id: string
  symbol: string
  type: 'long' | 'short'
  size: number
  leverage: number
  openPrice: number
  currentPrice: number
  pnl: number
  pnlPercentage: number
  liquidationPrice: number
  takeProfit?: number
  stopLoss?: number
  openTime: Date
}

interface Order {
  id: string
  contractOrderId?: string // Contract order ID for limit orders
  symbol: string
  type: 'long' | 'short'
  size: number
  leverage: number
  orderType: 'market' | 'limit'
  price?: number
  takeProfit?: number | null
  stopLoss?: number | null
  status: 'pending' | 'filled' | 'cancelled'
  createdAt: Date
  market?: { pythPriceId: string }
  orderId?: string
  isLong?: boolean
  collateral?: string
  triggerPrice?: string
}

interface TradingContextType {
  selectedInstrument: InstrumentData | null
  selectedAsset: AssetData | null
  positions: Position[]
  orders: Order[]
  balance: number
  totalPnL: number
  liveChange: number | null
  selectedTimeframe: string
  chartSymbol: string | null
  cancellingOrders: Set<string>
  closingPositions: Set<string>
  setSelectedInstrument: (instrument: InstrumentData | null) => void
  setSelectedAsset: (asset: AssetData | null) => void
  setSelectedTimeframe: (timeframe: string) => void
  openPosition: (symbol: string, type: 'long' | 'short', collateral: number, leverage: number, orderType: 'market' | 'limit', price?: number | null, takeProfit?: number | null, stopLoss?: number | null, walletClient?: WalletClient, callbacks?: { onSubmitted?: () => void; onSuccess?: () => void; onError?: (error: unknown) => void }) => Promise<void>
  closePosition: (positionId: string) => void
  placeOrder: (symbol: string, type: 'long' | 'short', collateral: number, leverage: number, orderType: 'market' | 'limit', price?: number, takeProfit?: number | null, stopLoss?: number | null) => void
  cancelOrder: (orderId: string) => Promise<void>
  addTemporaryOrder: (order: Order) => void
  updatePrices: (symbol: string, price: number) => void
  refreshPositions: () => Promise<void>
  removePosition: (marketId: string) => void
  addOptimisticPosition: (position: Position) => void
  initializeAsset: (slug: string) => void
}

const TradingContext = createContext<TradingContextType | undefined>(undefined)

interface TradingProviderProps {
  children: ReactNode
}

export function TradingProvider({ children }: TradingProviderProps) {
  const pathname = usePathname()
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const session = useSession()
  const { showToast } = useUI()
  const { orders: graphqlOrders, refresh: refreshOrders } = useUserOrders(session?.channelAddress || undefined)
  
  const [selectedInstrument, setSelectedInstrumentState] = useState<InstrumentData | null>(null)
  const [selectedAsset, setSelectedAssetState] = useState<AssetData | null>(null)
  const [liveChange] = useState<number | null>(null)
  const [cancellingOrders, setCancellingOrders] = useState<Set<string>>(new Set())
  const [closingPositions, setClosingPositions] = useState<Set<string>>(new Set())
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D')
  const [positions, setPositions] = useState<Position[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [balance] = useState(0)
  const loadingPositionsRef = useRef(false)
  
  const totalPnL = positions.reduce((sum, position) => sum + position.pnl, 0)
  const chartSymbol = selectedInstrument?.symbol || null
  
  const setSelectedInstrument = useCallback((instrument: InstrumentData | null) => {
    setSelectedInstrumentState(instrument)
  }, [])

  const setSelectedAsset = useCallback((asset: AssetData | null) => {
    setSelectedAssetState(asset)
  }, [])

  const addTemporaryOrder = useCallback((order: Order) => {
    setOrders(prev => {
      // Net orders for the same asset with opposite sides
      const oppositeType = order.type === 'long' ? 'short' : 'long'
      const existingOppositeIndex = prev.findIndex(
        o => o.symbol === order.symbol && o.type === oppositeType && o.orderType === 'limit'
      )
      
      if (existingOppositeIndex !== -1) {
        const existingOrder = prev[existingOppositeIndex]
        const netSize = existingOrder.size - order.size
        
        // If sizes are equal, remove the existing order (full netting)
        if (Math.abs(netSize) < 0.0001) {
          return prev.filter((_, i) => i !== existingOppositeIndex)
        }
        
        // If existing order is larger, reduce its size
        if (netSize > 0) {
          return prev.map((o, i) => 
            i === existingOppositeIndex 
              ? { ...o, size: netSize }
              : o
          )
        }
        
        // If new order is larger, add the net order
        return [...prev, { ...order, size: Math.abs(netSize) }]
      }
      
      return [...prev, order]
    })
  }, [])



  const removePosition = useCallback((marketId: string) => {
    const positionSymbol = marketId === 'btc-perp' ? 'BTCUSD' : 'ETHUSD'
    setPositions(prev => prev.filter(p => p.symbol !== positionSymbol))
  }, [])


  const loadContractPositions = useCallback(async () => {
    if (!session?.channelAddress) return

    // Prevent multiple simultaneous calls
    if (loadingPositionsRef.current) return
    loadingPositionsRef.current = true

    try {
      // Load positions from both BTC and ETH perps markets
      const markets = ['btc-perp', 'eth-perp']
      const allContractPositions: Position[] = []

      for (const marketId of markets) {
        const result = await fetchContractPositions({
          channelAddress: session.channelAddress as `0x${string}`,
          marketId
        })

        if (result.success && result.positions) {
          // Convert contract positions to our Position interface
          const convertedPositions = result.positions.map((contractPos: ContractPosition) => {
            const leverage = Number(contractPos.sizeUsd) / Number(contractPos.collateralUsd);
            const openPrice = Number(contractPos.entryPrice) / 1e18;
            const maintenanceRate = 0.01; // 1% maintenance margin
            const liquidationPrice = contractPos.isLong
              ? openPrice * (1 + maintenanceRate - 1 / leverage)
              : openPrice * (1 - maintenanceRate + 1 / leverage);
              
            return {
              id: `${marketId}-${contractPos.trader}`,
              symbol: marketId === 'btc-perp' ? 'BTCUSD' : 'ETHUSD',
              type: contractPos.isLong ? 'long' : 'short' as 'long' | 'short',
              size: Number(contractPos.size) / 1e18, // Assuming 18 decimals
              leverage,
              openPrice,
              currentPrice: openPrice, // Will be updated by price feeds
              pnl: 0, // TODO: Calculate from contract
              pnlPercentage: 0, // TODO: Calculate
              liquidationPrice,
              takeProfit: contractPos.takeProfitPrice > BigInt(0) ? Number(contractPos.takeProfitPrice) / 1e18 : undefined,
              stopLoss: contractPos.stopLossPrice > BigInt(0) ? Number(contractPos.stopLossPrice) / 1e18 : undefined,
              openTime: new Date(Number(contractPos.openTime) * 1000)
            };
          });
          allContractPositions.push(...convertedPositions);
        }
      }

      // Symbols we just queried on-chain — contract data is the source of truth
      const queriedSymbols = new Set(markets.map(m => m === 'btc-perp' ? 'BTCUSD' : 'ETHUSD'))

      setPositions(prev => {
        // For queried markets, contract data replaces everything.
        // Only keep local positions for markets we didn't query, or
        // optimistic positions for markets with no contract data yet.
        const localPositions = prev.filter(p => !queriedSymbols.has(p.symbol as any))
        return [...localPositions, ...allContractPositions]
      })
    } finally {
      loadingPositionsRef.current = false
    }
  }, [session?.channelAddress])

  // Load positions when session changes
  useEffect(() => {
    loadContractPositions()
  }, [session?.channelAddress, loadContractPositions])

  // Load market map for selected asset
  const loadMarketMap = useCallback(async () => {
    if (!selectedAsset) return

    const markets = await getPerpsMarkets()
    // Derive base asset from urlSlug: "crypto-btcusd" -> "btc" -> match market.id "btc-perp"
    const base = selectedAsset.urlSlug?.split('-')[1]?.replace('usd', '')
    const market = markets.find(m => m.id === `${base}-perp`)
    
    if (market) {
      // Set instrument for this asset
      const instrument = assetToInstrument(selectedAsset)
      if (instrument) {
        setSelectedInstrument(instrument)
      }
    }
  }, [selectedAsset, setSelectedInstrument])

  useEffect(() => {
    loadMarketMap()
  }, [graphqlOrders, loadMarketMap])

  // Sync graphql orders to local state
  useEffect(() => {
    if (!graphqlOrders || graphqlOrders.length === 0) {
      return
    }

    const convertedOrders: Order[] = graphqlOrders.map((gqlOrder: Order) => {
      const pythPriceId = gqlOrder.market?.pythPriceId
      let baseAsset = 'BTC'
      
      // Map pythPriceId to base asset
      if (pythPriceId) {
        const feedId = pythPriceId.toLowerCase()
        if (feedId.includes('ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace')) {
          baseAsset = 'ETH'
        } else if (feedId.includes('e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43')) {
          baseAsset = 'BTC'
        }
      }

      return {
        id: gqlOrder.id,
        contractOrderId: gqlOrder.orderId,
        symbol: `${baseAsset}USD`,
        type: gqlOrder.isLong ? 'long' : 'short',
        size: Number(gqlOrder.size) / 1e18,
        leverage: Number(gqlOrder.size) / Number(gqlOrder.collateral),
        orderType: 'limit',
        price: Number(gqlOrder.triggerPrice) / 1e18,
        status: 'pending',
        createdAt: new Date()
      }
    })

    setOrders(convertedOrders)

    loadMarketMap()
  }, [graphqlOrders, loadMarketMap])

  const openPosition = useCallback(async (symbol: string, type: 'long' | 'short', collateral: number, leverage: number, orderType: 'market' | 'limit', price?: number | null, takeProfit?: number | null, stopLoss?: number | null, walletClient?: WalletClient, callbacks?: { onSubmitted?: () => void; onSuccess?: () => void; onError?: (error: any) => void }) => {
    // Handle perpetuals
    if (pathname.includes('/perpetual')) {
      const sessionData = await getSessionData();
      const channelAddress = sessionData.channelAddress;
      if (!channelAddress) {
        callbacks?.onError?.('No channel address available');
        return;
      }

      if (!walletClient) {
        callbacks?.onError?.('Wallet client not available');
        return;
      }

      const base = selectedAsset?.urlSlug?.split('-')[1]?.split('usd')[0] || 'btc'
      const marketId = `${base}-perp`

      if (orderType === 'limit') {
        // Handle limit orders
        if (!price) {
          callbacks?.onError?.('Trigger price required for limit orders');
          return;
        }

        const size = (collateral * leverage) / price; // Calculate asset amount in USD value
        const sizeWei = BigInt(Math.round(size * 1e18)).toString(); // Convert to wei (18 decimals)
        const triggerPriceWei = BigInt(Math.round(price * 1e18)).toString(); // Convert to wei
        const attachedStopLoss = stopLoss ? BigInt(Math.round(stopLoss * 1e18)).toString() : undefined;
        const attachedTakeProfit = takeProfit ? BigInt(Math.round(takeProfit * 1e18)).toString() : undefined;
        const expiryTime = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours from now

        const result = await placeLimitOrder({
          marketId,
          collateral: collateral.toString(),
          size: sizeWei,
          isLong: type === 'long',
          triggerPrice: triggerPriceWei,
          attachedStopLoss,
          attachedTakeProfit,
          expiryTime,
          maxAcceptableLeverage: (leverage * 1.001).toFixed(2), // Allow 0.1% tolerance for rounding
          usdcAddress: await getUSDCAddress() as `0x${string}`,
          channelAddress: channelAddress as `0x${string}`,
          onSubmitted: () => {
            callbacks?.onSubmitted?.();
          },
          onSuccess: () => {
            // Wait 3 seconds then refresh from subgraph
            setTimeout(() => refreshOrders(), 3000);
            showToast('Order created', 'success');
            callbacks?.onSuccess?.();
            
            // Start polling positions every 10 seconds to catch execution
            let pollCount = 0;
            const maxPolls = 30; // Poll for up to 5 minutes
            const pollInterval = setInterval(async () => {
              pollCount++;
              if (pollCount >= maxPolls) {
                clearInterval(pollInterval);
                return;
              }
              
              // Refresh positions from contract
              if (session?.channelAddress) {
                try {
                  const result = await fetchContractPositions({
                    channelAddress: session.channelAddress as `0x${string}`,
                    marketId
                  });
                  if (result.success && result.positions && result.positions.length > 0) {
                    // Position appeared! Stop polling
                    clearInterval(pollInterval);
                  }
                } catch (err) {
                  console.error('Position polling error:', err);
                }
              }
            }, 10000);
          },
          onError: callbacks?.onError
        }, walletClient);

        if (!result.success) {
          callbacks?.onError?.(result.error || 'Unknown error');
        }
        return;
      }

      // Handle market orders
      if (!price) {
        callbacks?.onError?.('Price not available');
        return;
      }

       const result = await openPerpsPosition({
         marketId,
         collateral: collateral.toString(),
         leverage: leverage.toString(),
         isLong: type === 'long',
         expectedPrice: price?.toString() || '0',
         takeProfit: takeProfit?.toString(),
         stopLoss: stopLoss?.toString(),
         channelAddress: channelAddress as `0x${string}`,
         onSubmitted: () => {
           // Add optimistic position
           const optimisticPosition: Position = {
             id: `optimistic-${marketId}-${Date.now()}`, // Temporary ID
             symbol: marketId === 'btc-perp' ? 'BTCUSD' : 'ETHUSD',
             type,
             size: (collateral * leverage) / (price || 1), // Approximate size
             leverage,
             openPrice: price || 0,
             currentPrice: price || 0,
             pnl: 0,
             pnlPercentage: 0,
             liquidationPrice: type === 'long' 
               ? (price || 0) * (1 + 0.01 - 1 / leverage)
               : (price || 0) * (1 - 0.01 + 1 / leverage),
             takeProfit: takeProfit ?? undefined,
             stopLoss: stopLoss ?? undefined,
             openTime: new Date()
           };
           setPositions(prev => [...prev, optimisticPosition]);
           callbacks?.onSubmitted?.();
         },
         onSuccess: () => {
           loadContractPositions();
           callbacks?.onSuccess?.();
         },
         usdcAddress: await getUSDCAddress() as `0x${string}`,
         onError: callbacks?.onError
       }, walletClient)
      if (!result.success) {
        callbacks?.onError?.(result.error || 'Unknown error');
      }
      return;
    }

    if (orderType === 'limit') {
      const size = (collateral * leverage) / (price ?? 1); // Calculate asset amount
      const newOrder: Order = {
        id: Math.random().toString(36).substr(2, 9),
        symbol,
        type,
        size,
        leverage,
        orderType,
        price: price ?? 0,
        takeProfit: takeProfit ?? null,
        stopLoss: stopLoss ?? null,
        status: 'pending',
        createdAt: new Date()
      }
      
      setOrders(prev => [...prev, newOrder])
      return
    }

    const entryPrice = price ?? 0
    const size = (collateral * leverage) / entryPrice; // Calculate asset amount
    
    const liquidationPrice = type === 'long'
      ? entryPrice * (1 + 0.01 - 1 / leverage)
      : entryPrice * (1 - 0.01 + 1 / leverage)
    
    const newPosition: Position = {
      id: Math.random().toString(36).substr(2, 9),
      symbol,
      type,
      size,
      leverage,
      openPrice: entryPrice,
      currentPrice: entryPrice,
      pnl: 0,
      pnlPercentage: 0,
      liquidationPrice,
      takeProfit: takeProfit ?? undefined,
      stopLoss: stopLoss ?? undefined,
      openTime: new Date()
    }
    
    setPositions(prev => [...prev, newPosition])
    callbacks?.onSuccess?.()
  }, [pathname, session?.channelAddress, walletClient, selectedAsset?.urlSlug, refreshOrders, showToast, loadContractPositions])

  const closePosition = useCallback(async (positionId: string) => {
    if (!session?.channelAddress || !walletClient) return

    const position = positions.find(p => p.id === positionId)
    if (!position) return

    const base = position.symbol.replace('USDT', '').replace('USD', '').toLowerCase()
    const marketId = `${base}-perp`

    // Add to closing set
    setClosingPositions(prev => new Set(prev).add(positionId))

    try {
      const result = await closePerpsPosition({
        marketId,
        expectedPrice: position.currentPrice.toString(),
        channelAddress: session.channelAddress as `0x${string}`,
        onSubmitted: () => {
          // Keep position visible but mark as closing
        },
        onSuccess: () => {
          // Remove from closing set and remove position
          setClosingPositions(prev => {
            const newSet = new Set(prev)
            newSet.delete(positionId)
            return newSet
          })
          setPositions(prev => prev.filter(p => p.id !== positionId))
          loadContractPositions()
          showToast('Position closed successfully', 'success')
        },
        onError: (error) => {
          // Remove from closing set
          setClosingPositions(prev => {
            const newSet = new Set(prev)
            newSet.delete(positionId)
            return newSet
          })
          showToast(`Close failed: ${error}`, 'error')
        }
      }, walletClient)

      if (!result.success) {
        // Remove from closing set
        setClosingPositions(prev => {
          const newSet = new Set(prev)
          newSet.delete(positionId)
          return newSet
        })
        showToast(`Close failed: ${result.error}`, 'error')
      }
    } catch (error) {
      // Remove from closing set
      setClosingPositions(prev => {
        const newSet = new Set(prev)
        newSet.delete(positionId)
        return newSet
      })
      showToast(`Close error: ${error}`, 'error')
    }
  }, [session?.channelAddress, walletClient, positions, loadContractPositions, showToast])

  const placeOrder = useCallback((symbol: string, type: 'long' | 'short', collateral: number, leverage: number, orderType: 'market' | 'limit', price?: number, takeProfit?: number | null, stopLoss?: number | null) => {
    openPosition(symbol, type, collateral, leverage, orderType, price ?? null, takeProfit ?? null, stopLoss ?? null)
  }, [openPosition])

  const cancelOrder = useCallback(async (orderId: string) => {
    if (!session?.channelAddress || !walletClient) return

    const order = orders.find(o => o.id === orderId)
    if (!order) return

    // If order doesn't have contractOrderId yet, can't cancel it on-chain
    if (!order.contractOrderId) {
      showToast('Please wait for order to be confirmed before cancelling', 'error')
      return
    }

    const base = order.symbol.replace('USDT', '').replace('USD', '').toLowerCase()
    const marketId = `${base}-perp`

    // Add to cancelling set
    setCancellingOrders(prev => new Set(prev).add(orderId))

    const result = await cancelOrderContract({
      marketId,
      orderId: order.contractOrderId,
      channelAddress: session.channelAddress as `0x${string}`,
      onSubmitted: () => {
        // Keep order visible but mark as cancelling
      },
      onSuccess: () => {
        // Remove from cancelling set
        setCancellingOrders(prev => {
          const newSet = new Set(prev)
          newSet.delete(orderId)
          return newSet
        })
        // Optimistically remove order from UI immediately
        setOrders(prev => prev.filter(o => o.id !== orderId))
        // Wait 3 seconds then refresh from subgraph
        setTimeout(() => refreshOrders(), 3000)
        showToast('Order cancelled successfully', 'success')
      },
      onError: (error) => {
        // Remove from cancelling set
        setCancellingOrders(prev => {
          const newSet = new Set(prev)
          newSet.delete(orderId)
          return newSet
        })
        console.error('Failed to cancel order:', error)
      }
    }, walletClient)

    if (!result.success) {
      // Remove from cancelling set
      setCancellingOrders(prev => {
        const newSet = new Set(prev)
        newSet.delete(orderId)
        return newSet
      })
      console.error('Failed to cancel order:', result.error)
    }
  }, [session?.channelAddress, walletClient, orders, showToast, refreshOrders])

  const updatePrices = useCallback((symbol: string, price: number) => {
    setPositions(prev => prev.map(position => {
      if (position.symbol === symbol) {
        const priceDiff = price - position.openPrice
        const pnl = position.type === 'long' 
          ? priceDiff * position.size
          : -priceDiff * position.size
        
        const marginUsed = position.openPrice * position.size
        const pnlPercentage = (pnl / marginUsed) * 100
        
        return {
          ...position,
          currentPrice: price,
          pnl,
          pnlPercentage
        }
      }
      return position
    }))
  }, [])


  const initializeAsset = useCallback(async (slug: string) => {
    const asset = await getAssetBySlug(slug)
    if (asset) {
      setSelectedAsset(asset)
      const instrument = assetToInstrument(asset)
      if (instrument) {
        setSelectedInstrument(instrument)
      }
    }
  }, [setSelectedAsset, setSelectedInstrument])

  const addOptimisticPosition = useCallback((position: Position) => {
    setPositions(prev => [...prev, position])
  }, [])

  const value: TradingContextType = useMemo(() => ({
    selectedInstrument,
    selectedAsset,
    positions,
    orders,
    balance,
    totalPnL,
    liveChange,
    selectedTimeframe,
    chartSymbol,
    cancellingOrders,
    closingPositions,
    setSelectedInstrument,
    setSelectedAsset,
    setSelectedTimeframe,
    openPosition,
    closePosition,
    placeOrder,
    cancelOrder,
    addTemporaryOrder,
    updatePrices,
    refreshPositions: loadContractPositions,
    removePosition,
    addOptimisticPosition,
    initializeAsset
  }), [
    selectedInstrument,
    selectedAsset,
    positions,
    orders,
    balance,
    totalPnL,
    liveChange,
    selectedTimeframe,
    chartSymbol,
    cancellingOrders,
    closingPositions,
    setSelectedInstrument,
    setSelectedAsset,
    openPosition,
    closePosition,
    placeOrder,
    cancelOrder,
    addTemporaryOrder,
    updatePrices,
    loadContractPositions,
    removePosition,
    addOptimisticPosition,
    initializeAsset
  ])

  return <TradingContext.Provider value={value}>{children}</TradingContext.Provider>
}

export function useTradingContext() {
  const context = useContext(TradingContext)
  if (context === undefined) {
    throw new Error('useTradingContext must be used within a TradingProvider')
  }
  return context
}
