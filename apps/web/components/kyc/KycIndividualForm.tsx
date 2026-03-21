"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { DocumentUpload } from "./DocumentUpload";

interface KycIndividualFormProps {
  onSuccess: () => void;
}

interface FormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  country: string;
  city: string;
  address: string;
  documentType: string;
  documentFrontUrl: string;
  documentBackUrl: string;
  selfieUrl: string;
}

interface FieldErrors {
  [key: string]: string;
}

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

const DOC_TYPES = [
  { value: "CNI", label: "Carte nationale d'identite" },
  { value: "PASSEPORT", label: "Passeport" },
  { value: "PERMIS", label: "Permis de conduire" },
];

export function KycIndividualForm({ onSuccess }: KycIndividualFormProps) {
  const [form, setForm] = useState<FormData>({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    country: "",
    city: "",
    address: "",
    documentType: "",
    documentFrontUrl: "",
    documentBackUrl: "",
    selfieUrl: "",
  });

  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function validate(): boolean {
    const newErrors: FieldErrors = {};

    if (!form.firstName.trim()) newErrors.firstName = "Le prenom est requis";
    if (!form.lastName.trim()) newErrors.lastName = "Le nom est requis";
    if (!form.dateOfBirth) newErrors.dateOfBirth = "La date de naissance est requise";
    if (!form.country) newErrors.country = "Le pays est requis";
    if (!form.city.trim()) newErrors.city = "La ville est requise";
    if (!form.address.trim()) newErrors.address = "L'adresse est requise";
    if (!form.documentType) newErrors.documentType = "Le type de document est requis";
    if (!form.documentFrontUrl) newErrors.documentFrontUrl = "Le recto du document est requis";
    if (!form.documentBackUrl) newErrors.documentBackUrl = "Le verso du document est requis";
    if (!form.selfieUrl) newErrors.selfieUrl = "Le selfie de verification est requis";

    // Validate age
    if (form.dateOfBirth) {
      const birth = new Date(form.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      if (age < 18) {
        newErrors.dateOfBirth = "Vous devez avoir au moins 18 ans";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    setSubmitError("");

    if (!validate()) {
      setSubmitError("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "individual",
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          dateOfBirth: form.dateOfBirth,
          country: form.country,
          city: form.city.trim(),
          address: form.address.trim(),
          documentType: form.documentType,
          documentFrontUrl: form.documentFrontUrl,
          documentBackUrl: form.documentBackUrl,
          selfieUrl: form.selfieUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setSubmitError(data.error || "Erreur lors de la soumission");
        return;
      }

      onSuccess();
    } catch {
      setSubmitError("Erreur de connexion");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = (field: string) =>
    cn(
      "w-full bg-background-dark border rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none transition-colors",
      errors[field]
        ? "border-red-500 focus:border-red-400"
        : "border-border-dark focus:border-primary"
    );

  return (
    <div className="space-y-6">
      {/* Section 1: Informations personnelles */}
      <div className="bg-neutral-dark rounded-2xl border border-border-dark p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-xl text-primary">
              person
            </span>
          </div>
          <div>
            <h3 className="font-bold text-white">Informations personnelles</h3>
            <p className="text-xs text-slate-400">
              Renseignez vos informations telles qu&apos;elles apparaissent sur votre document d&apos;identite.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* First name */}
          <div>
            <label className="block text-sm font-semibold text-white mb-1.5">
              Prenom <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              placeholder="Ex : Amadou"
              className={inputClass("firstName")}
            />
            {errors.firstName && (
              <p className="text-xs text-red-400 mt-1">{errors.firstName}</p>
            )}
          </div>

          {/* Last name */}
          <div>
            <label className="block text-sm font-semibold text-white mb-1.5">
              Nom <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
              placeholder="Ex : Diallo"
              className={inputClass("lastName")}
            />
            {errors.lastName && (
              <p className="text-xs text-red-400 mt-1">{errors.lastName}</p>
            )}
          </div>

          {/* Date of birth */}
          <div>
            <label className="block text-sm font-semibold text-white mb-1.5">
              Date de naissance <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => updateField("dateOfBirth", e.target.value)}
              max={
                new Date(new Date().setFullYear(new Date().getFullYear() - 18))
                  .toISOString()
                  .split("T")[0]
              }
              className={inputClass("dateOfBirth")}
            />
            {errors.dateOfBirth ? (
              <p className="text-xs text-red-400 mt-1">{errors.dateOfBirth}</p>
            ) : (
              <p className="text-xs text-slate-500 mt-1">Vous devez avoir au moins 18 ans.</p>
            )}
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-semibold text-white mb-1.5">
              Pays <span className="text-red-400">*</span>
            </label>
            <select
              value={form.country}
              onChange={(e) => updateField("country", e.target.value)}
              className={inputClass("country")}
            >
              <option value="">-- Selectionnez un pays --</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.country && (
              <p className="text-xs text-red-400 mt-1">{errors.country}</p>
            )}
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-semibold text-white mb-1.5">
              Ville <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => updateField("city", e.target.value)}
              placeholder="Ex : Dakar"
              className={inputClass("city")}
            />
            {errors.city && (
              <p className="text-xs text-red-400 mt-1">{errors.city}</p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-semibold text-white mb-1.5">
              Adresse <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              placeholder="Ex : 123 rue de la Liberte"
              className={inputClass("address")}
            />
            {errors.address && (
              <p className="text-xs text-red-400 mt-1">{errors.address}</p>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: Document d'identite */}
      <div className="bg-neutral-dark rounded-2xl border border-border-dark p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-xl text-amber-400">
              badge
            </span>
          </div>
          <div>
            <h3 className="font-bold text-white">Document d&apos;identite</h3>
            <p className="text-xs text-slate-400">
              Choisissez le type de document et telechargez les photos recto et verso.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Document type */}
          <div>
            <label className="block text-sm font-semibold text-white mb-1.5">
              Type de document <span className="text-red-400">*</span>
            </label>
            <select
              value={form.documentType}
              onChange={(e) => updateField("documentType", e.target.value)}
              className={inputClass("documentType")}
            >
              <option value="">-- Selectionnez --</option>
              {DOC_TYPES.map((dt) => (
                <option key={dt.value} value={dt.value}>
                  {dt.label}
                </option>
              ))}
            </select>
            {errors.documentType && (
              <p className="text-xs text-red-400 mt-1">{errors.documentType}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Front */}
            <DocumentUpload
              label="Recto du document"
              value={form.documentFrontUrl}
              onChange={(url) => updateField("documentFrontUrl", url)}
              required
              error={!!errors.documentFrontUrl}
              hint="Photo nette du recto de votre document"
            />

            {/* Back */}
            <DocumentUpload
              label="Verso du document"
              value={form.documentBackUrl}
              onChange={(url) => updateField("documentBackUrl", url)}
              required
              error={!!errors.documentBackUrl}
              hint="Photo nette du verso de votre document"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Selfie de verification */}
      <div className="bg-neutral-dark rounded-2xl border border-border-dark p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-xl text-blue-400">
              photo_camera
            </span>
          </div>
          <div>
            <h3 className="font-bold text-white">Selfie de verification</h3>
            <p className="text-xs text-slate-400">
              Prenez un selfie clair en tenant votre document d&apos;identite a cote de votre visage.
            </p>
          </div>
        </div>

        <div className="bg-background-dark/50 rounded-xl p-4 mb-4 border border-border-dark/50">
          <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-blue-400">info</span>
            Instructions pour le selfie
          </h4>
          <ul className="text-xs text-slate-400 space-y-1">
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-xs text-emerald-400">check</span>
              Votre visage doit etre clairement visible
            </li>
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-xs text-emerald-400">check</span>
              Tenez votre document d&apos;identite ouvert a cote de votre visage
            </li>
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-xs text-emerald-400">check</span>
              Assurez-vous que les informations du document sont lisibles
            </li>
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-xs text-red-400">close</span>
              Pas de lunettes de soleil, chapeau ou masque
            </li>
          </ul>
        </div>

        <DocumentUpload
          label="Selfie avec document"
          value={form.selfieUrl}
          onChange={(url) => updateField("selfieUrl", url)}
          required
          error={!!errors.selfieUrl}
          accept="image/jpeg,image/png"
          hint="Photo de vous tenant votre document d'identite"
        />
      </div>

      {/* Error message */}
      {submitError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg flex-shrink-0">error</span>
          {submitError}
        </div>
      )}

      {/* Submit */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-xs text-slate-500">
          Les champs marques <span className="text-red-400">*</span> sont obligatoires.
          Vos documents seront traites de maniere confidentielle.
        </p>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full sm:w-auto px-8 py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <span className="material-symbols-outlined text-lg animate-spin">
                progress_activity
              </span>
              Envoi en cours...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-lg">send</span>
              Soumettre la demande
            </>
          )}
        </button>
      </div>
    </div>
  );
}
