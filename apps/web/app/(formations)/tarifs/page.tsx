import Link from "next/link";
import { CalendarCheck, Globe, Headset, Shield, Sparkles, type LucideIcon } from "lucide-react";
import { CoquePublique } from "@/components/formations/public/CoquePublique";
import { EnTetePage } from "@/components/formations/public/EnTetePage";
import { BoutonVerre, Coche } from "@/components/formations/public/BoutonVerre";
import { Accordeon } from "@/components/formations/public/Accordeon";
import { SimulateurCommission } from "@/components/formations/public/SimulateurCommission";

/*
 * Page Tarifs — Server Component (métadonnées et FAQPage JSON-LD dans
 * layout.tsx). Un seul modèle : 10 % par vente, zéro abonnement. Le
 * simulateur est le seul îlot client.
 */

const INCLUDED_FEATURES = [
  {
    category: "Publication & vente",
    items: [
      "Publier des formations illimitées",
      "Vendre des produits numériques (ebooks, templates, packs)",
      "Proposer des séances de mentorat 1:1",
      "Hébergement illimité (vidéos, PDF, fichiers)",
      "Page de vente personnalisée par produit",
    ],
  },
  {
    category: "Paiements",
    items: [
      "Mobile Money (Orange, Wave, MTN, Moov) — 17 pays",
      "Cartes Visa / Mastercard partout dans le monde",
      "Virement bancaire SEPA",
      "Encaissement instantané dès la vente",
      "Retrait dès 48 h après la vente",
    ],
  },
  {
    category: "Outils créateurs",
    items: [
      "Dashboard temps réel (ventes, revenus, élèves)",
      "Codes promo & campagnes marketing",
      "Programme d'affiliation intégré",
      "Email automations et séquences",
      "Statistiques détaillées par produit",
    ],
  },
  {
    category: "Support & communauté",
    items: [
      "Support email sous 24 h",
      "Communauté de créateurs francophones",
      "Messagerie apprenant ↔ vendeur intégrée",
      "Certifications automatiques pour vos élèves",
      "Modération des avis et protection anti-fraude",
    ],
  },
];

const COMPETITORS: { name: string; commission: string; monthly: string; highlighted?: boolean }[] = [
  { name: "Novakou", commission: "10 %", monthly: "0 FCFA", highlighted: true },
  { name: "Gumroad", commission: "10 %", monthly: "0 FCFA" },
  { name: "Systeme.io", commission: "0 %", monthly: "~19 000 FCFA (~30 €)" },
  { name: "Hotmart", commission: "9,9 % + 1 €", monthly: "0 FCFA" },
  { name: "Podia", commission: "8 %", monthly: "~26 000 FCFA (~40 €)" },
  { name: "Thinkific", commission: "0 %", monthly: "~30 000 FCFA (~45 €)" },
];

const FAQS = [
  { q: "Comment Novakou gagne-t-il de l'argent si c'est gratuit ?", a: "La plateforme prélève une commission de 10 % sur chaque vente réalisée. C'est tout. Pas d'abonnement, pas de frais cachés, pas de paiement par mois. Vous payez seulement quand vous gagnez." },
  { q: "Y a-t-il des frais de transaction en plus des 10 % ?", a: "Non. Les 10 % incluent tous les frais : traitement des paiements Mobile Money, cartes bancaires, hébergement, emails transactionnels. Votre prestataire de paiement peut appliquer des frais séparés sur les retraits (ex. Orange Money retire ~1 % sur les retraits), mais ça ne dépend pas de nous." },
  { q: "Quand puis-je retirer mes gains ?", a: "Les fonds sont disponibles après 48 h pour protéger contre les fraudes. Vous pouvez ensuite retirer vers Orange Money, Wave, MTN MoMo, virement bancaire, ou PayPal. Pas de seuil minimum." },
  { q: "Y a-t-il des limites sur le nombre de produits ou d'élèves ?", a: "Non. Vous pouvez publier autant de formations, ebooks, templates ou services que vous voulez. Vous pouvez avoir un ou mille élèves, c'est le même prix : 10 % par vente." },
  { q: "Les 10 % s'appliquent-ils aussi aux séances de mentorat ?", a: "Oui, le modèle est uniforme : 10 % sur les formations, 10 % sur les produits numériques, 10 % sur les séances de mentorat. Le mentor garde 90 % de chaque séance." },
  { q: "Puis-je utiliser Novakou uniquement comme acheteur ?", a: "Bien sûr. Créer un compte apprenant est 100 % gratuit — vous ne payez que ce que vous achetez. Aucun abonnement obligatoire pour accéder au catalogue." },
  { q: "Comment fonctionne le programme d'affiliation ?", a: "Chaque utilisateur reçoit un lien unique. Quand quelqu'un achète via votre lien, vous recevez une commission d'affiliation définie par le vendeur (souvent 20-30 % du prix de vente). Les commissions sont automatiquement créditées après la période de sécurité." },
  { q: "Que se passe-t-il si un client demande un remboursement ?", a: "Les clients ont 14 jours pour demander un remboursement (si le contenu n'a pas été consommé à plus de 30 %). Dans ce cas, votre part et la commission de 10 % sont intégralement annulées — vous ne perdez rien." },
];

const GARANTIES: { Icon: LucideIcon; label: string; sub: string }[] = [
  { Icon: Shield, label: "Paiement sécurisé", sub: "SSL & 3D Secure" },
  { Icon: CalendarCheck, label: "Remboursement 14 j", sub: "Satisfait ou remboursé" },
  { Icon: Headset, label: "Support réactif", sub: "Réponse en 24 h max" },
  { Icon: Globe, label: "17 pays africains", sub: "+ international" },
];

type Plan = {
  nom: string;
  pour: string;
  prix: string;
  unite: string;
  note: string;
  inclus: string[];
  cta: string;
  href: string;
  /** Verbe de l'eyebrow : ce que ce profil vient faire sur Novakou. */
  verbe: string;
  reco?: boolean;
};

const PLANS: Plan[] = [
  {
    nom: "Apprenant",
    pour: "Pour acheter des formations, des produits et des séances de mentorat.",
    prix: "0",
    unite: "FCFA",
    note: "Compte gratuit. Vous ne payez que ce que vous achetez.",
    inclus: ["Accès à tout le catalogue", "Paiement Mobile Money & carte", "Certificats de fin de formation", "Messagerie avec le formateur"],
    cta: "Créer un compte",
    href: "/inscription",
    verbe: "Acheter",
  },
  {
    nom: "Créateur",
    pour: "Pour vendre vos formations, produits numériques et séances de mentorat.",
    prix: "10",
    unite: "% par vente",
    note: "Prélevés uniquement sur vos ventes réalisées. Zéro vente, zéro frais.",
    inclus: ["Boutique, formations et produits illimités", "Paiements Mobile Money & carte", "Assistant IA & hébergement vidéo inclus", "Tunnels, automatisations & certificats", "Retrait dès 48 h après la vente"],
    cta: "Créer ma boutique gratuitement",
    href: "/inscription?role=vendeur",
    verbe: "Vendre",
    reco: true,
  },
  {
    nom: "Affilié",
    pour: "Pour recommander des produits et toucher une commission sur chaque vente.",
    prix: "0",
    unite: "FCFA",
    note: "Aucun frais. Vous ne faites qu'encaisser vos commissions.",
    inclus: ["Lien unique et traçable", "Commission sur chaque vente référée", "Tableau de bord dédié", "Retrait Mobile Money dès 100 FCFA"],
    cta: "Devenir affilié",
    href: "/inscription?role=affilie",
    verbe: "Recommander",
  },
];

export default function TarifsPage() {
  return (
    <CoquePublique>
      <EnTetePage
        eyebrow="Aucun abonnement. Jamais."
        titre={
          <>
            <em>90 %</em> pour vous, 10 % pour la plateforme.
          </>
        }
        sousTitre="Publier, vendre, encaisser : tout est gratuit. Vous ne payez que quand vous gagnez. C'est le modèle le plus juste du marché francophone."
        actions={
          <>
            <BoutonVerre href="/inscription?role=vendeur" variante="primary" taille="lg" fleche>
              Créer ma boutique gratuitement
            </BoutonVerre>
            <BoutonVerre href="/explorer" taille="lg">
              Explorer le catalogue
            </BoutonVerre>
          </>
        }
        meta={["Zéro abonnement mensuel", "Aucuns frais d'installation", "Toutes les fonctionnalités incluses"]}
      />

      {/* ── Plans ── */}
      <section className="nkp-section nkp-section--tight pt-4" aria-labelledby="plans-titre">
        <div className="nkp-wrap">
          <h2 id="plans-titre" className="sr-only">
            Un tarif par profil
          </h2>
          <div className="nkp-plans">
            {PLANS.map((p) => (
              <article key={p.nom} className={`nkp-card nkp-plan nkp-reveal${p.reco ? " nkp-plan--reco" : ""}`} aria-labelledby={`plan-${p.nom}`}>
                {p.reco && <span className="nkp-plan__badge">Recommandé</span>}
                <div className="nkp-card__core">
                  <span className="nkp-eyebrow self-start">{p.verbe}</span>
                  <h3 id={`plan-${p.nom}`} className="nkp-plan__name">
                    {p.nom}
                  </h3>
                  <p className="nkp-plan__for">{p.pour}</p>
                  <div className="nkp-plan__price">
                    <span className="n">{p.prix}</span>
                    <span className="u">{p.unite}</span>
                  </div>
                  <p className="nkp-plan__note">{p.note}</p>
                  <ul className="nkp-list">
                    {p.inclus.map((i) => (
                      <li key={i}>
                        <Coche />
                        {i}
                      </li>
                    ))}
                  </ul>
                  <div className="nkp-card__foot">
                    <BoutonVerre href={p.href} variante={p.reco ? "primary" : "glass"} bloc fleche>
                      {p.cta}
                    </BoutonVerre>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Simulateur ── */}
      <section className="nkp-section" aria-labelledby="simulateur-titre">
        <div className="nkp-wrap">
          <div className="nkp-duo">
            <div className="nkp-reveal">
              <span className="nkp-tag">Simulateur</span>
              <h2 id="simulateur-titre">Combien gardez-vous sur chaque vente ?</h2>
              <p className="nkp-prose">
                Déplacez le curseur pour simuler votre revenu net par vente. Les 10 % incluent le traitement des paiements, l'hébergement, les emails, le support et toutes les fonctionnalités. Aucun abonnement mensuel, aucun frais caché.
              </p>
              <div className="mt-7">
                <BoutonVerre href="/inscription?role=vendeur" variante="primary" fleche>
                  Commencer à vendre
                </BoutonVerre>
              </div>
            </div>
            <div className="nkp-bezel nkp-bezel--float nkp-reveal">
              <SimulateurCommission />
            </div>
          </div>
        </div>
      </section>

      {/* ── Inclus ── */}
      <section className="nkp-section nkp-section--tint" aria-labelledby="inclus-titre">
        <div className="nkp-wrap">
          <div className="nkp-head nkp-head--center nkp-reveal">
            <span className="nkp-tag">Inclus gratuitement</span>
            <h2 id="inclus-titre">Tout ce dont vous avez besoin, offert.</h2>
            <p>Pas de version « premium » à débloquer. Chaque créateur a accès à 100 % de la plateforme dès son inscription.</p>
          </div>
          <div className="nkp-grid-2">
            {INCLUDED_FEATURES.map((c) => (
              <article key={c.category} className="nkp-card nkp-card--hover nkp-reveal">
                <div className="nkp-card__core">
                  <div className="nkp-feat__top">
                    <span className="nkp-ic" aria-hidden="true">
                      <Sparkles strokeWidth={1.75} />
                    </span>
                    <h3>{c.category}</h3>
                  </div>
                  <ul className="nkp-list">
                    {c.items.map((i) => (
                      <li key={i}>
                        <Coche />
                        <span className="text-[.94rem]">{i}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparatif ── */}
      <section className="nkp-section" aria-labelledby="comparatif-titre">
        <div className="nkp-wrap nkp-wrap--md">
          <div className="nkp-head nkp-head--center nkp-reveal">
            <span className="nkp-tag">Comparatif</span>
            <h2 id="comparatif-titre">Nous gardons moins. Vous gagnez plus.</h2>
          </div>
          <div className="nkp-bezel nkp-bezel--float nkp-reveal">
            <div className="nkp-core">
              <div className="nkp-scroll">
                <table className="nkp-table">
                  <thead>
                    <tr>
                      <th scope="col">Plateforme</th>
                      <th scope="col">Commission</th>
                      <th scope="col">Abonnement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPETITORS.map((c) => (
                      <tr key={c.name}>
                        <th scope="row" className={c.highlighted ? "!text-[#006e2f] !font-bold" : ""}>
                          {c.name}
                        </th>
                        <td className={c.highlighted ? "nova ok text-lg" : ""}>{c.commission}</td>
                        <td className={c.highlighted ? "nova ok" : "mid"}>{c.monthly}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <p className="nkp-table-note">Comparatif basé sur les informations publiques des plateformes au 15 avril 2026. À combiner parfois avec des frais bancaires.</p>
        </div>
      </section>

      {/* ── Garanties ── */}
      <section className="nkp-section nkp-section--tight nkp-section--tint" aria-label="Garanties">
        <div className="nkp-wrap">
          <div className="nkp-kpis nkp-kpis--band nkp-kpis--1col-sm">
            {GARANTIES.map((g) => (
              <div key={g.label} className="nkp-kpi nkp-reveal flex items-center gap-4">
                <span className="nkp-ic" aria-hidden="true">
                  <g.Icon strokeWidth={1.75} />
                </span>
                <div>
                  <b className="block text-[.95rem] font-semibold">{g.label}</b>
                  <p className="!mt-0.5">{g.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="nkp-section" aria-labelledby="faq-titre">
        <div className="nkp-wrap">
          <div className="nkp-head nkp-head--center nkp-reveal">
            <span className="nkp-tag">FAQ</span>
            <h2 id="faq-titre">Questions fréquentes</h2>
          </div>
          <div className="nkp-reveal">
            <Accordeon items={FAQS} ouvertParDefaut={0} />
          </div>
          <div className="nkp-center mt-12 nkp-reveal">
            <p className="text-[.95rem] text-[#5c6b62] mb-4">Vous avez d'autres questions ?</p>
            <BoutonVerre href="/contact" fleche>
              Contacter le support
            </BoutonVerre>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="nkp-section nkp-section--top0" aria-labelledby="cta-titre">
        <div className="nkp-wrap">
          <div className="nkp-bezel nkp-bezel--dark nkp-bezel--xl nkp-bezel--float nkp-reveal">
            <div className="nkp-cta">
              <span className="nkp-tag nkp-tag--dark">Modèle gagnant-gagnant</span>
              <h2 id="cta-titre">Prêt à lancer votre boutique ?</h2>
              <p>Aucune carte bancaire requise. Vous commencez à vendre en moins de 10 minutes.</p>
              <div className="nkp-actions">
                <BoutonVerre href="/inscription?role=vendeur" variante="white" taille="lg" fleche>
                  Créer ma boutique gratuitement
                </BoutonVerre>
              </div>
              <small>
                Une question sur les paiements ? Lisez la{" "}
                <Link href="/documentation-paiements" className="underline underline-offset-2 hover:text-white">
                  documentation des paiements
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
