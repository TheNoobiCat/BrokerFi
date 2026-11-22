interface AccountStatsProps {
  balance: number;
  totalPnL: number;
  positions: any[];
  orders: any[];
  usedMargin: number;
  availableMargin: number;
  marginUtilization: number;
}

export default function AccountStats({ 
  balance, 
  totalPnL, 
  positions, 
  orders, 
  usedMargin, 
  availableMargin, 
  marginUtilization 
}: AccountStatsProps) {
  return (
    <div className="p-3 lg:p-4">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 lg:gap-3 mb-3 lg:mb-4">
        {/* Account Value */}
        <div className="broker-card-compact">
          <div className="text-xs text-white/60 mb-1 font-sans">
            Account
          </div>
          <div className="text-base lg:text-lg font-bold text-white font-mono">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(balance)}
          </div>
          <div className="text-xs price-long font-sans">
            {(() => {
              const starting = balance - totalPnL
              if (!isFinite(starting) || starting === 0) return '0.00%'
              const pct = (totalPnL / starting) * 100
              const sign = pct >= 0 ? '+' : ''
              return `${sign}${pct.toFixed(2)}%`
            })()}
          </div>
        </div>

        {/* Unrealized PnL */}
        <div className="broker-card-compact">
          <div className="text-xs text-white/60 mb-1 font-sans">PnL</div>
          <div
            className={`text-base lg:text-lg font-bold font-mono ${
              totalPnL >= 0 ? "price-long" : "price-short"
            }`}
          >
            {totalPnL >= 0 ? "+" : ""}${totalPnL.toFixed(0)}
          </div>
          <div className="text-xs text-white/60 font-sans">
            {positions.length} pos
          </div>
        </div>

        {/* Available Margin - Hidden on mobile */}
        <div className="hidden lg:block broker-card-compact">
          <div className="text-xs text-white/60 mb-1 font-sans">
            Available Margin
          </div>
          <div className="text-lg font-bold text-white font-mono">
            ${availableMargin.toLocaleString()}
          </div>
          <div className="text-xs text-white/60 font-sans">
            {(100 - marginUtilization).toFixed(2)}%
          </div>
        </div>

        {/* Used Margin - Hidden on mobile */}
        <div className="hidden lg:block broker-card-compact">
          <div className="text-xs text-white/60 mb-1 font-sans">
            Used Margin
          </div>
          <div className="text-lg font-bold text-white font-mono">
            ${usedMargin.toLocaleString()}
          </div>
          <div className="text-xs text-white/60 font-sans">
            {marginUtilization.toFixed(2)}%
          </div>
        </div>

        {/* Open Positions - Hidden on mobile */}
        <div className="hidden lg:block broker-card-compact">
          <div className="text-xs text-white/60 mb-1 font-sans">
            Open Positions
          </div>
          <div className="text-lg font-bold text-white font-mono">
            {positions.length}
          </div>
          <div className="text-xs text-white/60 font-sans">
            {orders.length} orders
          </div>
        </div>
      </div>
    </div>
  );
}