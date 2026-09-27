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

const OG_TITLE = "Vendre une formation en ligne au Benin en 2026";
const OG_SUBTITLE = "Le guide complet : MTN MoMo, Moov Money, Celtiis Cash, fiscalite, lancement 30 jours";

export const metadata: Metadata = {
  // Title sans "| Novakou" — le template root l'ajoute automatiquement.
  title: "Vendre une formation au Bénin en 2026 — Guide complet",
  description:
    "Le guide pratique pour vendre formation en ligne Benin en 2026 : MTN MoMo, Moov Money, Celtiis Cash, fiscalite micro-entreprise, lancement 30 jours et chiffres reels du marche cotonois.",
  openGraph: {
    title:
      "Vendre une formation en ligne au Benin en 2026 | Guide Novakou",
    description:
      "MTN MoMo, Moov Money, Celtiis Cash, fiscalite auto-entrepreneur, methode 30 jours : tout pour vendre ta formation digitale au Benin.",
    type: "article",
    images: [
      `/api/og?type=guide&title=${encodeURIComponent(OG_TITLE)}&subtitle=${encodeURIComponent(OG_SUBTITLE)}`,
    ],
  },
  alternates: {
    canonical: "/guides/vendre-formation-benin-2026",
  },
};

/* ─── Table of Contents data ──────────────────────────────── */
const TOC = [
  { id: "introduction", label: "Pourquoi vendre une formation au Benin en 2026" },
  { id: "sujets", label: "Choisir son sujet - ce qui se vend vraiment" },
  { id: "paiements", label: "Encaisser - MTN MoMo, Moov Money, Celtiis Cash" },
  { id: "fiscalite", label: "Le cadre fiscal du formateur freelance" },
  { id: "promotion", label: "Promouvoir ta formation - les canaux qui marchent" },
  { id: "lancement", label: "Lancer en 30 jours sans budget" },
  { id: "revenus", label: "Combien on peut gagner ? (chiffres reels)" },
  { id: "faq", label: "FAQ - les questions qu'on me pose tout le temps" },
] as const;

/* ─── FAQ data (utilisee pour le rendu ET le JSON-LD) ─────── */
const FAQ_ITEMS = [
  {
    q: "Faut-il un compte bancaire pour vendre une formation au Benin ?",
    a: "Non. Au Benin en 2026, un compte MTN MoMo, Moov Money ou Celtiis Cash suffit largement pour commencer. Novakou verse directement tes gains sur ton numéro Mobile Money beninois. Le compte bancaire devient utile a partir d'environ 500 000 FCFA de chiffre d'affaires mensuel, quand tu veux ouvrir un compte pro a Bank of Africa, Ecobank Benin, NSIA Banque ou BSIC pour structurer ta tresorerie.",
  },
  {
    q: "Quel est le prix moyen d'une formation vendue au Benin ?",
    a: "Le ticket median sur le marche beninois en 2026 se situe entre 12 000 et 30 000 FCFA pour une formation de 3 a 6 heures. Les formations premium (avec coaching, communaute privee, certificat) montent a 60 000 - 180 000 FCFA. Les mini-formations express (1h - 2h) se vendent autour de 4 500 - 10 000 FCFA. Plus le resultat est concret (decrocher un emploi, monter son business, obtenir un visa), plus tu peux monter en prix - la diaspora beninoise en France paie sans hesiter 75 000 FCFA pour une formation transformante.",
  },
  {
    q: "Est-ce que je dois declarer mes revenus a la DGI Benin ?",
    a: "Oui, des le premier FCFA encaisse. Le statut le plus simple au Benin en 2026 est celui d'entreprise individuelle au regime du forfait (TPS - Taxe Professionnelle Synthetique). Tu te declares en ligne sur le portail e-services DGI ou en agence DGID, tu obtiens un IFU (Identifiant Fiscal Unique), et tu paies un impot synthetique. Tant que ton CA reste sous le seuil de 30 millions FCFA annuels, le forfait est avantageux. Cet article est informatif - consulte un expert-comptable agree (ONECCA Benin) pour ta situation precise.",
  },
  {
    q: "MTN MoMo ou Moov Money, lequel choisir pour encaisser au Benin ?",
    a: "Les deux, sans hesiter. MTN MoMo domine Cotonou, Porto-Novo et Abomey-Calavi (frais bas, app moderne, base utilisateurs massive). Moov Money est très fort dans le nord (Parakou, Natitingou, Djougou) et dans les villes secondaires. Celtiis Cash (operateur Celtiis lance 2024) gagne du terrain chez les 18-30 ans urbains. Novakou integre les trois par defaut : ton acheteur choisit, tu encaisses sur ton numéro prefere. Refuser un operateur, c'est se priver d'environ 25 a 35 pourcent du marche beninois.",
  },
  {
    q: "Combien de temps avant ma premiere vente au Benin ? 🤔",
    a: "Avec la methode 30 jours decrite plus haut : entre 14 et 21 jours pour la premiere vente si tu as déjà une petite audience WhatsApp (50 - 200 contacts) a Cotonou ou en region. Sans audience, compte 45 a 60 jours - le temps de construire 500 abonnes Instagram ou TikTok. Les formateurs beninois qui vont le plus vite sont ceux qui pre-vendent dans leur entourage immediat (eglise, mosquee, ecole, association de quartier).",
  },
  {
    q: "Faut-il un site web pour vendre une formation au Benin ?",
    a: "Non, plus en 2026. Ta boutique Novakou (novakou.com/ton-pseudo) fait déjà office de site : page de vente, paiement, livraison automatique, espace eleve. 80 pourcent des vendeurs beninois sur Novakou ne possedent aucun site separe. Le seul cas ou un site dedie devient utile : si tu veux ranker sur Google avec du SEO de fond (blog, articles longs), mais cela vient plus tard quand ton catalogue depasse 3 a 4 produits.",
  },
  {
    q: "Puis-je vendre une formation depuis Porto-Novo, Parakou ou Abomey ?",
    a: "Bien sur. La vente de formation en ligne au Benin n'est pas reservee a Cotonou. Avec une connexion 4G correcte (MTN ou Moov), un smartphone recent et un micro-cravate a 5 000 FCFA, tu produis la meme qualité qu'aux Cocotiers. Plusieurs formateurs Novakou bases a Porto-Novo, Parakou ou Bohicon depassent 700 000 FCFA mensuels - leur avantage : couts de vie plus bas qu'a Cotonou, donc rentabilite nette superieure.",
  },
  {
    q: "Comment eviter que ma formation soit piratee et partagee gratuitement ? 🔒",
    a: "Le risque zero n'existe pas, mais Novakou applique : streaming protege (videos non telechargeables), filigrane dynamique avec le mail de l'acheteur, lien personnalise par compte, blocage automatique si plusieurs IP simultanees. Reste vigilant sur Telegram et WhatsApp ou des groupes de revente existent au Benin comme partout. La meilleure defense reste un service inclus (coaching, replays a jour, communaute WhatsApp privee) que le pirate ne peut pas copier.",
  },
] as const;


/* ═════════════════════════════════════════════════════════════ */
/* PAGE                                                         */
/* ═════════════════════════════════════════════════════════════ */

export default function VendreFormationBeninPage() {
  const ogImageUrl = `https://novakou.com/api/og?type=guide&title=${encodeURIComponent(OG_TITLE)}&subtitle=${encodeURIComponent(OG_SUBTITLE)}`;

  return (
    <>
      {/* ───────────────── JSON-LD : Article ───────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline:
              "Vendre une formation en ligne au Benin en 2026 : le guide complet",
            description:
              "Le guide pratique pour vendre une formation en ligne au Benin en 2026 : MTN MoMo, Moov Money, Celtiis Cash, fiscalite micro-entreprise, lancement 30 jours et chiffres reels.",
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
              "https://novakou.com/guides/vendre-formation-benin-2026",
            image: ogImageUrl,
            articleSection: "Guides vendeurs",
            wordCount: 2400,
            inLanguage: "fr",
            about: [
              { "@type": "Thing", name: "Vendre formation en ligne Benin" },
              { "@type": "Thing", name: "MTN MoMo Benin paiement" },
              { "@type": "Thing", name: "Moov Money Benin formation" },
              { "@type": "Thing", name: "Celtiis Cash Benin" },
              { "@type": "Thing", name: "Auto-entrepreneur Benin micro-entreprise" },
            ],
          }),
        }}
      />

      {/* ───────────────── JSON-LD : FAQPage ───────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
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
          __html: JSON.stringify({
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
                name: "Vendre une formation en ligne au Benin en 2026",
                item: "https://novakou.com/guides/vendre-formation-benin-2026",
              },
            ],
          }),
        }}
      />
      <CoqueGuide
        ariane={[
          { label: "Accueil", href: "/" },
          { label: "Guides", href: "/guides/guide-complet-novakou" },
          { label: "Vendre formation Benin 2026" },
        ]}
        eyebrow="Guide Benin"
        titre={<>Vendre une formation en ligne au{" "} <em>Benin</em> en 2026 : le guide complet</>}
        sousTitre="MTN MoMo, Moov Money, Celtiis Cash, fiscalite micro-entreprise, lancement en 30 jours sans budget. Le guide pratique base sur les chiffres reels du marche beninois et la methode des formateurs qui dechirent depuis Cotonou en 2026."
        auteur={{
          nom: "Equipe Novakou - Cotonou",
          note: "Guides et ressources pour les formateurs africains francophones",
        }}
        infos={[
          { icone: Clock, texte: "14 min de lecture" },
          { icone: CalendarDays, texte: "Publie le 7 juin 2026" },
        ]}
        couverture={{
          src: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80",
          alt: "Formateur beninois enregistrant son cours en ligne depuis Cotonou",
        }}
        sommaire={TOC.map((t, i) => ({ id: t.id, label: t.label, n: numeroGuide(i) }))}
        fin={
          <>
            <CarteActionGuide
              titre="Pret a lancer ta boutique de formation au Benin ?"
              action={{ href: "/inscription", libelle: "Lancer ma boutique Novakou en 3 minutes" }}
              note="0 abonnement - paiements Mobile Money inclus - 0 frais cache."
            >
              <p>Inscription gratuite en 3 minutes. MTN MoMo, Moov Money, Celtiis Cash et carte bancaire actives par defaut. Ta premiere vente peut tomber des cette semaine.</p>
            </CarteActionGuide>
            <SuiteGuides
              titre="Guides complementaires"
              liens={[
                {
                  href: "/guides/mobile-money-encaisser-paiements",
                  titre: "Encaisser tes paiements en Mobile Money",
                  resume:
                    "MTN MoMo, Moov Money, Wave, Orange Money : tout sur l'encaissement digital en Afrique francophone.",
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
        <SectionGuide id="introduction" n={numeroGuide(0)} titre={<>Pourquoi le moment est unique au Benin</>}>
          <p>
            Le Benin de 2026 vit une fenetre d&apos;opportunite reelle. Avec
            plus de 13 millions d&apos;habitants, une jeunesse massive (mediane
            d&apos;age sous les 18 ans), un taux d&apos;equipement smartphone
            qui depasse 60 pourcent dans les centres urbains (Cotonou,
            Porto-Novo, Parakou, Abomey-Calavi), le terrain pour{" "}
            <strong>vendre une formation en ligne au Benin</strong> n&apos;a
            jamais ete aussi favorable. La 4G couvre l&apos;ensemble du
            territoire urbain, la fibre arrive jusqu&apos;a Calavi et Seme-Podji,
            MTN MoMo et Moov Money ont normalise le paiement digital quotidien.
          </p>
          <p>
            Dans le meme temps, la generation des 18 - 35 ans beninoise cherche
            activement a se former : marketing digital, programmation,
            entrepreneuriat, langues etrangeres, immigration, beaute, religion.
            Les ecoles superieures classiques restent cheres (350 000 a 2
            millions FCFA l&apos;annee), souvent decalees des realites du marche,
            et n&apos;offrent ni flexibilite horaire ni accompagnement de pair.
            Ta formation en ligne, livree par Mobile Money, accessible depuis
            un smartphone Android d&apos;entree de gamme, repond exactement a
            cette demande.
          </p>
          <p>
            Avec Sème City (le campus tech-savoir-faire), Etrilabs, le CIPCRE
            et une diaspora beninoise structuree en France, en Belgique et au
            Canada, le pays a déjà un ecosysteme digital qui ne demande
            qu&apos;a accueillir ton expertise. Ce guide te donne la methode
            integrale : choisir un sujet qui se vend a Cotonou et en region,
            encaisser via MTN MoMo Benin, gérer ta fiscalite micro-entreprise,
            promouvoir sans budget pub, lancer en 30 jours et comprendre les
            revenus realistes. Tout est aligne sur le terrain beninois de 2026,
            pas sur des recettes copiees du marche français ou ivoirien.
          </p>

          <Maquette titre="Le marche de la formation digitale au Benin en 2026">
            <Chiffres
              items={[
                { valeur: "13M+", libelle: "Population beninoise" },
                { valeur: "~62 %", libelle: "Smartphones (urbain)" },
                { valeur: "18 ans", libelle: "Age median" },
              ]}
              source="Estimations 2026 - sources : INSAE, ARCEP Benin, GSMA Intelligence."
            />
          </Maquette>
        </SectionGuide>

        <SectionGuide id="sujets" n={numeroGuide(1)} titre={<>Choisir son sujet - ce qui se vend vraiment au Benin</>}>
          <p>
            Tous les sujets ne se valent pas a Cotonou. Le marche beninois a
            ses préférences propres, structurees par la demographie jeune, la
            culture entrepreneuriale très active (le Benin est un hub portuaire
            ouest-africain), la dimension religieuse plurielle (christianisme,
            islam, vodun) et la diaspora structuree. Voici les six niches qui
            generent le plus de{" "}
            <strong>vente formation digitale Cotonou</strong> en 2026, classees
            par volume de recherche et taux de conversion observes sur Novakou.
          </p>

          <h3>
            Marketing digital et e-commerce
          </h3>
          <p>
            La niche n°1 au Benin. Tout le monde veut apprendre a vendre sur
            Instagram, TikTok, WhatsApp Business. Sujets qui marchent :
            publicite Facebook ciblee Benin, contenu Reels viral, tunnels de
            vente, copywriting pour vendeuses de Dantokpa, e-commerce
            import-export Cotonou-Lagos. Le port autonome de Cotonou cree une
            demande naturelle d&apos;outils numeriques pour l&apos;import.
          </p>

          <h3>
            Immigration, visas et expatriation
          </h3>
          <p>
            Niche en explosion au Benin en 2026. Avec une diaspora massive en
            France, au Canada (Quebec surtout), en Belgique et en Allemagne,
            les sujets &quot;preparer son dossier Campus France&quot;,
            &quot;immigrer au Canada via le PEQ&quot;, &quot;obtenir un visa
            etudiant Allemagne&quot; cartonnent. Ticket moyen eleve (45 000 -
            150 000 FCFA) car le ROI est evident pour l&apos;apprenant.
          </p>

          <h3>
            Programmation et tech
          </h3>
          <p>
            Forte demande grace a Sème City et a l&apos;ecosysteme tech beninois
            (Etrilabs, BeninExcellence). Les sujets qui se vendent :
            developpement web (HTML/CSS/JavaScript, React, Next.js), Python
            data, no-code (Bubble, Webflow), creation d&apos;applications
            mobiles Flutter. Le talent beninois cible aussi le freelance
            international en EUR via Upwork et Malt - reel levier de prix.
          </p>

          <h3>
            Business en ligne et freelance
          </h3>
          <p>
            Comment lancer son business depuis zero, comment trouver des
            clients freelance internationaux, comment encaisser en devises
            etrangeres via Wise ou Payoneer, comment structurer son entreprise
            individuelle beninoise. Ces sujets convertissent très bien car le
            resultat est mesurable - et la jeunesse beninoise est très
            entrepreneuriale par culture.
          </p>

          <h3>
            Beaute, soin de soi et bien-etre
          </h3>
          <p>
            Cheveux afro, ongles, maquillage, soins de la peau noire,
            melanotique, fabrication de cosmetiques naturels (karite, neem),
            perte de poids, salle de sport a la maison. Audience massivement
            feminine, très engagee sur Instagram et TikTok. Ticket moyen :
            10 000 a 30 000 FCFA, très bonne recurrence et upsell vers
            coaching individuel.
          </p>

          <h3>
            Langues etrangeres et soft skills
          </h3>
          <p>
            Anglais business pour expatriation et freelance international,
            allemand (visa etudiant Allemagne), espagnol, mandarin (lien avec
            le commerce Cotonou-Asie). La diaspora francophone beninoise est
            aussi très demandeuse de cours d&apos;anglais en ligne pour ses
            enfants. Ticket eleve quand combine avec un objectif precis (TOEFL,
            DELE, embauche internationale).
          </p>

          <Maquette titre="Prix moyens observes sur Novakou - Benin 2026" plein>
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
                    { type: "Marketing digital", low: "18 000 FCFA", high: "140 000 FCFA" },
                    { type: "Immigration / visa", low: "45 000 FCFA", high: "180 000 FCFA" },
                    { type: "Programmation web", low: "30 000 FCFA", high: "230 000 FCFA" },
                    { type: "Business / freelance", low: "22 000 FCFA", high: "170 000 FCFA" },
                    { type: "Beaute / bien-etre", low: "10 000 FCFA", high: "60 000 FCFA" },
                    { type: "Langues etrangeres", low: "15 000 FCFA", high: "110 000 FCFA" },
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
            <strong>Conseil terrain :</strong> Plus le resultat de ta formation
            est concret (decrocher un emploi, obtenir un visa Campus France ou
            Canada, gagner X FCFA par mois, perdre Y kilos), plus ton ticket
            monte haut. Les formations &quot;decouverte&quot; vagues plafonnent
            autour de 12 000 FCFA, les formations &quot;transformation
            mesurable&quot; atteignent 80 000 - 250 000 FCFA - et la diaspora
            beninoise paie volontiers ce ticket.
          </Astuce>
        </SectionGuide>

        <SectionGuide id="paiements" n={numeroGuide(2)} titre={<>Encaisser les paiements - MTN MoMo, Moov Money, Celtiis Cash</>}>
          <p>
            C&apos;est la pierre angulaire de ton business. Si ton acheteur
            beninois galere a payer, il abandonne. Au Benin en 2026, le paiement
            digital est domine par trois canaux Mobile Money plus la carte
            bancaire pour la diaspora. Tous doivent imperativement coexister
            sur ta page de vente.
          </p>

          <h3>
            MTN MoMo Benin - le n°1
          </h3>
          <p>
            MTN MoMo Benin domine Cotonou, Porto-Novo, Abomey-Calavi, Ouidah et
            toutes les villes du sud. L&apos;application est gratuite, les
            transferts entre particuliers sont quasi sans frais, l&apos;expérience
            utilisateur est moderne. Pour un vendeur de formation, c&apos;est
            le moyen de paiement prefere des moins de 35 ans urbains beninois.
            L&apos;integration{" "}
            <strong>MTN MoMo Benin paiement</strong> sur Novakou est native :
            ton acheteur clique sur &quot;Payer avec MTN MoMo&quot;, scanne le
            QR ou saisit son numéro, valide avec son code PIN MoMo, et la
            transaction se boucle en quelques secondes.
          </p>

          <h3>
            Moov Money Benin - couverture nord et villes secondaires
          </h3>
          <p>
            Moov Money reste très fort dans le nord du pays (Parakou, Djougou,
            Natitingou, Kandi) et dans les villes secondaires ou Moov a une
            meilleure couverture reseau que MTN. Les transferts internationaux
            entrants via Moov Money permettent aussi a un membre de la diaspora
            a Lome ou Niamey d&apos;acheter ta formation pour son cousin de
            Bohicon en quelques clics. Ne neglige jamais{" "}
            <strong>Moov Money Benin formation</strong> comme canal -
            c&apos;est jusqu&apos;a 30 pourcent des paiements selon ta niche.
          </p>

          <h3>
            Celtiis Cash - l&apos;entrant qui monte
          </h3>
          <p>
            Lance plus recemment par Celtiis (operateur public beninois),{" "}
            <strong>Celtiis Cash Benin</strong> gagne du terrain rapidement,
            particulierement chez les fonctionnaires et chez la jeunesse
            urbaine. L&apos;offre tarifaire est competitive et l&apos;Etat
            beninois pousse son adoption. L&apos;inclure dans ta page de vente
            montre que tu es a jour - c&apos;est un signal de modernite qui
            rassure ton acheteur, meme si le volume actuel reste secondaire.
          </p>

          <h3>
            Carte bancaire internationale
          </h3>
          <p>
            La diaspora beninoise (France, Belgique, Canada, USA) utilise ses
            Visa et Mastercard. Pour eux, Mobile Money est une friction (il
            faudrait ouvrir un compte au Benin). La carte bancaire est donc
            indispensable des que tu vises au-dela des frontieres beninoises -
            et la diaspora represente souvent 20 a 30 pourcent du CA d&apos;un
            formateur beninois etabli. Novakou prend en charge les paiements
            carte automatiquement, sans config supplementaire.
          </p>

          <Maquette titre="Repartition typique des paiements - formateur beninois 2026">
            <Barres
              items={[
                { libelle: "MTN MoMo (Benin urbain)", valeur: "44 %", part: 44 },
                { libelle: "Moov Money (national + nord)", valeur: "26 %", part: 26 },
                { libelle: "Carte bancaire (diaspora EU/CA)", valeur: "21 %", part: 21 },
                { libelle: "Celtiis Cash (jeunesse urbaine)", valeur: "9 %", part: 9 },
              ]}
            />
          </Maquette>

          <ProAstuce>
            <strong>Pourquoi Novakou integre les trois sans config :</strong>{" "}
            quand tu crees ta boutique{" "}
            <Link href="/inscription">
              sur Novakou
            </Link>
            , MTN MoMo, Moov Money, Celtiis Cash et carte bancaire sont actives
            par defaut. Tu n&apos;ouvres aucun compte marchand, aucun contrat,
            aucune API : nous gerons les flux pour toi et te reversons ton
            solde net par cycle. Tu peux te concentrer sur ton contenu et ton
            marketing. Pour aller plus loin, voir le guide{" "}
            <Link href="/guides/mobile-money-encaisser-paiements">
              encaisser tes paiements en Mobile Money
            </Link>
            .
          </ProAstuce>
        </SectionGuide>

        <SectionGuide id="fiscalite" n={numeroGuide(3)} titre={<>Le cadre fiscal du formateur freelance au Benin</>}>
          <p>
            Vendre une formation en ligne, c&apos;est un revenu, et un revenu
            se declare. Bonne nouvelle : le cadre beninois a beaucoup simplifie
            les choses pour le freelance digital depuis la mise en place de la
            Taxe Professionnelle Synthetique (TPS). Voici l&apos;essentiel a
            savoir sur la{" "}
            <strong>fiscalite freelance Benin</strong> en 2026.
          </p>

          <h3>
            L&apos;entreprise individuelle au regime du forfait
          </h3>
          <p>
            C&apos;est le statut adapte pour 90 pourcent des formateurs
            digitaux beninois qui demarrent. L&apos;
            <strong>auto-entrepreneur Benin micro-entreprise</strong> beneficie
            d&apos;une declaration simplifiee, de la TPS qui remplace la
            patente et plusieurs taxes locales, et d&apos;une comptabilite
            allegee. Inscription possible en ligne sur le portail e-services
            de la DGI (impots.bj) ou en agence DGID (avec ta CNI ou ton
            passeport et un justificatif d&apos;adresse). Tu obtiens un IFU
            (Identifiant Fiscal Unique) et un Registre du Commerce simplifie en
            quelques jours via l&apos;APIEX ou directement au Tribunal de
            commerce.
          </p>

          <h3>
            Le seuil de 30 millions FCFA
          </h3>
          <p>
            Tant que ton chiffre d&apos;affaires annuel reste sous 30 millions
            FCFA (environ 45 700 EUR), tu es :
          </p>
          <ul>
            <li>Exonere de TVA (pas besoin de la facturer ni de la reverser)</li>
            <li>Soumis a la TPS (Taxe Professionnelle Synthetique)</li>
            <li>Dispense de tenir une comptabilite complete</li>
            <li>Autorise a emettre des factures simplifiees</li>
          </ul>
          <p>
            Au-dela de 30 millions FCFA, tu passes au regime du reel simplifie
            (RRS) puis au regime du reel normal (RRN). A ce stade, un expert-
            comptable inscrit a l&apos;ONECCA Benin devient indispensable pour
            gérer ta TVA, ta CGA et ton IS.
          </p>

          <h3>
            TPS - ce que tu paies vraiment
          </h3>
          <p>
            La Taxe Professionnelle Synthetique se calcule par tranches en
            fonction de ton chiffre d&apos;affaires annuel declare. Pour donner
            un ordre d&apos;idee : un formateur beninois qui realise 5 millions
            FCFA de CA annuel paie en general autour de 200 000 a 350 000 FCFA
            d&apos;impot total (selon ses charges deductibles et sa commune).
            C&apos;est significativement moins que le regime classique de
            l&apos;IS et de la patente cumules. Reste a payer les cotisations
            CNSS Benin si tu y adheres volontairement - fortement conseille
            pour ta retraite et ta couverture sociale.
          </p>

          <Attention>
            <strong>Avertissement :</strong> Cet article est purement informatif.
            La fiscalite beninoise evolue (reforme DGI en cours), ta situation
            personnelle est unique, et un mauvais choix peut couter cher.{" "}
            <strong>
              Consulte imperativement un expert-comptable agree (ONECCA Benin)
              ou un fiscaliste avant de finaliser ton statut.
            </strong>{" "}
            Le ticket moyen d&apos;un comptable a Cotonou pour le setup
            initial : 60 000 a 175 000 FCFA. Un investissement qui se
            rentabilise des la premiere annee fiscale, surtout pour optimiser
            la deduction de tes charges (materiel video, abonnements logiciels,
            internet).
          </Attention>
        </SectionGuide>

        <SectionGuide id="promotion" n={numeroGuide(4)} titre={<>Promouvoir ta formation - les canaux qui marchent au Benin</>}>
          <p>
            Au Benin, le mix marketing pour vendre une formation digitale est
            radicalement different du marche europeen. Oublie Google Ads ou la
            newsletter LinkedIn comme canal principal au demarrage. La realite
            terrain en 2026 :
          </p>

          <h3>
            WhatsApp Business - le canal n°1
          </h3>
          <p>
            Au Benin, WhatsApp n&apos;est pas une app, c&apos;est
            l&apos;infrastructure sociale. Tes acheteurs y passent 3 a 5 heures
            par jour. Trois leviers :
          </p>
          <ul>
            <li>
              <strong>Statuts WhatsApp</strong> quotidiens : temoignages
              clients, micro-conseils, coulisses de ta semaine
            </li>
            <li>
              <strong>Listes de diffusion</strong> segmentees par interet
              (jamais de groupes de spam)
            </li>
            <li>
              <strong>Groupes communautaires</strong> autour de ta niche
              (immigration, beaute, business, religion)
            </li>
          </ul>
          <p>
            Le guide{" "}
            <Link href="/guides/whatsapp-business-vendre-formations">
              WhatsApp Business pour vendre des formations
            </Link>{" "}
            detaille toute la methode adaptee a l&apos;Afrique francophone.
          </p>

          <h3>
            Instagram Reels - la generation Z beninoise
          </h3>
          <p>
            Pour toucher les 18 - 28 ans urbains de Cotonou et Porto-Novo,
            Instagram domine. Les Reels (videos courtes 30 - 60s) sont
            l&apos;algorithme le plus genereux en 2026 : un compte de 200
            abonnes peut faire 10 000 vues en quelques jours sur un sujet
            niche. Vise 3 a 5 Reels par semaine, ton de proximite, hashtags
            localises (#Cotonou #Benin229 #FormatricesBeninoises #SemeCity).
          </p>

          <h3>
            TikTok - explosion silencieuse au Benin
          </h3>
          <p>
            Sous-utilise par les vendeurs beninois de formation en 2026, donc
            enorme opportunite. L&apos;algorithme TikTok est le plus accueillant
            pour les debutants : ton premier post peut faire 50 000 vues sans
            aucun abonne. Cible ton contenu sur des micro-niches precises (par
            exemple &quot;visa Canada PEQ depuis Cotonou&quot; plutot que
            &quot;immigration&quot;). Le guide{" "}
            <Link href="/guides/tiktok-reels-vendre-formations">
              TikTok et Reels pour vendre des formations
            </Link>{" "}
            decortique la mecanique.
          </p>

          <h3>
            LinkedIn - pour les niches B2B et pro
          </h3>
          <p>
            Si ta formation cible des entreprises beninoises, des cadres ou
            des freelances qualifies (developpement, finance, RH, conseil),
            LinkedIn est ton terrain. Public plus reduit mais ticket moyen
            beaucoup plus eleve (souvent 60 000 - 280 000 FCFA). La diaspora
            beninoise active sur LinkedIn (Paris, Bruxelles, Montreal) achete
            aussi pour ses parents restes au pays.
          </p>

          <h3>
            Facebook - encore puissant au Benin
          </h3>
          <p>
            Contrairement a la France, Facebook reste très utilise au Benin
            (notamment via Facebook Lite). Les groupes Facebook locaux (par
            ville, par profession, par sujet) sont des mines d&apos;or pour
            le bouche-a-oreille. Publie de la valeur reelle dans 5-10 groupes
            alignes a ta niche, sans spam direct - les ventes viennent en DM.
          </p>

          <Attention>
            <strong>Pourquoi pas la pub Facebook au depart :</strong> les
            encheres publicitaires Facebook Ads au Benin ont monte
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
            La methode appliquee par les formateurs Novakou beninois qui passent
            de 0 a 450 000 FCFA en un mois. Quatre semaines, quatre missions
            claires, zero franc CFA de budget pub.
          </p>

          <Maquette titre="Plan 30 jours pour vendre formation en ligne Benin">
            <Paliers
              items={[
                {
                  etiquette: "Semaine 1",
                  titre: "Créer le contenu",
                  texte:
                    "3h/jour : structure des modules, enregistrement video au smartphone (Galaxy A ou iPhone d'occasion), montage CapCut. Objectif fin de semaine : 60 % de la formation enregistree.",
                },
                {
                  etiquette: "Semaine 2",
                  titre: "Pre-vente WhatsApp",
                  texte:
                    "Liste de 10 testeurs proches (amis, collegues, contacts WhatsApp Cotonou ou diaspora). Offre pre-lancement a -50 %. Objectif : 5 pre-ventes payees via MTN MoMo = validation marche.",
                },
                {
                  etiquette: "Semaine 3",
                  titre: "Lancement public",
                  texte:
                    "Boutique Novakou en ligne. 5 Reels Instagram + 7 stories WhatsApp Business + 1 post LinkedIn + 3 posts groupes Facebook Benin. Annonce officielle a ta communaute avec offre limitee 72h.",
                },
                {
                  etiquette: "Semaine 4",
                  titre: "Optimiser et 2eme cohorte",
                  texte:
                    "Analyse des metriques (taux conversion, panier moyen, retours clients). Ajuste prix et page de vente. Relance pour 2eme cohorte avec temoignages video de la 1ere - massif effet de preuve sociale.",
                },
              ]}
            />
          </Maquette>

          <p>
            La cle, c&apos;est la semaine 2 : la pre-vente WhatsApp. Si tu
            n&apos;arrives pas a obtenir 5 pre-ventes a tarif preferentiel
            aupres de tes 10 contacts les plus proches a Cotonou ou
            Porto-Novo, c&apos;est que ton offre, ton prix ou ton message ne
            sont pas alignes au marche beninois. Mieux vaut ajuster maintenant
            que d&apos;investir 3 semaines de production dans le vide. Pour
            aller plus loin, le guide{" "}
            <Link href="/guides/lancement-30-jours">
              lancement 30 jours
            </Link>{" "}
            decortique chaque jour.
          </p>

          <Astuce>
            <strong>Le moment cle :</strong> jour 21 du plan, soit dimanche
            soir / lundi matin de la semaine 3. C&apos;est ce moment precis
            que tu envoies ton message d&apos;ouverture sur tous tes canaux
            en meme temps (WhatsApp, Instagram, Facebook, LinkedIn). La
            synchronisation cree un effet de masse qui declenche les premieres
            ventes spontanees, et les statuts WhatsApp de tes amis qui
            relaient amplifient l&apos;onde.
          </Astuce>
        </SectionGuide>

        <SectionGuide id="revenus" n={numeroGuide(6)} titre={<>Combien on peut gagner ? (chiffres reels)</>}>
          <p>
            Soyons concrets. Voici les fourchettes de revenus mensuels nets
            observees chez les formateurs Novakou bases au Benin en 2026.
            Pas des promesses : la moyenne du terrain, hors top 1 pourcent.
          </p>

          <Maquette titre="Revenus mensuels par niveau - formateur beninois 2026">
            <Paliers
              items={[
                {
                  titre: "Debutant (0-6 mois)",
                  valeur: "50 000 - 200 000 FCFA",
                  texte:
                    "1 a 5 ventes par semaine, ticket moyen 12 - 25K FCFA. Pas encore d'audience etablie, beaucoup de prospection manuelle WhatsApp Cotonou + entourage proche.",
                },
                {
                  titre: "Intermediaire (6-18 mois)",
                  valeur: "300 000 - 900 000 FCFA",
                  texte:
                    "Audience Instagram 2K - 10K, sequences email actives, 1 a 3 formations dans le catalogue, debut de recurrence (communaute WhatsApp privee), diaspora active.",
                },
                {
                  titre: "Avance (1.5 ans+)",
                  valeur: "1 500 000 - 5 000 000 FCFA+",
                  texte:
                    "Catalogue de 4 a 8 produits, tunnel de vente automatise, programme d'affiliation actif, 1 a 2 lancements signature par an, partenariats avec ecoles ou Sème City.",
                },
              ]}
            />
          </Maquette>

          <h3>
            Cas pratique - Adjovi Marius, 31 ans, formateur immigration &
            expatriation
          </h3>
          <p>
            Marius habite a Akpakpa, Cotonou. Diplome en droit des affaires de
            l&apos;Universite d&apos;Abomey-Calavi, il a travaille 4 ans dans
            un cabinet de conseil en immigration avant de basculer formateur
            en fevrier 2026. Son catalogue : une formation cle &quot;Dossier
            Campus France 2026 sans erreur&quot; a 38 000 FCFA, un guide
            condense &quot;PEQ Quebec depuis le Benin&quot; a 12 000 FCFA, une
            communaute WhatsApp Premium &quot;Visa Club&quot; a 7 500
            FCFA/mois (suivi mensuel + Q&A live).
          </p>
          <p>
            En octobre 2026, son chiffre d&apos;affaires mensuel atteint 1 180
            000 FCFA. Repartition : 58 pourcent ventes de la formation Campus
            France (sa période est mars-avril et septembre-octobre), 22
            pourcent guide PEQ Quebec (transactions diaspora), 20 pourcent
            abonnements Visa Club (recurrence formidable). Après TPS et
            commissions Novakou, il lui reste environ 900 000 FCFA nets -
            presque 3 fois son salaire de cabinet precedent, pour 30 heures
            de travail hebdomadaires. Profil fictif mais entierement aligne
            sur les metriques observees sur la plateforme.
          </p>

          <ProAstuce>
            <strong>Le secret du passage 300K → 1M FCFA :</strong> construire
            un catalogue. Une seule formation, meme excellente, plafonne.
            Ajoute un ebook d&apos;entree de gamme (7 - 12K FCFA), un upsell
            premium (coaching individuel 65 - 150K FCFA), une communaute
            privee recurrente (5 - 15K FCFA/mois). Le panier moyen double
            souvent, sans effort marketing supplementaire. Le guide{" "}
            <Link href="/guides/scaler-catalogue-produits">
              scaler ton catalogue de produits
            </Link>{" "}
            explique la sequence exacte adaptee a l&apos;Afrique francophone.
          </ProAstuce>
        </SectionGuide>

        <SectionGuide id="faq" n={numeroGuide(7)} titre={<>FAQ - les questions qu&apos;on me pose tout le temps</>}>
          <p>
            Les huit questions qui reviennent en boucle dans les DMs Instagram
            et les WhatsApp de l&apos;equipe Novakou Cotonou.
          </p>

          <Accordeon items={FAQ_ITEMS.map((f) => ({ q: f.q, a: f.a }))} />
        </SectionGuide>
      </CoqueGuide>
    </>
  );
}
