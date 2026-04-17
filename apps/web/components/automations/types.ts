// Shared types for automation workflow actions
// All configs are stored as JSON on AutomationWorkflow.actions

export type ActionType = "SEND_EMAIL" | "ADD_TAG" | "ENROLL_SEQUENCE" | "WEBHOOK" | "WAIT";

export interface BaseAction {
  id: string;
  type: ActionType;
}

// ─── SEND_EMAIL ───────────────────────────────────────────────
export interface EmailActionConfig {
  to: string; // e.g. "{{customer.email}}" or a specific address
  subject: string;
  body: string; // HTML from RichTextEditor
  fromName?: string;
  replyTo?: string;
  delayMinutes?: number; // 0 = immediate
}

export interface EmailAction extends BaseAction {
  type: "SEND_EMAIL";
  config: EmailActionConfig;
}

// ─── ADD_TAG ──────────────────────────────────────────────────
export type TagAudienceType = "all" | "buyers" | "prospects" | "product_buyers" | "custom";

export interface TagActionConfig {
  tagName: string;
  audienceType: TagAudienceType;
  productIds?: string[]; // when audienceType === "product_buyers"
  customFilter?: string; // free-form for audienceType === "custom"
}

export interface TagAction extends BaseAction {
  type: "ADD_TAG";
  config: TagActionConfig;
}

// ─── ENROLL_SEQUENCE ──────────────────────────────────────────
export interface SequenceActionConfig {
  sequenceId: string;
  sequenceName?: string; // cached for display
}

export interface SequenceAction extends BaseAction {
  type: "ENROLL_SEQUENCE";
  config: SequenceActionConfig;
}

// ─── WEBHOOK ──────────────────────────────────────────────────
export type WebhookMethod = "GET" | "POST" | "PUT";

export interface WebhookActionConfig {
  url: string;
  method: WebhookMethod;
  headers?: Array<{ key: string; value: string }>;
  selectedFields: string[]; // e.g. ["customer.firstName", "product.id"]
}

export interface WebhookAction extends BaseAction {
  type: "WEBHOOK";
  config: WebhookActionConfig;
}

// ─── WAIT ─────────────────────────────────────────────────────
export interface WaitActionConfig {
  hours: number;
}

export interface WaitAction extends BaseAction {
  type: "WAIT";
  config: WaitActionConfig;
}

export type WorkflowAction =
  | EmailAction
  | TagAction
  | SequenceAction
  | WebhookAction
  | WaitAction;

// ─── Dynamic variable hints ──────────────────────────────────
export const TEMPLATE_VARIABLES: Array<{ token: string; label: string }> = [
  { token: "{{customer.firstName}}", label: "Prénom du client" },
  { token: "{{customer.lastName}}", label: "Nom du client" },
  { token: "{{customer.email}}", label: "Email du client" },
  { token: "{{customer.phone}}", label: "Téléphone du client" },
  { token: "{{customer.country}}", label: "Pays du client" },
  { token: "{{product.id}}", label: "ID produit" },
  { token: "{{product.title}}", label: "Titre produit" },
  { token: "{{product.price}}", label: "Prix produit" },
  { token: "{{order.id}}", label: "ID commande" },
  { token: "{{order.total}}", label: "Total commande" },
  { token: "{{order.paidAt}}", label: "Date paiement" },
];

// Available data fields for webhook payloads
export const WEBHOOK_FIELDS: Array<{
  group: string;
  fields: Array<{ key: string; label: string; defaultOn?: boolean }>;
}> = [
  {
    group: "Client",
    fields: [
      { key: "customer.firstName", label: "Prénom", defaultOn: true },
      { key: "customer.lastName", label: "Nom", defaultOn: true },
      { key: "customer.email", label: "Email", defaultOn: true },
      { key: "customer.phone", label: "Téléphone" },
      { key: "customer.country", label: "Pays" },
      { key: "customer.locale", label: "Langue" },
    ],
  },
  {
    group: "Produit",
    fields: [
      { key: "product.id", label: "ID", defaultOn: true },
      { key: "product.title", label: "Titre", defaultOn: true },
      { key: "product.price", label: "Prix" },
      { key: "product.kind", label: "Type (formation/produit)" },
    ],
  },
  {
    group: "Commande",
    fields: [
      { key: "order.id", label: "ID", defaultOn: true },
      { key: "order.total", label: "Total" },
      { key: "order.currency", label: "Devise" },
      { key: "order.paidAt", label: "Date paiement" },
    ],
  },
];
