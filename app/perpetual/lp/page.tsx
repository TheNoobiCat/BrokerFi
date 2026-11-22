"use client";

export const dynamic = 'force-dynamic'


import { useState, useRef, useEffect } from "react";
import { useUI } from "@/store/UIContext";
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Marquee from 'react-fast-marquee';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import Portal from "@/components/ui/Portal";
import { getPerpsMarkets } from "@/services/perpsMarkets";
import { depositToPerpsPool, withdrawFromPerpsPool } from "@/services/perps";
import { useSession } from "@/store/SessionContext";
import { useAccount, useWalletClient } from "wagmi";
import Bridge from "@/components/onboarding/Onboarder";
import OnboardingBanner from "@/components/onboarding/OnboardingBanner";
import publicClient from "@/blockchain/publicClient";
import { formatUnits } from "viem";

interface LPPool {
  id: string;
  name: string;
  yield: number;
  tvl: number;
  performance: Array<{ time: string; value: number }>;
}

const categories = [
  { key: 'popular', label: 'Popular', color: 'text-yellow-400' },
  { key: 'highYield', label: 'High Yield', color: 'text-green-400' },
  { key: 'gainingTraction', label: 'Gaining Traction', color: 'text-pink-400' },
  { key: 'crypto', label: 'Crypto', color: 'text-blue-400' },
  { key: 'stocks', label: 'Stocks', color: 'text-purple-400' },
  { key: 'commodities', label: 'Commodities', color: 'text-orange-400' },
  { key: 'forex', label: 'Forex', color: 'text-cyan-400' }
];

// Marquee component
function PoolsMarquee({ allPools }: { allPools: LPPool[] }) {
  const marqueeItems = allPools.map(pool => ({
    name: pool.name.replace(' Pool', '').replace(' Index', '').replace(' Futures', '').replace(' Pair', ''),
    yield: pool.yield,
    tvl: pool.tvl
  }));

  return (
    <div className="w-full bg-linear-to-r from-primary/5 via-primary/10 to-primary/5 border-y border-primary/20 py-3 mb-8">
      <Marquee gradient={false} speed={40} className="overflow-hidden">
        <div className="flex items-center gap-8 px-4">
          {marqueeItems.map((pool, index) => (
            <div key={`${pool.name}-${index}`} className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
              <span className="font-semibold">{pool.name}</span>
              <span className="text-primary font-bold">{pool.yield.toFixed(1)}% APY</span>
              <span className="text-white/50">•</span>
              <span className="text-white/60">${(pool.tvl / 1000000).toFixed(1)}M TVL</span>
            </div>
          ))}
          {/* Duplicate for seamless loop */}
          {marqueeItems.slice(0, 5).map((pool, index) => (
            <div key={`${pool.name}-dup-${index}`} className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
              <span className="font-semibold">{pool.name}</span>
              <span className="text-primary font-bold">{pool.yield.toFixed(1)}% APY</span>
              <span className="text-white/50">•</span>
              <span className="text-white/60">${(pool.tvl / 1000000).toFixed(1)}M TVL</span>
            </div>
          ))}
        </div>
      </Marquee>
    </div>
  );
}

// Simple performance chart component
function PerformanceChart({ data, className }: { data: { time: string; value: number }[], className?: string }) {
  const isPositive = data[data.length - 1].value > data[0].value;
  const strokeColor = isPositive ? '#00d4aa' : '#ff4757';

  return (
    <div className={`w-full h-20 ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, fill: strokeColor }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(26, 27, 35, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '12px'
            }}
            formatter={(value: number | undefined) => value !== undefined ? [`${value.toFixed(1)}%`, 'Performance'] : ['', 'Performance']}
            labelFormatter={(label) => `Day ${label}`}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Deposit modal component
function DepositModal({ pool, isOpen, onClose, onRefreshPositions }: { 
  pool: LPPool; 
  isOpen: boolean; 
  onClose: () => void;
  onRefreshPositions?: () => void;
}) {
  const [depositAmount, setDepositAmount] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [lpTokenEstimate, setLpTokenEstimate] = useState<{ shares: string; value: string } | null>(null);
  const { channelAddress } = useSession();
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { showToast } = useUI();

  // Reset loading state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsConfirming(false);
      setLpTokenEstimate(null);
    }
  }, [isOpen]);

  // Calculate LP token estimate
  useEffect(() => {
    const calculateLpEstimate = async () => {
      if (!depositAmount || parseFloat(depositAmount) <= 0) {
        setLpTokenEstimate(null);
        return;
      }

      try {
        const markets = await getPerpsMarkets();
        const market = markets.find(m => m.id === pool.id);
        if (!market) return;

        // Read pool state
        const [totalLiquidity, lockedLiquidityQuote, totalSupply, quoteDecimals] = await Promise.all([
          publicClient.readContract({
            address: market.poolAddress,
            abi: [{ inputs: [], name: "totalLiquidity", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" }],
            functionName: "totalLiquidity",
          }).catch(() => BigInt(0)),
          publicClient.readContract({
            address: market.poolAddress,
            abi: [{ inputs: [], name: "lockedLiquidityQuote", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" }],
            functionName: "lockedLiquidityQuote",
          }).catch(() => BigInt(0)),
          publicClient.readContract({
            address: market.lpTokenAddress,
            abi: [{ inputs: [], name: "totalSupply", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" }],
            functionName: "totalSupply",
          }).catch(() => BigInt(0)),
          publicClient.readContract({
            address: market.poolAddress,
            abi: [{ inputs: [], name: "quoteDecimals", outputs: [{ type: "uint8" }], stateMutability: "view", type: "function" }],
            functionName: "quoteDecimals",
          }).catch(() => 6), // Default to 6 for USDC
        ]);

        const amountWei = parseFloat(depositAmount) * (10 ** 6); // USDC has 6 decimals
        const amountUsd = (amountWei * (10 ** 18)) / (10 ** (quoteDecimals as number)); // Convert to 1e18 USD
        const depositFee = 10; // 0.1%
        const fee = (amountUsd * depositFee) / 10000;
        const netReceived = amountUsd - fee;

        console.log('Deposit calculation:', {
          depositAmount,
          amountWei,
          amountUsd: amountUsd.toString(),
          fee: fee.toString(),
          netReceived: netReceived.toString(),
          totalLiquidity: (totalLiquidity as bigint).toString(),
          lockedLiquidityQuote: (lockedLiquidityQuote as bigint).toString(),
          totalSupply: (totalSupply as bigint).toString(),
          quoteDecimals
        });

        let shares: bigint;
        if ((totalSupply as bigint) === BigInt(0)) {
          shares = BigInt(Math.floor(netReceived));
          console.log('New pool shares:', shares.toString());
        } else {
          const availableAssets = (totalLiquidity as bigint) - (lockedLiquidityQuote as bigint);
          console.log('Existing pool availableAssets:', availableAssets.toString());
          if (availableAssets === BigInt(0)) {
            shares = BigInt(0);
          } else {
            shares = (BigInt(Math.floor(netReceived)) * (totalSupply as bigint)) / availableAssets;
            console.log('Calculated shares:', shares.toString());
          }
        }

        // Calculate USD value of LP tokens
        const lpTokenValue = (totalSupply as bigint) === BigInt(0) ? 
          BigInt(10 ** 18) : // 1 USD per token initially
          ((totalLiquidity as bigint) * BigInt(10 ** 18)) / (totalSupply as bigint);

        const value = (shares * lpTokenValue) / BigInt(10 ** 18);

        console.log('Final calculation:', {
          shares: shares.toString(),
          lpTokenValue: lpTokenValue.toString(),
          value: value.toString(),
          sharesFormatted: (Number(shares) / (10 ** 18)).toFixed(6),
          valueFormatted: (Number(value) / (10 ** 18)).toFixed(6)
        });

        setLpTokenEstimate({
          shares: (Number(shares) / (10 ** 18)).toFixed(6),
          value: (Number(value) / (10 ** 18)).toFixed(6),
        });
      } catch (error) {
        console.error('Error calculating LP estimate:', error);
        setLpTokenEstimate(null);
      }
    };

    calculateLpEstimate();
  }, [depositAmount, pool.id]);

  if (!isOpen) return null;

  const handleDeposit = async () => {
    if (!channelAddress || !walletClient || !address) {
      showToast('Please connect your wallet and create an InstantExecution channel first', 'error');
      onClose();
      return;
    }

    setIsConfirming(true);
    try {
      const result = await depositToPerpsPool(
        {
          marketId: pool.id,
          amount: depositAmount,
          channelAddress: channelAddress as `0x${string}`,
          usdcAddress: '0x4b1fACeF3553C0c7A67D6AB240394E9aad566c2d' as `0x${string}`, // From deployment
          onSubmitted: () => {
            // Relayer accepted the transaction - keep modal open as loading
            console.log('Transaction submitted to relayer');
          },
          onSuccess: () => {
            // Blockchain confirmed - close modal and show success toast instantly
            onClose();
            setDepositAmount('');
            showToast('Deposit successful! Your funds have been added to the LP pool.', 'success');
            // Refresh positions immediately
            onRefreshPositions?.();
          },
          onError: () => {
            showToast('Unknown Error', 'error');
            onClose();
          },
        },
        walletClient
      );

      if (result.success) {
        // Success - toast will be shown by relayer confirmation
        console.log('Deposit transaction submitted successfully');
      } else {
        showToast(`Deposit failed: ${result.error}`, 'error');
        onClose();
      }
    } catch (error) {
      showToast(`Deposit failed: ${error}`, 'error');
      onClose();
    } finally {
      setIsConfirming(false);
    }
  };

  const estimatedYield = parseFloat(depositAmount) * (pool.yield / 100) || 0;

  return (
    <Portal>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-surface border border-white/10 rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Deposit USDC</h3>
              <button
                onClick={onClose}
                className="text-white/60 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <FaTimes size={20} />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="bg-black/20 rounded-xl p-4 border border-white/5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white/70 text-sm">Pool</span>
                <span className="text-white font-semibold">{pool.name}</span>
              </div>
               <div className="flex justify-between items-center mb-2">
                 <span className="text-white/70 text-sm">APY</span>
                 <span className="text-primary font-bold">-</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-white/70 text-sm">TVL</span>
                 <span className="text-white">-</span>
               </div>
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-2">Deposit Amount (USDC)</label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white placeholder-white/50 focus:border-primary focus:outline-none transition-colors"
              />
            </div>

            {depositAmount && (
              <div className="space-y-3">
                {lpTokenEstimate && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white/70 text-sm">LP Tokens to Receive</span>
                      <span className="text-green-400 font-bold">{lpTokenEstimate.shares}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-sm">LP Token Value</span>
                      <span className="text-green-400 font-bold">${lpTokenEstimate.value}</span>
                    </div>
                  </div>
                )}
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/70 text-sm">Estimated Daily Yield</span>
                    <span className="text-primary font-bold">${estimatedYield.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleDeposit}
                disabled={!depositAmount || isConfirming}
                className={`w-full flex items-center justify-center gap-3 py-3 px-4 font-medium rounded-xl transition-all ${
                  (!depositAmount || isConfirming)
                    ? 'bg-glass-dark text-white/80 border border-white/10 hover:border-amber-400 hover:text-amber-400'
                    : 'bg-amber-400/10 text-amber-400 border border-amber-400/30'
                } disabled:bg-gray-600 disabled:cursor-not-allowed`}
              >
                {isConfirming ? (
                  <>
                    <div className="ml-2 animate-spin rounded-full h-6 w-6 border-b-2 border-white/90" />
                    <span className="text-white">Depositing...</span>
                  </>
                ) : (
                  'Deposit & Start Earning'
                )}
              </button>
              <p className="text-xs text-white/50 text-center">
                Your USDC will be deposited into the liquidity pool and start earning yield immediately.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}

// Pool card component
function PoolCard({ pool, onRefreshPositions }: { pool: LPPool; onRefreshPositions?: () => void }) {
  const [showDepositModal, setShowDepositModal] = useState(false);

  return (
    <>
      <div className="broker-card group hover:border-white/20 transition-all duration-300">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white group-hover:text-primary transition-colors">{pool.name}</h3>
            <p className="text-sm text-gray-400">-</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">-</div>
            <div className="text-sm text-gray-400">APY</div>
          </div>
        </div>

        <div className="text-center py-8 text-gray-400 text-sm">
          Graph not available
        </div>

        <button
          onClick={() => setShowDepositModal(true)}
          className="w-full bg-glass-dark text-white/80 border border-white/10 hover:border-amber-400 hover:text-amber-400 rounded-xl font-semibold py-4 px-6 transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl text-lg"
        >
          Deposit USDC
        </button>
      </div>

      <DepositModal
        pool={pool}
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onRefreshPositions={onRefreshPositions}
      />
    </>
  );
}

// User LP Positions component
function UserLPPositions({ externalRefreshTrigger }: { externalRefreshTrigger?: number }) {
  const [userPositions, setUserPositions] = useState<Array<{
    marketId: string;
    marketName: string;
    shares: string;
    value: string;
    tokenValue: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<any>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { address } = useAccount();
  const { channelAddress } = useSession();
  const { data: walletClient } = useWalletClient();
  const { showToast } = useUI();

  // Load user positions
  useEffect(() => {
    const loadUserPositions = async () => {
      if (!channelAddress) {
        setLoading(false);
        return;
      }

      try {
        const markets = await getPerpsMarkets();
        const positions = [];

        for (const market of markets) {
          try {
            // Read LP token balance
            const balance = await publicClient.readContract({
              address: market.lpTokenAddress,
              abi: [{
                inputs: [{ name: "account", type: "address" }],
                name: "balanceOf",
                outputs: [{ name: "", type: "uint256" }],
                stateMutability: "view",
                type: "function",
              }],
              functionName: "balanceOf",
              args: [channelAddress as `0x${string}`],
            });

            if (balance > BigInt(0)) {
              // Read LP token value
              const tokenValue = await publicClient.readContract({
                address: market.poolAddress,
                abi: [{
                  inputs: [],
                  name: "getLpTokenValue",
                  outputs: [{ name: "", type: "uint256" }],
                  stateMutability: "view",
                  type: "function",
                }],
                functionName: "getLpTokenValue",
                args: [],
              });

              const shares = formatUnits(balance, 18);
              const value = (Number(shares) * Number(formatUnits(tokenValue, 18))).toFixed(6);

              positions.push({
                marketId: market.id,
                marketName: market.displayName,
                shares,
                value,
                tokenValue: formatUnits(tokenValue, 18),
              });
            }
          } catch (error) {
            console.error(`Error loading position for ${market.id}:`, error);
          }
        }

        setUserPositions(positions);
      } catch (error) {
        console.error('Error loading user positions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserPositions();
  }, [channelAddress, refreshTrigger, externalRefreshTrigger]);

  const handleWithdraw = async () => {
    if (!channelAddress || !walletClient || !selectedPosition) {
      showToast('Please connect your wallet and create an InstantExecution channel first', 'error');
      setShowWithdrawModal(false);
      return;
    }

    setIsWithdrawing(true);
    try {
      const result = await withdrawFromPerpsPool(
        {
          marketId: selectedPosition.marketId,
          shares: withdrawAmount,
          channelAddress: channelAddress as `0x${string}`,
          onSubmitted: () => {
            console.log('Withdraw transaction submitted to relayer');
          },
          onSuccess: () => {
            setShowWithdrawModal(false);
            setWithdrawAmount('');
            setSelectedPosition(null);
            showToast('Withdrawal successful! Your LP shares have been burned and USDC has been sent to your InstantExecution channel.', 'success');
            // Refresh positions
            setRefreshTrigger(prev => prev + 1);
          },
          onError: () => {
            showToast('Unknown Error', 'error');
            setShowWithdrawModal(false);
          },
        },
        walletClient
      );

      if (result.success) {
        console.log('Withdraw transaction submitted successfully');
      } else {
        showToast(`Withdraw failed: ${result.error}`, 'error');
        setShowWithdrawModal(false);
      }
    } catch (error) {
      showToast(`Withdraw failed: ${error}`, 'error');
      setShowWithdrawModal(false);
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (!channelAddress) {
    return (
      <div className="bg-surface border border-white/10 rounded-2xl p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Your LP Positions</h2>
        <p className="text-white/70">Connect your wallet and create an InstantExecution channel to view your LP positions.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-surface border border-white/10 rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-white/70">Loading your LP positions...</span>
        </div>
      </div>
    );
  }

  if (userPositions.length === 0) {
    return (
      <div className="bg-surface border border-white/10 rounded-2xl p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Your LP Positions</h2>
        <p className="text-white/70">You don't have any LP positions yet. Connect your wallet, create an InstantExecution channel, and deposit USDC into a pool below to start earning yield.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-surface border border-white/10 rounded-2xl p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Your LP Positions</h2>
        <div className="space-y-4">
          {userPositions.map((position) => (
            <div key={position.marketId} className="bg-black/20 rounded-xl p-4 border border-white/5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{position.marketName} LP</h3>
                  <p className="text-sm text-white/60">Liquidity Pool Shares</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-primary">${position.value}</div>
                  <div className="text-sm text-white/60">Total Value</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm text-white/60">LP Shares</div>
                  <div className="text-lg font-semibold text-white">{Number(position.shares).toFixed(6)}</div>
                </div>
                <div>
                  <div className="text-sm text-white/60">Share Value</div>
                  <div className="text-lg font-semibold text-white">${Number(position.tokenValue).toFixed(6)}</div>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedPosition(position);
                  setWithdrawAmount(position.shares);
                  setShowWithdrawModal(true);
                  setIsWithdrawing(false); // Reset withdrawing state when opening modal
                }}
                className="w-full bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 rounded-xl font-semibold py-3 px-4 transition-all duration-200"
              >
                Withdraw LP Shares
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && selectedPosition && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface border border-white/10 rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Withdraw LP Shares</h3>
                  <button
                    onClick={() => setShowWithdrawModal(false)}
                    className="text-white/60 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <FaTimes size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white/70 text-sm">Pool</span>
                    <span className="text-white font-semibold">{selectedPosition.marketName} LP</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white/70 text-sm">Your Shares</span>
                    <span className="text-white font-semibold">{Number(selectedPosition.shares).toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70 text-sm">Total Value</span>
                    <span className="text-primary font-bold">${selectedPosition.value}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-2">Shares to Withdraw</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Enter shares amount"
                    max={selectedPosition.shares}
                    step="0.000001"
                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white placeholder-white/50 focus:border-red-400 focus:outline-none transition-colors"
                  />
                </div>

                {withdrawAmount && Number(withdrawAmount) > 0 && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-sm">Estimated USDC Received</span>
                      <span className="text-red-400 font-bold">
                        ${(Number(withdrawAmount) * Number(selectedPosition.tokenValue)).toFixed(6)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    onClick={handleWithdraw}
                    disabled={!withdrawAmount || Number(withdrawAmount) <= 0 || Number(withdrawAmount) > Number(selectedPosition.shares) || isWithdrawing}
                    className={`w-full flex items-center justify-center gap-3 py-3 px-4 font-medium rounded-xl transition-all ${
                      (!withdrawAmount || Number(withdrawAmount) <= 0 || Number(withdrawAmount) > Number(selectedPosition.shares) || isWithdrawing)
                        ? 'bg-glass-dark text-white/80 border border-white/10'
                        : 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                    } disabled:bg-gray-600 disabled:cursor-not-allowed`}
                  >
                    {isWithdrawing ? (
                      <>
                        <div className="ml-2 animate-spin rounded-full h-6 w-6 border-b-2 border-white/90" />
                        <span className="text-white">Withdrawing...</span>
                      </>
                    ) : (
                      'Withdraw Shares'
                    )}
                  </button>
                  <p className="text-xs text-white/50 text-center">
                    Your LP shares will be burned and you'll receive USDC back to your wallet.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}

export default function PerpetualLPPools() {
  const [lpPools, setLpPools] = useState<Record<string, LPPool[]>>({
    popular: [],
    highYield: [],
    gainingTraction: [],
    crypto: [],
    stocks: [],
    commodities: [],
    forex: []
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const onRefreshPositions = () => setRefreshTrigger(prev => prev + 1);

  // Load markets data
  useEffect(() => {
    const loadMarkets = async () => {
      try {
        const markets = await getPerpsMarkets();
        const pools: LPPool[] = markets.map(market => ({
          id: market.id,
          name: `${market.displayName} Pool`,
          yield: market.yield,
          tvl: market.tvl,
          performance: market.performance
        }));

        // Categorize pools
        const popular = pools.filter(p => ['btc-perp', 'eth-perp'].includes(p.id));
        const highYield = pools.filter(p => p.yield > 14);
        const crypto = pools.filter(p => p.id.includes('perp'));

        setLpPools({
          popular,
          highYield,
          crypto
        });
      } catch (error) {
        console.error('Failed to load markets:', error);
      }
    };

    loadMarkets();
  }, []);

  const { setGlobalLoading, showOnboarding, depositOptionsOpen, setShowOnboarding, showToast } = useUI();
  const { isConnected: sessionConnected } = useSession();
  const { isConnected } = useAccount();
  const [searchTerm, setSearchTerm] = useState('');
  const popularScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Event listener removed - success handled directly via onSuccess callback
  }, [showToast]);

  // Set global loading to false since this page loads immediately
  useEffect(() => {
    setGlobalLoading(false);
  }, [setGlobalLoading]);

  const scrollLeft = () => {
    if (popularScrollRef.current) {
      popularScrollRef.current.scrollBy({ left: -400, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (popularScrollRef.current) {
      popularScrollRef.current.scrollBy({ left: 400, behavior: "smooth" });
    }
  };

  const allPools = Object.values(lpPools).flat();
  const filteredCategories = categories.map(category => ({
    ...category,
    pools: (lpPools[category.key] || []).filter(pool =>
      pool.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.pools.length > 0);

  return (
    <div className="h-screen bg-linear-to-b from-dark to-darker flex flex-col overflow-hidden">
        {/* Fixed Header Section */}
        <div className="shrink-0">
          {!sessionConnected && (
            <OnboardingBanner onStartOnboarding={() => setShowOnboarding(true)} />
          )}
          <PoolsMarquee allPools={allPools} />
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-12 text-center">
              <h1 className="text-5xl font-bold mb-4 bg-linear-to-r from-white via-primary to-white bg-clip-text text-transparent">
                Perpetual LP Pools
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-8">
                Earn competitive yields by providing liquidity to perpetual futures markets.
                Deposit USDC and start earning immediately with our automated yield farming protocol.
              </p>

              {/* Search Bar */}
              <div className="max-w-md mx-auto">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search pools..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 bg-surface/50 border border-white/10 rounded-lg text-white placeholder-white/50 focus:border-primary focus:outline-none transition-colors"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40">
                    🔍
                  </div>
                </div>
              </div>
            </div>

            {/* User LP Positions */}
            <UserLPPositions externalRefreshTrigger={refreshTrigger} />

            {filteredCategories.map((category) => (
              <section key={category.key} className="mb-12">
                <div className="flex items-center mb-6">
                  <h2 className={`text-2xl font-bold ${category.color}`}>{category.label}</h2>
                  <div className={`ml-4 h-px bg-linear-to-r from-current to-transparent flex-1 opacity-30`}></div>
                </div>

                {category.key === 'popular' ? (
                  // Horizontal scrollable Popular section
                  <div className="relative">
                    <button
                      onClick={scrollLeft}
                      className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all shadow-lg hover:shadow-xl"
                    >
                      <FaChevronLeft size={20} />
                    </button>
                    <div
                      ref={popularScrollRef}
                      className="flex gap-6 overflow-x-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent pb-4 px-12"
                    >
                      {category.pools.map((pool) => (
                        <div key={pool.id} className="shrink-0 w-80">
                          <PoolCard pool={pool} onRefreshPositions={onRefreshPositions} />
                        </div>
                      ))}
                      {/* Add some extra space to make it go off screen */}
                      <div className="shrink-0 w-8"></div>
                      <div className="shrink-0 w-8"></div>
                      <div className="shrink-0 w-8"></div>
                    </div>
                    <button
                      onClick={scrollRight}
                      className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all shadow-lg hover:shadow-xl"
                    >
                      <FaChevronRight size={20} />
                    </button>
                    {/* Gradient fade on the right */}
                    <div className="absolute right-12 top-0 bottom-4 w-20 bg-linear-to-l from-dark to-transparent pointer-events-none"></div>
                  </div>
                ) : (
                  // Regular grid for other categories
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {category.pools.map((pool) => (
                      <PoolCard key={pool.id} pool={pool} onRefreshPositions={onRefreshPositions} />
                    ))}
                  </div>
                )}
              </section>
            ))}
            {isConnected && (showOnboarding || depositOptionsOpen) && (
              <Bridge
                isOpen={showOnboarding || depositOptionsOpen}
                onClose={() => {
                  setShowOnboarding(false);
                  // depositOptionsOpen will be handled by the UI context
                }}
              />
            )}
          </div>
        </div>
      </div>
  );
}