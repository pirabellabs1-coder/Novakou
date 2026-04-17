export const metadata = {
  title: "Politique de confidentialité — Novakou",
};

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <section
        className="py-12 px-6"
        style={{ background: "linear-gradient(135deg, #003d1a 0%, #006e2f 50%, #22c55e 100%)" }}
      >
        <div className="max-w-3xl mx-auto">
          <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-2">Document légal</p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white">Politique de confidentialité</h1>
          <p className="text-white/80 text-sm mt-2">Dernière mise à jour : 15 avril 2026</p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-6 text-sm text-[#191c1e] leading-relaxed">
          <div>
            <h2 className="text-lg font-bold mb-2">1. Responsable du traitement</h2>
            <p className="text-[#5c647a]">
              Novakou est responsable du traitement de vos données personnelles collectées via la Plateforme. Pour toute question, contactez-nous à <strong>privacy@freelancehigh.com</strong>.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-2">2. Données collectées</h2>
            <p className="text-[#5c647a] mb-2">Nous collectons :</p>
            <ul className="list-disc pl-6 text-[#5c647a] space-y-1">
              <li>Informations d&apos;inscription : nom, email, rôle (apprenant / vendeur / mentor)</li>
              <li>Informations de paiement : gérées et stockées par Moneroo et Stripe</li>
              <li>Informations KYC pour les vendeurs et mentors : pièce d&apos;identité, coordonnées bancaires</li>
              <li>Données de navigation : cookies essentiels, analytiques anonymisées (PostHog)</li>
              <li>Contenu publié : formations, produits, avis, messages</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-2">3. Finalités du traitement</h2>
            <p className="text-[#5c647a] mb-2">Vos données sont utilisées pour :</p>
            <ul className="list-disc pl-6 text-[#5c647a] space-y-1">
              <li>Fournir les services de la Plateforme (achats, ventes, mentorat, messagerie)</li>
              <li>Traiter les paiements et les retraits</li>
              <li>Vous envoyer des emails transactionnels (confirmations, notifications)</li>
              <li>Améliorer la Plateforme via des analyses anonymisées</li>
              <li>Respecter nos obligations légales et comptables</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-2">4. Partage des données</h2>
            <p className="text-[#5c647a]">
              Vos données ne sont jamais vendues à des tiers. Elles sont partagées uniquement avec nos sous-traitants techniques (Supabase, Moneroo, Stripe, Resend, Cloudinary) pour la fourniture des services, sous contrats de confidentialité stricts.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-2">5. Durée de conservation</h2>
            <p className="text-[#5c647a]">
              Les données de compte sont conservées tant que votre compte est actif. Après suppression du compte, les données sont anonymisées dans un délai de 30 jours, sauf obligation légale de conservation (factures : 10 ans).
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-2">6. Vos droits (RGPD)</h2>
            <p className="text-[#5c647a] mb-2">Vous disposez des droits suivants :</p>
            <ul className="list-disc pl-6 text-[#5c647a] space-y-1">
              <li>Droit d&apos;accès à vos données</li>
              <li>Droit de rectification</li>
              <li>Droit à l&apos;effacement (« droit à l&apos;oubli »)</li>
              <li>Droit à la portabilité</li>
              <li>Droit d&apos;opposition au traitement</li>
              <li>Droit de limitation du traitement</li>
            </ul>
            <p className="text-[#5c647a] mt-2">
              Pour exercer ces droits, contactez-nous à <strong>privacy@freelancehigh.com</strong>. Nous répondons sous 30 jours maximum.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-2">7. Cookies</h2>
            <p className="text-[#5c647a]">
              Nous utilisons des cookies essentiels au fonctionnement de la Plateforme (session, panier, préférences). Aucun cookie publicitaire tiers n&apos;est déposé sans votre consentement explicite.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-2">8. Sécurité</h2>
            <p className="text-[#5c647a]">
              Vos données sont chiffrées en transit (TLS 1.3) et au repos. Nos bases de données Supabase bénéficient du Row Level Security (RLS). Les mots de passe sont hashés avec bcrypt (coût 12).
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-2">9. Réclamation</h2>
            <p className="text-[#5c647a]">
              Vous pouvez adresser une réclamation à l&apos;autorité de contrôle compétente en matière de protection des données si vous estimez que vos droits ne sont pas respectés.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-2">10. Modifications</h2>
            <p className="text-[#5c647a]">
              Cette politique peut être mise à jour. Les modifications majeures seront notifiées par email au moins 30 jours avant leur entrée en vigueur.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
