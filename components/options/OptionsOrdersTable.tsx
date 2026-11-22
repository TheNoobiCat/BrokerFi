"use client";

import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { OptionsOrderData } from '@/hooks/useOptionsOrders';
import { formatUnits } from 'viem';
import { GhostSquare } from '@/components/ui/GhostSquare';

interface OptionsOrdersTableProps {
  orders: OptionsOrderData[];
  onCancelOrder?: (seriesId: string, orderId: string) => void;
  cancellingOrders?: Set<string>;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  loading?: boolean;
}

export default function OptionsOrdersTable({ 
  orders, 
  onCancelOrder, 
  cancellingOrders = new Set(),
  isCollapsed, 
  onToggleCollapse,
  loading = false
}: OptionsOrdersTableProps) {
  // Filter to only show active orders
  const activeOrders = orders.filter(order => order.status === 'ACTIVE');

  const formatPrice = (value: string, decimals: number = 0) => {
    try {
      const bigIntValue = BigInt(value);
      const num = Number(formatUnits(bigIntValue, decimals));
      return '$' + num.toLocaleString('en-US', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
      });
    } catch {
      const num = Number(value);
      return '$' + num.toLocaleString('en-US', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
      });
    }
  };

  // limitPrice is per-unit-of-underlying in 18-dec.
  // To show per-contract premium: (limitPrice / 1e18) * (contractSize / 1e18)
  // which is equivalent to: (limitPrice * contractSize) / 1e36 → formatUnits(36)
  const formatPremiumPerContract = (limitPrice: string, contractSize: string) => {
    try {
      const premium = BigInt(limitPrice) * BigInt(contractSize); // 18 + 18 = 36 dec
      const num = Number(formatUnits(premium, 36));
      return '$' + num.toLocaleString('en-US', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 4 
      });
    } catch {
      return '$0.00';
    }
  };

  const formatStrike = (value: string) => {
    try {
      const num = Number(formatUnits(BigInt(value), 18));
      return num.toLocaleString('en-US', { 
        minimumFractionDigits: 0,
        maximumFractionDigits: 2 
      });
    } catch {
      return '0';
    }
  };

  const formatExpiry = (timestamp: string) => {
    try {
      const date = new Date(Number(timestamp) * 1000);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getIntentLabel = (intent: string) => {
    const labels: Record<string, string> = {
      'BuyToOpen': 'Buy to Open',
      'BuyToClose': 'Buy to Close',
      'SellToOpen': 'Sell to Open',
      'SellToClose': 'Sell to Close'
    };
    return labels[intent] || intent;
  };

  const getIntentColor = (intent: string) => {
    if (intent.includes('Buy')) {
      return 'text-emerald-400 bg-emerald-500/15';
    }
    return 'text-red-400 bg-red-500/15';
  };

  return (
    <div className="broker-card">
      <div 
        className="p-4 border-b border-white/6 flex items-center justify-between cursor-pointer hover:bg-white/2 transition-colors"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white font-sans">
            Options Orders ({activeOrders.length})
          </h3>
          {isCollapsed ? <FaChevronDown className="text-white/50 text-sm" /> : <FaChevronUp className="text-white/50 text-sm" />}
        </div>
        {activeOrders.length > 0 && onCancelOrder && (
          <button 
            className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-md text-xs hover:bg-red-500/20 transition-colors font-sans border border-red-500/20"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implement cancel all
            }}
          >
            Cancel All
          </button>
        )}
      </div>
      {!isCollapsed && (
        <div className="overflow-auto">
          {loading ? (
            <div className="space-y-2">
              {/* Skeleton rows */}
              {[...Array(3)].map((_, i) => (
                <div key={i} className="grid grid-cols-12 gap-4 px-4 py-4 border-b border-white/3">
                  <div className="col-span-2"><GhostSquare size="md" /></div>
                  <div className="col-span-2"><GhostSquare size="sm" /></div>
                  <div className="col-span-1"><GhostSquare size="xs" /></div>
                  <div className="col-span-2"><GhostSquare size="md" /></div>
                  <div className="col-span-2"><GhostSquare size="md" /></div>
                  <div className="col-span-2"><GhostSquare size="sm" /></div>
                  <div className="col-span-1"><GhostSquare size="lg" /></div>
                </div>
              ))}
            </div>
          ) : activeOrders.length > 0 ? (
            <div className="min-w-full">
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 pl-6 pr-4 py-3 text-xs font-medium text-white/50 uppercase tracking-wider bg-white/2 border-b border-white/5">
                <div className="col-span-2">Option</div>
                <div className="col-span-2">Intent</div>
                <div className="col-span-1">Qty</div>
                <div className="col-span-2">Limit Price</div>
                <div className="col-span-2">Margin Locked</div>
                <div className="col-span-2">Expiry</div>
                <div className="col-span-1">Actions</div>
              </div>
              
              {/* Order Rows */}
              {activeOrders.map((order) => {
                const isCancelling = cancellingOrders.has(`${order.series.id}-${order.orderId}`);
                return (
                  <div 
                    key={order.id} 
                    className="grid grid-cols-12 gap-4 px-4 py-4 border-b border-white/3 hover:bg-white/2 transition-colors"
                  >
                    {/* Option Details */}
                    <div className="col-span-2 flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white font-mono text-sm">
                          {order.asset?.symbol || 'UNKNOWN'} ${formatStrike(order.series.strikePrice)}
                        </span>
                      </div>
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded w-fit ${
                        order.series.isCall 
                          ? 'bg-emerald-500/15 text-emerald-400' 
                          : 'bg-red-500/15 text-red-400'
                      }`}>
                        {order.series.isCall ? 'CALL' : 'PUT'}
                      </span>
                    </div>

                    {/* Intent */}
                    <div className="col-span-2 flex items-center">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${getIntentColor(order.intent)}`}>
                        {getIntentLabel(order.intent)}
                      </span>
                    </div>

                    {/* Quantity */}
                    <div className="col-span-1 flex items-center">
                      <span className="font-mono text-white text-sm">
                        {order.quantity}
                      </span>
                    </div>

                    {/* Limit Price */}
                    <div className="col-span-2 flex items-center">
                      <span className="font-mono text-white text-sm">
                        {formatPremiumPerContract(order.limitPrice, order.series.contractSize)}
                      </span>
                    </div>

                    {/* Margin Locked */}
                    <div className="col-span-2 flex items-center">
                      <span className="font-mono text-white/70 text-sm">
                        {formatPrice(order.marginLocked, 18)}
                      </span>
                    </div>

                    {/* Expiry */}
                    <div className="col-span-2 flex items-center">
                      <span className="text-xs text-white/70 font-mono">
                        {formatExpiry(order.series.expiry)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex items-center justify-center">
                      {onCancelOrder && (
                        <button
                          onClick={() => !isCancelling && onCancelOrder(order.series.id, order.orderId)}
                          disabled={isCancelling}
                          className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-md text-xs hover:bg-red-500/20 transition-colors font-mono border border-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isCancelling ? (
                            <div className="flex items-center gap-1">
                              <div className="animate-spin rounded-full h-3 w-3 border-b border-red-400"></div>
                              Cancel
                            </div>
                          ) : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-white/40 text-sm font-sans">
                No active options orders
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
