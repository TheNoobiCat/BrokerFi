/**
 * Dynamic contract-size registry.
 *
 * Populated from the subgraph (optionsMarkets) at app start and used
 * everywhere instead of the old hardcoded CONTRACT_SIZES map.
 *
 * Falls back to well-known sizes for official assets if the subgraph
 * hasn't been queried yet.
 */

// Well-known fallbacks (official markets only)
const WELL_KNOWN_SIZES: Record<string, number> = {
  ETH: 0.1,
  BTC: 0.01,
  SOL: 1,
  DOGE: 100,
  XRP: 10,
  BNB: 0.1,
};

// Runtime registry: pythId (lowercase, with 0x) → human contract size
const sizeByPythId = new Map<string, number>();
// Runtime registry: symbol (UPPER) → human contract size
const sizeBySymbol = new Map<string, number>();

let loaded = false;

/**
 * Populate the registry from the subgraph.  Call once at app startup
 * (the options page already does a similar fetch — we centralise here).
 */
export async function loadContractSizes(): Promise<void> {
  if (loaded) return;

  const subgraphUrl = process.env.NEXT_PUBLIC_GOLDSKY_URL;
  if (!subgraphUrl) return;

  try {
    const query = `
      query {
        optionsMarkets(first: 1000) {
          priceFeedId
          contractSize
          community
        }
      }
    `;

    const res = await fetch(subgraphUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    if (!res.ok) return;
    const json = await res.json();
    const list: any[] = json?.data?.optionsMarkets ?? [];

    for (const m of list) {
      if (!m?.priceFeedId) continue;
      const raw = m.contractSize ?? m.contractSizeInAsset ?? "0";
      const human = Number(raw) / 1e18;
      if (human > 0) {
        sizeByPythId.set(m.priceFeedId.toLowerCase(), human);
      }
    }

    loaded = true;
  } catch (err) {
    console.warn("[ContractSizeRegistry] subgraph fetch failed", err);
  }
}

/**
 * Register a size manually (e.g. from contracts.json lotSize).
 */
export function registerSize(key: string, humanSize: number): void {
  if (!key || humanSize <= 0) return;
  // Could be a pythId or a symbol
  if (key.startsWith("0x")) {
    sizeByPythId.set(key.toLowerCase(), humanSize);
  } else {
    sizeBySymbol.set(key.toUpperCase(), humanSize);
  }
}

/**
 * Look up contract size.  Accepts a symbol ("LINK") or pythId ("0xabc…").
 * Returns 1 as last-resort default.
 */
export function getContractSizeDynamic(
  symbolOrPythId: string,
  pythIdFallback?: string,
): number {
  // Try pythId first (most reliable for community markets)
  if (pythIdFallback) {
    const v = sizeByPythId.get(pythIdFallback.toLowerCase());
    if (v) return v;
  }
  if (symbolOrPythId.startsWith("0x")) {
    const v = sizeByPythId.get(symbolOrPythId.toLowerCase());
    if (v) return v;
  }

  // Try symbol
  const sym = symbolOrPythId.toUpperCase();
  const v2 = sizeBySymbol.get(sym);
  if (v2) return v2;

  // Well-known fallback
  if (WELL_KNOWN_SIZES[sym]) return WELL_KNOWN_SIZES[sym];

  return 1;
}

/** Check whether the registry has been populated */
export function isRegistryLoaded(): boolean {
  return loaded;
}
