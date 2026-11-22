export async function fetchOptionChain(symbol: string) {
  if (!symbol) return null;
  try {
    const upper = symbol.toUpperCase();
    const url = `https://query2.finance.yahoo.com/v7/finance/options/${upper}`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) return null;
    const json = await res.json();
    const result = json?.optionChain?.result?.[0];
    if (!result) return null;
    const underlying = result.quote?.regularMarketPrice ?? null;
    const opts = result.options?.[0] ?? {};
    const callsRaw = opts.calls || [];
    const putsRaw = opts.puts || [];
    const mapRow = (r: unknown, type: 'call' | 'put') => {
      const obj = (r || {}) as Record<string, unknown>;
      const bid = Number(obj.bid ?? 0);
      const ask = Number(obj.ask ?? 0);
      const mid = (bid || ask) ? ((bid + ask) / ((bid && ask) ? 2 : 1)) : Number(obj.lastPrice ?? 0);
      const ivRaw = Number(obj.impliedVolatility ?? 0);
      const impliedVolatility = ivRaw > 0 && ivRaw <= 1 ? ivRaw * 100 : ivRaw;
      return {
        strike: Number(obj.strike ?? 0),
        bid,
        ask,
        lastPrice: Number(obj.lastPrice ?? mid),
        volume: Number(obj.volume ?? 0),
        openInterest: Number(obj.openInterest ?? 0),
        delta: Number(obj.delta ?? 0),
        gamma: Number(obj.gamma ?? 0),
        theta: Number(obj.theta ?? 0),
        vega: Number(obj.vega ?? 0),
        rho: Number(obj.rho ?? 0),
        impliedVolatility,
        breakEven: type === 'call' ? Number(obj.strike ?? 0) + Number(obj.lastPrice ?? mid) : Number(obj.strike ?? 0) - Number(obj.lastPrice ?? mid),
        isITM: underlying != null ? type === 'call' ? Number(obj.strike ?? 0) < Number(underlying) : Number(obj.strike ?? 0) > Number(underlying) : false,
        isATM: underlying != null ? Math.abs(Number(underlying) - Number(obj.strike ?? 0)) / Math.max(1, Number(underlying)) < 0.02 : false,
        chanceOfProfit: Math.min(95, Math.max(0, Math.round((Number(obj.delta ?? 0) || 0) * 100)))
      };
    };
    const calls = callsRaw.map((c: unknown) => mapRow(c, 'call'));
    const puts = putsRaw.map((p: unknown) => mapRow(p, 'put'));
    return { calls, puts };
  } catch {
    return null;
  }
}
