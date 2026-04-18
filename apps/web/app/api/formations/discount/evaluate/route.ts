/**
 * POST /api/formations/discount/evaluate
 *
 * Public endpoint (read-only eval) to preview how a code applies to a cart.
 * Used by the checkout UI + integration tests.
 *
 * Body : { code, lines: [{ id, kind: "formation"|"product", priceXof }], userId? }
 */

import { NextResponse } from "next/server";
import { evaluateDiscount } from "@/lib/formations/discount-evaluator";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "Corps invalide", discountAmount: 0, finalAmount: 0 });
  }

  const code = String(body.code ?? "").trim();
  const userId = body.userId ? String(body.userId) : null;
  const rawLines = Array.isArray(body.lines) ? body.lines : [];

  const lines = rawLines
    .map((l: unknown) => {
      if (!l || typeof l !== "object") return null;
      const o = l as { id?: string; kind?: string; priceXof?: number };
      if (!o.id || (o.kind !== "formation" && o.kind !== "product")) return null;
      if (typeof o.priceXof !== "number" || o.priceXof < 0) return null;
      return { id: o.id, kind: o.kind as "formation" | "product", priceXof: o.priceXof };
    })
    .filter(Boolean) as { id: string; kind: "formation" | "product"; priceXof: number }[];

  const result = await evaluateDiscount({ code, lines, userId });
  return NextResponse.json(result);
}
