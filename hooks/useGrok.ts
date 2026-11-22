"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  GrokClient,
  GrokToolCall,
  GrokToolResult,
  GrokConnectionState,
} from "@/services/grokClient";
import { useSession } from "@/store/SessionContext";
import { resolveToolCall } from "@/services/grokToolHandlers";

export interface TradeData {
  marketId: string;
  asset: string;
  side: 'long' | 'short';
  collateralUsdc: number;
  leverage: number;
  orderType: 'market' | 'limit';
  entryPrice: number;
  limitPrice: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  positionSizeUsd: number;
  positionSizeAsset: number;
  currentPrice: number;
  channelAddress: string;
}

export interface CloseTradeData {
  marketId: string;
  market: string;
  side: 'long' | 'short';
  sizeUsd: number;
  collateralUsd: number;
  leverage: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  channelAddress: string;
}

type PendingOperation =
  | {
      id: string;
      tradeResult: { data: TradeData; toolCallId: string };
      results: GrokToolResult[];
    }
  | {
      id: string;
      closeResult: { data: CloseTradeData; toolCallId: string };
      results: GrokToolResult[];
    };

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "tool_call" | "error" | "info" | "trade_confirmation" | "close_confirmation" | "tool_executing" | "tool_complete";
  content: string;
  timestamp: Date;
  toolCalls?: GrokToolCall[];
  // For tool_call messages: which calls are still pending
  pendingTools?: Set<string>;
  // For tool_call messages: collected results
  toolResults?: Map<string, string>;
  // For trade_confirmation messages
  tradeData?: TradeData;
  // For close_confirmation messages
  closeTradeData?: CloseTradeData;
  tradeStatus?: 'pending' | 'confirmed' | 'rejected' | 'executing' | 'success' | 'failed';
  tradeError?: string;
  // For tool_executing/tool_complete messages
  toolName?: string;
}

export interface UseGrokReturn {
  messages: ChatMessage[];
  connectionState: GrokConnectionState;
  isStreaming: boolean;
  autonomousMode: boolean;
  setAutonomousMode: (on: boolean) => void;
  cooldownEndTime: number | null;
  cooldownReason: string;
  clearCooldown: () => void;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (content: string) => void;
  clearChat: () => void;
  sendCaptchaToken: (token: string) => void;
  /** Load a set of messages (e.g. from history) into state */
  loadMessages: (msgs: ChatMessage[]) => void;
  /**
   * Call this when a tool finishes executing on the client side.
   * Pass the tool call ID, tool name, and a JSON string result.
   * The UI will update the tool card and, once all tools are done,
   * the results are sent to the server automatically.
   */
  toolFinish: (toolCallId: string, name: string, result: string) => void;
  /** Confirm a pending trade and execute it */
  confirmTrade: (messageId: string) => void;
  /** Mark trade execution result and flush tool results */
  completeTradeExecution: (messageId: string, status: 'success' | 'failed', error?: string) => void;
  /** Reject a pending trade */
  rejectTrade: (messageId: string) => void;
  /** Update trade status on a trade_confirmation message */
  updateTradeStatus: (messageId: string, status: ChatMessage['tradeStatus'], error?: string) => void;
}

export function useGrok(): UseGrokReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connectionState, setConnectionState] = useState<GrokConnectionState>("disconnected");
  const [isStreaming, setIsStreaming] = useState(false);
  const [autonomousMode, setAutonomousMode] = useState(false);
  const [cooldownEndTime, setCooldownEndTime] = useState<number | null>(null);
  const [cooldownReason, setCooldownReason] = useState<string>("");
  const clearCooldown = useCallback(() => {
    setCooldownEndTime(null);
    setCooldownReason("");
    cooldownJustSetRef.current = false;
    pendingTradesQueueRef.current = [];
    pendingClosesQueueRef.current = [];
  }, []);

  // Accumulated partial content for the current streaming response
  const partialRef = useRef("");
  // A ref to the streaming message ID so we can update it
  const streamingMsgIdRef = useRef<string | null>(null);
  // Track when cooldown was just set to suppress the next assistant message
  const cooldownJustSetRef = useRef(false);

  const clientRef = useRef<GrokClient | null>(null);
  const autonomousModeRef = useRef(false);
  useEffect(() => { autonomousModeRef.current = autonomousMode; }, [autonomousMode]);

  // Track previous connection state to detect transitions
  const prevConnectionStateRef = useRef<GrokConnectionState>("disconnected");

  // Pending trade results ref — holds tool results while awaiting user confirmation
  const pendingTradeResultsRef = useRef<{
    id: string;
    results: GrokToolResult[];
    tradeToolCallId: string;
  } | null>(null);

  // Queue for multiple pending trades
  const pendingTradesQueueRef = useRef<PendingOperation[]>([]);

  // Queue for multiple pending closes
  const pendingClosesQueueRef = useRef<PendingOperation[]>([]);

  // Session context for channel address (used by tool handlers)
  const { channelAddress } = useSession();
  const channelAddressRef = useRef<string | null>(channelAddress);
  useEffect(() => {
    channelAddressRef.current = channelAddress;
  }, [channelAddress]);

  // Stable message appender
  const appendMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  // Update streaming message in-place
  const updateStreamingMessage = useCallback((content: string) => {
    const id = streamingMsgIdRef.current;
    if (!id) return;
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content } : m))
    );
  }, []);

  useEffect(() => {
    const client = new GrokClient({
      onStateChange: (state) => {
        setConnectionState(state);
      },

      onToolExecuting: (toolName, content) => {
        appendMessage({
          id: `tool-exec-${Date.now()}`,
          role: "tool_executing",
          content: content || `Executing ${toolName}...`,
          timestamp: new Date(),
          toolName,
        });
      },

      onToolComplete: (toolName, content) => {
        // Remove the corresponding tool_executing message
        setMessages((prev) => prev.filter(msg => 
          !(msg.role === "tool_executing" && msg.toolName === toolName)
        ));

        // Add the completion message
        appendMessage({
          id: `tool-comp-${Date.now()}`,
          role: "tool_complete",
          content: content || `${toolName} completed`,
          timestamp: new Date(),
          toolName,
        });
      },

      onPartial: (text) => {
        // If cooldown was just set, suppress the response
        if (cooldownJustSetRef.current) {
          return;
        }

        partialRef.current += text;

        if (!streamingMsgIdRef.current) {
          // Create a new assistant message for streaming
          const id = `assistant-${Date.now()}`;
          streamingMsgIdRef.current = id;
          setMessages((prev) => [
            ...prev,
            {
              id,
              role: "assistant",
              content: partialRef.current,
              timestamp: new Date(),
            },
          ]);
        } else {
          updateStreamingMessage(partialRef.current);
        }
      },

      onMessage: (fullContent) => {
        // If cooldown was just set, suppress the response
        if (cooldownJustSetRef.current) {
          cooldownJustSetRef.current = false; // Reset for next time
          streamingMsgIdRef.current = null;
          partialRef.current = "";
          return;
        }

        // Final message — replace the streaming message or create new
        if (streamingMsgIdRef.current) {
          updateStreamingMessage(fullContent);
          streamingMsgIdRef.current = null;
          partialRef.current = "";
        } else {
          appendMessage({
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: fullContent,
            timestamp: new Date(),
          });
        }
      },

      onToolCalls: (calls) => {
        // Reset streaming state
        streamingMsgIdRef.current = null;
        partialRef.current = "";

        // Add a tool_call message card
        appendMessage({
          id: `tools-${Date.now()}`,
          role: "tool_call",
          content: "",
          timestamp: new Date(),
          toolCalls: calls,
          pendingTools: new Set(calls.map((c) => c.id)),
          toolResults: new Map(),
        });

        // Resolve all tool calls, detecting trade execution or close
        (async () => {
          const results: GrokToolResult[] = [];
          let tradeResults: { data: TradeData; toolCallId: string }[] = [];
          let closeResults: { data: CloseTradeData; toolCallId: string }[] = [];
          let hasCooldown = false;

          for (const call of calls) {
            let args: Record<string, unknown> = {};
            try { args = JSON.parse(call.function.arguments || "{}"); } catch { /* ignore */ }

            let content: string;
            if (call.function.name === 'set_cooldown' && !autonomousModeRef.current) {
              content = JSON.stringify({ error: "User has not selected autonomous mode. Do not call any more tools. In your next message, you should ask them to enable autonomous mode. Until they do, requests will fail." });
            } else {
              content = await resolveToolCall(
                call.function.name,
                args,
                channelAddressRef.current,
              );
            }

            // Check if this is a trade execution result
            if (call.function.name === 'execute_perp_trade') {
              try {
                const parsed = JSON.parse(content);
                if (parsed.action === 'execute_perp_trade' && parsed.trade) {
                  tradeResults.push({ data: parsed.trade as TradeData, toolCallId: call.id });
                }
              } catch { /* ignore parse errors */ }
            }

          // Check if this is a close position result
            if (call.function.name === 'close_perp_position') {
              try {
                const parsed = JSON.parse(content);
                if (parsed.action === 'close_perp_position' && parsed.position) {
                  closeResults.push({ data: parsed.position as CloseTradeData, toolCallId: call.id });
                }
              } catch { /* ignore parse errors */ }
            }

            // Check if this is a cooldown tool call
            if (call.function.name === 'set_cooldown') {
              hasCooldown = true;
              try {
                const parsed = JSON.parse(content);
                if (parsed.action === 'set_cooldown' && parsed.seconds && parsed.reason) {
                  const cooldownMs = parsed.seconds * 1000;
                  setCooldownEndTime(Date.now() + cooldownMs);
                  setCooldownReason(parsed.reason);
                }
              } catch { /* ignore parse errors */ }
            }

            results.push({
              tool_call_id: call.id,
              name: call.function.name,
              content,
            });
          }

          // If cooldown was set, suppress the next assistant message
          if (hasCooldown) {
            cooldownJustSetRef.current = true;
          }

          // Update local UI: mark all tools done and attach results
          setMessages((prev) =>
            prev.map((m) => {
              if (m.role !== "tool_call") return m;
              const newResults = new Map(m.toolResults);
              results.forEach((r) => newResults.set(r.tool_call_id, r.content));
              return { ...m, pendingTools: new Set(), toolResults: newResults };
            })
          );

          // If trade executions were requested, queue them and show only the first
          if (tradeResults.length > 0) {
            // Queue all trades
            const tradeQueue = tradeResults.map((tradeResult, index) => ({
              id: `trade-${Date.now()}-${index}`,
              tradeResult,
              results,
            }));

            pendingTradesQueueRef.current = tradeQueue;

            // Show only the first trade confirmation
            if (tradeQueue.length > 0) {
              const firstTrade = tradeQueue[0];
              pendingTradeResultsRef.current = {
                id: firstTrade.id,
                results: firstTrade.results,
                tradeToolCallId: firstTrade.tradeResult.toolCallId,
              };

              appendMessage({
                id: firstTrade.id,
                role: "trade_confirmation",
                content: "",
                timestamp: new Date(),
                tradeData: firstTrade.tradeResult.data,
                tradeStatus: 'pending',
              });
            }
            // DON'T send tool results yet - wait until all trades are executed
          } else if (closeResults.length > 0) {
            // Queue all close operations
            const closeQueue = closeResults.map((closeResult, index) => ({
              id: `close-${Date.now()}-${index}`,
              closeResult,
              results,
            }));

            pendingClosesQueueRef.current = closeQueue;

            // Show only the first close confirmation
            if (closeQueue.length > 0) {
              const firstClose = closeQueue[0];
              pendingTradeResultsRef.current = {
                id: firstClose.id,
                results: firstClose.results,
                tradeToolCallId: firstClose.closeResult.toolCallId,
              };

              appendMessage({
                id: firstClose.id,
                role: "close_confirmation",
                content: "",
                timestamp: new Date(),
                closeTradeData: firstClose.closeResult.data,
                tradeStatus: 'pending',
              });
            }
            // DON'T send tool results yet - wait until all closes are executed
          } else if (hasCooldown) {
            // If cooldown was set, store the results but don't send yet
            // Store them in case captcha interrupts - we'll send after cooldown ends
            pendingTradeResultsRef.current = {
              id: `cooldown-${Date.now()}`,
              results,
              tradeToolCallId: '', // No specific trade tool call for cooldown
            };
            // The next response will be triggered when cooldown ends
          } else {
            // No trade or cooldown — send all results to continue the conversation
            // But also store them temporarily in case captcha is required during send
            const tempResults = results;
            pendingTradeResultsRef.current = {
              id: `temp-${Date.now()}`,
              results: tempResults,
              tradeToolCallId: '',
            };
            
            // Attempt to send - if it succeeds, clear the temp storage
            clientRef.current?.submitAllToolResults(tempResults);
            
            // Clear temp storage after a short delay (if send was successful)
            // If captcha is required before this clears, the results will be resent after captcha_ok
            setTimeout(() => {
              if (pendingTradeResultsRef.current?.id.startsWith('temp-')) {
                pendingTradeResultsRef.current = null;
              }
            }, 1000);
          }
        })();
      },

      onError: (error) => {
        streamingMsgIdRef.current = null;
        partialRef.current = "";
        appendMessage({
          id: `error-${Date.now()}`,
          role: "error",
          content: error,
          timestamp: new Date(),
        });
      },

      onInfo: (info) => {
        // Don't clutter chat with "session ready"
        if (info && info !== "session ready") {
          appendMessage({
            id: `info-${Date.now()}`,
            role: "info",
            content: info,
            timestamp: new Date(),
          });
        }
      },

      onCaptchaRequired: () => {
        // Reset any streaming buffer so captcha flow can resume cleanly
        streamingMsgIdRef.current = null;
        partialRef.current = "";
      },

      onStreamStart: () => {
        setIsStreaming(true);
      },

      onStreamEnd: () => {
        setIsStreaming(false);
      },
    });

    clientRef.current = client;

    return () => {
      client.disconnect();
    };
  }, [appendMessage, updateStreamingMessage]);

  // Monitor connection state changes to resume tool results after captcha
  useEffect(() => {
    const prevState = prevConnectionStateRef.current;
    prevConnectionStateRef.current = connectionState;

    // If transitioning from captcha_required to connected, resume pending tool results
    if (prevState === 'captcha_required' && connectionState === 'connected') {
      // Check if we have pending tool results that need to be sent
      if (pendingTradeResultsRef.current) {
        const hasPendingTrades = pendingTradesQueueRef.current.length > 0;
        const hasPendingCloses = pendingClosesQueueRef.current.length > 0;
        const hasCooldown = cooldownEndTime !== null;
        
        // Only send if:
        // 1. No pending trades/closes (no user confirmation needed)
        // 2. No active cooldown (should wait for cooldown to end)
        if (!hasPendingTrades && !hasPendingCloses && !hasCooldown) {
          const results = pendingTradeResultsRef.current.results;
          pendingTradeResultsRef.current = null;
          clientRef.current?.submitAllToolResults(results);
        }
        // Otherwise, keep the results pending - they'll be sent when:
        // - User confirms/rejects the trade
        // - Cooldown ends
      }
    }
  }, [connectionState, cooldownEndTime]);

  const connect = useCallback(() => {
    clientRef.current?.connect();
  }, []);

  const disconnect = useCallback(() => {
    clientRef.current?.disconnect();
  }, []);

  const sendMessage = useCallback((content: string) => {
    // Clear the cooldown suppression flag when user sends a message
    cooldownJustSetRef.current = false;
    
    appendMessage({
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
    });
    clientRef.current?.sendMessage(content);
  }, [appendMessage]);

  const clearChat = useCallback(() => {
    setMessages([]);
    partialRef.current = "";
    streamingMsgIdRef.current = null;
    clientRef.current?.clearConversation();
  }, []);

  const loadMessages = useCallback((msgs: ChatMessage[]) => {
    setMessages(msgs);
    partialRef.current = "";
    streamingMsgIdRef.current = null;
  }, []);

  const sendCaptchaToken = useCallback((token: string) => {
    clientRef.current?.sendCaptchaToken(token);
  }, []);

  /**
   * Call when a tool call has been executed on the client.
   * Updates the tool card UI and sends results to the server.
   */
  const toolFinish = useCallback((toolCallId: string, name: string, result: string) => {
    // Update the tool_call message to mark this tool as done
    setMessages((prev) =>
      prev.map((m) => {
        if (m.role !== "tool_call" || !m.pendingTools?.has(toolCallId)) return m;

        const newPending = new Set(m.pendingTools);
        newPending.delete(toolCallId);

        const newResults = new Map(m.toolResults);
        newResults.set(toolCallId, result);

        return { ...m, pendingTools: newPending, toolResults: newResults };
      })
    );

    // Send to server
    clientRef.current?.submitToolResult(toolCallId, name, result);
  }, []);

  /**
   * Update trade status on a trade_confirmation message.
   */
  const updateTradeStatus = useCallback((messageId: string, status: ChatMessage['tradeStatus'], error?: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, tradeStatus: status, tradeError: error } : m
      )
    );
  }, []);

  /**
   * Remove the completed operation from its queue and show the next
   * confirmation card, if any. Returns true when another operation remains.
   */
  const showNextPendingOperation = useCallback((isCloseOperation: boolean) => {
    if (isCloseOperation) {
      pendingClosesQueueRef.current = pendingClosesQueueRef.current.slice(1);
    } else {
      pendingTradesQueueRef.current = pendingTradesQueueRef.current.slice(1);
    }

    const nextOp: PendingOperation | undefined = isCloseOperation
      ? pendingClosesQueueRef.current[0]
      : pendingTradesQueueRef.current[0];

    if (!nextOp) return false;

    const isTrade = 'tradeResult' in nextOp;
    pendingTradeResultsRef.current = {
      id: nextOp.id,
      results: nextOp.results,
      tradeToolCallId: isTrade
        ? nextOp.tradeResult.toolCallId
        : nextOp.closeResult.toolCallId,
    };

    appendMessage({
      id: nextOp.id,
      role: isTrade ? "trade_confirmation" : "close_confirmation",
      content: "",
      timestamp: new Date(),
      tradeData: isTrade ? nextOp.tradeResult.data : undefined,
      closeTradeData: isTrade ? undefined : nextOp.closeResult.data,
      tradeStatus: 'pending',
    });

    return true;
  }, [appendMessage]);

  /**
   * Confirm a pending trade — mark it as confirmed. Actual execution happens
   * in the AgentSidebar component; once it finishes, completeTradeExecution
   * will flush tool results so the AI sees the true outcome.
   */
  const confirmTrade = useCallback((messageId: string) => {
    updateTradeStatus(messageId, 'confirmed');
  }, [updateTradeStatus]);

  /**
   * After execution finishes (success or fail), send tool results so the AI
   * reflects the real outcome and clear the pending buffer.
   */
  const completeTradeExecution = useCallback((messageId: string, status: 'success' | 'failed', error?: string) => {
    const pending = pendingTradeResultsRef.current;
    if (!pending || pending.id !== messageId) return;

    const updatedResults = pending.results.map((r) => {
      if (r.tool_call_id === pending.tradeToolCallId) {
        try {
          const parsed = JSON.parse(r.content);
          return {
            ...r,
            content: JSON.stringify({
              ...parsed,
              userConfirmed: true,
              executionStatus: status,
              error: status === 'failed' ? error : undefined,
            }),
          };
        } catch {
          return r;
        }
      }
      return r;
    });

    // Check which queue to process based on message ID
    const isCloseOperation = messageId.startsWith('close-');

    // Show the next operation confirmation, or finish and send results.
    if (!showNextPendingOperation(isCloseOperation)) {
      clientRef.current?.submitAllToolResults(updatedResults);
      pendingTradeResultsRef.current = null;
    }
  }, [showNextPendingOperation]);

  /**
   * Reject a pending trade — mark it as rejected and send tool results
   * so the AI knows the trade was declined.
   */
  const rejectTrade = useCallback((messageId: string) => {
    updateTradeStatus(messageId, 'rejected');

    const pending = pendingTradeResultsRef.current;
    if (pending && pending.id === messageId) {
      // Determine the action type from the pending results
      const tradeResult = pending.results.find(r => r.tool_call_id === pending.tradeToolCallId);
      let actionType = 'execute_perp_trade';
      if (tradeResult) {
        try {
          const parsed = JSON.parse(tradeResult.content);
          if (parsed.action) actionType = parsed.action;
        } catch { /* ignore */ }
      }

      // Update the trade tool result to indicate user rejected
      const updatedResults = pending.results.map((r) => {
        if (r.tool_call_id === pending.tradeToolCallId) {
          return {
            ...r,
            content: JSON.stringify({ action: actionType, userConfirmed: false, message: 'User rejected the trade.' }),
          };
        }
        return r;
      });

      // Check which queue to process based on message ID
      const isCloseOperation = messageId.startsWith('close-');

      // Show the next operation confirmation, or finish and send results.
      if (!showNextPendingOperation(isCloseOperation)) {
        clientRef.current?.submitAllToolResults(updatedResults);
        pendingTradeResultsRef.current = null;
      }
    }
  }, [updateTradeStatus, showNextPendingOperation]);

  return {
    messages,
    connectionState,
    isStreaming,
    autonomousMode,
    setAutonomousMode,
    cooldownEndTime,
    cooldownReason,
    clearCooldown,
    connect,
    disconnect,
    sendMessage,
    clearChat,
    loadMessages,
    sendCaptchaToken,
    toolFinish,
    confirmTrade,
    completeTradeExecution,
    rejectTrade,
    updateTradeStatus,
  };
}
