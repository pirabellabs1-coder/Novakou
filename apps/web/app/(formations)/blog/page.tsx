import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { BLOG_ARTICLES, getArticlesSorted } from "@/lib/blog/articles";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://novakou.com";

export const metadata: Metadata = {
  title: "Blog Novakou — vendre digital en Afrique francophone",
  description:
    "Conseils, méthodes et cas pratiques pour créer, vendre et automatiser vos produits digitaux en Afrique. Mobile Money, marketing, idées produits, témoignages.",
  alternates: {
    canonical: `${APP_URL}/blog`,
    languages: {
      "fr-FR": `${APP_URL}/blog`,
      "fr-SN": `${APP_URL}/blog`,
      "fr-CI": `${APP_URL}/blog`,
      "fr-CM": `${APP_URL}/blog`,
      "fr-BJ": `${APP_URL}/blog`,
      "x-default": `${APP_URL}/blog`,
    },
  },
  openGraph: {
    title: "Blog Novakou — vendre digital en Afrique francophone",
    description:
      "Articles longs, méthodes éprouvées et cas pratiques pour les créateurs digitaux d'Afrique francophone.",
    type: "website",
    url: `${APP_URL}/blog`,
    siteName: "Novakou",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog Novakou",
    description: "Vendre digital en Afrique francophone — conseils & cas pratiques.",
  },
};

// ISR : la liste d'articles change rarement. Génère la page une fois par
// jour et sert depuis le CDN entre-temps.
export const revalidate = 86400;

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

export default function BlogIndexPage() {
  const articles = getArticlesSorted();

  // JSON-LD CollectionPage (aide Google à comprendre que c'est un index
  // d'articles, et lui donne la liste pour discovery).
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Blog Novakou",
    description:
      "Conseils pour créateurs digitaux d'Afrique francophone : vendre, automatiser, scaler.",
    url: `${APP_URL}/blog`,
    publisher: {
      "@type": "Organization",
      name: "Novakou",
      url: APP_URL,
    },
    blogPost: articles.map((a) => ({
      "@type": "BlogPosting",
      headline: a.title,
      description: a.excerpt,
      datePublished: a.publishedAt,
      dateModified: a.updatedAt,
      url: `${APP_URL}/blog/${a.slug}`,
      author: { "@type": "Organization", name: a.author },
    })),
  };

  // JSON-LD BreadcrumbList
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Accueil",
        item: APP_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${APP_URL}/blog`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <main className="min-h-screen bg-white">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-24">
            <nav className="text-sm text-gray-600 mb-6" aria-label="Fil d'Ariane">
              <Link href="/" className="hover:text-[#006e2f] hover:underline">
                Accueil
              </Link>
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-gray-900 font-semibold">Blog</span>
            </nav>
            <span
              className="inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase mb-4"
              style={{ backgroundColor: "#e5eae1", color: "#191c1e" }}
            >
              Blog Novakou
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold text-[#191c1e] mb-4 max-w-3xl">
              Vendre digital en Afrique francophone.
              <br />
              <span style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Conseils, méthodes et cas pratiques.
              </span>
            </h1>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl leading-relaxed">
              {articles.length} articles longs pour t'aider à lancer ta première formation,
              encaisser via Mobile Money, faire de la publicité Facebook avec un petit budget,
              construire des tunnels qui convertissent.
            </p>
          </div>
        </section>

        {/* Liste articles */}
        <section className="py-12 md:py-16">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {articles.map((article) => {
                const color = CATEGORY_COLORS[article.category] ?? CATEGORY_COLORS.Vendre;
                return (
                  <Link
                    key={article.slug}
                    href={`/blog/${article.slug}`}
                    className="group bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="relative h-48 overflow-hidden bg-gray-50">
                      <Image
                        src={article.heroImage}
                        alt={article.heroAlt}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                          style={{ backgroundColor: color.bg, color: color.fg }}
                        >
                          {article.category}
                        </span>
                        <span className="text-[11px] text-gray-600 font-medium">
                          {article.readingMinutes} min de lecture
                        </span>
                      </div>
                      <h2 className="text-lg font-extrabold text-[#191c1e] mb-2 group-hover:text-[#006e2f] transition-colors leading-snug">
                        {article.title}
                      </h2>
                      <p className="text-sm text-gray-600 leading-relaxed mb-4">
                        {article.excerpt}
                      </p>
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <span className="text-[11px] text-gray-500">
                          {formatDate(article.publishedAt)}
                        </span>
                        <span className="text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all text-[#006e2f]">
                          Lire <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* CTA fin de liste */}
            <div className="mt-16 md:mt-20 bg-gradient-to-br from-[#f0fdf4] to-white border border-[#bbf7d0] rounded-3xl p-8 md:p-12 text-center">
              <span className="material-symbols-outlined text-[#006e2f] text-5xl mb-4 inline-block">
                rocket_launch
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-[#191c1e] mb-3">
                Prêt à lancer ta boutique ?
              </h2>
              <p className="text-base text-gray-600 max-w-xl mx-auto mb-6">
                Inscription gratuite. Boutique en ligne en 3 minutes. Paiements Mobile Money,
                tunnels de vente, emails automatiques inclus.
              </p>
              <Link
                href="/inscription?role=vendeur"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#006e2f] text-white font-bold hover:bg-[#005a26] transition-colors"
              >
                Créer ma boutique gratuitement
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

// generateStaticParams pour pré-rendre les slugs d'articles si jamais Next
// décidait que /blog est dynamic. Ici la liste est connue à la build.
export function generateStaticParams() {
  return BLOG_ARTICLES.map((a) => ({ slug: a.slug }));
}
