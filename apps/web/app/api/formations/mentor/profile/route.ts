/**
 * Mentor profile settings (mentor-specific fields that aren't in /api/profile).
 *
 * GET  → current mentor profile config
 * PUT  → update { discoveryEnabled, discoveryDurationMinutes, preSessionQuestions }
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

interface Question {
  id: string;
  label: string;
  type: "text" | "choice";
  required?: boolean;
  options?: string[];
}

async function currentMentor() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return prisma.mentorProfile.findUnique({ where: { userId: session.user.id } });
}

export async function GET() {
  const mentor = await currentMentor();
  if (!mentor) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  return NextResponse.json({
    data: {
      discoveryEnabled: mentor.discoveryEnabled,
      discoveryDurationMinutes: mentor.discoveryDurationMinutes,
      preSessionQuestions: mentor.preSessionQuestions ?? [],
      sessionBuffer: mentor.sessionBuffer,
      bookingLeadTime: mentor.bookingLeadTime,
      isAvailable: mentor.isAvailable,
    },
  });
}

export async function PUT(req: Request) {
  const mentor = await currentMentor();
  if (!mentor) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    discoveryEnabled?: boolean;
    discoveryDurationMinutes?: number;
    preSessionQuestions?: Question[];
    sessionBuffer?: number;
    bookingLeadTime?: number;
    isAvailable?: boolean;
  };

  const data: Record<string, unknown> = {};
  if (typeof body.discoveryEnabled === "boolean") data.discoveryEnabled = body.discoveryEnabled;
  if (Number.isFinite(body.discoveryDurationMinutes)) {
    data.discoveryDurationMinutes = Math.min(60, Math.max(5, Number(body.discoveryDurationMinutes)));
  }
  if (Array.isArray(body.preSessionQuestions)) {
    // Validate each question
    const qs = body.preSessionQuestions.slice(0, 10).filter((q) => q && typeof q === "object" && q.id && q.label);
    data.preSessionQuestions = qs as unknown as object;
  }
  if (Number.isFinite(body.sessionBuffer)) {
    data.sessionBuffer = Math.min(120, Math.max(0, Number(body.sessionBuffer)));
  }
  if (Number.isFinite(body.bookingLeadTime)) {
    data.bookingLeadTime = Math.min(4320, Math.max(0, Number(body.bookingLeadTime))); // max 3d
  }
  if (typeof body.isAvailable === "boolean") data.isAvailable = body.isAvailable;

  const updated = await prisma.mentorProfile.update({
    where: { id: mentor.id },
    data,
  });

  return NextResponse.json({
    data: {
      discoveryEnabled: updated.discoveryEnabled,
      discoveryDurationMinutes: updated.discoveryDurationMinutes,
      preSessionQuestions: updated.preSessionQuestions ?? [],
      sessionBuffer: updated.sessionBuffer,
      bookingLeadTime: updated.bookingLeadTime,
      isAvailable: updated.isAvailable,
    },
  });
}
