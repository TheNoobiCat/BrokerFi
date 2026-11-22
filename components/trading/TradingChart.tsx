"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Head from "next/head";
import { useTradingContext } from "@/store/TradingContext";
import { PythDatafeed } from "@/services/pyth/PythDatafeed";
import type { SymbolInfo, Period, ChartPro } from "@klinecharts/pro";

interface TradingChartProps {
  symbol: string;
  priceId: string;
  onPriceUpdate?: (price: number) => void;
  onResizeTrigger?: number; // Trigger value that changes when resize is needed
}

export default function TradingChart({
  symbol,
  priceId,
  onPriceUpdate,
  onResizeTrigger,
}: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<ChartPro | null>(null);
  const datafeedRef = useRef<PythDatafeed | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSymbol, setCurrentSymbol] = useState<SymbolInfo | null>(null);
  const [lastInitializedSymbol, setLastInitializedSymbol] =
    useState<string>("");
  const initializingRef = useRef(false);
  const mountedRef = useRef(true);
  const [pageTitle, setPageTitle] = useState("BrokerFi"); // State for dynamic title
  const { positions, orders } = useTradingContext();
  const overlaysRef = useRef<Record<string, any>>({}); // Store the actual line objects
  const lastPositionsRef = useRef<string>("");
  const lastOrdersRef = useRef<string>("");

  // Memoize periods to prevent recreating on every render
  const periods: Period[] = useMemo(() => {
    const isFxPair = ["EURUSD", "GBPUSD", "USDJPY"].includes(symbol);

    const allPeriods = [
      { type: "minute" as const, span: 1, text: "1m" },
      { type: "minute" as const, span: 5, text: "5m" },
      { type: "minute" as const, span: 15, text: "15m" },
      { type: "hour" as const, span: 1, text: "1H" },
      { type: "hour" as const, span: 4, text: "4H" },
    ];

    // Remove 1m for FX pairs
    return isFxPair ? allPeriods.filter((p) => p.text !== "1m") : allPeriods;
  }, [symbol]);

  // Memoize the stable onPriceUpdate callback
  const stableOnPriceUpdate = useCallback(
    (price: number) => {
      if (onPriceUpdate) {
        onPriceUpdate(price);
      }

      // Update browser title with live price directly
      if (currentSymbol) {
        const formattedPrice = price.toFixed(currentSymbol.pricePrecision || 2);
        const newTitle = `${formattedPrice} - ${currentSymbol.shortName} | BrokerFi`;
        setPageTitle(newTitle);
        // Also set directly to ensure it works
        if (typeof document !== "undefined") {
          document.title = newTitle;
        }
      }
    },
    [onPriceUpdate, currentSymbol],
  );

  // Set initial title when component mounts or symbol changes
  useEffect(() => {
    if (currentSymbol) {
      const newTitle = `${currentSymbol.shortName} | BrokerFi`;
      setPageTitle(newTitle);
      // Also set directly to ensure it works
      if (typeof document !== "undefined") {
        document.title = newTitle;
      }
    } else {
      setPageTitle("BrokerFi");
      if (typeof document !== "undefined") {
        document.title = "BrokerFi";
      }
    }
  }, [currentSymbol]);

  useEffect(() => {
    mountedRef.current = true;

    const initChart = async () => {
      if (
        !containerRef.current ||
        initializingRef.current ||
        !mountedRef.current
      ) {
        return;
      }

      if (lastInitializedSymbol === symbol && chartInstance.current) {
        return;
      }

      if (chartInstance.current && lastInitializedSymbol !== symbol) {
        chartInstance.current = null;

        // Clear the previous price callback when switching symbols
        if (datafeedRef.current) {
          datafeedRef.current.clearPriceUpdateCallback();
        }

        if (containerRef.current) {
          containerRef.current.innerHTML = "";
        }
      }

      const symbolToInit = symbol;
      setLastInitializedSymbol(symbolToInit);

      initializingRef.current = true;

      try {
        if (!mountedRef.current) return;
        setIsLoading(true);
        setError(null);

        if (!datafeedRef.current) {
          datafeedRef.current = new PythDatafeed();
        }

        // Try exact symbol first, then fallbacks (append USDT/USD) for crypto base symbols
        let symbols = await datafeedRef.current.searchSymbols(symbol);
        let symbolInfo = symbols.find((s) => s.ticker === symbol);

        if (!symbolInfo) {
          const candidates = [];
          if (!/USDT$/.test(symbol)) {
            candidates.push(`${symbol}USDT`, `${symbol}USD`);
          }
          candidates.push(symbol.replace("/", ""), symbol.toUpperCase());

          for (const cand of candidates) {
            try {
              symbols = await datafeedRef.current.searchSymbols(cand);
              symbolInfo = symbols.find((s) => s.ticker === cand);
              if (symbolInfo) break;
            } catch {}
          }
        }

        if (!symbolInfo) {
          // Instead of throwing error, show a more helpful message
          if (mountedRef.current) {
            setError(
              `Chart data for ${symbol} is currently unavailable. This asset may have limited data coverage. Please try another asset or check back later.`,
            );
            setIsLoading(false);
          }
          return;
        }

        if (!mountedRef.current) return;
        setCurrentSymbol(symbolInfo);

        // Set the price update callback AFTER currentSymbol is available
        if (datafeedRef.current) {
          datafeedRef.current.setPriceUpdateCallback(
            (price: number, ticker: string) => {
              // Only update title if this is the current symbol to avoid interference
              if (ticker === symbol) {
                // Find the symbol info for this ticker from the datafeed
                const symbolData = datafeedRef.current?.searchSymbols(ticker);
                symbolData?.then((symbols) => {
                  const symbolInfo = symbols.find((s) => s.ticker === ticker);
                  if (symbolInfo) {
                    const formattedPrice = price.toFixed(
                      symbolInfo.pricePrecision || 2,
                    );
                    const newTitle = `${formattedPrice} - ${symbolInfo.shortName} | BrokerFi`;
                    setPageTitle(newTitle);
                    if (typeof document !== "undefined") {
                      document.title = newTitle;
                    }
                  }
                });

                // Also call the original callback
                if (onPriceUpdate) {
                  onPriceUpdate(price);
                }
              }
            },
          );
        }

        // Dynamically import the chart library and its CSS on the client only.
        // This prevents server-side evaluation that accesses `document` and fixes
        // "document is not defined" during SSR/Turbopack builds.
        let KLineChartPro = null;
        if (typeof window !== "undefined") {
          const mod = await import("@klinecharts/pro");
          // import CSS dynamically on the client (TS may not have typings for CSS imports)
          try {
            await import("@klinecharts/pro/dist/klinecharts-pro.css");
          } catch {
            // CSS import failed - non-critical
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          KLineChartPro = (mod as any).KLineChartPro;
        }

        if (containerRef.current) {
          const container = containerRef.current;
          container.style.width = "100%";
          container.style.height = "100%";
          container.style.position = "relative";
          container.style.overflow = "hidden";

          container.innerHTML = "";
        }

        const watermarkElement = document.createElement("div");
        // Use CSS utility classes (tailwind-style) to position the watermark
        // in the bottom-left using flex. We'll append this as a child of the
        // chart container so it stays within the chart bounds and is not
        // affected by the chart library's own watermark centering.
        watermarkElement.className =
          "absolute left-3 bottom-3 flex items-center gap-4 pointer-events-none select-none opacity-30 z-20";
        watermarkElement.innerHTML = `
          <div class="flex items-center gap-3">
                <div
      class="inline-block border border-white/10 shrink-0"
      style="padding: ${8}px; border-radius: ${12}px;"
    >
      <img
        class="brightness-0 invert"
        src="/logo/BrokerfiLogo.svg"
        alt="Brokerfi Logo"
        style="width: ${20}px; height: ${20}px;"
      />
    </div>
            <div class="hidden sm:flex flex-col leading-tight">
              <span class="text-xl font-bold text-white font-sans">BrokerFi</span>
              <span class="text-sm font-medium text-white/80 font-sans">Perps</span>
            </div>
          </div>
        `;

        if (!KLineChartPro) {
          throw new Error("KLineChartPro failed to load on the client");
        }

        // Note: we no longer register klinecharts overlay templates here.
        // The library wrapper does not expose `registerOverlay` reliably,
        // so we use a DOM fallback for overlays (horizontal lines + labels).

        const chart = new KLineChartPro({
          container: containerRef.current,
          symbol: symbolInfo,
          period: periods[2], // 15m default for better data availability
          periods,
          datafeed: datafeedRef.current,
          // Do not hand the watermark to the chart library (it may re-center
          // or reparent it). We'll append the watermark into the container
          // after the chart is initialized so we control its positioning.
          watermark: "",
          theme: "dark",
          timezone: "UTC",
          locale: "en-US",
          subIndicators: [], // No volume indicators
          drawingBarVisible: false,
          styles: {
            grid: {
              show: true,
              horizontal: {
                show: true,
                size: 1,
                color: "rgba(255, 255, 255, 0.08)",
              },
              vertical: {
                show: true,
                size: 1,
                color: "rgba(255, 255, 255, 0.08)",
              },
            },
            candle: {
              bar: {
                upColor: "#00C896",
                downColor: "#FF4757",
                noChangeColor: "#888888",
              },
            },
            separator: {
              size: 1,
              color: "rgba(255, 255, 255, 0.1)",
            },
            xAxis: {
              axisLine: {
                color: "rgba(255, 255, 255, 0.15)",
              },
              tickText: {
                color: "rgba(255, 255, 255, 0.7)",
                family: "Inter",
              },
            },
            yAxis: {
              axisLine: {
                color: "rgba(255, 255, 255, 0.15)",
              },
              tickText: {
                color: "rgba(255, 255, 255, 0.7)",
                family: "Inter",
              },
            },
          },
        });

        if (!mountedRef.current) {
          return;
        }

        chartInstance.current = chart;

        // No overlay registration attempted: we'll use the DOM fallback when needed.

        // Append our watermark element inside the chart container so it's
        // anchored to the bottom-left using the utility classes we applied.
        if (containerRef.current && watermarkElement) {
          // If the library injected its own watermark container, ensure our
          // element is placed after it so it sits on top visually.
          containerRef.current.appendChild(watermarkElement);
        }

        // Ensure all logic aligns with the existing price feed subscription
        setTimeout(() => {
          if (mountedRef.current) {
            setIsLoading(false);
          }
        }); // Correctly close the setTimeout function
      } catch {
        // Initialization error - non-critical
      } finally {
        initializingRef.current = false;
      }
    }; // Ensure proper closure of the initChart function

    initChart(); // Invoke the initChart function when the component mounts
  }, [
    symbol,
    priceId,
    periods,
    stableOnPriceUpdate,
    lastInitializedSymbol,
    onPriceUpdate,
  ]);

  // Handle chart resizing when window resizes or container size changes
  useEffect(() => {
    if (!chartInstance.current) return;

    const handleResize = () => {
      if (chartInstance.current && containerRef.current) {
        // Get the current container dimensions
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          // Call the chart's resize method if it exists
          if (typeof chartInstance.current.resize === "function") {
            chartInstance.current.resize();
          }
        }
      }
    };

    // Initial resize call
    const timeoutId = setTimeout(handleResize, 100);

    // Listen for window resize events
    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
    };
  }, [symbol]); // Re-run when symbol changes (new chart instance)

  // Handle resize triggers from parent component (e.g., sidebar animations)
  useEffect(() => {
    if (onResizeTrigger !== undefined && onResizeTrigger > 0) {
      const handleResize = () => {
        if (chartInstance.current && containerRef.current) {
          // Get the current container dimensions
          const rect = containerRef.current.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            // Call the chart's resize method if it exists
            if (typeof chartInstance.current.resize === "function") {
              chartInstance.current.resize();
            }
          }
        }
      };

      // Trigger resize after a short delay to allow animations to complete
      const timeoutId = setTimeout(handleResize, 250);
      return () => clearTimeout(timeoutId);
    }
  }, [onResizeTrigger]);

  // Create overlays for positions and orders using the forked klinechart-pro orderLine overlay
  useEffect(() => {
    const chartPro = chartInstance.current;
    if (!chartPro) return;

    // Get the ProChart instance which has createOrderLine method
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const proChart = (chartPro as any).getInstanceApi?.();
    if (!proChart) return;

    // Create stable keys for comparison
    const positionsKey = JSON.stringify(
      positions.map((p) => ({
        id: p.id,
        price: p.openPrice,
        tp: p.takeProfit,
        sl: p.stopLoss,
      })),
    );
    const ordersKey = JSON.stringify(
      orders.map((o) => ({
        id: o.id,
        price: o.price,
        tp: o.takeProfit,
        sl: o.stopLoss,
      })),
    );

    // Skip if nothing changed
    if (
      positionsKey === lastPositionsRef.current &&
      ordersKey === lastOrdersRef.current
    ) {
      return;
    }

    lastPositionsRef.current = positionsKey;
    lastOrdersRef.current = ordersKey;

    // Helper to create price line overlays
    const safeCreateOverlay = (
      key: string,
      price: number | undefined,
      text: string,
      quantity: string,
      color: string,
      hideCancelButton = true,
      movable = true,
    ) => {
      try {
        if (!Number.isFinite(price as number)) {
          return;
        }

        if (!overlaysRef.current[key]) {
          const overlayConfig = {
            name: "priceLine",
            id: key,
            points: [{ value: price }],
            lock: true, // Always lock to prevent deletion/movement
            visible: true,
            styles: {
              line: {
                color: color,
                size: 2,
                style: "solid",
              },
              text: {
                color: "#ffffff",
                size: 12,
                family: "Arial",
                weight: "bold",
                content: text,
              },
            },
          };

          const createdId = proChart.createOverlay?.(
            overlayConfig,
            "candle_pane",
          );
          if (createdId) {
            overlaysRef.current[key] = createdId;
          }
        } else {
          const overlayId = overlaysRef.current[key];
          proChart.overrideOverlay?.({
            id: overlayId,
            points: [{ value: price }],
            lock: true,
            styles: {
              line: { color: color, size: 2 },
              text: { content: text, color: "#ffffff", weight: "bold" },
            },
          });
        }
      } catch (e) {
        console.error(`Error creating overlay for ${key}:`, e);
      }
    };

    const safeRemoveOverlay = (key: string) => {
      try {
        if (overlaysRef.current[key]) {
          const overlayId = overlaysRef.current[key];
          proChart.removeOverlay?.({ id: overlayId });
        }
      } catch {}
      delete overlaysRef.current[key];
    };

    // Build desired overlays map
    const desiredKeys: Record<string, boolean> = {};

    // Positions: create price line overlays for entry, TP, and SL
    positions.forEach((pos) => {
      // Entry line
      const keyEntry = `pos-entry-${pos.id}`;
      desiredKeys[keyEntry] = true;
      const entryColor = pos.type === "long" ? "#00C896" : "#FF4757";
      safeCreateOverlay(
        keyEntry,
        pos.openPrice,
        pos.type.toUpperCase(),
        pos.size.toString(),
        entryColor,
        true,
        false,
      );

      // Take Profit line
      if (pos.takeProfit) {
        const keyTp = `pos-tp-${pos.id}`;
        desiredKeys[keyTp] = true;
        safeCreateOverlay(
          keyTp,
          pos.takeProfit,
          "TP",
          "",
          "#32D74B",
          true,
          false,
        ); // Bright green
      }

      // Stop Loss line
      if (pos.stopLoss) {
        const keySl = `pos-sl-${pos.id}`;
        desiredKeys[keySl] = true;
        safeCreateOverlay(
          keySl,
          pos.stopLoss,
          "SL",
          "",
          "#FF3B30",
          true,
          false,
        ); // Bright red
      }

      // Liquidation line
      if (pos.liquidationPrice) {
        const keyLiq = `pos-liq-${pos.id}`;
        desiredKeys[keyLiq] = true;
        safeCreateOverlay(
          keyLiq,
          pos.liquidationPrice,
          "LIQ",
          "",
          "#FFA500",
          true,
          false,
        ); // Orange
      }
    });

    // Orders: create price line overlays for pending limit orders
    orders.forEach((o) => {
      const keyOrd = `ord-${o.id}`;
      desiredKeys[keyOrd] = true;
      if (o.orderType === "limit" && o.price !== undefined) {
        const orderColor = o.type === "long" ? "#34D399" : "#F87171"; // Different shades
        safeCreateOverlay(
          keyOrd,
          o.price,
          `${o.type.toUpperCase()} ORDER`,
          o.size.toString(),
          orderColor,
        );
      }
    });

    Object.keys(overlaysRef.current).forEach((k) => {
      if (!desiredKeys[k]) {
        safeRemoveOverlay(k);
      }
    });
  }, [positions, orders, currentSymbol?.pricePrecision]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (chartInstance.current) {
        chartInstance.current = null;
      }
      if (datafeedRef.current) {
        datafeedRef.current.clearPriceUpdateCallback();
        datafeedRef.current = null;
      }
      initializingRef.current = false;
    };
  }, []);

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-surface/30 rounded-lg border border-white/10">
        <div className="text-center">
          <div className="text-red-400 mb-2">⚠️ Chart Error</div>
          <div className="text-sm text-white/60 font-sans">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-primary text-white border border-primary text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <div className="relative w-full h-full bg-transparent">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/30 z-10 rounded-lg">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
              <div className="text-sm text-white/60 font-sans">
                Loading {currentSymbol?.shortName || symbol} chart...
              </div>
              <div className="text-xs text-white/40 font-sans mt-1">
                Connecting to Pyth Network...
              </div>
            </div>
          </div>
        )}

        <div
          ref={containerRef}
          className="w-full h-full bg-transparent"
          style={{
            minHeight: "320px",
            height: "100%",
            position: "relative",
            overflow: "hidden",
          }}
        />
      </div>
    </>
  );
}
