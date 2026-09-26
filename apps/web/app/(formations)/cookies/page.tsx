import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { DocumentLegal, type SectionLegale } from "@/components/formations/public/article/DocumentLegal";

export const metadata: Metadata = {
  title: "Politique de cookies",
  description:
    "Politique cookies de Novakou : qu'est-ce qu'un cookie, base légale et consentement, catégories (nécessaires, préférences, analytiques, marketing) avec durées, cookies tiers, et comment gérer vos préférences.",
  alternates: { canonical: "/cookies" },
};

const COOKIE_CATEGORIES = [
  {
    key: "essential",
    title: "Strictement nécessaires",
    required: true,
    desc: "Indispensables au fonctionnement du site (authentification, panier, sécurité). Vous ne pouvez pas les désactiver.",
    examples: [
      { name: "next-auth.session-token", purpose: "Maintenir votre session connectée", duration: "30 jours" },
      { name: "csrf-token", purpose: "Protection contre les attaques CSRF", duration: "Session" },
      { name: "cart_id", purpose: "Identifier votre panier d'achat", duration: "7 jours" },
    ],
  },
  {
    key: "preferences",
    title: "Préférences",
    required: false,
    desc: "Mémorisent vos choix (devise, langue, thème) pour une expérience personnalisée.",
    examples: [
      { name: "currency", purpose: "Devise affichée (FCFA, EUR, USD)", duration: "1 an" },
      { name: "locale", purpose: "Langue d'affichage", duration: "1 an" },
    ],
  },
  {
    key: "analytics",
    title: "Analytiques",
    required: false,
    desc: "Mesurent l'audience de façon agrégée/pseudonymisée pour comprendre quelles pages fonctionnent et améliorer la Plateforme.",
    examples: [
      { name: "ph_* (PostHog)", purpose: "Mesure d'audience produit (pages vues, parcours)", duration: "13 mois" },
    ],
  },
  {
    key: "marketing",
    title: "Marketing & publicité",
    required: false,
    desc: "Permettent de mesurer les conversions et de personnaliser les publicités sur d'autres sites. Certains sont déposés par les vendeurs (pixels de leur boutique) et par des tiers, qui appliquent leurs propres politiques.",
    examples: [
      { name: "_fbp", purpose: "Pixel Meta/Facebook (mesure des conversions)", duration: "3 mois" },
      { name: "ttp", purpose: "Pixel TikTok", duration: "13 mois" },
      { name: "_ga", purpose: "Google (mesure/pub, selon intégration vendeur)", duration: "13 mois" },
    ],
  },
];

/* Une section par catégorie : description, puis le tableau des cookies. */
const SECTIONS_CATEGORIES: SectionLegale[] = COOKIE_CATEGORIES.map((cat) => ({
  id: `cookies-${cat.key}`,
  titre: cat.title,
  badge: <span className={`nka-badge${cat.required ? " nka-badge--on" : ""}`}>{cat.required ? "Obligatoires" : "Optionnels"}</span>,
  contenu: (
    <>
      <p>{cat.desc}</p>
      <div className="nka-table-wrap">
        <table className="nka-table nka-table--cookies">
          <caption className="nka-table__cap">Cookies utilisés</caption>
          <thead>
            <tr>
              <th scope="col">Nom</th>
              <th scope="col">Finalité</th>
              <th scope="col">Durée</th>
            </tr>
          </thead>
          <tbody>
            {cat.examples.map((c) => (
              <tr key={c.name}>
                <td>
                  <code>{c.name}</code>
                </td>
                <td>{c.purpose}</td>
                <td>{c.duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  ),
}));

export default function CookiesPage() {
  return (
    <DocumentLegal
      chemin="/cookies"
      eyebrow="Vie privée"
      titre="Politique de cookies"
      miseAJour="12 juillet 2026"
      sousTitre="Transparence totale sur ce qu'on stocke et pourquoi."
      avant={
        <aside className="nka-bref" aria-labelledby="cookies-bref">
          <h2 id="cookies-bref">En bref</h2>
          <ul>
            <li>
              <CheckCircle2 strokeWidth={1.9} aria-hidden="true" />
              Nous utilisons uniquement les cookies nécessaires + ceux que vous acceptez.
            </li>
            <li>
              <CheckCircle2 strokeWidth={1.9} aria-hidden="true" />
              Aucun cookie tiers à des fins publicitaires sans consentement explicite.
            </li>
            <li>
              <CheckCircle2 strokeWidth={1.9} aria-hidden="true" />
              Vous pouvez modifier vos préférences à tout moment depuis vos paramètres.
            </li>
          </ul>
        </aside>
      }
      sections={[
        {
          id: "cookie-definition",
          titre: "Qu'est-ce qu'un cookie ?",
          contenu: (
            <p>
              Un cookie est un petit fichier déposé sur votre appareil lorsque vous visitez un site. Il permet de
              reconnaître votre navigateur, de mémoriser des informations (session, préférences) ou de mesurer l&apos;audience.
              On distingue les cookies <strong>internes</strong> (déposés par Novakou) et <strong>tiers</strong> (déposés par
              des partenaires), ainsi que les cookies de <strong>session</strong> (effacés à la fermeture du navigateur) et
              <strong> persistants</strong> (conservés pendant une durée définie). Nous utilisons également des technologies
              similaires (stockage local, pixels).
            </p>
          ),
        },
        {
          id: "base-legale",
          titre: "Base légale et consentement",
          contenu: (
            <p>
              Les cookies <strong>strictement nécessaires</strong> reposent sur notre intérêt légitime à fournir un service
              fonctionnel et sûr ; ils ne requièrent pas votre consentement. Tous les autres cookies (préférences,
              analytiques, marketing) ne sont déposés qu&apos;après votre <strong>consentement</strong>, recueilli via notre
              bandeau à votre arrivée. Votre choix est conservé et vous est redemandé au plus tard tous les <strong>13 mois</strong>.
              Vous pouvez le modifier ou le retirer à tout moment, sans que cela n&apos;affecte la licéité du traitement
              antérieur.
            </p>
          ),
        },
        ...SECTIONS_CATEGORIES,
        {
          id: "gerer",
          titre: "Gérer vos cookies & vos droits",
          contenu: (
            <>
              <p>Conformément au RGPD et aux législations équivalentes, vous pouvez à tout moment :</p>
              <ul>
                <li><strong>Modifier ou retirer votre consentement</strong> aux cookies non essentiels via le bandeau ou les paramètres.</li>
                <li><strong>Configurer votre navigateur</strong> pour bloquer ou supprimer les cookies. La désactivation des cookies essentiels peut toutefois dégrader le fonctionnement du site.</li>
                <li>Exercer vos droits d&apos;<strong>accès, de rectification, d&apos;effacement, d&apos;opposition et de portabilité</strong> (voir notre <Link href="/confidentialite">politique de confidentialité</Link>).</li>
              </ul>
              <p>
                Réglages par navigateur :{" "}
                <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Chrome</a>,{" "}
                <a href="https://support.mozilla.org/fr/kb/cookies-informations-sites-enregistrent" target="_blank" rel="noopener noreferrer">Firefox</a>,{" "}
                <a href="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a>,{" "}
                <a href="https://support.microsoft.com/fr-fr/windows/supprimer-et-g%C3%A9rer-les-cookies-168dab11-0753-043d-7c16-ede5947fc64d" target="_blank" rel="noopener noreferrer">Edge</a>.
              </p>
              <p>
                <strong>Cookies tiers</strong> : les cookies analytiques et marketing peuvent être
                déposés par des partenaires (Meta, TikTok, Google, PostHog) qui appliquent leurs propres politiques de
                confidentialité.
              </p>
            </>
          ),
        },
      ]}
      pied={
        <p>
          Pour toute question : <Link href="/contact">contactez-nous</Link> ·
          {" "}<Link href="/mentions-legales">mentions légales</Link>.
        </p>
      }
    />
  );
}
