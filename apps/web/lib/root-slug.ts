import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { isReservedSlug } from "@/lib/reserved-slugs";

/**
 * À quoi correspond une adresse courte `novakou.com/<slug>` ?
 *
 * Boutiques, produits et formations vivent désormais tous à la racine : le
 * segment « /boutique/ » ou « /produit/ » devant chaque nom rallongeait
 * l'adresse et rappelait à l'acheteur qu'il est sur une place de marché.
 *
 * ORDRE DE PRIORITÉ, volontairement figé : boutique, puis produit, puis
 * formation. Chaque table impose l'unicité de son slug, mais RIEN n'empêche
 * une boutique et un produit de porter le même. Sans ordre écrit, lequel des
 * deux s'affiche dépendrait de l'ordre des requêtes — donc du hasard. La
 * boutique gagne : c'est l'adresse qu'un vendeur imprime et partage, la perdre
 * coûte plus cher que de devoir renommer un produit.
 */
export type RootSlugKind = "shop" | "product" | "formation";

/**
 * Mémorisé par requête : `generateMetadata` et le composant de page posent la
 * même question. Sans ce cache, chaque visite coûterait deux fois la
 * résolution — donc jusqu'à six allers-retours en base.
 */
export const resolveRootSlug = cache(async (slug: string): Promise<RootSlugKind | null> => {
  const s = (slug ?? "").trim().toLowerCase();
  if (!s || isReservedSlug(s)) return null;

  // Une seule salve : les trois tables sont interrogées en parallèle, et on
  // applique ensuite l'ordre de priorité. Interroger en série économiserait
  // des requêtes dans le cas favorable, au prix d'une latence en cascade sur
  // le chemin le plus fréquent (un produit partagé en publicité).
  const [shop, produit, formation] = await Promise.all([
    prisma.vendorShop.findUnique({ where: { slug: s }, select: { id: true } }),
    prisma.digitalProduct.findUnique({ where: { slug: s }, select: { id: true, status: true } }),
    prisma.formation.findUnique({ where: { slug: s }, select: { id: true, status: true } }),
  ]);

  if (shop) return "shop";
  // Un produit retiré de la vente ne doit pas laisser croire à une page vide :
  // on laisse la page produit décider (elle sait rediriger un ancien slug).
  if (produit) return "product";
  if (formation) return "formation";
  return null;
});
