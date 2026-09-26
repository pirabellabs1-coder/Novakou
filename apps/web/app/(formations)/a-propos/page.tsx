import type { Metadata } from "next";
import { ArrowRight, BadgeCheck, Globe, GraduationCap, Rocket, ThumbsUp, TrendingUp, Users, type LucideIcon } from "lucide-react";
import { CoquePublique } from "@/components/formations/public/CoquePublique";
import { EnTetePage } from "@/components/formations/public/EnTetePage";
import { BoutonVerre } from "@/components/formations/public/BoutonVerre";

export const metadata: Metadata = {
  title: "À propos · Notre mission et nos valeurs",
  description: "Novakou est la plateforme qui transforme les talents en revenus durables. Découvrez notre mission, notre équipe et nos valeurs.",
};

const VALUES: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Rocket, title: "Concret avant tout", desc: "Pas de théorie déconnectée. Chaque formation, produit, outil est pensé pour produire des résultats mesurables." },
  { icon: Users, title: "Communauté d'abord", desc: "Une plateforme bâtie POUR les créateurs et les apprenants. Vos retours façonnent chaque évolution produit." },
  { icon: BadgeCheck, title: "Qualité sans compromis", desc: "Curation manuelle des formateurs, modération active, support réactif. Pas de spam, pas de scams." },
  { icon: TrendingUp, title: "Croissance partagée", desc: "Quand vous gagnez, on gagne. Notre commission n'augmente que si vos ventes augmentent — alignement total." },
];

const STATS: { value: number; affiche: string; suffix: string; label: string; icon: LucideIcon }[] = [
  { value: 12000, affiche: "12 000", suffix: "+", label: "Apprenants accompagnés", icon: Users },
  { value: 850, affiche: "850", suffix: "+", label: "Créateurs actifs", icon: GraduationCap },
  { value: 94, affiche: "94", suffix: "%", label: "Taux de satisfaction", icon: ThumbsUp },
  { value: 17, affiche: "17", suffix: "", label: "Pays africains couverts", icon: Globe },
];

const TEAM = [
  { name: "Pirabel Labs", role: "Fondateur & CEO", initial: "LG", bio: "Entrepreneur passionné par l'écosystème africain et la création de valeur via le digital." },
  { name: "Équipe produit", role: "Engineering & Design", initial: "EP", bio: "Une équipe distribuée qui construit avec soin chaque feature pensée pour vous." },
  { name: "Communauté", role: "Support & Modération", initial: "CO", bio: "Modérateurs et support clients basés en Afrique francophone, à votre écoute 7j/7." },
];

const TIMELINE = [
  { year: "2024", title: "L'idée née", desc: "Constat : trop de talents africains manquent d'outils pour monétiser leurs compétences. La graine est plantée." },
  { year: "2025", title: "Conception & prototype", desc: "9 mois de design produit avec des dizaines de créateurs et formateurs pour cadrer les vrais besoins." },
  { year: "2026", title: "Lancement officiel", desc: "Novakou ouvre ses portes. Marketplace, formations, outils marketing intégrés." },
  { year: "Demain", title: "Construire ensemble", desc: "Notre roadmap est publique. Vos retours guident les prochaines fonctionnalités." },
];

export default function AProposPage() {
  return (
    <CoquePublique>
      <EnTetePage
        eyebrow="Notre histoire"
        titre={
          <>
            Élever les talents <em>au plus haut niveau</em>
          </>
        }
        sousTitre="Novakou est née d'une conviction : chaque talent africain mérite des outils dignes pour transformer son savoir en revenus durables."
        actions={
          <>
            <BoutonVerre href="/inscription?role=instructeur" variante="primary" taille="lg" fleche>
              Créer ma boutique
            </BoutonVerre>
            <BoutonVerre href="/explorer" taille="lg">
              Explorer le catalogue
            </BoutonVerre>
          </>
        }
      />

      {/* ── Mission + chiffres ── */}
      <section className="nkp-section" aria-labelledby="mission-titre">
        <div className="nkp-wrap">
          <div className="nkp-duo">
            <div className="nkp-reveal">
              <span className="nkp-tag">Notre mission</span>
              <h2 id="mission-titre">Donner à chaque créateur les moyens de vivre de son savoir</h2>
              <div className="nkp-prose">
                <p>Trop de talents africains francophones manquent d'une plateforme moderne pour vendre formations, e-books, templates ou consulting. Les outils existants sont chers, mal localisés, et négligent les méthodes de paiement africaines.</p>
                <p>Nous bâtissons l'alternative : intégrée Mobile Money, pensée pour le francophone, avec des outils marketing qui se mesurent à Systeme.io ou Gumroad — sans le ticket d'entrée.</p>
              </div>
            </div>
            <div className="nkp-bezel nkp-bezel--float nkp-reveal">
              <div className="nkp-core nkp-core--pad">
                <ul className="grid grid-cols-2 gap-6 m-0 p-0 list-none">
                  {STATS.map((s) => (
                    <li key={s.label}>
                      <span className="nkp-ic nkp-ic--sm mb-3" aria-hidden="true">
                        <s.icon strokeWidth={1.75} />
                      </span>
                      <b className="block nkp-sora text-[1.9rem] font-bold tracking-[-.03em] leading-none nkp-num">
                        <span data-count={s.value}>{s.affiche}</span>
                        <span className="text-[#006e2f] text-[.65em]">{s.suffix}</span>
                      </b>
                      <span className="block mt-2 text-[.82rem] font-medium text-[#5c6b62]">{s.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Valeurs ── */}
      <section className="nkp-section nkp-section--tint" aria-labelledby="valeurs-titre">
        <div className="nkp-wrap">
          <div className="nkp-head nkp-head--center nkp-reveal">
            <span className="nkp-tag">Nos valeurs</span>
            <h2 id="valeurs-titre">Ce qui nous guide chaque jour</h2>
          </div>
          <div className="nkp-grid-2">
            {VALUES.map((v) => (
              <article key={v.title} className="nkp-card nkp-card--hover nkp-reveal">
                <div className="nkp-card__core">
                  <span className="nkp-ic mb-4" aria-hidden="true">
                    <v.icon strokeWidth={1.75} />
                  </span>
                  <h3>{v.title}</h3>
                  <p className="nkp-card__desc">{v.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Parcours ── */}
      <section className="nkp-section" aria-labelledby="parcours-titre">
        <div className="nkp-wrap">
          <div className="nkp-head nkp-head--center nkp-reveal">
            <span className="nkp-tag">Notre parcours</span>
            <h2 id="parcours-titre">L'histoire en quelques dates</h2>
          </div>
          <ol className="nkp-steps nkp-steps--4 list-none m-0 p-0">
            {TIMELINE.map((t) => (
              <li key={t.year} className="nkp-card nkp-step nkp-reveal">
                <div className="nkp-card__core">
                  <span className="nkp-step__n">{t.year}</span>
                  <span className="nkp-ic nkp-sora !text-[.9rem] font-bold" aria-hidden="true">
                    {/^\d{4}$/.test(t.year) ? t.year.slice(-2) : <ArrowRight strokeWidth={2} />}
                  </span>
                  <h3>{t.title}</h3>
                  <p>{t.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Équipe ── */}
      <section className="nkp-section nkp-section--tint" aria-labelledby="equipe-titre">
        <div className="nkp-wrap">
          <div className="nkp-head nkp-head--center nkp-reveal">
            <span className="nkp-tag">L'équipe</span>
            <h2 id="equipe-titre">Les humains derrière la plateforme</h2>
          </div>
          <div className="nkp-grid-3">
            {TEAM.map((p) => (
              <article key={p.name} className="nkp-card nkp-card--hover nkp-reveal">
                <div className="nkp-card__core items-center text-center">
                  <span className="nkp-av !w-16 !h-16 !rounded-2xl !text-[1.05rem] mb-4" aria-hidden="true">
                    {p.initial}
                  </span>
                  <h3>{p.name}</h3>
                  <span className="nkp-eyebrow mt-2">{p.role}</span>
                  <p className="nkp-card__desc mt-3 text-[.9rem]">{p.bio}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="nkp-section" aria-labelledby="cta-titre">
        <div className="nkp-wrap">
          <div className="nkp-bezel nkp-bezel--dark nkp-bezel--xl nkp-bezel--float nkp-reveal">
            <div className="nkp-cta">
              <span className="nkp-tag nkp-tag--dark">Rejoignez l'aventure</span>
              <h2 id="cta-titre">Créateur ou apprenant, Novakou est votre nouveau terrain de jeu.</h2>
              <p>Lancez votre boutique en 3 minutes ou explorez les formations et produits déjà en vente.</p>
              <div className="nkp-actions">
                <BoutonVerre href="/inscription?role=instructeur" variante="white" taille="lg" fleche>
                  Créer ma boutique
                </BoutonVerre>
                <BoutonVerre href="/explorer" variante="white" taille="lg">
                  Explorer le catalogue
                </BoutonVerre>
              </div>
            </div>
          </div>
        </div>
      </section>
    </CoquePublique>
  );
}
