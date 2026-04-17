import Link from "next/link";

export const metadata = {
  title: "Centre d'aide — Novakou",
  description: "Trouvez des réponses à vos questions sur Novakou Formations.",
};

const FAQS = [
  {
    q: "Comment fonctionne l'achat d'une formation ?",
    a: "Ajoutez la formation au panier, validez votre paiement (carte bancaire, Mobile Money, Wave). L'accès est immédiat et à vie. Vous pouvez également acheter des produits numériques (ebooks, templates) ou réserver des séances de mentorat.",
  },
  {
    q: "Quels sont les moyens de paiement acceptés ?",
    a: "Nous acceptons les cartes Visa/Mastercard, Orange Money, Wave, MTN Mobile Money, Moov, ainsi que le virement bancaire. Les paiements sont sécurisés par Moneroo et Stripe.",
  },
  {
    q: "Puis-je obtenir un remboursement ?",
    a: "Oui, vous disposez de 14 jours pour demander un remboursement après un achat, si vous n'avez pas consommé plus de 30 % du contenu. Contactez-nous via le formulaire de support.",
  },
  {
    q: "Comment devenir vendeur / instructeur ?",
    a: "Créez un compte en choisissant le rôle « Vendeur / Instructeur ». Vous pourrez alors publier vos formations, ebooks ou services directement depuis votre espace vendeur.",
  },
  {
    q: "Quelle est la commission de la plateforme ?",
    a: "Novakou prélève 5 % de commission sur chaque vente. Vous conservez 95 % de vos revenus nets, ce qui est l'un des meilleurs taux du marché.",
  },
  {
    q: "Comment devenir mentor ?",
    a: "Inscrivez-vous avec le rôle « Mentor », complétez votre profil (spécialité, tarif, disponibilité) et apparaissez dans l'annuaire des mentors. Les apprenants peuvent réserver des séances 1-to-1 avec vous.",
  },
  {
    q: "Comment fonctionne le programme d'affiliation ?",
    a: "Chaque utilisateur reçoit un lien d'affiliation unique. Partagez-le : vous gagnez une commission sur chaque vente effectuée grâce à votre lien. Les gains sont crédités automatiquement dans votre espace.",
  },
  {
    q: "Quand vais-je recevoir mes gains ?",
    a: "Les retraits sont disponibles 7 jours après chaque vente (période de sécurité anti-fraude). Vous pouvez retirer vers Orange Money, Wave, MTN MoMo, ou par virement bancaire.",
  },
];

export default function AidePage() {
  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      {/* Hero */}
      <section
        className="py-16 px-6"
        style={{ background: "linear-gradient(135deg, #003d1a 0%, #006e2f 50%, #22c55e 100%)" }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-5">
            <span className="material-symbols-outlined text-white text-[16px]">support_agent</span>
            <span className="text-white text-xs font-semibold">Centre d&apos;aide</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
            Comment pouvons-nous vous aider ?
          </h1>
          <p className="text-white/80 text-sm md:text-base">
            Retrouvez les réponses aux questions les plus fréquentes. Vous ne trouvez pas ?{" "}
            <Link href="/contact" className="text-white font-semibold underline">
              Contactez-nous
            </Link>
            .
          </p>
        </div>
      </section>

      {/* FAQs */}
      <section className="max-w-3xl mx-auto px-6 py-12">
        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <details
              key={i}
              className="group bg-white rounded-2xl border border-gray-100 overflow-hidden"
            >
              <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors">
                <span className="text-sm font-bold text-[#191c1e]">{f.q}</span>
                <span className="material-symbols-outlined text-[#006e2f] text-[20px] group-open:rotate-180 transition-transform">
                  expand_more
                </span>
              </summary>
              <div className="px-5 pb-5 text-sm text-[#5c647a] leading-relaxed">{f.a}</div>
            </details>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 bg-white rounded-2xl border border-gray-100 p-6 text-center">
          <span className="material-symbols-outlined text-[#006e2f] text-4xl">contact_support</span>
          <h3 className="text-lg font-extrabold text-[#191c1e] mt-2">Besoin d&apos;une aide personnalisée ?</h3>
          <p className="text-sm text-[#5c647a] mt-1.5 mb-4">
            Notre équipe répond sous 24h ouvrées.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
          >
            <span className="material-symbols-outlined text-[16px]">mail</span>
            Nous contacter
          </Link>
        </div>
      </section>
    </div>
  );
}
