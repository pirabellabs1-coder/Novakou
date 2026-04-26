/**
 * Helper: vérifie une clé API envoyée dans le header Authorization et résout
 * l'instructeurProfile associé.
 *
 * Usage dans une route publique :
 *   const ctx = await verifyApiKey(request, { requiredScope: "read:products" });
 *   if (ctx instanceof NextResponse) return ctx;  // erreur 401/403
 *   // ctx.instructeurId, ctx.keyId disponibles
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api/v1-helpers";

function hashKey(rawKey: string): string {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}

export interface ApiKeyContext {
  keyId: string;
  instructeurId: string;
  scopes: string[];
}

/**
 * Extracts and verifies the API key. Returns an ApiKeyContext on success,
 * or a NextResponse with the proper error status on failure.
 */
export async function verifyApiKey(
  request: NextRequest | Request,
  opts?: { requiredScope?: string },
): Promise<ApiKeyContext | NextResponse> {
  const auth = request.headers.get("authorization") ?? "";
  const match = auth.match(/^Bearer\s+(nk_(?:live|test)_[a-f0-9]+)$/i);
  if (!match) {
    return apiError(
      "INVALID_API_KEY",
      "Clé API manquante ou invalide. Incluez le header Authorization: Bearer nk_live_xxxxxxxx",
      401,
    );
  }
  const rawKey = match[1];
  const keyHash = hashKey(rawKey);

  const key = await prisma.vendorApiKey.findFirst({
    where: {
      keyHash,
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: {
      id: true,
      instructeurId: true,
      scopes: true,
    },
  });

  if (!key) {
    return apiError(
      "INVALID_API_KEY",
      "Clé API invalide, révoquée ou expirée",
      401,
    );
  }

  if (opts?.requiredScope) {
    const hasScope =
      key.scopes.includes("admin") || key.scopes.includes(opts.requiredScope);
    if (!hasScope) {
      return apiError(
        "MISSING_SCOPE",
        `Permission manquante : ${opts.requiredScope}. Générez une nouvelle clé avec ce scope depuis votre dashboard.`,
        403,
        { requiredScope: opts.requiredScope },
      );
    }
  }

  // Update lastUsedAt asynchronously (non-blocking)
  prisma.vendorApiKey
    .update({ where: { id: key.id }, data: { lastUsedAt: new Date() } })
    .catch(() => null);

  return {
    keyId: key.id,
    instructeurId: key.instructeurId,
    scopes: key.scopes,
  };
}
