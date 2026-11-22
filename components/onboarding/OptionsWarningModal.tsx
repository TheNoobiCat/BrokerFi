"use client";

import { useState, useEffect } from "react";
import { FaTimes, FaFileContract } from "react-icons/fa";
import Cookies from "js-cookie";
import Portal from "../ui/Portal";

interface WarningModalProps {
  onAcknowledge: () => void;
}

export default function OptionsWarningModal({
  onAcknowledge,
}: WarningModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rememberChoice, setRememberChoice] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Only show warning if NOT in testnet (production/mainnet mode)
      if (process.env.NEXT_PUBLIC_TESTNET === 'true') {
        onAcknowledge();
        return;
      }
      
      const sessionDismissed = sessionStorage.getItem(
        "optionsWarningDismissed",
      );
      const cookieDismissed = Cookies.get("optionsWarningDismissed");
      if (sessionDismissed !== "true" && cookieDismissed !== "true")
        setIsOpen(true);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, []);

  const handleDismiss = () => {
    // Hide for this visit (session) so the banner won't reappear until browser/tab is closed
    sessionStorage.setItem("optionsWarningDismissed", "true");
    setIsOpen(false);
    onAcknowledge();
  };

  const handleContinue = () => {
    // If the user checked "Don't show this again", persist for 1 year.
    // Otherwise mark it in sessionStorage so it only stays hidden for this visit.
    if (rememberChoice) {
      Cookies.set("optionsWarningDismissed", "true", { expires: 365 });
    } else {
      sessionStorage.setItem("optionsWarningDismissed", "true");
    }

    setIsOpen(false);
    onAcknowledge();
  };

  if (!isOpen) return null;

  return (
 <Portal>
  <div className="fixed inset-0 z-9998 bg-black/80 backdrop-blur-sm" />
  <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
    <div className="w-full max-w-2xl bg-surface border border-white/10 rounded-lg shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
      <div className="p-6 border-b border-white/10 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center flex-none">
              <FaFileContract className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-sans">Options: Terms & Risk Notice</h2>
              <p className="text-sm text-white/60">This notice applies specifically to options contracts available on this interface. Please review before trading options.</p>
            </div>
          </div>
          <button onClick={handleDismiss} className="p-2 rounded-lg hover:bg-white/10 transition-colors" aria-label="Close options notice">
            <FaTimes className="w-4 h-4 text-white/60" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm text-white/80">
        <div>
          <h3 className="font-semibold text-white mb-2">1. Agreement to Terms</h3>
          <p>By trading options using this interface you acknowledge and agree to these terms. If you do not agree, do not trade options here.</p>
        </div>

        <div>
          <h3 className="font-semibold text-white mb-2">2. Eligibility</h3>
          <p>You confirm you are permitted to trade options in your jurisdiction, are of legal age, and will comply with applicable laws and regulations.</p>
        </div>

        <div>
          <h3 className="font-semibold text-white mb-2">3. Nature of Options</h3>
          <p>Options are derivative contracts that confer the right (but not the obligation) to buy or sell an underlying asset at specified terms. Options may be American, European, or follow protocol-specific exercise and settlement rules. Settlement occurs according to each market&apos;s specific terms.</p>
        </div>

        <div>
          <h3 className="font-semibold text-white mb-2">4. BrokerFi Naming & What We Are NOT</h3>
          <p className="mb-2">The name &quot;BrokerFi&quot; represents a conceptual paradox: it combines &quot;broker&quot; (a regulated intermediary) with &quot;Fi&quot; (decentralized finance) to illustrate precisely what this platform is <strong>NOT</strong>.</p>
          <p className="mb-2"><strong>Key Distinctions:</strong></p>
          <ul className="list-disc list-inside space-y-1 mb-3 text-white/70">
            <li>&quot;Broker&quot; in our name = metaphorical reference to trading functionality</li>
            <li>&quot;Fi&quot; in our name = the actual reality of decentralized, non-custodial trading</li>
            <li>The tension between these words = intentional, highlighting our difference from traditional finance</li>
          </ul>
          <p className="mb-2"><strong>Synthetic Options:</strong></p>
          <p>Options contracts on this platform settle according to each market&apos;s specific settlement terms. Trading here does not convey ownership of any underlying assets; settlement occurs according to the protocol&apos;s rules.</p>
          <p>Any logos or ticker symbols displayed are for reference only and do not imply affiliation with or endorsement by any entity.</p>
          <p>You acknowledge that your exposures are derivative positions governed by smart contract logic and protocol-based settlement, and that traditional exchange custody protections and broker-dealer relationships do not apply.</p>
        </div>

        <div>
          <h3 className="font-semibold text-white mb-2">5. Community-Created Markets</h3>
          <p>This protocol enables permissionless market creation through external price feeds (e.g., Pyth, Chainlink).</p>
          <p className="mb-2"><strong>Important Distinctions:</strong></p>
          <ul className="list-disc list-inside space-y-1 mb-3 text-white/70">
            <li><strong>Protocol-Curated Markets:</strong> Markets that follow our compliance framework</li>
            <li><strong>Community-Created Markets:</strong> Markets created by third parties using external price feeds - use at your own risk</li>
            <li><strong>Experimental Markets:</strong> High-risk markets for novel assets - extreme caution advised</li>
          </ul>
          <p>We do not vet, endorse, or assume responsibility for community-created markets. Market creators are solely responsible for their chosen price feeds and compliance with applicable laws.</p>
        </div>

        <div>
          <h3 className="font-semibold text-white mb-2">6. Protocol Mechanics & Counterparty</h3>
          <p>Execution and settlement occur via smart contracts and protocol liquidity mechanisms. Trades are executed against pools or counterparties implemented by protocol code. The protocol enforces assignment, exercise, and margin logic where applicable.</p>
        </div>

        <div>
          <h3 className="font-semibold text-white mb-2">7. Price Oracles & Settlement</h3>
          <p>All pricing, funding rate calculations, and liquidations rely on decentralized oracle networks. We do not operate, control, or influence these oracle price feeds. You accept risks associated with oracle inaccuracies, latency, manipulation, or discontinuation.</p>
        </div>

        <div>
          <h3 className="font-semibold text-white mb-2">8. Protocol Governance & Updates</h3>
          <p>The protocol may incorporate governance mechanisms that allow for certain parameter updates. While core smart contracts are immutable, governance tokens or multi-sig controls may enable adjustments to fees, market parameters, or other operational aspects.</p>
        </div>

        <div className="bg-emerald-600/10 border border-emerald-600/20 rounded-lg p-4">
          <h3 className="font-semibold text-emerald-300 mb-2">9. Risk Acknowledgment</h3>
          <p className="mb-2">Options trading involves specific risks. By trading options you acknowledge (without limitation):</p>
          <div className="text-xs text-emerald-200 space-y-1">
            <p>• Options can expire worthless, resulting in loss of the premium paid.</p>
            <p>• Assignment and margin obligations may arise; exercising options or being assigned shorts can create binding obligations.</p>
            <p>• Options payoffs can be complex, and leverage can amplify losses.</p>
            <p>• Smart contracts and protocol code may contain bugs or vulnerabilities.</p>
            <p>• Liquidity constraints can affect fills, pricing, and settlement.</p>
            <p>• Regulatory treatment of options varies across jurisdictions.</p>
            <p>• Community-created markets carry additional risks including unreliable price feeds and uncertain regulatory status.</p>
            <p>• Price feed providers are third parties; we do not guarantee their accuracy or continuity.</p>
            <p>• Some markets may be illegal in your jurisdiction; you are solely responsible for compliance.</p>
            <p>• Protocol governance may change parameters that affect your positions.</p>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-white mb-2">10. Exercise, Assignment, and Expiration</h3>
          <p>Options are subject to exercise and assignment rules. You are responsible for understanding exercise windows, settlement mechanics, and any margin or collateral implications that may arise upon assignment or exercise.</p>
        </div>

        <div>
          <h3 className="font-semibold text-white mb-2">11. No Financial Advice</h3>
          <p>Nothing in this notice is financial, tax, or legal advice. Consult a professional advisor for guidance appropriate to your circumstances.</p>
        </div>

        <div>
          <h3 className="font-semibold text-white mb-2">12. No Warranties & Limitation of Liability</h3>
          <p>The interface and protocol are provided &quot;as is&quot;. To the fullest extent permitted by law, operators disclaim all warranties and are not liable for any damages or losses arising from trading, settlement, or use of the protocol.</p>
        </div>

        <div>
          <h3 className="font-semibold text-white mb-2">13. Indemnification</h3>
          <p>You agree to indemnify the operators and contributors from claims, damages, losses, or liabilities arising out of your use of the options interface or breach of these terms.</p>
        </div>

        <div>
          <h3 className="font-semibold text-white mb-2">14. Geographic Restrictions & Access Limitations</h3>
          <p>This interface implements technical restrictions to prevent access from prohibited jurisdictions including but not limited to: United States, United Kingdom, European Union member states, Canada, Australia, Singapore, Japan, and South Korea.</p>
          <p>Any attempt to circumvent these restrictions, including through VPNs, proxies, or falsified credentials, violates these Terms and may result in immediate position liquidation and permanent account termination. You affirm that you are not located in, under the control of, or a resident of any prohibited jurisdiction.</p>
        </div>

        <div>
          <h3 className="font-semibold text-white mb-2">15. Governing Law</h3>
          <p>These terms are subject to applicable law. Where permitted, disputes may be resolved in courts with appropriate jurisdiction. This notice does not waive any mandatory consumer protections applicable in your jurisdiction.</p>
        </div>
      </div>

      <div className="p-6 border-t border-white/10 shrink-0">
        <div className="space-y-3">
          <button onClick={handleContinue} className="w-full p-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors">I Understand and Agree</button>
          <label className="flex items-center gap-2 cursor-pointer justify-center">
            <input type="checkbox" checked={rememberChoice} onChange={(e) => setRememberChoice(Boolean(e.target.checked))} className="w-4 h-4 text-emerald-600 bg-transparent border-2 border-white/40 rounded" />
            <span className="text-xs text-white/70">Don&apos;t show this again</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</Portal>
  );
}
