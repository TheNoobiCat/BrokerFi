interface LeverageSelectorProps {
  leverage: number;
  onLeverageChange: (value: number) => void;
  maxLeverage: number;
}

function getRiskLevel(leverage: number) {
  // Return classes for pill background, text and border so pill is visible but not oversized
  if (leverage === 1)
    return { label: 'Baseline', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/10' };
  if (leverage <= 5)
    return { label: 'Elevated', bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/10' };
  if (leverage <= 19)
    return { label: 'High', bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/10' };
  // Very High starts at 20x
  return { label: 'Very High', bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/10' };
}

import { useEffect } from 'react';

export default function LeverageSelector({ leverage, onLeverageChange, maxLeverage }: LeverageSelectorProps) {
  const leverageOptions = [1, 2, 5, 10, 15, 20, 30, 50].filter(lev => lev <= maxLeverage);
  
  // Ensure current leverage is not higher than max allowed
  const effectiveLeverage = Math.min(leverage, maxLeverage);
  const effectiveMaxLeverage = Math.max(maxLeverage, 1); // Ensure at least 1
  
  // Adjust leverage if maxLeverage changes and current leverage is too high
  useEffect(() => {
    if (leverage > maxLeverage) {
      onLeverageChange(maxLeverage);
    }
  }, [leverage, maxLeverage, onLeverageChange]);
  
  const risk = getRiskLevel(effectiveLeverage);

  return (
    <div className="mb-4 lg:mb-6">
      <div className="mb-4">
        <label className="text-xs lg:text-sm text-white/60 mb-2 block font-sans">
          Leverage: <span className="font-mono text-primary">{effectiveLeverage}x</span>
          <span className="mx-2 text-white/40">·</span>
          <span className={`${risk.bg} ${risk.text} px-2 py-0.5 rounded-full text-xs font-semibold border ${risk.border}`}>{risk.label}</span>
        </label>
      </div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {leverageOptions.map((lev) => (
          <button
            key={lev}
            onClick={() => onLeverageChange(lev)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border border-white/10 bg-transparent text-white/90 hover:bg-white/5 transition-colors shadow-sm ${
              effectiveLeverage === lev
                ? "bg-linear-to-r from-amber-500 to-orange-500 text-white ring-1 ring-amber-300"
                : ""
            }`}
          >
            {lev}x
          </button>
        ))}
      </div>

      {/* Styled leverage slider */}
      <div className="relative mb-3">
        <div className="w-full h-3 bg-white/6 rounded-full relative">
          <div
            className="absolute left-0 top-0 bottom-0 rounded-full"
            style={{
              width: `${((effectiveLeverage - 1) / (effectiveMaxLeverage - 1)) * 100}%`,
              background: "#f97316",
            }}
          />
          <div
            className="absolute top-1/2 transform -translate-y-1/2"
            style={{ left: `${((effectiveLeverage - 1) / (effectiveMaxLeverage - 1)) * 100}%` }}
          >
            <div className="w-4 h-4 bg-orange-400 rounded-full ring-2 ring-orange-600 shadow-md -translate-x-1/2" />
          </div>
          <input
            type="range"
            min="1"
            max={effectiveMaxLeverage}
            step="1"
            value={effectiveLeverage}
            onChange={(e) => onLeverageChange(parseInt(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <div className="flex justify-between text-xs text-white/40 mt-2 font-mono">
          <span>1x</span>
          <span>{effectiveMaxLeverage}x</span>
        </div>
      </div>
    </div>
  );
}