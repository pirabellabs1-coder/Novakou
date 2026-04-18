import { ImageResponse } from "next/og";

// Apple touch icon (shown when users add site to iOS home screen).

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #006e2f, #22c55e)",
          color: "white",
          fontSize: 120,
          fontWeight: 900,
          fontFamily: "sans-serif",
          letterSpacing: -6,
        }}
      >
        N
      </div>
    ),
    size,
  );
}
