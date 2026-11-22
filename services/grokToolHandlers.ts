/**
 * Real tool handlers for the Grok/Vibetrader AI chat.
 *
 * Each handler fetches live data from Pyth, on-chain contracts, or the
 * asset index and returns a JSON string that gets sent back as a tool result.
 */

import { loadAssets, searchAssets, getAssetBySymbol, type AssetData } from './assets';
import { getPerpsMarkets, type PerpsMarket, getPerpsMarketById } from './perpsMarkets';
import { getPythPrice, fetchPriceWithChange, fetchPricesWithChange } from './pyth/pythPriceMulti';
import { fetchContractPositions } from './perps';
import publicClient from '@/blockchain/publicClient';

// Cache for Binance volume data to avoid hammering the API
const volumeCache = new Map<string, { volumes: number[], fetchedAt: number }>();


// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x4b1fACeF3553C0c7A67D6AB240394E9aad566c2d') as `0x${string}`;

const erc20BalanceAbi = [{
  inputs: [{ name: 'account', type: 'address' }],
  name: 'balanceOf',
  outputs: [{ name: '', type: 'uint256' }],
  stateMutability: 'view',
  type: 'function',
}] as const;

const perpTradingExtendedAbi = [{
  inputs: [],
  name: 'market',
  outputs: [
    { internalType: 'uint256', name: 'totalLongs', type: 'uint256' },
    { internalType: 'uint256', name: 'totalShorts', type: 'uint256' },
  ],
  stateMutability: 'view',
  type: 'function',
}] as const;

const PYTH_BENCHMARKS_URL = 'https://benchmarks.pyth.network/v1/shims/tradingview/history';
const BINANCE_KLINES_URL = 'https://api.binance.com/api/v3/klines';

// ---------------------------------------------------------------------------
// Main resolver
// ---------------------------------------------------------------------------

export async function resolveToolCall(
  name: string,
  args: Record<string, unknown>,
  channelAddress: string | null,
): Promise<string> {
  try {
    switch (name) {
      case 'get_available_assets':
        return await handleGetAvailableAssets();
      case 'get_perp_symbols':
        return await handleGetPerpSymbols();
      case 'search_asset':
        return await handleSearchAsset(args);
      case 'get_current_market':
        return await handleGetCurrentMarket(args);
      case 'get_open_positions':
        return await handleGetOpenPositions(channelAddress);
      case 'get_position_detail':
        return await handleGetPositionDetail(args, channelAddress);
      case 'get_account_summary':
        return await handleGetAccountSummary(channelAddress);
      case 'get_historical_candles':
        return await handleGetHistoricalCandles(args);
      case 'get_technical_indicators':
        return await handleGetTechnicalIndicators(args);
      case 'get_trade_history':
        return await handleGetTradeHistory(channelAddress);
      case 'check_liquidation_risk':
        return await handleCheckLiquidationRisk(channelAddress);
      case 'execute_perp_trade':
        return await handleExecutePerpTrade(args, channelAddress);
      case 'close_perp_position':
        return await handleClosePerpPosition(args, channelAddress);
      case 'set_cooldown':
        return await handleSetCooldown(args);
      default:
        return json({ error: `Tool "${name}" is not implemented` });
    }
  } catch (err) {
    console.error(`[grokToolHandlers] Error in ${name}:`, err);
    return json({ error: `Tool "${name}" failed: ${String(err)}` });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function json(obj: unknown): string {
  return JSON.stringify(obj);
}

/** Resolve an asset query (symbol, name, slug) to an AssetData. */
async function findAsset(query: string): Promise<AssetData | null> {
  // Try direct symbol match first
  const bySymbol = await getAssetBySymbol(query);
  if (bySymbol) return bySymbol;

  // Fuzzy search fallback
  const results = await searchAssets(query, undefined, 1);
  return results[0] ?? null;
}

/** Map our asset to the Pyth Benchmarks TradingView symbol format. */
function pythBenchmarkSymbol(asset: AssetData): string {
  switch (asset.category) {
    case 'crypto_pairs':
      return `Crypto.${asset.display}`;
    case 'us_stocks':
      return `Equity.US.${asset.symbol}/USD`;
    case 'forex_pairs':
      return `FX.${asset.display}`;
    case 'commodities':
      return `Metal.${asset.display}`;
    default:
      return asset.display;
  }
}

/** Convert user-facing timeframe strings to Pyth Benchmarks resolution. */
function mapTimeframe(tf: string): string {
  const map: Record<string, string> = {
    '1m': '1', '5m': '5', '15m': '15', '30m': '30',
    '1h': '60', '2h': '120', '4h': '240',
    '1d': 'D', '1D': 'D', 'D': 'D',
    '1w': 'W', '1W': 'W', 'W': 'W',
    '1M': 'M', 'M': 'M',
  };
  return map[tf] ?? tf;
}

/** Convert timeframe to Binance interval. */
function mapBinanceInterval(tf: string): string {
  const map: Record<string, string> = {
    '1m': '1m', '5m': '5m', '15m': '15m', '30m': '30m',
    '1h': '1h', '2h': '2h', '4h': '4h',
    '1d': '1d', '1D': '1d', 'D': '1d',
    '1w': '1w', '1W': '1w', 'W': '1w',
    '1M': '1M', 'M': '1M',
  };
  return map[tf] ?? '1h';
}

function normalizeBaseSymbol(asset: AssetData | string): string {
  if (typeof asset === 'string') {
    return asset.toUpperCase().replace(/[-\s]/g, '').replace(/USD$/, '');
  }

  let symbol = asset.symbol.toUpperCase();
  if (asset.type === 'crypto' && symbol.endsWith('USD')) symbol = symbol.replace(/USD$/, '');
  if (asset.type === 'forex' && asset.display?.includes('/')) symbol = asset.display.split('/')[0].toUpperCase();
  return symbol.replace(/[^A-Z0-9]/g, '');
}

function matchPerpMarketForAsset(asset: AssetData, markets: PerpsMarket[]): PerpsMarket | undefined {
  const base = normalizeBaseSymbol(asset);
  const priceId = asset.priceId.toLowerCase();

  return markets.find(market => {
    const marketBase = market.baseAsset.toUpperCase();
    const marketPriceId = market.pythPriceId.toLowerCase().replace(/^0x/, '');
    return marketBase === base || marketPriceId.startsWith(priceId);
  });
}

/** Read USDC balance of a channel address (returns human-readable number). */
async function getUsdcBalance(channelAddr: string): Promise<number> {
  const raw = await publicClient.readContract({
    address: USDC_ADDRESS,
    abi: erc20BalanceAbi,
    functionName: 'balanceOf',
    args: [channelAddr as `0x${string}`],
  }) as bigint;
  return Number(raw) / 1e6;
}

// ---------------------------------------------------------------------------
// Shared: fetch all perp positions for a channel address
// ---------------------------------------------------------------------------

interface FormattedPosition {
  marketId: string;
  market: string;
  side: string;
  sizeUsd: number;
  collateralUsd: number;
  leverage: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  liquidationPrice: number;
  stopLoss: number | null;
  takeProfit: number | null;
  openTime: string;
}

async function fetchAllPositions(channelAddress: string): Promise<FormattedPosition[]> {
  const markets = await getPerpsMarkets();
  const positions: FormattedPosition[] = [];

  for (const market of markets) {
    const result = await fetchContractPositions({
      channelAddress: channelAddress as `0x${string}`,
      marketId: market.id,
    });
    if (!result.success || !result.positions?.length) continue;

    const price = await getPythPrice(market.pythPriceId);

    for (const pos of result.positions) {
      const sizeUsd = Number(pos.sizeUsd) / 1e18;
      const collateralUsd = Number(pos.collateralUsd) / 1e18;
      const entryPrice = Number(pos.entryPrice) / 1e18;
      const currentPrice = price ?? entryPrice;
      const leverage = collateralUsd > 0 ? sizeUsd / collateralUsd : 0;

      // PnL
      const priceDelta = pos.isLong
        ? currentPrice - entryPrice
        : entryPrice - currentPrice;
      const pnl = (priceDelta / entryPrice) * sizeUsd;
      const pnlPercent = collateralUsd > 0 ? (pnl / collateralUsd) * 100 : 0;

      // Liquidation price (1 % maintenance margin)
      const maintenanceRate = 0.01;
      const liqMove = (collateralUsd * (1 - maintenanceRate)) / sizeUsd;
      const liquidationPrice = pos.isLong
        ? entryPrice * (1 - liqMove)
        : entryPrice * (1 + liqMove);

      positions.push({
        marketId: market.id,
        market: market.displayName,
        side: pos.isLong ? 'long' : 'short',
        sizeUsd: +sizeUsd.toFixed(2),
        collateralUsd: +collateralUsd.toFixed(2),
        leverage: +leverage.toFixed(2),
        entryPrice: +entryPrice.toFixed(2),
        currentPrice: +currentPrice.toFixed(2),
        pnl: +pnl.toFixed(2),
        pnlPercent: +pnlPercent.toFixed(2),
        liquidationPrice: +liquidationPrice.toFixed(2),
        stopLoss: Number(pos.stopLossPrice) > 0 ? +(Number(pos.stopLossPrice) / 1e18).toFixed(2) : null,
        takeProfit: Number(pos.takeProfitPrice) > 0 ? +(Number(pos.takeProfitPrice) / 1e18).toFixed(2) : null,
        openTime: new Date(Number(pos.openTime) * 1000).toISOString(),
      });
    }
  }

  return positions;
}

// ---------------------------------------------------------------------------
// Tool handlers
// ---------------------------------------------------------------------------

async function handleGetAvailableAssets(): Promise<string> {
  const allAssets = await loadAssets();
  // Filter out coming soon assets
  const assets = allAssets.filter(a => !a.comingSoon);
  const crypto = assets.filter(a => a.type === 'crypto');
  const stocks = assets.filter(a => a.type === 'stocks');
  const forex = assets.filter(a => a.type === 'forex');
  const commodities = assets.filter(a => a.type === 'commodities');

  return json({
    total_assets: assets.length,
    categories: {
      crypto: crypto.length,
      stocks: stocks.length,
      forex: forex.length,
      commodities: commodities.length,
    },
    tradeable_assets: assets.map(a => ({
      symbol: a.symbol,
      name: a.name,
      type: a.type,
      display: a.display,
    })),
    popular: assets
      .filter(a => a.popular)
      .map(a => ({ symbol: a.symbol, name: a.name, type: a.type })),
  });
}

async function handleGetPerpSymbols(): Promise<string> {
  const allAssets = await loadAssets();
  // Filter out coming soon assets - all others are tradeable
  const assets = allAssets.filter(a => !a.comingSoon);
  
  return json(
    assets.map(a => ({
      symbol: a.symbol,
      display: a.display,
      name: a.name,
      type: a.type,
      pythId: a.priceId,
    })),
  );
}

async function handleSearchAsset(args: Record<string, unknown>): Promise<string> {
  const query = String(args.query ?? '');
  if (!query) return json({ error: 'query is required' });

  const results = await searchAssets(query, undefined, 20);
  return json(
    results.map(a => ({
      symbol: a.symbol,
      name: a.name,
      type: a.type,
      display: a.display,
      pythId: a.priceId,
    })),
  );
}

async function handleGetCurrentMarket(args: Record<string, unknown>): Promise<string> {
  const assetArg = String(args.asset ?? '').trim();
  if (!assetArg) return json({ error: 'asset is required' });

  if (assetArg.toLowerCase() === 'all') {
    // Lightweight list — NO price fetching.  Use get_current_market with a
    // specific symbol to get live prices for individual assets.
    const allAssets = await loadAssets();
    const assets = allAssets.filter(a => !a.comingSoon);
    const perpMarkets = await getPerpsMarkets();

    // Only fetch prices for perp markets (2-3 assets max)
    const perpPythIds = perpMarkets.map(m => m.pythPriceId);
    const perpPriceMap = perpPythIds.length > 0
      ? await fetchPricesWithChange(perpPythIds)
      : new Map();

    // Build perp snapshots with live prices
    const perpSnapshots = await Promise.all(
      perpMarkets.map(async (market) => {
        const pd = perpPriceMap.get(market.pythPriceId);
        return {
          symbol: `${market.baseAsset}USD`,
          name: market.baseAsset,
          type: 'crypto' as const,
          price: pd?.price ?? null,
          change24h: pd?.change24h ?? null,
          changePercent24h: pd?.changePercent24h ?? null,
          hasPerp: true,
        };
      }),
    );

    // Categorised counts + symbol lists (no prices)
    const crypto = assets.filter(a => a.type === 'crypto');
    const stocks = assets.filter(a => a.type === 'stocks');
    const forex = assets.filter(a => a.type === 'forex');
    const commodities = assets.filter(a => a.type === 'commodities');

    return json({
      perp_markets: perpSnapshots,
      available_assets: {
        total: assets.length,
        crypto: crypto.map(a => a.symbol),
        stocks_count: stocks.length,
        forex: forex.map(a => a.symbol),
        commodities: commodities.map(a => a.symbol),
      },
      hint: 'Call get_current_market with a specific symbol (e.g. BTCUSD, NVDA, TSLA) to get live prices.',
    });
  }

  // Check if it's a perp symbol (e.g., "BTC-PERP", "ETH-PERP")
  const perpMatch = assetArg.match(/^([A-Z]+)-PERP$/i);
  if (perpMatch) {
    const baseAsset = perpMatch[1].toUpperCase();
    const markets = await getPerpsMarkets();
    const market = markets.find(m => m.baseAsset.toUpperCase() === baseAsset);
    if (!market) return json({ error: `Perp market "${assetArg}" not found` });

    const pd = await fetchPriceWithChange(market.pythPriceId);

    return json({
      symbol: `${market.baseAsset}-PERP`,
      price: pd?.price ?? null,
      change24h: pd?.change24h ?? null,
      changePercent24h: pd?.changePercent24h ?? null,
    });
  }

  // Otherwise, treat as regular asset
  const asset = await findAsset(assetArg);
  if (!asset) return json({ error: `Asset "${assetArg}" not found` });

  const pd = await fetchPriceWithChange(asset.priceId);

  // Check if this asset has a perp market
  const markets = await getPerpsMarkets();
  const perpMarket = matchPerpMarketForAsset(asset, markets);

  return json({
    symbol: asset.symbol,
    name: asset.name,
    type: asset.type,
    price: pd?.price ?? null,
    change24h: pd?.change24h ?? null,
    changePercent24h: pd?.changePercent24h ?? null,
    hasPerp: !!perpMarket,
  });
}

async function handleGetOpenPositions(channelAddress: string | null): Promise<string> {
  if (!channelAddress) {
    return json({ positions: [], note: 'No trading session active. Connect wallet and create a session to trade.' });
  }
  const positions = await fetchAllPositions(channelAddress);
  return json({ positions, count: positions.length });
}

async function handleGetPositionDetail(
  args: Record<string, unknown>,
  channelAddress: string | null,
): Promise<string> {
  if (!channelAddress) {
    return json({ error: 'No trading session active. Connect wallet and create a session first.' });
  }

  const positions = await fetchAllPositions(channelAddress);
  if (!positions.length) return json({ error: 'No open positions' });

  const assetArg = String(args.asset ?? '').toLowerCase();
  const typeArg = String(args.type ?? '').toLowerCase();

  let match = positions[0]; // default to first if no filters
  if (assetArg) {
    // Check if it's a perp symbol
    const perpMatch = assetArg.match(/^([a-z]+)-perp$/i);
    if (perpMatch) {
      const baseAsset = perpMatch[1].toLowerCase();
      const found = positions.find(p => p.market.toLowerCase().includes(baseAsset));
      if (found) match = found;
      else return json({ error: `No position found for perp market "${args.asset}"` });
    } else {
      // Regular asset search
      const found = positions.find(p => p.market.toLowerCase().includes(assetArg));
      if (found) match = found;
      else return json({ error: `No position found for asset "${args.asset}"` });
    }
  }
  if (typeArg === 'perp' || typeArg === 'option') {
    // all our positions are perps currently
  }

  return json(match);
}

async function handleGetAccountSummary(channelAddress: string | null): Promise<string> {
  if (!channelAddress) {
    return json({
      note: 'No trading session active. Connect wallet and create a session to see account details.',
      balance: 0,
      equity: 0,
      unrealizedPnL: 0,
      marginUsed: 0,
      availableMargin: 0,
      positionCount: 0,
    });
  }

  const [balance, positions] = await Promise.all([
    getUsdcBalance(channelAddress),
    fetchAllPositions(channelAddress),
  ]);

  const unrealizedPnL = positions.reduce((sum, p) => sum + p.pnl, 0);
  const equity = balance + unrealizedPnL;
  const marginUsed = positions.reduce((sum, p) => sum + p.collateralUsd, 0);
  const availableMargin = equity - marginUsed;

  return json({
    balance: +balance.toFixed(2),
    equity: +equity.toFixed(2),
    unrealizedPnL: +unrealizedPnL.toFixed(2),
    marginUsed: +marginUsed.toFixed(2),
    availableMargin: +availableMargin.toFixed(2),
    positionCount: positions.length,
    positions: positions.map(p => ({
      market: p.market,
      side: p.side,
      sizeUsd: p.sizeUsd,
      pnl: p.pnl,
    })),
  });
}

async function handleGetHistoricalCandles(args: Record<string, unknown>): Promise<string> {
  const assetArg = String(args.asset ?? '').trim();
  const timeframe = String(args.timeframe ?? '1h');
  const limit = Math.min(Number(args.limit) || 100, 500);
  const startTime = args.start_time ? String(args.start_time) : null;

  if (!assetArg) return json({ error: 'asset is required' });

  // Check if it's a perp symbol (e.g., "BTC-PERP", "ETH-PERP") - map to underlying
  const perpMatch = assetArg.match(/^([A-Z]+)-PERP$/i);
  let assetSymbol = assetArg;
  if (perpMatch) {
    assetSymbol = perpMatch[1]; // e.g., "BTC-PERP" -> "BTC"
  }

  const asset = await findAsset(assetSymbol);
  if (!asset) return json({ error: `Asset "${assetArg}" not found` });

  const symbol = pythBenchmarkSymbol(asset);
  const resolution = mapTimeframe(timeframe);

  // Time range
  const now = Math.floor(Date.now() / 1000);
  let from: number;
  if (startTime) {
    from = Math.floor(new Date(startTime).getTime() / 1000);
  } else {
    // Calculate from based on resolution and limit
    const secondsPerBar: Record<string, number> = {
      '1': 60, '5': 300, '15': 900, '30': 1800,
      '60': 3600, '120': 7200, '240': 14400,
      'D': 86400, 'W': 604800, 'M': 2592000,
    };
    const barDuration = secondsPerBar[resolution] ?? 3600;
    from = now - barDuration * limit;
  }

  const url = `${PYTH_BENCHMARKS_URL}?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}&from=${from}&to=${now}`;

  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(10_000), cache: 'no-store' });
    if (!resp.ok) {
      return json({ error: `Pyth Benchmarks API returned ${resp.status}`, symbol });
    }
    const data = await resp.json() as {
      s: string;
      t?: number[];
      o?: number[];
      h?: number[];
      l?: number[];
      c?: number[];
      v?: number[];
    };

    if (data.s !== 'ok' || !data.t?.length) {
      return json({ error: 'No candle data available for this asset/timeframe', symbol });
    }

    // For crypto assets, fetch volume data from Binance
    if (asset.type === 'crypto') {
      const base = asset.symbol.replace('USD', '');
      const binanceSymbol = `${base}USDT`;
      const binanceInterval = mapBinanceInterval(timeframe);
      const cacheKey = `${binanceSymbol}-${binanceInterval}-${limit}`;
      const now = Date.now();
      const cached = volumeCache.get(cacheKey);

      if (cached && (now - cached.fetchedAt) < 60000) { // Use cache if less than 1 minute old
        data.v = cached.volumes;
      } else {
        const binanceUrl = `${BINANCE_KLINES_URL}?symbol=${binanceSymbol}&interval=${binanceInterval}&limit=${limit}`;
        try {
          const binanceResp = await fetch(binanceUrl, { signal: AbortSignal.timeout(10_000) });
          if (binanceResp.ok) {
            const binanceData: any[][] = await binanceResp.json();
            // Take the last 'limit' volumes, assuming alignment with Pyth timestamps
            const binanceVolumes = binanceData.slice(-limit).map(candle => parseFloat(candle[5]));
            // Replace Pyth volume with Binance volume
            data.v = binanceVolumes;
            // Cache the volumes
            volumeCache.set(cacheKey, { volumes: binanceVolumes, fetchedAt: now });
          }
        } catch (err) {
          // If Binance fetch fails, keep Pyth volume
          console.warn(`Failed to fetch Binance volume for ${binanceSymbol}:`, err);
        }
      }
    }

    // Trim to limit
    const count = Math.min(data.t.length, limit);
    const candles = [];
    for (let i = data.t.length - count; i < data.t.length; i++) {
      candles.push({
        time: new Date((data.t[i]) * 1000).toISOString(),
        open: data.o![i],
        high: data.h![i],
        low: data.l![i],
        close: data.c![i],
        volume: data.v?.[i] ?? 0,
      });
    }

    return json({
      symbol: asset.symbol,
      timeframe,
      resolution,
      count: candles.length,
      candles,
    });
  } catch (err) {
    return json({ error: `Failed to fetch candles: ${String(err)}`, symbol });
  }
}

async function handleGetTechnicalIndicators(args: Record<string, unknown>): Promise<string> {
  const assetArg = String(args.asset ?? '').trim();
  const timeframe = String(args.timeframe ?? '1h');
  const indicators = (args.indicators as string[]) ?? [];
  const period = Number(args.period) || 14;

  if (!assetArg) return json({ error: 'asset is required' });
  if (!indicators.length) return json({ error: 'indicators array is required' });

  // Check if it's a perp symbol (e.g., "BTC-PERP", "ETH-PERP") - map to underlying
  const perpMatch = assetArg.match(/^([A-Z]+)-PERP$/i);
  let assetSymbol = assetArg;
  if (perpMatch) {
    assetSymbol = perpMatch[1]; // e.g., "BTC-PERP" -> "BTC"
  }

  // First fetch candle data
  const asset = await findAsset(assetSymbol);
  if (!asset) return json({ error: `Asset "${assetArg}" not found` });

  const symbol = pythBenchmarkSymbol(asset);
  const resolution = mapTimeframe(timeframe);

  // Fetch enough bars for computation (period * 3 for safety)
  const barsNeeded = Math.max(period * 3, 100);
  const now = Math.floor(Date.now() / 1000);
  const secondsPerBar: Record<string, number> = {
    '1': 60, '5': 300, '15': 900, '30': 1800,
    '60': 3600, '120': 7200, '240': 14400,
    'D': 86400, 'W': 604800, 'M': 2592000,
  };
  const barDuration = secondsPerBar[resolution] ?? 3600;
  const from = now - barDuration * barsNeeded;
  const url = `${PYTH_BENCHMARKS_URL}?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}&from=${from}&to=${now}`;

  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(10_000), cache: 'no-store' });
    if (!resp.ok) return json({ error: `Pyth Benchmarks API returned ${resp.status}` });

    const data = await resp.json() as {
      s: string;
      t?: number[]; o?: number[]; h?: number[]; l?: number[]; c?: number[]; v?: number[];
    };
    if (data.s !== 'ok' || !data.c?.length) {
      return json({ error: 'No data available for indicator computation' });
    }

    const closes = data.c;
    const highs = data.h!;
    const lows = data.l!;
    const results: Record<string, unknown> = {
      symbol: asset.symbol,
      timeframe,
      period,
      dataPoints: closes.length,
    };

    for (const ind of indicators) {
      const key = ind.toLowerCase();
      if (key === 'sma') {
        results.sma = computeSMA(closes, period);
      } else if (key === 'ema') {
        results.ema = computeEMA(closes, period);
      } else if (key === 'rsi') {
        results.rsi = computeRSI(closes, period);
      } else if (key === 'macd') {
        results.macd = computeMACD(closes);
      } else if (key === 'atr') {
        results.atr = computeATR(highs, lows, closes, period);
      } else if (key === 'bollinger' || key === 'bb') {
        results.bollinger = computeBollinger(closes, period);
      } else if (key === 'stochastic' || key === 'stoch') {
        results.stochastic = computeStochastic(highs, lows, closes, period);
      } else if (key === 'williams' || key === 'wr') {
        results.williams = computeWilliamsR(highs, lows, closes, period);
      } else if (key === 'donchian') {
        results.donchian = computeDonchian(highs, lows, period);
      } else if (key === 'cci') {
        results.cci = computeCCI(highs, lows, closes, period);
      } else if (key === 'vwap') {
        results.vwap = computeVWAP(highs, lows, closes, data.v || []);
      } else if (key === 'adx') {
        results.adx = computeADX(highs, lows, closes, period);
      } else {
        results[key] = { error: `Indicator "${ind}" is not supported. Supported: SMA, EMA, RSI, MACD, ATR, Bollinger, Stochastic, Williams, Donchian, CCI, VWAP, ADX` };
      }
    }

    return json(results);
  } catch (err) {
    return json({ error: `Failed to compute indicators: ${String(err)}` });
  }
}

async function handleGetTradeHistory(channelAddress: string | null): Promise<string> {
  if (!channelAddress) {
    return json({ trades: [], note: 'No trading session active.' });
  }
  // We don't have a trade history API right now, but we can return current positions
  // as "open trades" information
  const positions = await fetchAllPositions(channelAddress);
  return json({
    note: 'Historical trade log is not yet available. Showing current open positions as reference.',
    openPositions: positions,
  });
}

async function handleCheckLiquidationRisk(channelAddress: string | null): Promise<string> {
  if (!channelAddress) {
    return json({
      note: 'No trading session active.',
      atRisk: false,
      equity: 0,
      maintenanceMarginRequired: 0,
    });
  }

  const [balance, positions] = await Promise.all([
    getUsdcBalance(channelAddress),
    fetchAllPositions(channelAddress),
  ]);

  const unrealizedPnL = positions.reduce((sum, p) => sum + p.pnl, 0);
  const equity = balance + unrealizedPnL;

  // Maintenance margin = 1% of total notional
  const maintenanceMarginRequired = positions.reduce((sum, p) => sum + p.sizeUsd * 0.01, 0);
  const marginRatio = maintenanceMarginRequired > 0 ? equity / maintenanceMarginRequired : Infinity;
  const atRisk = maintenanceMarginRequired > 0 && marginRatio < 1.5;

  return json({
    equity: +equity.toFixed(2),
    balance: +balance.toFixed(2),
    unrealizedPnL: +unrealizedPnL.toFixed(2),
    maintenanceMarginRequired: +maintenanceMarginRequired.toFixed(2),
    marginRatio: marginRatio === Infinity ? 'safe (no positions)' : +marginRatio.toFixed(2),
    atRisk,
    positionCount: positions.length,
    positions: positions.map(p => ({
      market: p.market,
      side: p.side,
      sizeUsd: p.sizeUsd,
      liquidationPrice: p.liquidationPrice,
      currentPrice: p.currentPrice,
    })),
  });
}

// ---------------------------------------------------------------------------
// Trade execution handler
// ---------------------------------------------------------------------------

async function handleExecutePerpTrade(
  args: Record<string, unknown>,
  channelAddress: string | null,
): Promise<string> {
  if (!channelAddress) {
    return json({ error: 'No trading session active. Connect wallet and create a session first.' });
  }

  // Parse and validate params
  const assetArg = String(args.asset ?? '').trim().toUpperCase();
  const side = String(args.side ?? '').toLowerCase();
  const collateralUsdc = Number(args.collateral_usdc);
  const leverage = Number(args.leverage);
  const orderType = String(args.order_type ?? 'market').toLowerCase() as 'market' | 'limit';
  const limitPrice = args.limit_price != null ? Number(args.limit_price) : null;
  const stopLoss = args.stop_loss != null ? Number(args.stop_loss) : null;
  const takeProfit = args.take_profit != null ? Number(args.take_profit) : null;

  if (!assetArg) return json({ error: 'asset is required' });
  if (side !== 'long' && side !== 'short') return json({ error: 'side must be "long" or "short"' });
  if (!Number.isFinite(collateralUsdc) || collateralUsdc < 10) return json({ error: 'collateral_usdc must be at least 10 USDC' });
  if (!Number.isFinite(leverage) || leverage < 1 || leverage > 50) return json({ error: 'leverage must be between 1 and 50' });
  if (orderType === 'limit' && (limitPrice == null || !Number.isFinite(limitPrice) || limitPrice <= 0)) {
    return json({ error: 'limit_price is required and must be positive when order_type is "limit"' });
  }

  // Resolve asset to base symbol for market ID
  const baseSymbol = assetArg.replace(/(USD|USDT|USDC|PERP|-)/gi, '').toLowerCase();
  const marketId = `${baseSymbol}-perp`;

  // Verify market exists
  const market = await getPerpsMarketById(marketId);
  if (!market) {
    return json({ error: `No perpetual market found for "${assetArg}". Try BTC, ETH, or SOL.` });
  }

  // Get current price for market orders and validation
  const currentPrice = await getPythPrice(market.pythPriceId);
  if (!currentPrice) {
    return json({ error: `Could not fetch current price for ${market.baseAsset}` });
  }

  const entryPrice = orderType === 'limit' ? limitPrice! : currentPrice;
  const positionSizeUsd = collateralUsdc * leverage;
  const positionSizeAsset = positionSizeUsd / entryPrice;

  // Get USDC balance to verify sufficient funds
  const balance = await getUsdcBalance(channelAddress);
  if (balance < collateralUsdc) {
    return json({
      error: `Insufficient USDC balance. You have ${balance.toFixed(2)} USDC but need ${collateralUsdc} USDC.`,
    });
  }

  // Return a structured trade action for the UI to execute
  return json({
    action: 'execute_perp_trade',
    trade: {
      marketId,
      asset: market.baseAsset,
      side,
      collateralUsdc,
      leverage,
      orderType,
      entryPrice,
      limitPrice: orderType === 'limit' ? limitPrice : null,
      stopLoss,
      takeProfit,
      positionSizeUsd: +positionSizeUsd.toFixed(2),
      positionSizeAsset: +positionSizeAsset.toFixed(6),
      currentPrice: +currentPrice.toFixed(2),
      channelAddress,
    },
    message: `Trade prepared: ${side.toUpperCase()} ${market.baseAsset} — ${collateralUsdc} USDC @ ${leverage}x (${orderType}). Please confirm in the UI.`,
  });
}

// ---------------------------------------------------------------------------
// Close Perp Position
// ---------------------------------------------------------------------------

async function handleClosePerpPosition(
  args: Record<string, unknown>,
  channelAddress: string | null,
): Promise<string> {
  if (!channelAddress) {
    return json({ error: 'No trading session active. Connect wallet and create a session first.' });
  }

  const positions = await fetchAllPositions(channelAddress);
  if (!positions.length) {
    return json({ error: 'No open positions to close.' });
  }

  const positionId = args.position_id ? String(args.position_id) : null;
  const percentage = typeof args.percentage === 'number' ? args.percentage : 100;

  // Find the position to close
  let position: FormattedPosition | undefined;

  if (positionId) {
    // Try matching by marketId (e.g. "btc-perp"), market display name, or asset symbol
    const query = positionId.toLowerCase();
    position = positions.find(p =>
      p.marketId.toLowerCase() === query ||
      p.market.toLowerCase().includes(query) ||
      p.marketId.toLowerCase().replace('-perp', '') === query
    );
  }

  // If only one position and no specific ID given, use it
  if (!position && positions.length === 1) {
    position = positions[0];
  }

  if (!position) {
    return json({
      error: `Position not found. Available positions: ${positions.map(p => `${p.market} (${p.side})`).join(', ')}`,
      positions: positions.map(p => ({
        marketId: p.marketId,
        market: p.market,
        side: p.side,
        sizeUsd: p.sizeUsd,
        pnl: p.pnl,
      })),
    });
  }

  // Partial close not supported at contract level — only full close
  if (percentage !== 100) {
    return json({ error: 'Partial position closing is not supported. Only full position close (100%) is available.' });
  }

  return json({
    action: 'close_perp_position',
    position: {
      marketId: position.marketId,
      market: position.market,
      side: position.side,
      sizeUsd: position.sizeUsd,
      collateralUsd: position.collateralUsd,
      leverage: position.leverage,
      entryPrice: position.entryPrice,
      currentPrice: position.currentPrice,
      pnl: position.pnl,
      pnlPercent: position.pnlPercent,
      channelAddress,
    },
    message: `Close ${position.side.toUpperCase()} ${position.market} position ($${position.sizeUsd} size, PnL: $${position.pnl}). Please confirm in the UI.`,
  });
}

// ---------------------------------------------------------------------------
// Technical Indicator Computations
// ---------------------------------------------------------------------------

function computeSMA(data: number[], period: number): { current: number; values: number[] } {
  const values: number[] = [];
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    values.push(+(slice.reduce((a, b) => a + b, 0) / period).toFixed(4));
  }
  return { current: values[values.length - 1], values: values.slice(-10) };
}

function computeEMA(data: number[], period: number): { current: number; values: number[] } {
  const k = 2 / (period + 1);
  const values: number[] = [];
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  values.push(+ema.toFixed(4));
  for (let i = period; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
    values.push(+ema.toFixed(4));
  }
  return { current: values[values.length - 1], values: values.slice(-10) };
}

function computeRSI(data: number[], period: number): { current: number; values: number[] } {
  const values: number[] = [];
  let gains = 0, losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = data[i] - data[i - 1];
    if (diff > 0) gains += diff; else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  let rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  values.push(+rsi.toFixed(2));

  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period;
    rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    values.push(+rsi.toFixed(2));
  }

  return { current: values[values.length - 1], values: values.slice(-10) };
}

function computeMACD(data: number[]): {
  macd: number; signal: number; histogram: number;
  values: { macd: number; signal: number; histogram: number }[];
} {
  const fast = emaArray(data, 12);
  const slow = emaArray(data, 26);

  // Align lengths
  const offset = slow.length;
  const macdLine = fast.slice(fast.length - offset).map((f, i) => f - slow[i]);
  const signalLine = emaArray(macdLine, 9);
  const sigOffset = signalLine.length;

  const values = macdLine.slice(macdLine.length - sigOffset).map((m, i) => ({
    macd: +m.toFixed(4),
    signal: +signalLine[i].toFixed(4),
    histogram: +(m - signalLine[i]).toFixed(4),
  }));

  const last = values[values.length - 1];
  return { ...last, values: values.slice(-10) };
}

function computeATR(highs: number[], lows: number[], closes: number[], period: number): { current: number; values: number[] } {
  const trueRanges: number[] = [highs[0] - lows[0]];
  for (let i = 1; i < highs.length; i++) {
    trueRanges.push(Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1]),
    ));
  }
  const values: number[] = [];
  let atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;
  values.push(+atr.toFixed(4));
  for (let i = period; i < trueRanges.length; i++) {
    atr = (atr * (period - 1) + trueRanges[i]) / period;
    values.push(+atr.toFixed(4));
  }
  return { current: values[values.length - 1], values: values.slice(-10) };
}

function computeBollinger(data: number[], period: number): { upper: number; middle: number; lower: number } {
  if (data.length < period) return { upper: 0, middle: 0, lower: 0 };
  const slice = data.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((sum, v) => sum + (v - mean) ** 2, 0) / period;
  const stdDev = Math.sqrt(variance);
  return {
    upper: +(mean + 2 * stdDev).toFixed(4),
    middle: +mean.toFixed(4),
    lower: +(mean - 2 * stdDev).toFixed(4),
  };
}

function computeStochastic(highs: number[], lows: number[], closes: number[], period: number): { k: number; d: number; values: Array<{ k: number; d: number }> } {
  if (closes.length < period) return { k: 0, d: 0, values: [] };
  
  const values: Array<{ k: number; d: number }> = [];
  const kValues: number[] = [];
  
  for (let i = period - 1; i < closes.length; i++) {
    const slice = { h: highs.slice(i - period + 1, i + 1), l: lows.slice(i - period + 1, i + 1) };
    const high = Math.max(...slice.h);
    const low = Math.min(...slice.l);
    const k = high === low ? 50 : ((closes[i] - low) / (high - low)) * 100;
    kValues.push(k);
  }
  
  for (let i = 0; i < kValues.length; i++) {
    const kSlice = kValues.slice(Math.max(0, i - 2), i + 1);
    const k = +(kSlice.reduce((a, b) => a + b, 0) / kSlice.length).toFixed(2);
    const dSlice = values.slice(Math.max(0, i - 2), i).map(v => v.d);
    const d = dSlice.length ? +(dSlice.reduce((a, b) => a + b, 0) / dSlice.length).toFixed(2) : k;
    values.push({ k, d });
  }
  
  const last = values[values.length - 1] || { k: 0, d: 0 };
  return { k: last.k, d: last.d, values };
}

function computeWilliamsR(highs: number[], lows: number[], closes: number[], period: number): { current: number; values: number[] } {
  if (closes.length < period) return { current: 0, values: [] };
  
  const values: number[] = [];
  for (let i = period - 1; i < closes.length; i++) {
    const slice = { h: highs.slice(i - period + 1, i + 1), l: lows.slice(i - period + 1, i + 1) };
    const high = Math.max(...slice.h);
    const low = Math.min(...slice.l);
    const wr = high === low ? 0 : -((high - closes[i]) / (high - low)) * 100;
    values.push(+wr.toFixed(2));
  }
  
  return { current: values[values.length - 1] || 0, values };
}

function computeDonchian(highs: number[], lows: number[], period: number): { upper: number; lower: number; values: Array<{ upper: number; lower: number }> } {
  if (highs.length < period) return { upper: 0, lower: 0, values: [] };
  
  const values: Array<{ upper: number; lower: number }> = [];
  for (let i = period - 1; i < highs.length; i++) {
    const slice = { h: highs.slice(i - period + 1, i + 1), l: lows.slice(i - period + 1, i + 1) };
    const upper = Math.max(...slice.h);
    const lower = Math.min(...slice.l);
    values.push({ upper: +upper.toFixed(4), lower: +lower.toFixed(4) });
  }
  
  const last = values[values.length - 1] || { upper: 0, lower: 0 };
  return { upper: last.upper, lower: last.lower, values };
}

function computeCCI(highs: number[], lows: number[], closes: number[], period: number): { current: number; values: number[] } {
  if (closes.length < period) return { current: 0, values: [] };
  
  const values: number[] = [];
  for (let i = period - 1; i < closes.length; i++) {
    const slice = {
      h: highs.slice(i - period + 1, i + 1),
      l: lows.slice(i - period + 1, i + 1),
      c: closes.slice(i - period + 1, i + 1),
    };
    
    const typicalPrices = slice.h.map((h, j) => (h + slice.l[j] + slice.c[j]) / 3);
    const sma = typicalPrices.reduce((a, b) => a + b, 0) / period;
    const meanDev = typicalPrices.reduce((sum, tp) => sum + Math.abs(tp - sma), 0) / period;
    const cci = meanDev === 0 ? 0 : (typicalPrices[period - 1] - sma) / (0.015 * meanDev);
    
    values.push(+cci.toFixed(2));
  }
  
  return { current: values[values.length - 1] || 0, values };
}

function computeVWAP(highs: number[], lows: number[], closes: number[], volumes: number[]): { current: number; values: number[] } {
  if (closes.length === 0 || volumes.length === 0) return { current: 0, values: [] };
  
  const values: number[] = [];
  let cumulativeTP_V = 0;
  let cumulativeV = 0;
  
  for (let i = 0; i < closes.length; i++) {
    const typicalPrice = (highs[i] + lows[i] + closes[i]) / 3;
    const volume = volumes[i] || 0;
    
    cumulativeTP_V += typicalPrice * volume;
    cumulativeV += volume;
    
    const vwap = cumulativeV === 0 ? 0 : cumulativeTP_V / cumulativeV;
    values.push(+vwap.toFixed(4));
  }
  
  return { current: values[values.length - 1] || 0, values };
}

function computeADX(highs: number[], lows: number[], closes: number[], period: number): { adx: number; plusDI: number; minusDI: number; values: Array<{ adx: number; plusDI: number; minusDI: number }> } {
  if (closes.length < period * 2) return { adx: 0, plusDI: 0, minusDI: 0, values: [] };
  
  const values: Array<{ adx: number; plusDI: number; minusDI: number }> = [];
  const trueRanges: number[] = [];
  const plusDMs: number[] = [];
  const minusDMs: number[] = [];
  
  // Calculate True Range and Directional Movements
  for (let i = 1; i < closes.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    trueRanges.push(tr);
    
    const upMove = highs[i] - highs[i - 1];
    const downMove = lows[i - 1] - lows[i];
    
    let plusDM = 0, minusDM = 0;
    if (upMove > downMove && upMove > 0) plusDM = upMove;
    if (downMove > upMove && downMove > 0) minusDM = downMove;
    
    plusDMs.push(plusDM);
    minusDMs.push(minusDM);
  }
  
  // Calculate smoothed values
  let sumTR = trueRanges.slice(0, period).reduce((a, b) => a + b, 0);
  let sumPlusDM = plusDMs.slice(0, period).reduce((a, b) => a + b, 0);
  let sumMinusDM = minusDMs.slice(0, period).reduce((a, b) => a + b, 0);
  
  const diValues: Array<{ plusDI: number; minusDI: number }> = [];
  
  for (let i = period; i < closes.length; i++) {
    sumTR = sumTR - trueRanges[i - period] + trueRanges[i];
    sumPlusDM = sumPlusDM - plusDMs[i - period] + plusDMs[i];
    sumMinusDM = sumMinusDM - minusDMs[i - period] + minusDMs[i];
    
    const plusDI = (sumPlusDM / sumTR) * 100;
    const minusDI = (sumMinusDM / sumTR) * 100;
    diValues.push({ plusDI, minusDI });
  }
  
  // Calculate ADX
  const diDiffs = diValues.map(di => Math.abs(di.plusDI - di.minusDI) / (di.plusDI + di.minusDI) * 100);
  let adxSum = diDiffs.slice(0, period).reduce((a, b) => a + b, 0);
  let adx = adxSum / period;
  
  for (let i = 0; i < diValues.length; i++) {
    if (i >= period - 1) {
      if (i >= period) {
        adx = (adx * (period - 1) + diDiffs[i]) / period;
      }
      values.push({
        adx: +adx.toFixed(2),
        plusDI: +diValues[i].plusDI.toFixed(2),
        minusDI: +diValues[i].minusDI.toFixed(2),
      });
    }
  }
  
  const last = values[values.length - 1] || { adx: 0, plusDI: 0, minusDI: 0 };
  return { adx: last.adx, plusDI: last.plusDI, minusDI: last.minusDI, values };
}

/** Helper: compute raw EMA array (no rounding). */
function emaArray(data: number[], period: number): number[] {
  if (data.length < period) return [];
  const k = 2 / (period + 1);
  const result: number[] = [];
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result.push(ema);
  for (let i = period; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
    result.push(ema);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Cooldown Tool Handler
// ---------------------------------------------------------------------------

async function handleSetCooldown(args: Record<string, unknown>): Promise<string> {
  const seconds = args.seconds as number;
  const reason = args.reason as string;

  if (!seconds || !reason) {
    return json({ error: 'Missing required parameters: seconds and reason' });
  }

  if (seconds < 1 || seconds > 300) {
    return json({ error: 'Seconds must be between 1 and 300' });
  }

  // Return success - the frontend will handle the cooldown state
  return json({
    action: 'set_cooldown',
    seconds,
    reason,
    message: `Cooldown set for ${seconds} seconds: ${reason}`
  });
}
