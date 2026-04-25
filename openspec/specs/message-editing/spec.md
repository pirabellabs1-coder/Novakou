## ADDED Requirements

### Requirement: User SHALL edit their own messages within 15 minutes
Le systeme DOIT permettre a un utilisateur d'editer le contenu textuel de ses propres messages dans un delai de 15 minutes apres l'envoi. Passe ce delai, l'edition n'est plus possible. La verification temporelle DOIT etre effectuee cote serveur.

#### Scenario: Edition reussie dans le delai
- **WHEN** l'utilisateur clique sur le menu contextuel d'un message qu'il a envoye il y a moins de 15 minutes et selectionne "Modifier"
- **THEN** le message passe en mode edition inline, l'utilisateur peut modifier le texte et sauvegarder, et le contenu est mis a jour en base avec le champ `editedAt` renseigne

#### Scenario: Edition refusee apres expiration du delai
- **WHEN** l'utilisateur tente d'editer un message envoye il y a plus de 15 minutes
- **THEN** le systeme affiche un message d'erreur "Le delai de modification est expire (15 minutes)" et le message reste inchange

#### Scenario: Edition annulee par l'utilisateur
- **WHEN** l'utilisateur est en mode edition et appuie sur Echap ou clique sur "Annuler"
- **THEN** le mode edition est ferme et le message original est restaure sans modification

### Requirement: Edited messages SHALL display an "edited" indicator
Le systeme DOIT afficher un indicateur "modifie" visible a cote du timestamp pour tout message dont le champ `editedAt` est non-null. L'indicateur DOIT etre visible par tous les participants de la conversation.

#### Scenario: Indicateur visible apres edition
- **WHEN** un message a ete edite avec succes
- **THEN** le texte "modifie" apparait a cote du timestamp du message pour tous les participants de la conversation

#### Scenario: Indicateur absent sur message non edite
- **WHEN** un message n'a jamais ete edite (`editedAt` est null)
- **THEN** aucun indicateur "modifie" n'est affiche

### Requirement: User SHALL delete their own messages within 10 minutes
Le systeme DOIT permettre a un utilisateur de supprimer ses propres messages dans un delai de 10 minutes apres l'envoi. La suppression est logique (soft delete) : le contenu est remplace par "Ce message a ete supprime" et le champ `deletedAt` est renseigne. Passe le delai, la suppression n'est plus possible.

#### Scenario: Suppression reussie dans le delai
- **WHEN** l'utilisateur clique sur le menu contextuel d'un message qu'il a envoye il y a moins de 10 minutes et selectionne "Supprimer"
- **THEN** une boite de confirmation s'affiche, et apres confirmation, le contenu du message est remplace par "Ce message a ete supprime" avec un style visuel distinct (texte en italique, couleur attenuee)

#### Scenario: Suppression refusee apres expiration du delai
- **WHEN** l'utilisateur tente de supprimer un message envoye il y a plus de 10 minutes
- **THEN** le systeme affiche un message d'erreur "Le delai de suppression est expire (10 minutes)" et le message reste inchange

#### Scenario: Confirmation de suppression annulee
- **WHEN** l'utilisateur clique sur "Supprimer" puis annule dans la boite de confirmation
- **THEN** le message reste inchange

### Requirement: Message context menu SHALL show available actions
Le systeme DOIT afficher un menu contextuel au survol ou au clic droit sur un message. Les actions disponibles DOIVENT varier selon le proprietaire du message et les delais restants.

#### Scenario: Menu contextuel sur son propre message recent
- **WHEN** l'utilisateur survole un message qu'il a envoye il y a moins de 10 minutes
- **THEN** un menu contextuel s'affiche avec les options "Modifier" et "Supprimer"

#### Scenario: Menu contextuel sur son propre message entre 10 et 15 minutes
- **WHEN** l'utilisateur survole un message qu'il a envoye entre 10 et 15 minutes
- **THEN** un menu contextuel s'affiche avec uniquement l'option "Modifier" (la suppression n'est plus disponible)

#### Scenario: Menu contextuel sur son propre message ancien
- **WHEN** l'utilisateur survole un message qu'il a envoye il y a plus de 15 minutes
- **THEN** aucune option d'edition ou de suppression n'est disponible dans le menu contextuel

#### Scenario: Menu contextuel sur le message d'un autre utilisateur
- **WHEN** l'utilisateur survole un message envoye par un autre participant
- **THEN** aucune option d'edition ou de suppression n'est affichee

### Requirement: Edit and delete API endpoints SHALL validate server-side
Le systeme DOIT fournir des endpoints API `PUT /api/conversations/[id]/messages/[messageId]` et `DELETE /api/conversations/[id]/messages/[messageId]` qui valident cote serveur que l'utilisateur est le proprietaire du message et que le delai n'est pas depasse.

#### Scenario: PUT reussi dans le delai
- **WHEN** une requete PUT est envoyee avec un nouveau contenu pour un message dont l'utilisateur est proprietaire et le delai de 15 minutes n'est pas depasse
- **THEN** le message est mis a jour en base avec `editedAt` = maintenant et le nouveau contenu, et la reponse HTTP est 200

#### Scenario: PUT refuse — pas proprietaire
- **WHEN** une requete PUT est envoyee pour un message dont l'utilisateur n'est pas proprietaire
- **THEN** la reponse HTTP est 403 avec le message "Vous ne pouvez modifier que vos propres messages"

#### Scenario: PUT refuse — delai depasse
- **WHEN** une requete PUT est envoyee pour un message envoye il y a plus de 15 minutes
- **THEN** la reponse HTTP est 400 avec le message "Le delai de modification est expire"

#### Scenario: DELETE reussi dans le delai
- **WHEN** une requete DELETE est envoyee pour un message dont l'utilisateur est proprietaire et le delai de 10 minutes n'est pas depasse
- **THEN** le message est mis a jour avec `deletedAt` = maintenant et contenu = "Ce message a ete supprime", et la reponse HTTP est 200

#### Scenario: DELETE refuse — delai depasse
- **WHEN** une requete DELETE est envoyee pour un message envoye il y a plus de 10 minutes
- **THEN** la reponse HTTP est 400 avec le message "Le delai de suppression est expire"
