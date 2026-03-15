import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

// ── In-memory Platform Config Store ──
// Configuration persists for the lifetime of the server process.
// Resets on server restart, acceptable for dev mode.

interface PlatformConfig {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  enabledCurrencies: string[];
  defaultCurrency: string;
  enabledPaymentMethods: string[];
  commissions: {
    gratuit: number;
    pro: number;
    business: number;
    agence: number;
  };
  plans: {
    gratuit: { price: number; maxServices: number; maxCandidatures: number; boostsPerMonth: number };
    pro: { price: number; maxServices: number; maxCandidatures: number; boostsPerMonth: number };
    business: { price: number; maxServices: number; maxCandidatures: number; boostsPerMonth: number };
    agence: { price: number; maxServices: number; maxCandidatures: number; boostsPerMonth: number; maxMembers: number; storageGB: number };
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

const platformConfig: PlatformConfig = {
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
    gratuit: 20,
    pro: 15,
    business: 10,
    agence: 8,
  },
  plans: {
    gratuit: { price: 0, maxServices: 3, maxCandidatures: 5, boostsPerMonth: 0 },
    pro: { price: 15, maxServices: 15, maxCandidatures: 20, boostsPerMonth: 1 },
    business: { price: 45, maxServices: -1, maxCandidatures: -1, boostsPerMonth: 5 },
    agence: { price: 99, maxServices: -1, maxCandidatures: -1, boostsPerMonth: 10, maxMembers: 20, storageGB: 50 },
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
  supportEmail: "support@freelancehigh.com",
  platformName: "FreelanceHigh",
  rankThresholds: {
    rising_talent: 5,
    professional: 25,
    top_rated: 50,
    elite_expert: 100,
  },
  boostEnabled: true,
};

// Expose maintenance state for middleware and public access
export function getMaintenanceState(): { enabled: boolean; message: string } {
  return {
    enabled: platformConfig.maintenanceMode,
    message: platformConfig.maintenanceMessage,
  };
}

// Expose full config for internal use
export function getPlatformConfig(): PlatformConfig {
  return platformConfig;
}

// GET /api/admin/config — Get platform configuration
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    return NextResponse.json({ config: platformConfig });
  } catch (error) {
    console.error("[API /admin/config GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation de la configuration" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/config — Update platform configuration (deep merge)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const body = await request.json();

    // Deep merge updates into platformConfig
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

    deepMerge(
      platformConfig as unknown as Record<string, unknown>,
      body as Record<string, unknown>
    );

    return NextResponse.json({
      success: true,
      message: "Configuration mise a jour",
      config: platformConfig,
    });
  } catch (error) {
    console.error("[API /admin/config PATCH]", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise a jour de la configuration" },
      { status: 500 }
    );
  }
}
