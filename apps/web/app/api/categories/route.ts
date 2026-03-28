import { NextRequest, NextResponse } from "next/server";

// Categories et sous-categories de la plateforme
// TODO: Production — charger depuis Prisma

const CATEGORIES = [
  {
    id: "cat_dev",
    name: "Développement & IT",
    slug: "developpement-it",
    icon: "code",
    children: [
      { id: "sub_web", name: "Sites web", slug: "sites-web" },
      { id: "sub_mobile", name: "Applications mobiles", slug: "applications-mobiles" },
      { id: "sub_wordpress", name: "WordPress", slug: "wordpress" },
      { id: "sub_ecommerce", name: "E-commerce", slug: "e-commerce" },
      { id: "sub_api", name: "APIs & Backend", slug: "apis-backend" },
      { id: "sub_devops", name: "DevOps & Cloud", slug: "devops-cloud" },
      { id: "sub_games", name: "Jeux vidéo", slug: "jeux-video" },
      { id: "sub_blockchain", name: "Blockchain & Web3", slug: "blockchain-web3" },
    ],
    tags: ["react", "next.js", "node.js", "python", "wordpress", "shopify", "api", "typescript", "flutter", "swift"],
  },
  {
    id: "cat_design",
    name: "Design & Graphisme",
    slug: "design-graphisme",
    icon: "palette",
    children: [
      { id: "sub_logo", name: "Logo & Identité visuelle", slug: "logo-identite" },
      { id: "sub_ui", name: "UI/UX Design", slug: "ui-ux-design" },
      { id: "sub_illustration", name: "Illustration", slug: "illustration" },
      { id: "sub_print", name: "Print & Packaging", slug: "print-packaging" },
      { id: "sub_social", name: "Design réseaux sociaux", slug: "design-reseaux-sociaux" },
      { id: "sub_infographie", name: "Infographie", slug: "infographie" },
    ],
    tags: ["logo", "charte graphique", "illustration", "branding", "figma", "photoshop", "ui/ux", "bannière", "canva"],
  },
  {
    id: "cat_redaction",
    name: "Rédaction & Traduction",
    slug: "redaction-traduction",
    icon: "edit_note",
    children: [
      { id: "sub_articles", name: "Articles de blog", slug: "articles-blog" },
      { id: "sub_copywriting", name: "Copywriting", slug: "copywriting" },
      { id: "sub_traduction", name: "Traduction", slug: "traduction" },
      { id: "sub_correction", name: "Correction & Relecture", slug: "correction-relecture" },
      { id: "sub_seo_redac", name: "Rédaction SEO", slug: "redaction-seo" },
      { id: "sub_ghostwriting", name: "Ghostwriting", slug: "ghostwriting" },
    ],
    tags: ["article", "blog", "traduction", "copywriting", "seo", "français", "anglais", "contenu", "ghostwriting"],
  },
  {
    id: "cat_marketing",
    name: "Marketing Digital",
    slug: "marketing-digital",
    icon: "campaign",
    children: [
      { id: "sub_seo", name: "SEO", slug: "seo" },
      { id: "sub_ads", name: "Publicité en ligne", slug: "publicite-en-ligne" },
      { id: "sub_social_media", name: "Community Management", slug: "community-management" },
      { id: "sub_email_mkt", name: "Email Marketing", slug: "email-marketing" },
      { id: "sub_analytics", name: "Analytics & Data", slug: "analytics-data" },
      { id: "sub_growth", name: "Growth Hacking", slug: "growth-hacking" },
    ],
    tags: ["seo", "google ads", "facebook ads", "instagram", "analytics", "emailing", "community management", "tiktok"],
  },
  {
    id: "cat_video",
    name: "Vidéo & Animation",
    slug: "video-animation",
    icon: "videocam",
    children: [
      { id: "sub_montage", name: "Montage vidéo", slug: "montage-video" },
      { id: "sub_motion", name: "Motion Design", slug: "motion-design" },
      { id: "sub_animation", name: "Animation 2D/3D", slug: "animation-2d-3d" },
      { id: "sub_intro", name: "Intros & Outros", slug: "intros-outros" },
      { id: "sub_explainer", name: "Vidéos explicatives", slug: "videos-explicatives" },
    ],
    tags: ["montage", "after effects", "premiere pro", "animation", "motion design", "3d", "intro", "davinci resolve"],
  },
  {
    id: "cat_business",
    name: "Business & Conseil",
    slug: "business-conseil",
    icon: "business_center",
    children: [
      { id: "sub_consulting", name: "Consulting", slug: "consulting" },
      { id: "sub_business_plan", name: "Business Plan", slug: "business-plan" },
      { id: "sub_rh", name: "Ressources humaines", slug: "ressources-humaines" },
      { id: "sub_juridique", name: "Juridique", slug: "juridique" },
      { id: "sub_strategie", name: "Stratégie d'entreprise", slug: "strategie-entreprise" },
    ],
    tags: ["consulting", "business plan", "stratégie", "rh", "recrutement", "management"],
  },
  {
    id: "cat_ia",
    name: "Intelligence Artificielle",
    slug: "intelligence-artificielle",
    icon: "smart_toy",
    children: [
      { id: "sub_chatbot", name: "Chatbots & Assistants IA", slug: "chatbots-assistants-ia" },
      { id: "sub_ml", name: "Machine Learning", slug: "machine-learning" },
      { id: "sub_automation_ia", name: "Automation IA", slug: "automation-ia" },
      { id: "sub_prompt", name: "Prompt Engineering", slug: "prompt-engineering" },
      { id: "sub_data_science", name: "Data Science", slug: "data-science" },
    ],
    tags: ["chatgpt", "midjourney", "machine learning", "python", "data science", "automation", "prompt", "stable diffusion"],
  },
  {
    id: "cat_musique",
    name: "Musique & Audio",
    slug: "musique-audio",
    icon: "music_note",
    children: [
      { id: "sub_voixoff", name: "Voix-off", slug: "voix-off" },
      { id: "sub_prod_musicale", name: "Production musicale", slug: "production-musicale" },
      { id: "sub_podcast", name: "Podcast", slug: "podcast" },
      { id: "sub_sound_design", name: "Sound Design", slug: "sound-design" },
      { id: "sub_mixage", name: "Mixage & Mastering", slug: "mixage-mastering" },
    ],
    tags: ["voix-off", "podcast", "musique", "jingle", "sound design", "mixage", "mastering", "beatmaking"],
  },
  {
    id: "cat_formation",
    name: "Formation & Coaching",
    slug: "formation-coaching",
    icon: "school",
    children: [
      { id: "sub_coaching_pro", name: "Coaching professionnel", slug: "coaching-professionnel" },
      { id: "sub_mentorat", name: "Mentorat", slug: "mentorat" },
      { id: "sub_creation_cours", name: "Création de cours en ligne", slug: "creation-cours" },
      { id: "sub_tutorat", name: "Tutorat", slug: "tutorat" },
      { id: "sub_formation_entreprise", name: "Formation en entreprise", slug: "formation-entreprise" },
    ],
    tags: ["coaching", "mentorat", "formation", "cours en ligne", "tutorat", "e-learning", "consulting"],
  },
  {
    id: "cat_photo",
    name: "Photographie",
    slug: "photographie",
    icon: "photo_camera",
    children: [
      { id: "sub_retouche", name: "Retouche photo", slug: "retouche-photo" },
      { id: "sub_shooting_produit", name: "Shooting produit", slug: "shooting-produit" },
      { id: "sub_portrait", name: "Portrait", slug: "portrait" },
      { id: "sub_photo_immo", name: "Photographie immobilière", slug: "photographie-immobiliere" },
      { id: "sub_photo_event", name: "Photographie événementielle", slug: "photographie-evenementielle" },
    ],
    tags: ["retouche", "lightroom", "photoshop", "packshot", "portrait", "immobilier", "événementiel"],
  },
  {
    id: "cat_archi",
    name: "Architecture & Ingénierie",
    slug: "architecture-ingenierie",
    icon: "architecture",
    children: [
      { id: "sub_cao", name: "CAO / DAO", slug: "cao-dao" },
      { id: "sub_plans_3d", name: "Plans & Modélisation 3D", slug: "plans-modelisation-3d" },
      { id: "sub_bim", name: "BIM", slug: "bim" },
      { id: "sub_calculs", name: "Calculs de structure", slug: "calculs-structure" },
      { id: "sub_archi_interieur", name: "Architecture d'intérieur", slug: "architecture-interieur" },
    ],
    tags: ["autocad", "revit", "sketchup", "3ds max", "bim", "architecture", "génie civil", "plans"],
  },
  {
    id: "cat_admin",
    name: "Secrétariat & Admin",
    slug: "secretariat-admin",
    icon: "support_agent",
    children: [
      { id: "sub_assistanat", name: "Assistanat virtuel", slug: "assistanat-virtuel" },
      { id: "sub_saisie", name: "Saisie de données", slug: "saisie-donnees" },
      { id: "sub_transcription", name: "Transcription", slug: "transcription" },
      { id: "sub_agenda", name: "Gestion d'agenda", slug: "gestion-agenda" },
      { id: "sub_service_client", name: "Service client", slug: "service-client" },
    ],
    tags: ["assistanat", "saisie", "transcription", "agenda", "service client", "administratif", "excel"],
  },
  {
    id: "cat_cyber",
    name: "Cybersécurité",
    slug: "cybersecurite",
    icon: "security",
    children: [
      { id: "sub_audit_secu", name: "Audit de sécurité", slug: "audit-securite" },
      { id: "sub_pentest", name: "Pentest", slug: "pentest" },
      { id: "sub_rgpd", name: "RGPD & Conformité", slug: "rgpd-conformite" },
      { id: "sub_sensibilisation", name: "Sensibilisation sécurité", slug: "sensibilisation-securite" },
      { id: "sub_securite_cloud", name: "Sécurité Cloud", slug: "securite-cloud" },
    ],
    tags: ["pentest", "rgpd", "audit", "sécurité", "firewall", "ethical hacking", "conformité"],
  },
  {
    id: "cat_finance",
    name: "Finance & Comptabilité",
    slug: "finance-comptabilite",
    icon: "account_balance",
    children: [
      { id: "sub_comptabilite", name: "Comptabilité", slug: "comptabilite" },
      { id: "sub_fiscalite", name: "Fiscalité", slug: "fiscalite" },
      { id: "sub_facturation", name: "Facturation", slug: "facturation" },
      { id: "sub_analyse_fin", name: "Analyse financière", slug: "analyse-financiere" },
      { id: "sub_paie", name: "Paie & Social", slug: "paie-social" },
    ],
    tags: ["comptabilité", "fiscalité", "facturation", "bilan", "paie", "tva", "excel", "sage"],
  },
  {
    id: "cat_lifestyle",
    name: "Lifestyle & Bien-être",
    slug: "lifestyle-bien-etre",
    icon: "spa",
    children: [
      { id: "sub_nutrition", name: "Nutrition", slug: "nutrition" },
      { id: "sub_fitness", name: "Fitness & Sport", slug: "fitness-sport" },
      { id: "sub_dev_perso", name: "Développement personnel", slug: "developpement-personnel" },
      { id: "sub_astrologie", name: "Astrologie & Voyance", slug: "astrologie-voyance" },
      { id: "sub_bien_etre", name: "Bien-être & Méditation", slug: "bien-etre-meditation" },
    ],
    tags: ["nutrition", "fitness", "coaching", "méditation", "développement personnel", "yoga", "bien-être"],
  },
];

// Normalise Prisma Category rows into the same shape as the hardcoded list
function normalisePrismaRow(row: {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}) {
  return { id: row.id, name: row.name, slug: row.slug, icon: row.icon ?? "category" };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parentId = searchParams.get("parentId");
  const withTags = searchParams.get("withTags") === "true";
  const categoryId = searchParams.get("categoryId");

  // Get tags for a specific category (hardcoded list only — tags not in DB yet)
  if (categoryId && withTags) {
    const category = CATEGORIES.find((c) => c.id === categoryId);
    return NextResponse.json({ tags: category?.tags || [] });
  }

  // Get subcategories for a parent (hardcoded list only — subcategories not in DB yet)
  if (parentId) {
    const parent = CATEGORIES.find((c) => c.id === parentId);
    return NextResponse.json({ subcategories: parent?.children || [] });
  }

  // Return all top-level categories: try Prisma first, fall back to hardcoded list
  try {
    const { prisma } = await import("@/lib/prisma");
    type CategoryRow = { id: string; name: string; slug: string; icon: string | null; color: string | null; description: string | null; order: number; isActive: boolean; parentId: string | null; createdAt: Date };
    const rows: CategoryRow[] = await prisma.category
      .findMany({ orderBy: { order: "asc" } })
      .catch(() => [] as CategoryRow[]);

    if (rows.length > 0) {
      return NextResponse.json({ categories: rows.map(normalisePrismaRow) });
    }
    // Prisma returned an empty table — fall through to static fallback
  } catch {
    // Prisma unavailable (e.g. Category model not yet migrated) — fall through
  }

  return NextResponse.json({
    categories: CATEGORIES.map(({ children, tags, ...cat }) => cat),
  });
}
