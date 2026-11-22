'use client'

import { useState, useEffect } from 'react'
import { FaArrowRight, FaInfoCircle } from 'react-icons/fa'
import { useAccount } from 'wagmi'
import Cookies from 'js-cookie'
import { getChannelList } from '@/services/channel'
import publicClient from '@/blockchain/publicClient'
import { useSession } from '@/store/SessionContext'

interface OnboardingBannerProps {
  onStartOnboarding: () => void
}

export default function OnboardingBanner({ onStartOnboarding }: OnboardingBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)
  // Keep an internal zero-based step index to avoid conflating "completed" with
  // the 1-based display value. This ensures that being on the final step (index
  // 1 for a 2-step flow) still shows "Step 2 of 2 - Continue your setup" when
  // the user hasn't finished it.
  const [stepIndex, setStepIndex] = useState(0)
  const [totalSteps] = useState(2) // Bridge + InstantExecution Setup
  const { isConnected, address } = useAccount()
  const { isConnected: sessionConnected, channelAddress } = useSession()
  const [hasDeployedChannel, setHasDeployedChannel] = useState<boolean | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      if (!address) return
      try {
        const res = await getChannelList(address, publicClient)
        if (!mounted) return
        setHasDeployedChannel(!!(res.success && res.channels && res.channels.length > 0))
      } catch {
        // ignore errors - leave hasDeployedChannel as null
      }
    }
    load()
    return () => { mounted = false }
  }, [address])

  useEffect(() => {
    // Use setTimeout to avoid cascading renders
    const timeoutId = setTimeout(() => {
      // Don't show banner if wallet not connected
      if (!isConnected) {
        setIsDismissed(true)
        return
      }

      // If session is connected, dismiss the banner
      if (sessionConnected && channelAddress) {
        setIsDismissed(true)
        return
      }

      // Check if banner was dismissed (legacy behavior)
      const dismissed = Cookies.get('onboardingBannerDismissed')
      if (dismissed === 'true') {
        setIsDismissed(true)
        return
      }

      // Check if onboarding is completed
      const onboardingCompleted = Cookies.get('onboardingCompleted')
      if (onboardingCompleted === 'true') {
        setIsDismissed(true)
        return
      }

      // If we reach here, wallet is connected, banner not dismissed, and onboarding not completed
      // So we should show the banner
      setIsDismissed(false)

      // Check current onboarding step (stored as zero-based index)
      const savedStep = Cookies.get('onboardingStep')
      if (savedStep) {
        const idx = parseInt(savedStep, 10)
        // ensure it's a valid index
        setStepIndex(Number.isFinite(idx) ? Math.max(0, Math.min(idx, totalSteps - 1)) : 0)
      } else {
        setStepIndex(0) // No step started yet
      }
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [isConnected, totalSteps, sessionConnected, channelAddress])

  const handleStartOnboarding = () => {
    onStartOnboarding()
  }

  // Show wallet connection prompt if not connected
  if (!isConnected) {
    return (
      <div className="bg-yellow-400/30 border-b border-yellow-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-3">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-yellow-400/40 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
              </div>
              <p className="text-sm md:text-base font-bold text-white font-sans">
                Connect your wallet to start trading on BrokerFi
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isDismissed) {
    return null
  }
  const bannerClass = hasDeployedChannel ? 'bg-sky-600/30 border-b border-sky-600' : 'bg-broker-green/30 border-b border-broker-green'

  return (
    <div className={bannerClass}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-4">
            {/* Progress indicator or connection-needed icon */}
            <div className="flex items-center gap-2">
              {hasDeployedChannel ? (
                <FaInfoCircle className="w-5 h-5 text-sky-400" />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalSteps }, (_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-full ${
                          i < stepIndex
                            ? 'bg-broker-green'
                            : i === stepIndex
                            ? 'bg-yellow-400'
                            : 'bg-white/40'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs md:text-sm text-white/90 font-bold font-mono">
                    {stepIndex + 1}/{totalSteps}
                  </span>
                </div>
              )}

              {/* Message */}
            </div>

            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm md:text-base font-bold text-white font-sans">
                  {hasDeployedChannel
                    ? 'Establish a connection to enable trading'
                    : stepIndex === 0
                    ? 'You need to complete a few steps to start using BrokerFi'
                    : stepIndex < totalSteps
                    ? `Step ${stepIndex + 1} of ${totalSteps} - Continue your setup`
                    : 'Setup complete! You\'re ready to trade'
                  }
                </p>
                <p className="text-xs md:text-sm text-white/80 font-medium">
                  {hasDeployedChannel
                    ? 'Connect to an InstantExecution channel to proceed. This enables instantaneous trading for this session.'
                    : stepIndex === 0
                    ? 'Set up an instant trading channel & deposit funds'
                    : stepIndex === 1
                    ? 'Set up your InstantExecution channel'
                    : "All steps completed successfully"
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            {stepIndex < totalSteps && (
              <button
                onClick={handleStartOnboarding}
                className={`${hasDeployedChannel ? 'flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white' : 'flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black'} font-bold text-base rounded-lg transition-colors font-sans shadow-lg`}
              >
                <span className="whitespace-nowrap">{hasDeployedChannel ? 'Connect Now' : stepIndex === 0 ? 'Get Started' : 'Continue Setup'}</span>
                <FaArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}