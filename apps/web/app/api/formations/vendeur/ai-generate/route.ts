import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { IS_DEV } from "@/lib/env";
import { generateProductPage, type GenerateInput } from "@/lib/ai/generate-product-page";

/**
 * POST /api/formations/vendeur/ai-generate
 *
 * Body: {
 *   productType: "formation" | "digital_product",
 *   topic: string (requis),
 *   targetAudience?: string,
 *   mainBenefits?: string,
 *   priceHint?: string,
 *   language?: "fr" | "en"
 * }
 *
 * Returns: { data: { title, shortDesc, description, learnPoints, targetAudience, faq } }
 *
 * Utilise OpenAI GPT-4o-mini. Auth : instructeur connecté.
 */
export const maxDuration = 60; // generation IA peut prendre 20-40s
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const role = token?.role?.toString().toLowerCase();
    if (!token || (role !== "instructeur" && role !== "admin" && !IS_DEV)) {
      return NextResponse.json(
        { error: "Accès réservé aux instructeurs et admins" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { productType, topic, targetAudience, mainBenefits, priceHint, language } = body as Partial<GenerateInput>;

    if (!productType || !["formation", "digital_product"].includes(productType)) {
      return NextResponse.json(
        { error: "productType requis : 'formation' ou 'digital_product'" },
        { status: 400 },
      );
    }
    if (!topic || typeof topic !== "string" || topic.trim().length < 5) {
      return NextResponse.json(
        { error: "topic requis (décrivez en 1 phrase ce que vous enseignez, ex: 'Formation Excel pour débutants')" },
        { status: 400 },
      );
    }

    const startedAt = Date.now();
    const generated = await generateProductPage({
      productType,
      topic: topic.trim(),
      targetAudience: targetAudience?.trim(),
      mainBenefits: mainBenefits?.trim(),
      priceHint: priceHint?.trim(),
      language: language === "en" ? "en" : "fr",
    });

    return NextResponse.json({
      data: generated,
      durationMs: Date.now() - startedAt,
    });
  } catch (err) {
    console.error("[vendeur/ai-generate POST]", err);
    const msg = err instanceof Error ? err.message : "Erreur";
    return NextResponse.json(
      { error: msg, hint: msg.includes("OPENAI_API_KEY") ? "Ajoutez la variable OPENAI_API_KEY dans Vercel." : undefined },
      { status: 500 },
    );
  }
}
