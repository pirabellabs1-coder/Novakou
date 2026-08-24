"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  RefreshCw,
  CheckCircle2,
  Trash2,
  Loader2,
  VideoOff,
  Check,
} from "lucide-react";

/**
 * Prise de selfie EN DIRECT pour le KYC.
 *
 * Contrairement à un simple « choisir un fichier », la photo du visage doit
 * être prise à l'instant : c'est elle qui prouve que la personne qui dépose la
 * pièce est bien son porteur. Un import de galerie permettrait de réutiliser
 * une photo trouvée — précisément la fraude que ce contrôle doit empêcher.
 *
 * On ouvre donc la caméra frontale (`facingMode: "user"`), on laisse cadrer,
 * puis on capture une image figée que la personne valide avant l'envoi.
 *
 * L'aperçu vidéo est affiché en miroir (confort, comme une glace) mais l'image
 * capturée est enregistrée dans le bon sens : l'admin doit pouvoir lire sans
 * effort un éventuel document tenu à côté du visage.
 */
export function CaptureSelfie({
  titre,
  consigne,
  url,
  apercu,
  nomFichier,
  televersement,
  onFichier,
  onVider,
}: {
  titre: string;
  consigne: string;
  url: string;
  apercu: string;
  nomFichier: string | null;
  televersement: boolean;
  onFichier: (f: File) => void;
  onVider: () => void;
}) {
  type Phase = "repos" | "demarrage" | "flux" | "capturee" | "erreur";
  const [phase, setPhase] = useState<Phase>("repos");
  const [messageErreur, setMessageErreur] = useState("");
  const [apercuCapture, setApercuCapture] = useState("");

  const refVideo = useRef<HTMLVideoElement>(null);
  const refCanvas = useRef<HTMLCanvasElement>(null);
  const refFlux = useRef<MediaStream | null>(null);
  const refFichierSecours = useRef<HTMLInputElement>(null);
  const fichierCapture = useRef<File | null>(null);

  /** Coupe la caméra et libère le voyant : ne jamais laisser le flux ouvert. */
  const couperCamera = useCallback(() => {
    if (refFlux.current) {
      refFlux.current.getTracks().forEach((t) => t.stop());
      refFlux.current = null;
    }
  }, []);

  // Filet de sécurité : si le composant disparaît (changement de page,
  // dossier envoyé…), la caméra doit s'éteindre malgré tout.
  useEffect(() => couperCamera, [couperCamera]);

  // Rattache le flux à la balise <video> dès qu'elle est montée. La liaison
  // directe dans `ouvrirCamera` peut arriver avant le rendu de la vidéo :
  // sans ce filet, l'aperçu resterait noir alors que la caméra tourne.
  useEffect(() => {
    if (phase === "flux" && refVideo.current && refFlux.current && !refVideo.current.srcObject) {
      refVideo.current.srcObject = refFlux.current;
      refVideo.current.play().catch(() => {});
    }
  }, [phase]);

  const ouvrirCamera = useCallback(async () => {
    setMessageErreur("");
    setPhase("demarrage");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("indisponible");
      }
      const flux = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      refFlux.current = flux;
      if (refVideo.current) {
        refVideo.current.srcObject = flux;
        await refVideo.current.play().catch(() => {});
      }
      setPhase("flux");
    } catch (e) {
      couperCamera();
      const err = e as { name?: string; message?: string };
      // Distinguer « refusé » de « pas de caméra » : la personne doit savoir
      // s'il faut autoriser le navigateur ou changer d'appareil.
      if (err?.name === "NotAllowedError" || err?.name === "SecurityError") {
        setMessageErreur(
          "Accès à la caméra refusé. Autorisez la caméra dans votre navigateur, puis réessayez."
        );
      } else if (err?.name === "NotFoundError" || err?.message === "indisponible") {
        setMessageErreur(
          "Aucune caméra détectée sur cet appareil. Utilisez un téléphone, ou importez une photo de vous prise à l'instant."
        );
      } else {
        setMessageErreur("Impossible d'ouvrir la caméra. Réessayez.");
      }
      setPhase("erreur");
    }
  }, [couperCamera]);

  /** Fige l'image courante de la vidéo dans un fichier JPEG. */
  const prendrePhoto = useCallback(() => {
    const video = refVideo.current;
    const canvas = refCanvas.current;
    if (!video || !canvas) return;

    const l = video.videoWidth;
    const h = video.videoHeight;
    if (!l || !h) return;

    canvas.width = l;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // On dessine SANS miroir : la photo enregistrée est dans le bon sens,
    // même si l'aperçu à l'écran est retourné pour le confort.
    ctx.drawImage(video, 0, 0, l, h);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const fichier = new File([blob], "selfie.jpg", { type: "image/jpeg" });
        fichierCapture.current = fichier;
        setApercuCapture(canvas.toDataURL("image/jpeg", 0.92));
        couperCamera();
        setPhase("capturee");
      },
      "image/jpeg",
      0.92
    );
  }, [couperCamera]);

  const reprendre = useCallback(() => {
    fichierCapture.current = null;
    setApercuCapture("");
    ouvrirCamera();
  }, [ouvrirCamera]);

  const valider = useCallback(() => {
    if (fichierCapture.current) onFichier(fichierCapture.current);
  }, [onFichier]);

  // ── État « pièce déjà envoyée » — identique aux deux autres pièces ────────
  if (url) {
    return (
      <div>
        <label className="text-[11px] font-bold uppercase text-[#5c647a] block mb-1">
          {titre} <span className="text-red-600">*</span>
        </label>
        <p className="text-[11.5px] text-[#5c647a] mb-2 leading-relaxed">{consigne}</p>
        <div className="flex items-center justify-between gap-3 p-4 rounded-xl border border-[#006e2f]/20 bg-[#006e2f]/5">
          <div className="flex items-center gap-3 min-w-0">
            <CheckCircle2 className="w-6 h-6 text-[#006e2f] flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#191c1e] truncate">
                {nomFichier ?? "Selfie enregistré"}
              </p>
              <a
                href={apercu || url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-[#006e2f] hover:underline"
              >
                Voir
              </a>
            </div>
          </div>
          <button
            type="button"
            onClick={onVider}
            className="p-2 rounded-lg hover:bg-red-50 text-[#5c647a] hover:text-red-600 flex-shrink-0"
            title="Reprendre le selfie"
          >
            <Trash2 className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="text-[11px] font-bold uppercase text-[#5c647a] block mb-1">
        {titre} <span className="text-red-600">*</span>
      </label>
      <p className="text-[11.5px] text-[#5c647a] mb-2 leading-relaxed">{consigne}</p>

      {/* Repos : invite à démarrer la caméra */}
      {phase === "repos" && (
        <button
          type="button"
          onClick={ouvrirCamera}
          className="w-full rounded-xl border-2 border-dashed border-gray-200 hover:border-[#006e2f]/40 hover:bg-[#006e2f]/5 p-6 text-center transition-colors"
        >
          <Camera className="w-8 h-8 text-[#006e2f] mx-auto" />
          <p className="text-sm font-semibold text-[#191c1e] mt-2">Prendre un selfie</p>
          <p className="text-[11px] text-[#5c647a] mt-1">
            Votre caméra s&apos;ouvrira pour une photo prise à l&apos;instant
          </p>
        </button>
      )}

      {/* Démarrage / flux vidéo en direct */}
      {(phase === "demarrage" || phase === "flux") && (
        <div className="space-y-2">
          <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3] flex items-center justify-center">
            <video
              ref={refVideo}
              autoPlay
              playsInline
              muted
              // Miroir à l'affichage uniquement : plus naturel pour se cadrer.
              className="w-full h-full object-cover -scale-x-100"
            />
            {phase === "demarrage" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60">
                <Loader2 className="w-7 h-7 text-white animate-spin" />
                <p className="text-xs text-white">Ouverture de la caméra…</p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={prendrePhoto}
            disabled={phase !== "flux"}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
            style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
          >
            <Camera className="w-[18px] h-[18px]" />
            Prendre la photo
          </button>
        </div>
      )}

      {/* Photo figée : valider ou reprendre */}
      {phase === "capturee" && (
        <div className="space-y-2">
          <div className="rounded-xl overflow-hidden bg-black aspect-[4/3]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={apercuCapture} alt="Aperçu du selfie" className="w-full h-full object-cover" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={reprendre}
              disabled={televersement}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-[#191c1e] hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className="w-[18px] h-[18px]" />
              Reprendre
            </button>
            <button
              type="button"
              onClick={valider}
              disabled={televersement}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
              style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
            >
              {televersement ? (
                <>
                  <Loader2 className="w-[18px] h-[18px] animate-spin" />
                  Envoi…
                </>
              ) : (
                <>
                  <Check className="w-[18px] h-[18px]" />
                  Valider cette photo
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Erreur : message clair + secours */}
      {phase === "erreur" && (
        <div className="space-y-2">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
            <VideoOff className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-[12px] text-red-700 leading-relaxed">{messageErreur}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={ouvrirCamera}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-[#191c1e] hover:bg-gray-50"
            >
              <RefreshCw className="w-[18px] h-[18px]" />
              Réessayer
            </button>
            <button
              type="button"
              onClick={() => refFichierSecours.current?.click()}
              disabled={televersement}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-[#191c1e] hover:bg-gray-50 disabled:opacity-50"
            >
              <Camera className="w-[18px] h-[18px]" />
              Importer
            </button>
          </div>
          {/* Secours seulement si la caméra est hors service : `capture="user"`
              privilégie quand même l'appareil photo frontal sur mobile. */}
          <input
            ref={refFichierSecours}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFichier(f);
            }}
          />
        </div>
      )}

      {/* Canvas de capture — jamais affiché, sert uniquement à figer l'image. */}
      <canvas ref={refCanvas} className="hidden" />
    </div>
  );
}
