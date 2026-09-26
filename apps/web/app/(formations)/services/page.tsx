import type { Metadata } from "next";
import {
  BookOpen,
  CreditCard,
  Download,
  GraduationCap,
  LayoutDashboard,
  Music,
  Package,
  Search,
  Sprout,
  Video,
  type LucideIcon,
} from "lucide-react";
import { CoquePublique } from "@/components/formations/public/CoquePublique";
import { EnTetePage } from "@/components/formations/public/EnTetePage";
import { BoutonVerre, Coche } from "@/components/formations/public/BoutonVerre";

export const metadata: Metadata = {
  title: "Services et Produits digitaux",
  description: "Découvrez tous les types de produits et services disponibles : formations vidéo, e-books, templates, coaching, audio, et plus.",
};

// Trois nuances de vert en alternance (public.css, .nkp-gcov) : une seule couleur d'accent.
const COUVERTURES = ["", " nkp-gcov--b", " nkp-gcov--c"];

const PRODUCT_TYPES: { icon: LucideIcon; title: string; desc: string; features: string[]; href: string; cta: string }[] = [
  {
    icon: GraduationCap,
    title: "Formations vidéo",
    desc: "Cours structurés en modules avec leçons vidéo HD. Idéal pour acquérir des compétences en profondeur.",
    features: ["Modules + leçons vidéo", "Quiz et certificat", "Accès à vie", "Support du créateur"],
    href: "/explorer?type=formations",
    cta: "Voir les formations",
  },
  {
    icon: BookOpen,
    title: "E-books & PDF",
    desc: "Guides pratiques téléchargeables. Lisez à votre rythme, où que vous soyez.",
    features: ["Téléchargement immédiat", "Format PDF / EPUB", "Lecture mobile + desktop", "Mises à jour offertes"],
    href: "/explorer?type=products&kind=PDF",
    cta: "Voir les e-books",
  },
  {
    icon: LayoutDashboard,
    title: "Templates & Modèles",
    desc: "Modèles prêts à l'emploi : Notion, Figma, PSD, présentations, contrats, scripts marketing.",
    features: ["Économisez des heures", "100% personnalisable", "Compatible toutes plateformes", "Exemples réels"],
    href: "/explorer?type=products&kind=TEMPLATE",
    cta: "Voir les templates",
  },
  {
    icon: Music,
    title: "Audio & Podcasts",
    desc: "Contenus audio à écouter en déplacement : interviews, masterclass, méditations guidées.",
    features: ["MP3 haute qualité", "Téléchargeable hors ligne", "Apple Podcasts compatible", "Transcripts inclus"],
    href: "/explorer?type=products&kind=AUDIO",
    cta: "Voir les audios",
  },
  {
    icon: Video,
    title: "Coaching individuel",
    desc: "Sessions personnalisées en visio avec un mentor. Pour aller en profondeur sur vos blocages spécifiques.",
    features: ["1-on-1 en visio", "Plan personnalisé", "Suivi par messagerie", "Replay disponible"],
    href: "/mentors",
    cta: "Trouver un coach",
  },
  {
    // L'ancienne page passait ici une chaîne Material (« inventory_2 ») là où un composant était attendu.
    icon: Package,
    title: "Bundles & Packs",
    desc: "Plusieurs produits regroupés à prix réduit. La meilleure façon d'économiser sur un domaine.",
    features: ["Jusqu'à -40% de remise", "Plusieurs ressources", "Cohérence pédagogique", "Idéal débutants"],
    href: "/explorer?type=products&kind=BUNDLE",
    cta: "Voir les bundles",
  },
];

const HOW_IT_WORKS: { num: string; icon: LucideIcon; title: string; desc: string }[] = [
  { num: "01", icon: Search, title: "Parcourez", desc: "Explorez le catalogue par type, catégorie, prix ou note." },
  { num: "02", icon: CreditCard, title: "Achetez", desc: "Paiement sécurisé en Mobile Money, carte ou virement." },
  { num: "03", icon: Download, title: "Accédez", desc: "Téléchargement immédiat ou accès en ligne à vie." },
  { num: "04", icon: Sprout, title: "Apprenez", desc: "Progressez à votre rythme, posez vos questions au créateur." },
];

/* Page héritée (encore au sitemap) : même coque que les pages publiques. */
export default function ServicesPage() {
  return (
    <CoquePublique>
      <EnTetePage
        eyebrow="Catalogue"
        titre={
          <>
            6 types de produits <em>pour tous les besoins</em>
          </>
        }
        sousTitre="Formation vidéo, e-book, template, audio, coaching ou bundle — choisissez le format qui vous convient."
        actions={
          <>
            <BoutonVerre href="/explorer" variante="primary" taille="lg" fleche>
              Voir le catalogue complet
            </BoutonVerre>
            <BoutonVerre href="#comment-ca-marche" taille="lg">
              Comment ça marche
            </BoutonVerre>
          </>
        }
      />

      {/* PRODUCT TYPES GRID */}
      <section className="nkp-section nkp-section--compact nkp-section--top0" aria-label="Types de produits">
        <div className="nkp-wrap">
          <ul className="nkp-grid-3 m-0 list-none p-0">
            {PRODUCT_TYPES.map(({ icon: Icone, title, desc, features, href, cta }, i) => (
              <li key={title} className="nkp-reveal">
                <article className="nkp-card nkp-card--hover h-full">
                  <div className="nkp-card__core !p-0 overflow-hidden">
                    <div className={`nkp-gcov${COUVERTURES[i % COUVERTURES.length]}`} aria-hidden="true">
                      <span className="ico">
                        <Icone size={30} strokeWidth={1.6} />
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <h2 className="!text-[1.2rem]">{title}</h2>
                      <p className="nkp-card__desc">{desc}</p>
                      <ul className="nkp-list !mb-6 !mt-5 flex-1 !gap-2.5">
                        {features.map((f) => (
                          <li key={f} className="!text-[.88rem]">
                            <Coche />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <BoutonVerre href={href} taille="sm" fleche bloc>
                        {cta}
                      </BoutonVerre>
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="comment-ca-marche" className="nkp-section nkp-section--compact nkp-section--tint" aria-labelledby="etapes-titre">
        <div className="nkp-wrap">
          <div className="nkp-head nkp-head--center nkp-reveal">
            <span className="nkp-tag">Comment ça marche</span>
            <h2 id="etapes-titre">4 étapes pour commencer</h2>
          </div>
          <ol className="nkp-steps nkp-steps--4 m-0 list-none p-0">
            {HOW_IT_WORKS.map(({ num, icon: Icone, title, desc }) => (
              <li key={num} className="nkp-step nkp-card nkp-reveal">
                <div className="nkp-card__core">
                  <span className="nkp-step__n" aria-hidden="true">
                    {num}
                  </span>
                  <span className="nkp-ic" aria-hidden="true">
                    <Icone strokeWidth={1.9} />
                  </span>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="nkp-section nkp-section--compact" aria-labelledby="services-cta-titre">
        <div className="nkp-wrap">
          <div className="nkp-bezel nkp-bezel--dark nkp-bezel--xl nkp-bezel--float nkp-reveal">
            <div className="nkp-cta nkp-cta--compact">
              <span className="nkp-tag nkp-tag--dark">Catalogue</span>
              <h2 id="services-cta-titre">Explorez tout le catalogue</h2>
              <p>Plus de 1 200 formations et produits digitaux à découvrir.</p>
              <div className="nkp-actions">
                <BoutonVerre href="/explorer" variante="white" taille="lg" fleche>
                  Voir le catalogue complet
                </BoutonVerre>
              </div>
            </div>
          </div>
        </div>
      </section>
    </CoquePublique>
  );
}
