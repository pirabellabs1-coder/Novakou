"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";

export interface VendorShopSummary {
  id: string;
  name: string;
  slug: string;
  isPrimary: boolean;
  themeColor: string | null;
  logoUrl: string | null;
  customDomain: string | null;
  customDomainVerified: boolean;
}

interface ShopContextValue {
  loading: boolean;
  activeShop: VendorShopSummary | null;
  shops: VendorShopSummary[];
  shopCount: number;
  refresh: () => Promise<void>;
  switchShop: (shopId: string) => Promise<void>;
}

const ShopCtx = createContext<ShopContextValue>({
  loading: true,
  activeShop: null,
  shops: [],
  shopCount: 0,
  refresh: async () => {},
  switchShop: async () => {},
});

// Routes that don't need an active-shop guard (still inside vendor space)
const BYPASS = ["/vendeur/choisir-boutique", "/vendeur/boutiques"];

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [activeShop, setActiveShop] = useState<VendorShopSummary | null>(null);
  const [shops, setShops] = useState<VendorShopSummary[]>([]);
  const [shopCount, setShopCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/formations/vendeur/shops/active");
      if (!res.ok) {
        setActiveShop(null);
        setShops([]);
        setShopCount(0);
        return;
      }
      const json = await res.json();
      setActiveShop(json.data?.activeShop ?? null);
      setShops(json.data?.shops ?? []);
      setShopCount(json.data?.shopCount ?? 0);
      // If multi-shop without an active selection → push to chooser
      if (json.data?.needsChooser && pathname && !BYPASS.some((b) => pathname.startsWith(b))) {
        router.replace("/vendeur/choisir-boutique");
      }
    } finally {
      setLoading(false);
    }
  }, [pathname, router]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const switchShop = useCallback(
    async (shopId: string) => {
      const res = await fetch("/api/formations/vendeur/shops/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId }),
      });
      if (!res.ok) return;
      await refresh();
      router.refresh();
    },
    [refresh, router],
  );

  return (
    <ShopCtx.Provider value={{ loading, activeShop, shops, shopCount, refresh, switchShop }}>
      {children}
    </ShopCtx.Provider>
  );
}

export function useActiveShop() {
  return useContext(ShopCtx);
}
