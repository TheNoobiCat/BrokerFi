import { privateKeyToAccount } from 'viem/accounts';
import type { Account } from 'viem';

export interface SessionData {
  privateKey: string | null;
  channelAddress: string | null;
  isConnected: boolean;
  connectionTxHash: string | null;
  expiry: string | null;
  spendingLimit: string | null;
}

// IndexedDB setup for session persistence
let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open('BrokerFiSession', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('session')) {
          db.createObjectStore('session');
        }
      };
    });
  }
  return dbPromise;
}

async function saveSessionToDB(sessionData: SessionData): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('session', 'readwrite');
    const store = tx.objectStore('session');

    await new Promise<void>((resolve, reject) => {
      const request = store.put(sessionData, 'current');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    console.log('[KeyVault] Session saved to IndexedDB');
  } catch (error) {
    console.error('[KeyVault] Failed to save session:', error);
  }
}

async function loadSessionFromDB(): Promise<SessionData | null> {
  try {
    const db = await openDB();
    const tx = db.transaction('session', 'readonly');
    const store = tx.objectStore('session');

    const sessionData = await new Promise<SessionData | null>((resolve, reject) => {
      const request = store.get('current');
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });

    return sessionData;
  } catch (error) {
    console.error('[KeyVault] Failed to load session:', error);
    return null;
  }
}

async function clearSessionFromDB(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('session', 'readwrite');
    const store = tx.objectStore('session');

    await new Promise<void>((resolve, reject) => {
      const request = store.delete('current');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    console.log('[KeyVault] Session cleared from IndexedDB');
  } catch (error) {
    console.error('[KeyVault] Failed to clear session:', error);
  }
}

function isSessionExpired(sessionData: SessionData): boolean {
  if (!sessionData.expiry) return false;
  const expiryTime = BigInt(sessionData.expiry);
  const now = BigInt(Math.floor(Date.now() / 1000));
  return now >= expiryTime;
}

async function getValidSessionData(): Promise<SessionData | null> {
  const sessionData = await loadSessionFromDB();
  if (!sessionData) return null;

  if (isSessionExpired(sessionData)) {
    console.log('[KeyVault] Session expired, clearing...');
    await clearSessionFromDB();
    return null;
  }

  return sessionData;
}

export async function initKeyVault(): Promise<void> {
  // No service worker to initialize, just ensure IndexedDB is ready
  if (typeof window === "undefined") return;
  try {
    await openDB();
    console.log('[KeyVault] IndexedDB initialized');
  } catch (error) {
    console.error('[KeyVault] IndexedDB initialization failed:', error);
  }
}

export async function setSessionKey(key: string): Promise<void> {
  const sessionData = await getValidSessionData() || {
    privateKey: null,
    channelAddress: null,
    isConnected: false,
    connectionTxHash: null,
    expiry: null,
    spendingLimit: null,
  };

  sessionData.privateKey = key;
  await saveSessionToDB(sessionData);
}

export async function getSessionAddress(): Promise<string | null> {
  const sessionData = await getValidSessionData();
  if (!sessionData?.privateKey) return null;

  try {
    const account = privateKeyToAccount(sessionData.privateKey as `0x${string}`);
    return account.address;
  } catch (error) {
    console.error('[KeyVault] Error getting address:', error);
    return null;
  }
}

export async function signTypedData(params: {
  domain: any;
  types: any;
  primaryType: string;
  message: any;
}): Promise<`0x${string}` | null> {
  const sessionData = await getValidSessionData();
  if (!sessionData?.privateKey) {
    console.error('[KeyVault] No session key available');
    return null;
  }

  try {
    const account = privateKeyToAccount(sessionData.privateKey as `0x${string}`);
    const signature = await account.signTypedData({
      domain: params.domain,
      types: params.types,
      primaryType: params.primaryType,
      message: params.message
    });
    return signature;
  } catch (error) {
    console.error('[KeyVault] Signing error:', error);
    return null;
  }
}

export async function signMessage(message: string): Promise<`0x${string}` | null> {
  const sessionData = await getValidSessionData();
  if (!sessionData?.privateKey) {
    console.error('[KeyVault] No session key available');
    return null;
  }

  try {
    const account = privateKeyToAccount(sessionData.privateKey as `0x${string}`);
    const signature = await account.signMessage({ message });
    return signature;
  } catch (error) {
    console.error('[KeyVault] Signing error:', error);
    return null;
  }
}

export async function clearSessionKey(): Promise<void> {
  await clearSessionFromDB();
}

export async function hasSessionKey(): Promise<boolean> {
  const sessionData = await getValidSessionData();
  return !!(sessionData?.privateKey);
}

export async function getSessionAccount(): Promise<Account | null> {
  const address = await getSessionAddress();
  if (!address) return null;

  try {
    return {
      address: address as `0x${string}`,
      type: 'local' as const,
    } as Account;
  } catch (error) {
    console.error('[KeyVault] Error creating account:', error);
    return null;
  }
}

export async function setSessionData(data: Partial<Omit<SessionData, 'privateKey'>>): Promise<void> {
  const sessionData = await getValidSessionData() || {
    privateKey: null,
    channelAddress: null,
    isConnected: false,
    connectionTxHash: null,
    expiry: null,
    spendingLimit: null,
  };

  // Convert bigints to strings for storage
  const processedData = { ...data };
  if (processedData.expiry && typeof processedData.expiry === 'bigint') {
    processedData.expiry = (processedData.expiry as bigint).toString();
  }
  if (processedData.spendingLimit && typeof processedData.spendingLimit === 'bigint') {
    processedData.spendingLimit = (processedData.spendingLimit as bigint).toString();
  }

  // Update session data
  Object.assign(sessionData, processedData);
  await saveSessionToDB(sessionData);
}

export async function getSessionData(): Promise<Partial<SessionData>> {
  const sessionData = await getValidSessionData();
  if (!sessionData) return {};

  return {
    channelAddress: sessionData.channelAddress,
    isConnected: sessionData.isConnected,
    connectionTxHash: sessionData.connectionTxHash,
    expiry: sessionData.expiry,
    spendingLimit: sessionData.spendingLimit,
  };
}

export async function signBatchInstantExecute(params: {
  channelAddress: `0x${string}`;
  items: Array<{
    target: `0x${string}`;
    value: string;
    data: `0x${string}`;
  }>;
  nonce: number;
  chainId: number;
}): Promise<`0x${string}` | null> {
  const sessionData = await getValidSessionData();
  if (!sessionData?.privateKey) {
    console.error('[KeyVault] No session key available for batch signing');
    return null;
  }

  try {
    const account = privateKeyToAccount(sessionData.privateKey as `0x${string}`);

    const domain = {
      name: 'InstantExecutionChannel',
      version: '2',
      chainId: params.chainId,
      verifyingContract: params.channelAddress,
    };

    const types = {
      BatchInstantExecute: [
        { name: 'items', type: 'BatchItem[]' },
        { name: 'nonce', type: 'uint256' },
      ],
      BatchItem: [
        { name: 'target', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'data', type: 'bytes' },
      ],
    };

    const message = {
      items: params.items,
      nonce: params.nonce,
    };

    const signature = await account.signTypedData({
      domain,
      types,
      primaryType: 'BatchInstantExecute',
      message
    });

    return signature;
  } catch (error) {
    console.error('[KeyVault] Batch signing error:', error);
    return null;
  }
}
