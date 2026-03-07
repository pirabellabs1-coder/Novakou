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
    ],
    tags: ["react", "next.js", "node.js", "python", "wordpress", "shopify", "api", "typescript"],
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
    ],
    tags: ["logo", "charte graphique", "illustration", "branding", "figma", "photoshop", "ui/ux", "bannière"],
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
    ],
    tags: ["article", "blog", "traduction", "copywriting", "seo", "français", "anglais", "contenu"],
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
    ],
    tags: ["seo", "google ads", "facebook ads", "instagram", "analytics", "emailing", "community management"],
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
    ],
    tags: ["montage", "after effects", "premiere pro", "animation", "motion design", "3d", "intro"],
  },
  {
    id: "cat_business",
    name: "Business & Conseil",
    slug: "business-conseil",
    icon: "business_center",
    children: [
      { id: "sub_consulting", name: "Consulting", slug: "consulting" },
      { id: "sub_business_plan", name: "Business Plan", slug: "business-plan" },
      { id: "sub_finance", name: "Finance & Comptabilité", slug: "finance-comptabilite" },
      { id: "sub_juridique", name: "Juridique", slug: "juridique" },
    ],
    tags: ["consulting", "business plan", "comptabilité", "juridique", "stratégie", "finance"],
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parentId = searchParams.get("parentId");
  const withTags = searchParams.get("withTags") === "true";
  const categoryId = searchParams.get("categoryId");

  // Get tags for a specific category
  if (categoryId && withTags) {
    const category = CATEGORIES.find((c) => c.id === categoryId);
    return NextResponse.json({ tags: category?.tags || [] });
  }

  // Get subcategories for a parent
  if (parentId) {
    const parent = CATEGORIES.find((c) => c.id === parentId);
    return NextResponse.json({ subcategories: parent?.children || [] });
  }

  // Return all top-level categories
  return NextResponse.json({
    categories: CATEGORIES.map(({ children, tags, ...cat }) => cat),
  });
}
