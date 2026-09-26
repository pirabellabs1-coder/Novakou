import type { CSSProperties } from "react";

/**
 * Icônes SVG inline du menu public : traits fins (1.5), 24 × 24, couleur
 * héritée. Les clés reprennent les noms Material qu'utilisaient les données
 * du menu, pour ne rien renommer côté contenu. Pas de bibliothèque : une
 * douzaine de tracés suffit, et rien n'est chargé depuis Google Fonts.
 */
const PATHS = {
  storefront:
    "M3 9.5 5.2 4.6A1 1 0 0 1 6.1 4h11.8a1 1 0 0 1 .9.6L21 9.5M3 9.5h18M3 9.5a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 3 0M5 11.5V20h14v-8.5M10 20v-5h4v5",
  account_tree: "M3 4h18l-7 8.5V19l-4 2v-8.5L3 4Z",
  sell: "M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8ZM7.5 7.5h.01",
  account_balance_wallet: "M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2ZM10 5h4M12 18h.01",
  credit_card: "M3 6h18a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1ZM2 10h20M6 15h4",
  payments: "M12 4v11M8 11l4 4 4-4M5 20h14",
  auto_awesome:
    "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3ZM19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7L19 16Z",
  play_circle: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM10 8.5l5.5 3.5-5.5 3.5v-7Z",
  workspace_premium: "M12 14a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11ZM8.8 13.2 7.5 21l4.5-2.7 4.5 2.7-1.3-7.8",
  mail: "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM3 7l9 6 9-6",
  bolt: "M13 2 4 14h7l-1 8 9-12h-7l1-8Z",
  group:
    "M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM22 20v-2a4 4 0 0 0-3-3.9M15.5 4.1a3.5 3.5 0 0 1 0 6.8",
  school: "M22 9.5 12 4.5l-10 5 10 5 10-5ZM6 12v4.5c3 2.8 9 2.8 12 0V12M22 9.5V15",
  article: "M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2V4ZM22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7V4Z",
  arrow_forward: "M5 12h14M13 6l6 6-6 6",
  expand_more: "m6 9 6 6 6-6",
  login: "M14 3h5a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-5M10 17l5-5-5-5M15 12H3",
  dashboard: "M3 3h7v9H3V3ZM14 3h7v5h-7V3ZM14 12h7v9h-7v-9ZM3 16h7v5H3v-5Z",
  receipt_long: "M5 3v18l2-1 2 1 2-1 2 1 2-1 2 1 2-1V3l-2 1-2-1-2 1-2-1-2 1-2-1-2 1ZM9 8h6M9 12h6M9 16h4",
  inventory_2: "M21 8 12 3 3 8v8l9 5 9-5V8ZM3 8l9 5 9-5M12 13v8",
  admin_panel_settings: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10ZM9 12l2 2 4-4",
  support_agent: "M4 18v-6a8 8 0 0 1 16 0v6M4 14h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H4v-5ZM20 14h-2a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h2v-5ZM12 22h4",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z",
  logout: "M10 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5M16 17l5-5-5-5M21 12H9",
  check: "M20 6 9 17l-5-5",
  progress_activity: "M21 12a9 9 0 1 1-6.2-8.6",
  close: "M18 6 6 18M6 6l12 12",
} as const;

export type NavIconName = keyof typeof PATHS;

export function NavIcon({ name, className }: { name: NavIconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

/** Style inline acceptant les variables CSS (--i pour la cascade). */
export type StyleVars = CSSProperties & Record<`--${string}`, string | number>;
