'use client'

import { useState, useEffect } from 'react'
import Portal from './Portal'
import { FaArrowRight, FaExclamationTriangle, FaExchangeAlt } from 'react-icons/fa'
import { useUI } from '@/store/UIContext'
import { useSession } from '@/store/SessionContext'

interface AuraChannelWarningPortalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuraChannelWarningPortal({ isOpen, onClose }: AuraChannelWarningPortalProps) {
  const { setAgentSidebarOpen, openChannelSelector } = useUI()
  const { channelAddress } = useSession()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  const handleContinue = () => {
    if (!hasChannel) {
      openChannelSelector()
    } else {
      setAgentSidebarOpen(true)
    }
    onClose()
  }

  const handleChangeChannel = () => {
    openChannelSelector()
    onClose()
  }

  if (!mounted || !isOpen) return null

  const hasChannel = !!channelAddress

  return (
    <Portal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />

        <div className="relative w-full max-w-lg">
          <div className="border border-white/12 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 bg-gradient-to-br from-black to-blue-400/80 border-b border-white/12">
              <div className="flex items-center gap-3">
                <div>
                  <div className="text-xs text-white/50">Vibetrader</div>
                  <div className="text-xl font-bold text-white">Channel Connection</div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-black/80">
              {hasChannel ? (
                <div className="p-4 bg-blue-600/10 rounded-lg border border-blue-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <FaExclamationTriangle className="w-4 h-4 text-blue-400" />
                    <div className="text-sm font-medium text-white">Continue on channel ({channelAddress?.slice(0, 6)}...{channelAddress?.slice(-4)})?</div>
                  </div>
                  <div className="text-xs text-white/60 mt-1">Make sure this is the channel you would like to use. It is recommended you use a dedicated channel for agentic trading.</div>
                </div>
              ) : (
                <div className="p-4 bg-yellow-600/10 rounded-lg border border-yellow-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <FaExclamationTriangle className="w-4 h-4 text-yellow-400" />
                    <div className="text-sm font-medium text-white">Channel Required</div>
                  </div>
                  <div className="text-xs text-white/60 mt-1">You need to connect to a channel. We recommend using a dedicated channel for agentic trading.</div>
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 inline-flex items-center justify-center gap-3 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg shadow-md active:scale-[0.995] transition-transform"
                >
                  <span>Cancel</span>
                </button>
                {hasChannel ? (
                  <>
                    <button
                      onClick={handleChangeChannel}
                      className="flex-1 inline-flex items-center justify-center gap-3 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md active:scale-[0.995] transition-transform"
                    >
                      <FaExchangeAlt className="w-4 h-4" />
                      <span>Change</span>
                    </button>
                    <button
                      onClick={handleContinue}
                      className="flex-1 inline-flex items-center justify-center gap-3 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-md active:scale-[0.995] transition-transform"
                    >
                      <span>Continue</span>
                      <FaArrowRight className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleContinue}
                    className="flex-1 inline-flex items-center justify-center gap-3 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-md active:scale-[0.995] transition-transform"
                  >
                    <span>Connect Channel</span>
                    <FaArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  )
}