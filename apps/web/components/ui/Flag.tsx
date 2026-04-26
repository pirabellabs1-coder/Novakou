"use client";

/**
 * Country flag image using flagcdn.com.
 * Falls back to a 🌍 emoji when the code is null/unknown.
 *
 * Why an <img> and not the emoji directly?
 * Windows desktop browsers don't ship the regional indicator emoji glyphs,
 * so the unicode flag (🇧🇯) renders as the two letters "BJ" in a box.
 * flagcdn serves a real PNG that works on every platform.
 */
type Size = "sm" | "md" | "lg";

const SIZE_PX: Record<Size, { w: number; h: number; cdn: string }> = {
  sm: { w: 16, h: 12, cdn: "h20" },
  md: { w: 24, h: 18, cdn: "h40" },
  lg: { w: 32, h: 24, cdn: "h60" },
};

export function Flag({
  code,
  size = "md",
  className = "",
  title,
}: {
  code: string | null | undefined;
  size?: Size;
  className?: string;
  title?: string;
}) {
  const lower = code?.toLowerCase().trim();
  const cfg = SIZE_PX[size];

  if (!lower || lower.length !== 2) {
    return (
      <span
        className={className}
        style={{ display: "inline-block", lineHeight: 1 }}
        title={title}
      >
        🌍
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/${cfg.cdn}/${lower}.png`}
      srcSet={`https://flagcdn.com/${cfg.cdn}/${lower}.png 1x, https://flagcdn.com/${cfg.cdn === "h20" ? "h40" : cfg.cdn === "h40" ? "h80" : "h120"}/${lower}.png 2x`}
      width={cfg.w}
      height={cfg.h}
      alt={title ?? lower.toUpperCase()}
      title={title}
      className={`inline-block rounded-sm align-middle ${className}`}
      loading="lazy"
    />
  );
}
