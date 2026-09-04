import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/api-rate-limit";
import { userHasFormationAccess, userHasProductAccess } from "@/lib/formations/access";

/**
 * GET /api/formations/gift/check?email=…&fids=a,b&pids=c,d
 *
 * ACHAT-CADEAU — avertissement pré‑paiement : le DESTINATAIRE possède‑t‑il déjà
 * un des items ? Renvoie la liste des titres déjà possédés (vide sinon). On NE
 * crée PAS de compte ici (simple lecture) ; un e‑mail sans compte ne possède rien.
 *
 * Régime « avertir mais autoriser » : le front affiche l'avertissement, l'acheteur
 * décide. Rate‑limit léger + on ne renvoie que pour les items explicitement passés
 * (pas d'énumération), l'info reste peu sensible.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const email = (url.searchParams.get("email") ?? "").trim().toLowerCase();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ data: { owned: [] } });
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
    const rl = await rateLimit(`gift-check:${ip}`, 40, 60_000);
    if (!rl.allowed) return NextResponse.json({ data: { owned: [] } });

    const fids = (url.searchParams.get("fids") ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 20);
    const pids = (url.searchParams.get("pids") ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 20);
    if (fids.length === 0 && pids.length === 0) return NextResponse.json({ data: { owned: [] } });

    const recipient = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!recipient) return NextResponse.json({ data: { owned: [] } });

    const owned: { id: string; title: string }[] = [];

    // Formations déjà accessibles au destinataire.
    for (const fid of fids) {
      if (await userHasFormationAccess(recipient.id, fid)) {
        const f = await prisma.formation.findUnique({ where: { id: fid }, select: { title: true } });
        owned.push({ id: fid, title: f?.title ?? "Formation" });
      }
    }
    for (const pid of pids) {
      if (await userHasProductAccess(recipient.id, pid)) {
        const p = await prisma.digitalProduct.findUnique({ where: { id: pid }, select: { title: true } });
        owned.push({ id: pid, title: p?.title ?? "Produit" });
      }
    }

    return NextResponse.json({ data: { owned } }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    console.error("[gift/check]", err);
    return NextResponse.json({ data: { owned: [] } });
  }
}
