import type { Metadata } from "next";
import {
  BarChart3,
  CheckCircle2,
  Lock,
  Megaphone,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique de cookies — Novakou",
  description:
    "Politique cookies de Novakou : qu'est-ce qu'un cookie, base légale et consentement, catégories (nécessaires, préférences, analytiques, marketing) avec durées, cookies tiers, et comment gérer vos préférences.",
  alternates: { canonical: "/cookies" },
};

const COOKIE_CATEGORIES = [
  {
    key: "essential",
    icon: Lock,
    color: "#006e2f",
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
    icon: SlidersHorizontal,
    color: "#2563eb",
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
    icon: BarChart3,
    color: "#f59e0b",
    title: "Analytiques",
    required: false,
    desc: "Mesurent l'audience de façon agrégée/pseudonymisée pour comprendre quelles pages fonctionnent et améliorer la Plateforme.",
    examples: [
      { name: "ph_* (PostHog)", purpose: "Mesure d'audience produit (pages vues, parcours)", duration: "13 mois" },
    ],
  },
  {
    key: "marketing",
    icon: Megaphone,
    color: "#dc2626",
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

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      {/* HERO */}
      <section className="pt-32 pb-12 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-[#006e2f] bg-[#006e2f]/10 px-3 py-1 rounded-full mb-4">
            Vie privée
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#191c1e] leading-tight tracking-tight">
            Politique de cookies
          </h1>
          <p className="text-base text-[#5c647a] mt-4">
            Dernière mise à jour : 12 juillet 2026 · Transparence totale sur ce qu&apos;on stocke et pourquoi.
          </p>
        </div>
      </section>

      {/* INTRO */}
      <section className="px-6 mb-12">
        <div className="max-w-3xl mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-6 md:p-8">
          <h2 className="text-lg font-extrabold text-[#191c1e] mb-3">En bref</h2>
          <ul className="space-y-2 text-sm text-[#5c647a] leading-relaxed">
            <li className="flex items-start gap-2">
              <CheckCircle2 size={18} className="text-[#006e2f] mt-0.5 flex-shrink-0" />
              Nous utilisons uniquement les cookies nécessaires + ceux que vous acceptez.
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={18} className="text-[#006e2f] mt-0.5 flex-shrink-0" />
              Aucun cookie tiers à des fins publicitaires sans consentement explicite.
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={18} className="text-[#006e2f] mt-0.5 flex-shrink-0" />
              Vous pouvez modifier vos préférences à tout moment depuis vos paramètres.
            </li>
          </ul>
        </div>
      </section>

      {/* EXPLICATION + BASE LÉGALE */}
      <section className="px-6 mb-12">
        <div className="max-w-3xl mx-auto space-y-6 text-sm text-[#5c647a] leading-relaxed">
          <div>
            <h2 className="text-lg font-extrabold text-[#191c1e] mb-2">Qu&apos;est-ce qu&apos;un cookie ?</h2>
            <p>
              Un cookie est un petit fichier déposé sur votre appareil lorsque vous visitez un site. Il permet de
              reconnaître votre navigateur, de mémoriser des informations (session, préférences) ou de mesurer l&apos;audience.
              On distingue les cookies <strong>internes</strong> (déposés par Novakou) et <strong>tiers</strong> (déposés par
              des partenaires), ainsi que les cookies de <strong>session</strong> (effacés à la fermeture du navigateur) et
              <strong> persistants</strong> (conservés pendant une durée définie). Nous utilisons également des technologies
              similaires (stockage local, pixels).
            </p>
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-[#191c1e] mb-2">Base légale et consentement</h2>
            <p>
              Les cookies <strong>strictement nécessaires</strong> reposent sur notre intérêt légitime à fournir un service
              fonctionnel et sûr ; ils ne requièrent pas votre consentement. Tous les autres cookies (préférences,
              analytiques, marketing) ne sont déposés qu&apos;après votre <strong>consentement</strong>, recueilli via notre
              bandeau à votre arrivée. Votre choix est conservé et vous est redemandé au plus tard tous les <strong>13 mois</strong>.
              Vous pouvez le modifier ou le retirer à tout moment, sans que cela n&apos;affecte la licéité du traitement
              antérieur.
            </p>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="px-6 mb-16">
        <div className="max-w-4xl mx-auto space-y-6">
          {COOKIE_CATEGORIES.map((cat) => (
            <div key={cat.key} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${cat.color}15` }}>
                      {(()=>{const _I=cat.icon;return _I?<_I size={22} />:null;})()}
                    </div>
                    <div>
                      <h2 className="text-lg font-extrabold text-[#191c1e]">{cat.title}</h2>
                      <p className="text-sm text-[#5c647a] mt-1 leading-relaxed">{cat.desc}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full whitespace-nowrap ${
                    cat.required ? "bg-[#006e2f] text-white" : "bg-slate-100 text-[#5c647a]"
                  }`}>
                    {cat.required ? "Obligatoires" : "Optionnels"}
                  </span>
                </div>
              </div>
              <div className="bg-slate-50 px-6 py-4">
                <p className="text-[10px] font-bold text-[#5c647a] uppercase tracking-wider mb-3">Cookies utilisés</p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[#5c647a] text-left">
                      <th className="py-1.5 pr-3 font-semibold">Nom</th>
                      <th className="py-1.5 pr-3 font-semibold">Finalité</th>
                      <th className="py-1.5 font-semibold">Durée</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cat.examples.map((c) => (
                      <tr key={c.name} className="border-t border-slate-200">
                        <td className="py-2 pr-3 tabular-nums text-[#191c1e]">{c.name}</td>
                        <td className="py-2 pr-3 text-[#5c647a]">{c.purpose}</td>
                        <td className="py-2 text-[#5c647a]">{c.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* GÉRER + DROITS */}
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto bg-slate-50 rounded-2xl p-8">
          <h2 className="text-xl font-extrabold text-[#191c1e] mb-4">Gérer vos cookies &amp; vos droits</h2>
          <div className="space-y-3 text-sm text-[#5c647a] leading-relaxed">
            <p>Conformément au RGPD et aux législations équivalentes, vous pouvez à tout moment :</p>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong className="text-[#191c1e]">Modifier ou retirer votre consentement</strong> aux cookies non essentiels via le bandeau ou les paramètres.</li>
              <li><strong className="text-[#191c1e]">Configurer votre navigateur</strong> pour bloquer ou supprimer les cookies. La désactivation des cookies essentiels peut toutefois dégrader le fonctionnement du site.</li>
              <li>Exercer vos droits d&apos;<strong className="text-[#191c1e]">accès, de rectification, d&apos;effacement, d&apos;opposition et de portabilité</strong> (voir notre <Link href="/confidentialite" className="text-[#006e2f] font-semibold underline">politique de confidentialité</Link>).</li>
            </ul>
            <p className="pt-1">
              Réglages par navigateur :{" "}
              <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-[#006e2f] underline">Chrome</a>,{" "}
              <a href="https://support.mozilla.org/fr/kb/cookies-informations-sites-enregistrent" target="_blank" rel="noopener noreferrer" className="text-[#006e2f] underline">Firefox</a>,{" "}
              <a href="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-[#006e2f] underline">Safari</a>,{" "}
              <a href="https://support.microsoft.com/fr-fr/windows/supprimer-et-g%C3%A9rer-les-cookies-168dab11-0753-043d-7c16-ede5947fc64d" target="_blank" rel="noopener noreferrer" className="text-[#006e2f] underline">Edge</a>.
            </p>
            <p>
              <strong className="text-[#191c1e]">Cookies tiers</strong> : les cookies analytiques et marketing peuvent être
              déposés par des partenaires (Meta, TikTok, Google, PostHog) qui appliquent leurs propres politiques de
              confidentialité.
            </p>
            <p className="pt-2">
              Pour toute question : <Link href="/contact" className="text-[#006e2f] font-semibold underline">contactez-nous</Link> ·
              {" "}<Link href="/mentions-legales" className="text-[#006e2f] font-semibold underline">mentions légales</Link>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
