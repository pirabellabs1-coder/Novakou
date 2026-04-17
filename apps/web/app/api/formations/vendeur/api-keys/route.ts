import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import crypto from "crypto";

/**
 * API Keys management — Novakou public API for vendors.
 *
 * Key format: `nk_live_<48 random hex chars>`
 * We store: keyPrefix (first 12 chars visible) + keyHash (SHA-256 full key).
 * The raw key is ONLY returned on creation — the user must save it.
 */

const ALLOWED_SCOPES = [
  "read:products",
  "write:products",
  "read:orders",
  "write:orders",
  "read:customers",
  "write:customers",
  "read:analytics",
  "admin",
];

function hashKey(rawKey: string): string {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}

function generateRawKey(): { raw: string; prefix: string } {
  const random = crypto.randomBytes(24).toString("hex"); // 48 hex chars
  const raw = `nk_live_${random}`;
  const prefix = raw.slice(0, 12); // "nk_live_ab12"
  return { raw, prefix };
}

/**
 * GET /api/vendeur/api-keys
 * Lists all API keys for the vendor (raw keys NEVER returned).
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

    const keys = await prisma.vendorApiKey.findMany({
      where: { instructeurId: ctx.instructeurId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        lastUsedAt: true,
        expiresAt: true,
        revokedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ data: keys });
  } catch (err) {
    console.error("[api-keys GET]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * POST /api/vendeur/api-keys
 * Body: { name: string, scopes?: string[], expiresInDays?: number }
 * Creates a new key and returns the raw value ONCE.
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
    const { name, scopes, expiresInDays } = body as {
      name?: string;
      scopes?: string[];
      expiresInDays?: number;
    };

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Nom requis (minimum 2 caractères)" },
        { status: 400 },
      );
    }

    // Validate scopes
    const safeScopes = Array.isArray(scopes)
      ? scopes.filter((s) => ALLOWED_SCOPES.includes(s))
      : ["read:products", "read:orders"];

    const expiresAt =
      typeof expiresInDays === "number" && expiresInDays > 0
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : null;

    const { raw, prefix } = generateRawKey();
    const keyHash = hashKey(raw);

    const saved = await prisma.vendorApiKey.create({
      data: {
        instructeurId: ctx.instructeurId,
        name: name.trim().slice(0, 80),
        keyPrefix: prefix,
        keyHash,
        scopes: safeScopes,
        expiresAt,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    // Return the raw key ONCE — user must save it
    return NextResponse.json({
      data: {
        ...saved,
        rawKey: raw,
        warning:
          "Cette clé ne sera plus jamais affichée. Copiez-la et conservez-la en sécurité.",
      },
    });
  } catch (err) {
    console.error("[api-keys POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 },
    );
  }
}
