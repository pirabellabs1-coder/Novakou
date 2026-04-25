"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

/* ─── Palette ─────────────────────────────────────────────── */
const C = {
  primary: "#006e2f",
  accent: "#22c55e",
  dark: "#191c1e",
  muted: "#5c647a",
  surface: "#f6fbf2",
  surfaceLow: "#f0f5ec",
  surfaceHigh: "#e5eae1",
  outlineVariant: "#becabc",
} as const;

const S: React.CSSProperties = {
  fontFamily: "'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};
const SH: React.CSSProperties = { ...S, fontWeight: 700, letterSpacing: "-0.04em" };

/* ─── Data ─────────────────────────────────────────────────── */
const TABS = [
  {
    id: "boutique",
    icon: "storefront",
    label: "Boutique",
    color: C.primary,
    headline: "Votre boutique en ligne en 3 minutes",
    sub: "Publiez vos formations, ebooks, templates et coaching sur une vitrine professionnelle clé en main. Aucune connaissance technique requise — votre boutique est active dès que vous créez votre compte, avec votre branding, vos couleurs et votre domaine personnalisé.",
    features: [
      { icon: "palette", title: "Design 100% personnalisable", desc: "Couleurs, logo, polices, bannière, palette de couleurs — tout reflète votre marque, pas la nôtre. Chaque créateur a une boutique unique qui renforce son image professionnelle auprès de ses clients." },
      { icon: "devices", title: "100% responsive mobile", desc: "Expérience parfaite sur smartphone Android ou iPhone, tablette et desktop. Votre boutique est conçue pour le mobile dès le départ." },
      { icon: "search", title: "SEO automatique intégré", desc: "Balises meta générées automatiquement, URLs propres et lisibles, sitemap dynamique soumis à Google, schema.org pour les produits. Votre boutique se positionne naturellement dans les résultats de recherche sans effort technique de votre part." },
      { icon: "link", title: "Domaine personnalisé gratuit", desc: "Connectez votre propre nom de domaine (monsite.com) en quelques clics pour une image 100% professionnelle. Fini les URLs génériques — votre marque s'affiche partout." },
      { icon: "category", title: "Catalogue organisé intelligemment", desc: "Catégories hiérarchisées, filtres avancés par prix, type, niveau, recherche interne en temps réel. Vos clients trouvent le bon produit en moins de 2 clics, ce qui augmente vos conversions." },
      { icon: "star_rate", title: "Avis vérifiés authentiques", desc: "Collectez des avis certifiés uniquement de vrais acheteurs, répondez publiquement, signalez les abusifs. La preuve sociale est le levier #1 de conversion — Novakou l'intègre au cœur de votre boutique." },
    ],
    mockup: {
      title: "Aperçu de boutique",
      accent: C.primary,
      items: [
        { label: "Marketing Digital", price: "25 000 F", badge: "⭐ 4.9", color: "#006e2f" },
        { label: "Excel Avancé", price: "15 000 F", badge: "Nouveau", color: "#2563eb" },
        { label: "Pack Templates Canva", price: "8 000 F", badge: "Best-seller", color: "#7c3aed" },
      ],
    },
  },
  {
    id: "tunnels",
    icon: "account_tree",
    label: "Tunnels de vente",
    color: "#7c3aed",
    headline: "Des tunnels qui convertissent à chaque clic",
    sub: "Builder visuel drag-and-drop avec 30+ blocs prêts à l'emploi, génération automatique par IA et templates optimisés pour le marché africain. Construisez des pages de vente professionnelles qui guident chaque visiteur vers l'achat, sans coder une seule ligne.",
    features: [
      { icon: "drag_indicator", title: "Éditeur drag-and-drop fluide", desc: "Glissez, déposez, réorganisez chaque bloc en temps réel. Hero, témoignages, compteur d'urgence, FAQ, bouton de paiement — tout se configure visuellement. Le résultat est professionnel, que vous soyez débutant ou expert." },
      { icon: "auto_awesome", title: "Génération IA complète en 30 secondes", desc: "Décrivez votre produit en 2 phrases, l'IA génère un tunnel complet avec titre accrocheur, description de vente, sections structurées et appels à l'action optimisés. Basé sur des données de conversion du marché africain." },
      { icon: "timer", title: "Compteurs d'urgence par visiteur", desc: "Countdown unique par visiteur (pas partagé), alertes de rareté, offres limitées dans le temps avec remise automatique. Ces leviers de conversion sont responsables de 25% à 40% des ventes sur les tunnels bien configurés." },
      { icon: "trending_up", title: "Upsell & order bumps natifs", desc: "Augmentez votre panier moyen avec des offres complémentaires affichées au bon moment : order bump sur la page de paiement (+25% de panier moyen), upsell post-achat quand l'enthousiasme est au maximum." },
      { icon: "compare", title: "Tableaux comparatifs intégrés", desc: "Montrez clairement pourquoi votre offre est le meilleur choix : comparaison avec la concurrence, différences entre vos forfaits, tableau des bénéfices inclus. Les acheteurs informés convertissent 3× plus." },
      { icon: "analytics", title: "A/B testing automatisé", desc: "Testez deux versions de votre tunnel (titre, couleur du bouton, image, prix) sur des audiences divisées automatiquement. Novakou garde la version gagnante et pause l'autre. Aucune stat à lire, le système décide pour vous." },
    ],
    mockup: {
      title: "Éditeur de tunnel",
      accent: "#7c3aed",
      blocks: ["🎯  Hero — Titre accrocheur", "📦  Produit — Description + prix", "⭐  Témoignages clients", "⏱️  Countdown urgence", "🛒  Bouton CTA principal"],
    },
  },
  {
    id: "paiements",
    icon: "account_balance_wallet",
    label: "Paiements",
    color: "#f59e0b",
    headline: "Encaissez partout en Afrique et dans le monde",
    sub: "Orange Money, Wave, MTN MoMo, Moov Money, cartes Visa / Mastercard, PayPal, virement SEPA. Vos clients paient avec le moyen qu'ils utilisent au quotidien — aucune friction, maximum de conversions.",
    features: [
      { icon: "phone_android", title: "Mobile Money intégré nativement", desc: "Intégration native Orange Money, Wave, MTN MoMo, Moov, M-Pesa. Novakou est la seule plateforme à les proposer tous sans configuration supplémentaire." },
      { icon: "credit_card", title: "Cartes & paiements internationaux", desc: "Visa, Mastercard, SEPA, PayPal, Apple Pay. Parfait pour la diaspora africaine en France, Belgique, Canada et les clients internationaux qui veulent suivre une formation de votre catalogue. Paiement en 3× disponible pour les formations > 30 000 FCFA." },
      { icon: "lock", title: "Sécurité bancaire SSL/TLS", desc: "Chaque transaction est chiffrée avec les standards bancaires SSL/TLS. Conformité PCI DSS pour les paiements par carte. Vos clients voient le cadenas de sécurité et achètent en toute confiance — les taux d'abandon au checkout sont réduits de 40%." },
      { icon: "receipt_long", title: "Factures PDF automatiques conformes", desc: "Chaque vente génère et envoie automatiquement une facture PDF professionnelle à l'acheteur : numéro de facture, TVA si applicable, détail de la commande, coordonnées du vendeur. Aucun travail administratif pour vous." },
      { icon: "speed", title: "Retraits rapides sous 24-48h", desc: "Demandez un retrait depuis votre tableau de bord, recevez votre argent sous 24h sur Mobile Money ou sous 48h sur compte bancaire. Pas de seuil minimum abusif — retirez dès 5 000 FCFA." },
      { icon: "public", title: "Afrique francophone + international", desc: "Couverture Mobile Money dans plusieurs pays africains : Sénégal, Côte d'Ivoire, Cameroun, Togo, Bénin, Mali, Burkina Faso et plus. L'international via Stripe." },
    ],
    mockup: {
      title: "Passerelle de paiement",
      accent: "#f59e0b",
      methods: [
        { name: "Wave", color: "#1e88e5", selected: true },
        { name: "Orange Money", color: "#f97316", selected: false },
        { name: "MTN MoMo", color: "#fbbf24", selected: false },
        { name: "Carte bancaire", color: "#6b7280", selected: false },
      ],
    },
  },
  {
    id: "ia",
    icon: "auto_awesome",
    label: "Assistant IA",
    color: "#ec4899",
    headline: "Un assistant IA qui comprend le marché africain",
    sub: "Générez des plans de cours complets, rédigez vos pages de vente, créez des quiz pertinents, structurez vos modules pédagogiques. Notre IA est entraînée sur des données du marché francophone africain — les textes générés résonnent avec votre audience, pas avec celle du marché américain.",
    features: [
      { icon: "school", title: "Structure de formation en 10 secondes", desc: "Donnez votre sujet (ex : 'Marketing digital pour PME africaines'), l'IA génère un plan complet avec modules, leçons, objectifs pédagogiques et durée estimée. Économisez 3-4 heures de conception pédagogique dès votre premier cours." },
      { icon: "edit_note", title: "Copywriting de vente qui convertit", desc: "Pages de vente, titres accrocheurs, descriptions de produits, séquences email, posts réseaux sociaux — des textes adaptés aux codes culturels et aux attentes de l'Afrique francophone." },
      { icon: "quiz", title: "Quiz et évaluations automatiques", desc: "Générez des QCM pertinents, des exercices pratiques et des études de cas pour chaque module de votre formation en un clic." },
      { icon: "smart_toy", title: "Chatbot support apprenant 24/7", desc: "Configurez un assistant IA qui répond aux questions de vos apprenants à toute heure avec le contexte de votre formation. Disponibilité permanente, même quand vous dormez." },
      { icon: "translate", title: "Contexte culturel africain intégré", desc: "L'IA intègre des références, exemples et cas d'usage pertinents pour le marché africain : noms, devises, situations professionnelles locales, plateformes de paiement régionales. Vos textes générés sonnent locaux, pas traduits." },
      { icon: "psychology", title: "Optimisation SEO assistée", desc: "Suggestions de titres optimisés pour Google, mots-clés à intégrer dans vos descriptions, meta descriptions générées automatiquement, score de lisibilité. Vos produits remontent dans les recherches Google sans effort technique." },
    ],
    mockup: {
      title: "Novakou AI",
      accent: "#ec4899",
      messages: [
        { from: "user", text: "Génère un plan pour une formation sur le Marketing Digital en Afrique" },
        { from: "ai", text: "Voici 4 modules adaptés au marché africain :\n1. Fondamentaux & réseaux sociaux locaux\n2. Créer une offre irrésistible\n3. Facebook Ads à petit budget\n4. Closing et fidélisation" },
      ],
    },
  },
  {
    id: "video",
    icon: "play_circle",
    label: "Hébergement vidéo",
    color: "#2563eb",
    headline: "Hébergez vos vidéos de formation en toute sécurité",
    sub: "Uploadez directement sur Novakou — pas besoin de YouTube, Vimeo ou d'un service tiers. Streaming adaptatif qui s'adapte à la connexion de vos apprenants (de la 3G à la fibre), protection anti-téléchargement avancée et lecteur entièrement brandé à votre couleurs.",
    features: [
      { icon: "cloud_upload", title: "Upload direct sans limite", desc: "Glissez vos fichiers vidéo jusqu'à 10 Go par fichier, sans limite de durée totale. Traitement automatique en arrière-plan pendant que vous continuez à travailler. Formats acceptés : MP4, MOV, AVI, WebM." },
      { icon: "shield", title: "Protection DRM anti-piratage", desc: "Vos vidéos ne peuvent pas être téléchargées, enregistrées ou partagées sans autorisation. Filigrane numérique avec le nom de l'acheteur, chiffrement des flux vidéo, désactivation du clic droit. Votre contenu reste votre propriété et votre source de revenus." },
      { icon: "hd", title: "Streaming adaptatif 3G/4G/fibre", desc: "Le lecteur Novakou s'adapte automatiquement à la vitesse de connexion : qualité 240p en 3G, 720p en 4G, 1080p en fibre. Aucun buffering frustrant pour vos apprenants en Afrique, quelle que soit leur connexion." },
      { icon: "bar_chart", title: "Analytics de visionnage détaillés", desc: "Voyez exactement où chaque apprenant en est dans chaque vidéo, quel pourcentage a regardé chaque module, où les gens s'arrêtent et re-regardent. Ces données vous permettent d'améliorer votre contenu là où il perd les apprenants." },
      { icon: "subtitles", title: "Sous-titres automatiques en français", desc: "Génération automatique de sous-titres en français pour toutes vos vidéos. Améliorez l'accessibilité pour les apprenants malentendants, facilite la compréhension dans des environnements bruyants, et booste le SEO de vos contenus vidéo." },
      { icon: "storage", title: "Stockage et bande passante illimités", desc: "Aucune limite de stockage, aucune limite de bande passante, aucun frais supplémentaire selon le nombre de vues. Hébergez 1 ou 100 formations avec autant de vidéos que nécessaire pour le même tarif." },
    ],
    mockup: {
      title: "Player vidéo sécurisé",
      accent: "#2563eb",
    },
  },
  {
    id: "automatisations",
    icon: "bolt",
    label: "Automatisations",
    color: "#06b6d4",
    headline: "Vendez et accompagnez sans être connecté H24",
    sub: "Emails automatiques de bienvenue, séquences de nurturing, relances de paniers abandonnés, certificats automatiques, notifications multi-canaux — configurez une fois, le système tourne ensuite indéfiniment à votre place. 73% des ventes Novakou se font hors des heures ouvrées.",
    features: [
      { icon: "mail", title: "23 séquences email prêtes à l'emploi", desc: "Bienvenue personnalisé, relance panier abandonné (3 emails), suivi post-achat J+1/J+3/J+7, rappel de progression, demande d'avis, offre de montée en gamme. 23 templates conçus pour le marché africain, modifiables en 2 clics." },
      { icon: "notifications_active", title: "Notifications email, SMS et push", desc: "Alertez vos clients selon les événements importants (achat, livraison, accès, nouveau module disponible) via email, SMS court ou notification push navigateur. Paramétrez finement quelle alerte va sur quel canal selon le type d'événement." },
      { icon: "workspace_premium", title: "Certificats PDF automatiques", desc: "Vos apprenants reçoivent un certificat PDF personnalisé avec leur nom, la date et votre signature numérique dès qu'ils atteignent 100% de la formation. Augmente la motivation des apprenants et la valeur perçue de vos formations." },
      { icon: "group_add", title: "Programme d'affiliation automatisé", desc: "Vos clients les plus satisfaits deviennent vos vendeurs. Commission paramétrable librement (20%, 30%, 40%), lien de tracking unique par affilié, calcul automatique des commissions, paiement automatique à chaque vente. Zéro gestion manuelle." },
      { icon: "shopping_cart", title: "Récupération panier abandonné", desc: "65% des visiteurs commencent un achat sans le finir. Novakou envoie automatiquement 3 emails de relance intelligents (1h, 24h, 72h après l'abandon) avec des arguments adaptés à l'objection probable de chaque étape." },
      { icon: "repeat", title: "Abonnements et revenus récurrents", desc: "Créez des produits en abonnement mensuel ou annuel : accès à une communauté privée, coaching groupe mensuel, bibliothèque de ressources en continu. Facturation automatique, gestion des suspensions et reprises sans intervention manuelle." },
    ],
    mockup: {
      title: "Centre d'automatisation",
      accent: "#06b6d4",
      flows: [
        { label: "Bienvenue nouvel apprenant", status: "Actif", count: "247 déclenchements" },
        { label: "Relance panier abandonné", status: "Actif", count: "89 récupérés" },
        { label: "Certificat de fin de formation", status: "Actif", count: "134 envoyés" },
        { label: "Offre post-achat (upsell)", status: "Actif", count: "31 conversions" },
      ],
    },
  },
  {
    id: "affiliation",
    icon: "group",
    label: "Affiliation",
    color: "#10b981",
    headline: "Vos clients deviennent vos meilleurs vendeurs",
    sub: "Créez votre programme d'affiliation en 5 minutes. Chaque affilié reçoit un lien traçable unique, un tableau de bord dédié pour suivre ses performances, et ses commissions sont calculées et payées automatiquement à chaque vente générée.",
    features: [
      { icon: "link", title: "Liens affiliés uniques et traçables", desc: "Chaque affilié reçoit un lien personnalisé (novakou.com/r/sonnom) qui trace précisément chaque clic, visite et achat généré. Attribution sur 30 jours — si un client revient acheter 3 semaines plus tard, l'affilié est tout de même crédité." },
      { icon: "percent", title: "Commission 100% paramétrable", desc: "Définissez librement le taux de commission : 10%, 20%, 30%, 40%, ou montant fixe. Paramétrez des commissions différentes par produit — formation principale à 30%, ebook à 50%, coaching à 20%. Flexibilité totale selon votre stratégie." },
      { icon: "dashboard", title: "Dashboard affilié complet", desc: "Chaque affilié a son propre espace pour suivre ses clics en temps réel, ses ventes générées, ses commissions accumulées et en attente de paiement, son lien personnel et les ressources marketing mises à disposition." },
      { icon: "payments", title: "Paiement automatique des commissions", desc: "Les commissions sont calculées instantanément à chaque vente et versées automatiquement sur le moyen de paiement choisi par l'affilié : Wave, Orange Money, MTN, PayPal ou virement. Aucune gestion manuelle de votre côté." },
      { icon: "analytics", title: "Analytics par affilié en temps réel", desc: "Identifiez vos affiliés les plus performants (clics, taux de conversion, revenus générés), comparez leurs performances dans le temps, envoyez-leur des ressources supplémentaires pour les aider à vendre plus. Transformez vos meilleurs affiliés en partenaires stratégiques." },
      { icon: "campaign", title: "Kit marketing prêt à l'emploi", desc: "Fournissez à vos affiliés visuels aux formats Reels/Stories/Posts, textes de vente copywrités, emails prêts à envoyer, arguments de vente et FAQ. Plus ils ont d'outils, plus ils vendent — et plus vous gagnez." },
    ],
    mockup: {
      title: "Programme d'affiliation",
      accent: "#10b981",
      stats: [
        { label: "Affiliés actifs", value: "24" },
        { label: "Clics ce mois", value: "1 247" },
        { label: "Ventes générées", value: "87" },
        { label: "Commissions payées", value: "327 500 F" },
      ],
    },
  },
] as const;

type TabId = typeof TABS[number]["id"];

/* ─── Mockup renderers ─────────────────────────────────────── */
function MockupBoutique({ data }: { data: typeof TABS[0]["mockup"] }) {
  if (!("items" in data)) return null;
  return (
    <div className="space-y-3">
      {data.items.map((item) => (
        <div key={item.label} className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 bg-white">
          <div className="w-10 h-10 rounded-lg flex-shrink-0" style={{ background: `${item.color}20` }}>
            <div className="w-full h-full rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]" style={{ color: item.color }}>inventory_2</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#191c1e] truncate">{item.label}</p>
            <p className="text-xs text-[#5c647a]">{item.price}</p>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 whitespace-nowrap">{item.badge}</span>
        </div>
      ))}
      <button className="w-full py-2.5 rounded-xl text-white text-sm font-bold" style={{ backgroundColor: data.accent }}>
        Voir ma boutique →
      </button>
    </div>
  );
}

function MockupTunnel({ data }: { data: typeof TABS[1]["mockup"] }) {
  if (!("blocks" in data)) return null;
  return (
    <div className="space-y-2">
      {data.blocks.map((block, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 bg-white cursor-grab hover:border-gray-300 transition-colors">
          <span className="material-symbols-outlined text-[16px] text-gray-300">drag_indicator</span>
          <span className="text-sm text-[#191c1e] font-medium flex-1">{block}</span>
          <span className="material-symbols-outlined text-[14px] text-gray-300">settings</span>
        </div>
      ))}
      <button className="w-full py-2.5 rounded-xl text-white text-sm font-bold mt-2" style={{ backgroundColor: data.accent }}>
        + Ajouter un bloc
      </button>
    </div>
  );
}

function MockupPaiements({ data }: { data: typeof TABS[2]["mockup"] }) {
  if (!("methods" in data)) return null;
  return (
    <div className="space-y-3">
      {data.methods.map((m) => (
        <div key={m.name}
          className="flex items-center justify-between px-3 py-3 rounded-xl border cursor-pointer transition-colors"
          style={{ borderColor: m.selected ? data.accent : "#e5e7eb", backgroundColor: m.selected ? `${data.accent}08` : "white" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
              style={{ backgroundColor: m.color }}>{m.name.split(" ")[0].slice(0, 4)}</div>
            <span className="text-sm font-medium text-[#191c1e]">{m.name}</span>
          </div>
          <span className="material-symbols-outlined text-[18px]" style={{ color: m.selected ? data.accent : "#d1d5db" }}>
            {m.selected ? "radio_button_checked" : "radio_button_unchecked"}
          </span>
        </div>
      ))}
      <button className="w-full py-3 rounded-xl text-white text-sm font-bold" style={{ backgroundColor: data.accent }}>
        Payer maintenant
      </button>
    </div>
  );
}

function MockupIA({ data }: { data: typeof TABS[3]["mockup"] }) {
  if (!("messages" in data)) return null;
  return (
    <div className="space-y-3">
      {data.messages.map((msg, i) => (
        <div key={i} className={`flex gap-2 ${msg.from === "user" ? "flex-row-reverse" : ""}`}>
          <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold`}
            style={{ backgroundColor: msg.from === "ai" ? data.accent : "#6b7280" }}>
            {msg.from === "ai" ? "AI" : "V"}
          </div>
          <div className={`text-xs p-3 rounded-2xl max-w-[85%] leading-relaxed whitespace-pre-line`}
            style={{
              backgroundColor: msg.from === "ai" ? `${data.accent}15` : "#f3f4f6",
              color: "#191c1e",
              borderRadius: msg.from === "ai" ? "0 16px 16px 16px" : "16px 0 16px 16px",
            }}>
            {msg.text}
          </div>
        </div>
      ))}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
        <div className="flex-1 bg-gray-50 rounded-full px-3 py-2 text-xs text-gray-400">Posez une question à l&apos;IA…</div>
        <button className="w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: data.accent }}>
          <span className="material-symbols-outlined text-[14px]">send</span>
        </button>
      </div>
    </div>
  );
}

function MockupVideo() {
  return (
    <div className="space-y-3">
      <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-blue-600 opacity-80" />
        <div className="relative w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors">
          <span className="material-symbols-outlined text-[32px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
          <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full" style={{ width: "35%" }} />
          </div>
          <span className="text-white text-[10px]">12:45</span>
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold text-white bg-red-500">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />LIVE
        </div>
      </div>
      {[
        { title: "Module 1 — Introduction", duration: "12:45", done: true },
        { title: "Module 2 — Les fondamentaux", duration: "18:20", done: true },
        { title: "Module 3 — Mise en pratique", duration: "25:10", done: false },
      ].map((v) => (
        <div key={v.title} className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 bg-white">
          <span className="material-symbols-outlined text-[18px]" style={{ color: v.done ? "#22c55e" : "#d1d5db", fontVariationSettings: "'FILL' 1" }}>
            {v.done ? "check_circle" : "play_circle"}
          </span>
          <span className="flex-1 text-xs text-[#191c1e]">{v.title}</span>
          <span className="text-[10px] text-[#5c647a]">{v.duration}</span>
        </div>
      ))}
    </div>
  );
}

function MockupAutomatisations({ data }: { data: typeof TABS[5]["mockup"] }) {
  if (!("flows" in data)) return null;
  return (
    <div className="space-y-2">
      {data.flows.map((flow) => (
        <div key={flow.label} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-white">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: data.accent }} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[#191c1e] truncate">{flow.label}</p>
            <p className="text-[10px] text-[#5c647a]">{flow.count}</p>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${data.accent}15`, color: data.accent }}>
            {flow.status}
          </span>
        </div>
      ))}
      <button className="w-full py-2.5 rounded-xl text-white text-sm font-bold mt-1" style={{ backgroundColor: data.accent }}>
        + Créer un workflow
      </button>
    </div>
  );
}

function MockupAffiliation({ data }: { data: typeof TABS[6]["mockup"] }) {
  if (!("stats" in data)) return null;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {data.stats.map((s) => (
          <div key={s.label} className="p-3 rounded-xl text-center border border-gray-100 bg-white">
            <p className="text-lg font-extrabold" style={{ color: data.accent }}>{s.value}</p>
            <p className="text-[10px] text-[#5c647a] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="p-3 rounded-xl bg-white border border-gray-100">
        <p className="text-[10px] font-bold text-[#5c647a] mb-2">Votre lien affilié</p>
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
          <span className="text-xs text-[#191c1e] flex-1 truncate font-mono">novakou.com/r/votrenom</span>
          <button className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ backgroundColor: `${data.accent}15`, color: data.accent }}>
            Copier
          </button>
        </div>
      </div>
    </div>
  );
}

function TabMockup({ tab }: { tab: typeof TABS[number] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100" style={{ backgroundColor: C.surfaceLow }}>
        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        <div className="flex-1 mx-3 h-5 bg-white rounded text-[10px] flex items-center px-2 text-[#5c647a] font-mono">
          novakou.com/vendeur/{tab.id}
        </div>
      </div>
      <div className="h-0.5" style={{ background: `linear-gradient(to right, ${tab.color}, ${C.accent})` }} />
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${tab.color}15` }}>
            <span className="material-symbols-outlined text-[18px]" style={{ color: tab.color, fontVariationSettings: "'FILL' 1" }}>{tab.icon}</span>
          </div>
          <span className="text-sm font-bold text-[#191c1e]">{tab.mockup.title}</span>
        </div>
        {tab.id === "boutique" && <MockupBoutique data={tab.mockup as typeof TABS[0]["mockup"]} />}
        {tab.id === "tunnels" && <MockupTunnel data={tab.mockup as typeof TABS[1]["mockup"]} />}
        {tab.id === "paiements" && <MockupPaiements data={tab.mockup as typeof TABS[2]["mockup"]} />}
        {tab.id === "ia" && <MockupIA data={tab.mockup as typeof TABS[3]["mockup"]} />}
        {tab.id === "video" && <MockupVideo />}
        {tab.id === "automatisations" && <MockupAutomatisations data={tab.mockup as typeof TABS[5]["mockup"]} />}
        {tab.id === "affiliation" && <MockupAffiliation data={tab.mockup as typeof TABS[6]["mockup"]} />}
      </div>
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────── */
export default function FonctionnalitesPage() {
  const [activeTab, setActiveTab] = useState<TabId>("boutique");
  const tab = TABS.find((t) => t.id === activeTab) ?? TABS[0];

  return (
    <div style={{ backgroundColor: C.surface, color: C.dark, ...S }}>

      {/* ── Hero ── */}
      <section className="py-14 md:py-24 px-4 sm:px-6 text-center" style={{ background: `linear-gradient(160deg, #003d1a 0%, ${C.primary} 55%, ${C.accent} 100%)` }}>
        <div className="max-w-4xl mx-auto">
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase mb-5 text-white" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
            Plateforme complète
          </span>
          <h1 className="text-3xl sm:text-5xl md:text-6xl text-white mb-5 md:mb-6 leading-[1.05]" style={SH}>
            Tout ce dont vous avez besoin<br className="hidden sm:block" /> pour vendre en ligne en Afrique.
          </h1>
          <p className="text-base md:text-xl text-white/80 max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed">
            Boutique, tunnels de vente, paiements Mobile Money (Wave, Orange, MTN), assistant IA adapté au contexte africain, hébergement vidéo sécurisé, certificats automatiques, automatisations et programme d'affiliation. Tout inclus. Zéro abonnement fixe.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4">
            <Link href="/inscription?role=vendeur" className="bg-white font-bold text-sm md:text-base py-3.5 px-7 rounded-xl hover:bg-gray-50 transition-colors" style={{ color: C.primary }}>
              Commencer gratuitement
            </Link>
            <Link href="/tarifs" className="border-2 border-white/30 text-white font-semibold text-sm md:text-base py-3.5 px-7 rounded-xl hover:bg-white/10 transition-colors">
              Voir les tarifs →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="bg-white border-b border-gray-100 py-6 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { value: "30+", label: "Blocs de construction pour tunnels" },
            { value: "17", label: "Pays africains couverts (Mobile Money)" },
            { value: "23", label: "Templates email automatiques inclus" },
            { value: "10%", label: "Commission seulement, pas d'abonnement" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl sm:text-3xl font-extrabold" style={{ color: C.primary }}>{s.value}</p>
              <p className="text-xs text-[#5c647a] mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tabs + Content ── */}
      <section className="py-12 md:py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Tab navigation */}
          <div className="sticky top-16 z-30 bg-white/90 backdrop-blur-md rounded-2xl border border-gray-100 shadow-sm mb-10 md:mb-14 overflow-x-auto">
            <div className="flex gap-1 p-2 min-w-max md:min-w-0">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className="flex items-center gap-2 px-3 md:px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0"
                  style={{
                    backgroundColor: activeTab === t.id ? t.color : "transparent",
                    color: activeTab === t.id ? "white" : C.muted,
                  }}
                >
                  <span
                    className="material-symbols-outlined text-[16px]"
                    style={{ fontVariationSettings: "'FILL' 1", color: activeTab === t.id ? "white" : t.color }}
                  >{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 items-start">
            {/* Left: Text */}
            <div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider mb-5"
                style={{ backgroundColor: `${tab.color}15`, color: tab.color }}
              >
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>{tab.icon}</span>
                {tab.label}
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-4 leading-[1.1]" style={{ ...SH, color: C.dark }}>
                {tab.headline}
              </h2>
              <p className="text-sm md:text-base leading-relaxed mb-8 md:mb-10" style={{ color: C.muted }}>
                {tab.sub}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
                {tab.features.map((f) => (
                  <div key={f.title} className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: `${tab.color}12` }}
                    >
                      <span
                        className="material-symbols-outlined text-[18px]"
                        style={{ color: tab.color, fontVariationSettings: "'FILL' 1" }}
                      >{f.icon}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold mb-1" style={{ color: C.dark }}>{f.title}</p>
                      <p className="text-xs leading-relaxed" style={{ color: C.muted }}>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/inscription?role=vendeur"
                className="inline-flex items-center gap-2 py-3 px-6 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: tab.color }}
              >
                Essayer gratuitement
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>

            {/* Right: Mockup */}
            <div className="lg:sticky lg:top-32">
              <TabMockup tab={tab} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Comparaison ── */}
      <section className="py-12 md:py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10 md:mb-14">
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase mb-4" style={{ backgroundColor: C.surfaceHigh, color: C.dark }}>
              Comparaison
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-5xl mb-3" style={{ ...SH, color: C.dark }}>
              Novakou vs la concurrence
            </h2>
            <p className="text-sm md:text-base" style={{ color: C.muted }}>
              Les autres plateformes n'ont pas été conçues pour l'Afrique. Novakou, si.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-4 px-4 font-bold text-[#191c1e]">Fonctionnalité</th>
                  <th className="py-4 px-4 font-extrabold text-center rounded-t-2xl text-sm" style={{ background: `${C.primary}10`, color: C.primary }}>Novakou</th>
                  <th className="py-4 px-4 text-center font-semibold text-gray-500 text-sm">Systeme.io</th>
                  <th className="py-4 px-4 text-center font-semibold text-gray-500 text-sm">Gumroad</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Mobile Money (Wave, Orange, MTN)", true, false, false],
                  ["Mobile Money Afrique francophone", true, false, false],
                  ["Tunnels de vente (30+ blocs)", true, true, false],
                  ["Génération IA de tunnels et textes", true, false, false],
                  ["Hébergement vidéo inclus sans limite", true, true, false],
                  ["Protection DRM anti-piratage", true, false, false],
                  ["Certificats automatiques PDF", true, false, false],
                  ["Programme d'affiliation natif", true, true, false],
                  ["Séquences email 23 templates inclus", true, true, false],
                  ["Zéro abonnement fixe mensuel", true, false, true],
                  ["Commission ≤ 10%", true, false, false],
                  ["Countdown par visiteur unique", true, false, false],
                  ["Assistant IA contexte africain", true, false, false],
                  ["Récupération panier abandonné auto", true, false, false],
                  ["Retraits sous 24-48h", true, true, true],
                ].map(([label, nova, sys, gum], i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-[#191c1e] text-sm">{label as string}</td>
                    <td className="py-3 px-4 text-center" style={{ background: `${C.primary}04` }}>
                      {nova
                        ? <span className="material-symbols-outlined text-[18px]" style={{ color: C.primary, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        : <span className="material-symbols-outlined text-[18px] text-gray-200">cancel</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {sys
                        ? <span className="material-symbols-outlined text-[18px] text-gray-400">check_circle</span>
                        : <span className="material-symbols-outlined text-[18px] text-gray-200">cancel</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {gum
                        ? <span className="material-symbols-outlined text-[18px] text-gray-400">check_circle</span>
                        : <span className="material-symbols-outlined text-[18px] text-gray-200">cancel</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Créateurs en action ── */}
      <section className="py-12 md:py-20 px-4 sm:px-6" style={{ backgroundColor: C.surface }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 md:mb-14">
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase mb-4" style={{ backgroundColor: C.surfaceHigh, color: C.dark }}>
              Témoignages
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-5xl mb-3" style={{ ...SH, color: C.dark }}>
              Ils créent et vendent sur Novakou
            </h2>
            <p className="text-sm md:text-base max-w-xl mx-auto" style={{ color: C.muted }}>
              Des créateurs africains qui ont transformé leur expertise en revenus récurrents grâce aux fonctionnalités Novakou.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              {
                photo: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=400&q=80",
                name: "Aminata K.",
                location: "Dakar, Sénégal",
                domain: "Formation Comptabilité",
                revenue: "",
                quote: "Novakou m'a permis de vendre mes formations en Excel à des comptables en Afrique francophone. Le Mobile Money change tout — mes clients paient avec Wave en quelques secondes.",
              },
              {
                photo: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=400&q=80",
                name: "Ibrahim D.",
                location: "Abidjan, Côte d'Ivoire",
                domain: "Marketing Digital",
                revenue: "",
                quote: "L'assistant IA m'a aidé à créer mon tunnel de vente rapidement. L'outil est intuitif et puissant. J'aurais dû commencer sur Novakou bien avant.",
              },
              {
                photo: "https://images.unsplash.com/photo-1573496799515-eebbb63814f2?auto=format&fit=crop&w=400&q=80",
                name: "Fatou N.",
                location: "Douala, Cameroun",
                domain: "Design Canva",
                revenue: "",
                quote: "Avant Novakou, je ne savais pas comment accepter les paiements. Maintenant mes clients paient facilement par Wave ou Orange Money. Les automatisations gèrent tout à ma place.",
              },
            ].map((creator) => (
              <div key={creator.name} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={creator.photo}
                    alt={`${creator.name} — créateur sur Novakou`}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-3 left-4">
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full text-white" style={{ backgroundColor: C.primary }}>
                      {creator.domain}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-bold" style={{ color: C.dark }}>{creator.name}</p>
                      <p className="text-xs" style={{ color: C.muted }}>{creator.location}</p>
                    </div>
                    {creator.revenue && (
                      <div className="text-right">
                        <p className="text-sm font-extrabold" style={{ color: C.primary }}>{creator.revenue}</p>
                        <p className="text-[10px]" style={{ color: C.muted }}>revenus mensuels</p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed italic" style={{ color: C.muted }}>
                    &ldquo;{creator.quote}&rdquo;
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl overflow-hidden relative shadow-sm">
            <Image
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80"
              alt="Communauté de créateurs africains qui apprennent et vendent en ligne"
              width={1200}
              height={380}
              className="w-full object-cover"
              style={{ maxHeight: 340 }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: "rgba(0,110,47,0.65)" }}>
              <p className="text-2xl sm:text-3xl md:text-4xl text-white text-center px-6 mb-4" style={SH}>
                Rejoignez 850+ créateurs africains
              </p>
              <Link
                href="/inscription?role=vendeur"
                className="bg-white font-bold text-sm py-3 px-7 rounded-xl hover:bg-gray-50 transition-colors"
                style={{ color: C.primary }}
              >
                Créer mon compte gratuitement
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section SEO longue ── */}
      <section className="py-16 md:py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase mb-4" style={{ backgroundColor: C.surfaceHigh, color: C.dark }}>
              Pourquoi Novakou
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl mb-4" style={{ ...SH, color: C.dark }}>
              La plateforme construite pour les créateurs africains
            </h2>
            <p className="text-base md:text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: C.muted }}>
              Novakou n'est pas une adaptation d'un outil américain. C'est une
              plateforme conçue dès la première ligne de code pour les réalités
              du marché africain : connexions mobiles, paiements locaux,
              audiences francophones.
            </p>
          </div>

          <div className="space-y-12">
            {/* Block 1 */}
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="relative rounded-2xl overflow-hidden" style={{ height: 240 }}>
                <Image
                  src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=700&auto=format&fit=crop&q=80"
                  alt="Paiement mobile en Afrique avec Wave et Orange Money"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl mb-3" style={{ ...SH, color: C.dark }}>
                  Les paiements que votre audience utilise vraiment
                </h3>
                <p className="text-sm leading-relaxed mb-4" style={{ color: C.muted }}>
                  En Afrique francophone, la majorité de la population
                  utilise un service de Mobile Money au quotidien. Novakou
                  intègre nativement Wave, Orange Money, MTN MoMo, et Moov Money
                  — permettant à vos clients de payer en quelques secondes
                  avec leur téléphone, sans compte bancaire requis.
                </p>
                <p className="text-sm leading-relaxed" style={{ color: C.muted }}>
                  Cette intégration n'est pas en option, n'est pas un module
                  payant : elle est au cœur de la plateforme.
                </p>
              </div>
            </div>

            {/* Block 2 */}
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="order-2 md:order-1">
                <h3 className="text-xl sm:text-2xl mb-3" style={{ ...SH, color: C.dark }}>
                  Une boutique qui se vend même quand vous dormez
                </h3>
                <p className="text-sm leading-relaxed mb-4" style={{ color: C.muted }}>
                  73% des ventes enregistrées sur Novakou ont lieu hors des
                  heures ouvrées classiques — la nuit, le week-end, les jours
                  fériés. C'est parce que vos clients sont au Sénégal, en Côte
                  d'Ivoire, au Cameroun, en France et au Canada — dans des
                  fuseaux horaires différents. Votre boutique, elle, est ouverte
                  24h/24 et 7j/7.
                </p>
                <p className="text-sm leading-relaxed" style={{ color: C.muted }}>
                  Les automatisations Novakou — email de bienvenue, accès
                  immédiat à la formation, séquences de suivi — s'activent
                  instantanément à chaque vente, à toute heure, sans aucune
                  intervention de votre part. Configurez une fois, récoltez
                  indéfiniment.
                </p>
              </div>
              <div className="relative rounded-2xl overflow-hidden order-1 md:order-2" style={{ height: 240 }}>
                <Image
                  src="https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=700&auto=format&fit=crop&q=80"
                  alt="Dashboard revenus automatiques formation en ligne"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>

            {/* Block 3 */}
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="relative rounded-2xl overflow-hidden" style={{ height: 240 }}>
                <Image
                  src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=700&auto=format&fit=crop&q=80"
                  alt="Formation en ligne hébergement vidéo sécurisé"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl mb-3" style={{ ...SH, color: C.dark }}>
                  Hébergez vos vidéos sans compromis
                </h3>
                <p className="text-sm leading-relaxed mb-4" style={{ color: C.muted }}>
                  Beaucoup de créateurs africains hébergent leurs vidéos sur
                  YouTube (public, sans contrôle d'accès) ou Vimeo (coûteux,
                  conçu pour les marchés occidentaux). Novakou offre un
                  hébergement vidéo professionnel inclus dans votre compte :
                  streaming adaptatif pour les connexions 3G/4G africaines,
                  protection DRM anti-téléchargement, player brandé à vos
                  couleurs, analytics de visionnage module par module.
                </p>
                <p className="text-sm leading-relaxed" style={{ color: C.muted }}>
                  Aucun frais supplémentaire, aucune limite de stockage ou de
                  bande passante. Vos vidéos restent votre propriété — elles
                  ne peuvent être ni téléchargées, ni partagées, ni re-publiées
                  sans votre autorisation.
                </p>
              </div>
            </div>

            {/* Block 4 */}
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="order-2 md:order-1">
                <h3 className="text-xl sm:text-2xl mb-3" style={{ ...SH, color: C.dark }}>
                  Un assistant IA qui parle africain
                </h3>
                <p className="text-sm leading-relaxed mb-4" style={{ color: C.muted }}>
                  Les outils IA génériques génèrent des textes qui sonnent
                  américains ou européens — avec des références culturelles, des
                  exemples de revenus en dollars et des situations qui ne
                  correspondent pas à votre audience. L'assistant IA Novakou
                  est entraîné sur les données du marché francophone africain.
                </p>
                <p className="text-sm leading-relaxed" style={{ color: C.muted }}>
                  Il génère des titres de formations, des pages de vente, des
                  plans de cours et des emails qui résonnent avec les créateurs
                  et acheteurs d'Afrique francophone. Les textes générés utilisent
                  les bons exemples, les bonnes devises (FCFA, EUR), les bons
                  arguments culturels. Résultat : des taux de conversion
                  significativement plus élevés que sur des outils génériques.
                </p>
              </div>
              <div className="relative rounded-2xl overflow-hidden order-1 md:order-2" style={{ height: 240 }}>
                <Image
                  src="https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=700&auto=format&fit=crop&q=80"
                  alt="Intelligence artificielle assistant IA formation en ligne"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-12 md:py-20 px-4 sm:px-6" style={{ backgroundColor: C.surface }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase mb-4" style={{ backgroundColor: C.surfaceHigh, color: C.dark }}>
              FAQ
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl" style={{ ...SH, color: C.dark }}>Questions fréquentes sur les fonctionnalités Novakou</h2>
          </div>
          <div className="space-y-3">
            {[
              {
                q: "Les fonctionnalités sont-elles vraiment toutes incluses sans frais supplémentaires ?",
                a: "Oui, absolument. Novakou ne propose pas de modules payants séparés. Boutique, tunnels de vente, assistant IA, paiements Mobile Money, hébergement vidéo illimité, certificats automatiques, programme d'affiliation, automatisations email — tout est inclus dès votre inscription, que vous fassiez 1 ou 1 000 ventes par mois. Vous ne payez que la commission de 10% sur les ventes réalisées.",
              },
              {
                q: "Quels pays africains sont couverts pour les paiements Mobile Money ?",
                a: "Novakou couvre plusieurs pays africains en Mobile Money : Sénégal (Wave, Orange Money), Côte d'Ivoire (Wave, Orange Money, MTN), Cameroun (Orange Money, MTN), Mali, Burkina Faso, Togo, Bénin, et d'autres pays en Afrique francophone. Pour les clients internationaux, les paiements par carte bancaire Visa/Mastercard et PayPal sont également disponibles.",
              },
              {
                q: "Comment fonctionne la commission de 10% ? Y a-t-il d'autres frais cachés ?",
                a: "Vous ne payez rien tant que vous ne vendez pas. Lorsqu'une vente est réalisée, Novakou prélève 10% du montant de la transaction. Il n'y a aucun abonnement mensuel, aucun frais d'installation, aucun frais de stockage vidéo, aucun frais pour les emails automatiques. La commission de 10% est le seul et unique coût. À titre de comparaison, Systeme.io facture 27€/mois minimum + leur commission, et Teachable prend jusqu'à 10% + frais de traitement.",
              },
              {
                q: "Combien de produits, de formations et de vidéos puis-je publier ?",
                a: "Il n'y a aucune limite au nombre de produits, de formations, d'ebooks ou de vidéos que vous pouvez publier sur Novakou. Le stockage vidéo est illimité, la bande passante de streaming est illimitée, le nombre de pages de vente est illimité. Créez autant de contenu que vous le souhaitez sans contrainte technique.",
              },
              {
                q: "L'hébergement vidéo est-il vraiment sécurisé contre le téléchargement ?",
                a: "Oui. Novakou utilise une protection DRM (Digital Rights Management) qui empêche techniquement le téléchargement des vidéos. Cela inclut : désactivation du clic droit, chiffrement du flux vidéo (HLS encrypté), filigrane numérique avec le nom et l'email de l'acheteur pour traçabilité, et blocage des outils de capture d'écran sur les navigateurs supportés. Vos vidéos ne peuvent pas être téléchargées et redistribuées.",
              },
              {
                q: "Comment fonctionne l'assistant IA et est-il adapté au marché africain ?",
                a: "L'assistant IA Novakou est basé sur un modèle de langage avancé entraîné et affiné sur des données de contenu francophone africain. Il comprend les références culturelles, les exemples pertinents pour l'Afrique, les montants en FCFA et EUR, les situations professionnelles locales. Il peut générer des plans de cours complets, des pages de vente, des descriptions de produits, des emails de séquences, des titres optimisés SEO. Tout est entièrement modifiable après génération.",
              },
              {
                q: "Puis-je connecter mon propre nom de domaine (monsite.com) à ma boutique Novakou ?",
                a: "Oui. Vous pouvez connecter votre propre nom de domaine gratuitement à votre boutique Novakou. Les instructions techniques sont disponibles dans votre tableau de bord (configuration DNS CNAME en quelques clics). Votre boutique sera accessible sur votre propre domaine, avec le certificat SSL inclus, et votre marque visible partout sans référence à Novakou.",
              },
              {
                q: "Comment fonctionne le programme d'affiliation pour mes clients ?",
                a: "Vous activez le programme d'affiliation en 2 clics dans votre tableau de bord. Chaque affilié reçoit un lien unique traçable. Vous définissez librement le taux de commission (10% à 50%, ou montant fixe). Les affiliés ont accès à leur propre espace pour suivre leurs performances. Les commissions sont calculées automatiquement et versées sur le moyen de paiement de l'affilié (Wave, Orange Money, PayPal) sans intervention manuelle de votre part.",
              },
              {
                q: "Les automatisations sont-elles difficiles à configurer ?",
                a: "Non. Novakou propose 23 templates d'automatisations prêts à l'emploi pour les cas les plus courants : email de bienvenue, relance panier abandonné, rappel de progression, demande d'avis, offre upsell post-achat. Activez un template en 1 clic, personnalisez les textes si vous le souhaitez, et c'est opérationnel. Pour les automatisations avancées (conditions, branches logiques, délais personnalisés), un éditeur visuel est disponible.",
              },
              {
                q: "Est-ce que Novakou est adapté aux débutants qui n'ont aucune expérience technique ?",
                a: "Novakou est conçu pour être utilisé sans aucune connaissance technique. Création de compte en 3 minutes, boutique active immédiatement, premier produit publié en moins d'une heure, paiements configurés sans connaissance en développement web. Tous les outils sont accompagnés de guides étape par étape et de tutoriels vidéo. Le support est disponible en français, disponible sur WhatsApp pour les questions urgentes.",
              },
            ].map((item, i) => (
              <details key={i} className="group bg-white rounded-xl border border-gray-100 p-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between cursor-pointer font-semibold text-sm md:text-base gap-3" style={{ color: C.dark }}>
                  {item.q}
                  <span className="material-symbols-outlined text-[20px] flex-shrink-0 transition-transform group-open:rotate-180 text-gray-400">expand_more</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: C.muted }}>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-14 md:py-24 px-4 sm:px-6 text-center" style={{ backgroundColor: C.primary }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-6xl text-white mb-4 md:mb-6 leading-tight" style={SH}>
            Lancez votre business en ligne aujourd&apos;hui.
          </h2>
          <p className="text-base md:text-xl mb-8 md:mb-10 max-w-2xl mx-auto" style={{ color: "#d1fae5" }}>
            10% de commission. Zéro abonnement. Toutes les fonctionnalités incluses. Mobile Money natif. Commencez en 3 minutes.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4">
            <Link
              href="/inscription?role=vendeur"
              className="inline-block bg-white font-bold text-base md:text-lg py-4 px-8 md:px-10 rounded-xl hover:bg-gray-50 transition-colors"
              style={{ color: C.primary }}
            >
              Créer mon compte gratuitement
            </Link>
            <Link
              href="/guides"
              className="inline-block border-2 border-white/30 text-white font-semibold text-base md:text-lg py-4 px-8 md:px-10 rounded-xl hover:bg-white/10 transition-colors"
            >
              Voir les guides gratuits →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
