/**
 * Pages d'authentification : ni menu plateforme ni pied de page.
 *
 * Un visiteur en train de se connecter ou de créer son compte n'a pas besoin
 * de vingt liens sous le formulaire, et l'île de navigation en `fixed`
 * chevauchait le panneau gauche de ces pages. Elles portent leur propre
 * en-tête (marque + retour à l'accueil, cf. components/auth/AuthShell).
 * Module sans JSX pour rester importable par un test.
 */
const AUTH_PATHS = [
  "/connexion",
  "/inscription",
  "/mot-de-passe-oublie",
  "/reinitialiser-mot-de-passe",
  "/2fa",
  "/verifier-email",
  "/onboarding",
];

export function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
