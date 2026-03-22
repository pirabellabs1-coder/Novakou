"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";

interface AuditEntry {
  id: string;
  adminName: string;
  adminAvatar: string | null;
  action: string;
  actionType: string;
  targetLabel: string;
  targetUrl: string | null;
  details: string;
  createdAt: string;
}

const ACTION_TYPE_STYLES: Record<
  string,
  { bg: string; text: string; icon: string }
> = {
  approval: {
    bg: "bg-green-50 dark:bg-green-900/20",
    text: "text-green-700 dark:text-green-400",
    icon: "check_circle",
  },
  rejection: {
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-700 dark:text-red-400",
    icon: "cancel",
  },
  moderation: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-700 dark:text-blue-400",
    icon: "shield",
  },
  refund: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-700 dark:text-amber-400",
    icon: "currency_exchange",
  },
};

const FILTER_TABS = [
  { value: "", label: "Tous" },
  { value: "approval", label: "Approbations" },
  { value: "rejection", label: "Rejets" },
  { value: "moderation", label: "Modération" },
  { value: "refund", label: "Remboursements" },
];

const PAGE_SIZE = 50;

export default function AdminAuditLogPage() {
  const locale = useLocale();
  const t = useTranslations("formations_nav");
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    setEntries([]);
    setPage(1);
    setHasMore(true);
    fetchEntries(1, true);
  }, [filterType]);

  const fetchEntries = async (pageNum: number, reset = false) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = new URLSearchParams();
      params.set("page", pageNum.toString());
      params.set("limit", PAGE_SIZE.toString());
      if (filterType) params.set("type", filterType);

      const res = await fetch(
        `/api/admin/formations/audit-log?${params.toString()}`
      );
      const data = await res.json();
      const newEntries: AuditEntry[] = data.entries ?? [];

      if (reset) {
        setEntries(newEntries);
      } else {
        setEntries((prev) => [...prev, ...newEntries]);
      }
      setHasMore(newEntries.length === PAGE_SIZE);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchEntries(nextPage);
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const dateFormatted = date.toLocaleDateString(
      locale === "en" ? "en-GB" : "fr-FR",
      { day: "2-digit", month: "short", year: "numeric" }
    );
    const timeFormatted = date.toLocaleTimeString(
      locale === "en" ? "en-GB" : "fr-FR",
      { hour: "2-digit", minute: "2-digit" }
    );
    return { date: dateFormatted, time: timeFormatted };
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-9 w-24 bg-slate-200 dark:bg-slate-700 rounded-full"
            />
          ))}
        </div>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-20 bg-slate-200 dark:bg-slate-700 rounded-xl"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">
        Journal d&apos;audit
      </h1>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterType(tab.value)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
              filterType === tab.value
                ? "bg-primary text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {entries.length === 0 ? (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-3 block">
            history
          </span>
          <p className="text-sm text-slate-400">
            Aucune entrée dans le journal d&apos;audit
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />

          <div className="space-y-4">
            {entries.map((entry) => {
              const style =
                ACTION_TYPE_STYLES[entry.actionType] ??
                ACTION_TYPE_STYLES.moderation;
              const { date, time } = formatDateTime(entry.createdAt);

              return (
                <div key={entry.id} className="relative flex gap-4 pl-2">
                  {/* Timeline dot */}
                  <div
                    className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${style.bg} border-2 border-white dark:border-slate-900`}
                  >
                    <span
                      className={`material-symbols-outlined text-sm ${style.text}`}
                    >
                      {style.icon}
                    </span>
                  </div>

                  {/* Entry card */}
                  <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:border-slate-800 rounded-xl shadow-sm p-4 -mt-1">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Admin avatar */}
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex-shrink-0 overflow-hidden flex items-center justify-center">
                          {entry.adminAvatar ? (
                            <img
                              src={entry.adminAvatar}
                              alt={entry.adminName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-primary font-bold text-sm">
                              {(entry.adminName || "?").charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                              {entry.adminName}
                            </span>
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}
                            >
                              {entry.action}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {entry.targetUrl ? (
                              <a
                                href={entry.targetUrl}
                                className="text-sm text-primary hover:underline truncate max-w-xs"
                              >
                                {entry.targetLabel}
                              </a>
                            ) : (
                              <span className="text-sm text-slate-600 dark:text-slate-400 truncate max-w-xs">
                                {entry.targetLabel}
                              </span>
                            )}
                          </div>
                          {entry.details && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                              {entry.details}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Date / Time */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-slate-500">{date}</p>
                        <p className="text-xs text-slate-400">{time}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-6">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">
                      progress_activity
                    </span>
                    Chargement...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">
                      expand_more
                    </span>
                    Charger plus
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
