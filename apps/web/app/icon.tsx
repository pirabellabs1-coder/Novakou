import { ImageResponse } from "next/og";

// Next.js dynamic favicon (generated at request time).
// https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 8,
          color: "white",
          fontSize: 22,
          fontWeight: 900,
          fontFamily: "sans-serif",
          letterSpacing: -1,
        }}
      >
        N
      </div>
    ),
    size,
  );
}
