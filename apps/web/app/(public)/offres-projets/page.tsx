"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { useCurrencyStore } from "@/store/currency";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Urgency = "normale" | "urgente" | "tres_urgente";
type ContractType = "ponctuel" | "long_terme" | "recurrent";

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  deadline: string;
  urgency: Urgency;
  contractType: ContractType;
  skills: string[];
  clientName: string;
  clientCountry: string;
  clientRating: number;
  proposals: number;
  status: string;
  postedAt: string;
}

interface ProjectsApiResponse {
  projects: Project[];
  total: number;
  page: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_KEYS = [
  "all",
  "design_ui_ux",
  "developpement_web",
  "developpement_web_2",
  "developpement",
  "identite_visuelle",
  "application_mobile",
  "marketing_digital",
  "marketing",
  "traduction",
  "video_animation",
  "redaction_seo",
  "redaction",
  "intelligence_artificielle",
  "cybersecurite",
] as const;

const CATEGORY_API_VALUES: Record<string, string> = {
  all: "",
  design_ui_ux: "Design UI/UX",
  developpement_web: "Developpement Web",
  developpement_web_2: "Développement Web",
  developpement: "Développement",
  identite_visuelle: "Identite Visuelle",
  application_mobile: "Application Mobile",
  marketing_digital: "Marketing Digital",
  marketing: "Marketing",
  traduction: "Traduction",
  video_animation: "Video & Animation",
  redaction_seo: "Redaction & SEO",
  redaction: "Rédaction",
  intelligence_artificielle: "Intelligence Artificielle",
  cybersecurite: "Cybersecurite",
};

const NIVEAU_KEYS = ["all", "debutant", "intermediaire", "expert"] as const;

const CONTRACT_TYPE_KEYS = ["tous", "ponctuel", "long_terme", "recurrent"] as const;

const URGENCY_OPTION_KEYS = ["toutes", "normale", "urgente", "tres_urgente"] as const;

const SORT_OPTION_KEYS: { value: string; icon: string }[] = [
  { value: "recent", icon: "schedule" },
  { value: "budget_desc", icon: "trending_down" },
  { value: "budget_asc", icon: "trending_up" },
  { value: "deadline", icon: "priority_high" },
];

const ITEMS_PER_PAGE = 12;

const URGENCY_CONFIG: Record<
  Urgency,
  { tKey: string; bgClass: string; textClass: string; borderClass: string; icon: string }
> = {
  normale: {
    tKey: "urgency_badge.normale",
    bgClass: "bg-slate-100 dark:bg-slate-700/50",
    textClass: "text-slate-600 dark:text-slate-300",
    borderClass: "border-slate-200 dark:border-slate-600",
    icon: "schedule",
  },
  urgente: {
    tKey: "urgency_badge.urgente",
    bgClass: "bg-amber-50 dark:bg-amber-900/30",
    textClass: "text-amber-700 dark:text-amber-400",
    borderClass: "border-amber-200 dark:border-amber-700/50",
    icon: "warning",
  },
  tres_urgente: {
    tKey: "urgency_badge.tres_urgente",
    bgClass: "bg-red-50 dark:bg-red-900/30",
    textClass: "text-red-700 dark:text-red-400",
    borderClass: "border-red-200 dark:border-red-700/50",
    icon: "error",
  },
};

const CONTRACT_LABEL_KEYS: Record<ContractType, string> = {
  ponctuel: "contract_label.ponctuel",
  long_terme: "contract_label.long_terme",
  recurrent: "contract_label.recurrent",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysAgo(dateStr: string, t: ReturnType<typeof useTranslations>): string {
  const diff = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff === 0) return t("today");
  if (diff === 1) return t("yesterday");
  return t("days_ago", { count: diff });
}

function daysUntil(dateStr: string, t: ReturnType<typeof useTranslations>): string {
  const diff = Math.ceil(
    (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (diff <= 0) return t("expired");
  if (diff === 1) return t("days_remaining_one");
  return t("days_remaining", { count: diff });
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function ProjectsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="animate-pulse p-5 rounded-2xl bg-white dark:bg-neutral-dark border border-slate-200 dark:border-border-dark">
          <div className="flex gap-2 mb-3">
            <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded-full" />
            <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
          </div>
          <div className="h-5 w-full bg-slate-200 dark:bg-slate-700 rounded mb-2" />
          <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
          <div className="flex gap-1.5 mb-4">
            <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-md" />
            <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded-md" />
            <div className="h-5 w-14 bg-slate-200 dark:bg-slate-700 rounded-md" />
          </div>
          <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
          <div className="h-8 w-full bg-slate-200 dark:bg-slate-700 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative w-full">
      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
        search
      </span>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full pl-12 pr-4 py-3.5 rounded-xl text-sm font-medium",
          "bg-white dark:bg-neutral-dark",
          "border border-slate-200 dark:border-border-dark",
          "text-slate-900 dark:text-slate-100",
          "placeholder:text-slate-400 dark:placeholder:text-slate-500",
          "outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary",
          "transition-all"
        )}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      )}
    </div>
  );
}

function FilterSidebar({
  category,
  setCategory,
  budgetMin,
  setBudgetMin,
  budgetMax,
  setBudgetMax,
  deadline,
  setDeadline,
  niveau,
  setNiveau,
  contractType,
  setContractType,
  urgency,
  setUrgency,
  onReset,
  hasFilters,
  t,
}: {
  category: string;
  setCategory: (v: string) => void;
  budgetMin: string;
  setBudgetMin: (v: string) => void;
  budgetMax: string;
  setBudgetMax: (v: string) => void;
  deadline: string;
  setDeadline: (v: string) => void;
  niveau: string;
  setNiveau: (v: string) => void;
  contractType: string;
  setContractType: (v: string) => void;
  urgency: string;
  setUrgency: (v: string) => void;
  onReset: () => void;
  hasFilters: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <aside className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">
            tune
          </span>
          {t("filters")}
        </h3>
        {hasFilters && (
          <button
            onClick={onReset}
            className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">
              restart_alt
            </span>
            {t("reset_filters")}
          </button>
        )}
      </div>

      {/* Category */}
      <FilterGroup label={t("filter_category")} icon="category">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={cn(
            "w-full rounded-lg px-3 py-2.5 text-sm font-medium",
            "bg-white dark:bg-neutral-dark",
            "border border-slate-200 dark:border-border-dark",
            "text-slate-700 dark:text-slate-200",
            "outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary",
            "transition-all cursor-pointer"
          )}
        >
          {CATEGORY_KEYS.map((key) => (
            <option key={key} value={key}>
              {t(`cat.${key}`)}
            </option>
          ))}
        </select>
      </FilterGroup>

      {/* Budget */}
      <FilterGroup label={t("filter_budget")} icon="payments">
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={budgetMin}
            onChange={(e) => setBudgetMin(e.target.value)}
            className={cn(
              "w-full rounded-lg px-3 py-2.5 text-sm font-medium",
              "bg-white dark:bg-neutral-dark",
              "border border-slate-200 dark:border-border-dark",
              "text-slate-700 dark:text-slate-200",
              "placeholder:text-slate-400 dark:placeholder:text-slate-500",
              "outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary",
              "transition-all"
            )}
          />
          <input
            type="number"
            placeholder="Max"
            value={budgetMax}
            onChange={(e) => setBudgetMax(e.target.value)}
            className={cn(
              "w-full rounded-lg px-3 py-2.5 text-sm font-medium",
              "bg-white dark:bg-neutral-dark",
              "border border-slate-200 dark:border-border-dark",
              "text-slate-700 dark:text-slate-200",
              "placeholder:text-slate-400 dark:placeholder:text-slate-500",
              "outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary",
              "transition-all"
            )}
          />
        </div>
      </FilterGroup>

      {/* Deadline */}
      <FilterGroup label={t("filter_deadline")} icon="event">
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className={cn(
            "w-full rounded-lg px-3 py-2.5 text-sm font-medium",
            "bg-white dark:bg-neutral-dark",
            "border border-slate-200 dark:border-border-dark",
            "text-slate-700 dark:text-slate-200",
            "outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary",
            "transition-all cursor-pointer"
          )}
        />
      </FilterGroup>

      {/* Niveau requis */}
      <FilterGroup label={t("filter_level")} icon="school">
        <select
          value={niveau}
          onChange={(e) => setNiveau(e.target.value)}
          className={cn(
            "w-full rounded-lg px-3 py-2.5 text-sm font-medium",
            "bg-white dark:bg-neutral-dark",
            "border border-slate-200 dark:border-border-dark",
            "text-slate-700 dark:text-slate-200",
            "outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary",
            "transition-all cursor-pointer"
          )}
        >
          {NIVEAU_KEYS.map((key) => (
            <option key={key} value={key}>
              {t(`level.${key}`)}
            </option>
          ))}
        </select>
      </FilterGroup>

      {/* Type de contrat */}
      <FilterGroup label={t("filter_contract_type")} icon="description">
        <div className="space-y-2">
          {CONTRACT_TYPE_KEYS.map((key) => (
            <label
              key={key}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all text-sm font-medium",
                contractType === key
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-dark border border-transparent"
              )}
            >
              <div
                className={cn(
                  "size-4 rounded-full border-2 flex items-center justify-center transition-all",
                  contractType === key
                    ? "border-primary"
                    : "border-slate-300 dark:border-slate-600"
                )}
              >
                {contractType === key && (
                  <div className="size-2 rounded-full bg-primary" />
                )}
              </div>
              {t(`contract.${key}`)}
            </label>
          ))}
        </div>
      </FilterGroup>

      {/* Urgence */}
      <FilterGroup label={t("filter_urgency")} icon="priority_high">
        <div className="space-y-2">
          {URGENCY_OPTION_KEYS.map((key) => (
            <label
              key={key}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all text-sm font-medium",
                urgency === key
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-dark border border-transparent"
              )}
            >
              <div
                className={cn(
                  "size-4 rounded-full border-2 flex items-center justify-center transition-all",
                  urgency === key
                    ? "border-primary"
                    : "border-slate-300 dark:border-slate-600"
                )}
              >
                {urgency === key && (
                  <div className="size-2 rounded-full bg-primary" />
                )}
              </div>
              {t(`urgency.${key}`)}
            </label>
          ))}
        </div>
      </FilterGroup>
    </aside>
  );
}

function FilterGroup({
  label,
  icon,
  children,
}: {
  label: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
        <span className="material-symbols-outlined text-sm">{icon}</span>
        {label}
      </label>
      {children}
    </div>
  );
}

function SortBar({
  sort,
  setSort,
  total,
  loading,
  t,
}: {
  sort: string;
  setSort: (v: string) => void;
  total: number;
  loading: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
        {loading ? (
          <span className="inline-block h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        ) : (
          <>
            <span className="text-slate-900 dark:text-slate-100 font-bold">
              {total}
            </span>{" "}
            {t("results_count", { count: total })}
          </>
        )}
      </p>
      <div className="flex gap-2 flex-wrap">
        {SORT_OPTION_KEYS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSort(opt.value)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
              sort === opt.value
                ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                : "bg-white dark:bg-neutral-dark text-slate-600 dark:text-slate-300 border-slate-200 dark:border-border-dark hover:border-primary/40 hover:text-primary"
            )}
          >
            <span className="material-symbols-outlined text-sm">
              {opt.icon}
            </span>
            {t(`sort.${opt.value}`)}
          </button>
        ))}
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  onSelect,
  t,
}: {
  project: Project;
  onSelect: (p: Project) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const { format } = useCurrencyStore();
  const urgConfig = URGENCY_CONFIG[project.urgency];
  const showUrgencyBadge = project.urgency !== "normale";

  return (
    <div
      onClick={() => onSelect(project)}
      className={cn(
        "group relative flex flex-col p-5 rounded-2xl cursor-pointer",
        "bg-white dark:bg-neutral-dark",
        "border border-slate-200 dark:border-border-dark",
        "hover:border-primary/40 dark:hover:border-primary/40",
        "hover:shadow-lg hover:shadow-primary/5",
        "transition-all duration-200"
      )}
    >
      {/* Top row: category + urgency */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold",
            "bg-primary/10 text-primary border border-primary/20"
          )}
        >
          <span className="material-symbols-outlined text-sm">folder</span>
          {project.category}
        </span>
        {showUrgencyBadge && (
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border",
              urgConfig.bgClass,
              urgConfig.textClass,
              urgConfig.borderClass
            )}
          >
            <span className="material-symbols-outlined text-sm">
              {urgConfig.icon}
            </span>
            {t(urgConfig.tKey)}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors leading-snug mb-2 line-clamp-2">
        {project.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 mb-3">
        {project.description}
      </p>

      {/* Skills */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {(project.skills || []).slice(0, 4).map((skill) => (
          <span
            key={skill}
            className={cn(
              "px-2 py-0.5 text-xs font-semibold rounded-md",
              "bg-slate-100 dark:bg-background-dark",
              "text-slate-600 dark:text-slate-300",
              "border border-slate-200 dark:border-border-dark"
            )}
          >
            {skill}
          </span>
        ))}
        {(project.skills || []).length > 4 && (
          <span className="px-2 py-0.5 text-xs font-semibold text-slate-400 dark:text-slate-500">
            +{project.skills.length - 4}
          </span>
        )}
      </div>

      {/* Budget */}
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary text-lg">
          payments
        </span>
        <span className="text-sm font-extrabold text-primary">
          {format(project.budgetMin)} - {format(project.budgetMax)}
        </span>
      </div>

      {/* Client row */}
      <div className="flex items-center gap-2 mb-4">
        <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-sm">
            person
          </span>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
            {project.clientName}
          </span>
          {project.clientRating > 0 && (
            <div className="flex items-center gap-0.5">
              <span className="material-symbols-outlined text-amber-500 text-sm">
                star
              </span>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {project.clientRating}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer: proposals, deadline, posted */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-border-dark mt-auto">
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">group</span>
            {project.proposals} {t("proposals")}
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">
              calendar_today
            </span>
            {daysUntil(project.deadline, t)}
          </span>
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {daysAgo(project.postedAt, t)}
        </span>
      </div>

      {/* CTA */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSelect(project);
        }}
        className={cn(
          "mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl",
          "bg-primary hover:bg-primary/90 text-white text-sm font-bold",
          "shadow-md shadow-primary/20 transition-all"
        )}
      >
        <span className="material-symbols-outlined text-sm">send</span>
        {t("apply")}
      </button>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onChange,
}: {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | "ellipsis")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("ellipsis");
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("ellipsis");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-8 py-4">
      <button
        onClick={() => onChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className={cn(
          "size-10 flex items-center justify-center rounded-xl border transition-all",
          "bg-white dark:bg-neutral-dark border-slate-200 dark:border-border-dark",
          "text-slate-600 dark:text-slate-300",
          "hover:bg-primary hover:text-white hover:border-primary",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-neutral-dark disabled:hover:text-slate-600 dark:disabled:hover:text-slate-300"
        )}
      >
        <span className="material-symbols-outlined text-xl">chevron_left</span>
      </button>

      {pages.map((page, idx) =>
        page === "ellipsis" ? (
          <span
            key={`ellipsis-${idx}`}
            className="text-slate-400 px-1 select-none"
          >
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onChange(page as number)}
            className={cn(
              "size-10 flex items-center justify-center rounded-xl border text-sm font-bold transition-all",
              currentPage === page
                ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                : "bg-white dark:bg-neutral-dark border-slate-200 dark:border-border-dark text-slate-600 dark:text-slate-300 hover:bg-primary hover:text-white hover:border-primary"
            )}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className={cn(
          "size-10 flex items-center justify-center rounded-xl border transition-all",
          "bg-white dark:bg-neutral-dark border-slate-200 dark:border-border-dark",
          "text-slate-600 dark:text-slate-300",
          "hover:bg-primary hover:text-white hover:border-primary",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-neutral-dark disabled:hover:text-slate-600 dark:disabled:hover:text-slate-300"
        )}
      >
        <span className="material-symbols-outlined text-xl">
          chevron_right
        </span>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail slide-over
// ---------------------------------------------------------------------------

function ProjectDetailPanel({
  project,
  onClose,
  t,
  locale,
}: {
  project: Project;
  onClose: () => void;
  t: ReturnType<typeof useTranslations>;
  locale: string;
}) {
  const { format } = useCurrencyStore();
  const urgConfig = URGENCY_CONFIG[project.urgency];

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-white dark:bg-background-dark border-l border-slate-200 dark:border-border-dark shadow-2xl animate-slide-in overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-background-dark border-b border-slate-200 dark:border-border-dark px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate pr-4">
            {t("detail_title")}
          </h2>
          <button
            onClick={onClose}
            className="size-9 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-neutral-dark hover:bg-slate-200 dark:hover:bg-border-dark transition-colors"
          >
            <span className="material-symbols-outlined text-slate-600 dark:text-slate-300">
              close
            </span>
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold",
                "bg-primary/10 text-primary border border-primary/20"
              )}
            >
              <span className="material-symbols-outlined text-sm">folder</span>
              {project.category}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border",
                urgConfig.bgClass,
                urgConfig.textClass,
                urgConfig.borderClass
              )}
            >
              <span className="material-symbols-outlined text-sm">
                {urgConfig.icon}
              </span>
              {t(urgConfig.tKey)}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold",
                "bg-slate-100 dark:bg-neutral-dark text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-border-dark"
              )}
            >
              <span className="material-symbols-outlined text-sm">
                description
              </span>
              {t(CONTRACT_LABEL_KEYS[project.contractType])}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 leading-snug">
            {project.title}
          </h3>

          {/* Client profile */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-neutral-dark border border-slate-200 dark:border-border-dark">
            <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-primary text-2xl">
                person
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                {project.clientName}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {project.clientRating > 0 && (
                  <div className="flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-amber-500 text-sm">
                      star
                    </span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      {project.clientRating}
                    </span>
                  </div>
                )}
                {project.clientCountry && (
                  <span className="text-xs text-slate-400">
                    {project.clientCountry}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-lg">
                article
              </span>
              {t("detail_description")}
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {project.description}
            </p>
          </div>

          {/* Skills / Requirements */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-lg">
                construction
              </span>
              {t("detail_skills")}
            </h4>
            <div className="flex flex-wrap gap-2">
              {(project.skills || []).map((skill) => (
                <span
                  key={skill}
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold rounded-full",
                    "bg-primary/10 text-primary border border-primary/20"
                  )}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Budget, deadline, contract */}
          <div className="grid grid-cols-1 gap-3">
            <DetailInfoRow
              icon="payments"
              label={t("budget")}
              value={`${format(project.budgetMin)} - ${format(project.budgetMax)}`}
              valueClass="text-primary font-extrabold"
            />
            <DetailInfoRow
              icon="event"
              label={t("deadline")}
              value={new Date(project.deadline).toLocaleDateString(locale === "en" ? "en-US" : "fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            />
            <DetailInfoRow
              icon="schedule"
              label={t("detail_time_remaining")}
              value={daysUntil(project.deadline, t)}
            />
            <DetailInfoRow
              icon="description"
              label={t("filter_contract_type")}
              value={t(CONTRACT_LABEL_KEYS[project.contractType])}
            />
            {project.clientCountry && (
              <DetailInfoRow
                icon="location_on"
                label={t("detail_country")}
                value={project.clientCountry}
              />
            )}
            <DetailInfoRow
              icon="group"
              label={t("detail_proposals_received")}
              value={`${project.proposals} ${t("detail_applications")}`}
            />
            <DetailInfoRow
              icon="calendar_today"
              label={t("detail_posted")}
              value={daysAgo(project.postedAt, t)}
            />
          </div>

          {/* CTA */}
          <div className="pt-4 border-t border-slate-200 dark:border-border-dark space-y-3">
            <a
              href={`/connexion?redirect=${encodeURIComponent(`/offres-projets?apply=${project.id}`)}`}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl",
                "bg-primary hover:bg-primary/90 text-white text-sm font-bold",
                "shadow-lg shadow-primary/20 transition-all"
              )}
            >
              <span className="material-symbols-outlined text-lg">send</span>
              {t("submit_proposal")}
            </a>
            <a
              href={`/projets/${project.id}`}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3 rounded-xl",
                "bg-slate-100 dark:bg-neutral-dark",
                "text-slate-600 dark:text-slate-300 text-sm font-bold",
                "border border-slate-200 dark:border-border-dark",
                "hover:bg-slate-200 dark:hover:bg-border-dark transition-all"
              )}
            >
              <span className="material-symbols-outlined text-lg">open_in_new</span>
              {t("view_full_page") || "Voir la page complete"}
            </a>
            <button
              onClick={onClose}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3 rounded-xl",
                "text-slate-500 dark:text-slate-400 text-sm font-semibold",
                "hover:text-slate-700 dark:hover:text-slate-200 transition-all"
              )}
            >
              {t("close")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailInfoRow({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: string;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-neutral-dark border border-slate-100 dark:border-border-dark">
      <span className="material-symbols-outlined text-primary text-lg">
        {icon}
      </span>
      <div className="flex items-center justify-between flex-1 gap-4 min-w-0">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
          {label}
        </span>
        <span
          className={cn(
            "text-sm font-bold text-slate-900 dark:text-slate-100 text-right truncate",
            valueClass
          )}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mobile filters drawer
// ---------------------------------------------------------------------------

function MobileFiltersDrawer({
  open,
  onClose,
  children,
  t,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  t: ReturnType<typeof useTranslations>;
}) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute inset-y-0 left-0 w-full max-w-sm bg-white dark:bg-background-dark border-r border-slate-200 dark:border-border-dark shadow-2xl animate-slide-in overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white dark:bg-background-dark border-b border-slate-200 dark:border-border-dark px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {t("filters")}
          </h2>
          <button
            onClick={onClose}
            className="size-9 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-neutral-dark hover:bg-slate-200 dark:hover:bg-border-dark transition-colors"
          >
            <span className="material-symbols-outlined text-slate-600 dark:text-slate-300">
              close
            </span>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function OffresProjectsPage() {
  const t = useTranslations("projects");
  const locale = useLocale();

  // Search & filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>(CATEGORY_KEYS[0]);
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [deadline, setDeadline] = useState("");
  const [niveau, setNiveau] = useState<string>(NIVEAU_KEYS[0]);
  const [contractType, setContractType] = useState("tous");
  const [urgency, setUrgency] = useState("toutes");

  // Sort & pagination
  const [sort, setSort] = useState("recent");
  const [currentPage, setCurrentPage] = useState(1);

  // API data
  const [projects, setProjects] = useState<Project[]>([]);
  const [totalFromApi, setTotalFromApi] = useState(0);
  const [totalPagesFromApi, setTotalPagesFromApi] = useState(1);
  const [loading, setLoading] = useState(true);

  // UI
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const hasFilters =
    category !== CATEGORY_KEYS[0] ||
    budgetMin !== "" ||
    budgetMax !== "" ||
    deadline !== "" ||
    niveau !== NIVEAU_KEYS[0] ||
    contractType !== "tous" ||
    urgency !== "toutes" ||
    search !== "";

  const resetFilters = useCallback(() => {
    setSearch("");
    setCategory(CATEGORY_KEYS[0]);
    setBudgetMin("");
    setBudgetMax("");
    setDeadline("");
    setNiveau(NIVEAU_KEYS[0]);
    setContractType("tous");
    setUrgency("toutes");
    setCurrentPage(1);
  }, []);

  // Fetch projects from API — all filters sent server-side
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();

    // Map category filter to API param
    const categoryApiValue = CATEGORY_API_VALUES[category];
    if (categoryApiValue) {
      params.set("category", categoryApiValue);
    }
    if (urgency !== "toutes") {
      params.set("urgency", urgency);
    }
    if (search.trim()) {
      params.set("q", search.trim());
    }
    if (budgetMin) params.set("budgetMin", budgetMin);
    if (budgetMax) params.set("budgetMax", budgetMax);
    if (deadline) params.set("deadline", deadline);
    if (contractType !== "tous") params.set("contractType", contractType);
    params.set("sort", sort);
    params.set("page", currentPage.toString());
    params.set("limit", ITEMS_PER_PAGE.toString());

    fetch(`/api/public/projects?${params.toString()}`)
      .then((res) => res.json())
      .then((data: ProjectsApiResponse) => {
        setProjects(data.projects || []);
        setTotalFromApi(data.total || 0);
        setTotalPagesFromApi(data.totalPages || 1);
        setLoading(false);
      })
      .catch(() => {
        setProjects([]);
        setTotalFromApi(0);
        setTotalPagesFromApi(1);
        setLoading(false);
      });
  }, [category, urgency, search, budgetMin, budgetMax, deadline, contractType, sort, currentPage]);

  // Projects are already filtered by the API — no client-side filter needed
  const filteredProjects = projects;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [category, urgency, search, budgetMin, budgetMax, deadline, contractType, sort]);

  const handleSelectProject = useCallback((project: Project) => {
    setSelectedProject(project);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedProject(null);
  }, []);

  // Total is always from the API since all filtering is server-side
  const displayTotal = totalFromApi;

  const sidebarContent = (
    <FilterSidebar
      category={category}
      setCategory={setCategory}
      budgetMin={budgetMin}
      setBudgetMin={setBudgetMin}
      budgetMax={budgetMax}
      setBudgetMax={setBudgetMax}
      deadline={deadline}
      setDeadline={setDeadline}
      niveau={niveau}
      setNiveau={setNiveau}
      contractType={contractType}
      setContractType={setContractType}
      urgency={urgency}
      setUrgency={setUrgency}
      onReset={resetFilters}
      hasFilters={hasFilters}
      t={t}
    />
  );

  return (
    <>
      <section className="px-4 sm:px-6 lg:px-8 pt-10 pb-20">
        <div className="max-w-[1440px] mx-auto space-y-8">
          {/* ---------------------------------------------------------------- */}
          {/* Header                                                           */}
          {/* ---------------------------------------------------------------- */}
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  {t("title")}
                </h1>
                <p className="text-base text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                  {t("subtitle")}
                </p>
              </div>
              {/* Mobile filter toggle */}
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className={cn(
                  "lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl",
                  "bg-white dark:bg-neutral-dark",
                  "border border-slate-200 dark:border-border-dark",
                  "text-sm font-bold text-slate-700 dark:text-slate-200",
                  "hover:border-primary/40 transition-all flex-shrink-0"
                )}
              >
                <span className="material-symbols-outlined text-primary text-lg">
                  tune
                </span>
                {t("filters")}
                {hasFilters && (
                  <span className="size-5 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                    !
                  </span>
                )}
              </button>
            </div>

            {/* Search bar */}
            <SearchBar value={search} onChange={setSearch} placeholder={t("search_placeholder")} />
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Sort bar                                                         */}
          {/* ---------------------------------------------------------------- */}
          <SortBar
            sort={sort}
            setSort={setSort}
            total={displayTotal}
            loading={loading}
            t={t}
          />

          {/* ---------------------------------------------------------------- */}
          {/* Main layout: sidebar + grid                                      */}
          {/* ---------------------------------------------------------------- */}
          <div className="flex gap-8">
            {/* Sidebar (desktop) */}
            <div className="hidden lg:block w-72 flex-shrink-0">
              <div className="sticky top-28 p-5 rounded-2xl bg-white dark:bg-neutral-dark border border-slate-200 dark:border-border-dark">
                {sidebarContent}
              </div>
            </div>

            {/* Projects grid */}
            <div className="flex-1 min-w-0">
              {loading ? (
                <ProjectsSkeleton />
              ) : filteredProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onSelect={handleSelectProject}
                      t={t}
                    />
                  ))}
                </div>
              ) : (
                /* Empty state */
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="size-20 rounded-2xl bg-slate-100 dark:bg-neutral-dark flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-4xl">
                      search_off
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
                    {t("empty_title")}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
                    {t("empty_description")}
                  </p>
                  <button
                    onClick={resetFilters}
                    className={cn(
                      "flex items-center gap-2 px-6 py-2.5 rounded-xl",
                      "bg-primary hover:bg-primary/90 text-white text-sm font-bold",
                      "shadow-md shadow-primary/20 transition-all"
                    )}
                  >
                    <span className="material-symbols-outlined text-sm">
                      restart_alt
                    </span>
                    {t("reset_all_filters")}
                  </button>
                </div>
              )}

              {/* Pagination */}
              {!loading && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPagesFromApi}
                  onChange={setCurrentPage}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile filters drawer */}
      <MobileFiltersDrawer
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        t={t}
      >
        {sidebarContent}
      </MobileFiltersDrawer>

      {/* Detail slide-over */}
      {selectedProject && (
        <ProjectDetailPanel
          project={selectedProject}
          onClose={handleCloseDetail}
          t={t}
          locale={locale}
        />
      )}
    </>
  );
}
