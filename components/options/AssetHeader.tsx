"use client";

import NumberFlow from "@number-flow/react";
import { GhostSquare } from "@/components/ui/GhostSquare";

interface LivePriceData {
  price: number;
  change: number;
  changePercent: number;
}

interface AssetHeaderProps {
  asset: string;
  stockData: LivePriceData;
  formatPercent: (num: number) => string;
  getMaxFractionDigits: (price: number) => number;
}

export default function AssetHeader({
  asset,
  stockData,
  formatPercent,
  getMaxFractionDigits,
}: AssetHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
        {asset} Options
      </h1>
      <div className="flex items-baseline gap-3 sm:gap-4 flex-wrap">
        {stockData.price > 0 ? (
          <NumberFlow
            value={stockData.price}
            format={{
              style: "currency",
              currency: "USD",
              maximumFractionDigits: getMaxFractionDigits(
                stockData.price,
              ),
              currencyDisplay: "narrowSymbol",
            }}
            className="text-3xl sm:text-4xl font-bold text-white font-mono"
          />
        ) : (
          <GhostSquare size="price" />
        )}
        {stockData.price > 0 && (
          <span
            className={`text-base sm:text-lg font-bold ${stockData.change >= 0 ? "text-green-500" : "text-red-500"}`}
          >
            {formatPercent(stockData.changePercent)}
          </span>
        )}
      </div>
    </div>
  );
}