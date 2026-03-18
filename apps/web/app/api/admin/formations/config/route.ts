// GET/PUT /api/admin/formations/config — Configuration de la plateforme formations

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@freelancehigh/db";
import { logAuditAction, getRequestIp } from "@/lib/formations/audit";

const DEFAULT_CONFIG: Record<string, string> = {
  commissionRate: "0.30",
  refundWindowDays: "14",
  maxUploadMb: "100",
  maxFreeFormations: "3",
  cohortsEnabled: "true",
  productsEnabled: "true",
  marketingEnabled: "true",
};

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const entries = await prisma.formationsConfig.findMany();

    if (entries.length === 0) {
      return NextResponse.json({ config: { ...DEFAULT_CONFIG } });
    }

    const config: Record<string, string> = { ...DEFAULT_CONFIG };
    for (const entry of entries) {
      config[entry.key] = entry.value;
    }

    return NextResponse.json({ config });
  } catch (error) {
    console.error("[GET /api/admin/formations/config]", error);
    return NextResponse.json({ config: { ...DEFAULT_CONFIG } });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await req.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Corps de la requête invalide. Attendu : { key: value, ... }" },
        { status: 400 }
      );
    }

    const updates: Record<string, string> = {};
    for (const [key, value] of Object.entries(body)) {
      if (typeof key === "string" && typeof value === "string") {
        updates[key] = value;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Aucune entrée de configuration valide fournie" },
        { status: 400 }
      );
    }

    // Upsert each config entry
    const upsertPromises = Object.entries(updates).map(([key, value]) =>
      prisma.formationsConfig.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    );

    await Promise.all(upsertPromises);

    await logAuditAction({
      userId: session.user.id,
      action: "config_updated",
      targetType: "formationsConfig",
      metadata: { updatedKeys: Object.keys(updates), values: updates },
      ipAddress: getRequestIp(req),
    });

    // Return updated config
    const entries = await prisma.formationsConfig.findMany();
    const config: Record<string, string> = { ...DEFAULT_CONFIG };
    for (const entry of entries) {
      config[entry.key] = entry.value;
    }

    return NextResponse.json({ config });
  } catch (error) {
    console.error("[PUT /api/admin/formations/config]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
