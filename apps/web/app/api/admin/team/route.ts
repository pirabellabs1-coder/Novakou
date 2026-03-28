import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma as _prisma } from "@/lib/prisma";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";
import { devStore } from "@/lib/dev/dev-store";
import { notificationStore } from "@/lib/dev/data-store";
import { ALL_ADMIN_ROLES, type AdminRole } from "@/lib/admin-permissions";
import { sendAdminTeamInviteEmail } from "@/lib/admin/admin-emails";
import crypto from "crypto";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = _prisma as any;

// GET /api/admin/team — List admin team members + pending invitations
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["admin", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      const allUsers = devStore.getAll();
      const admins = allUsers
        .filter((u) => u.role === "admin")
        .map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          adminRole: u.adminRole || "super_admin",
          status: u.status === "EN_ATTENTE" ? "pending" : u.status === "ACTIF" ? "active" : u.status,
          createdAt: u.createdAt,
          lastLoginAt: u.lastLoginAt ?? null,
        }));

      return NextResponse.json({ members: admins });
    }

    // Production: Prisma — real admins + pending invitations
    const [admins, invitations] = await Promise.all([
      prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true, name: true, email: true, status: true, createdAt: true, lastLoginAt: true },
      }),
      prisma.adminInvitation.findMany({
        where: { status: "pending" },
        orderBy: { createdAt: "desc" },
      }).catch(() => []), // Table may not exist yet
    ]);

    const members = [
      ...admins.map((u: { id: string; name: string; email: string; status: string; createdAt: Date; lastLoginAt: Date | null }) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        adminRole: "super_admin",
        status: u.status === "ACTIF" ? "active" : u.status.toLowerCase(),
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
      })),
      ...invitations.map((inv: { id: string; name: string; email: string; adminRole: string; status: string; createdAt: Date }) => ({
        id: inv.id,
        name: inv.name,
        email: inv.email,
        adminRole: inv.adminRole,
        status: "pending",
        createdAt: inv.createdAt,
        lastLoginAt: null,
      })),
    ];

    return NextResponse.json({ members });
  } catch (error) {
    console.error("[API /admin/team GET]", error);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

// POST /api/admin/team — Invite a new admin team member (magic link)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["admin", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const body = await request.json();
    const { email, name, adminRole } = body;

    if (!email || !name || !adminRole) {
      return NextResponse.json({ error: "Email, nom et role sont requis" }, { status: 400 });
    }

    if (!ALL_ADMIN_ROLES.includes(adminRole as AdminRole)) {
      return NextResponse.json({ error: `Role invalide: ${adminRole}` }, { status: 400 });
    }

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      // Dev: check duplicate and create user directly
      const existing = devStore.findByEmail(email);
      if (existing) {
        return NextResponse.json({ error: "Un utilisateur avec cet email existe deja" }, { status: 409 });
      }

      const BCRYPT_HASH = "$2b$12$eZw2Zre.jn/hIW2ufWpkfuGOzpur/UE/lOFHUam3kazRFvyjU75vS";
      const newUser = devStore.create({
        email, passwordHash: BCRYPT_HASH, name, role: "admin", plan: "business",
        kyc: 4, status: "EN_ATTENTE", adminRole: adminRole as AdminRole,
      });

      // Send invitation email
      const inviterName = session.user.name || "Admin FreelanceHigh";
      let emailSent = false;
      try {
        const emailResult = await sendAdminTeamInviteEmail(email, inviterName, adminRole);
        emailSent = !emailResult?.error;
      } catch (err) {
        console.error("[TEAM] Email error:", err);
      }

      return NextResponse.json({
        success: true,
        message: emailSent ? `Invitation envoyee a ${name}` : `${name} ajoute — email non envoye`,
        emailSent,
        member: { id: newUser.id, name, email, adminRole, status: "pending", createdAt: newUser.createdAt },
      });
    }

    // Production: create invitation with secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    try {
      await prisma.adminInvitation.create({
        data: { email, name, adminRole, token, invitedBy: session.user.id, expiresAt },
      });
    } catch (err) {
      console.error("[TEAM] Invitation DB error:", err);
      // Fallback: create user directly if table doesn't exist
      await prisma.user.create({
        data: { email, name, passwordHash: "", role: "ADMIN", status: "SUSPENDU" },
      });
    }

    // Send invitation email with magic link
    const inviterName = session.user.name || "Admin FreelanceHigh";
    let emailSent = false;
    try {
      const emailResult = await sendAdminTeamInviteEmail(email, inviterName, adminRole);
      emailSent = !emailResult?.error;
    } catch (err) {
      console.error("[TEAM] Email error:", err);
    }

    return NextResponse.json({
      success: true,
      message: emailSent ? `Invitation envoyee a ${name}` : `${name} ajoute — email non envoye`,
      emailSent,
      member: { id: token.slice(0, 8), name, email, adminRole, status: "pending", createdAt: new Date().toISOString() },
    });
  } catch (error) {
    console.error("[API /admin/team POST]", error);
    return NextResponse.json({ error: "Erreur lors de l'invitation" }, { status: 500 });
  }
}

// PATCH /api/admin/team — Update member role
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["admin", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const body = await request.json();
    const { memberId, adminRole } = body;

    if (!memberId || !adminRole) {
      return NextResponse.json({ error: "memberId et adminRole sont requis" }, { status: 400 });
    }

    if (!ALL_ADMIN_ROLES.includes(adminRole as AdminRole)) {
      return NextResponse.json({ error: `Role invalide: ${adminRole}` }, { status: 400 });
    }

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      const user = devStore.findById(memberId);
      if (!user || user.role !== "admin") {
        return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
      }
      devStore.update(memberId, { adminRole: adminRole as AdminRole });
      return NextResponse.json({ success: true, message: `Role de ${user.name} mis a jour: ${adminRole}` });
    }

    // Production
    const user = await prisma.user.findUnique({ where: { id: memberId } });
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
    }
    await prisma.user.update({ where: { id: memberId }, data: { adminRole } });
    return NextResponse.json({ success: true, message: `Role mis a jour: ${adminRole}` });
  } catch (error) {
    console.error("[API /admin/team PATCH]", error);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

// DELETE /api/admin/team — Remove a team member
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["admin", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("id");

    if (!memberId) {
      return NextResponse.json({ error: "id est requis" }, { status: 400 });
    }

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      const user = devStore.findById(memberId);
      if (!user || user.role !== "admin") {
        return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
      }
      const allAdmins = devStore.getAll().filter((u) => u.role === "admin" && u.adminRole === "super_admin");
      if (user.adminRole === "super_admin" && allAdmins.length <= 1) {
        return NextResponse.json({ error: "Impossible de retirer le dernier super admin" }, { status: 400 });
      }
      devStore.update(memberId, { role: "freelance", adminRole: undefined });
      return NextResponse.json({ success: true, message: `${user.name} retire de l'equipe admin` });
    }

    // Production: try to delete invitation first, then downgrade user
    try {
      await prisma.adminInvitation.delete({ where: { id: memberId } });
      return NextResponse.json({ success: true, message: "Invitation annulee" });
    } catch {
      // Not an invitation — downgrade user
      await prisma.user.update({ where: { id: memberId }, data: { role: "FREELANCE" } });
      return NextResponse.json({ success: true, message: "Membre retire de l'equipe admin" });
    }
  } catch (error) {
    console.error("[API /admin/team DELETE]", error);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
