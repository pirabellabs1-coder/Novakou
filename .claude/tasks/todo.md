# Lot « tableau de bord vendeur & boutique publique » — 2026-08-06

Treize demandes du fondateur. Regroupées par dépendance réelle, pas par ordre
d'énoncé : plusieurs se recoupent, et deux ne peuvent pas être faites avant
celles dont elles consomment les données.

---

## Lot A — Retraits de la vitrine publique  ⬜
*Indépendant, sans risque, visible immédiatement. À faire en premier.*

- [ ] **(3)** Supprimer les statistiques de la boutique publique : nombre de
      clients, nombre d'auteurs, nombre de produits.
- [ ] **(4)** Masquer le nombre de ventes — cartes produit **et** page de
      détail. Ajouter un réglage boutique pour le réactiver.
      **Défaut : désactivé.** C'est un changement de schéma (un champ booléen
      sur la boutique), donc migration Prisma.
- [ ] **(8)** Retirer la date d'ajout des produits partout : cartes, page de
      détail, et tout autre endroit où elle apparaît.

---

## Lot B — Identité : profil vendeur → profil boutique  ⬜
*Le plus lourd. (6) et (9) sont la MÊME refonte vue de deux côtés ; (7) en
consomme les champs et ne peut pas être fait avant.*

- [ ] **(6)+(9)** Supprimer le profil personnel du vendeur (« Entrepreneur »,
      profil vendeur, informations personnelles). Le vendeur gère des
      boutiques, pas un profil.
      Créer à la place, dans **Paramètres de la boutique** : description/bio,
      Facebook, Instagram, LinkedIn, YouTube, site web (optionnel), WhatsApp,
      e-mail de contact. Affichés automatiquement sur la boutique publique.
      → Migration Prisma + revue des routes publiques qui exposent un profil
        vendeur (elles doivent cesser d'exister ou rediriger, pas rendre 500).
- [ ] **(7)** Bloc « Contactez-nous » sur la page produit : **après** la
      description, **avant** les produits recommandés. E-mail, WhatsApp,
      bouton de chat si disponible.
      ⚠️ Dépend de (6) : sans les champs de contact, ce bloc n'a rien à afficher.

---

## Lot C — Tableau de bord vendeur  ⬜

- [ ] **(11)** Widget « Revenu du mois » → « **Revenus** » : total depuis la
      création de la boutique, pas le mois en cours.
- [ ] **(5)** Bouton « Voir la boutique » dans la barre supérieure, près de la
      recherche. Ouvre la boutique publique.
- [ ] **(2)** Filtres de période **Aujourd'hui** et **Hier** sur TOUTES les
      statistiques : revenus, ventes, visiteurs, etc.
      → Vérifier le fuseau horaire : « aujourd'hui » calculé en UTC donnerait
        un jour faux pour un vendeur africain une partie de la journée.

---

## Lot D — Analytique  ⬜
*Dépend de l'état réel du tracking : à auditer avant de promettre un chiffre.*

- [ ] **(1)** Visiteurs par pays : afficher le **nombre réel**, pas le
      pourcentage. **Et corriger la géolocalisation** — le fondateur signale
      qu'elle identifie mal les pays. Auditer d'abord d'où vient le pays
      (en-tête Vercel `x-vercel-ip-country` ?) avant de changer l'affichage :
      afficher un nombre faux est pire qu'un pourcentage faux.
- [ ] **(13)** Taux de rebond, aux côtés des autres indicateurs.
      → Exige de savoir ce qu'on compte comme « rebond ». Sans définition
        posée, l'indicateur sera joli et faux, et des décisions de publicité
        seront prises dessus.

---

## Lot E — Relances de panier abandonné  ⬜
*Le plus sensible : ça envoie des e-mails à de vraies personnes.*

- [ ] **(10)** Déclencher l'enregistrement de l'abandon dès que le visiteur a
      rempli ses informations ET cliqué sur payer, sans finaliser.
      Relances à **5 min**, **10 min**, **24 h**.
      ⚠️ Points à trancher avant de coder :
      - ne PAS relancer une commande finalement payée (course entre la relance
        à 5 min et une confirmation Mobile Money lente — c'est exactement le
        cas des paiements qui mettent plusieurs minutes à se confirmer) ;
      - ne pas réenvoyer trois fois si le visiteur revient dès la première ;
      - un visiteur sans e-mail valide ne doit pas produire d'échec en boucle.

---

## Lot F — Éditeur enrichi  ⬜
*Indépendant de tout le reste. Bug isolé, bon candidat en parallèle.*

- [ ] **(12)** L'application d'une couleur sur du texte sélectionné n'a aucun
      effet. Corriger, et vérifier les autres commandes de mise en forme au
      passage.

---

## Ordre recommandé

**A** (rapide, visible, zéro risque) → **F** (bug isolé) → **C** → **B** (le
plus lourd, et (7) en dépend) → **D** (après audit du tracking) → **E** (en
dernier : e-mails réels, et une course avec la confirmation de paiement).

## Reste ouvert du lot précédent

- Appel de statut iPay refusé (« Missing params ») : le Niger peut encaisser
  sans livrer. Décision en attente — suspendre iPay, ou récupérer leur doc.
- Taux de change codés en dur, non éditables en admin.
- Cron d'alerte des ventes bloquées : exécution en production non vérifiée
  (le déclenchement manuel répond « Unauthorized »).
