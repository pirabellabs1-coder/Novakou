import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Clock, CreditCard, FileText, Percent, ShieldCheck, Smartphone, Users, Wallet, type LucideIcon } from "lucide-react";
import { CoquePublique } from "@/components/formations/public/CoquePublique";
import { EnTetePage } from "@/components/formations/public/EnTetePage";
import { BoutonVerre, Coche } from "@/components/formations/public/BoutonVerre";

export const metadata: Metadata = {
  title: "Documentation des paiements",
  description:
    "Comment fonctionnent les paiements sur Novakou : écran de paiement unique, carte bancaire et Mobile Money, séquestre, retraits, commissions, codes promo, order bumps et affiliation. Cadre de sécurité et obligations.",
};

/* Sommaire : les identifiants sont ceux des sections (liens entrants possibles). */
const SUMMARY = [
  { id: "fonctionnement", label: "Comment ça marche" },
  { id: "methodes", label: "Moyens de paiement" },
  { id: "securite", label: "Sécurité & conformité" },
  { id: "sequestre", label: "Séquestre & retraits" },
  { id: "commissions", label: "Commissions & frais" },
  { id: "outils", label: "Promo, order bump, affiliation" },
  { id: "obligations", label: "Vos obligations de vendeur" },
];

/** Section de documentation : carte double-bezel, titre h2 ancré, contenu en prose. */
function Section({ id, icon: Icon, title, children }: { id: string; icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="nkp-card nkp-reveal" aria-labelledby={`${id}-titre`}>
      <div className="nkp-card__core md:!p-8">
        <div className="nkp-feat__top">
          <span className="nkp-ic" aria-hidden="true">
            <Icon strokeWidth={1.75} />
          </span>
          <h2 id={`${id}-titre`} className="!text-[1.35rem]">
            {title}
          </h2>
        </div>
        <div className="nkp-prose nkp-prose--ink !max-w-none text-[.98rem]">{children}</div>
      </div>
    </section>
  );
}

export default function DocumentationPaiementsPage() {
  return (
    <CoquePublique>
      <EnTetePage
        eyebrow="Documentation"
        titre={
          <>
            Les paiements <em>sur Novakou</em>
          </>
        }
        sousTitre="Tout ce qu'il faut savoir pour encaisser en toute sécurité : moyens de paiement, séquestre, retraits, commissions et outils de vente. Un cadre clair, pour vous comme pour vos clients."
        actions={
          <>
            <BoutonVerre href="/inscription?role=vendeur" variante="primary" taille="lg" fleche>
              Commencer à vendre
            </BoutonVerre>
            <BoutonVerre href="/tarifs" taille="lg">
              Voir les tarifs
            </BoutonVerre>
          </>
        }
      >
        <nav aria-label="Sommaire" className="nkp-chips nkp-chips--scroll">
          {SUMMARY.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="nkp-chip">
              {s.label}
            </a>
          ))}
        </nav>
      </EnTetePage>

      <div className="nkp-section nkp-section--tint !pt-12">
        <div className="nkp-wrap nkp-wrap--md flex flex-col gap-6">
          <Section id="fonctionnement" icon={CreditCard} title="Comment fonctionne un paiement">
            <p>
              Novakou n'encaisse jamais l'argent directement sur ses serveurs. Chaque paiement est traité par un <strong>prestataire de paiement agréé</strong>, choisi automatiquement selon le pays et le moyen retenus par le client. Le parcours est le suivant :
            </p>
            <ol>
              <li>Le client clique sur « Payer » depuis votre page de vente ou votre tunnel.</li>
              <li>
                Il arrive sur <strong>l'écran de paiement Novakou</strong> : il choisit son pays, puis son moyen de paiement parmi ceux réellement disponibles chez lui.
              </li>
              <li>En Mobile Money, la demande de paiement part directement sur son téléphone. Par carte, il est redirigé vers une page bancaire sécurisée.</li>
              <li>Une fois le paiement confirmé, le prestataire notifie Novakou de façon sécurisée.</li>
              <li>
                L'accès au produit est débloqué <strong>immédiatement et automatiquement</strong>, un e-mail de confirmation est envoyé, et la vente apparaît dans votre tableau de bord.
              </li>
            </ol>
            <p className="text-[.9rem] !text-[#5c6b62]">Les données bancaires de vos clients ne transitent jamais par Novakou : elles sont saisies uniquement sur l'environnement certifié du prestataire bancaire.</p>
          </Section>

          <Section id="methodes" icon={Smartphone} title="Moyens de paiement acceptés">
            <p>Vos clients peuvent régler avec :</p>
            <div className="nkp-grid-2 !gap-3">
              <div className="rounded-xl bg-[#fbfcfb] p-4 shadow-[inset_0_0_0_1px_#e6ece8]">
                <CreditCard size={18} strokeWidth={1.75} className="text-[#006e2f] mb-2" aria-hidden="true" />
                <b className="block font-semibold text-[.95rem]">Carte bancaire</b>
                <span className="text-[.86rem] text-[#5c6b62]">Visa et Mastercard, en local comme à l'international.</span>
              </div>
              <div className="rounded-xl bg-[#fbfcfb] p-4 shadow-[inset_0_0_0_1px_#e6ece8]">
                <Smartphone size={18} strokeWidth={1.75} className="text-[#006e2f] mb-2" aria-hidden="true" />
                <b className="block font-semibold text-[.95rem]">Mobile Money</b>
                <span className="text-[.86rem] text-[#5c6b62]">Orange Money, Wave, MTN MoMo, Moov et autres opérateurs selon le pays.</span>
              </div>
            </div>
            <p className="text-[.9rem] !text-[#5c6b62]">La liste exacte des opérateurs dépend du pays du client : il le sélectionne au moment de payer et ne voit que les moyens réellement encaissables chez lui — vous n'avez rien à configurer.</p>
          </Section>

          <Section id="securite" icon={ShieldCheck} title="Sécurité & conformité">
            <ul className="nkp-list !pl-0">
              {[
                "Aucune donnée bancaire n'est stockée par Novakou. La saisie se fait exclusivement chez le prestataire bancaire, sur une page chiffrée (SSL).",
                "Chaque notification de paiement est vérifiée par signature cryptographique, puis recontrôlée directement auprès du prestataire avant de débloquer l'accès — impossible de falsifier une vente.",
                "Le montant reçu est comparé au montant attendu à chaque transaction : toute incohérence bloque la commande.",
                "Les accès (retrait de fonds, publication) sont protégés par une vérification d'identité progressive (KYC).",
              ].map((t) => (
                <li key={t} className="!mt-0">
                  <Coche />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="sequestre" icon={Wallet} title="Séquestre, portefeuille & retraits">
            <p>
              Lorsqu'une vente est encaissée, votre part est créditée sur votre <strong>portefeuille Novakou</strong>. Vous suivez à tout moment votre solde disponible et vos revenus totaux depuis votre tableau de bord vendeur.
            </p>
            <div className="flex items-start gap-3 rounded-xl bg-[#f0f6f2] p-4 shadow-[inset_0_0_0_1px_#dfede4]">
              <Clock size={18} strokeWidth={1.75} className="text-[#006e2f] flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="!mt-0 text-[.92rem]">
                <strong>Retraits :</strong> vous demandez un retrait vers votre compte Mobile Money ou bancaire depuis l'onglet Finances. Les demandes sont traitées après un court délai de sécurité. Le versement effectif dépend de l'ouverture des versements dans votre pays.
              </p>
            </div>
            <p className="text-[.9rem] !text-[#5c6b62]">Note : dans certains pays, l'encaissement (achat par vos clients) est déjà actif alors que le versement automatique (payout) vers les vendeurs est en cours d'ouverture. Le solde reste acquis et retirable dès que le canal de versement de votre pays est disponible.</p>
          </Section>

          <Section id="commissions" icon={Percent} title="Commissions & frais">
            <p>Novakou prélève une commission sur chaque vente, selon votre plan d'abonnement. Cette commission couvre l'hébergement, le traitement des paiements et le support. Les frais du processeur de paiement du prestataire peuvent s'appliquer selon le moyen de paiement utilisé par le client.</p>
            <p className="text-[.9rem] !text-[#5c6b62]">
              Le détail exact de votre commission figure sur la page <Link href="/tarifs">Tarifs</Link> et dans votre espace vendeur.
            </p>
          </Section>

          <Section id="outils" icon={Percent} title="Codes promo, order bump & affiliation">
            <div className="flex flex-col gap-4">
              <div>
                <b className="flex items-center gap-2 font-semibold">
                  <Percent size={16} strokeWidth={2} className="text-[#006e2f]" aria-hidden="true" />
                  Codes promotionnels
                </b>
                <p className="!mt-1 text-[.95rem]">
                  Créez des codes de réduction (pourcentage ou montant fixe) depuis <em>Marketing → Codes promo</em>. Le client saisit son code sur la page de paiement ; la remise est appliquée en temps réel avant le règlement.
                </p>
              </div>
              <div>
                <b className="flex items-center gap-2 font-semibold">
                  <CreditCard size={16} strokeWidth={2} className="text-[#006e2f]" aria-hidden="true" />
                  Order bump
                </b>
                <p className="!mt-1 text-[.95rem]">
                  Proposez une offre additionnelle en une case à cocher, directement sur la page de paiement. Configurez-la dans <em>Marketing → Order bumps</em> : elle s'ajoute automatiquement au bloc Paiement de vos tunnels.
                </p>
              </div>
              <div>
                <b className="flex items-center gap-2 font-semibold">
                  <Users size={16} strokeWidth={2} className="text-[#006e2f]" aria-hidden="true" />
                  Affiliation
                </b>
                <p className="!mt-1 text-[.95rem]">Vos affiliés partagent un lien unique. Lorsqu'un client passe par ce lien puis achète, la commission d'affiliation est calculée et enregistrée automatiquement après confirmation du paiement — y compris pour les paiements par carte et Mobile Money.</p>
              </div>
            </div>
          </Section>

          <Section id="obligations" icon={FileText} title="Vos obligations en tant que vendeur">
            <p>En vendant sur Novakou, vous vous engagez à respecter un cadre simple mais essentiel, aussi bien pour votre protection que pour celle de vos clients :</p>
            <ul className="nkp-list !pl-0">
              {[
                "Décrire honnêtement ce que le client obtient (contenu, format, accès, durée) — pas de promesse trompeuse.",
                "Livrer effectivement le produit ou le service payé, et assurer un minimum de support.",
                "Respecter votre politique de remboursement affichée, et traiter les litiges de bonne foi.",
                "Ne vendre que des contenus dont vous détenez les droits, et respecter la législation applicable à votre activité (fiscalité, mentions légales).",
                "Ne jamais demander à un client de payer en dehors de la plateforme : cela vous prive de toute protection et est contraire à nos conditions.",
              ].map((t) => (
                <li key={t} className="!mt-0">
                  <Coche />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-start gap-3 rounded-xl bg-[#faf0eb] p-4 shadow-[inset_0_0_0_1px_#f1dcd1]">
              <AlertTriangle size={18} strokeWidth={1.75} className="text-[#b4552f] flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="!mt-0 text-[.92rem] !text-[#6b3a22]">Novakou fournit l'infrastructure de paiement et de distribution, mais n'est pas responsable du contenu vendu par les créateurs. Chaque vendeur reste seul responsable de la conformité légale et fiscale de son activité.</p>
            </div>
          </Section>

          {/* CTA */}
          <div className="nkp-bezel nkp-bezel--dark nkp-bezel--xl nkp-bezel--float nkp-reveal mt-6">
            <div className="nkp-cta !py-14">
              <span className="nkp-tag nkp-tag--dark">Besoin d'aide ?</span>
              <h2 className="!text-[1.6rem]">Une question sur les paiements ?</h2>
              <p>Notre centre d'aide et notre équipe support sont là pour vous accompagner à chaque étape.</p>
              <div className="nkp-actions">
                <BoutonVerre href="/aide" variante="white" fleche>
                  Centre d'aide
                </BoutonVerre>
                <BoutonVerre href="/contact" variante="white">
                  Nous contacter
                </BoutonVerre>
              </div>
            </div>
          </div>
          <p className="nkp-table-note">
            Ce document est fourni à titre informatif et peut évoluer. Il ne remplace pas nos{" "}
            <Link href="/cgu" className="underline underline-offset-2 hover:text-[#006e2f]">
              conditions générales
            </Link>
            .
          </p>
        </div>
      </div>
    </CoquePublique>
  );
}
