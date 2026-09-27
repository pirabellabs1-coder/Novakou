import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { OldGuideJsonLd } from "@/components/formations/OldGuideJsonLd";
import {
  CarteActionGuide,
  CoqueGuide,
} from "@/components/formations/public/article/CoqueGuide";
import {
  Astuce,
  Attention,
  Chiffres,
  EtiquetteGuide,
  Maquette,
  SectionGuide,
} from "@/components/formations/public/article/EncadresGuide";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://novakou.com";
const OG_IMAGE = `${APP_URL}/api/og?type=guide&title=${encodeURIComponent(
  "Vendre en ligne en Afrique francophone",
)}&subtitle=${encodeURIComponent(
  "Tunnel de vente, pricing FCFA, WhatsApp, email : le guide 2026",
)}`;

export const metadata: Metadata = {
  title: "Vendre en ligne en Afrique francophone 2026",
  description:
    "Le guide complet pour vendre vos formations en ligne en Afrique : tunnel de vente, pricing FCFA, WhatsApp, Facebook, email marketing, affiliation.",
  keywords: [
    "vendre formation en ligne afrique",
    "vente formation FCFA",
    "tunnel de vente formation",
    "formation en ligne afrique francophone",
    "monetiser savoir afrique",
    "novakou guide vente",
  ],
  alternates: {
    canonical: "/guides/vendre-en-ligne",
  },
  openGraph: {
    title: "Vendre en ligne en Afrique francophone 2026 | Novakou",
    description:
      "12 chapitres, étude de cas, méthodes concrètes pour transformer votre savoir en revenus récurrents depuis l'Afrique francophone.",
    type: "article",
    url: `${APP_URL}/guides/vendre-en-ligne`,
    siteName: "Novakou",
    images: [{ url: OG_IMAGE, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vendre en ligne en Afrique francophone 2026 | Novakou",
    description:
      "Le guide complet pour vendre vos formations en ligne en Afrique francophone.",
    images: [OG_IMAGE],
  },
};

const TOC = [
  { id: "marche", num: "01", label: "Le marche des formations en Afrique francophone" },
  { id: "page-vente", num: "02", label: "Preparer sa page de vente qui convertit" },
  { id: "tunnel", num: "03", label: "Créer un tunnel de vente efficace" },
  { id: "psychologie", num: "04", label: "Les 7 leviers psychologiques de vente" },
  { id: "pricing", num: "05", label: "Fixer son prix en FCFA : la methode des 3 paliers" },
  { id: "reseaux", num: "06", label: "Promouvoir sur les reseaux sociaux africains" },
  { id: "email", num: "07", label: "L email marketing : sequences automatisees" },
  { id: "affiliation", num: "08", label: "Le programme d affiliation" },
  { id: "analytics", num: "09", label: "Analyser ses resultats et optimiser" },
  { id: "erreurs", num: "10", label: "Les 5 erreurs qui tuent vos ventes" },
  { id: "etude-cas", num: "11", label: "Etude de cas : Aminata, de 0 a 500 000 FCFA/mois" },
  { id: "conclusion", num: "12", label: "Conclusion et prochaine étape" },
];

export default function VendreEnLignePage() {
  return (
    <>
      <OldGuideJsonLd slug="vendre-en-ligne" />
      <CoqueGuide
        ariane={[
          { label: "Accueil", href: "/" },
          { label: "Guides", href: "/guides/guide-complet-novakou" },
          { label: "Vendre en ligne" },
        ]}
        eyebrow="Guide complet 2026"
        titre={<>Comment vendre ses formations en ligne en Afrique</>}
        sousTitre="Le guide étape par étape pour transformer votre expertise en revenus recurrents. Du positionnement au tunnel de vente, du pricing en FCFA aux stratégies de promotion sur WhatsApp et Facebook : tout ce qu'il faut savoir pour réussir en Afrique francophone."
        infos={[
          { texte: "15 min de lecture" },
          { texte: "12 chapitres" },
          { texte: "Mis a jour : Avril 2026" },
        ]}
        couverture={{
          src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
          alt: "Analyser ses performances de vente en ligne et optimiser ses résultats",
        }}
        titreSommaire="Sommaire"
        uniteSommaire="chapitres"
        sommaire={TOC.map((t) => ({ id: t.id, label: t.label, n: t.num }))}
        apres={
          <>
          <div className="nka-pied">
            <p>Vous avez une question sur la vente de formations en ligne ? Contactez-nous a{" "} <Link href="/contact"> support@novakou.com </Link></p>
            <p>Derniere mise a jour : Avril 2026</p>
          </div>
          </>
        }
        fin={
          <>
            <CarteActionGuide
              titre="Pret a lancer votre premiere formation ?"
              action={{ href: "/inscription?role=vendeur", libelle: "Créer mon compte vendeur — C'est gratuit" }}
              note="Rejoint par 850+ createurs en Afrique francophone"
            >
              <p>Créez votre compte vendeur gratuitement. Page de vente, tunnel, paiement Mobile Money, affiliation, sequences email : tout est inclus. Pas de carte bancaire requise.</p>
            </CarteActionGuide>
          </>
        }
      >
        <SectionGuide
          id="marche"
          titre={<>Le marche des formations en ligne en Afrique francophone</>}
          apres={<EtiquetteGuide>CHAPITRE 01</EtiquetteGuide>}
        >
          <p>
            L&apos;Afrique francophone vit une revolution silencieuse. Avec plus de 400 millions de francophones
            projetes d&apos;ici 2050, dont 85 % en Afrique, le continent est le plus grand bassin de croissance
            pour l&apos;education numerique au monde. Et ce n&apos;est pas une promesse lointaine : c&apos;est déjà
            en train de se produire.
          </p>

          <Chiffres
            items={[
              { valeur: "Croissant", libelle: "Marche francophone en expansion" },
              { valeur: "Mobile", libelle: "Acces mobile en forte progression" },
              { valeur: "En hausse", libelle: "Croissance e-learning en Afrique" },
            ]}
          />

          <p>
            Plusieurs facteurs convergent pour créer une fenetre d&apos;opportunite unique. La penetration du
            smartphone explose : au Senegal, en Cote d&apos;Ivoire, au Cameroun, au Benin, plus de 70 % de la
            population a acces a un telephone connecte. Le Mobile Money (Orange Money, Wave, MTN MoMo) a
            democratise le paiement numerique bien avant que les cartes bancaires ne se generalisent.
            Les jeunes diplomes cherchent des competences pratiques que l&apos;universite ne fournit pas. Les
            professionnels en activité veulent se former le soir, a leur rythme.
          </p>

          <p>
            Pourtant, l&apos;offre de formations en ligne adaptee a ce marche reste faible. Les plateformes
            occidentales (Udemy, Teachable, Systeme.io) exigent des cartes bancaires internationales, affichent
            les prix en dollars ou en euros, et ne comprennent pas les realites locales. Resultat : un vide
            enorme que des formateurs locaux sont en position ideale pour combler.
          </p>

          <Astuce>
            <strong>Pourquoi c&apos;est le bon moment :</strong> Le marche africain de l&apos;e-learning devrait atteindre
            15 milliards de dollars d&apos;ici 2030 (source : HolonIQ). Les premiers formateurs positionnes
            aujourd&apos;hui construisent des avantages concurrentiels durables.
          </Astuce>

          <Maquette titre="novakou.com/explorer">
            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 12, background: "#006e2f14", color: "#006e2f", padding: "4px 12px", borderRadius: 8, fontWeight: 600 }}>Populaire</div>
              <div style={{ fontSize: 12, background: "#f1f5f9", color: "#5c6b62", padding: "4px 12px", borderRadius: 8, fontWeight: 500 }}>Marketing Digital</div>
              <div style={{ fontSize: 12, background: "#f1f5f9", color: "#5c6b62", padding: "4px 12px", borderRadius: 8, fontWeight: 500 }}>Developpement</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {["Maitriser le Marketing Digital", "Excel pour Professionnels"].map((t) => (
                <div key={t} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
                  <div style={{ width: "100%", height: 80, background: "linear-gradient(135deg, #006e2f15, #4c9a6b15)", borderRadius: 8, marginBottom: 12 }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#0e1512" }}>{t}</div>
                  <div style={{ fontSize: 13, color: "#4c9a6b", fontWeight: 700, marginTop: 8 }}>19 900 FCFA</div>
                </div>
              ))}
            </div>
          </Maquette>
        </SectionGuide>

        <SectionGuide
          id="page-vente"
          titre={<>Preparer sa page de vente qui convertit</>}
          apres={<EtiquetteGuide>CHAPITRE 02</EtiquetteGuide>}
        >
          <p>
            Votre page de vente est votre commercial infatigable. Elle travaille 24h/24, 7j/7, sans salaire.
            Mais pour qu&apos;elle convertisse, chaque element doit etre pense avec soin. Voici la structure
            eprouvee qui fonctionne sur le marche africain francophone.
          </p>

          <h3>Le titre : votre premiere impression</h3>

          <p>
            Un bon titre repond a une seule question : &laquo; Qu&apos;est-ce que je vais obtenir ? &raquo; Il ne
            decrit pas votre formation, il decrit la transformation. Pas &laquo; Formation en marketing digital &raquo;
            mais &laquo; Doublez vos ventes en 30 jours avec le marketing digital &raquo;. Le bénéfice doit etre
            concret, mesurable, et limite dans le temps.
          </p>

          <h3>La liste des bénéfices, pas des modules</h3>

          <p>
            Vos prospects ne veulent pas savoir que le module 3 contient 12 videos. Ils veulent savoir qu&apos;après
            votre formation, ils sauront créer une campagne publicitaire Facebook rentable en moins d&apos;une heure.
            Transformez chaque module en bénéfice tangible. &laquo; Module 5 : SEO &raquo; devient
            &laquo; Apparaitre en premiere page Google sans payer de publicite &raquo;.
          </p>

          <h3>La preuve sociale : temoignages et resultats</h3>

          <p>
            En Afrique francophone, la recommandation de bouche-a-oreille est reine. Integrez au minimum
            3 temoignages video ou textuels de vrais apprenants. Montrez leurs resultats concrets : avant/apres,
            captures d&apos;ecran, chiffres. Si vous debutez et n&apos;avez pas encore de temoignages, offrez votre
            formation a 5 personnes en echange de retours honnetes.
          </p>

          <Maquette titre="novakou.com/produit/marketing-digital-pro">
            <div style={{ textAlign: "center" as const, padding: "20px 0" }}>
              <div style={{ fontSize: 22, color: "#0e1512", marginBottom: 8 }}>Doublez vos ventes en 30 jours</div>
              <div style={{ fontSize: 14, color: "#5c6b62", marginBottom: 20 }}>La methode complete de marketing digital pour entrepreneurs africains</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 20 }}>
                {["\u2014 apprenants", "Garantie 14 jours"].map((t) => (
                  <span key={t} style={{ fontSize: 11, color: "#006e2f", background: "#006e2f10", padding: "4px 10px", borderRadius: 6, fontWeight: 600 }}>{t}</span>
                ))}
              </div>
              <div style={{ background: "#006e2f", color: "white", padding: "12px 32px", borderRadius: 10, display: "inline-block", fontSize: 14, fontWeight: 700 }}>
                Rejoindre maintenant — 29 900 FCFA
              </div>
            </div>
          </Maquette>

          <Astuce>
            <strong>Astuce Novakou :</strong> Notre editeur de page produit inclut des blocs pre-configures
            pour les temoignages, la FAQ, et les garanties. Vous n&apos;avez pas besoin de coder quoi que ce soit.
          </Astuce>
        </SectionGuide>

        <SectionGuide
          id="tunnel"
          titre={<>Créer un tunnel de vente efficace</>}
          apres={<EtiquetteGuide>CHAPITRE 03</EtiquetteGuide>}
        >
          <p>
            Un tunnel de vente (ou funnel) est le parcours que suit votre prospect, du premier contact jusqu&apos;a
            l&apos;achat. Chaque étape a un seul objectif : faire avancer le visiteur vers l&apos;étape suivante. Pas
            de distraction, pas de lien externe, pas de menu de navigation complexe.
          </p>

          <h3>La structure ideale en 4 étapes</h3>

          {/* Funnel visualization */}
          <div style={{ margin: "28px 0" }}>
            {[
              { step: "1", label: "Page d atterrissage", desc: "Capturer l attention + collecter l email. Un titre percutant, un bénéfice clair, un formulaire.", color: "#006e2f" },
              { step: "2", label: "Page de vente", desc: "Presenter la formation, les bénéfices, les temoignages, la garantie. Un seul CTA : acheter.", color: "#4c9a6b" },
              { step: "3", label: "Page de paiement", desc: "Formulaire simple. Mobile Money + carte. Order bump (produit complementaire a petit prix).", color: "#0ea5e9" },
              { step: "4", label: "Page de remerciement", desc: "Confirmation + upsell. Proposer un coaching, un pack premium, un abonnement.", color: "#8b5cf6" },
            ].map((item, i) => (
              <div
                key={item.step}
                style={{ display: "flex", gap: 16, alignItems: "flex-start", padding: "20px 0", borderBottom: i < 3 ? "1px solid #f1f5f9" : "none" }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${item.color}14`, color: item.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>
                  {item.step}
                </div>
                <div>
                  <div style={{ fontSize: 16, color: "#0e1512" }}>{item.label}</div>
                  <div style={{ fontSize: 14, color: "#5c6b62", marginTop: 4, lineHeight: 1.6 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <p>
            Sur Novakou, vous pouvez construire ce tunnel complet sans aucun outil externe. Le builder de
            funnel integre vous permet de créer chaque page, de configurer l&apos;order bump et l&apos;upsell, et de
            connecter votre passerelle de paiement (Mobile Money ou carte) en quelques clics.
          </p>

          <Attention>
            <strong>Erreur frequente :</strong> Ne renvoyez jamais un prospect vers votre page d&apos;accueil
            depuis une publicite. Utilisez toujours une page d&apos;atterrissage dediee, sans menu de navigation,
            avec un seul objectif. Le taux de conversion chute de 30 a 50 % avec un lien vers la page d&apos;accueil.
          </Attention>
        </SectionGuide>

        <SectionGuide
          id="psychologie"
          titre={<>Les 7 leviers psychologiques de vente</>}
          apres={<EtiquetteGuide>CHAPITRE 04</EtiquetteGuide>}
        >
          <p>
            Vendre n&apos;est pas manipuler. C&apos;est comprendre comment les gens prennent des decisions et
            les aider a faire le meilleur choix pour eux. Ces 7 leviers, identifies par la recherche en psychologie
            sociale, sont utilises par toutes les grandes plateformes. Voici comment les appliquer avec integrite
            sur le marche africain.
          </p>

          <div style={{ margin: "28px 0" }}>
            {[
              { num: "1", title: "Urgence", desc: "Une offre limitee dans le temps. L inscription ferme vendredi soir a 23h59. Les gens agissent quand le temps presse, pas quand c est confortable.", example: "Exemple : Compte a rebours sur votre page de vente." },
              { num: "2", title: "Rarete", desc: "Places limitees a 50 apprenants pour garantir un suivi personnalise. La rarete rend votre offre plus desirable et cree une perception de valeur elevee.", example: "Exemple : Jauge de places restantes en temps reel." },
              { num: "3", title: "Preuve sociale", desc: "127 personnes ont déjà rejoint cette formation. Quand les gens voient que d autres ont pris la decision, ils se sentent rassures.", example: "Exemple : Temoignages + nombre d inscrits affiches." },
              { num: "4", title: "Garantie", desc: "Satisfait ou rembourse sous 14 jours, sans question. Retirer le risque de l acheteur est le levier le plus puissant et le moins utilise.", example: "Exemple : Badge garantie visible pres du bouton d achat." },
              { num: "5", title: "Autorite", desc: "Montrez vos credentials, vos resultats, vos clients. Pourquoi devrait-on vous ecouter ? Affichez votre expertise avec des preuves concretes.", example: "Exemple : Section A propos du formateur avec parcours." },
              { num: "6", title: "Reciprocite", desc: "Donnez avant de demander. Un module gratuit, un PDF, un webinaire. Les gens qui recoivent veulent rendre la pareille.", example: "Exemple : Lead magnet gratuit avant la vente." },
              { num: "7", title: "FOMO", desc: "La peur de rater quelque chose. Montrez les resultats de ceux qui ont déjà rejoint. Ce n est pas de la manipulation, c est de l information.", example: "Exemple : Captures de resultats d apprenants." },
            ].map((item) => (
              <div key={item.num} style={{ background: "#fafafa", borderRadius: 14, padding: "20px 24px", marginBottom: 12, border: "1px solid #f1f5f9" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: "white", background: "#006e2f", borderRadius: 8, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {item.num}
                  </span>
                  <span style={{ fontSize: 16, color: "#0e1512" }}>{item.title}</span>
                </div>
                <div style={{ fontSize: 14, color: "#5c6b62", lineHeight: 1.7, marginBottom: 8 }}>{item.desc}</div>
                <div style={{ fontSize: 13, color: "#006e2f", fontWeight: 600, fontStyle: "italic" as const }}>{item.example}</div>
              </div>
            ))}
          </div>

          <Astuce>
            <strong>Sur Novakou :</strong> Le builder de funnel integre un compte a rebours, une jauge de
            places, un affichage du nombre d&apos;inscrits, et un badge de garantie. Tous ces leviers
            psychologiques sont disponibles en blocs drag-and-drop.
          </Astuce>
        </SectionGuide>

        <SectionGuide
          id="pricing"
          titre={<>Fixer son prix en FCFA : la methode des 3 paliers</>}
          apres={<EtiquetteGuide>CHAPITRE 05</EtiquetteGuide>}
        >
          <p>
            Le pricing est l&apos;un des exercices les plus difficiles pour les formateurs africains. Trop cher,
            vous excluez votre audience. Trop peu cher, vous devaluez votre expertise et ne pouvez pas
            reinvestir dans la qualité. La methode des 3 paliers resout ce dilemme en offrant un choix
            qui satisfait tous les profils.
          </p>

          <h3>Le principe des 3 paliers</h3>

          {/* Pricing mockup */}
          <Maquette titre="novakou.com/produit/formation-excel/tarifs">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                { name: "Essentiel", price: "9 900", features: ["Acces aux 12 modules video", "Exercices pratiques", "Certificat de completion", "Acces a vie"] },
                { name: "Premium", price: "24 900", features: ["Tout l Essentiel", "3 sessions de coaching live", "Templates Excel professionnels", "Communaute privee WhatsApp"], highlight: true },
                { name: "VIP", price: "49 900", features: ["Tout le Premium", "1h de coaching individuel", "Audit de vos fichiers Excel", "Acces prioritaire aux mises a jour"] },
              ].map((plan) => (
                <div key={plan.name} style={{ border: plan.highlight ? "2px solid #006e2f" : "1px solid #e2e8f0", borderRadius: 14, padding: 20, position: "relative" as const, background: plan.highlight ? "#f0f6f2" : "white" }}>
                  {plan.highlight && (
                    <div style={{ position: "absolute" as const, top: -10, left: "50%", transform: "translateX(-50%)", fontSize: 10, fontWeight: 700, color: "white", background: "#006e2f", padding: "2px 12px", borderRadius: 20, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
                      Populaire
                    </div>
                  )}
                  <div style={{ fontSize: 15, color: "#0e1512", marginBottom: 4 }}>{plan.name}</div>
                  <div style={{ fontSize: 24, color: "#006e2f", marginBottom: 12 }}>{plan.price} <span style={{ fontSize: 12, fontWeight: 500, color: "#5c6b62" }}>FCFA</span></div>
                  {plan.features.map((f) => (
                    <div key={f} style={{ fontSize: 12, color: "#5c6b62", padding: "4px 0", display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: "#4c9a6b", fontSize: 14 }}>&#10003;</span> {f}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Maquette>

          <p>
            Le palier du milieu (&laquo; Premium &raquo;) est votre cible. C&apos;est celui que la majorite des gens
            vont choisir, car il apparait comme le meilleur rapport qualite-prix entre l&apos;option de base et
            l&apos;option luxe. Le palier VIP existe principalement pour rendre le Premium plus attractif par contraste.
          </p>

          <h3>Grille de prix indicative par type de formation</h3>

          <div style={{ border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden", margin: "24px 0" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left" as const, fontWeight: 700, color: "#0e1512", borderBottom: "1px solid #e2e8f0" }}>Type</th>
                  <th style={{ padding: "12px 16px", textAlign: "left" as const, fontWeight: 700, color: "#0e1512", borderBottom: "1px solid #e2e8f0" }}>Essentiel</th>
                  <th style={{ padding: "12px 16px", textAlign: "left" as const, fontWeight: 700, color: "#0e1512", borderBottom: "1px solid #e2e8f0" }}>Premium</th>
                  <th style={{ padding: "12px 16px", textAlign: "left" as const, fontWeight: 700, color: "#0e1512", borderBottom: "1px solid #e2e8f0" }}>VIP</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Mini-cours (2-3h)", "4 900", "9 900", "19 900"],
                  ["Formation complete (8-15h)", "14 900", "29 900", "59 900"],
                  ["Programme premium (20h+)", "29 900", "59 900", "99 900"],
                  ["Coaching + formation", "49 900", "99 900", "199 900"],
                ].map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        style={{ padding: "12px 16px", color: j === 0 ? "#0e1512" : "#5c6b62", fontWeight: j === 0 ? 600 : 400, borderBottom: i < 3 ? "1px solid #f1f5f9" : "none" }}
                      >
                        {j > 0 ? `${cell} FCFA` : cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Attention>
            <strong>Ne sous-estimez pas votre prix.</strong> L&apos;erreur la plus courante des formateurs africains
            est de brader leur expertise. Une formation a 2 000 FCFA envoie le signal que le contenu
            a peu de valeur. Positionnez-vous sur la qualité, pas sur le volume.
          </Attention>
        </SectionGuide>

        <SectionGuide
          id="reseaux"
          titre={<>Promouvoir sur les reseaux sociaux africains</>}
          apres={<EtiquetteGuide>CHAPITRE 06</EtiquetteGuide>}
        >
          <p>
            En Afrique francophone, les reseaux sociaux ne sont pas les memes qu&apos;en Europe ou en Amerique
            du Nord. WhatsApp est le roi inconteste. Facebook reste massif. TikTok explose chez les 18-35 ans.
            Instagram fonctionne pour le visuel. LinkedIn est marginal. Voici comment exploiter chaque canal
            pour vendre vos formations.
          </p>

          <h3>WhatsApp : votre canal numéro 1</h3>

          <p>
            WhatsApp est l&apos;application la plus utilisee en Afrique de l&apos;Ouest. C&apos;est la ou les gens
            communiquent, font du commerce, et partagent du contenu. Pour un formateur, c&apos;est une mine d&apos;or.
            Créez un statut WhatsApp quotidien avec un conseil gratuit lie a votre expertise. Partagez des
            temoignages de vos apprenants. Utilisez les listes de diffusion (pas les groupes) pour envoyer
            vos offres sans spammer. Novakou genere des liens de vente partageables sur WhatsApp en un clic.
          </p>

          <h3>Facebook : la puissance des groupes</h3>

          <p>
            Les groupes Facebook thematiques sont extremement actifs en Afrique francophone. &laquo; Marketing
            Digital Afrique &raquo;, &laquo; Entrepreneurs du Cameroun &raquo;, &laquo; Formation en ligne Senegal &raquo; :
            ces communautes comptent des dizaines de milliers de membres actifs. Apportez de la valeur gratuite
            pendant 2 semaines avant de presenter votre formation. La stratégie &laquo; 80/20 &raquo; fonctionne :
            80 % de contenu utile, 20 % de promotion.
          </p>

          {/* Image: promotion sur mobile / réseaux sociaux */}
          <div style={{ borderRadius: 16, overflow: "hidden", margin: "28px 0", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
            <Image src="https://images.unsplash.com/photo-1611532736597-de2d4265fba3?auto=format&fit=crop&w=900&q=80" alt="Partager son contenu sur les réseaux sociaux africains pour attirer des clients" width={900} height={400} style={{ width: "100%", objectFit: "cover", display: "block", maxHeight: 380 }} />
            <div style={{ fontSize: 12, color: "#5c6b62", textAlign: "center", padding: "10px 16px", background: "#f8fafc" }}>
              WhatsApp Status, Facebook, TikTok — chaque plateforme a ses codes. Adaptez votre message à chaque canal.
            </div>
          </div>

          <h3>TikTok et Instagram : le format court</h3>

          <p>
            Les videos courtes (30-90 secondes) fonctionnent exceptionnellement bien pour attirer une audience
            qualifiee. Un conseil rapide, une demonstration, un avant/apres. L&apos;objectif n&apos;est pas de vendre
            directement sur TikTok mais de rediriger vers votre bio link, qui mene a votre page de vente Novakou.
            Publiez 3 a 5 fois par semaine pour construire une audience reguliere.
          </p>

          <Maquette titre="Stratégie reseaux sociaux — calendrier type">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
              {[
                { jour: "Lun", action: "Conseil gratuit", canal: "WhatsApp Status" },
                { jour: "Mar", action: "Video courte", canal: "TikTok + Reels" },
                { jour: "Mer", action: "Post valeur", canal: "Groupe Facebook" },
                { jour: "Jeu", action: "Temoignage", canal: "WhatsApp + Story" },
                { jour: "Ven", action: "Offre limitee", canal: "Tous canaux" },
              ].map((d) => (
                <div key={d.jour} style={{ background: "#f8fafc", borderRadius: 10, padding: 12, textAlign: "center" as const }}>
                  <div style={{ fontSize: 13, color: "#006e2f", marginBottom: 6 }}>{d.jour}</div>
                  <div style={{ fontSize: 11, color: "#0e1512", fontWeight: 600, marginBottom: 4 }}>{d.action}</div>
                  <div style={{ fontSize: 10, color: "#5c6b62" }}>{d.canal}</div>
                </div>
              ))}
            </div>
          </Maquette>
        </SectionGuide>

        <SectionGuide
          id="email"
          titre={<>L email marketing : sequences de vente automatisees</>}
          apres={<EtiquetteGuide>CHAPITRE 07</EtiquetteGuide>}
        >
          <p>
            L&apos;email marketing reste le canal avec le meilleur retour sur investissement au monde : pour
            chaque euro investi, le retour moyen est de 36 euros. En Afrique francophone, l&apos;email est moins
            sature qu&apos;en Europe, ce qui signifie de meilleurs taux d&apos;ouverture (souvent 30 a 45 % contre
            20 % en moyenne mondiale).
          </p>

          <h3>La sequence de bienvenue (5 emails)</h3>

          <p>
            Quand quelqu&apos;un telecharge votre lead magnet gratuit ou s&apos;inscrit a votre newsletter, il entre
            dans votre sequence automatisee. Voici la structure ideale sur 7 jours.
          </p>

          <div style={{ margin: "24px 0" }}>
            {[
              { jour: "J+0", objet: "Votre [ressource] est prete", desc: "Livrer le lead magnet + se presenter brievement. Installer la confiance." },
              { jour: "J+1", objet: "Mon parcours (et pourquoi ca vous concerne)", desc: "Raconter votre histoire. Montrer que vous comprenez les defis de votre audience." },
              { jour: "J+3", objet: "La plus grosse erreur en [domaine]", desc: "Apporter de la valeur. Pointer un problème que votre formation resout." },
              { jour: "J+5", objet: "Comment [resultat] en [delai]", desc: "Etude de cas ou temoignage d un apprenant. Preuve sociale." },
              { jour: "J+7", objet: "Offre speciale (expire dimanche)", desc: "Presenter votre formation avec un avantage temporaire. CTA clair." },
            ].map((email, i) => (
              <div
                key={email.jour}
                style={{ display: "flex", gap: 16, padding: "16px 0", borderBottom: i < 4 ? "1px solid #f1f5f9" : "none", alignItems: "flex-start" }}
              >
                <span style={{ fontSize: 12, color: "#006e2f", background: "#006e2f10", padding: "4px 10px", borderRadius: 6, flexShrink: 0, minWidth: 42, textAlign: "center" as const }}>
                  {email.jour}
                </span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0e1512" }}>{email.objet}</div>
                  <div style={{ fontSize: 13, color: "#5c6b62", marginTop: 4, lineHeight: 1.6 }}>{email.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <Astuce>
            <strong>Automatisation Novakou :</strong> Le module de sequences email integre vous permet de
            créer cette sequence en 10 minutes. Chaque email se declenche automatiquement après l&apos;inscription.
            Vous pouvez aussi segmenter par pays, par interet, ou par comportement d&apos;achat.
          </Astuce>
        </SectionGuide>

        <SectionGuide
          id="affiliation"
          titre={<>Le programme d affiliation : transformer vos clients en vendeurs</>}
          apres={<EtiquetteGuide>CHAPITRE 08</EtiquetteGuide>}
        >
          <p>
            Le bouche-a-oreille est le canal d&apos;acquisition le plus puissant en Afrique. Le programme
            d&apos;affiliation le systematise : vos apprenants satisfaits partagent un lien unique et touchent
            une commission sur chaque vente generee. C&apos;est gagnant pour tout le monde.
          </p>

          <h3>Comment fonctionne l&apos;affiliation sur Novakou</h3>

          <p>
            Chaque vendeur sur Novakou peut activer son programme d&apos;affiliation en un clic. Vous definissez
            le taux de commission (generalement 20 a 30 %), la duree du cookie de tracking (30 ou 90 jours),
            et c&apos;est parti. Vos affilies recoivent un lien unique, un dashboard de suivi, et sont payes
            automatiquement a chaque vente validee.
          </p>

          <Maquette titre="novakou.com/affilie/dashboard">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 16 }}>
              <div style={{ background: "#f0f6f2", borderRadius: 10, padding: 16, textAlign: "center" as const }}>
                <div style={{ fontSize: 22, color: "#006e2f" }}>47</div>
                <div style={{ fontSize: 11, color: "#5c6b62", marginTop: 4 }}>Clics ce mois</div>
              </div>
              <div style={{ background: "#f0f6f2", borderRadius: 10, padding: 16, textAlign: "center" as const }}>
                <div style={{ fontSize: 22, color: "#006e2f" }}>8</div>
                <div style={{ fontSize: 11, color: "#5c6b62", marginTop: 4 }}>Ventes generees</div>
              </div>
              <div style={{ background: "#f0f6f2", borderRadius: 10, padding: 16, textAlign: "center" as const }}>
                <div style={{ fontSize: 22, color: "#006e2f" }}>59 700</div>
                <div style={{ fontSize: 11, color: "#5c6b62", marginTop: 4 }}>FCFA gagnes</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: "#5c6b62", padding: "12px 16px", background: "#f8fafc", borderRadius: 8 }}>
              Votre lien : <span style={{ color: "#006e2f", fontWeight: 600 }}>novakou.com/r/aminata-excel</span>
            </div>
          </Maquette>

          <p>
            Les meilleurs formateurs sur Novakou generent 25 a 40 % de leurs ventes via l&apos;affiliation.
            L&apos;astuce : contactez personnellement vos 10 meilleurs apprenants et proposez-leur de devenir
            affilies. Fournissez-leur des messages pre-rediges pour WhatsApp et des visuels pour Facebook.
            Plus vous facilitez le travail de vos affilies, plus ils vendent.
          </p>
        </SectionGuide>

        <SectionGuide
          id="analytics"
          titre={<>Analyser ses resultats et optimiser</>}
          apres={<EtiquetteGuide>CHAPITRE 09</EtiquetteGuide>}
        >
          <p>
            Ce qui ne se mesure pas ne s&apos;ameliore pas. Vendre des formations en ligne, c&apos;est un processus
            iteratif : vous lancez, vous mesurez, vous ajustez, vous relancez. Voici les metriques cles
            a suivre et les benchmarks pour le marche africain.
          </p>

          <h3>Les 6 metriques essentielles</h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, margin: "24px 0" }}>
            {[
              { metric: "Taux de conversion page de vente", benchmark: "3-8%", desc: "Visiteurs qui achetent" },
              { metric: "Cout d acquisition client (CAC)", benchmark: "< 30% du prix", desc: "Depense pub par vente" },
              { metric: "Valeur a vie client (LTV)", benchmark: "> 3x le CAC", desc: "Revenu total par client" },
              { metric: "Taux d ouverture email", benchmark: "30-45%", desc: "Emails ouverts / envoyes" },
              { metric: "Taux de remboursement", benchmark: "< 5%", desc: "Remboursements / ventes" },
              { metric: "Taux de completion", benchmark: "> 40%", desc: "Apprenants qui finissent" },
            ].map((m) => (
              <div key={m.metric} style={{ background: "#fafafa", border: "1px solid #f1f5f9", borderRadius: 14, padding: "18px 20px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0e1512", marginBottom: 6 }}>{m.metric}</div>
                <div style={{ fontSize: 20, color: "#006e2f", marginBottom: 4 }}>{m.benchmark}</div>
                <div style={{ fontSize: 12, color: "#5c6b62" }}>{m.desc}</div>
              </div>
            ))}
          </div>

          <p>
            Novakou affiche toutes ces metriques dans votre tableau de bord vendeur, en temps reel. Vous
            pouvez filtrer par période, par produit, par source de trafic. Le dashboard identifie aussi
            automatiquement les points de friction de votre tunnel : si beaucoup de visiteurs quittent
            la page de paiement, c&apos;est peut-etre un problème de methode de paiement ou de prix.
          </p>

          <Astuce>
            <strong>Regle des 80/20 :</strong> Concentrez vos efforts sur les 20 % d&apos;actions qui generent
            80 % de vos resultats. En general, ce sont l&apos;amelioration de votre page de vente et l&apos;envoi
            regulier d&apos;emails a votre liste. Pas la creation de nouveau contenu sur 5 reseaux sociaux differents.
          </Astuce>
        </SectionGuide>

        <SectionGuide
          id="erreurs"
          titre={<>Les 5 erreurs qui tuent vos ventes (et comment les eviter)</>}
          apres={<EtiquetteGuide>CHAPITRE 10</EtiquetteGuide>}
        >
          <p>
            Après avoir accompagne des centaines de formateurs africains, nous avons identifie 5 erreurs
            recurrentes qui empechent de vendre. Les voici, avec les solutions concretes pour les eviter.
          </p>

          <div style={{ margin: "28px 0" }}>
            {[
              {
                num: "1",
                title: "Créer la formation AVANT de la vendre",
                desc: "Beaucoup de formateurs passent 3 mois a filmer 40 heures de video avant de savoir si quelqu un veut les acheter. Validez la demande d abord : faites une pre-vente avec un plan de cours, une promesse, et un delai de livraison. Si personne n achete, vous avez economise 3 mois.",
                fix: "Pre-vendez votre formation avant de la produire. 10 pre-ventes = signal vert pour produire.",
              },
              {
                num: "2",
                title: "Vendre a tout le monde (ne cibler personne)",
                desc: "Formation en marketing pour tous les entrepreneurs d Afrique ? Trop vague. Formation en marketing Instagram pour les coachs fitness francophones ? Parfait. Plus votre niche est precise, plus votre message resonne et plus votre taux de conversion est eleve.",
                fix: "Definissez votre avatar client ideal : age, pays, problème precis, pouvoir d achat.",
              },
              {
                num: "3",
                title: "Ne proposer qu un seul moyen de paiement",
                desc: "Si vous ne proposez que le paiement par carte bancaire, vous excluez 60 a 70 % de vos prospects en Afrique de l Ouest. Orange Money, Wave, et MTN Mobile Money sont les moyens de paiement principaux. Novakou les integre tous nativement.",
                fix: "Activez au minimum Mobile Money + carte bancaire. Idealement, ajoutez Wave et le virement.",
              },
              {
                num: "4",
                title: "Ignorer l email marketing",
                desc: "Les reseaux sociaux sont des terrains loues : un changement d algorithme peut reduire votre visibilite a zero du jour au lendemain. Votre liste email vous appartient. C est le seul actif marketing que personne ne peut vous retirer.",
                fix: "Collectez des emails depuis le jour 1. Envoyez au minimum 1 email par semaine a votre liste.",
              },
              {
                num: "5",
                title: "Ne jamais relancer les abandons de panier",
                desc: "En moyenne, 70 % des visiteurs qui arrivent sur votre page de paiement ne finalisent pas leur achat. Pas parce qu ils ne veulent pas, mais parce qu ils sont distraits, hesitants, ou ont ete interrompus. Une simple sequence de 3 emails de relance recupere 10 a 25 % de ces ventes perdues.",
                fix: "Activez la relance automatique de panier abandonne sur Novakou. C est un clic.",
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
          id="etude-cas"
          titre={<>Etude de cas : Aminata, de 0 a 500 000 FCFA/mois</>}
          apres={<EtiquetteGuide>CHAPITRE 11</EtiquetteGuide>}
        >
          <p>
            Aminata est une comptable senegalaise de 32 ans basee a Dakar. Comme beaucoup de professionnels
            africains, elle maitrise parfaitement son domaine mais n&apos;avait jamais envisage de vendre des
            formations en ligne. Voici son parcours, mois par mois.
          </p>

          {/* Image: portrait créatrice africaine */}
          <div style={{ borderRadius: 16, overflow: "hidden", margin: "28px 0", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
            <Image src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=900&q=80" alt="Aminata K. — formatrice en comptabilité, 500 000 FCFA par mois sur Novakou" width={900} height={380} style={{ width: "100%", objectFit: "cover", display: "block", maxHeight: 360, objectPosition: "center top" }} />
            <div style={{ fontSize: 13, color: "#006e2f", fontWeight: 700, textAlign: "center", padding: "12px 16px", background: "#f0fdf4", borderTop: "2px solid #4c9a6b" }}>
              &ldquo; J&apos;ai validé ma première vente avant même d&apos;enregistrer une seule vidéo. &rdquo;
            </div>
          </div>

          {/* Timeline */}
          <div style={{ margin: "28px 0", borderLeft: "3px solid #4c9a6b40", paddingLeft: 28 }}>
            {[
              {
                period: "Mois 1",
                title: "La validation",
                desc: "Aminata poste un sondage dans 3 groupes Facebook de comptabilite. 67 personnes disent vouloir une formation Excel pour comptables. Elle cree une page de pre-vente sur Novakou avec 3 paliers : Essentiel a 9 900 FCFA, Premium a 24 900 FCFA, VIP a 49 900 FCFA. Resultat : 14 pre-ventes en 10 jours, soit 289 100 FCFA.",
                revenue: "289 100 FCFA",
              },
              {
                period: "Mois 2",
                title: "La production + le lancement",
                desc: "Elle filme 12 modules video avec son telephone et un micro-cravate a 8 000 FCFA. Elle upload tout sur Novakou, configure sa page de vente avec temoignages des 14 premiers apprenants, et lance une campagne de 7 jours avec urgence (prix de lancement). 41 nouvelles ventes.",
                revenue: "823 000 FCFA cumulatif",
              },
              {
                period: "Mois 3",
                title: "L affiliation + les sequences email",
                desc: "Aminata active le programme d affiliation a 25 % de commission. 8 de ses apprenants partagent leur lien. En parallele, elle cree un lead magnet (PDF les 10 formules Excel que tout comptable doit connaitre) et une sequence de 5 emails automatisee. Sa liste email atteint 340 contacts. 52 ventes ce mois.",
                revenue: "1 180 000 FCFA cumulatif",
              },
              {
                period: "Mois 4-6",
                title: "L optimisation",
                desc: "Elle analyse son dashboard Novakou : 62 % des ventes viennent de WhatsApp, 23 % de l affiliation, 15 % de l email. Elle double ses efforts sur WhatsApp (statuts quotidiens, listes de diffusion). Elle cree un deuxieme produit : un pack de templates Excel premium a 14 900 FCFA. Ses revenus mensuels se stabilisent autour de 500 000 FCFA.",
                revenue: "~500 000 FCFA/mois",
              },
            ].map((step, i) => (
              <div key={step.period} style={{ marginBottom: i < 3 ? 32 : 0, position: "relative" as const }}>
                <div style={{ position: "absolute" as const, left: -38, top: 4, width: 14, height: 14, borderRadius: "50%", background: "#4c9a6b", border: "3px solid white", boxShadow: "0 0 0 2px #4c9a6b40" }} />
                <div style={{ fontSize: 12, fontWeight: 700, color: "#4c9a6b", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 4 }}>
                  {step.period}
                </div>
                <div style={{ fontSize: 17, color: "#0e1512", marginBottom: 8 }}>{step.title}</div>
                <div style={{ fontSize: 14, color: "#5c6b62", lineHeight: 1.7, marginBottom: 8 }}>{step.desc}</div>
                <div style={{ display: "inline-block", fontSize: 13, fontWeight: 700, color: "#006e2f", background: "#006e2f10", padding: "4px 14px", borderRadius: 8 }}>
                  {step.revenue}
                </div>
              </div>
            ))}
          </div>

          <Astuce>
            <strong>Ce qu&apos;Aminata a fait differemment :</strong> Elle a valide la demande AVANT de créer
            le contenu. Elle a commence avec un telephone portable, pas du materiel professionnel. Elle a
            active l&apos;affiliation des le mois 3. Et surtout, elle a choisi une niche ultra-precise :
            Excel pour comptables — pas &laquo; Excel pour tout le monde &raquo;.
          </Astuce>

          <Chiffres
            items={[
              { valeur: "500K", libelle: "FCFA / mois en revenus" },
              { valeur: "x14", libelle: "ROI sur la pre-vente initiale" },
              { valeur: "340", libelle: "Contacts email en 3 mois" },
            ]}
          />
        </SectionGuide>

        <SectionGuide
          id="conclusion"
          titre={<>Conclusion : votre prochaine étape</>}
          apres={<EtiquetteGuide>CHAPITRE 12</EtiquetteGuide>}
        >
          <p>
            Vendre des formations en ligne en Afrique francophone n&apos;est plus une utopie reservee aux
            &laquo; gros &raquo; formateurs avec du materiel professionnel et un budget marketing important.
            Avec les bons outils, la bonne methode, et la perseverance, n&apos;importe quel expert peut
            transformer son savoir en revenus recurrents.
          </p>

          <p>
            Recapitulons les étapes cles : validez la demande avec une pre-vente, construisez une page
            de vente centree sur les bénéfices, créez un tunnel simple en 4 étapes, fixez vos prix avec
            la methode des 3 paliers, promouvez d&apos;abord sur WhatsApp et Facebook, automatisez vos emails,
            activez l&apos;affiliation, et mesurez tout pour optimiser.
          </p>

          <p>
            Le marche africain de l&apos;e-learning est en pleine explosion. Les formateurs qui se positionnent
            aujourd&apos;hui construisent un avantage concurrentiel durable. Ceux qui attendent &laquo; que ce soit
            le bon moment &raquo; se retrouveront face a une concurrence plus forte dans 12 mois.
          </p>

          <p>
            La question n&apos;est pas &laquo; est-ce que ca peut marcher pour moi ? &raquo; mais &laquo; est-ce que
            je suis pret a commencer ? &raquo;
          </p>
        </SectionGuide>
      </CoqueGuide>
    </>
  );
}
