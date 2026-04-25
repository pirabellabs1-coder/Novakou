import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title:
    "Comment creer son premier produit digital en 2026 | Guide complet Novakou",
  description:
    "Guide etape par etape pour creer et vendre votre premier produit digital en Afrique francophone. Formations video, ebooks, templates, coaching : decouvrez la methode complete pour lancer votre business en ligne sur Novakou.",
  openGraph: {
    title:
      "Comment creer son premier produit digital en 2026 | Guide Novakou",
    description:
      "Le guide complet pour creer, tarifer et vendre votre premier produit digital en Afrique francophone. 6 etapes concretes, checklist incluse.",
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
      <span style={{ color: C.dark }}>Creer son produit digital</span>
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
      {/* Window bar */}
      <div
        className="flex items-center gap-2 px-4 py-3 border-b"
        style={{ backgroundColor: C.surfaceLow, borderColor: C.surfaceHigh }}
      >
        <span
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: "#ef4444" }}
        />
        <span
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: "#f59e0b" }}
        />
        <span
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: C.accent }}
        />
        <span
          className="ml-3 text-xs font-medium"
          style={{ ...S, color: C.muted }}
        >
          {title}
        </span>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </div>
  );
}

/* ─── Table of Contents data ──────────────────────────────── */
const TOC = [
  { id: "introduction", label: "Introduction" },
  { id: "types-produits", label: "Les 5 types de produits les plus rentables" },
  { id: "etape-1", label: "Identifier votre expertise unique" },
  { id: "etape-2", label: "Valider votre idee avant de creer" },
  { id: "etape-3", label: "Structurer votre contenu" },
  { id: "etape-4", label: "Produire votre contenu" },
  { id: "etape-5", label: "Creer votre produit sur Novakou" },
  { id: "etape-6", label: "Fixer le prix juste" },
  { id: "checklist", label: "Checklist finale" },
  { id: "conclusion", label: "Conclusion" },
] as const;

/* ═════════════════════════════════════════════════════════════ */
/* PAGE COMPONENT                                               */
/* ═════════════════════════════════════════════════════════════ */

export default function CreerSonProduitPage() {
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
            <span
              className="text-sm"
              style={{ color: C.muted }}
            >
              12 min de lecture
            </span>
            <span className="text-sm" style={{ color: C.muted }}>
              Mis a jour le 25 avril 2026
            </span>
          </div>

          <h1
            className="text-3xl sm:text-4xl lg:text-5xl leading-[1.1] mb-6"
            style={{ ...SH, color: C.dark }}
          >
            Comment creer son premier{" "}
            <span style={{ color: C.primary }}>produit digital</span> en 2026
          </h1>

          <p
            className="text-lg leading-relaxed mb-8 max-w-2xl"
            style={{ color: C.muted }}
          >
            Le guide etape par etape pour transformer votre savoir en un produit
            digital rentable. De l&apos;idee a la premiere vente sur Novakou,
            decouvrez la methode complete adaptee au marche africain
            francophone.
          </p>

          {/* Author / meta */}
          <div className="flex items-center gap-4">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: C.primary }}
            >
              N
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: C.dark }}>
                Equipe Novakou
              </p>
              <p className="text-xs" style={{ color: C.muted }}>
                Guides et ressources pour les createurs africains
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────── BODY ───────────────── */}
      <section className="max-w-[860px] mx-auto px-6 pb-32">
        {/* Table of Contents */}
        <div
          className="rounded-2xl p-6 sm:p-8 mb-16 border"
          style={{
            backgroundColor: C.white,
            borderColor: C.surfaceHigh,
          }}
        >
          <p
            className="text-lg font-bold mb-4"
            style={{ ...SH, color: C.dark }}
          >
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

        {/* ════════════════════════════════════════════════════════ */}
        {/*  SECTION 1 — INTRODUCTION                              */}
        {/* ════════════════════════════════════════════════════════ */}
        <SectionHeading id="introduction">
          Pourquoi creer un produit digital en Afrique en 2026
        </SectionHeading>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          L&apos;Afrique francophone vit une transformation numerique sans
          precedent. Avec plus de 400 millions de francophones sur le continent,
          une penetration mobile en croissance exponentielle et une classe
          moyenne de plus en plus connectee, le marche des produits digitaux
          represente une opportunite historique pour les entrepreneurs africains.
        </p>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Un produit digital, c&apos;est tout contenu que vous creez une fois et
          que vous vendez a l&apos;infini, sans stock, sans logistique
          physique, sans frontiere. Une formation video enregistree depuis
          Abidjan peut etre achetee par un etudiant a Dakar, un professionnel a
          Douala ou un entrepreneur a Paris. C&apos;est le modele economique le
          plus scalable qui existe.
        </p>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          En 2026, les chiffres parlent d&apos;eux-memes : le marche de
          l&apos;e-learning en Afrique depasse les 8 milliards de dollars, avec
          une croissance annuelle de 15 %. Les createurs qui se positionnent
          maintenant construisent les empires de demain. Et contrairement a ce
          que beaucoup croient, vous n&apos;avez pas besoin d&apos;etre un
          expert mondial ou d&apos;avoir du materiel professionnel pour
          commencer. Vous avez besoin d&apos;une expertise reelle, d&apos;une
          methode structuree et d&apos;une plateforme adaptee a votre marche.
        </p>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          C&apos;est exactement ce que ce guide va vous donner. En six etapes
          concretes, vous allez passer de l&apos;idee brute a un produit
          digital en vente sur Novakou, avec des paiements Mobile Money, une
          boutique professionnelle et vos premiers clients. Que vous soyez
          developpeur, designer, comptable, coach sportif, cuisiniere ou
          marketeur, votre savoir a de la valeur. Ce guide vous montre comment
          la monetiser.
        </p>

        <MockupFrame title="Statistiques du marche digital africain">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { value: "400M+", label: "Francophones en Afrique" },
              { value: "$8Mds", label: "Marche e-learning 2026" },
              { value: "+15%", label: "Croissance annuelle" },
            ].map((stat) => (
              <div key={stat.label} className="py-4">
                <p
                  className="text-2xl sm:text-3xl font-bold mb-1"
                  style={{ ...SH, color: C.primary }}
                >
                  {stat.value}
                </p>
                <p className="text-xs" style={{ color: C.muted }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </MockupFrame>

        {/* ════════════════════════════════════════════════════════ */}
        {/*  SECTION 2 — 5 TYPES DE PRODUITS                       */}
        {/* ════════════════════════════════════════════════════════ */}
        <SectionHeading id="types-produits">
          Les 5 types de produits digitaux les plus rentables
        </SectionHeading>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Avant de vous lancer tete baissee dans la creation, il est essentiel
          de comprendre les differents types de produits digitaux et de choisir
          celui qui correspond le mieux a votre expertise, votre audience et vos
          objectifs financiers. Voici les cinq categories qui generent le plus
          de revenus sur le marche africain francophone en 2026.
        </p>

        <MockupFrame title="Les 5 types de produits digitaux">
          <div className="space-y-4">
            {[
              {
                icon: "1",
                name: "Formations video",
                desc: "Cours structures en modules et lecons. Le format roi : marge de 90%, scalable a l'infini.",
                price: "15 000 - 150 000 FCFA",
                color: C.primary,
              },
              {
                icon: "2",
                name: "Ebooks et guides PDF",
                desc: "Guides pratiques, methodes, recettes. Rapide a creer, excellent produit d'entree de gamme.",
                price: "3 000 - 25 000 FCFA",
                color: "#2563eb",
              },
              {
                icon: "3",
                name: "Templates et ressources",
                desc: "Modeles Canva, tableurs Excel, presets photo, templates Notion. Forte demande recurrente.",
                price: "5 000 - 50 000 FCFA",
                color: "#7c3aed",
              },
              {
                icon: "4",
                name: "Coaching et mentorat",
                desc: "Accompagnement individuel ou en groupe. Le format le plus premium et le plus personnalise.",
                price: "50 000 - 500 000 FCFA",
                color: "#dc2626",
              },
              {
                icon: "5",
                name: "Communautes privees",
                desc: "Acces a un groupe exclusif avec contenu regulier, networking et Q&A. Revenus recurrents.",
                price: "5 000 - 30 000 FCFA / mois",
                color: "#ea580c",
              },
            ].map((product) => (
              <div
                key={product.name}
                className="flex items-start gap-4 p-4 rounded-xl border"
                style={{ borderColor: C.surfaceHigh }}
              >
                <span
                  className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: product.color }}
                >
                  {product.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm mb-1" style={{ color: C.dark }}>
                    {product.name}
                  </p>
                  <p className="text-sm leading-relaxed mb-2" style={{ color: C.muted }}>
                    {product.desc}
                  </p>
                  <span
                    className="inline-block px-2 py-0.5 rounded text-xs font-semibold"
                    style={{ backgroundColor: C.surfaceLow, color: C.primary }}
                  >
                    {product.price}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </MockupFrame>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Les formations video restent le format le plus populaire et le plus
          rentable. Elles permettent de transmettre des competences de maniere
          structuree, avec un investissement initial en temps qui se rentabilise
          sur le long terme. Un bon cours peut generer des ventes pendant des
          annees sans que vous ayez a refaire quoi que ce soit.
        </p>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Les ebooks et guides PDF sont le meilleur point d&apos;entree. Ils
          sont rapides a creer (une a deux semaines), ne necessitent aucun
          materiel particulier, et servent souvent de produit d&apos;appel pour
          attirer des clients vers vos offres plus premium. Un guide bien
          redige sur un sujet precis, par exemple &quot;Les 20 recettes
          ivoiriennes les plus demandees en traiteur&quot;, peut se vendre des
          centaines de fois a un prix accessible.
        </p>

        <TipBox>
          <strong>Conseil strategique :</strong> Commencez par un ebook ou un
          petit template comme produit d&apos;entree, puis proposez une
          formation video complete comme produit premium. Cette approche en
          echelle vous permet de tester le marche a moindre risque avant
          d&apos;investir du temps dans un contenu plus elabore.
        </TipBox>

        {/* ════════════════════════════════════════════════════════ */}
        {/*  SECTION 3 — ETAPE 1 : EXPERTISE                      */}
        {/* ════════════════════════════════════════════════════════ */}
        <SectionHeading id="etape-1" number="1">
          Identifier votre expertise unique
        </SectionHeading>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          La premiere erreur que font la plupart des createurs debutants, c&apos;est
          de vouloir enseigner quelque chose de &quot;populaire&quot; plutot que
          quelque chose qu&apos;ils maitrisent reellement. Votre produit digital
          doit naitre a l&apos;intersection de trois cercles : ce que vous savez
          faire, ce que les gens veulent apprendre, et ce pour quoi ils sont
          prets a payer.
        </p>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Posez-vous ces questions fondamentales : Quel probleme resolvez-vous
          regulierement pour les autres ? Quelles questions vous pose-t-on
          souvent ? Dans quel domaine avez-vous au moins deux ans
          d&apos;experience pratique ? Quels resultats concrets avez-vous
          obtenus pour vous-meme ou pour des clients ?
        </p>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Vous n&apos;avez pas besoin d&apos;etre le meilleur au monde. Vous avez
          besoin d&apos;etre meilleur que votre audience cible. Un developpeur
          web avec trois ans d&apos;experience a enormement a enseigner a
          quelqu&apos;un qui debute. Un comptable qui gere les declarations
          fiscales depuis cinq ans peut creer un guide indispensable pour les
          auto-entrepreneurs. Une cuisiniere qui maitrise la patisserie africaine
          peut transformer ses recettes en un produit digital irresistible.
        </p>

        <MockupFrame title="Exercice : Trouver votre zone de genie">
          <div className="space-y-5">
            <div>
              <p className="text-sm font-semibold mb-2" style={{ color: C.dark }}>
                Repondez a ces 4 questions :
              </p>
            </div>
            {[
              "Quel probleme resolvez-vous regulierement pour d'autres personnes ?",
              "Quelles competences vous ont permis d'obtenir des resultats concrets ?",
              "Sur quel sujet vos proches, collegues ou clients viennent-ils vous consulter ?",
              "Quel domaine vous passionne au point d'en parler gratuitement pendant des heures ?",
            ].map((q, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg"
                style={{ backgroundColor: C.surfaceLow }}
              >
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: C.primary }}
                >
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm" style={{ color: C.dark }}>
                    {q}
                  </p>
                  <div
                    className="mt-2 h-8 rounded border border-dashed flex items-center px-3"
                    style={{ borderColor: C.surfaceHigh }}
                  >
                    <span className="text-xs" style={{ color: C.muted }}>
                      Votre reponse...
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </MockupFrame>

        <WarnBox>
          <strong>Piege a eviter :</strong> Ne choisissez pas un sujet
          uniquement parce qu&apos;il est tendance. Si vous n&apos;avez pas
          d&apos;experience reelle en trading de crypto-monnaies, ne creez pas
          un cours sur le trading. Votre manque d&apos;expertise se verra
          rapidement, et votre reputation en souffrira. L&apos;authenticite est
          votre meilleur atout.
        </WarnBox>

        {/* ════════════════════════════════════════════════════════ */}
        {/*  SECTION 4 — ETAPE 2 : VALIDATION                     */}
        {/* ════════════════════════════════════════════════════════ */}
        <SectionHeading id="etape-2" number="2">
          Valider votre idee avant de creer
        </SectionHeading>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          C&apos;est l&apos;etape que 80 % des createurs sautent, et c&apos;est
          souvent la raison pour laquelle leur produit ne se vend pas. Valider
          votre idee signifie s&apos;assurer que des personnes reelles sont
          pretes a payer pour la solution que vous proposez, avant
          d&apos;investir des semaines dans la creation du contenu.
        </p>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Voici la methode de validation gratuite en quatre actions concretes.
          Premierement, identifiez votre audience cible avec precision.
          &quot;Tout le monde&quot; n&apos;est pas une audience. Definissez qui
          est votre acheteur ideal : age, pays, profession, niveau
          d&apos;experience, probleme principal. Par exemple : &quot;Femmes
          entrepreneures en Cote d&apos;Ivoire, 25-40 ans, qui veulent lancer
          un business de traiteur mais ne savent pas gerer la comptabilite.&quot;
        </p>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Deuxiemement, allez la ou votre audience se trouve. Rejoignez les
          groupes Facebook, les chaines Telegram, les forums et les communautes
          WhatsApp ou vos clients potentiels echangent. Observez les questions
          qu&apos;ils posent, les problemes qu&apos;ils partagent, les solutions
          qu&apos;ils cherchent. Notez les mots exacts qu&apos;ils utilisent :
          ce sera votre vocabulaire de vente.
        </p>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Troisiemement, proposez un contenu gratuit qui teste l&apos;interet.
          Publiez un article de blog, une video YouTube, un post LinkedIn ou un
          thread Twitter qui aborde un aspect de votre sujet. Si ce contenu
          genere de l&apos;engagement, des commentaires, des partages et des
          questions du type &quot;Tu proposes une formation la-dessus ?&quot;,
          vous tenez quelque chose.
        </p>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Quatriemement, faites une pre-vente. Creez une page simple qui
          presente votre produit a venir avec un prix et un bouton de
          pre-commande. Si des gens paient avant meme que le produit existe,
          vous avez la validation ultime. Novakou vous permet de creer cette
          page de pre-lancement en quelques minutes.
        </p>

        <MockupFrame title="Template de page de pre-lancement">
          <div className="text-center py-4">
            <div
              className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: C.surfaceLow }}
            >
              <span className="text-2xl" style={{ color: C.primary }}>
                *
              </span>
            </div>
            <p
              className="text-lg font-bold mb-2"
              style={{ ...SH, color: C.dark }}
            >
              [Titre de votre produit]
            </p>
            <p className="text-sm mb-4 max-w-sm mx-auto" style={{ color: C.muted }}>
              [Description en une phrase du benefice principal pour votre client]
            </p>
            <div
              className="inline-block px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ backgroundColor: C.surfaceLow, color: C.primary }}
            >
              15 000 FCFA au lieu de 25 000 FCFA (prix de lancement)
            </div>
            <div className="mt-4">
              <span
                className="inline-block px-6 py-3 rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: C.primary }}
              >
                Je pre-commande maintenant
              </span>
            </div>
            <p className="text-xs mt-3" style={{ color: C.muted }}>
              Lancement prevu le [date] - Places limitees
            </p>
          </div>
        </MockupFrame>

        <ProTip>
          <strong>Astuce des pros :</strong> Fixez un objectif de validation
          clair avant de commencer. Par exemple : &quot;Si j&apos;obtiens 20
          pre-commandes en 7 jours, je cree le produit. Sinon, je pivote.&quot;
          Cette discipline vous evitera de passer des mois sur un produit que
          personne ne veut.
        </ProTip>

        {/* ════════════════════════════════════════════════════════ */}
        {/*  SECTION 5 — ETAPE 3 : STRUCTURER                     */}
        {/* ════════════════════════════════════════════════════════ */}
        <SectionHeading id="etape-3" number="3">
          Structurer votre contenu
        </SectionHeading>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          La structure de votre produit digital est ce qui fait la difference
          entre un contenu que les gens consomment jusqu&apos;au bout et un
          contenu qu&apos;ils abandonnent apres le premier chapitre. Une bonne
          structure suit un arc de progression : vous partez du point A (ou se
          trouve votre client aujourd&apos;hui) pour l&apos;amener au point B
          (le resultat qu&apos;il desire).
        </p>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Pour une formation video, organisez votre contenu en modules et
          lecons. Chaque module couvre un theme majeur. Chaque lecon traite un
          sous-sujet precis et dure idealement entre 5 et 15 minutes. Les
          apprenants preferent des lecons courtes et focalisees plutot que de
          longues sessions. Prevoyez un module d&apos;introduction qui pose le
          contexte et un module final qui recapitule et donne les prochaines
          etapes.
        </p>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Pour un ebook, pensez en chapitres avec une progression logique.
          Commencez par le probleme, expliquez les concepts cles, puis donnez
          les etapes d&apos;action. Chaque chapitre doit se terminer par un
          resume ou un exercice pratique. Un bon ebook fait entre 30 et 80
          pages, pas besoin d&apos;ecrire un roman.
        </p>

        <MockupFrame title="Exemple de structure : Formation 'Lancer son e-commerce'">
          <div className="space-y-3">
            {[
              {
                module: "Module 1",
                title: "Les fondamentaux du e-commerce en Afrique",
                lessons: 4,
                duration: "45 min",
              },
              {
                module: "Module 2",
                title: "Choisir et sourcer vos produits",
                lessons: 5,
                duration: "1h10",
              },
              {
                module: "Module 3",
                title: "Creer votre boutique en ligne",
                lessons: 6,
                duration: "1h30",
              },
              {
                module: "Module 4",
                title: "Configurer vos paiements Mobile Money",
                lessons: 3,
                duration: "35 min",
              },
              {
                module: "Module 5",
                title: "Marketing et premieres ventes",
                lessons: 5,
                duration: "1h15",
              },
              {
                module: "Module 6",
                title: "Scaler et automatiser",
                lessons: 4,
                duration: "50 min",
              },
            ].map((m) => (
              <div
                key={m.module}
                className="flex items-center gap-4 p-3 rounded-lg border"
                style={{ borderColor: C.surfaceHigh }}
              >
                <span
                  className="flex-shrink-0 px-2.5 py-1 rounded text-xs font-bold text-white"
                  style={{ backgroundColor: C.primary }}
                >
                  {m.module}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: C.dark }}>
                    {m.title}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs flex-shrink-0" style={{ color: C.muted }}>
                  <span>{m.lessons} lecons</span>
                  <span
                    className="px-2 py-0.5 rounded"
                    style={{ backgroundColor: C.surfaceLow }}
                  >
                    {m.duration}
                  </span>
                </div>
              </div>
            ))}
            <div className="pt-2 flex items-center justify-between text-sm px-1">
              <span className="font-semibold" style={{ color: C.dark }}>
                Total : 27 lecons
              </span>
              <span style={{ color: C.primary }} className="font-bold">
                5h45 de contenu
              </span>
            </div>
          </div>
        </MockupFrame>

        <TipBox>
          <strong>Regle du &quot;Quick Win&quot; :</strong> Placez un resultat
          rapide et concret dans les premieres lecons. Si votre apprenant obtient
          un petit succes des le debut, il sera motive pour continuer. Par
          exemple, dans une formation sur le design graphique, faites-lui creer
          un logo simple des la lecon 3.
        </TipBox>

        {/* ════════════════════════════════════════════════════════ */}
        {/*  SECTION 6 — ETAPE 4 : PRODUIRE                       */}
        {/* ════════════════════════════════════════════════════════ */}
        <SectionHeading id="etape-4" number="4">
          Produire votre contenu
        </SectionHeading>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          C&apos;est l&apos;etape qui bloque le plus de createurs, souvent
          parce qu&apos;ils pensent avoir besoin de materiel professionnel
          couteux. La realite ? Les meilleurs produits digitaux vendus en
          Afrique francophone en 2026 sont souvent crees avec un smartphone et
          des outils gratuits. Ce qui compte, c&apos;est la qualite du contenu,
          pas la qualite de la production.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Pour les formations video
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Utilisez votre smartphone avec un trepied basique (2 000 a 5 000 FCFA
          sur le marche). Filmez dans un endroit calme avec un bon eclairage
          naturel, face a une fenetre. L&apos;audio est plus important que la
          video : investissez dans un micro-cravate a 5 000 FCFA, cela change
          tout. Pour les tutoriels logiciels, utilisez OBS Studio (gratuit) pour
          enregistrer votre ecran. Montez vos videos avec CapCut (gratuit sur
          mobile) ou DaVinci Resolve (gratuit sur PC).
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Pour les ebooks et guides PDF
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Redigez dans Google Docs ou Notion, puis mettez en page avec Canva
          (version gratuite suffisante). Canva propose des centaines de
          templates de ebooks professionnels. Ajoutez des visuels, des
          infographies, des captures d&apos;ecran et des schemas pour rendre
          votre contenu plus digeste. Exportez en PDF haute qualite. Un bon
          ebook fait entre 30 et 80 pages avec une mise en page aeree.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Pour les templates et ressources
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Creez vos templates dans l&apos;outil natif (Canva pour les designs,
          Google Sheets ou Excel pour les tableurs, Notion pour les systemes
          d&apos;organisation). Assurez-vous que vos templates sont faciles a
          personnaliser et incluez un guide d&apos;utilisation rapide.
          L&apos;experience utilisateur de votre template est aussi importante
          que son contenu.
        </p>

        <MockupFrame title="Kit de production minimaliste">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                cat: "Video",
                items: [
                  "Smartphone recent",
                  "Trepied (2-5K FCFA)",
                  "Micro-cravate (5K FCFA)",
                  "OBS Studio (gratuit)",
                  "CapCut (gratuit)",
                ],
              },
              {
                cat: "Ecrit / Design",
                items: [
                  "Google Docs (gratuit)",
                  "Canva (gratuit)",
                  "Notion (gratuit)",
                  "Google Sheets (gratuit)",
                  "Unsplash pour les photos",
                ],
              },
            ].map((kit) => (
              <div
                key={kit.cat}
                className="p-4 rounded-xl"
                style={{ backgroundColor: C.surfaceLow }}
              >
                <p
                  className="text-sm font-bold mb-3"
                  style={{ color: C.primary }}
                >
                  {kit.cat}
                </p>
                <ul className="space-y-2">
                  {kit.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-sm"
                      style={{ color: C.dark }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: C.accent }}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div
            className="mt-4 p-3 rounded-lg text-center text-sm font-semibold"
            style={{ backgroundColor: C.tipBg, color: C.primary }}
          >
            Budget total de demarrage : 7 000 - 10 000 FCFA
          </div>
        </MockupFrame>

        <WarnBox>
          <strong>Attention a la paralysie du perfectionnisme :</strong> Votre
          premier produit ne sera pas parfait, et c&apos;est normal. Il vaut
          mieux un produit lance a 80 % qu&apos;un produit parfait qui ne sort
          jamais. Vous pourrez toujours l&apos;ameliorer apres les premiers
          retours clients. Les createurs qui reussissent sont ceux qui lancent,
          pas ceux qui perfectionnent indefiniment.
        </WarnBox>

        {/* ════════════════════════════════════════════════════════ */}
        {/*  SECTION 7 — ETAPE 5 : CREER SUR NOVAKOU              */}
        {/* ════════════════════════════════════════════════════════ */}
        <SectionHeading id="etape-5" number="5">
          Creer votre produit sur Novakou
        </SectionHeading>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Une fois votre contenu pret, il est temps de le mettre en vente sur
          Novakou. La plateforme a ete concue pour que le processus soit le
          plus simple possible, meme si vous n&apos;avez aucune experience
          technique. Voici les etapes detaillees pour creer votre produit.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          1. Creez votre compte vendeur
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Rendez-vous sur Novakou et inscrivez-vous en tant que vendeur.
          L&apos;inscription prend moins de 2 minutes : votre nom, votre email,
          un mot de passe. Vous confirmez votre email avec un code de
          verification, et votre espace vendeur est pret. Aucun abonnement
          n&apos;est requis : Novakou fonctionne a la commission (10 % par
          vente), ce qui signifie que vous ne payez que quand vous gagnez.
        </p>

        <MockupFrame title="novakou.com - Inscription vendeur">
          <div className="max-w-sm mx-auto py-2">
            <div className="text-center mb-6">
              <div
                className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center font-bold text-white text-lg"
                style={{ backgroundColor: C.primary }}
              >
                N
              </div>
              <p className="text-sm font-bold" style={{ color: C.dark }}>
                Creer votre compte vendeur
              </p>
            </div>
            <div className="space-y-3">
              {["Nom complet", "Adresse email", "Mot de passe"].map(
                (field) => (
                  <div key={field}>
                    <p
                      className="text-xs font-medium mb-1"
                      style={{ color: C.muted }}
                    >
                      {field}
                    </p>
                    <div
                      className="h-10 rounded-lg border"
                      style={{ borderColor: C.surfaceHigh }}
                    />
                  </div>
                )
              )}
              <div
                className="h-11 rounded-xl flex items-center justify-center text-sm font-bold text-white mt-4"
                style={{ backgroundColor: C.primary }}
              >
                Creer mon compte
              </div>
              <p className="text-xs text-center" style={{ color: C.muted }}>
                0 FCFA / mois - 10 % de commission par vente
              </p>
            </div>
          </div>
        </MockupFrame>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          2. Completez votre profil vendeur
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Un profil complet inspire confiance. Ajoutez une photo
          professionnelle, redigez une bio qui explique votre expertise et vos
          resultats, ajoutez vos liens vers vos reseaux sociaux. Les acheteurs
          veulent savoir de qui ils apprennent. Un profil avec photo et bio
          complete genere en moyenne 3 fois plus de ventes qu&apos;un profil
          vide.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          3. Creez votre produit
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Depuis votre tableau de bord, cliquez sur &quot;Nouveau produit&quot;.
          Vous arrivez sur un assistant de creation en etapes qui vous guide a
          travers toute la configuration.
        </p>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Commencez par choisir le type de produit (formation, ebook, template,
          coaching). Ensuite, remplissez le titre (accrocheur et clair sur le
          benefice), la description detaillee (utilisez le vocabulaire de votre
          audience), la categorie et les tags pertinents. Ajoutez une image de
          couverture attractive — c&apos;est la premiere chose que vos clients
          potentiels verront.
        </p>

        <MockupFrame title="novakou.com/tableau-de-bord - Creer un produit">
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-2">
              {["Type", "Details", "Contenu", "Prix", "Publication"].map(
                (step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{
                        backgroundColor:
                          i === 1 ? C.primary : i < 1 ? C.accent : C.surfaceHigh,
                        color: i > 1 ? C.muted : C.white,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span
                      className="text-xs hidden sm:inline"
                      style={{ color: i <= 1 ? C.dark : C.muted }}
                    >
                      {step}
                    </span>
                  </div>
                )
              )}
            </div>
            <div
              className="h-px w-full"
              style={{ backgroundColor: C.surfaceHigh }}
            />
            <div>
              <p
                className="text-xs font-medium mb-1"
                style={{ color: C.muted }}
              >
                Titre du produit
              </p>
              <div
                className="h-10 rounded-lg border px-3 flex items-center text-sm"
                style={{ borderColor: C.accent, color: C.dark }}
              >
                Lancer son e-commerce en Afrique : Guide complet
              </div>
            </div>
            <div>
              <p
                className="text-xs font-medium mb-1"
                style={{ color: C.muted }}
              >
                Description
              </p>
              <div
                className="h-24 rounded-lg border"
                style={{ borderColor: C.surfaceHigh }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p
                  className="text-xs font-medium mb-1"
                  style={{ color: C.muted }}
                >
                  Categorie
                </p>
                <div
                  className="h-10 rounded-lg border flex items-center px-3 text-sm"
                  style={{ borderColor: C.surfaceHigh, color: C.dark }}
                >
                  Business & Entrepreneuriat
                </div>
              </div>
              <div>
                <p
                  className="text-xs font-medium mb-1"
                  style={{ color: C.muted }}
                >
                  Type
                </p>
                <div
                  className="h-10 rounded-lg border flex items-center px-3 text-sm"
                  style={{ borderColor: C.surfaceHigh, color: C.dark }}
                >
                  Formation video
                </div>
              </div>
            </div>
          </div>
        </MockupFrame>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          4. Uploadez votre contenu
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Pour une formation video, uploadez vos videos lecon par lecon dans
          l&apos;ordre. Novakou prend en charge le streaming, la protection et
          l&apos;hebergement de vos fichiers. Pour un ebook, uploadez votre PDF.
          Pour des templates, uploadez vos fichiers dans le format natif (les
          acheteurs pourront les telecharger). Ajoutez eventuellement des bonus
          (worksheets, checklists, ressources complementaires) pour augmenter la
          valeur percue.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          5. Configurez vos paiements
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Novakou accepte les paiements par Mobile Money (Orange Money, Wave,
          MTN), carte bancaire et virement. Vos acheteurs choisissent le moyen
          qui leur convient. Vous recevez vos gains directement sur votre
          compte Mobile Money ou votre compte bancaire, selon votre preference.
          Les fonds sont disponibles sous 48 heures apres chaque vente.
        </p>

        <TipBox>
          <strong>Fonctionnalite Novakou :</strong> La plateforme genere
          automatiquement votre boutique en ligne avec une URL personnalisee
          (novakou.com/votre-nom). Vous pouvez partager ce lien sur vos reseaux
          sociaux, dans vos emails et partout ou vous avez une audience. Pas
          besoin de creer un site web separe.
        </TipBox>

        {/* ════════════════════════════════════════════════════════ */}
        {/*  SECTION 8 — ETAPE 6 : PRICING                        */}
        {/* ════════════════════════════════════════════════════════ */}
        <SectionHeading id="etape-6" number="6">
          Fixer le prix juste
        </SectionHeading>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Le pricing est l&apos;un des aspects les plus strategiques de votre
          produit digital. Trop bas, vous devalorisez votre travail et attirez
          des clients peu engages. Trop haut, vous bloquez l&apos;acces a votre
          audience. Le bon prix se situe a l&apos;intersection de la valeur
          percue, du pouvoir d&apos;achat de votre marche cible et du
          positionnement que vous souhaitez adopter.
        </p>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Voici la grille de pricing recommandee pour le marche africain
          francophone, basee sur les donnees des createurs les plus performants
          sur Novakou. Ces fourchettes tiennent compte du pouvoir d&apos;achat
          local tout en valorisant correctement le travail du createur.
        </p>

        <MockupFrame title="Grille de pricing recommandee">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ color: C.dark }}>
              <thead>
                <tr
                  style={{ backgroundColor: C.surfaceLow }}
                >
                  <th className="text-left p-3 rounded-tl-lg font-semibold">Type</th>
                  <th className="text-left p-3 font-semibold">Entree</th>
                  <th className="text-left p-3 font-semibold">Standard</th>
                  <th className="text-left p-3 rounded-tr-lg font-semibold">Premium</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: C.surfaceHigh }}>
                {[
                  {
                    type: "Ebook / Guide PDF",
                    low: "3 000 FCFA (~5 EUR)",
                    mid: "10 000 FCFA (~15 EUR)",
                    high: "25 000 FCFA (~38 EUR)",
                  },
                  {
                    type: "Template / Kit",
                    low: "5 000 FCFA (~8 EUR)",
                    mid: "20 000 FCFA (~30 EUR)",
                    high: "50 000 FCFA (~76 EUR)",
                  },
                  {
                    type: "Mini-formation (< 2h)",
                    low: "10 000 FCFA (~15 EUR)",
                    mid: "25 000 FCFA (~38 EUR)",
                    high: "40 000 FCFA (~61 EUR)",
                  },
                  {
                    type: "Formation complete (> 5h)",
                    low: "25 000 FCFA (~38 EUR)",
                    mid: "50 000 FCFA (~76 EUR)",
                    high: "150 000 FCFA (~229 EUR)",
                  },
                  {
                    type: "Coaching (par session)",
                    low: "25 000 FCFA (~38 EUR)",
                    mid: "75 000 FCFA (~114 EUR)",
                    high: "200 000 FCFA (~305 EUR)",
                  },
                  {
                    type: "Communaute (par mois)",
                    low: "5 000 FCFA (~8 EUR)",
                    mid: "15 000 FCFA (~23 EUR)",
                    high: "30 000 FCFA (~46 EUR)",
                  },
                ].map((row) => (
                  <tr key={row.type}>
                    <td className="p-3 font-medium">{row.type}</td>
                    <td className="p-3" style={{ color: C.muted }}>{row.low}</td>
                    <td className="p-3 font-semibold" style={{ color: C.primary }}>{row.mid}</td>
                    <td className="p-3" style={{ color: C.muted }}>{row.high}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </MockupFrame>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          La strategie du &quot;prix de lancement&quot; est tres efficace sur le
          marche africain. Proposez votre produit a prix reduit pendant la
          premiere semaine (par exemple, -40 %) pour creer un effet
          d&apos;urgence et obtenir vos premiers avis clients. Ces avis sont
          essentiels : ils rassurent les futurs acheteurs et augmentent
          significativement votre taux de conversion. Apres la periode de
          lancement, passez au prix standard.
        </p>

        <ProTip>
          <strong>Strategie de pricing avancee :</strong> Proposez plusieurs
          niveaux de votre produit. Par exemple, pour une formation : le cours
          video seul a 25 000 FCFA, le cours + les templates a 40 000 FCFA, le
          cours + les templates + une session de coaching individuel a 100 000
          FCFA. 70 % des acheteurs choisiront l&apos;option du milieu, et vous
          augmenterez votre panier moyen de 40 a 60 %.
        </ProTip>

        <WarnBox>
          <strong>Ne sous-estimez pas votre valeur :</strong> Un piege courant
          en Afrique francophone est de fixer des prix trop bas &quot;parce que
          le pouvoir d&apos;achat est faible&quot;. En realite, les personnes
          qui investissent dans leur formation sont pretes a payer un prix juste
          pour un contenu de qualite. Un produit a 3 000 FCFA est souvent percu
          comme ayant moins de valeur qu&apos;un produit a 15 000 FCFA, meme si
          le contenu est identique.
        </WarnBox>

        {/* ════════════════════════════════════════════════════════ */}
        {/*  SECTION 9 — CHECKLIST                                 */}
        {/* ════════════════════════════════════════════════════════ */}
        <SectionHeading id="checklist">
          Checklist finale avant publication
        </SectionHeading>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Avant d&apos;appuyer sur le bouton &quot;Publier&quot;, passez en
          revue cette checklist. Chaque point est important pour maximiser vos
          chances de succes des le premier jour. Un produit bien prepare se vend
          mieux qu&apos;un produit lance dans la precipitation.
        </p>

        <MockupFrame title="Checklist de publication">
          <div className="space-y-3">
            {[
              {
                cat: "Contenu",
                items: [
                  "Le contenu est complet et couvre le sujet annonce",
                  "Chaque lecon/chapitre a ete relu et corrige",
                  "Les visuels sont de bonne qualite (pas flous, bien eclaires)",
                  "L'audio est clair et audible (pour les videos)",
                  "Un bonus est inclus (checklist, template, ressource)",
                ],
              },
              {
                cat: "Page de vente",
                items: [
                  "Le titre est accrocheur et explique le benefice principal",
                  "La description detaille ce que l'acheteur va apprendre",
                  "L'image de couverture est professionnelle et attractive",
                  "Le prix est fixe selon la grille de pricing recommandee",
                  "La categorie et les tags sont correctement renseignes",
                ],
              },
              {
                cat: "Avant le lancement",
                items: [
                  "Votre profil vendeur est complet (photo, bio, liens)",
                  "Vous avez prepare un message de lancement pour vos reseaux",
                  "Vous avez un prix de lancement avec une date limite",
                  "Vous avez demande a 3-5 personnes de tester le produit",
                  "Votre methode de paiement de reception est configuree",
                ],
              },
            ].map((section) => (
              <div key={section.cat}>
                <p
                  className="text-sm font-bold mb-2 px-1"
                  style={{ color: C.primary }}
                >
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
                        style={{ borderColor: C.accent }}
                      />
                      <span className="text-sm" style={{ color: C.dark }}>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </MockupFrame>

        <TipBox>
          <strong>Testez avant de lancer :</strong> Demandez a 3 a 5 personnes
          de confiance (idealement des personnes qui correspondent a votre
          audience cible) de parcourir votre produit avant la publication.
          Leurs retours vous permettront de corriger les dernieres
          imperfections et d&apos;ameliorer l&apos;experience. Offrez-leur
          l&apos;acces gratuit en echange de leur avis honnete.
        </TipBox>

        {/* ════════════════════════════════════════════════════════ */}
        {/*  SECTION 10 — CONCLUSION + CTA                         */}
        {/* ════════════════════════════════════════════════════════ */}
        <SectionHeading id="conclusion">
          Votre produit digital vous attend
        </SectionHeading>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Vous venez de parcourir les six etapes essentielles pour creer et
          vendre votre premier produit digital. De l&apos;identification de
          votre expertise a la fixation du prix juste, chaque etape a ete
          concue pour vous rapprocher d&apos;un objectif concret : transformer
          votre savoir en revenus.
        </p>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Le marche africain francophone est en pleine expansion, et les
          createurs qui se positionnent maintenant ont un avantage considerable.
          Chaque jour que vous attendez, c&apos;est un jour ou quelqu&apos;un
          d&apos;autre cree le produit que vous aviez en tete. La difference
          entre ceux qui reussissent et ceux qui restent spectateurs, ce
          n&apos;est pas le talent ou les moyens : c&apos;est l&apos;action.
        </p>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Novakou a ete construit pour vous faciliter la tache. Zero
          abonnement, paiements Mobile Money integres, boutique professionnelle
          generee automatiquement, tunnels de vente et outils marketing inclus.
          Tout ce dont vous avez besoin pour vendre en Afrique francophone est
          deja la. Il ne reste qu&apos;une chose a faire : vous lancer.
        </p>
        <p
          className="text-[16px] leading-[1.8] mb-8"
          style={{ color: C.dark }}
        >
          Reprenez ce guide depuis le debut. Repondez aux questions de
          l&apos;etape 1. Validez votre idee avec l&apos;etape 2. Structurez
          votre contenu. Produisez-le avec les outils gratuits que nous avons
          listes. Creez votre compte vendeur sur Novakou. Et publiez.
          Aujourd&apos;hui, pas demain.
        </p>

        {/* CTA Block */}
        <div
          className="rounded-2xl p-8 sm:p-12 text-center"
          style={{
            background: `linear-gradient(135deg, ${C.primary} 0%, #004d21 100%)`,
          }}
        >
          <p
            className="text-2xl sm:text-3xl text-white mb-4"
            style={SH}
          >
            Pret a creer votre premier produit digital ?
          </p>
          <p
            className="text-base mb-8 max-w-lg mx-auto"
            style={{ ...S, color: "rgba(255,255,255,0.8)" }}
          >
            Rejoignez les createurs africains qui monetisent leur expertise sur
            Novakou. Inscription gratuite, 0 abonnement, paiements Mobile Money
            inclus.
          </p>
          <Link
            href="/inscription?role=vendeur"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold transition-transform hover:scale-[1.03]"
            style={{
              ...S,
              backgroundColor: C.white,
              color: C.primary,
            }}
          >
            Creer mon compte vendeur gratuitement
            <span aria-hidden="true" className="text-lg">
              &rarr;
            </span>
          </Link>
          <p
            className="text-sm mt-4"
            style={{ ...S, color: "rgba(255,255,255,0.6)" }}
          >
            10 % de commission uniquement sur vos ventes. Aucun frais cache.
          </p>
        </div>

        {/* Related guides */}
        <div className="mt-20">
          <p
            className="text-lg font-bold mb-6"
            style={{ ...SH, color: C.dark }}
          >
            Guides complementaires
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                href: "/guides/vendre-en-ligne",
                title: "Comment vendre en ligne en Afrique",
                desc: "Strategies de vente et marketing digital pour le marche africain francophone.",
              },
              {
                href: "/guides/guide-complet-novakou",
                title: "Guide complet de Novakou",
                desc: "Tout savoir sur la plateforme : boutique, paiements, tunnels de vente et plus.",
              },
            ].map((guide) => (
              <Link
                key={guide.href}
                href={guide.href}
                className="block p-5 rounded-xl border transition-shadow hover:shadow-md"
                style={{
                  backgroundColor: C.white,
                  borderColor: C.surfaceHigh,
                }}
              >
                <p
                  className="text-sm font-bold mb-1"
                  style={{ color: C.dark }}
                >
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
