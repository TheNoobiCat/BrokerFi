/**
 * IndexedDB-based chat history store for Vibetrader.
 * Stores chat sessions with messages, supports CRUD + bulk delete.
 */

import type { ChatMessage } from "@/hooks/useGrok";

// ── Stored types (JSON-safe versions of ChatMessage) ──

export interface StoredMessage {
  id: string;
  role: "user" | "assistant" | "tool_call" | "error" | "info" | "trade_confirmation" | "close_confirmation" | "tool_executing" | "tool_complete";
  content: string;
  timestamp: string; // ISO string
  toolCalls?: {
    index: number;
    id: string;
    type: string;
    function: { name: string; arguments: string };
  }[];
  pendingToolIds?: string[];
  toolResults?: Record<string, string>;
  tradeData?: any;
  tradeStatus?: string;
  tradeError?: string;
}

export interface ChatSession {
  id: string;
  name: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  messages: StoredMessage[];
}

// ── Serialisation helpers ──

export function serializeMessage(msg: ChatMessage): StoredMessage {
  return {
    id: msg.id,
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp.toISOString(),
    toolCalls: msg.toolCalls,
    pendingToolIds: msg.pendingTools ? Array.from(msg.pendingTools) : undefined,
    toolResults: msg.toolResults
      ? Object.fromEntries(msg.toolResults)
      : undefined,
    tradeData: msg.tradeData,
    tradeStatus: msg.tradeStatus,
    tradeError: msg.tradeError,
  };
}

export function deserializeMessage(stored: StoredMessage): ChatMessage {
  return {
    id: stored.id,
    role: stored.role,
    content: stored.content,
    timestamp: new Date(stored.timestamp),
    toolCalls: stored.toolCalls,
    pendingTools: stored.pendingToolIds
      ? new Set(stored.pendingToolIds)
      : undefined,
    toolResults: stored.toolResults
      ? new Map(Object.entries(stored.toolResults))
      : undefined,
    tradeData: stored.tradeData,
    tradeStatus: stored.tradeStatus as ChatMessage['tradeStatus'],
    tradeError: stored.tradeError,
  };
}

// ── Relative-time label helper ──

export function relativeTimeLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();

  // Zero out times for day comparison
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffMs = startOfToday.getTime() - startOfDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return "1 week ago";
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffDays < 30) return `${diffWeeks} weeks ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return "1 month ago";
  if (diffMonths < 12) return `${diffMonths} months ago`;
  const diffYears = Math.floor(diffMonths / 12);
  if (diffYears === 1) return "1 year ago";
  return `${diffYears} years ago`;
}

// ── IndexedDB wrapper ──

const DB_NAME = "vibetrader-chats";
const DB_VERSION = 1;
const STORE_NAME = "sessions";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllSessions(): Promise<ChatSession[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.index("updatedAt").openCursor(null, "prev");
    const results: ChatSession[] = [];
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        results.push(cursor.value as ChatSession);
        cursor.continue();
      } else {
        resolve(results);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getSession(id: string): Promise<ChatSession | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(id);
    req.onsuccess = () => resolve(req.result as ChatSession | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function saveSession(session: ChatSession): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(session);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteSession(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteAllSessions(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
