"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  ArrowLeft, Tag, Percent, Calendar, Check,
  AlertCircle, Loader2, Package, BookOpen,
} from "lucide-react";
import { useInstructorFormations, useInstructorProducts, useInstructorMutation, instructorKeys } from "@/lib/formations/hooks";

// ── Types ──

interface TargetItem {
  id: string;
  title: string;
  type: "formation" | "product";
}

type TargetType = "formation" | "product";

interface FormState {
  targetType: TargetType;
  targetId: string;
  discountPct: string;
  startsAt: string;
  endsAt: string;
  maxUsage: string;
}

interface FormErrors {
  targetId?: string;
  discountPct?: string;
  dates?: string;
}

// ── Component ──

export default function CreerPromotionPage() {
  const locale = useLocale();
  const fr = locale === "fr";
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    targetType: "formation",
    targetId: "",
    discountPct: "",
    startsAt: new Date().toISOString().split("T")[0],
    endsAt: "",
    maxUsage: "",
  });
  const { data: formationsRaw, isLoading: formationsLoading } = useInstructorFormations();
  const { data: productsRaw, isLoading: productsLoading } = useInstructorProducts();
  const loadingTargets = formationsLoading || productsLoading;

  const targets: TargetItem[] = [
    ...((Array.isArray(formationsRaw) ? formationsRaw : []) as { id: string; title: string }[]).map(
      (f) => ({ id: f.id, title: f.title, type: "formation" as const })
    ),
    ...(((productsRaw as { products?: { id: string; title: string }[] } | null)?.products ?? []).map(
      (p) => ({ id: p.id, title: p.title, type: "product" as const })
    )),
  ];

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);

  const filteredTargets = targets.filter((t) => t.type === form.targetType);

  const updateField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      if (key in errors) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[key as keyof FormErrors];
          return next;
        });
      }
    },
    [errors],
  );

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.targetId) {
      newErrors.targetId = fr
        ? "Selectionnez une formation ou un produit"
        : "Select a course or product";
    }

    const discountNum = parseInt(form.discountPct, 10);
    if (!form.discountPct || isNaN(discountNum) || discountNum < 1 || discountNum > 90) {
      newErrors.discountPct = fr
        ? "La reduction doit etre entre 1 et 90%"
        : "Discount must be between 1 and 90%";
    }

    if (!form.startsAt || !form.endsAt) {
      newErrors.dates = fr
        ? "Les dates de debut et fin sont requises"
        : "Start and end dates are required";
    } else if (new Date(form.endsAt) <= new Date(form.startsAt)) {
      newErrors.dates = fr
        ? "La date de fin doit etre apres la date de debut"
        : "End date must be after start date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createMutation = useInstructorMutation(
    async (body: Record<string, unknown>) => {
      const res = await fetch("/api/instructeur/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (fr ? "Erreur lors de la creation" : "Error creating promotion"));
      return data;
    },
    [instructorKeys.promotions()]
  );

  const submitting = createMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitError("");
    const body: Record<string, unknown> = {
      discountPct: parseInt(form.discountPct, 10),
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: new Date(form.endsAt).toISOString(),
    };
    if (form.targetType === "formation") body.formationId = form.targetId;
    else body.digitalProductId = form.targetId;
    if (form.maxUsage) body.maxUsage = parseInt(form.maxUsage, 10);

    createMutation.mutate(body, {
      onSuccess: () => {
        setSuccess(true);
        setTimeout(() => router.push("/formations/instructeur/promotions"), 1500);
      },
      onError: (err) => setSubmitError(err instanceof Error ? err.message : (fr ? "Erreur reseau" : "Network error")),
    });
  };

  if (success) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-20 bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white dark:text-slate-100 mb-2">
            {fr ? "Promotion creee !" : "Promotion created!"}
          </h2>
          <p className="text-sm text-slate-500">
            {fr
              ? "Redirection vers la liste des promotions..."
              : "Redirecting to promotions list..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/formations/instructeur/promotions"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          {fr ? "Retour aux promotions" : "Back to promotions"}
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white dark:text-slate-100">
          {fr ? "Creer une promotion flash" : "Create a flash promotion"}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {fr
            ? "Definissez une reduction temporaire sur une formation ou un produit"
            : "Set a temporary discount on a course or product"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Target type selection */}
        <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white dark:text-slate-100 mb-4 flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            {fr ? "Cible de la promotion" : "Promotion target"}
          </h2>

          <div className="space-y-4">
            {/* Target type */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  updateField("targetType", "formation");
                  updateField("targetId", "");
                }}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  form.targetType === "formation"
                    ? "border-primary bg-primary/5 dark:bg-primary/10"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                }`}
              >
                <BookOpen className={`w-5 h-5 ${form.targetType === "formation" ? "text-primary" : "text-slate-400"}`} />
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {fr ? "Formation" : "Course"}
                  </p>
                  <p className="text-xs text-slate-500">{fr ? "Cours en ligne" : "Online course"}</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  updateField("targetType", "product");
                  updateField("targetId", "");
                }}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  form.targetType === "product"
                    ? "border-primary bg-primary/5 dark:bg-primary/10"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                }`}
              >
                <Package className={`w-5 h-5 ${form.targetType === "product" ? "text-primary" : "text-slate-400"}`} />
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {fr ? "Produit numerique" : "Digital product"}
                  </p>
                  <p className="text-xs text-slate-500">{fr ? "Ebook, template, etc." : "Ebook, template, etc."}</p>
                </div>
              </button>
            </div>

            {/* Target selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {form.targetType === "formation"
                  ? fr ? "Formation *" : "Course *"
                  : fr ? "Produit *" : "Product *"}
              </label>
              {loadingTargets ? (
                <div className="h-10 bg-slate-100 dark:bg-slate-800 dark:bg-slate-700 rounded-xl animate-pulse" />
              ) : (
                <select
                  value={form.targetId}
                  onChange={(e) => updateField("targetId", e.target.value)}
                  className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-700 dark:text-white transition-colors"
                >
                  <option value="">
                    {fr ? "Selectionnez..." : "Select..."}
                  </option>
                  {filteredTargets.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              )}
              {filteredTargets.length === 0 && !loadingTargets && (
                <p className="text-xs text-slate-400 mt-1.5">
                  {form.targetType === "formation"
                    ? fr ? "Vous n'avez aucune formation. Creez-en une d'abord." : "You have no courses. Create one first."
                    : fr ? "Vous n'avez aucun produit. Creez-en un d'abord." : "You have no products. Create one first."}
                </p>
              )}
              {errors.targetId && (
                <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5">
                  <AlertCircle className="w-3 h-3" />
                  {errors.targetId}
                </p>
              )}
            </div>

            {/* Discount */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {fr ? "Reduction (%) *" : "Discount (%) *"}
              </label>
              <div className="relative w-full max-w-[200px]">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={form.discountPct}
                  onChange={(e) => updateField("discountPct", e.target.value)}
                  placeholder="20"
                  className={`w-full text-sm border rounded-xl pl-10 pr-12 py-2.5 focus:outline-none focus:ring-2 transition-colors ${
                    errors.discountPct
                      ? "border-red-300 focus:ring-red-200 dark:border-red-600"
                      : "border-slate-300 dark:border-slate-600 focus:ring-primary/20 dark:bg-slate-700 dark:text-white"
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                  %
                </span>
              </div>
              {errors.discountPct && (
                <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5">
                  <AlertCircle className="w-3 h-3" />
                  {errors.discountPct}
                </p>
              )}
              <p className="text-xs text-slate-400 mt-1.5">
                {fr ? "Maximum 90%" : "Maximum 90%"}
              </p>
            </div>
          </div>
        </div>

        {/* Dates & limits section */}
        <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white dark:text-slate-100 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            {fr ? "Periode et limites" : "Period and limits"}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Start date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {fr ? "Date de debut *" : "Start date *"}
              </label>
              <input
                type="date"
                value={form.startsAt}
                onChange={(e) => updateField("startsAt", e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-700 dark:text-white transition-colors"
              />
            </div>

            {/* End date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {fr ? "Date de fin *" : "End date *"}
              </label>
              <input
                type="date"
                value={form.endsAt}
                onChange={(e) => updateField("endsAt", e.target.value)}
                min={form.startsAt || new Date().toISOString().split("T")[0]}
                className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-700 dark:text-white transition-colors"
              />
            </div>

            {/* Max usage */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {fr ? "Usage maximum (optionnel)" : "Maximum uses (optional)"}
              </label>
              <input
                type="number"
                min={1}
                value={form.maxUsage}
                onChange={(e) => updateField("maxUsage", e.target.value)}
                placeholder={fr ? "Illimite" : "Unlimited"}
                className="w-full max-w-[200px] text-sm border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-slate-700 dark:text-white transition-colors"
              />
              <p className="text-xs text-slate-400 mt-1.5">
                {fr
                  ? "Laissez vide pour un usage illimite"
                  : "Leave empty for unlimited uses"}
              </p>
            </div>
          </div>

          {errors.dates && (
            <p className="flex items-center gap-1 text-xs text-red-500 mt-3">
              <AlertCircle className="w-3 h-3" />
              {errors.dates}
            </p>
          )}
        </div>

        {/* Preview */}
        {form.targetId && form.discountPct && form.startsAt && form.endsAt && (
          <div className="bg-gradient-to-r from-primary/5 to-purple-50 dark:from-primary/10 dark:to-purple-900/20 rounded-xl border border-primary/20 dark:border-primary/30 p-5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              {fr ? "Apercu" : "Preview"}
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-slate-900 dark:text-white bg-white dark:bg-slate-900 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                {targets.find((t) => t.id === form.targetId)?.title || "—"}
              </span>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                &rarr;
              </span>
              <span className="text-lg font-bold text-green-600">
                -{form.discountPct}%
              </span>
              <span className="text-xs text-slate-400 bg-white dark:bg-slate-900 dark:bg-slate-800 px-2 py-1 rounded-md flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(form.startsAt).toLocaleDateString(
                  fr ? "fr-FR" : "en-US",
                  { day: "numeric", month: "short" },
                )}
                {" — "}
                {new Date(form.endsAt).toLocaleDateString(
                  fr ? "fr-FR" : "en-US",
                  { day: "numeric", month: "short" },
                )}
              </span>
              {form.maxUsage && (
                <span className="text-xs text-slate-400 bg-white dark:bg-slate-900 dark:bg-slate-800 px-2 py-1 rounded-md">
                  {fr ? `${form.maxUsage} utilisations max` : `${form.maxUsage} max uses`}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Submit error */}
        {submitError && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {submitError}
          </div>
        )}

        {/* Submit */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <Link
            href="/formations/instructeur/promotions"
            className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors order-2 sm:order-1"
          >
            {fr ? "Annuler" : "Cancel"}
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2 w-full sm:w-auto justify-center"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {fr ? "Creation en cours..." : "Creating..."}
              </>
            ) : (
              <>
                <Tag className="w-4 h-4" />
                {fr ? "Creer la promotion" : "Create promotion"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
