// Efficient asset management system for BrokerFi
// Handles 1,100+ assets from Pyth Network efficiently
// OPTIMIZED VERSION: Uses compressed index files for 87% bandwidth reduction

import type { InstrumentData } from '../blockchain/priceFeeds'

// Asset categories with improved type safety
export type AssetCategory = 'us_stocks' | 'crypto_pairs' | 'forex_pairs' | 'commodities'

export interface OptimizedAsset {
  i: string  // pyth_id (shortened)
  s: string  // symbol
  d: string  // display
  n: string  // name/description
  t: 'c' | 's' | 'f' | 'x'  // type
  cs?: 1  // comingSoon flag
  p?: 1   // popular flag
}

export interface PytheAsset {
  pyth_id: string
  symbol: string
  display: string
  description: string
  category: AssetCategory
  comingSoon?: boolean
}

export interface AssetData extends PytheAsset {
  name: string
  type: 'stocks' | 'crypto' | 'forex' | 'commodities'
  priceId: string
  urlSlug: string
  searchTerms: string[]
  popular?: boolean
}

interface OptimizedIndex {
  c: OptimizedAsset[]  // crypto
  s: OptimizedAsset[]  // stocks
  f: OptimizedAsset[]  // forex
  x: OptimizedAsset[]  // commodities
  v: number            // version
}

// Cache for loaded assets
let assetsCache: AssetData[] | null = null
let assetBySlugCache: Map<string, AssetData> | null = null
let assetBySymbolCache: Map<string, AssetData> | null = null
let assetByPythIdCache: Map<string, AssetData> | null = null
let cacheVersion: number | null = null

// Cache for perps markets
let perpsMarketsCache: string[] | null = null

const TYPE_TO_CATEGORY: Record<'c' | 's' | 'f' | 'x', AssetCategory> = {
  c: 'crypto_pairs',
  s: 'us_stocks',
  f: 'forex_pairs',
  x: 'commodities'
}

const TYPE_TO_NAME: Record<'c' | 's' | 'f' | 'x', 'crypto' | 'stocks' | 'forex' | 'commodities'> = {
  c: 'crypto',
  s: 'stocks',
  f: 'forex',
  x: 'commodities'
}

// Load supported perps markets
function loadPerpsMarkets(): string[] {
  if (perpsMarketsCache) return perpsMarketsCache

  // For now, hardcode the supported perps assets
  perpsMarketsCache = ['ETH', 'BTC']
  return perpsMarketsCache
}

// Check if an asset is supported for perps trading
function isAssetSupportedForPerps(symbol: string): boolean {
  const supportedAssets = loadPerpsMarkets()
  return supportedAssets.some(baseAsset => symbol.startsWith(baseAsset))
}

// URL slug generation for efficient routing
function generateUrlSlug(symbol: string, category: AssetCategory, display: string): string {
  const cleanSymbol = symbol.toLowerCase().replace(/[^a-z0-9]/g, '')
  const prefix = {
    'us_stocks': 'stock',
    'crypto_pairs': 'crypto', 
    'forex_pairs': 'forex',
    'commodities': 'commodity'
  }[category]

  if (category === 'forex_pairs' && display && display.includes('/')) {
    const baseCurrency = display.split('/')[0].toLowerCase()
    return `${prefix}-${baseCurrency}`
  }

  return `${prefix}-${cleanSymbol}`
}

function expandAsset(opt: OptimizedAsset): AssetData {
  const category = TYPE_TO_CATEGORY[opt.t]
  const type = TYPE_TO_NAME[opt.t]
  
  // Extract name from description (keep full description for sidebar)
  let name = opt.n
    .replace(/ \/ US DOLLAR.*$/i, '')
    .replace(/ - .*$/i, '')
    .replace(/^DEPRECATED FEED - /i, '')
    .split(' ')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')

  if (name.length < 3) {
    name = opt.s
  }

  const urlSlug = generateUrlSlug(opt.s, category, opt.d)
  const searchTerms = [
    opt.s.toLowerCase(),
    name.toLowerCase(),
    opt.d.toLowerCase(),
    opt.n.toLowerCase(),
    urlSlug
  ]

  const asset: AssetData = {
    pyth_id: opt.i, // Shortened ID (16 chars)
    symbol: opt.s,
    display: opt.d,
    description: opt.n, // Full description for sidebar display
    category,
    comingSoon: opt.cs === 1,
    name,
    type,
    priceId: opt.i, // Use shortened ID (Pyth accepts partial IDs)
    urlSlug,
    searchTerms,
    popular: opt.p === 1
  }

  // Override comingSoon based on perps support
  // Crypto assets: only available if they have perps markets
  // Stocks & Forex: all coming soon since no stock/forex perps exist yet
  // Preserve existing comingSoon flags from data
  if (!asset.comingSoon) {
    if (asset.type === 'crypto') {
      asset.comingSoon = !isAssetSupportedForPerps(asset.symbol)
    } else if (asset.type === 'stocks' || asset.type === 'forex') {
      asset.comingSoon = true
    }
  }

  return asset
}

function transformPythAsset(asset: PytheAsset): AssetData {
  const typeMapping = {
    'us_stocks': 'stocks' as const,
    'crypto_pairs': 'crypto' as const, 
    'forex_pairs': 'forex' as const,
    'commodities': 'commodities' as const
  }

  let name = asset.description
    .replace(/ \/ US DOLLAR.*$/i, '')
    .replace(/ - .*$/i, '')
    .replace(/^DEPRECATED FEED - /i, '')
    .split(' ')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')

  if (name.length < 3) {
    name = asset.symbol
  }

  const urlSlug = generateUrlSlug(asset.symbol, asset.category, asset.display)
  const searchTerms = [
    asset.symbol.toLowerCase(),
    name.toLowerCase(),
    asset.display.toLowerCase(),
    asset.description.toLowerCase(),
    urlSlug
  ]

  const assetData = {
    ...asset,
    name,
    type: typeMapping[asset.category],
    priceId: asset.pyth_id,
    urlSlug,
    searchTerms
  }

  // Override comingSoon for crypto assets based on perps support
  // Stocks & Forex: all coming soon since no stock/forex perps exist yet
  // Preserve existing comingSoon flags from data
  if (!assetData.comingSoon) {
    if (assetData.type === 'crypto') {
      assetData.comingSoon = !isAssetSupportedForPerps(assetData.symbol)
    } else if (assetData.type === 'stocks' || assetData.type === 'forex') {
      assetData.comingSoon = true
    }
  }

  return assetData
}

async function loadOptimizedAssets(): Promise<AssetData[]> {
  if (assetsCache) return assetsCache

  try {
    // Try to load optimized index first
    const response = await fetch('/data/assets-index.json', {
      cache: 'force-cache'
    })
    
    if (!response.ok) {
      console.warn('Optimized assets not found, falling back to legacy API')
      return loadLegacyAssets()
    }
    
    const index: OptimizedIndex = await response.json()
    
    // Check if we need to reload (version changed)
    if (cacheVersion !== null && cacheVersion !== index.v) {
      assetsCache = null
      assetBySlugCache = null
      assetBySymbolCache = null
      assetByPythIdCache = null
    }
    
    cacheVersion = index.v
    
    // Expand all assets
    const assets: AssetData[] = []
    
    for (const opt of index.c) assets.push(expandAsset(opt))
    for (const opt of index.s) assets.push(expandAsset(opt))
    for (const opt of index.f) assets.push(expandAsset(opt))
    for (const opt of index.x) assets.push(expandAsset(opt))
    
    // Build lookup caches
    assetsCache = assets
    assetBySlugCache = new Map(assets.map(asset => [asset.urlSlug, asset]))
    assetBySymbolCache = new Map(assets.map(asset => [asset.symbol.toLowerCase(), asset]))
    assetByPythIdCache = new Map(assets.map(asset => [asset.pyth_id, asset]))
    
    return assets
  } catch (error) {
    console.error('Failed to load optimized assets:', error)
    return loadLegacyAssets()
  }
}

async function loadLegacyAssets(): Promise<AssetData[]> {
  if (assetsCache) return assetsCache
  
  try {
    const response = await fetch('/api/assets')
    if (!response.ok) throw new Error(`Failed to fetch assets: ${response.status} ${response.statusText}`)
    const data = await response.json()
    const assets: AssetData[] = []
    for (const [category, categoryAssets] of Object.entries(data) as [AssetCategory | string, PytheAsset[]][]) {
      if (category === 'summary') continue
      if (!Array.isArray(categoryAssets)) continue
      const isComingSoon = category === 'us_stocks_coming_soon'
      const actualCategory: AssetCategory = isComingSoon ? 'us_stocks' : category as AssetCategory
      for (const asset of categoryAssets) {
        if (category !== 'summary') {
          const assetData = transformPythAsset({
            ...asset,
            category: actualCategory,
            comingSoon: isComingSoon
          })
          
          // Override comingSoon for crypto assets based on perps support
          // Stocks & Forex: all coming soon since no stock/forex perps exist yet
          // Preserve existing comingSoon flags from data
          if (!assetData.comingSoon) {
            if (assetData.type === 'crypto') {
              assetData.comingSoon = !isAssetSupportedForPerps(assetData.symbol)
            } else if (assetData.type === 'stocks' || assetData.type === 'forex') {
              assetData.comingSoon = true
            }
          }
          
          assets.push(assetData)
        }
      }
    }
    assetsCache = assets
    assetBySlugCache = new Map(assets.map(asset => [asset.urlSlug, asset]))
    assetBySymbolCache = new Map(assets.map(asset => [asset.symbol.toLowerCase(), asset]))
    assetByPythIdCache = new Map(assets.map(asset => [asset.pyth_id, asset]))
    return assets
  } catch (error) {
    return []
  }
}

export async function loadAssets(): Promise<AssetData[]> {
  return loadOptimizedAssets()
}

export async function getAssetBySlug(slug: string): Promise<AssetData | null> {
  if (!assetBySlugCache) await loadAssets()
  return assetBySlugCache?.get(slug) || null
}

export async function getAssetBySymbol(symbol: string): Promise<AssetData | null> {
  if (!assetBySymbolCache) await loadAssets()
  return assetBySymbolCache?.get(symbol.toLowerCase()) || null
}

export async function getAssetByPythId(pythId: string): Promise<AssetData | null> {
  if (!assetByPythIdCache) await loadAssets()
  // Pyth IDs in subgraph are full 64-char hex with 0x prefix, but assets have shortened 16-char IDs without 0x
  const shortPythId = pythId.startsWith('0x') ? pythId.slice(2, 18) : pythId.slice(0, 16)
  return assetByPythIdCache?.get(shortPythId) || null
}

export async function searchAssets(
  query: string, 
  category?: AssetCategory | 'all',
  limit: number = 500
): Promise<AssetData[]> {
  const assets = await loadAssets()
  const lowerQuery = query.toLowerCase().trim()
  let filtered = assets
  if (category && category !== 'all') filtered = filtered.filter(asset => asset.category === category)
  if (category === 'us_stocks' || category === 'all') {
    filtered = filtered.filter(asset => {
      if (asset.type === 'stocks') {
        return !asset.display.includes('PRE MARKET') && !asset.display.includes('POST MARKET') && !asset.display.includes('OVERNIGHT')
      }
      return true
    })
  }
  if (lowerQuery) {
    filtered = filtered.filter(asset => asset.searchTerms.some(term => term.includes(lowerQuery)))
  }
  return limit === Infinity ? filtered : filtered.slice(0, limit)
}

export async function getPaginatedAssets(
  page: number = 0,
  pageSize: number = 50,
  category?: AssetCategory | 'all',
  searchQuery?: string
): Promise<{
  assets: AssetData[]
  totalCount: number
  hasMore: boolean
}> {
  const allResults = await searchAssets(searchQuery || '', category, Infinity)
  const start = page * pageSize
  const end = start + pageSize
  const assets = allResults.slice(start, end)
  return { assets, totalCount: allResults.length, hasMore: end < allResults.length }
}

export function assetToInstrument(asset: AssetData): InstrumentData {
  let symbol: string
  if (asset.type === 'crypto') {
    const cleanSymbol = asset.symbol.toUpperCase().trim()
    if (cleanSymbol.includes('USD')) symbol = cleanSymbol
    else symbol = `${cleanSymbol}USD`
  } else if (asset.type === 'forex') {
    if (asset.display && asset.display.includes('/')) symbol = asset.display.replace('/', '').replace(/\s+/g, '').toUpperCase()
    else symbol = asset.symbol.toUpperCase().replace(/[^A-Z]/g, '')
  } else if (asset.type === 'stocks') symbol = asset.symbol.toUpperCase()
  else symbol = asset.symbol.toUpperCase().replace(/[^A-Z0-9]/g, '')

  return {
    symbol,
    name: asset.name,
    type: asset.type,
    priceId: asset.priceId,
    price: '0.00',
    change: '+0.00%',
    volume: '0',
    positive: true
  }
}

export const POPULAR_ASSETS = [
  'crypto-btc',
  'crypto-eth', 
  'crypto-sol',
  'forex-eur',
  'forex-gbp',
  'forex-jpy',
  'stock-aapl',
  'stock-tsla',
  'stock-googl',
  'commodity-xau'
]

export async function getPopularAssets(): Promise<AssetData[]> {
  const assets: AssetData[] = []
  for (const slug of POPULAR_ASSETS) {
    const asset = await getAssetBySlug(slug)
    if (asset) assets.push(asset)
  }
  return assets
}

export const ASSET_CATEGORIES = [
  { key: 'all', label: 'All', description: 'All available instruments' },
  { key: 'crypto_pairs', label: 'Crypto', description: 'Cryptocurrency pairs' },
  { key: 'us_stocks', label: 'Stocks', description: 'US Stock markets' },
  { key: 'forex_pairs', label: 'Forex', description: 'Foreign exchange pairs' },
  { key: 'commodities', label: 'Commodities', description: 'Commodities and futures' }
] as const

export async function getStocks(): Promise<AssetData[]> {
  const assets = await loadAssets()
  return assets.filter(asset => asset.type === 'stocks')
}

export async function searchStocks(query: string, limit: number = 500): Promise<AssetData[]> {
  const stocks = await getStocks()
  const lowerQuery = query.toLowerCase().trim()
  if (!lowerQuery) return stocks.slice(0, limit)
  const filtered = stocks.filter(asset => asset.searchTerms.some(term => term.includes(lowerQuery)))
  return limit === Infinity ? filtered : filtered.slice(0, limit)
}
