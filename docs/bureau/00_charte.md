# Charte du Bureau Novakou — Session de refonte 2026-05-26

> **Convoqué par** : Lissanon Gildas (Fondateur)
> **Mandat** : Vérifier le fonctionnement, refondre les espaces vendeur et admin, réparer le tracking des ventes / visites / conversions.
> **Présidence** : Magnus Vandenberghe — Le Contrôleur

---

## Composition du Bureau (10 membres)

| # | Nom | Rôle | Périmètre | Pouvoir de vote |
|---|---|---|---|---|
| 1 | **Magnus Vandenberghe** | **Le Contrôleur** (Directeur Général) | Arbitrage final, sign-off des décisions, vérification de la qualité finale | 2 voix (départage) |
| 2 | Sophie Tremblay | Lead Product Designer | UX globale, refonte admin / vendeur / acheteur | 1 voix |
| 3 | Augustin Mékongo | Architecte Frontend Senior | Next.js 15, App Router, RSC, layouts | 1 voix |
| 4 | Karim Benali | Lead Backend | API routes, Prisma, intégrations paiement | 1 voix |
| 5 | Fatou Diallo | Data Engineer | Schéma analytics, agrégations, KPI vendeur/admin | 1 voix |
| 6 | Tomás Ribeiro | Tracking Specialist | Instrumentation funnel acheteur, événements client | 1 voix |
| 7 | Marcus Chen | QA Lead | Tests E2E, scénarios manuels, régression | 1 voix |
| 8 | Priya Sharma | DevOps / Verification | `pnpm dev`, vérification que le site tourne, monitoring | 1 voix |
| 9 | Amélie Lefèvre | Code Reviewer / Security | Revue diff, secrets, RLS, injection | 1 voix |
| 10 | David Okonkwo | Growth / Marketing Data | Définition des événements business, KPI de croissance | 1 voix |

**Quorum** : 6 membres minimum. **Majorité** : 6 voix sur 11 (Magnus pèse 2).

---

## Règles de fonctionnement (édictées par Le Contrôleur)

1. **Aucune décision sans vote enregistré** dans `01_proces_verbaux.md`.
2. **Aucune ligne de code livrée sans propriétaire nommé** (l'agent qui implémente).
3. **Pas d'avis sans donnée** : les diagnostics du jour reposent sur la cartographie produite par les 3 agents Explore en pré-séance.
4. **Toute refonte UX doit préserver les routes existantes** — aucun renommage `/vendeur/dashboard` → autre chose.
5. **Le tracking est traité comme une dette critique** : un trou de funnel = un blocker.
6. **Le Contrôleur peut imposer un veto** sur toute décision compromettant la stabilité financière ou la sécurité.
7. **Cadence** : 10 réunions thématiques dans cette session, 15 votes formels minimum, 1 synthèse finale signée par Magnus.

---

## Instruction du Contrôleur à l'équipe

> « Nous avons trois chantiers et un seul mandat : que Novakou soit professionnel d'ici la fin de cette séance. Je ne tolère ni les hacks, ni les composants inventés quand shadcn existe déjà, ni les chiffres de ventes affichés sans source de vérité. Tomás et Fatou prennent le funnel : il est en panne. Sophie et Léa prennent l'admin et le vendeur : ils manquent de sérieux visuel. Priya et Marcus prennent la vérification : on ne livre rien sans que le serveur tourne. Augustin et Karim sécurisent les wires Next.js / Prisma. Amélie passe en revue. David garantit que chaque événement business est nommé proprement. Je signe à la fin. »
>
> — **Magnus Vandenberghe**, 2026-05-26
