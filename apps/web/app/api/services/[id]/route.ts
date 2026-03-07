import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { serviceStore } from "@/lib/dev/data-store";

// GET /api/services/[id] — Get a service by ID (public, increments views)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const service = serviceStore.getById(id);

    if (!service) {
      return NextResponse.json(
        { error: "Service introuvable" },
        { status: 404 }
      );
    }

    // Increment views for this service
    serviceStore.incrementViews(id);

    // Return the service with the updated view count
    return NextResponse.json({
      service: { ...service, views: service.views + 1 },
    });
  } catch (error) {
    console.error("[API /services/[id] GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation du service" },
      { status: 500 }
    );
  }
}

// PATCH /api/services/[id] — Update a service (owner only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { id } = await params;
    const service = serviceStore.getById(id);

    if (!service) {
      return NextResponse.json(
        { error: "Service introuvable" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (service.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Acces non autorise" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Prevent updating protected fields
    const {
      id: _id,
      userId: _userId,
      createdAt: _createdAt,
      views: _views,
      clicks: _clicks,
      orderCount: _orderCount,
      revenue: _revenue,
      rating: _rating,
      ratingCount: _ratingCount,
      ...allowedUpdates
    } = body;

    // Handle image updates from wizard format
    if (body.mainImage?.url && !body.images) {
      const images: string[] = [body.mainImage.url];
      if (Array.isArray(body.additionalImages)) {
        for (const img of body.additionalImages) {
          if (img?.url) images.push(img.url);
        }
      }
      allowedUpdates.images = images;
      allowedUpdates.mainImage = body.mainImage.url;
    }

    const updatedService = serviceStore.update(id, allowedUpdates);

    if (!updatedService) {
      return NextResponse.json(
        { error: "Impossible de mettre a jour le service" },
        { status: 400 }
      );
    }

    return NextResponse.json({ service: updatedService });
  } catch (error) {
    console.error("[API /services/[id] PATCH]", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise a jour du service" },
      { status: 500 }
    );
  }
}

// DELETE /api/services/[id] — Delete a service (owner only)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { id } = await params;
    const service = serviceStore.getById(id);

    if (!service) {
      return NextResponse.json(
        { error: "Service introuvable" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (service.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Acces non autorise" },
        { status: 403 }
      );
    }

    const deleted = serviceStore.delete(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Impossible de supprimer le service" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Service supprime avec succes",
    });
  } catch (error) {
    console.error("[API /services/[id] DELETE]", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du service" },
      { status: 500 }
    );
  }
}
