"use client";

import { useUI } from "@/store/UIContext";
import Toast from "@/components/ui/Toast";

export default function ToastContainer() {
  const { toast, hideToast } = useUI();

  if (!toast) return null;

  return (
    <Toast
      message={toast.message}
      type={toast.type}
      onClose={hideToast}
    />
  );
}