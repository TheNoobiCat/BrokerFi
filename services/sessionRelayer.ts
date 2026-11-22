import { encode } from '@msgpack/msgpack';

// Types for the WebSocket API
export interface SignedSessionCreation {
  ver: string;        // Protocol version
  typ: string;        // Type ("session_create")
  ch: string;         // Channel address (hex)
  sk: string;         // SessionKey address (hex)
  dur: number;        // Duration in seconds
  nonce: number;      // Nonce
  sig: Uint8Array;    // Signature bytes (65 bytes)
  chain: number;      // Chain ID
}

export interface GasEstimationRequest {
  v: string;          // Protocol version
  t: string;          // Type ("gas_estimation")
  c: string;          // Channel address (hex)
  sk: string;         // SessionKey address (hex)
  exp: number;        // Expiry unix timestamp (seconds)
  sl: string;         // SpendingLimit in wei (decimal string)
  n: number;          // Nonce
  dl: number;         // Deadline unix timestamp (seconds)
  s: Uint8Array;      // Signature bytes (65 bytes)
  cid: number;        // Chain ID
}

export interface GasEstimationResult {
  estimatedGas: number;
  gasPrice: string;        // in wei (backward compatibility - now gasFeeCap)
  gasTipCap: string;       // in wei (EIP-1559 tip)
  gasFeeCap: string;       // in wei (EIP-1559 max fee)
  estimatedCost: string;   // in wei ((baseFee + gasTipCap) * gasLimit)
  minimumRelayerFee: string; // in wei (1.1x estimated cost)
}

export interface GasEstimationError {
  error: string;
  detail: string;
}

export interface BatchItem {
  to: string;
  val: string;
  d: Uint8Array;
}

export interface SignedBatchInstantExecute {
  v: string;          // Protocol version
  t: string;          // Type ("batch_instant_execute")
  c: string;          // Channel address (hex)
  items: BatchItem[]; // Array of batch items
  n: number;          // Nonce
  s: Uint8Array;      // Signature bytes (65 bytes)
  e: number;          // Expires unix timestamp (seconds)
  cid: number;        // Chain ID
  via_agent?: boolean; // Optional: true if executed by AI agent
}

export interface WSResponse<T = unknown> {
  type: string;
  ts: number;
  payload: T;
}

export interface SessionCreateResponse {
  status: 'received' | 'error';
  channel: string;
  sessionKey: string;
  nonce: number;
  reason?: string;
}

export interface SessionCreateProgress {
  step: number;
  ok: boolean;
  detail: string;
  extra?: Record<string, unknown>;
}

export interface SessionCreateError {
  step: 'validation' | 'simulation' | 'factory';
  error: string;
  detail: string;
}

export interface SessionCreateResult {
  status: 'validated' | 'queued' | 'submitted';
  txHash?: string;
  detail: string;
  gas_estimate?: string;
}

export interface ChannelCreateResponse {
  status: 'received' | 'error';
  user: string;
  nonce: number;
}

export interface ChannelCreateProgress {
  step: number;
  ok: boolean;
  detail: string;
}

export interface ChannelCreateError {
  step: string;
  error: string;
  detail: string;
}

export interface ChannelCreateResult {
  status: 'validated' | 'queued' | 'confirmed';
  channel?: string;
  detail: string;
}

export interface BatchInstantExecuteResponse {
  status: 'received' | 'error';
  channel: string;
  nonce: number;
  count: number;
}

export interface BatchInstantExecuteProgress {
  step: number;
  ok: boolean;
  detail: string;
}

export interface BatchInstantExecuteError {
  step: 'validation' | 'simulation' | 'factory';
  error: string;
  detail: string;
}

export interface BatchInstantExecuteResult {
  status: 'validated' | 'queued' | 'submitted';
  txHash?: string;
  detail: string;
  gas_estimate?: string;
}

export interface SessionCreationCallbacks {
  onResponse?: (response: SessionCreateResponse) => void;
  onProgress?: (progress: SessionCreateProgress) => void;
  onError?: (error: SessionCreateError) => void;
  onResult?: (result: SessionCreateResult) => void;
  onGenericMessage?: (message: WSResponse<unknown>) => void;
  onConnectionError?: (error: Event) => void;
  onConnectionClose?: (event: CloseEvent) => void;
  onGasEstimationResult?: (result: GasEstimationResult) => void;
  onGasEstimationError?: (error: GasEstimationError) => void;
  onChannelCreateResponse?: (response: ChannelCreateResponse) => void;
  onChannelCreateProgress?: (progress: ChannelCreateProgress) => void;
  onChannelCreateError?: (error: ChannelCreateError) => void;
  onChannelCreateResult?: (result: ChannelCreateResult) => void;
  onBatchInstantExecuteResponse?: (response: BatchInstantExecuteResponse) => void;
  onBatchInstantExecuteProgress?: (progress: BatchInstantExecuteProgress) => void;
  onBatchInstantExecuteError?: (error: BatchInstantExecuteError) => void;
  onBatchInstantExecuteResult?: (result: BatchInstantExecuteResult) => void;
}

export class SessionRelayerClient {
  private ws: WebSocket | null = null;
  private callbacks: SessionCreationCallbacks = {};

  constructor(private readonly wsUrl: string) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.wsUrl);
        this.ws.binaryType = 'arraybuffer';

        this.ws.onopen = () => {
          resolve();
        };

        this.ws.onerror = (error) => {
          this.callbacks.onConnectionError?.(error);
          reject(error);
        };

        this.ws.onclose = (event) => {
          this.callbacks.onConnectionClose?.(event);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(event: MessageEvent) {
    try {
      let response: WSResponse;
      try {
        response = JSON.parse(event.data);
      } catch (parseError) {
        console.error('Failed to parse WebSocket message as JSON:', parseError, 'Data:', event.data);
        return;
      }
      console.log('Received WebSocket message:', response);
      
      switch (response.type) {
        case 'session_create_response':
          this.callbacks.onResponse?.(response.payload as SessionCreateResponse);
          break;
        case 'session_create_progress':
          this.callbacks.onProgress?.(response.payload as SessionCreateProgress);
          break;
        case 'session_create_error':
          this.callbacks.onError?.(response.payload as SessionCreateError);
          break;
        case 'session_create_result':
          this.callbacks.onResult?.(response.payload as SessionCreateResult);
          break;
        case 'channel_create_response':
          this.callbacks.onChannelCreateResponse?.(response.payload as ChannelCreateResponse);
          break;
        case 'channel_create_progress':
          this.callbacks.onChannelCreateProgress?.(response.payload as ChannelCreateProgress);
          break;
        case 'channel_create_error':
          this.callbacks.onChannelCreateError?.(response.payload as ChannelCreateError);
          break;
        case 'channel_create_result':
          this.callbacks.onChannelCreateResult?.(response.payload as ChannelCreateResult);
          break;
        case 'gas_estimation_result':
          this.callbacks.onGasEstimationResult?.(response.payload as GasEstimationResult);
          break;
        case 'gas_estimation_error':
          this.callbacks.onGasEstimationError?.(response.payload as GasEstimationError);
          break;
        case 'batch_instant_execute_response':
          this.callbacks.onBatchInstantExecuteResponse?.(response.payload as BatchInstantExecuteResponse);
          break;
        case 'batch_instant_execute_progress':
          this.callbacks.onBatchInstantExecuteProgress?.(response.payload as BatchInstantExecuteProgress);
          break;
        case 'batch_instant_execute_error':
          this.callbacks.onBatchInstantExecuteError?.(response.payload as BatchInstantExecuteError);
          break;
        case 'batch_instant_execute_result':
          this.callbacks.onBatchInstantExecuteResult?.(response.payload as BatchInstantExecuteResult);
          break;
        case 'notice':
        case 'error':
        default:
          this.callbacks.onGenericMessage?.(response);
          break;
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  setCallbacks(callbacks: SessionCreationCallbacks) {
    this.callbacks = callbacks;
  }

  async createSession(sessionData: SignedSessionCreation): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    try {
      const encodedData = encode(sessionData);
      this.ws.send(encodedData);
    } catch (error) {
      throw error;
    }
  }

  async estimateGas(gasRequest: GasEstimationRequest): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    try {
      const encodedData = encode(gasRequest);
      this.ws.send(encodedData);
    } catch (error) {
      throw error;
    }
  }

  async sendBatchInstantExecute(batchData: SignedBatchInstantExecute): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    try {
      const encodedData = encode(batchData);
      this.ws.send(encodedData);
    } catch (error) {
      throw error;
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export function signatureToBinary(signature: `0x${string}`): Uint8Array {
  const hex = signature.slice(2);
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

export function createSessionCreationData(
  channelAddress: string,
  sessionKey: string,
  duration: bigint,
  nonce: bigint,
  signature: `0x${string}`,
  chainId: number
): SignedSessionCreation {
  return {
    ver: "1.0",
    typ: "session_create",
    ch: channelAddress,
    sk: sessionKey,
    dur: Number(duration),
    nonce: Number(nonce),
    sig: signatureToBinary(signature),
    chain: chainId
  };
}

export function createGasEstimationData(
  channelAddress: string,
  sessionKey: string,
  expiry: bigint,
  spendingLimit: bigint,
  nonce: bigint,
  deadline: bigint,
  signature: `0x${string}`,
  chainId: number
): GasEstimationRequest {
  return {
    v: "1.0",
    t: "gas_estimation",
    c: channelAddress,
    sk: sessionKey,
    exp: Number(expiry),
    sl: spendingLimit.toString(),
    n: Number(nonce),
    dl: Number(deadline),
    s: signatureToBinary(signature),
    cid: chainId
  };
}
