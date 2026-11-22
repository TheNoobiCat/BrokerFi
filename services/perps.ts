import { encodeFunctionData, parseUnits, type WalletClient, encodeAbiParameters, keccak256, hashTypedData, hexToBytes, getContract } from "viem";
import { getPerpsMarketById } from "./perpsMarkets";
import { SessionRelayerClient, type SignedBatchInstantExecute, type BatchItem, signatureToBinary } from "./sessionRelayer";
import { signBatchInstantExecute } from "./keyVault";
import { perpTradingAbi } from "@/blockchain/abis";
import { getPythUpdateData } from "./pyth/pythPriceMulti";
import publicClient from "@/blockchain/publicClient";

// Relayer WebSocket URL from environment or default to localhost
const DEFAULT_RELAYER_URL = process.env.NEXT_PUBLIC_RELAYER_WS_URL || "ws://localhost:4001/ws";

// Extended ABI for trading contract with market state getter
const perpTradingExtendedAbi = [
  {
    inputs: [],
    name: "market",
    outputs: [
      { internalType: "uint256", name: "totalLongs", type: "uint256" },
      { internalType: "uint256", name: "totalShorts", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

// ABI for LiquidityPool depositQuote function
const liquidityPoolAbi = [
  {
    inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    name: "depositQuote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "shares", type: "uint256" }],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "notionalSize", type: "uint256" }],
    name: "calculateTradingFee",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "notionalSizeUsd", type: "uint256" },
      { internalType: "bool", name: "isLong", type: "bool" },
      { internalType: "uint256", name: "totalLongsUsd", type: "uint256" },
      { internalType: "uint256", name: "totalShortsUsd", type: "uint256" },
    ],
    name: "calculatePriceImpactFee",
    outputs: [
      { internalType: "uint256", name: "priceImpactFee", type: "uint256" },
      { internalType: "uint256", name: "priceImpactBps", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

// ABI for ERC20 approve function
const erc20Abi = [
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// ABI for LimitOrderBook
const limitOrderBookAbi = [
  {
    inputs: [{ internalType: "bytes32", name: "orderId", type: "bytes32" }],
    name: "getLimitOrder",
    outputs: [
      {
        components: [
          { internalType: "address", name: "trader", type: "address" },
          { internalType: "uint256", name: "collateral", type: "uint256" },
          { internalType: "uint256", name: "size", type: "uint256" },
          { internalType: "bool", name: "isLong", type: "bool" },
          { internalType: "uint256", name: "triggerPrice", type: "uint256" },
          { internalType: "uint256", name: "attachedStopLoss", type: "uint256" },
          { internalType: "uint256", name: "attachedTakeProfit", type: "uint256" },
          { internalType: "uint256", name: "expiryTime", type: "uint256" },
          { internalType: "uint256", name: "createdTime", type: "uint256" }
        ],
        internalType: "struct LimitOrderBook.LimitOrder",
        name: "",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "bytes32", name: "orderId", type: "bytes32" }],
    name: "cancelLimitOrder",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;


export interface DepositParams {
  marketId: string;
  amount: string; // USDC amount as string
  channelAddress: `0x${string}`;
  usdcAddress: `0x${string}`;
  onSubmitted?: () => void; // Callback when relayer reports submission
  onSuccess?: () => void; // Callback when blockchain confirms success
  onError?: (error: any) => void; // Callback for errors
}

export interface DepositResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export async function depositToPerpsPool(
  params: DepositParams,
  walletClient: WalletClient,
  relayerUrl: string = DEFAULT_RELAYER_URL
): Promise<DepositResult> {
  console.log('[DEBUG] depositToPerpsPool called with params:', params);
  try {
    const market = await getPerpsMarketById(params.marketId);
    console.log('[DEBUG] Market retrieved:', market);
    if (!market) {
      console.log('[DEBUG] Market not found for ID:', params.marketId);
      return { success: false, error: "Market not found" };
    }

    if (!walletClient) {
      console.log('[DEBUG] No wallet connected');
      return { success: false, error: "No wallet connected" };
    }

    const amountWei = parseUnits(params.amount, 6); // USDC has 6 decimals
    console.log('[DEBUG] Amount in wei:', amountWei.toString());

    // Create batch items: approve and deposit
    const approveData = encodeFunctionData({
      abi: erc20Abi,
      functionName: "approve",
      args: [market.poolAddress, amountWei],
    });
    console.log('[DEBUG] Approve data encoded:', approveData);

    const depositData = encodeFunctionData({
      abi: liquidityPoolAbi,
      functionName: "depositQuote",
      args: [amountWei],
    });
    console.log('[DEBUG] Deposit data encoded:', depositData);

    const items = [
      {
        target: params.usdcAddress,
        value: "0",
        data: approveData,
      },
      {
        target: market.poolAddress,
        value: "0",
        data: depositData,
      },
    ];

    // Generate nonce (simple timestamp-based for now)
    const nonce = Math.floor(Date.now() / 1000);
    console.log('[DEBUG] Generated nonce:', nonce);

    // Sign the batch
    const signature = await signBatchInstantExecute({
      channelAddress: params.channelAddress,
      items: items.map(item => ({
        target: item.target as `0x${string}`,
        value: item.value,
        data: item.data as `0x${string}`,
      })),
      nonce,
      chainId: 421614, // Arbitrum Sepolia
    });
    console.log('[DEBUG] Signature generated:', signature ? 'Success' : 'Failed');

    if (!signature) {
      console.log('[DEBUG] Failed to sign batch transaction');
      return { success: false, error: "Failed to sign batch transaction" };
    }

    // Create WebSocket client
    const client = new SessionRelayerClient(relayerUrl);

    // Set up callbacks
    let result: DepositResult = { success: false, error: "Timeout" };

    client.setCallbacks({
      onBatchInstantExecuteResponse: (response) => {
        console.log("Batch instant execute response:", response);
      },
      onBatchInstantExecuteProgress: (progress) => {
        console.log("Batch instant execute progress:", progress);
      },
      onBatchInstantExecuteError: (error) => {
        console.error("Batch instant execute error:", error);
        result = { success: false, error: error.detail };
        if (params.onError) {
          params.onError(error);
        }
        client.disconnect();
      },
      onBatchInstantExecuteResult: (res) => {
        console.log("Batch instant execute result:", res);
        // Handle different statuses
        try {
          if ((res as any).status === 'submitted') {
            window.dispatchEvent(new Event('brokerfi:channels:refresh'));
            // Call the onSubmitted callback to update UI (but don't close modal yet)
            params.onSubmitted?.();
            // DON'T disconnect here - wait for success confirmation
          } else if ((res as any).status === 'success') {
            // Call onSuccess callback to close modal and show toast
            params.onSuccess?.();
            // Now disconnect after success
            client.disconnect();
          }
        } catch (e) {}

        if ((res as any).status === 'success' && res.txHash) {
          result = { success: true, txHash: res.txHash };
        } else if (res.txHash && (res as any).status === 'submitted') {
          // For submitted status, don't set final result yet - wait for success
          result = { success: true, txHash: res.txHash };
        } else {
          result = { success: false, error: "Transaction failed" };
          client.disconnect();
        }
      },
      onConnectionError: (error) => {
        result = { success: false, error: "Failed to connect to relayer" };
      },
    });

    // Connect and send
    await client.connect();
    console.log('[DEBUG] Connected to relayer');

    const batchData: SignedBatchInstantExecute = {
      v: "1.0",
      t: "batch_instant_execute",
      c: params.channelAddress,
      items: items.map(item => ({
        to: item.target,
        val: item.value,
        d: new Uint8Array(Buffer.from(item.data.slice(2), 'hex')),
      })),
      n: nonce,
      s: signatureToBinary(signature),
      e: Math.floor(Date.now() / 1000) + 300, // 5 minutes expiry
      cid: 421614,
    };
    console.log('[DEBUG] Batch data prepared:', { ...batchData, s: 'redacted', d: 'redacted' }); // Redact sensitive data

    await client.sendBatchInstantExecute(batchData);
    console.log('[DEBUG] Batch sent to relayer');

    // Wait for result (simple timeout)
    await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds

    return result;

  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export interface ContractPosition {
  trader: `0x${string}`;
  collateral: bigint;
  collateralUsd: bigint;
  size: bigint;
  sizeUsd: bigint;
  entryPrice: bigint;
  lastFundingSnapshot: bigint;
  openTime: bigint;
  isLong: boolean;
  stopLossPrice: bigint;
  takeProfitPrice: bigint;
}

export interface ContractOrder {
  id?: string;
  trader: `0x${string}`;
  collateral: bigint;
  size: bigint;
  isLong: boolean;
  triggerPrice: bigint;
  attachedStopLoss: bigint;
  attachedTakeProfit: bigint;
  expiryTime: bigint;
  createdTime: bigint;
}

export interface FetchOrdersParams {
  channelAddress: `0x${string}`;
  marketId?: string;
}

export interface FetchOrdersResult {
  success: boolean;
  orders?: ContractOrder[];
  error?: string;
}

export async function fetchContractOrders(params: FetchOrdersParams): Promise<FetchOrdersResult> {
  try {
    let tradingAddress: `0x${string}`;

    if (params.marketId) {
      const market = await getPerpsMarketById(params.marketId);
      if (!market) {
        return { success: false, error: "Market not found" };
      }
      tradingAddress = market.tradingAddress;
    } else {
      return { success: false, error: "marketId is required" };
    }

    // Assume contract has getOrders(address) returning array of orders
    const ordersData = await publicClient.readContract({
      address: tradingAddress,
      abi: perpTradingAbi,
      functionName: "getOrders",
      args: [params.channelAddress],
    }) as any[];

    const orders: ContractOrder[] = ordersData.map(order => ({
      id: order.id,
      trader: order.trader,
      size: order.size,
      collateral: order.collateral,
      isLong: order.isLong,
      triggerPrice: order.triggerPrice,
      isStopLoss: order.isStopLoss,
      isTakeProfit: order.isTakeProfit,
      attachedStopLoss: order.attachedStopLoss,
      attachedTakeProfit: order.attachedTakeProfit,
      expiryTime: order.expiryTime,
      createdTime: order.createdTime,
    }));

    return { success: true, orders };
  } catch (error) {
    console.error("Failed to fetch contract orders:", error);
    return { success: false, error: String(error) };
  }
}

export async function fetchLimitOrders(
  marketId: string,
  orderIds: string[]
): Promise<{ success: boolean; orders?: ContractOrder[]; error?: string }> {
  try {
    const market = await getPerpsMarketById(marketId);
    if (!market || !market.limitOrderBookAddress) {
      return { success: false, error: "Market or limit order book not found" };
    }

    const orders: ContractOrder[] = [];

    for (const orderId of orderIds) {
      try {
        const order = await publicClient.readContract({
          address: market.limitOrderBookAddress,
          abi: limitOrderBookAbi,
          functionName: "getLimitOrder",
          args: [orderId as `0x${string}`],
        }) as ContractOrder;

        // Check if order exists (trader should not be zero address)
        if (order.trader !== '0x0000000000000000000000000000000000000000') {
          orders.push({ ...order, id: orderId });
        }
      } catch (error) {
        // Order might not exist, continue
        console.warn(`Failed to fetch limit order ${orderId}:`, error);
      }
    }

    return { success: true, orders };
  } catch (error) {
    console.error("Failed to fetch limit orders:", error);
    return { success: false, error: String(error) };
  }
}

export interface FetchPositionsParams {
  channelAddress: `0x${string}`;
  marketId?: string;
}

export interface FetchPositionsResult {
  success: boolean;
  positions?: ContractPosition[];
  error?: string;
}

export async function fetchContractPositions(params: FetchPositionsParams): Promise<FetchPositionsResult> {
  try {
    let tradingAddress: `0x${string}`;

    if (params.marketId) {
      const market = await getPerpsMarketById(params.marketId);
      if (!market) {
        return { success: false, error: "Market not found" };
      }
      tradingAddress = market.tradingAddress;
    } else {
      return { success: false, error: "marketId is required" };
    }

    // Read the public mapping positions(address)
    const positionData = await publicClient.readContract({
      address: tradingAddress,
      abi: perpTradingAbi,
      functionName: "positions",
      args: [params.channelAddress],
    }) as any as {
      trader: `0x${string}`;
      collateral: bigint;
      collateralUsd: bigint;
      size: bigint;
      sizeUsd: bigint;
      entryPrice: bigint;
      lastFundingSnapshot: bigint;
      openTime: bigint;
      isLong: boolean;
      stopLossPrice: bigint;
      takeProfitPrice: bigint;
    };

    const { trader, collateral, collateralUsd, size, sizeUsd, entryPrice, lastFundingSnapshot, openTime, isLong, stopLossPrice, takeProfitPrice } = positionData;

    // If position exists (size > 0), return it
    if (size > BigInt(0)) {
      return { success: true, positions: [{ trader, collateral, collateralUsd, size, sizeUsd, entryPrice, lastFundingSnapshot, openTime, isLong, stopLossPrice, takeProfitPrice }] };
    } else {
      return { success: true, positions: [] };
    }
  } catch (error) {
    console.error("Failed to fetch contract positions:", error);
    return { success: false, error: String(error) };
  }
}

export async function fetchPositionIds(params: FetchPositionsParams): Promise<{ success: boolean; positionIds?: bigint[]; error?: string }> {
  try {
    let tradingAddress: `0x${string}`;

    if (params.marketId) {
      const market = await getPerpsMarketById(params.marketId);
      if (!market) {
        return { success: false, error: "Market not found" };
      }
      tradingAddress = market.tradingAddress;
    } else {
      return { success: false, error: "marketId is required" };
    }

    const positionIds = await publicClient.readContract({
      address: tradingAddress,
      abi: perpTradingAbi,
      functionName: "positions",
      args: [params.channelAddress],
    }) as unknown as bigint[];

    return { success: true, positionIds };
  } catch (error) {
    console.error("Failed to fetch position IDs:", error);
    return { success: false, error: String(error) };
  }
}

export async function fetchSinglePosition(tradingAddress: `0x${string}`, positionId: bigint): Promise<{ success: boolean; position?: ContractPosition; error?: string }> {
  try {
    const position = await publicClient.readContract({
      address: tradingAddress,
      abi: perpTradingAbi,
      functionName: "getPosition",
      args: [positionId],
    }) as unknown as ContractPosition;

    return { success: true, position };
  } catch (error) {
    console.error("Failed to fetch single position:", error);
    return { success: false, error: String(error) };
  }
}

export interface WithdrawParams {
  marketId: string;
  shares: string; // LP shares amount as string
  channelAddress: `0x${string}`;
  onSubmitted?: () => void; // Callback when relayer reports submission
  onSuccess?: () => void; // Callback when blockchain confirms success
  onError?: (error: any) => void; // Callback for errors
}

export interface WithdrawResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export interface OpenPositionParams {
  marketId: string;
  collateral: string; // USDC amount as string
  usdcAddress: `0x${string}`;
  leverage: string; // Leverage as string, e.g. "5" for 5x
  isLong: boolean;
  expectedPrice: string; // Expected price as string
  takeProfit?: string; // Optional TP price
  stopLoss?: string; // Optional SL price
  channelAddress: `0x${string}`;
  viaAgent?: boolean; // Optional: true if executed by AI agent
  onSubmitted?: () => void;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export interface OpenPositionResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export interface ClosePositionParams {
  marketId: string;
  expectedPrice: string; // Expected price as string
  channelAddress: `0x${string}`;
  onSubmitted?: () => void;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export interface ClosePositionResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export interface WithdrawParams {
  marketId: string;
  shares: string; // Shares amount as string
  channelAddress: `0x${string}`;
  onSubmitted?: () => void;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export interface WithdrawResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export async function openPerpsPosition(
  params: OpenPositionParams,
  walletClient: WalletClient,
  relayerUrl: string = DEFAULT_RELAYER_URL
): Promise<OpenPositionResult> {
  console.log('[DEBUG] openPerpsPosition called with params:', params);
  try {
    const market = await getPerpsMarketById(params.marketId);
    console.log('[DEBUG] Market retrieved:', market);
    if (!market) {
      console.log('[DEBUG] Market not found for ID:', params.marketId);
      return { success: false, error: "Market not found" };
    }

    if (!walletClient) {
      console.log('[DEBUG] No wallet connected');
      return { success: false, error: "No wallet connected" };
    }

    const collateralWei = parseUnits(params.collateral, 6); // USDC has 6 decimals
    const leverageWei = parseUnits(params.leverage, 18); // Leverage with 18 decimals
    const expectedPriceWei = parseUnits(params.expectedPrice, 18); // Prices have 18 decimals in contract
    console.log('[DEBUG] Parsed values - collateralWei:', collateralWei.toString(), 'leverageWei:', leverageWei.toString(), 'expectedPriceWei:', expectedPriceWei.toString());

    // Calculate position size for SL/TP orders
    const collateralValueWei = parseUnits(params.collateral, 18); // Collateral value in 18 decimals
    const positionSizeWei = (collateralValueWei * leverageWei) / expectedPriceWei;
    console.log('[DEBUG] Position size wei:', positionSizeWei.toString());

    // Get Pyth update data
    const updateDataHex = await getPythUpdateData([market.pythPriceId]);
    console.log('[DEBUG] Pyth update data received:', updateDataHex.length, 'items');
    if (updateDataHex.length === 0) {
      console.log('[DEBUG] No price update data received');
      return { success: false, error: "Failed to get price update data" };
    }
    if (!updateDataHex.every(hex => typeof hex === 'string')) {
      console.error('Invalid price update data format:', updateDataHex);
      return { success: false, error: "Invalid price update data format" };
    }
    let priceUpdateData: Uint8Array[];
    try {
      priceUpdateData = updateDataHex.map(hex => hexToBytes(hex as `0x${string}`));
    } catch (error) {
      return { success: false, error: "Failed to process price update data" };
    }

    const priceUpdateHexArray = priceUpdateData.map(arr => `0x${Buffer.from(arr).toString('hex')}`) as readonly `0x${string}`[];
    
    // create batch item: approve usdc
    const approveData = encodeFunctionData({
      abi: erc20Abi,
      functionName: "approve",
      args: [market.poolAddress, collateralWei * BigInt(10)], // Approve 10x collateral to cover fees
    });
    console.log('[DEBUG] Approve data encoded:', approveData);

    // Create batch item: open position
    const openData = encodeFunctionData({
      abi: perpTradingAbi,
      functionName: "openPosition",
      args: [
        collateralWei,
        leverageWei,
        params.isLong,
        priceUpdateHexArray,
        expectedPriceWei,
        BigInt(500), // maxSlippageBps = 5%
      ] as [bigint, bigint, boolean, readonly `0x${string}`[], bigint, bigint],
    });
    console.log('[DEBUG] Open position data encoded:', openData);

    const items: BatchItem[] = [
      {
        to: params.usdcAddress,
        val: "0",
        d: new Uint8Array(Buffer.from(approveData.slice(2), 'hex')),
      },
      {
        to: market.tradingAddress,
        val: "0",
        d: new Uint8Array(Buffer.from(openData.slice(2), 'hex')),
      },
    ];

    // Add TP/SL setting if provided
    if (params.takeProfit || params.stopLoss) {
      const stopLossPrice = params.stopLoss ? parseUnits(params.stopLoss, 18) : BigInt(0);
      const takeProfitPrice = params.takeProfit ? parseUnits(params.takeProfit, 18) : BigInt(0);
      
      const setTPSLData = encodeFunctionData({
        abi: perpTradingAbi,
        functionName: "setStopLossAndTakeProfit",
        args: [stopLossPrice, takeProfitPrice] as [bigint, bigint],
      });

      items.push({
        to: market.tradingAddress,
        val: "0",
        d: new Uint8Array(Buffer.from(setTPSLData.slice(2), 'hex')),
      });
    }

    // Generate nonce
    const nonce = Math.floor(Date.now() / 1000);
    console.log('[DEBUG] Generated nonce:', nonce);

    // Sign the batch
    const signature = await signBatchInstantExecute({
      channelAddress: params.channelAddress,
      items: items.map(item => ({
        target: item.to as `0x${string}`,
        value: item.val,
        data: `0x${Buffer.from(item.d).toString('hex')}` as `0x${string}`,
      })),
      nonce,
      chainId: 421614,
    });
    console.log('[DEBUG] Signature generated:', signature ? 'Success' : 'Failed');

    if (!signature) {
      console.log('[DEBUG] Failed to sign batch transaction');
      return { success: false, error: "Failed to sign batch transaction" };
    }

    // Create WebSocket client
    const client = new SessionRelayerClient(relayerUrl);

    // Set up callbacks
    let result: OpenPositionResult = { success: false, error: "Timeout" };

    client.setCallbacks({
      onBatchInstantExecuteResponse: (response) => {
        console.log("Batch instant execute response:", response);
      },
      onBatchInstantExecuteProgress: (progress) => {
        console.log("Batch instant execute progress:", progress);
      },
      onBatchInstantExecuteError: (error) => {
        console.error("Batch instant execute error:", error);
        result = { success: false, error: error.detail };
        if (params.onError) {
          params.onError(error);
        }
        client.disconnect();
      },
      onBatchInstantExecuteResult: (res) => {
        console.log("Batch instant execute result:", res);
        if ((res as any).status === 'submitted') {
          params.onSubmitted?.();
        } else if ((res as any).status === 'success') {
          params.onSuccess?.();
          client.disconnect();
        }
        if ((res as any).status === 'success' && res.txHash) {
          result = { success: true, txHash: res.txHash };
        } else if (res.txHash && (res as any).status === 'submitted') {
          result = { success: true, txHash: res.txHash };
        } else {
          result = { success: false, error: "Transaction failed" };
          client.disconnect();
        }
      },
      onConnectionError: (error) => {
        result = { success: false, error: "Failed to connect to relayer" };
      },
    });

    // Connect and send
    await client.connect();
    console.log('[DEBUG] Connected to relayer');

    const batchData: SignedBatchInstantExecute = {
      v: "1.0",
      t: "batch_instant_execute",
      c: params.channelAddress,
      items: items.map(item => ({
        to: item.to,
        val: item.val,
        d: item.d,
      })),
      n: nonce,
      s: signatureToBinary(signature),
      e: Math.floor(Date.now() / 1000) + 300,
      cid: 421614,
      via_agent: params.viaAgent, // Pass through agent flag
    };
    console.log('[DEBUG] Batch data prepared:', { ...batchData, s: 'redacted', d: 'redacted' }); // Redact sensitive data

    await client.sendBatchInstantExecute(batchData);
    console.log('[DEBUG] Batch sent to relayer');

    // Wait for result
    await new Promise(resolve => setTimeout(resolve, 30000));

    return result;

  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export interface PlaceLimitOrderParams {
  marketId: string;
  collateral: string; // USDC amount as string
  size: string; // Asset amount in wei (18 decimals)
  isLong: boolean;
  triggerPrice: string; // Trigger price in wei (18 decimals)
  attachedStopLoss?: string; // Optional SL price
  attachedTakeProfit?: string; // Optional TP price
  expiryTime: number; // Unix timestamp
  maxAcceptableLeverage: string; // Max leverage as string (e.g. "50")
  usdcAddress: `0x${string}`;
  viaAgent?: boolean; // Optional: true if executed by AI agent
  channelAddress: `0x${string}`;
  onSubmitted?: () => void;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export interface PlaceLimitOrderResult {
  success: boolean;
  orderId?: string;
  txHash?: string;
  error?: string;
}

export async function placeLimitOrder(
  params: PlaceLimitOrderParams,
  walletClient: WalletClient,
  relayerUrl: string = DEFAULT_RELAYER_URL
): Promise<PlaceLimitOrderResult> {
  console.log('[DEBUG] placeLimitOrder called with params:', params);
  try {
    const market = await getPerpsMarketById(params.marketId);
    console.log('[DEBUG] Market retrieved:', market);
    if (!market) {
      console.log('[DEBUG] Market not found for ID:', params.marketId);
      return { success: false, error: "Market not found" };
    }

    if (!market.limitOrderBookAddress) {
      return { success: false, error: "Limit order book not available for this market" };
    }

    if (!walletClient) {
      console.log('[DEBUG] No wallet connected');
      return { success: false, error: "No wallet connected" };
    }

    const collateralWei = parseUnits(params.collateral, 6); // USDC has 6 decimals
    const sizeWei = BigInt(params.size); // Should now be a proper decimal string
    const triggerPriceWei = BigInt(params.triggerPrice); // Should now be a proper decimal string
    const maxLeverageWei = parseUnits(params.maxAcceptableLeverage, 18); // Leverage with 18 decimals
    const attachedStopLoss = params.attachedStopLoss ? BigInt(params.attachedStopLoss) : BigInt(0);
    const attachedTakeProfit = params.attachedTakeProfit ? BigInt(params.attachedTakeProfit) : BigInt(0);

    // create batch item: approve usdc
    const approveData = encodeFunctionData({
      abi: erc20Abi,
      functionName: "approve",
      args: [market.limitOrderBookAddress, collateralWei * BigInt(10)], // Approve 10x collateral to cover fees
    });
    console.log('[DEBUG] Approve data encoded:', approveData);

    // Create batch item: create limit order
    const limitOrderData = encodeFunctionData({
      abi: [{
        inputs: [
          { internalType: "uint256", name: "collateral", type: "uint256" },
          { internalType: "uint256", name: "size", type: "uint256" },
          { internalType: "bool", name: "isLong", type: "bool" },
          { internalType: "uint256", name: "triggerPrice", type: "uint256" },
          { internalType: "uint256", name: "attachedStopLoss", type: "uint256" },
          { internalType: "uint256", name: "attachedTakeProfit", type: "uint256" },
          { internalType: "uint256", name: "expiryTime", type: "uint256" },
          { internalType: "uint256", name: "maxAcceptableLeverage", type: "uint256" }
        ],
        name: "createLimitOrder",
        outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
        stateMutability: "nonpayable",
        type: "function"
      }],
      functionName: "createLimitOrder",
      args: [
        collateralWei,
        sizeWei,
        params.isLong,
        triggerPriceWei,
        attachedStopLoss,
        attachedTakeProfit,
        BigInt(params.expiryTime),
        maxLeverageWei
      ] as [bigint, bigint, boolean, bigint, bigint, bigint, bigint, bigint],
    });
    console.log('[DEBUG] Create limit order data encoded:', limitOrderData);

    const items = [
      {
        target: params.usdcAddress,
        value: "0",
        data: approveData,
      },
      {
        target: market.limitOrderBookAddress,
        value: "0",
        data: limitOrderData,
      },
    ];

    // Generate nonce
    const nonce = Math.floor(Date.now() / 1000);
    console.log('[DEBUG] Generated nonce:', nonce);

    // Sign the batch
    const signature = await signBatchInstantExecute({
      channelAddress: params.channelAddress,
      items: items.map(item => ({
        target: item.target as `0x${string}`,
        value: item.value,
        data: item.data as `0x${string}`,
      })),
      nonce,
      chainId: 421614,
    });
    console.log('[DEBUG] Signature generated:', signature ? 'Success' : 'Failed');

    if (!signature) {
      console.log('[DEBUG] Failed to sign batch transaction');
      return { success: false, error: "Failed to sign batch transaction" };
    }

    // Create WebSocket client
    const client = new SessionRelayerClient(relayerUrl);

    // Set up callbacks
    let result: PlaceLimitOrderResult = { success: false, error: "Timeout" };

    client.setCallbacks({
      onBatchInstantExecuteResponse: (response) => {
        console.log("Batch instant execute response:", response);
      },
      onBatchInstantExecuteProgress: (progress) => {
        console.log("Batch instant execute progress:", progress);
      },
      onBatchInstantExecuteError: (error) => {
        console.error("Batch instant execute error:", error);
        result = { success: false, error: error.detail };
        if (params.onError) {
          params.onError(error);
        }
        client.disconnect();
      },
      onBatchInstantExecuteResult: (res) => {
        console.log("Batch instant execute result:", res);
        if ((res as any).status === 'submitted') {
          params.onSubmitted?.();
        } else if ((res as any).status === 'success') {
          params.onSuccess?.();
          client.disconnect();
        }
        if ((res as any).status === 'success' && res.txHash) {
          result = { success: true, txHash: res.txHash };
        } else if (res.txHash && (res as any).status === 'submitted') {
          result = { success: true, txHash: res.txHash };
        } else {
          result = { success: false, error: "Transaction failed" };
          client.disconnect();
        }
      },
      onConnectionError: (error) => {
        result = { success: false, error: "Failed to connect to relayer" };
      },
    });

    // Connect and send
    await client.connect();
    console.log('[DEBUG] Connected to relayer');

    const batchData: SignedBatchInstantExecute = {
      v: "1.0",
      t: "batch_instant_execute",
      c: params.channelAddress,
      items: items.map(item => ({
        to: item.target,
        val: item.value,
        d: new Uint8Array(Buffer.from(item.data.slice(2), 'hex')),
      })),
      n: nonce,
      s: signatureToBinary(signature),
      e: Math.floor(Date.now() / 1000) + 300,
      cid: 421614,
      via_agent: params.viaAgent, // Pass through agent flag for limit orders
    };
    console.log('[DEBUG] Batch data prepared:', { ...batchData, s: 'redacted', d: 'redacted' });

    await client.sendBatchInstantExecute(batchData);
    console.log('[DEBUG] Batch sent to relayer');

    // Wait for result
    await new Promise(resolve => setTimeout(resolve, 30000));

    return result;

  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export interface CancelOrderParams {
  marketId: string;
  orderId: string;
  channelAddress: `0x${string}`;
  onSubmitted?: () => void;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export interface CancelOrderResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export async function cancelOrder(
  params: CancelOrderParams,
  walletClient: WalletClient,
  relayerUrl: string = DEFAULT_RELAYER_URL
): Promise<CancelOrderResult> {
  console.log('[DEBUG] cancelOrder called with params:', params);
  try {
    const market = await getPerpsMarketById(params.marketId);
    if (!market || !market.limitOrderBookAddress) {
      return { success: false, error: "Market or limit order book not found" };
    }

    if (!walletClient) {
      return { success: false, error: "No wallet connected" };
    }

    // Create batch item: cancel limit order
    const cancelData = encodeFunctionData({
      abi: limitOrderBookAbi,
      functionName: "cancelLimitOrder",
      args: [params.orderId as `0x${string}`],
    });

    const items = [
      {
        target: market.limitOrderBookAddress,
        value: "0",
        data: cancelData,
      },
    ];

    // Generate nonce
    const nonce = Math.floor(Date.now() / 1000);

    // Sign the batch
    const signature = await signBatchInstantExecute({
      channelAddress: params.channelAddress,
      items: items.map(item => ({
        target: item.target as `0x${string}`,
        value: item.value,
        data: item.data as `0x${string}`,
      })),
      nonce,
      chainId: 421614,
    });

    if (!signature) {
      return { success: false, error: "Failed to sign batch transaction" };
    }

    // Create WebSocket client
    const client = new SessionRelayerClient(relayerUrl);

    // Set up callbacks
    let result: CancelOrderResult = { success: false, error: "Timeout" };

    client.setCallbacks({
      onBatchInstantExecuteResponse: (response) => {
        console.log("Cancel order response:", response);
      },
      onBatchInstantExecuteProgress: (progress) => {
        console.log("Cancel order progress:", progress);
      },
      onBatchInstantExecuteError: (error) => {
        console.error("Cancel order error:", error);
        result = { success: false, error: error.detail };
        if (params.onError) {
          params.onError(error);
        }
        client.disconnect();
      },
      onBatchInstantExecuteResult: (res) => {
        console.log("Cancel order result:", res);
        if ((res as any).status === 'submitted') {
          params.onSubmitted?.();
        } else if ((res as any).status === 'success') {
          params.onSuccess?.();
          client.disconnect();
        }
        if ((res as any).status === 'success' && res.txHash) {
          result = { success: true, txHash: res.txHash };
        } else if (res.txHash && (res as any).status === 'submitted') {
          result = { success: true, txHash: res.txHash };
        } else {
          result = { success: false, error: "Transaction failed" };
          client.disconnect();
        }
      },
      onConnectionError: (error) => {
        result = { success: false, error: "Failed to connect to relayer" };
      },
    });

    // Connect and send
    await client.connect();
    console.log('[DEBUG] Connected to relayer for cancel order');

    const batchData: SignedBatchInstantExecute = {
      v: "1.0",
      t: "batch_instant_execute",
      c: params.channelAddress,
      items: items.map(item => ({
        to: item.target,
        val: item.value,
        d: new Uint8Array(Buffer.from(item.data.slice(2), 'hex')),
      })),
      n: nonce,
      s: signatureToBinary(signature),
      e: Math.floor(Date.now() / 1000) + 300,
      cid: 421614,
    };

    await client.sendBatchInstantExecute(batchData);
    console.log('[DEBUG] Cancel order batch sent');

    // Wait for result
    await new Promise(resolve => setTimeout(resolve, 30000));

    return result;

  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function closePerpsPosition(
  params: ClosePositionParams,
  walletClient: WalletClient,
  relayerUrl: string = DEFAULT_RELAYER_URL
): Promise<ClosePositionResult> {
  console.log('[DEBUG] closePerpsPosition called with params:', params);
    if (!walletClient) {
      console.log('[DEBUG] No wallet connected');
      return { success: false, error: "No wallet connected" };
    }

    const market = await getPerpsMarketById(params.marketId);
    console.log('[DEBUG] Market retrieved:', market);
    if (!market) {
      console.log('[DEBUG] Market not found for ID:', params.marketId);
      return { success: false, error: "Market not found" };
    }

    const expectedPriceWei = parseUnits(params.expectedPrice, 18); // Prices have 18 decimals in contract
    console.log('[DEBUG] Parsed values - expectedPriceWei:', expectedPriceWei.toString());

    // Get Pyth update data
    const updateDataHex = await getPythUpdateData([market.pythPriceId]);
    console.log('[DEBUG] Pyth update data received:', updateDataHex.length, 'items');
    if (updateDataHex.length === 0) {
      console.log('[DEBUG] No price update data received');
      return { success: false, error: "Failed to get price update data" };
    }
    if (!updateDataHex.every(hex => typeof hex === 'string')) {
      console.error('Invalid price update data format:', updateDataHex);
      return { success: false, error: "Invalid price update data format" };
    }
    let priceUpdateData: Uint8Array[];
    try {
      priceUpdateData = updateDataHex.map(hex => hexToBytes(hex as `0x${string}`));
    } catch (error) {
      return { success: false, error: "Failed to process price update data" };
    }

    // Convert each Uint8Array to hex string for the contract
    const priceUpdateHexArray = priceUpdateData.map(arr => `0x${Buffer.from(arr).toString('hex')}`) as readonly `0x${string}`[];
    
    // Create batch item: close position
    const closeData = encodeFunctionData({
      abi: perpTradingAbi,
      functionName: "closePosition",
      args: [
        priceUpdateHexArray,
        expectedPriceWei,
        BigInt(50), // maxSlippageBps = 0.5%
      ] as [readonly `0x${string}`[], bigint, bigint],
    });
    console.log('[DEBUG] Close position data encoded:', closeData);

    const items = [
      {
        target: market.tradingAddress,
        value: "0",
        data: closeData,
      },
    ];

    // Generate nonce
    const nonce = Math.floor(Date.now() / 1000);
    console.log('[DEBUG] Generated nonce:', nonce);

    // Sign the batch
    const signature = await signBatchInstantExecute({
      channelAddress: params.channelAddress,
      items: items.map(item => ({
        target: item.target as `0x${string}`,
        value: item.value,
        data: item.data as `0x${string}`,
      })),
      nonce,
      chainId: 421614,
    });
    console.log('[DEBUG] Signature generated:', signature ? 'Success' : 'Failed');

    if (!signature) {
      console.log('[DEBUG] Failed to sign batch transaction');
      return { success: false, error: "Failed to sign batch transaction" };
    }

    // Create WebSocket client
    const client = new SessionRelayerClient(relayerUrl);

    // Set up callbacks
    let result: ClosePositionResult = { success: false, error: "Timeout" };

    client.setCallbacks({
      onBatchInstantExecuteResponse: (response) => {
        console.log("Batch instant execute response:", response);
      },
      onBatchInstantExecuteProgress: (progress) => {
        console.log("Batch instant execute progress:", progress);
      },
      onBatchInstantExecuteError: (error) => {
        console.error("Batch instant execute error:", error);
        result = { success: false, error: error.detail };
        if (params.onError) {
          params.onError(error);
        }
        client.disconnect();
      },
      onBatchInstantExecuteResult: (res) => {
        console.log("Batch instant execute result:", res);
        if ((res as any).status === 'submitted') {
          params.onSubmitted?.();
        } else if ((res as any).status === 'success') {
          params.onSuccess?.();
          client.disconnect();
        }
        if ((res as any).status === 'success' && res.txHash) {
          result = { success: true, txHash: res.txHash };
        } else if (res.txHash && (res as any).status === 'submitted') {
          result = { success: true, txHash: res.txHash };
        } else {
          result = { success: false, error: "Transaction failed" };
          client.disconnect();
        }
      },
      onConnectionError: (error) => {
        result = { success: false, error: "Failed to connect to relayer" };
      },
    });

    // Connect and send
    await client.connect();
    console.log('[DEBUG] Connected to relayer');

    const batchData: SignedBatchInstantExecute = {
      v: "1.0",
      t: "batch_instant_execute",
      c: params.channelAddress,
      items: items.map(item => ({
        to: item.target,
        val: item.value,
        d: new Uint8Array(Buffer.from(item.data.slice(2), 'hex')),
      })),
      n: nonce,
      s: signatureToBinary(signature),
      e: Math.floor(Date.now() / 1000) + 300,
      cid: 421614,
    };
    console.log('[DEBUG] Batch data prepared:', { ...batchData, s: 'redacted', d: 'redacted' }); // Redact sensitive data

    await client.sendBatchInstantExecute(batchData);
    console.log('[DEBUG] Batch sent to relayer');

    // Wait for result
    await new Promise(resolve => setTimeout(resolve, 30000));

    return result;

}

export async function withdrawFromPerpsPool(
  params: WithdrawParams,
  walletClient: WalletClient,
  relayerUrl: string = DEFAULT_RELAYER_URL
): Promise<WithdrawResult> {
  console.log('[DEBUG] withdrawFromPerpsPool called with params:', params);
  try {
    const market = await getPerpsMarketById(params.marketId);
    console.log('[DEBUG] Market retrieved:', market);
    if (!market) {
      console.log('[DEBUG] Market not found for ID:', params.marketId);
      return { success: false, error: "Market not found" };
    }

    if (!walletClient) {
      console.log('[DEBUG] No wallet connected');
      return { success: false, error: "No wallet connected" };
    }

    const sharesWei = parseUnits(params.shares, 18); // LP tokens have 18 decimals
    console.log('[DEBUG] Shares in wei:', sharesWei.toString());

    // Create batch items: withdraw (USDC goes to channel)
    const withdrawData = encodeFunctionData({
      abi: liquidityPoolAbi,
      functionName: "withdraw",
      args: [sharesWei],
    });
    console.log('[DEBUG] Withdraw data encoded:', withdrawData);

    const items = [
      {
        target: market.poolAddress,
        value: "0",
        data: withdrawData,
      },
    ];

    // Generate nonce (simple timestamp-based for now)
    const nonce = Math.floor(Date.now() / 1000);
    console.log('[DEBUG] Generated nonce:', nonce);

    // Sign the batch
    const signature = await signBatchInstantExecute({
      channelAddress: params.channelAddress,
      items: items.map(item => ({
        target: item.target as `0x${string}`,
        value: item.value,
        data: item.data as `0x${string}`,
      })),
      nonce,
      chainId: 421614, // Arbitrum Sepolia
    });
    console.log('[DEBUG] Signature generated:', signature ? 'Success' : 'Failed');

    if (!signature) {
      console.log('[DEBUG] Failed to sign batch transaction');
      return { success: false, error: "Failed to sign batch transaction" };
    }

    // Create WebSocket client
    const client = new SessionRelayerClient(relayerUrl);

    // Set up callbacks
    let result: WithdrawResult = { success: false, error: "Timeout" };

    client.setCallbacks({
      onBatchInstantExecuteResponse: (response) => {
        console.log("Batch instant execute response:", response);
      },
      onBatchInstantExecuteProgress: (progress) => {
        console.log("Batch instant execute progress:", progress);
      },
      onBatchInstantExecuteError: (error) => {
        console.error("Batch instant execute error:", error);
        result = { success: false, error: error.detail };
        if (params.onError) {
          params.onError(error);
        }
        client.disconnect();
      },
      onBatchInstantExecuteResult: (res) => {
        console.log("Batch instant execute result:", res);
        // Handle different statuses
        try {
          if ((res as any).status === 'submitted') {
            window.dispatchEvent(new Event('brokerfi:channels:refresh'));
            // Call the onSubmitted callback to update UI (but don't close modal yet)
            params.onSubmitted?.();
            // DON'T disconnect here - wait for success confirmation
          } else if ((res as any).status === 'success') {
            window.dispatchEvent(new Event('brokerfi:channels:refresh'));
            // Call onSuccess callback to close modal and show toast
            params.onSuccess?.();
            // Now disconnect after success
            client.disconnect();
          }
        } catch (e) {}

        if ((res as any).status === 'success' && res.txHash) {
          result = { success: true, txHash: res.txHash };
        } else if (res.txHash && (res as any).status === 'submitted') {
          // For submitted status, don't set final result yet - wait for success
          result = { success: true, txHash: res.txHash };
        } else {
          result = { success: false, error: "Transaction failed" };
          client.disconnect();
        }
      },
      onConnectionError: (error) => {
        result = { success: false, error: "Failed to connect to relayer" };
      },
    });

    // Connect and send
    await client.connect();
    console.log('[DEBUG] Connected to relayer');

    const batchData: SignedBatchInstantExecute = {
      v: "1.0",
      t: "batch_instant_execute",
      c: params.channelAddress,
      items: items.map(item => ({
        to: item.target,
        val: item.value,
        d: new Uint8Array(Buffer.from(item.data.slice(2), 'hex')),
      })),
      n: nonce,
      s: signatureToBinary(signature),
      e: Math.floor(Date.now() / 1000) + 300, // 5 minutes expiry
      cid: 421614,
    };
    console.log('[DEBUG] Batch data prepared:', { ...batchData, s: 'redacted', d: 'redacted' }); // Redact sensitive data

    await client.sendBatchInstantExecute(batchData);
    console.log('[DEBUG] Batch sent to relayer');

    // Wait for result (simple timeout)
    await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds

    return result;

  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ...existing code...

export async function getMaxLeverageForPosition(
  marketId: string,
  userAddress: `0x${string}`,
  positionSize: bigint
): Promise<{ success: boolean; maxLeverage?: number; error?: string }> {
  try {
    const market = await getPerpsMarketById(marketId);
    if (!market) {
      return { success: false, error: "Market not found" };
    }

    // Call the trading contract's getMaxLeverage function
    const maxLeverage = await publicClient.readContract({
      address: market.tradingAddress,
      abi: perpTradingAbi,
      functionName: "getMaxLeverage",
      args: [userAddress, positionSize],
    }) as bigint;

    // Convert from contract return value (leverage in wei, divide by 1e18)
    const maxLeverageNumber = Number(maxLeverage) / 1e18;

    // Ensure we have a reasonable max leverage (fallback to 50 if contract returns 0 or invalid value)
    const finalMaxLeverage = maxLeverageNumber > 0 ? Math.min(maxLeverageNumber, 100) : 50;

    return { success: true, maxLeverage: finalMaxLeverage };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function estimateTradingFees(
  marketId: string,
  notionalSize: bigint,
  isLong: boolean
): Promise<{ success: boolean; tradingFee?: bigint; priceImpactFee?: bigint; totalFee?: bigint; error?: string }> {
  try {
    console.log('[estimateTradingFees] Called with:', { marketId, notionalSize: notionalSize.toString(), isLong });
    const market = await getPerpsMarketById(marketId);
    if (!market) {
      console.log('[estimateTradingFees] Market not found:', marketId);
      return { success: false, error: "Market not found" };
    }

    console.log('[estimateTradingFees] Market found:', { poolAddress: market.poolAddress, tradingAddress: market.tradingAddress });

    // Fetch current market state from trading contract
    const [totalLongsUsd, totalShortsUsd] = await publicClient.readContract({
      address: market.tradingAddress,
      abi: perpTradingExtendedAbi,
      functionName: "market",
      args: [],
    }) as [bigint, bigint];

    console.log('[estimateTradingFees] Market state:', { totalLongs: totalLongsUsd.toString(), totalShorts: totalShortsUsd.toString() });

    // Calculate trading fee
    const tradingFee = await publicClient.readContract({
      address: market.poolAddress,
      abi: liquidityPoolAbi,
      functionName: "calculateTradingFee",
      args: [notionalSize],
    }) as bigint;

    console.log('[estimateTradingFees] Trading fee:', tradingFee.toString());

    // Calculate price impact fee (returns tuple [fee, bps])
    const [priceImpactFee] = await publicClient.readContract({
      address: market.poolAddress,
      abi: liquidityPoolAbi,
      functionName: "calculatePriceImpactFee",
      args: [notionalSize, isLong, totalLongsUsd, totalShortsUsd],
    }) as [bigint, bigint];

    console.log('[estimateTradingFees] Price impact fee:', priceImpactFee.toString());

    const totalFee = tradingFee + priceImpactFee;

    console.log('[estimateTradingFees] Total fee:', totalFee.toString());

    return { success: true, tradingFee, priceImpactFee, totalFee };
  } catch (error) {
    console.error('[estimateTradingFees] Error:', error);
    return { success: false, error: String(error) };
  }
}