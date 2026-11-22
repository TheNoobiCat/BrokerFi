import { FaWallet } from "react-icons/fa";
import LeverageSelector from "./LeverageSelector";
import TPSLControls from "./TPSLControls";

interface TradingFormProps {
  // Form state
  collateral: number;
  setCollateral: (value: number) => void;
  sliderValue: number;
  setSliderValue: (value: number) => void;
  leverage: number;
  setLeverage: (value: number) => void;
  orderType: "market" | "limit";
  setOrderType: (type: "market" | "limit") => void;
  marketPrice: number | null;
  limitPrice: number | null;
  setLimitPrice: (price: number | null) => void;
  
  // TP/SL state
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
  
  // Data
  balance: number;
  chartInstrument: any;
  initialLimitPriceSetRef: React.MutableRefObject<boolean>;
  
  // Functions
  handleResetToMidPrice: () => void;
  handleLongClick: () => void;
  handleShortClick: () => void;
  formatPrice: (price: number | null) => string;
  computeTpFromPercent: (percent: number, entry: number) => { long: number; short: number };
  computeSlFromPercent: (percent: number, entry: number) => { long: number; short: number };
  getEntryPrice: () => number | null;
  calculateLiquidationPrice: (side: 'long' | 'short', entryPrice: number | null, leverage: number) => number | null;
  calculateTradeSize: (collateralUSDC: number, leverageAmount: number, price: number) => number;
  
  // Constants
  vTakerFee: number;
  maxLeverage: number;
  
  // Mobile/desktop variants
  variant?: 'desktop' | 'mobile';
}

export default function TradingForm({
  collateral,
  setCollateral,
  sliderValue,
  setSliderValue,
  leverage,
  setLeverage,
  orderType,
  setOrderType,
  marketPrice,
  limitPrice,
  setLimitPrice,
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
  balance,
  chartInstrument,
  initialLimitPriceSetRef,
  handleResetToMidPrice,
  handleLongClick,
  handleShortClick,
  formatPrice,
  computeTpFromPercent,
  computeSlFromPercent,
  getEntryPrice,
  calculateLiquidationPrice,
  calculateTradeSize,
  vTakerFee,
  maxLeverage,
  variant = 'desktop'
}: TradingFormProps) {
  const handleSetOrderType = (type: "market" | "limit") => {
    setOrderType(type);
  };

  const isMobile = variant === 'mobile';
  const inputHeight = isMobile ? 'h-12' : 'h-10 lg:h-12';
  const padding = isMobile ? 'px-4 pr-20' : 'px-3 lg:px-4 pr-16 lg:pr-20';
  const textSize = isMobile ? 'text-base' : 'text-sm lg:text-base';

  return (
    <>
      {/* Leverage selector - visible in desktop right side trade card or mobile */}
      <LeverageSelector leverage={leverage} onLeverageChange={setLeverage} maxLeverage={maxLeverage} />

      {/* Order Type Tabs */}
      <div className="flex mb-4 gap-1">
        <button
          onClick={() => handleSetOrderType("limit")}
          className={`px-3 py-2 text-sm font-medium font-sans ${
            orderType === "limit"
              ? "text-white bg-primary/20 border-b-2 border-primary"
              : "text-white/70 hover:text-white"
          }`}
        >
          Limit
        </button>
        <button
          onClick={() => handleSetOrderType("market")}
          className={`px-3 py-2 text-sm font-medium font-sans ${
            orderType === "market"
              ? "text-white bg-primary/20 border-b-2 border-primary"
              : "text-white/70 hover:text-white"
          }`}
        >
          Market
        </button>
      </div>

      {/* Available Balance */}
      <div className="mb-4 lg:mb-6 p-2 lg:p-3 bg-surface/10 rounded-lg border border-white/5">
        <div className="flex items-center justify-between text-xs lg:text-sm">
          <span className="text-white/60 font-sans flex items-center gap-1 lg:gap-2">
            <FaWallet className="w-3 h-3" />
            Balance
          </span>
          <div className="flex items-center gap-1">
            <span className="font-mono text-white text-xs lg:text-sm">
              {balance.toLocaleString()}
            </span>
            <span className="text-orange-400 font-sans font-medium text-xs lg:text-sm">
              USDC
            </span>
          </div>
        </div>
      </div>

      {/* Price Input */}
      <div className="mb-4 lg:mb-6">
        <div className="flex items-center justify-between mb-2 lg:mb-3">
          <label className="text-xs lg:text-sm text-white/60 font-sans">
            Price
          </label>
          {orderType === "limit" && (
            <button
              type="button"
              onClick={handleResetToMidPrice}
              className="px-2 py-1 text-xs bg-primary/20 hover:bg-primary/30 text-primary rounded transition-colors font-sans"
            >
              Mid
            </button>
          )}
        </div>
        <div className="relative">
          <input
            type="number"
            step="0.00000001"
            value={
              orderType === "market"
                ? marketPrice ?? ""
                : limitPrice ?? ""
            }
            onChange={(e) => {
              if (orderType === "limit") {
                const v = parseFloat(e.target.value)
                if (Number.isFinite(v)) {
                  setLimitPrice(v)
                  initialLimitPriceSetRef.current = true
                } else {
                  setLimitPrice(null)
                }
              }
            }}
            readOnly={orderType === "market"}
            className={`w-full ${inputHeight} ${padding} bg-[#1a1a1a] border border-white/10 rounded-lg text-white font-mono text-right focus:border-primary/50 focus:outline-none focus:bg-[#1e1e1e] transition-all placeholder:text-white/30 ${textSize}`}
            placeholder="0.00000000"
          />
          <span className="absolute right-3 lg:right-4 top-1/2 transform -translate-y-1/2 text-white/60 font-sans text-xs lg:text-sm font-medium">
            USDC
          </span>
        </div>
      </div>

      {/* Collateral Input with Custom Slider */}
      <div className="mb-4 lg:mb-6">
        <label className="text-xs lg:text-sm text-white/60 mb-2 lg:mb-3 block font-sans">
          Collateral (USDC)
        </label>
        <div className="relative mb-3 lg:mb-4">
          <input
            type="text"
            value={collateral}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val) && val >= 0) {
                setCollateral(val);
              }
            }}
            className={`w-full ${inputHeight} ${padding} bg-[#1a1a1a] border border-white/10 rounded-lg text-white font-mono text-right focus:border-primary/50 focus:outline-none focus:bg-[#1e1e1e] transition-all placeholder:text-white/30 ${textSize}`}
            placeholder="0.00"
          />
          <span className="absolute right-3 lg:right-4 top-1/2 transform -translate-y-1/2 text-white/60 font-sans text-xs lg:text-sm font-medium">
            USDC
          </span>
        </div>

        {/* Custom Slider */}
        <div className="relative mt-4">
          <div className="w-full h-2 bg-white/6 rounded-full relative">
            <div
              className="absolute left-0 top-0 bottom-0 rounded-full"
              style={{
                width: `${sliderValue}%`,
                background: "linear-gradient(90deg,#10b981,#34d399)",
              }}
            />
            <div
              className="absolute top-1/2 transform -translate-y-1/2"
              style={{ left: `${sliderValue}%` }}
            >
              <div className="w-4 h-4 bg-emerald-400 rounded-full ring-2 ring-emerald-600 shadow-md -translate-x-1/2" />
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="0.0001"
              value={sliderValue}
              onChange={(e) => setSliderValue(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-white/40 font-sans">0%</span>
            <span className="text-xs text-white/40 font-sans">25%</span>
            <span className="text-xs text-white/40 font-sans">50%</span>
            <span className="text-xs text-white/40 font-sans">75%</span>
            <span className="text-xs text-white/40 font-sans">100%</span>
          </div>
        </div>
      </div>

      {/* TP/SL Controls */}
      <TPSLControls
        tpSlEnabled={tpSlEnabled}
        setTpSlEnabled={setTpSlEnabled}
        takeProfit={takeProfit}
        setTakeProfit={setTakeProfit}
        takeProfitMode={takeProfitMode}
        setTakeProfitMode={setTakeProfitMode}
        stopLoss={stopLoss}
        setStopLoss={setStopLoss}
        stopLossMode={stopLossMode}
        setStopLossMode={setStopLossMode}
        formatPrice={formatPrice}
        computeTpFromPercent={computeTpFromPercent}
        computeSlFromPercent={computeSlFromPercent}
        getEntryPrice={getEntryPrice}
      />
    </>
  );
}