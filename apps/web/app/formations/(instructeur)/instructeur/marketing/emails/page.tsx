"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useInstructorEmailSequences, instructorKeys } from "@/lib/formations/hooks";
import Link from "next/link";
import {
  Mail, Plus, ToggleLeft, ToggleRight, Loader2, Trash2,
  Users, CheckCircle, BarChart3, Zap, Clock, ShoppingCart,
  UserPlus, Tag, BookOpen, Eye,
  MailOpen, Play, Search, SlidersHorizontal,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface SequenceSummary {
  id: string;
  name: string;
  description: string;
  trigger: string;
  triggerConfig: Record<string, unknown>;
  isActive: boolean;
  totalEnrolled: number;
  totalCompleted: number;
  openRate: number;
  stepsCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  totalSequences: number;
  activeSequences: number;
  totalEnrolled: number;
  totalCompleted: number;
  avgOpenRate: number;
}

// ── Trigger helpers ────────────────────────────────────────────────────────

const TRIGGER_META: Record<
  string,
  { label: string; labelEn: string; color: string; bg: string; icon: React.ReactNode }
> = {
  PURCHASE: {
    label: "Apres un achat",
    labelEn: "After purchase",
    color: "text-green-700 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    icon: <ShoppingCart className="w-3.5 h-3.5" />,
  },
  ENROLLMENT: {
    label: "Apres inscription",
    labelEn: "After enrollment",
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    icon: <BookOpen className="w-3.5 h-3.5" />,
  },
  ABANDONED_CART: {
    label: "Panier abandonne",
    labelEn: "Cart abandoned",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
    icon: <ShoppingCart className="w-3.5 h-3.5" />,
  },
  USER_INACTIVITY: {
    label: "Utilisateur inactif",
    labelEn: "User inactive",
    color: "text-orange-700 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  COURSE_COMPLETION: {
    label: "Formation terminee",
    labelEn: "Course completed",
    color: "text-purple-700 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  SIGNUP: {
    label: "Nouvel inscrit",
    labelEn: "New signup",
    color: "text-cyan-700 dark:text-cyan-400",
    bg: "bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800",
    icon: <UserPlus className="w-3.5 h-3.5" />,
  },
  TAG_ADDED: {
    label: "Tag ajoute",
    labelEn: "Tag added",
    color: "text-rose-700 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800",
    icon: <Tag className="w-3.5 h-3.5" />,
  },
};

function getTriggerMeta(trigger: string) {
  return (
    TRIGGER_META[trigger] || {
      label: trigger,
      labelEn: trigger,
      color: "text-slate-700 dark:text-slate-400",
      bg: "bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-700 dark:border-slate-800",
      icon: <Mail className="w-3.5 h-3.5" />,
    }
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Component ──────────────────────────────────────────────────────────────

export default function EmailSequencesPage() {
  const queryClient = useQueryClient();
  const { data: queryData, isLoading: loading } = useInstructorEmailSequences();
  const sequences: SequenceSummary[] = (queryData as { sequences?: SequenceSummary[] })?.sequences ?? [];
  const stats: Stats = (queryData as { stats?: Stats })?.stats ?? {
    totalSequences: 0,
    activeSequences: 0,
    totalEnrolled: 0,
    totalCompleted: 0,
    avgOpenRate: 0,
  };

  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTrigger, setFilterTrigger] = useState<string>("ALL");

  // ── Toggle active ──

  const handleToggle = async (seq: SequenceSummary) => {
    setToggling(seq.id);
    try {
      const res = await fetch("/api/marketing/sequences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: seq.id, isActive: !seq.isActive }),
      });
      if (res.ok) {
        await queryClient.invalidateQueries({ queryKey: instructorKeys.emailSequences() });
      }
    } catch {
      // fallback
    } finally {
      setToggling(null);
    }
  };

  // ── Delete ──

  const handleDelete = async (seqId: string) => {
    if (!confirm("Etes-vous sur de vouloir supprimer cette sequence ? Cette action est irreversible.")) {
      return;
    }
    setDeleting(seqId);
    try {
      const res = await fetch(`/api/marketing/sequences?id=${seqId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await queryClient.invalidateQueries({ queryKey: instructorKeys.emailSequences() });
      }
    } catch {
      // fallback
    } finally {
      setDeleting(null);
    }
  };

  // ── Filter & Search ──

  const filtered = sequences.filter((seq) => {
    const matchesSearch =
      !searchQuery ||
      seq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seq.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTrigger = filterTrigger === "ALL" || seq.trigger === filterTrigger;
    return matchesSearch && matchesTrigger;
  });

  // ── Loading ──

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/formations/instructeur/marketing"
              className="text-sm text-slate-500 hover:text-primary transition-colors"
            >
              Marketing
            </Link>
            <span className="text-slate-300">/</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white dark:text-slate-100 flex items-center gap-2">
            <Mail className="w-6 h-6 text-violet-500" />
            Sequences email
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Automatisez vos emails pour engager vos apprenants a chaque etape
          </p>
        </div>
        <Link
          href="/formations/instructeur/marketing/emails/creer"
          className="flex items-center gap-2 bg-violet-600 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-violet-700 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Nouvelle sequence
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Mail className="w-5 h-5 text-violet-600" />}
          iconBg="bg-violet-50 dark:bg-violet-900/20"
          label="Total sequences"
          labelEn="Total sequences"
          value={stats.totalSequences}
        />
        <StatCard
          icon={<Play className="w-5 h-5 text-green-600" />}
          iconBg="bg-green-50 dark:bg-green-900/20"
          label="Sequences actives"
          labelEn="Active sequences"
          value={stats.activeSequences}
        />
        <StatCard
          icon={<Users className="w-5 h-5 text-blue-600" />}
          iconBg="bg-blue-50 dark:bg-blue-900/20"
          label="Total inscrits"
          labelEn="Total enrolled"
          value={stats.totalEnrolled}
        />
        <StatCard
          icon={<MailOpen className="w-5 h-5 text-amber-600" />}
          iconBg="bg-amber-50 dark:bg-amber-900/20"
          label="Taux d'ouverture moy."
          labelEn="Avg. open rate"
          value={`${stats.avgOpenRate}%`}
        />
      </div>

      {/* Filters */}
      {sequences.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher une sequence..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm border border-slate-300 dark:border-slate-600 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Trigger filter */}
          <div className="relative">
            <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={filterTrigger}
              onChange={(e) => setFilterTrigger(e.target.value)}
              className="text-sm border border-slate-300 dark:border-slate-600 rounded-xl pl-10 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500/20 appearance-none bg-white dark:bg-slate-900 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="ALL">Tous les declencheurs</option>
              {Object.entries(TRIGGER_META).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Sequence list */}
      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((seq) => {
            const triggerMeta = getTriggerMeta(seq.trigger);
            const isToggling = toggling === seq.id;
            const isDeleting = deleting === seq.id;
            const completionRate =
              seq.totalEnrolled > 0
                ? ((seq.totalCompleted / seq.totalEnrolled) * 100).toFixed(1)
                : "0";

            return (
              <div
                key={seq.id}
                className={`bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border transition-all ${
                  seq.isActive
                    ? "border-slate-200 dark:border-slate-700"
                    : "border-slate-200 dark:border-slate-700 opacity-70"
                }`}
              >
                {/* Main row */}
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Left: info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white dark:text-slate-100 truncate">
                          {seq.name}
                        </h3>

                        {/* Trigger badge */}
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${triggerMeta.bg} ${triggerMeta.color}`}
                        >
                          {triggerMeta.icon}
                          {triggerMeta.label}
                        </span>

                        {/* Active / Inactive indicator */}
                        {seq.isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Inactive
                          </span>
                        )}
                      </div>

                      {seq.description && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                          {seq.description}
                        </p>
                      )}

                      {/* Mini stats row */}
                      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-violet-500" />
                          {seq.stepsCount} etape{seq.stepsCount > 1 ? "s" : ""}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-blue-500" />
                          {seq.totalEnrolled} inscrit{seq.totalEnrolled > 1 ? "s" : ""}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                          {seq.totalCompleted} termine{seq.totalCompleted > 1 ? "s" : ""} ({completionRate}%)
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MailOpen className="w-3.5 h-3.5 text-amber-500" />
                          {seq.openRate}% ouverture
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          Cree le {formatDate(seq.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Toggle active */}
                      <button
                        onClick={() => handleToggle(seq)}
                        disabled={isToggling}
                        className={`p-2 rounded-xl transition-colors ${
                          seq.isActive
                            ? "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                            : "text-slate-400 hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-700"
                        }`}
                        title={seq.isActive ? "Desactiver" : "Activer"}
                      >
                        {isToggling ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : seq.isActive ? (
                          <ToggleRight className="w-5 h-5" />
                        ) : (
                          <ToggleLeft className="w-5 h-5" />
                        )}
                      </button>

                      {/* View/Edit */}
                      <Link
                        href={`/formations/instructeur/marketing/emails/creer?edit=${seq.id}`}
                        className="p-2 rounded-xl text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                        title="Modifier"
                      >
                        <Eye className="w-5 h-5" />
                      </Link>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(seq.id)}
                        disabled={isDeleting}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Supprimer"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : sequences.length > 0 ? (
        /* No results for filter */
        <div className="text-center py-16 bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <Search className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-600 dark:text-slate-400">
            Aucun resultat
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Aucune sequence ne correspond a votre recherche.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setFilterTrigger("ALL");
            }}
            className="text-sm font-semibold text-violet-600 hover:underline mt-4"
          >
            Reinitialiser les filtres
          </button>
        </div>
      ) : (
        /* Empty state */
        <div className="text-center py-20 bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="w-20 h-20 rounded-full bg-violet-50 dark:bg-violet-900/20 mx-auto mb-6 flex items-center justify-center">
            <Mail className="w-10 h-10 text-violet-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white dark:text-slate-100">
            Automatisez vos emails
          </h2>
          <p className="text-sm text-slate-500 mt-3 max-w-md mx-auto leading-relaxed">
            Les sequences email vous permettent d&apos;envoyer automatiquement des emails a vos
            apprenants en fonction de leurs actions : inscription, achat, panier abandonne,
            inactivite, et plus encore.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mt-8">
            <FeatureCard
              icon={<UserPlus className="w-5 h-5 text-cyan-500" />}
              title="Accueil automatique"
              titleEn="Auto welcome"
              description="Accueillez chaque nouvel inscrit avec une serie d'emails personnalises"
            />
            <FeatureCard
              icon={<ShoppingCart className="w-5 h-5 text-amber-500" />}
              title="Recuperation panier"
              titleEn="Cart recovery"
              description="Relancez automatiquement les paniers abandonnes avec des offres ciblees"
            />
            <FeatureCard
              icon={<BarChart3 className="w-5 h-5 text-green-500" />}
              title="Suivi post-achat"
              titleEn="Post-purchase"
              description="Accompagnez vos apprenants apres l'achat pour maximiser la retention"
            />
          </div>

          <Link
            href="/formations/instructeur/marketing/emails/creer"
            className="inline-flex items-center gap-2 bg-violet-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-violet-700 transition-colors text-sm mt-8"
          >
            <Plus className="w-4 h-4" />
            Creer ma premiere sequence
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatCard({
  icon,
  iconBg,
  label,
  value,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  labelEn: string;
  value: string | number;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white dark:text-slate-100">{value}</p>
          <p className="text-xs text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  titleEn: string;
  description: string;
}) {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-700/30 rounded-xl p-4 text-left">
      <div className="mb-2">{icon}</div>
      <h3 className="text-sm font-bold text-slate-900 dark:text-white dark:text-slate-100 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
}
