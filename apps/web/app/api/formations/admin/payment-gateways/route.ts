import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { IS_DEV } from "@/lib/env";
import { listGatewaysForAdmin, upsertGateway, CREDENTIAL_FIELDS } from "@/lib/payments/gateways";
import { isSecretBoxReady } from "@/lib/crypto/secret-box";
import { PROVIDERS } from "@/lib/payments/registry";

/**
 * GET  /api/formations/admin/payment-gateways  → liste (identifiants MASQUÉS)
 * POST /api/formations/admin/payment-gateways  → créer / mettre à jour
 *
 * Admin uniquement. Les identifiants ne sortent JAMAIS en clair de cette API :
 * ce sont des clés capables d'encaisser et de verser de l'argent réel.
 */

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role?.toString().toUpperCase();
  if (!session?.user || (role !== "ADMIN" && !IS_DEV)) return false;
  return true;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Accès refusé — admin requis." }, { status: 403 });
  }
  try {
    const gateways = await listGatewaysForAdmin();
    return NextResponse.json({
      data: {
        gateways,
        // Schéma des champs à saisir, par fournisseur (pilote le formulaire).
        credentialFields: CREDENTIAL_FIELDS,
        // Directions réellement implémentées côté code, pour griser le reste.
        providerDirections: Object.fromEntries(PROVIDERS.map((p) => [p.id, p.directions])),
        // Sans clé de chiffrement, aucun identifiant ne peut être enregistré.
        encryptionReady: isSecretBoxReady(),
      },
    });
  } catch (err) {
    console.error("[admin/payment-gateways GET]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Accès refusé — admin requis." }, { status: 403 });
  }
  try {
    if (!isSecretBoxReady()) {
      return NextResponse.json(
        {
          error:
            "Clé de chiffrement absente. Posez PAYMENT_CREDENTIALS_KEY (openssl rand -base64 32) avant d'enregistrer des identifiants.",
          code: "ENCRYPTION_KEY_MISSING",
        },
        { status: 400 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const provider = String(body.provider ?? "").trim();
    if (!PROVIDERS.some((p) => p.id === provider)) {
      return NextResponse.json({ error: `Fournisseur inconnu : ${provider}` }, { status: 400 });
    }

    // On ne retient que les champs déclarés pour ce fournisseur : un champ
    // inconnu ne doit pas se retrouver stocké dans les identifiants.
    const allowed = new Set((CREDENTIAL_FIELDS[provider] ?? []).map((f) => f.key));
    const credentials: Record<string, string> = {};
    if (body.credentials && typeof body.credentials === "object") {
      for (const [k, v] of Object.entries(body.credentials as Record<string, unknown>)) {
        if (allowed.has(k) && typeof v === "string" && v.trim()) credentials[k] = v.trim();
      }
    }

    await upsertGateway({
      provider,
      label: typeof body.label === "string" && body.label.trim() ? body.label.trim() : undefined,
      credentials: Object.keys(credentials).length > 0 ? credentials : undefined,
      isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
      canCollect: typeof body.canCollect === "boolean" ? body.canCollect : undefined,
      canPayout: typeof body.canPayout === "boolean" ? body.canPayout : undefined,
      isSandbox: typeof body.isSandbox === "boolean" ? body.isSandbox : undefined,
      priority: Number.isFinite(Number(body.priority)) ? Number(body.priority) : undefined,
    });

    const gateways = await listGatewaysForAdmin();
    return NextResponse.json({ data: { gateways } });
  } catch (err) {
    console.error("[admin/payment-gateways POST]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
