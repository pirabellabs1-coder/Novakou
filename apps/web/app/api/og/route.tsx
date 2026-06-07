// Open Graph image dynamique pour toutes les pages Novakou sans thumbnail
// dédié. Utilisée par WhatsApp, X (Twitter Card), LinkedIn, Facebook,
// Telegram, Discord, Slack, iMessage, etc. quand on partage un lien.
// Avant : `null` → preview brut sans visuel → -40% CTR sur partages sociaux.
//
// Paramètres supportés (URL encoded) :
//   ?title=...     (string, max 80 chars)
//   ?subtitle=...  (string, max 120 chars)
//   ?type=formation|produit|boutique|guide|default
//   ?author=...    (string, optional)
//
// Rendu : 1200×630px (ratio OG standard) — la taille recommandée par
// Facebook/Twitter/LinkedIn. Plus grand = downscalé par les apps mobiles
// avec mauvaise compression.

import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

const BG_NAVY = "#0b2540";
const BG_NAVY_LIGHT = "#1a4a7d";
const ACCENT_GREEN = "#10b981";
const ACCENT_ORANGE = "#f97316";

const TYPE_LABEL: Record<string, string> = {
  formation: "Formation",
  produit: "Produit digital",
  boutique: "Boutique",
  guide: "Guide gratuit",
  mentor: "Mentor",
  default: "Novakou",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = (searchParams.get("title") || "Vendez vos produits digitaux").slice(0, 80);
  const subtitle = (searchParams.get("subtitle") || "Formations, e-books, coaching. Marketplace digital pour créateurs.").slice(0, 140);
  const type = (searchParams.get("type") || "default").toLowerCase();
  const author = searchParams.get("author")?.slice(0, 40);
  const label = TYPE_LABEL[type] ?? TYPE_LABEL.default;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundImage: `linear-gradient(135deg, ${BG_NAVY} 0%, #103057 45%, ${BG_NAVY_LIGHT} 100%)`,
          color: "white",
          padding: "70px 80px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Décor : cercles verts diffus en arrière-plan */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 380,
            height: 380,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${ACCENT_GREEN}55 0%, transparent 70%)`,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -180,
            left: -100,
            width: 420,
            height: 420,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${ACCENT_ORANGE}33 0%, transparent 70%)`,
            display: "flex",
          }}
        />

        {/* Header : logo + badge type */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 60 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: ACCENT_GREEN,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 44,
              fontWeight: 900,
              color: "white",
            }}
          >
            N
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1 }}>Novakou</div>
            <div
              style={{
                fontSize: 16,
                color: "#94a3b8",
                fontWeight: 500,
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}
            >
              {label}
            </div>
          </div>
        </div>

        {/* Titre principal */}
        <div
          style={{
            fontSize: title.length > 50 ? 56 : 68,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: -1.2,
            marginBottom: 28,
            display: "flex",
            color: "white",
            maxWidth: 1040,
          }}
        >
          {title}
        </div>

        {/* Sous-titre */}
        <div
          style={{
            fontSize: 28,
            color: "#cbd5e1",
            lineHeight: 1.4,
            fontWeight: 400,
            display: "flex",
            maxWidth: 1040,
          }}
        >
          {subtitle}
        </div>

        {/* Footer : URL + author + badge "Mobile Money" */}
        <div
          style={{
            position: "absolute",
            bottom: 60,
            left: 80,
            right: 80,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontSize: 22,
              color: "#94a3b8",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            {author ? `par ${author} · novakou.com` : "novakou.com"}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 22px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              fontSize: 18,
              color: "white",
              fontWeight: 600,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: ACCENT_GREEN,
                display: "flex",
              }}
            />
            Mobile Money · Carte · Wave · Orange
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        // Cache 1 jour côté CDN + revalidation stale (les bots OG re-fetchent
        // au max 1×/jour donc inutile de regénérer plus souvent).
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
