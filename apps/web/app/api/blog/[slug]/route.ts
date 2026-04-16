import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const IS_DEV_MODE = process.env.DEV_MODE === "true";

const BLOG_FILE = path.join(process.cwd(), "lib", "dev", "blog-articles.json");

interface DevArticle {
  id: string;
  title: string;
  slug: string;
  content?: string;
  excerpt: string | null;
  author: string;
  authorName?: string;
  category: string | null;
  tags: string[];
  status: string;
  publishedAt: string | null;
  featuredImage?: string;
  coverImage?: string | null;
  views: number;
  createdAt: string;
}

function readDevArticles(): DevArticle[] {
  try {
    if (fs.existsSync(BLOG_FILE)) {
      return JSON.parse(fs.readFileSync(BLOG_FILE, "utf-8"));
    }
  } catch {}
  return [];
}

// GET /api/blog/[slug] — Public single article by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (IS_DEV_MODE) {
      // Read directly from the shared JSON file — no admin auth required
      const allArticles = readDevArticles();
      const raw = allArticles.find(
        (a) => a.slug === slug && (a.status === "publie" || a.status === "PUBLIE")
      );
      if (!raw) {
        return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
      }

      const article = {
        id: raw.id,
        title: raw.title,
        slug: raw.slug,
        content: raw.content ?? "",
        excerpt: raw.excerpt ?? "",
        author: raw.authorName || raw.author || "FreelanceHigh",
        category: raw.category ?? "",
        tags: raw.tags ?? [],
        status: "publie",
        publishedAt: raw.publishedAt,
        featuredImage: raw.featuredImage ?? raw.coverImage ?? "",
        views: raw.views ?? 0,
        createdAt: raw.createdAt,
      };
      return NextResponse.json({ article });
    }

    // Production: Prisma
    const { prisma } = await import("@freelancehigh/db");

    const article = await prisma.blogPost.findUnique({
      where: { slug },
      include: { author: { select: { name: true } } },
    });

    if (!article || article.status !== "PUBLIE") {
      return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
    }

    // Increment views
    await prisma.blogPost.update({
      where: { id: article.id },
      data: { views: { increment: 1 } },
    }).catch(() => {});

    return NextResponse.json({
      article: {
        id: article.id,
        title: article.title,
        slug: article.slug,
        content: article.content,
        excerpt: article.excerpt,
        author: article.author.name,
        category: article.category,
        tags: article.tags,
        status: "publie",
        publishedAt: article.publishedAt?.toISOString() ?? null,
        featuredImage: article.coverImage ?? "",
        views: article.views + 1,
        createdAt: article.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[API /blog/[slug] GET]", error);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
