/**
 * Admin roles and permissions system.
 * Defines what each admin sub-role can access.
 */

export type AdminRole =
  | "super_admin"
  | "moderateur"
  | "validateur_kyc"
  | "analyste"
  | "support"
  | "financier";

export type AdminPermission =
  | "dashboard.view"
  | "users.view"
  | "users.edit"
  | "users.impersonate"
  | "kyc.view"
  | "kyc.action"
  | "services.view"
  | "services.action"
  | "orders.view"
  | "orders.action"
  | "disputes.view"
  | "disputes.action"
  | "finances.view"
  | "finances.action"
  | "plans.view"
  | "plans.edit"
  | "blog.view"
  | "blog.edit"
  | "categories.view"
  | "categories.edit"
  | "messages.view"
  | "messages.send"
  | "notifications.view"
  | "notifications.send"
  | "analytics.view"
  | "audit.view"
  | "config.view"
  | "config.edit"
  | "team.view"
  | "team.manage"
  | "comptabilite.view";

const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  super_admin: [
    "dashboard.view",
    "users.view", "users.edit", "users.impersonate",
    "kyc.view", "kyc.action",
    "services.view", "services.action",
    "orders.view", "orders.action",
    "disputes.view", "disputes.action",
    "finances.view", "finances.action",
    "plans.view", "plans.edit",
    "blog.view", "blog.edit",
    "categories.view", "categories.edit",
    "messages.view", "messages.send",
    "notifications.view", "notifications.send",
    "analytics.view",
    "audit.view",
    "config.view", "config.edit",
    "team.view", "team.manage",
    "comptabilite.view",
  ],
  moderateur: [
    "dashboard.view",
    "services.view", "services.action",
    "blog.view", "blog.edit",
    "categories.view", "categories.edit",
    "audit.view",
  ],
  validateur_kyc: [
    "dashboard.view",
    "users.view",
    "kyc.view", "kyc.action",
    "audit.view",
  ],
  analyste: [
    "dashboard.view",
    "users.view",
    "orders.view",
    "finances.view",
    "analytics.view",
    "audit.view",
  ],
  support: [
    "dashboard.view",
    "users.view",
    "orders.view", "orders.action",
    "disputes.view", "disputes.action",
    "messages.view", "messages.send",
    "notifications.view", "notifications.send",
    "audit.view",
  ],
  financier: [
    "dashboard.view",
    "orders.view",
    "finances.view", "finances.action",
    "plans.view", "plans.edit",
    "analytics.view",
    "audit.view",
    "comptabilite.view",
  ],
};

export function hasPermission(role: AdminRole, permission: AdminPermission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getPermissions(role: AdminRole): AdminPermission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/** Admin sidebar links and their required permissions */
export const ADMIN_NAV_PERMISSIONS: Record<string, AdminPermission> = {
  "/admin/dashboard": "dashboard.view",
  "/admin/utilisateurs": "users.view",
  "/admin/kyc": "kyc.view",
  "/admin/produits": "services.view",
  "/admin/commandes": "orders.view",
  "/admin/mentor-disputes": "disputes.view",
  "/admin/finances": "finances.view",
  "/admin/plans": "plans.view",
  "/admin/blog": "blog.view",
  "/admin/categories": "categories.view",
  "/admin/messages": "messages.view",
  "/admin/notifications": "notifications.view",
  "/admin/analytics": "analytics.view",
  "/admin/audit-log": "audit.view",
  "/admin/configuration": "config.view",
  "/admin/equipe": "team.view",
  "/admin/comptabilite": "comptabilite.view",
};

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  moderateur: "Modérateur",
  validateur_kyc: "Validateur KYC",
  analyste: "Analyste",
  support: "Support",
  financier: "Financier",
};

export const ALL_ADMIN_ROLES: AdminRole[] = [
  "super_admin",
  "moderateur",
  "validateur_kyc",
  "analyste",
  "support",
  "financier",
];

// ============================================================
// Server-side helper for API routes
// ============================================================

/**
 * Check if an admin session has a specific permission.
 * Returns an object with `allowed` and an optional 403 JSON response to send.
 * Usage in API routes:
 *   const check = requireAdminPermission(session, "team.manage");
 *   if (!check.allowed) return check.errorResponse;
 */
export function requireAdminPermission(
  session: { user?: { role?: string; adminRole?: string } } | null,
  permission: AdminPermission
): { allowed: boolean; role: AdminRole; errorResponse?: Response } {
  const role = ((session?.user?.adminRole as string) || "super_admin") as AdminRole;
  const allowed = hasPermission(role, permission);
  if (!allowed) {
    const label = ADMIN_ROLE_LABELS[role] || role;
    // Return a NextResponse-compatible object
    const body = JSON.stringify({
      error: `Vous n'etes pas autorise a effectuer cette action. Votre role ${label} ne dispose pas de la permission "${permission}".`,
      code: "ADMIN_PERMISSION_DENIED",
      requiredPermission: permission,
      currentRole: role,
    });
    return {
      allowed: false,
      role,
      errorResponse: new Response(body, { status: 403, headers: { "Content-Type": "application/json" } }),
    };
  }
  return { allowed: true, role };
}
