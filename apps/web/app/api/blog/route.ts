import { NextRequest, NextResponse } from "next/server";

const IS_DEV_MODE = process.env.DEV_MODE === "true";

// In-memory blog store for dev mode (shared with admin blog route)
// Admin creates articles → they're stored in admin blog devBlogPosts
// Public blog reads from Prisma in production
// In dev mode, we import from a shared JSON file

import fs from "fs";
import path from "path";

const BLOG_FILE = path.join(process.cwd(), "lib", "dev", "blog-articles.json");

interface DevArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  author: string;
  category: string | null;
  tags: string[];
  status: string;
  publishedAt: string | null;
  featuredImage: string;
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

// GET /api/blog — Public list of published articles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    if (IS_DEV_MODE) {
      const allArticles = readDevArticles();

      let published = allArticles.filter(a =>
        a.status === "publie" || a.status === "PUBLIE"
      );
      if (category) published = published.filter(a => a.category === category);
      published.sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));
      published = published.slice(0, limit);

      return NextResponse.json({ articles: published, total: published.length });
    }

    // Production: Prisma
    const { prisma } = await import("@freelancehigh/db");

    const where: Record<string, unknown> = { status: "PUBLIE" };
    if (category) where.category = category;

    const articles = await prisma.blogPost.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      take: limit,
      include: { author: { select: { name: true } } },
    });

    return NextResponse.json({
      articles: articles.map(a => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        excerpt: a.excerpt,
        author: a.author?.name || "FreelanceHigh",
        category: a.category,
        tags: a.tags,
        status: "publie",
        publishedAt: a.publishedAt?.toISOString() || null,
        featuredImage: a.coverImage || "",
        views: a.views,
        createdAt: a.createdAt.toISOString(),
      })),
      total: articles.length,
    });
  } catch (error) {
    console.error("[API /blog GET]", error);
    return NextResponse.json({ articles: [], total: 0 });
  }
}
