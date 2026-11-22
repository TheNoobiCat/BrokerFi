'use client';

import { useState, useEffect } from 'react';
import Portal from '../ui/Portal';

interface Position {
  id: string;
  symbol: string;
  type: 'long' | 'short';
  size: number;
  leverage: number;
  openPrice: number;
  currentPrice: number;
  pnl: number;
}

interface ClosePositionModalProps {
  position: Position | null;
  onClose: () => void;
  onConfirm: (positionId: string) => void;
  isClosing: boolean;
}

export default function ClosePositionModal({ position, onClose, onConfirm }: ClosePositionModalProps) {
  const [estimatedPayout, setEstimatedPayout] = useState<number>(0);
  const [tradingFee, setTradingFee] = useState<number>(0);
  const [priceImpactFee, setPriceImpactFee] = useState<number>(0);
  const [roi, setRoi] = useState<number>(0);

  useEffect(() => {
    if (!position) return;

    // Calculate position details
    const positionValue = position.size * position.currentPrice;
    const collateral = positionValue / position.leverage;
    
    // Trading fee: 0.035% of position value (from contract: 3.5 basis points)
    const tradingFeeAmount = positionValue * 0.00035;
    
    // Price impact fee estimation (simplified - actual calculation is more complex)
    // From contract: based on market imbalance and position size
    // Using a simplified estimate of 0.01-0.1% based on size
    const priceImpactBps = Math.min(10, (positionValue / 100000) * 5); // Estimate
    const priceImpactFeeAmount = positionValue * (priceImpactBps / 10000);
    
    const totalFees = tradingFeeAmount + priceImpactFeeAmount;
    
    // Calculate payout based on PnL
    let payout: number;
    if (position.pnl > 0) {
      // Profit case: collateral + profit - fees
      payout = collateral + position.pnl - totalFees;
    } else {
      // Loss case: collateral - loss - fees
      payout = collateral + position.pnl - totalFees; // pnl is negative here
    }
    
    // Ensure payout is not negative
    payout = Math.max(0, payout);
    
    // Calculate ROI: (finalAmount - initialCollateral) / initialCollateral * 100
    const roiValue = ((payout - collateral) / collateral) * 100;
    
    setEstimatedPayout(payout);
    setTradingFee(tradingFeeAmount);
    setPriceImpactFee(priceImpactFeeAmount);
    setRoi(roiValue);
  }, [position]);

  if (!position) return null;

  const positionValue = position.size * position.currentPrice;
  const collateral = positionValue / position.leverage;

  return (
    <Portal>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]"
        onClick={onClose}
      >
        <div 
          className="relative w-full max-w-md mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="border border-white/12 rounded-2xl overflow-hidden shadow-2xl">
            {/* Header with orange gradient */}
            <div className="p-6 bg-gradient-to-br from-black to-yellow-400/80 border-b border-white/12">
              <div className="text-xs text-white/50">{position.symbol}</div>
              <div className="text-2xl font-bold text-white">Close Position</div>
            </div>

            {/* Content */}
            <div className="p-6 bg-black/80">

          {/* Position Summary */}
          <div className="bg-white/[0.02] rounded-lg p-4 mb-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm font-sans">Position</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-white font-mono">
                  {position.symbol.replace('USDT', '').replace('USD', '')}
                </span>
                <span 
                  className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                    position.type === "long"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-red-500/15 text-red-400"
                  }`}
                >
                  {position.type.toUpperCase()}
                </span>
                <span className="font-mono text-xs text-white/80 px-1.5 py-0.5 bg-white/5 rounded">
                  {position.leverage}x
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm font-sans">Size</span>
              <span className="font-mono text-white text-sm">
                {position.size.toLocaleString(undefined, { 
                  minimumFractionDigits: 0, 
                  maximumFractionDigits: 4 
                })}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm font-sans">Entry Price</span>
              <span className="font-mono text-white text-sm">
                ${position.openPrice.toLocaleString(undefined, { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm font-sans">Current Price</span>
              <span className="font-mono text-white text-sm">
                ${position.currentPrice.toLocaleString(undefined, { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </span>
            </div>
          </div>

          {/* PnL & Fees Breakdown */}
          <div className="bg-white/[0.02] rounded-lg p-4 mb-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm font-sans">Initial Collateral</span>
              <span className="font-mono text-white text-sm">
                ${collateral.toLocaleString(undefined, { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm font-sans">Unrealized PnL</span>
              <span className={`font-mono text-sm font-medium ${
                position.pnl >= 0 ? "text-emerald-400" : "text-red-400"
              }`}>
                {position.pnl >= 0 ? "+" : ""}${Math.abs(position.pnl).toLocaleString(undefined, { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </span>
            </div>

            <div className="border-t border-white/10 my-2"></div>

            <div className="flex justify-between items-center">
              <span className="text-white/60 text-xs font-sans">Trading Fee (0.035%)</span>
              <span className="font-mono text-red-400 text-xs">
                -${tradingFee.toLocaleString(undefined, { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-white/60 text-xs font-sans">Price Impact Fee</span>
              <span className="font-mono text-red-400 text-xs">
                -${priceImpactFee.toLocaleString(undefined, { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </span>
            </div>

            <div className="border-t border-white/10 my-2"></div>

            <div className="flex justify-between items-center">
              <span className="text-white font-sans text-sm font-medium">Estimated Payout</span>
              <span className="font-mono text-white text-base font-semibold">
                ${estimatedPayout.toLocaleString(undefined, { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-white font-sans text-sm font-medium">Total ROI</span>
              <span className={`font-mono text-base font-semibold ${
                roi >= 0 ? "text-emerald-400" : "text-red-400"
              }`}>
                {roi >= 0 ? "+" : ""}{roi.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/15 text-white font-medium rounded-lg transition-colors border border-white/10"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(position.id)}
              className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg shadow-md active:scale-[0.995] transition-transform"
            >
              Confirm Close
            </button>
          </div>
          </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
