import Link from "next/link";
import { ArrowRight, Clock, RefreshCw } from "lucide-react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ARTICLES,
  CATEGORIES,
  getArticleBySlug,
  getCategory,
  getArticlesByCategory,
} from "@/lib/help/articles";
import { renderMarkdown } from "@/lib/help/markdown";
import { CoquePublique } from "@/components/formations/public/CoquePublique";
import { EnTetePage } from "@/components/formations/public/EnTetePage";
import { BoutonVerre } from "@/components/formations/public/BoutonVerre";
import { FilAriane } from "@/components/formations/public/article/FilAriane";
import { AvisArticle } from "@/components/formations/public/article/AvisArticle";
import "@/components/formations/public/article/article.css";
import { jsonLdSafe } from "@/lib/seo/json-ld";

type Params = { params: Promise<{ categorie: string; slug: string }> };

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com";

export async function generateStaticParams() {
  return ARTICLES.map((a) => ({ categorie: a.category, slug: a.slug }));
}

/** Tronque sans couper de mot pour rester ≤155 chars en meta description. */
function truncateMeta(text: string, max: number): string {
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  return (lastSpace > max - 30 ? slice.slice(0, lastSpace) : slice).trim() + "…";
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { categorie, slug } = await params;
  const a = getArticleBySlug(slug);
  if (!a) return { title: "Article introuvable" };
  const cat = getCategory(a.category);
  const title = `${a.title} — Centre d'aide`;
  const description = truncateMeta(a.excerpt, 155);
  const ogImage = `${BASE_URL}/api/og?type=guide&title=${encodeURIComponent(a.title)}&subtitle=${encodeURIComponent(cat?.title ?? "Centre d'aide Novakou")}`;
  const url = `${BASE_URL}/aide/${categorie}/${a.slug}`;

  return {
    title,
    description,
    keywords: a.tags,
    alternates: { canonical: `/aide/${categorie}/${a.slug}` },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      publishedTime: a.lastUpdated,
      modifiedTime: a.lastUpdated,
      authors: ["Équipe Novakou"],
      tags: a.tags,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: a.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function HelpArticlePage({ params }: Params) {
  const { categorie, slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article || article.category !== categorie) notFound();

  const cat = getCategory(article.category);
  if (!cat) notFound();

  const related = getArticlesByCategory(cat.slug)
    .filter((a) => a.slug !== article.slug)
    .slice(0, 4);

  const dateStr = new Date(article.lastUpdated).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // JSON-LD Article — datePublished depuis lastUpdated faute de mieux,
  // author = "Équipe Novakou", publisher = Organization Novakou avec logo.
  const articleUrl = `${BASE_URL}/aide/${cat.slug}/${article.slug}`;
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.lastUpdated,
    dateModified: article.lastUpdated,
    author: {
      "@type": "Organization",
      name: "Équipe Novakou",
      url: BASE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "Novakou",
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/logo.png`,
      },
    },
    image: `${BASE_URL}/api/og?type=guide&title=${encodeURIComponent(article.title)}&subtitle=${encodeURIComponent(cat.title)}`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    articleSection: cat.title,
    keywords: article.tags?.join(", "),
    inLanguage: "fr-FR",
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Centre d'aide", item: `${BASE_URL}/aide` },
      { "@type": "ListItem", position: 3, name: cat.title, item: `${BASE_URL}/aide/${cat.slug}` },
      { "@type": "ListItem", position: 4, name: article.title, item: articleUrl },
    ],
  };

  return (
    <CoquePublique>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdSafe(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdSafe(breadcrumbSchema) }}
      />
      <article>
        <EnTetePage
          align="left"
          avant={
            <FilAriane
              etapes={[
                { label: "Accueil", href: "/" },
                { label: "Centre d'aide", href: "/aide" },
                { label: cat.title, href: `/aide/${cat.slug}` },
                { label: article.title },
              ]}
            />
          }
          eyebrow={cat.title}
          titre={article.title}
          sousTitre={article.excerpt}
          infos={
            <span className="nka-infos">
              <span>
                <Clock strokeWidth={1.9} aria-hidden="true" />
                {article.readingMin} min de lecture
              </span>
              <span>
                <RefreshCw strokeWidth={1.9} aria-hidden="true" />
                {/* Un seul élément flex : sinon l'écart du flex s'ajoute à l'espace avant la date. */}
                <span>
                  Mis à jour le <time dateTime={article.lastUpdated}>{dateStr}</time>
                </span>
              </span>
            </span>
          }
        />

        <div className="nkp-wrap">
          <div className="nka-layout nka-layout--droite">
            <div className="nka-corps">
              <div className="nka-prose">{renderMarkdown(article.body)}</div>

              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="nka-sujets">
                  <p className="nka-rail__t">Sujets abordés</p>
                  <ul>
                    {article.tags.map((t) => (
                      <li key={t}>
                        <span className="nka-sujet">#{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Feedback */}
              <AvisArticle />
            </div>

            <aside className="nka-rail" aria-label="Pour aller plus loin">
              {related.length > 0 && (
                <div className="nkp-card">
                  <div className="nkp-card__core !p-5">
                    <h2 className="nka-rail__t">Articles similaires</h2>
                    <ul className="nka-liens">
                      {related.map((a) => (
                        <li key={a.slug}>
                          <Link href={`/aide/${a.category}/${a.slug}`}>
                            <ArrowRight strokeWidth={2} aria-hidden="true" />
                            <span>
                              {a.title}
                              <small>{a.readingMin} min de lecture</small>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              <div className="nkp-card nkp-card--dark">
                <div className="nkp-card__core !p-5">
                  <h2 className="!text-[1.05rem]">Besoin d&apos;un coup de main ?</h2>
                  <p className="mt-2 text-[.88rem]">Notre équipe répond en moins de 5 minutes en chat, sous 24 h par email.</p>
                  <div className="mt-4">
                    <BoutonVerre href="/contact" variante="white" taille="sm" fleche>
                      Contacter le support
                    </BoutonVerre>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </article>

      {/* Categories strip */}
      <section className="nkp-section nkp-section--compact nkp-section--tint" aria-labelledby="explorer-categories-titre">
        <div className="nkp-wrap">
          <div className="nkp-head nkp-head--center !mb-8 nkp-reveal">
            <span className="nkp-tag">Centre d&apos;aide</span>
            <h2 id="explorer-categories-titre" className="!text-[1.6rem]">
              Explorer d&apos;autres catégories
            </h2>
          </div>
          <ul className="nkp-chips m-0 list-none p-0">
            {CATEGORIES.filter((c) => c.slug !== cat.slug).map((c) => (
              <li key={c.slug}>
                <Link href={`/aide/${c.slug}`} className="nkp-chip">
                  <span className="nkp-chip__ic" aria-hidden="true">
                    <span className="material-symbols-outlined text-[14px]">{c.icon}</span>
                  </span>
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </CoquePublique>
  );
}
