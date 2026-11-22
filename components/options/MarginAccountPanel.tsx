"use client";

import { useState, useEffect, useCallback } from "react";
import { FaWallet, FaExclamationTriangle } from "react-icons/fa";
import { useSession } from "@/store/SessionContext";
import {
  depositOptionsCollateral,
  withdrawOptionsCollateral,
  getAccountBalances,
  type AccountBalances,
} from "@/services/options";
import { GhostSquare } from "@/components/ui/GhostSquare";

export default function MarginAccountPanel() {
  const { channelAddress } = useSession();
  const [balances, setBalances] = useState<AccountBalances | null>(null);
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitted" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [action, setAction] = useState<"deposit" | "withdraw">("deposit");

  const refreshBalances = useCallback(async () => {
    if (!channelAddress) return;
    try {
      const b = await getAccountBalances(channelAddress as `0x${string}`);
      setBalances(b);
    } catch {
      // Silently handle — user may not have margin account yet
    }
  }, [channelAddress]);

  useEffect(() => {
    if (!channelAddress) return;
    let cancelled = false;
    getAccountBalances(channelAddress as `0x${string}`).then((b) => {
      if (!cancelled) setBalances(b);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [channelAddress]);

  // Auto-refresh every 30s
  useEffect(() => {
    if (!channelAddress) return;
    const interval = setInterval(refreshBalances, 30000);
    return () => clearInterval(interval);
  }, [channelAddress, refreshBalances]);

  const freeCollateral = balances
    ? Number(balances.freeCollateral > 0n ? balances.freeCollateral : 0n) / 1e18
    : 0;
  const totalCollateral = balances ? Number(balances.totalCollateral) / 1e18 : 0;
  const lockedMargin = balances ? Number(balances.lockedMargin) / 1e18 : 0;

  // Margin health calculation (maintenance margin at 15% from Constants)
  const marginHealth = totalCollateral > 0 ? ((totalCollateral - lockedMargin * 0.15) / totalCollateral) * 100 : 100;
  const isLowHealth = marginHealth < 50;
  const isCritical = marginHealth < 30;

  const handleAction = async () => {
    if (!channelAddress || !amount || Number(amount) <= 0) return;
    setIsProcessing(true);
    setStatus("idle");
    setStatusMessage("");

    const callbacks = {
      channelAddress: channelAddress as `0x${string}`,
      amount,
      onSubmitted: () => setStatus("submitted"),
      onSuccess: () => {
        setStatus("success");
        setStatusMessage(action === "deposit" ? "Deposited!" : "Withdrawn!");
        setIsProcessing(false);
        setAmount("");
        refreshBalances();
        setTimeout(() => { setStatus("idle"); setStatusMessage(""); }, 3000);
      },
      onError: (err: Record<string, string>) => {
        setStatusMessage(err?.detail || err?.error || String(err));
        setStatus("error");
        setIsProcessing(false);
      },
    };

    const fn = action === "deposit" ? depositOptionsCollateral : withdrawOptionsCollateral;
    const result = await fn(callbacks);

    if (!result.success && status !== "success") {
      setStatusMessage(result.error || `${action} failed`);
      setStatus("error");
      setIsProcessing(false);
    }
  };

  if (!channelAddress) return null;

  return (
    <div className="bg-white/2 border border-white/6 rounded-xl p-3 min-w-[380px]">
      {/* Top: Margin Health */}
      {lockedMargin > 0 && (
        <div className="mb-3 pb-3 border-b border-white/6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/40 text-[10px] uppercase tracking-wider">Margin Health</span>
            <span className={`text-xs font-semibold ${isCritical ? 'text-red-400' : isLowHealth ? 'text-yellow-400' : 'text-green-400'}`}>
              {balances ? `${marginHealth.toFixed(1)}%` : <GhostSquare size="xs" />}
            </span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isCritical ? 'bg-red-500' : isLowHealth ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, marginHealth))}%` }}
            />
          </div>
          {isCritical && (
            <div className="flex items-center gap-1 mt-1.5 text-red-400 text-[10px]">
              <FaExclamationTriangle className="w-2.5 h-2.5" />
              <span className="font-medium">POSITIONS MAY CLOSE</span>
            </div>
          )}
          {!isCritical && isLowHealth && (
            <div className="flex items-center gap-1 mt-1.5 text-yellow-400 text-[10px]">
              <FaExclamationTriangle className="w-2.5 h-2.5" />
              <span className="font-medium">MARGIN CALL</span>
            </div>
          )}
        </div>
      )}

      {/* Middle: Balances */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
          <FaWallet className="text-white/40 w-3 h-3" />
        </div>
        <div className="flex items-center gap-4 flex-1 overflow-x-auto">
          <div>
            <div className="text-white/40 text-[9px] uppercase tracking-wider">Free</div>
            <div className="text-green-400 font-mono font-semibold text-xs">
              {balances ? `$${freeCollateral.toFixed(2)}` : <GhostSquare size="sm" />}
            </div>
          </div>
          <div>
            <div className="text-white/40 text-[9px] uppercase tracking-wider">Total</div>
            <div className="text-white/80 font-mono text-xs">
              {balances ? `$${totalCollateral.toFixed(2)}` : <GhostSquare size="sm" />}
            </div>
          </div>
          <div>
            <div className="text-white/40 text-[9px] uppercase tracking-wider">Locked</div>
            <div className="text-white/50 font-mono text-xs">
              {balances ? `$${lockedMargin.toFixed(2)}` : <GhostSquare size="sm" />}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Deposit / Withdraw */}
      <div className="flex items-center gap-2">
        {/* Action toggle */}
        <div className="flex bg-white/5 rounded-lg p-0.5">
          <button
            onClick={() => setAction("deposit")}
            className={`px-2.5 py-1.5 rounded-md text-[10px] font-medium transition-all ${
              action === "deposit"
                ? "bg-green-500/20 text-green-400"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            Deposit
          </button>
          <button
            onClick={() => setAction("withdraw")}
            className={`px-2.5 py-1.5 rounded-md text-[10px] font-medium transition-all ${
              action === "withdraw"
                ? "bg-red-500/20 text-red-400"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            Withdraw
          </button>
        </div>

        {/* Amount input */}
        <div className="relative flex-1">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full h-7 pl-2 pr-11 bg-white/5 border border-white/8 rounded-lg text-white text-xs font-mono placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 text-[9px]">USDC</span>
        </div>

        {/* Submit */}
        <button
          onClick={handleAction}
          disabled={isProcessing || !amount || Number(amount) <= 0}
          className={`h-7 px-3 rounded-lg text-[10px] font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 ${
            action === "deposit"
              ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
              : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
          }`}
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
              <span className="hidden sm:inline">
                {action === "deposit" ? "Deposit" : "Withdraw"}
              </span>
            </>
          ) : status === "success" ? (
            "Done!"
          ) : (
            action === "deposit" ? "Deposit" : "Withdraw"
          )}
        </button>
      </div>

      {/* Status message */}
      {status !== "idle" && statusMessage && (
        <div className={`mt-2 text-[10px] ${
          status === "submitted" ? "text-blue-400" :
          status === "success" ? "text-green-400" :
          "text-red-400"
        }`}>
          {statusMessage}
        </div>
      )}
    </div>
  );
}
