"use client";

import React from 'react';

interface OptionContract {
  strike: number;
  bid: number;
  mark: number;
  ask: number;
  lastPrice: number;
  volume: number;
  openInterest: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  impliedVolatility: number;
  breakEven: number;
  isITM: boolean;
  isATM: boolean;
  chanceOfProfit: number;
}

interface ChainViewProps {
  calls: OptionContract[];
  puts: OptionContract[];
  spotPrice: number;
  onSelectOption: (type: "call" | "put", contract: OptionContract, side: "buy" | "sell") => void;
  getMaxFractionDigits?: (price: number) => number;
}

export default function ChainView({
  calls,
  puts,
  spotPrice,
  onSelectOption,
  getMaxFractionDigits,
}: ChainViewProps) {
  // Safety check
  if (!calls || !puts || calls.length === 0 || puts.length === 0 || calls.length !== puts.length) {
    return (
      <div className="text-center text-white/50 py-8">
        No options data available
      </div>
    );
  }

  // Calculate position for current price line
  let lowerIndex = -1;
  if (calls && calls.length > 0 && spotPrice) {
    const strikes = calls.map(call => call.strike);
    for (let i = 0; i < strikes.length - 1; i++) {
      if (spotPrice >= strikes[i] && spotPrice <= strikes[i + 1]) {
        lowerIndex = i;
        break;
      }
    }
  }

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="min-w-full sm:min-w-[1100px] px-4 sm:px-0">
        {/* Headers */}
        <div className="w-max sm:w-auto grid grid-cols-[80px_40px_80px_120px_80px_40px_80px] sm:grid-cols-[1fr_0.5fr_1fr_120px_1fr_0.5fr_1fr] gap-2 sm:gap-3 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-white/10">
          {/* Calls Header */}
          <div className="text-center col-span-3">
            <div className="text-green-500 text-xs sm:text-sm font-bold uppercase tracking-wider mb-2">
              Calls
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px] sm:text-[11px] text-white/50 uppercase tracking-wide">
              <span className="text-orange-500">Bid</span>
              <span className="text-grey-400">Mark</span>
              <span className="text-green-500">Ask</span>
            </div>
          </div>

          {/* Strike Header */}
          <div className="text-center text-white/50 text-xs font-medium uppercase tracking-wider">
            Strike
          </div>

          {/* Puts Header */}
          <div className="text-center col-span-3">
            <div className="text-red-500 text-xs sm:text-sm font-bold uppercase tracking-wider mb-2">
              Puts
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px] sm:text-[11px] text-white/50 uppercase tracking-wide">
              <span className="text-orange-500">Bid</span>
              <span className="text-grey-400">Mark</span>
              <span className="text-green-500">Ask</span>
            </div>
          </div>
        </div>

        {/* Options Grid */}
        <div className="space-y-1 sm:space-y-2">
          {calls.map((call, idx) => {
            const put = puts[idx];

            return (
              <React.Fragment key={idx}>
                <div className="w-max sm:w-auto">
                  <div
                    className="grid grid-cols-[80px_40px_80px_120px_80px_40px_80px] sm:grid-cols-[1fr_0.5fr_1fr_120px_1fr_0.5fr_1fr] gap-2 sm:gap-3 items-center py-1 px-2 rounded-lg transition-all"
                  >
                  {/* Call Bid */}
                  <PriceCell
                    price={call.bid}
                    type="bid"
                    optionType="call"
                    onClick={() => onSelectOption("call", call, "sell")}
                  />

                  {/* Call Mark */}
                  <PriceCell
                    price={call.mark}
                    type="mark"
                    optionType="call"
                    onClick={() => {}}
                  />

                  {/* Call Ask */}
                  <PriceCell
                    price={call.ask}
                    type="ask"
                    optionType="call"
                    onClick={() => onSelectOption("call", call, "buy")}
                  />

                  {/* Strike Price */}
                  <div className="text-center py-2 sm:py-3 font-bold text-sm sm:text-base font-mono text-white">
                    ${(call.strike || 0).toFixed(getMaxFractionDigits ? getMaxFractionDigits(call.strike || 0) : 2)}
                  </div>

                  {/* Put Bid */}
                  <PriceCell
                    price={put.bid}
                    type="bid"
                    optionType="put"
                    onClick={() => onSelectOption("put", put, "sell")}
                  />

                  {/* Put Mark */}
                  <PriceCell
                    price={put.mark}
                    type="mark"
                    optionType="put"
                    onClick={() => {}}
                  />

                  {/* Put Ask */}
                  <PriceCell
                    price={put.ask}
                    type="ask"
                    optionType="put"
                    onClick={() => onSelectOption("put", put, "buy")}
                  />
                  </div>

                  {idx === lowerIndex && lowerIndex !== -1 && (
                    <div className="relative py-2">
                      <div className="absolute inset-0 px-2 sm:px-0 flex items-center pointer-events-none">
                        <div className="w-full border-t-2 border-dotted border-yellow-400 opacity-80"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <div className="text-xs text-yellow-400 font-mono font-bold bg-black/50 px-1 rounded">
                          ${spotPrice.toFixed(getMaxFractionDigits ? getMaxFractionDigits(spotPrice) : 2)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </React.Fragment>
            );
          })}
          
        </div>
      </div>
    </div>
  );
}

function PriceCell({
  price,
  type,
  onClick,
}: {
  price: number;
  type: "bid" | "mark" | "ask";
  optionType: "call" | "put";
  onClick: () => void;
}) {
  const isBid = type === "bid";
  const isMark = type === "mark";

  const displayPrice = isNaN(price) || price === undefined ? 0 : price;

  return (
    <div
      onClick={onClick}
      className={`py-2 sm:py-3 px-2 sm:px-3 rounded-lg transition-all text-center font-mono text-sm sm:text-base font-bold ${
        isMark
          ? "text-gray-400"
          : isBid
          ? "text-orange-500 border border-orange-500/30 hover:border-orange-500/50 cursor-pointer hover:bg-white/5"
          : "text-green-500 border border-green-500/30 hover:border-green-500/50 cursor-pointer hover:bg-white/5"
      }`}
    >
      ${displayPrice.toFixed(2)}
    </div>
  );
}
