"use client";

import { useUI } from "@/store/UIContext";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import AuraChannelWarningPortal from "./ui/AuraChannelWarningPortal";
import Header from "./layout/Header";
import Onboarder from "./onboarding/Onboarder";
import TestnetMarquee from "./ui/TestnetMarquee";

interface LayoutWrapperProps {
  children: React.ReactNode;
  testnet?: boolean;
}

export default function LayoutWrapper({ children, testnet }: LayoutWrapperProps) {
  const { agentSidebarOpen, setAgentSidebarOpen, auraChannelWarningOpen, openAuraChannelWarning, closeAuraChannelWarning, channelSelectorOpen, closeChannelSelector, depositOptionsOpen } = useUI();
  const { isConnected: walletConnected } = useAccount();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <>
      {testnet && <TestnetMarquee />}
      <div
        className={`relative transition-transform duration-500 ease-in-out origin-center ${
          agentSidebarOpen && !isMobile ? "scale-90" : "scale-100"
        }`}
        style={{
          width: agentSidebarOpen && !isMobile ? 'calc(100vw - 384px)' : '100vw'
        }}
      >
        <Header />
        {children}
      </div>

      {/* Mobile Aura FAB */}
      {isMobile && !agentSidebarOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => {
              if (!walletConnected) {
                // Handle wallet connection if needed
              } else {
                openAuraChannelWarning();
              }
            }}
            className="flex items-center gap-3 bg-surface border border-white/20 rounded-full px-4 py-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 group"
          >
            <svg
              width="16px"
              height="16px"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-white transition-colors"
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
            <div className="flex flex-col items-start">
              <span className="text-sm font-semibold text-white">Aura</span>
              <span className="text-xs text-white/60">AI Agent</span>
            </div>
          </button>
        </div>
      )}

      {/* Aura Channel Warning Portal */}
      <AuraChannelWarningPortal
        isOpen={auraChannelWarningOpen}
        onClose={closeAuraChannelWarning}
      />

      {/* Channel Selector (for Aura channel changes) */}
      {walletConnected && channelSelectorOpen && !depositOptionsOpen && (
        <Onboarder
          isOpen={channelSelectorOpen}
          mode="channelSelector"
          onClose={closeChannelSelector}
        />
      )}
    </>
  );
}