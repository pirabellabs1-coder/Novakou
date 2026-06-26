import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { OldGuideJsonLd } from "@/components/formations/OldGuideJsonLd";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://novakou.com";
const OG_IMAGE = `${APP_URL}/api/og?type=guide&title=${encodeURIComponent(
  "Importer Systeme.io sur Novakou",
)}&subtitle=${encodeURIComponent(
  "Migrez votre tunnel de vente en quelques secondes — titre, texte et image importés automatiquement",
)}`;

export const metadata: Metadata = {
  title: "Importer son tunnel Systeme.io sur Novakou (2026)",
  description:
    "Vous venez de Systeme.io ? Importez votre tunnel de vente sur votre boutique Novakou en quelques secondes : collez l'URL, on récupère le titre, le texte et l'image automatiquement. Guide complet pas à pas.",
  keywords: [
    "importer Systeme.io Novakou",
    "migrer tunnel Systeme.io",
    "alternative Systeme.io Afrique",
    "import funnel système io",
    "passer de Systeme.io à Novakou",
    "tunnel de vente Mobile Money",
  ],
  alternates: {
    canonical: "/guides/importer-systeme-io",
  },
  openGraph: {
    title: "Importer son tunnel Systeme.io sur Novakou | Novakou",
    description:
      "Migrez votre tunnel Systeme.io vers votre boutique Novakou en quelques secondes. Le guide complet, étape par étape, avec captures d'écran.",
    type: "article",
    url: `${APP_URL}/guides/importer-systeme-io`,
    siteName: "Novakou",
    images: [{ url: OG_IMAGE, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Importer son tunnel Systeme.io sur Novakou | Novakou",
    description:
      "Collez l'URL de votre tunnel Systeme.io, Novakou importe le titre, le texte et l'image automatiquement. Guide pas à pas.",
    images: [OG_IMAGE],
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
      <span style={{ color: C.dark }}>Importer Systeme.io</span>
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

/* ─── « Capture » : cadre type navigateur autour d'un mockup d'interface ─── */
function Capture({ caption, children }: { caption: string; children: React.ReactNode }) {
  return (
    <figure className="my-10">
      <div className="rounded-2xl overflow-hidden border shadow-lg" style={{ borderColor: C.surfaceHigh }}>
        {/* Barre de fenêtre */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ backgroundColor: "#f3f4f6", borderColor: C.surfaceHigh }}>
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ff5f57" }} />
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#febc2e" }} />
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#28c840" }} />
          <span className="ml-3 flex-1 text-xs px-3 py-1 rounded-md truncate" style={{ backgroundColor: C.white, color: C.muted, ...S }}>
            novakou.com/vendeur/marketing/funnels
          </span>
        </div>
        {/* Contenu mockup */}
        <div className="p-5 sm:p-6" style={{ backgroundColor: C.white }}>{children}</div>
      </div>
      <figcaption className="text-center text-xs mt-3" style={{ color: C.muted, ...S }}>
        {caption}
      </figcaption>
    </figure>
  );
}

/* Boutons mockup (reproduisent le style réel de la boutique) */
function MkButtonPrimary({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold" style={{ backgroundColor: C.primary, ...SH }}>
      {children}
    </span>
  );
}
function MkButtonGhost({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border" style={{ borderColor: C.surfaceHigh, color: C.dark, backgroundColor: C.white, ...SH }}>
      {children}
    </span>
  );
}

export default function ImporterSystemeIo() {
  return (
    <div style={{ ...S, backgroundColor: C.white, color: C.dark }}>
      <OldGuideJsonLd slug="importer-systeme-io" />

      {/* ── Hero ── */}
      <section
        className="relative py-16 px-4 sm:px-6"
        style={{ background: `linear-gradient(135deg, ${C.surface} 0%, #e8f5e9 100%)` }}
      >
        <div className="max-w-3xl mx-auto">
          <Breadcrumb />

          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs font-bold px-3 py-1 rounded-full text-white" style={{ backgroundColor: C.primary }}>
              Migration & Tunnels
            </span>
            <span className="text-xs" style={{ color: C.muted }}>
              9 min de lecture · Niveau débutant
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl mb-5 leading-tight" style={{ ...SH, color: C.dark }}>
            Importer votre tunnel Systeme.io{" "}
            <span style={{ color: C.primary }}>sur votre boutique Novakou</span>
          </h1>

          <p className="text-lg sm:text-xl leading-relaxed mb-8" style={{ color: C.muted }}>
            Vous avez construit vos pages de vente sur Systeme.io et vous passez
            à Novakou pour encaisser en Mobile Money ? Pas besoin de tout
            recommencer. Collez l'URL de votre tunnel, et Novakou récupère
            automatiquement le titre, le texte et l'image pour créer une page de
            départ en quelques secondes.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { val: "30 s", label: "pour importer une page Systeme.io en brouillon sur Novakou" },
              { val: "0 FCFA", label: "l'import est inclus dans tous les plans, même gratuit" },
              { val: "3 champs", label: "récupérés automatiquement : titre, description, image" },
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
            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&auto=format&fit=crop&q=80"
            alt="Migration de données et tableaux de bord marketing"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 800px"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <p className="absolute bottom-4 left-5 text-white text-sm font-medium" style={S}>
            Migrer depuis Systeme.io ne devrait pas vous coûter des heures de copier-coller
          </p>
        </div>
      </div>

      {/* ── Table des matières ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 mb-12">
        <div className="rounded-2xl p-6 border" style={{ backgroundColor: C.surface, borderColor: C.surfaceHigh }}>
          <p className="font-bold text-sm mb-4 uppercase tracking-widest" style={{ color: C.primary }}>Dans ce guide</p>
          <ol className="space-y-2 text-sm" style={{ color: C.dark }}>
            {[
              ["pourquoi", "Pourquoi importer depuis Systeme.io ?"],
              ["ce-qui-est-importe", "Ce que l'import récupère (et ses limites)"],
              ["etapes", "Importer en 4 étapes (avec captures)"],
              ["apres", "Après l'import : attacher votre produit et activer"],
              ["systeme-vs-novakou", "Systeme.io vs Novakou : le comparatif honnête"],
              ["faq", "Questions fréquentes"],
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
        <SectionHeading id="pourquoi" number="1">
          Pourquoi importer depuis Systeme.io ?
        </SectionHeading>

        <p className="text-[17px] leading-relaxed mb-6" style={{ color: C.muted }}>
          Beaucoup de créateurs africains ont commencé sur Systeme.io parce que
          c'est l'un des premiers outils francophones de tunnels de vente. Mais
          arrive un moment où une limite devient bloquante : encaisser en{" "}
          <strong style={{ color: C.dark }}>Wave, Orange Money ou MTN Mobile Money</strong>{" "}
          directement, sans détour par une carte bancaire que votre audience n'a
          pas toujours.
        </p>

        <p className="text-[17px] leading-relaxed mb-6" style={{ color: C.muted }}>
          C'est exactement là que Novakou prend le relais. Le problème, quand on
          migre d'un outil à l'autre, c'est la corvée : recopier chaque titre,
          chaque paragraphe, re-télécharger chaque image. L'import Systeme.io de
          Novakou supprime cette friction — vous récupérez l'essentiel de votre
          page automatiquement, puis vous peaufinez.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 my-8">
          {[
            { t: "Gagner du temps", d: "Plus de copier-coller manuel. Le titre, le texte d'accroche et l'image principale arrivent tout seuls." },
            { t: "Encaisser localement", d: "Une fois importé, votre tunnel Novakou accepte Mobile Money, carte et virement dès le premier visiteur." },
            { t: "Tout au même endroit", d: "Produit, paiement, e-mails, affiliation et statistiques réunis — fini de jongler entre plusieurs abonnements." },
            { t: "Sans risque", d: "L'import crée un brouillon. Rien n'est publié tant que vous n'avez pas vérifié et activé vous-même." },
          ].map((b) => (
            <div key={b.t} className="rounded-2xl border p-5" style={{ borderColor: C.surfaceHigh }}>
              <p className="font-bold text-base mb-1" style={{ ...SH, color: C.dark }}>{b.t}</p>
              <p className="text-sm leading-relaxed" style={{ color: C.muted, ...S }}>{b.d}</p>
            </div>
          ))}
        </div>

        {/* 2 */}
        <SectionHeading id="ce-qui-est-importe" number="2">
          Ce que l'import récupère (et ses limites)
        </SectionHeading>

        <p className="text-[17px] leading-relaxed mb-6" style={{ color: C.muted }}>
          Soyons transparents : Systeme.io ne propose pas de format d'export
          standard de ses pages. L'import de Novakou lit donc votre page publique
          et en extrait les informations les plus fiables — celles qui servent
          aussi à l'aperçu sur les réseaux sociaux. C'est un{" "}
          <strong style={{ color: C.dark }}>point de départ rapide</strong>, pas
          une copie au pixel près.
        </p>

        <div className="rounded-2xl border overflow-hidden my-8" style={{ borderColor: C.surfaceHigh }}>
          <div className="grid grid-cols-2 text-sm">
            <div className="px-5 py-3 font-bold border-b border-r" style={{ backgroundColor: C.tipBg, borderColor: C.tipBorder, color: C.primary, ...SH }}>
              ✓ Importé automatiquement
            </div>
            <div className="px-5 py-3 font-bold border-b" style={{ backgroundColor: C.warnBg, borderColor: C.warnBorder, color: "#92400e", ...SH }}>
              ✗ À recréer dans Novakou
            </div>
            <div className="px-5 py-4 border-r space-y-2" style={{ borderColor: C.surfaceHigh, color: C.muted }}>
              <p>• Le <strong style={{ color: C.dark }}>titre</strong> de la page (nom du tunnel)</p>
              <p>• Le <strong style={{ color: C.dark }}>texte d'accroche</strong> (sous-titre)</p>
              <p>• L'<strong style={{ color: C.dark }}>image principale</strong> de la page</p>
              <p>• Une <strong style={{ color: C.dark }}>étape landing</strong> prête à éditer</p>
            </div>
            <div className="px-5 py-4 space-y-2" style={{ color: C.muted }}>
              <p>• Le <strong style={{ color: C.dark }}>prix et le produit</strong> (vous l'attachez)</p>
              <p>• Les blocs avancés (FAQ, témoignages, compte à rebours)</p>
              <p>• Vos <strong style={{ color: C.dark }}>contacts / e-mails</strong> Systeme.io</p>
              <p>• La mise en page exacte (couleurs, polices)</p>
            </div>
          </div>
        </div>

        <TipBox>
          <strong>Pourquoi le titre, le texte et l'image ?</strong> Ce sont les
          balises que tout site renseigne pour l'aperçu sur WhatsApp, Facebook
          et Google. Elles sont présentes même quand la page est construite en
          JavaScript — c'est pourquoi l'import les récupère de façon fiable, là
          où le reste de la mise en page n'est pas lisible automatiquement.
        </TipBox>

        {/* 3 */}
        <SectionHeading id="etapes" number="3">
          Importer en 4 étapes
        </SectionHeading>

        <p className="text-[17px] leading-relaxed mb-2" style={{ color: C.muted }}>
          L'opération prend moins d'une minute. Voici exactement ce que vous
          voyez à l'écran.
        </p>

        {/* Étape 1 */}
        <h3 className="text-lg font-bold mt-10 mb-2" style={{ ...SH, color: C.dark }}>
          Étape 1 — Ouvrez « Mes funnels de vente »
        </h3>
        <p className="text-[15px] leading-relaxed mb-2" style={{ color: C.muted }}>
          Dans votre tableau de bord vendeur, allez dans{" "}
          <strong style={{ color: C.dark }}>Marketing → Funnels</strong>. En haut
          à droite, à côté de « Générer avec l'IA » et « Nouveau funnel », vous
          trouvez le bouton <strong style={{ color: C.dark }}>« Importer Systeme.io »</strong>.
        </p>

        <Capture caption="Le bouton « Importer Systeme.io » dans la barre d'actions de la page Funnels.">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="font-bold text-base" style={{ ...SH, color: C.dark }}>Mes funnels de vente</p>
              <p className="text-xs" style={{ color: C.muted }}>Tunnels complets : landing, checkout, upsell et remerciement</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="relative">
                <MkButtonGhost>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                  Importer Systeme.io
                </MkButtonGhost>
                <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full border-2 animate-pulse" style={{ borderColor: C.accent }} />
              </span>
              <MkButtonGhost>✨ Générer avec l&apos;IA</MkButtonGhost>
              <MkButtonPrimary>+ Nouveau funnel</MkButtonPrimary>
            </div>
          </div>
        </Capture>

        {/* Étape 2 */}
        <h3 className="text-lg font-bold mt-10 mb-2" style={{ ...SH, color: C.dark }}>
          Étape 2 — Collez l'URL de votre page Systeme.io
        </h3>
        <p className="text-[15px] leading-relaxed mb-2" style={{ color: C.muted }}>
          Une fenêtre s'ouvre. Copiez l'adresse publique de votre tunnel
          Systeme.io (celle que vos visiteurs voient) et collez-la. Validez avec
          « Importer ».
        </p>

        <Capture caption="La fenêtre d'import : collez l'URL publique de votre tunnel Systeme.io.">
          <div className="mx-auto max-w-md rounded-2xl border p-5" style={{ borderColor: C.surfaceHigh, backgroundColor: C.white }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: C.tipBg }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              </span>
              <p className="font-bold text-sm" style={{ ...SH, color: C.dark }}>Importer depuis Systeme.io</p>
            </div>
            <p className="text-xs mb-3 leading-relaxed" style={{ color: C.muted }}>
              Collez l'URL publique de votre tunnel/page Systeme.io. On importe le
              titre, le texte et l'image en brouillon ; vous attachez ensuite
              votre produit.
            </p>
            <div className="rounded-lg border px-3 py-2 text-sm mb-4" style={{ borderColor: C.surfaceHigh, color: C.dark, backgroundColor: C.surfaceLow }}>
              https://mon-tunnel.systeme.io/offre-formation
            </div>
            <div className="flex gap-2 justify-end">
              <MkButtonGhost>Annuler</MkButtonGhost>
              <MkButtonPrimary>Importer</MkButtonPrimary>
            </div>
          </div>
        </Capture>

        <ProTip>
          <strong>Quelle URL prendre ?</strong> Utilisez l'adresse de la page de
          vente telle qu'elle apparaît dans votre navigateur quand vous la
          visitez en public — par exemple{" "}
          <code style={{ backgroundColor: C.surfaceLow, padding: "1px 5px", borderRadius: 4 }}>monnom.systeme.io/ma-page</code>.
          Évitez l'URL d'édition (celle qui contient « /dashboard » ou « /admin »),
          elle n'est pas accessible publiquement.
        </ProTip>

        {/* Étape 3 */}
        <h3 className="text-lg font-bold mt-10 mb-2" style={{ ...SH, color: C.dark }}>
          Étape 3 — Novakou crée votre tunnel en brouillon
        </h3>
        <p className="text-[15px] leading-relaxed mb-2" style={{ color: C.muted }}>
          En quelques secondes, vous êtes redirigé vers l'éditeur de tunnel. Une
          étape <strong style={{ color: C.dark }}>« Page de capture »</strong> est
          déjà créée, avec votre titre, votre accroche et votre image en place.
          Le tunnel est en <strong style={{ color: C.dark }}>brouillon</strong> :
          rien n'est encore visible du public.
        </p>

        <Capture caption="Le tunnel importé : une étape landing pré-remplie avec le contenu récupéré, en mode brouillon.">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: C.warnBg, color: "#92400e" }}>● Brouillon</span>
            <span className="font-bold text-sm" style={{ ...SH, color: C.dark }}>Offre formation — importé de Systeme.io</span>
          </div>
          <div className="rounded-xl overflow-hidden border" style={{ borderColor: C.surfaceHigh }}>
            <div className="h-24 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${C.surface}, #e8f5e9)` }}>
              <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: C.white, color: C.muted }}>🖼️ Image importée</span>
            </div>
            <div className="p-4">
              <p className="font-bold text-base mb-1" style={{ ...SH, color: C.dark }}>Votre titre Systeme.io apparaît ici</p>
              <p className="text-sm mb-3" style={{ color: C.muted }}>Et votre texte d'accroche juste en dessous, prêt à être édité.</p>
              <span className="inline-block px-4 py-2 rounded-xl text-white text-sm font-bold" style={{ backgroundColor: C.primary, ...SH }}>
                Je commence maintenant
              </span>
            </div>
          </div>
        </Capture>

        {/* Étape 4 */}
        <h3 className="text-lg font-bold mt-10 mb-2" style={{ ...SH, color: C.dark }}>
          Étape 4 — Vérifiez et ajustez
        </h3>
        <p className="text-[15px] leading-relaxed mb-6" style={{ color: C.muted }}>
          Relisez le titre et l'accroche importés, remplacez l'image si besoin,
          et ajoutez les blocs qui font vendre : témoignages, FAQ, garantie,
          compte à rebours. L'éditeur Novakou fonctionne par blocs, exactement
          comme vous en avez l'habitude.
        </p>

        {/* 4 */}
        <SectionHeading id="apres" number="4">
          Après l'import : attacher votre produit et activer
        </SectionHeading>

        <p className="text-[17px] leading-relaxed mb-6" style={{ color: C.muted }}>
          Un tunnel ne vend que s'il est relié à un produit et qu'il accepte les
          paiements. Voici les deux dernières actions pour passer du brouillon à
          la vente réelle :
        </p>

        <div className="my-8 space-y-3">
          {[
            { n: 1, t: "Attachez votre produit", d: "Dans l'étape du tunnel, sélectionnez la formation, l'ebook ou le pack que ce tunnel doit vendre. C'est lui qui définit le prix et le contenu livré à l'acheteur." },
            { n: 2, t: "Vérifiez vos moyens de paiement", d: "Mobile Money (Wave, Orange, MTN), carte et virement sont gérés par Novakou. Aucun branchement technique : c'est actif par défaut sur votre boutique." },
            { n: 3, t: "Activez le tunnel", d: "Basculez le statut de « Brouillon » à « Actif ». Votre page obtient une adresse publique partageable immédiatement sur WhatsApp, Instagram ou par e-mail." },
          ].map((item) => (
            <div key={item.n} className="flex items-start gap-4 rounded-xl border p-4" style={{ borderColor: C.surfaceHigh }}>
              <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: C.primary }}>{item.n}</span>
              <div>
                <p className="font-bold text-sm mb-1" style={{ ...SH, color: C.dark }}>{item.t}</p>
                <p className="text-sm leading-relaxed" style={{ color: C.muted, ...S }}>{item.d}</p>
              </div>
            </div>
          ))}
        </div>

        <WarnBox>
          <strong>L'import ne transfère pas vos contacts.</strong> Vos abonnés et
          listes e-mail Systeme.io ne sont pas récupérés automatiquement (ce sont
          des données privées, hors de la page publique). Exportez-les depuis
          Systeme.io en CSV, puis réimportez-les dans vos contacts Novakou pour
          continuer vos séquences e-mail sans perdre votre audience.
        </WarnBox>

        {/* 5 */}
        <SectionHeading id="systeme-vs-novakou" number="5">
          Systeme.io vs Novakou : le comparatif honnête
        </SectionHeading>

        <p className="text-[17px] leading-relaxed mb-6" style={{ color: C.muted }}>
          Les deux outils sont bons. Le choix dépend surtout de votre marché et
          de la façon dont vos clients paient.
        </p>

        <div className="rounded-2xl border overflow-hidden my-8" style={{ borderColor: C.surfaceHigh }}>
          {[
            { critere: "Mobile Money (Wave, Orange, MTN)", systeme: "Limité / via intermédiaire", novakou: "Natif, dès le 1er jour", win: true },
            { critere: "Tunnels de vente par blocs", systeme: "Oui", novakou: "Oui", win: false },
            { critere: "Affiliation intégrée", systeme: "Oui", novakou: "Oui — commission paramétrable jusqu'à 40 %", win: true },
            { critere: "Séquences e-mail & automatisations", systeme: "Oui", novakou: "Oui — déclenchées à l'achat, à l'inscription…", win: false },
            { critere: "Pensé pour l'Afrique francophone", systeme: "Généraliste", novakou: "Marché africain en priorité", win: true },
          ].map((row) => (
            <div key={row.critere} className="grid grid-cols-1 sm:grid-cols-3 border-b last:border-b-0" style={{ borderColor: C.surfaceHigh }}>
              <div className="px-5 py-3 font-semibold text-sm sm:border-r" style={{ borderColor: C.surfaceHigh, color: C.dark, ...S }}>{row.critere}</div>
              <div className="px-5 py-3 text-sm sm:border-r" style={{ borderColor: C.surfaceHigh, color: C.muted }}>{row.systeme}</div>
              <div className="px-5 py-3 text-sm font-medium" style={{ color: row.win ? C.primary : C.dark }}>
                {row.win && "★ "}{row.novakou}
              </div>
            </div>
          ))}
        </div>

        <TipBox>
          <strong>Notre conseil :</strong> beaucoup de créateurs gardent
          Systeme.io le temps de la transition, importent leurs pages clés sur
          Novakou, et basculent progressivement leur trafic vers les tunnels
          Novakou pour profiter du Mobile Money. Aucune urgence à tout couper du
          jour au lendemain.
        </TipBox>

        {/* 6 - FAQ */}
        <SectionHeading id="faq" number="6">
          Questions fréquentes
        </SectionHeading>

        <div className="space-y-4 my-8">
          {[
            {
              q: "L'import copie-t-il ma page à l'identique ?",
              r: "Non, et c'est volontaire. Systeme.io n'a pas d'export standard : l'import récupère le titre, le texte d'accroche et l'image principale pour vous faire gagner du temps. La mise en page exacte (couleurs, polices, blocs avancés) se recrée dans l'éditeur Novakou, qui est plus simple qu'il n'y paraît.",
            },
            {
              q: "Est-ce que ça marche avec n'importe quelle URL ?",
              r: "Avec n'importe quelle page publique : Systeme.io, mais aussi une landing page externe, un site WordPress, etc. Tant que la page est accessible publiquement, l'import lit ses informations d'aperçu. Les pages privées (espace membre, brouillon) ne sont pas lisibles.",
            },
            {
              q: "Mes visiteurs Systeme.io seront-ils redirigés ?",
              r: "Non. L'import ne touche pas à votre page Systeme.io existante — elle continue de fonctionner. Vous créez une nouvelle page sur Novakou et c'est vous qui décidez quand y rediriger votre trafic.",
            },
            {
              q: "Combien d'imports puis-je faire ?",
              r: "Autant que vous voulez, sur tous les plans, y compris le plan gratuit. Importez chaque page de vente que vous souhaitez migrer.",
            },
            {
              q: "Et mes contacts / ma liste e-mail ?",
              r: "Ils ne sont pas importés automatiquement (données privées). Exportez-les en CSV depuis Systeme.io puis ajoutez-les à vos contacts Novakou pour reprendre vos séquences e-mail.",
            },
          ].map((item) => (
            <details key={item.q} className="rounded-2xl border p-5 group" style={{ borderColor: C.surfaceHigh }}>
              <summary className="font-bold text-base cursor-pointer list-none flex items-center justify-between gap-3" style={{ ...SH, color: C.dark }}>
                {item.q}
                <span className="text-xl flex-shrink-0 transition-transform group-open:rotate-45" style={{ color: C.primary }}>+</span>
              </summary>
              <p className="text-sm leading-relaxed mt-3" style={{ color: C.muted, ...S }}>{item.r}</p>
            </details>
          ))}
        </div>

        {/* CTA */}
        <div
          className="mt-16 rounded-2xl p-8 text-center"
          style={{ background: `linear-gradient(135deg, ${C.primary} 0%, #004d20 100%)` }}
        >
          <p className="text-white text-2xl font-bold mb-3" style={SH}>
            Migrez votre tunnel en 30 secondes
          </p>
          <p className="text-white/80 mb-6 text-sm max-w-md mx-auto" style={S}>
            Créez votre boutique Novakou, ouvrez la section Funnels et cliquez sur
            « Importer Systeme.io ». Vos premières ventes en Mobile Money sont à
            quelques clics.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/inscription"
              className="px-6 py-3 rounded-xl font-bold text-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: C.accent, color: C.dark, ...SH }}
            >
              Créer ma boutique gratuite
            </Link>
            <Link
              href="/guides/tunnel-de-vente-novakou"
              className="px-6 py-3 rounded-xl font-bold text-sm border border-white/30 text-white transition-opacity hover:opacity-80"
              style={S}
            >
              Guide : Construire un tunnel →
            </Link>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-12 grid sm:grid-cols-2 gap-4">
          <Link href="/guides/tunnel-de-vente-novakou" className="rounded-2xl border p-5 hover:border-green-300 transition-colors group" style={{ borderColor: C.surfaceHigh }}>
            <p className="text-xs mb-1" style={{ color: C.muted }}>← Guide lié</p>
            <p className="font-bold text-sm group-hover:text-green-700 transition-colors" style={{ ...SH, color: C.dark }}>Construire un tunnel de vente Novakou</p>
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
