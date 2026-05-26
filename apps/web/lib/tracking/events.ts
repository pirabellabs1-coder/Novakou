/**
 * Helpers de tracking — payloads normalisés pour le funnel acheteur.
 *
 * Owner : Tomás Ribeiro (Tracking Specialist)
 * Décidé en réunion 8 (vote 12) : centraliser les structures de payload
 * pour éviter que chaque page invente son schéma.
 *
 * Règle Amélie (vote 3) : aucune PII (email, téléphone, nom) dans metadata.
 */

import { tracker } from "./tracker";

/** Item minimal pour un événement panier / achat. */
export interface TrackedItem {
  id: string;
  kind?: "formation" | "product" | "bundle";
  price?: number;
  currency?: string;
  title?: string;
}

const DEFAULT_CURRENCY = "XOF";

function safeMeta(meta: Record<string, unknown> | undefined) {
  if (!meta) return undefined;
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (v == null) continue;
    // Block obvious PII keys
    if (/email|phone|telephone|firstname|lastname|address|password/i.test(k)) continue;
    clean[k] = v;
  }
  return clean;
}

export const trackEvents = {
  /** L'acheteur a vu une formation (déjà géré par TrackPageView, mais exposé ici pour usage manuel). */
  formationView(item: TrackedItem) {
    tracker.track("formation_view", {
      entityType: "formation",
      entityId: item.id,
      metadata: safeMeta({ price: item.price, currency: item.currency ?? DEFAULT_CURRENCY }),
    });
  },

  /** Clic CTA sur "Acheter" / "Ajouter au panier" / "S'inscrire". */
  ctaClick(item: TrackedItem, position?: string) {
    tracker.track("cta_click", {
      entityType: item.kind ?? "formation",
      entityId: item.id,
      metadata: safeMeta({
        price: item.price,
        currency: item.currency ?? DEFAULT_CURRENCY,
        position,
      }),
    });
  },

  /** Ajout au panier. */
  addToCart(item: TrackedItem) {
    tracker.track("add_to_cart", {
      entityType: item.kind ?? "formation",
      entityId: item.id,
      metadata: safeMeta({
        price: item.price,
        currency: item.currency ?? DEFAULT_CURRENCY,
        title: item.title,
      }),
    });
  },

  /** Retrait du panier. */
  removeFromCart(item: TrackedItem) {
    tracker.track("add_to_cart", {
      entityType: item.kind ?? "formation",
      entityId: item.id,
      metadata: safeMeta({
        action: "remove",
        price: item.price,
        currency: item.currency ?? DEFAULT_CURRENCY,
      }),
    });
  },

  /** L'acheteur arrive sur la page checkout. */
  checkoutStarted(input: { itemCount: number; total: number; currency?: string }) {
    tracker.track("checkout_started", {
      metadata: safeMeta({
        itemCount: input.itemCount,
        total: input.total,
        currency: input.currency ?? DEFAULT_CURRENCY,
      }),
    });
  },

  /** Achat confirmé — émis AVANT pixels tiers (décidé au vote 4). */
  purchase(input: {
    orderId?: string;
    total: number;
    itemCount: number;
    currency?: string;
    paymentMethod?: string;
    items?: TrackedItem[];
  }) {
    tracker.track("purchase", {
      metadata: safeMeta({
        orderId: input.orderId,
        total: input.total,
        itemCount: input.itemCount,
        currency: input.currency ?? DEFAULT_CURRENCY,
        paymentMethod: input.paymentMethod,
        itemIds: input.items?.map((i) => i.id).filter(Boolean),
      }),
    });
  },

  /** Recherche dans l'explorer (debounced côté appelant). */
  search(query: string, opts?: { resultsCount?: number; filters?: Record<string, unknown> }) {
    const q = query.trim();
    if (q.length < 2) return; // évite le bruit
    tracker.track("search", {
      metadata: safeMeta({
        query: q.slice(0, 80), // tronque pour éviter abus
        resultsCount: opts?.resultsCount,
        filters: opts?.filters,
      }),
    });
  },
};

/** Hook de debounce minimal pour la recherche — évite un import lourd. */
export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  ms = 600,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
