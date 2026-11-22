// Vibetrader (Grok) WebSocket service
// Handles connection, messaging, streaming, captcha, and tool calls

export interface GrokToolCall {
  index: number;
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  };
}

export interface GrokToolResult {
  tool_call_id: string;
  name: string;
  content: string;
}

// Server → Client message
export interface GrokServerMessage {
  type: 'captcha_required' | 'captcha_ok' | 'partial' | 'message' | 'tool_calls' | 'error' | 'info' | 'response_id' | 'tool_executing' | 'tool_complete';
  content?: string;
  calls?: GrokToolCall[];
  response_id?: string; // xAI conversation ID for stateful continuity
  tool_name?: string; // For tool_executing and tool_complete
}

// Client → Server message
export interface GrokClientMessage {
  type: 'captcha' | 'message' | 'tool_results' | 'clear' | 'restore';
  content?: string;
  token?: string;
  results?: GrokToolResult[];
  response_id?: string; // Send on reconnect to restore conversation
}

export type GrokConnectionState = 'disconnected' | 'connecting' | 'connected' | 'captcha_required' | 'error';

export interface GrokCallbacks {
  onStateChange: (state: GrokConnectionState) => void;
  onPartial: (text: string) => void;
  onMessage: (text: string) => void;
  onToolCalls: (calls: GrokToolCall[]) => void;
  onError: (error: string) => void;
  onInfo: (info: string) => void;
  onCaptchaRequired: () => void;
  onStreamStart: () => void;
  onStreamEnd: () => void;
  onToolExecuting: (toolName: string, content: string) => void;
  onToolComplete: (toolName: string, content: string) => void;
}

const GROK_WS_URL = process.env.NEXT_PUBLIC_GROK_WS_URL || 'ws://localhost:4001/grok';
const RECONNECT_DELAY = 3000;
const MAX_RECONNECTS = 5;

export class GrokClient {
  private ws: WebSocket | null = null;
  private callbacks: GrokCallbacks;
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private state: GrokConnectionState = 'disconnected';
  private isStreaming = false;

  // Pending tool calls awaiting client-side resolution
  private pendingToolCalls: GrokToolCall[] = [];
  
  // Response ID for stateful conversation continuity (xAI Responses API)
  private responseId: string | null = null;

  constructor(callbacks: GrokCallbacks) {
    this.callbacks = callbacks;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
      return;
    }

    this.setState('connecting');

    try {
      this.ws = new WebSocket(GROK_WS_URL);
    } catch {
      this.setState('error');
      this.callbacks.onError('Failed to create WebSocket connection');
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      // Don't set 'connected' yet — wait for server to send info/captcha_required
    };

    this.ws.onmessage = (event) => {
      try {
        const msg: GrokServerMessage = JSON.parse(event.data);
        this.handleMessage(msg);
      } catch {
        console.error('[GrokClient] Failed to parse message:', event.data);
      }
    };

    this.ws.onclose = (event) => {
      const wasConnected = this.state === 'connected';
      this.setState('disconnected');

      if (this.isStreaming) {
        this.isStreaming = false;
        this.callbacks.onStreamEnd();
      }

      // Auto-reconnect if it was a clean connection that dropped
      if (wasConnected && !event.wasClean && this.reconnectAttempts < MAX_RECONNECTS) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      // onclose will fire after this
      this.callbacks.onError('WebSocket connection error');
    };
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.reconnectAttempts = MAX_RECONNECTS; // prevent auto-reconnect
    if (this.ws) {
      this.ws.close(1000, 'client disconnect');
      this.ws = null;
    }
    this.setState('disconnected');
  }

  sendMessage(content: string) {
    this.send({ type: 'message', content });
    if (!this.isStreaming) {
      this.isStreaming = true;
      this.callbacks.onStreamStart();
    }
  }

  sendCaptchaToken(token: string) {
    this.send({ type: 'captcha', token });
  }

  clearConversation() {
    this.send({ type: 'clear' });
    this.responseId = null; // Clear response ID for fresh conversation
    this.saveResponseId(); // Clear from localStorage
  }

  /**
   * Restore a previous response ID to continue a conversation across sessions.
   * Call this after loading chat history from localStorage.
   */
  restoreResponseId(responseId: string | null) {
    if (responseId) {
      this.responseId = responseId;
      this.send({ type: 'restore', response_id: responseId });
    }
  }

  /**
   * Get the current response ID for persistence.
   */
  getResponseId(): string | null {
    return this.responseId;
  }

  /**
   * Submit a single tool result back to the server.
   * When all pending tool calls are resolved, the batch is sent and
   * the model continues generating.
   */
  submitToolResult(toolCallId: string, name: string, content: string) {
    // Remove from pending
    this.pendingToolCalls = this.pendingToolCalls.filter(tc => tc.id !== toolCallId);

    // Always send immediately — the server accumulates and re-runs when all are in
    this.send({
      type: 'tool_results',
      results: [{ tool_call_id: toolCallId, name, content }],
    });

    // If that was the last pending call, the server will stream the next response
    if (this.pendingToolCalls.length === 0 && !this.isStreaming) {
      this.isStreaming = true;
      this.callbacks.onStreamStart();
    }
  }

  /**
   * Finish all pending tool calls at once (batch).
   */
  submitAllToolResults(results: GrokToolResult[]) {
    this.pendingToolCalls = [];
    this.send({ type: 'tool_results', results });
    if (!this.isStreaming) {
      this.isStreaming = true;
      this.callbacks.onStreamStart();
    }
  }

  get isConnected() {
    return this.state === 'connected';
  }

  get connectionState() {
    return this.state;
  }

  get hasPendingToolCalls() {
    return this.pendingToolCalls.length > 0;
  }

  // --- Internal ---

  private handleMessage(msg: GrokServerMessage) {
    switch (msg.type) {
      case 'captcha_required':
        this.setState('captcha_required');
        // Pause any in-flight stream; user must solve captcha before continuing
        if (this.isStreaming) {
          this.isStreaming = false;
          this.callbacks.onStreamEnd();
        }
        this.callbacks.onCaptchaRequired();
        break;

      case 'captcha_ok':
        this.setState('connected');
        this.callbacks.onInfo('Captcha verified');
        break;

      case 'info':
        this.setState('connected');
        this.callbacks.onInfo(msg.content || '');
        break;

      case 'response_id':
        // Store response ID for stateful conversation continuity
        if (msg.response_id) {
          this.responseId = msg.response_id;
          this.saveResponseId();
        }
        break;

      case 'partial':
        this.callbacks.onPartial(msg.content || '');
        break;

      case 'message':
        if (this.isStreaming) {
          this.isStreaming = false;
          this.callbacks.onStreamEnd();
        }
        this.callbacks.onMessage(msg.content || '');
        break;

      case 'tool_calls':
        if (this.isStreaming) {
          this.isStreaming = false;
          this.callbacks.onStreamEnd();
        }
        this.pendingToolCalls = msg.calls || [];
        this.callbacks.onToolCalls(msg.calls || []);
        break;

      case 'error':
        if (this.isStreaming) {
          this.isStreaming = false;
          this.callbacks.onStreamEnd();
        }
        this.callbacks.onError(msg.content || 'Unknown error');
        break;

      case 'tool_executing':
        this.callbacks.onToolExecuting(msg.tool_name || '', msg.content || '');
        break;

      case 'tool_complete':
        this.callbacks.onToolComplete(msg.tool_name || '', msg.content || '');
        break;
    }
  }

  private send(msg: GrokClientMessage) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.callbacks.onError('Not connected');
      return;
    }
    this.ws.send(JSON.stringify(msg));
  }

  private setState(state: GrokConnectionState) {
    this.state = state;
    this.callbacks.onStateChange(state);
  }

  private scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = RECONNECT_DELAY * this.reconnectAttempts;
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private saveResponseId() {
    try {
      if (this.responseId) {
        localStorage.setItem('grok_response_id', this.responseId);
      } else {
        localStorage.removeItem('grok_response_id');
      }
    } catch (e) {
      // localStorage might be unavailable
      console.warn('[GrokClient] Failed to save response_id:', e);
    }
  }
}
