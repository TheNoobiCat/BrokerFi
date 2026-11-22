'use client';

import { useEffect, useState, useMemo } from "react";
import { useUI } from "@/store/UIContext";

/* ── Types ── */

interface RawLeaderboardEntry {
  user_address: string;   // wallet address from relayer (already resolved server-side)
  trade_count: number;
  profit: number;
  rank: number;
}

interface LeaderboardEntry {
  walletAddress: string;
  tradeCount: number;
  profit: number;
  rank: number;
  xp: number;
  tier: string;
}

/* ── XP tier calculation ── */

const XP_TIERS = [
  { label: "Genesis",    min: 1,   max: 10,  xpPerTrade: 100 },
  { label: "Active",     min: 11,  max: 50,  xpPerTrade: 25  },
  { label: "Pro",        min: 51,  max: 500, xpPerTrade: 5   },
  { label: "Power User", min: 501, max: Infinity, xpPerTrade: 1 },
];

function calculateXP(tradeCount: number): { xp: number; tier: string } {
  let xp = 0;
  let currentTier = "Unranked";

  for (const tier of XP_TIERS) {
    if (tradeCount < tier.min) break;
    const tradesInTier = Math.min(tradeCount, tier.max) - tier.min + 1;
    xp += tradesInTier * tier.xpPerTrade;
    currentTier = tier.label;
  }

  return { xp, tier: tradeCount === 0 ? "Unranked" : currentTier };
}

function getTierColor(tier: string): string {
  switch (tier) {
    case "Genesis":    return "text-amber-400";
    case "Active":     return "text-blue-400";
    case "Pro":        return "text-purple-400";
    case "Power User": return "text-white";
    default:           return "text-white/40";
  }
}

function getTierBorderColor(tier: string): string {
  switch (tier) {
    case "Genesis":    return "border-amber-400/30";
    case "Active":     return "border-blue-400/30";
    case "Pro":        return "border-purple-400/30";
    case "Power User": return "border-white/20";
    default:           return "border-white/10";
  }
}

/* ── Main Component ── */

export default function LeaderboardPage() {
  const { setGlobalLoading } = useUI();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'trades' | 'profit'>('trades');

  useEffect(() => {
    loadLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  const loadLeaderboard = async () => {
    setLoading(true);
    setGlobalLoading(true);

    try {
      const relayerUrl = process.env.NEXT_PUBLIC_RELAYER_URL || 'http://localhost:4001';
      const response = await fetch(`${relayerUrl}/leaderboard?limit=100&sort=${sortBy}`);
      const data = await response.json();

      const rawEntries: RawLeaderboardEntry[] = data.success ? (data.data || []) : (data || []);

      // The relayer now stores wallet addresses directly and aggregates by owner
      // We just need to calculate XP client-side
      const processed = rawEntries.map((entry) => {
        const { xp, tier } = calculateXP(entry.trade_count);
        return {
          walletAddress: entry.user_address,
          tradeCount: entry.trade_count,
          profit: entry.profit || 0,
          rank: entry.rank,
          xp,
          tier,
        };
      });

      setLeaderboard(processed);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      setLeaderboard([]);
    }

    setLoading(false);
    setGlobalLoading(false);
  };

  const formatAddress = (address: string) => {
    try {
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    } catch {
      return address;
    }
  };

  const topThree = useMemo(() => leaderboard.slice(0, 3), [leaderboard]);

  const totalTrades = useMemo(() => leaderboard.reduce((sum, e) => sum + e.tradeCount, 0), [leaderboard]);
  const totalTraders = leaderboard.length;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">

        {/* ── Header ── */}
        <div className="mb-10 flex items-center gap-4">
          <img src="/logo/vibetrading.svg" alt="Vibetrader" className="h-9" />
          <div className="h-7 w-px bg-white/10" />
          <div className="text-2xl font-semibold text-white">XP Leaderboard</div>
        </div>

        {/* ── Stats bar with sort toggle ── */}
        <div className="flex items-center justify-between gap-6 mb-8 flex-wrap">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 px-5 py-3 rounded-lg bg-white/5 border border-white/10">
              <span className="text-sm text-white/50">Traders</span>
              <span className="text-xl font-bold text-white">{totalTraders}</span>
            </div>
            <div className="flex items-center gap-3 px-5 py-3 rounded-lg bg-white/5 border border-white/10">
              <span className="text-sm text-white/50">AI Trades</span>
              <span className="text-xl font-bold text-white">{totalTrades.toLocaleString()}</span>
            </div>
          </div>
          
          {/* Sort toggle */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
            <span className="text-sm text-white/50">Sort by:</span>
            <button
              onClick={() => setSortBy('trades')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                sortBy === 'trades'
                  ? 'bg-blue-500 text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Trades
            </button>
            <button
              onClick={() => setSortBy('profit')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                sortBy === 'profit'
                  ? 'bg-green-500 text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Profit
            </button>
          </div>
        </div>

        {/* ── Top 3 Pods ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[1, 0, 2].map((displayIdx) => {
            const podOrder = displayIdx;
            const entry = topThree[podOrder];
            const medals = ["#1", "#2", "#3"];
            const medalColors = ["text-amber-400", "text-white/60", "text-amber-600"];
            const borderColors = ["border-amber-400/20", "border-white/10", "border-amber-600/20"];

            return (
              <div
                key={podOrder}
                className={`relative rounded-xl bg-white/5 border ${borderColors[podOrder]} p-6 ${podOrder === 0 ? 'sm:order-2' : podOrder === 1 ? 'sm:order-1' : 'sm:order-3'}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`text-2xl font-bold ${medalColors[podOrder]}`}>
                    {medals[podOrder]}
                  </div>
                  <div className="font-mono text-base text-white/80">
                    {entry ? formatAddress(entry.walletAddress) : '---'}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-white">
                      {entry ? entry.tradeCount : '-'}
                    </div>
                    <div className="text-xs text-white/40 uppercase tracking-wider">AI trades</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-400">
                      {entry ? entry.xp.toLocaleString() : '-'}
                    </div>
                    <div className="text-xs text-white/40 uppercase tracking-wider">XP</div>
                  </div>
                </div>
                {entry && (
                  <div className="mt-4 flex items-center justify-between">
                    <div className={`inline-block px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider border ${getTierBorderColor(entry.tier)} ${getTierColor(entry.tier)}`}>
                      {entry.tier}
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${entry.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {entry.profit >= 0 ? '+' : ''}{entry.profit.toFixed(2)} USDC
                      </div>
                      <div className="text-xs text-white/40 uppercase tracking-wider">Profit</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Table ── */}
        {loading ? (
          <div className="rounded-xl bg-white/5 border border-white/10 text-center py-20">
            <div className="mx-auto inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-white/60" />
            <p className="mt-4 text-sm text-white/40">Loading leaderboard...</p>
          </div>
        ) : (
          <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Wallet</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-white/40 uppercase tracking-wider">AI Trades</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-white/40 uppercase tracking-wider">Profit</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-white/40 uppercase tracking-wider">XP</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-white/40 uppercase tracking-wider">Tier</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center text-white/40 text-base">
                        No traders yet. Be the first to trade with Vibetrader.
                      </td>
                    </tr>
                  ) : (
                    leaderboard.map((entry, idx) => (
                      <tr
                        key={entry.walletAddress + idx}
                        className="border-b border-white/5 hover:bg-white/[0.03] transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className={`text-base font-bold ${entry.rank <= 3 ? 'text-amber-400' : 'text-white/50'}`}>
                            #{entry.rank}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-sm text-white/80">
                          {formatAddress(entry.walletAddress)}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-base text-white font-semibold">
                          {entry.tradeCount}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-base font-semibold">
                          <span className={entry.profit >= 0 ? 'text-green-400' : 'text-red-400'}>
                            {entry.profit >= 0 ? '+' : ''}{entry.profit.toFixed(2)} USDC
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-base text-blue-400 font-bold">
                          {entry.xp.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`inline-block px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider border ${getTierBorderColor(entry.tier)} ${getTierColor(entry.tier)}`}>
                            {entry.tier}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── XP Tiers Info ── */}
        <div className="mt-8 rounded-xl bg-white/5 border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-5">
            <img src="/logo/vibetrading.svg" alt="Vibetrader" className="h-6" />
            <span className="text-base font-semibold text-white">XP Tiers</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {XP_TIERS.map((tier) => (
              <div
                key={tier.label}
                className={`rounded-lg border p-4 ${
                  tier.label === "Genesis"
                    ? "border-amber-400/20 bg-amber-400/5"
                    : "border-white/10 bg-white/[0.02]"
                }`}
              >
                <div className={`text-sm font-semibold uppercase tracking-wider mb-2 ${getTierColor(tier.label)}`}>
                  {tier.label}
                </div>
                <div className="text-xs text-white/40 mb-3">
                  Trades {tier.min}{tier.max === Infinity ? '+' : ` - ${tier.max}`}
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-white">{tier.xpPerTrade}</span>
                  <span className="text-xs text-white/40">XP / trade</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
