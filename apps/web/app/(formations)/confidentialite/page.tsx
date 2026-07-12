import Link from "next/link";

export const metadata = {
  title: "Politique de confidentialité & RGPD — Novakou",
  description:
    "Politique de confidentialité de Novakou : responsable de traitement, données collectées, finalités et bases légales, durées de conservation, sous-traitants, transferts hors UE, cookies, sécurité et vos droits RGPD (accès, rectification, effacement, portabilité, opposition).",
  alternates: { canonical: "/confidentialite" },
};

/* Politique de confidentialité — structure RGPD complète.
   ⚠️ Modèle détaillé rédigé pour être conforme au RGPD (UE 2016/679) ; à faire
   valider par un conseil juridique et à compléter avec les identifiants légaux
   de l'éditeur (cf. /mentions-legales). */

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="scroll-mt-24" id={`s${n}`}>
      <h2 className="text-lg font-bold mb-2 text-[#191c1e]">{n}. {title}</h2>
      <div className="text-[#5c647a] space-y-2">{children}</div>
    </div>
  );
}

export default function ConfidentialitePage() {
  const updated = "12 juillet 2026";
  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <section
        className="py-12 px-6"
        style={{ background: "linear-gradient(135deg, #003d1a 0%, #006e2f 50%, #22c55e 100%)" }}
      >
        <div className="max-w-3xl mx-auto">
          <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-2">Document légal · RGPD</p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white">Politique de confidentialité</h1>
          <p className="text-white/80 text-sm mt-2">Dernière mise à jour : {updated}</p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-7 text-sm leading-relaxed">

          <p className="text-[#5c647a]">
            La présente politique décrit comment Novakou (« Novakou », « la Plateforme », « nous ») collecte,
            utilise, conserve et protège vos données à caractère personnel, conformément au Règlement Général
            sur la Protection des Données (Règlement (UE) 2016/679, « RGPD ») et aux lois applicables en matière
            de protection des données. Elle s&apos;applique à toute personne utilisant la Plateforme — visiteurs,
            apprenants (acheteurs), vendeurs, mentors et affiliés.
          </p>

          <Section n="1" title="Responsable du traitement">
            <p>
              Le responsable du traitement des données collectées via la Plateforme est l&apos;éditeur de Novakou,
              dont l&apos;identité complète figure dans les <Link href="/mentions-legales" className="text-[#006e2f] font-semibold underline">mentions légales</Link>.
              Pour toute question relative à vos données ou à la présente politique, vous pouvez nous contacter à
              l&apos;adresse <strong>privacy@novakou.com</strong>.
            </p>
          </Section>

          <Section n="2" title="Données que nous collectons">
            <p>Selon votre usage de la Plateforme, nous sommes susceptibles de collecter :</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Données d&apos;identification et de compte</strong> : prénom, nom, adresse e-mail, mot de passe (haché), rôle (apprenant, vendeur, mentor, affilié), pays, langue, photo de profil éventuelle.</li>
              <li><strong>Données de contact et de facturation</strong> : adresse e-mail, téléphone (le cas échéant), informations nécessaires à l&apos;émission des factures.</li>
              <li><strong>Données de vérification d&apos;identité (KYC)</strong> — vendeurs, mentors : pièce d&apos;identité, justificatifs, coordonnées de versement (Mobile Money, RIB), nécessaires à la lutte contre la fraude et au versement des gains.</li>
              <li><strong>Données de paiement</strong> : les informations bancaires et de carte sont collectées et traitées directement par nos prestataires de paiement (Moneroo, Stripe). Novakou n&apos;a jamais accès aux numéros complets de carte bancaire.</li>
              <li><strong>Données de transaction</strong> : historique d&apos;achats, ventes, retraits, commissions, litiges.</li>
              <li><strong>Contenu que vous publiez</strong> : formations, produits, descriptions, avis, messages, réponses aux questions.</li>
              <li><strong>Données techniques et d&apos;usage</strong> : adresse IP, type d&apos;appareil et de navigateur, pages consultées, mesures d&apos;audience anonymisées ou pseudonymisées, journaux de sécurité (connexions).</li>
              <li><strong>Cookies et traceurs</strong> : voir notre <Link href="/cookies" className="text-[#006e2f] font-semibold underline">politique cookies</Link>.</li>
            </ul>
          </Section>

          <Section n="3" title="Finalités et bases légales">
            <p>Chaque traitement repose sur une base légale au sens de l&apos;article 6 du RGPD :</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse mt-2 text-[13px]">
                <thead>
                  <tr className="border-b border-gray-200 text-[#191c1e]">
                    <th className="py-2 pr-4 font-bold">Finalité</th>
                    <th className="py-2 font-bold">Base légale</th>
                  </tr>
                </thead>
                <tbody className="align-top">
                  {[
                    ["Créer et gérer votre compte, fournir les services (achats, ventes, mentorat, messagerie)", "Exécution du contrat (art. 6.1.b)"],
                    ["Traiter les paiements, retraits et facturation", "Exécution du contrat / obligation légale (art. 6.1.b et 6.1.c)"],
                    ["Vérification d'identité (KYC), prévention de la fraude et du blanchiment", "Obligation légale / intérêt légitime (art. 6.1.c et 6.1.f)"],
                    ["Envoyer des e-mails transactionnels (confirmations, notifications de commande)", "Exécution du contrat (art. 6.1.b)"],
                    ["Envoyer des communications marketing (newsletter, offres)", "Consentement (art. 6.1.a), révocable à tout moment"],
                    ["Mesure d'audience et amélioration de la Plateforme", "Consentement pour les cookies non essentiels / intérêt légitime pour les mesures agrégées"],
                    ["Sécurité, prévention des abus, gestion des litiges", "Intérêt légitime (art. 6.1.f)"],
                    ["Respecter nos obligations comptables, fiscales et légales", "Obligation légale (art. 6.1.c)"],
                  ].map(([f, b], i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-2 pr-4">{f}</td>
                      <td className="py-2 text-[#191c1e] font-medium">{b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section n="4" title="Durées de conservation">
            <p>Nous ne conservons vos données que le temps strictement nécessaire aux finalités poursuivies :</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Données de compte</strong> : pendant toute la durée de vie du compte, puis supprimées ou anonymisées dans un délai de 30 jours après la suppression du compte.</li>
              <li><strong>Documents comptables et factures</strong> : conservés 10 ans, conformément aux obligations légales.</li>
              <li><strong>Documents KYC</strong> : conservés le temps de la relation puis pendant la durée légale de conservation applicable à la lutte anti-fraude/anti-blanchiment (généralement 5 ans après la fin de la relation).</li>
              <li><strong>Journaux de connexion et de sécurité</strong> : jusqu&apos;à 12 mois.</li>
              <li><strong>Données marketing (prospects)</strong> : jusqu&apos;au retrait du consentement, et au plus 3 ans après le dernier contact.</li>
              <li><strong>Cookies</strong> : durées précisées dans la <Link href="/cookies" className="text-[#006e2f] font-semibold underline">politique cookies</Link> (13 mois maximum pour les traceurs soumis à consentement).</li>
            </ul>
          </Section>

          <Section n="5" title="Destinataires et sous-traitants">
            <p>
              Vos données ne sont <strong>jamais vendues</strong>. Elles sont accessibles aux équipes internes habilitées
              et partagées uniquement avec des sous-traitants techniques, agissant sur nos instructions et liés par des
              engagements de confidentialité et de conformité RGPD :
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Supabase</strong> — hébergement de la base de données, authentification et stockage (région UE, Francfort).</li>
              <li><strong>Vercel</strong> — hébergement et diffusion de l&apos;application web.</li>
              <li><strong>Moneroo</strong> — traitement des paiements et versements Mobile Money.</li>
              <li><strong>Stripe</strong> — traitement des paiements internationaux par carte.</li>
              <li><strong>Resend</strong> — envoi des e-mails transactionnels et marketing.</li>
              <li><strong>Cloudinary</strong> — hébergement et optimisation des images publiques.</li>
              <li><strong>Twilio</strong> — envoi de SMS (codes de vérification, alertes de sécurité).</li>
              <li><strong>PostHog / Sentry</strong> — mesure d&apos;audience et supervision technique (données pseudonymisées).</li>
            </ul>
            <p>
              Le cas échéant, vos données peuvent également être communiquées aux autorités administratives ou judiciaires
              lorsque la loi l&apos;exige.
            </p>
          </Section>

          <Section n="6" title="Transferts hors Union européenne">
            <p>
              Nous privilégions un hébergement dans l&apos;Union européenne (Supabase, région Francfort). Certains
              sous-traitants (par exemple Stripe, Vercel, PostHog) peuvent traiter des données hors de l&apos;UE. Dans ce cas,
              ces transferts sont encadrés par des garanties appropriées au sens du RGPD : décision d&apos;adéquation de la
              Commission européenne, ou clauses contractuelles types (CCT) assorties de mesures de protection
              complémentaires.
            </p>
          </Section>

          <Section n="7" title="Vos droits">
            <p>Conformément au RGPD, vous disposez à tout moment des droits suivants :</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Droit d&apos;accès</strong> — obtenir une copie des données vous concernant.</li>
              <li><strong>Droit de rectification</strong> — corriger des données inexactes ou incomplètes.</li>
              <li><strong>Droit à l&apos;effacement</strong> (« droit à l&apos;oubli ») — sous réserve de nos obligations légales de conservation.</li>
              <li><strong>Droit à la limitation</strong> du traitement.</li>
              <li><strong>Droit d&apos;opposition</strong> au traitement fondé sur l&apos;intérêt légitime, et au démarchage.</li>
              <li><strong>Droit à la portabilité</strong> — recevoir vos données dans un format structuré et lisible par machine.</li>
              <li><strong>Droit de retirer votre consentement</strong> à tout moment, sans effet rétroactif.</li>
              <li><strong>Droit de définir des directives</strong> relatives au sort de vos données après votre décès.</li>
            </ul>
            <p>
              Pour exercer ces droits, écrivez à <strong>privacy@novakou.com</strong> (une preuve d&apos;identité pourra être
              demandée). Nous répondons dans un délai maximum d&apos;un mois. Vous pouvez aussi accéder à une partie de vos
              données et les modifier directement depuis les paramètres de votre compte.
            </p>
          </Section>

          <Section n="8" title="Réclamation auprès d'une autorité de contrôle">
            <p>
              Si vous estimez que le traitement de vos données ne respecte pas la réglementation, vous avez le droit
              d&apos;introduire une réclamation auprès de l&apos;autorité de protection des données compétente (en France,
              la <strong>CNIL</strong> — <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-[#006e2f] font-semibold underline">www.cnil.fr</a>), ou auprès de l&apos;autorité de votre pays de résidence.
            </p>
          </Section>

          <Section n="9" title="Sécurité des données">
            <p>
              Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données :
              chiffrement en transit (TLS), contrôle d&apos;accès par rôle (Row Level Security côté base), hachage des mots de
              passe (bcrypt), double authentification, journalisation des accès sensibles et minimisation des données.
              En cas de violation susceptible d&apos;engendrer un risque élevé pour vos droits, nous vous en informerons
              conformément à l&apos;article 34 du RGPD.
            </p>
          </Section>

          <Section n="10" title="Décisions automatisées et profilage">
            <p>
              Certaines fonctionnalités (recommandations de produits, filtrage anti-fraude, assistance par IA) reposent sur
              des traitements automatisés. Ces traitements n&apos;entraînent pas de décision produisant des effets juridiques
              vous concernant sans intervention humaine. Vous pouvez demander une intervention humaine ou contester une
              décision en nous écrivant à <strong>privacy@novakou.com</strong>.
            </p>
          </Section>

          <Section n="11" title="Protection des mineurs">
            <p>
              La Plateforme n&apos;est pas destinée aux personnes de moins de 15 ans. Un mineur ne peut créer un compte sans le
              consentement du titulaire de l&apos;autorité parentale. Si vous pensez qu&apos;un mineur nous a transmis des données
              sans autorisation, contactez-nous afin que nous procédions à leur suppression.
            </p>
          </Section>

          <Section n="12" title="Rôle des vendeurs (responsabilité conjointe)">
            <p>
              Lorsqu&apos;un vendeur collecte des données de ses propres clients via sa boutique (par exemple pour livrer un
              produit ou assurer un suivi), il agit en qualité de responsable de traitement distinct pour ces finalités et
              doit respecter ses propres obligations RGPD. Novakou fournit les outils, mais n&apos;est pas responsable de
              l&apos;usage que le vendeur fait de ces données au-delà de la fourniture du service.
            </p>
          </Section>

          <Section n="13" title="Modifications de la présente politique">
            <p>
              Cette politique peut évoluer. Toute modification substantielle vous sera notifiée par e-mail ou via la
              Plateforme, avec un préavis raisonnable avant son entrée en vigueur. La date de dernière mise à jour figure
              en haut de ce document.
            </p>
          </Section>

          <div className="pt-4 border-t border-gray-100 text-xs text-[#8a968e]">
            Pour l&apos;identité complète de l&apos;éditeur et de l&apos;hébergeur, consultez les
            {" "}<Link href="/mentions-legales" className="text-[#006e2f] font-semibold underline">mentions légales</Link>.
            Voir aussi nos <Link href="/cgu" className="text-[#006e2f] font-semibold underline">conditions générales d&apos;utilisation</Link>
            {" "}et notre <Link href="/cookies" className="text-[#006e2f] font-semibold underline">politique cookies</Link>.
          </div>
        </div>
      </section>
    </div>
  );
}
