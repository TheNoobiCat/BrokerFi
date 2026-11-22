"use client";

import { useUI } from "@/store/UIContext";
import { useState, useEffect } from "react";

export default function ShimmerEffect() {
  const { agentSidebarOpen } = useUI();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!agentSidebarOpen || isMobile) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-10">
      <div
        aria-hidden
        className="absolute -left-full top-0 h-full w-[200%] bg-linear-to-r from-transparent via-blue-400/20 via-purple-400/25 via-pink-400/20 to-transparent opacity-70 transform -skew-x-12 animate-viewport-shimmer"
      />

      <style jsx>{`
        .animate-viewport-shimmer {
          animation: viewport-shimmer 2s ease-out forwards;
        }

        @keyframes viewport-shimmer {
          0% {
            transform: translateX(-150%) skewX(-12deg);
            opacity: 0;
          }
          20% {
            opacity: 0.7;
          }
          80% {
            opacity: 0.7;
          }
          100% {
            transform: translateX(150%) skewX(-12deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}