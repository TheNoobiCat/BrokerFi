"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useTradingContext } from "@/store/TradingContext";
import TradingChart from "./TradingChart";
import TradingForm from "./TradingForm";
import TradingButtons from "./TradingButtons";
import PositionsTable from "./PositionsTable";
import OrdersTable from "./OrdersTable";
import { assetToInstrument } from "@/services/assets";
import { useAppKit } from "@reown/appkit/react";
import { useAccount, useWalletClient } from "wagmi";
import TradeConfirmationModal from "./TradeConfirmationModal";
import { useUI } from "@/store/UIContext";
import Portal from "../ui/Portal";
import { usePathname } from "next/navigation";
import { PythDatafeed } from '@/services/pyth/PythDatafeed';
import { BiTrendingUp, BiTrendingDown } from 'react-icons/bi';

import { GhostSquare } from "../ui/GhostSquare";

export default function Dashboard() {
  const pathname = usePathname();
  const { open: openConnectModal } = useAppKit();
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { agentSidebarOpen, setAgentSidebarOpen, setChartContext, setQueuedAgentMessage, showToast } = useUI();
  const {
    selectedInstrument,
    selectedAsset,
    positions,
    orders,
    balance,
    totalPnL,
    openPosition,
    closePosition,
    cancelOrder,
    addTemporaryOrder,
    updatePrices,
    cancellingOrders,
    closingPositions,
  } = useTradingContext();
  const tradeSymbol =
    selectedInstrument?.symbol ||
    (selectedAsset ? assetToInstrument(selectedAsset).symbol : null);
  const [collateral, setCollateral] = useState(10); // Changed from tradeSize to collateral in USDC
  const [sliderValue, setSliderValue] = useState(0);
  const collateralSourceRef = useRef<'input' | 'slider' | 'sync'>('sync');
  const sliderSourceRef = useRef<'user' | 'sync'>('sync');

  const setCollateralFromInput = useCallback((value: number) => {
    collateralSourceRef.current = 'input';
    setCollateral(value);
  }, []);

  const setCollateralFromSlider = useCallback((value: number) => {
    collateralSourceRef.current = 'slider';
    setCollateral(value);
  }, []);

  const setSliderFromUser = useCallback((value: number) => {
    sliderSourceRef.current = 'user';
    setSliderValue(value);
  }, []);

  const setSliderFromSync = useCallback((value: number) => {
    sliderSourceRef.current = 'sync';
    setSliderValue(value);
  }, []);
  const [leverage, setLeverage] = useState(10);
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [marketPrice, setMarketPrice] = useState<number | null>(null);
  const [limitPrice, setLimitPrice] = useState<number | null>(null);
  const [currentSymbol, setCurrentSymbol] = useState<string>("");
  const initialLimitPriceSetRef = useRef<boolean>(false);
  const [tpSlEnabled, setTpSlEnabled] = useState(false);
  const [takeProfit, setTakeProfit] = useState<number | null>(null);
  const [tradeLoading, setTradeLoading] = useState(false);
  const [loadingSide, setLoadingSide] = useState<'long' | 'short' | null>(null);
  const [takeProfitMode, setTakeProfitMode] = useState<"price" | "percent">(
    "price",
  );
  const [stopLoss, setStopLoss] = useState<number | null>(null);
  const [stopLossMode, setStopLossMode] = useState<"price" | "percent">(
    "price",
  );
  const [chartFocused, setChartFocused] = useState(false);
  const [spotlightRect, setSpotlightRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const chartSpotlightRef = useRef<HTMLDivElement | null>(null);
  const [chartPrompt, setChartPrompt] = useState("");
  const datafeedRef = useRef<PythDatafeed | null>(null);
  const [liveChanges, setLiveChanges] = useState<Record<string, number>>({});
  const baseline24hRef = useRef<Record<string, number>>({});
  // Confirmation modal state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingTrade, setPendingTrade] = useState<{
    side: "long" | "short";
  } | null>(null);
  const [chartResizeTrigger, setChartResizeTrigger] = useState(0);
  const [maxLeverage, setMaxLeverage] = useState(50);
  const [estimatedFee, setEstimatedFee] = useState<number | null>(null);
  const [feeLoading, setFeeLoading] = useState(false);

  // Debounce ref for leverage/fee updates
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastCollateralRef = useRef<number>(collateral);

  // Trigger chart resize when sidebar state changes
  useEffect(() => {
    setChartResizeTrigger(prev => prev + 1);
  }, [agentSidebarOpen]);

  // Sync collateral slider with balance
  useEffect(() => {
    if (collateralSourceRef.current !== 'slider' && balance > 0) {
      const newSliderValue = Math.round(((collateral / balance) * 100) * 10000) / 10000; // Round to 4 decimals
      if (newSliderValue !== sliderValue) {
        setSliderFromSync(Math.min(100, Math.max(0, newSliderValue))); // Clamp to 0-100
      }
    }
  }, [collateral, balance]);

  // Update collateral when slider changes
  useEffect(() => {
    if (sliderSourceRef.current === 'user' && balance > 0) {
      const newCollateral = Math.round(((sliderValue / 100) * balance) * 1000000) / 1000000; // Round to 6 decimals
      if (newCollateral !== collateral) {
        setCollateralFromSlider(newCollateral);
      }
    }
  }, [sliderValue, balance]);

  // Collapse state - collapsed by default unless there are entries
  const hasEntries = positions.length > 0 || orders.length > 0;
  const [tablesCollapsed, setTablesCollapsed] = useState(!hasEntries);

  // Update collapse state when positions/orders change
  useEffect(() => {
    setTablesCollapsed(!hasEntries);
  }, [hasEntries]);

  // Initialize datafeed and price callback once
  useEffect(() => {
    if (!datafeedRef.current) {
      datafeedRef.current = new PythDatafeed()
    }
  }, [])

  // Setup a single global price update callback to receive SSE updates
  useEffect(() => {
    let mounted = true
    if (!datafeedRef.current) datafeedRef.current = new PythDatafeed()

    try {
      datafeedRef.current.setPriceUpdateCallback((price: number, ticker: string) => {
        if (!mounted) return
        // ticker is in the normalized instrument form (e.g. BTCUSD)
        try {
          // Update positions with live price
          updatePrices(ticker, price);

          // Prefer baseline 24h change if available
          const baseline = baseline24hRef.current[ticker]
          if (typeof baseline === 'number' && baseline > 0) {
            const change = ((price - baseline) / baseline) * 100
            setLiveChanges(prevc => ({ ...prevc, [ticker]: change }))
          }
        } catch {}
      })
    } catch (e) {
      // ignore
    }

    return () => {
      mounted = false
      try { datafeedRef.current?.clearPriceUpdateCallback() } catch {}
    }
  }, [])

  // Calculate initial fee estimation when all conditions are met
  const initialCalcDoneRef = useRef(false);
  useEffect(() => {
    if (initialCalcDoneRef.current) return; // Only run once
    
    const price = marketPrice || limitPrice || 0;
    if (!selectedAsset?.urlSlug || collateral <= 0 || price <= 0) {
      return;
    }

    const calculateInitialFee = async () => {
      const baseFromSlug = selectedAsset.urlSlug?.split('-')[1] || '';
      const baseSymbol = (baseFromSlug || selectedAsset.symbol || 'btc').replace(/(usdt|usd)$/i, '');
      const marketId = `${baseSymbol.toLowerCase()}-perp`;

      try {
        const { getMaxLeverageForPosition, estimateTradingFees } = await import('@/services/perps');

        // Get max leverage
        if (address) {
          const maxLevResult = await getMaxLeverageForPosition(marketId, address, BigInt(100 * 1e18));
          if (maxLevResult.success && maxLevResult.maxLeverage) {
            setMaxLeverage(maxLevResult.maxLeverage);
          }
        }

        // Estimate fees for initial default position
        const sizeUsd = collateral * leverage;
        const feeResult = await estimateTradingFees(marketId, BigInt(sizeUsd * 1e18), true);
        if (feeResult.success && feeResult.totalFee !== undefined) {
          const feeAmount = Number(feeResult.totalFee) / 1e18;
          setEstimatedFee(feeAmount);
          initialCalcDoneRef.current = true; // Mark as done
        }
      } catch (error) {
        console.error('[Initial Fee Estimation] Error:', error);
      }
    };

    calculateInitialFee();
  }, [selectedAsset?.urlSlug, marketPrice, limitPrice, collateral, leverage, address]); // Trigger when all conditions become available

  // Update max leverage and estimated fee when user inputs change (not on every price tick)
  useEffect(() => {
    // Only update if collateral changed
    if (lastCollateralRef.current === collateral) {
      return;
    }
    lastCollateralRef.current = collateral;

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce the update
    debounceRef.current = setTimeout(async () => {
      if (!selectedAsset || !selectedAsset.urlSlug || collateral <= 0) {
        return;
      }

      const baseFromSlug = selectedAsset.urlSlug?.split('-')[1] || '';
      const baseSymbol = (baseFromSlug || selectedAsset.symbol || 'btc').replace(/(usdt|usd)$/i, '');
      const marketId = `${baseSymbol.toLowerCase()}-perp`;
      const price = marketPrice || limitPrice || 0;
      if (price <= 0) {
        return;
      }

      try {
        const { getMaxLeverageForPosition, estimateTradingFees } = await import('@/services/perps');

        // Get max leverage for a small position size to find the absolute maximum
        if (address) {
          const maxLevResult = await getMaxLeverageForPosition(marketId, address, BigInt(100 * 1e18)); // Small position size
          if (maxLevResult.success && maxLevResult.maxLeverage) {
            setMaxLeverage(maxLevResult.maxLeverage);
          }
        }

        // Estimate fees for current position
        const sizeUsd = collateral * leverage;
        const feeResult = await estimateTradingFees(marketId, BigInt(sizeUsd * 1e18), true); // assume long for now
        if (feeResult.success && feeResult.totalFee !== undefined) {
          const feeAmount = Number(feeResult.totalFee) / 1e18;
          setEstimatedFee(feeAmount);
        }
      } catch (error) {
        console.error('[Fee Estimation] Error:', error);
      }
    }, 500); // 500ms debounce

    // Cleanup on unmount
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [collateral]); // Only retrigger on collateral changes
  useEffect(() => {
    if (!tradeSymbol || !datafeedRef.current) {
      return
    }

    const loadBaseline = async () => {
      try {
        const symbols = await datafeedRef.current!.searchSymbols(tradeSymbol)
        const matchedSymbol = symbols.find(s => s.ticker === tradeSymbol)
        if (matchedSymbol) {
          const now = Date.now()
          const from = now - 24 * 60 * 60 * 1000
          const bars = await (datafeedRef.current as any).getHistoryKLineData?.(matchedSymbol, ({ multiplier: 1, timespan: 'hour', text: '1H' } as any), Math.floor(from / 1000), Math.floor(now / 1000))
          if (Array.isArray(bars) && bars.length > 0) {
            const baselineBar = bars[0]
            const baselinePrice = baselineBar.close
            if (baselinePrice && typeof baselinePrice === 'number' && baselinePrice > 0) {
              baseline24hRef.current[tradeSymbol] = baselinePrice
            }
          }
          // Subscribe to receive price updates
          datafeedRef.current!.subscribe(matchedSymbol, { text: '1m', type: 'minute', span: 1 }, () => {})
        }
      } catch (e) {
        console.error('Error loading baseline for', tradeSymbol, e)
      }
    }

    loadBaseline()
  }, [tradeSymbol])

  // Subscribe to price updates for all position symbols
  useEffect(() => {
    if (!datafeedRef.current) return

    const positionSymbols = new Set(positions.map(p => p.symbol))
    
    positionSymbols.forEach(async (symbol) => {
      try {
        const symbols = await datafeedRef.current!.searchSymbols(symbol)
        const matchedSymbol = symbols.find(s => s.ticker === symbol)
        if (matchedSymbol) {
          // Subscribe to receive price updates for this position symbol
          datafeedRef.current!.subscribe(matchedSymbol, { text: '1m', type: 'minute', span: 1 }, () => {})
        }
      } catch (e) {
        console.error('Error subscribing to price updates for', symbol, e)
      }
    })
  }, [positions])

  // Helper to calculate trade size from collateral and leverage
  const calculateTradeSize = (
    collateralUSDC: number,
    leverageAmount: number,
    price: number,
  ): number => {
    if (!price || price <= 0) return 0;
    const positionValue = collateralUSDC * leverageAmount; // Total position value in USDC
    return positionValue / price; // Convert to asset units
  };

  const getEntryPrice = () => {
    return orderType === "limit" ? limitPrice : marketPrice;
  };

  const formatPrice = (p: number | null) => {
    if (p === null || p === undefined || Number.isNaN(p)) return "-";
    const decimals = chartInstrument?.type === "forex" ? 4 : 2;
    return p.toFixed(decimals);
  };

  const calculateLiquidationPrice = (
    side: "long" | "short",
    entryPrice: number | null,
    lev: number,
  ) => {
    if (!entryPrice) return null;
    return side === "long"
      ? entryPrice * (1 - 1 / lev)
      : entryPrice * (1 + 1 / lev);
  };

  const computeTpFromPercent = (percent: number, entry: number) => {
    const priceMoveFrac = percent / (100 * Math.max(1, leverage));
    return {
      long: entry * (1 + priceMoveFrac),
      short: entry * (1 - priceMoveFrac),
    };
  };

  const computeSlFromPercent = (percent: number, entry: number) => {
    const priceMoveFrac = percent / (100 * Math.max(1, leverage));
    return {
      long: entry * (1 - priceMoveFrac),
      short: entry * (1 + priceMoveFrac),
    };
  };
  const vTakerFee = 0.00035;

  // Helper to change order type
  const handleSetOrderType = (type: "market" | "limit") => {
    setOrderType(type);
  };

  const updateSpotlight = useCallback(() => {
    if (!chartSpotlightRef.current) return;
    const rect = chartSpotlightRef.current.getBoundingClientRect();
    setSpotlightRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
  }, []);

  useEffect(() => {
    if (!chartFocused) return;
    updateSpotlight();
    const handle = () => updateSpotlight();
    window.addEventListener("resize", handle);
    window.addEventListener("scroll", handle, true);
    return () => {
      window.removeEventListener("resize", handle);
      window.removeEventListener("scroll", handle, true);
    };
  }, [chartFocused, updateSpotlight]);

  const handleResetToMidPrice = () => {
    if (marketPrice !== null) {
      setLimitPrice(marketPrice);
      initialLimitPriceSetRef.current = true;
    }
  };

  // Helper to get base currency from symbol
  const getBaseCurrency = (symbol: string): string => {
    if (symbol.includes("USDT") || symbol.includes("USDC")) {
      return symbol.replace(/USDT|USDC/, "");
    }
    if (symbol === "EURUSD") return "EUR";
    if (symbol === "GBPUSD") return "GBP";
    if (symbol === "USDJPY") return "JPY";
    return symbol.substring(0, 3);
  };

  // Chart instrument
  const chartInstrument = selectedAsset
    ? assetToInstrument(selectedAsset)
    : selectedInstrument;

  // Calculate account stats
  const usedMargin = positions.reduce(
    (sum, pos) => sum + (pos.openPrice * pos.size) / pos.leverage,
    0,
  );
  const availableMargin = balance - usedMargin;
  const marginUtilization = (usedMargin / balance) * 100;

  const handleLongClick = () => {
    if (!isConnected && openConnectModal) {
      openConnectModal();
      return;
    }
    if (localStorage.getItem('skipTradeConfirmation') === 'true') {
      // Skip confirmation and go straight to trade
      handleConfirmTradeDirect('long');
      return;
    }
    setPendingTrade({ side: "long" });
    setShowConfirmation(true);
  };

  const handleConfirmTradeDirect = async (side: "long" | "short") => {
    await handleConfirmTrade(side);
  };

  const handleShortClick = () => {
    if (!isConnected && openConnectModal) {
      openConnectModal();
      return;
    }
    if (localStorage.getItem('skipTradeConfirmation') === 'true') {
      // Skip confirmation and go straight to trade
      handleConfirmTradeDirect('short');
      return;
    }
    setPendingTrade({ side: "short" });
    setShowConfirmation(true);
  };

  const handleConfirmTrade = async (directSide?: "long" | "short") => {
    const side = directSide || pendingTrade?.side;
    if (!side || !tradeSymbol) return;
    if (!side || !tradeSymbol) return;
    const priceToUse = orderType === "limit" ? limitPrice : marketPrice;
    if (!priceToUse) return;

    if (!address) {
      showToast('Please select an account in your wallet first', 'error');
      return;
    }

    if (!walletClient) {
      showToast('Wallet client not available', 'error');
      return;
    }

    if (!isConnected) {
      showToast('Please connect your wallet first', 'error');
      return;
    }

    // Check minimum collateral based on order type (before setting loading states)
    const minCollateral = orderType === 'limit' ? 12 : 10;
    if (collateral < minCollateral) {
      showToast(`Minimum collateral is ${minCollateral} USDC`, 'error');
      return;
    }

    setTradeLoading(true);
    setLoadingSide(side);

    try {

      // Calculate trade size from collateral + leverage
      const tradeSize = calculateTradeSize(collateral, leverage, priceToUse);

      // compute TP/SL prices if enabled
      let tpPrice: number | null = null;
      let slPrice: number | null = null;
      if (tpSlEnabled && priceToUse != null) {
        if (takeProfit != null) {
          tpPrice =
            takeProfitMode === "price"
            ? takeProfit
            : computeTpFromPercent(takeProfit, priceToUse)[side];
      }
      if (stopLoss != null) {
        slPrice =
          stopLossMode === "price"
            ? stopLoss
            : computeSlFromPercent(stopLoss, priceToUse)[side];
      }
    }

    await openPosition(
      tradeSymbol,
      side,
      collateral,
      leverage,
      orderType,
      priceToUse,
      tpPrice,
      slPrice,
      walletClient,
      {
        onSubmitted: () => {
          // Add ghost loading order immediately for limit orders
          if (orderType === 'limit') {
            const ghostOrder = {
              id: `ghost-${Date.now()}`,
              symbol: tradeSymbol,
              type: side,
              size: calculateTradeSize(collateral, leverage, priceToUse),
              leverage,
              orderType: 'limit' as const,
              price: priceToUse,
              takeProfit: tpPrice,
              stopLoss: slPrice,
              status: 'pending' as const,
              createdAt: new Date()
            };
            addTemporaryOrder(ghostOrder);
          }
        },
         onSuccess: async () => {
             const successMessage = orderType === 'limit' 
               ? 'Order created successfully' 
               : 'Position opened successfully';
             showToast(successMessage, 'success');
             
             setTradeLoading(false);
             setLoadingSide(null);
           },
        onError: (error) => {
          setTradeLoading(false);
          setLoadingSide(null);
          showToast(`Trade failed: ${error}`, 'error');
        }
      }
    );
    } catch (error) {
      setTradeLoading(false);
      setLoadingSide(null);
      alert('Trade error: ' + error);
    }
  };

  // Show loading state if no asset/instrument is selected
  if (!chartInstrument) {
    return (
      <main className="flex-1 overflow-auto bg-darker">
        <div className="h-full flex flex-col items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl text-white mb-2">No Asset Selected</h2>
            <p className="text-white/60">
              Please select an asset to view its trading interface.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto bg-darker">
      {/* Mobile-First Layout */}
      <div className="h-full flex flex-col">
        {/* Chart and Trading Section - Responsive Grid Layout with dynamic height */}
        <div
          className={`flex-1 flex flex-col 2xl:flex-row gap-3 lg:gap-4 mt-3 lg:mt-4 mx-3 lg:mx-4 mb-3 lg:mb-4 transition-all duration-300 ${tablesCollapsed ? "lg:h-[75vh] xl:h-[80vh]" : "lg:h-[60vh] xl:h-[65vh]"} 2xl:h-[60vh]`}
        >
          {/* Chart Section */}
          <div className="flex-1 2xl:flex-2 min-h-0">
            <div className="broker-card h-full flex flex-col">
              <div className="p-3 lg:p-4 border-b border-white/6 shrink-0">
                <div className="flex items-center justify-between mb-2 lg:mb-3">
                  <div className="flex-1">
                    <div className="flex lg:grid lg:grid-cols-5 gap-3 items-center overflow-x-auto lg:overflow-visible">
                      <div className="text-xs text-white/60">
                        <div className="font-sans text-[11px]">24h Change</div>
                        {(() => {
                          const change = tradeSymbol ? liveChanges[tradeSymbol] : undefined;
                          return (
                            <div className={`text-sm font-mono flex items-center gap-1 ${typeof change === 'number' && change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {typeof change === 'number' && change >= 0 ? <BiTrendingUp className="w-3 h-3" /> : <BiTrendingDown className="w-3 h-3" />}
                              {typeof change === 'number' ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%` : '--'}
                            </div>
                          );
                        })()}
                      </div>

                      <div className="text-xs text-white/60">
                        <div className="font-sans text-[11px]">OI (Long/Short)</div>
                        <div className="text-sm font-mono text-white mt-1">
                          <GhostSquare size="md" />
                        </div>
                      </div>

                      <div className="text-xs text-white/60">
                        <div className="font-sans text-[11px]">24h Volume</div>
                        <div className="text-sm font-mono text-white mt-1">
                          <GhostSquare size="md" />
                        </div>
                      </div>

                      <div className="text-xs text-white/60">
                        <div className="font-sans text-[11px]">Funding</div>
                        <div className="text-sm font-mono text-white mt-1">
                          <GhostSquare size="sm" />
                        </div>
                      </div>

                      <div className="text-xs text-white/60">
                        <div className="font-sans text-[11px]">
                          Position Fee
                        </div>
                        <div className="text-sm font-mono text-white">
                          0.035% vTaker
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div
                ref={chartSpotlightRef}
                className={`flex-1 min-h-0 overflow-hidden relative ${agentSidebarOpen ? "transition-all duration-200" : ""}`}
                onMouseEnter={() => {
                  if (!agentSidebarOpen) return;
                  setChartFocused(true);
                  updateSpotlight();
                }}
                onMouseLeave={() => {
                  if (!agentSidebarOpen) return;
                  setChartFocused(false);
                  setSpotlightRect(null);
                }}
                style={chartFocused ? { zIndex: 100 } : undefined}
              >
                <TradingChart
                  symbol={chartInstrument.symbol}
                  priceId={chartInstrument.priceId}
                  onResizeTrigger={chartResizeTrigger}
                  onPriceUpdate={(price) => {
                    // Always update market price for live display
                    setMarketPrice(price);

                    // Track current symbol (do not reset limit price here)
                    if (currentSymbol !== chartInstrument.symbol) {
                      setCurrentSymbol(chartInstrument.symbol);
                    }

                    // For limit orders: ONLY set limit price once ever (per page load)
                    if (
                      orderType === "limit" &&
                      limitPrice === null &&
                      !initialLimitPriceSetRef.current
                    ) {
                      setLimitPrice(price);
                      initialLimitPriceSetRef.current = true;
                    }

                    // Update positions with the new price
                    updatePrices(chartInstrument.symbol, price);
                  }}
                />
              </div>

              {/* Chart Focus Overlay - Only in vibetrading mode */}
              {agentSidebarOpen && chartFocused && spotlightRect && (
                <>
                  {/* Spotlight overlay via Portal to avoid stacking issues */}
                  <Portal>
                    <div
                      className="fixed inset-0 pointer-events-none"
                      aria-hidden
                      style={{ zIndex: 90 }}
                    >
                      <div
                        className="absolute"
                        style={{
                          left: spotlightRect.left,
                          top: spotlightRect.top,
                          width: spotlightRect.width,
                          height: spotlightRect.height,
                          boxShadow: "0 0 0 9999px rgba(0,0,0,0.65)",
                          borderRadius: "12px",
                          pointerEvents: "none",
                        }}
                      />
                    </div>
                  </Portal>

                  {/* Chart focus tooltip with input */}
                  <div
                    className="absolute bottom-12 left-1/2 transform -translate-x-1/2"
                    style={{ zIndex: 110 }}
                  >
                    <div className="bg-surface/95 backdrop-blur-md border border-white/30 rounded-lg p-4 shadow-2xl max-w-md">
                      <div className="text-center">
                        <p className="text-white/90 text-sm mb-3 font-medium">
                          Ask Vibetrader about this chart
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={chartPrompt}
                            onChange={(e) => setChartPrompt(e.target.value)}
                            placeholder="What's happening with this chart?"
                            className="flex-1 px-3 py-2 bg-glass-dark border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-400/50 text-sm"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && chartPrompt.trim()) {
                                // Add chart context to Vibetrader chat
                                const contextMessage = `Question about the ${chartInstrument?.name} (${chartInstrument?.symbol}) chart: ${chartPrompt}`;
                                setChartContext(contextMessage);
                                setQueuedAgentMessage(contextMessage);
                                setChartPrompt("");
                                setChartFocused(false);
                                setAgentSidebarOpen(true);
                                // Focus the agent sidebar input
                                setTimeout(() => {
                                  const agentInput = document.querySelector(
                                    "[data-agent-input]",
                                  ) as HTMLTextAreaElement;
                                  if (agentInput) agentInput.focus();
                                }, 100);
                              }
                            }}
                            autoFocus
                          />
                          <button
                            onClick={() => {
                              if (chartPrompt.trim()) {
                                const contextMessage = `Question about the ${chartInstrument?.name} (${chartInstrument?.symbol}) chart: ${chartPrompt}`;
                                setChartContext(contextMessage);
                                setQueuedAgentMessage(contextMessage);
                                setChartPrompt("");
                                setChartFocused(false);
                                setAgentSidebarOpen(true);
                                // Focus the agent sidebar input
                                setTimeout(() => {
                                  const agentInput = document.querySelector(
                                    "[data-agent-input]",
                                  ) as HTMLTextAreaElement;
                                  if (agentInput) agentInput.focus();
                                }, 100);
                              }
                            }}
                            disabled={!chartPrompt.trim()}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm"
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Trading Panel - Hidden on small/medium/large, side-by-side on 2xl+ */}
          {!agentSidebarOpen && (
            <div className="hidden 2xl:block 2xl:w-[500px] min-h-0">
              <div className="broker-card h-full flex flex-col">
                <div className="p-3 lg:p-4">
                  {/* Header */}
                  <div className="mb-3 lg:mb-4 pb-2 lg:pb-3 border-b border-white/6">
                    <h3 className="text-base lg:text-lg font-semibold text-white font-sans">
                      Trade
                    </h3>
                  </div>
                </div>

                {/* Scrollable main form */}
                <div className="px-3 lg:px-4 flex-1 overflow-auto">
                  <TradingForm
                    collateral={collateral}
                    setCollateral={setCollateralFromInput}
                    sliderValue={sliderValue}
                    setSliderValue={setSliderFromUser}
                    leverage={leverage}
                    setLeverage={setLeverage}
                    orderType={orderType}
                    setOrderType={setOrderType}
                    marketPrice={marketPrice}
                    limitPrice={limitPrice}
                    setLimitPrice={setLimitPrice}
                    tpSlEnabled={tpSlEnabled}
                    setTpSlEnabled={setTpSlEnabled}
                    takeProfit={takeProfit}
                    setTakeProfit={setTakeProfit}
                    takeProfitMode={takeProfitMode}
                    setTakeProfitMode={setTakeProfitMode}
                    stopLoss={stopLoss}
                    setStopLoss={setStopLoss}
                    stopLossMode={stopLossMode}
                    setStopLossMode={setStopLossMode}
                    balance={balance}
                    chartInstrument={chartInstrument}
                    initialLimitPriceSetRef={initialLimitPriceSetRef}
                    handleResetToMidPrice={handleResetToMidPrice}
                    handleLongClick={handleLongClick}
                    handleShortClick={handleShortClick}
                    formatPrice={formatPrice}
                    computeTpFromPercent={computeTpFromPercent}
                    computeSlFromPercent={computeSlFromPercent}
                    getEntryPrice={getEntryPrice}
                    calculateLiquidationPrice={calculateLiquidationPrice}
                    calculateTradeSize={calculateTradeSize}
                    vTakerFee={vTakerFee}
                    maxLeverage={maxLeverage}
                    variant="desktop"
                  />
                </div>

                {/* Footer (anchored) */}
                <TradingButtons
                  estimatedFee={estimatedFee}
                  onLongClick={handleLongClick}
                  onShortClick={handleShortClick}
                  collateral={collateral}
                  leverage={leverage}
                  orderType={orderType}
                  limitPrice={limitPrice}
                  marketPrice={marketPrice}
                  calculateLiquidationPrice={calculateLiquidationPrice}
                  vTakerFee={vTakerFee}
                  longLoading={loadingSide === 'long'}
                  shortLoading={loadingSide === 'short'}
                />
              </div>
            </div>
          )}
        </div>

        {/* Medium Screen Layout: Trading Section below chart (lg to 2200px) */}
        {!agentSidebarOpen && (
          <div className="hidden lg:block 2xl:hidden">
            <div className="mx-3 lg:mx-4 mb-3 lg:mb-4">
              {/* Trading Panel - Medium screens */}
              <div className="h-[600px] lg:h-[750px] xl:h-[800px]">
                <div className="broker-card h-full flex flex-col">
                  <div className="p-3 lg:p-4 shrink-0">
                    <div className="mb-3 lg:mb-4 pb-2 lg:pb-3 border-b border-white/6">
                      <h3 className="text-base lg:text-lg font-semibold text-white font-sans">
                        Trade
                      </h3>
                    </div>
                  </div>

                  {/* Scrollable main form */}
                  <div className="px-3 lg:px-4 flex-1 overflow-auto">
                    <TradingForm
                      collateral={collateral}
                      setCollateral={setCollateralFromInput}
                      sliderValue={sliderValue}
                      setSliderValue={setSliderFromUser}
                      leverage={leverage}
                      setLeverage={setLeverage}
                      orderType={orderType}
                      setOrderType={setOrderType}
                      marketPrice={marketPrice}
                      limitPrice={limitPrice}
                      setLimitPrice={setLimitPrice}
                      tpSlEnabled={tpSlEnabled}
                      setTpSlEnabled={setTpSlEnabled}
                      takeProfit={takeProfit}
                      setTakeProfit={setTakeProfit}
                      takeProfitMode={takeProfitMode}
                      setTakeProfitMode={setTakeProfitMode}
                      stopLoss={stopLoss}
                      setStopLoss={setStopLoss}
                      stopLossMode={stopLossMode}
                      setStopLossMode={setStopLossMode}
                      balance={balance}
                      chartInstrument={chartInstrument}
                      initialLimitPriceSetRef={initialLimitPriceSetRef}
                      handleResetToMidPrice={handleResetToMidPrice}
                      handleLongClick={handleLongClick}
                      handleShortClick={handleShortClick}
                      formatPrice={formatPrice}
                      computeTpFromPercent={computeTpFromPercent}
                      computeSlFromPercent={computeSlFromPercent}
                      getEntryPrice={getEntryPrice}
                      calculateLiquidationPrice={calculateLiquidationPrice}
                      calculateTradeSize={calculateTradeSize}
                      vTakerFee={vTakerFee}
                      maxLeverage={maxLeverage}
                      variant="desktop"
                    />
                  </div>

                  {/* Footer (anchored) */}
                  <div className="p-3 lg:p-4 border-t border-white/6">
                    <TradingButtons
                      estimatedFee={estimatedFee}
                      onLongClick={handleLongClick}
                      onShortClick={handleShortClick}
                      collateral={collateral}
                      leverage={leverage}
                      orderType={orderType}
                      limitPrice={limitPrice}
                      marketPrice={marketPrice}
                      calculateLiquidationPrice={calculateLiquidationPrice}
                      vTakerFee={vTakerFee}
                      longLoading={loadingSide === 'long'}
                      shortLoading={loadingSide === 'short'}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Trading Section - Only on small screens (below lg) */}
        <div className="lg:hidden mx-3 mb-4">
          <div className="broker-card">
            <div className="p-4">
              <div className="mb-4 pb-3 border-b border-white/6">
                <h3 className="text-lg font-semibold text-white font-sans">
                  Trade {chartInstrument.symbol}
                </h3>
              </div>

              <TradingForm
                collateral={collateral}
                setCollateral={setCollateralFromInput}
                sliderValue={sliderValue}
                setSliderValue={setSliderFromUser}
                leverage={leverage}
                setLeverage={setLeverage}
                orderType={orderType}
                setOrderType={setOrderType}
                marketPrice={marketPrice}
                limitPrice={limitPrice}
                setLimitPrice={setLimitPrice}
                tpSlEnabled={tpSlEnabled}
                setTpSlEnabled={setTpSlEnabled}
                takeProfit={takeProfit}
                setTakeProfit={setTakeProfit}
                takeProfitMode={takeProfitMode}
                setTakeProfitMode={setTakeProfitMode}
                stopLoss={stopLoss}
                setStopLoss={setStopLoss}
                stopLossMode={stopLossMode}
                setStopLossMode={setStopLossMode}
                balance={balance}
                chartInstrument={chartInstrument}
                initialLimitPriceSetRef={initialLimitPriceSetRef}
                handleResetToMidPrice={handleResetToMidPrice}
                handleLongClick={handleLongClick}
                handleShortClick={handleShortClick}
                formatPrice={formatPrice}
                computeTpFromPercent={computeTpFromPercent}
                computeSlFromPercent={computeSlFromPercent}
                getEntryPrice={getEntryPrice}
                calculateLiquidationPrice={calculateLiquidationPrice}
                calculateTradeSize={calculateTradeSize}
                vTakerFee={vTakerFee}
                maxLeverage={maxLeverage}
                variant="mobile"
              />
            </div>

            {/* Footer (anchored) */}
            <div className="p-4 border-t border-white/6">
              <TradingButtons
                estimatedFee={estimatedFee}
                onLongClick={handleLongClick}
                onShortClick={handleShortClick}
                collateral={collateral}
                leverage={leverage}
                orderType={orderType}
                limitPrice={limitPrice}
                marketPrice={marketPrice}
                calculateLiquidationPrice={calculateLiquidationPrice}
                vTakerFee={vTakerFee}
                longLoading={loadingSide === 'long'}
                shortLoading={loadingSide === 'short'}
              />
            </div>
          </div>
        </div>

        {/* Positions and Orders Tables - Hidden when agent sidebar is open */}
        {!agentSidebarOpen && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 lg:gap-4 mx-3 lg:mx-4 mb-3 lg:mb-4">
            {/* Open Positions */}
            <PositionsTable
              positions={positions}
              onClosePosition={closePosition}
              closingPositions={closingPositions}
              isCollapsed={tablesCollapsed}
              onToggleCollapse={() => setTablesCollapsed(!tablesCollapsed)}
            />

            {/* Open Orders */}
            <OrdersTable
              orders={orders}
              onCancelOrder={cancelOrder}
              cancellingOrders={cancellingOrders}
              isCollapsed={tablesCollapsed}
              onToggleCollapse={() => setTablesCollapsed(!tablesCollapsed)}
            />
          </div>
        )}
      </div>

      {/* Trade Confirmation Modal */}
      <TradeConfirmationModal
        isOpen={showConfirmation}
        onClose={() => {
          setShowConfirmation(false);
          setPendingTrade(null);
        }}
        onConfirm={handleConfirmTrade}
        side={pendingTrade?.side || "long"}
        symbol={chartInstrument?.symbol || ""}
        size={(() => {
          const entryPrice = orderType === "limit" ? limitPrice : marketPrice;
          return entryPrice
            ? calculateTradeSize(collateral, leverage, entryPrice)
            : 0;
        })()}
        leverage={leverage}
        price={orderType === "limit" ? limitPrice : marketPrice}
        orderType={orderType}
        loading={tradeLoading}
      />
    </main>
  );
}
