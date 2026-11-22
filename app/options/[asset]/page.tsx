"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { redirect } from "next/navigation";
import { useSearchParams, useRouter } from "next/navigation";
import OptionsWarningModal from "@/components/onboarding/OptionsWarningModal";
import OptionsWelcomePortal from "@/components/onboarding/OptionsWelcomePortal";
import OnboardingBanner from "@/components/onboarding/OnboardingBanner";
import Bridge from "@/components/onboarding/Onboarder";
import OptionsSidebar from "@/components/options/OptionsSidebar";
import ExpirationDatesBar from "@/components/options/ExpirationDatesBar";
import ChainView from "@/components/options/ChainView";
import AssetHeader from "@/components/options/AssetHeader";
import OptionDetailModal from "@/components/options/OptionDetailModal";
import OptionsOrdersTable from "@/components/options/OptionsOrdersTable";
import OptionsPositionsTable from "@/components/options/OptionsPositionsTable";
import { useUI } from '@/store/UIContext';
import { useSession } from "@/store/SessionContext";
import { useAccount } from 'wagmi';
import { TradingProvider } from "@/store/TradingContext";
import { getOptionPricing } from "@/services/blackScholes";
import { useOptionsOrders } from "@/hooks/useOptionsOrders";
import { cancelOptionsOrder } from "@/services/options";
// Charts removed for options per request
import { loadContractSizes, getContractSizeDynamic } from "@/services/contractSizeRegistry";

// Dynamically determine maximum fraction digits based on price magnitude
const getMaxFractionDigits = (price: number): number => {
  const log = Math.log10(Math.abs(price));
  const magnitude = Math.floor(log);
  return Math.max(2, Math.min(6, 6 - magnitude));
};

interface OptionsAssetConfig {
  symbol: string;
  display: string;
  name: string;
  pythId: string;
  description: string;
  category: string;
  popular?: boolean;
}

interface OptionsConfig {
  options: OptionsAssetConfig[];
  v: number;
}

// Load options assets from config file
let optionsConfigCache: OptionsConfig | null = null;

async function loadOptionsConfig(): Promise<OptionsConfig> {
  if (optionsConfigCache) return optionsConfigCache;

  try {
    const response = await fetch("/data/assets-options.json");
    if (!response.ok) throw new Error("Failed to load options config");
    const config = await response.json();
    
    // Add community markets
    try {
      const { getCommunityMarketsFromSubgraph } = await import('@/services/options');
      const communityMarkets = await getCommunityMarketsFromSubgraph();
      
      // Convert to OptionsAssetConfig format
      const communityOptionsAssets: OptionsAssetConfig[] = communityMarkets.map(market => ({
        symbol: market.symbol,
        display: market.display,
        name: market.name,
        pythId: market.pyth_id,
        description: market.description,
        category: market.category,
        popular: market.popular,
      }));
      
      // Create new config object to avoid mutating cached config
      const newConfig = {
        ...config,
        options: [...config.options, ...communityOptionsAssets]
      };
      
      optionsConfigCache = newConfig;
      return optionsConfigCache!;
    } catch (error) {
      console.warn('Failed to load community markets:', error);
      optionsConfigCache = config;
      return optionsConfigCache!;
    }
  } catch (error) {
    console.error("Error loading options config:", error);
    throw error; // Re-throw the error so the caller can handle it
  }
}

const VALID_ASSETS = ["BTC", "ETH", "SOL", "XRP", "BNB", "DOGE"];

interface OptionContract {
  strike: number;
  bid: number;
  mark: number;
  ask: number;
  lastPrice: number;
  volume: number;
  openInterest: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  impliedVolatility: number;
  breakEven: number;
  isITM: boolean;
  isATM: boolean;
  chanceOfProfit: number;
}

interface OptionChain {
  calls: OptionContract[];
  puts: OptionContract[];
}

// Generate option chain with Black-Scholes pricing (per contract)
const generateOptionChain = (
  symbol: string,
  currentPrice?: number,
  daysToExpiry: number = 30,
  contractSize?: number,
): OptionChain => {
  const S = currentPrice ?? 100;

  //
  // Expiry scaling factor
  //
  const expiryScale = (days: number) => {
    if (days <= 3) return 1.0;     // 0-3 DTE - same scaling
    if (days <= 7) return 1.2;     // weekly
    if (days <= 30) return 1.5;    // monthly
    if (days <= 90) return 2.0;    // quarterly
    if (days <= 180) return 3.0;   // half-year
    return 4.0;                    // LEAPS
  };

  const scale = expiryScale(daysToExpiry);

  //
  // 1. Dynamic “nice” increment based on spot
  //
  const roundToNice = (raw: number) => {
    const exp = Math.pow(10, Math.floor(Math.log10(raw)));
    const mant = raw / exp;
    const choices = [1, 2, 2.5, 5, 10];
    let best = choices[0];
    let bestDiff = Math.abs(mant - best);
    for (const c of choices.slice(1)) {
      const diff = Math.abs(mant - c);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = c;
      }
    }
    return best * exp;
  };

  // Base increment = 1% of spot, rounded nicely
  const baseInc = roundToNice(S * 0.01);

  // Band increments scale automatically with expiry
  const nearInc = baseInc * scale; // ±10%
  const midInc = baseInc * 2 * scale; // ±20–30%
  const farInc = baseInc * 5 * scale; // ±40–60%
  const wingInc = baseInc * 10 * scale; // ±80–100%

  //
  // 2. Symmetric offsets (universal, scaled by expiry)
  //
  const baseOffsets = [
    0, 0.01, 0.02, 0.03, 0.04, 0.05, 0.07, 0.1, 0.12, 0.15, 0.2, 0.25, 0.3, 0.4,
    0.5, 0.6, 0.8, 1.0,
  ];

  // Add more OTM offsets for longer expiries
  const additionalOffsets = daysToExpiry > 30 ? [1.2, 1.5, 2.0] : [];

  const offsets = [...baseOffsets, ...additionalOffsets];

  const scaledOffsets = offsets.map(o => o * scale);

  //
  // 3. Pick increment based on offset
  //
  const incForOffset = (off: number) => {
    if (off <= 0.1) return nearInc;
    if (off <= 0.25) return midInc;
    if (off <= 0.5) return farInc;
    return wingInc;
  };

  const roundToInc = (v: number, inc: number) => Math.round(v / inc) * inc;

  //
  // 4. Generate symmetric strikes
  //
  const rawStrikes = new Set<number>();

  for (const off of scaledOffsets) {
    const inc = incForOffset(off / scale); // Use original offset for increment selection

    const up = roundToInc(S * (1 + off), inc);
    const down = roundToInc(S * (1 - off), inc);

    if (up > 0) rawStrikes.add(up);
    if (down > 0) rawStrikes.add(down);
  }

  //
  // 5. Sort & find ATM
  //
  const strikes = Array.from(rawStrikes).sort((a, b) => a - b);

  let closestStrike = strikes[0];
  let minDiff = Math.abs(S - closestStrike);
  for (const strike of strikes) {
    const diff = Math.abs(S - strike);
    if (diff < minDiff) {
      minDiff = diff;
      closestStrike = strike;
    }
  }

  //
  // 6. Build calls + puts (your pricing logic unchanged)
  //
  const calls: OptionContract[] = strikes.map((strike) => {
    const isITM = strike < S;
    const isATM = strike === closestStrike;
    const bs = getOptionPricing(S, strike, daysToExpiry, true, symbol, contractSize);

    return {
      strike,
      bid: 0,
      mark: bs.pricePerContract,
      ask: 0,
      lastPrice: bs.pricePerContract,
      volume: 0,
      openInterest: 0,
      delta: bs.delta,
      gamma: bs.gamma,
      theta: bs.theta,
      vega: bs.vega,
      rho: bs.rho,
      impliedVolatility: bs.iv,
      breakEven: strike + bs.pricePerUnit,
      isITM,
      isATM,
      chanceOfProfit: Math.min(95, Math.max(5, Math.abs(bs.delta) * 100)),
    };
  });

  const puts: OptionContract[] = strikes.map((strike) => {
    const isITM = strike > S;
    const isATM = strike === closestStrike;
    const bs = getOptionPricing(S, strike, daysToExpiry, false, symbol, contractSize);

    return {
      strike,
      bid: 0,
      mark: bs.pricePerContract,
      ask: 0,
      lastPrice: bs.pricePerContract,
      volume: 0,
      openInterest: 0,
      delta: bs.delta,
      gamma: bs.gamma,
      theta: bs.theta,
      vega: bs.vega,
      rho: bs.rho,
      impliedVolatility: bs.iv,
      breakEven: strike - bs.pricePerUnit,
      isITM,
      isATM,
      chanceOfProfit: Math.min(95, Math.max(5, Math.abs(bs.delta) * 100)),
    };
  });

  return { calls, puts };
};

// Real-time price state management
interface LivePriceData {
  price: number;
  change: number;
  changePercent: number;
}

const getExpirationDates = () => {
  const now = new Date();
  const expirations = [];

  // Helper function to check if expiry has passed (08:00 UTC)
  const hasExpired = (expiryDate: Date) => {
    const expiryTime = new Date(expiryDate);
    expiryTime.setUTCHours(8, 0, 0, 0); // 08:00 UTC
    // If current time is past expiry time, it's expired
    return now.getTime() > expiryTime.getTime();
  };

  // Helper function to get the next Friday
  const getNextFriday = (fromDate: Date) => {
    const date = new Date(fromDate);
    const dayOfWeek = date.getDay();
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
    if (daysUntilFriday === 0 && date.getTime() > fromDate.getTime()) {
      date.setDate(date.getDate() + 7);
    } else {
      date.setDate(date.getDate() + daysUntilFriday);
    }
    return date;
  };

  // Helper function to get last Friday of month
  const getLastFridayOfMonth = (year: number, month: number) => {
    const lastDay = new Date(year, month + 1, 0);
    const dayOfWeek = lastDay.getDay();
    const daysToSubtract = (dayOfWeek - 5 + 7) % 7;
    lastDay.setDate(lastDay.getDate() - daysToSubtract);
    return lastDay;
  };

  // 1. Daily expiries for the next 3–5 days (0DTE to 4DTE), skipping weekends
  // ONLY include dates that haven't expired yet
  let dayCount = 0;
  let i = 0;
  while (expirations.length < 5 && i < 30) { // Safety limit
    const expiryDate = new Date(now);
    expiryDate.setDate(now.getDate() + i);
    const dayOfWeek = expiryDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Skip Sunday (0) and Saturday (6)
      if (!hasExpired(expiryDate)) {
        // Calculate actual days from now to expiry
        const daysFromNow = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        expirations.push({
          label: expiryDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          fullDate: expiryDate.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }),
          days: Math.max(0, daysFromNow),
          isDaily: true,
        });
        dayCount++;
      }
    }
    i++;
  }

  // 2. Weekly expiries every Friday (4–6 weeks out)
  const fourWeeksOut = new Date(now);
  fourWeeksOut.setDate(now.getDate() + 28);
  let currentFriday = getNextFriday(fourWeeksOut);
  for (let i = 0; i < 3; i++) {
    if (!hasExpired(currentFriday)) {
      const days = Math.ceil(
        (currentFriday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      expirations.push({
        label: currentFriday.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        fullDate: currentFriday.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
        days,
        isWeekly: true,
      });
    }
    currentFriday.setDate(currentFriday.getDate() + 7);
  }

  // 3. Monthly expiries (last Friday of each month, 3–6 months out)
  for (let i = 3; i <= 6; i++) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const lastFriday = getLastFridayOfMonth(
      targetDate.getFullYear(),
      targetDate.getMonth(),
    );
    if (!hasExpired(lastFriday)) {
      const days = Math.ceil(
        (lastFriday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      expirations.push({
        label: lastFriday.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        fullDate: lastFriday.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
        days,
        isMonthly: true,
      });
    }
  }

  return expirations;
};

// News and LP generators removed — UI simplified to use mid-market pricing

interface OptionContract {
  strike: number;
  bid: number;
  mark: number;
  ask: number;
  lastPrice: number;
  volume: number;
  openInterest: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  impliedVolatility: number;
  breakEven: number;
  isITM: boolean;
  isATM: boolean;
  chanceOfProfit: number;
}

interface OptionChain {
  calls: OptionContract[];
  puts: OptionContract[];
}

interface NewsItem {
  id: string;
  title: string;
  time: string;
  impact: "high" | "medium" | "low";
}

// Options Sidebar Component
// Options Sidebar Component

export default function OptionsPage() {
  const params = useParams();
  const assetParam = params.asset as string;
  const asset = assetParam?.toUpperCase();
  const [optionsConfig, setOptionsConfig] = useState<OptionsConfig | null>(
    null,
  );

  const { setGlobalLoading } = useUI();

  // Load options config on mount
  useEffect(() => {
    loadOptionsConfig().then((config) => {
      setOptionsConfig(config);
    });
  }, []);

  // Load contract sizes on mount
  useEffect(() => {
    loadContractSizes().catch((error) => {
      console.warn('Failed to load contract sizes:', error);
    });
  }, []);

  // Compute current asset config
  const currentAssetConfig = useMemo(() => {
    if (!optionsConfig || !assetParam) return null;
    return optionsConfig.options.find(opt => 
      opt.symbol === assetParam.toUpperCase() || opt.pythId === assetParam
    ) || null;
  }, [optionsConfig, assetParam]);

  // Compute contract size for current asset
  const contractSize = useMemo(() => {
    if (!currentAssetConfig) return undefined;
    return getContractSizeDynamic(currentAssetConfig.symbol, currentAssetConfig.pythId);
  }, [currentAssetConfig]);

  // Set global loading based on config loading
  useEffect(() => {
    setGlobalLoading(!optionsConfig);
  }, [optionsConfig, setGlobalLoading]);

  useEffect(() => {
    if (optionsConfig && !currentAssetConfig) {
      redirect("/options/BTC");
    }
  }, [optionsConfig, currentAssetConfig]);

  const router = useRouter();
  const { isConnected } = useAccount();
  const { isConnected: sessionConnected, channelAddress } = useSession();
  const [showBridge, setShowBridge] = useState(false);
  const { bridgeRequest, bridgeOpen, closeBridge, depositOptionsOpen, closeDepositOptions, openBridge, showToast } = useUI();
  const searchParams = useSearchParams();
  const expiryParam = searchParams.get("expiry");
  const initialExpiry = expiryParam ? parseInt(expiryParam) : 0;

  // Fetch options orders from subgraph
  const { orders: optionsOrders, loading: ordersLoading, refresh: refreshOrders } = useOptionsOrders(channelAddress || undefined);
  const [ordersCollapsed, setOrdersCollapsed] = useState(false);
  const [positionsCollapsed, setPositionsCollapsed] = useState(false);
  const [cancellingOrders, setCancellingOrders] = useState<Set<string>>(new Set());

  // Cancel order handler
  const handleCancelOrder = async (seriesId: string, orderId: string) => {
    if (!channelAddress) return;

    const orderKey = `${seriesId}-${orderId}`;
    setCancellingOrders(prev => new Set(prev).add(orderKey));

    try {
      const result = await cancelOptionsOrder({
        channelAddress: channelAddress as `0x${string}`,
        seriesId: seriesId as `0x${string}`,
        orderId: orderId as `0x${string}`,
        onSubmitted: () => {
          showToast('Cancel order submitted to relayer', 'info');
        },
        onSuccess: () => {
          showToast('Order cancelled successfully', 'success');
          // Wait 3 seconds for subgraph to index, then refresh orders
          setTimeout(() => refreshOrders(), 3000);
        },
        onError: (error) => {
          showToast(`Cancel order failed: ${error}`, 'error');
        },
      });

      if (!result.success) {
        showToast(`Cancel order failed: ${result.error}`, 'error');
      }
    } catch (error) {
      showToast(`Cancel order error: ${error}`, 'error');
    } finally {
      setCancellingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderKey);
        return newSet;
      });
    }
  };

  const [selectedOption, setSelectedOption] = useState<{
    type: "call" | "put";
    contract: OptionContract;
    side: "buy" | "sell";
  } | null>(null);
  const [quantity, setQuantity] = useState(1);


  // Watchlist state
  const [watchlist, setWatchlist] = useState<string[]>([]);

  // Expiry state
  const [selectedExpiry, setSelectedExpiry] = useState(initialExpiry);

  // Expiry scroll ref
  const expiryScrollRef = useRef<HTMLDivElement>(null);

  // Real-time price data state
  const [livePrices, setLivePrices] = useState<Map<string, LivePriceData>>(
    new Map(),
  );
  const [pricesLoading, setPricesLoading] = useState(true);
  const eventSourcesRef = useRef<Map<string, EventSource>>(new Map());
  const baseline24hRef = useRef<Map<string, number>>(new Map());
  const priceUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingPriceUpdatesRef = useRef<Map<string, LivePriceData>>(new Map());

  const batchPriceUpdate = useCallback(() => {
    setLivePrices((prev) => {
      const next = new Map(prev);
      pendingPriceUpdatesRef.current.forEach((data, symbol) => {
        next.set(symbol, data);
      });
      pendingPriceUpdatesRef.current.clear();
      return next;
    });
  }, []);

  // Handle bridgeRequest (one-time trigger)
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | null = null;
    if (bridgeRequest) {
      t = setTimeout(() => setShowBridge(true), 0);
      // clear the request so it doesn't repeatedly open
      closeBridge();
    }
    return () => { if (t) clearTimeout(t); };
  }, [bridgeRequest, closeBridge]);

  // Sync showBridge with bridgeOpen or depositOptionsOpen from UIContext
  useEffect(() => {
    if (bridgeOpen || depositOptionsOpen) {
      setShowBridge(true);
    }
    // Don't set to false when UI context states are false, to allow manual opening
  }, [bridgeOpen, depositOptionsOpen]);

  // Setup live price streaming and 24h baselines
  useEffect(() => {
    if (!optionsConfig) return;

    let mounted = true;

    const setupLivePrices = async () => {
      try {
        const priceMap = new Map<string, LivePriceData>();

        // Setup EventSource for each asset
        for (const opt of optionsConfig.options) {
          const cleanPythId = opt.pythId.replace("0x", "");
          const fullPythId = `0x${cleanPythId}`;

          // Fetch initial current price
          try {
            const currentUrl = `https://hermes.pyth.network/v2/updates/price/latest?ids[]=${fullPythId}&parsed=true`;
            const response = await fetch(currentUrl);
            if (response.ok) {
              const data = await response.json();
              if (data.parsed?.[0]?.price) {
                const priceData = data.parsed[0].price;
                const price =
                  parseFloat(priceData.price) * Math.pow(10, priceData.expo);
                if (Number.isFinite(price) && price > 0) {
                  priceMap.set(opt.symbol, {
                    price,
                    change: 0,
                    changePercent: 0,
                  });
                }
              }
            }
          } catch (error) {
            console.error(
              "Error fetching initial price for",
              opt.symbol,
              error,
            );
          }

          const streamUrl = `https://hermes.pyth.network/v2/updates/price/stream?ids[]=${fullPythId}&parsed=true`;

          const eventSource = new EventSource(streamUrl);
          eventSourcesRef.current.set(opt.symbol, eventSource);

          eventSource.onmessage = (event: MessageEvent) => {
            if (!mounted) return;
            try {
              let data: any;
              try {
                data = JSON.parse(event.data);
              } catch (parseErr) {
                console.error('[Options] Failed to parse price update:', parseErr, 'Data:', event.data);
                return;
              }
              if (data.parsed?.[0]?.price) {
                const priceData = data.parsed[0].price;
                const price =
                  parseFloat(priceData.price) * Math.pow(10, priceData.expo);
                if (!Number.isFinite(price) || price <= 0) return;

                // Get baseline for 24h change
                const baseline = baseline24hRef.current.get(opt.symbol);
                let change = 0;
                let changePercent = 0;

                if (baseline && baseline > 0) {
                  change = price - baseline;
                  changePercent = (change / baseline) * 100;
                }

                // Batch price updates
                pendingPriceUpdatesRef.current.set(opt.symbol, {
                  price,
                  change,
                  changePercent,
                });

                if (priceUpdateTimeoutRef.current) {
                  clearTimeout(priceUpdateTimeoutRef.current);
                }
                priceUpdateTimeoutRef.current = setTimeout(batchPriceUpdate, 100); // Update every 100ms
              }
            } catch (error) {
              console.error("Error parsing price update:", error);
            }
          };

          eventSource.onerror = (error) => {
            console.error("EventSource error for", opt.symbol, error);
          };

          // Fetch 24h baseline
          try {
            const now = Math.floor(Date.now() / 1000); // Pyth Benchmarks expects SECONDS
            const from = now - 24 * 60 * 60;
            const baselineUrl = `https://benchmarks.pyth.network/v2/updates/price/${from}?ids[]=${fullPythId}&parsed=true`;

            const response = await fetch(baselineUrl);
            if (response.ok) {
              const data = await response.json();
              if (data.parsed?.[0]?.price) {
                const baselineData = data.parsed[0].price;
                const baselinePrice =
                  parseFloat(baselineData.price) *
                  Math.pow(10, baselineData.expo);
                if (baselinePrice > 0) {
                  baseline24hRef.current.set(opt.symbol, baselinePrice);
                }
              }
            }
          } catch (error) {
            console.error("Error fetching baseline for", opt.symbol, error);
          }
        }

        setLivePrices(priceMap);
        setPricesLoading(false);
      } catch (error) {
        console.error("Error setting up live prices:", error);
        setPricesLoading(false);
      }
    };

    setupLivePrices();

    return () => {
      mounted = false;
      // Close all EventSources
      eventSourcesRef.current.forEach((eventSource) => {
        eventSource.close();
      });
      eventSourcesRef.current.clear();
      if (priceUpdateTimeoutRef.current) {
        clearTimeout(priceUpdateTimeoutRef.current);
      }
    };
  }, [optionsConfig]);

  // Use live price if available, otherwise show loading
  const stockData = livePrices.get(asset) || {
    price: 0,
    change: 0,
    changePercent: 0,
  };

  const expirationDates = useMemo(() => getExpirationDates(), []);

  const scrollLeft = () => {
    if (expiryScrollRef.current) {
      expiryScrollRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (expiryScrollRef.current) {
      expiryScrollRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  const updateExpiry = (newExpiry: number) => {
    setSelectedExpiry(newExpiry);
    const params = new URLSearchParams(searchParams.toString());
    params.set("expiry", newExpiry.toString());
    router.push(`/options/${asset}?${params.toString()}`, { scroll: false });
  };
  const optionChain = useMemo(() => {
    return generateOptionChain(asset, stockData.price, expirationDates[selectedExpiry]?.days || 30, contractSize);
  }, [asset, stockData.price, selectedExpiry, expirationDates, contractSize]);

  const daysToExpiry = expirationDates[selectedExpiry]?.days || 30;

  // Build spotPrices map (pythId → price) from livePrices (symbol → price) for OptionsPositionsTable
  const spotPrices = useMemo<Record<string, number>>(() => {
    if (!optionsConfig) return {};
    const map: Record<string, number> = {};
    for (const opt of optionsConfig.options) {
      const liveData = livePrices.get(opt.symbol);
      if (liveData && liveData.price > 0) {
        map[opt.pythId.toLowerCase()] = liveData.price;
      }
    }
    return map;
  }, [optionsConfig, livePrices]);

  // Keep the visible slice centered around ATM so we always show strikes above and below spot
  const windowedChain = useMemo(() => {
    // Larger window for longer expiries to show more strikes
    const baseWindowSize = 18;
    const extraStrikes = daysToExpiry > 30 ? Math.floor((daysToExpiry - 30) / 30) * 4 : 0;
    const windowSize = Math.min(baseWindowSize + extraStrikes, 40); // Cap at 40

    const atmIndex = optionChain.calls.findIndex((c) => c.isATM);
    const start = Math.max(0, atmIndex - Math.floor(windowSize / 2));
    const end = Math.min(optionChain.calls.length, start + windowSize);

    return {
      calls: optionChain.calls.slice(start, end),
      puts: optionChain.puts.slice(start, end),
    };
  }, [optionChain, daysToExpiry]);

  const formatPercent = (num: number) =>
    `${num >= 0 ? "+" : ""}${num.toFixed(2)}%`;


  // Show loading state while config loads
  if (!optionsConfig) {
    return (
      <TradingProvider>
        {null}
      </TradingProvider>
    );
  }

  return (
    <TradingProvider>
      <div className="h-screen flex flex-col overflow-hidden bg-broker-gradient">
        {!sessionConnected && (
          <OnboardingBanner onStartOnboarding={() => setShowBridge(true)} />
        )}
        <OptionsWarningModal
          onAcknowledge={() => {
            /* noop for now */
          }}
        />
        <OptionsWelcomePortal />

        <div className="flex flex-1 overflow-hidden">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block">
            <OptionsSidebar
              currentAsset={currentAssetConfig?.symbol || asset}
              config={optionsConfig}
              livePrices={livePrices}
            />
          </div>

          {/* Mobile Sidebar removed: header now provides mobile asset selector for options */}

          <div className="flex-1 overflow-auto">
            {/* Sticky Header */}
            <div className="border-b border-white/6 bg-broker-dark/95 backdrop-blur-md sticky top-0 z-50">
              <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                <AssetHeader
                  asset={currentAssetConfig?.symbol || asset}
                  stockData={stockData}
                  formatPercent={formatPercent}
                  getMaxFractionDigits={getMaxFractionDigits}
                />
              </div>
            </div>

            {/* Expiration Dates Bar */}
            <ExpirationDatesBar
              expirationDates={expirationDates}
              selectedExpiry={selectedExpiry}
              onSelectExpiry={updateExpiry}
              onScrollLeft={scrollLeft}
              onScrollRight={scrollRight}
            />

            {/* spacer */}
            <div className="h-2" />

            {/* Options Content */}
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              <ChainView
                calls={windowedChain.calls}
                puts={windowedChain.puts}
                spotPrice={stockData.price}
                getMaxFractionDigits={getMaxFractionDigits}
                onSelectOption={(type, contract, side) => {
                  setSelectedOption({ type, contract, side });
                }}
              />

              {/* Options Orders Table */}
              {channelAddress && (
                <div className="mt-4">
                  <OptionsOrdersTable
                    orders={optionsOrders}
                    onCancelOrder={handleCancelOrder}
                    cancellingOrders={cancellingOrders}
                    isCollapsed={ordersCollapsed}
                    onToggleCollapse={() => setOrdersCollapsed(!ordersCollapsed)}
                    loading={ordersLoading}
                  />
                </div>
              )}

              {/* Options Positions Table */}
              {channelAddress && (
                <div className="mt-4">
                  <OptionsPositionsTable
                    spotPrices={spotPrices}
                    isCollapsed={positionsCollapsed}
                    onToggleCollapse={() => setPositionsCollapsed(!positionsCollapsed)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showBridge && (
        <Bridge isOpen={showBridge} onClose={() => setShowBridge(false)} />
      )}

      {selectedOption && currentAssetConfig && (
        <OptionDetailModal
          asset={currentAssetConfig.symbol || asset}
          type={selectedOption.type}
          contract={selectedOption.contract}
          stockPrice={stockData.price}
          expiration={expirationDates[selectedExpiry]}
          quantity={quantity}
          setQuantity={setQuantity}
          onClose={() => setSelectedOption(null)}
          initialSide={selectedOption.side}
          pythPriceId={currentAssetConfig.pythId as `0x${string}` | undefined}
          contractSize={contractSize}
          expiryTimestamp={(() => {
            const exp = expirationDates[selectedExpiry];
            if (!exp) return undefined;
            const now = new Date();
            const expiryDate = new Date(now);
            expiryDate.setDate(now.getDate() + (exp.days || 0));
            expiryDate.setUTCHours(8, 0, 0, 0);
            return Math.floor(expiryDate.getTime() / 1000);
          })()}
        />
      )}
    </TradingProvider>
  );
}
