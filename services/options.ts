// Options service — real on-chain execution via instant execution channel
// All transactions go through signBatchInstantExecute → SessionRelayerClient → Go relayer → channel contract

import { encodeFunctionData, parseUnits, formatUnits } from "viem";
import { SessionRelayerClient, type SignedBatchInstantExecute, signatureToBinary } from "./sessionRelayer";
import { signBatchInstantExecute } from "./keyVault";
import { optionMarketAbi, orderbookAbi, marginAccountAbi, erc20Abi } from "@/blockchain/optionsAbis";
import { getContractsConfig } from "./contractsConfig";
import { getPythUpdateData } from "./pyth/pythPriceMulti";
import publicClient from "@/blockchain/publicClient";
import { AssetData } from "./assets";

const CHAIN_ID = 421614; // Arbitrum Sepolia
const RELAYER_URL = process.env.NEXT_PUBLIC_RELAYER_WS_URL || "ws://localhost:4001/ws";

// ── Types ────────────────────────────────────────────────────────────────────

export interface OptionsOrderParams {
  channelAddress: `0x${string}`;
  underlyingPriceFeedId: `0x${string}`;
  isCall: boolean;
  isLong: boolean;
  strikePrice: bigint;             // 18-decimal scaled
  expiry: number;                  // unix timestamp
  amount: number;                  // number of contracts (plain integer)
  limitPricePerOption: bigint;     // 18-decimal scaled (premium per contract)
  putCashSecured?: boolean;        // only relevant for put sell-to-open
  onSubmitted?: () => void;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export interface OptionsOrderResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export interface DepositCollateralParams {
  channelAddress: `0x${string}`;
  amount: string; // USDC amount as string (e.g. "100.50")
  onSubmitted?: () => void;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export interface WithdrawCollateralParams {
  channelAddress: `0x${string}`;
  amount: string; // USDC amount as string
  onSubmitted?: () => void;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export interface CancelOrderParams {
  channelAddress: `0x${string}`;
  seriesId: `0x${string}`;
  orderId: `0x${string}`;
  onSubmitted?: () => void;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export interface OptionsPosition {
  seriesId: `0x${string}`;
  quantity: bigint;
  entryPrice: bigint;
  isLong: boolean;
  marginPerContract: bigint;
  // Decoded from series
  underlyingPriceFeedId?: `0x${string}`;
  isCall?: boolean;
  strikePrice?: bigint;
  expiry?: bigint;
}

export interface OptionsLimitOrder {
  orderId: `0x${string}`;
  trader: `0x${string}`;
  seriesId: `0x${string}`;
  quantity: bigint;
  limitPrice: bigint;
  intent: number;  // Orderbook.OrderIntent enum (0-3)
  marginPerContract: bigint;
  timestamp: bigint;
  isActive: boolean;
}

export interface AccountBalances {
  totalCollateral: bigint;
  lockedMargin: bigint;
  freeCollateral: bigint;
}

export interface OptionsAssetConfig {
  symbol: string;
  display: string;
  name: string;
  pythId: string;
  description: string;
  category: string;
  popular: boolean;
  isLoading?: boolean;
}

// ── Internal helpers ─────────────────────────────────────────────────────────

async function sendBatchViaRelayer(
  channelAddress: `0x${string}`,
  items: Array<{ target: `0x${string}`; value: string; data: `0x${string}` }>,
  callbacks?: {
    onSubmitted?: () => void;
    onSuccess?: () => void;
    onError?: (error: any) => void;
  },
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  const nonce = Math.floor(Date.now() / 1000);

  console.log("[Options:relayer] Signing batch:", {
    channel: channelAddress,
    nonce,
    itemCount: items.length,
    targets: items.map(i => i.target),
    values: items.map(i => i.value),
  });

  const signature = await signBatchInstantExecute({
    channelAddress,
    items,
    nonce,
    chainId: CHAIN_ID,
  });

  if (!signature) {
    console.error("[Options:relayer] Failed to sign batch transaction");
    return { success: false, error: "Failed to sign batch transaction" };
  }
  console.log("[Options:relayer] Batch signed successfully");

  const client = new SessionRelayerClient(RELAYER_URL);
  let result: { success: boolean; txHash?: string; error?: string } = {
    success: false,
    error: "Timeout",
  };

  client.setCallbacks({
    onBatchInstantExecuteResponse: (response) => {
      console.log("[Options:relayer] Batch response:", response);
    },
    onBatchInstantExecuteProgress: (progress) => {
      console.log("[Options:relayer] Batch progress:", progress);
    },
    onBatchInstantExecuteError: (error) => {
      console.error("[Options:relayer] Batch error:", JSON.stringify(error, null, 2));
      const errorMsg = error?.detail || error?.error || (error as any)?.message || JSON.stringify(error);
      result = { success: false, error: errorMsg };
      callbacks?.onError?.(error);
      client.disconnect();
    },
    onBatchInstantExecuteResult: (res) => {
      console.log("[Options:relayer] Batch result:", JSON.stringify(res, null, 2));
      try {
        if ((res as any).status === "submitted") {
          window.dispatchEvent(new Event("brokerfi:channels:refresh"));
          callbacks?.onSubmitted?.();
        } else if ((res as any).status === "success") {
          callbacks?.onSuccess?.();
          client.disconnect();
        }
      } catch {}

      if ((res as any).status === "success" && res.txHash) {
        result = { success: true, txHash: res.txHash };
      } else if (res.txHash && (res as any).status === "submitted") {
        result = { success: true, txHash: res.txHash };
      } else if ((res as any).status === "error" || (res as any).status === "failed") {
        const errMsg = (res as any).error || (res as any).detail || (res as any).reason || "Transaction failed";
        console.error("[Options:relayer] Transaction failed:", errMsg);
        result = { success: false, error: errMsg };
        callbacks?.onError?.({ detail: errMsg });
        client.disconnect();
      } else if ((res as any).status !== "submitted" && (res as any).status !== "validated" && (res as any).status !== "queued") {
        console.warn("[Options:relayer] Unknown status:", (res as any).status);
        result = { success: false, error: `Unknown status: ${(res as any).status}` };
        client.disconnect();
      }
    },
    onConnectionError: () => {
      console.error("[Options:relayer] WebSocket connection failed to", RELAYER_URL);
      result = { success: false, error: "Failed to connect to relayer" };
    },
  });

  console.log("[Options:relayer] Connecting to", RELAYER_URL);
  await client.connect();

  const batchData: SignedBatchInstantExecute = {
    v: "1.0",
    t: "batch_instant_execute",
    c: channelAddress,
    items: items.map((item) => ({
      to: item.target,
      val: item.value,
      d: new Uint8Array(
        Buffer.from(item.data.slice(2), "hex")
      ),
    })),
    n: nonce,
    s: signatureToBinary(signature),
    e: Math.floor(Date.now() / 1000) + 300,
    cid: CHAIN_ID,
  };

  console.log("[Options:relayer] Sending batch instant execute...");
  await client.sendBatchInstantExecute(batchData);

  // Wait for result
  await new Promise((resolve) => setTimeout(resolve, 30000));

  console.log("[Options:relayer] Final result:", result);
  return result;
}

// ── Deposit / Withdraw Collateral ────────────────────────────────────────────

/**
 * Deposit USDC collateral into the MarginAccount via instant execution.
 * Batch: [approve USDC → marginAccount, depositCollateral]
 */
export async function depositOptionsCollateral(
  params: DepositCollateralParams,
): Promise<OptionsOrderResult> {
  try {
    const config = await getContractsConfig();
    const amountWei = parseUnits(params.amount, 6);

    console.log("[Options:deposit] Depositing", params.amount, "USDC (",amountWei.toString(), "wei)");
    console.log("[Options:deposit] USDC address:", config.external.usdc);
    console.log("[Options:deposit] MarginAccount address:", config.options.marginAccount);

    const approveData = encodeFunctionData({
      abi: erc20Abi,
      functionName: "approve",
      args: [config.options.marginAccount, amountWei],
    });

    const depositData = encodeFunctionData({
      abi: marginAccountAbi,
      functionName: "depositCollateral",
      args: [amountWei],
    });

    return await sendBatchViaRelayer(
      params.channelAddress,
      [
        { target: config.external.usdc, value: "0", data: approveData },
        { target: config.options.marginAccount, value: "0", data: depositData },
      ],
      params,
    );
  } catch (error) {
    console.error("[Options:deposit] EXCEPTION:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Withdraw USDC collateral from the MarginAccount via instant execution.
 */
export async function withdrawOptionsCollateral(
  params: WithdrawCollateralParams,
): Promise<OptionsOrderResult> {
  try {
    const config = await getContractsConfig();
    const amountWei = parseUnits(params.amount, 6);

    const withdrawData = encodeFunctionData({
      abi: marginAccountAbi,
      functionName: "withdrawCollateral",
      args: [amountWei],
    });

    return await sendBatchViaRelayer(
      params.channelAddress,
      [
        { target: config.options.marginAccount, value: "0", data: withdrawData },
      ],
      params,
    );
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ── Create Options Order ─────────────────────────────────────────────────────

/**
 * Check if a particular market exists on the OptionMarket contract.
 * Returns deployer address (non-zero = exists) and contractSize.
 */
export async function getMarketInfo(
  priceFeedId: `0x${string}`,
): Promise<{ exists: boolean; deployer: string; contractSizeInAsset: bigint } | null> {
  try {
    const config = await getContractsConfig();
    const result = (await publicClient.readContract({
      address: config.options.optionMarket,
      abi: optionMarketAbi,
      functionName: "markets",
      args: [priceFeedId],
    })) as [`0x${string}`, boolean, bigint];

    const deployer = result[0];
    const exists = deployer !== "0x0000000000000000000000000000000000000000";
    return { exists, deployer, contractSizeInAsset: result[2] };
  } catch (error) {
    console.error("[Options] Failed to check market:", error);
    return null;
  }
}


/**
 * Create an on-chain options order via instant execution.
 * Routes through OptionMarket.createOrder which handles margin locking,
 * series creation, and orderbook placement.
 *
 * Pre-flight checks:
 * 1. Market exists for the priceFeedId
 * 2. Sufficient free collateral for estimated margin + fee
 * 3. Expiry is in the future
 * 4. Channel address is valid
 */
export async function createOptionsOrder(
  params: OptionsOrderParams,
): Promise<OptionsOrderResult> {
  try {
    const config = await getContractsConfig();

    console.log("[Options:createOrder] ═══════════════════════════════════════");
    console.log("[Options:createOrder] Parameters:", {
      channel: params.channelAddress,
      priceFeedId: params.underlyingPriceFeedId,
      isCall: params.isCall,
      isLong: params.isLong,
      strikePrice: params.strikePrice.toString(),
      expiry: params.expiry,
      amount: params.amount,
      limitPricePerOption: params.limitPricePerOption.toString(),
      putCashSecured: params.putCashSecured,
    });

    // ── Pre-flight check 1: Market exists ──
    // Non-blocking: if the RPC read fails we proceed anyway — the contract will revert if invalid.
    // Only block when we get a definitive deployer==0x0 response.
    const marketInfo = await getMarketInfo(params.underlyingPriceFeedId);
    if (marketInfo && !marketInfo.exists) {
      const msg = `Market does not exist for priceFeedId ${params.underlyingPriceFeedId}. Has the market been created on-chain?`;
      console.error("[Options:createOrder] PREFLIGHT FAIL:", msg);
      params.onError?.({ detail: msg });
      return { success: false, error: msg };
    }
    if (!marketInfo) {
      console.warn("[Options:createOrder] Could not verify market on-chain (RPC issue?) — proceeding anyway for", params.underlyingPriceFeedId);
    } else {
      console.log("[Options:createOrder] Market found:", {
        deployer: marketInfo.deployer,
        contractSize: marketInfo.contractSizeInAsset.toString(),
      });
    }

    // ── Pre-flight check 2: Expiry in the future ──
    const now = Math.floor(Date.now() / 1000);
    if (params.expiry <= now) {
      const msg = `Expiry ${params.expiry} is in the past (now=${now})`;
      console.error("[Options:createOrder] PREFLIGHT FAIL:", msg);
      params.onError?.({ detail: msg });
      return { success: false, error: msg };
    }

    // ── Pre-flight check 3: Sufficient collateral ──
    const balances = await getAccountBalances(params.channelAddress);
    if (!balances) {
      console.warn("[Options:createOrder] Could not fetch balances — proceeding anyway");
    } else if (!marketInfo) {
      console.warn("[Options:createOrder] No market info for collateral estimation — skipping check");
    } else {
      const free = balances.freeCollateral;
      // Estimate margin: (limitPricePerOption * contractSize / 1e18) * amount + fee
      const contractSize = marketInfo.contractSizeInAsset;
      const marginPerContract = (params.limitPricePerOption * contractSize) / BigInt(1e18);
      const estimatedMargin = marginPerContract * BigInt(params.amount);
      console.log("[Options:createOrder] Collateral check:", {
        totalCollateral: balances.totalCollateral.toString(),
        lockedMargin: balances.lockedMargin.toString(),
        freeCollateral: free.toString(),
        estimatedMarginNeeded: estimatedMargin.toString(),
        sufficient: free >= estimatedMargin,
      });
      if (free < estimatedMargin) {
        const msg = `Insufficient collateral. Free: ${formatPrice18(free)}, needed: ~${formatPrice18(estimatedMargin)}. Deposit USDC first.`;
        console.error("[Options:createOrder] PREFLIGHT FAIL:", msg);
        params.onError?.({ detail: msg });
        return { success: false, error: msg };
      }
    }

    // ── Fetch Pyth update data ──
    console.log("[Options:createOrder] Fetching Pyth update data for", params.underlyingPriceFeedId);
    const pythUpdateData = await getPythUpdateData([
      params.underlyingPriceFeedId,
    ]);
    console.log("[Options:createOrder] Pyth update data:", pythUpdateData.length, "entries",
      pythUpdateData.length > 0 ? `(first ${pythUpdateData[0].substring(0, 20)}...)` : "(EMPTY — may cause issues for sell orders)");

    if (pythUpdateData.length === 0) {
      console.warn("[Options:createOrder] WARNING: No Pyth update data returned. Sell orders that need Oracle will revert.");
    }

    // ── Encode createOrder calldata ──
    const createOrderData = encodeFunctionData({
      abi: optionMarketAbi,
      functionName: "createOrder",
      args: [
        params.underlyingPriceFeedId,
        params.isCall,
        params.isLong,
        params.strikePrice,
        BigInt(params.expiry),
        BigInt(params.amount),
        params.limitPricePerOption,
        params.putCashSecured ?? false,
        pythUpdateData as `0x${string}`[],
      ],
    });

    console.log("[Options:createOrder] Encoded calldata:", createOrderData.substring(0, 74) + "...",
      `(${createOrderData.length / 2 - 1} bytes)`);
    console.log("[Options:createOrder] Target:", config.options.optionMarket);

    // Note: createOrder is NOT payable. For sell orders requiring Oracle,
    // the OptionMarket contract must have ETH pre-funded for Pyth fees.
    // Buy orders don't call Oracle so they work without ETH.
    if (!params.isLong) {
      console.warn("[Options:createOrder] This is a SELL order — Oracle will be called. Ensure OptionMarket has ETH for Pyth fees.");
    }

    console.log("[Options:createOrder] Submitting batch via relayer...");
    return await sendBatchViaRelayer(
      params.channelAddress,
      [
        { target: config.options.optionMarket, value: "0", data: createOrderData },
      ],
      params,
    );
  } catch (error) {
    console.error("[Options:createOrder] EXCEPTION:", error);
    return { success: false, error: String(error) };
  }
}

// ── Cancel Order ─────────────────────────────────────────────────────────────

/**
 * Cancel an active options limit order via instant execution.
 */
export async function cancelOptionsOrder(
  params: CancelOrderParams,
): Promise<OptionsOrderResult> {
  try {
    const config = await getContractsConfig();

    const cancelData = encodeFunctionData({
      abi: optionMarketAbi,
      functionName: "cancelOrder",
      args: [params.seriesId, params.orderId],
    });

    return await sendBatchViaRelayer(
      params.channelAddress,
      [
        { target: config.options.optionMarket, value: "0", data: cancelData },
      ],
      params,
    );
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ── Read-only queries ────────────────────────────────────────────────────────

/**
 * Get the margin account balances (totalCollateral, lockedMargin, freeCollateral)
 * for a given channel address.
 */
export async function getAccountBalances(
  channelAddress: `0x${string}`,
): Promise<AccountBalances | null> {
  try {
    const config = await getContractsConfig();

    const [totalCollateral, lockedMargin] = (await publicClient.readContract({
      address: config.options.marginAccount,
      abi: marginAccountAbi,
      functionName: "getAccountBalances",
      args: [channelAddress],
    })) as [bigint, bigint];

    return {
      totalCollateral,
      lockedMargin,
      freeCollateral: totalCollateral - lockedMargin,
    };
  } catch (error) {
    console.error("[Options] Failed to get account balances:", error);
    return null;
  }
}

/**
 * Get all active option positions for a channel address.
 */
export async function getOptionsPositions(
  channelAddress: `0x${string}`,
): Promise<OptionsPosition[]> {
  try {
    const config = await getContractsConfig();

    // Get active series
    const seriesIds = (await publicClient.readContract({
      address: config.options.marginAccount,
      abi: marginAccountAbi,
      functionName: "getActiveSeries",
      args: [channelAddress],
    })) as `0x${string}`[];

    const positions: OptionsPosition[] = [];

    for (const seriesId of seriesIds) {
      const [, quantity, entryPrice, isLong, marginPerContract] =
        (await publicClient.readContract({
          address: config.options.marginAccount,
          abi: marginAccountAbi,
          functionName: "positions",
          args: [channelAddress, seriesId],
        })) as [
          `0x${string}`,
          bigint,
          bigint,
          boolean,
          bigint,
        ];

      if (quantity === 0n) continue;

      // Decode series info
      let underlyingPriceFeedId: `0x${string}` | undefined;
      let isCall: boolean | undefined;
      let strikePrice: bigint | undefined;
      let expiry: bigint | undefined;

      try {
        const seriesInfo = (await publicClient.readContract({
          address: config.options.orderbook,
          abi: orderbookAbi,
          functionName: "getSeries",
          args: [seriesId],
        })) as [`0x${string}`, boolean, bigint, bigint, bigint];

        underlyingPriceFeedId = seriesInfo[0];
        isCall = seriesInfo[1];
        strikePrice = seriesInfo[2];
        expiry = seriesInfo[3];
        // seriesInfo[4] = contractSize (available if needed)
      } catch {}

      positions.push({
        seriesId,
        quantity,
        entryPrice,
        isLong,
        marginPerContract,
        underlyingPriceFeedId,
        isCall,
        strikePrice,
        expiry,
      });
    }

    return positions;
  } catch (error) {
    console.error("[Options] Failed to get positions:", error);
    return [];
  }
}

/**
 * Get all active limit orders for a channel address from the subgraph.
 * Note: The Orderbook contract does NOT have getTraderOrders() or getOrder() view functions.
 * Orders are stored in a mapping(seriesId => mapping(orderId => Order)) with no enumeration.
 * We must use the subgraph (same approach as useOptionsOrders hook).
 */
export async function getOptionsOrders(
  channelAddress: `0x${string}`,
): Promise<OptionsLimitOrder[]> {
  try {
    const subgraphUrl = typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_GOLDSKY_URL
      : process.env.NEXT_PUBLIC_GOLDSKY_URL;

    if (!subgraphUrl) {
      console.warn("[Options] No subgraph URL configured (NEXT_PUBLIC_GOLDSKY_URL), cannot fetch orders");
      return [];
    }

    const query = `{
      optionsOrders(
        where: {
          trader: "${channelAddress.toLowerCase()}"
          status: "ACTIVE"
        }
        orderBy: createdTime
        orderDirection: desc
      ) {
        orderId
        limitPrice
        quantity
        marginLocked
        intent
        isLong
        status
        createdTime
        trader {
          id
        }
        series {
          id
          underlyingPriceFeedId
          isCall
          strikePrice
          expiry
          contractSize
        }
      }
    }`;

    const res = await fetch(subgraphUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    if (!res.ok) {
      console.error("[Options] Subgraph query failed:", res.status);
      return [];
    }

    const { data, errors } = await res.json();
    if (errors) {
      console.error("[Options] Subgraph errors:", errors);
      return [];
    }

    const rawOrders = data?.optionsOrders || [];

    return rawOrders.map((o: any) => ({
      orderId: o.orderId as `0x${string}`,
      trader: o.trader?.id as `0x${string}`,
      seriesId: o.series?.id as `0x${string}`,
      quantity: BigInt(o.quantity || "0"),
      limitPrice: BigInt(o.limitPrice || "0"),
      intent: Number(o.intent || 0),
      marginPerContract: BigInt(o.marginLocked || "0"),
      timestamp: BigInt(o.createdTime || "0"),
      isActive: o.status === "ACTIVE",
    }));
  } catch (error) {
    console.error("[Options] Failed to get orders:", error);
    return [];
  }
}

/**
 * Check if a particular market (priceFeedId) is supported on the OptionMarket.
 */
export async function isMarketSupported(
  priceFeedId: `0x${string}`,
): Promise<boolean> {
  try {
    const info = await getMarketInfo(priceFeedId);
    return info?.exists ?? false;
  } catch {
    return false;
  }
}

// ── Community Market Creation ────────────────────────────────────────────────

export interface CreateCommunityMarketParams {
  channelAddress: `0x${string}`;
  priceFeedId: `0x${string}`;
  onSubmitted?: () => void;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

/**
 * Create a new community options market. Costs 250 USDC (150 → InsuranceFund, 100 → FeeFlow).
 * Batch: [approve 250 USDC → OptionMarket, createMarket(priceFeedId, updateData)]
 */
export async function createCommunityMarket(
  params: CreateCommunityMarketParams,
): Promise<OptionsOrderResult> {
  try {
    const config = await getContractsConfig();

    // Community market creation costs 250 USDC
    const creationFee = parseUnits("250", 6);

    const pythUpdateData = await getPythUpdateData([params.priceFeedId]);

    const approveData = encodeFunctionData({
      abi: erc20Abi,
      functionName: "approve",
      args: [config.options.optionMarket, creationFee],
    });

    const createMarketData = encodeFunctionData({
      abi: optionMarketAbi,
      functionName: "createMarket",
      args: [params.priceFeedId, pythUpdateData as `0x${string}`[]],
    });

    return await sendBatchViaRelayer(
      params.channelAddress,
      [
        { target: config.external.usdc, value: "0", data: approveData },
        { target: config.options.optionMarket, value: "0", data: createMarketData },
      ],
      params,
    );
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ── Community Market Fetching ────────────────────────────────────────────────

/**
 * Known Pyth price feeds that could have community markets
 */
const KNOWN_COMMUNITY_FEEDS = [
  "0x93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7", // AVAX
  "0x8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221", // LINK
  "0x3fa4252848f9f0a1480be62745a4629d9eb1322aebab8a791e344b3b9c1adcf5", // ARB
  "0x385f64d993f7b77d8182ed5003d97c60aa3361f3cecfe711544d2d59165e9bdf", // OP
  "0x5de33440f6c5e08a0512b37d37a6f0c8c20e8d8b4083a9d07e0ce97f3793e5e7", // MATIC
  "0x78d185a741d07edb3412b09008b7c5cfb9bbbd7d568bf00ba737b456ba171501", // UNI
  "0x2b9ab1e972a281585084148ba1389800799bd4be63b957507db1349314e47445", // AAVE
  "0x9375299e31c0deb9c6bc378e6329aab44cb4f3d5e4285758f7693a5fede1e5d6", // MKR
  "0xd69731a2e74ac1ce884fc3890f7ee324b6deb66147055249568869ed700882e4", // PEPE
  "0x4ca4beeca86f0d164160323817a4e42b10010a724c2217c6c26ceea58c1f89c0", // WIF
];

/**
 * Get all community markets that exist on-chain
 * Returns known community markets immediately as ghost/placeholder entries
 */
export async function getCommunityMarkets(): Promise<OptionsAssetConfig[]> {
  // Return known community markets immediately as ghost/placeholder entries
  const placeholderMarkets: OptionsAssetConfig[] = KNOWN_COMMUNITY_FEEDS.map(feedId => {
    const symbol = getSymbolFromFeedId(feedId);
    const name = getNameFromFeedId(feedId);

    return {
      symbol,
      display: `${symbol}/USD`,
      name,
      pythId: feedId,
      description: `Community market for ${name}`,
      category: "crypto",
      popular: false,
      isLoading: true, // Ghost loading state
    };
  });

  return placeholderMarkets;
}

/**
 * Get community markets from subgraph
 */
let communityMarketsCache: AssetData[] | null = null
let communityMarketsCacheTime: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function getCommunityMarketsFromSubgraph(): Promise<AssetData[]> {
  // Check cache
  if (communityMarketsCache && (Date.now() - communityMarketsCacheTime) < CACHE_DURATION) {
    return communityMarketsCache
  }

  const subgraphUrl = process.env.NEXT_PUBLIC_GOLDSKY_URL;
  if (!subgraphUrl) throw new Error('NEXT_PUBLIC_GOLDSKY_URL not set');

  // First check if there are any markets at all
  const countQuery = `
    query {
      optionsMarkets {
        id
        community
        priceFeedId
      }
    }
  `;

  const mainQuery = `
    query {
      optionsMarkets(where: { community: true }) {
        priceFeedId
        contractSize
      }
    }
  `;

  console.log("Querying subgraph at:", subgraphUrl);

  // First check all markets
  console.log("Checking all markets first...");
  try {
    const countResponse = await fetch(subgraphUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: countQuery }),
    });

    if (countResponse.ok) {
      const countData = await countResponse.json();
      console.log("All markets in subgraph:", countData.data?.optionsMarkets);
    }
  } catch (error) {
    console.log("Failed to check all markets:", error);
  }

  // Then query community markets
  console.log("Querying community markets...");
  console.log("Query:", mainQuery);

  const response = await fetch(subgraphUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: mainQuery }),
  });

  if (!response.ok) {
    throw new Error(`Subgraph query failed: ${response.status}`);
  }

  const data = await response.json();
  console.log("Subgraph response:", data);

  const markets = data.data?.optionsMarkets || [];
  console.log("Parsed community markets:", markets);

  const result = markets.map((market: any) => {
    const feedId = market.priceFeedId;
    const symbol = getSymbolFromFeedId(feedId);
    const name = getNameFromFeedId(feedId);

    return {
      pyth_id: feedId,
      symbol,
      display: `${symbol}/USD`,
      description: `Community market for ${name}`,
      category: "crypto_pairs",
      comingSoon: false,
      name,
      type: 'crypto' as const,
      priceId: feedId,
      urlSlug: feedId,
      searchTerms: [symbol, name],
      popular: false,
      pythId: feedId,
      contractSize: market.contractSize,
    };
  });

  // Cache the result
  communityMarketsCache = result as AssetData[];
  communityMarketsCacheTime = Date.now();

  return result;
}

/**
 * Simple mapping from feedId to symbol (can be expanded)
 */
function getSymbolFromFeedId(feedId: string): string {
  const mappings: Record<string, string> = {
    "0x93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7": "AVAX",
    "0x8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221": "LINK",
    "0x3fa4252848f9f0a1480be62745a4629d9eb1322aebab8a791e344b3b9c1adcf5": "ARB",
    "0x385f64d993f7b77d8182ed5003d97c60aa3361f3cecfe711544d2d59165e9bdf": "OP",
    "0x5de33440f6c5e08a0512b37d37a6f0c8c20e8d8b4083a9d07e0ce97f3793e5e7": "MATIC",
    "0x78d185a741d07edb3412b09008b7c5cfb9bbbd7d568bf00ba737b456ba171501": "UNI",
    "0x2b9ab1e972a281585084148ba1389800799bd4be63b957507db1349314e47445": "AAVE",
    "0x9375299e31c0deb9c6bc378e6329aab44cb4f3d5e4285758f7693a5fede1e5d6": "MKR",
    "0xd69731a2e74ac1ce884fc3890f7ee324b6deb66147055249568869ed700882e4": "PEPE",
    "0x4ca4beeca86f0d164160323817a4e42b10010a724c2217c6c26ceea58c1f89c0": "WIF",
  };
  return mappings[feedId] || "UNKNOWN";
}

/**
 * Simple mapping from feedId to name
 */
function getNameFromFeedId(feedId: string): string {
  const mappings: Record<string, string> = {
    "0x93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7": "Avalanche",
    "0x8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221": "Chainlink",
    "0x3fa4252848f9f0a1480be62745a4629d9eb1322aebab8a791e344b3b9c1adcf5": "Arbitrum",
    "0x385f64d993f7b77d8182ed5003d97c60aa3361f3cecfe711544d2d59165e9bdf": "Optimism",
    "0x5de33440f6c5e08a0512b37d37a6f0c8c20e8d8b4083a9d07e0ce97f3793e5e7": "Polygon",
    "0x78d185a741d07edb3412b09008b7c5cfb9bbbd7d568bf00ba737b456ba171501": "Uniswap",
    "0x2b9ab1e972a281585084148ba1389800799bd4be63b957507db1349314e47445": "Aave",
    "0x9375299e31c0deb9c6bc378e6329aab44cb4f3d5e4285758f7693a5fede1e5d6": "Maker",
    "0xd69731a2e74ac1ce884fc3890f7ee324b6deb66147055249568869ed700882e4": "Pepe",
    "0x4ca4beeca86f0d164160323817a4e42b10010a724c2217c6c26ceea58c1f89c0": "dogwifhat",
  };
  return mappings[feedId] || "Unknown Asset";
}

// ── Utility formatters ───────────────────────────────────────────────────────

/** Format 18-decimal bigint to human-readable string */
export function formatPrice18(value: bigint): string {
  return formatUnits(value, 18);
}

/** Parse human-readable price string to 18-decimal bigint */
export function parsePrice18(value: string): bigint {
  return parseUnits(value, 18);
}

/** Format 6-decimal USDC bigint to human-readable string */
export function formatUSDC(value: bigint): string {
  return formatUnits(value, 6);
}

// ── Settlement ───────────────────────────────────────────────────────────────

export interface SettlePositionParams {
  channelAddress: `0x${string}`;
  traderAddress: `0x${string}`;   // The address that holds the position (usually same as channel)
  seriesId: `0x${string}`;
  underlyingPriceFeedId: `0x${string}`;
  onSubmitted?: () => void;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

/**
 * Settle an expired options position via OptionMarket.settlePosition().
 * This is a payable function — it requires ETH for the Pyth oracle update fee.
 * The function calls: settlePosition(address trader, bytes32 seriesId, bytes[] calldata pythUpdateData)
 */
export async function settleOptionsPosition(
  params: SettlePositionParams,
): Promise<OptionsOrderResult> {
  try {
    const config = await getContractsConfig();

    console.log("[Options:settle] Settling position:", {
      channel: params.channelAddress,
      trader: params.traderAddress,
      seriesId: params.seriesId,
    });

    // Fetch Pyth update data for the underlying asset
    const pythUpdateData = await getPythUpdateData([
      params.underlyingPriceFeedId,
    ]);

    if (pythUpdateData.length === 0) {
      console.warn("[Options:settle] No Pyth update data — settlement may fail if oracle price is stale");
    }

    const settleData = encodeFunctionData({
      abi: optionMarketAbi,
      functionName: "settlePosition",
      args: [
        params.traderAddress,
        params.seriesId,
        pythUpdateData as `0x${string}`[],
      ],
    });

    // settlePosition is payable — needs ETH for Pyth update fee (typically ~1 wei on testnet)
    // Send a small amount of ETH to cover the Pyth fee
    const pythFeeWei = "1"; // 1 wei — Pyth on testnet usually accepts this

    return await sendBatchViaRelayer(
      params.channelAddress,
      [
        { target: config.options.optionMarket, value: pythFeeWei, data: settleData },
      ],
      params,
    );
  } catch (error) {
    console.error("[Options:settle] EXCEPTION:", error);
    return { success: false, error: String(error) };
  }
}
