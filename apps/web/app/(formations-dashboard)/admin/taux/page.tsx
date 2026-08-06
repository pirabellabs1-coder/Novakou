"use client";

import { useEffect, useState } from "react";
import { DEVISES, convertirDepuisFcfa } from "@/lib/currency/rates";

/**
 * Édition des taux de change.
 *
 * POURQUOI CET ÉCRAN EXISTE
 * Les taux étaient codés en dur. Le FCFA est fixe, donc ça passait ; le naira,
 * le cedi et le shilling ne le sont pas. Un chiffre figé dérive, et l'écart se
 * paie en silence — c'est arrivé avec le franc congolais, réglé à 4,6 pour une
 * valeur réelle de 4,03 : 14 % surfacturés à de vraies personnes, sans qu'aucune
 * alerte ne se déclenche.
 */

const REFERENCE = 5000;

export default function TauxPage() {
  const [taux, setTaux] = useState<Record<string, string>>({});
  const [etat, setEtat] = useState<"chargement" | "pret" | "envoi">("chargement");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/formations/admin/taux")
      .then((r) => r.json())
      .then((j) => {
        if (j?.data?.taux) {
          setTaux(Object.fromEntries(Object.entries(j.data.taux).map(([k, v]) => [k, String(v)])));
          setEtat("pret");
        } else setMessage(j.error ?? "Chargement impossible.");
      })
      .catch(() => setMessage("Chargement impossible."));
  }, []);

  async function enregistrer() {
    setEtat("envoi");
    setMessage("");
    try {
      const payload = Object.fromEntries(
        Object.entries(taux).map(([k, v]) => [k, Number(String(v).replace(",", "."))]),
      );
      const r = await fetch("/api/formations/admin/taux", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taux: payload }),
      });
      const j = await r.json();
      if (j.error) setMessage(j.error);
      else {
        setTaux(Object.fromEntries(Object.entries(j.data.taux).map(([k, v]) => [k, String(v)])));
        setMessage("Taux enregistrés. Ils s'appliquent à l'affichage ET aux prochains paiements.");
      }
    } catch {
      setMessage("Enregistrement impossible.");
    } finally {
      setEtat("pret");
    }
  }

  if (etat === "chargement") return <div className="p-6 text-sm text-slate-500">Chargement…</div>;

  return (
    <div className="p-5 md:p-8 max-w-3xl space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">Taux de change</h1>
        <p className="text-sm text-slate-600 mt-1">
          Combien d&apos;unités de chaque devise vaut <strong>1 F CFA</strong>. Ces taux ne servent
          qu&apos;à afficher et à débiter dans la monnaie de l&apos;acheteur — le vendeur reçoit
          toujours son prix en FCFA.
        </p>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[13px] text-amber-900">
        Un taux trop bas <strong>sous-facture</strong> : la plateforme absorbe l&apos;écart. Un taux
        trop haut <strong>surfacture l&apos;acheteur</strong>, qui paie plus que le prix réel sans
        le savoir. À revoir dès qu&apos;une devise décroche.
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
        {Object.values(DEVISES).map((d) => {
          const fixe = d.code === "XOF" || d.code === "XAF";
          const valeur = Number(String(taux[d.code] ?? d.pourUnFcfa).replace(",", "."));
          const apercu = Number.isFinite(valeur) && valeur > 0
            ? convertirDepuisFcfa(REFERENCE, { ...d, pourUnFcfa: valeur })
            : null;
          return (
            <div key={d.code} className="flex items-center gap-3 px-4 py-3 flex-wrap">
              <span className="w-[52px] font-mono text-[13px] font-bold text-slate-800">{d.code}</span>
              <span className="w-[64px] text-[13px] text-slate-500">{d.symbole}</span>
              <input
                value={taux[d.code] ?? ""}
                onChange={(e) => setTaux({ ...taux, [d.code]: e.target.value })}
                disabled={fixe}
                inputMode="decimal"
                className="w-[120px] px-3 py-2 rounded-xl border border-gray-200 text-sm disabled:bg-slate-50 disabled:text-slate-400 focus:outline-none focus:border-[#006e2f]"
              />
              {/* Un taux ne parle a personne. Le prix d'un produit a 5 000 FCFA,
                  si — c'est lui qui rend une erreur de saisie evidente. */}
              <span className="text-[12px] text-slate-500 flex-1 min-w-[150px]">
                {fixe ? (
                  <em>Parité fixe — régime de change, pas un réglage.</em>
                ) : apercu != null ? (
                  <>5 000 F CFA → <strong className="text-slate-800">{apercu.toLocaleString("fr-FR")} {d.symbole}</strong></>
                ) : (
                  <span className="text-red-600">Valeur invalide</span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {message && <p className="text-[13px] text-slate-700">{message}</p>}

      <button
        onClick={enregistrer}
        disabled={etat === "envoi"}
        className="px-5 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50"
        style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
      >
        {etat === "envoi" ? "Enregistrement…" : "Enregistrer les taux"}
      </button>
    </div>
  );
}
