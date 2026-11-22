import { FaPercentage, FaDollarSign, FaCheck } from 'react-icons/fa';

interface TPSLControlsProps {
  tpSlEnabled: boolean;
  setTpSlEnabled: (enabled: boolean) => void;
  takeProfit: number | null;
  setTakeProfit: (value: number | null) => void;
  takeProfitMode: 'price' | 'percent';
  setTakeProfitMode: (mode: 'price' | 'percent') => void;
  stopLoss: number | null;
  setStopLoss: (value: number | null) => void;
  stopLossMode: 'price' | 'percent';
  setStopLossMode: (mode: 'price' | 'percent') => void;
  formatPrice: (price: number | null) => string;
  computeTpFromPercent: (percent: number, entry: number) => { long: number; short: number };
  computeSlFromPercent: (percent: number, entry: number) => { long: number; short: number };
  getEntryPrice: () => number | null;
}

export default function TPSLControls({
  tpSlEnabled,
  setTpSlEnabled,
  takeProfit,
  setTakeProfit,
  takeProfitMode,
  setTakeProfitMode,
  stopLoss,
  setStopLoss,
  stopLossMode,
  setStopLossMode,
  formatPrice,
  computeTpFromPercent,
  computeSlFromPercent,
  getEntryPrice,
}: TPSLControlsProps) {
  return (
    <div className="mb-4">
      <label className="flex items-center text-sm text-white/70 font-sans cursor-pointer mb-3">
        <input
          type="checkbox"
          checked={tpSlEnabled}
          onChange={(e) => setTpSlEnabled(e.target.checked)}
          className="mr-3 w-4 h-4 accent-emerald-500"
        />
        <span className="text-white/90 font-medium">Take Profit / Stop Loss</span>
      </label>

      {tpSlEnabled && (
        <div className="space-y-3">
          {/* Take Profit Section */}
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <label className="text-emerald-400 text-sm font-medium">Take Profit</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step={takeProfitMode === 'price' ? '0.00000001' : '0.1'}
                value={takeProfit ?? ''}
                onChange={(e) => setTakeProfit(e.target.value === '' ? null : parseFloat(e.target.value))}
                className="flex-1 h-10 px-3 bg-[#1a1a1a] border border-white/10 rounded-lg text-white font-mono text-right focus:border-emerald-500/50 focus:outline-none transition-colors"
                placeholder={takeProfitMode === 'price' ? '0.0000' : '5.0'}
              />
              <div className="flex bg-[#111111] border border-white/10 rounded-lg overflow-hidden">
                <button
                  onClick={() => setTakeProfitMode('price')}
                  className={`px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1 ${
                    takeProfitMode === 'price'
                      ? 'bg-emerald-500/20 text-emerald-400 border-r border-white/10'
                      : 'text-white/70 hover:text-white/90'
                  }`}
                >
                  <FaDollarSign className="w-3 h-3" />
                  Price
                </button>
                <button
                  onClick={() => setTakeProfitMode('percent')}
                  className={`px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1 ${
                    takeProfitMode === 'percent'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'text-white/70 hover:text-white/90'
                  }`}
                >
                  % ROI
                  
                </button>
              </div>
            </div>
            {takeProfitMode === 'percent' && takeProfit != null && getEntryPrice() != null && (
              <div className="mt-2 text-xs text-white/60">
                <div className="flex justify-between">
                  <span>Long: {formatPrice(computeTpFromPercent(takeProfit, getEntryPrice()!).long)}</span>
                  <span>Short: {formatPrice(computeTpFromPercent(takeProfit, getEntryPrice()!).short)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Stop Loss Section */}
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <label className="text-red-400 text-sm font-medium">Stop Loss</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step={stopLossMode === 'price' ? '0.00000001' : '0.1'}
                value={stopLoss ?? ''}
                onChange={(e) => setStopLoss(e.target.value === '' ? null : parseFloat(e.target.value))}
                className="flex-1 h-10 px-3 bg-[#1a1a1a] border border-white/10 rounded-lg text-white font-mono text-right focus:border-red-500/50 focus:outline-none transition-colors"
                placeholder={stopLossMode === 'price' ? '0.0000' : '2.0'}
              />
              <div className="flex bg-[#111111] border border-white/10 rounded-lg overflow-hidden">
                <button
                  onClick={() => setStopLossMode('price')}
                  className={`px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1 ${
                    stopLossMode === 'price'
                      ? 'bg-red-500/20 text-red-400 border-r border-white/10'
                      : 'text-white/70 hover:text-white/90'
                  }`}
                >
                  <FaDollarSign className="w-3 h-3" />
                  Price
                </button>
                <button
                  onClick={() => setStopLossMode('percent')}
                  className={`px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1 ${
                    stopLossMode === 'percent'
                      ? 'bg-red-500/20 text-red-400'
                      : 'text-white/70 hover:text-white/90'
                  }`}
                >
                  % ROI
                </button>
              </div>
            </div>
            {stopLossMode === 'percent' && stopLoss != null && getEntryPrice() != null && (
              <div className="mt-2 text-xs text-white/60">
                <div className="flex justify-between">
                  <span>Long: {formatPrice(computeSlFromPercent(stopLoss, getEntryPrice()!).long)}</span>
                  <span>Short: {formatPrice(computeSlFromPercent(stopLoss, getEntryPrice()!).short)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}