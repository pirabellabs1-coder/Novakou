import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const mentorEmail = "mentor.test@freelancehigh.local";
const user = await prisma.user.findUnique({
  where: { email: mentorEmail },
  select: {
    id: true,
    email: true,
    formationsRole: true,
    instructeurProfile: { select: { id: true } },
  },
});
console.log("User:", user);

if (user?.instructeurProfile) {
  const seqs = await prisma.emailSequence.findMany({
    where: { instructeurId: user.instructeurProfile.id },
    select: { id: true, name: true, instructeurId: true, createdAt: true },
  });
  console.log(`Found ${seqs.length} sequences for instructeurId=${user.instructeurProfile.id}:`);
  seqs.forEach((s) => console.log(`  - ${s.id} "${s.name}" (created ${s.createdAt.toISOString()})`));
}

// Also look for orphans or mismatched
const allSeqs = await prisma.emailSequence.findMany({
  include: { instructeur: { select: { userId: true } } },
});
console.log(`\nTotal sequences in DB: ${allSeqs.length}`);
allSeqs.slice(0, 20).forEach((s) => {
  console.log(`  - ${s.id} "${s.name}" → instructeurId=${s.instructeurId} userId=${s.instructeur?.userId}`);
});
process.exit(0);
