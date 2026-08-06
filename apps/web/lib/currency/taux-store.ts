import { prisma } from "@/lib/prisma";
import { appliquerTaux, tauxCourants } from "@/lib/currency/rates";

/**
 * Taux de change modifiables en admin, rangés dans la table clé/valeur
 * existante — aucune migration pour une donnée qui tient en une ligne.
 *
 * POURQUOI CE MODULE EXISTE
 * Les taux étaient codés en dur. Le FCFA est fixe, donc ça passait ; le naira,
 * le cedi et le shilling ne le sont pas. Un chiffre figé dérive, et l'écart se
 * paie en silence — exactement ce qui s'est produit avec le franc congolais,
 * réglé à 4,6 pour une valeur réelle de 4,03 : 14 % surfacturés à de vraies
 * personnes sans qu'aucune alerte ne se déclenche.
 */

const CLE = "currency.rates";

/** Cache court : un paiement lit les taux plusieurs fois, la base une seule. */
const CACHE_MS = 60_000;
let charge = 0;

export async function chargerTaux(force = false): Promise<void> {
  if (!force && Date.now() - charge < CACHE_MS) return;
  try {
    const row = await prisma.formationsConfig.findUnique({ where: { key: CLE } });
    if (row?.value) appliquerTaux(JSON.parse(row.value) as Record<string, number>);
    charge = Date.now();
  } catch {
    // Base injoignable ou valeur illisible : on garde les taux du code. Un
    // prix ne doit jamais dépendre de la disponibilité d'une configuration.
  }
}

export async function lireTaux(): Promise<Record<string, number>> {
  await chargerTaux(true);
  return tauxCourants();
}

export async function enregistrerTaux(taux: Record<string, number>): Promise<Record<string, number>> {
  // On n'écrit QUE des valeurs saines : une faute de frappe en admin ne doit
  // pas pouvoir mettre tous les prix d'un pays à zéro.
  const propre: Record<string, number> = {};
  for (const [code, v] of Object.entries(taux)) {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) propre[code.trim().toUpperCase()] = n;
  }
  await prisma.formationsConfig.upsert({
    where: { key: CLE },
    create: { key: CLE, value: JSON.stringify(propre), label: "Taux de change (unités par FCFA)" },
    update: { value: JSON.stringify(propre) },
  });
  appliquerTaux(propre);
  charge = Date.now();
  return tauxCourants();
}
