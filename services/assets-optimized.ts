// Optimized Asset Service
// Handles loading and transforming compressed asset data for enterprise performance

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

// In-memory cache
let assetsCache: AssetData[] | null = null
let assetBySlugCache: Map<string, AssetData> | null = null
let assetBySymbolCache: Map<string, AssetData> | null = null
let cacheVersion: number | null = null

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
  
  // Extract name from description (same logic as before)
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

  return {
    pyth_id: opt.i, // Will be expanded to full ID if needed
    symbol: opt.s,
    display: opt.d,
    description: opt.n,
    category,
    comingSoon: opt.cs === 1,
    name,
    type,
    priceId: opt.i, // Use shortened ID as priceId (works for Pyth)
    urlSlug,
    searchTerms,
    popular: opt.p === 1
  }
}

async function loadOptimizedAssets(): Promise<AssetData[]> {
  if (assetsCache) return assetsCache

  try {
    // Load optimized index from static file
    const response = await fetch('/data/assets-index.json', {
      cache: 'force-cache',
      next: { revalidate: 3600 } // Revalidate every hour
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch optimized assets: ${response.status}`)
    }
    
    const index: OptimizedIndex = await response.json()
    
    // Check if we need to reload (version changed)
    if (cacheVersion !== null && cacheVersion !== index.v) {
      // Clear cache on version change
      assetsCache = null
      assetBySlugCache = null
      assetBySymbolCache = null
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
    
    return assets
  } catch (error) {
    console.error('Failed to load optimized assets:', error)
    // Fallback to old API
    return loadLegacyAssets()
  }
}

// Fallback to legacy API if optimized fails
async function loadLegacyAssets(): Promise<AssetData[]> {
  const response = await fetch('/api/assets')
  if (!response.ok) throw new Error(`Failed to fetch assets: ${response.status}`)
  const data = await response.json()
  
  const assets: AssetData[] = []
  for (const [category, categoryAssets] of Object.entries(data) as [AssetCategory | string, PytheAsset[]][]) {
    if (category === 'summary') continue
    if (!Array.isArray(categoryAssets)) continue
    
    const isComingSoon = category === 'us_stocks_coming_soon'
    const actualCategory: AssetCategory = isComingSoon ? 'us_stocks' : category as AssetCategory
    
    for (const asset of categoryAssets) {
      if (category !== 'summary') {
        assets.push(transformPythAsset({
          ...asset,
          category: actualCategory,
          comingSoon: isComingSoon
        }))
      }
    }
  }
  
  assetsCache = assets
  assetBySlugCache = new Map(assets.map(asset => [asset.urlSlug, asset]))
  assetBySymbolCache = new Map(assets.map(asset => [asset.symbol.toLowerCase(), asset]))
  
  return assets
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

  return {
    ...asset,
    name,
    type: typeMapping[asset.category],
    priceId: asset.pyth_id,
    urlSlug,
    searchTerms
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

export async function searchAssets(
  query: string, 
  category?: AssetCategory | 'all',
  limit: number = 500
): Promise<AssetData[]> {
  const allAssets = await loadAssets()
  const searchLower = query.toLowerCase()
  
  let filtered = allAssets
  if (category && category !== 'all') {
    filtered = allAssets.filter(a => a.category === category)
  }
  
  if (!query) return filtered.slice(0, limit)
  
  const matches = filtered.filter(asset => 
    asset.searchTerms.some(term => term.includes(searchLower))
  )
  
  return matches.slice(0, limit)
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
  let assets = await searchAssets(searchQuery || '', category, 10000)
  
  const totalCount = assets.length
  const start = page * pageSize
  const end = start + pageSize
  const paginatedAssets = assets.slice(start, end)
  const hasMore = end < totalCount
  
  return { assets: paginatedAssets, totalCount, hasMore }
}

export function assetToInstrument(asset: AssetData): any {
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
  const allAssets = await loadAssets()
  if (!assetBySlugCache) return []
  
  const popular: AssetData[] = []
  for (const slug of POPULAR_ASSETS) {
    const asset = assetBySlugCache.get(slug)
    if (asset) popular.push(asset)
  }
  return popular
}

export const ASSET_CATEGORIES = [
  { key: 'all', label: 'All', description: 'All available instruments' },
  { key: 'crypto_pairs', label: 'Crypto', description: 'Cryptocurrency pairs' },
  { key: 'us_stocks', label: 'Stocks', description: 'US Stock markets' },
  { key: 'forex_pairs', label: 'Forex', description: 'Foreign exchange pairs' },
  { key: 'commodities', label: 'Commodities', description: 'Commodities and futures' }
] as const

export async function getStocks(): Promise<AssetData[]> {
  const allAssets = await loadAssets()
  return allAssets.filter(a => a.type === 'stocks' && !a.comingSoon)
}

export async function searchStocks(query: string, limit: number = 500): Promise<AssetData[]> {
  return searchAssets(query, 'us_stocks', limit)
}
