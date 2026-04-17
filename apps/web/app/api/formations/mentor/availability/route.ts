import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { validateSchedule } from "@/lib/mentor/availability";

/**
 * GET /api/mentor/availability
 * Returns the authenticated mentor's weekly availability blocks.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const userId = session?.user?.id ?? (IS_DEV ? "dev-instructeur-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    let profile = await prisma.mentorProfile.findUnique({ where: { userId } });
    if (!profile) {
      // Auto-create for mentor dashboard access
      profile = await prisma.mentorProfile.create({
        data: { userId, specialty: "", bio: "" },
      });
    }

    const availabilities = await prisma.mentorAvailability.findMany({
      where: { mentorId: profile.id },
      orderBy: [{ dayOfWeek: "asc" }, { startMin: "asc" }],
    });

    return NextResponse.json({
      data: {
        availabilities: availabilities.map((a) => ({
          id: a.id,
          dayOfWeek: a.dayOfWeek,
          startMin: a.startMin,
          endMin: a.endMin,
          isActive: a.isActive,
        })),
        config: {
          timezone: profile.timezone,
          sessionBuffer: profile.sessionBuffer,
          bookingLeadTime: profile.bookingLeadTime,
          sessionDuration: profile.sessionDuration,
        },
      },
    });
  } catch (err) {
    console.error("[mentor/availability GET]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * PUT /api/mentor/availability
 * Body: { availabilities: [{ dayOfWeek, startMin, endMin }], config?: { timezone?, sessionBuffer?, bookingLeadTime? } }
 *
 * Replaces the entire schedule in a single transaction.
 */
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const userId = session?.user?.id ?? (IS_DEV ? "dev-instructeur-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const profile = await prisma.mentorProfile.findUnique({ where: { userId } });
    if (!profile)
      return NextResponse.json({ error: "Profil mentor introuvable" }, { status: 404 });

    const body = await request.json();
    const { availabilities, config } = body as {
      availabilities?: unknown;
      config?: { timezone?: string; sessionBuffer?: number; bookingLeadTime?: number };
    };

    // Validate schedule
    const { ok, errors, sanitized } = validateSchedule(availabilities ?? []);
    if (!ok) {
      return NextResponse.json({ error: "Schedule invalide", details: errors }, { status: 400 });
    }

    // Transaction: delete all + createMany
    await prisma.$transaction(async (tx) => {
      await tx.mentorAvailability.deleteMany({ where: { mentorId: profile.id } });
      if (sanitized.length > 0) {
        await tx.mentorAvailability.createMany({
          data: sanitized.map((s) => ({
            mentorId: profile.id,
            dayOfWeek: s.dayOfWeek,
            startMin: s.startMin,
            endMin: s.endMin,
            isActive: s.isActive ?? true,
          })),
        });
      }
      if (config) {
        const data: Record<string, unknown> = {};
        if (typeof config.timezone === "string" && config.timezone.trim().length > 0) {
          data.timezone = config.timezone.trim();
        }
        if (Number.isFinite(config.sessionBuffer) && config.sessionBuffer! >= 0 && config.sessionBuffer! <= 120) {
          data.sessionBuffer = Math.floor(config.sessionBuffer!);
        }
        if (Number.isFinite(config.bookingLeadTime) && config.bookingLeadTime! >= 0 && config.bookingLeadTime! <= 10080) {
          data.bookingLeadTime = Math.floor(config.bookingLeadTime!);
        }
        if (Object.keys(data).length > 0) {
          await tx.mentorProfile.update({ where: { id: profile.id }, data });
        }
      }
    });

    const availabilitiesUpdated = await prisma.mentorAvailability.findMany({
      where: { mentorId: profile.id },
      orderBy: [{ dayOfWeek: "asc" }, { startMin: "asc" }],
    });

    return NextResponse.json({
      data: {
        availabilities: availabilitiesUpdated.map((a) => ({
          id: a.id,
          dayOfWeek: a.dayOfWeek,
          startMin: a.startMin,
          endMin: a.endMin,
          isActive: a.isActive,
        })),
        count: availabilitiesUpdated.length,
      },
    });
  } catch (err) {
    console.error("[mentor/availability PUT]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
