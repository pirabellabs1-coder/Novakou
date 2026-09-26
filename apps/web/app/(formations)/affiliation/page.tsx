import Link from "next/link";
import {
  BookOpen,
  Globe,
  MessageCircle,
  Percent,
  Share2,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserPlus,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { CoquePublique } from "@/components/formations/public/CoquePublique";
import { EnTetePage } from "@/components/formations/public/EnTetePage";
import { BoutonVerre, Coche } from "@/components/formations/public/BoutonVerre";
import { Accordeon } from "@/components/formations/public/Accordeon";
import { StatsAffiliation } from "@/components/formations/public/StatsAffiliation";
import { SimulateurAffiliation } from "@/components/formations/public/SimulateurAffiliation";
import { CopierLien } from "@/components/formations/public/CopierLien";

/*
 * Page Affiliation — Server Component (métadonnées dans layout.tsx). Les
 * îlots clients : chiffres publics (TanStack Query), calculateur, bouton
 * « Copier », accordéon FAQ. Les liens d'inscription gardent ?role=affilie.
 */

const COMMISSION_PCT = 40;
const COOKIE_DAYS = 30;
const LIEN_EXEMPLE = "https://novakou.com/ref/MONCODE123";

const ETAPES: { icon: LucideIcon; titre: string; desc: string }[] = [
  { icon: Share2, titre: "Partagez votre lien", desc: "Copiez votre lien d'affiliation unique et partagez-le sur vos réseaux sociaux, blog, newsletter ou auprès de votre communauté." },
  { icon: UserPlus, titre: "Quelqu'un s'inscrit", desc: `Un visiteur clique sur votre lien et s'inscrit sur Novakou Formations. Le cookie est valable ${COOKIE_DAYS} jours après son premier clic.` },
  { icon: Trophy, titre: `Vous gagnez ${COMMISSION_PCT} %`, desc: `Dès qu'un achat est réalisé par quelqu'un que vous avez référé, vous recevez automatiquement ${COMMISSION_PCT} % du montant HT de la vente.` },
];

const ATOUTS: { icon: LucideIcon; t: string; d: string }[] = [
  { icon: Wallet, t: "Aucun investissement", d: "Pas de produit, pas de stock, pas de budget publicité requis." },
  { icon: Percent, t: `${COMMISSION_PCT} % de commission`, d: "Sur chaque vente, l'un des taux les plus généreux du marché." },
  { icon: Sparkles, t: "Payé en Mobile Money", d: "Orange Money, Wave, MTN — ou virement bancaire, dès 100 FCFA." },
  { icon: ShieldCheck, t: "Risque zéro", d: "Vous ne payez jamais rien : vous ne faites qu'encaisser." },
];

const PARCOURS = [
  { t: "En validation", d: "Dès la vente, la commission est enregistrée et bloquée 14 jours (fenêtre de remboursement de l'acheteur)." },
  { t: "Validée — retirable", d: "Passé les 14 jours sans remboursement, la commission est garantie et rejoint votre solde." },
  { t: "Payée", d: "Vous demandez un retrait dès 100 FCFA via Mobile Money ou virement, à tout moment." },
];

const QUI = [
  "Créateurs de contenu (TikTok, Instagram, YouTube)",
  "Animateurs de groupes ou communautés WhatsApp",
  "Blogueurs, podcasteurs et newsletters",
  "Étudiants et jeunes entrepreneurs",
  "Coachs, formateurs et consultants",
  "Toute personne avec un réseau qui lui fait confiance",
];

const QUOI = [
  "Formations vidéo (développement, design, marketing…)",
  "Produits digitaux (e-books, templates, presets)",
  "Packs et bundles à prix réduit",
  "Abonnements aux espaces des créateurs",
  "Sessions de mentorat",
];

const CANAUX: { icon: LucideIcon; label: string; desc: string }[] = [
  { icon: MessageCircle, label: "WhatsApp", desc: "Statuts & groupes" },
  { icon: Sparkles, label: "TikTok", desc: "Vidéos courtes" },
  { icon: Share2, label: "Instagram", desc: "Posts & stories" },
  { icon: Globe, label: "Facebook", desc: "Groupes ciblés" },
  { icon: BookOpen, label: "Blog / Email", desc: "Articles & newsletter" },
  { icon: Users, label: "Votre réseau", desc: "Bouche-à-oreille" },
];

const AUTORISE = [
  "Recommander sincèrement ce que vous trouvez utile",
  "Créer du contenu original (avis, démos, tutos) avec votre lien",
  "Partager dans vos groupes et à votre communauté",
  "Donner des conseils honnêtes pour aider à décider",
];

const INTERDIT = [
  "Spammer des inconnus ou des groupes publics",
  "S'acheter à soi-même via son propre lien (détecté & annulé)",
  "Promettre des résultats irréalistes ou mensongers",
  "Usurper la marque Novakou en publicité payante",
];

const FAQS = [
  { q: "Comment et quand suis-je payé ?", a: "Chaque commission est d'abord « en validation » pendant 14 jours (le temps de la période de remboursement de l'acheteur). Passé ce délai, elle devient « validée » et apparaît dans votre solde retirable. Vous pouvez alors demander un retrait à tout moment depuis votre espace affilié → Retraits." },
  { q: "Quelles sont les méthodes de paiement ?", a: "Vous recevez vos commissions via Orange Money, Wave, MTN MoMo ou virement bancaire (SEPA), selon votre pays." },
  { q: "Y a-t-il un montant minimum de retrait ?", a: "Oui, le minimum est de 100 FCFA par retrait. En dessous, votre solde validé reste disponible et continue de s'accumuler." },
  { q: "Que se passe-t-il si l'acheteur se fait rembourser ?", a: "Si une vente que vous avez référée est remboursée pendant les 14 jours de validation, la commission correspondante est annulée. C'est pourquoi nous attendons la fin de cette période avant de rendre vos gains retirables — pour que votre solde validé soit 100 % sûr." },
  { q: "Puis-je être affilié et vendeur en même temps ?", a: "Absolument ! Les deux programmes sont indépendants. Vous pouvez vendre vos propres formations ET recommander celles d'autres vendeurs." },
];

export default function AffiliationPage() {
  return (
    <CoquePublique>
      <EnTetePage
        eyebrow="Programme d'affiliation"
        titre={
          <>
            Gagnez de l'argent en recommandant <em>les produits Novakou</em>
          </>
        }
        sousTitre={
          <>
            Partagez votre lien unique. Touchez <strong className="text-[#0e1512] font-semibold">{COMMISSION_PCT} % de commission</strong> sur chaque vente générée. Sans rien créer, payé via Mobile Money.
          </>
        }
        actions={
          <>
            <BoutonVerre href="/inscription?role=affilie" variante="primary" taille="lg" fleche>
              Démarrer maintenant — c'est gratuit
            </BoutonVerre>
            <BoutonVerre href="#concept" taille="lg">
              Comment ça marche ?
            </BoutonVerre>
          </>
        }
        meta={[`${COMMISSION_PCT} % sur chaque vente`, `Cookie valable ${COOKIE_DAYS} jours`, "Payé en Mobile Money dès 100 FCFA"]}
      />

      {/* ── Chiffres ── */}
      <section className="nkp-section nkp-section--tight" aria-label="Le programme en chiffres">
        <div className="nkp-wrap">
          <StatsAffiliation commissionPct={COMMISSION_PCT} cookieDays={COOKIE_DAYS} />
        </div>
      </section>

      {/* ── Le concept ── */}
      <section id="concept" className="nkp-section" aria-labelledby="concept-titre">
        <div className="nkp-wrap">
          <div className="nkp-duo">
            <div className="nkp-reveal">
              <span className="nkp-tag">Le principe</span>
              <h2 id="concept-titre">Le revenu en ligne le plus simple à démarrer</h2>
              <div className="nkp-prose">
                <p>
                  L'affiliation, c'est recommander un produit qui existe déjà et toucher une commission à chaque fois que quelqu'un l'achète grâce à vous. Chez Novakou, c'est le moyen le plus accessible de générer un premier revenu sur internet : vous n'avez <strong>rien à créer, rien à stocker et rien à avancer</strong>.
                </p>
                <p>
                  Concrètement, vous recevez un <strong>lien unique</strong>. Vous le partagez là où se trouve votre audience — un statut WhatsApp, une vidéo TikTok, un post Instagram, un article de blog. Lorsqu'une personne clique sur ce lien et achète une formation ou un produit digital, Novakou enregistre automatiquement la vente et vous attribue <strong>{COMMISSION_PCT} % du montant</strong>.
                </p>
                <p>
                  Vous n'avez pas besoin d'être expert, ni d'avoir des dizaines de milliers d'abonnés. Beaucoup de nos meilleurs affiliés ont commencé en partageant une formation qui les avait aidés à un petit groupe WhatsApp. Ce qui compte, ce n'est pas la taille de votre audience : c'est la <strong>confiance</strong> que vous lui inspirez.
                </p>
              </div>
              <div className="mt-7">
                <BoutonVerre href="/inscription?role=affilie" variante="primary" fleche>
                  Obtenir mon lien gratuit
                </BoutonVerre>
              </div>
            </div>
            <div className="nkp-bezel nkp-bezel--float nkp-reveal">
              <div className="nkp-core nkp-core--pad">
                <ul className="nkp-list !gap-4">
                  {ATOUTS.map((a) => (
                    <li key={a.t} className="!items-center">
                      <span className="nkp-ic" aria-hidden="true">
                        <a.icon strokeWidth={1.75} />
                      </span>
                      <div>
                        <b className="block font-semibold text-[.98rem]">{a.t}</b>
                        <span className="text-[.88rem] text-[#5c6b62]">{a.d}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Comment ça marche ── */}
      <section className="nkp-section nkp-section--tint" aria-labelledby="etapes-titre">
        <div className="nkp-wrap">
          <div className="nkp-head nkp-reveal">
            <span className="nkp-tag">En pratique</span>
            <h2 id="etapes-titre">De votre lien à votre première commission</h2>
            <p>
              Tout commence par votre lien d'affiliation, généré dès la création de votre compte. Ce lien contient votre code personnel : c'est lui qui permet à Novakou de savoir que la vente vient de vous.
            </p>
          </div>
          <ol className="nkp-steps list-none m-0 p-0">
            {ETAPES.map((e, i) => (
              <li key={e.titre} className="nkp-card nkp-card--hover nkp-step nkp-reveal">
                <div className="nkp-card__core">
                  <span className="nkp-step__n">ÉTAPE 0{i + 1}</span>
                  <span className="nkp-ic" aria-hidden="true">
                    <e.icon strokeWidth={1.75} />
                  </span>
                  <h3>{e.titre}</h3>
                  <p>{e.desc}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="nkp-prose mt-12 nkp-reveal">
            <p>
              Lorsqu'un visiteur clique, un cookie est posé sur son appareil pendant <strong>{COOKIE_DAYS} jours</strong>. Même s'il n'achète pas tout de suite, vous restez crédité de la vente s'il revient acheter dans cette fenêtre. Vous n'avez donc pas besoin de « forcer » l'achat immédiat : une recommandation honnête travaille pour vous pendant un mois.
            </p>
            <p>
              Dès qu'un achat est confirmé, votre commission apparaît dans votre tableau de bord. Vous y suivez en temps réel vos clics, vos ventes, votre taux de conversion et votre solde — de quoi comprendre ce qui marche et ajuster votre stratégie.
            </p>
          </div>
        </div>
      </section>

      {/* ── Paiement ── */}
      <section className="nkp-section" aria-labelledby="paiement-titre">
        <div className="nkp-wrap">
          <div className="nkp-duo nkp-duo--top">
            <div className="nkp-reveal">
              <span className="nkp-tag">Paiement</span>
              <h2 id="paiement-titre">Quand et comment êtes-vous payé ?</h2>
              <div className="nkp-prose">
                <p>La transparence est totale. Chaque commission suit trois étapes claires, et vous voyez à chaque instant où en est votre argent.</p>
                <p>
                  Après une vente, la commission est d'abord <strong>« en validation » pendant 14 jours</strong>. Ce délai correspond à la période durant laquelle l'acheteur peut demander un remboursement. C'est une protection saine : si la vente est annulée, la commission l'est aussi — personne n'est lésé.
                </p>
                <p>
                  Passé ces 14 jours sans remboursement, votre commission devient <strong>validée et 100 % sûre</strong> : elle ne bougera plus. Elle rejoint votre solde retirable. Vous pouvez alors demander un <strong>retrait dès 100 FCFA</strong>, via Orange Money, Wave, MTN MoMo ou virement bancaire, quand vous le souhaitez. Pas d'attente arbitraire, pas de « 1er du mois » : vous décidez.
                </p>
              </div>
            </div>
            <ol className="list-none m-0 p-0 flex flex-col gap-4">
              {PARCOURS.map((s, i) => (
                <li key={s.t} className="nkp-card nkp-reveal">
                  <div className="nkp-card__core !flex-row items-start gap-4 !py-5">
                    <span className="nkp-av !rounded-full" aria-hidden="true">
                      {i + 1}
                    </span>
                    <div>
                      <b className="block font-semibold">{s.t}</b>
                      <p className="nkp-card__desc !mt-1 text-[.9rem]">{s.d}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ── Calculateur ── */}
      <section className="nkp-section nkp-section--tint" aria-labelledby="gains-titre">
        <div className="nkp-wrap">
          <div className="nkp-duo nkp-duo--rev">
            <div className="nkp-bezel nkp-bezel--float nkp-reveal">
              <SimulateurAffiliation commissionPct={COMMISSION_PCT} />
            </div>
            <div className="nkp-reveal">
              <span className="nkp-tag">Vos revenus</span>
              <h2 id="gains-titre">Combien pouvez-vous gagner ?</h2>
              <div className="nkp-prose">
                <p>Vos revenus dépendent de deux choses : le nombre de ventes que vous générez et le prix des produits que vous recommandez. Avec {COMMISSION_PCT} % de commission, les montants montent vite.</p>
                <p>
                  Prenons un exemple concret : vous recommandez une formation à <strong>35 000 FCFA</strong>. Une seule vente vous rapporte <strong>14 000 FCFA</strong>. Dix ventes dans le mois — soit à peine plus de deux par semaine — et vous voilà à <strong>140 000 FCFA</strong>, simplement en ayant partagé un lien à des personnes intéressées.
                </p>
                <p>Il n'y a aucun plafond. Certains affiliés se contentent d'un complément de revenu ; d'autres en font une vraie activité en publiant régulièrement du contenu autour des produits qu'ils aiment. Faites glisser les curseurs pour estimer votre potentiel.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pour qui / quoi ── */}
      <section className="nkp-section" aria-labelledby="pourqui-titre">
        <div className="nkp-wrap">
          <div className="nkp-head nkp-head--center nkp-reveal">
            <span className="nkp-tag">Pour qui ?</span>
            <h2 id="pourqui-titre">Accessible à tous, sur tout le catalogue</h2>
            <p>Pas besoin d'une grande audience ni d'être créateur. Si vous connaissez des personnes susceptibles d'être intéressées, vous pouvez devenir affilié dès aujourd'hui.</p>
          </div>
          <div className="nkp-grid-2">
            <article className="nkp-card nkp-reveal">
              <div className="nkp-card__core">
                <div className="nkp-feat__top">
                  <span className="nkp-ic" aria-hidden="true">
                    <Users strokeWidth={1.75} />
                  </span>
                  <h3>Qui peut devenir affilié ?</h3>
                </div>
                <ul className="nkp-list">
                  {QUI.map((p) => (
                    <li key={p}>
                      <Coche />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
            <article className="nkp-card nkp-reveal">
              <div className="nkp-card__core">
                <div className="nkp-feat__top">
                  <span className="nkp-ic" aria-hidden="true">
                    <BookOpen strokeWidth={1.75} />
                  </span>
                  <h3>Que pouvez-vous promouvoir ?</h3>
                </div>
                <ul className="nkp-list">
                  {QUOI.map((p) => (
                    <li key={p}>
                      <Coche />
                      {p}
                    </li>
                  ))}
                </ul>
                <p className="nkp-card__desc text-[.88rem] mt-5">Choisissez ce qui parle le plus à votre audience : une recommandation pertinente convertit toujours mieux qu'un message générique.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ── Où partager ── */}
      <section className="nkp-section nkp-section--tint" aria-labelledby="strategie-titre">
        <div className="nkp-wrap">
          <div className="nkp-duo">
            <div className="nkp-reveal">
              <span className="nkp-tag">Stratégie</span>
              <h2 id="strategie-titre">Où et comment partager votre lien</h2>
              <div className="nkp-prose">
                <p>
                  La règle d'or : visez la pertinence, pas le volume. <strong>Dix personnes vraiment intéressées valent mieux que mille indifférentes.</strong> Partagez votre lien là où se trouvent des gens concernés par le produit.
                </p>
                <p>
                  En Afrique francophone, <strong>WhatsApp</strong> est de loin le canal le plus efficace : vos statuts et vos groupes touchent des personnes qui vous font déjà confiance. Une courte vidéo <strong>TikTok</strong> ou un <strong>Reel Instagram</strong> qui montre concrètement le problème résolu par la formation peut générer des ventes pendant des semaines.
                </p>
                <p>
                  Pensez aussi aux <strong>groupes Facebook thématiques</strong>, à votre <strong>newsletter</strong> ou à un article de blog : ces formats créent un contenu durable qui continue de travailler pour vous. Dans tous les cas, racontez <em>pourquoi</em> vous recommandez — votre expérience personnelle est votre meilleur argument.
                </p>
              </div>
              <div className="mt-6">
                <Link href="/guides/devenir-affilie-gagner-argent" className="nkp-link">
                  <BookOpen size={16} strokeWidth={2} aria-hidden="true" />
                  Lire le guide complet : devenir affilié et gagner
                </Link>
              </div>
            </div>
            <div className="nkp-grid-2 nkp-grid-2--sm">
              {CANAUX.map((c) => (
                <div key={c.label} className="nkp-card nkp-card--hover nkp-reveal">
                  <div className="nkp-card__core items-center text-center !py-6">
                    <span className="nkp-ic mb-3" aria-hidden="true">
                      <c.icon strokeWidth={1.75} />
                    </span>
                    <b className="font-semibold text-[.95rem]">{c.label}</b>
                    <span className="text-[.8rem] text-[#5c6b62] mt-0.5">{c.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Règles ── */}
      <section className="nkp-section" aria-labelledby="regles-titre">
        <div className="nkp-wrap">
          <div className="nkp-head nkp-head--center nkp-reveal">
            <span className="nkp-tag">Les règles du jeu</span>
            <h2 id="regles-titre">Un programme sain, pour durer</h2>
            <p>Quelques principes simples garantissent un écosystème de confiance — pour vous, pour les acheteurs et pour les créateurs.</p>
          </div>
          <div className="nkp-grid-2">
            <article className="nkp-card nkp-card--tint nkp-reveal">
              <div className="nkp-card__core">
                <div className="nkp-feat__top">
                  <span className="nkp-ck !w-9 !h-9 !rounded-xl !mt-0" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="!w-4 !h-4">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </span>
                  <h3>Autorisé & encouragé</h3>
                </div>
                <ul className="nkp-list">
                  {AUTORISE.map((t) => (
                    <li key={t}>
                      <Coche />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
            <article className="nkp-card nkp-reveal">
              <div className="nkp-card__core">
                <div className="nkp-feat__top">
                  <span className="nkp-ck nkp-ck--no !w-9 !h-9 !rounded-xl !mt-0" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="!w-4 !h-4">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </span>
                  <h3>Strictement interdit</h3>
                </div>
                <ul className="nkp-list">
                  {INTERDIT.map((t) => (
                    <li key={t}>
                      <Coche non />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </div>
          <p className="nkp-table-note nkp-reveal">
            En cas de non-respect, les commissions concernées peuvent être annulées. Détails dans les{" "}
            <Link href="/cgu-affiliation" className="text-[#006e2f] font-semibold underline underline-offset-2">
              conditions du programme
            </Link>
            .
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="nkp-section nkp-section--top0" aria-labelledby="cta-titre">
        <div className="nkp-wrap">
          <div className="nkp-bezel nkp-bezel--dark nkp-bezel--xl nkp-bezel--float nkp-reveal">
            <div className="nkp-cta">
              <span className="nkp-tag nkp-tag--dark">Votre lien d'affiliation (exemple)</span>
              <h2 id="cta-titre">Prêt à gagner vos premières commissions ?</h2>
              <p>Créez votre compte gratuitement et obtenez votre lien d'affiliation unique en moins de 2 minutes.</p>
              <div className="max-w-xl mx-auto mb-7 text-left">
                <CopierLien lien={LIEN_EXEMPLE} />
              </div>
              <div className="nkp-actions">
                <BoutonVerre href="/inscription?role=affilie" variante="white" taille="lg" fleche>
                  Créer mon compte affilié — gratuit
                </BoutonVerre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="nkp-section nkp-section--tint" aria-labelledby="faq-titre">
        <div className="nkp-wrap">
          <div className="nkp-duo nkp-duo--top !gap-12">
            <div className="nkp-reveal">
              <span className="nkp-tag">Questions fréquentes</span>
              <h2 id="faq-titre">Tout ce que vous devez savoir</h2>
              <p className="nkp-prose">
                Une question sans réponse ? Écrivez-nous via la page <Link href="/contact">Contact</Link> — l'équipe Novakou vous répond rapidement.
              </p>
            </div>
            <div className="nkp-reveal">
              <Accordeon items={FAQS} className="!max-w-none" />
            </div>
          </div>
        </div>
      </section>
    </CoquePublique>
  );
}
