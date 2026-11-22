// ABIs for the Options protocol contracts: OptionMarket, Orderbook, MarginAccount

// ── OptionMarket ABI ────────────────────────────────────────────────────────
export const optionMarketAbi = [
  // createOrder(bytes32, bool isCall, bool isLong, uint256 strikePrice, uint256 expiry,
  //             uint256 amount, uint256 limitPricePerOption, bool putCashSecured, bytes[] priceUpdateData)
  {
    inputs: [
      { name: "underlyingPriceFeedId", type: "bytes32" },
      { name: "isCall", type: "bool" },
      { name: "isLong", type: "bool" },
      { name: "strikePrice", type: "uint256" },
      { name: "expiry", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "limitPricePerOption", type: "uint256" },
      { name: "putCashSecured", type: "bool" },
      { name: "priceUpdateData", type: "bytes[]" },
    ],
    name: "createOrder",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // cancelOrder(bytes32 seriesId, bytes32 orderId)
  {
    inputs: [
      { name: "seriesId", type: "bytes32" },
      { name: "orderId", type: "bytes32" },
    ],
    name: "cancelOrder",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // settlePosition(address trader, bytes32 seriesId, bytes[] calldata pythUpdateData)
  {
    inputs: [
      { name: "trader", type: "address" },
      { name: "seriesId", type: "bytes32" },
      { name: "pythUpdateData", type: "bytes[]" },
    ],
    name: "settlePosition",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  // liquidatePosition(address trader, bytes32 seriesId, bytes[] calldata pythUpdateData)
  {
    inputs: [
      { name: "trader", type: "address" },
      { name: "seriesId", type: "bytes32" },
      { name: "pythUpdateData", type: "bytes[]" },
    ],
    name: "liquidatePosition",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  // createMarket(bytes32 priceFeedId, bytes[] calldata pythUpdateData)
  {
    inputs: [
      { name: "priceFeedId", type: "bytes32" },
      { name: "pythUpdateData", type: "bytes[]" },
    ],
    name: "createMarket",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // createOfficialMarket(bytes32 priceFeedId, uint256 lotSize) — governance only
  {
    inputs: [
      { name: "priceFeedId", type: "bytes32" },
      { name: "lotSize", type: "uint256" },
    ],
    name: "createOfficialMarket",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // markets(bytes32) → Market struct (auto-generated getter)
  // Actual Solidity struct: { address deployer, bool community, uint256 contractSizeInAsset }
  {
    inputs: [{ name: "", type: "bytes32" }],
    name: "markets",
    outputs: [
      { name: "deployer", type: "address" },
      { name: "community", type: "bool" },
      { name: "contractSizeInAsset", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  // paused() → bool
  {
    inputs: [],
    name: "paused",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "seriesId", type: "bytes32" },
      { indexed: true, name: "orderId", type: "bytes32" },
      { indexed: true, name: "trader", type: "address" },
      { indexed: false, name: "intent", type: "uint8" },
      { indexed: false, name: "quantity", type: "uint256" },
      { indexed: false, name: "limitPrice", type: "uint256" },
    ],
    name: "OrderCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "seriesId", type: "bytes32" },
      { indexed: true, name: "orderId", type: "bytes32" },
    ],
    name: "OrderCancelled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "priceFeedId", type: "bytes32" },
      { indexed: true, name: "creator", type: "address" },
    ],
    name: "MarketCreated",
    type: "event",
  },
] as const;

// ── Orderbook ABI ───────────────────────────────────────────────────────────
export const orderbookAbi = [
  // createSeries(bytes32 underlyingPriceFeedId, bool isCall, uint256 strikePrice, uint256 expiry, uint256 contractSize) → bytes32
  {
    inputs: [
      { name: "underlyingPriceFeedId", type: "bytes32" },
      { name: "isCall", type: "bool" },
      { name: "strikePrice", type: "uint256" },
      { name: "expiry", type: "uint256" },
      { name: "contractSize", type: "uint256" },
    ],
    name: "createSeries",
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  // getSeries(bytes32 seriesId) → (bytes32, bool, uint256, uint256, uint256)
  {
    inputs: [{ name: "seriesId", type: "bytes32" }],
    name: "getSeries",
    outputs: [
      { name: "underlyingPriceFeedId", type: "bytes32" },
      { name: "isCall", type: "bool" },
      { name: "strikePrice", type: "uint256" },
      { name: "expiry", type: "uint256" },
      { name: "contractSize", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  // getOrdersForSeries(bytes32 seriesId) → bytes32[]
  {
    inputs: [{ name: "seriesId", type: "bytes32" }],
    name: "getOrdersForSeries",
    outputs: [{ name: "", type: "bytes32[]" }],
    stateMutability: "view",
    type: "function",
  },
  // orders(bytes32 seriesId, bytes32 orderId) → Order struct (mapping getter)
  // Note: getOrder() and getTraderOrders() do NOT exist on the Orderbook contract.
  // Use the subgraph for trader-specific order queries.
  {
    inputs: [
      { name: "seriesId", type: "bytes32" },
      { name: "orderId", type: "bytes32" },
    ],
    name: "orders",
    outputs: [
      { name: "trader", type: "address" },
      { name: "isLong", type: "bool" },
      { name: "limitPrice", type: "uint256" },
      { name: "quantity", type: "uint256" },
      { name: "marginLocked", type: "uint256" },
      { name: "intent", type: "uint8" },
    ],
    stateMutability: "view",
    type: "function",
  },
  // bulkMatch(Match[] calldata matches)
  {
    inputs: [
      {
        components: [
          { name: "seriesId", type: "bytes32" },
          { name: "takerOrderId", type: "bytes32" },
          { name: "makerOrderId", type: "bytes32" },
        ],
        name: "matches",
        type: "tuple[]",
      },
    ],
    name: "bulkMatch",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "seriesId", type: "bytes32" },
      { indexed: false, name: "underlyingPriceFeedId", type: "bytes32" },
      { indexed: false, name: "isCall", type: "bool" },
      { indexed: false, name: "strikePrice", type: "uint256" },
      { indexed: false, name: "expiry", type: "uint256" },
    ],
    name: "SeriesCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "seriesId", type: "bytes32" },
      { indexed: true, name: "takerOrderId", type: "bytes32" },
      { indexed: true, name: "makerOrderId", type: "bytes32" },
      { indexed: false, name: "fillQuantity", type: "uint256" },
      { indexed: false, name: "fillPrice", type: "uint256" },
    ],
    name: "OrderMatched",
    type: "event",
  },
] as const;

// ── MarginAccount ABI ───────────────────────────────────────────────────────
export const marginAccountAbi = [
  // depositCollateral(uint256 amount)
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "depositCollateral",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // withdrawCollateral(uint256 amount)
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "withdrawCollateral",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // getAccountBalances(address trader) → (uint256 totalCollateral, uint256 lockedMargin)
  {
    inputs: [{ name: "trader", type: "address" }],
    name: "getAccountBalances",
    outputs: [
      { name: "totalCollateral", type: "uint256" },
      { name: "lockedMargin", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  // getActiveSeries(address trader) → bytes32[]
  {
    inputs: [{ name: "trader", type: "address" }],
    name: "getActiveSeries",
    outputs: [{ name: "seriesIds", type: "bytes32[]" }],
    stateMutability: "view",
    type: "function",
  },
  // positions(address, bytes32) → Position tuple
  {
    inputs: [
      { name: "", type: "address" },
      { name: "", type: "bytes32" },
    ],
    name: "positions",
    outputs: [
      { name: "seriesId", type: "bytes32" },
      { name: "quantity", type: "uint256" },
      { name: "entryPrice", type: "uint256" },
      { name: "isLong", type: "bool" },
      { name: "marginPerContract", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  // totalCollateralOf(address) → uint256
  {
    inputs: [{ name: "trader", type: "address" }],
    name: "totalCollateralOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // lockedMarginOf(address) → uint256
  {
    inputs: [{ name: "trader", type: "address" }],
    name: "lockedMarginOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // isLiquidatable(address, bytes32, bytes[]) → (bool, uint256)
  {
    inputs: [
      { name: "trader", type: "address" },
      { name: "seriesId", type: "bytes32" },
      { name: "updateData", type: "bytes[]" },
    ],
    name: "isLiquidatable",
    outputs: [
      { name: "liquidatable", type: "bool" },
      { name: "currentOptionPrice", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// ── ERC20 ABI (for USDC approve/transfer) ───────────────────────────────────
export const erc20Abi = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// ── CLETH ABI ───────────────────────────────────────────────────────────────
export const clethAbi = [
  // buy(uint256 usdcAmount)
  {
    inputs: [{ name: "usdcAmount", type: "uint256" }],
    name: "buy",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // sell(uint256 tokenAmount)
  {
    inputs: [{ name: "tokenAmount", type: "uint256" }],
    name: "sell",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // currentPrice() → uint256
  {
    inputs: [],
    name: "currentPrice",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // getBuyCostEstimate(uint256 tokenAmount) → uint256 (USDC cost to buy X CLETH tokens)
  {
    inputs: [{ name: "tokenAmount", type: "uint256" }],
    name: "getBuyCostEstimate",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // getSellReturnEstimate(uint256 tokenAmount) → uint256 (USDC returned for selling X CLETH)
  {
    inputs: [{ name: "tokenAmount", type: "uint256" }],
    name: "getSellReturnEstimate",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // totalSupply() → uint256
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // balanceOf(address) → uint256
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // approve(address, uint256)
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  // basePrice() → uint256
  {
    inputs: [],
    name: "basePrice",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // slope() → uint256
  {
    inputs: [],
    name: "slope",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// ── CLETHStakingDiscount ABI ────────────────────────────────────────────────
export const clethStakingAbi = [
  // stake(uint256 amount)
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "stake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // unstake(uint256 amount)
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "unstake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // unstakeAll()
  {
    inputs: [],
    name: "unstakeAll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // stakedBalance(address) → uint256
  {
    inputs: [{ name: "", type: "address" }],
    name: "stakedBalance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // getDiscountBps(address) → uint256
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getDiscountBps",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // totalStaked() → uint256
  {
    inputs: [],
    name: "totalStaked",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // cleth() → address
  {
    inputs: [],
    name: "cleth",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// ── InsuranceFund ABI ───────────────────────────────────────────────────────
export const insuranceFundAbi = [
  {
    inputs: [],
    name: "reserves",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
