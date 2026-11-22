"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FaTimes,
  FaExclamationTriangle,
  FaRocket,
  FaArrowRight,
} from "react-icons/fa";
import Portal from "../ui/Portal";

const STORAGE_KEY = "brokerfi_options_welcome_dismissed";

interface OptionsWelcomePortalProps {
  onComplete?: () => void;
}

export default function OptionsWelcomePortal({ onComplete }: OptionsWelcomePortalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (dismissed !== "true") {
        setIsOpen(true);
      }
    } catch {
      // localStorage unavailable — don't show
    }
  }, []);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {}
    setIsOpen(false);
    onComplete?.();
  }, [onComplete]);

  const navigateToPerps = () => {
    dismiss();
    window.location.href = "/perpetual/ETH";
  };

  if (!isOpen) return null;

  return (
    <Portal>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[10002] bg-black/80 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[10003] flex items-center justify-center p-4">
        <div
          className="w-full max-w-lg bg-surface border border-white/15 rounded-xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 pt-5 pb-4 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-yellow-500/15 rounded-lg flex items-center justify-center">
                <FaExclamationTriangle className="w-4 h-4 text-yellow-400" />
              </div>
              <h2 className="text-lg font-bold text-white font-sans">
                Welcome to Options!
              </h2>
            </div>
            <button
              onClick={dismiss}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Dismiss options welcome"
            >
              <FaTimes className="w-3.5 h-3.5 text-white/50" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            <div className="space-y-4">
              {/* Early Access Warning */}
              <div className="flex items-start gap-3 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <FaExclamationTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-white mb-2">
                    Early Access
                  </div>
                  <div className="text-xs text-white/60 leading-relaxed space-y-2">
                    <p>
                      Options trading is currently in <b>early access</b>. While we're excited to have you try it out, please be aware that you may encounter bugs and technical issues.
                    </p>
                    <p>
                      <b>Important:</b> Order matching may be slower than expected or orders may not match at all due to limited liquidity during this testing phase.
                    </p>
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              <div className="flex items-start gap-3 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <FaRocket className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-white mb-2">
                    We Recommend
                  </div>
                  <div className="text-xs text-white/60 leading-relaxed space-y-2">
                    <p>
                      For the best trading experience, we highly recommend trying <b>Vibetrader</b> with <b>Perpetuals</b>. It's our most polished product with reliable execution and AI-powered trading.
                    </p>
                  </div>
                </div>
              </div>

              {/* Info */}
              <p className="text-white/50 text-xs leading-relaxed">
                Thank you for being an early tester! Your feedback helps us improve. If you experience any issues, please reach out to{" "}
                <a 
                  href="https://x.com/samcleth" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  @samcleth
                </a>
                {" "}on X.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/[0.06] flex items-center justify-between">
            <button
              onClick={dismiss}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white/60 hover:text-white/80 transition-colors rounded-lg hover:bg-white/5"
            >
              Continue to Options
            </button>
            <button
              onClick={navigateToPerps}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              <span>Try Vibetrader + Perps</span>
              <FaArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
