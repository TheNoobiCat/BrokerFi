"use client";

import { useState, useEffect } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { useTradingContext } from "@/store/TradingContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Link from "next/link";
import OnboardingBanner from "@/components/onboarding/OnboardingBanner";
import Bridge from "@/components/onboarding/Onboarder";
import FaucetButton from "@/components/FaucetButton";
import { useUI } from "@/store/UIContext";
import { useSession } from "@/store/SessionContext";
import { getChannelList } from "@/services/channel";
import { ConnectButton } from "@/components/ui/ConnectButton";
import UnifiedPositionsTable from "@/components/trading/UnifiedPositionsTable";

export default function HomePage() {
  const { isConnected } = useAccount();
  const { channelAddress } = useSession();
  const { openDepositOptions, depositOptionsOpen, showOnboarding, setShowOnboarding, setGlobalLoading } = useUI();
  const { isConnected: sessionConnected } = useSession();

  const isTestnet = process.env.NEXT_PUBLIC_TESTNET === 'true';

  // Set global loading based on connection status
  useEffect(() => {
    if (!isConnected) {
      setGlobalLoading(false);
    }
  }, [isConnected, setGlobalLoading]);

  // Set global loading based on connection status
  useEffect(() => {
    if (!isConnected) {
      setGlobalLoading(false);
    }
  }, [isConnected, setGlobalLoading]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
          <main className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-2xl mx-auto">
              {/* Hero Section */}
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-white mb-4">
                  Sign In to BrokerFi
                </h1>
                <p className="text-white/60 text-lg">
                  Start trading Options and Perpetual Futures instantly.
                </p>
              </div>

              {/* Sign In Button */}
              <div className="text-center mb-12">
                <div className="inline-block">
                  <ConnectButton label="Sign In" />
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                <div className="p-6 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                  <h4 className="text-white font-semibold text-xl mb-2">
                    Options Trading
                  </h4>
                  <p className="text-white/60 text-sm">
                    The best platform for options trading without limits
                  </p>
                </div>
                <div className="p-6 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                  <h4 className="text-white font-semibold text-xl mb-2">
                    Perpetual Futures
                  </h4>
                  <p className="text-white/60 text-sm">
                    Trade perpetual contracts with up to 50x leverage
                  </p>
                </div>
                <div className="p-6 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                  <h4 className="text-white font-semibold text-xl mb-2">
                    AI Agent Trading
                  </h4>
                  <p className="text-white/60 text-sm">
                    Let AI agents execute trades based on your strategy
                  </p>
                </div>
                <div className="p-6 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                  <h4 className="text-white font-semibold text-xl mb-2">
                    Liquidity Provision
                  </h4>
                  <p className="text-white/60 text-sm">
                    Earn yields by providing liquidity to markets
                  </p>
                </div>
              </div>

              {/* Screenshots Carousel */}
              <div className="relative w-screen overflow-visible -mx-6 flex justify-center">
                <div className="flex gap-8 pb-4 flex-col lg:flex-row">
                  <div className="flex-shrink-0 w-150 md:w-250 h-100 rounded-lg overflow-hidden border border-white/10 shadow-lg">
                    <img
                      src="/screenshots/perps.png"
                      alt="Perpetuals Trading"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-shrink-0 w-150 md:w-250 h-100 rounded-lg overflow-hidden border border-white/10 shadow-lg">
                    <img
                      src="/screenshots/optionsmarkets.png"
                      alt="Options Markets"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-shrink-0 w-150 md:w-250 h-100 rounded-lg overflow-hidden border border-white/10 shadow-lg">
                    <img
                      src="/screenshots/auraagent.png"
                      alt="AI Agent Trading"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-shrink-0 w-150 md:w-250 h-100 rounded-lg overflow-hidden border border-white/10 shadow-lg">
                    <img
                      src="/screenshots/perps.png"
                      alt="Advanced Analytics"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-shrink-0 w-150 md:w-250 h-100 rounded-lg overflow-hidden border border-white/10 shadow-lg">
                    <img
                      src="/screenshots/optionsmarkets.png"
                      alt="Risk Management"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-shrink-0 w-150 md:w-250 h-100 rounded-lg overflow-hidden border border-white/10 shadow-lg">
                    <img
                      src="/screenshots/auraagent.png"
                      alt="Portfolio Tools"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-shrink-0 w-150 md:w-250 h-100 rounded-lg overflow-hidden border border-white/10 shadow-lg">
                    <img
                      src="/screenshots/perps.png"
                      alt="Market Data"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-shrink-0 w-150 md:w-250 h-100 rounded-lg overflow-hidden border border-white/10 shadow-lg">
                    <img
                      src="/screenshots/optionsmarkets.png"
                      alt="Strategy Builder"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-shrink-0 w-150 md:w-250 h-100 rounded-lg overflow-hidden border border-white/10 shadow-lg">
                    <img
                      src="/screenshots/auraagent.png"
                      alt="Performance Charts"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-shrink-0 w-150 md:w-250 h-100 rounded-lg overflow-hidden border border-white/10 shadow-lg">
                    <img
                      src="/screenshots/perps.png"
                      alt="Order History"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-shrink-0 w-150 md:w-250 h-100 rounded-lg overflow-hidden border border-white/10 shadow-lg">
                    <img
                      src="/screenshots/optionsmarkets.png"
                      alt="Settings"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-shrink-0 w-150 md:w-250 h-100 rounded-lg overflow-hidden border border-white/10 shadow-lg">
                    <img
                      src="/screenshots/auraagent.png"
                      alt="Liquidity Pools"
                      className="w-full h-full object-cover"
                    />
                  </div>

                </div>
              </div>
            </div>
          </main>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
        {!sessionConnected && (
          <OnboardingBanner onStartOnboarding={() => setShowOnboarding(true)} />
        )}
        <main className="p-6 space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            {channelAddress && (
              <button
                onClick={() => openDepositOptions(channelAddress)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                Deposit
              </button>
            )}
          </div>

          {/* Channel Summary */}
          {channelAddress && <ChannelSummary />}

          {/* Testnet Faucet */}
          {isTestnet && <FaucetButton />}

          {/* Account Balance & Buying Power Chart */}
          <AccountBalanceChart />


{/* CTAs */}
          <h2 className="text-2xl font-bold text-white mt-10">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <Link
              href="/perpetual"
              className="w-full px-6 py-8 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors border border-white/20 text-center"
            >
              <h3 className="text-xl font-bold ">Perpetual Futures</h3>

            </Link>
            <Link
              href="/perpetual/lp"
              className="w-full px-6 py-8 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors border border-white/20 text-center"
            >
              <h3 className="text-xl font-bold">Earn</h3>
            </Link>

                        <Link
              href="/options/btc"
              className="w-full px-6 py-8 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors border border-white/20 text-center"
            >
              <h3 className="text-xl font-bold">Options Trading</h3>

            </Link>
          </div>
          
          {/* Key Metrics */}
          <KeyMetrics />
          {/* Unified Positions Overview */}
          <UnifiedPositionsTable />

          

          {/* LP Earnings */}
          <LPEarningsChart />
        </main>

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
  );
}

function AccountBalanceChart() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [usdcBalance, setUsdcBalance] = useState(0);
  const [data, setData] = useState<{ date: string; balance: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const { setGlobalLoading } = useUI();

  useEffect(() => {
    if (!address || !publicClient) return;

    const fetchData = async () => {
      try {
        // Fetch user channels
        const channelResult = await getChannelList(address, publicClient);
        if (!channelResult.success || !channelResult.channels) {
          console.error("Failed to get channels:", channelResult.error);
          setData([]);
          return;
        }
        const channels = channelResult.channels;

        // Calculate total USDC balance
        const usdcAddress =
          process.env.NEXT_PUBLIC_USDC_ADDRESS ||
          "0x4b1fACeF3553C0c7A67D6AB240394E9aad566c2d";
        let totalUsdc = 0;
        for (const channel of channels) {
          try {
            const bal = await publicClient.readContract({
              address: usdcAddress as `0x${string}`,
              abi: [
                {
                  inputs: [{ name: "account", type: "address" }],
                  name: "balanceOf",
                  outputs: [{ name: "", type: "uint256" }],
                  stateMutability: "view",
                  type: "function",
                },
              ],
              functionName: "balanceOf",
              args: [channel as `0x${string}`],
            });
            totalUsdc += Number(bal) / 1e6;
          } catch {
            // ignore
          }
        }
        setUsdcBalance(totalUsdc);

        // Fetch balance history
        const channelsParam = channels.join(",");
        const res = await fetch(
          `/api/usdc-balance?address=${address}&channels=${channelsParam}`,
        );
        const historyData = await res.json();

        if (Array.isArray(historyData)) {
          // Filter data to show meaningful points: skip leading zeros, show one zero if needed, then actual balances
          const filteredData = [];
          let foundNonZero = false;
          let lastZeroIndex = -1;

          for (let i = 0; i < historyData.length; i++) {
            const point = historyData[i];
            if (point.balance > 0) {
              // If we found a non-zero balance, add the last zero point if it exists
              if (lastZeroIndex >= 0 && !foundNonZero) {
                filteredData.push(historyData[lastZeroIndex]);
              }
              filteredData.push(point);
              foundNonZero = true;
            } else if (!foundNonZero) {
              // Keep track of the last zero point before non-zero balances
              lastZeroIndex = i;
            }
          }

          // If no non-zero balances found, show the last few points
          if (!foundNonZero && historyData.length > 0) {
            filteredData.push(...historyData.slice(-3));
          }

          setData(filteredData);
        } else {
          console.error("Invalid data", historyData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [address, publicClient]);

  // Set global loading based on data loading
  useEffect(() => {
    setGlobalLoading(loading);
  }, [loading, setGlobalLoading]);

  if (loading) {
    return null;
  }

  if (data.length === 0) {
    return (
      <div className="broker-card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Account Balance</h2>
          <p className="text-2xl font-bold text-white">
            ${usdcBalance.toLocaleString()}
          </p>
        </div>
        <div className="text-white">No portfolio data available</div>
      </div>
    );
  }

  return (
    <div className="broker-card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">
          Total Available Buying Power (30-Day Trend)
        </h2>
        <div className="text-right">
          <div className="text-sm text-gray-400">Current Balance</div>
          <div className="text-2xl font-bold text-white">
            ${usdcBalance.toLocaleString()}
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="date" hide />
          <YAxis
            stroke="#fff"
            tickFormatter={(value) => `$${value.toLocaleString()}`}
            domain={[0, "dataMax"]}
          />
          <Tooltip
            contentStyle={{ backgroundColor: "#333", border: "1px solid #555" }}
            labelStyle={{ color: "#fff" }}
            formatter={(value: number | undefined) => [
              value ? `$${value.toLocaleString()}` : '$0',
              "Buying Power",
            ]}
            labelFormatter={(label) => {
              if (typeof label !== "string") return "";
              const [year, month, day] = label.split("-").map(Number);
              const date = new Date(year, month - 1, day);
              return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
            }}
          />
          <Line
            type="monotone"
            dataKey="balance"
            stroke="#8884d8"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function KeyMetrics() {
  const { positions, totalPnL } = useTradingContext();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="broker-card">
        <h4 className="text-sm text-gray-400 mb-1">Open Positions PnL</h4>
        <p
          className={`text-2xl font-bold ${totalPnL >= 0 ? "text-green-400" : "text-red-400"}`}
        >
          ${totalPnL.toFixed(2)}
        </p>
      </div>
      <div className="broker-card">
        <h4 className="text-sm text-gray-400 mb-1">Open Positions</h4>
        <p className="text-2xl font-bold text-white">{positions.length}</p>
      </div>
    </div>
  );
}

function LPEarningsChart() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="broker-card">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4 w-1/3"></div>
          <div className="h-72 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  // Mock data for LP earnings - replace with real data
  const data = [
    { date: "2024-01-01", earnings: 0 },
    { date: "2024-01-02", earnings: 5.23 },
    { date: "2024-01-03", earnings: 12.45 },
    { date: "2024-01-04", earnings: 18.67 },
    { date: "2024-01-05", earnings: 25.89 },
    { date: "2024-01-06", earnings: 31.12 },
    { date: "2024-01-07", earnings: 38.34 },
  ];

  return (
    <div className="broker-card">
      <h2 className="text-xl font-semibold text-white mb-4">
        LP Earnings (7-Day Trend)
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="date" stroke="#fff" />
          <YAxis
            stroke="#fff"
            tickFormatter={(value) => `$${value.toFixed(2)}`}
          />
          <Tooltip
            contentStyle={{ backgroundColor: "#333", border: "1px solid #555" }}
            labelStyle={{ color: "#fff" }}
            formatter={(value: number | undefined) => [value ? `$${value.toFixed(2)}` : '$0.00', "Earnings"]}
          />
          <Line
            type="monotone"
            dataKey="earnings"
            stroke="#10b981"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChannelSummary() {
  const { channelAddress } = useSession();
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [channelBalance, setChannelBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const { openChannelSelector } = useUI();

  useEffect(() => {
    if (!channelAddress || !publicClient) return;

    const fetchChannelBalance = async () => {
      try {
        const usdcAddress =
          process.env.NEXT_PUBLIC_USDC_ADDRESS ||
          "0x4b1fACeF3553C0c7A67D6AB240394E9aad566c2d";
        const balance = await publicClient.readContract({
          address: usdcAddress as `0x${string}`,
          abi: [
            {
              inputs: [{ name: "account", type: "address" }],
              name: "balanceOf",
              outputs: [{ name: "", type: "uint256" }],
              stateMutability: "view",
              type: "function",
            },
          ],
          functionName: "balanceOf",
          args: [channelAddress as `0x${string}`],
        });
        setChannelBalance(Number(balance) / 1e6);
      } catch (error) {
        console.error("Error fetching channel balance:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChannelBalance();
  }, [channelAddress, publicClient]);

  if (loading) {
    return (
      <div className="broker-card">
        <div className="animate-pulse">
          <div className="flex justify-between items-center">
            <div className="h-4 bg-gray-700 rounded w-1/3"></div>
            <div className="h-6 bg-gray-700 rounded w-1/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="broker-card">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-white">
            Connected Channel
          </h3>
          <p className="text-sm text-gray-400 font-mono">
            {channelAddress?.slice(0, 6)}...{channelAddress?.slice(-4)}
          </p>
        </div>
        <div className="text-right flex items-center gap-4">
          <button
            onClick={openChannelSelector}
            className="px-3 py-1 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg text-primary text-sm font-medium transition-colors"
          >
            Switch Channel
          </button>
          <div>
            <div className="text-sm text-gray-400">Channel Balance</div>
            <div className="text-xl font-bold text-white">
              ${channelBalance.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
