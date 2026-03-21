import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma as _prisma, IS_DEV } from "@/lib/prisma";
import { kycRequestStore, kycPersonalInfoStore } from "@/lib/dev/data-store";

// Cast prisma to allow new fields that may not be reflected in cached TS types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = _prisma as any;

// ── GET — Fetch current user's KYC data ──────────────────────────────────

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

// ── POST — Create a new KYC request ──────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const body = await request.json();
    const { type } = body;

    // ── New structured submission (individual or agency) ──
    if (type === "individual") {
      return handleIndividualSubmission(session.user.id, body);
    }
    if (type === "agency") {
      return handleAgencySubmission(session.user.id, body);
    }

    // ── Legacy submission (level + documentType) ──
    const { level, documentType, documentUrl } = body;

    if (!level || !documentType) {
      return NextResponse.json(
        { error: "Champs requis : level, documentType (ou type: individual/agency)" },
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

// ── PATCH — Save personal info ──────────────────────────────────────────

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

    // Production: Prisma
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

// ── Individual submission handler ────────────────────────────────────────

async function handleIndividualSubmission(userId: string, body: Record<string, string>) {
  const requiredFields = [
    "firstName", "lastName", "dateOfBirth", "country", "city", "address",
    "documentType", "documentFrontUrl", "documentBackUrl", "selfieUrl",
  ];

  const fieldLabels: Record<string, string> = {
    firstName: "Prenom",
    lastName: "Nom",
    dateOfBirth: "Date de naissance",
    country: "Pays",
    city: "Ville",
    address: "Adresse",
    documentType: "Type de document",
    documentFrontUrl: "Recto du document",
    documentBackUrl: "Verso du document",
    selfieUrl: "Selfie de verification",
  };

  // Validate all required fields
  const errors: Record<string, string> = {};
  for (const field of requiredFields) {
    if (!body[field] || !body[field].trim()) {
      errors[field] = `${fieldLabels[field] || field} est requis`;
    }
  }

  // Validate document type
  const validDocTypes = ["CNI", "PASSEPORT", "PERMIS"];
  if (body.documentType && !validDocTypes.includes(body.documentType)) {
    errors.documentType = "Type de document invalide";
  }

  // Validate age
  if (body.dateOfBirth) {
    const birthDate = new Date(body.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 18) {
      errors.dateOfBirth = "Vous devez avoir au moins 18 ans";
    }
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "Champs requis manquants", errors }, { status: 400 });
  }

  if (IS_DEV) {
    // Check for existing pending request
    const existing = kycRequestStore.getByUser(userId);
    const pending = existing.find((r) => r.level === 3 && r.status === "en_attente");
    if (pending) {
      return NextResponse.json(
        { error: "Une demande est deja en attente de verification" },
        { status: 409 }
      );
    }

    // Also save personal info to dev store
    kycPersonalInfoStore.upsert(userId, {
      firstName: body.firstName,
      lastName: body.lastName,
      country: body.country,
      city: body.city,
      address: body.address,
      dateOfBirth: body.dateOfBirth,
    });

    const req = kycRequestStore.create({
      userId,
      level: 3,
      documentType: body.documentType as "CNI" | "PASSEPORT" | "PERMIS",
      documentUrl: body.documentFrontUrl,
      type: "individual",
      firstName: body.firstName,
      lastName: body.lastName,
      dateOfBirth: body.dateOfBirth,
      country: body.country,
      city: body.city,
      address: body.address,
      documentFrontUrl: body.documentFrontUrl,
      documentBackUrl: body.documentBackUrl,
      selfieUrl: body.selfieUrl,
    });

    return NextResponse.json({ request: req }, { status: 201 });
  }

  // Production: Prisma
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { kyc: true },
  });

  const pendingReq = await prisma.kycRequest.findFirst({
    where: {
      userId,
      requestedLevel: 3,
      status: "EN_ATTENTE",
    },
  });
  if (pendingReq) {
    return NextResponse.json(
      { error: "Une demande est deja en attente de verification" },
      { status: 409 }
    );
  }

  // Update user personal info
  await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      country: body.country,
      city: body.city,
      address: body.address,
      dateOfBirth: new Date(body.dateOfBirth),
    },
  });

  const req = await prisma.kycRequest.create({
    data: {
      userId,
      requestedLevel: 3,
      currentLevel: user?.kyc ?? 1,
      documentType: body.documentType,
      documentUrl: body.documentFrontUrl,
      status: "EN_ATTENTE",
      // Store extra fields in a metadata JSON or separate columns if available
    },
  });

  return NextResponse.json({ request: req }, { status: 201 });
}

// ── Agency submission handler ────────────────────────────────────────────

async function handleAgencySubmission(userId: string, body: Record<string, string>) {
  const requiredFields = [
    "agencyName", "siret", "country", "city", "address",
    "legalRepName", "email", "phone",
    "documentType", "registrationDocUrl", "representativeIdUrl",
  ];

  const fieldLabels: Record<string, string> = {
    agencyName: "Nom de l'agence",
    siret: "SIRET / Numero d'immatriculation",
    country: "Pays",
    city: "Ville",
    address: "Adresse",
    legalRepName: "Nom du representant legal",
    email: "Email professionnel",
    phone: "Telephone",
    documentType: "Type de document d'entreprise",
    registrationDocUrl: "Document d'immatriculation",
    representativeIdUrl: "Piece d'identite du representant",
  };

  // Validate all required fields
  const errors: Record<string, string> = {};
  for (const field of requiredFields) {
    if (!body[field] || !body[field].trim()) {
      errors[field] = `${fieldLabels[field] || field} est requis`;
    }
  }

  // Validate document type
  const validDocTypes = ["KBIS", "REGISTRE_COMMERCE", "LICENCE"];
  if (body.documentType && !validDocTypes.includes(body.documentType)) {
    errors.documentType = "Type de document invalide";
  }

  // Validate email format
  if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    errors.email = "Format d'email invalide";
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "Champs requis manquants", errors }, { status: 400 });
  }

  if (IS_DEV) {
    // Check for existing pending request
    const existing = kycRequestStore.getByUser(userId);
    const pending = existing.find((r) => r.level === 3 && r.status === "en_attente");
    if (pending) {
      return NextResponse.json(
        { error: "Une demande est deja en attente de verification" },
        { status: 409 }
      );
    }

    const req = kycRequestStore.create({
      userId,
      level: 3,
      documentType: body.documentType as "KBIS" | "REGISTRE_COMMERCE" | "LICENCE",
      documentUrl: body.registrationDocUrl,
      type: "agency",
      agencyName: body.agencyName,
      siretNumber: body.siret,
      country: body.country,
      city: body.city,
      address: body.address,
      legalRepName: body.legalRepName,
      email: body.email,
      phone: body.phone,
      registrationDocUrl: body.registrationDocUrl,
      representativeIdUrl: body.representativeIdUrl,
    });

    return NextResponse.json({ request: req }, { status: 201 });
  }

  // Production: Prisma
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { kyc: true },
  });

  const pendingReq = await prisma.kycRequest.findFirst({
    where: {
      userId,
      requestedLevel: 3,
      status: "EN_ATTENTE",
    },
  });
  if (pendingReq) {
    return NextResponse.json(
      { error: "Une demande est deja en attente de verification" },
      { status: 409 }
    );
  }

  const req = await prisma.kycRequest.create({
    data: {
      userId,
      requestedLevel: 3,
      currentLevel: user?.kyc ?? 1,
      documentType: body.documentType,
      documentUrl: body.registrationDocUrl,
      status: "EN_ATTENTE",
    },
  });

  return NextResponse.json({ request: req }, { status: 201 });
}
