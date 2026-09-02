"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, FileWarning } from "lucide-react";
import { PAGES_APERCU } from "@/lib/formations/apercu";

// ─────────────────────────────────────────────────────────────────────────────
// Rendu de l'aperçu e-book.
//
// Pourquoi on ne se contente PAS d'une <iframe src="....pdf"> : intégrer un PDF
// dans une iframe dépend entièrement du lecteur PDF interne du navigateur.
// Constaté en production : Opera bloque le cadre (« novakou.com est bloqué »),
// Safari iOS n'affiche que la première page sans défilement, et un Chromium
// sans plugin PDF rend un cadre blanc. L'acheteur voyait donc un aperçu vide —
// et n'achetait pas.
//
// On dessine donc les pages nous-mêmes sur des <canvas> avec pdf.js. Le rendu
// est identique partout, et le contenu devient une image : ni texte
// sélectionnable, ni bouton « Enregistrer » du lecteur PDF. Le filigrane, lui,
// est déjà incrusté par la route serveur — il fait partie de l'image.
// ─────────────────────────────────────────────────────────────────────────────

// Largeur de rendu maximale. Au-delà, le canvas coûte cher en mémoire sur les
// téléphones d'entrée de gamme (le marché principal de Novakou) sans rien
// apporter visuellement.
const LARGEUR_RENDU_MAX = 1000;

type Etat = "chargement" | "pret" | "erreur";

export function ApercuPdf({ produitId, titre }: { produitId: string; titre: string }) {
  const conteneurRef = useRef<HTMLDivElement>(null);
  const [etat, setEtat] = useState<Etat>("chargement");
  const [pagesRendues, setPagesRendues] = useState(0);

  useEffect(() => {
    let annule = false;
    const conteneur = conteneurRef.current;
    if (!conteneur) return;

    (async () => {
      try {
        // Import dynamique : les ~400 Ko de pdf.js ne partent sur le réseau que
        // si l'acheteur ouvre vraiment l'onglet Aperçu. Build « legacy » car le
        // build moderne suppose des API absentes des Chrome/Safari anciens,
        // encore très répandus sur le marché africain.
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();

        const doc = await pdfjs.getDocument({
          url: `/api/produits/${produitId}/preview`,
          // Le PDF vient d'un vendeur, donc d'une source non maîtrisée : on
          // coupe eval() et les formulaires XFA. Un PDF piégé ne doit jamais
          // pouvoir exécuter quoi que ce soit chez l'acheteur.
          isEvalSupported: false,
          enableXfa: false,
          // Une seule requête, jamais de lecture par tranches : chaque appel à
          // /preview refait tout le découpage pdf-lib côté serveur et compte une
          // vue de plus. Le fichier ne fait que quelques centaines de Ko.
          disableRange: true,
          disableStream: true,
        }).promise;
        if (annule) return;

        const total = Math.min(doc.numPages, PAGES_APERCU);
        if (total === 0) {
          setEtat("erreur");
          return;
        }

        // Largeur mesurée UNE fois, avant la boucle : le conteneur est vide au
        // premier tour et peut se lire à 0, ce qui donnerait deux pages rendues
        // à des échelles différentes — l'une nette, l'autre floue.
        const largeurCible = Math.min(
          (conteneur.clientWidth || 700) * Math.min(window.devicePixelRatio || 1, 2),
          LARGEUR_RENDU_MAX,
        );

        for (let n = 1; n <= total; n++) {
          const page = await doc.getPage(n);
          if (annule) return;

          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: largeurCible / base.width });

          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.className =
            "w-full h-auto block rounded-xl border border-gray-200 shadow-sm select-none";
          canvas.setAttribute("role", "img");
          canvas.setAttribute("aria-label", `${titre} — page ${n} sur ${total}`);
          canvas.oncontextmenu = (e) => e.preventDefault();

          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("canvas 2d indisponible");

          await page.render({ canvasContext: ctx, viewport }).promise;
          if (annule) return;

          conteneur.appendChild(canvas);
          setPagesRendues(n);
          setEtat("pret");
        }
      } catch (err) {
        if (!annule) {
          console.error("[ApercuPdf]", err);
          setEtat("erreur");
        }
      }
    })();

    return () => {
      annule = true;
      // React monte deux fois l'effet en dev : sans ce nettoyage, les pages
      // s'empilent en double dans le conteneur.
      if (conteneur) conteneur.innerHTML = "";
    };
  }, [produitId, titre]);

  return (
    <div>
      <div ref={conteneurRef} className="space-y-4" onContextMenu={(e) => e.preventDefault()} />

      {etat === "chargement" && (
        <div className="flex flex-col items-center justify-center gap-2 py-14 text-[#5c647a]">
          <Loader2 size={24} className="animate-spin text-[#006e2f]" />
          <p className="text-xs font-semibold">Chargement de l&apos;aperçu…</p>
        </div>
      )}

      {etat === "erreur" && (
        <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 text-center">
          <FileWarning size={28} className="text-amber-500" />
          <p className="text-sm font-bold text-[#191c1e]">Aperçu momentanément indisponible</p>
          <p className="text-xs text-[#5c647a] max-w-sm">
            Le fichier de ce produit n&apos;a pas pu être affiché. Cela n&apos;affecte en rien le
            téléchargement après achat.
          </p>
        </div>
      )}

      {etat === "pret" && pagesRendues > 0 && (
        <p className="text-[11px] text-[#5c647a] text-center mt-4">
          Fin de l&apos;aperçu — {pagesRendues} page{pagesRendues > 1 ? "s" : ""} sur l&apos;ouvrage
          complet. Achetez le produit pour tout lire, sans filigrane.
        </p>
      )}
    </div>
  );
}
