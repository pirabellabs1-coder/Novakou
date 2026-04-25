import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

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
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const body = await request.json();
    const { updates } = body; // { key: value, ... }

    if (!updates || typeof updates !== "object") {
      return NextResponse.json({ error: "updates requis" }, { status: 400 });
    }

    await Promise.all(
      Object.entries(updates).map(([key, value]) =>
        prisma.formationsConfig.upsert({
          where: { key },
          create: { key, value: String(value) },
          update: { value: String(value) },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/configuration PATCH]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
