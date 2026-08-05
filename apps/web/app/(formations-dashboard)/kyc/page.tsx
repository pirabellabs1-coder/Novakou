"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastStore } from "@/store/toast";
import {
  BadgeCheck,
  Clock,
  AlertTriangle,
  Award,
  Medal,
  Check,
  CheckCircle2,
  Trash2,
  Loader2,
  UploadCloud,
  Images,
  Camera,
  Send,
} from "lucide-react";

type KycData = {
  currentLevel: number;
  pending: null | {
    id: string;
    documentType: string;
    documentUrl: string;
    status: string;
    createdAt: string;
  };
  history: Array<{
    id: string;
    requestedLevel: number;
    currentLevel: number;
    documentType: string;
    documentUrl: string | null;
    status: "EN_ATTENTE" | "APPROUVE" | "REFUSE";
    reviewedAt: string | null;
    refuseReason: string | null;
    createdAt: string;
  }>;
};

const DOC_LABELS: Record<string, string> = {
  // Pièces d'identité (Afrique francophone)
  CNI: "Carte Nationale d'Identité",
  CIP: "CIP (Bénin)",
  PASSEPORT: "Passeport",
  PERMIS_CONDUIRE: "Permis de conduire",
  CARTE_CONSULAIRE: "Carte consulaire",
  RECEPISSE: "Récépissé d'identité",
  CARTE_ELECTEUR: "Carte d'électeur",
  CARTE_RESIDENT: "Carte de résident",
  // Certification pro
  DIPLOME: "Diplôme",
  CERTIFICAT_PRO: "Certificat professionnel",
  ATTESTATION_EMPLOYEUR: "Attestation employeur",
  PORTFOLIO_PRO: "Portfolio professionnel",
};

const DOC_BY_LEVEL: Record<2 | 4, string[]> = {
  2: ["CNI", "CIP", "PASSEPORT", "PERMIS_CONDUIRE", "CARTE_CONSULAIRE", "RECEPISSE", "CARTE_ELECTEUR", "CARTE_RESIDENT"],
  4: ["DIPLOME", "CERTIFICAT_PRO", "ATTESTATION_EMPLOYEUR", "PORTFOLIO_PRO"],
};

/**
 * Un emplacement de dépôt : zone de glisser-déposer, bouton galerie et bouton
 * appareil photo. Extrait pour être posé TROIS fois — recto, verso, visage —
 * au lieu d'être dupliqué, ce qui ferait diverger les trois au premier
 * correctif.
 */
function DepotPiece({
  titre,
  consigne,
  url,
  apercu,
  nomFichier,
  televersement,
  onFichier,
  onVider,
  camera = "environment",
}: {
  titre: string;
  consigne: string;
  url: string;
  apercu: string;
  nomFichier: string | null;
  televersement: boolean;
  onFichier: (f: File) => void;
  onVider: () => void;
  /** « user » ouvre la caméra FRONTALE — indispensable pour la photo du visage. */
  camera?: "user" | "environment";
}) {
  const refFichier = useRef<HTMLInputElement>(null);
  const refCamera = useRef<HTMLInputElement>(null);

  return (
    <div>
      <label className="text-[11px] font-bold uppercase text-[#5c647a] block mb-1">
        {titre} <span className="text-red-600">*</span>
      </label>
      <p className="text-[11.5px] text-[#5c647a] mb-2 leading-relaxed">{consigne}</p>

      {url ? (
        <div className="flex items-center justify-between gap-3 p-4 rounded-xl border border-[#006e2f]/20 bg-[#006e2f]/5">
          <div className="flex items-center gap-3 min-w-0">
            <CheckCircle2 className="w-6 h-6 text-[#006e2f] flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#191c1e] truncate">{nomFichier ?? "Fichier envoyé"}</p>
              <a href={apercu || url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#006e2f] hover:underline">
                Voir
              </a>
            </div>
          </div>
          <button
            type="button"
            onClick={onVider}
            className="p-2 rounded-lg hover:bg-red-50 text-[#5c647a] hover:text-red-600 flex-shrink-0"
            title="Supprimer"
          >
            <Trash2 className="w-[18px] h-[18px]" />
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div
            onClick={() => refFichier.current?.click()}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files[0];
              if (f) onFichier(f);
            }}
            className={`rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
              televersement ? "border-amber-300 bg-amber-50/40" : "border-gray-200 hover:border-[#006e2f]/40 hover:bg-[#006e2f]/5"
            }`}
          >
            {televersement ? (
              <>
                <Loader2 className="w-7 h-7 text-amber-500 animate-spin mx-auto" />
                <p className="text-sm text-[#5c647a] mt-2">Envoi en cours…</p>
              </>
            ) : (
              <>
                <UploadCloud className="w-8 h-8 text-[#006e2f] mx-auto" />
                <p className="text-sm font-semibold text-[#191c1e] mt-2">Choisir un fichier</p>
                <p className="text-[11px] text-[#5c647a] mt-1">JPG, PNG, WEBP ou PDF — 25 MB max</p>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 md:hidden">
            <button
              type="button"
              onClick={() => refFichier.current?.click()}
              disabled={televersement}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-[#191c1e] hover:bg-gray-50 disabled:opacity-50"
            >
              <Images className="w-[18px] h-[18px]" />
              Galerie
            </button>
            <button
              type="button"
              onClick={() => refCamera.current?.click()}
              disabled={televersement}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-[#191c1e] hover:bg-gray-50 disabled:opacity-50"
            >
              <Camera className="w-[18px] h-[18px]" />
              Photo
            </button>
          </div>

          <input
            ref={refFichier}
            type="file"
            accept="application/pdf,image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFichier(f); }}
          />
          <input
            ref={refCamera}
            type="file"
            accept="image/*"
            capture={camera}
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFichier(f); }}
          />
        </div>
      )}
    </div>
  );
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default function KycPage() {
  const qc = useQueryClient();
  const [targetLevel, setTargetLevel] = useState<2 | 4>(2);
  const [documentType, setDocumentType] = useState("CNI");
  const [documentUrl, setDocumentUrl] = useState("");
  const [versoUrl, setVersoUrl] = useState("");
  const [versoPreviewUrl, setVersoPreviewUrl] = useState("");
  const [versoFileName, setVersoFileName] = useState<string | null>(null);
  const [selfieUrl, setSelfieUrl] = useState("");
  const [selfiePreviewUrl, setSelfiePreviewUrl] = useState("");
  const [selfieFileName, setSelfieFileName] = useState<string | null>(null);
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  /** Quelle des trois pièces on est en train d'envoyer. */
  type Piece = "recto" | "verso" | "selfie";

  async function handleFileUpload(file: File, piece: Piece = "recto") {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      useToastStore.getState().addToast("error", "Fichier trop volumineux (25 MB max)");
      return;
    }
    const validExt = ["pdf", "png", "jpg", "jpeg", "webp"];
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!validExt.includes(ext)) {
      useToastStore.getState().addToast("error", "Format non autorisé. Utilisez PDF, PNG, JPG ou WEBP");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("bucket", "kyc-documents");
      const res = await fetch("/api/upload/file", { method: "POST", body: form });
      const json = await res.json();
      if (json.success && json.file?.url) {
        const chemin = json.file.path ?? json.file.url;
        if (piece === "recto") {
          setDocumentUrl(chemin); setDocumentPreviewUrl(json.file.url); setUploadedFileName(file.name);
        } else if (piece === "verso") {
          setVersoUrl(chemin); setVersoPreviewUrl(json.file.url); setVersoFileName(file.name);
        } else {
          setSelfieUrl(chemin); setSelfiePreviewUrl(json.file.url); setSelfieFileName(file.name);
        }
        useToastStore.getState().addToast("success", "Fichier envoyé");
      } else {
        useToastStore.getState().addToast("error", json.error ?? "Échec de l'upload");
      }
    } catch (e) {
      useToastStore.getState().addToast("error", e instanceof Error ? e.message : "Erreur upload");
    } finally {
      setUploading(false);
    }
  }

  const { data: response, isLoading } = useQuery<{ data: KycData }>({
    queryKey: ["kyc-status"],
    queryFn: () => fetch("/api/formations/kyc").then((r) => r.json()),
    staleTime: 30_000,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/formations/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType,
          documentUrl: documentUrl.trim(),
          documentVersoUrl: versoUrl.trim(),
          selfieUrl: selfieUrl.trim(),
          requestedLevel: targetLevel,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Erreur");
      return res.json();
    },
    onSuccess: () => {
      useToastStore.getState().addToast("success", "Demande KYC envoyée — en attente de validation admin");
      qc.invalidateQueries({ queryKey: ["kyc-status"] });
      setDocumentUrl("");
      setDocumentPreviewUrl("");
    },
    onError: (e) => useToastStore.getState().addToast("error", e instanceof Error ? e.message : "Erreur"),
  });

  const data = response?.data;
  const level = data?.currentLevel ?? 0;
  const isIdentityVerified = level >= 2;
  const isProCertified = level >= 4;
  const hasPending = !!data?.pending;
  const canRequestPro = isIdentityVerified && !isProCertified;

  return (
    <div className="p-5 md:p-8 max-w-4xl mx-auto" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">Vérification KYC</h1>
        <p className="text-sm text-[#5c647a] mt-1">
          La vérification d&apos;identité est obligatoire pour retirer vos gains (vendeur ou mentor).
        </p>
      </header>

      {/* Status banners — Identity + Pro separately */}
      {isLoading ? (
        <div className="h-28 bg-white rounded-2xl border border-gray-100 animate-pulse mb-6" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Identity */}
          <div className={`rounded-2xl p-5 border ${isIdentityVerified ? "border-[#006e2f]/20 bg-[#006e2f]/5" : hasPending ? "border-amber-200 bg-amber-50" : "border-red-200 bg-red-50"}`}>
            <div className="flex items-start gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${isIdentityVerified ? "bg-[#006e2f]" : hasPending ? "bg-amber-500" : "bg-red-500"}`}>
                {isIdentityVerified ? (
                  <BadgeCheck className="w-6 h-6 text-white" />
                ) : hasPending ? (
                  <Clock className="w-6 h-6 text-white" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#5c647a]">Étape 1 · Identité</p>
                <h3 className="text-sm font-bold text-[#191c1e] mt-1 inline-flex items-center gap-1">
                  {isIdentityVerified ? <>Identité vérifiée <Check className="w-4 h-4 text-[#006e2f]" strokeWidth={3} /></> : hasPending ? "Demande en cours" : "Vérification requise"}
                </h3>
                <p className="text-xs text-[#5c647a] mt-1">
                  {isIdentityVerified
                    ? "Retraits de vos gains autorisés."
                    : hasPending
                    ? "Examen sous 24-48h."
                    : "Soumettez une pièce d'identité."}
                </p>
              </div>
            </div>
          </div>

          {/* Pro certification */}
          <div className={`rounded-2xl p-5 border ${isProCertified ? "border-blue-200 bg-blue-50" : canRequestPro ? "border-gray-200 bg-gray-50" : "border-gray-100 bg-white opacity-60"}`}>
            <div className="flex items-start gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${isProCertified ? "bg-blue-500" : canRequestPro ? "bg-[#5c647a]" : "bg-gray-300"}`}>
                {isProCertified ? (
                  <Award className="w-6 h-6 text-white" />
                ) : (
                  <Medal className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#5c647a]">Étape 2 · Pro</p>
                <h3 className="text-sm font-bold text-[#191c1e] mt-1 inline-flex items-center gap-1">
                  {isProCertified ? <>Certifié pro <Check className="w-4 h-4 text-blue-600" strokeWidth={3} /></> : canRequestPro ? "Certification optionnelle" : "Verrouillé"}
                </h3>
                <p className="text-xs text-[#5c647a] mt-1">
                  {isProCertified
                    ? "Badge Elite affiché sur votre profil public."
                    : canRequestPro
                    ? "Ajoutez un diplôme ou certificat pro pour un badge Elite."
                    : "Validez d'abord votre identité."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit form — hide if pending */}
      {!hasPending && (!isIdentityVerified || canRequestPro) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {/* Level selector — only if both options available */}
          {isIdentityVerified && canRequestPro && (
            <div className="mb-5">
              <label className="text-[11px] font-bold uppercase text-[#5c647a] block mb-2">Type de vérification</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled
                  className="p-3 rounded-xl border border-[#006e2f]/20 bg-[#006e2f]/5 text-[#006e2f] text-sm font-semibold relative"
                >
                  Identité
                  <Check className="absolute top-1.5 right-2 w-3.5 h-3.5" strokeWidth={3} />
                </button>
                <button
                  type="button"
                  onClick={() => { setTargetLevel(4); setDocumentType("DIPLOME"); }}
                  className={`p-3 rounded-xl border text-sm font-semibold transition-all ${
                    targetLevel === 4
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-[#5c647a] hover:border-blue-300"
                  }`}
                >
                  Certification pro
                </button>
              </div>
            </div>
          )}

          <h2 className="text-lg font-bold text-[#191c1e] mb-2">
            {targetLevel === 4 ? "Soumettre votre certificat professionnel" : "Soumettre votre pièce d'identité"}
          </h2>
          <p className="text-sm text-[#5c647a] mb-6">
            {targetLevel === 4
              ? "Diplôme, certification, attestation d'employeur ou portfolio pro — un seul document suffit."
              : "Uploadez un scan clair et lisible de votre document. Les deux faces sont nécessaires pour les cartes (CNI, permis)."}
          </p>

          <div className="space-y-5">
            <div>
              <label className="text-[11px] font-bold uppercase text-[#5c647a] block mb-2">Type de document</label>
              <div className={`grid ${targetLevel === 4 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-3"} gap-2`}>
                {DOC_BY_LEVEL[targetLevel].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setDocumentType(t)}
                    className={`p-3 rounded-xl border text-sm font-semibold transition-all ${
                      documentType === t
                        ? targetLevel === 4 ? "border-blue-500 bg-blue-50 text-blue-700" : "border-[#006e2f] bg-[#006e2f]/5 text-[#006e2f]"
                        : "border-gray-200 text-[#5c647a] hover:border-[#006e2f]/30"
                    }`}
                  >
                    {DOC_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            {/* ── CONSIGNES ────────────────────────────────────────────
                Elles ne sont pas décoratives : une pièce illisible ou une
                photo trop sombre obligent à refuser le dossier, et la
                personne recommence sans savoir pourquoi. Autant le dire
                avant. */}
            <div className="rounded-xl border p-4" style={{ borderColor: "#cfe3f5", background: "#f1f8fe" }}>
              <p className="text-[12px] font-extrabold mb-2" style={{ color: "#0c447c" }}>
                Pour que votre dossier soit accepté du premier coup
              </p>
              <ul className="text-[12px] leading-relaxed space-y-1" style={{ color: "#0c447c" }}>
                <li>• Photographiez en <strong>pleine lumière</strong>, de préférence à la lumière du jour.</li>
                <li>• Évitez les <strong>reflets et les ombres</strong> : ne mettez pas le flash directement sur la pièce.</li>
                <li>• La pièce doit être <strong>entière dans le cadre</strong>, à plat, sans doigt qui masque une information.</li>
                <li>• <strong>Chaque caractère doit être lisible</strong> : nom, date de naissance, numéro, dates de validité.</li>
                <li>• Sur la photo de visage : <strong>tête nue, sans lunettes de soleil</strong>, visage bien éclairé et de face.</li>
              </ul>
              <p className="text-[11.5px] mt-2.5 font-semibold" style={{ color: "#0c447c" }}>
                Les trois pièces sont obligatoires. Un dossier incomplet ou illisible est refusé.
              </p>
            </div>

            <DepotPiece
              titre="Recto de votre pièce"
              consigne="La face qui porte votre photo et votre nom."
              url={documentUrl}
              apercu={documentPreviewUrl}
              nomFichier={uploadedFileName}
              televersement={uploading}
              onFichier={(f) => handleFileUpload(f, "recto")}
              onVider={() => { setDocumentUrl(""); setDocumentPreviewUrl(""); setUploadedFileName(null); }}
            />

            <DepotPiece
              titre="Verso de votre pièce"
              consigne="Le dos porte souvent le numéro et les dates de validité — il est indispensable."
              url={versoUrl}
              apercu={versoPreviewUrl}
              nomFichier={versoFileName}
              televersement={uploading}
              onFichier={(f) => handleFileUpload(f, "verso")}
              onVider={() => { setVersoUrl(""); setVersoPreviewUrl(""); setVersoFileName(null); }}
            />

            <DepotPiece
              titre="Photo de votre visage"
              consigne="Une photo de vous, de face, prise à l'instant. C'est elle qui relie la pièce à son porteur."
              url={selfieUrl}
              apercu={selfiePreviewUrl}
              nomFichier={selfieFileName}
              televersement={uploading}
              camera="user"
              onFichier={(f) => handleFileUpload(f, "selfie")}
              onVider={() => { setSelfieUrl(""); setSelfiePreviewUrl(""); setSelfieFileName(null); }}
            />

            <p className="text-[11px] text-[#5c647a]">
              Vos pièces sont stockées dans un espace privé, accessible uniquement par
              l&apos;équipe de vérification.
            </p>

            <button
              onClick={() => submitMutation.mutate()}
              // Les TROIS pièces sont exigées. Le serveur refuse aussi de son
              // côté : ce bouton évite un aller-retour, il ne fait pas la loi.
              disabled={
                !documentUrl.trim() || !versoUrl.trim() || !selfieUrl.trim() || submitMutation.isPending
              }
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
              style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
            >
              <Send className="w-[18px] h-[18px]" />
              {submitMutation.isPending ? "Envoi…" : "Soumettre pour vérification"}
            </button>
          </div>
        </div>
      )}

      {/* History */}
      {data && data.history.length > 0 && (
        <div className="mt-8">
          <h2 className="text-base font-bold text-[#191c1e] mb-4">Historique des demandes</h2>
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100">
            {data.history.map((h) => {
              const cls = h.status === "APPROUVE" ? "bg-[#006e2f]/10 text-[#006e2f]" : h.status === "REFUSE" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700";
              const label = h.status === "APPROUVE" ? "Validée" : h.status === "REFUSE" ? "Refusée" : "En attente";
              return (
                <div key={h.id} className="p-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[#191c1e]">{DOC_LABELS[h.documentType] ?? h.documentType}</p>
                    <p className="text-[11px] text-[#5c647a] mt-0.5">
                      Soumis le {formatDate(h.createdAt)}
                      {h.reviewedAt && ` · Traité le ${formatDate(h.reviewedAt)}`}
                    </p>
                    {h.refuseReason && (
                      <p className="text-[11px] text-red-600 mt-1">Motif : {h.refuseReason}</p>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${cls}`}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
