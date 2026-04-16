import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal");
  return {
    title: t("privacy_meta_title"),
    description: t("privacy_meta_description"),
  };
}

export default async function ConfidentialitePage() {
  const t = await getTranslations("legal");
  return (
    <div className="min-h-screen bg-background-dark">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-black text-white mb-4">{t("privacy_title")}</h1>
        <p className="text-sm text-slate-500 mb-2">{t("last_updated", { date: "1er mars 2026" })}</p>
        {t("french_only_notice") && (
          <p className="text-sm text-amber-400/80 mb-2 italic">{t("french_only_notice")}</p>
        )}
        <p className="text-sm text-slate-500 mb-12">
          FreelanceHigh s&apos;engage à protéger la vie privée de ses utilisateurs. La présente Politique de Confidentialité décrit comment nous collectons, utilisons, stockons et protégeons vos données personnelles lorsque vous utilisez notre plateforme, conformément au Règlement Général sur la Protection des Données (RGPD - Règlement UE 2016/679) et à la loi Informatique et Libertés du 6 janvier 1978 modifiée.
        </p>

        <div className="space-y-8">

          {/* Section 1 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">1. Responsable du traitement</h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Le responsable du traitement des données personnelles collectées sur la plateforme FreelanceHigh est :
            </p>
            <div className="bg-white/5 rounded-lg p-4 text-sm text-slate-400 space-y-2 mb-4">
              <p><strong className="text-slate-300">Dénomination :</strong> FreelanceHigh</p>
              <p><strong className="text-slate-300">Représentant légal :</strong> Lissanon Gildas, Fondateur &amp; CEO</p>
              <p><strong className="text-slate-300">Adresse email :</strong> contact@freelancehigh.com</p>
              <p><strong className="text-slate-300">Site web :</strong> https://www.freelancehigh.com</p>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Pour toute question relative à la protection de vos données personnelles, vous pouvez contacter notre Délégué à la Protection des Données (DPO) à l&apos;adresse : <strong className="text-slate-300">privacy@freelancehigh.com</strong>.
            </p>
          </section>

          {/* Section 2 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">2. Données personnelles collectées</h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Dans le cadre de l&apos;utilisation de la Plateforme, nous sommes amenés à collecter et traiter les catégories de données personnelles suivantes :
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">2.1 Données d&apos;identification</h3>
            <ul className="text-sm text-slate-400 leading-relaxed list-disc list-inside space-y-2 mb-4 ml-4">
              <li>Nom et prénom</li>
              <li>Adresse email</li>
              <li>Numéro de téléphone</li>
              <li>Photo de profil (si fournie)</li>
              <li>Nom d&apos;utilisateur (username)</li>
              <li>Date de naissance (lors de la vérification KYC)</li>
              <li>Adresse postale (optionnelle)</li>
              <li>Pays de résidence</li>
              <li>Nationalité</li>
            </ul>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">2.2 Données professionnelles</h3>
            <ul className="text-sm text-slate-400 leading-relaxed list-disc list-inside space-y-2 mb-4 ml-4">
              <li>Titre professionnel et biographie</li>
              <li>Compétences et niveaux d&apos;expertise</li>
              <li>Formation et certifications</li>
              <li>Langues parlées et niveaux</li>
              <li>Portfolio et réalisations</li>
              <li>Liens professionnels (LinkedIn, GitHub, Behance, site web personnel)</li>
              <li>Tarif horaire et disponibilités</li>
              <li>Pour les Agences : nom de l&apos;agence, secteur d&apos;activité, taille de l&apos;équipe, numéro SIRET (optionnel)</li>
            </ul>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">2.3 Données de vérification d&apos;identité (KYC)</h3>
            <ul className="text-sm text-slate-400 leading-relaxed list-disc list-inside space-y-2 mb-4 ml-4">
              <li>Copie de la pièce d&apos;identité (carte nationale d&apos;identité, passeport ou permis de conduire)</li>
              <li>Justificatif de domicile (si demandé)</li>
              <li>Attestation d&apos;immatriculation professionnelle (niveau KYC 4)</li>
              <li>Diplômes et certificats professionnels (niveau KYC 4)</li>
              <li>Selfie de vérification (si demandé pour validation d&apos;identité)</li>
            </ul>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">2.4 Données financières et de transaction</h3>
            <ul className="text-sm text-slate-400 leading-relaxed list-disc list-inside space-y-2 mb-4 ml-4">
              <li>Informations de paiement (les données de carte bancaire sont traitées exclusivement par Stripe et ne sont jamais stockées sur nos serveurs)</li>
              <li>Coordonnées bancaires pour les retraits (IBAN, numéro de compte Mobile Money)</li>
              <li>Historique des transactions (commandes, paiements, retraits, factures)</li>
              <li>Solde du portefeuille</li>
              <li>Plan d&apos;abonnement et historique de facturation</li>
            </ul>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">2.5 Données de navigation et techniques</h3>
            <ul className="text-sm text-slate-400 leading-relaxed list-disc list-inside space-y-2 mb-4 ml-4">
              <li>Adresse IP</li>
              <li>Type de navigateur et version</li>
              <li>Système d&apos;exploitation</li>
              <li>Pages visitées et durée de visite</li>
              <li>Source de trafic (moteur de recherche, lien direct, réseau social)</li>
              <li>Préférences de langue et de devise</li>
              <li>Identifiants de cookies (voir notre <Link href="/cookies" className="text-primary hover:underline">Politique de Cookies</Link>)</li>
              <li>Données d&apos;appareil (résolution d&apos;écran, type d&apos;appareil)</li>
            </ul>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">2.6 Données de communication</h3>
            <ul className="text-sm text-slate-400 leading-relaxed list-disc list-inside space-y-2 ml-4">
              <li>Messages échangés via la messagerie intégrée de la Plateforme</li>
              <li>Fichiers envoyés et reçus dans le cadre des commandes</li>
              <li>Correspondances avec le support client</li>
              <li>Avis et évaluations publiés</li>
              <li>Réponses aux enquêtes de satisfaction</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">3. Finalités du traitement</h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Vos données personnelles sont collectées et traitées pour les finalités suivantes :
            </p>

            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-slate-300 font-semibold mb-2">Gestion de votre compte</p>
                <p className="text-sm text-slate-400">Création et gestion de votre compte utilisateur, authentification, gestion de vos préférences (langue, devise, notifications), processus d&apos;onboarding.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-slate-300 font-semibold mb-2">Fourniture des services de la Plateforme</p>
                <p className="text-sm text-slate-400">Mise en relation des Freelances, Clients et Agences, publication et gestion des services, traitement des commandes, communication entre utilisateurs, gestion des livrables.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-slate-300 font-semibold mb-2">Traitement des transactions financières</p>
                <p className="text-sm text-slate-400">Traitement des paiements via Stripe et CinetPay, gestion du système d&apos;escrow, traitement des retraits, génération des factures, gestion des abonnements.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-slate-300 font-semibold mb-2">Vérification d&apos;identité et conformité</p>
                <p className="text-sm text-slate-400">Processus KYC (vérification d&apos;identité par niveaux), lutte contre le blanchiment d&apos;argent et le financement du terrorisme, détection de fraude, conformité aux obligations réglementaires.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-slate-300 font-semibold mb-2">Amélioration de nos services</p>
                <p className="text-sm text-slate-400">Analyse des usages pour améliorer l&apos;expérience utilisateur, analyse statistique et reporting interne, développement de nouvelles fonctionnalités, tests et débogage.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-slate-300 font-semibold mb-2">Communication</p>
                <p className="text-sm text-slate-400">Envoi d&apos;emails transactionnels (confirmations de commande, alertes de sécurité, rappels de délai), envoi de notifications in-app et push, newsletter (avec votre consentement), support client.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-slate-300 font-semibold mb-2">Sécurité et prévention des abus</p>
                <p className="text-sm text-slate-400">Détection et prévention de la fraude, protection contre les accès non autorisés, modération des contenus, résolution des litiges, journalisation des actions pour audit de sécurité.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-slate-300 font-semibold mb-2">Obligations légales</p>
                <p className="text-sm text-slate-400">Respect des obligations comptables et fiscales, réponse aux demandes des autorités judiciaires ou administratives, conservation des données dans les délais légaux.</p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">4. Bases légales du traitement</h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Conformément au RGPD, chaque traitement de données personnelles repose sur l&apos;une des bases légales suivantes :
            </p>

            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-slate-300 font-semibold mb-2">Exécution du contrat (Article 6.1.b du RGPD)</p>
                <p className="text-sm text-slate-400">Le traitement est nécessaire à l&apos;exécution des Conditions Générales d&apos;Utilisation que vous avez acceptées : création de compte, gestion des commandes, traitement des paiements, système d&apos;escrow, messagerie entre utilisateurs, gestion des litiges.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-slate-300 font-semibold mb-2">Consentement (Article 6.1.a du RGPD)</p>
                <p className="text-sm text-slate-400">Certains traitements sont fondés sur votre consentement explicite : inscription à la newsletter, cookies analytiques et de performance (PostHog, Sentry), utilisation de la photo de profil. Vous pouvez retirer votre consentement à tout moment.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-slate-300 font-semibold mb-2">Obligation légale (Article 6.1.c du RGPD)</p>
                <p className="text-sm text-slate-400">Nous sommes tenus de traiter certaines données pour respecter nos obligations légales : vérification KYC (lutte anti-blanchiment), conservation des données de transaction (obligations comptables et fiscales), réponse aux réquisitions judiciaires.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-slate-300 font-semibold mb-2">Intérêt légitime (Article 6.1.f du RGPD)</p>
                <p className="text-sm text-slate-400">Certains traitements sont fondés sur notre intérêt légitime : amélioration de nos services et de l&apos;expérience utilisateur, prévention de la fraude et des abus, statistiques agrégées d&apos;utilisation, sécurité de la plateforme. Ces traitements sont mis en balance avec vos droits et libertés.</p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">5. Destinataires des données</h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              <strong className="text-slate-300">Vos données personnelles ne sont jamais vendues à des tiers.</strong> Elles peuvent être partagées avec les catégories de destinataires suivantes, dans le strict respect des finalités décrites ci-dessus :
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">5.1 Sous-traitants techniques</h3>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm text-slate-400">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">Prestataire</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">Usage</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">Localisation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr><td className="py-3 px-4">Supabase</td><td className="py-3 px-4">Base de données, authentification, stockage fichiers</td><td className="py-3 px-4">EU (Frankfurt, eu-central-1)</td></tr>
                  <tr><td className="py-3 px-4">Vercel</td><td className="py-3 px-4">Hébergement frontend, CDN</td><td className="py-3 px-4">USA (Edge mondial)</td></tr>
                  <tr><td className="py-3 px-4">Railway</td><td className="py-3 px-4">Hébergement backend API</td><td className="py-3 px-4">EU</td></tr>
                  <tr><td className="py-3 px-4">Stripe</td><td className="py-3 px-4">Paiements carte, SEPA, escrow</td><td className="py-3 px-4">USA/EU</td></tr>
                  <tr><td className="py-3 px-4">CinetPay</td><td className="py-3 px-4">Paiements Mobile Money Afrique</td><td className="py-3 px-4">Côte d&apos;Ivoire</td></tr>
                  <tr><td className="py-3 px-4">Cloudinary</td><td className="py-3 px-4">Hébergement images publiques</td><td className="py-3 px-4">USA</td></tr>
                  <tr><td className="py-3 px-4">Resend</td><td className="py-3 px-4">Envoi d&apos;emails transactionnels</td><td className="py-3 px-4">USA</td></tr>
                  <tr><td className="py-3 px-4">Twilio</td><td className="py-3 px-4">SMS de vérification et alertes</td><td className="py-3 px-4">USA</td></tr>
                  <tr><td className="py-3 px-4">PostHog</td><td className="py-3 px-4">Analytics produit (anonymisé)</td><td className="py-3 px-4">EU</td></tr>
                  <tr><td className="py-3 px-4">Sentry</td><td className="py-3 px-4">Monitoring erreurs et performances</td><td className="py-3 px-4">USA</td></tr>
                  <tr><td className="py-3 px-4">Upstash</td><td className="py-3 px-4">Cache Redis, sessions</td><td className="py-3 px-4">EU</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Tous nos sous-traitants sont liés par des accords de traitement de données (DPA) conformes au RGPD. Pour les transferts vers les États-Unis, ces prestataires adhèrent au EU-US Data Privacy Framework ou sont couverts par des Clauses Contractuelles Types (CCT) approuvées par la Commission européenne.
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">5.2 Autres utilisateurs de la Plateforme</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Certaines de vos données sont visibles par les autres utilisateurs dans le cadre normal d&apos;utilisation de la Plateforme : votre profil public (nom, photo, titre, compétences, portfolio, avis reçus), vos services publiés, vos évaluations et réponses aux avis. Vous pouvez contrôler la visibilité de votre profil depuis les paramètres de confidentialité (public, connexions uniquement, ou privé).
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">5.3 Autorités compétentes</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Vos données peuvent être communiquées aux autorités judiciaires, administratives ou réglementaires compétentes, sur demande officielle et dans le cadre de la loi applicable (réquisition judiciaire, demande de la CNIL, obligations anti-blanchiment).
            </p>
          </section>

          {/* Section 6 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">6. Transferts internationaux de données</h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Vos données personnelles sont principalement stockées sur des serveurs situés au sein de l&apos;Union européenne (Supabase, région eu-central-1 Frankfurt). Toutefois, certains de nos sous-traitants sont établis en dehors de l&apos;Union européenne, notamment aux États-Unis (Vercel, Stripe, Cloudinary, Resend, Twilio, Sentry).
            </p>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Ces transferts sont encadrés par les mécanismes suivants, conformément au Chapitre V du RGPD :
            </p>
            <ul className="text-sm text-slate-400 leading-relaxed list-disc list-inside space-y-2 mb-4 ml-4">
              <li><strong className="text-slate-300">EU-US Data Privacy Framework :</strong> pour les prestataires américains certifiés dans le cadre de la décision d&apos;adéquation de la Commission européenne du 10 juillet 2023.</li>
              <li><strong className="text-slate-300">Clauses Contractuelles Types (CCT) :</strong> pour les prestataires non couverts par une décision d&apos;adéquation, nous avons conclu des CCT approuvées par la Commission européenne (Décision 2021/914).</li>
              <li><strong className="text-slate-300">Mesures supplémentaires :</strong> chiffrement des données en transit (TLS 1.3) et au repos (AES-256), pseudonymisation lorsque possible, restriction des accès au strict nécessaire.</li>
            </ul>
            <p className="text-sm text-slate-400 leading-relaxed">
              Les documents KYC (pièces d&apos;identité, justificatifs) ne sont <strong className="text-slate-300">jamais transférés</strong> en dehors de l&apos;Union européenne. Ils sont exclusivement stockés dans des buckets Supabase Storage chiffrés, dans la région eu-central-1 (Frankfurt).
            </p>
          </section>

          {/* Section 7 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">7. Sécurité des données</h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Nous mettons en oeuvre des mesures techniques et organisationnelles appropriées pour assurer la sécurité et la confidentialité de vos données personnelles :
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">7.1 Mesures techniques</h3>
            <ul className="text-sm text-slate-400 leading-relaxed list-disc list-inside space-y-2 mb-4 ml-4">
              <li><strong className="text-slate-300">Chiffrement en transit :</strong> toutes les communications entre votre navigateur et nos serveurs sont chiffrées via HTTPS/TLS 1.3.</li>
              <li><strong className="text-slate-300">Chiffrement au repos :</strong> les données sensibles (documents KYC, données financières) sont chiffrées au repos avec AES-256.</li>
              <li><strong className="text-slate-300">Hachage des mots de passe :</strong> vos mots de passe sont hachés avec bcrypt (facteur de coût 12) et ne sont jamais stockés en clair.</li>
              <li><strong className="text-slate-300">URLs signées :</strong> les documents privés (KYC, livrables) ne sont accessibles que via des URLs signées à durée limitée (expiration après 1 heure).</li>
              <li><strong className="text-slate-300">Row Level Security (RLS) :</strong> des politiques de sécurité au niveau de la base de données garantissent que chaque utilisateur ne peut accéder qu&apos;à ses propres données.</li>
              <li><strong className="text-slate-300">Protection CSRF :</strong> des tokens anti-CSRF protègent contre les attaques par falsification de requêtes.</li>
              <li><strong className="text-slate-300">Rate limiting :</strong> limitation du nombre de requêtes par IP pour prévenir les attaques par force brute.</li>
              <li><strong className="text-slate-300">Double authentification (2FA) :</strong> disponible via Google Authenticator (TOTP) ou SMS pour renforcer la sécurité de votre compte.</li>
            </ul>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">7.2 Mesures organisationnelles</h3>
            <ul className="text-sm text-slate-400 leading-relaxed list-disc list-inside space-y-2 mb-4 ml-4">
              <li>Accès aux données limité au strict nécessaire selon le principe du moindre privilège</li>
              <li>Journalisation de toutes les actions administratives pour audit</li>
              <li>Procédure de notification en cas de violation de données (dans les 72 heures conformément au RGPD)</li>
              <li>Revue régulière des accès et des permissions</li>
              <li>Monitoring continu via Sentry pour la détection d&apos;anomalies</li>
            </ul>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">7.3 Données de paiement</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Les données de carte bancaire ne sont <strong className="text-slate-300">jamais stockées sur nos serveurs</strong>. Elles sont traitées exclusivement par Stripe, prestataire certifié PCI DSS Niveau 1 (le plus haut niveau de certification de sécurité des données de paiement). Les numéros de compte Mobile Money sont traités par CinetPay dans un environnement sécurisé.
            </p>
          </section>

          {/* Section 8 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">8. Durées de conservation</h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Vos données personnelles sont conservées pendant la durée strictement nécessaire aux finalités pour lesquelles elles ont été collectées, dans le respect des obligations légales applicables :
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-slate-400">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">Type de données</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">Durée de conservation</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">Fondement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="py-3 px-4">Données du compte (profil, préférences)</td>
                    <td className="py-3 px-4">Durée du compte + 3 ans après suppression</td>
                    <td className="py-3 px-4">Prescription civile</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Documents KYC (pièces d&apos;identité)</td>
                    <td className="py-3 px-4">5 ans après la dernière vérification</td>
                    <td className="py-3 px-4">Réglementation anti-blanchiment (LCB-FT)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Données de transaction (commandes, paiements, factures)</td>
                    <td className="py-3 px-4">10 ans après la transaction</td>
                    <td className="py-3 px-4">Obligations comptables (Code de commerce)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Messages et communications</td>
                    <td className="py-3 px-4">Durée du compte + 1 an</td>
                    <td className="py-3 px-4">Résolution de litiges</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Données de navigation (logs, IP)</td>
                    <td className="py-3 px-4">13 mois maximum</td>
                    <td className="py-3 px-4">Recommandations CNIL</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Cookies analytiques</td>
                    <td className="py-3 px-4">13 mois maximum</td>
                    <td className="py-3 px-4">Recommandations CNIL</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Avis et évaluations</td>
                    <td className="py-3 px-4">Durée du compte (anonymisés après suppression)</td>
                    <td className="py-3 px-4">Intérêt légitime</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Données de candidature (lettre, offres)</td>
                    <td className="py-3 px-4">Durée du compte + 6 mois</td>
                    <td className="py-3 px-4">Exécution du contrat</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Newsletter (adresse email)</td>
                    <td className="py-3 px-4">Jusqu&apos;au retrait du consentement</td>
                    <td className="py-3 px-4">Consentement</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed mt-4">
              À l&apos;expiration des durées de conservation, les données sont supprimées de manière sécurisée ou anonymisées de façon irréversible pour les besoins statistiques.
            </p>
          </section>

          {/* Section 9 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">9. Vos droits</h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés, vous disposez des droits suivants sur vos données personnelles :
            </p>

            <div className="space-y-4 mb-6">
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-slate-300 font-semibold mb-2">Droit d&apos;accès (Article 15 du RGPD)</p>
                <p className="text-sm text-slate-400">Vous avez le droit d&apos;obtenir la confirmation que des données personnelles vous concernant sont ou ne sont pas traitées et, lorsqu&apos;elles le sont, d&apos;obtenir l&apos;accès à ces données ainsi qu&apos;à une copie de celles-ci. Vous pouvez accéder à la plupart de vos données directement depuis les paramètres de votre compte.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-slate-300 font-semibold mb-2">Droit de rectification (Article 16 du RGPD)</p>
                <p className="text-sm text-slate-400">Vous avez le droit d&apos;obtenir la rectification de données personnelles inexactes vous concernant. Vous pouvez modifier la plupart de vos informations directement depuis votre profil. Pour les données que vous ne pouvez pas modifier vous-même (documents KYC validés par exemple), contactez notre support.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-slate-300 font-semibold mb-2">Droit à l&apos;effacement — &quot;droit à l&apos;oubli&quot; (Article 17 du RGPD)</p>
                <p className="text-sm text-slate-400">Vous avez le droit d&apos;obtenir l&apos;effacement de vos données personnelles lorsque : les données ne sont plus nécessaires au regard des finalités pour lesquelles elles ont été collectées, vous retirez votre consentement, vous vous opposez au traitement. Ce droit peut être limité par nos obligations légales de conservation (comptabilité, anti-blanchiment).</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-slate-300 font-semibold mb-2">Droit à la portabilité (Article 20 du RGPD)</p>
                <p className="text-sm text-slate-400">Vous avez le droit de recevoir les données personnelles que vous nous avez fournies, dans un format structuré, couramment utilisé et lisible par machine (JSON ou CSV), et de les transmettre à un autre responsable de traitement.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-slate-300 font-semibold mb-2">Droit d&apos;opposition (Article 21 du RGPD)</p>
                <p className="text-sm text-slate-400">Vous avez le droit de vous opposer à tout moment au traitement de vos données personnelles fondé sur notre intérêt légitime (amélioration des services, statistiques). Vous pouvez également vous opposer à la prospection commerciale à tout moment.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-slate-300 font-semibold mb-2">Droit à la limitation du traitement (Article 18 du RGPD)</p>
                <p className="text-sm text-slate-400">Vous avez le droit d&apos;obtenir la limitation du traitement de vos données dans certains cas : lorsque vous contestez l&apos;exactitude des données, lorsque le traitement est illicite, lorsque vous en avez besoin pour la constatation ou l&apos;exercice de droits en justice.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-slate-300 font-semibold mb-2">Droit de retirer votre consentement</p>
                <p className="text-sm text-slate-400">Lorsque le traitement est fondé sur votre consentement, vous pouvez le retirer à tout moment. Le retrait du consentement ne compromet pas la licéité du traitement fondé sur le consentement effectué avant ce retrait.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-slate-300 font-semibold mb-2">Droit de définir des directives post-mortem</p>
                <p className="text-sm text-slate-400">Conformément à la loi Informatique et Libertés, vous avez le droit de définir des directives relatives à la conservation, à l&apos;effacement et à la communication de vos données personnelles après votre décès.</p>
              </div>
            </div>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">Comment exercer vos droits</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Pour exercer l&apos;un de ces droits, vous pouvez :
            </p>
            <ul className="text-sm text-slate-400 leading-relaxed list-disc list-inside space-y-2 mb-4 ml-4">
              <li>Envoyer un email à <strong className="text-slate-300">privacy@freelancehigh.com</strong> en précisant votre demande et en joignant un justificatif d&apos;identité</li>
              <li>Utiliser les options disponibles dans les paramètres de votre compte (modification du profil, suppression du compte, gestion des notifications)</li>
              <li>Contacter notre support via le <Link href="/aide" className="text-primary hover:underline">centre d&apos;aide</Link></li>
            </ul>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Nous nous engageons à traiter votre demande dans un délai maximum d&apos;un mois à compter de sa réception. Ce délai peut être prolongé de deux mois supplémentaires en cas de demande complexe, auquel cas vous en serez informé.
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">Réclamation auprès de la CNIL</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Si vous estimez que le traitement de vos données personnelles constitue une violation du RGPD, vous avez le droit d&apos;introduire une réclamation auprès de la Commission Nationale de l&apos;Informatique et des Libertés (CNIL), l&apos;autorité de contrôle française compétente : CNIL — 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07 — www.cnil.fr.
            </p>
          </section>

          {/* Section 10 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">10. Cookies et technologies de suivi</h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Notre utilisation des cookies et technologies similaires est détaillée dans notre <Link href="/cookies" className="text-primary hover:underline">Politique de Cookies</Link>. En résumé, nous utilisons :
            </p>
            <ul className="text-sm text-slate-400 leading-relaxed list-disc list-inside space-y-2 mb-4 ml-4">
              <li><strong className="text-slate-300">Cookies strictement nécessaires :</strong> authentification, préférences de langue et de devise, sécurité (CSRF). Ces cookies ne peuvent pas être désactivés.</li>
              <li><strong className="text-slate-300">Cookies analytiques :</strong> PostHog pour l&apos;analyse d&apos;usage de la plateforme (avec votre consentement).</li>
              <li><strong className="text-slate-300">Cookies de performance :</strong> Sentry pour la détection d&apos;erreurs et le suivi des performances (avec votre consentement).</li>
            </ul>
            <p className="text-sm text-slate-400 leading-relaxed">
              Vous pouvez gérer vos préférences de cookies à tout moment via les paramètres de votre navigateur ou notre bandeau de consentement.
            </p>
          </section>

          {/* Section 11 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">11. Protection des mineurs</h2>

            <p className="text-sm text-slate-400 leading-relaxed">
              La Plateforme FreelanceHigh est destinée aux personnes âgées d&apos;au moins 18 ans. Nous ne collectons pas sciemment de données personnelles auprès de mineurs. Si nous prenons connaissance qu&apos;un mineur nous a fourni des données personnelles, nous supprimerons ces données dans les meilleurs délais. Si vous êtes un parent ou un tuteur légal et que vous pensez que votre enfant nous a fourni des données personnelles, veuillez nous contacter à privacy@freelancehigh.com.
            </p>
          </section>

          {/* Section 12 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">12. Profilage et décisions automatisées</h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              La Plateforme utilise des mécanismes automatisés dans les cas suivants :
            </p>
            <ul className="text-sm text-slate-400 leading-relaxed list-disc list-inside space-y-2 mb-4 ml-4">
              <li><strong className="text-slate-300">Algorithme de recherche et de classement :</strong> les résultats de recherche sont triés selon des critères objectifs (pertinence, note, taux de complétion, date de publication). Ce classement n&apos;est pas considéré comme une décision automatisée au sens du RGPD.</li>
              <li><strong className="text-slate-300">Attribution de badges :</strong> les badges sont attribués automatiquement selon des critères objectifs et mesurables (nombre de commandes, taux de satisfaction, niveau KYC). Vous pouvez contester une décision relative aux badges en contactant le support.</li>
              <li><strong className="text-slate-300">Détection de fraude :</strong> des algorithmes automatisés analysent les comportements suspects (connexions inhabituelles, transactions anormales). En cas de suspension automatique de votre compte, vous pouvez demander une révision manuelle par notre équipe.</li>
            </ul>
            <p className="text-sm text-slate-400 leading-relaxed">
              Aucune décision automatisée n&apos;est prise à votre égard qui produirait des effets juridiques ou vous affecterait de manière significative sans intervention humaine, conformément à l&apos;Article 22 du RGPD.
            </p>
          </section>

          {/* Section 13 — Données formations */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">13. Données relatives aux formations et à l&apos;apprentissage</h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              La Plateforme FreelanceHigh propose une section Formations permettant aux Utilisateurs de suivre des formations en ligne, de participer à des cohortes et d&apos;acquérir des produits numériques. Cette activité entraîne la collecte et le traitement de catégories de données spécifiques, décrites ci-après.
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">13.1 Données d&apos;apprentissage collectées</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Lorsque vous utilisez la section Formations de la Plateforme en tant qu&apos;Apprenant, les données suivantes sont collectées :
            </p>
            <ul className="text-sm text-slate-400 leading-relaxed list-disc list-inside space-y-2 mb-4 ml-4">
              <li>Historique des formations auxquelles vous êtes inscrit (gratuites et payantes)</li>
              <li>Progression par formation : pourcentage de complétion, leçons terminées, modules en cours</li>
              <li>Scores obtenus aux quiz et évaluations</li>
              <li>Temps passé par leçon, par module et par formation</li>
              <li>Commentaires et questions posés dans les espaces de discussion des formations</li>
              <li>Notes personnelles prises dans l&apos;interface d&apos;apprentissage (si fonctionnalité disponible)</li>
              <li>Formations ajoutées à la liste de souhaits</li>
              <li>Certificats obtenus et leur statut de vérification</li>
              <li>Inscriptions aux cohortes (dates, statut, paiement)</li>
              <li>Produits numériques achetés et téléchargés</li>
            </ul>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">13.2 Finalités du traitement des données d&apos;apprentissage</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Les données d&apos;apprentissage sont traitées pour les finalités suivantes :
            </p>
            <div className="space-y-3 mb-4">
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-slate-300 font-semibold mb-2">Suivi de la progression</p>
                <p className="text-sm text-slate-400">Permettre à l&apos;Apprenant de suivre sa progression dans chaque formation, de reprendre là où il s&apos;est arrêté, et de visualiser son parcours d&apos;apprentissage global.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-slate-300 font-semibold mb-2">Délivrance des certificats</p>
                <p className="text-sm text-slate-400">Vérifier que les conditions de complétion sont remplies (100 % de progression, score minimum aux quiz) pour la génération automatique des certificats.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-slate-300 font-semibold mb-2">Statistiques agrégées pour les Instructeurs</p>
                <p className="text-sm text-slate-400">Fournir aux Instructeurs des données agrégées et anonymisées sur l&apos;engagement de leurs apprenants (taux de complétion moyen, leçons les plus consultées, taux de réussite aux quiz) pour améliorer la qualité de leurs formations.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-slate-300 font-semibold mb-2">Recommandations personnalisées</p>
                <p className="text-sm text-slate-400">Suggérer des formations pertinentes en fonction de votre historique d&apos;apprentissage, de vos centres d&apos;intérêt et de votre progression dans des domaines connexes.</p>
              </div>
            </div>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">13.3 Partage des données d&apos;apprentissage</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Vos données d&apos;apprentissage font l&apos;objet d&apos;un partage limité et encadré :
            </p>
            <ul className="text-sm text-slate-400 leading-relaxed list-disc list-inside space-y-2 mb-4 ml-4">
              <li><strong className="text-slate-300">Ce que l&apos;Instructeur voit :</strong> l&apos;Instructeur a accès à des statistiques agrégées sur l&apos;ensemble de ses apprenants (nombre d&apos;inscrits, taux de complétion moyen, distribution des notes). Il ne voit <strong className="text-slate-300">pas</strong> votre progression individuelle détaillée, sauf si vous êtes inscrit à une cohorte avec suivi personnalisé.</li>
              <li><strong className="text-slate-300">Ce qui est public :</strong> le nombre total d&apos;apprenants inscrits à une formation est visible publiquement. Vos évaluations et commentaires publiés sont visibles par tous les utilisateurs. Votre nom d&apos;utilisateur est associé à vos avis.</li>
              <li><strong className="text-slate-300">Certificats :</strong> les certificats disposent d&apos;une page de vérification publique accessible via un lien unique et un QR code. Cette page affiche votre nom, le titre de la formation, la date d&apos;obtention et l&apos;identifiant unique du certificat. Vous pouvez choisir de rendre vos certificats visibles sur votre profil public ou de les garder privés.</li>
            </ul>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">13.4 Conservation des données d&apos;apprentissage</h3>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm text-slate-400">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">Type de données</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">Durée de conservation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="py-3 px-4">Progression d&apos;apprentissage</td>
                    <td className="py-3 px-4">Durée du compte + 3 ans après suppression</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Scores de quiz et évaluations</td>
                    <td className="py-3 px-4">Durée du compte + 3 ans après suppression</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Certificats de complétion</td>
                    <td className="py-3 px-4">Conservation indéfinie (valeur probatoire)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Commentaires et discussions de formation</td>
                    <td className="py-3 px-4">Durée du compte + 1 an (anonymisés après suppression)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Données de transaction formations</td>
                    <td className="py-3 px-4">10 ans (obligations comptables)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Évaluations et avis sur les formations</td>
                    <td className="py-3 px-4">Durée du compte (anonymisés après suppression)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">13.5 Données des Instructeurs</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              En tant qu&apos;Instructeur, les données supplémentaires suivantes sont collectées et traitées :
            </p>
            <ul className="text-sm text-slate-400 leading-relaxed list-disc list-inside space-y-2 mb-4 ml-4">
              <li><strong className="text-slate-300">Candidature :</strong> domaines d&apos;expertise, biographie professionnelle (FR et EN), liens professionnels (LinkedIn, site web, YouTube), motivation. Ces données sont conservées pendant la durée du statut d&apos;Instructeur + 1 an.</li>
              <li><strong className="text-slate-300">Revenus :</strong> montant des ventes par formation, commissions perçues, historique des paiements, solde du portefeuille Instructeur. Conservés 10 ans conformément aux obligations comptables.</li>
              <li><strong className="text-slate-300">Analytics de cours :</strong> nombre d&apos;inscrits, taux de complétion, notes moyennes, revenus par formation, données démographiques agrégées des apprenants (pays, langue). Ces données sont anonymisées et agrégées — aucune donnée personnelle individuelle d&apos;apprenant n&apos;est communiquée à l&apos;Instructeur.</li>
            </ul>
            <p className="text-sm text-slate-400 leading-relaxed">
              La base légale du traitement des données de formation est l&apos;exécution du contrat (Article 6.1.b du RGPD) pour le suivi de progression, la délivrance de certificats et le traitement des transactions. Les recommandations personnalisées sont fondées sur l&apos;intérêt légitime (Article 6.1.f du RGPD).
            </p>
          </section>

          {/* Section 14 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">14. Modifications de la politique de confidentialité</h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Nous nous réservons le droit de modifier la présente Politique de Confidentialité à tout moment. Les modifications substantielles vous seront notifiées par email et par notification in-app au moins 30 jours avant leur entrée en vigueur. La date de dernière mise à jour est indiquée en haut de cette page.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">
              Nous vous recommandons de consulter régulièrement cette page pour rester informé de nos pratiques en matière de protection des données personnelles. Les versions antérieures de cette politique sont archivées et consultables sur demande.
            </p>
          </section>

          {/* Section 15 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">15. Contact</h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Pour toute question, demande ou réclamation relative à la protection de vos données personnelles, vous pouvez nous contacter :
            </p>
            <div className="bg-white/5 rounded-lg p-4 text-sm text-slate-400 space-y-2">
              <p><strong className="text-slate-300">Délégué à la Protection des Données (DPO) :</strong> privacy@freelancehigh.com</p>
              <p><strong className="text-slate-300">Support général :</strong> contact@freelancehigh.com</p>
              <p><strong className="text-slate-300">Centre d&apos;aide :</strong> <Link href="/aide" className="text-primary hover:underline">https://www.freelancehigh.com/aide</Link></p>
              <p><strong className="text-slate-300">Responsable du traitement :</strong> FreelanceHigh — Lissanon Gildas, Fondateur</p>
            </div>
          </section>

        </div>

        <p className="text-xs text-slate-600 mt-12 text-center">
          {t("copyright")}
        </p>
      </div>
    </div>
  );
}
