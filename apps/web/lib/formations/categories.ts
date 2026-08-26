import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/formations/slugs";

// Trouve-ou-crée une catégorie à partir de n'importe quel libellé écrit par le
// vendeur. La déduplication se fait sur le SLUG (« E-books » et « e books »
// tombent sur la même ligne), pas sur le libellé exact — c'est ce qui évite de
// remplir la table de quasi-doublons quand deux vendeurs écrivent la même
// catégorie avec une casse différente.
export async function getOrCreateCategory(name: string) {
  const slug = slugify(name);
  const existing = await prisma.formationCategory.findUnique({ where: { slug } });
  if (existing) return existing;
  return prisma.formationCategory.create({
    data: { name, slug, isActive: true },
  });
}
