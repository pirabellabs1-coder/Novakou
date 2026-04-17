export const metadata = {
  title: "Conditions Générales d'Utilisation — Novakou",
};

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <section
        className="py-12 px-6"
        style={{ background: "linear-gradient(135deg, #003d1a 0%, #006e2f 50%, #22c55e 100%)" }}
      >
        <div className="max-w-3xl mx-auto">
          <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-2">Document légal</p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white">Conditions Générales d&apos;Utilisation</h1>
          <p className="text-white/80 text-sm mt-2">Dernière mise à jour : 15 avril 2026</p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-6 text-sm text-[#191c1e] leading-relaxed">
          <div>
            <h2 className="text-lg font-bold mb-2">1. Objet</h2>
            <p className="text-[#5c647a]">
              Les présentes Conditions Générales d&apos;Utilisation (ci-après « CGU ») régissent l&apos;accès et l&apos;utilisation de la plateforme Novakou (ci-après « la Plateforme »), éditée et exploitée par la société Novakou. En utilisant la Plateforme, vous acceptez sans réserve l&apos;intégralité des présentes CGU.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-2">2. Inscription</h2>
            <p className="text-[#5c647a]">
              L&apos;inscription est ouverte à toute personne physique majeure ou à toute personne morale dûment représentée. Vous vous engagez à fournir des informations exactes et à jour, et à conserver la confidentialité de vos identifiants.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-2">3. Services proposés</h2>
            <p className="text-[#5c647a]">
              La Plateforme permet aux utilisateurs : (i) d&apos;acheter des formations en ligne, des produits numériques (ebooks, templates) et des séances de mentorat ; (ii) de vendre leurs propres formations et produits numériques en tant qu&apos;instructeur ; (iii) de proposer des séances de mentorat en tant que mentor ; (iv) de participer au programme d&apos;affiliation.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-2">4. Commission de la Plateforme</h2>
            <p className="text-[#5c647a]">
              Novakou prélève une commission de <strong>5 %</strong> sur chaque vente réalisée. Le vendeur conserve <strong>95 %</strong> des revenus nets. Cette commission couvre les frais de paiement, l&apos;hébergement et l&apos;assistance.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-2">5. Paiements et retraits</h2>
            <p className="text-[#5c647a]">
              Les paiements sont sécurisés par nos partenaires Moneroo et Stripe. Les retraits vers Orange Money, Wave, MTN Mobile Money ou virement bancaire sont disponibles après une période de sécurité de 7 jours suivant la vente.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-2">6. Remboursements</h2>
            <p className="text-[#5c647a]">
              Une politique de remboursement de 14 jours s&apos;applique aux formations et produits numériques, à condition que le contenu n&apos;ait pas été consommé à plus de 30 %. Les séances de mentorat sont remboursables si annulées plus de 24h avant la séance.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-2">7. Propriété intellectuelle</h2>
            <p className="text-[#5c647a]">
              Les vendeurs conservent la propriété intellectuelle de leurs contenus. En publiant sur la Plateforme, ils accordent à Novakou une licence non exclusive de diffusion. Toute reproduction non autorisée de contenu vendu sur la Plateforme est strictement interdite.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-2">8. Comportement des utilisateurs</h2>
            <p className="text-[#5c647a]">
              Il est interdit : de publier du contenu illégal, diffamatoire, haineux ou pornographique ; d&apos;usurper l&apos;identité d&apos;une autre personne ; de tenter de contourner les mécanismes de paiement. Tout manquement peut entraîner la suspension ou la suppression du compte.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-2">9. Responsabilité</h2>
            <p className="text-[#5c647a]">
              Novakou agit en qualité d&apos;intermédiaire technique entre acheteurs et vendeurs. Nous ne garantissons pas la qualité pédagogique des contenus, qui relève de la responsabilité des vendeurs. Nous nous efforçons néanmoins de modérer activement les contenus signalés.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-2">10. Loi applicable et juridiction</h2>
            <p className="text-[#5c647a]">
              Les présentes CGU sont régies par le droit en vigueur dans le pays de l&apos;éditeur. Tout litige sera soumis aux tribunaux compétents de ce ressort, sauf dispositions contraires applicables aux consommateurs.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-2">11. Modification des CGU</h2>
            <p className="text-[#5c647a]">
              Novakou se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute modification substantielle par email ou via une notification in-app. La poursuite de l&apos;utilisation de la Plateforme vaut acceptation des CGU modifiées.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-2">12. Contact</h2>
            <p className="text-[#5c647a]">
              Pour toute question relative aux présentes CGU, contactez-nous à <strong>support@novakou.com</strong>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
