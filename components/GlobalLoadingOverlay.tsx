"use client";

import { useUI } from "@/store/UIContext";
import Logo from "./icons/Logo";
import React from "react";

export default function GlobalLoadingOverlay() {
  const { globalLoading } = useUI();

  // Lock scroll when overlay is visible, restore on hide
  React.useEffect(() => {
    if (globalLoading) {
      // Store previous overflow value to restore later
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
    // If overlay is hidden, ensure restoration
    document.body.style.overflow = '';
    return undefined;
  }, [globalLoading]);

  if (!globalLoading) return null;

  return (
    <div className="fixed top-16 left-0 right-0 bottom-0 z-[9999] flex items-center justify-center bg-[#121212]">
      <Logo />
      <div className="ml-5 animate-spin rounded-full h-8 w-8 border-b-2 border-white/90"></div>
    </div>
  );
}