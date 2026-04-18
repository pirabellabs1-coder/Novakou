"use client";

/**
 * Cart badge for the public navbar — visible to guests AND logged-in users.
 * Polls /api/formations/apprenant/cart every 30s (and on focus) so the count
 * updates when items are added from the formation detail page.
 */

import Link from "next/link";
import { useEffect, useState } from "react";

export default function CartBadge() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await fetch("/api/formations/apprenant/cart");
      const j = await res.json();
      setCount(Number(j?.count ?? 0));
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // Re-check when tab regains focus + every 30s while visible
    const onFocus = () => load();
    const onCustom = () => load();
    window.addEventListener("focus", onFocus);
    window.addEventListener("nk:cart-change", onCustom);
    const interval = setInterval(() => {
      if (!document.hidden) load();
    }, 30_000);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("nk:cart-change", onCustom);
      clearInterval(interval);
    };
  }, []);

  return (
    <Link
      href="/panier"
      className="relative inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100 transition-colors"
      aria-label={`Panier (${count})`}
      title="Mon panier"
    >
      <span className="material-symbols-outlined text-[22px] text-slate-700">
        shopping_cart
      </span>
      {!loading && count > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-extrabold flex items-center justify-center ring-2 ring-white"
          style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
