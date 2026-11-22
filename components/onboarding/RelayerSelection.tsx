import React from "react";
import { FaTimes } from "react-icons/fa";

interface Props {
  selectedRelayer: string;
  setSelectedRelayer: (s: string) => void;
  setShowRelayerSelection: (v: boolean) => void;
  proceedToChannelConfig: () => void;
}

export default function RelayerSelection({ selectedRelayer, setSelectedRelayer, setShowRelayerSelection, proceedToChannelConfig }: Props) {
  return (
    <div className="fixed inset-0 z-10001 flex items-center justify-center p-4 pointer-events-auto">
      <div className="absolute inset-0 bg-black/90" onClick={() => setShowRelayerSelection(false)} aria-hidden />
      <div className="relative w-full max-w-md bg-surface border border-white/20 rounded-lg shadow-2xl" role="dialog" aria-modal="true" aria-label="Select relayer">
        <button onClick={() => setShowRelayerSelection(false)} aria-label="Close relayer selection modal" className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors z-10"><FaTimes className="w-4 h-4 text-white/60" /></button>

        <div className="p-6 space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold text-white mb-2 font-sans">Choose a Relayer</h3>
            <p className="text-sm text-white/70 leading-relaxed">Relayers submit the trades on chain</p>
          </div>

          <div onClick={() => setSelectedRelayer("default")} className={`p-4 bg-surface/30 border rounded-lg cursor-pointer transition-all ${selectedRelayer === "default" ? "ring-2 ring-emerald-500 border-emerald-500/50 bg-emerald-500/5" : "border-white/10 hover:border-white/20 hover:bg-surface/40"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-base font-semibold text-white">Default</h4>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedRelayer === "default" ? "border-emerald-500 bg-emerald-500" : "border-white/30"}`}>
                    {selectedRelayer === "default" && (<div className="w-2 h-2 rounded-full bg-white" />)}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded text-xs text-emerald-300 font-medium">No gas fees</span>
                  <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-xs text-blue-300 font-medium">By BrokerFi</span>
                </div>
                <p className="text-xs text-white/60 leading-relaxed">Official BrokerFi relayer with instant trading without gas costs.</p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-white/5 border border-white/10 rounded-lg"><p className="text-xs text-white/50 text-center">Custom/More options coming soon</p></div>
        </div>

        <div className="p-6 pt-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowRelayerSelection(false)} className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors">Cancel</button>
            <button onClick={proceedToChannelConfig} className="flex-1 py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-colors">Continue</button>
          </div>
        </div>
      </div>
    </div>
  );
}
