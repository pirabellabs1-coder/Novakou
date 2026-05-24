// Liste des événements webhook sortants supportés par Novakou.
//
// Pourquoi ici et pas dans la route ? Next.js 15 interdit les exports
// hors-handlers HTTP standards dans un fichier `route.ts` — sinon erreur
// TS2344 "does not satisfy the constraint '{ [x: string]: never; }'".

export type SupportedWebhookEvent =
  | "order.paid"
  | "order.refunded"
  | "review.created"
  | "withdrawal.processed"
  | "subscription.created"
  | "subscription.renewed"
  | "subscription.cancelled";

export const SUPPORTED_EVENTS: SupportedWebhookEvent[] = [
  "order.paid",
  "order.refunded",
  "review.created",
  "withdrawal.processed",
  "subscription.created",
  "subscription.renewed",
  "subscription.cancelled",
];

const SUPPORTED_EVENTS_SET = new Set<string>(SUPPORTED_EVENTS);

export function isSupportedWebhookEvent(value: string): value is SupportedWebhookEvent {
  return SUPPORTED_EVENTS_SET.has(value);
}
