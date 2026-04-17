// Novakou — Admin Platform Config Service
// Reads/writes platform configuration from PlatformConfig table via Prisma

import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import type { Prisma } from "@prisma/client";

export interface PlanConfig {
  price: number;
  priceAnnual: number;
  maxServices: number;
  maxCandidatures: number;
  boostsPerMonth: number;
  commissionType: "percentage" | "fixed";
  commissionValue: number;
  scenarioLimit: number;
  certificationLimit: number;
  productiviteAccess: boolean;
  teamLimit: number;
  crmAccess: boolean;
  cloudStorageGB: number;
  apiAccess: boolean;
  supportLevel: "email" | "prioritaire" | "dedie" | "vip";
  features: string[];
}

export interface PlatformConfig {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  enabledCurrencies: string[];
  defaultCurrency: string;
  enabledPaymentMethods: string[];
  commissions: {
    decouverte: number;
    ascension: number;
    sommet: number;
    agence_starter: number;
    empire: number;
  };
  plans: {
    decouverte: PlanConfig;
    ascension: PlanConfig;
    sommet: PlanConfig;
    agence_starter: PlanConfig;
    empire: PlanConfig;
  };
  announcementBanner: {
    enabled: boolean;
    message: string;
    type: "info" | "warning" | "success" | "error";
    dismissible: boolean;
  };
  moderation: {
    autoApproveServices: boolean;
    requireKycForPublish: boolean;
    minKycLevel: number;
  };
  languages: string[];
  supportEmail: string;
  platformName: string;
  rankThresholds: {
    rising_talent: number;
    professional: number;
    top_rated: number;
    elite_expert: number;
  };
  boostEnabled: boolean;
}

const DEFAULT_CONFIG: PlatformConfig = {
  maintenanceMode: false,
  maintenanceMessage: "La plateforme est en maintenance. Nous serons de retour bientot.",
  enabledCurrencies: ["EUR", "FCFA", "USD", "GBP", "MAD"],
  defaultCurrency: "EUR",
  enabledPaymentMethods: [
    "carte_bancaire",
    "orange_money",
    "wave",
    "mtn_mobile_money",
    "paypal",
    "virement_sepa",
  ],
  commissions: {
    decouverte: 12,
    ascension: 5,
    sommet: 0,
    agence_starter: 5,
    empire: 0,
  },
  plans: {
    decouverte: { price: 0, priceAnnual: 0, maxServices: 5, maxCandidatures: 10, boostsPerMonth: 0, commissionType: "percentage", commissionValue: 12, scenarioLimit: 0, certificationLimit: 0, productiviteAccess: false, teamLimit: 0, crmAccess: false, cloudStorageGB: 0, apiAccess: false, supportLevel: "email", features: ["5 services actifs", "10 candidatures/mois", "Commission 12%", "Support email", "Profil public"] },
    ascension: { price: 15, priceAnnual: 135, maxServices: 15, maxCandidatures: 30, boostsPerMonth: 3, commissionType: "percentage", commissionValue: 5, scenarioLimit: 3, certificationLimit: 1, productiviteAccess: false, teamLimit: 0, crmAccess: false, cloudStorageGB: 0, apiAccess: false, supportLevel: "prioritaire", features: ["15 services actifs", "30 candidatures/mois", "Commission 5%", "3 boosts/mois", "1 certification IA/mois", "3 scénarios automatisés", "Statistiques avancées", "Support prioritaire"] },
    sommet: { price: 29.99, priceAnnual: 269.91, maxServices: -1, maxCandidatures: -1, boostsPerMonth: 10, commissionType: "fixed", commissionValue: 1, scenarioLimit: 10, certificationLimit: -1, productiviteAccess: true, teamLimit: 0, crmAccess: false, cloudStorageGB: 0, apiAccess: true, supportLevel: "dedie", features: ["Services illimités", "Candidatures illimitées", "Commission 1€/vente", "10 boosts/mois", "Certifications IA illimitées", "10 scénarios automatisés", "Outils de productivité", "Clés API & Webhooks", "Support dédié"] },
    agence_starter: { price: 20, priceAnnual: 180, maxServices: -1, maxCandidatures: -1, boostsPerMonth: 5, commissionType: "percentage", commissionValue: 5, scenarioLimit: 3, certificationLimit: 1, productiviteAccess: false, teamLimit: 5, crmAccess: true, cloudStorageGB: 10, apiAccess: false, supportLevel: "prioritaire", features: ["Services illimités", "Candidatures illimitées", "Commission 5%", "5 boosts/mois", "Jusqu'à 5 membres", "CRM clients", "10 GB stockage", "Support prioritaire"] },
    empire: { price: 65, priceAnnual: 585, maxServices: -1, maxCandidatures: -1, boostsPerMonth: 20, commissionType: "fixed", commissionValue: 0, scenarioLimit: -1, certificationLimit: -1, productiviteAccess: true, teamLimit: 25, crmAccess: true, cloudStorageGB: 100, apiAccess: true, supportLevel: "vip", features: ["Services illimités", "Candidatures illimitées", "0% commission", "20 boosts/mois", "Certifications IA illimitées", "Scénarios illimités", "Outils de productivité", "Jusqu'à 25 membres d'équipe", "CRM clients intégré", "100 GB cloud partagé", "Clés API & Webhooks", "Support VIP dédié"] },
  },
  announcementBanner: {
    enabled: false,
    message: "",
    type: "info",
    dismissible: true,
  },
  moderation: {
    autoApproveServices: false,
    requireKycForPublish: true,
    minKycLevel: 3,
  },
  languages: ["fr", "en"],
  supportEmail: "support@novakou.com",
  platformName: "Novakou",
  rankThresholds: {
    rising_talent: 5,
    professional: 25,
    top_rated: 50,
    elite_expert: 100,
  },
  boostEnabled: true,
};

// ── Dev mode: persist config to JSON file (survives hot reload) ──
import * as fs from "fs";
import * as path from "path";

const DEV_CONFIG_PATH = path.join(process.cwd(), "lib", "dev", "platform-config.json");

function readDevConfig(): PlatformConfig {
  try {
    if (fs.existsSync(DEV_CONFIG_PATH)) {
      const raw = fs.readFileSync(DEV_CONFIG_PATH, "utf-8");
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error("[ConfigService] Error reading dev config file:", err);
  }
  return { ...DEFAULT_CONFIG };
}

function writeDevConfig(config: PlatformConfig): void {
  try {
    const dir = path.dirname(DEV_CONFIG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DEV_CONFIG_PATH, JSON.stringify(config, null, 2));
  } catch (err) {
    console.error("[ConfigService] Error writing dev config file:", err);
  }
}

// ── Get full platform config ──
export async function getConfig(): Promise<PlatformConfig> {
  if (IS_DEV) {
    return readDevConfig();
  }

  try {
    const rows = await prisma.platformConfig.findMany();

    if (rows.length === 0) {
      // First access — seed defaults
      await seedDefaultConfig();
      return { ...DEFAULT_CONFIG };
    }

    // Reconstruct config from key-value rows
    const config = { ...DEFAULT_CONFIG };
    for (const row of rows) {
      const key = row.key as keyof PlatformConfig;
      if (key in config) {
        (config as Record<string, unknown>)[key] = row.value;
      }
    }
    return config;
  } catch (error) {
    console.error("[ConfigService] Error reading config from DB, using defaults:", error);
    return { ...DEFAULT_CONFIG };
  }
}

// ── Update config (partial deep merge) ──
export async function updateConfig(
  updates: Partial<PlatformConfig>,
  adminId?: string
): Promise<PlatformConfig> {
  if (IS_DEV) {
    const config = readDevConfig();
    deepMerge(
      config as unknown as Record<string, unknown>,
      updates as Record<string, unknown>
    );
    writeDevConfig(config);
    // Clear maintenance cache since config changed
    maintenanceCache = null;
    return config;
  }

  try {
    // Upsert each top-level key that was changed
    const promises = Object.entries(updates).map(([key, value]) =>
      prisma.platformConfig.upsert({
        where: { key },
        create: { key, value: value as Prisma.InputJsonValue, updatedBy: adminId },
        update: { value: value as Prisma.InputJsonValue, updatedBy: adminId },
      })
    );
    await Promise.all(promises);

    // Clear maintenance cache since config changed
    maintenanceCache = null;

    return getConfig();
  } catch (error) {
    console.error("[ConfigService] Error updating config:", error);
    throw error;
  }
}

// ── Seed default config values ──
export async function seedDefaultConfig(): Promise<void> {
  if (IS_DEV) {
    writeDevConfig(DEFAULT_CONFIG);
    return;
  }

  try {
    const entries = Object.entries(DEFAULT_CONFIG);
    await prisma.$transaction(
      entries.map(([key, value]) =>
        prisma.platformConfig.upsert({
          where: { key },
          create: { key, value: value as Prisma.InputJsonValue },
          update: {},
        })
      )
    );
    console.log("[ConfigService] Default config seeded successfully");
  } catch (error) {
    console.error("[ConfigService] Error seeding default config:", error);
  }
}

// ── Maintenance mode check (with 60s cache) ──
let maintenanceCache: { enabled: boolean; message: string; cachedAt: number } | null = null;
const MAINTENANCE_CACHE_TTL = 60_000; // 60 seconds

export async function getMaintenanceState(): Promise<{ enabled: boolean; message: string }> {
  // Check cache first
  if (maintenanceCache && Date.now() - maintenanceCache.cachedAt < MAINTENANCE_CACHE_TTL) {
    return { enabled: maintenanceCache.enabled, message: maintenanceCache.message };
  }

  if (IS_DEV) {
    const config = readDevConfig();
    const state = {
      enabled: config.maintenanceMode,
      message: config.maintenanceMessage,
    };
    maintenanceCache = { ...state, cachedAt: Date.now() };
    return state;
  }

  try {
    const [modeRow, messageRow] = await Promise.all([
      prisma.platformConfig.findUnique({ where: { key: "maintenanceMode" } }),
      prisma.platformConfig.findUnique({ where: { key: "maintenanceMessage" } }),
    ]);

    const state = {
      enabled: (modeRow?.value as boolean) ?? false,
      message: (messageRow?.value as string) ?? DEFAULT_CONFIG.maintenanceMessage,
    };

    maintenanceCache = { ...state, cachedAt: Date.now() };
    return state;
  } catch (error) {
    console.error("[ConfigService] Error checking maintenance mode:", error);
    // Fail open — don't block the site if DB is unreachable
    return { enabled: false, message: "" };
  }
}

// ── Deep merge utility ──
function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): void {
  for (const key of Object.keys(source)) {
    if (
      source[key] !== null &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key]) &&
      target[key] !== null &&
      typeof target[key] === "object" &&
      !Array.isArray(target[key])
    ) {
      deepMerge(
        target[key] as Record<string, unknown>,
        source[key] as Record<string, unknown>
      );
    } else {
      target[key] = source[key];
    }
  }
}
