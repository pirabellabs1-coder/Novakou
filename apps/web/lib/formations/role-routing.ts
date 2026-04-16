/**
 * Novakou — Role routing (single source of truth)
 *
 * Given a user's formationsRole, returns their dashboard URL.
 * Used everywhere: inscription, connexion, middleware, navbar, etc.
 */

export type FormationsRole = "apprenant" | "instructeur" | "mentor" | "affilie" | null | undefined;

const DASHBOARDS: Record<string, string> = {
  apprenant: "/formations/apprenant/dashboard",
  instructeur: "/formations/vendeur/dashboard",
  mentor: "/formations/mentor/dashboard",
  affilie: "/formations/affilie/dashboard",
};

export function getDashboardForFormationsRole(
  role: FormationsRole,
  userRole?: string
): string {
  // Admin overrides everything
  if (userRole === "ADMIN" || userRole === "admin") {
    return "/formations/admin/dashboard";
  }
  if (role && DASHBOARDS[role]) {
    return DASHBOARDS[role];
  }
  // No role yet → apprenant by default (least privileged)
  return "/formations/apprenant/dashboard";
}

export function getRoleLabel(role: FormationsRole): string {
  switch (role) {
    case "instructeur": return "Vendeur";
    case "apprenant": return "Apprenant";
    case "mentor": return "Mentor";
    case "affilie": return "Affilié";
    default: return "Utilisateur";
  }
}

export function getRoleIcon(role: FormationsRole): string {
  switch (role) {
    case "instructeur": return "storefront";
    case "apprenant": return "school";
    case "mentor": return "record_voice_over";
    case "affilie": return "diversity_3";
    default: return "person";
  }
}
