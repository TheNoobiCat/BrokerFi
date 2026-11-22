"use client";

import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

interface ExpirationDatesBarProps {
  expirationDates: Array<{
    label: string;
    fullDate: string;
    days: number;
  }>;
  selectedExpiry: number;
  onSelectExpiry: (index: number) => void;
  onScrollLeft: () => void;
  onScrollRight: () => void;
}

export default function ExpirationDatesBar({
  expirationDates,
  selectedExpiry,
  onSelectExpiry,
  onScrollLeft,
  onScrollRight,
}: ExpirationDatesBarProps) {
  return (
    <div className="border-b border-white/10 bg-transparent sticky top-[140px] sm:top-[156px] z-40">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="relative">
          <button
            onClick={onScrollLeft}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all lg:hidden"
          >
            <FaChevronLeft size={16} />
          </button>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide px-8">
            {expirationDates.map((exp, idx) => (
              <button
                key={idx}
                onClick={() => onSelectExpiry(idx)}
                className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-semibold text-xs sm:text-sm whitespace-nowrap transition-all ${
                  idx === selectedExpiry
                    ? "bg-green-500 text-black"
                    : "bg-transparent text-white/70 hover:text-white border border-white/20 hover:border-white/40"
                }`}
              >
                {exp.label}
              </button>
            ))}
          </div>
          <button
            onClick={onScrollRight}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all lg:hidden"
          >
            <FaChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}