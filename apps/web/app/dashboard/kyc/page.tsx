"use client";

import { useState, useEffect, useCallback } from "react";
import { KycUploadCard } from "@/components/kyc/KycUploadCard";

interface KycRequest {
  id: string;
  level: number;
  documentType: string;
  status: "en_attente" | "approuve" | "refuse";
  reason: string;
  createdAt: string;
}

interface PersonalInfo {
  firstName: string;
  lastName: string;
  country: string;
  city: string;
  address: string;
  dateOfBirth: string;
}

type KycOverallStatus =
  | "not_verified"
  | "pending_verification"
  | "verified"
  | "rejected";

const COUNTRIES = [
  "Senegal",
  "Cote d'Ivoire",
  "Cameroun",
  "Mali",
  "Burkina Faso",
  "Guinee",
  "Benin",
  "Togo",
  "Niger",
  "Tchad",
  "Republique du Congo",
  "RD Congo",
  "Gabon",
  "Madagascar",
  "Maroc",
  "Tunisie",
  "Algerie",
  "France",
  "Belgique",
  "Suisse",
  "Canada",
  "Haiti",
  "Autre",
];

function deriveOverallStatus(
  currentLevel: number,
  requests: KycRequest[]
): { status: KycOverallStatus; refusalReason?: string } {
  // If level 3 or above is reached, the user is verified
  if (currentLevel >= 3) {
    return { status: "verified" };
  }

  // Check for pending requests
  const hasPending = requests.some((r) => r.status === "en_attente");
  if (hasPending) {
    return { status: "pending_verification" };
  }

  // Check for recent refusals (not yet retried)
  const refusedRequests = requests.filter((r) => r.status === "refuse");
  if (refusedRequests.length > 0) {
    const latest = refusedRequests.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
    return { status: "rejected", refusalReason: latest.reason };
  }

  return { status: "not_verified" };
}

function computeProgress(
  personalInfo: PersonalInfo,
  currentLevel: number,
  requests: KycRequest[]
): { completed: number; total: number; steps: { label: string; done: boolean }[] } {
  const hasPersonalInfo =
    !!personalInfo.firstName &&
    !!personalInfo.lastName &&
    !!personalInfo.country &&
    !!personalInfo.city &&
    !!personalInfo.dateOfBirth;

  const hasDocumentSubmitted = requests.some(
    (r) => r.level === 3 && (r.status === "en_attente" || r.status === "approuve")
  );

  const isDocumentVerified = currentLevel >= 3;

  const steps = [
    { label: "Informations personnelles", done: hasPersonalInfo },
    { label: "Document d'identite soumis", done: hasDocumentSubmitted },
    { label: "Identite verifiee", done: isDocumentVerified },
  ];

  const completed = steps.filter((s) => s.done).length;
  return { completed, total: steps.length, steps };
}

export default function KycPage() {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [requests, setRequests] = useState<KycRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [personalInfoSaved, setPersonalInfoSaved] = useState(false);
  const [savingPersonalInfo, setSavingPersonalInfo] = useState(false);
  const [personalInfoError, setPersonalInfoError] = useState("");
  const [personalInfoSuccess, setPersonalInfoSuccess] = useState("");

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    firstName: "",
    lastName: "",
    country: "",
    city: "",
    address: "",
    dateOfBirth: "",
  });

  const fetchKyc = useCallback(async () => {
    try {
      const res = await fetch("/api/kyc");
      if (res.ok) {
        const data = await res.json();
        setCurrentLevel(data.currentLevel);
        setRequests(data.requests);
        // If the API returns personal info, populate the form
        if (data.personalInfo) {
          setPersonalInfo({
            firstName: data.personalInfo.firstName || "",
            lastName: data.personalInfo.lastName || "",
            country: data.personalInfo.country || "",
            city: data.personalInfo.city || "",
            address: data.personalInfo.address || "",
            dateOfBirth: data.personalInfo.dateOfBirth || "",
          });
          if (data.personalInfo.firstName && data.personalInfo.lastName) {
            setPersonalInfoSaved(true);
          }
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKyc();
  }, [fetchKyc]);

  function handlePersonalInfoChange(
    field: keyof PersonalInfo,
    value: string
  ) {
    setPersonalInfo((prev) => ({ ...prev, [field]: value }));
    // Reset saved state when editing
    if (personalInfoSaved) {
      setPersonalInfoSaved(false);
    }
  }

  async function handleSavePersonalInfo() {
    setPersonalInfoError("");
    setPersonalInfoSuccess("");

    // Validation
    if (!personalInfo.firstName.trim()) {
      setPersonalInfoError("Le prenom est requis");
      return;
    }
    if (!personalInfo.lastName.trim()) {
      setPersonalInfoError("Le nom est requis");
      return;
    }
    if (!personalInfo.country) {
      setPersonalInfoError("Le pays est requis");
      return;
    }
    if (!personalInfo.city.trim()) {
      setPersonalInfoError("La ville est requise");
      return;
    }
    if (!personalInfo.dateOfBirth) {
      setPersonalInfoError("La date de naissance est requise");
      return;
    }

    setSavingPersonalInfo(true);
    try {
      const res = await fetch("/api/kyc", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personalInfo }),
      });

      if (!res.ok) {
        const data = await res.json();
        setPersonalInfoError(
          data.error || "Erreur lors de la sauvegarde"
        );
        return;
      }

      setPersonalInfoSuccess("Informations personnelles enregistrees");
      setPersonalInfoSaved(true);
    } catch {
      setPersonalInfoError("Erreur reseau");
    } finally {
      setSavingPersonalInfo(false);
    }
  }

  const { status: overallStatus, refusalReason } = deriveOverallStatus(
    currentLevel,
    requests
  );

  const progress = computeProgress(personalInfo, currentLevel, requests);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-0">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-white/5 rounded-xl w-full" />
          <div className="h-8 bg-white/5 rounded-xl w-1/3" />
          <div className="h-48 bg-white/5 rounded-2xl" />
          <div className="h-64 bg-white/5 rounded-2xl" />
          <div className="h-40 bg-white/5 rounded-2xl" />
          <div className="h-32 bg-white/5 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-0">
      {/* ── Status Banner ── */}
      <StatusBanner
        status={overallStatus}
        refusalReason={refusalReason}
      />

      {/* ── Header ── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">
          Verification KYC
        </h1>
        <p className="text-slate-400">
          Verifiez votre identite pour debloquer toutes les fonctionnalites
          de la plateforme.
        </p>
      </div>

      {/* ── Progress Indicator ── */}
      <ProgressCard progress={progress} />

      {/* ── Verification Status Card ── */}
      <VerificationStatusCard
        status={overallStatus}
        currentLevel={currentLevel}
        refusalReason={refusalReason}
      />

      {/* ── Personal Information Section ── */}
      <div className="mt-6">
        <PersonalInfoSection
          personalInfo={personalInfo}
          onChange={handlePersonalInfoChange}
          onSave={handleSavePersonalInfo}
          saving={savingPersonalInfo}
          saved={personalInfoSaved}
          error={personalInfoError}
          success={personalInfoSuccess}
        />
      </div>

      {/* ── KYC Upload Card (untouched) ── */}
      <div className="mt-6">
        <KycUploadCard
          currentLevel={currentLevel}
          requests={requests}
          onRefresh={fetchKyc}
        />
      </div>

      {/* ── History ── */}
      {requests.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-white mb-4">
            Historique des demandes
          </h2>
          <div className="bg-neutral-dark rounded-2xl border border-border-dark divide-y divide-border-dark">
            {requests.map((req) => (
              <div
                key={req.id}
                className="p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-white">
                    Niveau {req.level} — {req.documentType}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(req.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    req.status === "approuve"
                      ? "text-emerald-400 bg-emerald-500/10"
                      : req.status === "refuse"
                        ? "text-red-400 bg-red-500/10"
                        : "text-amber-400 bg-amber-500/10"
                  }`}
                >
                  {req.status === "approuve"
                    ? "Approuve"
                    : req.status === "refuse"
                      ? "Refuse"
                      : "En attente"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════════ */

function StatusBanner({
  status,
  refusalReason,
}: {
  status: KycOverallStatus;
  refusalReason?: string;
}) {
  if (status === "not_verified") {
    return (
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
        <span className="material-symbols-outlined text-xl text-amber-400 flex-shrink-0 mt-0.5">
          warning
        </span>
        <p className="text-sm text-amber-300">
          Completez votre verification d&apos;identite pour acceder a toutes
          les fonctionnalites de la plateforme.
        </p>
      </div>
    );
  }

  if (status === "pending_verification") {
    return (
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
        <span className="material-symbols-outlined text-xl text-blue-400 flex-shrink-0 mt-0.5">
          schedule
        </span>
        <p className="text-sm text-blue-300">
          Verification en cours — delai 24 a 48 heures.
        </p>
      </div>
    );
  }

  if (status === "verified") {
    return (
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
        <span className="material-symbols-outlined text-xl text-emerald-400 flex-shrink-0 mt-0.5">
          check_circle
        </span>
        <p className="text-sm text-emerald-300">
          Identite verifiee — vous avez acces a toutes les fonctionnalites.
        </p>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
        <span className="material-symbols-outlined text-xl text-red-400 flex-shrink-0 mt-0.5">
          cancel
        </span>
        <div>
          <p className="text-sm text-red-300">
            Votre verification a ete refusee.
          </p>
          {refusalReason && (
            <p className="text-sm text-red-400/80 mt-1">
              Motif : {refusalReason}
            </p>
          )}
        </div>
      </div>
    );
  }

  return null;
}

function ProgressCard({
  progress,
}: {
  progress: {
    completed: number;
    total: number;
    steps: { label: string; done: boolean }[];
  };
}) {
  const percent = Math.round((progress.completed / progress.total) * 100);

  return (
    <div className="bg-neutral-dark rounded-2xl border border-border-dark p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">
          Progression de la verification
        </h3>
        <span className="text-sm font-semibold text-primary">
          {progress.completed}/{progress.total} etapes
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Steps list */}
      <div className="space-y-3">
        {progress.steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                step.done
                  ? "bg-emerald-500/20"
                  : "bg-white/5"
              }`}
            >
              {step.done ? (
                <span className="material-symbols-outlined text-sm text-emerald-400">
                  check
                </span>
              ) : (
                <span className="text-xs font-bold text-slate-500">
                  {i + 1}
                </span>
              )}
            </div>
            <span
              className={`text-sm ${
                step.done ? "text-emerald-400" : "text-slate-400"
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VerificationStatusCard({
  status,
  currentLevel,
  refusalReason,
}: {
  status: KycOverallStatus;
  currentLevel: number;
  refusalReason?: string;
}) {
  const configs: Record<
    KycOverallStatus,
    {
      icon: string;
      iconColor: string;
      bg: string;
      border: string;
      title: string;
      description: string;
    }
  > = {
    not_verified: {
      icon: "info",
      iconColor: "text-slate-400",
      bg: "bg-white/5",
      border: "border-border-dark",
      title: "Non verifie",
      description:
        "Votre identite n'a pas encore ete verifiee. Remplissez vos informations personnelles puis soumettez un document d'identite pour acceder aux retraits et a la publication de services.",
    },
    pending_verification: {
      icon: "schedule",
      iconColor: "text-blue-400",
      bg: "bg-blue-500/5",
      border: "border-blue-500/20",
      title: "Verification en cours",
      description:
        "Votre demande est en cours d'examen par notre equipe. Vous serez notifie par email des que la verification sera terminee (24 a 48 heures).",
    },
    verified: {
      icon: "verified",
      iconColor: "text-emerald-400",
      bg: "bg-emerald-500/5",
      border: "border-emerald-500/20",
      title: "Identite verifiee",
      description:
        "Votre identite a ete verifiee avec succes. Vous avez acces a toutes les fonctionnalites de la plateforme.",
    },
    rejected: {
      icon: "gpp_bad",
      iconColor: "text-red-400",
      bg: "bg-red-500/5",
      border: "border-red-500/20",
      title: "Verification refusee",
      description: refusalReason
        ? `Votre verification a ete refusee. Motif : ${refusalReason}. Vous pouvez soumettre une nouvelle demande ci-dessous.`
        : "Votre verification a ete refusee. Vous pouvez soumettre une nouvelle demande ci-dessous.",
    },
  };

  const config = configs[status];

  return (
    <div
      className={`${config.bg} rounded-2xl border ${config.border} p-6`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
            status === "verified"
              ? "bg-emerald-500/10"
              : status === "pending_verification"
                ? "bg-blue-500/10"
                : status === "rejected"
                  ? "bg-red-500/10"
                  : "bg-white/5"
          }`}
        >
          <span
            className={`material-symbols-outlined text-2xl ${config.iconColor}`}
          >
            {config.icon}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
            <h3 className="font-bold text-white">{config.title}</h3>
            <span className="text-xs font-semibold text-slate-500">
              Niveau actuel : {currentLevel}/4
            </span>
          </div>
          <p className="text-sm text-slate-400">{config.description}</p>
        </div>
      </div>
    </div>
  );
}

function PersonalInfoSection({
  personalInfo,
  onChange,
  onSave,
  saving,
  saved,
  error,
  success,
}: {
  personalInfo: PersonalInfo;
  onChange: (field: keyof PersonalInfo, value: string) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
  error: string;
  success: string;
}) {
  return (
    <div className="bg-neutral-dark rounded-2xl border border-border-dark p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-xl text-primary">
            person
          </span>
        </div>
        <div>
          <h3 className="font-bold text-white">
            Informations personnelles
          </h3>
          <p className="text-xs text-slate-400">
            Ces informations sont necessaires pour la verification de votre
            identite (Niveau 3).
          </p>
        </div>
        {saved && (
          <span className="ml-auto text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full flex items-center gap-1 flex-shrink-0">
            <span className="material-symbols-outlined text-sm">
              check
            </span>
            Enregistre
          </span>
        )}
      </div>

      {/* Feedback */}
      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {success && !error && (
        <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-sm text-emerald-400">
          {success}
        </div>
      )}

      {/* Form fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* First name */}
        <div>
          <label className="block text-sm font-semibold text-white mb-1.5">
            Prenom <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={personalInfo.firstName}
            onChange={(e) => onChange("firstName", e.target.value)}
            placeholder="Ex : Amadou"
            className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Last name */}
        <div>
          <label className="block text-sm font-semibold text-white mb-1.5">
            Nom <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={personalInfo.lastName}
            onChange={(e) => onChange("lastName", e.target.value)}
            placeholder="Ex : Diallo"
            className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-semibold text-white mb-1.5">
            Pays <span className="text-red-400">*</span>
          </label>
          <select
            value={personalInfo.country}
            onChange={(e) => onChange("country", e.target.value)}
            className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
          >
            <option value="">-- Selectionnez un pays --</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-semibold text-white mb-1.5">
            Ville <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={personalInfo.city}
            onChange={(e) => onChange("city", e.target.value)}
            placeholder="Ex : Dakar"
            className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Address (optional) */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-white mb-1.5">
            Adresse{" "}
            <span className="text-slate-500 font-normal">(optionnel)</span>
          </label>
          <input
            type="text"
            value={personalInfo.address}
            onChange={(e) => onChange("address", e.target.value)}
            placeholder="Ex : 123 rue de la Liberte"
            className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Date of birth */}
        <div>
          <label className="block text-sm font-semibold text-white mb-1.5">
            Date de naissance <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            value={personalInfo.dateOfBirth}
            onChange={(e) => onChange("dateOfBirth", e.target.value)}
            max={
              new Date(
                new Date().setFullYear(new Date().getFullYear() - 18)
              )
                .toISOString()
                .split("T")[0]
            }
            className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
          />
          <p className="text-xs text-slate-500 mt-1">
            Vous devez avoir au moins 18 ans.
          </p>
        </div>
      </div>

      {/* Save button */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-xs text-slate-500">
          Les champs marques <span className="text-red-400">*</span> sont
          obligatoires.
        </p>
        <button
          onClick={onSave}
          disabled={saving}
          className="w-full sm:w-auto px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <span className="material-symbols-outlined text-lg animate-spin">
                progress_activity
              </span>
              Sauvegarde...
            </>
          ) : saved ? (
            <>
              <span className="material-symbols-outlined text-lg">
                check
              </span>
              Enregistre
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-lg">
                save
              </span>
              Enregistrer
            </>
          )}
        </button>
      </div>
    </div>
  );
}
