"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useTradingContext } from "@/store/TradingContext";
import MobileNav from "../ui/MobileNav";
import MobileAssetSelector from "../ui/MobileAssetSelector";
import Portal from "../ui/Portal";
import { ConnectButton } from "@/components/ui/ConnectButton";
import AuraChannelWarningPortal from "../ui/AuraChannelWarningPortal";
import { useSession } from "@/store/SessionContext";
import publicClient from "@/blockchain/publicClient";
import { useUI } from "@/store/UIContext";
import { useAccount } from "wagmi";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { getChannelList } from "@/services/channel";
import { getAssetBySymbol } from "@/services/assets";
import Logo from "../icons/Logo";

export default function Header() {
  const pathname = usePathname();
  const { totalPnL, selectedInstrument, selectedAsset } = useTradingContext();

  const [showAssetDropdown, setShowAssetDropdown] = useState(false);
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
  const assetBtnRef = useRef<HTMLAnchorElement | null>(null);
  const optionsBtnRef = useRef<HTMLAnchorElement | null>(null);
  const [moreMenuPos, setMoreMenuPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const [optionsMenuPos, setOptionsMenuPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const [assetMenuPos, setAssetMenuPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const { channelAddress } = useSession();
  const {
    openBridge,
    setBridgeChannel,
    setAgentSidebarOpen,
    agentSidebarOpen,
    openDepositOptions,
    openAuraChannelWarning,
    closeAuraChannelWarning,
    auraChannelWarningOpen,
    openChannelSelector,
  } = useUI();
  const { address } = useAccount();
  const { open: openWallet } = useAppKit();
  const { isConnected } = useAppKitAccount();

  const [channelBalances, setChannelBalances] = useState<
    Record<string, number>
  >({});
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [showConnectTooltip, setShowConnectTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const accountRef = useRef<HTMLDivElement | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const totalBalance = useMemo(() => {
    return Object.values(channelBalances).reduce((a, b) => a + b, 0);
  }, [channelBalances]);

  // Determine current mode
  const isOptionsMode = pathname?.startsWith("/options");
  const isClethMode = pathname?.startsWith("/cleth");
  const isLpMode = pathname?.startsWith("/perpetual/lp");
  const isHomeMode = pathname === "/home";
  const isLeaderboardMode = pathname?.startsWith("/leaderboard");
  const isPerpetualMode = !isOptionsMode && !isClethMode && !isLpMode && !isHomeMode && !isLeaderboardMode;
  const router = useRouter();
  const isTestnet = process.env.NEXT_PUBLIC_TESTNET === 'true';

  // Fallback asset lists for dropdowns
  const perpetualAssets = ["BTC", "ETH", "SOL", "ARB", "FTM"];
  const optionsAssets = ["AAPL", "TSLA", "AMZN", "GOOG", "MSFT"];

  // compute menu position to render in Portal (escapes overflow and stacking contexts)
  const computeMenuPos = (el: HTMLElement | null) => {
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX,
      width: rect.width,
    };
  };

  // Fetch channels + USDC balances
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
        setChannelBalances({ ...balances });
        setRefreshCounter(prev => prev + 1);
      } catch {
        // ignore
      }
    };

    // Initial fetch and periodic refresh
    fetchAll();
    const t = setInterval(fetchAll, 30_000);

    // Allow other parts of the app to request an immediate refresh
    const refreshHandler = () => {
      fetchAll();
    };
    window.addEventListener('brokerfi:channels:refresh', refreshHandler);

    return () => {
      mounted = false;
      clearInterval(t);
      window.removeEventListener('brokerfi:channels:refresh', refreshHandler);
    };
  }, [address]);

  // Recompute menu positions while open so menus stay aligned on scroll/resize
  useEffect(() => {
    if (!showAssetDropdown) return;
    const handler = () => setAssetMenuPos(computeMenuPos(assetBtnRef.current));
    window.addEventListener("scroll", handler);
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("scroll", handler);
      window.removeEventListener("resize", handler);
    };
  }, [showAssetDropdown]);

  useEffect(() => {
    if (!showOptionsDropdown) return;
    const handler = () =>
      setOptionsMenuPos(computeMenuPos(optionsBtnRef.current));
    window.addEventListener("scroll", handler);
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("scroll", handler);
      window.removeEventListener("resize", handler);
    };
  }, [showOptionsDropdown]);


  const shortenAddress = (addr?: string | null) => {
    if (!addr) return "";
    try {
      return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    } catch {
      return addr;
    }
  };

  return (
    <header className="broker-nav h-16 px-4 flex items-center justify-between border-b border-white/6">
      {/* Left Side - Logo + Navigation */}
      <div className="flex items-center gap-6">
        {/* Logo */}
        <Link href="/btc" className="flex items-center cursor-pointer gap-2.5">
          {/* <div className="w-7 h-7 rounded-lg flex items-center justify-center">
            <div className="w-7 h-7 bg-linear-to-r from-transparent to-yellow-400 rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-sm font-sans">B</span>
            </div>
          </div> */}

            <Logo scale={0.95}/>
          <div className="hidden sm:flex items-center gap-2">
            <h1 className="text-xl font-bold text-white font-sans">BrokerFi</h1>
          </div>
        </Link>

        {/* Desktop Navigation - Home & Perpetuals & Options & CLETH */}
        <div className="hidden md:flex items-center gap-2">
          <div className="flex gap-2 items-center">
            {/* Home Button */}
            <div>
              <Link
                href={"/home"}
                className={`flex items-center h-10 gap-2 px-4 rounded-xl py-2 rounded-broker font-medium cursor-pointer transition-all ${
                  isHomeMode
                    ? "border"
                    : "bg-glass-dark text-white/80 border border-white/10"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                </svg>
              </Link>
            </div>

            {/* Perpetuals Button */}
            <div>
              <Link
                ref={assetBtnRef}
                href={"/perpetual/btc"}
                className={`flex items-center h-10 gap-2 px-4 rounded-xl py-2 rounded-broker font-medium cursor-pointer transition-all ${
                  isPerpetualMode
                    ? "border"
                    : "bg-glass-dark text-white/80 border border-white/10"
                }`}
              >
                <span>Perpetuals</span>
              </Link>
            </div>

            {/* Options Button */}
            <div>
              <Link
                ref={optionsBtnRef}
                href={"/options/btc"}
                className={`flex items-center h-10 gap-2 px-4 rounded-xl py-2 rounded-broker font-medium cursor-pointer transition-all ${
                  isOptionsMode
                    ? "border"
                    : "bg-glass-dark text-white/80 border border-white/10"
                }`}
              >
                <span>Options</span>
              </Link>
            </div>
          </div>

          <div className="h-6 w-px bg-white/9 mx-2 rounded" />

          {!agentSidebarOpen && (
            <>
              {/* CLETH - hidden on smaller screens */}
              {!isTestnet && (
                <div className="hidden xl:block relative">
                <button
                  onClick={() => router.push("/cleth")}
                  className={`relative z-10 overflow-hidden flex items-center h-10 gap-2 px-4 rounded-xl py-2 rounded-broker font-medium cursor-pointer transition-all ${
                    isClethMode
                      ? "border"
                      : "bg-glass-dark text-white/80 border border-white/10"
                  } glow-ring`}
                >
                  <span className="text-yellow-600 font-bold">CLETH</span>

                  {/* shimmering highlight */}
                  <span
                    aria-hidden
                    className="absolute -left-24 top-0 h-full w-32 bg-linear-to-r from-transparent via-white/60 to-transparent opacity-70 transform -skew-x-12 animate-shimmer pointer-events-none"
                  />
                </button>

                <style jsx>{`
                  /* total cycle = 12s: ~2s active shimmer + 10s pause */
                  .animate-shimmer {
                    animation: shimmer 12s linear infinite;
                  }

                  @keyframes shimmer {
                    /* active shimmer compressed into the first ~16.6667% of the cycle (≈2s)
                   then remain off for the rest to create a 10s pause */
                    0% {
                      transform: translateX(-120%) skewX(-12deg);
                      opacity: 0;
                    }
                    5% {
                      transform: translateX(-20%) skewX(-12deg);
                      opacity: 0.9;
                    }
                    10% {
                      transform: translateX(20%) skewX(-12deg);
                      opacity: 0.9;
                    }
                    16.6667% {
                      transform: translateX(120%) skewX(-12deg);
                      opacity: 0;
                    }
                    100% {
                      transform: translateX(120%) skewX(-12deg);
                      opacity: 0;
                    }
                  }

                  .animate-shimmer,
                  .animate-shimmer[aria-hidden] {
                    animation-name: shimmer;
                  }
                `}</style>
              </div>
              )}
              {/* Earn - shown on all screens */}
              <div className="flex flex-col md:flex-row items-center gap-2">
                <Link
                  href="/perpetual/lp"
                  className={`flex items-center justify-center h-10 gap-2 px-4 rounded-xl rounded-broker font-medium cursor-pointer transition-all whitespace-nowrap leading-none ${
                    pathname?.startsWith("/perpetual/lp")
                      ? "bg-amber-400/10 text-amber-400 border border-amber-400/30 shadow-glow-amber"
                      : "bg-glass-dark text-white/80 border border-white/10 hover:border-amber-400 hover:text-amber-400"
                  }`}
                >
                  <span className="text-sm font-semibold">Earn</span>
                  <span className="text-xs text-white/60">Perps LP</span>
                </Link>
                <Link
                  href="/leaderboard"
                  className={`flex items-center justify-center h-10 gap-2 px-4 rounded-xl rounded-broker font-medium cursor-pointer transition-all whitespace-nowrap leading-none ${
                    pathname?.startsWith("/leaderboard")
                      ? "bg-purple-400/10 text-purple-400 border border-purple-400/30 shadow-glow-purple"
                      : "bg-glass-dark text-white/80 border border-white/10 hover:border-purple-400 hover:text-purple-400"
                  }`}
                >
                  <span className="text-sm font-semibold">🏆</span>
                  <span className="text-sm font-semibold">Leaderboard</span>
                </Link>
              </div>


            </>
          )}
        </div>

        {/* Mobile Asset Selector */}
        <div className="md:hidden">
          <MobileAssetSelector
            currentSymbol={
              selectedAsset?.display ||
              selectedInstrument?.symbol ||
              (() => {
                const pathParts = pathname?.split('/');
                if (pathParts && pathParts.length > 2) {
                  const asset = pathParts[2]?.toUpperCase();
                  return asset || "Select Asset";
                }
                return "Select Asset";
              })()
            }
            currentCategory={selectedAsset?.type}
            mode={isOptionsMode ? "options" : "perps"}
          />
        </div>

        {/* Floating dropdowns rendered via Portal to escape stacking/overflow */}
        {showAssetDropdown && assetMenuPos && (
          <Portal>
            <div
              className="fixed inset-0"
              style={{ zIndex: 99980 }}
              onClick={() => {
                setShowAssetDropdown(false);
                setAssetMenuPos(null);
              }}
            />
            <div
              style={{
                position: "absolute",
                top: assetMenuPos.top,
                left: assetMenuPos.left,
                minWidth: Math.max(240, assetMenuPos.width),
                zIndex: 99999,
              }}
              className="broker-card border border-white/10 shadow-broker-lg"
            >
              <div className="p-2">
                <div className="text-xs text-white/60 mb-2 px-2 font-semibold uppercase tracking-wide">
                  Select Asset
                </div>
                {perpetualAssets.map((a) => (
                  <button
                    key={a}
                    onClick={async () => {
                      try {
                        const asset = await getAssetBySymbol(a);
                        if (asset && asset.urlSlug)
                          router.push(`/perpetual/${asset.urlSlug}`);
                        else router.push("/perpetual/crypto-btcusd");
                      } catch (e) {
                        router.push("/perpetual/crypto-btcusd");
                      }
                      setShowAssetDropdown(false);
                      setAssetMenuPos(null);
                    }}
                    className="w-full text-left px-3 py-2 rounded transition-colors text-white/90 font-medium uppercase"
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </Portal>
        )}

        {showOptionsDropdown && optionsMenuPos && (
          <Portal>
            <div
              className="fixed inset-0"
              style={{ zIndex: 99980 }}
              onClick={() => {
                setShowOptionsDropdown(false);
                setOptionsMenuPos(null);
              }}
            />
            <div
              style={{
                position: "absolute",
                top: optionsMenuPos.top,
                left: optionsMenuPos.left,
                minWidth: Math.max(240, optionsMenuPos.width),
                zIndex: 99999,
              }}
              className="broker-card border border-white/10 shadow-broker-lg"
            >
              <div className="p-2">
                <div className="text-xs text-white/60 mb-2 px-2 font-semibold uppercase tracking-wide">
                  Select Stock
                </div>
                {optionsAssets.map((a) => (
                  <button
                    key={a}
                    onClick={() => {
                      router.push(`/options/${a}`);
                      setShowOptionsDropdown(false);
                      setOptionsMenuPos(null);
                    }}
                    className="w-full text-left px-3 py-2 rounded transition-colors text-white/90 font-medium"
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </Portal>
        )}


      </div>

      {/* Right Side - Account Info + Mobile Nav */}
      <div className="flex items-center gap-3">
        {/* Mobile Account Info: show combined account similar to desktop + Connect button */}
        <div className="flex lg:hidden items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-white/60 font-sans">Account</div>
            <div className="text-sm font-mono text-white">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(totalBalance)}
            </div>
          </div>

          {/* Mobile connect button */}
          <div className="flex items-center">
            <ConnectButton
              label="Sign In"
              showBalance={{ smallScreen: false, largeScreen: false }}
            />
          </div>
        </div>

        {/* Desktop User Controls */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Deposit Button for current active channel */}
          {channelAddress && (
            <button
              onClick={() => openDepositOptions(channelAddress)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl rounded-broker bg-glass-dark text-white/80 border border-white/10 hover:border-blue-400/50 hover:text-blue-400 text-sm font-medium transition-all"
            >
              <span>Deposit</span>
            </button>
          )}

          {/* Combined Account Value (wallet + all channels) with hover breakdown */}
          <div
            ref={accountRef}
            className="relative"
            onPointerEnter={() => {
              if (closeTimerRef.current) {
                clearTimeout(closeTimerRef.current);
                closeTimerRef.current = null;
              }
              if (accountRef.current) {
                const r = accountRef.current.getBoundingClientRect();
                setTooltipPos({
                  left: Math.max(8, r.left),
                  top: r.bottom + window.scrollY + 12,
                });
              }
              setShowConnectTooltip(true);
            }}
            onPointerLeave={() => {
              if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
              closeTimerRef.current = window.setTimeout(() => {
                setShowConnectTooltip(false);
                closeTimerRef.current = null;
              }, 200);
            }}
          >
            <div className="flex items-center gap-1 bg-surface/60 px-3 py-1.5 rounded-sm border border-white/6 cursor-pointer">
              <span className="text-white/60 text-xs font-sans">Account:</span>
              <span className="price-long font-mono text-sm">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(totalBalance)}
              </span>
            </div>

            {/* Render tooltip in a Portal so it sits above charts / other stacking contexts */}
            {showConnectTooltip && tooltipPos && (
              <Portal>
                <div
                  ref={tooltipRef}
                  onPointerEnter={() => {
                    if (closeTimerRef.current) {
                      clearTimeout(closeTimerRef.current);
                      closeTimerRef.current = null;
                    }
                    setShowConnectTooltip(true);
                  }}
                  onPointerLeave={() => {
                    if (closeTimerRef.current)
                      clearTimeout(closeTimerRef.current);
                    closeTimerRef.current = window.setTimeout(() => {
                      setShowConnectTooltip(false);
                      closeTimerRef.current = null;
                    }, 200);
                  }}
                  style={{
                    position: "fixed",
                    left: `${tooltipPos.left}px`,
                    top: `${tooltipPos.top}px`,
                    width: 320,
                    zIndex: 100001,
                    pointerEvents: "auto",
                  }}
                >
                  <div
                    className="rounded-lg p-4 bg-glass-dark border border-white/10 shadow-lg backdrop-blur-sm"
                  >
                    <div className="text-sm text-white mb-3 font-semibold">
                      Channel Balances
                    </div>

                    <div className="text-xs text-white/60 mb-2">Channels</div>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {Object.keys(channelBalances).length === 0 && (
                        <div className="text-sm text-white/60 py-2 text-center">
                          No channels created
                        </div>
                      )}
                      {Object.entries(channelBalances).map(([ch, bal]) => (
                        <div
                          key={ch}
                          className={`flex items-center justify-between gap-3 px-3 py-2 rounded transition-colors ${
                            ch === channelAddress
                              ? "bg-white/5"
                              : "bg-transparent hover:bg-white/3"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-sm font-mono text-white">
                              {shortenAddress(ch)}
                            </div>
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

                    <div className="mt-4 pt-3 border-t border-white/10">
                      <button
                        onClick={() => {
                          setShowConnectTooltip(false);
                          openChannelSelector();
                        }}
                        className="w-full px-3 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg text-primary text-sm font-medium transition-colors"
                      >
                        Switch Channel
                      </button>
                    </div>
                  </div>
                </div>
              </Portal>
            )}
          </div>

          <div className="h-6 w-px bg-white/9 mx-2 rounded" />

          {/* Aura: Vibetrading Agent Button */}
          {!agentSidebarOpen && (
            <div className="flex flex-col md:flex-row items-center gap-2">
              <button
                onClick={() => {
                  if (!isConnected) {
                    openWallet();
                  } else {
                    openAuraChannelWarning();
                  }
                }}
                className="flex items-center justify-center h-10 gap-2 px-4 rounded-xl rounded-broker font-medium cursor-pointer transition-all whitespace-nowrap leading-none bg-glass-dark text-white/80 border border-white/10 hover:border-blue-400/50 hover:text-blue-400 hover:bg-blue-400/5"
              >
                <svg
                  width="16px"
                  height="16px"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="transition-colors"
                >
                  <path
                    d="M8 15C12.8747 15 15 12.949 15 8C15 12.949 17.1104 15 22 15C17.1104 15 15 17.1104 15 22C15 17.1104 12.8747 15 8 15Z"
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2 6.5C5.13376 6.5 6.5 5.18153 6.5 2C6.5 5.18153 7.85669 6.5 11 6.5C7.85669 6.5 6.5 7.85669 6.5 11C6.5 7.85669 5.13376 6.5 2 6.5Z"
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-sm font-semibold">Vibetrader</span>
              </button>
            </div>
          )}
          {/* Connect button */}
          <div className="flex items-center gap-3">
            <ConnectButton
              label="Sign In"
              showBalance={{ smallScreen: false, largeScreen: false }}
            />
          </div>
        </div>

        {/* Mobile Navigation Button */}
        <MobileNav />
      </div>

      {/* Aura Channel Warning Portal */}
      <AuraChannelWarningPortal
        isOpen={auraChannelWarningOpen}
        onClose={closeAuraChannelWarning}
      />
    </header>
  );
}
