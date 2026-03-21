import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { devStore } from "@/lib/dev/dev-store";
import { notificationStore } from "@/lib/dev/data-store";
import { ALL_ADMIN_ROLES, type AdminRole } from "@/lib/admin-permissions";
import { sendAdminTeamInviteEmail } from "@/lib/admin/admin-emails";

// GET /api/admin/team — List admin team members
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const allUsers = devStore.getAll();
    console.log(`[API /admin/team GET] Total users: ${allUsers.length}, admins: ${allUsers.filter(u => u.role === "admin").length}`);
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
  } catch (error) {
    console.error("[API /admin/team GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation de l'equipe" },
      { status: 500 }
    );
  }
}

// POST /api/admin/team — Invite a new admin team member
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const body = await request.json();
    const { email, name, adminRole } = body;

    if (!email || !name || !adminRole) {
      return NextResponse.json(
        { error: "Email, nom et role sont requis" },
        { status: 400 }
      );
    }

    if (!ALL_ADMIN_ROLES.includes(adminRole as AdminRole)) {
      return NextResponse.json(
        { error: `Role invalide: ${adminRole}` },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = devStore.findByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "Un utilisateur avec cet email existe deja" },
        { status: 409 }
      );
    }

    // Create the admin user with EN_ATTENTE status (pending invitation acceptance)
    const BCRYPT_HASH = "$2b$12$eZw2Zre.jn/hIW2ufWpkfuGOzpur/UE/lOFHUam3kazRFvyjU75vS";
    const newUser = devStore.create({
      email,
      passwordHash: BCRYPT_HASH,
      name,
      role: "admin",
      plan: "business",
      kyc: 4,
      status: "EN_ATTENTE",
      adminRole: adminRole as AdminRole,
    });

    // Send invitation email (awaited — not fire-and-forget)
    const inviterName = session.user.name || "Admin FreelanceHigh";
    let emailSent = false;
    let emailError: string | null = null;
    try {
      const emailResult = await sendAdminTeamInviteEmail(email, inviterName, adminRole);
      emailSent = !emailResult?.error;
      if (emailResult?.error) {
        emailError = typeof emailResult.error === "string" ? emailResult.error : "Erreur d'envoi email";
      }
    } catch (err) {
      console.error("[TEAM] Email invitation error:", err);
      emailError = (err as Error).message || "Erreur d'envoi email";
    }

    return NextResponse.json({
      success: true,
      message: emailSent
        ? `${name} invite comme ${adminRole} — email d'invitation envoye`
        : `${name} ajoute comme ${adminRole} — email non envoye`,
      emailSent,
      emailError,
      member: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        adminRole: newUser.adminRole,
        status: newUser.status,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error("[API /admin/team POST]", error);
    return NextResponse.json(
      { error: "Erreur lors de l'invitation" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/team — Update member role
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const body = await request.json();
    const { memberId, adminRole } = body;

    if (!memberId || !adminRole) {
      return NextResponse.json(
        { error: "memberId et adminRole sont requis" },
        { status: 400 }
      );
    }

    if (!ALL_ADMIN_ROLES.includes(adminRole as AdminRole)) {
      return NextResponse.json(
        { error: `Role invalide: ${adminRole}` },
        { status: 400 }
      );
    }

    const user = devStore.findById(memberId);
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Membre introuvable" },
        { status: 404 }
      );
    }

    devStore.update(memberId, { adminRole: adminRole as AdminRole });

    notificationStore.add({
      userId: memberId,
      title: "Role admin modifie",
      message: `Votre role d'administration a ete modifie: ${adminRole}`,
      type: "system",
      read: false,
      link: "/admin",
    });

    return NextResponse.json({
      success: true,
      message: `Role de ${user.name} mis a jour: ${adminRole}`,
    });
  } catch (error) {
    console.error("[API /admin/team PATCH]", error);
    return NextResponse.json(
      { error: "Erreur lors de la modification du role" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/team — Remove a team member
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("id");

    if (!memberId) {
      return NextResponse.json(
        { error: "id est requis" },
        { status: 400 }
      );
    }

    const user = devStore.findById(memberId);
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Membre introuvable" },
        { status: 404 }
      );
    }

    // Don't allow removing the last super_admin
    const allAdmins = devStore.getAll().filter((u) => u.role === "admin" && u.adminRole === "super_admin");
    if (user.adminRole === "super_admin" && allAdmins.length <= 1) {
      return NextResponse.json(
        { error: "Impossible de retirer le dernier super admin" },
        { status: 400 }
      );
    }

    // Downgrade to regular user instead of deleting
    devStore.update(memberId, { role: "freelance", adminRole: undefined });

    notificationStore.add({
      userId: memberId,
      title: "Retrait de l'equipe admin",
      message: "Vous avez ete retire de l'equipe d'administration.",
      type: "system",
      read: false,
      link: "/dashboard",
    });

    return NextResponse.json({
      success: true,
      message: `${user.name} retire de l'equipe admin`,
    });
  } catch (error) {
    console.error("[API /admin/team DELETE]", error);
    return NextResponse.json(
      { error: "Erreur lors du retrait" },
      { status: 500 }
    );
  }
}
