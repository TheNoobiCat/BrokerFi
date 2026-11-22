"use client";

import { FaCheckCircle, FaCopy, FaExternalLinkAlt } from "react-icons/fa";
import { useState, useEffect } from "react";

interface SessionConnectedProps {
  txHash: string;
  expiry: bigint;
  onContinue: () => void;
}

const shortenAddress = (addr: string) => {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
};

export default function SessionConnected({
  txHash,
  expiry,
  onContinue
}: SessionConnectedProps) {
  const [copied, setCopied] = useState(false);
  const [hoursLeft, setHoursLeft] = useState(0);

  useEffect(() => {
    const calculateHoursLeft = () => {
      const now = Math.floor(Date.now() / 1000);
      const expiryTime = Number(expiry);
      const hours = Math.max(0, Math.floor((expiryTime - now) / 3600));
      setHoursLeft(hours);
    };

    calculateHoursLeft();
    const interval = setInterval(calculateHoursLeft, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [expiry]);

  const handleCopyTxHash = async () => {
    await copyToClipboard(txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-10002 flex items-center justify-center p-4 pointer-events-auto">
      <div className="absolute inset-0 bg-black/90" aria-hidden />
      <div className="relative w-full max-w-md bg-surface border border-white/20 rounded-lg shadow-2xl">
        {/* Header */}
        <div className="p-6 space-y-4">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <FaCheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 font-sans">Session Started</h3>
            <p className="text-sm text-white/70 leading-relaxed">Your trading session is now active</p>
          </div>

          {/* Transaction Hash */}
          <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-md">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/60">Transaction:</span>
              <code className="font-mono text-sm text-white">{shortenAddress(txHash)}</code>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopyTxHash}
                className="text-xs text-white/70 bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-colors"
                title="Copy transaction hash"
              >
                {copied ? "✓" : "Copy"}
              </button>
              <a
                href={`https://sepolia.arbiscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-white/70 hover:text-white transition-colors rounded hover:bg-white/10"
                title="View on Explorer"
              >
                <FaExternalLinkAlt className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Session Info */}
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-emerald-300 font-medium">Session expires in:</span>
              <span className="text-sm font-semibold text-emerald-400">{hoursLeft} hours</span>
            </div>
            <div className="text-xs text-emerald-200/70 space-y-0.5">
              <div>• Session ends when you close your browser</div>
              <div>• Reconnect anytime to resume trading</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0">
          <button
            onClick={onContinue}
            className="w-full py-3 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-colors"
          >
            Continue to Trading
          </button>
        </div>
      </div>
    </div>
  );
}