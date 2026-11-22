"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { FaTimes, FaMinus, FaPlus } from "react-icons/fa";
import {
  Area,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from "recharts";
import Portal from "@/components/ui/Portal";
import { useSession } from "@/store/SessionContext";
import { useUI } from "@/store/UIContext";
import {
  createOptionsOrder,
  getAccountBalances,
  parsePrice18,
  type AccountBalances,
} from "@/services/options";
import { getContractSize, estimateMarginRequired, getFeePerContract } from "@/services/blackScholes";

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

interface OptionDetailModalProps {
  asset: string;
  type: "call" | "put";
  contract: OptionContract;
  stockPrice: number;
  expiration: { label: string; fullDate: string; days: number };
  quantity: number;
  setQuantity: (q: number) => void;
  onClose: () => void;
  initialSide?: "buy" | "sell";
  pythPriceId?: `0x${string}`;
  expiryTimestamp?: number;
  contractSize?: number;
}

export default function OptionDetailModal({
  asset,
  type,
  contract,
  stockPrice,
  expiration,
  quantity,
  setQuantity,
  onClose,
  initialSide = "buy",
  pythPriceId,
  expiryTimestamp,
  contractSize,
}: OptionDetailModalProps) {
  const { channelAddress } = useSession();
  const { showToast } = useUI();

  const contractSizeValue = contractSize ?? getContractSize(asset);

  /* ── View state ── */
  const [activeTab, setActiveTab] = useState<"summary" | "greeks" | "details">("summary");
  const [selectedSide, setSelectedSide] = useState<"buy" | "sell">(initialSide);

  /* ── Order state ── */
  const [limitPrice, setLimitPrice] = useState("");
  const [putCashSecured, setPutCashSecured] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  /* ── Margin account ── */
  const [balances, setBalances] = useState<AccountBalances | null>(null);

  useEffect(() => {
    if (!channelAddress) return;
    let cancelled = false;
    getAccountBalances(channelAddress as `0x${string}`).then((b) => {
      if (!cancelled) setBalances(b);
    });
    return () => { cancelled = true; };
  }, [channelAddress]);

  const refreshBalances = useCallback(async () => {
    if (!channelAddress) return;
    const b = await getAccountBalances(channelAddress as `0x${string}`);
    setBalances(b);
  }, [channelAddress]);

  /* ── Pricing calculations ── */
  const markPerContract = contract.mark > 0 ? contract.mark : 0;
  const isCall = type === "call";
  const isLong = selectedSide === "buy";
  const positionSign = isLong ? 1 : -1;

  const breakEven = contract.breakEven ?? contract.strike;

  const pnlAtPrice = useCallback(
    (price: number) => {
      const intrinsic = isCall
        ? Math.max(0, price - contract.strike)
        : Math.max(0, contract.strike - price);
      const premiumPerUnit = markPerContract / contractSizeValue;
      return positionSign * ((intrinsic - premiumPerUnit) * contractSizeValue * quantity);
    },
    [isCall, contract.strike, positionSign, markPerContract, contractSizeValue, quantity],
  );

  const currentPnl = pnlAtPrice(stockPrice);
  const totalCost = markPerContract * quantity;

  /* ── Chart data (stabilized to prevent SSE flicker) ── */
  const stablePrice = useMemo(
    () => Math.round(stockPrice * 100) / 100,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [Math.round(stockPrice * 100)],
  );

  const chartData = useMemo(() => {
    const center = stablePrice > 0 ? stablePrice : contract.strike;
    const span = Math.max(
      center * 0.25,
      Math.abs(center - contract.strike) * 1.2,
      Math.abs(center - breakEven) * 1.2,
      markPerContract * 8,
      5,
    );
    const start = Math.max(0.01, center - span);
    const end = center + span;
    const steps = 48;
    const delta = (end - start) / steps;
    return Array.from({ length: steps + 1 }, (_, i) => {
      const price = start + delta * i;
      return { price, pnl: pnlAtPrice(price) };
    });
  }, [stablePrice, contract.strike, breakEven, markPerContract, pnlAtPrice]);

  const pnlDomain = useMemo(() => {
    const vals = chartData.map((d) => d.pnl);
    const absMax = Math.max(50, Math.max(...vals.map((v) => Math.abs(v))));
    return [-absMax * 1.1, absMax * 1.1] as [number, number];
  }, [chartData]);

  /* ── Moneyness ── */
  const moneyness = (() => {
    if (Math.abs(stockPrice - contract.strike) / stockPrice < 0.01) return "ATM";
    if (isCall) return stockPrice > contract.strike ? "ITM" : "OTM";
    return stockPrice < contract.strike ? "ITM" : "OTM";
  })();

  const moneynessColor =
    moneyness === "ITM" ? "text-green-400" : moneyness === "ATM" ? "text-blue-400" : "text-gray-400";

  /* ── Margin estimation ── */
  const pricePerContract = limitPrice ? Number(limitPrice) : markPerContract;
  const pricePerUnit = pricePerContract / contractSizeValue;
  const fee = getFeePerContract();

  const estimatedMargin = useMemo(() => {
    return estimateMarginRequired(
      pricePerUnit,
      stockPrice,
      contract.strike,
      contractSizeValue,
      quantity,
      isCall,
      isLong,
      putCashSecured,
    ) + (isLong ? fee * quantity : 0);
  }, [pricePerUnit, stockPrice, contract.strike, contractSizeValue, quantity, isCall, isLong, putCashSecured, fee]);

  const freeCollateral = balances
    ? Number(balances.freeCollateral > 0n ? balances.freeCollateral : 0n) / 1e18
    : 0;

  /* ── Order submission ── */
  const handleSubmitOrder = async () => {
    if (!channelAddress) {
      setErrorMessage("Connect your session first");
      showToast("Connect your session first", "error");
      return;
    }
    if (!pythPriceId) {
      setErrorMessage("Price feed not available");
      showToast("Price feed not available", "error");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const strikeBigInt = parsePrice18(contract.strike.toString());
      // Convert per-contract price to per-unit-of-underlying for contract submission
      const pricePerContract = limitPrice ? Number(limitPrice) : markPerContract;
      const contractSizeValue = contractSize ?? getContractSize(asset);
      const pricePerUnit = pricePerContract / contractSizeValue;
      const priceBigInt = parsePrice18(pricePerUnit.toString());
      const expiry = expiryTimestamp || Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

      const result = await createOptionsOrder({
        channelAddress: channelAddress as `0x${string}`,
        underlyingPriceFeedId: pythPriceId,
        isCall,
        isLong,
        strikePrice: strikeBigInt,
        expiry,
        amount: quantity,
        limitPricePerOption: priceBigInt,
        putCashSecured,
        onSubmitted: () => showToast("Order submitted to relayer", "info"),
        onSuccess: () => {
          showToast("Order placed successfully!", "success");
          setIsSubmitting(false);
          refreshBalances();
          onClose(); // Close modal on success
        },
        onError: (err: Record<string, string>) => {
          const errorMsg = err?.detail || err?.error || String(err);
          setErrorMessage(errorMsg);
          showToast(`Order failed: ${errorMsg}`, "error");
          setIsSubmitting(false);
        },
      });

      if (!result.success) {
        const errorMsg = result.error || "Order failed";
        setErrorMessage(errorMsg);
        showToast(`Order failed: ${errorMsg}`, "error");
        setIsSubmitting(false);
      }
    } catch (err) {
      const errorMsg = String(err);
      setErrorMessage(errorMsg);
      showToast(`Order error: ${errorMsg}`, "error");
      setIsSubmitting(false);
    }
  };

  /* ── Stable reference line labels (prevent re-creation each render) ── */
  const spotLabel = useMemo(() => ({
    value: "Current",
    position: "insideTopRight" as const,
    fill: "#fbbf24",
    fontSize: 10,
    fontWeight: "bold" as const,
  }), []);

  const beLabel = useMemo(() => ({
    value: "B/E",
    position: "insideTopLeft" as const,
    fill: "#22c55e",
    fontSize: 10,
  }), []);

  const strikeLabel = useMemo(() => ({
    value: "Strike",
    position: "insideBottomRight" as const,
    fill: "#3b82f6",
    fontSize: 10,
  }), []);

  return (
    <Portal>
      <div className="fixed inset-0 z-9999 flex items-center justify-center">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

        {/* Modal */}
        <div className="relative w-full max-w-275 max-h-[92vh] mx-4 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col">

          {/* ─── Header ─── */}
          <div className="px-6 py-5 border-b border-white/8 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-bold text-white">
                      ${contract.strike} {type.toUpperCase()}
                    </h2>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${moneynessColor} bg-white/5`}>
                      {moneyness}
                    </span>
                  </div>
                  <p className="text-white/50 text-sm">
                    {asset} &middot; {expiration.fullDate} &middot; {expiration.days}d
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Side Toggle */}
                <div className="flex bg-white/6 rounded-lg p-0.5">
                  <button
                    onClick={() => setSelectedSide("buy")}
                    className={`px-5 py-2 rounded-md text-sm font-semibold transition-all ${
                      selectedSide === "buy"
                        ? "bg-green-500 text-black shadow-lg shadow-green-500/20"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => setSelectedSide("sell")}
                    className={`px-5 py-2 rounded-md text-sm font-semibold transition-all ${
                      selectedSide === "sell"
                        ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    Sell
                  </button>
                </div>

                <button
                  onClick={onClose}
                  className="text-white/40 hover:text-white p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <FaTimes size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* ─── Body: Two Columns ─── */}
          <div className="flex-1 overflow-hidden flex flex-col lg:flex-row min-h-0">

            {/* ── Left: Info + Chart ── */}
            <div className="flex-1 overflow-y-auto min-w-0">

              {/* Position Summary */}
              <div className="px-6 py-5 border-b border-white/6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-white/50 text-xs mb-1">Mark Price</div>
                    <div className="text-3xl font-bold font-mono text-white">${markPerContract.toFixed(2)}</div>
                    <div className="text-white/40 text-xs mt-1">per contract</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white/50 text-xs mb-1">{asset}</div>
                    <div className="text-white font-mono font-semibold text-lg">${stockPrice.toFixed(2)}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center bg-white/3 rounded-lg py-3">
                    <div className="text-white/50 text-xs mb-1">Current P&L</div>
                    <div className={`text-lg font-bold font-mono ${currentPnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {currentPnl >= 0 ? "+" : ""}${currentPnl.toFixed(0)}
                    </div>
                  </div>
                  <div className="text-center bg-white/3 rounded-lg py-3">
                    <div className="text-white/50 text-xs mb-1">Break Even</div>
                    <div className="text-white text-lg font-bold font-mono">${breakEven.toFixed(2)}</div>
                  </div>
                  <div className="text-center bg-white/3 rounded-lg py-3">
                    <div className="text-white/50 text-xs mb-1">Win Chance</div>
                    <div className="text-green-400 text-lg font-bold">{contract.chanceOfProfit.toFixed(0)}%</div>
                  </div>
                </div>
              </div>

              {/* Payoff Chart */}
              <div className="px-6 py-4 border-b border-white/6">
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="pnlArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={isLong ? "#22c55e" : "#ef4444"} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={isLong ? "#22c55e" : "#ef4444"} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#ffffff0d" strokeDasharray="3 3" />
                      <XAxis
                        dataKey="price"
                        tickFormatter={(v: number) => `$${Number(v).toFixed(0)}`}
                        stroke="#ffffff40"
                        tick={{ fill: "#ffffff60", fontSize: 10 }}
                        axisLine={false}
                      />
                      <YAxis
                        domain={pnlDomain}
                        tickFormatter={(v: number) => `$${Number(v).toFixed(0)}`}
                        stroke="#ffffff40"
                        tick={{ fill: "#ffffff60", fontSize: 10 }}
                        axisLine={false}
                      />
                      {/* Zero line */}
                      <ReferenceLine y={0} stroke="#ffffff30" strokeDasharray="4 4" />
                      {/* Current price */}
                      <ReferenceLine
                        x={stablePrice}
                        stroke="#fbbf24"
                        strokeDasharray="4 4"
                        label={spotLabel}
                        ifOverflow="extendDomain"
                      />
                      {/* Break even */}
                      <ReferenceLine
                        x={breakEven}
                        stroke="#22c55e"
                        strokeDasharray="3 3"
                        label={beLabel}
                        ifOverflow="extendDomain"
                      />
                      {/* Strike */}
                      <ReferenceLine
                        x={contract.strike}
                        stroke="#3b82f6"
                        strokeDasharray="2 2"
                        label={strikeLabel}
                        ifOverflow="extendDomain"
                      />
                      <Area
                        type="monotone"
                        dataKey="pnl"
                        stroke="none"
                        fill="url(#pnlArea)"
                        isAnimationActive={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="pnl"
                        stroke={isLong ? "#22c55e" : "#ef4444"}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                      <RechartsTooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const { price, pnl } = payload[0].payload as { price: number; pnl: number };
                          return (
                            <div className="bg-[#111]/95 border border-white/10 rounded-lg px-3 py-2 text-xs text-white shadow-xl">
                              <div className="text-white/70">If {asset} → ${price.toFixed(2)}</div>
                              <div className={`font-bold mt-0.5 ${pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                                {pnl >= 0 ? "+" : ""}${pnl.toFixed(0)}
                              </div>
                            </div>
                          );
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-5 text-[11px] text-white/50 mt-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>Current</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    <span>Break Even</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span>Strike</span>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-white/6">
                <div className="flex px-6">
                  {(["summary", "greeks", "details"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-3 text-sm font-medium capitalize transition-colors ${
                        activeTab === tab
                          ? "text-white border-b-2 border-white"
                          : "text-white/40 hover:text-white/70"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === "summary" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/3 rounded-lg p-4">
                      <div className="text-white/50 text-xs mb-1">
                        {isLong ? "Max Profit" : "Max Loss"}
                      </div>
                      <div className={`text-lg font-bold font-mono ${isLong ? "text-green-400" : "text-red-400"}`}>
                        {isLong
                          ? isCall ? "Unlimited" : `$${((contract.strike * contractSizeValue - markPerContract) * quantity).toFixed(0)}`
                          : isCall ? "Unlimited" : `$${((contract.strike * contractSizeValue - markPerContract) * quantity).toFixed(0)}`}
                      </div>
                    </div>
                    <div className="bg-white/3 rounded-lg p-4">
                      <div className="text-white/50 text-xs mb-1">
                        {isLong ? "Max Loss" : "Max Profit"}
                      </div>
                      <div className={`text-lg font-bold font-mono ${isLong ? "text-red-400" : "text-green-400"}`}>
                        ${totalCost.toFixed(0)}
                      </div>
                    </div>
                    <div className="bg-white/3 rounded-lg p-4">
                      <div className="text-white/50 text-xs mb-1">Volume</div>
                      <div className="text-white text-lg font-bold">{contract.volume.toLocaleString()}</div>
                    </div>
                    <div className="bg-white/3 rounded-lg p-4">
                      <div className="text-white/50 text-xs mb-1">Open Interest</div>
                      <div className="text-white text-lg font-bold">{contract.openInterest.toLocaleString()}</div>
                    </div>
                  </div>
                )}

                {activeTab === "greeks" && (
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Delta (Δ)", value: contract.delta.toFixed(4), desc: "$/​$1 move" },
                      { label: "Gamma (Γ)", value: contract.gamma.toFixed(4), desc: "Δ acceleration" },
                      { label: "Theta (Θ)", value: contract.theta.toFixed(4), desc: "$/​day decay", color: contract.theta < 0 ? "text-red-400" : "text-green-400" },
                      { label: "Vega (V)", value: contract.vega.toFixed(4), desc: "$/​1% IV" },
                      { label: "Rho (ρ)", value: contract.rho.toFixed(4), desc: "$/​1% rate" },
                      { label: "IV", value: `${(contract.impliedVolatility * 100).toFixed(1)}%`, desc: "Implied vol" },
                    ].map((g) => (
                      <div key={g.label} className="bg-white/3 rounded-lg p-4">
                        <div className="text-white/50 text-xs mb-1">{g.label}</div>
                        <div className={`text-lg font-bold font-mono ${g.color || "text-white"}`}>{g.value}</div>
                        <div className="text-white/30 text-xs mt-1">{g.desc}</div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "details" && (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Strike Price", value: `$${contract.strike}` },
                      { label: "Expiration", value: expiration.fullDate, sub: `${expiration.days}d remaining` },
                      { label: "Last Price", value: `$${contract.lastPrice.toFixed(2)}` },
                      { label: "Moneyness", value: moneyness, color: moneynessColor },
                      { label: "Break Even", value: `$${breakEven.toFixed(2)}` },
                      { label: "Win Chance", value: `${contract.chanceOfProfit.toFixed(0)}%`, color: "text-green-400" },
                    ].map((d) => (
                      <div key={d.label} className="bg-white/3 rounded-lg p-4">
                        <div className="text-white/50 text-xs mb-1">{d.label}</div>
                        <div className={`text-lg font-bold font-mono ${d.color || "text-white"}`}>{d.value}</div>
                        {d.sub && <div className="text-white/30 text-xs mt-1">{d.sub}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Right: Order Form ── */}
            <div className="w-full lg:w-90 shrink-0 border-t lg:border-t-0 lg:border-l border-white/6 flex flex-col bg-[#080808]">
              <div className="flex-1 overflow-y-auto p-5 space-y-5">

                {/* Quantity */}
                <div>
                  <label className="block text-white/50 text-xs font-medium mb-2 uppercase tracking-wider">
                    Contracts
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                    >
                      <FaMinus size={10} />
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                      className="flex-1 h-10 px-3 bg-white/5 border border-white/8 rounded-lg text-white text-center font-mono text-lg focus:outline-none focus:border-white/20 transition-colors"
                      min={1}
                    />
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                    >
                      <FaPlus size={10} />
                    </button>
                  </div>
                </div>

                {/* Limit Price */}
                <div>
                  <label className="block text-white/50 text-xs font-medium mb-2 uppercase tracking-wider">
                    Limit Price (per contract)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">$</span>
                    <input
                      type="number"
                      value={limitPrice}
                      onChange={(e) => setLimitPrice(e.target.value)}
                      placeholder={markPerContract.toFixed(2)}
                      className="w-full h-10 pl-7 pr-3 bg-white/5 border border-white/8 rounded-lg text-white font-mono placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Cash-secured toggle (put sells only) */}
                {selectedSide === "sell" && type === "put" && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-white/60 text-sm">Cash-secured put</span>
                    <button
                      onClick={() => setPutCashSecured(!putCashSecured)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        putCashSecured ? "bg-green-500" : "bg-white/20"
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          putCashSecured ? "translate-x-4.5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                )}

                {/* Separator */}
                <div className="border-t border-white/6" />

                {/* Order Summary */}
                <div className="space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Premium ({quantity} contract{quantity > 1 ? 's' : ''})</span>
                    <span className="text-white font-mono">
                      ${(pricePerContract * quantity).toFixed(2)}
                    </span>
                  </div>
                  {isLong ? (
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Fee</span>
                      <span className="text-white font-mono">${(fee * quantity).toFixed(2)}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <div className="flex justify-between text-sm">
                        <span className="text-yellow-400 font-semibold">No fee</span>
                        <span className="text-yellow-400 font-mono">$0.00</span>
                      </div>
                    </div>
                  )}
                  <div className="border-t border-white/6 pt-2.5 flex justify-between text-sm">
                    <span className="text-white/70 font-medium">Est. Margin</span>
                    <span className={`font-mono font-semibold ${
                      estimatedMargin > freeCollateral && freeCollateral > 0 ? "text-red-400" : "text-white"
                    }`}>
                      ${estimatedMargin.toFixed(2)}
                    </span>
                  </div>
                  {balances && (
                    <div className="flex justify-between text-sm">
                      <span className="text-white/40">Free Collateral</span>
                      <span className="text-white/60 font-mono">${freeCollateral.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Insufficient collateral warning */}
                {estimatedMargin > freeCollateral && freeCollateral > 0 && (
                  <div className="p-3 rounded-lg bg-red-500/8 border border-red-500/20">
                    <p className="text-red-400 text-xs leading-relaxed">
                      Insufficient collateral. Deposit at least ${(estimatedMargin - freeCollateral).toFixed(2)} USDC from the margin panel on the options page.
                    </p>
                  </div>
                )}

                {/* Status Messages */}
                {!channelAddress && (
                  <div className="p-3 rounded-lg bg-yellow-500/8 border border-yellow-500/20">
                    <p className="text-yellow-400 text-xs">Connect your session to place orders.</p>
                  </div>
                )}
              </div>

              {/* Submit Button (sticky at bottom) */}
              <div className="p-5 pt-0">
                <button
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting || !channelAddress}
                  className={`w-full py-3.5 rounded-xl font-bold text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                    selectedSide === "buy"
                      ? "bg-green-500 hover:bg-green-400 text-black shadow-lg shadow-green-500/20"
                      : "bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/20"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                      Submitting...
                    </>
                  ) : (
                    `${selectedSide === "buy" ? "Buy" : "Sell"} ${type === "call" ? "Call" : "Put"}`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
