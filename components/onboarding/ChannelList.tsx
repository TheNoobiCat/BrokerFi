import React, { useEffect, useState } from "react";
import { GhostSquare } from "../ui/GhostSquare";
import { shortenAddress } from "./common";
import { useUI } from '@/store/UIContext';
import Turnstile from "react-turnstile";

// Cloudflare Turnstile component

interface Props {
  channel: any;
  availableChannels: `0x${string}`[];
  channelBalances: Record<string, string>;
  activeChannel: `0x${string}` | undefined | null;
  openSessionConfig: (addr: `0x${string}`) => void;
  sessionConnecting: boolean;
  sessionConfigChannel: `0x${string}` | null;
  creatingAdditionalChannel: boolean;
  handleCreateChannel: () => Promise<void>;
  connectError: string | null;
  setConnectError: (v: string | null) => void;
  onRoadmapComplete?: (done: boolean) => void;
  captchaToken: string | null;
  setCaptchaToken: (token: string | null) => void;
  captchaError: string | null;
  setCaptchaError: (error: string | null) => void;
  onOpenDepositOptions: (channelAddr: `0x${string}`) => void;
}

export default function ChannelList({
  channel,
  availableChannels,
  channelBalances,
  activeChannel,
  openSessionConfig,
  sessionConnecting,
  sessionConfigChannel,
  creatingAdditionalChannel,
  handleCreateChannel,
  connectError,
  setConnectError,
  onRoadmapComplete,
  captchaToken,
  setCaptchaToken,
  captchaError,
  setCaptchaError,
  onOpenDepositOptions,
}: Props) {
  const { openBridge, setBridgeChannel } = useUI();
  const [showBullets, setShowBullets] = useState(false);
  const [showCreateArea, setShowCreateArea] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [userInteracted, setUserInteracted] = useState(false);
  const [isCreateExpanded, setIsCreateExpanded] = useState(false);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const stepRefs = React.useRef<Array<HTMLDivElement | null>>([]);
  const timersRef = React.useRef<number[]>([]);
  const doneTimerRef = React.useRef<number | undefined>(undefined);
  const roadmapSteps = [
      {
        label: 'No gas fees',
        title: 'Instant trading',
        desc: "Orders execute immediately through your channel. You don't need to approve every single trade in your wallet manually as the channel securely handles them!",
      },
      {
        label: 'Multiple assets',
        title: 'Easy deposits',
        desc: 'Once set up, you can buy USDC directly or deposit multiple crypto assets into your channel from popular chains',
      },
  ];

  useEffect(() => {
    const t1 = window.setTimeout(() => setShowBullets(true), 120);
    const t2 = window.setTimeout(() => setShowCreateArea(true), 420);
    // Roadmap animation: steps over ~20 seconds total
    const steps = roadmapSteps.length;
    const totalMs = 20000;
    const per = Math.floor(totalMs / steps);
    timersRef.current = [];
    for (let i = 0; i < steps; i++) {
      const t = window.setTimeout(() => {
        setActiveStep(i);
      }, 200 + i * per);
      timersRef.current.push(t);
    }
    // Notify parent immediately that the roadmap does not need to finish
    // before the Create button becomes available. This lets users press
    // "Create Channel Now" without waiting for the full animation.
    onRoadmapComplete?.(true);
    doneTimerRef.current = window.setTimeout(() => {
      setActiveStep(steps - 1);
      onRoadmapComplete?.(true);
    }, 200 + totalMs + 20);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      timersRef.current.forEach((id) => clearTimeout(id));
      if (doneTimerRef.current) clearTimeout(doneTimerRef.current);
      timersRef.current = [];
      doneTimerRef.current = undefined;
    };
  }, []);

  // scroll the active step into view smoothly when it changes
  useEffect(() => {
    if (activeStep >= 0 && stepRefs.current[activeStep] && containerRef.current) {
      stepRefs.current[activeStep]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [activeStep]);

  const clearAutoTimers = () => {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];
    if (doneTimerRef.current) {
      clearTimeout(doneTimerRef.current);
      doneTimerRef.current = undefined;
    }
  };

  // If the user interacts with the roadmap or the create area is shown,
  // stop the automatic animation and mark the roadmap as complete so the
  // Create button becomes available immediately.
  useEffect(() => {
    if (userInteracted || showCreateArea) {
      clearAutoTimers();
      onRoadmapComplete?.(true);
    }
  }, [userInteracted, showCreateArea, onRoadmapComplete]);
  return (
    <div>
      <div className="text-center mb-6">
        <h3 className="text-lg font-bold text-white mb-2 font-sans">
          {channel.status === "loading" ? "Connect to BrokerFi" : channel.status === "deployed" ? "Choose a Channel" : "Trading Setup"}
        </h3>
        <p className="text-sm text-white/70 mb-4 leading-relaxed">
          {channel.status === "loading"
            ? "Fetching available InstantExecution channels"
            : channel.status === "deployed"
            ? "Connect to your InstantExecution channel to trade instantly and securely."
            : "Create an InstantExecution channel. It's your self custody trading account for fast trading of Options and Perps on BrokerFi."}
        </p>
      </div>

      <div className="mb-6 p-4 bg-surface/30 border border-white/5 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm text-white/60 font-sans">Channel Status</span>
          <span className="text-sm text-white font-mono">
            {channel.status === "notcreated" && "Not Deployed"}
            {channel.status === "creating" && "Creating..."}
            {channel.status === "relayer_accepted" && "Relayer Accepted"}
            {channel.status === "pending_block" && "Pending Block"}
            {channel.status === "batch_processing" && "Batch Processing"}
            {channel.status === "deployed" && "Deployed"}
            {channel.status === "error" && "Error"}
            {channel.status === "loading" && <GhostSquare size="lg" />}
          </span>
        </div>
      </div>

      {channel.status === "deployed" ? (
        <>
          <div className="grid grid-cols-1 gap-4">
            {availableChannels.map((channelAddress) => {
              const chBal = channelBalances[channelAddress];
              const isZero = chBal === undefined ? false : Number(chBal) === 0;
              const isActive = activeChannel === channelAddress;
              return (
                <div key={channelAddress} className={`p-4 bg-surface/30 border border-white/5 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${isActive ? 'ring-2 ring-blue-500 bg-white/2' : ''}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
                    <div className="text-sm text-white font-mono break-all truncate" title={channelAddress}>{shortenAddress(channelAddress)}</div>
                    <div className="text-xs text-white/60 ml-0 sm:ml-2 min-w-0">
                      <div className="leading-tight">Balance:</div>
                      <div className="text-sm font-mono text-white mt-0.5 truncate max-w-56 sm:max-w-56">{chBal === undefined ? <GhostSquare size="sm" /> : `$${chBal}`}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isActive ? (
                      <>
                        <button onClick={() => onOpenDepositOptions(channelAddress)} className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-black text-sm font-medium rounded-md shadow-sm transition-all whitespace-nowrap">Deposit</button>
                      </>
                    ) : (
                      <>
                        {isZero ? (
                          <button 
                            onClick={() => onOpenDepositOptions(channelAddress)}
                            className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-md shadow-md transition-all"
                          >
                            Deposit Required
                          </button>
                        ) : (
                          <button
                            onClick={() => openSessionConfig(channelAddress)}
                            disabled={sessionConnecting && sessionConfigChannel === channelAddress}
                            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-md shadow-md transition-all disabled:opacity-60"
                          >
                            {sessionConnecting && sessionConfigChannel === channelAddress ? "Connecting..." : "Connect"}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {connectError && (
            <div className="mt-3 mb-2 p-3 bg-red-800/30 rounded flex items-start justify-between gap-3">
              <div className="text-sm text-red-200">{connectError}</div>
              <button onClick={() => setConnectError(null)} className="text-red-200/80 hover:text-red-100" aria-label="Dismiss connect error">×</button>
            </div>
          )}

          {channel.status !== "batch_processing" && channel.status !== "relayer_accepted" && !creatingAdditionalChannel && (
            <div className={`mt-4 transition-all duration-500 transform ${showCreateArea ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
              <div className="p-4 bg-surface/20 border border-white/6 rounded-lg flex flex-col items-center gap-3 text-center overflow-visible">
                {!isCreateExpanded ? (
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setIsCreateExpanded(true)}
                      className="inline-block px-6 py-3 min-w-55 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-md transition-colors"
                    >
                      Create Additional Channel
                    </button>
                    <div className="relative group">
                      <div className="flex items-center justify-center w-6 h-6 bg-white/10 rounded-full text-white/70 cursor-pointer group-hover:bg-white/20"><span className="text-sm font-bold">?</span></div>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-sm rounded-lg p-3 shadow-lg w-80 text-center whitespace-normal wrap-break-word z-50">Create another channel to keep activity separate and simplify workflow. Channels do not share open positions or balances. Creating a channel only requires a signature; a relayer submits the on-chain deployment gaslessly for you.</div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Captcha widget */}
                    <div className="w-full max-w-xs">
                      <Turnstile
                        sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
                        onVerify={setCaptchaToken}
                        onError={(error) => setCaptchaError(error.toString())}
                        onExpire={() => {
                          setCaptchaToken(null);
                          setCaptchaError(null);
                        }}
                        theme="dark"
                      />
                      {captchaError && (
                        <div className="mt-2 text-sm text-red-400 text-center">
                          {captchaError}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <button
                        onClick={async () => { await handleCreateChannel(); }}
                        disabled={creatingAdditionalChannel || !captchaToken}
                        className="inline-block px-6 py-3 min-w-55 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-60"
                      >
                        {creatingAdditionalChannel ? "Creating..." : "Create Additional Channel"}
                      </button>
                      <button
                        onClick={() => setIsCreateExpanded(false)}
                        className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-sm font-medium rounded-md transition-colors"
                      >
                        Cancel
                      </button>
                      <div className="relative group">
                        <div className="flex items-center justify-center w-6 h-6 bg-white/10 rounded-full text-white/70 cursor-pointer group-hover:bg-white/20"><span className="text-sm font-bold">?</span></div>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-sm rounded-lg p-3 shadow-lg w-80 text-center whitespace-normal wrap-break-word z-50">Create another channel to keep activity separate and simplify workflow. Channels do not share open positions or balances. Creating a channel only requires a signature; a relayer submits the on-chain deployment gaslessly for you.</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      ) : channel.status !== "loading" && channel.status !== "batch_processing" ? (
        <>
          <div className="mb-6">
              <div ref={containerRef} className="flex items-center gap-4 overflow-x-auto py-2">
                {roadmapSteps.map((s, i) => (
                  <div
                    key={s.label}
                    ref={(el) => { stepRefs.current[i] = el }}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setActiveStep(i);
                      setUserInteracted(true);
                      clearAutoTimers();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveStep(i);
                        setUserInteracted(true);
                        clearAutoTimers();
                      }
                    }}
                    className="flex-shrink-0 flex items-start gap-3 min-w-[220px] p-3 cursor-pointer"
                  >
                    <div className={`w-12 aspect-square flex-none rounded-full flex items-center justify-center text-sm font-medium transition-all duration-600 ${activeStep >= i ? 'bg-emerald-500 text-white shadow-2xl' : 'bg-white/8 text-white/60'}`}>
                      {i + 1}
                    </div>
                    <div className="text-sm">
                      <div className={`${activeStep >= i ? 'text-white font-semibold' : 'text-white/60'} whitespace-normal`}>{s.title}</div>
                      <div className="text-xs text-white/60 whitespace-normal mt-1">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="h-0.5 bg-white/6 rounded-full mt-2 overflow-hidden">
                <div className="bg-emerald-500 h-0.5 rounded-full" style={{ width: `${Math.max(0, Math.min(100, ((activeStep + 1) / roadmapSteps.length) * 100))}%`, transition: 'width 800ms cubic-bezier(.2,.9,.2,1)' }} />
              </div>
              <div className="mt-3 p-3 bg-surface/10 border border-white/6 rounded-md text-sm text-white/70 transition-all duration-400">
                <div className={`transition-opacity duration-400 ${activeStep >= 0 ? 'opacity-100' : 'opacity-0'}`}>
                  {activeStep >= 0 ? (
                    <div>
                      <div className="text-white font-semibold mb-1">{roadmapSteps[Math.min(activeStep, roadmapSteps.length - 1)].title}</div>
                      <div className="text-xs text-white/70">{roadmapSteps[Math.min(activeStep, roadmapSteps.length - 1)].desc}</div>
                    </div>
                  ) : (
                    <div></div>
                  )}
                </div>
              </div>
            </div>

          {channel.status === "error" && (<div className="mb-4 p-3 bg-red-800/30 rounded"><p className="text-xs text-red-200">{channel.message}<br/> <span className="text-orange-300">This may be an issue with your connected wallet</span></p></div>)}
        </>
      ) : null}
    </div>
  );
}
