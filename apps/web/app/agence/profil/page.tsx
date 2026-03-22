"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/store/toast";
import { useAgencyStore } from "@/store/agency";
import { profileApi } from "@/lib/api-client";
import { ImageUpload } from "@/components/ui/image-upload";

const SECTEURS = ["Développement Web", "Design & Créatif", "Marketing Digital", "Conseil IT", "Data & IA", "Mobile", "DevOps & Cloud"];
const TAILLES = ["1-5", "6-15", "16-50", "51-200", "200+"];
const LINK_ICONS: Record<string, { icon: string; label: string }> = {
  linkedin: { icon: "work", label: "LinkedIn" },
  twitter: { icon: "alternate_email", label: "Twitter / X" },
  website: { icon: "language", label: "Site Web" },
};

interface AgencyForm {
  logo: string; name: string; description: string; secteur: string; taille: string;
  pays: string; ville: string; siteWeb: string; siret: string;
  links: { linkedin: string; twitter: string; website: string };
  completionPercent: number;
}

const EMPTY_FORM: AgencyForm = {
  logo: "", name: "", description: "", secteur: "", taille: "",
  pays: "", ville: "", siteWeb: "", siret: "",
  links: { linkedin: "", twitter: "", website: "" }, completionPercent: 0,
};

function computeCompletion(f: AgencyForm): number {
  const fields = [f.logo, f.name, f.description, f.secteur, f.taille, f.pays, f.ville, f.links.linkedin || f.links.twitter || f.links.website];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

const inputCls = "w-full px-4 py-2.5 bg-neutral-dark border border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#14B835]";
const labelCls = "block text-xs font-semibold text-slate-400 mb-1";
const cardCls = "bg-neutral-dark border border-border-dark rounded-xl p-6";

export default function AgenceProfilPage() {
  const { data: session } = useSession();
  const addToast = useToastStore((s) => s.addToast);
  const { members, syncAll, isLoading: storeLoading } = useAgencyStore();
  const [form, setForm] = useState<AgencyForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"edition" | "preview">("edition");
  const [memberVis, setMemberVis] = useState<Record<string, boolean>>({});

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const p = await profileApi.get();
      setForm({
        logo: p.photo || "", name: session?.user?.name || [p.firstName, p.lastName].filter(Boolean).join(" ") || "",
        description: p.bio || "", secteur: p.title || "", taille: "", pays: p.country || "",
        ville: p.city || "", siteWeb: p.links?.portfolio || "", siret: "",
        links: { linkedin: p.links?.linkedin || "", twitter: p.links?.github || "", website: p.links?.portfolio || "" },
        completionPercent: p.completionPercent || 0,
      });
    } catch { /* new agency */ } finally { setLoading(false); }
  }, [session?.user?.name]);

  useEffect(() => { loadProfile(); }, [loadProfile]);
  useEffect(() => { syncAll(); }, [syncAll]);
  useEffect(() => {
    if (members.length > 0) {
      const vis: Record<string, boolean> = {};
      members.forEach((m) => { vis[m.id] = true; });
      setMemberVis((prev) => ({ ...vis, ...prev }));
    }
  }, [members]);
  useEffect(() => {
    const pct = computeCompletion(form);
    if (pct !== form.completionPercent) setForm((f) => ({ ...f, completionPercent: pct }));
  }, [form.logo, form.name, form.description, form.secteur, form.taille, form.pays, form.ville, form.links]);

  async function handleSave() {
    setSaving(true);
    try {
      await profileApi.update({
        firstName: form.name.split(" ")[0] || "", lastName: form.name.split(" ").slice(1).join(" ") || "",
        photo: form.logo, bio: form.description, title: form.secteur, city: form.ville, country: form.pays,
        links: { linkedin: form.links.linkedin, github: form.links.twitter, portfolio: form.links.website, behance: "" },
      });
      addToast("success", "Profil agence mis à jour avec succès !");
    } catch { addToast("error", "Erreur lors de la sauvegarde du profil."); }
    finally { setSaving(false); }
  }

  const visibleMembers = members.filter((m) => memberVis[m.id]);
  const set_ = (patch: Partial<AgencyForm>) => setForm((f) => ({ ...f, ...patch }));

  if (loading || storeLoading) return (
    <div className="max-w-3xl mx-auto flex items-center justify-center py-32">
      <span className="material-symbols-outlined text-4xl text-[#14B835] animate-spin">progress_activity</span>
    </div>
  );

  return (
    <div className="max-w-3xl w-full mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">{form.name || "Profil Agence"}</h2>
          <p className="text-slate-400 mt-1">Éditez les informations de votre agence visibles publiquement.</p>
        </div>
        <div className="flex gap-1 bg-neutral-dark rounded-xl p-1 flex-shrink-0">
          {(["edition", "preview"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5",
                activeTab === tab ? "bg-[#14B835]/10 text-[#14B835]" : "text-slate-500 hover:text-slate-300")}>
              <span className="material-symbols-outlined text-base">{tab === "edition" ? "edit" : "visibility"}</span>
              {tab === "edition" ? "Édition" : "Prévisualisation"}
            </button>
          ))}
        </div>
      </div>

      {/* ============ PREVIEW ============ */}
      {activeTab === "preview" && (<div className="space-y-6">
        <div className="bg-neutral-dark border border-border-dark rounded-xl overflow-hidden">
          <div className="min-h-[160px] bg-gradient-to-r from-[#14B835]/20 via-[#14B835]/10 to-neutral-dark flex items-center justify-center">
            <span className="material-symbols-outlined text-6xl text-[#14B835]/20">apartment</span>
          </div>
          <div className="relative px-6 pb-6">
            <div className="flex items-end gap-5 -mt-12">
              {form.logo
                ? <img src={form.logo} alt={form.name} className="w-24 h-24 rounded-xl border-4 border-neutral-dark object-cover flex-shrink-0" />
                : <div className="w-24 h-24 rounded-xl border-4 border-neutral-dark bg-[#14B835]/20 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-3xl text-[#14B835]">apartment</span>
                  </div>}
              <div className="pb-1 flex-1 min-w-0">
                <h3 className="text-xl font-black text-white">{form.name || "Nom de l'agence"}</h3>
                <p className="text-sm text-[#14B835] font-semibold">{form.secteur}</p>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                  {(form.ville || form.pays) && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">location_on</span>{[form.ville, form.pays].filter(Boolean).join(", ")}</span>}
                  {form.taille && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">groups</span>{form.taille} membres</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {form.description && (<div className={cardCls}>
          <h4 className="font-bold text-lg mb-3 flex items-center gap-2"><span className="material-symbols-outlined text-[#14B835]">info</span>À propos</h4>
          <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{form.description}</div>
        </div>)}

        <div className={cardCls}>
          <h4 className="font-bold text-lg mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-[#14B835]">groups</span>Équipe ({visibleMembers.length} membres publics)</h4>
          {visibleMembers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {visibleMembers.map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-3 bg-neutral-dark rounded-lg border border-border-dark">
                  <div className="w-10 h-10 rounded-full bg-[#14B835]/20 flex items-center justify-center text-[#14B835] text-sm font-bold flex-shrink-0">{m.name.split(" ").map((n) => n[0]).join("")}</div>
                  <div className="min-w-0"><p className="text-sm font-bold text-white truncate">{m.name}</p><p className="text-xs text-slate-400 truncate">{m.role}</p></div>
                </div>))}
            </div>
          ) : <p className="text-sm text-slate-500">Aucun membre public.</p>}
        </div>

        {Object.values(form.links).some(Boolean) && (<div className={cardCls}>
          <h4 className="font-bold text-lg mb-3 flex items-center gap-2"><span className="material-symbols-outlined text-[#14B835]">link</span>Liens</h4>
          <div className="flex flex-wrap gap-3">
            {(Object.entries(form.links) as [string, string][]).filter(([, v]) => v).map(([key, url]) => (
              <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-dark border border-border-dark rounded-lg text-sm font-semibold text-slate-300 hover:border-[#14B835]/30 hover:text-[#14B835] transition-all">
                <span className="material-symbols-outlined text-lg">{LINK_ICONS[key]?.icon}</span>{LINK_ICONS[key]?.label}
                <span className="material-symbols-outlined text-sm text-slate-500">open_in_new</span>
              </a>))}
          </div>
        </div>)}

        <div className="grid grid-cols-3 gap-4">
          {[{ icon: "verified", value: `${form.completionPercent}%`, label: "Profil complété", color: "text-[#14B835]" },
            { icon: "groups", value: form.taille || "—", label: "Membres", color: "text-emerald-400" },
            { icon: "location_on", value: form.ville || "—", label: form.pays || "Localisation", color: "text-blue-400" },
          ].map((s) => (
            <div key={s.label} className="bg-neutral-dark border border-border-dark rounded-xl p-4 text-center">
              <span className={cn("material-symbols-outlined text-2xl mb-1", s.color)}>{s.icon}</span>
              <p className={cn("text-xl font-black", s.color)}>{s.value}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{s.label}</p>
            </div>))}
        </div>

        <button onClick={() => setActiveTab("edition")} className="w-full py-3 bg-[#14B835]/10 text-[#14B835] font-bold rounded-lg hover:bg-[#14B835]/20 transition-all flex items-center justify-center gap-2">
          <span className="material-symbols-outlined">edit</span>Retour à l&apos;édition
        </button>
      </div>)}

      {/* ============ EDITION ============ */}
      {activeTab === "edition" && (<>
        <div className="bg-neutral-dark border border-[#14B835]/30 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold">Complétion du profil</p>
            <span className="text-[#14B835] font-bold">{form.completionPercent}%</span>
          </div>
          <div className="w-full h-2 bg-border-dark rounded-full overflow-hidden">
            <div className="h-full bg-[#14B835] rounded-full transition-all" style={{ width: `${form.completionPercent}%` }} />
          </div>
        </div>

        <div className={cn(cardCls, "space-y-6")}>
          <h3 className="font-bold text-lg">Informations de l&apos;agence</h3>
          <div className="flex items-center gap-6">
            <ImageUpload currentImage={form.logo} onUpload={(url) => set_({ logo: url })}
              aspectRatio="aspect-square" className="w-20 h-20 flex-shrink-0" placeholder="Logo" rounded />
            <div><p className="font-bold">{form.name || "Nom de l'agence"}</p><p className="text-sm text-slate-400">{form.secteur || "Secteur"}</p></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={labelCls}>Nom de l&apos;agence</label>
              <input value={form.name} onChange={(e) => set_({ name: e.target.value })} className={inputCls} /></div>
            <div><label className={labelCls}>Secteur d&apos;activité</label>
              <select value={form.secteur} onChange={(e) => set_({ secteur: e.target.value })} className={inputCls}>
                <option value="">Sélectionnez un secteur</option>
                {SECTEURS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select></div>
            <div><label className={labelCls}>Taille de l&apos;équipe</label>
              <select value={form.taille} onChange={(e) => set_({ taille: e.target.value })} className={inputCls}>
                <option value="">Sélectionnez une taille</option>
                {TAILLES.map((t) => <option key={t} value={t}>{t} personnes</option>)}
              </select></div>
            <div><label className={labelCls}>SIRET (optionnel)</label>
              <input value={form.siret} onChange={(e) => set_({ siret: e.target.value })} placeholder="Ex: 123 456 789 00012" className={inputCls} /></div>
          </div>
          <div><label className={labelCls}>Description</label>
            <textarea value={form.description} onChange={(e) => set_({ description: e.target.value })} rows={4}
              placeholder="Décrivez votre agence, vos spécialités et votre équipe..." className={cn(inputCls, "resize-none")} /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={labelCls}>Ville</label>
              <input value={form.ville} onChange={(e) => set_({ ville: e.target.value })} className={inputCls} /></div>
            <div><label className={labelCls}>Pays</label>
              <input value={form.pays} onChange={(e) => set_({ pays: e.target.value })} className={inputCls} /></div>
          </div>
        </div>

        <div className={cn(cardCls, "space-y-4")}>
          <h3 className="font-bold text-lg">Liens externes</h3>
          <div className="grid grid-cols-1 gap-4">
            {(["linkedin", "twitter", "website"] as const).map((key) => (
              <div key={key}><label className={labelCls}>{LINK_ICONS[key]?.label}</label>
                <input value={form.links[key]} onChange={(e) => setForm((f) => ({ ...f, links: { ...f.links, [key]: e.target.value } }))}
                  placeholder="https://..." className={inputCls} /></div>))}
          </div>
        </div>

        {members.length > 0 && (<div className={cn(cardCls, "space-y-4")}>
          <h3 className="font-bold text-lg flex items-center gap-2"><span className="material-symbols-outlined text-[#14B835]">groups</span>Membres de l&apos;équipe ({members.length})</h3>
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3 border border-border-dark rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#14B835]/20 flex items-center justify-center text-[#14B835] text-xs font-bold flex-shrink-0">{m.name.split(" ").map((n) => n[0]).join("")}</div>
                  <div><p className="text-sm font-bold text-white">{m.name}</p><p className="text-xs text-slate-400">{m.role}</p></div>
                </div>
                <button onClick={() => setMemberVis((prev) => ({ ...prev, [m.id]: !prev[m.id] }))}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                    memberVis[m.id] ? "bg-[#14B835]/10 text-[#14B835]" : "bg-slate-800 text-slate-500")}>
                  <span className="material-symbols-outlined text-sm">{memberVis[m.id] ? "visibility" : "visibility_off"}</span>
                  {memberVis[m.id] ? "Visible" : "Masqué"}
                </button>
              </div>))}
          </div>
        </div>)}

        <button onClick={handleSave} disabled={saving}
          className="w-full py-3 bg-[#14B835] text-white font-bold rounded-lg hover:bg-[#14B835]/90 disabled:opacity-50 shadow-lg shadow-[#14B835]/20 transition-all flex items-center justify-center gap-2">
          {saving && <span className="material-symbols-outlined animate-spin">progress_activity</span>}
          {saving ? "Sauvegarde..." : "Enregistrer les modifications"}
        </button>
      </>)}
    </div>
  );
}
