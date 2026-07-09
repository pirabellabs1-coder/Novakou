import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck, CreditCard, Smartphone, Wallet, Clock, Percent,
  Users, Lock, FileText, AlertTriangle, CheckCircle2, ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Documentation des paiements — Novakou",
  description:
    "Comment fonctionnent les paiements sur Novakou : processeur Moneroo, carte bancaire et Mobile Money, séquestre, retraits, commissions, codes promo, order bumps et affiliation. Cadre de sécurité et obligations.",
};

function Section({ id, icon: Icon, title, children }: { id: string; icon: typeof ShieldCheck; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#006e2f]/10 flex items-center justify-center flex-shrink-0">
          <Icon size={20} className="text-[#006e2f]" />
        </div>
        <h2 className="text-xl md:text-2xl font-extrabold text-[#191c1e]">{title}</h2>
      </div>
      <div className="space-y-3 text-[15px] leading-relaxed text-[#3a4250] pl-1">{children}</div>
    </section>
  );
}

const SUMMARY = [
  { id: "fonctionnement", label: "Comment ça marche" },
  { id: "methodes", label: "Moyens de paiement" },
  { id: "securite", label: "Sécurité & conformité" },
  { id: "sequestre", label: "Séquestre & retraits" },
  { id: "commissions", label: "Commissions & frais" },
  { id: "outils", label: "Promo, order bump, affiliation" },
  { id: "obligations", label: "Vos obligations de vendeur" },
];

export default function DocumentationPaiementsPage() {
  return (
    <div className="min-h-screen bg-[#f7f9fb]" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      {/* Hero */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#003d1a] via-[#006e2f] to-[#22c55e]">
        <div aria-hidden className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full opacity-20 blur-3xl bg-white" />
        <div className="relative max-w-4xl mx-auto px-5 md:px-8 py-14 md:py-20 text-center">
          <span className="inline-block text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-200 mb-3">
            Documentation
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            Les paiements sur Novakou
          </h1>
          <p className="text-sm md:text-base text-emerald-50 mt-3 max-w-2xl mx-auto">
            Tout ce qu&apos;il faut savoir pour encaisser en toute sécurité : moyens de paiement,
            séquestre, retraits, commissions et outils de vente. Un cadre clair, pour vous comme pour vos clients.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 md:px-8 py-10 md:py-14">
        {/* Sommaire */}
        <nav className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-10">
          <p className="text-[11px] font-bold text-[#5c647a] uppercase tracking-wider mb-3">Sommaire</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {SUMMARY.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="flex items-center gap-2 text-sm font-semibold text-[#006e2f] hover:underline py-1">
                <ArrowRight size={14} />{s.label}
              </a>
            ))}
          </div>
        </nav>

        <div className="space-y-12">
          <Section id="fonctionnement" icon={CreditCard} title="Comment fonctionne un paiement">
            <p>
              Novakou n&apos;encaisse jamais l&apos;argent directement sur ses serveurs. Chaque paiement est traité par
              <strong> Moneroo</strong>, notre processeur de paiement partenaire, spécialisé sur l&apos;Afrique francophone.
              Le parcours est le suivant :
            </p>
            <ol className="list-decimal pl-5 space-y-1.5">
              <li>Le client clique sur « Payer » depuis votre page de vente ou votre tunnel.</li>
              <li>Il est redirigé vers la <strong>page de paiement sécurisée de Moneroo</strong>, où il saisit ses informations (carte ou Mobile Money).</li>
              <li>Une fois le paiement confirmé, Moneroo notifie Novakou de façon sécurisée.</li>
              <li>L&apos;accès au produit est débloqué <strong>immédiatement et automatiquement</strong>, un e-mail de confirmation est envoyé, et la vente apparaît dans votre tableau de bord.</li>
            </ol>
            <p className="text-sm text-[#5c647a]">
              Les données bancaires de vos clients ne transitent jamais par Novakou : elles sont saisies uniquement
              sur l&apos;environnement certifié de Moneroo.
            </p>
          </Section>

          <Section id="methodes" icon={Smartphone} title="Moyens de paiement acceptés">
            <p>Vos clients peuvent régler avec :</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <CreditCard size={18} className="text-[#006e2f] mb-2" />
                <p className="font-bold text-[#191c1e] text-sm">Carte bancaire</p>
                <p className="text-[13px] text-[#5c647a] mt-0.5">Visa et Mastercard, en local comme à l&apos;international.</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <Smartphone size={18} className="text-[#006e2f] mb-2" />
                <p className="font-bold text-[#191c1e] text-sm">Mobile Money</p>
                <p className="text-[13px] text-[#5c647a] mt-0.5">Orange Money, Wave, MTN MoMo, Moov et autres opérateurs selon le pays.</p>
              </div>
            </div>
            <p className="text-sm text-[#5c647a]">
              La liste exacte des opérateurs dépend du pays du client. C&apos;est Moneroo qui présente les options
              disponibles au moment du paiement — vous n&apos;avez rien à configurer.
            </p>
          </Section>

          <Section id="securite" icon={ShieldCheck} title="Sécurité & conformité">
            <ul className="space-y-2">
              {[
                "Aucune donnée bancaire n'est stockée par Novakou. La saisie se fait exclusivement chez Moneroo, sur une page chiffrée (SSL).",
                "Chaque notification de paiement est vérifiée par signature cryptographique, puis recontrôlée directement auprès de Moneroo avant de débloquer l'accès — impossible de falsifier une vente.",
                "Le montant reçu est comparé au montant attendu à chaque transaction : toute incohérence bloque la commande.",
                "Les accès (retrait de fonds, publication) sont protégés par une vérification d'identité progressive (KYC).",
              ].map((t, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <CheckCircle2 size={17} className="text-[#006e2f] flex-shrink-0 mt-0.5" />
                  <span className="text-[14px]">{t}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="sequestre" icon={Wallet} title="Séquestre, portefeuille & retraits">
            <p>
              Lorsqu&apos;une vente est encaissée, votre part est créditée sur votre <strong>portefeuille Novakou</strong>.
              Vous suivez à tout moment votre solde disponible et vos revenus totaux depuis votre tableau de bord vendeur.
            </p>
            <div className="flex items-start gap-2.5 bg-white rounded-xl border border-gray-100 p-4">
              <Clock size={18} className="text-[#006e2f] flex-shrink-0 mt-0.5" />
              <p className="text-[14px]">
                <strong>Retraits :</strong> vous demandez un retrait vers votre compte Mobile Money ou bancaire depuis
                l&apos;onglet Finances. Les demandes sont traitées après un court délai de sécurité. Le
                versement effectif dépend de l&apos;ouverture des payouts Moneroo dans votre pays.
              </p>
            </div>
            <p className="text-sm text-[#5c647a]">
              Note : dans certains pays, l&apos;encaissement (achat par vos clients) est déjà actif alors que le
              versement automatique (payout) vers les vendeurs est en cours d&apos;ouverture. Le solde reste
              acquis et retirable dès que le canal de versement de votre pays est disponible.
            </p>
          </Section>

          <Section id="commissions" icon={Percent} title="Commissions & frais">
            <p>
              Novakou prélève une commission sur chaque vente, selon votre plan d&apos;abonnement. Cette commission
              couvre l&apos;hébergement, le traitement des paiements et le support. Les frais du processeur de paiement
              (Moneroo) peuvent s&apos;appliquer selon le moyen de paiement utilisé par le client.
            </p>
            <p className="text-sm text-[#5c647a]">
              Le détail exact de votre commission figure sur la page <Link href="/tarifs" className="text-[#006e2f] font-semibold hover:underline">Tarifs</Link> et dans votre espace vendeur.
            </p>
          </Section>

          <Section id="outils" icon={Percent} title="Codes promo, order bump & affiliation">
            <div className="space-y-4">
              <div>
                <p className="font-bold text-[#191c1e] flex items-center gap-2"><Percent size={16} className="text-[#006e2f]" />Codes promotionnels</p>
                <p className="text-[14px] mt-1">
                  Créez des codes de réduction (pourcentage ou montant fixe) depuis <em>Marketing → Codes promo</em>.
                  Le client saisit son code sur la page de paiement ; la remise est appliquée en temps réel avant le règlement.
                </p>
              </div>
              <div>
                <p className="font-bold text-[#191c1e] flex items-center gap-2"><CreditCard size={16} className="text-[#006e2f] rotate-90" />Order bump</p>
                <p className="text-[14px] mt-1">
                  Proposez une offre additionnelle en une case à cocher, directement sur la page de paiement.
                  Configurez-la dans <em>Marketing → Order bumps</em> : elle s&apos;ajoute automatiquement au bloc Paiement de vos tunnels.
                </p>
              </div>
              <div>
                <p className="font-bold text-[#191c1e] flex items-center gap-2"><Users size={16} className="text-[#006e2f] " />Affiliation</p>
                <p className="text-[14px] mt-1">
                  Vos affiliés partagent un lien unique. Lorsqu&apos;un client passe par ce lien puis achète, la
                  commission d&apos;affiliation est calculée et enregistrée automatiquement après confirmation du paiement —
                  y compris pour les paiements par carte et Mobile Money.
                </p>
              </div>
            </div>
          </Section>

          <Section id="obligations" icon={FileText} title="Vos obligations en tant que vendeur">
            <p>
              En vendant sur Novakou, vous vous engagez à respecter un cadre simple mais essentiel, aussi bien pour
              votre protection que pour celle de vos clients :
            </p>
            <ul className="space-y-2">
              {[
                "Décrire honnêtement ce que le client obtient (contenu, format, accès, durée) — pas de promesse trompeuse.",
                "Livrer effectivement le produit ou le service payé, et assurer un minimum de support.",
                "Respecter votre politique de remboursement affichée, et traiter les litiges de bonne foi.",
                "Ne vendre que des contenus dont vous détenez les droits, et respecter la législation applicable à votre activité (fiscalité, mentions légales).",
                "Ne jamais demander à un client de payer en dehors de la plateforme : cela vous prive de toute protection et est contraire à nos conditions.",
              ].map((t, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <CheckCircle2 size={17} className="text-[#006e2f] flex-shrink-0 mt-0.5" />
                  <span className="text-[14px]">{t}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-4 mt-2">
              <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-[14px] text-amber-800">
                Novakou fournit l&apos;infrastructure de paiement et de distribution, mais n&apos;est pas responsable
                du contenu vendu par les créateurs. Chaque vendeur reste seul responsable de la conformité légale et
                fiscale de son activité.
              </p>
            </div>
          </Section>
        </div>

        {/* CTA bas de page */}
        <div className="mt-14 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 text-center">
          <Lock size={24} className="text-[#006e2f] mx-auto mb-3" />
          <h3 className="text-lg font-extrabold text-[#191c1e]">Une question sur les paiements&nbsp;?</h3>
          <p className="text-sm text-[#5c647a] mt-1.5 mb-4 max-w-xl mx-auto">
            Notre centre d&apos;aide et notre équipe support sont là pour vous accompagner à chaque étape.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/aide" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}>
              Centre d&apos;aide <ArrowRight size={16} />
            </Link>
            <Link href="/contact" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-[#006e2f] border border-[#006e2f]/30 hover:bg-[#006e2f]/5">
              Nous contacter
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-[#9aa79f] mt-8">
          Ce document est fourni à titre informatif et peut évoluer. Il ne remplace pas nos{" "}
          <Link href="/cgu" className="underline hover:text-[#006e2f]">conditions générales</Link>.
        </p>
      </main>
    </div>
  );
}
