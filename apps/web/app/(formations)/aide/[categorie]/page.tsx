import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CATEGORIES, getArticlesByCategory, getCategory } from "@/lib/help/articles";

type Params = { params: Promise<{ categorie: string }> };

export async function generateStaticParams() {
  return CATEGORIES.map((c) => ({ categorie: c.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { categorie } = await params;
  const cat = getCategory(categorie);
  if (!cat) return { title: "Catégorie introuvable" };
  return {
    title: `${cat.title} — Centre d'aide Novakou`,
    description: cat.description,
  };
}

export default async function HelpCategoryPage({ params }: Params) {
  const { categorie } = await params;
  const cat = getCategory(categorie);
  if (!cat) notFound();
  const articles = getArticlesByCategory(cat.slug);

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      <header className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div
          aria-hidden
          className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full opacity-10 blur-3xl"
          style={{ background: cat.color }}
        />
        <div className="relative max-w-5xl mx-auto px-5 md:px-8 py-10 md:py-14">
          <Link href="/aide" className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 mb-5">
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            Centre d&apos;aide
          </Link>
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-white flex-shrink-0"
              style={{ background: cat.color }}
            >
              <span
                className="material-symbols-outlined text-[28px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {cat.icon}
              </span>
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                {cat.title}
              </h1>
              <p className="text-sm text-slate-500 mt-1.5 max-w-xl">{cat.description}</p>
              <p className="text-[11px] text-slate-400 mt-2 font-bold uppercase tracking-wider">
                {articles.length} article{articles.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 md:px-8 py-10">
        {articles.length === 0 ? (
          <p className="text-center text-slate-500 py-10">Aucun article pour cette catégorie pour le moment.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {articles.map((a) => (
              <Link
                key={a.slug}
                href={`/aide/${cat.slug}/${a.slug}`}
                className="group p-5 bg-white rounded-2xl border border-slate-200 hover:shadow-lg hover:border-emerald-200 transition-all"
              >
                <h3 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-700 leading-snug">
                  {a.title}
                </h3>
                <p className="text-xs text-slate-500 mt-2 line-clamp-2">{a.excerpt}</p>
                <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-400">
                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                  {a.readingMin} min de lecture
                  {a.tags && a.tags.length > 0 && (
                    <span className="ml-2">·</span>
                  )}
                  {a.tags?.slice(0, 2).map((t) => (
                    <span key={t} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                      #{t}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Related categories */}
        <section className="mt-14">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">
            Autres catégories
          </h2>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.filter((c) => c.slug !== cat.slug).map((c) => (
              <Link
                key={c.slug}
                href={`/aide/${c.slug}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-xs font-bold text-slate-700"
              >
                <span className="w-5 h-5 rounded flex items-center justify-center text-white text-[11px]" style={{ background: c.color }}>
                  <span className="material-symbols-outlined text-[12px]">{c.icon}</span>
                </span>
                {c.title}
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
