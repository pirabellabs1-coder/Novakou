"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileText, Link2, PlayCircle, RefreshCw } from "lucide-react";
import { BoutonVerre } from "@/components/formations/public/BoutonVerre";

interface Resource {
  id: string;
  title: string;
  description: string | null;
  type: string;
  url: string;
  thumbnail: string | null;
  category: string;
}

function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
function thumbOf(r: Resource): string | null {
  if (r.thumbnail) return r.thumbnail;
  const yt = youtubeId(r.url);
  return yt ? `https://img.youtube.com/vi/${yt}/hqdefault.jpg` : null;
}

type Etat = "chargement" | "ok" | "erreur";

/**
 * Grille des ressources de l'Académie (/api/formations/academy), groupées
 * par catégorie : squelettes pendant le chargement, état vide, erreur
 * avec relance. L'en-tête de page est rendu côté serveur (page.tsx).
 */
export default function AcademieClient() {
  const [items, setItems] = useState<Resource[]>([]);
  const [etat, setEtat] = useState<Etat>("chargement");

  const charger = useCallback(async () => {
    setEtat("chargement");
    try {
      const r = await fetch("/api/formations/academy");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j: { data?: Resource[] } = await r.json().catch(() => ({ data: [] }));
      setItems(j.data ?? []);
      setEtat("ok");
    } catch {
      setEtat("erreur");
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  const categories = Array.from(new Set(items.map((i) => i.category)));

  return (
    <section id="ressources" className="nkp-section nkp-section--tint !pt-12" aria-label="Ressources de l'Académie" aria-busy={etat === "chargement"}>
      <div className="nkp-wrap">
        {etat === "chargement" && (
          <div className="nkp-grid-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="nkp-card">
                <div className="nkp-card__core !p-0 overflow-hidden">
                  <div className="nkp-skel aspect-video !rounded-none" />
                  <div className="p-5 flex flex-col gap-3">
                    <div className="nkp-skel h-4 w-3/4" />
                    <div className="nkp-skel h-3 w-full" />
                    <div className="nkp-skel h-3 w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {etat === "erreur" && (
          <div className="nkp-card max-w-lg mx-auto">
            <div className="nkp-card__core items-center text-center">
              <span className="nkp-ic mb-3" aria-hidden="true">
                <RefreshCw strokeWidth={1.75} />
              </span>
              <h2 className="text-[1.1rem]">Impossible de charger les ressources</h2>
              <p className="nkp-card__desc">Vérifiez votre connexion, puis réessayez.</p>
              <button type="button" onClick={charger} className="nkp-btn nkp-btn--primary nkp-btn--sm mt-5">
                Réessayer
              </button>
            </div>
          </div>
        )}

        {etat === "ok" && items.length === 0 && (
          <div className="nkp-card max-w-lg mx-auto">
            <div className="nkp-card__core items-center text-center">
              <span className="nkp-ic mb-3" aria-hidden="true">
                <PlayCircle strokeWidth={1.75} />
              </span>
              <h2 className="text-[1.1rem]">Les premières ressources arrivent bientôt</h2>
              <p className="nkp-card__desc">Revenez très vite — l'équipe Novakou prépare du contenu pour vous aider à vendre plus. En attendant, les guides écrits sont disponibles.</p>
              <div className="mt-5">
                <BoutonVerre href="/guides" variante="primary" fleche>
                  Lire les guides
                </BoutonVerre>
              </div>
            </div>
          </div>
        )}

        {etat === "ok" &&
          categories.map((cat) => (
            <section key={cat} className="mb-14 last:mb-0" aria-labelledby={`cat-${cat}`}>
              <div className="nkp-head !mb-6">
                <h2 id={`cat-${cat}`} className="!text-[1.35rem] !mt-0">
                  {cat}
                </h2>
              </div>
              <ul className="nkp-grid-3 list-none m-0 p-0">
                {items
                  .filter((i) => i.category === cat)
                  .map((r, i) => {
                    const thumb = thumbOf(r);
                    const Ic = r.type === "VIDEO" ? PlayCircle : r.type === "PDF" ? FileText : Link2;
                    const badge = r.type === "VIDEO" ? "Vidéo" : r.type === "PDF" ? "PDF" : "Lien";
                    const cta = r.type === "VIDEO" ? "Regarder" : r.type === "PDF" ? "Lire le guide" : "Ouvrir";
                    return (
                      <li key={r.id} className="nkp-apparait" style={{ "--i": Math.min(i, 8) } as React.CSSProperties}>
                        <article className="nkp-card nkp-card--hover h-full" aria-labelledby={`res-${r.id}`}>
                          <div className="nkp-card__core !p-0 overflow-hidden">
                            <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-[#0a3d23] to-[#032314] grid place-items-center">
                              {thumb ? (
                                // eslint-disable-next-line @next/next/no-img-element -- vignette externe (YouTube / upload)
                                <img src={thumb} alt="" width={480} height={270} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                              ) : (
                                <span className="nkp-sora text-white/90 font-bold text-xl">Novakou</span>
                              )}
                              <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-[#0e1512] shadow-sm">
                                <Ic size={12} strokeWidth={2.2} aria-hidden="true" />
                                {badge}
                              </span>
                              <span className="absolute right-3 top-3 rounded-full bg-[#006e2f] px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">Gratuit</span>
                            </div>
                            <div className="flex flex-1 flex-col p-5">
                              <h3 id={`res-${r.id}`} className="text-[1rem] leading-snug">
                                <Link href={`/academie/${r.id}`} className="nkp-stretch hover:text-[#006e2f] transition-colors">
                                  {r.title}
                                </Link>
                              </h3>
                              {r.description && <p className="mt-1.5 line-clamp-2 text-[.85rem] text-[#5c6b62] flex-1">{r.description}</p>}
                              <span className="nkp-link mt-4 text-[.88rem]" aria-hidden="true">
                                {cta}
                                <ArrowRight strokeWidth={2.2} />
                              </span>
                            </div>
                          </div>
                        </article>
                      </li>
                    );
                  })}
              </ul>
            </section>
          ))}
      </div>
    </section>
  );
}
