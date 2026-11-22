'use client'

import { useState, useEffect } from 'react'
import Portal from './Portal'
import { FaArrowRight, FaClock } from 'react-icons/fa'
import type { AssetData } from '@/services/assets'
import { useTradingContext } from '@/store/TradingContext'
import { useRouter } from 'next/navigation'
import { GhostSquare } from '@/components/ui/GhostSquare'
import { useRef } from 'react'

interface OptionsMarketSessionPortalProps {
  isOpen: boolean
  onClose: () => void
  asset: AssetData | null
}

export default function OptionsMarketSessionPortal({ isOpen, onClose, asset }: OptionsMarketSessionPortalProps) {
  const { setSelectedAsset } = useTradingContext()
  const router = useRouter()
  const [contractSize, setContractSize] = useState<string>('')
  const [isCommunityMarket, setIsCommunityMarket] = useState<boolean>(false)
  const [hasPerpsMarket, setHasPerpsMarket] = useState<boolean>(false)
  const [contractsData, setContractsData] = useState<any>(null)
  const [isSubgraphLoading, setIsSubgraphLoading] = useState<boolean>(false)
  const [subgraphVersion, setSubgraphVersion] = useState<number>(0)
  const subgraphMarketsRef = useRef<Map<string, any>>(new Map())

  // Load contracts data
  useEffect(() => {
    fetch('/data/contracts.json')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(setContractsData)
      .catch(() => setContractsData(null))
  }, [])

  // Subgraph fetch for all markets to prefill community + contract size
  useEffect(() => {
    let cancelled = false

    const fetchAllMarkets = async () => {
      if (subgraphMarketsRef.current.size || cancelled) return

      const subgraphUrl = process.env.NEXT_PUBLIC_GOLDSKY_URL
      if (!subgraphUrl) return

      setIsSubgraphLoading(true)

      try {
        const query = `
          query MarketMeta {
            optionsMarkets(first: 1000) {
              contractSize
              priceFeedId
              community
            }
          }
        `

        const res = await fetch(subgraphUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query })
        })

        const json = await res.json()
        const list = json?.data?.optionsMarkets || []
        if (cancelled) return

        subgraphMarketsRef.current = new Map(
          list
            .filter((m: any) => m?.priceFeedId)
            .map((m: any) => [m.priceFeedId.toLowerCase(), { community: Boolean(m.community), contractSize: m.contractSize ?? m.contractSizeInAsset }])
        )

        setSubgraphVersion(prev => prev + 1)
      } catch (err) {
        if (!cancelled) console.warn('Subgraph market meta fetch failed', err)
      } finally {
        if (!cancelled) setIsSubgraphLoading(false)
      }
    }

    fetchAllMarkets()

    return () => {
      cancelled = true
    }
  }, [])

  // When asset changes, apply cached subgraph data if available
  useEffect(() => {
    if (!asset) return

    setIsCommunityMarket(asset.urlSlug?.startsWith('0x') ?? false)
    setContractSize('')

    const priceFeedId = (asset.priceId || asset.pyth_id || contractsData?.priceFeeds?.[asset.symbol]?.pythId || '').toLowerCase()
    if (!priceFeedId) return

    const marketMeta = subgraphMarketsRef.current.get(priceFeedId)
    if (marketMeta) {
      setIsCommunityMarket(Boolean(marketMeta.community))
      const sizeNum = Number(marketMeta.contractSize ?? 0) / 1e18
      if (!Number.isNaN(sizeNum) && sizeNum > 0) setContractSize(sizeNum.toString())
      return
    }

    // Fallback: contracts.json lotSize if subgraph entry is missing
    const lotSize = contractsData?.priceFeeds?.[asset.symbol]?.lotSize
    if (lotSize) {
      try {
        const humanSize = Number(lotSize) / 1e18
        if (humanSize > 0) setContractSize(humanSize.toString())
      } catch {/* ignore */}
    }
  }, [asset, contractsData, subgraphVersion])

  // Perps availability check
  useEffect(() => {
    if (!asset || !contractsData) return

    const hasPerps = contractsData.perps && contractsData.perps.markets &&
      contractsData.perps.markets[`${asset.symbol}-PERP`]
    setHasPerpsMarket(!!hasPerps)
  }, [asset, contractsData])

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

  const isCommunityAsset = asset.urlSlug?.startsWith('0x') ?? false

  const handleContinue = () => {
    setSelectedAsset(asset)
    router.push(`/options/${asset.urlSlug}`)
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
              <div className="space-y-4">
                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <FaClock className="w-4 h-4 text-blue-400" />
                    <div className="text-sm font-medium text-white">Options Market</div>
                  </div>
                  <div className="text-xs text-white/60 mt-1">Trade options contracts 24/7.</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-white/5 rounded-lg">
                    <div className="text-xs text-white/50">Contract Size</div>
                    <div className="text-sm font-medium text-white">
                      {isSubgraphLoading && !contractSize ? (
                        <GhostSquare size="sm" />
                      ) : (
                        contractSize ? `${contractSize} ${asset.symbol}` : '—'
                      )}
                    </div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg">
                    <div className="text-xs text-white/50">Market Type</div>
                    <div className="text-sm font-medium text-white">
                      {isSubgraphLoading && !isCommunityAsset ? (
                        <GhostSquare size="md" />
                      ) : (
                        (isCommunityMarket || isCommunityAsset) ? 'Community' : 'Official'
                      )}
                    </div>
                  </div>
                </div>

                {hasPerpsMarket && (
                  <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                    <div className="text-sm text-green-200/80">
                      <strong>Perpetuals Available:</strong> This asset also has perpetual futures trading.
                    </div>
                    <button
                      onClick={() => {
                        router.push(`/${asset.urlSlug}`)
                      }}
                      className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-300 rounded-md text-xs transition-colors"
                    >
                      <span>Go to Perpetuals</span>
                      <FaArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <button
                  onClick={handleContinue}
                  className="w-full inline-flex items-center justify-center gap-3 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-md active:scale-[0.995] transition-transform"
                >
                  <span>Continue to Options</span>
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