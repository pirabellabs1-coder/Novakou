import Link from "next/link";

export const metadata = {
  title: "Conditions du Programme d'Affiliation — Novakou",
};

export default function CGUAffiliationPage() {
  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <section
        className="py-12 px-6"
        style={{ background: "linear-gradient(135deg, #003d1a 0%, #006e2f 50%, #22c55e 100%)" }}
      >
        <div className="max-w-3xl mx-auto">
          <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-2">Document legal</p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white">Conditions du Programme d&apos;Affiliation</h1>
          <p className="text-white/80 text-sm mt-2">Derniere mise a jour : 25 avril 2026</p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-6 text-sm text-[#191c1e] leading-relaxed">
          <div>
            <h2 className="text-lg font-bold mb-2">1. Objet du programme</h2>
            <p className="text-[#5c647a]">
              Le Programme d&apos;Affiliation Novakou (ci-apres &laquo; le Programme &raquo;) permet aux utilisateurs inscrits
              (ci-apres &laquo; les Affilies &raquo;) de promouvoir les produits disponibles sur la plateforme Novakou
              et de percevoir une commission sur chaque vente generee via leur lien de parrainage unique.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-2">2. Eligibilite</h2>
            <p className="text-[#5c647a]">
              Pour participer au Programme, l&apos;Affilie doit :
            </p>
            <ul className="list-disc pl-6 text-[#5c647a] space-y-1 mt-2">
              <li>Disposer d&apos;un compte Novakou actif et en regle</li>
              <li>Avoir accepte les presentes conditions</li>
              <li>Ne pas etre suspendu ou banni de la plateforme</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-2">3. Fonctionnement</h2>
            <p className="text-[#5c647a]">
              L&apos;Affilie recoit un lien de parrainage unique pour chaque produit qu&apos;il souhaite promouvoir.
              Lorsqu&apos;un visiteur clique sur ce lien et effectue un achat dans un delai de 30 jours
              (duree du cookie d&apos;attribution), la vente est attribuee a l&apos;Affilie.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-2">4. Commissions</h2>
            <p className="text-[#5c647a]">
              Le taux de commission est fixe par le vendeur pour chaque produit. Le taux par defaut
              est de 30 % du prix de vente HT, sauf indication contraire du vendeur.
              Les commissions sont calculees apres deduction des frais de transaction et de la
              commission plateforme Novakou.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-2">5. Paiement des commissions</h2>
            <p className="text-[#5c647a]">
              Les commissions sont creditees sur le portefeuille Novakou de l&apos;Affilie apres une
              periode de validation de 14 jours suivant l&apos;achat (delai de remboursement).
              L&apos;Affilie peut demander un retrait vers son compte Mobile Money ou bancaire
              des que le solde minimum de retrait est atteint.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-2">6. Obligations de l&apos;Affilie</h2>
            <p className="text-[#5c647a]">L&apos;Affilie s&apos;engage a :</p>
            <ul className="list-disc pl-6 text-[#5c647a] space-y-1 mt-2">
              <li>Promouvoir les produits de maniere honnete et transparente</li>
              <li>Ne pas utiliser de pratiques trompeuses, spam ou publicite mensongere</li>
              <li>Ne pas generer de faux clics ou de fausses ventes</li>
              <li>Ne pas usurper l&apos;identite d&apos;un vendeur ou de la plateforme</li>
              <li>Respecter les lois en vigueur dans son pays de residence</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-2">7. Pratiques interdites</h2>
            <p className="text-[#5c647a]">
              Sont strictement interdits : l&apos;achat de trafic frauduleux, l&apos;utilisation de bots,
              le cookie stuffing, le detournement de marque (brand bidding sur le nom &laquo; Novakou &raquo;
              ou le nom d&apos;un vendeur), ainsi que toute pratique visant a manipuler le systeme d&apos;attribution.
              Toute infraction entrainera la suspension immediate du compte et l&apos;annulation des commissions en attente.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-2">8. Suspension et resiliation</h2>
            <p className="text-[#5c647a]">
              Novakou se reserve le droit de suspendre ou de resilier la participation d&apos;un Affilie
              au Programme a tout moment, notamment en cas de non-respect des presentes conditions.
              En cas de resiliation, les commissions validees restent dues. Les commissions en cours
              de validation seront examinees au cas par cas.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-2">9. Modification des conditions</h2>
            <p className="text-[#5c647a]">
              Novakou se reserve le droit de modifier les presentes conditions a tout moment.
              Les Affilies seront informes par email et par notification dans leur espace.
              La poursuite de l&apos;utilisation du Programme apres notification vaut acceptation
              des nouvelles conditions.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-2">10. Responsabilite</h2>
            <p className="text-[#5c647a]">
              Novakou ne garantit aucun revenu minimum. Les resultats dependent de l&apos;effort
              de promotion de l&apos;Affilie. Novakou ne saurait etre tenu responsable des
              decisions commerciales prises par l&apos;Affilie sur la base des outils fournis.
            </p>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs text-[#5c647a]">
              Pour toute question relative au Programme d&apos;Affiliation, contactez-nous via la page{" "}
              <Link href="/contact" className="text-[#006e2f] font-semibold hover:underline">Contact</Link>.
              Les presentes conditions sont complementaires aux{" "}
              <Link href="/cgu" className="text-[#006e2f] font-semibold hover:underline">Conditions Generales d&apos;Utilisation</Link>{" "}
              de la plateforme Novakou.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
