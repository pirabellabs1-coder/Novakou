import type { Metadata } from "next";
import { CalendarDays, Clock } from "lucide-react";
import {
  CarteActionGuide,
  CoqueGuide,
  numeroGuide,
  SuiteGuides,
} from "@/components/formations/public/article/CoqueGuide";
import {
  Astuce,
  Attention,
  FigureGuide,
  Maquette,
  ProAstuce,
  SectionGuide,
} from "@/components/formations/public/article/EncadresGuide";
import { jsonLdSafe } from "@/lib/seo/json-ld";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://novakou.com";
const OG_IMAGE = `${APP_URL}/api/og?type=guide&title=${encodeURIComponent(
  "Créer son premier produit digital",
)}&subtitle=${encodeURIComponent(
  "De l'idée à la vente : la méthode pas-à-pas pour l'Afrique francophone",
)}`;

export const metadata: Metadata = {
  title: "Créer son premier produit digital en 2026",
  description:
    "Guide complet pour créer et vendre votre premier produit digital en Afrique francophone : formation vidéo, ebook, template. Méthode étape par étape.",
  alternates: {
    canonical: "/guides/creer-son-produit",
  },
  openGraph: {
    title: "Créer son premier produit digital en 2026 | Novakou",
    description:
      "Le guide complet pour créer, tarifer et vendre votre premier produit digital en Afrique francophone. 6 étapes concrètes, checklist incluse.",
    type: "article",
    url: `${APP_URL}/guides/creer-son-produit`,
    siteName: "Novakou",
    images: [{ url: OG_IMAGE, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Créer son premier produit digital en 2026 | Novakou",
    description:
      "Le guide complet pour créer et vendre votre premier produit digital en Afrique francophone.",
    images: [OG_IMAGE],
  },
};

/* ─── Table of Contents data ──────────────────────────────── */
const TOC = [
  { id: "introduction", label: "Introduction" },
  { id: "types-produits", label: "Les 5 types de produits les plus rentables" },
  { id: "etape-1", label: "Identifier votre expertise unique" },
  { id: "etape-2", label: "Valider votre idee avant de créer" },
  { id: "etape-3", label: "Structurer votre contenu" },
  { id: "etape-4", label: "Produire votre contenu" },
  { id: "etape-5", label: "Créer votre produit sur Novakou" },
  { id: "etape-6", label: "Fixer le prix juste" },
  { id: "checklist", label: "Checklist finale" },
  { id: "conclusion", label: "Conclusion" },
] as const;

export default function CreerSonProduitPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdSafe({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: "Créer son premier produit digital en 2026",
            description:
              "Guide étape par étape pour créer et vendre votre premier produit digital en Afrique francophone.",
            image: [OG_IMAGE],
            author: { "@type": "Person", name: "Équipe Novakou", url: APP_URL },
            publisher: {
              "@type": "Organization",
              name: "Novakou",
              url: APP_URL,
              logo: { "@type": "ImageObject", url: `${APP_URL}/icon` },
            },
            datePublished: "2026-01-15",
            dateModified: "2026-05-01",
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `${APP_URL}/guides/creer-son-produit`,
            },
            inLanguage: "fr",
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdSafe({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Accueil", item: APP_URL },
              { "@type": "ListItem", position: 2, name: "Guides", item: `${APP_URL}/guides` },
              {
                "@type": "ListItem",
                position: 3,
                name: "Créer son premier produit digital",
                item: `${APP_URL}/guides/creer-son-produit`,
              },
            ],
          }),
        }}
      />
      <CoqueGuide
        ariane={[
          { label: "Accueil", href: "/" },
          { label: "Guides", href: "/guides" },
          { label: "Créer son produit digital" },
        ]}
        eyebrow="Guide complet"
        titre={<>Comment créer son premier{" "} <em>produit digital</em> en 2026</>}
        sousTitre="Le guide étape par étape pour transformer votre savoir en un produit digital rentable. De l'idee a la premiere vente sur Novakou, découvrez la methode complete adaptee au marche africain francophone."
        auteur={{
          nom: "Equipe Novakou",
          note: "Guides et ressources pour les createurs africains",
        }}
        infos={[
          { icone: Clock, texte: "12 min de lecture" },
          { icone: CalendarDays, texte: "Mis a jour le 25 avril 2026" },
        ]}
        couverture={{
          src: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
          alt: "Créateurs africains collaborant sur leurs produits digitaux",
        }}
        sommaire={TOC.map((t, i) => ({ id: t.id, label: t.label, n: numeroGuide(i) }))}
        fin={
          <>
            <CarteActionGuide
              titre="Pret a créer votre premier produit digital ?"
              action={{ href: "/inscription?role=vendeur", libelle: "Créer mon compte vendeur gratuitement" }}
              note="10 % de commission uniquement sur vos ventes. Aucun frais cache."
            >
              <p>Rejoignez les createurs africains qui monetisent leur expertise sur Novakou. Inscription gratuite, 0 abonnement, paiements Mobile Money inclus.</p>
            </CarteActionGuide>
            <SuiteGuides
              titre="Guides complementaires"
              liens={[
                {
                  href: "/guides/vendre-en-ligne",
                  titre: "Comment vendre en ligne en Afrique",
                  resume:
                    "Stratégies de vente et marketing digital pour le marche africain francophone.",
                },
                {
                  href: "/guides/guide-complet-novakou",
                  titre: "Guide complet de Novakou",
                  resume:
                    "Tout savoir sur la plateforme : boutique, paiements, tunnels de vente et plus.",
                },
              ]}
            />
          </>
        }
      >
        <SectionGuide id="introduction" n={numeroGuide(0)} titre={<>Pourquoi créer un produit digital en Afrique en 2026</>}>
          <p>
            L&apos;Afrique francophone vit une transformation numerique sans
            precedent. Avec un nombre croissant de francophones sur le continent,
            une penetration mobile en croissance exponentielle et une classe
            moyenne de plus en plus connectee, le marche des produits digitaux
            represente une opportunite historique pour les entrepreneurs africains.
          </p>
          <p>
            Un produit digital, c&apos;est tout contenu que vous créez une fois et
            que vous vendez a l&apos;infini, sans stock, sans logistique
            physique, sans frontiere. Une formation video enregistree depuis
            Abidjan peut etre achetee par un etudiant a Dakar, un professionnel a
            Douala ou un entrepreneur a Paris. C&apos;est le modèle economique le
            plus scalable qui existe.
          </p>
          <p>
            En 2026, les chiffres parlent d&apos;eux-memes : le marche de
            l&apos;e-learning en Afrique est en pleine expansion, avec
            une croissance annuelle soutenue. Les createurs qui se positionnent
            maintenant construisent les empires de demain. Et contrairement a ce
            que beaucoup croient, vous n&apos;avez pas besoin d&apos;etre un
            expert mondial ou d&apos;avoir du materiel professionnel pour
            commencer. Vous avez besoin d&apos;une expertise reelle, d&apos;une
            methode structuree et d&apos;une plateforme adaptee a votre marche.
          </p>
          <p>
            C&apos;est exactement ce que ce guide va vous donner. En six étapes
            concretes, vous allez passer de l&apos;idee brute a un produit
            digital en vente sur Novakou, avec des paiements Mobile Money, une
            boutique professionnelle et vos premiers clients. Que vous soyez
            developpeur, designer, comptable, coach sportif, cuisiniere ou
            marketeur, votre savoir a de la valeur. Ce guide vous montre comment
            la monetiser.
          </p>

          <Maquette titre="Statistiques du marche digital africain">
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { value: "Croissant", label: "Marche francophone" },
                { value: "Milliards", label: "Marche e-learning en expansion" },
                { value: "Soutenue", label: "Croissance annuelle" },
              ].map((stat) => (
                <div key={stat.label} className="py-4">
                  <p className="text-2xl sm:text-3xl font-bold mb-1">
                    {stat.value}
                  </p>
                  <p className="text-xs">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </Maquette>
        </SectionGuide>

        <SectionGuide id="types-produits" n={numeroGuide(1)} titre={<>Les 5 types de produits digitaux les plus rentables</>}>
          <p>
            Avant de vous lancer tete baissee dans la creation, il est essentiel
            de comprendre les differents types de produits digitaux et de choisir
            celui qui correspond le mieux a votre expertise, votre audience et vos
            objectifs financiers. Voici les cinq catégories qui generent le plus
            de revenus sur le marche africain francophone en 2026.
          </p>

          <Maquette titre="Les 5 types de produits digitaux">
            <div className="space-y-4">
              {[
                {
                  icon: "1",
                  name: "Formations video",
                  desc: "Cours structures en modules et lecons. Le format roi : forte marge, scalable a l'infini.",
                  price: "15 000 - 150 000 FCFA",
                  color: "#006e2f",
                },
                {
                  icon: "2",
                  name: "Ebooks et guides PDF",
                  desc: "Guides pratiques, methodes, recettes. Rapide a créer, excellent produit d'entree de gamme.",
                  price: "3 000 - 25 000 FCFA",
                  color: "#2563eb",
                },
                {
                  icon: "3",
                  name: "Templates et ressources",
                  desc: "Modèles Canva, tableurs Excel, presets photo, templates Notion. Forte demande recurrente.",
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
                <div key={product.name} className="flex items-start gap-4 p-4 rounded-xl border" style={{ borderColor: "#e6ece8" }}>
                  <span className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: product.color }}>
                    {product.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm mb-1">
                      {product.name}
                    </p>
                    <p className="text-sm leading-relaxed mb-2">
                      {product.desc}
                    </p>
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: "#f0f6f2", color: "#006e2f" }}>
                      {product.price}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Maquette>

          <p>
            Les formations video restent le format le plus populaire et le plus
            rentable. Elles permettent de transmettre des competences de maniere
            structuree, avec un investissement initial en temps qui se rentabilise
            sur le long terme. Un bon cours peut générer des ventes pendant des
            annees sans que vous ayez a refaire quoi que ce soit.
          </p>
          <p>
            Les ebooks et guides PDF sont le meilleur point d&apos;entree. Ils
            sont rapides a créer (une a deux semaines), ne necessitent aucun
            materiel particulier, et servent souvent de produit d&apos;appel pour
            attirer des clients vers vos offres plus premium. Un guide bien
            redige sur un sujet precis, par exemple &quot;Les 20 recettes
            ivoiriennes les plus demandees en traiteur&quot;, peut se vendre des
            centaines de fois a un prix accessible.
          </p>

          <Astuce>
            <strong>Conseil strategique :</strong> Commencez par un ebook ou un
            petit template comme produit d&apos;entree, puis proposez une
            formation video complete comme produit premium. Cette approche en
            echelle vous permet de tester le marche a moindre risque avant
            d&apos;investir du temps dans un contenu plus elabore.
          </Astuce>
        </SectionGuide>

        <SectionGuide id="etape-1" n={numeroGuide(2)} titre={<>Identifier votre expertise unique</>}>
          <p>
            La premiere erreur que font la plupart des createurs debutants, c&apos;est
            de vouloir enseigner quelque chose de &quot;populaire&quot; plutot que
            quelque chose qu&apos;ils maitrisent reellement. Votre produit digital
            doit naitre a l&apos;intersection de trois cercles : ce que vous savez
            faire, ce que les gens veulent apprendre, et ce pour quoi ils sont
            prets a payer.
          </p>
          <p>
            Posez-vous ces questions fondamentales : Quel problème resolvez-vous
            regulierement pour les autres ? Quelles questions vous pose-t-on
            souvent ? Dans quel domaine avez-vous au moins deux ans
            d&apos;expérience pratique ? Quels resultats concrets avez-vous
            obtenus pour vous-meme ou pour des clients ?
          </p>
          <p>
            Vous n&apos;avez pas besoin d&apos;etre le meilleur au monde. Vous avez
            besoin d&apos;etre meilleur que votre audience cible. Un developpeur
            web avec trois ans d&apos;expérience a enormement a enseigner a
            quelqu&apos;un qui debute. Un comptable qui gere les declarations
            fiscales depuis cinq ans peut créer un guide indispensable pour les
            auto-entrepreneurs. Une cuisiniere qui maitrise la patisserie africaine
            peut transformer ses recettes en un produit digital irresistible.
          </p>

          <Maquette titre="Exercice : Trouver votre zone de genie">
            <div className="space-y-5">
              <div>
                <p className="text-sm font-semibold mb-2">
                  Repondez a ces 4 questions :
                </p>
              </div>
              {[
                "Quel problème resolvez-vous regulierement pour d'autres personnes ?",
                "Quelles competences vous ont permis d'obtenir des resultats concrets ?",
                "Sur quel sujet vos proches, collegues ou clients viennent-ils vous consulter ?",
                "Quel domaine vous passionne au point d'en parler gratuitement pendant des heures ?",
              ].map((q, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: "#f0f6f2" }}>
                  <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: "#006e2f" }}>
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm">
                      {q}
                    </p>
                    <div className="mt-2 h-8 rounded border border-dashed flex items-center px-3" style={{ borderColor: "#e6ece8" }}>
                      <span className="text-xs" style={{ color: "#5c6b62" }}>
                        Votre reponse...
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Maquette>

          <Attention>
            <strong>Piege a eviter :</strong> Ne choisissez pas un sujet
            uniquement parce qu&apos;il est tendance. Si vous n&apos;avez pas
            d&apos;expérience reelle en trading de crypto-monnaies, ne créez pas
            un cours sur le trading. Votre manque d&apos;expertise se verra
            rapidement, et votre reputation en souffrira. L&apos;authenticite est
            votre meilleur atout.
          </Attention>
        </SectionGuide>

        <SectionGuide id="etape-2" n={numeroGuide(3)} titre={<>Valider votre idee avant de créer</>}>
          <p>
            C&apos;est l&apos;étape que 80 % des createurs sautent, et c&apos;est
            souvent la raison pour laquelle leur produit ne se vend pas. Valider
            votre idee signifie s&apos;assurer que des personnes reelles sont
            pretes a payer pour la solution que vous proposez, avant
            d&apos;investir des semaines dans la creation du contenu.
          </p>
          <p>
            Voici la methode de validation gratuite en quatre actions concretes.
            Premierement, identifiez votre audience cible avec precision.
            &quot;Tout le monde&quot; n&apos;est pas une audience. Definissez qui
            est votre acheteur ideal : age, pays, profession, niveau
            d&apos;experience, problème principal. Par exemple : &quot;Femmes
            entrepreneures en Cote d&apos;Ivoire, 25-40 ans, qui veulent lancer
            un business de traiteur mais ne savent pas gérer la comptabilite.&quot;
          </p>
          <p>
            Deuxiemement, allez la ou votre audience se trouve. Rejoignez les
            groupes Facebook, les chaines Telegram, les forums et les communautes
            WhatsApp ou vos clients potentiels echangent. Observez les questions
            qu&apos;ils posent, les problèmes qu&apos;ils partagent, les solutions
            qu&apos;ils cherchent. Notez les mots exacts qu&apos;ils utilisent :
            ce sera votre vocabulaire de vente.
          </p>
          <p>
            Troisiemement, proposez un contenu gratuit qui teste l&apos;interet.
            Publiez un article de blog, une video YouTube, un post LinkedIn ou un
            thread Twitter qui aborde un aspect de votre sujet. Si ce contenu
            genere de l&apos;engagement, des commentaires, des partages et des
            questions du type &quot;Tu proposes une formation la-dessus ?&quot;,
            vous tenez quelque chose.
          </p>
          <p>
            Quatriemement, faites une pre-vente. Créez une page simple qui
            presente votre produit a venir avec un prix et un bouton de
            pre-commande. Si des gens paient avant meme que le produit existe,
            vous avez la validation ultime. Novakou vous permet de créer cette
            page de pre-lancement en quelques minutes.
          </p>

          <Maquette titre="Template de page de pre-lancement">
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "#f0f6f2" }}>
                <span className="text-2xl" style={{ color: "#006e2f" }}>
                  *
                </span>
              </div>
              <p className="text-lg font-bold mb-2">
                [Titre de votre produit]
              </p>
              <p className="text-sm mb-4 max-w-sm mx-auto">
                [Description en une phrase du bénéfice principal pour votre client]
              </p>
              <div className="inline-block px-4 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: "#f0f6f2", color: "#006e2f" }}>
                15 000 FCFA au lieu de 25 000 FCFA (prix de lancement)
              </div>
              <div className="mt-4">
                <span className="inline-block px-6 py-3 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: "#006e2f" }}>
                  Je pre-commande maintenant
                </span>
              </div>
              <p className="text-xs mt-3">
                Lancement prevu le [date] - Places limitees
              </p>
            </div>
          </Maquette>

          <ProAstuce>
            <strong>Astuce des pros :</strong> Fixez un objectif de validation
            clair avant de commencer. Par exemple : &quot;Si j&apos;obtiens 20
            pre-commandes en 7 jours, je cree le produit. Sinon, je pivote.&quot;
            Cette discipline vous evitera de passer des mois sur un produit que
            personne ne veut.
          </ProAstuce>
        </SectionGuide>

        <SectionGuide id="etape-3" n={numeroGuide(4)} titre={<>Structurer votre contenu</>}>
          <p>
            La structure de votre produit digital est ce qui fait la difference
            entre un contenu que les gens consomment jusqu&apos;au bout et un
            contenu qu&apos;ils abandonnent après le premier chapitre. Une bonne
            structure suit un arc de progression : vous partez du point A (ou se
            trouve votre client aujourd&apos;hui) pour l&apos;amener au point B
            (le resultat qu&apos;il desire).
          </p>
          <p>
            Pour une formation video, organisez votre contenu en modules et
            lecons. Chaque module couvre un theme majeur. Chaque lecon traite un
            sous-sujet precis et dure idealement entre 5 et 15 minutes. Les
            apprenants preferent des lecons courtes et focalisees plutot que de
            longues sessions. Prevoyez un module d&apos;introduction qui pose le
            contexte et un module final qui recapitule et donne les prochaines
            étapes.
          </p>
          <p>
            Pour un ebook, pensez en chapitres avec une progression logique.
            Commencez par le problème, expliquez les concepts cles, puis donnez
            les étapes d&apos;action. Chaque chapitre doit se terminer par un
            resume ou un exercice pratique. Un bon ebook fait entre 30 et 80
            pages, pas besoin d&apos;ecrire un roman.
          </p>

          <Maquette titre="Exemple de structure : Formation 'Lancer son e-commerce'">
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
                  title: "Créer votre boutique en ligne",
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
                <div key={m.module} className="flex items-center gap-4 p-3 rounded-lg border" style={{ borderColor: "#e6ece8" }}>
                  <span className="flex-shrink-0 px-2.5 py-1 rounded text-xs font-bold text-white" style={{ backgroundColor: "#006e2f" }}>
                    {m.module}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {m.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs flex-shrink-0" style={{ color: "#5c6b62" }}>
                    <span>{m.lessons} lecons</span>
                    <span className="px-2 py-0.5 rounded" style={{ backgroundColor: "#f0f6f2" }}>
                      {m.duration}
                    </span>
                  </div>
                </div>
              ))}
              <div className="pt-2 flex items-center justify-between text-sm px-1">
                <span className="font-semibold" style={{ color: "#0e1512" }}>
                  Total : 27 lecons
                </span>
                <span style={{ color: "#006e2f" }} className="font-bold">
                  5h45 de contenu
                </span>
              </div>
            </div>
          </Maquette>

          <Astuce>
            <strong>Regle du &quot;Quick Win&quot; :</strong> Placez un resultat
            rapide et concret dans les premieres lecons. Si votre apprenant obtient
            un petit succes des le debut, il sera motive pour continuer. Par
            exemple, dans une formation sur le design graphique, faites-lui créer
            un logo simple des la lecon 3.
          </Astuce>
        </SectionGuide>

        <SectionGuide id="etape-4" n={numeroGuide(5)} titre={<>Produire votre contenu</>}>
          <p>
            C&apos;est l&apos;étape qui bloque le plus de createurs, souvent
            parce qu&apos;ils pensent avoir besoin de materiel professionnel
            couteux. La realite ? Les meilleurs produits digitaux vendus en
            Afrique francophone en 2026 sont souvent crees avec un smartphone et
            des outils gratuits. Ce qui compte, c&apos;est la qualité du contenu,
            pas la qualité de la production.
          </p>

          {/* Image: setup d'enregistrement minimaliste */}
          <FigureGuide
            src="https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=900&q=80"
            alt="Un micro professionnel — l'audio est plus important que la vidéo"
            legende="Un micro-cravate à 5 000 FCFA + votre smartphone = un setup professionnel. L'audio prime sur la vidéo."
          />

          <h3>
            Pour les formations video
          </h3>
          <p>
            Utilisez votre smartphone avec un trepied basique (2 000 a 5 000 FCFA
            sur le marche). Filmez dans un endroit calme avec un bon eclairage
            naturel, face a une fenetre. L&apos;audio est plus important que la
            video : investissez dans un micro-cravate a 5 000 FCFA, cela change
            tout. Pour les tutoriels logiciels, utilisez OBS Studio (gratuit) pour
            enregistrer votre ecran. Montez vos videos avec CapCut (gratuit sur
            mobile) ou DaVinci Resolve (gratuit sur PC).
          </p>

          <h3>
            Pour les ebooks et guides PDF
          </h3>
          <p>
            Redigez dans Google Docs ou Notion, puis mettez en page avec Canva
            (version gratuite suffisante). Canva propose des centaines de
            templates de ebooks professionnels. Ajoutez des visuels, des
            infographies, des captures d&apos;ecran et des schemas pour rendre
            votre contenu plus digeste. Exportez en PDF haute qualité. Un bon
            ebook fait entre 30 et 80 pages avec une mise en page aeree.
          </p>

          <h3>
            Pour les templates et ressources
          </h3>
          <p>
            Créez vos templates dans l&apos;outil natif (Canva pour les designs,
            Google Sheets ou Excel pour les tableurs, Notion pour les systèmes
            d&apos;organisation). Assurez-vous que vos templates sont faciles a
            personnaliser et incluez un guide d&apos;utilisation rapide.
            L&apos;expérience utilisateur de votre template est aussi importante
            que son contenu.
          </p>

          <Maquette titre="Kit de production minimaliste">
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
                <div key={kit.cat} className="p-4 rounded-xl" style={{ backgroundColor: "#f0f6f2" }}>
                  <p className="text-sm font-bold mb-3">
                    {kit.cat}
                  </p>
                  <ul className="space-y-2">
                    {kit.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: "#4c9a6b" }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 rounded-lg text-center text-sm font-semibold" style={{ backgroundColor: "#f0f6f2", color: "#006e2f" }}>
              Budget total de demarrage : 7 000 - 10 000 FCFA
            </div>
          </Maquette>

          <Attention>
            <strong>Attention a la paralysie du perfectionnisme :</strong> Votre
            premier produit ne sera pas parfait, et c&apos;est normal. Il vaut
            mieux un produit lance a 80 % qu&apos;un produit parfait qui ne sort
            jamais. Vous pourrez toujours l&apos;ameliorer après les premiers
            retours clients. Les createurs qui reussissent sont ceux qui lancent,
            pas ceux qui perfectionnent indefiniment.
          </Attention>
        </SectionGuide>

        <SectionGuide id="etape-5" n={numeroGuide(6)} titre={<>Créer votre produit sur Novakou</>}>
          <p>
            Une fois votre contenu pret, il est temps de le mettre en vente sur
            Novakou. La plateforme a ete concue pour que le processus soit le
            plus simple possible, meme si vous n&apos;avez aucune expérience
            technique. Voici les étapes detaillees pour créer votre produit.
          </p>

          {/* Image: plateforme en action */}
          <FigureGuide
            src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=900&q=80"
            alt="Un entrepreneur africain gère sa boutique en ligne depuis son ordinateur"
            legende="Gérez votre boutique, vos formations et vos ventes depuis votre tableau de bord Novakou."
          />

          <h3>
            1. Créez votre compte vendeur
          </h3>
          <p>
            Rendez-vous sur Novakou et inscrivez-vous en tant que vendeur.
            L&apos;inscription prend moins de 2 minutes : votre nom, votre email,
            un mot de passe. Vous confirmez votre email avec un code de
            vérification, et votre espace vendeur est pret. Aucun abonnement
            n&apos;est requis : Novakou fonctionne a la commission (10 % par
            vente), ce qui signifie que vous ne payez que quand vous gagnez.
          </p>

          <Maquette titre="novakou.com - Inscription vendeur">
            <div className="max-w-sm mx-auto py-2">
              <div className="text-center mb-6">
                <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center font-bold text-white text-lg" style={{ backgroundColor: "#006e2f" }}>
                  N
                </div>
                <p className="text-sm font-bold">
                  Créer votre compte vendeur
                </p>
              </div>
              <div className="space-y-3">
                {["Nom complet", "Adresse email", "Mot de passe"].map(
                  (field) => (
                    <div key={field}>
                      <p className="text-xs font-medium mb-1">
                        {field}
                      </p>
                      <div className="h-10 rounded-lg border" style={{ borderColor: "#e6ece8" }} />
                    </div>
                  )
                )}
                <div className="h-11 rounded-xl flex items-center justify-center text-sm font-bold text-white mt-4" style={{ backgroundColor: "#006e2f" }}>
                  Créer mon compte
                </div>
                <p className="text-xs text-center">
                  0 FCFA / mois - 10 % de commission par vente
                </p>
              </div>
            </div>
          </Maquette>

          <h3>
            2. Complétez votre profil vendeur
          </h3>
          <p>
            Un profil complet inspire confiance. Ajoutez une photo
            professionnelle, redigez une bio qui explique votre expertise et vos
            resultats, ajoutez vos liens vers vos reseaux sociaux. Les acheteurs
            veulent savoir de qui ils apprennent. Un profil avec photo et bio
            complete genere en moyenne 3 fois plus de ventes qu&apos;un profil
            vide.
          </p>

          <h3>
            3. Créez votre produit
          </h3>
          <p>
            Depuis votre tableau de bord, cliquez sur &quot;Nouveau produit&quot;.
            Vous arrivez sur un assistant de creation en étapes qui vous guide a
            travers toute la configuration.
          </p>
          <p>
            Commencez par choisir le type de produit (formation, ebook, template,
            coaching). Ensuite, remplissez le titre (accrocheur et clair sur le
            bénéfice), la description detaillee (utilisez le vocabulaire de votre
            audience), la catégorie et les tags pertinents. Ajoutez une image de
            couverture attractive — c&apos;est la premiere chose que vos clients
            potentiels verront.
          </p>

          <Maquette titre="novakou.com/tableau-de-bord - Créer un produit">
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-2">
                {["Type", "Details", "Contenu", "Prix", "Publication"].map(
                  (step, i) => (
                    <div key={step} className="flex items-center gap-2">
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: i === 1 ? "#006e2f" : i < 1 ? "#4c9a6b" : "#e6ece8", color: i > 1 ? "#5c6b62" : "#ffffff" }}
                      >
                        {i + 1}
                      </span>
                      <span
                        className="text-xs hidden sm:inline"
                        style={{ color: i <= 1 ? "#0e1512" : "#5c6b62" }}
                      >
                        {step}
                      </span>
                    </div>
                  )
                )}
              </div>
              <div className="h-px w-full" style={{ backgroundColor: "#e6ece8" }} />
              <div>
                <p className="text-xs font-medium mb-1">
                  Titre du produit
                </p>
                <div className="h-10 rounded-lg border px-3 flex items-center text-sm" style={{ borderColor: "#4c9a6b", color: "#0e1512" }}>
                  Lancer son e-commerce en Afrique : Guide complet
                </div>
              </div>
              <div>
                <p className="text-xs font-medium mb-1">
                  Description
                </p>
                <div className="h-24 rounded-lg border" style={{ borderColor: "#e6ece8" }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-medium mb-1">
                    Catégorie
                  </p>
                  <div className="h-10 rounded-lg border flex items-center px-3 text-sm" style={{ borderColor: "#e6ece8", color: "#0e1512" }}>
                    Business & Entrepreneuriat
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium mb-1">
                    Type
                  </p>
                  <div className="h-10 rounded-lg border flex items-center px-3 text-sm" style={{ borderColor: "#e6ece8", color: "#0e1512" }}>
                    Formation video
                  </div>
                </div>
              </div>
            </div>
          </Maquette>

          <h3>
            4. Uploadez votre contenu
          </h3>
          <p>
            Pour une formation video, uploadez vos videos lecon par lecon dans
            l&apos;ordre. Novakou prend en charge le streaming, la protection et
            l&apos;hebergement de vos fichiers. Pour un ebook, uploadez votre PDF.
            Pour des templates, uploadez vos fichiers dans le format natif (les
            acheteurs pourront les télécharger). Ajoutez eventuellement des bonus
            (worksheets, checklists, ressources complementaires) pour augmenter la
            valeur percue.
          </p>

          <h3>
            5. Configurez vos paiements
          </h3>
          <p>
            Novakou accepte les paiements par Mobile Money (Orange Money, Wave,
            MTN), carte bancaire et virement. Vos acheteurs choisissent le moyen
            qui leur convient. Vous recevez vos gains directement sur votre
            compte Mobile Money ou votre compte bancaire, selon votre préférence.
            Les fonds sont disponibles sous 48 heures après chaque vente.
          </p>

          <Astuce>
            <strong>Fonctionnalité Novakou :</strong> La plateforme genere
            automatiquement votre boutique en ligne avec une URL personnalisee
            (novakou.com/votre-nom). Vous pouvez partager ce lien sur vos reseaux
            sociaux, dans vos emails et partout ou vous avez une audience. Pas
            besoin de créer un site web separe.
          </Astuce>
        </SectionGuide>

        <SectionGuide id="etape-6" n={numeroGuide(7)} titre={<>Fixer le prix juste</>}>
          <p>
            Le pricing est l&apos;un des aspects les plus strategiques de votre
            produit digital. Trop bas, vous devalorisez votre travail et attirez
            des clients peu engages. Trop haut, vous bloquez l&apos;acces a votre
            audience. Le bon prix se situe a l&apos;intersection de la valeur
            percue, du pouvoir d&apos;achat de votre marche cible et du
            positionnement que vous souhaitez adopter.
          </p>
          <p>
            Voici la grille de pricing recommandee pour le marche africain
            francophone, basee sur les donnees des createurs les plus performants
            sur Novakou. Ces fourchettes tiennent compte du pouvoir d&apos;achat
            local tout en valorisant correctement le travail du createur.
          </p>

          <Maquette titre="Grille de pricing recommandee">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ color: "#0e1512" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f0f6f2" }}>
                    <th className="text-left p-3 rounded-tl-lg font-semibold">Type</th>
                    <th className="text-left p-3 font-semibold">Entree</th>
                    <th className="text-left p-3 font-semibold">Standard</th>
                    <th className="text-left p-3 rounded-tr-lg font-semibold">Premium</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "#e6ece8" }}>
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
                      <td className="p-3" style={{ color: "#5c6b62" }}>{row.low}</td>
                      <td className="p-3 font-semibold" style={{ color: "#006e2f" }}>{row.mid}</td>
                      <td className="p-3" style={{ color: "#5c6b62" }}>{row.high}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Maquette>

          <p>
            La stratégie du &quot;prix de lancement&quot; est très efficace sur le
            marche africain. Proposez votre produit a prix reduit pendant la
            premiere semaine (par exemple, -40 %) pour créer un effet
            d&apos;urgence et obtenir vos premiers avis clients. Ces avis sont
            essentiels : ils rassurent les futurs acheteurs et augmentent
            significativement votre taux de conversion. Après la période de
            lancement, passez au prix standard.
          </p>

          <ProAstuce>
            <strong>Stratégie de pricing avancée&nbsp;:</strong> Proposez plusieurs
            niveaux de votre produit. Par exemple, pour une formation : le cours
            video seul a 25 000 FCFA, le cours + les templates a 40 000 FCFA, le
            cours + les templates + une session de coaching individuel a 100 000
            FCFA. 70 % des acheteurs choisiront l&apos;option du milieu, et vous
            augmenterez votre panier moyen de 40 a 60 %.
          </ProAstuce>

          <Attention>
            <strong>Ne sous-estimez pas votre valeur :</strong> Un piege courant
            en Afrique francophone est de fixer des prix trop bas &quot;parce que
            le pouvoir d&apos;achat est faible&quot;. En realite, les personnes
            qui investissent dans leur formation sont pretes a payer un prix juste
            pour un contenu de qualité. Un produit a 3 000 FCFA est souvent percu
            comme ayant moins de valeur qu&apos;un produit a 15 000 FCFA, meme si
            le contenu est identique.
          </Attention>
        </SectionGuide>

        <SectionGuide id="checklist" n={numeroGuide(8)} titre={<>Checklist finale avant publication</>}>
          <p>
            Avant d&apos;appuyer sur le bouton &quot;Publier&quot;, passez en
            revue cette checklist. Chaque point est important pour maximiser vos
            chances de succes des le premier jour. Un produit bien prepare se vend
            mieux qu&apos;un produit lance dans la precipitation.
          </p>

          <Maquette titre="Checklist de publication">
            <div className="space-y-3">
              {[
                {
                  cat: "Contenu",
                  items: [
                    "Le contenu est complet et couvre le sujet annonce",
                    "Chaque lecon/chapitre a ete relu et corrige",
                    "Les visuels sont de bonne qualité (pas flous, bien eclaires)",
                    "L'audio est clair et audible (pour les videos)",
                    "Un bonus est inclus (checklist, template, ressource)",
                  ],
                },
                {
                  cat: "Page de vente",
                  items: [
                    "Le titre est accrocheur et explique le bénéfice principal",
                    "La description detaille ce que l'acheteur va apprendre",
                    "L'image de couverture est professionnelle et attractive",
                    "Le prix est fixe selon la grille de pricing recommandee",
                    "La catégorie et les tags sont correctement renseignes",
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
                  <p className="text-sm font-bold mb-2 px-1">
                    {section.cat}
                  </p>
                  <div className="space-y-1.5">
                    {section.items.map((item) => (
                      <div key={item} className="flex items-start gap-3 p-2.5 rounded-lg" style={{ backgroundColor: "#f0f6f2" }}>
                        <span className="flex-shrink-0 w-5 h-5 rounded border-2 mt-0.5" style={{ borderColor: "#4c9a6b" }} />
                        <span className="text-sm" style={{ color: "#0e1512" }}>
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Maquette>

          <Astuce>
            <strong>Testez avant de lancer :</strong> Demandez a 3 a 5 personnes
            de confiance (idealement des personnes qui correspondent a votre
            audience cible) de parcourir votre produit avant la publication.
            Leurs retours vous permettront de corriger les dernieres
            imperfections et d&apos;ameliorer l&apos;experience. Offrez-leur
            l&apos;acces gratuit en echange de leur avis honnete.
          </Astuce>
        </SectionGuide>

        <SectionGuide id="conclusion" n={numeroGuide(9)} titre={<>Votre produit digital vous attend</>}>
          <p>
            Vous venez de parcourir les six étapes essentielles pour créer et
            vendre votre premier produit digital. De l&apos;identification de
            votre expertise a la fixation du prix juste, chaque étape a ete
            concue pour vous rapprocher d&apos;un objectif concret : transformer
            votre savoir en revenus.
          </p>
          <p>
            Le marche africain francophone est en pleine expansion, et les
            createurs qui se positionnent maintenant ont un avantage considerable.
            Chaque jour que vous attendez, c&apos;est un jour ou quelqu&apos;un
            d&apos;autre cree le produit que vous aviez en tete. La difference
            entre ceux qui reussissent et ceux qui restent spectateurs, ce
            n&apos;est pas le talent ou les moyens : c&apos;est l&apos;action.
          </p>
          <p>
            Novakou a ete construit pour vous faciliter la tache. Zero
            abonnement, paiements Mobile Money integres, boutique professionnelle
            generee automatiquement, tunnels de vente et outils marketing inclus.
            Tout ce dont vous avez besoin pour vendre en Afrique francophone est
            déjà la. Il ne reste qu&apos;une chose a faire : vous lancer.
          </p>
          <p className="text-[16px] leading-[1.8] mb-8">
            Reprenez ce guide depuis le debut. Repondez aux questions de
            l&apos;étape 1. Validez votre idee avec l&apos;étape 2. Structurez
            votre contenu. Produisez-le avec les outils gratuits que nous avons
            listes. Créez votre compte vendeur sur Novakou. Et publiez.
            Aujourd&apos;hui, pas demain.
          </p>
        </SectionGuide>
      </CoqueGuide>
    </>
  );
}
