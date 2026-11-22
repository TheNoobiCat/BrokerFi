import { createPublicClient, http } from 'viem'
import { arbitrumSepolia } from 'viem/chains'
import type { Chain } from 'viem'

export function makePublicClient({
  chain = arbitrumSepolia,
  rpcUrl,
}: {
  chain?: Chain
  rpcUrl?: string
} = {}) {
  // Use the direct RPC URL
  const url = rpcUrl || process.env.NEXT_PUBLIC_RPC_URL
  if (!url) throw new Error(`No RPC URL available for chain ${chain.id}. Set NEXT_PUBLIC_RPC_URL or pass rpcUrl.`)

  return createPublicClient({
    chain,
    transport: http(url),
  })
}

export const publicClient = makePublicClient()

export default publicClient
