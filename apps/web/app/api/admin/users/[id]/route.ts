import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma, IS_DEV } from "@/lib/prisma";
import { devStore } from "@/lib/dev/dev-store";
import { serviceStore, orderStore, transactionStore, notificationStore } from "@/lib/dev/data-store";
import { createAuditLog } from "@/lib/admin/audit";
import { sendAccountSuspendedEmail, sendAccountBannedEmail } from "@/lib/admin/admin-emails";

// GET /api/admin/users/[id] — Get user detail
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }
    const { id } = await params;

    if (IS_DEV) {
      const user = devStore.findById(id);
      if (!user) {
        return NextResponse.json({ error: "Utilisateur non trouve" }, { status: 404 });
      }

      const allOrders = orderStore.getAll();
      const allTransactions = transactionStore.getAll();
      const userOrders = allOrders.filter((o) => o.clientId === id || o.freelanceId === id);
      const userTransactions = allTransactions.filter((t) => t.userId === id && t.type === "vente" && t.status === "complete");
      const revenue = userTransactions.reduce((sum, t) => sum + t.amount, 0);
      const totalSpent = allOrders.filter((o) => o.clientId === id && o.status === "termine").reduce((sum, o) => sum + o.amount, 0);

      return NextResponse.json({
        user: {
          id: user.id, name: user.name, email: user.email, role: user.role,
          plan: user.plan, status: user.status.toLowerCase(), kycLevel: user.kyc,
          country: user.country || null,
          createdAt: user.createdAt, lastLoginAt: user.lastLoginAt ?? null,
          loginCount: user.loginCount, ordersCount: userOrders.length,
          revenue: Math.round(revenue * 100) / 100, totalSpent: Math.round(totalSpent * 100) / 100,
        },
      });
    }

    // Production: Prisma
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: { select: { ordersAsClient: true, ordersAsFreelance: true, services: true } },
      },
    });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouve" }, { status: 404 });
    }

    const revenueResult = await prisma.payment.aggregate({
      where: { payeeId: id, status: "COMPLETE", type: "paiement" },
      _sum: { amount: true },
    });
    const spentResult = await prisma.order.aggregate({
      where: { clientId: id, status: "TERMINE" },
      _sum: { amount: true },
    });

    return NextResponse.json({
      user: {
        id: user.id, name: user.name, email: user.email,
        role: user.role.toLowerCase(), plan: user.plan.toLowerCase(),
        status: user.status.toLowerCase(), kycLevel: user.kyc,
        country: user.country ?? null,
        createdAt: user.createdAt, lastLoginAt: user.lastLoginAt,
        loginCount: user.loginCount,
        ordersCount: user._count.ordersAsClient + user._count.ordersAsFreelance,
        servicesCount: user._count.services,
        revenue: Math.round((revenueResult._sum.amount ?? 0) * 100) / 100,
        totalSpent: Math.round((spentResult._sum.amount ?? 0) * 100) / 100,
      },
    });
  } catch (error) {
    console.error("[API /admin/users/[id] GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH /api/admin/users/[id] — Update user with cascade effects
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, role, plan, kyc, reason } = body;

    if (IS_DEV) {
      const user = devStore.findById(id);
      if (!user) {
        return NextResponse.json({ error: "Utilisateur non trouve" }, { status: 404 });
      }

      const linkPrefix = user.role === "client" ? "/client" : user.role === "agence" ? "/agence" : "/dashboard";

      if (status && status !== user.status) {
        devStore.update(id, { status });

        if (status === "suspendu" || status === "SUSPENDU") {
          const userServices = serviceStore.getAll().filter((s) => s.userId === id && s.status === "actif");
          for (const svc of userServices) serviceStore.update(svc.id, { status: "pause" });
          notificationStore.add({ userId: id, title: "Compte suspendu", message: "Votre compte a ete suspendu par l'administration.", type: "system", read: false, link: `${linkPrefix}/parametres` });
          sendAccountSuspendedEmail(user.email, user.name, reason).catch(() => {});
          return NextResponse.json({ success: true, message: `Utilisateur ${user.name} suspendu, ${userServices.length} service(s) mis en pause` });
        }

        if (status === "banni" || status === "BANNI") {
          const userServices = serviceStore.getAll().filter((s) => s.userId === id && s.status !== "refuse");
          for (const svc of userServices) serviceStore.update(svc.id, { status: "refuse", refuseReason: "Compte banni" });
          const activeOrders = orderStore.getAll().filter((o) => (o.freelanceId === id || o.clientId === id) && ["en_attente", "en_cours", "revision"].includes(o.status));
          for (const order of activeOrders) {
            orderStore.update(order.id, { status: "annule", timeline: [...order.timeline, { id: `t${Date.now()}`, type: "cancelled", title: "Annulation — compte banni", description: "La commande a ete annulee suite au bannissement d'un participant.", timestamp: new Date().toISOString() }] });
            const otherPartyId = order.freelanceId === id ? order.clientId : order.freelanceId;
            notificationStore.add({ userId: otherPartyId, title: "Commande annulee", message: `La commande "${order.serviceTitle}" a ete annulee par l'administration.`, type: "order", read: false, link: `/dashboard/commandes/${order.id}` });
          }
          notificationStore.add({ userId: id, title: "Compte banni", message: "Votre compte a ete banni par l'administration.", type: "system", read: false, link: `${linkPrefix}/parametres` });
          sendAccountBannedEmail(user.email, user.name, reason).catch(() => {});
          return NextResponse.json({ success: true, message: `Utilisateur ${user.name} banni` });
        }

        if (status === "actif" || status === "ACTIF") {
          const pausedServices = serviceStore.getAll().filter((s) => s.userId === id && s.status === "pause");
          for (const svc of pausedServices) serviceStore.update(svc.id, { status: "actif" });
          notificationStore.add({ userId: id, title: "Compte reactive", message: "Votre compte a ete reactive.", type: "system", read: false, link: `${linkPrefix}/parametres` });
          return NextResponse.json({ success: true, message: `Utilisateur ${user.name} reactive` });
        }

        return NextResponse.json({ success: true, message: `Statut de ${user.name} mis a jour: ${status}` });
      }

      if (role && role !== user.role) {
        devStore.update(id, { role });
        return NextResponse.json({ success: true, message: `Role de ${user.name} mis a jour: ${role}` });
      }
      if (plan && plan !== user.plan) {
        devStore.update(id, { plan });
        return NextResponse.json({ success: true, message: `Plan de ${user.name} mis a jour: ${plan}` });
      }
      if (kyc !== undefined && kyc !== user.kyc) {
        devStore.update(id, { kyc });
        return NextResponse.json({ success: true, message: `KYC de ${user.name} mis a jour: niveau ${kyc}` });
      }

      return NextResponse.json({ success: true, message: `Utilisateur ${user.name} mis a jour` });
    }

    // ── Production: Prisma ──
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouve" }, { status: 404 });
    }

    if (status) {
      const prismaStatus = status.toUpperCase() as "ACTIF" | "SUSPENDU" | "BANNI";

      await prisma.user.update({ where: { id }, data: { status: prismaStatus, suspendReason: reason } });

      // Cascade effects
      if (prismaStatus === "SUSPENDU") {
        await prisma.service.updateMany({
          where: { userId: id, status: "ACTIF" },
          data: { status: "PAUSE" },
        });
        await prisma.notification.create({
          data: { userId: id, title: "Compte suspendu", message: "Votre compte a ete suspendu par l'administration.", type: "ADMIN_ACTION" },
        });
        sendAccountSuspendedEmail(user.email, user.name, reason).catch((err) =>
          console.error("[Admin] Failed to send suspension email to", user.email, err)
        );
      }

      if (prismaStatus === "BANNI") {
        await prisma.service.updateMany({
          where: { userId: id, status: { not: "REFUSE" } },
          data: { status: "REFUSE", refuseReason: "Compte banni" },
        });
        await prisma.order.updateMany({
          where: { OR: [{ freelanceId: id }, { clientId: id }], status: { in: ["EN_ATTENTE", "EN_COURS", "REVISION"] } },
          data: { status: "ANNULE" },
        });
        await prisma.notification.create({
          data: { userId: id, title: "Compte banni", message: "Votre compte a ete banni par l'administration.", type: "ADMIN_ACTION" },
        });
        sendAccountBannedEmail(user.email, user.name, reason).catch((err) =>
          console.error("[Admin] Failed to send ban email to", user.email, err)
        );
      }

      if (prismaStatus === "ACTIF") {
        await prisma.service.updateMany({
          where: { userId: id, status: "PAUSE" },
          data: { status: "ACTIF" },
        });
        await prisma.notification.create({
          data: { userId: id, title: "Compte reactive", message: "Votre compte a ete reactive par l'administration.", type: "ADMIN_ACTION" },
        });
      }

      await createAuditLog({
        actorId: session.user.id,
        action: `user.${prismaStatus.toLowerCase()}`,
        targetUserId: id,
        details: { previousStatus: user.status, newStatus: prismaStatus, reason },
      });

      return NextResponse.json({ success: true, message: `Statut de ${user.name} mis a jour: ${prismaStatus}` });
    }

    if (role) {
      const prismaRole = role.toUpperCase() as "FREELANCE" | "CLIENT" | "AGENCE" | "ADMIN";
      await prisma.user.update({ where: { id }, data: { role: prismaRole } });
      await createAuditLog({ actorId: session.user.id, action: "user.role_changed", targetUserId: id, details: { from: user.role, to: prismaRole } });
      return NextResponse.json({ success: true, message: `Role de ${user.name} mis a jour: ${prismaRole}` });
    }

    if (plan) {
      const prismaPlan = plan.toUpperCase() as "GRATUIT" | "PRO" | "BUSINESS" | "AGENCE";
      await prisma.user.update({ where: { id }, data: { plan: prismaPlan } });
      await createAuditLog({ actorId: session.user.id, action: "user.plan_changed", targetUserId: id, details: { from: user.plan, to: prismaPlan } });
      return NextResponse.json({ success: true, message: `Plan de ${user.name} mis a jour: ${prismaPlan}` });
    }

    if (kyc !== undefined) {
      await prisma.user.update({ where: { id }, data: { kyc } });
      await createAuditLog({ actorId: session.user.id, action: "user.kyc_changed", targetUserId: id, details: { from: user.kyc, to: kyc } });
      return NextResponse.json({ success: true, message: `KYC de ${user.name} mis a jour: niveau ${kyc}` });
    }

    return NextResponse.json({ success: true, message: `Utilisateur ${user.name} mis a jour` });
  } catch (error) {
    console.error("[API /admin/users/[id] PATCH]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
