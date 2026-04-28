import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { UserStatus } from "@prisma/client";
import { createAuditLog } from "@/lib/admin/audit";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session?.user || (role !== "admin" && role !== "ADMIN")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
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

    const actorId = (session.user as { id?: string }).id;
    if (actorId) {
      await createAuditLog({
        actorId,
        action: `user.${action}`,
        targetType: "user",
        targetId: id,
        targetUserId: id,
        details: { reason: body.reason ?? null, newStatus: updated.status },
      }).catch(() => null);
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
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session?.user || (role !== "admin" && role !== "ADMIN")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const { id } = await params;
    const actorId = (session.user as { id?: string }).id;
    if (id === actorId) {
      return NextResponse.json({ error: "Vous ne pouvez pas vous supprimer vous-même" }, { status: 400 });
    }
    await prisma.user.delete({ where: { id } });

    if (actorId) {
      await createAuditLog({
        actorId,
        action: "user.deleted",
        targetType: "user",
        targetId: id,
        targetUserId: id,
      }).catch(() => null);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/users DELETE]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
