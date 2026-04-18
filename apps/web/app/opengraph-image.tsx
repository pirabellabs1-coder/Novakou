import { ImageResponse } from "next/og";

// Default Open Graph image for social shares (Facebook, LinkedIn, WhatsApp).
// 1200x630 = standard OG card dimensions.

export const runtime = "edge";
export const alt = "Novakou — La plateforme des créateurs digitaux";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px 100px",
          background: "linear-gradient(135deg, #003d1a 0%, #006e2f 50%, #22c55e 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        {/* Logo mark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
              fontWeight: 900,
              letterSpacing: -3,
              border: "2px solid rgba(255,255,255,0.3)",
            }}
          >
            N
          </div>
          <div style={{ fontSize: 34, fontWeight: 900 }}>Novakou</div>
        </div>

        <div
          style={{
            fontSize: 60,
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: -2,
            maxWidth: 900,
          }}
        >
          Vendez formations & produits digitaux
        </div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 600,
            marginTop: 20,
            opacity: 0.9,
          }}
        >
          La plateforme des créateurs digitaux en Afrique francophone
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 60,
            right: 100,
            fontSize: 24,
            fontWeight: 700,
            opacity: 0.85,
          }}
        >
          novakou.com
        </div>
      </div>
    ),
    size,
  );
}
