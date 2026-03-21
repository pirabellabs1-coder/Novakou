"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ImageUpload } from "@/components/ui/image-upload";
import { useInstructorProfile, useInstructorMutation, instructorKeys } from "@/lib/formations/hooks";

interface Profile {
  name: string;
  email: string;
  avatar: string | null;
  image: string | null;
  bio: string;
  expertise: string[];
  linkedin: string | null;
  website: string | null;
  youtube: string | null;
}

export default function InstructeurParametresPage() {
  const t = useTranslations("formations_nav");
  const locale = useLocale();
  const { data: session, status } = useSession();
  const router = useRouter();
  const fr = locale === "fr";

  const { data: profileData, isLoading: loading, error: profileError, refetch } = useInstructorProfile();
  const profile = (profileData as { profile?: Profile } | null)?.profile ?? null;
  const [success, setSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [form, setForm] = useState({
    name: "",
    avatar: "",
    bio: "",
    linkedin: "",
    website: "",
    youtube: "",
  });
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") { router.replace("/formations/connexion"); return; }
  }, [status, router]);

  useEffect(() => {
    if (!seeded && profile) {
      setForm({
        name: profile.name ?? "",
        avatar: profile.avatar ?? profile.image ?? "",
        bio: profile.bio ?? "",
        linkedin: profile.linkedin ?? "",
        website: profile.website ?? "",
        youtube: profile.youtube ?? "",
      });
      setSeeded(true);
    }
  }, [profile, seeded]);

  const saveMutation = useInstructorMutation(
    async (formData: typeof form) => {
      const res = await fetch("/api/instructeur/profil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || (fr ? "Erreur lors de la sauvegarde" : "Error saving changes"));
      }
      return res.json();
    },
    [instructorKeys.profile()]
  );

  const handleSave = () => {
    setSuccess(false);
    setSaveError("");
    saveMutation.mutate(form, {
      onSuccess: () => setSuccess(true),
      onError: (err) => setSaveError(err instanceof Error ? err.message : (fr ? "Erreur réseau, veuillez réessayer" : "Network error, please try again")),
    });
  };

  const saving = saveMutation.isPending;

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold tracking-tight">{t("settings")}</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-40 bg-slate-100 dark:bg-slate-800 dark:bg-white/5 rounded-2xl" />
          <div className="h-32 bg-slate-100 dark:bg-slate-800 dark:bg-white/5 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-2xl font-extrabold tracking-tight">{t("settings")}</h1>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <p className="text-sm text-slate-500 mb-4">{(profileError as Error)?.message || (fr ? "Erreur lors du chargement du profil" : "Error loading profile")}</p>
          <button onClick={() => refetch()} className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm">
            {fr ? "Réessayer" : "Retry"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-extrabold tracking-tight">{t("settings")}</h1>

      {/* Photo de profil */}
      <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="font-semibold mb-4">{fr ? "Photo de profil" : "Profile photo"}</h2>
        <div className="flex items-start gap-6">
          <div className="w-32">
            <ImageUpload
              currentImage={form.avatar}
              onUpload={(url) => setForm((p) => ({ ...p, avatar: url }))}
              aspectRatio="aspect-square"
              rounded
              placeholder={fr ? "Photo" : "Photo"}
            />
          </div>
          <div className="flex-1 pt-2">
            <p className="text-sm text-slate-500">
              {fr
                ? "Téléchargez une photo de profil carrée. Formats acceptés : JPEG, PNG, WebP. Taille max : 5 Mo."
                : "Upload a square profile photo. Accepted formats: JPEG, PNG, WebP. Max size: 5 MB."}
            </p>
          </div>
        </div>
      </div>

      {/* Nom */}
      <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
        <h2 className="font-semibold">{fr ? "Informations personnelles" : "Personal information"}</h2>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">{fr ? "Nom complet" : "Full name"}</label>
          <input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-1 block">{fr ? "Bio" : "Bio"}</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
            rows={3}
            className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>
      </div>

      {/* Liens */}
      <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
        <h2 className="font-semibold">{fr ? "Liens professionnels" : "Professional links"}</h2>
        {[
          { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/..." },
          { key: "website", label: fr ? "Site web" : "Website", placeholder: "https://..." },
          { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/..." },
        ].map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="text-xs text-slate-500 mb-1 block">{label}</label>
            <input
              value={form[key as keyof typeof form]}
              onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
              placeholder={placeholder}
              className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary hover:bg-primary/90 text-white font-medium px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50 text-sm"
        >
          {saving ? (fr ? "Enregistrement..." : "Saving...") : (fr ? "Enregistrer" : "Save")}
        </button>
        {success && (
          <span className="text-green-600 text-sm font-medium">
            {fr ? "Modifications enregistrées" : "Changes saved"}
          </span>
        )}
        {saveError && (
          <span className="text-red-600 text-sm font-medium">
            {saveError}
          </span>
        )}
      </div>
    </div>
  );
}
