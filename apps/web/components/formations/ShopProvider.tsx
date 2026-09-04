"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

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

/** Portée d'affichage : "all" = vue globale cumulée, ou l'id d'une boutique. */
export type ShopScope = "all" | string;

interface ShopContextValue {
  loading: boolean;
  activeShop: VendorShopSummary | null;
  shops: VendorShopSummary[];
  shopCount: number;
  /** Portée courante des pages vendeur : "all" (cumulé) ou un id de boutique. */
  scope: ShopScope;
  /** Change la portée d'affichage (et, pour une boutique, la cible d'écriture). */
  setScope: (scope: ShopScope) => Promise<void>;
  refresh: () => Promise<void>;
  switchShop: (shopId: string) => Promise<void>;
}

const ShopCtx = createContext<ShopContextValue>({
  loading: true,
  activeShop: null,
  shops: [],
  shopCount: 0,
  scope: "all",
  setScope: async () => {},
  refresh: async () => {},
  switchShop: async () => {},
});

/** Lit la portée courante depuis le cookie `nk_active_shop` (id boutique ou "all"). */
function readScopeCookie(): ShopScope {
  if (typeof document === "undefined") return "all";
  const m = document.cookie.match(/(?:^|;\s*)nk_active_shop=([^;]+)/);
  const v = m ? decodeURIComponent(m[1]) : "";
  return v || "all";
}

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [activeShop, setActiveShop] = useState<VendorShopSummary | null>(null);
  const [shops, setShops] = useState<VendorShopSummary[]>([]);
  const [shopCount, setShopCount] = useState(0);
  // Portée d'affichage — INITIALISÉE DEPUIS LE COOKIE : au rechargement complet,
  // on reste sur la boutique sélectionnée (sinon on retombait sur « Toutes »).
  // Absent → "all" (vue globale, l'atterrissage par défaut).
  const [scope, setScopeState] = useState<ShopScope>(() => readScopeCookie());

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
      const list: VendorShopSummary[] = json.data?.shops ?? [];
      setActiveShop(json.data?.activeShop ?? null);
      setShops(list);
      setShopCount(json.data?.shopCount ?? 0);
      // Garde-fou : si la portée pointe une boutique qui n'existe plus (supprimée,
      // cookie périmé), on retombe proprement sur la vue globale.
      setScopeState((prev) => (prev !== "all" && !list.some((s) => s.id === prev) ? "all" : prev));
      // Plus de redirection forcée vers le chooser : la vue globale ("all") est
      // le point d'entrée par défaut, même avec plusieurs boutiques.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Change la portée. Pour une boutique précise, on pose aussi le cookie
  // `nk_active_shop` (cible d'écriture : création de produit/lien, etc.). Pour
  // "all", le cookie reste sur la dernière boutique (une écriture a besoin d'une
  // vraie boutique). Dans tous les cas on invalide React Query → MAJ auto.
  const setScope = useCallback(
    async (next: ShopScope) => {
      setScopeState(next);
      // On pose TOUJOURS le cookie de portée (y compris « all ») : c'est lui qui
      // rend cumulées, côté serveur, toutes les pages vendeur qui lisent le
      // cookie — sans avoir à les modifier une par une. Pour une boutique
      // précise, le cookie sert aussi de cible d'écriture (création).
      await fetch("/api/formations/vendeur/shops/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId: next }),
      }).catch(() => null);
      await refresh();
      await queryClient.invalidateQueries();
      // Changer de boutique RAMÈNE à l'accueil du tableau de bord de la nouvelle
      // portée. Rester sur la page courante laissait des éléments de l'ancienne
      // boutique se mélanger (fetch en cours, listes non remontées) : on repart
      // d'un écran propre, entièrement re-rendu avec la nouvelle boutique.
      router.push("/vendeur/dashboard");
    },
    [refresh, router, queryClient],
  );

  // Compat : switchShop(shopId) = entrer dans une boutique.
  const switchShop = useCallback((shopId: string) => setScope(shopId), [setScope]);

  return (
    <ShopCtx.Provider value={{ loading, activeShop, shops, shopCount, scope, setScope, refresh, switchShop }}>
      {children}
    </ShopCtx.Provider>
  );
}

export function useActiveShop() {
  return useContext(ShopCtx);
}
