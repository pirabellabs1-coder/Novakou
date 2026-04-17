import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { sanitizeRichHtml } from "@/lib/sanitize-html";

/**
 * GET /api/formations/mentor/dashboard
 * Returns mentor profile + bookings stats + upcoming sessions.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const userId = session?.user?.id ?? (IS_DEV ? "dev-instructeur-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    // Verify user exists before trying to create a mentor profile
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!existingUser) {
      console.warn("[mentor/dashboard] User not found for id:", userId);
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    // Get or create mentor profile
    let profile = await prisma.mentorProfile.findUnique({ where: { userId } });
    if (!profile) {
      try {
        profile = await prisma.mentorProfile.create({
          data: {
            userId,
            specialty: "",
            bio: "",
            sessionPrice: 25000,
            sessionDuration: 60,
            isAvailable: true,
          },
        });
      } catch (createErr) {
        console.error("[mentor/dashboard] Failed to auto-create profile:", createErr);
        return NextResponse.json({ error: "Impossible de créer le profil mentor" }, { status: 500 });
      }
    }

    const now = new Date();

    // Upcoming bookings (next 30 days)
    const upcoming = await prisma.mentorBooking.findMany({
      where: {
        mentorId: profile.id,
        scheduledAt: { gte: now },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      orderBy: { scheduledAt: "asc" },
      take: 10,
      select: {
        id: true,
        scheduledAt: true,
        durationMinutes: true,
        paidAmount: true,
        status: true,
        meetingLink: true,
        meetingRoomId: true,
        student: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    // Past sessions (last 30 days)
    const past = await prisma.mentorBooking.findMany({
      where: {
        mentorId: profile.id,
        scheduledAt: { lt: now },
        status: "COMPLETED",
      },
      orderBy: { scheduledAt: "desc" },
      take: 5,
      select: {
        id: true,
        scheduledAt: true,
        durationMinutes: true,
        paidAmount: true,
        studentRating: true,
        student: { select: { id: true, name: true } },
      },
    });

    // ── Stats alignees avec la semantique escrow (meme source que /api/formations/wallet) ──
    // Gains nets (95%) = sessions RELEASED uniquement (argent reellement acquis)
    // En attente      = sessions HELD (payees mais pas encore liberees)
    // En dispute      = sessions DISPUTED (bloquees par admin)
    const allBookings = await prisma.mentorBooking.findMany({
      where: { mentorId: profile.id },
      select: { status: true, paidAmount: true, escrowStatus: true },
    });
    const RATE = 0.95;
    const releasedBookings = allBookings.filter((b) => b.escrowStatus === "RELEASED");
    const heldBookings = allBookings.filter((b) => b.escrowStatus === "HELD");
    const disputedBookings = allBookings.filter((b) => b.escrowStatus === "DISPUTED");

    const grossReleased = releasedBookings.reduce((s, b) => s + b.paidAmount, 0);
    const grossHeld = heldBookings.reduce((s, b) => s + b.paidAmount, 0);
    const netReleased = Math.round(grossReleased * RATE);
    const netHeld = Math.round(grossHeld * RATE);

    const pendingCount = allBookings.filter((b) => b.status === "PENDING").length;
    const confirmedCount = allBookings.filter((b) => b.status === "CONFIRMED").length;
    const completedCount = allBookings.filter((b) => b.status === "COMPLETED" || b.status === "RELEASED").length;

    return NextResponse.json({
      data: {
        profile: {
          id: profile.id,
          specialty: profile.specialty,
          bio: profile.bio,
          domain: profile.domain,
          sessionPrice: profile.sessionPrice,
          sessionDuration: profile.sessionDuration,
          isAvailable: profile.isAvailable,
          isVerified: profile.isVerified,
          badges: profile.badges,
          languages: profile.languages,
          coverImage: profile.coverImage,
          rating: profile.rating,
          reviewsCount: profile.reviewsCount,
          totalSessions: profile.totalSessions,
          totalStudents: profile.totalStudents,
          timezone: profile.timezone,
          sessionBuffer: profile.sessionBuffer,
          bookingLeadTime: profile.bookingLeadTime,
        },
        stats: {
          // Revenus nets reellement acquis (sessions RELEASED seulement)
          totalRevenue: netReleased,
          grossRevenue: grossReleased,
          // En attente (escrow HELD - paye mais pas encore libere)
          pendingRevenue: netHeld,
          pendingGross: grossHeld,
          pendingCount: heldBookings.length,
          // En dispute
          disputedCount: disputedBookings.length,
          // Counts par statut
          completedSessions: completedCount,
          pendingBookings: pendingCount,
          confirmedBookings: confirmedCount,
          totalBookings: allBookings.length,
        },
        upcoming: upcoming.map((b) => ({
          id: b.id,
          scheduledAt: b.scheduledAt,
          durationMinutes: b.durationMinutes,
          paidAmount: b.paidAmount,
          status: b.status,
          // Always prefer the auto-generated Jitsi URL (meetingRoomId) — meetingLink is legacy
          meetingUrl: b.meetingRoomId ? `https://meet.jit.si/${b.meetingRoomId}` : b.meetingLink,
          student: b.student,
        })),
        pastSessions: past.map((b) => ({
          id: b.id,
          scheduledAt: b.scheduledAt,
          durationMinutes: b.durationMinutes,
          paidAmount: b.paidAmount,
          rating: b.studentRating,
          student: b.student,
        })),
      },
    });
  } catch (err) {
    console.error("[mentor/dashboard]", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Erreur serveur", detail: message }, { status: 500 });
  }
}

/**
 * PATCH /api/formations/mentor/dashboard
 * Update mentor profile (specialty, bio, price, availability, etc.)
 */
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const userId = session?.user?.id ?? (IS_DEV ? "dev-instructeur-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const body = await request.json();
    const allowed = [
      "specialty", "bio", "domain", "sessionPrice", "sessionDuration",
      "isAvailable", "languages", "coverImage",
      "timezone", "sessionBuffer", "bookingLeadTime",
    ];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) data[key] = body[key];
    }
    if (data.sessionPrice) data.sessionPrice = Number(data.sessionPrice);
    if (data.sessionDuration) data.sessionDuration = Number(data.sessionDuration);
    // Sanitize rich-text bio (Tiptap HTML) before storage to prevent XSS
    if (typeof data.bio === "string") {
      data.bio = sanitizeRichHtml(data.bio);
    }

    const profile = await prisma.mentorProfile.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        specialty: (data.specialty as string) ?? "",
        bio: (data.bio as string) ?? "",
        domain: (data.domain as string) ?? null,
        sessionPrice: (data.sessionPrice as number) ?? 25000,
        sessionDuration: (data.sessionDuration as number) ?? 60,
        isAvailable: (data.isAvailable as boolean) ?? true,
        languages: (data.languages as string[]) ?? [],
        coverImage: (data.coverImage as string) ?? null,
      },
    });

    return NextResponse.json({ data: profile });
  } catch (err) {
    console.error("[mentor/dashboard PATCH]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
