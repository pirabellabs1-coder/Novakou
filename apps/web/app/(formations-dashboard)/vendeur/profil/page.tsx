"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type ProfileData = {
  user: { id: string; name: string | null; email: string | null; image: string | null } | null;
  profile: {
    id: string;
    bioFr: string | null;
    expertise: string[];
    linkedin: string | null;
    website: string | null;
    youtube: string | null;
    yearsExp: number;
    status: string;
  } | null;
  hasProfile: boolean;
};

function getInitials(name?: string | null): string {
  if (!name) return "FH";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const socialLinkDefs = [
  { key: "linkedin", icon: "link", platform: "LinkedIn", placeholder: "https://linkedin.com/in/votre-profil", color: "text-blue-600" },
  { key: "youtube", icon: "smart_display", platform: "YouTube", placeholder: "https://youtube.com/@votre-chaine", color: "text-red-500" },
  { key: "website", icon: "language", platform: "Site web", placeholder: "https://votre-site.com", color: "text-[#006e2f]" },
];

export default function ProfilPage() {
  const qc = useQueryClient();

  const { data: response, isLoading } = useQuery<{ data: ProfileData | null }>({
    queryKey: ["vendeur-profile"],
    queryFn: () => fetch("/api/formations/vendeur/profile").then((r) => r.json()),
    staleTime: 60_000,
  });

  const d = response?.data;

  // Form state — initialized from API data
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [youtube, setYoutube] = useState("");
  const [website, setWebsite] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Populate form when data loads
  useEffect(() => {
    if (d) {
      setDisplayName(d.user?.name ?? "");
      setBio(d.profile?.bioFr ?? "");
      setSkills(d.profile?.expertise ?? []);
      setLinkedin(d.profile?.linkedin ?? "");
      setYoutube(d.profile?.youtube ?? "");
      setWebsite(d.profile?.website ?? "");
    }
  }, [d]);

  const saveMutation = useMutation({
    mutationFn: () =>
      fetch("/api/formations/vendeur/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: displayName, bioFr: bio, expertise: skills, linkedin, youtube, website }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendeur-profile"] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const initials = getInitials(displayName || d?.user?.name);
  const avatarUrl = d?.user?.image;

  // Photo upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploadingPhoto(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", "avatar");
      const uploadRes = await fetch("/api/upload/image", { method: "POST", body: form });
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok) {
        setUploadError(uploadJson.error ?? "Erreur d'upload");
        return;
      }
      // Save the returned URL on the user's profile
      const saveRes = await fetch("/api/formations/vendeur/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: uploadJson.url }),
      });
      if (!saveRes.ok) {
        const saveJson = await saveRes.json().catch(() => ({}));
        setUploadError(saveJson.error ?? "Impossible de sauvegarder la photo");
        return;
      }
      qc.invalidateQueries({ queryKey: ["vendeur-profile"] });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Erreur réseau");
    } finally {
      setUploadingPhoto(false);
      // Reset the input so the same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const socialValues: Record<string, string> = { linkedin, youtube, website };
  const socialSetters: Record<string, (v: string) => void> = {
    linkedin: setLinkedin,
    youtube: setYoutube,
    website: setWebsite,
  };

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">Mon Profil Instructeur</h1>
          <p className="text-sm text-[#5c647a] mt-1">Ces informations apparaissent sur votre page publique</p>
        </div>
        <div className="flex items-center gap-2">
          {d?.user?.id && (
            <Link
              href={`/instructeurs/${d.user.id}`}
              target="_blank"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-[#191c1e] hover:bg-gray-50 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-[#5c647a]">open_in_new</span>
              Voir mon profil public
            </Link>
          )}
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || isLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 shadow-md shadow-[#006e2f]/20 disabled:opacity-60"
            style={{ background: saveSuccess ? "#16a34a" : "linear-gradient(to right, #006e2f, #22c55e)" }}
          >
            <span className="material-symbols-outlined text-[18px]">
              {saveMutation.isPending ? "hourglass_empty" : saveSuccess ? "check" : "save"}
            </span>
            {saveMutation.isPending ? "Sauvegarde…" : saveSuccess ? "Enregistré !" : "Enregistrer"}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-pulse">
          <div className="lg:col-span-3 space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-40" />
            ))}
          </div>
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-96" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* ─── Left — Edit form (60%) ─── */}
          <div className="lg:col-span-3 space-y-6">
            {/* Photo */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-bold text-[#191c1e] mb-4">Photo de profil</h2>
              <div className="flex items-center gap-5">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt={displayName} className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                    {initials}
                  </div>
                )}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-[#191c1e] hover:bg-gray-50 transition-colors mb-2 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px] text-[#5c647a]">upload</span>
                    {uploadingPhoto ? "Envoi en cours…" : "Changer la photo"}
                  </button>
                  <p className="text-xs text-[#5c647a]">JPG, PNG · Max 5 MB · Recommandé : 400×400px</p>
                  {uploadError && (
                    <p className="text-xs text-rose-600 mt-1.5">{uploadError}</p>
                  )}
                </div>
              </div>
            </div>

            {/* General info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
              <h2 className="text-base font-bold text-[#191c1e]">Informations générales</h2>

              <div>
                <label className="block text-sm font-semibold text-[#191c1e] mb-1.5">Nom affiché</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#191c1e] focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#191c1e] mb-1.5">Email</label>
                <input
                  type="email"
                  value={d?.user?.email ?? ""}
                  readOnly
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#5c647a] bg-gray-50 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#191c1e] mb-1.5">Biographie</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#191c1e] focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10 transition-all resize-none"
                  placeholder="Décrivez votre parcours, expertise et ce que vous apportez à vos apprenants…"
                />
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-[#5c647a]">Entre 150 et 500 caractères recommandés</p>
                  <span className={`text-xs font-semibold ${bio.length > 500 ? "text-red-500" : "text-[#5c647a]"}`}>
                    {bio.length} / 500
                  </span>
                </div>
              </div>
            </div>

            {/* Social links */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h2 className="text-base font-bold text-[#191c1e]">Réseaux sociaux & liens</h2>
              {socialLinkDefs.map((link) => (
                <div key={link.key}>
                  <label className="block text-sm font-semibold text-[#191c1e] mb-1.5">
                    <span className="flex items-center gap-2">
                      <span className={`material-symbols-outlined text-[16px] ${link.color}`}>{link.icon}</span>
                      {link.platform}
                    </span>
                  </label>
                  <input
                    type="url"
                    value={socialValues[link.key]}
                    onChange={(e) => socialSetters[link.key](e.target.value)}
                    placeholder={link.placeholder}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-[#191c1e] placeholder:text-gray-400 focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10 transition-all"
                  />
                </div>
              ))}
            </div>

            {/* Skills */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-bold text-[#191c1e] mb-4">Compétences & Expertises</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {skills.map((skill) => (
                  <div key={skill} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#006e2f]/5 rounded-full border border-[#006e2f]/20">
                    <span className="text-sm font-semibold text-[#006e2f]">{skill}</span>
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      className="w-4 h-4 rounded-full bg-[#006e2f]/20 flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-colors text-[#006e2f]"
                    >
                      <span className="material-symbols-outlined text-[12px]">close</span>
                    </button>
                  </div>
                ))}
                {skills.length === 0 && (
                  <p className="text-sm text-[#5c647a]">Aucune compétence ajoutée</p>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddSkill()}
                  placeholder="Ajouter une compétence…"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-[#191c1e] placeholder:text-gray-400 focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10 transition-all"
                />
                <button
                  onClick={handleAddSkill}
                  className="px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-opacity hover:opacity-90"
                  style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>
              </div>
            </div>
          </div>

          {/* ─── Right — Profile preview (40%) ─── */}
          <div className="lg:col-span-2">
            <div className="sticky top-24">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Cover */}
                <div className="h-28 bg-gradient-to-br from-[#006e2f] to-[#22c55e] relative">
                  <div className="absolute -bottom-8 left-5">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt={displayName} className="w-16 h-16 rounded-2xl object-cover border-4 border-white shadow-md" />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xl font-bold border-4 border-white shadow-md">
                        {initials}
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-5 pt-12 pb-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-extrabold text-[#191c1e] text-lg leading-tight">{displayName || "Votre nom"}</h3>
                      <p className="text-[11px] text-[#5c647a] mt-0.5">{d?.user?.email ?? ""}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full flex-shrink-0 ml-2">
                      <span className="material-symbols-outlined text-amber-500 text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span className="text-[11px] font-bold text-amber-700">Certifié</span>
                    </div>
                  </div>

                  {/* Bio preview */}
                  <p className="text-xs text-[#5c647a] leading-relaxed mb-4 line-clamp-4">
                    {bio || "Ajoutez votre biographie pour présenter votre parcours aux apprenants."}
                  </p>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {skills.slice(0, 5).map((skill) => (
                      <span key={skill} className="px-2.5 py-1 bg-[#006e2f]/5 text-[#006e2f] text-[10px] font-bold rounded-full border border-[#006e2f]/15">
                        {skill}
                      </span>
                    ))}
                    {skills.length > 5 && (
                      <span className="px-2.5 py-1 bg-gray-100 text-[#5c647a] text-[10px] font-bold rounded-full">
                        +{skills.length - 5}
                      </span>
                    )}
                    {skills.length === 0 && (
                      <span className="text-xs text-gray-400">Aucune compétence</span>
                    )}
                  </div>

                  {d?.user?.id ? (
                    <Link
                      href={`/instructeurs/${d.user.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-center w-full py-2.5 rounded-xl text-white text-sm font-bold transition-opacity hover:opacity-90"
                      style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
                    >
                      Voir mon profil public
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-xl text-white text-sm font-bold opacity-50 cursor-not-allowed"
                      style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
                    >
                      Voir ses formations
                    </button>
                  )}
                </div>
              </div>

              {/* Preview notice */}
              <div className="mt-3 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2">
                <span className="material-symbols-outlined text-blue-500 text-[16px] flex-shrink-0 mt-0.5">info</span>
                <p className="text-[11px] text-blue-600">Aperçu de votre profil tel qu&apos;il apparaît aux apprenants.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
