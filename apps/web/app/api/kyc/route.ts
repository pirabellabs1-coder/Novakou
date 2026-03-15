import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma, IS_DEV } from "@/lib/prisma";
import { kycRequestStore, kycPersonalInfoStore } from "@/lib/dev/data-store";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    if (IS_DEV) {
      const requests = kycRequestStore.getByUser(session.user.id);
      const currentLevel = kycRequestStore.getUserLevel(session.user.id);
      const personalInfo = kycPersonalInfoStore.getByUser(session.user.id);

      return NextResponse.json({ requests, currentLevel, personalInfo });
    }

    // Production: Prisma
    const requests = await prisma.kycRequest.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        kyc: true,
        firstName: true,
        lastName: true,
        country: true,
        city: true,
        address: true,
        dateOfBirth: true,
      },
    });

    const personalInfo = user
      ? {
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          country: user.country || "",
          city: user.city || "",
          address: user.address || "",
          dateOfBirth: user.dateOfBirth
            ? new Date(user.dateOfBirth).toISOString().split("T")[0]
            : "",
        }
      : null;

    return NextResponse.json({
      requests,
      currentLevel: user?.kyc ?? 1,
      personalInfo,
    });
  } catch (error) {
    console.error("[API /kyc GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const body = await request.json();
    const { level, documentType, documentUrl } = body;

    if (!level || !documentType) {
      return NextResponse.json(
        { error: "Champs requis : level, documentType" },
        { status: 400 }
      );
    }

    if (![2, 3, 4].includes(level)) {
      return NextResponse.json(
        { error: "Niveau invalide (2, 3 ou 4)" },
        { status: 400 }
      );
    }

    if (IS_DEV) {
      // Check if there's already a pending request for this level
      const existing = kycRequestStore.getByUser(session.user.id);
      const pendingForLevel = existing.find(
        (r) => r.level === level && r.status === "en_attente"
      );
      if (pendingForLevel) {
        return NextResponse.json(
          { error: "Une demande est deja en attente pour ce niveau" },
          { status: 409 }
        );
      }

      const req = kycRequestStore.create({
        userId: session.user.id,
        level,
        documentType,
        documentUrl: documentUrl || "",
      });

      return NextResponse.json({ request: req }, { status: 201 });
    }

    // Production: Prisma
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { kyc: true },
    });

    // Check if there's already a pending request for this level
    const pendingForLevel = await prisma.kycRequest.findFirst({
      where: {
        userId: session.user.id,
        requestedLevel: level,
        status: "EN_ATTENTE",
      },
    });
    if (pendingForLevel) {
      return NextResponse.json(
        { error: "Une demande est deja en attente pour ce niveau" },
        { status: 409 }
      );
    }

    const req = await prisma.kycRequest.create({
      data: {
        userId: session.user.id,
        requestedLevel: level,
        currentLevel: user?.kyc ?? 1,
        documentType,
        documentUrl: documentUrl || "",
        status: "EN_ATTENTE",
      },
    });

    return NextResponse.json({ request: req }, { status: 201 });
  } catch (error) {
    console.error("[API /kyc POST]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const body = await request.json();
    const { personalInfo } = body;

    if (!personalInfo) {
      return NextResponse.json(
        { error: "Champs requis : personalInfo" },
        { status: 400 }
      );
    }

    const { firstName, lastName, country, city, dateOfBirth } = personalInfo;

    if (!firstName || !lastName || !country || !city || !dateOfBirth) {
      return NextResponse.json(
        {
          error:
            "Champs requis : firstName, lastName, country, city, dateOfBirth",
        },
        { status: 400 }
      );
    }

    // Validate age (must be at least 18)
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const isUnder18 =
      age < 18 || (age === 18 && monthDiff < 0) ||
      (age === 18 && monthDiff === 0 && today.getDate() < birthDate.getDate());

    if (isUnder18) {
      return NextResponse.json(
        { error: "Vous devez avoir au moins 18 ans" },
        { status: 400 }
      );
    }

    if (IS_DEV) {
      kycPersonalInfoStore.upsert(session.user.id, {
        firstName: personalInfo.firstName,
        lastName: personalInfo.lastName,
        country: personalInfo.country,
        city: personalInfo.city,
        address: personalInfo.address || "",
        dateOfBirth: personalInfo.dateOfBirth,
      });

      return NextResponse.json({ success: true });
    }

    // Production: Prisma — update user profile fields
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName: personalInfo.firstName,
        lastName: personalInfo.lastName,
        country: personalInfo.country,
        city: personalInfo.city,
        address: personalInfo.address || "",
        dateOfBirth: new Date(personalInfo.dateOfBirth),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API /kyc PATCH]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
