import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  BLOG_ARTICLES,
  getArticleBySlug,
  getRelatedArticles,
} from "@/lib/blog/articles";
import { getArticleBody } from "@/lib/blog/bodies";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://novakou.com";

type Props = {
  params: Promise<{ slug: string }>;
};

// Pré-rendu de TOUS les articles à la build. Avec ISR (revalidate ci-dessous),
// si un article est édité (rare), la page est rebuilée en background.
export function generateStaticParams() {
  return BLOG_ARTICLES.map((a) => ({ slug: a.slug }));
}

export const revalidate = 86400; // 1 jour

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) {
    return { title: "Article introuvable | Blog Novakou" };
  }

  const url = `${APP_URL}/blog/${article.slug}`;
  const image = article.heroImage.startsWith("http")
    ? article.heroImage
    : `${APP_URL}${article.heroImage}`;

  return {
    title: `${article.title} | Blog Novakou`,
    description: article.excerpt,
    keywords: article.keywords,
    authors: [{ name: article.author }],
    alternates: {
      canonical: url,
      languages: {
        "fr-FR": url,
        "fr-SN": url,
        "fr-CI": url,
        "fr-CM": url,
        "fr-BJ": url,
        "x-default": url,
      },
    },
    openGraph: {
      type: "article",
      url,
      title: article.title,
      description: article.excerpt,
      images: [{ url: image, width: 1600, height: 900, alt: article.heroAlt }],
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [article.author],
      tags: article.tags,
      siteName: "Novakou",
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt,
      images: [image],
    },
  };
}

const CATEGORY_COLORS: Record<string, { bg: string; fg: string }> = {
  Vendre: { bg: "#dcfce7", fg: "#047857" },
  Marketing: { bg: "#dbeafe", fg: "#1d4ed8" },
  Produit: { bg: "#fef3c7", fg: "#b45309" },
  Stratégie: { bg: "#ede9fe", fg: "#5b21b6" },
  Outils: { bg: "#cffafe", fg: "#0e7490" },
  "Cas pratiques": { bg: "#fce7f3", fg: "#be185d" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const Body = getArticleBody(slug);
  if (!Body) notFound();

  const related = getRelatedArticles(slug, 3);
  const color = CATEGORY_COLORS[article.category] ?? CATEGORY_COLORS.Vendre;
  const url = `${APP_URL}/blog/${article.slug}`;
  const image = article.heroImage.startsWith("http")
    ? article.heroImage
    : `${APP_URL}${article.heroImage}`;

  // JSON-LD Article (richest possible pour SERP Google).
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    image,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: { "@type": "Organization", name: article.author, url: APP_URL },
    publisher: {
      "@type": "Organization",
      name: "Novakou",
      url: APP_URL,
      logo: { "@type": "ImageObject", url: `${APP_URL}/icon` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    inLanguage: "fr",
    keywords: article.keywords.join(", "),
    articleSection: article.category,
    wordCount: article.readingMinutes * 200, // ~200 mots/min de lecture
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: APP_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${APP_URL}/blog` },
      { "@type": "ListItem", position: 3, name: article.title, item: url },
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

      <article className="min-h-screen bg-white">
        {/* Header */}
        <header className="max-w-3xl mx-auto px-4 md:px-8 pt-12 md:pt-16 pb-8">
          <nav className="text-sm text-gray-600 mb-6" aria-label="Fil d'Ariane">
            <Link href="/" className="hover:text-[#006e2f] hover:underline">
              Accueil
            </Link>
            <span className="mx-2 text-gray-400">/</span>
            <Link href="/blog" className="hover:text-[#006e2f] hover:underline">
              Blog
            </Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-900 font-semibold truncate">{article.category}</span>
          </nav>

          <div className="flex items-center gap-3 mb-4">
            <span
              className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider"
              style={{ backgroundColor: color.bg, color: color.fg }}
            >
              {article.category}
            </span>
            <span className="text-xs text-gray-600 font-medium">
              {article.readingMinutes} min de lecture
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-600">{formatDate(article.publishedAt)}</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold text-[#191c1e] leading-tight mb-4">
            {article.title}
          </h1>
          <p className="text-base md:text-lg text-gray-600 leading-relaxed">
            {article.excerpt}
          </p>

          <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-100">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#006e2f] to-[#22c55e] flex items-center justify-center text-white font-bold text-sm">
              N
            </div>
            <div>
              <p className="text-sm font-bold text-[#191c1e]">{article.author}</p>
              <p className="text-xs text-gray-500">
                Mis à jour le {formatDate(article.updatedAt)}
              </p>
            </div>
          </div>
        </header>

        {/* Image hero */}
        <div className="max-w-4xl mx-auto px-4 md:px-8 mb-12">
          <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-gray-100">
            <Image
              src={article.heroImage}
              alt={article.heroAlt}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 896px"
              priority
              className="object-cover"
            />
          </div>
        </div>

        {/* Corps */}
        <div className="max-w-3xl mx-auto px-4 md:px-8 pb-16">
          <Body />
        </div>

        {/* Tags + share */}
        <div className="max-w-3xl mx-auto px-4 md:px-8 pb-16">
          <div className="flex flex-wrap gap-2 pt-8 border-t border-gray-100">
            {article.tags.map((t) => (
              <span
                key={t}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700"
              >
                #{t}
              </span>
            ))}
          </div>
        </div>

        {/* CTA inscription */}
        <div className="max-w-3xl mx-auto px-4 md:px-8 pb-16">
          <div className="bg-gradient-to-br from-[#f0fdf4] to-white border border-[#bbf7d0] rounded-3xl p-8 text-center">
            <h2 className="text-xl md:text-2xl font-extrabold text-[#191c1e] mb-2">
              Prêt à mettre ça en pratique ?
            </h2>
            <p className="text-sm text-gray-600 mb-5">
              Crée ta boutique gratuitement et applique ces stratégies dès aujourd'hui.
            </p>
            <Link
              href="/inscription?role=vendeur"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#006e2f] text-white font-bold hover:bg-[#005a26] transition-colors"
            >
              Créer ma boutique
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* Articles similaires */}
        {related.length > 0 && (
          <section className="bg-gray-50 py-16 border-t border-gray-100">
            <div className="max-w-6xl mx-auto px-4 md:px-8">
              <h2 className="text-2xl md:text-3xl font-extrabold text-[#191c1e] mb-8">
                Articles similaires
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {related.map((r) => {
                  const c = CATEGORY_COLORS[r.category] ?? CATEGORY_COLORS.Vendre;
                  return (
                    <Link
                      key={r.slug}
                      href={`/blog/${r.slug}`}
                      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all"
                    >
                      <div className="relative h-40 bg-gray-100">
                        <Image
                          src={r.heroImage}
                          alt={r.heroAlt}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="p-5">
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2"
                          style={{ backgroundColor: c.bg, color: c.fg }}
                        >
                          {r.category}
                        </span>
                        <h3 className="text-base font-bold text-[#191c1e] group-hover:text-[#006e2f] transition-colors leading-snug">
                          {r.title}
                        </h3>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </article>
    </>
  );
}
