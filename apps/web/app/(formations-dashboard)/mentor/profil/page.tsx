// Refonte design "Stitch" — profil mentor — vert Novakou officiel — 2026-06-13.
// Logique 100% préservée : query/PATCH profil, toggle dispo, langues, complétude, aperçu.
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
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
  StCard,
  StPageHeader,
  StButton,
  StProgressBar,
  StChip,
  ST,
} from "@/components/stitch";

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

const SELECT_CLASS = "w-full rounded-[12px] px-[14px] py-[11px] text-[13.5px] font-semibold bg-white focus:outline-none";
const INPUT_CLASS = "w-full rounded-[12px] px-[14px] py-[11px] text-[13.5px] font-semibold bg-white focus:outline-none";

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
      <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
        <main className="px-5 md:px-7 py-6 md:py-7 max-w-3xl mx-auto space-y-4 animate-pulse">
          <div className="h-10 w-64 rounded-xl" style={{ background: "#e9efeb" }} />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-[18px]" style={{ background: "#e9efeb" }} />
          ))}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-3xl mx-auto">
        <StPageHeader
          title="Mon profil mentor"
          subtitle="Configurez votre fiche publique et vos paramètres de réservation."
          actions={
            mentorProfileId ? (
              <StButton
                variant="secondary"
                size="sm"
                icon={ExternalLink}
                href={`/mentors/${mentorProfileId}`}
              >
                Voir public
              </StButton>
            ) : undefined
          }
        />

        {/* Profile completion bar */}
        <StCard className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[12px] font-extrabold" style={{ color: ST.text }}>Complétude du profil</p>
            <p className="text-[12px] font-extrabold" style={{ color: ST.green }}>{profileCompletion}%</p>
          </div>
          <StProgressBar percent={profileCompletion} height={8} />
          {profileCompletion < 100 && (
            <p className="text-[11px] font-semibold mt-1.5" style={{ color: ST.textMuted }}>
              Un profil complet apparaît mieux dans les résultats de recherche.
            </p>
          )}
        </StCard>

        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="rounded-[13px] px-4 py-3 flex items-center gap-2" style={{ background: ST.roseSoft, border: "1px solid #f3d4de" }}>
              <AlertCircle size={16} style={{ color: ST.roseText }} />
              <p className="text-[13px] font-bold" style={{ color: ST.roseText }}>{error}</p>
            </div>
          )}

          {saved && (
            <div className="rounded-[13px] px-4 py-3 flex items-center gap-2" style={{ background: ST.greenSoft, border: "1px solid #d7ecde" }}>
              <Check size={16} style={{ color: ST.green }} />
              <p className="text-[13px] font-extrabold" style={{ color: ST.greenDark }}>Profil sauvegardé</p>
            </div>
          )}

          {/* Availability toggle */}
          <StCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-extrabold" style={{ color: ST.text }}>Disponible pour des séances</p>
                <p className="text-[11.5px] font-semibold mt-0.5" style={{ color: ST.textSecondary }}>
                  Désactivez si vous n&apos;acceptez pas de nouvelles réservations.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, isAvailable: !p.isAvailable }))}
                className="relative inline-flex h-6 w-11 rounded-full transition-colors focus:outline-none"
                style={{ background: form.isAvailable ? ST.greenBright : "#cbd5cd" }}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ${
                    form.isAvailable ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </StCard>

          {/* Basic info */}
          <StCard className="!p-[18px_20px]">
            <span className="text-[15px] font-extrabold block mb-4" style={{ color: ST.text }}>Informations de base</span>
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-extrabold mb-[7px]" style={{ color: ST.textLabel }}>
                  Spécialité / Titre professionnel <span style={{ color: ST.roseText }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.specialty}
                  onChange={(e) => setForm((p) => ({ ...p, specialty: e.target.value }))}
                  placeholder="ex: Expert Marketing Digital & Growth Hacking"
                  required
                  className={INPUT_CLASS}
                  style={{ color: ST.text, border: "1px solid #dde6e0" }}
                />
              </div>

              <div>
                <label className="block text-[12px] font-extrabold mb-[7px]" style={{ color: ST.textLabel }}>
                  Domaine d&apos;expertise
                </label>
                <select
                  value={form.domain}
                  onChange={(e) => setForm((p) => ({ ...p, domain: e.target.value }))}
                  className={SELECT_CLASS}
                  style={{ color: ST.text, border: "1px solid #dde6e0" }}
                >
                  <option value="">Sélectionner un domaine…</option>
                  {DOMAINS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-extrabold mb-[7px]" style={{ color: ST.textLabel }}>
                  Bio / Description <span style={{ color: ST.roseText }}>*</span>
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
                    <p className="text-[10px] font-semibold mt-1" style={{ color: ST.textMuted }}>
                      {len} caractère{len !== 1 ? "s" : ""}
                      {len < 50 && len > 0 && (
                        <span style={{ color: ST.amberText }}> — Ajoutez au moins 50 caractères</span>
                      )}
                    </p>
                  );
                })()}
              </div>
            </div>
          </StCard>

          {/* Session settings */}
          <StCard className="!p-[18px_20px]">
            <span className="text-[15px] font-extrabold block mb-4" style={{ color: ST.text }}>Tarifs & Durée</span>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-extrabold mb-[7px]" style={{ color: ST.textLabel }}>
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
                    className="w-full rounded-[12px] pr-14 pl-[14px] py-[11px] text-[13.5px] font-semibold bg-white focus:outline-none"
                    style={{ color: ST.text, border: "1px solid #dde6e0" }}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold" style={{ color: ST.textMuted }}>
                    FCFA
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-extrabold mb-[7px]" style={{ color: ST.textLabel }}>
                  Durée (minutes)
                </label>
                <select
                  value={form.sessionDuration}
                  onChange={(e) => setForm((p) => ({ ...p, sessionDuration: Number(e.target.value) }))}
                  className={SELECT_CLASS}
                  style={{ color: ST.text, border: "1px solid #dde6e0" }}
                >
                  {[30, 45, 60, 90, 120].map((d) => (
                    <option key={d} value={d}>{d} min</option>
                  ))}
                </select>
              </div>
            </div>
          </StCard>

          {/* Advanced booking settings */}
          <StCard className="!p-[18px_20px]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[15px] font-extrabold" style={{ color: ST.text }}>Réglages calendrier</span>
              <Link
                href="/mentor/calendrier"
                className="text-[12px] font-extrabold hover:underline flex items-center gap-1"
                style={{ color: ST.green }}
              >
                Configurer mes créneaux
                <ArrowRight size={13} />
              </Link>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-extrabold mb-[7px]" style={{ color: ST.textLabel }}>
                  Fuseau horaire
                </label>
                <select
                  value={form.timezone}
                  onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}
                  className={SELECT_CLASS}
                  style={{ color: ST.text, border: "1px solid #dde6e0" }}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.code} value={tz.code}>{tz.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-extrabold mb-[7px]" style={{ color: ST.textLabel }}>
                    Pause entre sessions
                  </label>
                  <select
                    value={form.sessionBuffer}
                    onChange={(e) => setForm((p) => ({ ...p, sessionBuffer: Number(e.target.value) }))}
                    className={SELECT_CLASS}
                    style={{ color: ST.text, border: "1px solid #dde6e0" }}
                  >
                    {[0, 5, 10, 15, 20, 30, 45, 60].map((b) => (
                      <option key={b} value={b}>{b === 0 ? "Aucune" : `${b} min`}</option>
                    ))}
                  </select>
                  <p className="text-[10px] font-semibold mt-1" style={{ color: ST.textMuted }}>Empêche les résa coup sur coup</p>
                </div>
                <div>
                  <label className="block text-[12px] font-extrabold mb-[7px]" style={{ color: ST.textLabel }}>
                    Délai min. de réservation
                  </label>
                  <select
                    value={form.bookingLeadTime}
                    onChange={(e) => setForm((p) => ({ ...p, bookingLeadTime: Number(e.target.value) }))}
                    className={SELECT_CLASS}
                    style={{ color: ST.text, border: "1px solid #dde6e0" }}
                  >
                    <option value={30}>30 min</option>
                    <option value={60}>1 heure</option>
                    <option value={120}>2 heures</option>
                    <option value={360}>6 heures</option>
                    <option value={720}>12 heures</option>
                    <option value={1440}>24 heures</option>
                    <option value={2880}>2 jours</option>
                  </select>
                  <p className="text-[10px] font-semibold mt-1" style={{ color: ST.textMuted }}>Temps mini avant qu&apos;un apprenant puisse réserver</p>
                </div>
              </div>
            </div>
          </StCard>

          {/* Languages */}
          <StCard className="!p-[18px_20px]">
            <span className="text-[15px] font-extrabold block mb-4" style={{ color: ST.text }}>Langues parlées</span>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => {
                const selected = form.languages.includes(lang.code);
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => toggleLanguage(lang.code)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[12px] font-extrabold transition-all"
                    style={
                      selected
                        ? { background: ST.green, color: "#fff", border: `2px solid ${ST.green}` }
                        : { background: "#fff", color: ST.textSecondary, border: `2px solid ${ST.cardBorder}` }
                    }
                  >
                    {lang.label}
                    {selected && <Check size={12} />}
                  </button>
                );
              })}
            </div>
          </StCard>

          {/* Cover image */}
          <StCard className="!p-[18px_20px]">
            <span className="text-[15px] font-extrabold block mb-4" style={{ color: ST.text }}>Photo de couverture</span>
            <div className="space-y-3">
              {form.coverImage && (
                <div className="h-28 rounded-[12px] overflow-hidden relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.coverImage} alt="Cover" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, coverImage: "" }))}
                    className="absolute top-2 right-2 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}

              <div>
                <label className="block text-[12px] font-extrabold mb-[7px]" style={{ color: ST.textLabel }}>
                  URL de l&apos;image (Cloudinary ou externe)
                </label>
                <input
                  type="url"
                  value={form.coverImage}
                  onChange={(e) => setForm((p) => ({ ...p, coverImage: e.target.value }))}
                  placeholder="https://res.cloudinary.com/…"
                  className={INPUT_CLASS}
                  style={{ color: ST.text, border: "1px solid #dde6e0" }}
                />
                <p className="text-[10px] font-semibold mt-1" style={{ color: ST.textMuted }}>
                  Recommandé : 1280×400 px. Laissez vide pour utiliser le dégradé par défaut.
                </p>
              </div>
            </div>
          </StCard>

          {/* Preview */}
          <StCard className="!p-[18px_20px]">
            <span className="text-[15px] font-extrabold block mb-4" style={{ color: ST.text }}>Aperçu de votre profil</span>
            <div className="rounded-[16px] overflow-hidden max-w-xs mx-auto bg-white" style={{ border: `1px solid ${ST.cardBorder}` }}>
              <div className="relative aspect-[4/3] overflow-hidden" style={{ background: ST.gradient }}>
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
                  className="absolute top-2 left-2 inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full backdrop-blur shadow-sm"
                  style={form.isAvailable ? { background: "rgba(34,197,94,.95)", color: "#fff" } : { background: "rgba(93,113,102,.95)", color: "#fff" }}
                >
                  <span className="w-1 h-1 rounded-full" style={{ background: form.isAvailable ? "#fff" : "#cbd5cd" }} />
                  {form.isAvailable ? "Disponible" : "Indisponible"}
                </span>

                <div className="absolute bottom-2 left-2 w-12 h-12 rounded-full ring-2 ring-white shadow-lg overflow-hidden flex items-center justify-center text-white" style={{ background: ST.gradient }}>
                  <User className="w-6 h-6" />
                </div>
              </div>

              <div className="p-4 flex flex-col gap-2">
                <div>
                  <p className="text-[13px] font-extrabold line-clamp-1" style={{ color: ST.text }}>
                    {form.specialty || "Votre spécialité"}
                  </p>
                  {form.domain && (
                    <div className="mt-1">
                      <StChip tone="neutral">{form.domain}</StChip>
                    </div>
                  )}
                </div>
                <p className="text-[11.5px] font-semibold line-clamp-2 leading-relaxed" style={{ color: ST.textSecondary }}>
                  {stripHtml(form.bio) || "Votre bio apparaîtra ici…"}
                </p>
                {form.languages.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {form.languages.map((code) => (
                      <span
                        key={code}
                        className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full"
                        style={{ background: "#f1efe8", color: "#5f5e5a" }}
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between mt-1 pt-2" style={{ borderTop: `1px solid ${ST.divider}` }}>
                  <p className="text-[13px] font-extrabold" style={{ color: ST.green }}>
                    {new Intl.NumberFormat("fr-FR").format(form.sessionPrice)}{" "}
                    <span className="text-[10px] font-bold" style={{ color: ST.textMuted }}>FCFA</span>
                  </p>
                  <span className="flex items-center gap-1 text-[11.5px] font-semibold" style={{ color: ST.textSecondary }}>
                    <Clock size={12} />
                    {form.sessionDuration} min
                  </span>
                </div>
              </div>
            </div>
          </StCard>

          {/* Save button */}
          <div className="pb-6">
            <StButton
              type="submit"
              disabled={saving}
              icon={saving ? Loader2 : Save}
              className="w-full"
            >
              {saving ? "Sauvegarde en cours…" : "Enregistrer le profil"}
            </StButton>

            <p className="text-center text-[11.5px] font-semibold mt-3" style={{ color: ST.textSecondary }}>
              Votre profil sera visible sur{" "}
              <Link href="/mentors" className="font-extrabold hover:underline" style={{ color: ST.green }}>
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
