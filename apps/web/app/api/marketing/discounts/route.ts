// GET /api/marketing/discounts — List discount codes for authenticated instructor
// POST /api/marketing/discounts — Create a new discount code

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

// ── DEV MOCK DATA ──────────────────────────────────────────────────────────

const DEV_MODE = process.env.DEV_MODE === "true" || !process.env.DATABASE_URL;

interface MockDiscountCode {
  id: string;
  instructeurId: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  scope: "ALL" | "FORMATIONS" | "PRODUCTS" | "SPECIFIC";
  formationIds: string[];
  productIds: string[];
  maxUses: number | null;
  usedCount: number;
  maxUsesPerUser: number | null;
  minOrderAmount: number | null;
  expiresAt: string | null;
  isActive: boolean;
  totalDiscounted: number;
  revenue: number;
  createdAt: string;
  updatedAt: string;
}

const MOCK_DISCOUNTS: MockDiscountCode[] = [];

let devDiscounts = [...MOCK_DISCOUNTS];

// ── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    if (DEV_MODE) {
      return NextResponse.json({
        discounts: devDiscounts,
        stats: {
          totalCodes: devDiscounts.length,
          activeCodes: devDiscounts.filter(
            (d) =>
              d.isActive &&
              !(d.maxUses !== null && d.usedCount >= d.maxUses) &&
              !(d.expiresAt && new Date(d.expiresAt) < new Date()),
          ).length,
          totalUses: devDiscounts.reduce((sum, d) => sum + d.usedCount, 0),
          totalRevenue: devDiscounts.reduce((sum, d) => sum + d.revenue, 0),
        },
      });
    }

    // Production: authenticate + query DB
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const prisma = (await import("@freelancehigh/db")).default;

    const instructeur = await prisma.instructeurProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!instructeur) {
      return NextResponse.json({ error: "Instructeur non trouve" }, { status: 403 });
    }

    const discounts = await prisma.discountCode.findMany({
      where: { instructeurId: instructeur.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { usages: true } } },
    });

    const activeCodes = discounts.filter(
      (d) =>
        d.isActive &&
        !(d.maxUses !== null && d.usedCount >= d.maxUses) &&
        !(d.expiresAt && new Date(d.expiresAt) < new Date()),
    );

    return NextResponse.json({
      discounts,
      stats: {
        totalCodes: discounts.length,
        activeCodes: activeCodes.length,
        totalUses: discounts.reduce((sum, d) => sum + d.usedCount, 0),
        totalRevenue: discounts.reduce((sum, d) => sum + d.revenue, 0),
      },
    });
  } catch (error) {
    console.error("[GET /api/marketing/discounts]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      code,
      discountType,
      discountValue,
      scope,
      formationIds,
      productIds,
      maxUses,
      maxUsesPerUser,
      minOrderAmount,
      expiresAt,
    } = body;

    // Validation
    if (!code || typeof code !== "string" || code.length < 3 || code.length > 20) {
      return NextResponse.json({ error: "Le code doit contenir entre 3 et 20 caracteres" }, { status: 400 });
    }

    if (!discountType || !["PERCENTAGE", "FIXED_AMOUNT"].includes(discountType)) {
      return NextResponse.json({ error: "Type de reduction invalide" }, { status: 400 });
    }

    if (typeof discountValue !== "number" || discountValue <= 0) {
      return NextResponse.json({ error: "Valeur de reduction invalide" }, { status: 400 });
    }

    if (discountType === "PERCENTAGE" && discountValue > 100) {
      return NextResponse.json({ error: "Le pourcentage ne peut pas depasser 100" }, { status: 400 });
    }

    if (!scope || !["ALL", "FORMATIONS", "PRODUCTS", "SPECIFIC"].includes(scope)) {
      return NextResponse.json({ error: "Portee invalide" }, { status: 400 });
    }

    if (DEV_MODE) {
      // Check for duplicate code
      if (devDiscounts.some((d) => d.code === code.toUpperCase())) {
        return NextResponse.json({ error: "Ce code existe deja" }, { status: 409 });
      }

      const newDiscount: MockDiscountCode = {
        id: `disc_${String(devDiscounts.length + 1).padStart(3, "0")}`,
        instructeurId: "inst_001",
        code: code.toUpperCase(),
        discountType,
        discountValue,
        scope,
        formationIds: formationIds || [],
        productIds: productIds || [],
        maxUses: maxUses || null,
        usedCount: 0,
        maxUsesPerUser: maxUsesPerUser || null,
        minOrderAmount: minOrderAmount || null,
        expiresAt: expiresAt || null,
        isActive: true,
        totalDiscounted: 0,
        revenue: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      devDiscounts.push(newDiscount);
      return NextResponse.json({ discount: newDiscount }, { status: 201 });
    }

    // Production
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const prisma = (await import("@freelancehigh/db")).default;

    const instructeur = await prisma.instructeurProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!instructeur) {
      return NextResponse.json({ error: "Instructeur non trouve" }, { status: 403 });
    }

    // Check for duplicate code
    const existing = await prisma.discountCode.findUnique({ where: { code: code.toUpperCase() } });
    if (existing) {
      return NextResponse.json({ error: "Ce code existe deja" }, { status: 409 });
    }

    const discount = await prisma.discountCode.create({
      data: {
        instructeurId: instructeur.id,
        code: code.toUpperCase(),
        discountType,
        discountValue,
        scope,
        formationIds: formationIds || [],
        productIds: productIds || [],
        maxUses: maxUses || null,
        maxUsesPerUser: maxUsesPerUser || null,
        minOrderAmount: minOrderAmount || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return NextResponse.json({ discount }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/marketing/discounts]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ── PUT ──────────────────────────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, isActive, code, discountValue, discountType, scope, maxUses, maxUsesPerUser, minOrderAmount, expiresAt, formationIds, productIds } = body;

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    if (DEV_MODE) {
      const index = devDiscounts.findIndex((d) => d.id === id);
      if (index === -1) {
        return NextResponse.json({ error: "Code non trouvé" }, { status: 404 });
      }

      if (isActive !== undefined) devDiscounts[index].isActive = isActive;
      if (code !== undefined) devDiscounts[index].code = code.toUpperCase();
      if (discountValue !== undefined) devDiscounts[index].discountValue = discountValue;
      if (discountType !== undefined) devDiscounts[index].discountType = discountType;
      if (scope !== undefined) devDiscounts[index].scope = scope;
      if (maxUses !== undefined) devDiscounts[index].maxUses = maxUses;
      if (maxUsesPerUser !== undefined) devDiscounts[index].maxUsesPerUser = maxUsesPerUser;
      if (minOrderAmount !== undefined) devDiscounts[index].minOrderAmount = minOrderAmount;
      if (expiresAt !== undefined) devDiscounts[index].expiresAt = expiresAt;
      if (formationIds !== undefined) devDiscounts[index].formationIds = formationIds;
      if (productIds !== undefined) devDiscounts[index].productIds = productIds;
      devDiscounts[index].updatedAt = new Date().toISOString();

      return NextResponse.json({ discount: devDiscounts[index] });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const prisma = (await import("@freelancehigh/db")).default;
    const updateData: Record<string, unknown> = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (discountValue !== undefined) updateData.discountValue = discountValue;
    if (discountType !== undefined) updateData.discountType = discountType;
    if (scope !== undefined) updateData.scope = scope;
    if (maxUses !== undefined) updateData.maxUses = maxUses;
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;

    const discount = await prisma.discountCode.update({ where: { id }, data: updateData });
    return NextResponse.json({ discount });
  } catch (error) {
    console.error("[PUT /api/marketing/discounts]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ── DELETE ───────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    if (DEV_MODE) {
      const index = devDiscounts.findIndex((d) => d.id === id);
      if (index === -1) {
        return NextResponse.json({ error: "Code non trouvé" }, { status: 404 });
      }
      devDiscounts.splice(index, 1);
      return NextResponse.json({ success: true });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const prisma = (await import("@freelancehigh/db")).default;
    await prisma.discountCode.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/marketing/discounts]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
