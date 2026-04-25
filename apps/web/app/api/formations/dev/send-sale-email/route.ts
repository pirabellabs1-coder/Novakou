import { NextResponse } from "next/server";
import { sendSaleNotificationFH } from "@/lib/email/templates-fh";

/**
 * GET /api/formations/dev/send-sale-email?to=email&scenario=standard|first|milestone
 * Dev-only: re-send the updated sale notification with different scenarios.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const to = url.searchParams.get("to");
  const scenario = url.searchParams.get("scenario") ?? "standard";
  if (!to) return NextResponse.json({ error: "Provide ?to=email" }, { status: 400 });

  const scenarios: Record<string, Parameters<typeof sendSaleNotificationFH>[2]> = {
    // Standard sale
    standard: {
      productTitle: "Masterclass Facebook & Instagram Ads",
      kind: "formation",
      grossAmount: 45000,
      commissionRate: 10,
      netAmount: 40500,
      buyerName: "Aminata D.",
      totalSales: 23,
      monthEarnings: 342500,
    },
    // First-ever sale — triggers "toute première vente"
    first: {
      productTitle: "Pack 50 templates Notion pro",
      kind: "product",
      grossAmount: 12000,
      commissionRate: 8,
      netAmount: 11040,
      buyerName: "Jean-Baptiste K.",
      totalSales: 1,
      monthEarnings: 11040,
    },
    // 100 sales milestone
    milestone: {
      productTitle: "Formation complète Développement Web",
      kind: "formation",
      grossAmount: 75000,
      commissionRate: 10,
      netAmount: 67500,
      buyerName: "Marie-Claire A.",
      totalSales: 100,
      monthEarnings: 1250000,
    },
  };

  const data = scenarios[scenario];
  if (!data) return NextResponse.json({ error: `Unknown scenario. Use: ${Object.keys(scenarios).join(", ")}` }, { status: 400 });

  const r = await sendSaleNotificationFH(to, "Gildas", data);
  return NextResponse.json({
    to,
    scenario,
    ok: !r.error,
    result: r.error ? { error: String((r.error as { message?: string })?.message ?? r.error) } : { id: r.data?.id },
  });
}
