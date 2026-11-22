"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FaTimes } from "react-icons/fa";
import { useSession } from "@/store/SessionContext";
import { depositOptionsCollateral, withdrawOptionsCollateral, getAccountBalances, type AccountBalances } from "@/services/options";
import publicClient from "@/blockchain/publicClient";

interface OptionsMarginPortalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAction?: 'deposit' | 'withdraw';
  onSuccess?: () => void;
}

export default function OptionsMarginPortal({
  isOpen,
  onClose,
  initialAction = 'deposit',
  onSuccess,
}: OptionsMarginPortalProps) {
  const { channelAddress } = useSession();
  const [action, setAction] = useState<'deposit' | 'withdraw'>(initialAction);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Balances
  const [channelBalance, setChannelBalance] = useState(0);
  const [marginBalance, setMarginBalance] = useState<AccountBalances | null>(null);

  useEffect(() => {
    setAction(initialAction);
  }, [initialAction]);

  useEffect(() => {
    if (isOpen && channelAddress) {
      fetchBalances();
    }
  }, [isOpen, channelAddress]);

  const fetchBalances = async () => {
    if (!channelAddress) return;
    try {
      const usdcAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`;
      
      const [channelUSDC, marginAcct] = await Promise.all([
        publicClient.readContract({
          address: usdcAddress,
          abi: [
            {
              inputs: [{ name: "account", type: "address" }],
              name: "balanceOf",
              outputs: [{ name: "", type: "uint256" }],
              stateMutability: "view",
              type: "function",
            },
          ],
          functionName: "balanceOf",
          args: [channelAddress as `0x${string}`],
        }),
        getAccountBalances(channelAddress as `0x${string}`).catch(() => null),
      ]);
      setChannelBalance(Number(channelUSDC) / 1e6); // USDC is 6 decimals
      setMarginBalance(marginAcct);
    } catch (err) {
      console.error("Failed to fetch balances:", err);
    }
  };

  const handleSubmit = async () => {
    if (!channelAddress) {
      setError("No channel connected");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError("Enter a valid amount");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const amountNum = Number(amount);
      
      if (action === 'deposit') {
        if (amountNum > channelBalance) {
          setError(`Insufficient balance. You have $${channelBalance.toFixed(2)} USDC in your channel.`);
          setLoading(false);
          return;
        }
        
        // depositOptionsCollateral handles approval + deposit in one batch
        const result = await depositOptionsCollateral({
          channelAddress: channelAddress as `0x${string}`,
          amount: amountNum.toString(),
          onSubmitted: () => {},
          onSuccess: () => {
            setSuccess(`✓ Deposited $${amountNum.toFixed(2)} USDC into Options Margin Account`);
            setAmount("");
            fetchBalances();
            onSuccess?.();
            setTimeout(() => {
              onClose();
              setSuccess("");
            }, 2000);
          },
          onError: (err: any) => {
            console.error("Deposit error:", err);
            setError(err?.detail || err?.error || String(err));
          },
        });
        
        if (!result.success) {
          setError(result.error || "Deposit failed");
        }
      } else {
        const freeCollateral = marginBalance ? Number(marginBalance.freeCollateral) / 1e18 : 0;
        if (amountNum > freeCollateral) {
          setError(`Insufficient free collateral. You have $${freeCollateral.toFixed(2)} available to withdraw.`);
          setLoading(false);
          return;
        }
        
        const result = await withdrawOptionsCollateral({
          channelAddress: channelAddress as `0x${string}`,
          amount: amountNum.toString(),
          onSubmitted: () => {},
          onSuccess: () => {
            setSuccess(`✓ Withdrew $${amountNum.toFixed(2)} USDC from Options Margin Account`);
            setAmount("");
            fetchBalances();
            onSuccess?.();
            setTimeout(() => {
              onClose();
              setSuccess("");
            }, 2000);
          },
          onError: (err: any) => {
            console.error("Withdraw error:", err);
            setError(err?.detail || err?.error || String(err));
          },
        });
        
        if (!result.success) {
          setError(result.error || "Withdraw failed");
        }
      }
    } catch (err: any) {
      console.error(`${action} error:`, err);
      setError(err.message || `Failed to ${action}`);
    } finally {
      setLoading(false);
    }
  };

  const maxAmount = action === 'deposit' 
    ? channelBalance 
    : (marginBalance ? Number(marginBalance.freeCollateral) / 1e18 : 0);

  if (!isOpen) return null;

  const portalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Portal */}
      <div className="relative bg-[#0A0B0D] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white uppercase tracking-wide">
            Options Margin
          </h2>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white/80 transition-colors"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Explainer */}
        <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="text-white/60 text-sm leading-relaxed">
            {action === 'deposit' ? (
              <>
                <strong className="text-primary">Deposit</strong> USDC from your{" "}
                <span className="text-white/80 font-semibold">Instant Execution Channel</span> into your{" "}
                <span className="text-white/80 font-semibold">Options Trading Margin Account</span> to trade options.
              </>
            ) : (
              <>
                <strong className="text-red-400">Withdraw</strong> available USDC from your{" "}
                <span className="text-white/80 font-semibold">Options Trading Margin Account</span> back to your{" "}
                <span className="text-white/80 font-semibold">Instant Execution Channel</span>.
              </>
            )}
          </div>
        </div>

        {/* Action Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setAction('deposit')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors ${
              action === 'deposit'
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/8'
            }`}
          >
            Deposit
          </button>
          <button
            onClick={() => setAction('withdraw')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors ${
              action === 'withdraw'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/8'
            }`}
          >
            Withdraw
          </button>
        </div>

        {/* Balances */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-white/5 border border-white/8 rounded-lg">
            <div className="text-white/40 text-xs uppercase tracking-wider mb-1">Channel</div>
            <div className="text-white font-mono font-semibold">${channelBalance.toFixed(2)}</div>
          </div>
          <div className="p-3 bg-white/5 border border-white/8 rounded-lg">
            <div className="text-white/40 text-xs uppercase tracking-wider mb-1">Margin Free</div>
            <div className="text-white font-mono font-semibold">
              ${marginBalance ? (Number(marginBalance.freeCollateral) / 1e18).toFixed(2) : '0.00'}
            </div>
          </div>
        </div>

        {/* Amount Input */}
        <div className="mb-4">
          <label className="block text-white/50 text-xs font-medium mb-2 uppercase tracking-wider">
            Amount (USDC)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full h-12 pl-7 pr-20 bg-white/5 border border-white/8 rounded-lg text-white font-mono text-lg placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors"
              step="0.01"
            />
            <button
              onClick={() => setAmount(maxAmount.toFixed(2))}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-primary/20 hover:bg-primary/30 text-primary text-xs font-semibold uppercase tracking-wider rounded transition-colors"
            >
              Max
            </button>
          </div>
          <div className="text-white/30 text-xs mt-1.5">
            Available: ${maxAmount.toFixed(2)}
          </div>
        </div>

        {/* Error/Success */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
            {success}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading || !amount || Number(amount) <= 0}
          className={`w-full py-3 rounded-lg font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
            action === 'deposit'
              ? 'bg-green-500 hover:bg-green-600 text-white disabled:bg-green-500/30 disabled:text-white/50'
              : 'bg-red-500 hover:bg-red-600 text-white disabled:bg-red-500/30 disabled:text-white/50'
          }`}
        >
          {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />}
          {action === 'deposit' ? 'Deposit' : 'Withdraw'}
        </button>
      </div>
    </div>
  );

  return createPortal(portalContent, document.body);
}
