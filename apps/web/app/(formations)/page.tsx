import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { RevenueSimulator } from "@/components/formations/RevenueSimulator";
import { CreatorsJoinBadge, HeroBadge } from "@/components/formations/PublicStatsBadge";
import { BestSellers } from "@/components/formations/BestSellers";

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

          {/* 5% Frais */}
          <div className="col-span-3 md:col-span-2 squircle p-6 md:p-8 flex flex-col justify-between" style={{ backgroundColor: "rgba(34,197,94,0.1)" }}>
            <div className="text-3xl md:text-4xl font-black text-[#006e2f]">5%</div>
            <div>
              <h3 className="font-bold text-[#191c1e]">Frais réduits</h3>
              <p className="text-xs text-[#5c647a] mt-1">On ne gagne que si vous gagnez. Zéro abonnement caché.</p>
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

      {/* ── 10. FAQ ───────────────────────────────────────────────── */}
      <section className="py-16 md:py-32 px-4 md:px-8">
        <div className="max-w-[768px] mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold mb-12 md:mb-16 text-center text-[#191c1e]">
            Des questions ?{" "}
            <span className="text-[#006e2f]">On y répond.</span>
          </h2>
          <div className="space-y-4">
            {[
              { q: "Est-ce que je peux vendre avec mon propre nom de domaine ?", a: "Oui, absolument. Vous pouvez connecter votre propre domaine en quelques clics ou utiliser notre sous-domaine gratuit .novakou.com" },
              { q: "Quels sont les frais sur les ventes ?", a: "Nous prélevons une commission unique de 5% sur vos ventes. Il n'y a aucun abonnement mensuel fixe, vous ne payez que lorsque vous gagnez." },
              { q: "Comment sont protégés mes produits du piratage ?", a: "Nous utilisons un filigrane dynamique, limitons le nombre d'IPs connectées par compte et bloquons techniquement les extensions de téléchargement de vidéos." },
            ].map((item) => (
              <div key={item.q} className="border-b border-slate-200 pb-6 group cursor-pointer">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-base md:text-lg text-[#191c1e] pr-4">{item.q}</h3>
                  <span className="material-symbols-outlined text-[#006e2f] font-bold flex-shrink-0">add</span>
                </div>
                <p className="text-[#5c647a] text-sm leading-relaxed opacity-0 max-h-0 overflow-hidden group-hover:opacity-100 group-hover:max-h-24 transition-all duration-300">{item.a}</p>
              </div>
            ))}
          </div>
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
