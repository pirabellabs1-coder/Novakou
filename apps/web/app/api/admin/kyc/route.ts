import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { devStore } from "@/lib/dev/dev-store";
import { kycRequestStore } from "@/lib/dev/data-store";
import { emitEvent } from "@/lib/events/dispatcher";
import { createAuditLog } from "@/lib/admin/audit";

// GET /api/admin/kyc — KYC verification queue
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }
    if (IS_DEV) {
      const users = devStore.getAll();

      // Build KYC queue from actual pending KYC requests
      const pendingRequests = kycRequestStore.getPending();

      const kycQueue = pendingRequests.map((req) => {
        const user = devStore.findById(req.userId);
        return {
          userId: req.userId,
          userName: user?.name || "Utilisateur inconnu",
          userEmail: user?.email || "",
          userRole: user?.role || "freelance",
          currentLevel: user?.kyc || 1,
          nextLevel: req.level,
          nextLevelLabel: `Niveau ${req.level} - ${req.level === 3 ? "Identite" : req.level === 4 ? "Professionnel" : "Verification"}`,
          nextVerification: req.documentType || "Document",
          status: user?.status || "actif",
          createdAt: req.createdAt,
          documentSubmitted: true,
          documentType: req.documentType,
          submittedAt: req.createdAt,
          requestId: req.id,
        };
      });

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

          // Update the KYC request status to approved
          if (requestId) {
            kycRequestStore.update(requestId, {
              status: "approuve",
              reviewedAt: new Date().toISOString(),
              reviewedBy: session.user.id,
            });
          } else {
            // Find pending request for this user and approve it
            const pending = kycRequestStore.getByUser(userId).find((r) => r.status === "en_attente");
            if (pending) {
              kycRequestStore.update(pending.id, {
                status: "approuve",
                reviewedAt: new Date().toISOString(),
                reviewedBy: session.user.id,
              });
            }
          }

          // Emit KYC approved event (notification + email)
          emitEvent("kyc.approved", {
            userId, userName: user.name, userEmail: user.email, level: newLevel,
          }).catch((err) => console.error("[KYC] emitEvent approved error:", err));

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

          // Update the KYC request status to refused
          if (requestId) {
            kycRequestStore.update(requestId, {
              status: "refuse",
              reason: refuseReason,
              reviewedAt: new Date().toISOString(),
              reviewedBy: session.user.id,
            });
          } else {
            const pending = kycRequestStore.getByUser(userId).find((r) => r.status === "en_attente");
            if (pending) {
              kycRequestStore.update(pending.id, {
                status: "refuse",
                reason: refuseReason,
                reviewedAt: new Date().toISOString(),
                reviewedBy: session.user.id,
              });
            }
          }

          // Emit KYC rejected event (notification + email)
          emitEvent("kyc.rejected", {
            userId, userName: user.name, userEmail: user.email,
            level: user.kyc + 1, reason: refuseReason,
          }).catch((err) => console.error("[KYC] emitEvent rejected error:", err));

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
                    reviewedBy: session.user.id,
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

        // Emit KYC approved event (notification + email)
        emitEvent("kyc.approved", {
          userId, userName: user.name, userEmail: user.email, level: newLevel,
        }).catch((err) => console.error("[KYC] emitEvent approved error:", err));

        // Audit log
        await createAuditLog({
          actorId: session.user.id,
          action: "kyc.approved",
          targetUserId: userId,
          details: { previousLevel: user.kyc, newLevel, requestId },
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

        if (requestId) {
          await prisma.kycRequest.update({
            where: { id: requestId },
            data: {
              status: "REFUSE",
              refuseReason,
              reviewedBy: session.user.id,
              reviewedAt: new Date(),
            },
          });
        }

        // Emit KYC rejected event (notification + email)
        emitEvent("kyc.rejected", {
          userId, userName: user.name, userEmail: user.email,
          level: user.kyc + 1, reason: refuseReason,
        }).catch((err) => console.error("[KYC] emitEvent rejected error:", err));

        // Audit log
        await createAuditLog({
          actorId: session.user.id,
          action: "kyc.refused",
          targetUserId: userId,
          details: { requestedLevel: user.kyc + 1, reason: refuseReason, requestId },
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
  } catch (error) {
    console.error("[API /admin/kyc POST]", error);
    return NextResponse.json(
      { error: "Erreur lors de l'action KYC" },
      { status: 500 }
    );
  }
}
