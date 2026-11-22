"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FaTimes,
  FaArrowRight,
  FaArrowLeft,
  FaPlay,
  FaRocket,
  FaShieldAlt,
  FaChartLine,
  FaCheck,
  FaExclamationTriangle,
  FaCogs,
} from "react-icons/fa";
import Portal from "../ui/Portal";

const STORAGE_KEY = "brokerfi_welcome_dismissed";

interface WelcomePortalProps {
  onComplete?: () => void;
}

// ── Step content ─────────────────────────────────────────────────────────

const steps = [
  {
    id: "welcome",
    title: "Welcome to BrokerFi",
    icon: FaRocket,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/15",
    content: (
      <>
        <p className="text-white/70 text-sm leading-relaxed mb-4">
          You are about to enter the BrokerFi testnet. All actions are executed
          on the <b>Arbitrum Sepolia</b> blockchain.
        </p>
        <p className="text-white/70 text-sm leading-relaxed">
          tl;dr: BrokerFi is in alpha, so expect a few bugs and rough edges :).
          <br />{" "}
          <span>
            <b>
              If you experience a bug, please just DM me on X:{" "}
              <a href="https://x.com/samcleth" target="_blank">
                @samcleth
              </a>
            </b>
            . Feel free to follow me on X too, I plan to share updates
            frequently!
          </span>
        </p>
      </>
    ),
  },
  {
    id: "how-it-works",
    title: "How It Works",
    icon: FaPlay,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/15",
    content: (
      <>
        <p className="text-white/70 text-sm leading-relaxed mb-4">
          A little about myself: I'm Sam, I'm 15 years old and I've been
          building BrokerFi for the past 3 months.
          <br />
          <br />
          <b>Here's a quick breakdown of what I've built</b>
          <li className="ml-6 mt-2">
            <b>Perpetual Futures</b> ETH and BTC are available. We will have
            100+ stocks, crypto and commodity pairs available soon.
          </li>
          <li className="ml-6 mt-1">
            <b>Vibetrading</b> The first exchange with built in agentic trading.
            Grok can trade for you. Seriously.{" "}
            <b>Give it a try, it's pretty damn cool.</b>
          </li>
          <li className="ml-6 mt-1">
            <b>Options</b> The best selection of options, all powered by the
            blockchain with self custody. Permissionless market creation for
            crypto, RWAs powered by a on-chain CLOB on Arbitrum.
          </li>
        </p>
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-white/5 border border-white/10 mb-4">
          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-white/5 border border-white/10 mb-4">
            <iframe
              className="absolute inset-0 w-full h-full"
              title="YouTube: product walkthrough"
              src="https://www.youtube-nocookie.com/embed/W_4tTpPmrjQ"
              srcDoc={`
      <style>
        * {padding:0;margin:0;overflow:hidden;background:#000}
        html,body {height:100%}
        img {
          position:absolute;
          width:100%;
          top:0;bottom:0;margin:auto;
          object-fit:cover;
          opacity:0.7;
          transition:opacity 0.2s
        }
        a:hover img {opacity:1}
        span {
          position:absolute;
          width:100%;
          top:50%;left:50%;
          transform:translate(-50%,-50%);
          text-align:center;
          font:60px/1.5 sans-serif;
          color:white;
          text-shadow:0 0 15px rgba(0,0,0,0.7);
          cursor:pointer;
        }
      </style>

      <a href="https://www.youtube-nocookie.com/embed/W_4tTpPmrjQ?autoplay=1">
        <img src="https://img.youtube.com/vi/W_4tTpPmrjQ/maxresdefault.jpg" alt="Video Preview">
        <span>▶</span>
      </a>
    `}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              frameBorder="0"
            ></iframe>

            {/* Label Overlay */}
            <div className="absolute bottom-4 w-full text-center pointer-events-none">
              <span className="text-white/40 text-xs font-sans">
                YouTube: product walkthrough and an intro from myself :)
              </span>
            </div>
          </div>
        </div>
      </>
    ),
  },
  {
    id: "instant-execution",
    title: "InstantExecution Channels",
    icon: FaShieldAlt,
    iconColor: "text-purple-400",
    iconBg: "bg-purple-500/15",
    content: (
      <>
        <p className="text-white/70 text-sm leading-relaxed mb-3">
          When you transact on the platform, you don't interact with a wallet
          manually like a traditional DEX. Instead, you create a self custody
          channel that lives on-chain. It means you can trade gas-free and
          without manually signing transactions, as the relayer submits them.
        </p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          {[
            {
              label: "Session Keys",
              desc: "Temporary key pairs stored locally on your device for 8 hours by default.",
            },
            {
              label: "Channel Connection",
              desc: "Gasless transaction that submits your public session key on-chain.",
            },
            {
              label: "Relayer",
              desc: "Run by BrokerFi. We don't access your private keys or funds, we just submit your trades on-chain for you.",
            },
            {
              label: "Sub-second Fills",
              desc: "Since you don't have to sign transactions every trade, trades are filled in under 1 second.",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="p-3 bg-white/3 rounded-lg border border-white/6"
            >
              <div className="text-xs font-semibold text-white mb-1">
                {item.label}
              </div>
              <div className="text-[10px] text-white/40 leading-snug">
                {item.desc}
              </div>
            </div>
          ))}
        </div>
        <p className="text-white/50 text-xs">
          You will need to create a channel before you can trade. It will take
          under 20 seconds to do, don't worry :).
        </p>
      </>
    ),
  },
  {
    id: "products",
    title: "Product Availability",
    icon: FaChartLine,
    iconColor: "text-yellow-400",
    iconBg: "bg-yellow-500/15",
    content: (
      <>
        <p className="text-white/70 text-sm leading-relaxed mb-3">
          All products are in active development and are available. Try
          Vibetrader first.
        </p>
        <div className="space-y-3 mb-3">
          <div className="flex items-start gap-3 p-3 bg-emerald-500/10 rounded-lg border border-blue-500/10">
            <FaCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-white mb-0.5">
                Vibetrader Agent
              </div>
              <div className="text-xs text-white/40">
                Available for free, no limits. Fully available for perpetuals.
                <br className="pt-16" />
                <b className="hidden sm:inline">
                  Access Vibetrader by clicking the icon in the top right of the
                  navigation bar.
                </b>
                <b className="sm:hidden">
                  Access Vibetrader by using the bottom right icon on Mobile.
                </b>
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-emerald-500/10 rounded-lg border border-blue-500/10">
            <FaCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-white mb-0.5">
                Perpetual Futures
              </div>
              <div className="text-xs text-white/40">
                Available on ETH and BTC.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-yellow-500/15 rounded-lg border border-blue-500/10">
            <FaCheck className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-white mb-0.5">
                Liquidity Provision
              </div>
              <div className="text-xs text-white/40">
                Earnings & yield data may not be visible/accurate.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-red-500/10 rounded-lg border border-emerald-500/10">
            <FaExclamationTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-white mb-0.5">
                On-Chain Options
              </div>
              <div className="text-xs text-white/40">
                Limited. Matching may be slower than expected and price data may
                not be correctly indexed from the blockchain.
              </div>
            </div>
          </div>
        </div>
      </>
    ),
  },
  {
    id: "get-started",
    title: "Get Started",
    icon: FaCogs,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/15",
    content: (
      <>
        <div className="space-y-2 mb-4">
          {[
            "Connect your wallet or sign in with a social login.",
            "Create an InstantExecution channel",
            "Use the faucet to get BrokerFi tUSDC for free",
          ].map((step, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-2.5 bg-white/3 rounded-lg"
            >
              <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center shrink-0">
                <span className="text-emerald-400 text-xs font-bold">
                  {i + 1}
                </span>
              </div>
              <span className="text-sm text-white/70">{step}</span>
            </div>
          ))}
        </div>
      </>
    ),
  },
];

// ── Component ────────────────────────────────────────────────────────────

export default function WelcomePortal({ onComplete }: WelcomePortalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

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

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      dismiss();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  if (!isOpen) return null;

  const step = steps[currentStep];
  const Icon = step.icon;
  const isLast = currentStep === steps.length - 1;

  return (
    <Portal>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-10002 bg-black/80 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-10003 flex items-center justify-center p-4">
        <div
          className="w-full max-w-lg bg-surface border border-white/15 rounded-xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 pt-5 pb-4 border-b border-white/6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 ${step.iconBg} rounded-lg flex items-center justify-center`}
              >
                <Icon className={`w-4 h-4 ${step.iconColor}`} />
              </div>
              <h2 className="text-lg font-bold text-white font-sans">
                {step.title}
              </h2>
            </div>
            <button
              onClick={dismiss}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Dismiss welcome guide"
            >
              <FaTimes className="w-3.5 h-3.5 text-white/50" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
            {step.content}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/6 flex items-center justify-between">
            {/* Step indicators */}
            <div className="flex items-center gap-1.5">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    i === currentStep
                      ? "w-6 bg-emerald-400"
                      : i < currentStep
                        ? "w-1.5 bg-emerald-400/40"
                        : "w-1.5 bg-white/15"
                  }`}
                  aria-label={`Go to step ${i + 1}`}
                />
              ))}
              <span className="ml-2 text-[10px] text-white/30 font-mono">
                {currentStep + 1}/{steps.length}
              </span>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  onClick={prevStep}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white/60 hover:text-white/80 transition-colors rounded-lg hover:bg-white/5"
                >
                  <FaArrowLeft className="w-3 h-3" />
                  <span>Back</span>
                </button>
              )}
              <button
                onClick={nextStep}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isLast
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                    : "bg-white/10 hover:bg-white/15 text-white"
                }`}
              >
                <span>{isLast ? "Start Trading" : "Next"}</span>
                <FaArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
