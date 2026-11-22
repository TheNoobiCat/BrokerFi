"use client";

import { useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { useOptionsPositions, type EnrichedOptionsPosition } from "@/hooks/useOptionsPositions";
import { settleOptionsPosition } from "@/services/options";
import { useSession } from "@/store/SessionContext";
import { GhostSquare } from "@/components/ui/GhostSquare";

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

// ── Props ──────────────────────────────────────────────────────────────────

interface OptionsPositionsTableProps {
  spotPrices?: Record<string, number>;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function OptionsPositionsTable({
  spotPrices,
  isCollapsed,
  onToggleCollapse,
}: OptionsPositionsTableProps) {
  const [showGreeks, setShowGreeks] = useState(false);
  const [settlingIds, setSettlingIds] = useState<Set<string>>(new Set());

  const { channelAddress } = useSession();
  const { positions, loading } = useOptionsPositions(spotPrices);

  const totalPnl = positions.reduce((s, p) => s + p.pnl, 0);

  const handleSettle = async (pos: EnrichedOptionsPosition) => {
    if (!channelAddress || !pos.underlyingPriceFeedId) return;

    setSettlingIds((prev) => new Set(prev).add(pos.seriesId));

    try {
      const result = await settleOptionsPosition({
        channelAddress: channelAddress as `0x${string}`,
        traderAddress: channelAddress as `0x${string}`,
        seriesId: pos.seriesId,
        underlyingPriceFeedId: pos.underlyingPriceFeedId,
        onSubmitted: () => console.log("[Settle] Submitted for", pos.seriesId),
        onSuccess: () => console.log("[Settle] Success for", pos.seriesId),
        onError: (err) => console.error("[Settle] Error for", pos.seriesId, err),
      });

      if (!result.success) {
        console.error("[Settle] Failed:", result.error);
      }
    } catch (err) {
      console.error("[Settle] Exception:", err);
    } finally {
      setSettlingIds((prev) => {
        const next = new Set(prev);
        next.delete(pos.seriesId);
        return next;
      });
    }
  };

  return (
    <div className="broker-card">
      {/* Header */}
      <div
        className="p-4 border-b border-white/6 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white font-sans">
            Options Positions ({positions.length})
          </h3>
          {isCollapsed ? (
            <FaChevronDown className="text-white/50 text-sm" />
          ) : (
            <FaChevronUp className="text-white/50 text-sm" />
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Greeks toggle */}
          {positions.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowGreeks((p) => !p);
              }}
              className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all border ${
                showGreeks
                  ? "bg-blue-500/15 text-blue-400 border-blue-500/20"
                  : "bg-white/5 text-white/40 border-white/10 hover:text-white/60"
              }`}
            >
              Greeks
            </button>
          )}

          {/* Aggregate P&L */}
          {positions.length > 0 && (
            <div
              className={`text-sm font-mono font-semibold ${
                totalPnl >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {formatPnl(totalPnl)}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      {!isCollapsed && (
        <div className="overflow-auto">
          {loading ? (
            <LoadingSkeleton />
          ) : positions.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-white/40 text-sm font-sans">
                No open options positions
              </p>
            </div>
          ) : (
            <div className="min-w-full">
              {/* Column headers */}
              <div className="grid grid-cols-12 gap-4 pl-6 pr-4 py-3 text-xs font-medium text-white/50 uppercase tracking-wider bg-white/[0.02] border-b border-white/[0.05]">
                <div className="col-span-2">Option</div>
                <div className="col-span-1 text-right">Qty</div>
                <div className="col-span-2 text-right">Entry / Mark</div>
                <div className="col-span-2 text-right">P&L</div>
                <div className="col-span-1 text-center">Expiry</div>
                <div className="col-span-2 text-right">Margin</div>
                <div className="col-span-2 text-center">Actions</div>
              </div>

              {/* Position rows */}
              {positions.map((pos) => (
                <PositionRow
                  key={pos.seriesId}
                  pos={pos}
                  showGreeks={showGreeks}
                  isSettling={settlingIds.has(pos.seriesId)}
                  onSettle={() => handleSettle(pos)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Position Row ───────────────────────────────────────────────────────────

function PositionRow({
  pos,
  showGreeks,
  isSettling,
  onSettle,
}: {
  pos: EnrichedOptionsPosition;
  showGreeks: boolean;
  isSettling: boolean;
  onSettle: () => void;
}) {
  const urgencyClass = expiryUrgencyClass(pos.daysToExpiry, pos.isExpired);

  return (
    <div className="relative hover:bg-white/[0.02] transition-colors group">
      {/* Left accent: blue=call, purple=put */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-20 rounded-r-md pointer-events-none ${
          pos.isCall
            ? "bg-gradient-to-r from-blue-400/20 to-transparent"
            : "bg-gradient-to-r from-purple-400/20 to-transparent"
        }`}
      />

      <div className="relative z-10 grid grid-cols-12 gap-4 px-4 py-4 border-b border-white/[0.03] items-center">
        {/* Col 1: Option identity */}
        <div className="col-span-2 pl-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-white font-mono text-sm">
              {pos.asset}
            </span>
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                pos.isCall
                  ? "bg-blue-500/15 text-blue-400"
                  : "bg-purple-500/15 text-purple-400"
              }`}
            >
              {pos.isCall ? "CALL" : "PUT"}
            </span>
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                pos.isLong
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-red-500/15 text-red-400"
              }`}
            >
              {pos.isLong ? "LONG" : "SHORT"}
            </span>
          </div>
          <div className="font-mono text-white/50 text-[10px]">
            Strike {formatUSD(pos.strikePrice, 0)}
            {pos.isITM && (
              <span className="ml-1 text-emerald-400/80">ITM</span>
            )}
          </div>
        </div>

        {/* Col 2: Qty */}
        <div className="col-span-1 text-right">
          <div className="font-mono text-white text-sm">
            {pos.quantity} <span className="text-white/30 text-[10px]">ct</span>
          </div>
          <div className="font-mono text-white/30 text-[10px]">
            {pos.contractSize} per ct
          </div>
        </div>

        {/* Col 3: Entry / Mark premium */}
        <div className="col-span-2 text-right">
          <div className="font-mono text-white/60 text-xs">
            Entry {formatUSD(pos.entryPrice * pos.contractSize)}
          </div>
          <div className="font-mono text-white text-xs">
            Mark {formatUSD(pos.currentPremium * pos.contractSize)}
          </div>
        </div>

        {/* Col 4: P&L */}
        <div className="col-span-2 text-right">
          <div
            className={`font-mono text-sm font-medium ${
              pos.pnl >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {formatPnl(pos.pnl)}
          </div>
          <div
            className={`font-mono text-[10px] ${
              pos.pnl >= 0 ? "text-emerald-400/70" : "text-red-400/70"
            }`}
          >
            {formatPct(pos.pnlPercent)}
          </div>
        </div>

        {/* Col 5: Expiry countdown */}
        <div className="col-span-1 flex justify-center">
          <div
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold border ${urgencyClass}`}
          >
            {pos.isExpired && (
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            )}
            {expiryLabel(pos.daysToExpiry, pos.isExpired)}
          </div>
        </div>

        {/* Col 6: Margin locked */}
        <div className="col-span-2 text-right">
          <div className="text-[10px] text-white/30 uppercase">Locked</div>
          <div className="font-mono text-white/50 text-xs">
            {formatUSD(pos.marginLocked)}
          </div>
        </div>

        {/* Col 7: Actions */}
        <div className="col-span-2 flex justify-center gap-2">
          {pos.isExpired ? (
            isSettling ? (
              <div className="px-3 py-1.5 bg-emerald-700/50 text-white rounded-md text-xs font-sans flex items-center gap-2">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                Settling...
              </div>
            ) : (
              <button
                onClick={() => onSettle()}
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

      {/* Greeks row */}
      {showGreeks && (
        <div className="relative z-10 flex items-center gap-4 px-6 pb-3 pt-1">
          <GreekBadge label="IV" value={`${(pos.iv * 100).toFixed(1)}%`} />
          <GreekBadge label={"\u0394"} value={pos.delta.toFixed(3)} />
          <GreekBadge label={"\u0393"} value={pos.gamma.toFixed(4)} />
          <GreekBadge label={"\u0398"} value={`$${pos.theta.toFixed(2)}/d`} />
          <GreekBadge label="V" value={`$${pos.vega.toFixed(2)}`} />
        </div>
      )}
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
          className="grid grid-cols-12 gap-4 px-4 py-4 border-b border-white/[0.03]"
        >
          <div className="col-span-2"><GhostSquare size="md" /></div>
          <div className="col-span-1"><GhostSquare size="sm" /></div>
          <div className="col-span-2"><GhostSquare size="md" /></div>
          <div className="col-span-2"><GhostSquare size="sm" /></div>
          <div className="col-span-1"><GhostSquare size="xs" /></div>
          <div className="col-span-2"><GhostSquare size="sm" /></div>
          <div className="col-span-2"><GhostSquare size="lg" /></div>
        </div>
      ))}
    </div>
  );
}
