import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tarifs · 10% de commission, zéro abonnement",
  description:
    "Novakou prélève uniquement 10% sur vos ventes. Aucun abonnement mensuel, aucun frais caché. Comparez avec Gumroad, Hotmart et Systeme.io.",
  openGraph: {
    title: "Tarifs · Novakou",
    description: "10% de commission par vente. Pas d'abonnement. Toutes les fonctionnalités incluses.",
    type: "website",
  },
};

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Comment Novakou gagne-t-il de l'argent si c'est gratuit ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "La plateforme prélève une commission de 10 % sur chaque vente réalisée. Pas d'abonnement, pas de frais cachés. Vous payez seulement quand vous gagnez.",
      },
    },
    {
      "@type": "Question",
      name: "Y a-t-il des frais de transaction en plus des 10 % ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Non. Les 10 % incluent tous les frais : traitement des paiements Mobile Money, cartes bancaires, hébergement, emails transactionnels.",
      },
    },
    {
      "@type": "Question",
      name: "Quand puis-je retirer mes gains ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Les fonds sont disponibles après 48h. Vous pouvez retirer vers Orange Money, Wave, MTN MoMo, virement bancaire, ou PayPal. Pas de seuil minimum.",
      },
    },
    {
      "@type": "Question",
      name: "Y a-t-il des limites sur le nombre de produits ou d'élèves ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Non. Vous pouvez publier autant de formations, ebooks, templates ou services que vous voulez. Pas de limite d'élèves.",
      },
    },
    {
      "@type": "Question",
      name: "Comment fonctionne le programme d'affiliation ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Chaque utilisateur reçoit un lien unique. Quand quelqu'un achète via votre lien, vous recevez une commission d'affiliation définie par le vendeur (souvent 20-30 % du prix de vente).",
      },
    },
    {
      "@type": "Question",
      name: "Que se passe-t-il si un client demande un remboursement ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Les clients ont 14 jours pour demander un remboursement. Votre part et la commission sont intégralement annulées — vous ne perdez rien.",
      },
    },
  ],
};

export default function TarifsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
      />
      {children}
    </>
  );
}
