import React from "react";
import { FaTimes, FaExclamationTriangle } from "react-icons/fa";
import { BiInfoCircle } from "react-icons/bi";
import { GhostSquare } from "../ui/GhostSquare";
import { shortenAddress } from "./common";

interface Props {
  sessionConfigChannel: `0x${string}` | null;
  setSessionConfigChannel: (v: `0x${string}` | null) => void;
  sessionLength: number;
  setSessionLength: (n: number) => void;
  sessionConnecting: boolean;
  sessionError: string | null;
  setSessionError: (s: string | null) => void;
  advancedOptionsOpen: boolean;
  setAdvancedOptionsOpen: (v: boolean) => void;
  connectToChannel: () => Promise<void>;
}

export default function SessionConfig({
  sessionConfigChannel,
  setSessionConfigChannel,
  sessionLength,
  setSessionLength,
  sessionConnecting,
  sessionError,
  setSessionError,
  advancedOptionsOpen,
  setAdvancedOptionsOpen,
  connectToChannel,
}: Props) {
  if (!sessionConfigChannel) return null;

  return (
    <div className="fixed inset-0 z-10001 flex items-center justify-center p-4 pointer-events-auto">
      <div className="absolute inset-0 bg-black/90" onClick={() => setSessionConfigChannel(null)} aria-hidden />
      <div className="relative w-full max-w-md bg-surface border border-white/20 rounded-lg shadow-2xl" role="dialog" aria-modal="true" aria-label="Configure session">
        <button onClick={() => setSessionConfigChannel(null)} aria-label="Close session config modal" className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors z-10"><FaTimes className="w-4 h-4 text-white/60" /></button>

        <div className="p-6 space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold text-white mb-2 font-sans">Connect to Channel</h3>
            <p className="text-sm text-white/70 leading-relaxed">Ready to start trading on this channel</p>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-md">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/60">Channel:</span>
              <span className="font-mono text-sm text-white" title={sessionConfigChannel}>{shortenAddress(sessionConfigChannel)}</span>
            </div>
            <button onClick={() => navigator.clipboard?.writeText(sessionConfigChannel ?? "")} className="text-xs text-white/70 bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-colors" aria-label="Copy channel address">Copy</button>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg"><div className="flex items-start gap-2"><FaExclamationTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" /><p className="text-xs text-amber-200/80 leading-relaxed">Only connect on trusted devices. Session expires when you close your browser.</p></div></div>

          <div>
            <button onClick={() => setAdvancedOptionsOpen(!advancedOptionsOpen)} className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"><span>Advanced Options</span><svg className={`w-4 h-4 transition-transform ${advancedOptionsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></button>

            {advancedOptionsOpen && (
              <div className="mt-3 p-3 bg-white/5 border border-white/10 rounded-md space-y-3">
                <div>
                  <label className="text-xs text-white/60 block mb-2">Session Length</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[{ value: 30, label: "30 min" },{ value: 60, label: "1 hour" },{ value: 120, label: "2 hours" },{ value: 240, label: "4 hours" },{ value: 480, label: "8 hours" },{ value: 1440, label: "24 hours" }].map((option) => (
                      <button key={option.value} onClick={() => setSessionLength(option.value)} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${sessionLength === option.value ? "bg-emerald-500 text-white" : "bg-white/10 text-white/80 hover:bg-white/20"}`}>{option.label}</button>
                    ))}
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white text-sm mt-2">Selected: {sessionLength === 30 ? "30 minutes" : sessionLength === 60 ? "1 hour" : sessionLength === 120 ? "2 hours" : sessionLength === 240 ? "4 hours" : sessionLength === 480 ? "8 hours" : sessionLength === 720 ? "12 hours" : sessionLength === 1440 ? "24 hours" : `${sessionLength} minutes`}</div>
                </div>
              </div>
            )}
          </div>

          {sessionError && (<div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3"><div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center mt-0.5 shrink-0"><div className="w-2 h-2 rounded-full bg-red-400" /></div><div className="flex-1 min-w-0"><h4 className="text-sm font-medium text-red-300 mb-1">Connection Error</h4><p className="text-sm text-red-200/90 wrap-break-word">{sessionError}</p></div><button onClick={() => setSessionError(null)} className="text-red-300/80 hover:text-red-200 p-1" aria-label="Dismiss error"><FaTimes className="w-3 h-3" /></button></div>)}

          {sessionConnecting && (<div className="flex items-center justify-center py-4"><div className="flex items-center gap-3"><div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /><span className="text-sm text-white/70">Connecting to channel...</span></div></div>)}
        </div>

        <div className="p-6 pt-0">
          <button onClick={connectToChannel} disabled={sessionConnecting} className="w-full py-3 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 disabled:cursor-not-allowed text-white font-semibold transition-colors">{sessionConnecting ? "Connecting..." : "Connect & Sign"}</button>
          <p className="text-xs text-white/50 mt-2 text-center">Sign with your wallet to establish the session</p>
        </div>
      </div>
    </div>
  );
}
