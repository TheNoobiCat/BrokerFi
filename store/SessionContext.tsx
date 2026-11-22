"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import type { Account } from 'viem';
import { getSessionAccount, getSessionData, setSessionData, clearSessionKey } from '@/services/keyVault';

interface SessionState {
  sessionWallet: Account | null;
  channelAddress: string | null;
  isConnected: boolean;
  connectionTxHash: string | null;
  expiry: bigint | null;
  spendingLimit: bigint | null;
}

interface SessionContextType extends SessionState {
  setSession: (session: Partial<SessionState>) => void;
  clearSession: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const initialState: SessionState = {
  sessionWallet: null,
  channelAddress: null,
  isConnected: false,
  connectionTxHash: null,
  expiry: null,
  spendingLimit: null,
};

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessionState, setSessionState] = useState<SessionState>(initialState);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const restoreSession = async () => {
      try {
        const [sessionAccount, sessionData] = await Promise.all([
          getSessionAccount(),
          getSessionData()
        ]);
        
        if (sessionAccount && mounted) {
          setSessionState({
            sessionWallet: sessionAccount,
            channelAddress: sessionData.channelAddress || null,
            isConnected: sessionData.isConnected || false,
            connectionTxHash: sessionData.connectionTxHash || null,
            expiry: sessionData.expiry ? BigInt(sessionData.expiry) : null,
            spendingLimit: sessionData.spendingLimit ? BigInt(sessionData.spendingLimit) : null,
          });
        }
      } catch (err) {
        console.error('[SessionProvider] Error restoring session:', err);
      } finally {
        if (mounted) {
          setIsRestoring(false);
        }
      }
    };

    // Restore session immediately since we use direct IndexedDB access
    restoreSession();
    
    return () => {
      mounted = false;
    };
  }, []);

  const { isConnected } = useAccount();
  const prevConnectedRef = useRef<boolean | null>(null);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | null = null
        if (prevConnectedRef.current === true && isConnected === false) {
      t = setTimeout(() => {
        setSessionState(initialState);
        clearSessionKey().catch(err => {
          
        });
      }, 0)
    }
    prevConnectedRef.current = isConnected ?? false;
    return () => { if (t) clearTimeout(t) }
  }, [isConnected]);

  const setSession = (updates: Partial<SessionState>) => {
    setSessionState(prev => {
      const newState = { ...prev, ...updates };
      
      setSessionData({
        channelAddress: newState.channelAddress,
        isConnected: newState.isConnected,
        connectionTxHash: newState.connectionTxHash,
        expiry: newState.expiry ? newState.expiry.toString() : null,
        spendingLimit: newState.spendingLimit ? newState.spendingLimit.toString() : null,
      });
      
      return newState;
    });
  };

  const clearSession = () => {
    setSessionState(initialState);
    clearSessionKey().catch(err => {
    
    });
  };

  return (
    <SessionContext.Provider value={{
      ...sessionState,
      setSession,
      clearSession,
    }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
