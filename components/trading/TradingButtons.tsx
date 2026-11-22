import { FaQuestionCircle } from "react-icons/fa";

interface TradingButtonsProps {
  onLongClick: () => void;
  onShortClick: () => void;
  collateral: number;
  leverage: number;
  orderType: 'market' | 'limit';
  limitPrice: number | null;
  marketPrice: number | null;
  calculateLiquidationPrice: (side: 'long' | 'short', entryPrice: number | null, leverage: number) => number | null;
  vTakerFee: number;
  estimatedFee?: number | null;
  longLoading?: boolean;
  shortLoading?: boolean;
}

export default function TradingButtons({
  onLongClick,
  onShortClick,
  collateral,
  leverage,
  orderType,
  limitPrice,
  marketPrice,
  calculateLiquidationPrice,
  vTakerFee,
  estimatedFee,
  longLoading = false,
  shortLoading = false,
}: TradingButtonsProps) {
  return (
    <div className="p-3 lg:p-4 border-t border-white/6">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <button
          onClick={onLongClick}
          disabled={longLoading || shortLoading}
          className="bg-green-500 hover:bg-green-600 disabled:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors font-sans text-base w-full flex items-center justify-center gap-2"
        >
          {longLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Buy / Long
            </>
          ) : (
            'Buy / Long'
          )}
        </button>
        <button
          onClick={onShortClick}
          disabled={longLoading || shortLoading}
          className="bg-red-500 hover:bg-red-600 disabled:bg-red-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors font-sans text-base w-full flex items-center justify-center gap-2"
        >
          {shortLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Sell / Short
            </>
          ) : (
            'Sell / Short'
          )}
        </button>
      </div>
      
      {/* Position Value */}
      <div className="mb-3 p-3 bg-surface/30 rounded-lg">
        <div className="flex justify-between text-sm">
          <span className="text-white/70 font-sans">
            Position Value:
          </span>
          <span className="font-mono">
            ${(collateral * leverage).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-white/70 font-sans">
            Required Margin:
          </span>
          <span className="font-mono">
            ${collateral.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        {estimatedFee !== null && estimatedFee !== undefined && (
          <div className="flex justify-between text-sm">
            <span className="text-white/70 font-sans">Est. Fee:</span>
            <span className="font-mono text-red-400">
              ${estimatedFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}
        <div className="flex justify-between text-sm pt-2 border-t border-white/10 mt-2">
          <span className="text-red-400/80 font-sans">
            Liq. Price:
          </span>
          <div className="font-mono text-red-400 text-xs">
            {(() => {
              const entryPrice = orderType === 'limit' ? (limitPrice ?? 0) : (marketPrice ?? 0);
              const longLiq = calculateLiquidationPrice('long', entryPrice, leverage);
              const shortLiq = calculateLiquidationPrice('short', entryPrice, leverage);
              return (
                <span>
                  <span className="text-green-400">L: ${longLiq?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? 'N/A'}</span>
                  {' / '}
                  <span className="text-red-400">S: ${shortLiq?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? 'N/A'}</span>
                </span>
              );
            })()}
          </div>
        </div>
      </div>
      
      {/* vTaker info with tooltip */}
      <div className="text-sm">
        <div className="flex justify-between items-center text-white/70">
          <span className="font-sans">vTaker 0.035%</span>
          <div className="relative group">
            <div className="flex items-center justify-center w-6 h-6 bg-white/6 rounded-full text-white/70 cursor-pointer group-hover:bg-white/20">
              <FaQuestionCircle className="w-4 h-4" />
            </div>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-sm rounded-lg p-3 shadow-lg w-72 text-center whitespace-normal z-50">
              No price impact — deep liquidity from LPs reduces
              slippage. vTaker fee: 0.035%.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}