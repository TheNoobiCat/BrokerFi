"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ChatMessage } from "@/hooks/useGrok";
import {
  ChatSession,
  getAllSessions,
  getSession,
  saveSession,
  deleteSession,
  deleteAllSessions,
  serializeMessage,
  deserializeMessage,
  relativeTimeLabel,
} from "@/services/chatStore";

export interface ChatHistoryEntry {
  id: string;
  name: string;
  label: string; // relative time label
  updatedAt: string;
  messageCount: number;
}

export interface UseChatHistoryReturn {
  /** Sorted list of past chats (newest first) */
  sessions: ChatHistoryEntry[];
  /** Currently active session id, or null */
  activeSessionId: string | null;
  /** Whether the session list is still loading from IDB */
  loading: boolean;
  /** Start a brand new chat — returns the new session id */
  createSession: () => string;
  /** Load a session's messages and set it as active */
  loadSession: (id: string) => Promise<ChatMessage[]>;
  /** Persist the current messages into the active session */
  persistMessages: (messages: ChatMessage[]) => Promise<void>;
  /** Rename a session */
  renameSession: (id: string, name: string) => Promise<void>;
  /** Delete one session */
  removeSession: (id: string) => Promise<void>;
  /** Delete all sessions */
  removeAllSessions: () => Promise<void>;
  /** Go back to session list (deselect active) */
  backToList: () => void;
}

export function useChatHistory(): UseChatHistoryReturn {
  const [sessions, setSessions] = useState<ChatHistoryEntry[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load session list from IDB on mount
  const refreshSessions = useCallback(async () => {
    try {
      const all = await getAllSessions();
      setSessions(
        all.map((s) => ({
          id: s.id,
          name: s.name,
          label: relativeTimeLabel(s.updatedAt),
          updatedAt: s.updatedAt,
          messageCount: s.messages.length,
        }))
      );
    } catch {
      // IndexedDB unavailable — degrade silently
    }
  }, []);

  useEffect(() => {
    refreshSessions().finally(() => setLoading(false));
  }, [refreshSessions]);

  const createSession = useCallback((): string => {
    const id = `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();
    const session: ChatSession = {
      id,
      name: "New Chat",
      createdAt: now,
      updatedAt: now,
      messages: [],
    };
    // Fire-and-forget save + refresh
    saveSession(session).then(refreshSessions);
    setActiveSessionId(id);
    return id;
  }, [refreshSessions]);

  const loadSession = useCallback(async (id: string): Promise<ChatMessage[]> => {
    const session = await getSession(id);
    if (!session) return [];
    setActiveSessionId(id);
    return session.messages.map(deserializeMessage);
  }, []);

  const persistMessages = useCallback(
    async (messages: ChatMessage[]) => {
      if (!activeSessionId) return;
      const existing = await getSession(activeSessionId);
      if (!existing) return;

      // Auto-name: use first user message (truncated)
      let name = existing.name;
      if (name === "New Chat" && messages.length > 0) {
        const firstUser = messages.find((m) => m.role === "user");
        if (firstUser) {
          name =
            firstUser.content.length > 40
              ? firstUser.content.slice(0, 40) + "..."
              : firstUser.content;
        }
      }

      await saveSession({
        ...existing,
        name,
        updatedAt: new Date().toISOString(),
        messages: messages.map(serializeMessage),
      });
      await refreshSessions();
    },
    [activeSessionId, refreshSessions]
  );

  const renameSession = useCallback(
    async (id: string, name: string) => {
      const session = await getSession(id);
      if (!session) return;
      await saveSession({ ...session, name });
      await refreshSessions();
    },
    [refreshSessions]
  );

  const removeSession = useCallback(
    async (id: string) => {
      await deleteSession(id);
      if (activeSessionId === id) setActiveSessionId(null);
      await refreshSessions();
    },
    [activeSessionId, refreshSessions]
  );

  const removeAllSessions = useCallback(async () => {
    await deleteAllSessions();
    setActiveSessionId(null);
    await refreshSessions();
  }, [refreshSessions]);

  const backToList = useCallback(() => {
    setActiveSessionId(null);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    const timer = saveTimerRef.current;
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  return {
    sessions,
    activeSessionId,
    loading,
    createSession,
    loadSession,
    persistMessages,
    renameSession,
    removeSession,
    removeAllSessions,
    backToList,
  };
}
