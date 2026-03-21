"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { DocumentUpload } from "./DocumentUpload";

interface KycAgencyFormProps {
  onSuccess: () => void;
}

interface FormData {
  agencyName: string;
  siret: string;
  country: string;
  city: string;
  address: string;
  legalRepName: string;
  email: string;
  phone: string;
  documentType: string;
  registrationDocUrl: string;
  representativeIdUrl: string;
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

const AGENCY_DOC_TYPES = [
  { value: "KBIS", label: "Extrait Kbis" },
  { value: "REGISTRE_COMMERCE", label: "Registre de commerce" },
  { value: "LICENCE", label: "Licence professionnelle" },
];

export function KycAgencyForm({ onSuccess }: KycAgencyFormProps) {
  const [form, setForm] = useState<FormData>({
    agencyName: "",
    siret: "",
    country: "",
    city: "",
    address: "",
    legalRepName: "",
    email: "",
    phone: "",
    documentType: "",
    registrationDocUrl: "",
    representativeIdUrl: "",
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

    if (!form.agencyName.trim()) newErrors.agencyName = "Le nom de l'agence est requis";
    if (!form.siret.trim()) newErrors.siret = "Le SIRET / numero d'immatriculation est requis";
    if (!form.country) newErrors.country = "Le pays est requis";
    if (!form.city.trim()) newErrors.city = "La ville est requise";
    if (!form.address.trim()) newErrors.address = "L'adresse est requise";
    if (!form.legalRepName.trim()) newErrors.legalRepName = "Le nom du representant legal est requis";
    if (!form.email.trim()) newErrors.email = "L'email est requis";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Format d'email invalide";
    }
    if (!form.phone.trim()) newErrors.phone = "Le telephone est requis";
    if (!form.documentType) newErrors.documentType = "Le type de document est requis";
    if (!form.registrationDocUrl) newErrors.registrationDocUrl = "Le document d'immatriculation est requis";
    if (!form.representativeIdUrl) newErrors.representativeIdUrl = "La piece d'identite du representant est requise";

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
          type: "agency",
          agencyName: form.agencyName.trim(),
          siret: form.siret.trim(),
          country: form.country,
          city: form.city.trim(),
          address: form.address.trim(),
          legalRepName: form.legalRepName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          documentType: form.documentType,
          registrationDocUrl: form.registrationDocUrl,
          representativeIdUrl: form.representativeIdUrl,
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
      {/* Section 1: Informations de l'agence */}
      <div className="bg-neutral-dark rounded-2xl border border-border-dark p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-xl text-primary">
              business
            </span>
          </div>
          <div>
            <h3 className="font-bold text-white">Informations de l&apos;agence</h3>
            <p className="text-xs text-slate-400">
              Renseignez les informations officielles de votre agence.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Agency name */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-white mb-1.5">
              Nom de l&apos;agence <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.agencyName}
              onChange={(e) => updateField("agencyName", e.target.value)}
              placeholder="Ex : Studio Digital Africa"
              className={inputClass("agencyName")}
            />
            {errors.agencyName && (
              <p className="text-xs text-red-400 mt-1">{errors.agencyName}</p>
            )}
          </div>

          {/* SIRET */}
          <div>
            <label className="block text-sm font-semibold text-white mb-1.5">
              SIRET / Numero d&apos;immatriculation <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.siret}
              onChange={(e) => updateField("siret", e.target.value)}
              placeholder="Ex : 123 456 789 00012"
              className={inputClass("siret")}
            />
            {errors.siret && (
              <p className="text-xs text-red-400 mt-1">{errors.siret}</p>
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
              placeholder="Ex : Abidjan"
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
              placeholder="Ex : Plateau, Avenue Chardy"
              className={inputClass("address")}
            />
            {errors.address && (
              <p className="text-xs text-red-400 mt-1">{errors.address}</p>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: Representant legal */}
      <div className="bg-neutral-dark rounded-2xl border border-border-dark p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-xl text-amber-400">
              person
            </span>
          </div>
          <div>
            <h3 className="font-bold text-white">Representant legal</h3>
            <p className="text-xs text-slate-400">
              Informations sur la personne legalement responsable de l&apos;agence.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Legal rep name */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-white mb-1.5">
              Nom complet du representant <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.legalRepName}
              onChange={(e) => updateField("legalRepName", e.target.value)}
              placeholder="Ex : Jean-Pierre Kouame"
              className={inputClass("legalRepName")}
            />
            {errors.legalRepName && (
              <p className="text-xs text-red-400 mt-1">{errors.legalRepName}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-white mb-1.5">
              Email professionnel <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="Ex : contact@agence.com"
              className={inputClass("email")}
            />
            {errors.email && (
              <p className="text-xs text-red-400 mt-1">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-white mb-1.5">
              Telephone <span className="text-red-400">*</span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="Ex : +225 01 23 45 67 89"
              className={inputClass("phone")}
            />
            {errors.phone && (
              <p className="text-xs text-red-400 mt-1">{errors.phone}</p>
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Documents */}
      <div className="bg-neutral-dark rounded-2xl border border-border-dark p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-xl text-blue-400">
              folder_open
            </span>
          </div>
          <div>
            <h3 className="font-bold text-white">Documents justificatifs</h3>
            <p className="text-xs text-slate-400">
              Telechargez les documents officiels de votre agence et une piece d&apos;identite du representant.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Document type */}
          <div>
            <label className="block text-sm font-semibold text-white mb-1.5">
              Type de document d&apos;entreprise <span className="text-red-400">*</span>
            </label>
            <select
              value={form.documentType}
              onChange={(e) => updateField("documentType", e.target.value)}
              className={inputClass("documentType")}
            >
              <option value="">-- Selectionnez --</option>
              {AGENCY_DOC_TYPES.map((dt) => (
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
            {/* Registration doc */}
            <DocumentUpload
              label="Document d'immatriculation"
              value={form.registrationDocUrl}
              onChange={(url) => updateField("registrationDocUrl", url)}
              required
              error={!!errors.registrationDocUrl}
              hint="Extrait Kbis, registre de commerce ou licence"
            />

            {/* Representative ID */}
            <DocumentUpload
              label="Piece d'identite du representant"
              value={form.representativeIdUrl}
              onChange={(url) => updateField("representativeIdUrl", url)}
              required
              error={!!errors.representativeIdUrl}
              hint="CNI ou passeport du representant legal"
            />
          </div>
        </div>
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
