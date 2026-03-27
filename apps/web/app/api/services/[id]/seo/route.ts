import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

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
    const service = await prisma.service.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        agencyId: true,
        title: true,
        slug: true,
        descriptionText: true,
        tags: true,
        images: true,
        faq: true,
        packages: true,
        seoMetaTitle: true,
        seoMetaDescription: true,
        seoKeywords: true,
      },
    });

    if (!service) {
      return NextResponse.json({ error: "Service introuvable" }, { status: 404 });
    }

    // Verify ownership (direct or via agency)
    const isOwner = service.userId === session.user.id;
    let isAgencyOwner = false;
    if (!isOwner && service.agencyId) {
      const agency = await prisma.agencyProfile.findFirst({
        where: { id: service.agencyId, userId: session.user.id },
      });
      isAgencyOwner = !!agency;
    }
    if (!isOwner && !isAgencyOwner) {
      return NextResponse.json({ error: "Acces non autorise" }, { status: 403 });
    }

    const analysis = buildSeoAnalysis({
      metaTitle: service.seoMetaTitle || "",
      metaDescription: service.seoMetaDescription || "",
      title: service.title,
      tags: service.tags || [],
      images: (service.images as string[]) || [],
      descriptionText: service.descriptionText || "",
      faq: (service.faq as { question: string; answer: string }[]) || [],
      packages: (service.packages as Record<string, unknown>) || {},
    });

    return NextResponse.json({
      seo: {
        metaTitle: service.seoMetaTitle || "",
        metaDescription: service.seoMetaDescription || "",
        tags: service.tags || [],
        slug: service.slug,
        seoScore: calculateSeoScore(analysis),
      },
      analysis,
    });
  } catch (error) {
    console.error("[API /services/[id]/seo GET]", error);
    return NextResponse.json({ error: "Erreur lors de la recuperation des donnees SEO" }, { status: 500 });
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
    const service = await prisma.service.findUnique({
      where: { id },
      select: { id: true, userId: true, agencyId: true, title: true, slug: true, descriptionText: true, tags: true, images: true, faq: true, packages: true, seoMetaTitle: true, seoMetaDescription: true },
    });

    if (!service) {
      return NextResponse.json({ error: "Service introuvable" }, { status: 404 });
    }

    // Verify ownership
    const isOwner = service.userId === session.user.id;
    let isAgencyOwner = false;
    if (!isOwner && service.agencyId) {
      const agency = await prisma.agencyProfile.findFirst({
        where: { id: service.agencyId, userId: session.user.id },
      });
      isAgencyOwner = !!agency;
    }
    if (!isOwner && !isAgencyOwner) {
      return NextResponse.json({ error: "Acces non autorise" }, { status: 403 });
    }

    const body = await request.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (body.metaTitle !== undefined) {
      if (typeof body.metaTitle !== "string" || body.metaTitle.length > 70) {
        return NextResponse.json({ error: "Le meta titre ne doit pas depasser 70 caracteres" }, { status: 400 });
      }
      updateData.seoMetaTitle = body.metaTitle;
    }

    if (body.metaDescription !== undefined) {
      if (typeof body.metaDescription !== "string" || body.metaDescription.length > 160) {
        return NextResponse.json({ error: "La meta description ne doit pas depasser 160 caracteres" }, { status: 400 });
      }
      updateData.seoMetaDescription = body.metaDescription;
    }

    if (body.tags !== undefined) {
      if (!Array.isArray(body.tags) || body.tags.length > 10) {
        return NextResponse.json({ error: "Maximum 10 tags autorises" }, { status: 400 });
      }
      updateData.tags = body.tags;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Aucune mise a jour SEO fournie" }, { status: 400 });
    }

    const updatedService = await prisma.service.update({
      where: { id },
      data: updateData,
      select: { id: true, title: true, slug: true, descriptionText: true, tags: true, images: true, faq: true, packages: true, seoMetaTitle: true, seoMetaDescription: true },
    });

    const analysis = buildSeoAnalysis({
      metaTitle: updatedService.seoMetaTitle || "",
      metaDescription: updatedService.seoMetaDescription || "",
      title: updatedService.title,
      tags: updatedService.tags || [],
      images: (updatedService.images as string[]) || [],
      descriptionText: updatedService.descriptionText || "",
      faq: (updatedService.faq as { question: string; answer: string }[]) || [],
      packages: (updatedService.packages as Record<string, unknown>) || {},
    });

    return NextResponse.json({
      seo: {
        metaTitle: updatedService.seoMetaTitle || "",
        metaDescription: updatedService.seoMetaDescription || "",
        tags: updatedService.tags || [],
        slug: updatedService.slug,
        seoScore: calculateSeoScore(analysis),
      },
      analysis,
      message: "Donnees SEO mises a jour avec succes",
    });
  } catch (error) {
    console.error("[API /services/[id]/seo PATCH]", error);
    return NextResponse.json({ error: "Erreur lors de la mise a jour des donnees SEO" }, { status: 500 });
  }
}

// ── SEO Analysis ──

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
  packages: Record<string, unknown>;
}): { checks: SeoCheckItem[]; recommendations: string[] } {
  const checks: SeoCheckItem[] = [];
  const recommendations: string[] = [];

  const title = service.metaTitle || service.title || "";
  if (title.length >= 30 && title.length <= 60) {
    checks.push({ label: "Meta titre", status: "bon", detail: `${title.length} car. (ideal : 30-60)`, points: 20, maxPoints: 20 });
  } else if (title.length >= 10) {
    checks.push({ label: "Meta titre", status: "ameliorable", detail: `${title.length} car. (ideal : 30-60)`, points: 10, maxPoints: 20 });
    recommendations.push("Ajustez votre meta titre entre 30 et 60 caracteres.");
  } else {
    checks.push({ label: "Meta titre", status: "manquant", detail: title.length > 0 ? `${title.length} car. (trop court)` : "Non defini", points: 0, maxPoints: 20 });
    recommendations.push("Ajoutez un meta titre descriptif d'au moins 30 caracteres.");
  }

  const desc = service.metaDescription || "";
  if (desc.length >= 120 && desc.length <= 160) {
    checks.push({ label: "Meta description", status: "bon", detail: `${desc.length} car. (ideal : 120-160)`, points: 20, maxPoints: 20 });
  } else if (desc.length >= 50) {
    checks.push({ label: "Meta description", status: "ameliorable", detail: `${desc.length} car. (ideal : 120-160)`, points: 10, maxPoints: 20 });
    recommendations.push("Etoffez votre meta description entre 120 et 160 caracteres.");
  } else {
    checks.push({ label: "Meta description", status: "manquant", detail: desc.length > 0 ? `${desc.length} car. (trop court)` : "Non definie", points: 0, maxPoints: 20 });
    recommendations.push("Redigez une meta description d'au moins 120 caracteres.");
  }

  const tags = service.tags || [];
  if (tags.length >= 5) {
    checks.push({ label: "Tags", status: "bon", detail: `${tags.length} tags`, points: 15, maxPoints: 15 });
  } else if (tags.length >= 3) {
    checks.push({ label: "Tags", status: "ameliorable", detail: `${tags.length} tags (5+ recommande)`, points: 10, maxPoints: 15 });
    recommendations.push("Ajoutez plus de tags (au moins 5) pour ameliorer la decouverte.");
  } else {
    checks.push({ label: "Tags", status: tags.length > 0 ? "ameliorable" : "manquant", detail: tags.length > 0 ? `${tags.length} tags (trop peu)` : "Aucun tag", points: tags.length > 0 ? 5 : 0, maxPoints: 15 });
    recommendations.push("Ajoutez au moins 5 tags pour que votre service soit trouve.");
  }

  const images = service.images || [];
  if (images.length >= 3) checks.push({ label: "Images", status: "bon", detail: `${images.length} images`, points: 15, maxPoints: 15 });
  else if (images.length >= 1) {
    checks.push({ label: "Images", status: "ameliorable", detail: `${images.length} image(s) (3+ recommande)`, points: 8, maxPoints: 15 });
    recommendations.push("Ajoutez au moins 3 images de qualite.");
  } else {
    checks.push({ label: "Images", status: "manquant", detail: "Aucune image", points: 0, maxPoints: 15 });
    recommendations.push("Ajoutez des images pour illustrer votre service.");
  }

  const descText = service.descriptionText || "";
  if (descText.length >= 300) checks.push({ label: "Description", status: "bon", detail: `${descText.length} car.`, points: 15, maxPoints: 15 });
  else if (descText.length >= 100) {
    checks.push({ label: "Description", status: "ameliorable", detail: `${descText.length} car. (300+ recommande)`, points: 8, maxPoints: 15 });
    recommendations.push("Developpez votre description (300+ caracteres).");
  } else {
    checks.push({ label: "Description", status: "manquant", detail: descText.length > 0 ? `${descText.length} car.` : "Non redigee", points: 0, maxPoints: 15 });
    recommendations.push("Redigez une description complete d'au moins 300 caracteres.");
  }

  const faq = service.faq || [];
  if (faq.length >= 3) checks.push({ label: "FAQ", status: "bon", detail: `${faq.length} questions`, points: 10, maxPoints: 10 });
  else if (faq.length >= 1) {
    checks.push({ label: "FAQ", status: "ameliorable", detail: `${faq.length} question(s)`, points: 5, maxPoints: 10 });
    recommendations.push("Ajoutez au moins 3 questions FAQ.");
  } else {
    checks.push({ label: "FAQ", status: "manquant", detail: "Aucune FAQ", points: 0, maxPoints: 10 });
    recommendations.push("Ajoutez une FAQ pour rassurer les acheteurs.");
  }

  const hasAllPackages = service.packages && (service.packages as Record<string, unknown>).basic && (service.packages as Record<string, unknown>).standard && (service.packages as Record<string, unknown>).premium;
  if (hasAllPackages) checks.push({ label: "Forfaits", status: "bon", detail: "3 forfaits definis", points: 5, maxPoints: 5 });
  else {
    checks.push({ label: "Forfaits", status: "manquant", detail: "Forfaits incomplets", points: 0, maxPoints: 5 });
    recommendations.push("Definissez les 3 forfaits (Basique, Standard, Premium).");
  }

  return { checks, recommendations };
}

function calculateSeoScore(analysis: { checks: SeoCheckItem[] }): number {
  return analysis.checks.reduce((sum, c) => sum + c.points, 0);
}
