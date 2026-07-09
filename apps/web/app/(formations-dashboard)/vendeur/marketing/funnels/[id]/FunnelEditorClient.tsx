// @ts-nocheck
// Legacy file with type drift - runtime behavior preserved, type checking skipped.

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Columns3,
  Columns2,
  Rows3,
  LayoutGrid,
  LayoutDashboard,
  LayoutTemplate,
  MousePointerClick,
  MousePointer2,
  Heading,
  Type,
  Pilcrow,
  ListChecks,
  Boxes,
  Minus,
  MoveVertical,
  Image as ImageIcon,
  Images,
  PlayCircle,
  GalleryThumbnails,
  ShoppingBag,
  Flame,
  ShieldCheck,
  Building2,
  ArrowDownToLine,
  Megaphone,
  Sparkles,
  CheckCircle2,
  BarChart3,
  TrendingUp,
  Quote,
  HelpCircle,
  Timer,
  TimerOff,
  Tag,
  GitCompare,
  BadgeCheck,
  Users,
  Code,
  Rocket,
  CreditCard,
  BadgePercent,
  PartyPopper,
  Trash2,
  Pencil,
  X,
  Info,
  Plus,
  SlidersHorizontal,
  ChevronDown,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Loader2,
  ExternalLink,
  Send,
  Palette,
  Lightbulb,
  Wand2,
  Copy,
  Gem,
  Briefcase,
  Video,
  Mail,
  Download,
  Undo2,
  Redo2,
  Monitor,
  Smartphone,
  Save,
  Music,
  MessageCircle,
  Share2,
  Star,
  type LucideIcon,
} from "lucide-react";
import { renderBlock as renderPublicBlock } from "@/app/f/[slug]/FunnelLandingClient";
import { MediaUpload } from "@/components/funnels/MediaUpload";
import { IconPicker } from "@/components/funnels/IconPicker";
import { ColorPicker, ColumnPicker } from "@/components/funnels/ColorPicker";
import { BackgroundPicker } from "@/components/funnels/BackgroundPicker";
import { ConfirmModal } from "@/components/funnels/ConfirmModal";
import { TemplatePreviewMockup } from "@/components/funnels/TemplatePreviewMockup";
import { LANDING_TEMPLATES } from "@/lib/funnels/templates";
import { confirmAction } from "@/store/confirm";

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
  | "scarcity" | "guarantee" | "logo-bar" | "alert" | "social-proof" | "comparison" | "floating-cta"
  // Lead capture (page de capture d'emails)
  | "lead-form"
  // Nouveaux éléments (v3)
  | "audio" | "badge" | "quote" | "rating" | "progress" | "whatsapp" | "social-share";

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
type BlockTpl = { label: string; icon: LucideIcon; default: Record<string, unknown>; atomic?: boolean };

const BLOCK_TEMPLATES: Record<BlockType, BlockTpl> = {
  // ─── Containers ─────────────────────────────────────────────────────────
  row: {
    label: "Rangée",
    icon: Columns3,
    default: {
      columns: [{ blocks: [] }, { blocks: [] }],
      gap: 16,
      bgColor: "",
      padding: 24,
    },
  },
  section: {
    label: "Section",
    icon: LayoutDashboard,
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
    icon: MousePointerClick,
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
    icon: Heading,
    atomic: true,
    default: { content: "Votre titre ici", level: 2, align: "left", color: "" },
  },
  text: {
    label: "Texte",
    icon: Pilcrow,
    atomic: true,
    default: { content: "Écrivez votre texte ici. Décrivez ce que vous offrez de manière claire et concise.", align: "left", size: 16, color: "" },
  },
  image: {
    label: "Image",
    icon: ImageIcon,
    atomic: true,
    default: { url: "", alt: "", align: "center", radius: 12, width: "auto" },
  },
  button: {
    label: "Bouton",
    icon: MousePointer2,
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
    icon: Boxes,
    atomic: true,
    default: { icon: "verified", title: "Un atout clé", desc: "Une brève description.", align: "center", color: "" },
  },
  divider: {
    label: "Ligne horizontale",
    icon: Minus,
    atomic: true,
    default: { style: "solid", color: "#e5e7eb", thickness: 1, width: 100 },
  },
  spacer: {
    label: "Espace",
    icon: MoveVertical,
    atomic: true,
    default: { height: 32 },
  },
  list: {
    label: "Liste à puces",
    icon: ListChecks,
    atomic: true,
    default: {
      items: ["Premier élément de la liste", "Deuxième élément", "Troisième élément"],
      icon: "check_circle",
      color: "",
    },
  },
  html: {
    label: "Code HTML",
    icon: Code,
    atomic: true,
    default: { html: "<p>Votre HTML personnalisé</p>" },
  },
  "lead-form": {
    label: "Formulaire de capture",
    icon: Mail,
    atomic: true,
    default: {
      title: "Recevez votre cadeau gratuit",
      subtitle: "Entrez votre email ci-dessous pour le recevoir immédiatement.",
      buttonText: "Je le veux !",
      collectName: true,
      collectPhone: false,
      successMessage: "C'est bon ! Surveillez votre boîte mail (et vos spams).",
      goNextStep: false,
      bgColor: "#ffffff",
      align: "center",
    },
  },
  audio: {
    label: "Audio",
    icon: Music,
    atomic: true,
    default: { url: "", title: "Écoutez ce message" },
  },
  badge: {
    label: "Pastille",
    icon: BadgeCheck,
    atomic: true,
    default: { text: "OFFRE LIMITÉE", bgColor: "", textColor: "", align: "center" },
  },
  quote: {
    label: "Citation",
    icon: Quote,
    atomic: true,
    default: { text: "Cette formation a changé ma façon de vendre. Résultats dès la première semaine.", author: "Client satisfait", role: "Entrepreneur", accentColor: "" },
  },
  rating: {
    label: "Note (étoiles)",
    icon: Star,
    atomic: true,
    default: { value: 5, text: "4,9/5 — plus de 100 avis", color: "#f59e0b", align: "center" },
  },
  progress: {
    label: "Progression",
    icon: BarChart3,
    atomic: true,
    default: { label: "Places déjà réservées", value: 80, color: "", showPercent: true },
  },
  whatsapp: {
    label: "Bouton WhatsApp",
    icon: MessageCircle,
    atomic: true,
    default: { phone: "", message: "Bonjour, je suis intéressé par votre offre", label: "Discuter sur WhatsApp", align: "center", fullWidth: false },
  },
  "social-share": {
    label: "Partage social",
    icon: Share2,
    atomic: true,
    default: { title: "Partagez cette page avec vos proches", shareText: "Découvrez cette offre !" },
  },
  product: {
    label: "Produit / Formation",
    icon: ShoppingBag,
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
    icon: PlayCircle,
    atomic: true,
    default: { externalUrl: "", caption: "" },
  },
  // ─── Ready-made sections ────────────────────────────────────────────────
  hero: {
    label: "Hero / Bannière",
    icon: LayoutTemplate,
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
    icon: CheckCircle2,
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
    icon: Timer,
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
    icon: Quote,
    default: {
      title: "Ils en parlent mieux que nous",
      columns: 2,
      items: [{ name: "Prénom Nom", role: "Métier · Ville", text: "Un témoignage authentique.", rating: 5 }],
    },
  },
  faq: {
    label: "FAQ",
    icon: HelpCircle,
    default: { title: "Questions fréquentes", items: [{ q: "Une question fréquente ?", a: "Réponse claire et rassurante." }] },
  },
  cta: {
    label: "Appel à l'action",
    icon: MousePointerClick,
    default: { headline: "Prêt à passer à l'action ?", subheadline: "Rejoignez la communauté maintenant.", ctaText: "Commencer", ctaLink: "" },
  },
  stats: {
    label: "Statistiques",
    icon: BarChart3,
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
    icon: Tag,
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
    icon: Flame,
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
    icon: ShieldCheck,
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
    icon: Building2,
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
    icon: Megaphone,
    default: {
      text: "Offre flash : -50% pendant 24h seulement !",
      variant: "warning" as "info" | "success" | "warning" | "danger",
      icon: "campaign",
      dismissible: false,
    },
  },
  "social-proof": {
    label: "Preuve sociale",
    icon: Users,
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
    icon: GitCompare,
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
    icon: ArrowDownToLine,
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
    icon: GalleryThumbnails,
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

type PaletteItem = { key: PaletteKey; label: string; icon: LucideIcon };

const PALETTE_CATEGORIES: Array<{ label: string; icon: LucideIcon; items: PaletteItem[] }> = [
  {
    label: "Mise en page", icon: LayoutDashboard, items: [
      { key: "row-1", label: "Rangée (1 col)", icon: Rows3 },
      { key: "row-2", label: "2 colonnes", icon: Columns2 },
      { key: "row-3", label: "3 colonnes", icon: Columns3 },
      { key: "row-4", label: "4 colonnes", icon: LayoutGrid },
      { key: "section", label: "Section", icon: LayoutDashboard },
      { key: "content-box", label: "Boîte de contenu", icon: MousePointerClick },
    ],
  },
  {
    label: "Contenu", icon: Type, items: [
      { key: "heading", label: "Titre", icon: Heading },
      { key: "text", label: "Texte", icon: Pilcrow },
      { key: "list", label: "Liste à puces", icon: ListChecks },
      { key: "icon-box", label: "Boîte à icône", icon: Boxes },
      { key: "badge", label: "Pastille", icon: BadgeCheck },
      { key: "quote", label: "Citation", icon: Quote },
      { key: "rating", label: "Note (étoiles)", icon: Star },
      { key: "progress", label: "Progression", icon: BarChart3 },
      { key: "divider", label: "Ligne", icon: Minus },
      { key: "spacer", label: "Espace", icon: MoveVertical },
    ],
  },
  {
    label: "Média", icon: Images, items: [
      { key: "image", label: "Image", icon: ImageIcon },
      { key: "video", label: "Vidéo", icon: PlayCircle },
      { key: "audio", label: "Audio", icon: Music },
      { key: "image-gallery", label: "Galerie", icon: GalleryThumbnails },
    ],
  },
  {
    label: "Conversion", icon: MousePointerClick, items: [
      { key: "button", label: "Bouton", icon: MousePointer2 },
      { key: "lead-form", label: "Formulaire (capture)", icon: Mail },
      { key: "whatsapp", label: "Bouton WhatsApp", icon: MessageCircle },
      { key: "social-share", label: "Partage social", icon: Share2 },
      { key: "product", label: "Produit / Formation", icon: ShoppingBag },
      { key: "scarcity", label: "Rareté / Limite", icon: Flame },
      { key: "guarantee", label: "Garantie", icon: ShieldCheck },
      { key: "floating-cta", label: "CTA flottant", icon: ArrowDownToLine },
      { key: "alert", label: "Alerte / Bannière", icon: Megaphone },
    ],
  },
  {
    label: "Sections prêtes", icon: Sparkles, items: [
      { key: "hero", label: "Hero / Bannière", icon: LayoutTemplate },
      { key: "features", label: "Bénéfices", icon: CheckCircle2 },
      { key: "stats", label: "Statistiques", icon: BarChart3 },
      { key: "testimonials", label: "Témoignages", icon: Quote },
      { key: "faq", label: "FAQ", icon: HelpCircle },
      { key: "countdown", label: "Countdown", icon: Timer },
      { key: "cta", label: "Appel à l'action", icon: MousePointerClick },
      { key: "pricing", label: "Pricing", icon: Tag },
      { key: "comparison", label: "Comparatif", icon: GitCompare },
    ],
  },
  {
    label: "Confiance", icon: BadgeCheck, items: [
      { key: "logo-bar", label: "Barre de logos", icon: Building2 },
      { key: "social-proof", label: "Preuve sociale", icon: Users },
    ],
  },
  { label: "Avancé", icon: Code, items: [{ key: "html", label: "Code HTML", icon: Code }] },
];

// Which palette keys are allowed inside a column (no infinite nesting: no row/section inside column)
const COLUMN_ALLOWED_KEYS: PaletteKey[] = [
  "heading", "text", "image", "button", "icon-box", "divider", "spacer", "list", "video", "html", "product", "content-box", "lead-form",
  "audio", "badge", "quote", "rating", "progress", "whatsapp",
];

// Dans une SECTION ou une BOÎTE (slot), on autorise en plus les rangées de
// colonnes — une section contient typiquement des rangées (façon Système.io).
const SLOT_ALLOWED_KEYS: PaletteKey[] = [...COLUMN_ALLOWED_KEYS, "row-1", "row-2", "row-3", "row-4"];

// Cible de dépôt sous le pointeur (drag depuis la palette) :
//  - colonne de rangée ou slot de section/boîte — le plus PROFOND des deux gagne
//  - le CORPS d'une section/boîte (paddings, marges internes) cible aussi son
//    slot : sans ça, déposer sur 80 % de la surface visible d'une section
//    insérait AVANT/APRÈS au lieu de DEDANS.
function dropTargetFromEvent(t: HTMLElement | null): { owner: string; col: number } | null {
  if (!t || !t.closest) return null;
  const colEl = t.closest("[data-nk-col]") as HTMLElement | null;
  const slotEl = t.closest("[data-nk-slot]") as HTMLElement | null;
  if (colEl && (!slotEl || slotEl.contains(colEl))) {
    return { owner: colEl.getAttribute("data-nk-owner") || "", col: Number(colEl.getAttribute("data-nk-col") || 0) };
  }
  if (slotEl && slotEl.getAttribute("data-nk-slot")) {
    return { owner: slotEl.getAttribute("data-nk-slot") || "", col: -1 };
  }
  const blkEl = t.closest("[data-nk-block]") as HTMLElement | null;
  const ownId = blkEl?.getAttribute("data-nk-block") || "";
  if (blkEl && ownId && blkEl.querySelector(`[data-nk-slot="${ownId}"]`)) {
    return { owner: ownId, col: -1 };
  }
  return null;
}

// Étapes du tunnel courant (posées par le composant principal) — permet à
// l'inspecteur des boutons de proposer « Aller à l'étape N » sans prop drilling.
let EDITOR_STEPS: Array<{ title: string }> = [];

// Pour le DÉPLACEMENT d'éléments existants, on filtre par TYPE de bloc
// (les clés palette "row-2"… correspondent toutes au type "row").
const COLUMN_ALLOWED_TYPES: string[] = COLUMN_ALLOWED_KEYS as string[];
const SLOT_ALLOWED_TYPES: string[] = [...COLUMN_ALLOWED_TYPES, "row"];

// Interdit de déposer un conteneur dans lui-même ou dans sa propre descendance.
function isSelfOrDescendant(list: Block[], moveId: string, ownerId: string): boolean {
  if (moveId === ownerId) return true;
  const blk = treeFind(list, moveId);
  return !!(blk && treeFind([blk], ownerId));
}

// Déplace un bloc existant (où qu'il soit) DANS une colonne (colIdx ≥ 0)
// ou dans le slot d'une section/boîte (colIdx = -1).
function treeMoveToColumn(list: Block[], moveId: string, ownerId: string, colIdx: number): Block[] {
  const blk = treeFind(list, moveId);
  if (!blk || isSelfOrDescendant(list, moveId, ownerId)) return list;
  const without = treeRemove(list, moveId);
  return colIdx === -1 ? treeInsertIntoSlot(without, ownerId, blk) : treeInsertIntoColumn(without, ownerId, colIdx, blk);
}

// Déplace un bloc existant (où qu'il soit) au NIVEAU PAGE, à l'index donné —
// gère aussi la sortie d'une colonne/section vers la page.
function treeMoveToIndex(list: Block[], moveId: string, index: number): Block[] {
  const blk = treeFind(list, moveId);
  if (!blk) return list;
  const topIdx = list.findIndex((b) => b.id === moveId);
  const without = treeRemove(list, moveId);
  let t = index;
  if (topIdx !== -1 && topIdx < index) t = index - 1; // l'index se décale après retrait
  t = Math.max(0, Math.min(without.length, t));
  return [...without.slice(0, t), blk, ...without.slice(t)];
}

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
  icon: LucideIcon;
  color: string;
  bgTint: string;
  title: string;
  subtitle: string;
  advice: string;
  templateLabel: string;
};

// ═══════════════════════════════════════════════════════════════════════════
// ARBRE DE BLOCS — les conteneurs (row/section/content-box) portent des
// enfants. Ces helpers permettent de sélectionner/modifier/supprimer un bloc
// N'IMPORTE OÙ dans la hiérarchie (clic direct sur la page, façon Système.io).
// ═══════════════════════════════════════════════════════════════════════════
function childListsOf(b: Block): Block[][] {
  if (b.type === "row") return ((b.data.columns as Array<{ blocks: Block[] }>) ?? []).map((c) => c.blocks ?? []);
  if (b.type === "section" || b.type === "content-box") return [((b.data.blocks as Block[]) ?? [])];
  return [];
}

function treeFind(list: Block[], id: string): Block | null {
  for (const b of list) {
    if (b.id === id) return b;
    for (const kids of childListsOf(b)) {
      const found = treeFind(kids, id);
      if (found) return found;
    }
  }
  return null;
}

// Chemin racine → bloc (fil d'Ariane « Page › Rangée › Texte »).
function treePath(list: Block[], id: string): Block[] {
  for (const b of list) {
    if (b.id === id) return [b];
    for (const kids of childListsOf(b)) {
      const p = treePath(kids, id);
      if (p.length) return [b, ...p];
    }
  }
  return [];
}

function mapChildren(b: Block, fn: (kids: Block[]) => Block[]): Block {
  if (b.type === "row") {
    const cols = ((b.data.columns as Array<{ blocks: Block[] }>) ?? []).map((c) => ({ ...c, blocks: fn(c.blocks ?? []) }));
    return { ...b, data: { ...b.data, columns: cols } };
  }
  if (b.type === "section" || b.type === "content-box") {
    return { ...b, data: { ...b.data, blocks: fn((b.data.blocks as Block[]) ?? []) } };
  }
  return b;
}

function treeUpdate(list: Block[], id: string, next: Block): Block[] {
  return list.map((b) => {
    if (b.id === id) return next;
    return mapChildren(b, (kids) => treeUpdate(kids, id, next));
  });
}

function treeRemove(list: Block[], id: string): Block[] {
  return list.filter((b) => b.id !== id).map((b) => mapChildren(b, (kids) => treeRemove(kids, id)));
}

function treeInsertIntoSlot(list: Block[], ownerId: string, nb: Block): Block[] {
  return list.map((b) => {
    if (b.id === ownerId && (b.type === "section" || b.type === "content-box")) {
      return { ...b, data: { ...b.data, blocks: [...((b.data.blocks as Block[]) ?? []), nb] } };
    }
    return mapChildren(b, (kids) => treeInsertIntoSlot(kids, ownerId, nb));
  });
}

function treeInsertIntoColumn(list: Block[], ownerId: string, colIdx: number, nb: Block): Block[] {
  return list.map((b) => {
    if (b.id === ownerId && b.type === "row") {
      const cols = ((b.data.columns as Array<{ blocks: Block[] }>) ?? []).map((c, i) =>
        i === colIdx ? { ...c, blocks: [...(c.blocks ?? []), nb] } : c,
      );
      return { ...b, data: { ...b.data, columns: cols } };
    }
    return mapChildren(b, (kids) => treeInsertIntoColumn(kids, ownerId, colIdx, nb));
  });
}

const STEP_INFO: Record<string, StepInfo> = {
  CAPTURE: {
    icon: Mail,
    color: "#7c3aed",
    bgTint: "#7c3aed0D",
    title: "Page de capture",
    subtitle: "Collectez les emails de vos visiteurs en échange d'un cadeau (guide, vidéo, checklist…)",
    advice: "Une page de capture efficace = UNE promesse claire + UN formulaire. Offrez quelque chose de gratuit (ebook, checklist, mini-vidéo) contre l'email. Pas de menu, pas de distraction : un titre fort, 2-3 bénéfices, le formulaire. Vos leads apparaissent dans le bouton « Leads » en haut de l'éditeur.",
    templateLabel: "Template page de capture",
  },
  LANDING: {
    icon: Rocket,
    color: "#006e2f",
    bgTint: "#006e2f0D",
    title: "Page de vente publique",
    subtitle: "C'est là où les visiteurs arrivent depuis vos pubs, emails, réseaux sociaux",
    advice: "Construisez une page qui convainc d'acheter : titre accrocheur, bénéfices clairs, preuve sociale (témoignages), pricing, FAQ. Les boutons d'achat redirigent automatiquement vers le checkout.",
    templateLabel: "Template page de vente complète",
  },
  PRODUCT: {
    icon: CreditCard,
    color: "#2563eb",
    bgTint: "#2563eb0D",
    title: "Checkout (paiement)",
    subtitle: "Le paiement est géré par la plateforme — cette étape est optionnelle",
    advice: "Les visiteurs seront automatiquement redirigés vers /formations/checkout pour payer. Vous pouvez laisser cette étape VIDE, ou ajouter du contenu de rassurance (badges sécurité, garantie) affiché avant le paiement.",
    templateLabel: "Template page de rassurance pré-paiement",
  },
  UPSELL: {
    icon: BadgePercent,
    color: "#f59e0b",
    bgTint: "#f59e0b0D",
    title: "Offre complémentaire (upsell)",
    subtitle: "Après paiement, avant la page Merci — propose un add-on en 1 clic",
    advice: "Proposez UN produit complémentaire avec une remise (-30% à -50%). Le client a déjà payé, ajouter plus est facile. Utilisez : un titre urgent + bloc Produit + 2 boutons clairs (OUI j'ajoute / Non merci). Peut augmenter votre panier moyen de 20-40%.",
    templateLabel: "Template offre upsell urgente",
  },
  THANK_YOU: {
    icon: PartyPopper,
    color: "#16a34a",
    bgTint: "#16a34a0D",
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
    case "CAPTURE":
      return [
        { id: newBlockId(), type: "heading", data: { content: "Téléchargez votre guide GRATUIT", level: 1, align: "center", color: "" } },
        { id: newBlockId(), type: "text", data: { content: "Découvrez la méthode pas à pas pour obtenir [résultat] — sans [obstacle]. Entrez votre email ci-dessous et recevez-le immédiatement.", align: "center", size: 18, color: "" } },
        { id: newBlockId(), type: "list", data: { items: ["Le plan d'action complet, étape par étape", "Les erreurs à éviter absolument", "Applicable dès aujourd'hui, même en partant de zéro"], icon: "check_circle", color: "#7c3aed" } },
        { id: newBlockId(), type: "lead-form", data: { title: "Où doit-on l'envoyer ?", subtitle: "Recevez le guide directement dans votre boîte mail.", buttonText: "Recevoir le guide gratuit", collectName: true, collectPhone: false, successMessage: "C'est bon ! Surveillez votre boîte mail (et vos spams).", goNextStep: false, bgColor: "#ffffff", align: "center" } },
        { id: newBlockId(), type: "social-proof", data: { text: "Déjà téléchargé par des centaines de personnes", avatars: 5, rating: 5 } },
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

// Maps LANDING_TEMPLATES badge icon strings (material-symbol names) to Lucide components
const TEMPLATE_BADGE_ICONS: Record<string, LucideIcon> = {
  diamond: Gem,
  local_fire_department: Flame,
  rocket_launch: Rocket,
  business_center: Briefcase,
  palette: Palette,
  videocam: Video,
};

// ═══════════════════════════════════════════════════════════════════════════
// INPUT PRIMITIVES
// ═══════════════════════════════════════════════════════════════════════════
function StringInput({ label, value, onChange, multiline, placeholder }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean; placeholder?: string }) {
  return (
    <div className="min-w-0">
      <label className="block text-[9px] font-semibold text-[#5c647a] uppercase tracking-wide leading-snug mb-1">{label}</label>
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

// Input texte qui ne committe qu'au BLUR (pour les champs qui déclenchent une
// sauvegarde serveur — évite un PATCH par frappe).
function DeferredStringInput({ label, value, onCommit, multiline, placeholder }: { label: string; value: string; onCommit: (v: string) => void; multiline?: boolean; placeholder?: string }) {
  const [v, setV] = useState(value ?? "");
  useEffect(() => { setV(value ?? ""); }, [value]);
  const commit = () => { if (v !== (value ?? "")) onCommit(v); };
  const cls = "w-full text-sm text-[#191c1e] placeholder-gray-400 bg-white px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f]";
  return (
    <div className="min-w-0">
      <label className="block text-[9px] font-semibold text-[#5c647a] uppercase tracking-wide leading-snug mb-1">{label}</label>
      {multiline ? (
        <textarea value={v} onChange={(e) => setV(e.target.value)} onBlur={commit} rows={3} placeholder={placeholder} className={`${cls} resize-none`} />
      ) : (
        <input type="text" value={v} onChange={(e) => setV(e.target.value)} onBlur={commit} placeholder={placeholder} className={cls} />
      )}
    </div>
  );
}

function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="min-w-0">
      <label className="block text-[9px] font-semibold text-[#5c647a] uppercase tracking-wide leading-snug mb-1">{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="w-full text-sm text-[#191c1e] bg-white px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f]" />
    </div>
  );
}

function SliderInput({ label, value, min, max, step = 1, unit, onChange }: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void }) {
  return (
    <div className="min-w-0">
      <label className="block text-[9px] font-semibold text-[#5c647a] uppercase tracking-wide leading-snug mb-1">
        {label}{unit ? <span className="text-gray-400 normal-case"> ({unit})</span> : null}
      </label>
      <div className="flex items-center gap-2">
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 min-w-0 h-1.5 accent-[#006e2f] cursor-pointer" />
        <input type="number" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-12 flex-shrink-0 text-[11px] text-right text-[#191c1e] bg-white px-1 py-1 rounded-md border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#006e2f]/30 focus:border-[#006e2f] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
      </div>
    </div>
  );
}

function SelectInput<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: Array<{ value: T; label: string }>; onChange: (v: T) => void }) {
  const asDropdown = options.length > 3 || options.reduce((n, o) => n + o.label.length, 0) > 18;
  return (
    <div className="min-w-0">
      <label className="block text-[9px] font-semibold text-[#5c647a] uppercase tracking-wide leading-snug mb-1">{label}</label>
      {asDropdown ? (
        <select value={value} onChange={(e) => onChange(e.target.value as T)}
          className="w-full text-xs font-semibold text-[#191c1e] bg-white px-2.5 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f] cursor-pointer">
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ) : (
        <div className="flex flex-wrap gap-1">
          {options.map((o) => (
            <button key={o.value} onClick={() => onChange(o.value)}
              className={`flex-1 whitespace-nowrap px-2 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${value === o.value ? "border-[#006e2f] bg-[#006e2f]/5 text-[#006e2f]" : "border-gray-200 bg-white text-[#5c647a] hover:border-gray-300"}`}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ListEditor<T extends Record<string, unknown>>({ label, items, template, onChange, renderItem }: { label: string; items: T[]; template: T; onChange: (items: T[]) => void; renderItem: (item: T, update: (patch: Partial<T>) => void) => React.ReactNode }) {
  return (
    <div className="min-w-0">
      <label className="block text-[9px] font-semibold text-[#5c647a] uppercase tracking-wide leading-snug mb-2">{label}</label>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-[#5c647a]">#{i + 1}</span>
              <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-700">
                <Trash2 size={16} />
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
            <X size={24} />
          </button>
        </div>
        <div className="overflow-y-auto px-7 py-5 space-y-6">
          {categories.map((cat) => {
            const CatIcon = cat.icon;
            return (
            <div key={cat.label}>
              <div className="flex items-center gap-2 mb-2.5">
                <CatIcon size={16} className="text-[#006e2f]" />
                <h3 className="text-xs font-bold text-[#5c647a] uppercase tracking-wider">{cat.label}</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-2.5">
                {cat.items.map((item) => {
                  const ItemIcon = item.icon;
                  return (
                  <button key={item.key} onClick={() => onPick(item.key)}
                    className="bg-[#f7f9fb] rounded-2xl p-3 text-left hover:bg-[#006e2f]/5 hover:ring-2 hover:ring-[#006e2f]/30 transition-all group">
                    <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center mb-2 group-hover:bg-[#006e2f]/10 transition-colors">
                      <ItemIcon size={18} className="text-[#006e2f]" />
                    </div>
                    <p className="text-xs font-bold text-[#191c1e] leading-tight">{item.label}</p>
                  </button>
                  );
                })}
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ATOMIC BLOCK EDITORS
// ═══════════════════════════════════════════════════════════════════════════
const ALIGN_OPTS = [{ value: "left" as const, label: "Gauche" }, { value: "center" as const, label: "Centre" }, { value: "right" as const, label: "Droite" }];

// Polices disponibles (mêmes que le thème du tunnel) — chargées à la volée
// dans l'éditeur pour un aperçu fidèle.
const FONT_FAMILIES = ["Manrope", "Inter", "DM Sans", "Poppins", "Montserrat", "Raleway", "Playfair Display", "Lora", "Nunito", "Space Grotesk", "Outfit", "Plus Jakarta Sans"];

const FONT_WEIGHT_OPTS = [
  { value: "0", label: "Auto" },
  { value: "300", label: "Fin" },
  { value: "400", label: "Normal" },
  { value: "500", label: "Médium" },
  { value: "600", label: "Semi-gras" },
  { value: "700", label: "Gras" },
  { value: "800", label: "Très gras" },
];

// Panneau typographie façon Système.io : police, graisse, hauteur de ligne,
// espacement des lettres — partagé entre Titre et Texte.
function TypographyControls({ data, update }: { data: Record<string, unknown>; update: (d: Record<string, unknown>) => void }) {
  return (
    <>
      <SelectInput label="Police" value={(data.font as string) ?? ""} options={[{ value: "", label: "Police du thème" }, ...FONT_FAMILIES.map((f) => ({ value: f, label: f }))]} onChange={(v) => update({ font: v })} />
      <SelectInput label="Graisse" value={String(data.weight ?? 0)} options={FONT_WEIGHT_OPTS} onChange={(v) => update({ weight: Number(v) })} />
      <SliderInput label="Hauteur de ligne (0 = auto)" unit="×" min={0} max={2.5} step={0.05} value={Number(data.lineHeight ?? 0)} onChange={(v) => update({ lineHeight: v })} />
      <SliderInput label="Espacement des lettres" unit="px" min={-3} max={10} step={0.5} value={Number(data.letterSpacing ?? 0)} onChange={(v) => update({ letterSpacing: v })} />
    </>
  );
}

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
          <SliderInput label="Taille (0 = auto)" unit="px" min={0} max={96} value={Number(block.data.size ?? 0)} onChange={(v) => update({ size: v })} />
          <TypographyControls data={block.data} update={update} />
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
            <SliderInput label="Taille" unit="px" min={10} max={72} value={(block.data.size as number) ?? 16} onChange={(v) => update({ size: v })} />
          </div>
          <TypographyControls data={block.data} update={update} />
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
            <SliderInput label="Arrondi" unit="px" min={0} max={60} value={(block.data.radius as number) ?? 12} onChange={(v) => update({ radius: v })} />
          </div>
        </div>
      );
    case "button": {
      const curLink = (block.data.link as string) ?? "";
      const stepValues = EDITOR_STEPS.map((_, i) => `#etape-${i + 1}`);
      const actionValue = curLink === "#etape-suivante" ? "#etape-suivante" : stepValues.includes(curLink) ? curLink : "custom";
      return (
        <div className="space-y-2.5">
          <StringInput label="Texte du bouton" value={(block.data.text as string) ?? ""} onChange={(v) => update({ text: v })} />
          <SelectInput label="Action au clic" value={actionValue} options={[
            { value: "custom", label: "URL personnalisée" },
            { value: "#etape-suivante", label: "→ Étape suivante du tunnel" },
            ...EDITOR_STEPS.map((s, i) => ({ value: `#etape-${i + 1}`, label: `Étape ${i + 1} — ${s.title}` })),
          ]} onChange={(v) => update({ link: v === "custom" ? "" : v })} />
          {actionValue === "custom" && (
            <>
              <StringInput label="Lien (URL de destination) *" value={curLink} onChange={(v) => update({ link: v })} placeholder="https://... ou /formations/explorer" />
              <p className="text-[10px] text-[#5c647a] -mt-1.5">URL externe, interne (commence par /), ou #ancre-sur-cette-page</p>
            </>
          )}
          <div>
            <label className="block text-[9px] font-semibold text-[#5c647a] uppercase tracking-wide leading-snug mb-1">Icône (optionnel)</label>
            <IconPicker value={(block.data.icon as string) ?? ""} onChange={(ic) => update({ icon: ic })} />
          </div>
          <SelectInput label="Style" value={(block.data.style as string) ?? "primary"} options={[{ value: "primary", label: "Plein" }, { value: "outline", label: "Contour" }, { value: "secondary", label: "Secondaire" }]} onChange={(v) => update({ style: v })} />
          <div className="grid grid-cols-2 gap-2">
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
    }
    case "icon-box":
      return (
        <div className="space-y-2.5">
          <div>
            <label className="block text-[9px] font-semibold text-[#5c647a] uppercase tracking-wide leading-snug mb-1">Icône</label>
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
              <SliderInput label="Épaisseur" unit="px" min={1} max={20} value={(block.data.thickness as number) ?? 1} onChange={(v) => update({ thickness: v })} />
              <SliderInput label="Largeur" unit="%" min={10} max={100} value={(block.data.width as number) ?? 100} onChange={(v) => update({ width: v })} />
            </div>
          )}
          {((block.data.shape as string) ?? "line") !== "line" && (
            <SliderInput label="Hauteur" unit="px" min={20} max={300} value={(block.data.height as number) ?? 60} onChange={(v) => update({ height: v })} />
          )}
          <ColorPicker label="Couleur" value={(block.data.color as string) ?? "#e5e7eb"} onChange={(c) => update({ color: c ?? "#e5e7eb" })} />
          <div className="flex items-center gap-3">
            <label className="text-[9px] font-semibold text-[#5c647a] uppercase tracking-wide leading-snug">Inverser</label>
            <button onClick={() => update({ flip: !block.data.flip })}
              className={`w-9 h-5 rounded-full transition-colors relative ${block.data.flip ? "bg-[#006e2f]" : "bg-gray-300"}`}>
              <span className={`block w-4 h-4 rounded-full bg-white shadow absolute top-0.5 transition-all ${block.data.flip ? "left-4" : "left-0.5"}`} />
            </button>
          </div>
        </div>
      );
    case "spacer":
      return <SliderInput label="Hauteur" unit="px" min={20} max={300} value={(block.data.height as number) ?? 32} onChange={(v) => update({ height: v })} />;
    case "list":
      return (
        <div className="space-y-2.5">
          <div>
            <label className="block text-[9px] font-semibold text-[#5c647a] uppercase tracking-wide leading-snug mb-1">Icône de puce</label>
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
    case "lead-form":
      return (
        <div className="space-y-2.5">
          <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 text-[10px] text-purple-800 flex items-start gap-1">
            <Info size={12} className="mt-0.5 flex-shrink-0" />
            Les emails collectés apparaissent dans le bouton « Leads » en haut de l&apos;éditeur (export CSV possible).
          </div>
          <StringInput label="Titre du formulaire" value={(block.data.title as string) ?? ""} onChange={(v) => update({ title: v })} />
          <StringInput label="Sous-titre" value={(block.data.subtitle as string) ?? ""} onChange={(v) => update({ subtitle: v })} multiline />
          <StringInput label="Texte du bouton" value={(block.data.buttonText as string) ?? ""} onChange={(v) => update({ buttonText: v })} />
          <div className="grid grid-cols-2 gap-2">
            <SelectInput label="Champ prénom" value={(block.data.collectName ? "oui" : "non")} options={[{ value: "oui", label: "Afficher" }, { value: "non", label: "Masquer" }]} onChange={(v) => update({ collectName: v === "oui" })} />
            <SelectInput label="Champ téléphone" value={(block.data.collectPhone ? "oui" : "non")} options={[{ value: "oui", label: "Afficher" }, { value: "non", label: "Masquer" }]} onChange={(v) => update({ collectPhone: v === "oui" })} />
          </div>
          {/* Champs personnalisés ILLIMITÉS — le vendeur ajoute ce qu'il veut */}
          <ListEditor
            label="Champs personnalisés (illimités)"
            items={(block.data.fields as Array<{ label: string; type: string; required?: boolean; placeholder?: string }>) ?? []}
            template={{ label: "Votre question", type: "text", required: false, placeholder: "" }}
            onChange={(items) => update({ fields: items })}
            renderItem={(item, patch) => (
              <div className="space-y-2">
                <StringInput label="Libellé du champ" value={item.label} onChange={(v) => patch({ label: v })} />
                <div className="grid grid-cols-2 gap-2">
                  <SelectInput label="Type" value={item.type ?? "text"} options={[
                    { value: "text", label: "Texte" },
                    { value: "textarea", label: "Texte long" },
                    { value: "tel", label: "Téléphone" },
                    { value: "number", label: "Nombre" },
                  ]} onChange={(v) => patch({ type: v })} />
                  <SelectInput label="Obligatoire" value={item.required ? "oui" : "non"} options={[{ value: "non", label: "Non" }, { value: "oui", label: "Oui" }]} onChange={(v) => patch({ required: v === "oui" })} />
                </div>
                <StringInput label="Placeholder (optionnel)" value={item.placeholder ?? ""} onChange={(v) => patch({ placeholder: v })} />
              </div>
            )}
          />
          <SelectInput label="Après l'envoi" value={(block.data.goNextStep ? "next" : "message")} options={[{ value: "message", label: "Afficher le message de succès" }, { value: "next", label: "Aller à l'étape suivante" }]} onChange={(v) => update({ goNextStep: v === "next" })} />
          <StringInput label="Message de succès" value={(block.data.successMessage as string) ?? ""} onChange={(v) => update({ successMessage: v })} multiline />
          <div className="grid grid-cols-2 gap-2">
            <SelectInput label="Confettis au succès 🎉" value={block.data.confetti === false ? "non" : "oui"} options={[{ value: "oui", label: "Oui" }, { value: "non", label: "Non" }]} onChange={(v) => update({ confetti: v === "oui" })} />
            <SelectInput label="Alignement" value={(block.data.align as string) ?? "center"} options={ALIGN_OPTS} onChange={(v) => update({ align: v })} />
          </div>
          <ColorPicker label="Fond de la carte" value={(block.data.bgColor as string) ?? null} onChange={(c) => update({ bgColor: c })} />
        </div>
      );
    case "audio":
      return (
        <div className="space-y-2.5">
          <MediaUpload label="Fichier audio (MP3) ou URL" value={(block.data.url as string) ?? null} onChange={(url) => update({ url })} accept="audio" aspectRatio="auto" />
          <StringInput label="URL directe (alternative)" value={(block.data.url as string) ?? ""} onChange={(v) => update({ url: v })} placeholder="https://…/audio.mp3" />
          <StringInput label="Titre au-dessus du lecteur" value={(block.data.title as string) ?? ""} onChange={(v) => update({ title: v })} />
        </div>
      );
    case "badge":
      return (
        <div className="space-y-2.5">
          <StringInput label="Texte de la pastille" value={(block.data.text as string) ?? ""} onChange={(v) => update({ text: v })} />
          <div className="grid grid-cols-2 gap-2">
            <ColorPicker label="Fond" value={(block.data.bgColor as string) ?? null} onChange={(c) => update({ bgColor: c })} />
            <ColorPicker label="Texte" value={(block.data.textColor as string) ?? null} onChange={(c) => update({ textColor: c })} />
          </div>
          <SelectInput label="Alignement" value={(block.data.align as string) ?? "center"} options={ALIGN_OPTS} onChange={(v) => update({ align: v })} />
        </div>
      );
    case "quote":
      return (
        <div className="space-y-2.5">
          <StringInput label="Citation" value={(block.data.text as string) ?? ""} onChange={(v) => update({ text: v })} multiline />
          <div className="grid grid-cols-2 gap-2">
            <StringInput label="Auteur" value={(block.data.author as string) ?? ""} onChange={(v) => update({ author: v })} />
            <StringInput label="Rôle / titre" value={(block.data.role as string) ?? ""} onChange={(v) => update({ role: v })} />
          </div>
          <ColorPicker label="Couleur d'accent" value={(block.data.accentColor as string) ?? null} onChange={(c) => update({ accentColor: c })} />
        </div>
      );
    case "rating":
      return (
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <NumberInput label="Note (0 à 5)" value={(block.data.value as number) ?? 5} onChange={(v) => update({ value: Math.max(0, Math.min(5, v)) })} />
            <ColorPicker label="Couleur des étoiles" value={(block.data.color as string) ?? "#f59e0b"} onChange={(c) => update({ color: c })} />
          </div>
          <StringInput label="Texte à côté" value={(block.data.text as string) ?? ""} onChange={(v) => update({ text: v })} placeholder="4,9/5 — plus de 100 avis" />
          <SelectInput label="Alignement" value={(block.data.align as string) ?? "center"} options={ALIGN_OPTS} onChange={(v) => update({ align: v })} />
        </div>
      );
    case "progress":
      return (
        <div className="space-y-2.5">
          <StringInput label="Libellé" value={(block.data.label as string) ?? ""} onChange={(v) => update({ label: v })} placeholder="Places déjà réservées" />
          <div className="grid grid-cols-2 gap-2">
            <SliderInput label="Valeur" unit="%" min={0} max={100} value={(block.data.value as number) ?? 70} onChange={(v) => update({ value: Math.max(0, Math.min(100, v)) })} />
            <ColorPicker label="Couleur" value={(block.data.color as string) ?? null} onChange={(c) => update({ color: c })} />
          </div>
          <SelectInput label="Afficher le %" value={block.data.showPercent === false ? "non" : "oui"} options={[{ value: "oui", label: "Oui" }, { value: "non", label: "Non" }]} onChange={(v) => update({ showPercent: v === "oui" })} />
        </div>
      );
    case "whatsapp":
      return (
        <div className="space-y-2.5">
          <StringInput label="Numéro WhatsApp (avec indicatif)" value={(block.data.phone as string) ?? ""} onChange={(v) => update({ phone: v })} placeholder="22957335726" />
          <StringInput label="Message pré-rempli" value={(block.data.message as string) ?? ""} onChange={(v) => update({ message: v })} multiline />
          <StringInput label="Texte du bouton" value={(block.data.label as string) ?? ""} onChange={(v) => update({ label: v })} />
          <div className="grid grid-cols-2 gap-2">
            <SelectInput label="Alignement" value={(block.data.align as string) ?? "center"} options={ALIGN_OPTS} onChange={(v) => update({ align: v })} />
            <SelectInput label="Pleine largeur" value={block.data.fullWidth ? "oui" : "non"} options={[{ value: "non", label: "Non" }, { value: "oui", label: "Oui" }]} onChange={(v) => update({ fullWidth: v === "oui" })} />
          </div>
        </div>
      );
    case "social-share":
      return (
        <div className="space-y-2.5">
          <StringInput label="Titre au-dessus des boutons" value={(block.data.title as string) ?? ""} onChange={(v) => update({ title: v })} />
          <StringInput label="Texte partagé (WhatsApp / X)" value={(block.data.shareText as string) ?? ""} onChange={(v) => update({ shareText: v })} multiline />
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-[10px] text-blue-800 flex items-start gap-1">
            <Info size={12} className="mt-0.5 flex-shrink-0" />
            Boutons WhatsApp, Facebook et X — le lien partagé est l&apos;URL publique de ce tunnel.
          </div>
        </div>
      );
    case "video":
      return (
        <div className="space-y-2.5">
          <StringInput label="Lien vidéo (YouTube, Vimeo, ou MP4)" value={(block.data.externalUrl as string) ?? ""} onChange={(v) => update({ externalUrl: v })} placeholder="https://www.youtube.com/watch?v=..." />
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-[10px] text-blue-800 flex items-start gap-1">
            <Info size={12} className="mt-0.5 flex-shrink-0" />
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
                  <label className="block text-[9px] font-semibold text-[#5c647a] uppercase tracking-wide leading-snug mb-1">Icône</label>
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
              <label className="block text-[9px] font-semibold text-[#5c647a] uppercase tracking-wide leading-snug mb-1">Date de fin</label>
              <input type="datetime-local" value={(block.data.endsAt as string) ?? ""}
                onChange={(e) => update({ endsAt: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
            </div>
          )}
          {cdMode === "per_visitor" && (
            <NumberInput label="Durée/visiteur (min)" value={(block.data.durationMinutes as number) ?? 30} onChange={(v) => update({ durationMinutes: v })} />
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
              <TimerOff size={14} />
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
                  <label className="block text-[9px] font-semibold text-[#5c647a] uppercase tracking-wide leading-snug mb-1">Icône (optionnel)</label>
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
            <label className="block text-[9px] font-semibold text-[#5c647a] uppercase tracking-wide leading-snug mb-1">Icône des avantages</label>
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
            <label className="text-[9px] font-semibold text-[#5c647a] uppercase tracking-wide leading-snug">Barre de progression</label>
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
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-[10px] text-amber-800 flex items-start gap-1">
            <Info size={12} className="mt-0.5 flex-shrink-0" />
            La limite se configure dans les paramètres du funnel (salesLimit). Le compteur se met à jour automatiquement.
          </div>
        </div>
      );
    case "guarantee":
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-[9px] font-semibold text-[#5c647a] uppercase tracking-wide leading-snug mb-1">Icône</label>
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
                  <div><label className="block text-[9px] font-semibold text-[#5c647a] uppercase tracking-wide leading-snug mb-1">Icône</label><IconPicker value={item.icon ?? "star"} onChange={(ic) => patch({ icon: ic })} /></div>
                )}
              </div>
            )}
          />
          <div className="flex items-center gap-3">
            <label className="text-[9px] font-semibold text-[#5c647a] uppercase tracking-wide leading-snug">Niveaux de gris</label>
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
            <label className="block text-[9px] font-semibold text-[#5c647a] uppercase tracking-wide leading-snug mb-1">Icône</label>
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
                  <div><label className="block text-[9px] font-semibold text-[#5c647a] uppercase tracking-wide leading-snug mb-1">Icône</label><IconPicker value={item.icon} onChange={(ic) => patch({ icon: ic })} /></div>
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
          <SliderInput label="Espace" unit="px" min={0} max={60} value={(block.data.gap as number) ?? 8} onChange={(v) => update({ gap: v })} />
          <SliderInput label="Arrondi" unit="px" min={0} max={60} value={(block.data.radius as number) ?? 12} onChange={(v) => update({ radius: v })} />
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

function RowEditor({ block, onChange, onDelete, compact }: { block: Block; onChange: (b: Block) => void; onDelete: () => void; compact?: boolean }) {
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
          <Columns3 size={16} className="text-[#006e2f]" />
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
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Row-level settings */}
      <details className="border-b border-gray-200" open={compact}>
        <summary className="px-4 py-2 text-[10px] font-semibold text-[#5c647a] uppercase tracking-wider cursor-pointer hover:bg-white">
          Réglages de la rangée
        </summary>
        <div className="p-4 bg-white space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <SliderInput label="Espace colonnes" unit="px" min={0} max={80} value={gap} onChange={(v) => updateData({ gap: v })} />
            <SliderInput label="Padding vert." unit="px" min={0} max={160} value={padding} onChange={(v) => updateData({ padding: v })} />
          </div>
          <SelectInput label="Empiler les colonnes sur mobile" value={block.data.stackMobile === false ? "non" : "oui"} options={[{ value: "oui", label: "Oui" }, { value: "non", label: "Non" }]} onChange={(v) => updateData({ stackMobile: v === "oui" })} />
          <BackgroundPicker label="Arrière-plan de la rangée" value={bgColor || null} onChange={(c) => updateData({ bgColor: c ?? "" })} />
        </div>
      </details>

      {/* En mode barre latérale : PAS de gestion des colonnes ici — le contenu
          se remplit SUR LA PAGE (clic sur une colonne / glisser-déposer). */}
      {compact && (
        <div className="px-4 py-3 bg-white text-[11px] text-[#5c647a] leading-relaxed flex items-start gap-2">
          <Info size={13} className="mt-0.5 flex-shrink-0 text-[#006e2f]" />
          Le contenu des colonnes se gère <strong>directement sur la page</strong> : cliquez une colonne (ou glissez-y un élément) pour la remplir.
        </div>
      )}

      {/* Columns (mode carte pleine largeur uniquement) */}
      {!compact && (
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
                <Plus size={16} />
                Ajouter un élément
              </button>
            </div>
          ))}
        </div>
      </div>

      )}

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
  title, iconName, accentColor, renderSettings, previewStyle, compact,
}: {
  block: Block;
  onChange: (b: Block) => void;
  onDelete: () => void;
  title: string;
  iconName: LucideIcon;
  accentColor: string;
  renderSettings: (updateData: (patch: Record<string, unknown>) => void) => React.ReactNode;
  previewStyle?: React.CSSProperties;
  compact?: boolean;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const IconName = iconName;
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
          <IconName size={16} style={{ color: accentColor }} />
          <span className="text-xs font-bold" style={{ color: accentColor }}>{title} · {children.length} élément{children.length > 1 ? "s" : ""}</span>
        </div>
        <button onClick={onDelete} className="text-red-500 hover:text-red-700">
          <Trash2 size={18} />
        </button>
      </div>

      <details className="border-b border-gray-200" open={compact}>
        <summary className="px-4 py-2 text-[10px] font-semibold text-[#5c647a] uppercase tracking-wider cursor-pointer hover:bg-white">
          Réglages
        </summary>
        <div className="p-4 bg-white space-y-2.5">{renderSettings(updateData)}</div>
      </details>

      {/* En barre latérale : le contenu se gère SUR LA PAGE (clic dans la zone). */}
      {compact && (
        <div className="px-4 py-3 bg-white text-[11px] text-[#5c647a] leading-relaxed flex items-start gap-2">
          <Info size={13} className="mt-0.5 flex-shrink-0 text-[#006e2f]" />
          Le contenu se gère <strong>directement sur la page</strong> : cliquez dans la zone (ou glissez-y un élément) pour la remplir.
        </div>
      )}

      {!compact && (
      <div className="p-3" style={previewStyle}>
        <div className="bg-white/50 rounded-xl border border-gray-200 p-2.5 min-h-[120px] flex flex-col gap-2">
          {children.map((child, bIdx) => (
            <BlockEditor key={child.id} block={child} onChange={(b) => updateChild(bIdx, b)} onDelete={() => deleteChild(bIdx)} compact />
          ))}
          <button onClick={() => setPickerOpen(true)}
            className="w-full py-2.5 rounded-lg border-2 border-dashed border-gray-300 text-[11px] font-bold text-[#5c647a] hover:border-[#006e2f] hover:text-[#006e2f] hover:bg-[#006e2f]/5 transition-all flex items-center justify-center gap-1.5">
            <Plus size={14} />
            Ajouter un élément
          </button>
        </div>
      </div>

      )}

      {pickerOpen && (
        <PalettePicker onPick={addChild} onClose={() => setPickerOpen(false)} allowed={COLUMN_ALLOWED_KEYS} />
      )}
    </div>
  );
}

function SectionEditor({ block, onChange, onDelete, compact }: { block: Block; onChange: (b: Block) => void; onDelete: () => void; compact?: boolean }) {
  return (
    <ContainerEditor
      block={block} onChange={onChange} onDelete={onDelete} compact={compact}
      title="Section" iconName={LayoutDashboard} accentColor="#006e2f"
      previewStyle={{ background: (block.data.bgColor as string) || undefined }}
      renderSettings={(updateData) => (
        <>
          <div className="grid grid-cols-2 gap-2">
            <SliderInput label="Padding vert." unit="px" min={0} max={200} value={(block.data.paddingY as number) ?? 64} onChange={(v) => updateData({ paddingY: v })} />
            <SliderInput label="Padding horiz." unit="px" min={0} max={120} value={(block.data.paddingX as number) ?? 16} onChange={(v) => updateData({ paddingX: v })} />
          </div>
          <NumberInput label="Largeur max (0 = pleine)" value={(block.data.maxWidth as number) ?? 1152} onChange={(v) => updateData({ maxWidth: v })} />
          <BackgroundPicker label="Arrière-plan de la section" value={(block.data.bgColor as string) || null} onChange={(c) => updateData({ bgColor: c ?? "" })} />
          <ColorPicker label="Couleur du texte" value={(block.data.textColor as string) || null} onChange={(c) => updateData({ textColor: c ?? "" })} />
          <MediaUpload label="Image de fond (optionnel — par-dessus la couleur)" value={(block.data.bgImage as string) ?? null} onChange={(url) => updateData({ bgImage: url ?? "" })} accept="image" aspectRatio="landscape" />
          {(block.data.bgImage as string) && (
            <div className="flex items-center gap-3">
              <label className="text-[9px] font-semibold text-[#5c647a] uppercase tracking-wide leading-snug">Effet parallaxe</label>
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

function ContentBoxEditor({ block, onChange, onDelete, compact }: { block: Block; onChange: (b: Block) => void; onDelete: () => void; compact?: boolean }) {
  const bg = (block.data.bgColor as string) || "#ffffff";
  const border = (block.data.borderColor as string) || "#e5e7eb";
  const radius = (block.data.radius as number) ?? 16;
  const padding = (block.data.padding as number) ?? 24;
  const borderWidth = (block.data.borderWidth as number) ?? 1;
  return (
    <ContainerEditor
      block={block} onChange={onChange} onDelete={onDelete} compact={compact}
      title="Boîte de contenu" iconName={MousePointerClick} accentColor="#006e2f"
      previewStyle={{ background: bg, borderRadius: `${radius}px`, border: `${borderWidth}px solid ${border}`, padding: `${padding}px` }}
      renderSettings={(updateData) => (
        <>
          <div className="grid grid-cols-2 gap-2">
            <SliderInput label="Padding" unit="px" min={0} max={120} value={padding} onChange={(v) => updateData({ padding: v })} />
            <SliderInput label="Arrondi" unit="px" min={0} max={60} value={radius} onChange={(v) => updateData({ radius: v })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <SliderInput label="Épaisseur bord" unit="px" min={0} max={12} value={borderWidth} onChange={(v) => updateData({ borderWidth: v })} />
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
        <label className="block text-[9px] font-semibold text-[#5c647a] uppercase tracking-wide leading-snug mb-1">Produit / Formation à vendre *</label>
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
        <label className="block text-[9px] font-semibold text-[#5c647a] uppercase tracking-wide leading-snug mb-1">Icône du bouton</label>
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

  if (block.type === "row") return <RowEditor block={block} onChange={onChange} onDelete={onDelete} compact={compact} />;
  if (block.type === "section") return <SectionEditor block={block} onChange={onChange} onDelete={onDelete} compact={compact} />;
  if (block.type === "content-box") return <ContentBoxEditor block={block} onChange={onChange} onDelete={onDelete} compact={compact} />;

  const tpl = BLOCK_TEMPLATES[block.type];
  const isAtomic = tpl.atomic;
  const TplIcon = tpl.icon;
  const animValue = (block.data._animation as string) ?? "none";
  const visValue = (block.data._visibility as string) ?? "all";

  return (
    <div className="bg-[#f7f9fb] rounded-xl border border-gray-200">
      <div className={`flex items-center justify-between bg-white border-b border-gray-200 rounded-t-xl ${compact ? "px-3 py-2" : "px-4 py-3"}`}>
        <div className="flex items-center gap-2">
          <TplIcon size={18} className="text-[#006e2f]" />
          <span className="font-bold text-[#191c1e] text-sm">{tpl.label}</span>
          {visValue !== "all" && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 uppercase">
              {visValue === "desktop" ? "Desktop" : "Mobile"}
            </span>
          )}
          {animValue !== "none" && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#006e2f]/10 text-[#006e2f] uppercase">
              {animValue}
            </span>
          )}
        </div>
        <button onClick={onDelete} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors">
          <Trash2 size={18} />
        </button>
      </div>
      <div className={compact ? "p-3" : "p-4"}>
        {isAtomic ? renderAtomicEditor(block, update) : renderSectionEditor(block, update)}
      </div>
      {/* ── STYLE AVANCÉ : fond, bordures, ombres, espacements, effets —
           disponible sur TOUS les éléments (appliqué au rendu public + canvas) ── */}
      <details className="border-t border-gray-200" open={compact}>
        <summary className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold text-[#5c647a] uppercase tracking-wider cursor-pointer hover:bg-gray-50 list-none">
          <Palette size={14} />
          Style avancé (fond, bordures, ombres…)
          <ChevronDown size={14} className="ml-auto" />
        </summary>
        <div className="px-4 pb-3 space-y-2.5 min-w-0">
          <BackgroundPicker label="Fond du bloc" value={(block.data._bg as string) ?? null} onChange={(c) => update({ _bg: c })} />
          <ColorPicker label="Couleur du texte (forcer)" value={(block.data._textColor as string) ?? null} onChange={(c) => update({ _textColor: c })} />
          <div className="grid grid-cols-2 gap-2">
            <SliderInput label="Bordure" unit="px" min={0} max={12} value={(block.data._borderWidth as number) ?? 0} onChange={(v) => update({ _borderWidth: Math.max(0, v) })} />
            <ColorPicker label="Couleur bordure" value={(block.data._borderColor as string) ?? null} onChange={(c) => update({ _borderColor: c })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <SelectInput label="Style bordure" value={(block.data._borderStyle as string) ?? "solid"} options={[
              { value: "solid", label: "Pleine" },
              { value: "dashed", label: "Tirets" },
              { value: "dotted", label: "Points" },
            ]} onChange={(v) => update({ _borderStyle: v })} />
            <SliderInput label="Arrondi" unit="px" min={0} max={60} value={(block.data._borderRadius as number) ?? 0} onChange={(v) => update({ _borderRadius: Math.max(0, v) })} />
          </div>
          <SelectInput label="Ombre" value={(block.data._shadow as string) ?? "none"} options={[
            { value: "none", label: "Aucune" },
            { value: "sm", label: "Légère" },
            { value: "md", label: "Moyenne" },
            { value: "lg", label: "Grande" },
            { value: "xl", label: "Très grande" },
            { value: "glow", label: "Halo vert" },
          ]} onChange={(v) => update({ _shadow: v })} />
          <SliderInput label="Padding vert." unit="px" min={0} max={120} value={(block.data._padY as number) ?? 0} onChange={(v) => update({ _padY: Math.max(0, v) })} />
          <SliderInput label="Padding horiz." unit="px" min={0} max={120} value={(block.data._padX as number) ?? 0} onChange={(v) => update({ _padX: Math.max(0, v) })} />
          <div className="grid grid-cols-2 gap-2">
            <SliderInput label="Marge haut" unit="px" min={-60} max={160} value={(block.data._marginTop as number) ?? 0} onChange={(v) => update({ _marginTop: v })} />
            <SliderInput label="Marge bas" unit="px" min={-60} max={160} value={(block.data._marginBottom as number) ?? 0} onChange={(v) => update({ _marginBottom: v })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <NumberInput label="Largeur max (0 = auto)" value={(block.data._maxWidth as number) ?? 0} onChange={(v) => update({ _maxWidth: Math.max(0, v) })} />
            <SelectInput label="Position du bloc" value={(block.data._align2 as string) ?? "center"} options={ALIGN_OPTS} onChange={(v) => update({ _align2: v })} />
          </div>
          <SliderInput label="Opacité" unit="%" min={5} max={100} value={(block.data._opacity as number) ?? 100} onChange={(v) => update({ _opacity: Math.max(5, Math.min(100, v)) })} />
          <SelectInput label="Effet au survol" value={(block.data._hover as string) ?? "none"} options={[
            { value: "none", label: "Aucun" },
            { value: "zoom", label: "Zoom" },
            { value: "lift", label: "Soulever" },
            { value: "shadow", label: "Ombre" },
          ]} onChange={(v) => update({ _hover: v })} />
        </div>
      </details>
      {/* Animation + visibilité + CSS perso */}
      <details className="border-t border-gray-200">
        <summary className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold text-[#5c647a] uppercase tracking-wider cursor-pointer hover:bg-gray-50 list-none">
          <SlidersHorizontal size={14} />
          Animation &amp; visibilité
          <ChevronDown size={14} className="ml-auto" />
        </summary>
        <div className="px-4 pb-3 space-y-2">
          <SelectInput label="Animation à l'apparition" value={animValue} options={[
            { value: "none", label: "Aucune" },
            { value: "fade-in", label: "Fondu" },
            { value: "slide-up", label: "Glisser ↑" },
            { value: "slide-down", label: "Glisser ↓" },
            { value: "slide-left", label: "Glisser ←" },
            { value: "slide-right", label: "Glisser →" },
            { value: "zoom", label: "Zoom" },
            { value: "bounce", label: "Rebond" },
            { value: "flip", label: "Bascule 3D" },
            { value: "pulse", label: "Pulsation (boucle)" },
            { value: "shake", label: "Secousse (attention)" },
          ]} onChange={(v) => update({ _animation: v })} />
          {animValue !== "none" && (
            <div className="grid grid-cols-2 gap-2">
              <SliderInput label="Délai" unit="ms" min={0} max={2000} step={100} value={Number(block.data._animDelay ?? 0)} onChange={(v) => update({ _animDelay: v })} />
              <SliderInput label="Durée" unit="ms" min={100} max={2000} step={100} value={Number(block.data._animDuration ?? 600)} onChange={(v) => update({ _animDuration: v })} />
            </div>
          )}
          <SelectInput label="Visible sur" value={visValue} options={[
            { value: "all", label: "Tous" },
            { value: "desktop", label: "Desktop" },
            { value: "mobile", label: "Mobile" },
          ]} onChange={(v) => update({ _visibility: v })} />
          <div>
            <label className="block text-[9px] font-semibold text-[#5c647a] uppercase tracking-wide leading-snug mb-1">CSS personnalisé</label>
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
// ÉDITION INLINE — Titres et Textes se modifient DIRECTEMENT sur la page
// (contentEditable, mêmes classes visuelles que le rendu public).
// ═══════════════════════════════════════════════════════════════════════════
function InlineTextEditor({ block, theme, onCommit }: { block: Block; theme: { textColor: string }; onCommit: (content: string) => void }) {
  const d = block.data as Record<string, unknown>;
  const isHeading = block.type === "heading";
  const level = Math.min(Math.max(Number(d.level) || 2, 1), 6);
  // Taille personnalisée → pas de classes responsives (l'inline fontSize prime),
  // comme HeadingBlock côté public.
  const hasCustomSize = isHeading && Number(d.size ?? 0) > 0;
  const sizeCls = isHeading
    ? hasCustomSize ? "font-extrabold leading-tight"
      : level === 1 ? "text-3xl md:text-5xl font-extrabold leading-tight"
      : level === 2 ? "text-2xl md:text-4xl font-extrabold leading-tight"
      : level === 3 ? "text-xl md:text-2xl font-extrabold leading-tight"
      : "text-lg md:text-xl font-extrabold leading-tight"
    : "leading-relaxed whitespace-pre-wrap";
  const ref = useRef<HTMLDivElement>(null);
  // Texte injecté hors React (pas d'enfants contrôlés) → le curseur ne saute
  // pas pendant la frappe ; resynchronisé si modifié depuis l'inspecteur.
  useEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el) el.innerText = (d.content as string) ?? "";
  }, [d.content]);
  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onBlur={() => onCommit(ref.current?.innerText ?? "")}
      onKeyDown={(e) => { if (isHeading && e.key === "Enter") { e.preventDefault(); (e.currentTarget as HTMLElement).blur(); } }}
      className={`${sizeCls} outline-none rounded px-1 -mx-1 cursor-text transition-shadow focus:ring-2 focus:ring-[#006e2f]/40 hover:ring-1 hover:ring-[#006e2f]/20`}
      style={{
        color: (d.color as string) || theme.textColor,
        textAlign: ((d.align as string) ?? "left") as "left" | "center" | "right",
        // Typographie pro : mêmes règles que le rendu public (HeadingBlock/TextBlock)
        fontSize: isHeading ? (Number(d.size ?? 0) > 0 ? `${Number(d.size)}px` : undefined) : `${Number(d.size ?? 16)}px`,
        lineHeight: Number(d.lineHeight ?? 0) > 0 ? Number(d.lineHeight) : undefined,
        letterSpacing: d.letterSpacing !== undefined && Number(d.letterSpacing) !== 0 ? `${Number(d.letterSpacing)}px` : undefined,
        fontFamily: d.font ? `'${d.font}', sans-serif` : undefined,
        fontWeight: Number(d.weight ?? 0) > 0 ? Number(d.weight) : undefined,
      }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LEADS PANEL — emails capturés par les blocs « Formulaire de capture »
// ═══════════════════════════════════════════════════════════════════════════
function LeadsPanel({ funnelId, onClose }: { funnelId: string; onClose: () => void }) {
  const [leads, setLeads] = useState<Array<{ id: string; name: string | null; email: string; phone: string | null; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/formations/vendeur/funnels/${funnelId}/leads`)
      .then((r) => r.json())
      .then((j) => setLeads(j.data ?? []))
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  }, [funnelId]);

  function exportCsv() {
    // Colonnes personnalisées : union de toutes les clés `data` rencontrées
    const extraKeys = Array.from(new Set(leads.flatMap((l) => Object.keys((l.data as Record<string, string>) ?? {}))));
    const rows = [
      ["Nom", "Email", "Téléphone", ...extraKeys, "Date"],
      ...leads.map((l) => [
        l.name ?? "", l.email, l.phone ?? "",
        ...extraKeys.map((k) => ((l.data as Record<string, string>) ?? {})[k] ?? ""),
        new Date(l.createdAt).toLocaleString("fr-FR"),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "leads-novakou.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="fixed inset-0 z-[9990]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] animate-in fade-in duration-200" />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10">
          <h3 className="text-sm font-extrabold text-[#191c1e] flex items-center gap-2">
            <Mail size={16} className="text-purple-600" />Leads capturés
            {!loading && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">{leads.length}</span>}
          </h3>
          <div className="flex items-center gap-2">
            {leads.length > 0 && (
              <button onClick={exportCsv} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-purple-600 text-white hover:bg-purple-700 transition-colors">
                <Download size={13} />CSV
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg text-[#5c647a] hover:bg-gray-100 transition-colors"><X size={18} /></button>
          </div>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-14 rounded-xl bg-gray-100 animate-pulse" />)}</div>
          ) : leads.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Mail size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-bold text-[#191c1e]">Aucun lead pour le moment</p>
              <p className="text-xs text-[#5c647a] mt-1">Ajoutez un bloc « Formulaire (capture) » sur une étape, publiez, et partagez le lien. Les emails collectés apparaîtront ici.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leads.map((l) => (
                <div key={l.id} className="border border-gray-100 rounded-xl px-3.5 py-2.5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-[#191c1e] truncate">{l.name || "—"}</p>
                    <p className="text-[10px] text-[#5c647a] flex-shrink-0">{new Date(l.createdAt).toLocaleDateString("fr-FR")}</p>
                  </div>
                  <p className="text-xs text-[#006e2f] font-semibold truncate">{l.email}</p>
                  {l.phone && <p className="text-[11px] text-[#5c647a]">{l.phone}</p>}
                  {l.data && Object.keys(l.data as Record<string, string>).length > 0 && (
                    <div className="mt-1 pt-1 border-t border-gray-100 space-y-0.5">
                      {Object.entries(l.data as Record<string, string>).map(([k, v]) => (
                        <p key={k} className="text-[10.5px] text-[#5c647a]"><span className="font-semibold">{k} :</span> {v}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STATS PANEL — vues, leads, ventes, conversion, détail par étape
// ═══════════════════════════════════════════════════════════════════════════
function StatsPanel({ funnelId, onClose }: { funnelId: string; onClose: () => void }) {
  const [stats, setStats] = useState<{
    totalViews: number; salesCount: number; totalRevenue: number; leadsCount: number;
    clicksCount: number; conversionRate: number; leadRate: number;
    steps: Array<{ id: string; title: string; stepType: string; views: number; conversions: number }>;
    daily: Array<{ day: string; views: number }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/formations/vendeur/funnels/${funnelId}/stats`)
      .then((r) => r.json())
      .then((j) => setStats(j.data ?? null))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [funnelId]);

  const maxDaily = Math.max(1, ...(stats?.daily ?? []).map((d) => d.views));

  return (
    <div className="fixed inset-0 z-[9990]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] animate-in fade-in duration-200" />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl overflow-y-auto overflow-x-hidden animate-in slide-in-from-right duration-300" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10">
          <h3 className="text-sm font-extrabold text-[#191c1e] flex items-center gap-2">
            <TrendingUp size={16} className="text-[#006e2f]" />Statistiques du tunnel
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#5c647a] hover:bg-gray-100 transition-colors"><X size={18} /></button>
        </div>
        <div className="p-4 space-y-4">
          {loading ? (
            <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />)}</div>
          ) : !stats ? (
            <p className="text-xs text-[#5c647a] text-center py-10">Impossible de charger les statistiques.</p>
          ) : (
            <>
              {/* Cartes principales */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Vues totales", value: stats.totalViews.toLocaleString("fr-FR"), color: "#3b82f6" },
                  { label: "Leads capturés", value: stats.leadsCount.toLocaleString("fr-FR"), color: "#8b5cf6" },
                  { label: "Ventes", value: stats.salesCount.toLocaleString("fr-FR"), color: "#006e2f" },
                  { label: "Revenu", value: `${Math.round(stats.totalRevenue).toLocaleString("fr-FR")} FCFA`, color: "#f59e0b" },
                ].map((c) => (
                  <div key={c.label} className="rounded-xl border border-gray-100 p-3">
                    <p className="text-[10px] font-bold text-[#5c647a] uppercase tracking-wide">{c.label}</p>
                    <p className="text-xl font-extrabold mt-0.5" style={{ color: c.color }}>{c.value}</p>
                  </div>
                ))}
              </div>
              {/* Taux */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-purple-50 border border-purple-100 p-3">
                  <p className="text-[10px] font-bold text-purple-700 uppercase">Taux de capture</p>
                  <p className="text-lg font-extrabold text-purple-700">{stats.leadRate}%</p>
                </div>
                <div className="rounded-xl bg-green-50 border border-green-100 p-3">
                  <p className="text-[10px] font-bold text-green-700 uppercase">Taux de conversion</p>
                  <p className="text-lg font-extrabold text-green-700">{stats.conversionRate}%</p>
                </div>
              </div>
              {/* Mini graphique 14 jours */}
              <div>
                <p className="text-[10px] font-bold text-[#5c647a] uppercase tracking-wide mb-2">Vues — 14 derniers jours</p>
                <div className="flex items-end gap-1 h-20 rounded-xl border border-gray-100 p-2">
                  {stats.daily.map((d) => (
                    <div key={d.day} className="flex-1 h-full flex flex-col justify-end items-center" title={`${d.day} : ${d.views} vue(s)`}>
                      <div className="w-full rounded-sm bg-[#006e2f]/80 transition-all" style={{ height: `${Math.max(4, (d.views / maxDaily) * 100)}%`, opacity: d.views === 0 ? 0.15 : 1 }} />
                    </div>
                  ))}
                </div>
              </div>
              {/* Détail par étape */}
              <div>
                <p className="text-[10px] font-bold text-[#5c647a] uppercase tracking-wide mb-2">Par étape</p>
                <div className="space-y-1.5">
                  {stats.steps.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-2 rounded-xl border border-gray-100 px-3 py-2">
                      <span className="w-5 h-5 rounded-full bg-gray-100 text-[10px] font-extrabold text-[#5c647a] flex items-center justify-center flex-shrink-0">{i + 1}</span>
                      <p className="text-xs font-bold text-[#191c1e] truncate flex-1">{s.title}</p>
                      <span className="text-[10.5px] text-[#5c647a] tabular-nums flex-shrink-0">{s.views.toLocaleString("fr-FR")} vues</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-[#5c647a] mt-2">Les vues d&apos;étapes se comptent quand un visiteur avance dans le tunnel (boutons « étape suivante », formulaires…).</p>
              </div>
            </>
          )}
        </div>
      </div>
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
  const [showSettings, setShowSettings] = useState(false);
  const [showLeads, setShowLeads] = useState(false);
  const [showStats, setShowStats] = useState(false);
  // ── Gestion des ÉTAPES (ajout, renommage, suppression, réordonnancement) ──
  const [showAddStep, setShowAddStep] = useState(false);
  const [addStepType, setAddStepType] = useState<string>("LANDING");
  const [addStepTitle, setAddStepTitle] = useState("");
  const [addingStep, setAddingStep] = useState(false);
  const [renamingStepId, setRenamingStepId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [stepDragIdx, setStepDragIdx] = useState<number | null>(null);
  const [stepDropIdx, setStepDropIdx] = useState<number | null>(null);
  // ── Canvas WYSIWYG (façon Système.io) ──
  const [selectedId, setSelectedId] = useState<string | null>(null); // bloc sélectionné sur le canvas
  const [sidebarTab, setSidebarTab] = useState<"elements" | "blocks">("elements");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  // Petits écrans (<md) : la barre latérale devient un tiroir coulissant,
  // ouvert via le bouton flottant ou automatiquement à la sélection d'un bloc.
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Drag & drop depuis la palette : clé de l'élément en cours de glissement +
  // index d'insertion survolé sur le canvas (ligne verte).
  const [paletteDrag, setPaletteDrag] = useState<PaletteKey | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);
  // Déplacement d'un élément EXISTANT de la page (id du bloc en cours de drag) —
  // couvre : réordonner, entrer/sortir d'une colonne ou d'une section.
  const [moveDrag, setMoveDrag] = useState<string | null>(null);
  // Bloc le plus profond sous la souris au mousedown → c'est LUI qu'on déplace
  // (permet de tirer un élément imbriqué hors de sa colonne).
  const pressedRef = useRef<{ id: string | null; inEditable: boolean }>({ id: null, inEditable: false });
  // Ciblage d'une COLONNE de rangée : surbrillance au drag + picker « ajouter
  // dans cette colonne » au clic sur une colonne (vide) directement sur la page.
  const [dropCol, setDropCol] = useState<{ owner: string; col: number } | null>(null);
  const [columnTarget, setColumnTarget] = useState<{ owner: string; col: number } | null>(null);
  // Historique annuler/rétablir, par étape
  const historyRef = useRef<Record<string, { past: Block[][]; future: Block[][] }>>({});
  // Numéro de séquence des sauvegardes (voir save() : ignore les réponses périmées)
  const saveSeqRef = useRef(0);
  const [, setHistVersion] = useState(0);
  const [pendingTemplate, setPendingTemplate] = useState<{ kind: "step" | "landing"; data: Block[] } | null>(null);

  // Charger les polices Google du builder une fois : le <select> Police et le
  // canvas affichent ainsi chaque police fidèlement (comme la page publique).
  useEffect(() => {
    for (const fam of FONT_FAMILIES) {
      if (fam === "Manrope") continue; // police par défaut, déjà chargée par l'app
      const fid = `gfont-${fam.replace(/\s/g, "-")}`;
      if (!document.getElementById(fid)) {
        const link = document.createElement("link");
        link.id = fid;
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fam)}:wght@300;400;500;600;700;800&display=swap`;
        document.head.appendChild(link);
      }
    }
  }, []);

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

  // Étapes exposées à l'inspecteur des boutons (« Aller à l'étape N »)
  useEffect(() => {
    EDITOR_STEPS = (funnel?.steps ?? []).map((s) => ({ title: s.title }));
    return () => { EDITOR_STEPS = []; };
  }, [funnel]);

  // Funnel vide (fraîchement créé) → ouvre la galerie de templates une seule fois,
  // pour que le vendeur parte d'un design pro au lieu d'une page blanche.
  const autoGalleryRef = useRef(false);
  useEffect(() => {
    if (!funnel || autoGalleryRef.current) return;
    autoGalleryRef.current = true;
    const first = funnel.steps[0];
    const blocks = (first?.blocks as unknown[]) ?? [];
    // Page de VENTE vide → proposer la galerie de templates (fermable : la
    // page reste alors 100 % vide et se construit bloc par bloc).
    // Page de CAPTURE : pas de galerie (templates de vente hors sujet).
    if (blocks.length === 0 && first?.stepType === "LANDING") setShowGallery(true);
  }, [funnel]);

  async function save(patch: Omit<Partial<Funnel>, "steps"> & { steps?: Partial<Step>[] }) {
    if (!funnel) return;
    // Anti-régression : chaque sauvegarde porte un numéro de séquence. Une
    // réponse qui arrive APRÈS l'envoi d'une sauvegarde plus récente est
    // ignorée — sinon elle écraserait l'état local le plus récent (blocs
    // disparus du canvas, puis perte réelle au prochain enregistrement).
    const seq = ++saveSeqRef.current;
    setSaving(true);
    try {
      const res = await fetch(`/api/formations/vendeur/funnels/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        const json = await res.json();
        if (seq === saveSeqRef.current) {
          setFunnel(json.data);
          setSavedAt(new Date());
        }
      }
    } finally { if (seq === saveSeqRef.current) setSaving(false); }
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

  // ── ÉTAPES PERSONNALISABLES : ajouter / renommer / supprimer / réordonner ──
  async function handleAddStep() {
    if (addingStep) return;
    setAddingStep(true);
    try {
      const res = await fetch(`/api/formations/vendeur/funnels/${id}/steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepType: addStepType, title: addStepTitle.trim() || (STEP_INFO[addStepType]?.title ?? "Nouvelle étape") }),
      });
      const j = await res.json();
      if (res.ok && j.data) {
        setFunnel((f) => (f ? { ...f, steps: [...f.steps, j.data] } : f));
        setActiveStepId(j.data.id);
        setSelectedId(null);
        setShowAddStep(false);
        setAddStepTitle("");
      }
    } finally {
      setAddingStep(false);
    }
  }

  async function handleDeleteStep(stepId: string) {
    if (!funnel || funnel.steps.length <= 1) return;
    const step = funnel.steps.find((s) => s.id === stepId);
    const ok = await confirmAction({
      title: `Supprimer l'étape « ${step?.title ?? ""} » ?`,
      message: "Tout le contenu de cette page sera définitivement supprimé.",
      confirmLabel: "Supprimer l'étape",
      confirmVariant: "danger",
      icon: "delete",
    });
    if (!ok) return;
    const res = await fetch(`/api/formations/vendeur/funnels/${id}/steps/${stepId}`, { method: "DELETE" });
    if (res.ok) {
      setFunnel((f) => (f ? { ...f, steps: f.steps.filter((s) => s.id !== stepId) } : f));
      if (activeStepId === stepId) {
        setActiveStepId(funnel.steps.find((s) => s.id !== stepId)?.id ?? null);
        setSelectedId(null);
      }
    }
  }

  function startRenameStep(stepId: string, current: string) {
    setRenamingStepId(stepId);
    setRenameValue(current);
  }

  function commitRenameStep() {
    const sid = renamingStepId;
    const title = renameValue.trim();
    setRenamingStepId(null);
    if (!sid || !title || !funnel) return;
    if (funnel.steps.find((s) => s.id === sid)?.title === title) return;
    // Optimiste (les PATCH peuvent être lents) puis sauvegarde serveur
    setFunnel((f) => (f ? { ...f, steps: f.steps.map((s) => (s.id === sid ? { ...s, title } : s)) } : f));
    save({ steps: [{ id: sid, title }] });
  }

  function reorderSteps(from: number, to: number) {
    if (!funnel || from === to || from < 0 || to < 0) return;
    const arr = [...funnel.steps];
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    setFunnel((f) => (f ? { ...f, steps: arr } : f));
    save({ stepsOrder: arr.map((s) => s.id) });
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

  // Historique de l'étape active (annuler/rétablir)
  function hist() {
    const k = activeStep?.id ?? "_";
    if (!historyRef.current[k]) historyRef.current[k] = { past: [], future: [] };
    return historyRef.current[k];
  }

  // Applique + sauvegarde SANS toucher l'historique (utilisé par undo/redo)
  function applyBlocks(updated: Block[]) {
    if (!activeStep) return;
    save({ steps: [{ id: activeStep.id, blocks: updated as unknown as Block[] }] });
    setFunnel((f) => f ? { ...f, steps: f.steps.map((s) => s.id === activeStep.id ? { ...s, blocks: updated } : s) } : f);
  }

  function persistBlocks(updated: Block[]) {
    if (!activeStep) return;
    const h = hist();
    h.past.push(blocks);
    if (h.past.length > 50) h.past.shift();
    h.future = [];
    setHistVersion((v) => v + 1);
    applyBlocks(updated);
  }

  function undo() {
    const h = hist();
    const prev = h.past.pop();
    if (!prev) return;
    h.future.push(blocks);
    setHistVersion((v) => v + 1);
    applyBlocks(prev);
  }
  function redo() {
    const h = hist();
    const next = h.future.pop();
    if (!next) return;
    h.past.push(blocks);
    setHistVersion((v) => v + 1);
    applyBlocks(next);
  }
  const canUndo = hist().past.length > 0;
  const canRedo = hist().future.length > 0;

  function updateBlock(idx: number, block: Block) { persistBlocks(blocks.map((b, i) => i === idx ? block : b)); }
  function deleteBlock(idx: number) { persistBlocks(blocks.filter((_, j) => j !== idx)); setSelectedId(null); }
  function addBlock(key: PaletteKey) {
    const nb = createFromPaletteKey(key);
    persistBlocks([...blocks, nb]);
    setShowAddBlock(false);
    setSelectedId(nb.id); // sélection immédiate → l'inspecteur s'ouvre à gauche
  }

  // Insertion à une position précise (drag & drop depuis la palette)
  function insertBlockAt(idx: number, key: PaletteKey) {
    const nb = createFromPaletteKey(key);
    const clamped = Math.max(0, Math.min(blocks.length, idx));
    persistBlocks([...blocks.slice(0, clamped), nb, ...blocks.slice(clamped)]);
    setSelectedId(nb.id);
    setPaletteDrag(null);
    setDropIdx(null);
  }
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

  // Bloc sélectionné (clic direct sur la page — y compris IMBRIQUÉ dans une
  // rangée/section). selectedIdx ≥ 0 seulement pour les blocs de premier niveau
  // (les flèches monter/descendre/dupliquer ne s'appliquent qu'à eux).
  const selectedIdx = blocks.findIndex((b) => b.id === selectedId);
  const selectedBlock = selectedId ? treeFind(blocks, selectedId) : null;
  // Fil d'Ariane : chaîne racine → bloc sélectionné (ex. Section › Rangée › Texte)
  const selectedPath = selectedId ? treePath(blocks, selectedId) : [];
  const selectedIsTop = selectedIdx >= 0;

  // Ajout d'un élément DANS une colonne de rangée (clic ou drop sur la colonne)
  function insertBlockIntoColumn(ownerId: string, colIdx: number, key: PaletteKey) {
    const nb = createFromPaletteKey(key);
    // colIdx -1 = « slot » d'une section/boîte de contenu ; sinon colonne de rangée.
    persistBlocks(colIdx === -1 ? treeInsertIntoSlot(blocks, ownerId, nb) : treeInsertIntoColumn(blocks, ownerId, colIdx, nb));
    setColumnTarget(null);
    setPaletteDrag(null);
    setDropIdx(null);
    setDropCol(null);
    setSelectedId(nb.id);
  }

  // Charger le template par défaut de l'étape (écrase après confirmation)
  function applyStepTemplate() {
    if (!activeStep) return;
    const tpl = getStepTemplate(activeStep.stepType);
    if (blocks.length > 0) setPendingTemplate({ kind: "step", data: tpl });
    else persistBlocks(tpl);
  }

  // Thème « live » du canvas (mêmes défauts que la page publique)
  const liveTheme = {
    primaryColor: funnel.theme?.primaryColor || "#006e2f",
    accentColor: funnel.theme?.accentColor || "#22c55e",
    textColor: funnel.theme?.textColor || "#191c1e",
    bgColor: funnel.theme?.bgColor || "#ffffff",
    font: funnel.theme?.font || "Manrope",
    logoUrl: funnel.theme?.logoUrl,
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#eef1f4]">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 z-20 flex-shrink-0">
        {/* Barre d'actions : libellés masqués sous lg (icônes seules) pour tenir sur mobile */}
        <div className="px-2 md:px-6 h-14 flex items-center gap-0.5 md:gap-3">
          <Link href="/vendeur/marketing/funnels"
            className="flex items-center gap-1.5 px-2 md:px-2.5 py-1.5 rounded-lg text-xs font-bold text-[#5c647a] hover:text-[#191c1e] hover:bg-gray-100 transition-colors flex-shrink-0"
            title="Sortir de l'éditeur">
            <ArrowLeft size={16} /><span className="hidden sm:inline">Sortir</span>
          </Link>
          <input type="text" value={funnel.name}
            onChange={(e) => setFunnel({ ...funnel, name: e.target.value })}
            onBlur={() => save({ name: funnel.name })}
            className="text-sm font-bold text-[#191c1e] flex-1 min-w-[48px] bg-transparent placeholder-gray-400 focus:outline-none focus:bg-gray-50 px-2 py-1 rounded transition-colors"
            placeholder="Nom du funnel" />
          <div className="hidden sm:flex items-center gap-2 text-xs text-[#5c647a] flex-shrink-0">
            {saving ? (<><Loader2 size={14} className="animate-spin" />Sauvegarde…</>)
              : savedAt ? (<><CheckCircle2 size={14} className="text-green-500" />Sauvegardé</>)
              : null}
          </div>
          {/* Annuler / Rétablir */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button onClick={undo} disabled={!canUndo} className="p-1.5 rounded-lg text-[#5c647a] hover:bg-gray-100 disabled:opacity-30 transition-colors" title="Annuler"><Undo2 size={16} /></button>
            <button onClick={redo} disabled={!canRedo} className="p-1.5 rounded-lg text-[#5c647a] hover:bg-gray-100 disabled:opacity-30 transition-colors" title="Rétablir"><Redo2 size={16} /></button>
          </div>
          {/* Aperçu ordinateur / mobile */}
          <div className="hidden md:flex items-center bg-gray-100 rounded-lg p-0.5 flex-shrink-0">
            <button onClick={() => setDevice("desktop")} className={`p-1.5 rounded-md transition-colors ${device === "desktop" ? "bg-white text-[#006e2f] shadow-sm" : "text-[#5c647a]"}`} title="Aperçu ordinateur"><Monitor size={15} /></button>
            <button onClick={() => setDevice("mobile")} className={`p-1.5 rounded-md transition-colors ${device === "mobile" ? "bg-white text-[#006e2f] shadow-sm" : "text-[#5c647a]"}`} title="Aperçu mobile"><Smartphone size={15} /></button>
          </div>
          <button onClick={() => (activeStep?.stepType === "LANDING" ? setShowGallery(true) : applyStepTemplate())}
            className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 text-[#191c1e] hover:bg-gray-200 transition-colors flex-shrink-0"
            title="Templates prêts à l'emploi pour cette étape">
            <Wand2 size={14} /><span className="hidden lg:inline">Templates</span>
          </button>
          <button onClick={() => setShowLeads(true)}
            className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors flex-shrink-0" title="Leads capturés">
            <Mail size={14} /><span className="hidden lg:inline">Leads</span>
          </button>
          <button onClick={() => setShowStats(true)}
            className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-xl text-xs font-semibold bg-green-50 text-green-700 hover:bg-green-100 transition-colors flex-shrink-0" title="Statistiques du tunnel">
            <TrendingUp size={14} /><span className="hidden lg:inline">Stats</span>
          </button>
          <button onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 text-[#191c1e] hover:bg-gray-200 transition-colors flex-shrink-0" title="Réglages du tunnel">
            <SlidersHorizontal size={14} /><span className="hidden lg:inline">Réglages</span>
          </button>
          <button onClick={() => activeStep && save({ steps: [{ id: activeStep.id, blocks }] })}
            className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex-shrink-0" title="Sauvegarder">
            <Save size={14} /><span className="hidden lg:inline">Sauvegarder</span>
          </button>
          <a href={`/f/${funnel.slug}${funnel.isActive ? "" : "?preview=1"}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 text-[#191c1e] hover:bg-gray-200 transition-colors flex-shrink-0" title="Aperçu dans un nouvel onglet">
            <ExternalLink size={14} /><span className="hidden lg:inline">Aperçu</span>
          </a>
          <button onClick={() => save({ isActive: !funnel.isActive })}
            className={`flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${funnel.isActive ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-900 text-white hover:bg-gray-700"}`}>
            {funnel.isActive ? <CheckCircle2 size={14} /> : <Send size={14} />}
            <span className="hidden sm:inline">{funnel.isActive ? "Publié" : "Publier"}</span>
          </button>
        </div>

        {/* ── Étapes du tunnel : stepper HORIZONTAL, entièrement PERSONNALISABLE —
             clic = ouvrir, double-clic ou crayon = renommer, glisser = réordonner,
             croix = supprimer, « + Étape » = ajouter. ── */}
        <div className="border-t border-gray-100 bg-white/60">
          <div className="px-4 md:px-6 py-2.5 flex items-center gap-1.5 overflow-x-auto">
            {funnel.steps.map((s, i) => {
              const info = STEP_INFO[s.stepType] ?? STEP_INFO.LANDING;
              const isActive = s.id === activeStepId;
              const isRenaming = renamingStepId === s.id;
              const StepIcon = info.icon;
              return (
                <div key={s.id} className="flex items-center gap-1.5 flex-shrink-0">
                  {i > 0 && <ArrowRight size={14} className="text-gray-300 flex-shrink-0" />}
                  {/* Ligne d'insertion pendant le drag d'étape */}
                  {stepDragIdx !== null && stepDropIdx === i && stepDragIdx !== i && (
                    <span className="w-1 h-8 rounded-full bg-[#006e2f] flex-shrink-0" />
                  )}
                  <div
                    draggable={!isRenaming}
                    onDragStart={(e) => { e.dataTransfer.setData("application/x-nk-step", s.id); e.dataTransfer.effectAllowed = "move"; setStepDragIdx(i); }}
                    onDragEnd={() => { setStepDragIdx(null); setStepDropIdx(null); }}
                    onDragOver={(e) => {
                      // Le type MIME est lisible pendant le survol — plus fiable que
                      // l'état React (asynchrone) pour autoriser le drop.
                      if (stepDragIdx === null && !e.dataTransfer.types?.includes("application/x-nk-step")) return;
                      e.preventDefault(); e.dataTransfer.dropEffect = "move"; setStepDropIdx(i);
                    }}
                    onDrop={(e) => {
                      const sid = e.dataTransfer.getData("application/x-nk-step");
                      if (!sid) return;
                      e.preventDefault();
                      const from = funnel.steps.findIndex((x) => x.id === sid);
                      if (from !== -1) reorderSteps(from, i);
                      setStepDragIdx(null); setStepDropIdx(null);
                    }}
                    onClick={() => { if (!isRenaming) { setActiveStepId(s.id); setSelectedId(null); } }}
                    onDoubleClick={() => startRenameStep(s.id, s.title)}
                    className={`group flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-full border transition-all duration-300 ease-out cursor-pointer ${
                      isActive
                        ? "text-white shadow-lg scale-[1.05]"
                        : "bg-white text-[#191c1e] border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:-translate-y-0.5"
                    } ${stepDragIdx === i ? "opacity-40" : ""}`}
                    style={isActive ? { background: info.color, borderColor: info.color, boxShadow: `0 6px 18px ${info.color}55` } : undefined}
                    title="Clic : ouvrir · Double-clic : renommer · Glisser : réordonner">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold transition-colors duration-300 ${
                      isActive ? "bg-white/25 text-white" : "bg-gray-100 text-[#5c647a] group-hover:bg-gray-200"
                    }`}>
                      {i + 1}
                    </span>
                    <StepIcon size={14} className={`transition-colors duration-300 ${isActive ? "text-white" : "text-[#5c647a]"}`} />
                    {isRenaming ? (
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={commitRenameStep}
                        onKeyDown={(e) => { if (e.key === "Enter") commitRenameStep(); if (e.key === "Escape") setRenamingStepId(null); }}
                        onClick={(e) => e.stopPropagation()}
                        className={`text-xs font-bold bg-transparent outline-none border-b w-[120px] ${isActive ? "text-white border-white/60 placeholder-white/50" : "text-[#191c1e] border-gray-300"}`}
                        maxLength={80}
                      />
                    ) : (
                      <span className="text-xs font-bold whitespace-nowrap max-w-[150px] truncate">{s.title}</span>
                    )}
                    {/* Actions de l'étape active : renommer / supprimer */}
                    {isActive && !isRenaming && (
                      <span className="flex items-center gap-0.5 ml-0.5">
                        <button onClick={(e) => { e.stopPropagation(); startRenameStep(s.id, s.title); }}
                          className="p-1 rounded-full hover:bg-white/25 transition-colors" title="Renommer l'étape">
                          <Pencil size={11} className="text-white/90" />
                        </button>
                        {funnel.steps.length > 1 && (
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteStep(s.id); }}
                            className="p-1 rounded-full hover:bg-white/25 transition-colors" title="Supprimer l'étape">
                            <X size={12} className="text-white/90" />
                          </button>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {/* Zone de drop en fin de liste */}
            {stepDragIdx !== null && (
              <span
                onDragOver={(e) => { e.preventDefault(); setStepDropIdx(funnel.steps.length - 1); }}
                onDrop={(e) => {
                  e.preventDefault();
                  const sid = e.dataTransfer.getData("application/x-nk-step");
                  const from = sid ? funnel.steps.findIndex((x) => x.id === sid) : stepDragIdx;
                  if (from !== null && from !== -1) reorderSteps(from, funnel.steps.length - 1);
                  setStepDragIdx(null); setStepDropIdx(null);
                }}
                className="w-8 h-8 flex-shrink-0"
              />
            )}
            {/* Ajouter une étape */}
            <button onClick={() => { setAddStepType("LANDING"); setAddStepTitle(""); setShowAddStep(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-dashed border-gray-300 text-xs font-bold text-[#5c647a] hover:border-[#006e2f] hover:text-[#006e2f] transition-colors flex-shrink-0"
              title="Ajouter une étape au tunnel">
              <Plus size={14} />Étape
            </button>
          </div>
        </div>
      </div>

      {/* ── Panneau Réglages (slide-over droite) : URL, limite, thème, suppression ── */}
      {showSettings && (
        <div className="fixed inset-0 z-[9990]" onClick={() => setShowSettings(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] animate-in fade-in duration-200" />
          <div
            className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl overflow-y-auto overflow-x-hidden animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10">
              <h3 className="text-sm font-extrabold text-[#191c1e] flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-[#006e2f]" />Réglages du tunnel
              </h3>
              <button onClick={() => setShowSettings(false)} className="p-1.5 rounded-lg text-[#5c647a] hover:bg-gray-100 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-6">
              <div>
                <p className="text-[10px] font-bold text-[#5c647a] uppercase tracking-wider mb-1.5">URL publique</p>
                <p className="text-xs text-[#191c1e] tabular-nums bg-gray-50 px-3 py-2 rounded-lg truncate border border-gray-100">/f/{funnel.slug}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#5c647a] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Flame size={12} />Limite de ventes
                </p>
                <input type="number" min="0" placeholder="∞ (aucune limite)"
                  value={funnel.salesLimit ?? ""}
                  onChange={(e) => {
                    const val = e.target.value ? parseInt(e.target.value) : null;
                    setFunnel((f) => f ? { ...f, salesLimit: val } : f);
                  }}
                  onBlur={() => save({ salesLimit: funnel.salesLimit })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 bg-white" />
                {funnel.salesLimit !== null && funnel.salesLimit > 0 && (
                  <p className="text-[10px] text-[#5c647a] mt-1">{funnel.salesCount}/{funnel.salesLimit} ventes</p>
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#5c647a] uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Palette size={12} />Thème du tunnel
                </p>
                <div className="space-y-3">
                  <ColorPicker label="Couleur principale" value={funnel.theme?.primaryColor || "#006e2f"} onChange={(c) => save({ theme: { ...funnel.theme, primaryColor: c ?? "#006e2f" } })} />
                  <ColorPicker label="Couleur accent" value={funnel.theme?.accentColor || "#22c55e"} onChange={(c) => save({ theme: { ...funnel.theme, accentColor: c ?? "#22c55e" } })} />
                  <ColorPicker label="Couleur texte" value={funnel.theme?.textColor || "#191c1e"} onChange={(c) => save({ theme: { ...funnel.theme, textColor: c ?? "#191c1e" } })} />
                  <BackgroundPicker label="Fond de page" value={funnel.theme?.bgColor || "#f7f9fb"} onChange={(c) => save({ theme: { ...funnel.theme, bgColor: c ?? "#f7f9fb" } })} />
                  <div>
                    <label className="block text-[9px] font-semibold text-[#5c647a] uppercase tracking-wide leading-snug mb-1">Police</label>
                    <select
                      value={funnel.theme?.font || "Manrope"}
                      onChange={(e) => save({ theme: { ...funnel.theme, font: e.target.value } })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 bg-white"
                    >
                      {["Manrope", "Inter", "DM Sans", "Poppins", "Montserrat", "Raleway", "Playfair Display", "Lora", "Nunito", "Space Grotesk", "Outfit", "Plus Jakarta Sans"].map((f) => (
                        <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-semibold text-[#5c647a] uppercase tracking-wide leading-snug">Barre de progression de lecture</label>
                    <button onClick={() => save({ theme: { ...funnel.theme, progressBar: !funnel.theme?.progressBar } })}
                      className={`w-9 h-5 rounded-full transition-colors relative ${funnel.theme?.progressBar ? "bg-[#006e2f]" : "bg-gray-300"}`}>
                      <span className={`block w-4 h-4 rounded-full bg-white shadow absolute top-0.5 transition-all ${funnel.theme?.progressBar ? "left-4" : "left-0.5"}`} />
                    </button>
                  </div>
                </div>
              </div>
              {/* ── SEO & partage (bonus) : titre/description/image quand le lien
                   est partagé sur WhatsApp, Facebook… ── */}
              <div>
                <p className="text-[10px] font-bold text-[#5c647a] uppercase tracking-wider mb-2 flex items-center gap-1">
                  <ExternalLink size={12} />SEO &amp; partage (WhatsApp, Facebook…)
                </p>
                <div className="space-y-3">
                  <DeferredStringInput label="Titre affiché au partage" value={funnel.theme?.seo?.title ?? ""} onCommit={(v) => save({ theme: { ...funnel.theme, seo: { ...(funnel.theme?.seo ?? {}), title: v } } })} placeholder={funnel.name} />
                  <DeferredStringInput label="Description" value={funnel.theme?.seo?.description ?? ""} onCommit={(v) => save({ theme: { ...funnel.theme, seo: { ...(funnel.theme?.seo ?? {}), description: v } } })} multiline placeholder="Ce que verront les gens avant de cliquer" />
                  <MediaUpload label="Image de partage (1200×630 conseillé)" value={funnel.theme?.seo?.image ?? null} onChange={(url) => save({ theme: { ...funnel.theme, seo: { ...(funnel.theme?.seo ?? {}), image: url ?? "" } } })} accept="image" aspectRatio="landscape" />
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <button onClick={handleDelete} className="w-full text-xs text-red-500 hover:text-red-700 hover:bg-red-50 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-red-100 transition-colors">
                  <Trash2 size={14} />Supprimer ce tunnel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modale « Ajouter une étape » : type + titre ── */}
      {showAddStep && (
        <div className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowAddStep(false)}>
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-extrabold text-[#191c1e]">Ajouter une étape</h2>
              <button onClick={() => setShowAddStep(false)} className="p-1.5 rounded-lg text-[#5c647a] hover:bg-gray-100 transition-colors"><X size={18} /></button>
            </div>
            <p className="text-xs text-[#5c647a] mb-4">L&apos;étape est ajoutée à la fin du tunnel — glissez sa pilule pour la déplacer. Elle démarre vide : construisez-la bloc par bloc ou avec un template.</p>
            <div className="space-y-2 mb-4">
              {Object.entries(STEP_INFO).map(([type, info]) => {
                const TypeIcon = info.icon;
                const selected = addStepType === type;
                return (
                  <button key={type} onClick={() => setAddStepType(type)}
                    className={`w-full flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-all ${selected ? "shadow-md" : "border-gray-200 hover:border-gray-300 opacity-80 hover:opacity-100"}`}
                    style={selected ? { borderColor: info.color, background: info.bgTint } : undefined}>
                    <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${info.color}18` }}>
                      <TypeIcon size={18} style={{ color: info.color }} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-extrabold text-[#191c1e]">{info.title}</span>
                      <span className="block text-[11px] text-[#5c647a] truncate">{info.subtitle}</span>
                    </span>
                    {selected && <CheckCircle2 size={18} style={{ color: info.color }} className="flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
            <label className="block text-[10px] font-bold text-[#5c647a] uppercase tracking-wider mb-1.5">Nom de l&apos;étape</label>
            <input
              type="text"
              value={addStepTitle}
              onChange={(e) => setAddStepTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddStep(); }}
              placeholder={STEP_INFO[addStepType]?.title ?? "Nouvelle étape"}
              maxLength={80}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-[#191c1e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f] mb-4"
            />
            <button onClick={handleAddStep} disabled={addingStep}
              className="w-full py-3 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}>
              {addingStep ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {addingStep ? "Ajout en cours…" : "Ajouter l'étape"}
            </button>
          </div>
        </div>
      )}

      {/* ── Panneau Leads (emails capturés par les formulaires) ── */}
      {showLeads && <LeadsPanel funnelId={id} onClose={() => setShowLeads(false)} />}

      {/* ── Panneau Statistiques (vues, leads, ventes, conversion) ── */}
      {showStats && <StatsPanel funnelId={id} onClose={() => setShowStats(false)} />}

      <div className="flex-1 flex overflow-hidden">
        {/* Voile derrière le tiroir (mobile uniquement) */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-[70] bg-black/40 backdrop-blur-[1px]" onClick={() => setSidebarOpen(false)} />
        )}
        {/* ══ BARRE LATÉRALE GAUCHE : Éléments / Blocs / Inspecteur (façon Système.io)
             — tiroir coulissant sur mobile, colonne fixe à partir de md ══ */}
        <aside className={`fixed md:static top-0 bottom-0 left-0 z-[80] md:z-auto w-[300px] md:w-[330px] flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto overflow-x-hidden transition-transform duration-200 md:transition-none md:translate-x-0 ${sidebarOpen ? "translate-x-0 shadow-2xl md:shadow-none" : "-translate-x-full"}`}>
          {/* En-tête de fermeture (mobile) */}
          <div className="md:hidden sticky top-0 z-10 bg-white border-b border-gray-100 px-3 py-2 flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#191c1e]">{selectedBlock ? "Paramètres de l'élément" : "Éléments"}</span>
            <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg text-[#5c647a] hover:bg-gray-100 transition-colors" title="Fermer"><X size={18} /></button>
          </div>
          {selectedBlock ? (
            /* ── Inspecteur du bloc sélectionné ── */
            <div className="p-3">
              {/* Fil d'Ariane façon Système.io : Page › Section › Rangée › Texte */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center flex-wrap gap-x-1 gap-y-1 min-w-0 text-[11px] font-bold pt-1">
                  <button onClick={() => setSelectedId(null)}
                    className="flex items-center gap-1 text-[#5c647a] hover:text-[#006e2f] transition-colors"
                    title="Retour à la palette d'éléments">
                    <ArrowLeft size={12} />Page
                  </button>
                  {selectedPath.map((b, i) => {
                    const last = i === selectedPath.length - 1;
                    const crumbLabel = BLOCK_TEMPLATES[b.type]?.label ?? b.type;
                    return (
                      <span key={b.id} className="flex items-center gap-1 min-w-0">
                        <span className="text-gray-300">›</span>
                        {last ? (
                          <span className="text-[#006e2f] truncate max-w-[110px]">{crumbLabel}</span>
                        ) : (
                          <button onClick={() => setSelectedId(b.id)}
                            className="text-[#5c647a] hover:text-[#006e2f] transition-colors truncate max-w-[90px]"
                            title={`Sélectionner : ${crumbLabel}`}>
                            {crumbLabel}
                          </button>
                        )}
                      </span>
                    );
                  })}
                </div>
                {selectedIsTop && (
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button onClick={() => moveBlock(selectedIdx, -1)} disabled={selectedIdx === 0} className="p-1.5 rounded-lg text-[#5c647a] hover:bg-gray-100 disabled:opacity-30 transition-colors" title="Monter"><ArrowUp size={15} /></button>
                    <button onClick={() => moveBlock(selectedIdx, 1)} disabled={selectedIdx === blocks.length - 1} className="p-1.5 rounded-lg text-[#5c647a] hover:bg-gray-100 disabled:opacity-30 transition-colors" title="Descendre"><ArrowDown size={15} /></button>
                    <button onClick={() => duplicateBlock(selectedIdx)} className="p-1.5 rounded-lg text-[#5c647a] hover:bg-gray-100 transition-colors" title="Dupliquer"><Copy size={15} /></button>
                  </div>
                )}
              </div>
              <BlockEditor
                compact
                block={selectedBlock}
                onChange={(b) => persistBlocks(treeUpdate(blocks, selectedBlock.id, b))}
                onDelete={() => { persistBlocks(treeRemove(blocks, selectedBlock.id)); setSelectedId(null); }}
              />
            </div>
          ) : (
            /* ── Palette : Éléments | Blocs ── */
            <div className="p-3">
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4">
                {(["elements", "blocks"] as const).map((t) => (
                  <button key={t} onClick={() => setSidebarTab(t)}
                    className={`flex-1 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${sidebarTab === t ? "bg-white text-[#006e2f] shadow-sm" : "text-[#5c647a] hover:text-[#191c1e]"}`}>
                    {t === "elements" ? "Éléments" : "Blocs"}
                  </button>
                ))}
              </div>
              {sidebarTab === "elements" ? (
                PALETTE_CATEGORIES.filter((c) => c.label !== "Sections prêtes").map((cat) => (
                  <div key={cat.label} className="mb-5">
                    <p className="text-[11px] font-extrabold text-[#191c1e] mb-2">{cat.label}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {cat.items.map((it) => {
                        const ItIcon = it.icon;
                        return (
                          <button key={it.key} onClick={() => addBlock(it.key)}
                            draggable
                            onDragStart={(e) => { e.dataTransfer.setData("application/x-nk-block", it.key); e.dataTransfer.effectAllowed = "copy"; setPaletteDrag(it.key); }}
                            onDragEnd={() => { setPaletteDrag(null); setDropIdx(null); setDropCol(null); }}
                            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-1 py-3 hover:border-[#006e2f] hover:shadow-sm hover:-translate-y-0.5 transition-all cursor-grab active:cursor-grabbing"
                            title={`Cliquez pour ajouter en bas, ou GLISSEZ sur la page : ${it.label}`}>
                            <ItIcon size={18} className="text-[#5c647a]" />
                            <span className="text-[10px] font-semibold text-[#191c1e] leading-tight text-center">{it.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="space-y-2">
                  <p className="text-[10.5px] text-[#5c647a] mb-2">Sections complètes prêtes à l&apos;emploi — cliquez pour les ajouter en bas de la page.</p>
                  {(PALETTE_CATEGORIES.find((c) => c.label === "Sections prêtes")?.items ?? []).map((it) => {
                    const ItIcon = it.icon;
                    return (
                      <button key={it.key} onClick={() => addBlock(it.key)}
                        draggable
                        onDragStart={(e) => { e.dataTransfer.setData("application/x-nk-block", it.key); e.dataTransfer.effectAllowed = "copy"; setPaletteDrag(it.key); }}
                        onDragEnd={() => { setPaletteDrag(null); setDropIdx(null); setDropCol(null); }}
                        className="w-full flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3.5 py-3 hover:border-[#006e2f] hover:shadow-sm transition-all text-left cursor-grab active:cursor-grabbing">
                        <ItIcon size={18} className="text-[#006e2f] flex-shrink-0" />
                        <span className="text-xs font-bold text-[#191c1e]">{it.label}</span>
                        <Plus size={14} className="ml-auto text-[#5c647a]" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </aside>

        {/* Bouton flottant (mobile) : paramètres du bloc sélectionné, sinon palette */}
        <button onClick={() => setSidebarOpen(true)}
          className="md:hidden fixed bottom-5 left-5 z-[60] w-14 h-14 rounded-full text-white shadow-2xl flex items-center justify-center active:scale-95 transition-transform"
          style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
          title={selectedId ? "Paramètres de l'élément" : "Ajouter un élément"}>
          {selectedId ? <SlidersHorizontal size={24} /> : <Plus size={26} />}
        </button>

        {/* ══ CANVAS : rendu RÉEL de la page — cliquez un élément pour le régler ══ */}
        <main className="flex-1 overflow-y-auto" onClick={() => setSelectedId(null)}>
          {/* Zone de rendu réel (thème du tunnel appliqué) — PLEINE LARGEUR comme
              la vraie page publiée (façon Système.io). L'ancienne « carte »
              (max-w + coins arrondis + overflow-hidden) rognait les barres
              d'outils et donnait un effet « dans une case ». */}
          <div className={device === "mobile" ? "max-w-[400px] mx-auto my-5 rounded-[30px] border-[10px] border-gray-900 overflow-hidden shadow-2xl" : ""}>
            <div>
              {/* Styles du canvas : colonnes vides cliquables, sélection imbriquée, cible de drop */}
              <style dangerouslySetInnerHTML={{ __html: `
                /* Les blocs « fixed » (barre CTA flottante…) restent DANS la page
                   pendant l'édition au lieu de recouvrir l'interface de l'éditeur. */
                .nk-canvas [data-nk-block] .fixed { position: relative !important; top: auto !important; bottom: auto !important; left: auto !important; right: auto !important; z-index: auto !important; }
                .nk-canvas [data-nk-col]:not(:has([data-nk-block])) { min-height: 72px; border: 2px dashed #cfd8d2; border-radius: 12px; position: relative; cursor: pointer; transition: border-color .2s, background .2s; }
                .nk-canvas [data-nk-col]:not(:has([data-nk-block])):hover { border-color: #006e2f; background: rgba(0,110,47,.05); }
                .nk-canvas [data-nk-col]:not(:has([data-nk-block]))::after { content: "+ Ajouter dans cette colonne"; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #9aa79f; font-size: 11px; font-weight: 700; pointer-events: none; }
                ${selectedId ? `.nk-canvas [data-nk-block="${selectedId}"] { outline: 2px solid #006e2f; outline-offset: 2px; border-radius: 6px; }` : ""}
                .nk-canvas [data-nk-slot]:not(:has([data-nk-block])) { min-height: 64px; border: 2px dashed #cfd8d2; border-radius: 12px; position: relative; cursor: pointer; }
                .nk-canvas [data-nk-slot]:not(:has([data-nk-block]))::after { content: "+ Ajouter un élément ici"; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #9aa79f; font-size: 11px; font-weight: 700; pointer-events: none; }
                ${(paletteDrag || moveDrag) && dropCol && dropCol.col >= 0 ? `.nk-canvas [data-nk-owner="${dropCol.owner}"][data-nk-col="${dropCol.col}"] { outline: 2px dashed #006e2f; outline-offset: -2px; background: rgba(0,110,47,.07); border-radius: 12px; }` : ""}
                ${(paletteDrag || moveDrag) && dropCol && dropCol.col === -1 ? `.nk-canvas [data-nk-slot="${dropCol.owner}"] { outline: 2px dashed #006e2f; outline-offset: -2px; background: rgba(0,110,47,.07); border-radius: 12px; }` : ""}
                ${device === "mobile" ? `
                  /* Aperçu mobile fidèle : le cadre fait 400px mais la fenêtre reste
                     grande — on force donc les règles mobiles (empilement, paddings,
                     tailles de titres, visibilité par appareil) dans le canvas. */
                  .nk-canvas .nk-row-stack { grid-template-columns: 1fr !important; }
                  .nk-canvas .nk-section { padding: min(var(--nk-pad-y, 64px), 48px) min(var(--nk-pad-x, 16px), 20px) !important; }
                  .nk-canvas .hidden.md\\:block { display: none !important; }
                  .nk-canvas .md\\:hidden { display: block !important; }
                  .nk-canvas .md\\:text-6xl { font-size: 2.25rem !important; line-height: 2.5rem !important; }
                  .nk-canvas .md\\:text-5xl { font-size: 1.875rem !important; line-height: 2.25rem !important; }
                  .nk-canvas .md\\:text-4xl { font-size: 1.5rem !important; line-height: 2rem !important; }
                  .nk-canvas .md\\:text-3xl { font-size: 1.5rem !important; line-height: 2rem !important; }
                  .nk-canvas .md\\:text-2xl { font-size: 1.25rem !important; line-height: 1.75rem !important; }
                  .nk-canvas .md\\:text-xl { font-size: 1.125rem !important; line-height: 1.75rem !important; }
                  .nk-canvas .md\\:grid-cols-2 { grid-template-columns: 1fr !important; }
                  .nk-canvas .md\\:grid-cols-3 { grid-template-columns: 1fr !important; }
                  .nk-canvas .md\\:grid-cols-4 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
                ` : ""}
              ` }} />
              <div className={`nk-canvas pb-10 ${device === "mobile" ? "min-h-[60vh]" : "min-h-[calc(100vh-110px)]"}`} style={{ background: liveTheme.bgColor, fontFamily: `'${liveTheme.font}', sans-serif`, color: liveTheme.textColor }}>
          {blocks.length === 0 ? (
            <div
              onDragOver={(e) => { if (paletteDrag) { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; setDropIdx(0); } }}
              onDrop={(e) => { const key = e.dataTransfer.getData("application/x-nk-block"); if (key) { e.preventDefault(); insertBlockAt(0, key as PaletteKey); } }}
              className={`mx-4 md:mx-6 my-6 rounded-2xl border-2 border-dashed p-12 text-center transition-colors ${paletteDrag ? "border-[#006e2f] bg-[#006e2f]/5" : "border-gray-300 bg-white/60"}`}>
              <Boxes size={48} className={`mx-auto ${paletteDrag ? "text-[#006e2f]" : "text-gray-300"}`} />
              <p className="text-sm font-bold text-[#191c1e] mt-3">Page vierge — à vous de jouer</p>
              <p className="text-xs text-[#5c647a] mt-1 mb-4">
                <strong>Glissez un élément</strong> depuis la colonne de gauche et déposez-le ici, ou cliquez dessus pour l&apos;ajouter.
                Vous pouvez aussi partir d&apos;un template prêt à l&apos;emploi.
              </p>
              <button onClick={(e) => { e.stopPropagation(); if (activeStep?.stepType === "LANDING") setShowGallery(true); else applyStepTemplate(); }} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}>
                <Palette size={16} />Choisir un template
              </button>
            </div>
          ) : (
            <>
              <div>
                {blocks.map((block, i) => {
                  const isSel = selectedId === block.id;
                  const tpl = BLOCK_TEMPLATES[block.type];
                  const isInlineText = block.type === "heading" || block.type === "text";
                  return (
                    <div
                      key={block.id}
                      draggable
                      onMouseDownCapture={(e) => {
                        const t = e.target as HTMLElement;
                        pressedRef.current = {
                          id: (t.closest?.("[data-nk-block]") as HTMLElement | null)?.getAttribute("data-nk-block") || null,
                          inEditable: !!t.closest?.('[contenteditable="true"]'),
                        };
                      }}
                      onDragStart={(e) => {
                        // Dans un texte éditable : laisser la sélection de texte
                        // (déplacer un Titre/Texte de 1er niveau = poignée ⋮ à gauche)
                        if (pressedRef.current.inEditable) { e.preventDefault(); return; }
                        const id = pressedRef.current.id || block.id;
                        e.dataTransfer.setData("application/x-nk-move", id);
                        e.dataTransfer.effectAllowed = "move";
                        setMoveDrag(id);
                      }}
                      onDragEnd={() => { setMoveDrag(null); setDropIdx(null); setDropCol(null); }}
                      onClickCapture={(e) => {
                        // Édition inline : laisser le clic atteindre le contentEditable
                        // (pas d'ouverture du tiroir mobile : on tape le texte sur place)
                        if (isInlineText) { e.stopPropagation(); setSelectedId(block.id); return; }
                        e.preventDefault();
                        e.stopPropagation();
                        const t = e.target as HTMLElement;
                        const blkEl = t.closest("[data-nk-block]") as HTMLElement | null;
                        const colEl = t.closest("[data-nk-col]") as HTMLElement | null;
                        const slotEl = t.closest("[data-nk-slot]") as HTMLElement | null;
                        // Clic dans une colonne, hors de tout bloc enfant → proposer d'ajouter DANS la colonne
                        if (colEl && (!blkEl || !colEl.contains(blkEl))) {
                          setColumnTarget({ owner: colEl.getAttribute("data-nk-owner") || "", col: Number(colEl.getAttribute("data-nk-col") || 0) });
                          return;
                        }
                        // Clic dans une section/boîte (zone vide) → ajouter DEDANS
                        if (slotEl && slotEl.getAttribute("data-nk-slot")) {
                          const inner = blkEl && slotEl.contains(blkEl) && blkEl !== e.currentTarget;
                          if (!inner) {
                            setColumnTarget({ owner: slotEl.getAttribute("data-nk-slot") || "", col: -1 });
                            return;
                          }
                        }
                        // Sélection du bloc le plus PROFOND cliqué (imbriqué inclus)
                        setSelectedId(blkEl?.getAttribute("data-nk-block") || block.id);
                        // Mobile : ouvrir le tiroir des paramètres (sans effet ≥ md)
                        setSidebarOpen(true);
                      }}
                      onDragOver={(e) => {
                        if (!paletteDrag && !moveDrag) return;
                        e.preventDefault();
                        e.dataTransfer.dropEffect = paletteDrag ? "copy" : "move";
                        const tgt = dropTargetFromEvent(e.target as HTMLElement);
                        // Autorisé dans cette cible ? (clé palette OU type du bloc déplacé)
                        let ok = false;
                        if (tgt) {
                          if (paletteDrag) ok = (tgt.col === -1 ? SLOT_ALLOWED_KEYS : COLUMN_ALLOWED_KEYS).includes(paletteDrag);
                          else if (moveDrag) {
                            const mv = treeFind(blocks, moveDrag);
                            ok = !!mv && (tgt.col === -1 ? SLOT_ALLOWED_TYPES : COLUMN_ALLOWED_TYPES).includes(mv.type)
                              && !isSelfOrDescendant(blocks, moveDrag, tgt.owner);
                          }
                        }
                        if (tgt && ok) {
                          setDropCol(tgt);
                          setDropIdx(null);
                          return;
                        }
                        setDropCol(null);
                        const r = e.currentTarget.getBoundingClientRect();
                        setDropIdx(e.clientY < r.top + r.height / 2 ? i : i + 1);
                      }}
                      onDrop={(e) => {
                        const key = e.dataTransfer.getData("application/x-nk-block");
                        const moveId = e.dataTransfer.getData("application/x-nk-move");
                        if (!key && !moveId) return;
                        e.preventDefault(); e.stopPropagation();
                        const tgt = dropTargetFromEvent(e.target as HTMLElement);
                        // ── Ajout depuis la palette ──
                        if (key) {
                          const allowed = tgt ? (tgt.col === -1 ? SLOT_ALLOWED_KEYS : COLUMN_ALLOWED_KEYS) : null;
                          if (tgt && allowed && allowed.includes(key as PaletteKey)) {
                            insertBlockIntoColumn(tgt.owner, tgt.col, key as PaletteKey);
                            return;
                          }
                          const r = e.currentTarget.getBoundingClientRect();
                          insertBlockAt(e.clientY < r.top + r.height / 2 ? i : i + 1, key as PaletteKey);
                          return;
                        }
                        // ── Déplacement d'un élément existant ──
                        const mv = treeFind(blocks, moveId);
                        if (!mv) return;
                        if (tgt && (tgt.col === -1 ? SLOT_ALLOWED_TYPES : COLUMN_ALLOWED_TYPES).includes(mv.type)
                          && !isSelfOrDescendant(blocks, moveId, tgt.owner)) {
                          persistBlocks(treeMoveToColumn(blocks, moveId, tgt.owner, tgt.col));
                          setSelectedId(moveId);
                          return;
                        }
                        const r = e.currentTarget.getBoundingClientRect();
                        persistBlocks(treeMoveToIndex(blocks, moveId, e.clientY < r.top + r.height / 2 ? i : i + 1));
                        setSelectedId(moveId);
                      }}
                      className={`group/block relative transition-all ${isSel ? "ring-2 ring-[#006e2f]" : "hover:ring-2 hover:ring-[#006e2f]/35"} ${isInlineText ? "" : "cursor-pointer"} ${moveDrag === block.id ? "opacity-40" : ""}`}>
                      {/* Poignée : glisser pour déplacer (page ↔ colonnes ↔ sections) */}
                      <div
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-6 h-10 flex items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm opacity-0 group-hover/block:opacity-100 transition-opacity cursor-grab active:cursor-grabbing hover:border-[#006e2f] hover:text-[#006e2f] text-[#5c647a]"
                        title="Glisser pour déplacer">
                        <span className="material-symbols-outlined text-[16px]">drag_indicator</span>
                      </div>
                      {/* Ligne d'insertion (ajout palette OU déplacement) */}
                      {(paletteDrag || moveDrag) && dropIdx === i && (
                        <div className="absolute top-0 left-2 right-2 h-1.5 bg-[#006e2f] rounded-full z-30 shadow-[0_0_10px_rgba(0,110,47,0.6)]" />
                      )}
                      {(paletteDrag || moveDrag) && dropIdx === i + 1 && (
                        <div className="absolute bottom-0 left-2 right-2 h-1.5 bg-[#006e2f] rounded-full z-30 shadow-[0_0_10px_rgba(0,110,47,0.6)]" />
                      )}
                      {/* Étiquette du type + actions rapides — DANS le bloc pour ne
                          jamais être rognée par les bords de la zone de travail */}
                      <div className={`absolute top-2 right-2 z-20 flex items-center gap-0.5 bg-white rounded-lg shadow-md border border-gray-200 transition-opacity ${isSel ? "opacity-100" : "opacity-0 group-hover/block:opacity-100"}`}>
                        <span className="px-2 text-[10px] font-bold text-[#006e2f] whitespace-nowrap">{tpl?.label ?? block.type}</span>
                        <div className="w-px h-4 bg-gray-200" />
                        <button onClick={(e) => { e.stopPropagation(); moveBlock(i, -1); }} disabled={i === 0}
                          className="p-1.5 text-[#5c647a] hover:text-[#006e2f] hover:bg-gray-50 disabled:opacity-30 transition-colors" title="Monter"><ArrowUp size={15} /></button>
                        <button onClick={(e) => { e.stopPropagation(); moveBlock(i, 1); }} disabled={i === blocks.length - 1}
                          className="p-1.5 text-[#5c647a] hover:text-[#006e2f] hover:bg-gray-50 disabled:opacity-30 transition-colors" title="Descendre"><ArrowDown size={15} /></button>
                        <button onClick={(e) => { e.stopPropagation(); duplicateBlock(i); }}
                          className="p-1.5 text-[#5c647a] hover:text-[#006e2f] hover:bg-gray-50 transition-colors" title="Dupliquer"><Copy size={15} /></button>
                        <button onClick={(e) => { e.stopPropagation(); deleteBlock(i); }}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-r-lg transition-colors" title="Supprimer"><Trash2 size={15} /></button>
                      </div>
                      {/* Rendu RÉEL — Titres/Textes éditables EN DIRECT sur la page */}
                      {isInlineText ? (
                        <InlineTextEditor
                          block={block}
                          theme={liveTheme}
                          onCommit={(content) => persistBlocks(treeUpdate(blocks, block.id, { ...block, data: { ...block.data, content } }))}
                        />
                      ) : (
                        <div className="select-none">
                          {renderPublicBlock(block, liveTheme, () => {}, undefined, funnel.slug, funnel.salesLimit, funnel.salesCount)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {(paletteDrag || moveDrag) && (
                <div
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = paletteDrag ? "copy" : "move"; setDropIdx(blocks.length); }}
                  onDrop={(e) => {
                    const key = e.dataTransfer.getData("application/x-nk-block");
                    const moveId = e.dataTransfer.getData("application/x-nk-move");
                    if (key) { e.preventDefault(); insertBlockAt(blocks.length, key as PaletteKey); return; }
                    if (moveId) { e.preventDefault(); persistBlocks(treeMoveToIndex(blocks, moveId, blocks.length)); setSelectedId(moveId); }
                  }}
                  className={`mx-4 md:mx-6 mt-3 h-14 rounded-2xl border-2 border-dashed flex items-center justify-center text-xs font-bold transition-colors ${dropIdx === blocks.length ? "border-[#006e2f] bg-[#006e2f]/10 text-[#006e2f]" : "border-gray-300 text-gray-400"}`}>
                  Déposer ici (fin de page)
                </div>
              )}
              <button onClick={(e) => { e.stopPropagation(); setShowAddBlock(true); }}
                className="mx-4 md:mx-6 mt-4 w-[calc(100%-2rem)] md:w-[calc(100%-3rem)] py-3.5 rounded-2xl border-2 border-dashed border-gray-300 text-sm font-bold text-[#5c647a] hover:border-[#006e2f] hover:text-[#006e2f] transition-colors flex items-center justify-center gap-2">
                <Plus size={18} />Ajouter un élément
              </button>
            </>
          )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {showAddBlock && <PalettePicker onPick={addBlock} onClose={() => setShowAddBlock(false)} />}

      {/* Picker « ajouter dans cette colonne / cette section » (clic sur le canvas) */}
      {columnTarget && (
        <PalettePicker
          allowed={columnTarget.col === -1 ? SLOT_ALLOWED_KEYS : COLUMN_ALLOWED_KEYS}
          onPick={(key) => insertBlockIntoColumn(columnTarget.owner, columnTarget.col, key)}
          onClose={() => setColumnTarget(null)}
        />
      )}

      {/* Template gallery modal */}
      {showGallery && (
        <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowGallery(false)}>
          <div className="bg-[#fafbfd] rounded-3xl max-w-6xl w-full max-h-[94vh] overflow-hidden shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-100 bg-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Palette size={20} className="text-[#006e2f]" />
                  <h2 className="text-xl font-extrabold text-[#191c1e]">Galerie de templates</h2>
                  <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#006e2f]/10 text-[#006e2f]">6 designs</span>
                </div>
                <p className="text-xs text-[#5c647a]">Chaque template a une structure visuelle différente — survolez pour le détail, cliquez pour appliquer.</p>
              </div>
              <button onClick={() => setShowGallery(false)} className="text-[#5c647a] hover:text-[#191c1e] hover:bg-gray-100 p-2 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Cards grid */}
            <div className="overflow-y-auto p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {LANDING_TEMPLATES.map((tpl) => {
                  const TplBadgeIcon = TEMPLATE_BADGE_ICONS[tpl.icon] ?? Sparkles;
                  return (
                  <div key={tpl.key} className="rounded-2xl bg-white shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group border border-gray-100">
                    {/* Visual mockup preview */}
                    <div className="relative h-64 bg-gray-50 border-b border-gray-100 overflow-hidden">
                      <TemplatePreviewMockup vibe={tpl.vibe} palette={tpl.palette} preview={tpl.preview} variant={tpl.key} />
                      {/* Badge vibe + icon */}
                      <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/95 text-[#191c1e] shadow-sm backdrop-blur-sm">
                        <TplBadgeIcon size={12} style={{ color: tpl.palette[0] }} />
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
                          <Sparkles size={14} style={{ color: tpl.palette[1] }} />
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
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-4 border-t border-gray-100 bg-white flex items-center justify-between">
              <p className="text-xs text-[#5c647a] flex items-center gap-1.5">
                <Info size={14} />
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
