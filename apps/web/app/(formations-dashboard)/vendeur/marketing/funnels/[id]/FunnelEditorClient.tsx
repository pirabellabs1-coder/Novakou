"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MediaUpload } from "@/components/funnels/MediaUpload";
import { IconPicker } from "@/components/funnels/IconPicker";
import { ColorPicker, ColumnPicker } from "@/components/funnels/ColorPicker";
import { BackgroundPicker } from "@/components/funnels/BackgroundPicker";
import { ConfirmModal } from "@/components/funnels/ConfirmModal";
import { TemplatePreviewMockup } from "@/components/funnels/TemplatePreviewMockup";
import { LANDING_TEMPLATES } from "@/lib/funnels/templates";
import { confirmAction } from "@/store/confirm";
import DndBlockCanvas from "@/components/funnels/DndBlockCanvas";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════
type BlockType =
  // Containers
  | "row" | "section" | "content-box"
  // Atomic content
  | "heading" | "text" | "image" | "button" | "icon-box" | "divider" | "spacer" | "list" | "html"
  // Media
  | "video" | "image-gallery"
  // Product picker (pulls from vendor catalog)
  | "product"
  // Ready-made sections
  | "hero" | "features" | "countdown" | "testimonials" | "faq" | "cta" | "stats" | "pricing"
  // Conversion & Trust
  | "scarcity" | "guarantee" | "logo-bar" | "alert" | "social-proof" | "comparison" | "floating-cta";

interface Block {
  id: string;
  type: BlockType;
  data: Record<string, unknown>;
}

interface Step {
  id: string;
  stepOrder: number;
  stepType: string;
  title: string;
  headlineFr: string | null;
  descriptionFr: string | null;
  ctaTextFr: string | null;
  formationId: string | null;
  productId: string | null;
  discountPct: number | null;
  blocks: Block[] | null;
  views: number;
  conversions: number;
}

interface Theme {
  primaryColor: string;
  accentColor: string;
  textColor: string;
  bgColor: string;
  font: string;
  logoUrl?: string;
}

interface Funnel {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  totalViews: number;
  totalConversions: number;
  totalRevenue: number;
  theme: Theme | null;
  steps: Step[];
  salesLimit: number | null;
  salesCount: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// BLOCK TEMPLATES + PALETTE CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════
type BlockTpl = { label: string; icon: string; default: Record<string, unknown>; atomic?: boolean };

const BLOCK_TEMPLATES: Record<BlockType, BlockTpl> = {
  // ─── Containers ─────────────────────────────────────────────────────────
  row: {
    label: "Rangée",
    icon: "view_column",
    default: {
      columns: [{ blocks: [] }, { blocks: [] }],
      gap: 16,
      bgColor: "",
      padding: 24,
    },
  },
  section: {
    label: "Section",
    icon: "dashboard",
    default: {
      blocks: [] as Block[],
      bgColor: "",
      bgImage: "",
      paddingY: 64,
      paddingX: 16,
      maxWidth: 1152,
      textColor: "",
    },
  },
  "content-box": {
    label: "Boîte de contenu",
    icon: "call_to_action",
    default: {
      blocks: [] as Block[],
      bgColor: "#ffffff",
      borderColor: "#e5e7eb",
      borderWidth: 1,
      radius: 16,
      padding: 24,
      shadow: "md",
    },
  },
  // ─── Atomic content ─────────────────────────────────────────────────────
  heading: {
    label: "Titre",
    icon: "title",
    atomic: true,
    default: { content: "Votre titre ici", level: 2, align: "left", color: "" },
  },
  text: {
    label: "Texte",
    icon: "format_paragraph",
    atomic: true,
    default: { content: "Écrivez votre texte ici. Décrivez ce que vous offrez de manière claire et concise.", align: "left", size: 16, color: "" },
  },
  image: {
    label: "Image",
    icon: "image",
    atomic: true,
    default: { url: "", alt: "", align: "center", radius: 12, width: "auto" },
  },
  button: {
    label: "Bouton",
    icon: "smart_button",
    atomic: true,
    default: {
      text: "Cliquez ici",
      link: "",
      linkType: "external",  // external | step | anchor
      style: "primary",       // primary | secondary | outline
      size: "md",              // sm | md | lg
      align: "center",
      bgColor: "",
      textColor: "",
      fullWidth: false,
      icon: "",
    },
  },
  "icon-box": {
    label: "Boîte à icône",
    icon: "inventory_2",
    atomic: true,
    default: { icon: "verified", title: "Un atout clé", desc: "Une brève description.", align: "center", color: "" },
  },
  divider: {
    label: "Ligne horizontale",
    icon: "horizontal_rule",
    atomic: true,
    default: { style: "solid", color: "#e5e7eb", thickness: 1, width: 100 },
  },
  spacer: {
    label: "Espace",
    icon: "height",
    atomic: true,
    default: { height: 32 },
  },
  list: {
    label: "Liste à puces",
    icon: "checklist",
    atomic: true,
    default: {
      items: ["Premier élément de la liste", "Deuxième élément", "Troisième élément"],
      icon: "check_circle",
      color: "",
    },
  },
  html: {
    label: "Code HTML",
    icon: "code",
    atomic: true,
    default: { html: "<p>Votre HTML personnalisé</p>" },
  },
  product: {
    label: "Produit / Formation",
    icon: "shopping_bag",
    atomic: true,
    default: {
      kind: "",          // "formation" | "product"
      id: "",             // selected item id
      layout: "card",    // card | hero | compact
      showImage: true,
      showRating: true,
      showPrice: true,
      showCount: true,
      showDescription: true,
      ctaText: "Acheter maintenant",
      ctaIcon: "shopping_cart",
      bgColor: "#ffffff",
      textColor: "",
      accentColor: "",
      align: "center",
    },
  },
  // ─── Media ──────────────────────────────────────────────────────────────
  video: {
    label: "Vidéo",
    icon: "play_circle",
    atomic: true,
    default: { externalUrl: "", caption: "" },
  },
  // ─── Ready-made sections ────────────────────────────────────────────────
  hero: {
    label: "Hero / Bannière",
    icon: "view_carousel",
    default: {
      badge: "Nouveau",
      headline: "Votre titre accrocheur ici",
      subheadline: "Un sous-titre qui décrit la valeur unique de votre offre.",
      ctaText: "Je découvre",
      ctaLink: "",
      imageUrl: "",
      bgColor: "",
      textColor: "",
    },
  },
  features: {
    label: "Liste de bénéfices",
    icon: "check_circle",
    default: {
      title: "Ce que vous obtenez",
      columns: 3,
      items: [
        { icon: "check_circle", title: "Bénéfice 1", desc: "Description courte." },
        { icon: "rocket_launch", title: "Bénéfice 2", desc: "Description courte." },
        { icon: "support_agent", title: "Bénéfice 3", desc: "Description courte." },
      ],
    },
  },
  countdown: {
    label: "Compteur urgence",
    icon: "timer",
    default: {
      title: "Offre limitée — fin dans :",
      endsInHours: 48,
      subtitle: "Après cette date, le prix passera au tarif normal.",
      mode: "duration" as "duration" | "fixed_date" | "per_visitor",
      endsAt: "",
      durationMinutes: 30,
      expiredBehavior: "text" as "hide" | "text" | "redirect",
      expiredText: "Cette offre a expiré.",
      expiredRedirect: "",
      bgColor: "",
      textColor: "",
      size: "md" as "sm" | "md" | "lg",
    },
  },
  testimonials: {
    label: "Témoignages",
    icon: "format_quote",
    default: {
      title: "Ils en parlent mieux que nous",
      columns: 2,
      items: [{ name: "Prénom Nom", role: "Métier · Ville", text: "Un témoignage authentique.", rating: 5 }],
    },
  },
  faq: {
    label: "FAQ",
    icon: "help",
    default: { title: "Questions fréquentes", items: [{ q: "Une question fréquente ?", a: "Réponse claire et rassurante." }] },
  },
  cta: {
    label: "Appel à l'action",
    icon: "ads_click",
    default: { headline: "Prêt à passer à l'action ?", subheadline: "Rejoignez la communauté maintenant.", ctaText: "Commencer", ctaLink: "" },
  },
  stats: {
    label: "Statistiques",
    icon: "monitoring",
    default: {
      title: "",
      subtitle: "",
      columns: 3,
      bgColor: "",
      valueColor: "",
      items: [
        { value: "10 000", prefix: "", suffix: "+", label: "Apprenants formés", icon: "group" },
        { value: "4.9", prefix: "", suffix: "/5", label: "Note moyenne", icon: "star" },
        { value: "98", prefix: "", suffix: "%", label: "Recommandent", icon: "thumb_up" },
      ],
    },
  },
  pricing: {
    label: "Pricing",
    icon: "sell",
    default: {
      title: "Investissement",
      price: 25000,
      originalPrice: 50000,
      currency: "FCFA",
      benefits: ["Accès à vie", "Mises à jour incluses", "Certificat"],
      benefitIcon: "check_circle",
      ctaText: "Acheter maintenant",
      ctaLink: "",
      badgeText: "",       // e.g. "LE PLUS POPULAIRE"
      badgeColor: "",
      guaranteeText: "",   // e.g. "Garantie 14 jours satisfait ou remboursé"
      accentColor: "",
    },
  },
  scarcity: {
    label: "Rareté / Limite",
    icon: "local_fire_department",
    default: {
      text: "Plus que {remaining} places disponibles !",
      urgentThreshold: 5,
      showProgressBar: true,
      barColor: "",
      textColor: "",
      emptyText: "COMPLET — inscriptions fermées",
      style: "banner" as "banner" | "badge" | "inline",
    },
  },
  guarantee: {
    label: "Badge garantie",
    icon: "verified_user",
    default: {
      icon: "verified_user",
      title: "Garantie 14 jours",
      text: "Satisfait ou remboursé, sans condition. Testez sans risque.",
      style: "card" as "card" | "banner" | "minimal",
      accentColor: "",
    },
  },
  "logo-bar": {
    label: "Barre de logos",
    icon: "corporate_fare",
    default: {
      title: "Ils nous font confiance",
      items: [
        { label: "Orange Money", icon: "account_balance_wallet" },
        { label: "Wave", icon: "payments" },
        { label: "Visa", icon: "credit_card" },
        { label: "Mastercard", icon: "credit_card" },
        { label: "SSL", icon: "lock" },
      ],
      style: "icons" as "icons" | "text" | "images",
      bgColor: "",
      grayscale: true,
    },
  },
  alert: {
    label: "Alerte / Bannière",
    icon: "campaign",
    default: {
      text: "Offre flash : -50% pendant 24h seulement !",
      variant: "warning" as "info" | "success" | "warning" | "danger",
      icon: "campaign",
      dismissible: false,
    },
  },
  "social-proof": {
    label: "Preuve sociale",
    icon: "group",
    default: {
      style: "live" as "live" | "counter" | "recent",
      liveText: "{count} personnes regardent cette page",
      liveCount: 12,
      liveVariance: 5,
      counterItems: [
        { value: "2 847", label: "Clients satisfaits", icon: "group" },
        { value: "4.9/5", label: "Note moyenne", icon: "star" },
        { value: "98%", label: "Recommandent", icon: "thumb_up" },
      ],
      recentItems: [
        { name: "Aminata D.", city: "Dakar", action: "vient d'acheter", time: "il y a 3 min" },
        { name: "Kouakou K.", city: "Abidjan", action: "vient d'acheter", time: "il y a 7 min" },
      ],
      accentColor: "",
    },
  },
  comparison: {
    label: "Tableau comparatif",
    icon: "compare",
    default: {
      title: "Pourquoi nous choisir ?",
      columns: ["Sans nous", "Avec nous"],
      rows: [
        { label: "Résultats", values: ["Incertains", "Garantis"] },
        { label: "Support", values: ["Aucun", "24/7"] },
        { label: "Communauté", values: ["Seul(e)", "1000+ membres"] },
      ],
      highlightColumn: 1,
      accentColor: "",
    },
  },
  "floating-cta": {
    label: "CTA flottant",
    icon: "vertical_align_bottom",
    default: {
      text: "Profitez de l'offre maintenant",
      buttonText: "Commander",
      buttonLink: "",
      showPrice: true,
      price: "25 000 FCFA",
      originalPrice: "50 000 FCFA",
      bgColor: "",
      position: "bottom" as "bottom" | "top",
    },
  },
  "image-gallery": {
    label: "Galerie d'images",
    icon: "photo_library",
    atomic: true,
    default: {
      images: [
        { url: "", alt: "Image 1", caption: "" },
        { url: "", alt: "Image 2", caption: "" },
        { url: "", alt: "Image 3", caption: "" },
      ],
      columns: 3,
      gap: 8,
      radius: 12,
      lightbox: true,
    },
  },
};

// PaletteKey = either a BlockType or a preset (row with N columns)
type PaletteKey = BlockType | "row-1" | "row-2" | "row-3" | "row-4";

type PaletteItem = { key: PaletteKey; label: string; icon: string };

const PALETTE_CATEGORIES: Array<{ label: string; icon: string; items: PaletteItem[] }> = [
  {
    label: "Mise en page", icon: "dashboard", items: [
      { key: "row-1", label: "Rangée (1 col)", icon: "table_rows" },
      { key: "row-2", label: "2 colonnes", icon: "view_column_2" },
      { key: "row-3", label: "3 colonnes", icon: "view_column" },
      { key: "row-4", label: "4 colonnes", icon: "grid_view" },
      { key: "section", label: "Section", icon: "dashboard" },
      { key: "content-box", label: "Boîte de contenu", icon: "call_to_action" },
    ],
  },
  {
    label: "Contenu", icon: "article", items: [
      { key: "heading", label: "Titre", icon: "title" },
      { key: "text", label: "Texte", icon: "format_paragraph" },
      { key: "list", label: "Liste à puces", icon: "checklist" },
      { key: "icon-box", label: "Boîte à icône", icon: "inventory_2" },
      { key: "divider", label: "Ligne", icon: "horizontal_rule" },
      { key: "spacer", label: "Espace", icon: "height" },
    ],
  },
  {
    label: "Média", icon: "perm_media", items: [
      { key: "image", label: "Image", icon: "image" },
      { key: "video", label: "Vidéo", icon: "play_circle" },
      { key: "image-gallery", label: "Galerie", icon: "photo_library" },
    ],
  },
  {
    label: "Conversion", icon: "ads_click", items: [
      { key: "button", label: "Bouton", icon: "smart_button" },
      { key: "product", label: "Produit / Formation", icon: "shopping_bag" },
      { key: "scarcity", label: "Rareté / Limite", icon: "local_fire_department" },
      { key: "guarantee", label: "Garantie", icon: "verified_user" },
      { key: "floating-cta", label: "CTA flottant", icon: "vertical_align_bottom" },
      { key: "alert", label: "Alerte / Bannière", icon: "campaign" },
    ],
  },
  {
    label: "Sections prêtes", icon: "auto_awesome", items: [
      { key: "hero", label: "Hero / Bannière", icon: "view_carousel" },
      { key: "features", label: "Bénéfices", icon: "check_circle" },
      { key: "stats", label: "Statistiques", icon: "monitoring" },
      { key: "testimonials", label: "Témoignages", icon: "format_quote" },
      { key: "faq", label: "FAQ", icon: "help" },
      { key: "countdown", label: "Countdown", icon: "timer" },
      { key: "cta", label: "Appel à l'action", icon: "ads_click" },
      { key: "pricing", label: "Pricing", icon: "sell" },
      { key: "comparison", label: "Comparatif", icon: "compare" },
    ],
  },
  {
    label: "Confiance", icon: "verified", items: [
      { key: "logo-bar", label: "Barre de logos", icon: "corporate_fare" },
      { key: "social-proof", label: "Preuve sociale", icon: "group" },
    ],
  },
  { label: "Avancé", icon: "code", items: [{ key: "html", label: "Code HTML", icon: "code" }] },
];

// Which palette keys are allowed inside a column (no infinite nesting: no row/section inside column)
const COLUMN_ALLOWED_KEYS: PaletteKey[] = [
  "heading", "text", "image", "button", "icon-box", "divider", "spacer", "list", "video", "html", "product", "content-box",
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════
function newBlockId() {
  return `b-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function createBlock(type: BlockType): Block {
  const tpl = BLOCK_TEMPLATES[type];
  // Deep clone default so nested arrays/objects aren't shared
  return { id: newBlockId(), type, data: JSON.parse(JSON.stringify(tpl.default)) };
}

// Convert a PaletteKey (may include row-N shortcuts) into a Block
function createFromPaletteKey(key: PaletteKey): Block {
  if (key === "row-1" || key === "row-2" || key === "row-3" || key === "row-4") {
    const cols = Number(key.split("-")[1]);
    const block = createBlock("row");
    block.data.columns = Array.from({ length: cols }, () => ({ blocks: [] as Block[] }));
    return block;
  }
  return createBlock(key as BlockType);
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP TYPES — Purpose, colors, advice, default templates
// ═══════════════════════════════════════════════════════════════════════════
type StepInfo = {
  icon: string;
  color: string;
  bgTint: string;
  title: string;
  subtitle: string;
  advice: string;
  templateLabel: string;
};

const STEP_INFO: Record<string, StepInfo> = {
  LANDING: {
    icon: "rocket_launch",
    color: "#006e2f",
    bgTint: "#006e2f0D",
    title: "Page de vente publique",
    subtitle: "C'est là où les visiteurs arrivent depuis vos pubs, emails, réseaux sociaux",
    advice: "Construisez une page qui convainc d'acheter : titre accrocheur, bénéfices clairs, preuve sociale (témoignages), pricing, FAQ. Les boutons d'achat redirigent automatiquement vers le checkout.",
    templateLabel: "Template page de vente complète",
  },
  PRODUCT: {
    icon: "credit_card",
    color: "#2563eb",
    bgTint: "#2563eb0D",
    title: "Checkout (paiement)",
    subtitle: "Le paiement est géré par la plateforme — cette étape est optionnelle",
    advice: "Les visiteurs seront automatiquement redirigés vers /formations/checkout pour payer. Vous pouvez laisser cette étape VIDE, ou ajouter du contenu de rassurance (badges sécurité, garantie) affiché avant le paiement.",
    templateLabel: "Template page de rassurance pré-paiement",
  },
  UPSELL: {
    icon: "local_offer",
    color: "#f59e0b",
    bgTint: "#f59e0b0D",
    title: "Offre complémentaire (upsell)",
    subtitle: "Après paiement, avant la page Merci — propose un add-on en 1 clic",
    advice: "Proposez UN produit complémentaire avec une remise (-30% à -50%). Le client a déjà payé, ajouter plus est facile. Utilisez : un titre urgent + bloc Produit + 2 boutons clairs (OUI j'ajoute / Non merci). Peut augmenter votre panier moyen de 20-40%.",
    templateLabel: "Template offre upsell urgente",
  },
  THANK_YOU: {
    icon: "celebration",
    color: "#8b5cf6",
    bgTint: "#8b5cf60D",
    title: "Page de remerciement",
    subtitle: "Après l'achat confirmé — rassure le client et guide la suite",
    advice: "Confirmez le paiement, expliquez comment accéder au produit (email, compte), proposez la suite (formation suivante, communauté, avis). Un bon Thank You améliore l'expérience et réduit les demandes de remboursement.",
    templateLabel: "Template page de remerciement",
  },
};

function getStepTemplate(stepType: string): Block[] {
  switch (stepType) {
    case "LANDING":
      return [createBlock("hero"), createBlock("features"), createBlock("stats"), createBlock("testimonials"), createBlock("pricing"), createBlock("faq"), createBlock("cta")];
    case "PRODUCT":
      return [
        { id: newBlockId(), type: "heading", data: { content: "Vous allez être redirigé vers le paiement sécurisé", level: 2, align: "center", color: "" } },
        { id: newBlockId(), type: "spacer", data: { height: 16 } },
        { id: newBlockId(), type: "row", data: { columns: [
          { blocks: [{ id: newBlockId(), type: "icon-box", data: { icon: "verified_user", title: "Paiement sécurisé", desc: "Cryptage SSL 256-bit. Vos données bancaires ne sont jamais stockées.", align: "center", color: "#2563eb" } }] },
          { blocks: [{ id: newBlockId(), type: "icon-box", data: { icon: "lock", title: "Accès immédiat", desc: "Dès la confirmation du paiement, votre contenu est débloqué.", align: "center", color: "#2563eb" } }] },
          { blocks: [{ id: newBlockId(), type: "icon-box", data: { icon: "local_atm", title: "Garantie 14 jours", desc: "Satisfait ou remboursé sans condition pendant 14 jours.", align: "center", color: "#2563eb" } }] },
        ], gap: 16, padding: 24, bgColor: "" } },
      ];
    case "UPSELL":
      return [
        { id: newBlockId(), type: "heading", data: { content: "🎁 ATTENDEZ ! Une offre unique pour vous", level: 1, align: "center", color: "#f59e0b" } },
        { id: newBlockId(), type: "text", data: { content: "Avant de finaliser, profitez de cette offre disponible UNIQUEMENT sur cette page :", align: "center", size: 18, color: "" } },
        { id: newBlockId(), type: "product", data: { kind: "", id: "", layout: "hero", showImage: true, showRating: true, showPrice: true, showCount: true, showDescription: true, ctaText: "OUI, j'ajoute à ma commande", ctaIcon: "shopping_cart", bgColor: "", textColor: "", accentColor: "#f59e0b", align: "center" } },
        { id: newBlockId(), type: "countdown", data: { title: "Cette offre expire dans :", endsInHours: 1, subtitle: "Après cela, le prix revient à son tarif normal." } },
        { id: newBlockId(), type: "button", data: { text: "Non merci, continuer sans cette offre", link: "", linkType: "external", style: "secondary", size: "sm", align: "center", bgColor: "", textColor: "#6b7280", fullWidth: false, icon: "" } },
      ];
    case "THANK_YOU":
      return [
        { id: newBlockId(), type: "icon-box", data: { icon: "celebration", title: "Merci pour votre achat !", desc: "Votre commande est confirmée. Un email récapitulatif vient de vous être envoyé.", align: "center", color: "#22c55e" } },
        { id: newBlockId(), type: "heading", data: { content: "Comment accéder à votre contenu", level: 2, align: "center", color: "" } },
        { id: newBlockId(), type: "list", data: { items: ["Vérifiez votre boîte mail (et vos spams) — un email de confirmation vous attend", "Connectez-vous à votre compte Novakou", "Retrouvez votre achat dans la section Mes formations / Mes achats", "Commencez votre formation dès maintenant !"], icon: "check_circle", color: "#22c55e" } },
        { id: newBlockId(), type: "cta", data: { headline: "Accédez à votre espace", subheadline: "Tous vos achats et formations au même endroit", ctaText: "Accéder à mon espace", ctaLink: "/acheteur/mes-achats" } },
      ];
    default:
      return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// INPUT PRIMITIVES
// ═══════════════════════════════════════════════════════════════════════════
function StringInput({ label, value, onChange, multiline, placeholder }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-[#5c647a] uppercase tracking-wider mb-1">{label}</label>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} placeholder={placeholder}
          className="w-full text-sm text-[#191c1e] placeholder-gray-400 bg-white px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f] resize-none" />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full text-sm text-[#191c1e] placeholder-gray-400 bg-white px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f]" />
      )}
    </div>
  );
}

function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-[#5c647a] uppercase tracking-wider mb-1">{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="w-full text-sm text-[#191c1e] bg-white px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f]" />
    </div>
  );
}

function SelectInput<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: Array<{ value: T; label: string }>; onChange: (v: T) => void }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-[#5c647a] uppercase tracking-wider mb-1">{label}</label>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
        {options.map((o) => (
          <button key={o.value} onClick={() => onChange(o.value)}
            className={`px-2 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${value === o.value ? "border-[#006e2f] bg-[#006e2f]/5 text-[#006e2f]" : "border-gray-200 bg-white text-[#5c647a] hover:border-gray-300"}`}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ListEditor<T extends Record<string, unknown>>({ label, items, template, onChange, renderItem }: { label: string; items: T[]; template: T; onChange: (items: T[]) => void; renderItem: (item: T, update: (patch: Partial<T>) => void) => React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-[#5c647a] uppercase tracking-wider mb-2">{label}</label>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-[#5c647a]">#{i + 1}</span>
              <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-700">
                <span className="material-symbols-outlined text-[16px]">delete</span>
              </button>
            </div>
            {renderItem(item, (patch) => { const updated = [...items]; updated[i] = { ...item, ...patch }; onChange(updated); })}
          </div>
        ))}
        <button onClick={() => onChange([...items, { ...template }])}
          className="w-full px-3 py-2 rounded-xl border-2 border-dashed border-gray-300 text-xs font-semibold text-[#5c647a] hover:border-[#006e2f] hover:text-[#006e2f] transition-colors">
          + Ajouter
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PALETTE MODAL
// ═══════════════════════════════════════════════════════════════════════════
function PalettePicker({ onPick, onClose, allowed }: { onPick: (key: PaletteKey) => void; onClose: () => void; allowed?: PaletteKey[] }) {
  const categories = allowed
    ? PALETTE_CATEGORIES.map((cat) => ({ ...cat, items: cat.items.filter((it) => allowed.includes(it.key)) })).filter((cat) => cat.items.length > 0)
    : PALETTE_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-7 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-[#191c1e]">Ajouter un élément</h2>
            <p className="text-xs text-[#5c647a] mt-0.5">Cliquez pour insérer.</p>
          </div>
          <button onClick={onClose} className="text-[#5c647a] hover:text-[#191c1e] p-1">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="overflow-y-auto px-7 py-5 space-y-6">
          {categories.map((cat) => (
            <div key={cat.label}>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="material-symbols-outlined text-[#006e2f] text-[16px]">{cat.icon}</span>
                <h3 className="text-xs font-bold text-[#5c647a] uppercase tracking-wider">{cat.label}</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                {cat.items.map((item) => (
                  <button key={item.key} onClick={() => onPick(item.key)}
                    className="bg-[#f7f9fb] rounded-2xl p-3 text-left hover:bg-[#006e2f]/5 hover:ring-2 hover:ring-[#006e2f]/30 transition-all group">
                    <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center mb-2 group-hover:bg-[#006e2f]/10 transition-colors">
                      <span className="material-symbols-outlined text-[#006e2f] text-[18px]">{item.icon}</span>
                    </div>
                    <p className="text-xs font-bold text-[#191c1e] leading-tight">{item.label}</p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ATOMIC BLOCK EDITORS
// ═══════════════════════════════════════════════════════════════════════════
const ALIGN_OPTS = [{ value: "left" as const, label: "Gauche" }, { value: "center" as const, label: "Centre" }, { value: "right" as const, label: "Droite" }];

function renderAtomicEditor(block: Block, update: (data: Record<string, unknown>) => void) {
  switch (block.type) {
    case "heading":
      return (
        <div className="space-y-2.5">
          <StringInput label="Texte du titre" value={(block.data.content as string) ?? ""} onChange={(v) => update({ content: v })} />
          <div className="grid grid-cols-2 gap-2">
            <SelectInput label="Niveau" value={((block.data.level as number) ?? 2).toString()} options={[{ value: "1", label: "H1" }, { value: "2", label: "H2" }, { value: "3", label: "H3" }]} onChange={(v) => update({ level: Number(v) })} />
            <SelectInput label="Alignement" value={(block.data.align as string) ?? "left"} options={ALIGN_OPTS} onChange={(v) => update({ align: v })} />
          </div>
          <ColorPicker label="Couleur" value={(block.data.color as string) ?? null} onChange={(c) => update({ color: c })} />
          <BackgroundPicker label="Dégradé texte (optionnel)" value={(block.data.gradient as string) ?? null} onChange={(g) => update({ gradient: g })} />
        </div>
      );
    case "text":
      return (
        <div className="space-y-2.5">
          <StringInput label="Contenu" value={(block.data.content as string) ?? ""} onChange={(v) => update({ content: v })} multiline />
          <div className="grid grid-cols-2 gap-2">
            <SelectInput label="Alignement" value={(block.data.align as string) ?? "left"} options={ALIGN_OPTS} onChange={(v) => update({ align: v })} />
            <NumberInput label="Taille (px)" value={(block.data.size as number) ?? 16} onChange={(v) => update({ size: v })} />
          </div>
          <ColorPicker label="Couleur" value={(block.data.color as string) ?? null} onChange={(c) => update({ color: c })} />
        </div>
      );
    case "image":
      return (
        <div className="space-y-2.5">
          <MediaUpload label="Image" value={(block.data.url as string) ?? null} onChange={(url) => update({ url })} accept="image" aspectRatio="auto" />
          <StringInput label="Texte alternatif (SEO)" value={(block.data.alt as string) ?? ""} onChange={(v) => update({ alt: v })} />
          <div className="grid grid-cols-2 gap-2">
            <SelectInput label="Alignement" value={(block.data.align as string) ?? "center"} options={ALIGN_OPTS} onChange={(v) => update({ align: v })} />
            <NumberInput label="Arrondi (px)" value={(block.data.radius as number) ?? 12} onChange={(v) => update({ radius: v })} />
          </div>
        </div>
      );
    case "button":
      return (
        <div className="space-y-2.5">
          <StringInput label="Texte du bouton" value={(block.data.text as string) ?? ""} onChange={(v) => update({ text: v })} />
          <StringInput label="Lien (URL de destination) *" value={(block.data.link as string) ?? ""} onChange={(v) => update({ link: v })} placeholder="https://... ou /formations/explorer" />
          <p className="text-[10px] text-[#5c647a] -mt-1.5">URL externe, interne (commence par /), ou #ancre-sur-cette-page</p>
          <div>
            <label className="block text-[10px] font-semibold text-[#5c647a] uppercase tracking-wider mb-1">Icône (optionnel)</label>
            <IconPicker value={(block.data.icon as string) ?? ""} onChange={(ic) => update({ icon: ic })} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <SelectInput label="Style" value={(block.data.style as string) ?? "primary"} options={[{ value: "primary", label: "Plein" }, { value: "outline", label: "Contour" }, { value: "secondary", label: "Secondaire" }]} onChange={(v) => update({ style: v })} />
            <SelectInput label="Taille" value={(block.data.size as string) ?? "md"} options={[{ value: "sm", label: "S" }, { value: "md", label: "M" }, { value: "lg", label: "L" }]} onChange={(v) => update({ size: v })} />
            <SelectInput label="Align" value={(block.data.align as string) ?? "center"} options={ALIGN_OPTS} onChange={(v) => update({ align: v })} />
          </div>
          <BackgroundPicker label="Arrière-plan du bouton" value={(block.data.bgColor as string) ?? null} onChange={(c) => update({ bgColor: c })} />
          <ColorPicker label="Couleur du texte" value={(block.data.textColor as string) ?? null} onChange={(c) => update({ textColor: c })} />
          <label className="flex items-center gap-2 text-xs text-[#191c1e] font-semibold cursor-pointer">
            <input type="checkbox" checked={Boolean(block.data.fullWidth)} onChange={(e) => update({ fullWidth: e.target.checked })} className="w-4 h-4 accent-[#006e2f]" />
            Largeur maximale
          </label>
        </div>
      );
    case "icon-box":
      return (
        <div className="space-y-2.5">
          <div>
            <label className="block text-[10px] font-semibold text-[#5c647a] uppercase tracking-wider mb-1">Icône</label>
            <IconPicker value={(block.data.icon as string) ?? "verified"} onChange={(ic) => update({ icon: ic })} />
          </div>
          <StringInput label="Titre" value={(block.data.title as string) ?? ""} onChange={(v) => update({ title: v })} />
          <StringInput label="Description" value={(block.data.desc as string) ?? ""} onChange={(v) => update({ desc: v })} multiline />
          <div className="grid grid-cols-2 gap-2">
            <SelectInput label="Alignement" value={(block.data.align as string) ?? "center"} options={ALIGN_OPTS} onChange={(v) => update({ align: v })} />
            <ColorPicker label="Couleur icône" value={(block.data.color as string) ?? null} onChange={(c) => update({ color: c })} />
          </div>
        </div>
      );
    case "divider":
      return (
        <div className="space-y-2.5">
          <SelectInput label="Style" value={(block.data.shape as string) ?? "line"} options={[
            { value: "line", label: "Ligne" },
            { value: "wave", label: "Vague" },
            { value: "angle", label: "Angle" },
            { value: "curve", label: "Courbe" },
          ]} onChange={(v) => update({ shape: v })} />
          {((block.data.shape as string) ?? "line") === "line" && (
            <div className="grid grid-cols-2 gap-2">
              <NumberInput label="Épaisseur (px)" value={(block.data.thickness as number) ?? 1} onChange={(v) => update({ thickness: v })} />
              <NumberInput label="Largeur (%)" value={(block.data.width as number) ?? 100} onChange={(v) => update({ width: v })} />
            </div>
          )}
          {((block.data.shape as string) ?? "line") !== "line" && (
            <NumberInput label="Hauteur (px)" value={(block.data.height as number) ?? 60} onChange={(v) => update({ height: v })} />
          )}
          <ColorPicker label="Couleur" value={(block.data.color as string) ?? "#e5e7eb"} onChange={(c) => update({ color: c ?? "#e5e7eb" })} />
          <div className="flex items-center gap-3">
            <label className="text-[10px] font-semibold text-[#5c647a] uppercase tracking-wider">Inverser</label>
            <button onClick={() => update({ flip: !block.data.flip })}
              className={`w-9 h-5 rounded-full transition-colors relative ${block.data.flip ? "bg-[#006e2f]" : "bg-gray-300"}`}>
              <span className={`block w-4 h-4 rounded-full bg-white shadow absolute top-0.5 transition-all ${block.data.flip ? "left-4" : "left-0.5"}`} />
            </button>
          </div>
        </div>
      );
    case "spacer":
      return <NumberInput label="Hauteur (px)" value={(block.data.height as number) ?? 32} onChange={(v) => update({ height: v })} />;
    case "list":
      return (
        <div className="space-y-2.5">
          <div>
            <label className="block text-[10px] font-semibold text-[#5c647a] uppercase tracking-wider mb-1">Icône de puce</label>
            <IconPicker value={(block.data.icon as string) ?? "check_circle"} onChange={(ic) => update({ icon: ic })} />
          </div>
          <ColorPicker label="Couleur icône" value={(block.data.color as string) ?? null} onChange={(c) => update({ color: c })} />
          <ListEditor
            label="Éléments"
            items={((block.data.items as string[]) ?? []).map((s) => ({ text: s }))}
            template={{ text: "Nouvel élément" }}
            onChange={(items) => update({ items: items.map((i) => i.text) })}
            renderItem={(item, patch) => <StringInput label="Texte" value={item.text} onChange={(v) => patch({ text: v })} />}
          />
        </div>
      );
    case "html":
      return <StringInput label="Code HTML" value={(block.data.html as string) ?? ""} onChange={(v) => update({ html: v })} multiline />;
    case "video":
      return (
        <div className="space-y-2.5">
          <StringInput label="Lien vidéo (YouTube, Vimeo, ou MP4)" value={(block.data.externalUrl as string) ?? ""} onChange={(v) => update({ externalUrl: v })} placeholder="https://www.youtube.com/watch?v=..." />
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-[10px] text-blue-800">
            <span className="material-symbols-outlined text-[12px] align-text-top mr-1">info</span>
            Formats acceptés : YouTube, Vimeo, ou lien direct .mp4/.webm
          </div>
          <StringInput label="Légende (optionnel)" value={(block.data.caption as string) ?? ""} onChange={(v) => update({ caption: v })} />
        </div>
      );
    case "product":
      return <ProductEditor block={block} update={update} />;
    default:
      return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION BLOCK EDITORS (ready-made)
// ═══════════════════════════════════════════════════════════════════════════
function renderSectionEditor(block: Block, update: (data: Record<string, unknown>) => void) {
  switch (block.type) {
    case "hero":
      return (
        <div className="space-y-3">
          <StringInput label="Badge" value={(block.data.badge as string) ?? ""} onChange={(v) => update({ badge: v })} />
          <StringInput label="Titre principal" value={(block.data.headline as string) ?? ""} onChange={(v) => update({ headline: v })} />
          <StringInput label="Sous-titre" value={(block.data.subheadline as string) ?? ""} onChange={(v) => update({ subheadline: v })} multiline />
          <StringInput label="Texte du bouton" value={(block.data.ctaText as string) ?? ""} onChange={(v) => update({ ctaText: v })} />
          <StringInput label="Lien du bouton" value={(block.data.ctaLink as string) ?? ""} onChange={(v) => update({ ctaLink: v })} placeholder="Laissez vide pour utiliser le checkout par défaut" />
          <MediaUpload label="Image du hero (optionnel)" value={(block.data.imageUrl as string) ?? null} onChange={(url) => update({ imageUrl: url })} accept="image" aspectRatio="landscape" />
          <BackgroundPicker label="Arrière-plan du hero" value={(block.data.bgColor as string) ?? null} onChange={(c) => update({ bgColor: c })} />
          <ColorPicker label="Couleur du texte" value={(block.data.textColor as string) ?? null} onChange={(c) => update({ textColor: c })} />
        </div>
      );
    case "features":
      return (
        <div className="space-y-3">
          <StringInput label="Titre de section" value={(block.data.title as string) ?? ""} onChange={(v) => update({ title: v })} />
          <ColumnPicker value={(block.data.columns as number) ?? 3} onChange={(cols) => update({ columns: cols })} options={[1, 2, 3, 4]} />
          <ListEditor
            label="Bénéfices"
            items={(block.data.items as Array<{ icon: string; title: string; desc: string }>) ?? []}
            template={{ icon: "check_circle", title: "Bénéfice", desc: "Description" }}
            onChange={(items) => update({ items })}
            renderItem={(item, patch) => (
              <div className="space-y-2">
                <div>
                  <label className="block text-[10px] font-semibold text-[#5c647a] uppercase tracking-wider mb-1">Icône</label>
                  <IconPicker value={item.icon} onChange={(ic) => patch({ icon: ic })} />
                </div>
                <StringInput label="Titre" value={item.title} onChange={(v) => patch({ title: v })} />
                <StringInput label="Description" value={item.desc} onChange={(v) => patch({ desc: v })} />
              </div>
            )}
          />
        </div>
      );
    case "countdown": {
      const cdMode = (block.data.mode as string) ?? "duration";
      const cdExpired = (block.data.expiredBehavior as string) ?? "text";
      return (
        <div className="space-y-3">
          <StringInput label="Titre" value={(block.data.title as string) ?? ""} onChange={(v) => update({ title: v })} />
          <SelectInput label="Mode" value={cdMode} options={[
            { value: "duration", label: "Durée fixe" },
            { value: "fixed_date", label: "Date précise" },
            { value: "per_visitor", label: "Par visiteur" },
          ]} onChange={(v) => update({ mode: v })} />
          {cdMode === "duration" && (
            <NumberInput label="Durée (heures)" value={(block.data.endsInHours as number) ?? 48} onChange={(v) => update({ endsInHours: v })} />
          )}
          {cdMode === "fixed_date" && (
            <div>
              <label className="block text-[10px] font-semibold text-[#5c647a] uppercase tracking-wider mb-1">Date de fin</label>
              <input type="datetime-local" value={(block.data.endsAt as string) ?? ""}
                onChange={(e) => update({ endsAt: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
            </div>
          )}
          {cdMode === "per_visitor" && (
            <NumberInput label="Durée par visiteur (minutes)" value={(block.data.durationMinutes as number) ?? 30} onChange={(v) => update({ durationMinutes: v })} />
          )}
          <StringInput label="Sous-titre" value={(block.data.subtitle as string) ?? ""} onChange={(v) => update({ subtitle: v })} />
          <SelectInput label="Taille" value={(block.data.size as string) ?? "md"} options={[
            { value: "sm", label: "Compact" },
            { value: "md", label: "Normal" },
            { value: "lg", label: "Grand" },
          ]} onChange={(v) => update({ size: v })} />
          <BackgroundPicker label="Arrière-plan du countdown" value={(block.data.bgColor as string) || null} onChange={(c) => update({ bgColor: c ?? "" })} />
          <ColorPicker label="Couleur du texte" value={(block.data.textColor as string) || null} onChange={(c) => update({ textColor: c ?? "" })} />
          <details className="border border-gray-100 rounded-lg">
            <summary className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-[#5c647a] uppercase tracking-wider cursor-pointer hover:bg-gray-50 list-none">
              <span className="material-symbols-outlined text-[14px]">timer_off</span>
              Après expiration
            </summary>
            <div className="px-3 pb-3 space-y-2">
              <SelectInput label="Comportement" value={cdExpired} options={[
                { value: "hide", label: "Masquer" },
                { value: "text", label: "Texte alternatif" },
                { value: "redirect", label: "Rediriger" },
              ]} onChange={(v) => update({ expiredBehavior: v })} />
              {cdExpired === "text" && (
                <StringInput label="Texte affiché" value={(block.data.expiredText as string) ?? "Cette offre a expiré."} onChange={(v) => update({ expiredText: v })} />
              )}
              {cdExpired === "redirect" && (
                <StringInput label="URL de redirection" value={(block.data.expiredRedirect as string) ?? ""} onChange={(v) => update({ expiredRedirect: v })} placeholder="https://..." />
              )}
            </div>
          </details>
        </div>
      );
    }
    case "testimonials":
      return (
        <div className="space-y-3">
          <StringInput label="Titre de section" value={(block.data.title as string) ?? ""} onChange={(v) => update({ title: v })} />
          <ColumnPicker value={(block.data.columns as number) ?? 2} onChange={(cols) => update({ columns: cols })} options={[1, 2, 3]} />
          <ListEditor
            label="Témoignages"
            items={(block.data.items as Array<{ name: string; role: string; text: string; rating: number }>) ?? []}
            template={{ name: "Prénom Nom", role: "Métier · Ville", text: "Témoignage…", rating: 5 }}
            onChange={(items) => update({ items })}
            renderItem={(item, patch) => (
              <div className="space-y-2">
                <StringInput label="Nom" value={item.name} onChange={(v) => patch({ name: v })} />
                <StringInput label="Rôle" value={item.role} onChange={(v) => patch({ role: v })} />
                <StringInput label="Témoignage" value={item.text} onChange={(v) => patch({ text: v })} multiline />
                <NumberInput label="Note (1-5)" value={item.rating} onChange={(v) => patch({ rating: v })} />
              </div>
            )}
          />
        </div>
      );
    case "faq":
      return (
        <div className="space-y-3">
          <StringInput label="Titre" value={(block.data.title as string) ?? ""} onChange={(v) => update({ title: v })} />
          <ListEditor
            label="Questions"
            items={(block.data.items as Array<{ q: string; a: string }>) ?? []}
            template={{ q: "Question ?", a: "Réponse claire." }}
            onChange={(items) => update({ items })}
            renderItem={(item, patch) => (
              <div className="space-y-2">
                <StringInput label="Question" value={item.q} onChange={(v) => patch({ q: v })} />
                <StringInput label="Réponse" value={item.a} onChange={(v) => patch({ a: v })} multiline />
              </div>
            )}
          />
        </div>
      );
    case "cta":
      return (
        <div className="space-y-3">
          <StringInput label="Titre" value={(block.data.headline as string) ?? ""} onChange={(v) => update({ headline: v })} />
          <StringInput label="Sous-titre" value={(block.data.subheadline as string) ?? ""} onChange={(v) => update({ subheadline: v })} />
          <StringInput label="Texte du bouton" value={(block.data.ctaText as string) ?? ""} onChange={(v) => update({ ctaText: v })} />
          <StringInput label="Lien du bouton" value={(block.data.ctaLink as string) ?? ""} onChange={(v) => update({ ctaLink: v })} placeholder="Laissez vide pour utiliser le checkout par défaut" />
        </div>
      );
    case "stats":
      return (
        <div className="space-y-3">
          <StringInput label="Titre (optionnel)" value={(block.data.title as string) ?? ""} onChange={(v) => update({ title: v })} />
          <StringInput label="Sous-titre (optionnel)" value={(block.data.subtitle as string) ?? ""} onChange={(v) => update({ subtitle: v })} />
          <ColumnPicker value={(block.data.columns as number) ?? 3} onChange={(cols) => update({ columns: cols })} options={[2, 3, 4]} />
          <div className="grid grid-cols-2 gap-2">
            <ColorPicker label="Couleur de fond" value={(block.data.bgColor as string) || null} onChange={(c) => update({ bgColor: c ?? "" })} />
            <ColorPicker label="Couleur des chiffres" value={(block.data.valueColor as string) || null} onChange={(c) => update({ valueColor: c ?? "" })} />
          </div>
          <ListEditor
            label="Statistiques"
            items={(block.data.items as Array<{ value: string; prefix?: string; suffix?: string; label: string; icon?: string }>) ?? []}
            template={{ value: "100", prefix: "", suffix: "+", label: "Label", icon: "" }}
            onChange={(items) => update({ items })}
            renderItem={(item, patch) => (
              <div className="space-y-2">
                <div>
                  <label className="block text-[10px] font-semibold text-[#5c647a] uppercase tracking-wider mb-1">Icône (optionnel)</label>
                  <IconPicker value={item.icon ?? ""} onChange={(ic) => patch({ icon: ic })} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <StringInput label="Préfixe" value={item.prefix ?? ""} onChange={(v) => patch({ prefix: v })} placeholder="€, $…" />
                  <StringInput label="Valeur" value={item.value} onChange={(v) => patch({ value: v })} />
                  <StringInput label="Suffixe" value={item.suffix ?? ""} onChange={(v) => patch({ suffix: v })} placeholder="+, %…" />
                </div>
                <StringInput label="Label" value={item.label} onChange={(v) => patch({ label: v })} />
              </div>
            )}
          />
        </div>
      );
    case "pricing":
      return (
        <div className="space-y-3">
          <StringInput label="Titre" value={(block.data.title as string) ?? ""} onChange={(v) => update({ title: v })} />
          <div className="grid grid-cols-2 gap-2">
            <StringInput label="Badge (ex: POPULAIRE)" value={(block.data.badgeText as string) ?? ""} onChange={(v) => update({ badgeText: v })} />
            <ColorPicker label="Couleur badge" value={(block.data.badgeColor as string) || null} onChange={(c) => update({ badgeColor: c ?? "" })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <NumberInput label="Prix" value={(block.data.price as number) ?? 0} onChange={(v) => update({ price: v })} />
            <NumberInput label="Prix barré" value={(block.data.originalPrice as number) ?? 0} onChange={(v) => update({ originalPrice: v })} />
          </div>
          <StringInput label="Devise" value={(block.data.currency as string) ?? "FCFA"} onChange={(v) => update({ currency: v })} />
          <div>
            <label className="block text-[10px] font-semibold text-[#5c647a] uppercase tracking-wider mb-1">Icône des avantages</label>
            <IconPicker value={(block.data.benefitIcon as string) ?? "check_circle"} onChange={(ic) => update({ benefitIcon: ic })} />
          </div>
          <ListEditor
            label="Avantages"
            items={((block.data.benefits as string[]) ?? []).map((s) => ({ text: s }))}
            template={{ text: "Nouvel avantage" }}
            onChange={(items) => update({ benefits: items.map((i) => i.text) })}
            renderItem={(item, patch) => <StringInput label="Texte" value={item.text} onChange={(v) => patch({ text: v })} />}
          />
          <StringInput label="Texte du bouton" value={(block.data.ctaText as string) ?? ""} onChange={(v) => update({ ctaText: v })} />
          <StringInput label="Lien du bouton" value={(block.data.ctaLink as string) ?? ""} onChange={(v) => update({ ctaLink: v })} placeholder="Vide = checkout par défaut" />
          <StringInput label="Garantie (optionnel)" value={(block.data.guaranteeText as string) ?? ""} onChange={(v) => update({ guaranteeText: v })} placeholder="Ex: Garantie 14 jours satisfait ou remboursé" />
          <ColorPicker label="Couleur accent" value={(block.data.accentColor as string) || null} onChange={(c) => update({ accentColor: c ?? "" })} />
        </div>
      );
    case "scarcity":
      return (
        <div className="space-y-3">
          <StringInput label="Texte (utilisez {remaining} et {limit})" value={(block.data.text as string) ?? ""} onChange={(v) => update({ text: v })} />
          <NumberInput label="Seuil urgence (rouge)" value={(block.data.urgentThreshold as number) ?? 5} onChange={(v) => update({ urgentThreshold: v })} />
          <SelectInput label="Style" value={(block.data.style as string) ?? "banner"} options={[
            { value: "banner", label: "Bannière" },
            { value: "badge", label: "Badge" },
            { value: "inline", label: "Texte" },
          ]} onChange={(v) => update({ style: v })} />
          <div className="flex items-center gap-3">
            <label className="text-[10px] font-semibold text-[#5c647a] uppercase tracking-wider">Barre de progression</label>
            <button onClick={() => update({ showProgressBar: !block.data.showProgressBar })}
              className={`w-9 h-5 rounded-full transition-colors relative ${block.data.showProgressBar ? "bg-[#006e2f]" : "bg-gray-300"}`}>
              <span className={`block w-4 h-4 rounded-full bg-white shadow absolute top-0.5 transition-all ${block.data.showProgressBar ? "left-4" : "left-0.5"}`} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <ColorPicker label="Couleur barre" value={(block.data.barColor as string) || null} onChange={(c) => update({ barColor: c ?? "" })} />
            <ColorPicker label="Couleur texte" value={(block.data.textColor as string) || null} onChange={(c) => update({ textColor: c ?? "" })} />
          </div>
          <StringInput label="Texte quand complet" value={(block.data.emptyText as string) ?? ""} onChange={(v) => update({ emptyText: v })} />
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-[10px] text-amber-800">
            <span className="material-symbols-outlined text-[12px] align-text-top mr-1">info</span>
            La limite se configure dans les paramètres du funnel (salesLimit). Le compteur se met à jour automatiquement.
          </div>
        </div>
      );
    case "guarantee":
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-semibold text-[#5c647a] uppercase tracking-wider mb-1">Icône</label>
            <IconPicker value={(block.data.icon as string) ?? "verified_user"} onChange={(ic) => update({ icon: ic })} />
          </div>
          <StringInput label="Titre" value={(block.data.title as string) ?? ""} onChange={(v) => update({ title: v })} />
          <StringInput label="Description" value={(block.data.text as string) ?? ""} onChange={(v) => update({ text: v })} multiline />
          <SelectInput label="Style" value={(block.data.style as string) ?? "card"} options={[
            { value: "card", label: "Carte" },
            { value: "banner", label: "Bannière" },
            { value: "minimal", label: "Minimal" },
          ]} onChange={(v) => update({ style: v })} />
          <ColorPicker label="Couleur accent" value={(block.data.accentColor as string) || null} onChange={(c) => update({ accentColor: c ?? "" })} />
        </div>
      );
    case "logo-bar":
      return (
        <div className="space-y-3">
          <StringInput label="Titre (optionnel)" value={(block.data.title as string) ?? ""} onChange={(v) => update({ title: v })} />
          <SelectInput label="Style" value={(block.data.style as string) ?? "icons"} options={[
            { value: "icons", label: "Icônes" },
            { value: "text", label: "Texte" },
            { value: "images", label: "Images" },
          ]} onChange={(v) => update({ style: v })} />
          <ListEditor
            label="Logos / Éléments"
            items={(block.data.items as Array<{ label: string; icon?: string; url?: string }>) ?? []}
            template={{ label: "Nouveau", icon: "star" }}
            onChange={(items) => update({ items })}
            renderItem={(item, patch) => (
              <div className="space-y-2">
                <StringInput label="Nom" value={item.label} onChange={(v) => patch({ label: v })} />
                {(block.data.style as string) === "images" ? (
                  <MediaUpload label="Logo" value={item.url ?? null} onChange={(url) => patch({ url: url ?? "" })} accept="image" />
                ) : (
                  <div><label className="block text-[10px] font-semibold text-[#5c647a] uppercase tracking-wider mb-1">Icône</label><IconPicker value={item.icon ?? "star"} onChange={(ic) => patch({ icon: ic })} /></div>
                )}
              </div>
            )}
          />
          <div className="flex items-center gap-3">
            <label className="text-[10px] font-semibold text-[#5c647a] uppercase tracking-wider">Niveaux de gris</label>
            <button onClick={() => update({ grayscale: !block.data.grayscale })}
              className={`w-9 h-5 rounded-full transition-colors relative ${block.data.grayscale ? "bg-[#006e2f]" : "bg-gray-300"}`}>
              <span className={`block w-4 h-4 rounded-full bg-white shadow absolute top-0.5 transition-all ${block.data.grayscale ? "left-4" : "left-0.5"}`} />
            </button>
          </div>
          <BackgroundPicker label="Arrière-plan" value={(block.data.bgColor as string) || null} onChange={(c) => update({ bgColor: c ?? "" })} />
        </div>
      );
    case "alert":
      return (
        <div className="space-y-3">
          <StringInput label="Message" value={(block.data.text as string) ?? ""} onChange={(v) => update({ text: v })} multiline />
          <SelectInput label="Type" value={(block.data.variant as string) ?? "warning"} options={[
            { value: "info", label: "Info" },
            { value: "success", label: "Succès" },
            { value: "warning", label: "Urgent" },
            { value: "danger", label: "Critique" },
          ]} onChange={(v) => update({ variant: v })} />
          <div>
            <label className="block text-[10px] font-semibold text-[#5c647a] uppercase tracking-wider mb-1">Icône</label>
            <IconPicker value={(block.data.icon as string) ?? "campaign"} onChange={(ic) => update({ icon: ic })} />
          </div>
        </div>
      );
    case "social-proof":
      return (
        <div className="space-y-3">
          <SelectInput label="Style" value={(block.data.style as string) ?? "live"} options={[
            { value: "live", label: "En direct" },
            { value: "counter", label: "Compteurs" },
            { value: "recent", label: "Achats récents" },
          ]} onChange={(v) => update({ style: v })} />
          {(block.data.style as string) === "live" && (
            <>
              <StringInput label="Texte ({count} = nombre)" value={(block.data.liveText as string) ?? ""} onChange={(v) => update({ liveText: v })} />
              <div className="grid grid-cols-2 gap-2">
                <NumberInput label="Nombre de base" value={(block.data.liveCount as number) ?? 12} onChange={(v) => update({ liveCount: v })} />
                <NumberInput label="Variance (±)" value={(block.data.liveVariance as number) ?? 5} onChange={(v) => update({ liveVariance: v })} />
              </div>
            </>
          )}
          {(block.data.style as string) === "counter" && (
            <ListEditor
              label="Compteurs"
              items={(block.data.counterItems as Array<{ value: string; label: string; icon: string }>) ?? []}
              template={{ value: "100+", label: "Label", icon: "group" }}
              onChange={(items) => update({ counterItems: items })}
              renderItem={(item, patch) => (
                <div className="space-y-2">
                  <div><label className="block text-[10px] font-semibold text-[#5c647a] uppercase tracking-wider mb-1">Icône</label><IconPicker value={item.icon} onChange={(ic) => patch({ icon: ic })} /></div>
                  <StringInput label="Valeur" value={item.value} onChange={(v) => patch({ value: v })} />
                  <StringInput label="Label" value={item.label} onChange={(v) => patch({ label: v })} />
                </div>
              )}
            />
          )}
          {(block.data.style as string) === "recent" && (
            <ListEditor
              label="Achats récents"
              items={(block.data.recentItems as Array<{ name: string; city: string; action: string; time: string }>) ?? []}
              template={{ name: "Prénom N.", city: "Ville", action: "vient d'acheter", time: "il y a 2 min" }}
              onChange={(items) => update({ recentItems: items })}
              renderItem={(item, patch) => (
                <div className="space-y-2">
                  <StringInput label="Nom" value={item.name} onChange={(v) => patch({ name: v })} />
                  <StringInput label="Ville" value={item.city} onChange={(v) => patch({ city: v })} />
                  <StringInput label="Action" value={item.action} onChange={(v) => patch({ action: v })} />
                  <StringInput label="Temps" value={item.time} onChange={(v) => patch({ time: v })} />
                </div>
              )}
            />
          )}
          <ColorPicker label="Couleur accent" value={(block.data.accentColor as string) || null} onChange={(c) => update({ accentColor: c ?? "" })} />
        </div>
      );
    case "comparison":
      return (
        <div className="space-y-3">
          <StringInput label="Titre" value={(block.data.title as string) ?? ""} onChange={(v) => update({ title: v })} />
          <div className="grid grid-cols-2 gap-2">
            <StringInput label="Colonne 1" value={((block.data.columns as string[]) ?? [])[0] ?? ""} onChange={(v) => { const cols = [...((block.data.columns as string[]) ?? [])]; cols[0] = v; update({ columns: cols }); }} />
            <StringInput label="Colonne 2" value={((block.data.columns as string[]) ?? [])[1] ?? ""} onChange={(v) => { const cols = [...((block.data.columns as string[]) ?? [])]; cols[1] = v; update({ columns: cols }); }} />
          </div>
          <SelectInput label="Colonne mise en avant" value={String((block.data.highlightColumn as number) ?? 1)} options={[
            { value: "0", label: "Colonne 1" }, { value: "1", label: "Colonne 2" },
          ]} onChange={(v) => update({ highlightColumn: Number(v) })} />
          <ListEditor
            label="Lignes"
            items={(block.data.rows as Array<{ label: string; values: string[] }>) ?? []}
            template={{ label: "Critère", values: ["Non", "Oui"] }}
            onChange={(items) => update({ rows: items })}
            renderItem={(item, patch) => (
              <div className="space-y-2">
                <StringInput label="Critère" value={item.label} onChange={(v) => patch({ label: v })} />
                <div className="grid grid-cols-2 gap-2">
                  <StringInput label="Val. 1" value={item.values[0] ?? ""} onChange={(v) => patch({ values: [v, item.values[1] ?? ""] })} />
                  <StringInput label="Val. 2" value={item.values[1] ?? ""} onChange={(v) => patch({ values: [item.values[0] ?? "", v] })} />
                </div>
              </div>
            )}
          />
          <ColorPicker label="Couleur accent" value={(block.data.accentColor as string) || null} onChange={(c) => update({ accentColor: c ?? "" })} />
        </div>
      );
    case "floating-cta":
      return (
        <div className="space-y-3">
          <StringInput label="Texte d'accroche" value={(block.data.text as string) ?? ""} onChange={(v) => update({ text: v })} />
          <StringInput label="Texte du bouton" value={(block.data.buttonText as string) ?? ""} onChange={(v) => update({ buttonText: v })} />
          <StringInput label="Lien du bouton" value={(block.data.buttonLink as string) ?? ""} onChange={(v) => update({ buttonLink: v })} placeholder="Vide = checkout" />
          <div className="grid grid-cols-2 gap-2">
            <StringInput label="Prix" value={(block.data.price as string) ?? ""} onChange={(v) => update({ price: v })} />
            <StringInput label="Prix barré" value={(block.data.originalPrice as string) ?? ""} onChange={(v) => update({ originalPrice: v })} />
          </div>
          <SelectInput label="Position" value={(block.data.position as string) ?? "bottom"} options={[
            { value: "bottom", label: "Bas" }, { value: "top", label: "Haut" },
          ]} onChange={(v) => update({ position: v })} />
          <BackgroundPicker label="Arrière-plan" value={(block.data.bgColor as string) || null} onChange={(c) => update({ bgColor: c ?? "" })} />
        </div>
      );
    case "image-gallery":
      return (
        <div className="space-y-3">
          <ColumnPicker value={(block.data.columns as number) ?? 3} onChange={(cols) => update({ columns: cols })} options={[2, 3, 4]} />
          <NumberInput label="Espace (px)" value={(block.data.gap as number) ?? 8} onChange={(v) => update({ gap: v })} />
          <NumberInput label="Arrondi (px)" value={(block.data.radius as number) ?? 12} onChange={(v) => update({ radius: v })} />
          <ListEditor
            label="Images"
            items={(block.data.images as Array<{ url: string; alt: string; caption?: string }>) ?? []}
            template={{ url: "", alt: "Nouvelle image", caption: "" }}
            onChange={(items) => update({ images: items })}
            renderItem={(item, patch) => (
              <div className="space-y-2">
                <MediaUpload label="Image" value={item.url || null} onChange={(url) => patch({ url: url ?? "" })} accept="image" />
                <StringInput label="Texte alt" value={item.alt} onChange={(v) => patch({ alt: v })} />
                <StringInput label="Légende (optionnel)" value={item.caption ?? ""} onChange={(v) => patch({ caption: v })} />
              </div>
            )}
          />
        </div>
      );
    default:
      return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ROW EDITOR (container with columns)
// ═══════════════════════════════════════════════════════════════════════════
type ColumnData = { blocks: Block[]; width?: number };

function RowEditor({ block, onChange, onDelete }: { block: Block; onChange: (b: Block) => void; onDelete: () => void }) {
  const [pickerColIdx, setPickerColIdx] = useState<number | null>(null);
  const columns = (block.data.columns as ColumnData[]) ?? [];
  const gap = (block.data.gap as number) ?? 16;
  const padding = (block.data.padding as number) ?? 24;
  const bgColor = (block.data.bgColor as string) ?? "";

  const updateData = (patch: Record<string, unknown>) => onChange({ ...block, data: { ...block.data, ...patch } });
  const setColumnsCount = (n: number) => {
    const curr = [...columns];
    if (n > curr.length) for (let i = curr.length; i < n; i++) curr.push({ blocks: [] });
    else if (n < curr.length) {
      // Move blocks from removed columns to the last kept one
      const kept = curr.slice(0, n);
      const overflow = curr.slice(n).flatMap((c) => c.blocks);
      kept[n - 1] = { ...kept[n - 1], blocks: [...kept[n - 1].blocks, ...overflow] };
      curr.splice(0, curr.length, ...kept);
    }
    updateData({ columns: curr });
  };

  const updateColumn = (idx: number, patch: Partial<ColumnData>) => {
    const updated = [...columns];
    updated[idx] = { ...updated[idx], ...patch };
    updateData({ columns: updated });
  };

  const addToColumn = (colIdx: number, key: PaletteKey) => {
    const newBlock = createFromPaletteKey(key);
    const colBlocks = [...(columns[colIdx]?.blocks ?? []), newBlock];
    updateColumn(colIdx, { blocks: colBlocks });
    setPickerColIdx(null);
  };

  const updateColBlock = (colIdx: number, blockIdx: number, updated: Block) => {
    const colBlocks = [...(columns[colIdx]?.blocks ?? [])];
    colBlocks[blockIdx] = updated;
    updateColumn(colIdx, { blocks: colBlocks });
  };

  const deleteColBlock = (colIdx: number, blockIdx: number) => {
    const colBlocks = (columns[colIdx]?.blocks ?? []).filter((_, j) => j !== blockIdx);
    updateColumn(colIdx, { blocks: colBlocks });
  };

  return (
    <div className="bg-[#f7f9fb] rounded-2xl border-2 border-dashed border-[#006e2f]/30 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#006e2f]/5 border-b border-[#006e2f]/10">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#006e2f] text-[16px]">view_column</span>
          <span className="text-xs font-bold text-[#006e2f]">Rangée · {columns.length} colonne{columns.length > 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4].map((n) => (
            <button key={n} onClick={() => setColumnsCount(n)}
              className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${columns.length === n ? "bg-[#006e2f] text-white" : "bg-white text-[#5c647a] hover:bg-gray-100"}`}>
              {n} col
            </button>
          ))}
          <button onClick={onDelete} className="ml-2 text-red-500 hover:text-red-700">
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      </div>

      {/* Row-level settings (collapsed) */}
      <details className="border-b border-gray-200">
        <summary className="px-4 py-2 text-[10px] font-semibold text-[#5c647a] uppercase tracking-wider cursor-pointer hover:bg-white">
          Réglages de la rangée
        </summary>
        <div className="p-4 bg-white space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <NumberInput label="Espace entre colonnes (px)" value={gap} onChange={(v) => updateData({ gap: v })} />
            <NumberInput label="Padding vertical (px)" value={padding} onChange={(v) => updateData({ padding: v })} />
          </div>
          <BackgroundPicker label="Arrière-plan de la rangée" value={bgColor || null} onChange={(c) => updateData({ bgColor: c ?? "" })} />
        </div>
      </details>

      {/* Columns */}
      <div className="p-4" style={{ background: bgColor || undefined }}>
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
          {columns.map((col, colIdx) => (
            <div key={colIdx} className="bg-white rounded-xl border border-gray-200 p-3 min-h-[140px] flex flex-col gap-3">
              <div className="text-[10px] font-bold text-[#5c647a] uppercase tracking-wider px-1">
                Colonne {colIdx + 1}
              </div>
              {(col.blocks ?? []).map((child, bIdx) => (
                <BlockEditor
                  key={child.id}
                  block={child}
                  onChange={(b) => updateColBlock(colIdx, bIdx, b)}
                  onDelete={() => deleteColBlock(colIdx, bIdx)}
                  compact
                />
              ))}
              <button onClick={() => setPickerColIdx(colIdx)}
                className="w-full py-3 rounded-lg border-2 border-dashed border-gray-300 text-xs font-bold text-[#5c647a] hover:border-[#006e2f] hover:text-[#006e2f] hover:bg-[#006e2f]/5 transition-all flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">add</span>
                Ajouter un élément
              </button>
            </div>
          ))}
        </div>
      </div>

      {pickerColIdx !== null && (
        <PalettePicker onPick={(key) => addToColumn(pickerColIdx, key)} onClose={() => setPickerColIdx(null)} allowed={COLUMN_ALLOWED_KEYS} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTAINER EDITOR (shared for Section + Content-box — single slot)
// ═══════════════════════════════════════════════════════════════════════════
function ContainerEditor({
  block, onChange, onDelete,
  title, iconName, accentColor, renderSettings, previewStyle,
}: {
  block: Block;
  onChange: (b: Block) => void;
  onDelete: () => void;
  title: string;
  iconName: string;
  accentColor: string;
  renderSettings: (updateData: (patch: Record<string, unknown>) => void) => React.ReactNode;
  previewStyle?: React.CSSProperties;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const children = (block.data.blocks as Block[]) ?? [];
  const updateData = (patch: Record<string, unknown>) => onChange({ ...block, data: { ...block.data, ...patch } });

  const addChild = (key: PaletteKey) => {
    updateData({ blocks: [...children, createFromPaletteKey(key)] });
    setPickerOpen(false);
  };
  const updateChild = (idx: number, updated: Block) => {
    const next = [...children];
    next[idx] = updated;
    updateData({ blocks: next });
  };
  const deleteChild = (idx: number) => {
    updateData({ blocks: children.filter((_, j) => j !== idx) });
  };

  return (
    <div className="rounded-2xl border-2 border-dashed overflow-hidden" style={{ borderColor: `${accentColor}40` }}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ background: `${accentColor}0A`, borderColor: `${accentColor}1A` }}>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]" style={{ color: accentColor }}>{iconName}</span>
          <span className="text-xs font-bold" style={{ color: accentColor }}>{title} · {children.length} élément{children.length > 1 ? "s" : ""}</span>
        </div>
        <button onClick={onDelete} className="text-red-500 hover:text-red-700">
          <span className="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </div>

      <details className="border-b border-gray-200">
        <summary className="px-4 py-2 text-[10px] font-semibold text-[#5c647a] uppercase tracking-wider cursor-pointer hover:bg-white">
          Réglages
        </summary>
        <div className="p-4 bg-white space-y-2.5">{renderSettings(updateData)}</div>
      </details>

      <div className="p-3" style={previewStyle}>
        <div className="bg-white/50 rounded-xl border border-gray-200 p-2.5 min-h-[120px] flex flex-col gap-2">
          {children.map((child, bIdx) => (
            <BlockEditor key={child.id} block={child} onChange={(b) => updateChild(bIdx, b)} onDelete={() => deleteChild(bIdx)} compact />
          ))}
          <button onClick={() => setPickerOpen(true)}
            className="w-full py-2.5 rounded-lg border-2 border-dashed border-gray-300 text-[11px] font-bold text-[#5c647a] hover:border-[#006e2f] hover:text-[#006e2f] hover:bg-[#006e2f]/5 transition-all flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">add</span>
            Ajouter un élément
          </button>
        </div>
      </div>

      {pickerOpen && (
        <PalettePicker onPick={addChild} onClose={() => setPickerOpen(false)} allowed={COLUMN_ALLOWED_KEYS} />
      )}
    </div>
  );
}

function SectionEditor({ block, onChange, onDelete }: { block: Block; onChange: (b: Block) => void; onDelete: () => void }) {
  return (
    <ContainerEditor
      block={block} onChange={onChange} onDelete={onDelete}
      title="Section" iconName="dashboard" accentColor="#006e2f"
      previewStyle={{ background: (block.data.bgColor as string) || undefined }}
      renderSettings={(updateData) => (
        <>
          <div className="grid grid-cols-2 gap-2">
            <NumberInput label="Padding vertical (px)" value={(block.data.paddingY as number) ?? 64} onChange={(v) => updateData({ paddingY: v })} />
            <NumberInput label="Padding horizontal (px)" value={(block.data.paddingX as number) ?? 16} onChange={(v) => updateData({ paddingX: v })} />
          </div>
          <NumberInput label="Largeur max (px, 0 = pleine)" value={(block.data.maxWidth as number) ?? 1152} onChange={(v) => updateData({ maxWidth: v })} />
          <BackgroundPicker label="Arrière-plan de la section" value={(block.data.bgColor as string) || null} onChange={(c) => updateData({ bgColor: c ?? "" })} />
          <ColorPicker label="Couleur du texte" value={(block.data.textColor as string) || null} onChange={(c) => updateData({ textColor: c ?? "" })} />
          <MediaUpload label="Image de fond (optionnel — par-dessus la couleur)" value={(block.data.bgImage as string) ?? null} onChange={(url) => updateData({ bgImage: url ?? "" })} accept="image" aspectRatio="landscape" />
          {(block.data.bgImage as string) && (
            <div className="flex items-center gap-3">
              <label className="text-[10px] font-semibold text-[#5c647a] uppercase tracking-wider">Effet parallaxe</label>
              <button onClick={() => updateData({ parallax: !block.data.parallax })}
                className={`w-9 h-5 rounded-full transition-colors relative ${block.data.parallax ? "bg-[#006e2f]" : "bg-gray-300"}`}>
                <span className={`block w-4 h-4 rounded-full bg-white shadow absolute top-0.5 transition-all ${block.data.parallax ? "left-4" : "left-0.5"}`} />
              </button>
            </div>
          )}
          <ColorPicker label="Overlay (optionnel)" value={(block.data.overlayColor as string) || null} onChange={(c) => updateData({ overlayColor: c ?? "" })} />
        </>
      )}
    />
  );
}

function ContentBoxEditor({ block, onChange, onDelete }: { block: Block; onChange: (b: Block) => void; onDelete: () => void }) {
  const bg = (block.data.bgColor as string) || "#ffffff";
  const border = (block.data.borderColor as string) || "#e5e7eb";
  const radius = (block.data.radius as number) ?? 16;
  const padding = (block.data.padding as number) ?? 24;
  const borderWidth = (block.data.borderWidth as number) ?? 1;
  return (
    <ContainerEditor
      block={block} onChange={onChange} onDelete={onDelete}
      title="Boîte de contenu" iconName="call_to_action" accentColor="#2563eb"
      previewStyle={{ background: bg, borderRadius: `${radius}px`, border: `${borderWidth}px solid ${border}`, padding: `${padding}px` }}
      renderSettings={(updateData) => (
        <>
          <div className="grid grid-cols-2 gap-2">
            <NumberInput label="Padding (px)" value={padding} onChange={(v) => updateData({ padding: v })} />
            <NumberInput label="Arrondi (px)" value={radius} onChange={(v) => updateData({ radius: v })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <NumberInput label="Épaisseur bord (px)" value={borderWidth} onChange={(v) => updateData({ borderWidth: v })} />
            <SelectInput label="Ombre" value={(block.data.shadow as string) ?? "md"} options={[
              { value: "none", label: "Aucune" }, { value: "sm", label: "Petite" }, { value: "md", label: "Moyenne" }, { value: "lg", label: "Grande" },
            ]} onChange={(v) => updateData({ shadow: v })} />
          </div>
          <BackgroundPicker label="Arrière-plan de la boîte" value={bg} onChange={(c) => updateData({ bgColor: c ?? "#ffffff" })} />
          <div className="grid grid-cols-2 gap-2">
            <ColorPicker label="Couleur bord" value={border} onChange={(c) => updateData({ borderColor: c ?? "#e5e7eb" })} />
            <ColorPicker label="Couleur du texte" value={(block.data.textColor as string) || null} onChange={(c) => updateData({ textColor: c ?? "" })} />
          </div>
        </>
      )}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PRODUCT PICKER (dropdown populated from vendor catalog)
// ═══════════════════════════════════════════════════════════════════════════
type CatalogItem = {
  kind: "formation" | "product";
  id: string;
  title: string;
  image: string | null;
  price: number;
  isFree: boolean;
  status: string;
};

function ProductEditor({ block, update }: { block: Block; update: (data: Record<string, unknown>) => void }) {
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  useEffect(() => {
    fetch("/api/formations/vendeur/catalog")
      .then((r) => r.json())
      .then((j) => setCatalog(j.data ?? []))
      .finally(() => setCatalogLoading(false));
  }, []);

  const selectedKind = (block.data.kind as string) ?? "";
  const selectedId = (block.data.id as string) ?? "";
  const selected = catalog.find((c) => c.kind === selectedKind && c.id === selectedId);

  return (
    <div className="space-y-2.5">
      <div>
        <label className="block text-[10px] font-semibold text-[#5c647a] uppercase tracking-wider mb-1">Produit / Formation à vendre *</label>
        {catalogLoading ? (
          <div className="text-xs text-[#5c647a] px-3 py-2 bg-white rounded-lg border border-gray-200">Chargement du catalogue…</div>
        ) : catalog.length === 0 ? (
          <div className="text-xs text-[#5c647a] px-3 py-2 bg-amber-50 rounded-lg border border-amber-200">
            Aucun produit dans votre catalogue. Créez d&apos;abord une formation ou un produit digital.
          </div>
        ) : (
          <select
            value={selectedId ? `${selectedKind}::${selectedId}` : ""}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) { update({ kind: "", id: "" }); return; }
              const [k, id] = v.split("::");
              update({ kind: k, id });
            }}
            className="w-full text-sm text-[#191c1e] bg-white px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30"
          >
            <option value="">— Sélectionnez —</option>
            <optgroup label="Formations">
              {catalog.filter((c) => c.kind === "formation").map((c) => (
                <option key={c.id} value={`formation::${c.id}`}>{c.title} — {c.isFree ? "Gratuit" : `${c.price} FCFA`}{c.status !== "PUBLISHED" ? ` (${c.status})` : ""}</option>
              ))}
            </optgroup>
            <optgroup label="Produits digitaux">
              {catalog.filter((c) => c.kind === "product").map((c) => (
                <option key={c.id} value={`product::${c.id}`}>{c.title} — {c.isFree ? "Gratuit" : `${c.price} FCFA`}{c.status !== "PUBLISHED" ? ` (${c.status})` : ""}</option>
              ))}
            </optgroup>
          </select>
        )}
      </div>

      {selected && (
        <div className="flex items-center gap-3 px-3 py-2 bg-[#006e2f]/5 rounded-lg">
          {selected.image && <img src={selected.image} alt="" className="w-10 h-10 rounded-lg object-cover" />}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[#191c1e] truncate">{selected.title}</p>
            <p className="text-[10px] text-[#5c647a]">{selected.kind === "formation" ? "Formation" : "Produit digital"}</p>
          </div>
        </div>
      )}

      <SelectInput label="Layout" value={(block.data.layout as string) ?? "card"} options={[
        { value: "card", label: "Carte" }, { value: "hero", label: "Hero" }, { value: "compact", label: "Compact" },
      ]} onChange={(v) => update({ layout: v })} />

      <div className="grid grid-cols-2 gap-2">
        <label className="flex items-center gap-2 text-xs cursor-pointer"><input type="checkbox" checked={Boolean(block.data.showImage)} onChange={(e) => update({ showImage: e.target.checked })} className="accent-[#006e2f]" /> Image</label>
        <label className="flex items-center gap-2 text-xs cursor-pointer"><input type="checkbox" checked={Boolean(block.data.showPrice)} onChange={(e) => update({ showPrice: e.target.checked })} className="accent-[#006e2f]" /> Prix</label>
        <label className="flex items-center gap-2 text-xs cursor-pointer"><input type="checkbox" checked={Boolean(block.data.showRating)} onChange={(e) => update({ showRating: e.target.checked })} className="accent-[#006e2f]" /> Note / étoiles</label>
        <label className="flex items-center gap-2 text-xs cursor-pointer"><input type="checkbox" checked={Boolean(block.data.showCount)} onChange={(e) => update({ showCount: e.target.checked })} className="accent-[#006e2f]" /> Nb élèves/ventes</label>
        <label className="flex items-center gap-2 text-xs cursor-pointer"><input type="checkbox" checked={Boolean(block.data.showDescription)} onChange={(e) => update({ showDescription: e.target.checked })} className="accent-[#006e2f]" /> Description</label>
      </div>

      <StringInput label="Texte du bouton" value={(block.data.ctaText as string) ?? ""} onChange={(v) => update({ ctaText: v })} />
      <div>
        <label className="block text-[10px] font-semibold text-[#5c647a] uppercase tracking-wider mb-1">Icône du bouton</label>
        <IconPicker value={(block.data.ctaIcon as string) ?? "shopping_cart"} onChange={(ic) => update({ ctaIcon: ic })} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <ColorPicker label="Couleur de fond" value={(block.data.bgColor as string) || null} onChange={(c) => update({ bgColor: c ?? "" })} />
        <ColorPicker label="Couleur accent" value={(block.data.accentColor as string) || null} onChange={(c) => update({ accentColor: c ?? "" })} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// UNIVERSAL BLOCK EDITOR (dispatcher)
// ═══════════════════════════════════════════════════════════════════════════
function BlockEditor({ block, onChange, onDelete, compact }: { block: Block; onChange: (b: Block) => void; onDelete: () => void; compact?: boolean }) {
  const update = (data: Record<string, unknown>) => onChange({ ...block, data: { ...block.data, ...data } });

  if (block.type === "row") return <RowEditor block={block} onChange={onChange} onDelete={onDelete} />;
  if (block.type === "section") return <SectionEditor block={block} onChange={onChange} onDelete={onDelete} />;
  if (block.type === "content-box") return <ContentBoxEditor block={block} onChange={onChange} onDelete={onDelete} />;

  const tpl = BLOCK_TEMPLATES[block.type];
  const isAtomic = tpl.atomic;
  const animValue = (block.data._animation as string) ?? "none";
  const visValue = (block.data._visibility as string) ?? "all";

  return (
    <div className="bg-[#f7f9fb] rounded-xl border border-gray-200">
      <div className={`flex items-center justify-between bg-white border-b border-gray-200 rounded-t-xl ${compact ? "px-3 py-2" : "px-4 py-3"}`}>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#006e2f] text-[18px]">{tpl.icon}</span>
          <span className="font-bold text-[#191c1e] text-sm">{tpl.label}</span>
          {visValue !== "all" && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 uppercase">
              {visValue === "desktop" ? "Desktop" : "Mobile"}
            </span>
          )}
          {animValue !== "none" && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 uppercase">
              {animValue}
            </span>
          )}
        </div>
        <button onClick={onDelete} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors">
          <span className="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </div>
      <div className={compact ? "p-3" : "p-4"}>
        {isAtomic ? renderAtomicEditor(block, update) : renderSectionEditor(block, update)}
      </div>
      {/* Advanced: Animation + Visibility */}
      <details className="border-t border-gray-200">
        <summary className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold text-[#5c647a] uppercase tracking-wider cursor-pointer hover:bg-gray-50 list-none">
          <span className="material-symbols-outlined text-[14px]">tune</span>
          Animation &amp; visibilité
          <span className="ml-auto material-symbols-outlined text-[14px]">expand_more</span>
        </summary>
        <div className="px-4 pb-3 space-y-2">
          <SelectInput label="Animation" value={animValue} options={[
            { value: "none", label: "Aucune" },
            { value: "fade-in", label: "Fondu" },
            { value: "slide-up", label: "Glisser ↑" },
            { value: "slide-left", label: "Glisser ←" },
            { value: "bounce", label: "Rebond" },
            { value: "zoom", label: "Zoom" },
          ]} onChange={(v) => update({ _animation: v })} />
          <SelectInput label="Visible sur" value={visValue} options={[
            { value: "all", label: "Tous" },
            { value: "desktop", label: "Desktop" },
            { value: "mobile", label: "Mobile" },
          ]} onChange={(v) => update({ _visibility: v })} />
          <div className="grid grid-cols-2 gap-2">
            <NumberInput label="Marge haut (px)" value={(block.data._marginTop as number) ?? 0} onChange={(v) => update({ _marginTop: v })} />
            <NumberInput label="Marge bas (px)" value={(block.data._marginBottom as number) ?? 0} onChange={(v) => update({ _marginBottom: v })} />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[#5c647a] uppercase tracking-wider mb-1">CSS personnalisé</label>
            <textarea
              value={(block.data._customCss as string) ?? ""}
              onChange={(e) => update({ _customCss: e.target.value })}
              rows={2}
              placeholder=".block { border-radius: 20px; }"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs font-mono resize-y"
            />
          </div>
        </div>
      </details>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EDITOR
// ═══════════════════════════════════════════════════════════════════════════
export default function FunnelEditorClient({ id }: { id: string }) {
  const router = useRouter();
  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<{ kind: "step" | "landing"; data: Block[] } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/formations/vendeur/funnels/${id}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setFunnel(json.data);
      setActiveStepId((prev) => prev ?? json.data.steps[0]?.id ?? null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function save(patch: Omit<Partial<Funnel>, "steps"> & { steps?: Partial<Step>[] }) {
    if (!funnel) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/formations/vendeur/funnels/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        const json = await res.json();
        setFunnel(json.data);
        setSavedAt(new Date());
      }
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    const ok = await confirmAction({
      title: "Supprimer ce funnel définitivement ?",
      message: "Cette action est irréversible. Toutes les pages et données associées seront supprimées.",
      confirmLabel: "Supprimer définitivement",
      confirmVariant: "danger",
      icon: "delete_forever",
    });
    if (!ok) return;
    await fetch(`/api/formations/vendeur/funnels/${id}`, { method: "DELETE" });
    router.push("/vendeur/marketing/funnels");
  }

  if (loading || !funnel) {
    return (
      <div className="p-8 max-w-7xl mx-auto animate-pulse">
        <div className="h-8 w-64 bg-gray-200 rounded-xl mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="h-96 bg-gray-200 rounded-2xl" />
          <div className="lg:col-span-2 h-96 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  const activeStep = funnel.steps.find((s) => s.id === activeStepId) ?? funnel.steps[0];
  const blocks = (activeStep?.blocks as Block[]) ?? [];

  function persistBlocks(updated: Block[]) {
    if (!activeStep) return;
    save({ steps: [{ id: activeStep.id, blocks: updated as unknown as Block[] }] });
    setFunnel((f) => f ? { ...f, steps: f.steps.map((s) => s.id === activeStep.id ? { ...s, blocks: updated } : s) } : f);
  }

  function updateBlock(idx: number, block: Block) { persistBlocks(blocks.map((b, i) => i === idx ? block : b)); }
  function deleteBlock(idx: number) { persistBlocks(blocks.filter((_, j) => j !== idx)); }
  function addBlock(key: PaletteKey) { persistBlocks([...blocks, createFromPaletteKey(key)]); setShowAddBlock(false); }
  function duplicateBlock(idx: number) {
    const src = blocks[idx];
    if (!src) return;
    const clone: Block = { id: newBlockId(), type: src.type, data: JSON.parse(JSON.stringify(src.data)) };
    persistBlocks([...blocks.slice(0, idx + 1), clone, ...blocks.slice(idx + 1)]);
  }
  function moveBlock(idx: number, dir: -1 | 1) {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= blocks.length) return;
    const next = [...blocks];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    persistBlocks(next);
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="px-5 md:px-8 h-14 flex items-center gap-3 max-w-7xl mx-auto">
          <Link href="/vendeur/marketing/funnels" className="text-[#5c647a] hover:text-[#191c1e]">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>
          <input type="text" value={funnel.name}
            onChange={(e) => setFunnel({ ...funnel, name: e.target.value })}
            onBlur={() => save({ name: funnel.name })}
            className="text-sm font-bold text-[#191c1e] flex-1 bg-transparent placeholder-gray-400 focus:outline-none focus:bg-gray-50 px-2 py-1 rounded transition-colors"
            placeholder="Nom du funnel" />
          <div className="flex items-center gap-2 text-xs text-[#5c647a]">
            {saving ? (<><span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>Sauvegarde…</>)
              : savedAt ? (<><span className="material-symbols-outlined text-[14px] text-green-500">check_circle</span>Sauvegardé</>)
              : null}
          </div>
          <a href={`/f/${funnel.slug}${funnel.isActive ? "" : "?preview=1"}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 text-[#191c1e] hover:bg-gray-200 transition-colors">
            <span className="material-symbols-outlined text-[14px]">open_in_new</span>Aperçu
          </a>
          <button onClick={() => save({ isActive: !funnel.isActive })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${funnel.isActive ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-900 text-white hover:bg-gray-700"}`}>
            <span className="material-symbols-outlined text-[14px]">{funnel.isActive ? "check_circle" : "publish"}</span>
            {funnel.isActive ? "Publié" : "Publier"}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-5 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Steps sidebar (compacte) */}
        <aside className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-100 p-3 sticky top-20">
            <h3 className="text-[10px] font-bold text-[#5c647a] mb-2 uppercase tracking-wider">Étapes</h3>
            <div className="space-y-1">
              {funnel.steps.map((s) => {
                const info = STEP_INFO[s.stepType] ?? STEP_INFO.LANDING;
                const isActive = s.id === activeStepId;
                return (
                  <button key={s.id} onClick={() => setActiveStepId(s.id)}
                    className={`w-full flex items-center gap-2 text-left px-2 py-2 rounded-lg transition-colors ${isActive ? "bg-[#006e2f]/10" : "hover:bg-gray-50"}`}>
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${isActive ? "bg-[#006e2f] text-white" : "bg-gray-100 text-[#5c647a]"}`}>
                      <span className="material-symbols-outlined text-[14px]">{info.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[11px] font-bold truncate leading-tight ${isActive ? "text-[#006e2f]" : "text-[#191c1e]"}`}>{s.title}</p>
                      <p className="text-[9px] text-[#5c647a] leading-tight">{s.stepType}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
              <p className="text-[9px] font-bold text-[#5c647a] uppercase">URL publique</p>
              <p className="text-[10px] text-[#191c1e] tabular-nums bg-gray-50 px-2 py-1 rounded truncate">/f/{funnel.slug}</p>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
              <p className="text-[9px] font-bold text-[#5c647a] uppercase flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">local_fire_department</span>Limite de ventes
              </p>
              <div className="flex items-center gap-1.5">
                <input type="number" min="0" placeholder="∞"
                  value={funnel.salesLimit ?? ""}
                  onChange={(e) => {
                    const val = e.target.value ? parseInt(e.target.value) : null;
                    setFunnel((f) => f ? { ...f, salesLimit: val } : f);
                  }}
                  onBlur={() => save({ salesLimit: funnel.salesLimit })}
                  className="w-full px-2 py-1 text-[11px] rounded border border-gray-200 bg-white" />
              </div>
              {funnel.salesLimit !== null && funnel.salesLimit > 0 && (
                <p className="text-[9px] text-[#5c647a]">
                  {funnel.salesCount}/{funnel.salesLimit} ventes
                </p>
              )}
              {/* Theme settings */}
              <details className="mt-2 border border-gray-100 rounded-lg overflow-hidden">
                <summary className="flex items-center gap-1.5 px-2 py-1.5 text-[9px] font-bold text-[#5c647a] uppercase tracking-wider cursor-pointer hover:bg-gray-50 list-none">
                  <span className="material-symbols-outlined text-[12px]">palette</span>
                  Thème
                  <span className="ml-auto material-symbols-outlined text-[12px]">expand_more</span>
                </summary>
                <div className="px-2 pb-2 space-y-2">
                  <ColorPicker label="Couleur principale" value={funnel.theme?.primaryColor || "#006e2f"} onChange={(c) => save({ theme: { ...funnel.theme, primaryColor: c ?? "#006e2f" } })} />
                  <ColorPicker label="Couleur accent" value={funnel.theme?.accentColor || "#22c55e"} onChange={(c) => save({ theme: { ...funnel.theme, accentColor: c ?? "#22c55e" } })} />
                  <ColorPicker label="Couleur texte" value={funnel.theme?.textColor || "#191c1e"} onChange={(c) => save({ theme: { ...funnel.theme, textColor: c ?? "#191c1e" } })} />
                  <BackgroundPicker label="Fond de page" value={funnel.theme?.bgColor || "#f7f9fb"} onChange={(c) => save({ theme: { ...funnel.theme, bgColor: c ?? "#f7f9fb" } })} />
                  <div>
                    <label className="block text-[10px] font-semibold text-[#5c647a] uppercase tracking-wider mb-1">Police</label>
                    <select
                      value={funnel.theme?.font || "Manrope"}
                      onChange={(e) => save({ theme: { ...funnel.theme, font: e.target.value } })}
                      className="w-full px-2 py-1.5 text-[11px] rounded border border-gray-200 bg-white"
                    >
                      {["Manrope", "Inter", "DM Sans", "Poppins", "Montserrat", "Raleway", "Playfair Display", "Lora", "Nunito", "Space Grotesk", "Outfit", "Plus Jakarta Sans"].map((f) => (
                        <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </details>
              <button onClick={handleDelete} className="w-full mt-2 text-[10px] text-red-500 hover:text-red-700 flex items-center justify-center gap-1 py-1.5">
                <span className="material-symbols-outlined text-[12px]">delete</span>Supprimer
              </button>
            </div>
          </div>
        </aside>

        {/* Editor */}
        <main className="lg:col-span-10 space-y-4">
          {(() => {
            const info = STEP_INFO[activeStep?.stepType ?? "LANDING"] ?? STEP_INFO.LANDING;
            const applyStepTemplate = () => {
              if (!activeStep) return;
              const tpl = getStepTemplate(activeStep.stepType);
              if (blocks.length > 0) {
                setPendingTemplate({ kind: "step", data: tpl });
              } else {
                persistBlocks(tpl);
              }
            };
            const openGallery = () => setShowGallery(true);
            return (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="flex items-start gap-3 p-5" style={{ background: info.bgTint }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: info.color }}>
                    <span className="material-symbols-outlined text-white text-[22px]">{info.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: info.color }}>Étape {activeStep?.stepOrder} / 4</p>
                      <span className="text-[10px] font-semibold text-[#5c647a] bg-white/60 px-2 py-0.5 rounded-full">{activeStep?.stepType}</span>
                    </div>
                    <input type="text" value={activeStep?.title ?? ""}
                      onChange={(e) => {
                        if (!activeStep) return;
                        setFunnel((f) => f ? { ...f, steps: f.steps.map((s) => s.id === activeStep.id ? { ...s, title: e.target.value } : s) } : f);
                      }}
                      onBlur={() => activeStep && save({ steps: [{ id: activeStep.id, title: activeStep.title }] })}
                      className="text-xl font-extrabold text-[#191c1e] bg-transparent focus:outline-none focus:bg-white/50 px-2 py-0.5 rounded w-full -ml-2" />
                    <p className="text-sm font-semibold text-[#191c1e] mt-0.5">{info.title}</p>
                    <p className="text-xs text-[#5c647a] mt-0.5">{info.subtitle}</p>
                  </div>
                </div>
                <details className="border-t border-gray-100">
                  <summary className="flex items-center gap-2 px-5 py-3 text-xs font-semibold text-[#5c647a] cursor-pointer hover:bg-gray-50 list-none">
                    <span className="material-symbols-outlined text-[16px]">lightbulb</span>
                    Guide — comment utiliser cette étape
                    <span className="ml-auto material-symbols-outlined text-[16px]">expand_more</span>
                  </summary>
                  <div className="px-5 pb-4 text-xs text-[#191c1e] leading-relaxed">
                    {info.advice}
                  </div>
                </details>
                <div className="flex items-center justify-between gap-2 px-5 py-3 bg-gray-50 border-t border-gray-100 flex-wrap">
                  <p className="text-[11px] text-[#5c647a]">
                    {blocks.length === 0 ? "Aucun contenu — choisissez un template ou construisez depuis zéro." : `${blocks.length} bloc${blocks.length > 1 ? "s" : ""} sur cette étape`}
                  </p>
                  <div className="flex items-center gap-2">
                    {activeStep?.stepType === "LANDING" && (
                      <button onClick={openGallery} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-[#006e2f] border border-[#006e2f] hover:bg-[#006e2f]/5 transition-colors">
                        <span className="material-symbols-outlined text-[14px]">palette</span>
                        Galerie de templates
                      </button>
                    )}
                    <button onClick={applyStepTemplate} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white hover:opacity-90 transition-opacity" style={{ background: info.color }}>
                      <span className="material-symbols-outlined text-[14px]">auto_fix_high</span>
                      {blocks.length === 0 ? "Charger template par défaut" : "Template par défaut"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {blocks.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
              <span className="material-symbols-outlined text-gray-300 text-5xl">widgets</span>
              <p className="text-sm font-bold text-[#191c1e] mt-3">Page vierge — commencez par une rangée</p>
              <p className="text-xs text-[#5c647a] mt-1 mb-4">Choisissez d&apos;abord un layout (1, 2, 3 ou 4 colonnes), puis ajoutez des éléments dans chaque colonne.</p>
              <button onClick={() => setShowAddBlock(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}>
                <span className="material-symbols-outlined text-[16px]">add</span>Ajouter un élément
              </button>
            </div>
          ) : (
            <>
              <DndBlockCanvas
                blocks={blocks}
                onReorder={persistBlocks}
                renderBlock={(block, i) => (
                  <>
                    {/* Floating toolbar */}
                    <div className="absolute -top-3 right-4 z-10 flex items-center gap-0.5 bg-white rounded-lg shadow-md border border-gray-200 opacity-0 group-hover/block:opacity-100 transition-opacity">
                      <button onClick={() => moveBlock(i, -1)} disabled={i === 0}
                        className="p-1.5 text-[#5c647a] hover:text-[#006e2f] hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed rounded-l-lg transition-colors"
                        title="Monter">
                        <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                      </button>
                      <button onClick={() => moveBlock(i, 1)} disabled={i === blocks.length - 1}
                        className="p-1.5 text-[#5c647a] hover:text-[#006e2f] hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Descendre">
                        <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                      </button>
                      <div className="w-px h-4 bg-gray-200" />
                      <button onClick={() => duplicateBlock(i)}
                        className="p-1.5 text-[#5c647a] hover:text-[#006e2f] hover:bg-gray-50 rounded-r-lg transition-colors"
                        title="Dupliquer">
                        <span className="material-symbols-outlined text-[16px]">content_copy</span>
                      </button>
                    </div>
                    <BlockEditor block={block} onChange={(b) => updateBlock(i, b)} onDelete={() => deleteBlock(i)} />
                  </>
                )}
              />
              <button onClick={() => setShowAddBlock(true)}
                className="w-full py-3.5 rounded-2xl border-2 border-dashed border-gray-300 text-sm font-bold text-[#5c647a] hover:border-[#006e2f] hover:text-[#006e2f] transition-colors flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[18px]">add</span>Ajouter un élément
              </button>
            </>
          )}
        </main>
      </div>

      {showAddBlock && <PalettePicker onPick={addBlock} onClose={() => setShowAddBlock(false)} />}

      {/* Template gallery modal */}
      {showGallery && (
        <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowGallery(false)}>
          <div className="bg-[#fafbfd] rounded-3xl max-w-6xl w-full max-h-[94vh] overflow-hidden shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-100 bg-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-[#006e2f] text-[20px]">palette</span>
                  <h2 className="text-xl font-extrabold text-[#191c1e]">Galerie de templates</h2>
                  <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#006e2f]/10 text-[#006e2f]">6 designs</span>
                </div>
                <p className="text-xs text-[#5c647a]">Chaque template a une structure visuelle différente — survolez pour le détail, cliquez pour appliquer.</p>
              </div>
              <button onClick={() => setShowGallery(false)} className="text-[#5c647a] hover:text-[#191c1e] hover:bg-gray-100 p-2 rounded-lg transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Cards grid */}
            <div className="overflow-y-auto p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {LANDING_TEMPLATES.map((tpl) => (
                  <div key={tpl.key} className="rounded-2xl bg-white shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group border border-gray-100">
                    {/* Visual mockup preview */}
                    <div className="relative h-64 bg-gray-50 border-b border-gray-100 overflow-hidden">
                      <TemplatePreviewMockup vibe={tpl.vibe} palette={tpl.palette} preview={tpl.preview} variant={tpl.key} />
                      {/* Badge vibe + icon */}
                      <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/95 text-[#191c1e] shadow-sm backdrop-blur-sm">
                        <span className="material-symbols-outlined text-[12px]" style={{ color: tpl.palette[0] }}>{tpl.icon}</span>
                        {tpl.vibe}
                      </span>
                      {/* Palette swatches */}
                      <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white/95 rounded-full px-2 py-1 shadow-sm backdrop-blur-sm">
                        {tpl.palette.map((c, i) => (
                          <span key={i} className="w-3.5 h-3.5 rounded-full ring-1 ring-gray-200" style={{ background: c }} />
                        ))}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="text-lg font-extrabold text-[#191c1e]">{tpl.label}</h3>
                      <p className="text-xs font-semibold mt-0.5" style={{ color: tpl.palette[0] }}>{tpl.tagline}</p>
                      <p className="text-sm text-[#5c647a] mt-3 leading-relaxed">{tpl.description}</p>

                      {/* Unique sections */}
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-[10px] font-bold text-[#5c647a] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px]" style={{ color: tpl.palette[1] }}>auto_awesome</span>
                          Sections uniques de ce template
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {tpl.uniqueElements.map((el, i) => (
                            <span key={i} className="inline-block px-2.5 py-1 rounded-full text-[11px] font-medium bg-gray-50 text-[#191c1e] border border-gray-200">
                              {el}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* CTA */}
                      <button
                        onClick={() => {
                          const newBlocks = tpl.build() as unknown as Block[];
                          if (blocks.length > 0) {
                            setShowGallery(false);
                            setPendingTemplate({ kind: "landing", data: newBlocks });
                          } else {
                            persistBlocks(newBlocks);
                            setShowGallery(false);
                          }
                        }}
                        className="mt-5 w-full px-5 py-3.5 rounded-2xl text-sm font-bold text-white hover:opacity-90 hover:scale-[1.02] transition-all shadow-lg flex items-center justify-center gap-2"
                        style={{ background: tpl.preview }}
                      >
                        Utiliser ce template
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-4 border-t border-gray-100 bg-white flex items-center justify-between">
              <p className="text-xs text-[#5c647a] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">info</span>
                Images et textes sont des suggestions — tout se modifie ensuite dans l'éditeur.
              </p>
              <button onClick={() => setShowGallery(false)} className="text-xs font-semibold text-[#5c647a] hover:text-[#191c1e] px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm replacement modal */}
      <ConfirmModal
        open={pendingTemplate !== null}
        title="Remplacer le contenu actuel ?"
        message={`Cette action écrasera les ${blocks.length} bloc${blocks.length > 1 ? "s" : ""} existant${blocks.length > 1 ? "s" : ""} sur cette étape. Cette action ne peut pas être annulée.`}
        confirmLabel="Oui, remplacer"
        cancelLabel="Non, conserver"
        variant="warning"
        onConfirm={() => {
          if (pendingTemplate) persistBlocks(pendingTemplate.data);
          setPendingTemplate(null);
        }}
        onCancel={() => setPendingTemplate(null)}
      />
    </div>
  );
}
