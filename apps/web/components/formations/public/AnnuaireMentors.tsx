"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";
import { BadgeCheck, Clock, Code, HandHeart, Headset, RefreshCw, Search, Star, Trophy, UserSearch, X, type LucideIcon } from "lucide-react";
import { EnTetePage } from "./EnTetePage";
import { BoutonVerre } from "./BoutonVerre";
import { formaterNombre } from "@/components/home/reveal-compteurs";

/* ─── Forme d'un mentor (réponse de /api/formations/mentors) ─────────── */
type Mentor = {
  id: string;
  userId: string;
  name: string | null;
  image: string | null;
  specialty: string;
  domain: string | null;
  bio: string;
  coverImage: string | null;
  sessionPrice: number;
  sessionDuration: number;
  languages: string[];
  badges: string[];
  available: boolean;
  isVerified: boolean;
  rating: number;
  reviews: number;
  students: number;
  totalSessions: number;
};

/* Couvertures par défaut (choisies par hachage de l'id), quand le mentor n'en a pas fixé. */
const DEFAULT_COVERS = [
  "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&q=80",
  "https://images.unsplash.com/photo-1506765515384-028b60a970df?w=800&q=80",
  "https://images.unsplash.com/photo-1557425493-6f90ae4659fc?w=800&q=80",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
];

function hachage(s: string): number {
  return s.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
}
function coverFor(m: Mentor): string {
  return m.coverImage ?? DEFAULT_COVERS[hachage(m.id) % DEFAULT_COVERS.length];
}
/* Certaines bios sont stockées en HTML : on n'affiche que le texte (aucun rendu HTML). */
function texteBrut(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
function initialsOf(name: string | null): string {
  if (!name) return "??";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

const DOMAINES = ["Tous", "Marketing", "Dev", "Design", "Business"];

const BADGES: Record<string, LucideIcon> = {
  "Top Mentor": Trophy,
  Vérifié: BadgeCheck,
  "Expert Tech": Code,
  "Rising Star": Star,
};

type Etat = "chargement" | "ok" | "erreur";

/**
 * Annuaire des mentors : recherche + filtre par domaine (dans l'en-tête),
 * grille chargée depuis /api/formations/mentors, états chargement / vide /
 * erreur explicites. Client par nécessité (état partagé entre l'en-tête et
 * la grille).
 */
export function AnnuaireMentors() {
  const [recherche, setRecherche] = useState("");
  const [domaine, setDomaine] = useState("Tous");
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [etat, setEtat] = useState<Etat>("chargement");
  const idRecherche = useId();

  const charger = useCallback(async () => {
    setEtat("chargement");
    try {
      const res = await fetch("/api/formations/mentors");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: { data?: Mentor[] } = await res.json();
      setMentors(json.data ?? []);
      setEtat("ok");
    } catch (err) {
      console.warn("[mentors page] fetch failed", err);
      setMentors([]);
      setEtat("erreur");
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  const q = recherche.trim().toLowerCase();
  const filtres = mentors.filter((m) => {
    const okDomaine = domaine === "Tous" || m.domain === domaine;
    const okRecherche = q === "" || (m.name ?? "").toLowerCase().includes(q) || m.specialty.toLowerCase().includes(q);
    return okDomaine && okRecherche;
  });

  return (
    <>
      <EnTetePage
        eyebrow="Mentorat 1:1 · Experts africains"
        titre={
          <>
            Trouvez <em>votre mentor</em>
          </>
        }
        sousTitre="Des professionnels qui vous accompagnent en session individuelle pour accélérer votre projet et vos ventes. Réservez un créneau, payez en Mobile Money, échangez en visio."
        meta={["Mentors vérifiés, notés par la communauté", "Séances en visio ou par téléphone", "Le mentor garde 90 % de chaque séance"]}
      >
        <form role="search" className="nkp-search max-w-2xl mx-auto" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor={idRecherche} className="sr-only">
            Chercher un mentor ou une spécialité
          </label>
          <Search strokeWidth={1.75} aria-hidden="true" />
          <input
            id={idRecherche}
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Chercher un mentor, une spécialité…"
            autoComplete="off"
            enterKeyHint="search"
          />
          {recherche && (
            <button
              type="button"
              onClick={() => setRecherche("")}
              aria-label="Effacer la recherche"
              className="nkp-btn nkp-btn--sm !min-h-[36px] !px-2 absolute right-3 top-1/2 -translate-y-1/2 z-[1]"
            >
              <X size={15} strokeWidth={2.2} aria-hidden="true" />
            </button>
          )}
        </form>
        <div className="mt-6 flex flex-col items-center gap-3">
          <div className="nkp-chips nkp-chips--scroll w-full" role="group" aria-label="Filtrer par domaine">
            {DOMAINES.map((d) => (
              <button key={d} type="button" className="nkp-chip" aria-pressed={domaine === d} onClick={() => setDomaine(d)}>
                {d}
              </button>
            ))}
          </div>
          <p className="text-[.85rem] text-[#5c6b62] nkp-num" aria-live="polite">
            {etat === "chargement" ? "Chargement des mentors…" : `${filtres.length} mentor${filtres.length !== 1 ? "s" : ""}`}
          </p>
        </div>
      </EnTetePage>

      <section className="nkp-section nkp-section--tight nkp-section--tint min-h-[50vh]" aria-label="Liste des mentors" aria-busy={etat === "chargement"}>
        <div className="nkp-wrap py-8">
          {etat === "chargement" && (
            <div className="nkp-grid-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="nkp-card">
                  <div className="nkp-card__core !p-0 overflow-hidden">
                    <div className="nkp-skel aspect-[4/3] !rounded-none" />
                    <div className="p-5 flex flex-col gap-3">
                      <div className="nkp-skel h-4 w-2/3" />
                      <div className="nkp-skel h-3 w-full" />
                      <div className="nkp-skel h-3 w-5/6" />
                      <div className="nkp-skel h-9 w-full mt-2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {etat === "erreur" && (
            <div className="nkp-card max-w-lg mx-auto">
              <div className="nkp-card__core items-center text-center">
                <span className="nkp-ic nkp-ic--sm mb-3" aria-hidden="true">
                  <RefreshCw strokeWidth={1.75} />
                </span>
                <h2 className="text-[1.1rem]">Impossible de charger les mentors</h2>
                <p className="nkp-card__desc">Vérifiez votre connexion, puis réessayez.</p>
                <button type="button" onClick={charger} className="nkp-btn nkp-btn--primary nkp-btn--sm mt-5">
                  Réessayer
                </button>
              </div>
            </div>
          )}

          {etat === "ok" && filtres.length === 0 && (
            <div className="nkp-card max-w-lg mx-auto">
              <div className="nkp-card__core items-center text-center">
                <span className="nkp-ic mb-3" aria-hidden="true">
                  <UserSearch strokeWidth={1.75} />
                </span>
                <h2 className="text-[1.1rem]">{mentors.length === 0 ? "Aucun mentor inscrit pour l'instant" : "Aucun mentor trouvé"}</h2>
                <p className="nkp-card__desc">{mentors.length === 0 ? "Soyez le premier à proposer vos services de mentorat sur Novakou." : "Essayez un autre domaine ou modifiez votre recherche."}</p>
                <div className="mt-5">
                  {mentors.length === 0 ? (
                    <BoutonVerre href="/inscription?role=mentor" variante="primary" fleche>
                      Devenir mentor
                    </BoutonVerre>
                  ) : (
                    <button
                      type="button"
                      className="nkp-btn nkp-btn--sm"
                      onClick={() => {
                        setRecherche("");
                        setDomaine("Tous");
                      }}
                    >
                      Réinitialiser les filtres
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {etat === "ok" && filtres.length > 0 && (
            <ul className="nkp-grid-3 list-none m-0 p-0">
              {filtres.map((m, i) => (
                <li key={m.id} className="nkp-apparait" style={{ "--i": Math.min(i, 8) } as React.CSSProperties}>
                  <CarteMentor mentor={m} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}

/* ─── Carte mentor : couverture 4/3, avatar, badges, prix en chiffres tabulaires ─── */
function CarteMentor({ mentor }: { mentor: Mentor }) {
  const cover = coverFor(mentor);
  return (
    <article className="nkp-card nkp-card--hover h-full" aria-labelledby={`mentor-${mentor.id}`}>
      <div className="nkp-card__core !p-0 overflow-hidden">
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#0a3d23] to-[#032314]">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element -- source externe variable, pas d'optimisation next/image
            <img src={cover} alt="" width={800} height={600} loading="lazy" decoding="async" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Headset size={64} strokeWidth={1.25} className="text-white/60" aria-hidden="true" />
            </div>
          )}
          <div className="absolute left-3 top-3 flex items-center gap-1.5">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-sm ${mentor.available ? "bg-[#006e2f] text-white" : "bg-[#0e1512]/85 text-white"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${mentor.available ? "bg-white" : "bg-white/60"}`} aria-hidden="true" />
              {mentor.available ? "Disponible" : "Indisponible"}
            </span>
            {mentor.isVerified && (
              <span className="inline-flex rounded-full bg-white p-0.5 text-[#006e2f] shadow-sm" title="Profil vérifié">
                <BadgeCheck size={14} aria-label="Profil vérifié" />
              </span>
            )}
          </div>
          {mentor.rating > 0 && (
            <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-[#0e1512] shadow-sm nkp-num">
              <Star size={12} className="fill-[#f2b705] text-[#f2b705]" aria-hidden="true" />
              {mentor.rating.toFixed(1)}
              {mentor.reviews > 0 && <span className="text-[#5c6b62]">({mentor.reviews})</span>}
            </span>
          )}
          <div className="absolute bottom-3 left-3">
            <span className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-[#006e2f] text-sm font-bold tracking-tight text-white shadow-lg ring-2 ring-white">
              {initialsOf(mentor.name)}
              {mentor.image && (
                // eslint-disable-next-line @next/next/no-img-element -- avatar externe ; en cas d'échec (avatar Google bloqué), les initiales dessous restent visibles
                <img
                  src={mentor.image}
                  alt=""
                  width={56}
                  height={56}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-5">
          <div>
            <h3 id={`mentor-${mentor.id}`} className="text-[1rem] leading-tight line-clamp-1">
              <Link href={`/mentors/${mentor.id}`} className="nkp-stretch hover:text-[#006e2f] transition-colors">
                {mentor.name ?? "Mentor"}
              </Link>
            </h3>
            <p className="mt-0.5 line-clamp-1 text-[.82rem] text-[#5c6b62]">{mentor.specialty}</p>
          </div>
          {mentor.domain && <span className="nkp-eyebrow self-start">{mentor.domain}</span>}
          <p className="line-clamp-2 text-[.84rem] leading-relaxed text-[#5c6b62]">{texteBrut(mentor.bio)}</p>
          {(mentor.badges.length > 0 || mentor.languages.length > 0) && (
            <ul className="flex flex-wrap gap-1.5 list-none m-0 p-0">
              {mentor.badges.slice(0, 2).map((b) => {
                const Ic = BADGES[b];
                return (
                  <li key={b} className="inline-flex items-center gap-1 rounded-full bg-[#f0f6f2] px-2 py-0.5 text-[10px] font-bold text-[#006e2f]">
                    {Ic && <Ic size={10} aria-hidden="true" />}
                    {b}
                  </li>
                );
              })}
              {mentor.languages.slice(0, 3).map((l) => (
                <li key={l} className="rounded-full bg-[#0e1512]/[.05] px-2 py-0.5 text-[10px] font-semibold text-[#5c6b62]">
                  {l}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-auto flex items-center justify-between pt-3 shadow-[inset_0_1px_0_#e6ece8]">
            <p className="nkp-sora text-[1.05rem] font-bold leading-tight text-[#006e2f] nkp-num">
              {formaterNombre(mentor.sessionPrice)} <span className="text-[10px] font-bold text-[#5c6b62]">FCFA</span>
            </p>
            <span className="inline-flex items-center gap-1 text-[.8rem] font-medium text-[#5c6b62] nkp-num">
              <Clock size={14} strokeWidth={2} aria-hidden="true" />
              {mentor.sessionDuration} min
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

/** Bouton « Devenir mentor » avec icône, réutilisé sous la grille. */
export function BoutonDevenirMentor() {
  return (
    <BoutonVerre href="/inscription?role=mentor" variante="white" taille="lg" fleche>
      <HandHeart size={18} strokeWidth={2} aria-hidden="true" />
      Postuler comme mentor
    </BoutonVerre>
  );
}
