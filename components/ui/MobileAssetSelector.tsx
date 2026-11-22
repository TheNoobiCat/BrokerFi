'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Portal from './Portal'
import { FaChevronDown, FaSearch, FaTimes, FaStar, FaRegStar } from 'react-icons/fa'
import { searchAssets, AssetData } from '@/services/assets'
import { useFavorites } from '@/hooks/useFavorites'
import { VirtualizedList } from '@/components/VirtualizedList'

interface MobileAssetSelectorProps {
  currentSymbol: string
  currentCategory?: 'crypto' | 'forex' | 'stocks' | 'commodities'
  mode?: 'perps' | 'options'
}

export default function MobileAssetSelector({ currentSymbol, currentCategory, mode = 'perps' }: MobileAssetSelectorProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTab, setSelectedTab] = useState<'all' | 'crypto_pairs' | 'forex_pairs' | 'us_stocks'>('all')
  const [assets, setAssets] = useState<AssetData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [listHeight, setListHeight] = useState<number>(() => Math.max(typeof window !== 'undefined' ? window.innerHeight - 240 : 400, 300))

  // Compute a stable list height once and update on resize to avoid
  // remounts / layout thrashing inside the virtual list.
  useEffect(() => {
    const onResize = () => setListHeight(Math.max(window.innerHeight - 240, 300))
    if (typeof window !== 'undefined') {
      onResize()
      window.addEventListener('resize', onResize)
    }
    return () => { if (typeof window !== 'undefined') window.removeEventListener('resize', onResize) }
  }, [])
  const { favorites, toggleFavorite, isFavorite } = useFavorites()

  // Auto-focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Load assets based on search and category
  useEffect(() => {
    const loadAssets = async () => {
      setIsLoading(true)
      try {
        let results: AssetData[] = []
        
        if (mode === 'options') {
          // Load options assets from config file
          const response = await fetch('/data/assets-options.json')
          if (response.ok) {
            const config = await response.json()
            results = config.options.map((opt: any) => ({
              symbol: opt.symbol,
              display: opt.display,
              name: opt.name,
              description: opt.description,
              urlSlug: opt.symbol,
              type: opt.category,
              popular: opt.popular || false,
              comingSoon: false
            }))
            
            // Filter by search term
            if (searchTerm) {
              const term = searchTerm.toLowerCase()
              results = results.filter((asset: AssetData) => 
                asset.symbol.toLowerCase().includes(term) ||
                asset.name.toLowerCase().includes(term) ||
                asset.description.toLowerCase().includes(term)
              )
            }
          }
        } else {
          // Load perps assets from regular API
          const categoryFilter = selectedTab === 'all' ? undefined : selectedTab as any
          const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024
          const limit = isDesktop ? Infinity : 500
          results = await searchAssets(searchTerm, categoryFilter, limit)
        }
        
        // Sort: favorites first, then popular, then rest
        const sorted = results.sort((a, b) => {
          const aFav = favorites.has(a.urlSlug)
          const bFav = favorites.has(b.urlSlug)
          if (aFav !== bFav) return aFav ? -1 : 1
          
          const aPop = a.popular || false
          const bPop = b.popular || false
          if (aPop !== bPop) return aPop ? -1 : 1
          
          return 0
        })
        
        setAssets(sorted)
      } catch (error) {
        setAssets([])
      } finally {
        setIsLoading(false)
      }
    }

    const timeoutId = setTimeout(loadAssets, 200) // Debounce
    return () => clearTimeout(timeoutId)
  }, [searchTerm, selectedTab, mode])

  // Re-sort when favorites change without re-fetching
  useEffect(() => {
    if (assets.length > 0) {
      const sorted = [...assets].sort((a, b) => {
        const aFav = favorites.has(a.urlSlug)
        const bFav = favorites.has(b.urlSlug)
        if (aFav !== bFav) return aFav ? -1 : 1
        
        const aPop = a.popular || false
        const bPop = b.popular || false
        if (aPop !== bPop) return aPop ? -1 : 1
        
        return 0
      })
      setAssets(sorted)
    }
  }, [favorites])

  // Get category badge color
  const getCategoryColor = (type: string) => {
    switch (type) {
      case 'crypto': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'forex': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'stocks': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'commodities': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const handleAssetSelect = useCallback((asset: AssetData) => {
    if (asset.comingSoon) return

    // Ensure urlSlug is valid
    if (!asset.urlSlug) {
      console.error("Invalid asset URL slug:", asset);
      return
    }

    const url = mode === 'options' ? `/options/${asset.urlSlug}` : `/perpetual/${asset.urlSlug}`
    router.push(url)
    setIsOpen(false)
    setSearchTerm('')
  }, [router, mode])

  // Renderer used by the project's VirtualizedList (no style wrapper)
  const renderVirtualItem = useCallback((asset: AssetData, index: number) => {
    if (!asset) return null

    const isComingSoon = asset.comingSoon === true
    const isAssetFavorite = isFavorite(asset.urlSlug)
    const isAssetPopular = asset.popular || false

    const handleStarClick = (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      toggleFavorite(asset.urlSlug)
    }

    return (
      <div className="px-3">
        <button
          onClick={() => handleAssetSelect(asset)}
          disabled={isComingSoon}
          className={`w-full text-left p-3 rounded-lg border transition-all ${
            isComingSoon
              ? 'opacity-40 cursor-not-allowed border-transparent'
              : 'hover:bg-white/5 border-transparent hover:border-white/10 active:bg-white/10'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-white text-sm">
                  {asset.display || asset.symbol}
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleStarClick(e as any); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault(); e.stopPropagation(); handleStarClick(e as any);
                    }
                  }}
                  className="shrink-0 transition-transform hover:scale-110"
                  title={isAssetFavorite ? "Remove from favorites" : "Add to favorites"}
                >
                  {isAssetFavorite ? (
                    <FaStar className="w-3 h-3 text-yellow-400" />
                  ) : isAssetPopular ? (
                    <FaStar className="w-3 h-3 text-white/30" />
                  ) : (
                    <FaRegStar className="w-3 h-3 text-white/20" />
                  )}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${getCategoryColor(asset.type)}`}>
                  {asset.type.toUpperCase()}
                </span>
                {isComingSoon && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded border border-orange-500/30 bg-orange-500/20 text-orange-400 font-medium">
                    SOON
                  </span>
                )}
              </div>
              <div className="text-xs text-white/50 truncate">
                {asset.description}
              </div>
            </div>
          </div>
        </button>
      </div>
    )
  }, [handleAssetSelect, isFavorite, toggleFavorite, getCategoryColor])

  const categoryTabs = [
    { id: 'all' as const, label: 'All', count: assets.length },
    { id: 'crypto_pairs' as const, label: 'Crypto', icon: '₿' },
    { id: 'forex_pairs' as const, label: 'Forex', icon: '$' },
    { id: 'us_stocks' as const, label: 'Stocks', icon: '📈' }
  ]

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-glass-dark rounded-lg border border-white/10 text-sm font-medium text-white min-w-30 active:scale-95 transition-transform"
      >
        <span className="truncate flex-1 text-left">
          {currentSymbol}
        </span>
        <FaChevronDown className="w-3 h-3 text-white/60 shrink-0" />
      </button>

      {/* Full-Screen Modal */}
      {isOpen && (
        <Portal>
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-100000 flex flex-col">
            {/* Header */}
            <div className="shrink-0 bg-[#071322] border-b border-white/12 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Select Asset</h2>
                <button
                  onClick={() => {
                    setIsOpen(false)
                    setSearchTerm('')
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <FaTimes className="w-5 h-5 text-white/60" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or symbol..."
                  className="w-full pl-10 pr-10 py-3 bg-[#071322] border border-white/12 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-primary/50"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded"
                  >
                    <FaTimes className="w-3 h-3 text-white/40" />
                  </button>
                )}
              </div>

              {/* Category Tabs - Only show for perps mode */}
              {mode === 'perps' && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-2 -mx-1 px-1">
                  {categoryTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedTab(tab.id)}
                      className={`shrink-0 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                        selectedTab === tab.id
                          ? 'bg-primary/20 text-primary border border-primary/30'
                          : 'bg-surface/50 text-white/60 border border-white/5 hover:bg-white/5'
                      }`}
                    >
                      {tab.icon && <span className="mr-1.5">{tab.icon}</span>}
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Results Count */}
              <div className="text-xs text-white/50 mt-3">
                {isLoading ? (
                  'Loading...'
                ) : (
                  `${assets.length} asset${assets.length !== 1 ? 's' : ''} found`
                )}
              </div>
            </div>

            {/* Virtualized Asset List */}
            <div className="flex-1 overflow-hidden">
              {assets.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-white/40 mb-2">
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                      ) : (
                        '🔍'
                      )}
                    </div>
                    <div className="text-white/60 text-sm">
                      {isLoading ? 'Loading assets...' : 'No assets found'}
                    </div>
                    {searchTerm && !isLoading && (
                      <div className="text-white/40 text-xs mt-1">
                        Try a different search term
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <VirtualizedList
                  items={assets}
                  itemHeight={72}
                  buffer={5}
                  height={listHeight}
                  renderItem={renderVirtualItem}
                />
              )}
            </div>
          </div>
        </Portal>
      )}
    </>
  )
}
