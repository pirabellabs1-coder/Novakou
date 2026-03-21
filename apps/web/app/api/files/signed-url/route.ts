import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSignedUrl, type StorageBucket } from "@/lib/supabase-storage";

const VALID_BUCKETS: StorageBucket[] = [
  "kyc-documents",
  "order-deliveries",
  "agency-resources",
  "contracts",
  "message-attachments",
];

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    const { bucket, path } = await req.json();

    if (!bucket || !path) {
      return NextResponse.json(
        { error: "Parametres 'bucket' et 'path' requis" },
        { status: 400 }
      );
    }

    if (!VALID_BUCKETS.includes(bucket)) {
      return NextResponse.json(
        { error: "Bucket invalide" },
        { status: 400 }
      );
    }

    const signedUrl = await getSignedUrl(bucket, path, 3600);

    if (!signedUrl) {
      return NextResponse.json(
        { error: "Impossible de generer l'URL signee" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: signedUrl });
  } catch (error) {
    console.error("[API /files/signed-url]", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
