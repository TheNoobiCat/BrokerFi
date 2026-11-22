"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface UIState {
  mobileNavOpen: boolean;
  bridgeOpen: boolean;
  bridgeChannel: string | null;
  bridgeRequest: boolean;
  agentSidebarOpen: boolean;
  chartContext: string | null;
  queuedAgentMessage: string | null;
  depositOptionsOpen: boolean;
  depositOptionsChannel: string | null;
  auraChannelWarningOpen: boolean;
  channelSelectorOpen: boolean;
  showOnboarding: boolean;
  globalLoading: boolean;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
}

interface UIContextType extends UIState {
  setMobileNavOpen: (open: boolean) => void;
  openBridge: () => void;
  closeBridge: () => void;
  setBridgeChannel: (addr: string | null) => void;
  setBridgeRequest: (v: boolean) => void;
  setAgentSidebarOpen: (open: boolean) => void;
  setChartContext: (context: string | null) => void;
  setQueuedAgentMessage: (message: string | null) => void;
  openDepositOptions: (channelAddr: string | null) => void;
  closeDepositOptions: () => void;
  setDepositOptionsChannel: (addr: string | null) => void;
  openAuraChannelWarning: () => void;
  closeAuraChannelWarning: () => void;
  openChannelSelector: () => void;
  closeChannelSelector: () => void;
  setShowOnboarding: (show: boolean) => void;
  setGlobalLoading: (loading: boolean) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info', duration?: number) => void;
  hideToast: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [bridgeOpen, setBridgeOpen] = useState(false);
  const [bridgeChannel, setBridgeChannel] = useState<string | null>(null);
  const [bridgeRequest, setBridgeRequest] = useState(false);
  const [agentSidebarOpen, setAgentSidebarOpen] = useState(false);
  const [chartContext, setChartContext] = useState<string | null>(null);
  const [queuedAgentMessage, setQueuedAgentMessage] = useState<string | null>(null);

  // Keep a body-level CSS hook so global styles (e.g. marquee) can respond
  // immediately to the agent sidebar state without relying on z-index/stacks.
  useEffect(() => {
    try {
      if (agentSidebarOpen) document.body.classList.add('agent-sidebar-open');
      else document.body.classList.remove('agent-sidebar-open');
    } catch (e) {
      /* ignore in SSR or environments without document */
    }
  }, [agentSidebarOpen]);
  const [depositOptionsOpen, setDepositOptionsOpen] = useState(false);
  const [depositOptionsChannel, setDepositOptionsChannel] = useState<string | null>(null);
  const [auraChannelWarningOpen, setAuraChannelWarningOpen] = useState(false);
  const [channelSelectorOpen, setChannelSelectorOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  // Global loading overlay should be off by default; components opt-in when needed
  const [globalLoading, setGlobalLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const openBridge = () => setBridgeOpen(true);
  const closeBridge = () => {
    setBridgeOpen(false);
    setBridgeRequest(false);
  };

  const openDepositOptions = (channelAddr: string | null) => {
    setDepositOptionsChannel(channelAddr);
    setDepositOptionsOpen(true);
  };
  const closeDepositOptions = () => {
    setDepositOptionsOpen(false);
    setDepositOptionsChannel(null);
  };

  const openAuraChannelWarning = () => setAuraChannelWarningOpen(true);
  const closeAuraChannelWarning = () => setAuraChannelWarningOpen(false);

  const openChannelSelector = () => setChannelSelectorOpen(true);
  const closeChannelSelector = () => setChannelSelectorOpen(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 3000) => {
    setToast({ message, type });
    // Auto-hide after specified duration (default 3 seconds, longer for success)
    const hideDuration = type === 'success' ? Math.max(duration, 5000) : duration; // Success toasts show at least 5 seconds
    setTimeout(() => setToast(null), hideDuration);
  };

  const hideToast = () => setToast(null);

  return (
    <UIContext.Provider
      value={{
        mobileNavOpen,
        bridgeOpen,
        bridgeChannel,
        bridgeRequest,
        agentSidebarOpen,
        chartContext,
        queuedAgentMessage,
        depositOptionsOpen,
        depositOptionsChannel,
        auraChannelWarningOpen,
        channelSelectorOpen,
        showOnboarding,
        globalLoading,
        toast,
        setMobileNavOpen,
        openBridge,
        closeBridge,
        setBridgeChannel,
        setBridgeRequest,
        setAgentSidebarOpen,
        setChartContext,
        setQueuedAgentMessage,
        openDepositOptions,
        closeDepositOptions,
        setDepositOptionsChannel,
        openAuraChannelWarning,
        closeAuraChannelWarning,
        openChannelSelector,
        closeChannelSelector,
        setShowOnboarding,
        setGlobalLoading,
        showToast,
        hideToast,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}
