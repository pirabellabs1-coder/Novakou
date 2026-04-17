"use client";

import Link from "next/link";
import { useState } from "react";

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
      "Retrait dès 48h après la vente",
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
      "Support email sous 24h",
      "Communauté de créateurs francophones",
      "Messagerie apprenant ↔ vendeur intégrée",
      "Certifications automatiques pour vos élèves",
      "Modération des avis et protection anti-fraude",
    ],
  },
];

const COMPETITORS = [
  { name: "Novakou", commission: "5%", monthly: "0 FCFA", highlighted: true },
  { name: "Gumroad", commission: "10%", monthly: "0 FCFA" },
  { name: "Systeme.io", commission: "0%", monthly: "~19 000 FCFA (~30 €)" },
  { name: "Hotmart", commission: "9,9% + 1€", monthly: "0 FCFA" },
  { name: "Podia", commission: "8%", monthly: "~26 000 FCFA (~40 €)" },
  { name: "Thinkific", commission: "0%", monthly: "~30 000 FCFA (~45 €)" },
];

const FAQS = [
  {
    q: "Comment Novakou gagne-t-il de l'argent si c'est gratuit ?",
    a: "La plateforme prélève une commission de 5 % sur chaque vente réalisée. C'est tout. Pas d'abonnement, pas de frais cachés, pas de paiement par mois. Vous payez seulement quand vous gagnez.",
  },
  {
    q: "Y a-t-il des frais de transaction en plus des 5 % ?",
    a: "Non. Les 5 % incluent tous les frais : traitement des paiements Mobile Money, cartes bancaires, hébergement, emails transactionnels. Votre prestataire de paiement peut appliquer des frais séparés sur les retraits (ex. Orange Money retire ~1 % sur les retraits), mais ça ne dépend pas de nous.",
  },
  {
    q: "Quand puis-je retirer mes gains ?",
    a: "Les fonds sont disponibles après 48h pour protéger contre les fraudes. Vous pouvez ensuite retirer vers Orange Money, Wave, MTN MoMo, virement bancaire, ou PayPal. Pas de seuil minimum.",
  },
  {
    q: "Y a-t-il des limites sur le nombre de produits ou d'élèves ?",
    a: "Non. Vous pouvez publier autant de formations, ebooks, templates ou services que vous voulez. Vous pouvez avoir un ou mille élèves, c'est le même prix : 5 % par vente.",
  },
  {
    q: "Les 5 % s'appliquent-ils aussi aux séances de mentorat ?",
    a: "Oui, le modèle est uniforme : 5 % sur les formations, 5 % sur les produits numériques, 5 % sur les séances de mentorat. Le mentor garde 95 % de chaque séance.",
  },
  {
    q: "Puis-je utiliser Novakou uniquement comme acheteur ?",
    a: "Bien sûr. Créer un compte apprenant est 100 % gratuit — vous ne payez que ce que vous achetez. Aucun abonnement obligatoire pour accéder au catalogue.",
  },
  {
    q: "Comment fonctionne le programme d'affiliation ?",
    a: "Chaque utilisateur reçoit un lien unique. Quand quelqu'un achète via votre lien, vous recevez une commission d'affiliation définie par le vendeur (souvent 20-30 % du prix de vente). Les commissions sont automatiquement créditées après la période de sécurité.",
  },
  {
    q: "Que se passe-t-il si un client demande un remboursement ?",
    a: "Les clients ont 14 jours pour demander un remboursement (si le contenu n'a pas été consommé à plus de 30 %). Dans ce cas, votre part et la commission de 5 % sont intégralement annulées — vous ne perdez rien.",
  },
];

function formatFCFA(n: number) {
  return n.toLocaleString("fr-FR");
}

export default function TarifsPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [simulatedSale, setSimulatedSale] = useState(50000);

  const commission = Math.round(simulatedSale * 0.05);
  const vendorShare = simulatedSale - commission;

  return (
    <div className="min-h-screen bg-[#f7f9fb]" style={{ fontFamily: "'Manrope', sans-serif" }}>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section
        className="relative py-20 px-4 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #003d1a 0%, #006e2f 50%, #22c55e 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute bottom-0 -left-16 w-72 h-72 rounded-full bg-white/5" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/15 text-white text-sm font-semibold px-4 py-2 rounded-full mb-5 border border-white/20">
            <span
              className="material-symbols-outlined text-[16px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              verified
            </span>
            Aucun abonnement. Jamais.
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight mb-5">
            <span className="text-[#22c55e]">95 %</span> pour vous,
            <br />
            <span className="text-white/80">5 %</span> pour la plateforme.
          </h1>
          <p className="text-white/85 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            Publier, vendre, encaisser : tout est gratuit. Vous ne payez que quand vous gagnez.
            C&apos;est le modèle le plus juste du marché francophone.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/formations/inscription?role=vendeur"
              className="inline-flex items-center justify-center gap-2 bg-white text-[#006e2f] font-bold px-8 py-3.5 rounded-2xl text-sm shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
            >
              <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
              Créer ma boutique gratuitement
            </Link>
            <Link
              href="/formations/explorer"
              className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-semibold px-8 py-3.5 rounded-2xl text-sm hover:bg-white/20 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">explore</span>
              Explorer le catalogue
            </Link>
          </div>
        </div>
      </section>

      {/* ── Revenue simulator ─────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 md:px-8 py-14">
        <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-10 shadow-sm">
          <div className="text-center mb-8">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#006e2f] mb-2">
              Simulateur
            </p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#191c1e] tracking-tight mb-2">
              Combien gardez-vous sur chaque vente ?
            </h2>
            <p className="text-[#5c647a] text-sm">
              Déplacez le curseur pour simuler votre revenu net par vente.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-[#5c647a]">Prix de vente</label>
                <p className="text-2xl font-extrabold text-[#191c1e]">
                  {formatFCFA(simulatedSale)}{" "}
                  <span className="text-sm font-bold text-[#5c647a]">FCFA</span>
                </p>
              </div>
              <input
                type="range"
                min={5000}
                max={500000}
                step={5000}
                value={simulatedSale}
                onChange={(e) => setSimulatedSale(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-[#006e2f]"
              />
              <div className="flex justify-between text-[10px] text-[#5c647a] mt-1">
                <span>5 000 F</span>
                <span>500 000 F</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#006e2f]/5 border border-[#006e2f]/20 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="material-symbols-outlined text-[#006e2f] text-[18px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    account_balance_wallet
                  </span>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#006e2f]">
                    Votre revenu net
                  </p>
                </div>
                <p className="text-2xl md:text-3xl font-extrabold text-[#006e2f]">
                  {formatFCFA(vendorShare)}
                </p>
                <p className="text-xs text-[#5c647a] mt-1">
                  FCFA · ≈ {Math.round(vendorShare / 655.957)} €
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-[#5c647a] text-[18px]">percent</span>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#5c647a]">
                    Commission plateforme
                  </p>
                </div>
                <p className="text-2xl md:text-3xl font-extrabold text-[#5c647a]">
                  {formatFCFA(commission)}
                </p>
                <p className="text-xs text-[#5c647a] mt-1">FCFA · 5% fixe</p>
              </div>
            </div>

            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-600 text-[20px] flex-shrink-0">
                lightbulb
              </span>
              <p className="text-xs text-amber-900">
                <strong>Pas de frais cachés.</strong> Les 5 % incluent le traitement des paiements, l&apos;hébergement, les emails, le support et toutes les fonctionnalités. Aucun abonnement mensuel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── What's included ───────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-14">
        <div className="text-center mb-10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#006e2f] mb-2">
            Inclus gratuitement
          </p>
          <h2 className="text-2xl md:text-4xl font-extrabold text-[#191c1e] tracking-tight mb-3">
            Tout ce dont vous avez besoin, offert.
          </h2>
          <p className="text-[#5c647a] text-sm md:text-base max-w-2xl mx-auto">
            Pas de version « premium » à débloquer. Chaque créateur a accès à 100 % de la plateforme dès son inscription.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {INCLUDED_FEATURES.map((category) => (
            <div
              key={category.category}
              className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-[#006e2f]/30 transition-colors"
            >
              <h3 className="text-sm font-extrabold text-[#191c1e] mb-4 flex items-center gap-2">
                <span
                  className="material-symbols-outlined text-[#006e2f] text-[20px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
                {category.category}
              </h3>
              <ul className="space-y-2.5">
                {category.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[#006e2f] text-[16px] mt-0.5 flex-shrink-0">
                      done
                    </span>
                    <span className="text-sm text-[#5c647a] leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── Comparison ─────────────────────────────────────────────── */}
      <section className="bg-white border-y border-gray-100 py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#006e2f] mb-2">
              Comparatif
            </p>
            <h2 className="text-2xl md:text-4xl font-extrabold text-[#191c1e] tracking-tight">
              Nous gardons moins. Vous gagnez plus.
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-bold text-[#191c1e]">Plateforme</th>
                  <th className="text-center py-3 px-4 font-bold text-[#191c1e]">Commission</th>
                  <th className="text-center py-3 px-4 font-bold text-[#191c1e]">Abonnement</th>
                </tr>
              </thead>
              <tbody>
                {COMPETITORS.map((c) => (
                  <tr
                    key={c.name}
                    className={`border-b border-gray-100 ${
                      c.highlighted ? "bg-[#006e2f]/5" : ""
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {c.highlighted && (
                          <span
                            className="material-symbols-outlined text-[#006e2f] text-[18px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            stars
                          </span>
                        )}
                        <span
                          className={`${
                            c.highlighted ? "font-extrabold text-[#006e2f]" : "font-semibold text-[#191c1e]"
                          }`}
                        >
                          {c.name}
                        </span>
                      </div>
                    </td>
                    <td
                      className={`text-center py-3 px-4 font-bold ${
                        c.highlighted ? "text-[#006e2f] text-lg" : "text-[#5c647a]"
                      }`}
                    >
                      {c.commission}
                    </td>
                    <td className="text-center py-3 px-4 text-[#5c647a]">{c.monthly}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-[#5c647a] text-center mt-4 italic">
            Comparatif basé sur les informations publiques des plateformes au 15 avril 2026. À combiner parfois avec des frais bancaires.
          </p>
        </div>
      </section>

      {/* ── Trust badges ───────────────────────────────────────────── */}
      <section className="bg-[#f7f9fb] py-12 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: "shield", label: "Paiement sécurisé", sub: "SSL & 3D Secure" },
            { icon: "event_available", label: "Remboursement 14j", sub: "Satisfait ou remboursé" },
            { icon: "support_agent", label: "Support réactif", sub: "Réponse en 24h max" },
            { icon: "language", label: "17 pays africains", sub: "+ international" },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center text-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-[#006e2f]/10 flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-[#006e2f] text-[22px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {item.icon}
                </span>
              </div>
              <p className="font-bold text-[#191c1e] text-sm">{item.label}</p>
              <p className="text-xs text-[#5c647a]">{item.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 md:px-8 py-16">
        <div className="text-center mb-10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#006e2f] mb-2">FAQ</p>
          <h2 className="text-2xl md:text-4xl font-extrabold text-[#191c1e] tracking-tight">
            Questions fréquentes
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-[#f7f9fb] transition-colors"
              >
                <span className="font-semibold text-[#191c1e] text-sm pr-4">{faq.q}</span>
                <span
                  className="material-symbols-outlined text-[#5c647a] text-[20px] flex-shrink-0 transition-transform duration-200"
                  style={{ transform: openFaq === i ? "rotate(180deg)" : "rotate(0deg)" }}
                >
                  expand_more
                </span>
              </button>
              {openFaq === i && (
                <div className="px-6 pb-5 pt-0">
                  <p className="text-sm text-[#5c647a] leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-[#5c647a] mb-4">Vous avez d&apos;autres questions ?</p>
          <Link
            href="/formations/contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-[#006e2f] text-[#006e2f] font-bold text-sm hover:bg-[#006e2f] hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">chat</span>
            Contacter le support
          </Link>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────── */}
      <section
        className="py-16 px-4 text-center"
        style={{ background: "linear-gradient(135deg, #003d1a 0%, #006e2f 50%, #22c55e 100%)" }}
      >
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight mb-4">
            Prêt à lancer votre boutique ?
          </h2>
          <p className="text-white/80 text-sm md:text-base mb-8">
            Aucune carte bancaire requise. Vous commencez à vendre en moins de 10 minutes.
          </p>
          <Link
            href="/formations/inscription?role=vendeur"
            className="inline-flex items-center justify-center gap-2 bg-white text-[#006e2f] font-bold px-8 py-3.5 rounded-2xl text-sm shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
          >
            <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
            Créer ma boutique gratuitement
          </Link>
        </div>
      </section>
    </div>
  );
}
