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

const OG_TITLE = "Vendre une formation en ligne au Burkina Faso en 2026";
const OG_SUBTITLE = "Le guide complet : Orange Money, Moov Money, Wave, fiscalite, lancement 30 jours";

export const metadata: Metadata = {
  // Title sans "| Novakou" — le template root l'ajoute automatiquement.
  // Évite le double suffix "| Novakou | Novakou" qui dépasse la limite Google.
  title: "Vendre une formation au Burkina Faso en 2026 — Guide complet",
  description:
    "Le guide pratique pour vendre formation en ligne Burkina Faso en 2026 : Orange Money, Moov Money, Wave, fiscalite CME, lancement 30 jours et chiffres reels du marche ouagalais.",
  openGraph: {
    title:
      "Vendre une formation en ligne au Burkina Faso en 2026 | Guide Novakou",
    description:
      "Orange Money Burkina, Moov Money, Wave, fiscalite micro-entreprise, methode de lancement 30 jours : tout pour vendre ta formation digitale au Burkina Faso.",
    type: "article",
    images: [
      `/api/og?type=guide&title=${encodeURIComponent(OG_TITLE)}&subtitle=${encodeURIComponent(OG_SUBTITLE)}`,
    ],
  },
  alternates: {
    canonical: "/guides/vendre-formation-burkina-faso-2026",
  },
};

/* ─── Table of Contents data ──────────────────────────────── */
const TOC = [
  { id: "introduction", label: "Pourquoi vendre une formation au Burkina Faso en 2026" },
  { id: "sujets", label: "Choisir son sujet - ce qui se vend a Ouagadougou et Bobo" },
  { id: "paiements", label: "Encaisser - Orange Money, Moov Money, Wave, carte" },
  { id: "fiscalite", label: "Le cadre fiscal du formateur freelance (regime CME)" },
  { id: "promotion", label: "Promouvoir ta formation - les canaux qui marchent" },
  { id: "lancement", label: "Lancer en 30 jours sans budget" },
  { id: "revenus", label: "Combien on peut gagner ? (chiffres reels)" },
  { id: "faq", label: "FAQ - les questions qu'on me pose tout le temps" },
] as const;

/* ─── FAQ data (utilisee pour le rendu ET le JSON-LD) ─────── */
const FAQ_ITEMS = [
  {
    q: "Faut-il un compte bancaire pour vendre une formation au Burkina Faso ?",
    a: "Non. Au Burkina Faso en 2026, un compte Orange Money ou Moov Money suffit largement pour demarrer. Novakou verse directement tes gains sur ton numéro Mobile Money. Le compte bancaire pro (Coris Bank, Bank of Africa, Ecobank Burkina) devient pertinent a partir d'environ 600 000 FCFA de chiffre d'affaires mensuel, quand tu veux structurer ta tresorerie et beneficier du financement TPE.",
  },
  {
    q: "Quel est le prix moyen d'une formation vendue au Burkina Faso ?",
    a: "Le ticket median sur le marche burkinabe en 2026 se situe entre 12 000 et 30 000 FCFA pour une formation de 3 a 6 heures. Les formations premium (avec coaching, communaute, certificat) montent a 60 000 - 180 000 FCFA. Les mini-formations express (1h - 2h) se vendent autour de 4 000 - 10 000 FCFA. Le pouvoir d'achat est legerement plus contenu qu'a Dakar ou Abidjan, donc privilegier des paliers tarifaires accessibles avec upsells.",
  },
  {
    q: "Est-ce que je dois declarer mes revenus a la DGI burkinabe ?",
    a: "Oui, des le premier FCFA encaisse. Au Burkina Faso, le statut le plus simple pour un formateur digital est la Contribution Micro-Entreprise (CME). Tu te declares en ligne via e-SINTAX ou en agence DGI, tu obtiens un IFU (Identifiant Financier Unique), et tu paies une contribution forfaitaire annuelle simplifiee. Tant que tu restes sous le seuil d'environ 15 millions FCFA de CA annuel, tu es exonere de TVA. Cet article est informatif - consulte un expert-comptable agree par l'ONECCA-BF pour ta situation precise.",
  },
  {
    q: "Orange Money ou Moov Money, lequel privilegier pour encaisser ?",
    a: "Les deux, sans exception. Orange Money est historiquement dominant au Burkina (couverture nationale, base d'utilisateurs massive a Ouagadougou et en province), Moov Money capte une part importante des jeunes urbains et de la diaspora Cote d'Ivoire. Wave arrive aussi progressivement en 2026 avec son modèle de frais zero. Novakou integre les trois par defaut. Refuser un operateur, c'est se priver de 25 a 35 pourcent des paiements potentiels.",
  },
  {
    q: "Combien de temps avant ma premiere vente ? 🤔",
    a: "Avec la methode 30 jours decrite plus haut : entre 14 et 21 jours pour la premiere vente si tu as déjà un petit reseau WhatsApp (50 - 200 contacts a Ouaga ou Bobo). Sans audience, compte 45 a 60 jours - le temps de construire 500 abonnes Instagram, TikTok ou Facebook. Les formateurs burkinabes qui vont le plus vite sont ceux qui pre-vendent a leurs contacts FESPACO, FasoHub ou les communautes universitaires de l'Universite Joseph Ki-Zerbo avant meme d'enregistrer le contenu.",
  },
  {
    q: "Faut-il un site web pour vendre une formation au Burkina Faso ?",
    a: "Non, plus en 2026. Ta boutique Novakou (novakou.com/ton-pseudo) fait déjà office de site : page de vente, paiement, livraison automatique, espace eleve. Environ 85 pourcent des vendeurs burkinabes sur Novakou ne possedent aucun site separe. Un site dedie devient utile uniquement si tu veux ranker sur Google avec du SEO de fond (blog, articles longs), mais cela vient plus tard quand tu as déjà un catalogue actif.",
  },
  {
    q: "Puis-je vendre une formation depuis Bobo-Dioulasso, Koudougou ou Ouahigouya ?",
    a: "Bien sur. La vente de formation en ligne au Burkina Faso n'est pas reservee a Ouagadougou. Avec une connexion 4G correcte (Orange ou Telecel) ou la fibre la ou elle est deployee, un smartphone recent et un micro-cravate a 4 000 FCFA, tu produis la meme qualité qu'a Ouaga 2000. Plusieurs formateurs Novakou bases a Bobo-Dioulasso ou Koudougou depassent 600 000 FCFA mensuels - leur avantage : couts de vie plus bas, donc rentabilite nette superieure.",
  },
  {
    q: "Comment proteger ma formation contre le piratage et le partage gratuit ? 🔒",
    a: "Le risque zero n'existe pas, mais Novakou applique : streaming protege (videos non telechargeables), filigrane dynamique avec le mail de l'acheteur, lien personnalise par compte, blocage automatique si plusieurs IP simultanees. Reste vigilant sur Telegram et WhatsApp ou des groupes de revente existent surtout autour de Ouaga. La meilleure defense : un service inclus (coaching live, replays a jour, communaute privee) que le pirate ne peut pas copier.",
  },
] as const;


/* ═════════════════════════════════════════════════════════════ */
/* PAGE                                                         */
/* ═════════════════════════════════════════════════════════════ */

export default function VendreFormationBurkinaFasoPage() {
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
              "Vendre une formation en ligne au Burkina Faso en 2026 : le guide complet",
            description:
              "Le guide pratique pour vendre une formation en ligne au Burkina Faso en 2026 : Orange Money, Moov Money, Wave, fiscalite CME, lancement 30 jours et chiffres reels.",
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
              "https://novakou.com/guides/vendre-formation-burkina-faso-2026",
            image: ogImageUrl,
            articleSection: "Guides vendeurs",
            wordCount: 2400,
            inLanguage: "fr",
            about: [
              { "@type": "Thing", name: "Vendre formation en ligne Burkina Faso" },
              { "@type": "Thing", name: "Orange Money Burkina paiement" },
              { "@type": "Thing", name: "Moov Money Burkina formation" },
              { "@type": "Thing", name: "Wave Burkina" },
              { "@type": "Thing", name: "Ouagadougou formation digitale" },
              { "@type": "Thing", name: "Auto-entrepreneur Burkina regime micro" },
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
                name: "Vendre une formation en ligne au Burkina Faso en 2026",
                item: "https://novakou.com/guides/vendre-formation-burkina-faso-2026",
              },
            ],
          }),
        }}
      />
      <CoqueGuide
        ariane={[
          { label: "Accueil", href: "/" },
          { label: "Guides", href: "/guides/guide-complet-novakou" },
          { label: "Vendre formation Burkina Faso 2026" },
        ]}
        eyebrow="Guide Burkina Faso"
        titre={<>Vendre une formation en ligne au{" "} <em>Burkina Faso</em> en 2026 : le guide complet</>}
        sousTitre="Orange Money, Moov Money, Wave, fiscalite micro-entreprise (CME), lancement en 30 jours sans budget. Le guide pratique base sur les chiffres reels du marche ouagalais et la methode des formateurs burkinabes qui dechirent en 2026."
        auteur={{
          nom: "Equipe Novakou - Ouagadougou",
          note: "Guides et ressources pour les formateurs africains francophones",
        }}
        infos={[
          { icone: Clock, texte: "15 min de lecture" },
          { icone: CalendarDays, texte: "Publie le 7 juin 2026" },
        ]}
        couverture={{
          src: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80",
          alt: "Formateur burkinabe enregistrant son cours en ligne depuis Ouagadougou",
        }}
        sommaire={TOC.map((t, i) => ({ id: t.id, label: t.label, n: numeroGuide(i) }))}
        fin={
          <>
            <CarteActionGuide
              titre="Pret a lancer ta boutique de formation au Burkina Faso ?"
              action={{ href: "/inscription", libelle: "Lancer ma boutique Novakou en 3 minutes" }}
              note="0 abonnement - paiements Mobile Money inclus - 0 frais cache."
            >
              <p>Inscription gratuite en 3 minutes. Orange Money Burkina, Moov Money, Wave et carte bancaire actives par defaut. Ta premiere vente peut tomber des cette semaine.</p>
            </CarteActionGuide>
            <SuiteGuides
              titre="Guides complementaires"
              liens={[
                {
                  href: "/guides/mobile-money-encaisser-paiements",
                  titre: "Encaisser tes paiements en Mobile Money",
                  resume:
                    "Orange Money, Moov Money, Wave, MTN MoMo : tout sur l'encaissement digital en Afrique francophone.",
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
        <SectionGuide id="introduction" n={numeroGuide(0)} titre={<>Pourquoi le moment est unique au Burkina Faso</>}>
          <p>
            Le Burkina Faso de 2026 vit un moment particulier. Avec environ 23
            millions d&apos;habitants, une mediane d&apos;age sous les 18 ans et
            un taux d&apos;equipement smartphone qui grimpe rapidement dans
            l&apos;agglomeration de Ouagadougou (environ 2,5 millions
            d&apos;habitants) comme a Bobo-Dioulasso (1 million), le terrain
            pour <strong>vendre une formation en ligne au Burkina Faso</strong>
            {" "}n&apos;a jamais ete aussi favorable. La 4G d&apos;Orange et
            Telecel couvre l&apos;ensemble du territoire urbain, la fibre
            progresse, et Orange Money comme Moov Money ont normalise le
            paiement digital meme dans les villages.
          </p>
          <p>
            Dans le meme temps, la generation des 18 - 35 ans cherche
            activement a se former : entrepreneuriat, marketing digital,
            montage video (heritage culturel du FESPACO), agriculture moderne,
            religion, langues etrangeres. Les ecoles classiques restent cheres
            (200 000 a 1,5 million FCFA l&apos;annee a Ouaga), souvent decalees
            des realites du marche, et n&apos;offrent ni flexibilite horaire
            ni accompagnement personnalise. Ta formation en ligne, livree par
            Mobile Money, accessible depuis un smartphone, repond exactement
            a cette demande.
          </p>
          <p>
            Ce guide te donne la methode integrale : choisir un sujet qui se
            vend a Ouaga, Bobo et en province, encaisser via Orange Money
            Burkina ou Moov Money, gérer ta fiscalite CME, promouvoir sans
            budget pub, lancer en 30 jours et comprendre les revenus
            realistes. Tout est aligne sur le terrain burkinabe de 2026, pas
            sur des recettes copiees du marche français.
          </p>

          <Maquette titre="Le marche de la formation digitale au Burkina Faso en 2026">
            <Chiffres
              items={[
                { valeur: "23M+", libelle: "Population burkinabe" },
                { valeur: "~65 %", libelle: "Smartphones (urbain)" },
                { valeur: "18 ans", libelle: "Age median" },
              ]}
              source="Estimations 2026 - sources : INSD, ARCEP-BF, GSMA Intelligence."
            />
          </Maquette>
        </SectionGuide>

        <SectionGuide id="sujets" n={numeroGuide(1)} titre={<>Choisir son sujet - ce qui se vend vraiment au Burkina Faso</>}>
          <p>
            Tous les sujets ne se valent pas a Ouagadougou. Le marche
            burkinabe a ses préférences propres, structurees par la
            demographie jeune, la culture entrepreneuriale très forte du pays
            des hommes integres, et l&apos;heritage cinematographique unique
            (le FESPACO etant le plus grand festival du cinema africain).
            Voici les six niches qui generent le plus de{" "}
            <strong>vente formation digitale Ouagadougou</strong> en 2026,
            classees par volume de recherche et taux de conversion observes
            sur Novakou.
          </p>

          <h3>
            Marketing digital et e-commerce
          </h3>
          <p>
            Niche n°1 au Burkina Faso. La jeunesse urbaine veut apprendre a
            vendre sur Facebook, WhatsApp Business, TikTok et Instagram.
            Sujets gagnants : publicite Facebook ciblee Afrique de
            l&apos;Ouest, contenu Reels viral, tunnels de vente, copywriting
            pour vendeurs Ouaga.
          </p>

          <h3>
            Montage video, motion design et creation audiovisuelle
          </h3>
          <p>
            Particularite burkinabe : le pays a une culture du cinema
            extraordinairement forte grace au FESPACO. Cette tradition se
            transpose en 2026 dans le digital. Sujets qui marchent : Adobe
            Premiere, CapCut Pro, motion design After Effects, montage
            mariages et événements, creation de pubs Mobile Money pour
            commerces. Demande en hausse continue.
          </p>

          <h3>
            Programmation et tech
          </h3>
          <p>
            Le Burkina Open Lab, FasoHub et Bobo Tech Hub ont seme un
            ecosysteme. Sujets qui se vendent : developpement web
            (HTML/CSS/JavaScript, React), Python data, no-code (Bubble,
            Webflow), creation d&apos;applications mobiles. Le talent
            burkinabe cible aussi le freelance international en EUR - reel
            levier de prix.
          </p>

          <h3>
            Agriculture moderne et agro-business
          </h3>
          <p>
            Specificite burkinabe forte : pays a tradition agricole (coton,
            sesame, mil, elevage) avec une jeunesse rurale qui veut
            moderniser. Sujets a fort potentiel : aviculture professionnelle,
            maraichage hors-sol, transformation locale (beurre de karite,
            jus), exportation cereales. Tickets eleves car ROI mesurable
            rapidement.
          </p>

          <h3>
            Beaute, soin de soi et bien-etre
          </h3>
          <p>
            Cheveux afro, ongles, maquillage mariage traditionnel, soins de
            la peau noire en climat sahelien, perte de poids, salle de sport
            a la maison. Audience massivement feminine, très engagee sur
            Instagram et TikTok. Ticket moyen : 10 000 a 30 000 FCFA, très
            bonne recurrence avec des communautes privees recurrentes.
          </p>

          <h3>
            Religion et developpement personnel
          </h3>
          <p>
            Apprentissage de la lecture du Coran, tajwid, hadiths, sciences
            islamiques (majoritaire au Burkina), predication chretienne pour
            les communautes, developpement personnel inspire de la
            spiritualite locale. Audience très loyale, faible churn,
            recommandations fortes au sein des familles.
          </p>

          <Maquette titre="Prix moyens observes sur Novakou - Burkina Faso 2026" plein>
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
                    { type: "Marketing digital", low: "18 000 FCFA", high: "130 000 FCFA" },
                    { type: "Montage video / motion", low: "25 000 FCFA", high: "180 000 FCFA" },
                    { type: "Programmation web", low: "30 000 FCFA", high: "220 000 FCFA" },
                    { type: "Agriculture / agro-business", low: "20 000 FCFA", high: "150 000 FCFA" },
                    { type: "Beaute / bien-etre", low: "10 000 FCFA", high: "55 000 FCFA" },
                    { type: "Religion / spiritualite", low: "7 000 FCFA", high: "40 000 FCFA" },
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
            formation est concret (decrocher un emploi, monter sa ferme
            avicole, gagner X FCFA par mois, perdre Y kilos), plus ton ticket
            monte haut. Au Burkina, les formations &quot;decouverte&quot;
            vagues plafonnent autour de 12 000 FCFA, les formations
            &quot;transformation mesurable&quot; atteignent 80 000 - 250 000
            FCFA, surtout en agriculture et en business.
          </Astuce>
        </SectionGuide>

        <SectionGuide id="paiements" n={numeroGuide(2)} titre={<>Encaisser les paiements - Orange Money, Moov Money, Wave, carte</>}>
          <p>
            C&apos;est la pierre angulaire de ton business. Si ton acheteur
            galere a payer, il abandonne. Au Burkina Faso en 2026, le
            paiement digital est domine par quatre canaux qui doivent
            imperativement coexister sur ta page de vente.
          </p>

          <h3>
            Orange Money Burkina - le leader historique
          </h3>
          <p>
            <strong>Orange Money Burkina</strong> domine sans partage le pays
            depuis plus de dix ans. Couverture nationale jusque dans les
            villages, agents en abondance, base d&apos;utilisateurs qui
            couvre toutes les tranches d&apos;age. Pour un vendeur de
            formation, c&apos;est le moyen de paiement par defaut, surtout
            pour la clientele 25 - 55 ans et la province. L&apos;integration
            Orange Money sur Novakou est native : ton acheteur clique sur
            &quot;Payer avec Orange Money&quot;, valide via le code USSD ou
            l&apos;app Orange Money, et la transaction se finalise en
            quelques secondes.
          </p>

          <h3>
            Moov Money Burkina - challenger fort
          </h3>
          <p>
            <strong>Moov Money Burkina</strong> (operateur Moov Africa) est
            le second pilier incontournable. Particulierement fort chez les
            jeunes urbains, dans la diaspora burkinabe en Cote d&apos;Ivoire
            (estimee a plus de 3 millions de personnes) et pour les
            transferts internationaux entrants. Ne neglige jamais ce canal :
            c&apos;est jusqu&apos;a 30 pourcent des paiements selon ta niche
            et ton audience. Les formateurs qui ciblent les ouvriers et
            travailleurs burkinabes d&apos;Abidjan touchent surtout via Moov.
          </p>

          <h3>
            Wave Burkina - en montee, frais zero
          </h3>
          <p>
            <strong>Wave Burkina</strong> deploie progressivement son
            modèle &quot;frais zero entre particuliers&quot; depuis 2024 -
            2025. En 2026, l&apos;adoption reste plus contenue qu&apos;au
            Senegal mais grandit vite chez les moins de 30 ans urbains. Pour
            un formateur, c&apos;est un canal a intégrer des le depart car
            les transferts sont gratuits cote acheteur, ce qui reduit la
            friction au paiement. Novakou supporte Wave Burkina nativement.
          </p>

          <h3>
            Carte bancaire internationale
          </h3>
          <p>
            La diaspora burkinabe (France, Italie, Etats-Unis) et les
            acheteurs hors Afrique utilisent leurs Visa et Mastercard. Pour
            eux, Mobile Money est une friction. La carte bancaire est donc
            indispensable des que tu vises au-dela des frontieres
            burkinabes. Novakou prend en charge les paiements carte
            automatiquement, sans config supplementaire.
          </p>

          <Maquette titre="Repartition typique des paiements - formateur burkinabe 2026">
            <Barres
              items={[
                { libelle: "Orange Money Burkina", valeur: "48 %", part: 48 },
                { libelle: "Moov Money Burkina", valeur: "27 %", part: 27 },
                { libelle: "Wave Burkina (jeunes urbains)", valeur: "10 %", part: 10 },
                { libelle: "Carte bancaire (diaspora EU/US)", valeur: "15 %", part: 15 },
              ]}
            />
          </Maquette>

          <ProAstuce>
            <strong>Pourquoi Novakou integre les quatre sans config :</strong>{" "}
            quand tu crees ta boutique{" "}
            <Link href="/inscription">
              sur Novakou
            </Link>
            , Orange Money Burkina, Moov Money, Wave et carte bancaire sont
            actives par defaut. Tu n&apos;ouvres aucun compte marchand, aucun
            contrat, aucune API : nous gerons les flux pour toi et te
            reversons ton solde net par cycle. Tu peux te concentrer sur ton
            contenu et ton marketing. Pour aller plus loin sur l&apos;
            encaissement, lis le guide{" "}
            <Link href="/guides/mobile-money-encaisser-paiements">
              Mobile Money - encaisser tes paiements
            </Link>
            .
          </ProAstuce>
        </SectionGuide>

        <SectionGuide id="fiscalite" n={numeroGuide(3)} titre={<>Le cadre fiscal du formateur freelance au Burkina Faso</>}>
          <p>
            Vendre une formation en ligne, c&apos;est un revenu, et un
            revenu se declare. Bonne nouvelle : le cadre burkinabe a
            beaucoup simplifie les choses pour le freelance digital ces
            dernieres annees. Voici l&apos;essentiel a savoir sur l&apos;
            <strong>auto-entrepreneur Burkina regime micro</strong> en 2026.
          </p>

          <h3>
            La Contribution Micro-Entreprise (CME)
          </h3>
          <p>
            C&apos;est le statut adapte pour 90 pourcent des formateurs
            digitaux qui demarrent au Burkina. La CME (Contribution
            Micro-Entreprise) regroupe en un seul versement annuel
            l&apos;essentiel des charges fiscales du très petit
            professionnel : IUTS (Impot Unique sur les Traitements et
            Salaires) pour la partie revenus du gerant, patente, et
            contribution forfaitaire. Inscription possible en ligne via
            e-SINTAX ou en agence DGI (avec ta CNIB et un justificatif
            d&apos;adresse). Tu obtiens un IFU (Identifiant Financier
            Unique) et une attestation CME en quelques jours.
          </p>

          <h3>
            Le seuil de 15 millions FCFA
          </h3>
          <p>
            Tant que ton chiffre d&apos;affaires annuel reste sous environ
            15 millions FCFA (environ 23 000 EUR), tu es :
          </p>
          <ul>
            <li>Eligible au regime CME (declaration simplifiee)</li>
            <li>Exonere de TVA (pas besoin de la facturer ni de la reverser)</li>
            <li>Soumis a une contribution forfaitaire annuelle calculee par tranches</li>
            <li>Dispense de tenir une comptabilite complete (registre simplifie)</li>
            <li>Autorise a emettre des factures simplifiees</li>
          </ul>
          <p>
            Au-dela de 15 millions FCFA, tu bascules au Regime Reel
            Simplifie d&apos;Imposition (RSI) et tu dois t&apos;immatriculer
            a la TVA. A ce stade, un comptable agree devient indispensable.
          </p>

          <h3>
            IUTS et CSB - ce que tu paies vraiment
          </h3>
          <p>
            La CME se calcule par tranches forfaitaires en fonction du CA
            declare. Pour donner un ordre d&apos;idee : un formateur qui
            realise 4 millions FCFA de CA annuel paie en general autour de
            180 000 a 300 000 FCFA d&apos;impot total annuel (selon ses
            charges deductibles et activités). C&apos;est significativement
            moins que le regime classique. Reste a payer la CSB
            (Contribution du Secteur Burkinabe) si tu y adheres et a
            envisager une CNSS volontaire pour la protection sociale -
            fortement conseille.
          </p>

          <Attention>
            <strong>Avertissement :</strong> Cet article est purement
            informatif. La fiscalite evolue, ta situation personnelle est
            unique, et un mauvais choix peut couter cher.{" "}
            <strong>
              Consulte imperativement un expert-comptable agree par
              l&apos;ONECCA-BF (Ordre National des Experts-Comptables et
              Comptables Agrees du Burkina Faso) ou un fiscaliste avant de
              finaliser ton statut.
            </strong>{" "}
            Le ticket moyen d&apos;un comptable a Ouagadougou pour le setup
            initial : 40 000 a 120 000 FCFA. Un investissement qui se
            rentabilise des la premiere annee.
          </Attention>
        </SectionGuide>

        <SectionGuide id="promotion" n={numeroGuide(4)} titre={<>Promouvoir ta formation - les canaux qui marchent au Burkina Faso</>}>
          <p>
            Au Burkina Faso, le mix marketing pour vendre une formation
            digitale est specifique. Oublie les Ads Google ou la newsletter
            LinkedIn comme canal principal. La realite terrain en 2026 :
          </p>

          <h3>
            WhatsApp Business - le canal n°1
          </h3>
          <p>
            Au Burkina, WhatsApp n&apos;est pas une app, c&apos;est
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
              (montage video, aviculture, business)
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
            Facebook - encore très dominant au Burkina
          </h3>
          <p>
            Particularite burkinabe : Facebook reste extremement utilise,
            plus qu&apos;au Senegal ou en Cote d&apos;Ivoire. Groupes
            locaux (Ouaga Buzz, Bobo Tech Club, Faso Entrepreneurs), pages
            de communaute, lives commentes en moore et dioula. C&apos;est un
            canal a ne pas sous-estimer, surtout pour toucher au-dela des
            25 ans.
          </p>

          <h3>
            TikTok et Instagram Reels - la generation Z
          </h3>
          <p>
            Pour toucher les 16 - 28 ans urbains, TikTok explose au Burkina
            depuis 2024. Sous-utilise par les vendeurs locaux, donc enorme
            opportunite. L&apos;algorithme TikTok est genereux pour les
            comptes debutants. Cible ton contenu sur des micro-niches
            precises (par exemple &quot;montage video pour événements
            Ouagadougou&quot; plutot que &quot;montage video&quot;).
          </p>

          <h3>
            Communautes tech locales et hubs
          </h3>
          <p>
            Si ta formation cible des techs, devs, entrepreneurs digitaux,
            les hubs sont incontournables : Burkina Open Lab, FasoHub,
            Ouaga Lab, Bobo Tech Hub. Y intervenir comme conferencier
            benevole genere des dizaines de prospects qualifies. Le bouche
            a oreille est extremement puissant a Ouaga.
          </p>

          <Attention>
            <strong>Pourquoi pas la pub Facebook au depart :</strong> les
            encheres publicitaires Facebook Ads sur le Burkina ont monte en
            2024 - 2025. Pour un freelance debutant sans tunnel de vente
            teste, le ROI est negatif 7 fois sur 10. Reserve ce canal pour
            une phase 2, quand tu as déjà vendu naturellement au moins 30
            fois et compris ton message qui convertit. Le guide{" "}
            <Link href="/guides/publicite-facebook">
              publicite Facebook pour formations
            </Link>{" "}
            explique quand et comment basculer.
          </Attention>
        </SectionGuide>

        <SectionGuide id="lancement" n={numeroGuide(5)} titre={<>Lancer en 30 jours sans budget - la methode Novakou</>}>
          <p>
            La methode appliquee par les formateurs Novakou qui passent de 0
            a 400 000 FCFA en un mois au Burkina. Quatre semaines, quatre
            missions claires, zero euro de budget pub.
          </p>

          <Maquette titre="Plan 30 jours pour vendre formation en ligne Burkina Faso">
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
                    "Liste de 10 testeurs proches (amis, collegues Ouaga ou Bobo, contacts FasoHub). Offre pre-lancement a -50 %. Objectif : 5 pre-ventes payees = validation marche.",
                },
                {
                  etiquette: "Semaine 3",
                  titre: "Lancement public",
                  texte:
                    "Boutique Novakou en ligne. 5 Reels Instagram + 7 statuts WhatsApp + 3 posts Facebook + 1 live communautaire. Annonce officielle a ta communaute avec offre limitee 72h.",
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
            aupres de tes 10 contacts les plus proches a Ouaga ou Bobo,
            c&apos;est que ton offre, ton prix ou ton message ne sont pas
            alignes. Mieux vaut ajuster maintenant que d&apos;investir 3
            semaines de production dans le vide. Pour aller plus loin, le
            guide{" "}
            <Link href="/guides/lancement-30-jours">
              lancement 30 jours
            </Link>{" "}
            decortique chaque jour.
          </p>

          <Astuce>
            <strong>Le moment cle au Burkina :</strong> jour 21 du plan,
            soit dimanche soir / lundi matin de la semaine 3. C&apos;est ce
            moment precis que tu envoies ton message d&apos;ouverture sur
            tous tes canaux en meme temps. Au Burkina, beaucoup
            d&apos;acheteurs regardent leur telephone le dimanche soir
            après les visites familiales - timing optimal.
          </Astuce>
        </SectionGuide>

        <SectionGuide id="revenus" n={numeroGuide(6)} titre={<>Combien on peut gagner ? (chiffres reels)</>}>
          <p>
            Soyons concrets. Voici les fourchettes de revenus mensuels nets
            observees chez les formateurs Novakou bases au Burkina Faso en
            2026. Pas des promesses : la moyenne du terrain, hors top 1
            pourcent.
          </p>

          <Maquette titre="Revenus mensuels par niveau - formateur burkinabe 2026">
            <Paliers
              items={[
                {
                  titre: "Debutant (0-6 mois)",
                  valeur: "40 000 - 150 000 FCFA",
                  texte:
                    "1 a 4 ventes par semaine, ticket moyen 12 - 22K FCFA. Pas encore d'audience etablie, beaucoup de prospection manuelle WhatsApp et Facebook groupes.",
                },
                {
                  titre: "Intermediaire (6-18 mois)",
                  valeur: "250 000 - 700 000 FCFA",
                  texte:
                    "Audience Instagram/TikTok 2K - 10K, sequences email actives, 1 a 3 formations dans le catalogue, debut de recurrence (communaute privee WhatsApp).",
                },
                {
                  titre: "Avance (1.5 ans+)",
                  valeur: "1 000 000 - 3 500 000 FCFA+",
                  texte:
                    "Catalogue de 4 a 8 produits, tunnel de vente automatise, programme d'affiliation actif (relais a Bobo, Koudougou, Banfora), 1 a 2 lancements signature par an.",
                },
              ]}
            />
          </Maquette>

          <h3>
            Cas pratique - Ouedraogo Salif, 33 ans, formateur montage video
          </h3>
          <p>
            Salif habite a Patte d&apos;Oie, Ouagadougou. Ancien assistant
            monteur passe par l&apos;ecosysteme FESPACO et plusieurs
            longs-metrages burkinabe, il a basculle formateur en fevrier
            2026. Son catalogue : une formation cle &quot;Monter ses videos
            mariage et événements comme un pro&quot; a 30 000 FCFA, un
            pack-presets Premiere Pro a 8 000 FCFA, une communaute
            WhatsApp Premium &quot;Montage Faso&quot; a 4 500 FCFA/mois.
          </p>
          <p>
            En octobre 2026, son chiffre d&apos;affaires mensuel atteint
            950 000 FCFA. Repartition : 60 pourcent ventes de la formation
            principale, 15 pourcent pack-presets (souvent upsell), 25
            pourcent abonnements communaute. Après CME et commissions
            Novakou, il lui reste environ 750 000 FCFA nets - presque 4
            fois son salaire d&apos;assistant precedent, pour 25 heures de
            travail hebdomadaires. Profil fictif mais entierement aligne
            sur les metriques observees a Ouaga.
          </p>

          <ProAstuce>
            <strong>Le secret du passage 250K → 1M FCFA au Burkina :</strong>{" "}
            construire un catalogue ET utiliser la dimension communautaire
            forte du pays. Une seule formation, meme excellente, plafonne.
            Ajoute un ebook d&apos;entree de gamme (7 - 10K FCFA), un
            upsell premium (coaching individuel 60 - 130K FCFA), une
            communaute privee recurrente (4 - 12K FCFA/mois). Au Burkina,
            la culture de l&apos;entraide communautaire fait grimper les
            taux de retention de la communaute payante au-dessus de la
            moyenne UEMOA. Le guide{" "}
            <Link href="/guides/scaler-catalogue-produits">
              scaler ton catalogue de produits
            </Link>{" "}
            explique la sequence exacte.
          </ProAstuce>
        </SectionGuide>

        <SectionGuide id="faq" n={numeroGuide(7)} titre={<>FAQ - les questions qu&apos;on me pose tout le temps</>}>
          <p>
            Les huit questions qui reviennent en boucle dans les DMs
            Instagram, les Facebook Messenger et les WhatsApp de l&apos;
            equipe Novakou Ouagadougou.
          </p>

          <Accordeon items={FAQ_ITEMS.map((f) => ({ q: f.q, a: f.a }))} />
        </SectionGuide>
      </CoqueGuide>
    </>
  );
}
