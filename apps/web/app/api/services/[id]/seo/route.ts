import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { serviceStore } from "@/lib/dev/data-store";

// GET /api/services/[id]/seo — Get SEO data for a service
export async function GET(
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

    // Build SEO analysis with recommendations
    const analysis = buildSeoAnalysis(service);

    return NextResponse.json({
      seo: {
        metaTitle: service.metaTitle,
        metaDescription: service.metaDescription,
        tags: service.tags,
        slug: service.slug,
        seoScore: service.seoScore,
      },
      analysis,
    });
  } catch (error) {
    console.error("[API /services/[id]/seo GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des donnees SEO" },
      { status: 500 }
    );
  }
}

// PATCH /api/services/[id]/seo — Update SEO fields for a service
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

    // Only allow SEO-related fields to be updated
    const seoUpdates: Record<string, unknown> = {};

    if (body.metaTitle !== undefined) {
      if (typeof body.metaTitle !== "string" || body.metaTitle.length > 70) {
        return NextResponse.json(
          { error: "Le meta titre ne doit pas depasser 70 caracteres" },
          { status: 400 }
        );
      }
      seoUpdates.metaTitle = body.metaTitle;
    }

    if (body.metaDescription !== undefined) {
      if (
        typeof body.metaDescription !== "string" ||
        body.metaDescription.length > 160
      ) {
        return NextResponse.json(
          {
            error: "La meta description ne doit pas depasser 160 caracteres",
          },
          { status: 400 }
        );
      }
      seoUpdates.metaDescription = body.metaDescription;
    }

    if (body.tags !== undefined) {
      if (!Array.isArray(body.tags) || body.tags.length > 10) {
        return NextResponse.json(
          { error: "Maximum 10 tags autorises" },
          { status: 400 }
        );
      }
      seoUpdates.tags = body.tags;
    }

    if (Object.keys(seoUpdates).length === 0) {
      return NextResponse.json(
        { error: "Aucune mise a jour SEO fournie" },
        { status: 400 }
      );
    }

    // The serviceStore.update method automatically recalculates the SEO score
    // when metaTitle, metaDescription, or tags are updated
    const updatedService = serviceStore.update(id, seoUpdates);

    if (!updatedService) {
      return NextResponse.json(
        { error: "Impossible de mettre a jour les donnees SEO" },
        { status: 400 }
      );
    }

    // Build fresh analysis after update
    const analysis = buildSeoAnalysis(updatedService);

    return NextResponse.json({
      seo: {
        metaTitle: updatedService.metaTitle,
        metaDescription: updatedService.metaDescription,
        tags: updatedService.tags,
        slug: updatedService.slug,
        seoScore: updatedService.seoScore,
      },
      analysis,
      message: "Donnees SEO mises a jour avec succes",
    });
  } catch (error) {
    console.error("[API /services/[id]/seo PATCH]", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise a jour des donnees SEO" },
      { status: 500 }
    );
  }
}

// ── SEO Analysis Helper ──────────────────────────────────────────────────

interface SeoCheckItem {
  label: string;
  status: "bon" | "ameliorable" | "manquant";
  detail: string;
  points: number;
  maxPoints: number;
}

function buildSeoAnalysis(service: {
  metaTitle: string;
  metaDescription: string;
  title: string;
  tags: string[];
  images: string[];
  descriptionText: string;
  faq: { question: string; answer: string }[];
  packages: { basic?: unknown; standard?: unknown; premium?: unknown };
}): { checks: SeoCheckItem[]; recommendations: string[] } {
  const checks: SeoCheckItem[] = [];
  const recommendations: string[] = [];

  // Check 1: Meta title (20 points)
  const title = service.metaTitle || service.title || "";
  if (title.length >= 30 && title.length <= 60) {
    checks.push({
      label: "Meta titre",
      status: "bon",
      detail: `${title.length} caracteres (ideal : 30-60)`,
      points: 20,
      maxPoints: 20,
    });
  } else if (title.length >= 10) {
    checks.push({
      label: "Meta titre",
      status: "ameliorable",
      detail: `${title.length} caracteres (ideal : 30-60)`,
      points: 10,
      maxPoints: 20,
    });
    recommendations.push(
      "Ajustez votre meta titre entre 30 et 60 caracteres pour un meilleur impact SEO."
    );
  } else {
    checks.push({
      label: "Meta titre",
      status: "manquant",
      detail: title.length > 0 ? `${title.length} caracteres (trop court)` : "Non defini",
      points: 0,
      maxPoints: 20,
    });
    recommendations.push(
      "Ajoutez un meta titre descriptif d'au moins 30 caracteres."
    );
  }

  // Check 2: Meta description (20 points)
  const desc = service.metaDescription || "";
  if (desc.length >= 120 && desc.length <= 160) {
    checks.push({
      label: "Meta description",
      status: "bon",
      detail: `${desc.length} caracteres (ideal : 120-160)`,
      points: 20,
      maxPoints: 20,
    });
  } else if (desc.length >= 50) {
    checks.push({
      label: "Meta description",
      status: "ameliorable",
      detail: `${desc.length} caracteres (ideal : 120-160)`,
      points: 10,
      maxPoints: 20,
    });
    recommendations.push(
      "Etoffez votre meta description pour qu'elle fasse entre 120 et 160 caracteres."
    );
  } else {
    checks.push({
      label: "Meta description",
      status: "manquant",
      detail: desc.length > 0 ? `${desc.length} caracteres (trop court)` : "Non definie",
      points: 0,
      maxPoints: 20,
    });
    recommendations.push(
      "Redigez une meta description detaillee d'au moins 120 caracteres."
    );
  }

  // Check 3: Tags (15 points)
  const tags = service.tags || [];
  if (tags.length >= 5) {
    checks.push({
      label: "Tags",
      status: "bon",
      detail: `${tags.length} tags (recommande : 5+)`,
      points: 15,
      maxPoints: 15,
    });
  } else if (tags.length >= 3) {
    checks.push({
      label: "Tags",
      status: "ameliorable",
      detail: `${tags.length} tags (recommande : 5+)`,
      points: 10,
      maxPoints: 15,
    });
    recommendations.push(
      "Ajoutez plus de tags pertinents (au moins 5) pour ameliorer la decouverte de votre service."
    );
  } else {
    checks.push({
      label: "Tags",
      status: tags.length > 0 ? "ameliorable" : "manquant",
      detail: tags.length > 0 ? `${tags.length} tags (trop peu)` : "Aucun tag",
      points: tags.length > 0 ? 5 : 0,
      maxPoints: 15,
    });
    recommendations.push(
      "Ajoutez au moins 5 tags pour que votre service soit trouve plus facilement."
    );
  }

  // Check 4: Images (15 points)
  const images = service.images || [];
  if (images.length >= 3) {
    checks.push({
      label: "Images",
      status: "bon",
      detail: `${images.length} images (recommande : 3+)`,
      points: 15,
      maxPoints: 15,
    });
  } else if (images.length >= 1) {
    checks.push({
      label: "Images",
      status: "ameliorable",
      detail: `${images.length} image(s) (recommande : 3+)`,
      points: 8,
      maxPoints: 15,
    });
    recommendations.push(
      "Ajoutez au moins 3 images de qualite pour mettre en valeur votre service."
    );
  } else {
    checks.push({
      label: "Images",
      status: "manquant",
      detail: "Aucune image",
      points: 0,
      maxPoints: 15,
    });
    recommendations.push(
      "Ajoutez des images pour illustrer votre service. Les services avec images recoivent 3x plus de clics."
    );
  }

  // Check 5: Description length (15 points)
  const descText = service.descriptionText || "";
  if (descText.length >= 300) {
    checks.push({
      label: "Description",
      status: "bon",
      detail: `${descText.length} caracteres (recommande : 300+)`,
      points: 15,
      maxPoints: 15,
    });
  } else if (descText.length >= 100) {
    checks.push({
      label: "Description",
      status: "ameliorable",
      detail: `${descText.length} caracteres (recommande : 300+)`,
      points: 8,
      maxPoints: 15,
    });
    recommendations.push(
      "Developpez votre description pour atteindre au moins 300 caracteres."
    );
  } else {
    checks.push({
      label: "Description",
      status: "manquant",
      detail: descText.length > 0 ? `${descText.length} caracteres (trop court)` : "Non redigee",
      points: 0,
      maxPoints: 15,
    });
    recommendations.push(
      "Redigez une description complete d'au moins 300 caracteres pour convaincre les acheteurs."
    );
  }

  // Check 6: FAQ (10 points)
  const faq = service.faq || [];
  if (faq.length >= 3) {
    checks.push({
      label: "FAQ",
      status: "bon",
      detail: `${faq.length} questions (recommande : 3+)`,
      points: 10,
      maxPoints: 10,
    });
  } else if (faq.length >= 1) {
    checks.push({
      label: "FAQ",
      status: "ameliorable",
      detail: `${faq.length} question(s) (recommande : 3+)`,
      points: 5,
      maxPoints: 10,
    });
    recommendations.push(
      "Ajoutez au moins 3 questions frequentes pour rassurer les acheteurs potentiels."
    );
  } else {
    checks.push({
      label: "FAQ",
      status: "manquant",
      detail: "Aucune FAQ",
      points: 0,
      maxPoints: 10,
    });
    recommendations.push(
      "Ajoutez une FAQ pour repondre aux questions courantes et ameliorer la confiance."
    );
  }

  // Check 7: Packages (5 points)
  const hasAllPackages =
    service.packages?.basic &&
    service.packages?.standard &&
    service.packages?.premium;
  if (hasAllPackages) {
    checks.push({
      label: "Forfaits",
      status: "bon",
      detail: "3 forfaits definis (Basique, Standard, Premium)",
      points: 5,
      maxPoints: 5,
    });
  } else {
    checks.push({
      label: "Forfaits",
      status: "manquant",
      detail: "Forfaits incomplets",
      points: 0,
      maxPoints: 5,
    });
    recommendations.push(
      "Definissez les 3 forfaits (Basique, Standard, Premium) pour proposer plus d'options aux acheteurs."
    );
  }

  return { checks, recommendations };
}
