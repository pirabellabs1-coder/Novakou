import type { Metadata } from "next";
import { CoquePublique } from "@/components/formations/public/CoquePublique";
import { EnTetePage } from "@/components/formations/public/EnTetePage";
import { BoutonVerre } from "@/components/formations/public/BoutonVerre";
import { Accordeon } from "@/components/formations/public/Accordeon";
import GuidesFilteredGrid from "./_GuidesFilteredGrid";

export const metadata: Metadata = {
  title: "Guides gratuits pour créateurs africains",
  description:
    "20 guides complets et gratuits pour créer, vendre et automatiser vos formations en ligne en Afrique francophone. De l'idée à la première vente.",
};

/*
 * Index des guides — Server Component. Les données (GUIDES, CATEGORIES,
 * FAQ) restent ici, rendues dès le HTML initial ; le filtre par catégorie
 * vit dans _GuidesFilteredGrid (client).
 */

/* ─── Données des guides ──────────────────────────────────── */
const GUIDES = [
  {
    href: "/guides/page-de-vente-qui-convertit",
    icon: "ads_click",
    time: "16 min",
    level: "Intermédiaire",
    chapters: "10 sections",
    title: "Créer une page de vente qui convertit",
    desc: "Structure, copywriting et exemples : accroche, preuve sociale, offre, garantie, appel à l'action. Le pas-à-pas pour transformer vos visiteurs en acheteurs et brancher le paiement Mobile Money.",
    category: "Vendre",
  },
  {
    href: "/guides/order-bump-upsell-augmenter-panier",
    icon: "trending_up",
    time: "15 min",
    level: "Intermédiaire",
    chapters: "10 sections",
    title: "Order bump, upsell & down-sell : augmenter son panier moyen",
    desc: "Le vrai levier de revenu n'est pas plus de trafic mais un panier plus élevé. Order bump, upsell, down-sell : quoi proposer, à quel prix, et comment le mettre en place dans votre tunnel Novakou.",
    category: "Vendre",
  },
  {
    href: "/guides/vendre-ebook-en-afrique",
    icon: "menu_book",
    time: "15 min",
    level: "Débutant",
    chapters: "10 sections",
    title: "Vendre un ebook en Afrique : de l'écriture à la première vente",
    desc: "Le produit numérique idéal pour débuter : trouver un sujet qui se vend, écrire vite, créer une couverture, fixer son prix en FCFA, publier sur Novakou et encaisser en Mobile Money.",
    category: "Créer",
  },
  {
    href: "/guides/vendre-coaching-en-ligne",
    icon: "psychology",
    time: "16 min",
    level: "Intermédiaire",
    chapters: "10 sections",
    title: "Vendre du coaching en ligne : offres, prix et process",
    desc: "L'offre la plus rentable : définir son accompagnement, fixer un prix premium et le justifier, gérer le process de A à Z (paiement Mobile Money, séances visio, suivi) et monter une offre en escalier.",
    category: "Vendre",
  },
  {
    href: "/guides/abonnement-membership-revenus-recurrents",
    icon: "autorenew",
    time: "16 min",
    level: "Intermédiaire",
    chapters: "10 sections",
    title: "Abonnement & membership : bâtir des revenus récurrents",
    desc: "Le revenu récurrent est le Graal : communauté privée, contenu mensuel, club. Modèles, prix en FCFA, paiements récurrents Mobile Money et surtout la rétention pour ne pas voir vos membres partir.",
    category: "Vendre",
  },
  {
    href: "/guides/lancer-pub-tiktok-produits-digitaux",
    icon: "music_note",
    time: "16 min",
    level: "Intermédiaire",
    chapters: "10 sections",
    title: "Lancer une publicité TikTok pour vendre ses produits digitaux",
    desc: "Créer une pub TikTok qui vend en Afrique : accroche 3 secondes, format natif, ciblage, budget réaliste en FCFA, pixel TikTok et envoi du trafic vers un lien de paiement ou un tunnel Novakou.",
    category: "Promouvoir",
  },
  {
    href: "/guides/installer-pixel-facebook-tiktok",
    icon: "track_changes",
    time: "14 min",
    level: "Intermédiaire",
    chapters: "10 sections",
    title: "Installer un pixel Facebook, TikTok, Snapchat & Pinterest",
    desc: "Le guide complet du pixel de suivi : récupérer son ID sur chaque plateforme, le poser nativement sur toutes ses pages Novakou, suivre les conversions et créer des audiences de reciblage.",
    category: "Promouvoir",
  },
  {
    href: "/guides/moyens-paiement-en-ligne-afrique",
    icon: "account_balance_wallet",
    time: "15 min",
    level: "Débutant",
    chapters: "10 sections",
    title: "Les moyens de paiement en ligne en Afrique : le guide 2026",
    desc: "Mobile Money (Wave, Orange, MTN, Moov), carte bancaire, agrégateurs : le panorama complet des moyens de paiement en Afrique francophone, par pays, et ce qu'il faut accepter pour vendre.",
    category: "Vendre",
  },
  {
    href: "/guides/vendre-partout-avec-lien-de-paiement",
    icon: "link",
    time: "14 min",
    level: "Débutant",
    chapters: "10 sections",
    title: "Vendre partout avec un lien de paiement",
    desc: "L'outil le plus simple pour vendre sur WhatsApp, en bio, dans une pub ou sur votre site : page produit ou paiement direct, redirection après achat et webhook signé pour débloquer l'accès.",
    category: "Vendre",
  },
  {
    href: "/guides/automatiser-sa-boutique",
    icon: "smart_toy",
    time: "15 min",
    level: "Intermédiaire",
    chapters: "10 sections",
    title: "Automatiser sa boutique : workflows, e-mails et relances",
    desc: "Gagner du temps et ne perdre aucune vente : e-mail de bienvenue, relance de panier abandonné, upsell, séquences déclenchées. Mettez en place vos premiers workflows Novakou pas à pas.",
    category: "Automatiser",
  },
  {
    href: "/guides/novakou-fonctionnalites-completes",
    icon: "auto_awesome",
    time: "13 min",
    level: "Complet",
    chapters: "8 sections",
    title: "Toutes les fonctionnalités de Novakou",
    desc: "Boutique, Mobile Money, tunnel de vente, automatisation, affiliation, pixels, escrow, abonnements, IA : le tour complet de la plateforme n°1 de vente de produits numériques en Afrique.",
    category: "Vendre",
  },
  {
    href: "/guides/meilleures-plateformes-vendre-produits-digitaux-afrique",
    icon: "storefront",
    time: "12 min",
    level: "Complet",
    chapters: "7 sections",
    title: "Meilleures plateformes pour vendre des produits digitaux en Afrique",
    desc: "Comparatif 2026 : Mobile Money, frais, tunnel, sécurité. Pourquoi Novakou est la plateforme n°1 pour vendre vos formations et produits numériques en Afrique francophone.",
    category: "Vendre",
  },
  {
    href: "/guides/top-20-produits-digitaux-rentables-2026",
    icon: "lightbulb",
    time: "16 min",
    level: "Débutant",
    chapters: "10 sections",
    title: "Top 20 des produits digitaux rentables à lancer en 2026",
    desc: "20 idées concrètes de produits numériques à lancer en Afrique en 2026, avec fourchettes de prix en FCFA, cible et raison de vente. De l'ebook au coaching en passant par les templates et les prompts IA.",
    category: "Créer",
  },
  {
    href: "/guides/novakou-vs-systeme-io",
    icon: "compare_arrows",
    time: "15 min",
    level: "Complet",
    chapters: "10 sections",
    title: "Novakou vs Systeme.io : lequel choisir en Afrique ?",
    desc: "Comparatif honnête : Mobile Money, frais, tunnel, escrow, automatisation. Systeme.io excelle sur les tunnels mais n'a pas de Mobile Money natif — Novakou réunit tout pour l'Afrique.",
    category: "Vendre",
  },
  {
    href: "/guides/alternative-systeme-io-afrique",
    icon: "swap_horiz",
    time: "14 min",
    level: "Complet",
    chapters: "10 sections",
    title: "La meilleure alternative à Systeme.io en Afrique (Mobile Money)",
    desc: "Pourquoi Systeme.io ne suffit pas en Afrique et ce qu'il faut exiger d'une alternative : Mobile Money, gratuit pour démarrer, tunnel, escrow, automatisation. Comment migrer en 30 secondes.",
    category: "Vendre",
  },
  {
    href: "/guides/creer-produit-numerique-afrique",
    icon: "rocket_launch",
    time: "16 min",
    level: "Débutant",
    chapters: "10 sections",
    title: "Créer son produit numérique en Afrique : le guide complet 2026",
    desc: "De l'idée à la première vente : trouver son idée, choisir le type de produit, le créer au smartphone, fixer son prix en FCFA, publier sur Novakou et vendre en Mobile Money.",
    category: "Créer",
  },
  {
    href: "/guides/meilleures-niches-produits-digitaux-afrique",
    icon: "category",
    time: "15 min",
    level: "Débutant",
    chapters: "10 sections",
    title: "Les 10 meilleures niches pour vendre des produits digitaux en Afrique",
    desc: "Quelle niche choisir pour vendre en ligne ? 10 niches porteuses en Afrique francophone, avec exemples de produits, prix FCFA, cible et canal de promotion.",
    category: "Créer",
  },
  {
    href: "/guides/creer-formation-video-smartphone",
    icon: "videocam",
    time: "16 min",
    level: "Débutant",
    chapters: "10 sections",
    title: "Créer une formation vidéo au smartphone : le guide complet",
    desc: "Filmer une formation vidéo pro avec un simple smartphone : matériel minimal, structure des leçons, tournage, montage gratuit, prix en FCFA et vente sur Novakou.",
    category: "Créer",
  },
  {
    href: "/guides/vendre-avec-mobile-money-guide",
    icon: "smartphone",
    time: "15 min",
    level: "Débutant",
    chapters: "10 sections",
    title: "Vendre en ligne avec le Mobile Money en Afrique",
    desc: "Wave, Orange Money, MTN, Moov : comment accepter le Mobile Money pour vendre vos produits numériques, le parcours d'achat idéal et les erreurs à éviter.",
    category: "Vendre",
  },
  {
    href: "/guides/lancer-pub-facebook-instagram-vendre-boutique",
    icon: "campaign",
    time: "16 min",
    level: "Intermédiaire",
    chapters: "10 sections",
    title: "Lancer une publicité Facebook & Instagram pour vendre sa boutique",
    desc: "Guide pratique pour une pub Meta qui vend en Afrique : pixel, audience, visuel, budget FCFA réaliste, envoi vers un lien de paiement ou un tunnel, et optimisation.",
    category: "Promouvoir",
  },
  {
    href: "/guides/gagner-argent-en-ligne-afrique-2026",
    icon: "savings",
    time: "17 min",
    level: "Débutant",
    chapters: "10 sections",
    title: "Gagner de l'argent en ligne en Afrique en 2026 : le guide réaliste",
    desc: "Les vraies façons de gagner de l'argent en ligne en Afrique en 2026, avec un focus sur la vente de produits numériques : modèles, étapes, exemples FCFA et arnaques à éviter.",
    category: "Gagner",
  },
  {
    href: "/guides/importer-systeme-io",
    icon: "download",
    time: "9 min",
    level: "Débutant",
    chapters: "6 sections",
    title: "Importer son tunnel Systeme.io sur Novakou",
    desc: "Vous venez de Systeme.io ? Collez l'URL de votre tunnel : titre, texte et image sont importés automatiquement en brouillon. Migration en 30 secondes, captures à l'appui.",
    category: "Technique",
  },
  {
    href: "/guides/devenir-affilie-gagner-argent",
    icon: "group",
    time: "8 min",
    level: "Débutant",
    chapters: "7 sections",
    title: "Devenir affilié Novakou : gagner en recommandant",
    desc: "Touchez 40 % de commission sur chaque vente générée, sans rien créer. Lien unique, où le partager, validation 14 j, retrait Mobile Money dès 100 FCFA.",
    category: "Gagner",
  },
  {
    href: "/guides/creer-son-produit",
    icon: "package_2",
    time: "12 min",
    level: "Débutant",
    chapters: "8 étapes",
    title: "Comment créer son premier produit digital",
    desc: "De l'idée à la publication : identifiez votre expertise, structurez votre contenu, produisez avec un smartphone et publiez sur Novakou.",
    category: "Créer",
  },
  {
    href: "/guides/vendre-en-ligne",
    icon: "trending_up",
    time: "15 min",
    level: "Intermédiaire",
    chapters: "12 chapitres",
    title: "Comment vendre ses formations en Afrique",
    desc: "Pages de vente, tunnels, leviers psychologiques, réseaux sociaux, email marketing, affiliation. Toutes les stratégies qui marchent.",
    category: "Vendre",
  },
  {
    href: "/guides/guide-complet-novakou",
    icon: "menu_book",
    time: "20 min",
    level: "Complet",
    chapters: "15 chapitres · 2500+ mots",
    title: "Le guide complet Novakou : de A à Z",
    desc: "De l'inscription à votre première vente. Boutique, paiements, tunnels, IA, emails, affiliation, retraits. Tout est couvert.",
    category: "Technique",
  },
  {
    href: "/guides/trouver-son-idee-de-produit",
    icon: "lightbulb",
    time: "10 min",
    level: "Débutant",
    chapters: "9 sections",
    title: "Comment trouver son idée de produit digital",
    desc: "La méthode des 3 cercles, les niches portantes en Afrique, validation gratuite en 48h — de zéro idée à un concept validé.",
    category: "Créer",
  },
  {
    href: "/guides/publicite-facebook",
    icon: "campaign",
    time: "18 min",
    level: "Avancé",
    chapters: "12 chapitres",
    title: "Publicité Facebook pour vendre en Afrique",
    desc: "Créer des campagnes rentables depuis 2 000 FCFA/jour. Ciblage Afrique francophone, pixel, visuels, optimisation ROAS.",
    category: "Promouvoir",
  },
  {
    href: "/guides/automatisations-novakou",
    icon: "bolt",
    time: "12 min",
    level: "Intermédiaire",
    chapters: "10 chapitres",
    title: "Automatisations Novakou : vendre pendant que vous dormez",
    desc: "Séquences de bienvenue, relance panier, certificats automatiques, upsell post-achat — configurez une fois, encaissez toujours.",
    category: "Automatiser",
  },
  {
    href: "/guides/sequences-emails",
    icon: "mail",
    time: "15 min",
    level: "Intermédiaire",
    chapters: "12 chapitres",
    title: "Séquences emails qui vendent en automatique",
    desc: "Lead magnets, séquence de bienvenue en 5 emails, relances, segmentation. 23 templates email inclus sur Novakou.",
    category: "Automatiser",
  },
  {
    href: "/guides/description-produit",
    icon: "edit_note",
    time: "10 min",
    level: "Débutant",
    chapters: "10 sections",
    title: "Rédiger une description de produit irrésistible",
    desc: "La structure AIDA, transformer vos modules en bénéfices, le titre parfait, la preuve sociale — avec 3 exemples avant/après.",
    category: "Vendre",
  },
  {
    href: "/guides/tunnel-de-vente-novakou",
    icon: "account_tree",
    time: "15 min",
    level: "Intermédiaire",
    chapters: "13 chapitres",
    title: "Tunnel de vente sur Novakou : guide pas-à-pas",
    desc: "Builder drag-and-drop, 30+ blocs, page de capture, page de vente, checkout Mobile Money, upsell, A/B testing.",
    category: "Technique",
  },
  // ───────── 11 NOUVEAUX GUIDES (mai 2026) ─────────
  {
    href: "/guides/mobile-money-encaisser-paiements",
    icon: "payments",
    time: "10 min",
    level: "Débutant",
    chapters: "8 sections",
    title: "Mobile Money : Wave, Orange, MTN, Moov — guide complet",
    desc: "Recevoir vos paiements Mobile Money en Afrique : frais réels, délais, configuration en 3 minutes sur Novakou, retraits.",
    category: "Technique",
  },
  {
    href: "/guides/fixer-prix-formation",
    icon: "sell",
    time: "9 min",
    level: "Débutant",
    chapters: "6 sections",
    title: "Combien faire payer ma formation ? Méthode pricing complète",
    desc: "Tableaux de prix par type de contenu en FCFA. Comment éviter de sous-vendre, justifier un prix premium, prix d'ancrage et upsell.",
    category: "Vendre",
  },
  {
    href: "/guides/whatsapp-business-vendre-formations",
    icon: "chat",
    time: "12 min",
    level: "Débutant",
    chapters: "10 sections",
    title: "WhatsApp Business pour vendre vos formations en Afrique",
    desc: "Status, catalogue, listes diffusion, groupes communauté. Convertir vos contacts WhatsApp en acheteurs sans paraître spam.",
    category: "Promouvoir",
  },
  {
    href: "/guides/instagram-vendre-formations-afrique",
    icon: "photo_camera",
    time: "13 min",
    level: "Intermédiaire",
    chapters: "11 sections",
    title: "Instagram pour vendre vos formations : stratégie organique",
    desc: "Bio optimisée, Reels qui convertissent, DM stratégique, hashtags Afrique francophone. 0 budget pub, résultats en 30 jours.",
    category: "Promouvoir",
  },
  {
    href: "/guides/affiliation-recruter-affilies",
    icon: "group_add",
    time: "11 min",
    level: "Intermédiaire",
    chapters: "9 sections",
    title: "Recruter des affiliés pour démultiplier vos ventes",
    desc: "Construire un programme d'affiliation rentable : commission idéale, recrutement, tracking sur Novakou, gestion des paiements.",
    category: "Vendre",
  },
  {
    href: "/guides/tiktok-reels-vendre-formations",
    icon: "video_library",
    time: "12 min",
    level: "Intermédiaire",
    chapters: "9 sections",
    title: "TikTok & Reels : générer 10 000 vues par vidéo",
    desc: "Hooks qui marchent, format vertical, hashtags Afrique, transformer une vue en clic. Stratégie virale 0 budget.",
    category: "Promouvoir",
  },
  {
    href: "/guides/lancement-30-jours",
    icon: "rocket_launch",
    time: "16 min",
    level: "Intermédiaire",
    chapters: "12 étapes",
    title: "Lancer sa formation en 30 jours : checklist actionnable",
    desc: "Planning jour par jour de l'idée à la 1ère vente. Méthode validée par 100+ créateurs Novakou — 0 capital initial requis.",
    category: "Créer",
  },
  {
    href: "/guides/email-marketing-5-emails-vendent",
    icon: "mark_email_read",
    time: "12 min",
    level: "Intermédiaire",
    chapters: "8 sections",
    title: "Les 5 emails indispensables qui font vendre",
    desc: "Welcome, valeur, autorité, objection, dernier appel — la séquence éprouvée + 5 templates emails complets prêts à copier.",
    category: "Automatiser",
  },
  {
    href: "/guides/linkedin-personal-branding-expert",
    icon: "person",
    time: "14 min",
    level: "Intermédiaire",
    chapters: "10 sections",
    title: "Personal branding LinkedIn pour expert africain",
    desc: "Profil optimisé, 3 posts par semaine qui marchent, DM commercial sans paraître spammy, convertir followers en acheteurs.",
    category: "Promouvoir",
  },
  {
    href: "/guides/vendre-diaspora-africaine",
    icon: "public",
    time: "11 min",
    level: "Avancé",
    chapters: "9 sections",
    title: "Vendre à la diaspora : encaisser en euros depuis l'Afrique",
    desc: "Activer paiement carte international, ciblage Facebook France/Belgique/Canada, communauté diaspora, prix multi-devises.",
    category: "Vendre",
  },
  {
    href: "/guides/scaler-catalogue-produits",
    icon: "inventory_2",
    time: "13 min",
    level: "Avancé",
    chapters: "10 sections",
    title: "Passer de 1 formation à un catalogue complet (10x revenu)",
    desc: "Bundles, abonnements, formations complémentaires, ladder de prix. Multiplier le panier moyen et la lifetime value client.",
    category: "Vendre",
  },
];

const CATEGORIES = ["Tous", "Gagner", "Créer", "Vendre", "Promouvoir", "Automatiser", "Technique"];

const FAQ = [
  {
    q: "Les guides sont-ils vraiment gratuits ?",
    a: "Oui, tous les guides Novakou sont 100 % gratuits et accessibles sans inscription. Ils sont rédigés par notre équipe et mis à jour régulièrement pour rester pertinents.",
  },
  {
    q: "Faut-il être déjà inscrit sur Novakou pour en profiter ?",
    a: "Non. Vous pouvez lire tous les guides sans compte. Pour appliquer les techniques directement sur votre boutique, créez un compte gratuitement en 3 minutes.",
  },
  {
    q: "Par quel guide commencer quand on est débutant ?",
    a: "Commencez par « Comment trouver son idée de produit digital » puis enchaînez avec « Comment créer son premier produit digital ». Ces deux guides en moins de 25 minutes vous donnent une base solide.",
  },
  {
    q: "Les stratégies fonctionnent-elles vraiment en Afrique ?",
    a: "Tous nos guides sont écrits spécifiquement pour le contexte africain : paiement Mobile Money, audiences Facebook francophones, niches porteuses au Sénégal, en Côte d'Ivoire, au Cameroun, etc.",
  },
  {
    q: "Comment être prévenu des nouveaux guides ?",
    a: "Inscrivez-vous sur Novakou (gratuit) et activez les notifications. Chaque nouveau guide vous est envoyé par email dès sa publication.",
  },
];

export default function GuidesIndexPage() {
  return (
    <CoquePublique>
      <EnTetePage
        eyebrow="Ressources gratuites"
        titre={
          <>
            Tous nos guides <em>gratuits</em>
          </>
        }
        sousTitre={`${GUIDES.length} guides complets pour créer, vendre et automatiser vos formations en ligne depuis l'Afrique francophone. Aucune inscription requise — lisez, appliquez, vendez.`}
        actions={
          <>
            <BoutonVerre href="#guides" variante="primary" taille="lg" fleche>
              Parcourir les guides
            </BoutonVerre>
            <BoutonVerre href="/academie" taille="lg">
              Voir l'Académie
            </BoutonVerre>
          </>
        }
        meta={[`${GUIDES.length} guides`, "100 % gratuits", "Écrits pour l'Afrique"]}
      />

      {/* Filtres + grille : composant client pour l'état actif. Le contenu SEO
          (cartes, liens, titres) est dans le HTML initial via les props. */}
      <GuidesFilteredGrid guides={GUIDES} categories={CATEGORIES} />

      {/* ── FAQ ── */}
      <section className="nkp-section" aria-labelledby="faq-titre">
        <div className="nkp-wrap">
          <div className="nkp-head nkp-head--center nkp-reveal">
            <span className="nkp-tag">Questions fréquentes</span>
            <h2 id="faq-titre">Tout ce que vous voulez savoir sur nos guides</h2>
          </div>
          <div className="nkp-reveal">
            <Accordeon items={FAQ} />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="nkp-section nkp-section--top0" aria-labelledby="cta-titre">
        <div className="nkp-wrap">
          <div className="nkp-bezel nkp-bezel--dark nkp-bezel--xl nkp-bezel--float nkp-reveal">
            <div className="nkp-cta">
              <span className="nkp-tag nkp-tag--dark">Passez à l'action</span>
              <h2 id="cta-titre">Prêt à commencer ?</h2>
              <p>Créez votre boutique Novakou gratuitement et mettez en pratique ces guides dès aujourd'hui. Zéro abonnement, 10 % seulement sur vos ventes.</p>
              <div className="nkp-actions">
                <BoutonVerre href="/inscription?role=vendeur" variante="white" taille="lg" fleche>
                  Créer mon compte gratuitement
                </BoutonVerre>
                <BoutonVerre href="/" variante="white" taille="lg">
                  Découvrir Novakou
                </BoutonVerre>
              </div>
            </div>
          </div>
        </div>
      </section>
    </CoquePublique>
  );
}
