// Forwarde les événements de tracking internes Novakou vers Google Analytics 4
// (gtag) avec le mapping e-commerce standard GA4. Appelé à DEUX endroits :
//   - tracker.track()        → funnel (add_to_cart, begin_checkout, purchase, search…)
//   - <TrackPageView/>        → page_view (SPA, à chaque navigation) + view_item
//
// Pourquoi un point unique : avant, GA4 ne recevait QUE le page_view initial
// (App Router ne refire pas page_view sur navigation client) et AUCUN event
// e-commerce → rapports « Monétisation » vides. Tout passe désormais par ici.
//
// Respecte le Consent Mode v2 : si l'utilisateur a refusé, gtag est quand même
// défini (les pings sont alors cookieless / modélisés par GA). Aucune PII ici.

type Meta = Record<string, unknown> | undefined;

function gtag(...args: unknown[]): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as { gtag?: (...a: unknown[]) => void };
  if (typeof w.gtag === "function") w.gtag(...args);
}

const num = (v: unknown): number | undefined =>
  typeof v === "number" ? v : v != null && !Number.isNaN(Number(v)) ? Number(v) : undefined;
const str = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);

/** Types internes considérés comme une "vue produit" → GA4 `view_item`. */
const VIEW_ITEM_TYPES = new Set([
  "product_view",
  "formation_view",
  "service_viewed",
  "formation_viewed",
  "mentor_view",
  "shop_view",
]);

/**
 * Convertit un événement interne en événement GA4. No-op si gtag absent.
 * Ne lève jamais — le tracking ne doit jamais casser une page.
 */
export function forwardToGA4(type: string, entityId: string | undefined, meta: Meta): void {
  if (typeof window === "undefined") return;
  try {
    const m = meta ?? {};
    const currency = str(m.currency) || "XOF";

    if (type === "page_view") {
      gtag("event", "page_view", {
        page_location: window.location.href,
        page_path: window.location.pathname + window.location.search,
        page_title: typeof document !== "undefined" ? document.title : undefined,
      });
      return;
    }

    if (VIEW_ITEM_TYPES.has(type)) {
      gtag("event", "view_item", {
        currency,
        value: num(m.price),
        items: [{ item_id: entityId, item_name: str(m.title) }],
      });
      return;
    }

    switch (type) {
      case "purchase":
      case "order_completed": {
        const ids = Array.isArray(m.itemIds)
          ? (m.itemIds as string[])
          : entityId
          ? [entityId]
          : [];
        gtag("event", "purchase", {
          transaction_id: str(m.orderId) || str(m.transactionId) || undefined,
          value: num(m.total) ?? num(m.value) ?? 0,
          currency,
          items: ids.length ? ids.map((id) => ({ item_id: id })) : undefined,
        });
        break;
      }
      case "add_to_cart": {
        const isRemove = m.action === "remove";
        gtag("event", isRemove ? "remove_from_cart" : "add_to_cart", {
          currency,
          value: num(m.price),
          items: [
            { item_id: entityId, item_name: str(m.title), price: num(m.price), quantity: 1 },
          ],
        });
        break;
      }
      case "checkout_started":
        gtag("event", "begin_checkout", {
          currency,
          value: num(m.total),
        });
        break;
      case "cta_click":
        gtag("event", "select_item", {
          items: [{ item_id: entityId, item_name: str(m.title) }],
        });
        break;
      case "search":
        gtag("event", "search", { search_term: str(m.query) });
        break;
      case "sign_up":
        gtag("event", "sign_up", { method: str(m.method) || str(m.label) });
        break;
      case "sign_in":
        gtag("event", "login", { method: str(m.method) || str(m.label) });
        break;
      // Les autres types internes restent en base seulement (pas de bruit GA4).
      default:
        break;
    }
  } catch {
    /* tracking best-effort — ne jamais casser la page */
  }
}
