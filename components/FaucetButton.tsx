"use client";

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import Turnstile from "react-turnstile";
import { FaFaucet, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import { useSession } from "@/store/SessionContext";

const RELAYER_URL =
  process.env.NEXT_PUBLIC_RELAYER_URL ||
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:4001`
    : "http://localhost:4001");

type FaucetState = "idle" | "verifying" | "claiming" | "success" | "error" | "already_claimed";

export default function FaucetButton() {
  const { address, isConnected } = useAccount();
  const { channelAddress } = useSession();
  const [state, setState] = useState<FaucetState>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showCaptcha, setShowCaptcha] = useState(false);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

  // Always use channel address for faucet claims
  const targetAddress = channelAddress;

  const handleClaim = useCallback(async () => {
    if (!targetAddress || !captchaToken) return;

    setState("claiming");
    setError(null);
    setTxHash(null);

    try {
      const res = await fetch(`${RELAYER_URL}/faucet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: targetAddress,
          turnstileToken: captchaToken,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setState("success");
        setTxHash(data.txHash || null);
      } else if (res.status === 409) {
        setState("already_claimed");
        setError(data.error || "Already claimed");
      } else {
        setState("error");
        setError(data.error || "Unknown error");
      }
    } catch (err) {
      setState("error");
      setError(String(err));
    }

    setCaptchaToken(null);
    setShowCaptcha(false);
  }, [targetAddress, captchaToken]);

  const handleStart = () => {
    if (!isConnected) return;
    setShowCaptcha(true);
    setState("verifying");
  };

  const reset = () => {
    setState("idle");
    setError(null);
    setTxHash(null);
    setCaptchaToken(null);
    setShowCaptcha(false);
  };

  // Only show if connected and channel is set
  if (!isConnected || !channelAddress) return null;

  return (
    <div className="broker-card p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 bg-blue-500/15 rounded-lg flex items-center justify-center">
          <FaFaucet className="w-4 h-4 text-blue-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Testnet Faucet</h3>
          <p className="text-[10px] text-white/40">
            Claim 1,000 USDC on Arbitrum Sepolia
          </p>
        </div>
      </div>

      {state === "idle" && (
        <button
          onClick={handleStart}
          className="w-full py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium transition-colors border border-blue-500/20"
        >
          Claim 1,000 USDC
        </button>
      )}

      {state === "verifying" && (
        <div className="space-y-3">
          <p className="text-xs text-white/50 text-center">
            Complete the captcha to proceed
          </p>
          {showCaptcha && siteKey && (
            <div className="flex justify-center">
              <Turnstile
                sitekey={siteKey}
                onVerify={(token) => {
                  setCaptchaToken(token);
                  // Auto-claim after verification
                  setState("claiming");
                  // Small delay to allow state update
                  setTimeout(() => {
                    // Trigger claim via effect — but we need the token directly
                    fetch(`${RELAYER_URL}/faucet`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        wallet: targetAddress,
                        turnstileToken: token,
                      }),
                    })
                      .then((res) => res.json())
                      .then((data) => {
                        if (data.success) {
                          setState("success");
                          setTxHash(data.txHash || null);
                        } else if (data.error?.includes("already claimed")) {
                          setState("already_claimed");
                          setError(data.error);
                        } else {
                          setState("error");
                          setError(data.error || "Unknown error");
                        }
                      })
                      .catch((err) => {
                        setState("error");
                        setError(String(err));
                      })
                      .finally(() => {
                        setShowCaptcha(false);
                        setCaptchaToken(null);
                      });
                  }, 100);
                }}
                onError={() => {
                  setState("error");
                  setError("Captcha verification failed");
                  setShowCaptcha(false);
                }}
                theme="dark"
              />
            </div>
          )}
          <button
            onClick={reset}
            className="w-full py-1.5 text-xs text-white/40 hover:text-white/60 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {state === "claiming" && (
        <div className="flex items-center justify-center gap-2 py-3">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent" />
          <span className="text-sm text-white/60">Sending USDC...</span>
        </div>
      )}

      {state === "success" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <FaCheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-sm text-emerald-400 font-medium">
                1,000 USDC claimed!
              </p>
              {txHash && (
                <a
                  href={`https://sepolia.arbiscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-emerald-400/60 hover:text-emerald-400/80 underline break-all"
                >
                  View transaction
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {state === "already_claimed" && (
        <div className="flex items-center gap-2 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
          <FaExclamationTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          <p className="text-xs text-yellow-400">
            This wallet has already claimed faucet tokens.
          </p>
        </div>
      )}

      {state === "error" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
            <FaExclamationTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-400">{error || "Something went wrong"}</p>
          </div>
          <button
            onClick={reset}
            className="w-full py-2 bg-white/5 hover:bg-white/10 text-white/60 rounded-lg text-xs transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
