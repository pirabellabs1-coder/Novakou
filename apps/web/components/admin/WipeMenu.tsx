"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2, AlertTriangle } from "lucide-react";
import { confirmAction } from "@/store/confirm";
import { promptAction } from "@/store/prompt";
import { StButton, ST } from "@/components/stitch";

/**
 * Outil de maintenance DESTRUCTIF (purge données démo / catalogue / ventes).
 *
 * Déplacé hors du dashboard admin (où il était trop accessible) vers la page
 * Configuration → zone « Maintenance ». Double garde-fou :
 *  1. Confirmation danger classique.
 *  2. Pour les modes destructifs, l'admin doit TAPER « SUPPRIMER » pour valider.
 */
export function WipeMenu() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [working, setWorking] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function runWipe(mode: string, label: string, danger: boolean) {
    const ok = await confirmAction({
      title: `Voulez-vous vraiment ${label.toLowerCase()} ?`,
      message: danger
        ? "Cette action est IRRÉVERSIBLE et supprime des données réelles."
        : "Cette action est irréversible.",
      confirmLabel: label,
      confirmVariant: "danger",
      icon: "delete_forever",
    });
    if (!ok) return;

    // Garde-fou supplémentaire pour les modes destructifs : saisie manuelle.
    if (danger) {
      const typed = await promptAction({
        title: "Suppression définitive",
        message: `Pour confirmer « ${label} », tapez SUPPRIMER en majuscules :`,
        placeholder: "SUPPRIMER",
        confirmLabel: "Confirmer la suppression",
        cancelLabel: "Annuler",
        icon: "delete_forever",
        validate: (v) => (v.trim() !== "SUPPRIMER" ? "Tapez SUPPRIMER pour confirmer." : null),
      });
      if (typed?.trim() !== "SUPPRIMER") {
        setResult("Annulé — confirmation incorrecte.");
        setTimeout(() => setResult(null), 4000);
        return;
      }
    }

    setWorking(mode);
    setResult(null);
    try {
      const res = await fetch("/api/formations/admin/wipe-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const json = await res.json();
      if (json.success) {
        const summary = Object.entries(json.deleted)
          .map(([k, v]) => `${v} ${k}`)
          .join(", ");
        setResult(summary || "Aucun élément à supprimer");
        qc.invalidateQueries();
      } else {
        setResult(json.error ?? "Erreur");
      }
    } catch {
      setResult("Erreur réseau");
    } finally {
      setWorking(null);
      setTimeout(() => {
        setResult(null);
        setOpen(false);
      }, 5000);
    }
  }

  return (
    <div className="relative">
      <StButton variant="secondary" icon={Trash2} onClick={() => setOpen(!open)}>
        Nettoyer la plateforme
      </StButton>
      {open && (
        <div
          className="absolute right-0 top-full mt-2 z-30 bg-white rounded-2xl shadow-xl min-w-[300px] overflow-hidden"
          style={{ border: `1px solid ${ST.cardBorder}` }}
        >
          <div
            className="px-4 py-3 flex items-center gap-2"
            style={{ borderBottom: `1px solid ${ST.divider}`, background: ST.bg }}
          >
            <AlertTriangle size={13} className="text-rose-600" />
            <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: ST.textMuted }}>
              Maintenance — zone dangereuse
            </p>
          </div>
          {[
            { mode: "demo-only", label: "Données démo seulement (dev-instructeur)", danger: false },
            { mode: "products", label: "Tous les produits & formations", danger: true },
            { mode: "purchases", label: "Toutes les ventes & inscriptions", danger: true },
            { mode: "reviews", label: "Tous les avis", danger: true },
            { mode: "marketing", label: "Toutes les données marketing", danger: true },
            { mode: "all", label: "TOUT (catalogue + ventes + avis)", danger: true },
          ].map((opt) => (
            <button
              key={opt.mode}
              onClick={() => runWipe(opt.mode, opt.label, opt.danger)}
              disabled={working !== null}
              className={`w-full text-left px-4 py-3 text-xs font-bold transition-colors disabled:opacity-50 last:border-0 ${
                opt.danger ? "text-rose-700 hover:bg-rose-50" : "hover:bg-[#f7faf8]"
              }`}
              style={{ borderBottom: `1px solid ${ST.divider}`, color: opt.danger ? undefined : ST.text }}
            >
              {working === opt.mode ? "Nettoyage..." : opt.label}
            </button>
          ))}
          {result && (
            <div className="px-4 py-3 text-white text-xs tabular-nums" style={{ background: ST.greenDark }}>
              {result}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
