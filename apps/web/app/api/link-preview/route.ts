import { NextRequest, NextResponse } from "next/server";

const OG_TIMEOUT_MS = 5000;

// Blacklisted domains — no preview for these
const BLACKLISTED_DOMAINS = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "10.",
  "172.16.",
  "192.168.",
  "169.254.",
  // Potentially dangerous
  "bit.ly",
  "tinyurl.com",
  "t.co",
];

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function extractOGTags(html: string): { title: string; description: string; image?: string } {
  const getMetaContent = (property: string): string | undefined => {
    // Match og: and twitter: meta tags
    const patterns = [
      new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, "i"),
      new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`, "i"),
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) return match[1];
    }
    return undefined;
  };

  const title =
    getMetaContent("og:title") ||
    getMetaContent("twitter:title") ||
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ||
    "";

  const description =
    getMetaContent("og:description") ||
    getMetaContent("twitter:description") ||
    getMetaContent("description") ||
    "";

  const image =
    getMetaContent("og:image") ||
    getMetaContent("twitter:image");

  return { title: title.trim(), description: description.trim(), image };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body as { url: string };

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL requise" }, { status: 400 });
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: "URL invalide" }, { status: 400 });
    }

    // Only allow HTTPS
    if (parsedUrl.protocol !== "https:") {
      return NextResponse.json({ error: "Seules les URLs HTTPS sont supportees" }, { status: 400 });
    }

    // Check blacklist
    const hostname = parsedUrl.hostname;
    if (BLACKLISTED_DOMAINS.some((d) => hostname === d || hostname.startsWith(d))) {
      return NextResponse.json({ preview: null });
    }

    // Fetch with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OG_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "FreelanceHigh-LinkPreview/1.0",
          Accept: "text/html",
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        return NextResponse.json({ preview: null });
      }

      // Only process HTML responses
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/html")) {
        return NextResponse.json({ preview: null });
      }

      // Read first 50KB only
      const text = await response.text();
      const html = text.slice(0, 50000);

      const { title, description, image } = extractOGTags(html);

      if (!title) {
        return NextResponse.json({ preview: null });
      }

      const preview = {
        title,
        description,
        image: image || undefined,
        domain: extractDomain(url),
        url,
      };

      return NextResponse.json({ preview });
    } catch (err) {
      clearTimeout(timeout);
      // Timeout or network error — return null preview silently
      return NextResponse.json({ preview: null });
    }
  } catch (error) {
    console.error("[API /link-preview]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
