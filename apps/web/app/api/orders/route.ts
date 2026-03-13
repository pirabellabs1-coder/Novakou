import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { orderStore, serviceStore, transactionStore, notificationStore, conversationStore } from "@/lib/dev/data-store";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const statusFilter = searchParams.get("status");

    let orders;
    if (session.user.role === "freelance") {
      orders = orderStore.getByFreelance(session.user.id);
    } else if (session.user.role === "client") {
      orders = orderStore.getByClient(session.user.id);
    } else {
      // Admin or agence — return all orders for the user across both roles
      const freelanceOrders = orderStore.getByFreelance(session.user.id);
      const clientOrders = orderStore.getByClient(session.user.id);
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
  } catch (error) {
    console.error("[API /orders GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des commandes" },
      { status: 500 }
    );
  }
}

// Commission rates by plan
const COMMISSION_RATES: Record<string, number> = {
  gratuit: 0.20,
  pro: 0.15,
  business: 0.10,
  agence: 0.08,
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const body = await request.json();
    const { serviceId, packageType, requirements } = body as {
      serviceId: string;
      packageType: "basic" | "standard" | "premium";
      requirements?: string;
    };

    // Validate required fields
    if (!serviceId || !packageType) {
      return NextResponse.json(
        { error: "serviceId et packageType sont requis" },
        { status: 400 }
      );
    }

    if (!["basic", "standard", "premium"].includes(packageType)) {
      return NextResponse.json(
        { error: "packageType doit etre basic, standard ou premium" },
        { status: 400 }
      );
    }

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
    const commissionRate = COMMISSION_RATES[service.vendorPlan] ?? COMMISSION_RATES.gratuit;
    const commission = Math.round(amount * commissionRate * 100) / 100;

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
      description: `Commission ${Math.round(commissionRate * 100)}% sur commande ${order.id}`,
      amount: -commission,
      status: "en_attente",
      date: now.toISOString().slice(0, 10),
      orderId: order.id,
    });

    // Notify the freelance
    notificationStore.add({
      userId: service.userId,
      title: "Nouvelle commande",
      message: `${clientName} a commande "${service.title}" (forfait ${packageType}) pour ${amount} EUR`,
      type: "order",
      read: false,
      link: `/dashboard/commandes/${order.id}`,
    });

    // Notify the client
    notificationStore.add({
      userId: session.user.id,
      title: "Commande confirmee",
      message: `Votre commande "${service.title}" a ete creee avec succes. En attente d'acceptation.`,
      type: "order",
      read: false,
      link: `/client/commandes/${order.id}`,
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

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("[API /orders POST]", error);
    return NextResponse.json(
      { error: "Erreur lors de la creation de la commande" },
      { status: 500 }
    );
  }
}
