"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      expand={false}
      richColors
      closeButton
      toastOptions={{
        duration: 4000,
        classNames: {
          error: "border-rose-200 bg-rose-50",
          success: "border-emerald-200 bg-emerald-50",
          warning: "border-amber-200 bg-amber-50",
          info: "border-blue-200 bg-blue-50",
        },
      }}
    />
  );
}
