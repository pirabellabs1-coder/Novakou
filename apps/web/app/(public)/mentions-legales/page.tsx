import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal");
  return {
    title: t("legal_notices_meta_title"),
    description: t("legal_notices_meta_description"),
  };
}

export default async function MentionsLegalesPage() {
  const t = await getTranslations("legal");
  return (
    <div className="min-h-screen bg-background-dark">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-black text-white mb-4">{t("legal_notices_title")}</h1>
        {t("french_only_notice") && (
          <p className="text-sm text-amber-400/80 mb-2 italic">{t("french_only_notice")}</p>
        )}
        <p className="text-sm text-slate-500 mb-12">
          Conformément aux dispositions des articles 6-III et 19 de la loi n°2004-575 du 21 juin 2004 pour la Confiance dans l&apos;Économie Numérique (LCEN), il est porté à la connaissance des utilisateurs du site https://www.freelancehigh.com les informations suivantes.
        </p>

        <div className="space-y-8">

          {/* Section 1 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">1. Éditeur du site</h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Le site https://www.freelancehigh.com (ci-après &quot;le Site&quot; ou &quot;la Plateforme&quot;) est édité par :
            </p>
            <div className="bg-white/5 rounded-lg p-6 text-sm text-slate-400 space-y-3">
              <p><strong className="text-slate-300">Dénomination :</strong> FreelanceHigh</p>
              <p><strong className="text-slate-300">Fondateur &amp; Directeur de la publication :</strong> Lissanon Gildas</p>
              <p><strong className="text-slate-300">Statut :</strong> Entrepreneur individuel / Société en cours de création</p>
              <p><strong className="text-slate-300">Email :</strong> contact@freelancehigh.com</p>
              <p><strong className="text-slate-300">Site web :</strong> https://www.freelancehigh.com</p>
              <p><strong className="text-slate-300">Année de création :</strong> 2026</p>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mt-4">
              Le directeur de la publication est Lissanon Gildas, en sa qualité de fondateur de FreelanceHigh. Il est joignable à l&apos;adresse email contact@freelancehigh.com.
            </p>
          </section>

          {/* Section 2 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">2. Hébergement</h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Le Site est hébergé par plusieurs prestataires spécialisés, conformément à une architecture distribuée moderne :
            </p>

            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-slate-300 font-semibold mb-3">Frontend (application web)</p>
                <div className="text-sm text-slate-400 space-y-1">
                  <p><strong className="text-slate-300">Hébergeur :</strong> Vercel Inc.</p>
                  <p><strong className="text-slate-300">Siège social :</strong> 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis</p>
                  <p><strong className="text-slate-300">Site web :</strong> https://vercel.com</p>
                  <p><strong className="text-slate-300">Infrastructure :</strong> Edge CDN mondial avec noeuds en Europe, Amérique du Nord, Asie-Pacifique et Afrique (Johannesburg)</p>
                  <p><strong className="text-slate-300">Contact :</strong> privacy@vercel.com</p>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-slate-300 font-semibold mb-3">Backend (API, WebSocket, jobs)</p>
                <div className="text-sm text-slate-400 space-y-1">
                  <p><strong className="text-slate-300">Hébergeur :</strong> Railway Corp.</p>
                  <p><strong className="text-slate-300">Siège social :</strong> San Francisco, CA, États-Unis</p>
                  <p><strong className="text-slate-300">Site web :</strong> https://railway.app</p>
                  <p><strong className="text-slate-300">Région :</strong> EU West (même région que la base de données)</p>
                  <p><strong className="text-slate-300">Contact :</strong> team@railway.app</p>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-slate-300 font-semibold mb-3">Base de données, authentification et stockage de fichiers</p>
                <div className="text-sm text-slate-400 space-y-1">
                  <p><strong className="text-slate-300">Hébergeur :</strong> Supabase Inc.</p>
                  <p><strong className="text-slate-300">Siège social :</strong> Singapore</p>
                  <p><strong className="text-slate-300">Site web :</strong> https://supabase.com</p>
                  <p><strong className="text-slate-300">Région des données :</strong> eu-central-1 (Frankfurt, Allemagne) — <strong>Union européenne</strong></p>
                  <p><strong className="text-slate-300">Type de base :</strong> PostgreSQL 15+</p>
                  <p><strong className="text-slate-300">Services :</strong> PostgreSQL (base de données relationnelle), Supabase Auth (authentification), Supabase Storage (stockage de fichiers privés), Supabase Realtime (mises à jour en temps réel)</p>
                  <p><strong className="text-slate-300">Contact :</strong> support@supabase.io</p>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-slate-300 font-semibold mb-3">Cache et sessions</p>
                <div className="text-sm text-slate-400 space-y-1">
                  <p><strong className="text-slate-300">Hébergeur :</strong> Upstash Inc.</p>
                  <p><strong className="text-slate-300">Site web :</strong> https://upstash.com</p>
                  <p><strong className="text-slate-300">Service :</strong> Redis serverless</p>
                  <p><strong className="text-slate-300">Région :</strong> EU (Frankfurt)</p>
                  <p><strong className="text-slate-300">Usage :</strong> Cache, sessions utilisateurs, rate limiting, broker de jobs</p>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-slate-300 font-semibold mb-3">Images publiques (avatars, photos de services, portfolio)</p>
                <div className="text-sm text-slate-400 space-y-1">
                  <p><strong className="text-slate-300">Hébergeur :</strong> Cloudinary Ltd.</p>
                  <p><strong className="text-slate-300">Site web :</strong> https://cloudinary.com</p>
                  <p><strong className="text-slate-300">Usage :</strong> Hébergement et optimisation automatique des images publiques (avatars, photos de services, portfolio)</p>
                  <p><strong className="text-slate-300">Note :</strong> Aucun document privé (KYC, livrables) n&apos;est stocké sur Cloudinary</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">3. Activité de la Plateforme</h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              FreelanceHigh est une plateforme d&apos;intermédiation en ligne (marketplace) qui met en relation des prestataires de services numériques (freelances et agences) avec des donneurs d&apos;ordres (clients) dans un cadre sécurisé et professionnel.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              La Plateforme n&apos;est pas employeur des freelances ou des membres d&apos;agences inscrits. Elle fournit un espace technique permettant la mise en relation, la gestion de commandes, le paiement sécurisé via escrow et la résolution de litiges. Les contrats de prestation sont conclus directement entre les Utilisateurs.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">
              Le marché principal de FreelanceHigh est l&apos;Afrique francophone, la diaspora africaine et le marché international. La devise de référence est l&apos;euro (EUR), avec conversion automatique vers le FCFA, l&apos;USD, le GBP et le MAD.
            </p>
          </section>

          {/* Section 4 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">4. Propriété intellectuelle</h2>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">4.1 Droits de FreelanceHigh</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              L&apos;ensemble des éléments composant le Site et la Plateforme — code source, architecture technique, design graphique, ergonomie, logos, marques, textes, illustrations, animations, bases de données, fonctionnalités logicielles — sont la propriété exclusive de FreelanceHigh ou font l&apos;objet d&apos;une autorisation d&apos;utilisation.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Ces éléments sont protégés par les lois françaises et internationales relatives à la propriété intellectuelle, notamment le Code de la propriété intellectuelle, le droit d&apos;auteur, le droit des marques et le droit sui generis des bases de données.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Toute reproduction, représentation, modification, publication, adaptation, exploitation totale ou partielle de ces éléments, par quelque procédé que ce soit, est strictement interdite sans l&apos;autorisation écrite préalable de FreelanceHigh. Toute utilisation non autorisée constitue une contrefaçon passible de poursuites judiciaires.
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">4.2 Marques</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Le nom &quot;FreelanceHigh&quot;, le logo FreelanceHigh et le slogan &quot;La plateforme freelance qui élève votre carrière au plus haut niveau&quot; sont des marques de FreelanceHigh. Leur reproduction ou utilisation non autorisée est interdite.
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">4.3 Contenus utilisateurs</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Les contenus publiés par les Utilisateurs (descriptions de services, images de portfolio, avis) restent la propriété de leurs auteurs respectifs. En publiant du contenu sur la Plateforme, l&apos;Utilisateur accorde à FreelanceHigh une licence non exclusive, mondiale et gratuite d&apos;utiliser, reproduire et afficher ce contenu dans le cadre du fonctionnement et de la promotion de la Plateforme. Les conditions détaillées relatives à la propriété intellectuelle des livrables de commandes sont définies dans les <Link href="/cgu" className="text-primary hover:underline">Conditions Générales d&apos;Utilisation</Link> (Article 11).
            </p>
          </section>

          {/* Section 5 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">5. Données personnelles</h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              FreelanceHigh collecte et traite des données personnelles dans le cadre de l&apos;utilisation de sa Plateforme. Le traitement de ces données est conforme au Règlement Général sur la Protection des Données (RGPD — Règlement UE 2016/679) et à la loi Informatique et Libertés du 6 janvier 1978 modifiée.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Le responsable du traitement des données est Lissanon Gildas, en sa qualité de fondateur de FreelanceHigh.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Les données personnelles des Utilisateurs sont principalement stockées sur des serveurs situés au sein de l&apos;Union européenne (Supabase, région eu-central-1 Frankfurt, Allemagne). Les documents sensibles (KYC, livrables de commandes) sont chiffrés au repos et ne sont jamais stockés en dehors de l&apos;UE.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Conformément au RGPD, les Utilisateurs disposent d&apos;un droit d&apos;accès, de rectification, de suppression, de portabilité, d&apos;opposition et de limitation du traitement de leurs données personnelles. Ces droits peuvent être exercés en écrivant à <strong className="text-slate-300">privacy@freelancehigh.com</strong>.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">
              Pour plus de détails sur la collecte, l&apos;utilisation et la protection de vos données, consultez notre <Link href="/confidentialite" className="text-primary hover:underline">Politique de Confidentialité</Link>.
            </p>
          </section>

          {/* Section 6 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">6. Cookies</h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Le Site utilise des cookies et technologies similaires pour son fonctionnement. Les cookies essentiels assurent le bon fonctionnement technique du Site (authentification, sécurité, préférences). Les cookies analytiques (PostHog) et de performance (Sentry) ne sont activés qu&apos;avec votre consentement explicite.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">
              Pour une information complète sur les cookies utilisés, leur finalité, leur durée de conservation et les moyens de les gérer, consultez notre <Link href="/cookies" className="text-primary hover:underline">Politique de Cookies</Link>.
            </p>
          </section>

          {/* Section 7 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">7. Prestataires de paiement</h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Les transactions financières sur la Plateforme sont traitées par les prestataires de paiement suivants :
            </p>
            <div className="space-y-3">
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-slate-300 font-semibold mb-2">Stripe Inc. (paiements internationaux)</p>
                <p className="text-sm text-slate-400">354 Oyster Point Blvd, South San Francisco, CA 94080, USA. Stripe est certifié PCI DSS Niveau 1, le plus haut niveau de certification de sécurité de l&apos;industrie des paiements. Les données de carte bancaire sont traitées exclusivement par Stripe et ne transitent jamais par nos serveurs.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-slate-300 font-semibold mb-2">CinetPay (paiements Mobile Money — Afrique)</p>
                <p className="text-sm text-slate-400">Abidjan, Côte d&apos;Ivoire. CinetPay traite les paiements Mobile Money (Orange Money, Wave, MTN Mobile Money) pour 17 pays d&apos;Afrique francophone. Les données de transaction Mobile Money sont traitées par CinetPay dans un environnement sécurisé.</p>
              </div>
            </div>
          </section>

          {/* Section 8 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">8. Limitation de responsabilité</h2>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">8.1 Disponibilité du service</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              FreelanceHigh s&apos;efforce de maintenir le Site accessible 24 heures sur 24, 7 jours sur 7. Toutefois, l&apos;accès au Site peut être temporairement interrompu pour des raisons de maintenance technique, de mise à jour, de force majeure, ou en raison de défaillances des prestataires d&apos;hébergement. FreelanceHigh ne saurait être tenue responsable des conséquences de ces interruptions.
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">8.2 Contenu du site</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              FreelanceHigh s&apos;efforce de fournir des informations aussi précises et à jour que possible sur le Site. Toutefois, la Plateforme ne saurait être tenue responsable des omissions, inexactitudes ou carences dans la mise à jour des informations, qu&apos;elles soient de son fait ou du fait de tiers partenaires.
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">8.3 Contenus utilisateurs</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              En tant que plateforme d&apos;intermédiation, FreelanceHigh met en relation des prestataires et des clients mais n&apos;est pas partie aux contrats conclus entre eux. La Plateforme n&apos;est pas responsable de la qualité, de la conformité ou de l&apos;exécution des services proposés par les Utilisateurs. Un système de modération, d&apos;évaluations et de résolution de litiges est mis en place pour garantir la qualité des échanges.
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">8.4 Liens hypertextes</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Le Site peut contenir des liens hypertextes vers d&apos;autres sites internet (profils utilisateurs vers LinkedIn, GitHub, etc.). FreelanceHigh n&apos;exerce aucun contrôle sur le contenu de ces sites tiers et décline toute responsabilité quant à leur contenu et aux traitements de données qu&apos;ils effectuent.
            </p>
          </section>

          {/* Section 9 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">9. Droit applicable et juridiction</h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Les présentes mentions légales sont régies par le droit français. En cas de différend, et après tentative de résolution amiable, les tribunaux compétents de Paris, France, seront seuls compétents pour connaître du litige.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">
              Conformément aux dispositions du Code de la consommation concernant le règlement amiable des litiges, FreelanceHigh adhère au Service du Médiateur accessible par voie électronique. Après démarche préalable écrite des consommateurs vis-à-vis de FreelanceHigh, le Service du Médiateur peut être saisi pour tout litige de consommation dont le règlement n&apos;a pas abouti.
            </p>
          </section>

          {/* Section 10 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">10. Signalement de contenus illicites</h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Conformément à l&apos;article 6 de la loi n°2004-575 du 21 juin 2004 pour la Confiance dans l&apos;Économie Numérique (LCEN), toute personne peut signaler un contenu manifestement illicite présent sur la Plateforme en contactant FreelanceHigh à l&apos;adresse :
            </p>
            <div className="bg-white/5 rounded-lg p-4 text-sm text-slate-400">
              <p><strong className="text-slate-300">Email de signalement :</strong> abuse@freelancehigh.com</p>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mt-4">
              Tout signalement doit comporter : la date du signalement, l&apos;identité du notifiant, la description des faits litigieux et leur localisation précise sur le Site, les motifs pour lesquels le contenu doit être retiré (références légales applicables), et une copie de la correspondance adressée à l&apos;auteur ou à l&apos;éditeur des informations litigieuses demandant leur interruption, leur retrait ou leur modification, ou la justification de ce que l&apos;auteur ou l&apos;éditeur n&apos;a pu être contacté.
            </p>
          </section>

          {/* Section 11 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">11. Crédits</h2>

            <div className="text-sm text-slate-400 space-y-3">
              <p><strong className="text-slate-300">Conception et développement :</strong> FreelanceHigh — Lissanon Gildas</p>
              <p><strong className="text-slate-300">Framework frontend :</strong> Next.js 14 (Vercel Inc.)</p>
              <p><strong className="text-slate-300">Composants UI :</strong> shadcn/ui + Radix UI</p>
              <p><strong className="text-slate-300">Icônes :</strong> Material Symbols (Google)</p>
              <p><strong className="text-slate-300">Polices :</strong> Inter (Google Fonts)</p>
              <p><strong className="text-slate-300">Images et illustrations :</strong> Propres à FreelanceHigh ou sous licence libre</p>
            </div>
          </section>

          {/* Section 12 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">12. Contact</h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Pour toute question concernant les présentes mentions légales, vous pouvez nous contacter :
            </p>
            <div className="bg-white/5 rounded-lg p-4 text-sm text-slate-400 space-y-2">
              <p><strong className="text-slate-300">Email général :</strong> contact@freelancehigh.com</p>
              <p><strong className="text-slate-300">Email données personnelles :</strong> privacy@freelancehigh.com</p>
              <p><strong className="text-slate-300">Email signalement :</strong> abuse@freelancehigh.com</p>
              <p><strong className="text-slate-300">Centre d&apos;aide :</strong> <Link href="/aide" className="text-primary hover:underline">https://www.freelancehigh.com/aide</Link></p>
              <p><strong className="text-slate-300">Fondateur :</strong> Lissanon Gildas</p>
            </div>
          </section>

          {/* Section 13 */}
          <section className="bg-neutral-dark rounded-xl border border-border-dark p-8">
            <h2 className="text-xl font-bold text-white mb-4">13. Section Formations</h2>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              En complément de son activité principale de marketplace freelance, FreelanceHigh opère une <strong className="text-slate-300">section Formations</strong> permettant la publication, la commercialisation et le suivi de formations en ligne, de cohortes accompagnées et de produits numériques (e-books, templates, ressources, licences).
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">13.1 Rôle additionnel : Instructeur</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              En plus des rôles de Freelance, Client et Agence, la Plateforme reconnaît le rôle d&apos;<strong className="text-slate-300">Instructeur</strong>, accessible sur candidature et après approbation par l&apos;équipe FreelanceHigh. Les Instructeurs peuvent créer et publier des formations, gérer des cohortes, commercialiser des produits numériques et percevoir 70 % des revenus générés par leurs ventes.
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">13.2 Nature des certificats</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Les certificats de complétion délivrés par la Plateforme FreelanceHigh ont une <strong className="text-slate-300">valeur purement informative</strong>. Ils attestent de la complétion d&apos;un parcours de formation sur la Plateforme mais ne constituent en aucun cas un diplôme reconnu par l&apos;État, une certification professionnelle ou une qualification au sens du Code du travail ou du Code de l&apos;éducation. FreelanceHigh n&apos;est pas un organisme de formation enregistré et ne délivre pas de certifications au sens du Répertoire National des Certifications Professionnelles (RNCP).
            </p>

            <h3 className="text-base font-semibold text-white mt-6 mb-3">13.3 Renvoi aux CGU</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Les conditions détaillées d&apos;utilisation de la section Formations — incluant les modalités de publication, le partage des revenus, l&apos;accès aux formations, les cohortes, les certificats, les produits numériques, la politique de remboursement et les règles d&apos;évaluation — sont définies à l&apos;<Link href="/cgu" className="text-primary hover:underline">Article 24 des Conditions Générales d&apos;Utilisation</Link>.
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
