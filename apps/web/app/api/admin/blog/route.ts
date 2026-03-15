import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { z } from "zod";

const IS_DEV_MODE = process.env.DEV_MODE === "true";

const blogUpdateSchema = z.object({
  id: z.string(),
  title: z.string().min(5).max(200).optional(),
  slug: z.string().optional(),
  excerpt: z.string().max(500).optional(),
  content: z.string().optional(),
  coverImage: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["brouillon", "programme", "publie"]).optional(),
  publishDate: z.string().optional(),
}).strict();

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── DEV_MODE: in-memory blog store ──
interface DevBlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  coverImage: string | null;
  category: string | null;
  tags: string[];
  authorId: string;
  authorName: string;
  status: "BROUILLON" | "PROGRAMME" | "PUBLIE";
  publishedAt: string | null;
  scheduledAt: string | null;
  views: number;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

const devBlogPosts: DevBlogPost[] = [];

// Map status to frontend format
function mapStatus(s: string): "brouillon" | "publie" | "programme" | "archive" {
  switch (s) {
    case "PUBLIE": return "publie";
    case "PROGRAMME": return "programme";
    default: return "brouillon";
  }
}

function mapStatusToPrisma(s: string): "BROUILLON" | "PROGRAMME" | "PUBLIE" {
  switch (s) {
    case "publie": return "PUBLIE";
    case "programme": return "PROGRAMME";
    default: return "BROUILLON";
  }
}

// ── GET /api/admin/blog — List all blog articles ──
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    if (IS_DEV_MODE) {
      // Check for scheduled articles
      const now = new Date();
      for (const post of devBlogPosts) {
        if (post.status === "PROGRAMME" && post.scheduledAt && new Date(post.scheduledAt) <= now) {
          post.status = "PUBLIE";
          post.publishedAt = post.scheduledAt;
          post.updatedAt = now.toISOString();
        }
      }

      const categories = devBlogPosts.reduce<Record<string, number>>((acc, a) => {
        if (a.category) acc[a.category] = (acc[a.category] ?? 0) + 1;
        return acc;
      }, {});

      return NextResponse.json({
        articles: devBlogPosts.map(a => ({
          id: a.id,
          title: a.title,
          slug: a.slug,
          excerpt: a.excerpt,
          author: a.authorName,
          category: a.category,
          tags: a.tags,
          status: mapStatus(a.status),
          publishedAt: a.publishedAt,
          scheduledAt: a.scheduledAt,
          featuredImage: a.coverImage ?? "",
          views: a.views,
          likes: 0,
          createdAt: a.createdAt,
          updatedAt: a.updatedAt,
        })),
        total: devBlogPosts.length,
        published: devBlogPosts.filter(a => a.status === "PUBLIE").length,
        drafts: devBlogPosts.filter(a => a.status === "BROUILLON").length,
        scheduled: devBlogPosts.filter(a => a.status === "PROGRAMME").length,
        categories,
      });
    }

    // Production: Prisma
    const { prisma } = await import("@freelancehigh/db");

    const articles = await prisma.blogPost.findMany({
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });

    const categories = articles.reduce<Record<string, number>>((acc, a) => {
      if (a.category) acc[a.category] = (acc[a.category] ?? 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      articles: articles.map(a => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        excerpt: a.excerpt,
        author: a.author.name,
        category: a.category,
        tags: a.tags,
        status: mapStatus(a.status),
        publishedAt: a.publishedAt?.toISOString() ?? null,
        scheduledAt: a.scheduledAt?.toISOString() ?? null,
        featuredImage: a.coverImage ?? "",
        views: a.views,
        likes: 0,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      })),
      total: articles.length,
      published: articles.filter(a => a.status === "PUBLIE").length,
      drafts: articles.filter(a => a.status === "BROUILLON").length,
      scheduled: articles.filter(a => a.status === "PROGRAMME").length,
      categories,
    });
  } catch (error) {
    console.error("[API /admin/blog GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des articles" },
      { status: 500 }
    );
  }
}

// ── POST /api/admin/blog — Create a new blog article ──
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const body = await request.json();
    const { title, content, excerpt, author, authorId, category, tags, status, scheduledAt, featuredImage } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "title et content sont requis" }, { status: 400 });
    }

    const slug = generateSlug(title);
    const now = new Date().toISOString();
    const prismaStatus = status ? mapStatusToPrisma(status) : "BROUILLON";

    if (IS_DEV_MODE) {
      const article: DevBlogPost = {
        id: `blog_${Date.now().toString(36)}`,
        title,
        slug,
        content,
        excerpt: excerpt ?? content.slice(0, 200),
        coverImage: featuredImage ?? null,
        category: category ?? "General",
        tags: tags ?? [],
        authorId: authorId ?? "dev-admin-1",
        authorName: author ?? "Admin FreelanceHigh",
        status: prismaStatus,
        publishedAt: prismaStatus === "PUBLIE" ? now : null,
        scheduledAt: scheduledAt ?? null,
        views: 0,
        metaTitle: null,
        metaDescription: null,
        createdAt: now,
        updatedAt: now,
      };
      devBlogPosts.unshift(article);

      return NextResponse.json({
        success: true,
        message: `Article "${title}" cree`,
        article: {
          ...article,
          status: mapStatus(article.status),
          featuredImage: article.coverImage ?? "",
          author: article.authorName,
          likes: 0,
        },
      });
    }

    // Production: Prisma
    const { prisma } = await import("@freelancehigh/db");

    const article = await prisma.blogPost.create({
      data: {
        title,
        slug,
        content,
        excerpt: excerpt ?? content.slice(0, 200),
        coverImage: featuredImage ?? null,
        category: category ?? "General",
        tags: tags ?? [],
        authorId: authorId ?? "dev-admin-1",
        status: prismaStatus,
        publishedAt: prismaStatus === "PUBLIE" ? new Date() : null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      },
      include: { author: { select: { name: true } } },
    });

    return NextResponse.json({
      success: true,
      message: `Article "${title}" cree`,
      article: {
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        author: article.author.name,
        category: article.category,
        tags: article.tags,
        status: mapStatus(article.status),
        publishedAt: article.publishedAt?.toISOString() ?? null,
        scheduledAt: article.scheduledAt?.toISOString() ?? null,
        featuredImage: article.coverImage ?? "",
        views: article.views,
        likes: 0,
        createdAt: article.createdAt.toISOString(),
        updatedAt: article.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[API /admin/blog POST]", error);
    return NextResponse.json({ error: "Erreur lors de la creation de l'article" }, { status: 500 });
  }
}

// ── PATCH /api/admin/blog — Update an existing blog article ──
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const rawBody = await request.json();
    const parsed = blogUpdateSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: "Donnees invalides", details: parsed.error.issues }, { status: 400 });
    }

    const { id, ...updates } = parsed.data;

    if (IS_DEV_MODE) {
      const idx = devBlogPosts.findIndex(a => a.id === id);
      if (idx === -1) {
        return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
      }

      const now = new Date().toISOString();
      const post = devBlogPosts[idx];

      if (updates.title) {
        post.title = updates.title;
        post.slug = generateSlug(updates.title);
      }
      if (updates.content !== undefined) post.content = updates.content;
      if (updates.excerpt !== undefined) post.excerpt = updates.excerpt;
      if (updates.category !== undefined) post.category = updates.category;
      if (updates.tags !== undefined) post.tags = updates.tags;
      const raw = updates as Record<string, unknown>;
      if (raw.featuredImage !== undefined) post.coverImage = raw.featuredImage as string;
      if (raw.scheduledAt !== undefined) post.scheduledAt = raw.scheduledAt as string;

      if (updates.status) {
        post.status = mapStatusToPrisma(updates.status);
        if (post.status === "PUBLIE" && !post.publishedAt) {
          post.publishedAt = now;
        }
      }

      post.updatedAt = now;

      return NextResponse.json({
        success: true,
        message: `Article "${post.title}" mis a jour`,
        article: {
          ...post,
          status: mapStatus(post.status),
          featuredImage: post.coverImage ?? "",
          author: post.authorName,
          likes: 0,
        },
      });
    }

    // Production: Prisma
    const { prisma } = await import("@freelancehigh/db");

    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (updates.title) {
      data.title = updates.title;
      data.slug = generateSlug(updates.title);
    }
    if (updates.content !== undefined) data.content = updates.content;
    if (updates.excerpt !== undefined) data.excerpt = updates.excerpt;
    if (updates.category !== undefined) data.category = updates.category;
    if (updates.tags !== undefined) data.tags = updates.tags;
    if (updates.featuredImage !== undefined) data.coverImage = updates.featuredImage;
    if (updates.scheduledAt !== undefined) data.scheduledAt = updates.scheduledAt ? new Date(updates.scheduledAt) : null;

    if (updates.status) {
      data.status = mapStatusToPrisma(updates.status);
      if (data.status === "PUBLIE" && !existing.publishedAt) {
        data.publishedAt = new Date();
      }
    }

    const article = await prisma.blogPost.update({
      where: { id },
      data,
      include: { author: { select: { name: true } } },
    });

    return NextResponse.json({
      success: true,
      message: `Article "${article.title}" mis a jour`,
      article: {
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        author: article.author.name,
        category: article.category,
        tags: article.tags,
        status: mapStatus(article.status),
        publishedAt: article.publishedAt?.toISOString() ?? null,
        scheduledAt: article.scheduledAt?.toISOString() ?? null,
        featuredImage: article.coverImage ?? "",
        views: article.views,
        likes: 0,
        createdAt: article.createdAt.toISOString(),
        updatedAt: article.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[API /admin/blog PATCH]", error);
    return NextResponse.json({ error: "Erreur lors de la mise a jour de l'article" }, { status: 500 });
  }
}

// ── DELETE /api/admin/blog — Delete a blog article ──
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id est requis (query param)" }, { status: 400 });
    }

    if (IS_DEV_MODE) {
      const idx = devBlogPosts.findIndex(a => a.id === id);
      if (idx === -1) {
        return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
      }
      const title = devBlogPosts[idx].title;
      devBlogPosts.splice(idx, 1);
      return NextResponse.json({ success: true, message: `Article "${title}" supprime` });
    }

    // Production: Prisma
    const { prisma } = await import("@freelancehigh/db");

    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
    }

    await prisma.blogPost.delete({ where: { id } });

    return NextResponse.json({ success: true, message: `Article "${existing.title}" supprime` });
  } catch (error) {
    console.error("[API /admin/blog DELETE]", error);
    return NextResponse.json({ error: "Erreur lors de la suppression de l'article" }, { status: 500 });
  }
}
