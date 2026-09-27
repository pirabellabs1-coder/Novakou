import type { Metadata } from "next";
import { Clock } from "lucide-react";
import { OldGuideJsonLd } from "@/components/formations/OldGuideJsonLd";
import { Accordeon } from "@/components/formations/public/Accordeon";
import {
  CarteActionGuide,
  CoqueGuide,
  numeroGuide,
  SuiteGuides,
} from "@/components/formations/public/article/CoqueGuide";
import {
  Astuce,
  Attention,
  FauxBouton,
  Maquette,
  ProAstuce,
  SectionGuide,
} from "@/components/formations/public/article/EncadresGuide";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://novakou.com";
const OG_IMAGE = `${APP_URL}/api/og?type=guide&title=${encodeURIComponent(
  "Importer Systeme.io sur Novakou",
)}&subtitle=${encodeURIComponent(
  "Migrez votre tunnel de vente en quelques secondes — titre, texte et image importés automatiquement",
)}`;

export const metadata: Metadata = {
  // `absolute` : « Novakou » est deja dans le titre. Sans ça, le template
  // du layout racine ajoute « | Novakou » et le nom sort deux fois.
  title: { absolute: "Importer son tunnel Systeme.io sur Novakou (2026)" },
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

export default function ImporterSystemeIo() {
  return (
    <>
      <OldGuideJsonLd slug="importer-systeme-io" />
      <CoqueGuide
        ariane={[
          { label: "Accueil", href: "/" },
          { label: "Guides", href: "/guides" },
          { label: "Importer Systeme.io" },
        ]}
        eyebrow="Migration & Tunnels"
        titre={<>Importer votre tunnel Systeme.io{" "} <em>sur votre boutique Novakou</em></>}
        sousTitre="Vous avez construit vos pages de vente sur Systeme.io et vous passez à Novakou pour encaisser en Mobile Money ? Pas besoin de tout recommencer. Collez l'URL de votre tunnel, et Novakou récupère automatiquement le titre, le texte et l'image pour créer une page de départ en quelques secondes."
        infos={[{ icone: Clock, texte: "9 min de lecture · Niveau débutant" }]}
        couverture={{
          src: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&auto=format&fit=crop&q=80",
          alt: "Migration de données et tableaux de bord marketing",
          legende: "Migrer depuis Systeme.io ne devrait pas vous coûter des heures de copier-coller",
        }}
        chiffres={[
          { valeur: "30 s", libelle: "pour importer une page Systeme.io en brouillon sur Novakou" },
          { valeur: "0 FCFA", libelle: "l'import est inclus dans tous les plans, même gratuit" },
          { valeur: "3 champs", libelle: "récupérés automatiquement : titre, description, image" },
        ]}
        titreSommaire="Dans ce guide"
        sommaire={[
          { id: "pourquoi", label: "Pourquoi importer depuis Systeme.io ?", n: numeroGuide(0) },
          { id: "ce-qui-est-importe", label: "Ce que l'import récupère (et ses limites)", n: numeroGuide(1) },
          { id: "etapes", label: "Importer en 4 étapes (avec captures)", n: numeroGuide(2) },
          { id: "apres", label: "Après l'import : attacher votre produit et activer", n: numeroGuide(3) },
          { id: "systeme-vs-novakou", label: "Systeme.io vs Novakou : le comparatif honnête", n: numeroGuide(4) },
          { id: "faq", label: "Questions fréquentes", n: numeroGuide(5) },
        ]}
        fin={
          <>
            <CarteActionGuide
              titre="Migrez votre tunnel en 30 secondes"
              actions={[
                { href: "/inscription", libelle: "Créer ma boutique gratuite" },
                { href: "/guides/tunnel-de-vente-novakou", libelle: "Guide : Construire un tunnel →" },
              ]}
            >
              <p>Créez votre boutique Novakou, ouvrez la section Funnels et cliquez sur « Importer Systeme.io ». Vos premières ventes en Mobile Money sont à quelques clics.</p>
            </CarteActionGuide>
            <SuiteGuides
              titre="Poursuivez votre lecture"
              liens={[
                {
                  href: "/guides/tunnel-de-vente-novakou",
                  etiquette: "← Guide lié",
                  titre: "Construire un tunnel de vente Novakou",
                },
                {
                  href: "/guides",
                  etiquette: "Voir tous les guides →",
                  titre: "Tous les guides Novakou",
                },
              ]}
              retour={false}
            />
          </>
        }
      >
        <SectionGuide id="pourquoi" n={numeroGuide(0)} titre={<>Pourquoi importer depuis Systeme.io ?</>}>
          <p className="text-[17px] leading-relaxed mb-6">
            Beaucoup de créateurs africains ont commencé sur Systeme.io parce que
            c'est l'un des premiers outils francophones de tunnels de vente. Mais
            arrive un moment où une limite devient bloquante : encaisser en{" "}
            <strong>Wave, Orange Money ou MTN Mobile Money</strong>{" "}
            directement, sans détour par une carte bancaire que votre audience n'a
            pas toujours.
          </p>

          <p className="text-[17px] leading-relaxed mb-6">
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
              <div key={b.t} className="rounded-2xl border p-5" style={{ borderColor: "#e6ece8" }}>
                <p className="font-bold text-base mb-1">{b.t}</p>
                <p className="text-sm leading-relaxed">{b.d}</p>
              </div>
            ))}
          </div>

          {/* 2 */}
        </SectionGuide>

        <SectionGuide id="ce-qui-est-importe" n={numeroGuide(1)} titre={<>Ce que l'import récupère (et ses limites)</>}>
          <p className="text-[17px] leading-relaxed mb-6">
            Soyons transparents : Systeme.io ne propose pas de format d'export
            standard de ses pages. L'import de Novakou lit donc votre page publique
            et en extrait les informations les plus fiables — celles qui servent
            aussi à l'aperçu sur les réseaux sociaux. C'est un{" "}
            <strong>point de départ rapide</strong>, pas
            une copie au pixel près.
          </p>

          <div className="rounded-2xl border overflow-hidden my-8" style={{ borderColor: "#e6ece8" }}>
            <div className="grid grid-cols-2 text-sm">
              <div className="px-5 py-3 font-bold border-b border-r" style={{ backgroundColor: "#f0f6f2", borderColor: "#dfede4", color: "#006e2f" }}>
                ✓ Importé automatiquement
              </div>
              <div className="px-5 py-3 font-bold border-b" style={{ backgroundColor: "#fdf7ea", borderColor: "#f3e3bd", color: "#92400e" }}>
                ✗ À recréer dans Novakou
              </div>
              <div className="px-5 py-4 border-r space-y-2" style={{ borderColor: "#e6ece8", color: "#5c6b62" }}>
                <p>• Le <strong>titre</strong> de la page (nom du tunnel)</p>
                <p>• Le <strong>texte d'accroche</strong> (sous-titre)</p>
                <p>• L'<strong>image principale</strong> de la page</p>
                <p>• Une <strong>étape landing</strong> prête à éditer</p>
              </div>
              <div className="px-5 py-4 space-y-2" style={{ color: "#5c6b62" }}>
                <p>• Le <strong>prix et le produit</strong> (vous l'attachez)</p>
                <p>• Les blocs avancés (FAQ, témoignages, compte à rebours)</p>
                <p>• Vos <strong>contacts / e-mails</strong> Systeme.io</p>
                <p>• La mise en page exacte (couleurs, polices)</p>
              </div>
            </div>
          </div>

          <Astuce>
            <strong>Pourquoi le titre, le texte et l'image ?</strong> Ce sont les
            balises que tout site renseigne pour l'aperçu sur WhatsApp, Facebook
            et Google. Elles sont présentes même quand la page est construite en
            JavaScript — c'est pourquoi l'import les récupère de façon fiable, là
            où le reste de la mise en page n'est pas lisible automatiquement.
          </Astuce>

          {/* 3 */}
        </SectionGuide>

        <SectionGuide id="etapes" n={numeroGuide(2)} titre={<>Importer en 4 étapes</>}>
          <p className="text-[17px] leading-relaxed mb-2">
            L'opération prend moins d'une minute. Voici exactement ce que vous
            voyez à l'écran.
          </p>

          {/* Étape 1 */}
          <h3 className="text-lg font-bold mt-10 mb-2">
            Étape 1 — Ouvrez « Mes funnels de vente »
          </h3>
          <p className="text-[15px] leading-relaxed mb-2">
            Dans votre tableau de bord vendeur, allez dans{" "}
            <strong>Marketing → Funnels</strong>. En haut
            à droite, à côté de « Générer avec l'IA » et « Nouveau funnel », vous
            trouvez le bouton <strong>« Importer Systeme.io »</strong>.
          </p>

          <Maquette titre="novakou.com/vendeur/marketing/funnels" legende="Le bouton « Importer Systeme.io » dans la barre d'actions de la page Funnels.">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="font-bold text-base">Mes funnels de vente</p>
                <p className="text-xs">Tunnels complets : landing, checkout, upsell et remerciement</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="relative">
                  <FauxBouton fantome>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                    Importer Systeme.io
                  </FauxBouton>
                  <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full border-2 animate-pulse" style={{ borderColor: "#4c9a6b" }} />
                </span>
                <FauxBouton fantome>✨ Générer avec l&apos;IA</FauxBouton>
                <FauxBouton>+ Nouveau funnel</FauxBouton>
              </div>
            </div>
          </Maquette>

          {/* Étape 2 */}
          <h3 className="text-lg font-bold mt-10 mb-2">
            Étape 2 — Collez l'URL de votre page Systeme.io
          </h3>
          <p className="text-[15px] leading-relaxed mb-2">
            Une fenêtre s'ouvre. Copiez l'adresse publique de votre tunnel
            Systeme.io (celle que vos visiteurs voient) et collez-la. Validez avec
            « Importer ».
          </p>

          <Maquette titre="novakou.com/vendeur/marketing/funnels" legende="La fenêtre d'import : collez l'URL publique de votre tunnel Systeme.io.">
            <div className="mx-auto max-w-md rounded-2xl border p-5" style={{ borderColor: "#e6ece8", backgroundColor: "#ffffff" }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#f0f6f2" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={"#006e2f"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                </span>
                <p className="font-bold text-sm">Importer depuis Systeme.io</p>
              </div>
              <p className="text-xs mb-3 leading-relaxed">
                Collez l'URL publique de votre tunnel/page Systeme.io. On importe le
                titre, le texte et l'image en brouillon ; vous attachez ensuite
                votre produit.
              </p>
              <div className="rounded-lg border px-3 py-2 text-sm mb-4" style={{ borderColor: "#e6ece8", color: "#0e1512", backgroundColor: "#f0f6f2" }}>
                https://mon-tunnel.systeme.io/offre-formation
              </div>
              <div className="flex gap-2 justify-end">
                <FauxBouton fantome>Annuler</FauxBouton>
                <FauxBouton>Importer</FauxBouton>
              </div>
            </div>
          </Maquette>

          <ProAstuce>
            <strong>Quelle URL prendre ?</strong> Utilisez l'adresse de la page de
            vente telle qu'elle apparaît dans votre navigateur quand vous la
            visitez en public — par exemple{" "}
            <code style={{ backgroundColor: "#f0f6f2", padding: "1px 5px", borderRadius: 4 }}>monnom.systeme.io/ma-page</code>.
            Évitez l'URL d'édition (celle qui contient « /dashboard » ou « /admin »),
            elle n'est pas accessible publiquement.
          </ProAstuce>

          {/* Étape 3 */}
          <h3 className="text-lg font-bold mt-10 mb-2">
            Étape 3 — Novakou crée votre tunnel en brouillon
          </h3>
          <p className="text-[15px] leading-relaxed mb-2">
            En quelques secondes, vous êtes redirigé vers l'éditeur de tunnel. Une
            étape <strong>« Page de capture »</strong> est
            déjà créée, avec votre titre, votre accroche et votre image en place.
            Le tunnel est en <strong>brouillon</strong> :
            rien n'est encore visible du public.
          </p>

          <Maquette titre="novakou.com/vendeur/marketing/funnels" legende="Le tunnel importé : une étape landing pré-remplie avec le contenu récupéré, en mode brouillon.">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: "#fdf7ea", color: "#92400e" }}>● Brouillon</span>
              <span className="font-bold text-sm" style={{ color: "#0e1512" }}>Offre formation — importé de Systeme.io</span>
            </div>
            <div className="rounded-xl overflow-hidden border" style={{ borderColor: "#e6ece8" }}>
              <div className="h-24 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${"#f0f6f2"}, #e8f5e9)` }}>
                <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: "#ffffff", color: "#5c6b62" }}>🖼️ Image importée</span>
              </div>
              <div className="p-4">
                <p className="font-bold text-base mb-1">Votre titre Systeme.io apparaît ici</p>
                <p className="text-sm mb-3">Et votre texte d'accroche juste en dessous, prêt à être édité.</p>
                <span className="inline-block px-4 py-2 rounded-xl text-white text-sm font-bold" style={{ backgroundColor: "#006e2f" }}>
                  Je commence maintenant
                </span>
              </div>
            </div>
          </Maquette>

          {/* Étape 4 */}
          <h3 className="text-lg font-bold mt-10 mb-2">
            Étape 4 — Vérifiez et ajustez
          </h3>
          <p className="text-[15px] leading-relaxed mb-6">
            Relisez le titre et l'accroche importés, remplacez l'image si besoin,
            et ajoutez les blocs qui font vendre : témoignages, FAQ, garantie,
            compte à rebours. L'éditeur Novakou fonctionne par blocs, exactement
            comme vous en avez l'habitude.
          </p>

          {/* 4 */}
        </SectionGuide>

        <SectionGuide id="apres" n={numeroGuide(3)} titre={<>Après l'import : attacher votre produit et activer</>}>
          <p className="text-[17px] leading-relaxed mb-6">
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
              <div key={item.n} className="flex items-start gap-4 rounded-xl border p-4" style={{ borderColor: "#e6ece8" }}>
                <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: "#006e2f" }}>{item.n}</span>
                <div>
                  <p className="font-bold text-sm mb-1">{item.t}</p>
                  <p className="text-sm leading-relaxed">{item.d}</p>
                </div>
              </div>
            ))}
          </div>

          <Attention>
            <strong>L'import ne transfère pas vos contacts.</strong> Vos abonnés et
            listes e-mail Systeme.io ne sont pas récupérés automatiquement (ce sont
            des données privées, hors de la page publique). Exportez-les depuis
            Systeme.io en CSV, puis réimportez-les dans vos contacts Novakou pour
            continuer vos séquences e-mail sans perdre votre audience.
          </Attention>

          {/* 5 */}
        </SectionGuide>

        <SectionGuide id="systeme-vs-novakou" n={numeroGuide(4)} titre={<>Systeme.io vs Novakou : le comparatif honnête</>}>
          <p className="text-[17px] leading-relaxed mb-6">
            Les deux outils sont bons. Le choix dépend surtout de votre marché et
            de la façon dont vos clients paient.
          </p>

          <div className="rounded-2xl border overflow-hidden my-8" style={{ borderColor: "#e6ece8" }}>
            {[
              { critere: "Mobile Money (Wave, Orange, MTN)", systeme: "Limité / via intermédiaire", novakou: "Natif, dès le 1er jour", win: true },
              { critere: "Tunnels de vente par blocs", systeme: "Oui", novakou: "Oui", win: false },
              { critere: "Affiliation intégrée", systeme: "Oui", novakou: "Oui — commission paramétrable jusqu'à 40 %", win: true },
              { critere: "Séquences e-mail & automatisations", systeme: "Oui", novakou: "Oui — déclenchées à l'achat, à l'inscription…", win: false },
              { critere: "Pensé pour l'Afrique francophone", systeme: "Généraliste", novakou: "Marché africain en priorité", win: true },
            ].map((row) => (
              <div key={row.critere} className="grid grid-cols-1 sm:grid-cols-3 border-b last:border-b-0" style={{ borderColor: "#e6ece8" }}>
                <div className="px-5 py-3 font-semibold text-sm sm:border-r" style={{ borderColor: "#e6ece8", color: "#0e1512" }}>{row.critere}</div>
                <div className="px-5 py-3 text-sm sm:border-r" style={{ borderColor: "#e6ece8", color: "#5c6b62" }}>{row.systeme}</div>
                <div className="px-5 py-3 text-sm font-medium" style={{ color: row.win ? "#006e2f" : "#0e1512" }}>
                  {row.win && "★ "}{row.novakou}
                </div>
              </div>
            ))}
          </div>

          <Astuce>
            <strong>Notre conseil :</strong> beaucoup de créateurs gardent
            Systeme.io le temps de la transition, importent leurs pages clés sur
            Novakou, et basculent progressivement leur trafic vers les tunnels
            Novakou pour profiter du Mobile Money. Aucune urgence à tout couper du
            jour au lendemain.
          </Astuce>

          {/* 6 - FAQ */}
        </SectionGuide>

        <SectionGuide id="faq" n={numeroGuide(5)} titre={<>Questions fréquentes</>}>
          <Accordeon
            items={[
              { q: "L'import copie-t-il ma page à l'identique ?", a: "Non, et c'est volontaire. Systeme.io n'a pas d'export standard : l'import récupère le titre, le texte d'accroche et l'image principale pour vous faire gagner du temps. La mise en page exacte (couleurs, polices, blocs avancés) se recrée dans l'éditeur Novakou, qui est plus simple qu'il n'y paraît." },
              { q: "Est-ce que ça marche avec n'importe quelle URL ?", a: "Avec n'importe quelle page publique : Systeme.io, mais aussi une landing page externe, un site WordPress, etc. Tant que la page est accessible publiquement, l'import lit ses informations d'aperçu. Les pages privées (espace membre, brouillon) ne sont pas lisibles." },
              { q: "Mes visiteurs Systeme.io seront-ils redirigés ?", a: "Non. L'import ne touche pas à votre page Systeme.io existante — elle continue de fonctionner. Vous créez une nouvelle page sur Novakou et c'est vous qui décidez quand y rediriger votre trafic." },
              { q: "Combien d'imports puis-je faire ?", a: "Autant que vous voulez, sur tous les plans, y compris le plan gratuit. Importez chaque page de vente que vous souhaitez migrer." },
              { q: "Et mes contacts / ma liste e-mail ?", a: "Ils ne sont pas importés automatiquement (données privées). Exportez-les en CSV depuis Systeme.io puis ajoutez-les à vos contacts Novakou pour reprendre vos séquences e-mail." },
            ]}
          />
        </SectionGuide>
      </CoqueGuide>
    </>
  );
}
