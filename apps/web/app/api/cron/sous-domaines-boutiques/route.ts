import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCronAuth } from "@/lib/cron/auth";
import {
  addDomain,
  listProjectDomains,
  removeDomain,
  vercelDomainsConfigured,
} from "@/lib/vercel-domains";
import {
  ROOT_DOMAIN,
  slugUtilisableEnSousDomaine,
  sousDomaineDeBoutique,
} from "@/lib/formations/shop-subdomain";

/**
 * GET /api/cron/sous-domaines-boutiques
 *
 * CHAQUE BOUTIQUE DOIT ÊTRE JOIGNABLE SUR `<slug>.novakou.com`.
 *
 * Le routage existe déjà (middleware + `boutique/by-domain`), mais un
 * sous-domaine ne sert rien tant que Vercel ne le connaît pas : sans domaine
 * rattaché au projet, il n'y a ni routage ni certificat, donc une erreur de
 * Vercel à la place de la vitrine.
 *
 * On ne peut pas s'en remettre à un domaine WILDCARD (`*.novakou.com`) :
 * Vercel exige alors SES serveurs de noms, or novakou.com reste chez
 * Cloudflare — c'est là que vivent le MX de la boîte du fondateur, le SPF, le
 * DKIM Resend et le DMARC. Basculer les NS pour un sous-domaine gratuit
 * mettrait en jeu l'e-mail transactionnel de toute la plateforme.
 *
 * Donc : un domaine par boutique, posé ici, en rattrapant les retards à chaque
 * passage. L'inventaire est lu chez Vercel plutôt que stocké en base — pas de
 * colonne à tenir à jour, donc pas de dérive possible entre les deux.
 *
 * ⚠️ L'API Vercel plafonne les AJOUTS de domaine à 100 par heure et par équipe.
 * On en consomme au plus `BUDGET_AJOUTS` et on laisse le reste au passage
 * suivant : le rattrapage initial (641 boutiques) s'étale sur quelques heures,
 * ce qui est sans conséquence pour une adresse qui n'était pas annoncée avant.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Marge sous le plafond de 100/h : les vendeurs qui branchent leur PROPRE
 * domaine consomment le même quota. Épuiser le crédit ici leur renverrait une
 * erreur au pire moment.
 */
const BUDGET_AJOUTS = 70;

export async function GET(request: NextRequest) {
  const authError = requireCronAuth(request);
  if (authError) return authError;

  if (!vercelDomainsConfigured()) {
    // Pas une panne : la plateforme tourne sans, les boutiques restent
    // joignables sur novakou.com/<slug>.
    return NextResponse.json({ ok: true, ignore: "vercel-non-configure" });
  }

  const inventaire = await listProjectDomains();
  if (!inventaire.ok) {
    return NextResponse.json(
      { ok: false, erreur: `inventaire Vercel indisponible : ${inventaire.error}` },
      { status: 502 },
    );
  }
  const deja = new Set(inventaire.domains.map((d) => d.name.toLowerCase()));

  const boutiques = await prisma.vendorShop.findMany({ select: { slug: true } });

  const inutilisables: string[] = [];
  const manquants: string[] = [];
  for (const { slug } of boutiques) {
    if (!slugUtilisableEnSousDomaine(slug)) {
      inutilisables.push(slug);
      continue;
    }
    const hote = sousDomaineDeBoutique(slug);
    if (!deja.has(hote)) manquants.push(hote);
  }

  const ajoutes: string[] = [];
  const echecs: Array<{ hote: string; erreur: string }> = [];
  let bloqueParVerification: string | null = null;

  for (const hote of manquants.slice(0, BUDGET_AJOUTS)) {
    const res = await addDomain(hote);

    if (!res.ok) {
      echecs.push({ hote, erreur: res.error ?? "inconnu" });
      // Un plafond atteint ne se rattrape pas dans la même heure : inutile
      // de brûler la fin du lot en erreurs.
      if (/rate limit|too many/i.test(res.error ?? "")) break;
      continue;
    }

    // Un défi TXT en attente veut dire que novakou.com est encore revendiqué
    // par un autre compte Vercel. Chaque boutique réclamerait alors SON
    // enregistrement TXT : impraticable à ce volume. On annule l'ajout (il ne
    // servirait rien) et on s'arrête — c'est une action humaine, pas un
    // incident à réessayer toutes les heures.
    const defiTxt = (res.verification ?? []).find((v) => v.type === "TXT");
    if (res.domain && !res.domain.verified && defiTxt) {
      await removeDomain(hote);
      bloqueParVerification = `${defiTxt.domain} → TXT ${defiTxt.value}`;
      break;
    }

    ajoutes.push(hote);
  }

  const restants = Math.max(0, manquants.length - ajoutes.length);

  if (bloqueParVerification) {
    return NextResponse.json({
      ok: false,
      bloque:
        `${ROOT_DOMAIN} n'est pas réclamé par cette équipe Vercel : chaque ` +
        `sous-domaine exigerait son propre enregistrement TXT. Réclamer le ` +
        `domaine au niveau de l'équipe (Vercel → Domains), puis relancer.`,
      exempleDeDefi: bloqueParVerification,
      boutiques: boutiques.length,
      manquants: manquants.length,
    });
  }

  return NextResponse.json({
    ok: true,
    boutiques: boutiques.length,
    deja: boutiques.length - manquants.length - inutilisables.length,
    ajoutes: ajoutes.length,
    restants,
    // Slugs qui ne peuvent PAS faire une étiquette DNS (trop longs, caractères
    // hors [a-z0-9-], ou sous-domaine réservé). Ils gardent novakou.com/<slug>.
    inutilisables: inutilisables.length,
    echecs,
  });
}
