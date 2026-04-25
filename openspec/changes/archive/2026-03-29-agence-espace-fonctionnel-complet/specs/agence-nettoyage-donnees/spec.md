## ADDED Requirements

### Requirement: Agency space SHALL contain zero hardcoded demo data
Le systeme SHALL garantir que l'espace agence ne contient aucune donnee demo, mock, ou hardcodee. Toutes les donnees affichees proviennent exclusivement des APIs internes. Les imports de `demo-data.ts` et `platform-data.ts` sont supprimes de toutes les pages de l'espace agence. Les chiffres, noms, avatars, et statistiques proviennent uniquement de la base de donnees via les APIs.

#### Scenario: Nouvel utilisateur agence voit tout a zero
- **WHEN** un nouvel utilisateur avec le role "agency" se connecte pour la premiere fois
- **THEN** toutes les cartes statistiques affichent 0 (CA, commandes, membres, services, avis)
- **THEN** toutes les listes sont vides avec un etat vide propre (message explicatif + CTA)
- **THEN** tous les graphiques affichent un etat vide ou un message "Pas encore de donnees"

#### Scenario: Aucun import de donnees demo dans l'espace agence
- **WHEN** on inspecte le code de toutes les pages sous `apps/web/app/agence/`
- **THEN** aucune page n'importe depuis `lib/demo-data.ts` ou `lib/dev/`
- **THEN** aucune variable n'est initialisee avec des valeurs hardcodees (ex: `revenue: 15000`)
