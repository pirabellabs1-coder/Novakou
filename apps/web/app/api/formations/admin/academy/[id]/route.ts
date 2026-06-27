import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

type Params = { params: Promise<{ id: string }> };

function isAdmin(session: { user?: { role?: string | null } } | null): boolean {
  const role = session?.user?.role?.toString().toUpperCase();
  return role === "ADMIN" || IS_DEV;
}
const TYPES = new Set(["VIDEO", "PDF", "LINK"]);

// PATCH — modifier une ressource (champs partiels)
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const b = await request.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (b.title !== undefined) data.title = String(b.title).trim();
  if (b.description !== undefined) data.description = b.description ? String(b.description) : null;
  if (b.type !== undefined && TYPES.has(String(b.type))) data.type = String(b.type);
  if (b.url !== undefined) data.url = String(b.url).trim();
  if (b.thumbnail !== undefined) data.thumbnail = b.thumbnail ? String(b.thumbnail) : null;
  if (b.category !== undefined) data.category = String(b.category).trim() || "Général";
  if (b.published !== undefined) data.published = !!b.published;
  if (b.order !== undefined && Number.isFinite(Number(b.order))) data.order = Number(b.order);
  if (Object.keys(data).length === 0) return NextResponse.json({ error: "Rien à mettre à jour" }, { status: 400 });

  const updated = await prisma.academyResource.update({ where: { id }, data }).catch(() => null);
  if (!updated) return NextResponse.json({ error: "Ressource introuvable" }, { status: 404 });
  return NextResponse.json({ data: updated });
}

// DELETE — supprimer une ressource
export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  await prisma.academyResource.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ data: { ok: true } });
}
