"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Portal from "./Portal";
import { ConnectButton } from "./ConnectButton";
import { useSession } from "@/store/SessionContext";
import { useUI } from "@/store/UIContext";
import { useAccount } from "wagmi";
import { usePathname, useRouter } from "next/navigation";
import publicClient from "@/blockchain/publicClient";
import { getChannelList } from "@/services/channel";
import Logo from "../icons/Logo";

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const { channelAddress } = useSession();
  const { openBridge, setBridgeChannel, openDepositOptions } = useUI();
  const { address } = useAccount();

  const [channelBalances, setChannelBalances] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      if (!address) {
        if (!mounted) return;
        setChannelBalances({});
        return;
      }
      try {
        const chRes = await getChannelList(address, publicClient);
        const channels = chRes.channels ?? [];
        const usdcAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS || "0x4b1fACeF3553C0c7A67D6AB240394E9aad566c2d";
        const balances: Record<string, number> = {};
        await Promise.all(
          channels.map(async (ch: string) => {
            try {
              const bal = await publicClient.readContract({
                address: usdcAddress as `0x${string}`,
                abi: [
                  {
                    inputs: [{ name: "account", type: "address" }],
                    name: "balanceOf",
                    outputs: [{ name: "", type: "uint256" }],
                    stateMutability: "view",
                    type: "function",
                  },
                ],
                functionName: "balanceOf",
                args: [ch as `0x${string}`],
              });
              if (!mounted) return;
              balances[ch] = Number(bal) / 1e6;
            } catch {
              balances[ch] = 0;
            }
          }),
        );
        if (!mounted) return;
        setChannelBalances(balances);
      } catch (e) {}
    };

    fetchAll();
    const t = setInterval(fetchAll, 30_000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, [address]);

  return (
    <>
      <button
        className="md:hidden p-2 rounded-lg bg-glass-dark border border-white hover:bg-white/5 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open menu"
      >
        <svg
          className="w-5 h-5 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {isOpen && (
        <Portal>
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute top-0 left-0 right-0 bg-glass-darker backdrop-blur-16 border-b border-white/10 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Logo/>
                  <h1 className="text-lg font-bold text-white">BrokerFi</h1>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg bg-glass-dark border border-white/10"
                >
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Perps / Options Navigation (mobile) */}
              <MobileNavSwitcher />

              {/* Primary action: Connect / Sign In (walletconnect) */}
              <div className="mb-4">
                <ConnectButton label="Sign In" />
              </div>

              {/* Deposit Button for current active channel */}
              {channelAddress && (
                <div className="mb-4">
                  <button
                    onClick={() => {
                      openDepositOptions(channelAddress);
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                  >
                    <span>Deposit</span>
                  </button>
                </div>
              )}

              {/* Channel and wallet details (mobile-optimized) */}
              <div className="text-sm text-white/70 mb-2">Account</div>
              <div className="mb-3 p-3 bg-[rgba(255,255,255,0.02)] rounded border border-[rgba(255,255,255,0.03)]">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-white/60">Total Balance</div>
                  <div className="text-sm font-mono text-white">
                    {(() => {
                      const totalUsdc = Object.values(channelBalances).reduce(
                        (a, b) => a + b,
                        0,
                      );
                      return new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(totalUsdc);
                    })()}
                  </div>
                </div>
              </div>

              <div className="text-xs text-white/60 mb-2">Channels</div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {Object.keys(channelBalances).length === 0 && (
                  <div className="text-sm text-white/60 py-2 text-center">
                    No channels created
                  </div>
                )}
                {Object.entries(channelBalances).map(([ch, bal]) => (
                  <div
                    key={ch}
                    className={`flex items-center justify-between gap-3 px-3 py-2 rounded ${
                      ch === channelAddress
                        ? "bg-white/5"
                        : "bg-transparent hover:bg-white/3"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-mono text-white">{`${ch.slice(
                        0,
                        6
                      )}...${ch.slice(-4)}`}</div>
                      <div className="text-xs text-white/60">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(bal)}
                      </div>
                      {ch === channelAddress && (
                        <div className="text-[10px] bg-transparent border border-amber-500 text-amber-400 px-2 py-0.5 rounded font-semibold">
                          ACTIVE
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}

function MobileNavSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const isOptionsMode = pathname?.startsWith("/options");
  const isClethMode = pathname?.startsWith("/cleth");
  const isLpMode = pathname?.startsWith("/perpetual/lp");
  const isHomeMode = pathname === "/home";
  const isLeaderboardMode = pathname?.startsWith("/leaderboard");
  const isPerpetualMode = !isOptionsMode && !isClethMode && !isLpMode && !isHomeMode && !isLeaderboardMode;
  const isTestnet = process.env.NEXT_PUBLIC_TESTNET === 'true';

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <button
        onClick={() => {
          router.push("/home");
        }}
        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-full font-medium cursor-pointer transition-all ${
          isHomeMode
            ? "border"
            : "bg-glass-dark text-white/80 border border-white/10 hover:border-white/30"
        }`}
      >
        <svg
          className="w-4 h-4"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
        Home
      </button>
      <button
        onClick={() => {
          router.push("/");
        }}
        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-full font-medium cursor-pointer transition-all ${
          isPerpetualMode
            ? "border"
            : "bg-glass-dark text-white/80 border border-white/10 hover:border-white/30"
        }`}
      >
        Perpetuals
      </button>
      <button
        onClick={() => {
          router.push("/options/AAPL");
        }}
        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-full font-medium cursor-pointer transition-all ${
          isOptionsMode
            ? "border"
            : "bg-glass-dark text-white/80 border border-white/10 hover:border-white/30"
        }`}
      >
        Options
      </button>
      {!isTestnet && (
        <button
          onClick={() => {
            router.push("/cleth");
          }}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-full font-medium cursor-pointer transition-all ${
            isClethMode
              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-400/30"
              : "bg-glass-dark text-white/80 border border-white/10 hover:border-white/30"
          }`}
        >
          CLETH
        </button>
      )}
      <Link
        href="/perpetual/lp"
        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-full font-medium cursor-pointer transition-all ${
          pathname?.startsWith("/perpetual/lp")
            ? "bg-amber-500/20 text-amber-400 border border-amber-400/30"
            : "bg-glass-dark text-white/80 border border-white/10 hover:border-white/30"
        }`}
      >
        Earn
      </Link>
    </div>
  );
}
