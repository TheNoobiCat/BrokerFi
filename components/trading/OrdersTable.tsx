interface Order {
  id: string;
  contractOrderId?: string;
  symbol: string;
  type: 'long' | 'short';
  size: number;
  leverage: number;
  orderType: 'market' | 'limit';
  price?: number;
  takeProfit?: number | null;
  stopLoss?: number | null;
  status: 'pending' | 'filled' | 'cancelled';
  createdAt: Date;
}

import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

interface OrdersTableProps {
  orders: Order[];
  onCancelOrder: (id: string) => void;
  cancellingOrders: Set<string>;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function OrdersTable({ orders, onCancelOrder, cancellingOrders, isCollapsed, onToggleCollapse }: OrdersTableProps) {
  // Filter to only show pending orders
  const pendingOrders = orders.filter(order => order.status === 'pending');
  return (
    <div className="broker-card">
      <div 
        className="p-4 border-b border-white/6 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white font-sans">
            Perpetual Orders ({pendingOrders.length})
          </h3>
          {isCollapsed ? <FaChevronDown className="text-white/50 text-sm" /> : <FaChevronUp className="text-white/50 text-sm" />}
        </div>
        {pendingOrders.length > 0 && (
          <button 
            className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-md text-xs hover:bg-red-500/20 transition-colors font-sans border border-red-500/20"
            onClick={(e) => e.stopPropagation()}
          >
            Cancel All
          </button>
        )}
      </div>
      {!isCollapsed && (
        <div className="overflow-auto">
        {pendingOrders.length > 0 ? (
          <div className="min-w-full">
            {/* Header */}
            <div className="grid grid-cols-11 gap-4 pl-6 pr-4 py-3 text-xs font-medium text-white/50 uppercase tracking-wider bg-white/[0.02] border-b border-white/[0.05]">
              <div className="col-span-2">Coin</div>
              <div className="col-span-1">Type</div>
              <div className="col-span-2">Size</div>
              <div className="col-span-3">Price</div>
              <div className="col-span-2">Order Value</div>
              <div className="col-span-1">Actions</div>
            </div>
            
            {/* Order Rows */}
            {pendingOrders.map((order) => {
              const orderValue = order.size * (order.price || 0);
              return (
                <div 
                  key={order.id} 
                  className="grid grid-cols-11 gap-4 px-4 py-4 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                >
                  {/* Coin & Side */}
                  <div className="col-span-2 flex items-center gap-2">
                    <div className="flex flex-col">
                      <span className="font-medium text-white font-mono text-sm">
                        {order.symbol}
                      </span>
                      <span 
                        className={`text-xs font-medium px-1.5 py-0.5 rounded w-fit ${
                          order.type === "long"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-red-500/15 text-red-400"
                        }`}
                      >
                        {order.type.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Order Type */}
                  <div className="col-span-1 flex items-center">
                    <span className="text-xs bg-white/10 text-white/80 px-2 py-1 rounded font-mono font-medium">
                      {order.orderType.toUpperCase()}
                    </span>
                  </div>

                  {/* Size */}
                  <div className="col-span-2 flex items-center">
                    <span className="font-mono text-white text-sm">
                      {order.size.toLocaleString(undefined, { 
                        minimumFractionDigits: 0, 
                        maximumFractionDigits: 4 
                      })}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="col-span-3 flex items-center">
                    <span className="font-mono text-white/90 text-sm">
                      {order.price ? 
                        `$${order.price.toLocaleString(undefined, { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 6 
                        })}` : 
                        'Market'
                      }
                    </span>
                  </div>

                  {/* Order Value */}
                  <div className="col-span-2 flex items-center">
                    <span className="font-mono text-white text-sm">
                      ${orderValue.toLocaleString(undefined, { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex items-center">
                    {cancellingOrders.has(order.id) ? (
                      <div className="px-3 py-1 bg-red-700 opacity-50 text-white rounded text-xs font-sans flex items-center gap-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        Cancel
                      </div>
                    ) : (
                      <button
                        onClick={() => onCancelOrder(order.id)}
                        className="px-3 py-1 bg-red-500/10 text-red-400 rounded text-xs hover:bg-red-500/20 font-sans border border-red-500/20"
                      >
                        Cancel
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
          <div className="text-sm">No open orders</div>
          <div className="text-xs text-white/30 mt-1">Your pending orders will appear here</div>
        </div>
      )}
        </div>
      )}
    </div>
  );
}