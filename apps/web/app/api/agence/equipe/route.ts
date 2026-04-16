// GET /api/agence/equipe — List team members
// POST /api/agence/equipe — Invite a member (creates TeamMember + sends email)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";
import { z } from "zod";

// ── In-memory dev store for team members ──

interface DevTeamMember {
  id: string;
  agencyId: string;
  userId: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  status: string;
  activeOrders: number;
  revenue: number;
  joinedAt: string;
}

const devTeamStore: Map<string, DevTeamMember[]> = new Map();

function getDevMembers(agencyUserId: string): DevTeamMember[] {
  if (!devTeamStore.has(agencyUserId)) {
    // Seed with demo data
    devTeamStore.set(agencyUserId, [
      {
        id: "tm-1",
        agencyId: "dev-agency",
        userId: agencyUserId,
        name: "Vous (Proprietaire)",
        email: "owner@example.com",
        avatar: "",
        role: "PROPRIETAIRE",
        status: "ACTIVE",
        activeOrders: 3,
        revenue: 4500,
        joinedAt: "2025-06-01T00:00:00Z",
      },
      {
        id: "tm-2",
        agencyId: "dev-agency",
        userId: "dev-user-2",
        name: "Aminata Diallo",
        email: "aminata@example.com",
        avatar: "",
        role: "FREELANCE_MEMBRE",
        status: "ACTIVE",
        activeOrders: 2,
        revenue: 2200,
        joinedAt: "2025-08-15T00:00:00Z",
      },
      {
        id: "tm-3",
        agencyId: "dev-agency",
        userId: "dev-user-3",
        name: "Moussa Kone",
        email: "moussa@example.com",
        avatar: "",
        role: "MANAGER",
        status: "ACTIVE",
        activeOrders: 1,
        revenue: 1800,
        joinedAt: "2025-09-01T00:00:00Z",
      },
    ]);
  }
  return devTeamStore.get(agencyUserId)!;
}

// ── GET ──

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      const members = getDevMembers(session.user.id);
      return NextResponse.json({ members });
    }

    const userId = session.user.id;

    const agencyProfile = await prisma.agencyProfile.findUnique({
      where: { userId },
    });
    if (!agencyProfile) {
      return NextResponse.json({ error: "Profil agence introuvable" }, { status: 404 });
    }

    const teamMembers = await prisma.teamMember.findMany({
      where: {
        agencyId: agencyProfile.id,
        status: { not: "REMOVED" },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Enrich with order stats
    const members = await Promise.all(
      teamMembers.map(async (tm) => {
        const orderStats = await prisma.order.aggregate({
          where: { freelanceId: tm.userId },
          _count: { id: true },
          _sum: { amount: true },
        });

        const activeOrders = await prisma.order.count({
          where: {
            freelanceId: tm.userId,
            status: { in: ["EN_ATTENTE", "EN_COURS"] },
          },
        });

        return {
          id: tm.id,
          agencyId: tm.agencyId,
          userId: tm.userId,
          name: tm.user.name || tm.user.email || "Membre",
          email: tm.user.email || "",
          avatar: tm.user.image || "",
          role: tm.role,
          status: tm.status,
          activeOrders,
          revenue: orderStats._sum.amount || 0,
          joinedAt: (tm.joinedAt || tm.createdAt).toISOString(),
        };
      })
    );

    return NextResponse.json({ members });
  } catch (error) {
    console.error("[API /agence/equipe GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ── POST (invite) ──

const inviteSchema = z.object({
  email: z.string().email("Email invalide"),
  role: z.enum(["PROPRIETAIRE", "MANAGER", "FREELANCE_MEMBRE", "COMMERCIAL"]).default("FREELANCE_MEMBRE"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const body = await req.json();
    const { email, role } = inviteSchema.parse(body);

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      const members = getDevMembers(session.user.id);
      const newMember: DevTeamMember = {
        id: `tm-${Date.now()}`,
        agencyId: "dev-agency",
        userId: `inv-${Date.now()}`,
        name: email.split("@")[0],
        email,
        avatar: "",
        role,
        status: "INVITED",
        activeOrders: 0,
        revenue: 0,
        joinedAt: new Date().toISOString(),
      };
      members.push(newMember);
      return NextResponse.json({ success: true, member: newMember, message: `Invitation envoyee a ${email}` });
    }

    const userId = session.user.id;

    const agencyProfile = await prisma.agencyProfile.findUnique({
      where: { userId },
    });
    if (!agencyProfile) {
      return NextResponse.json({ error: "Profil agence introuvable" }, { status: 404 });
    }

    // Find or create user for the invited email
    let invitedUser = await prisma.user.findUnique({ where: { email } });
    if (!invitedUser) {
      // Create a placeholder user that will be completed at registration
      invitedUser = await prisma.user.create({
        data: { email, name: email.split("@")[0], passwordHash: "" },
      });
    }

    // Check for duplicate invite
    const existing = await prisma.teamMember.findUnique({
      where: { agencyId_userId: { agencyId: agencyProfile.id, userId: invitedUser.id } },
    });
    if (existing && existing.status !== "REMOVED") {
      return NextResponse.json({ error: "Ce membre fait deja partie de l'agence" }, { status: 409 });
    }

    // Create or re-activate TeamMember
    const teamMember = existing
      ? await prisma.teamMember.update({
          where: { id: existing.id },
          data: { role: role as "PROPRIETAIRE" | "MANAGER" | "FREELANCE_MEMBRE" | "COMMERCIAL", status: "INVITED" },
        })
      : await prisma.teamMember.create({
          data: {
            agencyId: agencyProfile.id,
            userId: invitedUser.id,
            role: role as "PROPRIETAIRE" | "MANAGER" | "FREELANCE_MEMBRE" | "COMMERCIAL",
            status: "INVITED",
          },
        });

    // Send invitation email (best-effort)
    try {
      const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://freelancehigh.com";
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const from = process.env.EMAIL_FROM || "FreelanceHigh <noreply@freelancehigh.com>";

      const roleLabels: Record<string, string> = {
        PROPRIETAIRE: "Proprietaire",
        MANAGER: "Manager",
        FREELANCE_MEMBRE: "Freelance",
        COMMERCIAL: "Commercial",
      };

      await resend.emails.send({
        from,
        to: email,
        subject: `${session.user.name} vous invite a rejoindre son agence sur FreelanceHigh`,
        html: `
          <div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
            <div style="background:linear-gradient(135deg,#6C2BD9,#8B5CF6);padding:32px 40px;text-align:center;border-radius:12px 12px 0 0;">
              <h1 style="color:#fff;font-size:24px;font-weight:800;margin:0;">FreelanceHigh</h1>
            </div>
            <div style="padding:40px;background:#fff;">
              <h2 style="color:#111827;font-size:20px;margin:0 0 16px;">Vous etes invite !</h2>
              <p style="color:#4b5563;line-height:1.6;">
                <strong>${session.user.name}</strong> vous invite a rejoindre son agence sur FreelanceHigh
                en tant que <strong>${roleLabels[role] || role}</strong>.
              </p>
              <div style="text-align:center;margin:32px 0;">
                <a href="${APP_URL}/inscription?invite=agence&role=${role}&email=${encodeURIComponent(email)}"
                   style="display:inline-block;background:#6C2BD9;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">
                  Accepter l'invitation
                </a>
              </div>
            </div>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("[INVITE EMAIL]", emailErr);
      // Don't fail the invite if email fails — the TeamMember is already created
    }

    return NextResponse.json({
      success: true,
      member: {
        id: teamMember.id,
        agencyId: teamMember.agencyId,
        userId: teamMember.userId,
        name: invitedUser.name || email.split("@")[0],
        email,
        avatar: invitedUser.image || "",
        role: teamMember.role,
        status: teamMember.status,
        activeOrders: 0,
        revenue: 0,
        joinedAt: new Date().toISOString(),
      },
      message: `Invitation envoyee a ${email}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Donnees invalides" }, { status: 400 });
    }
    console.error("[API /agence/equipe POST]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
