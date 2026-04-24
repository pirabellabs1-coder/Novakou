import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { RevenueSimulator } from "@/components/formations/RevenueSimulator";
import { CreatorsJoinBadge, HeroBadge } from "@/components/formations/PublicStatsBadge";
import { BestSellers } from "@/components/formations/BestSellers";

export const metadata: Metadata = {
  title: "Novakou | La plateforme tout-en-un pour vendre en Afrique francophone",
  description:
    "Boutique, paiements Mobile Money, IA intégrée. Vends tes formations, ebooks et services en 3 minutes. 10 % de commission, zéro abonnement.",
};

const serifFont = { fontFamily: "'Fraunces', Georgia, serif" } as const;

/* ─── Petits helpers visuels réutilisables ─────────────────── */
function CategoryPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block px-4 py-1.5 rounded-full bg-[#191c1e] text-white text-[11px] font-bold tracking-[0.1em] mb-6">
      {children}
    </span>
  );
}

function PrimaryButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#006e2f] text-white text-sm md:text-base font-bold hover:bg-[#005a26] transition-colors shadow-[0_10px_30px_rgba(0,110,47,0.25)]"
    >
      {children}
    </Link>
  );
}

function OutlineButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-[#191c1e] text-sm md:text-base font-bold border border-gray-200 hover:border-[#006e2f] hover:text-[#006e2f] transition-colors"
    >
      {children}
    </Link>
  );
}

export default async function FormationsPage() {
  return (
    <>
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 1. HERO — 1 colonne centrée, pas d'image                     */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="relative px-4 md:px-8 pt-16 pb-10 md:pb-16 max-w-6xl mx-auto text-center">
        <div className="flex justify-center mb-8">
          <HeroBadge />
        </div>

        <h1
          className="text-5xl md:text-7xl lg:text-[88px] font-semibold tracking-[-0.02em] leading-[1] text-[#191c1e]"
          style={serifFont}
        >
          Vends tes formations<br />
          <span className="text-[#006e2f] italic">partout en Afrique</span><br />
          francophone.
        </h1>

        <p className="text-base md:text-xl text-[#5c647a] max-w-2xl mx-auto mt-8 leading-relaxed">
          Boutique, paiements Mobile Money, tunnels de vente et 5 assistants IA inclus. Lance-toi en 3 minutes, 10 % de commission sur tes ventes, zéro abonnement.
        </p>

        <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center mt-10">
          <PrimaryButton href="/inscription?role=vendeur">
            <span>Lancer ma boutique gratuitement</span>
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </PrimaryButton>
          <OutlineButton href="/explorer">Explorer le catalogue</OutlineButton>
        </div>

        <div className="flex items-center gap-4 justify-center mt-10">
          <div className="flex -space-x-2">
            {[
              "https://lh3.googleusercontent.com/aida-public/AB6AXuCGX9twRtRgGltcxTW9EJqsOv96cSwnoA52sgPvi8MP01qX3Op1EHt2i0VBzfz-b6mSWa7jF_Tx7d3IDD85s0coZmYh7gfA7FB1N11CoeKDxxswhjkbzIvMehRzugu_lVYtx6Kqvl2lTR5vy15PIDDO7aQDWdNKgxQH_uEL7wHsK7GTFlqregV6cfryXRuDPzfPYQh4c-Af_Wv6qIGmS6JhUTKx7dsEmav4iWsoRfZhoNwe-uafQJCMFkqq0iR7RbD4IR8YIEA1JjhG",
              "https://lh3.googleusercontent.com/aida-public/AB6AXuD9Rh0ecjM8nGvWfG_C0KbaGYWrSmu8xmHRjCO70WBZ0-5sZv2Q2D-Fabrnx0JT4aLiEkSG11YZCkMwiEefpWTFRezj3cUHsuIsBJvS1JtkK_7oFybZDfAHwmDm-x3XW245JemBnQqaJLvjzqZYEmm5vcb8svccewMahXmGTu_kVEEV9BW2z0WeqRDmHbfwA8bpGilxMYyCmloYq4f1ntMSEdBg3G7z2jFkbA8eyRqogewLAHfdnyJW3V2nvgIKHN4cLsu4rdNAJIec",
              "https://lh3.googleusercontent.com/aida-public/AB6AXuCWvzWuZ26p82Ka65aS2FRWuFajMaeVjZFTmt2eKbeFM-76x_bYcQq7VTJJPuV5cz-ioD79i1dCmXQ3qMqU-4aLD4VUgTHd-i9NV5iPOaHec279DuNt-RDWnmVDNA8g3upiBszScHtBOVjg7zbx_pugaYRw1GK0SpNDOaVQzM_XwYrvSvAxx8P_uLrdUAUw3_GBisqCKKjiv2-RVRePMSUtMDEUgzmPQxAbgo6mJ329ft5SkMx0mv_meMJKtwORR4npogpFuRKhme5E",
            ].map((src, i) => (
              <Image
                key={i}
                className="w-9 h-9 rounded-full border-2 border-white object-cover"
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
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 2. DASHBOARD PREVIEW — grande mockup UI vendeur              */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="relative px-4 md:px-8 pb-20 md:pb-28">
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-[32px] bg-[#ecfdf5] p-4 md:p-8 overflow-hidden">
            {/* Glow décoratif vert */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#22c55e]/20 blur-3xl rounded-full pointer-events-none" />

            {/* Mockup dashboard noir */}
            <div className="relative rounded-2xl bg-[#0d1117] border border-slate-800 overflow-hidden shadow-2xl">
              {/* Barre top avec dots */}
              <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-800 bg-slate-900/50">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
                <div className="flex-1 flex justify-center">
                  <div className="text-[11px] text-slate-500 font-mono">novakou.com/vendeur/dashboard</div>
                </div>
              </div>

              {/* Contenu dashboard */}
              <div className="p-5 md:p-8 grid grid-cols-12 gap-4 md:gap-5">
                {/* Sidebar */}
                <div className="hidden md:block col-span-3 space-y-2">
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">Espace vendeur</div>
                  {[
                    { icon: "dashboard", label: "Tableau de bord", active: true },
                    { icon: "storefront", label: "Mes produits" },
                    { icon: "receipt_long", label: "Transactions" },
                    { icon: "account_balance_wallet", label: "Revenus & retraits" },
                    { icon: "campaign", label: "Marketing" },
                    { icon: "auto_awesome", label: "AI Studio" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs ${
                        item.active ? "bg-[#006e2f] text-white" : "text-slate-400"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                    </div>
                  ))}
                </div>

                {/* Main content */}
                <div className="col-span-12 md:col-span-9 space-y-4">
                  {/* Stats cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: "Ventes aujourd'hui", value: "125 000 F", sub: "+12 %", positive: true },
                      { label: "Produits actifs", value: "14", sub: "+2 ce mois" },
                      { label: "Clients", value: "1 248", sub: "+18" },
                      { label: "Taux conv.", value: "4,2 %", sub: "+0,8 %", positive: true },
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-3">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">{s.label}</p>
                        <p className="text-lg md:text-xl font-bold text-white mt-1">{s.value}</p>
                        <p className={`text-[10px] mt-0.5 ${s.positive ? "text-emerald-400" : "text-slate-400"}`}>
                          {s.sub}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Chart + commandes */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div className="md:col-span-3 rounded-xl bg-slate-800/60 border border-slate-700/50 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-white">Revenus 7 derniers jours</p>
                        <span className="text-[10px] text-emerald-400 font-bold">+24 %</span>
                      </div>
                      {/* Mini bar chart */}
                      <div className="flex items-end justify-between gap-1.5 h-24 md:h-28">
                        {[40, 55, 35, 70, 45, 85, 100].map((h, i) => (
                          <div key={i} className="flex-1 flex flex-col gap-1 items-stretch">
                            <div
                              className="bg-gradient-to-t from-[#006e2f] to-[#22c55e] rounded-t-md"
                              style={{ height: `${h}%` }}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-500 mt-2">
                        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
                          <span key={i}>{d}</span>
                        ))}
                      </div>
                    </div>

                    <div className="md:col-span-2 rounded-xl bg-slate-800/60 border border-slate-700/50 p-4">
                      <p className="text-xs font-bold text-white mb-3">Dernières ventes</p>
                      <div className="space-y-2.5">
                        {[
                          { name: "Aminata D.", amount: "25 000 F", icon: "person" },
                          { name: "Kouakou B.", amount: "15 000 F", icon: "person" },
                          { name: "Fatou M.", amount: "12 500 F", icon: "person" },
                        ].map((o, i) => (
                          <div key={i} className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center">
                              <span className="material-symbols-outlined text-emerald-400 text-[14px]">{o.icon}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] text-white font-medium truncate">{o.name}</p>
                              <p className="text-[10px] text-slate-500">{o.amount}</p>
                            </div>
                            <span className="text-[9px] text-emerald-400 font-bold">payé</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 3. BEST-SELLERS                                              */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="bg-slate-50 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <CategoryPill>Déjà en vente</CategoryPill>
            <h2 className="text-4xl md:text-6xl font-semibold tracking-tight text-[#191c1e] leading-[1.1]" style={serifFont}>
              Les best-sellers du moment
            </h2>
            <p className="text-[#5c647a] mt-4 max-w-xl mx-auto">
              Les créations qui génèrent déjà des revenus. Explore le catalogue complet.
            </p>
          </div>
          <BestSellers />
          <div className="text-center mt-10">
            <OutlineButton href="/explorer">
              Explorer tout le catalogue
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </OutlineButton>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 4. FEATURE — Boutique en ligne                               */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <CategoryPill>Boutique en ligne</CategoryPill>
            <h2 className="text-4xl md:text-6xl font-semibold tracking-tight text-[#191c1e] leading-[1.1]" style={serifFont}>
              Lance ta boutique en 5 minutes
            </h2>
            <p className="text-[#5c647a] mt-4 max-w-2xl mx-auto">
              Ta boutique publique sur un sous-domaine gratuit ou ton nom de domaine. Ajoute formations, ebooks, produits, coaching en quelques clics.
            </p>
            <div className="mt-6">
              <PrimaryButton href="/inscription?role=vendeur">Créer ma boutique gratuitement</PrimaryButton>
            </div>
          </div>

          {/* Mockup : boutique publique */}
          <div className="relative rounded-[32px] bg-[#ecfdf5] p-4 md:p-8 overflow-hidden mt-10">
            <div className="absolute -top-20 right-10 w-64 h-64 bg-[#22c55e]/15 blur-3xl rounded-full pointer-events-none" />
            <div className="relative rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden">
              {/* Hero boutique */}
              <div className="bg-gradient-to-br from-[#006e2f] to-[#22c55e] p-6 md:p-8 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white text-xl font-bold">AD</div>
                <div>
                  <p className="text-white font-bold text-lg md:text-xl">Aminata Diallo</p>
                  <p className="text-white/80 text-xs md:text-sm">Coach business · aminata.novakou.com</p>
                </div>
              </div>
              {/* Grille produits */}
              <div className="p-4 md:p-6 grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {[
                  { t: "Formation Instagram Pro", p: "25 000 F", img: "trending_up" },
                  { t: "Pack 50 Templates", p: "12 500 F", img: "grid_view" },
                  { t: "Coaching 1-to-1", p: "45 000 F", img: "support_agent" },
                ].map((p, i) => (
                  <div key={i} className="rounded-xl border border-gray-100 overflow-hidden hover:border-[#006e2f]/30 transition-colors">
                    <div className="aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                      <span className="material-symbols-outlined text-slate-400 text-[32px]">{p.img}</span>
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-bold text-[#191c1e] line-clamp-1">{p.t}</p>
                      <p className="text-sm font-black text-[#006e2f] mt-1">{p.p}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 5. FEATURE — Paiements                                       */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 px-4 md:px-8 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <CategoryPill>Paiements</CategoryPill>
            <h2 className="text-4xl md:text-6xl font-semibold tracking-tight text-[#191c1e] leading-[1.1]" style={serifFont}>
              Accepte les paiements du monde entier
            </h2>
            <p className="text-[#5c647a] mt-4 max-w-2xl mx-auto">
              Mobile Money (Orange, Wave, MTN, Moov), cartes Visa / Mastercard, virement SEPA. Tes clients paient comme ils veulent.
            </p>
          </div>

          {/* Mockup : checkout avec options */}
          <div className="relative rounded-[32px] bg-[#fef3c7] p-4 md:p-8 overflow-hidden mt-10">
            <div className="absolute -top-20 left-10 w-64 h-64 bg-amber-300/30 blur-3xl rounded-full pointer-events-none" />
            <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card checkout */}
              <div className="bg-white rounded-2xl p-5 md:p-6 shadow-xl border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-[#191c1e]">Finaliser l&apos;achat</span>
                  <span className="text-xs text-[#5c647a]">Étape 2 / 3</span>
                </div>
                <div className="space-y-2.5">
                  {[
                    { name: "Orange Money", icon: "📱", highlight: true },
                    { name: "Wave", icon: "🌊" },
                    { name: "MTN MoMo", icon: "💳" },
                    { name: "Carte bancaire", icon: "💳" },
                  ].map((opt) => (
                    <div
                      key={opt.name}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                        opt.highlight ? "border-[#006e2f] bg-[#006e2f]/5" : "border-gray-200"
                      }`}
                    >
                      <span className="text-xl">{opt.icon}</span>
                      <span className="text-sm font-semibold text-[#191c1e] flex-1">{opt.name}</span>
                      {opt.highlight && (
                        <span className="w-4 h-4 rounded-full border-2 border-[#006e2f] flex items-center justify-center">
                          <span className="w-2 h-2 rounded-full bg-[#006e2f]" />
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <button className="w-full mt-5 px-5 py-3 rounded-xl bg-[#006e2f] text-white text-sm font-bold">
                  Payer 25 000 F avec Orange Money
                </button>
              </div>

              {/* Liste payouts */}
              <div className="bg-white rounded-2xl p-5 md:p-6 shadow-xl border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-[#191c1e]">Retraits récents</span>
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">3 payés cette semaine</span>
                </div>
                <div className="space-y-3">
                  {[
                    { method: "Orange Money", phone: "+221 77 •••• 567", amount: "180 000 F", status: "Reçu", time: "Il y a 2 h" },
                    { method: "Wave", phone: "+225 07 •••• 234", amount: "95 000 F", status: "Reçu", time: "Hier" },
                    { method: "Virement bancaire", phone: "BIC Ecobank", amount: "450 000 F", status: "Reçu", time: "3 jours" },
                  ].map((p, i) => (
                    <div key={i} className="flex items-center justify-between pb-3 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-sm font-bold text-[#191c1e]">{p.method}</p>
                        <p className="text-[11px] text-[#5c647a]">{p.phone}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-[#006e2f]">+{p.amount}</p>
                        <p className="text-[10px] text-[#5c647a]">{p.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 6. FEATURE — IA intégrée                                     */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <CategoryPill>IA intégrée</CategoryPill>
            <h2 className="text-4xl md:text-6xl font-semibold tracking-tight text-[#191c1e] leading-[1.1]" style={serifFont}>
              L&apos;IA qui rédige, répond, optimise
            </h2>
            <p className="text-[#5c647a] mt-4 max-w-2xl mx-auto">
              Claude Sonnet 4.6 intégré. Génère tes pages de vente, crée tes tunnels, réponds aux acheteurs 24/7 avec ton ton. Inclus dans les 10 %.
            </p>
            <div className="mt-6">
              <OutlineButton href="/vendeur/ai-studio">Découvrir AI Studio</OutlineButton>
            </div>
          </div>

          {/* Mockup chatbot conversation */}
          <div className="relative rounded-[32px] bg-gradient-to-br from-[#ecfdf5] to-[#d1fae5] p-4 md:p-10 overflow-hidden mt-10">
            <div className="absolute top-10 right-10 w-72 h-72 bg-[#22c55e]/20 blur-3xl rounded-full pointer-events-none" />
            <div className="relative max-w-xl mx-auto space-y-3">
              {/* Message visiteur */}
              <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 text-sm shadow-md border border-gray-100 max-w-md">
                Bonjour, combien coûte votre formation Excel et est-ce que je peux payer en 2 fois via Orange Money ?
              </div>

              {/* Réponse IA */}
              <div className="flex justify-end">
                <div className="bg-[#006e2f] text-white rounded-2xl rounded-br-sm px-4 py-3 text-sm shadow-md max-w-md">
                  Bonjour et bienvenue !<br /><br />
                  La <strong>Formation Excel pour débutants</strong> est à <strong>15 000 FCFA</strong> (offre de lancement). Oui, tu peux payer en <strong>2 fois de 7 500 FCFA</strong> via Orange Money, Wave ou MTN MoMo.
                </div>
              </div>

              {/* Badge IA */}
              <div className="flex justify-end">
                <div className="inline-flex items-center gap-1.5 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-[#5c647a] shadow-sm border border-gray-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                  Claude Sonnet 4.6 · 3 s
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 7. FEATURE — Tunnels de vente                                */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 px-4 md:px-8 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <CategoryPill>Tunnels de vente</CategoryPill>
            <h2 className="text-4xl md:text-6xl font-semibold tracking-tight text-[#191c1e] leading-[1.1]" style={serifFont}>
              Des tunnels qui convertissent
            </h2>
            <p className="text-[#5c647a] mt-4 max-w-2xl mx-auto">
              Landing page, checkout, upsell, page de remerciement. Éditeur visuel drag & drop. Tunnel complet généré par l&apos;IA en 30 secondes.
            </p>
          </div>

          {/* Mockup tunnel 4 étapes */}
          <div className="relative rounded-[32px] bg-[#f5f3ff] p-4 md:p-10 overflow-hidden mt-10">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-violet-200/40 to-pink-100/40 pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-center gap-2 md:gap-3 flex-wrap">
                {[
                  { n: "1", t: "Landing", icon: "rocket_launch", active: true },
                  { n: "2", t: "Checkout", icon: "shopping_cart" },
                  { n: "3", t: "Upsell", icon: "trending_up" },
                  { n: "4", t: "Merci", icon: "celebration" },
                ].map((s, i, arr) => (
                  <div key={s.n} className="flex items-center gap-2 md:gap-3">
                    <div className={`rounded-2xl px-4 py-3 md:px-5 md:py-4 ${s.active ? "bg-[#191c1e] text-white shadow-xl" : "bg-white text-[#191c1e] border border-gray-200"}`}>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">{s.icon}</span>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest opacity-60">Étape {s.n}</p>
                          <p className="text-sm font-bold">{s.t}</p>
                        </div>
                      </div>
                    </div>
                    {i < arr.length - 1 && (
                      <span className="material-symbols-outlined text-[#5c647a]">arrow_forward</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Zone contenu étape active */}
              <div className="mt-6 mx-auto max-w-xl bg-white rounded-2xl p-5 md:p-6 shadow-xl border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-purple-500 text-[18px]">auto_awesome</span>
                  <span className="text-[11px] font-bold text-purple-600">Généré par l&apos;IA · modifiable</span>
                </div>
                <p className="text-xl md:text-2xl font-bold text-[#191c1e] mb-2" style={serifFont}>
                  Maîtrise Excel en 5 heures, sans jamais bloquer
                </p>
                <p className="text-sm text-[#5c647a] mb-4">
                  Formation vidéo complète + 50 exercices corrigés + support WhatsApp. Offre de lancement limitée aux 100 premiers.
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-11 rounded-xl bg-[#006e2f] text-white text-sm font-bold flex items-center justify-center">
                    Je veux la formation · 15 000 F
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 8. FEATURE — Récupération d'abandons                         */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <CategoryPill>Récupération d&apos;abandons</CategoryPill>
            <h2 className="text-4xl md:text-6xl font-semibold tracking-tight text-[#191c1e] leading-[1.1]" style={serifFont}>
              Ne perds plus jamais de vente
            </h2>
            <p className="text-[#5c647a] mt-4 max-w-2xl mx-auto">
              Chaque paiement échoué est tracé. Tu récupères l&apos;email et le numéro du visiteur. 2 emails de relance envoyés automatiquement.
            </p>
          </div>

          {/* Mockup liste abandons */}
          <div className="relative rounded-[32px] bg-[#fee2e2] p-4 md:p-10 overflow-hidden mt-10">
            <div className="absolute top-0 right-20 w-72 h-72 bg-rose-300/30 blur-3xl rounded-full pointer-events-none" />
            <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="p-5 border-b border-gray-100">
                <p className="text-xs font-bold text-[#191c1e]">Abandons & paiements échoués</p>
                <p className="text-[10px] text-[#5c647a]">Les visiteurs qui ont tenté d&apos;acheter sans finaliser</p>
              </div>
              {/* Liste */}
              {[
                { name: "Kouakou B.", email: "kouakou@gmail.com", product: "Formation Instagram", amount: "25 000 F", status: "Rappel #1 envoyé", tag: "emerald" },
                { name: "Fatou M.", email: "fatou.m@outlook.fr", product: "Pack Templates Excel", amount: "12 500 F", status: "Échec Orange Money", tag: "amber" },
                { name: "Ibrahim O.", email: "ibra@gmail.com", product: "Coaching 1-to-1", amount: "45 000 F", status: "Récupéré ✓", tag: "emerald" },
              ].map((a, i) => (
                <div key={i} className="p-4 md:p-5 flex items-center gap-3 md:gap-4 border-b border-gray-100 last:border-0">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-slate-400 text-[18px]">person</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#191c1e] truncate">{a.name}</p>
                    <p className="text-[11px] text-[#5c647a] truncate">{a.email}</p>
                    <p className="text-[11px] text-[#5c647a] mt-0.5">{a.product}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-black text-[#191c1e]">{a.amount}</p>
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        a.tag === "emerald" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {a.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 9. SIMULATEUR DE REVENUS                                     */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <RevenueSimulator />

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 10. TÉMOIGNAGES                                              */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <CategoryPill>Ils utilisent Novakou</CategoryPill>
            <h2 className="text-4xl md:text-6xl font-semibold tracking-tight text-[#191c1e] leading-[1.1]" style={serifFont}>
              Des créateurs qui vendent vraiment
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                name: "Aminata Diallo",
                role: "Coach business · Dakar",
                initial: "AD",
                text: "En 3 mois sur Novakou, j'ai vendu pour 2,4 M FCFA. La plateforme fait le travail technique, je me concentre sur mes élèves.",
                result: "2,4 M FCFA en 3 mois",
              },
              {
                name: "Jean-Baptiste Kouassi",
                role: "Formateur marketing · Abidjan",
                initial: "JK",
                text: "J'étais sur une plateforme étrangère avant. Novakou parle français africain et Mobile Money en natif, ça change tout pour mes clients.",
                result: "95 % paiements Mobile Money",
              },
              {
                name: "Marie-Claire Assouma",
                role: "Créatrice templates · Lomé",
                initial: "MA",
                text: "Les tunnels pré-construits m'ont donné une page qui convertit à 4 %. Sans rien coder, sans rien configurer pendant des heures.",
                result: "450 ventes en 2 mois",
              },
            ].map((t) => (
              <div key={t.name} className="bg-white rounded-2xl border border-gray-100 p-6 h-full flex flex-col">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className="material-symbols-outlined text-[16px] text-[#22c55e]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      star
                    </span>
                  ))}
                </div>
                <p className="text-sm text-[#191c1e] leading-relaxed mb-5 flex-1">« {t.text} »</p>
                <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#006e2f] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {t.initial}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#191c1e]">{t.name}</p>
                      <p className="text-[11px] text-[#5c647a]">{t.role}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[#006e2f] whitespace-nowrap">{t.result}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 11. TARIFICATION                                             */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 px-4 md:px-8 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <CategoryPill>Tarification</CategoryPill>
            <h2 className="text-4xl md:text-6xl font-semibold tracking-tight text-[#191c1e] leading-[1.1]" style={serifFont}>
              Simple, transparent, honnête
            </h2>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 p-8 md:p-12 text-center shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#006e2f] mb-2">Commission unique</p>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-7xl md:text-8xl font-black text-[#191c1e]" style={serifFont}>10</span>
              <span className="text-4xl md:text-5xl font-black text-[#191c1e]">%</span>
            </div>
            <p className="text-[#5c647a] text-base mt-3">par vente · zéro abonnement · zéro frais caché</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-10 text-left">
              {[
                { t: "0 F", d: "Frais de lancement" },
                { t: "0 F", d: "Abonnement mensuel" },
                { t: "0 F", d: "Frais de retrait" },
                { t: "60+", d: "Fonctionnalités incluses" },
              ].map((s) => (
                <div key={s.d} className="bg-slate-50 rounded-xl p-4">
                  <p className="text-lg font-extrabold text-[#006e2f]">{s.t}</p>
                  <p className="text-xs text-[#5c647a] mt-1">{s.d}</p>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <PrimaryButton href="/inscription?role=vendeur">
                Lancer ma boutique maintenant
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </PrimaryButton>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 12. FAQ                                                      */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 px-4 md:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <CategoryPill>Questions fréquentes</CategoryPill>
            <h2 className="text-4xl md:text-6xl font-semibold tracking-tight text-[#191c1e] leading-[1.1]" style={serifFont}>
              Tout ce qu&apos;on nous demande
            </h2>
          </div>

          <div className="space-y-3">
            {[
              { q: "Combien ça coûte vraiment ?", a: "10 % de commission sur chaque vente. Zéro abonnement, zéro frais caché, zéro frais de mise en place. Tu ne paies que quand tu gagnes." },
              { q: "Mes clients peuvent-ils payer en Mobile Money ?", a: "Oui, c'est natif. Orange Money, Wave, MTN MoMo, Moov Money, Free Money, plus les cartes Visa / Mastercard et le virement SEPA pour la diaspora." },
              { q: "Comment je suis payé ?", a: "Escrow 48 h (protection acheteur) puis les fonds arrivent sur ton wallet. Tu retires vers Mobile Money, carte ou virement quand tu veux. Retrait minimum 2 500 F." },
              { q: "L'IA est-elle vraiment incluse ?", a: "Oui. Les 6 assistants Claude Sonnet 4.6 (AI Studio, Tunnel Builder, Chatbot, 3 Coach IA) sont inclus dans les 10 %. Aucune clé OpenAI à gérer." },
              { q: "Est-ce que je peux utiliser mon propre domaine ?", a: "Oui. Connecte ton domaine (boutique.tonsite.com) en quelques clics, certificat SSL automatique. Ou garde l'adresse gratuite tonnom.novakou.com." },
              { q: "Combien de temps pour lancer ma boutique ?", a: "3 minutes pour une boutique fonctionnelle avec un produit. 15 à 30 minutes pour quelque chose de poli avec AI Studio et chatbot configurés." },
              { q: "Et si je veux partir ?", a: "Zéro lock-in. Tu peux exporter tous tes clients (CSV), télécharger tes ventes, migrer tes produits. Ton contenu t'appartient." },
              { q: "Comment contacter le support ?", a: "Email support@novakou.com (réponse sous 24 h, souvent bien plus rapide). Centre d'aide 80+ articles. Communauté Discord et WhatsApp des vendeurs." },
            ].map((item, i) => (
              <details key={i} className="bg-white rounded-2xl border border-gray-100 group">
                <summary className="cursor-pointer px-5 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors list-none">
                  <span className="font-bold text-[#191c1e] text-base">{item.q}</span>
                  <span className="material-symbols-outlined text-[22px] text-[#5c647a] group-open:rotate-180 transition-transform">
                    expand_more
                  </span>
                </summary>
                <div className="px-5 pb-5 text-[#5c647a] text-sm leading-relaxed">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 13. CTA FINAL                                                */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 px-4 md:px-8">
        <div className="max-w-5xl mx-auto bg-[#006e2f] rounded-3xl p-8 md:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[#22c55e]/10 blur-3xl pointer-events-none" />
          <div className="relative">
            <h2 className="text-4xl md:text-6xl font-semibold text-white leading-[1.1] mb-5" style={serifFont}>
              Lance ta boutique<br />
              <span className="italic">en 3 minutes.</span>
            </h2>
            <p className="text-white/70 text-base md:text-lg mb-10 max-w-xl mx-auto">
              Rejoins les créateurs qui gagnent vraiment leur vie en vendant des formations et produits digitaux en Afrique francophone.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/inscription?role=vendeur"
                className="px-8 py-4 bg-white text-[#006e2f] rounded-full text-base md:text-lg font-extrabold hover:bg-slate-50 transition-colors inline-flex items-center justify-center gap-2"
              >
                Démarrer gratuitement
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </Link>
              <Link
                href="/contact"
                className="px-8 py-4 bg-transparent text-white rounded-full text-base md:text-lg font-bold border border-white/30 hover:bg-white/10 transition-colors inline-flex items-center justify-center"
              >
                Parler à un humain
              </Link>
            </div>
            <p className="text-white/50 mt-5 text-xs">Pas de carte bancaire requise · Annule à tout moment</p>
          </div>
        </div>
      </section>
    </>
  );
}
