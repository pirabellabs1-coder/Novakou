import Link from "next/link";
import { BookOpen, Clock, MessageSquare } from "lucide-react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CATEGORIES, getArticlesByCategory, getCategory } from "@/lib/help/articles";
import { CoquePublique } from "@/components/formations/public/CoquePublique";
import { EnTetePage } from "@/components/formations/public/EnTetePage";
import { BoutonVerre } from "@/components/formations/public/BoutonVerre";
import { FilAriane } from "@/components/formations/public/article/FilAriane";
import { CarteSupport } from "@/components/formations/public/article/CarteSupport";
import "@/components/formations/public/article/article.css";

type Params = { params: Promise<{ categorie: string }> };

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com";

export async function generateStaticParams() {
  return CATEGORIES.map((c) => ({ categorie: c.slug }));
}

/** Nettoie le markdown simplifié pour le réinjecter en texte lisible (JSON-LD). */
function cleanBody(body: string): string {
  return body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#*_`>\-|]+/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/** Tronque une description à ~155 chars sans couper un mot. */
function truncateMeta(text: string, max: number): string {
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  return (lastSpace > max - 30 ? slice.slice(0, lastSpace) : slice).trim() + "…";
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { categorie } = await params;
  const cat = getCategory(categorie);
  if (!cat) return { title: "Catégorie introuvable" };
  const articles = getArticlesByCategory(cat.slug);
  const description = truncateMeta(
    `${cat.description} ${articles.length} article${articles.length > 1 ? "s" : ""} pratiques pour réussir sur Novakou.`,
    155,
  );
  const title = `${cat.title} — Centre d'aide`;
  const ogImage = `${BASE_URL}/api/og?type=guide&title=${encodeURIComponent(cat.title)}&subtitle=${encodeURIComponent(`${articles.length} article${articles.length > 1 ? "s" : ""} pour vous accompagner`)}`;

  return {
    title,
    description,
    alternates: { canonical: `/aide/${cat.slug}` },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/aide/${cat.slug}`,
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${cat.title} — Centre d'aide Novakou`,
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

export default async function HelpCategoryPage({ params }: Params) {
  const { categorie } = await params;
  const cat = getCategory(categorie);
  if (!cat) notFound();
  const articles = getArticlesByCategory(cat.slug);

  // FAQPage JSON-LD : Google exige ≥2 questions avec réponses ≥30 char.
  // On prend max 20 articles pour ne pas surcharger le payload SERP.
  const faqEntries = articles.slice(0, 20);
  const faqSchema =
    faqEntries.length >= 2
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqEntries.map((a) => ({
            "@type": "Question",
            name: a.title,
            acceptedAnswer: {
              "@type": "Answer",
              text: `${a.excerpt} ${cleanBody(a.body).slice(0, 400)}`.slice(0, 700).trim(),
            },
          })),
        }
      : null;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Centre d'aide", item: `${BASE_URL}/aide` },
      { "@type": "ListItem", position: 3, name: cat.title, item: `${BASE_URL}/aide/${cat.slug}` },
    ],
  };

  return (
    <CoquePublique>
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <EnTetePage
        align="left"
        avant={
          <FilAriane
            etapes={[
              { label: "Accueil", href: "/" },
              { label: "Centre d'aide", href: "/aide" },
              { label: cat.title },
            ]}
          />
        }
        eyebrow="Centre d'aide"
        titre={cat.title}
        sousTitre={cat.description}
        infos={
          <span className="nka-infos">
            <span>
              <BookOpen strokeWidth={1.9} aria-hidden="true" />
              <span className="nkp-num">
                {articles.length} article{articles.length > 1 ? "s" : ""}
              </span>
            </span>
            <span>
              <MessageSquare strokeWidth={1.9} aria-hidden="true" />
              Support sous 24 h
            </span>
          </span>
        }
      />

      <section className="nkp-section nkp-section--compact nkp-section--top0" aria-labelledby="articles-titre">
        <div className="nkp-wrap">
          <h2 id="articles-titre" className="sr-only">
            Articles de la catégorie {cat.title}
          </h2>
          {articles.length === 0 ? (
            <div className="nkp-card max-w-lg">
              <div className="nkp-card__core">
                <p className="nkp-card__desc !mt-0">Aucun article pour cette catégorie pour le moment.</p>
                <div className="mt-5">
                  <BoutonVerre href="/aide" fleche>
                    Retour au centre d&apos;aide
                  </BoutonVerre>
                </div>
              </div>
            </div>
          ) : (
            <ol className="nkp-grid-2 m-0 list-none p-0">
              {articles.map((a, i) => (
                <li key={a.slug}>
                  <article className="nkp-card nkp-card--hover nkp-reveal h-full">
                    <div className="nkp-card__core">
                      <div className="mb-4 flex items-center gap-3">
                        <span className="nka-sec__n !mt-0 !text-[.72rem]" aria-hidden="true">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[.78rem] text-[#5c6b62]">
                          <Clock size={14} strokeWidth={1.9} aria-hidden="true" />
                          {a.readingMin} min de lecture
                        </span>
                      </div>
                      <h3 className="!text-[1.06rem] !leading-snug">
                        <Link href={`/aide/${cat.slug}/${a.slug}`} className="nkp-stretch transition-colors hover:text-[#006e2f]">
                          {a.title}
                        </Link>
                      </h3>
                      <p className="nkp-card__desc line-clamp-2 text-[.9rem]">{a.excerpt}</p>
                      {a.tags && a.tags.length > 0 && (
                        <div className="nkp-card__foot flex flex-wrap gap-1.5">
                          {a.tags.slice(0, 2).map((t) => (
                            <span key={t} className="nka-sujet">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {/* Autres catégories */}
      <section className="nkp-section nkp-section--compact nkp-section--tint" aria-labelledby="autres-categories-titre">
        <div className="nkp-wrap">
          <div className="nkp-head nkp-head--center !mb-8 nkp-reveal">
            <span className="nkp-tag">Parcourir</span>
            <h2 id="autres-categories-titre" className="!text-[1.6rem]">
              Autres catégories
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
          <div className="mt-14">
            <CarteSupport />
          </div>
        </div>
      </section>
    </CoquePublique>
  );
}
