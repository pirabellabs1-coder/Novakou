import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { profileStore, orderStore, reviewStore } from "@/lib/dev/data-store";
import { computeBadges } from "@/lib/badges";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";
import { z } from "zod";

const updateProfileSchema = z.looseObject({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().max(30).optional(),
  bio: z.string().max(2000).optional(),
  title: z.string().max(200).optional(),
  hourlyRate: z.number().min(0).max(10000).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  skills: z.array(z.string().max(50)).max(30).optional(),
  languages: z.array(z.object({ name: z.string(), level: z.string() })).max(10).optional(),
  links: z.object({
    linkedin: z.string().url().optional().or(z.literal("")),
    github: z.string().url().optional().or(z.literal("")),
    portfolio: z.string().url().optional().or(z.literal("")),
    behance: z.string().url().optional().or(z.literal("")),
  }).optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      let profile = profileStore.get(session.user.id);

      // Auto-create profile if not found
      if (!profile) {
        const nameParts = (session.user.name || "").split(" ");
        profile = profileStore.update(session.user.id, {
          userId: session.user.id,
          firstName: nameParts[0] || "",
          lastName: nameParts.slice(1).join(" ") || "",
          username: (session.user.email || "").split("@")[0] || "",
          email: session.user.email || "",
          phone: "",
          photo: "",
          coverPhoto: "",
          title: "",
          bio: "",
          city: "",
          country: "",
          hourlyRate: 0,
          skills: [],
          languages: [],
          education: [],
          links: { linkedin: "", github: "", portfolio: "", behance: "" },
          completionPercent: 0,
          badges: [],
          availability: [],
          vacationMode: false,
        });
      }

      // Compute badges dynamically based on actual metrics
      const orders = orderStore.getByFreelance(session.user.id);
      const completedOrders = orders.filter((o) => o.status === "termine").length;
      const totalOrders = orders.filter((o) => !["annule"].includes(o.status)).length;
      const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

      const reviews = reviewStore.getByFreelance(session.user.id);
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      profile.badges = computeBadges({
        completedOrders,
        completionRate,
        avgRating,
        kycLevel: 2, // Default for dev mode
        plan: "pro", // Default for dev mode
      });

      return NextResponse.json({ profile });
    } else {
      let user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          freelancerProfile: true,
          clientProfile: true,
          agencyProfile: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: "Profil introuvable" },
          { status: 404 }
        );
      }

      // Lazy creation: auto-create FreelancerProfile if missing for a freelance
      if (!user.freelancerProfile && user.role === "FREELANCE") {
        await prisma.freelancerProfile.create({
          data: { userId: user.id },
        });
        user = await prisma.user.findUnique({
          where: { id: session.user.id },
          include: { freelancerProfile: true, clientProfile: true, agencyProfile: true },
        }) as typeof user;
      }
      if (!user!.clientProfile && user!.role === "CLIENT") {
        await prisma.clientProfile.create({ data: { userId: user!.id } });
      }
      if (!user!.agencyProfile && user!.role === "AGENCE") {
        await prisma.agencyProfile.create({ data: { userId: user!.id, agencyName: user!.name } });
      }

      // Build a profile object matching the dev-store shape
      const fp = user!.freelancerProfile;
      const profile = {
        userId: user.id,
        firstName: user.name?.split(" ")[0] || "",
        lastName: user.name?.split(" ").slice(1).join(" ") || "",
        username: user.email?.split("@")[0] || "",
        email: user.email || "",
        phone: fp?.phone || "",
        photo: user.image || "",
        coverPhoto: fp?.coverPhoto || "",
        title: fp?.title || "",
        bio: fp?.bio || "",
        city: fp?.city || "",
        country: fp?.country || "",
        hourlyRate: fp?.hourlyRate || 0,
        skills: fp?.skills || [],
        languages: fp?.languages || [],
        education: fp?.education || [],
        links: fp?.links || { linkedin: "", github: "", portfolio: "", behance: "" },
        completionPercent: fp?.completionPercent || 0,
        badges: fp?.badges || [],
        availability: fp?.availability || [],
        vacationMode: fp?.vacationMode || false,
      };

      return NextResponse.json({ profile });
    }
  } catch (error) {
    console.error("[API /profile GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation du profil" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const body = await request.json();
    const result = updateProfileSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Donnees invalides", details: z.treeifyError(result.error) },
        { status: 400 }
      );
    }
    const updates = result.data;

    // Remove fields that should not be updated directly
    delete (updates as Record<string, unknown>).userId;
    delete (updates as Record<string, unknown>).completionPercent;
    delete (updates as Record<string, unknown>).badges;

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      const profile = profileStore.update(session.user.id, updates as Partial<import("@/lib/dev/data-store").StoredProfile>);

      // Also sync country/city to the User record (devStore) so admin panel sees them
      const { country: profileCountry, city: profileCity } = updates as Record<string, unknown>;
      if (profileCountry !== undefined || profileCity !== undefined) {
        const { devStore } = await import("@/lib/dev/dev-store");
        const userUpdates: Record<string, unknown> = {};
        if (profileCountry !== undefined) userUpdates.country = profileCountry;
        devStore.update(session.user.id, userUpdates);
      }

      return NextResponse.json({ profile });
    } else {
      // Extract user-level fields vs freelancerProfile fields
      const { name, firstName, lastName, phone, photo, coverPhoto, title, bio, city, country, hourlyRate, skills, languages, education, links, availability, vacationMode, ...rest } = updates as Record<string, unknown>;

      // Update user-level fields if provided
      const userName = (name as string | undefined) || (firstName || lastName
        ? [firstName, lastName].filter(Boolean).join(" ")
        : undefined);
      const hasUserUpdates =
        userName !== undefined ||
        photo !== undefined ||
        country !== undefined ||
        phone !== undefined;
      if (hasUserUpdates) {
        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            ...(userName ? { name: userName } : {}),
            ...(photo ? { image: photo as string } : {}),
            ...(country !== undefined ? { country: country as string | null } : {}),
            ...(phone !== undefined ? { phone: (phone as string) || null } : {}),
          },
        });
      }

      // Upsert freelancer profile fields
      // For Json? fields, Prisma requires Prisma.JsonNull instead of plain null
      const jsonOrNull = (val: unknown) => val === null ? Prisma.JsonNull : val;
      const profileData = {
        ...(phone !== undefined ? { phone: typeof phone === 'string' ? phone : null } : {}),
        ...(coverPhoto !== undefined ? { coverPhoto: typeof coverPhoto === 'string' ? coverPhoto : null } : {}),
        ...(title !== undefined ? { title } : {}),
        ...(bio !== undefined ? { bio } : {}),
        ...(city !== undefined ? { city } : {}),
        ...(country !== undefined ? { country } : {}),
        ...(hourlyRate !== undefined ? { hourlyRate } : {}),
        ...(skills !== undefined ? { skills } : {}),
        ...(languages !== undefined ? { languages: jsonOrNull(languages) } : {}),
        ...(education !== undefined ? { education: jsonOrNull(education) } : {}),
        ...(links !== undefined ? { links: jsonOrNull(links) } : {}),
        ...(availability !== undefined ? { availability: jsonOrNull(availability) } : {}),
        ...(vacationMode !== undefined ? { vacationMode: Boolean(vacationMode) } : {}),
      };

      if (Object.keys(profileData).length > 0) {
        await prisma.freelancerProfile.upsert({
          where: { userId: session.user.id },
          update: profileData,
          create: {
            userId: session.user.id,
            ...profileData,
          },
        });
      }

      // Re-fetch and return updated profile in same shape
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { freelancerProfile: true },
      });

      const fp = user?.freelancerProfile;
      const profile = {
        userId: user?.id,
        firstName: user?.name?.split(" ")[0] || "",
        lastName: user?.name?.split(" ").slice(1).join(" ") || "",
        username: user?.email?.split("@")[0] || "",
        email: user?.email || "",
        phone: fp?.phone || "",
        photo: user?.image || "",
        coverPhoto: fp?.coverPhoto || "",
        title: fp?.title || "",
        bio: fp?.bio || "",
        city: fp?.city || "",
        country: fp?.country || "",
        hourlyRate: fp?.hourlyRate || 0,
        skills: fp?.skills || [],
        languages: fp?.languages || [],
        education: fp?.education || [],
        links: fp?.links || { linkedin: "", github: "", portfolio: "", behance: "" },
        completionPercent: fp?.completionPercent || 0,
        badges: fp?.badges || [],
        availability: fp?.availability || [],
        vacationMode: fp?.vacationMode || false,
      };

      return NextResponse.json({ profile });
    }
  } catch (error) {
    console.error("[API /profile PATCH]", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise a jour du profil" },
      { status: 500 }
    );
  }
}
