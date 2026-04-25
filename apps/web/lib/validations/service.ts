import { z } from "zod";
import { PLAN_RULES } from "@/lib/plans";

// ── Étape 1 — Titre et Catégorie ──

export const step1Schema = z.object({
  language: z.string().min(1, "Veuillez sélectionner une langue"),
  title: z
    .string()
    .min(10, "Le titre doit faire au moins 10 caractères")
    .max(100, "Le titre ne doit pas dépasser 100 caractères")
    .refine(
      (val) => !/\d+\s*[€$£]|[€$£]\s*\d+|\d+\s*euros?/i.test(val),
      "Ne mentionnez pas de prix dans le titre"
    ),
  categoryId: z.string().min(1, "Veuillez sélectionner une catégorie"),
  subCategoryId: z.string().min(1, "Veuillez sélectionner une sous-catégorie"),
  tags: z
    .array(z.string())
    .min(1, "Ajoutez au moins 1 tag")
    .max(5, "Maximum 5 tags"),
});

// ── Étape 2 — Prix et Description ──

export const step2Schema = z.object({
  basePrice: z
    .number()
    .min(10, "Le prix minimum est de 10 EUR")
    .max(5000, "Le prix maximum est de 5 000 EUR"),
  baseDeliveryDays: z
    .number()
    .min(1, "Le délai minimum est de 1 jour")
    .max(30, "Le délai maximum est de 30 jours"),
  description: z.any().refine(
    (val) => {
      if (!val) return false;
      // Markdown format: { type: "markdown", text: "..." }
      if (typeof val === "object" && val.type === "markdown" && typeof val.text === "string") {
        return val.text.trim().length >= 20;
      }
      // Legacy Tiptap JSON
      if (typeof val === "object" && val.type === "doc") {
        return JSON.stringify(val).length > 30;
      }
      return false;
    },
    "Veuillez rédiger une description (minimum 20 caractères)"
  ),
});

// ── Étape 3 — Forfaits B/S/P ──

export const packageTierSchema = z.object({
  name: z.string().min(1, "Le nom du forfait est requis"),
  price: z.number().min(5, "Le prix minimum est de 5 EUR").max(10000, "Le prix maximum est de 10 000 EUR"),
  deliveryDays: z.number().min(1, "Minimum 1 jour").max(60, "Maximum 60 jours"),
  revisions: z.number().min(0, "Minimum 0 révisions").max(99, "Maximum 99 révisions"),
  description: z.string().max(200, "Maximum 200 caractères").optional().default(""),
});

export const packageFeatureSchema = z.object({
  id: z.string(),
  label: z.string().min(1, "Le nom de la feature est requis"),
  includedInBasic: z.boolean(),
  includedInStandard: z.boolean(),
  includedInPremium: z.boolean(),
});

export const step3PackagesSchema = z.object({
  packages: z.object({
    basic: packageTierSchema,
    standard: packageTierSchema,
    premium: packageTierSchema,
    features: z.array(packageFeatureSchema),
  }).refine(
    (data) => data.basic.price <= data.standard.price && data.standard.price <= data.premium.price,
    { message: "Le prix doit être croissant : Basique ≤ Standard ≤ Premium" }
  ),
});

// ── Étape 4 — Options Supplémentaires ──

export const serviceOptionSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Le titre est requis").max(100),
  description: z.string().max(500).optional().default(""),
  extraPrice: z.number().min(0, "Le prix ne peut pas être négatif"),
  extraDays: z.number().min(0, "Le délai ne peut pas être négatif"),
  isRecommended: z.boolean().default(false),
  sortOrder: z.number().default(0),
  expressEnabled: z.boolean().default(false),
  expressPrice: z.number().min(0).optional(),
  expressDaysReduction: z.number().min(0).optional(),
});

export const step4Schema = z.object({
  options: z.array(serviceOptionSchema),
});

// ── Étape 5 — Livraison Express ──

export const step5Schema = z.object({
  baseExpressEnabled: z.boolean().default(false),
  baseExpressPrice: z.number().min(0).optional(),
  baseExpressDaysReduction: z.number().min(0).optional(),
  // Options express are part of the options array in step 3
});

// ── Étape 6 — Consignes de Réalisation ──

export const step6Schema = z.object({
  instructionsRequired: z.boolean(),
  instructionsContent: z.any().optional(),
}).refine(
  (data) => {
    if (data.instructionsRequired) {
      if (!data.instructionsContent) return false;
      const text = JSON.stringify(data.instructionsContent);
      return text.length > 30;
    }
    return true;
  },
  {
    message: "Veuillez rédiger vos consignes ou sélectionnez 'Pas de consignes nécessaires'",
    path: ["instructionsContent"],
  }
);

// ── Étape 7 — Galerie Médias ──

export const uploadedImageSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  width: z.number().optional(),
  height: z.number().optional(),
  file: z.any().optional(), // File object (client-side only)
});

export const step7Schema = z.object({
  mainImage: uploadedImageSchema.nullable().refine(
    (val) => val !== null,
    "L'image principale est obligatoire"
  ),
  additionalImages: z.array(uploadedImageSchema).max(5, "Maximum 5 images supplémentaires"),
  videoUrl: z.string().url().optional().or(z.literal("")),
});

// ── Étape 8 — Publication ──
// Pas de schéma spécifique, la validation utilise le schéma complet

// ── Schéma complet pour la publication ──

export const fullServiceSchema = z.object({
  // Step 1
  language: step1Schema.shape.language,
  title: step1Schema.shape.title,
  categoryId: step1Schema.shape.categoryId,
  subCategoryId: step1Schema.shape.subCategoryId,
  tags: step1Schema.shape.tags,
  // Step 2
  basePrice: step2Schema.shape.basePrice,
  baseDeliveryDays: step2Schema.shape.baseDeliveryDays,
  description: step2Schema.shape.description,
  // Step 3
  packages: z.object({
    basic: packageTierSchema,
    standard: packageTierSchema,
    premium: packageTierSchema,
    features: z.array(packageFeatureSchema),
  }),
  // Step 4
  options: step4Schema.shape.options,
  // Step 5
  baseExpressEnabled: step5Schema.shape.baseExpressEnabled,
  baseExpressPrice: step5Schema.shape.baseExpressPrice,
  baseExpressDaysReduction: step5Schema.shape.baseExpressDaysReduction,
  // Step 5
  instructionsRequired: z.boolean(),
  instructionsContent: z.any().optional(),
  // Step 6
  mainImage: z.object({ id: z.string(), url: z.string(), width: z.number().optional(), height: z.number().optional() }).nullable(),
  additionalImages: z.array(z.object({ id: z.string(), url: z.string(), width: z.number().optional(), height: z.number().optional() })),
  videoUrl: z.string().optional(),
});

// ── Types ──

export type Step1Data = z.infer<typeof step1Schema>;
export type Step2Data = z.infer<typeof step2Schema>;
export type Step3PackagesData = z.infer<typeof step3PackagesSchema>;
export type Step4Data = z.infer<typeof step4Schema>;
export type Step5Data = z.infer<typeof step5Schema>;
export type Step6Data = z.infer<typeof step6Schema>;
export type Step7Data = z.infer<typeof step7Schema>;
export type ServiceOptionData = z.infer<typeof serviceOptionSchema>;
export type UploadedImageData = z.infer<typeof uploadedImageSchema>;
export type FullServiceData = z.infer<typeof fullServiceSchema>;

// ── Helpers ──

export const DELIVERY_DAYS_OPTIONS = [1, 2, 3, 5, 7, 10, 14, 21, 30];

// Price options: 10 to 500 by 5, then 600, 700, ..., 5000
export const PRICE_OPTIONS: number[] = [
  ...Array.from({ length: 99 }, (_, i) => 10 + i * 5), // 10, 15, 20, ..., 500
  600, 700, 800, 900, 1000,
  1250, 1500, 1750, 2000,
  2500, 3000, 3500, 4000, 4500, 5000,
];

// Commission rates — now sourced from @/lib/plans (PLAN_RULES)
// Kept here for backward compatibility with imports that reference these constants.
// Authoritative source: @/lib/plans calculateCommissionEur()

export const COMMISSION_RATES: Record<string, number> = {
  DECOUVERTE: PLAN_RULES.DECOUVERTE.commissionValue / 100, // 12% → 0.12
  ASCENSION: PLAN_RULES.ASCENSION.commissionValue / 100, // 10% → 0.10
  SOMMET: 0, // Not a percentage — flat 1 EUR. Use calculateCommissionEur() instead.
  EMPIRE: 0,
  // Legacy aliases
  GRATUIT: PLAN_RULES.DECOUVERTE.commissionValue / 100,
  PRO: PLAN_RULES.ASCENSION.commissionValue / 100,
  BUSINESS: 0,
  AGENCE: 0,
};

export const OPTIONS_LIMITS: Record<string, number> = {
  DECOUVERTE: 3,
  ASCENSION: 10,
  SOMMET: Infinity,
  EMPIRE: Infinity,
  GRATUIT: 3,
  PRO: 10,
  BUSINESS: Infinity,
  AGENCE: Infinity,
};

// Service limits — now sourced from @/lib/plans (PLAN_RULES)
export const SERVICES_LIMITS: Record<string, number> = {
  DECOUVERTE: PLAN_RULES.DECOUVERTE.serviceLimit,
  ASCENSION: PLAN_RULES.ASCENSION.serviceLimit,
  SOMMET: PLAN_RULES.SOMMET.serviceLimit,
  EMPIRE: PLAN_RULES.EMPIRE.serviceLimit,
  // Legacy aliases
  GRATUIT: PLAN_RULES.DECOUVERTE.serviceLimit,
  PRO: PLAN_RULES.ASCENSION.serviceLimit,
  BUSINESS: PLAN_RULES.SOMMET.serviceLimit,
  AGENCE: PLAN_RULES.EMPIRE.serviceLimit,
};

export const LANGUAGES = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "pt", label: "Português" },
  { value: "ar", label: "العربية" },
] as const;
