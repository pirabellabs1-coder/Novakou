## 1. Profil Agence

- [x] 1.1 Creer `apps/web/app/agence/profil/page.tsx` — formulaire d'edition avec champs agence (logo, nom, description, secteur, taille equipe, pays, site web, SIRET, liens sociaux) + barre de completion
- [x] 1.2 Ajouter onglet Previsualisation au profil agence — hero avec logo, nom, description, secteur, membres publics, services, liens, stats

## 2. Detail Commande Agence

- [x] 2.1 Creer `apps/web/app/agence/commandes/[id]/page.tsx` — page detail avec OrderPhasePipeline, infos commande, montant, statut, timeline
- [x] 2.2 Ajouter chat integre dans le detail commande agence — panneau lateral avec messages, envoi, historique
- [x] 2.3 Ajouter selecteur d'assignation membre dans le detail commande agence — dropdown equipe + affichage du membre assigne
- [x] 2.4 Ajouter zone de livraison fichiers dans le detail commande agence — drag-and-drop, liste brouillons

## 3. Factures Agence

- [x] 3.1 Creer `apps/web/app/agence/factures/page.tsx` — liste des factures avec numero, date, client, montant, statut, filtres, telechargement PDF, CA par membre, bouton export rapport

## 4. Notifications Agence

- [x] 4.1 Creer `apps/web/app/agence/notifications/page.tsx` — centre de notifications groupees par date, filtres par type, marquer comme lu, bouton tout marquer comme lu

## 5. Securite Agence

- [x] 5.1 Creer `apps/web/app/agence/securite/page.tsx` — changement mot de passe, activation 2FA (TOTP/SMS), sessions actives avec revocation, journal de securite

## 6. Litiges Agence

- [x] 6.1 Creer `apps/web/app/agence/litiges/page.tsx` — liste des litiges avec filtres par statut, detail avec timeline echanges, formulaire de reponse

## 7. Favoris Agence

- [x] 7.1 Creer `apps/web/app/agence/favoris/page.tsx` — onglets freelances/services/agences, cartes avec bouton retirer, bouton contacter

## 8. Contrats Agence

- [x] 8.1 Creer `apps/web/app/agence/contrats/page.tsx` — liste des contrats avec filtres par statut, creation depuis template (mission/prestation/NDA), detail du contrat, telechargement PDF

## 9. Mise a jour Sidebar

- [x] 9.1 Mettre a jour `AgenceSidebar.tsx` — ajouter les routes profil, factures, notifications, securite, litiges, favoris, contrats dans les sections appropriees
