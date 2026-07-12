import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { safeHttpUrl, signWebhook } from "@/lib/formations/paylink-webhook";

/**
 * POST /api/formations/vendeur/liens-paiement/[id]/test-webhook
 *
 * Envoie un webhook de TEST signé à l'URL configurée sur le lien, pour que le
 * vendeur vérifie son endpoint sans faire un vrai paiement. Renvoie le code
 * HTTP retourné par son serveur.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const ctx = await resolveVendorContext(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
  if (!ctx) return NextResponse.json({ error: "Profil vendeur introuvable" }, { status: 401 });

  const { id } = await params;
  const link = await prisma.digitalProduct.findFirst({
    where: { id, instructeurId: ctx.instructeurId, isPaymentLink: true },
    select: { id: true, slug: true, title: true, price: true, webhookUrl: true, webhookSecret: true },
  });
  if (!link) return NextResponse.json({ error: "Lien introuvable" }, { status: 404 });
  if (!link.webhookUrl || !safeHttpUrl(link.webhookUrl, { requireHttps: true })) {
    return NextResponse.json({ error: "Aucun webhook valide configuré sur ce lien." }, { status: 400 });
  }

  const payload = {
    event: "payment.succeeded" as const,
    test: true,
    paymentRef: `test_${id.slice(-6)}`,
    linkId: link.id,
    linkSlug: link.slug,
    title: link.title,
    amount: link.price,
    currency: "XOF",
    buyerEmail: "test@novakou.com",
    buyerName: "Test Novakou",
    createdAt: new Date().toISOString(),
  };
  const bodyStr = JSON.stringify(payload);
  const signature = link.webhookSecret ? signWebhook(link.webhookSecret, bodyStr) : "";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(link.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Novakou-Paylink/1.0",
        "X-Novakou-Event": "payment.succeeded",
        "X-Novakou-Signature": signature,
      },
      body: bodyStr,
      signal: controller.signal,
    });
    return NextResponse.json({ data: { ok: res.ok, status: res.status } });
  } catch (err) {
    const msg = err instanceof Error && err.name === "AbortError" ? "Délai dépassé (10 s)" : "Impossible de joindre l'URL";
    return NextResponse.json({ data: { ok: false, status: 0 }, error: msg });
  } finally {
    clearTimeout(timer);
  }
}
