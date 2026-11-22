"use client";

import { wagmiAdapter, projectId } from '@/config'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { mainnet, arbitrum, optimism, polygon, base, bsc, arbitrumSepolia } from '@reown/appkit/networks'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'
import { SessionProvider } from "@/store/SessionContext";
import { UIProvider } from "@/store/UIContext";
import { TradingProvider } from "@/store/TradingContext";
import { useEffect } from "react";
import { initKeyVault } from "@/services/keyVault";

// Set up queryClient
const queryClient = new QueryClient()

if (!projectId) {
  throw new Error('Project ID is not defined')
}

// Set up metadata
const metadata = {
  name: 'BrokerFi (Archived Testnet)',
  description: 'Archived, unaudited Arbitrum Sepolia testnet reference for perpetual futures and options. Not production-ready.',
  url: 'https://testnet.brokerfi.trade',
  icons: ['/BrokerfiLogo.jpg']
}

// Create the modal
const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [arbitrumSepolia],
  defaultNetwork: arbitrumSepolia,
  metadata: metadata,
  defaultAccountTypes:{eip155: 'eoa'},
  features: {
    analytics: true // Optional - defaults to your Cloud configuration
  }
})

export { config } from '@/config';

export function Providers({ children, cookies }: { children: React.ReactNode; cookies?: string | null }) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

  // Initialize key vault for secure key storage
  useEffect(() => {
    initKeyVault().catch(err => {
      console.error('[Providers] Key vault initialization failed:', err);
    });
  }, []);

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <UIProvider>
            <TradingProvider>
              {children}
            </TradingProvider>
          </UIProvider>
        </SessionProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}