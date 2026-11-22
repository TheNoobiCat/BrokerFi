"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import OnboardingBanner from "@/components/onboarding/OnboardingBanner";
import Bridge from "@/components/onboarding/Onboarder";
import { useSession } from "@/store/SessionContext";
import { useUI } from "@/store/UIContext";
import { TradingProvider } from "@/store/TradingContext";
import {
  getCLETHInfo,
  buyCLETH,
  sellCLETH,
  stakeCLETH,
  unstakeCLETH,
  estimateBuyReturn,
  estimateSellReturn,
  formatCLETH,
  formatUSDC,
  STAKING_TIERS,
  type CLETHInfo,
} from "@/services/cleth";

function CLETHPageContent() {
  const { channelAddress, isConnected: sessionConnected } = useSession();
  const { bridgeRequest, closeBridge, setGlobalLoading } = useUI();
  const [showBridge, setShowBridge] = useState(false);

  const [info, setInfo] = useState<CLETHInfo | null>(null);

  // Buy/Sell state
  const [activeTab, setActiveTab] = useState<"buy" | "sell" | "stake" | "unstake">("buy");
  const [amount, setAmount] = useState("");
  const [estimatedReturn, setEstimatedReturn] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txStatus, setTxStatus] = useState<"idle" | "submitted" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Onboarding bridge
  // Onboarding bridge - use ref to avoid cascading renders
  const bridgeHandled = useRef(false);
  useEffect(() => {
    if (bridgeRequest && !bridgeHandled.current) {
      bridgeHandled.current = true;
      requestAnimationFrame(() => {
        setShowBridge(true);
        closeBridge();
      });
    }
    if (!bridgeRequest) bridgeHandled.current = false;
  }, [bridgeRequest, closeBridge]);

  // Fetch CLETH info (works even without a channel for global data)
  const refresh = useCallback(async () => {
    const addr = channelAddress ? (channelAddress as `0x${string}`) : undefined;
    const data = await getCLETHInfo(addr);
    setInfo(data);
  }, [channelAddress]);

  // Initial load + refresh on channel change
  useEffect(() => {
    let cancelled = false;
    getCLETHInfo(channelAddress ? (channelAddress as `0x${string}`) : undefined).then((data) => {
      if (!cancelled) {
        setInfo(data);
        setGlobalLoading(false);
      }
    }).catch((error) => {
      console.error("Failed to load CLETH info:", error);
      if (!cancelled) {
        setInfo(null);
        setGlobalLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [channelAddress, setGlobalLoading]);

  // Estimate return on amount change
  useEffect(() => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      requestAnimationFrame(() => setEstimatedReturn(null));
      return;
    }

    const timer = setTimeout(async () => {
      if (activeTab === "buy") {
        const ret = await estimateBuyReturn(amount);
        setEstimatedReturn(ret !== null ? formatCLETH(ret) : null);
      } else if (activeTab === "sell") {
        const ret = await estimateSellReturn(amount);
        setEstimatedReturn(ret !== null ? formatUSDC(ret) : null);
      } else {
        setEstimatedReturn(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [amount, activeTab]);

  const handleSubmit = async () => {
    if (!channelAddress || !amount || Number(amount) <= 0) return;

    setIsSubmitting(true);
    setTxStatus("idle");
    setErrorMsg("");

    const callbacks = {
      channelAddress: channelAddress as `0x${string}`,
      amount,
      onSubmitted: () => setTxStatus("submitted"),
      onSuccess: () => {
        setTxStatus("success");
        setIsSubmitting(false);
        setAmount("");
        refresh();
      },
      onError: (err: Error & { detail?: string; error?: string }) => {
        setErrorMsg(err?.detail || err?.error || String(err));
        setTxStatus("error");
        setIsSubmitting(false);
      },
    };

    try {
      let result;
      switch (activeTab) {
        case "buy":
          result = await buyCLETH(callbacks);
          break;
        case "sell":
          result = await sellCLETH(callbacks);
          break;
        case "stake":
          result = await stakeCLETH(callbacks);
          break;
        case "unstake":
          result = await unstakeCLETH(callbacks);
          break;
      }

      if (result && !result.success && txStatus !== "success") {
        setErrorMsg(result.error || "Transaction failed");
        setTxStatus("error");
        setIsSubmitting(false);
      }
    } catch (err) {
      setErrorMsg(String(err));
      setTxStatus("error");
      setIsSubmitting(false);
    }
  };

  const getCurrentTier = (): number => {
    if (!info) return 0;
    const staked = Number(formatCLETH(info.userStaked));
    if (staked >= 25_000_000) return 4;
    if (staked >= 10_000_000) return 3;
    if (staked >= 5_000_000) return 2;
    if (staked >= 1_000_000) return 1;
    return 0;
  };

  const tierColors = ["text-white/50", "text-orange-400", "text-gray-300", "text-yellow-400", "text-cyan-400"];
  const tierBg = ["bg-white/5", "bg-orange-500/10", "bg-gray-400/10", "bg-yellow-500/10", "bg-cyan-500/10"];

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-broker-gradient">
      {!sessionConnected && (
        <OnboardingBanner onStartOnboarding={() => setShowBridge(true)} />
      )}

      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">CLETH Token</h1>
            <p className="text-white/60">
              Buy CLETH on the bonding curve, stake for trading fee discounts up to 100%.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="text-white/50 text-xs uppercase tracking-wider mb-1">Price per CLETH</div>
              <div className="text-white font-mono text-lg">
                {info ? (() => {
                  // currentPrice() returns USDC raw (6 dec) per 1e18 token-wei.
                  // price_per_full_token = currentPrice (cost for 1 whole token in USDC 6-dec)
                  const dollarStr = formatUSDC(info.currentPrice);
                  const dollarNum = parseFloat(dollarStr);
                  if (dollarNum >= 1e12) return `$${(dollarNum / 1e12).toFixed(2)}T`;
                  if (dollarNum >= 1e9) return `$${(dollarNum / 1e9).toFixed(2)}B`;
                  if (dollarNum >= 1e6) return `$${(dollarNum / 1e6).toFixed(2)}M`;
                  if (dollarNum >= 1000) return `$${dollarNum.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
                  if (dollarNum >= 1) return `$${dollarNum.toFixed(4)}`;
                  return `$${dollarNum.toFixed(8)}`;
                })() : "—"}
              </div>
              {info && parseFloat(formatUSDC(info.currentPrice)) > 1e9 && (
                <div className="text-yellow-400/80 text-xs mt-1">
                  ⚠ Price is extreme due to pre-minted supply ({Number(formatCLETH(info.totalSupply)).toLocaleString(undefined, { maximumFractionDigits: 0 })} tokens). Contract may need redeployment.
                </div>
              )}
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="text-white/50 text-xs uppercase tracking-wider mb-1">Total Supply</div>
              <div className="text-white font-mono text-lg">
                {info ? `${Number(formatCLETH(info.totalSupply)).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—"}
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="text-white/50 text-xs uppercase tracking-wider mb-1">Your Balance</div>
              <div className="text-white font-mono text-lg">
                {info ? `${Number(formatCLETH(info.userBalance)).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—"}
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="text-white/50 text-xs uppercase tracking-wider mb-1">Your Fee Discount</div>
              <div className={`font-mono text-lg ${tierColors[getCurrentTier()]}`}>
                {info ? `${Number(info.discountBps) / 100}%` : "—"}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Left: Buy/Sell/Stake Panel */}
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-white/10">
                {(["buy", "sell", "stake", "unstake"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setAmount("");
                      setEstimatedReturn(null);
                      setTxStatus("idle");
                    }}
                    className={`flex-1 py-3 text-sm font-semibold transition-all capitalize ${
                      activeTab === tab
                        ? tab === "buy" || tab === "stake"
                          ? "bg-green-500/10 text-green-400 border-b-2 border-green-500"
                          : "bg-red-500/10 text-red-400 border-b-2 border-red-500"
                        : "text-white/50 hover:text-white/70"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="p-6 space-y-4">
                {/* Amount input */}
                <div>
                  <label className="block text-white/70 text-sm mb-2">
                    {activeTab === "buy"
                      ? "USDC Amount"
                      : activeTab === "sell"
                      ? "CLETH Amount"
                      : activeTab === "stake"
                      ? "CLETH to Stake"
                      : "CLETH to Unstake"}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 text-lg font-mono"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">
                      {activeTab === "buy" ? "USDC" : "CLETH"}
                    </span>
                  </div>
                </div>

                {/* Estimated return */}
                {estimatedReturn && (activeTab === "buy" || activeTab === "sell") && (
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-white/60 text-sm">Estimated return</span>
                    <span className="text-white font-mono">
                      {activeTab === "buy"
                        ? `${Number(estimatedReturn).toLocaleString(undefined, { maximumFractionDigits: 2 })} CLETH`
                        : `$${Number(estimatedReturn).toFixed(2)} USDC`}
                    </span>
                  </div>
                )}

                {/* Warning: buy returns nothing due to extreme price */}
                {!estimatedReturn && amount && Number(amount) > 0 && activeTab === "buy" && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                    <p className="text-red-400 text-sm">
                      Current token price is too high — this USDC amount cannot purchase any tokens.
                      The bonding curve price is extreme due to the pre-minted supply.
                    </p>
                  </div>
                )}

                {/* Staking info */}
                {(activeTab === "stake" || activeTab === "unstake") && info && (
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-white/60 text-sm">Currently Staked</span>
                    <span className="text-white font-mono">
                      {Number(formatCLETH(info.userStaked)).toLocaleString(undefined, { maximumFractionDigits: 2 })} CLETH
                    </span>
                  </div>
                )}

                {/* Status messages */}
                {!channelAddress && (
                  <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <p className="text-yellow-400 text-sm">Connect a session to interact with CLETH.</p>
                  </div>
                )}
                {txStatus === "submitted" && (
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <p className="text-blue-400 text-sm">Transaction submitted, waiting for confirmation...</p>
                  </div>
                )}
                {txStatus === "success" && (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                    <p className="text-green-400 text-sm">Transaction successful!</p>
                  </div>
                )}
                {txStatus === "error" && errorMsg && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                    <p className="text-red-400 text-sm">{errorMsg}</p>
                  </div>
                )}

                {/* Submit button */}
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !channelAddress || !amount || Number(amount) <= 0 || (activeTab === "buy" && !estimatedReturn && Number(amount) > 0)}
                  className={`w-full py-4 rounded-lg font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    activeTab === "buy" || activeTab === "stake"
                      ? "bg-green-500 text-black hover:bg-green-400"
                      : "bg-red-500 text-white hover:bg-red-400"
                  }`}
                >
                  {isSubmitting
                    ? "Processing..."
                    : txStatus === "success"
                    ? "Done!"
                    : activeTab === "buy"
                    ? "Buy CLETH"
                    : activeTab === "sell"
                    ? "Sell CLETH"
                    : activeTab === "stake"
                    ? "Stake CLETH"
                    : "Unstake CLETH"}
                </button>
              </div>
            </div>

            {/* Right: Staking Tiers */}
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Fee Discount Tiers</h3>
                <p className="text-white/50 text-sm mb-4">
                  Stake CLETH to reduce your trading fees on both Options and Perpetuals.
                </p>
                <div className="space-y-2">
                  {STAKING_TIERS.map((tier, i) => {
                    const isCurrentTier = getCurrentTier() === i;
                    return (
                      <div
                        key={tier.name}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                          isCurrentTier
                            ? `${tierBg[i]} border-${tierColors[i].replace("text-", "")}/40`
                            : "bg-white/3 border-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${isCurrentTier ? "bg-green-400" : "bg-white/20"}`} />
                          <div>
                            <div className={`font-semibold text-sm ${isCurrentTier ? tierColors[i] : "text-white/70"}`}>
                              {tier.name}
                            </div>
                            <div className="text-xs text-white/40">
                              {tier.minStake === "0" ? "No minimum" : `≥ ${tier.minStake} CLETH`}
                            </div>
                          </div>
                        </div>
                        <div className={`font-mono font-bold text-sm ${isCurrentTier ? tierColors[i] : "text-white/50"}`}>
                          {tier.discountPercent === 100 ? "FREE" : `${tier.discountPercent}% off`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bonding Curve Info */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Bonding Curve</h3>
                <p className="text-white/50 text-sm mb-3">
                  CLETH uses a quadratic bonding curve: <span className="text-white/70 font-mono">price = base + slope × (supply/1e18)²</span>
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Mechanism</span>
                    <span className="text-white">Buy with USDC, sell back anytime</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Fee Flow</span>
                    <span className="text-white">60% buy-and-burn, 40% treasury</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Total Staked</span>
                    <span className="text-white font-mono">
                      {info ? Number(formatCLETH(info.totalStaked)).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showBridge && <Bridge isOpen={showBridge} onClose={() => setShowBridge(false)} />}
    </div>
  );
}

export default function CLETHPage() {
  return (
    <TradingProvider>
      <CLETHPageContent />
    </TradingProvider>
  );
}
