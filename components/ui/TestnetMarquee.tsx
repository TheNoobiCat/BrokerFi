"use client";

import Marquee from "react-fast-marquee";
import { useUI } from "@/store/UIContext";

export default function TestnetMarquee() {
  const { agentSidebarOpen } = useUI();

  // Don't show marquee if vibetrader (agent sidebar) is open
  if (agentSidebarOpen) return null;

  return (
    <div id="testnet-marquee" className="bg-orange-400/30 py-1 border-b border-orange-400">
      <Marquee speed={10} gradient={false} loop={0} className="text-white font-normal text-sm">
        Testnet mode &nbsp; // &nbsp; Testnet mode &nbsp;//&nbsp; Testnet mode &nbsp;//&nbsp;&nbsp; Testnet mode  &nbsp;&nbsp;//&nbsp;&nbsp; Testnet mode  &nbsp;&nbsp;//&nbsp;&nbsp; Testnet mode  &nbsp;&nbsp;//&nbsp;&nbsp; Testnet mode  &nbsp;&nbsp;//&nbsp;&nbsp; Testnet mode  &nbsp;&nbsp;//&nbsp;&nbsp; Testnet mode  &nbsp;&nbsp;//&nbsp;&nbsp; Testnet mode  &nbsp;&nbsp;//&nbsp;&nbsp; Testnet mode  &nbsp;&nbsp;//&nbsp;&nbsp; Testnet mode  &nbsp;&nbsp;//&nbsp;&nbsp; Testnet mode  &nbsp;&nbsp;//&nbsp;&nbsp; Testnet mode  &nbsp;&nbsp;//&nbsp;&nbsp; Testnet mode  &nbsp;&nbsp;//&nbsp;&nbsp; Testnet mode  &nbsp;&nbsp;//&nbsp;&nbsp; Testnet mode  &nbsp;&nbsp;//&nbsp;&nbsp; Testnet mode  &nbsp;&nbsp;//&nbsp;&nbsp; Testnet mode  &nbsp;&nbsp;//&nbsp;&nbsp; Testnet mode  &nbsp;&nbsp;//&nbsp;&nbsp; Testnet mode  &nbsp;&nbsp;//&nbsp;&nbsp; Testnet mode  &nbsp;&nbsp;//&nbsp;
      </Marquee>
    </div>
  );
}