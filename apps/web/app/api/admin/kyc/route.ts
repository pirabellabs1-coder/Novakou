import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma, IS_DEV } from "@/lib/prisma";
import { notificationStore } from "@/lib/dev/data-store";
import { devStore } from "@/lib/dev/dev-store";

// GET /api/admin/kyc — KYC verification queue
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }
    if (IS_DEV) {
      const users = devStore.getAll();

      // Build KYC queue from users who haven't reached level 4
      const kycQueue = users
        .filter((u) => u.role !== "admin" && u.kyc < 4)
        .map((u) => {
          // Determine what the next verification step is
          const nextLevel = u.kyc + 1;
          const levelDescriptions: Record<number, { label: string; verification: string }> = {
            1: {
              label: "Niveau 1 - Email",
              verification: "Verification de l'adresse email",
            },
            2: {
              label: "Niveau 2 - Telephone",
              verification: "Verification du numero de telephone",
            },
            3: {
              label: "Niveau 3 - Identite",
              verification: "Verification de la piece d'identite",
            },
            4: {
              label: "Niveau 4 - Professionnel",
              verification: "Verification professionnelle complete",
            },
          };

          const next = levelDescriptions[nextLevel] ?? levelDescriptions[4];

          return {
            userId: u.id,
            userName: u.name,
            userEmail: u.email,
            userRole: u.role,
            currentLevel: u.kyc,
            nextLevel,
            nextLevelLabel: next.label,
            nextVerification: next.verification,
            status: u.status,
            createdAt: u.createdAt,
            // Simulated document status
            documentSubmitted: u.kyc >= 2, // Simulate that level 2+ users have submitted docs
            documentType: u.kyc >= 2 ? "Carte d'identite nationale" : null,
            submittedAt: u.kyc >= 2 ? u.createdAt : null,
          };
        })
        .sort((a, b) => b.currentLevel - a.currentLevel); // Higher levels first (closer to approval)

      // Summary stats
      const summary = {
        total: kycQueue.length,
        level0: users.filter((u) => u.role !== "admin" && u.kyc === 0).length,
        level1: users.filter((u) => u.role !== "admin" && u.kyc === 1).length,
        level2: users.filter((u) => u.role !== "admin" && u.kyc === 2).length,
        level3: users.filter((u) => u.role !== "admin" && u.kyc === 3).length,
        level4: users.filter((u) => u.role !== "admin" && u.kyc === 4).length,
      };

      return NextResponse.json({
        queue: kycQueue,
        summary,
      });
    }

    // Production: Prisma
    const requests = await prisma.kycRequest.findMany({
      where: { status: "EN_ATTENTE" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            kyc: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const queue = requests.map((r) => ({
      userId: r.user.id,
      userName: r.user.name,
      userEmail: r.user.email,
      userRole: r.user.role,
      currentLevel: r.currentLevel,
      nextLevel: r.requestedLevel,
      nextLevelLabel: `Niveau ${r.requestedLevel}`,
      nextVerification: r.documentType,
      status: r.user.status,
      createdAt: r.createdAt,
      documentSubmitted: !!r.documentUrl,
      documentType: r.documentType,
      submittedAt: r.createdAt,
      requestId: r.id,
    }));

    // Summary from all users
    const summary = {
      total: queue.length,
      level0: await prisma.user.count({ where: { role: { not: "ADMIN" }, kyc: 0 } }),
      level1: await prisma.user.count({ where: { role: { not: "ADMIN" }, kyc: 1 } }),
      level2: await prisma.user.count({ where: { role: { not: "ADMIN" }, kyc: 2 } }),
      level3: await prisma.user.count({ where: { role: { not: "ADMIN" }, kyc: 3 } }),
      level4: await prisma.user.count({ where: { role: { not: "ADMIN" }, kyc: 4 } }),
    };

    return NextResponse.json({ queue, summary });
  } catch (error) {
    console.error("[API /admin/kyc GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation de la file KYC" },
      { status: 500 }
    );
  }
}

// POST /api/admin/kyc — Approve or refuse KYC verification
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const body = await request.json();
    const { action, userId, level, reason, requestId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId est requis" },
        { status: 400 }
      );
    }

    if (IS_DEV) {
      const user = devStore.findById(userId);
      if (!user) {
        return NextResponse.json(
          { error: "Utilisateur introuvable" },
          { status: 404 }
        );
      }

      switch (action) {
        case "approve": {
          const newLevel = level ?? user.kyc + 1;
          if (newLevel < 1 || newLevel > 4) {
            return NextResponse.json(
              { error: "Niveau KYC invalide (1-4)" },
              { status: 400 }
            );
          }

          devStore.update(userId, { kyc: newLevel });

          const levelBadges: Record<number, string> = {
            1: "Email verifie",
            2: "Telephone verifie",
            3: "Identite verifiee",
            4: "Professionnel verifie - Badge Elite",
          };

          notificationStore.add({
            userId,
            title: "Verification KYC approuvee",
            message: `Felicitations ! Votre verification de niveau ${newLevel} a ete approuvee. ${levelBadges[newLevel] ?? ""}`,
            type: "system",
            read: false,
            link: "/dashboard/parametres",
          });

          return NextResponse.json({
            success: true,
            message: `KYC niveau ${newLevel} approuve pour ${user.name}`,
            user: {
              id: user.id,
              name: user.name,
              kycLevel: newLevel,
            },
          });
        }

        case "refuse": {
          const refuseReason =
            reason ?? "Documents non conformes aux exigences de la plateforme";

          notificationStore.add({
            userId,
            title: "Verification KYC refusee",
            message: `Votre demande de verification a ete refusee. Motif : ${refuseReason}`,
            type: "system",
            read: false,
            link: "/dashboard/parametres",
          });

          return NextResponse.json({
            success: true,
            message: `Verification KYC refusee pour ${user.name}`,
            reason: refuseReason,
          });
        }

        default:
          return NextResponse.json(
            { error: `Action inconnue: ${action}` },
            { status: 400 }
          );
      }
    }

    // Production: Prisma
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    switch (action) {
      case "approve": {
        const newLevel = level ?? user.kyc + 1;
        if (newLevel < 1 || newLevel > 4) {
          return NextResponse.json(
            { error: "Niveau KYC invalide (1-4)" },
            { status: 400 }
          );
        }

        // Update KYC request and user level in a transaction
        await prisma.$transaction([
          ...(requestId
            ? [
                prisma.kycRequest.update({
                  where: { id: requestId },
                  data: {
                    status: "APPROUVE",
                    reviewedAt: new Date(),
                  },
                }),
              ]
            : []),
          prisma.user.update({
            where: { id: userId },
            data: { kyc: newLevel },
          }),
        ]);

        return NextResponse.json({
          success: true,
          message: `KYC niveau ${newLevel} approuve pour ${user.name}`,
          user: {
            id: user.id,
            name: user.name,
            kycLevel: newLevel,
          },
        });
      }

      case "refuse": {
        const refuseReason =
          reason ?? "Documents non conformes aux exigences de la plateforme";

        if (requestId) {
          await prisma.kycRequest.update({
            where: { id: requestId },
            data: {
              status: "REFUSE",
              refuseReason,
              reviewedAt: new Date(),
            },
          });
        }

        return NextResponse.json({
          success: true,
          message: `Verification KYC refusee pour ${user.name}`,
          reason: refuseReason,
        });
      }

      default:
        return NextResponse.json(
          { error: `Action inconnue: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[API /admin/kyc POST]", error);
    return NextResponse.json(
      { error: "Erreur lors de l'action KYC" },
      { status: 500 }
    );
  }
}
