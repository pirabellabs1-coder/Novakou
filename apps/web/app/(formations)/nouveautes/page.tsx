import type { Metadata } from "next";
import {
  MessagesSquare,
  Sparkles,
  BellRing,
  Smartphone,
  BadgeCheck,
  Megaphone,
  Share,
  Plus,
  CheckCircle2,
} from "lucide-react";
import { CoquePublique } from "@/components/formations/public/CoquePublique";
import { EnTetePage } from "@/components/formations/public/EnTetePage";
import { BoutonVerre } from "@/components/formations/public/BoutonVerre";
import { SommaireArticle } from "@/components/formations/public/article/SommaireArticle";
import "@/components/formations/public/article/article.css";

export const metadata: Metadata = {
  // `absolute` : « Novakou » est deja dans le titre. Sans ça, le template
  // du layout racine ajoute « | Novakou » et le nom sort deux fois.
  title: { absolute: "Nouveautés Novakou 2.0 — tout ce qui change" },
  // ≤ 160 caractères (workflow SEO) : même promesse, formulée plus court.
  description:
    "Messagerie en temps réel, recherche par IA, notifications push, application installable, badge Vendeur vérifié : les nouveautés de Novakou 2.0, pas à pas.",
  alternates: { canonical: "/nouveautes" },
  openGraph: {
    title: "Novakou 2.0 est arrivé 🚀",
    description:
      "Le guide complet des nouveautés Novakou 2.0 et comment les utiliser pour apprendre, vendre et gagner.",
    url: "/nouveautes",
  },
};

interface Feature {
  id: string;
  icon: typeof MessagesSquare;
  badge: string;
  title: string;
  intro: string;
  steps: string[];
}

const FEATURES: Feature[] = [
  {
    id: "messagerie",
    icon: MessagesSquare,
    badge: "Communication",
    title: "Messagerie en temps réel",
    intro:
      "Échangez en direct avec vos clients ou vos vendeurs. Les messages arrivent instantanément, vous voyez qui est « en ligne » et la cloche se met à jour sans rafraîchir la page.",
    steps: [
      "Ouvrez une conversation depuis « Messages » dans votre espace.",
      "Écrivez : votre interlocuteur reçoit le message à la seconde, et voit l'indicateur de frappe.",
      "Le point vert indique qu'une personne est connectée — le bon moment pour obtenir une réponse rapide.",
    ],
  },
  {
    id: "recherche-ia",
    icon: Sparkles,
    badge: "Intelligence artificielle",
    title: "Recherche par IA en langage naturel",
    intro:
      "Plus besoin de deviner les bons mots-clés. Décrivez votre besoin avec vos propres mots, et l'IA parcourt le catalogue réel pour vous proposer les produits les plus pertinents.",
    steps: [
      "Allez sur la page Explorer.",
      "Tapez une phrase naturelle, par exemple « je veux apprendre à vendre sur WhatsApp ».",
      "L'IA traduit votre besoin en recherche et affiche les formations et produits correspondants.",
    ],
  },
  {
    id: "notifications",
    icon: BellRing,
    badge: "Notifications",
    title: "Notifications push (même application fermée)",
    intro:
      "Soyez prévenu d'une vente, d'un message ou d'une nouveauté instantanément sur votre téléphone — même quand Novakou est fermé.",
    steps: [
      "Ouvrez la cloche 🔔 en haut de votre espace.",
      "Cliquez sur « Activer les notifications » et acceptez la demande du navigateur.",
      "C'est tout : vous recevez désormais les alertes importantes directement sur votre appareil.",
    ],
  },
  {
    id: "installation",
    icon: Smartphone,
    badge: "Application",
    title: "Installer Novakou comme une vraie application",
    intro:
      "Ajoutez Novakou à votre écran d'accueil pour un accès en un toucher, plein écran, qui fonctionne même avec une connexion faible.",
    steps: [
      "Sur Android / Chrome : appuyez sur la bannière « Installer Novakou » (ou menu ⋮ → « Installer l'application »).",
      "Sur iPhone (Safari) : appuyez sur Partager, puis sur « Sur l'écran d'accueil ».",
      "L'icône Novakou apparaît sur votre téléphone, comme une application classique.",
    ],
  },
  {
    id: "confiance",
    icon: BadgeCheck,
    badge: "Confiance",
    title: "Badge « Vendeur vérifié » & recommandations",
    intro:
      "Les vendeurs dont l'identité est vérifiée affichent un badge de confiance. Et partout, des recommandations personnalisées vous suggèrent les produits faits pour vous.",
    steps: [
      "Vendeurs : complétez votre vérification d'identité (KYC) depuis vos paramètres pour obtenir le badge.",
      "Acheteurs : repérez le badge vert ✓ sur les fiches pour acheter en confiance.",
      "Sur chaque produit, regardez la section « Vous aimerez aussi » pour découvrir des contenus proches.",
    ],
  },
];

const SOMMAIRE = [
  ...FEATURES.map((f, i) => ({ id: f.id, label: f.title, n: String(i + 1).padStart(2, "0") })),
  { id: "conseil-vendeurs", label: "Vendeurs : le conseil n°1", n: String(FEATURES.length + 1).padStart(2, "0") },
];

export default function NouveautesPage() {
  return (
    <CoquePublique>
      <EnTetePage
        eyebrow="Mise à jour majeure"
        titre={
          <>
            Novakou 2.0 <em>est arrivé</em>
          </>
        }
        sousTitre="Plus rapide, plus humain, plus rentable. Voici tout ce qui change — et comment en profiter dès aujourd'hui pour apprendre, vendre et gagner."
        actions={
          <>
            <BoutonVerre href="/explorer" variante="primary" taille="lg" fleche>
              Explorer le catalogue
            </BoutonVerre>
            <BoutonVerre href="#messagerie" taille="lg">
              Voir les nouveautés
            </BoutonVerre>
          </>
        }
      />

      <div className="nkp-wrap">
        <div className="nka-layout">
          <SommaireArticle items={SOMMAIRE} titre="Les nouveautés" unite="rubriques" />

          <div className="nka-corps nka-prose">
            {/* Sections fonctionnalités */}
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <section key={f.id} id={f.id} className="nka-sec" aria-labelledby={`${f.id}-titre`}>
                  <div className="nka-nv__tete">
                    <span className="nkp-ic nkp-ic--sm" aria-hidden="true">
                      <Icon strokeWidth={1.9} />
                    </span>
                    <span className="nkp-eyebrow">
                      {String(i + 1).padStart(2, "0")} · {f.badge}
                    </span>
                  </div>
                  <h2 id={`${f.id}-titre`} className="nka-nv__h2">
                    {f.title}
                  </h2>

                  <p>{f.intro}</p>

                  <div className="nka-etapes">
                    <p className="nka-lie__meta">Comment l&apos;utiliser</p>
                    <ol>
                      {f.steps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>

                  {/* Encart iOS spécifique sous la section installation */}
                  {f.id === "installation" && (
                    <div className="nka-note nka-note--tip" role="note" aria-label="Sur iPhone">
                      <span className="nka-note__ic" aria-hidden="true">
                        <Smartphone strokeWidth={1.9} />
                      </span>
                      <div className="nka-note__c">
                        <p>
                          <strong>Sur iPhone</strong>, l&apos;installation se fait toujours via Safari : touchez{" "}
                          <Share size={14} className="inline -mt-0.5 text-[#006e2f]" aria-hidden="true" /> <strong>Partager</strong> en bas
                          de l&apos;écran, faites défiler, puis touchez{" "}
                          <Plus size={14} className="inline -mt-0.5 text-[#006e2f]" aria-hidden="true" />{" "}
                          <strong>« Sur l&apos;écran d&apos;accueil »</strong>. Apple ne permet pas de bouton d&apos;installation
                          automatique — c&apos;est normal.
                        </p>
                      </div>
                    </div>
                  )}
                </section>
              );
            })}

            {/* Conseil vendeurs */}
            <section id="conseil-vendeurs" className="nka-sec" aria-labelledby="conseil-vendeurs-titre">
              <div className="nkp-card nkp-card--dark nka-conseil">
                <div className="nkp-card__core">
                  <div className="nka-nv__tete">
                    <span className="nkp-ic nkp-ic--dark" aria-hidden="true">
                      <Megaphone strokeWidth={1.9} />
                    </span>
                    <span className="nkp-eyebrow nkp-eyebrow--dark">Conseil</span>
                  </div>
                  <h2 id="conseil-vendeurs-titre" className="nka-nv__h2">
                    Vendeurs : le conseil n°1 pour vos premières ventes
                  </h2>
                  <p>
                    Un bon produit ne suffit pas : pour vendre, il faut être <strong>vu</strong>. La majorité des
                    vendeurs qui réussissent sur Novakou commencent par <strong>lancer une publicité</strong>.
                  </p>
                  <ul className="nka-conseil__liste">
                    {[
                      "Partagez le lien de votre produit sur WhatsApp, TikTok, Facebook et Instagram.",
                      "Créez une promotion de lancement pour donner envie d'acheter tout de suite.",
                      "Diffusez une annonce sponsorisée ciblée pour toucher de nouveaux acheteurs.",
                      "Soignez votre titre, votre image de couverture et votre description : c'est votre vitrine.",
                    ].map((tip) => (
                      <li key={tip}>
                        <CheckCircle2 size={18} strokeWidth={1.9} aria-hidden="true" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                  <p>C&apos;est l&apos;étape qui transforme vos visiteurs en acheteurs — et vos efforts en revenus.</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* CTA final */}
      <section className="nkp-section nkp-section--compact nkp-section--top0" aria-labelledby="nouveautes-cta-titre">
        <div className="nkp-wrap">
          <div className="nkp-bezel nkp-bezel--dark nkp-bezel--xl nkp-bezel--float nkp-reveal">
            <div className="nkp-cta nkp-cta--compact">
              <span className="nkp-tag nkp-tag--dark">Novakou 2.0</span>
              <h2 id="nouveautes-cta-titre">Prêt à profiter de Novakou 2.0 ?</h2>
              <p>Tout est déjà disponible dans votre espace.</p>
              <div className="nkp-actions">
                <BoutonVerre href="/explorer" variante="white" taille="lg" fleche>
                  Explorer le catalogue
                </BoutonVerre>
                <BoutonVerre href="/vendeur/dashboard" variante="white" taille="lg">
                  Espace vendeur
                </BoutonVerre>
              </div>
              <small>Merci de faire partie de l&apos;aventure — l&apos;équipe Novakou, l&apos;académie des créateurs digitaux.</small>
            </div>
          </div>
        </div>
      </section>
    </CoquePublique>
  );
}
