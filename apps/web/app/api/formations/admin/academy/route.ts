import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

function isAdmin(session: { user?: { role?: string | null } } | null): boolean {
  const role = session?.user?.role?.toString().toUpperCase();
  return role === "ADMIN" || IS_DEV;
}

const TYPES = new Set(["VIDEO", "PDF", "LINK"]);

// GET — liste complète (admin) des ressources de l'Académie
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const items = await prisma.academyResource.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ data: items });
}

// POST — créer une ressource
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const b = await request.json().catch(() => ({}));
  const title = String(b.title ?? "").trim();
  const url = String(b.url ?? "").trim();
  const type = TYPES.has(String(b.type)) ? String(b.type) : "VIDEO";
  if (title.length < 2) return NextResponse.json({ error: "Titre requis" }, { status: 400 });
  if (!url) return NextResponse.json({ error: "URL (vidéo, PDF ou lien) requise" }, { status: 400 });

  const created = await prisma.academyResource.create({
    data: {
      title,
      description: b.description ? String(b.description) : null,
      type,
      url,
      thumbnail: b.thumbnail ? String(b.thumbnail) : null,
      category: String(b.category ?? "Général").trim() || "Général",
      published: b.published !== false,
      order: Number.isFinite(Number(b.order)) ? Number(b.order) : 0,
    },
  });
  return NextResponse.json({ data: created }, { status: 201 });
}
