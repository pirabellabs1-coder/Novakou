import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { IS_DEV } from "@/lib/env";
import { kycRequestStore } from "@/lib/dev/data-store";
import { prisma } from "@/lib/prisma";

// GET /api/admin/kyc/details — Fetch detailed KYC submissions for all pending requests
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    if (IS_DEV) {
      const pendingRequests = kycRequestStore.getPending();

      const details = pendingRequests.map((req) => ({
        userId: req.userId,
        requestId: req.id,
        type: req.type || "legacy",
        level: req.level,
        documentType: req.documentType,
        documentUrl: req.documentUrl,
        // Individual fields
        firstName: req.firstName,
        lastName: req.lastName,
        dateOfBirth: req.dateOfBirth,
        country: req.country,
        city: req.city,
        address: req.address,
        documentFrontUrl: req.documentFrontUrl,
        documentBackUrl: req.documentBackUrl,
        selfieUrl: req.selfieUrl,
        // Agency fields
        agencyName: req.agencyName,
        siretNumber: req.siretNumber,
        legalRepName: req.legalRepName,
        email: req.email,
        phone: req.phone,
        registrationDocUrl: req.registrationDocUrl,
        representativeIdUrl: req.representativeIdUrl,
        // Meta
        createdAt: req.createdAt,
      }));

      return NextResponse.json({ details });
    }

    // Production: Prisma — fetch pending KYC requests with metadata + user info
    const pendingRequests = await prisma.kycRequest.findMany({
      where: { status: "EN_ATTENTE" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            firstName: true,
            lastName: true,
            country: true,
            city: true,
            address: true,
            dateOfBirth: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const details = pendingRequests.map((req) => {
      const meta = (req.metadata as Record<string, string> | null) || {};
      const isAgency = req.submissionType === "agency";

      return {
        userId: req.userId,
        requestId: req.id,
        type: req.submissionType || "legacy",
        level: req.requestedLevel,
        documentType: req.documentType,
        documentUrl: req.documentUrl,
        userName: req.user.name,
        userEmail: req.user.email,
        userRole: req.user.role,
        // Individual fields (from metadata or user record)
        firstName: meta.firstName || req.user.firstName || "",
        lastName: meta.lastName || req.user.lastName || "",
        dateOfBirth: meta.dateOfBirth || (req.user.dateOfBirth ? req.user.dateOfBirth.toISOString().split("T")[0] : ""),
        country: meta.country || req.user.country || "",
        city: meta.city || req.user.city || "",
        address: meta.address || req.user.address || "",
        documentFrontUrl: meta.documentFrontUrl || req.documentUrl || "",
        documentBackUrl: meta.documentBackUrl || "",
        selfieUrl: meta.selfieUrl || "",
        // Agency fields
        agencyName: isAgency ? meta.agencyName : undefined,
        siretNumber: isAgency ? meta.siret : undefined,
        legalRepName: isAgency ? meta.legalRepName : undefined,
        email: isAgency ? meta.email : undefined,
        phone: isAgency ? meta.phone : undefined,
        registrationDocUrl: isAgency ? meta.registrationDocUrl : undefined,
        representativeIdUrl: isAgency ? meta.representativeIdUrl : undefined,
        // Meta
        createdAt: req.createdAt,
      };
    });

    return NextResponse.json({ details });
  } catch (error) {
    console.error("[API /admin/kyc/details GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
