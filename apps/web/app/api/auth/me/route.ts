import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/auth/me
 * Returns minimal info about the current session user (including real DB role).
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ user: null });
    }

    // Look up the actual user in the DB to get the real role
    // (session can be stale, DB is source of truth)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true, role: true, formationsRole: true, status: true },
    });

    if (!user) {
      // Fallback to email
      const fallback = session.user.email
        ? await prisma.user.findUnique({
            where: { email: session.user.email.toLowerCase() },
            select: { id: true, email: true, name: true, role: true, formationsRole: true, status: true },
          })
        : null;
      return NextResponse.json({ user: fallback });
    }

    return NextResponse.json({ user });
  } catch (err) {
    console.error("[auth/me]", err);
    return NextResponse.json({ user: null, error: "Erreur serveur" }, { status: 500 });
  }
}
