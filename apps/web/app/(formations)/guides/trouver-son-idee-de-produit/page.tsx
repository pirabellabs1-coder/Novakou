import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title:
    "Comment trouver son idée de produit digital en Afrique | Guide 2026 · Novakou",
  description:
    "Méthode complète pour trouver une idée de formation ou produit digital rentable en Afrique francophone. La méthode des 3 cercles, analyse de niche, validation sans budget.",
  keywords: [
    "idée produit digital Afrique",
    "niche formations en ligne Afrique",
    "trouver son idée de cours en ligne",
    "valider idée formation Afrique francophone",
    "niches portantes Afrique 2026",
    "méthode 3 cercles produit digital",
  ],
  openGraph: {
    title:
      "Comment trouver son idée de produit digital en Afrique | Guide 2026 · Novakou",
    description:
      "Méthode complète pour trouver une idée de formation ou produit digital rentable en Afrique francophone. La méthode des 3 cercles, analyse de niche, validation sans budget.",
    type: "article",
  },
};

/* ─── Typographies Satoshi inline ─────────────────────────── */
const S = {
  fontFamily:
    "'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
} as const;
const SH = { ...S, fontWeight: 700, letterSpacing: "-0.04em" } as const;

/* ─── Palette Novakou ─────────────────────────────────────── */
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

/* ─── Helper components ───────────────────────────────────── */

function Breadcrumb() {
  return (
    <nav
      aria-label="Fil d'Ariane"
      className="flex items-center gap-2 text-sm mb-6"
      style={{ ...S, color: C.muted }}
    >
      <Link href="/" className="hover:underline" style={{ color: C.primary }}>
        Accueil
      </Link>
      <span>/</span>
      <Link
        href="/guides/guide-complet-novakou"
        className="hover:underline"
        style={{ color: C.primary }}
      >
        Guides
      </Link>
      <span>/</span>
      <span style={{ color: C.dark }}>Trouver son idée de produit</span>
    </nav>
  );
}

function TipBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-5 my-8 border"
      style={{
        ...S,
        backgroundColor: C.tipBg,
        borderColor: C.tipBorder,
        color: C.dark,
      }}
    >
      <div className="flex items-start gap-3">
        <span
          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold"
          style={{ backgroundColor: C.accent }}
        >
          i
        </span>
        <div className="text-[15px] leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function WarnBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-5 my-8 border"
      style={{
        ...S,
        backgroundColor: C.warnBg,
        borderColor: C.warnBorder,
        color: C.dark,
      }}
    >
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold bg-amber-500">
          !
        </span>
        <div className="text-[15px] leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function ProTip({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-5 my-8 border"
      style={{
        ...S,
        backgroundColor: C.proBg,
        borderColor: C.proBorder,
        color: C.dark,
      }}
    >
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 px-2 py-0.5 rounded text-xs font-bold text-white bg-blue-600">
          PRO
        </span>
        <div className="text-[15px] leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function SectionHeading({
  id,
  number,
  children,
}: {
  id: string;
  number?: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      id={id}
      className="text-2xl sm:text-3xl mt-16 mb-6 scroll-mt-28"
      style={{ ...SH, color: C.dark }}
    >
      {number && (
        <span
          className="inline-flex items-center justify-center w-9 h-9 rounded-full text-base mr-3 text-white"
          style={{ backgroundColor: C.primary }}
        >
          {number}
        </span>
      )}
      {children}
    </h2>
  );
}

function MockupFrame({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden my-10 border"
      style={{ borderColor: C.surfaceHigh, backgroundColor: C.white }}
    >
      <div
        className="flex items-center gap-2 px-4 py-3 border-b"
        style={{ backgroundColor: C.surfaceLow, borderColor: C.surfaceHigh }}
      >
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ef4444" }} />
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: C.accent }} />
        <span className="ml-3 text-xs font-medium" style={{ ...S, color: C.muted }}>
          {title}
        </span>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </div>
  );
}

/* ─── Table of Contents ───────────────────────────────────── */
const TOC = [
  { id: "introduction", label: "Pourquoi la bonne idée change tout" },
  { id: "trois-cercles", label: "La méthode des 3 cercles" },
  { id: "niches-portantes", label: "Les 8 niches les plus portantes en Afrique 2026" },
  { id: "analyser-concurrence", label: "Analyser la concurrence gratuitement" },
  { id: "methode-douleurs", label: "La méthode des douleurs : trouver les vrais problèmes" },
  { id: "mind-mapping", label: "Le mind-mapping : 20 idées en 30 minutes" },
  { id: "valider-48h", label: "Valider gratuitement en 48h" },
  { id: "idee-vs-produit", label: "La différence entre une idée et un produit" },
  { id: "checklist-validation", label: "Checklist finale de validation (30 points)" },
  { id: "conclusion", label: "Conclusion et prochaines étapes" },
] as const;

/* ═════════════════════════════════════════════════════════════ */
/* PAGE COMPONENT                                               */
/* ═════════════════════════════════════════════════════════════ */

export default function TrouverSonIdeePage() {
  return (
    <div style={{ backgroundColor: C.surface, color: C.dark, ...S }}>
      {/* ───────────────── HERO ───────────────── */}
      <section
        className="pt-8 pb-16"
        style={{
          background: `linear-gradient(180deg, ${C.white} 0%, ${C.surface} 100%)`,
        }}
      >
        <div className="max-w-[860px] mx-auto px-6">
          <Breadcrumb />

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span
              className="inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-[0.12em] uppercase"
              style={{ backgroundColor: C.surfaceHigh, color: C.primary, ...S }}
            >
              Guide complet
            </span>
            <span className="text-sm" style={{ color: C.muted }}>
              13 min de lecture
            </span>
            <span className="text-sm" style={{ color: C.muted }}>
              Mis à jour le 25 avril 2026
            </span>
          </div>

          <h1
            className="text-3xl sm:text-4xl lg:text-5xl leading-[1.1] mb-6"
            style={{ ...SH, color: C.dark }}
          >
            Comment trouver son{" "}
            <span style={{ color: C.primary }}>idée de produit digital</span>{" "}
            en Afrique
          </h1>

          <p
            className="text-lg leading-relaxed mb-8 max-w-2xl"
            style={{ color: C.muted }}
          >
            La méthode complète pour identifier, analyser et valider une idée
            de formation ou produit digital rentable en Afrique francophone.
            La méthode des 3 cercles, analyse de niche, validation sans budget.
          </p>

          <div className="flex items-center gap-4">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: C.primary }}
            >
              N
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: C.dark }}>
                Équipe Novakou
              </p>
              <p className="text-xs" style={{ color: C.muted }}>
                Guides et ressources pour les créateurs africains
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────── FEATURED IMAGE ───────────────── */}
      <div className="max-w-[860px] mx-auto px-4 sm:px-6 pb-2">
        <div className="rounded-2xl overflow-hidden shadow-sm">
          <Image
            src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80"
            alt="Personne qui prend des notes et réfléchit à son idée de produit digital"
            width={1200}
            height={500}
            className="w-full object-cover"
            style={{ maxHeight: 460 }}
            priority
          />
        </div>
        <div
          className="px-5 py-3 text-xs text-center rounded-b-2xl"
          style={{ backgroundColor: C.surfaceLow, color: C.muted, ...S }}
        >
          La bonne idée naît toujours d&apos;une observation attentive de votre entourage et de vos propres frustrations.
        </div>
      </div>

      {/* ───────────────── BODY ───────────────── */}
      <section className="max-w-[860px] mx-auto px-6 pb-32">
        {/* Table of Contents */}
        <div
          className="rounded-2xl p-6 sm:p-8 mb-16 mt-10 border"
          style={{ backgroundColor: C.white, borderColor: C.surfaceHigh }}
        >
          <p className="text-lg font-bold mb-4" style={{ ...SH, color: C.dark }}>
            Sommaire
          </p>
          <ol className="space-y-2">
            {TOC.map((item, idx) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="flex items-start gap-3 py-1.5 text-[15px] hover:underline transition-colors"
                  style={{ color: C.primary }}
                >
                  <span
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5"
                    style={{ backgroundColor: C.accent }}
                  >
                    {idx + 1}
                  </span>
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
        </div>

        {/* ════════════ SECTION 1 ════════════ */}
        <SectionHeading id="introduction">
          Pourquoi la bonne idée change tout
        </SectionHeading>

        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          Il existe une erreur que font presque tous les créateurs africains qui
          se lancent dans la vente de produits digitaux : ils commencent par
          créer. Ils enregistrent des vidéos, rédigent un ebook, construisent
          un cours entier, puis ils publient... et n&apos;obtiennent aucune vente.
          Non pas parce que leur contenu est mauvais, mais parce que leur idée
          de départ était erronée. Ils ont créé quelque chose que personne
          n&apos;attendait.
        </p>
        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          La bonne idée, c&apos;est celle qui se trouve à l&apos;intersection de
          ce que vous maîtrisez, de ce que votre marché demande et de ce pour
          quoi les gens sont prêts à sortir leur portefeuille. Cette intersection
          n&apos;est pas facile à trouver, mais elle existe pour chaque personne
          qui a une expertise réelle — et en Afrique francophone, les opportunités
          sont immenses et encore largement inexploitées.
        </p>
        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          En 2026, des milliers de créateurs africains génèrent des revenus
          significatifs en vendant leurs connaissances en ligne : des formateurs
          en comptabilité à Dakar, des coachs fitness à Abidjan, des enseignants
          d&apos;anglais à Douala, des experts en marketing digital à Kinshasa.
          Leur point commun ? Ils ont pris le temps de trouver la bonne idée
          avant de créer. Ce guide vous donne leur méthode.
        </p>

        <MockupFrame title="Les 3 questions fondamentales">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                q: "Est-ce que je maîtrise vraiment ce sujet ?",
                icon: "🧠",
                color: C.primary,
              },
              {
                q: "Est-ce que les gens cherchent activement cette solution ?",
                icon: "🔍",
                color: "#2563eb",
              },
              {
                q: "Est-ce que les gens ont déjà payé pour quelque chose de similaire ?",
                icon: "💰",
                color: "#7c3aed",
              },
            ].map((item) => (
              <div
                key={item.q}
                className="p-4 rounded-xl text-center border"
                style={{ borderColor: C.surfaceHigh }}
              >
                <div className="text-3xl mb-3">{item.icon}</div>
                <p className="text-sm leading-snug font-semibold" style={{ color: C.dark }}>
                  {item.q}
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-center mt-4" style={{ color: C.muted }}>
            Si vous répondez &quot;oui&quot; à ces 3 questions, vous tenez une idée viable.
          </p>
        </MockupFrame>

        {/* ════════════ SECTION 2 ════════════ */}
        <SectionHeading id="trois-cercles" number="1">
          La méthode des 3 cercles
        </SectionHeading>

        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          La méthode des 3 cercles est l&apos;outil le plus puissant pour
          identifier une idée de produit digital viable. Inspirée du concept
          japonais d&apos;Ikigai (votre raison d&apos;être), elle adapte cette
          philosophie au contexte de la création de revenus en ligne.
        </p>
        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          <strong>Cercle 1 — Ce que vous savez faire :</strong> Listez toutes
          les compétences, connaissances et expériences que vous possédez.
          Pensez à votre formation académique, vos expériences professionnelles,
          vos passions, vos hobbies. Tout compte. Une mère de famille qui cuisine
          tous les jours depuis 15 ans a une expertise réelle en cuisine africaine.
          Un technicien télécom qui répare des téléphones depuis 5 ans peut
          enseigner la réparation mobile. Un étudiant en droit qui aide ses
          camarades peut créer un guide sur les concours.
        </p>
        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          <strong>Cercle 2 — Ce que le marché veut :</strong> Identifiez les
          problèmes, frustrations et désirs de votre audience potentielle. Quelles
          compétences manquent-elles ? Quels obstacles les empêchent de progresser ?
          Quelles questions posent-elles régulièrement sur les réseaux sociaux,
          dans les groupes WhatsApp, sur YouTube ? Ce cercle se remplit par
          l&apos;observation active de votre communauté.
        </p>
        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          <strong>Cercle 3 — Ce pour quoi les gens paient :</strong> C&apos;est le
          filtre de viabilité économique. Même si quelqu&apos;un veut quelque
          chose et que vous pouvez le lui donner, encore faut-il qu&apos;il soit
          prêt à payer. Recherchez des produits similaires déjà vendus en ligne :
          sur Novakou, sur Udemy, sur YouTube Premium, sur des blogs africains.
          Si des gens paient déjà pour quelque chose de comparable, votre idée
          est économiquement validée.
        </p>

        <MockupFrame title="Exercice des 3 cercles — À remplir">
          <div className="space-y-5">
            {[
              {
                num: "1",
                label: "Ce que je sais faire (compétences, expériences, passions)",
                color: C.primary,
                placeholder: "Ex : Comptabilité des PME, réseaux sociaux, couture traditionnelle...",
              },
              {
                num: "2",
                label: "Ce que mon marché cible cherche (problèmes, questions fréquentes)",
                color: "#2563eb",
                placeholder: "Ex : Comment déclarer ses impôts, comment trouver des clients, comment coudre un boubou...",
              },
              {
                num: "3",
                label: "Ce pour quoi les gens paient déjà (produits existants similaires)",
                color: "#7c3aed",
                placeholder: "Ex : Cours de comptabilité Udemy, formations marketing Novakou...",
              },
            ].map((circle) => (
              <div
                key={circle.num}
                className="flex items-start gap-4 p-4 rounded-xl border"
                style={{ borderColor: C.surfaceHigh }}
              >
                <span
                  className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: circle.color }}
                >
                  {circle.num}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold mb-2" style={{ color: C.dark }}>
                    {circle.label}
                  </p>
                  <div
                    className="h-14 rounded-lg border px-3 flex items-center text-xs"
                    style={{ borderColor: C.surfaceHigh, color: C.muted }}
                  >
                    {circle.placeholder}
                  </div>
                </div>
              </div>
            ))}
            <div
              className="p-4 rounded-xl text-center font-semibold text-sm"
              style={{ backgroundColor: C.tipBg, color: C.primary }}
            >
              Votre idée = l&apos;intersection des 3 cercles
            </div>
          </div>
        </MockupFrame>

        <TipBox>
          <strong>Astuce pratique :</strong> Commencez par remplir le cercle 1 de
          mémoire en 10 minutes. Puis passez une heure dans les groupes Facebook
          et les chats WhatsApp de votre communauté cible pour remplir le cercle 2.
          Enfin, cherchez sur Google et YouTube des produits similaires pour
          compléter le cercle 3. L&apos;idée gagnante apparaîtra à
          l&apos;intersection des trois.
        </TipBox>

        {/* ════════════ SECTION 3 ════════════ */}
        <SectionHeading id="niches-portantes" number="2">
          Les 8 niches les plus portantes en Afrique francophone 2026
        </SectionHeading>

        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          Certaines niches génèrent structurellement plus de revenus que d&apos;autres
          sur le marché africain francophone. Ces 8 catégories dominent les ventes
          sur les plateformes de formations en ligne en Afrique, combinant une
          forte demande, une audience solvable et une vraie pénurie de contenu de
          qualité en français africain.
        </p>

        <div className="rounded-2xl overflow-hidden my-10 shadow-sm">
          <Image
            src="https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=900&q=80"
            alt="Analyse de marché sur laptop — identifier les niches rentables"
            width={900}
            height={420}
            className="w-full object-cover"
          />
          <div
            className="px-5 py-3 text-xs text-center"
            style={{ backgroundColor: C.surfaceLow, color: C.muted, ...S }}
          >
            Analyser les tendances de recherche vous aide à identifier les niches avec le plus fort potentiel de revenus.
          </div>
        </div>

        <MockupFrame title="Les 8 niches portantes — Tableau comparatif 2026">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ color: C.dark }}>
              <thead>
                <tr style={{ backgroundColor: C.surfaceLow }}>
                  <th className="text-left p-3 font-semibold rounded-tl-lg">Niche</th>
                  <th className="text-left p-3 font-semibold">Audience</th>
                  <th className="text-left p-3 font-semibold">Prix moyen</th>
                  <th className="text-left p-3 font-semibold rounded-tr-lg">Potentiel</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    niche: "Marketing digital",
                    audience: "Entrepreneurs, PME, auto-entrepreneurs",
                    price: "25 000 – 75 000 FCFA",
                    potential: "⭐⭐⭐⭐⭐",
                    color: C.primary,
                  },
                  {
                    niche: "Comptabilité / Finance",
                    audience: "Auto-entrepreneurs, dirigeants de PME",
                    price: "20 000 – 60 000 FCFA",
                    potential: "⭐⭐⭐⭐⭐",
                    color: "#2563eb",
                  },
                  {
                    niche: "Développement web",
                    audience: "Jeunes diplômés, reconversions professionnelles",
                    price: "30 000 – 100 000 FCFA",
                    potential: "⭐⭐⭐⭐⭐",
                    color: "#7c3aed",
                  },
                  {
                    niche: "Langues étrangères",
                    audience: "Professionnels, étudiants, diaspora",
                    price: "15 000 – 50 000 FCFA",
                    potential: "⭐⭐⭐⭐",
                    color: "#ea580c",
                  },
                  {
                    niche: "Cuisine africaine",
                    audience: "Femmes, diaspora, restaurateurs",
                    price: "10 000 – 35 000 FCFA",
                    potential: "⭐⭐⭐⭐",
                    color: "#dc2626",
                  },
                  {
                    niche: "Couture / Mode",
                    audience: "Femmes 20–45 ans, couturières débutantes",
                    price: "15 000 – 40 000 FCFA",
                    potential: "⭐⭐⭐⭐",
                    color: "#db2777",
                  },
                  {
                    niche: "Fitness / Bien-être",
                    audience: "Femmes actives, professionnels urbains",
                    price: "10 000 – 30 000 FCFA",
                    potential: "⭐⭐⭐",
                    color: "#0891b2",
                  },
                  {
                    niche: "Business & entrepreneuriat",
                    audience: "Jeunes entrepreneurs, reconversions",
                    price: "20 000 – 80 000 FCFA",
                    potential: "⭐⭐⭐⭐⭐",
                    color: "#059669",
                  },
                ].map((row, idx) => (
                  <tr
                    key={row.niche}
                    style={{
                      backgroundColor: idx % 2 === 0 ? C.white : C.surfaceLow,
                    }}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: row.color }}
                        />
                        <span className="font-semibold">{row.niche}</span>
                      </div>
                    </td>
                    <td className="p-3 text-xs" style={{ color: C.muted }}>
                      {row.audience}
                    </td>
                    <td
                      className="p-3 text-xs font-semibold"
                      style={{ color: C.primary }}
                    >
                      {row.price}
                    </td>
                    <td className="p-3 text-xs">{row.potential}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </MockupFrame>

        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          Le marketing digital et l&apos;entrepreneuriat dominent le marché.
          Ces deux niches bénéficient d&apos;une demande explosive : chaque jour,
          des milliers de personnes en Afrique francophone veulent lancer leur
          business ou développer leur présence en ligne, mais manquent de
          formation adaptée à leur contexte local. Les prix sont plus élevés
          car la valeur perçue est directement liée au retour sur investissement
          attendu.
        </p>
        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          La cuisine africaine et la couture sont souvent sous-estimées mais
          représentent des opportunités exceptionnelles. Ces marchés touchent
          des audiences très larges, passionnées, et prêtes à payer pour apprendre.
          Une formatrice spécialisée en cuisine ivoirienne ou en mode wax peut
          toucher à la fois le marché local et la diaspora africaine en Europe
          et en Amérique du Nord, multipliant ainsi son audience potentielle.
        </p>

        <WarnBox>
          <strong>Attention aux niches saturées :</strong> Le trading de
          crypto-monnaies et les formations pour &quot;gagner de l&apos;argent
          rapidement en ligne&quot; sont des niches surpeuplées de promesses
          douteuses. Les acheteurs sont de plus en plus méfiants. Si vous ne
          pouvez pas prouver vos résultats avec des chiffres concrets, évitez
          ces territoires. Votre réputation à long terme vaut plus qu&apos;une
          vente rapide.
        </WarnBox>

        {/* ════════════ SECTION 4 ════════════ */}
        <SectionHeading id="analyser-concurrence" number="3">
          Analyser la concurrence gratuitement
        </SectionHeading>

        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          Beaucoup de créateurs ont peur de la concurrence et choisissent des
          niches où personne n&apos;est présent. C&apos;est une erreur
          fondamentale. Une niche sans concurrents est souvent une niche sans
          marché. Si quelqu&apos;un vend déjà quelque chose de similaire et
          que ça fonctionne, c&apos;est la preuve que les clients existent et
          qu&apos;ils paient. Votre rôle est de faire mieux ou différemment,
          pas d&apos;éviter le terrain.
        </p>
        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          <strong>Sur Google :</strong> Tapez votre sujet suivi de &quot;formation&quot;,
          &quot;cours&quot; ou &quot;ebook&quot;. Observez les premiers résultats.
          Quels produits existent ? À quel prix ? Comment sont-ils présentés ?
          Quels sont leurs points faibles dans les commentaires et avis ? Ces
          lacunes sont vos opportunités.
        </p>
        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          <strong>Sur YouTube :</strong> Cherchez des vidéos sur votre sujet.
          Regardez les vidéos avec le plus de vues et de commentaires. Lisez
          les commentaires : c&apos;est une mine d&apos;or de besoins non
          satisfaits. Les questions posées dans les commentaires sont souvent
          les meilleures idées de contenu payant.
        </p>
        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          <strong>Sur Facebook :</strong> Rejoignez les groupes liés à votre
          niche. Cherchez les posts qui génèrent le plus d&apos;engagement.
          Observez quelles questions reviennent le plus souvent. Notez le
          vocabulaire exact utilisé par votre audience — vous l&apos;utiliserez
          mot pour mot dans votre marketing.
        </p>

        <MockupFrame title="Template d'analyse concurrentielle">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-xs font-semibold" style={{ color: C.muted }}>
              <span>Concurrent</span>
              <span>Prix</span>
              <span>Ce qui manque</span>
            </div>
            {[
              {
                name: "Formation X sur Udemy",
                price: "45 000 FCFA",
                gap: "Pas adapté au contexte africain",
              },
              {
                name: "Ebook Y sur Gumroad",
                price: "12 000 FCFA",
                gap: "Trop théorique, pas d'exercices",
              },
              {
                name: "Chaîne YouTube Z",
                price: "Gratuit",
                gap: "Pas de suivi, pas de certificat",
              },
            ].map((row) => (
              <div
                key={row.name}
                className="grid grid-cols-3 gap-3 items-center p-3 rounded-lg border text-sm"
                style={{ borderColor: C.surfaceHigh }}
              >
                <span className="font-medium" style={{ color: C.dark }}>
                  {row.name}
                </span>
                <span className="font-semibold" style={{ color: C.primary }}>
                  {row.price}
                </span>
                <span style={{ color: C.muted }}>{row.gap}</span>
              </div>
            ))}
            <div
              className="p-3 rounded-lg text-sm font-semibold text-center"
              style={{ backgroundColor: C.tipBg, color: C.primary }}
            >
              Votre avantage concurrentiel : [À remplir]
            </div>
          </div>
        </MockupFrame>

        <ProTip>
          <strong>Analyse avancée :</strong> Utilisez Google Trends (gratuit)
          pour comparer l&apos;intérêt de recherche de vos idées dans le temps
          et par pays. Configurez la région sur &quot;Afrique subsaharienne&quot;
          ou des pays spécifiques (Sénégal, Côte d&apos;Ivoire, Cameroun).
          Une tendance à la hausse sur 12 mois est un signal très positif pour
          valider votre niche.
        </ProTip>

        {/* ════════════ SECTION 5 ════════════ */}
        <SectionHeading id="methode-douleurs" number="4">
          La méthode des &quot;douleurs&quot; : trouver les vrais problèmes
        </SectionHeading>

        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          Les produits qui se vendent le mieux ne vendent pas un apprentissage :
          ils vendent la résolution d&apos;une douleur. Une douleur, dans le
          langage marketing, c&apos;est une frustration réelle, un obstacle
          concret, une situation que votre client potentiel vit tous les jours et
          qui l&apos;empêche d&apos;avancer.
        </p>
        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          La méthode des douleurs consiste à identifier ces points de friction
          avec précision, avant même de penser à votre produit. Voici comment
          procéder en pratique. Rendez-vous dans trois groupes Facebook liés à
          votre niche. Cherchez les posts commençant par &quot;Quelqu&apos;un
          sait comment...&quot;, &quot;J&apos;ai besoin d&apos;aide pour...&quot;,
          &quot;Quelqu&apos;un peut m&apos;expliquer...&quot;. Listez les 20
          questions qui reviennent le plus souvent. Ces questions sont les titres
          potentiels de vos prochains modules de formation.
        </p>
        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          Il existe trois niveaux de douleurs. Les <strong>douleurs de surface</strong>
          {" "}sont ce que les gens disent : &quot;Je ne sais pas créer un site web.&quot;
          Les <strong>douleurs profondes</strong> sont la vraie raison : &quot;Je
          perds des clients parce que je n&apos;ai pas de présence en ligne.&quot;
          Les <strong>douleurs identitaires</strong> sont le sens derrière : &quot;Je
          veux être vu comme un entrepreneur sérieux et professionnel.&quot;
          Votre produit doit répondre aux trois niveaux.
        </p>

        <MockupFrame title="Exemple — Cartographie des douleurs (niche : comptabilité)">
          <div className="space-y-4">
            {[
              {
                level: "Surface",
                pain: "\"Je ne comprends pas les déclarations fiscales\"",
                color: "#f59e0b",
                bg: "#fffbeb",
              },
              {
                level: "Profonde",
                pain: "\"J'ai peur d'avoir des problèmes avec les impôts et de perdre mon business\"",
                color: "#dc2626",
                bg: "#fef2f2",
              },
              {
                level: "Identitaire",
                pain: "\"Je veux gérer mon argent comme un vrai entrepreneur professionnel\"",
                color: C.primary,
                bg: C.tipBg,
              },
            ].map((item) => (
              <div
                key={item.level}
                className="flex items-start gap-4 p-4 rounded-xl border"
                style={{ backgroundColor: item.bg, borderColor: item.color + "33" }}
              >
                <span
                  className="flex-shrink-0 px-2.5 py-1 rounded text-xs font-bold text-white"
                  style={{ backgroundColor: item.color }}
                >
                  {item.level}
                </span>
                <p className="text-sm italic" style={{ color: C.dark }}>
                  {item.pain}
                </p>
              </div>
            ))}
            <div
              className="p-3 rounded-lg text-sm font-semibold"
              style={{ backgroundColor: C.surfaceLow, color: C.dark }}
            >
              Titre produit idéal :{" "}
              <span style={{ color: C.primary }}>
                &quot;Maîtrisez la comptabilité de votre PME en 30 jours — sans comptable&quot;
              </span>
            </div>
          </div>
        </MockupFrame>

        {/* ════════════ SECTION 6 ════════════ */}
        <SectionHeading id="mind-mapping" number="5">
          Le mind-mapping : 20 idées en 30 minutes
        </SectionHeading>

        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          Le mind-mapping est une technique de brainstorming visuel qui vous
          permet de générer un grand nombre d&apos;idées rapidement, sans filtre
          ni jugement. L&apos;objectif est de quantité d&apos;abord, qualité
          ensuite. Voici comment faire un mind-mapping efficace pour trouver votre
          idée de produit digital en 30 minutes.
        </p>
        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          Prenez une feuille blanche ou ouvrez un outil comme Miro, Whimsical
          ou simplement Google Slides. Écrivez votre compétence principale au
          centre. Tracez des branches pour chaque aspect de cette compétence.
          Sur chaque branche, tracez des sous-branches pour chaque problème ou
          question possible. Ne filtrez pas — notez absolument tout ce qui vous
          passe par la tête, même les idées qui semblent ridicules.
        </p>

        <MockupFrame title="Exemple de mind-map — Niche : Marketing sur Instagram">
          <div className="space-y-3">
            <div className="text-center">
              <span
                className="inline-block px-4 py-2 rounded-xl font-bold text-white text-sm"
                style={{ backgroundColor: C.primary }}
              >
                Marketing Instagram
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  branch: "Créer du contenu",
                  subs: ["Réels viraux", "Stories efficaces", "Carousel posts", "Captions qui vendent"],
                  color: "#2563eb",
                },
                {
                  branch: "Gagner des abonnés",
                  subs: ["Hashtags en Afrique", "Collaborations", "Lives vendeurs", "Giveaways légaux"],
                  color: "#7c3aed",
                },
                {
                  branch: "Vendre avec Instagram",
                  subs: ["Instagram Shopping", "DM automatiques", "Bio optimisée", "Link in bio"],
                  color: "#dc2626",
                },
                {
                  branch: "Analyse & Stratégie",
                  subs: ["Lire les Insights", "Meilleurs moments", "Stratégie de niche", "Contenu viral"],
                  color: "#ea580c",
                },
              ].map((branch) => (
                <div key={branch.branch} className="space-y-2">
                  <div
                    className="text-center px-2 py-1.5 rounded-lg text-xs font-bold text-white"
                    style={{ backgroundColor: branch.color }}
                  >
                    {branch.branch}
                  </div>
                  {branch.subs.map((sub) => (
                    <div
                      key={sub}
                      className="px-2 py-1 rounded text-xs border text-center"
                      style={{ borderColor: branch.color + "44", color: C.dark }}
                    >
                      {sub}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <p className="text-xs text-center mt-2" style={{ color: C.muted }}>
              16 idées de modules générées en moins de 15 minutes
            </p>
          </div>
        </MockupFrame>

        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          Une fois que vous avez vos 20+ idées sur la carte, passez au filtre.
          Entourez en vert les idées qui correspondent aux 3 cercles (vous
          maîtrisez, le marché veut, les gens paient). Entourez en rouge celles
          que vous ne maîtrisez pas assez. Entourez en orange celles qui sont
          prometteuses mais nécessitent plus de recherche.
        </p>
        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          À la fin de cet exercice, vous devriez avoir 3 à 5 idées encerclées
          en vert. Ce sont vos candidates. L&apos;étape suivante consiste à les
          valider rapidement avant d&apos;en choisir une et de passer à la
          création.
        </p>

        {/* ════════════ SECTION 7 ════════════ */}
        <SectionHeading id="valider-48h" number="6">
          Valider gratuitement en 48h
        </SectionHeading>

        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          La validation est l&apos;étape que la majorité des créateurs ignorent,
          et c&apos;est souvent pour cela qu&apos;ils se retrouvent avec un
          produit créé en semaines que personne n&apos;achète. Valider une
          idée ne demande pas de budget. Voici les trois méthodes les plus
          efficaces pour valider en moins de 48 heures.
        </p>

        <h3 className="text-xl font-bold mt-10 mb-4" style={{ ...SH, color: C.dark }}>
          Méthode 1 — Le sondage WhatsApp (30 min)
        </h3>
        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          Créez un sondage de 3 à 5 questions avec Google Forms (gratuit). La
          question clé est : &quot;Si cette formation existait, seriez-vous prêt
          à payer [votre prix cible] pour y accéder ?&quot; Envoyez ce sondage
          dans vos groupes WhatsApp, à vos contacts professionnels, sur vos
          pages Facebook et Instagram. Ciblez des personnes qui correspondent
          à votre audience idéale. Objectif : obtenir 50 réponses en 24 heures.
          Si 30 % disent &quot;oui&quot; et donnent leurs coordonnées, votre idée
          est validée.
        </p>

        <MockupFrame title="Sondage de validation WhatsApp — Modèle">
          <div className="space-y-4 max-w-sm mx-auto">
            <div
              className="rounded-xl p-4"
              style={{ backgroundColor: "#dcf8c6" }}
            >
              <p className="text-sm font-bold mb-3" style={{ color: "#1a1a1a" }}>
                Sondage rapide (2 min) — Donnez votre avis !
              </p>
              {[
                {
                  q: "1. Quel est votre principal défi avec [sujet] ?",
                  type: "Réponse libre",
                },
                {
                  q: "2. Avez-vous déjà cherché une formation sur ce sujet ?",
                  type: "Oui / Non",
                },
                {
                  q: "3. Si une formation complète existait, vous seriez prêt à payer :",
                  type: "Choix multiple",
                },
                {
                  q: "4. Laissez votre email pour être averti en premier",
                  type: "Email",
                },
              ].map((item) => (
                <div key={item.q} className="mb-3">
                  <p className="text-xs font-semibold mb-1" style={{ color: "#1a1a1a" }}>
                    {item.q}
                  </p>
                  <div
                    className="h-8 rounded px-2 flex items-center text-xs"
                    style={{ backgroundColor: "rgba(255,255,255,0.6)", color: "#666" }}
                  >
                    {item.type}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-center" style={{ color: C.muted }}>
              Créez ce sondage sur Google Forms — 100 % gratuit
            </p>
          </div>
        </MockupFrame>

        <h3 className="text-xl font-bold mt-10 mb-4" style={{ ...SH, color: C.dark }}>
          Méthode 2 — Le post de test dans les groupes Facebook
        </h3>
        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          Rédigez un post qui présente votre idée de formation de manière
          hypothétique : &quot;J&apos;envisage de créer une formation sur [sujet].
          Elle couvrirait [liste des modules]. Est-ce que ça vous intéresserait ?
          Commentez ci-dessous vos questions ou ajoutez vos sujets prioritaires.&quot;
          Publiez ce post dans 3 à 5 groupes Facebook actifs liés à votre niche.
          Si vous obtenez plus de 20 commentaires positifs en 24 heures, vous
          avez un signal fort.
        </p>

        <h3 className="text-xl font-bold mt-10 mb-4" style={{ ...SH, color: C.dark }}>
          Méthode 3 — La pré-vente symbolique
        </h3>
        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          C&apos;est la validation ultime. Créez une page de pré-commande simple
          sur Novakou avec un prix symbolique de 1 000 à 3 000 FCFA (prix de
          réservation anticipée). Annoncez que les premières personnes qui réservent
          paieront le prix de lancement le plus bas. Si vous obtenez 10 pré-commandes
          payées en 48 heures, votre idée est commercialement validée. Remboursez
          si vous décidez finalement de ne pas créer le produit, ou utilisez cet
          argent pour financer la création.
        </p>

        <TipBox>
          <strong>Indicateur de validation minimal recommandé :</strong>
          <ul className="mt-2 space-y-1">
            <li>Sondage : 15+ personnes disent &quot;oui je paierais&quot;</li>
            <li>Post Facebook : 20+ commentaires positifs</li>
            <li>Pré-commande : 5+ paiements effectifs</li>
          </ul>
          Si vous atteignez un seul de ces seuils, créez votre produit.
        </TipBox>

        {/* ════════════ SECTION 8 ════════════ */}
        <SectionHeading id="idee-vs-produit" number="7">
          La différence entre une idée et un produit
        </SectionHeading>

        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          Une idée, c&apos;est un sujet : &quot;Je vais créer une formation sur
          Instagram.&quot; Un produit, c&apos;est une promesse de transformation :
          &quot;En 6 semaines, passez de 0 à 1 000 abonnés qualifiés sur Instagram
          et vendez vos premières prestations.&quot; Cette distinction est
          fondamentale. Les gens n&apos;achètent pas des cours — ils achètent des
          résultats.
        </p>
        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          Pour transformer votre idée en produit, répondez à trois questions :
          Quel est le point de départ exact de mon client (où en est-il
          aujourd&apos;hui) ? Quel est le résultat précis qu&apos;il obtiendra
          après avoir suivi ma formation (où sera-t-il après) ? Quelle est la
          transformation qui se passe entre les deux (le voyage que vous guidez) ?
        </p>

        <MockupFrame title="De l'idée au produit — Exercice de transformation">
          <div className="space-y-4">
            {[
              {
                step: "Idée brute",
                text: "\"Formation Instagram\"",
                icon: "💡",
                color: "#f59e0b",
              },
              {
                step: "Point de départ",
                text: "\"Quelqu'un qui a 0 abonnés et ne sait pas comment créer du contenu attractif\"",
                icon: "🚶",
                color: C.muted,
              },
              {
                step: "Résultat final",
                text: "\"1 000 abonnés ciblés + les premières ventes générées via Instagram\"",
                icon: "🏆",
                color: "#059669",
              },
              {
                step: "Produit",
                text: "\"Instagram Business Africa : De 0 à 1 000 abonnés qualifiés et vos premières ventes en 6 semaines\"",
                icon: "📦",
                color: C.primary,
              },
            ].map((item, idx) => (
              <div
                key={item.step}
                className="flex items-start gap-4 p-4 rounded-xl border"
                style={{
                  borderColor: item.color + "44",
                  backgroundColor: idx === 3 ? C.tipBg : C.white,
                }}
              >
                <span className="text-2xl flex-shrink-0">{item.icon}</span>
                <div>
                  <p
                    className="text-xs font-bold mb-1 uppercase tracking-wide"
                    style={{ color: item.color }}
                  >
                    {item.step}
                  </p>
                  <p className="text-sm" style={{ color: C.dark }}>
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </MockupFrame>

        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          Le titre de votre produit doit refléter cette transformation. Les
          meilleurs titres de formations incluent souvent un chiffre (durée,
          résultat mesurable), une spécificité (pour qui exactement) et une
          promesse (ce que vous obtiendrez). &quot;Maîtrisez Excel en 15 jours
          pour les PME africaines&quot; est bien meilleur que &quot;Formation
          Excel&quot;.
        </p>

        {/* ════════════ SECTION 9 ════════════ */}
        <SectionHeading id="checklist-validation">
          Checklist finale de validation (30 points)
        </SectionHeading>

        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          Avant de créer votre produit, passez chaque idée candidate à travers
          cette checklist de 30 points. C&apos;est le filtre ultime pour s&apos;assurer
          que vous investissez votre temps et votre énergie sur l&apos;idée qui
          a le plus de chances de réussir.
        </p>

        <MockupFrame title="Checklist de validation des 30 points">
          <div className="space-y-5">
            {[
              {
                cat: "Expertise (10 points)",
                color: C.primary,
                items: [
                  "J'ai au moins 12 mois d'expérience pratique dans ce domaine",
                  "J'ai obtenu des résultats concrets et mesurables grâce à cette compétence",
                  "J'ai déjà aidé d'autres personnes à progresser dans ce domaine",
                  "Je peux prouver mon expertise (portfolio, témoignages, certifications)",
                  "Je suis encore actif dans ce domaine (pas une compétence obsolète)",
                  "Je peux répondre aux questions avancées de mon audience",
                  "Je connais les outils, méthodes et ressources les plus récents",
                  "Ma connaissance est spécifique au contexte africain francophone",
                  "Je suis capable de simplifier des concepts complexes",
                  "Je peux créer du contenu sur ce sujet pendant au moins 3 heures",
                ],
              },
              {
                cat: "Marché (10 points)",
                color: "#2563eb",
                items: [
                  "J'ai trouvé au moins 3 concurrents qui vendent déjà dans cette niche",
                  "J'ai identifié 5+ problèmes spécifiques que mon audience rencontre",
                  "Des gens posent des questions sur ce sujet dans les groupes Facebook",
                  "La tendance Google est stable ou en hausse sur 12 mois",
                  "Il existe une audience YouTube active sur ce sujet en français",
                  "J'ai identifié au moins 2 audiences différentes pour ce produit",
                  "Le marché est suffisamment grand (> 50 000 personnes potentielles)",
                  "Ma niche n'est pas saturée de fausses promesses ou d'arnaques",
                  "Les acheteurs potentiels ont un besoin urgent de cette solution",
                  "Mon produit résout un problème récurrent, pas un problème ponctuel",
                ],
              },
              {
                cat: "Viabilité économique (10 points)",
                color: "#7c3aed",
                items: [
                  "Des produits similaires se vendent déjà à un prix proche du mien",
                  "J'ai réalisé un sondage avec au moins 30 répondants",
                  "Au moins 15 personnes ont dit qu'elles paieraient pour ma solution",
                  "J'ai calculé combien de ventes il me faut pour atteindre mes objectifs",
                  "Mon prix est aligné avec la grille de pricing du marché africain",
                  "Je peux rentabiliser le temps investi en moins de 6 mois",
                  "J'ai identifié un chemin d'upsell (produit premium à vendre après)",
                  "Mon produit peut être vendu à la diaspora africaine (marché plus solvable)",
                  "Je peux créer ce produit avec moins de 50 000 FCFA de budget",
                  "Ce produit peut générer des ventes en pilote automatique",
                ],
              },
            ].map((section) => (
              <div key={section.cat}>
                <p
                  className="text-sm font-bold mb-3 px-1 flex items-center gap-2"
                  style={{ color: section.color }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: section.color }}
                  />
                  {section.cat}
                </p>
                <div className="space-y-1.5">
                  {section.items.map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-3 p-2.5 rounded-lg"
                      style={{ backgroundColor: C.surfaceLow }}
                    >
                      <span
                        className="flex-shrink-0 w-5 h-5 rounded border-2 mt-0.5"
                        style={{ borderColor: section.color + "88" }}
                      />
                      <span className="text-sm" style={{ color: C.dark }}>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div
              className="p-4 rounded-xl text-center font-semibold text-sm"
              style={{ backgroundColor: C.tipBg, color: C.primary }}
            >
              Score idéal : 25/30 ou plus. En dessous de 20, pivotez votre idée.
            </div>
          </div>
        </MockupFrame>

        {/* ════════════ SECTION 10 ════════════ */}
        <SectionHeading id="conclusion">
          Votre prochaine étape : passer à la création
        </SectionHeading>

        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          Vous avez maintenant tous les outils pour trouver, analyser et valider
          votre idée de produit digital. La méthode des 3 cercles vous permet
          d&apos;identifier l&apos;intersection entre votre expertise, les besoins
          du marché et la viabilité économique. L&apos;analyse de la concurrence
          vous révèle les opportunités cachées. La méthode des douleurs vous
          connecte aux vrais besoins de votre audience. Et la validation en 48h
          vous évite de créer dans le vide.
        </p>
        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          La grande majorité des créateurs africains qui ne réussissent pas ont
          un seul problème en commun : ils ont sauté cette phase et créé un
          produit que personne n&apos;attendait. Ne faites pas cette erreur.
          Prenez deux jours pour faire les exercices de ce guide. Remplissez
          les 3 cercles. Analysez vos concurrents. Lancez votre sondage WhatsApp.
          Obtenez vos 15 validations. Et ensuite — et seulement ensuite — commencez
          à créer.
        </p>
        <p className="text-[16px] leading-[1.8] mb-8" style={{ color: C.dark }}>
          Une bonne idée validée, transformée en produit de qualité et vendue
          sur la bonne plateforme, c&apos;est un business durable. Novakou a
          été conçu pour accompagner exactement ce parcours : de l&apos;idée
          validée à la première vente, avec des paiements Mobile Money adaptés
          au marché africain et les outils marketing intégrés dont vous avez besoin.
        </p>

        {/* CTA Block */}
        <div
          className="rounded-2xl p-8 sm:p-12 text-center"
          style={{
            background: `linear-gradient(135deg, ${C.primary} 0%, #004d21 100%)`,
          }}
        >
          <p className="text-2xl sm:text-3xl text-white mb-4" style={SH}>
            Vous avez trouvé votre idée ?
          </p>
          <p
            className="text-base mb-8 max-w-lg mx-auto"
            style={{ ...S, color: "rgba(255,255,255,0.8)" }}
          >
            Créez votre compte vendeur sur Novakou et transformez votre idée
            validée en produit digital qui se vend. Inscription gratuite,
            paiements Mobile Money inclus.
          </p>
          <Link
            href="/inscription?role=vendeur"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold transition-transform hover:scale-[1.03]"
            style={{ ...S, backgroundColor: C.white, color: C.primary }}
          >
            Créer mon compte vendeur gratuitement
            <span aria-hidden="true" className="text-lg">&rarr;</span>
          </Link>
          <p
            className="text-sm mt-4"
            style={{ ...S, color: "rgba(255,255,255,0.6)" }}
          >
            10 % de commission uniquement sur vos ventes. Aucun frais caché.
          </p>
        </div>

        {/* Related guides */}
        <div className="mt-20">
          <p className="text-lg font-bold mb-6" style={{ ...SH, color: C.dark }}>
            Guides complémentaires
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                href: "/guides/creer-son-produit",
                title: "Comment créer son premier produit digital",
                desc: "Une fois votre idée validée, passez à la création : structure, production, publication sur Novakou.",
              },
              {
                href: "/guides/publicite-facebook",
                title: "Publicité Facebook pour vendre ses formations en Afrique",
                desc: "Apprenez à créer des campagnes Facebook rentables pour toucher votre audience cible en Afrique.",
              },
            ].map((guide) => (
              <Link
                key={guide.href}
                href={guide.href}
                className="block p-5 rounded-xl border transition-shadow hover:shadow-md"
                style={{ backgroundColor: C.white, borderColor: C.surfaceHigh }}
              >
                <p className="text-sm font-bold mb-1" style={{ color: C.dark }}>
                  {guide.title}
                </p>
                <p className="text-sm" style={{ color: C.muted }}>
                  {guide.desc}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
