"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import EmptyState from "@/components/formations/EmptyState";

// ── Types ─────────────────────────────────────────────────────────

type DiscussionStatus = "active" | "locked" | "resolved";
type FilterTab = "all" | "open" | "resolved" | "mine";

interface Discussion {
  id: string;
  formationId: string;
  formationTitle: string;
  title: string;
  repliesCount: number;
  unreadCount: number;
  lastActivityAt: string;
  status: DiscussionStatus;
  isAuthor: boolean;
}

// ── Component ─────────────────────────────────────────────────────

export default function MesDiscussionsPage() {
  const locale = useLocale();
  const t = useTranslations("formations_nav");
  const { status } = useSession();
  const router = useRouter();
  const fr = locale === "fr";

  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/formations/connexion");
      return;
    }
  }, [status, router]);

  const fetchDiscussions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/apprenant/discussions");
      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();
      setDiscussions(data.discussions ?? []);
    } catch {
      setError(
        fr
          ? "Impossible de charger vos discussions"
          : "Failed to load your discussions"
      );
    } finally {
      setLoading(false);
    }
  }, [fr]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchDiscussions();
    }
  }, [status, fetchDiscussions]);

  // ── Filtering ───────────────────────────────────────────────────

  const filtered = discussions.filter((d) => {
    if (activeTab === "open") return d.status === "active";
    if (activeTab === "resolved") return d.status === "resolved";
    if (activeTab === "mine") return d.isAuthor;
    return true;
  });

  const tabs: { key: FilterTab; labelKey: string }[] = [
    { key: "all", labelKey: "discussions_all" },
    { key: "open", labelKey: "discussions_open" },
    { key: "resolved", labelKey: "discussions_resolved" },
    { key: "mine", labelKey: "discussions_mine" },
  ];

  // ── Status badge ────────────────────────────────────────────────

  const statusLabel = (s: DiscussionStatus) =>
    ({
      active: t("discussions_active"),
      locked: t("discussions_locked"),
      resolved: t("discussions_resolved"),
    }[s]);

  const statusColor = (s: DiscussionStatus) =>
    ({
      active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      locked: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:bg-slate-700 dark:text-slate-400",
      resolved: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    }[s]);

  // ── Loading skeleton ────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3 animate-pulse" />
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg w-80 animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-28 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-3xl text-red-500">
              error
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            {fr ? "Erreur de chargement" : "Loading error"}
          </h2>
          <p className="text-sm text-slate-500 mb-6">{error}</p>
          <button
            onClick={fetchDiscussions}
            className="inline-flex items-center gap-2 bg-primary text-white font-bold px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
            {fr ? "Reessayer" : "Retry"}
          </button>
        </div>
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {t("my_discussions")}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {fr
            ? "Retrouvez toutes vos discussions de formations"
            : "View all your course discussions"}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === tab.key
                ? "bg-white dark:bg-slate-900 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {/* Discussion list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={
            <span className="material-symbols-outlined text-4xl text-slate-400">
              forum
            </span>
          }
          title={
            fr
              ? "Aucune discussion"
              : "No discussions"
          }
          description={
            fr
              ? "Vous n'avez pas encore participe a des discussions. Posez des questions dans vos formations !"
              : "You haven't participated in any discussions yet. Ask questions in your courses!"
          }
          ctaLabel={fr ? "Explorer les formations" : "Explore courses"}
          ctaHref="/formations/explorer"
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((discussion) => (
            <Link
              key={discussion.id}
              href={`/formations/apprendre/${discussion.formationId}#discussions`}
              className="block bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-primary/20 hover:shadow-sm transition-all p-4 sm:p-5"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-xl text-primary">
                    forum
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Formation name */}
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 truncate">
                    {discussion.formationTitle}
                  </p>

                  {/* Discussion title */}
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">
                      {discussion.title}
                    </h3>
                    {discussion.unreadCount > 0 && (
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {discussion.unreadCount > 9
                          ? "9+"
                          : discussion.unreadCount}
                      </span>
                    )}
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Replies count */}
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <span className="material-symbols-outlined text-sm">
                        chat_bubble_outline
                      </span>
                      {discussion.repliesCount}{" "}
                      {fr
                        ? discussion.repliesCount === 1
                          ? "reponse"
                          : "reponses"
                        : discussion.repliesCount === 1
                        ? "reply"
                        : "replies"}
                    </span>

                    {/* Last activity */}
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <span className="material-symbols-outlined text-sm">
                        schedule
                      </span>
                      {new Date(discussion.lastActivityAt).toLocaleDateString(
                        fr ? "fr-FR" : "en-US",
                        { day: "numeric", month: "short", year: "numeric" }
                      )}
                    </span>

                    {/* Status badge */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor(
                        discussion.status
                      )}`}
                    >
                      {statusLabel(discussion.status)}
                    </span>
                  </div>
                </div>

                {/* Chevron */}
                <span className="material-symbols-outlined text-xl text-slate-400 flex-shrink-0 hidden sm:block">
                  chevron_right
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
