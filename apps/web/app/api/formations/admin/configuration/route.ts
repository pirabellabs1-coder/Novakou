import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { invalidateRefundConfigCache } from "@/lib/formations/refund-policy";

// Whitelist of allowed config keys to prevent injection of arbitrary settings.
// Any update to a key not in this set is silently dropped (with a warning log).
const ALLOWED_CONFIG_KEYS = new Set<string>([
  "commission_rate",
  "min_payout_amount",
  "refund_window_days",
  "max_consumed_pct",
  "max_refunds_per_buyer_30d",
  "mentor_cancel_hours",
  "auto_approve_refunds",
  "require_approval",
  "max_products_free_tier",
  "support_email",
  "admin_notifications_email",
]);

function requireAdmin(session: Awaited<ReturnType<typeof getServerSession>>) {
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || (role !== "admin" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  return null;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const denied = requireAdmin(session);
    if (denied) return denied;

    const configs = await prisma.formationsConfig.findMany({
      orderBy: { key: "asc" },
    });

    // Transform to key-value
    const values = Object.fromEntries(configs.map((c) => [c.key, c.value]));

    return NextResponse.json({ data: { configs, values } });
  } catch (err) {
    console.error("[admin/configuration GET]", err);
    return NextResponse.json({ data: { configs: [], values: {} } });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const denied = requireAdmin(session);
    if (denied) return denied;

    const body = await request.json();
    const { updates } = body; // { key: value, ... }

    if (!updates || typeof updates !== "object") {
      return NextResponse.json({ error: "updates requis" }, { status: 400 });
    }

    // Filter updates against the whitelist; log a warning for each rejected key
    const rejectedKeys: string[] = [];
    const filteredEntries = Object.entries(updates).filter(([key]) => {
      if (ALLOWED_CONFIG_KEYS.has(key)) return true;
      rejectedKeys.push(key);
      return false;
    });

    if (rejectedKeys.length > 0) {
      console.warn(
        `[admin/configuration PATCH] Rejected unknown config keys: ${rejectedKeys.join(", ")}`,
      );
    }

    await Promise.all(
      filteredEntries.map(([key, value]) =>
        prisma.formationsConfig.upsert({
          where: { key },
          create: { key, value: String(value) },
          update: { value: String(value) },
        }),
      ),
    );

    // Bust refund-policy cache so new values are read on next eligibility check
    invalidateRefundConfigCache();

    return NextResponse.json({
      success: true,
      applied: filteredEntries.length,
      rejected: rejectedKeys,
    });
  } catch (err) {
    console.error("[admin/configuration PATCH]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
