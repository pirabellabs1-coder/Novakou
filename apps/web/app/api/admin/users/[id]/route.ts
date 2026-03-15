import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { devStore } from "@/lib/dev/dev-store";
import { serviceStore, orderStore, transactionStore, notificationStore } from "@/lib/dev/data-store";

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
    const user = devStore.findById(id);

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouve" }, { status: 404 });
    }

    // Aggregate stats
    const allOrders = orderStore.getAll();
    const allTransactions = transactionStore.getAll();

    const userOrders = allOrders.filter(
      (o) => o.clientId === id || o.freelanceId === id
    );
    const userTransactions = allTransactions.filter(
      (t) => t.userId === id && t.type === "vente" && t.status === "complete"
    );
    const revenue = userTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalSpent = allOrders
      .filter((o) => o.clientId === id && o.status === "termine")
      .reduce((sum, o) => sum + o.amount, 0);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
        status: user.status,
        kycLevel: user.kyc,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt ?? null,
        loginCount: user.loginCount,
        ordersCount: userOrders.length,
        revenue: Math.round(revenue * 100) / 100,
        totalSpent: Math.round(totalSpent * 100) / 100,
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
    const { status, role, plan, kyc } = body;

    const user = devStore.findById(id);
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouve" }, { status: 404 });
    }

    // Determine link prefix based on user role
    const linkPrefix = user.role === "client" ? "/client"
      : user.role === "agence" ? "/agence"
      : "/dashboard";

    // ── Status changes with cascade ──
    if (status && status !== user.status) {
      devStore.update(id, { status });

      if (status === "suspendu" || status === "SUSPENDU") {
        // Cascade: pause all user's services
        const userServices = serviceStore.getAll().filter((s) => s.userId === id && s.status === "actif");
        for (const svc of userServices) {
          serviceStore.update(svc.id, { status: "pause" });
        }

        notificationStore.add({
          userId: id,
          title: "Compte suspendu",
          message: "Votre compte a ete suspendu par l'administration. Vos services ont ete mis en pause.",
          type: "system",
          read: false,
          link: `${linkPrefix}/parametres`,
        });

        return NextResponse.json({ success: true, message: `Utilisateur ${user.name} suspendu, ${userServices.length} service(s) mis en pause` });
      }

      if (status === "banni" || status === "BANNI") {
        // Cascade: refuse all services
        const userServices = serviceStore.getAll().filter((s) => s.userId === id && s.status !== "refuse");
        for (const svc of userServices) {
          serviceStore.update(svc.id, { status: "refuse", refuseReason: "Compte banni" });
        }

        // Cascade: cancel active orders
        const activeOrders = orderStore.getAll().filter(
          (o) => (o.freelanceId === id || o.clientId === id) && ["en_attente", "en_cours", "revision"].includes(o.status)
        );
        for (const order of activeOrders) {
          orderStore.update(order.id, {
            status: "annule",
            timeline: [
              ...order.timeline,
              {
                id: `t${Date.now()}`,
                type: "cancelled",
                title: "Annulation — compte banni",
                description: "La commande a ete annulee suite au bannissement d'un participant.",
                timestamp: new Date().toISOString(),
              },
            ],
          });

          // Notify the other party
          const otherPartyId = order.freelanceId === id ? order.clientId : order.freelanceId;
          const otherLinkPrefix = order.freelanceId === id ? "/client" : "/dashboard";
          notificationStore.add({
            userId: otherPartyId,
            title: "Commande annulee",
            message: `La commande "${order.serviceTitle}" a ete annulee par l'administration.`,
            type: "order",
            read: false,
            link: `${otherLinkPrefix}/commandes/${order.id}`,
          });
        }

        // Cascade: freeze pending transactions
        const pendingTxs = transactionStore.getAll().filter(
          (t) => t.userId === id && t.status === "en_attente"
        );
        for (const tx of pendingTxs) {
          transactionStore.update(tx.id, { status: "bloque" });
        }

        notificationStore.add({
          userId: id,
          title: "Compte banni",
          message: "Votre compte a ete banni par l'administration. Vos services, commandes et transactions ont ete suspendus.",
          type: "system",
          read: false,
          link: `${linkPrefix}/parametres`,
        });

        return NextResponse.json({
          success: true,
          message: `Utilisateur ${user.name} banni, ${userServices.length} service(s) refuse(s), ${activeOrders.length} commande(s) annulee(s), ${pendingTxs.length} transaction(s) gelee(s)`,
        });
      }

      if (status === "actif" || status === "ACTIF") {
        // Cascade: reactivate paused services (only those paused, not refused for other reasons)
        const pausedServices = serviceStore.getAll().filter((s) => s.userId === id && s.status === "pause");
        for (const svc of pausedServices) {
          serviceStore.update(svc.id, { status: "actif" });
        }

        // Unfreeze blocked transactions
        const blockedTxs = transactionStore.getAll().filter(
          (t) => t.userId === id && t.status === "bloque"
        );
        for (const tx of blockedTxs) {
          transactionStore.update(tx.id, { status: "en_attente" });
        }

        notificationStore.add({
          userId: id,
          title: "Compte reactive",
          message: "Votre compte a ete reactive par l'administration. Vos services sont de nouveau actifs.",
          type: "system",
          read: false,
          link: `${linkPrefix}/parametres`,
        });

        return NextResponse.json({
          success: true,
          message: `Utilisateur ${user.name} reactive, ${pausedServices.length} service(s) reactif(s)`,
        });
      }

      // Generic status change
      return NextResponse.json({ success: true, message: `Statut de ${user.name} mis a jour: ${status}` });
    }

    // ── Role change ──
    if (role && role !== user.role) {
      devStore.update(id, { role });

      notificationStore.add({
        userId: id,
        title: "Role modifie",
        message: `Votre role a ete modifie: ${user.role} → ${role}`,
        type: "system",
        read: false,
        link: `${linkPrefix}/parametres`,
      });

      return NextResponse.json({ success: true, message: `Role de ${user.name} mis a jour: ${role}` });
    }

    // ── Plan change ──
    if (plan && plan !== user.plan) {
      devStore.update(id, { plan });

      notificationStore.add({
        userId: id,
        title: "Plan modifie",
        message: `Votre plan d'abonnement a ete modifie: ${user.plan} → ${plan}`,
        type: "system",
        read: false,
        link: `${linkPrefix}/parametres`,
      });

      return NextResponse.json({ success: true, message: `Plan de ${user.name} mis a jour: ${plan}` });
    }

    // ── KYC level change ──
    if (kyc !== undefined && kyc !== user.kyc) {
      devStore.update(id, { kyc });

      notificationStore.add({
        userId: id,
        title: "Niveau KYC mis a jour",
        message: `Votre niveau de verification a ete mis a jour: niveau ${kyc}`,
        type: "system",
        read: false,
        link: `${linkPrefix}/parametres`,
      });

      return NextResponse.json({ success: true, message: `KYC de ${user.name} mis a jour: niveau ${kyc}` });
    }

    // Generic update (any other fields)
    const allowedFields = ["name", "email"] as const;
    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) updates[field] = body[field];
    }
    if (Object.keys(updates).length > 0) {
      devStore.update(id, updates as Partial<typeof user>);
    }

    return NextResponse.json({ success: true, message: `Utilisateur ${user.name} mis a jour` });
  } catch (error) {
    console.error("[API /admin/users/[id] PATCH]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
