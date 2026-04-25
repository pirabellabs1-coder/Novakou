"use client";

import { useEffect, useState, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { PixelInjector } from "@/components/formations/PixelInjector";
import AnimatedBlock, { type AnimationType } from "@/components/funnels/AnimatedBlock";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES (must match editor)
// ═══════════════════════════════════════════════════════════════════════════
interface Block {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

interface Step {
  id: string;
  stepOrder: number;
  stepType: string;
  title: string;
  headlineFr: string | null;
  ctaTextFr: string | null;
  formationId: string | null;
  productId: string | null;
  blocks: Block[] | null;
}

interface Theme {
  primaryColor?: string;
  accentColor?: string;
  textColor?: string;
  bgColor?: string;
  font?: string;
  logoUrl?: string;
}

interface Pixel {
  type: "FACEBOOK" | "GOOGLE" | "TIKTOK";
  pixelId: string;
}

interface Funnel {
  id: string;
  name: string;
  slug: string;
  theme: Theme | null;
  steps: Step[];
  salesLimit: number | null;
  salesCount: number;
  instructeur: {
    id: string;
    user: { id: string; name: string | null; image: string | null };
    marketingPixels?: Pixel[];
  };
}

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

// ═══════════════════════════════════════════════════════════════════════════
// LINK RESOLUTION
// ═══════════════════════════════════════════════════════════════════════════
function useLink(raw: string | undefined, onDefault: () => void) {
  return () => {
    const link = (raw ?? "").trim();
    if (!link) { onDefault(); return; }
    if (link.startsWith("#")) {
      const el = document.querySelector(link);
      el?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (link.startsWith("http://") || link.startsWith("https://") || link.startsWith("/")) {
      if (link.startsWith("http")) window.open(link, "_blank", "noopener,noreferrer");
      else window.location.href = link;
      return;
    }
    // Fallback: treat as external
    window.open(`https://${link}`, "_blank", "noopener,noreferrer");
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// ATOMIC BLOCK RENDERERS
// ═══════════════════════════════════════════════════════════════════════════
function HeadingBlock({ data, theme }: { data: Record<string, unknown>; theme: Theme }) {
  const { content, level = 2, align = "left", color, gradient } = data as { content?: string; level?: number; align?: string; color?: string; gradient?: string };
  const safeLevel = Math.min(Math.max(Number(level) || 2, 1), 6);
  const sizeCls = safeLevel === 1 ? "text-3xl md:text-5xl" : safeLevel === 2 ? "text-2xl md:text-4xl" : safeLevel === 3 ? "text-xl md:text-2xl" : "text-lg md:text-xl";
  const hasGradient = gradient && gradient.includes("gradient");
  const gradientStyle: React.CSSProperties = hasGradient ? {
    backgroundImage: gradient,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  } : {};
  const commonProps = {
    className: `${sizeCls} font-extrabold leading-tight`,
    style: {
      color: hasGradient ? undefined : (color || theme.textColor),
      textAlign: align as "left" | "center" | "right",
      ...gradientStyle,
    },
  };
  if (safeLevel === 1) return <h1 {...commonProps}>{content}</h1>;
  if (safeLevel === 2) return <h2 {...commonProps}>{content}</h2>;
  if (safeLevel === 3) return <h3 {...commonProps}>{content}</h3>;
  if (safeLevel === 4) return <h4 {...commonProps}>{content}</h4>;
  if (safeLevel === 5) return <h5 {...commonProps}>{content}</h5>;
  return <h6 {...commonProps}>{content}</h6>;
}

function TextBlock({ data, theme }: { data: Record<string, unknown>; theme: Theme }) {
  const { content, align = "left", size = 16, color } = data as { content?: string; align?: string; size?: number; color?: string };
  return (
    <p className="leading-relaxed whitespace-pre-wrap" style={{ color: color || theme.textColor, textAlign: align as "left" | "center" | "right", fontSize: `${size}px` }}>
      {content}
    </p>
  );
}

function ImageBlock({ data }: { data: Record<string, unknown> }) {
  const { url, alt = "", align = "center", radius = 12 } = data as { url?: string; alt?: string; align?: string; radius?: number };
  if (!url) return null;
  const justify = align === "left" ? "justify-start" : align === "right" ? "justify-end" : "justify-center";
  return (
    <div className={`flex ${justify}`}>
      <img src={url} alt={alt} style={{ borderRadius: `${radius}px` }} className="max-w-full h-auto" />
    </div>
  );
}

function ButtonBlock({ data, theme, onDefault }: { data: Record<string, unknown>; theme: Theme; onDefault: () => void }) {
  const { text, link, style = "primary", size = "md", align = "center", bgColor, textColor, fullWidth, icon } = data as {
    text?: string; link?: string; style?: string; size?: string; align?: string; bgColor?: string; textColor?: string; fullWidth?: boolean; icon?: string;
  };
  const handle = useLink(link, onDefault);
  const padding = size === "sm" ? "px-4 py-2 text-xs" : size === "lg" ? "px-8 py-4 text-base" : "px-6 py-3 text-sm";
  const justify = align === "left" ? "justify-start" : align === "right" ? "justify-end" : "justify-center";

  let btnStyle: React.CSSProperties = {};
  let btnClass = "font-bold rounded-xl inline-flex items-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-lg";

  if (style === "outline") {
    btnStyle = { color: textColor || theme.primaryColor, border: `2px solid ${bgColor || theme.primaryColor}`, background: "transparent" };
  } else if (style === "secondary") {
    btnStyle = { color: textColor || theme.textColor, background: bgColor || "#f3f4f6" };
  } else {
    btnStyle = {
      color: textColor || "#fff",
      background: bgColor || `linear-gradient(to right, ${theme.primaryColor}, ${theme.accentColor})`,
    };
  }

  return (
    <div className={`flex ${justify}`}>
      <button onClick={handle} className={`${btnClass} ${padding} ${fullWidth ? "w-full justify-center" : ""}`} style={btnStyle}>
        {icon && <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>}
        {text}
      </button>
    </div>
  );
}

function IconBoxBlock({ data, theme }: { data: Record<string, unknown>; theme: Theme }) {
  const { icon = "verified", title, desc, align = "center", color } = data as { icon?: string; title?: string; desc?: string; align?: string; color?: string };
  const alignCls = align === "left" ? "items-start text-left" : align === "right" ? "items-end text-right" : "items-center text-center";
  const iconColor = color || theme.primaryColor;
  // theme.textColor is the inherited or default text color (already overridden if in a dark section)
  const titleColor = theme.textColor;
  // For desc, use 75% opacity of titleColor so it's slightly muted but stays readable
  return (
    <div className={`flex flex-col ${alignCls} gap-3 py-2`}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${iconColor}15` }}>
        <span className="material-symbols-outlined text-[24px]" style={{ color: iconColor, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      </div>
      {title && <h3 className="text-base font-extrabold" style={{ color: titleColor }}>{title}</h3>}
      {desc && <p className="text-sm leading-relaxed" style={{ color: titleColor, opacity: 0.75 }}>{desc}</p>}
    </div>
  );
}

function DividerBlock({ data }: { data: Record<string, unknown> }) {
  const { color = "#e5e7eb", thickness = 1, width = 100, shape = "line", height = 60, flip } = data as {
    color?: string; thickness?: number; width?: number; shape?: string; height?: number; flip?: boolean;
  };
  if (shape === "wave") {
    return (
      <div style={{ height: `${height}px`, overflow: "hidden", transform: flip ? "scaleY(-1)" : undefined }}>
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none" style={{ width: "100%", height: "100%", display: "block" }}>
          <path d="M0,60 C240,120 480,0 720,60 C960,120 1200,0 1440,60 L1440,120 L0,120 Z" fill={color} />
        </svg>
      </div>
    );
  }
  if (shape === "angle") {
    return (
      <div style={{ height: `${height}px`, overflow: "hidden", transform: flip ? "scaleY(-1)" : undefined }}>
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none" style={{ width: "100%", height: "100%", display: "block" }}>
          <polygon points="0,120 1440,0 1440,120" fill={color} />
        </svg>
      </div>
    );
  }
  if (shape === "curve") {
    return (
      <div style={{ height: `${height}px`, overflow: "hidden", transform: flip ? "scaleY(-1)" : undefined }}>
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none" style={{ width: "100%", height: "100%", display: "block" }}>
          <path d="M0,0 Q720,240 1440,0 L1440,120 L0,120 Z" fill={color} />
        </svg>
      </div>
    );
  }
  // line (default)
  return (
    <div className="flex justify-center py-2">
      <hr style={{ borderColor: color, borderTopWidth: `${thickness}px`, width: `${width}%` }} />
    </div>
  );
}

function SpacerBlock({ data }: { data: Record<string, unknown> }) {
  const { height = 32 } = data as { height?: number };
  return <div style={{ height: `${height}px` }} aria-hidden />;
}

function ListBlock({ data, theme }: { data: Record<string, unknown>; theme: Theme }) {
  const { items = [], icon = "check_circle", color, textColor } = data as { items?: string[]; icon?: string; color?: string; textColor?: string };
  const iconColor = color || theme.primaryColor;
  // textColor override > inherited theme.textColor
  const txtColor = textColor || theme.textColor;
  return (
    <ul className="space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex items-start gap-2.5" style={{ color: txtColor }}>
          <span className="material-symbols-outlined text-[18px] flex-shrink-0 mt-0.5" style={{ color: iconColor, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
          <span className="text-sm leading-relaxed">{it}</span>
        </li>
      ))}
    </ul>
  );
}

function HtmlBlock({ data }: { data: Record<string, unknown> }) {
  const { html = "" } = data as { html?: string };
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

function AtomicVideoBlock({ data, theme }: { data: Record<string, unknown>; theme: Theme }) {
  const { url, externalUrl, caption } = data as { url?: string; externalUrl?: string; caption?: string };
  const src = (url && url.length > 0) ? url : externalUrl;
  if (!src) return null;
  // Detect if uploaded (contains storage domain or file extension) vs external embed
  const isUploaded = src.includes("supabase") || /\.(mp4|webm|mov)$/i.test(src);
  // Normalize YouTube watch links to embed
  let embedSrc = src;
  if (!isUploaded) {
    const yt = src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)/);
    if (yt) embedSrc = `https://www.youtube.com/embed/${yt[1]}`;
    const vimeo = src.match(/vimeo\.com\/(\d+)/);
    if (vimeo) embedSrc = `https://player.vimeo.com/video/${vimeo[1]}`;
  }
  return (
    <div>
      <div className="aspect-video rounded-2xl overflow-hidden bg-black">
        {isUploaded ? (
          <video src={src} controls className="w-full h-full object-cover" />
        ) : (
          <iframe src={embedSrc} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen />
        )}
      </div>
      {caption && <p className="text-center text-sm text-gray-600 mt-3" style={{ color: theme.textColor }}>{caption}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTAINER RENDERERS (Row / Section / Content-box)
// ═══════════════════════════════════════════════════════════════════════════
function SectionBlock({ data, theme, onCta, funnelSlug, salesLimit, salesCount }: { data: Record<string, unknown>; theme: Theme; onCta: () => void; funnelSlug?: string; salesLimit?: number | null; salesCount?: number }) {
  const { blocks = [], bgColor, bgImage, paddingY = 64, paddingX = 16, maxWidth = 1152, textColor, parallax, overlayColor } = data as {
    blocks?: Block[]; bgColor?: string; bgImage?: string; paddingY?: number; paddingX?: number; maxWidth?: number; textColor?: string; parallax?: boolean; overlayColor?: string;
  };
  const style: React.CSSProperties = {
    background: bgImage
      ? `${bgColor ? bgColor + "," : ""} url(${bgImage}) center/cover no-repeat`
      : bgColor || undefined,
    backgroundAttachment: parallax && bgImage ? "fixed" : undefined,
    paddingTop: `${paddingY}px`,
    paddingBottom: `${paddingY}px`,
    paddingLeft: `${paddingX}px`,
    paddingRight: `${paddingX}px`,
    color: textColor || undefined,
    position: overlayColor ? "relative" as const : undefined,
  };
  const inherit = textColor || undefined;
  return (
    <section style={style}>
      {overlayColor && (
        <div className="absolute inset-0" style={{ background: overlayColor, opacity: 0.6, pointerEvents: "none" }} />
      )}
      <div className="mx-auto relative" style={{ maxWidth: maxWidth > 0 ? `${maxWidth}px` : "100%" }}>
        <div className="flex flex-col gap-4">
          {blocks.map((child) => renderBlock(child, theme, onCta, inherit, funnelSlug, salesLimit, salesCount))}
        </div>
      </div>
    </section>
  );
}

const SHADOW_MAP: Record<string, string> = {
  none: "none",
  sm: "0 1px 2px rgba(0,0,0,0.05)",
  md: "0 4px 12px rgba(0,0,0,0.08)",
  lg: "0 12px 32px rgba(0,0,0,0.12)",
};

function ContentBoxBlock({ data, theme, onCta, parentColor, funnelSlug, salesLimit, salesCount }: { data: Record<string, unknown>; theme: Theme; onCta: () => void; parentColor?: string; funnelSlug?: string; salesLimit?: number | null; salesCount?: number }) {
  const { blocks = [], bgColor = "#ffffff", borderColor = "#e5e7eb", borderWidth = 1, radius = 16, padding = 24, shadow = "md", textColor } = data as {
    blocks?: Block[]; bgColor?: string; borderColor?: string; borderWidth?: number; radius?: number; padding?: number; shadow?: string; textColor?: string;
  };
  // Detect dark background (solid or gradient) to auto-set white text
  const isDarkBg = bgColor && (
    /^#[0-4]/i.test(bgColor) ||
    bgColor.includes("rgb(0") || bgColor.includes("rgba(0") ||
    /gradient.*#[0-4]/i.test(bgColor) ||
    /gradient.*#1[0-9a-e]/i.test(bgColor)
  );
  const inherit = textColor || (isDarkBg ? "#ffffff" : parentColor);
  return (
    <div
      style={{
        background: bgColor,
        border: `${borderWidth}px solid ${borderColor}`,
        borderRadius: `${radius}px`,
        padding: `${padding}px`,
        boxShadow: SHADOW_MAP[shadow] ?? SHADOW_MAP.md,
        color: inherit || undefined,
      }}
    >
      <div className="flex flex-col gap-4">
        {blocks.map((child) => renderBlock(child, theme, onCta, inherit, funnelSlug, salesLimit, salesCount))}
      </div>
    </div>
  );
}

function RowBlock({ data, theme, onCta, parentColor, funnelSlug, salesLimit, salesCount }: { data: Record<string, unknown>; theme: Theme; onCta: () => void; parentColor?: string; funnelSlug?: string; salesLimit?: number | null; salesCount?: number }) {
  const { columns = [], gap = 16, bgColor, padding = 24 } = data as { columns?: Array<{ blocks: Block[] }>; gap?: number; bgColor?: string; padding?: number };
  if (!columns.length) return null;
  return (
    <section style={{ background: bgColor || undefined, paddingTop: `${padding}px`, paddingBottom: `${padding}px` }} className="px-4">
      <div className="max-w-6xl mx-auto grid" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`, gap: `${gap}px` }}>
        {columns.map((col, i) => (
          <div key={i} className="flex flex-col gap-4 min-w-0">
            {(col.blocks ?? []).map((child) => renderBlock(child, theme, onCta, parentColor, funnelSlug, salesLimit, salesCount))}
          </div>
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PRODUCT BLOCK (hydrates from /api/formations/public/funnel-item)
// ═══════════════════════════════════════════════════════════════════════════
type ProductInfo = {
  kind: "formation" | "product";
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image: string | null;
  price: number;
  isFree: boolean;
  rating: number;
  reviewsCount: number;
  count: number;
  countLabel: string;
};

function ProductBlock({ data, theme }: { data: Record<string, unknown>; theme: Theme }) {
  const { kind, id, layout = "card", showImage, showRating, showPrice, showCount, showDescription, ctaText, ctaIcon, bgColor, accentColor, textColor } = data as {
    kind?: string; id?: string; layout?: string; showImage?: boolean; showRating?: boolean; showPrice?: boolean; showCount?: boolean; showDescription?: boolean;
    ctaText?: string; ctaIcon?: string; bgColor?: string; accentColor?: string; textColor?: string;
  };
  const [info, setInfo] = useState<ProductInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!kind || !id) { setLoading(false); return; }
    fetch(`/api/formations/public/funnel-item?kind=${encodeURIComponent(kind)}&id=${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? r.json() : { data: null }))
      .then((j) => setInfo(j.data))
      .catch(() => setInfo(null))
      .finally(() => setLoading(false));
  }, [kind, id]);

  if (!kind || !id) {
    return (
      <div className="max-w-3xl mx-auto bg-amber-50 border-2 border-dashed border-amber-300 rounded-2xl p-6 text-center">
        <span className="material-symbols-outlined text-amber-600 text-4xl">shopping_bag</span>
        <p className="text-sm text-amber-700 mt-2 font-semibold">Aucun produit sélectionné dans l&apos;éditeur</p>
      </div>
    );
  }
  if (loading) {
    return <div className="max-w-3xl mx-auto h-48 bg-gray-100 rounded-2xl animate-pulse" />;
  }
  if (!info) {
    return (
      <div className="max-w-3xl mx-auto bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <p className="text-sm text-red-600">Produit introuvable ou non publié.</p>
      </div>
    );
  }

  const accent = accentColor || theme.primaryColor;
  const txtColor = textColor || theme.textColor;
  const bg = bgColor || "#ffffff";
  const checkoutLink = info.kind === "formation" ? `/checkout?fids=${info.id}` : `/checkout?pids=${info.id}`;

  // ─── Compact layout ─────────────────────────────────────────────
  if (layout === "compact") {
    return (
      <a href={checkoutLink} className="max-w-2xl mx-auto flex items-center gap-4 p-4 rounded-2xl border border-gray-200 hover:border-current hover:-translate-y-0.5 transition-all" style={{ background: bg, color: txtColor, borderColor: `${accent}30` }}>
        {showImage && info.image && <img src={info.image} alt="" className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold truncate">{info.title}</p>
          {showPrice && (
            <p className="text-lg font-extrabold mt-0.5" style={{ color: accent }}>
              {info.isFree ? "Gratuit" : `${fmt(info.price)} FCFA`}
            </p>
          )}
        </div>
        <span className="material-symbols-outlined text-[28px]" style={{ color: accent }}>{ctaIcon || "arrow_forward"}</span>
      </a>
    );
  }

  // ─── Hero layout (wide split) ───────────────────────────────────
  if (layout === "hero") {
    return (
      <section className="py-12 px-4" style={{ background: bg, color: txtColor }}>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {showImage && info.image && <img src={info.image} alt="" className="w-full rounded-3xl shadow-2xl" />}
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3">{info.title}</h2>
            {showDescription && info.description && <p className="text-base text-gray-600 mb-4 leading-relaxed">{info.description}</p>}
            <div className="flex items-center gap-4 mb-5 flex-wrap">
              {showRating && info.rating > 0 && (
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px]" style={{ color: "#f59e0b", fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="text-sm font-bold">{info.rating.toFixed(1)}</span>
                  <span className="text-xs text-gray-500">({info.reviewsCount} avis)</span>
                </div>
              )}
              {showCount && info.count > 0 && (
                <span className="text-sm text-gray-500">{fmt(info.count)} {info.countLabel}</span>
              )}
            </div>
            {showPrice && (
              <p className="text-4xl font-extrabold mb-5" style={{ color: accent }}>
                {info.isFree ? "Gratuit" : `${fmt(info.price)} FCFA`}
              </p>
            )}
            <a href={checkoutLink} className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl text-white font-bold text-base shadow-lg hover:opacity-90 transition-opacity" style={{ background: `linear-gradient(to right, ${accent}, ${theme.accentColor})` }}>
              {ctaText ?? "Acheter maintenant"}
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{ctaIcon || "shopping_cart"}</span>
            </a>
          </div>
        </div>
      </section>
    );
  }

  // ─── Card layout (default) ──────────────────────────────────────
  return (
    <div className="max-w-md mx-auto rounded-3xl overflow-hidden shadow-2xl" style={{ background: bg, color: txtColor, border: `2px solid ${accent}` }}>
      {showImage && info.image && <img src={info.image} alt="" className="w-full aspect-video object-cover" />}
      <div className="p-6">
        <h3 className="text-xl font-extrabold mb-2">{info.title}</h3>
        {showDescription && info.description && <p className="text-sm text-gray-600 mb-3 leading-relaxed line-clamp-3">{info.description}</p>}
        <div className="flex items-center gap-3 mb-4 flex-wrap text-sm">
          {showRating && info.rating > 0 && (
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]" style={{ color: "#f59e0b", fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="font-bold">{info.rating.toFixed(1)}</span>
            </div>
          )}
          {showCount && info.count > 0 && (
            <span className="text-gray-500">{fmt(info.count)} {info.countLabel}</span>
          )}
        </div>
        {showPrice && (
          <p className="text-3xl font-extrabold mb-4" style={{ color: accent }}>
            {info.isFree ? "Gratuit" : `${fmt(info.price)} FCFA`}
          </p>
        )}
        <a href={checkoutLink} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-bold shadow-lg hover:opacity-90 transition-opacity" style={{ background: `linear-gradient(to right, ${accent}, ${theme.accentColor})` }}>
          {ctaText ?? "Acheter maintenant"}
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{ctaIcon || "shopping_cart"}</span>
        </a>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// READY-MADE SECTION RENDERERS
// ═══════════════════════════════════════════════════════════════════════════
function HeroBlock({ data, theme, onCta }: { data: Record<string, unknown>; theme: Theme; onCta: () => void }) {
  const { badge, headline, subheadline, ctaText, imageUrl, ctaLink } = data as {
    badge?: string; headline?: string; subheadline?: string; ctaText?: string; imageUrl?: string; bgColor?: string; textColor?: string; ctaLink?: string;
  };
  const heroBg = data.bgColor ? (data.bgColor as string) : `linear-gradient(135deg, ${theme.primaryColor}10, ${theme.accentColor}05)`;
  const heroText = (data.textColor as string) ?? theme.textColor;
  const handleCta = useLink(ctaLink, onCta);
  return (
    <section className="py-16 md:py-24 px-4" style={{ background: heroBg, color: heroText }}>
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div>
          {badge && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4" style={{ background: `${theme.primaryColor}15`, color: theme.primaryColor }}>
              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
              {badge}
            </span>
          )}
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-5" style={{ color: heroText }}>{headline}</h1>
          {subheadline && <p className="text-base md:text-lg mb-7 leading-relaxed" style={{ color: heroText, opacity: 0.85 }}>{subheadline}</p>}
          <button onClick={handleCta} className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl text-white font-bold text-base shadow-lg hover:opacity-90 hover:-translate-y-0.5 transition-all" style={{ background: `linear-gradient(to right, ${theme.primaryColor}, ${theme.accentColor})` }}>
            {ctaText ?? "Commencer"}
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
        </div>
        {imageUrl && <div><img src={imageUrl} alt="" className="w-full rounded-3xl shadow-2xl" /></div>}
      </div>
    </section>
  );
}

function FeaturesBlock({ data, theme }: { data: Record<string, unknown>; theme: Theme }) {
  const { title, items, columns } = data as { title?: string; items?: Array<{ icon: string; title: string; desc: string }>; columns?: number };
  const cols = columns ?? 3;
  const colsClass = cols === 1 ? "grid-cols-1" : cols === 2 ? "grid-cols-1 md:grid-cols-2" : cols === 4 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
  return (
    <section className="py-14 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        {title && <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-10" style={{ color: theme.textColor }}>{title}</h2>}
        <div className={`grid gap-5 ${colsClass}`}>
          {(items ?? []).map((item, i) => (
            <div key={i} className="bg-gray-50 rounded-2xl p-6 hover:bg-gray-100 transition-colors">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${theme.primaryColor}15` }}>
                <span className="material-symbols-outlined text-[24px]" style={{ color: theme.primaryColor, fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
              </div>
              <h3 className="text-base font-extrabold mb-1.5" style={{ color: theme.textColor }}>{item.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CountdownBlock({ data, theme, blockId, funnelSlug }: { data: Record<string, unknown>; theme: Theme; blockId?: string; funnelSlug?: string }) {
  const {
    title, endsInHours = 48, subtitle, mode = "duration",
    endsAt, durationMinutes = 30,
    expiredBehavior = "text", expiredText = "Cette offre a expiré.", expiredRedirect,
    bgColor, textColor, size = "md",
  } = data as {
    title?: string; endsInHours?: number; subtitle?: string; mode?: string;
    endsAt?: string; durationMinutes?: number;
    expiredBehavior?: string; expiredText?: string; expiredRedirect?: string;
    bgColor?: string; textColor?: string; size?: string;
  };

  const [target] = useState(() => {
    if (mode === "fixed_date" && endsAt) return new Date(endsAt).getTime();
    if (mode === "per_visitor") {
      const key = `countdown_${funnelSlug ?? "f"}_${blockId ?? "b"}`;
      const stored = typeof window !== "undefined" ? localStorage.getItem(key) : null;
      if (stored) return Number(stored);
      const t = Date.now() + (durationMinutes ?? 30) * 60 * 1000;
      if (typeof window !== "undefined") localStorage.setItem(key, String(t));
      return t;
    }
    return Date.now() + (endsInHours ?? 48) * 60 * 60 * 1000;
  });

  const [now, setNow] = useState(Date.now());
  useEffect(() => { const tick = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(tick); }, []);

  const remaining = Math.max(0, target - now);
  const expired = remaining === 0;
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  // Handle expiration behavior
  useEffect(() => {
    if (expired && expiredBehavior === "redirect" && expiredRedirect) {
      window.location.href = expiredRedirect;
    }
  }, [expired, expiredBehavior, expiredRedirect]);

  if (expired && expiredBehavior === "hide") return null;

  const sizeClasses = size === "sm"
    ? { section: "py-8 px-4", title: "text-lg md:text-xl", number: "text-2xl md:text-3xl", box: "px-3 py-2 md:px-4 md:py-3 min-w-[50px]", gap: "gap-2 md:gap-3" }
    : size === "lg"
    ? { section: "py-16 px-4", title: "text-2xl md:text-4xl", number: "text-4xl md:text-6xl", box: "px-5 py-4 md:px-8 md:py-5 min-w-[80px]", gap: "gap-4 md:gap-6" }
    : { section: "py-12 px-4", title: "text-xl md:text-2xl", number: "text-3xl md:text-5xl", box: "px-4 py-3 md:px-6 md:py-4 min-w-[64px]", gap: "gap-3 md:gap-5" };

  const bg = bgColor || `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`;
  const txt = textColor || "white";

  return (
    <section className={sizeClasses.section} style={{ background: bg }}>
      <div className="max-w-3xl mx-auto text-center" style={{ color: txt }}>
        <h2 className={`${sizeClasses.title} font-extrabold mb-5`}>{title}</h2>
        {expired ? (
          <p className="text-base md:text-lg font-semibold opacity-90">{expiredText}</p>
        ) : (
          <>
            <div className={`flex items-center justify-center ${sizeClasses.gap} mb-3`}>
              {[{ v: days, label: "Jours" }, { v: hours, label: "Heures" }, { v: minutes, label: "Min" }, { v: seconds, label: "Sec" }].map((unit) => (
                <div key={unit.label} className={`bg-white/15 backdrop-blur-sm rounded-2xl ${sizeClasses.box}`}>
                  <p className={`${sizeClasses.number} font-extrabold tabular-nums`}>{String(unit.v).padStart(2, "0")}</p>
                  <p className="text-[10px] md:text-xs uppercase tracking-wider mt-1 opacity-80">{unit.label}</p>
                </div>
              ))}
            </div>
            {subtitle && <p className="text-sm md:text-base opacity-85 mt-4">{subtitle}</p>}
          </>
        )}
      </div>
    </section>
  );
}

function TestimonialsBlock({ data, theme }: { data: Record<string, unknown>; theme: Theme }) {
  const { title, items, columns } = data as { title?: string; items?: Array<{ name: string; role: string; text: string; rating: number }>; columns?: number };
  const cols = columns ?? 2;
  const colsClass = cols === 1 ? "grid-cols-1" : cols === 3 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 md:grid-cols-2";
  return (
    <section className="py-14 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        {title && <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-10" style={{ color: theme.textColor }}>{title}</h2>}
        <div className={`grid gap-5 ${colsClass}`}>
          {(items ?? []).map((item, i) => (
            <div key={i} className="bg-gray-50 rounded-2xl p-6">
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} className="material-symbols-outlined text-[16px]" style={{ color: s <= item.rating ? "#f59e0b" : "#d1d5db", fontVariationSettings: "'FILL' 1" }}>star</span>
                ))}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed mb-4 italic">&ldquo;{item.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})` }}>
                  {item.name?.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: theme.textColor }}>{item.name}</p>
                  <p className="text-xs text-gray-500">{item.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqBlock({ data, theme }: { data: Record<string, unknown>; theme: Theme }) {
  const { title, items } = data as { title?: string; items?: Array<{ q: string; a: string }> };
  return (
    <section className="py-14 px-4 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        {title && <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-8" style={{ color: theme.textColor }}>{title}</h2>}
        <div className="space-y-3">
          {(items ?? []).map((item, i) => (
            <details key={i} className="group bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 list-none">
                <span className="text-sm font-bold" style={{ color: theme.textColor }}>{item.q}</span>
                <span className="material-symbols-outlined text-[20px] group-open:rotate-180 transition-transform" style={{ color: theme.primaryColor }}>expand_more</span>
              </summary>
              <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed">{item.a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBlock({ data, theme, onCta }: { data: Record<string, unknown>; theme: Theme; onCta: () => void }) {
  const { headline, subheadline, ctaText, ctaLink } = data as { headline?: string; subheadline?: string; ctaText?: string; ctaLink?: string };
  const handle = useLink(ctaLink, onCta);
  return (
    <section className="py-16 px-4 text-center" style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})` }}>
      <div className="max-w-2xl mx-auto text-white">
        <h2 className="text-2xl md:text-4xl font-extrabold mb-3">{headline}</h2>
        {subheadline && <p className="text-base md:text-lg opacity-90 mb-7">{subheadline}</p>}
        <button onClick={handle} className="inline-flex items-center gap-2 bg-white px-7 py-4 rounded-2xl font-bold text-base shadow-lg hover:opacity-90 transition-opacity" style={{ color: theme.primaryColor }}>
          {ctaText ?? "Commencer"}
          <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
        </button>
      </div>
    </section>
  );
}

function VideoBlock({ data, theme }: { data: Record<string, unknown>; theme: Theme }) {
  const { url, externalUrl, caption } = data as { url?: string; externalUrl?: string; caption?: string };
  const src = (url && url.length > 0) ? url : externalUrl;
  if (!src) return null;
  const isUploaded = src.includes("supabase") || /\.(mp4|webm|mov)$/i.test(src);
  let embedSrc = src;
  if (!isUploaded) {
    const yt = src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)/);
    if (yt) embedSrc = `https://www.youtube.com/embed/${yt[1]}`;
    const vimeo = src.match(/vimeo\.com\/(\d+)/);
    if (vimeo) embedSrc = `https://player.vimeo.com/video/${vimeo[1]}`;
  }
  return (
    <section className="py-14 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="aspect-video rounded-2xl overflow-hidden bg-black">
          {isUploaded ? <video src={src} controls className="w-full h-full object-cover" /> : <iframe src={embedSrc} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen />}
        </div>
        {caption && <p className="text-center text-sm text-gray-600 mt-3" style={{ color: theme.textColor }}>{caption}</p>}
      </div>
    </section>
  );
}

function StatsBlock({ data, theme }: { data: Record<string, unknown>; theme: Theme }) {
  const { title, subtitle, items, columns, bgColor, valueColor } = data as {
    title?: string; subtitle?: string;
    items?: Array<{ value: string; prefix?: string; suffix?: string; label: string; icon?: string }>;
    columns?: number; bgColor?: string; valueColor?: string;
  };
  const cols = columns ?? 3;
  const colsClass = cols === 2 ? "grid-cols-2" : cols === 4 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-3";
  const valColor = valueColor || theme.primaryColor;
  return (
    <section className="py-14 px-4" style={{ background: bgColor || "#f9fafb" }}>
      <div className="max-w-5xl mx-auto">
        {(title || subtitle) && (
          <div className="text-center mb-10">
            {title && <h2 className="text-2xl md:text-4xl font-extrabold" style={{ color: theme.textColor }}>{title}</h2>}
            {subtitle && <p className="text-sm md:text-base text-gray-600 mt-2">{subtitle}</p>}
          </div>
        )}
        <div className={`grid gap-6 text-center ${colsClass}`}>
          {(items ?? []).map((s, i) => (
            <div key={i} className="flex flex-col items-center">
              {s.icon && (
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: `${valColor}15` }}>
                  <span className="material-symbols-outlined text-[24px]" style={{ color: valColor, fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                </div>
              )}
              <p className="text-3xl md:text-5xl font-extrabold" style={{ color: valColor }}>
                {s.prefix}{s.value}{s.suffix}
              </p>
              <p className="text-xs md:text-sm text-gray-600 mt-2 font-semibold">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingBlock({ data, theme, onCta }: { data: Record<string, unknown>; theme: Theme; onCta: () => void }) {
  const { title, price = 0, originalPrice, currency = "FCFA", benefits, benefitIcon = "check_circle", ctaText, ctaLink, badgeText, badgeColor, guaranteeText, accentColor } = data as {
    title?: string; price?: number; originalPrice?: number; currency?: string; benefits?: string[]; benefitIcon?: string;
    ctaText?: string; ctaLink?: string; badgeText?: string; badgeColor?: string; guaranteeText?: string; accentColor?: string;
  };
  const handle = useLink(ctaLink, onCta);
  const discount = originalPrice && originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  const accent = accentColor || theme.primaryColor;
  const badgeBg = badgeColor || accent;
  return (
    <section className="py-14 px-4 bg-white">
      <div className="max-w-md mx-auto relative">
        {badgeText && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 rounded-full text-[11px] font-extrabold uppercase tracking-widest text-white shadow-lg whitespace-nowrap" style={{ background: badgeBg }}>
            {badgeText}
          </div>
        )}
        <div className="bg-white rounded-3xl border-2 p-8 text-center shadow-2xl" style={{ borderColor: accent }}>
          {title && <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: accent }}>{title}</p>}
          {discount > 0 && <span className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 mb-3">ÉCONOMISEZ {discount}%</span>}
          <div className="mb-6">
            <p className="text-5xl font-extrabold" style={{ color: theme.textColor }}>{fmt(price)} <span className="text-xl font-bold text-gray-500">{currency}</span></p>
            {originalPrice && originalPrice > price && <p className="text-base text-gray-400 line-through mt-1">{fmt(originalPrice)} {currency}</p>}
          </div>
          {benefits && benefits.length > 0 && (
            <ul className="space-y-2.5 mb-7 text-left">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[20px] flex-shrink-0 mt-0.5" style={{ color: accent, fontVariationSettings: "'FILL' 1" }}>{benefitIcon}</span>
                  <span className="text-sm leading-relaxed" style={{ color: theme.textColor }}>{b}</span>
                </li>
              ))}
            </ul>
          )}
          <button onClick={handle} className="w-full py-4 rounded-2xl text-white font-bold text-base shadow-lg hover:opacity-90 hover:-translate-y-0.5 transition-all" style={{ background: `linear-gradient(to right, ${accent}, ${theme.accentColor})` }}>
            {ctaText ?? "Commander maintenant"}
          </button>
          {guaranteeText && (
            <p className="text-xs text-gray-500 mt-4 flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]" style={{ color: accent }}>verified_user</span>
              {guaranteeText}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// GUARANTEE BLOCK
// ═══════════════════════════════════════════════════════════════════════════
function GuaranteeBlock({ data, theme }: { data: Record<string, unknown>; theme: Theme }) {
  const { icon = "verified_user", title, text, style = "card", accentColor } = data as {
    icon?: string; title?: string; text?: string; style?: string; accentColor?: string;
  };
  const accent = accentColor || theme.primaryColor;
  if (style === "minimal") {
    return (
      <div className="py-6 px-4 text-center">
        <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[18px]" style={{ color: accent, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
          <span className="font-semibold">{title}</span> — {text}
        </p>
      </div>
    );
  }
  if (style === "banner") {
    return (
      <div className="py-5 px-4" style={{ background: `${accent}08` }}>
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${accent}15` }}>
            <span className="material-symbols-outlined text-[24px]" style={{ color: accent, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
          </div>
          <div>
            <p className="text-sm font-extrabold" style={{ color: theme.textColor }}>{title}</p>
            {text && <p className="text-xs text-gray-600 mt-0.5">{text}</p>}
          </div>
        </div>
      </div>
    );
  }
  // card (default)
  return (
    <div className="py-8 px-4">
      <div className="max-w-md mx-auto text-center border-2 border-dashed rounded-2xl p-6" style={{ borderColor: `${accent}40` }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: `${accent}15` }}>
          <span className="material-symbols-outlined text-[28px]" style={{ color: accent, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        </div>
        <p className="text-base font-extrabold mb-1" style={{ color: theme.textColor }}>{title}</p>
        {text && <p className="text-sm text-gray-600 leading-relaxed">{text}</p>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LOGO BAR BLOCK
// ═══════════════════════════════════════════════════════════════════════════
function LogoBarBlock({ data, theme }: { data: Record<string, unknown>; theme: Theme }) {
  const { title, items = [], bgColor, grayscale } = data as {
    title?: string; items?: Array<{ label: string; icon?: string; url?: string }>; bgColor?: string; grayscale?: boolean;
  };
  return (
    <section className="py-8 px-4" style={{ background: bgColor || undefined }}>
      <div className="max-w-4xl mx-auto text-center">
        {title && <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5">{title}</p>}
        <div className="flex items-center justify-center gap-6 md:gap-10 flex-wrap" style={grayscale ? { filter: "grayscale(1)", opacity: 0.6 } : undefined}>
          {(items ?? []).map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors">
              {item.url ? (
                <img src={item.url} alt={item.label} className="h-8 md:h-10 object-contain" />
              ) : item.icon ? (
                <span className="material-symbols-outlined text-[28px]" style={{ color: theme.primaryColor }}>{item.icon}</span>
              ) : null}
              <span className="text-xs font-semibold hidden sm:block">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ALERT BLOCK
// ═══════════════════════════════════════════════════════════════════════════
function AlertBlock({ data }: { data: Record<string, unknown> }) {
  const { text, variant = "warning", icon = "campaign" } = data as { text?: string; variant?: string; icon?: string };
  const styles: Record<string, { bg: string; border: string; text: string; iconColor: string }> = {
    info: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-900", iconColor: "#2563eb" },
    success: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-900", iconColor: "#059669" },
    warning: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-900", iconColor: "#d97706" },
    danger: { bg: "bg-red-50", border: "border-red-200", text: "text-red-900", iconColor: "#dc2626" },
  };
  const s = styles[variant] ?? styles.warning;
  return (
    <div className="px-4 py-4">
      <div className={`max-w-3xl mx-auto ${s.bg} border ${s.border} rounded-2xl px-5 py-4 flex items-start gap-3`}>
        <span className="material-symbols-outlined text-[22px] flex-shrink-0 mt-0.5" style={{ color: s.iconColor, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        <p className={`text-sm font-semibold leading-relaxed ${s.text}`}>{text}</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SOCIAL PROOF BLOCK
// ═══════════════════════════════════════════════════════════════════════════
function SocialProofBlock({ data, theme }: { data: Record<string, unknown>; theme: Theme }) {
  const { style = "live", liveText, liveCount = 12, liveVariance = 5, counterItems, recentItems, accentColor } = data as {
    style?: string; liveText?: string; liveCount?: number; liveVariance?: number;
    counterItems?: Array<{ value: string; label: string; icon: string }>;
    recentItems?: Array<{ name: string; city: string; action: string; time: string }>;
    accentColor?: string;
  };
  const accent = accentColor || theme.primaryColor;
  const [count, setCount] = useState(liveCount);
  useEffect(() => {
    if (style !== "live") return;
    const tick = setInterval(() => {
      setCount((c) => {
        const delta = Math.floor(Math.random() * 3) - 1;
        return Math.max(1, Math.min(c + delta, (liveCount ?? 12) + (liveVariance ?? 5)));
      });
    }, 3000 + Math.random() * 4000);
    return () => clearInterval(tick);
  }, [style, liveCount, liveVariance]);

  if (style === "live") {
    return (
      <div className="py-4 px-4 text-center">
        <span className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-full text-sm font-bold">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          {(liveText ?? "").replace("{count}", String(count))}
        </span>
      </div>
    );
  }

  if (style === "counter") {
    return (
      <section className="py-10 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-4">
          {(counterItems ?? []).map((item, i) => (
            <div key={i} className="text-center p-4">
              <span className="material-symbols-outlined text-[28px] mb-2 block" style={{ color: accent, fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
              <p className="text-2xl md:text-3xl font-extrabold" style={{ color: accent }}>{item.value}</p>
              <p className="text-xs text-gray-500 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // recent purchases
  const [visibleIdx, setVisibleIdx] = useState(0);
  const items = recentItems ?? [];
  useEffect(() => {
    if (items.length <= 1) return;
    const tick = setInterval(() => setVisibleIdx((i) => (i + 1) % items.length), 4000);
    return () => clearInterval(tick);
  }, [items.length]);
  const current = items[visibleIdx];
  if (!current) return null;
  return (
    <div className="fixed bottom-4 left-4 z-40 animate-slide-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 px-4 py-3 flex items-center gap-3 max-w-xs">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: accent }}>
          {current.name?.charAt(0)}
        </div>
        <div>
          <p className="text-xs font-bold text-[#191c1e]">{current.name} <span className="text-gray-400 font-normal">({current.city})</span></p>
          <p className="text-[10px] text-gray-500">{current.action} · {current.time}</p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPARISON TABLE BLOCK
// ═══════════════════════════════════════════════════════════════════════════
function ComparisonBlock({ data, theme }: { data: Record<string, unknown>; theme: Theme }) {
  const { title, columns = [], rows = [], highlightColumn = 1, accentColor } = data as {
    title?: string; columns?: string[]; rows?: Array<{ label: string; values: string[] }>; highlightColumn?: number; accentColor?: string;
  };
  const accent = accentColor || theme.primaryColor;
  return (
    <section className="py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {title && <h2 className="text-2xl font-extrabold text-center mb-8" style={{ color: theme.textColor }}>{title}</h2>}
        <div className="rounded-2xl border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-3">
            <div className="p-3 bg-gray-50" />
            {(columns ?? []).map((col, i) => (
              <div key={i} className="p-3 text-center text-xs font-extrabold uppercase tracking-wider"
                style={i === highlightColumn ? { background: accent, color: "#fff" } : { background: "#f9fafb", color: theme.textColor }}>
                {col}
              </div>
            ))}
          </div>
          {(rows ?? []).map((row, i) => (
            <div key={i} className="grid grid-cols-3 border-t border-gray-100">
              <div className="p-3 text-sm font-semibold" style={{ color: theme.textColor }}>{row.label}</div>
              {(row.values ?? []).map((val, j) => (
                <div key={j} className="p-3 text-center text-sm"
                  style={j === highlightColumn ? { background: `${accent}08`, color: accent, fontWeight: 700 } : { color: "#6b7280" }}>
                  {val === "Oui" || val === "✓" ? (
                    <span className="material-symbols-outlined text-[18px]" style={{ color: accent, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  ) : val === "Non" || val === "✗" ? (
                    <span className="material-symbols-outlined text-[18px] text-gray-300">cancel</span>
                  ) : val}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FLOATING CTA BLOCK
// ═══════════════════════════════════════════════════════════════════════════
function FloatingCtaBlock({ data, theme, onCta }: { data: Record<string, unknown>; theme: Theme; onCta: () => void }) {
  const { text, buttonText = "Commander", buttonLink, price, originalPrice, bgColor, position = "bottom" } = data as {
    text?: string; buttonText?: string; buttonLink?: string; price?: string; originalPrice?: string; bgColor?: string; position?: string;
  };
  const handle = useLink(buttonLink, onCta);
  const bg = bgColor || "linear-gradient(to right, #ffffff, #f9fafb)";
  const pos = position === "top" ? "top-0" : "bottom-0";
  return (
    <div className={`fixed ${pos} left-0 right-0 z-50 border-t border-gray-200 shadow-2xl`} style={{ background: bg }}>
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          {text && <p className="text-sm font-bold truncate" style={{ color: theme.textColor }}>{text}</p>}
          {price && (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-lg font-extrabold" style={{ color: theme.primaryColor }}>{price}</span>
              {originalPrice && <span className="text-sm text-gray-400 line-through">{originalPrice}</span>}
            </div>
          )}
        </div>
        <button onClick={handle} className="px-6 py-3 rounded-xl text-white font-bold text-sm shadow-lg hover:opacity-90 hover:-translate-y-0.5 transition-all flex-shrink-0"
          style={{ background: `linear-gradient(to right, ${theme.primaryColor}, ${theme.accentColor})` }}>
          {buttonText}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// IMAGE GALLERY BLOCK
// ═══════════════════════════════════════════════════════════════════════════
function ImageGalleryBlock({ data }: { data: Record<string, unknown> }) {
  const { images = [], columns = 3, gap = 8, radius = 12 } = data as {
    images?: Array<{ url: string; alt: string; caption?: string }>; columns?: number; gap?: number; radius?: number;
  };
  const [lightbox, setLightbox] = useState<string | null>(null);
  const colsClass = columns === 2 ? "grid-cols-2" : columns === 4 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 md:grid-cols-3";
  return (
    <section className="py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className={`grid ${colsClass}`} style={{ gap: `${gap}px` }}>
          {(images ?? []).filter((img) => img.url).map((img, i) => (
            <div key={i} className="relative overflow-hidden cursor-pointer group" style={{ borderRadius: `${radius}px` }}
              onClick={() => setLightbox(img.url)}>
              <img src={img.url} alt={img.alt} className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300" />
              {img.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                  <p className="text-white text-xs font-semibold">{img.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {lightbox && (
        <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
          <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 text-white/80 hover:text-white">
            <span className="material-symbols-outlined text-[32px]">close</span>
          </button>
        </div>
      )}
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCARCITY BLOCK
// ═══════════════════════════════════════════════════════════════════════════
function ScarcityBlock({ data, theme, salesLimit, salesCount }: { data: Record<string, unknown>; theme: Theme; salesLimit?: number | null; salesCount?: number }) {
  const {
    text = "Plus que {remaining} places disponibles !",
    urgentThreshold = 5,
    showProgressBar = true,
    barColor,
    textColor,
    emptyText = "COMPLET — inscriptions fermées",
    style = "banner",
  } = data as {
    text?: string; urgentThreshold?: number; showProgressBar?: boolean;
    barColor?: string; textColor?: string; emptyText?: string; style?: string;
  };

  const limit = salesLimit ?? 0;
  const count = salesCount ?? 0;
  const remaining = Math.max(0, limit - count);
  const isUrgent = remaining > 0 && remaining <= urgentThreshold;
  const isSoldOut = limit > 0 && remaining === 0;
  const pct = limit > 0 ? Math.min(100, (count / limit) * 100) : 0;

  if (limit === 0) return null; // no limit set, hide

  const bar = barColor || (isUrgent ? "#ef4444" : theme.primaryColor);
  const txt = textColor || (isUrgent ? "#ef4444" : theme.textColor);

  const displayText = isSoldOut
    ? emptyText
    : (text ?? "").replace("{remaining}", String(remaining)).replace("{limit}", String(limit));

  if (style === "badge") {
    return (
      <div className="flex justify-center py-4 px-4">
        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold shadow-sm ${isUrgent ? "bg-red-100 text-red-700 animate-pulse" : "bg-gray-100"}`} style={{ color: isUrgent ? undefined : txt }}>
          <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
          {displayText}
        </span>
      </div>
    );
  }

  if (style === "inline") {
    return (
      <p className={`text-center py-3 px-4 text-sm font-bold ${isUrgent ? "animate-pulse" : ""}`} style={{ color: txt }}>
        {displayText}
      </p>
    );
  }

  // banner (default)
  return (
    <div className="py-5 px-4">
      <div className="max-w-2xl mx-auto">
        <p className={`text-center text-sm md:text-base font-bold mb-3 ${isUrgent ? "animate-pulse" : ""}`} style={{ color: txt }}>
          <span className="material-symbols-outlined text-[18px] align-text-bottom mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
          {displayText}
        </p>
        {showProgressBar && !isSoldOut && (
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: bar }} />
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BLOCK DISPATCHER
// ═══════════════════════════════════════════════════════════════════════════
// renderBlock supports color inheritance: when a Section/Row/ContentBox sets
// a textColor, that color is passed down as `parentColor`, which becomes the
// effective theme.textColor for the children. This way, atomic blocks (text,
// list, icon-box, heading) inside a dark section automatically use light text.
function renderBlock(block: Block, theme: Theme, onCta: () => void, parentColor?: string, funnelSlug?: string, salesLimit?: number | null, salesCount?: number): ReactElement | null {
  // If parent set a color, override theme.textColor for this subtree
  const effTheme: Theme = parentColor ? { ...theme, textColor: parentColor } : theme;
  switch (block.type) {
    // Containers — pass their own textColor (or inherited) further down
    case "row": return <RowBlock key={block.id} data={block.data} theme={effTheme} onCta={onCta} parentColor={parentColor} funnelSlug={funnelSlug} salesLimit={salesLimit} salesCount={salesCount} />;
    case "section": return <SectionBlock key={block.id} data={block.data} theme={effTheme} onCta={onCta} funnelSlug={funnelSlug} salesLimit={salesLimit} salesCount={salesCount} />;
    case "content-box": return <ContentBoxBlock key={block.id} data={block.data} theme={effTheme} onCta={onCta} parentColor={parentColor} funnelSlug={funnelSlug} salesLimit={salesLimit} salesCount={salesCount} />;
    // Product
    case "product": return <ProductBlock key={block.id} data={block.data} theme={effTheme} />;
    // Atomic
    case "heading": return <HeadingBlock key={block.id} data={block.data} theme={effTheme} />;
    case "text": return <TextBlock key={block.id} data={block.data} theme={effTheme} />;
    case "image": return <ImageBlock key={block.id} data={block.data} />;
    case "button": return <ButtonBlock key={block.id} data={block.data} theme={effTheme} onDefault={onCta} />;
    case "icon-box": return <IconBoxBlock key={block.id} data={block.data} theme={effTheme} />;
    case "divider": return <DividerBlock key={block.id} data={block.data} />;
    case "spacer": return <SpacerBlock key={block.id} data={block.data} />;
    case "list": return <ListBlock key={block.id} data={block.data} theme={effTheme} />;
    case "html": return <HtmlBlock key={block.id} data={block.data} />;
    case "video":
      return <VideoBlock key={block.id} data={block.data} theme={effTheme} />;
    // Ready-made sections (have their own theming, use theme as-is)
    case "hero": return <HeroBlock key={block.id} data={block.data} theme={theme} onCta={onCta} />;
    case "features": return <FeaturesBlock key={block.id} data={block.data} theme={theme} />;
    case "countdown": return <CountdownBlock key={block.id} data={block.data} theme={theme} blockId={block.id} funnelSlug={funnelSlug} />;
    case "testimonials": return <TestimonialsBlock key={block.id} data={block.data} theme={theme} />;
    case "faq": return <FaqBlock key={block.id} data={block.data} theme={theme} />;
    case "cta": return <CtaBlock key={block.id} data={block.data} theme={theme} onCta={onCta} />;
    case "stats": return <StatsBlock key={block.id} data={block.data} theme={theme} />;
    case "pricing": return <PricingBlock key={block.id} data={block.data} theme={theme} onCta={onCta} />;
    // Conversion & Trust
    case "scarcity": return <ScarcityBlock key={block.id} data={block.data} theme={theme} salesLimit={salesLimit} salesCount={salesCount} />;
    case "guarantee": return <GuaranteeBlock key={block.id} data={block.data} theme={theme} />;
    case "logo-bar": return <LogoBarBlock key={block.id} data={block.data} theme={theme} />;
    case "alert": return <AlertBlock key={block.id} data={block.data} />;
    case "social-proof": return <SocialProofBlock key={block.id} data={block.data} theme={theme} />;
    case "comparison": return <ComparisonBlock key={block.id} data={block.data} theme={theme} />;
    case "floating-cta": return <FloatingCtaBlock key={block.id} data={block.data} theme={theme} onCta={onCta} />;
    case "image-gallery": return <ImageGalleryBlock key={block.id} data={block.data} />;
    default: return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════
const DEFAULT_THEME: Theme = {
  primaryColor: "#006e2f",
  accentColor: "#22c55e",
  textColor: "#191c1e",
  bgColor: "#f7f9fb",
};

export default function FunnelLandingClient({ slug }: { slug: string }) {
  const router = useRouter();
  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/formations/public/funnel/${slug}`);
        if (!res.ok) { setNotFound(true); return; }
        const json = await res.json();
        setFunnel(json.data);
      } catch { setNotFound(true); }
      finally { setLoading(false); }
    }
    load();
  }, [slug]);

  function handleCta() {
    if (!funnel) return;
    const landing = funnel.steps[0];
    if (landing?.formationId) router.push(`/checkout?fids=${landing.formationId}`);
    else if (landing?.productId) router.push(`/checkout?pids=${landing.productId}`);
    else router.push("/explorer");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <span className="material-symbols-outlined text-[#006e2f] text-5xl animate-spin">progress_activity</span>
      </div>
    );
  }

  if (notFound || !funnel) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center max-w-md">
          <span className="material-symbols-outlined text-gray-300 text-6xl">link_off</span>
          <h2 className="text-lg font-bold text-[#191c1e] mt-3">Page introuvable</h2>
          <p className="text-sm text-[#5c647a] mt-1.5 mb-4">Cette page de vente n&apos;existe pas ou n&apos;a pas encore été publiée.</p>
        </div>
      </div>
    );
  }

  const theme = { ...DEFAULT_THEME, ...(funnel.theme ?? {}) };
  const fontFamily = theme.font || "Manrope";
  const landingStep = funnel.steps.find((s) => s.stepType === "LANDING") ?? funnel.steps[0];
  const blocks = (landingStep?.blocks as Block[] | null) ?? [];

  // Load Google Font dynamically if not default
  useEffect(() => {
    if (fontFamily && fontFamily !== "Manrope") {
      const id = `gfont-${fontFamily.replace(/\s/g, "-")}`;
      if (!document.getElementById(id)) {
        const link = document.createElement("link");
        link.id = id;
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@300;400;500;600;700;800&display=swap`;
        document.head.appendChild(link);
      }
    }
  }, [fontFamily]);

  return (
    <div style={{ background: theme.bgColor, color: theme.textColor, fontFamily: `'${fontFamily}', sans-serif` }}>
      <PixelInjector pixels={funnel.instructeur.marketingPixels ?? []} event={{ name: "PageView" }} />

      {blocks.length === 0 ? (
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center max-w-md">
            <span className="material-symbols-outlined text-gray-300 text-6xl">construction</span>
            <h2 className="text-lg font-bold text-[#191c1e] mt-3">Page en construction</h2>
            <p className="text-sm text-[#5c647a] mt-1.5">Ce funnel n&apos;a pas encore de contenu publié.</p>
          </div>
        </div>
      ) : (
        blocks.map((block) => {
          const vis = (block.data._visibility as string) ?? "all";
          const anim = (block.data._animation as string) ?? "none";
          const customCss = (block.data._customCss as string) ?? "";
          const visClass = vis === "desktop" ? "hidden md:block" : vis === "mobile" ? "md:hidden" : "";
          const marginTop = (block.data._marginTop as number) ?? 0;
          const marginBottom = (block.data._marginBottom as number) ?? 0;
          const rendered = renderBlock(block, theme, handleCta, undefined, funnel.slug, funnel.salesLimit, funnel.salesCount);
          if (!rendered) return null;
          const marginStyle = (marginTop || marginBottom) ? { marginTop: `${marginTop}px`, marginBottom: `${marginBottom}px` } : undefined;
          return (
            <AnimatedBlock key={block.id} animation={anim as AnimationType} className={visClass}>
              {customCss && (
                <style dangerouslySetInnerHTML={{ __html: customCss.replace(/\.block/g, `#fh-block-${block.id}`) }} />
              )}
              <div id={`fh-block-${block.id}`} style={marginStyle}>
                {rendered}
              </div>
            </AnimatedBlock>
          );
        })
      )}

      <footer className="py-6 px-4 text-center bg-white border-t border-gray-100">
        <p className="text-xs text-gray-400">
          Propulsé par <a href="/" className="font-bold text-[#006e2f] hover:underline">Novakou</a>
        </p>
      </footer>
    </div>
  );
}
