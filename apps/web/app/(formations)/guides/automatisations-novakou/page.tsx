import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title:
    "Automatisations Novakou : vendre sans être connecté H24 | Guide 2026",
  description:
    "Découvrez comment automatiser vos ventes sur Novakou : emails de bienvenue, séquences de relance, accès automatique aux formations, paiements mobiles. Vendez pendant que vous dormez.",
  keywords: [
    "automatisation vente formation en ligne",
    "automatiser son business Novakou",
    "email automation Afrique",
    "vente automatique formation digitale",
    "workflow automatisation créateur contenu",
    "Novakou automatisation paiement",
  ],
  openGraph: {
    title:
      "Automatisations Novakou : vendre sans être connecté H24 | Guide 2026",
    description:
      "Comment automatiser vos ventes de formations sur Novakou pour générer des revenus passifs en Afrique francophone.",
    type: "article",
  },
};

/* ─── Typography ─── */
const S = {
  fontFamily:
    "'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
} as const;
const SH = { ...S, fontWeight: 700, letterSpacing: "-0.04em" } as const;

/* ─── Palette ─── */
const C = {
  primary: "#006e2f",
  accent: "#22c55e",
  dark: "#191c1e",
  muted: "#5c647a",
  surface: "#f6fbf2",
  surfaceLow: "#f0f5ec",
  surfaceHigh: "#e5eae1",
  white: "#ffffff",
  tipBg: "#ecfdf5",
  tipBorder: "#a7f3d0",
  warnBg: "#fffbeb",
  warnBorder: "#fde68a",
  proBg: "#eff6ff",
  proBorder: "#bfdbfe",
} as const;

/* ─── Helper components ─── */
function Breadcrumb() {
  return (
    <nav
      aria-label="Fil d'Ariane"
      className="flex items-center gap-2 text-sm mb-6 flex-wrap"
      style={{ ...S, color: C.muted }}
    >
      <Link href="/" className="hover:underline" style={{ color: C.primary }}>
        Accueil
      </Link>
      <span>/</span>
      <Link
        href="/guides"
        className="hover:underline"
        style={{ color: C.primary }}
      >
        Guides
      </Link>
      <span>/</span>
      <span style={{ color: C.dark }}>Automatisations Novakou</span>
    </nav>
  );
}

function TipBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-5 my-8 border"
      style={{ ...S, backgroundColor: C.tipBg, borderColor: C.tipBorder, color: C.dark }}
    >
      <div className="flex items-start gap-3">
        <span
          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold"
          style={{ backgroundColor: C.accent }}
        >
          i
        </span>
        <div className="text-[15px] leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function WarnBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-5 my-8 border"
      style={{ ...S, backgroundColor: C.warnBg, borderColor: C.warnBorder, color: C.dark }}
    >
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold bg-amber-500">
          !
        </span>
        <div className="text-[15px] leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function ProTip({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-5 my-8 border"
      style={{ ...S, backgroundColor: C.proBg, borderColor: C.proBorder, color: C.dark }}
    >
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 px-2 py-0.5 rounded text-xs font-bold text-white bg-blue-600">
          PRO
        </span>
        <div className="text-[15px] leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function SectionHeading({
  id,
  number,
  children,
}: {
  id: string;
  number?: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      id={id}
      className="text-2xl sm:text-3xl mt-16 mb-6 scroll-mt-28"
      style={{ ...SH, color: C.dark }}
    >
      {number && (
        <span
          className="inline-flex items-center justify-center w-9 h-9 rounded-full text-base mr-3 text-white"
          style={{ backgroundColor: C.primary }}
        >
          {number}
        </span>
      )}
      {children}
    </h2>
  );
}

function AutoStep({
  step,
  title,
  desc,
  icon,
}: {
  step: number;
  title: string;
  desc: string;
  icon: string;
}) {
  return (
    <div className="flex items-start gap-4 p-5 rounded-2xl border mb-4"
      style={{ borderColor: C.surfaceHigh, backgroundColor: C.white }}>
      <div
        className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
        style={{ backgroundColor: C.surface }}
      >
        {icon}
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: C.primary }}
          >
            Étape {step}
          </span>
        </div>
        <p className="font-bold text-[15px] mb-1" style={{ ...SH, color: C.dark }}>{title}</p>
        <p className="text-sm leading-relaxed" style={{ ...S, color: C.muted }}>{desc}</p>
      </div>
    </div>
  );
}

/* ─── Main page ─── */
export default function AutomatisationsNovakou() {
  return (
    <div style={{ ...S, backgroundColor: C.white, color: C.dark }}>
      {/* ── Hero ── */}
      <section
        className="relative py-16 px-4 sm:px-6"
        style={{ background: `linear-gradient(135deg, ${C.surface} 0%, #e8f5e9 100%)` }}
      >
        <div className="max-w-3xl mx-auto">
          <Breadcrumb />

          <div className="flex items-center gap-2 mb-4">
            <span
              className="text-xs font-bold px-3 py-1 rounded-full text-white"
              style={{ backgroundColor: C.primary }}
            >
              Automatisation
            </span>
            <span className="text-xs" style={{ color: C.muted }}>
              12 min de lecture · Niveau intermédiaire
            </span>
          </div>

          <h1
            className="text-3xl sm:text-5xl mb-5 leading-tight"
            style={{ ...SH, color: C.dark }}
          >
            Automatisations Novakou :{" "}
            <span style={{ color: C.primary }}>vendre sans être connecté H24</span>
          </h1>

          <p className="text-lg sm:text-xl leading-relaxed mb-8" style={{ color: C.muted }}>
            Vous ne pouvez pas répondre à chaque acheteur à minuit. Mais votre
            business, lui, le peut. Découvrez comment configurer les
            automatisations Novakou pour que vos ventes tournent même quand vous
            dormez, voyagez ou êtes en famille.
          </p>

          {/* Stats rapides */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { val: "73%", label: "des ventes Novakou se font hors des heures ouvrées" },
              { val: "4×", label: "plus de conversions avec un email de bienvenue automatique" },
              { val: "0 FCFA", label: "de coût supplémentaire pour activer les automatisations" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl p-4 text-center"
                style={{ backgroundColor: C.white }}
              >
                <p className="text-2xl font-bold mb-1" style={{ ...SH, color: C.primary }}>{s.val}</p>
                <p className="text-xs leading-snug" style={{ color: C.muted }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Hero image ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-4 mb-8">
        <div className="relative w-full rounded-2xl overflow-hidden shadow-lg" style={{ height: 340 }}>
          <Image
            src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=900&auto=format&fit=crop&q=80"
            alt="Automatisation business en ligne"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 800px"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <p className="absolute bottom-4 left-5 text-white text-sm font-medium" style={S}>
            Votre business travaille 24h/24 pendant que vous vous reposez
          </p>
        </div>
      </div>

      {/* ── Table des matières ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 mb-12">
        <div
          className="rounded-2xl p-6 border"
          style={{ backgroundColor: C.surface, borderColor: C.surfaceHigh }}
        >
          <p className="font-bold text-sm mb-4 uppercase tracking-widest" style={{ color: C.primary }}>
            Dans ce guide
          </p>
          <ol className="space-y-2 text-sm" style={{ color: C.dark }}>
            {[
              ["comprendre", "Pourquoi automatiser sur Novakou ?"],
              ["workflow-base", "Le workflow de base en 5 étapes"],
              ["email-bienvenue", "L'email de bienvenue qui convertit"],
              ["acces-automatique", "Accès automatique à la formation"],
              ["relances", "Séquences de relance intelligentes"],
              ["paiement-mobile", "Automatiser les paiements mobiles"],
              ["upsell", "Upsell et cross-sell automatiques"],
              ["abandons", "Récupérer les paniers abandonnés"],
              ["reporting", "Suivi et reporting automatisé"],
              ["erreurs", "Les 5 erreurs à éviter"],
            ].map(([id, label]) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="hover:underline flex items-center gap-2"
                  style={{ color: C.primary }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: C.accent }}
                  />
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* ── Content ── */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">

        {/* 1 - Pourquoi automatiser */}
        <SectionHeading id="comprendre" number="1">
          Pourquoi automatiser sur Novakou ?
        </SectionHeading>

        <p className="text-[17px] leading-relaxed mb-6" style={{ color: C.muted }}>
          La plupart des créateurs de contenu en Afrique francophone gèrent leur
          business de la même façon : un client envoie un message WhatsApp, le
          créateur répond manuellement, envoie le lien de paiement, puis le
          contenu. Ce modèle fonctionne jusqu'à un certain point. Quand les
          commandes arrivent à 22h depuis Abidjan, à 3h depuis Paris ou le
          dimanche depuis Douala, il s'effondre.
        </p>

        <p className="text-[17px] leading-relaxed mb-6" style={{ color: C.muted }}>
          L'automatisation n'est pas réservée aux grandes entreprises.
          Novakou intègre nativement les outils pour que votre funnel de vente
          tourne en autonomie : de la première visite sur votre page produit
          jusqu'à l'accès au contenu, en passant par les rappels de paiement et
          les emails de suivi.
        </p>

        <TipBox>
          <strong>Différence clé :</strong> Un business non automatisé vous
          rémunère pour votre temps. Un business automatisé vous rémunère pour
          votre expertise, même quand vous n'êtes pas disponible. Novakou est
          conçu pour le second modèle.
        </TipBox>

        <p className="text-[17px] leading-relaxed mb-6" style={{ color: C.muted }}>
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
            <li key={item} className="flex items-start gap-3 text-[15px]" style={{ color: C.muted }}>
              <span
                className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs mt-0.5"
                style={{ backgroundColor: C.accent }}
              >
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>

        {/* 2 - Workflow de base */}
        <SectionHeading id="workflow-base" number="2">
          Le workflow de base en 5 étapes
        </SectionHeading>

        <p className="text-[17px] leading-relaxed mb-6" style={{ color: C.muted }}>
          Avant de configurer quoi que ce soit, comprenez le parcours automatisé
          idéal sur Novakou. Chaque vente devrait suivre cette séquence :
        </p>

        <div className="my-8">
          <AutoStep
            step={1}
            icon="🛒"
            title="Le client découvre votre produit"
            desc="Via votre page de vente Novakou, un lien partagé, une publicité ou un post organique. Il clique sur 'Acheter'."
          />
          <AutoStep
            step={2}
            icon="💳"
            title="Paiement sécurisé en un clic"
            desc="Wave, Orange Money, MTN, carte bancaire. Novakou traite automatiquement le paiement et génère la facture."
          />
          <AutoStep
            step={3}
            icon="📧"
            title="Email de confirmation immédiat"
            desc="Dans les 30 secondes, l'acheteur reçoit sa facture, ses identifiants et le lien d'accès direct à sa formation."
          />
          <AutoStep
            step={4}
            icon="🎓"
            title="Accès automatique au contenu"
            desc="La formation s'ouvre dans l'espace membre de l'acheteur. Progression sauvegardée, disponible sur mobile et desktop."
          />
          <AutoStep
            step={5}
            icon="🔄"
            title="Séquence de suivi activée"
            desc="J+1, J+3, J+7 : emails d'encouragement, rappels de progression, offres complémentaires. Tout part automatiquement."
          />
        </div>

        <ProTip>
          <strong>Le détail qui fait 30% de revenus en plus :</strong> ajoutez
          une offre de vente croisée dans l'email de confirmation (J+0). C'est
          le moment où l'enthousiasme de l'acheteur est au maximum. Nos
          créateurs qui le font génèrent en moyenne 30% de revenus additionnels
          sur chaque vente.
        </ProTip>

        {/* 3 - Email de bienvenue */}
        <SectionHeading id="email-bienvenue" number="3">
          L'email de bienvenue qui convertit
        </SectionHeading>

        <p className="text-[17px] leading-relaxed mb-6" style={{ color: C.muted }}>
          L'email de bienvenue est l'email le plus lu de toute la relation avec
          un client. Son taux d'ouverture dépasse souvent 70% — contre 20-25%
          pour un email marketing classique. Il faut donc en faire un levier de
          conversion, pas juste une confirmation de commande froide.
        </p>

        <p className="text-[17px] leading-relaxed mb-6" style={{ color: C.muted }}>
          Dans Novakou, vous personnalisez cet email depuis votre tableau de
          bord, rubrique <em>Automatisations → Email de bienvenue</em>. Voici
          les éléments qui doivent absolument y figurer :
        </p>

        <div
          className="rounded-2xl border overflow-hidden my-8"
          style={{ borderColor: C.surfaceHigh }}
        >
          <div
            className="px-5 py-3 border-b font-bold text-sm"
            style={{ backgroundColor: C.surface, borderColor: C.surfaceHigh, color: C.dark, ...SH }}
          >
            Structure de l'email de bienvenue parfait
          </div>
          <div className="divide-y" style={{ borderColor: C.surfaceHigh }}>
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
                <span className="font-semibold text-sm w-36 flex-shrink-0" style={{ color: C.primary, ...S }}>
                  {label}
                </span>
                <span className="text-sm" style={{ color: C.muted, ...S }}>{val}</span>
              </div>
            ))}
          </div>
        </div>

        <WarnBox>
          <strong>Évitez les emails génériques :</strong> "Merci pour votre
          achat. Voici votre lien." ne génère aucune émotion. Écrivez comme si
          vous parliez à un ami qui vient de prendre une décision importante.
          C'est ce ton qui fidélise.
        </WarnBox>

        {/* 4 - Accès automatique */}
        <SectionHeading id="acces-automatique" number="4">
          Accès automatique à la formation
        </SectionHeading>

        <p className="text-[17px] leading-relaxed mb-6" style={{ color: C.muted }}>
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
              <span
                className="flex-shrink-0 w-7 h-7 rounded-full text-white flex items-center justify-center text-sm font-bold"
                style={{ backgroundColor: C.primary }}
              >
                {i + 1}
              </span>
              <span className="text-[15px] leading-relaxed pt-0.5" style={{ color: C.muted, ...S }}>
                {step}
              </span>
            </li>
          ))}
        </ol>

        <div className="relative w-full rounded-2xl overflow-hidden my-10" style={{ height: 260 }}>
          <Image
            src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900&auto=format&fit=crop&q=80"
            alt="Espace membre formation en ligne"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 800px"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
          <div className="absolute inset-0 flex items-center px-8">
            <div>
              <p className="text-white text-xl font-bold mb-2" style={SH}>
                Accès immédiat, expérience fluide
              </p>
              <p className="text-white/80 text-sm max-w-xs" style={S}>
                Vos clients accèdent à leur formation en moins de 30 secondes après le paiement
              </p>
            </div>
          </div>
        </div>

        <TipBox>
          <strong>Option Drip (déblocage progressif) :</strong> Novakou vous
          permet de débloquer les modules de votre formation progressivement
          (J+0, J+3, J+7, etc.). Cette technique augmente le taux de
          complétion de 55% car elle évite l'effet "trop d'un coup" qui
          paralyse les apprenants.
        </TipBox>

        {/* 5 - Relances */}
        <SectionHeading id="relances" number="5">
          Séquences de relance intelligentes
        </SectionHeading>

        <p className="text-[17px] leading-relaxed mb-6" style={{ color: C.muted }}>
          Seuls 20% à 30% des visiteurs achètent lors de leur première visite.
          Les 70% restants sont intéressés mais hésitent. Les relances
          automatiques sont ce qui transforme ces hésitants en acheteurs, sans
          que vous ayez à les contacter un par un.
        </p>

        <p className="text-[17px] leading-relaxed mb-6" style={{ color: C.muted }}>
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
          <div
            key={seq.trigger}
            className="rounded-2xl border p-5 mb-4"
            style={{ borderColor: C.surfaceHigh, backgroundColor: C.white }}
          >
            <div className="flex flex-wrap gap-2 mb-3">
              <span
                className="text-xs font-bold px-2 py-1 rounded-lg"
                style={{ backgroundColor: C.surface, color: C.primary }}
              >
                🎯 {seq.trigger}
              </span>
              <span
                className="text-xs font-medium px-2 py-1 rounded-lg"
                style={{ backgroundColor: "#fef3c7", color: "#92400e" }}
              >
                ⏰ {seq.timing}
              </span>
            </div>
            <p className="font-bold text-sm mb-1" style={{ ...SH, color: C.dark }}>
              Objet : {seq.subject}
            </p>
            <p className="text-sm" style={{ color: C.muted, ...S }}>{seq.desc}</p>
          </div>
        ))}

        <ProTip>
          <strong>La règle des 3 relances :</strong> ne relancez jamais plus de
          3 fois un non-acheteur sur le même produit. Au-delà, cela nuit à
          votre réputation. En revanche, vous pouvez les réintégrer dans une
          séquence 30 jours plus tard avec un angle différent.
        </ProTip>

        {/* 6 - Paiement mobile */}
        <SectionHeading id="paiement-mobile" number="6">
          Automatiser les paiements mobiles
        </SectionHeading>

        <p className="text-[17px] leading-relaxed mb-6" style={{ color: C.muted }}>
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
            <div
              key={pm.name}
              className="rounded-2xl border p-5"
              style={{ borderColor: C.surfaceHigh }}
            >
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                  style={{ backgroundColor: pm.color }}
                >
                  {pm.name.slice(0, 2)}
                </span>
                <div>
                  <p className="font-bold text-sm" style={{ ...SH, color: C.dark }}>{pm.name}</p>
                  <p className="text-xs" style={{ color: C.muted }}>{pm.countries}</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: C.muted, ...S }}>
                💡 {pm.tip}
              </p>
            </div>
          ))}
        </div>

        <WarnBox>
          <strong>Problème fréquent — délai de confirmation :</strong> les
          paiements Wave et Orange Money peuvent mettre 30 secondes à 2 minutes
          pour être confirmés par le réseau. Ne configurez jamais l'accès à
          la formation AVANT la confirmation réelle du paiement. Novakou
          attends la confirmation du webhook avant de délivrer l'accès.
        </WarnBox>

        {/* 7 - Upsell */}
        <SectionHeading id="upsell" number="7">
          Upsell et cross-sell automatiques
        </SectionHeading>

        <p className="text-[17px] leading-relaxed mb-6" style={{ color: C.muted }}>
          Le moment le plus facile pour vendre est juste après une vente. Un
          client qui vient d'acheter est en mode "oui" — il a confiance en vous,
          il a sorti sa carte (ou son Wave), et son problème initial est en
          cours de résolution. C'est le moment de lui proposer plus.
        </p>

        <p className="text-[17px] leading-relaxed mb-6" style={{ color: C.muted }}>
          Novakou vous permet de configurer deux types d'offres automatiques :
        </p>

        <div className="grid sm:grid-cols-2 gap-6 my-8">
          <div className="rounded-2xl border p-6" style={{ borderColor: C.surfaceHigh, borderLeftWidth: 4, borderLeftColor: C.accent }}>
            <h3 className="font-bold text-base mb-2" style={{ ...SH, color: C.dark }}>
              🔼 Order Bump
            </h3>
            <p className="text-sm leading-relaxed mb-3" style={{ color: C.muted, ...S }}>
              Une offre additionnelle affichée sur la page de paiement, juste
              avant la validation. Un clic pour l'ajouter.
            </p>
            <p className="text-xs font-bold px-2 py-1 rounded-lg inline-block" style={{ backgroundColor: C.tipBg, color: C.primary }}>
              Exemple : "Ajoutez les slides PDF — 3 000 FCFA"
            </p>
          </div>
          <div className="rounded-2xl border p-6" style={{ borderColor: C.surfaceHigh, borderLeftWidth: 4, borderLeftColor: C.primary }}>
            <h3 className="font-bold text-base mb-2" style={{ ...SH, color: C.dark }}>
              ⬆️ Upsell post-achat
            </h3>
            <p className="text-sm leading-relaxed mb-3" style={{ color: C.muted, ...S }}>
              Redirection vers une page d'offre spéciale après le paiement,
              avec un seul bouton "Oui, je prends aussi".
            </p>
            <p className="text-xs font-bold px-2 py-1 rounded-lg inline-block" style={{ backgroundColor: C.tipBg, color: C.primary }}>
              Exemple : "Accès à la session coaching live — 25 000 FCFA"
            </p>
          </div>
        </div>

        <TipBox>
          <strong>Taux de conversion moyen de l'order bump :</strong> entre
          15% et 35% selon la pertinence de l'offre. Si votre order bump est
          directement lié à la formation principale (template, ressource, bonus),
          vous êtes dans les 35%. S'il est générique, vous tombez sous les 10%.
        </TipBox>

        {/* 8 - Paniers abandonnés */}
        <SectionHeading id="abandons" number="8">
          Récupérer les paniers abandonnés
        </SectionHeading>

        <p className="text-[17px] leading-relaxed mb-6" style={{ color: C.muted }}>
          En moyenne, 65% à 75% des visiteurs qui commencent le processus
          d'achat ne le finalisent pas. C'est la réalité pour toutes les
          plateformes de vente, pas seulement Novakou. Mais cette statistique
          n'est pas une fatalité — vous pouvez récupérer une partie de ces
          abandons avec les bons déclencheurs.
        </p>

        <div
          className="rounded-2xl border overflow-hidden my-8"
          style={{ borderColor: C.surfaceHigh }}
        >
          <div className="px-5 py-3 border-b font-bold text-sm" style={{ backgroundColor: C.surface, borderColor: C.surfaceHigh, color: C.dark, ...SH }}>
            Séquence récupération panier abandonné (3 emails)
          </div>
          <div className="divide-y" style={{ borderColor: C.surfaceHigh }}>
            {[
              { timing: "1h après l'abandon", objet: "Votre accès vous attend encore", contenu: "Simple rappel. Lien direct vers la page de paiement. Pas de pression." },
              { timing: "24h après", objet: "Une question sur [Nom formation]", contenu: "Anticipez l'objection principale (prix ? temps ? doute ?). Répondez-y directement." },
              { timing: "72h après", objet: "Dernière chance : offre spéciale 48h", contenu: "Bonus exclusif ou petit réduction pour les décideurs tardifs. Urgence réelle." },
            ].map(({ timing, objet, contenu }) => (
              <div key={timing} className="px-5 py-4">
                <div className="flex items-start gap-4">
                  <span className="text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0 mt-0.5" style={{ backgroundColor: C.warnBg, color: "#92400e" }}>
                    {timing}
                  </span>
                  <div>
                    <p className="font-semibold text-sm mb-1" style={{ color: C.dark, ...SH }}>📧 {objet}</p>
                    <p className="text-sm" style={{ color: C.muted, ...S }}>{contenu}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 9 - Reporting */}
        <SectionHeading id="reporting" number="9">
          Suivi et reporting automatisé
        </SectionHeading>

        <p className="text-[17px] leading-relaxed mb-6" style={{ color: C.muted }}>
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
            <div key={m.metric} className="rounded-2xl border p-5 text-center" style={{ borderColor: C.surfaceHigh, backgroundColor: C.surface }}>
              <p className="text-2xl font-bold mb-1" style={{ ...SH, color: C.primary }}>{m.ideal}</p>
              <p className="text-sm font-semibold mb-1" style={{ color: C.dark, ...S }}>{m.metric}</p>
              <p className="text-xs" style={{ color: C.muted, ...S }}>{m.desc}</p>
            </div>
          ))}
        </div>

        <p className="text-[17px] leading-relaxed mb-6" style={{ color: C.muted }}>
          Si vos chiffres sont sous ces seuils, voici les premières
          optimisations à faire : améliorer l'objet de l'email (taux
          d'ouverture), clarifier le bouton d'appel à l'action (taux de
          clic), ou revoir l'offre de relance (taux de récupération).
        </p>

        {/* 10 - Erreurs */}
        <SectionHeading id="erreurs" number="10">
          Les 5 erreurs à éviter absolument
        </SectionHeading>

        <p className="text-[17px] leading-relaxed mb-6" style={{ color: C.muted }}>
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
          <div
            key={err.num}
            className="flex items-start gap-4 rounded-2xl border p-5 mb-4"
            style={{ borderColor: C.surfaceHigh, backgroundColor: C.white }}
          >
            <span
              className="flex-shrink-0 text-3xl font-black opacity-10"
              style={{ color: C.primary, fontFamily: "monospace" }}
            >
              {err.num}
            </span>
            <div>
              <p className="font-bold text-base mb-1" style={{ ...SH, color: C.dark }}>{err.title}</p>
              <p className="text-sm leading-relaxed" style={{ color: C.muted, ...S }}>{err.desc}</p>
            </div>
          </div>
        ))}

        {/* CTA final */}
        <div
          className="mt-16 rounded-2xl p-8 text-center"
          style={{ background: `linear-gradient(135deg, ${C.primary} 0%, #004d20 100%)` }}
        >
          <p className="text-white text-2xl font-bold mb-3" style={SH}>
            Configurez vos automatisations maintenant
          </p>
          <p className="text-white/80 mb-6 text-sm max-w-md mx-auto" style={S}>
            Toutes ces automatisations sont disponibles gratuitement sur Novakou.
            Créez votre compte et activez-les en moins de 20 minutes.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/inscription"
              className="px-6 py-3 rounded-xl font-bold text-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: C.accent, color: C.dark, ...SH }}
            >
              Créer mon compte gratuit
            </Link>
            <Link
              href="/guides/tunnel-de-vente-novakou"
              className="px-6 py-3 rounded-xl font-bold text-sm border border-white/30 text-white transition-opacity hover:opacity-80"
              style={S}
            >
              Guide : Tunnel de vente →
            </Link>
          </div>
        </div>

        {/* Navigation entre guides */}
        <div className="mt-12 grid sm:grid-cols-2 gap-4">
          <Link
            href="/guides/sequences-emails"
            className="rounded-2xl border p-5 hover:border-green-300 transition-colors group"
            style={{ borderColor: C.surfaceHigh }}
          >
            <p className="text-xs mb-1" style={{ color: C.muted }}>← Guide précédent</p>
            <p className="font-bold text-sm group-hover:text-green-700 transition-colors" style={{ ...SH, color: C.dark }}>
              Séquences emails qui convertissent
            </p>
          </Link>
          <Link
            href="/guides/tunnel-de-vente-novakou"
            className="rounded-2xl border p-5 hover:border-green-300 transition-colors group text-right"
            style={{ borderColor: C.surfaceHigh }}
          >
            <p className="text-xs mb-1" style={{ color: C.muted }}>Guide suivant →</p>
            <p className="font-bold text-sm group-hover:text-green-700 transition-colors" style={{ ...SH, color: C.dark }}>
              Tunnel de vente sur Novakou
            </p>
          </Link>
        </div>
      </article>
    </div>
  );
}
