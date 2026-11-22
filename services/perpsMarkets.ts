// Perps markets management for BrokerFi
// Handles perpetual futures markets with contract addresses

import { encodeAbiParameters, keccak256, toHex } from 'viem'
import publicClient from '@/blockchain/publicClient'
import { 
  getPerpsMarkets as getPerpsMarketsFromConfig, 
  getPerpsMarketById as getPerpsMarketByIdFromConfig, 
  getPerpsFactoryAddress,
  getUSDCAddressFromConfig 
} from './contractsConfig'

export interface PerpsMarket {
  id: string
  name: string
  displayName: string
  baseAsset: string
  quoteAsset: string
  pythPriceId: string
  poolAddress: `0x${string}`
  tradingAddress: `0x${string}`
  limitOrderBookAddress?: `0x${string}`
  lpTokenAddress: `0x${string}`
  chainId: number
  yield: number
  tvl: number
  performance: Array<{ time: string; value: number }>
}

// Cache for loaded markets
let marketsCache: PerpsMarket[] | null = null
let marketByIdCache: Map<string, PerpsMarket> | null = null

// Normalize incoming market ids so UI aliases like btcusd-perp resolve to btc-perp
const normalizeMarketId = (id: string): string => {
  const cleaned = id.trim().toLowerCase()
  const usdPerpMatch = cleaned.match(/^([a-z0-9]+)usd-perp$/)
  if (usdPerpMatch) return `${usdPerpMatch[1]}-perp`
  return cleaned
}

export async function getPerpsMarkets(): Promise<PerpsMarket[]> {
  if (marketsCache) return marketsCache

  try {
    const markets = await getPerpsMarketsFromConfig()
    marketsCache = markets.map(market => ({
      id: market.id,
      name: market.name,
      displayName: market.displayName,
      baseAsset: market.baseAsset,
      quoteAsset: market.quoteAsset,
      pythPriceId: market.pythPriceId,
      poolAddress: market.pool,
      tradingAddress: market.trading,
      limitOrderBookAddress: market.limitOrderBook,
      lpTokenAddress: market.lpToken,
      chainId: market.chainId,
      yield: market.yield,
      tvl: market.tvl,
      performance: market.performance
    }))
    return marketsCache
  } catch (error) {
    console.error('Failed to load perps markets:', error)
    return []
  }
}

export async function getPerpsMarketById(id: string): Promise<PerpsMarket | null> {
  if (!marketByIdCache) {
    const markets = await getPerpsMarkets()
    marketByIdCache = new Map(markets.map(market => [normalizeMarketId(market.id), market]))
  }

  const normalizedId = normalizeMarketId(id)
  let market = marketByIdCache.get(normalizedId)
  if (!market) return null
  
  // If limitOrderBookAddress is not set, try to fetch it from the factory
  if (!market.limitOrderBookAddress) {
    try {
      const factoryAddress = await getFactoryAddress()
      const marketId = keccak256(toHex(encodeAbiParameters(
        [{ type: 'string' }],
        [market.name]
      )))
      
      const result = await publicClient.readContract({
        address: factoryAddress,
        abi: [{
          inputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
          name: "limitOrderBooks",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        }],
        functionName: "limitOrderBooks",
        args: [marketId]
      }) as `0x${string}`
      
      if (result && result !== '0x0000000000000000000000000000000000000000') {
        market.limitOrderBookAddress = result
        // Update cache
        marketByIdCache.set(normalizedId, market)
      }
    } catch (error) {
      console.error('Failed to fetch limitOrderBookAddress:', error)
    }
  }
  
  return market
}

export async function getUSDCAddress(): Promise<`0x${string}`> {
  try {
    return await getUSDCAddressFromConfig()
  } catch (error) {
    console.error('Failed to load USDC address:', error)
    return '0x4b1fACeF3553C0c7A67D6AB240394E9aad566c2d' as `0x${string}`
  }
}

export async function getFactoryAddress(): Promise<`0x${string}`> {
  try {
    return await getPerpsFactoryAddress()
  } catch (error) {
    console.error('Failed to load factory address:', error)
    return '0xb9adef3dccd62477ac723081203c19d4d3ecf0e3' as `0x${string}`
  }
}