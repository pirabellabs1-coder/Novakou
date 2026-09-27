import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { OldGuideJsonLd } from "@/components/formations/OldGuideJsonLd";
import {
  CarteActionGuide,
  CoqueGuide,
  SuiteGuides,
} from "@/components/formations/public/article/CoqueGuide";
import {
  Astuce,
  Attention,
  EtiquetteGuide,
  Maquette,
  SectionGuide,
} from "@/components/formations/public/article/EncadresGuide";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://novakou.com";
const OG_IMAGE = `${APP_URL}/api/og?type=guide&title=${encodeURIComponent(
  "Rédiger une description produit qui vend",
)}&subtitle=${encodeURIComponent(
  "Structure AIDA, bénéfices, preuve sociale : la page qui convertit",
)}`;

export const metadata: Metadata = {
  title: "Rédiger description produit qui vend 2026",
  description:
    "Guide pour écrire des descriptions de formations et produits digitaux qui vendent : structure AIDA, bénéfices, preuve sociale, exemples avant/après.",
  keywords: [
    "description formation en ligne",
    "page de vente formation afrique",
    "rédiger description produit digital",
    "copywriting formation novakou",
  ],
  alternates: {
    canonical: "/guides/description-produit",
  },
  openGraph: {
    title: "Rédiger description produit qui vend 2026 | Novakou",
    description:
      "Structure AIDA, bénéfices vs fonctionnalités, preuve sociale : tout pour écrire une page produit qui vend.",
    type: "article",
    url: `${APP_URL}/guides/description-produit`,
    siteName: "Novakou",
    images: [{ url: OG_IMAGE, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rédiger description produit qui vend 2026 | Novakou",
    description:
      "Structure AIDA, bénéfices, preuve sociale : écrivez une page produit qui convertit.",
    images: [OG_IMAGE],
  },
};

const TOC = [
  { id: "intro", num: "01", label: "Pourquoi votre description fait ou défait votre vente" },
  { id: "aida", num: "02", label: "La structure AIDA appliquée aux formations" },
  { id: "titre", num: "03", label: "Le titre parfait — la formule en 4 éléments" },
  { id: "benefices", num: "04", label: "Bénéfices vs fonctionnalités" },
  { id: "promesse", num: "05", label: "La promesse principale — une phrase qui résume tout" },
  { id: "preuve", num: "06", label: "La preuve sociale dans la description" },
  { id: "faq", num: "07", label: "La section FAQ qui rassure" },
  { id: "cta", num: "08", label: "Le CTA irrésistible" },
  { id: "exemples", num: "09", label: "Exemples avant/après — 3 cas pratiques" },
  { id: "checklist", num: "10", label: "Checklist de relecture — 25 points" },
];

export default function DescriptionProduitPage() {
  return (
    <>
      <OldGuideJsonLd slug="description-produit" />
      <CoqueGuide
        ariane={[
          { label: "Accueil", href: "/" },
          { label: "Guides", href: "/guides/guide-complet-novakou" },
          { label: "Description de formation" },
        ]}
        eyebrow="Guide Novakou 2026 · 10 min de lecture"
        titre={<>Comment rédiger une description de formation irrésistible</>}
        sousTitre="Votre formation peut être excellente — si sa description est mauvaise, personne ne l'achètera. Apprenez la structure AIDA, la différence entre bénéfices et fonctionnalités, et comment rédiger un CTA qui convertit. Avec 3 exemples avant/après et une checklist de 25 points."
        infos={[
          { texte: "10 chapitres" },
          { texte: "3 exemples avant/après" },
          { texte: "Checklist 25 points" },
          { texte: "Mis à jour : Avril 2026" },
        ]}
        couverture={{
          src: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80",
          alt: "Rédiger une description de formation irrésistible qui convertit",
        }}
        titreSommaire="Sommaire"
        uniteSommaire="chapitres"
        sommaire={TOC.map((t) => ({ id: t.id, label: t.label, n: t.num }))}
        apres={
          <>
          <div className="nka-pied">
            <p>Besoin d&apos;aide pour rédiger votre description ?{" "} <Link href="/contact"> Contactez notre équipe </Link></p>
            <p>Dernière mise à jour : Avril 2026</p>
          </div>
          </>
        }
        fin={
          <>
            <CarteActionGuide
              titre="Prêt à publier votre formation ?"
              action={{ href: "/inscription?role=vendeur", libelle: "Créer mon compte vendeur — C'est gratuit" }}
              note="Rejoint par 850+ créateurs en Afrique francophone"
            >
              <p>L&apos;éditeur de page produit Novakou inclut tous les blocs dont vous avez besoin : témoignages, FAQ, compte à rebours, programme détaillé, et checkout Mobile Money.</p>
            </CarteActionGuide>
            <SuiteGuides
              titre="Guides connexes"
              liens={[
                {
                  href: "/guides/sequences-emails",
                  titre: "Séquences emails pour vendre ses formations",
                  resume:
                    "23 templates, bienvenue, lancement, relances automatisées",
                },
                {
                  href: "/guides/tunnel-de-vente-novakou",
                  titre: "Créer un tunnel de vente sur Novakou",
                  resume:
                    "Builder drag-and-drop, 30+ blocs, checkout Mobile Money",
                },
              ]}
            />
          </>
        }
      >
        <SectionGuide
          id="intro"
          titre={<>Pourquoi votre description fait ou défait votre vente</>}
          apres={<EtiquetteGuide>CHAPITRE 01</EtiquetteGuide>}
        >
          <p>
            Vous avez passé 3 mois à créer votre formation. Vous avez filmé, monté, structuré, perfectionné
            chaque module. Et pourtant, les ventes ne viennent pas. Le problème n&apos;est souvent pas la formation
            — c&apos;est la description. Une description médiocre peut tuer un produit excellent.
            Une description exceptionnelle peut vendre un produit ordinaire.
          </p>

          <p>
            Sur une page de vente, votre prospect prend une décision en moins de 8 secondes : est-ce que
            c&apos;est pour moi ? Est-ce que ça vaut le prix ? Est-ce que je peux faire confiance à ce
            formateur ? Votre description doit répondre à ces trois questions instantanément, sans que
            le lecteur ait à chercher l&apos;information.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 16, margin: "32px 0" }}>
            {[
              { value: "8s", label: "Temps pour capter l'attention d'un visiteur" },
              { value: "70%", label: "Des achats sont décidés par la description" },
              { value: "3x", label: "Plus de conversion avec une bonne structure" },
            ].map((s) => (
              <div key={s.label} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px 28px", textAlign: "center" as const, flex: "1 1 180px" }}>
                <div style={{ fontSize: 32, color: "#006e2f", marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: 13, color: "#5c6b62", fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <p>
            La bonne nouvelle : rédiger une description qui vend est une compétence, pas un talent. Il existe
            des structures éprouvées, des formules testées, et des patterns qui fonctionnent systématiquement.
            Ce guide vous donne tout le cadre pour écrire votre description — que vous soyez rédacteur ou non.
          </p>
        </SectionGuide>

        <SectionGuide
          id="aida"
          titre={<>La structure AIDA appliquée aux formations</>}
          apres={<EtiquetteGuide>CHAPITRE 02</EtiquetteGuide>}
        >
          <p>
            AIDA est le modèle de copywriting le plus éprouvé au monde. Créé en 1898 par E. St. Elmo Lewis
            pour les vendeurs de rue, il s&apos;applique parfaitement aux pages de vente numériques —
            et particulièrement au marché africain où le storytelling et la preuve sont rois.
          </p>

          <Maquette titre="Structure AIDA — vue annotée d'une page Novakou">
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 0 }}>
              {[
                {
                  lettre: "A",
                  nom: "Attention",
                  couleur: "#ef4444",
                  zone: "Titre + sous-titre + visuel hero",
                  objectif: "Stopper le scroll. Faire dire 'c'est pour moi'.",
                  exemple: "\"Doublez vos clients en 30 jours avec Instagram — même sans budget pub\"",
                  duree: "0–3 secondes",
                },
                {
                  lettre: "I",
                  nom: "Intérêt",
                  couleur: "#f59e0b",
                  zone: "Problème + contexte + enjeux",
                  objectif: "Montrer que vous comprenez leur situation mieux qu'eux-mêmes.",
                  exemple: "\"Vous postez tous les jours mais vos ventes ne bougent pas. Voici pourquoi...\"",
                  duree: "3–15 secondes",
                },
                {
                  lettre: "D",
                  nom: "Désir",
                  couleur: "#006e2f",
                  zone: "Bénéfices + témoignages + programme + garantie",
                  objectif: "Faire imaginer la transformation. Créer l'envie.",
                  exemple: "Résultats d'apprenants, liste de bénéfices, programme détaillé, démonstrations",
                  duree: "15 sec – 3 min",
                },
                {
                  lettre: "A",
                  nom: "Action",
                  couleur: "#4c9a6b",
                  zone: "Prix + CTA + urgence + garantie",
                  objectif: "Éliminer les derniers obstacles et déclencher l'achat.",
                  exemple: "\"Rejoindre maintenant — 29 900 FCFA (prix augmente vendredi)\"",
                  duree: "Décision finale",
                },
              ].map((item, i) => (
                <div
                  key={item.lettre}
                  style={{ display: "flex", gap: 16, padding: "16px 0", borderBottom: i < 3 ? "1px solid #f1f5f9" : "none", alignItems: "flex-start" }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${item.couleur}14`, color: item.couleur, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                    {item.lettre}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <div style={{ fontSize: 16, color: "#0e1512" }}>{item.nom}</div>
                      <span style={{ fontSize: 11, color: "#5c6b62", background: "#f1f5f9", padding: "2px 8px", borderRadius: 6 }}>{item.duree}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#5c6b62", marginBottom: 4 }}>Zone : {item.zone}</div>
                    <div style={{ fontSize: 13, color: "#0e1512", fontWeight: 600, marginBottom: 4 }}>{item.objectif}</div>
                    <div style={{ fontSize: 12, color: "#006e2f", fontStyle: "italic" as const, lineHeight: 1.5 }}>{item.exemple}</div>
                  </div>
                </div>
              ))}
            </div>
          </Maquette>

          <p>
            Le génie de la structure AIDA est qu&apos;elle correspond exactement au chemin mental naturel
            d&apos;un acheteur. Il ne cherche pas d&apos;abord le prix — il cherche d&apos;abord à comprendre
            si c&apos;est pour lui. Votre description doit accompagner ce chemin, pas le brusquer. Un prospect
            qui voit le prix avant d&apos;avoir compris la valeur comparera toujours à ce qu&apos;il connaît déjà
            (trop cher). Un prospect qui voit d&apos;abord la transformation comparera à son problème actuel
            (investissement justifié).
          </p>
        </SectionGuide>

        <SectionGuide
          id="titre"
          titre={<>Le titre parfait — la formule en 4 éléments</>}
          apres={<EtiquetteGuide>CHAPITRE 03</EtiquetteGuide>}
        >
          <p>
            Votre titre est la chose la plus importante que vous écrirez. Il décide si la personne continue
            à lire ou ferme l&apos;onglet. 80 % des visiteurs lisent le titre. Seulement 20 % lisent la suite.
            Investissez autant de temps dans votre titre que dans le reste de la description.
          </p>

          <h3>La formule en 4 éléments</h3>

          <div style={{ background: "#f0f6f2", borderRadius: 16, padding: "24px 28px", margin: "24px 0", border: "1px solid #4c9a6b30" }}>
            <div style={{ fontSize: 14, color: "#5c6b62", marginBottom: 16, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Formule :</div>
            <div style={{ fontSize: 22, color: "#0e1512", lineHeight: 1.4, marginBottom: 20 }}>
              [Résultat concret] + [Délai précis] + [Pour qui] + [Sans quoi]
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { element: "Résultat concret", desc: "Ce que la personne obtient après la formation. Mesurable, spécifique.", exemple: "\"Doublez vos ventes\"" },
                { element: "Délai précis", desc: "En combien de temps. Rend la promesse réelle et tangible.", exemple: "\"en 30 jours\"" },
                { element: "Pour qui", desc: "L'audience exacte. Plus précis = plus de clics de votre cible.", exemple: "\"pour freelances africains\"" },
                { element: "Sans quoi", desc: "L'obstacle que vous supprimez. Adresse la principale objection.", exemple: "\"sans expérience ni budget\"" },
              ].map((el) => (
                <div key={el.element} style={{ background: "white", borderRadius: 10, padding: 14, border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 13, color: "#006e2f", marginBottom: 4 }}>{el.element}</div>
                  <div style={{ fontSize: 12, color: "#5c6b62", marginBottom: 6, lineHeight: 1.5 }}>{el.desc}</div>
                  <div style={{ fontSize: 13, color: "#0e1512", fontWeight: 600, fontStyle: "italic" as const }}>{el.exemple}</div>
                </div>
              ))}
            </div>
          </div>

          <h3>Exemples de titres appliqués à différents domaines</h3>

          <div style={{ margin: "24px 0" }}>
            {[
              {
                domaine: "Marketing Digital",
                mauvais: "Formation complète en marketing digital pour débutants",
                bon: "Obtenir 100 clients qualifiés en 60 jours avec Instagram — sans payer de publicité",
              },
              {
                domaine: "Finance personnelle",
                mauvais: "Gérer son argent et épargner intelligemment",
                bon: "Constituer une épargne de 500 000 FCFA en 6 mois sur un salaire de 200 000 FCFA",
              },
              {
                domaine: "Développement web",
                mauvais: "Apprendre React et Next.js de zéro à avancé",
                bon: "Créer et vendre votre première application web en 8 semaines — sans diplôme informatique",
              },
              {
                domaine: "Bien-être",
                mauvais: "Programme de perte de poids et forme physique",
                bon: "Perdre 8 kg en 10 semaines depuis chez vous — sans salle de sport ni régime draconien",
              },
            ].map((ex) => (
              <div key={ex.domaine} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#4c9a6b", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 8 }}>
                  {ex.domaine}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ background: "#fef2f2", borderRadius: 10, padding: 14, border: "1px solid #fecaca" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#dc2626", marginBottom: 6, textTransform: "uppercase" as const }}>Avant (faible)</div>
                    <div style={{ fontSize: 13, color: "#7f1d1d", lineHeight: 1.5 }}>{ex.mauvais}</div>
                  </div>
                  <div style={{ background: "#f0fdf4", borderRadius: 10, padding: 14, border: "1px solid #bbf7d0" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#006e2f", marginBottom: 6, textTransform: "uppercase" as const }}>Après (fort)</div>
                    <div style={{ fontSize: 13, color: "#14532d", lineHeight: 1.5, fontWeight: 600 }}>{ex.bon}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Astuce>
            <strong>Test du miroir :</strong> Lisez votre titre à voix haute. Si quelqu&apos;un qui vous
            connaît vous demande &laquo; c&apos;est pour qui exactement ? &raquo;, votre titre n&apos;est pas
            assez précis. Un bon titre ne nécessite aucune explication supplémentaire.
          </Astuce>
        </SectionGuide>

        <SectionGuide
          id="benefices"
          titre={<>Bénéfices vs fonctionnalités — la distinction qui change tout</>}
          apres={<EtiquetteGuide>CHAPITRE 04</EtiquetteGuide>}
        >
          <p>
            C&apos;est l&apos;erreur numéro un des formateurs débutants. Ils décrivent ce que contient leur
            formation (les fonctionnalités) au lieu de décrire ce que l&apos;apprenant va obtenir (les bénéfices).
            Vos prospects ne paient pas pour des modules vidéo. Ils paient pour une transformation.
          </p>

          <h3>La règle &laquo; Donc tu peux... &raquo;</h3>

          <p>
            Pour transformer une fonctionnalité en bénéfice, utilisez la règle du &laquo; Donc tu peux... &raquo;.
            Prenez n&apos;importe quelle fonctionnalité de votre formation et ajoutez &laquo; Donc tu peux... &raquo;
            à la fin. La suite naturelle est le vrai bénéfice.
          </p>

          <div style={{ border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden", margin: "24px 0" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left" as const, fontWeight: 700, color: "#dc2626", borderBottom: "1px solid #e2e8f0", borderRight: "1px solid #e2e8f0" }}>Fonctionnalité (ne vendez pas ça)</th>
                  <th style={{ padding: "12px 16px", textAlign: "left" as const, fontWeight: 700, color: "#006e2f", borderBottom: "1px solid #e2e8f0" }}>Bénéfice (vendez ça)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Module 3 : introduction à Facebook Ads", "Créer votre première publicité rentable ce week-end, même avec 5 000 FCFA de budget"],
                  ["12 heures de vidéos HD", "Progresser à votre rythme, depuis votre téléphone, pendant vos pauses déjeuner"],
                  ["Accès à la communauté privée WhatsApp", "Obtenir des réponses à vos questions en moins de 24h et ne jamais bloquer"],
                  ["Module bonus : templates Excel", "Gagner 3h par semaine sur votre comptabilité dès la première utilisation"],
                  ["Mise à jour du contenu incluse", "Rester à jour avec les dernières techniques sans repayer"],
                  ["Sessions de coaching live bi-mensuelles", "Corriger vos erreurs avant qu'elles vous coûtent du temps et de l'argent"],
                ].map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                    <td style={{ padding: "12px 16px", color: "#7f1d1d", borderBottom: i < 5 ? "1px solid #f1f5f9" : "none", borderRight: "1px solid #e2e8f0", lineHeight: 1.5 }}>
                      {row[0]}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#14532d", fontWeight: 600, borderBottom: i < 5 ? "1px solid #f1f5f9" : "none", lineHeight: 1.5 }}>
                      {row[1]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p>
            Bien sûr, vos prospects veulent aussi savoir ce que contient la formation. Mais les fonctionnalités
            viennent après les bénéfices, pas avant. La structure idéale : bénéfices en haut de page pour
            créer le désir, fonctionnalités (programme détaillé) au milieu pour justifier le prix, bénéfices
            à nouveau juste avant le CTA pour finaliser la décision.
          </p>
        </SectionGuide>

        <SectionGuide
          id="promesse"
          titre={<>La promesse principale — une phrase qui résume tout</>}
          apres={<EtiquetteGuide>CHAPITRE 05</EtiquetteGuide>}
        >
          <p>
            Sous votre titre, il doit y avoir une phrase de promesse — votre Big Promise. C&apos;est la
            déclaration la plus audacieuse que vous pouvez faire honnêtement sur votre formation. Elle
            doit être mémorable, émotionnellement engageante, et directement liée à la transformation
            que votre apprenant vivra.
          </p>

          <h3>Les 4 types de promesses qui fonctionnent</h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "24px 0" }}>
            {[
              {
                type: "Promesse de résultat chiffré",
                exemple: "\"À la fin de cette formation, vous aurez créé votre premier tunnel de vente et votre première vente — garantie.\"",
                quand: "Quand vous pouvez garantir un résultat spécifique.",
              },
              {
                type: "Promesse de transformation",
                exemple: "\"Vous passerez de 'je ne sais pas par où commencer' à formateur reconnu qui génère 300 000+ FCFA par mois.\"",
                quand: "Pour les transformations profondes de statut ou de situation.",
              },
              {
                type: "Promesse de temps gagné",
                exemple: "\"Ce que l'université enseigne en 3 ans, vous l'apprendrez en 8 semaines — en version pratique et applicable dès demain.\"",
                quand: "Quand votre audience manque de temps ou veut aller vite.",
              },
              {
                type: "Promesse d'accès exclusif",
                exemple: "\"Pour la première fois, les techniques de marketing que les grandes entreprises paient 500 000 FCFA/mois pour utiliser — accessibles à tous.\"",
                quand: "Quand vous démocratisez quelque chose de rare ou coûteux.",
              },
            ].map((p) => (
              <div key={p.type} style={{ background: "#fafafa", border: "1px solid #f1f5f9", borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 14, color: "#0e1512", marginBottom: 8 }}>{p.type}</div>
                <div style={{ fontSize: 13, color: "#006e2f", fontStyle: "italic" as const, lineHeight: 1.6, marginBottom: 8 }}>
                  {p.exemple}
                </div>
                <div style={{ fontSize: 12, color: "#5c6b62", lineHeight: 1.5 }}>
                  <span style={{ fontWeight: 700 }}>À utiliser quand :</span> {p.quand}
                </div>
              </div>
            ))}
          </div>

          <Attention>
            <strong>Ne sur-promettez jamais :</strong> Une promesse impossible à tenir détruira votre
            réputation plus vite que tout. En Afrique francophone, le bouche-à-oreille positif et négatif
            se propage très vite. Faites des promesses que vous pouvez tenir avec certitude, puis dépassez-les.
          </Attention>
        </SectionGuide>

        <SectionGuide
          id="preuve"
          titre={<>La preuve sociale dans la description</>}
          apres={<EtiquetteGuide>CHAPITRE 06</EtiquetteGuide>}
        >
          <p>
            En Afrique francophone, la recommandation de pairs est plus puissante que n&apos;importe quelle
            publicité. La preuve sociale dans votre description ne doit pas être un ajout décoratif — elle
            doit être stratégiquement placée aux points de décision, là où le prospect hésite.
          </p>

          <h3>Les 6 types de preuve sociale, du plus faible au plus fort</h3>

          <div style={{ margin: "24px 0" }}>
            {[
              { rang: 1, type: "Nombre d'apprenants", exemple: "127 personnes ont déjà rejoint cette formation", force: 40 },
              { rang: 2, type: "Notes et étoiles", exemple: "4,8/5 basé sur 43 avis vérifiés", force: 55 },
              { rang: 3, type: "Témoignage texte", exemple: "Avis écrit d'un apprenant avec nom, ville, résultat", force: 65 },
              { rang: 4, type: "Étude de cas résultat", exemple: "\"Kofi a généré 285 000 FCFA en 6 semaines\"", force: 80 },
              { rang: 5, type: "Témoignage vidéo", exemple: "Apprenant qui parle de ses résultats à la caméra", force: 90 },
              { rang: 6, type: "Résultats vérifiables", exemple: "Captures d'écran, factures, dashboards avec chiffres réels", force: 100 },
            ].map((p) => (
              <div
                key={p.rang}
                style={{ display: "flex", gap: 16, padding: "16px 0", borderBottom: p.rang < 6 ? "1px solid #f1f5f9" : "none", alignItems: "center" }}
              >
                <span style={{ fontSize: 14, color: "#006e2f", background: "#006e2f10", borderRadius: 8, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {p.rang}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, color: "#0e1512", marginBottom: 2 }}>{p.type}</div>
                  <div style={{ fontSize: 13, color: "#5c6b62", fontStyle: "italic" as const }}>{p.exemple}</div>
                </div>
                <div style={{ width: 120, flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: "#5c6b62", marginBottom: 4 }}>Force : {p.force}%</div>
                  <div style={{ height: 6, background: "#e2e8f0", borderRadius: 3 }}>
                    <div style={{ height: "100%", width: `${p.force}%`, background: "linear-gradient(90deg, #4c9a6b, #006e2f)", borderRadius: 3 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Astuce>
            <strong>La règle des 3-5-10 :</strong> Minimum 3 témoignages texte pour une crédibilité de base.
            5 témoignages avec résultats pour une page solide. 10+ témoignages dont 2 en vidéo pour une page
            qui convertit vraiment. Si vous n&apos;avez pas encore de témoignages, offrez votre formation à
            5 personnes en échange de retours honnêtes avant le lancement officiel.
          </Astuce>
        </SectionGuide>

        <SectionGuide
          id="faq"
          titre={<>La section FAQ qui rassure</>}
          apres={<EtiquetteGuide>CHAPITRE 07</EtiquetteGuide>}
        >
          <p>
            La FAQ (Foire Aux Questions) n&apos;est pas là pour répondre à des questions réelles — elle est
            là pour traiter les objections déguisées en questions. Chaque question dans votre FAQ correspond
            à une raison pour laquelle quelqu&apos;un n&apos;achète pas. En y répondant publiquement, vous
            éliminez ces obstacles avant qu&apos;ils ne bloquent la décision.
          </p>

          <h3>Les 8 questions incontournables</h3>

          <div style={{ margin: "24px 0" }}>
            {[
              {
                q: "1. Est-ce que je peux suivre la formation à mon rythme ?",
                r: "Oui. Votre accès est à vie. Vous pouvez avancer au rythme qui vous convient — 30 minutes par jour suffisent pour finir en moins d'un mois.",
                objection: "Traite : 'Je n'ai pas le temps'",
              },
              {
                q: "2. Combien de temps faut-il pour voir des résultats ?",
                r: "Les premiers résultats arrivent généralement dans les 2 à 4 semaines pour les apprenants qui appliquent les exercices. Certains ont vu leurs premières ventes dès la fin de la semaine 1.",
                objection: "Traite : 'Est-ce que ça marche vraiment ?'",
              },
              {
                q: "3. Je suis débutant total, est-ce que c'est pour moi ?",
                r: "Cette formation est spécialement conçue pour les débutants. Pas de prérequis techniques. Chaque étape est expliquée à partir de zéro avec des exemples concrets.",
                objection: "Traite : 'Je ne suis pas assez avancé'",
              },
              {
                q: "4. Comment puis-je payer ? Vous acceptez Orange Money / Wave ?",
                r: "Nous acceptons Orange Money, Wave, MTN Mobile Money, ainsi que les cartes bancaires Visa et Mastercard. Tout est géré sécurisé via la plateforme Novakou.",
                objection: "Traite : 'Je ne peux pas payer par carte'",
              },
              {
                q: "5. Que se passe-t-il si je ne suis pas satisfait ?",
                r: "Vous avez 14 jours pour demander un remboursement complet, sans justification ni condition. Votre satisfaction est garantie.",
                objection: "Traite : 'Et si ça ne correspond pas à mes attentes ?'",
              },
              {
                q: "6. Puis-je poser des questions et obtenir de l'aide ?",
                r: "Oui. L'espace communautaire inclus vous permet de poser toutes vos questions. Je réponds personnellement dans les 24 heures.",
                objection: "Traite : 'Je vais me retrouver seul si je bloque'",
              },
              {
                q: "7. Est-ce que le contenu sera mis à jour ?",
                r: "Oui. Vous accédez à toutes les futures mises à jour sans frais supplémentaires. Le contenu est mis à jour chaque trimestre.",
                objection: "Traite : 'Et si le contenu devient obsolète ?'",
              },
              {
                q: "8. Cette formation est-elle adaptée à l'Afrique ou c'est du contenu occidental adapté ?",
                r: "Tout le contenu est créé spécifiquement pour l'Afrique francophone : exemples locaux, prix en FCFA, canaux de communication adaptés (WhatsApp, Mobile Money, Facebook Africa).",
                objection: "Traite : 'Est-ce que ça marche dans mon contexte ?'",
              },
            ].map((faq) => (
              <div key={faq.q} style={{ background: "#fafafa", borderRadius: 12, padding: "18px 20px", marginBottom: 10, border: "1px solid #f1f5f9" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
                  <div style={{ fontSize: 14, color: "#0e1512", lineHeight: 1.4 }}>{faq.q}</div>
                  <span style={{ fontSize: 10, color: "#006e2f", background: "#006e2f10", padding: "2px 8px", borderRadius: 6, fontWeight: 700, flexShrink: 0, whiteSpace: "nowrap" as const }}>
                    {faq.objection}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: "#5c6b62", lineHeight: 1.7 }}>{faq.r}</div>
              </div>
            ))}
          </div>
        </SectionGuide>

        <SectionGuide
          id="cta"
          titre={<>Le CTA irrésistible — bouton, texte, urgence</>}
          apres={<EtiquetteGuide>CHAPITRE 08</EtiquetteGuide>}
        >
          <p>
            Le CTA (Call to Action) est le bouton d&apos;achat, mais aussi tout ce qui l&apos;entoure. Un bouton
            vert avec &laquo; Acheter &raquo; ne convertit pas. Un bouton vert avec le bon texte, entouré
            des bons éléments de réassurance, peut multiplier votre conversion par 3 ou 4.
          </p>

          <Maquette titre="novakou.com/formation/marketing-instagram — zone CTA">
            <div style={{ maxWidth: 420, margin: "0 auto", textAlign: "center" as const }}>
              {/* Prix */}
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 13, color: "#5c6b62", textDecoration: "line-through" }}>49 900 FCFA</span>
                <span style={{ fontSize: 32, color: "#006e2f", marginLeft: 12 }}>29 900 FCFA</span>
              </div>

              {/* Économie + urgence */}
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 12, color: "#dc2626", background: "#fee2e2", padding: "4px 12px", borderRadius: 6, fontWeight: 700 }}>
                  -40% • Prix de lancement
                </span>
                <span style={{ fontSize: 12, color: "#d97706", background: "#fef3c7", padding: "4px 12px", borderRadius: 6, fontWeight: 700 }}>
                  Expire vendredi
                </span>
              </div>

              {/* CTA Button */}
              <div style={{ background: "#006e2f", color: "white", padding: "16px 32px", borderRadius: 14, fontSize: 16, marginBottom: 12, cursor: "pointer" }}>
                Rejoindre la formation maintenant
              </div>

              {/* Sous-CTA */}
              <div style={{ fontSize: 12, color: "#5c6b62", marginBottom: 8 }}>
                Accès immédiat · Paiement sécurisé · Orange Money · Wave · Carte
              </div>

              {/* Garantie */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <span style={{ fontSize: 16 }}>🛡️</span>
                <span style={{ fontSize: 12, color: "#006e2f", fontWeight: 700 }}>Garantie satisfait ou remboursé 14 jours</span>
              </div>
            </div>
          </Maquette>

          <h3>Les 5 règles du CTA parfait</h3>

          <div style={{ margin: "24px 0" }}>
            {[
              { num: "1", regle: "Le bouton décrit une action, pas un état", bon: "\"Rejoindre la formation maintenant\"", mauvais: "\"Acheter\" ou \"S'inscrire\"" },
              { num: "2", regle: "L'urgence doit être réelle", bon: "\"Prix de lancement expire vendredi\"", mauvais: "\"Offre limitée\" sans date" },
              { num: "3", regle: "Les méthodes de paiement sont visibles avant le clic", bon: "Icônes Orange Money, Wave, Visa visibles", mauvais: "Découverte au checkout" },
              { num: "4", regle: "La garantie est juste sous le bouton", bon: "\"Remboursé si non satisfait sous 14 jours\"", mauvais: "Garantie uniquement en bas de page" },
              { num: "5", regle: "Le CTA est répété 2 à 3 fois dans la page", bon: "En haut, après les bénéfices, et à la fin", mauvais: "Un seul CTA en bas de page" },
            ].map((r) => (
              <div key={r.num} style={{ background: "#fafafa", borderRadius: 12, padding: "16px 20px", marginBottom: 10, border: "1px solid #f1f5f9" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 12, color: "white", background: "#006e2f", borderRadius: 6, width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {r.num}
                  </span>
                  <div>
                    <div style={{ fontSize: 14, color: "#0e1512", marginBottom: 8 }}>{r.regle}</div>
                    <div style={{ display: "flex", gap: 12 }}>
                      <div style={{ fontSize: 12, color: "#14532d", background: "#f0fdf4", padding: "4px 10px", borderRadius: 6 }}>
                        ✓ {r.bon}
                      </div>
                      <div style={{ fontSize: 12, color: "#991b1b", background: "#fef2f2", padding: "4px 10px", borderRadius: 6 }}>
                        ✗ {r.mauvais}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionGuide>

        <SectionGuide
          id="exemples"
          titre={<>Exemples avant/après — 3 cas pratiques</>}
          apres={<EtiquetteGuide>CHAPITRE 09</EtiquetteGuide>}
        >
          <p>
            Voyons maintenant comment appliquer tous ces principes à des descriptions réelles. Pour chaque
            exemple, j&apos;analyse ce qui ne fonctionne pas dans la version originale et ce qui est amélioré
            dans la version optimisée.
          </p>

          {/* Image section exemples */}
          <div style={{ borderRadius: 16, overflow: "hidden", margin: "28px 0", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
            <Image src="https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=900&q=80" alt="Rédiger et optimiser sa page de vente de formation" width={900} height={400} style={{ width: "100%", objectFit: "cover", display: "block", maxHeight: 380 }} />
            <div style={{ fontSize: 12, color: "#5c6b62", textAlign: "center" as const, padding: "10px 16px", background: "#f8fafc" }}>
              La différence entre une description médiocre et une description qui vend tient souvent à quelques phrases stratégiques.
            </div>
          </div>

          {[
            {
              cas: "Cas 1 — Formation en comptabilité",
              domaine: "Finance / Comptabilité",
              avant: {
                titre: "Formation en comptabilité pour entrepreneurs",
                desc: "Dans cette formation, vous apprendrez les bases de la comptabilité. Au programme : bilan, compte de résultat, trésorerie, TVA et déclarations fiscales. 8 modules vidéo. Quiz à chaque fin de module. Certificat de complétion inclus.",
                problemes: ["Titre vague — qui est exactement concerné ?", "Parle des modules, pas des bénéfices", "Aucune transformation promise", "Aucune urgence, aucune preuve sociale"],
              },
              apres: {
                titre: "Tenez vous-même votre comptabilité et économisez 150 000 FCFA/an sur votre comptable — en 4 semaines",
                desc: "Vous dépensez chaque mois en comptable de l'argent que vous pourriez réinvestir dans votre business. Cette formation vous donne exactement ce qu'un expert-comptable sait faire — sans les termes barbares, sans les tableurs compliqués. En 4 semaines, vous saurez lire votre bilan, déclarer votre TVA et anticiper vos impôts. Rejoignez 94 entrepreneurs qui ont déjà repris le contrôle de leurs finances.",
                ameliorations: ["Titre avec chiffre concret (150 000 FCFA)", "Parle d'abord du problème (dépenser en comptable)", "Bénéfice précis pour chaque module", "Preuve sociale (94 entrepreneurs)"],
              },
            },
            {
              cas: "Cas 2 — Formation en photographie mobile",
              domaine: "Créatif / Photo",
              avant: {
                titre: "Apprendre la photographie avec son smartphone",
                desc: "Cette formation vous apprend à utiliser votre téléphone pour faire de belles photos. Vous verrez les paramètrès de l'appareil photo, la composition, la lumière, la retouche avec des applications. Débutants bienvenus.",
                problemes: ["Titre générique, pas de bénéfice", "Description d'un programme scolaire", "Pas d'audience définie", "Pas de résultat mesurable promis"],
              },
              apres: {
                titre: "Faites des photos de produits et de portraits professionnels avec votre téléphone — sans studio, sans DSLR",
                desc: "Vos clients font la grimace quand vous sortez vos photos produits floues et mal éclairées ? Cette formation vous apprend à réaliser des photos qui vendent — celle que vous voyez sur les pages de grandes marques africaines — uniquement avec le téléphone que vous avez déjà dans la poche. Lumière naturelle, composition, retouche gratuite : en 6 heures, vous aurez de quoi habiller votre boutique Instagram ou votre page Novakou de photos qui inspirent confiance.",
                ameliorations: ["Titre précis : photos de produits et portraits", "Adresse une frustration réelle (photos floues)", "Résultat concret : habiller boutique Instagram", "Durée précise (6 heures)"],
              },
            },
            {
              cas: "Cas 3 — Coaching business en ligne",
              domaine: "Business / Entrepreneuriat",
              avant: {
                titre: "Programme de développement business pour entrepreneurs africains",
                desc: "Un accompagnement complet pour développer votre business. Sessions individuelles, analyses, stratégies personnalisées. Pour les entrepreneurs qui veulent passer au niveau supérieur.",
                problemes: ["Trop vague — quel type d'entrepreneur ?", "Pas de résultat chiffré promis", "Pas de preuve que ça fonctionne", "Prix non mentionné (crée de la méfiance)"],
              },
              apres: {
                titre: "De 0 à votre premier million de FCFA de revenus annuels — le programme coaching de 12 semaines pour freelances au Sénégal et en Côte d'Ivoire",
                desc: "Vous êtes freelance depuis plus d'un an mais vous stagnez sous les 200 000 FCFA/mois. Vous savez que votre potentiel est là — vous ne savez pas comment l'activer. En 12 semaines de coaching individuel, nous allons construire ensemble votre système de vente, repositionner votre offre pour justifier des tarifs 2x à 3x plus élevés, et mettre en place les automatisations qui vous libèrent du temps. Kofi (Abidjan) est passé de 180 000 à 620 000 FCFA/mois en 10 semaines. Moussa (Dakar) a signé son premier contrat à 750 000 FCFA après 6 semaines de programme.",
                ameliorations: ["Cible précise : freelances au Sénégal et en Côte d'Ivoire", "Objectif chiffré : premier million FCFA/an", "2 témoignages avec chiffres réels et villes", "Problème très spécifique (stagner sous 200 000 FCFA)"],
              },
            },
          ].map((cas) => (
            <div key={cas.cas} style={{ marginBottom: 40 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontSize: 16, color: "#0e1512" }}>{cas.cas}</span>
                <span style={{ fontSize: 11, color: "#5c6b62", background: "#f1f5f9", padding: "2px 8px", borderRadius: 6 }}>{cas.domaine}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ background: "#fef2f2", borderRadius: 14, padding: 18, border: "1px solid #fecaca" }}>
                  <div style={{ fontSize: 12, color: "#dc2626", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 10 }}>Avant</div>
                  <div style={{ fontSize: 14, color: "#7f1d1d", marginBottom: 8, lineHeight: 1.4 }}>{cas.avant.titre}</div>
                  <div style={{ fontSize: 12, color: "#7f1d1d", lineHeight: 1.7, marginBottom: 12, opacity: 0.85 }}>{cas.avant.desc}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#dc2626", marginBottom: 6 }}>Problèmes :</div>
                  {cas.avant.problemes.map((p, i) => (
                    <div key={i} style={{ fontSize: 11, color: "#991b1b", padding: "2px 0", display: "flex", gap: 4, lineHeight: 1.5 }}>
                      <span>✗</span> {p}
                    </div>
                  ))}
                </div>
                <div style={{ background: "#f0fdf4", borderRadius: 14, padding: 18, border: "1px solid #bbf7d0" }}>
                  <div style={{ fontSize: 12, color: "#006e2f", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 10 }}>Après</div>
                  <div style={{ fontSize: 14, color: "#14532d", marginBottom: 8, lineHeight: 1.4 }}>{cas.apres.titre}</div>
                  <div style={{ fontSize: 12, color: "#14532d", lineHeight: 1.7, marginBottom: 12 }}>{cas.apres.desc}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#006e2f", marginBottom: 6 }}>Améliorations :</div>
                  {cas.apres.ameliorations.map((a, i) => (
                    <div key={i} style={{ fontSize: 11, color: "#166534", padding: "2px 0", display: "flex", gap: 4, lineHeight: 1.5 }}>
                      <span>✓</span> {a}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </SectionGuide>

        <SectionGuide
          id="checklist"
          titre={<>Checklist de relecture — 25 points</>}
          apres={<EtiquetteGuide>CHAPITRE 10</EtiquetteGuide>}
        >
          <p>
            Avant de publier votre description, passez-la en revue avec cette checklist. Chaque point
            représente une opportunité de conversion que vous pouvez rater si vous ne le vérifiez pas.
          </p>

          <Maquette titre="Checklist description de formation — Novakou">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { cat: "Titre (5 points)", items: ["Le titre contient un résultat concret", "Le titre indique un délai ou une durée", "L'audience cible est claire", "Une objection principale est traitée", "Le titre est inférieur à 80 caractères"] },
                { cat: "Structure AIDA (5 points)", items: ["L'accroche (Attention) capte en 3 secondes", "Le problème est clairement décrit", "Les bénéfices précèdent les fonctionnalités", "La transformation finale est visible", "Le CTA est répété 3 fois"] },
                { cat: "Preuve sociale (5 points)", items: ["Minimum 3 témoignages avec noms et villes", "Au moins un résultat chiffré (argent, temps, score)", "Le nombre d'apprenants est affiché", "Les notes et étoiles sont visibles", "Une étude de cas développée est incluse"] },
                { cat: "CTA et achat (5 points)", items: ["Le bouton décrit une action, pas un état", "Les modes de paiement Mobile Money sont visibles", "La garantie est mentionnée près du CTA", "L'urgence (prix ou places) est justifiée", "Le prix est décliné en paiements si > 30 000 FCFA"] },
                { cat: "Confiance et réassurance (5 points)", items: ["La FAQ traite les 5 principales objections", "Le formateur est présenté avec ses credentials", "La politique de remboursement est claire", "Un exemple de module ou de vidéo preview est inclus", "La description est relue sur mobile avant publication"] },
              ].map((section) => (
                <div key={section.cat} style={{ background: "#fafafa", borderRadius: 12, padding: 14, border: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: 13, color: "#0e1512", marginBottom: 10 }}>{section.cat}</div>
                  {section.items.map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: 6, padding: "4px 0", borderTop: i> 0 ? "1px solid #f1f5f9" : "none" }}>
                      <div style={{ width: 16, height: 16, borderRadius: 4, border: "1.5px solid #4c9a6b", flexShrink: 0, marginTop: 1 }} />
                      <div style={{ fontSize: 12, color: "#5c6b62", lineHeight: 1.5 }}>{item}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Maquette>
        </SectionGuide>
      </CoqueGuide>
    </>
  );
}
