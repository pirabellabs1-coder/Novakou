// GET /api/public/maintenance
//
// Endpoint consulté par middleware.ts à chaque navigation pour décider si
// le site est en mode maintenance. Sans cette route, le middleware appelle
// une URL inexistante et reçoit 404 → log spam + latence ajoutée à chaque
// requête (même si le code gère le fail open).
//
// Source de vérité = settings `siteConfig.maintenanceMode` en DB. Si
// indisponible (DB down, table absente), on retourne `enabled: false` pour
// rester fail-open et ne jamais bloquer le site par erreur.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const revalidate = 60; // cache HTTP 1 min, en plus du cache mémoire du middleware

interface MaintenanceState {
  enabled: boolean;
  message: string;
}

const DEFAULT_STATE: MaintenanceState = { enabled: false, message: "" };

// Stocké comme deux entrées key/value dans FormationsConfig (générique).
// Les clés sont également lues/écrites par /api/formations/admin/configuration.
const ENABLED_KEY = "site.maintenance.enabled";
const MESSAGE_KEY = "site.maintenance.message";

export async function GET() {
  try {
    const rows = await prisma.formationsConfig.findMany({
      where: { key: { in: [ENABLED_KEY, MESSAGE_KEY] } },
      select: { key: true, value: true },
    });

    const enabled = rows.find((r) => r.key === ENABLED_KEY)?.value === "true";
    const message = rows.find((r) => r.key === MESSAGE_KEY)?.value ?? "";

    return NextResponse.json({ enabled, message } satisfies MaintenanceState);
  } catch {
    // DB down / table absente → fail open. Le middleware doit pouvoir laisser
    // passer le trafic même si Supabase est inaccessible.
    return NextResponse.json(DEFAULT_STATE);
  }
}
