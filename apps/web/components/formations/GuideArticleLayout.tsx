// Layout partagé pour les guides v2.
// Permet d'écrire un guide complet en ~200 lignes au lieu de 1500.
// Chaque guide définit son meta + un tableau de sections, le layout
// rend en-tête, sommaire, sections, FAQ, CTA, guides liés et JSON-LD.
//
// Présentation : coque publique (.nkpub) + gabarit article
// (components/formations/public/article). Les props, les helpers G* et
// les blocs JSON-LD (Article, BreadcrumbList, FAQPage) sont inchangés :
// 33 articles en dépendent et le workflow SEO vérifie les schémas.

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Info,
  Lightbulb,
  ListOrdered,
  type LucideIcon,
} from "lucide-react";
import { CoquePublique } from "@/components/formations/public/CoquePublique";
import { EnTetePage } from "@/components/formations/public/EnTetePage";
import { BoutonVerre } from "@/components/formations/public/BoutonVerre";
import { Accordeon } from "@/components/formations/public/Accordeon";
import { SommaireArticle } from "@/components/formations/public/article/SommaireArticle";
import { FilAriane } from "@/components/formations/public/article/FilAriane";
import { guidesLies } from "@/components/formations/public/article/guides-lies";
import "@/components/formations/public/article/article.css";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://novakou.com";

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

const numero = (i: number) => String(i + 1).padStart(2, "0");

/**
 * Typographie française à l'affichage : espace insécable avant « ? ! : ; »
 * pour qu'un signe ne parte jamais seul en début de ligne. Les données
 * (meta, JSON-LD) restent telles quelles.
 */
function insecables(texte: string): string {
  return texte.replace(/ ([?!:;»])/g, "\u00a0$1").replace(/« /g, "«\u00a0");
}

/** Date ISO (AAAA-MM-JJ) en toutes lettres ; UTC pour ne jamais glisser d'un jour selon le fuseau du serveur. */
function dateFr(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
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

  const aFaq = Boolean(faq && faq.length > 0);
  const aSommaire = sections.length > 1;
  const entrees = sections.map((s, i) => ({ id: s.id, label: insecables(s.label), n: numero(i) }));
  if (aFaq) entrees.push({ id: "faq", label: "Questions fréquentes", n: numero(sections.length) });
  const lies = guidesLies(meta.slug, meta.category);
  const misAJour = meta.updatedAt !== meta.publishedAt;

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

      <CoquePublique>
        <article>
          {/* ── EN-TÊTE ─────────────────────────────────────────── */}
          <EnTetePage
            align="left"
            avant={
              <FilAriane
                etapes={[
                  { label: "Accueil", href: "/" },
                  { label: "Guides", href: "/guides" },
                  { label: meta.title },
                ]}
              />
            }
            eyebrow={`${meta.category} · ${meta.level}`}
            titre={insecables(meta.title)}
            sousTitre={insecables(meta.subtitle)}
            infos={
              <span className="nka-infos">
                <span className="nka-auteur">
                  <span className="nka-auteur__av" aria-hidden="true">
                    N
                  </span>
                  <span>
                    <b>Équipe Novakou</b>
                    <small>
                      Publié le <time dateTime={meta.publishedAt}>{dateFr(meta.publishedAt)}</time>
                      {misAJour && (
                        <>
                          {" "}
                          · mis à jour le <time dateTime={meta.updatedAt}>{dateFr(meta.updatedAt)}</time>
                        </>
                      )}
                    </small>
                  </span>
                </span>
                <span className="nka-infos__sep" aria-hidden="true" />
                <span>
                  <Clock strokeWidth={1.9} aria-hidden="true" />
                  {meta.time} de lecture
                </span>
                <span>
                  <ListOrdered strokeWidth={1.9} aria-hidden="true" />
                  {meta.chapters}
                </span>
              </span>
            }
          />

          {/* ── COUVERTURE + CHIFFRES CLÉS ──────────────────────── */}
          {(heroImage || (stats && stats.length > 0)) && (
            <div className="nkp-wrap">
              {heroImage && (
                <figure className="nka-couv">
                  <div className="nkp-bezel nkp-bezel--xl nkp-bezel--float">
                    <div className="nka-couv__img">
                      <Image
                        src={heroImage.src}
                        alt={heroImage.alt}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1080px) 100vw, 1000px"
                        priority
                      />
                    </div>
                  </div>
                  {heroImage.caption && <figcaption>{heroImage.caption}</figcaption>}
                </figure>
              )}
              {stats && stats.length > 0 && (
                <ul className="nka-chiffres" aria-label="Chiffres clés">
                  {stats.map((s, i) => (
                    <li key={i} className="nka-chiffre">
                      <b>{s.value}</b>
                      <span>{s.label}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* ── SOMMAIRE + CORPS ────────────────────────────────── */}
          <div className="nkp-wrap">
            <div className={`nka-layout${aSommaire ? "" : " nka-layout--seul"}`}>
              {aSommaire && (
                <SommaireArticle
                  items={entrees}
                  bas={
                    <Link href="/guides">
                      <ArrowLeft strokeWidth={2} aria-hidden="true" />
                      Tous les guides
                    </Link>
                  }
                />
              )}
              <div className="nka-corps">
                <div className="nka-prose">
                  {sections.map((s, i) => (
                    <section key={s.id} id={s.id} className="nka-sec" aria-labelledby={`${s.id}-titre`}>
                      <div className="nka-sec__tete">
                        <h2 id={`${s.id}-titre`}>
                          <span className="nka-sec__n" aria-hidden="true">
                            {numero(i)}
                          </span>
                          <span>{insecables(s.label)}</span>
                        </h2>
                      </div>
                      {s.content}
                    </section>
                  ))}
                </div>

                {/* ── FAQ (rich results) ─────────────────────────── */}
                {faq && faq.length > 0 && (
                  <section id="faq" className="nka-faq" aria-labelledby="faq-titre">
                    <h2 id="faq-titre" className="nka-h2">
                      Questions fréquentes
                    </h2>
                    <Accordeon items={faq} />
                  </section>
                )}
              </div>
            </div>
          </div>
        </article>

        {/* ── CTA inscription ──────────────────────────────────── */}
        <section className="nkp-wrap nka-fin" aria-labelledby="guide-cta-titre">
          <div className="nkp-bezel nkp-bezel--dark nkp-bezel--xl nkp-bezel--float nkp-reveal">
            <div className="nkp-cta nkp-cta--compact">
              <span className="nkp-tag nkp-tag--dark">Passez à l&apos;action</span>
              <h2 id="guide-cta-titre">Prêt à appliquer ce guide ?</h2>
              <p>
                Créez votre boutique Novakou gratuitement et mettez en pratique ces stratégies dès aujourd&apos;hui.
              </p>
              <div className="nkp-actions">
                <BoutonVerre href="/inscription?role=vendeur" variante="white" taille="lg" fleche>
                  Créer ma boutique gratuitement
                </BoutonVerre>
              </div>
            </div>
          </div>
        </section>

        {/* ── Guides liés + retour aux guides ──────────────────── */}
        <section className="nkp-section nkp-section--compact nkp-section--tint" aria-labelledby="guides-lies-titre">
          <div className="nkp-wrap">
            <div className="nkp-head nkp-head--split nkp-reveal">
              <div>
                <span className="nkp-tag">À lire ensuite</span>
                <h2 id="guides-lies-titre">Poursuivez votre lecture</h2>
              </div>
              <p>D&apos;autres guides gratuits pour passer de l&apos;idée à la vente, écrits pour l&apos;Afrique francophone.</p>
            </div>
            {lies.length > 0 && (
              <ul className="nkp-rail m-0 list-none p-0">
                {lies.map((g) => (
                  <li key={g.href} className="nkp-reveal">
                    <article className="nkp-card nkp-card--hover nka-lie h-full">
                      <div className="nkp-card__core">
                        <span className="nkp-ic mb-5" aria-hidden="true">
                          <span className="material-symbols-outlined text-[20px]">{g.icone}</span>
                        </span>
                        <p className="nka-lie__meta">
                          {g.categorie} · {g.duree}
                        </p>
                        <h3>
                          <Link href={g.href} className="nkp-stretch transition-colors hover:text-[#006e2f]">
                            {g.titre}
                          </Link>
                        </h3>
                        <p className="nkp-card__desc line-clamp-3">{g.resume}</p>
                        <span className="nkp-link" aria-hidden="true">
                          Lire le guide
                          <ArrowRight strokeWidth={2.2} />
                        </span>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            )}
            <div className="nkp-center-btn">
              <BoutonVerre href="/guides" fleche>
                Retour à tous les guides
              </BoutonVerre>
            </div>
          </div>
        </section>
      </CoquePublique>
    </>
  );
}

// Helpers d'écriture pour les sections (alignés avec _bodies/_prose.tsx du blog).
// La typographie vient de la prose (.nka-prose, article.css) : pas de couleur
// ni de taille codées ici.
export function GP({ children }: { children: ReactNode }) {
  return <p>{children}</p>;
}

export function GH3({ children }: { children: ReactNode }) {
  return <h3>{children}</h3>;
}

export function GUl({ children }: { children: ReactNode }) {
  return <ul>{children}</ul>;
}

export function GOl({ children }: { children: ReactNode }) {
  return <ol>{children}</ol>;
}

export function GLi({ children }: { children: ReactNode }) {
  return <li>{children}</li>;
}

export function GStrong({ children }: { children: ReactNode }) {
  return <strong>{children}</strong>;
}

export function GA({ href, children }: { href: string; children: ReactNode }) {
  const isExternal = /^https?:\/\//.test(href);
  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return <Link href={href}>{children}</Link>;
}

const ENCADRES: Record<"info" | "success" | "warning" | "tip", { icone: LucideIcon; nom: string }> = {
  info: { icone: Info, nom: "Information" },
  success: { icone: CheckCircle2, nom: "À retenir" },
  warning: { icone: AlertTriangle, nom: "Attention" },
  tip: { icone: Lightbulb, nom: "Astuce" },
};

export function GCallout({
  variant = "info",
  title,
  children,
}: {
  variant?: "info" | "success" | "warning" | "tip";
  title?: string;
  children: ReactNode;
}) {
  const { icone: Icone, nom } = ENCADRES[variant];
  return (
    <div className={`nka-note nka-note--${variant}`} role="note" aria-label={title ?? nom}>
      <span className="nka-note__ic" aria-hidden="true">
        <Icone strokeWidth={1.9} />
      </span>
      <div className="min-w-0">
        {title && <p className="nka-note__t">{title}</p>}
        <div className="nka-note__c">{children}</div>
      </div>
    </div>
  );
}

/** Image légendée pleine largeur dans le corps (photo de pub / illustration). */
export function GImage({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  return (
    <figure className="nka-fig">
      <div className="nkp-bezel">
        <div className="nka-fig__img">
          <Image src={src} alt={alt} fill className="object-cover" sizes="(max-width: 760px) 100vw, 680px" />
        </div>
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

/** Grille de statistiques marquantes (2-4 chiffres). */
export function GStats({ items }: { items: Array<{ value: string; label: string }> }) {
  return (
    <ul className="nka-chiffres">
      {items.map((s, i) => (
        <li key={i} className="nka-chiffre">
          <b>{s.value}</b>
          <span>{s.label}</span>
        </li>
      ))}
    </ul>
  );
}

/** Grille de cartes (fonctionnalités, étapes, points clés). */
export function GCards({ items }: { items: Array<{ icon?: string; title: string; text: string }> }) {
  return (
    <div className="nka-cartes">
      {items.map((c, i) => (
        <div key={i} className="nka-carte">
          {c.icon && (
            <span className="nkp-ic nkp-ic--sm" aria-hidden="true">
              <span className="material-symbols-outlined text-[18px]">{c.icon}</span>
            </span>
          )}
          <p className="nka-carte__t">{c.title}</p>
          <p className="nka-carte__d">{c.text}</p>
        </div>
      ))}
    </div>
  );
}

// Re-export COLORS pour les fichiers data (au cas où)
export { COLORS };
