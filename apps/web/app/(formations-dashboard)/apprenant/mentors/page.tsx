// Refonte style KAZA — apprenant mentors — 2026-06-07
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  KazaHero,
  KazaButton,
  KazaBadge,
  KazaEmpty,
  KazaCard,
} from "@/components/kaza";
import {
  Headset,
  Search,
  Calendar,
  Clock,
  Wallet,
  Plus,
  Compass,
  Users,
} from "lucide-react";

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

const statusBadge: Record<string, { label: string; variant: "orange" | "blue" | "green" | "rose" | "slate" }> = {
  PENDING:   { label: "En attente", variant: "orange" },
  CONFIRMED: { label: "Confirmé",   variant: "blue" },
  COMPLETED: { label: "Terminé",    variant: "green" },
  CANCELLED: { label: "Annulé",     variant: "rose" },
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
    <div className="px-5 md:px-10 py-8 md:py-10 max-w-[1400px] mx-auto space-y-6">
      <KazaHero
        badge="Apprenant"
        badgeColor="blue"
        icon={Headset}
        title="Accompagnement mentor"
        subtitle="Réservez une session avec un expert pour accélérer votre progression."
        actions={
          <KazaButton variant="primary" href="/mentors" icon={Search}>
            Voir tous les mentors
          </KazaButton>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-100 p-1 w-fit shadow-sm">
        {(["explorer", "mes-sessions"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t ? "bg-[#0b2540] text-white shadow-sm" : "text-slate-600 hover:text-[#0b2540]"
            }`}
          >
            {t === "explorer" ? "Explorer les mentors" : (
              <span className="flex items-center gap-1.5">
                Mes sessions
                {upcomingSessions.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {upcomingSessions.length}
                  </span>
                )}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "explorer" && (
        <KazaCard>
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="font-bold text-[#0b2540] text-lg mb-2">Trouvez votre mentor sur Novakou</h3>
            <p className="text-sm text-slate-500 mb-5 max-w-md mx-auto">
              Nos mentors sont des experts vérifiés en freelancing, marketing digital, tech et design.
              Accédez à la page des mentors pour voir les disponibilités et réserver une session.
            </p>
            <KazaButton variant="primary" href="/mentors" icon={Compass}>
              Voir tous les mentors
            </KazaButton>
          </div>
        </KazaCard>
      )}

      {tab === "mes-sessions" && (
        <div>
          {sessionsLoading ? (
            <div className="space-y-4">
              {[0, 1].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex gap-4 animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex-shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-slate-100 rounded w-1/3" />
                    <div className="h-3 bg-slate-100 rounded w-2/3" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : mySessions.length === 0 ? (
            <KazaEmpty
              icon={Headset}
              title="Aucune session réservée"
              description="Trouvez un mentor et réservez votre première session pour obtenir des conseils personnalisés et accélérer votre progression."
              action={{ label: "Explorer les mentors", onClick: () => setTab("explorer") }}
            />
          ) : (
            <div className="space-y-4">
              {mySessions.map((session, idx) => {
                const [gFrom, gTo] = GRADIENTS[idx % GRADIENTS.length];
                const mentorName = session.mentor?.name ?? "Mentor";
                const mentorInitials = getInitials(session.mentor?.name);
                const scheduledDate = new Date(session.scheduledAt);
                const dateStr = scheduledDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
                const timeStr = scheduledDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
                const st = statusBadge[session.status] ?? { label: session.status, variant: "slate" as const };

                return (
                  <div key={session.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-start gap-4">
                    {session.mentor?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={session.mentor.image}
                        alt={mentorName}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${gFrom}, ${gTo})` }}
                      >
                        {mentorInitials}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#0b2540] text-sm">{mentorName}</p>
                      {session.topic && (
                        <p className="text-xs text-slate-500 mb-2 line-clamp-1">{session.topic}</p>
                      )}
                      <div className="flex items-center gap-3 flex-wrap text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {dateStr}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {timeStr} · {session.durationMin} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Wallet className="w-3.5 h-3.5" />
                          {formatFcfa(session.pricePaid)}
                        </span>
                      </div>
                    </div>
                    <KazaBadge variant={st.variant} size="sm">{st.label}</KazaBadge>
                  </div>
                );
              })}
            </div>
          )}

          {mySessions.length > 0 && (
            <div className="mt-6 text-center">
              <KazaButton variant="primary" onClick={() => setTab("explorer")} icon={Plus}>
                Réserver une nouvelle session
              </KazaButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
