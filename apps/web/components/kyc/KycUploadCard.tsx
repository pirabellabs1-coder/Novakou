"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";

interface KycRequest {
  id: string;
  level: number;
  documentType: string;
  status: "en_attente" | "approuve" | "refuse";
  reason: string;
  createdAt: string;
}

interface KycUploadCardProps {
  currentLevel: number;
  requests: KycRequest[];
  onRefresh: () => void;
}

const LEVELS = [
  {
    level: 1,
    title: "Email verifie",
    description: "Votre email a ete verifie lors de l'inscription.",
    icon: "email",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  {
    level: 2,
    title: "Telephone verifie",
    description: "Verifiez votre numero de telephone pour debloquer les offres et commandes.",
    icon: "phone_android",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  {
    level: 3,
    title: "Piece d'identite",
    description: "Soumettez une piece d'identite (CNI ou passeport) pour retirer des fonds et publier des services.",
    icon: "badge",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  {
    level: 4,
    title: "Verification professionnelle",
    description: "Soumettez un document professionnel (diplome, certificat, SIRET) pour obtenir le badge Elite.",
    icon: "workspace_premium",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
];

const DOC_TYPES_BY_LEVEL: Record<number, { value: string; label: string }[]> = {
  2: [{ value: "phone", label: "Verification par telephone" }],
  3: [
    { value: "cni", label: "Carte nationale d'identite" },
    { value: "passeport", label: "Passeport" },
  ],
  4: [
    { value: "diplome", label: "Diplome" },
    { value: "certificat", label: "Certificat professionnel" },
    { value: "siret", label: "Numero SIRET / registre commerce" },
  ],
};

export function KycUploadCard({ currentLevel, requests, onRefresh }: KycUploadCardProps) {
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);
  const [selectedDocType, setSelectedDocType] = useState("");
  const [phone, setPhone] = useState("");
  const [fileName, setFileName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFileName(acceptedFiles[0].name);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg"], "application/pdf": [".pdf"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  function getStatusForLevel(level: number): KycRequest | undefined {
    return requests.find((r) => r.level === level);
  }

  function isLevelCompleted(level: number): boolean {
    if (level === 1) return true;
    return currentLevel >= level;
  }

  function isPending(level: number): boolean {
    const req = getStatusForLevel(level);
    return req?.status === "en_attente";
  }

  function isRefused(level: number): boolean {
    const req = getStatusForLevel(level);
    return req?.status === "refuse";
  }

  async function handleSubmit(level: number) {
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const docType = level === 2 ? "phone" : selectedDocType;
      if (!docType) {
        setError("Selectionnez un type de document");
        setSubmitting(false);
        return;
      }

      if (level === 2 && !phone) {
        setError("Entrez votre numero de telephone");
        setSubmitting(false);
        return;
      }

      if (level >= 3 && !fileName) {
        setError("Veuillez charger un document");
        setSubmitting(false);
        return;
      }

      const res = await fetch("/api/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level,
          documentType: docType,
          documentUrl: level === 2 ? phone : `/uploads/kyc/${fileName}`,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erreur lors de la soumission");
        setSubmitting(false);
        return;
      }

      setSuccess("Demande soumise avec succes !");
      setExpandedLevel(null);
      setSelectedDocType("");
      setPhone("");
      setFileName("");
      onRefresh();
    } catch {
      setError("Erreur reseau");
    } finally {
      setSubmitting(false);
    }
  }

  const progressPercent = (currentLevel / 4) * 100;

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="bg-neutral-dark rounded-2xl border border-border-dark p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-white">Niveau de verification</h3>
          <span className="text-sm font-semibold text-primary">Niveau {currentLevel}/4</span>
        </div>
        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-2">
          {currentLevel === 4
            ? "Verification complete — vous avez le badge Elite !"
            : `Completez le niveau ${currentLevel + 1} pour debloquer plus de fonctionnalites.`}
        </p>
      </div>

      {/* Feedback */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-sm text-emerald-400">
          {success}
        </div>
      )}

      {/* Level cards */}
      <div className="space-y-4">
        {LEVELS.map((lvl) => {
          const completed = isLevelCompleted(lvl.level);
          const pending = isPending(lvl.level);
          const refused = isRefused(lvl.level);
          const refusedReq = refused ? getStatusForLevel(lvl.level) : null;
          const isExpanded = expandedLevel === lvl.level;
          const canAction = !completed && !pending && lvl.level <= currentLevel + 1;

          return (
            <div
              key={lvl.level}
              className={`bg-neutral-dark rounded-2xl border ${
                completed
                  ? "border-emerald-500/30"
                  : pending
                    ? "border-amber-500/30"
                    : refused
                      ? "border-red-500/30"
                      : "border-border-dark"
              } p-6`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${lvl.bg} flex items-center justify-center flex-shrink-0`}>
                  {completed ? (
                    <span className="material-symbols-outlined text-2xl text-emerald-400">check_circle</span>
                  ) : (
                    <span className={`material-symbols-outlined text-2xl ${lvl.color}`}>{lvl.icon}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-white">Niveau {lvl.level} — {lvl.title}</h4>
                    {completed && (
                      <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        Valide
                      </span>
                    )}
                    {pending && (
                      <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                        En attente
                      </span>
                    )}
                    {refused && (
                      <span className="text-xs font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                        Refuse
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400">{lvl.description}</p>
                  {refusedReq?.reason && (
                    <p className="text-sm text-red-400 mt-1">Motif : {refusedReq.reason}</p>
                  )}
                </div>
                {canAction && (
                  <button
                    onClick={() => setExpandedLevel(isExpanded ? null : lvl.level)}
                    className="flex-shrink-0 px-4 py-2 bg-primary/10 text-primary text-sm font-semibold rounded-xl hover:bg-primary/20 transition-colors"
                  >
                    {isExpanded ? "Annuler" : refused ? "Reessayer" : "Verifier"}
                  </button>
                )}
              </div>

              {/* Expanded form */}
              {isExpanded && canAction && (
                <div className="mt-6 pt-6 border-t border-border-dark space-y-4">
                  {lvl.level === 2 ? (
                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">
                        Numero de telephone
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+225 07 00 00 00 00"
                        className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Un code OTP sera envoye pour verification.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-white mb-2">
                          Type de document
                        </label>
                        <select
                          value={selectedDocType}
                          onChange={(e) => setSelectedDocType(e.target.value)}
                          className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                        >
                          <option value="">-- Selectionnez --</option>
                          {DOC_TYPES_BY_LEVEL[lvl.level]?.map((dt) => (
                            <option key={dt.value} value={dt.value}>
                              {dt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-white mb-2">
                          Document
                        </label>
                        <div
                          {...getRootProps()}
                          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                            isDragActive
                              ? "border-primary bg-primary/5"
                              : "border-border-dark hover:border-primary/50"
                          }`}
                        >
                          <input {...getInputProps()} />
                          <span className="material-symbols-outlined text-3xl text-slate-500 mb-2 block">
                            cloud_upload
                          </span>
                          {fileName ? (
                            <p className="text-sm text-emerald-400">{fileName}</p>
                          ) : (
                            <p className="text-sm text-slate-400">
                              Glissez un fichier ici ou cliquez pour selectionner
                            </p>
                          )}
                          <p className="text-xs text-slate-500 mt-1">
                            PNG, JPG ou PDF — 10 Mo max
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  <button
                    onClick={() => handleSubmit(lvl.level)}
                    disabled={submitting}
                    className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {submitting ? "Envoi en cours..." : "Soumettre la demande"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
