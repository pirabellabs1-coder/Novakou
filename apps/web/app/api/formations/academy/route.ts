import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

export const dynamic = "force-dynamic";

// GET — ressources publiées de l'Académie. PUBLIC : accessible à tous,
// même sans connexion (ebooks et vidéos gratuits = aimant d'acquisition).
export async function GET() {
  const items = await prisma.academyResource.findMany({
    where: { published: true },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    select: { id: true, title: true, description: true, type: true, url: true, thumbnail: true, category: true, createdAt: true },
  });
  return NextResponse.json({ data: items });
}

// POST — incrémente le compteur de vues d'une ressource ({ id })
export async function POST(request: Request) {
  const b = await request.json().catch(() => ({}));
  const id = String(b.id ?? "");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  await prisma.academyResource.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
