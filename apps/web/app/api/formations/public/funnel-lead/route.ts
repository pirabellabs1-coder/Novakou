import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/api-rate-limit";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/formations/public/funnel-lead
 * Dépose un lead capturé par un bloc « Formulaire de capture » d'un tunnel.
 * Public (les visiteurs ne sont pas connectés). Body: { slug, email, name?, phone? }.
 * Un email unique par tunnel : re-soumission = mise à jour (idempotent).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const slug = String(body.slug ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const name = body.name ? String(body.name).trim().slice(0, 120) : null;
    const phone = body.phone ? String(body.phone).trim().slice(0, 40) : null;

    // Champs personnalisés du formulaire : max 15 champs, valeurs bornées.
    let extra: Record<string, string> | null = null;
    if (body.extra && typeof body.extra === "object" && !Array.isArray(body.extra)) {
      extra = {};
      for (const [k, v] of Object.entries(body.extra as Record<string, unknown>).slice(0, 15)) {
        const key = String(k).trim().slice(0, 80);
        const val = String(v ?? "").trim().slice(0, 500);
        if (key && val) extra[key] = val;
      }
      if (!Object.keys(extra).length) extra = null;
    }

    if (!slug) return NextResponse.json({ error: "Tunnel manquant" }, { status: 400 });
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Adresse email invalide" }, { status: 400 });
    }

    // Anti-spam : 5 dépôts / 10 min par IP, 3 par email.
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
    const ipLimit = rateLimit(`funnel-lead-ip:${ip}`, 5, 10 * 60_000);
    const emailLimit = rateLimit(`funnel-lead-email:${email}`, 3, 10 * 60_000);
    if (!ipLimit.allowed || !emailLimit.allowed) {
      return NextResponse.json({ error: "Trop de tentatives. Réessayez dans quelques minutes." }, { status: 429 });
    }

    const funnel = await prisma.salesFunnel.findUnique({
      where: { slug },
      select: { id: true, instructeurId: true, isActive: true },
    });
    if (!funnel) return NextResponse.json({ error: "Tunnel introuvable" }, { status: 404 });

    await prisma.funnelLead.upsert({
      where: { funnelId_email: { funnelId: funnel.id, email } },
      create: { funnelId: funnel.id, instructeurId: funnel.instructeurId, email, name, phone, ...(extra ? { data: extra } : {}) },
      update: { ...(name ? { name } : {}), ...(phone ? { phone } : {}), ...(extra ? { data: extra } : {}) },
    });

    // Événement « lead » pour les statistiques du tunnel (fire-and-forget)
    prisma.funnelEvent
      .create({ data: { funnelId: funnel.id, eventType: "lead" } })
      .catch(() => null);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[public/funnel-lead POST]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
