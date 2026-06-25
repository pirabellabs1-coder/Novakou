// ═════════════════════════════════════════════════════════════════════════════
// FUNNEL LANDING TEMPLATES — Novakou
// 6 templates de pages de vente prêtes à l'emploi, calqués sur les meilleures
// pages de capture / VSL / masterclass / packs produit du marché francophone.
//
// Chaque template renvoie un tableau de blocs (build()) directement injectables
// dans une étape LANDING d'un SalesFunnel. Les blocs `button` / `cta` avec
// `link: ""` déclenchent le CTA principal du tunnel (checkout du produit lié).
//
// Les `key` sont conservées (coach-premium, lancement-express, saas-tech,
// business-b2b, creatif, webinar-live) car l'aperçu TemplatePreviewMockup mappe
// dessus. Les images sont des placeholders (picsum) que le vendeur remplace.
// ═════════════════════════════════════════════════════════════════════════════

type Block = { id: string; type: string; data: Record<string, unknown> };

let counter = 0;
function nid(): string {
  return `t-${Date.now()}-${counter++}-${Math.random().toString(36).slice(2, 5)}`;
}

const img = (seed: string, w = 1200, h = 800) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

export type LandingTemplate = {
  key: string;
  label: string;
  tagline: string;
  description: string;
  vibe: string;
  icon: string;
  palette: string[];
  preview: string;
  uniqueElements: string[];
  build: () => Block[];
};

// ═════════════════════════════════════════════════════════════════════════════
// T1 — GUIDE / VSL  (vert foncé)  → key: creatif
// Page de capture vidéo pour vendre un guide / ebook à petit prix.
// Structure : hero vidéo → ebook + bénéfices → "ce que tu vas découvrir" →
// "imagine ta vie après" → "pourquoi c'est différent" → CTA finale.
// ═════════════════════════════════════════════════════════════════════════════
const guideVsl: LandingTemplate = {
  key: "creatif",
  label: "Guide / Ebook (VSL)",
  tagline: "Page de capture vidéo",
  description:
    "Pour vendre un guide ou un ebook à petit prix avec une vidéo de présentation. Vert profond, vidéo en haut, visuel du guide, sections « ce que tu vas découvrir » et « imagine ta vie après ». Conçue pour la conversion impulsive.",
  vibe: "aesthetic",
  icon: "menu_book",
  palette: ["#0b3b20", "#bef264", "#ffffff"],
  preview: "linear-gradient(135deg, #0b3b20 0%, #14532d 60%, #65a30d 100%)",
  uniqueElements: ["Hero vidéo + CTA prix", "Visuel du guide + bénéfices", "Section « Imagine ta vie après »"],
  build: () => [
    // ─── HERO VIDÉO ──────────────────────────────────────────────────────────
    {
      id: nid(), type: "section",
      data: {
        bgColor: "linear-gradient(135deg, #0b3b20, #14532d)", textColor: "#ffffff",
        paddingY: 64, paddingX: 16, maxWidth: 880,
        blocks: [
          { id: nid(), type: "text", data: { content: "GUIDE PRATIQUE", align: "center", size: 13, color: "#bef264" } },
          { id: nid(), type: "heading", data: { content: "Les 10 étapes à connaître absolument pour ne pas rater ton démarrage", level: 1, align: "center", color: "#ffffff" } },
          { id: nid(), type: "text", data: { content: "Regarde d'abord cette courte vidéo (2 minutes) avant de télécharger le guide.", align: "center", size: 17, color: "#d1fae5" } },
          { id: nid(), type: "spacer", data: { height: 20 } },
          { id: nid(), type: "video", data: { externalUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", url: "", caption: "" } },
          { id: nid(), type: "spacer", data: { height: 24 } },
          { id: nid(), type: "button", data: { text: "📥  Je télécharge le guide complet — 3 000 FCFA", link: "", style: "primary", size: "lg", align: "center", bgColor: "#65a30d", textColor: "#ffffff", fullWidth: true, icon: "" } },
        ],
      },
    },
    // ─── EBOOK + BÉNÉFICES ───────────────────────────────────────────────────
    {
      id: nid(), type: "section",
      data: {
        bgColor: "#ffffff", paddingY: 64, paddingX: 16, maxWidth: 1080,
        blocks: [
          { id: nid(), type: "row",
            data: {
              gap: 48, padding: 0,
              columns: [
                { blocks: [
                  { id: nid(), type: "image", data: { url: img("ebook-cover-green", 700, 900), alt: "Le guide", align: "center", radius: 16 } },
                ] },
                { blocks: [
                  { id: nid(), type: "heading", data: { content: "Tu as moins de 30 ans ? Ce guide est pour toi.", level: 2, align: "left", color: "#0b3b20" } },
                  { id: nid(), type: "text", data: { content: "Tu vas découvrir les leçons que personne ne t'explique, pour éviter les erreurs qui coûtent des années.", align: "left", size: 17, color: "#475569" } },
                  { id: nid(), type: "spacer", data: { height: 12 } },
                  { id: nid(), type: "list", data: { items: ["Un guide clair, concret et actionnable", "Lisible en moins d'une heure", "Des exemples adaptés à ta réalité"], icon: "check_circle", color: "#65a30d" } },
                  { id: nid(), type: "spacer", data: { height: 18 } },
                  { id: nid(), type: "button", data: { text: "Je télécharge le guide — 3 000 FCFA", link: "", style: "primary", size: "lg", align: "left", bgColor: "#0b3b20", textColor: "#ffffff", fullWidth: false, icon: "" } },
                ] },
              ],
            },
          },
        ],
      },
    },
    // ─── CE QUE TU VAS DÉCOUVRIR ─────────────────────────────────────────────
    {
      id: nid(), type: "features",
      data: {
        title: "Ce que tu vas découvrir dans ce guide", columns: 3,
        items: [
          { icon: "schedule", title: "Gérer ton temps", desc: "Arrête de subir tes journées : la méthode simple pour avancer chaque jour." },
          { icon: "savings", title: "Gérer ton argent", desc: "Les bases que l'école ne t'apprend jamais, expliquées simplement." },
          { icon: "psychology", title: "Garder le bon mental", desc: "Comment rester motivé même quand tout semble bloqué." },
          { icon: "groups", title: "Bien t'entourer", desc: "Reconnaître les bonnes personnes et t'éloigner de ce qui te freine." },
          { icon: "trending_up", title: "Saisir les bonnes opportunités", desc: "Les signaux à repérer pour ne pas passer à côté." },
          { icon: "flag", title: "Fixer tes objectifs", desc: "Une méthode claire pour savoir où tu vas et comment y arriver." },
        ],
      },
    },
    // ─── CTA INTERMÉDIAIRE ───────────────────────────────────────────────────
    {
      id: nid(), type: "cta",
      data: {
        headline: "Prêt à prendre une longueur d'avance ?", subheadline: "Télécharge le guide complet maintenant, pour seulement 3 000 FCFA.",
        ctaText: "📥  Je télécharge le guide complet", ctaLink: "",
      },
    },
    // ─── IMAGINE TA VIE APRÈS ────────────────────────────────────────────────
    {
      id: nid(), type: "section",
      data: {
        bgColor: "#f0fdf4", paddingY: 64, paddingX: 16, maxWidth: 1080,
        blocks: [
          { id: nid(), type: "heading", data: { content: "Imagine ta vie après la lecture de ce guide", level: 2, align: "center", color: "#0b3b20" } },
          { id: nid(), type: "spacer", data: { height: 24 } },
          { id: nid(), type: "row",
            data: {
              gap: 48, padding: 0,
              columns: [
                { blocks: [
                  { id: nid(), type: "image", data: { url: img("ebook-stack-green", 700, 900), alt: "Le guide", align: "center", radius: 16 } },
                ] },
                { blocks: [
                  { id: nid(), type: "list", data: { items: ["Tu arrêtes de courir dans tous les sens", "Tu sais enfin sur quoi te concentrer", "Tu réussis tes relations sans te laisser influencer", "Tu avances avec un vrai plan, pas au hasard"], icon: "task_alt", color: "#65a30d" } },
                ] },
              ],
            },
          },
        ],
      },
    },
    // ─── POURQUOI C'EST DIFFÉRENT ────────────────────────────────────────────
    {
      id: nid(), type: "section",
      data: {
        bgColor: "#0b3b20", textColor: "#ffffff", paddingY: 64, paddingX: 16, maxWidth: 1080,
        blocks: [
          { id: nid(), type: "heading", data: { content: "Pourquoi ce guide est différent des autres ?", level: 2, align: "center", color: "#ffffff" } },
          { id: nid(), type: "spacer", data: { height: 28 } },
          { id: nid(), type: "row",
            data: {
              gap: 24, padding: 0,
              columns: [
                { blocks: [{ id: nid(), type: "icon-box", data: { icon: "bolt", title: "Direct et concret", desc: "Pas de blabla : des conseils que tu appliques dès aujourd'hui.", align: "center", color: "#bef264" } }] },
                { blocks: [{ id: nid(), type: "icon-box", data: { icon: "checklist", title: "Actionnable", desc: "Chaque étape contient des exercices simples pour passer à l'action.", align: "center", color: "#bef264" } }] },
                { blocks: [{ id: nid(), type: "icon-box", data: { icon: "wallet", title: "Accessible", desc: "À un prix mini pour que personne ne reste sur le bord de la route.", align: "center", color: "#bef264" } }] },
              ],
            },
          },
          { id: nid(), type: "spacer", data: { height: 28 } },
          { id: nid(), type: "button", data: { text: "📥  Je télécharge le guide complet — 3 000 FCFA", link: "", style: "primary", size: "lg", align: "center", bgColor: "#65a30d", textColor: "#ffffff", fullWidth: true, icon: "" } },
        ],
      },
    },
  ],
};

// ═════════════════════════════════════════════════════════════════════════════
// T2 — MASTERCLASS / WEBINAIRE  (bleu + or)  → key: webinar-live
// Inscription à une masterclass / atelier, avec compte à rebours.
// ═════════════════════════════════════════════════════════════════════════════
const masterclass: LandingTemplate = {
  key: "webinar-live",
  label: "Masterclass / Webinaire",
  tagline: "Inscription à un atelier live",
  description:
    "Pour remplir une masterclass ou un atelier en ligne. Compte à rebours, gros titre transformationnel, « ce que vous allez apprendre » en 3 étapes, « à qui ça s'adresse », bio de l'expert et FAQ. Bleu nuit + accents or.",
  vibe: "event",
  icon: "podcasts",
  palette: ["#1e3a8a", "#facc15", "#ffffff"],
  preview: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 55%, #facc15 100%)",
  uniqueElements: ["Compte à rebours en haut", "« Vous allez apprendre » en 3 étapes", "« À qui s'adresse » (pour / pas pour)"],
  build: () => [
    // ─── COUNTDOWN ───────────────────────────────────────────────────────────
    {
      id: nid(), type: "countdown",
      data: { title: "⏱  La masterclass démarre dans :", endsInHours: 72, subtitle: "Places limitées — inscris-toi avant la fermeture des portes." },
    },
    // ─── HERO ────────────────────────────────────────────────────────────────
    {
      id: nid(), type: "section",
      data: {
        bgColor: "linear-gradient(135deg, #1e3a8a, #1d4ed8)", textColor: "#ffffff",
        paddingY: 72, paddingX: 16, maxWidth: 920,
        blocks: [
          { id: nid(), type: "text", data: { content: "MASTERCLASS GRATUITE EN LIGNE", align: "center", size: 13, color: "#facc15" } },
          { id: nid(), type: "heading", data: { content: "Découvre comment la discipline et les bonnes habitudes transforment ton corps, ton mental et ton quotidien", level: 1, align: "center", color: "#ffffff" } },
          { id: nid(), type: "text", data: { content: "Une masterclass concrète : pas de théorie inutile, des méthodes que tu appliques dès le lendemain.", align: "center", size: 17, color: "#dbeafe" } },
          { id: nid(), type: "spacer", data: { height: 20 } },
          { id: nid(), type: "button", data: { text: "🎟️  Je réserve ma place gratuite", link: "", style: "primary", size: "lg", align: "center", bgColor: "#facc15", textColor: "#1e3a8a", fullWidth: false, icon: "" } },
        ],
      },
    },
    // ─── DATE / HEURE / PLACES ───────────────────────────────────────────────
    {
      id: nid(), type: "stats",
      data: {
        title: "", subtitle: "", columns: 3, bgColor: "#ffffff", valueColor: "#1e3a8a",
        items: [
          { value: "Sam.", prefix: "", suffix: " 20h", label: "Date & heure (GMT)", icon: "event" },
          { value: "100", prefix: "", suffix: "%", label: "En ligne, depuis chez toi", icon: "videocam" },
          { value: "200", prefix: "", suffix: " places", label: "Limité, sans rediffusion", icon: "groups" },
        ],
      },
    },
    // ─── VOUS ALLEZ APPRENDRE ────────────────────────────────────────────────
    {
      id: nid(), type: "features",
      data: {
        title: "Ce que tu vas apprendre", columns: 3,
        items: [
          { icon: "looks_one", title: "Étape 1 — Structurer", desc: "Comment construire un entraînement et une routine qui tiennent dans le temps." },
          { icon: "looks_two", title: "Étape 2 — Tenir", desc: "Développer la discipline et la constance, même les jours sans motivation." },
          { icon: "looks_3", title: "Étape 3 — Transformer", desc: "Activer le bon mental pour améliorer ton corps ET ton quotidien." },
        ],
      },
    },
    // ─── À QUI S'ADRESSE ─────────────────────────────────────────────────────
    {
      id: nid(), type: "section",
      data: {
        bgColor: "#f8fafc", paddingY: 64, paddingX: 16, maxWidth: 1080,
        blocks: [
          { id: nid(), type: "heading", data: { content: "À qui s'adresse cette masterclass ?", level: 2, align: "center", color: "#1e3a8a" } },
          { id: nid(), type: "spacer", data: { height: 24 } },
          { id: nid(), type: "row",
            data: {
              gap: 32, padding: 0,
              columns: [
                { blocks: [
                  { id: nid(), type: "heading", data: { content: "✅  Pour toi si…", level: 3, align: "left", color: "#16a34a" } },
                  { id: nid(), type: "list", data: { items: ["Tu veux reprendre ton corps et ton mental en main", "Tu as déjà essayé seul sans tenir dans la durée", "Tu cherches une méthode simple et réaliste"], icon: "check_circle", color: "#16a34a" } },
                ] },
                { blocks: [
                  { id: nid(), type: "heading", data: { content: "❌  Pas pour toi si…", level: 3, align: "left", color: "#dc2626" } },
                  { id: nid(), type: "list", data: { items: ["Tu cherches une solution magique sans effort", "Tu ne veux rien changer à tes habitudes", "Tu n'es pas prêt à passer à l'action"], icon: "cancel", color: "#dc2626" } },
                ] },
              ],
            },
          },
        ],
      },
    },
    // ─── QUI EST DERRIÈRE ────────────────────────────────────────────────────
    {
      id: nid(), type: "section",
      data: {
        bgColor: "#ffffff", paddingY: 64, paddingX: 16, maxWidth: 980,
        blocks: [
          { id: nid(), type: "heading", data: { content: "Qui est derrière cet atelier ?", level: 2, align: "center", color: "#1e3a8a" } },
          { id: nid(), type: "spacer", data: { height: 24 } },
          { id: nid(), type: "row",
            data: {
              gap: 40, padding: 0,
              columns: [
                { blocks: [
                  { id: nid(), type: "image", data: { url: img("coach-portrait-blue", 600, 600), alt: "L'expert", align: "center", radius: 200 } },
                ] },
                { blocks: [
                  { id: nid(), type: "text", data: { content: "Coach et fondateur, je transmets depuis des années des méthodes simples pour transformer son corps et son mental. Cette masterclass est le condensé de ce qui fonctionne vraiment sur le terrain.", align: "left", size: 17, color: "#475569" } },
                  { id: nid(), type: "spacer", data: { height: 12 } },
                  { id: nid(), type: "list", data: { items: ["+ 5 000 personnes accompagnées", "Méthode testée sur le terrain", "Approche concrète, zéro blabla"], icon: "verified", color: "#facc15" } },
                ] },
              ],
            },
          },
        ],
      },
    },
    // ─── FAQ ─────────────────────────────────────────────────────────────────
    {
      id: nid(), type: "faq",
      data: {
        title: "Questions fréquentes",
        items: [
          { q: "C'est vraiment gratuit ?", a: "Oui, l'inscription à la masterclass est 100 % gratuite. Il te suffit de réserver ta place." },
          { q: "Y aura-t-il une rediffusion ?", a: "Non, c'est un live unique sans rediffusion. Sois présent le jour J pour ne rien manquer." },
          { q: "J'ai un niveau débutant, c'est adapté ?", a: "Parfaitement. La méthode est pensée pour partir de zéro, étape par étape." },
        ],
      },
    },
    // ─── CTA FINALE ──────────────────────────────────────────────────────────
    {
      id: nid(), type: "cta",
      data: {
        headline: "Réserve ta place avant la fermeture", subheadline: "Les portes ferment dès que les 200 places sont prises.",
        ctaText: "🎟️  Je réserve ma place gratuite", ctaLink: "",
      },
    },
  ],
};

// ═════════════════════════════════════════════════════════════════════════════
// T3 — PACK PRODUIT (urgence)  (rouge / noir)  → key: lancement-express
// Page de vente d'un produit digital (pack, templates, ressources) avec urgence.
// ═════════════════════════════════════════════════════════════════════════════
const packProduit: LandingTemplate = {
  key: "lancement-express",
  label: "Pack produit (urgence)",
  tagline: "Vente flash de produit digital",
  description:
    "Pour vendre un pack de ressources / templates / produits digitaux avec urgence. Compte à rebours, double CTA, barre de logos, aperçus visuels du produit, preuves chiffrées et garantie. Rouge intense sur fond sombre.",
  vibe: "urgency",
  icon: "local_fire_department",
  palette: ["#dc2626", "#0a0a0a", "#ffffff"],
  preview: "linear-gradient(135deg, #0a0a0a 0%, #450a0a 55%, #dc2626 100%)",
  uniqueElements: ["Compte à rebours d'offre", "Double CTA (2 packs)", "Galerie d'aperçus + garantie"],
  build: () => [
    // ─── COUNTDOWN ───────────────────────────────────────────────────────────
    {
      id: nid(), type: "countdown",
      data: { title: "🔥  Offre de lancement — se termine dans :", endsInHours: 48, subtitle: "Après le compte à rebours, retour au tarif plein." },
    },
    // ─── HERO + DOUBLE CTA ───────────────────────────────────────────────────
    {
      id: nid(), type: "section",
      data: {
        bgColor: "linear-gradient(135deg, #0a0a0a, #450a0a)", textColor: "#ffffff",
        paddingY: 72, paddingX: 16, maxWidth: 980,
        blocks: [
          { id: nid(), type: "text", data: { content: "ÉDITION LIMITÉE", align: "center", size: 13, color: "#f87171" } },
          { id: nid(), type: "heading", data: { content: "Boostez votre site avec nos packs de thèmes premium — à prix mini", level: 1, align: "center", color: "#ffffff" } },
          { id: nid(), type: "text", data: { content: "Développeur ou entrepreneur ? Profitez de centaines de ressources premium pour vos projets, à une fraction du prix.", align: "center", size: 17, color: "#fecaca" } },
          { id: nid(), type: "spacer", data: { height: 24 } },
          { id: nid(), type: "row",
            data: {
              gap: 16, padding: 0,
              columns: [
                { blocks: [{ id: nid(), type: "button", data: { text: "🛒  Pack Shopify", link: "", style: "primary", size: "lg", align: "center", bgColor: "#dc2626", textColor: "#ffffff", fullWidth: true, icon: "" } }] },
                { blocks: [{ id: nid(), type: "button", data: { text: "🛒  Pack WordPress", link: "", style: "primary", size: "lg", align: "center", bgColor: "#ffffff", textColor: "#0a0a0a", fullWidth: true, icon: "" } }] },
              ],
            },
          },
        ],
      },
    },
    // ─── BARRE DE LOGOS / CHIFFRES ───────────────────────────────────────────
    {
      id: nid(), type: "stats",
      data: {
        title: "", subtitle: "", columns: 3, bgColor: "#0a0a0a", valueColor: "#f87171",
        items: [
          { value: "300", prefix: "+", suffix: "", label: "Thèmes WordPress", icon: "wordpress" },
          { value: "200", prefix: "+", suffix: "", label: "Thèmes Shopify", icon: "storefront" },
          { value: "100", prefix: "+", suffix: "", label: "Templates HTML", icon: "code" },
        ],
      },
    },
    // ─── CE QUE CONTIENT LE PACK ─────────────────────────────────────────────
    {
      id: nid(), type: "features",
      data: {
        title: "Ce que contient le pack", columns: 3,
        items: [
          { icon: "palette", title: "Thèmes premium", desc: "Des designs professionnels prêts à l'emploi pour tout type de boutique." },
          { icon: "phone_iphone", title: "100 % responsive", desc: "Parfaits sur mobile, tablette et desktop, sans réglage." },
          { icon: "bolt", title: "Optimisés vitesse", desc: "Chargement rapide et code propre pour un meilleur référencement." },
          { icon: "tune", title: "Faciles à personnaliser", desc: "Couleurs, polices, sections : adaptez tout en quelques clics." },
          { icon: "download", title: "Téléchargement immédiat", desc: "Accès instantané à tous les fichiers après paiement." },
          { icon: "update", title: "Mises à jour incluses", desc: "Vous recevez les nouvelles versions sans surcoût." },
        ],
      },
    },
    // ─── APERÇU DES THÈMES (galerie) ─────────────────────────────────────────
    {
      id: nid(), type: "section",
      data: {
        bgColor: "#ffffff", paddingY: 56, paddingX: 16, maxWidth: 1152,
        blocks: [
          { id: nid(), type: "heading", data: { content: "Quelques aperçus des thèmes à recevoir", level: 2, align: "center", color: "#0a0a0a" } },
          { id: nid(), type: "spacer", data: { height: 24 } },
          { id: nid(), type: "image-gallery", data: { columns: 3, gap: 12, radius: 12, images: [
            { url: img("theme-shop-1", 600, 400), alt: "Thème 1" },
            { url: img("theme-shop-2", 600, 400), alt: "Thème 2" },
            { url: img("theme-shop-3", 600, 400), alt: "Thème 3" },
            { url: img("theme-shop-4", 600, 400), alt: "Thème 4" },
            { url: img("theme-shop-5", 600, 400), alt: "Thème 5" },
            { url: img("theme-shop-6", 600, 400), alt: "Thème 6" },
          ] } },
        ],
      },
    },
    // ─── TÉMOIGNAGES ─────────────────────────────────────────────────────────
    {
      id: nid(), type: "testimonials",
      data: {
        title: "Ils ont boosté leur site", columns: 2,
        items: [
          { name: "Narcisse T.", role: "Développeur web · Lomé", text: "Un rapport qualité/prix imbattable. J'ai livré 3 boutiques en une semaine grâce à ce pack.", rating: 5 },
          { name: "Aïcha B.", role: "E-commerçante · Abidjan", text: "Les thèmes sont magnifiques et faciles à modifier. Ma boutique a enfin l'air pro.", rating: 5 },
        ],
      },
    },
    // ─── GARANTIE ────────────────────────────────────────────────────────────
    {
      id: nid(), type: "guarantee",
      data: {
        icon: "verified_user", title: "Satisfait ou remboursé 14 jours", style: "card", accentColor: "#dc2626",
        text: "Si le pack ne vous convient pas, vous êtes remboursé sous 14 jours. Aucun risque.",
      },
    },
    // ─── PRICING ─────────────────────────────────────────────────────────────
    {
      id: nid(), type: "pricing",
      data: {
        title: "Pack complet — offre de lancement", price: 15000, originalPrice: 45000, currency: "FCFA",
        benefitIcon: "check_circle", accentColor: "#dc2626",
        benefits: ["Tous les thèmes Shopify + WordPress", "+ 100 templates HTML offerts", "Téléchargement immédiat", "Mises à jour à vie incluses"],
        ctaText: "🔥  J'en profite maintenant", ctaLink: "",
        badgeText: "-66 %", badgeColor: "#dc2626",
        guaranteeText: "Paiement sécurisé · Garantie 14 jours",
      },
    },
  ],
};

// ═════════════════════════════════════════════════════════════════════════════
// T4 — COACHING PREMIUM  (navy + or)  → key: coach-premium
// Accompagnement individuel haut de gamme — prise de rendez-vous.
// ═════════════════════════════════════════════════════════════════════════════
const coachPremium: LandingTemplate = {
  key: "coach-premium",
  label: "Coaching Premium",
  tagline: "Accompagnement haut de gamme",
  description:
    "Pour mentors et consultants qui vendent un accompagnement individuel. Hero portrait + promesse, méthode en 3 phases, résultats clients, offre claire avec réservation d'appel. Navy profond + accents or = prestige.",
  vibe: "premium",
  icon: "diamond",
  palette: ["#0f172a", "#fbbf24", "#f8fafc"],
  preview: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #fbbf24 100%)",
  uniqueElements: ["Hero portrait + promesse", "Méthode en 3 phases", "CTA « Réserver un appel »"],
  build: () => [
    {
      id: nid(), type: "section",
      data: {
        bgColor: "linear-gradient(135deg, #0f172a, #1e293b)", textColor: "#ffffff",
        paddingY: 80, paddingX: 16, maxWidth: 1280,
        blocks: [
          { id: nid(), type: "row",
            data: {
              gap: 56, padding: 0,
              columns: [
                { blocks: [
                  { id: nid(), type: "image", data: { url: img("coach-portrait-navy", 800, 1000), alt: "Votre coach", align: "center", radius: 24 } },
                ] },
                { blocks: [
                  { id: nid(), type: "text", data: { content: "✨  COACHING PERSONNALISÉ", align: "left", size: 13, color: "#fbbf24" } },
                  { id: nid(), type: "heading", data: { content: "Atteignez votre prochain palier en 90 jours", level: 1, align: "left", color: "#ffffff" } },
                  { id: nid(), type: "text", data: { content: "Un accompagnement intensif pour les ambitieux qui veulent franchir un cap décisif sans perdre 2 ans à tâtonner.", align: "left", size: 18, color: "#cbd5e1" } },
                  { id: nid(), type: "spacer", data: { height: 12 } },
                  { id: nid(), type: "list", data: { items: ["12 sessions individuelles · 1h chacune", "Plan personnalisé sur 90 jours", "WhatsApp prioritaire entre les séances"], icon: "verified", color: "#fbbf24" } },
                  { id: nid(), type: "spacer", data: { height: 16 } },
                  { id: nid(), type: "button", data: { text: "📞  Réserver mon appel découverte (gratuit)", link: "", style: "primary", size: "lg", align: "left", bgColor: "#fbbf24", textColor: "#0f172a", fullWidth: false, icon: "" } },
                ] },
              ],
            },
          },
        ],
      },
    },
    {
      id: nid(), type: "stats",
      data: {
        title: "", subtitle: "", columns: 3, bgColor: "#f8fafc", valueColor: "#0f172a",
        items: [
          { value: "200", prefix: "+", suffix: "", label: "Personnes accompagnées", icon: "groups" },
          { value: "92", prefix: "", suffix: "%", label: "Atteignent leur objectif", icon: "trending_up" },
          { value: "10", prefix: "", suffix: " ans", label: "D'expérience terrain", icon: "workspace_premium" },
        ],
      },
    },
    {
      id: nid(), type: "features",
      data: {
        title: "Ma méthode en 3 phases", columns: 3,
        items: [
          { icon: "search", title: "Phase 1 · Diagnostic", desc: "Audit complet : forces, blocages, opportunités. Vous savez où vous en êtes vraiment." },
          { icon: "rocket_launch", title: "Phase 2 · Plan d'action", desc: "Une feuille de route claire sur 90 jours, avec des objectifs mesurables." },
          { icon: "support_agent", title: "Phase 3 · Accompagnement", desc: "12 sessions + suivi prioritaire. Vous n'avancez plus jamais seul." },
        ],
      },
    },
    {
      id: nid(), type: "testimonials",
      data: {
        title: "Résultats concrets de mes clients", columns: 2,
        items: [
          { name: "Aminata D.", role: "Fondatrice e-commerce · Dakar", text: "En 4 mois, j'ai triplé mon chiffre et structuré une équipe de 8 personnes. L'investissement le plus rentable de ma carrière.", rating: 5 },
          { name: "Marc-Étienne L.", role: "Dirigeant · Abidjan", text: "Sans cette méthode, je tournerais encore en rond. La clarté apportée vaut largement le prix.", rating: 5 },
        ],
      },
    },
    {
      id: nid(), type: "pricing",
      data: {
        title: "Programme complet 90 jours", price: 250000, originalPrice: 0, currency: "FCFA",
        benefitIcon: "verified", accentColor: "#fbbf24",
        benefits: ["12 sessions individuelles", "Plan d'action personnalisé", "Accès WhatsApp prioritaire", "Ressources et modèles exclusifs"],
        ctaText: "📞  Réserver mon appel découverte", ctaLink: "",
        badgeText: "Places limitées", badgeColor: "#0f172a",
        guaranteeText: "Échange sans engagement lors de l'appel découverte",
      },
    },
    {
      id: nid(), type: "faq",
      data: {
        title: "Questions fréquentes",
        items: [
          { q: "Comment se passe l'appel découverte ?", a: "30 minutes pour comprendre votre situation et voir si l'accompagnement est fait pour vous. Sans engagement." },
          { q: "À distance ou en présentiel ?", a: "Les sessions se font en visio, où que vous soyez." },
        ],
      },
    },
  ],
};

// ═════════════════════════════════════════════════════════════════════════════
// T5 — FORMATION EN LIGNE  (bleu moderne)  → key: saas-tech
// Vente d'une formation vidéo — programme détaillé + preuve + prix.
// ═════════════════════════════════════════════════════════════════════════════
const formationEnLigne: LandingTemplate = {
  key: "saas-tech",
  label: "Formation en ligne",
  tagline: "Vente d'une formation vidéo",
  description:
    "Pour vendre une formation vidéo complète. Hero avec vidéo de présentation, programme module par module, résultats des élèves, offre claire et FAQ. Bleu moderne, lisible et rassurant.",
  vibe: "tech",
  icon: "school",
  palette: ["#2563eb", "#06b6d4", "#0f172a"],
  preview: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #06b6d4 100%)",
  uniqueElements: ["Hero vidéo de présentation", "Programme module par module", "Offre + garantie + FAQ"],
  build: () => [
    {
      id: nid(), type: "section",
      data: {
        bgColor: "linear-gradient(135deg, #0f172a, #1e3a8a)", textColor: "#ffffff",
        paddingY: 64, paddingX: 16, maxWidth: 900,
        blocks: [
          { id: nid(), type: "text", data: { content: "FORMATION EN LIGNE", align: "center", size: 13, color: "#67e8f9" } },
          { id: nid(), type: "heading", data: { content: "Maîtrise une nouvelle compétence et lance ton activité en 30 jours", level: 1, align: "center", color: "#ffffff" } },
          { id: nid(), type: "text", data: { content: "De zéro à autonome : une méthode pas à pas, en vidéo, que tu suis à ton rythme.", align: "center", size: 17, color: "#cbd5e1" } },
          { id: nid(), type: "spacer", data: { height: 20 } },
          { id: nid(), type: "video", data: { externalUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", url: "", caption: "Aperçu de la formation" } },
          { id: nid(), type: "spacer", data: { height: 20 } },
          { id: nid(), type: "button", data: { text: "🚀  J'accède à la formation", link: "", style: "primary", size: "lg", align: "center", bgColor: "#06b6d4", textColor: "#0f172a", fullWidth: false, icon: "" } },
        ],
      },
    },
    {
      id: nid(), type: "stats",
      data: {
        title: "", subtitle: "", columns: 3, bgColor: "#ffffff", valueColor: "#2563eb",
        items: [
          { value: "1200", prefix: "+", suffix: "", label: "Élèves formés", icon: "groups" },
          { value: "4.9", prefix: "", suffix: "/5", label: "Note moyenne", icon: "star" },
          { value: "30", prefix: "", suffix: " jours", label: "Pour des résultats", icon: "calendar_month" },
        ],
      },
    },
    {
      id: nid(), type: "features",
      data: {
        title: "Le programme module par module", columns: 2,
        items: [
          { icon: "play_circle", title: "Module 1 — Les fondations", desc: "Tout ce qu'il faut comprendre avant de commencer, sans jargon." },
          { icon: "play_circle", title: "Module 2 — La pratique", desc: "On passe à l'action avec des exercices guidés, étape par étape." },
          { icon: "play_circle", title: "Module 3 — Aller plus loin", desc: "Les techniques avancées pour te démarquer rapidement." },
          { icon: "play_circle", title: "Module 4 — Lancer & vendre", desc: "Comment transformer ta compétence en premiers revenus." },
        ],
      },
    },
    {
      id: nid(), type: "testimonials",
      data: {
        title: "Ce que disent les élèves", columns: 2,
        items: [
          { name: "Koffi A.", role: "Marketing digital · Accra", text: "Claire, concrète, sans perte de temps. J'ai eu mes premiers clients avant la fin de la formation.", rating: 5 },
          { name: "Fatou S.", role: "Freelance · Dakar", text: "Le meilleur investissement que j'ai fait cette année. Tout est expliqué simplement.", rating: 5 },
        ],
      },
    },
    {
      id: nid(), type: "pricing",
      data: {
        title: "Accès complet à la formation", price: 35000, originalPrice: 60000, currency: "FCFA",
        benefitIcon: "check_circle", accentColor: "#2563eb",
        benefits: ["Tous les modules vidéo", "Accès à vie + mises à jour", "Certificat de réussite", "Communauté privée des élèves"],
        ctaText: "🚀  J'accède à la formation", ctaLink: "",
        badgeText: "Accès à vie", badgeColor: "#2563eb",
        guaranteeText: "Garantie satisfait ou remboursé 14 jours",
      },
    },
    {
      id: nid(), type: "guarantee",
      data: {
        icon: "verified_user", title: "Garantie 14 jours", style: "banner", accentColor: "#06b6d4",
        text: "Testez la formation sans risque. Remboursement intégral sous 14 jours si elle ne vous convient pas.",
      },
    },
    {
      id: nid(), type: "faq",
      data: {
        title: "Questions fréquentes",
        items: [
          { q: "Pendant combien de temps j'ai accès ?", a: "À vie, mises à jour comprises. Vous suivez à votre rythme." },
          { q: "Je débute totalement, c'est pour moi ?", a: "Oui, la formation part de zéro et avance progressivement." },
          { q: "Comment je paie ?", a: "Carte bancaire ou Mobile Money (Orange, Wave, MTN). Accès immédiat après paiement." },
        ],
      },
    },
  ],
};

// ═════════════════════════════════════════════════════════════════════════════
// T6 — SERVICE / CONSULTING  (clair, corporate)  → key: business-b2b
// Page de prise de contact pour une prestation de service / agence.
// ═════════════════════════════════════════════════════════════════════════════
const serviceB2B: LandingTemplate = {
  key: "business-b2b",
  label: "Service / Prestation",
  tagline: "Page de prise de contact pro",
  description:
    "Pour vendre une prestation de service ou une offre d'agence. Hero rassurant, bénéfices clairs, comparaison « avec vous / sans vous », preuves chiffrées et appel à l'action vers un devis. Sobre et crédible.",
  vibe: "corporate",
  icon: "corporate_fare",
  palette: ["#0369a1", "#0ea5e9", "#f1f5f9"],
  preview: "linear-gradient(135deg, #0369a1 0%, #0ea5e9 60%, #f1f5f9 100%)",
  uniqueElements: ["Hero crédibilité", "Comparaison avant/après", "CTA « Demander un devis »"],
  build: () => [
    {
      id: nid(), type: "section",
      data: {
        bgColor: "linear-gradient(135deg, #0369a1, #0ea5e9)", textColor: "#ffffff",
        paddingY: 72, paddingX: 16, maxWidth: 920,
        blocks: [
          { id: nid(), type: "text", data: { content: "PRESTATION SUR MESURE", align: "center", size: 13, color: "#bae6fd" } },
          { id: nid(), type: "heading", data: { content: "Confiez votre projet à une équipe qui livre vraiment", level: 1, align: "center", color: "#ffffff" } },
          { id: nid(), type: "text", data: { content: "Un accompagnement clé en main, des délais tenus, un résultat à la hauteur de vos ambitions.", align: "center", size: 17, color: "#e0f2fe" } },
          { id: nid(), type: "spacer", data: { height: 20 } },
          { id: nid(), type: "button", data: { text: "✉️  Demander un devis gratuit", link: "", style: "primary", size: "lg", align: "center", bgColor: "#ffffff", textColor: "#0369a1", fullWidth: false, icon: "" } },
        ],
      },
    },
    {
      id: nid(), type: "stats",
      data: {
        title: "", subtitle: "", columns: 4, bgColor: "#ffffff", valueColor: "#0369a1",
        items: [
          { value: "500", prefix: "+", suffix: "", label: "Projets livrés", icon: "task_alt" },
          { value: "12", prefix: "", suffix: " ans", label: "D'expertise", icon: "school" },
          { value: "94", prefix: "", suffix: "%", label: "Clients satisfaits", icon: "thumb_up" },
          { value: "48", prefix: "", suffix: "h", label: "Réponse garantie", icon: "schedule" },
        ],
      },
    },
    {
      id: nid(), type: "features",
      data: {
        title: "Pourquoi nous confier votre projet", columns: 3,
        items: [
          { icon: "verified", title: "Expertise prouvée", desc: "Des années d'expérience et des centaines de projets réussis." },
          { icon: "schedule", title: "Délais respectés", desc: "Un planning clair, des points réguliers, zéro mauvaise surprise." },
          { icon: "support_agent", title: "Accompagnement dédié", desc: "Un interlocuteur unique, disponible et réactif tout au long du projet." },
        ],
      },
    },
    {
      id: nid(), type: "comparison",
      data: {
        title: "La différence", highlightColumn: 1, accentColor: "#0ea5e9",
        columns: ["Sans nous", "Avec nous"],
        rows: [
          { label: "Délais", values: ["Repoussés sans cesse", "Tenus, avec un planning clair"] },
          { label: "Qualité", values: ["Variable", "Constante et vérifiée"] },
          { label: "Communication", values: ["Vous relancez", "On vous tient informé"] },
          { label: "Résultat", values: ["Incertain", "Garanti contractuellement"] },
        ],
      },
    },
    {
      id: nid(), type: "testimonials",
      data: {
        title: "Ils nous ont fait confiance", columns: 2,
        items: [
          { name: "Société Horizon", role: "Directeur · Abidjan", text: "Travail sérieux, délais tenus, communication parfaite. On recommande sans hésiter.", rating: 5 },
          { name: "Groupe Sahel", role: "Responsable projet · Dakar", text: "Une équipe vraiment professionnelle. Le résultat a dépassé nos attentes.", rating: 5 },
        ],
      },
    },
    {
      id: nid(), type: "cta",
      data: {
        headline: "Parlons de votre projet", subheadline: "Recevez un devis personnalisé et sans engagement sous 48h.",
        ctaText: "✉️  Demander un devis gratuit", ctaLink: "",
      },
    },
  ],
};

export const LANDING_TEMPLATES: LandingTemplate[] = [
  guideVsl,
  masterclass,
  packProduit,
  coachPremium,
  formationEnLigne,
  serviceB2B,
];
