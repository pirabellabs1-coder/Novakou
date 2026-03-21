import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

// GET /api/admin/categories — List all categories
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const categories = await prisma.category.findMany({
      orderBy: { order: "asc" },
      include: {
        _count: { select: { services: true, children: true } },
        children: { select: { id: true, name: true, slug: true, isActive: true, order: true } },
      },
    });

    return NextResponse.json({
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        icon: c.icon || "code",
        color: c.color || "#6C2BD9",
        description: c.description,
        order: c.order,
        isActive: c.isActive,
        status: c.isActive ? "actif" : "inactif",
        parentId: c.parentId,
        servicesCount: c._count.services,
        childrenCount: c._count.children,
        children: c.children,
      })),
      total: categories.length,
    });
  } catch (error) {
    console.error("[API /admin/categories GET]", error);
    return NextResponse.json({ error: "Erreur lors de la recuperation des categories" }, { status: 500 });
  }
}

// POST /api/admin/categories — Create a new category
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const body = await request.json();
    const { name, slug, icon, color, description, order, parentId } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "name et slug sont requis" }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: { name, slug, icon, color, description, order: order ?? 0, parentId },
    });

    return NextResponse.json({ success: true, message: `Categorie "${name}" creee`, category });
  } catch (error) {
    console.error("[API /admin/categories POST]", error);
    return NextResponse.json({ error: "Erreur lors de la creation de la categorie" }, { status: 500 });
  }
}

// PATCH /api/admin/categories — Update a category
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "id est requis" }, { status: 400 });
    }

    const category = await prisma.category.update({ where: { id }, data: updates });

    return NextResponse.json({ success: true, message: `Categorie "${category.name}" mise a jour`, category });
  } catch (error) {
    console.error("[API /admin/categories PATCH]", error);
    return NextResponse.json({ error: "Erreur lors de la mise a jour de la categorie" }, { status: 500 });
  }
}

// DELETE /api/admin/categories — Delete a category
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id est requis (query param)" }, { status: 400 });
    }

    const category = await prisma.category.findUnique({ where: { id }, include: { _count: { select: { services: true } } } });
    if (!category) {
      return NextResponse.json({ error: "Categorie introuvable" }, { status: 404 });
    }

    if (category._count.services > 0) {
      return NextResponse.json({ error: `Impossible de supprimer : ${category._count.services} service(s) utilise(nt) cette categorie` }, { status: 400 });
    }

    await prisma.category.delete({ where: { id } });

    return NextResponse.json({ success: true, message: `Categorie "${category.name}" supprimee` });
  } catch (error) {
    console.error("[API /admin/categories DELETE]", error);
    return NextResponse.json({ error: "Erreur lors de la suppression de la categorie" }, { status: 500 });
  }
}
