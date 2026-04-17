"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

type MentorSession = {
  id: string;
  mentorId: string;
  durationMin: number;
  scheduledAt: string;
  status: string;
  pricePaid: number;
  topic: string | null;
  mentor?: { id: string; name: string | null; image: string | null; avatar: string | null };
};

function formatFcfa(n: number) { return n.toLocaleString("fr-FR") + " FCFA"; }

const statusConfig: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: "En attente", cls: "bg-amber-100 text-amber-700" },
  CONFIRMED: { label: "Confirmé",   cls: "bg-blue-100 text-blue-700" },
  COMPLETED: { label: "Terminé",    cls: "bg-[#006e2f]/10 text-[#006e2f]" },
  CANCELLED: { label: "Annulé",     cls: "bg-red-100 text-red-600" },
};

const GRADIENTS: [string, string][] = [
  ["#1a1a2e", "#16213e"],
  ["#1b4332", "#081c15"],
  ["#006e2f", "#22c55e"],
  ["#3d0c11", "#1a0007"],
];

function getInitials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
      <div className="h-20 bg-gray-100" />
      <div className="px-5 pb-5 pt-2 space-y-3">
        <div className="w-14 h-14 rounded-full bg-gray-100 -mt-7 mb-3" />
        <div className="h-4 bg-gray-100 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-9 bg-gray-100 rounded w-full mt-4" />
      </div>
    </div>
  );
}

export default function MentorsPage() {
  const [tab, setTab] = useState<"explorer" | "mes-sessions">("explorer");

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ["apprenant-mentor-sessions"],
    queryFn: () => fetch("/api/formations/apprenant/mentors").then((r) => r.json()),
    staleTime: 30_000,
  });

  const mySessions: MentorSession[] = sessionsData?.data ?? [];
  const upcomingSessions = mySessions.filter((s) =>
    (s.status === "PENDING" || s.status === "CONFIRMED") && new Date(s.scheduledAt) >= new Date()
  );

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-extrabold text-[#191c1e] mb-1">Accompagnement mentor</h1>
        <p className="text-sm text-[#5c647a]">Réservez une session avec un expert pour accélérer votre progression.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-100 p-1 mb-6 w-fit">
        {(["explorer", "mes-sessions"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t ? "bg-[#006e2f] text-white shadow-sm" : "text-[#5c647a] hover:text-[#191c1e]"
            }`}>
            {t === "explorer" ? "Explorer les mentors" : (
              <span className="flex items-center gap-1.5">
                Mes sessions
                {upcomingSessions.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#006e2f] text-white text-[9px] font-bold flex items-center justify-center">
                    {upcomingSessions.length}
                  </span>
                )}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "explorer" && (
        <div>
          {/* Info banner — mentors come from the platform, no public list yet */}
          <div className="bg-[#006e2f]/5 border border-[#006e2f]/20 rounded-2xl p-6 text-center">
            <span className="material-symbols-outlined text-[40px] text-[#006e2f] mb-3 block" style={{ fontVariationSettings: "'FILL' 1" }}>support_agent</span>
            <h3 className="font-bold text-[#191c1e] mb-2">Trouvez votre mentor sur Novakou</h3>
            <p className="text-sm text-[#5c647a] mb-5 max-w-md mx-auto">
              Nos mentors sont des experts vérifiés en freelancing, marketing digital, tech et design.
              Accédez à la page des mentors pour voir les disponibilités et réserver une session.
            </p>
            <Link href="/mentors"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm hover:opacity-90"
              style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}>
              <span className="material-symbols-outlined text-[18px]">explore</span>
              Voir tous les mentors
            </Link>
          </div>
        </div>
      )}

      {tab === "mes-sessions" && (
        <div>
          {sessionsLoading ? (
            <div className="space-y-4">
              {[0,1].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex gap-4 animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-gray-100 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : mySessions.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-[32px] text-[#5c647a]">support_agent</span>
              </div>
              <p className="font-bold text-[#191c1e] mb-1">Aucune session réservée</p>
              <p className="text-sm text-[#5c647a] mb-4">Trouvez un mentor et réservez votre première session.</p>
              <button onClick={() => setTab("explorer")} className="text-sm text-[#006e2f] font-semibold hover:underline">
                Explorer les mentors →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {mySessions.map((session, idx) => {
                const [gFrom, gTo] = GRADIENTS[idx % GRADIENTS.length];
                const mentorName = session.mentor?.name ?? "Mentor";
                const mentorInitials = getInitials(session.mentor?.name);
                const scheduledDate = new Date(session.scheduledAt);
                const dateStr = scheduledDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
                const timeStr = scheduledDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
                const st = statusConfig[session.status] ?? { label: session.status, cls: "bg-gray-100 text-gray-700" };

                return (
                  <div key={session.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
                    {session.mentor?.image ? (
                      <img src={session.mentor.image} alt={mentorName}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${gFrom}, ${gTo})` }}>
                        {mentorInitials}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#191c1e] text-sm">{mentorName}</p>
                      {session.topic && (
                        <p className="text-xs text-[#5c647a] mb-2 line-clamp-1">{session.topic}</p>
                      )}
                      <div className="flex items-center gap-3 flex-wrap text-xs text-[#5c647a]">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">calendar_today</span>
                          {dateStr}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">schedule</span>
                          {timeStr} · {session.durationMin} min
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">payments</span>
                          {formatFcfa(session.pricePaid)}
                        </span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${st.cls}`}>
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* CTA to book a new session */}
          {mySessions.length > 0 && (
            <div className="mt-6 text-center">
              <button onClick={() => setTab("explorer")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm hover:opacity-90"
                style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}>
                <span className="material-symbols-outlined text-[16px]">add</span>
                Réserver une nouvelle session
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
