import type { Datafeed, SymbolInfo, Period, DatafeedSubscribeCallback } from '@klinecharts/pro'
import type { KLineData } from 'klinecharts'

interface PythSymbol extends SymbolInfo {
  priceId: string
  comingSoon?: boolean
}

export class PythDatafeed implements Datafeed {
  private symbols: Map<string, PythSymbol> = new Map()
  private priceCache: Map<string, number> = new Map()
  public lastPrice: number = 0
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map()
  private eventSources: Map<string, EventSource> = new Map()
  private subscribeCallbacks: Map<string, DatafeedSubscribeCallback> = new Map()
  private lastApiCall: Map<string, number> = new Map()
  private readonly MIN_API_INTERVAL = 1000
  private currentCandles: Map<string, KLineData> = new Map()
  private lastHistoricalCandles: Map<string, KLineData> = new Map()
  private priceUpdateCallback?: (price: number, ticker: string) => void
  private initialized: boolean = false
  private initPromise: Promise<void> | null = null

  constructor() {
    this.initPromise = this.initializeSymbols().then(() => { this.initialized = true })
  }
  
  private async ensureInitialized(): Promise<void> { if (!this.initialized && this.initPromise) await this.initPromise }

  setPriceUpdateCallback(callback: (price: number, ticker: string) => void) { this.priceUpdateCallback = callback }
  clearPriceUpdateCallback() { this.priceUpdateCallback = undefined }

  private async initializeSymbols() {
    try {
      const response = await fetch('/api/assets')
      if (!response.ok) throw new Error(`Failed to fetch assets: ${response.status}`)
      const data = await response.json()
      const pythSymbols: PythSymbol[] = []
      if (data.crypto_pairs && Array.isArray(data.crypto_pairs)) {
        for (const asset of data.crypto_pairs) {
          const ticker = this.formatCryptoTicker(asset.symbol)
          pythSymbols.push({ ticker, name: asset.description, shortName: asset.display, priceId: asset.pyth_id, exchange: 'Crypto', market: 'crypto', type: 'crypto', priceCurrency: 'USD', pricePrecision: this.getCryptoPrecision(asset.symbol), volumePrecision: this.getCryptoVolumePrecision(asset.symbol) })
        }
      }
      if (data.forex_pairs && Array.isArray(data.forex_pairs)) {
        for (const asset of data.forex_pairs) {
          const ticker = this.formatForexTicker(asset.symbol, asset.display)
          pythSymbols.push({ ticker, name: asset.description, shortName: asset.display, priceId: asset.pyth_id, exchange: 'FX', market: 'forex', type: 'forex', priceCurrency: this.getForexQuoteCurrency(asset.display), pricePrecision: 4, volumePrecision: 0 })
        }
      }
      if (data.us_stocks && Array.isArray(data.us_stocks)) {
        for (const asset of data.us_stocks) {
          if (asset.display.includes('PRE MARKET') || asset.display.includes('POST MARKET') || asset.display.includes('OVERNIGHT')) continue
          const ticker = asset.symbol.toUpperCase()
          pythSymbols.push({ ticker, name: asset.description, shortName: asset.display, priceId: asset.pyth_id, exchange: 'NASDAQ', market: 'stocks', type: 'stocks', priceCurrency: 'USD', pricePrecision: 2, volumePrecision: 0 })
        }
      }
      if (data.us_stocks_coming_soon && Array.isArray(data.us_stocks_coming_soon)) {
        for (const asset of data.us_stocks_coming_soon) {
          if (asset.display.includes('PRE MARKET') || asset.display.includes('POST MARKET') || asset.display.includes('OVERNIGHT')) continue
          const ticker = asset.symbol.toUpperCase()
          pythSymbols.push({ ticker, name: `${asset.description} - Coming Soon!`, shortName: `${asset.display} (Coming Soon)`, priceId: asset.pyth_id, exchange: 'NASDAQ', market: 'stocks', type: 'stocks', priceCurrency: 'USD', pricePrecision: 2, volumePrecision: 0, comingSoon: true } as PythSymbol & { comingSoon?: boolean })
        }
      }
      pythSymbols.forEach(symbol => { this.symbols.set(symbol.ticker, symbol) })
    } catch (error) {
      throw new Error('Unable to load asset data from API')
    }
  }

  private formatCryptoTicker(symbol: string): string { const cleanSymbol = symbol.toUpperCase().trim(); if (cleanSymbol.includes('USD')) return cleanSymbol; return `${cleanSymbol}USD` }
  private formatForexTicker(symbol: string, display: string): string { if (display && display.includes('/')) return display.replace('/', '').replace(/\s+/g, '').toUpperCase(); return symbol.toUpperCase().replace(/[^A-Z]/g, '') }
  private getCryptoPrecision(symbol: string): number { const highPrecisionCoins = ['DOGE', 'SHIB', 'PEPE', 'FLOKI']; if (highPrecisionCoins.some(coin => symbol.toUpperCase().includes(coin))) return 6; return 2 }
  private getCryptoVolumePrecision(symbol: string): number { const highVolumeCoins = ['BTC', 'ETH']; if (highVolumeCoins.some(coin => symbol.toUpperCase().includes(coin))) return 8; return 4 }
  private getForexQuoteCurrency(display: string): string { if (display && display.includes('/')) return display.split('/')[1].trim(); return 'USD' }

  async searchSymbols(search?: string): Promise<SymbolInfo[]> { await this.ensureInitialized(); const results: SymbolInfo[] = []; for (const symbol of this.symbols.values()) { if (!search || symbol.ticker.toLowerCase().includes(search.toLowerCase()) || symbol.name?.toLowerCase().includes(search.toLowerCase())) { results.push({ ticker: symbol.ticker, name: symbol.name, shortName: symbol.shortName, exchange: symbol.exchange, market: symbol.market, type: symbol.type, priceCurrency: symbol.priceCurrency, pricePrecision: symbol.pricePrecision, volumePrecision: symbol.volumePrecision }) } } return results }

  async getHistoryKLineData(symbol: SymbolInfo, period: Period, from: number, to: number): Promise<KLineData[]> {
    await this.ensureInitialized()
    const fromTimestamp = from > 10000000000 ? Math.floor(from / 1000) : from
    const toTimestamp = to > 10000000000 ? Math.floor(to / 1000) : to
    const now = Math.floor(Date.now() / 1000)
    const periodSeconds = this.periodToMs(period) / 1000
    const validFrom = fromTimestamp > 0 && fromTimestamp < now ? fromTimestamp : now - (30 * 24 * 60 * 60)
    // Set to to future time to ensure we get the latest available bar (including current forming candle)
    const validTo = toTimestamp > validFrom ? toTimestamp : now + periodSeconds
    const symbolData = this.symbols.get(symbol.ticker)
    if (!symbolData) throw new Error(`Symbol ${symbol.ticker} not found`)

    try {
      const bars = await this.fetchRealHistoricalData(symbolData.priceId, period, validFrom, validTo, symbol)
      if (bars.length > 0) {
        const lastCandle = bars[bars.length - 1]
        const lastCandleKey = `${symbol.ticker}_${period.text}_lastHistoricalCandle`
        this.lastHistoricalCandles.set(lastCandleKey, lastCandle)

        // Check if we need to initialize current candle tracking
        const currentKey = `${symbol.ticker}_${period.text}_current`
        const periodMs = this.periodToMs(period)
        const currentBarTime = Math.floor(Date.now() / periodMs) * periodMs
        const existingCurrentCandle = this.currentCandles.get(currentKey)

        // If no current candle exists, check if the last historical candle is the current forming candle
        if (!existingCurrentCandle) {
          const timeDiff = Math.abs(lastCandle.timestamp - currentBarTime)
          if (timeDiff < periodMs) {
            // The last historical candle is the current forming candle!
            // Use it to initialize current candle tracking
            this.currentCandles.set(currentKey, { ...lastCandle })
          } else if (lastCandle.timestamp < currentBarTime) {
            const barsDiff = Math.floor((currentBarTime - lastCandle.timestamp) / periodMs)
            if (barsDiff === 1) {
              // Try to fetch higher resolution data for the current candle period to get proper wicks
              try {
                const currentCandleData = await this.fetchCurrentCandleData(symbolData.priceId, period, currentBarTime, symbol)
                if (currentCandleData) {
                  this.currentCandles.set(currentKey, currentCandleData)
                } else {
                  // Fallback: initialize from last close
                  const initialCurrentCandle: KLineData = {
                    timestamp: currentBarTime,
                    open: lastCandle.close,
                    high: lastCandle.close,
                    low: lastCandle.close,
                    close: lastCandle.close,
                    volume: 0
                  }
                  this.currentCandles.set(currentKey, initialCurrentCandle)
                }
              } catch {
                // Fallback: initialize from last close
                const initialCurrentCandle: KLineData = {
                  timestamp: currentBarTime,
                  open: lastCandle.close,
                  high: lastCandle.close,
                  low: lastCandle.close,
                  close: lastCandle.close,
                  volume: 0
                }
                this.currentCandles.set(currentKey, initialCurrentCandle)
              }
            }
          }
        }
      }
      return bars
    } catch {
      return []
    }
  }

  subscribe(symbol: SymbolInfo, period: Period, callback: DatafeedSubscribeCallback): void {
    console.log(`Subscribe called for ${symbol.ticker} ${period.text}`)
    this.ensureInitialized().then(async () => {
      const symbolData = this.symbols.get(symbol.ticker)
      if (!symbolData) { console.error(`Symbol ${symbol.ticker} not found in symbols map`); return }
      const key = `${symbol.ticker}_${period.text}`
      this.subscribeCallbacks.set(key, callback)
      try { this.setupSSEStreaming(symbolData.priceId, symbol.ticker, period, callback) } catch (e) {}
    }).catch(() => {})
  }

  private setupSSEStreaming(priceId: string, ticker: string, period: Period, callback: DatafeedSubscribeCallback): void {
    const key = `${ticker}_${period.text}`
    const existing = this.eventSources.get(key)
    if (existing) { try { existing.close() } catch (e) {}; this.eventSources.delete(key) }
    const currentKey = `${ticker}_${period.text}_current`
    // Don't clear current candle if it was pre-initialized from historical data
    const existingCurrentCandle = this.currentCandles.get(currentKey)
    const periodMs = this.periodToMs(period)
    const currentBarTime = Math.floor(Date.now() / periodMs) * periodMs
    if (!existingCurrentCandle || existingCurrentCandle.timestamp !== currentBarTime) {
      this.currentCandles.delete(currentKey)
    }
    const cleanPriceId = priceId.replace('0x', '')
    const fullPriceId = `0x${cleanPriceId}`
    try {
      const streamUrl = `https://hermes.pyth.network/v2/updates/price/stream?ids[]=${fullPriceId}&parsed=true`
      const eventSource = new EventSource(streamUrl)
      eventSource.onmessage = (event: MessageEvent) => {
        try {
          let data: any;
          try {
            data = JSON.parse(event.data);
          } catch (parseErr) {
            console.error('[PythDatafeed] Failed to parse price update:', parseErr, 'Data:', event.data);
            return;
          }
          if (data.parsed?.[0]?.price) {
            const priceData = data.parsed[0].price
            const realPrice = parseFloat(priceData.price) * Math.pow(10, priceData.expo)
            if (!Number.isFinite(realPrice) || realPrice <= 0) return
            this.priceCache.set(priceId, realPrice)
            this.lastPrice = realPrice
            if (this.priceUpdateCallback) { try { this.priceUpdateCallback(realPrice, ticker) } catch (err) { console.error('Error in priceUpdateCallback:', err) } }
            const now = Date.now()
            const periodMs = this.periodToMs(period)
            const barTime = Math.floor(now / periodMs) * periodMs
            const symbolData = this.symbols.get(ticker)
            const currentKey = `${ticker}_${period.text}_current`
            const currentCandle = this.currentCandles.get(currentKey)
            const lastKey = `${ticker}_${period.text}_lastHistoricalCandle`
            const hasHistoricalData = this.lastHistoricalCandles.has(lastKey)
            let pOpen = realPrice
            let pHigh = realPrice
            let pLow = realPrice

            if (currentCandle && currentCandle.timestamp === barTime) {
              // Continue existing candle - maintain the true high/low we've seen
              pOpen = currentCandle.open
              pHigh = Math.max(currentCandle.high, realPrice)
              pLow = Math.min(currentCandle.low, realPrice)
            } else {
              // New candle starting
              if (currentCandle && currentCandle.timestamp < barTime) {
                // Previous candle just completed, start new one from its close
                pOpen = currentCandle.close
                pHigh = Math.max(currentCandle.close, realPrice)
                pLow = Math.min(currentCandle.close, realPrice)
              } else {
                // First candle or gap in data
                try {
                  const lastHist = this.lastHistoricalCandles.get(lastKey)
                  if (lastHist) {
                    const timeDiff = Math.abs(lastHist.timestamp - barTime)
                    const isCurrentBar = timeDiff < periodMs
                    if (isCurrentBar) {
                      // Continue from historical candle
                      pOpen = lastHist.open
                      pHigh = Math.max(lastHist.high, realPrice)
                      pLow = Math.min(lastHist.low, realPrice)
                    } else if (lastHist.timestamp < barTime) {
                      const barsSinceLastHist = Math.floor(timeDiff / periodMs)
                      if (barsSinceLastHist === 1) {
                        // Next bar after historical
                        pOpen = lastHist.close ?? realPrice
                        pHigh = Math.max(lastHist.close ?? realPrice, realPrice)
                        pLow = Math.min(lastHist.close ?? realPrice, realPrice)
                      } else {
                        // Gap in data
                        pOpen = realPrice
                        pHigh = realPrice
                        pLow = realPrice
                      }
                    } else {
                      // Historical data is newer than current bar (shouldn't happen)
                      pOpen = realPrice
                      pHigh = realPrice
                      pLow = realPrice
                    }
                  } else if (!hasHistoricalData) {
                    // No historical data available
                    return
                  }
                } catch (e) {
                  // Fallback
                  pOpen = realPrice
                  pHigh = realPrice
                  pLow = realPrice
                }
              }
            }
            const kline: KLineData = { timestamp: barTime, open: pOpen, high: pHigh, low: pLow, close: realPrice, volume: 0 }
            if (kline.high < kline.low || !Number.isFinite(kline.open) || !Number.isFinite(kline.high) || !Number.isFinite(kline.low) || !Number.isFinite(kline.close)) return
            this.currentCandles.set(currentKey, { ...kline })
            const callbackKey = `${ticker}_${period.text}`
            const storedCallback = this.subscribeCallbacks.get(callbackKey)
            if (storedCallback) { try { storedCallback(kline) } catch (err) { console.error('Error calling chart callback:', err) } } else { console.warn(`No callback registered for ${callbackKey}`) }
          }
        } catch (err) { console.error('Error processing SSE message:', err) }
      }
      eventSource.onerror = () => { eventSource.close(); this.eventSources.delete(key) }
      this.eventSources.set(key, eventSource)
    } catch {}
  }



  unsubscribe(symbol: SymbolInfo, period: Period): void {
    const key = `${symbol.ticker}_${period.text}`
    const es = this.eventSources.get(key)
    if (es) { try { es.close() } catch {} this.eventSources.delete(key) }
    const callbackKey = `${symbol.ticker}_${period.text}`
    this.subscribeCallbacks.delete(callbackKey)
    const currentKey = `${symbol.ticker}_${period.text}_current`
    this.currentCandles.delete(currentKey)
    const cacheKeysToClean = [ `${symbol.ticker}_${period.text}_open`, `${symbol.ticker}_${period.text}_high`, `${symbol.ticker}_${period.text}_low`, `${symbol.ticker}_${period.text}_lastBarTime` ]
    cacheKeysToClean.forEach(cacheKey => this.priceCache.delete(cacheKey))
  }

  private async fetchPythHistoricalData(priceId: string, period: Period, from: number, to: number): Promise<KLineData[]> {
    try {
      const cleanPriceId = priceId.replace('0x', '')
      const fullPriceId = `0x${cleanPriceId}`
      const resolutionMap: { [key: string]: string } = { '1m': '1', '5m': '5', '15m': '15', '1H': '60', '4H': '240' }
      const resolution = resolutionMap[period.text] || '15'
      const endpoint = 'https://hermes.pyth.network/v1/shims/tradingview/history'
      const historyUrl = `${endpoint}?symbol=Crypto.${fullPriceId}/USD&resolution=${resolution}&from=${from}&to=${to}`
      const response = await fetch(historyUrl, { signal: AbortSignal.timeout(15000) })
      if (!response.ok) { return [] }
      const data = await response.json()
      if (data.s === 'ok' && data.t && data.t.length > 0) {
        const bars: KLineData[] = []
        for (let i = 0; i < data.t.length; i++) {
          const timestamp = data.t[i] * 1000
          const open = parseFloat(data.o[i])
          const high = parseFloat(data.h[i])
          const low = parseFloat(data.l[i])
          const close = parseFloat(data.c[i])
          if (!timestamp || timestamp <= 0 || !Number.isFinite(open) || !Number.isFinite(high) || !Number.isFinite(low) || !Number.isFinite(close) || open <= 0 || high <= 0 || low <= 0 || close <= 0 || high < low || high < open || high < close || low > open || low > high || low > close) continue
          bars.push({ timestamp, open: parseFloat(open.toFixed(8)), high: parseFloat(high.toFixed(8)), low: parseFloat(low.toFixed(8)), close: parseFloat(close.toFixed(8)), volume: 0 })
        }
        return bars
      }
      return []
    } catch (error) { return [] }
  }

  private async fetchRealHistoricalData(priceId: string, period: Period, from: number, to: number, symbolInfo: SymbolInfo): Promise<KLineData[]> {
    let bars: KLineData[] = []
    const symbolData = this.symbols.get(symbolInfo.ticker)
    if (!symbolData) throw new Error(`Symbol ${symbolInfo.ticker} not found in symbols map`)
    let tradingViewSymbol: string
    if (symbolData.type === 'crypto') { const baseCurrency = symbolInfo.ticker.replace('USD', ''); tradingViewSymbol = `${baseCurrency}/USD` }
    else if (symbolData.type === 'forex') tradingViewSymbol = symbolData.shortName || symbolInfo.ticker
    else if (symbolData.type === 'stocks') tradingViewSymbol = symbolInfo.ticker
    else tradingViewSymbol = symbolInfo.ticker
    const resolutionMap: { [key: string]: string[] } = { '1m': ['1', '5'], '5m': ['5', '15'], '15m': ['15', '60'], '1H': ['60', '240'], '4H': ['240', '60'], '1D': ['D', '60'] }
    const resolutions = resolutionMap[period.text] || ['60', 'D']
    for (const resolution of resolutions) { bars = await this.tryTradingViewAPI(tradingViewSymbol, resolution, from, to, period, '', symbolInfo); if (bars.length > 0) return bars }
    const broadFrom = from - (7 * 24 * 60 * 60)
    for (const resolution of resolutions) { bars = await this.tryTradingViewAPI(tradingViewSymbol, resolution, broadFrom, to, period, '', symbolInfo); if (bars.length > 0) return bars.filter(bar => bar.timestamp >= from * 1000) }
    if (symbolData.type === 'stocks') return []
    return []
  }

  private async tryTradingViewAPI(tradingViewSymbol: string, resolution: string, from: number, to: number, period: Period, tradingSymbol: string, symbolInfo: SymbolInfo): Promise<KLineData[]> {
    const bars: KLineData[] = []
    const symbolData = this.symbols.get(symbolInfo.ticker)
    if (!symbolData) return []
    let symbolFormat: string
    if (symbolData.type === 'forex') symbolFormat = `FX.${tradingViewSymbol}`
    else if (symbolData.type === 'crypto') symbolFormat = `Crypto.${tradingViewSymbol}`
    else if (symbolData.type === 'stocks') symbolFormat = `Equity.US.${tradingViewSymbol}/USD`
    else symbolFormat = tradingViewSymbol
    const endpoint = 'https://benchmarks.pyth.network/v1/shims/tradingview/history'
    try {
      const endpointKey = `${endpoint}-${symbolFormat}-${resolution}`
      const now = Date.now()
      const lastCall = this.lastApiCall.get(endpointKey) || 0
      if (now - lastCall < this.MIN_API_INTERVAL) await new Promise(resolve => setTimeout(resolve, this.MIN_API_INTERVAL - (now - lastCall)))
      this.lastApiCall.set(endpointKey, now)
      const historyUrl = `${endpoint}?symbol=${encodeURIComponent(symbolFormat)}&resolution=${resolution}&from=${from}&to=${to}`
      const response = await fetch(historyUrl, { signal: AbortSignal.timeout(15000) })
      if (response.ok) {
        const data = await response.json()
        if (data.s === 'ok' && data.t && data.t.length > 0) {
          for (let i = 0; i < data.t.length; i++) {
            const timestamp = data.t[i] * 1000
            const open = parseFloat(data.o[i])
            const high = parseFloat(data.h[i])
            const low = parseFloat(data.l[i])
            const close = parseFloat(data.c[i])
            if (!timestamp || timestamp <= 0 || !Number.isFinite(open) || !Number.isFinite(high) || !Number.isFinite(low) || !Number.isFinite(close) || open <= 0 || high <= 0 || low <= 0 || close <= 0 || high < low || high < open || high < close || low > open || low > high || low > close) continue
            const bar: KLineData = { timestamp, open: parseFloat(open.toFixed(8)), high: parseFloat(high.toFixed(8)), low: parseFloat(low.toFixed(8)), close: parseFloat(close.toFixed(8)), volume: 0 }
            bars.push(bar)
          }
          if (bars.length > 0) {
            bars.sort((a, b) => a.timestamp - b.timestamp)
            const deduped: KLineData[] = []
            const seen = new Set<number>()
            for (let i = bars.length - 1; i >= 0; i--) { if (!seen.has(bars[i].timestamp)) { seen.add(bars[i].timestamp); deduped.unshift(bars[i]) } }
            return deduped
          }
          return bars
        }
      }
    } catch (err) {}
    return []
  }


  private getFallbackPrice(priceId: string): number {
    const fallbackMap: { [key: string]: number } = {
      'e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43': 67000,
      'ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace': 3500,
      'ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d': 150
    }
    return fallbackMap[priceId] || 50000
  }

  private getVolatilityForAssetType(assetType: string): number { switch (assetType) { case 'forex': return 0.5; case 'crypto': return 3.0; case 'stocks': return 1.5; case 'commodities': return 2.0; default: return 1.0 } }

  private periodToMs(period: Period): number { const span = (period as any).span || (period as any).multiplier || 1; const type = (period as any).type || (period as any).timespan || 'minute'; switch (type) { case 'minute': return span * 60 * 1000; case 'hour': return span * 60 * 60 * 1000; case 'day': return span * 24 * 60 * 60 * 1000; case 'week': return span * 7 * 24 * 60 * 60 * 1000; default: return 60 * 60 * 1000 } }





  private async fetchCurrentCandleData(priceId: string, period: Period, currentBarTime: number, symbolInfo: SymbolInfo): Promise<KLineData | null> {
    try {
      // For periods > 1 minute, try to fetch 1-minute data for the current candle period
      if (period.text !== '1m') {
        const periodMs = this.periodToMs(period)
        const fromTime = Math.floor(currentBarTime / 1000) // Convert to seconds
        const toTime = Math.floor((currentBarTime + periodMs) / 1000)

        const tradingSymbol = '' // No longer needed for volume
        const tradingViewSymbol = this.getTradingViewSymbol(symbolInfo)

        // Try to fetch 1-minute data for this period
        const minuteBars = await this.tryTradingViewAPI(
          tradingViewSymbol,
          '1',
          fromTime,
          toTime,
          { text: '1m', type: 'minute', span: 1 },
          tradingSymbol,
          symbolInfo
        )

        if (minuteBars.length > 0) {
          // Calculate OHLC from the 1-minute bars
          let open = minuteBars[0].open
          let high = minuteBars[0].high
          let low = minuteBars[0].low
          let close = minuteBars[minuteBars.length - 1].close
          let volume = 0

          for (const bar of minuteBars) {
            high = Math.max(high, bar.high)
            low = Math.min(low, bar.low)
            volume += bar.volume ?? 0
          }

          return {
            timestamp: currentBarTime,
            open,
            high,
            low,
            close,
            volume
          }
        }
      }
    } catch (error) {
      console.error('Error fetching current candle data:', error)
    }
    return null
  }

  private getTradingViewSymbol(symbolInfo: SymbolInfo): string {
    const symbolData = this.symbols.get(symbolInfo.ticker)
    if (!symbolData) return symbolInfo.ticker

    if (symbolData.type === 'crypto') {
      const baseCurrency = symbolInfo.ticker.replace('USD', '')
      return `${baseCurrency}/USD`
    } else if (symbolData.type === 'forex') {
      return symbolData.shortName || symbolInfo.ticker
    } else if (symbolData.type === 'stocks') {
      return symbolInfo.ticker
    }
    return symbolInfo.ticker
  }
}
