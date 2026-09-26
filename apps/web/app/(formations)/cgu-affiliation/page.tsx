import Link from "next/link";
import { DocumentLegal } from "@/components/formations/public/article/DocumentLegal";

export const metadata = {
  title: "Conditions du Programme d'Affiliation",
};

export default function CGUAffiliationPage() {
  return (
    <DocumentLegal
      chemin="/cgu-affiliation"
      eyebrow="Document légal"
      titre="Conditions du Programme d'Affiliation"
      miseAJour="25 avril 2026"
      sections={[
        {
          titre: "Objet du programme",
          contenu: (
            <p>
              Le Programme d&apos;Affiliation Novakou (ci-apres &laquo; le Programme &raquo;) permet aux utilisateurs inscrits
              (ci-apres &laquo; les Affilies &raquo;) de promouvoir les produits disponibles sur la plateforme Novakou
              et de percevoir une commission sur chaque vente generee via leur lien de parrainage unique.
            </p>
          ),
        },
        {
          titre: "Eligibilite",
          contenu: (
            <>
              <p>
                Pour participer au Programme, l&apos;Affilie doit :
              </p>
              <ul>
                <li>Disposer d&apos;un compte Novakou actif et en regle</li>
                <li>Avoir accepte les presentes conditions</li>
                <li>Ne pas etre suspendu ou banni de la plateforme</li>
              </ul>
            </>
          ),
        },
        {
          titre: "Fonctionnement",
          contenu: (
            <p>
              L&apos;Affilie recoit un lien de parrainage unique pour chaque produit qu&apos;il souhaite promouvoir.
              Lorsqu&apos;un visiteur clique sur ce lien et effectue un achat dans un delai de 30 jours
              (duree du cookie d&apos;attribution), la vente est attribuee a l&apos;Affilie.
            </p>
          ),
        },
        {
          titre: "Commissions",
          contenu: (
            <p>
              Le taux de commission est fixe par le vendeur pour chaque produit. Le taux par defaut
              est de 30 % du prix de vente HT, sauf indication contraire du vendeur.
              Les commissions sont calculees apres deduction des frais de transaction et de la
              commission plateforme Novakou.
            </p>
          ),
        },
        {
          titre: "Paiement des commissions",
          contenu: (
            <p>
              Les commissions sont creditees sur le portefeuille Novakou de l&apos;Affilie apres une
              periode de validation de 14 jours suivant l&apos;achat (delai de remboursement).
              L&apos;Affilie peut demander un retrait vers son compte Mobile Money ou bancaire
              des que le solde minimum de retrait est atteint.
            </p>
          ),
        },
        {
          titre: "Obligations de l'Affilie",
          contenu: (
            <>
              <p>L&apos;Affilie s&apos;engage a :</p>
              <ul>
                <li>Promouvoir les produits de maniere honnete et transparente</li>
                <li>Ne pas utiliser de pratiques trompeuses, spam ou publicite mensongere</li>
                <li>Ne pas generer de faux clics ou de fausses ventes</li>
                <li>Ne pas usurper l&apos;identite d&apos;un vendeur ou de la plateforme</li>
                <li>Respecter les lois en vigueur dans son pays de residence</li>
              </ul>
            </>
          ),
        },
        {
          titre: "Pratiques interdites",
          contenu: (
            <p>
              Sont strictement interdits : l&apos;achat de trafic frauduleux, l&apos;utilisation de bots,
              le cookie stuffing, le detournement de marque (brand bidding sur le nom &laquo; Novakou &raquo;
              ou le nom d&apos;un vendeur), ainsi que toute pratique visant a manipuler le systeme d&apos;attribution.
              Toute infraction entrainera la suspension immediate du compte et l&apos;annulation des commissions en attente.
            </p>
          ),
        },
        {
          titre: "Suspension et resiliation",
          contenu: (
            <p>
              Novakou se reserve le droit de suspendre ou de resilier la participation d&apos;un Affilie
              au Programme a tout moment, notamment en cas de non-respect des presentes conditions.
              En cas de resiliation, les commissions validees restent dues. Les commissions en cours
              de validation seront examinees au cas par cas.
            </p>
          ),
        },
        {
          titre: "Modification des conditions",
          contenu: (
            <p>
              Novakou se reserve le droit de modifier les presentes conditions a tout moment.
              Les Affilies seront informes par email et par notification dans leur espace.
              La poursuite de l&apos;utilisation du Programme apres notification vaut acceptation
              des nouvelles conditions.
            </p>
          ),
        },
        {
          titre: "Responsabilite",
          contenu: (
            <p>
              Novakou ne garantit aucun revenu minimum. Les resultats dependent de l&apos;effort
              de promotion de l&apos;Affilie. Novakou ne saurait etre tenu responsable des
              decisions commerciales prises par l&apos;Affilie sur la base des outils fournis.
            </p>
          ),
        },
      ]}
      pied={
        <p>
          Pour toute question relative au Programme d&apos;Affiliation, contactez-nous via la page{" "}
          <Link href="/contact">Contact</Link>.
          Les presentes conditions sont complementaires aux{" "}
          <Link href="/cgu">Conditions Generales d&apos;Utilisation</Link>{" "}
          de la plateforme Novakou.
        </p>
      }
    />
  );
}
