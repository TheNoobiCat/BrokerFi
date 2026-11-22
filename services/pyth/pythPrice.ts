const ETH_USD_PRICE_ID = '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace'
const PYTH_API_URL = 'https://hermes.pyth.network/v2/updates/price/latest'

let cachedEthPrice: number | null = null
let lastFetchTime = 0
const CACHE_DURATION = 10_000 // Cache for 10 seconds

export async function getEthUsdPrice(): Promise<number | null> {
  const now = Date.now()
  if (cachedEthPrice !== null && now - lastFetchTime < CACHE_DURATION) return cachedEthPrice
  try {
    const response = await fetch(`${PYTH_API_URL}?ids[]=${ETH_USD_PRICE_ID}&parsed=true`, { signal: AbortSignal.timeout(5000), cache: 'no-store' })
    if (!response.ok) return cachedEthPrice
    const data = await response.json()
    if (data.parsed?.[0]?.price) {
      const priceData = data.parsed[0].price
      const price = parseFloat(priceData.price) * Math.pow(10, priceData.expo)
      if (price > 0) { cachedEthPrice = price; lastFetchTime = now; return price }
    }
    return cachedEthPrice
  } catch (error) { return cachedEthPrice }
}

export function getCachedEthUsdPrice(): number | null { return cachedEthPrice }
