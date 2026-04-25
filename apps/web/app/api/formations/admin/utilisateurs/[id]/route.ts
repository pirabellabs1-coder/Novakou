import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { UserStatus } from "@prisma/client";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

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
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
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
