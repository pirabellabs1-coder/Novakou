import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";

const ALLOWED_PROVIDERS = ["brevo", "make", "zapier", "n8n", "convertkit", "systemeio"];

/**
 * GET /api/vendeur/integrations
 * Returns the list of all integrations for the vendor (connected or not).
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const ctx = await resolveVendorContext(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });
    if (!ctx) return NextResponse.json({ data: [] });

    const rows = await prisma.vendorIntegration.findMany({
      where: { instructeurId: ctx.instructeurId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        provider: true,
        connected: true,
        webhookUrl: true,
        lastSyncAt: true,
        createdAt: true,
        updatedAt: true,
        // NE PAS exposer l'apiKey — sensible
      },
    });

    return NextResponse.json({ data: rows });
  } catch (err) {
    console.error("[integrations GET]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * POST /api/vendeur/integrations
 * Body: { provider, apiKey?, webhookUrl?, config? }
 * Upserts the integration for the given provider and marks it as connected.
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const ctx = await resolveVendorContext(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });
    if (!ctx) return NextResponse.json({ error: "Session invalide" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { provider, apiKey, webhookUrl, config } = body as {
      provider?: string;
      apiKey?: string;
      webhookUrl?: string;
      config?: unknown;
    };

    if (!provider || !ALLOWED_PROVIDERS.includes(provider)) {
      return NextResponse.json(
        { error: "Provider invalide. Valeurs acceptées : " + ALLOWED_PROVIDERS.join(", ") },
        { status: 400 },
      );
    }

    // Providers API key based : Brevo, ConvertKit, Systeme.io
    const isApiKeyProvider = ["brevo", "convertkit", "systemeio"].includes(provider);
    // Providers webhook based : Make, Zapier, n8n
    const isWebhookProvider = ["make", "zapier", "n8n"].includes(provider);

    if (isApiKeyProvider && (!apiKey || typeof apiKey !== "string" || apiKey.trim().length < 8)) {
      return NextResponse.json(
        { error: "Clé API requise (minimum 8 caractères)" },
        { status: 400 },
      );
    }
    if (isWebhookProvider && (!webhookUrl || !/^https?:\/\//.test(webhookUrl))) {
      return NextResponse.json(
        { error: "URL webhook requise (doit commencer par http(s)://)" },
        { status: 400 },
      );
    }

    const integration = await prisma.vendorIntegration.upsert({
      where: {
        instructeurId_provider: {
          instructeurId: ctx.instructeurId,
          provider,
        },
      },
      create: {
        instructeurId: ctx.instructeurId,
        provider,
        connected: true,
        apiKey: isApiKeyProvider ? (apiKey as string).trim() : null,
        webhookUrl: isWebhookProvider ? (webhookUrl as string).trim() : null,
        config: (config ?? null) as never,
      },
      update: {
        connected: true,
        apiKey: isApiKeyProvider ? (apiKey as string).trim() : null,
        webhookUrl: isWebhookProvider ? (webhookUrl as string).trim() : null,
        config: (config ?? null) as never,
      },
      select: {
        id: true,
        provider: true,
        connected: true,
        webhookUrl: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ data: integration });
  } catch (err) {
    console.error("[integrations POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/vendeur/integrations?provider=xxx
 * Soft-disconnects an integration (keeps the record + credentials for re-enable).
 */
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const ctx = await resolveVendorContext(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });
    if (!ctx) return NextResponse.json({ error: "Session invalide" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider");
    if (!provider) {
      return NextResponse.json({ error: "Paramètre provider requis" }, { status: 400 });
    }

    await prisma.vendorIntegration.updateMany({
      where: { instructeurId: ctx.instructeurId, provider },
      data: { connected: false },
    });

    return NextResponse.json({ data: { provider, connected: false } });
  } catch (err) {
    console.error("[integrations DELETE]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
