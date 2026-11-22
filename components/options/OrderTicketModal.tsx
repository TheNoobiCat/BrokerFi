"use client";

import { useState, useEffect, useCallback } from "react";
import { FaTimes, FaWallet } from "react-icons/fa";
import Portal from "@/components/ui/Portal";
import { useSession } from "@/store/SessionContext";
import { useUI } from "@/store/UIContext";
import {
  createOptionsOrder,
  depositOptionsCollateral,
  withdrawOptionsCollateral,
  getAccountBalances,
  parsePrice18,
  type AccountBalances,
} from "@/services/options";
import { GhostSquare } from "@/components/ui/GhostSquare";

interface OrderTicketModalProps {
  showOrderTicket: boolean;
  setShowOrderTicket: (show: boolean) => void;
  selectedOption: {
    type: "call" | "put";
    contract: {
      strike: number;
      lastPrice: number;
    };
    side: "buy" | "sell";
  } | null;
  quantity: number;
  setQuantity: (quantity: number) => void;
  side: "buy" | "sell";
  setSide: (side: "buy" | "sell") => void;
  limitPrice: string;
  setLimitPrice: (price: string) => void;
  asset?: string;
  pythPriceId?: `0x${string}`;
  expiryTimestamp?: number;
  spotPrice?: number; // current underlying price in dollars (e.g. 2500 for ETH)
}

export default function OrderTicketModal({
  showOrderTicket,
  setShowOrderTicket,
  selectedOption,
  quantity,
  setQuantity,
  side,
  setSide,
  limitPrice,
  setLimitPrice,
  asset: _asset, // eslint-disable-line @typescript-eslint/no-unused-vars
  pythPriceId,
  expiryTimestamp,
  spotPrice,
}: OrderTicketModalProps) {
  const { channelAddress } = useSession();
  const { showToast } = useUI();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Collateral management state
  const [balances, setBalances] = useState<AccountBalances | null>(null);
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositStatus, setDepositStatus] = useState<"idle" | "submitted" | "success" | "error">("idle");
  const [depositError, setDepositError] = useState("");
  const [putCashSecured, setPutCashSecured] = useState(true);

  // Fetch margin account balances
  const refreshBalances = useCallback(async () => {
    if (!channelAddress) return;
    const b = await getAccountBalances(channelAddress as `0x${string}`);
    setBalances(b);
  }, [channelAddress]);

  useEffect(() => {
    let cancelled = false;
    if (showOrderTicket && channelAddress) {
      getAccountBalances(channelAddress as `0x${string}`).then((b) => {
        if (!cancelled) setBalances(b);
      });
    }
    return () => { cancelled = true; };
  }, [showOrderTicket, channelAddress]);

  if (!showOrderTicket || !selectedOption) return null;

  const isLong = side === "buy";
  const pricePerContract = limitPrice
    ? Number(limitPrice)
    : selectedOption.contract.lastPrice || 0;

  // Estimate margin requirement matching MarginRequirement.sol:
  // margin = premium + max(regulatory - OTM_amount, floor)
  //   Calls:  regulatory = 0.2 * spot,  floor = 0.1 * spot,  OTM = max(strike - spot, 0)
  //   Puts:   regulatory = 0.2 * spot,  floor = 0.1 * strike, OTM = max(spot - strike, 0)
  const estimatedMargin = (() => {
    const premium = pricePerContract;
    const spot = spotPrice ?? 0;
    const strike = selectedOption.contract.strike;

    if (isLong) {
      // Buy orders: lock premium + 0.40 USDC fee per contract
      return (premium + 0.4) * quantity;
    }

    // Sell-to-open margin calculation
    if (selectedOption.type === "put" && putCashSecured) {
      // Cash-secured put: just the premium
      return premium * quantity;
    }

    if (spot <= 0) {
      // No spot price available — show rough 3x premium estimate
      return premium * quantity * 3;
    }

    const isCall = selectedOption.type === "call";
    const otm = isCall
      ? Math.max(strike - spot, 0)
      : Math.max(spot - strike, 0);
    const regulatory = 0.2 * spot;
    const floor = isCall ? 0.1 * spot : 0.1 * strike;
    const marginPerContract = premium + Math.max(regulatory - otm, floor);
    return marginPerContract * quantity;
  })();

  // Note: MarginAccount stores balances in 18-decimal PRICE_DECIMALS format.
  // depositCollateral scales: totalCollateral += amount_usdc6 * 1e12 → stored as 18-dec.
  // lockMargin checks against 18-dec totalCollateral, and marginToLock is also 18-dec
  // (limitPricePerOption_18 * amount → 18-dec).
  // For display we convert 18-dec to human-readable by dividing by 1e18.
  const freeCollateral = balances
    ? Number(balances.freeCollateral > 0n ? balances.freeCollateral : 0n) / 1e18
    : 0;

  const handleDeposit = async () => {
    if (!channelAddress || !depositAmount || Number(depositAmount) <= 0) return;
    setIsDepositing(true);
    setDepositStatus("idle");
    setDepositError("");

    const result = await depositOptionsCollateral({
      channelAddress: channelAddress as `0x${string}`,
      amount: depositAmount,
      onSubmitted: () => setDepositStatus("submitted"),
      onSuccess: () => {
        setDepositStatus("success");
        setIsDepositing(false);
        setDepositAmount("");
        refreshBalances();
      },
      onError: (err) => {
        setDepositError(err?.detail || err?.error || String(err));
        setDepositStatus("error");
        setIsDepositing(false);
      },
    });

    if (!result.success && depositStatus !== "success") {
      setDepositError(result.error || "Deposit failed");
      setDepositStatus("error");
      setIsDepositing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!channelAddress || !depositAmount || Number(depositAmount) <= 0) return;
    setIsDepositing(true);
    setDepositStatus("idle");
    setDepositError("");

    const result = await withdrawOptionsCollateral({
      channelAddress: channelAddress as `0x${string}`,
      amount: depositAmount,
      onSubmitted: () => setDepositStatus("submitted"),
      onSuccess: () => {
        setDepositStatus("success");
        setIsDepositing(false);
        setDepositAmount("");
        refreshBalances();
      },
      onError: (err) => {
        setDepositError(err?.detail || err?.error || String(err));
        setDepositStatus("error");
        setIsDepositing(false);
      },
    });

    if (!result.success && depositStatus !== "success") {
      setDepositError(result.error || "Withdraw failed");
      setDepositStatus("error");
      setIsDepositing(false);
    }
  };

  const handleSubmitOrder = async () => {
    if (!channelAddress) {
      setErrorMessage("Please connect your session first");
      showToast("Please connect your session first", "error");
      return;
    }

    if (!pythPriceId) {
      setErrorMessage("Price feed not available for this asset");
      showToast("Price feed not available for this asset", "error");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      // Convert strike & price to 18-decimal bigints (contract uses 18-dec for margin math)
      const strikeBigInt = parsePrice18(selectedOption.contract.strike.toString());
      const priceBigInt = limitPrice
        ? parsePrice18(limitPrice)
        : parsePrice18(selectedOption.contract.lastPrice.toString());

      // Expiry: use provided timestamp or default to 30 days from now
      const expiry = expiryTimestamp || Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

      const result = await createOptionsOrder({
        channelAddress: channelAddress as `0x${string}`,
        underlyingPriceFeedId: pythPriceId,
        isCall: selectedOption.type === "call",
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
          setShowOrderTicket(false);
        },
        onError: (err) => {
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

  return (
    <Portal>
      <>
        {/* Backdrop */}
        <div className="fixed inset-0 z-99999 bg-black/80" onClick={() => setShowOrderTicket(false)} />

        {/* Modal */}
        <div className="fixed inset-0 z-100000 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-black/95 border border-white/10 rounded-lg shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-6 border-b border-white/10 shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white font-sans">
                  {side === "buy" ? "Buy" : "Sell"} {selectedOption.contract.strike} {selectedOption.type.toUpperCase()}
                </h2>
                <button
                  onClick={() => setShowOrderTicket(false)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <FaTimes className="w-5 h-5 text-white/60" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* ── Margin Account ── */}
              <div className="p-4 rounded-lg border border-white/10 bg-white/2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FaWallet className="text-white/50 w-3.5 h-3.5" />
                    <span className="text-white/70 text-sm font-semibold">Margin Account</span>
                  </div>
                  <button
                    onClick={() => setShowDeposit(!showDeposit)}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {showDeposit ? "Hide" : "Deposit / Withdraw"}
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <div className="text-white/40 text-xs">Total</div>
                    <div className="text-white font-mono">
                      ${balances ? (Number(balances.totalCollateral) / 1e18).toFixed(2) : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-white/40 text-xs">Locked</div>
                    <div className="text-white font-mono">
                      ${balances ? (Number(balances.lockedMargin) / 1e18).toFixed(2) : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-white/40 text-xs">Free</div>
                    <div className="text-green-400 font-mono">
                      ${freeCollateral.toFixed(2)}
                    </div>
                  </div>
                </div>

                {showDeposit && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                    <div className="relative">
                      <input
                        type="number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="USDC amount"
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 text-sm font-mono pr-14"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 text-xs">USDC</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDeposit}
                        disabled={isDepositing || !depositAmount}
                        className="flex-1 py-2 rounded-lg bg-green-500/20 text-green-400 text-sm font-semibold hover:bg-green-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        {isDepositing && depositStatus !== "error" ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-green-400"></div>
                            Deposit
                          </div>
                        ) : "Deposit"}
                      </button>
                      <button
                        onClick={handleWithdraw}
                        disabled={isDepositing || !depositAmount}
                        className="flex-1 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        Withdraw
                      </button>
                    </div>
                    {depositStatus === "error" && depositError && (
                      <p className="text-red-400 text-xs">{depositError}</p>
                    )}
                  </div>
                )}
              </div>

              {/* ── Order Inputs ── */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 text-sm mb-2">Quantity (contracts)</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                    min="1"
                    step="1"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">Side</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSide("buy")}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                        side === "buy"
                          ? "bg-green-500 text-black"
                          : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                    >
                      Buy
                    </button>
                    <button
                      onClick={() => setSide("sell")}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                        side === "sell"
                          ? "bg-red-500 text-white"
                          : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                    >
                      Sell
                    </button>
                  </div>
                </div>
              </div>

              {/* Cash-secured toggle for put sells */}
              {side === "sell" && selectedOption.type === "put" && (
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-white/70 text-sm">Cash-secured put</span>
                  <button
                    onClick={() => setPutCashSecured(!putCashSecured)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      putCashSecured ? "bg-green-500" : "bg-white/20"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        putCashSecured ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              )}

              <div>
                <label className="block text-white/70 text-sm mb-2">Limit Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50">$</span>
                  <input
                    type="number"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    placeholder={selectedOption.contract.lastPrice.toFixed(2)}
                    className="w-full pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50"
                    step="0.01"
                  />
                </div>
              </div>

              {/* ── Order Summary ── */}
              <div className="border-t border-white/10 pt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm">Premium ({quantity} × ${pricePerContract.toFixed(2)})</span>
                  <span className="text-white font-mono text-sm">
                    ${(pricePerContract * quantity).toFixed(2)}
                  </span>
                </div>
                {isLong ? (
                  <div className="flex justify-between items-center">
                    <span className="text-white/70 text-sm">Fee ({quantity} × $0.40)</span>
                    <span className="text-white font-mono text-sm">${(0.4 * quantity).toFixed(2)}</span>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center">
                      <span className="text-yellow-400 font-semibold text-sm">No fee</span>
                      <span className="text-yellow-400 font-mono text-sm">$0.00</span>
                    </div>
                    <div className="text-white/40 text-xs mt-1">
                      Selling calls and puts does not incur a fee on BrokerFi
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                  <span className="text-white/80 text-sm font-semibold">Est. Margin Required</span>
                  <span className={`font-mono text-sm font-semibold ${
                    estimatedMargin > freeCollateral ? "text-red-400" : "text-green-400"
                  }`}>
                    ${estimatedMargin.toFixed(2)}
                  </span>
                </div>
                {estimatedMargin > freeCollateral && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                    <p className="text-red-400 text-xs">
                      Insufficient free collateral (${freeCollateral.toFixed(2)} available).
                      Deposit at least ${(estimatedMargin - freeCollateral).toFixed(2)} USDC above.
                    </p>
                  </div>
                )}
              </div>

              {/* ── Status Messages ── */}
              {!channelAddress && (
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <p className="text-yellow-400 text-sm">Connect a session to place orders on-chain.</p>
                </div>
              )}
            </div>

            {/* ── Action Buttons ── */}
            <div className="p-6 pt-0 flex gap-3">
              <button
                onClick={() => setShowOrderTicket(false)}
                className="flex-1 py-4 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 hover:text-white font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitOrder}
                disabled={isSubmitting || !channelAddress}
                className={`flex-1 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                  side === "buy"
                    ? "bg-green-500 text-black hover:bg-green-400"
                    : "bg-red-500 text-white hover:bg-red-400"
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    Place Order
                  </div>
                ) : "Place Order"}
              </button>
            </div>
          </div>
        </div>
      </>
    </Portal>
  );
}
