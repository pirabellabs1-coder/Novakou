import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CertificateView from "@/components/formations/CertificateView";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Certificat ${code} · Novakou`,
    description: `Certificat de complétion Novakou — code ${code}.`,
  };
}

export default async function CertificatePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const cert = await prisma.certificate.findUnique({
    where: { code },
    include: {
      user: { select: { name: true, email: true, image: true } },
      formation: {
        include: {
          sections: { include: { lessons: { select: { id: true } } } },
          instructeur: {
            include: { user: { select: { name: true } } },
          },
        },
      },
    },
  });

  if (!cert) notFound();

  const totalLessons = cert.formation.sections.reduce(
    (sum, s) => sum + s.lessons.length,
    0,
  );
  const studentName = cert.user.name || cert.user.email.split("@")[0] || "Apprenant";

  return (
    <>
      <CertificateView
        studentName={studentName}
        formationTitle={cert.formation.title}
        instructorName={cert.formation.instructeur?.user?.name ?? null}
        issuedAt={new Date(cert.issuedAt)}
        score={cert.score}
        totalLessons={totalLessons}
        code={cert.code}
        isRevoked={!!cert.revokedAt}
      />
      <div className="text-center pb-10 -mt-2"
        style={{ background: "linear-gradient(180deg, #f5f1e0 0%, #f0eee3 100%)" }}>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0d3b1f] hover:text-[#c9a961] transition-colors"
        >
          <ArrowLeft size={16} />
          Retour à Novakou
        </Link>
      </div>
    </>
  );
}
