import { test, expect } from "@playwright/test";
import zlib from "node:zlib";
import { PDFDocument, PDFArray, PDFRawStream } from "pdf-lib";
import { PAGES_APERCU, TEXTE_FILIGRANE } from "../lib/formations/apercu";
import { construireApercuPdf, PdfIllisibleError } from "../lib/formations/apercu-pdf";

/**
 * L'apercu gratuit donne une partie d'un produit PAYANT. Deux choses ne
 * doivent jamais deriver sans qu'on s'en apercoive :
 *   - combien de pages partent gratuitement (c'etait un curseur vendeur
 *     reglable jusqu'a 20 pages ; c'est desormais une regle plateforme a 2) ;
 *   - le filigrane, que la page produit promet noir sur blanc a l'acheteur.
 *
 * Un extrait sans filigrane, ou trop genereux, se redistribue tel quel.
 */

/** Fabrique un PDF de n pages, pour ne dependre d'aucun fichier externe. */
async function pdfDeTest(pages: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage([595, 842]); // A4
  return doc.save();
}

/**
 * Texte reellement dessine sur une page. Le flux de contenu est compresse en
 * Flate, et pdf-lib y ecrit les chaines en hexadecimal : sans decompresser ET
 * decoder, chercher le filigrane dans les octets bruts ne trouve jamais rien
 * — et le test passerait au vert meme filigrane supprime.
 */
function texteDessine(doc: PDFDocument, indexPage: number): string {
  const page = doc.getPage(indexPage);
  const contenu = page.node.Contents();
  const refs = contenu instanceof PDFArray ? contenu.asArray() : [contenu];
  let flux = "";
  for (const ref of refs) {
    const objet = doc.context.lookup(ref);
    if (!(objet instanceof PDFRawStream)) continue;
    let octets = Buffer.from(objet.contents);
    try {
      octets = zlib.inflateSync(octets);
    } catch {
      // Flux non compresse : on le lit tel quel.
    }
    flux += octets.toString("latin1");
  }
  // Chaines hexadecimales <...> puis chaines litterales (...).
  const hex = [...flux.matchAll(/<([0-9A-Fa-f\s]+)>/g)]
    .map((m) => Buffer.from(m[1].replace(/\s/g, ""), "hex").toString("latin1"))
    .join(" ");
  const litterales = [...flux.matchAll(/\(([^)]*)\)/g)].map((m) => m[1]).join(" ");
  return hex + " " + litterales;
}

test("la regle plateforme est bien de 2 pages", () => {
  expect(PAGES_APERCU).toBe(2);
});

test("un e-book de 12 pages n'en laisse voir que 2", async () => {
  const doc = await PDFDocument.load(await construireApercuPdf(await pdfDeTest(12)));
  expect(doc.getPageCount()).toBe(PAGES_APERCU);
});

test("un PDF plus court que la limite n'est pas complete artificiellement", async () => {
  // copyPages jette si on lui demande une page inexistante : sans le
  // Math.min, un depliant d'une seule page renverrait 500 au lieu d'un apercu.
  const doc = await PDFDocument.load(await construireApercuPdf(await pdfDeTest(1)));
  expect(doc.getPageCount()).toBe(1);
});

test("chaque page de l'extrait porte le filigrane", async () => {
  const doc = await PDFDocument.load(await construireApercuPdf(await pdfDeTest(5)));
  expect(doc.getPageCount()).toBe(2);
  // Partie ASCII du filigrane : stable quel que soit l'encodage des accents.
  const marque = "novakou.com";
  expect(TEXTE_FILIGRANE).toContain(marque);
  for (let i = 0; i < doc.getPageCount(); i++) {
    expect(texteDessine(doc, i), `page ${i + 1}`).toContain(marque);
  }
});

test("un fichier qui n'est pas un PDF remonte une erreur identifiable", async () => {
  // La route la traduit en 422 « PDF illisible » plutot qu'en 500.
  await expect(construireApercuPdf(new TextEncoder().encode("ceci n'est pas un PDF")))
    .rejects.toThrow(PdfIllisibleError);
});
