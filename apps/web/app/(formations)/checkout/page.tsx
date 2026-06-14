"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import CheckoutInner from "./CheckoutInner";

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center">
        <Loader2 size={48} className="text-zinc-300 animate-spin" />
      </div>
    }>
      <CheckoutInner />
    </Suspense>
  );
}
