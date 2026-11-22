import { encodeFunctionData, parseUnits, PublicClient, type WalletClient, numberToHex } from "viem";
import { factoryAbi } from '@/blockchain/abis';
import { arbitrumSepolia } from "viem/chains";
import { encode } from '@msgpack/msgpack';

export interface ChannelCreationMessage {
  user: `0x${string}`;
  nonce: bigint;
  captchaToken: string;
  signature: `0x${string}`;
}

export interface ChannelCreationResponse {
  success: boolean;
  channelAddress?: `0x${string}`;
  txHash?: string;
  error?: string;
}

export async function createChannelTxn(
  walletClient: WalletClient
): Promise<{ success: boolean; txHash?: string; channelAddress?: string; error?: string }> {
  try {
    if (!walletClient.account) {
      return { success: false, error: "No account connected" };
    }

    const factoryAddress = process.env
      .NEXT_PUBLIC_CHANNEL_FACTORY as `0x${string}`;
    if (!factoryAddress) {
      return { success: false, error: "Factory address not configured" };
    }

    const data = encodeFunctionData({
      abi: factoryAbi,
      functionName: "createChannel",
      args: [],
    });

    const txHash = await walletClient.sendTransaction({
      account: walletClient.account,
      chain: walletClient.chain,
      to: factoryAddress,
      data,
      value: BigInt(0),
    });

    return { success: true, txHash };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function createChannelGasless(
  walletClient: WalletClient,
  captchaToken: string,
  relayerUrl: string = 'ws://localhost:4001/ws',
  onStatusUpdate?: (status: string, data?: any) => void
): Promise<{ success: boolean; channelAddress?: string; txHash?: string; error?: string }> {
  try {
    if (!walletClient.account) {
      return { success: false, error: "No account connected" };
    }

    // Create the message to sign
    const message = {
      user: walletClient.account.address,
      nonce: BigInt(Date.now()),
    };

    // Sign the message with EIP-712
    const signature = await walletClient.signTypedData({
      account: walletClient.account,
      domain: CHANNEL_CREATION_DOMAIN,
      types: CHANNEL_CREATION_TYPES,
      primaryType: 'Deploy',
      message,
    });

    // Create the channel creation message
    const channelMessage: ChannelCreationMessage = {
      user: walletClient.account.address,
      nonce: message.nonce,
      captchaToken,
      signature,
    };

    // Send to relayer via WebSocket
    return await sendChannelCreationToRelayer(channelMessage, relayerUrl, onStatusUpdate);
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

async function sendChannelCreationToRelayer(
  message: ChannelCreationMessage,
  relayerUrl: string,
  onStatusUpdate?: (status: string, data?: any) => void
): Promise<ChannelCreationResponse> {
  return new Promise((resolve) => {
    const ws = new WebSocket(relayerUrl);
    let settled = false;

    console.log('WebSocket created for', relayerUrl);

    const safeResolve = (val: ChannelCreationResponse) => {
      if (settled) return;
      settled = true;
      console.log('Resolving with', val);
      try { resolve(val); } catch {}
    };

    ws.onopen = () => {
      console.log('WebSocket opened');
      // Convert signature from hex string to bytes
      const signatureBytes = new Uint8Array(message.signature.slice(2).match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);

      // Use the nonce from the signed message
      const nonce = Number(message.nonce);

      // Create MessagePack encoded message
      const msgpackMessage = {
        ver: "1.0",
        typ: "channel_create",
        usr: message.user,
        nonce: nonce,
        cap: message.captchaToken,
        sig: signatureBytes,
        chain: arbitrumSepolia.id,
      };

      console.log('Sending message', msgpackMessage);
      // Send the MessagePack encoded message
      try {
        ws.send(encode(msgpackMessage));
        console.log('Message sent successfully');
      } catch (e) {
        console.log('Send error', e);
        safeResolve({ success: false, error: String(e) });
      }
    };

    ws.onmessage = async (event) => {
      console.log('Received message', event.data);
      try {
        // Normalize incoming data to string (handle Blob / ArrayBuffer)
        let text: string;
        if (typeof event.data === 'string') {
          text = event.data;
        } else if (event.data instanceof Blob) {
          text = await event.data.text();
        } else if (event.data instanceof ArrayBuffer) {
          text = new TextDecoder().decode(event.data);
        } else {
          text = String(event.data);
        }

        console.log('Message text', text);

        // Parse JSON and support either the server envelope { type, ts, payload }
        let parsed: any;
        try {
          parsed = JSON.parse(text);
        } catch (parseErr) {
          console.error('[Channel] Failed to parse JSON from relayer:', parseErr, 'Raw data:', text);
          safeResolve({ success: false, error: 'Invalid JSON response from relayer' });
          try { ws.close(); } catch {}
          return;
        }
        console.log('Parsed message', parsed);
        if (parsed && parsed.payload && typeof parsed.payload === 'object') {
          // flatten payload but keep top-level type if present
          parsed = { ...(parsed.payload || {}), type: parsed.type || parsed.payload.type };
          console.log('Flattened message', parsed);
        }

        // Handle different message types sent by the relayer
        if (parsed.type === 'channel_create_response' && (parsed.status === 'received' || parsed.payload?.status === 'received')) {
          console.log('Received channel_create_response');
          onStatusUpdate?.('relayer_accepted');
          // keep the connection open to receive queued/created messages
          return;
        }

        if (parsed.type === 'channel_create_progress') {
          // Could surface progress steps if the UI wants them
          console.log('Received channel_create_progress');
          onStatusUpdate?.('pending_block');
          return;
        }

        if (parsed.type === 'channel_create_result' && parsed.status === 'queued') {
          console.log('Received channel_create_result queued');
          onStatusUpdate?.('pending_block');
          // Keep connection open to receive channel_created
          // Don't resolve yet
          return;
        }

        if (parsed.type === 'channel_create_result' && parsed.status === 'confirmed') {
          console.log('Received channel_create_result confirmed');
          onStatusUpdate?.('channel_created', { txHash: 'batched', channelAddress: parsed.channel });
          safeResolve({ success: true, channelAddress: parsed.channel, txHash: 'batched' });
          try { ws.close(); } catch {}
          return;
        }

        if (parsed.type === 'batch_timing') {
          console.log('Received batch timing update', parsed);
          // Update status with remaining time
          onStatusUpdate?.('batch_timing', parsed);
          return;
        }

        if (parsed.type === 'channel_created') {
          console.log('Received channel_created');
          onStatusUpdate?.('channel_created', parsed);
          safeResolve({ success: true, channelAddress: parsed.channelAddress, txHash: parsed.txHash });
          try { ws.close(); } catch {}
          return;
        }

        if (parsed.type === 'channel_create_error') {
          console.log('Received channel_create_error', parsed);
          safeResolve({ success: false, error: parsed.error || parsed.detail || JSON.stringify(parsed) });
          try { ws.close(); } catch {}
          return;
        }

        // Unknown message: keep connection open but log for debugging
        console.log('Unknown message type', parsed.type);
        // console.debug('Relayer: unknown message', parsed);
      } catch (err) {
        console.log('Error processing message', err);
        safeResolve({ success: false, error: 'Invalid response from relayer: ' + String(err) });
        try { ws.close(); } catch {}
      }
    };

    ws.onerror = (ev) => {
      console.log('WebSocket error', ev);
      safeResolve({ success: false, error: 'WebSocket error' });
    };

    ws.onclose = (ev) => {
      console.log('WebSocket closed', ev.code, ev.reason);
      if (!settled) {
        // 1005 means no status; report that to user
        safeResolve({ success: false, error: `Connection closed by relayer (code=${ev.code}, reason=${ev.reason || 'none'})` });
      }
    };

    // Timeout after 60 seconds
    const to = setTimeout(() => {
      console.log('Timeout reached');
      if (!settled) {
        try { ws.close(); } catch {}
        safeResolve({ success: false, error: 'Request timeout' });
      }
    }, 60000);
  });
}

export async function getChannelList(
  ownerAddress: `0x${string}`,
  client: PublicClient
): Promise<{ success: boolean; channels?: `0x${string}`[]; error?: string }> {
  try {
    const factoryAddress = process.env.NEXT_PUBLIC_CHANNEL_FACTORY as `0x${string}`;
    if (!factoryAddress) return { success: false, error: 'Factory address not configured' }

    const result = await client.readContract({
      address: factoryAddress,
      abi: factoryAbi,
      functionName: 'getUserChannels',
      args: [ownerAddress],
    })

    return { success: true, channels: result as `0x${string}`[] }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

const CHANNEL_CREATION_DOMAIN = {
  name: 'InstantExecutionChannelFactory',
  version: '2',
  chainId: arbitrumSepolia.id,
  verifyingContract: process.env.NEXT_PUBLIC_CHANNEL_FACTORY as `0x${string}`,
} as const;

const CHANNEL_CREATION_TYPES = {
  Deploy: [
    { name: 'user', type: 'address' },
    { name: 'nonce', type: 'uint256' },
  ]
} as const;

const DOMAIN = {
  name: 'InstantExecutionChannel',
  version: '2',
  chainId: arbitrumSepolia.id,
} as const;

const TYPES = {
  Reconnect: [
    { name: 'sessionKey', type: 'address' },
    { name: 'duration', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
  ]
} as const;

export interface ReconnectSignature {
    sessionKey: string
    duration: bigint
    nonce: bigint
    signature: `0x${string}`
}

export async function generateReconnectSignature(
    walletClient: WalletClient,
    channelAddress: `0x${string}`,
    sessionKey: `0x${string}`,
    duration: number = 1 * 60 * 60,
): Promise<ReconnectSignature> {
  if (!walletClient.account) {
    throw new Error('No account connected')
  }

  const nonce = BigInt(Date.now()+Math.floor(Math.random()*1000))

  const expiry = BigInt(Math.floor(Date.now() / 1000) + duration)

  const message = {
    sessionKey,
    duration: BigInt(duration),
    nonce: nonce,
  }

  const domain = {
    ...DOMAIN,
    verifyingContract: channelAddress,
  }

  try {
    const currentChainId = (walletClient as any).chain?.id ?? undefined;
    if (currentChainId !== arbitrumSepolia.id && typeof (walletClient as any).request === 'function') {
      try {
        await (walletClient as any).request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: numberToHex(arbitrumSepolia.id) }],
        });
      } catch (switchErr) {
      }
    }
  } catch (e) {
  }

  let signature: `0x${string}`;
  try {
    signature = await walletClient.signTypedData({
      account: walletClient.account,
      domain,
      types: TYPES,
      primaryType: 'Reconnect',
      message,
    });
  } catch (err) {
    const msg = String((err as any)?.message || err || '');
    if (msg.includes('chainId') || msg.includes('current chainId')) {
      throw new Error(`Signature failed: wallet must be connected to Arbitrum Sepolia (chainId ${arbitrumSepolia.id}). Original: ${msg}`);
    }
    throw err;
  }

  return {
    sessionKey,
    duration: BigInt(duration),
    nonce: nonce,
    signature,
  }
}
