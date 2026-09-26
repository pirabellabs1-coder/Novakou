"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { ArrowRight, AtSign, Mail, Search, X } from "lucide-react";
import { ARTICLES, CATEGORIES, searchArticles } from "@/lib/help/articles";
import { EnTetePage } from "./EnTetePage";
import { BoutonVerre } from "./BoutonVerre";

/**
 * Centre d'aide : recherche dans l'en-tête et contenu (résultats ou
 * catégories + articles populaires). Client par nécessité : l'état de
 * recherche est partagé entre l'en-tête et la liste. Les données viennent
 * de lib/help/articles (statiques, rendues dès le serveur).
 */
export function CentreAide() {
  const [query, setQuery] = useState("");
  const id = useId();
  const results = useMemo(() => (query.trim() ? searchArticles(query) : null), [query]);

  return (
    <>
      <EnTetePage
        eyebrow="Centre d'aide Novakou"
        titre={
          <>
            Comment pouvons-nous <em>vous aider</em> ?
          </>
        }
        sousTitre={`${ARTICLES.length} articles pour tout maîtriser — création de compte, vente, paiement, retrait, mentorat, sécurité.`}
      >
        <form role="search" className="nkp-search max-w-2xl mx-auto" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor={id} className="sr-only">
            Rechercher un sujet, un problème, une question
          </label>
          <Search strokeWidth={1.75} aria-hidden="true" />
          <input
            id={id}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un sujet, un problème, une question…"
            autoComplete="off"
            enterKeyHint="search"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Effacer la recherche"
              className="nkp-btn nkp-btn--sm !min-h-[36px] !px-2 absolute right-3 top-1/2 -translate-y-1/2 z-[1]"
            >
              <X size={15} strokeWidth={2.2} aria-hidden="true" />
            </button>
          )}
        </form>
        <p className="mt-4 text-[.84rem] text-[#5c6b62]">
          Ou{" "}
          <Link href="/contact" className="font-semibold text-[#006e2f] underline underline-offset-2">
            contactez directement notre support
          </Link>{" "}
          si vous ne trouvez pas votre réponse.
        </p>
      </EnTetePage>

      <section className="nkp-section nkp-section--tint !pt-12" aria-label="Articles d'aide">
        <div className="nkp-wrap">
          {results ? (
            <div aria-live="polite">
              <p className="mb-5 text-[.95rem] text-[#5c6b62]">
                {results.length === 0 ? (
                  <>
                    Aucun résultat pour « <strong className="text-[#0e1512]">{query}</strong> ».
                  </>
                ) : (
                  <>
                    <strong className="nkp-num text-[#0e1512]">{results.length}</strong> résultat{results.length > 1 ? "s" : ""} pour « <strong className="text-[#0e1512]">{query}</strong> »
                  </>
                )}
              </p>
              {results.length === 0 ? (
                <div className="nkp-card max-w-lg">
                  <div className="nkp-card__core">
                    <h2 className="!text-[1.1rem]">Essayez un autre mot-clé</h2>
                    <p className="nkp-card__desc">Par exemple « retrait », « Mobile Money », « KYC » ou « mot de passe ». Sinon, notre équipe vous répond sous 24 h.</p>
                    <div className="mt-5">
                      <BoutonVerre href="/contact" variante="primary" fleche>
                        Contacter le support
                      </BoutonVerre>
                    </div>
                  </div>
                </div>
              ) : (
                <ul className="flex flex-col gap-3 list-none m-0 p-0">
                  {results.map((a, i) => {
                    const cat = CATEGORIES.find((c) => c.slug === a.category);
                    return (
                      <li key={a.slug} className="nkp-apparait" style={{ "--i": Math.min(i, 8) } as React.CSSProperties}>
                        <article className="nkp-card nkp-card--hover">
                          <div className="nkp-card__core !flex-row items-start gap-4 !py-5">
                            <span className="nkp-ic" aria-hidden="true">
                              <span className="material-symbols-outlined text-[20px]">{cat?.icon ?? "help"}</span>
                            </span>
                            <div className="min-w-0 flex-1">
                              <span className="text-[.68rem] font-bold uppercase tracking-[.14em] text-[#5c6b62]">
                                {cat?.title} · {a.readingMin} min
                              </span>
                              <h3 className="mt-1 !text-[1.02rem]">
                                <Link href={`/aide/${a.category}/${a.slug}`} className="nkp-stretch hover:text-[#006e2f] transition-colors">
                                  {a.title}
                                </Link>
                              </h3>
                              <p className="mt-1 line-clamp-2 text-[.86rem] text-[#5c6b62]">{a.excerpt}</p>
                            </div>
                            <ArrowRight size={18} strokeWidth={2} className="text-[#8a968e] flex-shrink-0 mt-1" aria-hidden="true" />
                          </div>
                        </article>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : (
            <>
              <section aria-labelledby="categories-titre">
                <div className="nkp-head !mb-8">
                  <span className="nkp-tag">Parcourir</span>
                  <h2 id="categories-titre" className="!text-[1.6rem]">
                    Par catégorie
                  </h2>
                </div>
                <ul className="nkp-grid-3 list-none m-0 p-0">
                  {CATEGORIES.map((cat) => {
                    const count = ARTICLES.filter((a) => a.category === cat.slug).length;
                    return (
                      <li key={cat.slug}>
                        <article className="nkp-card nkp-card--hover nkp-reveal h-full">
                          <div className="nkp-card__core">
                            <span className="nkp-ic mb-4" aria-hidden="true">
                              <span className="material-symbols-outlined text-[22px]">{cat.icon}</span>
                            </span>
                            <h3 className="!text-[1.05rem]">
                              <Link href={`/aide/${cat.slug}`} className="nkp-stretch hover:text-[#006e2f] transition-colors">
                                {cat.title}
                              </Link>
                            </h3>
                            <p className="nkp-card__desc line-clamp-2 text-[.88rem]">{cat.description}</p>
                            <span className="nkp-card__foot text-[.78rem] font-bold text-[#006e2f] nkp-num">
                              {count} article{count > 1 ? "s" : ""} →
                            </span>
                          </div>
                        </article>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section className="mt-16" aria-labelledby="populaires-titre">
                <div className="nkp-head !mb-8">
                  <span className="nkp-tag">Les plus lus</span>
                  <h2 id="populaires-titre" className="!text-[1.6rem]">
                    Articles populaires
                  </h2>
                </div>
                <ul className="nkp-grid-2 !gap-3 list-none m-0 p-0">
                  {ARTICLES.slice(0, 8).map((a) => {
                    const cat = CATEGORIES.find((c) => c.slug === a.category);
                    return (
                      <li key={a.slug}>
                        <article className="nkp-card nkp-card--hover nkp-reveal">
                          <div className="nkp-card__core !flex-row items-center gap-3 !py-4 !px-4">
                            <span className="nkp-ic nkp-ic--sm" aria-hidden="true">
                              <span className="material-symbols-outlined text-[18px]">{cat?.icon ?? "help"}</span>
                            </span>
                            <div className="min-w-0 flex-1">
                              <h3 className="truncate !text-[.95rem]">
                                <Link href={`/aide/${a.category}/${a.slug}`} className="nkp-stretch hover:text-[#006e2f] transition-colors">
                                  {a.title}
                                </Link>
                              </h3>
                              <p className="text-[.76rem] text-[#5c6b62]">
                                {cat?.title} · {a.readingMin} min
                              </p>
                            </div>
                            <ArrowRight size={18} strokeWidth={2} className="text-[#8a968e] flex-shrink-0" aria-hidden="true" />
                          </div>
                        </article>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <div className="nkp-bezel nkp-bezel--dark nkp-bezel--xl nkp-bezel--float nkp-reveal mt-16">
                <div className="nkp-cta !py-14">
                  <span className="nkp-tag nkp-tag--dark">Support</span>
                  <h2 className="!text-[1.7rem]">Pas trouvé votre réponse ?</h2>
                  <p>Notre équipe support répond en moins de 5 minutes en chat, sous 24 h par email. Disponible du lundi au vendredi, 8h – 19h GMT.</p>
                  <div className="nkp-actions">
                    <BoutonVerre href="/contact" variante="white" fleche>
                      <Mail size={16} strokeWidth={2} aria-hidden="true" />
                      Envoyer un message
                    </BoutonVerre>
                    <BoutonVerre href="mailto:support@novakou.com" variante="white">
                      <AtSign size={16} strokeWidth={2} aria-hidden="true" />
                      support@novakou.com
                    </BoutonVerre>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
