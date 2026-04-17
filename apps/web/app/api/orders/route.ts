import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";
import { orderStore, serviceStore, transactionStore, conversationStore } from "@/lib/dev/data-store";
import { emitEvent } from "@/lib/events/dispatcher";
import { trackingStore } from "@/lib/tracking/tracking-store";
import { rateLimit } from "@/lib/api-rate-limit";
import { z } from "zod";
import { calculateCommissionEur, getCommissionLabel, normalizePlanName } from "@/lib/plans";

const createOrderSchema = z.object({
  serviceId: z.string().min(1, "serviceId est requis"),
  packageType: z.enum(["basic", "standard", "premium"], { error: "Type de forfait invalide" }),
  requirements: z.string().max(5000, "Les exigences ne doivent pas depasser 5000 caracteres").optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const devMode = process.env.DEV_MODE === "true";
    if (!session?.user && !devMode) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }
    const userId = session?.user?.id || (IS_DEV ? "user-freelance-001" : "dev-user");
    const userRole = (session?.user as Record<string, unknown>)?.role as string || "freelance";

    const { searchParams } = request.nextUrl;
    const statusFilter = searchParams.get("status");
    // ?side=seller (default for freelance) or ?side=buyer (achats)
    const sideFilter = searchParams.get("side");

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      let orders;

      // All roles can be both buyer and seller
      if (sideFilter === "buyer") {
        orders = orderStore.getByClient(userId);
      } else if (sideFilter === "seller") {
        orders = orderStore.getByFreelance(userId);
      } else if (userRole === "client") {
        orders = orderStore.getByClient(userId);
      } else {
        const freelanceOrders = orderStore.getByFreelance(userId);
        const clientOrders = orderStore.getByClient(userId);
        const seen = new Set<string>();
        orders = [];
        for (const o of [...freelanceOrders, ...clientOrders]) {
          if (!seen.has(o.id)) {
            seen.add(o.id);
            orders.push(o);
          }
        }
      }

      if (statusFilter) {
        orders = orders.filter((o) => o.status === statusFilter);
      }

      return NextResponse.json({ orders });
    } else {
      // Production: Prisma — session guaranteed non-null here
      const user = session!.user;
      let where: Record<string, unknown>;

      // For agencies, also include orders linked to the agency profile
      let agencyProfileId: string | null = null;
      const userRole = (user as Record<string, unknown>).role as string;
      if (userRole === "AGENCE" || userRole === "agence") {
        const agencyProfile = await prisma.agencyProfile.findUnique({
          where: { userId: user.id },
          select: { id: true },
        });
        if (agencyProfile) agencyProfileId = agencyProfile.id;
      }

      if (sideFilter === "buyer") {
        where = { clientId: user.id };
      } else if (sideFilter === "seller") {
        if (agencyProfileId) {
          // Agency seller view: only agency orders, not personal freelance orders
          where = { agencyId: agencyProfileId };
        } else {
          where = { freelanceId: user.id };
        }
      } else if (user.role === "client" || userRole === "CLIENT") {
        where = { clientId: user.id };
      } else if (agencyProfileId) {
        // Agency default view: agency orders + orders as buyer (not personal freelance)
        where = { OR: [{ agencyId: agencyProfileId }, { clientId: user.id }] };
      } else {
        // Freelance/admin: both buyer and seller
        where = { OR: [{ freelanceId: user.id }, { clientId: user.id }] };
      }

      if (statusFilter) {
        where.status = statusFilter.toUpperCase() as string;
      }

      const rawOrders = await prisma.order.findMany({
        where,
        include: { service: true, client: true, freelance: true },
        orderBy: { createdAt: "desc" },
      });

      // Normalize Prisma UPPERCASE enum values to lowercase for frontend compatibility
      const orders = rawOrders.map((o) => ({
        ...o,
        status: o.status.toLowerCase(),
        escrowStatus: o.escrowStatus?.toLowerCase() ?? o.escrowStatus,
      }));

      return NextResponse.json({ orders });
    }
  } catch (error) {
    console.error("[API /orders GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des commandes" },
      { status: 500 }
    );
  }
}

// Commission calculation now uses centralized plan rules from @/lib/plans
// Old hardcoded rates removed in favor of calculateCommissionEur()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const rl = rateLimit(`orders:${session.user.id}`, 10, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Trop de requetes. Reessayez dans 1 minute." }, { status: 429 });
    }

    const body = await request.json();
    const result = createOrderSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Donnees invalides", details: z.treeifyError(result.error) },
        { status: 400 }
      );
    }
    const { serviceId, packageType, requirements } = result.data;

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      // Look up the service
      const service = serviceStore.getById(serviceId);
      if (!service) {
        return NextResponse.json(
          { error: "Service introuvable" },
          { status: 404 }
        );
      }

      if (service.status !== "actif") {
        return NextResponse.json(
          { error: "Ce service n'est pas disponible" },
          { status: 400 }
        );
      }

      // Cannot order your own service
      if (service.userId === session.user.id) {
        return NextResponse.json(
          { error: "Vous ne pouvez pas commander votre propre service" },
          { status: 400 }
        );
      }

      // Get package details
      const pkg = service.packages[packageType];
      if (!pkg) {
        return NextResponse.json(
          { error: "Forfait introuvable pour ce service" },
          { status: 400 }
        );
      }

      const amount = pkg.price;
      const vendorPlan = normalizePlanName(service.vendorPlan);
      const commission = calculateCommissionEur(vendorPlan, amount);
      const commissionLabel = getCommissionLabel(vendorPlan);

      // Calculate deadline
      const now = new Date();
      const deadlineDate = new Date(now.getTime() + pkg.deliveryDays * 24 * 60 * 60 * 1000);
      const deadline = deadlineDate.toISOString().slice(0, 10);

      // Build client info from session
      const clientName = session.user.name || "Client";
      const clientInitials = clientName
        .split(" ")
        .map((w: string) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      // Create the order
      const order = orderStore.create({
        serviceId: service.id,
        serviceTitle: service.title,
        category: service.categoryName,
        clientId: session.user.id,
        clientName,
        clientAvatar: clientInitials,
        clientCountry: "FR",
        freelanceId: service.userId,
        freelanceName: service.vendorName || "Freelance",
        status: "en_attente",
        amount,
        commission,
        packageType,
        requirements: requirements || undefined,
        deadline,
        deliveredAt: null,
        completedAt: null,
        progress: 0,
        revisionsLeft: pkg.revisions,
        messages: requirements
          ? [
              {
                id: `m${Date.now()}`,
                sender: "client" as const,
                senderName: clientName,
                content: requirements,
                timestamp: now.toISOString(),
                type: "text" as const,
              },
            ]
          : [],
        timeline: [
          {
            id: `t${Date.now()}`,
            type: "created" as const,
            title: "Commande creee",
            description: `Forfait ${pkg.name || packageType} - ${service.title}`,
            timestamp: now.toISOString(),
          },
        ],
        files: [],
      });

      // Create escrow transaction for the freelance (pending)
      transactionStore.add({
        userId: service.userId,
        type: "vente",
        description: `Commande ${order.id} - ${service.title} (${packageType})`,
        amount: amount - commission,
        status: "en_attente",
        date: now.toISOString().slice(0, 10),
        orderId: order.id,
      });

      // Create commission transaction
      transactionStore.add({
        userId: service.userId,
        type: "commission",
        description: `Commission ${commissionLabel} sur commande ${order.id}`,
        amount: -commission,
        status: "en_attente",
        date: now.toISOString().slice(0, 10),
        orderId: order.id,
      });

      // Increment service order count
      serviceStore.update(service.id, {
        orderCount: service.orderCount + 1,
      });

      // Auto-create conversation between client and freelance for this order
      conversationStore.create({
        participants: [session.user.id, service.userId],
        contactName: service.vendorName || "Freelance",
        contactAvatar: service.vendorAvatar || "FL",
        contactRole: "client",
        orderId: order.id,
      });

      // Emit order.created event (notifications + emails)
      emitEvent("order.created", {
        orderId: order.id,
        serviceTitle: service.title,
        amount,
        freelanceId: service.userId,
        freelanceName: service.vendorName || "Freelance",
        freelanceEmail: service.vendorUsername ? `${service.vendorUsername}@novakou.com` : "",
        clientId: session.user.id,
        clientName,
        clientEmail: session.user.email || "",
        deadline,
      }).catch((err) => console.error("[API /orders POST] emitEvent error:", err));

      // Track conversion
      trackingStore.trackConversion("order_placed", service.id, {
        orderId: order.id,
        amount: String(amount),
        clientId: session.user.id,
        freelanceId: service.userId,
      });

      return NextResponse.json({ order }, { status: 201 });
    } else {
      // Production: Prisma
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
        include: { user: true },
      });

      if (!service) {
        return NextResponse.json(
          { error: "Service introuvable" },
          { status: 404 }
        );
      }

      if (service.status !== "ACTIF" && service.status !== "VEDETTE") {
        return NextResponse.json(
          { error: "Ce service n'est pas disponible" },
          { status: 400 }
        );
      }

      // Cannot order your own service
      if (service.userId === session.user.id) {
        return NextResponse.json(
          { error: "Vous ne pouvez pas commander votre propre service" },
          { status: 400 }
        );
      }

      // Get package details from the JSON packages field
      const packages = service.packages as Record<string, { price?: number; deliveryDays?: number; revisions?: number; name?: string }> | null;
      const pkg = packages?.[packageType];
      if (!pkg || !pkg.price) {
        return NextResponse.json(
          { error: "Forfait introuvable pour ce service" },
          { status: 400 }
        );
      }

      const amount = pkg.price;
      const freelancePlan = normalizePlanName(service.user.plan);
      const commission = calculateCommissionEur(freelancePlan, amount);
      const commissionLabel = getCommissionLabel(freelancePlan);

      // Calculate deadline
      const deliveryDays = pkg.deliveryDays ?? service.deliveryDays;
      const deadlineDate = new Date(Date.now() + deliveryDays * 24 * 60 * 60 * 1000);

      // platformFee = commission (plan-based: 12%/5%/1EUR/0%) — freelancerPayout = rest
      const platformFee = commission;
      const freelancerPayout = amount - platformFee;

      // Try full order creation with Escrow + AdminWallet; fall back to basic if new tables don't exist yet
      let order;
      try {
        order = await prisma.$transaction(async (tx) => {
          const newOrder = await tx.order.create({
            data: {
              serviceId,
              clientId: session.user.id,
              freelanceId: service.userId,
              agencyId: service.agencyId || undefined,
              status: "EN_ATTENTE",
              escrowStatus: "HELD",
              amount,
              currency: "EUR",
              commission,
              platformFee,
              freelancerPayout,
              title: service.title,
              description: service.descriptionText || null,
              deliveryDays,
              packageType,
              requirements: requirements || null,
              deadline: deadlineDate,
            },
            include: { service: true, client: true, freelance: true },
          });

          await tx.escrow.create({
            data: {
              orderId: newOrder.id,
              amount,
              currency: "EUR",
              reason: "ORDER_PAYMENT",
              status: "HELD",
            },
          });

          await tx.payment.create({
            data: {
              orderId: newOrder.id,
              payerId: session.user.id,
              payeeId: service.userId,
              amount: freelancerPayout,
              currency: "EUR",
              status: "EN_ATTENTE",
              type: "paiement",
              description: `Commande ${newOrder.id} - ${service.title} (${packageType})`,
            },
          });

          await tx.payment.create({
            data: {
              orderId: newOrder.id,
              payerId: session.user.id,
              amount: platformFee,
              currency: "EUR",
              status: "EN_ATTENTE",
              type: "commission",
              description: `Commission ${commissionLabel} sur commande ${newOrder.id}`,
            },
          });

          // Admin wallet — best-effort (table may not exist yet)
          try {
            let adminWallet = await tx.adminWallet.findFirst();
            if (!adminWallet) {
              adminWallet = await tx.adminWallet.create({ data: {} });
            }
            await tx.adminWallet.update({
              where: { id: adminWallet.id },
              data: { totalFeesHeld: { increment: platformFee } },
            });
            await tx.adminTransaction.create({
              data: {
                adminWalletId: adminWallet.id,
                type: "SERVICE_FEE",
                amount: platformFee,
                currency: "EUR",
                description: `Commission ${commissionLabel} - ${service.title} (Commande #${newOrder.id.slice(0, 8)})`,
                orderId: newOrder.id,
                status: "PENDING",
              },
            });
          } catch {
            console.warn("[Orders POST] AdminWallet/AdminTransaction tables not yet migrated, skipping");
          }

          await tx.service.update({
            where: { id: serviceId },
            data: { orderCount: { increment: 1 } },
          });

          // Track order for active boost (if service is boosted)
          if (service.isBoosted) {
            try {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const activeBoost = await tx.boost.findFirst({
                where: { serviceId, status: "ACTIVE" },
              });
              if (activeBoost) {
                await tx.boost.update({
                  where: { id: activeBoost.id },
                  data: { actualOrders: { increment: 1 } },
                });
                await tx.boostDailyStat.updateMany({
                  where: { boostId: activeBoost.id, date: today },
                  data: { orders: { increment: 1 } },
                });
              }
            } catch {
              // Boost tracking is best-effort
            }
          }

          const conversation = await tx.conversation.create({
            data: {
              type: "ORDER",
              orderId: newOrder.id,
              users: {
                create: [
                  { userId: session.user.id },
                  { userId: service.userId },
                ],
              },
            },
          });

          if (requirements) {
            await tx.message.create({
              data: {
                conversationId: conversation.id,
                senderId: session.user.id,
                content: requirements,
                type: "TEXT",
              },
            });
          }

          return newOrder;
        });
      } catch (txErr) {
        // Fallback: basic order creation without Escrow/AdminWallet (migration not deployed)
        console.warn("[Orders POST] Full transaction failed, using basic fallback:", txErr);
        order = await prisma.order.create({
          data: {
            serviceId,
            clientId: session.user.id,
            freelanceId: service.userId,
            agencyId: service.agencyId || undefined,
            status: "EN_ATTENTE",
            escrowStatus: "HELD",
            amount,
            currency: "EUR",
            commission,
            platformFee,
            freelancerPayout,
            title: service.title,
            description: service.descriptionText || null,
            deliveryDays,
            packageType,
            requirements: requirements || null,
            deadline: deadlineDate,
          },
          include: { service: true, client: true, freelance: true },
        });

        await prisma.service.update({
          where: { id: serviceId },
          data: { orderCount: { increment: 1 } },
        }).catch(() => {});
      }

      // Emit order.created event (notifications + emails)
      emitEvent("order.created", {
        orderId: order.id,
        serviceTitle: service.title,
        amount,
        freelanceId: service.userId,
        freelanceName: service.user.name || "Freelance",
        freelanceEmail: service.user.email || "",
        clientId: session.user.id,
        clientName: session.user.name || "Client",
        clientEmail: session.user.email || "",
        deadline: deadlineDate.toISOString().slice(0, 10),
      }).catch((err) => console.error("[API /orders POST] emitEvent error:", err));

      // Track conversion
      trackingStore.trackConversion("order_placed", serviceId, {
        orderId: order.id,
        amount: String(amount),
        clientId: session.user.id,
        freelanceId: service.userId,
      });

      return NextResponse.json({ order }, { status: 201 });
    }
  } catch (error) {
    console.error("[API /orders POST]", error);
    return NextResponse.json(
      { error: "Erreur lors de la creation de la commande" },
      { status: 500 }
    );
  }
}

