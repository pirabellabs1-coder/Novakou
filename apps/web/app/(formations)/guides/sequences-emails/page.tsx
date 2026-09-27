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
  "Séquence email qui vend formation",
)}&subtitle=${encodeURIComponent(
  "23 templates Novakou : bienvenue, relances, lancement, lead magnets",
)}`;

export const metadata: Metadata = {
  title: "Séquence email vente formation 2026",
  description:
    "Créez des séquences d'emails qui vendent vos formations en pilote automatique : lead magnets, bienvenue, relances. 23 templates Novakou inclus.",
  keywords: [
    "séquence email formation afrique",
    "email marketing formation en ligne",
    "automatisation email novakou",
    "vendre formation email afrique",
  ],
  alternates: {
    canonical: "/guides/sequences-emails",
  },
  openGraph: {
    title: "Séquence email vente formation 2026 | Novakou",
    description:
      "23 templates, séquences de bienvenue, relances et lancement : le guide complet de l'email marketing pour formateurs africains.",
    type: "article",
    url: `${APP_URL}/guides/sequences-emails`,
    siteName: "Novakou",
    images: [{ url: OG_IMAGE, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Séquence email vente formation 2026 | Novakou",
    description:
      "23 templates email pour vendre vos formations en pilote automatique en Afrique francophone.",
    images: [OG_IMAGE],
  },
};

const TOC = [
  { id: "intro", num: "01", label: "L'email marketing, l'actif que personne ne peut vous retirer" },
  { id: "liste", num: "02", label: "Construire sa liste email dès le jour 1" },
  { id: "lead-magnet", num: "03", label: "Le lead magnet : offrir pour recevoir" },
  { id: "bienvenue", num: "04", label: "La séquence de bienvenue en 5 emails" },
  { id: "lignes-objet", num: "05", label: "Les lignes objet qui font ouvrir" },
  { id: "lancement", num: "06", label: "La séquence de lancement (7 emails, 7 jours)" },
  { id: "relance", num: "07", label: "La séquence de relance (paniers abandonnés)" },
  { id: "segmentation", num: "08", label: "Segmenter sa liste pour mieux cibler" },
  { id: "metriques", num: "09", label: "Les métriques clés et benchmarks Afrique" },
  { id: "erreurs", num: "10", label: "Les 5 erreurs qui tuent vos emails" },
  { id: "templates", num: "11", label: "Les 23 templates email disponibles sur Novakou" },
  { id: "conclusion", num: "12", label: "Conclusion et prochaine étape" },
];

export default function SequencesEmailsPage() {
  return (
    <>
      <OldGuideJsonLd slug="sequences-emails" />
      <CoqueGuide
        ariane={[
          { label: "Accueil", href: "/" },
          { label: "Guides", href: "/guides/guide-complet-novakou" },
          { label: "Séquences emails" },
        ]}
        eyebrow="Guide complet 2026 · 15 min de lecture"
        titre={<>Séquences emails pour vendre ses formations en pilote automatique</>}
        sousTitre="L'email est l'actif marketing le plus rentable qui existe : 36 € de retour pour chaque euro investi. Découvrez comment construire votre liste, créer des séquences automatisées et vendre vos formations 24h/24 — avec 23 templates inclus sur Novakou."
        infos={[
          { texte: "12 chapitres" },
          { texte: "23 templates email" },
          { texte: "Mis à jour : Avril 2026" },
        ]}
        couverture={{
          src: "https://images.unsplash.com/photo-1596526131083-e8c633064194?auto=format&fit=crop&w=1200&q=80",
          alt: "Email marketing et séquences automatisées pour vendre des formations en Afrique",
        }}
        titreSommaire="Sommaire"
        uniteSommaire="chapitres"
        sommaire={TOC.map((t) => ({ id: t.id, label: t.label, n: t.num }))}
        apres={
          <>
          <div className="nka-pied">
            <p>Des questions sur l&apos;email marketing ?{" "} <Link href="/contact"> Contactez-nous </Link></p>
            <p>Dernière mise à jour : Avril 2026</p>
          </div>
          </>
        }
        fin={
          <>
            <CarteActionGuide
              titre="Prêt à automatiser vos ventes par email ?"
              action={{ href: "/inscription?role=vendeur", libelle: "Créer mon compte vendeur — C'est gratuit" }}
              note="Rejoint par 850+ créateurs en Afrique francophone"
            >
              <p>23 templates email inclus, séquences automatiques, segmentation avancée et A/B testing : tout est dans votre compte Novakou. Gratuit pour démarrer.</p>
            </CarteActionGuide>
            <SuiteGuides
              titre="Guides connexes"
              liens={[
                {
                  href: "/guides/tunnel-de-vente-novakou",
                  titre: "Créer un tunnel de vente sur Novakou",
                  resume:
                    "Builder drag-and-drop, 30+ blocs, checkout Mobile Money",
                },
                {
                  href: "/guides/description-produit",
                  titre: "Rédiger une description de formation irrésistible",
                  resume:
                    "Structure AIDA, bénéfices, preuve sociale, CTA",
                },
              ]}
            />
          </>
        }
      >
        <SectionGuide
          id="intro"
          titre={<>L'email marketing, l'actif que personne ne peut vous retirer</>}
          apres={<EtiquetteGuide>CHAPITRE 01</EtiquetteGuide>}
        >
          <p>
            Les algorithmes de Facebook changent. TikTok peut disparaître. Un compte Instagram peut être suspendu
            du jour au lendemain. Mais votre liste email, elle, vous appartient. C&apos;est le seul actif marketing
            que personne ne peut vous retirer, réduire, ou faire payer davantage pour atteindre.
          </p>

          <p>
            Les chiffres parlent d&apos;eux-mêmes. Le ROI moyen de l&apos;email marketing est de 36 € pour chaque
            euro investi — soit 3 600 %. En comparaison, une publicité Facebook bien optimisée rapporte en
            moyenne 2 à 4 € pour 1 € dépensé. L&apos;email bat tous les autres canaux, sans exception, en termes
            de retour sur investissement.
          </p>

          <p>
            En Afrique francophone, la situation est encore plus favorable. Les boîtes mail des professionnels
            africains sont moins saturées qu&apos;en Europe. Les taux d&apos;ouverture moyens sont de 30 à 45 %
            contre 20 % en Europe de l&apos;Ouest. Vos emails ont deux fois plus de chances d&apos;être lus.
            Et contrairement à WhatsApp où les messages se noient dans des dizaines de conversations simultanées,
            un email bien rédigé retient l&apos;attention.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 16, margin: "32px 0" }}>
            {[
              { value: "36x", label: "ROI moyen de l'email marketing" },
              { value: "40%", label: "Taux d'ouverture moyen en Afrique" },
              { value: "100%", label: "Votre liste vous appartient" },
            ].map((s) => (
              <div key={s.label} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px 28px", textAlign: "center" as const, flex: "1 1 180px" }}>
                <div style={{ fontSize: 32, color: "#006e2f", marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: 13, color: "#5c6b62", fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <Astuce>
            <strong>La règle d&apos;or :</strong> Chaque email adresse valide dans votre liste vaut en moyenne
            1 à 3 € par mois si vous l&apos;exploitez correctement. Une liste de 1 000 emails actifs peut donc
            générer entre 12 000 et 36 000 € par an — sans budget publicitaire.
          </Astuce>
        </SectionGuide>

        <SectionGuide
          id="liste"
          titre={<>Construire sa liste email dès le jour 1</>}
          apres={<EtiquetteGuide>CHAPITRE 02</EtiquetteGuide>}
        >
          <p>
            La question n&apos;est pas &laquo; quand commencer à collecter des emails ? &raquo; mais &laquo; pourquoi
            je ne l&apos;ai pas encore fait ? &raquo; Chaque jour sans collecte d&apos;emails est un jour de potentiel
            perdu. Voici comment démarrer, même si vous n&apos;avez encore aucun produit à vendre.
          </p>

          <h3>Les outils de collecte d&apos;emails</h3>

          <p>
            Novakou intègre nativement la collecte d&apos;emails dans chaque page produit, page de funnel et
            formulaire d&apos;opt-in. Vous n&apos;avez besoin d&apos;aucun outil externe. Le formulaire est
            connecté directement à votre base de contacts, qui alimente ensuite vos séquences automatisées.
          </p>

          <div style={{ margin: "24px 0" }}>
            {[
              {
                outil: "Formulaire pop-up Novakou",
                desc: "S'affiche après 30 secondes sur votre page ou à l'intention de quitter. Conversion moyenne : 3 à 8 % des visiteurs.",
                badge: "Intégré",
              },
              {
                outil: "Page de capture (squeeze page)",
                desc: "Page dédiée à 100 % à la collecte d'emails. Aucun menu, aucune distraction. Conversion : 20 à 40 % avec un bon lead magnet.",
                badge: "Intégré",
              },
              {
                outil: "Formulaire dans le contenu",
                desc: "Intégré dans vos articles de blog, vos guides gratuits. Moins intrusif, mais converti sur un public déjà engagé.",
                badge: "Intégré",
              },
              {
                outil: "Lien bio Instagram / TikTok",
                desc: "Redirige votre audience des réseaux sociaux vers votre page de capture. Crucial pour convertir vos followers en emails.",
                badge: "Via Novakou",
              },
            ].map((item) => (
              <div key={item.outil} style={{ display: "flex", gap: 16, padding: "16px 0", borderBottom: "1px solid #f1f5f9", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, color: "#0e1512" }}>{item.outil}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#006e2f", background: "#006e2f12", padding: "2px 8px", borderRadius: 6 }}>
                      {item.badge}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, color: "#5c6b62", lineHeight: 1.6 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <h3>Ce que vous devez collecter (et ne pas collecter)</h3>

          <p>
            Pour commencer, collectez uniquement le prénom et l&apos;email. C&apos;est suffisant pour personnaliser
            vos emails avec &laquo; Bonjour Kofi, &raquo; et déclencher vos séquences. Chaque champ
            supplémentaire dans votre formulaire réduit votre taux de conversion d&apos;environ 10 %. Ne demandez
            le numéro de téléphone, le pays, ou d&apos;autres informations que lorsque c&apos;est strictement nécessaire
            — et seulement après une première relation établie.
          </p>

          <Maquette titre="novakou.com/vendeur/contacts">
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 16, color: "#0e1512" }}>Ma liste email</div>
                <div style={{ fontSize: 13, color: "#006e2f", fontWeight: 700 }}>+12 cette semaine</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
                {[
                  { label: "Total contacts", value: "847" },
                  { label: "Actifs (30 jours)", value: "612" },
                  { label: "Taux ouverture", value: "38%" },
                ].map((stat) => (
                  <div key={stat.label} style={{ background: "#f0f6f2", borderRadius: 10, padding: 14, textAlign: "center" as const }}>
                    <div style={{ fontSize: 22, color: "#006e2f" }}>{stat.value}</div>
                    <div style={{ fontSize: 11, color: "#5c6b62", marginTop: 2 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: "#5c6b62" }}>
                Sources : Formulaire pop-up (42%) · Page de capture (35%) · Achats (23%)
              </div>
            </div>
          </Maquette>

          <Attention>
            <strong>RGPD et législation locale :</strong> Obtenez toujours le consentement explicite avant
            d&apos;envoyer des emails marketing. Un simple &laquo; J&apos;accepte de recevoir des conseils par
            email &raquo; suffit dans votre formulaire. Ne vendez jamais votre liste. Incluez toujours un lien
            de désinscription en bas de chaque email.
          </Attention>
        </SectionGuide>

        <SectionGuide
          id="lead-magnet"
          titre={<>Le lead magnet : offrir pour recevoir</>}
          apres={<EtiquetteGuide>CHAPITRE 03</EtiquetteGuide>}
        >
          <p>
            Personne ne donne son email pour rien. Pour convaincre un visiteur de vous confier son adresse,
            vous devez lui offrir quelque chose de valeur immédiate. C&apos;est le lead magnet : une ressource
            gratuite qui résout un problème précis de votre audience cible.
          </p>

          <p>
            Un bon lead magnet respecte trois critères : il doit être consommable rapidement (5 à 20 minutes),
            il doit donner un résultat concret et immédiat, et il doit pointer directement vers le problème
            que votre formation payante résout en profondeur. C&apos;est l&apos;entrée de votre tunnel, pas
            un cadeau sans lien avec votre offre.
          </p>

          <h3>Les 8 types de lead magnets qui fonctionnent en Afrique</h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "24px 0" }}>
            {[
              {
                type: "PDF / Guide PDF",
                exemple: "\"Les 7 formules Excel que tout comptable africain doit maîtriser\"",
                note: "Le plus populaire. Facile à créer, fort sentiment de valeur.",
                perf: "Excellent",
              },
              {
                type: "Checklist",
                exemple: "\"30 choses à vérifier avant de lancer votre boutique en ligne\"",
                note: "Ultra-concis, actionnable. Fort taux de conversion.",
                perf: "Excellent",
              },
              {
                type: "Mini-formation vidéo (3-5 vidéos)",
                exemple: "\"3 vidéos pour créer votre premier logo professionnel\"",
                note: "Plus long à créer mais taux d'engagement très élevé.",
                perf: "Très bon",
              },
              {
                type: "Template / Modèle",
                exemple: "\"Mon tableau de bord Excel de gestion freelance (gratuit)\"",
                note: "Très prisé car directement utilisable. Se partage beaucoup.",
                perf: "Très bon",
              },
              {
                type: "Webinaire gratuit",
                exemple: "\"Découvrez comment doubler vos ventes en 30 jours (live)\"",
                note: "Converti très bien mais demande plus d'organisation.",
                perf: "Bon",
              },
              {
                type: "Quiz / Test",
                exemple: "\"Quel type d'entrepreneur êtes-vous ? (résultat + conseils)\"",
                note: "Engagement très élevé. Permet la segmentation immédiate.",
                perf: "Bon",
              },
              {
                type: "Challenge gratuit",
                exemple: "\"Challenge 5 jours pour créer votre première formation\"",
                note: "Crée une communauté. Long à mettre en place.",
                perf: "Bon",
              },
              {
                type: "Accès à une ressource privée",
                exemple: "\"Rejoignez notre groupe WhatsApp d'entrepreneurs africains\"",
                note: "Facile à créer. Fonctionne bien si votre audience est active.",
                perf: "Variable",
              },
            ].map((lm) => (
              <div key={lm.type} style={{ background: "#fafafa", border: "1px solid #f1f5f9", borderRadius: 12, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div style={{ fontSize: 14, color: "#0e1512" }}>{lm.type}</div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: lm.perf === "Excellent" ? "#006e2f" : lm.perf === "Très bon" ? "#0ea5e9" : "#5c6b62", background: lm.perf === "Excellent" ? "#006e2f10" : lm.perf === "Très bon" ? "#e0f2fe" : "#f1f5f9", padding: "2px 8px", borderRadius: 6, flexShrink: 0 }}>
                    {lm.perf}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#006e2f", fontStyle: "italic" as const, marginBottom: 6, lineHeight: 1.5 }}>{lm.exemple}</div>
                <div style={{ fontSize: 12, color: "#5c6b62", lineHeight: 1.5 }}>{lm.note}</div>
              </div>
            ))}
          </div>

          <Astuce>
            <strong>Règle du lead magnet :</strong> Votre lead magnet doit être si utile que les gens se
            demandent comment votre formation payante peut être encore mieux. S&apos;ils ne sont pas impressionnés
            par ce que vous donnez gratuitement, ils n&apos;achèteront jamais votre formation.
          </Astuce>
        </SectionGuide>

        <SectionGuide
          id="bienvenue"
          titre={<>La séquence de bienvenue en 5 emails</>}
          apres={<EtiquetteGuide>CHAPITRE 04</EtiquetteGuide>}
        >
          <p>
            Les 7 premiers jours après l&apos;inscription sont critiques. C&apos;est là que votre abonné décide
            s&apos;il va rester engagé ou devenir un nom de plus dans votre liste inactive. La séquence de bienvenue
            est automatique : une fois configurée sur Novakou, elle s&apos;envoie à chaque nouvel abonné sans
            que vous ayez à intervenir.
          </p>

          <Maquette titre="novakou.com/vendeur/sequences/bienvenue">
            <div>
              <div style={{ fontSize: 12, color: "#5c6b62", marginBottom: 16, fontWeight: 600 }}>SÉQUENCE : Bienvenue + Introduction à votre univers</div>
              {[
                {
                  jour: "J+0",
                  objet: "Votre guide est arrivé ! (+ un bonus surprise)",
                  objectif: "Livrer le lead magnet + créer une première impression positive",
                  taux: "72%",
                  contenu: "Lien de téléchargement · Présentation en 3 lignes · Annonce des prochains emails",
                },
                {
                  jour: "J+1",
                  objet: "Pourquoi j'ai tout quitté pour faire ça...",
                  objectif: "Raconter votre histoire pour créer de la connexion émotionnelle",
                  taux: "54%",
                  contenu: "Histoire personnelle · Moment de transformation · Ce que vous comprenez maintenant",
                },
                {
                  jour: "J+3",
                  objet: "L'erreur que 90% des [votre audience] font encore",
                  objectif: "Apporter de la valeur et pointer vers un problème que vous résolvez",
                  taux: "48%",
                  contenu: "Conseil actionnable · Exemple concret · Transition vers votre offre (subtile)",
                },
                {
                  jour: "J+5",
                  objet: "\"Je n'y croyais plus...\" (témoignage de Kofi)",
                  objectif: "Preuve sociale via un cas client inspirant",
                  taux: "44%",
                  contenu: "Histoire d'un apprenant · Résultats concrets · Chiffres réels",
                },
                {
                  jour: "J+7",
                  objet: "Je ferme les portes vendredi soir à 23h59",
                  objectif: "Première présentation de votre offre avec urgence",
                  taux: "41%",
                  contenu: "Présentation de la formation · Offre de lancement · Compte à rebours · CTA clair",
                },
              ].map((email, i) => (
                <div
                  key={email.jour}
                  style={{ display: "grid", gridTemplateColumns: "60px 1fr auto", gap: 16, padding: "16px 0", borderBottom: i < 4 ? "1px solid #f1f5f9" : "none", alignItems: "flex-start" }}
                >
                  <div style={{ fontSize: 12, color: "#006e2f", background: "#006e2f10", padding: "4px 8px", borderRadius: 6, textAlign: "center" as const }}>
                    {email.jour}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0e1512", marginBottom: 2 }}>{email.objet}</div>
                    <div style={{ fontSize: 12, color: "#5c6b62", marginBottom: 4 }}>{email.objectif}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{email.contenu}</div>
                  </div>
                  <div style={{ fontSize: 13, color: "#4c9a6b", textAlign: "right" as const, flexShrink: 0 }}>
                    ~{email.taux}
                    <div style={{ fontSize: 10, color: "#5c6b62", fontWeight: 400 }}>ouverture</div>
                  </div>
                </div>
              ))}
            </div>
          </Maquette>

          <h3>Le contenu exact de chaque email</h3>

          <p>
            <strong>Email J+0 (livraison immédiate) :</strong> Commencez par livrer immédiatement ce que vous
            avez promis — votre lead magnet. Ne faites pas attendre. Ajoutez un bonus surprise non annoncé
            (un deuxième PDF, un template supplémentaire) : la réciprocité se construit dès le premier échange.
            Terminez l&apos;email avec une question simple comme &laquo; Quel est votre plus grand défi en ce
            moment avec [votre thème] ? &raquo; Les réponses vous donnent des idées de contenu et permettent
            aux destinataires de vous &laquo; marquer &raquo; comme expéditeur important dans leur messagerie.
          </p>

          <p>
            <strong>Email J+1 (votre histoire) :</strong> Racontez votre parcours. Pas votre CV, votre vraie
            histoire. Le moment où vous étiez dans la même situation que votre abonné aujourd&apos;hui.
            Les difficultés que vous avez rencontrées. Et ce qui a changé. L&apos;authenticité est votre seul
            avantage concurrentiel face aux formateurs internationaux qui ne comprennent pas les réalités africaines.
          </p>

          <p>
            <strong>Email J+3 (valeur pure) :</strong> Un conseil actionnable que votre abonné peut appliquer
            dès aujourd&apos;hui. Pas de vente, pas de CTA commercial. Juste de la valeur. Cet email est le plus
            important car il établit votre crédibilité et l&apos;habitude d&apos;ouvrir vos emails.
          </p>

          <p>
            <strong>Email J+5 (preuve sociale) :</strong> Partagez l&apos;histoire d&apos;un de vos apprenants.
            Avant/après concret. Chiffres réels. Difficultés rencontrées puis surmontées. Si vous démarrez et
            n&apos;avez pas encore d&apos;apprenants, utilisez votre propre transformation comme étude de cas.
          </p>

          <p>
            <strong>Email J+7 (offre) :</strong> Présentez votre formation. Rappel des bénéfices, pas des modules.
            Urgence réelle (pas inventée) : places limitées ou prix de lancement qui expire. Un seul CTA.
            Un seul lien. Tout doit pointer vers la même page de vente.
          </p>
        </SectionGuide>

        <SectionGuide
          id="lignes-objet"
          titre={<>Les lignes objet qui font ouvrir</>}
          apres={<EtiquetteGuide>CHAPITRE 05</EtiquetteGuide>}
        >
          <p>
            Votre ligne objet est la seule chose qui décide si votre email est ouvert ou ignoré. Elle doit
            créer de la curiosité, promettre une valeur spécifique, ou déclencher une émotion — en moins de
            50 caractères (pour l&apos;affichage mobile). Voici 50 exemples éprouvés classés par catégorie.
          </p>

          <div style={{ margin: "28px 0" }}>
            {[
              {
                categorie: "Curiosité",
                emoji: "🤔",
                exemples: [
                  "Ce que personne ne vous dit sur [votre thème]",
                  "La vraie raison pour laquelle vous n'avancez pas",
                  "J'ai fait une erreur (et voici ce que j'ai appris)",
                  "Pourquoi les meilleurs [votre audience] font l'inverse",
                  "La méthode bizarre qui m'a rapporté 500 000 FCFA",
                  "Vous ne croirez pas ce que Kofi a fait en 30 jours",
                  "Ce que j'aurais voulu savoir quand j'ai commencé",
                  "Je dois vous avouer quelque chose...",
                  "Le secret que les experts gardent pour eux",
                  "Avez-vous remarqué ça aussi ?",
                ],
              },
              {
                categorie: "Bénéfice direct",
                emoji: "🎯",
                exemples: [
                  "Comment [résultat] en [délai] sans [obstacle]",
                  "5 étapes pour doubler vos revenus cette semaine",
                  "La méthode rapide pour créer votre première formation",
                  "Obtenez [résultat] avant la fin du mois",
                  "Comment j'ai gagné 200 000 FCFA avec un seul email",
                  "3 techniques pour vendre sans paraître commercial",
                  "Votre guide pour [résultat] est prêt",
                  "Faites ça ce soir et voyez les résultats demain",
                  "Le raccourci que 95% des formateurs ignorent",
                  "Transformez [problème] en opportunité en 48h",
                ],
              },
              {
                categorie: "Urgence & rareté",
                emoji: "⏰",
                exemples: [
                  "Dernière chance (ferme ce soir à 23h59)",
                  "Il ne reste que 3 places",
                  "Le prix monte dans 2 heures",
                  "Cette offre disparaît dans [X] heures",
                  "Je retire ça demain matin",
                  "Accès fermé dans 48h — voici pourquoi",
                  "Offre de lancement : seulement ce week-end",
                  "Ne ratez pas ça (vraiment)",
                  "Plus que 8 places au tarif de lancement",
                  "Votre accès expire bientôt",
                ],
              },
              {
                categorie: "Personnalisation",
                emoji: "👋",
                exemples: [
                  "[Prénom], j'ai pensé à vous",
                  "Bonne nouvelle pour vous, [Prénom]",
                  "[Prénom], j'ai quelque chose d'important à vous dire",
                  "À vous qui voulez [résultat]...",
                  "Pour les [votre audience] sérieux seulement",
                  "Si vous êtes à Dakar, lisez ceci",
                  "Spécial pour les [audience] au Cameroun",
                  "C'est pour vous si vous avez ce problème",
                  "Je vous ai préparé quelque chose",
                  "Vous méritez mieux que ça, [Prénom]",
                ],
              },
              {
                categorie: "Question",
                emoji: "❓",
                exemples: [
                  "Vous avez 10 minutes ce soir ?",
                  "Êtes-vous satisfait de vos revenus ce mois ?",
                  "Savez-vous combien vous perdez chaque mois ?",
                  "Avez-vous essayé ça ?",
                  "Êtes-vous encore en train de faire cette erreur ?",
                  "Qu'est-ce qui vous bloque vraiment ?",
                  "Comment ça se passe de votre côté ?",
                  "Pouvez-vous me rendre un service ?",
                  "Avez-vous vu les résultats de Kofi ?",
                  "Êtes-vous prêt pour la prochaine étape ?",
                ],
              },
            ].map((cat) => (
              <div key={cat.categorie} style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 18 }}>{cat.emoji}</span>
                  <span style={{ fontSize: 16, color: "#0e1512" }}>{cat.categorie}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {cat.exemples.map((ex, i) => (
                    <div key={i} style={{ fontSize: 13, color: "#5c6b62", background: "#f8fafc", borderRadius: 8, padding: "10px 14px", borderLeft: "3px solid #4c9a6b40", lineHeight: 1.5 }}>
                      {ex}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Astuce>
            <strong>La règle d&apos;or des lignes objet :</strong> Testez toujours 2 versions (A/B test) sur
            vos 20 premières heures d&apos;envoi. Novakou vous permet de faire ce test automatiquement.
            La version avec le meilleur taux d&apos;ouverture s&apos;envoie automatiquement au reste de votre liste.
            Sur 6 mois, cette pratique peut augmenter votre taux d&apos;ouverture moyen de 15 à 30 %.
          </Astuce>
        </SectionGuide>

        <SectionGuide
          id="lancement"
          titre={<>La séquence de lancement (7 emails, 7 jours)</>}
          apres={<EtiquetteGuide>CHAPITRE 06</EtiquetteGuide>}
        >
          <p>
            Un lancement de formation n&apos;est pas un seul email envoyé le jour J. C&apos;est une séquence
            orchestrée sur 7 jours qui crée de l&apos;anticipation, de la désirabilité, et une urgence finale.
            Cette méthode, adaptée du Product Launch Formula de Jeff Walker, est la plus éprouvée pour vendre
            des formations en ligne — et elle fonctionne encore mieux sur le marché africain où le sentiment
            d&apos;exclusivité est très fort.
          </p>

          <div style={{ margin: "28px 0", borderLeft: "3px solid #4c9a6b40", paddingLeft: 28 }}>
            {[
              {
                jour: "J-7",
                titre: "Email de pré-lancement",
                contenu: "Annoncez que quelque chose arrive. Ne révélez pas encore quoi. Créez de la curiosité et de l'anticipation. Demandez : 'Si vous pouviez apprendre une seule chose sur [thème], ce serait quoi ?' Les réponses vous donnent des arguments de vente.",
                kpi: "Taux ouverture cible : 45%+",
              },
              {
                jour: "J-5",
                titre: "Contenu de valeur #1",
                contenu: "Publiez une vidéo, un article ou un email avec votre meilleur conseil gratuit sur le thème de votre formation. Installez votre crédibilité. Annoncez que vous allez révéler quelque chose de plus complet dans 5 jours.",
                kpi: "Taux clic cible : 8%+",
              },
              {
                jour: "J-3",
                titre: "Contenu de valeur #2 + teaser",
                contenu: "Deuxième contenu gratuit. Encore plus de valeur. Commencez à mentionner votre formation de façon très indirecte. Montrez des résultats d'apprenants. Annoncez l'ouverture dans 3 jours.",
                kpi: "Engagement : réponses et partages",
              },
              {
                jour: "J-1",
                titre: "Le compte à rebours commence",
                contenu: "Annoncez clairement que votre formation ouvre demain. Résumez les bénéfices clés. Expliquez l'offre spéciale de lancement (prix réduit ou bonus exclusifs). Créez de l'anticipation.",
                kpi: "Taux ouverture cible : 55%+",
              },
              {
                jour: "J (Ouverture)",
                titre: "Portes ouvertes",
                contenu: "L'email le plus important. Présentez votre formation en détail. Tous les bénéfices. Tous les bonus. Le prix de lancement. Le compte à rebours jusqu'à la fermeture. Un seul CTA, répété 3 fois dans l'email.",
                kpi: "Taux conversion cible : 3-8%",
              },
              {
                jour: "J+2",
                titre: "FAQ + objections",
                contenu: "Répondez aux 5 objections les plus courantes ('C'est trop cher', 'Je n'ai pas le temps', 'Ça va vraiment marcher pour moi ?'). Ajoutez de nouveaux témoignages reçus depuis l'ouverture.",
                kpi: "Récupérer les hésitants",
              },
              {
                jour: "J+4 (Fermeture)",
                titre: "Dernière chance — ferme ce soir",
                contenu: "L'email de fermeture est souvent le plus lucratif. 30 à 40 % des ventes d'un lancement se font dans les dernières 24 heures. Urgence réelle. Rappel de tous les bénéfices. Deux ou trois envois ce jour (matin, midi, 2h avant fermeture).",
                kpi: "30-40% des ventes totales",
              },
            ].map((step, i) => (
              <div key={step.jour} style={{ marginBottom: i < 6 ? 28 : 0, position: "relative" as const }}>
                <div style={{ position: "absolute" as const, left: -38, top: 4, width: 14, height: 14, borderRadius: "50%", background: "#4c9a6b", border: "3px solid white", boxShadow: "0 0 0 2px #4c9a6b40" }} />
                <div style={{ fontSize: 12, fontWeight: 700, color: "#4c9a6b", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 4 }}>
                  {step.jour}
                </div>
                <div style={{ fontSize: 16, color: "#0e1512", marginBottom: 6 }}>{step.titre}</div>
                <div style={{ fontSize: 14, color: "#5c6b62", lineHeight: 1.7, marginBottom: 8 }}>{step.contenu}</div>
                <div style={{ fontSize: 12, color: "#006e2f", fontWeight: 700 }}>{step.kpi}</div>
              </div>
            ))}
          </div>

          <Attention>
            <strong>Ne lancez pas sans liste chaude :</strong> Cette séquence fonctionne mieux avec une
            liste d&apos;abonnés qui vous connaît déjà. Si votre liste a moins de 100 contacts, ou si vous
            n&apos;avez rien envoyé depuis 3 mois, faites d&apos;abord une &laquo; séquence de réveil &raquo; de
            3 emails sur 2 semaines avant votre lancement.
          </Attention>
        </SectionGuide>

        <SectionGuide
          id="relance"
          titre={<>La séquence de relance (paniers abandonnés)</>}
          apres={<EtiquetteGuide>CHAPITRE 07</EtiquetteGuide>}
        >
          <p>
            Statistique choc : 70 % des personnes qui arrivent sur votre page de paiement n&apos;achètent pas.
            Pas parce qu&apos;elles ne voulaient pas votre formation. Parce qu&apos;elles ont été interrompues,
            ont eu un doute, ou ont simplement décidé de &laquo; le faire demain &raquo;. Une séquence de
            relance bien configurée récupère entre 10 et 25 % de ces ventes perdues — sans budget supplémentaire.
          </p>

          <h3>La séquence de relance en 3 emails</h3>

          <div style={{ margin: "24px 0" }}>
            {[
              {
                timing: "1 heure après",
                sujet: "Vous avez oublié quelque chose...",
                contenu: "Email court, informel. Rappeler que leur place est toujours disponible. Pas de pression. Juste un rappel amical. Lien direct vers la page de paiement. Ce premier email récupère souvent 40 à 50 % des paniers abandonnés.",
                icon: "⏰",
              },
              {
                timing: "24 heures après",
                sujet: "Une question avant de partir",
                contenu: "Demandez pourquoi ils n'ont pas finalisé. Proposez de répondre à leurs questions directement. Parfois, un simple doute non résolu bloque l'achat. Un email 'je suis disponible pour répondre' peut débloquer des ventes que vous n'imaginiez pas.",
                icon: "❓",
              },
              {
                timing: "72 heures après",
                sujet: "Offre spéciale (expire demain)",
                contenu: "Dernier email de relance. Proposez une réduction de 10 à 15 % ou un bonus supplémentaire pour les convaincre de franchir le pas. Urgence réelle : l'offre expire dans 24 heures. Ce troisième email est généralement le plus lucratif de la séquence.",
                icon: "🎁",
              },
            ].map((email) => (
              <div key={email.timing} style={{ background: "#fafafa", border: "1px solid #f1f5f9", borderRadius: 14, padding: "20px 24px", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 20 }}>{email.icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#4c9a6b" }}>{email.timing}</div>
                    <div style={{ fontSize: 15, color: "#0e1512" }}>{email.sujet}</div>
                  </div>
                </div>
                <div style={{ fontSize: 14, color: "#5c6b62", lineHeight: 1.7 }}>{email.contenu}</div>
              </div>
            ))}
          </div>

          <Astuce>
            <strong>Configuration sur Novakou :</strong> La relance de panier abandonné s&apos;active en un
            clic dans votre dashboard vendeur. Novakou détecte automatiquement quand un utilisateur ajoute
            votre formation à son panier sans finaliser l&apos;achat et déclenche la séquence de relance.
            Aucun outil externe requis.
          </Astuce>
        </SectionGuide>

        <SectionGuide
          id="segmentation"
          titre={<>Segmenter sa liste pour mieux cibler</>}
          apres={<EtiquetteGuide>CHAPITRE 08</EtiquetteGuide>}
        >
          <p>
            Envoyer le même email à toute votre liste, c&apos;est comme envoyer la même publicité à tout le
            Sénégal en espérant que ça parle à tout le monde. La segmentation vous permet d&apos;envoyer le bon
            message, à la bonne personne, au bon moment. Résultat : taux d&apos;ouverture 2 fois plus élevés,
            taux de conversion 3 fois supérieurs.
          </p>

          <div style={{ border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden", margin: "24px 0" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left" as const, fontWeight: 700, color: "#0e1512", borderBottom: "1px solid #e2e8f0" }}>Critère</th>
                  <th style={{ padding: "12px 16px", textAlign: "left" as const, fontWeight: 700, color: "#0e1512", borderBottom: "1px solid #e2e8f0" }}>Segments possibles</th>
                  <th style={{ padding: "12px 16px", textAlign: "left" as const, fontWeight: 700, color: "#0e1512", borderBottom: "1px solid #e2e8f0" }}>Utilisation type</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Pays", "Sénégal, Côte d'Ivoire, Cameroun, Bénin...", "Offre en FCFA XOF vs FCFA XAF, événements locaux"],
                  ["Comportement d'achat", "Acheteurs, non-acheteurs, paniers abandonnés", "Relance paniers, upsell clients existants"],
                  ["Intérêt (lead magnet)", "Finance, Marketing, Tech, Design...", "Recommander des formations connexes"],
                  ["Niveau d'engagement", "Ouvre toujours, parfois, jamais", "Réactiver les inactifs, récompenser les fidèles"],
                  ["Type d'audience", "Entrepreneurs, salariés, étudiants", "Adapter le ton et les exemples"],
                  ["Stade du parcours", "Découverte, considération, décision", "Contenu éducatif vs offres de vente"],
                ].map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        style={{ padding: "12px 16px", color: j === 0 ? "#0e1512" : "#5c6b62", fontWeight: j === 0 ? 600 : 400, borderBottom: i < 5 ? "1px solid #f1f5f9" : "none", lineHeight: 1.5 }}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p>
            Sur Novakou, vous pouvez créer des segments dynamiques basés sur l&apos;ensemble de ces critères.
            Un segment dynamique se met à jour automatiquement : si un abonné achète votre formation, il
            quitte automatiquement le segment &laquo; non-acheteurs &raquo; et entre dans le segment
            &laquo; clients &raquo; pour recevoir des emails de suivi et d&apos;upsell adaptés.
          </p>
        </SectionGuide>

        <SectionGuide
          id="metriques"
          titre={<>Les métriques clés et benchmarks Afrique</>}
          apres={<EtiquetteGuide>CHAPITRE 09</EtiquetteGuide>}
        >
          <p>
            Mesurer vos résultats est la seule façon d&apos;améliorer vos performances. Voici les métriques
            essentielles, avec les benchmarks spécifiques au marché africain francophone — souvent différents
            des moyennes mondiales.
          </p>

          <Maquette titre="novakou.com/vendeur/emails/statistiques">
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#5c6b62", marginBottom: 12, fontWeight: 600 }}>DERNIÈRE CAMPAGNE — "Ouverture formation Excel Pro"</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                {[
                  { label: "Envoyés", value: "847", color: "#5c6b62" },
                  { label: "Ouverts", value: "324 (38%)", color: "#006e2f" },
                  { label: "Cliqués", value: "67 (8%)", color: "#0ea5e9" },
                  { label: "Conversions", value: "12 (1.8%)", color: "#4c9a6b" },
                ].map((stat) => (
                  <div key={stat.label} style={{ background: "#f8fafc", borderRadius: 10, padding: 14, textAlign: "center" as const }}>
                    <div style={{ fontSize: 18, color: stat.color, marginBottom: 4 }}>{stat.value}</div>
                    <div style={{ fontSize: 11, color: "#5c6b62" }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 12 }}>
              <div style={{ display: "flex", gap: 16 }}>
                {[
                  { label: "Désinscriptions", value: "3 (0.4%)", ok: true },
                  { label: "Spam", value: "0 (0%)", ok: true },
                  { label: "Rebonds", value: "8 (0.9%)", ok: true },
                ].map((stat) => (
                  <div key={stat.label} style={{ fontSize: 12, color: stat.ok ? "#006e2f" : "#dc2626", fontWeight: 600 }}>
                    {stat.label} : {stat.value}
                  </div>
                ))}
              </div>
            </div>
          </Maquette>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, margin: "24px 0" }}>
            {[
              { metrique: "Taux d'ouverture", afrique: "30–45%", monde: "~20%", bon: ">35%" },
              { metrique: "Taux de clic", afrique: "5–12%", monde: "~2.5%", bon: ">8%" },
              { metrique: "Taux de conversion (email → vente)", afrique: "1–4%", monde: "~1%", bon: ">2%" },
              { metrique: "Taux de désinscription", afrique: "<1%", monde: "<0.5%", bon: "<0.3%" },
              { metrique: "Taux de spam", afrique: "<0.1%", monde: "<0.08%", bon: "0%" },
              { metrique: "Taux de rebond", afrique: "<2%", monde: "<2%", bon: "<1%" },
            ].map((m) => (
              <div key={m.metrique} style={{ background: "#fafafa", border: "1px solid #f1f5f9", borderRadius: 14, padding: "18px 20px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0e1512", marginBottom: 8, lineHeight: 1.3 }}>{m.metrique}</div>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 4 }}>
                  <div style={{ fontSize: 12, color: "#5c6b62" }}>
                    <span style={{ fontWeight: 600, color: "#006e2f" }}>Afrique :</span> {m.afrique}
                  </div>
                  <div style={{ fontSize: 12, color: "#5c6b62" }}>
                    <span style={{ fontWeight: 600 }}>Monde :</span> {m.monde}
                  </div>
                  <div style={{ fontSize: 12, color: "#4c9a6b", fontWeight: 700 }}>
                    Objectif : {m.bon}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionGuide>

        <SectionGuide
          id="erreurs"
          titre={<>Les 5 erreurs qui tuent vos emails</>}
          apres={<EtiquetteGuide>CHAPITRE 10</EtiquetteGuide>}
        >
          <div style={{ margin: "28px 0" }}>
            {[
              {
                num: "1",
                title: "Envoyer des emails trop rarement",
                desc: "Beaucoup de formateurs ont peur d'envoyer trop d'emails et n'envoient qu'une fois par mois. Résultat : leurs abonnés les oublient. La fréquence idéale est de 2 à 3 emails par semaine pour rester présent sans fatiguer. Moins de 1 email par semaine = liste qui se refroidit.",
                fix: "Planifiez au minimum 1 email de valeur par semaine + 1 email commercial toutes les 2 semaines.",
              },
              {
                num: "2",
                title: "Parler de soi au lieu de parler à l'abonné",
                desc: "La grande majorité des emails de formateurs commencent par 'Je voulais vous partager...', 'J'ai travaillé sur...', 'Mon programme...'. Vos abonnés s'en fichent. Ils veulent savoir ce que vous apportez à leur situation, pas ce que vous faites.",
                fix: "Remplacez chaque 'je' par 'vous' ou 'votre'. Commencez par le bénéfice, pas par vous-même.",
              },
              {
                num: "3",
                title: "Mettre trop de liens et d'appels à l'action",
                desc: "Un email avec 7 liens vers 4 formations, 2 articles et votre page Instagram ne convertit rien. Trop de choix = pas de choix. La confusion tue la conversion. Chaque email doit avoir un seul objectif et un seul CTA.",
                fix: "Un email = un objectif = un lien. Si vous avez plusieurs choses à partager, faites plusieurs emails.",
              },
              {
                num: "4",
                title: "Ignorer les emails inactifs",
                desc: "30 à 40 % de votre liste n'ouvre plus vos emails après 6 mois. Les laisser là nuit à votre délivrabilité (les serveurs email détectent le non-engagement et envoient vos emails en spam pour tout le monde). Nettoyez régulièrement.",
                fix: "Envoyez une séquence de réactivation de 3 emails. Si pas de réponse, supprimez. Mieux vaut une liste de 300 actifs que 1000 fantômes.",
              },
              {
                num: "5",
                title: "Ne pas tester ses emails sur mobile",
                desc: "Plus de 80 % de vos abonnés africains lisent leurs emails sur mobile. Un email qui s'affiche mal sur mobile (texte trop petit, images cassées, bouton invisible) est un email perdu. Pourtant, moins de 20 % des formateurs testent sur mobile avant d'envoyer.",
                fix: "Envoyez-vous toujours un email de test sur votre propre smartphone avant d'envoyer à toute votre liste.",
              },
            ].map((err) => (
              <div key={err.num} style={{ borderRadius: 14, border: "1px solid #fecaca", background: "#fef2f2", padding: "24px", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 13, color: "#dc2626", background: "#fee2e2", borderRadius: 8, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {err.num}
                  </span>
                  <span style={{ fontSize: 16, color: "#991b1b" }}>{err.title}</span>
                </div>
                <div style={{ fontSize: 14, color: "#7f1d1d", lineHeight: 1.7, marginBottom: 12, opacity: 0.85 }}>{err.desc}</div>
                <div style={{ fontSize: 13, color: "#006e2f", fontWeight: 700, background: "white", padding: "10px 16px", borderRadius: 8, border: "1px solid #4c9a6b40" }}>
                  La solution : {err.fix}
                </div>
              </div>
            ))}
          </div>
        </SectionGuide>

        <SectionGuide
          id="templates"
          titre={<>Les 23 templates email disponibles sur Novakou</>}
          apres={<EtiquetteGuide>CHAPITRE 11</EtiquetteGuide>}
        >
          <p>
            Novakou inclut 23 templates email professionnels, rédigés spécifiquement pour le marché africain
            francophone. Chaque template est personnalisable en quelques clics depuis votre dashboard vendeur.
            Voici la liste complète.
          </p>

          {/* Image templates */}
          <div style={{ borderRadius: 16, overflow: "hidden", margin: "28px 0", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
            <Image src="https://images.unsplash.com/photo-1557200134-90327ee9fafa?auto=format&fit=crop&w=900&q=80" alt="23 templates email professionnels pour vendre ses formations en ligne" width={900} height={400} style={{ width: "100%", objectFit: "cover", display: "block", maxHeight: 380 }} />
            <div style={{ fontSize: 12, color: "#5c6b62", textAlign: "center" as const, padding: "10px 16px", background: "#f8fafc" }}>
              23 templates email personnalisables disponibles dans votre dashboard Novakou
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, margin: "28px 0" }}>
            {[
              { cat: "Séquence bienvenue", num: "5", items: ["Livraison lead magnet", "Histoire du formateur", "Valeur gratuite", "Témoignage apprenant", "Première offre de vente"] },
              { cat: "Lancement", num: "7", items: ["Pré-lancement mystère", "Contenu valeur #1", "Contenu valeur #2", "Compte à rebours", "Ouverture des portes", "FAQ / objections", "Dernière chance"] },
              { cat: "Relance", num: "3", items: ["Panier abandonné (1h)", "Panier abandonné (24h)", "Panier abandonné + offre (72h)"] },
              { cat: "Post-achat", num: "3", items: ["Confirmation d'achat", "Accès à votre formation", "Comment démarrer — guide"] },
              { cat: "Fidélisation", num: "3", items: ["Check-in progression apprenant", "Demande de témoignage", "Offre exclusive client existant"] },
              { cat: "Réactivation", num: "2", items: ["Abonné inactif (win-back)", "Vous nous manquez (dernière chance)"] },
            ].map((cat) => (
              <div key={cat.cat} style={{ background: "#fafafa", border: "1px solid #f1f5f9", borderRadius: 12, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontSize: 14, color: "#0e1512" }}>{cat.cat}</div>
                  <span style={{ fontSize: 13, color: "#006e2f", background: "#006e2f12", borderRadius: 6, padding: "2px 10px" }}>
                    {cat.num} templates
                  </span>
                </div>
                {cat.items.map((item, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#5c6b62", padding: "4px 0", display: "flex", alignItems: "center", gap: 6, borderTop: i> 0 ? "1px solid #f1f5f9" : "none" }}
                  >
                    <span style={{ color: "#4c9a6b", fontSize: 12, fontWeight: 700 }}>✓</span> {item}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <Maquette titre="novakou.com/vendeur/emails/templates">
            <div style={{ fontSize: 13, color: "#5c6b62", marginBottom: 14 }}>
              <strong>Comment utiliser un template :</strong>
            </div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
              {[
                "Sélectionnez un template dans la bibliothèque",
                "Personnalisez le nom de votre formation, vos chiffres et vos exemples",
                "Ajoutez votre signature et vos liens",
                "Prévisualisez sur desktop et mobile",
                "Envoyez à votre liste ou programmez",
              ].map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ fontSize: 11, color: "white", background: "#006e2f", borderRadius: 6, width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 13, color: "#0e1512", lineHeight: 1.6 }}>{step}</span>
                </div>
              ))}
            </div>
          </Maquette>
        </SectionGuide>

        <SectionGuide
          id="conclusion"
          titre={<>Conclusion et prochaine étape</>}
          apres={<EtiquetteGuide>CHAPITRE 12</EtiquetteGuide>}
        >
          <p>
            L&apos;email marketing n&apos;est pas une tactique parmi d&apos;autres. C&apos;est la fondation de votre
            business de formation en ligne. WhatsApp, Facebook, TikTok — ces canaux sont excellents pour
            attirer des visiteurs. Mais votre liste email est l&apos;endroit où vous transformez ces visiteurs
            en clients, et ces clients en acheteurs récurrents.
          </p>

          <p>
            Commencez par une seule chose : créez votre lead magnet et configurez votre séquence de bienvenue
            en 5 emails. C&apos;est 2 à 3 heures de travail qui vont travailler pour vous chaque jour, automatiquement,
            pendant des années. Ajoutez ensuite progressivement la séquence de lancement, les relances de panier
            abandonné, et la segmentation.
          </p>

          <p>
            Les formateurs qui réussissent sur Novakou ont tous un point commun : ils ont commencé à collecter
            des emails et à envoyer régulièrement des messages à leur liste. Certains ont une liste de 10 000
            contacts. D&apos;autres vendent très bien avec 300 emails soigneusement cultivés. La taille importe
            moins que la qualité de la relation.
          </p>
        </SectionGuide>
      </CoqueGuide>
    </>
  );
}
