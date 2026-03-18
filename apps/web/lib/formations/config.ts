// FreelanceHigh — Configuration centralisée du module formations

export const FORMATIONS_CONFIG = {
  // Commissions
  INSTRUCTOR_COMMISSION: 0.70,  // 70% pour l'instructeur
  PLATFORM_COMMISSION: 0.30,    // 30% pour la plateforme

  // Remboursements
  REFUND_WINDOW_DAYS: 14,       // Fenêtre de remboursement en jours
  REFUND_MAX_PROGRESS: 30,      // Progression max (%) pour être éligible au remboursement

  // Auto-refresh (TanStack Query)
  AUTO_REFRESH_DASHBOARD_MS: 30_000,  // 30s pour les dashboards
  AUTO_REFRESH_LIST_MS: 60_000,       // 60s pour les listes

  // Limites
  MAX_UPLOAD_SIZE_MB: 100,
  MAX_FREE_FORMATIONS: 3,      // Formations gratuites par instructeur (plan gratuit)

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// Re-exports pour rétrocompatibilité
export const INSTRUCTOR_COMMISSION = FORMATIONS_CONFIG.INSTRUCTOR_COMMISSION;
export const PLATFORM_COMMISSION = FORMATIONS_CONFIG.PLATFORM_COMMISSION;
