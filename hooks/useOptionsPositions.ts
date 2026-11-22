import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from '@/store/SessionContext'
import {
  getOptionsPositions,
  getAccountBalances,
  type OptionsPosition,
  type AccountBalances,
  formatPrice18,
} from '@/services/options'
import {
  getOptionPricing,
  calculateIV,
  getContractSize,
  RISK_FREE_RATE,
  bsCallPrice,
  bsPutPrice,
  bsDelta,
  bsGamma,
  bsTheta,
  bsVega,
} from '@/services/blackScholes'
import { getAssetByPythId } from '@/services/assets'

// ── Types ──────────────────────────────────────────────────────────────────

export interface EnrichedOptionsPosition {
  seriesId: `0x${string}`
  underlyingPriceFeedId?: `0x${string}`  // needed for settlement Pyth oracle call
  // Position data
  quantity: number
  entryPrice: number          // premium paid/received per unit (18-dec)
  isLong: boolean
  marginLocked: number        // USDC locked (18-dec)
  // Series data
  asset: string               // e.g. "BTC", "ETH"
  assetName: string           // e.g. "Bitcoin"
  isCall: boolean
  strikePrice: number
  expiry: number              // unix timestamp
  contractSize: number        // units per contract
  // Live pricing
  spotPrice: number
  currentPremium: number      // current BS price per unit
  currentPremiumPerContract: number
  // P&L
  pnl: number                 // total P&L in USD
  pnlPercent: number          // % return
  // Greeks
  iv: number
  delta: number
  gamma: number
  theta: number               // per day
  vega: number
  // Status
  daysToExpiry: number
  isExpired: boolean
  isITM: boolean
  intrinsicValue: number
  timeValue: number
}

export interface OptionsPositionsState {
  positions: EnrichedOptionsPosition[]
  balances: AccountBalances | null
  loading: boolean
  error: string | null
  refresh: () => void
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useOptionsPositions(
  spotPrices?: Record<string, number>,  // pythId → spot price
): OptionsPositionsState {
  const { channelAddress } = useSession()
  const [positions, setPositions] = useState<EnrichedOptionsPosition[]>([])
  const [balances, setBalances] = useState<AccountBalances | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const mountedRef = useRef(true)
  const spotPricesRef = useRef(spotPrices)

  // Update ref when spotPrices changes, but don't trigger re-fetch
  useEffect(() => {
    spotPricesRef.current = spotPrices
  }, [spotPrices])

  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
  }, [])

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    if (!channelAddress) {
      setPositions([])
      setBalances(null)
      setLoading(false)
      return
    }

    let cancelled = false

    async function fetchPositions() {
      setLoading(true)
      setError(null)

      try {
        const [rawPositions, accountBalances] = await Promise.all([
          getOptionsPositions(channelAddress as `0x${string}`),
          getAccountBalances(channelAddress as `0x${string}`),
        ])

        if (cancelled || !mountedRef.current) return

        setBalances(accountBalances)

        if (!rawPositions || rawPositions.length === 0) {
          setPositions([])
          setLoading(false)
          return
        }

        // Enrich each position with live pricing and Greeks
        const enriched: EnrichedOptionsPosition[] = await Promise.all(
          rawPositions.map(async (pos: OptionsPosition) => {
            // Resolve asset info
            let asset = 'UNKNOWN'
            let assetName = 'Unknown'
            if (pos.underlyingPriceFeedId) {
              try {
                const assetData = await getAssetByPythId(pos.underlyingPriceFeedId)
                if (assetData) {
                  asset = assetData.symbol
                  assetName = assetData.name
                }
              } catch {}
            }

            const isCall = pos.isCall ?? true
            const strikePrice = pos.strikePrice ? Number(pos.strikePrice) / 1e18 : 0
            const expiry = pos.expiry ? Number(pos.expiry) : 0
            const quantity = Number(pos.quantity)
            const entryPrice = Number(pos.entryPrice) / 1e18
            const marginLocked = Number(pos.marginPerContract) / 1e18 * quantity
            const contractSize = getContractSize(asset, pos.underlyingPriceFeedId)

            // Get spot price from passed-in prices or default to 0
            const feedId = pos.underlyingPriceFeedId?.toLowerCase() ?? ''
            const spotPrice = spotPricesRef.current?.[feedId] ?? 0

            // Time to expiry
            const now = Math.floor(Date.now() / 1000)
            const daysToExpiry = Math.max(0, (expiry - now) / 86400)
            const tYears = daysToExpiry / 365
            const isExpired = expiry > 0 && expiry <= now

            // Calculate current premium via Black-Scholes
            let currentPremium = 0
            let iv = 0
            let delta = 0
            let gamma = 0
            let theta = 0
            let vega = 0

            if (spotPrice > 0 && strikePrice > 0 && !isExpired) {
              iv = calculateIV(spotPrice, strikePrice, tYears)
              const r = RISK_FREE_RATE

              currentPremium = isCall
                ? bsCallPrice(spotPrice, strikePrice, tYears, r, iv)
                : bsPutPrice(spotPrice, strikePrice, tYears, r, iv)

              delta = bsDelta(spotPrice, strikePrice, tYears, r, iv, isCall)
              gamma = bsGamma(spotPrice, strikePrice, tYears, r, iv)
              theta = bsTheta(spotPrice, strikePrice, tYears, r, iv, isCall)
              vega = bsVega(spotPrice, strikePrice, tYears, r, iv)
            } else if (isExpired && spotPrice > 0) {
              // Expired: intrinsic value only
              currentPremium = isCall
                ? Math.max(0, spotPrice - strikePrice)
                : Math.max(0, strikePrice - spotPrice)
            }

            const currentPremiumPerContract = currentPremium * contractSize

            // P&L calculation
            // Long: bought at entryPrice, current value is currentPremium
            // Short: sold at entryPrice, current liability is currentPremium
            const pnlPerUnit = pos.isLong
              ? (currentPremium - entryPrice)
              : (entryPrice - currentPremium)
            const pnl = pnlPerUnit * contractSize * quantity
            const costBasis = entryPrice * contractSize * quantity
            const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0

            // ITM / intrinsic / time value
            const intrinsicValue = isCall
              ? Math.max(0, spotPrice - strikePrice)
              : Math.max(0, strikePrice - spotPrice)
            const isITM = intrinsicValue > 0
            const timeValue = Math.max(0, currentPremium - intrinsicValue)

            return {
              seriesId: pos.seriesId,
              underlyingPriceFeedId: pos.underlyingPriceFeedId,
              quantity,
              entryPrice,
              isLong: pos.isLong,
              marginLocked,
              asset,
              assetName,
              isCall,
              strikePrice,
              expiry,
              contractSize,
              spotPrice,
              currentPremium,
              currentPremiumPerContract,
              pnl,
              pnlPercent,
              iv,
              delta,
              gamma,
              theta,
              vega,
              daysToExpiry,
              isExpired,
              isITM,
              intrinsicValue,
              timeValue,
            }
          }),
        )

        if (!cancelled && mountedRef.current) {
          setPositions(enriched)
        }
      } catch (err) {
        if (!cancelled && mountedRef.current) {
          setError(String(err))
          console.error('[useOptionsPositions] Error:', err)
        }
      } finally {
        if (!cancelled && mountedRef.current) {
          setLoading(false)
        }
      }
    }

    fetchPositions()

    return () => { cancelled = true }
  }, [channelAddress, refreshTrigger])  // Removed spotPrices from deps

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!channelAddress) return
    const interval = setInterval(refresh, 30000)
    return () => clearInterval(interval)
  }, [channelAddress, refresh])

  return { positions, balances, loading, error, refresh }
}
