import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { devStore } from "@/lib/dev/dev-store";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    // Only admin can search users
    const role = (session.user as Record<string, unknown>).role;
    if (role !== "admin") {
      return NextResponse.json({ error: "Acces non autorise" }, { status: 403 });
    }

    const q = request.nextUrl.searchParams.get("q")?.toLowerCase().trim();
    if (!q || q.length < 2) {
      return NextResponse.json({ users: [] });
    }

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      const allUsers = devStore.getAll();
      const results = allUsers
        .filter((u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
        )
        .filter((u) => u.id !== session.user.id) // Exclude self
        .slice(0, 10)
        .map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          avatar: u.name
            .split(" ")
            .map((w: string) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2),
        }));

      return NextResponse.json({ users: results });
    }

    // Production: Prisma
    const { prisma } = await import("@/lib/prisma");
    try {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
          NOT: { id: session.user.id },
        },
        select: { id: true, name: true, email: true, role: true, avatar: true },
        take: 20,
      });

      const results = users.map((u) => ({
        id: u.id,
        name: u.name ?? "",
        email: u.email,
        role: u.role,
        avatar:
          u.avatar ??
          (u.name ?? "??")
            .split(" ")
            .map((w: string) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2),
      }));

      return NextResponse.json({ users: results });
    } catch (dbError) {
      console.error("[API /admin/users/search] Prisma error", dbError);
      return NextResponse.json(
        { error: "Erreur lors de la recherche" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[API /admin/users/search]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recherche" },
      { status: 500 }
    );
  }
}
