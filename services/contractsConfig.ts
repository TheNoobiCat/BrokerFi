// Central contract address loader from /data/contracts.json
// All components should import addresses from here instead of hardcoding them

export interface ContractsConfig {
  chainId: number;
  chainName: string;
  deployer: string;
  external: {
    usdc: `0x${string}`;
    pyth: `0x${string}`;
  };
  core: {
    constants: `0x${string}`;
    treasury: `0x${string}`;
    feeFlow: `0x${string}`;
    insuranceFund: `0x${string}`;
  };
  tokens: {
    cleth: `0x${string}`;
  };
  staking: {
    clethStakingDiscount: `0x${string}`;
  };
  options: {
    optionMarket: `0x${string}`;
    orderbook: `0x${string}`;
    marginAccount: `0x${string}`;
  };
  perps: {
    factory: `0x${string}`;
    implementations: {
      liquidityPool: `0x${string}`;
      perpetualTrading: `0x${string}`;
    };
    markets: Record<string, {
      id: string;
      name: string;
      displayName: string;
      baseAsset: string;
      quoteAsset: string;
      pool: `0x${string}`;
      lpToken: `0x${string}`;
      trading: `0x${string}`;
      limitOrderBook: `0x${string}`;
      pythPriceId: `0x${string}`;
      chainId: number;
      yield: number;
      tvl: number;
      performance: Array<{ time: string; value: number }>;
    }>;
  };
  instantExecution: {
    channelFactory: `0x${string}`;
  };
  priceFeeds: Record<string, {
    pythId: `0x${string}`;
    lotSize: string;
  }>;
}

let configCache: ContractsConfig | null = null;

export async function getContractsConfig(): Promise<ContractsConfig> {
  if (configCache) return configCache;

  const response = await fetch('/data/contracts.json');
  if (!response.ok) throw new Error('Failed to load contracts config');
  configCache = await response.json();
  return configCache!;
}

// Convenience getters
export async function getOptionMarketAddress(): Promise<`0x${string}`> {
  const config = await getContractsConfig();
  return config.options.optionMarket;
}

export async function getOrderbookAddress(): Promise<`0x${string}`> {
  const config = await getContractsConfig();
  return config.options.orderbook;
}

export async function getMarginAccountAddress(): Promise<`0x${string}`> {
  const config = await getContractsConfig();
  return config.options.marginAccount;
}

export async function getCLETHAddress(): Promise<`0x${string}`> {
  const config = await getContractsConfig();
  return config.tokens.cleth;
}

export async function getStakingAddress(): Promise<`0x${string}`> {
  const config = await getContractsConfig();
  return config.staking.clethStakingDiscount;
}

export async function getUSDCAddressFromConfig(): Promise<`0x${string}`> {
  const config = await getContractsConfig();
  return config.external.usdc;
}

export async function getPythAddress(): Promise<`0x${string}`> {
  const config = await getContractsConfig();
  return config.external.pyth;
}

// Perps market getters
export async function getPerpsMarkets() {
  const config = await getContractsConfig();
  return Object.values(config.perps.markets);
}

export async function getPerpsMarketByKey(marketKey: string) {
  const config = await getContractsConfig();
  return config.perps.markets[marketKey];
}

export async function getPerpsMarketById(marketId: string) {
  const config = await getContractsConfig();
  const markets = Object.values(config.perps.markets);
  return markets.find(market => market.id === marketId);
}

export async function getPerpsFactoryAddress(): Promise<`0x${string}`> {
  const config = await getContractsConfig();
  return config.perps.factory;
}
