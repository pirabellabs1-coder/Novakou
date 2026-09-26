import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, BadgeCheck, FileLock2, Fingerprint, Lock, RefreshCcw, Server, Wallet, type LucideIcon } from "lucide-react";
import { CoquePublique } from "@/components/formations/public/CoquePublique";
import { EnTetePage } from "@/components/formations/public/EnTetePage";
import { BoutonVerre } from "@/components/formations/public/BoutonVerre";
import { Accordeon } from "@/components/formations/public/Accordeon";

export const metadata: Metadata = {
  title: "Confiance et sécurité",
  description:
    "Comment Novakou protège acheteurs et vendeurs : paiement séquestré (escrow), vérification d'identité (KYC), chiffrement, protection des contenus, gestion des litiges, lutte anti-fraude et conformité RGPD.",
  alternates: { canonical: "/confiance-securite" },
  openGraph: {
    title: "Confiance & sécurité — Novakou",
    description:
      "Paiement séquestré, KYC, chiffrement, protection acheteur/vendeur et gestion des litiges. La sécurité au cœur de Novakou.",
    url: "/confiance-securite",
    type: "website",
  },
};

const PILLARS: { Icon: LucideIcon; title: string; desc: string }[] = [
  { Icon: Wallet, title: "Paiement séquestré (escrow)", desc: "À chaque commande, les fonds sont sécurisés puis libérés au vendeur seulement une fois la vente confirmée. En cas de litige, ils sont gelés jusqu'au verdict." },
  { Icon: Fingerprint, title: "Vendeurs vérifiés (KYC)", desc: "Les vendeurs et mentors passent une vérification d'identité avant de publier des offres payantes et de retirer des fonds — un rempart contre la fraude." },
  { Icon: Lock, title: "Paiements chiffrés", desc: "Les paiements sont traités par nos prestataires agréés. Vos données bancaires ne transitent jamais en clair et Novakou n'a jamais accès à votre numéro de carte." },
  { Icon: RefreshCcw, title: "Protection de l'acheteur", desc: "Politique de remboursement claire, validation à la livraison et possibilité d'ouvrir un litige si la prestation n'est pas conforme." },
  { Icon: BadgeCheck, title: "Protection du vendeur", desc: "Vos gains sont sécurisés et versés sur votre solde, avec un délai de sécurité anti-fraude avant retrait vers Mobile Money ou virement." },
  { Icon: FileLock2, title: "Contenus protégés", desc: "Vidéos et documents sont hébergés de façon sécurisée et protégés contre le téléchargement et le partage non autorisé." },
];

const SECURITY_TECH: { Icon: LucideIcon; title: string; desc: string }[] = [
  { Icon: Server, title: "Hébergement UE", desc: "Base de données et fichiers hébergés dans l'Union européenne (Supabase, Francfort), avec contrôle d'accès par rôle (Row Level Security)." },
  { Icon: Lock, title: "Chiffrement", desc: "Données chiffrées en transit (TLS) et mots de passe hachés (bcrypt). Double authentification disponible sur votre compte." },
  { Icon: AlertTriangle, title: "Surveillance & anti-fraude", desc: "Journalisation des accès sensibles, alertes de connexion inhabituelle et détection des comportements frauduleux." },
];

const ESCROW: [string, string][] = [
  ["Le client paie", "Les fonds sont immédiatement sécurisés par la Plateforme — ni le vendeur ni l'acheteur ne peut les manipuler."],
  ["Le contenu est livré", "Le produit numérique est mis à disposition ou la séance de mentorat est réalisée."],
  ["La vente est confirmée", "Les fonds sont libérés sur le solde du vendeur, qui peut ensuite les retirer après le délai de sécurité."],
  ["En cas de litige", "Les fonds sont gelés jusqu'au verdict de notre équipe, rendu sur la base des preuves des deux parties."],
];

const FAQ = [
  { q: "Que se passe-t-il si je paie et ne reçois pas mon produit ?", a: "Le paiement est séquestré. Si la prestation n'est pas livrée ou n'est pas conforme, vous pouvez ouvrir un litige : les fonds restent gelés jusqu'à la résolution par notre équipe, sur la base des éléments fournis par les deux parties." },
  { q: "Mes informations bancaires sont-elles en sécurité ?", a: "Oui. Les paiements sont traités directement par nos prestataires certifiés. Novakou ne stocke jamais vos numéros de carte." },
  { q: "Comment savoir qu'un vendeur est fiable ?", a: "Les vendeurs qui vendent des contenus payants et retirent des fonds sont vérifiés (KYC). Vous pouvez aussi consulter les avis vérifiés laissés par de vrais acheteurs." },
  { q: "Mes contenus de formation peuvent-ils être piratés ?", a: "Nous appliquons des protections contre le téléchargement direct des vidéos et documents, et l'accès est réservé aux acheteurs authentifiés." },
];

export default function ConfianceSecuritePage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com";
  return (
    <CoquePublique>
      {/* JSON-LD : fil d'Ariane + FAQ (rich results + GEO). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Accueil", item: baseUrl },
                  { "@type": "ListItem", position: 2, name: "Confiance & sécurité", item: `${baseUrl}/confiance-securite` },
                ],
              },
              {
                "@type": "FAQPage",
                mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
              },
            ],
          }),
        }}
      />

      <EnTetePage
        eyebrow="Confiance & sécurité"
        titre={
          <>
            Achetez et vendez <em>en toute sérénité</em>
          </>
        }
        sousTitre="Paiement séquestré, vendeurs vérifiés, chiffrement et gestion des litiges : la sécurité est au cœur de chaque transaction sur Novakou."
        actions={
          <>
            <BoutonVerre href="/explorer" variante="primary" taille="lg" fleche>
              Explorer le catalogue
            </BoutonVerre>
            <BoutonVerre href="/contact" taille="lg">
              Signaler un problème
            </BoutonVerre>
          </>
        }
        meta={["Fonds séquestrés jusqu'à la confirmation", "Vendeurs vérifiés (KYC)", "Aucune donnée bancaire stockée"]}
      />

      {/* ── Piliers ── */}
      <section className="nkp-section nkp-section--tint !pt-14" aria-labelledby="piliers-titre">
        <div className="nkp-wrap">
          <h2 id="piliers-titre" className="sr-only">
            Nos six protections
          </h2>
          <div className="nkp-grid-3">
            {PILLARS.map((p) => (
              <article key={p.title} className="nkp-card nkp-card--hover nkp-reveal">
                <div className="nkp-card__core">
                  <span className="nkp-ic mb-4" aria-hidden="true">
                    <p.Icon strokeWidth={1.75} />
                  </span>
                  <h3>{p.title}</h3>
                  <p className="nkp-card__desc text-[.92rem]">{p.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Séquestre ── */}
      <section className="nkp-section" aria-labelledby="escrow-titre">
        <div className="nkp-wrap">
          <div className="nkp-duo nkp-duo--top">
            <div className="nkp-reveal">
              <span className="nkp-tag">Séquestre</span>
              <h2 id="escrow-titre">Comment le séquestre protège votre argent</h2>
              <p className="nkp-prose">À chaque commande, l'argent est mis de côté par la plateforme. Il ne rejoint le vendeur qu'une fois la vente confirmée — et reste gelé tant qu'un litige est ouvert.</p>
            </div>
            <ol className="list-none m-0 p-0 flex flex-col gap-4">
              {ESCROW.map(([t, d], i) => (
                <li key={t} className="nkp-card nkp-reveal">
                  <div className="nkp-card__core !flex-row items-start gap-4 !py-5">
                    <span className="nkp-av !rounded-full" aria-hidden="true">
                      {i + 1}
                    </span>
                    <div>
                      <b className="block font-semibold">{t}</b>
                      <p className="nkp-card__desc !mt-1 text-[.9rem]">{d}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ── Sécurité technique ── */}
      <section className="nkp-section nkp-section--tint" aria-labelledby="tech-titre">
        <div className="nkp-wrap">
          <div className="nkp-head nkp-head--center nkp-reveal">
            <span className="nkp-tag">Infrastructure</span>
            <h2 id="tech-titre">Une sécurité technique de bout en bout</h2>
          </div>
          <div className="nkp-grid-3">
            {SECURITY_TECH.map((s) => (
              <article key={s.title} className="nkp-card nkp-reveal">
                <div className="nkp-card__core items-center text-center">
                  <span className="nkp-ic mb-3" aria-hidden="true">
                    <s.Icon strokeWidth={1.75} />
                  </span>
                  <h3 className="!text-[1.05rem]">{s.title}</h3>
                  <p className="nkp-card__desc text-[.9rem]">{s.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="nkp-section" aria-labelledby="faq-titre">
        <div className="nkp-wrap">
          <div className="nkp-head nkp-head--center nkp-reveal">
            <span className="nkp-tag">Questions fréquentes</span>
            <h2 id="faq-titre">Vos questions sur la sécurité</h2>
          </div>
          <div className="nkp-reveal">
            <Accordeon items={FAQ} />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="nkp-section nkp-section--top0" aria-labelledby="cta-titre">
        <div className="nkp-wrap">
          <div className="nkp-bezel nkp-bezel--dark nkp-bezel--xl nkp-bezel--float nkp-reveal">
            <div className="nkp-cta">
              <span className="nkp-tag nkp-tag--dark">Support</span>
              <h2 id="cta-titre">Un doute, un problème à signaler ?</h2>
              <p>
                Notre équipe traite chaque signalement rapidement. Écrivez-nous à <strong className="text-white">support@novakou.com</strong>.
              </p>
              <div className="nkp-actions">
                <BoutonVerre href="/contact" variante="white" taille="lg" fleche>
                  Nous contacter
                </BoutonVerre>
                <BoutonVerre href="/confidentialite" variante="white" taille="lg">
                  Confidentialité (RGPD)
                </BoutonVerre>
              </div>
              <small>
                Voir aussi :{" "}
                <Link href="/cgu" className="underline underline-offset-2 hover:text-white">
                  CGU
                </Link>
                ,{" "}
                <Link href="/mentions-legales" className="underline underline-offset-2 hover:text-white">
                  mentions légales
                </Link>
                ,{" "}
                <Link href="/cookies" className="underline underline-offset-2 hover:text-white">
                  cookies
                </Link>
                .
              </small>
            </div>
          </div>
        </div>
      </section>
    </CoquePublique>
  );
}
