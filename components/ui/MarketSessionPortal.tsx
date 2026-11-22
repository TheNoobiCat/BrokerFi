'use client'

import { useState, useEffect } from 'react'
import Portal from './Portal'
import { FaArrowRight, FaClock } from 'react-icons/fa'
import type { AssetData } from '@/services/assets'
import { useTradingContext } from '@/store/TradingContext'
import { useRouter } from 'next/navigation'

interface MarketSessionPortalProps {
  isOpen: boolean
  onClose: () => void
  asset: AssetData | null
}

export default function MarketSessionPortal({ isOpen, onClose, asset }: MarketSessionPortalProps) {
  const { setSelectedAsset } = useTradingContext()
  const router = useRouter()
  const [isMarketOpen, setIsMarketOpen] = useState<boolean | null>(null)
  const [hasOptionsMarket, setHasOptionsMarket] = useState<boolean>(false)

  useEffect(() => {
    if (asset) {
      // Check if options market exists
      setHasOptionsMarket(['BTC', 'ETH', 'SOL', 'DOGE'].includes(asset.symbol))
    }
  }, [asset])

  // Determine NY market open/closed state (Regular US market hours: Mon-Fri 9:30-16:00 ET)
  useEffect(() => {
    const checkMarketOpen = () => {
      try {
        const now = new Date()
        const parts = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/New_York',
          weekday: 'short',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }).formatToParts(now)

        const weekday = parts.find(p => p.type === 'weekday')?.value ?? ''
        const hourStr = parts.find(p => p.type === 'hour')?.value ?? '00'
        const minuteStr = parts.find(p => p.type === 'minute')?.value ?? '00'
        const hour = parseInt(hourStr, 10)
        const minute = parseInt(minuteStr, 10)
        const minutesOfDay = hour * 60 + minute

        const isWeekday = !['Sat', 'Sun'].includes(weekday)
        const openMinutes = 9 * 60 + 30 // 9:30 AM
        const closeMinutes = 16 * 60 // 4:00 PM

        setIsMarketOpen(isWeekday && minutesOfDay >= openMinutes && minutesOfDay < closeMinutes)
      } catch (e) {
        setIsMarketOpen(null)
      }
    }

    checkMarketOpen()
    const id = setInterval(checkMarketOpen, 30 * 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen || !asset) return null

  const handleContinue = () => {
    // Map asset slug back to market parameter
    const assetToMarketMap: Record<string, string> = {
      'crypto-btcusd': 'btc-perp',
      'crypto-ethusd': 'eth-perp',
    };
    const marketParam = assetToMarketMap[asset.urlSlug] || asset.urlSlug;
    
    // Navigate to the market page
    router.push(`/perpetual/${marketParam}`)
    setSelectedAsset(asset)
    onClose()
  }

  return (
    <Portal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />

        <div className="relative w-full max-w-lg">
          <div className="border border-white/12 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 bg-gradient-to-br from-black to-yellow-400/80 border-b border-white/12">
              <div className="text-xs text-white/50">{asset.symbol} / USD</div>
              <div className="text-2xl font-bold text-white truncate">{asset.name}</div>
            </div>

            <div className="p-6 bg-black/80">
              {/* Show different messages for stocks vs crypto */}
              {asset.type === 'stocks' ? (
                isMarketOpen === false ? (
                  <div className="p-4 bg-red-600/10 rounded-lg border border-red-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <FaClock className="w-4 h-4 text-red-400" />
                      <div className="text-sm font-medium text-white">Market Closed</div>
                    </div>
                    <div className="text-xs text-white/60 mt-1">Regular Market Hours: 9:30 AM - 4:00 PM ET.</div>
                    <div className="text-xs text-white/60 mt-2">You can still open positions while the market is closed; orders will be accepted but P&amp;L will not update until the market re-opens.</div>
                  </div>
                ) : (
                  <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <FaClock className="w-4 h-4 text-blue-400" />
                      <div className="text-sm font-medium text-white">Regular Market Hours</div>
                    </div>
                    <div className="text-xs text-white/60 mt-1">9:30 AM - 4:00 PM ET</div>
                  </div>
                )
              ) : asset.type === 'crypto' ? (
                <div className="p-4 bg-green-600/10 rounded-lg border border-green-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <FaClock className="w-4 h-4 text-green-400" />
                    <div className="text-sm font-medium text-white">24 / 7 Market</div>
                  </div>
                  <div className="text-xs text-white/60 mt-1">Cryptocurrency markets operate 24/7.</div>
                </div>
              ) : (
                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <FaClock className="w-4 h-4 text-blue-400" />
                    <div className="text-sm font-medium text-white">Market Info</div>
                  </div>
                  <div className="text-xs text-white/60 mt-1">This instrument follows its respective market hours. You can open positions but note the market session behavior.</div>
                </div>
              )}

              {asset.type === 'stocks' && (
                <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                  <div className="text-xs text-yellow-200/80">
                    <strong>Note:</strong> We currently only support regular market hours for US stocks. Extended hours trading (pre-market, after hours, overnight) is not available at this time.
                  </div>
                </div>
              )}

              {hasOptionsMarket && (
                <div className="mt-4 p-4 bg-purple-500/10 rounded-lg border border-purple-500/30">
                  <div className="text-sm text-purple-200/80">
                    <strong>Options Available:</strong> This asset also has options trading available.
                  </div>
                  <button
                    onClick={() => {
                      router.push(`/options/${asset.urlSlug}`)
                    }}
                    className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-md text-xs transition-colors"
                  >
                    <span>Go to Options</span>
                    <FaArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              <div className="mt-6">
                <button
                  onClick={handleContinue}
                  className="w-full inline-flex items-center justify-center gap-3 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-md active:scale-[0.995] transition-transform"
                >
                  <span>Continue</span>
                  <FaArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  )
}