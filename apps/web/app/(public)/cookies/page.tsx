import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal");
  return {
    title: t("cookies_meta_title"),
    description: t("cookies_meta_description"),
  };
}

export default async function CookiesPage() {
  const t = await getTranslations("legal");
  return (
    <div className="min-h-screen bg-background-dark">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-black text-white mb-4">{t("cookies_title")}</h1>
        <p className="text-sm text-slate-500 mb-2">{t("last_updated", { date: "1er mars 2026" })}</p>
        {t("french_only_notice") && (
          <p className="text-sm text-amber-400/80 mb-2 italic">{t("french_only_notice")}</p>
        )}
        <p className="text-sm text-slate-500 mb-12">
          La présente Politique de Cookies explique comment FreelanceHigh (accessible à l&apos;adresse https://www.freelancehigh.com) utilise les cookies et technologies similaires pour vous reconnaître lorsque vous visitez notre plateforme. Elle explique ce que sont ces technologies, pourquoi nous les utilisons, et comment vous pouvez gérer vos préférences.
        </p>

        <div className="space-y-8">

          {/* Section 1 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">1. Qu&apos;est-ce qu&apos;un cookie ?</h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur, smartphone, tablette) par le serveur du site web que vous visitez. Il contient des informations relatives à votre navigation qui sont renvoyées au serveur lors de vos visites ultérieures.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Les cookies permettent au site de mémoriser vos actions et préférences (comme la langue, la devise, la taille de police, et d&apos;autres préférences d&apos;affichage) afin que vous n&apos;ayez pas à les re-saisir à chaque visite ou à chaque navigation d&apos;une page à une autre.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">
              Outre les cookies, nous pouvons utiliser des technologies similaires comme le stockage local (localStorage et sessionStorage) du navigateur pour mémoriser certaines préférences côté client.
            </p>
          </section>

          {/* Section 2 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">2. Types de cookies utilisés</h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Nous utilisons les catégories de cookies suivantes sur notre plateforme :
            </p>

            {/* 2.1 Cookies essentiels */}
            <div className="mb-8">
              <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                <span className="inline-block w-3 h-3 bg-emerald-500 rounded-full"></span>
                2.1 Cookies strictement nécessaires (essentiels)
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                Ces cookies sont indispensables au fonctionnement de la Plateforme. Sans eux, les services que vous avez demandés ne peuvent pas être fournis. Ils ne peuvent pas être désactivés dans nos systèmes.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-slate-400">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Cookie</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Finalité</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Durée</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Émetteur</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <tr>
                      <td className="py-3 px-4 font-mono text-xs">sb-access-token</td>
                      <td className="py-3 px-4">Authentification de l&apos;utilisateur — contient le JWT de session Supabase</td>
                      <td className="py-3 px-4">1 heure (renouvelé automatiquement)</td>
                      <td className="py-3 px-4">Supabase Auth</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono text-xs">sb-refresh-token</td>
                      <td className="py-3 px-4">Renouvellement automatique de la session sans reconnexion</td>
                      <td className="py-3 px-4">7 jours (ou 30 jours avec &quot;Se souvenir de moi&quot;)</td>
                      <td className="py-3 px-4">Supabase Auth</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono text-xs">csrf-token</td>
                      <td className="py-3 px-4">Protection contre les attaques par falsification de requêtes inter-sites (CSRF)</td>
                      <td className="py-3 px-4">Session</td>
                      <td className="py-3 px-4">FreelanceHigh</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono text-xs">cookie-consent</td>
                      <td className="py-3 px-4">Mémorisation de vos préférences de cookies (acceptation ou refus)</td>
                      <td className="py-3 px-4">12 mois</td>
                      <td className="py-3 px-4">FreelanceHigh</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed mt-3 italic">
                Base légale : Ces cookies sont exemptés du recueil du consentement car ils sont strictement nécessaires à la fourniture du service (Article 82 de la loi Informatique et Libertés).
              </p>
            </div>

            {/* 2.2 Stockage local */}
            <div className="mb-8">
              <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                <span className="inline-block w-3 h-3 bg-blue-500 rounded-full"></span>
                2.2 Stockage local (préférences utilisateur)
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                Nous utilisons le stockage local de votre navigateur (localStorage) pour mémoriser vos préférences d&apos;affichage. Ces données restent sur votre appareil et ne sont jamais envoyées à nos serveurs.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-slate-400">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Clé</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Finalité</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Durée</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <tr>
                      <td className="py-3 px-4 font-mono text-xs">fh-currency</td>
                      <td className="py-3 px-4">Mémorisation de la devise préférée (EUR, FCFA, USD, GBP, MAD)</td>
                      <td className="py-3 px-4">Permanent (jusqu&apos;à suppression manuelle)</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono text-xs">fh-locale</td>
                      <td className="py-3 px-4">Mémorisation de la langue préférée (fr, en)</td>
                      <td className="py-3 px-4">Permanent</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono text-xs">fh-theme</td>
                      <td className="py-3 px-4">Mémorisation du thème visuel (clair/sombre)</td>
                      <td className="py-3 px-4">Permanent</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed mt-3 italic">
                Base légale : Exemptés du consentement (préférences fonctionnelles nécessaires au service).
              </p>
            </div>

            {/* 2.3 Cookies analytiques */}
            <div className="mb-8">
              <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                <span className="inline-block w-3 h-3 bg-amber-500 rounded-full"></span>
                2.3 Cookies analytiques
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                Ces cookies nous permettent de comprendre comment les visiteurs interagissent avec notre Plateforme, en recueillant et communiquant des informations de manière anonyme. Ils nous aident à améliorer nos services et l&apos;expérience utilisateur.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-slate-400">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Cookie</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Finalité</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Durée</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Émetteur</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <tr>
                      <td className="py-3 px-4 font-mono text-xs">ph_*</td>
                      <td className="py-3 px-4">Identifiant anonyme de session PostHog — suivi des pages visitées, durée des visites, parcours utilisateur (funnels), cohortes de rétention</td>
                      <td className="py-3 px-4">13 mois maximum</td>
                      <td className="py-3 px-4">PostHog</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed mt-3 mb-3">
                <strong className="text-slate-300">Données collectées par PostHog :</strong>
              </p>
              <ul className="text-sm text-slate-400 leading-relaxed list-disc list-inside space-y-1 ml-4">
                <li>Pages visitées et temps passé sur chaque page</li>
                <li>Source du trafic (moteur de recherche, lien direct, réseau social)</li>
                <li>Type d&apos;appareil, navigateur et système d&apos;exploitation</li>
                <li>Pays et ville (approximative, basée sur l&apos;IP anonymisée)</li>
                <li>Événements de clic et d&apos;interaction (boutons, formulaires)</li>
                <li>Parcours de conversion (funnels d&apos;inscription, de commande)</li>
              </ul>
              <p className="text-sm text-slate-400 leading-relaxed mt-3 italic">
                Base légale : Consentement (Article 6.1.a du RGPD). Ces cookies ne sont activés qu&apos;après votre acceptation via le bandeau de consentement.
              </p>
            </div>

            {/* 2.4 Cookies de performance */}
            <div>
              <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                <span className="inline-block w-3 h-3 bg-purple-500 rounded-full"></span>
                2.4 Cookies de performance et monitoring
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                Ces cookies nous permettent de surveiller les erreurs techniques et les performances de la Plateforme afin de garantir un service fiable et rapide.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-slate-400">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Cookie</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Finalité</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Durée</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Émetteur</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <tr>
                      <td className="py-3 px-4 font-mono text-xs">sentry-*</td>
                      <td className="py-3 px-4">Détection et suivi des erreurs JavaScript, mesure des temps de chargement des pages, traces de performance</td>
                      <td className="py-3 px-4">Session</td>
                      <td className="py-3 px-4">Sentry</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed mt-3 mb-3">
                <strong className="text-slate-300">Données collectées par Sentry :</strong>
              </p>
              <ul className="text-sm text-slate-400 leading-relaxed list-disc list-inside space-y-1 ml-4">
                <li>Messages d&apos;erreur JavaScript et traces de pile (stack traces)</li>
                <li>Temps de chargement des pages et métriques Web Vitals (LCP, FID, CLS)</li>
                <li>Type de navigateur, version et système d&apos;exploitation</li>
                <li>URL de la page où l&apos;erreur s&apos;est produite</li>
              </ul>
              <p className="text-sm text-slate-400 leading-relaxed mt-3 italic">
                Base légale : Consentement (Article 6.1.a du RGPD). Aucune donnée personnelle identifiable n&apos;est collectée via Sentry. Les données sont utilisées exclusivement pour le débogage technique.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">3. Cookies tiers</h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Certains cookies sont déposés par des services tiers intégrés à notre Plateforme. Nous n&apos;avons pas de contrôle direct sur ces cookies. Voici les services tiers susceptibles de déposer des cookies lors de votre utilisation de FreelanceHigh :
            </p>

            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-slate-300 font-semibold mb-2">Stripe (paiement par carte bancaire)</p>
                <p className="text-sm text-slate-400">Stripe peut déposer des cookies pour la détection de fraude et le traitement sécurisé des paiements. Ces cookies sont essentiels au processus de paiement. Politique de confidentialité : <span className="text-primary">https://stripe.com/privacy</span></p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-slate-300 font-semibold mb-2">CinetPay (paiement Mobile Money)</p>
                <p className="text-sm text-slate-400">CinetPay peut déposer des cookies lors du processus de paiement Mobile Money pour la vérification de la transaction. Politique de confidentialité : <span className="text-primary">https://cinetpay.com/politique-de-confidentialite</span></p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-slate-300 font-semibold mb-2">Cloudinary (images publiques)</p>
                <p className="text-sm text-slate-400">Cloudinary héberge les images publiques de la Plateforme (avatars, photos de services) et peut utiliser des cookies à des fins de performance et de cache CDN. Politique de confidentialité : <span className="text-primary">https://cloudinary.com/privacy</span></p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">4. Durées de conservation des cookies</h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Les cookies déposés sur votre terminal ont des durées de vie variables selon leur type :
            </p>

            <div className="space-y-3">
              <div className="bg-white/5 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <p className="text-sm text-slate-300 font-semibold">Cookies de session</p>
                  <p className="text-sm text-slate-400">Supprimés automatiquement à la fermeture de votre navigateur</p>
                </div>
                <span className="text-xs bg-white/10 text-slate-300 px-3 py-1 rounded-full whitespace-nowrap">Session</span>
              </div>
              <div className="bg-white/5 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <p className="text-sm text-slate-300 font-semibold">Cookie d&apos;authentification (JWT)</p>
                  <p className="text-sm text-slate-400">Renouvelé automatiquement pendant l&apos;utilisation</p>
                </div>
                <span className="text-xs bg-white/10 text-slate-300 px-3 py-1 rounded-full whitespace-nowrap">1 heure</span>
              </div>
              <div className="bg-white/5 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <p className="text-sm text-slate-300 font-semibold">Cookie de rafraîchissement (refresh token)</p>
                  <p className="text-sm text-slate-400">Pour maintenir votre session active</p>
                </div>
                <span className="text-xs bg-white/10 text-slate-300 px-3 py-1 rounded-full whitespace-nowrap">7 à 30 jours</span>
              </div>
              <div className="bg-white/5 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <p className="text-sm text-slate-300 font-semibold">Cookie de consentement</p>
                  <p className="text-sm text-slate-400">Mémorisation de vos choix de cookies</p>
                </div>
                <span className="text-xs bg-white/10 text-slate-300 px-3 py-1 rounded-full whitespace-nowrap">12 mois</span>
              </div>
              <div className="bg-white/5 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <p className="text-sm text-slate-300 font-semibold">Cookies analytiques (PostHog)</p>
                  <p className="text-sm text-slate-400">Conformément aux recommandations CNIL</p>
                </div>
                <span className="text-xs bg-white/10 text-slate-300 px-3 py-1 rounded-full whitespace-nowrap">13 mois max</span>
              </div>
              <div className="bg-white/5 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <p className="text-sm text-slate-300 font-semibold">Préférences (localStorage)</p>
                  <p className="text-sm text-slate-400">Devise, langue, thème</p>
                </div>
                <span className="text-xs bg-white/10 text-slate-300 px-3 py-1 rounded-full whitespace-nowrap">Permanent</span>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">5. Comment gérer vos cookies</h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Vous disposez de plusieurs moyens pour gérer vos préférences en matière de cookies :
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">5.1 Via notre bandeau de consentement</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Lors de votre première visite, un bandeau de consentement vous permet d&apos;accepter ou de refuser les cookies non essentiels (analytiques et de performance). Vous pouvez modifier vos choix à tout moment en cliquant sur le lien &quot;Gérer les cookies&quot; dans le pied de page de la Plateforme.
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">5.2 Via les paramètres de votre navigateur</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Chaque navigateur propose des options pour gérer les cookies. Voici les liens vers les instructions de gestion des cookies des principaux navigateurs :
            </p>
            <ul className="text-sm text-slate-400 leading-relaxed list-disc list-inside space-y-2 mb-4 ml-4">
              <li><strong className="text-slate-300">Google Chrome :</strong> Paramètres → Confidentialité et sécurité → Cookies et autres données de site</li>
              <li><strong className="text-slate-300">Mozilla Firefox :</strong> Paramètres → Vie privée et sécurité → Cookies et données de site</li>
              <li><strong className="text-slate-300">Safari :</strong> Préférences → Confidentialité → Gérer les données de site web</li>
              <li><strong className="text-slate-300">Microsoft Edge :</strong> Paramètres → Cookies et autorisations de site → Gérer et supprimer les cookies</li>
              <li><strong className="text-slate-300">Opera :</strong> Paramètres → Avancé → Confidentialité et sécurité → Cookies</li>
            </ul>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">5.3 Via les outils des services tiers</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Vous pouvez désactiver spécifiquement les outils d&apos;analyse que nous utilisons :
            </p>
            <ul className="text-sm text-slate-400 leading-relaxed list-disc list-inside space-y-2 mb-4 ml-4">
              <li><strong className="text-slate-300">PostHog :</strong> Vous pouvez activer le paramètre &quot;Do Not Track&quot; de votre navigateur, que PostHog respecte.</li>
            </ul>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mt-4">
              <p className="text-sm text-amber-300 font-semibold mb-2">Avertissement</p>
              <p className="text-sm text-slate-400">
                La désactivation de certains cookies peut affecter le fonctionnement de la Plateforme. En particulier, la suppression des cookies essentiels (authentification, CSRF) vous déconnectera et pourra empêcher l&apos;accès à votre compte. Les cookies de préférences (devise, langue) servent à personnaliser votre expérience — leur suppression réinitialisera ces paramètres à leurs valeurs par défaut.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">6. Balises web et pixels de suivi</h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              En plus des cookies, nous pouvons utiliser des balises web (web beacons) ou pixels de suivi dans nos emails transactionnels. Ces technologies nous permettent de savoir si un email a été ouvert et quels liens ont été cliqués, afin d&apos;améliorer la pertinence de nos communications.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">
              Vous pouvez bloquer les pixels de suivi en désactivant le chargement automatique des images dans les paramètres de votre client email, ou en vous désabonnant de nos communications marketing via le lien de désinscription présent dans chaque email.
            </p>
          </section>

          {/* Section 7 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">7. Cookies que nous n&apos;utilisons PAS</h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Pour votre information, voici les types de cookies que FreelanceHigh n&apos;utilise <strong className="text-slate-300">pas</strong> :
            </p>
            <ul className="text-sm text-slate-400 leading-relaxed list-disc list-inside space-y-2 ml-4">
              <li><strong className="text-slate-300">Cookies publicitaires :</strong> nous n&apos;affichons pas de publicité tierce sur la Plateforme et ne partageons pas vos données à des fins publicitaires.</li>
              <li><strong className="text-slate-300">Cookies de retargeting :</strong> nous ne suivons pas vos activités sur d&apos;autres sites web pour vous cibler avec de la publicité.</li>
              <li><strong className="text-slate-300">Cookies de réseaux sociaux :</strong> nous n&apos;intégrons pas de boutons de partage Facebook, Twitter ou autres réseaux sociaux qui déposent des cookies de suivi.</li>
              <li><strong className="text-slate-300">Google Analytics :</strong> nous utilisons PostHog (hébergé en UE) en lieu et place de Google Analytics, pour une meilleure conformité RGPD.</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">8. Mise à jour de cette politique</h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Nous pouvons mettre à jour cette Politique de Cookies pour refléter des changements dans les cookies que nous utilisons ou pour d&apos;autres raisons opérationnelles, légales ou réglementaires. La date de dernière mise à jour est indiquée en haut de cette page.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">
              En cas de modification substantielle (ajout de nouveaux types de cookies, changement de finalité), nous vous en informerons via un nouveau bandeau de consentement et/ou par notification.
            </p>
          </section>

          {/* Section 9 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">9. Contact</h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Pour toute question concernant notre utilisation des cookies ou pour exercer vos droits relatifs à vos données personnelles, vous pouvez nous contacter :
            </p>
            <div className="bg-white/5 rounded-lg p-4 text-sm text-slate-400 space-y-2">
              <p><strong className="text-slate-300">Email (données personnelles) :</strong> privacy@freelancehigh.com</p>
              <p><strong className="text-slate-300">Email général :</strong> contact@freelancehigh.com</p>
              <p><strong className="text-slate-300">Centre d&apos;aide :</strong> <Link href="/aide" className="text-primary hover:underline">https://www.freelancehigh.com/aide</Link></p>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mt-4">
              Pour en savoir plus sur la protection de vos données personnelles dans leur ensemble, consultez notre <Link href="/confidentialite" className="text-primary hover:underline">Politique de Confidentialité</Link>.
            </p>
          </section>

        </div>

        <p className="text-xs text-slate-600 mt-12 text-center">
          {t("copyright")}
        </p>
      </div>
    </div>
  );
}
