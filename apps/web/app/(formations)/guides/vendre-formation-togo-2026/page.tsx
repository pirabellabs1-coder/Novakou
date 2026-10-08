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

const OG_TITLE = "Vendre une formation en ligne au Togo en 2026";
const OG_SUBTITLE = "Le guide complet : T-Money, Flooz, Mixx, fiscalite, lancement 30 jours";

export const metadata: Metadata = {
  // Title sans "| Novakou" — le template root l'ajoute automatiquement.
  // Évite le double suffix "| Novakou | Novakou" qui dépasse la limite Google.
  title: "Vendre une formation au Togo en 2026 — Guide complet",
  description:
    "Le guide pratique pour vendre formation en ligne Togo en 2026 : T-Money, Flooz, Mixx, fiscalite micro-entreprise, lancement 30 jours et chiffres reels du marche lomeen.",
  openGraph: {
    title:
      "Vendre une formation en ligne au Togo en 2026 | Guide Novakou",
    description:
      "T-Money, Flooz, Mixx, fiscalite micro-entreprise Togo, methode de lancement 30 jours : tout pour vendre ta formation digitale au Togo.",
    type: "article",
    images: [
      `/api/og?type=guide&title=${encodeURIComponent(OG_TITLE)}&subtitle=${encodeURIComponent(OG_SUBTITLE)}`,
    ],
  },
  alternates: {
    canonical: "/guides/vendre-formation-togo-2026",
  },
};

/* ─── Table of Contents data ──────────────────────────────── */
const TOC = [
  { id: "introduction", label: "Pourquoi vendre une formation au Togo en 2026" },
  { id: "sujets", label: "Choisir son sujet - ce qui se vend a Lome et au Togo" },
  { id: "paiements", label: "Encaisser - T-Money, Flooz, Mixx, carte" },
  { id: "fiscalite", label: "Le cadre fiscal du formateur freelance (regime forfait)" },
  { id: "promotion", label: "Promouvoir ta formation - les canaux qui marchent" },
  { id: "lancement", label: "Lancer en 30 jours sans budget" },
  { id: "revenus", label: "Combien on peut gagner ? (chiffres reels)" },
  { id: "faq", label: "FAQ - les questions qu'on me pose tout le temps" },
] as const;

/* ─── FAQ data (utilisee pour le rendu ET le JSON-LD) ─────── */
const FAQ_ITEMS = [
  {
    q: "Faut-il un compte bancaire pour vendre une formation au Togo ?",
    a: "Non. Au Togo en 2026, un compte T-Money, Flooz ou Mixx suffit largement pour demarrer. Novakou verse directement tes gains sur ton numéro Mobile Money. Le compte bancaire pro (Ecobank Togo, UTB, Orabank, BTCI) devient pertinent a partir d'environ 500 000 FCFA de chiffre d'affaires mensuel, quand tu veux structurer ta tresorerie et acceder aux financements PME.",
  },
  {
    q: "Quel est le prix moyen d'une formation vendue au Togo ?",
    a: "Le ticket median sur le marche togolais en 2026 se situe entre 12 000 et 28 000 FCFA pour une formation de 3 a 6 heures. Les formations premium (avec coaching, communaute, certificat) montent a 55 000 - 160 000 FCFA. Les mini-formations express (1h - 2h) se vendent autour de 4 000 - 9 000 FCFA. Le Togo etant un carrefour logistique, les formations e-commerce et import/export peuvent depasser ces fourchettes.",
  },
  {
    q: "Est-ce que je dois declarer mes revenus a la DGI togolaise ?",
    a: "Oui, des le premier FCFA encaisse. Au Togo, le statut le plus simple pour un formateur digital qui demarre est le regime du forfait pour les TPE (très petites entreprises). Tu te declares en ligne via e-services OTR (Office Togolais des Recettes) ou en agence, tu obtiens un NIF (Numéro d'Identification Fiscale), et tu paies l'AIB (Acompte sur Impot sur les Bénéfices) selon ton CA estime. Tant que tu restes sous le seuil de 30 millions FCFA de CA annuel, tu beneficies du regime du forfait simplifie. Cet article est informatif - consulte un expert-comptable agree par l'ONECCA-Togo pour ta situation precise.",
  },
  {
    q: "T-Money, Flooz ou Mixx, lequel privilegier pour encaisser ?",
    a: "Les trois, sans exception. T-Money (operateur Togocom, ex-Togocel) domine la couverture nationale et la base d'utilisateurs. Flooz (Moov Africa Togo) est très fort chez les jeunes urbains et la diaspora togolaise en Cote d'Ivoire et au Benin. Mixx by Yas (anciennement Mixx, lance par Yas / ex-Moov dans certaines zones) gagne du terrain a Lome. Refuser un operateur, c'est se priver de 25 a 35 pourcent du marche togolais. Novakou integre les trois nativement.",
  },
  {
    q: "Combien de temps avant ma premiere vente ? 🤔",
    a: "Avec la methode 30 jours decrite plus haut : entre 14 et 21 jours pour la premiere vente si tu as déjà un petit reseau WhatsApp (50 - 200 contacts a Lome ou Kara). Sans audience, compte 45 a 60 jours - le temps de construire 500 abonnes Instagram, TikTok ou Facebook. Les formateurs togolais qui vont le plus vite sont ceux qui pre-vendent a leurs contacts d'Innov'Up, d'Africa Lab ou des incubateurs de Lome avant meme d'enregistrer le contenu.",
  },
  {
    q: "Faut-il un site web pour vendre une formation au Togo ?",
    a: "Non, plus en 2026. Ta boutique Novakou (novakou.com/ton-pseudo) fait déjà office de site : page de vente, paiement, livraison automatique, espace eleve. Environ 85 pourcent des vendeurs togolais sur Novakou ne possedent aucun site separe. Un site dedie devient utile uniquement si tu veux ranker sur Google avec du SEO de fond (blog, articles longs), mais cela vient plus tard quand tu as déjà un catalogue actif.",
  },
  {
    q: "Puis-je vendre une formation depuis Kara, Kpalime ou Sokode ?",
    a: "Bien sur. La vente de formation en ligne au Togo n'est pas reservee a Lome. Avec une connexion 4G correcte (Togocom ou Moov Africa Togo), un smartphone recent et un micro-cravate a 4 000 FCFA, tu produis la meme qualité qu'au Boulevard du Mono. Plusieurs formateurs Novakou bases a Kara, Atakpame ou Kpalime depassent 550 000 FCFA mensuels - leur avantage : couts de vie plus bas, donc rentabilite nette superieure.",
  },
  {
    q: "Comment proteger ma formation contre le piratage et le partage gratuit ? 🔒",
    a: "Le risque zero n'existe pas, mais Novakou applique : streaming protege (videos non telechargeables), filigrane dynamique avec le mail de l'acheteur, lien personnalise par compte, blocage automatique si plusieurs IP simultanees. Reste vigilant sur Telegram et WhatsApp ou des groupes de revente existent surtout autour de Lome. La meilleure defense : un service inclus (coaching live, replays a jour, communaute privee) que le pirate ne peut pas copier.",
  },
] as const;


/* ═════════════════════════════════════════════════════════════ */
/* PAGE                                                         */
/* ═════════════════════════════════════════════════════════════ */

export default function VendreFormationTogoPage() {
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
              "Vendre une formation en ligne au Togo en 2026 : le guide complet",
            description:
              "Le guide pratique pour vendre une formation en ligne au Togo en 2026 : T-Money, Flooz, Mixx, fiscalite micro-entreprise, lancement 30 jours et chiffres reels.",
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
              "https://novakou.com/guides/vendre-formation-togo-2026",
            image: ogImageUrl,
            articleSection: "Guides vendeurs",
            wordCount: 2400,
            inLanguage: "fr",
            about: [
              { "@type": "Thing", name: "Vendre formation en ligne Togo" },
              { "@type": "Thing", name: "T-Money Togo paiement" },
              { "@type": "Thing", name: "Flooz Togo formation" },
              { "@type": "Thing", name: "Mixx Togo" },
              { "@type": "Thing", name: "Lome formation digitale" },
              { "@type": "Thing", name: "Fiscalite micro-entreprise Togo" },
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
                name: "Vendre une formation en ligne au Togo en 2026",
                item: "https://novakou.com/guides/vendre-formation-togo-2026",
              },
            ],
          }),
        }}
      />
      <CoqueGuide
        ariane={[
          { label: "Accueil", href: "/" },
          { label: "Guides", href: "/guides/guide-complet-novakou" },
          { label: "Vendre formation Togo 2026" },
        ]}
        eyebrow="Guide Togo"
        titre={<>Vendre une formation en ligne au{" "} <em>Togo</em> en 2026 : le guide complet</>}
        sousTitre="T-Money, Flooz, Mixx, fiscalite micro-entreprise, lancement en 30 jours sans budget. Le guide pratique base sur les chiffres reels du marche lomeen et la methode des formateurs togolais qui dechirent en 2026."
        auteur={{
          nom: "Equipe Novakou - Lome",
          note: "Guides et ressources pour les formateurs africains francophones",
        }}
        infos={[
          { icone: Clock, texte: "15 min de lecture" },
          { icone: CalendarDays, texte: "Publie le 7 juin 2026" },
        ]}
        couverture={{
          src: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80",
          alt: "Formateur togolais enregistrant son cours en ligne depuis Lome",
        }}
        sommaire={TOC.map((t, i) => ({ id: t.id, label: t.label, n: numeroGuide(i) }))}
        fin={
          <>
            <CarteActionGuide
              titre="Pret a lancer ta boutique de formation au Togo ?"
              action={{ href: "/inscription", libelle: "Lancer ma boutique Novakou en 3 minutes" }}
              note="0 abonnement - paiements Mobile Money inclus - 0 frais cache."
            >
              <p>Inscription gratuite en 3 minutes. T-Money, Flooz, Mixx et carte bancaire actives par defaut. Ta premiere vente peut tomber des cette semaine.</p>
            </CarteActionGuide>
            <SuiteGuides
              titre="Guides complementaires"
              liens={[
                {
                  href: "/guides/mobile-money-encaisser-paiements",
                  titre: "Encaisser tes paiements en Mobile Money",
                  resume:
                    "T-Money, Flooz, Mixx, MTN MoMo : tout sur l'encaissement digital en Afrique francophone.",
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
        <SectionGuide id="introduction" n={numeroGuide(0)} titre={<>Pourquoi le moment est unique au Togo</>}>
          <p>
            Le Togo de 2026 vit une fenetre d&apos;opportunite remarquable.
            Avec ses 9 millions d&apos;habitants (le plus petit pays de
            l&apos;UEMOA mais densement urbanise), une mediane d&apos;age
            sous les 19 ans et une agglomeration de Lome qui concentre 1,5
            million d&apos;habitants, le terrain pour{" "}
            <strong>vendre une formation en ligne au Togo</strong> n&apos;a
            jamais ete aussi favorable. La 4G de Togocom et Moov Africa
            Togo couvre l&apos;ensemble du territoire urbain, la fibre
            progresse rapidement, et T-Money, Flooz et Mixx ont normalise
            le paiement digital.
          </p>
          <p>
            Particularite togolaise : le pays est un carrefour logistique
            regional grace au Port Autonome de Lome, premier port en eaux
            profondes de la sous-region. Cette position genere une culture
            très forte du commerce, de l&apos;import-export et de la
            revente. Couple a une jeunesse hyperconnectee, cela cree un
            marche unique pour les formations e-commerce, Alibaba, Amazon,
            dropshipping et logistique digitale. Les ecoles classiques
            (Universite de Lome, ESGIS, ISCAM) restent cheres et souvent
            decalees du terrain - ta formation en ligne, livree par Mobile
            Money, repond a une demande precise.
          </p>
          <p>
            Ce guide te donne la methode integrale : choisir un sujet qui
            se vend a Lome et en region, encaisser via T-Money, Flooz ou
            Mixx, gérer ta fiscalite forfait, promouvoir sans budget pub,
            lancer en 30 jours et comprendre les revenus realistes. Tout
            est aligne sur le terrain togolais de 2026, pas sur des
            recettes copiees du marche français.
          </p>

          <Maquette titre="Le marche de la formation digitale au Togo en 2026">
            <Chiffres
              items={[
                { valeur: "9M+", libelle: "Population togolaise" },
                { valeur: "~70 %", libelle: "Smartphones (urbain)" },
                { valeur: "19 ans", libelle: "Age median" },
              ]}
              source="Estimations 2026 - sources : INSEED-Togo, ARCEP-Togo, GSMA Intelligence."
            />
          </Maquette>
        </SectionGuide>

        <SectionGuide id="sujets" n={numeroGuide(1)} titre={<>Choisir son sujet - ce qui se vend vraiment au Togo</>}>
          <p>
            Tous les sujets ne se valent pas a Lome. Le marche togolais a
            ses préférences propres, structurees par la demographie jeune,
            la culture commerciale heritee du port et l&apos;ecosysteme
            startup naissant. Voici les six niches qui generent le plus de{" "}
            <strong>vente formation digitale Lome</strong> en 2026, classees
            par volume de recherche et taux de conversion observes sur
            Novakou.
          </p>

          <h3>
            E-commerce, import-export et Alibaba / Amazon
          </h3>
          <p>
            Specificite togolaise n°1. Grace au Port de Lome, plaque
            tournante logistique de l&apos;Afrique de l&apos;Ouest, la
            formation a l&apos;import depuis la Chine (Alibaba, 1688), la
            revente sur les marketplaces locales, l&apos;optimisation
            douanes UEMOA et le dropshipping Amazon vers la diaspora est
            devenue une niche extremement rentable. Tickets eleves (50 -
            200K FCFA) car les apprenants generent des resultats rapides.
          </p>

          <h3>
            Marketing digital et social media
          </h3>
          <p>
            Niche universelle, forte demande a Lome. Tout le monde veut
            apprendre a vendre sur WhatsApp Business, TikTok, Instagram et
            Facebook. Sujets gagnants : publicite Facebook ciblee Afrique
            de l&apos;Ouest, contenu Reels viral, tunnels de vente,
            copywriting pour vendeurs lomeens.
          </p>

          <h3>
            Programmation et tech
          </h3>
          <p>
            L&apos;ecosysteme Innov&apos;Up Togo, Africa Lab, le Coworking
            Lome et l&apos;Etrilabs ont seme une communaute dev qui grandit
            vite. Sujets qui se vendent : developpement web (React,
            Next.js), Python data, no-code (Bubble, Webflow), creation
            d&apos;applications mobiles. Le talent togolais cible aussi le
            freelance international en EUR - reel levier de prix.
          </p>

          <h3>
            Business en ligne et freelance international
          </h3>
          <p>
            Comment lancer son business depuis zero, comment trouver des
            clients freelance, comment encaisser en devises etrangeres,
            comment structurer son entreprise individuelle togolaise. Ces
            sujets convertissent très bien car le resultat est mesurable
            et la diaspora togolaise (France, USA, Canada) finance souvent
            la formation pour ses jeunes au pays.
          </p>

          <h3>
            Beaute, soin de soi et bien-etre
          </h3>
          <p>
            Cheveux afro, ongles, maquillage, soins de la peau noire en
            climat humide, perte de poids, salle de sport a la maison.
            Audience massivement feminine, très engagee sur Instagram et
            TikTok. Ticket moyen : 10 000 a 28 000 FCFA, très bonne
            recurrence avec communautes privees.
          </p>

          <h3>
            Langues etrangeres
          </h3>
          <p>
            Anglais business pour migration economique vers le Ghana voisin
            ou le Nigeria, mandarin (pour les commercants qui importent de
            Chine), espagnol (visa et migration), turc. La forte composante
            commerciale du Togo fait de l&apos;anglais et du mandarin des
            atouts professionnels reels. Ticket eleve quand combine avec
            un objectif precis (TOEFL, deal avec un fournisseur chinois).
          </p>

          <Maquette titre="Prix moyens observes sur Novakou - Togo 2026" plein>
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
                    { type: "E-commerce / import-export", low: "35 000 FCFA", high: "200 000 FCFA" },
                    { type: "Marketing digital", low: "18 000 FCFA", high: "120 000 FCFA" },
                    { type: "Programmation web", low: "30 000 FCFA", high: "180 000 FCFA" },
                    { type: "Business / freelance", low: "22 000 FCFA", high: "150 000 FCFA" },
                    { type: "Beaute / bien-etre", low: "10 000 FCFA", high: "50 000 FCFA" },
                    { type: "Langues etrangeres", low: "15 000 FCFA", high: "100 000 FCFA" },
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
            <strong>Conseil terrain :</strong> Au Togo, exploite a fond
            l&apos;angle &quot;carrefour logistique&quot;. Les formations
            qui montrent comment tirer parti du Port de Lome pour
            importer / revendre / exporter cassent les plafonds. Une
            formation &quot;decouverte&quot; e-commerce plafonne autour de
            15 000 FCFA, mais une formation &quot;Importer un container de
            Shenzhen a Lome et revendre&quot; atteint 100 000 - 250 000
            FCFA sans problème.
          </Astuce>
        </SectionGuide>

        <SectionGuide id="paiements" n={numeroGuide(2)} titre={<>Encaisser les paiements - T-Money, Flooz, Mixx, carte</>}>
          <p>
            C&apos;est la pierre angulaire de ton business. Si ton acheteur
            galere a payer, il abandonne. Au Togo en 2026, le paiement
            digital est domine par quatre canaux qui doivent imperativement
            coexister sur ta page de vente. Particularite : le Togo ne
            dispose ni d&apos;Orange Money ni de Wave - c&apos;est un
            paysage Mobile Money 100 pourcent local.
          </p>

          <h3>
            T-Money - le leader togolais
          </h3>
          <p>
            <strong>T-Money Togo</strong> (operateur Togocom, ex-Togocel)
            domine sans partage le pays. Couverture nationale complete,
            base d&apos;utilisateurs massive, application moderne et reseau
            d&apos;agents dense jusque dans les villages. Pour un vendeur
            de formation, c&apos;est le moyen de paiement par defaut sur
            toutes les tranches d&apos;age. L&apos;integration T-Money sur
            Novakou est native : ton acheteur clique sur &quot;Payer avec
            T-Money&quot;, valide via le code USSD ou l&apos;app, et la
            transaction se finalise en quelques secondes.
          </p>

          <h3>
            Flooz Togo - challenger fort
          </h3>
          <p>
            <strong>Flooz Togo</strong> (Moov Africa Togo) est le second
            pilier incontournable. Particulierement fort chez les jeunes
            urbains de Lome, dans la diaspora togolaise au Benin et en
            Cote d&apos;Ivoire, et pour les transferts vers les villes
            frontalieres. Ne neglige jamais ce canal : c&apos;est jusqu&apos;a
            30 pourcent des paiements selon ta niche et ton audience. Les
            formateurs qui ciblent les commercants du Grand Marche
            d&apos;Adawlato touchent souvent via Flooz.
          </p>

          <h3>
            Mixx by Yas - le nouveau acteur en montee
          </h3>
          <p>
            <strong>Mixx Togo</strong> (anciennement deploye par
            l&apos;ex-Moov dans certaines zones, refondu sous la marque
            Yas) gagne du terrain depuis 2024 - 2025, particulierement
            chez les moins de 30 ans urbains. En 2026, l&apos;adoption
            reste plus contenue que T-Money ou Flooz mais grandit vite.
            Pour un formateur, c&apos;est un canal a intégrer des le
            depart pour ne rater aucun acheteur. Novakou supporte Mixx
            nativement.
          </p>

          <h3>
            Carte bancaire internationale
          </h3>
          <p>
            La diaspora togolaise (France, USA, Canada, Allemagne) et les
            acheteurs hors Afrique utilisent leurs Visa et Mastercard. Pour
            eux, Mobile Money est une friction. La carte bancaire est donc
            indispensable des que tu vises au-dela des frontieres
            togolaises. Novakou prend en charge les paiements carte
            automatiquement, sans config supplementaire.
          </p>

          <Maquette titre="Repartition typique des paiements - formateur togolais 2026">
            <Barres
              items={[
                { libelle: "T-Money (Togocom)", valeur: "45 %", part: 45 },
                { libelle: "Flooz (Moov Africa)", valeur: "28 %", part: 28 },
                { libelle: "Mixx by Yas", valeur: "10 %", part: 10 },
                { libelle: "Carte bancaire (diaspora EU/US)", valeur: "17 %", part: 17 },
              ]}
            />
          </Maquette>

          <ProAstuce>
            <strong>Pourquoi Novakou integre les quatre sans config :</strong>{" "}
            quand tu crees ta boutique{" "}
            <Link href="/inscription">
              sur Novakou
            </Link>
            , T-Money, Flooz, Mixx et carte bancaire sont actives par
            defaut. Tu n&apos;ouvres aucun compte marchand, aucun contrat,
            aucune API : nous gerons les flux pour toi et te reversons ton
            solde net par cycle. Tu peux te concentrer sur ton contenu et
            ton marketing. Pour aller plus loin sur l&apos;encaissement,
            lis le guide{" "}
            <Link href="/guides/mobile-money-encaisser-paiements">
              Mobile Money - encaisser tes paiements
            </Link>
            .
          </ProAstuce>
        </SectionGuide>

        <SectionGuide id="fiscalite" n={numeroGuide(3)} titre={<>Le cadre fiscal du formateur freelance au Togo</>}>
          <p>
            Vendre une formation en ligne, c&apos;est un revenu, et un
            revenu se declare. Bonne nouvelle : le cadre togolais a
            beaucoup simplifie les choses pour le freelance digital ces
            dernieres annees grace a la modernisation de l&apos;OTR
            (Office Togolais des Recettes). Voici l&apos;essentiel a
            savoir sur la <strong>fiscalite micro-entreprise Togo</strong>{" "}
            en 2026.
          </p>

          <h3>
            Le regime du forfait pour les TPE
          </h3>
          <p>
            C&apos;est le statut adapte pour 90 pourcent des formateurs
            digitaux qui demarrent au Togo. Le regime du forfait pour les
            très petites entreprises permet une declaration simplifiee, un
            impot synthetique unique remplaçant en grande partie
            l&apos;IRPP et la patente, et une comptabilite allegee.
            Inscription possible en ligne via le portail e-services OTR ou
            en agence (avec ta CNI et un justificatif d&apos;adresse). Tu
            obtiens un NIF (Numéro d&apos;Identification Fiscale) et un
            recepisse d&apos;inscription en quelques jours.
          </p>

          <h3>
            Le seuil de 30 millions FCFA
          </h3>
          <p>
            Tant que ton chiffre d&apos;affaires annuel reste sous environ
            30 millions FCFA (environ 46 000 EUR), tu es :
          </p>
          <ul>
            <li>Eligible au regime du forfait (declaration simplifiee)</li>
            <li>Exonere de TVA (pas besoin de la facturer ni de la reverser)</li>
            <li>Soumis à l&apos;AIB (Acompte sur Impôt sur les Bénéfices) calculé sur ton CA</li>
            <li>Dispense de tenir une comptabilite complete (registre simplifie)</li>
            <li>Autorise a emettre des factures simplifiees</li>
          </ul>
          <p>
            Au-dela de 30 millions FCFA, tu passes au regime du reel
            simplifie ou du reel normal et tu dois t&apos;immatriculer a la
            TVA. A ce stade, un comptable agree devient indispensable.
          </p>

          <h3>
            AIB et impot synthetique - ce que tu paies vraiment
          </h3>
          <p>
            L&apos;AIB se calcule selon des taux progressifs en fonction
            du CA declare. Pour donner un ordre d&apos;idee : un formateur
            qui realise 5 millions FCFA de CA annuel paie en general autour
            de 200 000 a 350 000 FCFA d&apos;impot total annuel (selon ses
            charges deductibles et activités). C&apos;est nettement moins
            que le regime classique de l&apos;IS. Reste a envisager une
            CNSS volontaire pour la protection sociale - fortement
            conseille pour la retraite et la maladie.
          </p>

          <Attention>
            <strong>Avertissement :</strong> Cet article est purement
            informatif. La fiscalite evolue, ta situation personnelle est
            unique, et un mauvais choix peut couter cher.{" "}
            <strong>
              Consulte imperativement un expert-comptable agree par
              l&apos;ONECCA-Togo (Ordre National des Experts-Comptables et
              Comptables Agrees du Togo) ou un fiscaliste avant de
              finaliser ton statut.
            </strong>{" "}
            Le ticket moyen d&apos;un comptable a Lome pour le setup
            initial : 40 000 a 130 000 FCFA. Un investissement qui se
            rentabilise des la premiere annee.
          </Attention>
        </SectionGuide>

        <SectionGuide id="promotion" n={numeroGuide(4)} titre={<>Promouvoir ta formation - les canaux qui marchent au Togo</>}>
          <p>
            Au Togo, le mix marketing pour vendre une formation digitale
            est specifique. Oublie les Ads Google ou la newsletter LinkedIn
            comme canal principal. La realite terrain en 2026 :
          </p>

          <h3>
            WhatsApp Business - le canal n°1
          </h3>
          <p>
            Au Togo, WhatsApp n&apos;est pas une app, c&apos;est
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
              (e-commerce, beaute, business)
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
            Facebook - très dominant au Togo
          </h3>
          <p>
            Particularite togolaise : Facebook reste extremement utilise,
            notamment via les groupes locaux puissants (Lome Buzz, Togo
            Business Network, Adawlato Commercants, 228 Tech). Lives
            commentes en ewe et mina, communautes thematiques actives.
            C&apos;est un canal a ne pas sous-estimer, surtout pour
            toucher au-dela des 25 ans et la classe commercante.
          </p>

          <h3>
            TikTok et Instagram Reels - la generation Z
          </h3>
          <p>
            Pour toucher les 16 - 28 ans urbains, TikTok explose au Togo
            depuis 2024. Sous-utilise par les vendeurs locaux, donc enorme
            opportunite. L&apos;algorithme TikTok est genereux pour les
            comptes debutants. Cible ton contenu sur des micro-niches
            precises (par exemple &quot;importer de Chine vers Lome pour
            debutants&quot; plutot que &quot;import-export&quot;).
          </p>

          <h3>
            Hubs et incubateurs locaux
          </h3>
          <p>
            Si ta formation cible des techs, devs, entrepreneurs digitaux,
            les hubs sont incontournables : Innov&apos;Up Togo, Africa Lab,
            Etrilabs, Coworking Lome. Y intervenir comme conferencier
            benevole genere des dizaines de prospects qualifies. Le bouche
            a oreille est extremement puissant a Lome ou tout le monde se
            connait dans le milieu digital.
          </p>

          <Attention>
            <strong>Pourquoi pas la pub Facebook au depart :</strong> les
            encheres publicitaires Facebook Ads sur le Togo ont monte en
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
            La methode appliquee par les formateurs Novakou qui passent de
            0 a 400 000 FCFA en un mois au Togo. Quatre semaines, quatre
            missions claires, zero euro de budget pub.
          </p>

          <Maquette titre="Plan 30 jours pour vendre formation en ligne Togo">
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
                    "Liste de 10 testeurs proches (amis, collegues Lome ou Kara, contacts Innov'Up). Offre pre-lancement a -50 %. Objectif : 5 pre-ventes payees = validation marche.",
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
            aupres de tes 10 contacts les plus proches a Lome, c&apos;est
            que ton offre, ton prix ou ton message ne sont pas alignes.
            Mieux vaut ajuster maintenant que d&apos;investir 3 semaines
            de production dans le vide. Pour aller plus loin, le guide{" "}
            <Link href="/guides/lancement-30-jours">
              lancement 30 jours
            </Link>{" "}
            decortique chaque jour.
          </p>

          <Astuce>
            <strong>Le moment cle au Togo :</strong> jour 21 du plan, soit
            dimanche soir / lundi matin de la semaine 3. C&apos;est ce
            moment precis que tu envoies ton message d&apos;ouverture sur
            tous tes canaux en meme temps. A Lome, beaucoup d&apos;acheteurs
            regardent leur telephone le dimanche soir entre la sortie du
            temple ou de la messe et le repas familial - timing optimal
            pour créer l&apos;effet de masse.
          </Astuce>
        </SectionGuide>

        <SectionGuide id="revenus" n={numeroGuide(6)} titre={<>Combien on peut gagner ? (chiffres reels)</>}>
          <p>
            Soyons concrets. Voici les fourchettes de revenus mensuels
            nets observees chez les formateurs Novakou bases au Togo en
            2026. Pas des promesses : la moyenne du terrain, hors top 1
            pourcent.
          </p>

          <Maquette titre="Revenus mensuels par niveau - formateur togolais 2026">
            <Paliers
              items={[
                {
                  titre: "Debutant (0-6 mois)",
                  valeur: "40 000 - 130 000 FCFA",
                  texte:
                    "1 a 4 ventes par semaine, ticket moyen 12 - 20K FCFA. Pas encore d'audience etablie, beaucoup de prospection manuelle WhatsApp et Facebook groupes.",
                },
                {
                  titre: "Intermediaire (6-18 mois)",
                  valeur: "220 000 - 600 000 FCFA",
                  texte:
                    "Audience Instagram/TikTok 2K - 10K, sequences email actives, 1 a 3 formations dans le catalogue, debut de recurrence (communaute privee WhatsApp).",
                },
                {
                  titre: "Avance (1.5 ans+)",
                  valeur: "900 000 - 3 000 000 FCFA+",
                  texte:
                    "Catalogue de 4 a 8 produits, tunnel de vente automatise, programme d'affiliation actif (relais a Kara, Atakpame, Sokode), 1 a 2 lancements signature par an.",
                },
              ]}
            />
          </Maquette>

          <h3>
            Cas pratique - Agbenye Koffi, 28 ans, formateur e-commerce Alibaba / Amazon
          </h3>
          <p>
            Koffi habite au quartier Tokoin Hospital, Lome. Diplome de
            l&apos;Universite de Lome en commerce international, il a
            travaille 4 ans comme transitaire au Port autonome avant de
            basculer formateur en mars 2026. Son catalogue : une formation
            cle &quot;Importer de Chine vers Lome et revendre en 30
            jours&quot; a 45 000 FCFA, un ebook checklist douaniere a
            9 000 FCFA, une communaute WhatsApp Premium &quot;Importateurs
            Togo&quot; a 6 000 FCFA/mois.
          </p>
          <p>
            En octobre 2026, son chiffre d&apos;affaires mensuel atteint
            870 000 FCFA. Repartition : 62 pourcent ventes de la formation
            principale, 13 pourcent ebook (souvent upsell), 25 pourcent
            abonnements communaute. Après impot forfait et commissions
            Novakou, il lui reste environ 680 000 FCFA nets - presque 3,5
            fois son salaire de transitaire precedent, pour 25 heures de
            travail hebdomadaires. Profil fictif mais entierement aligne
            sur les metriques observees a Lome.
          </p>

          <ProAstuce>
            <strong>Le secret du passage 220K → 900K FCFA au Togo :</strong>{" "}
            exploiter le positionnement commercial unique du pays.
            Construire un catalogue ET adresser la niche import/export qui
            plafonne 2 a 3 fois plus haut. Une seule formation, meme
            excellente, plafonne. Ajoute un ebook d&apos;entree de gamme
            (7 - 10K FCFA), un upsell premium (coaching individuel sur un
            deal Alibaba reel, 80 - 180K FCFA), une communaute privee
            recurrente (5 - 12K FCFA/mois). Le guide{" "}
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
            equipe Novakou Lome.
          </p>

          <Accordeon items={FAQ_ITEMS.map((f) => ({ q: f.q, a: f.a }))} />
        </SectionGuide>
      </CoqueGuide>
    </>
  );
}
