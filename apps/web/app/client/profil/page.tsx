"use client";

import { useState, useEffect, useRef } from "react";
import { useClientStore } from "@/store/client";
import { profileApi, uploadApi } from "@/lib/api-client";
import { useToastStore } from "@/store/toast";

export default function ClientProfile() {
  const { addToast } = useToastStore();
  const { updateProfile } = useClientStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    bio: "",
    company: "",
    website: "",
    sector: "",
    teamSize: "",
    country: "",
    city: "",
    phone: "",
  });

  const [completionItems, setCompletionItems] = useState<{ label: string; done: boolean }[]>([]);

  useEffect(() => {
    setFetching(true);
    profileApi
      .get()
      .then((profile) => {
        setForm({
          fullName: [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "",
          email: profile.email || "",
          bio: profile.bio || "",
          company: "",
          website: profile.links?.portfolio || "",
          sector: "",
          teamSize: "",
          country: profile.country || "",
          city: profile.city || "",
          phone: profile.phone || "",
        });
        setAvatarUrl(profile.photo || "");

        // Calculate completion dynamically
        const items = [
          { label: "Email vérifié", done: true }, // Always true since user is logged in
          { label: "Nom renseigné", done: !!(profile.firstName || profile.name) },
          { label: "Photo de profil ajoutée", done: !!profile.photo },
          { label: "Bio renseignée", done: !!profile.bio },
          { label: "Pays renseigné", done: !!profile.country },
        ];
        setCompletionItems(items);
      })
      .catch(() => {
        // Keep default empty values on error
      })
      .finally(() => setFetching(false));
  }, []);

  function update(key: string, val: string) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      addToast("error", "Veuillez sélectionner une image (JPG, PNG, WebP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      addToast("error", "L'image ne doit pas dépasser 5 Mo");
      return;
    }

    setUploading(true);
    try {
      const result = await uploadApi.file(file, "avatar");
      const url = result?.file?.url;
      if (!url) throw new Error("URL manquante dans la réponse upload");
      setAvatarUrl(url);
      // Update the profile with the new avatar URL
      await profileApi.update({ photo: url });
      addToast("success", "Photo de profil mise à jour !");
    } catch (err) {
      console.error("[Client profil upload]", err);
      addToast("error", "Erreur lors de l'upload de la photo");
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function save() {
    setSaving(true);
    const nameParts = form.fullName.trim().split(/\s+/);
    const success = await updateProfile({
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" ") || "",
      email: form.email,
      bio: form.bio,
      phone: form.phone,
      city: form.city,
      country: form.country,
    });
    setSaving(false);
    if (success) {
      addToast("success", "Profil mis à jour avec succès !");
    } else {
      addToast("error", "Erreur lors de la mise à jour du profil");
    }
  }

  const initials = form.fullName
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "??";

  const completionPercent = completionItems.length > 0
    ? Math.round((completionItems.filter(i => i.done).length / completionItems.length) * 100)
    : 0;

  if (fetching) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="h-8 w-48 bg-border-dark rounded animate-pulse" />
            <div className="h-4 w-72 bg-border-dark rounded mt-2 animate-pulse" />
          </div>
        </div>
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-6 animate-pulse">
          <div className="flex items-center gap-5">
            <div className="w-24 h-24 rounded-full bg-border-dark" />
            <div className="space-y-2">
              <div className="h-6 w-40 bg-border-dark rounded" />
              <div className="h-4 w-32 bg-border-dark rounded" />
            </div>
          </div>
        </div>
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-6 animate-pulse">
          <div className="h-6 w-56 bg-border-dark rounded mb-5" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-border-dark rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleAvatarUpload}
      />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">Mon Profil</h1>
          <p className="text-slate-400 text-sm mt-1">Gérez vos informations personnelles et votre profil entreprise.</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-background-dark text-sm font-bold rounded-xl hover:brightness-110 transition-all disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-lg">{saving ? "hourglass_empty" : "save"}</span>
          {saving ? "Enregistrement..." : "Enregistrer les modifications"}
        </button>
      </div>

      {/* Profile Header Card */}
      <div className="bg-neutral-dark rounded-xl border border-border-dark p-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-black ring-4 ring-primary/20 overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-background-dark shadow-lg hover:scale-110 transition-transform disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">{uploading ? "hourglass_empty" : "photo_camera"}</span>
            </button>
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">{form.fullName || "Votre nom"}</h2>
            <p className="text-slate-400 text-sm">{form.company ? `${form.company} · ` : ""}{form.city || "Ville"}, {form.country || "Pays"}</p>
            <div className="flex items-center gap-2 mt-2">
              {form.email && (
                <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  Email vérifié
                </span>
              )}
              {form.phone && (
                <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  Téléphone vérifié
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <div className="bg-neutral-dark rounded-xl border border-border-dark p-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-5">
          <span className="material-symbols-outlined text-primary">person</span>
          Informations personnelles
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1.5">Nom complet</label>
            <input value={form.fullName} onChange={(e) => update("fullName", e.target.value)} className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-xl text-sm text-white outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1.5">Email</label>
            <input value={form.email} onChange={(e) => update("email", e.target.value)} type="email" className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-xl text-sm text-white outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1.5">Téléphone</label>
            <input value={form.phone} onChange={(e) => update("phone", e.target.value)} className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-xl text-sm text-white outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1.5">Pays</label>
            <select value={form.country} onChange={(e) => update("country", e.target.value)} className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-xl text-sm text-white outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20">
              <option value="">Sélectionnez un pays</option>
              {["Sénégal", "Côte d'Ivoire", "Cameroun", "France", "Belgique", "Canada", "Maroc", "Tunisie", "RDC", "Mali", "Burkina Faso", "Niger", "Guinée", "Bénin", "Togo", "Gabon", "Autre"].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1.5">Bio professionnelle</label>
          <textarea
            value={form.bio}
            onChange={(e) => update("bio", e.target.value)}
            rows={4}
            className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-xl text-sm text-white outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>
      </div>

      {/* Company Info */}
      <div className="bg-neutral-dark rounded-xl border border-border-dark p-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-5">
          <span className="material-symbols-outlined text-primary">business</span>
          Profil Entreprise
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1.5">Nom de l&apos;entreprise</label>
            <input value={form.company} onChange={(e) => update("company", e.target.value)} className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-xl text-sm text-white outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1.5">Site web</label>
            <input value={form.website} onChange={(e) => update("website", e.target.value)} className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-xl text-sm text-white outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1.5">Secteur d&apos;activité</label>
            <select value={form.sector} onChange={(e) => update("sector", e.target.value)} className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-xl text-sm text-white outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20">
              <option value="">Sélectionnez un secteur</option>
              {["Technologie", "Marketing", "Finance", "Santé", "Éducation", "Commerce", "Industrie", "Autre"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1.5">Taille d&apos;équipe</label>
            <select value={form.teamSize} onChange={(e) => update("teamSize", e.target.value)} className="w-full px-4 py-2.5 bg-background-dark border border-border-dark rounded-xl text-sm text-white outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20">
              <option value="">Sélectionnez une taille</option>
              {["1-5", "5-10", "10-50", "50-200", "200+"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Profile completion */}
      <div className="bg-primary/5 rounded-xl border border-primary/10 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">trending_up</span>
            <p className="font-bold text-white text-sm">Complétion du profil</p>
          </div>
          <span className="text-primary text-sm font-bold">{completionPercent}%</span>
        </div>
        <div className="h-2 bg-border-dark rounded-full overflow-hidden mb-3">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${completionPercent}%` }} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {completionItems.map(item => (
            <span key={item.label} className="flex items-center gap-1.5 text-slate-500">
              <span
                className={`material-symbols-outlined text-sm ${item.done ? "text-primary" : "text-slate-600"}`}
                style={item.done ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.done ? "check_circle" : "radio_button_unchecked"}
              </span>
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
