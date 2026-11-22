"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { FaTimes, FaPlus, FaExclamationTriangle } from "react-icons/fa";
import CreateMarketModal from "./CreateMarketModal";
import OptionsMarginPortal from "./OptionsMarginPortal";
import OptionsMarketSessionPortal from "@/components/ui/OptionsMarketSessionPortal";
import { useSession } from "@/store/SessionContext";
import { getAccountBalances, type AccountBalances } from "@/services/options";
import { AssetCategory } from "@/services/assets";

interface OptionsAssetConfig {
  symbol: string;
  display: string;
  name: string;
  pythId: string;
  description: string;
  category: string;
  popular?: boolean;
  isLoading?: boolean;
}

interface OptionsConfig {
  options: OptionsAssetConfig[];
  v: number;
}

interface LivePriceData {
  price: number;
  change: number;
  changePercent: number;
}

interface OptionsSidebarProps {
  currentAsset: string;
  config: OptionsConfig;
  livePrices: Map<string, LivePriceData>;
}

export default function OptionsSidebar({
  currentAsset,
  config,
  livePrices,
}: OptionsSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateMarket, setShowCreateMarket] = useState(false);
  const [showMarginPortal, setShowMarginPortal] = useState(false);
  const [portalAction, setPortalAction] = useState<'deposit' | 'withdraw'>('deposit');
  const [showOptionsPortal, setShowOptionsPortal] = useState(false);
  const [portalAsset, setPortalAsset] = useState<OptionsAssetConfig | null>(null);

  const isTestnet = process.env.NEXT_PUBLIC_TESTNET === 'true';

  // ── Margin health (self-contained) ──
  const { channelAddress } = useSession();
  const [balances, setBalances] = useState<AccountBalances | null>(null);
  const loadingBalancesRef = useRef(false);

  const refreshBalances = useCallback(async () => {
    if (!channelAddress || loadingBalancesRef.current) return;
    loadingBalancesRef.current = true;
    try {
      const b = await getAccountBalances(channelAddress as `0x${string}`);
      setBalances(b);
    } catch { /* no margin account yet */ } finally {
      loadingBalancesRef.current = false;
    }
  }, [channelAddress]);

  useEffect(() => {
    refreshBalances();
    if (!channelAddress) return;
    const interval = setInterval(refreshBalances, 30_000);
    return () => clearInterval(interval);
  }, [channelAddress, refreshBalances]);

  const totalCollateral = balances ? Number(balances.totalCollateral) / 1e18 : 0;
  const lockedMargin = balances ? Number(balances.lockedMargin) / 1e18 : 0;
  const freeCollateral = balances
    ? Number(balances.freeCollateral > 0n ? balances.freeCollateral : 0n) / 1e18
    : 0;
  const marginHealth = totalCollateral > 0
    ? ((totalCollateral - lockedMargin * 0.15) / totalCollateral) * 100
    : 100;
  const isLowHealth = marginHealth < 50;
  const isCritical = marginHealth < 30;
  const hasMarginData = channelAddress && balances !== null;

  const assets = config.options.map((asset) => {
    const livePrice = livePrices.get(asset.symbol);
    return {
      symbol: asset.symbol,
      name: asset.name,
      display: asset.display,
      description: asset.description,
      pythId: asset.pythId,
      popular: asset.popular,
      isLoading: asset.isLoading,
      category: asset.category,
      ...(livePrice || { price: 0, change: 0, changePercent: 0 }),
    };
  });

  const filteredAssets = assets.filter(
    (asset) =>
      asset.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <aside className="broker-sidebar h-full overflow-hidden flex flex-col w-88">
      {/* Margin Health — above everything */}
      {hasMarginData && (
        <div className="px-5 pt-4 pb-3 border-b border-white/6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/40 text-[10px] uppercase tracking-wider font-medium">Margin Health</span>
            {totalCollateral > 0 ? (
              <span className={`text-xs font-bold font-mono ${
                isCritical ? "text-red-400" : isLowHealth ? "text-yellow-400" : "text-green-400"
              }`}>
                {marginHealth.toFixed(1)}%
              </span>
            ) : (
              <span className="text-xs font-bold font-mono text-white/40">
                No Collateral
              </span>
            )}
          </div>
          {totalCollateral > 0 ? (
            <>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isCritical ? "bg-red-500" : isLowHealth ? "bg-yellow-500" : "bg-green-500"
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, marginHealth))}%` }}
                />
              </div>
              {isCritical && (
                <div className="flex items-center gap-1 mt-1.5 text-red-400 text-[10px]">
                  <FaExclamationTriangle className="w-2.5 h-2.5" />
                  <span className="font-medium">LIQUIDATION RISK</span>
                </div>
              )}
              {!isCritical && isLowHealth && (
                <div className="flex items-center gap-1 mt-1.5 text-yellow-400 text-[10px]">
                  <FaExclamationTriangle className="w-2.5 h-2.5" />
                  <span className="font-medium">MARGIN CALL ZONE</span>
                </div>
              )}
              <div className="flex items-center gap-3 mt-2.5 text-[10px]">
                <div>
                  <span className="text-white/30 uppercase tracking-wider">Free</span>
                  <span className="ml-1.5 text-green-400 font-mono font-semibold">${freeCollateral.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-white/30 uppercase tracking-wider">Locked</span>
                  <span className="ml-1.5 text-white/50 font-mono">${lockedMargin.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-white/30 uppercase tracking-wider">Total</span>
                  <span className="ml-1.5 text-white/70 font-mono">${totalCollateral.toFixed(2)}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-2">
              <div className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Deposit collateral to start trading</div>
            </div>
          )}
          {/* Deposit/Withdraw Buttons */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setShowMarginPortal(true)}
              className="flex-1 px-3 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/30 rounded-lg text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              Deposit
            </button>
            <button
              onClick={() => { setShowMarginPortal(true); setPortalAction('withdraw'); }}
              className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/15 rounded-lg text-white/70 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors"
              disabled={totalCollateral === 0}
            >
              Withdraw
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-5 border-b border-white/6">
        <h2 className="text-lg font-semibold text-white mb-1 uppercase tracking-wide">
          Options Markets
        </h2>
        <div className="text-xs text-white/60 mb-3">FeatherEngine by BrokerFi</div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search crypto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-primary/50"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            >
              <FaTimes size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Assets List */}
      <div className="flex-1 overflow-auto">
        <div className="px-4 py-2">
          <div className="grid grid-cols-[2fr_1fr_1fr] gap-4 mb-3 px-3 py-2 text-xs text-white/60 uppercase tracking-wider border-b border-white/6 font-medium">
            <span>Asset</span>
            <span className="text-right">Price</span>
            <span className="text-right">Change</span>
          </div>

          <div className="space-y-1">
            {filteredAssets.map((asset) => (
              <div
                key={asset.symbol}
                onClick={() => {
                  if (asset.isLoading) return; // Disable clicking for loading assets
                  setPortalAsset(asset);
                  setShowOptionsPortal(true);
                }}
                className={`block transition-colors rounded-lg p-3 border ${
                  asset.isLoading
                    ? "border-transparent cursor-not-allowed"
                    : currentAsset === asset.symbol
                    ? "border-primary/40 bg-primary/10 cursor-pointer hover:bg-primary/15"
                    : "border-transparent hover:border-white/10 cursor-pointer hover:bg-white/5"
                } group`}
              >
                {asset.isLoading ? (
                  // Ghost square skeleton
                  <div className="grid grid-cols-[2fr_1fr_1fr] gap-4 items-center animate-pulse">
                    <div className="min-w-0 flex-1">
                      <div className="h-4 bg-white/10 rounded w-12 mb-1"></div>
                      <div className="h-3 bg-white/5 rounded w-16"></div>
                    </div>
                    <div className="text-right">
                      <div className="h-4 bg-white/10 rounded w-16"></div>
                    </div>
                    <div className="text-right">
                      <div className="h-4 bg-white/5 rounded w-8"></div>
                    </div>
                  </div>
                ) : (
                  // Real market card
                  <div className="grid grid-cols-[2fr_1fr_1fr] gap-4 items-center">
                    <div className="min-w-0 flex-1">
                      <div
                        className={`text-sm font-semibold truncate transition-colors ${
                          currentAsset === asset.symbol
                            ? "text-primary"
                            : "text-white group-hover:text-primary"
                        }`}
                      >
                        {asset.symbol}
                      </div>
                      <div className="text-xs text-white/50 truncate">
                        {asset.name}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-mono font-medium text-white">
                        {asset.price > 0
                          ? `$${asset.price.toFixed(2)}`
                          : "Loading..."}
                      </div>
                    </div>

                    <div className="text-right">
                      {asset.price > 0 ? (
                        <div
                          className={`text-sm font-mono font-medium ${
                            asset.change >= 0 ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {asset.change >= 0 ? "+" : ""}
                          {asset.changePercent.toFixed(2)}%
                        </div>
                      ) : (
                        <div className="text-sm font-mono font-medium text-white/40">
                          --
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Market Button */}
      <div className="p-4 border-t border-white/6">
        <button
          onClick={() => setShowCreateMarket(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-all font-semibold text-sm"
        >
          <FaPlus size={12} />
          Create Community Market
        </button>
      </div>

      <CreateMarketModal
        isOpen={showCreateMarket}
        onClose={() => setShowCreateMarket(false)}
      />

      {showMarginPortal && (
        <OptionsMarginPortal
          isOpen={showMarginPortal}
          onClose={() => setShowMarginPortal(false)}
          initialAction={portalAction}
          onSuccess={refreshBalances}
        />
      )}

      {showOptionsPortal && (
        <OptionsMarketSessionPortal
          isOpen={showOptionsPortal}
          onClose={() => { setShowOptionsPortal(false); setPortalAsset(null); }}
          asset={portalAsset ? {
            ...portalAsset,
            type: 'crypto' as const,
            priceId: portalAsset.pythId,
            pyth_id: portalAsset.pythId,
            category: portalAsset.category as AssetCategory,
            urlSlug: portalAsset.symbol.toLowerCase(),
            searchTerms: [portalAsset.symbol, portalAsset.name]
          } : null}
        />
      )}
    </aside>
  );
}