import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal");
  return {
    title: t("cgu_meta_title"),
    description: t("cgu_meta_description"),
  };
}

export default async function CguPage() {
  const t = await getTranslations("legal");
  return (
    <div className="min-h-screen bg-background-dark">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-black text-white mb-4">{t("cgu_title")}</h1>
        <p className="text-sm text-slate-500 mb-2">{t("last_updated", { date: "1er mars 2026" })}</p>
        {t("french_only_notice") && (
          <p className="text-sm text-amber-400/80 mb-2 italic">{t("french_only_notice")}</p>
        )}
        <p className="text-sm text-slate-500 mb-12">
          Les présentes Conditions Générales d&apos;Utilisation (ci-après &quot;CGU&quot;) régissent l&apos;accès et l&apos;utilisation de la plateforme FreelanceHigh. En accédant à la plateforme ou en créant un compte, vous acceptez l&apos;intégralité des présentes CGU.
        </p>

        <div className="space-y-8">

          {/* Article 1 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">Article 1 — Objet et définitions</h2>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">1.1 Objet</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Les présentes Conditions Générales d&apos;Utilisation ont pour objet de définir les modalités et conditions dans lesquelles la société FreelanceHigh (ci-après &quot;la Plateforme&quot;, &quot;nous&quot;, &quot;notre&quot;) met à disposition des utilisateurs sa marketplace de services numériques en ligne, accessible à l&apos;adresse https://www.freelancehigh.com et via toutes les applications mobiles associées.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              FreelanceHigh est une plateforme d&apos;intermédiation qui met en relation des prestataires de services numériques (freelances et agences) avec des donneurs d&apos;ordres (clients), dans un cadre sécurisé et professionnel. La Plateforme n&apos;est pas partie aux contrats conclus entre les Utilisateurs.
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">1.2 Définitions</h3>
            <div className="text-sm text-slate-400 leading-relaxed space-y-3">
              <p><strong className="text-slate-300">Plateforme :</strong> désigne le site web FreelanceHigh accessible à l&apos;adresse https://www.freelancehigh.com, ainsi que l&apos;ensemble de ses fonctionnalités, applications et services associés.</p>
              <p><strong className="text-slate-300">Utilisateur :</strong> désigne toute personne physique ou morale inscrite sur la Plateforme, quel que soit son rôle (Freelance, Client ou Agence).</p>
              <p><strong className="text-slate-300">Freelance :</strong> désigne un Utilisateur inscrit en tant que prestataire de services indépendant, proposant ses compétences et services via la Plateforme.</p>
              <p><strong className="text-slate-300">Client :</strong> désigne un Utilisateur inscrit en tant que donneur d&apos;ordres, recherchant et commandant des services sur la Plateforme.</p>
              <p><strong className="text-slate-300">Agence :</strong> désigne un Utilisateur inscrit en tant que structure collective de prestataires, regroupant plusieurs freelances sous une marque commune et proposant des services collectifs.</p>
              <p><strong className="text-slate-300">Service :</strong> désigne une offre de prestation publiée par un Freelance ou une Agence sur la Plateforme, comprenant une description, des forfaits tarifaires et des conditions de livraison.</p>
              <p><strong className="text-slate-300">Commande :</strong> désigne l&apos;acte par lequel un Client sélectionne un forfait d&apos;un Service et procède au paiement, créant ainsi un engagement contractuel entre le Client et le Prestataire.</p>
              <p><strong className="text-slate-300">Escrow (Séquestre) :</strong> désigne le mécanisme de blocage des fonds du Client par la Plateforme jusqu&apos;à la validation de la livraison, garantissant la sécurité des transactions.</p>
              <p><strong className="text-slate-300">Portefeuille :</strong> désigne le compte virtuel de chaque Utilisateur sur la Plateforme, permettant de recevoir des fonds, effectuer des retraits et consulter l&apos;historique des transactions.</p>
              <p><strong className="text-slate-300">KYC (Know Your Customer) :</strong> désigne la procédure de vérification d&apos;identité mise en place par la Plateforme, comportant 4 niveaux progressifs de vérification.</p>
              <p><strong className="text-slate-300">Commission :</strong> désigne le pourcentage prélevé par la Plateforme sur chaque transaction réussie, dont le taux varie selon le plan d&apos;abonnement de l&apos;Utilisateur.</p>
            </div>
          </section>

          {/* Article 2 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">Article 2 — Inscription et création de compte</h2>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">2.1 Conditions d&apos;inscription</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              L&apos;inscription sur la Plateforme est ouverte à toute personne physique âgée d&apos;au moins 18 ans et ayant la capacité juridique de contracter, ainsi qu&apos;à toute personne morale valablement constituée. L&apos;inscription est gratuite, quel que soit le rôle choisi.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Pour créer un compte, l&apos;Utilisateur doit fournir une adresse email valide et un mot de passe sécurisé, ou utiliser l&apos;une des méthodes de connexion sociale proposées (Google, Facebook, LinkedIn, Apple). L&apos;Utilisateur s&apos;engage à fournir des informations exactes, complètes et à jour.
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">2.2 Choix du rôle</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Lors de l&apos;inscription, l&apos;Utilisateur choisit l&apos;un des trois rôles disponibles :
            </p>
            <ul className="text-sm text-slate-400 leading-relaxed list-disc list-inside space-y-2 mb-4 ml-4">
              <li><strong className="text-slate-300">Freelance :</strong> pour proposer des services numériques en tant que prestataire indépendant.</li>
              <li><strong className="text-slate-300">Client :</strong> pour rechercher, commander et acheter des services numériques.</li>
              <li><strong className="text-slate-300">Agence :</strong> pour créer une structure collective de prestataires avec un formulaire d&apos;inscription dédié (nom de l&apos;agence, secteur d&apos;activité, taille de l&apos;équipe, numéro SIRET optionnel).</li>
            </ul>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Le rôle choisi détermine les fonctionnalités et les espaces accessibles sur la Plateforme. Un Utilisateur ne peut détenir qu&apos;un seul compte actif. La création de comptes multiples est strictement interdite et peut entraîner la suspension de l&apos;ensemble des comptes.
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">2.3 Vérification de l&apos;email</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Après inscription, un code OTP (One-Time Password) est envoyé à l&apos;adresse email fournie. La vérification de l&apos;email est obligatoire avant toute utilisation de la Plateforme. Sans cette vérification, l&apos;accès aux fonctionnalités est restreint.
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">2.4 Onboarding</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Après la vérification de l&apos;email, un processus d&apos;onboarding guidé en plusieurs étapes est proposé selon le rôle de l&apos;Utilisateur. Ce processus permet de compléter le profil, configurer les préférences et commencer à utiliser la Plateforme dans les meilleures conditions.
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">2.5 Sécurité du compte</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              L&apos;Utilisateur est seul responsable de la confidentialité de ses identifiants de connexion. Il s&apos;engage à ne pas divulguer son mot de passe et à notifier immédiatement la Plateforme en cas d&apos;utilisation non autorisée de son compte. La Plateforme propose l&apos;activation de la double authentification (2FA) via Google Authenticator ou SMS pour renforcer la sécurité du compte.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">
              L&apos;Utilisateur peut consulter la liste de ses sessions actives et révoquer celles qu&apos;il ne reconnaît pas depuis les paramètres de sécurité de son compte.
            </p>
          </section>

          {/* Article 3 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">Article 3 — Vérification d&apos;identité (KYC)</h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              La Plateforme applique une procédure de vérification d&apos;identité progressive, conformément aux réglementations en matière de lutte contre le blanchiment d&apos;argent et le financement du terrorisme. Cette procédure comporte quatre niveaux :
            </p>

            <div className="space-y-4 mb-4">
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-slate-300 font-semibold mb-1">Niveau 1 — Email vérifié</p>
                <p className="text-sm text-slate-400">L&apos;Utilisateur a confirmé son adresse email via le code OTP. Ce niveau donne accès aux fonctionnalités de base de la Plateforme : navigation, consultation des services, création de profil.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-slate-300 font-semibold mb-1">Niveau 2 — Téléphone vérifié</p>
                <p className="text-sm text-slate-400">L&apos;Utilisateur a vérifié son numéro de téléphone par SMS. Ce niveau débloque l&apos;envoi d&apos;offres, la possibilité de commander des services et la communication avec les autres Utilisateurs.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-slate-300 font-semibold mb-1">Niveau 3 — Pièce d&apos;identité vérifiée</p>
                <p className="text-sm text-slate-400">L&apos;Utilisateur a soumis un document d&apos;identité valide (carte nationale d&apos;identité, passeport ou permis de conduire) qui a été approuvé par l&apos;équipe de vérification. Ce niveau est requis pour : publier des services, retirer des fonds du portefeuille, accéder à l&apos;intégralité des fonctionnalités financières.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-slate-300 font-semibold mb-1">Niveau 4 — Vérification professionnelle</p>
                <p className="text-sm text-slate-400">L&apos;Utilisateur a fourni des justificatifs professionnels complémentaires (attestation d&apos;immatriculation, diplômes, certificats). Ce niveau donne droit au badge &quot;Elite&quot;, à des limites de retrait relevées et à une visibilité accrue dans les résultats de recherche.</p>
              </div>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              La Plateforme se réserve le droit de demander des documents complémentaires à tout moment et de suspendre un compte en cas de doute sur l&apos;authenticité des documents fournis. Les documents KYC sont stockés de manière sécurisée et chiffrée, dans des serveurs situés en Europe, conformément au RGPD.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">
              Les décisions de l&apos;équipe de vérification sont communiquées à l&apos;Utilisateur par email avec un motif détaillé en cas de refus. L&apos;Utilisateur peut soumettre de nouveaux documents en cas de refus.
            </p>
          </section>

          {/* Article 4 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">Article 4 — Publication et gestion des services</h2>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">4.1 Conditions de publication</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Les Freelances et les Agences ayant atteint le niveau KYC 3 peuvent publier des services sur la Plateforme. Chaque service doit comprendre obligatoirement : un titre clair et descriptif, une catégorie et sous-catégorie, une description détaillée du service proposé, au moins un forfait tarifaire (Basique, Standard ou Premium) avec prix, délai de livraison et nombre de révisions incluses, et au minimum une image de présentation.
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">4.2 Modération des services</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Tout service publié est soumis à un processus de modération par l&apos;équipe FreelanceHigh avant d&apos;être visible sur la marketplace. La modération vérifie la conformité du service avec les présentes CGU, la qualité de la description et des visuels, l&apos;absence de contenu interdit, et la cohérence des tarifs proposés.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              La Plateforme peut approuver le service, demander des modifications, ou refuser la publication avec un motif détaillé. Ce processus de modération vise à maintenir la qualité globale de la marketplace et à protéger les Clients.
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">4.3 Forfaits et tarification</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Chaque service peut proposer jusqu&apos;à trois forfaits : Basique, Standard et Premium. Chaque forfait comprend un prix fixe (en euros), un délai de livraison estimé, un nombre de révisions incluses et une liste des éléments livrables. Les prix affichés s&apos;entendent en euros (EUR) et sont convertis automatiquement dans la devise choisie par le Client selon les taux de change en vigueur.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Le Prestataire peut également proposer des options payantes additionnelles (extras) permettant au Client de personnaliser sa commande (livraison express, révisions supplémentaires, fichier source, etc.).
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">4.4 Limites selon le plan d&apos;abonnement</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Le nombre de services actifs simultanément dépend du plan d&apos;abonnement de l&apos;Utilisateur : 3 services pour le plan Gratuit, 15 pour le plan Pro, et illimité pour les plans Business et Agence. Les services peuvent être mis en pause, modifiés ou supprimés à tout moment par le Prestataire.
            </p>
          </section>

          {/* Article 5 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">Article 5 — Commandes et exécution des prestations</h2>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">5.1 Passation de commande</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Le Client passe commande en sélectionnant un forfait dans un service publié, en ajoutant éventuellement des options supplémentaires (extras), et en procédant au paiement. La commande est confirmée dès réception du paiement par la Plateforme. Un email de confirmation est envoyé aux deux parties (Client et Prestataire).
            </p>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              La passation de commande crée un engagement contractuel entre le Client et le Prestataire. La Plateforme intervient uniquement en tant qu&apos;intermédiaire technique et financier.
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">5.2 Déroulement de la commande</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Après confirmation de la commande, les parties peuvent communiquer via la messagerie intégrée à la commande. Le Prestataire s&apos;engage à livrer le service dans le délai indiqué dans le forfait choisi. La commande suit un cycle de vie précis :
            </p>
            <ul className="text-sm text-slate-400 leading-relaxed list-disc list-inside space-y-2 mb-4 ml-4">
              <li><strong className="text-slate-300">En attente :</strong> le paiement est en cours de traitement.</li>
              <li><strong className="text-slate-300">En cours :</strong> le paiement est confirmé, le Prestataire travaille sur la commande.</li>
              <li><strong className="text-slate-300">Livrée :</strong> le Prestataire a soumis les livrables et marqué la commande comme terminée.</li>
              <li><strong className="text-slate-300">En révision :</strong> le Client a demandé des modifications dans la limite des révisions incluses.</li>
              <li><strong className="text-slate-300">Validée :</strong> le Client a accepté la livraison, les fonds sont libérés.</li>
              <li><strong className="text-slate-300">En litige :</strong> une des parties a ouvert un litige, les fonds sont gelés.</li>
              <li><strong className="text-slate-300">Annulée :</strong> la commande a été annulée selon les conditions prévues.</li>
            </ul>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">5.3 Livraison</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Le Prestataire livre les fichiers et travaux réalisés via l&apos;espace dédié à la commande. Après soumission de la livraison, le Client dispose d&apos;un délai de 3 jours ouvrés pour valider la livraison, demander une révision (dans la limite du nombre inclus dans le forfait), ou ouvrir un litige. Passé ce délai de 3 jours sans action du Client, la livraison est automatiquement validée et les fonds sont libérés au profit du Prestataire.
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">5.4 Révisions</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Chaque forfait inclut un nombre défini de révisions. Le Client peut demander des modifications en fournissant des instructions claires et précises. Les révisions portent uniquement sur le périmètre initial de la commande et ne constituent pas une extension du service commandé. Des révisions supplémentaires au-delà de celles incluses peuvent être proposées par le Prestataire en tant qu&apos;option payante.
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">5.5 Extension de délai</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Le Prestataire peut demander une extension de délai en cas de circonstances justifiées. La demande d&apos;extension doit être formulée avant l&apos;expiration du délai initial et acceptée par le Client. En l&apos;absence d&apos;accord du Client, le délai initial reste applicable.
            </p>
          </section>

          {/* Article 6 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">Article 6 — Offres et projets clients</h2>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">6.1 Publication d&apos;offres par les Clients</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Les Clients ayant atteint le niveau KYC 2 peuvent publier des offres de projets sur la Plateforme. Chaque offre comprend un titre, une description détaillée du besoin, un budget estimé (fixe ou horaire), un délai souhaité, les compétences requises et le type de contrat (ponctuel, long terme ou récurrent).
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">6.2 Candidatures des Freelances</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Les Freelances peuvent postuler aux offres publiées en soumettant une lettre de motivation, un prix proposé et un délai estimé. Le nombre de candidatures mensuelles est limité selon le plan d&apos;abonnement : 5 pour le plan Gratuit, 20 pour le plan Pro, et illimité pour les plans Business et Agence.
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">6.3 Offres personnalisées</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Les Freelances et Agences peuvent envoyer des offres personnalisées (devis sur mesure) directement à un Client spécifique, en dehors du cadre d&apos;une offre publiée. Ces offres comprennent un montant, un délai, un nombre de révisions et une description détaillée, avec une durée de validité définie.
            </p>
          </section>

          {/* Article 7 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">Article 7 — Paiements, commissions et portefeuille</h2>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">7.1 Méthodes de paiement acceptées</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              La Plateforme accepte les méthodes de paiement suivantes : cartes bancaires (Visa, Mastercard) via Stripe, paiements Mobile Money via CinetPay (Orange Money, Wave, MTN Mobile Money) pour l&apos;Afrique francophone, virements SEPA, PayPal, Apple Pay, Google Pay, et à terme les paiements en cryptomonnaies stablecoins (USDC/USDT).
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">7.2 Devise et conversion</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              La devise de référence de la Plateforme est l&apos;euro (EUR). Les prix peuvent être affichés dans les devises suivantes : EUR, FCFA (franc CFA), USD, GBP et MAD. Les taux de conversion sont mis à jour régulièrement. La conversion est indicative pour l&apos;affichage ; le montant facturé est toujours basé sur le prix en euros défini par le Prestataire.
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">7.3 Système d&apos;escrow (séquestre)</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Tous les paiements transitent par le système d&apos;escrow de la Plateforme. Lorsqu&apos;un Client passe commande, les fonds sont immédiatement bloqués et sécurisés par la Plateforme. Ils ne sont libérés au profit du Prestataire qu&apos;après validation de la livraison par le Client. Ce mécanisme garantit la sécurité financière des deux parties.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Pour les paiements internationaux (carte bancaire, SEPA), le séquestre est géré via Stripe Connect. Pour les paiements Mobile Money (CinetPay), le séquestre est géré en interne via la base de données de la Plateforme, CinetPay ne proposant pas de mécanisme de blocage natif.
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">7.4 Commissions</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              La Plateforme prélève une commission sur chaque transaction réussie. Le taux de commission varie selon le plan d&apos;abonnement du Prestataire :
            </p>
            <div className="bg-white/5 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p className="text-slate-400">Plan Gratuit :</p><p className="text-slate-300 font-semibold">20%</p>
                <p className="text-slate-400">Plan Pro (15 EUR/mois) :</p><p className="text-slate-300 font-semibold">15%</p>
                <p className="text-slate-400">Plan Business (45 EUR/mois) :</p><p className="text-slate-300 font-semibold">10%</p>
                <p className="text-slate-400">Plan Agence (99 EUR/mois) :</p><p className="text-slate-300 font-semibold">8%</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              La commission est prélevée automatiquement lors de la libération des fonds. Le montant net (après commission) est crédité sur le portefeuille du Prestataire.
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">7.5 Portefeuille et retraits</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Chaque Utilisateur dispose d&apos;un portefeuille virtuel sur la Plateforme. Les fonds disponibles peuvent être retirés selon les méthodes suivantes : virement SEPA, PayPal, Wise, Mobile Money (Orange Money, Wave, MTN Mobile Money). Le retrait des fonds nécessite un niveau KYC 3 minimum.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Les délais de traitement des retraits varient selon la méthode choisie : 1 à 3 jours ouvrés pour les virements SEPA, 1 à 2 jours pour PayPal et Wise, et instantané à 24 heures pour les retraits Mobile Money. La Plateforme ne prélève aucun frais supplémentaire sur les retraits ; les éventuels frais bancaires ou de transfert sont à la charge du Prestataire.
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">7.6 Facturation</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              La Plateforme génère automatiquement des factures au format PDF pour chaque transaction effectuée. Ces factures sont accessibles depuis l&apos;espace Finances de chaque Utilisateur et peuvent être téléchargées à tout moment. Les factures d&apos;abonnement sont émises mensuellement ou annuellement selon le cycle de facturation choisi.
            </p>
          </section>

          {/* Article 8 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">Article 8 — Plans d&apos;abonnement</h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              La Plateforme propose quatre plans d&apos;abonnement avec des niveaux de fonctionnalités et de commissions différents :
            </p>

            <div className="space-y-4 mb-4">
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-slate-300 font-semibold mb-2">Plan Gratuit — 0 EUR/mois</p>
                <p className="text-sm text-slate-400">Commission de 20%. Limité à 3 services actifs et 5 candidatures par mois. Pas de boost publicitaire ni de certification IA. Adapté aux débutants souhaitant découvrir la plateforme.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-slate-300 font-semibold mb-2">Plan Pro — 15 EUR/mois (ou 144 EUR/an soit -20%)</p>
                <p className="text-sm text-slate-400">Commission de 15%. Jusqu&apos;à 15 services actifs et 20 candidatures par mois. 1 boost publicitaire par mois inclus. Accès aux certifications IA. Recommandé pour les freelances actifs.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-slate-300 font-semibold mb-2">Plan Business — 45 EUR/mois (ou 432 EUR/an soit -20%)</p>
                <p className="text-sm text-slate-400">Commission de 10%. Services et candidatures illimités. 5 boosts publicitaires par mois. Certifications IA et accès aux clés API et webhooks. Idéal pour les freelances établis.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-slate-300 font-semibold mb-2">Plan Agence — 99 EUR/mois (ou 950 EUR/an soit -20%)</p>
                <p className="text-sm text-slate-400">Commission de 8%. Toutes les fonctionnalités Business + gestion d&apos;équipe jusqu&apos;à 20 membres, 10 boosts par mois, 50 Go de stockage ressources, CRM clients intégré. Conçu pour les agences.</p>
              </div>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              L&apos;Utilisateur peut changer de plan à tout moment. La mise à niveau est effective immédiatement avec facturation au prorata. La rétrogradation prend effet à la fin de la période de facturation en cours. L&apos;annulation de l&apos;abonnement est possible à tout moment depuis les paramètres du compte, sans frais de résiliation.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">
              En cas de non-paiement de l&apos;abonnement, le compte est automatiquement rétrogradé au plan Gratuit après une période de grâce de 7 jours. Les services publiés au-delà de la limite du plan Gratuit sont automatiquement mis en pause.
            </p>
          </section>

          {/* Article 9 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">Article 9 — Litiges et résolution des conflits</h2>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">9.1 Ouverture d&apos;un litige</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              En cas de désaccord entre un Client et un Prestataire concernant une commande, l&apos;une des parties peut ouvrir un litige via l&apos;interface dédiée de la commande. L&apos;ouverture d&apos;un litige entraîne le gel immédiat des fonds en escrow jusqu&apos;à résolution du conflit.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Un litige peut être ouvert dans les cas suivants : non-livraison dans les délais convenus, livraison non conforme au service commandé, qualité insuffisante des livrables, problème de communication ou d&apos;accessibilité du Prestataire, tout différend lié à l&apos;exécution de la commande.
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">9.2 Processus de médiation</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Après ouverture du litige, les parties disposent d&apos;un délai de 48 heures pour soumettre leurs arguments, preuves et justificatifs (captures d&apos;écran, fichiers, correspondances). L&apos;équipe de médiation FreelanceHigh examine l&apos;ensemble des éléments fournis et rend un verdict dans un délai de 5 jours ouvrés maximum.
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">9.3 Verdicts possibles</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              L&apos;équipe de médiation peut rendre l&apos;un des verdicts suivants :
            </p>
            <ul className="text-sm text-slate-400 leading-relaxed list-disc list-inside space-y-2 mb-4 ml-4">
              <li><strong className="text-slate-300">En faveur du Client :</strong> remboursement intégral des fonds au Client.</li>
              <li><strong className="text-slate-300">En faveur du Prestataire :</strong> libération des fonds au Prestataire.</li>
              <li><strong className="text-slate-300">Remboursement partiel :</strong> une partie des fonds est reversée au Client, le reste au Prestataire, selon l&apos;évaluation du travail effectué.</li>
              <li><strong className="text-slate-300">Annulation mutuelle :</strong> les deux parties conviennent d&apos;annuler la commande, remboursement intégral au Client.</li>
            </ul>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">9.4 Caractère définitif</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Les décisions de l&apos;équipe de médiation sont définitives et s&apos;imposent aux deux parties. Les litiges répétés ou abusifs peuvent entraîner des sanctions sur le compte de l&apos;Utilisateur fautif, incluant la suspension temporaire ou permanente.
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">9.5 Impact sur la réputation</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Les litiges résolus sont pris en compte dans le calcul du taux de complétion et de la note de confiance de chaque Utilisateur. Un taux de litiges élevé peut entraîner une baisse de visibilité dans les résultats de recherche et la perte de certains badges.
            </p>
          </section>

          {/* Article 10 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">Article 10 — Évaluations et avis</h2>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">10.1 Système d&apos;évaluation</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Après chaque commande validée, le Client et le Prestataire peuvent s&apos;évaluer mutuellement. Le Client évalue le Prestataire sur trois critères : qualité du travail, communication et respect des délais. Le Prestataire peut évaluer le Client sur la clarté des instructions et la qualité de la collaboration.
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">10.2 Règles des avis</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Les avis doivent être honnêtes, respectueux et porter sur l&apos;expérience réelle de la transaction. Sont interdits : les avis injurieux ou diffamatoires, les avis rédigés en échange d&apos;une contrepartie, les avis ne concernant pas la transaction en question, les avis de complaisance entre comptes liés.
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">10.3 Droit de réponse et modification</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Le Prestataire peut répondre publiquement à chaque avis reçu. Le Client peut modifier son avis dans les 7 jours suivant sa publication. Tout Utilisateur peut signaler un avis qu&apos;il considère comme abusif. L&apos;équipe de modération examine les signalements et peut supprimer un avis s&apos;il enfreint les règles de la Plateforme.
            </p>
          </section>

          {/* Article 11 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">Article 11 — Propriété intellectuelle</h2>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">11.1 Droits sur les livrables</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Sauf accord contraire explicite entre les parties, la propriété intellectuelle des livrables réalisés dans le cadre d&apos;une commande est transférée au Client après paiement intégral et validation de la livraison. Ce transfert comprend les droits d&apos;utilisation, de reproduction, de modification et de distribution des livrables, pour tous supports et tous territoires, sans limitation de durée.
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">11.2 Droit de portfolio</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Le Prestataire conserve le droit d&apos;utiliser les livrables dans son portfolio professionnel, sauf si le Client a explicitement demandé la confidentialité lors de la commande ou via un accord de non-divulgation (NDA). Ce droit de portfolio est limité à une présentation à des fins de démonstration commerciale et ne constitue pas une licence d&apos;exploitation commerciale.
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">11.3 Droits sur la Plateforme</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              L&apos;ensemble des éléments de la Plateforme (code source, design, logos, textes, base de données, fonctionnalités) sont la propriété exclusive de FreelanceHigh et sont protégés par le droit d&apos;auteur et le droit des marques. Toute reproduction, représentation ou utilisation non autorisée de ces éléments est interdite et peut faire l&apos;objet de poursuites judiciaires.
            </p>
          </section>

          {/* Article 12 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">Article 12 — Responsabilité de la Plateforme</h2>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">12.1 Rôle d&apos;intermédiaire</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              FreelanceHigh agit exclusivement en tant qu&apos;intermédiaire technique entre les Clients et les Prestataires. La Plateforme n&apos;est en aucun cas partie aux contrats conclus entre les Utilisateurs et ne peut être tenue responsable de la qualité, de la conformité ou de l&apos;exécution des services commandés.
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">12.2 Garanties limitées</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              La Plateforme s&apos;engage à mettre en oeuvre les moyens nécessaires pour assurer le bon fonctionnement technique de ses services, la sécurité des transactions financières via le système d&apos;escrow, la protection des données personnelles conformément au RGPD, et un processus de médiation équitable en cas de litige.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Toutefois, la Plateforme ne garantit pas la disponibilité ininterrompue de ses services, la compatibilité avec tous les systèmes informatiques, ni l&apos;exactitude des informations fournies par les Utilisateurs.
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">12.3 Force majeure</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              La Plateforme ne saurait être tenue responsable de l&apos;inexécution de ses obligations en cas de force majeure, incluant notamment : catastrophes naturelles, pannes techniques majeures de ses prestataires d&apos;hébergement, attaques informatiques, décisions gouvernementales ou réglementaires empêchant le fonctionnement du service.
            </p>
          </section>

          {/* Article 13 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">Article 13 — Contenus et activités interdits</h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Les Utilisateurs s&apos;engagent à ne pas publier, proposer ou promouvoir sur la Plateforme les contenus et activités suivants :
            </p>
            <ul className="text-sm text-slate-400 leading-relaxed list-disc list-inside space-y-2 mb-4 ml-4">
              <li>Services ou contenus illégaux au regard de la loi française et des conventions internationales</li>
              <li>Contenus à caractère pornographique, violent ou discriminatoire</li>
              <li>Incitation à la haine, au racisme, à l&apos;antisémitisme ou à la xénophobie</li>
              <li>Services de piratage informatique, cracking, création de malware ou d&apos;outils d&apos;intrusion</li>
              <li>Vente, achat ou échange de données personnelles volées ou obtenues illicitement</li>
              <li>Services de création de faux documents d&apos;identité, diplômes ou certificats</li>
              <li>Promotion de substances illicites ou de produits contrefaits</li>
              <li>Services d&apos;astroturfing (faux avis, faux followers, manipulation d&apos;avis en ligne)</li>
              <li>Contenu portant atteinte aux droits de propriété intellectuelle de tiers</li>
              <li>Services de spam, phishing ou toute forme de fraude en ligne</li>
              <li>Contenu mettant en danger la sécurité ou la vie privée d&apos;autrui</li>
              <li>Tout service visant à contourner les règles, lois ou réglementations en vigueur</li>
              <li>Services d&apos;écriture de travaux académiques (mémoires, thèses) présentés comme étant le travail de l&apos;acheteur</li>
              <li>Contenu généré intégralement par intelligence artificielle sans divulgation au Client</li>
            </ul>
            <p className="text-sm text-slate-400 leading-relaxed">
              La Plateforme se réserve le droit de supprimer tout contenu enfreignant ces règles sans préavis et de suspendre ou bannir l&apos;Utilisateur responsable. La tentative de contournement de ces règles est également sanctionnable.
            </p>
          </section>

          {/* Article 14 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">Article 14 — Espace Agence — dispositions spécifiques</h2>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">14.1 Création et gestion d&apos;une agence</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              L&apos;inscription en tant qu&apos;Agence donne accès à un espace de gestion collective comprenant : un profil public d&apos;agence, la gestion d&apos;une équipe de freelances, un CRM clients intégré, la publication de services sous la marque de l&apos;agence, et des outils de gestion de projets collaboratifs.
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">14.2 Membres de l&apos;équipe</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              L&apos;administrateur de l&apos;Agence peut inviter des freelances inscrits sur la Plateforme à rejoindre son équipe. Les membres invités conservent leur profil individuel et peuvent également proposer des services en leur nom propre. Les rôles disponibles au sein de l&apos;agence sont : Admin agence, Manager, Freelance membre et Commercial.
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">14.3 Finances de l&apos;agence</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Les revenus générés par les services de l&apos;agence sont versés sur le portefeuille de l&apos;agence. L&apos;administrateur peut paramétrer une commission interne sur les gains de chaque membre. Les retraits sont effectués depuis le portefeuille de l&apos;agence selon les mêmes conditions que les comptes individuels.
            </p>
          </section>

          {/* Article 15 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">Article 15 — Suspension, restriction et suppression de compte</h2>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">15.1 Suspension par la Plateforme</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              FreelanceHigh se réserve le droit de suspendre temporairement ou définitivement tout compte d&apos;Utilisateur en cas de : violation des présentes CGU, fourniture d&apos;informations fausses ou frauduleuses, comportement abusif répété envers d&apos;autres Utilisateurs, tentative de fraude financière, taux de litiges anormalement élevé, activité suspecte détectée sur le compte, non-respect des lois et réglementations en vigueur.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              En cas de suspension, l&apos;Utilisateur est informé par email avec un motif détaillé. Les fonds en cours de traitement sont traités conformément à leur statut d&apos;escrow au moment de la suspension. L&apos;Utilisateur peut contester la suspension en contactant l&apos;équipe support.
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">15.2 Suppression volontaire</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              L&apos;Utilisateur peut supprimer son compte à tout moment depuis les paramètres de son espace personnel. La suppression est définitive et irréversible. Avant de procéder à la suppression, l&apos;Utilisateur doit s&apos;assurer que toutes ses commandes en cours sont finalisées et que tous les fonds disponibles dans son portefeuille ont été retirés.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">
              Après suppression, les données personnelles sont conservées pendant une durée de 3 ans conformément aux obligations légales, puis supprimées définitivement. Les avis publiés par l&apos;Utilisateur restent visibles mais sont anonymisés. Les documents KYC sont conservés pendant 5 ans conformément aux réglementations anti-blanchiment.
            </p>
          </section>

          {/* Article 16 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">Article 16 — Données personnelles et confidentialité</h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              La collecte et le traitement des données personnelles des Utilisateurs sont régis par notre <Link href="/confidentialite" className="text-primary hover:underline">Politique de Confidentialité</Link>, qui constitue une partie intégrante des présentes CGU. En s&apos;inscrivant sur la Plateforme, l&apos;Utilisateur reconnaît avoir pris connaissance de cette Politique de Confidentialité et l&apos;accepte dans son intégralité.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">
              Pour toute question relative à la protection de vos données personnelles, vous pouvez contacter notre Délégué à la Protection des Données à l&apos;adresse privacy@freelancehigh.com.
            </p>
          </section>

          {/* Article 17 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">Article 17 — Politique d&apos;annulation et de remboursement</h2>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">17.1 Annulation avant le début du travail</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Si le Prestataire n&apos;a pas encore commencé à travailler sur la commande, le Client peut demander une annulation avec remboursement intégral. Le Prestataire peut également annuler la commande s&apos;il estime ne pas pouvoir la réaliser, avec remboursement intégral au Client.
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">17.2 Annulation en cours d&apos;exécution</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Si le travail a commencé, l&apos;annulation doit faire l&apos;objet d&apos;un accord entre les parties. En cas de désaccord, un litige peut être ouvert conformément à l&apos;Article 9. Le remboursement éventuel est déterminé en tenant compte de l&apos;avancement du travail réalisé.
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">17.3 Impact des annulations</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Les annulations répétées ont un impact sur le taux de complétion du Prestataire et peuvent entraîner : une baisse de visibilité dans les résultats de recherche, la perte de badges de performance, et en cas d&apos;annulations abusives répétées, la suspension du compte.
            </p>
          </section>

          {/* Article 18 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">Article 18 — Badges et système de réputation</h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              La Plateforme attribue des badges aux Prestataires en fonction de leurs performances et de leur niveau de vérification :
            </p>
            <ul className="text-sm text-slate-400 leading-relaxed list-disc list-inside space-y-2 mb-4 ml-4">
              <li><strong className="text-slate-300">Vérifié :</strong> attribué dès le niveau KYC 3 (pièce d&apos;identité vérifiée).</li>
              <li><strong className="text-slate-300">Rising Talent :</strong> attribué aux nouveaux Prestataires affichant des performances prometteuses dès leurs premières commandes.</li>
              <li><strong className="text-slate-300">Top Rated :</strong> attribué aux Prestataires ayant un taux de satisfaction supérieur à 95%, un taux de complétion supérieur à 90% et au moins 50 commandes validées.</li>
              <li><strong className="text-slate-300">Pro :</strong> attribué aux Prestataires abonnés au plan Pro ou supérieur avec un profil complet et des performances élevées.</li>
              <li><strong className="text-slate-300">Elite :</strong> attribué aux Prestataires ayant atteint le niveau KYC 4 (vérification professionnelle) avec des performances exceptionnelles.</li>
              <li><strong className="text-slate-300">Agence Vérifiée :</strong> attribué aux Agences ayant complété la vérification KYC de l&apos;agence.</li>
            </ul>
            <p className="text-sm text-slate-400 leading-relaxed">
              Les badges sont réévalués régulièrement et peuvent être retirés si les critères ne sont plus remplis. La manipulation artificielle des critères d&apos;attribution des badges (faux avis, commandes fictives) est strictement interdite et entraîne la suspension du compte.
            </p>
          </section>

          {/* Article 19 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">Article 19 — Communication entre Utilisateurs</h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Toute communication entre Utilisateurs relative à une commande ou un projet doit transiter par la messagerie intégrée de la Plateforme. Cette règle permet d&apos;assurer la traçabilité des échanges en cas de litige et de protéger les deux parties.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Il est interdit de partager des coordonnées personnelles (email, téléphone, réseaux sociaux) dans le but de contourner la Plateforme et d&apos;effectuer des transactions en dehors du système d&apos;escrow. La tentative de contournement peut entraîner la suspension du compte.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">
              La messagerie intégrée propose des fonctionnalités de chat en temps réel, d&apos;envoi de pièces jointes (images, fichiers, PDF), d&apos;indicateurs de frappe et de lecture, et de traduction automatique entre le français et l&apos;anglais.
            </p>
          </section>

          {/* Article 20 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">Article 20 — Programme d&apos;affiliation</h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              La Plateforme propose un programme d&apos;affiliation permettant aux Utilisateurs de recommander FreelanceHigh et de percevoir des commissions sur les inscriptions et transactions générées par leurs filleuls. Chaque Utilisateur dispose d&apos;un lien de parrainage unique accessible depuis son espace personnel.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">
              Les conditions et taux de commission du programme d&apos;affiliation sont détaillés dans la page dédiée <Link href="/affiliation" className="text-primary hover:underline">Programme d&apos;affiliation</Link>. La Plateforme se réserve le droit de modifier les conditions du programme d&apos;affiliation à tout moment, avec notification préalable aux participants.
            </p>
          </section>

          {/* Article 21 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">Article 21 — Modifications des CGU</h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              FreelanceHigh se réserve le droit de modifier les présentes CGU à tout moment. Les modifications substantielles sont notifiées aux Utilisateurs par email et par notification in-app au moins 30 jours avant leur entrée en vigueur. La poursuite de l&apos;utilisation de la Plateforme après l&apos;entrée en vigueur des modifications vaut acceptation des nouvelles CGU.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">
              En cas de désaccord avec les modifications, l&apos;Utilisateur peut supprimer son compte conformément à l&apos;Article 15.2. Les anciennes versions des CGU sont archivées et consultables sur demande.
            </p>
          </section>

          {/* Article 22 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">Article 22 — Droit applicable et juridiction compétente</h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Les présentes CGU sont régies par le droit français. En cas de différend relatif à l&apos;interprétation ou l&apos;exécution des présentes CGU, les parties s&apos;efforceront de trouver une solution amiable dans un délai de 30 jours. À défaut d&apos;accord amiable, tout litige sera soumis à la compétence exclusive des tribunaux de Paris, France.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Conformément aux articles L.616-1 et R.616-1 du Code de la consommation, la Plateforme propose un mécanisme de médiation de la consommation. Le consommateur peut soumettre le différend au médiateur compétent par voie électronique.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">
              Si l&apos;une des clauses des présentes CGU est déclarée nulle ou inapplicable par un tribunal compétent, les autres clauses restent en vigueur et conservent leur plein effet.
            </p>
          </section>

          {/* Article 23 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">Article 23 — Contact</h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Pour toute question relative aux présentes CGU ou à l&apos;utilisation de la Plateforme, vous pouvez nous contacter :
            </p>
            <div className="bg-white/5 rounded-lg p-4 text-sm text-slate-400 space-y-2">
              <p><strong className="text-slate-300">Par email :</strong> contact@freelancehigh.com</p>
              <p><strong className="text-slate-300">Par email (données personnelles) :</strong> privacy@freelancehigh.com</p>
              <p><strong className="text-slate-300">Via le centre d&apos;aide :</strong> <Link href="/aide" className="text-primary hover:underline">https://www.freelancehigh.com/aide</Link></p>
              <p><strong className="text-slate-300">Fondateur :</strong> Lissanon Gildas</p>
              <p><strong className="text-slate-300">Site web :</strong> https://www.freelancehigh.com</p>
            </div>
          </section>

          {/* Article 24 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">Article 24 — Formations et Produits Numériques</h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Le présent article régit les conditions spécifiques applicables à la section Formations de la Plateforme FreelanceHigh, incluant les formations en ligne, les cohortes, les certificats de complétion et les produits numériques commercialisés par les Instructeurs.
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">24.1 Définitions spécifiques aux formations</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Les termes suivants, lorsqu&apos;utilisés dans le présent article, ont la signification qui leur est attribuée ci-après :
            </p>
            <ul className="text-sm text-slate-400 leading-relaxed list-disc list-inside space-y-2 mb-4 ml-4">
              <li><strong className="text-slate-300">Formation :</strong> un cours en ligne composé de modules, leçons, vidéos, ressources téléchargeables et éventuellement de quiz ou d&apos;exercices, publié par un Instructeur sur la Plateforme.</li>
              <li><strong className="text-slate-300">Instructeur :</strong> un Utilisateur dont la candidature a été approuvée par FreelanceHigh et qui dispose des droits de publication de formations et de produits numériques sur la Plateforme.</li>
              <li><strong className="text-slate-300">Apprenant :</strong> un Utilisateur inscrit à une ou plusieurs formations sur la Plateforme, qu&apos;elles soient gratuites ou payantes.</li>
              <li><strong className="text-slate-300">Certificat de complétion :</strong> un document numérique généré automatiquement par la Plateforme attestant qu&apos;un Apprenant a complété l&apos;intégralité d&apos;une formation (100 % de progression) et, le cas échéant, obtenu le score minimum requis aux quiz.</li>
              <li><strong className="text-slate-300">Cohorte :</strong> une session de formation avec dates de début et de fin définies, un nombre de places limité, et un accompagnement structuré par l&apos;Instructeur.</li>
              <li><strong className="text-slate-300">Produit numérique :</strong> un fichier ou ensemble de fichiers numériques (e-book, template, code source, ressource graphique, audio, vidéo ou licence logicielle) commercialisé par un Instructeur via la Plateforme.</li>
            </ul>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">24.2 Publication de formations</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              La publication de formations sur la Plateforme est soumise aux conditions suivantes :
            </p>
            <ul className="text-sm text-slate-400 leading-relaxed list-disc list-inside space-y-2 mb-4 ml-4">
              <li>L&apos;Instructeur doit avoir soumis une candidature approuvée par l&apos;équipe FreelanceHigh.</li>
              <li>Chaque formation doit contenir au minimum un titre, une description, un programme structuré et du contenu pédagogique (vidéo, texte ou ressources).</li>
              <li>Toute formation publiée est soumise à un processus de modération avant d&apos;être visible publiquement. FreelanceHigh se réserve le droit de refuser, demander des modifications ou retirer une formation qui ne respecte pas les critères de qualité ou les présentes CGU.</li>
              <li>L&apos;Instructeur est seul responsable de l&apos;exactitude, de la qualité et de la mise à jour du contenu de ses formations.</li>
              <li>L&apos;Instructeur garantit qu&apos;il dispose de tous les droits de propriété intellectuelle nécessaires sur le contenu publié et qu&apos;il ne porte atteinte à aucun droit de tiers.</li>
            </ul>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">24.3 Accord Instructeur — Partage des revenus</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              En publiant des formations ou des produits numériques sur la Plateforme, l&apos;Instructeur accepte les conditions financières suivantes :
            </p>
            <ul className="text-sm text-slate-400 leading-relaxed list-disc list-inside space-y-2 mb-4 ml-4">
              <li><strong className="text-slate-300">Partage des revenus :</strong> l&apos;Instructeur perçoit 70 % du prix de vente net (hors taxes et frais de transaction) de chaque inscription payante à ses formations et de chaque vente de produit numérique. FreelanceHigh retient 30 % au titre de ses frais de plateforme, d&apos;hébergement, de paiement et de marketing.</li>
              <li><strong className="text-slate-300">Paiements :</strong> les revenus sont calculés mensuellement et virés sur le portefeuille de l&apos;Instructeur dans un délai de 30 jours après la fin du mois civil. L&apos;Instructeur peut ensuite retirer ses fonds selon les méthodes de retrait disponibles (virement SEPA, Mobile Money, PayPal, Wise).</li>
              <li><strong className="text-slate-300">Licence non-exclusive :</strong> l&apos;Instructeur accorde à FreelanceHigh une licence non-exclusive, mondiale et révocable d&apos;héberger, afficher, promouvoir et distribuer ses formations et produits numériques sur la Plateforme et ses canaux de communication.</li>
              <li><strong className="text-slate-300">Droit de retrait :</strong> l&apos;Instructeur peut retirer ses formations de la vente à tout moment. Les apprenants déjà inscrits conservent leur accès conformément à l&apos;article 24.4. Les revenus acquis restent dus à l&apos;Instructeur.</li>
            </ul>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">24.4 Inscription et accès aux formations</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              L&apos;inscription à une formation (gratuite ou payante) confère à l&apos;Apprenant les droits suivants :
            </p>
            <ul className="text-sm text-slate-400 leading-relaxed list-disc list-inside space-y-2 mb-4 ml-4">
              <li><strong className="text-slate-300">Durée d&apos;accès :</strong> l&apos;accès à une formation achetée est illimité dans le temps, tant que la Plateforme est en service et que la formation n&apos;a pas été retirée par son auteur. En cas de retrait par l&apos;Instructeur, l&apos;Apprenant conserve l&apos;accès au contenu déjà acquis pendant une période minimale de 12 mois.</li>
              <li><strong className="text-slate-300">Usage personnel :</strong> l&apos;accès est strictement personnel et non transférable. Le partage de compte, la revente, la copie ou la redistribution du contenu d&apos;une formation est strictement interdit et constitue une violation des présentes CGU pouvant entraîner la suspension du compte.</li>
              <li><strong className="text-slate-300">Révocation :</strong> FreelanceHigh se réserve le droit de révoquer l&apos;accès d&apos;un Apprenant en cas de violation des CGU, de fraude ou d&apos;abus. En cas de révocation abusive, l&apos;Apprenant peut contester la décision via le support.</li>
            </ul>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">24.5 Cohortes</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Certaines formations proposent un système de cohortes avec les spécificités suivantes :
            </p>
            <ul className="text-sm text-slate-400 leading-relaxed list-disc list-inside space-y-2 mb-4 ml-4">
              <li><strong className="text-slate-300">Inscription limitée :</strong> les cohortes disposent d&apos;un nombre de places défini par l&apos;Instructeur. L&apos;inscription est ouverte jusqu&apos;à la date limite ou jusqu&apos;au remplissage complet, selon le premier événement survenu.</li>
              <li><strong className="text-slate-300">Dates de session :</strong> chaque cohorte a une date de début et une date de fin. Le contenu et l&apos;accompagnement sont dispensés selon un calendrier défini par l&apos;Instructeur.</li>
              <li><strong className="text-slate-300">Conditions d&apos;annulation :</strong> une inscription à une cohorte peut être annulée avec remboursement intégral jusqu&apos;à 7 jours avant la date de début. Après le début de la cohorte, aucun remboursement n&apos;est possible sauf en cas de force majeure ou de manquement avéré de l&apos;Instructeur.</li>
              <li><strong className="text-slate-300">Engagement de l&apos;Instructeur :</strong> l&apos;Instructeur s&apos;engage à fournir l&apos;accompagnement décrit dans la fiche de la cohorte. En cas de non-respect, les apprenants peuvent solliciter un remboursement auprès du support FreelanceHigh.</li>
            </ul>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">24.6 Certificats de complétion</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Les certificats délivrés par la Plateforme sont soumis aux conditions suivantes :
            </p>
            <ul className="text-sm text-slate-400 leading-relaxed list-disc list-inside space-y-2 mb-4 ml-4">
              <li><strong className="text-slate-300">Conditions d&apos;obtention :</strong> un certificat est généré automatiquement lorsque l&apos;Apprenant a complété 100 % du contenu de la formation et, si la formation comporte des quiz notés, obtenu le score minimum requis défini par l&apos;Instructeur.</li>
              <li><strong className="text-slate-300">Valeur informative :</strong> les certificats délivrés par FreelanceHigh ont une <strong className="text-slate-300">valeur informative uniquement</strong>. Ils ne constituent ni un diplôme reconnu par l&apos;État, ni une certification professionnelle au sens de la loi. Ils attestent de la complétion d&apos;un parcours de formation sur la Plateforme.</li>
              <li><strong className="text-slate-300">Vérification :</strong> chaque certificat dispose d&apos;un identifiant unique et d&apos;un QR code permettant à des tiers (employeurs, recruteurs) de vérifier son authenticité via une page de vérification publique sur la Plateforme.</li>
              <li><strong className="text-slate-300">Conservation :</strong> les certificats sont conservés indéfiniment dans le compte de l&apos;Apprenant et restent accessibles même après la suppression de la formation par l&apos;Instructeur.</li>
            </ul>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">24.7 Produits numériques</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Les produits numériques commercialisés sur la Plateforme sont soumis aux conditions suivantes :
            </p>
            <ul className="text-sm text-slate-400 leading-relaxed list-disc list-inside space-y-2 mb-4 ml-4">
              <li><strong className="text-slate-300">Types de produits :</strong> les catégories autorisées incluent les e-books, templates, code source, ressources graphiques, fichiers audio, fichiers vidéo et licences logicielles. L&apos;Instructeur est responsable de la conformité de ses produits avec la législation applicable.</li>
              <li><strong className="text-slate-300">Licences :</strong> chaque produit numérique est accompagné d&apos;une licence d&apos;utilisation définie par l&apos;Instructeur (usage personnel, usage commercial, ou les deux). L&apos;Apprenant s&apos;engage à respecter les termes de cette licence.</li>
              <li><strong className="text-slate-300">Non-remboursable après téléchargement :</strong> conformément à l&apos;article L.221-28 du Code de la consommation, les produits numériques téléchargeables ne sont <strong className="text-slate-300">pas remboursables</strong> une fois le téléchargement effectué, l&apos;Apprenant ayant expressément renoncé à son droit de rétractation au moment de l&apos;achat.</li>
              <li><strong className="text-slate-300">Stock limité :</strong> certains produits numériques peuvent être proposés en quantité limitée. L&apos;Instructeur peut définir un nombre maximum d&apos;acheteurs. Une fois ce nombre atteint, le produit est automatiquement retiré de la vente.</li>
            </ul>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">24.8 Politique de remboursement des formations</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Les formations (hors produits numériques et cohortes) bénéficient de la politique de remboursement suivante :
            </p>
            <ul className="text-sm text-slate-400 leading-relaxed list-disc list-inside space-y-2 mb-4 ml-4">
              <li><strong className="text-slate-300">Garantie 30 jours :</strong> l&apos;Apprenant dispose d&apos;un délai de 30 jours à compter de la date d&apos;achat pour demander un remboursement intégral, sans justification, à condition d&apos;avoir consulté moins de 30 % du contenu total de la formation.</li>
              <li><strong className="text-slate-300">Conditions d&apos;exclusion :</strong> le remboursement est refusé si l&apos;Apprenant a consulté plus de 30 % du contenu, s&apos;il a obtenu le certificat de complétion, ou si la demande intervient au-delà du délai de 30 jours.</li>
              <li><strong className="text-slate-300">Procédure :</strong> la demande de remboursement se fait via le support FreelanceHigh. Le remboursement est effectué par le même moyen de paiement utilisé lors de l&apos;achat dans un délai de 14 jours ouvrables.</li>
              <li><strong className="text-slate-300">Formations gratuites :</strong> les formations gratuites ne sont pas concernées par cette politique.</li>
            </ul>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">24.9 Contenu interdit</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              En complément des règles générales de contenu définies à l&apos;Article 15 des présentes CGU, les contenus suivants sont spécifiquement interdits dans les formations et produits numériques :
            </p>
            <ul className="text-sm text-slate-400 leading-relaxed list-disc list-inside space-y-2 mb-4 ml-4">
              <li><strong className="text-slate-300">Plagiat :</strong> tout contenu copié ou reproduit sans autorisation d&apos;un tiers (autre formation, livre, article, vidéo) est strictement interdit.</li>
              <li><strong className="text-slate-300">Contenu généré par IA non divulgué :</strong> l&apos;utilisation d&apos;intelligence artificielle pour générer tout ou partie du contenu d&apos;une formation doit être explicitement signalée. L&apos;Instructeur reste responsable de la véracité et de la qualité du contenu.</li>
              <li><strong className="text-slate-300">Contenu obsolète ou trompeur :</strong> les formations présentant des informations sciemment erronées, dépassées ou trompeuses entraîneront la suspension de la formation et, en cas de récidive, du compte Instructeur.</li>
              <li><strong className="text-slate-300">Violation de propriété intellectuelle :</strong> l&apos;utilisation de marques, logos, logiciels, polices ou tout autre élément protégé sans licence valide est interdite.</li>
            </ul>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">24.10 Évaluations et avis</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Le système d&apos;évaluation des formations est soumis aux règles suivantes :
            </p>
            <ul className="text-sm text-slate-400 leading-relaxed list-disc list-inside space-y-2 mb-4 ml-4">
              <li><strong className="text-slate-300">Système de notation :</strong> les apprenants peuvent évaluer une formation sur une échelle de 1 à 5 étoiles, accompagnée d&apos;un commentaire textuel. L&apos;évaluation ne peut être soumise qu&apos;après avoir complété au minimum 50 % du contenu de la formation.</li>
              <li><strong className="text-slate-300">Règles :</strong> les évaluations doivent être honnêtes, factuelles et porter uniquement sur la qualité du contenu pédagogique. Les avis contenant des propos injurieux, diffamatoires, discriminatoires ou sans rapport avec la formation seront supprimés.</li>
              <li><strong className="text-slate-300">Droit de réponse :</strong> l&apos;Instructeur peut répondre publiquement à chaque avis. Les réponses doivent rester professionnelles et constructives.</li>
              <li><strong className="text-slate-300">Authenticité :</strong> les faux avis (achetés, échangés entre Instructeurs, ou créés par des comptes fictifs) sont strictement interdits et entraînent la suspension du compte. FreelanceHigh se réserve le droit de vérifier l&apos;authenticité des évaluations.</li>
            </ul>
          </section>

        </div>

        <p className="text-xs text-slate-600 mt-12 text-center">
          {t("copyright")}
        </p>
      </div>
    </div>
  );
}
