import type { Metadata } from "next";
import {
  Activity,
  BadgeCheck,
  Bot,
  Code,
  Edit,
  Headset,
  Megaphone,
  Palette,
  ShieldCheck,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { CoquePublique } from "@/components/formations/public/CoquePublique";
import { EnTetePage } from "@/components/formations/public/EnTetePage";
import { BoutonVerre } from "@/components/formations/public/BoutonVerre";

export const metadata: Metadata = {
  title: "Freelances et Mentors",
  description: "Découvrez les meilleurs créateurs et mentors d'Afrique francophone. Formations, coaching, expertise.",
};

const SPECIALTIES: { icon: LucideIcon; label: string; count: string }[] = [
  { icon: Code, label: "Développement", count: "120+" },
  { icon: Megaphone, label: "Marketing digital", count: "85+" },
  { icon: Palette, label: "Design", count: "60+" },
  { icon: Activity, label: "Business & Stratégie", count: "75+" },
  { icon: Edit, label: "Rédaction & Contenu", count: "40+" },
  { icon: Bot, label: "Intelligence artificielle", count: "30+" },
];

const PERKS: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: BadgeCheck, title: "Profils vérifiés", desc: "Chaque créateur est validé manuellement par notre équipe avant d'apparaître sur la marketplace." },
  { icon: TrendingUp, title: "Notes & avis transparents", desc: "Les évaluations sont laissées par de vrais acheteurs. Pas de modération abusive." },
  { icon: Headset, title: "Support client réactif", desc: "En cas de problème avec un créateur, notre support intervient sous 24h." },
  { icon: ShieldCheck, title: "Garantie satisfait", desc: "14 jours pour tester. Si ça ne convient pas, remboursement intégral." },
];

/* Page héritée (encore au sitemap) : même coque que les pages publiques. */
export default function FreelancesPage() {
  return (
    <CoquePublique>
      <EnTetePage
        eyebrow="Mentors & créateurs"
        titre={
          <>
            Apprenez avec les meilleurs <em>créateurs d&apos;Afrique francophone</em>
          </>
        }
        sousTitre="Des mentors experts qui partagent leur savoir à travers formations, e-books, coaching individuel et templates."
        actions={
          <>
            <BoutonVerre href="/mentors" variante="primary" taille="lg" fleche>
              Découvrir tous les mentors
            </BoutonVerre>
            <BoutonVerre href="/inscription?role=instructeur" taille="lg">
              Devenir créateur
            </BoutonVerre>
          </>
        }
      />

      {/* SPECIALTIES */}
      <section className="nkp-section nkp-section--compact nkp-section--tint" aria-labelledby="specialites-titre">
        <div className="nkp-wrap">
          <div className="nkp-head nkp-reveal">
            <span className="nkp-tag">Spécialités</span>
            <h2 id="specialites-titre">Une expertise dans tous les domaines</h2>
          </div>
          <ul className="nkp-grid-3 nkp-grid-2--sm m-0 list-none p-0">
            {SPECIALTIES.map(({ icon: Icone, label, count }) => (
              <li key={label} className="nkp-reveal">
                <div className="nkp-card nkp-card--hover h-full">
                  <div className="nkp-card__core">
                    <span className="nkp-ic mb-5" aria-hidden="true">
                      <Icone strokeWidth={1.9} />
                    </span>
                    <h3 className="!text-[1.02rem]">
                      <Link
                        href={`/explorer?category=${encodeURIComponent(label)}`}
                        className="nkp-stretch transition-colors hover:text-[#006e2f]"
                      >
                        {label}
                      </Link>
                    </h3>
                    <p className="nkp-num mt-1 text-[.8rem] font-bold text-[#006e2f]">{count} créateurs</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* PERKS */}
      <section className="nkp-section nkp-section--compact" aria-labelledby="confiance-titre">
        <div className="nkp-wrap">
          <div className="nkp-head nkp-reveal">
            <span className="nkp-tag">Pourquoi nous</span>
            <h2 id="confiance-titre">La confiance, notre priorité</h2>
          </div>
          <ul className="nkp-grid-4 m-0 list-none p-0">
            {PERKS.map(({ icon: Icone, title, desc }) => (
              <li key={title} className="nkp-reveal">
                <div className="nkp-card h-full">
                  <div className="nkp-card__core">
                    <span className="nkp-ic nkp-ic--sm mb-4" aria-hidden="true">
                      <Icone strokeWidth={1.9} />
                    </span>
                    <h3 className="!text-[1rem]">{title}</h3>
                    <p className="nkp-card__desc text-[.9rem]">{desc}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="nkp-section nkp-section--compact nkp-section--top0" aria-labelledby="freelances-cta-titre">
        <div className="nkp-wrap">
          <div className="nkp-bezel nkp-bezel--dark nkp-bezel--xl nkp-bezel--float nkp-reveal">
            <div className="nkp-cta nkp-cta--compact">
              <span className="nkp-tag nkp-tag--dark">Mentorat</span>
              <h2 id="freelances-cta-titre">Prêt à apprendre des meilleurs ?</h2>
              <p>Parcourez le catalogue ou contactez directement un mentor pour un coaching personnalisé.</p>
              <div className="nkp-actions">
                <BoutonVerre href="/mentors" variante="white" taille="lg" fleche>
                  Voir tous les mentors
                </BoutonVerre>
              </div>
            </div>
          </div>
        </div>
      </section>
    </CoquePublique>
  );
}
