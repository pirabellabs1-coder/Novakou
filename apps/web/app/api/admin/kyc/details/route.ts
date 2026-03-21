import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { IS_DEV } from "@/lib/env";
import { kycRequestStore } from "@/lib/dev/data-store";

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

    // Production: return empty for now — KYC details would come from Prisma
    return NextResponse.json({ details: [] });
  } catch (error) {
    console.error("[API /admin/kyc/details GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
