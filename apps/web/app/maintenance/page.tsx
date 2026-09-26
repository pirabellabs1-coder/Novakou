"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Loader2, Mail, RefreshCw } from "lucide-react";
import { PageEtat } from "@/components/formations/public/PageEtat";
import { EnTetePage } from "@/components/formations/public/EnTetePage";

const INTERVALLE_S = 60;

export default function MaintenancePage() {
  const [message, setMessage] = useState("La plateforme est en maintenance. Nous serons de retour bientôt.");
  const [checking, setChecking] = useState(false);
  const [countdown, setCountdown] = useState(INTERVALLE_S);
  // Résultat d'une vérification manuelle, annoncé aux lecteurs d'écran.
  const [statut, setStatut] = useState("");

  // Fetch maintenance message and auto-check every 60 seconds
  useEffect(() => {
    async function checkMaintenance() {
      try {
        const res = await fetch("/api/public/maintenance");
        const data = await res.json();
        if (!data.enabled) {
          window.location.href = "/";
          return;
        }
        if (data.message) setMessage(data.message);
      } catch {
        // Still in maintenance
      }
    }

    checkMaintenance();
    const interval = setInterval(checkMaintenance, INTERVALLE_S * 1000);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer for auto-refresh
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) return INTERVALLE_S;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  async function checkStatus() {
    setChecking(true);
    setStatut("");
    try {
      const res = await fetch("/api/public/maintenance");
      const data = await res.json();
      if (!data.enabled) {
        window.location.href = "/";
        return;
      }
      setStatut("La maintenance est toujours en cours. Nouvel essai automatique dans une minute.");
    } catch {
      // Still in maintenance
      setStatut("Vérification impossible pour le moment. Nouvel essai automatique dans une minute.");
    } finally {
      setChecking(false);
      setCountdown(INTERVALLE_S);
    }
  }

  return (
    <PageEtat
      lienAccueil={false}
      pied={
        <>
          © 2026 Novakou — Éditée par Pirabel Labs · <a href="mailto:support@novakou.com">support@novakou.com</a>
        </>
      }
    >
      <EnTetePage
        eyebrow="Maintenance"
        titre={
          <>
            Maintenance <em>en cours</em>
          </>
        }
        sousTitre={message}
        actions={
          <button type="button" onClick={checkStatus} disabled={checking} className="nkp-btn nkp-btn--primary nkp-btn--lg">
            {checking ? "Vérification…" : "Vérifier le statut"}
            <span className="nkp-btn__ico" aria-hidden="true">
              {checking ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} strokeWidth={2.2} />}
            </span>
          </button>
        }
      >
        <div className="mx-auto max-w-sm">
          {/* Jauge du prochain essai : transform uniquement (compositeur). */}
          <div className="nkp-maint-jauge" aria-hidden="true">
            <i style={{ "--p": countdown / INTERVALLE_S } as CSSProperties} />
          </div>
          <p className="mt-3 text-[.84rem] text-[#5c6b62]">
            Vérification automatique dans <span className="nkp-num">{countdown}</span> s
          </p>
          <p className="mt-2 min-h-[1.4em] text-[.84rem] font-medium text-[#0e1512]" role="status">
            {statut}
          </p>
        </div>

        <div className="nkp-card mx-auto mt-8 max-w-md text-left">
          <div className="nkp-card__core !flex-row items-start gap-4 !p-5">
            <span className="nkp-ic nkp-ic--sm" aria-hidden="true">
              <Mail strokeWidth={1.9} />
            </span>
            <div>
              <p className="text-[.9rem] text-[#0e1512]">Nous effectuons des mises à jour pour améliorer votre expérience.</p>
              <p className="mt-1 text-[.84rem] text-[#5c6b62]">
                Contact :{" "}
                <a href="mailto:support@novakou.com" className="font-semibold text-[#006e2f] underline underline-offset-2">
                  support@novakou.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </EnTetePage>
    </PageEtat>
  );
}
