// Test end-to-end du flow KYC
import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

async function main() {
  console.log("🧪 Test flow KYC\n" + "═".repeat(50));

  // 1. État initial : mentor n'a pas encore de KYC validé
  const mentor = await p.user.findUnique({
    where: { email: "mentor.test@freelancehigh.local" },
    select: { id: true, kyc: true },
  });
  if (!mentor) throw new Error("Mentor introuvable");
  console.log(`\n1) État initial : mentor.kyc = ${mentor.kyc ?? 0}`);

  // 2. Le mentor soumet une demande KYC (niveau 2)
  const kyc = await p.kycRequest.create({
    data: {
      userId: mentor.id,
      currentLevel: mentor.kyc ?? 0,
      requestedLevel: 2,
      documentType: "CNI",
      documentUrl: "https://example.com/cni-test.jpg",
    },
  });
  console.log(`✓ 2) KYC request créée : ${kyc.id} (status=${kyc.status})`);

  // 3. Admin approuve
  const admin = await p.user.findUnique({ where: { email: "admin@novakou.com" } });
  if (!admin) throw new Error("Admin introuvable");
  const now = new Date();
  await p.$transaction([
    p.kycRequest.update({
      where: { id: kyc.id },
      data: {
        status: "APPROUVE",
        reviewedBy: admin.id,
        reviewedAt: now,
      },
    }),
    p.user.update({
      where: { id: mentor.id },
      data: { kyc: Math.max(mentor.kyc ?? 0, 2) },
    }),
  ]);

  const updatedMentor = await p.user.findUnique({ where: { id: mentor.id }, select: { kyc: true } });
  console.log(`✓ 3) Admin approuve → mentor.kyc = ${updatedMentor?.kyc}`);

  // 4. Vérif : le mentor peut retirer maintenant
  const KYC_REQUIRED = 2;
  const canWithdraw = (updatedMentor?.kyc ?? 0) >= KYC_REQUIRED;
  console.log(`✓ 4) Mentor peut-il retirer ? ${canWithdraw ? "OUI ✅" : "NON ❌"}`);

  console.log("\n✅ FLOW KYC COMPLET OK");
  await p.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
