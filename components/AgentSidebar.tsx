"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Turnstile from "react-turnstile";
import { useUI } from "@/store/UIContext";
import MarkdownRenderer from "./MarkdownRenderer";
import Portal from "./ui/Portal";
import Logo from "./icons/Logo";
import { useGrok, ChatMessage, TradeData, CloseTradeData } from "@/hooks/useGrok";
import { useChatHistory, ChatHistoryEntry } from "@/hooks/useChatHistory";
import { GrokToolCall } from "@/services/grokClient";
import { useSession } from "@/store/SessionContext";
import { useAccount, useWalletClient } from "wagmi";
import { openPerpsPosition, placeLimitOrder, closePerpsPosition } from "@/services/perps";
import { getUSDCAddress } from "@/services/perpsMarkets";
import { useTradingContext } from "@/store/TradingContext";

// The same spinner used for Buy/Long buttons in TradingButtons.tsx
function Spinner({ size = 4 }: { size?: number }) {
  return (
    <div
      className={`animate-spin rounded-full border-b-2 border-white`}
      style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
    />
  );
}

// Tool call card — shows "Calling <tool>" with spinner, then result
function ToolCallCard({
  call,
  isPending,
  result,
}: {
  call: GrokToolCall;
  isPending: boolean;
  result?: string;
}) {
  let parsedArgs: Record<string, unknown> = {};
  try {
    parsedArgs = JSON.parse(call.function.arguments || "{}");
  } catch {
    // ignore
  }

  const getFriendlyName = (name: string) => {
    const friendlyNames: Record<string, string> = {
      get_available_assets: "Fetching available assets",
      get_perp_symbols: "Loading perpetual symbols",
      search_asset: "Searching for asset",
      get_current_market: "Checking market data",
      get_open_positions: "Reviewing open positions",
      get_position_detail: "Analysing position details",
      get_account_summary: "Checking account summary",
      get_historical_candles: "Fetching historical price data",
      get_technical_indicators: "Analysing technical indicators",
      check_liquidation_risk: "Assessing liquidation risk",
      execute_perp_trade: "Executing perpetual trade",
      close_perp_position: "Closing perpetual position",
      set_cooldown: "Setting cooldown timer",
    };
    return friendlyNames[name] || name;
  };

  return (
    <div className="p-3 bg-white/5 rounded-lg border border-white/10 space-y-1">
      <div className="flex items-center gap-2">
        {isPending ? (
          <Spinner size={3} />
        ) : (
          <svg
            className="w-3 h-3 text-green-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
        <span className="text-xs font-semibold text-blue-400">
          {isPending ? "Calling" : "Called"}{" "}
          <span className="text-white/80">{getFriendlyName(call.function.name)}</span>
        </span>
      </div>
      {Object.keys(parsedArgs).length > 0 && (
        <div className="text-[10px] text-white/40 font-mono pl-5 truncate">
          {JSON.stringify(parsedArgs)}
        </div>
      )}
    </div>
  );
}

// ── Collapsible tool call group (>1 tool) or single card ──

function ToolCallGroup({ message }: { message: ChatMessage }) {
  const [expanded, setExpanded] = useState(false);
  const calls = message.toolCalls ?? [];
  const pendingCount = message.pendingTools?.size ?? 0;
  const allDone = pendingCount === 0;

  // Single tool call — render directly
  if (calls.length <= 1) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[90%] space-y-2">
          {calls.map((call) => (
            <ToolCallCard
              key={call.id}
              call={call}
              isPending={message.pendingTools?.has(call.id) ?? false}
              result={message.toolResults?.get(call.id)}
            />
          ))}
        </div>
      </div>
    );
  }

  // Multiple tool calls — collapsible group
  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] w-full">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-2 p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/[0.07] transition-colors"
        >
          {!allDone ? (
            <Spinner size={3} />
          ) : (
            <svg
              className="w-3 h-3 text-green-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
          <span className="text-xs font-semibold text-blue-400 flex-1 text-left">
            {allDone ? "Called" : "Calling"} {calls.length} Tools
          </span>
          <svg
            className={`w-3.5 h-3.5 text-white/40 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expanded && (
          <div className="mt-2 space-y-2 pl-2 border-l-2 border-white/10">
            {calls.map((call) => (
              <ToolCallCard
                key={call.id}
                call={call}
                isPending={message.pendingTools?.has(call.id) ?? false}
                result={message.toolResults?.get(call.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Trade confirmation card ──

function TradeConfirmationCard({
  message,
  onConfirm,
  onReject,
}: {
  message: ChatMessage;
  onConfirm: () => void;
  onReject: () => void;
}) {
  const trade = message.tradeData;
  if (!trade) return null;

  const status = message.tradeStatus ?? 'pending';
  const isLong = trade.side === 'long';
  const dirColor = isLong ? 'text-emerald-400' : 'text-red-400';
  const dirBg = isLong ? 'bg-gray-500/5 border-gray-500/20' : 'bg-red-500/5 border-red-500/20';
  const dirLabel = isLong ? 'LONG' : 'SHORT';

  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    pending: { label: 'Awaiting Confirmation', color: 'text-yellow-400', icon: null },
    confirmed: { label: 'Confirmed', color: 'text-blue-400', icon: <Spinner size={3} /> },
    executing: { label: 'Executing...', color: 'text-blue-400', icon: <Spinner size={3} /> },
    success: {
      label: 'Executed',
      color: 'text-green-400',
      icon: (
        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    failed: {
      label: 'Failed',
      color: 'text-red-400',
      icon: (
        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
    },
    rejected: {
      label: 'Rejected',
      color: 'text-white/40',
      icon: (
        <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      ),
    },
  };

  const statusInfo = statusConfig[status] || statusConfig.pending;

  return (
    <div className="flex justify-start">
      <div className={`w-full max-w-[95%] rounded-xl border ${dirBg} overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div>
              <div className="flex items-center gap-1">
                <span className={`text-sm font-bold ${dirColor}`}>{dirLabel}</span>
                <span className="text-sm font-semibold text-white">{trade.asset}</span>
              </div>
              <span className="text-[10px] text-white/40 uppercase">{trade.orderType} order</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {statusInfo.icon}
            <span className={`text-[11px] font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
          </div>
        </div>

        {/* Trade Details */}
        <div className="px-4 py-3 space-y-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-white/40">Collateral</span>
              <span className="text-white font-mono">{trade.collateralUsdc} USDC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Leverage</span>
              <span className="text-white font-mono">{trade.leverage}x</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Size</span>
              <span className="text-white font-mono">${trade.positionSizeUsd.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Entry</span>
              <span className="text-white font-mono">${trade.entryPrice.toLocaleString()}</span>
            </div>
            {trade.stopLoss && (
              <div className="flex justify-between">
                <span className="text-white/40">Stop Loss</span>
                <span className="text-red-400 font-mono">${trade.stopLoss.toLocaleString()}</span>
              </div>
            )}
            {trade.takeProfit && (
              <div className="flex justify-between">
                <span className="text-white/40">Take Profit</span>
                <span className="text-green-400 font-mono">${trade.takeProfit.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Error message */}
        {message.tradeError && (
          <div className="px-4 pb-2">
            <p className="text-[11px] text-red-400 break-words">{message.tradeError}</p>
          </div>
        )}

        {/* Action buttons — only show for pending */}
        {status === 'pending' && (
          <div className="flex gap-2 px-4 pb-3">
            <button
              onClick={onReject}
              className="flex-1 px-3 py-2 text-xs font-medium text-white/60 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
            >
              Reject
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-3 py-2 text-xs font-bold text-white rounded-lg transition-all ${
                isLong
                  ? 'bg-gray-600/80 hover:bg-gray-500 border border-gray-500/50'
                  : 'bg-red-600/80 hover:bg-red-500 border border-red-500/50'
              }`}
            >
              Confirm {dirLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Close position confirmation card ──

function CloseConfirmationCard({
  message,
  onConfirm,
  onReject,
}: {
  message: ChatMessage;
  onConfirm: () => void;
  onReject: () => void;
}) {
  const position = message.closeTradeData;
  if (!position) return null;

  const status = message.tradeStatus ?? 'pending';
  const isLong = position.side === 'long';
  const isProfitable = position.pnl >= 0;

  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    pending: { label: 'Awaiting Confirmation', color: 'text-yellow-400', icon: null },
    confirmed: { label: 'Confirmed', color: 'text-blue-400', icon: <Spinner size={3} /> },
    executing: { label: 'Closing...', color: 'text-blue-400', icon: <Spinner size={3} /> },
    success: {
      label: 'Closed',
      color: 'text-green-400',
      icon: (
        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    failed: {
      label: 'Failed',
      color: 'text-red-400',
      icon: (
        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
    },
    rejected: {
      label: 'Rejected',
      color: 'text-white/40',
      icon: (
        <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      ),
    },
  };

  const statusInfo = statusConfig[status] || statusConfig.pending;

  return (
    <div className="flex justify-start">
      <div className="w-full max-w-[95%] rounded-xl border bg-orange-500/5 border-orange-500/20 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-orange-400">✕</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-orange-400">CLOSE</span>
                <span className="text-sm font-semibold text-white">{position.market}</span>
              </div>
              <span className="text-[10px] text-white/40 uppercase">
                {isLong ? 'Long' : 'Short'} position
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {statusInfo.icon}
            <span className={`text-[11px] font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
          </div>
        </div>

        {/* Position Details */}
        <div className="px-4 py-3 space-y-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-white/40">Size</span>
              <span className="text-white font-mono">${position.sizeUsd.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Collateral</span>
              <span className="text-white font-mono">${position.collateralUsd.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Entry</span>
              <span className="text-white font-mono">${position.entryPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Current</span>
              <span className="text-white font-mono">${position.currentPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between col-span-2">
              <span className="text-white/40">PnL</span>
              <span className={`font-mono font-bold ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
                {isProfitable ? '+' : ''}${position.pnl.toFixed(2)} ({isProfitable ? '+' : ''}{position.pnlPercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Error message */}
        {message.tradeError && (
          <div className="px-4 pb-2">
            <p className="text-[11px] text-red-400 break-words">{message.tradeError}</p>
          </div>
        )}

        {/* Action buttons — only show for pending */}
        {status === 'pending' && (
          <div className="flex gap-2 px-4 pb-3">
            <button
              onClick={onReject}
              className="flex-1 px-3 py-2 text-xs font-medium text-white/60 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-3 py-2 text-xs font-bold text-white rounded-lg transition-all bg-orange-600/80 hover:bg-orange-500 border border-orange-500/50"
            >
              Confirm Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Auto-confirm countdown overlay for autonomous mode ──

const AUTO_CONFIRM_DELAY = 2000; // 2 seconds

function AutoConfirmOverlay({
  messageId,
  onConfirm,
  onCancel,
}: {
  messageId: string;
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(0);
  const confirmedRef = useRef(false);

  useEffect(() => {
    startRef.current = Date.now();
    const frame = () => {
      const now = Date.now();
      const e = now - startRef.current;
      setElapsed(e);
      if (e >= AUTO_CONFIRM_DELAY && !confirmedRef.current) {
        confirmedRef.current = true;
        onConfirm(messageId);
        return;
      }
      rafId = requestAnimationFrame(frame);
    };
    let rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [messageId, onConfirm]);

  const progress = Math.min(elapsed / AUTO_CONFIRM_DELAY, 1);

  return (
    <div className="mt-1 space-y-1.5 w-full max-w-[95%]">
      {/* Progress bar */}
      <div className="relative h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-orange-500 to-orange-400 transition-none"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            confirmedRef.current = true;
            onCancel(messageId);
          }}
          className="flex-1 px-2 py-1.5 text-[11px] font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors"
        >
          ✕ Cancel
        </button>
        <button
          onClick={() => {
            confirmedRef.current = true;
            onConfirm(messageId);
          }}
          className="flex-1 px-2 py-1.5 text-[11px] font-medium text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-lg transition-colors"
        >
          ✓ Confirm Now
        </button>
        <span className="text-[10px] text-white/40 tabular-nums w-8 text-right">
          {Math.max(0, Math.ceil((AUTO_CONFIRM_DELAY - elapsed) / 1000))}s
        </span>
      </div>
    </div>
  );
}

// Renders a single chat message bubble
function MessageBubble({ message, onConfirmTrade, onRejectTrade, autonomousMode }: { message: ChatMessage; onConfirmTrade?: (id: string) => void; onRejectTrade?: (id: string) => void; autonomousMode?: boolean }) {
  if (message.role === "tool_call") {
    return <ToolCallGroup message={message} />;
  }

  if (message.role === "tool_executing") {
    return (
      <div className="flex justify-start">
        <div className="max-w-[90%] p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
          <div className="flex items-center gap-2">
            <Spinner size={3} />
            <span className="text-xs font-semibold text-purple-400">
              Subagent Started
            </span>
          </div>
          {message.content && (
            <div className="text-[10px] text-white/50 mt-1 pl-5">
              {message.content}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (message.role === "tool_complete") {
    return (
      <div className="flex justify-start">
        <div className="max-w-[90%] p-3 bg-purple-500/5 rounded-lg border border-purple-500/20">
          <div className="flex items-center gap-2">
            <svg
              className="w-3 h-3 text-purple-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-xs font-semibold text-purple-400">
              Subagent Finished
            </span>
          </div>
          {message.content && (
            <div className="text-[10px] text-white/50 mt-1 pl-5">
              {message.content}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (message.role === "trade_confirmation") {
    const showAutoConfirm = autonomousMode && message.tradeStatus === 'pending';
    return (
      <div>
        <TradeConfirmationCard
          message={message}
          onConfirm={() => onConfirmTrade?.(message.id)}
          onReject={() => onRejectTrade?.(message.id)}
        />
        {showAutoConfirm && onConfirmTrade && onRejectTrade && (
          <AutoConfirmOverlay
            messageId={message.id}
            onConfirm={onConfirmTrade}
            onCancel={onRejectTrade}
          />
        )}
      </div>
    );
  }

  if (message.role === "close_confirmation") {
    const showAutoConfirm = autonomousMode && message.tradeStatus === 'pending';
    return (
      <div>
        <CloseConfirmationCard
          message={message}
          onConfirm={() => onConfirmTrade?.(message.id)}
          onReject={() => onRejectTrade?.(message.id)}
        />
        {showAutoConfirm && onConfirmTrade && onRejectTrade && (
          <AutoConfirmOverlay
            messageId={message.id}
            onConfirm={onConfirmTrade}
            onCancel={onRejectTrade}
          />
        )}
      </div>
    );
  }

  if (message.role === "error") {
    return null; // Removed error message bubble
  }

  if (message.role === "info") {
    return null; // Removed italic info message
  }

  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[95%] px-4 py-2 rounded-lg ${
          isUser ? "bg-blue-600 text-white" : "bg-white/10 text-white"
        }`}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="text-sm">
            <MarkdownRenderer content={message.content} />
          </div>
        )}
        <p className="text-xs opacity-70 mt-1">
          {message.timestamp.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}

// ── Session list screen ──

function SessionListScreen({
  sessions,
  onSelect,
  onCreate,
  onDelete,
  onDeleteAll,
  onRename,
}: {
  sessions: ChatHistoryEntry[];
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onDeleteAll: () => void;
  onRename: (id: string, name: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  // Group sessions by relative time label
  const grouped = sessions.reduce<Record<string, ChatHistoryEntry[]>>((acc, s) => {
    (acc[s.label] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="h-full flex flex-col">
      {/* Top section */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <img src="/logo/vibetrading.svg" alt="VibeTrading" className="h-6 w-auto" />
            <span className="text-xs text-white/40 flex items-center gap-1">
              <Logo scale={0.6} /> v0.1
            </span>
          </div>
        </div>

        <button
          onClick={onCreate}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {Object.entries(grouped).map(([label, items]) => (
          <div key={label}>
            <p className="text-[11px] font-medium text-white/30 uppercase tracking-wider px-1 mb-1.5">
              {label}
            </p>
            <div className="space-y-1">
              {items.map((s) => (
                <div
                  key={s.id}
                  className="group flex items-center rounded-lg hover:bg-white/5 transition-colors"
                >
                  {editingId === s.id ? (
                    <form
                      className="flex-1 flex items-center gap-1 px-3 py-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (editName.trim()) onRename(s.id, editName.trim());
                        setEditingId(null);
                      }}
                    >
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => setEditingId(null)}
                        className="flex-1 bg-white/10 border border-white/20 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-400"
                      />
                    </form>
                  ) : (
                    <>
                      <button
                        onClick={() => onSelect(s.id)}
                        className="flex-1 text-left px-3 py-2 min-w-0"
                      >
                        <p className="text-sm text-white/80 truncate">{s.name}</p>
                        <p className="text-[11px] text-white/30">
                          {s.messageCount} message{s.messageCount !== 1 ? "s" : ""}
                        </p>
                      </button>
                      <div className="flex items-center gap-0.5 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingId(s.id);
                            setEditName(s.name);
                          }}
                          className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white/70"
                          title="Rename"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onDelete(s.id)}
                          className="p-1 rounded hover:bg-red-500/20 text-white/40 hover:text-red-400"
                          title="Delete"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer — delete all */}
      {sessions.length > 0 && (
        <div className="p-3 border-t border-white/10">
          {confirmDeleteAll ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-400 flex-1">Delete all chats?</span>
              <button
                onClick={() => {
                  onDeleteAll();
                  setConfirmDeleteAll(false);
                }}
                className="px-3 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded border border-red-500/30 transition-colors"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmDeleteAll(false)}
                className="px-3 py-1 text-xs bg-white/5 hover:bg-white/10 text-white/60 rounded border border-white/10 transition-colors"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDeleteAll(true)}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete All Chats
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Welcome screen (shown only when user has zero chat history) ──

function WelcomeScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="h-full flex flex-col">
      <div className="p-6 text-center border-b border-white/10">
        <div className="mb-4">
          <div className="mb-4">
            <div className="flex justify-center mb-4 mt-4">
              <img src="/logo/vibetrading.svg" alt="VibeTrading" className="h-12 w-auto" />
            </div>
            <span className="text-xs text-white/60 ml-2 self-end flex justify-center items-center gap-1.5">
              <Logo scale={0.7} />
              BrokerFi Vibetrader v0.1
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">What I Can Do</h3>
        <div className="space-y-3">
          {[
            ["Autonomous Trading", "Place trades on BrokerFi Options, Perpetuals and more. Anything you can do manually, I can do for you."],
            ["Capital Growth", "Find opportunities to grow your capital on BrokerFi"],
            ["Expert Market Advice", "Get insights on market conditions and trends"],
            ["Data Analysis", "Analyze charts, patterns, and market data"],
            ["Strategy Development", "Build and optimize trading strategies"],
            ["Answer Questions", "Ask anything about trading and markets"],
          ].map(([title, desc]) => (
            <div key={title} className="p-3 bg-white/5 rounded-lg border border-white/10">
              <h4 className="text-white font-medium text-sm mb-1">{title}</h4>
              <p className="text-white/60 text-xs">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 border-t border-white/10">
        <button
          onClick={onContinue}
          className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors border border-white/20"
        >
          Continue
        </button>
        <div className="mt-3 text-center">
          <p className="text-white/50 text-xs mt-2">
            <b>Completely free</b> (Rate limits may apply)
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main sidebar ──

type SidebarView = "welcome" | "sessions" | "chat";

export default function AgentSidebar() {
  const { agentSidebarOpen, setAgentSidebarOpen, chartContext, setChartContext, queuedAgentMessage, setQueuedAgentMessage, showToast } = useUI();
  const [prompt, setPrompt] = useState("");
  const [tooltipVisible, setTooltipVisible] = useState<'ask' | 'autonomous' | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const askBtnRef = useRef<HTMLButtonElement>(null);
  const autoBtnRef = useRef<HTMLButtonElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

  // Track if initial autonomous instruction has been sent
  const [autonomousInstructionSent, setAutonomousInstructionSent] = useState(false);
  const [wasInCooldown, setWasInCooldown] = useState(false);

  const { channelAddress } = useSession();
  const { isConnected: walletConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { refreshPositions, removePosition } = useTradingContext();

  const {
    messages,
    connectionState,
    isStreaming,
    autonomousMode,
    setAutonomousMode,
    cooldownEndTime,
    cooldownReason,
    clearCooldown,
    connect,
    sendMessage,
    clearChat,
    loadMessages,
    sendCaptchaToken,
    confirmTrade,
    completeTradeExecution,
    rejectTrade,
    updateTradeStatus,
  } = useGrok();

  // Derive UI mode from autonomousMode state
  const mode = autonomousMode ? 'autonomous' : 'ask';

  const {
    sessions,
    activeSessionId,
    loading: historyLoading,
    createSession,
    loadSession,
    persistMessages,
    renameSession,
    removeSession,
    removeAllSessions,
    backToList,
  } = useChatHistory();

  // Determine which view to show
  const view: SidebarView = useMemo(() => {
    if (historyLoading) return "welcome";
    if (activeSessionId) return "chat";
    if (sessions.length > 0) return "sessions";
    return "welcome";
  }, [activeSessionId, sessions.length, historyLoading]);

  // Connect when entering chat view
  useEffect(() => {
    if (agentSidebarOpen && view === "chat") {
      connect();
    }
  }, [agentSidebarOpen, view, connect]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      setMounted(true);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Reset captcha state when server asks again
  useEffect(() => {
    if (connectionState === "captcha_required") {
      setCaptchaToken(null);
      setCaptchaError(null);
    }
  }, [connectionState]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Persist messages whenever the latest message content changes (not just count)
  const lastPersistSignatureRef = useRef<string>("");
  useEffect(() => {
    if (!activeSessionId || messages.length === 0) return;
    const last = messages[messages.length - 1];
    const signature = `${messages.length}:${last?.id}:${last?.role}:${last?.content}`;
    if (signature === lastPersistSignatureRef.current) return;
    lastPersistSignatureRef.current = signature;
    persistMessages(messages);
  }, [messages, activeSessionId, persistMessages]);

  // ── Handlers ──

  const handleSendMessage = () => {
    if (!prompt.trim() || isStreaming) return;
    if (isInCooldown && autonomousMode) {
      showToast(`Cooldown active: ${cooldownReason}. ${cooldownRemaining}s remaining.`, 'error');
      return;
    }
    const userMessage = chartContext ? `${chartContext}\n\n${prompt}` : prompt;
    const finalPrompt = autonomousMode 
      ? `Go autonomous. Scan all markets, find A+ setups, and start executing. I'll cancel if needed. Note: ${userMessage}. understand?`
      : userMessage;
    sendMessage(finalPrompt);
    setPrompt("");
    setChartContext(null);
    
    // Mark that autonomous instruction has been sent
    if (autonomousMode && !autonomousInstructionSent) {
      setAutonomousInstructionSent(true);
    }
  };

  const handleToggleAutonomous = useCallback((on: boolean) => {
    setAutonomousMode(on);
    if (!on && autonomousInstructionSent) {
      setAutonomousInstructionSent(false);
      sendMessage("Stop autonomous mode. Switch back to interactive.");
    }
  }, [setAutonomousMode, sendMessage, autonomousInstructionSent]);

  // Stop autonomous mode (used by the stop button)
  const handleStopAutonomous = useCallback(() => {
    setAutonomousMode(false);
    setAutonomousInstructionSent(false); // Reset the instruction sent flag
    clearCooldown(); // Clear any active cooldown
    sendMessage("STOP. Halt all autonomous trading immediately. Go back to interactive mode.");
  }, [setAutonomousMode, clearCooldown, sendMessage]);

  // Force re-render every second while cooldown is active so the timer counts down
  const [, setTick] = useState(0);
  useEffect(() => {
    if (cooldownEndTime === null) return;
    const interval = setInterval(() => {
      if (Date.now() >= cooldownEndTime) {
        clearCooldown();
        clearInterval(interval);
      }
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownEndTime, clearCooldown]);

  // Check if cooldown is active
  const isInCooldown = cooldownEndTime !== null && Date.now() < cooldownEndTime;

  // Cooldown remaining time in seconds
  const cooldownRemaining = isInCooldown
    ? Math.ceil((cooldownEndTime! - Date.now()) / 1000)
    : 0;

  // Handle cooldown end — resume autonomous trading
  useEffect(() => {
    if (wasInCooldown && !isInCooldown && autonomousMode && autonomousInstructionSent) {
      sendMessage("Cooldown ended. Resuming autonomous trading operations.");
    }
    setWasInCooldown(isInCooldown);
  }, [isInCooldown, autonomousMode, autonomousInstructionSent, sendMessage, wasInCooldown]);

  // Override cooldown (emergency)
  const handleOverrideCooldown = useCallback(() => {
    clearCooldown();
  }, [clearCooldown]);

  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token);
    setCaptchaError(null);
    sendCaptchaToken(token);
  };

  const handleNewChat = useCallback(() => {
    clearChat();
    createSession();
  }, [clearChat, createSession]);

  const handleSelectSession = useCallback(
    async (id: string) => {
      const msgs = await loadSession(id);
      loadMessages(msgs);
    },
    [loadSession, loadMessages]
  );

  const handleBackToList = useCallback(() => {
    clearChat();
    lastPersistSignatureRef.current = "";
    backToList();
  }, [clearChat, backToList]);

  const handleDeleteSession = useCallback(
    async (id: string) => {
      if (id === activeSessionId) {
        clearChat();
        lastPersistSignatureRef.current = "";
      }
      await removeSession(id);
    },
    [activeSessionId, clearChat, removeSession]
  );

  const handleDeleteAll = useCallback(async () => {
    clearChat();
    lastPersistSignatureRef.current = "";
    await removeAllSessions();
  }, [clearChat, removeAllSessions]);

  const handleWelcomeContinue = useCallback(() => {
    handleNewChat();
  }, [handleNewChat]);

  // ── Trade execution handlers ──

  const handleConfirmTrade = useCallback(async (messageId: string) => {
    // Find the confirmation message
    const tradeMsg = messages.find((m) => m.id === messageId);

    // ── Close position path ──
    if (tradeMsg?.role === 'close_confirmation' && tradeMsg.closeTradeData) {
      const position = tradeMsg.closeTradeData;

      let closeCompleted = false;
      const finalizeClose = (status: 'success' | 'failed', error?: string) => {
        if (closeCompleted) return;
        closeCompleted = true;
        completeTradeExecution(messageId, status, error);
      };

      if (!walletConnected || !address) {
        updateTradeStatus(messageId, 'failed', 'Wallet not connected');
        finalizeClose('failed', 'Wallet not connected');
        return;
      }
      if (!walletClient) {
        updateTradeStatus(messageId, 'failed', 'Wallet client not available');
        finalizeClose('failed', 'Wallet client not available');
        return;
      }
      if (!channelAddress) {
        updateTradeStatus(messageId, 'failed', 'No trading session active');
        finalizeClose('failed', 'No trading session active');
        return;
      }

      confirmTrade(messageId);
      updateTradeStatus(messageId, 'executing');

      // Remove position from UI immediately
      removePosition(position.marketId);

      try {
        const result = await closePerpsPosition({
          marketId: position.marketId,
          expectedPrice: position.currentPrice.toString(),
          channelAddress: channelAddress as `0x${string}`,
          onSuccess: () => {
            updateTradeStatus(messageId, 'success');
            showToast(`${position.market} position closed!`, 'success');
            finalizeClose('success');
            refreshPositions();
          },
          onError: (error: any) => {
            updateTradeStatus(messageId, 'failed', String(error));
            showToast(`Close failed: ${error}`, 'error');
            finalizeClose('failed', String(error));
            // Restore positions from chain since optimistic removal was wrong
            refreshPositions();
          },
        }, walletClient);

        if (!result.success) {
          updateTradeStatus(messageId, 'failed', result.error || 'Unknown error');
          finalizeClose('failed', result.error || 'Unknown error');
          refreshPositions();
        }
      } catch (error) {
        updateTradeStatus(messageId, 'failed', String(error));
        showToast(`Close error: ${error}`, 'error');
        finalizeClose('failed', String(error));
        refreshPositions();
      }
      return;
    }

    // ── Open position / limit order path ──
    if (!tradeMsg?.tradeData) return;

    const trade = tradeMsg.tradeData;

    let tradeCompleted = false;
    const finalize = (status: 'success' | 'failed', error?: string) => {
      if (tradeCompleted) return;
      tradeCompleted = true;
      completeTradeExecution(messageId, status, error);
    };

    // Validate prerequisites
    if (!walletConnected || !address) {
      updateTradeStatus(messageId, 'failed', 'Wallet not connected');
      finalize('failed', 'Wallet not connected');
      return;
    }
    if (!walletClient) {
      updateTradeStatus(messageId, 'failed', 'Wallet client not available');
      finalize('failed', 'Wallet client not available');
      return;
    }
    if (!channelAddress) {
      updateTradeStatus(messageId, 'failed', 'No trading session active');
      finalize('failed', 'No trading session active');
      return;
    }

    // Confirm the trade in the hook (sends results to AI)
    confirmTrade(messageId);
    updateTradeStatus(messageId, 'executing');

    try {
      const usdcAddress = await getUSDCAddress() as `0x${string}`;

      if (trade.orderType === 'limit' && trade.limitPrice) {
        // Limit order path
        const size = (trade.collateralUsdc * trade.leverage) / trade.limitPrice;
        const sizeWei = BigInt(Math.round(size * 1e18)).toString();
        const triggerPriceWei = BigInt(Math.round(trade.limitPrice * 1e18)).toString();
        const attachedStopLoss = trade.stopLoss ? BigInt(Math.round(trade.stopLoss * 1e18)).toString() : undefined;
        const attachedTakeProfit = trade.takeProfit ? BigInt(Math.round(trade.takeProfit * 1e18)).toString() : undefined;
        const expiryTime = Math.floor(Date.now() / 1000) + (24 * 60 * 60);

        const result = await placeLimitOrder({
          marketId: trade.marketId,
          collateral: trade.collateralUsdc.toString(),
          size: sizeWei,
          isLong: trade.side === 'long',
          triggerPrice: triggerPriceWei,
          attachedStopLoss,
          attachedTakeProfit,
          expiryTime,
          maxAcceptableLeverage: (trade.leverage * 1.001).toFixed(2),
          usdcAddress,
          channelAddress: channelAddress as `0x${string}`,
          viaAgent: true, // Mark as agent trade for leaderboard tracking
          onSuccess: () => {
            updateTradeStatus(messageId, 'success');
            showToast(`${trade.side.toUpperCase()} ${trade.asset} limit order placed!`, 'success');
            finalize('success');
            refreshPositions();
          },
          onError: (error: any) => {
            updateTradeStatus(messageId, 'failed', String(error));
            showToast(`Trade failed: ${error}`, 'error');
            finalize('failed', String(error));
          },
        }, walletClient);

        if (!result.success) {
          updateTradeStatus(messageId, 'failed', result.error || 'Unknown error');
          finalize('failed', result.error || 'Unknown error');
        }
      } else {
        // Market order path
        const result = await openPerpsPosition({
          marketId: trade.marketId,
          collateral: trade.collateralUsdc.toString(),
          leverage: trade.leverage.toString(),
          isLong: trade.side === 'long',
          expectedPrice: trade.entryPrice.toString(),
          takeProfit: trade.takeProfit?.toString(),
          stopLoss: trade.stopLoss?.toString(),
          channelAddress: channelAddress as `0x${string}`,
          usdcAddress,
          viaAgent: true, // Mark as agent trade for leaderboard tracking
          onSuccess: () => {
            updateTradeStatus(messageId, 'success');
            showToast(`${trade.side.toUpperCase()} ${trade.asset} position opened!`, 'success');
            finalize('success');
            // Refresh positions from chain
            refreshPositions();
          },
          onError: (error: any) => {
            updateTradeStatus(messageId, 'failed', String(error));
            showToast(`Trade failed: ${error}`, 'error');
            finalize('failed', String(error));
          },
        }, walletClient);

        if (!result.success) {
          updateTradeStatus(messageId, 'failed', result.error || 'Unknown error');
          finalize('failed', result.error || 'Unknown error');
        }
      }
    } catch (error) {
      updateTradeStatus(messageId, 'failed', String(error));
      showToast(`Trade error: ${error}`, 'error');
      finalize('failed', String(error));
    }
  }, [messages, walletConnected, address, walletClient, channelAddress, confirmTrade, completeTradeExecution, updateTradeStatus, showToast, sendMessage, refreshPositions, removePosition]);

  const handleRejectTrade = useCallback((messageId: string) => {
    rejectTrade(messageId);
  }, [rejectTrade]);

  // Auto-send any queued message (from chart/asset prompts)
  useEffect(() => {
    if (!queuedAgentMessage || isStreaming) return;

    // Ensure we have a session before sending
    if (!activeSessionId) {
      handleNewChat();
      return; // wait for session to be created before sending
    }

    // Ensure connection is established before sending
    if (connectionState === 'disconnected' || connectionState === 'connecting' || connectionState === 'error') {
      if (connectionState === 'disconnected' || connectionState === 'error') {
        connect();
      }
      return; // wait for connection before sending
    }

    sendMessage(queuedAgentMessage);
    setQueuedAgentMessage(null);
    setChartContext(null);
  }, [queuedAgentMessage, isStreaming, activeSessionId, connectionState, handleNewChat, connect, sendMessage, setQueuedAgentMessage, setChartContext]);

  // Prevent hydration mismatch by not rendering on server
  if (!mounted) {
    return null;
  }

  return (
    <Portal>
      <div
        className={`fixed right-0 top-0 h-full w-96 border-l shadow-2xl z-[10003] flex flex-col transform transition-all duration-300 ease-in-out ${
          mounted && isMobile ? "bg-dark/95 backdrop-blur-md" : "bg-surface"
        } ${agentSidebarOpen ? "translate-x-0" : "translate-x-full"} ${
          "border-white/10"
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b border-white/10`}>
          <div className="flex items-center gap-3">
            {/* Back arrow when in chat view */}
            {view === "chat" && sessions.length > 0 && !autonomousMode && (
              <button
                onClick={handleBackToList}
                className="text-white/50 hover:text-white transition-colors mr-1"
                title="Back to chats"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <svg
              width="20px"
              height="20px"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-blue-400"
            >
              <path
                d="M8 15C12.8747 15 15 12.949 15 8C15 12.949 17.1104 15 22 15C17.1104 15 15 17.1104 15 22C15 17.1104 12.8747 15 8 15Z"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M2 6.5C5.13376 6.5 6.5 5.18153 6.5 2C6.5 5.18153 7.85669 6.5 11 6.5C7.85669 6.5 6.5 7.85669 6.5 11C6.5 7.85669 5.13376 6.5 2 6.5Z"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
            <div className="flex items-center gap-2">
              <p className="text-sm text-white/60">
                Vibetrader
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {view === "chat" && messages.length > 0 && (
              <button
                onClick={clearChat}
                className="text-white/40 hover:text-white/80 transition-colors text-xs"
                title="Clear chat"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => {
                setAgentSidebarOpen(false);
                window.location.reload();
              }}
              className="text-white/60 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {view === "welcome" && <WelcomeScreen onContinue={handleWelcomeContinue} />}

          {view === "sessions" && (
            <SessionListScreen
              sessions={sessions}
              onSelect={handleSelectSession}
              onCreate={handleNewChat}
              onDelete={handleDeleteSession}
              onDeleteAll={handleDeleteAll}
              onRename={renameSession}
            />
          )}

          {view === "chat" && (
            <div className="h-full flex flex-col">
              {/* Connection banners */}
              {connectionState === "connecting" && (
                <div className="flex items-center justify-center gap-2 p-3 bg-yellow-500/10 border-b border-yellow-500/20">
                  <Spinner size={3} />
                  <span className="text-xs text-yellow-300">Connecting...</span>
                </div>
              )}

              {(connectionState === "error" || connectionState === "disconnected") && (
                <div className="flex items-center justify-between p-3 bg-red-500/10 border-b border-red-500/20">
                  <span className="text-xs text-red-300">
                    {connectionState === "error" ? "Connection error" : "Disconnected"}
                  </span>
                  <button onClick={connect} className="text-xs text-blue-400 hover:text-blue-300">
                    Reconnect
                  </button>
                </div>
              )}

              {connectionState === "captcha_required" && (
                <div className="p-4 border-b border-white/10 bg-white/5 flex flex-col items-center gap-3">
                  <div className="text-xs text-white/70 text-center">
                    Please complete the captcha to continue.
                  </div>
                  <div className="w-full flex justify-center">
                    <Turnstile
                      sitekey={turnstileSiteKey}
                      onVerify={handleCaptchaVerify}
                      onError={(error) => setCaptchaError(error?.toString?.() || "Captcha error")}
                      onExpire={() => {
                        setCaptchaToken(null);
                        setCaptchaError(null);
                      }}
                      theme="dark"
                    />
                  </div>
                  {captchaError && <div className="text-xs text-red-400">{captchaError}</div>}
                  {captchaToken && <div className="text-[11px] text-white/50">Verifying...</div>}
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="text-center text-white/50 mt-8">
                    <p className="text-sm">No messages yet. Start a conversation!</p>
                  </div>
                ) : (
                  messages.filter(m => m.content !== "Cooldown ended. Resuming autonomous trading operations.").map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      onConfirmTrade={handleConfirmTrade}
                      onRejectTrade={handleRejectTrade}
                      autonomousMode={autonomousMode}
                    />
                  ))
                )}

                {isStreaming &&
                  messages.length > 0 &&
                  messages[messages.length - 1].role !== "assistant" &&
                  !messages.some(msg => msg.role === "tool_executing") && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg">
                        <Spinner size={3} />
                        <span className="text-xs text-white/50">Thinking...</span>
                      </div>
                    </div>
                  )}

                {/* Cooldown Display in messages */}
                {isInCooldown && autonomousMode && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <polyline points="12,6 12,12 16,14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <div>
                        <span className="text-xs font-semibold text-blue-300">Cooldown Active</span>
                        <p className="text-[10px] text-blue-200">{cooldownReason}</p>
                      </div>
                      <span className="text-xs font-mono text-blue-300 tabular-nums ml-2">
                        {cooldownRemaining}s
                      </span>
                      <button
                        onClick={handleOverrideCooldown}
                        className="ml-2 px-2 py-1 text-[10px] font-bold text-white bg-blue-600/80 hover:bg-blue-500 border border-blue-500/50 rounded transition-colors"
                      >
                        OVERRIDE
                      </button>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-white/10 space-y-3">

                {!autonomousInstructionSent && (
                  <>
                    {/* Mode Selector */}
                    <div className="flex items-center gap-2 mb-5">
                  <button
                    ref={askBtnRef}
                    onClick={() => { if (autonomousMode) handleToggleAutonomous(false); }}
                    onMouseEnter={() => {
                      const rect = askBtnRef.current?.getBoundingClientRect();
                      if (rect) setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
                      setTooltipVisible('ask');
                    }}
                    onMouseLeave={() => setTooltipVisible(null)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      mode === 'ask'
                        ? 'bg-blue-600 text-white border border-blue-500'
                        : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    Ask
                  </button>
                  <button
                    ref={autoBtnRef}
                    onClick={() => handleToggleAutonomous(!autonomousMode)}
                    onMouseEnter={() => {
                      const rect = autoBtnRef.current?.getBoundingClientRect();
                      if (rect) setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
                      setTooltipVisible('autonomous');
                    }}
                    onMouseLeave={() => setTooltipVisible(null)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      mode === 'autonomous'
                        ? 'bg-orange-600 text-white border border-orange-500'
                        : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    Autonomous
                  </button>
                </div>

                {/* Fixed-position tooltip rendered via portal to escape overflow */}
                {tooltipVisible && (
                  <Portal>
                    <div
                      className="fixed px-3 py-2 bg-black/90 text-white text-xs rounded-lg border border-white/20 whitespace-nowrap z-[9999] pointer-events-none"
                      style={{ left: tooltipPos.x, top: tooltipPos.y - 8, transform: 'translate(-50%, -100%)' }}
                    >
                      {tooltipVisible === 'ask'
                        ? 'Ask questions and get responses from the AI assistant'
                        : 'Configure and start autonomous trading mode'}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
                    </div>
                  </Portal>
                )}

                <div className="flex items-center justify-between text-xs text-white/50">
                  <span className="font-medium text-white/80">{autonomousMode ? 'Direct Vibetrader' : 'Ask Vibetrader'}</span>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-lg shadow-black/20">
                  <div className="flex items-start gap-3">
                    <textarea
                      data-agent-input
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder={autonomousMode && !autonomousInstructionSent ? "i wanna trade btc..." : "How can I help you today?"}
                      className="flex-1 bg-transparent border-0 text-sm text-white placeholder-white/40 focus:outline-none min-h-[64px] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      disabled={isStreaming || connectionState !== "connected" || (isInCooldown && autonomousMode)}
                    />

                    <button
                      onClick={autonomousMode && autonomousInstructionSent ? handleStopAutonomous : handleSendMessage}
                      className={`mt-1 inline-flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        autonomousMode && autonomousInstructionSent
                          ? 'h-10 w-12 bg-red-600 hover:bg-red-700 text-white font-semibold rounded' 
                          : 'h-10 w-10 bg-blue-600 hover:bg-blue-700 rounded-full'
                      }`}
                      disabled={autonomousMode && autonomousInstructionSent ? (isStreaming || connectionState !== "connected") : (!prompt.trim() || isStreaming || connectionState !== "connected" || (isInCooldown && autonomousMode))}
                    >
                      {isStreaming ? (
                        <Spinner size={3} />
                      ) : autonomousMode && autonomousInstructionSent ? (
                        <div className="flex items-center justify-center w-full h-full">
                          <div className="relative">
                            {/* Stop sign octagon */}
                            <div 
                              className="bg-red-600 border-2 border-red-600" 
                              style={{
                                width: '20px', 
                                height: '20px', 
                                clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)',
                                transform: 'rotate(22.5deg)'
                              }}
                            >
                              <div className="w-full h-full flex items-center justify-center" style={{transform: 'rotate(-22.5deg)'}}>
                                <span className="text-[6px] font-black text-white leading-none">STOP</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 12h14M12 5l7 7-7 7"
                          />
                        </svg>
                      )}
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-white/50">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/10 text-white/70">
                        Grok 4.1 Fast
                      </span>
                      <span>Reasoning</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  {(autonomousMode ? [
                    "Close all positions",
                    "Check risk",
                  ] : [
                    "Scan BTC setup",
                    "Go autonomous",
                    "Show options chain for ETH",
                    "Check funding and OI",
                  ]).map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        if (chip === "Go autonomous") {
                          handleToggleAutonomous(true);
                        } else {
                          setPrompt(chip);
                        }
                      }}
                      className={`px-3 py-2 rounded-full border bg-white/5 text-white/80 transition-colors ${
                        chip === "Go autonomous"
                          ? 'border-orange-500/40 hover:border-orange-400/60 hover:text-orange-300'
                          : 'border-white/10 hover:border-blue-400/60 hover:text-white'
                      }`}
                      disabled={isStreaming || connectionState !== "connected" || (isInCooldown && autonomousMode)}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
                </>
                )}

                {autonomousInstructionSent && (
                  <button
                    onClick={() => window.location.reload()}
                    title="This will force stop all autonomous trading"
                    className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    STOP
                  </button>
                )}

              </div>
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
}