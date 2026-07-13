// Layout partagé pour les guides v2.
// Permet d'écrire un guide complet en ~200 lignes au lieu de 1500.
// Chaque guide définit son meta + un tableau de sections, le layout
// rend hero, sommaire, sections, CTA et JSON-LD Article automatiquement.

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://novakou.com";

const satoshi = {
  fontFamily: "'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
} as const;

const satoshiHeading = {
  ...satoshi,
  fontWeight: 700,
  letterSpacing: "-0.04em",
} as const;

const COLORS = {
  primary: "#006e2f",
  dark: "#191c1e",
  muted: "#5c647a",
  surface: "#f6fbf2",
} as const;

export interface GuideMeta {
  slug: string;
  title: string;
  subtitle: string;
  category: "Gagner" | "Créer" | "Vendre" | "Promouvoir" | "Automatiser" | "Technique";
  level: "Débutant" | "Intermédiaire" | "Avancé" | "Complet";
  levelColor: string;
  /** Gradient CSS pour le hero (background) */
  gradient: string;
  /** Icone Material Symbols (ex: "campaign") */
  icon: string;
  /** Durée de lecture estimée affichée (ex: "12 min") */
  time: string;
  /** Nombre de chapitres affiché (ex: "10 sections") */
  chapters: string;
  /** ISO date YYYY-MM-DD */
  publishedAt: string;
  /** ISO date YYYY-MM-DD */
  updatedAt: string;
  /** Mots-clés SEO (5-8 max) */
  keywords: string[];
}

export interface GuideSection {
  id: string; // anchor pour sommaire
  label: string; // texte du sommaire
  /** Contenu de la section. JSX rendu dans <section>. */
  content: ReactNode;
}

export interface GuideFaq {
  q: string;
  a: string;
}

export interface Props {
  meta: GuideMeta;
  sections: GuideSection[];
  /** FAQ optionnelle → section visible + FAQPage JSON-LD (rich results Google). */
  faq?: GuideFaq[];
  /** Statistiques affichées dans le hero (3-4 cartes). Remplit et crédibilise. */
  stats?: Array<{ value: string; label: string }>;
  /** Image de couverture large sous le hero (photo de pub). */
  heroImage?: { src: string; alt: string; caption?: string };
}

export function GuideArticleLayout({ meta, sections, faq, stats, heroImage }: Props) {
  const url = `${APP_URL}/guides/${meta.slug}`;
  const ogImage = `${APP_URL}/api/og?type=guide&title=${encodeURIComponent(
    meta.title,
  )}&subtitle=${encodeURIComponent(meta.subtitle)}`;

  // JSON-LD Article — richest possible pour Google SERP
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: meta.title,
    description: meta.subtitle,
    image: [ogImage],
    datePublished: meta.publishedAt,
    dateModified: meta.updatedAt,
    author: {
      "@type": "Person",
      name: "Équipe Novakou",
      url: APP_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "Novakou",
      url: APP_URL,
      logo: { "@type": "ImageObject", url: `${APP_URL}/icon` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    inLanguage: "fr",
    keywords: meta.keywords.join(", "),
    articleSection: meta.category,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: APP_URL },
      { "@type": "ListItem", position: 2, name: "Guides", item: `${APP_URL}/guides` },
      { "@type": "ListItem", position: 3, name: meta.title, item: url },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faq && faq.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faq.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            }),
          }}
        />
      )}

      <article className="min-h-screen bg-white" style={satoshi}>
        {/* ── HERO ─────────────────────────────────────────────── */}
        <section
          className="w-full pt-12 pb-16 md:pt-20 md:pb-24 px-4 sm:px-6 text-white"
          style={{ background: meta.gradient }}
        >
          <div className="max-w-4xl mx-auto">
            <nav className="text-sm text-white/80 mb-6" aria-label="Fil d'Ariane">
              <Link href="/" className="hover:text-white hover:underline">
                Accueil
              </Link>
              <span className="mx-2">/</span>
              <Link href="/guides" className="hover:text-white hover:underline">
                Guides
              </Link>
              <span className="mx-2">/</span>
              <span className="text-white font-semibold">{meta.category}</span>
            </nav>

            <div className="flex items-center gap-3 mb-6">
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3">
                <span
                  className="material-symbols-outlined text-white text-[36px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {meta.icon}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/80">
                  <span>{meta.category}</span>
                  <span className="opacity-50">•</span>
                  <span>{meta.level}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/90 mt-0.5">
                  <span>{meta.time} de lecture</span>
                  <span className="opacity-50">•</span>
                  <span>{meta.chapters}</span>
                </div>
              </div>
            </div>

            <h1
              className="text-4xl sm:text-5xl md:text-6xl mb-5 leading-tight"
              style={satoshiHeading}
            >
              {meta.title}
            </h1>
            <p className="text-base md:text-lg leading-relaxed max-w-2xl text-white/90">
              {meta.subtitle}
            </p>

            {stats && stats.length > 0 && (
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {stats.map((s, i) => (
                  <div key={i} className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 p-4">
                    <p className="text-2xl md:text-3xl font-extrabold text-white" style={satoshiHeading}>
                      {s.value}
                    </p>
                    <p className="text-[12px] text-white/80 mt-1 leading-snug">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── IMAGE DE COUVERTURE ──────────────────────────────── */}
        {heroImage && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-8 md:-mt-12 mb-4 relative z-10">
            <figure className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-black/5" style={{ aspectRatio: "16 / 8" }}>
              <Image src={heroImage.src} alt={heroImage.alt} fill className="object-cover" sizes="(max-width: 896px) 100vw, 896px" priority />
              {heroImage.caption && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                  <figcaption className="absolute bottom-4 left-5 right-5 text-white text-sm font-medium">
                    {heroImage.caption}
                  </figcaption>
                </>
              )}
            </figure>
          </div>
        )}

        {/* ── SOMMAIRE ─────────────────────────────────────────── */}
        {sections.length > 1 && (
          <aside className={`max-w-4xl mx-auto px-4 sm:px-6 mb-12 relative z-10 ${heroImage ? "mt-8" : "-mt-8 md:-mt-12"}`}>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 md:p-8">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-4">
                Au sommaire
              </p>
              <ul className="space-y-2">
                {sections.map((s, i) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="text-sm text-[#006e2f] hover:underline font-medium flex items-start gap-2"
                    >
                      <span className="font-mono text-gray-400 text-xs mt-1 flex-shrink-0">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>{s.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}

        {/* ── SECTIONS ─────────────────────────────────────────── */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
          {sections.map((s) => (
            <section
              key={s.id}
              id={s.id}
              className="scroll-mt-24 mb-12 last:mb-0"
            >
              <h2
                className="text-2xl md:text-3xl font-extrabold text-[#191c1e] mb-5"
                style={satoshiHeading}
              >
                {s.label}
              </h2>
              <div className="text-gray-700 text-[17px] md:text-[18px] leading-[1.8]">
                {s.content}
              </div>
            </section>
          ))}
        </div>

        {/* ── FAQ (rich results) ───────────────────────────────── */}
        {faq && faq.length > 0 && (
          <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-16" id="faq">
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#191c1e] mb-6" style={satoshiHeading}>
              Questions fréquentes
            </h2>
            <div className="space-y-3">
              {faq.map((f, i) => (
                <details
                  key={i}
                  className="group bg-white rounded-xl border border-gray-200 p-5 [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex items-center justify-between cursor-pointer font-bold text-[#191c1e] gap-3">
                    {f.q}
                    <span className="text-[#006e2f] transition-transform group-open:rotate-45 text-xl leading-none flex-shrink-0">
                      +
                    </span>
                  </summary>
                  <p className="text-gray-700 mt-3 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* ── CTA inscription ──────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
          <div className="bg-gradient-to-br from-[#f0fdf4] to-white border border-[#bbf7d0] rounded-3xl p-8 text-center">
            <span className="material-symbols-outlined text-[#006e2f] text-4xl mb-3 inline-block">
              rocket_launch
            </span>
            <h2 className="text-xl md:text-2xl font-extrabold text-[#191c1e] mb-2" style={satoshiHeading}>
              Prêt à appliquer ce guide ?
            </h2>
            <p className="text-sm text-gray-600 mb-5 max-w-md mx-auto">
              Créez votre boutique Novakou gratuitement et mettez en pratique ces stratégies dès aujourd'hui.
            </p>
            <Link
              href="/inscription?role=vendeur"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#006e2f] text-white font-bold hover:bg-[#005a26] transition-colors"
            >
              Créer ma boutique gratuitement
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>
        </section>

        {/* ── Retour aux guides ────────────────────────────────── */}
        <section className="bg-gray-50 py-12 border-t border-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <Link
              href="/guides"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#006e2f] hover:underline"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Retour à tous les guides
            </Link>
          </div>
        </section>
      </article>
    </>
  );
}

// Helpers d'écriture pour les sections (alignés avec _bodies/_prose.tsx du blog)
export function GP({ children }: { children: ReactNode }) {
  return <p className="mb-5">{children}</p>;
}

export function GH3({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-xl font-bold text-[#191c1e] mt-8 mb-3" style={satoshiHeading}>
      {children}
    </h3>
  );
}

export function GUl({ children }: { children: ReactNode }) {
  return (
    <ul className="list-disc list-outside pl-6 mb-5 space-y-2 marker:text-[#006e2f]">
      {children}
    </ul>
  );
}

export function GOl({ children }: { children: ReactNode }) {
  return (
    <ol className="list-decimal list-outside pl-6 mb-5 space-y-2 marker:text-[#006e2f] marker:font-bold">
      {children}
    </ol>
  );
}

export function GLi({ children }: { children: ReactNode }) {
  return <li className="pl-2">{children}</li>;
}

export function GStrong({ children }: { children: ReactNode }) {
  return <strong className="font-bold text-[#191c1e]">{children}</strong>;
}

export function GA({ href, children }: { href: string; children: ReactNode }) {
  const isExternal = /^https?:\/\//.test(href);
  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#006e2f] font-semibold underline decoration-[#006e2f]/30 hover:decoration-[#006e2f] transition-all"
      >
        {children}
      </a>
    );
  }
  return (
    <Link
      href={href}
      className="text-[#006e2f] font-semibold underline decoration-[#006e2f]/30 hover:decoration-[#006e2f] transition-all"
    >
      {children}
    </Link>
  );
}

export function GCallout({
  variant = "info",
  title,
  children,
}: {
  variant?: "info" | "success" | "warning" | "tip";
  title?: string;
  children: ReactNode;
}) {
  const styles = {
    info: { bg: "#eff6ff", color: "#1d4ed8", icon: "info" },
    success: { bg: "#f0fdf4", color: "#047857", icon: "check_circle" },
    warning: { bg: "#fef3c7", color: "#b45309", icon: "warning" },
    tip: { bg: "#f5f3ff", color: "#5b21b6", icon: "lightbulb" },
  }[variant];

  return (
    <div
      className="my-6 p-5 rounded-xl border-l-4 flex gap-3"
      style={{ backgroundColor: styles.bg, borderLeftColor: styles.color }}
    >
      <span
        className="material-symbols-outlined text-[22px] flex-shrink-0 mt-0.5"
        style={{ color: styles.color }}
      >
        {styles.icon}
      </span>
      <div className="flex-1 min-w-0">
        {title && (
          <p className="font-bold text-sm mb-1.5" style={{ color: styles.color }}>
            {title}
          </p>
        )}
        <div className="text-sm text-gray-700 leading-relaxed [&>p:last-child]:mb-0 [&>p]:mb-2">
          {children}
        </div>
      </div>
    </div>
  );
}

/** Image légendée pleine largeur dans le corps (photo de pub / illustration). */
export function GImage({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  return (
    <figure className="my-8 -mx-1">
      <div className="relative w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm" style={{ aspectRatio: "16 / 9" }}>
        <Image src={src} alt={alt} fill className="object-cover" sizes="(max-width: 896px) 100vw, 896px" />
      </div>
      {caption && <figcaption className="mt-2 text-sm text-gray-500 text-center italic">{caption}</figcaption>}
    </figure>
  );
}

/** Grille de statistiques marquantes (2-4 chiffres). */
export function GStats({ items }: { items: Array<{ value: string; label: string }> }) {
  return (
    <div className="my-8 grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((s, i) => (
        <div key={i} className="rounded-2xl bg-[#f6fbf2] border border-[#dcefd6] p-5 text-center">
          <p className="text-3xl font-extrabold text-[#006e2f]" style={satoshiHeading}>{s.value}</p>
          <p className="text-[12.5px] text-gray-600 mt-1 leading-snug">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

/** Grille de cartes (fonctionnalités, étapes, points clés). */
export function GCards({ items }: { items: Array<{ icon?: string; title: string; text: string }> }) {
  return (
    <div className="my-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
      {items.map((c, i) => (
        <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5 hover:shadow-md transition-shadow">
          {c.icon && (
            <span className="material-symbols-outlined text-[#006e2f] text-[28px] mb-2 inline-block" style={{ fontVariationSettings: "'FILL' 1" }}>
              {c.icon}
            </span>
          )}
          <p className="font-bold text-[#191c1e] mb-1" style={satoshiHeading}>{c.title}</p>
          <p className="text-[15px] text-gray-600 leading-relaxed">{c.text}</p>
        </div>
      ))}
    </div>
  );
}

// Re-export COLORS pour les fichiers data (au cas où)
export { COLORS };
