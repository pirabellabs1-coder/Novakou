// Refonte design "Stitch" — apprenant mentors — vert Novakou — 2026-06-13
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  StCard,
  StPageHeader,
  StButton,
  StChip,
  StTabs,
  StAvatar,
  ST,
} from "@/components/stitch";
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

const statusBadge: Record<string, { label: string; tone: "amber" | "blue" | "green" | "rose" | "neutral" }> = {
  PENDING:   { label: "En attente", tone: "amber" },
  CONFIRMED: { label: "Confirmé",   tone: "blue" },
  COMPLETED: { label: "Terminé",    tone: "green" },
  CANCELLED: { label: "Annulé",     tone: "rose" },
};

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
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1400px] mx-auto">
        <StPageHeader
          title="Accompagnement mentor"
          subtitle="Réservez une session avec un expert pour accélérer votre progression."
          actions={
            <StButton href="/mentors" icon={Search}>
              Voir tous les mentors
            </StButton>
          }
        />

        {/* Tabs */}
        <div className="mb-5">
          <StTabs
            tabs={[
              { key: "explorer", label: "Explorer les mentors" },
              { key: "mes-sessions", label: "Mes sessions", count: upcomingSessions.length > 0 ? upcomingSessions.length : undefined },
            ]}
            active={tab}
            onChange={(k) => setTab(k as "explorer" | "mes-sessions")}
          />
        </div>

        {tab === "explorer" && (
          <StCard className="!p-10 text-center">
            <div className="w-16 h-16 rounded-[16px] flex items-center justify-center mx-auto mb-4" style={{ background: ST.greenSoft }}>
              <Users size={28} style={{ color: ST.green }} />
            </div>
            <h3 className="text-[16px] font-extrabold mb-2" style={{ color: ST.text }}>Trouvez votre mentor sur Novakou</h3>
            <p className="text-[13px] font-semibold mb-5 max-w-md mx-auto" style={{ color: ST.textSecondary }}>
              Nos mentors sont des experts vérifiés en freelancing, marketing digital, tech et design.
              Accédez à la page des mentors pour voir les disponibilités et réserver une session.
            </p>
            <StButton href="/mentors" icon={Compass}>
              Voir tous les mentors
            </StButton>
          </StCard>
        )}

        {tab === "mes-sessions" && (
          <div>
            {sessionsLoading ? (
              <div className="space-y-3.5">
                {[0, 1].map((i) => (
                  <StCard key={i} className="flex gap-4 animate-pulse">
                    <div className="w-12 h-12 rounded-full flex-shrink-0" style={{ background: "#f3f6f4" }} />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 rounded w-1/3" style={{ background: "#f3f6f4" }} />
                      <div className="h-3 rounded w-2/3" style={{ background: "#f3f6f4" }} />
                      <div className="h-3 rounded w-1/2" style={{ background: "#f3f6f4" }} />
                    </div>
                  </StCard>
                ))}
              </div>
            ) : mySessions.length === 0 ? (
              <StCard className="!p-10 text-center">
                <div className="w-16 h-16 rounded-[16px] flex items-center justify-center mx-auto mb-4" style={{ background: ST.greenSoft }}>
                  <Headset size={28} style={{ color: ST.green }} />
                </div>
                <h3 className="text-[16px] font-extrabold mb-1.5" style={{ color: ST.text }}>Aucune session réservée</h3>
                <p className="text-[13px] font-semibold mb-5 max-w-md mx-auto" style={{ color: ST.textSecondary }}>
                  Trouvez un mentor et réservez votre première session pour obtenir des conseils personnalisés et accélérer votre progression.
                </p>
                <StButton onClick={() => setTab("explorer")} icon={Compass}>Explorer les mentors</StButton>
              </StCard>
            ) : (
              <div className="space-y-3.5">
                {mySessions.map((session) => {
                  const mentorName = session.mentor?.name ?? "Mentor";
                  const scheduledDate = new Date(session.scheduledAt);
                  const dateStr = scheduledDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
                  const timeStr = scheduledDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
                  const st = statusBadge[session.status] ?? { label: session.status, tone: "neutral" as const };

                  return (
                    <StCard key={session.id} className="flex items-start gap-4">
                      <StAvatar name={mentorName} src={session.mentor?.image} size={48} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13.5px] font-extrabold" style={{ color: ST.text }}>{mentorName}</p>
                        {session.topic && (
                          <p className="text-[12px] font-semibold mb-2 line-clamp-1" style={{ color: ST.textSecondary }}>{session.topic}</p>
                        )}
                        <div className="flex items-center gap-3 flex-wrap text-[11.5px] font-semibold" style={{ color: ST.textMuted }}>
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {dateStr}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {timeStr} · {session.durationMin} min
                          </span>
                          <span className="flex items-center gap-1">
                            <Wallet size={14} />
                            {formatFcfa(session.pricePaid)}
                          </span>
                        </div>
                      </div>
                      <StChip tone={st.tone}>{st.label}</StChip>
                    </StCard>
                  );
                })}
              </div>
            )}

            {mySessions.length > 0 && (
              <div className="mt-6 text-center">
                <StButton onClick={() => setTab("explorer")} icon={Plus}>
                  Réserver une nouvelle session
                </StButton>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
