import Link from "next/link";
import { DocumentLegal } from "@/components/formations/public/article/DocumentLegal";

export const metadata = {
  title: "Mentions légales",
  description:
    "Mentions légales de Novakou : identité et coordonnées de l'éditeur, directeur de la publication, hébergeur, propriété intellectuelle, responsabilité, protection des données et médiation de la consommation.",
  alternates: { canonical: "/mentions-legales" },
};

/* Mentions légales — obligatoires (LCEN art. 6). Les identifiants légaux
   marqués [à compléter] doivent être renseignés par l'éditeur (raison sociale,
   forme juridique, capital, SIREN/RCS, adresse du siège, TVA). */

export default function MentionsLegalesPage() {
  return (
    <DocumentLegal
      chemin="/mentions-legales"
      eyebrow="Document légal"
      titre="Mentions légales"
      miseAJour="12 juillet 2026"
      sections={[
        {
          titre: "Éditeur du site",
          contenu: (
            <>
              <p>
                Le site et l&apos;application <strong>Novakou</strong> (accessibles à l&apos;adresse novakou.com) sont édités par :
              </p>
              <ul className="nka-sans-puces">
                <li><strong>Raison sociale</strong> : Novakou — [forme juridique et raison sociale à compléter]</li>
                <li><strong>Capital social</strong> : [à compléter]</li>
                <li><strong>Siège social</strong> : [adresse complète à compléter]</li>
                <li><strong>Immatriculation</strong> : [SIREN / RCS ou registre équivalent à compléter]</li>
                <li><strong>N° de TVA intracommunautaire</strong> : [à compléter, le cas échéant]</li>
                <li><strong>E-mail</strong> : support@novakou.com</li>
              </ul>
              <p className="nka-petit">
                Novakou est un projet porté par Pirabel Labs. Les informations d&apos;immatriculation ci-dessus sont à
                renseigner par l&apos;éditeur selon sa structure juridique.
              </p>
            </>
          ),
        },
        {
          titre: "Directeur de la publication",
          contenu: (
            <>
              <p>
                Le directeur de la publication est <strong>Lissanon Gildas</strong>, en sa qualité de fondateur de Novakou.
                Contact : support@novakou.com.
              </p>
            </>
          ),
        },
        {
          titre: "Hébergement",
          contenu: (
            <>
              <p>Le site est hébergé et diffusé par les prestataires suivants :</p>
              <ul>
                <li>
                  <strong>Vercel Inc.</strong> — hébergement et diffusion de l&apos;application web.
                  340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis — <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">vercel.com</a>.
                </li>
                <li>
                  <strong>Supabase</strong> — hébergement de la base de données, de l&apos;authentification et du stockage
                  (région Union européenne, Francfort) — <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">supabase.com</a>.
                </li>
              </ul>
            </>
          ),
        },
        {
          titre: "Objet de la Plateforme",
          contenu: (
            <>
              <p>
                Novakou est une plateforme qui permet à des créateurs (vendeurs, mentors) de créer une boutique en ligne,
                de vendre des produits numériques et des formations, et d&apos;encaisser des paiements ; et à des acheteurs
                d&apos;acquérir ces contenus. Novakou agit en qualité d&apos;<strong>intermédiaire technique</strong> et
                d&apos;hébergeur des contenus publiés par les vendeurs. Les conditions d&apos;utilisation détaillées figurent
                dans les <Link href="/cgu">conditions générales d&apos;utilisation</Link>.
              </p>
            </>
          ),
        },
        {
          titre: "Propriété intellectuelle",
          contenu: (
            <>
              <p>
                La marque « Novakou », le logo, la charte graphique, l&apos;interface, les textes et l&apos;architecture technique
                du site sont la propriété exclusive de l&apos;éditeur et sont protégés par le droit de la propriété
                intellectuelle. Toute reproduction, représentation ou exploitation, totale ou partielle, sans autorisation
                écrite préalable est interdite.
              </p>
              <p>
                Les contenus mis en ligne par les vendeurs (formations, e-books, visuels, descriptions) demeurent la
                propriété de leurs auteurs. En les publiant, le vendeur garantit disposer des droits nécessaires et concède
                à Novakou une licence limitée d&apos;hébergement et de diffusion aux seules fins de fourniture du service.
              </p>
            </>
          ),
        },
        {
          titre: "Responsabilité",
          contenu: (
            <>
              <p>
                Novakou met tout en œuvre pour assurer l&apos;exactitude et la disponibilité du service, sans toutefois garantir
                l&apos;absence d&apos;interruption ou d&apos;erreur. En tant qu&apos;intermédiaire, Novakou n&apos;est pas l&apos;auteur des contenus
                publiés par les vendeurs et ne saurait être tenue responsable de leur qualité, de leur licéité ou de leur
                exactitude. Conformément à son statut d&apos;hébergeur, Novakou retire promptement tout contenu manifestement
                illicite qui lui est régulièrement signalé (voir les CGU).
              </p>
            </>
          ),
        },
        {
          titre: "Liens hypertextes",
          contenu: (
            <>
              <p>
                Le site peut contenir des liens vers des sites tiers. Novakou n&apos;exerce aucun contrôle sur ces sites et
                décline toute responsabilité quant à leur contenu ou à leur politique de confidentialité.
              </p>
            </>
          ),
        },
        {
          titre: "Protection des données personnelles",
          contenu: (
            <>
              <p>
                Le traitement de vos données personnelles est décrit en détail dans notre
                {" "}<Link href="/confidentialite">politique de confidentialité</Link>.
                L&apos;usage des cookies est décrit dans notre <Link href="/cookies">politique cookies</Link>.
                Pour toute demande relative à vos données, écrivez à privacy@novakou.com.
              </p>
            </>
          ),
        },
        {
          titre: "Médiation et règlement des litiges",
          contenu: (
            <>
              <p>
                Conformément à la réglementation applicable, tout consommateur peut recourir gratuitement à un médiateur de
                la consommation en vue de la résolution amiable d&apos;un litige, après avoir adressé une réclamation écrite à
                support@novakou.com. La plateforme européenne de Règlement en Ligne des Litiges est également accessible à
                l&apos;adresse <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">ec.europa.eu/consumers/odr</a>.
              </p>
            </>
          ),
        },
        {
          titre: "Droit applicable",
          contenu: (
            <>
              <p>
                Les présentes mentions légales sont régies par le droit applicable au siège de l&apos;éditeur. Tout litige relatif
                à leur interprétation ou à leur exécution relève de la compétence des juridictions compétentes, sous réserve
                des dispositions protectrices d&apos;ordre public applicables aux consommateurs.
              </p>
            </>
          ),
        },
      ]}
      pied={
        <>
          Voir aussi : <Link href="/cgu">CGU</Link>,
          {" "}<Link href="/confidentialite">confidentialité</Link>,
          {" "}<Link href="/cookies">cookies</Link>.
        </>
      }
    />
  );
}
