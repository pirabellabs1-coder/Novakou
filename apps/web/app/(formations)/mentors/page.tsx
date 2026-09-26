import Link from "next/link";
import { CalendarCheck, Search, Video, type LucideIcon } from "lucide-react";
import { CoquePublique } from "@/components/formations/public/CoquePublique";
import { BoutonVerre } from "@/components/formations/public/BoutonVerre";
import { Accordeon } from "@/components/formations/public/Accordeon";
import { AnnuaireMentors, BoutonDevenirMentor } from "@/components/formations/public/AnnuaireMentors";

/*
 * Page Mentors — Server Component (métadonnées + fil d'Ariane JSON-LD dans
 * layout.tsx). L'annuaire (recherche, filtres, grille /api/formations/mentors)
 * est un îlot client ; le reste est statique.
 */

const ETAPES: { icon: LucideIcon; titre: string; desc: string }[] = [
  { icon: Search, titre: "Trouvez votre mentor", desc: "Filtrez par spécialité, langue et fourchette de prix. Chaque profil affiche sa note, ses avis vérifiés et sa disponibilité." },
  { icon: CalendarCheck, titre: "Réservez un créneau", desc: "Choisissez une date dans le calendrier du mentor et payez en Mobile Money ou par carte, comme pour une formation." },
  { icon: Video, titre: "Échangez en visio", desc: "Le lien de visio est généré automatiquement. Préparez vos questions : la séance est à vous, seul à seul avec l'expert." },
];

const FAQ = [
  { q: "Comment se déroule une séance de mentorat ?", a: "En visio, avec un lien généré automatiquement dès la réservation confirmée. La durée et le tarif de chaque séance sont fixés par le mentor sur son profil." },
  { q: "Comment payer une séance ?", a: "En Mobile Money (Wave, Orange Money, MTN MoMo…) ou par carte bancaire, directement sur Novakou. Le paiement est sécurisé et la séance apparaît dans votre espace apprenant." },
  { q: "Combien garde le mentor ?", a: "90 % de chaque séance. Novakou prélève 10 %, sans abonnement ni frais fixes — le même modèle que pour les formations et les produits." },
  { q: "Comment devenir mentor ?", a: "Depuis vos paramètres → Compte → « Devenir mentor » : renseignez votre spécialité, votre domaine, une bio, votre tarif et vos disponibilités. Les candidatures sont ouvertes." },
];

export default function MentorsPage() {
  return (
    <CoquePublique>
      <AnnuaireMentors />

      {/* ── Comment ça marche ── */}
      <section className="nkp-section" aria-labelledby="etapes-titre">
        <div className="nkp-wrap">
          <div className="nkp-head nkp-head--center nkp-reveal">
            <span className="nkp-tag">Comment ça marche</span>
            <h2 id="etapes-titre">Une séance en trois étapes</h2>
            <p>Des conseils qui viennent du terrain : stratégie, pricing, contenu, publicité. Vous réservez, vous échangez, vous avancez.</p>
          </div>
          <ol className="nkp-steps list-none m-0 p-0">
            {ETAPES.map((e, i) => (
              <li key={e.titre} className="nkp-card nkp-card--hover nkp-step nkp-reveal">
                <div className="nkp-card__core">
                  <span className="nkp-step__n">ÉTAPE 0{i + 1}</span>
                  <span className="nkp-ic" aria-hidden="true">
                    <e.icon strokeWidth={1.75} />
                  </span>
                  <h3>{e.titre}</h3>
                  <p>{e.desc}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="nkp-table-note nkp-reveal">
            Guide pas à pas :{" "}
            <Link href="/aide/apprenant/reserver-mentor" className="text-[#006e2f] font-semibold underline underline-offset-2">
              réserver une séance avec un mentor
            </Link>
            .
          </p>
        </div>
      </section>

      {/* ── Devenir mentor ── */}
      <section className="nkp-section nkp-section--top0" aria-labelledby="devenir-titre">
        <div className="nkp-wrap">
          <div className="nkp-bezel nkp-bezel--dark nkp-bezel--xl nkp-bezel--float nkp-reveal">
            <div className="nkp-cta">
              <span className="nkp-tag nkp-tag--dark">Candidatures ouvertes</span>
              <h2 id="devenir-titre">Devenez mentor sur Novakou</h2>
              <p>Partagez votre expertise en 1:1, fixez vos propres tarifs et développez une nouvelle source de revenus récurrents. Vous gardez 90 % de chaque séance.</p>
              <div className="nkp-actions">
                <BoutonDevenirMentor />
                <BoutonVerre href="/connexion" variante="white" taille="lg">
                  J'ai déjà un compte
                </BoutonVerre>
              </div>
              <small>
                Tout savoir :{" "}
                <Link href="/aide/mentorat/devenir-mentor" className="underline underline-offset-2 hover:text-white">
                  devenir mentor sur Novakou
                </Link>
              </small>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="nkp-section nkp-section--tint" aria-labelledby="faq-titre">
        <div className="nkp-wrap">
          <div className="nkp-head nkp-head--center nkp-reveal">
            <span className="nkp-tag">Questions fréquentes</span>
            <h2 id="faq-titre">Le mentorat, en pratique</h2>
          </div>
          <div className="nkp-reveal">
            <Accordeon items={FAQ} />
          </div>
        </div>
      </section>
    </CoquePublique>
  );
}
