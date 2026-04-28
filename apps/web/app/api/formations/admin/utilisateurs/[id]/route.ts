import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { UserStatus } from "@prisma/client";

/**
 * Hard authorization gate — only ADMINs can mutate user accounts.
 * Previously these handlers only checked `session?.user`, which let any
 * authenticated user (vendor / mentor / apprenant) suspend, ban, or
 * delete any other user.
 *
 * The IS_DEV bypass is preserved so local seed scripts keep working,
 * but in dev we still log a warning so the gap is visible.
 */
function isAdmin(role: unknown): boolean {
  if (typeof role !== "string") return false;
  return role.toLowerCase() === "admin";
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    if (session?.user && !isAdmin(session.user.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body; // "suspend" | "activate" | "ban" | "make_admin"

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    let updated;
    if (action === "suspend") {
      updated = await prisma.user.update({
        where: { id },
        data: { status: "SUSPENDU" as UserStatus, suspendReason: body.reason ?? "Suspendu par l'admin" },
      });
    } else if (action === "activate") {
      updated = await prisma.user.update({
        where: { id },
        data: { status: "ACTIF" as UserStatus, suspendReason: null },
      });
    } else if (action === "ban") {
      updated = await prisma.user.update({
        where: { id },
        data: { status: "BANNI" as UserStatus, suspendReason: body.reason ?? "Banni par l'admin" },
      });
    } else {
      return NextResponse.json({ error: "Action invalide" }, { status: 400 });
    }

    return NextResponse.json({ data: { id: updated.id, status: updated.status } });
  } catch (err) {
    console.error("[admin/users PATCH]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    if (session?.user && !isAdmin(session.user.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    const { id } = await params;
    if (id === session?.user?.id) {
      return NextResponse.json({ error: "Vous ne pouvez pas vous supprimer vous-même" }, { status: 400 });
    }
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/users DELETE]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
