'use client'

import { FaExclamationTriangle, FaGlobe } from 'react-icons/fa'
import blockedCountries from '@/services/blockedCountries'

export default function RegionBlocker() {
  return (
    <div className="min-h-screen bg-broker-dark flex flex-col items-center justify-center p-4">
      {/* BrokerFi Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-8 h-8 bg-linear-to-r from-broker-green to-yellow-400 rounded-lg flex items-center justify-center">
          <span className="text-black font-bold text-sm font-sans">B</span>
        </div>
        <h1 className="text-2xl font-bold text-white font-sans">BrokerFi</h1>
      </div>

      {/* Main blocking modal */}
      <div className="w-full max-w-md bg-surface border border-red-500/30 rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-red-500/20 bg-red-500/5">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
              <FaExclamationTriangle className="w-7 h-7 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white text-center font-sans">
            Service Unavailable
          </h2>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-lg text-white/90 mb-4 leading-relaxed font-sans">
              Service unavailable in your region
            </p>
            <p className="text-sm text-white/70 leading-relaxed">
              BrokerFi is not available in your country due to regulatory restrictions. Currently the service is blocked in the following jurisdictions:
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-3 mb-3" role="list" aria-label="Blocked jurisdictions">
              {blockedCountries.map((c) => (
                <span
                  key={c.code}
                  role="listitem"
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-600/10 border border-red-500/20 text-sm text-white rounded-full font-semibold"
                  aria-label={c.name}
                >
                  <span aria-hidden>{c.emoji}</span>
                  <span>{c.name}</span>
                </span>
              ))}
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              We apologize for any inconvenience this may cause. If you believe you&apos;re seeing this message in error, please contact our support team for assistance.
            </p>
          </div>

          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <FaGlobe className="w-4 h-4 text-red-400" />
              <span className="text-sm font-semibold text-red-400">Regional Restriction</span>
            </div>
            <p className="text-xs text-white/70">
              BrokerFi provides an interface for the interaction with smart contracts on blockchain networks. Access to this interface is restricted in certain jurisdictions to comply with applicable laws and regulatory requirements.
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-surface/30 border border-white/10 rounded-lg">
              <p className="text-xs text-white/60 text-center">
                If you believe this is an error, please contact our support team.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-surface/20 border-t border-white/10">
          <p className="text-xs text-white/50 text-center">
            © 2024 BrokerFi • All rights reserved
          </p>
        </div>
      </div>
    </div>
  )
}