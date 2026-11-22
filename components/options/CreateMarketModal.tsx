"use client";

import { useEffect, useMemo, useState } from "react";
import { FaTimes, FaGlobe, FaCoins } from "react-icons/fa";
import Portal from "@/components/ui/Portal";
import { useSession } from "@/store/SessionContext";
import { createCommunityMarket } from "@/services/options";
import { useUI } from "@/store/UIContext";

type PythAsset = {
  symbol: string;
  name: string;
  pythId: `0x${string}`;
};

interface CreateMarketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateMarketModal({ isOpen, onClose }: CreateMarketModalProps) {
  const { channelAddress } = useSession();
  const { showToast, setGlobalLoading } = useUI();
  const [allFeeds, setAllFeeds] = useState<PythAsset[]>([]);
  const [search, setSearch] = useState("");
  const [selectedFeed, setSelectedFeed] = useState<PythAsset | null>(null);
  const [customPythId, setCustomPythId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useCustom, setUseCustom] = useState(false);

  // Load the full Pyth catalog via API (cached server-side)
  useEffect(() => {
    const loadAssets = async () => {
      try {
        const res = await fetch("/api/assets");
        if (!res.ok) throw new Error("Failed to load assets");
        const data = await res.json();

        const flattened: PythAsset[] = Object.values<any>(data || {})
          .flatMap((arr: any[]) => arr || [])
          .map((entry: any) => {
            const rawId = entry?.pyth_id || entry?.pythId || "";
            const pythId = (rawId?.startsWith("0x") ? rawId : `0x${rawId}`) as `0x${string}`;
            return {
              symbol: entry?.symbol,
              name: entry?.description || entry?.display || entry?.symbol,
              pythId,
            };
          })
          .filter((e) => e.symbol && e.pythId && e.pythId.length > 2);

        // Deduplicate by pythId
        const uniqueMap = new Map<string, PythAsset>();
        flattened.forEach((f) => {
          if (!uniqueMap.has(f.pythId.toLowerCase())) uniqueMap.set(f.pythId.toLowerCase(), f);
        });

        setAllFeeds(Array.from(uniqueMap.values()));
      } catch (err) {
        showToast(`Failed to load Pyth assets: ${String(err)}`, "error");
      }
    };

    loadAssets();
  }, [showToast]);

  const filteredFeeds = useMemo(() => {
    if (!search) return allFeeds.slice(0, 200);
    const term = search.toLowerCase();
    return allFeeds.filter((f) =>
      f.symbol.toLowerCase().includes(term) ||
      (f.name || "").toLowerCase().includes(term) ||
      f.pythId.toLowerCase().includes(term)
    ).slice(0, 200);
  }, [allFeeds, search]);

  if (!isOpen) return null;

  const handleCreate = async () => {
    const feedId = useCustom
      ? (customPythId.startsWith("0x") ? customPythId : `0x${customPythId}`) as `0x${string}`
      : selectedFeed?.pythId;

    if (!feedId) {
      showToast("Select or enter a price feed ID", "error");
      return;
    }

    if (!channelAddress) {
      showToast("Connect your session first", "error");
      return;
    }

    setIsSubmitting(true);
    setGlobalLoading(true);

    try {
      const result = await createCommunityMarket({
        channelAddress: channelAddress as `0x${string}`,
        priceFeedId: feedId,
        onSubmitted: () => showToast("Transaction submitted to relayer", "info"),
        onSuccess: () => {
          showToast("Market created", "success");
          onClose();
        },
        onError: (err) => {
          const msg = err?.detail || err?.error || String(err);
          showToast(`Create failed: ${msg}`, "error");
        },
      });

      if (!result.success) {
        const msg = result.error || "Failed to create market";
        showToast(`Create failed: ${msg}`, "error");
      }
    } catch (err) {
      showToast(`Create failed: ${String(err)}`, "error");
    } finally {
      setIsSubmitting(false);
      setGlobalLoading(false);
    }
  };

  return (
    <Portal>
      <>
        <div className="fixed inset-0 z-99999 bg-black/80" onClick={onClose} />
        <div className="fixed inset-0 z-100000 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-black/95 border border-white/10 rounded-lg shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-white/10 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FaGlobe className="w-5 h-5 text-blue-400" />
                  <h2 className="text-lg font-bold text-white">Create Community Market</h2>
                </div>
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                  <FaTimes className="w-5 h-5 text-white/60" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Cost notice */}
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <div className="flex items-center gap-2 mb-1">
                  <FaCoins className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400 font-semibold text-sm">Creation Fee: 250 USDC</span>
                </div>
              </div>

              {/* Selection mode toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setUseCustom(false)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                    !useCustom ? "bg-blue-500 text-white" : "bg-white/10 text-white/70 hover:bg-white/20"
                  }`}
                >
                  Known Assets
                </button>
                <button
                  onClick={() => setUseCustom(true)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                    useCustom ? "bg-blue-500 text-white" : "bg-white/10 text-white/70 hover:bg-white/20"
                  }`}
                >
                  Custom Pyth ID
                </button>
              </div>

              {/* Known assets search + list */}
              {!useCustom && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search symbol, name, or Pyth ID"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 text-sm"
                  />
                  <div className="h-72 max-h-96 overflow-y-auto border border-white/10 rounded-lg divide-y divide-white/5 bg-white/5">
                    {filteredFeeds.length === 0 && (
                      <div className="p-3 text-white/50 text-sm">No matches</div>
                    )}
                    {filteredFeeds.map((feed) => (
                      <button
                        key={feed.pythId}
                        onClick={() => setSelectedFeed(feed)}
                        className={`w-full text-left p-3 flex justify-between items-center gap-3 hover:bg-white/10 transition-colors ${
                          selectedFeed?.pythId === feed.pythId ? "bg-blue-500/10 border-l-2 border-blue-500" : ""
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-white text-sm">{feed.symbol}</div>
                          <div className="text-white/50 text-xs line-clamp-1">{feed.name}</div>
                        </div>
                        <div className="text-[10px] text-white/40 font-mono">{feed.pythId}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Pyth ID input */}
              {useCustom && (
                <div>
                  <label className="block text-white/70 text-sm mb-2">Pyth Price Feed ID</label>
                  <input
                    type="text"
                    value={customPythId}
                    onChange={(e) => setCustomPythId(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 font-mono text-sm"
                  />
                  <p className="text-white/40 text-xs mt-1">
                    Find IDs at{" "}
                    <a href="https://pyth.network/price-feeds" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                      pyth.network/price-feeds
                    </a>
                  </p>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="p-6 pt-0 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={isSubmitting || !channelAddress || (!useCustom && !selectedFeed) || (useCustom && !customPythId)}
                className="flex-1 py-3 rounded-lg bg-blue-500 text-white font-bold transition-all hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Creating..." : "Create Market (250 USDC)"}
              </button>
            </div>
          </div>
        </div>
      </>
    </Portal>
  );
}
