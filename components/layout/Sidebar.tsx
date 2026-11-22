'use client'

import { useState, useRef, useCallback, useEffect, memo } from 'react'
import React from 'react'
import { useTradingContext } from '@/store/TradingContext'
import { 
  searchAssets, 
  loadAssets,
  AssetData, 
  ASSET_CATEGORIES, 
  assetToInstrument
} from '@/services/assets'
import MarketSessionPortal from '@/components/ui/MarketSessionPortal'
import OptionsMarketSessionPortal from '@/components/ui/OptionsMarketSessionPortal'
import { PythDatafeed } from '@/services/pyth/PythDatafeed'
import { GhostSquare } from '../ui/GhostSquare'
import { List, RowComponentProps } from 'react-window'
import { 
  FaSearch,
  FaTimes,
  FaChartLine,
  FaGlobe,
  FaCoins,
  FaDollarSign,
  FaBuilding,
  FaStar,
  FaRegStar
} from 'react-icons/fa'

import { 
  BiTrendingUp,
  BiTrendingDown 
} from 'react-icons/bi'

import Icon from '@/components/ui/Icon'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Portal from '@/components/ui/Portal'
import { useUI } from '@/store/UIContext'
import { useFavorites } from '@/hooks/useFavorites'

export default function Sidebar() {
  const [sidebarWidth, setSidebarWidth] = useState(420) // Default to maximum width
  const [isResizing, setIsResizing] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredAssets, setFilteredAssets] = useState<AssetData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [totalResults, setTotalResults] = useState(0)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const { favorites, toggleFavorite, isFavorite, isHydrated } = useFavorites()

  // Hover state for asset spotlight
  const [hoveredAsset, setHoveredAsset] = useState<AssetData | null>(null)
  const [assetRect, setAssetRect] = useState<DOMRect | null>(null)
  const [assetPrompt, setAssetPrompt] = useState('')
  const { agentSidebarOpen, setAgentSidebarOpen, setChartContext, setQueuedAgentMessage } = useUI()

  // Icon mapping for categories
  const categoryIcons: Record<string, React.ElementType> = {
    'all': FaGlobe,
    'crypto_pairs': FaCoins,
    'us_stocks': FaBuilding,
    'forex_pairs': FaDollarSign,
    'commodities': FaChartLine
  }

  const { setSelectedAsset } = useTradingContext()
  const [isSessionPortalOpen, setIsSessionPortalOpen] = useState(false)
  const [portalAsset, setPortalAsset] = useState<AssetData | null>(null)
  const [isOptionsPortalOpen, setIsOptionsPortalOpen] = useState(false)

  // Pyth live price feed
  const datafeedRef = useRef<PythDatafeed | null>(null)
  const [livePrices, setLivePrices] = useState<Record<string, number>>({})
  const [livePrecisions, setLivePrecisions] = useState<Record<string, number>>({})
  const [liveChanges, setLiveChanges] = useState<Record<string, number>>({})
  const [baseline24h, setBaseline24h] = useState<Record<string, number>>({})
  const baseline24hRef = useRef<Record<string, number>>({})

  const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
    setIsResizing(true)
    
    const startX = mouseDownEvent.pageX
    const startWidth = sidebarWidth

    const doDrag = (mouseMoveEvent: MouseEvent) => {
      const newWidth = startWidth + mouseMoveEvent.pageX - startX
      if (newWidth >= 260 && newWidth <= 480) { // min 15rem, max 30rem
        setSidebarWidth(newWidth)
      }
    }

    const stopDrag = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', doDrag)
      document.removeEventListener('mouseup', stopDrag)
    }

    document.addEventListener('mousemove', doDrag)
    document.addEventListener('mouseup', stopDrag)
  }, [sidebarWidth])

  // Search assets with debouncing
  const searchAssetsDebounced = useCallback(
    async (query: string, category: string) => {
      setIsLoading(true)
      try {
        // Use regular asset search for all categories (now handles stock deduplication)
        const categoryFilter = category === 'all' ? undefined : category as any
        
        // First get the total count without limit
        const allResults = await searchAssets(query, categoryFilter, Infinity)
        const totalCount = allResults.length
        
        // Sort: favorites first, then popular, then rest
        const sorted = allResults.sort((a, b) => {
          const aFav = favorites.has(a.urlSlug)
          const bFav = favorites.has(b.urlSlug)
          if (aFav !== bFav) return aFav ? -1 : 1
          
          const aPop = a.popular || false
          const bPop = b.popular || false
          if (aPop !== bPop) return aPop ? -1 : 1
          
          return 0
        })
        
        // Then get limited results for display (virtualization handles large lists)
        const limitedResults = sorted.slice(0, 500)
        
        
        setFilteredAssets(limitedResults)
        setTotalResults(totalCount)
      } catch (error) {
        // error suppressed
        setFilteredAssets([])
        setTotalResults(0)
      } finally {
        setIsLoading(false)
      }
    },
    [favorites]
  )

    // Seed default favorites from asset data on first load (only when user's favorites empty)
    const seededDefaultsRef = useRef(false)
    useEffect(() => {
      // Only attempt seeding after hydration and when we have no user favorites yet
      if (seededDefaultsRef.current) return
      if (!isHydrated) return
      if (favorites.size > 0) return

      (async () => {
        try {
          // Load full assets list and pick those with defaultFavorite flag
          const allAssets = await (await loadAssets())
          const defaults = allAssets.filter(a => a.popular)
          if (defaults.length > 0) {
            for (const a of defaults) {
              try { toggleFavorite(a.urlSlug) } catch {}
            }
          }
        } catch (e) {
          // ignore
        } finally {
          seededDefaultsRef.current = true
        }
      })()
    }, [isHydrated, favorites, toggleFavorite])

  // Effect to trigger search when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchAssetsDebounced(searchTerm, selectedCategory)
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchTerm, selectedCategory, searchAssetsDebounced])

  // Re-sort when favorites change without re-fetching
  useEffect(() => {
    if (filteredAssets.length > 0) {
      const sorted = [...filteredAssets].sort((a, b) => {
        const aFav = favorites.has(a.urlSlug)
        const bFav = favorites.has(b.urlSlug)
        if (aFav !== bFav) return aFav ? -1 : 1
        
        const aPop = a.popular || false
        const bPop = b.popular || false
        if (aPop !== bPop) return aPop ? -1 : 1
        
        return 0
      })
      setFilteredAssets(sorted)
    }
  }, [favorites])

  // Initialize datafeed and price callback once
  useEffect(() => {
    if (!datafeedRef.current) {
      datafeedRef.current = new PythDatafeed()
    }
  }, [])

  // Setup a single global price update callback to receive SSE updates
  useEffect(() => {
    let mounted = true
    if (!datafeedRef.current) datafeedRef.current = new PythDatafeed()

    try {
      datafeedRef.current.setPriceUpdateCallback((price: number, ticker: string) => {
        if (!mounted) return
        // ticker is in the normalized instrument form (e.g. BTCUSD)
        try {
          setLivePrices(prev => {
            const prevPrice = prev[ticker]
            const next = { ...prev, [ticker]: price }
            // Prefer baseline 24h change if available
            const baseline = baseline24hRef.current[ticker]
            if (typeof baseline === 'number' && baseline > 0) {
              const change = ((price - baseline) / baseline) * 100
              try { setLiveChanges(prevc => ({ ...prevc, [ticker]: change })) } catch {}
            } else if (typeof prevPrice === 'number' && prevPrice > 0) {
              const change = ((price - prevPrice) / prevPrice) * 100
              try { setLiveChanges(prevc => ({ ...prevc, [ticker]: change })) } catch {}
            }
            return next
          })
        } catch {}
      })
    } catch (e) {
      // ignore
    }

    return () => {
      mounted = false
      try { datafeedRef.current?.clearPriceUpdateCallback() } catch {}
    }
  }, [])

  // Lazy load prices for visible assets
  const visibleAssetPrices = useRef<Set<string>>(new Set())
  
  const loadPriceForAsset = useCallback(async (asset: AssetData) => {
    if (visibleAssetPrices.current.has(asset.symbol)) return
    
    // Mark as loading to prevent duplicate requests
    visibleAssetPrices.current.add(asset.symbol)
    
    try {
      if (!datafeedRef.current) {
        datafeedRef.current = new PythDatafeed()
      }
      
      // Use normalized instrument symbol for Pyth lookups/subscriptions
      const instrument = assetToInstrument(asset)
      const instrumentSymbol = instrument.symbol

      // Set precision based on instrument info / asset type
      const precision = asset.type === 'forex' ? 4 : asset.type === 'crypto' ? 2 : 2
      setLivePrecisions(prev => ({ ...prev, [instrumentSymbol]: precision }))

      // Try to find symbol in datafeed and subscribe so SSE updates arrive
      try {
        const symbolData = await datafeedRef.current.searchSymbols(instrumentSymbol)
        const matchedSymbol = symbolData.find(s => s.ticker === instrumentSymbol)

        if (matchedSymbol) {
          try {
            // subscription options vary by datafeed implementation; cast to any to satisfy types
            datafeedRef.current.subscribe(matchedSymbol, ({ multiplier: 1, timespan: 'minute', text: '1m' } as any), () => {})
          } catch {}

          // Seed current price via datafeed API helper if available
          try {
            const seed = await (datafeedRef.current as any).getCurrentPriceViaAPI?.((matchedSymbol as any).priceId, false)
            if (seed && typeof seed === 'number' && seed > 0) {
                setLivePrices(prev => ({ ...prev, [instrumentSymbol]: seed }))
            }
          } catch (e) {
            // ignore
          }
          // Fetch 24h-ago baseline price for percent change calculation
          try {
            const now = Date.now()
            const from = now - 24 * 60 * 60 * 1000
            // Request hourly bars over the last 24h and pick the earliest bar as the 24h baseline
            const bars = await (datafeedRef.current as any).getHistoryKLineData?.(matchedSymbol, ({ multiplier: 1, timespan: 'hour', text: '1H' } as any), Math.floor(from / 1000), Math.floor(now / 1000))
          if (Array.isArray(bars) && bars.length > 0) {
            const baselineBar = bars[0]
            const baselinePrice = baselineBar.close
            if (baselinePrice && typeof baselinePrice === 'number' && baselinePrice > 0) {
              setBaseline24h(prev => {
                const next = { ...prev, [instrumentSymbol]: baselinePrice }
                baseline24hRef.current = next
                return next
              })
              // If we already have a seeded current price, compute change immediately
              setLivePrices(prev => {
                const current = prev[instrumentSymbol]
                if (typeof current === 'number' && current > 0) {
                  const change = ((current - baselinePrice) / baselinePrice) * 100
                  try { setLiveChanges(prevc => ({ ...prevc, [instrumentSymbol]: change })) } catch {}
                }
                return prev
              })
            }
          }
          } catch (e) {
            // ignore baseline fetch errors
          }
        }
      } catch (e) {
        // fallback: try direct API by priceId if available via searchSymbols(asset.symbol)
        try {
          const fallbackList = await datafeedRef.current.searchSymbols(asset.symbol)
          const fallback = fallbackList[0]
          const priceId = (fallback as any)?.priceId
          if (priceId) {
            const cleanPriceId = priceId.replace('0x', '')
            const fullPriceId = `0x${cleanPriceId}`
            try {
              const response = await fetch(
                `https://hermes.pyth.network/v2/updates/price/latest?ids[]=${fullPriceId}&parsed=true`,
                { signal: AbortSignal.timeout(5000) }
              )
              if (response.ok) {
                const data = await response.json()
                if (data.parsed?.[0]?.price) {
                  const priceData = data.parsed[0].price
                  const currentPrice = parseFloat(priceData.price) * Math.pow(10, priceData.expo)
                  if (currentPrice > 0) setLivePrices(prev => ({ ...prev, [instrumentSymbol]: currentPrice }))
                }
              }
            } catch {}
          }
        } catch {}
      }
    } catch (error) {
      // failed to load price, ignore for now
      // Remove from loading set so we can retry later
      visibleAssetPrices.current.delete(asset.symbol)
    }
  }, [])

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category)
  }

  // Helper to format numeric prices with optional precision
  const formatPrice = (p: number | undefined | null, precision?: number) => {
    if (p == null || Number.isNaN(p)) return '—'
    try {
      let decimals: number
      if (typeof precision === 'number') decimals = precision
      else if (p >= 1000) decimals = 2
      else if (p >= 100) decimals = 2
      else if (p >= 10) decimals = 2
      else if (p >= 1) decimals = 4
      else decimals = 6

      return Number(p).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    } catch {
      return String(p)
    }
  }

  // Format large volumes into human readable strings (K/M/B/T)
  const formatVolume = (v: number | undefined | null) => {
    if (v == null || Number.isNaN(v)) return '—'
    const n = Math.abs(v)
    if (n >= 1e12) return `${(v / 1e12).toFixed(2)}T`
    if (n >= 1e9) return `${(v / 1e9).toFixed(2)}B`
    if (n >= 1e6) return `${(v / 1e6).toFixed(2)}M`
    if (n >= 1e3) return `${(v / 1e3).toFixed(2)}K`
    return v.toFixed(2)
  }

  const handleAssetClick = useCallback((asset: AssetData) => {
    // Don't allow clicking on coming soon assets
    if (asset.comingSoon) {
      return
    }
    
    // Check if we're on options page
    const isOptionsPage = window.location.pathname.startsWith('/options')
    
    if (isOptionsPage) {
      // Show options portal
      setPortalAsset(asset)
      setIsOptionsPortalOpen(true)
      return
    }
    
    // Show perps portal for stocks and crypto
    if (asset.type === 'stocks' || asset.type === 'crypto') {
      setPortalAsset(asset)
      setIsSessionPortalOpen(true)
      return
    }

    // For other types (forex, commodities), select directly
    setSelectedAsset(asset)
  }, [setSelectedAsset])

  const handlePortalClose = useCallback(() => {
    setIsSessionPortalOpen(false)
    setIsOptionsPortalOpen(false)
    setPortalAsset(null)
  }, [])

  // Hover handlers for asset spotlight
  const handleAssetHover = useCallback((asset: AssetData, event: React.MouseEvent) => {
    if (!agentSidebarOpen) return

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    setHoveredAsset(asset)
    setAssetRect(rect)

    // Set context for AI agent
    const context = `Asset: ${asset.symbol} (${asset.name}) - ${asset.type} - Current analysis: ${asset.description || 'No description available'}`
    setChartContext(context)
  }, [agentSidebarOpen, setChartContext])

  const handleAssetLeave = useCallback(() => {
    setHoveredAsset(null)
    setAssetRect(null)
    setAssetPrompt('')
    setChartContext(null)
  }, [setChartContext])

  // Memoized individual asset row to prevent re-renders on price updates
  const AssetRowItem = memo<{ 
    asset: AssetData
    livePrice: number | undefined
    livePrecision: number | undefined
    liveChange: number | undefined
    onAssetClick: (asset: AssetData) => void
    onLoadPrice: (asset: AssetData) => void
    isFavorite: (id: string) => boolean
    toggleFavorite: (id: string) => void
    onAssetHover: (asset: AssetData, event: React.MouseEvent) => void
    onAssetLeave: () => void
  }>(({ asset, livePrice, livePrecision, liveChange, onAssetClick, onLoadPrice, isFavorite: propIsFavorite, toggleFavorite: propToggle, onAssetHover, onAssetLeave }) => {
    const router = useRouter()
    const isComingSoon = asset.comingSoon === true
    const instrument = assetToInstrument(asset)
    const instrumentSymbol = instrument.symbol
    const isAssetFavorite = propIsFavorite(asset.urlSlug)
    const isAssetPopular = asset.popular || false

    // Determine the correct href based on current path
    const isOptionsPage = window.location.pathname.startsWith('/options')
    const isPerpsPage = window.location.pathname.startsWith('/perpetual')
    const href = isOptionsPage ? `/options/${asset.urlSlug}` : isPerpsPage ? `/perpetual/${asset.urlSlug}` : `/${asset.urlSlug}`

    // Load price if not loaded yet (skip for coming soon)
    useEffect(() => {
      if (!isComingSoon && !livePrice && !visibleAssetPrices.current.has(instrumentSymbol)) {
        onLoadPrice(asset)
      }
    }, []) // Only on mount
    
    const handleStarClick = (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      propToggle(asset.urlSlug)
    }

    return (
      isComingSoon ? (
        <div
          className={`rounded-lg p-3 mx-4 border transition-colors ${'opacity-40 cursor-not-allowed border-white/5'}`}
        >
          <div className="grid grid-cols-[2fr_1fr_1fr] gap-4 items-center">
            <div className="flex items-center gap-3 min-w-0">
              <Icon
                symbol={asset.urlSlug}
                name={asset.name}
                type={asset.type === 'crypto' ? 'crypto' : asset.type === 'stocks' ? 'stock' : asset.type === 'forex' ? 'forex' : 'default'}
                size={20}
                className="shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className={`text-sm font-semibold font-sans truncate ${
                  'text-white/40'
                }`}>
                  {asset.symbol}
                </div>
                <div className="text-xs text-white/50 font-normal truncate font-sans">
                  {'Coming Soon!'}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-white/30 font-mono">—</div>
            </div>

            <div className="text-right">
              <div className="text-xs text-white/30 font-mono">—</div>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => {
            if (asset.type === 'stocks' || asset.type === 'crypto') {
              onAssetClick(asset)
            } else {
              router.push(href)
            }
          }}
          onMouseEnter={(e) => onAssetHover(asset, e)}
          onMouseLeave={onAssetLeave}
          className={`block w-full rounded-lg p-3 mx-4 border transition-colors hover:bg-white/5 border-transparent hover:border-white/10 group cursor-pointer`}
        >
          <div className="grid grid-cols-[2fr_1fr_1fr] gap-4 items-center w-full">
          <div className="flex items-center gap-3 min-w-0">
            <Icon
              symbol={asset.urlSlug}
              name={asset.name}
              type={asset.type === 'crypto' ? 'crypto' : asset.type === 'stocks' ? 'stock' : asset.type === 'forex' ? 'forex' : 'default'}
              size={20}
              className="shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <div style={sidebarWidth <= 280 ? {"display": "none"} : undefined} className={`text-sm font-semibold font-sans truncate ${
                  isComingSoon ? 'text-white/40' : 'text-white group-hover:text-primary transition-colors'
                }`}>
                  {asset.symbol}
                </div>
                <button
                  onClick={handleStarClick}
                  className="shrink-0 transition-colors hover:scale-110 transform"
                  title={isAssetFavorite ? "Remove from favorites" : "Add to favorites"}
                >
                  {isAssetFavorite ? (
                    <FaStar className="w-3 h-3 text-yellow-400" />
                  ) : isAssetPopular ? (
                    <FaStar className="w-3 h-3 text-white/30" />
                  ) : (
                    <FaRegStar className="w-3 h-3 text-white/20 group-hover:text-white/40" />
                  )}
                </button>
              </div>
              <div style={sidebarWidth <= 280 ? {"display": "none"} : undefined} className="text-xs text-white/50 font-normal truncate font-sans">
                {asset.name}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            {isComingSoon ? (
              <div className="text-xs text-white/30 font-mono">—</div>
            ) : (
              <div className="text-sm font-mono font-medium text-white">
                {livePrice
                  ? formatPrice(livePrice, livePrecision)
                  : <GhostSquare size="lg" />}
              </div>
            )}
          </div>
          
          <div className="text-right">
            {isComingSoon ? (
              <div className="text-xs text-white/30 font-mono">—</div>
            ) : (
              <div className={`text-sm font-mono font-medium flex items-center justify-end gap-1 ${
                typeof liveChange === 'number' && liveChange >= 0 ? 'price-long' : 'price-short'
              }`}>
                {typeof liveChange === 'number' && liveChange >= 0 ? (
                  <BiTrendingUp className="w-3 h-3" />
                ) : (
                  <BiTrendingDown className="w-3 h-3" />
                )}
                {typeof liveChange === 'number'
                  ? `${liveChange >= 0 ? '+' : ''}${liveChange.toFixed(2)}%`
                  : <GhostSquare size="sm" />}
              </div>
            )}
          </div>
          
          {/* volume column removed - replaced by computed change column handled above */}
          </div>
        </div>
      )
      )
    })

  AssetRowItem.displayName = 'AssetRowItem'

  // Render individual asset item as Row component
  const AssetRow = useCallback(({ index, style }: RowComponentProps) => {
    const asset = filteredAssets[index]
    if (!asset) return null
    
    const instrument = assetToInstrument(asset)
    const instrumentSymbol = instrument.symbol
    
    return (
      <div style={style} className="px-4">
        <AssetRowItem
          asset={asset}
          livePrice={livePrices[instrumentSymbol]}
          livePrecision={livePrecisions[instrumentSymbol]}
          liveChange={liveChanges[instrumentSymbol]}
            onAssetClick={handleAssetClick}
            onLoadPrice={loadPriceForAsset}
            isFavorite={isFavorite}
            toggleFavorite={toggleFavorite}
            onAssetHover={handleAssetHover}
            onAssetLeave={handleAssetLeave}
        />
      </div>
    )
  }, [filteredAssets, livePrices, livePrecisions, liveChanges, handleAssetClick, loadPriceForAsset, favorites])

  return (
    <aside 
      ref={sidebarRef}
      className="broker-sidebar h-full overflow-hidden flex flex-col relative select-none"
      style={{ width: `${sidebarWidth}px` }}
    >
      {/* Header */}
      <div className="p-5 border-b border-white/6">
        <h2 className="text-lg font-semibold text-white mb-1 uppercase tracking-wide font-sans">Perpetual Futures</h2>
        <div className="text-xs text-white/60 mb-3">Market access to 1,100+ perpetual contracts across all asset classes</div>
        
        {/* Search */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search 1,100+ instruments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-broker-accent/50 font-sans pl-10"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40">
            <FaSearch className="w-4 h-4" />
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/70"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          {ASSET_CATEGORIES.map((category) => (
            <button
              key={category.key}
              onClick={() => handleCategoryClick(category.key)}
              className={`px-3 py-2 text-sm rounded-md transition-colors font-medium font-sans ${
                selectedCategory === category.key
                  ? 'bg-primary text-white border border-primary font-semibold'
                  : 'bg-surface/50 text-white/90 hover:bg-white/8 border border-white/6 hover:border-white/20 hover:text-white'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
        
        {/* Filter Results Count */}
        <div className="mt-3 text-xs text-white/60 font-sans">
          {isLoading ? 'Loading...' : `${totalResults} instruments found`}
        </div>
      </div>

      {/* Column Headers */}
      <div className="px-4 py-2 border-b border-white/6">
        <div className="grid grid-cols-[2fr_1fr_1fr] gap-4 px-3 py-2 text-xs text-white/60 uppercase tracking-wider font-medium font-sans">
          <span>Symbol</span>
          <span className="text-right">Price</span>
          <span className="text-right">Change</span>
        </div>
      </div>

      {/* Virtualized Assets List */}
      <div className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredAssets.length > 0 ? (
          <List
            rowComponent={AssetRow as any}
            rowCount={filteredAssets.length}
            rowHeight={80}
            rowProps={{}}
            style={{ height: '600px', width: '100%' }}
          />
        ) : (
          <div className="p-8 text-center text-white/50 font-sans">
            <div className="mb-2">No instruments found</div>
            <button 
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('all')
              }}
              className="text-primary hover:underline text-sm"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>


      {/* Resize Handle */}
      <div
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-broker-accent/30 transition-colors duration-150"
        onMouseDown={startResizing}
      />
      
      {isResizing && (
        <div className="fixed inset-0 cursor-col-resize z-50" />
      )}

      {/* Asset Spotlight Overlay */}
      {agentSidebarOpen && hoveredAsset && assetRect && (
        <Portal>
          <div className="fixed inset-0 pointer-events-none z-[99999]">
            {/* Spotlight mask */}
            <div 
              className="absolute inset-0 bg-black/60"
              style={{
                maskImage: `radial-gradient(circle ${Math.max(assetRect.width, assetRect.height) * 1.5}px at ${assetRect.left + assetRect.width / 2}px ${assetRect.top + assetRect.height / 2}px, transparent 0%, black 100%)`,
                WebkitMaskImage: `radial-gradient(circle ${Math.max(assetRect.width, assetRect.height) * 1.5}px at ${assetRect.left + assetRect.width / 2}px ${assetRect.top + assetRect.height / 2}px, transparent 0%, black 100%)`,
              }}
            />
            
            {/* Tooltip */}
            <div 
              className="absolute bg-surface/95 backdrop-blur-md border border-white/30 rounded-lg p-4 shadow-lg pointer-events-auto max-w-md"
              style={{
                left: assetRect.right + 12,
                top: assetRect.top + assetRect.height / 2 - 30,
                zIndex: 100000,
              }}
            >
              <div className="text-center">
                <p className="text-white/90 text-sm mb-3 font-medium">
                  Ask Vibetrader about {hoveredAsset.symbol}
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={assetPrompt}
                    onChange={(e) => setAssetPrompt(e.target.value)}
                    placeholder={`What's happening with ${hoveredAsset.symbol}?`}
                    className="flex-1 px-3 py-2 bg-glass-dark border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-400/50 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && assetPrompt.trim()) {
                        // Add asset context to Vibetrader chat
                        const contextMessage = `Question about ${hoveredAsset.symbol} (${hoveredAsset.name}) - ${hoveredAsset.type}: ${assetPrompt}`;
                        setChartContext(contextMessage);
                        setQueuedAgentMessage(contextMessage);
                        setAssetPrompt("");
                        setHoveredAsset(null);
                        setAssetRect(null);
                        setAgentSidebarOpen(true);
                        // Focus the agent sidebar input
                        setTimeout(() => {
                          const agentInput = document.querySelector('[data-agent-input]') as HTMLTextAreaElement;
                          if (agentInput) agentInput.focus();
                        }, 100);
                      }
                    }}
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      if (assetPrompt.trim()) {
                        // Add asset context to Vibetrader chat
                        const contextMessage = `Question about ${hoveredAsset.symbol} (${hoveredAsset.name}) - ${hoveredAsset.type}: ${assetPrompt}`;
                        setChartContext(contextMessage);
                        setQueuedAgentMessage(contextMessage);
                        setAssetPrompt("");
                        setHoveredAsset(null);
                        setAssetRect(null);
                        setAgentSidebarOpen(true);
                        // Focus the agent sidebar input
                        setTimeout(() => {
                          const agentInput = document.querySelector('[data-agent-input]') as HTMLTextAreaElement;
                          if (agentInput) agentInput.focus();
                        }, 100);
                      }
                    }}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!assetPrompt.trim()}
                  >
                    Ask
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      <MarketSessionPortal
        isOpen={isSessionPortalOpen}
        onClose={handlePortalClose}
        asset={portalAsset}
      />

      <OptionsMarketSessionPortal
        isOpen={isOptionsPortalOpen}
        onClose={handlePortalClose}
        asset={portalAsset}
      />
    </aside>
  )
}