/**
 * L'ADMIN VOIT PASSER CHAQUE VERSEMENT — réussi comme refusé.
 *
 * Jusqu'au 2026-08-19, un versement qui aboutissait ne prévenait que le
 * bénéficiaire. Le fondateur a fait un retrait, l'a reçu, et n'a rien vu dans
 * son espace admin : « rien ne s'affiche pour dire qu'un retrait vient d'être
 * effectué ». De l'argent qui sort de la plateforme sans qu'un admin en soit
 * informé, c'est un angle mort — pas seulement pour le suivi, pour la fraude.
 *
 * Deux chemins mènent à un versement réussi : la réponse immédiate de la
 * passerelle à l'exécution, ou sa confirmation ultérieure (webhook, cron de
 * rapprochement). Cette fonction unique est appelée aux deux endroits, pour
 * que le message soit le même quel que soit le chemin.
 */
export async function alerterAdminsVersementReussi(params: {
  amount: number;
  /** "vendeur" | "mentor" | "affilié" | "plateforme" */
  qui: string;
  method: string;
  provider: string;
  providerRef: string;
  beneficiaire?: string | null;
}): Promise<void> {
  try {
    const { notifyAdmins } = await import("@/lib/admin/notify");
    const dest = params.beneficiaire ? ` → ${params.beneficiaire}` : "";
    await notifyAdmins({
      title: `Versement effectué : ${Math.round(params.amount)} FCFA (${params.qui})`,
      message: `${params.method} via ${params.provider} · réf ${params.providerRef}${dest}`,
      link: params.qui === "affilié" ? "/admin/retraits" : "/admin/retraits-vendeurs",
    });
  } catch (err) {
    // Une alerte ne doit jamais faire échouer le versement qu'elle annonce.
    console.error("[payout] alerte admin (succès) impossible", err);
  }
}
