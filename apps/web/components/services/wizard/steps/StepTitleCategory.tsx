"use client";

import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useServiceWizardStore } from "@/store/service-wizard";
import { step1Schema, LANGUAGES } from "@/lib/validations/service";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

interface SubCategory {
  id: string;
  name: string;
  slug: string;
}

export function StepTitleCategory({ role }: { role: string }) {
  const store = useServiceWizardStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load categories
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => {});
  }, []);

  // Load subcategories when category changes
  useEffect(() => {
    if (!store.categoryId) {
      setSubCategories([]);
      return;
    }
    fetch(`/api/categories?parentId=${store.categoryId}`)
      .then((r) => r.json())
      .then((data) => setSubCategories(data.subcategories || []))
      .catch(() => {});
    // Load tag suggestions
    fetch(`/api/categories?categoryId=${store.categoryId}&withTags=true`)
      .then((r) => r.json())
      .then((data) => setSuggestedTags(data.tags || []))
      .catch(() => {});
  }, [store.categoryId]);

  // Title validation
  const titleValidation = useMemo(() => {
    const full = store.title;
    if (!full) return null;
    if (full.length < 10) return { type: "warning" as const, message: "Titre trop court. Soyez plus précis pour attirer les clients." };
    if (/\d+\s*[€$£]|[€$£]\s*\d+|\d+\s*euros?/i.test(full)) return { type: "error" as const, message: "Ne mentionnez pas de prix dans le titre" };
    if (/[A-Z]{4,}/.test(full)) return { type: "warning" as const, message: "Évitez les majuscules excessives" };
    return { type: "success" as const, message: "Parfait !" };
  }, [store.title]);

  function addTag(tag: string) {
    const trimmed = tag.trim().toLowerCase();
    if (!trimmed || store.tags.includes(trimmed) || store.tags.length >= 5) return;
    store.updateField("tags", [...store.tags, trimmed]);
    setTagInput("");
  }

  function removeTag(tag: string) {
    store.updateField("tags", store.tags.filter((t) => t !== tag));
  }

  function handleNext() {
    const result = step1Schema.safeParse({
      language: store.language,
      title: store.title,
      categoryId: store.categoryId,
      subCategoryId: store.subCategoryId,
      tags: store.tags,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    store.markStepCompleted(1);
    store.setStep(2);
  }

  return (
    <div className="space-y-8">
      {/* Language */}
      <div>
        <label className="block text-sm font-semibold mb-2">Langue du service</label>
        <select
          value={store.language}
          onChange={(e) => store.updateField("language", e.target.value)}
          className={cn(
            "w-full sm:w-64 bg-white/5 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all",
            errors.language ? "border-red-500" : "border-white/10"
          )}
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value} className="bg-neutral-900">
              {lang.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-amber-400/70 mt-1.5 flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">warning</span>
          La langue ne pourra plus être modifiée après publication
        </p>
        {errors.language && <p className="text-xs text-red-400 mt-1">{errors.language}</p>}
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-semibold mb-2">Titre du service</label>
        <div className="flex items-stretch">
          <div className="flex items-center px-4 bg-primary/10 border border-r-0 border-primary/20 rounded-l-xl text-sm font-semibold text-primary">
            Je vais
          </div>
          <input
            type="text"
            value={store.title}
            onChange={(e) => {
              const val = e.target.value.slice(0, 100);
              store.updateField("title", val);
            }}
            placeholder="créer un site web professionnel responsive..."
            className={cn(
              "flex-1 bg-white/5 border rounded-r-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all",
              errors.title ? "border-red-500" : titleValidation?.type === "success" ? "border-emerald-500/50" : "border-white/10"
            )}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <div>
            {titleValidation && (
              <p className={cn(
                "text-xs font-medium flex items-center gap-1",
                titleValidation.type === "success" && "text-emerald-400",
                titleValidation.type === "warning" && "text-amber-400",
                titleValidation.type === "error" && "text-red-400"
              )}>
                <span className="material-symbols-outlined text-xs">
                  {titleValidation.type === "success" ? "check_circle" : titleValidation.type === "warning" ? "warning" : "error"}
                </span>
                {titleValidation.message}
              </p>
            )}
            {errors.title && <p className="text-xs text-red-400">{errors.title}</p>}
          </div>
          <span className={cn(
            "text-xs font-medium",
            store.title.length >= 100 ? "text-red-400" : "text-slate-500"
          )}>
            {store.title.length} / 100
          </span>
        </div>

        {/* Title rules */}
        <div className="mt-3 grid grid-cols-2 gap-1.5">
          {[
            "Pas de prix dans le titre",
            "Pas de majuscules excessives",
            "Pas de ponctuation inutile",
            "Soyez précis et concis",
          ].map((rule) => (
            <p key={rule} className="text-xs text-slate-500 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-xs text-slate-600">arrow_right</span>
              {rule}
            </p>
          ))}
        </div>
      </div>

      {/* Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Catégorie</label>
          <select
            value={store.categoryId}
            onChange={(e) => {
              store.updateFields({
                categoryId: e.target.value,
                subCategoryId: "",
              });
            }}
            className={cn(
              "w-full bg-white/5 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all",
              errors.categoryId ? "border-red-500" : "border-white/10"
            )}
          >
            <option value="" className="bg-neutral-900">Sélectionner une catégorie</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id} className="bg-neutral-900">
                {cat.name}
              </option>
            ))}
          </select>
          {errors.categoryId && <p className="text-xs text-red-400 mt-1">{errors.categoryId}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Sous-catégorie</label>
          <select
            value={store.subCategoryId}
            onChange={(e) => store.updateField("subCategoryId", e.target.value)}
            disabled={!store.categoryId}
            className={cn(
              "w-full bg-white/5 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-40",
              errors.subCategoryId ? "border-red-500" : "border-white/10"
            )}
          >
            <option value="" className="bg-neutral-900">Sélectionner une sous-catégorie</option>
            {subCategories.map((sub) => (
              <option key={sub.id} value={sub.id} className="bg-neutral-900">
                {sub.name}
              </option>
            ))}
          </select>
          {errors.subCategoryId && <p className="text-xs text-red-400 mt-1">{errors.subCategoryId}</p>}
        </div>
      </div>
      <p className="text-xs text-amber-400/70 flex items-center gap-1 -mt-4">
        <span className="material-symbols-outlined text-xs">warning</span>
        La catégorie ne pourra plus être modifiée après publication
      </p>

      {/* Tags */}
      <div>
        <label className="block text-sm font-semibold mb-2">
          Tags du service <span className="text-slate-500 font-normal">({store.tags.length}/5)</span>
        </label>

        {/* Tag chips */}
        <div className="flex flex-wrap gap-2 mb-3">
          {store.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-xs font-semibold text-primary"
            >
              {tag}
              <button onClick={() => removeTag(tag)} className="hover:text-red-400 transition-colors">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </span>
          ))}
        </div>

        {/* Tag input */}
        {store.tags.length < 5 && (
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag(tagInput);
                }
              }}
              placeholder="Ajouter un tag..."
              className={cn(
                "flex-1 bg-white/5 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50",
                errors.tags ? "border-red-500" : "border-white/10"
              )}
            />
            <button
              onClick={() => addTag(tagInput)}
              className="px-4 py-2.5 bg-primary/10 text-primary rounded-xl text-sm font-semibold hover:bg-primary/20 transition-all"
            >
              Ajouter
            </button>
          </div>
        )}
        {errors.tags && <p className="text-xs text-red-400 mt-1">{errors.tags}</p>}

        {/* Tag suggestions */}
        {suggestedTags.length > 0 && store.tags.length < 5 && (
          <div className="mt-3">
            <p className="text-xs text-slate-500 mb-1.5">Suggestions :</p>
            <div className="flex flex-wrap gap-1.5">
              {suggestedTags
                .filter((t) => !store.tags.includes(t))
                .slice(0, 8)
                .map((tag) => (
                  <button
                    key={tag}
                    onClick={() => addTag(tag)}
                    className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-slate-400 hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all"
                  >
                    + {tag}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-4 border-t border-white/5">
        <button
          onClick={handleNext}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all"
        >
          Enregistrer et suivant
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
