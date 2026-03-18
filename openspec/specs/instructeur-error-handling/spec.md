## ADDED Requirements

### Requirement: Toutes les pages instructeur DOIVENT gerer les erreurs API
Chaque page de l'espace instructeur SHALL afficher un message d'erreur explicite avec un bouton "Reessayer" lorsqu'un appel API echoue. Le message MUST indiquer la nature de l'erreur. Le bouton "Reessayer" MUST fonctionner sans provoquer de crash (pas d'appel a des fonctions inexistantes).

#### Scenario: Erreur reseau sur une page avec React Query
- **WHEN** un appel API echoue dans une page utilisant un hook React Query
- **THEN** la page affiche un message d'erreur et un bouton "Reessayer" qui appelle `refetch()`

#### Scenario: Bouton Reessayer sur marketing/page.tsx
- **WHEN** l'utilisateur clique sur "Reessayer" sur la page marketing hub
- **THEN** le systeme relance la requete via React Query sans appeler `setLoading`/`setError` (qui n'existent pas)

### Requirement: Aucune donnee fictive NE DOIT apparaitre en production
Le dashboard instructeur SHALL afficher un etat vide ("Pas encore de donnees") au lieu de generer des valeurs aleatoires (`Math.random()`) quand les donnees API sont absentes. La page flash offers SHALL charger les formations/produits reels de l'instructeur au lieu d'utiliser des tableaux `MOCK_FORMATIONS`/`MOCK_PRODUCTS` hardcodes.

#### Scenario: Dashboard sans donnees d'inscription
- **WHEN** l'API ne retourne pas de donnees `enrollmentsByMonth`
- **THEN** le graphique affiche un etat vide au lieu de valeurs aleatoires

#### Scenario: Creation d'offre flash
- **WHEN** l'instructeur ouvre le formulaire de creation d'offre flash
- **THEN** le selecteur "Formation/Produit cible" charge les vraies formations et produits de l'instructeur depuis l'API

### Requirement: Les cohortes introuvables DOIVENT afficher un message explicite
La page `cohorts/[cohortId]/page.tsx` SHALL afficher un message "Cohorte introuvable" avec un lien de retour vers la liste des cohortes au lieu de retourner `null` (ecran blanc).

#### Scenario: Cohorte supprimee ou ID invalide
- **WHEN** l'instructeur accede a une URL de cohorte avec un ID invalide
- **THEN** la page affiche "Cohorte introuvable" avec un bouton "Retour aux cohortes"

### Requirement: Les mutations marketing DOIVENT gerer les erreurs
Les operations de suppression, toggle et mise a jour dans les pages marketing SHALL afficher un message d'erreur a l'utilisateur en cas d'echec API. Les suppressions optimistes locales SHALL etre annulees si l'appel API echoue.

#### Scenario: Echec de suppression d'une campagne
- **WHEN** la suppression API d'une campagne echoue (erreur reseau)
- **THEN** la campagne reste affichee dans la liste et un toast/message d'erreur est montre

#### Scenario: Echec de suppression d'un funnel
- **WHEN** l'instructeur supprime un funnel mais l'appel DELETE API n'est pas effectue
- **THEN** le systeme DOIT effectuer le vrai appel API DELETE avant de retirer le funnel de l'UI

### Requirement: La locale DOIT etre dynamique sur toutes les pages
Toutes les pages instructeur SHALL utiliser `const fr = locale === "fr"` (ou equivalent via `useLocale()`) au lieu de `const fr = true`. Les libelles du sidebar (subItems) SHALL utiliser le systeme de traduction `t()`.

#### Scenario: Page avis en anglais
- **WHEN** l'utilisateur a configure sa locale en anglais
- **THEN** la page avis affiche les libelles en anglais (pas en francais hardcode)

#### Scenario: Sidebar en anglais
- **WHEN** l'utilisateur a configure sa locale en anglais
- **THEN** les sous-elements du sidebar (Affilies, Reductions, etc.) s'affichent en anglais

### Requirement: Les erreurs de sauvegarde DOIVENT etre signalees
La page parametres et le tableau de bord affilies SHALL afficher un message d'erreur quand la sauvegarde echoue au lieu d'ignorer silencieusement l'exception dans un `catch {}` vide.

#### Scenario: Echec de sauvegarde des parametres
- **WHEN** la sauvegarde des parametres instructeur echoue (erreur 500)
- **THEN** le message "Erreur lors de la sauvegarde" est affiche au lieu de "Parametres sauvegardes"
