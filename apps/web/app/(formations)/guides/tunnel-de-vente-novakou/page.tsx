import type { Metadata } from "next";
import { Clock } from "lucide-react";
import Image from "next/image";
import { OldGuideJsonLd } from "@/components/formations/OldGuideJsonLd";
import {
  CarteActionGuide,
  CoqueGuide,
  numeroGuide,
  SuiteGuides,
} from "@/components/formations/public/article/CoqueGuide";
import {
  Astuce,
  Attention,
  Etape,
  ProAstuce,
  SectionGuide,
} from "@/components/formations/public/article/EncadresGuide";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://novakou.com";
const OG_IMAGE = `${APP_URL}/api/og?type=guide&title=${encodeURIComponent(
  "Tunnel de vente Afrique formation",
)}&subtitle=${encodeURIComponent(
  "Capture, vente, checkout Mobile Money, upsell : le guide complet",
)}`;

export const metadata: Metadata = {
  title: "Tunnel de vente Afrique formation 2026",
  description:
    "Construisez un tunnel de vente performant sur Novakou pour vendre vos formations en Afrique : capture, vente, checkout Mobile Money, upsell.",
  keywords: [
    "tunnel de vente Novakou",
    "funnel vente formation en ligne Afrique",
    "créer tunnel de vente Afrique francophone",
    "page de vente formation",
    "entonnoir conversion Novakou",
    "vendre formations en ligne Sénégal",
  ],
  alternates: {
    canonical: "/guides/tunnel-de-vente-novakou",
  },
  openGraph: {
    title: "Tunnel de vente Afrique formation 2026 | Novakou",
    description:
      "Construisez un tunnel de vente qui convertit pour vendre vos formations et produits digitaux en Afrique francophone.",
    type: "article",
    url: `${APP_URL}/guides/tunnel-de-vente-novakou`,
    siteName: "Novakou",
    images: [{ url: OG_IMAGE, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tunnel de vente Afrique formation 2026 | Novakou",
    description:
      "Le guide complet pour construire un tunnel de vente qui convertit en Afrique francophone.",
    images: [OG_IMAGE],
  },
};

export default function TunnelDeVenteNovakou() {
  return (
    <>
      <OldGuideJsonLd slug="tunnel-de-vente-novakou" />
      <CoqueGuide
        ariane={[
          { label: "Accueil", href: "/" },
          { label: "Guides", href: "/guides" },
          { label: "Tunnel de vente Novakou" },
        ]}
        eyebrow="Vente & Stratégie"
        titre={<>Tunnel de vente sur Novakou :{" "} <em>le guide complet étape par étape</em></>}
        sousTitre="Un tunnel de vente bien construit transforme un inconnu en acheteur fidèle de façon systématique. Ce guide vous montre comment en construire un efficace sur Novakou — de la première impression jusqu'au client récurrent, en passant par chaque étape de conversion."
        infos={[{ icone: Clock, texte: "15 min de lecture · Niveau intermédiaire" }]}
        couverture={{
          src: "https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=900&auto=format&fit=crop&q=80",
          alt: "Tunnel de vente stratégie marketing",
          legende: "Un tunnel bien construit = des ventes prévisibles, jour après jour",
        }}
        chiffres={[
          { valeur: "3×", libelle: "plus de revenus avec un tunnel complet vs page de vente simple" },
          { valeur: "68%", libelle: "des créateurs Novakou n'ont pas encore de vrai tunnel de vente" },
          { valeur: "20 min", libelle: "pour configurer un tunnel basique mais fonctionnel sur Novakou" },
        ]}
        titreSommaire="Dans ce guide"
        sommaire={[
          { id: "comprendre", label: "Qu'est-ce qu'un tunnel de vente et pourquoi en avoir un ?", n: numeroGuide(0) },
          { id: "anatomie", label: "Anatomie d'un tunnel Novakou performant", n: numeroGuide(1) },
          { id: "trafic", label: "Étape 1 — Attirer le bon trafic", n: numeroGuide(2) },
          { id: "lead-magnet", label: "Étape 2 — Capturer des contacts (lead magnet)", n: numeroGuide(3) },
          { id: "page-vente", label: "Étape 3 — La page de vente qui convertit", n: numeroGuide(4) },
          { id: "checkout", label: "Étape 4 — Optimiser la page de paiement", n: numeroGuide(5) },
          { id: "post-achat", label: "Étape 5 — La séquence post-achat", n: numeroGuide(6) },
          { id: "upsell", label: "Étape 6 — Upsell et ascension client", n: numeroGuide(7) },
          { id: "retargeting", label: "Étape 7 — Retargeting et récupération", n: numeroGuide(8) },
          { id: "optimiser", label: "Optimiser et scaler votre tunnel", n: numeroGuide(9) },
          { id: "exemple-complet", label: "Exemple de tunnel complet : de 0 à 500 000 FCFA/mois", n: numeroGuide(10) },
          { id: "erreurs", label: "Les erreurs classiques qui tuent les conversions", n: numeroGuide(11) },
        ]}
        fin={
          <>
            <CarteActionGuide
              titre="Construisez votre tunnel de vente maintenant"
              actions={[
                { href: "/inscription", libelle: "Créer mon compte gratuit" },
                { href: "/guides/automatisations-novakou", libelle: "Guide : Automatisations →" },
              ]}
            >
              <p>Novakou fournit tous les outils pour créer votre tunnel complet : pages de vente, checkout, emails, upsells. Commencez gratuitement.</p>
            </CarteActionGuide>
            <SuiteGuides
              titre="Poursuivez votre lecture"
              liens={[
                {
                  href: "/guides/automatisations-novakou",
                  etiquette: "← Guide précédent",
                  titre: "Automatisations Novakou",
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
        <SectionGuide id="comprendre" n={numeroGuide(0)} titre={<>Qu'est-ce qu'un tunnel de vente et pourquoi en avoir un ?</>}>
          <p className="text-[17px] leading-relaxed mb-6">
            Un tunnel de vente (ou funnel) est le chemin structuré que parcourt un
            visiteur inconnu jusqu'à devenir un client fidèle. C'est l'opposé de
            "j'ai posté sur Facebook et j'espère que ça vend" — c'est un
            système prévisible où chaque étape est pensée pour faire avancer le
            visiteur vers l'achat.
          </p>

          <p className="text-[17px] leading-relaxed mb-6">
            Sans tunnel, vous êtes dépendant du hasard. Vous publiez, des gens
            voient, certains achètent, vous ne savez pas pourquoi. Avec un tunnel,
            vous savez que pour 100 personnes qui entrent au sommet, X finissent
            par acheter. Vous pouvez prévoir vos revenus, identifier les fuites,
            et scaler ce qui fonctionne.
          </p>

          <Astuce>
            <strong>La métaphore du tunnel :</strong> large en haut (beaucoup de
            visiteurs entrent), étroit en bas (seuls les plus motivés achètent).
            Votre travail est de rendre le tunnel le plus large possible à chaque
            étage — c'est ce qu'on appelle l'optimisation du taux de conversion.
          </Astuce>

          {/* 2 */}
        </SectionGuide>

        <SectionGuide id="anatomie" n={numeroGuide(1)} titre={<>Anatomie d'un tunnel Novakou performant</>}>
          <p className="text-[17px] leading-relaxed mb-8">
            Un tunnel Novakou complet comporte 7 étapes. Chacune a un rôle précis
            et des métriques associées. Vous n'avez pas besoin d'avoir les 7 dès
            le départ — commencez avec les étapes 3 à 5, puis ajoutez les autres.
          </p>

          <div className="my-8">
            <Etape n={1} picto="📡" libelle="ÉTAPE 1" titre="Trafic" kpi="📊 Objectif : 300+ visiteurs/mois sur votre page">
              <p>{"Visiteurs depuis les réseaux sociaux, Google, bouche-à-oreille, publicités payantes."}</p>
            </Etape>
            <Etape n={2} picto="🎁" libelle="ÉTAPE 2" titre="Lead Magnet" kpi="📊 Objectif : 20-40% des visiteurs laissent leur email">
              <p>{"Ressource gratuite pour capturer l'email du visiteur avant même qu'il achète."}</p>
            </Etape>
            <Etape n={3} picto="📄" libelle="ÉTAPE 3" titre="Page de vente" kpi="📊 Objectif : 2-5% des visiteurs achètent">
              <p>{"Présentation complète de votre formation : bénéfices, programme, prix, témoignages."}</p>
            </Etape>
            <Etape n={4} picto="💳" libelle="ÉTAPE 4" titre="Page de paiement" kpi="📊 Objectif : 60-70% des clics 'Acheter' finalisent le paiement">
              <p>{"Checkout optimisé avec tous les moyens de paiement africains disponibles."}</p>
            </Etape>
            <Etape n={5} picto="🎉" libelle="ÉTAPE 5" titre="Post-achat" kpi="📊 Objectif : 25-35% acceptent l'order bump">
              <p>{"Email de bienvenue, accès immédiat, bonus surprise, offre complémentaire."}</p>
            </Etape>
            <Etape n={6} picto="⬆️" libelle="ÉTAPE 6" titre="Upsell" kpi="📊 Objectif : 10-20% des acheteurs montent en gamme">
              <p>{"Offre premium proposée aux acheteurs les plus engagés (coaching, avancé, mastermind)."}</p>
            </Etape>
            <Etape n={7} picto="🔄" libelle="ÉTAPE 7" titre="Fidélisation" kpi="📊 Objectif : 40% des clients achètent une 2ème formation">
              <p>{"Communauté, nouvelles formations, offres exclusives pour garder le client sur le long terme."}</p>
            </Etape>
          </div>

          {/* 3 */}
        </SectionGuide>

        <SectionGuide id="trafic" n={numeroGuide(2)} titre={<>Étape 1 — Attirer le bon trafic</>}>
          <p className="text-[17px] leading-relaxed mb-6">
            Le trafic est le carburant de votre tunnel. Sans visiteurs, les
            meilleures pages de vente du monde ne génèrent rien. Mais tous les
            trafics ne se valent pas — mieux vaut 100 visiteurs qualifiés que
            1 000 curieux sans intention d'achat.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 my-8">
            {[
              {
                type: "Trafic organique",
                sources: ["Posts Instagram/TikTok réguliers", "Groupes Facebook de votre niche", "YouTube ou podcasts", "SEO Google (long terme)"],
                cost: "0 FCFA, investissement temps",
                timeToResult: "2-6 mois",
                recommended: true,
              },
              {
                type: "Trafic payant",
                sources: ["Facebook & Instagram Ads", "Google Ads", "Influenceurs de niche", "Partenariats créateurs"],
                cost: "15 000 FCFA/semaine minimum",
                timeToResult: "Immédiat",
                recommended: false,
              },
            ].map((t) => (
              <div key={t.type} className="rounded-2xl border p-5" style={{ borderColor: t.recommended ? "#4c9a6b" : "#e6ece8", borderWidth: t.recommended ? 2 : 1 }}>
                {t.recommended && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white mb-3 inline-block" style={{ backgroundColor: "#006e2f" }}>
                    ★ Recommandé pour débuter
                  </span>
                )}
                <h3 className="font-bold text-base mb-3">{t.type}</h3>
                <ul className="space-y-1.5 mb-4">
                  {t.sources.map((s) => (
                    <li key={s} className="text-sm flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: "#4c9a6b" }} />
                      {s}
                    </li>
                  ))}
                </ul>
                <div className="text-xs space-y-1">
                  <p><span className="font-semibold" style={{ color: "#0e1512" }}>Coût :</span> <span style={{ color: "#5c6b62" }}>{t.cost}</span></p>
                  <p><span className="font-semibold" style={{ color: "#0e1512" }}>Résultats :</span> <span style={{ color: "#5c6b62" }}>{t.timeToResult}</span></p>
                </div>
              </div>
            ))}
          </div>

          <Attention>
            <strong>Ne payez pas de publicité avant d'avoir validé votre tunnel :</strong> beaucoup
            de créateurs brûlent 50 000 FCFA en Facebook Ads sans avoir de page de
            vente optimisée. Résultat : trafic payant → page qui ne convertit pas
            → argent perdu. Validez d'abord organiquement, puis scalez avec du payant.
          </Attention>

          {/* 4 */}
        </SectionGuide>

        <SectionGuide id="lead-magnet" n={numeroGuide(3)} titre={<>Étape 2 — Capturer des contacts (lead magnet)</>}>
          <p className="text-[17px] leading-relaxed mb-6">
            La majorité des visiteurs ne sont pas prêts à acheter lors de leur
            première visite. Le lead magnet est une ressource gratuite que vous
            offrez en échange de l'adresse email du visiteur. Cela vous permet de
            construire une liste et de les convertir progressivement via vos
            emails.
          </p>

          <p className="text-[17px] leading-relaxed mb-6">
            Les meilleurs lead magnets en Afrique francophone sont courts,
            actionnables et résolvent un problème précis en 15 minutes ou moins :
          </p>

          <div className="grid sm:grid-cols-2 gap-4 my-8">
            {[
              { format: "PDF checklist", exemple: "Les 10 étapes pour créer sa première formation en ligne", perf: "Très haut" },
              { format: "Vidéo de 10 min", exemple: "Comment j'ai gagné 200 000 FCFA avec une formation en 30 jours", perf: "Haut" },
              { format: "Template gratuit", exemple: "Le template Canva pour créer votre page de vente", perf: "Très haut" },
              { format: "Mini-formation (3 emails)", exemple: "3 jours pour valider votre idée de formation", perf: "Haut" },
              { format: "Ebook / guide PDF", exemple: "Le guide complet de la vente en ligne en Afrique", perf: "Moyen" },
              { format: "Quiz", exemple: "Quel type de produit digital est fait pour vous ?", perf: "Haut" },
            ].map((lm) => (
              <div key={lm.format} className="flex items-start gap-3 rounded-xl border p-4" style={{ borderColor: "#e6ece8" }}>
                <div>
                  <p className="font-bold text-sm mb-1">{lm.format}</p>
                  <p className="text-xs mb-2">{lm.exemple}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: lm.perf === "Très haut" ? "#f0f6f2" : "#f0f6f2", color: lm.perf === "Très haut" ? "#006e2f" : "#5c6b62" }}>
                    Taux d'opt-in : {lm.perf}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* 5 */}
        </SectionGuide>

        <SectionGuide id="page-vente" n={numeroGuide(4)} titre={<>Étape 3 — La page de vente qui convertit</>}>
          <p className="text-[17px] leading-relaxed mb-6">
            Votre page de vente est le cœur de votre tunnel. C'est ici que le
            visiteur décide d'acheter ou de partir. Une bonne page de vente
            répond aux questions dans l'ordre précis où l'acheteur se les pose.
            Ne sautez aucune étape.
          </p>

          <div className="rounded-2xl border overflow-hidden my-8" style={{ borderColor: "#e6ece8" }}>
            <div className="px-5 py-3 border-b font-bold text-sm" style={{ backgroundColor: "#f0f6f2", borderColor: "#e6ece8", color: "#0e1512" }}>
              Structure d'une page de vente qui convertit
            </div>
            <div className="divide-y" style={{ borderColor: "#e6ece8" }}>
              {[
                { section: "Headline", role: "Capturer l'attention en 3 secondes. Promesse principale en gros.", exemple: "Créez votre première formation en ligne en 14 jours — même sans audience" },
                { section: "Sous-titre", role: "Préciser la promesse. Pour qui. En combien de temps.", exemple: "Le programme complet pour créateurs débutants qui veulent monétiser leur expertise." },
                { section: "Vidéo de vente", role: "Optionnel mais +35% de conversions. 5-10 min. Votre histoire + le programme.", exemple: "Votre témoignage personnel + présentation du contenu" },
                { section: "Problème", role: "Nommer la douleur que votre client ressent. Le faire se sentir compris.", exemple: "Vous avez de l'expertise, mais vous ne savez pas comment la transformer en revenus..." },
                { section: "Solution", role: "Votre formation comme la solution évidente. Pas de feature, des bénéfices.", exemple: "Après cette formation, vous avez votre première formation publiée et votre premier vrai revenu" },
                { section: "Programme", role: "Modules, durée, format. Ce qu'ils vont apprendre concrètement.", exemple: "Module 1 : Trouver son idée. Module 2 : Créer le contenu. Module 3 : Lancer..." },
                { section: "Témoignages", role: "Preuve sociale. 3 minimum avec photo, nom, résultat concret.", exemple: "Amadou D., Dakar : J'ai vendu 47 formations en 2 semaines..." },
                { section: "Tarif + CTA", role: "Prix clair. Justifié. Bouton d'achat visible. Garantie.", exemple: "25 000 FCFA · Accès à vie · Garantie 14 jours satisfait ou remboursé" },
                { section: "FAQ", role: "6-10 questions. Désamorcer les objections finales.", exemple: "Est-ce que ça marche si je n'ai pas d'audience ? Oui, voici pourquoi..." },
              ].map(({ section, role, exemple }) => (
                <div key={section} className="px-5 py-4">
                  <div className="flex gap-4">
                    <span className="font-bold text-sm w-32 flex-shrink-0" style={{ color: "#006e2f" }}>{section}</span>
                    <div className="flex-1">
                      <p className="text-sm mb-1">{role}</p>
                      <p className="text-xs italic">Ex : {exemple}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative w-full rounded-2xl overflow-hidden my-10" style={{ height: 260 }}>
            <Image src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=900&auto=format&fit=crop&q=80" alt="Équipe qui analyse une page de vente" fill className="object-cover" sizes="(max-width: 768px) 100vw, 800px" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
            <div className="absolute inset-0 flex items-center px-8">
              <blockquote className="max-w-xs">
                <p className="text-white text-lg font-bold mb-2">
                  "Ma page de vente a triplé son taux de conversion après avoir ajouté 3 témoignages avec photos."
                </p>
                <p className="text-white/70 text-sm">— Kofi A., formateur en marketing digital, Accra</p>
              </blockquote>
            </div>
          </div>

          {/* 6 */}
        </SectionGuide>

        <SectionGuide id="checkout" n={numeroGuide(5)} titre={<>Étape 4 — Optimiser la page de paiement</>}>
          <p className="text-[17px] leading-relaxed mb-6">
            Vous avez convaincu le visiteur d'acheter. Il clique sur "Acheter
            maintenant". Et là, il abandonne. C'est le scénario le plus douloureux
            en vente en ligne — la friction au checkout. Sur Novakou, voici
            comment la réduire au minimum :
          </p>

          {[
            { title: "Proposez tous les moyens de paiement dès la première étape", desc: "Wave, Orange Money, MTN, carte, virement. L'acheteur doit voir son mode préféré immédiatement. En Afrique, beaucoup n'ont pas de carte bancaire — si vous ne proposez pas de mobile money, vous perdez 60% des acheteurs potentiels." },
            { title: "Page de paiement minimaliste", desc: "Éliminez toute distraction : pas de menu, pas de liens sortants, pas de publicité. L'objectif unique de cette page est que le visiteur finalise son paiement." },
            { title: "Réassurance visible", desc: "Icônes de sécurité, garantie satisfait ou remboursé, logo Novakou. L'acheteur doit sentir qu'il peut acheter en confiance." },
            { title: "Résumé de commande clair", desc: "Nom de la formation, prix, ce qu'il va recevoir, délai d'accès. Aucune surprise. Les surprises à cette étape font fuir." },
            { title: "Order bump bien placé", desc: "Une offre complémentaire simple, juste au-dessus du bouton de paiement final. Une seule case à cocher. Prix raisonnable (< 30% du prix principal)." },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-4 mb-6">
              <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5" style={{ backgroundColor: "#006e2f" }}>
                {i + 1}
              </span>
              <div>
                <p className="font-bold text-sm mb-1">{item.title}</p>
                <p className="text-sm leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}

          <ProAstuce>
            <strong>Test A/B sur le bouton de paiement :</strong> testez "Payer
            maintenant" vs "Obtenir l'accès maintenant" vs "Commencer la
            formation". Sur des marchés africains, "Obtenir l'accès" performe
            souvent mieux car il met l'accent sur le bénéfice, pas l'action
            d'achat.
          </ProAstuce>

          {/* 7 */}
        </SectionGuide>

        <SectionGuide id="post-achat" n={numeroGuide(6)} titre={<>Étape 5 — La séquence post-achat</>}>
          <p className="text-[17px] leading-relaxed mb-6">
            L'achat est fait. Le vrai travail commence maintenant. Un client
            satisfait revient, recommande, et achète vos prochaines formations.
            Un client qui n'a jamais ouvert sa formation sera déçu et demandera
            un remboursement.
          </p>

          <div className="my-8 space-y-3">
            {[
              { jour: "J+0 (immédiat)", action: "Email de bienvenue avec accès, bonus surprise, offre upsell" },
              { jour: "J+1", action: "Email 'Comment bien démarrer' — guide vers le premier module" },
              { jour: "J+3", action: "Email de vérification — 'Avez-vous commencé ?' avec lien direct" },
              { jour: "J+7", action: "Email de progression — partage d'une astuce bonus non incluse dans la formation" },
              { jour: "J+14", action: "Demande d'avis — témoignage vidéo ou écrit contre une ressource bonus" },
              { jour: "J+30", action: "Offre de la formation suivante avec remise fidélité" },
            ].map(({ jour, action }) => (
              <div key={jour} className="flex items-start gap-4 rounded-xl border p-4" style={{ borderColor: "#e6ece8" }}>
                <span className="flex-shrink-0 text-xs font-bold px-2 py-1 rounded-lg whitespace-nowrap" style={{ backgroundColor: "#f0f6f2", color: "#006e2f" }}>
                  {jour}
                </span>
                <p className="text-sm leading-relaxed">{action}</p>
              </div>
            ))}
          </div>

          {/* 8 */}
        </SectionGuide>

        <SectionGuide id="upsell" n={numeroGuide(7)} titre={<>Étape 6 — Upsell et ascension client</>}>
          <p className="text-[17px] leading-relaxed mb-6">
            Votre offre principale n'est pas la fin du parcours — c'est le début.
            Les créateurs qui génèrent le plus de revenus sur Novakou ont construit
            une "échelle de valeur" : des offres de plus en plus avancées pour
            les clients qui progressent.
          </p>

          <div className="rounded-2xl border overflow-hidden my-8" style={{ borderColor: "#e6ece8" }}>
            <div className="px-5 py-3 border-b font-bold text-sm" style={{ backgroundColor: "#f0f6f2", borderColor: "#e6ece8", color: "#0e1512" }}>
              Exemple d'échelle de valeur
            </div>
            {[
              { offre: "Ebook / guide PDF", prix: "3 000 – 8 000 FCFA", desc: "Point d'entrée. Peu de risque pour l'acheteur." },
              { offre: "Formation vidéo complète", prix: "20 000 – 80 000 FCFA", desc: "Le cœur de votre business." },
              { offre: "Formation avancée + outils", prix: "80 000 – 200 000 FCFA", desc: "Pour les clients qui veulent aller plus loin." },
              { offre: "Programme de coaching groupe", prix: "200 000 – 500 000 FCFA", desc: "Accompagnement personnalisé, résultats garantis." },
              { offre: "Mastermind / mentorat privé", prix: "500 000 FCFA+", desc: "Top de gamme, accès restreint." },
            ].map(({ offre, prix, desc }, i) => (
              <div key={offre} className="flex items-center gap-4 px-5 py-4 border-b last:border-b-0" style={{ borderColor: "#e6ece8" }}>
                <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: "#006e2f", opacity: 0.5 + i * 0.12 }}>
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="font-bold text-sm">{offre}</p>
                  <p className="text-xs">{desc}</p>
                </div>
                <span className="text-xs font-bold" style={{ color: "#006e2f" }}>{prix}</span>
              </div>
            ))}
          </div>

          {/* 9 */}
        </SectionGuide>

        <SectionGuide id="retargeting" n={numeroGuide(8)} titre={<>Étape 7 — Retargeting et récupération</>}>
          <p className="text-[17px] leading-relaxed mb-6">
            Une grande partie de votre trafic ne convertit pas en première
            instance. Le retargeting vous permet de recibler ces visiteurs
            avec des publicités personnalisées. Sur Facebook et Instagram,
            vous pouvez créer des audiences personnalisées basées sur les
            visiteurs de votre page de vente Novakou.
          </p>

          <Astuce>
            <strong>Configuration du Pixel Facebook sur Novakou :</strong> dans
            votre tableau de bord Novakou, allez dans Intégrations → Pixel
            Facebook. Ajoutez votre Pixel ID. Le pixel trackera automatiquement
            les visites de votre page de vente, les initialisations de paiement,
            et les achats complétés — permettant un retargeting ultra-précis.
          </Astuce>

          {/* 10 */}
        </SectionGuide>

        <SectionGuide id="optimiser" n={numeroGuide(9)} titre={<>Optimiser et scaler votre tunnel</>}>
          <p className="text-[17px] leading-relaxed mb-6">
            Une fois votre tunnel en place, le travail d'optimisation commence.
            Chaque semaine, regardez ces indicateurs clés et identifiez où les
            visiteurs fuient :
          </p>

          <div className="grid sm:grid-cols-2 gap-4 my-8">
            {[
              { kpi: "Taux de conversion page de vente", seuil: "2-5%", action: "En dessous ? Améliorez les témoignages et la headline." },
              { kpi: "Taux d'abandon checkout", seuil: "< 40%", action: "Au dessus ? Ajoutez des moyens de paiement ou réduisez les champs." },
              { kpi: "Taux ouverture email bienvenue", seuil: "> 60%", action: "En dessous ? Personnalisez l'objet avec le prénom." },
              { kpi: "Taux de complétion formation", seuil: "> 40%", action: "En dessous ? Activez le déblocage progressif des modules." },
            ].map((m) => (
              <div key={m.kpi} className="rounded-2xl border p-5" style={{ borderColor: "#e6ece8" }}>
                <p className="font-bold text-sm mb-1">{m.kpi}</p>
                <p className="text-xl font-bold mb-2">{m.seuil}</p>
                <p className="text-xs">💡 {m.action}</p>
              </div>
            ))}
          </div>

          {/* 11 - Exemple complet */}
        </SectionGuide>

        <SectionGuide id="exemple-complet" n={numeroGuide(10)} titre={<>Exemple de tunnel complet : de 0 à 500 000 FCFA/mois</>}>
          <p className="text-[17px] leading-relaxed mb-6">
            Voici un exemple réel (données anonymisées) d'un créateur Novakou qui
            est passé de zéro à 500 000 FCFA mensuels en 4 mois, avec un seul
            produit et sans publicité payante.
          </p>

          <div className="rounded-2xl border overflow-hidden my-8" style={{ borderColor: "#e6ece8" }}>
            <div className="px-5 py-3 border-b" style={{ backgroundColor: "#f0f6f2", borderColor: "#e6ece8" }}>
              <p className="font-bold text-sm">Profil : Fatou, coach en nutrition africaine, Dakar</p>
              <p className="text-xs">Formation "Maigrir sainement avec la cuisine africaine" — 35 000 FCFA</p>
            </div>
            <div className="divide-y" style={{ borderColor: "#e6ece8" }}>
              {[
                { label: "Trafic source", val: "Posts Instagram quotidiens + Stories + Reels" },
                { label: "Lead magnet", val: "PDF gratuit '7 recettes africaines minceur' — 1 200 téléchargements/mois" },
                { label: "Séquence email", val: "5 emails sur 7 jours → taux de conversion email → achat : 8%" },
                { label: "Visiteurs page de vente", val: "820/mois" },
                { label: "Conversions directes", val: "41 ventes × 35 000 FCFA = 1 435 000 FCFA/mois" },
                { label: "Order bump (slides)", val: "5 000 FCFA × 18 acheteurs = 90 000 FCFA" },
                { label: "Upsell coaching groupe", val: "150 000 FCFA × 2 personnes = 300 000 FCFA" },
                { label: "Total mensuel", val: "≈ 1 825 000 FCFA (3 mois après lancement)" },
              ].map(({ label, val }) => (
                <div key={label} className="flex gap-4 px-5 py-3">
                  <span className="text-sm font-medium w-44 flex-shrink-0" style={{ color: "#5c6b62" }}>{label}</span>
                  <span className="text-sm font-bold" style={{ color: "#0e1512" }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          <Attention>
            <strong>Ces chiffres ne sont pas garantis</strong> et dépendent de
            votre niche, de votre audience et de la qualité de votre contenu.
            Cet exemple illustre ce qui est possible avec un tunnel bien configuré
            et une exécution régulière — pas un résultat moyen.
          </Attention>

          {/* 12 - Erreurs */}
        </SectionGuide>

        <SectionGuide id="erreurs" n={numeroGuide(11)} titre={<>Les erreurs classiques qui tuent les conversions</>}>
          {[
            {
              err: "Copier un tunnel conçu pour le marché américain",
              desc: "Les arguments, prix, et moyens de paiement qui convertissent en France ou aux USA ne fonctionnent pas forcément en Afrique francophone. Adaptez votre message à la réalité de votre audience.",
            },
            {
              err: "Lancer avec un seul moyen de paiement",
              desc: "Si vous proposez seulement la carte bancaire, vous excluez 60% à 70% de votre marché en Afrique. Wave, Orange Money, MTN sont indispensables.",
            },
            {
              err: "Page de vente trop courte",
              desc: "En ligne, plus la décision est importante (argent, confiance), plus la page de vente doit être longue et détaillée. Une page de 5 lignes ne vend pas une formation à 50 000 FCFA.",
            },
            {
              err: "Pas de garantie",
              desc: "La garantie satisfait ou remboursé est souvent ce qui débloque les hésitants. Beaucoup d'acheteurs n'utilisent jamais la garantie, mais son existence les rassure pour acheter.",
            },
            {
              err: "Ne pas tester et itérer",
              desc: "Votre premier tunnel ne sera pas parfait. C'est normal. Ce qui compte, c'est de mesurer, d'identifier les fuites, et d'améliorer chaque semaine.",
            },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-4 rounded-2xl border p-5 mb-4" style={{ borderColor: "#e6ece8" }}>
              <span className="flex-shrink-0 text-2xl">⚠️</span>
              <div>
                <p className="font-bold text-sm mb-1">{item.err}</p>
                <p className="text-sm leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </SectionGuide>
      </CoqueGuide>
    </>
  );
}
