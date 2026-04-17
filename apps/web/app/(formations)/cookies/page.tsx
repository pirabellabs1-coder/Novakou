import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique de cookies · Novakou",
  description: "Comment Novakou utilise les cookies pour améliorer votre expérience. Détails par catégorie et droits utilisateurs.",
};

const COOKIE_CATEGORIES = [
  {
    key: "essential",
    icon: "lock",
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
    icon: "tune",
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
    icon: "analytics",
    color: "#f59e0b",
    title: "Analytiques",
    required: false,
    desc: "Mesurent l'audience anonyme pour comprendre quelles pages fonctionnent. Aucune donnée personnelle.",
    examples: [
      { name: "_ga, _gid", purpose: "Google Analytics — statistiques agrégées", duration: "2 ans / 24h" },
    ],
  },
  {
    key: "marketing",
    icon: "campaign",
    color: "#dc2626",
    title: "Marketing & publicité",
    required: false,
    desc: "Permettent de personnaliser les publicités sur d'autres sites en fonction de vos centres d'intérêt.",
    examples: [
      { name: "_fbp", purpose: "Pixel Facebook (mesure des conversions)", duration: "3 mois" },
      { name: "ttp", purpose: "Pixel TikTok", duration: "13 mois" },
    ],
  },
];

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Manrope', sans-serif" }}>
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
            Dernière mise à jour : 15 avril 2026 · Transparence totale sur ce qu&apos;on stocke et pourquoi.
          </p>
        </div>
      </section>

      {/* INTRO */}
      <section className="px-6 mb-12">
        <div className="max-w-3xl mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-6 md:p-8">
          <h2 className="text-lg font-extrabold text-[#191c1e] mb-3">En bref</h2>
          <ul className="space-y-2 text-sm text-[#5c647a] leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#006e2f] mt-0.5 flex-shrink-0">check_circle</span>
              Nous utilisons uniquement les cookies nécessaires + ceux que vous acceptez.
            </li>
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#006e2f] mt-0.5 flex-shrink-0">check_circle</span>
              Aucun cookie tiers à des fins publicitaires sans consentement explicite.
            </li>
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#006e2f] mt-0.5 flex-shrink-0">check_circle</span>
              Vous pouvez modifier vos préférences à tout moment depuis vos paramètres.
            </li>
          </ul>
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
                      <span className="material-symbols-outlined text-[22px]" style={{ color: cat.color, fontVariationSettings: "'FILL' 1" }}>{cat.icon}</span>
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

      {/* DROITS */}
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto bg-slate-50 rounded-2xl p-8">
          <h2 className="text-xl font-extrabold text-[#191c1e] mb-4">Vos droits</h2>
          <div className="space-y-3 text-sm text-[#5c647a] leading-relaxed">
            <p>Conformément au Règlement Général sur la Protection des Données (RGPD) et aux législations équivalentes :</p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Vous pouvez à tout moment <strong className="text-[#191c1e]">retirer votre consentement</strong> aux cookies non essentiels.</li>
              <li>Vous pouvez configurer votre navigateur pour <strong className="text-[#191c1e]">bloquer ou supprimer les cookies</strong>.</li>
              <li>Vous avez le droit d&apos;<strong className="text-[#191c1e]">accès, de rectification, d&apos;effacement</strong> de vos données.</li>
            </ul>
            <p className="pt-3">Pour exercer vos droits ou poser une question : <Link href="/contact" className="text-[#006e2f] font-semibold underline">contactez-nous</Link>.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
