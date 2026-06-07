"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  UserCircle,
  ExternalLink,
  AlertCircle,
  Save,
  Loader2,
  X,
  Check,
  Clock,
  ArrowRight,
  User,
  Headphones,
} from "lucide-react";
import { RichTextEditor } from "@/components/formations/RichTextEditor";
import DiscoverySessionPanel from "@/components/mentor/DiscoverySessionPanel";
import {
  KazaHero,
  KazaCard,
  KazaButton,
} from "@/components/kaza";

function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

const LANGUAGES = [
  { code: "FR", label: "Français" },
  { code: "EN", label: "Anglais" },
  { code: "AR", label: "Arabe" },
  { code: "WO", label: "Wolof" },
  { code: "DI", label: "Dioula" },
  { code: "PT", label: "Portugais" },
  { code: "ES", label: "Espagnol" },
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

interface MentorProfileForm {
  specialty: string;
  bio: string;
  domain: string;
  sessionPrice: number;
  sessionDuration: number;
  isAvailable: boolean;
  languages: string[];
  coverImage: string;
  timezone: string;
  sessionBuffer: number;
  bookingLeadTime: number;
}

const TIMEZONES = [
  { code: "Africa/Abidjan",     label: "Abidjan, Dakar, Bamako (UTC+0)" },
  { code: "Africa/Casablanca",  label: "Casablanca, Rabat (UTC+1)" },
  { code: "Europe/Paris",       label: "Paris, Bruxelles (UTC+1/+2)" },
  { code: "Africa/Cairo",       label: "Le Caire, Tunis (UTC+2)" },
  { code: "Africa/Lagos",       label: "Lagos, Douala, Kinshasa (UTC+1)" },
  { code: "UTC",                label: "UTC" },
];

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
    timezone: "Africa/Abidjan",
    sessionBuffer: 15,
    bookingLeadTime: 60,
  });
  const [mentorProfileId, setMentorProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            timezone: p.timezone ?? "Africa/Abidjan",
            sessionBuffer: typeof p.sessionBuffer === "number" ? p.sessionBuffer : 15,
            bookingLeadTime: typeof p.bookingLeadTime === "number" ? p.bookingLeadTime : 60,
          });
          if (p.id) setMentorProfileId(p.id);
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
          timezone: form.timezone,
          sessionBuffer: form.sessionBuffer,
          bookingLeadTime: form.bookingLeadTime,
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
    if (form.bio && stripHtml(form.bio).length > 50) score++;
    if (form.domain) score++;
    if (form.sessionPrice > 0) score++;
    if (form.languages.length > 0) score++;
    if (form.coverImage) score++;
    return Math.round((score / total) * 100);
  })();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 p-6">
        <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
          <div className="h-32 bg-slate-200 rounded-3xl" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <main className="px-5 md:px-10 py-8 md:py-12 max-w-3xl mx-auto space-y-6">
        <KazaHero
          badge="Mentor"
          badgeColor="white"
          icon={UserCircle}
          title="Mon profil mentor"
          subtitle="Configurez votre fiche publique et vos paramètres de réservation."
          actions={
            mentorProfileId ? (
              <KazaButton
                variant="secondary"
                size="sm"
                icon={ExternalLink}
                href={`/mentors/${mentorProfileId}`}
              >
                Voir public
              </KazaButton>
            ) : undefined
          }
        />

        {/* Profile completion bar */}
        <KazaCard>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-slate-900">Complétude du profil</p>
            <p className="text-xs font-bold text-emerald-700">{profileCompletion}%</p>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${profileCompletion}%`,
                background: "linear-gradient(to right, #006e2f, #22c55e)",
              }}
            />
          </div>
          {profileCompletion < 100 && (
            <p className="text-[11px] text-slate-500 mt-1.5">
              Un profil complet apparaît mieux dans les résultats de recherche.
            </p>
          )}
        </KazaCard>

        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          {saved && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <p className="text-sm text-emerald-700 font-semibold">Profil sauvegardé</p>
            </div>
          )}

          {/* Availability toggle */}
          <KazaCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">Disponible pour des séances</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Désactivez si vous n&apos;acceptez pas de nouvelles réservations.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, isAvailable: !p.isAvailable }))}
                className={`relative inline-flex h-6 w-11 rounded-full transition-colors focus:outline-none ${
                  form.isAvailable ? "bg-emerald-500" : "bg-slate-200"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ${
                    form.isAvailable ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </KazaCard>

          {/* Basic info */}
          <KazaCard title="Informations de base">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                  Spécialité / Titre professionnel <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.specialty}
                  onChange={(e) => setForm((p) => ({ ...p, specialty: e.target.value }))}
                  placeholder="ex: Expert Marketing Digital & Growth Hacking"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                  Domaine d&apos;expertise
                </label>
                <select
                  value={form.domain}
                  onChange={(e) => setForm((p) => ({ ...p, domain: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 bg-white"
                >
                  <option value="">Sélectionner un domaine…</option>
                  {DOMAINS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                  Bio / Description <span className="text-rose-500">*</span>
                </label>
                <RichTextEditor
                  value={form.bio}
                  onChange={(html) => setForm((p) => ({ ...p, bio: html }))}
                  placeholder="Décrivez votre parcours, vos expertises, vos réussites…"
                  minHeight={260}
                />
                {(() => {
                  const len = stripHtml(form.bio).length;
                  return (
                    <p className="text-[10px] text-slate-500 mt-1">
                      {len} caractère{len !== 1 ? "s" : ""}
                      {len < 50 && len > 0 && (
                        <span className="text-amber-500"> — Ajoutez au moins 50 caractères</span>
                      )}
                    </p>
                  );
                })()}
              </div>
            </div>
          </KazaCard>

          {/* Session settings */}
          <KazaCard title="Tarifs & Durée">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1.5">
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
                    className="w-full pr-14 pl-3.5 py-2.5 rounded-xl border-2 border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">
                    FCFA
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  ≈ {(form.sessionPrice / 655.957).toFixed(0)} EUR
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                  Durée (minutes)
                </label>
                <select
                  value={form.sessionDuration}
                  onChange={(e) => setForm((p) => ({ ...p, sessionDuration: Number(e.target.value) }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 bg-white"
                >
                  {[30, 45, 60, 90, 120].map((d) => (
                    <option key={d} value={d}>{d} min</option>
                  ))}
                </select>
              </div>
            </div>
          </KazaCard>

          {/* Advanced booking settings */}
          <KazaCard
            title="Réglages calendrier"
            action={
              <Link
                href="/mentor/calendrier"
                className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-1"
              >
                Configurer mes créneaux
                <ArrowRight className="w-3 h-3" />
              </Link>
            }
          >
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                  Fuseau horaire
                </label>
                <select
                  value={form.timezone}
                  onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 bg-white"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.code} value={tz.code}>{tz.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                    Pause entre sessions
                  </label>
                  <select
                    value={form.sessionBuffer}
                    onChange={(e) => setForm((p) => ({ ...p, sessionBuffer: Number(e.target.value) }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 bg-white"
                  >
                    {[0, 5, 10, 15, 20, 30, 45, 60].map((b) => (
                      <option key={b} value={b}>{b === 0 ? "Aucune" : `${b} min`}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">Empêche les résa coup sur coup</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                    Délai min. de réservation
                  </label>
                  <select
                    value={form.bookingLeadTime}
                    onChange={(e) => setForm((p) => ({ ...p, bookingLeadTime: Number(e.target.value) }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 bg-white"
                  >
                    <option value={30}>30 min</option>
                    <option value={60}>1 heure</option>
                    <option value={120}>2 heures</option>
                    <option value={360}>6 heures</option>
                    <option value={720}>12 heures</option>
                    <option value={1440}>24 heures</option>
                    <option value={2880}>2 jours</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">Temps mini avant qu&apos;un apprenant puisse réserver</p>
                </div>
              </div>
            </div>
          </KazaCard>

          {/* Languages */}
          <KazaCard title="Langues parlées">
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => {
                const selected = form.languages.includes(lang.code);
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => toggleLanguage(lang.code)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                      selected
                        ? "bg-emerald-500 text-white border-emerald-500"
                        : "bg-white text-slate-500 border-slate-200 hover:border-emerald-300"
                    }`}
                  >
                    {lang.label}
                    {selected && <Check className="w-3 h-3" />}
                  </button>
                );
              })}
            </div>
          </KazaCard>

          {/* Cover image */}
          <KazaCard title="Photo de couverture">
            <div className="space-y-3">
              {form.coverImage && (
                <div className="h-28 rounded-xl overflow-hidden relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.coverImage} alt="Cover" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, coverImage: "" }))}
                    className="absolute top-2 right-2 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                  URL de l&apos;image (Cloudinary ou externe)
                </label>
                <input
                  type="url"
                  value={form.coverImage}
                  onChange={(e) => setForm((p) => ({ ...p, coverImage: e.target.value }))}
                  placeholder="https://res.cloudinary.com/…"
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Recommandé : 1280×400 px. Laissez vide pour utiliser le dégradé par défaut.
                </p>
              </div>
            </div>
          </KazaCard>

          {/* Preview */}
          <KazaCard title="Aperçu de votre profil">
            <div className="border border-slate-100 rounded-2xl overflow-hidden max-w-xs mx-auto bg-white">
              <div className="relative aspect-[4/3] bg-gradient-to-br from-emerald-900 via-emerald-700 to-emerald-400 overflow-hidden">
                {form.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.coverImage}
                    alt="Aperçu couverture"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Headphones className="w-16 h-16 text-white opacity-60" />
                  </div>
                )}

                <span
                  className={`absolute top-2 left-2 inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur shadow-sm ${
                    form.isAvailable ? "bg-emerald-500/95 text-white" : "bg-slate-600/95 text-slate-100"
                  }`}
                >
                  <span className={`w-1 h-1 rounded-full ${form.isAvailable ? "bg-white animate-pulse" : "bg-slate-300"}`} />
                  {form.isAvailable ? "Disponible" : "Indisponible"}
                </span>

                <div className="absolute bottom-2 left-2 w-12 h-12 rounded-full ring-2 ring-white shadow-lg overflow-hidden bg-gradient-to-br from-emerald-700 to-emerald-400 flex items-center justify-center text-white">
                  <User className="w-6 h-6" />
                </div>
              </div>

              <div className="p-4 flex flex-col gap-2">
                <div>
                  <p className="text-sm font-bold text-slate-900 line-clamp-1">
                    {form.specialty || "Votre spécialité"}
                  </p>
                  {form.domain && (
                    <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                      {form.domain}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {stripHtml(form.bio) || "Votre bio apparaîtra ici…"}
                </p>
                {form.languages.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {form.languages.map((code) => (
                      <span
                        key={code}
                        className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500"
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-50">
                  <p className="text-sm font-extrabold text-emerald-700">
                    {new Intl.NumberFormat("fr-FR").format(form.sessionPrice)}{" "}
                    <span className="text-[10px] font-bold text-slate-500">FCFA</span>
                  </p>
                  <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                    <Clock className="w-3 h-3" />
                    {form.sessionDuration} min
                  </span>
                </div>
              </div>
            </div>
          </KazaCard>

          {/* Save button */}
          <div className="pb-6">
            <KazaButton
              variant="primary"
              type="submit"
              disabled={saving}
              icon={saving ? Loader2 : Save}
              className="w-full"
            >
              {saving ? "Sauvegarde en cours…" : "Enregistrer le profil"}
            </KazaButton>

            <p className="text-center text-xs text-slate-500 mt-3">
              Votre profil sera visible sur{" "}
              <Link href="/mentors" className="text-emerald-700 hover:underline font-semibold">
                la page des mentors
              </Link>{" "}
              dès que vous êtes disponible.
            </p>
          </div>
        </form>

        <div>
          <DiscoverySessionPanel />
        </div>
      </main>
    </div>
  );
}
