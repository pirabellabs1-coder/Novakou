"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { confirmAction } from "@/store/confirm";
import { useToastStore } from "@/store/toast";
import {
  ArrowLeft,
  X,
  Star,
  AlertCircle,
  Hourglass,
  CheckCircle2,
  CheckCheck,
  XCircle,
  UserX,
  Video,
  Flag,
  MessageSquare,
  PenLine,
  MessagesSquare,
  type LucideIcon,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

interface SessionDetail {
  id: string;
  status: BookingStatus;
  scheduledAt: string;
  durationMinutes: number;
  paidAmount: number;
  studentGoals: string | null;
  meetingLink: string | null;
  meetingUrl: string;
  isJoinable: boolean;
  studentRating: number | null;
  studentReview: string | null;
  mentorFeedback: string | null;
  mentor: {
    id: string;
    userId: string;
    name: string | null;
    image: string | null;
    specialty: string;
    domain: string | null;
    bio: string;
    sessionDuration: number;
    rating: number;
  };
  canReview: boolean;
  canCancel: boolean;
}

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function initials(name: string | null) {
  if (!name) return "M";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

const STATUS_CONFIG: Record<BookingStatus, { label: string; icon: LucideIcon; cls: string; desc: string }> = {
  PENDING:   { label: "En attente de confirmation", icon: Hourglass,    cls: "bg-amber-50 text-amber-700 border-amber-200", desc: "Le mentor va examiner votre demande." },
  CONFIRMED: { label: "Séance confirmée",           icon: CheckCircle2, cls: "bg-green-50 text-green-700 border-green-200", desc: "À l'heure dite, rejoignez la salle Jitsi." },
  COMPLETED: { label: "Séance terminée",            icon: CheckCheck,   cls: "bg-blue-50 text-blue-700 border-blue-200", desc: "N'oubliez pas de laisser un avis." },
  CANCELLED: { label: "Séance annulée",             icon: XCircle,      cls: "bg-red-50 text-red-600 border-red-200", desc: "Cette séance a été annulée." },
  NO_SHOW:   { label: "Absent",                     icon: UserX,        cls: "bg-gray-100 text-gray-500 border-gray-200", desc: "Vous avez été marqué absent." },
};

// ─── Review modal ─────────────────────────────────────────────────────────────
function ReviewModal({
  sessionId,
  mentorName,
  onClose,
  onSubmitted,
}: {
  sessionId: string;
  mentorName: string;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setErr(null);
    try {
      const res = await fetch(`/api/formations/apprenant/sessions/${sessionId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, review: review.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      onSubmitted();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
        >
          <X size={18} />
        </button>
        <h2 className="text-lg font-extrabold text-[#13241b]">Évaluer {mentorName}</h2>

        <div className="mt-5">
          <p className="text-xs font-semibold text-[#13241b] mb-2">Votre note</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => setRating(s)} className="p-1 hover:scale-110 transition-transform">
                <Star size={28} className={s <= rating ? "text-amber-500 fill-amber-500" : "text-gray-300 fill-gray-300"} />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold text-[#13241b] mb-1.5">Commentaire (optionnel)</p>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={4}
            maxLength={2000}
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f] resize-none"
          />
        </div>

        {err && <p className="text-xs text-red-600 mt-3">{err}</p>}

        <button
          onClick={submit}
          disabled={submitting}
          className="w-full mt-5 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50"
          style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
        >
          {submitting ? "Envoi…" : "Publier mon avis"}
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ApprenantSessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/formations/apprenant/sessions/${id}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Session introuvable.");
        throw new Error("Erreur");
      }
      const json = await res.json();
      setData(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function cancelSession() {
    const ok = await confirmAction({
      title: "Annuler cette session ?",
      message: "Cette action ne peut pas être annulée.",
      confirmLabel: "Annuler la session",
      cancelLabel: "Revenir",
      confirmVariant: "danger",
      icon: "event_busy",
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/formations/apprenant/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      if (!res.ok) throw new Error("Erreur");
      await load();
    } catch (e) {
      useToastStore.getState().addToast("error", e instanceof Error ? e.message : "Erreur");
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded-xl" />
        <div className="h-64 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle size={36} className="text-red-500 mx-auto" />
          <p className="text-sm font-bold text-red-700 mt-2">{error ?? "Erreur"}</p>
          <button
            onClick={() => router.push("/apprenant/sessions")}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-red-700 border border-red-300 inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={14} /> Retour
          </button>
        </div>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[data.status];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <Link
        href="/apprenant/sessions"
        className="inline-flex items-center gap-1 text-xs text-[#5d7166] hover:text-[#13241b]"
      >
        <ArrowLeft size={14} />
        Toutes mes sessions
      </Link>

      {/* Status banner */}
      <div className={`rounded-2xl p-5 border ${cfg.cls}`}>
        <div className="flex items-start gap-3">
          {(() => { const CfgIcon = cfg.icon; return <CfgIcon size={28} />; })()}
          <div className="flex-1">
            <p className="text-sm font-bold">{cfg.label}</p>
            <p className="text-xs mt-0.5 opacity-80">{cfg.desc}</p>
          </div>
          {data.status === "CONFIRMED" && (
            <a
              href={data.meetingLink || data.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${
                data.isJoinable
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-white text-blue-700 border border-blue-200 hover:bg-blue-50"
              }`}
            >
              <Video size={16} />
              {data.isJoinable ? "Rejoindre" : "Ouvrir salle"}
            </a>
          )}
        </div>
      </div>

      {/* Session info */}
      <div className="bg-white rounded-2xl border border-[#e4eae6] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#eef2ef]">
          <h2 className="text-sm font-bold text-[#13241b]">Informations de la séance</h2>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#006e2f] to-[#22c55e] text-white font-bold flex items-center justify-center overflow-hidden">
              {data.mentor.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.mentor.image} alt="" className="w-full h-full object-cover" />
              ) : initials(data.mentor.name)}
            </div>
            <div className="flex-1 min-w-0">
              <Link href={`/mentors/${data.mentor.id}`} className="text-base font-bold text-[#13241b] hover:underline">
                {data.mentor.name}
              </Link>
              <p className="text-xs text-[#5d7166]">{data.mentor.specialty}</p>
              {data.mentor.domain && (
                <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-[#5d7166]">
                  {data.mentor.domain}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-[#eef2ef]">
            <div>
              <p className="text-[#5d7166]">Date</p>
              <p className="font-bold text-[#13241b] capitalize">{fmtDate(data.scheduledAt)}</p>
            </div>
            <div>
              <p className="text-[#5d7166]">Heure</p>
              <p className="font-bold text-[#13241b]">{fmtTime(data.scheduledAt)}</p>
            </div>
            <div>
              <p className="text-[#5d7166]">Durée</p>
              <p className="font-bold text-[#13241b]">{data.durationMinutes} min</p>
            </div>
            <div>
              <p className="text-[#5d7166]">Prix payé</p>
              <p className="font-bold text-[#006e2f]">{fmt(data.paidAmount)} FCFA</p>
            </div>
          </div>

          {(data.status === "CONFIRMED" || data.status === "COMPLETED") && (
            <div className="pt-3 border-t border-[#eef2ef]">
              <p className="text-xs text-[#5d7166] mb-1">Salle de visioconférence</p>
              <a
                href={data.meetingLink || data.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline break-all"
              >
                <Video size={14} />
                {data.meetingLink || data.meetingUrl}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Student goals */}
      {data.studentGoals && (
        <div className="bg-white rounded-2xl border border-[#e4eae6] p-5">
          <p className="text-xs font-bold text-[#13241b] mb-2 flex items-center gap-1">
            <Flag size={14} />
            Vos objectifs soumis
          </p>
          <p className="text-sm text-[#5d7166] whitespace-pre-wrap">{data.studentGoals}</p>
        </div>
      )}

      {/* Mentor feedback */}
      {data.mentorFeedback && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <p className="text-xs font-bold text-blue-900 mb-2 flex items-center gap-1">
            <MessageSquare size={14} />
            Feedback du mentor
          </p>
          <p className="text-sm text-blue-900 whitespace-pre-wrap">{data.mentorFeedback}</p>
        </div>
      )}

      {/* Student review (already posted) */}
      {data.studentRating && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs font-bold text-amber-900">Votre avis</p>
            <span className="flex items-center gap-0.5">
              {[1,2,3,4,5].map(s => (
                <Star key={s} size={14} className={s <= data.studentRating! ? "text-amber-500 fill-amber-500" : "text-gray-300 fill-gray-300"} />
              ))}
            </span>
          </div>
          {data.studentReview && (
            <p className="text-sm text-amber-900 whitespace-pre-wrap">{data.studentReview}</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {data.canReview && (
          <button
            onClick={() => setShowReview(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90"
            style={{ background: "linear-gradient(to right, #f59e0b, #eab308)" }}
          >
            <PenLine size={16} />
            Laisser un avis
          </button>
        )}
        {data.canCancel && (
          <button
            onClick={cancelSession}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-50 text-red-600 hover:bg-red-100"
          >
            <XCircle size={16} />
            Annuler la séance
          </button>
        )}
        <Link
          href={`/messages?to=${data.mentor.userId}`}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-[#13241b] hover:bg-gray-200 ml-auto"
        >
          <MessagesSquare size={16} />
          Contacter le mentor
        </Link>
      </div>

      {showReview && (
        <ReviewModal
          sessionId={data.id}
          mentorName={data.mentor.name ?? "le mentor"}
          onClose={() => setShowReview(false)}
          onSubmitted={() => {
            setShowReview(false);
            load();
          }}
        />
      )}
    </div>
  );
}
