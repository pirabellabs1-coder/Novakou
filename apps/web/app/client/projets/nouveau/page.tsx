"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useClientStore } from "@/store/client";
import { useToastStore } from "@/store/toast";
import { cn } from "@/lib/utils";

const STEPS = [
  { label: "Détails", sub: "Titre & Description", icon: "sort" },
  { label: "Catégorie", sub: "Expertise requise", icon: "category" },
  { label: "Budget", sub: "Tarifs & Délais", icon: "payments" },
  { label: "Révision", sub: "Confirmation finale", icon: "verified" },
];

const CATEGORIES = [
  "Développement Web & Mobile",
  "Design UI/UX",
  "Marketing Digital",
  "Rédaction & Traduction",
  "Vidéo & Animation",
  "IA & Data Science",
  "SEO & Référencement",
  "Cybersécurité",
];

const URGENCY_OPTIONS = [
  { key: "normale", label: "Normale", desc: "Pas de contrainte de temps", icon: "pace" },
  { key: "urgente", label: "Urgente", desc: "Réponse sous 48h souhaitée", icon: "speed" },
  { key: "tres_urgente", label: "Très urgente", desc: "Besoin immédiat", icon: "bolt" },
];

const VISIBILITY_OPTIONS = [
  { key: "public", label: "Public", desc: "Visible par tous les freelances", icon: "public" },
  { key: "prive", label: "Privé", desc: "Sur invitation uniquement", icon: "lock" },
];

interface FormErrors {
  title?: string;
  description?: string;
  budgetMin?: string;
  budgetMax?: string;
  category?: string;
}

export default function NewProjectPage() {
  const router = useRouter();
  const { addToast } = useToastStore();
  const { createProject } = useClientStore();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [form, setForm] = useState({
    title: "",
    category: "",
    deadline: "",
    description: "",
    budgetType: "fixe" as "fixe" | "horaire",
    budgetMin: "",
    budgetMax: "",
    skills: ["React", "TypeScript"] as string[],
    skillInput: "",
    urgency: "normale",
    visibility: "public",
    subcategories: [] as string[],
    attachments: [] as string[],
  });

  function update<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
    // Clear field errors on change
    if (key in errors) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function addSkill() {
    const s = form.skillInput.trim();
    if (s && !form.skills.includes(s)) {
      update("skills", [...form.skills, s]);
      update("skillInput", "");
    }
  }

  function removeSkill(skill: string) {
    update("skills", form.skills.filter((s) => s !== skill));
  }

  function toggleSubcat(cat: string) {
    if (form.subcategories.includes(cat)) {
      update("subcategories", form.subcategories.filter((c) => c !== cat));
    } else {
      update("subcategories", [...form.subcategories, cat]);
    }
  }

  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (!form.title.trim()) {
      newErrors.title = "Le titre est requis";
    }

    if (!form.description.trim()) {
      newErrors.description = "La description est requise";
    }

    const budgetMinNum = Number(form.budgetMin);
    const budgetMaxNum = Number(form.budgetMax);

    if (form.budgetMin && budgetMinNum <= 0) {
      newErrors.budgetMin = "Le budget minimum doit être supérieur à 0";
    }

    if (form.budgetMax && budgetMaxNum <= 0) {
      newErrors.budgetMax = "Le budget maximum doit être supérieur à 0";
    }

    if (form.budgetMin && form.budgetMax && budgetMinNum > budgetMaxNum) {
      newErrors.budgetMax = "Le budget maximum doit être supérieur au minimum";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function saveDraft() {
    if (!form.title.trim()) {
      setErrors({ title: "Le titre est requis pour sauvegarder un brouillon" });
      addToast("error", "Veuillez saisir un titre pour sauvegarder");
      return;
    }
    setSubmitting(true);
    const ok = await createProject({
      title: form.title,
      category: form.category,
      description: form.description,
      budget: {
        type: form.budgetType,
        min: Number(form.budgetMin) || 0,
        max: Number(form.budgetMax) || 0,
      },
      deadline: form.deadline,
      skills: form.skills,
      urgency: form.urgency,
      visibility: form.visibility,
      subcategories: form.subcategories,
      status: "brouillon",
    });
    setSubmitting(false);

    if (ok) {
      addToast("success", "Brouillon sauvegardé avec succès");
      router.push("/client/projets");
    } else {
      addToast("error", "Erreur lors de la sauvegarde du brouillon");
    }
  }

  async function publish() {
    if (!validate()) {
      addToast("error", "Veuillez corriger les erreurs avant de publier");
      return;
    }

    setSubmitting(true);
    const ok = await createProject({
      title: form.title,
      category: form.category,
      description: form.description,
      budget: {
        type: form.budgetType,
        min: Number(form.budgetMin) || 0,
        max: Number(form.budgetMax) || 0,
      },
      deadline: form.deadline,
      skills: form.skills,
      urgency: form.urgency,
      visibility: form.visibility,
      subcategories: form.subcategories,
      status: "ouvert",
    });
    setSubmitting(false);

    if (ok) {
      addToast("success", "Projet publié avec succès !");
      router.push("/client/projets");
    } else {
      addToast("error", "Erreur lors de la publication du projet");
    }
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="-m-4 sm:-m-6 lg:-m-8 min-h-screen bg-background-dark">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Title */}
        <div className="mb-4 sm:mb-6">
          <button
            onClick={() => router.push("/client/projets")}
            className="flex items-center gap-1 text-sm text-slate-400 hover:text-primary mb-2 sm:mb-3 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Retour aux projets
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Publier un nouveau projet</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Décrivez votre besoin pour recevoir des propositions en quelques heures.
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-5 sm:mb-8">
          <div className="flex items-center gap-1 sm:gap-2 mb-2">
            {STEPS.map((s, i) => (
              <button
                key={s.label}
                onClick={() => setStep(i)}
                className={cn(
                  "flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all",
                  i === step
                    ? "bg-primary text-background-dark"
                    : i < step
                      ? "bg-primary/10 text-primary"
                      : "text-slate-500",
                )}
              >
                <span className="material-symbols-outlined text-sm sm:text-base">
                  {i < step ? "check_circle" : s.icon}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{i + 1}</span>
              </button>
            ))}
          </div>
          <div className="h-1 bg-border-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Form */}
        <div className="bg-neutral-dark rounded-xl border border-border-dark p-4 sm:p-6 lg:p-8">
          {/* Step 1: Details */}
          {step === 0 && (
            <div className="space-y-5 sm:space-y-6">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Quel est le titre de votre projet ?
                </label>
                <input
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  placeholder="Ex: Création d'une plateforme E-commerce"
                  className={cn(
                    "w-full px-3 sm:px-4 py-3 rounded-xl border bg-background-dark text-sm text-white placeholder:text-slate-500 focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none transition-colors",
                    errors.title ? "border-red-500" : "border-border-dark",
                  )}
                />
                {errors.title && <p className="text-xs text-red-400 mt-1.5">{errors.title}</p>}
                {!errors.title && (
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Un titre précis attire 3x plus de freelances qualifiés.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Catégorie principale
                </label>
                {/* Dropdown select + ability to type custom */}
                <select
                  value={form.category}
                  onChange={(e) => update("category", e.target.value)}
                  className={cn(
                    "w-full px-3 sm:px-4 py-3 rounded-xl border bg-background-dark text-sm text-white outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 cursor-pointer appearance-none transition-colors",
                    form.category ? "border-primary/30" : "border-border-dark",
                  )}
                >
                  <option value="">Sélectionner une catégorie...</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="__custom">Autre (saisir manuellement)</option>
                </select>
                {form.category === "__custom" && (
                  <input
                    value=""
                    onChange={(e) => update("category", e.target.value)}
                    placeholder="Saisissez votre catégorie..."
                    className="w-full mt-2 px-3 sm:px-4 py-3 rounded-xl border border-border-dark bg-background-dark text-sm text-white placeholder:text-slate-500 focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none"
                  />
                )}
                {/* Quick chips for popular categories */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {CATEGORIES.slice(0, 4).map((c) => (
                    <button
                      key={c}
                      onClick={() => update("category", c)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors",
                        form.category === c
                          ? "bg-primary/10 text-primary border border-primary/30"
                          : "bg-background-dark text-slate-500 border border-border-dark hover:text-white",
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Description détaillée
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  rows={6}
                  placeholder={"Décrivez les objectifs, fonctionnalités attendues et contexte..."}
                  className={cn(
                    "w-full px-3 sm:px-4 py-3 rounded-xl border bg-background-dark text-sm text-white placeholder:text-slate-500 focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none resize-none leading-relaxed",
                    errors.description ? "border-red-500" : "border-border-dark",
                  )}
                />
                {errors.description && (
                  <p className="text-xs text-red-400 mt-1.5">{errors.description}</p>
                )}
                {!errors.description && (
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    {form.description.length}/2000 caractères
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Compétences requises
                </label>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-border-dark bg-background-dark min-h-[44px]">
                  {form.skills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 bg-primary/20 text-primary px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium"
                    >
                      {s}
                      <button
                        onClick={() => removeSkill(s)}
                        className="hover:text-red-400 transition-colors"
                      >
                        <span className="material-symbols-outlined text-xs sm:text-sm">close</span>
                      </button>
                    </span>
                  ))}
                  <input
                    value={form.skillInput}
                    onChange={(e) => update("skillInput", e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                    placeholder={form.skills.length === 0 ? "Tapez une compétence + Entrée" : "Ajouter..."}
                    className="flex-1 min-w-[120px] bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">Tapez et appuyez Entrée pour ajouter chaque compétence.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Deadline souhaitée
                </label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => update("deadline", e.target.value)}
                  className="w-full sm:w-64 px-3 sm:px-4 py-3 rounded-xl border border-border-dark bg-background-dark text-sm text-white focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none"
                />
              </div>
            </div>
          )}

          {/* Step 2: Catégorie & Expertise */}
          {step === 1 && (
            <div className="space-y-5 sm:space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-1">Expertise requise</h3>
                <p className="text-xs sm:text-sm text-slate-400 mb-4">
                  Sélectionnez ou tapez vos propres sous-domaines.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {[
                    "Frontend",
                    "Backend",
                    "Fullstack",
                    "Mobile",
                    "DevOps",
                    "UI Design",
                    "UX Research",
                    "Data Science",
                    "Machine Learning",
                    "SEO",
                    "Social Media",
                    "Branding",
                  ].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => toggleSubcat(cat)}
                      className={cn(
                        "p-2.5 sm:p-3 rounded-xl border text-xs sm:text-sm font-medium text-left transition-all flex items-center gap-2 sm:gap-3",
                        form.subcategories.includes(cat)
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border-dark text-slate-400 hover:border-slate-500 hover:text-white",
                      )}
                    >
                      <span className="material-symbols-outlined text-base sm:text-lg flex-shrink-0">
                        {form.subcategories.includes(cat) ? "check_circle" : "radio_button_unchecked"}
                      </span>
                      {cat}
                    </button>
                  ))}
                </div>
                {/* Custom expertise input */}
                <div className="mt-3 flex gap-2">
                  <input
                    placeholder="Ajouter une autre expertise..."
                    className="flex-1 px-3 py-2.5 rounded-xl border border-border-dark bg-background-dark text-sm text-white placeholder:text-slate-500 outline-none focus:border-primary/50"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (val && !form.subcategories.includes(val)) {
                          toggleSubcat(val);
                          (e.target as HTMLInputElement).value = "";
                        }
                      }
                    }}
                  />
                </div>
                {form.subcategories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.subcategories.map((sc) => (
                      <span key={sc} className="inline-flex items-center gap-1 bg-primary/15 text-primary px-2 py-0.5 rounded-full text-xs font-medium">
                        {sc}
                        <button onClick={() => toggleSubcat(sc)} className="hover:text-red-400"><span className="material-symbols-outlined text-xs">close</span></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-1">Niveau d&apos;urgence</h3>
                <p className="text-xs sm:text-sm text-slate-400 mb-3">
                  Indiquez la rapidité souhaitée pour les réponses.
                </p>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {URGENCY_OPTIONS.map((u) => (
                    <button
                      key={u.key}
                      onClick={() => update("urgency", u.key)}
                      className={cn(
                        "p-2.5 sm:p-4 rounded-xl border text-left transition-all",
                        form.urgency === u.key
                          ? "border-primary bg-primary/5"
                          : "border-border-dark hover:border-slate-500",
                      )}
                    >
                      <span
                        className={cn(
                          "material-symbols-outlined text-lg sm:text-xl mb-1 sm:mb-2",
                          form.urgency === u.key ? "text-primary" : "text-slate-500",
                        )}
                      >
                        {u.icon}
                      </span>
                      <p className={cn("text-xs sm:text-sm font-bold", form.urgency === u.key ? "text-primary" : "text-white")}>
                        {u.label}
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 hidden sm:block">{u.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-1">Visibilité</h3>
                <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-2 sm:mt-3">
                  {VISIBILITY_OPTIONS.map((v) => (
                    <button
                      key={v.key}
                      onClick={() => update("visibility", v.key)}
                      className={cn(
                        "p-2.5 sm:p-4 rounded-xl border text-left transition-all",
                        form.visibility === v.key
                          ? "border-primary bg-primary/5"
                          : "border-border-dark hover:border-slate-500",
                      )}
                    >
                      <span
                        className={cn(
                          "material-symbols-outlined text-lg sm:text-xl mb-1 sm:mb-2",
                          form.visibility === v.key ? "text-primary" : "text-slate-500",
                        )}
                      >
                        {v.icon}
                      </span>
                      <p className={cn("text-xs sm:text-sm font-bold", form.visibility === v.key ? "text-primary" : "text-white")}>
                        {v.label}
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">{v.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Budget détaillé */}
          {step === 2 && (
            <div className="space-y-5 sm:space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-1">Budget & Tarification</h3>
                <p className="text-xs sm:text-sm text-slate-400 mb-4">
                  Définissez votre budget pour attirer les bons profils.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2 sm:mb-3">Type de budget</label>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <button
                    onClick={() => update("budgetType", "fixe")}
                    className={cn(
                      "flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-xl border-2 text-xs sm:text-sm font-semibold transition-all",
                      form.budgetType === "fixe"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border-dark text-slate-400 hover:border-slate-500",
                    )}
                  >
                    <span className="material-symbols-outlined text-base sm:text-lg">payments</span>
                    Prix Fixe
                  </button>
                  <button
                    onClick={() => update("budgetType", "horaire")}
                    className={cn(
                      "flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-xl border-2 text-xs sm:text-sm font-semibold transition-all",
                      form.budgetType === "horaire"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border-dark text-slate-400 hover:border-slate-500",
                    )}
                  >
                    <span className="material-symbols-outlined text-base sm:text-lg">schedule</span>
                    Taux Horaire
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Budget minimum{form.budgetType === "horaire" && " / heure"}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                      EUR
                    </span>
                    <input
                      type="number"
                      value={form.budgetMin}
                      onChange={(e) => update("budgetMin", e.target.value)}
                      placeholder="500"
                      className={cn(
                        "w-full pl-12 pr-4 py-3 rounded-xl border bg-background-dark text-sm text-white placeholder:text-slate-500 focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none",
                        errors.budgetMin ? "border-red-500" : "border-border-dark",
                      )}
                    />
                  </div>
                  {errors.budgetMin && <p className="text-xs text-red-400 mt-1">{errors.budgetMin}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Budget maximum{form.budgetType === "horaire" && " / heure"}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                      EUR
                    </span>
                    <input
                      type="number"
                      value={form.budgetMax}
                      onChange={(e) => update("budgetMax", e.target.value)}
                      placeholder="2000"
                      className={cn(
                        "w-full pl-12 pr-4 py-3 rounded-xl border bg-background-dark text-sm text-white placeholder:text-slate-500 focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none",
                        errors.budgetMax ? "border-red-500" : "border-border-dark",
                      )}
                    />
                  </div>
                  {errors.budgetMax && <p className="text-xs text-red-400 mt-1">{errors.budgetMax}</p>}
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-lg mt-0.5">lightbulb</span>
                  <div>
                    <p className="text-sm font-bold text-primary">Conseil budget</p>
                    <p className="text-xs text-primary/70 mt-1 leading-relaxed">
                      Un budget réaliste attire les meilleurs freelances. Pour un projet de{" "}
                      {form.category || "développement"}, le budget moyen est de 1 500 à 3 000 EUR en prix fixe.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Fichiers joints (brief, maquettes, docs)
                </label>
                <div className="border-2 border-dashed border-border-dark rounded-xl p-4 sm:p-8 text-center hover:border-primary/30 transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-2xl sm:text-3xl text-slate-500 mb-2">
                    cloud_upload
                  </span>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Glissez vos fichiers ici ou cliquez
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1">
                    PDF, DOC, Images — max 10 MB
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Révision */}
          {step === 3 && (
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-base sm:text-lg font-bold text-white">Récapitulatif du projet</h3>
              <p className="text-xs sm:text-sm text-slate-400">Vérifiez les informations avant de publier.</p>

              <div className="bg-background-dark rounded-xl p-3 sm:p-6 border border-border-dark space-y-3 sm:space-y-4">
                <h4 className="font-bold text-white text-base sm:text-xl">{form.title || "Sans titre"}</h4>
                <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">
                  {form.description || "Aucune description"}
                </p>

                <div className="flex flex-wrap gap-2">
                  {form.skills.map((s) => (
                    <span
                      key={s}
                      className="text-xs bg-primary/20 text-primary px-2.5 py-1 rounded-full font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>

                <div className="pt-3 sm:pt-4 border-t border-border-dark grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-base">category</span>
                    <div>
                      <p className="text-slate-500 text-xs">Catégorie</p>
                      <p className="text-white font-semibold">{form.category || "Non définie"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-base">payments</span>
                    <div>
                      <p className="text-slate-500 text-xs">Budget</p>
                      <p className="text-white font-semibold">
                        {form.budgetMin || form.budgetMax
                          ? `${form.budgetMin || "?"} - ${form.budgetMax || "?"} EUR`
                          : "Non défini"}{" "}
                        ({form.budgetType === "fixe" ? "Fixe" : "Horaire"})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-base">calendar_today</span>
                    <div>
                      <p className="text-slate-500 text-xs">Deadline</p>
                      <p className="text-white font-semibold">
                        {form.deadline
                          ? new Date(form.deadline).toLocaleDateString("fr-FR")
                          : "Non définie"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-base">speed</span>
                    <div>
                      <p className="text-slate-500 text-xs">Urgence</p>
                      <p className="text-white font-semibold capitalize">
                        {form.urgency.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-base">
                      {form.visibility === "public" ? "public" : "lock"}
                    </span>
                    <div>
                      <p className="text-slate-500 text-xs">Visibilité</p>
                      <p className="text-white font-semibold capitalize">
                        {form.visibility === "public" ? "Public" : "Privé"}
                      </p>
                    </div>
                  </div>
                  {form.subcategories.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-base">tune</span>
                      <div>
                        <p className="text-slate-500 text-xs">Expertises</p>
                        <p className="text-white font-semibold">{form.subcategories.join(", ")}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3">
                <span className="material-symbols-outlined text-emerald-400 text-lg mt-0.5">
                  info
                </span>
                <div>
                  <p className="text-sm font-bold text-emerald-400">Prêt à publier</p>
                  <p className="text-xs text-emerald-400/70 mt-1">
                    Votre projet sera visible par les freelances qualifiés correspondant à vos critères.
                    Vous recevrez des propositions directement dans votre espace.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 mt-6 sm:mt-8 pt-4 sm:pt-5 border-t border-border-dark">
            <button
              onClick={saveDraft}
              disabled={submitting}
              className="px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-base sm:text-lg">save</span>
              Brouillon
            </button>
            <div className="flex gap-2 sm:gap-3">
              {step > 0 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="flex-1 sm:flex-initial px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-border-dark text-slate-300 hover:bg-border-dark/80 transition-colors flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-base sm:text-lg">arrow_back</span>
                  <span className="hidden sm:inline">Précédent</span>
                </button>
              )}
              {step < 3 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  className="flex-1 sm:flex-initial px-4 sm:px-6 py-2 sm:py-2.5 bg-primary text-background-dark rounded-xl text-xs sm:text-sm font-bold hover:brightness-110 transition-all flex items-center justify-center gap-1.5 sm:gap-2"
                >
                  Suivant
                  <span className="material-symbols-outlined text-base sm:text-lg">arrow_forward</span>
                </button>
              ) : (
                <button
                  onClick={publish}
                  disabled={submitting}
                  className="flex-1 sm:flex-initial px-4 sm:px-6 py-2 sm:py-2.5 bg-primary text-background-dark rounded-xl text-xs sm:text-sm font-bold hover:brightness-110 transition-all flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <span className="material-symbols-outlined text-base sm:text-lg animate-spin">progress_activity</span>
                      Publication...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base sm:text-lg">publish</span>
                      Publier
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
