"use client";

import { redirect } from "next/navigation";
import { useState, useEffect } from "react";
import React from "react";
import { useParams } from "next/navigation";
import { useAccount } from 'wagmi';
import Sidebar from "@/components/layout/Sidebar";
import Dashboard from "@/components/trading/Dashboard";
import OnboardingBanner from "@/components/onboarding/OnboardingBanner";
import Bridge from "@/components/onboarding/Onboarder";
import { useUI } from '@/store/UIContext';
import { useTradingContext } from "@/store/TradingContext";
import { useSession } from "@/store/SessionContext";
import { getAssetBySlug } from "@/services/assets";

export default function PerpetualMarketPage() {
  const params = useParams();
  const { isConnected } = useAccount();
  const { isConnected: sessionConnected } = useSession();
  const { setGlobalLoading } = useUI();
  const { initializeAsset } = useTradingContext();
  const [showBridge, setShowBridge] = useState(false);
  const [assetExists, setAssetExists] = useState<boolean | null>(null);

  // Initialize asset in the (single) TradingContext when market param changes
  useEffect(() => {
    if (!params.market) return;
    const marketToAssetMap: Record<string, string> = {
      'btc-perp': 'crypto-btcusd',
      'eth-perp': 'crypto-ethusd',
    };
    const slug = marketToAssetMap[params.market as string] || params.market as string;
    const init = async () => {
      try {
        await initializeAsset(slug);
      } catch (err: unknown) {
        console.error('Failed to initialize asset:', err);
      }
    };
    init();
  }, [params.market, initializeAsset]);

  // Validate asset exists, redirect if invalid
  useEffect(() => {
    if (!params.market) return;
    
    const validateAsset = async () => {
      try {
        // Map market ID to asset slug
        const marketToAssetMap: Record<string, string> = {
          'btc-perp': 'crypto-btcusd',
          'eth-perp': 'crypto-ethusd',
          // Add more mappings as needed
        };
        
        const assetSlug = marketToAssetMap[params.market as string] || params.market as string;
        
        const asset = await getAssetBySlug(assetSlug);
        if (!asset) {
          // Asset doesn't exist, redirect to default (Bitcoin)
          redirect("/perpetual/crypto-btcusd");
          return;
        }
        
        // Block coming-soon assets from having a page
        if (asset.comingSoon) {
          redirect("/perpetual/crypto-btcusd");
          return;
        }
        
        setAssetExists(true);
      } catch (error) {
        // On error, redirect to default
        redirect("/perpetual/crypto-btcusd");
      }
    };

    validateAsset();
  }, [params.market]);

  // Set global loading based on asset validation
  useEffect(() => {
    setGlobalLoading(assetExists === null);
  }, [assetExists, setGlobalLoading]);

  const handleStartOnboarding = () => {
    if (isConnected) {
      setShowBridge(true);
    }
  };

  const { bridgeRequest, bridgeOpen, closeBridge, depositOptionsOpen, closeDepositOptions } = useUI();
  const { sessionWallet } = useSession();

  // Handle bridgeRequest (one-time trigger)
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | null = null;
    if (bridgeRequest) {
      t = setTimeout(() => setShowBridge(true), 0);
      // clear the request so it doesn't repeatedly open
      closeBridge();
    }
    return () => { if (t) clearTimeout(t); };
  }, [bridgeRequest, closeBridge]);

  // Sync showBridge with bridgeOpen or depositOptionsOpen from UIContext
  useEffect(() => {
    setShowBridge(bridgeOpen || depositOptionsOpen);
  }, [bridgeOpen, depositOptionsOpen]);

  // Don't render until asset validation is complete
  if (assetExists === null) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {!sessionConnected && (
        <OnboardingBanner onStartOnboarding={handleStartOnboarding} />
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <Dashboard />
      </div>

      {isConnected && showBridge && (
        <Bridge 
          isOpen={showBridge} 
          onClose={() => {
            setShowBridge(false);
            closeBridge();
            closeDepositOptions();
          }} 
        />
      )}
    </div>
  );
}
