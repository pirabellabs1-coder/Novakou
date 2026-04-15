"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// ─── Constants ────────────────────────────────────────────────────────────────
const LANGUAGES = [
  { code: "FR", label: "Français", flag: "🇫🇷" },
  { code: "EN", label: "Anglais", flag: "🇬🇧" },
  { code: "AR", label: "Arabe", flag: "🇸🇦" },
  { code: "WO", label: "Wolof", flag: "🇸🇳" },
  { code: "DI", label: "Dioula", flag: "🇨🇮" },
  { code: "PT", label: "Portugais", flag: "🇵🇹" },
  { code: "ES", label: "Espagnol", flag: "🇪🇸" },
];

const DOMAINS = [
  "Marketing & Vente",
  "Développement web",
  "Design & Créativité",
  "Finance & Comptabilité",
  "Entrepreneuriat",
  "Ressources humaines",
  "Rédaction & Communication",
  "Photo & Vidéo",
  "E-commerce",
  "Freelance & Productivité",
  "Développement personnel",
  "Autre",
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface MentorProfileForm {
  specialty: string;
  bio: string;
  domain: string;
  sessionPrice: number;
  sessionDuration: number;
  isAvailable: boolean;
  languages: string[];
  coverImage: string;
}

// ─── Profile page ─────────────────────────────────────────────────────────────
export default function MentorProfilPage() {
  const [form, setForm] = useState<MentorProfileForm>({
    specialty: "",
    bio: "",
    domain: "",
    sessionPrice: 25000,
    sessionDuration: 60,
    isAvailable: true,
    languages: ["FR"],
    coverImage: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load current profile
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/formations/mentor/dashboard");
        if (!res.ok) return;
        const json = await res.json();
        const p = json.data?.profile;
        if (p) {
          setForm({
            specialty: p.specialty ?? "",
            bio: p.bio ?? "",
            domain: p.domain ?? "",
            sessionPrice: p.sessionPrice ?? 25000,
            sessionDuration: p.sessionDuration ?? 60,
            isAvailable: p.isAvailable ?? true,
            languages: p.languages?.length ? p.languages : ["FR"],
            coverImage: p.coverImage ?? "",
          });
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function toggleLanguage(code: string) {
    setForm((prev) => ({
      ...prev,
      languages: prev.languages.includes(code)
        ? prev.languages.filter((l) => l !== code)
        : [...prev.languages, code],
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/formations/mentor/dashboard", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          specialty: form.specialty,
          bio: form.bio,
          domain: form.domain || null,
          sessionPrice: form.sessionPrice,
          sessionDuration: form.sessionDuration,
          isAvailable: form.isAvailable,
          languages: form.languages,
          coverImage: form.coverImage || null,
        }),
      });
      if (!res.ok) throw new Error("Erreur lors de la sauvegarde");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  const profileCompletion = (() => {
    let score = 0;
    const total = 6;
    if (form.specialty) score++;
    if (form.bio && form.bio.length > 50) score++;
    if (form.domain) score++;
    if (form.sessionPrice > 0) score++;
    if (form.languages.length > 0) score++;
    if (form.coverImage) score++;
    return Math.round((score / total) * 100);
  })();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] p-6">
        <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
          <div className="h-8 w-56 bg-gray-200 rounded-xl" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link href="/formations/mentor/dashboard" className="text-[#5c647a] hover:text-[#191c1e]">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>
          <span className="text-sm font-bold text-[#191c1e] flex-1">Mon profil mentor</span>

          {saved && (
            <span className="flex items-center gap-1.5 text-xs text-green-700 font-semibold">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              Sauvegardé
            </span>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        {/* Profile completion bar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-[#191c1e]">Complétude du profil</p>
            <p className="text-xs font-bold text-[#006e2f]">{profileCompletion}%</p>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${profileCompletion}%`,
                background: "linear-gradient(to right, #006e2f, #22c55e)",
              }}
            />
          </div>
          {profileCompletion < 100 && (
            <p className="text-[11px] text-[#5c647a] mt-1.5">
              Un profil complet apparaît mieux dans les résultats de recherche.
            </p>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Error banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-red-500 text-[18px]">error</span>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* ── Availability toggle ──────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-[#191c1e]">Disponible pour des séances</p>
                <p className="text-xs text-[#5c647a] mt-0.5">
                  Désactivez si vous n'acceptez pas de nouvelles réservations.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, isAvailable: !p.isAvailable }))}
                className={`relative inline-flex h-6 w-11 rounded-full transition-colors focus:outline-none ${
                  form.isAvailable ? "bg-[#006e2f]" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ${
                    form.isAvailable ? "translate-x-5.5 ml-5" : "translate-x-0.5 ml-0.5"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* ── Basic info ──────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h3 className="text-sm font-bold text-[#191c1e]">Informations de base</h3>

            <div>
              <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">
                Spécialité / Titre professionnel <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.specialty}
                onChange={(e) => setForm((p) => ({ ...p, specialty: e.target.value }))}
                placeholder="ex: Expert Marketing Digital & Growth Hacking"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-[#191c1e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">
                Domaine d'expertise
              </label>
              <select
                value={form.domain}
                onChange={(e) => setForm((p) => ({ ...p, domain: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f] bg-white"
              >
                <option value="">Sélectionner un domaine…</option>
                {DOMAINS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">
                Bio / Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                placeholder="Décrivez votre parcours, vos expertises et ce que vous apportez à vos apprenants en séance de mentorat…"
                required
                rows={5}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-[#191c1e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f] transition-all resize-none"
              />
              <p className="text-[10px] text-[#5c647a] mt-1">
                {form.bio.length} caractère{form.bio.length !== 1 ? "s" : ""}
                {form.bio.length < 50 && form.bio.length > 0 && (
                  <span className="text-amber-500"> — Ajoutez au moins 50 caractères</span>
                )}
              </p>
            </div>
          </div>

          {/* ── Session settings ─────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h3 className="text-sm font-bold text-[#191c1e]">Tarifs & Durée</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">
                  Prix par séance (FCFA)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={form.sessionPrice}
                    onChange={(e) => setForm((p) => ({ ...p, sessionPrice: Number(e.target.value) }))}
                    min={1000}
                    step={500}
                    required
                    className="w-full pr-14 pl-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f]"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#5c647a] font-medium">
                    FCFA
                  </span>
                </div>
                <p className="text-[10px] text-[#5c647a] mt-1">
                  ≈ {(form.sessionPrice / 655.957).toFixed(0)} EUR
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">
                  Durée (minutes)
                </label>
                <select
                  value={form.sessionDuration}
                  onChange={(e) => setForm((p) => ({ ...p, sessionDuration: Number(e.target.value) }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f] bg-white"
                >
                  {[30, 45, 60, 90, 120].map((d) => (
                    <option key={d} value={d}>{d} min</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ── Languages ─────────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-[#191c1e] mb-3">Langues parlées</h3>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => {
                const selected = form.languages.includes(lang.code);
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => toggleLanguage(lang.code)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      selected
                        ? "bg-[#006e2f] text-white border-[#006e2f]"
                        : "bg-white text-[#5c647a] border-gray-200 hover:border-[#006e2f]/40"
                    }`}
                  >
                    <span>{lang.flag}</span>
                    {lang.label}
                    {selected && (
                      <span className="material-symbols-outlined text-[12px]">check</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Cover image ──────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <h3 className="text-sm font-bold text-[#191c1e]">Photo de couverture</h3>

            {form.coverImage && (
              <div className="h-28 rounded-xl overflow-hidden relative">
                <img src={form.coverImage} alt="Cover" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, coverImage: "" }))}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#191c1e] mb-1.5">
                URL de l'image (Cloudinary ou externe)
              </label>
              <input
                type="url"
                value={form.coverImage}
                onChange={(e) => setForm((p) => ({ ...p, coverImage: e.target.value }))}
                placeholder="https://res.cloudinary.com/…"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-[#191c1e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f]"
              />
              <p className="text-[10px] text-[#5c647a] mt-1">
                Recommandé : 1280×400 px. Laissez vide pour utiliser le dégradé par défaut.
              </p>
            </div>
          </div>

          {/* ── Preview ──────────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-[#191c1e] mb-3">Aperçu de votre profil</h3>
            <div className="border border-gray-100 rounded-2xl overflow-hidden max-w-xs mx-auto">
              {/* Cover */}
              <div
                className="h-20 relative"
                style={{
                  background: form.coverImage
                    ? `url(${form.coverImage}) center/cover`
                    : "linear-gradient(135deg, #003d1a 0%, #006e2f 50%, #22c55e 100%)",
                }}
              >
                {form.isAvailable && (
                  <span className="absolute top-2 left-2 flex items-center gap-1 bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    Disponible
                  </span>
                )}
                {form.domain && (
                  <span className="absolute bottom-2 right-2 bg-black/40 backdrop-blur-sm text-white text-[9px] font-semibold px-2 py-0.5 rounded-full">
                    {form.domain}
                  </span>
                )}
              </div>

              <div className="px-4 pb-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full border-2 border-white bg-gradient-to-br from-[#006e2f] to-[#22c55e] flex items-center justify-center text-white font-bold -mt-6 mb-2 shadow-sm">
                  <span className="material-symbols-outlined text-[22px]">person</span>
                </div>
                <p className="text-sm font-bold text-[#191c1e]">
                  {form.specialty || "Votre spécialité"}
                </p>
                {form.domain && <p className="text-xs text-[#5c647a]">{form.domain}</p>}
                <p className="text-xs text-[#5c647a] mt-1.5 line-clamp-2">
                  {form.bio || "Votre bio apparaîtra ici…"}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {form.languages.map((code) => {
                    const l = LANGUAGES.find((x) => x.code === code);
                    return l ? (
                      <span key={code} className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-[#5c647a]">
                        {l.flag} {code}
                      </span>
                    ) : null;
                  })}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-sm font-extrabold text-[#006e2f]">
                    {new Intl.NumberFormat("fr-FR").format(form.sessionPrice)} FCFA
                  </p>
                  <p className="text-xs text-[#5c647a]">{form.sessionDuration} min</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Save button ───────────────────────────────────────────────────── */}
          <div className="pb-6">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
            >
              {saving ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  Sauvegarde en cours…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  Enregistrer le profil
                </>
              )}
            </button>

            <p className="text-center text-xs text-[#5c647a] mt-3">
              Votre profil sera visible sur{" "}
              <Link href="/formations/mentors" className="text-[#006e2f] hover:underline font-semibold">
                la page des mentors
              </Link>{" "}
              dès que vous êtes disponible.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
