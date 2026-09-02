import { promptAction } from "@/store/prompt";

/**
 * Fenetre de motif affichee avant de refuser un produit ou une formation.
 *
 * Le motif est OBLIGATOIRE : un vendeur ne corrige que ce qu'on lui nomme.
 * Sans lui, l'API retombe sur « Non conforme aux regles de la marketplace »,
 * une phrase qui n'aide personne a republier.
 *
 * Cote serveur, le motif est ecrit dans `refuseReason` (visible par le vendeur
 * sur sa page d'edition), envoye dans sa notification, et journalise dans
 * l'audit admin.
 *
 * Partage entre /admin/produits et /admin/dashboard, qui refusent tous deux
 * via la meme route : deux libelles divergents pour la meme action seraient
 * deroutants pour l'equipe de moderation.
 *
 * @returns le motif saisi, ou null si l'admin a annule.
 */
export function demanderMotifRefus(titre: string): Promise<string | null> {
  return promptAction({
    title: `Refuser « ${titre} » ?`,
    message:
      "Le vendeur est notifié du motif et le retrouve sur sa page d'édition. Il pourra corriger puis resoumettre le produit à la validation.",
    placeholder: "Ex : les visuels ne correspondent pas au contenu livré…",
    confirmLabel: "Refuser le produit",
    cancelLabel: "Annuler",
    icon: "block",
    multiline: true,
    validate: (v) =>
      v.trim().length < 3 ? "Le motif est obligatoire (au moins 3 caractères)." : null,
  });
}
