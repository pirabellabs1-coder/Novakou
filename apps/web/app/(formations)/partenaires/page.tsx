import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Partenaires · Novakou",
  description: "Découvrez nos partenaires de paiement, technologie et écosystème. Devenez partenaire Novakou.",
};

const PAYMENT_PARTNERS = [
  { name: "Orange Money", desc: "Mobile Money disponible en Afrique francophone (CI, SN, CM, BF...)", icon: "smartphone", color: "#ff6b00" },
  { name: "Wave", desc: "Paiements et transferts instantanés au Sénégal et Côte d'Ivoire", icon: "waves", color: "#1dafff" },
  { name: "MTN MoMo", desc: "Mobile Money sur les marchés MTN d'Afrique de l'Ouest et centrale", icon: "smartphone", color: "#ffcb05" },
  { name: "Moneroo", desc: "Agrégateur multi-paiements panafricain (cartes, Mobile Money, virements)", icon: "credit_card", color: "#7c3aed" },
  { name: "Stripe", desc: "Paiements internationaux par carte (Visa, Mastercard) pour la diaspora", icon: "credit_card", color: "#635bff" },
];

const TECH_PARTNERS = [
  { name: "Supabase", desc: "Base de données PostgreSQL + authentification + stockage", icon: "storage", color: "#3ecf8e" },
  { name: "Resend", desc: "Emails transactionnels avec design React", icon: "mail", color: "#000000" },
  { name: "Cloudinary", desc: "Hébergement et optimisation média (images, vidéos)", icon: "image", color: "#3448c5" },
  { name: "OpenAI", desc: "Intelligence artificielle pour la modération et l'aide à la création", icon: "smart_toy", color: "#10a37f" },
];

const PROGRAM_BENEFITS = [
  { icon: "trending_up", title: "Visibilité", desc: "Votre logo sur cette page + dans nos campagnes marketing." },
  { icon: "groups", title: "Audience qualifiée", desc: "Accès direct à une communauté de créateurs et apprenants engagés." },
  { icon: "handshake", title: "Co-création", desc: "Participation aux roadmaps produit et programmes événementiels." },
  { icon: "support_agent", title: "Support dédié", desc: "Un point de contact unique pour intégration technique et marketing." },
];

export default function PartenairesPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>

      {/* HERO */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-[#006e2f] bg-[#006e2f]/10 px-3 py-1 rounded-full mb-4">
            Écosystème
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#191c1e] leading-tight tracking-tight">
            Nos partenaires <br /> de confiance
          </h1>
          <p className="text-lg text-[#5c647a] mt-5 max-w-2xl mx-auto">
            Des partenaires technologiques et financiers de premier plan qui rendent Novakou possible.
          </p>
        </div>
      </section>

      {/* PAYMENT PARTNERS */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#006e2f] mb-3">Paiements</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#191c1e] tracking-tight">Encaissez en Mobile Money & cartes</h2>
            <p className="text-[#5c647a] mt-3 max-w-2xl mx-auto">5 méthodes de paiement intégrées nativement pour couvrir l&apos;Afrique francophone et l&apos;international.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {PAYMENT_PARTNERS.map((p) => (
              <div key={p.name} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${p.color}15` }}>
                  <span className="material-symbols-outlined text-[24px]" style={{ color: p.color, fontVariationSettings: "'FILL' 1" }}>{p.icon}</span>
                </div>
                <h3 className="text-base font-extrabold text-[#191c1e]">{p.name}</h3>
                <p className="text-sm text-[#5c647a] mt-2 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TECH PARTNERS */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#006e2f] mb-3">Technologie</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#191c1e] tracking-tight">Une stack moderne et fiable</h2>
            <p className="text-[#5c647a] mt-3 max-w-2xl mx-auto">Les meilleurs outils du marché, choisis avec soin pour la performance et la sécurité.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {TECH_PARTNERS.map((p) => (
              <div key={p.name} className="bg-white border border-slate-200 rounded-2xl p-6 flex items-start gap-4 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${p.color}15` }}>
                  <span className="material-symbols-outlined text-[24px]" style={{ color: p.color }}>{p.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-extrabold text-[#191c1e]">{p.name}</h3>
                  <p className="text-sm text-[#5c647a] mt-1 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEVENIR PARTENAIRE */}
      <section className="py-16 px-6 bg-gradient-to-br from-slate-900 to-[#006e2f]/40 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-[#22c55e] bg-[#22c55e]/15 px-3 py-1 rounded-full mb-4">
              Programme partenaire
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Devenez partenaire Novakou</h2>
            <p className="text-slate-300 mt-3 max-w-2xl mx-auto">
              Vous proposez un service B2B (paiement, hébergement, design, marketing, juridique) qui pourrait servir nos créateurs ? Parlons-en.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {PROGRAM_BENEFITS.map((b) => (
              <div key={b.title} className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-[#22c55e]/15 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-[24px] text-[#22c55e]" style={{ fontVariationSettings: "'FILL' 1" }}>{b.icon}</span>
                </div>
                <h3 className="text-base font-extrabold">{b.title}</h3>
                <p className="text-sm text-slate-300 mt-2 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="/contact?subject=partnership" className="inline-flex items-center gap-2 bg-white text-[#006e2f] px-7 py-4 rounded-2xl font-extrabold text-sm hover:bg-slate-100 transition-colors shadow-xl">
              <span className="material-symbols-outlined text-[18px]">handshake</span>
              Contacter l&apos;équipe partenariats
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
