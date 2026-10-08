import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Clock } from "lucide-react";
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
  Barres,
  Chiffres,
  Maquette,
  Paliers,
  ProAstuce,
  SectionGuide,
} from "@/components/formations/public/article/EncadresGuide";
import { jsonLdSafe } from "@/lib/seo/json-ld";

const OG_TITLE = "Vendre une formation en ligne au Senegal en 2026";
const OG_SUBTITLE = "Le guide complet : Wave, Orange Money, fiscalite, lancement 30 jours";

export const metadata: Metadata = {
  // Title sans "| Novakou" — le template root l'ajoute automatiquement.
  // Évite le double suffix "| Novakou | Novakou" qui dépasse la limite Google.
  title: "Vendre une formation au Sénégal en 2026 — Guide complet",
  description:
    "Le guide pratique pour vendre formation en ligne Senegal en 2026 : Wave, Orange Money, fiscalite freelance, lancement 30 jours et chiffres reels du marche dakarois.",
  openGraph: {
    title:
      "Vendre une formation en ligne au Senegal en 2026 | Guide Novakou",
    description:
      "Wave, Orange Money, fiscalite auto-entrepreneur, methode de lancement 30 jours : tout pour vendre ta formation digitale au Senegal.",
    type: "article",
    images: [
      `/api/og?type=guide&title=${encodeURIComponent(OG_TITLE)}&subtitle=${encodeURIComponent(OG_SUBTITLE)}`,
    ],
  },
  alternates: {
    canonical: "/guides/vendre-formation-senegal-2026",
  },
};

/* ─── Table of Contents data ──────────────────────────────── */
const TOC = [
  { id: "introduction", label: "Pourquoi vendre une formation au Senegal en 2026" },
  { id: "sujets", label: "Choisir son sujet - ce qui se vend vraiment" },
  { id: "paiements", label: "Encaisser - Wave, Orange Money, carte" },
  { id: "fiscalite", label: "Le cadre fiscal du formateur freelance" },
  { id: "promotion", label: "Promouvoir ta formation - les canaux qui marchent" },
  { id: "lancement", label: "Lancer en 30 jours sans budget" },
  { id: "revenus", label: "Combien on peut gagner ? (chiffres reels)" },
  { id: "faq", label: "FAQ - les questions qu'on me pose tout le temps" },
] as const;

/* ─── FAQ data (utilisee pour le rendu ET le JSON-LD) ─────── */
const FAQ_ITEMS = [
  {
    q: "Faut-il un compte bancaire pour vendre une formation au Senegal ?",
    a: "Non. Au Senegal en 2026, un compte Wave ou Orange Money suffit largement pour commencer. Novakou verse directement tes gains sur ton numéro Mobile Money. Le compte bancaire devient utile a partir d'environ 500 000 FCFA de chiffre d'affaires mensuel, quand tu veux ouvrir un compte pro a la SGBS, Ecobank ou BICIS pour structurer ta tresorerie.",
  },
  {
    q: "Quel est le prix moyen d'une formation vendue au Senegal ?",
    a: "Le ticket median sur le marche senegalais en 2026 se situe entre 15 000 et 35 000 FCFA pour une formation de 3 a 6 heures. Les formations premium (avec coaching, communaute privee, certificat) montent a 75 000 - 200 000 FCFA. Les mini-formations express (1h - 2h) se vendent autour de 5 000 - 12 000 FCFA. Plus le resultat est concret (decrocher un emploi, gagner un client, monter un business), plus tu peux monter en prix.",
  },
  {
    q: "Est-ce que je dois declarer mes revenus a la DGI ?",
    a: "Oui, des le premier FCFA encaisse. Le statut le plus simple au Senegal est l'auto-entrepreneur (Loi 2019-04). Tu te declares en ligne sur le portail DGI ou en agence, tu obtiens un NINEA, et tu paies un impot synthetique simplifie. Tant que tu restes sous le seuil de 25 millions FCFA de CA annuel, tu es exonere de TVA. Cet article est informatif - consulte un comptable agree pour ta situation precise.",
  },
  {
    q: "Wave ou Orange Money, lequel choisir pour encaisser ?",
    a: "Les deux, sans hesiter. Wave domine Dakar et les villes (frais zero ou très bas, app moderne, transferts instantanes), Orange Money couvre mieux les zones rurales et la diaspora francophone. Novakou integre les deux par defaut : ton acheteur choisit, tu encaisses, tu recois ton solde en fin de cycle. Refuser l'un des deux, c'est se priver d'environ 30 a 40 pourcent du marche senegalais.",
  },
  {
    q: "Combien de temps avant ma premiere vente ? 🤔",
    a: "Avec la methode 30 jours decrite plus haut : entre 14 et 21 jours pour la premiere vente si tu as déjà une petite audience WhatsApp (50 - 200 contacts). Sans audience, compte 45 a 60 jours - le temps de construire 500 abonnes Instagram ou TikTok. Les formateurs qui vont le plus vite sont ceux qui pre-vendent avant meme d'enregistrer le contenu.",
  },
  {
    q: "Faut-il un site web pour vendre une formation au Senegal ?",
    a: "Non, plus en 2026. Ta boutique Novakou (novakou.com/ton-pseudo) fait déjà office de site : page de vente, paiement, livraison automatique, espace eleve. 80 pourcent des vendeurs senegalais sur Novakou ne possedent aucun site separe. Le seul cas ou un site dedie devient utile : si tu veux ranker sur Google avec du SEO de fond (blog, articles longs), mais cela vient plus tard.",
  },
  {
    q: "Puis-je vendre une formation depuis Thies, Saint-Louis ou Ziguinchor ?",
    a: "Bien sur. La vente de formation en ligne au Senegal n'est pas reservee a Dakar. Avec une connexion 4G correcte (Orange ou Free), un smartphone recent et un micro-cravate a 5 000 FCFA, tu produis la meme qualité qu'a Almadies. Plusieurs formateurs Novakou bases en region depassent 800 000 FCFA mensuels - leur avantage : couts de vie plus bas, donc rentabilite superieure.",
  },
  {
    q: "Comment eviter que ma formation soit piratee et partagee gratuitement ? 🔒",
    a: "Le risque zero n'existe pas, mais Novakou applique : streaming protege (videos non telechargeables), filigrane dynamique avec le mail de l'acheteur, lien personnalise par compte, blocage automatique si plusieurs IP simultanees. Reste vigilant sur Telegram et WhatsApp ou des groupes de revente existent. La meilleure defense : un service inclus (coaching, replays a jour, communaute) que le pirate ne peut pas copier.",
  },
] as const;


/* ═════════════════════════════════════════════════════════════ */
/* PAGE                                                         */
/* ═════════════════════════════════════════════════════════════ */

export default function VendreFormationSenegalPage() {
  const ogImageUrl = `https://novakou.com/api/og?type=guide&title=${encodeURIComponent(OG_TITLE)}&subtitle=${encodeURIComponent(OG_SUBTITLE)}`;

  return (
    <>
      {/* ───────────────── JSON-LD : Article ───────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdSafe({
            "@context": "https://schema.org",
            "@type": "Article",
            headline:
              "Vendre une formation en ligne au Senegal en 2026 : le guide complet",
            description:
              "Le guide pratique pour vendre une formation en ligne au Senegal en 2026 : Wave, Orange Money, fiscalite freelance, lancement 30 jours et chiffres reels.",
            author: { "@type": "Organization", name: "Novakou" },
            publisher: {
              "@type": "Organization",
              name: "Novakou",
              url: "https://novakou.com",
              logo: {
                "@type": "ImageObject",
                url: "https://novakou.com/logo.png",
              },
            },
            datePublished: "2026-06-07",
            dateModified: "2026-06-07",
            mainEntityOfPage:
              "https://novakou.com/guides/vendre-formation-senegal-2026",
            image: ogImageUrl,
            articleSection: "Guides vendeurs",
            wordCount: 2400,
            inLanguage: "fr",
            about: [
              { "@type": "Thing", name: "Vendre formation en ligne Senegal" },
              { "@type": "Thing", name: "Wave Senegal paiement" },
              { "@type": "Thing", name: "Orange Money formation" },
              { "@type": "Thing", name: "Fiscalite freelance Senegal" },
              { "@type": "Thing", name: "Auto-entrepreneur Senegal formation" },
            ],
          }),
        }}
      />

      {/* ───────────────── JSON-LD : FAQPage ───────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdSafe({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ_ITEMS.map((item) => ({
              "@type": "Question",
              name: item.q,
              acceptedAnswer: { "@type": "Answer", text: item.a },
            })),
          }),
        }}
      />

      {/* ───────────────── JSON-LD : BreadcrumbList ───────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdSafe({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Accueil",
                item: "https://novakou.com/",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Guides",
                item: "https://novakou.com/guides/guide-complet-novakou",
              },
              {
                "@type": "ListItem",
                position: 3,
                name: "Vendre une formation en ligne au Senegal en 2026",
                item: "https://novakou.com/guides/vendre-formation-senegal-2026",
              },
            ],
          }),
        }}
      />
      <CoqueGuide
        ariane={[
          { label: "Accueil", href: "/" },
          { label: "Guides", href: "/guides/guide-complet-novakou" },
          { label: "Vendre formation Senegal 2026" },
        ]}
        eyebrow="Guide Senegal"
        titre={<>Vendre une formation en ligne au{" "} <em>Senegal</em> en 2026 : le guide complet</>}
        sousTitre="Wave, Orange Money, fiscalite auto-entrepreneur, lancement en 30 jours sans budget. Le guide pratique base sur les chiffres reels du marche senegalais et la methode des formateurs qui dechirent en 2026."
        auteur={{
          nom: "Equipe Novakou - Dakar",
          note: "Guides et ressources pour les formateurs africains francophones",
        }}
        infos={[
          { icone: Clock, texte: "14 min de lecture" },
          { icone: CalendarDays, texte: "Publie le 7 juin 2026" },
        ]}
        couverture={{
          src: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80",
          alt: "Formatrice senegalaise enregistrant son cours en ligne depuis Dakar",
        }}
        sommaire={TOC.map((t, i) => ({ id: t.id, label: t.label, n: numeroGuide(i) }))}
        fin={
          <>
            <CarteActionGuide
              titre="Pret a lancer ta boutique de formation au Senegal ?"
              action={{ href: "/inscription", libelle: "Lancer ma boutique Novakou en 3 minutes" }}
              note="0 abonnement - paiements Mobile Money inclus - 0 frais cache."
            >
              <p>Inscription gratuite en 3 minutes. Wave, Orange Money, carte bancaire et MTN MoMo actives par defaut. Ta premiere vente peut tomber des cette semaine.</p>
            </CarteActionGuide>
            <SuiteGuides
              titre="Guides complementaires"
              liens={[
                {
                  href: "/guides/mobile-money-encaisser-paiements",
                  titre: "Encaisser tes paiements en Mobile Money",
                  resume:
                    "Wave, Orange Money, MTN MoMo : tout sur l'encaissement digital en Afrique francophone.",
                },
                {
                  href: "/guides/fixer-prix-formation",
                  titre: "Comment fixer le prix de ta formation",
                  resume:
                    "La methode complete de pricing adaptee au marche africain en FCFA.",
                },
                {
                  href: "/guides/lancement-30-jours",
                  titre: "Plan de lancement en 30 jours",
                  resume:
                    "Le calendrier exact jour par jour pour aller du zero a la premiere cohorte.",
                },
                {
                  href: "/explorer",
                  titre: "Explorer les formations Novakou",
                  resume:
                    "Inspire-toi des meilleures formations vendues sur la plateforme en Afrique francophone.",
                },
              ]}
            />
          </>
        }
      >
        <SectionGuide id="introduction" n={numeroGuide(0)} titre={<>Pourquoi le moment est unique au Senegal</>}>
          <p>
            Le Senegal de 2026 vit une fenetre d&apos;opportunite rare. Avec
            plus de 17 millions d&apos;habitants, une mediane d&apos;age sous
            les 19 ans et un taux d&apos;equipement smartphone estime autour de
            70 pourcent dans les centres urbains, le terrain pour{" "}
            <strong>vendre une formation en ligne au Senegal</strong> n&apos;a
            jamais ete aussi favorable. La 4G couvre l&apos;ensemble du
            territoire urbain, la fibre arrive jusqu&apos;a Saly et Mbour,
            Wave et Orange Money ont normalise le paiement digital.
          </p>
          <p>
            Dans le meme temps, la generation des 18 - 35 ans cherche
            activement a se former : marketing digital, programmation,
            entrepreneuriat, langues etrangeres, beaute, religion. Les ecoles
            classiques sont chers (250 000 a 2 millions FCFA l&apos;annee),
            souvent decalees des realites du marche, et n&apos;offrent ni
            flexibilite horaire ni accompagnement de pair. Ta formation en
            ligne, livree par Mobile Money, accessible depuis un smartphone,
            repond exactement a cette demande.
          </p>
          <p>
            Ce guide te donne la methode integrale : choisir un sujet qui se
            vend a Dakar et en region, encaisser via Wave Senegal, gérer ta
            fiscalite freelance, promouvoir sans budget pub, lancer en 30
            jours et comprendre les revenus realistes. Tout est aligne sur le
            terrain senegalais de 2026, pas sur des recettes copiees du
            marche français.
          </p>

          <Maquette titre="Le marche de la formation digitale au Senegal en 2026">
            <Chiffres
              items={[
                { valeur: "17M+", libelle: "Population senegalaise" },
                { valeur: "~70 %", libelle: "Smartphones (urbain)" },
                { valeur: "19 ans", libelle: "Age median" },
              ]}
              source="Estimations 2026 - sources : ANSD, ARTP, GSMA Intelligence."
            />
          </Maquette>
        </SectionGuide>

        <SectionGuide id="sujets" n={numeroGuide(1)} titre={<>Choisir son sujet - ce qui se vend vraiment au Senegal</>}>
          <p>
            Tous les sujets ne se valent pas a Dakar. Le marche senegalais a
            ses préférences propres, structurees par la demographie jeune, la
            culture entrepreneuriale et la dimension religieuse. Voici les six
            niches qui generent le plus de{" "}
            <strong>vente formation digitale Dakar</strong> en 2026, classees
            par volume de recherche et taux de conversion observes sur
            Novakou.
          </p>

          <h3>
            Marketing digital et e-commerce
          </h3>
          <p>
            La niche n°1 au Senegal. Tout le monde veut apprendre a vendre
            sur Instagram, TikTok, WhatsApp Business. Sujets qui marchent :
            publicite Facebook ciblee Afrique, contenu Reels viral, tunnels
            de vente, copywriting pour vendeurs Dakar.
          </p>

          <h3>
            Programmation et tech
          </h3>
          <p>
            Forte demande mais audience plus exigeante. Les sujets qui se
            vendent : developpement web (HTML/CSS/JavaScript, React), Python
            data, no-code (Bubble, Webflow), creation d&apos;applications
            mobiles. Le talent senegalais cible aussi le freelance
            international en EUR - reel levier de prix.
          </p>

          <h3>
            Business en ligne et freelance
          </h3>
          <p>
            Comment lancer son business depuis zero, comment trouver des
            clients freelance, comment encaisser en devises etrangeres, comment
            structurer son auto-entreprise senegalaise. Ces sujets convertissent
            très bien car le resultat est mesurable.
          </p>

          <h3>
            Beaute, soin de soi et bien-etre
          </h3>
          <p>
            Cheveux afro, ongles, maquillage, soins de la peau noire, perte
            de poids, salle de sport a la maison. Audience massivement
            feminine, très engagee sur Instagram et TikTok. Ticket moyen :
            12 000 a 35 000 FCFA, très bonne recurrence.
          </p>

          <h3>
            Religion et developpement personnel
          </h3>
          <p>
            Apprentissage de la lecture du Coran, tajwid, hadiths, sciences
            islamiques, mais aussi predication chretienne pour les communautes
            minoritaires, developpement personnel inspire de la spiritualite
            locale. Audience très loyale, faible churn.
          </p>

          <h3>
            Langues etrangeres
          </h3>
          <p>
            Anglais business pour expatriation et freelance international,
            arabe litteraire, espagnol (visa et migration), turc, mandarin.
            La diaspora francophone est aussi très demandeuse de cours en
            ligne pour ses enfants. Ticket eleve quand combine avec un
            objectif precis (TOEFL, embauche).
          </p>

          <Maquette titre="Prix moyens observes sur Novakou - Senegal 2026" plein>
            <div className="nka-table-wrap">
              <table className="nka-table">
                <thead>
                  <tr>
                    <th scope="col">Niche</th>
                    <th scope="col">Ticket median</th>
                    <th scope="col">Premium</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { type: "Marketing digital", low: "20 000 FCFA", high: "150 000 FCFA" },
                    { type: "Programmation web", low: "35 000 FCFA", high: "250 000 FCFA" },
                    { type: "Business / freelance", low: "25 000 FCFA", high: "180 000 FCFA" },
                    { type: "Beaute / bien-etre", low: "12 000 FCFA", high: "65 000 FCFA" },
                    { type: "Religion / spiritualite", low: "8 000 FCFA", high: "45 000 FCFA" },
                    { type: "Langues etrangeres", low: "18 000 FCFA", high: "120 000 FCFA" },
                  ].map((row) => (
                    <tr key={row.type}>
                      <th scope="row" className="nka-table__fort">
                        {row.type}
                      </th>
                      <td>{row.low}</td>
                      <td>{row.high}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Maquette>

          <Astuce>
            <strong>Conseil terrain :</strong> Plus le resultat de ta
            formation est concret (decrocher un emploi, obtenir un visa,
            gagner X FCFA par mois, perdre Y kilos), plus ton ticket monte
            haut. Les formations &quot;decouverte&quot; vagues plafonnent
            autour de 15 000 FCFA, les formations &quot;transformation
            mesurable&quot; atteignent 100 000 - 300 000 FCFA.
          </Astuce>
        </SectionGuide>

        <SectionGuide id="paiements" n={numeroGuide(2)} titre={<>Encaisser les paiements - Wave, Orange Money, carte</>}>
          <p>
            C&apos;est la pierre angulaire de ton business. Si ton acheteur
            galere a payer, il abandonne. Au Senegal en 2026, le paiement
            digital est domine par trois canaux qui doivent imperativement
            coexister sur ta page de vente.
          </p>

          <h3>
            Wave Senegal - le n°1
          </h3>
          <p>
            Wave domine Dakar, Thies, Saint-Louis et toutes les villes
            intermediaires. L&apos;application est gratuite, les transferts
            entre particuliers sont quasi sans frais, l&apos;expérience
            utilisateur est moderne. Pour un vendeur de formation, c&apos;est
            le moyen de paiement prefere des moins de 35 ans urbains.
            L&apos;integration{" "}
            <strong>Wave Senegal paiement</strong> sur Novakou est native :
            ton acheteur clique sur &quot;Payer avec Wave&quot;, scanne le QR
            ou saisit son numéro, et la transaction se valide en quelques
            secondes.
          </p>

          <h3>
            Orange Money - couverture rurale et diaspora
          </h3>
          <p>
            Orange Money reste le n°1 historique, particulierement fort en
            zones rurales (Tambacounda, Kolda, Matam) et dans la diaspora
            (Italie, Espagne, France). Les transferts internationaux entrants
            via Orange Money permettent a un cousin parisien d&apos;acheter
            la formation pour son neveu de Saint-Louis en quelques clics.
            Ne neglige jamais{" "}
            <strong>Orange Money formation</strong> comme canal -
            c&apos;est jusqu&apos;a 35 pourcent des paiements selon ta niche.
          </p>

          <h3>
            MTN Mobile Money - secondaire au Senegal
          </h3>
          <p>
            MTN n&apos;est pas operateur natif au Senegal mais ton public
            comprend probablement des acheteurs basés en Cote d&apos;Ivoire,
            au Cameroun ou au Benin. Inclure MTN MoMo elargit naturellement
            ton marche a l&apos;Afrique francophone entiere sans effort
            marketing supplementaire.
          </p>

          <h3>
            Carte bancaire internationale
          </h3>
          <p>
            La diaspora et les acheteurs en Europe utilisent leurs Visa et
            Mastercard. Pour eux, Mobile Money est une friction. La carte
            bancaire est donc indispensable des que tu vises au-dela des
            frontieres senegalaises. Novakou prend en charge les paiements
            carte automatiquement, sans config supplementaire.
          </p>

          <Maquette titre="Repartition typique des paiements - formateur senegalais 2026">
            <Barres
              items={[
                { libelle: "Wave (Senegal urbain)", valeur: "42 %", part: 42 },
                { libelle: "Orange Money (national + diaspora)", valeur: "31 %", part: 31 },
                { libelle: "Carte bancaire (diaspora EU)", valeur: "18 %", part: 18 },
                { libelle: "MTN MoMo (CI, CM, BJ)", valeur: "9 %", part: 9 },
              ]}
            />
          </Maquette>

          <ProAstuce>
            <strong>Pourquoi Novakou integre les trois sans config :</strong>{" "}
            quand tu crees ta boutique{" "}
            <Link href="/inscription">
              sur Novakou
            </Link>
            , Wave, Orange Money et carte bancaire sont actives par defaut.
            Tu n&apos;ouvres aucun compte marchand, aucun contrat, aucune
            API : nous gerons les flux pour toi et te reversons ton solde
            net par cycle. Tu peux te concentrer sur ton contenu et ton
            marketing.
          </ProAstuce>
        </SectionGuide>

        <SectionGuide id="fiscalite" n={numeroGuide(3)} titre={<>Le cadre fiscal du formateur freelance au Senegal</>}>
          <p>
            Vendre une formation en ligne, c&apos;est un revenu, et un
            revenu se declare. Bonne nouvelle : le cadre senegalais a
            beaucoup simplifie les choses pour le freelance digital depuis
            la Loi 2019-04. Voici l&apos;essentiel a savoir sur la{" "}
            <strong>fiscalite freelance Senegal</strong> en 2026.
          </p>

          <h3>
            Le statut auto-entrepreneur senegalais
          </h3>
          <p>
            C&apos;est le statut adapte pour 90 pourcent des formateurs
            digitaux qui demarrent. L&apos;
            <strong>auto-entrepreneur Senegal formation</strong> beneficie
            d&apos;une declaration simplifiee, d&apos;un impot synthetique
            unique remplaçant l&apos;IRPP et la patente, et d&apos;une
            comptabilite allegee. Inscription possible en ligne sur le
            portail DGI ou en agence (avec ta CNI et un justificatif
            d&apos;adresse). Tu obtiens un NINEA et un Registre du Commerce
            simplifie en quelques jours.
          </p>

          <h3>
            Le seuil de 25 millions FCFA
          </h3>
          <p>
            Tant que ton chiffre d&apos;affaires annuel reste sous 25
            millions FCFA (environ 38 000 EUR), tu es :
          </p>
          <ul>
            <li>Exonere de TVA (pas besoin de la facturer ni de la reverser)</li>
            <li>Soumis a l&apos;impot synthetique simplifie (taux progressif)</li>
            <li>Dispense de tenir une comptabilite complete</li>
            <li>Autorise a emettre des factures simplifiees</li>
          </ul>
          <p>
            Au-dela de 25 millions FCFA, tu passes au regime du reel et tu
            dois t&apos;immatriculer a la TVA. A ce stade, un comptable
            devient indispensable.
          </p>

          <h3>
            IRPP simplifie - ce que tu paies vraiment
          </h3>
          <p>
            L&apos;impot synthetique se calcule par tranches. Pour donner
            un ordre d&apos;idee : un formateur qui realise 5 millions FCFA
            de CA annuel paie en general autour de 250 000 a 400 000 FCFA
            d&apos;impot total (selon ses charges deductibles). C&apos;est
            significativement moins que le regime classique de l&apos;IS.
            Reste a payer la CSS (Caisse de Sécurité Sociale) si tu y
            adheres volontairement - fortement conseille pour la protection.
          </p>

          <Attention>
            <strong>Avertissement :</strong> Cet article est purement
            informatif. La fiscalite evolue, ta situation personnelle est
            unique, et un mauvais choix peut couter cher.{" "}
            <strong>
              Consulte imperativement un comptable agree (Ordre des Experts
              Comptables du Senegal) ou un fiscaliste avant de finaliser
              ton statut.
            </strong>{" "}
            Le ticket moyen d&apos;un comptable a Dakar pour le setup
            initial : 50 000 a 150 000 FCFA. Un investissement qui se
            rentabilise des la premiere annee.
          </Attention>
        </SectionGuide>

        <SectionGuide id="promotion" n={numeroGuide(4)} titre={<>Promouvoir ta formation - les canaux qui marchent au Senegal</>}>
          <p>
            Au Senegal, le mix marketing pour vendre une formation digitale
            est radicalement different du marche europeen. Oublie les Ads
            Google ou la newsletter LinkedIn comme canal principal. La
            realite terrain en 2026 :
          </p>

          <h3>
            WhatsApp Business - le canal n°1
          </h3>
          <p>
            Au Senegal, WhatsApp n&apos;est pas une app, c&apos;est
            l&apos;infrastructure sociale. Tes acheteurs y passent 3 a 5
            heures par jour. Trois leviers :
          </p>
          <ul>
            <li>
              <strong>Statuts WhatsApp</strong> quotidiens : temoignages
              clients, micro-conseils, coulisses
            </li>
            <li>
              <strong>Listes de diffusion</strong> segmentees par interet
              (jamais de groupes de spam)
            </li>
            <li>
              <strong>Groupes communautaires</strong> autour de ta niche
              (cuisine, beaute, business)
            </li>
          </ul>
          <p>
            Le guide{" "}
            <Link href="/guides/whatsapp-business-vendre-formations">
              WhatsApp Business pour vendre des formations
            </Link>{" "}
            detaille toute la methode.
          </p>

          <h3>
            Instagram Reels - la generation Z
          </h3>
          <p>
            Pour toucher les 18 - 28 ans urbains, Instagram domine. Les
            Reels (videos courtes 30 - 60s) sont l&apos;algorithme le plus
            genereux en 2026 : un compte de 200 abonnes peut faire 10 000
            vues en quelques jours sur un sujet niche. Vise 3 a 5 Reels par
            semaine, ton de proximite, hashtags localises (#Dakar
            #Senegal227 #FormatricesAfricaines).
          </p>

          <h3>
            TikTok - explosion silencieuse
          </h3>
          <p>
            Sous-utilise par les vendeurs senegalais en 2026, donc enorme
            opportunite. L&apos;algorithme TikTok est le plus accueillant
            pour les debutants : ton premier post peut faire 50 000 vues
            sans abonne. Cible ton contenu sur des micro-niches precises
            (par exemple &quot;comptabilite Senegal pour debutants&quot;
            plutot que &quot;comptabilite&quot;).
          </p>

          <h3>
            LinkedIn - pour les niches B2B et pro
          </h3>
          <p>
            Si ta formation cible des entreprises, des cadres ou des
            freelances qualifies (developpement, finance, RH, conseil),
            LinkedIn est ton terrain. Public plus reduit mais ticket moyen
            beaucoup plus eleve (souvent 75 000 - 300 000 FCFA).
          </p>

          <Attention>
            <strong>Pourquoi pas la pub Facebook au depart :</strong> les
            enchères publicitaires Facebook Ads au Senegal ont monte
            significativement depuis 2024. Pour un freelance debutant sans
            tunnel de vente teste, le ROI est negatif 7 fois sur 10. Reserve
            ce canal pour une phase 2, quand tu as déjà vendu naturellement
            au moins 30 fois et compris ton message qui convertit. Le guide{" "}
            <Link href="/guides/publicite-facebook">
              publicite Facebook pour formations
            </Link>{" "}
            explique quand et comment basculer.
          </Attention>
        </SectionGuide>

        <SectionGuide id="lancement" n={numeroGuide(5)} titre={<>Lancer en 30 jours sans budget - la methode Novakou</>}>
          <p>
            La methode appliquee par les formateurs Novakou qui passent de 0
            a 500 000 FCFA en un mois. Quatre semaines, quatre missions
            claires, zero euro de budget pub.
          </p>

          <Maquette titre="Plan 30 jours pour vendre formation en ligne Senegal">
            <Paliers
              items={[
                {
                  etiquette: "Semaine 1",
                  titre: "Créer le contenu",
                  texte:
                    "3h/jour : structure des modules, enregistrement video au smartphone, montage CapCut. Objectif fin de semaine : 60 % de la formation enregistree.",
                },
                {
                  etiquette: "Semaine 2",
                  titre: "Pre-vente WhatsApp",
                  texte:
                    "Liste de 10 testeurs proches (amis, collegues, contacts WhatsApp). Offre pre-lancement a -50 %. Objectif : 5 pre-ventes payees = validation marche.",
                },
                {
                  etiquette: "Semaine 3",
                  titre: "Lancement public",
                  texte:
                    "Boutique Novakou en ligne. 5 Reels Instagram + 7 stories WhatsApp Business + 1 post LinkedIn. Annonce officielle a ta communaute avec offre limitee 72h.",
                },
                {
                  etiquette: "Semaine 4",
                  titre: "Optimiser et 2eme cohorte",
                  texte:
                    "Analyse des metriques (taux conversion, panier moyen, retours clients). Ajuste prix et page de vente. Relance pour 2eme cohorte avec temoignages de la 1ere.",
                },
              ]}
            />
          </Maquette>

          <p>
            La cle, c&apos;est la semaine 2 : la pre-vente WhatsApp. Si tu
            n&apos;arrives pas a obtenir 5 pre-ventes a tarif preferentiel
            aupres de tes 10 contacts les plus proches, c&apos;est que ton
            offre, ton prix ou ton message ne sont pas alignes. Mieux vaut
            ajuster maintenant que d&apos;investir 3 semaines de production
            dans le vide. Pour aller plus loin, le guide{" "}
            <Link href="/guides/lancement-30-jours">
              lancement 30 jours
            </Link>{" "}
            decortique chaque jour.
          </p>

          <Astuce>
            <strong>Le moment cle :</strong> jour 21 du plan, soit dimanche
            soir / lundi matin de la semaine 3. C&apos;est ce moment precis
            que tu envoies ton message d&apos;ouverture sur tous tes canaux
            en meme temps. La synchronisation cree un effet de masse qui
            declenche les premieres ventes spontanees.
          </Astuce>
        </SectionGuide>

        <SectionGuide id="revenus" n={numeroGuide(6)} titre={<>Combien on peut gagner ? (chiffres reels)</>}>
          <p>
            Soyons concrets. Voici les fourchettes de revenus mensuels nets
            observees chez les formateurs Novakou bases au Senegal en 2026.
            Pas des promesses : la moyenne du terrain, hors top 1 pourcent.
          </p>

          <Maquette titre="Revenus mensuels par niveau - formateur senegalais 2026">
            <Paliers
              items={[
                {
                  titre: "Debutant (0-6 mois)",
                  valeur: "50 000 - 150 000 FCFA",
                  texte:
                    "1 a 5 ventes par semaine, ticket moyen 15 - 25K FCFA. Pas encore d'audience etablie, beaucoup de prospection manuelle WhatsApp.",
                },
                {
                  titre: "Intermediaire (6-18 mois)",
                  valeur: "300 000 - 800 000 FCFA",
                  texte:
                    "Audience Instagram 2K - 10K, sequences email actives, 1 a 3 formations dans le catalogue, debut de recurrence (communaute privee).",
                },
                {
                  titre: "Avance (1.5 ans+)",
                  valeur: "1 500 000 - 5 000 000 FCFA+",
                  texte:
                    "Catalogue de 4 a 8 produits, tunnel de vente automatise, programme d'affiliation actif, 1 a 2 lancements signature par an. Vrais entrepreneurs.",
                },
              ]}
            />
          </Maquette>

          <h3>
            Cas pratique - Awa Diop, 27 ans, formatrice marketing digital
          </h3>
          <p>
            Awa habite a Mermoz, Dakar. Diplomee de Sup&apos;Imax, elle a
            travaille 3 ans en agence digitale avant de basculer formatrice
            en mars 2026. Son catalogue : une formation cle &quot;Lancer ton
            business Instagram en Afrique francophone&quot; a 35 000 FCFA,
            un ebook a 9 000 FCFA, une communaute WhatsApp Premium a 5 000
            FCFA/mois.
          </p>
          <p>
            En septembre 2026, son chiffre d&apos;affaires mensuel atteint
            1 230 000 FCFA. Repartition : 65 pourcent ventes de la formation
            principale, 18 pourcent ebook (souvent upsell), 17 pourcent
            abonnements communaute. Après impot synthetique et commissions
            Novakou, il lui reste environ 950 000 FCFA nets - presque 3 fois
            son salaire d&apos;agence precedent, pour 25 heures de travail
            hebdomadaires. Profil fictif mais entierement aligne sur les
            metriques observees.
          </p>

          <ProAstuce>
            <strong>Le secret du passage 300K → 1M FCFA :</strong>{" "}
            construire un catalogue. Une seule formation, meme excellente,
            plafonne. Ajoute un ebook d&apos;entree de gamme (9 - 12K FCFA),
            un upsell premium (coaching individuel 75 - 150K FCFA), une
            communaute privee recurrente (5 - 15K FCFA/mois). Le panier moyen
            double souvent, sans effort marketing supplementaire. Le guide{" "}
            <Link href="/guides/scaler-catalogue-produits">
              scaler ton catalogue de produits
            </Link>{" "}
            explique la sequence exacte.
          </ProAstuce>
        </SectionGuide>

        <SectionGuide id="faq" n={numeroGuide(7)} titre={<>FAQ - les questions qu&apos;on me pose tout le temps</>}>
          <p>
            Les huit questions qui reviennent en boucle dans les DMs
            Instagram et les WhatsApp de l&apos;equipe Novakou Dakar.
          </p>

          <Accordeon items={FAQ_ITEMS.map((f) => ({ q: f.q, a: f.a }))} />
        </SectionGuide>
      </CoqueGuide>
    </>
  );
}
