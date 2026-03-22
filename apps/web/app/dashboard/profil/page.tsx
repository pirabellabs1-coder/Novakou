"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useDashboardStore, useToastStore } from "@/store/dashboard";
import { ImageUpload } from "@/components/ui/image-upload";

const SKILL_LEVELS = ["debutant", "intermediaire", "expert"] as const;
const LANGUAGE_LEVELS = ["Natif", "Courant", "Avancé", "Intermédiaire", "Débutant"] as const;
const EDUCATION_TYPES = ["diplome", "certificat", "formation"] as const;
const EDU_TYPE_LABELS: Record<string, string> = { diplome: "Diplôme", certificat: "Certificat", formation: "Formation" };
const EDU_TYPE_ICONS: Record<string, string> = { diplome: "school", certificat: "workspace_premium", formation: "menu_book" };
const SKILL_LEVEL_PERCENT: Record<string, number> = { expert: 95, intermediaire: 70, debutant: 40 };
const SKILL_LEVEL_LABELS: Record<string, string> = { expert: "Expert", intermediaire: "Intermédiaire", debutant: "Débutant" };
const LINK_ICONS: Record<string, { icon: string; label: string }> = {
  linkedin: { icon: "work", label: "LinkedIn" },
  github: { icon: "code", label: "GitHub" },
  portfolio: { icon: "language", label: "Portfolio" },
  behance: { icon: "palette", label: "Behance" },
};

// Profil par defaut securise pour eviter les crashes si le store n'est pas charge
const SAFE_DEFAULTS = {
  skills: [] as { name: string; level: string }[],
  languages: [] as { name: string; level: string }[],
  education: [] as { title: string; school: string; year: string; type: string }[],
  links: { linkedin: "", github: "", portfolio: "", behance: "" },
  firstName: "", lastName: "", username: "", email: "", phone: "",
  photo: "", coverPhoto: "", title: "", bio: "", city: "", country: "",
  hourlyRate: 0, completionPercent: 0,
};

export default function ProfilPage() {
  const { profile, updateProfile, apiSaveProfile, syncFromApi } = useDashboardStore();
  const addToast = useToastStore((s) => s.addToast);
  const [form, setForm] = useState(() => ({
    ...SAFE_DEFAULTS,
    ...profile,
    skills: Array.isArray(profile?.skills) ? profile.skills : SAFE_DEFAULTS.skills,
    languages: Array.isArray(profile?.languages) ? profile.languages : SAFE_DEFAULTS.languages,
    education: Array.isArray(profile?.education) ? profile.education : SAFE_DEFAULTS.education,
    links: profile?.links && typeof profile.links === "object" ? { ...SAFE_DEFAULTS.links, ...profile.links } : SAFE_DEFAULTS.links,
  }));
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"edition" | "preview">("edition");
  const hasSynced = useRef(false);

  // Sync profile from API on mount to ensure data persists after refresh
  useEffect(() => {
    if (!hasSynced.current) {
      hasSynced.current = true;
      syncFromApi();
    }
  }, [syncFromApi]);

  // Re-initialize form when profile is loaded/updated from API
  useEffect(() => {
    if (profile && (profile.firstName || profile.email)) {
      setForm({
        ...SAFE_DEFAULTS,
        ...profile,
        // Ensure arrays are never undefined (prevents .map() crashes)
        skills: Array.isArray(profile.skills) ? profile.skills : SAFE_DEFAULTS.skills,
        languages: Array.isArray(profile.languages) ? profile.languages : SAFE_DEFAULTS.languages,
        education: Array.isArray(profile.education) ? profile.education : SAFE_DEFAULTS.education,
        links: profile.links && typeof profile.links === "object" ? { ...SAFE_DEFAULTS.links, ...profile.links } : SAFE_DEFAULTS.links,
      });
    }
  }, [profile]);
  const [newSkill, setNewSkill] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState<"debutant" | "intermediaire" | "expert">("intermediaire");

  // Languages
  const [newLanguage, setNewLanguage] = useState("");
  const [newLanguageLevel, setNewLanguageLevel] = useState<string>("Courant");

  // Education
  const [newEduTitle, setNewEduTitle] = useState("");
  const [newEduSchool, setNewEduSchool] = useState("");
  const [newEduYear, setNewEduYear] = useState("");
  const [newEduType, setNewEduType] = useState<"diplome" | "certificat" | "formation">("diplome");

  async function handleSave() {
    setSaving(true);
    try {
      const success = await apiSaveProfile(form);
      if (success) {
        addToast("success", "Profil mis à jour avec succès !");
      } else {
        // Fallback to local update
        updateProfile(form);
        addToast("success", "Profil mis à jour localement");
      }
    } catch {
      updateProfile(form);
      addToast("success", "Profil mis à jour localement");
    } finally {
      setSaving(false);
    }
  }

  function addSkill() {
    if (!newSkill.trim()) return;
    if (form.skills.some((s) => s.name.toLowerCase() === newSkill.toLowerCase())) {
      addToast("warning", "Cette competence existe deja");
      return;
    }
    setForm((f) => ({ ...f, skills: [...f.skills, { name: newSkill.trim(), level: newSkillLevel }] }));
    setNewSkill("");
  }

  function removeSkill(name: string) {
    setForm((f) => ({ ...f, skills: f.skills.filter((s) => s.name !== name) }));
  }

  function addLanguage() {
    if (!newLanguage.trim()) return;
    if (form.languages.some((l) => l.name.toLowerCase() === newLanguage.toLowerCase())) {
      addToast("warning", "Cette langue existe déjà");
      return;
    }
    setForm((f) => ({ ...f, languages: [...f.languages, { name: newLanguage.trim(), level: newLanguageLevel }] }));
    setNewLanguage("");
  }

  function removeLanguage(name: string) {
    setForm((f) => ({ ...f, languages: f.languages.filter((l) => l.name !== name) }));
  }

  function addEducation() {
    if (!newEduTitle.trim() || !newEduSchool.trim() || !newEduYear.trim()) {
      addToast("warning", "Veuillez remplir tous les champs de formation");
      return;
    }
    setForm((f) => ({
      ...f,
      education: [...(f.education || []), { title: newEduTitle.trim(), school: newEduSchool.trim(), year: newEduYear.trim(), type: newEduType }],
    }));
    setNewEduTitle("");
    setNewEduSchool("");
    setNewEduYear("");
  }

  function removeEducation(idx: number) {
    setForm((f) => ({ ...f, education: (f.education || []).filter((_, i) => i !== idx) }));
  }

  return (
    <div className="max-w-3xl w-full mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">Mon Profil</h2>
          <p className="text-slate-400 mt-1">Completez votre profil pour attirer plus de clients.</p>
        </div>
        <div className="flex gap-1 bg-neutral-dark rounded-xl p-1 flex-shrink-0">
          <button
            onClick={() => setActiveTab("edition")}
            className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5",
              activeTab === "edition" ? "bg-primary/10 text-primary" : "text-slate-500 hover:text-slate-300"
            )}
          >
            <span className="material-symbols-outlined text-base">edit</span>
            Édition
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5",
              activeTab === "preview" ? "bg-primary/10 text-primary" : "text-slate-500 hover:text-slate-300"
            )}
          >
            <span className="material-symbols-outlined text-base">visibility</span>
            Prévisualisation
          </button>
        </div>
      </div>

      {/* ================================================================== */}
      {/* PREVIEW MODE                                                        */}
      {/* ================================================================== */}
      {activeTab === "preview" && (
        <div className="space-y-6">
          {/* Hero */}
          <div className="bg-background-dark/50 border border-border-dark rounded-xl overflow-hidden">
            <div
              className="min-h-[200px] bg-cover bg-center relative"
              style={{ backgroundImage: form.coverPhoto ? `url(${form.coverPhoto})` : undefined, backgroundColor: form.coverPhoto ? undefined : "#1e293b" }}
            >
              {!form.coverPhoto && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-slate-600">image</span>
                </div>
              )}
            </div>
            <div className="relative px-6 pb-6">
              <div className="flex items-end gap-5 -mt-12">
                {form.photo ? (
                  <img src={form.photo} alt={form.firstName} className="w-24 h-24 rounded-full border-4 border-background-dark object-cover flex-shrink-0" />
                ) : (
                  <div className="w-24 h-24 rounded-full border-4 border-background-dark bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl font-black text-primary">{(form.firstName?.[0] || "")}{(form.lastName?.[0] || "")}</span>
                  </div>
                )}
                <div className="pb-1 flex-1 min-w-0">
                  <h3 className="text-xl font-black text-white">{form.firstName} {form.lastName}</h3>
                  <p className="text-sm text-primary font-semibold">{form.title || "Titre non renseigné"}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                    {(form.city || form.country) && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">location_on</span>
                        {[form.city, form.country].filter(Boolean).join(", ")}
                      </span>
                    )}
                    {form.hourlyRate > 0 && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">payments</span>
                        €{form.hourlyRate}/h
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          {form.bio && (
            <div className="bg-background-dark/50 border border-border-dark rounded-xl p-6">
              <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">person</span>
                À propos
              </h4>
              <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{form.bio}</div>
            </div>
          )}

          {/* Skills */}
          {form.skills.length > 0 && (
            <div className="bg-background-dark/50 border border-border-dark rounded-xl p-6">
              <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">code</span>
                Compétences
              </h4>
              <div className="space-y-3">
                {form.skills.map((s) => (
                  <div key={s.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-slate-200">{s.name}</span>
                      <span className={cn("text-[10px] font-bold uppercase px-1.5 py-0.5 rounded",
                        s.level === "expert" ? "bg-emerald-500/10 text-emerald-400" :
                        s.level === "intermediaire" ? "bg-blue-500/10 text-blue-400" : "bg-slate-500/10 text-slate-400"
                      )}>{SKILL_LEVEL_LABELS[s.level]}</span>
                    </div>
                    <div className="w-full h-2 bg-border-dark rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all",
                          s.level === "expert" ? "bg-emerald-500" : s.level === "intermediaire" ? "bg-blue-500" : "bg-slate-500"
                        )}
                        style={{ width: `${SKILL_LEVEL_PERCENT[s.level]}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {form.languages.length > 0 && (
            <div className="bg-background-dark/50 border border-border-dark rounded-xl p-6">
              <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">translate</span>
                Langues
              </h4>
              <div className="flex flex-wrap gap-2">
                {form.languages.map((l) => (
                  <span key={l.name} className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-sm">
                    <span className="material-symbols-outlined text-sm text-primary">translate</span>
                    <span className="font-semibold">{l.name}</span>
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary/80">{l.level}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {(form.education || []).length > 0 && (
            <div className="bg-background-dark/50 border border-border-dark rounded-xl p-6">
              <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">school</span>
                Formation & Certifications
              </h4>
              <div className="space-y-3">
                {(form.education || []).map((e, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-neutral-dark rounded-lg border border-border-dark">
                    <span className={cn("material-symbols-outlined text-xl mt-0.5",
                      e.type === "diplome" ? "text-blue-400" : e.type === "certificat" ? "text-emerald-400" : "text-amber-400"
                    )}>{EDU_TYPE_ICONS[e.type]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-100">{e.title}</p>
                      <p className="text-xs text-slate-400">{e.school} · {e.year}</p>
                      <span className={cn("inline-block mt-1 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded",
                        e.type === "diplome" ? "bg-blue-500/10 text-blue-400" :
                        e.type === "certificat" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                      )}>{EDU_TYPE_LABELS[e.type]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          {Object.entries(form.links).some(([, v]) => v) && (
            <div className="bg-background-dark/50 border border-border-dark rounded-xl p-6">
              <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">link</span>
                Liens
              </h4>
              <div className="flex flex-wrap gap-3">
                {(Object.entries(form.links) as [string, string][])
                  .filter(([, v]) => v)
                  .map(([key, url]) => (
                    <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-dark border border-border-dark rounded-lg text-sm font-semibold text-slate-300 hover:border-primary/30 hover:text-primary transition-all"
                    >
                      <span className="material-symbols-outlined text-lg">{LINK_ICONS[key]?.icon}</span>
                      {LINK_ICONS[key]?.label}
                      <span className="material-symbols-outlined text-sm text-slate-500">open_in_new</span>
                    </a>
                  ))}
              </div>
            </div>
          )}

          {/* Stats summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-background-dark/50 border border-border-dark rounded-xl p-4 text-center">
              <span className="material-symbols-outlined text-2xl text-primary mb-1">verified</span>
              <p className="text-xl font-black text-primary">{form.completionPercent}%</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Profil complété</p>
            </div>
            <div className="bg-background-dark/50 border border-border-dark rounded-xl p-4 text-center">
              <span className="material-symbols-outlined text-2xl text-emerald-400 mb-1">payments</span>
              <p className="text-xl font-black text-emerald-400">€{form.hourlyRate}/h</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Tarif horaire</p>
            </div>
            <div className="bg-background-dark/50 border border-border-dark rounded-xl p-4 text-center">
              <span className="material-symbols-outlined text-2xl text-blue-400 mb-1">location_on</span>
              <p className="text-sm font-black text-blue-400">{form.city || "—"}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{form.country || "Localisation"}</p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab("edition")}
            className="w-full py-3 bg-primary/10 text-primary font-bold rounded-lg hover:bg-primary/20 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">edit</span>
            Retour à l&apos;édition
          </button>
        </div>
      )}

      {/* ================================================================== */}
      {/* EDITION MODE                                                        */}
      {/* ================================================================== */}
      {activeTab === "edition" && (<>

      {/* Cover Photo */}
      <div className="bg-background-dark/50 border border-border-dark rounded-xl overflow-hidden">
        <ImageUpload
          currentImage={form.coverPhoto}
          onUpload={(url) => setForm((f) => ({ ...f, coverPhoto: url }))}
          aspectRatio="aspect-[4/1]"
          placeholder="Ajouter une photo de couverture (recommandé : 1200x300)"
          className="w-full"
        />
      </div>

      {/* Completion Bar */}
      <div className="bg-background-dark/50 border border-primary/30 rounded-xl p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold">Completion du profil</p>
          <span className="text-primary font-bold">{form.completionPercent}%</span>
        </div>
        <div className="w-full h-2 bg-border-dark rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${form.completionPercent}%` }} />
        </div>
      </div>

      {/* Photo & Basic Info */}
      <div className="bg-background-dark/50 border border-border-dark rounded-xl p-6 space-y-6">
        <h3 className="font-bold text-lg">Informations personnelles</h3>
        <div className="flex items-center gap-6">
          <ImageUpload
            currentImage={form.photo}
            onUpload={(url) => setForm((f) => ({ ...f, photo: url }))}
            aspectRatio="aspect-square"
            className="w-20 h-20 flex-shrink-0"
            placeholder="Photo"
            rounded
          />
          <div>
            <p className="font-bold">{form.firstName} {form.lastName}</p>
            <p className="text-sm text-slate-400">@{form.username}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Prenom</label>
            <input value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              className="w-full px-4 py-2.5 bg-neutral-dark border border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Nom</label>
            <input value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              className="w-full px-4 py-2.5 bg-neutral-dark border border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Email</label>
            <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-4 py-2.5 bg-neutral-dark border border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Telephone</label>
            <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full px-4 py-2.5 bg-neutral-dark border border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Titre professionnel</label>
          <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full px-4 py-2.5 bg-neutral-dark border border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Bio</label>
          <textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} rows={4}
            className="w-full px-4 py-2.5 bg-neutral-dark border border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary resize-none" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Ville</label>
            <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              className="w-full px-4 py-2.5 bg-neutral-dark border border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Pays</label>
            <input value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
              className="w-full px-4 py-2.5 bg-neutral-dark border border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Tarif horaire (€)</label>
            <input type="number" value={form.hourlyRate} onChange={(e) => setForm((f) => ({ ...f, hourlyRate: Number(e.target.value) }))}
              className="w-full px-4 py-2.5 bg-neutral-dark border border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="bg-background-dark/50 border border-border-dark rounded-xl p-6 space-y-4">
        <h3 className="font-bold text-lg">Competences</h3>
        <div className="flex flex-wrap gap-2">
          {form.skills.map((s) => (
            <span key={s.name} className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-sm">
              <span className="font-semibold">{s.name}</span>
              <span className={cn("text-[10px] font-bold uppercase px-1.5 py-0.5 rounded",
                s.level === "expert" ? "bg-emerald-500/10 text-emerald-400" :
                s.level === "intermediaire" ? "bg-blue-500/10 text-blue-400" : "bg-slate-500/10 text-slate-400"
              )}>{s.level}</span>
              <button onClick={() => removeSkill(s.name)} className="text-slate-400 hover:text-red-400">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={newSkill} onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
            placeholder="Nouvelle competence..."
            className="flex-1 px-3 py-2 bg-neutral-dark border border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" />
          <select value={newSkillLevel} onChange={(e) => setNewSkillLevel(e.target.value as typeof newSkillLevel)}
            className="px-3 py-2 bg-neutral-dark border border-border-dark rounded-lg text-sm outline-none">
            {SKILL_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <button onClick={addSkill} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90">
            <span className="material-symbols-outlined text-lg">add</span>
          </button>
        </div>
      </div>

      {/* Languages */}
      <div className="bg-background-dark/50 border border-border-dark rounded-xl p-6 space-y-4">
        <h3 className="font-bold text-lg">Langues parlées</h3>
        <div className="flex flex-wrap gap-2">
          {form.languages.map((l) => (
            <span key={l.name} className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-sm">
              <span className="material-symbols-outlined text-sm text-primary">translate</span>
              <span className="font-semibold">{l.name}</span>
              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary/80">{l.level}</span>
              <button onClick={() => removeLanguage(l.name)} className="text-slate-400 hover:text-red-400">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </span>
          ))}
          {form.languages.length === 0 && (
            <p className="text-sm text-slate-500">Aucune langue ajoutée</p>
          )}
        </div>
        <div className="flex gap-2">
          <input value={newLanguage} onChange={(e) => setNewLanguage(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLanguage(); } }}
            placeholder="Ex: Français, Anglais, Arabe..."
            className="flex-1 px-3 py-2 bg-neutral-dark border border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" />
          <select value={newLanguageLevel} onChange={(e) => setNewLanguageLevel(e.target.value)}
            className="px-3 py-2 bg-neutral-dark border border-border-dark rounded-lg text-sm outline-none">
            {LANGUAGE_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <button onClick={addLanguage} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90">
            <span className="material-symbols-outlined text-lg">add</span>
          </button>
        </div>
      </div>

      {/* Education */}
      <div className="bg-background-dark/50 border border-border-dark rounded-xl p-6 space-y-4">
        <h3 className="font-bold text-lg">Formation & Certifications</h3>
        {(form.education || []).length > 0 ? (
          <div className="space-y-3">
            {(form.education || []).map((e, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-neutral-dark rounded-lg border border-border-dark">
                <span className={cn("material-symbols-outlined text-xl mt-0.5",
                  e.type === "diplome" ? "text-blue-400" : e.type === "certificat" ? "text-emerald-400" : "text-amber-400"
                )}>{EDU_TYPE_ICONS[e.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-100">{e.title}</p>
                  <p className="text-xs text-slate-400">{e.school} · {e.year}</p>
                  <span className={cn("inline-block mt-1 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded",
                    e.type === "diplome" ? "bg-blue-500/10 text-blue-400" :
                    e.type === "certificat" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                  )}>{EDU_TYPE_LABELS[e.type]}</span>
                </div>
                <button onClick={() => removeEducation(idx)} className="text-slate-400 hover:text-red-400 flex-shrink-0">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Aucune formation ajoutée</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input value={newEduTitle} onChange={(e) => setNewEduTitle(e.target.value)}
            placeholder="Titre (ex: Master Informatique)"
            className="px-3 py-2 bg-neutral-dark border border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" />
          <input value={newEduSchool} onChange={(e) => setNewEduSchool(e.target.value)}
            placeholder="Établissement"
            className="px-3 py-2 bg-neutral-dark border border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" />
          <input value={newEduYear} onChange={(e) => setNewEduYear(e.target.value)}
            placeholder="Année (ex: 2023)"
            className="px-3 py-2 bg-neutral-dark border border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" />
          <div className="flex gap-2">
            <select value={newEduType} onChange={(e) => setNewEduType(e.target.value as typeof newEduType)}
              className="flex-1 px-3 py-2 bg-neutral-dark border border-border-dark rounded-lg text-sm outline-none">
              {EDUCATION_TYPES.map((t) => <option key={t} value={t}>{EDU_TYPE_LABELS[t]}</option>)}
            </select>
            <button onClick={addEducation} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90">
              <span className="material-symbols-outlined text-lg">add</span>
            </button>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="bg-background-dark/50 border border-border-dark rounded-xl p-6 space-y-4">
        <h3 className="font-bold text-lg">Liens externes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(["linkedin", "github", "portfolio", "behance"] as const).map((key) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-slate-400 mb-1 capitalize">{key}</label>
              <input value={form.links[key]} onChange={(e) => setForm((f) => ({ ...f, links: { ...f.links, [key]: e.target.value } }))}
                placeholder={`https://${key}.com/...`}
                className="w-full px-4 py-2.5 bg-neutral-dark border border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" />
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <button onClick={handleSave} disabled={saving}
        className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 disabled:opacity-50 shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2">
        {saving && <span className="material-symbols-outlined animate-spin">progress_activity</span>}
        {saving ? "Sauvegarde..." : "Enregistrer les modifications"}
      </button>

      </>)}
    </div>
  );
}
