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
  title: "Novakou | La plateforme tout-en-un pour vendre en Afrique francophone",
  description:
    "Formations, produits digitaux, coaching. Mobile Money natif, assistants IA inclus, tunnels de vente prêts à l'emploi. 10% de commission, zéro abonnement.",
};

export default async function FormationsPage() {
  return (
    <>
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 1. HERO                                                       */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="relative px-4 md:px-8 pt-12 pb-20 md:pb-28 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-10 md:gap-16">
        <div className="flex-1 space-y-6 text-center md:text-left">
          <HeroBadge />

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] text-[#191c1e]">
            Vends tes formations<br />
            <span className="text-[#006e2f]">partout en Afrique</span><br />
            francophone.
          </h1>

          <p className="text-base md:text-xl text-[#5c647a] max-w-xl leading-relaxed mx-auto md:mx-0">
            Boutique, paiements Mobile Money, tunnels de vente et assistants IA — tout inclus. Lance-toi en 3 minutes, prends 10% de commission sur tes ventes, zéro abonnement.
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center md:justify-start pt-2">
            <Link
              href="/inscription?role=vendeur"
              className="px-7 py-4 rounded-full text-base md:text-lg font-bold text-white bg-[#006e2f] hover:bg-[#005a26] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#006e2f]/20"
            >
              <span>Lancer ma boutique</span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </Link>
            <Link
              href="/explorer"
              className="px-7 py-4 rounded-full text-base md:text-lg font-bold text-[#191c1e] bg-white border border-gray-200 hover:border-[#006e2f] hover:text-[#006e2f] transition-colors flex items-center justify-center gap-2"
            >
              Explorer le catalogue
            </Link>
          </div>

          <div className="flex items-center gap-4 pt-3 justify-center md:justify-start">
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
        </div>

        {/* Right — visuel produit */}
        <div className="hidden md:flex flex-1 relative w-full aspect-square items-center justify-center">
          <div className="absolute inset-0 bg-[#22c55e]/10 rounded-full blur-[80px]" />
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="absolute transform -rotate-6 -translate-x-10 translate-y-4 w-56 h-72 bg-white squircle shadow-xl overflow-hidden">
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
                <div className="h-2 w-10 bg-[#006e2f]/20 rounded-full" />
                <p className="font-bold text-sm">Formation SEO Master</p>
                <div className="h-1 w-full bg-[#eceef0] rounded-full" />
                <div className="h-1 w-2/3 bg-[#eceef0] rounded-full" />
              </div>
            </div>
            <div className="absolute transform rotate-6 translate-x-10 -translate-y-8 w-52 h-64 bg-white squircle shadow-xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="material-symbols-outlined text-[#22c55e] text-3xl">check_circle</span>
                <span className="bg-[#006e2f]/10 text-[#006e2f] text-[10px] font-bold px-2 py-1 rounded">+98 000 F</span>
              </div>
              <p className="text-xs text-[#5c647a]">Nouvelle commande reçue de <b>Marc R.</b> il y a 2 min.</p>
              <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#22c55e]/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#006e2f] text-sm">auto_graph</span>
                </div>
                <div className="h-2 w-14 bg-[#006e2f]/30 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 2. STATS — preuve sociale rapide                             */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="border-y border-gray-100 bg-slate-50/50 py-10 md:py-14">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <RevealOnScroll delay={0}>
              <div>
                <p className="text-3xl md:text-5xl font-extrabold text-[#191c1e]"><AnimatedCounter value={1240} /></p>
                <p className="text-xs md:text-sm text-[#5c647a] mt-1 font-medium">Créateurs actifs</p>
              </div>
            </RevealOnScroll>
            <RevealOnScroll delay={100}>
              <div>
                <p className="text-3xl md:text-5xl font-extrabold text-[#191c1e]"><AnimatedCounter value={180} />M <span className="text-2xl md:text-3xl text-[#5c647a]">F</span></p>
                <p className="text-xs md:text-sm text-[#5c647a] mt-1 font-medium">Générés par les vendeurs</p>
              </div>
            </RevealOnScroll>
            <RevealOnScroll delay={200}>
              <div>
                <p className="text-3xl md:text-5xl font-extrabold text-[#191c1e]"><AnimatedCounter value={17} /></p>
                <p className="text-xs md:text-sm text-[#5c647a] mt-1 font-medium">Pays couverts</p>
              </div>
            </RevealOnScroll>
            <RevealOnScroll delay={300}>
              <div>
                <p className="text-3xl md:text-5xl font-extrabold text-[#191c1e]">4.9<span className="text-xl md:text-2xl text-[#5c647a]">/5</span></p>
                <p className="text-xs md:text-sm text-[#5c647a] mt-1 font-medium">Satisfaction vendeurs</p>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 3. PROBLEM — court, factuel, 1 seule couleur accent          */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-12 md:mb-16">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#5c647a] mb-3">Le problème</p>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[#191c1e] leading-[1.15]">
                Vendre en ligne en Afrique, c&apos;est encore trop compliqué.
              </h2>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {[
              { n: "01", t: "Mobile Money invisible", d: "Les plateformes étrangères n'acceptent ni Orange Money, ni Wave, ni MTN. Tes clients abandonnent au paiement." },
              { n: "02", t: "Frais qui étouffent", d: "Stripe + commission plateforme + frais de change + virement international. Tu perds 25 % par vente." },
              { n: "03", t: "Outils en bricolage", d: "Mailchimp, Calendly, Kajabi, Zapier. 200 € par mois, 10 heures de configuration, aucune cohérence." },
            ].map((p) => (
              <RevealOnScroll key={p.n}>
                <div className="bg-white rounded-2xl border border-gray-100 p-6 h-full">
                  <p className="text-3xl font-black text-[#006e2f]/20 mb-3">{p.n}</p>
                  <h3 className="font-bold text-[#191c1e] text-lg mb-2">{p.t}</h3>
                  <p className="text-sm text-[#5c647a] leading-relaxed">{p.d}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 4. SOLUTION — Novakou fait tout                              */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 px-4 md:px-8 bg-[#006e2f] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#22c55e]/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-5xl mx-auto relative">
          <RevealOnScroll>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#22c55e] mb-3">La solution</p>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-[1.15] max-w-3xl">
              Novakou, c&apos;est une seule plateforme pour tout faire.
            </h2>
            <p className="text-white/70 text-base md:text-lg mt-5 max-w-2xl leading-relaxed">
              Boutique, checkout Mobile Money, tunnels de vente, assistants IA, communauté, analytics. Tout est intégré, tout est en français, tout marche dès le premier jour.
            </p>
          </RevealOnScroll>

          <RevealOnScroll delay={200}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-10">
              {[
                "Orange Money", "Wave", "MTN MoMo", "Moov Money", "Carte Visa / Mastercard", "Virement SEPA",
              ].map((label) => (
                <div key={label} className="bg-white/10 backdrop-blur rounded-xl px-4 py-3 flex items-center gap-2 border border-white/10">
                  <span className="material-symbols-outlined text-[#22c55e] text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 5. FEATURES SHOWCASE — organisé par catégorie, 1 palette     */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-14 md:mb-20">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#5c647a] mb-3">Ce que tu peux faire</p>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[#191c1e] leading-[1.15]">
                La boîte à outils complète,<br />
                <span className="text-[#006e2f]">tout incluse dans 10 %</span>
              </h2>
              <p className="text-[#5c647a] text-base md:text-lg mt-5 max-w-2xl mx-auto">
                Aucun module payant. Aucun plan premium. Tu prends tout dès l&apos;inscription.
              </p>
            </div>
          </RevealOnScroll>

          <div className="space-y-6">
            {[
              {
                label: "Ventes & Produits",
                icon: "storefront",
                desc: "Tout ce que tu peux vendre sur Novakou",
                features: [
                  { t: "Formations vidéo illimitées", d: "Upload direct ou YouTube/Vimeo" },
                  { t: "Produits digitaux", d: "Ebook, template, pack, code" },
                  { t: "Abonnements récurrents", d: "Mensuel ou annuel, trial gratuit" },
                  { t: "Bundles multi-produits", d: "Regroupe plusieurs produits" },
                  { t: "Coaching 1-to-1", d: "Calendrier + visio + paiement" },
                  { t: "Preview gratuit", d: "Rends certaines leçons libres" },
                ],
              },
              {
                label: "Paiements & Finances",
                icon: "payments",
                desc: "Encaisse en Afrique, en Europe, partout",
                features: [
                  { t: "Mobile Money natif", d: "Orange, Wave, MTN, Moov, Free" },
                  { t: "Carte Visa / Mastercard", d: "Pour la diaspora et l'international" },
                  { t: "Virement SEPA", d: "Clients en Europe francophone" },
                  { t: "Escrow 48 h", d: "Protection acheteur automatique" },
                  { t: "Retrait 1 clic", d: "Vers Mobile Money ou banque" },
                  { t: "Wallet multi-devises", d: "FCFA, EUR, USD au taux du jour" },
                ],
              },
              {
                label: "IA intégrée",
                icon: "auto_awesome",
                desc: "Claude Sonnet 4.6 travaille pour toi 24/7",
                features: [
                  { t: "AI Studio", d: "Page de vente générée en 30 s" },
                  { t: "AI Tunnel Builder", d: "Tunnel 4 étapes prêt à publier" },
                  { t: "Chatbot boutique", d: "Répond aux visiteurs 24/7" },
                  { t: "Coach IA Vendeur", d: "Rédige emails, plans, workflows" },
                  { t: "Coach IA Apprenant", d: "Explique, motive, planifie" },
                  { t: "Coach IA Mentor", d: "Structure sessions, packs, bios" },
                ],
              },
              {
                label: "Marketing & Croissance",
                icon: "campaign",
                desc: "Attire, convertis, fidélise",
                features: [
                  { t: "Tunnels de vente visuels", d: "Drag & drop, templates prêts" },
                  { t: "Order bumps", d: "+20 à 30 % de panier moyen" },
                  { t: "Upsells / downsells", d: "Après achat, propose plus" },
                  { t: "Popups intelligents", d: "Exit-intent, scroll, timer" },
                  { t: "A/B testing", d: "Teste 2 variantes, gagnant auto" },
                  { t: "Pixels FB / Google / TikTok", d: "Tracking pub sans code" },
                  { t: "Programme d'affiliation", d: "Autres peuvent promouvoir" },
                  { t: "Flash promos", d: "Compte à rebours, quota max" },
                ],
              },
              {
                label: "Relation client",
                icon: "forum",
                desc: "Échange, engage, récupère",
                features: [
                  { t: "Messagerie intégrée", d: "Acheteur ↔ vendeur direct" },
                  { t: "Questions pré-achat", d: "Visiteur demande, tu réponds" },
                  { t: "Récupération d'abandons", d: "Vois qui a tenté de payer" },
                  { t: "Communauté privée", d: "Par formation, membres vérifiés" },
                  { t: "WhatsApp direct", d: "Lien wa.me cliquable" },
                  { t: "Emails relance auto", d: "2 rappels après un abandon" },
                ],
              },
              {
                label: "Boutique & Analytics",
                icon: "insights",
                desc: "Personnalise, mesure, optimise",
                features: [
                  { t: "Sous-domaine gratuit", d: "tonnom.novakou.com" },
                  { t: "Domaine personnalisé", d: "boutique.tonsite.com + SSL" },
                  { t: "Multi-boutiques", d: "Plusieurs marques, un compte" },
                  { t: "Thème couleur", d: "Propagé sur toute ta boutique" },
                  { t: "Dashboard temps réel", d: "Revenus, top produits, pays" },
                  { t: "Export CSV", d: "Rien n'est verrouillé" },
                ],
              },
            ].map((cat, i) => (
              <RevealOnScroll key={i} delay={i * 40}>
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="flex items-center gap-4 p-6 border-b border-gray-100">
                    <div className="w-11 h-11 rounded-xl bg-[#006e2f]/10 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[#006e2f] text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>{cat.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-extrabold text-[#191c1e]">{cat.label}</h3>
                      <p className="text-xs text-[#5c647a]">{cat.desc}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x lg:divide-y-0 lg:divide-x divide-gray-100">
                    {cat.features.map((f, j) => (
                      <div key={j} className="p-5">
                        <div className="flex items-start gap-2 mb-1">
                          <span className="material-symbols-outlined text-[#006e2f] text-[16px] mt-0.5 flex-shrink-0">check_circle</span>
                          <h4 className="text-sm font-bold text-[#191c1e]">{f.t}</h4>
                        </div>
                        <p className="text-xs text-[#5c647a] leading-relaxed ml-6">{f.d}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 6. IA — démo visuelle du chatbot                             */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 px-4 md:px-8 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-14">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#5c647a] mb-3">IA en action</p>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[#191c1e] leading-[1.15]">
                Le chatbot qui vend pendant que tu dors
              </h2>
              <p className="text-[#5c647a] text-base md:text-lg mt-5 max-w-2xl mx-auto">
                Active le support IA depuis ton dashboard, colle ton contexte, le widget apparaît sur ta boutique et répond aux visiteurs avec ton ton.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 items-center">
            <RevealOnScroll direction="right">
              <div className="space-y-3 max-w-md mx-auto">
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 text-sm shadow-sm border border-gray-100">
                  Bonjour, combien coûte votre formation Excel et est-ce que je peux payer en plusieurs fois via Orange Money ?
                </div>
                <div className="flex justify-end">
                  <div className="bg-[#006e2f] text-white rounded-2xl rounded-br-sm px-4 py-3 text-sm max-w-sm shadow-md">
                    Bonjour et bienvenue !<br /><br />
                    La <strong>Formation Excel pour débutants</strong> est à <strong>15 000 FCFA</strong> (offre de lancement, au lieu de 25 000 FCFA). Oui, tu peux payer en <strong>2 fois de 7 500 FCFA</strong> via Orange Money, Wave ou MTN MoMo.<br /><br />
                    Tu veux en savoir plus sur le contenu avant de te lancer ?
                  </div>
                </div>
                <p className="text-[10px] text-[#5c647a] text-center pt-2">
                  Propulsé par Claude Sonnet 4.6 · réponse en 3 secondes
                </p>
              </div>
            </RevealOnScroll>

            <RevealOnScroll direction="left">
              <div>
                <ol className="space-y-5">
                  {[
                    "Tu actives le chatbot dans ton dashboard (une case à cocher).",
                    "Tu colles ton contexte : prix, politiques, FAQ, ton style.",
                    "Le widget apparaît automatiquement sur tes pages publiques.",
                    "Claude répond 24 h/24 en ne citant que les infos que tu as fournies.",
                    "Si le bot ne sait pas, il propose de te contacter directement.",
                  ].map((t, i) => (
                    <li key={i} className="flex items-start gap-4">
                      <span className="w-8 h-8 rounded-full bg-[#006e2f] text-white font-bold text-sm flex items-center justify-center flex-shrink-0">{i + 1}</span>
                      <span className="text-[#191c1e] leading-relaxed text-base">{t}</span>
                    </li>
                  ))}
                </ol>
                <Link
                  href="/inscription?role=vendeur"
                  className="inline-flex items-center gap-2 mt-8 px-6 py-3 bg-[#191c1e] text-white rounded-full font-bold text-sm hover:bg-[#2a2f33] transition-colors"
                >
                  Essayer maintenant
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </Link>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 7. BEST-SELLERS — catalogue réel                             */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <RevealOnScroll>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-10 md:mb-12">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#5c647a] mb-3">Déjà en vente</p>
                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[#191c1e] leading-[1.15]">Les best-sellers</h2>
              </div>
              <Link href="/explorer" className="text-[#006e2f] font-bold flex items-center gap-2 group text-sm hover:text-[#005a26] transition-colors">
                Explorer tout le catalogue
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform text-[18px]">arrow_forward</span>
              </Link>
            </div>
          </RevealOnScroll>
          <BestSellers />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 8. SIMULATEUR DE REVENUS                                     */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <RevenueSimulator />

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 9. DEVELOPER APIs — 2 snippets propres                       */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 px-4 md:px-8 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-12 md:mb-16">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#5c647a] mb-3">Pour développeurs</p>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[#191c1e] leading-[1.15]">
                Une API propre pour tout intégrer
              </h2>
              <p className="text-[#5c647a] text-base md:text-lg mt-5 max-w-2xl mx-auto">
                Crée des paiements, écoute les événements en temps réel, branche Zapier, n8n, ton CRM ou ton app mobile.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RevealOnScroll>
              <div>
                <h3 className="font-bold text-[#191c1e] mb-3">Créer un paiement Mobile Money</h3>
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
  }'`}
                />
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={100}>
              <div>
                <h3 className="font-bold text-[#191c1e] mb-3">Recevoir un webhook signé</h3>
                <CodeSnippet
                  label="Webhook sortant"
                  language="json"
                  code={`POST https://ton-app.com/webhooks/novakou
X-Novakou-Signature: sha256=a1b2c3...

{
  "event": "order.completed",
  "data": {
    "amount": 15000,
    "currency": "XOF",
    "buyer": { "email": "..." }
  }
}`}
                />
              </div>
            </RevealOnScroll>
          </div>

          <RevealOnScroll>
            <div className="text-center mt-10">
              <Link
                href="/developer/docs"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-[#191c1e] rounded-full font-bold text-sm hover:border-[#006e2f] hover:text-[#006e2f] transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">menu_book</span>
                Documentation complète
              </Link>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 10. TÉMOIGNAGES                                              */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-12 md:mb-16">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#5c647a] mb-3">Ils utilisent Novakou</p>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[#191c1e] leading-[1.15]">
                Des créateurs qui vendent vraiment
              </h2>
            </div>
          </RevealOnScroll>

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
                text: "J'étais sur une plateforme étrangère avant. Novakou parle français africain et le Mobile Money en natif change tout pour mes clients.",
                result: "95 % paiements Mobile Money",
              },
              {
                name: "Marie-Claire Assouma",
                role: "Créatrice templates · Lomé",
                initial: "MA",
                text: "Les tunnels de vente pré-construits m'ont donné une page qui convertit à 4 %. Sans rien coder, sans rien configurer pendant des heures.",
                result: "450 ventes en 2 mois",
              },
            ].map((t) => (
              <RevealOnScroll key={t.name}>
                <div className="bg-white rounded-2xl border border-gray-100 p-6 h-full flex flex-col">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className="material-symbols-outlined text-[16px] text-[#22c55e]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
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
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 11. TARIFICATION — claire, une ligne                         */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 px-4 md:px-8 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-10">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#5c647a] mb-3">Tarification</p>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[#191c1e] leading-[1.15]">
                Simple et honnête
              </h2>
            </div>
          </RevealOnScroll>

          <RevealOnScroll>
            <div className="bg-white rounded-3xl border border-gray-100 p-8 md:p-12 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#006e2f] mb-2">Commission unique</p>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-7xl md:text-8xl font-black text-[#191c1e]">10</span>
                <span className="text-4xl md:text-5xl font-black text-[#191c1e]">%</span>
              </div>
              <p className="text-[#5c647a] text-base mt-3">par vente · zéro abonnement · zéro frais caché</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-10 text-left">
                {[
                  { t: "0 FCFA", d: "Frais de lancement" },
                  { t: "0 FCFA", d: "Abonnement mensuel" },
                  { t: "0 FCFA", d: "Frais de retrait" },
                  { t: "60+", d: "Fonctionnalités incluses" },
                ].map((s) => (
                  <div key={s.d} className="bg-slate-50 rounded-xl p-4">
                    <p className="text-lg font-extrabold text-[#006e2f]">{s.t}</p>
                    <p className="text-xs text-[#5c647a] mt-1">{s.d}</p>
                  </div>
                ))}
              </div>

              <Link
                href="/inscription?role=vendeur"
                className="inline-flex items-center gap-2 mt-10 px-7 py-3.5 bg-[#006e2f] text-white rounded-full font-bold text-sm hover:bg-[#005a26] transition-colors"
              >
                Lancer ma boutique maintenant
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 12. FAQ                                                      */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 px-4 md:px-8">
        <div className="max-w-3xl mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-12">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#5c647a] mb-3">Questions fréquentes</p>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[#191c1e] leading-[1.15]">
                Tout ce qu&apos;on te demande souvent
              </h2>
            </div>
          </RevealOnScroll>

          <RevealOnScroll>
            <FAQAccordion
              items={[
                { q: "Combien ça coûte vraiment ?", a: "10 % de commission sur chaque vente. Zéro abonnement, zéro frais caché, zéro frais de mise en place. Tu ne paies que quand tu gagnes. Les 10 % couvrent l'hébergement, les frais bancaires, l'IA, les emails, le support et le stockage vidéo." },
                { q: "Comment je suis payé ?", a: "Chaque vente est placée en escrow 48 h (protection acheteur). Ensuite les fonds arrivent sur ton wallet. Tu demandes un retrait quand tu veux vers Orange Money, Wave, MTN, carte ou virement bancaire. Retrait minimum : 2 500 FCFA." },
                { q: "Mes clients peuvent-ils payer en Mobile Money ?", a: "Oui, et c'est natif. Orange Money (Sénégal, Côte d'Ivoire, Cameroun, Mali), Wave (Sénégal, Côte d'Ivoire), MTN MoMo, Moov Money, Free Money, carte Visa / Mastercard, virement SEPA pour la diaspora." },
                { q: "L'IA est-elle vraiment incluse ?", a: "Oui. Les 6 assistants Claude Sonnet 4.6 (AI Studio, Tunnel Builder, Chatbot boutique, 3 Coach IA) sont inclus dans les 10 %. Pas de clé OpenAI à gérer, pas d'abonnement séparé." },
                { q: "Peux-je utiliser mon propre domaine ?", a: "Oui. Connecte ton domaine (boutique.tonsite.com) en quelques clics, certificat SSL automatique. Ou utilise l'adresse gratuite tonnom.novakou.com." },
                { q: "Comment sont protégés mes contenus vidéo ?", a: "Chaque vidéo a un watermark dynamique avec l'email de l'acheteur. Nombre d'IP connectées limité par compte. Vidéos streamées (non téléchargeables). Extensions de capture bloquées." },
                { q: "Combien de temps pour lancer ma boutique ?", a: "3 minutes pour une boutique fonctionnelle avec un produit. 15 à 30 minutes pour quelque chose de poli avec AI Studio, chatbot configuré et méthodes de paiement en place." },
                { q: "Et si je veux partir ?", a: "Zéro lock-in. Tu peux exporter tous tes clients (CSV), télécharger tes ventes, migrer tes produits. Ton contenu t'appartient." },
                { q: "Est-ce que ça marche pour les mentors ?", a: "Oui. L'espace mentor permet des sessions 1-to-1 avec calendrier intégré, paiement automatique et lien visio externe (Zoom, Meet). Le Coach IA Mentor t'aide à structurer tes offres." },
                { q: "Et pour les agences ?", a: "Oui. Le compte agence permet plusieurs vendeurs sous une même entité, partage des revenus et statistiques globales." },
                { q: "Vous supportez les abonnements récurrents ?", a: "Oui. Memberships mensuel ou annuel, trial gratuit, contenu premium verrouillé. Facturation automatique via Mobile Money ou carte." },
                { q: "Comment contacter le support ?", a: "Email support@novakou.com (réponse sous 24 h, souvent bien plus rapide). Centre d'aide avec 80+ articles. Communauté des vendeurs sur Discord et WhatsApp." },
              ]}
            />
          </RevealOnScroll>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 13. CTA FINAL                                                */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 px-4 md:px-8">
        <div className="max-w-4xl mx-auto bg-[#006e2f] rounded-3xl p-8 md:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[#22c55e]/10 blur-3xl pointer-events-none" />
          <RevealOnScroll>
            <div className="relative">
              <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-[1.15] mb-5">
                Lance ta boutique<br />
                en 3 minutes.
              </h2>
              <p className="text-white/70 text-base md:text-lg mb-10 max-w-xl mx-auto">
                Rejoins les 1 240 créateurs qui gagnent vraiment leur vie en vendant des formations et produits digitaux en Afrique francophone.
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
          </RevealOnScroll>
        </div>
      </section>
    </>
  );
}
