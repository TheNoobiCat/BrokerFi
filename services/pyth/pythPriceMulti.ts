import { PythDatafeed } from './PythDatafeed'

const PYTH_API_URL = 'https://hermes.pyth.network/v2/updates/price/latest'

interface PriceData {
  price: number
  change24h: number
  changePercent24h: number
  lastUpdate: number
}

const priceCache: Map<string, PriceData> = new Map()
const CACHE_DURATION = 10_000 // 10 seconds

// ---------------------------------------------------------------------------
// Prefix → full-ID map.  Loaded once from /api/assets (same source as
// PythDatafeed).  Works client-side — no fs, no server-only imports.
// ---------------------------------------------------------------------------

let prefixMapData: { prefixMap: Map<string, string>, pythIdToSymbol: Map<string, string> } | null = null
let prefixMapPromise: Promise<{ prefixMap: Map<string, string>, pythIdToSymbol: Map<string, string> }> | null = null

async function ensurePrefixMap(): Promise<{ prefixMap: Map<string, string>, pythIdToSymbol: Map<string, string> }> {
  if (prefixMapData) return prefixMapData
  if (prefixMapPromise) return prefixMapPromise

  prefixMapPromise = (async () => {
    const prefixMap = new Map<string, string>()
    const pythIdToSymbol = new Map<string, string>()
    try {
      const res = await fetch('/api/assets')
      if (!res.ok) throw new Error(`/api/assets ${res.status}`)
      const data: Record<string, Array<{ pyth_id?: string, symbol: string }>> = await res.json()

      for (const [cat, feeds] of Object.entries(data)) {
        if (cat === 'summary' || !Array.isArray(feeds)) continue
        for (const feed of feeds) {
          if (!feed.pyth_id || typeof feed.pyth_id !== 'string') continue
          const clean = feed.pyth_id.replace(/^0x/, '')
          if (clean.length !== 64) continue
          const fullId = `0x${clean}`
          pythIdToSymbol.set(fullId, feed.symbol)
          prefixMap.set(clean.substring(0, 16), fullId)
          prefixMap.set(clean, fullId)
        }
      }
    } catch (err) {
      console.warn('[pyth] Failed to build prefix map from /api/assets:', err)
    }
    prefixMapData = { prefixMap, pythIdToSymbol }
    return prefixMapData
  })()

  return prefixMapPromise
}

async function resolvePythId(rawId: string): Promise<string | null> {
  const clean = rawId.replace(/^0x/, '')

  // Already full-length — pass through
  if (clean.length === 64) {
    return rawId.startsWith('0x') ? rawId : `0x${clean}`
  }

  const { prefixMap } = await ensurePrefixMap()
  return prefixMap.get(clean) ?? null
}

/**
 * Get the symbol for a full Pyth ID
 */
export async function getSymbolForPythId(pythId: string): Promise<string | null> {
  const { pythIdToSymbol } = await ensurePrefixMap()
  return pythIdToSymbol.get(pythId) ?? null
}

/**
 * Fetch price for a single Pyth price ID
 */
export async function getPythPrice(pythId: string): Promise<number | null> {
  try {
    const fullId = await resolvePythId(pythId)
    if (!fullId) return null
    
    const response = await fetch(
      `${PYTH_API_URL}?ids[]=${fullId}&parsed=true`,
      { signal: AbortSignal.timeout(5000), cache: 'no-store' }
    )
    
    if (!response.ok) return null
    
    const data = await response.json()
    if (data.parsed?.[0]?.price) {
      const priceData = data.parsed[0].price
      const price = parseFloat(priceData.price) * Math.pow(10, priceData.expo)
      if (price > 0) {
        return price
      }
    }
    
    return null
  } catch (error) {
    console.error(`Error fetching Pyth price for ${pythId}:`, error)
    return null
  }
}

/**
 * Fetch prices for multiple Pyth price IDs at once
 */
export async function getPythPricesBatch(pythIds: string[]): Promise<Map<string, number>> {
  const prices = new Map<string, number>()
  
  try {
    const resolvedEntries: Array<{ input: string; resolved: string }> = []

    for (const id of pythIds) {
      const resolved = await resolvePythId(id)
      if (resolved) resolvedEntries.push({ input: id, resolved })
    }

    if (!resolvedEntries.length) return prices

    const queryParams = resolvedEntries.map(({ resolved }) => `ids[]=${resolved}`).join('&')
    
    const response = await fetch(
      `${PYTH_API_URL}?${queryParams}&parsed=true`,
      { signal: AbortSignal.timeout(5000), cache: 'no-store' }
    )
    
    if (!response.ok) return prices
    
    const data = await response.json()
    
    if (data.parsed && Array.isArray(data.parsed)) {
      data.parsed.forEach((item: { price?: { price: string; expo: number } }, index: number) => {
        const mapping = resolvedEntries[index]
        if (!mapping) return
        if (item?.price) {
          const price = parseFloat(item.price.price) * Math.pow(10, item.price.expo)
          if (price > 0) {
            prices.set(mapping.input, price)
          }
        }
      })
    }
    
    return prices
  } catch (error) {
    console.error('Error fetching batch Pyth prices:', error)
    return prices
  }
}

/**
 * Get cached price data with 24h change info
 */
export function getCachedPriceData(pythId: string): PriceData | null {
  const cached = priceCache.get(pythId)
  if (!cached) return null
  
  const now = Date.now()
  if (now - cached.lastUpdate > CACHE_DURATION) {
    return null
  }
  
  return cached
}

/**
 * Fetch and cache price data with 24h changes
 * Uses historical data to calculate proper 24h change like the sidebar
 */
export async function fetchPriceWithChange(pythId: string): Promise<PriceData | null> {
  const cached = getCachedPriceData(pythId)
  if (cached) return cached
  
  const price = await getPythPrice(pythId)
  if (!price) return null
  
  const fullId = await resolvePythId(pythId)
  if (!fullId) return null
  
  let changePercent24h = 0
  let change24h = 0
  
  try {
    const symbol = await getSymbolForPythId(fullId)
    if (symbol) {
      const datafeed = new PythDatafeed()
      const symbols = await datafeed.searchSymbols(symbol)
      const matched = symbols.find(s => s.ticker === symbol)
      if (matched) {
        const now = Date.now()
        const from = now - 24 * 60 * 60 * 1000
                const bars = await datafeed.getHistoryKLineData(matched, ({ multiplier: 1, timespan: 'hour', text: '1H' } as any), Math.floor(from / 1000), Math.floor(now / 1000))
        if (bars.length > 0) {
          const baseline = bars[0].close
          if (baseline && typeof baseline === 'number' && baseline > 0) {
            changePercent24h = ((price - baseline) / baseline) * 100
            change24h = price - baseline
          }
        }
      }
    }
  } catch (e) {
    console.warn('[pyth] Failed to fetch 24h baseline for change calculation:', e)
  }
  
  const priceData: PriceData = {
    price,
    change24h,
    changePercent24h,
    lastUpdate: Date.now()
  }
  
  priceCache.set(pythId, priceData)
  return priceData
}

/**
 * Fetch multiple prices with change data
 */
export async function fetchPricesWithChange(
  pythIds: string[]
): Promise<Map<string, PriceData>> {
  const result = new Map<string, PriceData>()
  
  // Check cache first
  const now = Date.now()
  const idsToFetch: string[] = []
  
  for (const pythId of pythIds) {
    const cached = priceCache.get(pythId)
    if (cached && now - cached.lastUpdate < CACHE_DURATION) {
      result.set(pythId, cached)
    } else {
      idsToFetch.push(pythId)
    }
  }
  
  // Fetch missing prices
  if (idsToFetch.length > 0) {
    const prices = await getPythPricesBatch(idsToFetch)
    
    for (const pythId of idsToFetch) {
      const price = prices.get(pythId)
      if (price) {
        const fullId = await resolvePythId(pythId)
        let changePercent24h = 0
        let change24h = 0
        
        if (fullId) {
          try {
            const symbol = await getSymbolForPythId(fullId)
            if (symbol) {
              const datafeed = new PythDatafeed()
              const symbols = await datafeed.searchSymbols(symbol)
              const matched = symbols.find(s => s.ticker === symbol)
              if (matched) {
                const from = now - 24 * 60 * 60 * 1000
                const bars = await datafeed.getHistoryKLineData(matched, ({ multiplier: 1, timespan: 'hour', text: '1H' } as any), Math.floor(from / 1000), Math.floor(now / 1000))
                if (bars.length > 0) {
                  const baseline = bars[0].close
                  if (baseline && typeof baseline === 'number' && baseline > 0) {
                    changePercent24h = ((price - baseline) / baseline) * 100
                    change24h = price - baseline
                  }
                }
              }
            }
          } catch (e) {
            console.warn('[pyth] Failed to fetch 24h baseline for batch change calculation:', e)
          }
        }
        
        const priceData: PriceData = {
          price,
          change24h,
          changePercent24h,
          lastUpdate: now
        }
        
        priceCache.set(pythId, priceData)
        result.set(pythId, priceData)
      }
    }
  }
  
  return result
}

/**
 * Fetch Pyth price update data for contracts
 */
export async function getPythUpdateData(pythIds: string[]): Promise<string[]> {
  try {
    const idsParam = pythIds.map(id => `ids[]=${id}`).join('&')
    const response = await fetch(
      `${PYTH_API_URL}?${idsParam}&binary=true`,
      { signal: AbortSignal.timeout(5000), cache: 'no-store' }
    )
    
    if (!response.ok) return []
    
    const data = await response.json()
    if (data.binary?.data) {
      // Extract binary data as hex strings (convert to bytes[] for calldata)
      if (Array.isArray(data.binary.data)) {
        return data.binary.data.map((hex: string) => '0x' + hex)
      } else if (typeof data.binary.data === 'string') {
        return ['0x' + data.binary.data]
      }
    }
    
    return []
  } catch (error) {
    console.error('Error fetching Pyth update data:', error)
    return []
  }
}
