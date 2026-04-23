// POST /api/agence/equipe/invite — Invite a team member by email
// NOTE: This is the legacy invite route. The main /api/agence/equipe POST route
// now also handles invites with TeamMember creation. This route is kept for
// backward compatibility and redirects to the same logic.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";
import { z } from "zod";

const ROLE_MAP: Record<string, string> = {
  proprietaire: "PROPRIETAIRE",
  manager: "MANAGER",
  freelance: "FREELANCE_MEMBRE",
  commercial: "COMMERCIAL",
};

const inviteSchema = z.object({
  email: z.string().email("Email invalide"),
  role: z.enum(["proprietaire", "manager", "freelance", "commercial"]).default("freelance"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const body = await req.json();
    const { email, role } = inviteSchema.parse(body);
    const prismaRole = ROLE_MAP[role] || "FREELANCE_MEMBRE";

    // ── Create TeamMember in DB (unless dev mode) ──
    if (!IS_DEV || USE_PRISMA_FOR_DATA) {
      const agencyProfile = await prisma.agencyProfile.findUnique({
        where: { userId: session.user.id },
      });
      if (agencyProfile) {
        let invitedUser = await prisma.user.findUnique({ where: { email } });
        if (!invitedUser) {
          invitedUser = await prisma.user.create({
            data: { email, name: email.split("@")[0], passwordHash: "" },
          });
        }

        const existing = await prisma.teamMember.findUnique({
          where: { agencyId_userId: { agencyId: agencyProfile.id, userId: invitedUser.id } },
        });
        if (!existing || existing.status === "REMOVED") {
          if (existing) {
            await prisma.teamMember.update({
              where: { id: existing.id },
              data: { role: prismaRole as "PROPRIETAIRE" | "MANAGER" | "FREELANCE_MEMBRE" | "COMMERCIAL", status: "INVITED" },
            });
          } else {
            await prisma.teamMember.create({
              data: {
                agencyId: agencyProfile.id,
                userId: invitedUser.id,
                role: prismaRole as "PROPRIETAIRE" | "MANAGER" | "FREELANCE_MEMBRE" | "COMMERCIAL",
                status: "INVITED",
              },
            });
          }
        }
      }
    }

    // ── Send invitation email ──
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com";
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.EMAIL_FROM || "Novakou <support@novakou.com>";

    const roleLabels: Record<string, string> = {
      proprietaire: "Proprietaire",
      manager: "Manager",
      freelance: "Freelance",
      commercial: "Commercial",
    };

    const result = await resend.emails.send({
      from,
      to: email,
      subject: `${session.user.name} vous invite a rejoindre son agence sur Novakou`,
      html: `
        <div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <div style="background:linear-gradient(135deg,#6C2BD9,#8B5CF6);padding:32px 40px;text-align:center;border-radius:12px 12px 0 0;">
            <h1 style="color:#fff;font-size:24px;font-weight:800;margin:0;">Novakou</h1>
          </div>
          <div style="padding:40px;background:#fff;">
            <h2 style="color:#111827;font-size:20px;margin:0 0 16px;">Vous etes invite !</h2>
            <p style="color:#4b5563;line-height:1.6;">
              <strong>${session.user.name}</strong> vous invite a rejoindre son agence sur Novakou
              en tant que <strong>${roleLabels[role] || role}</strong>.
            </p>
            <div style="text-align:center;margin:32px 0;">
              <a href="${APP_URL}/inscription?invite=agence&role=${role}&email=${encodeURIComponent(email)}"
                 style="display:inline-block;background:#6C2BD9;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">
                Accepter l'invitation
              </a>
            </div>
            <p style="color:#9ca3af;font-size:13px;">
              Si vous n'attendiez pas cette invitation, vous pouvez ignorer cet email.
            </p>
          </div>
          <div style="padding:20px 40px;background:#f9fafb;text-align:center;border-radius:0 0 12px 12px;">
            <p style="color:#d1d5db;font-size:10px;">&copy; 2026 Novakou</p>
          </div>
        </div>
      `,
    });

    if (result.error) {
      console.error("[INVITE AGENCE]", result.error);
      return NextResponse.json({ error: "Erreur lors de l'envoi de l'invitation" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Invitation envoyee a ${email}`,
      emailId: result.data?.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Donnees invalides" }, { status: 400 });
    }
    console.error("[POST /api/agence/equipe/invite]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
