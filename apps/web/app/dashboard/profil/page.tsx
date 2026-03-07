"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useDashboardStore, useToastStore } from "@/store/dashboard";

const SKILL_LEVELS = ["debutant", "intermediaire", "expert"] as const;

export default function ProfilPage() {
  const { profile, updateProfile, apiSaveProfile } = useDashboardStore();
  const addToast = useToastStore((s) => s.addToast);
  const [form, setForm] = useState(profile);
  const [saving, setSaving] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState<"debutant" | "intermediaire" | "expert">("intermediaire");

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

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight">Mon Profil</h2>
        <p className="text-slate-400 mt-1">Completez votre profil pour attirer plus de clients.</p>
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
          <div className="relative">
            <img src={form.photo} alt="Photo" className="w-20 h-20 rounded-full object-cover bg-neutral-dark" />
            <button onClick={() => {
              const url = prompt("URL de la photo :");
              if (url) setForm((f) => ({ ...f, photo: url }));
            }} className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center text-xs">
              <span className="material-symbols-outlined text-sm">edit</span>
            </button>
          </div>
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
