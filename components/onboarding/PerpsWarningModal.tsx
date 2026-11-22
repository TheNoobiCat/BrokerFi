"use client"

import { useState, useEffect } from 'react'
import { FaTimes, FaFileContract } from 'react-icons/fa'
import Cookies from 'js-cookie'
import Portal from '../ui/Portal'

interface WarningModalProps {
  onAcknowledge: () => void
}

export default function PerpsWarningModal({ onAcknowledge }: WarningModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [rememberChoice, setRememberChoice] = useState(false)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Only show warning if NOT in testnet (production/mainnet mode)
      if (process.env.NEXT_PUBLIC_TESTNET === 'true') {
        onAcknowledge();
        return;
      }
      
      const sessionDismissed = sessionStorage.getItem('perpsWarningDismissed')
      const cookieDismissed = Cookies.get('perpsWarningDismissed')
      const shouldOpen = sessionDismissed !== 'true' && cookieDismissed !== 'true'
      console.log('[PerpsWarningModal] init:', { sessionDismissed, cookieDismissed, shouldOpen })
      if (shouldOpen) setIsOpen(true)
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [])

  const handleDismiss = () => {
    // Hide for this visit (session) so the banner won't reappear until browser/tab is closed
    console.log('[PerpsWarningModal] handleDismiss: setting sessionStorage')
    sessionStorage.setItem('perpsWarningDismissed', 'true')
    setIsOpen(false)
    onAcknowledge()
  }

  const handleContinue = () => {
    // If the user checked "Don't show this again", persist for 1 year.
    // Otherwise mark it in sessionStorage so it only stays hidden for this visit.
    console.log('[PerpsWarningModal] handleContinue:', { rememberChoice })
    if (rememberChoice) {
      Cookies.set('perpsWarningDismissed', 'true', { expires: 365 })
      console.log('[PerpsWarningModal] persisted cookie perpsWarningDismissed')
    } else {
      sessionStorage.setItem('perpsWarningDismissed', 'true')
      console.log('[PerpsWarningModal] set session perpsWarningDismissed')
    }

    setIsOpen(false)
    onAcknowledge()
  }

  if (!isOpen) return null

  return (
    <Portal>
      <div className="fixed inset-0 z-9998 bg-black/80 backdrop-blur-sm" />
      <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-surface border border-white/10 rounded-lg shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
          <div className="p-6 border-b border-white/10 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-purple-600 rounded-lg flex items-center justify-center flex-none">
                  <FaFileContract className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white font-sans">Perpetuals: Terms & Risk Notice</h2>
                  <p className="text-sm text-white/60">This notice applies specifically to perpetual ("perp") contracts offered through this interface. Please read carefully before trading perps.</p>
                </div>
              </div>
              <button onClick={handleDismiss} className="p-2 rounded-lg hover:bg-white/10 transition-colors" aria-label="Close perps notice">
                <FaTimes className="w-4 h-4 text-white/60" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm text-white/80">
            <div>
              <h3 className="font-semibold text-white mb-2">1. Agreement to Terms</h3>
              <p>By using this interface to access perpetual contracts you confirm that you have read and agree to these terms. If you do not agree, do not trade perpetuals via this interface.</p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">2. Eligibility</h3>
              <p>You confirm that you are legally permitted to access and trade perpetuals in your jurisdiction, are at least 18 years old, and understand the financial and regulatory implications. You are responsible for complying with local laws.</p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">3. Nature of Perpetual Contracts</h3>
              <p>Perpetuals are synthetic derivative contracts that provide exposure to an asset's price without delivering the underlying asset. Perpetual contracts use funding mechanisms, margin, and leverage to maintain pricing; these features create distinct risks and behaviours compared to spot markets.</p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">4. BrokerFi Naming & What We Are NOT</h3>
              <p className="mb-2">The name "BrokerFi" represents a conceptual paradox: it combines "broker" (a regulated intermediary) with "Fi" (decentralized finance) to illustrate precisely what this platform is <strong>NOT</strong>.</p>
              <p className="mb-2"><strong>Key Distinctions:</strong></p>
              <ul className="list-disc list-inside space-y-1 mb-3 text-white/70">
                <li>"Broker" in our name = metaphorical reference to trading functionality</li>
                <li>"Fi" in our name = the actual reality of decentralized, non-custodial trading</li>
                <li>The tension between these words = intentional, highlighting our difference from traditional finance</li>
              </ul>
              <p className="mb-2"><strong>Synthetic Instruments & Asset References:</strong></p>
              <p>Perpetual contracts offered through this interface are synthetic instruments settled in USDC (or other specified stablecoins) under the protocol's settlement rules. Trading here does not transfer ownership of any underlying asset and does not provide custody of real-world securities or commodities.</p>
              <p>Any logos, ticker symbols, or references to stocks (e.g., AAPL, TSLA), commodities, forex pairs, or other assets displayed on this platform are used solely for synthetic price tracking and are not affiliated with, endorsed by, or representative of the actual companies, securities, or assets. These are <strong>not securities</strong>—they are decentralized synthetic price trackers that settle in stablecoins.</p>
              <p>You acknowledge that positions are derivative exposures governed by smart contracts and token-based settlement, and that protections associated with traditional exchange custody, settlement, or broker-dealer relationships do not apply.</p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">5. Protocol Mechanics & Counterparty</h3>
              <p>Trades executed on this interface are settlement requests to smart contracts where <strong>liquidity pools act as your counterparty</strong>. Each market has its own dedicated liquidity pool to segregate risk across different assets. When you open a perpetual position, you are trading against the pool for that specific market.</p>
              <p>Liquidity providers deposit collateral into these pools and earn fees from trading activity, while taking on the risk of traders' profits. The protocol enforces margin requirements, funding payments, and automated liquidations according to its code. Your profit or loss directly affects the pool's balance, and vice versa.</p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">6. Price Oracles & Settlement</h3>
              <p>All pricing, funding rate calculations, and liquidations rely on decentralized oracle networks. We do not operate, control, or influence these oracle price feeds. You accept risks associated with oracle inaccuracies, latency, manipulation, or discontinuation.</p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">7. Protocol Autonomy & Immutability</h3>
              <p>The perpetual contracts operate via immutable smart contracts. Once deployed:</p>
              <ul className="list-disc list-inside space-y-1 text-white/70">
                <li>No party can reverse transactions</li>
                <li>No party can modify contract terms</li>
                <li>No party can halt trading</li>
                <li>All operations are automated and irreversible</li>
              </ul>
              <p>This interface is merely a portal to these autonomous contracts.</p>
            </div>

            <div className="bg-purple-600/10 border border-purple-600/20 rounded-lg p-4">
              <h3 className="font-semibold text-purple-300 mb-2">8. Risk Acknowledgment</h3>
              <p className="mb-2">Trading perpetuals is highly speculative and may result in rapid and total loss of funds. By trading you acknowledge the following risks (without limitation):</p>
              <div className="text-xs text-purple-200 space-y-1">
                <p>• Use of leverage and funding rates can amplify losses and lead to liquidations.</p>
                <p>• Positions may be partially or fully liquidated automatically under the protocol rules.</p>
                <p>• Smart contracts may contain bugs, security vulnerabilities, or economic exploits.</p>
                <p>• Protocol or market liquidity may be insufficient to execute or close positions at expected prices.</p>
                <p>• Synthetic instruments can diverge from the behaviour of the underlying spot asset.</p>
                <p>• Regulatory classifications of perpetuals vary and may affect your rights and obligations.</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">9. Liquidation, Margin, and Funding</h3>
              <p>Perpetual positions are subject to margin requirements and funding payments. Failure to meet margin requirements can result in immediate liquidation. Funding rates and margin calculations are determined by on‑chain or off‑chain protocol mechanisms and are outside the control of this interface.</p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">10. No Financial Advice</h3>
              <p>Nothing in this notice constitutes investment, tax, or legal advice. You are solely responsible for your trading decisions and should consult a qualified adviser where appropriate.</p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">11. No Warranties & Limitation of Liability</h3>
              <p>The interface and protocol are provided on an "as is" basis. To the maximum extent permitted by law, operators disclaim all warranties, and are not liable for any losses arising from use of the interface or protocol, including but not limited to execution, smart contract failure, or market events.</p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">12. Indemnification</h3>
              <p>You agree to indemnify and hold harmless the operators and contributors from claims, damages, losses, or liabilities arising from your use of the perpetuals interface or your violation of these terms.</p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">13. Geographic Restrictions & Access Limitations</h3>
              <p>This interface implements technical restrictions to prevent access from prohibited jurisdictions including but not limited to: United States, United Kingdom, European Union member states, Canada, Australia, Singapore, Japan, and South Korea.</p>
              <p>Any attempt to circumvent these restrictions, including through VPNs, proxies, or falsified credentials, violates these Terms and may result in immediate position liquidation and permanent account termination. You affirm that you are not located in, under the control of, or a resident of any prohibited jurisdiction.</p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">14. Governing Law</h3>
              <p>These terms are subject to applicable law. Where permitted, disputes may be resolved in courts with appropriate jurisdiction. This notice does not waive any mandatory consumer protections applicable in your jurisdiction.</p>
            </div>
          </div>

          <div className="p-6 border-t border-white/10 shrink-0">
            <div className="space-y-3">
              <button onClick={handleContinue} className="w-full p-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors">I Understand and Agree</button>
              <label className="flex items-center gap-2 cursor-pointer justify-center">
                <input type="checkbox" checked={rememberChoice} onChange={(e) => setRememberChoice(Boolean(e.target.checked))} className="w-4 h-4 text-purple-600 bg-transparent border-2 border-white/40 rounded" />
                <span className="text-xs text-white/70">Don&apos;t show this again</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  )
}
