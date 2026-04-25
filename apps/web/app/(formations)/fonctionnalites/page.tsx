import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Fonctionnalités | Novakou — Tout ce dont vous avez besoin pour vendre en ligne",
  description:
    "Boutique, tunnels de vente, paiements Mobile Money, assistant IA, hébergement vidéo, certificats, automatisations, affiliation. Découvrez toutes les fonctionnalités de Novakou.",
};

const S = {
  fontFamily: "'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
} as const;
const SH = { ...S, fontWeight: 700, letterSpacing: "-0.04em" } as const;
const C = { primary: "#006e2f", accent: "#22c55e", dark: "#191c1e", muted: "#5c647a", surface: "#f6fbf2" } as const;

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-[0.12em] uppercase mb-4" style={{ ...S, backgroundColor: "#e5eae1", color: C.dark }}>{children}</span>;
}

const SECTIONS: Array<{
  id: string; pill: string; title: string; desc: string; icon: string; color: string;
  features: Array<{ icon: string; title: string; text: string }>;
  visual: "left" | "right";
}> = [
  {
    id: "boutique", pill: "Vendre", title: "Votre boutique en ligne en 3 minutes", icon: "storefront", color: C.primary,
    desc: "Publiez vos formations, ebooks, templates et coachings. Votre vitrine professionnelle avec page de vente, catégories et recherche intégrée.",
    features: [
      { icon: "palette", title: "Design personnalisable", text: "Couleurs, polices, logo — votre marque, pas la nôtre. Chaque page est unique." },
      { icon: "devices", title: "100% responsive", text: "Parfait sur mobile, tablette et desktop. Vos clients achètent depuis n'importe quel appareil." },
      { icon: "search", title: "SEO intégré", text: "Meta tags, URLs propres, sitemap automatique. Google vous trouve naturellement." },
      { icon: "category", title: "Catégories & filtres", text: "Organisez votre catalogue. Vos clients trouvent ce qu'ils cherchent en 2 clics." },
    ],
    visual: "right",
  },
  {
    id: "funnels", pill: "Convertir", title: "Tunnels de vente qui convertissent", icon: "account_tree", color: "#7c3aed",
    desc: "Un builder visuel drag-and-drop avec 30+ types de blocs, templates prêts à l'emploi, et génération par IA. Plus puissant que Systeme.io.",
    features: [
      { icon: "drag_indicator", title: "Drag-and-drop", text: "Glissez, déposez, réorganisez vos blocs. Aucune compétence technique requise." },
      { icon: "auto_awesome", title: "Génération IA", text: "Décrivez votre produit, Claude génère un tunnel complet en 30 secondes." },
      { icon: "timer", title: "Countdown & urgence", text: "Compteurs par visiteur, rareté, alertes — tous les leviers psychologiques." },
      { icon: "compare", title: "Tableaux comparatifs", text: "Montrez pourquoi vous êtes le meilleur choix avec des blocs de comparaison." },
    ],
    visual: "left",
  },
  {
    id: "paiements", pill: "Encaisser", title: "Tous les moyens de paiement africains", icon: "account_balance_wallet", color: "#f59e0b",
    desc: "Orange Money, Wave, MTN MoMo, cartes Visa/Mastercard, PayPal. 17 pays couverts. Vos clients paient comme ils veulent.",
    features: [
      { icon: "phone_android", title: "Mobile Money natif", text: "Orange, Wave, MTN — les méthodes que vos clients utilisent au quotidien au Sénégal, en Côte d'Ivoire, au Cameroun…" },
      { icon: "credit_card", title: "Cartes internationales", text: "Visa, Mastercard, SEPA, PayPal. Pour la diaspora et les clients internationaux." },
      { icon: "lock", title: "Escrow sécurisé", text: "Les fonds sont bloqués jusqu'à satisfaction du client. Confiance garantie des deux côtés." },
      { icon: "speed", title: "Retraits sous 48h", text: "Demandez un retrait, recevez votre argent sous 24-48h sur votre Mobile Money ou compte bancaire." },
    ],
    visual: "right",
  },
  {
    id: "ia", pill: "Créer", title: "Un assistant IA qui travaille pour vous", icon: "auto_awesome", color: "#ec4899",
    desc: "Générez des plans de cours, rédigez vos pages de vente, créez des quiz, structurez vos modules. L'IA comprend le contexte africain.",
    features: [
      { icon: "school", title: "Structure de formation", text: "Donnez votre sujet, l'IA propose modules, leçons et objectifs pédagogiques." },
      { icon: "edit_note", title: "Copywriting", text: "Pages de vente, descriptions, emails — des textes qui convertissent, adaptés à votre audience." },
      { icon: "quiz", title: "Quiz & évaluations", text: "Générez des QCM pertinents pour vos modules en un clic." },
      { icon: "smart_toy", title: "Chatbot support", text: "Un assistant IA répond aux questions de vos apprenants 24/7." },
    ],
    visual: "left",
  },
  {
    id: "video", pill: "Héberger", title: "Hébergement vidéo sécurisé inclus", icon: "play_circle", color: "#2563eb",
    desc: "Uploadez vos vidéos directement. Streaming adaptatif, protection contre le téléchargement, player intégré. Zéro frais supplémentaire.",
    features: [
      { icon: "cloud_upload", title: "Upload direct", text: "Glissez vos fichiers, c'est en ligne. Pas besoin de YouTube ou Vimeo." },
      { icon: "shield", title: "DRM & protection", text: "Vos vidéos ne peuvent pas être téléchargées. Votre contenu reste votre propriété." },
      { icon: "hd", title: "Qualité adaptative", text: "Le player s'adapte à la connexion de vos apprenants — même en 3G." },
      { icon: "subtitles", title: "Progression trackée", text: "Suivez où en sont vos apprenants dans chaque vidéo, module par module." },
    ],
    visual: "right",
  },
  {
    id: "automatisations", pill: "Automatiser", title: "Des workflows qui tournent sans vous", icon: "bolt", color: "#06b6d4",
    desc: "Emails automatiques, séquences de bienvenue, relances, notifications. Configurez une fois, ça tourne pour toujours.",
    features: [
      { icon: "mail", title: "Séquences email", text: "Bienvenue, relance panier, suivi post-achat — 23 templates prêts à l'emploi." },
      { icon: "notifications_active", title: "Notifications", text: "Alertez vos clients par email, SMS ou push navigateur selon les événements." },
      { icon: "workspace_premium", title: "Certificats auto", text: "Vos apprenants reçoivent un certificat automatique quand ils terminent la formation." },
      { icon: "group_add", title: "Programme d'affiliation", text: "Vos clients deviennent vos vendeurs. 40% de commission, tracking automatique." },
    ],
    visual: "left",
  },
];

export default function FonctionnalitesPage() {
  return (
    <div style={{ backgroundColor: C.surface, color: C.dark, ...S }}>
      <main className="pb-0">
        {/* Hero */}
        <section className="pt-28 pb-20 px-6 text-center" style={{ background: `linear-gradient(135deg, #003d1a 0%, ${C.primary} 50%, ${C.accent} 100%)` }}>
          <div className="max-w-4xl mx-auto">
            <Pill>Plateforme complète</Pill>
            <h1 className="text-4xl md:text-6xl text-white mb-6 leading-[1.05]" style={SH}>
              Tout ce dont vous avez besoin pour vendre en ligne.
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed">
              Boutique, tunnels de vente, paiements Mobile Money, assistant IA, hébergement vidéo, certificats, automatisations et affiliation. Tout est inclus, zéro abonnement.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/inscription?role=vendeur" className="bg-white font-bold text-base py-4 px-8 rounded-xl hover:bg-gray-50 transition-colors" style={{ ...S, color: C.primary }}>
                Commencer gratuitement
              </Link>
              <Link href="/tarifs" className="border-2 border-white/30 text-white font-bold text-base py-4 px-8 rounded-xl hover:bg-white/10 transition-colors" style={S}>
                Voir les tarifs
              </Link>
            </div>
          </div>
        </section>

        {/* Stats bar */}
        <section className="bg-white border-b border-gray-100 py-8 px-6">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "30+", label: "Types de blocs" },
              { value: "17", label: "Pays couverts" },
              { value: "23", label: "Templates email" },
              { value: "12", label: "Polices disponibles" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-extrabold" style={{ color: C.primary }}>{s.value}</p>
                <p className="text-xs text-[#5c647a] mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Feature sections */}
        {SECTIONS.map((section, idx) => (
          <section key={section.id} id={section.id} className="py-24 px-6" style={{ backgroundColor: idx % 2 === 0 ? "white" : C.surface }}>
            <div className="max-w-6xl mx-auto">
              <div className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center ${section.visual === "left" ? "lg:flex-row-reverse" : ""}`}>
                {/* Text */}
                <div className={section.visual === "left" ? "lg:order-2" : ""}>
                  <Pill>{section.pill}</Pill>
                  <h2 className="text-3xl md:text-5xl mb-5 leading-[1.1]" style={{ ...SH, color: C.dark }}>{section.title}</h2>
                  <p className="text-base leading-relaxed mb-8" style={{ color: C.muted }}>{section.desc}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {section.features.map((f) => (
                      <div key={f.title} className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${section.color}15` }}>
                          <span className="material-symbols-outlined text-[20px]" style={{ color: section.color, fontVariationSettings: "'FILL' 1" }}>{f.icon}</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold" style={{ color: C.dark }}>{f.title}</p>
                          <p className="text-xs leading-relaxed mt-0.5" style={{ color: C.muted }}>{f.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Visual mockup */}
                <div className={section.visual === "left" ? "lg:order-1" : ""}>
                  <div className="rounded-3xl border border-gray-200 bg-white shadow-xl p-6 relative overflow-hidden" style={{ minHeight: 320 }}>
                    <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl" style={{ background: `linear-gradient(to right, ${section.color}, ${C.accent})` }} />
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-3 h-3 rounded-full bg-red-400" /><div className="w-3 h-3 rounded-full bg-yellow-400" /><div className="w-3 h-3 rounded-full bg-green-400" />
                      <div className="flex-1 h-6 bg-gray-100 rounded-lg mx-4" />
                    </div>
                    <div className="space-y-3">
                      <div className="h-8 rounded-lg" style={{ background: `${section.color}15`, width: "60%" }} />
                      <div className="h-4 bg-gray-100 rounded" style={{ width: "90%" }} />
                      <div className="h-4 bg-gray-100 rounded" style={{ width: "75%" }} />
                      <div className="grid grid-cols-3 gap-3 mt-4">
                        {[1, 2, 3].map((n) => (
                          <div key={n} className="rounded-xl p-4 border border-gray-100" style={{ background: `${section.color}08` }}>
                            <div className="w-8 h-8 rounded-lg mb-2" style={{ background: `${section.color}20` }} />
                            <div className="h-3 bg-gray-200 rounded mb-1" style={{ width: "80%" }} />
                            <div className="h-2 bg-gray-100 rounded" style={{ width: "60%" }} />
                          </div>
                        ))}
                      </div>
                      <div className="h-10 rounded-xl mt-4" style={{ background: `linear-gradient(to right, ${section.color}, ${C.accent})`, width: "40%" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ))}

        {/* Comparison vs competitors */}
        <section className="py-24 px-6 bg-white">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <Pill>Comparaison</Pill>
            <h2 className="text-3xl md:text-5xl mb-4" style={{ ...SH, color: C.dark }}>Novakou vs la concurrence</h2>
            <p className="text-base" style={{ color: C.muted }}>Tout est inclus. Pas de modules payants en plus.</p>
          </div>
          <div className="max-w-4xl mx-auto overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-3 font-bold" style={{ color: C.dark }}>Fonctionnalité</th>
                  <th className="py-4 px-3 font-extrabold text-center rounded-t-2xl" style={{ background: `${C.primary}10`, color: C.primary }}>Novakou</th>
                  <th className="py-4 px-3 text-center font-semibold text-gray-500">Systeme.io</th>
                  <th className="py-4 px-3 text-center font-semibold text-gray-500">Gumroad</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Mobile Money (17 pays)", true, false, false],
                  ["Tunnels de vente (30+ blocs)", true, true, false],
                  ["Génération IA de tunnels", true, false, false],
                  ["Hébergement vidéo inclus", true, true, false],
                  ["Certificats automatiques", true, false, false],
                  ["Programme d'affiliation", true, true, false],
                  ["Séquences email", true, true, false],
                  ["Zéro abonnement", true, false, true],
                  ["Commission < 15%", true, false, false],
                  ["Preuve sociale live", true, false, false],
                  ["CTA flottant sticky", true, false, false],
                  ["Countdown par visiteur", true, false, false],
                ].map(([label, nova, sys, gum], i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-3 px-3 font-medium" style={{ color: C.dark }}>{label as string}</td>
                    <td className="py-3 px-3 text-center" style={{ background: `${C.primary}05` }}>
                      {nova ? <span className="material-symbols-outlined text-[18px]" style={{ color: C.primary, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        : <span className="material-symbols-outlined text-[18px] text-gray-300">cancel</span>}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {sys ? <span className="material-symbols-outlined text-[18px] text-gray-400">check_circle</span>
                        : <span className="material-symbols-outlined text-[18px] text-gray-300">cancel</span>}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {gum ? <span className="material-symbols-outlined text-[18px] text-gray-400">check_circle</span>
                        : <span className="material-symbols-outlined text-[18px] text-gray-300">cancel</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 px-6 text-center" style={{ backgroundColor: C.primary }}>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-6xl text-white mb-6 leading-tight" style={SH}>Lancez votre business en ligne aujourd&apos;hui.</h2>
            <p className="text-xl mb-10 max-w-2xl mx-auto" style={{ color: "#d1fae5" }}>
              10 % de commission, zéro abonnement. Commencez en 3 minutes.
            </p>
            <Link href="/inscription?role=vendeur" className="inline-block bg-white font-bold text-lg py-4 px-10 rounded-xl hover:bg-gray-50 transition-colors" style={{ ...S, color: C.primary }}>
              Créer mon compte gratuitement
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
