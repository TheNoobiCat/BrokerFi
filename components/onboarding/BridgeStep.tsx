"use client"

import { useState } from "react";
import { useAccount } from 'wagmi'
import { LiFiWidget, WidgetConfig, HiddenUI, type ToAddress, ChainType } from '@lifi/widget';
import { useSession } from "@/store/SessionContext";
import { useTradingContext } from '@/store/TradingContext'
import { QRCodeCanvas } from 'qrcode.react';
import FaucetButton from '../FaucetButton';

interface Props {
  balance?: string | null;
  setShowFiatIframe: (v: boolean) => void;
  channelAddress?: string | null;
}

const USDC_ARBITRUM = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';

export default function BridgeStep({ setShowFiatIframe, channelAddress: propChannelAddress }: Props) {
  const { channelAddress: sessionChannelAddress } = useSession();
  const { address } = useAccount();
  const channelAddress = propChannelAddress || sessionChannelAddress;
  const effectiveAddress = channelAddress || address;
  const { selectedAsset } = useTradingContext()
  const [showBridgeMenu, setShowBridgeMenu] = useState(false)
  const [showUSDCDeposit, setShowUSDCDeposit] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showMeldDeposit, setShowMeldDeposit] = useState(false)
  const [showExchangeDeposit, setShowExchangeDeposit] = useState(false)

  const isTestnet = process.env.NEXT_PUBLIC_TESTNET === 'true';

  const copyToClipboard = async () => {
    if (effectiveAddress) {
      await navigator.clipboard.writeText(effectiveAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleMeldClick = () => {
    if (effectiveAddress) {
      const url = `https://meldcrypto.com/?destinationCurrencyCode=USDC_ARBITRUM&walletAddress=${effectiveAddress}`;
      window.open(url, '_blank', 'width=600,height=800');
      setShowMeldDeposit(true);
    }
  };

  // Hide the bridge UI for non-crypto assets (we only support crypto deposits)
  if (selectedAsset && selectedAsset.type !== 'crypto') return null

  const widgetConfig: WidgetConfig = {
    integrator: 'BrokerFi',
    // Lock destination chain to Arbitrum
    toChain: 42161,
    
    // Lock destination token to USDC on Arbitrum
    toToken: USDC_ARBITRUM,
    
    // Destination address (channel address)
    toAddress: effectiveAddress ? { address: effectiveAddress, chainType: ChainType.EVM } : undefined,

    // Only allow USDC on Arbitrum as destination
    tokens: {
      to: {
        allow: [
          {
            address: USDC_ARBITRUM,
            chainId: 42161,
          },
        ],
      },
    },
    
    // Only allow Arbitrum as destination chain
    chains: {
      to: {
        allow: [42161],
      },
    },
    
    // Hide UI elements to lock destination and remove branding
    hiddenUI: [
      HiddenUI.PoweredBy,           // Remove LiFi branding
      HiddenUI.ToToken,             // Lock destination token
      HiddenUI.ReverseTokensButton, // Prevent reversing
    ],
    
    requiredUI: ["toAddress"],
    
    variant: 'compact',
    appearance: 'dark',
    
    theme: {
      palette: {
        primary: {
          main: '#8B5CF6',
        },
        background: {
          default: '#0F0F0F',
          paper: '#1A1A1A',
        },
      },
      shape: {
        borderRadius: 12,
        borderRadiusSecondary: 8,
      },
    },
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h3 className="text-lg font-bold text-white mb-2 font-sans">Deposit into BrokerFi</h3>
        <p className="text-sm text-white/70 mb-4 leading-relaxed">BrokerFi holds your channel balance in USDC. This will deposit to channel {effectiveAddress?.substring(0, 6)}...{effectiveAddress?.substring(effectiveAddress.length - 4)}</p>
      </div>
      {isTestnet && (
        <div className="mb-4">
          <FaucetButton />
        </div>
      )}
      {!showBridgeMenu && !showUSDCDeposit && !showMeldDeposit && !showExchangeDeposit && (
        <div className="flex flex-col gap-3 mb-4">
          <span className="text-xs text-white/80">Recommended</span>
          <div
            role="button"
            tabIndex={0}
            onClick={() => !isTestnet && setShowUSDCDeposit(true)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !isTestnet) setShowUSDCDeposit(true) }}
            className={`w-full p-3 bg-surface/30 border border-white/5 rounded-lg ${isTestnet ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
          >
            <div className="flex items-center gap-3">
              <div>
                <img src="/bridgelogos/usdc.png" alt="USDC" className="w-6 h-6 rounded mb-3" />
                <div className="text-sm text-white font-semibold">Deposit USDC</div>
                <div className="text-xs text-white/60">Directly deposit USDC from Arbitrum <br/> No limit • less than 5 seconds</div>
              </div>
            </div>
          </div>
          <div
            role="button"
            tabIndex={0}
            onClick={() => !isTestnet && handleMeldClick()}
            onKeyDown={(e) => { if (e.key === 'Enter' && !isTestnet) handleMeldClick() }}
            className={`w-full p-3 bg-surface/30 border border-white/5 rounded-lg ${isTestnet ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
          >
            <div className="flex items-center gap-3">
              <div>
                <div className="text-sm text-white font-semibold mb-0.5">Debit Card + more</div>
                <div className="text-xs text-white/60">Directly deposits USDC into your channel</div>
              </div>
            </div>
          </div>
          <span className="text-xs text-white/80 mt-4">More options</span>
          <div
            role="button"
            tabIndex={0}
            onClick={() => !isTestnet && setShowBridgeMenu(true)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !isTestnet) setShowBridgeMenu(true) }}
            className={`w-full p-3 bg-surface/30 border border-white/5 rounded-lg ${isTestnet ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <img src="/bridgelogos/ethereum.png" alt="Ethereum" className="w-6 h-6 rounded" />
                <img src="/bridgelogos/bitcoin.png" alt="Bitcoin" className="w-6 h-6 rounded" />
                <span className="text-white/60 font-semibold">+</span>
              </div>
              <div>
                <div className="text-sm text-white font-semibold">Transfer Crypto</div>
                <div className="text-xs text-white/60">No limit • 2 min</div>
              </div>
            </div>
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={() => !isTestnet && setShowExchangeDeposit(true)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !isTestnet) setShowExchangeDeposit(true) }}
            className={`w-full p-3 bg-surface/30 border border-white/5 rounded-lg ${isTestnet ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <img src="/bridgelogos/binancelogo.png" alt="Binance" className="w-6 h-6 rounded" />
                <img src="/bridgelogos/crypto.com-logo.png" alt="Crypto.com" className="w-6 h-6 rounded" />
              </div>
              <div>
                <div className="text-sm text-white font-semibold">Deposit from Exchange</div>
                <div className="text-xs text-white/60">No limit • 2 min</div>
              </div>
            </div>
          </div>

          
        </div>
      )}

      {showMeldDeposit && (
        <div className="rounded bg-surface/10 p-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setShowMeldDeposit(false)} className="text-white/80 hover:text-white text-sm">← Back</button>
            <div className="text-sm text-white/80">Debit Card + More</div>
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <div className="text-center">
              <p className="text-sm text-white/70">This is provided by Meld.io, a third party onramp service.</p>
            </div>
          </div>
        </div>
      )}

      {showExchangeDeposit && (
        <div className="rounded bg-surface/10 p-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setShowExchangeDeposit(false)} className="text-white/80 hover:text-white text-sm">← Back</button>
            <div className="text-sm text-white/80">Withdraw from Exchange</div>
          </div>
          <div className="flex flex-col items-center gap-4">
            <QRCodeCanvas value={effectiveAddress || ''} size={200} />
            <div className="text-center">
              <p className="text-sm text-white/70 mb-2">Use this address to withdraw USDC from your exchange to Arbitrum</p>
              <p className="text-xs text-white/60 break-all bg-surface/20 p-2 rounded">{effectiveAddress}</p>
              <button
                onClick={copyToClipboard}
                className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                {copied ? 'Copied!' : 'Copy Address'}
              </button>
            </div>
            <div className="text-left space-y-3 max-w-md">
              <p className="text-sm font-semibold text-white/90">Follow these steps:</p>
              <div className="space-y-2">
                <div className="p-3 bg-surface/20 border border-white/10 rounded-lg">
                  <p className="text-sm text-white/70"><span className="font-medium text-white/90">1.</span> Go to your exchange's withdrawal page</p>
                </div>
                <div className="p-3 bg-surface/20 border border-white/10 rounded-lg">
                  <p className="text-sm text-white/70"><span className="font-medium text-white/90">2.</span> Select USDC as the asset to withdraw</p>
                </div>
                <div className="p-3 bg-surface/20 border border-white/10 rounded-lg">
                  <p className="text-sm text-white/70"><span className="font-medium text-white/90">3.</span> Choose Arbitrum as the network</p>
                </div>
                <div className="p-3 bg-surface/20 border border-white/10 rounded-lg">
                  <p className="text-sm text-white/70"><span className="font-medium text-white/90">4.</span> Paste the address above and enter the amount</p>
                </div>
                <div className="p-3 bg-surface/20 border border-white/10 rounded-lg">
                  <p className="text-sm text-white/70"><span className="font-medium text-white/90">5.</span> Double-check and confirm the withdrawal</p>
                </div>
              </div>
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-sm text-yellow-200 font-medium">Only withdraw native USDC (not bridged or wrapped versions)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showUSDCDeposit && (
        <div className="rounded bg-surface/10 p-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setShowUSDCDeposit(false)} className="text-white/80 hover:text-white text-sm">← Back</button>
            <div className="text-sm text-white/80">Direct USDC Deposit</div>
          </div>
          <div className="flex flex-col items-center gap-4">
            <QRCodeCanvas value={effectiveAddress || ''} size={200} />
            <div className="text-center">
              <p className="text-sm text-white/70 mb-2">Scan this QR code or copy the address below to deposit USDC directly</p>
              <p className="text-xs text-white/60 break-all bg-surface/20 p-2 rounded">{effectiveAddress}</p>
              <button
                onClick={copyToClipboard}
                className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                {copied ? 'Copied!' : 'Copy Address'}
              </button>
            </div>
            <div className="w-full max-w-sm p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-sm text-yellow-200 font-medium mb-1">Important Notes:</p>
              <ul className="text-sm text-white/70 space-y-1">
                <li>• Only deposit on the Arbitrum network</li>
                <li>• Use native USDC only (not bridged or wrapped)</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {showBridgeMenu && (
        <div className="rounded bg-surface/10 p-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setShowBridgeMenu(false)} className="text-white/80 hover:text-white text-sm">← Back</button>
            <div className="text-sm text-white/80">Depositing as USDC into your channel</div>
          </div>
          <LiFiWidget 
            integrator="BrokerFi"
            config={widgetConfig}
          />
        </div>
      )}
    </div>
  );
}
