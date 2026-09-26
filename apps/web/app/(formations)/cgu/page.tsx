import Link from "next/link";
import { DocumentLegal } from "@/components/formations/public/article/DocumentLegal";
import { loadRefundConfig } from "@/lib/formations/refund-policy";

export const metadata = {
  title: "Conditions Générales d'Utilisation et de Vente",
  description:
    "Conditions générales de Novakou : inscription et comptes, rôle d'intermédiaire, obligations des vendeurs et acheteurs, commission, paiements et escrow, droit de rétractation et remboursements, propriété intellectuelle, contenus interdits, modération, affiliation, suspension et litiges.",
  alternates: { canonical: "/cgu" },
};

export default async function CGUPage() {
  const refund = await loadRefundConfig().catch(() => ({
    windowDays: 7,
    maxConsumedPct: 30,
    maxRefundsPerBuyer30d: 1,
    mentorCancelHours: 24,
    autoApprove: false,
  }));

  return (
    <DocumentLegal
      chemin="/cgu"
      eyebrow="Document légal"
      titre="Conditions Générales d'Utilisation et de Vente"
      miseAJour="12 juillet 2026"
      intro={
        <p>
          Les présentes conditions (« CGU ») régissent l&apos;accès et l&apos;utilisation de la plateforme Novakou
          (« la Plateforme »), éditée par l&apos;éditeur identifié dans les
          {" "}<Link href="/mentions-legales">mentions légales</Link>.
          En créant un compte ou en utilisant la Plateforme, vous acceptez sans réserve les présentes CGU.
        </p>
      }
      sections={[
        {
          titre: "Définitions",
          contenu: (
            <>
              <ul>
                <li><strong>Plateforme</strong> : le site et l&apos;application Novakou et l&apos;ensemble des services associés.</li>
                <li><strong>Utilisateur</strong> : toute personne inscrite, quel que soit son rôle.</li>
                <li><strong>Acheteur</strong> : utilisateur qui acquiert un produit, une formation ou une séance.</li>
                <li><strong>Vendeur</strong> (créateur) : utilisateur qui publie et vend des contenus via sa boutique.</li>
                <li><strong>Mentor</strong> : utilisateur qui propose des séances d&apos;accompagnement.</li>
                <li><strong>Affilié</strong> : utilisateur qui promeut la Plateforme ou des produits contre commission.</li>
                <li><strong>Contenu</strong> : formations, produits numériques, descriptions, visuels, avis, messages.</li>
              </ul>
            </>
          ),
        },
        {
          titre: "Inscription et compte",
          contenu: (
            <>
              <p>
                L&apos;inscription est ouverte à toute personne physique d&apos;au moins 15 ans (avec l&apos;accord du représentant
                légal pour les mineurs) ou à toute personne morale dûment représentée. Vous vous engagez à fournir des
                informations exactes et à jour, et à préserver la confidentialité de vos identifiants. Vous êtes responsable
                de toute activité effectuée depuis votre compte.
              </p>
              <p>
                Les vendeurs et mentors doivent compléter une procédure de <strong>vérification d&apos;identité (KYC)</strong>
                pour publier des contenus payants et retirer des fonds, afin de respecter nos obligations de lutte contre la
                fraude et le blanchiment.
              </p>
            </>
          ),
        },
        {
          titre: "Services proposés",
          contenu: (
            <>
              <p>La Plateforme permet notamment : (i) d&apos;acheter des formations, produits numériques (e-books, templates…) et séances de mentorat ; (ii) de créer une boutique et de vendre ses propres contenus ; (iii) de proposer du mentorat ; (iv) de générer des liens de paiement ; (v) de participer au programme d&apos;affiliation.</p>
            </>
          ),
        },
        {
          titre: "Rôle de Novakou (intermédiaire)",
          contenu: (
            <>
              <p>
                Novakou agit en qualité d&apos;<strong>intermédiaire technique et d&apos;hébergeur</strong>. Le contrat de vente
                se forme directement entre l&apos;acheteur et le vendeur. Novakou n&apos;est ni l&apos;auteur ni le propriétaire des
                contenus vendus et n&apos;est pas partie au contrat de vente, sous réserve des services de paiement et
                d&apos;encaissement qu&apos;elle fournit.
              </p>
            </>
          ),
        },
        {
          titre: "Obligations des vendeurs",
          contenu: (
            <>
              <ul>
                <li>Détenir l&apos;ensemble des droits (propriété intellectuelle, licences) sur les contenus publiés.</li>
                <li>Décrire ses produits de manière exacte, loyale et non trompeuse.</li>
                <li>Livrer le contenu ou la prestation conformément à l&apos;offre.</li>
                <li>Respecter la législation applicable, y compris ses obligations fiscales et sociales sur ses revenus.</li>
                <li>Respecter la réglementation sur les données personnelles à l&apos;égard de ses propres clients.</li>
                <li>Ne pas publier de contenu interdit (voir article 11).</li>
              </ul>
            </>
          ),
        },
        {
          titre: "Obligations des acheteurs",
          contenu: (
            <>
              <p>
                L&apos;acheteur s&apos;engage à utiliser les contenus achetés dans le cadre d&apos;un usage personnel et licite, à ne
                pas les revendre, redistribuer ou reproduire sans autorisation, et à régler le prix affiché au moment de la
                commande.
              </p>
            </>
          ),
        },
        {
          titre: "Prix, commission et taxes",
          contenu: (
            <>
              <p>
                Les prix sont indiqués en FCFA (ou dans la devise sélectionnée) et fixés librement par le vendeur. Novakou
                prélève une <strong>commission de 10 %</strong> sur chaque vente réalisée ; le vendeur conserve <strong>90 %</strong> du
                montant. Cette commission couvre notamment les frais de paiement, l&apos;hébergement et l&apos;assistance. Chaque
                utilisateur est responsable de ses propres obligations fiscales.
              </p>
            </>
          ),
        },
        {
          titre: "Paiements, séquestre (escrow) et retraits",
          contenu: (
            <>
              <p>
                Les paiements sont traités par nos prestataires de paiement agréés. À la
                commande, les fonds sont sécurisés puis crédités sur le solde du vendeur une fois la vente confirmée. Un
                délai de sécurité s&apos;applique avant retrait. Les retraits sont disponibles vers Mobile Money (Orange, Wave,
                MTN, Moov) ou virement, sous réserve de la validation KYC.
              </p>
            </>
          ),
        },
        {
          titre: "Droit de rétractation et remboursements",
          contenu: (
            <>
              <p>
                Pour les consommateurs, un droit de rétractation de 14 jours s&apos;applique en principe aux prestations de
                services. Toutefois, conformément à l&apos;article L221-28 13° du Code de la consommation, ce droit ne
                s&apos;applique pas aux <strong>contenus numériques fournis sur support immatériel</strong> dont l&apos;exécution a
                commencé avec l&apos;accord préalable exprès du consommateur et renoncement exprès à son droit de rétractation :
                le téléchargement ou l&apos;accès au contenu vaut ainsi renonciation.
              </p>
              <p>
                Au-delà, Novakou applique une politique de remboursement volontaire : les formations sont remboursables
                pendant <strong>{refund.windowDays} jour{refund.windowDays > 1 ? "s" : ""}</strong> tant que le contenu n&apos;a
                pas été consommé à plus de <strong>{refund.maxConsumedPct} %</strong>, dans la limite de{" "}
                {refund.maxRefundsPerBuyer30d} remboursement{refund.maxRefundsPerBuyer30d > 1 ? "s" : ""} par acheteur tous
                les 30 jours. Les séances de mentorat sont remboursables si annulées plus de{" "}
                {refund.mentorCancelHours} h avant la séance. Les litiges sont arbitrés par Novakou sur la base des éléments
                fournis par les deux parties.
              </p>
            </>
          ),
        },
        {
          titre: "Propriété intellectuelle",
          contenu: (
            <>
              <p>
                La marque, le logo, l&apos;interface et l&apos;architecture de la Plateforme sont la propriété de l&apos;éditeur. Les
                vendeurs conservent la propriété de leurs contenus et concèdent à Novakou une licence non exclusive, limitée
                à l&apos;hébergement, à la diffusion et à la promotion de leur boutique aux fins de fourniture du service. Toute
                reproduction non autorisée d&apos;un contenu acquis sur la Plateforme est interdite.
              </p>
            </>
          ),
        },
        {
          titre: "Contenus interdits et modération",
          contenu: (
            <>
              <p>Sont notamment interdits les contenus : illégaux, contrefaisants, diffamatoires, haineux, violents, pornographiques, trompeurs, portant atteinte aux droits de tiers, ou relevant d&apos;activités réglementées sans autorisation. Sont également interdits l&apos;usurpation d&apos;identité et le contournement des mécanismes de paiement.</p>
              <p>
                Conformément à son statut d&apos;hébergeur (LCEN), Novakou retire promptement tout contenu manifestement
                illicite régulièrement signalé à <strong>support@novakou.com</strong>, et peut suspendre les comptes concernés.
              </p>
            </>
          ),
        },
        {
          titre: "Programme d'affiliation",
          contenu: (
            <>
              <p>
                Les affiliés perçoivent une commission sur les ventes qu&apos;ils génèrent via leur lien de parrainage, selon
                les taux affichés dans leur espace. Les commissions frauduleuses (auto-parrainage, trafic artificiel,
                pratiques trompeuses) sont annulées et peuvent entraîner l&apos;exclusion du programme.
              </p>
            </>
          ),
        },
        {
          titre: "Suspension et résiliation",
          contenu: (
            <>
              <p>
                Vous pouvez fermer votre compte à tout moment depuis vos paramètres. Novakou peut suspendre ou résilier un
                compte en cas de manquement aux présentes CGU, de fraude ou de risque pour la Plateforme ou ses utilisateurs,
                après information sauf urgence ou obligation légale. Les sommes dues restent exigibles et les obligations
                légales de conservation subsistent.
              </p>
            </>
          ),
        },
        {
          titre: "Garanties et responsabilité",
          contenu: (
            <>
              <p>
                La Plateforme est fournie « en l&apos;état ». Novakou ne garantit pas l&apos;absence d&apos;interruption ni la qualité
                pédagogique des contenus, qui relève des vendeurs. La responsabilité de Novakou ne saurait être engagée pour
                les dommages indirects ; elle est en tout état de cause limitée, dans la mesure permise par la loi, aux
                montants effectivement perçus par Novakou au titre de la transaction concernée. Les présentes clauses ne
                limitent pas les droits impératifs des consommateurs.
              </p>
            </>
          ),
        },
        {
          titre: "Force majeure",
          contenu: (
            <>
              <p>
                La responsabilité de Novakou ne saurait être engagée en cas d&apos;inexécution due à un événement de force
                majeure au sens de la loi et de la jurisprudence applicables (notamment défaillance des réseaux, des
                prestataires de paiement ou d&apos;hébergement).
              </p>
            </>
          ),
        },
        {
          titre: "Données personnelles",
          contenu: (
            <>
              <p>
                Le traitement de vos données est décrit dans notre
                {" "}<Link href="/confidentialite">politique de confidentialité</Link>, et
                l&apos;usage des cookies dans notre <Link href="/cookies">politique cookies</Link>.
              </p>
            </>
          ),
        },
        {
          titre: "Modification des CGU",
          contenu: (
            <>
              <p>
                Novakou peut modifier les présentes CGU. Toute modification substantielle est notifiée par e-mail ou via la
                Plateforme avec un préavis raisonnable. La poursuite de l&apos;utilisation vaut acceptation des CGU modifiées.
              </p>
            </>
          ),
        },
        {
          titre: "Droit applicable, médiation et juridiction",
          contenu: (
            <>
              <p>
                Les présentes CGU sont régies par le droit applicable au siège de l&apos;éditeur. En cas de litige, une solution
                amiable sera recherchée en priorité ; le consommateur peut recourir gratuitement à un médiateur de la
                consommation et à la plateforme européenne de
                {" "}<a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">Règlement en Ligne des Litiges</a>.
                À défaut, les juridictions compétentes seront saisies, sous réserve des règles protectrices d&apos;ordre public.
              </p>
            </>
          ),
        },
        {
          titre: "Contact",
          contenu: (
            <>
              <p>Pour toute question : <strong>support@novakou.com</strong>.</p>
            </>
          ),
        },
      ]}
      pied={
        <>
          Voir aussi : <Link href="/mentions-legales">mentions légales</Link>,
          {" "}<Link href="/confidentialite">confidentialité</Link>,
          {" "}<Link href="/cookies">cookies</Link>.
        </>
      }
    />
  );
}
