"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useToastStore } from "@/store/toast";

/**
 * Page "Salle Jitsi intégrée" — /formations/sessions/[id]/salle
 * Accessible par l'apprenant ET le mentor.
 *
 * Intègre Jitsi External API dans une iframe contrôlée par la plateforme.
 * Écoute les événements :
 *  - videoConferenceJoined → marque le joiner comme "présent"
 *  - participantJoined    → détecte que l'autre partie est là
 *  - videoConferenceLeft  → fin de session
 *
 * Avantages vs lien externe :
 *  - On sait qui a rejoint et quand (tracking présence automatique)
 *  - Base pour auto-compléter la session quand les 2 parties ont été présentes
 *  - Pas besoin d'ouvrir un nouvel onglet / meet.jit.si externe
 */
type Booking = {
  id: string;
  status: string;
  scheduledAt: string;
  durationMinutes: number;
  meetingRoomId: string;
  meetingUrl: string;
  studentAttended: boolean | null;
  mentorAttended: boolean | null;
  mentor: { id: string; name: string | null; userId: string };
  student: { id: string; name: string | null };
  viewerRole: "student" | "mentor";
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global { interface Window { JitsiMeetExternalAPI?: any; jitsiApi?: any } }

export default function SalleJitsiPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiRef = useRef<any>(null);

  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [joined, setJoined] = useState(false);
  const [otherJoined, setOtherJoined] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Load booking
  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const res = await fetch(`/api/formations/sessions/${id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Erreur chargement");
        setBooking(json.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur");
      }
    }
    load();
  }, [id]);

  // Load Jitsi script
  useEffect(() => {
    if (scriptLoaded || typeof window === "undefined") return;
    if (window.JitsiMeetExternalAPI) { setScriptLoaded(true); return; }
    const s = document.createElement("script");
    s.src = "https://meet.jit.si/external_api.js";
    s.async = true;
    s.onload = () => setScriptLoaded(true);
    s.onerror = () => setError("Impossible de charger Jitsi.");
    document.body.appendChild(s);
    return () => { document.body.removeChild(s); };
  }, [scriptLoaded]);

  // Init Jitsi iframe
  useEffect(() => {
    if (!scriptLoaded || !booking || !containerRef.current || apiRef.current) return;
    const api = new window.JitsiMeetExternalAPI!("meet.jit.si", {
      roomName: booking.meetingRoomId,
      parentNode: containerRef.current,
      width: "100%",
      height: "100%",
      userInfo: {
        displayName: booking.viewerRole === "student"
          ? `${booking.student.name ?? "Apprenant"} (apprenant)`
          : `${booking.mentor.name ?? "Mentor"} (mentor)`,
      },
      configOverwrite: {
        prejoinPageEnabled: false,
        disableDeepLinking: true,
      },
      interfaceConfigOverwrite: {
        HIDE_INVITE_MORE_HEADER: true,
      },
    });
    apiRef.current = api;

    api.on("videoConferenceJoined", async () => {
      setJoined(true);
      // Mark self as attended (silently)
      try {
        await fetch(`/api/formations/mentor-bookings/${booking.id}/attendance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ attended: true }),
        });
      } catch {
        // ignore — user can re-mark later
      }
    });
    api.on("participantJoined", () => {
      setOtherJoined(true);
    });
    api.on("videoConferenceLeft", () => {
      setLeaving(true);
      useToastStore.getState().addToast("success", "Session terminée — merci !");
      setTimeout(() => {
        router.push(booking.viewerRole === "student" ? "/apprenant/sessions" : "/mentor/rendez-vous");
      }, 1500);
    });

    return () => {
      try { api.dispose(); } catch { /* ignore */ }
      apiRef.current = null;
    };
  }, [scriptLoaded, booking, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center p-6">
        <div className="max-w-md text-center bg-white p-8 rounded-2xl border border-gray-100">
          <span className="material-symbols-outlined text-red-500 text-[40px] mb-3">error</span>
          <h1 className="text-lg font-bold text-[#191c1e]">Salle indisponible</h1>
          <p className="text-sm text-[#5c647a] mt-2">{error}</p>
          <Link
            href="/apprenant/sessions"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-gray-100 text-[#191c1e] text-sm font-semibold hover:bg-gray-200"
          >
            Retour
          </Link>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center">
        <span className="material-symbols-outlined text-[32px] text-gray-400 animate-spin">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col" style={{ fontFamily: "'Manrope', sans-serif" }}>
      {/* Top bar */}
      <header className="bg-[#0f172a] text-white px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href={booking.viewerRole === "student" ? "/apprenant/sessions" : "/mentor/rendez-vous"}
            className="flex items-center gap-1 text-xs text-white/70 hover:text-white">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Quitter
          </Link>
          <div className="h-4 w-px bg-white/20" />
          <p className="text-sm font-semibold truncate">
            Session avec {booking.viewerRole === "student" ? booking.mentor.name : booking.student.name}
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          {joined ? (
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Connecté
            </span>
          ) : (
            <span className="text-white/50">Connexion…</span>
          )}
          {otherJoined && (
            <span className="flex items-center gap-1 text-[#22c55e] ml-3">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              L&apos;autre partie est là
            </span>
          )}
        </div>
      </header>

      {/* Jitsi iframe container */}
      <div ref={containerRef} className="flex-1 w-full min-h-0">
        {!scriptLoaded && (
          <div className="h-full flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-[32px] text-white/50 animate-spin">progress_activity</span>
          </div>
        )}
      </div>

      {leaving && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 text-white">
          <div className="text-center">
            <span className="material-symbols-outlined text-[48px] text-[#22c55e]">check_circle</span>
            <p className="text-lg font-bold mt-2">Session terminée</p>
            <p className="text-sm text-white/70 mt-1">Redirection en cours…</p>
          </div>
        </div>
      )}
    </div>
  );
}
