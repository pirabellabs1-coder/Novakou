import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title:
    "Tunnel de vente sur Novakou : guide complet étape par étape 2026",
  description:
    "Construisez un tunnel de vente performant sur Novakou pour vendre vos formations et produits digitaux en Afrique francophone. Pages d'atterrissage, emails, paiement, upsell — tout est expliqué.",
  keywords: [
    "tunnel de vente Novakou",
    "funnel vente formation en ligne Afrique",
    "créer tunnel de vente Afrique francophone",
    "page de vente formation",
    "entonnoir conversion Novakou",
    "vendre formations en ligne Sénégal",
  ],
  openGraph: {
    title: "Tunnel de vente sur Novakou : guide complet 2026",
    description:
      "Construisez un tunnel de vente qui convertit pour vendre vos formations et produits digitaux en Afrique francophone.",
    type: "article",
  },
};

/* ─── Typography ─── */
const S = {
  fontFamily:
    "'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
} as const;
const SH = { ...S, fontWeight: 700, letterSpacing: "-0.04em" } as const;

/* ─── Palette ─── */
const C = {
  primary: "#006e2f",
  accent: "#22c55e",
  dark: "#191c1e",
  muted: "#5c647a",
  surface: "#f6fbf2",
  surfaceLow: "#f0f5ec",
  surfaceHigh: "#e5eae1",
  white: "#ffffff",
  tipBg: "#ecfdf5",
  tipBorder: "#a7f3d0",
  warnBg: "#fffbeb",
  warnBorder: "#fde68a",
  proBg: "#eff6ff",
  proBorder: "#bfdbfe",
} as const;

/* ─── Helper components ─── */
function Breadcrumb() {
  return (
    <nav
      aria-label="Fil d'Ariane"
      className="flex items-center gap-2 text-sm mb-6 flex-wrap"
      style={{ ...S, color: C.muted }}
    >
      <Link href="/" className="hover:underline" style={{ color: C.primary }}>
        Accueil
      </Link>
      <span>/</span>
      <Link href="/guides" className="hover:underline" style={{ color: C.primary }}>
        Guides
      </Link>
      <span>/</span>
      <span style={{ color: C.dark }}>Tunnel de vente Novakou</span>
    </nav>
  );
}

function TipBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-5 my-8 border" style={{ ...S, backgroundColor: C.tipBg, borderColor: C.tipBorder, color: C.dark }}>
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: C.accent }}>
          i
        </span>
        <div className="text-[15px] leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function WarnBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-5 my-8 border" style={{ ...S, backgroundColor: C.warnBg, borderColor: C.warnBorder, color: C.dark }}>
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold bg-amber-500">!</span>
        <div className="text-[15px] leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function ProTip({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-5 my-8 border" style={{ ...S, backgroundColor: C.proBg, borderColor: C.proBorder, color: C.dark }}>
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 px-2 py-0.5 rounded text-xs font-bold text-white bg-blue-600">PRO</span>
        <div className="text-[15px] leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function SectionHeading({ id, number, children }: { id: string; number?: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-2xl sm:text-3xl mt-16 mb-6 scroll-mt-28" style={{ ...SH, color: C.dark }}>
      {number && (
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-full text-base mr-3 text-white" style={{ backgroundColor: C.primary }}>
          {number}
        </span>
      )}
      {children}
    </h2>
  );
}

function FunnelStep({ num, emoji, title, desc, kpi }: { num: number; emoji: string; title: string; desc: string; kpi: string }) {
  return (
    <div className="relative flex items-start gap-4">
      <div className="flex flex-col items-center">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ backgroundColor: C.surface }}
        >
          {emoji}
        </div>
        {num < 7 && <div className="w-0.5 h-8 mt-2" style={{ backgroundColor: C.surfaceHigh }} />}
      </div>
      <div className="pb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold" style={{ color: C.muted }}>ÉTAPE {num}</span>
        </div>
        <p className="font-bold text-base mb-1" style={{ ...SH, color: C.dark }}>{title}</p>
        <p className="text-sm leading-relaxed mb-2" style={{ color: C.muted, ...S }}>{desc}</p>
        <span className="text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: C.tipBg, color: C.primary }}>
          📊 {kpi}
        </span>
      </div>
    </div>
  );
}

export default function TunnelDeVenteNovakou() {
  return (
    <div style={{ ...S, backgroundColor: C.white, color: C.dark }}>

      {/* ── Hero ── */}
      <section
        className="relative py-16 px-4 sm:px-6"
        style={{ background: `linear-gradient(135deg, ${C.surface} 0%, #e8f5e9 100%)` }}
      >
        <div className="max-w-3xl mx-auto">
          <Breadcrumb />

          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold px-3 py-1 rounded-full text-white" style={{ backgroundColor: C.primary }}>
              Vente & Stratégie
            </span>
            <span className="text-xs" style={{ color: C.muted }}>
              15 min de lecture · Niveau intermédiaire
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl mb-5 leading-tight" style={{ ...SH, color: C.dark }}>
            Tunnel de vente sur Novakou :{" "}
            <span style={{ color: C.primary }}>le guide complet étape par étape</span>
          </h1>

          <p className="text-lg sm:text-xl leading-relaxed mb-8" style={{ color: C.muted }}>
            Un tunnel de vente bien construit transforme un inconnu en acheteur
            fidèle de façon systématique. Ce guide vous montre comment en
            construire un efficace sur Novakou — de la première impression
            jusqu'au client récurrent, en passant par chaque étape de
            conversion.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { val: "3×", label: "plus de revenus avec un tunnel complet vs page de vente simple" },
              { val: "68%", label: "des créateurs Novakou n'ont pas encore de vrai tunnel de vente" },
              { val: "20 min", label: "pour configurer un tunnel basique mais fonctionnel sur Novakou" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl p-4 text-center" style={{ backgroundColor: C.white }}>
                <p className="text-2xl font-bold mb-1" style={{ ...SH, color: C.primary }}>{s.val}</p>
                <p className="text-xs leading-snug" style={{ color: C.muted }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Hero image ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-4 mb-8">
        <div className="relative w-full rounded-2xl overflow-hidden shadow-lg" style={{ height: 340 }}>
          <Image
            src="https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=900&auto=format&fit=crop&q=80"
            alt="Tunnel de vente stratégie marketing"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 800px"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <p className="absolute bottom-4 left-5 text-white text-sm font-medium" style={S}>
            Un tunnel bien construit = des ventes prévisibles, jour après jour
          </p>
        </div>
      </div>

      {/* ── Table des matières ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 mb-12">
        <div className="rounded-2xl p-6 border" style={{ backgroundColor: C.surface, borderColor: C.surfaceHigh }}>
          <p className="font-bold text-sm mb-4 uppercase tracking-widest" style={{ color: C.primary }}>Dans ce guide</p>
          <ol className="space-y-2 text-sm" style={{ color: C.dark }}>
            {[
              ["comprendre", "Qu'est-ce qu'un tunnel de vente et pourquoi en avoir un ?"],
              ["anatomie", "Anatomie d'un tunnel Novakou performant"],
              ["trafic", "Étape 1 — Attirer le bon trafic"],
              ["lead-magnet", "Étape 2 — Capturer des contacts (lead magnet)"],
              ["page-vente", "Étape 3 — La page de vente qui convertit"],
              ["checkout", "Étape 4 — Optimiser la page de paiement"],
              ["post-achat", "Étape 5 — La séquence post-achat"],
              ["upsell", "Étape 6 — Upsell et ascension client"],
              ["retargeting", "Étape 7 — Retargeting et récupération"],
              ["optimiser", "Optimiser et scaler votre tunnel"],
              ["exemple-complet", "Exemple de tunnel complet : de 0 à 500 000 FCFA/mois"],
              ["erreurs", "Les erreurs classiques qui tuent les conversions"],
            ].map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} className="hover:underline flex items-center gap-2" style={{ color: C.primary }}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: C.accent }} />
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* ── Content ── */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">

        {/* 1 */}
        <SectionHeading id="comprendre" number="1">
          Qu'est-ce qu'un tunnel de vente et pourquoi en avoir un ?
        </SectionHeading>

        <p className="text-[17px] leading-relaxed mb-6" style={{ color: C.muted }}>
          Un tunnel de vente (ou funnel) est le chemin structuré que parcourt un
          visiteur inconnu jusqu'à devenir un client fidèle. C'est l'opposé de
          "j'ai posté sur Facebook et j'espère que ça vend" — c'est un
          système prévisible où chaque étape est pensée pour faire avancer le
          visiteur vers l'achat.
        </p>

        <p className="text-[17px] leading-relaxed mb-6" style={{ color: C.muted }}>
          Sans tunnel, vous êtes dépendant du hasard. Vous publiez, des gens
          voient, certains achètent, vous ne savez pas pourquoi. Avec un tunnel,
          vous savez que pour 100 personnes qui entrent au sommet, X finissent
          par acheter. Vous pouvez prévoir vos revenus, identifier les fuites,
          et scaler ce qui fonctionne.
        </p>

        <TipBox>
          <strong>La métaphore du tunnel :</strong> large en haut (beaucoup de
          visiteurs entrent), étroit en bas (seuls les plus motivés achètent).
          Votre travail est de rendre le tunnel le plus large possible à chaque
          étage — c'est ce qu'on appelle l'optimisation du taux de conversion.
        </TipBox>

        {/* 2 */}
        <SectionHeading id="anatomie" number="2">
          Anatomie d'un tunnel Novakou performant
        </SectionHeading>

        <p className="text-[17px] leading-relaxed mb-8" style={{ color: C.muted }}>
          Un tunnel Novakou complet comporte 7 étapes. Chacune a un rôle précis
          et des métriques associées. Vous n'avez pas besoin d'avoir les 7 dès
          le départ — commencez avec les étapes 3 à 5, puis ajoutez les autres.
        </p>

        <div className="my-8">
          <FunnelStep num={1} emoji="📡" title="Trafic" desc="Visiteurs depuis les réseaux sociaux, Google, bouche-à-oreille, publicités payantes." kpi="Objectif : 300+ visiteurs/mois sur votre page" />
          <FunnelStep num={2} emoji="🎁" title="Lead Magnet" desc="Ressource gratuite pour capturer l'email du visiteur avant même qu'il achète." kpi="Objectif : 20-40% des visiteurs laissent leur email" />
          <FunnelStep num={3} emoji="📄" title="Page de vente" desc="Présentation complète de votre formation : bénéfices, programme, prix, témoignages." kpi="Objectif : 2-5% des visiteurs achètent" />
          <FunnelStep num={4} emoji="💳" title="Page de paiement" desc="Checkout optimisé avec tous les moyens de paiement africains disponibles." kpi="Objectif : 60-70% des clics 'Acheter' finalisent le paiement" />
          <FunnelStep num={5} emoji="🎉" title="Post-achat" desc="Email de bienvenue, accès immédiat, bonus surprise, offre complémentaire." kpi="Objectif : 25-35% acceptent l'order bump" />
          <FunnelStep num={6} emoji="⬆️" title="Upsell" desc="Offre premium proposée aux acheteurs les plus engagés (coaching, avancé, mastermind)." kpi="Objectif : 10-20% des acheteurs montent en gamme" />
          <FunnelStep num={7} emoji="🔄" title="Fidélisation" desc="Communauté, nouvelles formations, offres exclusives pour garder le client sur le long terme." kpi="Objectif : 40% des clients achètent une 2ème formation" />
        </div>

        {/* 3 */}
        <SectionHeading id="trafic" number="3">
          Étape 1 — Attirer le bon trafic
        </SectionHeading>

        <p className="text-[17px] leading-relaxed mb-6" style={{ color: C.muted }}>
          Le trafic est le carburant de votre tunnel. Sans visiteurs, les
          meilleures pages de vente du monde ne génèrent rien. Mais tous les
          trafics ne se valent pas — mieux vaut 100 visiteurs qualifiés que
          1 000 curieux sans intention d'achat.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 my-8">
          {[
            {
              type: "Trafic organique",
              sources: ["Posts Instagram/TikTok réguliers", "Groupes Facebook de votre niche", "YouTube ou podcasts", "SEO Google (long terme)"],
              cost: "0 FCFA, investissement temps",
              timeToResult: "2-6 mois",
              recommended: true,
            },
            {
              type: "Trafic payant",
              sources: ["Facebook & Instagram Ads", "Google Ads", "Influenceurs de niche", "Partenariats créateurs"],
              cost: "15 000 FCFA/semaine minimum",
              timeToResult: "Immédiat",
              recommended: false,
            },
          ].map((t) => (
            <div key={t.type} className="rounded-2xl border p-5" style={{ borderColor: t.recommended ? C.accent : C.surfaceHigh, borderWidth: t.recommended ? 2 : 1 }}>
              {t.recommended && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white mb-3 inline-block" style={{ backgroundColor: C.primary }}>
                  ★ Recommandé pour débuter
                </span>
              )}
              <h3 className="font-bold text-base mb-3" style={{ ...SH, color: C.dark }}>{t.type}</h3>
              <ul className="space-y-1.5 mb-4">
                {t.sources.map((s) => (
                  <li key={s} className="text-sm flex items-center gap-2" style={{ color: C.muted, ...S }}>
                    <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: C.accent }} />
                    {s}
                  </li>
                ))}
              </ul>
              <div className="text-xs space-y-1">
                <p><span className="font-semibold" style={{ color: C.dark }}>Coût :</span> <span style={{ color: C.muted }}>{t.cost}</span></p>
                <p><span className="font-semibold" style={{ color: C.dark }}>Résultats :</span> <span style={{ color: C.muted }}>{t.timeToResult}</span></p>
              </div>
            </div>
          ))}
        </div>

        <WarnBox>
          <strong>Ne payez pas de publicité avant d'avoir validé votre tunnel :</strong> beaucoup
          de créateurs brûlent 50 000 FCFA en Facebook Ads sans avoir de page de
          vente optimisée. Résultat : trafic payant → page qui ne convertit pas
          → argent perdu. Validez d'abord organiquement, puis scalez avec du payant.
        </WarnBox>

        {/* 4 */}
        <SectionHeading id="lead-magnet" number="4">
          Étape 2 — Capturer des contacts (lead magnet)
        </SectionHeading>

        <p className="text-[17px] leading-relaxed mb-6" style={{ color: C.muted }}>
          La majorité des visiteurs ne sont pas prêts à acheter lors de leur
          première visite. Le lead magnet est une ressource gratuite que vous
          offrez en échange de l'adresse email du visiteur. Cela vous permet de
          construire une liste et de les convertir progressivement via vos
          emails.
        </p>

        <p className="text-[17px] leading-relaxed mb-6" style={{ color: C.muted }}>
          Les meilleurs lead magnets en Afrique francophone sont courts,
          actionnables et résolvent un problème précis en 15 minutes ou moins :
        </p>

        <div className="grid sm:grid-cols-2 gap-4 my-8">
          {[
            { format: "PDF checklist", exemple: "Les 10 étapes pour créer sa première formation en ligne", perf: "Très haut" },
            { format: "Vidéo de 10 min", exemple: "Comment j'ai gagné 200 000 FCFA avec une formation en 30 jours", perf: "Haut" },
            { format: "Template gratuit", exemple: "Le template Canva pour créer votre page de vente", perf: "Très haut" },
            { format: "Mini-formation (3 emails)", exemple: "3 jours pour valider votre idée de formation", perf: "Haut" },
            { format: "Ebook / guide PDF", exemple: "Le guide complet de la vente en ligne en Afrique", perf: "Moyen" },
            { format: "Quiz", exemple: "Quel type de produit digital est fait pour vous ?", perf: "Haut" },
          ].map((lm) => (
            <div key={lm.format} className="flex items-start gap-3 rounded-xl border p-4" style={{ borderColor: C.surfaceHigh }}>
              <div>
                <p className="font-bold text-sm mb-1" style={{ ...SH, color: C.dark }}>{lm.format}</p>
                <p className="text-xs mb-2" style={{ color: C.muted, ...S }}>{lm.exemple}</p>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: lm.perf === "Très haut" ? C.tipBg : C.surface,
                    color: lm.perf === "Très haut" ? C.primary : C.muted,
                  }}
                >
                  Taux d'opt-in : {lm.perf}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 5 */}
        <SectionHeading id="page-vente" number="5">
          Étape 3 — La page de vente qui convertit
        </SectionHeading>

        <p className="text-[17px] leading-relaxed mb-6" style={{ color: C.muted }}>
          Votre page de vente est le cœur de votre tunnel. C'est ici que le
          visiteur décide d'acheter ou de partir. Une bonne page de vente
          répond aux questions dans l'ordre précis où l'acheteur se les pose.
          Ne sautez aucune étape.
        </p>

        <div className="rounded-2xl border overflow-hidden my-8" style={{ borderColor: C.surfaceHigh }}>
          <div className="px-5 py-3 border-b font-bold text-sm" style={{ backgroundColor: C.surface, borderColor: C.surfaceHigh, color: C.dark, ...SH }}>
            Structure d'une page de vente qui convertit
          </div>
          <div className="divide-y" style={{ borderColor: C.surfaceHigh }}>
            {[
              { section: "Headline", role: "Capturer l'attention en 3 secondes. Promesse principale en gros.", exemple: "Créez votre première formation en ligne en 14 jours — même sans audience" },
              { section: "Sous-titre", role: "Préciser la promesse. Pour qui. En combien de temps.", exemple: "Le programme complet pour créateurs débutants qui veulent monétiser leur expertise." },
              { section: "Vidéo de vente", role: "Optionnel mais +35% de conversions. 5-10 min. Votre histoire + le programme.", exemple: "Votre témoignage personnel + présentation du contenu" },
              { section: "Problème", role: "Nommer la douleur que votre client ressent. Le faire se sentir compris.", exemple: "Vous avez de l'expertise, mais vous ne savez pas comment la transformer en revenus..." },
              { section: "Solution", role: "Votre formation comme la solution évidente. Pas de feature, des bénéfices.", exemple: "Après cette formation, vous avez votre première formation publiée et votre premier vrai revenu" },
              { section: "Programme", role: "Modules, durée, format. Ce qu'ils vont apprendre concrètement.", exemple: "Module 1 : Trouver son idée. Module 2 : Créer le contenu. Module 3 : Lancer..." },
              { section: "Témoignages", role: "Preuve sociale. 3 minimum avec photo, nom, résultat concret.", exemple: "Amadou D., Dakar : J'ai vendu 47 formations en 2 semaines..." },
              { section: "Tarif + CTA", role: "Prix clair. Justifié. Bouton d'achat visible. Garantie.", exemple: "25 000 FCFA · Accès à vie · Garantie 14 jours satisfait ou remboursé" },
              { section: "FAQ", role: "6-10 questions. Désamorcer les objections finales.", exemple: "Est-ce que ça marche si je n'ai pas d'audience ? Oui, voici pourquoi..." },
            ].map(({ section, role, exemple }) => (
              <div key={section} className="px-5 py-4">
                <div className="flex gap-4">
                  <span className="font-bold text-sm w-32 flex-shrink-0" style={{ color: C.primary, ...SH }}>{section}</span>
                  <div className="flex-1">
                    <p className="text-sm mb-1" style={{ color: C.dark, ...S }}>{role}</p>
                    <p className="text-xs italic" style={{ color: C.muted, ...S }}>Ex : {exemple}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative w-full rounded-2xl overflow-hidden my-10" style={{ height: 260 }}>
          <Image
            src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=900&auto=format&fit=crop&q=80"
            alt="Équipe qui analyse une page de vente"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 800px"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
          <div className="absolute inset-0 flex items-center px-8">
            <blockquote className="max-w-xs">
              <p className="text-white text-lg font-bold mb-2" style={SH}>
                "Ma page de vente a triplé son taux de conversion après avoir ajouté 3 témoignages avec photos."
              </p>
              <p className="text-white/70 text-sm" style={S}>— Kofi A., formateur en marketing digital, Accra</p>
            </blockquote>
          </div>
        </div>

        {/* 6 */}
        <SectionHeading id="checkout" number="6">
          Étape 4 — Optimiser la page de paiement
        </SectionHeading>

        <p className="text-[17px] leading-relaxed mb-6" style={{ color: C.muted }}>
          Vous avez convaincu le visiteur d'acheter. Il clique sur "Acheter
          maintenant". Et là, il abandonne. C'est le scénario le plus douloureux
          en vente en ligne — la friction au checkout. Sur Novakou, voici
          comment la réduire au minimum :
        </p>

        {[
          { title: "Proposez tous les moyens de paiement dès la première étape", desc: "Wave, Orange Money, MTN, carte, virement. L'acheteur doit voir son mode préféré immédiatement. En Afrique, beaucoup n'ont pas de carte bancaire — si vous ne proposez pas de mobile money, vous perdez 60% des acheteurs potentiels." },
          { title: "Page de paiement minimaliste", desc: "Éliminez toute distraction : pas de menu, pas de liens sortants, pas de publicité. L'objectif unique de cette page est que le visiteur finalise son paiement." },
          { title: "Réassurance visible", desc: "Icônes de sécurité, garantie satisfait ou remboursé, logo Novakou. L'acheteur doit sentir qu'il peut acheter en confiance." },
          { title: "Résumé de commande clair", desc: "Nom de la formation, prix, ce qu'il va recevoir, délai d'accès. Aucune surprise. Les surprises à cette étape font fuir." },
          { title: "Order bump bien placé", desc: "Une offre complémentaire simple, juste au-dessus du bouton de paiement final. Une seule case à cocher. Prix raisonnable (< 30% du prix principal)." },
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-4 mb-6">
            <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5" style={{ backgroundColor: C.primary }}>
              {i + 1}
            </span>
            <div>
              <p className="font-bold text-sm mb-1" style={{ ...SH, color: C.dark }}>{item.title}</p>
              <p className="text-sm leading-relaxed" style={{ color: C.muted, ...S }}>{item.desc}</p>
            </div>
          </div>
        ))}

        <ProTip>
          <strong>Test A/B sur le bouton de paiement :</strong> testez "Payer
          maintenant" vs "Obtenir l'accès maintenant" vs "Commencer la
          formation". Sur des marchés africains, "Obtenir l'accès" performe
          souvent mieux car il met l'accent sur le bénéfice, pas l'action
          d'achat.
        </ProTip>

        {/* 7 */}
        <SectionHeading id="post-achat" number="7">
          Étape 5 — La séquence post-achat
        </SectionHeading>

        <p className="text-[17px] leading-relaxed mb-6" style={{ color: C.muted }}>
          L'achat est fait. Le vrai travail commence maintenant. Un client
          satisfait revient, recommande, et achète vos prochaines formations.
          Un client qui n'a jamais ouvert sa formation sera déçu et demandera
          un remboursement.
        </p>

        <div className="my-8 space-y-3">
          {[
            { jour: "J+0 (immédiat)", action: "Email de bienvenue avec accès, bonus surprise, offre upsell" },
            { jour: "J+1", action: "Email 'Comment bien démarrer' — guide vers le premier module" },
            { jour: "J+3", action: "Email de vérification — 'Avez-vous commencé ?' avec lien direct" },
            { jour: "J+7", action: "Email de progression — partage d'une astuce bonus non incluse dans la formation" },
            { jour: "J+14", action: "Demande d'avis — témoignage vidéo ou écrit contre une ressource bonus" },
            { jour: "J+30", action: "Offre de la formation suivante avec remise fidélité" },
          ].map(({ jour, action }) => (
            <div key={jour} className="flex items-start gap-4 rounded-xl border p-4" style={{ borderColor: C.surfaceHigh }}>
              <span className="flex-shrink-0 text-xs font-bold px-2 py-1 rounded-lg whitespace-nowrap" style={{ backgroundColor: C.surface, color: C.primary }}>
                {jour}
              </span>
              <p className="text-sm leading-relaxed" style={{ color: C.muted, ...S }}>{action}</p>
            </div>
          ))}
        </div>

        {/* 8 */}
        <SectionHeading id="upsell" number="8">
          Étape 6 — Upsell et ascension client
        </SectionHeading>

        <p className="text-[17px] leading-relaxed mb-6" style={{ color: C.muted }}>
          Votre offre principale n'est pas la fin du parcours — c'est le début.
          Les créateurs qui génèrent le plus de revenus sur Novakou ont construit
          une "échelle de valeur" : des offres de plus en plus avancées pour
          les clients qui progressent.
        </p>

        <div className="rounded-2xl border overflow-hidden my-8" style={{ borderColor: C.surfaceHigh }}>
          <div className="px-5 py-3 border-b font-bold text-sm" style={{ backgroundColor: C.surface, borderColor: C.surfaceHigh, color: C.dark, ...SH }}>
            Exemple d'échelle de valeur
          </div>
          {[
            { offre: "Ebook / guide PDF", prix: "3 000 – 8 000 FCFA", desc: "Point d'entrée. Peu de risque pour l'acheteur." },
            { offre: "Formation vidéo complète", prix: "20 000 – 80 000 FCFA", desc: "Le cœur de votre business." },
            { offre: "Formation avancée + outils", prix: "80 000 – 200 000 FCFA", desc: "Pour les clients qui veulent aller plus loin." },
            { offre: "Programme de coaching groupe", prix: "200 000 – 500 000 FCFA", desc: "Accompagnement personnalisé, résultats garantis." },
            { offre: "Mastermind / mentorat privé", prix: "500 000 FCFA+", desc: "Top de gamme, accès restreint." },
          ].map(({ offre, prix, desc }, i) => (
            <div key={offre} className="flex items-center gap-4 px-5 py-4 border-b last:border-b-0" style={{ borderColor: C.surfaceHigh }}>
              <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: C.primary, opacity: 0.5 + i * 0.12 }}>
                {i + 1}
              </span>
              <div className="flex-1">
                <p className="font-bold text-sm" style={{ ...SH, color: C.dark }}>{offre}</p>
                <p className="text-xs" style={{ color: C.muted, ...S }}>{desc}</p>
              </div>
              <span className="text-xs font-bold" style={{ color: C.primary }}>{prix}</span>
            </div>
          ))}
        </div>

        {/* 9 */}
        <SectionHeading id="retargeting" number="9">
          Étape 7 — Retargeting et récupération
        </SectionHeading>

        <p className="text-[17px] leading-relaxed mb-6" style={{ color: C.muted }}>
          Une grande partie de votre trafic ne convertit pas en première
          instance. Le retargeting vous permet de recibler ces visiteurs
          avec des publicités personnalisées. Sur Facebook et Instagram,
          vous pouvez créer des audiences personnalisées basées sur les
          visiteurs de votre page de vente Novakou.
        </p>

        <TipBox>
          <strong>Configuration du Pixel Facebook sur Novakou :</strong> dans
          votre tableau de bord Novakou, allez dans Intégrations → Pixel
          Facebook. Ajoutez votre Pixel ID. Le pixel trackera automatiquement
          les visites de votre page de vente, les initialisations de paiement,
          et les achats complétés — permettant un retargeting ultra-précis.
        </TipBox>

        {/* 10 */}
        <SectionHeading id="optimiser" number="10">
          Optimiser et scaler votre tunnel
        </SectionHeading>

        <p className="text-[17px] leading-relaxed mb-6" style={{ color: C.muted }}>
          Une fois votre tunnel en place, le travail d'optimisation commence.
          Chaque semaine, regardez ces indicateurs clés et identifiez où les
          visiteurs fuient :
        </p>

        <div className="grid sm:grid-cols-2 gap-4 my-8">
          {[
            { kpi: "Taux de conversion page de vente", seuil: "2-5%", action: "En dessous ? Améliorez les témoignages et la headline." },
            { kpi: "Taux d'abandon checkout", seuil: "< 40%", action: "Au dessus ? Ajoutez des moyens de paiement ou réduisez les champs." },
            { kpi: "Taux ouverture email bienvenue", seuil: "> 60%", action: "En dessous ? Personnalisez l'objet avec le prénom." },
            { kpi: "Taux de complétion formation", seuil: "> 40%", action: "En dessous ? Activez le déblocage progressif des modules." },
          ].map((m) => (
            <div key={m.kpi} className="rounded-2xl border p-5" style={{ borderColor: C.surfaceHigh }}>
              <p className="font-bold text-sm mb-1" style={{ ...SH, color: C.dark }}>{m.kpi}</p>
              <p className="text-xl font-bold mb-2" style={{ color: C.primary, ...SH }}>{m.seuil}</p>
              <p className="text-xs" style={{ color: C.muted, ...S }}>💡 {m.action}</p>
            </div>
          ))}
        </div>

        {/* 11 - Exemple complet */}
        <SectionHeading id="exemple-complet" number="11">
          Exemple de tunnel complet : de 0 à 500 000 FCFA/mois
        </SectionHeading>

        <p className="text-[17px] leading-relaxed mb-6" style={{ color: C.muted }}>
          Voici un exemple réel (données anonymisées) d'un créateur Novakou qui
          est passé de zéro à 500 000 FCFA mensuels en 4 mois, avec un seul
          produit et sans publicité payante.
        </p>

        <div className="rounded-2xl border overflow-hidden my-8" style={{ borderColor: C.surfaceHigh }}>
          <div className="px-5 py-3 border-b" style={{ backgroundColor: C.surface, borderColor: C.surfaceHigh }}>
            <p className="font-bold text-sm" style={{ ...SH, color: C.dark }}>Profil : Fatou, coach en nutrition africaine, Dakar</p>
            <p className="text-xs" style={{ color: C.muted }}>Formation "Maigrir sainement avec la cuisine africaine" — 35 000 FCFA</p>
          </div>
          <div className="divide-y" style={{ borderColor: C.surfaceHigh }}>
            {[
              { label: "Trafic source", val: "Posts Instagram quotidiens + Stories + Reels" },
              { label: "Lead magnet", val: "PDF gratuit '7 recettes africaines minceur' — 1 200 téléchargements/mois" },
              { label: "Séquence email", val: "5 emails sur 7 jours → taux de conversion email → achat : 8%" },
              { label: "Visiteurs page de vente", val: "820/mois" },
              { label: "Conversions directes", val: "41 ventes × 35 000 FCFA = 1 435 000 FCFA/mois" },
              { label: "Order bump (slides)", val: "5 000 FCFA × 18 acheteurs = 90 000 FCFA" },
              { label: "Upsell coaching groupe", val: "150 000 FCFA × 2 personnes = 300 000 FCFA" },
              { label: "Total mensuel", val: "≈ 1 825 000 FCFA (3 mois après lancement)" },
            ].map(({ label, val }) => (
              <div key={label} className="flex gap-4 px-5 py-3">
                <span className="text-sm font-medium w-44 flex-shrink-0" style={{ color: C.muted, ...S }}>{label}</span>
                <span className="text-sm font-bold" style={{ color: C.dark, ...SH }}>{val}</span>
              </div>
            ))}
          </div>
        </div>

        <WarnBox>
          <strong>Ces chiffres ne sont pas garantis</strong> et dépendent de
          votre niche, de votre audience et de la qualité de votre contenu.
          Cet exemple illustre ce qui est possible avec un tunnel bien configuré
          et une exécution régulière — pas un résultat moyen.
        </WarnBox>

        {/* 12 - Erreurs */}
        <SectionHeading id="erreurs" number="12">
          Les erreurs classiques qui tuent les conversions
        </SectionHeading>

        {[
          {
            err: "Copier un tunnel conçu pour le marché américain",
            desc: "Les arguments, prix, et moyens de paiement qui convertissent en France ou aux USA ne fonctionnent pas forcément en Afrique francophone. Adaptez votre message à la réalité de votre audience.",
          },
          {
            err: "Lancer avec un seul moyen de paiement",
            desc: "Si vous proposez seulement la carte bancaire, vous excluez 60% à 70% de votre marché en Afrique. Wave, Orange Money, MTN sont indispensables.",
          },
          {
            err: "Page de vente trop courte",
            desc: "En ligne, plus la décision est importante (argent, confiance), plus la page de vente doit être longue et détaillée. Une page de 5 lignes ne vend pas une formation à 50 000 FCFA.",
          },
          {
            err: "Pas de garantie",
            desc: "La garantie satisfait ou remboursé est souvent ce qui débloque les hésitants. Beaucoup d'acheteurs n'utilisent jamais la garantie, mais son existence les rassure pour acheter.",
          },
          {
            err: "Ne pas tester et itérer",
            desc: "Votre premier tunnel ne sera pas parfait. C'est normal. Ce qui compte, c'est de mesurer, d'identifier les fuites, et d'améliorer chaque semaine.",
          },
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-4 rounded-2xl border p-5 mb-4" style={{ borderColor: C.surfaceHigh }}>
            <span className="flex-shrink-0 text-2xl">⚠️</span>
            <div>
              <p className="font-bold text-sm mb-1" style={{ ...SH, color: C.dark }}>{item.err}</p>
              <p className="text-sm leading-relaxed" style={{ color: C.muted, ...S }}>{item.desc}</p>
            </div>
          </div>
        ))}

        {/* CTA */}
        <div
          className="mt-16 rounded-2xl p-8 text-center"
          style={{ background: `linear-gradient(135deg, ${C.primary} 0%, #004d20 100%)` }}
        >
          <p className="text-white text-2xl font-bold mb-3" style={SH}>
            Construisez votre tunnel de vente maintenant
          </p>
          <p className="text-white/80 mb-6 text-sm max-w-md mx-auto" style={S}>
            Novakou fournit tous les outils pour créer votre tunnel complet :
            pages de vente, checkout, emails, upsells. Commencez gratuitement.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/inscription"
              className="px-6 py-3 rounded-xl font-bold text-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: C.accent, color: C.dark, ...SH }}
            >
              Créer mon compte gratuit
            </Link>
            <Link
              href="/guides/automatisations-novakou"
              className="px-6 py-3 rounded-xl font-bold text-sm border border-white/30 text-white transition-opacity hover:opacity-80"
              style={S}
            >
              Guide : Automatisations →
            </Link>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-12 grid sm:grid-cols-2 gap-4">
          <Link href="/guides/automatisations-novakou" className="rounded-2xl border p-5 hover:border-green-300 transition-colors group" style={{ borderColor: C.surfaceHigh }}>
            <p className="text-xs mb-1" style={{ color: C.muted }}>← Guide précédent</p>
            <p className="font-bold text-sm group-hover:text-green-700 transition-colors" style={{ ...SH, color: C.dark }}>Automatisations Novakou</p>
          </Link>
          <Link href="/guides" className="rounded-2xl border p-5 hover:border-green-300 transition-colors group text-right" style={{ borderColor: C.surfaceHigh }}>
            <p className="text-xs mb-1" style={{ color: C.muted }}>Voir tous les guides →</p>
            <p className="font-bold text-sm group-hover:text-green-700 transition-colors" style={{ ...SH, color: C.dark }}>Tous les guides Novakou</p>
          </Link>
        </div>
      </article>
    </div>
  );
}
