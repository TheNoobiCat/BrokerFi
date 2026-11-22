import { cookieStorage, createStorage } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, arbitrum, optimism, polygon, base, bsc, arbitrumSepolia } from '@reown/appkit/networks'

// Get projectId from Reown Dashboard
export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || '7a747129e990ce6eab6f8554d45f5cc0'

if (!projectId) {
  throw new Error('Project ID is not defined')
}

// Use a curated set of major chains (include Arbitrum Sepolia for test/dev)
export const networks = [mainnet, arbitrum, optimism, polygon, base, bsc, arbitrumSepolia]

// Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId,
  networks
})

export const config = wagmiAdapter.wagmiConfig
