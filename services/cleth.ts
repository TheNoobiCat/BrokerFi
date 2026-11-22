// CLETH service — buy/sell on bonding curve + staking for trading fee discounts
// All transactions go through instant execution channel

import { encodeFunctionData, parseUnits, formatUnits } from "viem";
import { SessionRelayerClient, type SignedBatchInstantExecute, signatureToBinary } from "./sessionRelayer";
import { signBatchInstantExecute } from "./keyVault";
import { clethAbi, clethStakingAbi, erc20Abi } from "@/blockchain/optionsAbis";
import { getContractsConfig } from "./contractsConfig";
import publicClient from "@/blockchain/publicClient";

const CHAIN_ID = 421614;
const RELAYER_URL = process.env.NEXT_PUBLIC_RELAYER_WS_URL || "ws://localhost:4001/ws";

// ── Types ────────────────────────────────────────────────────────────────────

export interface CLETHInfo {
  currentPrice: bigint;
  totalSupply: bigint;
  userBalance: bigint;
  userStaked: bigint;
  discountBps: bigint;
  totalStaked: bigint;
}

export interface StakingTier {
  name: string;
  minStake: string;
  discountPercent: number;
}

export const STAKING_TIERS: StakingTier[] = [
  { name: "None", minStake: "0", discountPercent: 0 },
  { name: "Bronze", minStake: "1,000,000", discountPercent: 20 },
  { name: "Silver", minStake: "5,000,000", discountPercent: 40 },
  { name: "Gold", minStake: "10,000,000", discountPercent: 60 },
  { name: "Diamond", minStake: "25,000,000", discountPercent: 100 },
];

// ── Internal helper ──────────────────────────────────────────────────────────

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

  const signature = await signBatchInstantExecute({
    channelAddress,
    items,
    nonce,
    chainId: CHAIN_ID,
  });

  if (!signature) {
    return { success: false, error: "Failed to sign batch transaction" };
  }

  const client = new SessionRelayerClient(RELAYER_URL);
  let result: { success: boolean; txHash?: string; error?: string } = {
    success: false,
    error: "Timeout",
  };

  client.setCallbacks({
    onBatchInstantExecuteError: (error) => {
      result = { success: false, error: error.detail };
      callbacks?.onError?.(error);
      client.disconnect();
    },
    onBatchInstantExecuteResult: (res) => {
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
      } else if ((res as any).status !== "submitted" && (res as any).status !== "validated" && (res as any).status !== "queued") {
        result = { success: false, error: "Transaction failed" };
        client.disconnect();
      }
    },
    onConnectionError: () => {
      result = { success: false, error: "Failed to connect to relayer" };
    },
  });

  await client.connect();

  const batchData: SignedBatchInstantExecute = {
    v: "1.0",
    t: "batch_instant_execute",
    c: channelAddress,
    items: items.map((item) => ({
      to: item.target,
      val: item.value,
      d: new Uint8Array(Buffer.from(item.data.slice(2), "hex")),
    })),
    n: nonce,
    s: signatureToBinary(signature),
    e: Math.floor(Date.now() / 1000) + 300,
    cid: CHAIN_ID,
  };

  await client.sendBatchInstantExecute(batchData);
  await new Promise((resolve) => setTimeout(resolve, 30000));
  return result;
}

// ── Read-only ────────────────────────────────────────────────────────────────

/**
 * Fetch all CLETH-related info for a user's channel.
 */
export async function getCLETHInfo(
  channelAddress?: `0x${string}`,
): Promise<CLETHInfo | null> {
  try {
    const config = await getContractsConfig();
    const account = channelAddress ?? "0x0000000000000000000000000000000000000000" as `0x${string}`;

    const [currentPrice, totalSupply, userBalance, userStaked, discountBps, totalStaked] =
      await Promise.all([
        publicClient.readContract({
          address: config.tokens.cleth,
          abi: clethAbi,
          functionName: "currentPrice",
        }) as Promise<bigint>,
        publicClient.readContract({
          address: config.tokens.cleth,
          abi: clethAbi,
          functionName: "totalSupply",
        }) as Promise<bigint>,
        publicClient.readContract({
          address: config.tokens.cleth,
          abi: clethAbi,
          functionName: "balanceOf",
          args: [account],
        }) as Promise<bigint>,
        publicClient.readContract({
          address: config.staking.clethStakingDiscount,
          abi: clethStakingAbi,
          functionName: "stakedBalance",
          args: [account],
        }) as Promise<bigint>,
        publicClient.readContract({
          address: config.staking.clethStakingDiscount,
          abi: clethStakingAbi,
          functionName: "getDiscountBps",
          args: [account],
        }) as Promise<bigint>,
        publicClient.readContract({
          address: config.staking.clethStakingDiscount,
          abi: clethStakingAbi,
          functionName: "totalStaked",
        }) as Promise<bigint>,
      ]);

    return { currentPrice, totalSupply, userBalance, userStaked, discountBps, totalStaked };
  } catch (error) {
    console.error("[CLETH] Failed to get info:", error);
    return null;
  }
}

/**
 * Estimate CLETH tokens received for a given USDC amount.
 * Uses local approximation: tokens ≈ usdcAmount / currentPrice
 * (The contract's _calculateTokensForUsdc is internal, not callable externally.)
 */
export async function estimateBuyReturn(usdcAmount: string): Promise<bigint | null> {
  try {
    const config = await getContractsConfig();
    const amountWei = parseUnits(usdcAmount, 6); // USDC 6 decimals
    const currentPrice = (await publicClient.readContract({
      address: config.tokens.cleth,
      abi: clethAbi,
      functionName: "currentPrice",
    })) as bigint;

    if (currentPrice === 0n) return null;

    // Approximate: cost_usdc ≈ amount_token_wei * price / 1e18
    // So: tokens ≈ usdcAmount * 1e18 / price
    const tokensEstimate = (amountWei * BigInt(1e18)) / currentPrice;
    return tokensEstimate > 0n ? tokensEstimate : null;
  } catch {
    return null;
  }
}

/**
 * Get the estimated USDC received for selling a given CLETH amount.
 * Calls the contract's getSellReturnEstimate(tokenAmount).
 */
export async function estimateSellReturn(clethAmount: string): Promise<bigint | null> {
  try {
    const config = await getContractsConfig();
    const amountWei = parseUnits(clethAmount, 18);
    return (await publicClient.readContract({
      address: config.tokens.cleth,
      abi: clethAbi,
      functionName: "getSellReturnEstimate",
      args: [amountWei],
    })) as bigint;
  } catch {
    return null;
  }
}

// ── Transactions ─────────────────────────────────────────────────────────────

export interface CLETHTxParams {
  channelAddress: `0x${string}`;
  amount: string;
  onSubmitted?: () => void;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

/**
 * Buy CLETH with USDC via bonding curve.
 * Batch: [approve USDC → CLETH contract, buy(usdcAmount)]
 */
export async function buyCLETH(params: CLETHTxParams) {
  const config = await getContractsConfig();
  const amountWei = parseUnits(params.amount, 6);

  const approveData = encodeFunctionData({
    abi: erc20Abi,
    functionName: "approve",
    args: [config.tokens.cleth, amountWei],
  });

  const buyData = encodeFunctionData({
    abi: clethAbi,
    functionName: "buy",
    args: [amountWei],
  });

  return sendBatchViaRelayer(
    params.channelAddress,
    [
      { target: config.external.usdc, value: "0", data: approveData },
      { target: config.tokens.cleth, value: "0", data: buyData },
    ],
    params,
  );
}

/**
 * Sell CLETH back to bonding curve for USDC.
 */
export async function sellCLETH(params: CLETHTxParams) {
  const config = await getContractsConfig();
  const amountWei = parseUnits(params.amount, 18);

  const sellData = encodeFunctionData({
    abi: clethAbi,
    functionName: "sell",
    args: [amountWei],
  });

  return sendBatchViaRelayer(
    params.channelAddress,
    [
      { target: config.tokens.cleth, value: "0", data: sellData },
    ],
    params,
  );
}

/**
 * Stake CLETH for trading fee discounts.
 * Batch: [approve CLETH → staking contract, stake(amount)]
 */
export async function stakeCLETH(params: CLETHTxParams) {
  const config = await getContractsConfig();
  const amountWei = parseUnits(params.amount, 18);

  const approveData = encodeFunctionData({
    abi: clethAbi,
    functionName: "approve",
    args: [config.staking.clethStakingDiscount, amountWei],
  });

  const stakeData = encodeFunctionData({
    abi: clethStakingAbi,
    functionName: "stake",
    args: [amountWei],
  });

  return sendBatchViaRelayer(
    params.channelAddress,
    [
      { target: config.tokens.cleth, value: "0", data: approveData },
      { target: config.staking.clethStakingDiscount, value: "0", data: stakeData },
    ],
    params,
  );
}

/**
 * Unstake CLETH.
 */
export async function unstakeCLETH(params: CLETHTxParams) {
  const config = await getContractsConfig();
  const amountWei = parseUnits(params.amount, 18);

  const unstakeData = encodeFunctionData({
    abi: clethStakingAbi,
    functionName: "unstake",
    args: [amountWei],
  });

  return sendBatchViaRelayer(
    params.channelAddress,
    [
      { target: config.staking.clethStakingDiscount, value: "0", data: unstakeData },
    ],
    params,
  );
}

/**
 * Unstake all CLETH.
 */
export async function unstakeAllCLETH(params: Omit<CLETHTxParams, "amount">) {
  const config = await getContractsConfig();

  const unstakeAllData = encodeFunctionData({
    abi: clethStakingAbi,
    functionName: "unstakeAll",
  });

  return sendBatchViaRelayer(
    (params as any).channelAddress,
    [
      { target: config.staking.clethStakingDiscount, value: "0", data: unstakeAllData },
    ],
    params,
  );
}

// ── Formatters ───────────────────────────────────────────────────────────────

export function formatCLETH(value: bigint): string {
  return formatUnits(value, 18);
}

export function formatUSDC(value: bigint): string {
  return formatUnits(value, 6);
}
