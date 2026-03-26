import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
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
    const userId = session?.user?.id || "dev-user";
    const userRole = (session?.user as Record<string, unknown>)?.role as string || "freelance";

    const { searchParams } = request.nextUrl;
    const statusFilter = searchParams.get("status");
    // ?side=seller (default for freelance) or ?side=buyer (achats)
    const sideFilter = searchParams.get("side");

    if (IS_DEV) {
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
      // Production: Prisma
      let where: Record<string, unknown>;

      if (sideFilter === "buyer") {
        where = { clientId: session.user.id };
      } else if (sideFilter === "seller") {
        where = { freelanceId: session.user.id };
      } else if (session.user.role === "client") {
        where = { clientId: session.user.id };
      } else {
        // Freelance/agence/admin: both buyer and seller
        where = { OR: [{ freelanceId: session.user.id }, { clientId: session.user.id }] };
      }

      if (statusFilter) {
        where.status = statusFilter.toUpperCase() as string;
      }

      const orders = await prisma.order.findMany({
        where,
        include: { service: true, client: true, freelance: true },
        orderBy: { createdAt: "desc" },
      });

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

    if (IS_DEV) {
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
        freelanceEmail: service.vendorUsername ? `${service.vendorUsername}@freelancehigh.com` : "",
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

      if (service.status !== "ACTIF") {
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

      // Create the order and related records in a transaction
      const order = await prisma.$transaction(async (tx) => {
        // Create the order
        const newOrder = await tx.order.create({
          data: {
            serviceId,
            clientId: session.user.id,
            freelanceId: service.userId,
            status: "EN_ATTENTE",
            escrowStatus: "HELD",
            amount,
            commission,
            packageType,
            requirements: requirements || null,
            deadline: deadlineDate,
          },
          include: { service: true, client: true, freelance: true },
        });

        // Create escrow payment record (funds held)
        await tx.payment.create({
          data: {
            orderId: newOrder.id,
            payerId: session.user.id,
            payeeId: service.userId,
            amount: amount - commission,
            currency: "EUR",
            status: "EN_ATTENTE",
            type: "paiement",
            description: `Commande ${newOrder.id} - ${service.title} (${packageType})`,
          },
        });

        // Create commission payment record
        await tx.payment.create({
          data: {
            orderId: newOrder.id,
            payerId: session.user.id,
            amount: commission,
            currency: "EUR",
            status: "EN_ATTENTE",
            type: "commission",
            description: `Commission ${commissionLabel} sur commande ${newOrder.id}`,
          },
        });

        // Increment service order count
        await tx.service.update({
          where: { id: serviceId },
          data: { orderCount: { increment: 1 } },
        });

        // Auto-create conversation for this order
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

        // If requirements provided, add as first message
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

