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
  "Automatiser sa vente de formation",
)}&subtitle=${encodeURIComponent(
  "Tunnels, emails, accès, paiements : vendre pendant que vous dormez",
)}`;

export const metadata: Metadata = {
  // `absolute` : « Novakou » est deja dans le titre. Sans ça, le template
  // du layout racine ajoute « | Novakou » et le nom sort deux fois.
  title: { absolute: "Automatiser vente formation : tunnel Novakou" },
  description:
    "Automatisez vos ventes de formations sur Novakou : emails de bienvenue, relances panier, accès automatique, Mobile Money. Vendez pendant que vous dormez.",
  keywords: [
    "automatisation vente formation en ligne",
    "automatiser son business Novakou",
    "email automation Afrique",
    "vente automatique formation digitale",
    "workflow automatisation créateur contenu",
    "Novakou automatisation paiement",
  ],
  alternates: {
    canonical: "/guides/automatisations-novakou",
  },
  openGraph: {
    title: "Automatiser vente formation : tunnel Novakou | Novakou",
    description:
      "Tunnels, emails, accès, paiements Mobile Money : configurez une fois, encaissez en automatique.",
    type: "article",
    url: `${APP_URL}/guides/automatisations-novakou`,
    siteName: "Novakou",
    images: [{ url: OG_IMAGE, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Automatiser vente formation : tunnel Novakou | Novakou",
    description:
      "Configurez vos tunnels Novakou une fois, encaissez Mobile Money en automatique.",
    images: [OG_IMAGE],
  },
};

export default function AutomatisationsNovakou() {
  return (
    <>
      <OldGuideJsonLd slug="automatisations-novakou" />
      <CoqueGuide
        ariane={[
          { label: "Accueil", href: "/" },
          { label: "Guides", href: "/guides" },
          { label: "Automatisations Novakou" },
        ]}
        eyebrow="Automatisation"
        titre={<>Automatisations Novakou :{" "} <em>vendre sans être connecté H24</em></>}
        sousTitre="Vous ne pouvez pas répondre à chaque acheteur à minuit. Mais votre business, lui, le peut. Découvrez comment configurer les automatisations Novakou pour que vos ventes tournent même quand vous dormez, voyagez ou êtes en famille."
        infos={[{ icone: Clock, texte: "12 min de lecture · Niveau intermédiaire" }]}
        couverture={{
          src: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=900&auto=format&fit=crop&q=80",
          alt: "Automatisation business en ligne",
          legende: "Votre business travaille 24h/24 pendant que vous vous reposez",
        }}
        chiffres={[
          { valeur: "73%", libelle: "des ventes Novakou se font hors des heures ouvrées" },
          { valeur: "4×", libelle: "plus de conversions avec un email de bienvenue automatique" },
          { valeur: "0 FCFA", libelle: "de coût supplémentaire pour activer les automatisations" },
        ]}
        titreSommaire="Dans ce guide"
        sommaire={[
          { id: "comprendre", label: "Pourquoi automatiser sur Novakou ?", n: numeroGuide(0) },
          { id: "workflow-base", label: "Le workflow de base en 5 étapes", n: numeroGuide(1) },
          { id: "email-bienvenue", label: "L'email de bienvenue qui convertit", n: numeroGuide(2) },
          { id: "acces-automatique", label: "Accès automatique à la formation", n: numeroGuide(3) },
          { id: "relances", label: "Séquences de relance intelligentes", n: numeroGuide(4) },
          { id: "paiement-mobile", label: "Automatiser les paiements mobiles", n: numeroGuide(5) },
          { id: "upsell", label: "Upsell et cross-sell automatiques", n: numeroGuide(6) },
          { id: "abandons", label: "Récupérer les paniers abandonnés", n: numeroGuide(7) },
          { id: "reporting", label: "Suivi et reporting automatisé", n: numeroGuide(8) },
          { id: "erreurs", label: "Les 5 erreurs à éviter", n: numeroGuide(9) },
        ]}
        fin={
          <>
            <CarteActionGuide
              titre="Configurez vos automatisations maintenant"
              actions={[
                { href: "/inscription", libelle: "Créer mon compte gratuit" },
                { href: "/guides/tunnel-de-vente-novakou", libelle: "Guide : Tunnel de vente →" },
              ]}
            >
              <p>Toutes ces automatisations sont disponibles gratuitement sur Novakou. Créez votre compte et activez-les en moins de 20 minutes.</p>
            </CarteActionGuide>
            <SuiteGuides
              titre="Poursuivez votre lecture"
              liens={[
                {
                  href: "/guides/sequences-emails",
                  etiquette: "← Guide précédent",
                  titre: "Séquences emails qui convertissent",
                },
                {
                  href: "/guides/tunnel-de-vente-novakou",
                  etiquette: "Guide suivant →",
                  titre: "Tunnel de vente sur Novakou",
                },
              ]}
              retour={false}
            />
          </>
        }
      >
        <SectionGuide id="comprendre" n={numeroGuide(0)} titre={<>Pourquoi automatiser sur Novakou ?</>}>
          <p className="text-[17px] leading-relaxed mb-6">
            La plupart des créateurs de contenu en Afrique francophone gèrent leur
            business de la même façon : un client envoie un message WhatsApp, le
            créateur répond manuellement, envoie le lien de paiement, puis le
            contenu. Ce modèle fonctionne jusqu'à un certain point. Quand les
            commandes arrivent à 22h depuis Abidjan, à 3h depuis Paris ou le
            dimanche depuis Douala, il s'effondre.
          </p>

          <p className="text-[17px] leading-relaxed mb-6">
            L'automatisation n'est pas réservée aux grandes entreprises.
            Novakou intègre nativement les outils pour que votre funnel de vente
            tourne en autonomie : de la première visite sur votre page produit
            jusqu'à l'accès au contenu, en passant par les rappels de paiement et
            les emails de suivi.
          </p>

          <Astuce>
            <strong>Différence clé :</strong> Un business non automatisé vous
            rémunère pour votre temps. Un business automatisé vous rémunère pour
            votre expertise, même quand vous n'êtes pas disponible. Novakou est
            conçu pour le second modèle.
          </Astuce>

          <p className="text-[17px] leading-relaxed mb-6">
            Voici les bénéfices concrets que nos créateurs observent après avoir
            configuré leurs automatisations :
          </p>

          <ul className="space-y-3 mb-8 pl-4">
            {[
              "Zéro temps passé à envoyer des accès manuellement — tout est instantané",
              "Taux d'abandon de panier réduit de 40% grâce aux relances automatiques",
              "Revenus générés la nuit et le week-end sans aucune intervention",
              "Satisfaction client améliorée : accès immédiat, pas d'attente",
              "Temps libéré pour créer du contenu plutôt que gérer des transactions",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-[15px]">
                <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs mt-0.5" style={{ backgroundColor: "#4c9a6b" }}>
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>

          {/* 2 - Workflow de base */}
        </SectionGuide>

        <SectionGuide id="workflow-base" n={numeroGuide(1)} titre={<>Le workflow de base en 5 étapes</>}>
          <p className="text-[17px] leading-relaxed mb-6">
            Avant de configurer quoi que ce soit, comprenez le parcours automatisé
            idéal sur Novakou. Chaque vente devrait suivre cette séquence :
          </p>

          <div className="my-8">
            <Etape n={1} picto="🛒" libelle="Étape 1" titre="Le client découvre votre produit">
              <p>{"Via votre page de vente Novakou, un lien partagé, une publicité ou un post organique. Il clique sur 'Acheter'."}</p>
            </Etape>
            <Etape n={2} picto="💳" libelle="Étape 2" titre="Paiement sécurisé en un clic">
              <p>{"Wave, Orange Money, MTN, carte bancaire. Novakou traite automatiquement le paiement et génère la facture."}</p>
            </Etape>
            <Etape n={3} picto="📧" libelle="Étape 3" titre="Email de confirmation immédiat">
              <p>{"Dans les 30 secondes, l'acheteur reçoit sa facture, ses identifiants et le lien d'accès direct à sa formation."}</p>
            </Etape>
            <Etape n={4} picto="🎓" libelle="Étape 4" titre="Accès automatique au contenu">
              <p>{"La formation s'ouvre dans l'espace membre de l'acheteur. Progression sauvegardée, disponible sur mobile et desktop."}</p>
            </Etape>
            <Etape n={5} picto="🔄" libelle="Étape 5" titre="Séquence de suivi activée">
              <p>{"J+1, J+3, J+7 : emails d'encouragement, rappels de progression, offres complémentaires. Tout part automatiquement."}</p>
            </Etape>
          </div>

          <ProAstuce>
            <strong>Le détail qui fait 30% de revenus en plus :</strong> ajoutez
            une offre de vente croisée dans l'email de confirmation (J+0). C'est
            le moment où l'enthousiasme de l'acheteur est au maximum. Nos
            créateurs qui le font génèrent en moyenne 30% de revenus additionnels
            sur chaque vente.
          </ProAstuce>

          {/* 3 - Email de bienvenue */}
        </SectionGuide>

        <SectionGuide id="email-bienvenue" n={numeroGuide(2)} titre={<>L'email de bienvenue qui convertit</>}>
          <p className="text-[17px] leading-relaxed mb-6">
            L'email de bienvenue est l'email le plus lu de toute la relation avec
            un client. Son taux d'ouverture dépasse souvent 70% — contre 20-25%
            pour un email marketing classique. Il faut donc en faire un levier de
            conversion, pas juste une confirmation de commande froide.
          </p>

          <p className="text-[17px] leading-relaxed mb-6">
            Dans Novakou, vous personnalisez cet email depuis votre tableau de
            bord, rubrique <em>Automatisations → Email de bienvenue</em>. Voici
            les éléments qui doivent absolument y figurer :
          </p>

          <div className="rounded-2xl border overflow-hidden my-8" style={{ borderColor: "#e6ece8" }}>
            <div className="px-5 py-3 border-b font-bold text-sm" style={{ backgroundColor: "#f0f6f2", borderColor: "#e6ece8", color: "#0e1512" }}>
              Structure de l'email de bienvenue parfait
            </div>
            <div className="divide-y" style={{ borderColor: "#e6ece8" }}>
              {[
                { label: "Objet", val: "🎉 Votre accès à [Nom formation] est prêt !" },
                { label: "Accroche", val: "Personnalisez avec le prénom. Montrez de l'enthousiasme sincère." },
                { label: "Lien d'accès", val: "Bouton grand et visible. Pas caché dans le texte." },
                { label: "Ce qui vous attend", val: "3 bénéfices concrets qu'ils vont obtenir." },
                { label: "Premier pas recommandé", val: "Dites-leur exactement par où commencer." },
                { label: "Ressource bonus", val: "PDF gratuit, checklist ou vidéo surprise. Crée du plaisir immédiat." },
                { label: "Offre complémentaire", val: "Une seule offre. Courte. Avec prix et lien." },
              ].map(({ label, val }) => (
                <div key={label} className="flex gap-4 px-5 py-4">
                  <span className="font-semibold text-sm w-36 flex-shrink-0" style={{ color: "#006e2f" }}>
                    {label}
                  </span>
                  <span className="text-sm" style={{ color: "#5c6b62" }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          <Attention>
            <strong>Évitez les emails génériques :</strong> "Merci pour votre
            achat. Voici votre lien." ne génère aucune émotion. Écrivez comme si
            vous parliez à un ami qui vient de prendre une décision importante.
            C'est ce ton qui fidélise.
          </Attention>

          {/* 4 - Accès automatique */}
        </SectionGuide>

        <SectionGuide id="acces-automatique" n={numeroGuide(3)} titre={<>Accès automatique à la formation</>}>
          <p className="text-[17px] leading-relaxed mb-6">
            Sur Novakou, dès qu'un paiement est confirmé (que ce soit par Wave,
            Orange Money ou carte bancaire), l'accès à votre formation est délivré
            instantanément. Vous n'avez rien à faire manuellement. Voici comment
            cela fonctionne techniquement :
          </p>

          <ol className="space-y-4 mb-8 pl-0">
            {[
              "Le webhook de paiement notifie Novakou en temps réel (généralement en moins de 5 secondes)",
              "Un compte apprenant est créé automatiquement si c'est le premier achat du client",
              "La formation achetée est associée au compte via un jeton d'accès sécurisé",
              "L'email de confirmation est envoyé avec le lien de connexion direct",
              "Le client accède immédiatement à son espace membre depuis mobile ou desktop",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-4">
                <span className="flex-shrink-0 w-7 h-7 rounded-full text-white flex items-center justify-center text-sm font-bold" style={{ backgroundColor: "#006e2f" }}>
                  {i + 1}
                </span>
                <span className="text-[15px] leading-relaxed pt-0.5" style={{ color: "#5c6b62" }}>
                  {step}
                </span>
              </li>
            ))}
          </ol>

          <div className="relative w-full rounded-2xl overflow-hidden my-10" style={{ height: 260 }}>
            <Image src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900&auto=format&fit=crop&q=80" alt="Espace membre formation en ligne" fill className="object-cover" sizes="(max-width: 768px) 100vw, 800px" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
            <div className="absolute inset-0 flex items-center px-8">
              <div>
                <p className="text-white text-xl font-bold mb-2">
                  Accès immédiat, expérience fluide
                </p>
                <p className="text-white/80 text-sm max-w-xs">
                  Vos clients accèdent à leur formation en moins de 30 secondes après le paiement
                </p>
              </div>
            </div>
          </div>

          <Astuce>
            <strong>Option Drip (déblocage progressif) :</strong> Novakou vous
            permet de débloquer les modules de votre formation progressivement
            (J+0, J+3, J+7, etc.). Cette technique augmente le taux de
            complétion de 55% car elle évite l'effet "trop d'un coup" qui
            paralyse les apprenants.
          </Astuce>

          {/* 5 - Relances */}
        </SectionGuide>

        <SectionGuide id="relances" n={numeroGuide(4)} titre={<>Séquences de relance intelligentes</>}>
          <p className="text-[17px] leading-relaxed mb-6">
            Seuls 20% à 30% des visiteurs achètent lors de leur première visite.
            Les 70% restants sont intéressés mais hésitent. Les relances
            automatiques sont ce qui transforme ces hésitants en acheteurs, sans
            que vous ayez à les contacter un par un.
          </p>

          <p className="text-[17px] leading-relaxed mb-6">
            Novakou vous permet de configurer des séquences email déclenchées
            par le comportement du visiteur. Voici les plus efficaces :
          </p>

          {[
            {
              trigger: "Visite page produit sans achat",
              timing: "4h après",
              subject: "Tu avais regardé [Nom formation]...",
              desc: "Rappel doux avec 1 témoignage d'un acheteur et le lien de la page produit.",
            },
            {
              trigger: "Page de paiement abandonnée",
              timing: "1h après",
              subject: "Votre place est encore disponible",
              desc: "Urgence légère, résoudre l'objection prix si possible avec une FAQ.",
            },
            {
              trigger: "Acheteur inactif (n'a pas ouvert la formation)",
              timing: "J+3 après achat",
              subject: "Vous n'avez pas encore commencé 😊",
              desc: "Motivation, rappel des bénéfices, lien direct vers le premier module.",
            },
            {
              trigger: "Formation complétée à 50%",
              timing: "Le lendemain",
              subject: "Vous êtes à mi-chemin — continuez !",
              desc: "Encouragement + teaser du prochain module + offre de la formation suivante.",
            },
          ].map((seq) => (
            <div key={seq.trigger} className="rounded-2xl border p-5 mb-4" style={{ borderColor: "#e6ece8", backgroundColor: "#ffffff" }}>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ backgroundColor: "#f0f6f2", color: "#006e2f" }}>
                  🎯 {seq.trigger}
                </span>
                <span className="text-xs font-medium px-2 py-1 rounded-lg" style={{ backgroundColor: "#fef3c7", color: "#92400e" }}>
                  ⏰ {seq.timing}
                </span>
              </div>
              <p className="font-bold text-sm mb-1">
                Objet : {seq.subject}
              </p>
              <p className="text-sm">{seq.desc}</p>
            </div>
          ))}

          <ProAstuce>
            <strong>La règle des 3 relances :</strong> ne relancez jamais plus de
            3 fois un non-acheteur sur le même produit. Au-delà, cela nuit à
            votre réputation. En revanche, vous pouvez les réintégrer dans une
            séquence 30 jours plus tard avec un angle différent.
          </ProAstuce>

          {/* 6 - Paiement mobile */}
        </SectionGuide>

        <SectionGuide id="paiement-mobile" n={numeroGuide(5)} titre={<>Automatiser les paiements mobiles</>}>
          <p className="text-[17px] leading-relaxed mb-6">
            En Afrique francophone, la majorité des transactions se font via
            mobile : Wave, Orange Money, MTN MoMo. Novakou gère nativement
            ces moyens de paiement, mais il y a quelques configurations à
            optimiser pour maximiser vos conversions.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 my-8">
            {[
              {
                name: "Wave",
                countries: "Sénégal, Côte d'Ivoire, Mali",
                tip: "Activez la notification SMS post-paiement. Les clients Wave aiment être rassurés immédiatement.",
                color: "#3b82f6",
              },
              {
                name: "Orange Money",
                countries: "17 pays AF",
                tip: "Ajoutez le numéro Orange Money dans votre email de confirmation — certains clients préfèrent payer directement.",
                color: "#f97316",
              },
              {
                name: "MTN MoMo",
                countries: "Cameroun, Ghana, Nigeria, RDC",
                tip: "Proposez un délai de paiement de 15 min sur la page checkout pour laisser le temps de charger le compte.",
                color: "#eab308",
              },
              {
                name: "Carte bancaire",
                countries: "International + diaspora",
                tip: "Activez le paiement en 3× pour les formations > 30 000 FCFA. Cela augmente les conversions de 25%.",
                color: "#8b5cf6",
              },
            ].map((pm) => (
              <div key={pm.name} className="rounded-2xl border p-5" style={{ borderColor: "#e6ece8" }}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: pm.color }}>
                    {pm.name.slice(0, 2)}
                  </span>
                  <div>
                    <p className="font-bold text-sm">{pm.name}</p>
                    <p className="text-xs">{pm.countries}</p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed">
                  💡 {pm.tip}
                </p>
              </div>
            ))}
          </div>

          <Attention>
            <strong>Problème fréquent — délai de confirmation :</strong> les
            paiements Wave et Orange Money peuvent mettre 30 secondes à 2 minutes
            pour être confirmés par le réseau. Ne configurez jamais l'accès à
            la formation AVANT la confirmation réelle du paiement. Novakou
            attends la confirmation du webhook avant de délivrer l'accès.
          </Attention>

          {/* 7 - Upsell */}
        </SectionGuide>

        <SectionGuide id="upsell" n={numeroGuide(6)} titre={<>Upsell et cross-sell automatiques</>}>
          <p className="text-[17px] leading-relaxed mb-6">
            Le moment le plus facile pour vendre est juste après une vente. Un
            client qui vient d'acheter est en mode "oui" — il a confiance en vous,
            il a sorti sa carte (ou son Wave), et son problème initial est en
            cours de résolution. C'est le moment de lui proposer plus.
          </p>

          <p className="text-[17px] leading-relaxed mb-6">
            Novakou vous permet de configurer deux types d'offres automatiques :
          </p>

          <div className="grid sm:grid-cols-2 gap-6 my-8">
            <div className="rounded-2xl border p-6" style={{ borderColor: "#e6ece8", borderLeftWidth: 4, borderLeftColor: "#4c9a6b" }}>
              <h3 className="font-bold text-base mb-2">
                🔼 Order Bump
              </h3>
              <p className="text-sm leading-relaxed mb-3">
                Une offre additionnelle affichée sur la page de paiement, juste
                avant la validation. Un clic pour l'ajouter.
              </p>
              <p className="text-xs font-bold px-2 py-1 rounded-lg inline-block">
                Exemple : "Ajoutez les slides PDF — 3 000 FCFA"
              </p>
            </div>
            <div className="rounded-2xl border p-6" style={{ borderColor: "#e6ece8", borderLeftWidth: 4, borderLeftColor: "#006e2f" }}>
              <h3 className="font-bold text-base mb-2">
                ⬆️ Upsell post-achat
              </h3>
              <p className="text-sm leading-relaxed mb-3">
                Redirection vers une page d'offre spéciale après le paiement,
                avec un seul bouton "Oui, je prends aussi".
              </p>
              <p className="text-xs font-bold px-2 py-1 rounded-lg inline-block">
                Exemple : "Accès à la session coaching live — 25 000 FCFA"
              </p>
            </div>
          </div>

          <Astuce>
            <strong>Taux de conversion moyen de l'order bump :</strong> entre
            15% et 35% selon la pertinence de l'offre. Si votre order bump est
            directement lié à la formation principale (template, ressource, bonus),
            vous êtes dans les 35%. S'il est générique, vous tombez sous les 10%.
          </Astuce>

          {/* 8 - Paniers abandonnés */}
        </SectionGuide>

        <SectionGuide id="abandons" n={numeroGuide(7)} titre={<>Récupérer les paniers abandonnés</>}>
          <p className="text-[17px] leading-relaxed mb-6">
            En moyenne, 65% à 75% des visiteurs qui commencent le processus
            d'achat ne le finalisent pas. C'est la réalité pour toutes les
            plateformes de vente, pas seulement Novakou. Mais cette statistique
            n'est pas une fatalité — vous pouvez récupérer une partie de ces
            abandons avec les bons déclencheurs.
          </p>

          <div className="rounded-2xl border overflow-hidden my-8" style={{ borderColor: "#e6ece8" }}>
            <div className="px-5 py-3 border-b font-bold text-sm" style={{ backgroundColor: "#f0f6f2", borderColor: "#e6ece8", color: "#0e1512" }}>
              Séquence récupération panier abandonné (3 emails)
            </div>
            <div className="divide-y" style={{ borderColor: "#e6ece8" }}>
              {[
                { timing: "1h après l'abandon", objet: "Votre accès vous attend encore", contenu: "Simple rappel. Lien direct vers la page de paiement. Pas de pression." },
                { timing: "24h après", objet: "Une question sur [Nom formation]", contenu: "Anticipez l'objection principale (prix ? temps ? doute ?). Répondez-y directement." },
                { timing: "72h après", objet: "Dernière chance : offre spéciale 48h", contenu: "Bonus exclusif ou petit réduction pour les décideurs tardifs. Urgence réelle." },
              ].map(({ timing, objet, contenu }) => (
                <div key={timing} className="px-5 py-4">
                  <div className="flex items-start gap-4">
                    <span className="text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0 mt-0.5" style={{ backgroundColor: "#fdf7ea", color: "#92400e" }}>
                      {timing}
                    </span>
                    <div>
                      <p className="font-semibold text-sm mb-1">📧 {objet}</p>
                      <p className="text-sm">{contenu}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 9 - Reporting */}
        </SectionGuide>

        <SectionGuide id="reporting" n={numeroGuide(8)} titre={<>Suivi et reporting automatisé</>}>
          <p className="text-[17px] leading-relaxed mb-6">
            L'automatisation ne sert à rien si vous ne mesurez pas ce qui
            fonctionne. Novakou vous offre un tableau de bord de suivi des
            automatisations où vous pouvez voir, en temps réel, les performances
            de chaque email et déclencheur.
          </p>

          <div className="grid sm:grid-cols-3 gap-4 my-8">
            {[
              { metric: "Taux d'ouverture", ideal: "> 40%", desc: "Email de bienvenue" },
              { metric: "Taux de clic", ideal: "> 15%", desc: "Emails de relance" },
              { metric: "Taux de récupération", ideal: "> 8%", desc: "Paniers abandonnés" },
            ].map((m) => (
              <div key={m.metric} className="rounded-2xl border p-5 text-center" style={{ borderColor: "#e6ece8", backgroundColor: "#f0f6f2" }}>
                <p className="text-2xl font-bold mb-1">{m.ideal}</p>
                <p className="text-sm font-semibold mb-1">{m.metric}</p>
                <p className="text-xs">{m.desc}</p>
              </div>
            ))}
          </div>

          <p className="text-[17px] leading-relaxed mb-6">
            Si vos chiffres sont sous ces seuils, voici les premières
            optimisations à faire : améliorer l'objet de l'email (taux
            d'ouverture), clarifier le bouton d'appel à l'action (taux de
            clic), ou revoir l'offre de relance (taux de récupération).
          </p>

          {/* 10 - Erreurs */}
        </SectionGuide>

        <SectionGuide id="erreurs" n={numeroGuide(9)} titre={<>Les 5 erreurs à éviter absolument</>}>
          <p className="text-[17px] leading-relaxed mb-6">
            Les automatisations sont puissantes mais peuvent aussi nuire à votre
            image si elles sont mal configurées. Voici les erreurs les plus
            fréquentes observées sur Novakou :
          </p>

          {[
            {
              num: "01",
              title: "Envoyer trop d'emails trop vite",
              desc: "3 emails en 24 heures après un achat, ça ressemble à du spam. Espacez vos séquences. Respectez le temps de vos clients.",
            },
            {
              num: "02",
              title: "Ne jamais tester ses automatisations",
              desc: "Faites toujours un achat test avant de lancer. Vérifiez que vous recevez bien l'email de bienvenue, que l'accès est fonctionnel, que les liens marchent.",
            },
            {
              num: "03",
              title: "Relancer les acheteurs comme les non-acheteurs",
              desc: "Quelqu'un qui a déjà acheté ne doit pas recevoir une relance 'Votre place est encore disponible'. Segmentez impérativement vos séquences.",
            },
            {
              num: "04",
              title: "Oublier de personnaliser avec le prénom",
              desc: "L'email générique sans prénom décroche moins. Novakou injecte automatiquement le prénom de l'acheteur — utilisez cette variable.",
            },
            {
              num: "05",
              title: "Ne pas surveiller les bounces et désinscriptions",
              desc: "Si votre taux de désinscription dépasse 2%, quelque chose cloche dans votre séquence. Analysez quels emails provoquent les départs.",
            },
          ].map((err) => (
            <div key={err.num} className="flex items-start gap-4 rounded-2xl border p-5 mb-4" style={{ borderColor: "#e6ece8", backgroundColor: "#ffffff" }}>
              <span className="flex-shrink-0 text-3xl font-black opacity-10" style={{ color: "#006e2f" }}>
                {err.num}
              </span>
              <div>
                <p className="font-bold text-base mb-1">{err.title}</p>
                <p className="text-sm leading-relaxed">{err.desc}</p>
              </div>
            </div>
          ))}
        </SectionGuide>
      </CoqueGuide>
    </>
  );
}
