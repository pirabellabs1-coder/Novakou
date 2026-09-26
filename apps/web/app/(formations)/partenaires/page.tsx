import type { Metadata } from "next";
import { Bot, CreditCard, Database, FileImage, Handshake, Headset, Mail, Smartphone, TrendingUp, Users, Waves, type LucideIcon } from "lucide-react";
import { CoquePublique } from "@/components/formations/public/CoquePublique";
import { EnTetePage } from "@/components/formations/public/EnTetePage";
import { BoutonVerre } from "@/components/formations/public/BoutonVerre";

export const metadata: Metadata = {
  title: "Partenaires et intégrations",
  description: "Découvrez nos partenaires de paiement, technologie et écosystème. Devenez partenaire Novakou.",
};

type Partenaire = { name: string; desc: string; icon: LucideIcon; color: string };

const PAYMENT_PARTNERS: Partenaire[] = [
  { name: "Orange Money", desc: "Mobile Money disponible en Afrique francophone (CI, SN, CM, BF...)", icon: Smartphone, color: "#ff6b00" },
  { name: "Wave", desc: "Paiements et transferts instantanés au Sénégal et Côte d'Ivoire", icon: Waves, color: "#1dafff" },
  { name: "MTN MoMo", desc: "Mobile Money sur les marchés MTN d'Afrique de l'Ouest et centrale", icon: Smartphone, color: "#ffcb05" },
  { name: "Moov Money", desc: "Mobile Money sur les marchés Moov (Bénin, Togo, Côte d'Ivoire, Burkina)", icon: Smartphone, color: "#0066b3" },
  { name: "Stripe", desc: "Paiements internationaux par carte (Visa, Mastercard) pour la diaspora", icon: CreditCard, color: "#635bff" },
];

const TECH_PARTNERS: Partenaire[] = [
  { name: "Supabase", desc: "Base de données PostgreSQL + authentification + stockage", icon: Database, color: "#3ecf8e" },
  { name: "Resend", desc: "Emails transactionnels avec design React", icon: Mail, color: "#000000" },
  { name: "Cloudinary", desc: "Hébergement et optimisation média (images, vidéos)", icon: FileImage, color: "#3448c5" },
  { name: "OpenAI", desc: "Intelligence artificielle pour la modération et l'aide à la création", icon: Bot, color: "#10a37f" },
];

const PROGRAM_BENEFITS: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: TrendingUp, title: "Visibilité", desc: "Votre logo sur cette page + dans nos campagnes marketing." },
  { icon: Users, title: "Audience qualifiée", desc: "Accès direct à une communauté de créateurs et apprenants engagés." },
  { icon: Handshake, title: "Co-création", desc: "Participation aux roadmaps produit et programmes événementiels." },
  { icon: Headset, title: "Support dédié", desc: "Un point de contact unique pour intégration technique et marketing." },
];

export default function PartenairesPage() {
  return (
    <CoquePublique>
      <EnTetePage
        eyebrow="Écosystème"
        titre={
          <>
            Nos partenaires <em>de confiance</em>
          </>
        }
        sousTitre="Des partenaires technologiques et financiers de premier plan qui rendent Novakou possible."
        actions={
          <>
            <BoutonVerre href="/contact?subject=partnership" variante="primary" taille="lg" fleche>
              Devenir partenaire
            </BoutonVerre>
            <BoutonVerre href="#paiements" taille="lg">
              Voir les intégrations
            </BoutonVerre>
          </>
        }
      />

      {/* ── Paiements ── */}
      <section id="paiements" className="nkp-section nkp-section--tint" aria-labelledby="paiements-titre">
        <div className="nkp-wrap">
          <div className="nkp-head nkp-head--center nkp-reveal">
            <span className="nkp-tag">Paiements</span>
            <h2 id="paiements-titre">Encaissez en Mobile Money & cartes</h2>
            <p>5 méthodes de paiement intégrées nativement pour couvrir l'Afrique francophone et l'international.</p>
          </div>
          <div className="nkp-grid-3">
            {PAYMENT_PARTNERS.map((p) => (
              <article key={p.name} className="nkp-card nkp-card--hover nkp-reveal">
                <div className="nkp-card__core">
                  <div className="nkp-feat__top">
                    <span className="nkp-ic" aria-hidden="true" style={{ color: p.color === "#ffcb05" ? "#8a6d00" : p.color }}>
                      <p.icon strokeWidth={1.75} />
                    </span>
                    <h3>{p.name}</h3>
                  </div>
                  <p className="nkp-card__desc !mt-0">{p.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Technologie ── */}
      <section className="nkp-section" aria-labelledby="tech-titre">
        <div className="nkp-wrap">
          <div className="nkp-head nkp-head--center nkp-reveal">
            <span className="nkp-tag">Technologie</span>
            <h2 id="tech-titre">Une stack moderne et fiable</h2>
            <p>Les meilleurs outils du marché, choisis avec soin pour la performance et la sécurité.</p>
          </div>
          <div className="nkp-grid-2">
            {TECH_PARTNERS.map((p) => (
              <article key={p.name} className="nkp-card nkp-card--hover nkp-reveal">
                <div className="nkp-card__core !flex-row items-start gap-4">
                  <span className="nkp-ic" aria-hidden="true">
                    <p.icon strokeWidth={1.75} />
                  </span>
                  <div>
                    <h3>{p.name}</h3>
                    <p className="nkp-card__desc !mt-1">{p.desc}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Programme partenaire ── */}
      <section className="nkp-section nkp-section--deep" aria-labelledby="programme-titre">
        <div className="nkp-wrap">
          <div className="nkp-head nkp-head--center nkp-reveal">
            <span className="nkp-tag nkp-tag--dark">Programme partenaire</span>
            <h2 id="programme-titre">Devenez partenaire Novakou</h2>
            <p>Vous proposez un service B2B (paiement, hébergement, design, marketing, juridique) qui pourrait servir nos créateurs ? Parlons-en.</p>
          </div>
          <div className="nkp-grid-4">
            {PROGRAM_BENEFITS.map((b) => (
              <article key={b.title} className="nkp-card nkp-card--dark nkp-reveal">
                <div className="nkp-card__core">
                  <span className="nkp-ic nkp-ic--dark mb-4" aria-hidden="true">
                    <b.icon strokeWidth={1.75} />
                  </span>
                  <h3>{b.title}</h3>
                  <p className="nkp-card__desc text-[.9rem]">{b.desc}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="nkp-center-btn nkp-reveal">
            <BoutonVerre href="/contact?subject=partnership" variante="white" taille="lg" fleche>
              <Handshake size={18} strokeWidth={2} aria-hidden="true" />
              Contacter l'équipe partenariats
            </BoutonVerre>
          </div>
        </div>
      </section>
    </CoquePublique>
  );
}
