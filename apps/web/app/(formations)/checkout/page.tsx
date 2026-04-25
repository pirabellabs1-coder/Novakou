"use client";

import { Suspense } from "react";
import CheckoutInner from "./CheckoutInner";

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center">
        <span className="material-symbols-outlined text-[48px] text-zinc-300 animate-spin">progress_activity</span>
      </div>
    }>
      <CheckoutInner />
    </Suspense>
  );
}
