// Construction de l'extrait filigrane servi en apercu gratuit.
//
// Module SERVEUR uniquement : il embarque pdf-lib (~1 Mo). Les constantes de
// la regle vivent dans apercu.ts, sans dependance, pour rester importables
// depuis un composant client.

import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import { PAGES_APERCU, TEXTE_FILIGRANE } from "./apercu";

/** Le PDF du vendeur est illisible : chiffre, tronque, ou pas un PDF. */
export class PdfIllisibleError extends Error {}

/**
 * Decoupe les PAGES_APERCU premieres pages du PDF du vendeur et y incruste le
 * filigrane Novakou.
 *
 * Le filigrane n'est pas optionnel : la page produit promet noir sur blanc a
 * l'acheteur que l'apercu en porte un. Un extrait propre serait un fichier
 * complet en puissance, redistribuable tel quel.
 *
 * @throws PdfIllisibleError si pdf-lib ne sait pas ouvrir la source.
 */
export async function construireApercuPdf(source: Uint8Array): Promise<Uint8Array> {
  let srcDoc: PDFDocument;
  try {
    // pdf-lib refuse les PDF chiffres par defaut. ignoreEncryption fait qu'un
    // fichier protege par mot de passe retombe sur « pas d'apercu » plutot que
    // sur une erreur 500.
    srcDoc = await PDFDocument.load(source, { ignoreEncryption: true });
  } catch (err) {
    throw new PdfIllisibleError(String(err));
  }

  // Un PDF d'une seule page n'en montre qu'une : on ne copie jamais plus que
  // ce que le document contient, sinon copyPages jette.
  const take = Math.min(PAGES_APERCU, srcDoc.getPageCount());

  const outDoc = await PDFDocument.create();
  const copiees = await outDoc.copyPages(
    srcDoc,
    Array.from({ length: take }, (_, i) => i),
  );
  for (const page of copiees) outDoc.addPage(page);

  // Filigrane en diagonale, repete sur trois bandes pour couvrir la zone
  // visible quelle que soit l'orientation de la page.
  const police = await outDoc.embedFont(StandardFonts.HelveticaBold);
  for (const page of outDoc.getPages()) {
    const { width, height } = page.getSize();
    const taille = Math.max(28, Math.min(width, height) * 0.06);
    for (const ratio of [0.25, 0.5, 0.75]) {
      page.drawText(TEXTE_FILIGRANE, {
        x: width * 0.08,
        y: height * ratio,
        size: taille,
        font: police,
        color: rgb(0.55, 0.55, 0.55),
        opacity: 0.22,
        rotate: degrees(-30),
      });
    }
  }

  return outDoc.save();
}
