import { useState, useEffect, useCallback } from 'react'
import { getAssetByPythId } from '@/services/assets'
import publicClient from '@/blockchain/publicClient'
import { orderbookAbi } from '@/blockchain/optionsAbis'
import { getOrderbookAddress } from '@/services/contractsConfig'
import { zeroAddress } from 'viem'

export interface OptionsOrderData {
  id: string
  orderId: string
  limitPrice: string
  quantity: string
  marginLocked: string
  intent: string
  isLong: boolean
  isLiquidation: boolean
  status: string
  createdTime: string
  createdAtBlock: string
  trader: {
    id: string
  }
  series: {
    id: string
    underlyingPriceFeedId: string
    isCall: boolean
    strikePrice: string
    expiry: string
    contractSize: string
  }
  asset?: {
    symbol: string
    name: string
    type: string
  }
}

export function useOptionsOrders(address: string | undefined) {
  const [orders, setOrders] = useState<OptionsOrderData[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
  }, [])

  useEffect(() => {
    if (!address) {
      setOrders([])
      setLoading(false)
      return
    }

    async function fetchOrders() {
      setLoading(true)
      try {
        const query = `{
          optionsOrders(
            where: { 
              trader: "${address!.toLowerCase()}"
            }
            orderBy: createdTime
            orderDirection: desc
          ) {
            id
            orderId
            limitPrice
            quantity
            marginLocked
            intent
            isLong
            isLiquidation
            status
            createdTime
            createdAtBlock
            trader {
              id
            }
            series {
              id
              underlyingPriceFeedId
              isCall
              strikePrice
              expiry
              contractSize
            }
          }
        }`

        const res = await fetch(process.env.NEXT_PUBLIC_GOLDSKY_URL!, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query })
        })

        const { data, errors } = await res.json()
        
        if (errors) {
          console.error('[useOptionsOrders] GraphQL errors:', errors)
          setOrders([])
        } else {
          console.log('[useOptionsOrders] Raw orders from subgraph:', data?.optionsOrders)
          
          // The subgraph has no handler for order execution (bulkMatch deletes
          // orders on-chain but emits no event the subgraph tracks).  Orders
          // that were matched still appear as ACTIVE in the subgraph.
          //
          // Fix: cross-reference on-chain state via multicall.  The public
          // `orders(seriesId, orderId)` mapping returns trader == address(0)
          // for deleted (matched) orders.
          const subgraphOrders: OptionsOrderData[] = (data?.optionsOrders || []).filter(
            (o: OptionsOrderData) => o.status === 'ACTIVE' && o.series
          )

          let liveOrderFlags: boolean[] = []
          if (subgraphOrders.length > 0) {
            try {
              const orderbookAddress = await getOrderbookAddress()
              const results = await publicClient.multicall({
                contracts: subgraphOrders.map((order: OptionsOrderData) => ({
                  address: orderbookAddress,
                  abi: orderbookAbi,
                  functionName: 'orders',
                  args: [order.series.id as `0x${string}`, order.orderId as `0x${string}`],
                })),
                allowFailure: true,
              })

              liveOrderFlags = results.map((r) => {
                if (r.status === 'failure') return false
                // orders() returns [trader, isLong, limitPrice, quantity, marginLocked, intent]
                const trader = (r.result as readonly unknown[])[0] as string
                return trader !== zeroAddress
              })
            } catch (err) {
              console.warn('[useOptionsOrders] multicall failed, falling back to subgraph-only:', err)
              // If multicall fails, show all subgraph-active orders (graceful degradation)
              liveOrderFlags = subgraphOrders.map(() => true)
            }
          }

          // Only keep orders that are still live on-chain
          const liveOrders = subgraphOrders.filter((_, i) => liveOrderFlags[i])
          console.log(`[useOptionsOrders] ${subgraphOrders.length} subgraph ACTIVE → ${liveOrders.length} confirmed on-chain`)

          // Enrich with asset metadata
          const ordersWithAssets = await Promise.all(liveOrders.map(async (order: OptionsOrderData) => {
            const asset = await getAssetByPythId(order.series.underlyingPriceFeedId)
            return {
              ...order,
              asset: asset ? {
                symbol: asset.symbol,
                name: asset.name,
                type: asset.type
              } : undefined
            }
          }))
          
          console.log('[useOptionsOrders] Final orders with assets:', ordersWithAssets)
          setOrders(ordersWithAssets)
        }
      } catch (error) {
        console.error('[useOptionsOrders] Fetch error:', error)
        setOrders([])
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [address, refreshTrigger])

  return { orders, loading, refresh }
}
