import type { Metadata } from "next";
import Link from "next/link";
import { Sora } from "next/font/google";
import { BestSellers } from "@/components/formations/BestSellers";
import HomeClient from "./HomeClient";
import "./home.css";

const sora = Sora({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-sora", display: "swap" });

export const metadata: Metadata = {
  title: "Novakou | Vendre ses formations et produits digitaux en ligne",
  description:
    "Novakou est la plateforme tout-en-un des créateurs : vendez formations, ebooks, coaching et templates. Boutique en ligne, paiements Mobile Money (Wave, Orange, MTN) et carte, tunnels de vente et IA inclus. 10 % de commission, zéro abonnement.",
  keywords: [
    "vendre des formations en ligne",
    "plateforme pour vendre des produits digitaux",
    "créer une boutique en ligne",
    "vendre ebook coaching template",
    "vendre produits digitaux Mobile Money",
    "alternative Gumroad Systeme.io",
    "paiement Wave Orange Money MTN carte",
    "Novakou",
  ],
  alternates: { canonical: "/" },
  category: "business",
  openGraph: {
    title: "Novakou — Vendez vos formations et produits digitaux en ligne",
    description:
      "Boutique en ligne, paiements Mobile Money et carte, tunnels de vente et assistant IA. Lancez-vous en 3 minutes, 10 % de commission, zéro abonnement.",
    url: "/",
    type: "website",
    locale: "fr_FR",
    siteName: "Novakou",
  },
  twitter: {
    card: "summary_large_image",
    title: "Novakou — Vendez vos formations et produits digitaux en ligne",
    description:
      "Boutique, paiements Mobile Money et carte, tunnels de vente et IA inclus. 10 % de commission, zéro abonnement.",
  },
};

// ISR : rendu et mis en cache 5 min (BestSellers = requête Prisma).
export const revalidate = 300;

/* ─── FAQ (source unique : affichage + FAQPage JSON-LD) ───────── */
const FAQ_ITEMS: { q: string; a: string }[] = [
  { q: "Quels pays sont pris en charge pour les retraits ?", a: "Novakou prend en charge les retraits Mobile Money dans la plupart des pays d'Afrique de l'Ouest et centrale — Sénégal, Côte d'Ivoire, Bénin, Togo, Cameroun et bien d'autres. La liste s'agrandit régulièrement." },
  { q: "Dois-je payer un abonnement si je ne fais pas de ventes ?", a: "Non, jamais. Novakou est 100 % gratuit tant que vous ne vendez rien. Nous prélevons uniquement 10 % sur chaque vente réalisée. Si vous ne gagnez rien, vous ne payez rien." },
  { q: "Puis-je héberger mes vidéos directement sur Novakou ?", a: "Oui. Vos vidéos sont hébergées de façon sécurisée sur la plateforme, sans frais supplémentaires. Vos élèves les regardent en streaming, protégées contre le téléchargement." },
  { q: "Est-ce que je peux utiliser mon propre nom de domaine ?", a: "Absolument. Vous pouvez connecter votre nom de domaine personnalisé pour renforcer votre marque, ou utiliser gratuitement votre sous-domaine Novakou." },
  { q: "En combien de temps puis-je retirer mon argent ?", a: "Dès qu'une vente est confirmée, les fonds arrivent sur votre solde. Vous pouvez demander un retrait vers votre compte Mobile Money à tout moment ; il est traité en général sous 24 à 48 heures." },
  { q: "Comment fonctionne l'intelligence artificielle intégrée ?", a: "L'assistant IA vous aide à structurer vos modules, rédiger vos pages de vente et vos e-mails, et répondre automatiquement aux questions de vos élèves grâce à un chatbot de support disponible en continu." },
  { q: "Proposez-vous un accompagnement pour débuter ?", a: "Oui. Des guides gratuits et détaillés couvrent tout le parcours du créateur, de l'idée à la première vente. Notre communauté et notre support vous accompagnent à chaque étape." },
];

const ARROW = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
const CK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>`;

const HTML_TOP = `
<!-- HERO -->
<section class="hero">
  <div class="wrap">
    <div class="inner reveal">
      <span class="tag">★ La plateforme n°1 de vente de produits numériques en Afrique — et dans le monde entier</span>
      <h1>Vendez vos formations et <em>produits digitaux</em> en ligne</h1>
      <p class="hero-sub">Formations, e-books, coaching et templates. Boutique en ligne, paiements Mobile&nbsp;Money (Wave, Orange, MTN), tunnels de vente et assistant IA inclus. Lancez-vous en 3&nbsp;minutes.</p>
      <div class="hero-actions">
        <a href="/inscription?role=vendeur" class="btn btn-green btn-lg">Lancer ma boutique ${ARROW}</a>
        <a href="#nk-simulateur" class="btn btn-line btn-lg">Simuler mes revenus</a>
      </div>
      <div class="hero-meta">
        <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M20 6L9 17l-5-5"/></svg>Zéro abonnement — 10 % par vente</span>
        <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M20 6L9 17l-5-5"/></svg>Paiements Mobile Money &amp; carte</span>
        <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M20 6L9 17l-5-5"/></svg>Boutique prête en 3 minutes</span>
      </div>
    </div>
  </div>
  <div class="dash-wrap">
    <div class="wrap">
      <div class="dash reveal">
        <div class="dash-bar">
          <i></i><i></i><i></i>
          <span class="url"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>novakou.com/aminata/dashboard</span>
        </div>
        <div class="dash-body">
          <aside class="dash-side">
            <div class="ds-item on"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>Tableau de bord</div>
            <div class="ds-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6h15l-1.5 9h-12z"/><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M6 6L5 3H2"/></svg>Commandes</div>
            <div class="ds-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5z"/></svg>Formations</div>
            <div class="ds-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>Paiements</div>
            <div class="ds-sep">IA Studio</div>
            <div class="ds-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.4-.7L3 21l1.8-4.4A8.4 8.4 0 1 1 21 11.5z"/></svg>Chatbots</div>
          </aside>
          <div class="dash-main">
            <div class="dm-head">
              <h3>Bonjour, Aminata</h3>
              <span class="period">30 derniers jours <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg></span>
            </div>
            <div class="kpis">
              <div class="kpi"><div class="l">Revenus</div><div class="v" id="nk-dashRev">412 000 F</div><span class="d">▲ +18 %</span></div>
              <div class="kpi"><div class="l">Ventes</div><div class="v">37</div><span class="d">▲ +12 %</span></div>
              <div class="kpi"><div class="l">Visiteurs</div><div class="v">1 248</div><span class="d">▲ +5 %</span></div>
              <div class="kpi"><div class="l">Conversion</div><div class="v">2,9 %</div><span class="d down">▼ −0,3 pt</span></div>
            </div>
            <div class="dm-grid">
              <div class="panel">
                <div class="pt">Évolution des revenus <small>Semaine par semaine</small></div>
                <div class="chart"><i style="height:34%"></i><i style="height:48%"></i><i style="height:40%"></i><i style="height:58%"></i><i style="height:72%"></i><i class="h" style="height:94%"></i><i style="height:80%"></i></div>
              </div>
              <div class="panel">
                <div class="pt">Ventes récentes <small>Aujourd'hui</small></div>
                <div class="sale"><div class="av">MD</div><div class="m"><b>Mariam D.</b><small>Wave · il y a 12 min</small></div><span class="amt">+ 12 000 F</span></div>
                <div class="sale"><div class="av">OT</div><div class="m"><b>Ousmane T.</b><small>Orange Money · il y a 31 min</small></div><span class="amt">+ 9 500 F</span></div>
                <div class="sale"><div class="av">AS</div><div class="m"><b>Awa S.</b><small>MTN MoMo · il y a 2 h</small></div><span class="amt">+ 35 000 F</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- CONFIANCE -->
<div class="trust">
  <div class="wrap">
    <span class="t-label">Vos clients paient avec leurs moyens de tous les jours</span>
    <div class="t-row">
      <span class="t-chip"><span class="d" style="background:#1DC3F2"></span>Wave</span>
      <span class="t-chip"><span class="d" style="background:#FF6B00"></span>Orange Money</span>
      <span class="t-chip"><span class="d" style="background:#FFCB05"></span>MTN MoMo</span>
      <span class="t-chip"><span class="d" style="background:#0091D0"></span>Moov Money</span>
      <span class="t-chip"><span class="d" style="background:#0E1512"></span>Carte bancaire</span>
    </div>
  </div>
</div>

<!-- ÉTAPES -->
<section class="section">
  <div class="wrap">
    <div class="head center reveal">
      <span class="tag">Comment ça marche</span>
      <h2>De l'idée au revenu en 3 étapes</h2>
      <p>Pas besoin d'être développeur ni marketeur. Concentrez-vous sur votre savoir, Novakou s'occupe du reste.</p>
    </div>
    <div class="steps">
      <div class="step reveal">
        <div class="top"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg></div><span class="n">ÉTAPE 01</span></div>
        <h3>Lancez</h3>
        <p>Créez votre boutique et importez vos formations, e-books ou séances de coaching. L'assistant IA structure vos modules et rédige vos pages de vente.</p>
      </div>
      <div class="step reveal">
        <div class="top"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg></div><span class="n">ÉTAPE 02</span></div>
        <h3>Diffusez</h3>
        <p>Partagez votre lien sur WhatsApp, Instagram ou TikTok. Vos tunnels de vente et relances automatiques transforment les visiteurs en clients.</p>
      </div>
      <div class="step reveal">
        <div class="top"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg></div><span class="n">ÉTAPE 03</span></div>
        <h3>Encaissez</h3>
        <p>Vos clients paient en Mobile Money ou par carte. Vos fonds arrivent sur votre solde et vous les retirez quand vous voulez.</p>
      </div>
    </div>
  </div>
</section>

<!-- FONCTIONNALITÉS -->
<section class="section tint" id="nk-fonctionnalites">
  <div class="wrap">
    <div class="head center reveal">
      <span class="tag">Fonctionnalités</span>
      <h2>Tout ce dont vous avez besoin, réuni</h2>
      <p>Une suite complète pour gérer, vendre et développer votre activité de formation en ligne.</p>
    </div>

    <div class="duo reveal">
      <div class="duo-text">
        <span class="tag">Paiements locaux</span>
        <h2>Encaissez comme vos clients paient vraiment</h2>
        <p>Le Mobile Money est natif sur Novakou, pas un ajout. Vos clients paient en un geste avec le moyen qu'ils utilisent tous les jours.</p>
        <ul class="duo-list">
          <li><span class="ck">${CK}</span>Wave, Orange Money, MTN, Moov et carte bancaire</li>
          <li><span class="ck">${CK}</span>Retraits rapides vers votre compte Mobile Money</li>
          <li><span class="ck">${CK}</span>Transactions sécurisées et traçables</li>
        </ul>
        <a href="#nk-faq" class="duo-link">Voir les pays pris en charge ${ARROW}</a>
      </div>
      <div class="visual">
        <div class="v-head"><b>Paiement sécurisé</b><small>Formation · 15 000 F</small></div>
        <div class="v-body">
          <div class="pay-row on"><div class="b wave">WAVE</div><div class="m"><b>Wave Mobile Money</b><small>Paiement en un geste</small></div><span class="radio"></span></div>
          <div class="pay-row"><div class="b om">OM</div><div class="m"><b>Orange Money</b><small>Code USSD ou application</small></div><span class="radio"></span></div>
          <div class="pay-row"><div class="b mtn">MTN</div><div class="m"><b>MTN MoMo</b><small>Confirmation par SMS</small></div><span class="radio"></span></div>
          <div class="pay-row"><div class="b cb">CB</div><div class="m"><b>Carte bancaire</b><small>Visa, Mastercard</small></div><span class="radio"></span></div>
          <div class="v-cta">Payer 15 000 F</div>
        </div>
      </div>
    </div>

    <div class="duo rev reveal">
      <div class="duo-text">
        <span class="tag">Boutique en ligne</span>
        <h2>Votre vitrine professionnelle, sans une ligne de code</h2>
        <p>Créez une boutique à votre image en quelques clics. Chaque produit dispose de sa page de vente optimisée, pensée pour le mobile — là où sont vos clients.</p>
        <ul class="duo-list">
          <li><span class="ck">${CK}</span>Personnalisation aux couleurs de votre marque</li>
          <li><span class="ck">${CK}</span>Formations, e-books, templates, coaching</li>
          <li><span class="ck">${CK}</span>Hébergement vidéo sécurisé inclus, sans frais</li>
        </ul>
        <a href="/inscription?role=vendeur" class="duo-link">Découvrir la boutique ${ARROW}</a>
      </div>
      <div class="visual">
        <div class="v-head"><b>aminata.novakou.com</b><small>Aperçu boutique</small></div>
        <div class="v-body">
          <div class="shop-hero"><small>Formation phare</small><b>Maîtriser le marketing digital</b><p>De débutant à expert en 6 modules pratiques.</p></div>
          <div class="shop-grid">
            <div class="shop-item"><div class="th a"></div><b>Pack templates Canva</b><small>5 000 F</small></div>
            <div class="shop-item"><div class="th b2"></div><b>E-book : vendre en ligne</b><small>Gratuit</small></div>
          </div>
        </div>
      </div>
    </div>

    <div class="duo reveal">
      <div class="duo-text">
        <span class="tag">IA intégrée</span>
        <h2>Un assistant personnel pour créer plus vite</h2>
        <p>Ne partez plus jamais d'une page blanche. L'IA de Novakou structure vos modules, rédige vos pages de vente et répond aux questions de vos élèves, jour et nuit.</p>
        <ul class="duo-list">
          <li><span class="ck">${CK}</span>Génération de plan de formation complet</li>
          <li><span class="ck">${CK}</span>Copywriting de vos pages de capture</li>
          <li><span class="ck">${CK}</span>Chatbot de support automatique 24 h/24</li>
        </ul>
        <a href="/inscription?role=vendeur" class="duo-link">Essayer l'assistant IA ${ARROW}</a>
      </div>
      <div class="visual">
        <div class="v-head"><b>Novakou IA</b><small>En ligne</small></div>
        <div class="v-body">
          <div class="ai-msg user">Peux-tu me générer un plan pour une formation sur le marketing digital&nbsp;?</div>
          <div class="ai-msg bot"><b>Bien sûr.</b> Voici une structure en 4 modules adaptée à votre marché&nbsp;:
            <ol><li>Fondamentaux et spécificités locales</li><li>Création d'offres irrésistibles</li><li>Publicité à petit budget</li><li>Vente et closing par téléphone</li></ol>
          </div>
          <div class="ai-input"><span>Posez votre question…</span><span class="send"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg></span></div>
        </div>
      </div>
    </div>

    <div class="duo rev reveal">
      <div class="duo-text">
        <span class="tag">Tunnels &amp; automatisations</span>
        <h2>Vendez pendant que vous dormez</h2>
        <p>Pages de capture, upsells, relances des paniers abandonnés&nbsp;: vos tunnels travaillent en continu pour transformer l'intérêt en achats.</p>
        <ul class="duo-list">
          <li><span class="ck">${CK}</span>Tunnels de vente prêts à l'emploi</li>
          <li><span class="ck">${CK}</span>Relances e-mail automatiques</li>
          <li><span class="ck">${CK}</span>Certificats générés pour vos élèves</li>
        </ul>
        <a href="/inscription?role=vendeur" class="duo-link">Explorer les automatisations ${ARROW}</a>
      </div>
      <div class="visual">
        <div class="v-head"><b>Tunnel de vente</b><small>Formation marketing · 30 jours</small></div>
        <div class="v-body">
          <div class="fn">
            <div class="fn-step"><div class="fn-bar f1">Visiteurs<small>1 248</small></div></div>
            <div class="fn-down">↓ 49 %</div>
            <div class="fn-step"><div class="fn-bar f2">Page de capture<small>612</small></div></div>
            <div class="fn-down">↓ 6 %</div>
            <div class="fn-step"><div class="fn-bar f3">Achats<small>37</small></div></div>
            <div class="fn-note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>Relances automatiques&nbsp;: 9 ventes récupérées ce mois-ci</div>
          </div>
        </div>
      </div>
    </div>

    <div class="head center reveal" style="margin-top:104px">
      <h2 style="font-size:clamp(1.6rem,2.8vw,2.1rem)">Et ce n'est pas tout</h2>
      <p>Chaque détail est pensé pour que vous vendiez plus, avec moins d'efforts.</p>
    </div>
    <div class="fgrid">
      <div class="fcard reveal"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg></div><h3>Hébergement vidéo</h3><p>Vos vidéos de formation sont hébergées chez nous, en streaming sécurisé, sans frais supplémentaires.</p></div>
      <div class="fcard reveal"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="6"/><path d="M15.5 13l1.5 8-5-3-5 3 1.5-8"/></svg></div><h3>Certificats</h3><p>Un diplôme est généré automatiquement pour chaque apprenant qui termine votre formation.</p></div>
      <div class="fcard reveal"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></div><h3>Contenus protégés</h3><p>Vos vidéos et documents sont protégés contre le téléchargement et le partage non autorisé.</p></div>
      <div class="fcard reveal"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/></svg></div><h3>Statistiques claires</h3><p>Revenus, ventes, visiteurs, conversion&nbsp;: suivez ce qui compte, sans tableau de bord indigeste.</p></div>
      <div class="fcard reveal"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/></svg></div><h3>100 % mobile</h3><p>Gérez votre activité et vendez depuis votre smartphone. Vos clients achètent depuis le leur.</p></div>
      <div class="fcard reveal"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 6l-10 7L2 6"/><rect x="2" y="4" width="20" height="16" rx="2"/></svg></div><h3>E-mails automatiques</h3><p>Séquences de bienvenue, relances de paniers abandonnés, offres après achat&nbsp;: tout est automatisé.</p></div>
    </div>
  </div>
</section>

<!-- STATS -->
<section class="section deep">
  <div class="wrap">
    <div class="head reveal"><span class="tag on-dark">Novakou en chiffres</span><h2>Une économie de créateurs qui grandit chaque jour</h2></div>
    <div class="stats reveal">
      <div class="stat"><div class="n">1 000<em>+</em></div><p>créateurs actifs sur la plateforme</p></div>
      <div class="stat"><div class="n">10<em>%</em></div><p>de commission, uniquement sur vos ventes</p></div>
      <div class="stat"><div class="n">3<em>min</em></div><p>pour lancer votre boutique, sans code</p></div>
      <div class="stat"><div class="n">24<em>h</em></div><p>délai moyen de retrait de vos fonds</p></div>
    </div>
  </div>
</section>

<!-- SIMULATEUR -->
<section class="section" id="nk-simulateur">
  <div class="wrap">
    <div class="sim-grid">
      <div class="reveal">
        <span class="tag">Simulateur</span>
        <h2 style="font-size:clamp(1.8rem,3.2vw,2.5rem);font-weight:700;letter-spacing:-.03em;margin:20px 0 14px">Mettez un chiffre sur votre potentiel</h2>
        <p style="color:var(--grey);font-size:1.04rem;max-width:430px;margin-bottom:28px">Ajustez la taille de votre audience et le prix de votre produit. Le calcul repose sur un taux de conversion prudent de 1&nbsp;% — beaucoup de créateurs font mieux.</p>
        <a href="/inscription?role=vendeur" class="btn btn-green btn-lg">Créer ma boutique gratuitement ${ARROW}</a>
      </div>
      <div class="sim-panel reveal">
        <div class="sim-row"><div class="top"><label for="nk-aud">Taille de votre audience</label><span class="val" id="nk-audVal">5 000 contacts</span></div><input type="range" id="nk-aud" min="500" max="50000" step="500" value="5000"></div>
        <div class="sim-row"><div class="top"><label for="nk-price">Prix de votre produit</label><span class="val" id="nk-priceVal">15 000 FCFA</span></div><input type="range" id="nk-price" min="2000" max="200000" step="1000" value="15000"></div>
        <div class="sim-out"><div class="lbl">Revenu estimé par mois</div><div class="big" id="nk-simOut">750 000 FCFA</div><div class="net">soit <b id="nk-simNet">675 000 FCFA</b> pour vous, après la commission de 10 %.</div></div>
      </div>
    </div>
  </div>
</section>
`;

const HTML_BOTTOM = `
<!-- TÉMOIGNAGES -->
<section class="section">
  <div class="wrap">
    <div class="head center reveal"><span class="tag">Ils utilisent Novakou</span><h2>Rejoignez l'élite des créateurs</h2><p>Des milliers de créateurs transforment leur savoir en revenus. Voici leurs mots.</p></div>
    <div class="quotes">
      <div class="quote reveal"><div class="stars">★★★★★</div><p>«&nbsp;Avant Novakou, je perdais des ventes&nbsp;: mes clients ne pouvaient pas payer par carte. Depuis que j'encaisse en Mobile Money, je touche un public bien plus large.&nbsp;»</p><div class="who"><div class="av">FD</div><div><b>Fatou D.</b><small>Coach business · Dakar</small></div></div></div>
      <div class="quote reveal"><div class="stars">★★★★★</div><p>«&nbsp;L'assistant IA est incroyable. Il m'a aidé à structurer ma formation en quelques minutes, sans aucune compétence technique. La plateforme est super intuitive.&nbsp;»</p><div class="who"><div class="av">MK</div><div><b>Marc K.</b><small>Formateur design · Abidjan</small></div></div></div>
      <div class="quote reveal"><div class="stars">★★★★★</div><p>«&nbsp;Aucun abonnement fixe à payer&nbsp;: on ne paie que si on vend. Un vrai soulagement quand on se lance. C'est le modèle parfait pour se lancer.&nbsp;»</p><div class="who"><div class="av">SL</div><div><b>Sarah L.</b><small>Créatrice e-commerce · Lomé</small></div></div></div>
    </div>
  </div>
</section>

<!-- AFFILIATION & MENTORAT -->
<section class="section" style="padding-top:0">
  <div class="wrap">
    <div class="head center reveal"><span class="tag">Allez plus loin</span><h2>Deux façons de gagner plus avec Novakou</h2><p>Recommandez la plateforme ou faites-vous accompagner par ceux qui ont déjà réussi.</p></div>
    <div class="earn">
      <div class="earn-card a reveal">
        <span class="earn-badge">%</span>
        <span class="tag on-dark">Affiliation</span>
        <h3>Gagnez en recommandant Novakou</h3>
        <p>Partagez votre lien d'affilié et touchez une commission sur les ventes des créateurs que vous parrainez. Même sans produit à vendre.</p>
        <ul class="earn-list">
          <li><span class="ck">${CK}</span>Lien de parrainage unique, suivi en temps réel</li>
          <li><span class="ck">${CK}</span>Commissions versées sur votre solde Novakou</li>
          <li><span class="ck">${CK}</span>Retraits en Mobile Money, comme vos ventes</li>
        </ul>
        <div class="actions"><a href="/inscription?role=affilie" class="btn btn-white">Devenir affilié</a></div>
      </div>
      <div class="earn-card b reveal">
        <span class="earn-badge">1:1</span>
        <span class="tag">Mentorat</span>
        <h3>Apprenez de ceux qui vendent déjà</h3>
        <p>Réservez des sessions avec des créateurs expérimentés de la communauté&nbsp;: stratégie, pricing, contenu, publicité. Des conseils qui viennent du terrain.</p>
        <ul class="earn-list">
          <li><span class="ck">${CK}</span>Sessions individuelles en visio ou par téléphone</li>
          <li><span class="ck">${CK}</span>Mentors vérifiés, notés par la communauté</li>
          <li><span class="ck">${CK}</span>Vous êtes expérimenté&nbsp;? Devenez mentor et facturez vos sessions</li>
        </ul>
        <div class="actions"><a href="/mentors" class="btn btn-green">Trouver un mentor</a></div>
      </div>
    </div>
  </div>
</section>

<!-- TARIFS -->
<section class="section tint" id="nk-tarifs">
  <div class="wrap">
    <div class="pricing">
      <div class="price-side reveal">
        <span class="tag">Tarification</span>
        <h2>Simple, transparent, équitable</h2>
        <p>Un seul modèle&nbsp;: vous ne payez que lorsque vous gagnez. Pas de surprise, pas de frais cachés, pas d'engagement.</p>
        <div class="cmp"><span class="ic no"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6L6 18M6 6l12 12"/></svg></span>Aucun abonnement mensuel</div>
        <div class="cmp"><span class="ic no"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6L6 18M6 6l12 12"/></svg></span>Aucuns frais d'installation</div>
        <div class="cmp"><span class="ic yes">${CK}</span>Vous gardez 90 % de chaque vente</div>
        <div class="cmp"><span class="ic yes">${CK}</span>Toutes les fonctionnalités incluses, dès le départ</div>
      </div>
      <div class="price-box reveal">
        <span class="tag on-dark">Modèle gagnant-gagnant</span>
        <div class="amount"><span class="n">10 %</span><span class="u">par vente, c'est tout</span></div>
        <div class="sub">Prélevés uniquement sur vos ventes réalisées. Zéro vente, zéro frais.</div>
        <ul class="plist">
          <li><span class="ck">${CK}</span>Boutique et produits illimités</li>
          <li><span class="ck">${CK}</span>Paiements Mobile Money &amp; carte</li>
          <li><span class="ck">${CK}</span>Assistant IA &amp; hébergement vidéo inclus</li>
          <li><span class="ck">${CK}</span>Tunnels, automatisations &amp; certificats</li>
        </ul>
        <a href="/inscription?role=vendeur" class="btn btn-white" style="width:100%">Commencer gratuitement</a>
      </div>
    </div>
    <div class="compare-card reveal">
      <div class="compare-scroll">
      <table class="compare-table">
        <thead><tr><th></th><th class="nova">Novakou</th><th>Plateformes internationales</th><th>Site sur mesure</th></tr></thead>
        <tbody>
          <tr><td>Abonnement mensuel</td><td class="nova ok">0 F</td><td class="ko">20 000 à 60 000 F</td><td class="mid">Hébergement à payer</td></tr>
          <tr><td>Paiement Mobile Money natif</td><td class="nova ok">✓ Inclus</td><td class="ko">✕ Rarement</td><td class="mid">À développer</td></tr>
          <tr><td>Assistant IA en français</td><td class="nova ok">✓ Inclus</td><td class="mid">Option payante</td><td class="ko">✕ Non</td></tr>
          <tr><td>Temps de mise en ligne</td><td class="nova ok">3 minutes</td><td class="mid">Quelques heures</td><td class="ko">Plusieurs semaines</td></tr>
          <tr><td>Compétences techniques</td><td class="nova ok">Aucune</td><td class="mid">Basiques</td><td class="ko">Développeur requis</td></tr>
        </tbody>
      </table>
      </div>
    </div>
    <p class="compare-note">Comparaison indicative basée sur les offres standards du marché.</p>
  </div>
</section>

<!-- FAQ -->
<section class="section" id="nk-faq">
  <div class="wrap">
    <div class="head center reveal"><span class="tag">Questions fréquentes</span><h2>On vous dit tout</h2></div>
    <div class="faq reveal">
      ${FAQ_ITEMS.map((f) => `
      <div class="faq-item">
        <button class="faq-q" type="button">${f.q}<span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg></span></button>
        <div class="faq-a"><p>${f.a}</p></div>
      </div>`).join("")}
    </div>
  </div>
</section>

<!-- GUIDES -->
<section class="section tint" id="nk-guides">
  <div class="wrap">
    <div class="head center reveal"><span class="tag">Ressources gratuites</span><h2>Apprenez à vendre en ligne</h2><p>Créer, vendre, automatiser&nbsp;: nos guides détaillés couvrent tout le parcours du créateur, de l'idée à la première vente.</p></div>
    <div class="guides">
      <div class="guide reveal">
        <div class="gcov g1"><span class="time">10 min</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg></div>
        <div class="guide-body"><span class="lvl">Débutant · 8 étapes</span><h3>Créer son premier produit digital</h3><p>De l'idée à la publication&nbsp;: identifier votre expertise, structurer votre contenu et publier sur Novakou, depuis un smartphone.</p><a href="/guides" class="duo-link">Lire le guide ${ARROW}</a></div>
      </div>
      <div class="guide reveal">
        <div class="gcov g2"><span class="time">15 min</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/></svg></div>
        <div class="guide-body"><span class="lvl">Intermédiaire · 12 chapitres</span><h3>Vendre ses formations en Afrique</h3><p>Pages de vente, tunnels, leviers psychologiques, réseaux sociaux, e-mail marketing, affiliation&nbsp;: toutes les stratégies qui marchent.</p><a href="/guides" class="duo-link">Lire le guide ${ARROW}</a></div>
      </div>
      <div class="guide reveal">
        <div class="gcov g3"><span class="time">30 min</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5z"/><path d="M8 7h8M8 11h6"/></svg></div>
        <div class="guide-body"><span class="lvl">Complet · 18 chapitres</span><h3>Le guide complet Novakou : de A à Z</h3><p>De l'inscription à votre première vente&nbsp;: boutique, paiements, tunnels, IA, e-mails, affiliation, retraits. Tout est couvert.</p><a href="/guides" class="duo-link">Lire le guide ${ARROW}</a></div>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="section" style="padding-top:16px">
  <div class="wrap">
    <div class="cta reveal">
      <span class="tag on-dark">Prêt à vous lancer&nbsp;?</span>
      <h2>Prêt à monétiser votre expertise&nbsp;?</h2>
      <p>Rejoignez plus de 1 000 créateurs qui vivent de leur passion grâce à Novakou.</p>
      <div class="actions"><a href="/inscription?role=vendeur" class="btn btn-white btn-lg">Créer mon compte gratuitement ${ARROW}</a></div>
      <small class="note">Gratuit tant que vous ne vendez pas · Sans carte bancaire · Prêt en 3 minutes</small>
    </div>
  </div>
</section>
`;

export default function FormationsPage() {
  return (
    <div className={`nkhome ${sora.variable}`}>
      {/* Sans JS : on désactive l'animation reveal pour ne jamais masquer le contenu. */}
      <noscript>
        {/* eslint-disable-next-line react/no-danger */}
        <style dangerouslySetInnerHTML={{ __html: ".nkhome .reveal{opacity:1 !important;transform:none !important}" }} />
      </noscript>

      {/* FAQPage JSON-LD — rich results Google + moteurs génératifs (GEO). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ_ITEMS.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />

      {/* Hero → simulateur (HTML statique, enrichi côté client par HomeClient). */}
      <div dangerouslySetInnerHTML={{ __html: HTML_TOP }} />

      {/* MARKETPLACE — vraies cartes produits (BestSellers, données réelles). */}
      <section className="section tint" id="nk-marketplace">
        <div className="wrap wrap-lg">
          <div className="head center reveal">
            <span className="tag">Déjà en vente</span>
            <h2>Les best-sellers du moment</h2>
            <p>Des créateurs comme vous génèrent des revenus chaque jour sur Novakou.</p>
          </div>
          <div className="mkt-bleed">
            <BestSellers />
          </div>
          <div className="center-btn reveal">
            <Link href="/explorer" className="btn btn-line">
              Explorer la marketplace
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Témoignages → CTA (HTML statique). */}
      <div dangerouslySetInnerHTML={{ __html: HTML_BOTTOM }} />

      <HomeClient />
    </div>
  );
}
