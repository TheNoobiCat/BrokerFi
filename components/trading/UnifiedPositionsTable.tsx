"use client";

import { useState, useMemo, useEffect } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { useTradingContext } from "@/store/TradingContext";
import { useOptionsPositions, type EnrichedOptionsPosition } from "@/hooks/useOptionsPositions";
import { GhostSquare } from "@/components/ui/GhostSquare";
import ClosePositionModal from "@/components/trading/ClosePositionModal";
import { settleOptionsPosition } from "@/services/options";
import { useSession } from "@/store/SessionContext";

// ── Types ──────────────────────────────────────────────────────────────────

type TabId = "all" | "perps" | "options";

interface PerpsRow {
  kind: "perps";
  id: string;
  asset: string;
  side: "long" | "short";
  size: number;
  leverage: number;
  entryPrice: number;
  markPrice: number;
  pnl: number;
  pnlPercent: number;
  liqPrice: number;
  takeProfit?: number | null;
  stopLoss?: number | null;
  raw: any;
}

interface OptionsRow {
  kind: "options";
  id: string;
  asset: string;
  side: "long" | "short";
  isCall: boolean;
  strikePrice: number;
  expiry: number;
  quantity: number;
  entryPremium: number;
  currentPremium: number;
  pnl: number;
  pnlPercent: number;
  daysToExpiry: number;
  isExpired: boolean;
  isITM: boolean;
  // Greeks
  iv: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  marginLocked: number;
  contractSize: number;
  raw: EnrichedOptionsPosition;
}

type UnifiedRow = PerpsRow | OptionsRow;

// ── Helpers ────────────────────────────────────────────────────────────────

function formatUSD(n: number, decimals = 2): string {
  return "$" + Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatPnl(n: number): string {
  const sign = n >= 0 ? "+" : "-";
  return sign + formatUSD(n);
}

function formatPct(n: number): string {
  const sign = n >= 0 ? "+" : "";
  return sign + n.toFixed(2) + "%";
}

function expiryUrgencyClass(days: number, isExpired: boolean): string {
  if (isExpired) return "text-red-500 bg-red-500/10 border-red-500/30";
  if (days < 1) return "text-red-400 bg-red-500/10 border-red-500/20";
  if (days < 3) return "text-orange-400 bg-orange-500/10 border-orange-500/20";
  if (days < 7) return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
  return "text-white/60 bg-white/5 border-white/10";
}

function expiryLabel(days: number, isExpired: boolean): string {
  if (isExpired) return "EXPIRED";
  if (days < 1) {
    const hours = Math.floor(days * 24);
    const mins = Math.floor((days * 24 - hours) * 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }
  if (days < 2) return `${Math.floor(days * 24)}h`;
  return `${Math.floor(days)}d`;
}

// ── Component ──────────────────────────────────────────────────────────────

interface UnifiedPositionsTableProps {
  /** Optional map of pythId → live spot price for options P&L */
  spotPrices?: Record<string, number>;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function UnifiedPositionsTable({
  spotPrices,
  isCollapsed: controlledCollapsed,
  onToggleCollapse: controlledToggle,
}: UnifiedPositionsTableProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = controlledCollapsed ?? internalCollapsed;
  const toggleCollapse = controlledToggle ?? (() => setInternalCollapsed(p => !p));

  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [showGreeks, setShowGreeks] = useState(false);
  const [perpsPositionToClose, setPerpsPositionToClose] = useState<any>(null);
  const [settlingIds, setSettlingIds] = useState<Set<string>>(new Set());

  // Session for channel address
  const { channelAddress } = useSession();

  // Data sources
  const {
    positions: perpsPositions,
    closingPositions,
    closePosition,
  } = useTradingContext();

  const {
    positions: optionsPositions,
    loading: optionsLoading,
  } = useOptionsPositions(spotPrices);

  // Unify rows
  const rows = useMemo<UnifiedRow[]>(() => {
    const perpsRows: PerpsRow[] = perpsPositions.map((p) => {
      const positionValue = p.size * p.currentPrice;
      const roe = positionValue > 0
        ? (p.pnl / (positionValue / p.leverage)) * 100
        : 0;
      return {
        kind: "perps",
        id: p.id,
        asset: p.symbol.replace("USDT", "").replace("USD", ""),
        side: p.type,
        size: p.size,
        leverage: p.leverage,
        entryPrice: p.openPrice,
        markPrice: p.currentPrice,
        pnl: p.pnl,
        pnlPercent: roe,
        liqPrice: p.liquidationPrice,
        takeProfit: p.takeProfit,
        stopLoss: p.stopLoss,
        raw: p,
      };
    });

    const optRows: OptionsRow[] = optionsPositions.map((o) => ({
      kind: "options",
      id: o.seriesId,
      asset: o.asset,
      side: o.isLong ? "long" : "short",
      isCall: o.isCall,
      strikePrice: o.strikePrice,
      expiry: o.expiry,
      quantity: o.quantity,
      entryPremium: o.entryPrice,
      currentPremium: o.currentPremium,
      pnl: o.pnl,
      pnlPercent: o.pnlPercent,
      daysToExpiry: o.daysToExpiry,
      isExpired: o.isExpired,
      isITM: o.isITM,
      iv: o.iv,
      delta: o.delta,
      gamma: o.gamma,
      theta: o.theta,
      vega: o.vega,
      marginLocked: o.marginLocked,
      contractSize: o.contractSize,
      raw: o,
    }));

    return [...perpsRows, ...optRows];
  }, [perpsPositions, optionsPositions]);

  // Filter by tab
  const filteredRows = useMemo(() => {
    if (activeTab === "perps") return rows.filter((r) => r.kind === "perps");
    if (activeTab === "options") return rows.filter((r) => r.kind === "options");
    return rows;
  }, [rows, activeTab]);

  // Aggregate stats
  const totalPnl = rows.reduce((s, r) => s + r.pnl, 0);
  const perpsCount = rows.filter((r) => r.kind === "perps").length;
  const optionsCount = rows.filter((r) => r.kind === "options").length;

  const handleClosePerps = (row: PerpsRow) => {
    setPerpsPositionToClose(row.raw);
  };

  const handleConfirmClose = (positionId: string) => {
    closePosition(positionId);
    setPerpsPositionToClose(null);
  };

  const handleSettleOption = async (row: OptionsRow) => {
    if (!channelAddress) return;
    const seriesId = row.raw.seriesId;
    const priceFeedId = row.raw.underlyingPriceFeedId;

    if (!priceFeedId) {
      console.error("[Settle] No priceFeedId for position", seriesId);
      return;
    }

    setSettlingIds(prev => new Set(prev).add(seriesId));

    try {
      const result = await settleOptionsPosition({
        channelAddress: channelAddress as `0x${string}`,
        traderAddress: channelAddress as `0x${string}`,
        seriesId: seriesId as `0x${string}`,
        underlyingPriceFeedId: priceFeedId as `0x${string}`,
        onSubmitted: () => console.log("[Settle] Submitted for", seriesId),
        onSuccess: () => console.log("[Settle] Success for", seriesId),
        onError: (err) => console.error("[Settle] Error for", seriesId, err),
      });

      if (!result.success) {
        console.error("[Settle] Failed:", result.error);
      }
    } catch (err) {
      console.error("[Settle] Exception:", err);
    } finally {
      setSettlingIds(prev => {
        const next = new Set(prev);
        next.delete(seriesId);
        return next;
      });
    }
  };

  return (
    <div className="broker-card">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div
        className="p-4 border-b border-white/6 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={toggleCollapse}
      >
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-white font-sans">
            Open Positions
          </h3>
          <span className="text-xs text-white/40 font-mono">
            {rows.length}
          </span>
          {isCollapsed ? (
            <FaChevronDown className="text-white/50 text-sm" />
          ) : (
            <FaChevronUp className="text-white/50 text-sm" />
          )}
        </div>

        {/* Aggregate PnL badge */}
        {rows.length > 0 && (
          <div className="flex items-center gap-3">
            <div
              className={`text-sm font-mono font-semibold ${
                totalPnl >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {formatPnl(totalPnl)}
            </div>
          </div>
        )}
      </div>

      {/* ── Body ───────────────────────────────────────────────────── */}
      {!isCollapsed && (
        <div>
          {/* Tabs + Greeks toggle */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/6">
            <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
              {(["all", "perps", "options"] as TabId[]).map((tab) => {
                const count = tab === "all" ? rows.length : tab === "perps" ? perpsCount : optionsCount;
                return (
                  <button
                    key={tab}
                    onClick={(e) => { e.stopPropagation(); setActiveTab(tab); }}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                      activeTab === tab
                        ? "bg-white/10 text-white"
                        : "text-white/40 hover:text-white/60"
                    }`}
                  >
                    <span className="capitalize">{tab}</span>
                    <span className="text-[10px] opacity-60">{count}</span>
                  </button>
                );
              })}
            </div>

            {optionsCount > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowGreeks((p) => !p); }}
                className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all border ${
                  showGreeks
                    ? "bg-blue-500/15 text-blue-400 border-blue-500/20"
                    : "bg-white/5 text-white/40 border-white/10 hover:text-white/60"
                }`}
              >
                Greeks
              </button>
            )}
          </div>

          {/* Content */}
          <div className="overflow-auto">
            {optionsLoading && optionsCount === 0 && perpsCount === 0 ? (
              <LoadingSkeleton />
            ) : filteredRows.length === 0 ? (
              <EmptyState tab={activeTab} />
            ) : (
              <div className="min-w-full divide-y divide-white/[0.03]">
                {filteredRows.map((row) =>
                  row.kind === "perps" ? (
                    <PerpsPositionRow
                      key={row.id}
                      row={row}
                      isClosing={closingPositions.has(row.id)}
                      onClose={() => handleClosePerps(row)}
                    />
                  ) : (
                    <OptionsPositionRow
                      key={row.id}
                      row={row}
                      showGreeks={showGreeks}
                      isSettling={settlingIds.has(row.id)}
                      onSettle={() => handleSettleOption(row)}
                    />
                  ),
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Close Position Modal (perps) */}
      <ClosePositionModal
        position={perpsPositionToClose}
        onClose={() => setPerpsPositionToClose(null)}
        onConfirm={handleConfirmClose}
        isClosing={perpsPositionToClose ? closingPositions.has(perpsPositionToClose.id) : false}
      />
    </div>
  );
}

// ── Perps Row ──────────────────────────────────────────────────────────────

function PerpsPositionRow({
  row,
  isClosing,
  onClose,
}: {
  row: PerpsRow;
  isClosing: boolean;
  onClose: () => void;
}) {
  return (
    <div className="relative px-4 py-3 hover:bg-white/[0.02] transition-colors group">
      {/* Left accent bar */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-24 rounded-r-md pointer-events-none ${
          row.side === "long"
            ? "bg-gradient-to-r from-emerald-400/30 to-transparent"
            : "bg-gradient-to-r from-red-400/30 to-transparent"
        }`}
      />

      <div className="relative z-10 flex items-center gap-4">
        {/* Col 1: Asset + side + leverage */}
        <div className="flex items-center gap-2 w-40 shrink-0">
          <span className="font-medium text-white font-mono text-sm">
            {row.asset}
          </span>
          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
              row.side === "long"
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-red-500/15 text-red-400"
            }`}
          >
            {row.side.toUpperCase()}
          </span>
          <span className="font-mono text-[10px] text-white/60 px-1.5 py-0.5 bg-white/5 rounded">
            {Math.round(row.leverage)}x
          </span>
          <span className="text-[10px] text-white/30 font-mono px-1 py-0.5 bg-white/3 rounded">
            PERP
          </span>
        </div>

        {/* Col 2: Size + Value */}
        <div className="w-28 shrink-0 text-right">
          <div className="font-mono text-white text-sm">
            {row.size.toLocaleString(undefined, { maximumFractionDigits: 4 })}
          </div>
          <div className="font-mono text-white/40 text-[10px]">
            {formatUSD(row.size * row.markPrice)}
          </div>
        </div>

        {/* Col 3: Entry / Mark */}
        <div className="w-32 shrink-0 text-right">
          <div className="font-mono text-white/70 text-xs">
            {formatUSD(row.entryPrice)}
          </div>
          <div className="font-mono text-white text-xs">
            {formatUSD(row.markPrice)}
          </div>
        </div>

        {/* Col 4: P&L */}
        <div className="w-28 shrink-0 text-right">
          <div
            className={`font-mono text-sm font-medium ${
              row.pnl >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {formatPnl(row.pnl)}
          </div>
          <div
            className={`font-mono text-[10px] ${
              row.pnl >= 0 ? "text-emerald-400/70" : "text-red-400/70"
            }`}
          >
            {formatPct(row.pnlPercent)}
          </div>
        </div>

        {/* Col 5: Liq Price */}
        <div className="w-24 shrink-0 text-right">
          <div className="text-[10px] text-white/30 uppercase">Liq.</div>
          <div className="font-mono text-white/50 text-xs">
            {formatUSD(row.liqPrice)}
          </div>
        </div>

        {/* Col 6: TP/SL */}
        <div className="w-28 shrink-0 text-center">
          <div className="flex flex-col items-center gap-0.5">
            {row.takeProfit ? (
              <span className="font-mono text-emerald-400/80 text-[10px]">
                TP {formatUSD(row.takeProfit)}
              </span>
            ) : null}
            {row.stopLoss ? (
              <span className="font-mono text-red-400/80 text-[10px]">
                SL {formatUSD(row.stopLoss)}
              </span>
            ) : null}
            {!row.takeProfit && !row.stopLoss && (
              <span className="text-white/20 text-[10px]">-</span>
            )}
          </div>
        </div>

        {/* Col 7: Actions */}
        <div className="flex-1 flex justify-end">
          {isClosing ? (
            <div className="px-3 py-1.5 bg-red-700/50 text-white rounded-md text-xs font-sans flex items-center gap-2">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
              Closing...
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-md text-xs hover:bg-red-500/20 transition-colors font-sans border border-red-500/20"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Options Row ────────────────────────────────────────────────────────────

function OptionsPositionRow({
  row,
  showGreeks,
  isSettling,
  onSettle,
}: {
  row: OptionsRow;
  showGreeks: boolean;
  isSettling: boolean;
  onSettle: () => void;
}) {
  const urgencyClass = expiryUrgencyClass(row.daysToExpiry, row.isExpired);

  return (
    <div className="relative px-4 py-3 hover:bg-white/[0.02] transition-colors group">
      {/* Left accent bar: blue for calls, purple for puts */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-24 rounded-r-md pointer-events-none ${
          row.isCall
            ? "bg-gradient-to-r from-blue-400/25 to-transparent"
            : "bg-gradient-to-r from-purple-400/25 to-transparent"
        }`}
      />

      <div className="relative z-10">
        {/* Main row */}
        <div className="flex items-center gap-4">
          {/* Col 1: Option identity */}
          <div className="w-40 shrink-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-medium text-white font-mono text-sm">
                {row.asset}
              </span>
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                  row.isCall
                    ? "bg-blue-500/15 text-blue-400"
                    : "bg-purple-500/15 text-purple-400"
                }`}
              >
                {row.isCall ? "CALL" : "PUT"}
              </span>
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                  row.side === "long"
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-red-500/15 text-red-400"
                }`}
              >
                {row.side.toUpperCase()}
              </span>
            </div>
            <div className="font-mono text-white/50 text-[10px]">
              Strike {formatUSD(row.strikePrice, 0)}
              {row.isITM && (
                <span className="ml-1 text-emerald-400/80">ITM</span>
              )}
            </div>
          </div>

          {/* Col 2: Qty + contract info */}
          <div className="w-28 shrink-0 text-right">
            <div className="font-mono text-white text-sm">
              {row.quantity} <span className="text-white/30 text-[10px]">ct</span>
            </div>
            <div className="font-mono text-white/30 text-[10px]">
              {row.contractSize} per ct
            </div>
          </div>

          {/* Col 3: Entry / Current premium */}
          <div className="w-32 shrink-0 text-right">
            <div className="font-mono text-white/60 text-xs">
              Entry {formatUSD(row.entryPremium * row.contractSize)}
            </div>
            <div className="font-mono text-white text-xs">
              Mark {formatUSD(row.currentPremium * row.contractSize)}
            </div>
          </div>

          {/* Col 4: P&L */}
          <div className="w-28 shrink-0 text-right">
            <div
              className={`font-mono text-sm font-medium ${
                row.pnl >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {formatPnl(row.pnl)}
            </div>
            <div
              className={`font-mono text-[10px] ${
                row.pnl >= 0 ? "text-emerald-400/70" : "text-red-400/70"
              }`}
            >
              {formatPct(row.pnlPercent)}
            </div>
          </div>

          {/* Col 5: Expiry countdown */}
          <div className="w-24 shrink-0 text-right">
            <div
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold border ${urgencyClass}`}
            >
              {row.isExpired && (
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              )}
              {expiryLabel(row.daysToExpiry, row.isExpired)}
            </div>
          </div>

          {/* Col 6: Margin locked */}
          <div className="w-28 shrink-0 text-center">
            <div className="text-[10px] text-white/30 uppercase">Margin</div>
            <div className="font-mono text-white/50 text-xs">
              {formatUSD(row.marginLocked)}
            </div>
          </div>

          {/* Col 7: Actions */}
          <div className="flex-1 flex justify-end gap-2">
            {row.isExpired ? (
              isSettling ? (
                <div className="px-3 py-1.5 bg-emerald-700/50 text-white rounded-md text-xs font-sans flex items-center gap-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                  Settling...
                </div>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); onSettle(); }}
                  className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-md text-xs hover:bg-emerald-500/20 transition-colors font-sans border border-emerald-500/20"
                >
                  Settle
                </button>
              )
            ) : (
              <button
                onClick={(e) => e.stopPropagation()}
                className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-md text-xs hover:bg-red-500/20 transition-colors font-sans border border-red-500/20"
              >
                Close
              </button>
            )}
          </div>
        </div>

        {/* Greeks row (expandable) */}
        {showGreeks && (
          <div className="mt-2 flex items-center gap-4 pl-1">
            <GreekBadge label="IV" value={`${(row.iv * 100).toFixed(1)}%`} />
            <GreekBadge label="\u0394" value={row.delta.toFixed(3)} />
            <GreekBadge label="\u0393" value={row.gamma.toFixed(4)} />
            <GreekBadge label="\u0398" value={`$${row.theta.toFixed(2)}/d`} />
            <GreekBadge label="V" value={`$${row.vega.toFixed(2)}`} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Greek Badge ────────────────────────────────────────────────────────────

function GreekBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1 px-2 py-0.5 bg-white/3 rounded">
      <span className="text-white/30 text-[9px] font-medium uppercase">
        {label}
      </span>
      <span className="text-white/70 text-[10px] font-mono">{value}</span>
    </div>
  );
}

// ── Loading Skeleton ───────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-0">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-3 border-b border-white/[0.03]"
        >
          <div className="w-40"><GhostSquare size="md" /></div>
          <div className="w-28"><GhostSquare size="sm" /></div>
          <div className="w-32"><GhostSquare size="md" /></div>
          <div className="w-28"><GhostSquare size="sm" /></div>
          <div className="w-24"><GhostSquare size="xs" /></div>
          <div className="w-28"><GhostSquare size="sm" /></div>
          <div className="flex-1 flex justify-end"><GhostSquare size="lg" /></div>
        </div>
      ))}
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: TabId }) {
  const messages: Record<TabId, { title: string; sub: string }> = {
    all: {
      title: "No open positions",
      sub: "Your perpetual and options positions will appear here",
    },
    perps: {
      title: "No perpetual positions",
      sub: "Open a position from the trading page",
    },
    options: {
      title: "No options positions",
      sub: "Trade options to see your positions here",
    },
  };

  const msg = messages[tab];

  return (
    <div className="py-12 flex flex-col items-center justify-center">
      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
        <svg
          className="w-5 h-5 text-white/20"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
          />
        </svg>
      </div>
      <div className="text-sm text-white/50 font-sans">{msg.title}</div>
      <div className="text-xs text-white/25 mt-1 font-sans">{msg.sub}</div>
    </div>
  );
}
