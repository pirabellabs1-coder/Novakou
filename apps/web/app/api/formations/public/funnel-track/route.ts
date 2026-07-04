import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/api-rate-limit";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set(["step_view", "cta_click"]);

/**
 * POST /api/formations/public/funnel-track
 * Tracking public léger des tunnels : vue d'une étape, clic CTA.
 * Body: { slug, type: "step_view" | "cta_click", stepId? }.
 * (La vue de la 1re page est déjà comptée par GET /public/funnel/[slug].)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const slug = String(body.slug ?? "").trim();
    const type = String(body.type ?? "").trim();
    const stepId = body.stepId ? String(body.stepId).trim() : null;

    if (!slug || !ALLOWED_TYPES.has(type)) {
      return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
    }

    // Anti-spam : 30 événements / minute / IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
    if (!rateLimit(`funnel-track:${ip}`, 30, 60_000).allowed) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }

    const funnel = await prisma.salesFunnel.findUnique({
      where: { slug },
      select: { id: true, isActive: true, steps: { select: { id: true } } },
    });
    if (!funnel || !funnel.isActive) return NextResponse.json({ ok: true }); // silencieux

    const validStepId = stepId && funnel.steps.some((s) => s.id === stepId) ? stepId : null;

    prisma.funnelEvent
      .create({ data: { funnelId: funnel.id, stepId: validStepId, eventType: type === "step_view" ? "view" : "click" } })
      .catch(() => null);

    if (type === "step_view" && validStepId) {
      prisma.funnelStep
        .update({ where: { id: validStepId }, data: { views: { increment: 1 } } })
        .catch(() => null);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // le tracking ne doit jamais casser la page
  }
}
