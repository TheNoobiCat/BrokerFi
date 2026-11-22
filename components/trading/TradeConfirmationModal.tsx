'use client'

import { useState } from 'react'
import Portal from '@/components/ui/Portal'
import { FaTimes, FaBolt, FaCheckCircle } from 'react-icons/fa'

interface TradeConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  side: 'long' | 'short'
  symbol: string
  size: number
  leverage: number
  price: number | null
  orderType: 'market' | 'limit'
  loading?: boolean
}

export default function TradeConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  side,
  symbol,
  size,
  leverage,
  price,
  orderType,
  loading = false
}: TradeConfirmationModalProps) {
  const [dontAskAgain, setDontAskAgain] = useState(false)

  if (!isOpen) return null

  const handleConfirm = () => {
    if (dontAskAgain) {
      localStorage.setItem('skipTradeConfirmation', 'true');
    }
    onConfirm()
    onClose()
  }

  // Calculate position value and required margin based on actual trade price
  // For market orders, use current market price; for limit orders, use the limit price
  const tradePrice = price ?? 0
  const positionValue = size * tradePrice
  const requiredMargin = positionValue / leverage
  
  // Calculate liquidation price
  const liquidationPrice = side === 'long'
    ? tradePrice * (1 - 1 / leverage)
    : tradePrice * (1 + 1 / leverage)

  return (
    <Portal>
      <div className="fixed inset-0 z-9999 flex items-center justify-center px-4">
        <div 
          className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
          onClick={onClose}
        />

        <div className="relative w-full max-w-md">
          <div className="bg-surface border border-white/20 rounded-lg shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    side === 'long' ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    <FaBolt className={`w-5 h-5 ${
                      side === 'long' ? 'text-green-400' : 'text-red-400'
                    }`} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white font-sans">
                      Confirm {side === 'long' ? 'Long' : 'Short'}
                    </h2>
                    <p className="text-sm text-white/60">Review your trade details</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="Close confirmation modal"
                >
                  <FaTimes className="w-4 h-4 text-white/60" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Trade Summary */}
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/60">Symbol</span>
                    <span className="font-mono text-white font-medium">{symbol}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/60">Side</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      side === 'long' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {side.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/60">Order Type</span>
                    <span className="font-mono text-white">{orderType === 'market' ? 'Market' : 'Limit'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/60">Size</span>
                    <span className="font-mono text-white">{size}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/60">Price</span>
                    <span className="font-mono text-white">
                      {price ? `$${price.toLocaleString()}` : 'Market'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/60">Leverage</span>
                    <span className="font-mono text-primary font-medium">{leverage}x</span>
                  </div>
                </div>
              </div>

              {/* Position Value & Margin */}
              <div className="p-4 bg-surface/30 rounded-lg border border-white/8">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/70">Position Value</span>
                    <span className="font-mono text-white">
                      ${positionValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/70">Required Margin</span>
                    <span className="font-mono text-white">
                      ${requiredMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-white/10">
                    <span className="text-sm text-red-400/80">Liquidation Price</span>
                    <span className="font-mono text-red-400">
                      ${liquidationPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* InstantExecution Info */}
              <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                <div className="flex items-start gap-3">
                  <FaCheckCircle className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-white mb-1">
                      Instant Execution
                    </div>
                    <p className="text-xs text-white/70">
                      This order will be executed immediately through your connected channel.
                    </p>
                  </div>
                </div>
              </div>

              {/* Don't Ask Again Checkbox */}
              <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/8 transition-colors">
                <input
                  type="checkbox"
                  checked={dontAskAgain}
                  onChange={(e) => setDontAskAgain(e.target.checked)}
                  className="w-4 h-4 rounded border-white/30 bg-white/10 checked:bg-primary checked:border-primary focus:ring-2 focus:ring-primary/50 cursor-pointer"
                />
                <span className="text-sm text-white/80 select-none">
                  Don&apos;t ask me again to confirm before submitting trades
                </span>
              </label>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="px-4 py-3 bg-white/10 hover:bg-white/15 text-white font-medium rounded-lg transition-colors border border-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className={`px-4 py-3 font-semibold rounded-lg transition-colors shadow-md ${
                    loading
                      ? 'bg-gray-500 text-white cursor-not-allowed'
                      : side === 'long'
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  {loading ? 'Submitting...' : `Confirm ${side === 'long' ? 'Long' : 'Short'}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  )
}
