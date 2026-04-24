import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { RevenueSimulator } from "@/components/formations/RevenueSimulator";
import { CreatorsJoinBadge, HeroBadge } from "@/components/formations/PublicStatsBadge";
import { BestSellers } from "@/components/formations/BestSellers";
import { RevealOnScroll, AnimatedCounter } from "@/components/landing/RevealOnScroll";
import { CodeSnippet } from "@/components/landing/CodeSnippet";
import { FAQAccordion } from "@/components/landing/FAQAccordion";

export const metadata: Metadata = {
  title: "Novakou | Le Curateur Digital",
  description:
    "La plateforme éditoriale pour créateurs qui veulent vendre des formations, ebooks et services sans la complexité technique.",
};

export default async function FormationsPage() {
  return (
    <>
      {/* ── 1. HERO ─────────────────────────────────────────────── */}
      <section className="relative px-4 md:px-8 pt-12 pb-20 md:pb-32 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-10 md:gap-16">
        {/* Left */}
        <div className="flex-1 space-y-6 md:space-y-8 text-center md:text-left">
          <HeroBadge />

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-[#191c1e]">
            Transformez vos compétences en{" "}
            <span className="text-gradient">revenus automatiques</span>
          </h1>

          <p className="text-base md:text-xl text-[#5c647a] max-w-xl leading-relaxed mx-auto md:mx-0">
            La plateforme éditoriale pour créateurs qui veulent vendre des formations, ebooks et services sans la complexité technique.
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center md:justify-start">
            <Link
              href="/inscription?role=vendeur"
              className="text-white px-6 md:px-8 py-3 md:py-4 rounded-full text-base md:text-lg font-bold flex items-center justify-center gap-3 hover:scale-105 transition-transform"
              style={{
                background: "linear-gradient(to right, #006e2f, #22c55e)",
                boxShadow: "0 20px 40px rgba(34,197,94,0.3)",
              }}
            >
              <span>Lancer ma boutique</span>
              <span className="material-symbols-outlined">rocket_launch</span>
            </Link>
            <Link
              href="/explorer"
              className="px-6 md:px-8 py-3 md:py-4 bg-[#f2f4f6] text-[#191c1e] font-bold rounded-full border border-[#bccbb9]/20 hover:bg-[#eceef0] transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">explore</span>
              Explorer le catalogue
            </Link>
          </div>

          <div className="flex items-center gap-4 pt-2 justify-center md:justify-start">
            <div className="flex -space-x-3">
              {[
                "https://lh3.googleusercontent.com/aida-public/AB6AXuCGX9twRtRgGltcxTW9EJqsOv96cSwnoA52sgPvi8MP01qX3Op1EHt2i0VBzfz-b6mSWa7jF_Tx7d3IDD85s0coZmYh7gfA7FB1N11CoeKDxxswhjkbzIvMehRzugu_lVYtx6Kqvl2lTR5vy15PIDDO7aQDWdNKgxQH_uEL7wHsK7GTFlqregV6cfryXRuDPzfPYQh4c-Af_Wv6qIGmS6JhUTKx7dsEmav4iWsoRfZhoNwe-uafQJCMFkqq0iR7RbD4IR8YIEA1JjhG",
                "https://lh3.googleusercontent.com/aida-public/AB6AXuD9Rh0ecjM8nGvWfG_C0KbaGYWrSmu8xmHRjCO70WBZ0-5sZv2Q2D-Fabrnx0JT4aLiEkSG11YZCkMwiEefpWTFRezj3cUHsuIsBJvS1JtkK_7oFybZDfAHwmDm-x3XW245JemBnQqaJLvjzqZYEmm5vcb8svccewMahXmGTu_kVEEV9BW2z0WeqRDmHbfwA8bpGilxMYyCmloYq4f1ntMSEdBg3G7z2jFkbA8eyRqogewLAHfdnyJW3V2nvgIKHN4cLsu4rdNAJIec",
                "https://lh3.googleusercontent.com/aida-public/AB6AXuCWvzWuZ26p82Ka65aS2FRWuFajMaeVjZFTmt2eKbeFM-76x_bYcQq7VTJJPuV5cz-ioD79i1dCmXQ3qMqU-4aLD4VUgTHd-i9NV5iPOaHec279DuNt-RDWnmVDNA8g3upiBszScHtBOVjg7zbx_pugaYRw1GK0SpNDOaVQzM_XwYrvSvAxx8P_uLrdUAUw3_GBisqCKKjiv2-RVRePMSUtMDEUgzmPQxAbgo6mJ329ft5SkMx0mv_meMJKtwORR4npogpFuRKhme5E",
              ].map((src, i) => (
                <Image
                  key={i}
                  className="w-9 h-9 rounded-full border-4 border-white object-cover"
                  src={src}
                  alt="Créateur"
                  width={36}
                  height={36}
                  unoptimized
                />
              ))}
            </div>
            <CreatorsJoinBadge />
          </div>
        </div>

        {/* Right — floating cards (desktop only) */}
        <div className="hidden md:flex flex-1 relative w-full aspect-square items-center justify-center">
          <div className="absolute inset-0 bg-[#22c55e]/10 rounded-full blur-[100px]"></div>
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="absolute transform -rotate-6 -translate-x-12 translate-y-4 w-56 h-72 bg-white squircle shadow-2xl overflow-hidden">
              <Image
                className="w-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBJMsH8gcPViMT9m87hdBDPJ0K2dr0Ejo7x6C6_-44qLZE4f_hs8uVzon3y-hKjaDSCuzD_3g8y2FvrM-tjauDVz07lchuSauJvoIlkfaMGgilLdMizmPaUL_Nu6BGxFMBaRMEV03DEJiS07MUesGcE5mP9V7tVjnBOPmld1708Dp_lZ5uM1YhuMbb7Pl9TKktgdameYvNndnlLt5kL-WNxrCVBDHMIJTJaHGews4c1lq1JkcMuQ_zRPsM2QM1L7QYb2cRPvhHqROQZ"
                alt="Formation SEO Master"
                width={224}
                height={144}
                style={{ height: "50%" }}
                unoptimized
              />
              <div className="p-4 space-y-2">
                <div className="h-2 w-10 bg-[#006e2f]/20 rounded-full"></div>
                <p className="font-bold text-sm">Formation SEO Master</p>
                <div className="h-1 w-full bg-[#eceef0] rounded-full"></div>
                <div className="h-1 w-2/3 bg-[#eceef0] rounded-full"></div>
              </div>
            </div>
            <div className="absolute transform rotate-6 translate-x-12 -translate-y-8 w-52 h-64 bg-white squircle shadow-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="material-symbols-outlined text-[#22c55e] text-3xl">check_circle</span>
                <span className="bg-[#006e2f]/10 text-[#006e2f] text-[10px] font-bold px-2 py-1 rounded">VENTE +98 000 FCFA</span>
              </div>
              <p className="text-xs text-[#5c647a]">Nouvelle commande reçue de <b>Marc R.</b> il y a 2 min.</p>
              <div className="bg-[#f2f4f6] rounded-xl p-3 flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#22c55e]/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#006e2f] text-sm">auto_graph</span>
                </div>
                <div className="h-2 w-14 bg-[#006e2f]/30 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 1.5. STATS BAR animee ─────────────────────────────────── */}
      <section className="border-y border-gray-100 bg-white py-10 md:py-14">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 text-center">
            <RevealOnScroll delay={0}>
              <div>
                <p className="text-3xl md:text-5xl font-extrabold text-[#006e2f]"><AnimatedCounter value={1240} /></p>
                <p className="text-xs md:text-sm text-[#5c647a] mt-1 font-medium uppercase tracking-widest">Créateurs actifs</p>
              </div>
            </RevealOnScroll>
            <RevealOnScroll delay={100}>
              <div>
                <p className="text-3xl md:text-5xl font-extrabold text-[#006e2f]"><AnimatedCounter value={180000000} format="currency" suffix=" F" /></p>
                <p className="text-xs md:text-sm text-[#5c647a] mt-1 font-medium uppercase tracking-widest">Générés par les vendeurs</p>
              </div>
            </RevealOnScroll>
            <RevealOnScroll delay={200}>
              <div>
                <p className="text-3xl md:text-5xl font-extrabold text-[#006e2f]"><AnimatedCounter value={17} /></p>
                <p className="text-xs md:text-sm text-[#5c647a] mt-1 font-medium uppercase tracking-widest">Pays Afrique francophone</p>
              </div>
            </RevealOnScroll>
            <RevealOnScroll delay={300}>
              <div>
                <p className="text-3xl md:text-5xl font-extrabold text-[#006e2f]">4.9<span className="text-2xl">/5</span></p>
                <p className="text-xs md:text-sm text-[#5c647a] mt-1 font-medium uppercase tracking-widest">Satisfaction vendeurs</p>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* ── 1.6. PROBLEM ─ "tu galeres avec..." ──────────────────── */}
      <section className="py-16 md:py-24 px-4 md:px-8 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-12 md:mb-16">
              <p className="text-[11px] font-bold uppercase tracking-widest text-rose-600 mb-3">Soyons honnêtes</p>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[#191c1e] leading-tight">
                Vendre en ligne en Afrique,<br/>
                <span className="text-rose-600">c&apos;est souvent la galère.</span>
              </h2>
              <p className="text-[#5c647a] text-base md:text-lg mt-5 max-w-2xl mx-auto">
                Les outils étrangers ne comprennent pas notre réalité. Les options locales sont limitées. Tu bricoles avec 5 services, tu perds du temps, tu paies cher.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {[
              { icon: "block", title: "Mobile Money invisible", text: "Gumroad, Teachable, Podia… aucun n'accepte Orange Money, Wave, MTN. Tes clients abandonnent à la case paiement." },
              { icon: "savings", title: "Frais qui étouffent", text: "Stripe 2.9% + commission plateforme 10-20% + virement international $20 + conversion EUR/FCFA. Au final tu perds 25%+ par vente." },
              { icon: "language", title: "Copy mal traduit", text: "Interfaces en anglais, templates US, ton robotique. Ton audience francophone africaine ne s'y retrouve pas." },
              { icon: "support_agent", title: "Support inexistant", text: "Ticket en 48h, agent qui ne parle pas français, aucune compréhension du marché africain. Tu es seul." },
              { icon: "code_off", title: "Bricolage technique", text: "Mailchimp + ConvertKit + Calendly + Kajabi + Zapier = 200€/mois, 10h de setup, plein de bugs." },
              { icon: "trending_down", title: "Abandons non récupérés", text: "75% des paniers sont abandonnés. Sans séquence de relance auto, c'est du chiffre d'affaires qui s'évapore." },
            ].map((p, i) => (
              <RevealOnScroll key={i} delay={i * 80}>
                <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6 flex items-start gap-4 h-full">
                  <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-rose-600">{p.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-[#191c1e] mb-1">{p.title}</h3>
                    <p className="text-sm text-[#5c647a] leading-relaxed">{p.text}</p>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ── 1.7. SOLUTION ─ "Novakou fait tout" ──────────────────── */}
      <section className="py-16 md:py-24 px-4 md:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <RevealOnScroll>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#006e2f] mb-3">La solution</p>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[#191c1e] leading-tight">
              Novakou fait <span className="text-gradient">tout le travail</span> à ta place.
            </h2>
            <p className="text-[#5c647a] text-base md:text-lg mt-5 max-w-3xl mx-auto leading-relaxed">
              Boutique + tunnels de vente + paiements Mobile Money + 5 assistants IA + emails automatiques + support clients bot 24/7 + analytics + communauté. Tout intégré, un seul endroit, 10% sur tes ventes.
            </p>
          </RevealOnScroll>

          <RevealOnScroll delay={200}>
            <div className="flex items-center justify-center gap-2 flex-wrap mt-8">
              {[
                { label: "Orange Money", icon: "phone_iphone" },
                { label: "Wave", icon: "waves" },
                { label: "MTN MoMo", icon: "smartphone" },
                { label: "Moov", icon: "rocket" },
                { label: "Carte bancaire", icon: "credit_card" },
                { label: "Virement SEPA", icon: "account_balance" },
              ].map((p, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-[#191c1e] text-xs font-bold">
                  <span className="material-symbols-outlined text-[14px] text-[#006e2f]">{p.icon}</span>
                  {p.label}
                </span>
              ))}
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ── 2. CATALOGUE À LA UNE ────────────────────────────────── */}
      <section className="bg-slate-50 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-10 md:mb-12">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#191c1e]">Les Best-sellers</h2>
              <p className="text-[#5c647a]">Les pépites les plus rentables du moment.</p>
            </div>
            <Link href="/explorer" className="text-[#006e2f] font-bold flex items-center gap-2 group text-sm md:text-base hover:text-[#22c55e] transition-colors">
              Explorer tout le catalogue
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </Link>
          </div>

          <BestSellers />
        </div>
      </section>

      {/* ── 3. BENTO GRID ────────────────────────────────────────── */}
      <section className="py-16 md:py-24 px-4 md:px-8 max-w-7xl mx-auto">
        <h2 className="text-center text-2xl md:text-4xl font-extrabold mb-10 md:mb-16 tracking-tight text-[#191c1e]">
          L&apos;écosystème conçu pour la{" "}
          <span className="text-[#006e2f]">haute performance</span>
        </h2>
        <div className="bento-asym">
          {/* Marketing & SEO — col-span-4 row-span-2 */}
          <div
            className="col-span-6 md:col-span-4 md:row-span-2 squircle p-8 md:p-10 flex flex-col justify-between group overflow-hidden relative text-white"
            style={{ backgroundColor: "#006e2f" }}
          >
            <div className="relative z-10">
              <span className="material-symbols-outlined text-4xl mb-4">campaign</span>
              <h3 className="text-2xl md:text-3xl font-bold mb-3">Marketing &amp; SEO natif</h3>
              <p className="text-[#6bff8f] max-w-md text-base md:text-lg leading-relaxed">
                Boostez votre visibilité sans dépenser 1 FCFA en pub. Notre architecture est optimisée pour Google par défaut.
              </p>
            </div>
            <div className="absolute right-[-10%] bottom-[-10%] w-64 h-64 bg-[#6bff8f] opacity-10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
          </div>

          {/* Paiements */}
          <div className="col-span-3 md:col-span-2 bg-white squircle p-6 md:p-8 shadow-sm flex flex-col justify-between border border-[#eceef0]">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-lg leading-tight text-[#191c1e]">Paiements<br/>Instantanés</h3>
              <span className="material-symbols-outlined text-[#006e2f]">account_balance_wallet</span>
            </div>
            <p className="text-sm text-[#5c647a] mt-2">Encaissez vos revenus par Stripe, PayPal ou Crypto en un clic.</p>
          </div>

          {/* 10% Frais */}
          <div className="col-span-3 md:col-span-2 squircle p-6 md:p-8 flex flex-col justify-between" style={{ backgroundColor: "rgba(34,197,94,0.1)" }}>
            <div className="text-3xl md:text-4xl font-black text-[#006e2f]">10%</div>
            <div>
              <h3 className="font-bold text-[#191c1e]">Frais tout compris</h3>
              <p className="text-xs text-[#5c647a] mt-1">IA + marketing + paiements + support inclus. Zéro abonnement.</p>
            </div>
          </div>

          {/* Anti-piratage */}
          <div className="col-span-6 md:col-span-3 bg-[#f2f4f6] squircle p-6 md:p-8 flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-sm flex-shrink-0">
              <span className="material-symbols-outlined text-[#006e2f] text-2xl">shield_lock</span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#191c1e]">Anti-piratage Pro</h3>
              <p className="text-sm text-[#5c647a]">Filigrane dynamique et blocage des partages de compte.</p>
            </div>
          </div>

          {/* Espace Apprenant */}
          <div className="col-span-6 md:col-span-3 bg-white squircle p-6 md:p-8 shadow-sm flex items-center gap-5 border border-[#eceef0]">
            <div className="w-14 h-14 rounded-full bg-[#006e2f]/5 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[#006e2f] text-2xl">school</span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#191c1e]">Espace Apprenant Netflix-style</h3>
              <p className="text-sm text-[#5c647a]">Une expérience fluide sur mobile et tablette.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. SIMULATEUR DE REVENUS ─────────────────────────────── */}
      <RevenueSimulator />

      {/* ── 5. PROGRAMME DE RÉCOMPENSES ──────────────────────────── */}
      <section className="py-16 md:py-24 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="glass-card squircle p-8 md:p-12 text-center overflow-hidden relative">
          <h2 className="text-2xl md:text-3xl font-extrabold mb-3 text-[#191c1e]">Le parcours vers l&apos;excellence</h2>
          <p className="text-[#5c647a] mb-10">Plus vous vendez, plus nous réduisons vos frais et débloquons des outils exclusifs.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
            {[
              { label: "Bronze", icon: "emoji_events", bg: "bg-amber-700/10", border: "border-amber-700/20", color: "text-amber-700", active: true },
              { label: "Argent", icon: "emoji_events", bg: "bg-slate-300", border: "border-slate-200", color: "text-slate-500", active: false },
              { label: "Or", icon: "emoji_events", bg: "bg-amber-400/20", border: "border-amber-400/20", color: "text-amber-500", active: false },
              { label: "Diamant", icon: "diamond", bg: "bg-sky-100", border: "border-sky-50", color: "text-sky-400", active: false },
            ].map((tier) => (
              <div key={tier.label} className={`flex flex-col items-center gap-3 ${!tier.active ? "opacity-50" : ""}`}>
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full ${tier.bg} flex items-center justify-center border-4 ${tier.border}`}>
                  <span className={`material-symbols-outlined text-3xl md:text-4xl ${tier.color}`}>{tier.icon}</span>
                </div>
                <span className={`font-bold text-sm ${!tier.active ? "text-slate-400" : "text-[#191c1e]"}`}>{tier.label}</span>
              </div>
            ))}
          </div>
          <div className="max-w-2xl mx-auto h-3 bg-[#eceef0] rounded-full overflow-hidden mb-4">
            <div className="h-full w-1/4 bg-[#006e2f] rounded-full"></div>
          </div>
          <p className="text-sm font-medium text-[#191c1e]">
            Encore <span className="font-bold">813 000 FCFA</span> pour atteindre le niveau Argent.
          </p>
        </div>
      </section>

      {/* ── 6. SPOTLIGHT ─────────────────────────────────────────── */}
      <section className="py-16 md:py-32 px-4 md:px-8 max-w-7xl mx-auto overflow-hidden">
        <div className="flex flex-col md:flex-row items-center gap-10 md:gap-24">
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[#191c1e] leading-tight">
              Vendez des produits numériques qui{" "}
              <span className="text-gradient">marquent les esprits.</span>
            </h2>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="relative group">
              <div className="bg-white squircle p-6 md:p-8 w-72 md:w-80" style={{ boxShadow: "0 40px 80px rgba(34,197,94,0.15)" }}>
                <div className="aspect-[4/5] bg-[#f2f4f6] rounded-xl mb-5 overflow-hidden relative">
                  <div className="absolute top-4 left-4 bg-[#006e2f] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg z-10">
                    Téléchargement instantané
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="font-bold text-lg text-[#191c1e]">Call PME – Starter</h3>
                  <div>
                    <div className="text-xl font-extrabold text-[#006e2f]">44 000 FCFA</div>
                    <div className="text-xs text-[#5c647a] font-medium">≈ 67 €</div>
                  </div>
                  <p className="text-sm text-[#5c647a]">Pack complet de prospection B2B pour agences.</p>
                  <button className="w-full py-3 md:py-4 bg-[#22C55E] text-white rounded-full font-bold shadow-lg shadow-green-200 hover:scale-105 active:scale-95 transition-all">
                    Acheter ce pack
                  </button>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-12 h-12 bg-[#22c55e] rounded-full blur-2xl opacity-40"></div>
              <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-[#006e2f] rounded-full blur-3xl opacity-20"></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. ÉCOSYSTÈME & INTÉGRATIONS ────────────────────────── */}
      <section className="py-16 md:py-32 bg-slate-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12 md:mb-24">
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-[#191c1e]">
              Connectez vos outils préférés.<br/>
              <span className="text-[#006e2f]">Automatisez votre succès.</span>
            </h2>
          </div>
          <div className="relative h-[280px] md:h-[400px] flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 400">
              <line className="network-line stroke-slate-200" strokeWidth="2" x1="400" y1="200" x2="200" y2="100" />
              <line className="network-line stroke-slate-200" strokeWidth="2" x1="400" y1="200" x2="600" y2="100" />
              <line className="network-line stroke-slate-200" strokeWidth="2" x1="400" y1="200" x2="200" y2="300" />
              <line className="network-line stroke-slate-200" strokeWidth="2" x1="400" y1="200" x2="600" y2="300" />
            </svg>
            <div className="relative z-10 w-16 h-16 md:w-24 md:h-24 bg-white squircle shadow-xl border border-[#006e2f]/20 flex items-center justify-center">
              <div className="text-[#006e2f] font-black text-base md:text-xl leading-none text-center">NK</div>
            </div>
            {[
              { pos: "top-[25px] left-[80px] md:top-[50px] md:left-[150px]", icon: "search", label: "SEO" },
              { pos: "top-[25px] right-[80px] md:top-[50px] md:right-[150px]", icon: "mail", label: "Emailing" },
              { pos: "bottom-[25px] left-[80px] md:bottom-[50px] md:left-[150px]", icon: "analytics", label: "Tracking" },
              { pos: "bottom-[25px] right-[80px] md:bottom-[50px] md:right-[150px]", icon: "account_balance", label: "Virements" },
            ].map((node) => (
              <div key={node.label} className={`absolute ${node.pos} bg-white squircle p-3 md:p-4 shadow-md border border-slate-100 flex flex-col items-center gap-1 md:gap-2 group hover:border-[#006e2f]/40 transition-colors`}>
                <span className="material-symbols-outlined text-slate-400 group-hover:text-[#006e2f] transition-colors text-sm md:text-base">{node.icon}</span>
                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-[#191c1e]">{node.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7.5 SECTION IA — "5 assistants IA Claude inclus" ────── */}
      <section className="py-16 md:py-32 px-4 md:px-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-80 bg-gradient-to-r from-indigo-300 to-pink-300 opacity-20 blur-3xl rounded-full" />
        <div className="max-w-6xl mx-auto relative">
          <RevealOnScroll>
            <div className="text-center mb-12 md:mb-16">
              <p className="text-[11px] font-bold uppercase tracking-widest text-purple-700 mb-3">🤖 Propulsé par Claude Sonnet 4.6</p>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[#191c1e] leading-tight">
                5 assistants IA travaillent <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">pour toi 24/7</span>
              </h2>
              <p className="text-[#5c647a] text-base md:text-lg mt-5 max-w-3xl mx-auto leading-relaxed">
                Pas d&apos;API key. Pas d&apos;abonnement OpenAI. Les IA sont intégrées dans ton dashboard et aident chaque rôle à scaler plus vite.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {[
              { icon: "auto_awesome", color: "from-purple-500 to-pink-500", title: "AI Studio", role: "Vendeur", text: "Décris ton produit en 2 phrases → page de vente complète générée : titre, description 1500 mots, bénéfices, FAQ, témoignages." },
              { icon: "account_tree", color: "from-[#006e2f] to-[#22c55e]", title: "AI Tunnel Builder", role: "Vendeur", text: "Tunnel de vente 4 étapes (landing + checkout + upsell + merci) généré en 30s. Prêt à publier, éditable." },
              { icon: "support_agent", color: "from-cyan-500 to-blue-600", title: "AI Support Client", role: "Boutique publique", text: "Chatbot sur ta boutique qui répond aux questions acheteurs 24/7 avec ton contexte (prix, FAQ, politiques)." },
              { icon: "psychology", color: "from-[#006e2f] to-emerald-500", title: "Coach IA Vendeur", role: "Vendeur", text: "Rédige tes emails, optimise tes descriptions, planifie 100 ventes, crée tes workflows d'automatisation." },
              { icon: "school", color: "from-blue-500 to-cyan-500", title: "Coach IA Apprenant", role: "Apprenant", text: "Explique les concepts difficiles, planifie ton apprentissage 30 jours, te motive, te guide vers le freelance." },
              { icon: "self_improvement", color: "from-purple-500 to-pink-500", title: "Coach IA Mentor", role: "Mentor", text: "Structure tes sessions, crée tes packs, rédige tes emails de vente, prépare tes ressources clients." },
            ].map((ai, i) => (
              <RevealOnScroll key={i} delay={i * 60}>
                <div className="bg-white rounded-2xl border border-white/50 shadow-lg p-6 h-full hover:shadow-2xl hover:-translate-y-1 transition-all">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${ai.color} flex items-center justify-center text-white shadow-md mb-4`}>
                    <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>{ai.icon}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-extrabold text-[#191c1e] text-lg">{ai.title}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-[#5c647a]">{ai.role}</span>
                  </div>
                  <p className="text-sm text-[#5c647a] leading-relaxed">{ai.text}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>

          <RevealOnScroll>
            <div className="mt-12 text-center">
              <p className="text-[#5c647a] text-sm max-w-xl mx-auto">
                + l&apos;<strong>IA Admin Assistant</strong> côté Novakou qui analyse tes stats, détecte les anomalies et te propose un plan d&apos;action chaque jour.
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ── 7.6 SECTION DEMO BOT ───────────────────────────────── */}
      <section className="py-16 md:py-24 px-4 md:px-8 bg-[#0d1117] text-white relative overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-10 md:mb-14">
              <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 mb-3">Démo live</p>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
                Le chatbot <span className="text-emerald-400">qui vend</span> pendant que tu dors
              </h2>
              <p className="text-slate-400 text-base md:text-lg mt-5 max-w-2xl mx-auto">
                Active le support IA depuis ton dashboard. Le widget apparaît sur ta boutique et répond aux visiteurs avec ton contexte.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <RevealOnScroll direction="right">
              <div className="space-y-4 max-w-md mx-auto">
                <div className="bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-3 text-sm">
                  Bonjour, combien coûte votre formation Excel et est-ce que je peux payer en plusieurs fois via Orange Money ?
                </div>
                <div className="flex justify-end">
                  <div className="bg-[#006e2f] rounded-2xl rounded-br-sm px-4 py-3 text-sm max-w-sm">
                    Bonjour et bienvenue ! 😊
                    <br/><br/>
                    La <strong>Formation Excel pour débutants</strong> est à <strong>15 000 FCFA</strong> (offre de lancement, au lieu de 25 000 FCFA). Oui, tu peux payer en <strong>2 fois de 7 500 FCFA</strong> via <strong>Orange Money</strong>, Wave ou MTN MoMo ! 🎉
                    <br/><br/>
                    Tu veux en savoir plus sur le contenu de la formation avant de te lancer ?
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 text-center">
                  Propulsé par Claude Sonnet 4.6 · réponse en 3 secondes
                </p>
              </div>
            </RevealOnScroll>

            <RevealOnScroll direction="left">
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
                <p className="text-emerald-400 text-[11px] font-bold uppercase tracking-widest mb-3">Comment ça marche</p>
                <ul className="space-y-4 text-sm">
                  {[
                    { n: "1", t: "Tu actives le chatbot dans /vendeur/support-ia" },
                    { n: "2", t: "Tu colles ton contexte (prix, politiques, FAQ, ton)" },
                    { n: "3", t: "Le widget apparaît sur toutes tes pages publiques" },
                    { n: "4", t: "Claude répond 24/7 avec ton contexte, ne ment jamais" },
                    { n: "5", t: "Si le bot ne sait pas, il propose de te contacter directement" },
                  ].map((s) => (
                    <li key={s.n} className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center flex-shrink-0">{s.n}</span>
                      <span className="text-slate-300 leading-relaxed">{s.t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* ── 7.7 SECTION DEVELOPER — APIs avec code ──────────────── */}
      <section className="py-16 md:py-32 px-4 md:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-12 md:mb-16">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#006e2f] mb-3">⚡ Pour développeurs</p>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[#191c1e] leading-tight">
                Des <span className="text-gradient">APIs propres</span> et des webhooks
              </h2>
              <p className="text-[#5c647a] text-base md:text-lg mt-5 max-w-3xl mx-auto leading-relaxed">
                Novakou expose tout ce que tu peux faire via API. Intègre avec Zapier, n8n, Make, ton propre CRM ou ton app mobile.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            <RevealOnScroll>
              <div>
                <h3 className="font-extrabold text-xl text-[#191c1e] mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#006e2f]">rocket_launch</span>
                  Créer un paiement
                </h3>
                <p className="text-sm text-[#5c647a] mb-3">Initie un checkout Mobile Money en une ligne. La réponse contient l&apos;URL à rediriger.</p>
                <CodeSnippet
                  label="POST /api/formations/payment/init"
                  language="curl"
                  code={`curl -X POST https://novakou.com/api/formations/payment/init \\
  -H "Content-Type: application/json" \\
  -d '{
    "formationIds": ["form_xxxxx"],
    "guestEmail": "aminata@example.com",
    "phone": "+221771234567",
    "paymentMethod": "wave_sn"
  }'

# { "data": { "checkout_url": "https://pay.moneroo.io/...", "attemptId": "cmod..." } }`}
                />
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={100}>
              <div>
                <h3 className="font-extrabold text-xl text-[#191c1e] mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#006e2f]">webhook</span>
                  Webhook paiement
                </h3>
                <p className="text-sm text-[#5c647a] mb-3">Reçois les événements en temps réel sur ton endpoint avec signature HMAC-SHA256.</p>
                <CodeSnippet
                  label="Webhook outgoing"
                  language="json"
                  code={`POST https://ton-app.com/webhooks/novakou
X-Novakou-Signature: sha256=a1b2c3...

{
  "event": "order.completed",
  "data": {
    "orderId": "ord_xxxxx",
    "amount": 15000,
    "currency": "XOF",
    "buyer": { "email": "...", "phone": "+221..." },
    "product": { "id": "form_xxxxx", "title": "..." }
  },
  "timestamp": "2026-04-24T12:34:56Z"
}`}
                />
              </div>
            </RevealOnScroll>

            <RevealOnScroll>
              <div>
                <h3 className="font-extrabold text-xl text-[#191c1e] mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#006e2f]">auto_awesome</span>
                  Utiliser l&apos;IA
                </h3>
                <p className="text-sm text-[#5c647a] mb-3">Claude Sonnet 4.6 via Puter, sans clé API. Fonctionne dans n&apos;importe quel navigateur.</p>
                <CodeSnippet
                  label="Puter.js + Claude (client)"
                  language="javascript"
                  code={`<script src="https://js.puter.com/v2/"></script>
<script>
  const response = await puter.ai.chat(
    "Rédige une sequence de 5 emails de relance panier abandonne pour une formation Excel a 15 000 FCFA, cible Afrique francophone",
    { model: "claude-sonnet-4-6", temperature: 0.7 }
  );
  console.log(response.message.content);
</script>`}
                />
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={100}>
              <div>
                <h3 className="font-extrabold text-xl text-[#191c1e] mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#006e2f]">trending_up</span>
                  Tracker un abandon
                </h3>
                <p className="text-sm text-[#5c647a] mb-3">Enregistre les tentatives échouées pour déclencher les relances automatiques.</p>
                <CodeSnippet
                  label="POST /api/formations/public/checkout-attempt"
                  language="curl"
                  code={`curl -X POST https://novakou.com/api/formations/public/checkout-attempt \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "fail",
    "attemptId": "cmod_xxx",
    "amount": 15000,
    "failureReason": "Carte refusée par la banque",
    "visitorEmail": "aminata@example.com"
  }'`}
                />
              </div>
            </RevealOnScroll>
          </div>

          <RevealOnScroll>
            <div className="text-center mt-12">
              <Link
                href="/developer/docs"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#191c1e] text-white rounded-full font-bold text-sm hover:bg-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined">menu_book</span>
                Lire la documentation API complète
              </Link>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ── 8.5 COMPARISON TABLE ─────────────────────────────────── */}
      <section className="py-16 md:py-24 px-4 md:px-8 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-10 md:mb-14">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#006e2f] mb-3">Comparaison honnête</p>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[#191c1e] leading-tight">
                Pourquoi les créateurs <span className="text-gradient">quittent</span> la concurrence
              </h2>
            </div>
          </RevealOnScroll>

          <RevealOnScroll>
            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-[#5c647a]">
                      <th className="text-left px-5 py-5 font-bold text-xs uppercase tracking-widest">Fonctionnalité</th>
                      <th className="px-5 py-5 font-bold text-center bg-[#006e2f]/5">
                        <div className="inline-flex items-center gap-2 justify-center">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#006e2f] to-[#22c55e] flex items-center justify-center text-white text-xs font-bold">NK</div>
                          <span className="text-[#191c1e] text-base">Novakou</span>
                        </div>
                      </th>
                      <th className="px-5 py-5 font-bold text-center">Chariow</th>
                      <th className="px-5 py-5 font-bold text-center">Marketou</th>
                      <th className="px-5 py-5 font-bold text-center">Gumroad</th>
                    </tr>
                  </thead>
                  <tbody className="text-[#191c1e]">
                    {[
                      { f: "Commission par vente", nk: "10% tout compris", c: "10% + 2.9%", m: "8% + frais banque", g: "10% + 30 cts" },
                      { f: "Paiements Mobile Money Afrique", nk: "✅ Orange, Wave, MTN, Moov", c: "❌", m: "⚠️ Limité", g: "❌" },
                      { f: "Tunnel de vente IA", nk: "✅ Généré par Claude 4.6", c: "Manuel", m: "Manuel", g: "❌" },
                      { f: "Chatbot IA sur ta boutique", nk: "✅ Claude inclus", c: "❌ (add-on $49/mois)", m: "❌", g: "❌" },
                      { f: "AI Studio (pages de vente)", nk: "✅ Illimité", c: "❌", m: "❌", g: "❌" },
                      { f: "Coach IA (4 rôles)", nk: "✅ Inclus", c: "❌", m: "❌", g: "❌" },
                      { f: "Emails relance abandon auto", nk: "✅ 2 relances inclus", c: "Add-on", m: "Add-on", g: "❌" },
                      { f: "Communauté privée par formation", nk: "✅ Inclus", c: "❌", m: "❌", g: "❌" },
                      { f: "Order bumps au checkout", nk: "✅", c: "✅", m: "❌", g: "❌" },
                      { f: "A/B testing tunnels", nk: "✅", c: "Pro +€", m: "❌", g: "❌" },
                      { f: "Abonnements/Memberships", nk: "✅", c: "✅", m: "⚠️", g: "✅" },
                      { f: "Interface en français africain", nk: "✅ Natif", c: "⚠️ Traduit", m: "✅", g: "❌ Anglais" },
                      { f: "Support humain", nk: "✅ FR africain, 24h", c: "EN uniquement", m: "FR, 72h", g: "EN uniquement" },
                      { f: "Frais mensuels", nk: "0 FCFA", c: "€49/mois", m: "€29/mois", g: "€0" },
                    ].map((row, i) => (
                      <tr key={i} className={`border-b border-gray-50 last:border-0 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}>
                        <td className="px-5 py-4 font-medium">{row.f}</td>
                        <td className="px-5 py-4 text-center font-bold bg-[#006e2f]/5 text-[#006e2f]">{row.nk}</td>
                        <td className="px-5 py-4 text-center text-[#5c647a]">{row.c}</td>
                        <td className="px-5 py-4 text-center text-[#5c647a]">{row.m}</td>
                        <td className="px-5 py-4 text-center text-[#5c647a]">{row.g}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-[#006e2f]/5 px-5 py-4 text-center text-xs text-[#5c647a]">
                Comparaison mise à jour en avril 2026 · Les prix et features des concurrents peuvent évoluer.
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ── 8.6 USE CASE STORIES ─────────────────────────────────── */}
      <section className="py-16 md:py-32 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-12 md:mb-16">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#006e2f] mb-3">Cas concrets</p>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[#191c1e] leading-tight">
                De l&apos;idée aux <span className="text-gradient">premières ventes</span>
              </h2>
              <p className="text-[#5c647a] text-base md:text-lg mt-5 max-w-3xl mx-auto">
                3 parcours typiques qu&apos;on voit chaque semaine sur Novakou.
              </p>
            </div>
          </RevealOnScroll>

          <div className="space-y-10 md:space-y-16">
            {[
              {
                tag: "Formatrice",
                avatar: "from-[#006e2f] to-[#22c55e]",
                initials: "AD",
                title: "De 0 à 100 ventes en 30 jours",
                person: "Aminata Diallo, formatrice marketing à Dakar",
                steps: [
                  { day: "Jour 1", text: "Elle crée sa boutique sur Novakou. Utilise AI Studio pour générer la page de vente de sa formation Instagram en 2 minutes." },
                  { day: "Jour 2", text: "Génère un tunnel de vente complet avec l'AI Tunnel Builder (landing + checkout + upsell Pack Templates)." },
                  { day: "Jour 3", text: "Active le chatbot IA sur sa boutique avec son contexte (FAQ, politique, prix). Commence à promouvoir sur WhatsApp." },
                  { day: "Jour 10", text: "Premiers 20 clients paient via Orange Money + Wave. Upsell accepté par 40% des acheteurs." },
                  { day: "Jour 25", text: "3 paniers abandonnés → 2 récupérés grâce aux emails de relance auto. Coach IA Vendeur lui suggère de tester un code promo 15%." },
                  { day: "Jour 30", text: "100 ventes. 1,5 M FCFA de chiffre d'affaires. Zéro heure de support manuel (le bot a répondu à 180 questions)." },
                ],
                result: "+1 500 000 FCFA en 30 jours",
              },
              {
                tag: "Mentor",
                avatar: "from-purple-500 to-pink-500",
                initials: "KA",
                title: "Le mentor qui a doublé son CA",
                person: "Kouakou Aurélien, mentor finance à Abidjan",
                steps: [
                  { day: "Mois 0", text: "Il faisait 800 000 FCFA/mois en mentoring 1-to-1. Aucune systématisation, tout manuel." },
                  { day: "Semaine 1", text: "Rejoint Novakou. Le Coach IA Mentor lui rédige sa bio, structure ses sessions, crée un pack 3 mois." },
                  { day: "Semaine 2", text: "Lance son premier pack à 75 000 FCFA via un funnel IA. 8 inscrits en 10 jours." },
                  { day: "Semaine 4", text: "Active le chatbot sur sa page : répond aux prospects froids pendant qu'il dort. +40% de conversion." },
                  { day: "Mois 2", text: "Ajoute une formation vidéo (générée à 80% via AI Studio) à 35 000 FCFA. 25 ventes la 1ère semaine." },
                  { day: "Mois 3", text: "1,6 M FCFA sur le mois entre mentoring + formations + abonnement communauté. CA doublé." },
                ],
                result: "CA doublé (×2) en 3 mois",
              },
              {
                tag: "Créateur",
                avatar: "from-amber-500 to-orange-500",
                initials: "IO",
                title: "Le créateur qui transforme un ebook en 800 000 F",
                person: "Ibrahim Ouattara, consultant freelance à Ouagadougou",
                steps: [
                  { day: "Jour 1", text: "Il a un PDF 40 pages sur le freelancing qu'il donnait gratuitement. Décide de le monétiser." },
                  { day: "Jour 2", text: "Upload sur Novakou. AI Studio génère une page de vente qui transforme le PDF en 'Guide Complet Freelance Pro' 12 500 FCFA." },
                  { day: "Jour 3", text: "Le funnel IA ajoute un order bump 'Pack 50 Templates Devis' à +7 500 FCFA — 35% l'acceptent." },
                  { day: "Semaine 1", text: "Partage 2 fois sur WhatsApp + 1 post LinkedIn. 15 ventes. 187 500 FCFA." },
                  { day: "Semaine 3", text: "Le chatbot IA commence à générer des leads chauds depuis la boutique. Il ajoute une formation vidéo (25 000 FCFA) créée via AI Studio." },
                  { day: "Mois 2", text: "65 ventes cumulées (ebook + formation + bumps). 815 000 FCFA récoltés. Il lance sa communauté privée." },
                ],
                result: "800 000 FCFA depuis un ebook gratuit",
              },
            ].map((story, i) => (
              <RevealOnScroll key={i}>
                <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-10 shadow-lg">
                  <div className="flex items-start gap-5 mb-6 flex-wrap">
                    <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${story.avatar} flex items-center justify-center text-white font-bold flex-shrink-0`}>
                      {story.initials}
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#006e2f]">{story.tag}</p>
                      <h3 className="text-xl md:text-2xl font-extrabold text-[#191c1e] mt-1">{story.title}</h3>
                      <p className="text-sm text-[#5c647a] mt-1">{story.person}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl md:text-3xl font-black text-[#006e2f]">{story.result}</p>
                    </div>
                  </div>
                  <ol className="space-y-3 border-l-2 border-[#006e2f]/20 pl-5">
                    {story.steps.map((s, j) => (
                      <li key={j} className="relative">
                        <span className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-[#006e2f]" />
                        <p className="text-[11px] font-bold uppercase tracking-widest text-[#006e2f]">{s.day}</p>
                        <p className="text-sm text-[#191c1e] leading-relaxed mt-0.5">{s.text}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9.5 SECURITY + TRUST ─────────────────────────────────── */}
      <section className="py-16 md:py-24 px-4 md:px-8 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-12">
              <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 mb-3">🔒 Confiance & sécurité</p>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
                Ton argent et tes données <span className="text-emerald-400">en sécurité</span>
              </h2>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: "lock", label: "SSL 256-bit", text: "Toutes les données chiffrées en transit" },
              { icon: "verified", label: "Escrow 48h", text: "Ton argent bloqué 48h puis libéré sur ton wallet" },
              { icon: "shield", label: "RGPD + loi locale", text: "Conforme Sénégal, Côte d'Ivoire, Bénin" },
              { icon: "insights", label: "99.9% uptime", text: "Infra Vercel + Supabase EU" },
            ].map((t, i) => (
              <RevealOnScroll key={i} delay={i * 80}>
                <div className="bg-slate-800 rounded-2xl p-5 text-center h-full">
                  <span className="material-symbols-outlined text-emerald-400 text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>{t.icon}</span>
                  <p className="font-bold text-base mt-2">{t.label}</p>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{t.text}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ── 10. FAQ ÉTENDUE ───────────────────────────────────────── */}
      <section className="py-16 md:py-32 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-10 md:mb-14">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#006e2f] mb-3">FAQ</p>
              <h2 className="text-3xl md:text-5xl font-extrabold text-[#191c1e] tracking-tight">
                Tout ce que tu te demandes
              </h2>
            </div>
          </RevealOnScroll>
          <RevealOnScroll>
            <FAQAccordion
              items={[
                { q: "Combien ça coûte vraiment ?", a: "10% de commission sur chaque vente, zéro abonnement, zéro frais caché, zéro frais de mise en place. Tu ne paies que quand tu gagnes. Les 10% couvrent : hébergement, frais bancaires de la plateforme, infra IA (5 assistants Claude), emails, support, stockage vidéo." },
                { q: "Comment je suis payé ?", a: "Chaque vente est escrow pendant 48h (protection achat). Ensuite les fonds sont libérés sur ton wallet Novakou. Tu demandes un retrait quand tu veux — on envoie sur ton Orange Money, Wave, MTN, carte ou compte bancaire. Retrait minimum : 2 500 FCFA." },
                { q: "Est-ce que mes clients peuvent payer en Mobile Money ?", a: "Oui, c'est LA fonctionnalité qui nous distingue. Tes clients peuvent payer en Orange Money (Sénégal, Côte d'Ivoire, Cameroun, Mali), Wave (Sénégal, Côte d'Ivoire), MTN MoMo (tous pays MTN), Moov Money, Free Money. Et aussi carte bancaire Visa/Mastercard, et même virement SEPA pour la diaspora." },
                { q: "L'IA est vraiment gratuite ?", a: "Oui, les 5 assistants IA Claude Sonnet 4.6 sont inclus dans les 10% de commission. Pas besoin de clé OpenAI, pas d'abonnement séparé. La première fois tu dois créer un compte Puter (gratuit, instantané) qui te donne des crédits pour utiliser l'IA. Plus que généreux pour un usage normal." },
                { q: "Et si je ne veux plus utiliser Novakou ?", a: "Zéro lock-in. Tu peux exporter tous tes clients (CSV), télécharger tes ventes, migrer tes produits. Ton contenu est à toi. Si tu décides de partir, on aide même à la migration." },
                { q: "Est-ce que je peux utiliser mon propre domaine ?", a: "Oui. Connecte ton domaine en quelques clics (boutique.tonsite.com). Certificat SSL automatique. Ou utilise l'adresse gratuite novakou.com/boutique/tonnom." },
                { q: "Comment sont protégés mes contenus vidéo ?", a: "Chaque vidéo a un watermark dynamique avec l'email de l'acheteur. On limite le nombre d'IP connectées par compte. Les vidéos sont streamées (pas téléchargeables). Les extensions de téléchargement sont bloquées. Ça n'empêche pas 100% du piratage mais ça dissuade 95% des gens." },
                { q: "Y a-t-il un programme d'affiliation ?", a: "Oui. Chaque vendeur peut activer l'affiliation sur ses produits avec la commission qu'il veut (10% à 50%). Les affiliés reçoivent un lien unique, suivent leurs conversions en temps réel, et sont payés automatiquement après chaque vente validée." },
                { q: "Combien de temps pour lancer ma boutique ?", a: "Littéralement 3 minutes pour une boutique fonctionnelle avec 1 produit. 15-30 minutes pour quelque chose de poli avec AI Studio (page de vente générée) + chatbot configuré + méthodes de paiement. Tout est prêt clé en main." },
                { q: "Je n'ai pas encore de produit, je peux m'inscrire ?", a: "Oui ! Inscris-toi, utilise le Coach IA Apprenant pour clarifier ton offre, AI Studio pour rédiger la page quand tu auras ton produit. Zéro obligation de publier tout de suite." },
                { q: "Est-ce que Novakou marche pour les mentors (coaching 1-to-1) ?", a: "Oui. L'espace mentor permet de proposer des sessions individuelles avec calendrier intégré, paiement automatique, visio (zoom/meet externe). Le Coach IA Mentor t'aide à structurer tes offres et à vendre." },
                { q: "J'ai une agence avec plusieurs créateurs, c'est compatible ?", a: "Oui. Le compte agence permet d'ajouter plusieurs vendeurs sous une même entité, partager les revenus, voir les stats globales. Pricing dédié pour les agences." },
                { q: "Vous supportez les abonnements récurrents ?", a: "Oui. Memberships mensuel ou annuel, trial gratuit, accès à du contenu premium ou à une communauté privée. Facturation auto via Mobile Money ou carte." },
                { q: "Comment je contacte le support en cas de problème ?", a: "Email support@novakou.com (réponse sous 24h, souvent beaucoup plus rapide). Chat in-app pour les vendeurs Pro. Centre d'aide avec 80+ articles. Discord/WhatsApp communauté des vendeurs." },
                { q: "Vous prenez quelle commission sur les paiements par carte bancaire ?", a: "Les mêmes 10% que sur tout le reste. Les frais Visa/Mastercard (~3%) sont inclus dans notre 10%. Zéro surprise." },
              ]}
            />
          </RevealOnScroll>
        </div>
      </section>


      {/* ── 10B. AVIS & TÉMOIGNAGES ──────────────────────────────── */}
      <section className="py-16 md:py-24 px-4 md:px-8 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 md:mb-14">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#006e2f] mb-3">Ils nous font confiance</p>
            <h2 className="text-3xl md:text-5xl font-extrabold text-[#191c1e] tracking-tight">
              Des créateurs qui ont tout changé
            </h2>
            <p className="text-[#5c647a] text-base md:text-lg mt-4 max-w-2xl mx-auto">
              Témoignages authentiques d&apos;entrepreneurs qui vivent aujourd&apos;hui de leurs produits digitaux.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Aminata Diallo",
                role: "Coach business · Dakar",
                initial: "AD",
                text: "En 3 mois sur Novakou, j'ai vendu pour 2,4 M FCFA. La plateforme fait TOUT le travail technique — je me concentre juste sur mes élèves.",
                rating: 5,
                gradient: "from-[#006e2f] to-[#22c55e]",
              },
              {
                name: "Jean-Baptiste Kouassi",
                role: "Formateur marketing · Abidjan",
                initial: "JK",
                text: "J'étais sur Systeme.io avant. Novakou est 3x moins cher et parle français africain. Les Mobile Money en natif c'est décisif pour ma clientèle.",
                rating: 5,
                gradient: "from-[#f59e0b] to-[#dc2626]",
              },
              {
                name: "Marie-Claire Assouma",
                role: "Créatrice templates · Lomé",
                initial: "MA",
                text: "Je ne savais rien du marketing. Les tunnels pré-construits de Novakou m'ont donné une page de vente qui convertit à 4%. 450 ventes en 2 mois.",
                rating: 5,
                gradient: "from-[#7c3aed] to-[#a855f7]",
              },
            ].map((t) => (
              <div key={t.name} className="bg-white rounded-2xl border border-gray-100 p-6 md:p-7 hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <span key={i} className="material-symbols-outlined text-[16px] text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  ))}
                </div>
                <p className="text-sm text-[#191c1e] leading-relaxed mb-5 italic">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                    {t.initial}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#191c1e]">{t.name}</p>
                    <p className="text-[11px] text-[#5c647a]">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 11. CTA FINAL ────────────────────────────────────────── */}
      <section className="py-16 md:py-24 px-4 md:px-8 relative overflow-hidden">
        <div className="max-w-5xl mx-auto bg-slate-900 squircle p-8 md:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[#006e2f]/20 blur-[120px] animate-pulse pointer-events-none"></div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 md:mb-8 relative z-10">
            Prêt à passer au niveau supérieur ?
          </h2>
          <p className="text-slate-400 text-base md:text-lg mb-8 md:mb-12 max-w-2xl mx-auto relative z-10">
            Rejoignez la nouvelle élite des créateurs digitaux et commencez à vendre dès aujourd&apos;hui.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center relative z-10">
            <Link
              href="/inscription?role=vendeur"
              className="text-white px-8 md:px-10 py-4 md:py-5 rounded-full text-lg md:text-xl font-extrabold hover:scale-105 transition-transform inline-block"
              style={{
                background: "linear-gradient(to right, #006e2f, #22c55e)",
                boxShadow: "0 25px 50px rgba(0,110,47,0.4)",
              }}
            >
              Démarrer gratuitement
            </Link>
            <Link
              href="/contact"
              className="px-8 md:px-10 py-4 md:py-5 bg-white/10 text-white rounded-full text-lg md:text-xl font-bold border border-white/20 hover:bg-white/20 transition-colors inline-block"
            >
              Parler à un expert
            </Link>
          </div>
          <p className="text-slate-500 mt-6 text-sm italic relative z-10">Pas de carte bancaire requise. Annulez à tout moment.</p>
        </div>
      </section>
    </>
  );
}
