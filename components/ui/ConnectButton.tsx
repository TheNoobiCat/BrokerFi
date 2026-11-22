'use client'

import { useAppKit, useAppKitAccount } from '@reown/appkit/react'

interface ConnectButtonProps {
  label?: string
  showBalance?: {
    smallScreen?: boolean
    largeScreen?: boolean
  }
}

export function ConnectButton({ label = 'Connect Wallet', showBalance }: ConnectButtonProps) {
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount()

  const handleClick = () => {
    open()
  }

  if (!isConnected) {
    return (
      <button
        onClick={handleClick}
        className="px-4 py-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors text-sm border border-white"
      >
        {label}
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      className="px-4 py-2 bg-surface/80 hover:bg-surface text-white font-medium rounded-lg transition-colors text-sm border border-white"
    >
      {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Account'}
    </button>
  )
}
