"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ChevronRight,
  Key,
  Webhook,
  Terminal,
  Braces,
  Check,
  Copy,
  ShieldAlert,
  Info,
  Gauge,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

type ParamRow = { name: string; type: string; required?: boolean; desc: string };

type Endpoint = {
  id: string;
  method: HttpMethod;
  path: string;
  group: "Produits" | "Commandes" | "Clients" | "Analytics" | "Webhooks";
  description: string;
  scopes: string[];
  query?: ParamRow[];
  body?: ParamRow[];
  response: string;
  curl: string;
  js: string;
};

// ─── Endpoints catalog (matches /app/api/v1/* routes) ─────────────────────

const BASE_URL = "https://novakou.com/api/v1";

const ENDPOINTS: Endpoint[] = [
  // ── Produits ──────────────────────────────────────────────────────────
  {
    id: "list-products",
    method: "GET",
    path: "/products",
    group: "Produits",
    description: "Liste vos produits (formations + produits digitaux fusionnés, triés par date de création).",
    scopes: ["read:products"],
    query: [
      { name: "page", type: "number", desc: "Numéro de page (défaut 1)." },
      { name: "limit", type: "number", desc: "Résultats par page (défaut 20, max 100)." },
      { name: "kind", type: "string", desc: "Filtrer : `formation` ou `product`." },
      { name: "status", type: "string", desc: "Filtrer : ACTIF, BROUILLON, ARCHIVE, EN_ATTENTE, REFUSE." },
    ],
    response: `{
  "data": [
    {
      "id": "clx123abc",
      "slug": "marketing-digital",
      "kind": "formation",
      "title": "Marketing Digital",
      "shortDesc": "Maîtrisez le marketing en ligne",
      "price": 45000,
      "originalPrice": 65000,
      "isFree": false,
      "status": "ACTIF",
      "thumbnail": "https://res.cloudinary.com/.../cover.jpg",
      "durationMin": 480,
      "studentsCount": 142,
      "rating": 4.8,
      "reviewsCount": 37,
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-04-20T14:30:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 42 }
}`,
    curl: `curl -X GET "${BASE_URL}/products?page=1&limit=20&status=ACTIF" \\
  -H "Authorization: Bearer nk_live_xxxxxxxx"`,
    js: `const res = await fetch("${BASE_URL}/products?status=ACTIF", {
  headers: { Authorization: "Bearer nk_live_xxxxxxxx" },
});
const { data, pagination } = await res.json();`,
  },
  {
    id: "get-product",
    method: "GET",
    path: "/products/:id",
    group: "Produits",
    description: "Détail d'un produit. L'identifiant peut être un cuid OU un slug.",
    scopes: ["read:products"],
    response: `{
  "data": {
    "id": "clx123abc",
    "slug": "marketing-digital",
    "kind": "formation",
    "title": "Marketing Digital",
    "shortDesc": "...",
    "description": "<p>HTML rich text…</p>",
    "price": 45000,
    "originalPrice": 65000,
    "isFree": false,
    "status": "ACTIF",
    "thumbnail": "https://...",
    "durationMin": 480,
    "category": { "id": "...", "slug": "marketing", "name": "Marketing" },
    "modules": 5,
    "lessons": 24,
    "curriculum": [
      { "id": "...", "title": "Module 1", "order": 0,
        "lessons": [ { "id": "...", "title": "Leçon 1", "type": "VIDEO", "duration": 12, "order": 0, "isFree": true } ]
      }
    ],
    "studentsCount": 142,
    "rating": 4.8,
    "reviewsCount": 37,
    "createdAt": "2026-01-15T10:00:00Z",
    "updatedAt": "2026-04-20T14:30:00Z"
  }
}`,
    curl: `curl -X GET "${BASE_URL}/products/marketing-digital" \\
  -H "Authorization: Bearer nk_live_xxxxxxxx"`,
    js: `const res = await fetch("${BASE_URL}/products/marketing-digital", {
  headers: { Authorization: "Bearer nk_live_xxxxxxxx" },
});
const { data } = await res.json();`,
  },
  {
    id: "create-product",
    method: "POST",
    path: "/products",
    group: "Produits",
    description: "Crée un nouveau produit (formation OU produit digital). Pour ajouter modules + leçons à une formation, utilisez l'éditeur de cours dans le dashboard après création.",
    scopes: ["write:products"],
    body: [
      { name: "kind", type: "string", required: true, desc: "`formation` ou `product`." },
      { name: "title", type: "string", required: true, desc: "Titre du produit (min 2 caractères)." },
      { name: "price", type: "number", required: true, desc: "Prix en FCFA (0 = gratuit)." },
      { name: "description", type: "string", desc: "Description longue (HTML autorisé)." },
      { name: "originalPrice", type: "number", desc: "Prix barré (pour afficher une réduction)." },
      { name: "categoryId", type: "string", desc: "ID de catégorie. Sinon « Divers »." },
      { name: "thumbnail", type: "string", desc: "URL de l'image de couverture." },
      { name: "productType", type: "string", desc: "Requis si kind=product. EBOOK, PDF, TEMPLATE, AUDIO, VIDEO, LICENCE, AUTRE." },
      { name: "fileUrl", type: "string", desc: "URL Supabase signée du fichier (pour produits digitaux)." },
      { name: "publish", type: "boolean", desc: "Si `true`, publie immédiatement (status ACTIF). Sinon BROUILLON." },
    ],
    response: `{
  "data": {
    "id": "clx456def",
    "slug": "marketing-digital",
    "title": "Marketing Digital",
    "kind": "formation",
    "status": "BROUILLON",
    "price": 45000,
    "createdAt": "2026-04-26T09:15:00Z"
  }
}`,
    curl: `curl -X POST "${BASE_URL}/products" \\
  -H "Authorization: Bearer nk_live_xxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "kind": "product",
    "title": "Guide SEO Africa",
    "price": 9900,
    "productType": "PDF",
    "description": "Le guide complet SEO pour le marché africain.",
    "publish": true
  }'`,
    js: `const res = await fetch("${BASE_URL}/products", {
  method: "POST",
  headers: {
    Authorization: "Bearer nk_live_xxxxxxxx",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    kind: "product",
    title: "Guide SEO Africa",
    price: 9900,
    productType: "PDF",
    publish: true,
  }),
});
const { data } = await res.json();`,
  },
  {
    id: "update-product",
    method: "PATCH",
    path: "/products/:id",
    group: "Produits",
    description: "Met à jour les champs modifiables d'un produit. Tous les champs sont optionnels — seuls ceux fournis sont modifiés.",
    scopes: ["write:products"],
    body: [
      { name: "title", type: "string", desc: "Nouveau titre." },
      { name: "description", type: "string", desc: "Description (envoyer `null` pour effacer)." },
      { name: "price", type: "number", desc: "Nouveau prix en FCFA." },
      { name: "originalPrice", type: "number", desc: "Prix barré." },
      { name: "status", type: "string", desc: "BROUILLON, ACTIF, ARCHIVE, EN_ATTENTE (et REFUSE pour produits digitaux)." },
      { name: "thumbnail", type: "string", desc: "Nouvelle URL de couverture." },
      { name: "productType", type: "string", desc: "Type (produits digitaux uniquement)." },
      { name: "fileUrl", type: "string", desc: "URL fichier (produits digitaux uniquement)." },
    ],
    response: `{
  "data": {
    "id": "clx456def",
    "slug": "guide-seo-africa",
    "title": "Guide SEO Africa Pro",
    "status": "ACTIF",
    "price": 14900,
    "kind": "product",
    "productType": "PDF",
    "updatedAt": "2026-04-26T11:42:00Z"
  }
}`,
    curl: `curl -X PATCH "${BASE_URL}/products/clx456def" \\
  -H "Authorization: Bearer nk_live_xxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{ "price": 14900, "title": "Guide SEO Africa Pro" }'`,
    js: `const res = await fetch("${BASE_URL}/products/clx456def", {
  method: "PATCH",
  headers: {
    Authorization: "Bearer nk_live_xxxxxxxx",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ price: 14900 }),
});
const { data } = await res.json();`,
  },
  {
    id: "delete-product",
    method: "DELETE",
    path: "/products/:id",
    group: "Produits",
    description: "Supprime définitivement un produit. Action irréversible.",
    scopes: ["write:products"],
    response: `{
  "data": { "id": "clx456def", "deleted": true }
}`,
    curl: `curl -X DELETE "${BASE_URL}/products/clx456def" \\
  -H "Authorization: Bearer nk_live_xxxxxxxx"`,
    js: `await fetch("${BASE_URL}/products/clx456def", {
  method: "DELETE",
  headers: { Authorization: "Bearer nk_live_xxxxxxxx" },
});`,
  },

  // ── Commandes ─────────────────────────────────────────────────────────
  {
    id: "list-orders",
    method: "GET",
    path: "/orders",
    group: "Commandes",
    description: "Liste les commandes (formations achetées + produits digitaux achetés), triées par date de création.",
    scopes: ["read:orders"],
    query: [
      { name: "page", type: "number", desc: "Numéro de page." },
      { name: "limit", type: "number", desc: "Résultats par page (max 100)." },
      { name: "kind", type: "string", desc: "`formation` ou `product`." },
      { name: "status", type: "string", desc: "`PAID` ou `REFUNDED` (formations uniquement)." },
      { name: "from", type: "string", desc: "Date début ISO 8601." },
      { name: "to", type: "string", desc: "Date fin ISO 8601." },
    ],
    response: `{
  "data": [
    {
      "id": "clx_enr_001",
      "kind": "formation",
      "productId": "clx123abc",
      "productSlug": "marketing-digital",
      "productTitle": "Marketing Digital",
      "buyer": { "id": "usr_...", "name": "Alice Dupont", "email": "alice@example.com" },
      "amount": 45000,
      "currency": "XOF",
      "status": "PAID",
      "progress": 35,
      "completedAt": null,
      "refundedAt": null,
      "createdAt": "2026-04-20T14:30:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 128 }
}`,
    curl: `curl -X GET "${BASE_URL}/orders?from=2026-04-01&to=2026-04-30" \\
  -H "Authorization: Bearer nk_live_xxxxxxxx"`,
    js: `const params = new URLSearchParams({ from: "2026-04-01", to: "2026-04-30" });
const res = await fetch(\`${BASE_URL}/orders?\${params}\`, {
  headers: { Authorization: "Bearer nk_live_xxxxxxxx" },
});
const { data, pagination } = await res.json();`,
  },
  {
    id: "get-order",
    method: "GET",
    path: "/orders/:id",
    group: "Commandes",
    description: "Détail complet d'une commande.",
    scopes: ["read:orders"],
    response: `{
  "data": {
    "id": "clx_enr_001",
    "kind": "formation",
    "productId": "clx123abc",
    "productSlug": "marketing-digital",
    "productTitle": "Marketing Digital",
    "buyer": { "id": "usr_...", "name": "Alice Dupont", "email": "alice@example.com" },
    "amount": 45000,
    "currency": "XOF",
    "status": "PAID",
    "progress": 35,
    "completedAt": null,
    "refundRequested": false,
    "refundReason": null,
    "refundedAt": null,
    "createdAt": "2026-04-20T14:30:00Z",
    "updatedAt": "2026-04-25T09:12:00Z"
  }
}`,
    curl: `curl -X GET "${BASE_URL}/orders/clx_enr_001" \\
  -H "Authorization: Bearer nk_live_xxxxxxxx"`,
    js: `const res = await fetch("${BASE_URL}/orders/clx_enr_001", {
  headers: { Authorization: "Bearer nk_live_xxxxxxxx" },
});
const { data } = await res.json();`,
  },
  {
    id: "update-order",
    method: "PATCH",
    path: "/orders/:id",
    group: "Commandes",
    description: "Initie un remboursement d'une formation. Marque la commande comme remboursée — le transfert d'argent reste manuel côté admin.",
    scopes: ["write:orders"],
    body: [
      { name: "action", type: "string", required: true, desc: "Doit valoir `refund`." },
      { name: "reason", type: "string", desc: "Motif (max 500 caractères)." },
    ],
    response: `{
  "data": {
    "id": "clx_enr_001",
    "kind": "formation",
    "status": "REFUNDED",
    "refundedAt": "2026-04-26T09:00:00Z",
    "refundReason": "Doublon de paiement"
  }
}`,
    curl: `curl -X PATCH "${BASE_URL}/orders/clx_enr_001" \\
  -H "Authorization: Bearer nk_live_xxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{ "action": "refund", "reason": "Doublon de paiement" }'`,
    js: `const res = await fetch("${BASE_URL}/orders/clx_enr_001", {
  method: "PATCH",
  headers: {
    Authorization: "Bearer nk_live_xxxxxxxx",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ action: "refund", reason: "Doublon de paiement" }),
});`,
  },

  // ── Clients ───────────────────────────────────────────────────────────
  {
    id: "list-customers",
    method: "GET",
    path: "/customers",
    group: "Clients",
    description: "Liste les clients (acheteurs uniques) avec leurs totaux cumulés. Un même client n'apparaît qu'une fois, même s'il a acheté plusieurs produits.",
    scopes: ["read:customers"],
    query: [
      { name: "page", type: "number", desc: "Numéro de page." },
      { name: "limit", type: "number", desc: "Résultats par page (max 100)." },
      { name: "search", type: "string", desc: "Recherche par nom OU email (insensible à la casse)." },
    ],
    response: `{
  "data": [
    {
      "id": "usr_abc",
      "name": "Alice Dupont",
      "email": "alice@example.com",
      "avatar": "https://...",
      "totalSpent": 135000,
      "ordersCount": 3,
      "firstPurchaseAt": "2026-02-10T09:00:00Z",
      "lastPurchaseAt": "2026-04-20T14:30:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 56 }
}`,
    curl: `curl -X GET "${BASE_URL}/customers?search=alice" \\
  -H "Authorization: Bearer nk_live_xxxxxxxx"`,
    js: `const res = await fetch("${BASE_URL}/customers?search=alice", {
  headers: { Authorization: "Bearer nk_live_xxxxxxxx" },
});
const { data, pagination } = await res.json();`,
  },
  {
    id: "get-customer",
    method: "GET",
    path: "/customers/:id",
    group: "Clients",
    description: "Détail d'un client + l'historique de ses achats auprès de votre boutique.",
    scopes: ["read:customers"],
    response: `{
  "data": {
    "id": "usr_abc",
    "name": "Alice Dupont",
    "email": "alice@example.com",
    "avatar": "https://...",
    "registeredAt": "2026-02-01T08:00:00Z",
    "totalSpent": 135000,
    "ordersCount": 3,
    "orders": [
      {
        "id": "clx_enr_001",
        "kind": "formation",
        "productId": "clx123abc",
        "productSlug": "marketing-digital",
        "productTitle": "Marketing Digital",
        "amount": 45000,
        "status": "PAID",
        "progress": 35,
        "completedAt": null,
        "createdAt": "2026-04-20T14:30:00Z"
      }
    ]
  }
}`,
    curl: `curl -X GET "${BASE_URL}/customers/usr_abc" \\
  -H "Authorization: Bearer nk_live_xxxxxxxx"`,
    js: `const res = await fetch("${BASE_URL}/customers/usr_abc", {
  headers: { Authorization: "Bearer nk_live_xxxxxxxx" },
});
const { data } = await res.json();`,
  },

  // ── Analytics ─────────────────────────────────────────────────────────
  {
    id: "analytics-revenue",
    method: "GET",
    path: "/analytics/revenue",
    group: "Analytics",
    description: "Statistiques de revenus sur une période, regroupées par jour, semaine ou mois.",
    scopes: ["read:analytics"],
    query: [
      { name: "from", type: "string", desc: "Date début ISO 8601 (défaut : il y a 30 jours)." },
      { name: "to", type: "string", desc: "Date fin ISO 8601 (défaut : aujourd'hui)." },
      { name: "groupBy", type: "string", desc: "`day` (défaut), `week` ou `month`." },
    ],
    response: `{
  "data": {
    "total": 2450000,
    "currency": "XOF",
    "orders": 54,
    "period": {
      "from": "2026-04-01T00:00:00.000Z",
      "to": "2026-04-30T23:59:59.999Z",
      "groupBy": "day"
    },
    "breakdown": [
      { "date": "2026-04-01", "revenue": 95000, "orders": 3 },
      { "date": "2026-04-02", "revenue": 180000, "orders": 5 }
    ]
  }
}`,
    curl: `curl -X GET "${BASE_URL}/analytics/revenue?from=2026-04-01&to=2026-04-30&groupBy=day" \\
  -H "Authorization: Bearer nk_live_xxxxxxxx"`,
    js: `const params = new URLSearchParams({
  from: "2026-04-01",
  to: "2026-04-30",
  groupBy: "day",
});
const res = await fetch(\`${BASE_URL}/analytics/revenue?\${params}\`, {
  headers: { Authorization: "Bearer nk_live_xxxxxxxx" },
});
const { data } = await res.json();`,
  },

  // ── Webhooks ──────────────────────────────────────────────────────────
  {
    id: "list-webhooks",
    method: "GET",
    path: "/webhooks",
    group: "Webhooks",
    description: "Liste les webhooks configurés sur votre boutique.",
    scopes: ["admin"],
    response: `{
  "data": {
    "webhooks": [
      {
        "id": "wh_abc",
        "url": "https://votre-app.com/novakou-webhook",
        "events": ["order.paid", "order.refunded"],
        "isActive": true,
        "lastFiredAt": "2026-04-25T10:30:00Z",
        "failureCount": 0,
        "createdAt": "2026-04-01T08:00:00Z"
      }
    ],
    "supportedEvents": [
      "order.paid", "order.refunded", "review.created",
      "withdrawal.processed", "subscription.created",
      "subscription.renewed", "subscription.cancelled"
    ]
  }
}`,
    curl: `curl -X GET "${BASE_URL}/webhooks" \\
  -H "Authorization: Bearer nk_live_xxxxxxxx"`,
    js: `const res = await fetch("${BASE_URL}/webhooks", {
  headers: { Authorization: "Bearer nk_live_xxxxxxxx" },
});
const { data } = await res.json();`,
  },
  {
    id: "create-webhook",
    method: "POST",
    path: "/webhooks",
    group: "Webhooks",
    description: "Crée un webhook. Le secret est généré automatiquement et retourné UNE SEULE FOIS — conservez-le pour vérifier les signatures HMAC.",
    scopes: ["admin"],
    body: [
      { name: "url", type: "string", required: true, desc: "URL HTTPS qui recevra les POST." },
      { name: "events", type: "string[]", required: true, desc: "Au moins 1 événement supporté." },
    ],
    response: `{
  "data": {
    "id": "wh_xyz",
    "url": "https://votre-app.com/novakou-webhook",
    "events": ["order.paid"],
    "isActive": true,
    "secret": "wh_e3a89...c4fd",
    "createdAt": "2026-04-26T09:00:00Z",
    "warning": "Conservez ce secret en sécurité — il ne sera plus jamais affiché."
  }
}`,
    curl: `curl -X POST "${BASE_URL}/webhooks" \\
  -H "Authorization: Bearer nk_live_xxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://votre-app.com/novakou-webhook",
    "events": ["order.paid", "order.refunded"]
  }'`,
    js: `const res = await fetch("${BASE_URL}/webhooks", {
  method: "POST",
  headers: {
    Authorization: "Bearer nk_live_xxxxxxxx",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    url: "https://votre-app.com/novakou-webhook",
    events: ["order.paid", "order.refunded"],
  }),
});
const { data } = await res.json();
// IMPORTANT : sauvegarder data.secret immédiatement, il ne sera plus affiché.`,
  },
  {
    id: "update-webhook",
    method: "PATCH",
    path: "/webhooks/:id",
    group: "Webhooks",
    description: "Met à jour un webhook existant.",
    scopes: ["admin"],
    body: [
      { name: "url", type: "string", desc: "Nouvelle URL." },
      { name: "events", type: "string[]", desc: "Liste d'événements." },
      { name: "isActive", type: "boolean", desc: "Activer ou désactiver." },
    ],
    response: `{
  "data": {
    "id": "wh_xyz",
    "url": "https://votre-app.com/novakou-webhook",
    "events": ["order.paid", "review.created"],
    "isActive": true,
    "updatedAt": "2026-04-26T11:00:00Z"
  }
}`,
    curl: `curl -X PATCH "${BASE_URL}/webhooks/wh_xyz" \\
  -H "Authorization: Bearer nk_live_xxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{ "isActive": false }'`,
    js: `await fetch("${BASE_URL}/webhooks/wh_xyz", {
  method: "PATCH",
  headers: {
    Authorization: "Bearer nk_live_xxxxxxxx",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ isActive: false }),
});`,
  },
  {
    id: "delete-webhook",
    method: "DELETE",
    path: "/webhooks/:id",
    group: "Webhooks",
    description: "Supprime un webhook.",
    scopes: ["admin"],
    response: `{ "data": { "id": "wh_xyz", "deleted": true } }`,
    curl: `curl -X DELETE "${BASE_URL}/webhooks/wh_xyz" \\
  -H "Authorization: Bearer nk_live_xxxxxxxx"`,
    js: `await fetch("${BASE_URL}/webhooks/wh_xyz", {
  method: "DELETE",
  headers: { Authorization: "Bearer nk_live_xxxxxxxx" },
});`,
  },
  {
    id: "test-webhook",
    method: "POST",
    path: "/webhooks/test",
    group: "Webhooks",
    description: "Envoie un événement test à un webhook configuré, signé via HMAC. Renvoie le statut HTTP de la livraison + la durée.",
    scopes: ["admin"],
    body: [
      { name: "webhookId", type: "string", required: true, desc: "ID du webhook à tester." },
      { name: "event", type: "string", desc: "Type d'événement (défaut `order.paid`)." },
    ],
    response: `{
  "data": {
    "success": true,
    "delivery": {
      "statusCode": 200,
      "duration": 142,
      "url": "https://votre-app.com/novakou-webhook",
      "signed": true
    },
    "payloadSent": {
      "event": "order.paid",
      "isTest": true,
      "timestamp": "2026-04-26T09:00:00.000Z",
      "data": { "orderId": "ord_test_xyz", "amount": 45000, "currency": "XOF" }
    }
  }
}`,
    curl: `curl -X POST "${BASE_URL}/webhooks/test" \\
  -H "Authorization: Bearer nk_live_xxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{ "webhookId": "wh_xyz", "event": "order.paid" }'`,
    js: `const res = await fetch("${BASE_URL}/webhooks/test", {
  method: "POST",
  headers: {
    Authorization: "Bearer nk_live_xxxxxxxx",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ webhookId: "wh_xyz", event: "order.paid" }),
});
const { data } = await res.json();`,
  },
];

const SCOPES = [
  { scope: "read:products", desc: "Lire la liste et les détails de vos produits." },
  { scope: "write:products", desc: "Créer, modifier et supprimer des produits." },
  { scope: "read:orders", desc: "Lire les commandes et leur statut." },
  { scope: "write:orders", desc: "Initier des remboursements sur les commandes." },
  { scope: "read:customers", desc: "Lire les informations de vos clients." },
  { scope: "write:customers", desc: "(Réservé pour usage futur — non utilisé actuellement.)" },
  { scope: "read:analytics", desc: "Accéder aux statistiques et rapports." },
  { scope: "admin", desc: "Accès complet, y compris gestion des webhooks." },
];

const WEBHOOK_EVENTS = [
  { event: "order.paid", desc: "Achat confirmé (enrollment ou purchase créé)." },
  { event: "order.refunded", desc: "Remboursement approuvé par admin." },
  { event: "review.created", desc: "Nouvel avis sur un de vos produits." },
  { event: "withdrawal.processed", desc: "Retrait traité (TRAITE ou REFUSE)." },
  { event: "subscription.created", desc: "(V2) Nouvel abonnement actif." },
  { event: "subscription.renewed", desc: "(V2) Renouvellement réussi." },
  { event: "subscription.cancelled", desc: "(V2) Abonnement annulé." },
];

const ERROR_CODES = [
  { code: "200", label: "OK", desc: "Requête réussie.", color: "bg-emerald-50 text-emerald-700" },
  { code: "201", label: "Created", desc: "Ressource créée avec succès.", color: "bg-emerald-50 text-emerald-700" },
  { code: "400", label: "Bad Request", desc: "Paramètres manquants ou invalides (`INVALID_PARAMS`).", color: "bg-amber-50 text-amber-700" },
  { code: "401", label: "Unauthorized", desc: "Clé API manquante, invalide ou révoquée (`INVALID_API_KEY`).", color: "bg-red-50 text-red-700" },
  { code: "403", label: "Forbidden", desc: "Scope insuffisant (`MISSING_SCOPE`).", color: "bg-red-50 text-red-700" },
  { code: "404", label: "Not Found", desc: "Ressource introuvable (`NOT_FOUND`).", color: "bg-gray-50 text-gray-700" },
  { code: "429", label: "Too Many Requests", desc: "Limite de requêtes atteinte (`RATE_LIMITED`).", color: "bg-orange-50 text-orange-700" },
  { code: "500", label: "Server Error", desc: "Erreur interne — contactez le support (`SERVER_ERROR`).", color: "bg-red-50 text-red-700" },
];

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: "bg-emerald-100 text-emerald-800",
  POST: "bg-blue-100 text-blue-800",
  PATCH: "bg-amber-100 text-amber-800",
  DELETE: "bg-red-100 text-red-800",
};

// ─── UI ───────────────────────────────────────────────────────────────────

export default function DocumentationApiPage() {
  const [activeTab, setActiveTab] = useState<
    "endpoints" | "auth" | "webhooks" | "errors"
  >("endpoints");
  const [activeEndpointId, setActiveEndpointId] = useState(ENDPOINTS[0].id);

  const grouped = useMemo(() => {
    const map = new Map<Endpoint["group"], Endpoint[]>();
    for (const ep of ENDPOINTS) {
      const arr = map.get(ep.group) ?? [];
      arr.push(ep);
      map.set(ep.group, arr);
    }
    return [...map.entries()];
  }, []);

  const activeEndpoint =
    ENDPOINTS.find((ep) => ep.id === activeEndpointId) ?? ENDPOINTS[0];

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#5c647a] mb-2">
        <Link
          href="/vendeur/dashboard"
          className="hover:text-[#006e2f] transition-colors"
        >
          Espace vendeur
        </Link>
        <ChevronRight size={14} />
        <span className="text-[#191c1e] font-medium">Documentation API</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">
            Documentation API
          </h1>
          <p className="text-sm text-[#5c647a] mt-1 max-w-xl">
            Référence complète de l&apos;API Novakou pour intégrer votre boutique
            à vos outils. {ENDPOINTS.length} endpoints, authentifiés par clé API.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/vendeur/api-keys"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-[#191c1e] hover:bg-gray-50"
          >
            <Key size={18} />
            Mes clés API
          </Link>
          <Link
            href="/vendeur/webhooks"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-[#191c1e] hover:bg-gray-50"
          >
            <Webhook size={18} />
            Webhooks
          </Link>
        </div>
      </div>

      {/* Base URL banner */}
      <div className="bg-zinc-900 text-white rounded-2xl p-5 mb-6">
        <div className="flex items-start gap-3">
          <Terminal size={20} className="text-emerald-400 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
              Base URL
            </p>
            <code className="text-sm tabular-nums text-emerald-400 break-all">
              {BASE_URL}
            </code>
            <p className="text-xs text-zinc-500 mt-2">
              Toutes les requêtes doivent inclure l&apos;en-tête{" "}
              <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">
                Authorization: Bearer nk_live_xxx
              </code>
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
        {(["endpoints", "auth", "webhooks", "errors"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab
                ? "border-[#006e2f] text-[#006e2f]"
                : "border-transparent text-[#5c647a] hover:text-[#191c1e]"
            }`}
          >
            {tab === "endpoints" && "Endpoints"}
            {tab === "auth" && "Authentification"}
            {tab === "webhooks" && "Webhooks"}
            {tab === "errors" && "Codes d'erreur"}
          </button>
        ))}
      </div>

      {/* Endpoints tab */}
      {activeTab === "endpoints" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {grouped.map(([group, eps]) => (
                <div key={group}>
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#5c647a]">
                      {group}
                    </p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {eps.map((ep) => (
                      <button
                        key={ep.id}
                        onClick={() => setActiveEndpointId(ep.id)}
                        className={`w-full text-left px-4 py-3 transition-colors ${
                          activeEndpointId === ep.id
                            ? "bg-[#006e2f]/5"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${METHOD_COLORS[ep.method]}`}
                          >
                            {ep.method}
                          </span>
                          <code className="text-xs tabular-nums text-[#191c1e] truncate">
                            {ep.path}
                          </code>
                        </div>
                        <p className="text-[11px] text-[#5c647a] line-clamp-2">
                          {ep.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detail */}
          <div className="lg:col-span-8 space-y-4">
            <EndpointDetail endpoint={activeEndpoint} />
          </div>
        </div>
      )}

      {/* Auth tab */}
      {activeTab === "auth" && <AuthTab />}

      {/* Webhooks tab */}
      {activeTab === "webhooks" && <WebhooksTab />}

      {/* Errors tab */}
      {activeTab === "errors" && <ErrorsTab />}
    </div>
  );
}

// ─── EndpointDetail ───────────────────────────────────────────────────────

function EndpointDetail({ endpoint }: { endpoint: Endpoint }) {
  const [codeTab, setCodeTab] = useState<"curl" | "js">("curl");

  return (
    <>
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-3">
          <span
            className={`text-xs font-bold px-2 py-1 rounded ${METHOD_COLORS[endpoint.method]}`}
          >
            {endpoint.method}
          </span>
          <code className="text-sm tabular-nums font-bold text-[#191c1e]">
            {endpoint.path}
          </code>
        </div>
        <p className="text-sm text-[#5c647a] leading-relaxed">
          {endpoint.description}
        </p>
        <div className="flex gap-1.5 mt-3">
          {endpoint.scopes.map((s) => (
            <span
              key={s}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Query params */}
      {endpoint.query && endpoint.query.length > 0 && (
        <ParamsTable
          title="Query parameters"
          rows={endpoint.query}
        />
      )}

      {/* Body params */}
      {endpoint.body && endpoint.body.length > 0 && (
        <ParamsTable title="Body" rows={endpoint.body} />
      )}

      {/* Code examples */}
      <div className="bg-zinc-900 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-1 border-b border-zinc-800 px-3 pt-2">
          {(["curl", "js"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setCodeTab(tab)}
              className={`px-3 py-2 text-[11px] font-bold uppercase tracking-widest transition-colors ${
                codeTab === tab
                  ? "text-emerald-400 border-b-2 border-emerald-400"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab === "curl" ? "cURL" : "JavaScript (fetch)"}
            </button>
          ))}
          <div className="flex-1" />
          <CopyButton text={codeTab === "curl" ? endpoint.curl : endpoint.js} />
        </div>
        <pre className="p-5 text-xs text-emerald-400 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
          {codeTab === "curl" ? endpoint.curl : endpoint.js}
        </pre>
      </div>

      {/* Response */}
      <div className="bg-zinc-900 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-700 flex items-center gap-2">
          <Braces size={14} className="text-zinc-400" />
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            Réponse exemple
          </p>
          <div className="flex-1" />
          <CopyButton text={endpoint.response} />
        </div>
        <pre className="p-5 text-xs text-emerald-400 overflow-x-auto tabular-nums leading-relaxed">
          {endpoint.response}
        </pre>
      </div>
    </>
  );
}

function ParamsTable({
  title,
  rows,
}: {
  title: string;
  rows: ParamRow[];
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#5c647a]">
          {title}
        </p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left px-5 py-2 text-[10px] font-bold text-[#5c647a] uppercase">
              Nom
            </th>
            <th className="text-left px-5 py-2 text-[10px] font-bold text-[#5c647a] uppercase">
              Type
            </th>
            <th className="text-left px-5 py-2 text-[10px] font-bold text-[#5c647a] uppercase">
              Description
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.name} className="border-b border-gray-50 last:border-0">
              <td className="px-5 py-2">
                <code className="text-xs font-bold text-[#191c1e] bg-gray-50 px-1.5 py-0.5 rounded">
                  {p.name}
                </code>
                {p.required && (
                  <span className="ml-1.5 text-[9px] font-bold uppercase tracking-widest text-red-600">
                    requis
                  </span>
                )}
              </td>
              <td className="px-5 py-2 text-xs text-[#5c647a]">{p.type}</td>
              <td className="px-5 py-2 text-xs text-[#5c647a] leading-relaxed">
                {p.desc}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* ignore */
        }
      }}
      className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-emerald-400 transition-colors"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? "Copié" : "Copier"}
    </button>
  );
}

// ─── Auth tab ─────────────────────────────────────────────────────────────

function AuthTab() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-bold text-[#191c1e]">
          Authentification par clé API
        </h2>
        <p className="text-sm text-[#5c647a] leading-relaxed">
          Chaque requête vers l&apos;API Novakou doit inclure votre clé API dans
          l&apos;en-tête HTTP{" "}
          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs mx-1">
            Authorization
          </code>
          . Générez vos clés depuis{" "}
          <Link
            href="/vendeur/api-keys"
            className="text-[#006e2f] font-semibold hover:underline"
          >
            Mes clés API
          </Link>
          . Chaque clé porte un ensemble de scopes — donnez à chaque intégration
          le minimum nécessaire.
        </p>

        <div className="bg-zinc-900 rounded-xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
            Format des clés
          </p>
          <pre className="text-xs text-emerald-400">
            {`nk_live_<48 caractères hex>     # production
nk_test_<48 caractères hex>     # tests (réservé)`}
          </pre>
        </div>

        <div className="bg-zinc-900 rounded-xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
            Exemple cURL
          </p>
          <pre className="text-xs text-emerald-400 overflow-x-auto whitespace-pre-wrap">
            {`curl -X GET ${BASE_URL}/products \\
  -H "Authorization: Bearer nk_live_xxxxxxxx" \\
  -H "Content-Type: application/json"`}
          </pre>
        </div>

        <div className="bg-zinc-900 rounded-xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
            Exemple JavaScript (fetch)
          </p>
          <pre className="text-xs text-emerald-400 overflow-x-auto whitespace-pre-wrap">
            {`const res = await fetch("${BASE_URL}/products", {
  headers: {
    Authorization: \`Bearer \${process.env.NOVAKOU_API_KEY}\`,
    "Content-Type": "application/json",
  },
});

const { data, pagination } = await res.json();`}
          </pre>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-bold text-[#191c1e]">Scopes (permissions)</h2>
        <p className="text-sm text-[#5c647a]">
          Chaque clé porte une liste de scopes qui limitent les actions
          autorisées. Le scope <code className="text-xs bg-gray-100 px-1 rounded">admin</code>{" "}
          accorde tous les autres.
        </p>
        <div className="space-y-2">
          {SCOPES.map((s) => (
            <div
              key={s.scope}
              className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0"
            >
              <code className="text-xs font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full flex-shrink-0">
                {s.scope}
              </code>
              <p className="text-sm text-[#5c647a]">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <ShieldAlert size={20} className="text-amber-600 mt-0.5" />
        <div className="text-sm text-amber-900">
          <p className="font-bold">Sécurité</p>
          <p className="text-xs mt-1 leading-relaxed">
            Ne partagez jamais votre clé API. Ne l&apos;incluez pas dans du code
            frontend ou des dépôts publics. Utilisez des variables
            d&apos;environnement côté serveur uniquement. Si une clé fuit,
            révoquez-la immédiatement depuis votre dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Webhooks tab ─────────────────────────────────────────────────────────

function WebhooksTab() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-bold text-[#191c1e]">Webhooks</h2>
        <p className="text-sm text-[#5c647a] leading-relaxed">
          Les webhooks envoient une requête HTTP POST à votre serveur lorsqu&apos;un
          événement se produit dans votre boutique. Configurez-les via{" "}
          <Link
            href="/vendeur/webhooks"
            className="text-[#006e2f] font-semibold hover:underline"
          >
            Paramètres &gt; Webhooks
          </Link>{" "}
          ou via{" "}
          <code className="text-xs bg-gray-100 px-1 rounded">POST /v1/webhooks</code>.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#5c647a]">
            Événements disponibles
          </p>
        </div>
        <div className="divide-y divide-gray-50">
          {WEBHOOK_EVENTS.map((ev) => (
            <div
              key={ev.event}
              className="px-5 py-3 flex items-center gap-3"
            >
              <code className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded flex-shrink-0">
                {ev.event}
              </code>
              <p className="text-sm text-[#5c647a]">{ev.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-zinc-900 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-700">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            Exemple de payload (POST envoyé à votre URL)
          </p>
        </div>
        <pre className="p-5 text-xs text-emerald-400 overflow-x-auto tabular-nums leading-relaxed">
          {`POST /votre-endpoint HTTP/1.1
Content-Type: application/json
User-Agent: Novakou-Webhook/1.0
X-Novakou-Signature: 7a8e9f...c4fd

{
  "event": "order.paid",
  "timestamp": "2026-04-25T14:30:00Z",
  "data": {
    "orderId": "ord_abc123",
    "productId": "clx...",
    "productTitle": "Marketing Digital",
    "buyerEmail": "alice@example.com",
    "amount": 45000,
    "currency": "XOF"
  }
}`}
        </pre>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-bold text-[#191c1e]">
          Vérifier la signature HMAC
        </h2>
        <p className="text-sm text-[#5c647a] leading-relaxed">
          Chaque webhook est signé avec votre secret en HMAC-SHA256. Calculez la
          signature côté serveur et comparez-la au header{" "}
          <code className="text-xs bg-gray-100 px-1 rounded">
            X-Novakou-Signature
          </code>{" "}
          pour vérifier l&apos;origine.
        </p>

        <div className="bg-zinc-900 rounded-xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
            Node.js (Express)
          </p>
          <pre className="text-xs text-emerald-400 overflow-x-auto whitespace-pre-wrap">
            {`import crypto from "crypto";
import express from "express";

const app = express();
const WEBHOOK_SECRET = process.env.NOVAKOU_WEBHOOK_SECRET;

app.post("/novakou-webhook",
  express.raw({ type: "application/json" }), // raw body required
  (req, res) => {
    const signature = req.header("x-novakou-signature");
    const expected = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(req.body)
      .digest("hex");

    if (signature !== expected) {
      return res.status(401).send("Invalid signature");
    }

    const event = JSON.parse(req.body.toString());
    console.log("Reçu :", event.event, event.data);

    res.status(200).send("OK"); // répondre 2xx en moins de 10s
  });`}
          </pre>
        </div>

        <div className="bg-zinc-900 rounded-xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
            Next.js App Router
          </p>
          <pre className="text-xs text-emerald-400 overflow-x-auto whitespace-pre-wrap">
            {`import crypto from "crypto";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-novakou-signature");
  const expected = crypto
    .createHmac("sha256", process.env.NOVAKOU_WEBHOOK_SECRET!)
    .update(raw)
    .digest("hex");

  if (signature !== expected) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(raw);
  // ... traiter l'événement
  return NextResponse.json({ ok: true });
}`}
          </pre>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Info size={20} className="text-blue-600 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-bold">Bonnes pratiques</p>
          <ul className="text-xs mt-1 space-y-1 list-disc pl-4 leading-relaxed">
            <li>
              Répondez avec un statut <strong>2xx</strong> en moins de 10
              secondes — sinon le webhook est marqué en échec et son compteur de
              failures augmente.
            </li>
            <li>
              Implémentez l&apos;idempotence : un même événement peut être livré
              plusieurs fois en cas de retry.
            </li>
            <li>
              Si plusieurs livraisons échouent successivement, désactivez votre
              webhook puis réactivez-le après correction.
            </li>
            <li>
              Utilisez{" "}
              <code className="bg-white px-1 py-0.5 rounded mx-1">
                POST /v1/webhooks/test
              </code>{" "}
              pour tester votre endpoint sans attendre un vrai événement.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── Errors tab ───────────────────────────────────────────────────────────

function ErrorsTab() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#5c647a]">
            Codes HTTP
          </p>
        </div>
        <div className="divide-y divide-gray-50">
          {ERROR_CODES.map((err) => (
            <div
              key={err.code}
              className="px-5 py-3 flex items-center gap-3"
            >
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded tabular-nums ${err.color}`}
              >
                {err.code}
              </span>
              <span className="text-sm font-bold text-[#191c1e] w-32">
                {err.label}
              </span>
              <p className="text-sm text-[#5c647a] flex-1">{err.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-zinc-900 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-700">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            Format d&apos;erreur
          </p>
        </div>
        <pre className="p-5 text-xs text-red-400 overflow-x-auto tabular-nums leading-relaxed">
          {`{
  "error": {
    "code": "MISSING_SCOPE",
    "message": "Permission manquante : write:products. Générez une nouvelle clé avec ce scope depuis votre dashboard.",
    "status": 403,
    "requiredScope": "write:products"
  }
}`}
        </pre>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-bold text-[#191c1e]">Codes d&apos;erreur</h2>
        <div className="space-y-2">
          {[
            {
              code: "INVALID_API_KEY",
              desc: "La clé API est manquante, invalide, révoquée ou expirée.",
            },
            {
              code: "MISSING_SCOPE",
              desc: "Votre clé n'a pas le scope requis pour cette action. La réponse inclut le champ `requiredScope`.",
            },
            {
              code: "INVALID_PARAMS",
              desc: "Un ou plusieurs paramètres sont manquants, mal formés ou hors-bornes.",
            },
            {
              code: "NOT_FOUND",
              desc: "La ressource demandée n'existe pas, ou ne vous appartient pas.",
            },
            {
              code: "RATE_LIMITED",
              desc: "Vous avez dépassé la limite de requêtes par minute.",
            },
            {
              code: "SERVER_ERROR",
              desc: "Erreur interne. Réessayez ou contactez le support si elle persiste.",
            },
          ].map((e) => (
            <div
              key={e.code}
              className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0"
            >
              <code className="text-xs font-bold bg-red-50 text-red-700 px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap">
                {e.code}
              </code>
              <p className="text-sm text-[#5c647a]">{e.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Gauge size={20} className="text-blue-600 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-bold">Rate Limiting</p>
          <p className="text-xs mt-1 leading-relaxed">
            L&apos;API est limitée à 100 requêtes par minute par clé. Les
            en-têtes
            <code className="bg-white px-1 py-0.5 rounded mx-1">
              X-RateLimit-Remaining
            </code>{" "}
            et
            <code className="bg-white px-1 py-0.5 rounded mx-1">
              X-RateLimit-Reset
            </code>{" "}
            seront ajoutés à chaque réponse dans une prochaine version.
          </p>
        </div>
      </div>
    </div>
  );
}
