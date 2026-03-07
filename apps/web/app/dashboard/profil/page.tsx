"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useDashboardStore, useToastStore } from "@/store/dashboard";
import { ImageUpload } from "@/components/ui/image-upload";

const SKILL_LEVELS = ["debutant", "intermediaire", "expert"] as const;
const LANGUAGE_LEVELS = ["Natif", "Courant", "Avancé", "Intermédiaire", "Débutant"] as const;
const EDUCATION_TYPES = ["diplome", "certificat", "formation"] as const;
const EDU_TYPE_LABELS: Record<string, string> = { diplome: "Diplôme", certificat: "Certificat", formation: "Formation" };
const EDU_TYPE_ICONS: Record<string, string> = { diplome: "school", certificat: "workspace_premium", formation: "menu_book" };

export default function ProfilPage() {
  const { profile, updateProfile, apiSaveProfile } = useDashboardStore();
  const addToast = useToastStore((s) => s.addToast);
  const [form, setForm] = useState(profile);
  const [saving, setSaving] = useState(false);
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
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight">Mon Profil</h2>
        <p className="text-slate-400 mt-1">Completez votre profil pour attirer plus de clients.</p>
      </div>

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
    </div>
  );
}
