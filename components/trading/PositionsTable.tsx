interface Position {
  id: string;
  symbol: string;
  type: 'long' | 'short';
  size: number;
  leverage: number;
  openPrice: number;
  currentPrice: number;
  pnl: number;
  liquidationPrice: number;
  takeProfit?: number;
  stopLoss?: number;
}

import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { useState } from 'react';
import ClosePositionModal from './ClosePositionModal';

interface PositionsTableProps {
  positions: Position[];
  onClosePosition: (id: string) => void;
  closingPositions: Set<string>;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function PositionsTable({ positions, onClosePosition, closingPositions, isCollapsed, onToggleCollapse }: PositionsTableProps) {
  const [positionToClose, setPositionToClose] = useState<Position | null>(null);

  const handleCloseClick = (position: Position) => {
    setPositionToClose(position);
  };

  const handleConfirmClose = (positionId: string) => {
    onClosePosition(positionId);
    setPositionToClose(null);
  };

  return (
    <div className="broker-card">
      <div 
        className="p-4 border-b border-white/6 flex items-center justify-between cursor-pointer hover:bg-white/2 transition-colors"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white font-sans">
            Positions ({positions.length})
          </h3>
          {isCollapsed ? <FaChevronDown className="text-white/50 text-sm" /> : <FaChevronUp className="text-white/50 text-sm" />}
        </div>
        {positions.length > 0 && (
          <button 
            className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-md text-xs hover:bg-red-500/20 transition-colors font-sans border border-red-500/20"
            onClick={(e) => {
              e.stopPropagation();
              positions.forEach((position) => onClosePosition(position.id));
            }}
          >
            Close All
          </button>
        )}
      </div>
      {!isCollapsed && (
        <div className="overflow-auto">
        {positions.length > 0 ? (
          <div className="min-w-full">
            {/* Header */}
            <div className="grid grid-cols-[2fr_1fr_1.5fr_1.5fr_1.5fr_1.2fr_1.2fr_1.5fr_1fr] gap-2 pl-6 pr-6 py-3 text-xs font-medium text-white/50 uppercase tracking-wider bg-white/2 border-b border-white/5">
              <div>Coin</div>
              <div className="text-center">Size</div>
              <div className="text-right">Position Value</div>
              <div className="text-right">Entry Price</div>
              <div className="text-right">Mark Price</div>
              <div className="text-right">PNL (ROE %)</div>
              <div className="text-right">Liq. Price</div>
              <div className="text-center">TP/SL</div>
              <div className="text-center">Actions</div>
            </div>
            
            {/* Position Rows */}
            {positions.map((position) => {
              const positionValue = position.size * position.currentPrice;
              const roe = (position.pnl / (positionValue / position.leverage)) * 100;
              return (
                <div 
                  key={position.id} 
                  className="relative grid grid-cols-[2fr_1fr_1.5fr_1.5fr_1.5fr_1.2fr_1.2fr_1.5fr_1fr] gap-1 pl-6 pr-6 py-2 border-b border-white/3 hover:bg-white/2 transition-colors group overflow-hidden"
                >
                  {/* Left gradient bar that intrudes over coin area */}
                  <div className={`absolute left-0 top-0 bottom-0 w-28 rounded-r-md pointer-events-none z-0 ${position.type === "long" ? "bg-linear-to-r from-emerald-400/40 to-transparent" : "bg-linear-to-r from-red-400/40 to-transparent"}`}></div>
                  
                  {/* Coin, Side, then Leverage inline with reduced spacing */}
                  <div className="flex items-center gap-2 z-10">
                    <span className="font-medium text-white font-mono text-sm">
                      {position.symbol.replace('USDT', '').replace('USD', '')}
                    </span>
                    <span 
                      className={`text-xs font-medium px-1 py-0.5 rounded w-fit ${
                        position.type === "long"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-red-500/15 text-red-400"
                      }`}
                    >
                      {position.type.toUpperCase()}
                    </span>
                    <span className="font-mono text-xs text-white/80 px-1.5 py-0.5 bg-white/3 rounded">
                      {Math.round(position.leverage)}x
                    </span>
                  </div>

                  {/* Size */}
                  <div className="flex items-center justify-center z-10">
                    <span className="font-mono text-white text-sm">
                      {Number(position.size).toLocaleString(undefined, { 
                        minimumFractionDigits: 0, 
                        maximumFractionDigits: 4 
                      })}
                    </span>
                  </div>

                  {/* Position Value */}
                  <div className="flex items-center justify-end z-10">
                    <span className="font-mono text-white text-sm">
                      ${Number(positionValue).toLocaleString(undefined, { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </span>
                  </div>

                  {/* Entry Price */}
                  <div className="flex items-center justify-end z-10">
                    <span className="font-mono text-white/90 text-sm">
                      ${Number(position.openPrice).toLocaleString(undefined, { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </span>
                  </div>

                  {/* Mark Price */}
                  <div className="flex items-center justify-end z-10">
                    <span className="font-mono text-white/90 text-sm">
                      ${Number(position.currentPrice).toLocaleString(undefined, { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </span>
                  </div>

                  {/* PNL & ROE */}
                  <div className="flex items-center justify-end z-10">
                    <div className="text-right">
                      <div 
                        className={`font-mono text-sm font-medium ${
                          position.pnl >= 0 ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {position.pnl >= 0 ? "+" : ""}${Math.abs(Number(position.pnl)).toLocaleString(undefined, { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}
                      </div>
                      <div 
                        className={`font-mono text-xs text-white/60 ${
                          position.pnl >= 0 ? "text-emerald-400/80" : "text-red-400/80"
                        }`}
                      >
                        ({roe >= 0 ? "+" : ""}{ Number(roe).toFixed(2)}%)
                      </div>
                    </div>
                  </div>

                  {/* Liquidation Price */}
                  <div className="flex items-center justify-end z-10">
                    <span className="font-mono text-white/60 text-sm">
                      ${Number(position.liquidationPrice).toLocaleString(undefined, { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </span>
                  </div>

                  {/* TP/SL */}
                  <div className="flex items-center justify-center z-10">
                    <div className="flex flex-row gap-1 justify-center">
                      {position.takeProfit && (
                        <div className="font-mono text-emerald-400 text-xs">
                          TP: ${Number(position.takeProfit).toLocaleString(undefined, { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </div>
                      )}
                      {position.stopLoss && (
                        <div className="font-mono text-red-400 text-xs">
                          SL: ${Number(position.stopLoss).toLocaleString(undefined, { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </div>
                      )}
                      {!position.takeProfit && !position.stopLoss && (
                        <span className="font-mono text-white/40 text-xs">-</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-center gap-1 z-10">
                    {closingPositions.has(position.id) ? (
                      <div className="px-2 py-1 bg-red-700 opacity-50 text-white rounded text-xs font-sans flex items-center gap-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        Close
                      </div>
                    ) : (
                      <button
                        onClick={() => handleCloseClick(position)}
                        className="px-2 py-1 bg-red-500/10 text-red-400 rounded text-xs hover:bg-red-500/20 font-sans border border-red-500/20"
                      >
                        Close
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-white/50 font-sans">
            <div className="h-3 mb-3" />
            <div className="text-sm">No open positions</div>
            <div className="text-xs text-white/30 mt-1">Your positions will appear here</div>
          </div>
        )}
        </div>
      )}
      
      <ClosePositionModal
        position={positionToClose}
        onClose={() => setPositionToClose(null)}
        onConfirm={handleConfirmClose}
        isClosing={positionToClose ? closingPositions.has(positionToClose.id) : false}
      />
    </div>
  );
}