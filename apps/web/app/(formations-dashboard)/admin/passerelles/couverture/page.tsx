"use client";

import { useEffect, useState } from "react";
import { CountryFlag } from "@/components/formations/CountryFlag";

/**
 * Ce que CHAQUE passerelle sait faire, dans les deux sens.
 *
 * Cette réponse n'existait nulle part : il fallait lire le registre à la main
 * pour savoir qui reversait au Ghana, ou combien de pays ne tenaient qu'à une
 * seule passerelle — la question qui compte avant d'en retirer une.
 */

type Ligne = { operateur: string; label: string; pays: string; devise: string; code: string };
type Passerelle = {
  id: string;
  label: string;
  directionsDeclarees: string[];
  actifEncaissement: boolean;
  actifVersement: boolean;
  encaissement: Ligne[];
  versement: Ligne[];
};

function Puce({ actif, texte }: { actif: boolean; texte: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
        actif ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
      }`}
    >
      {actif ? "●" : "○"} {texte}
    </span>
  );
}

function Colonne({ titre, lignes, actif }: { titre: string; lignes: Ligne[]; actif: boolean }) {
  const pays = [...new Set(lignes.map((l) => l.pays))];
  return (
    <div className="flex-1 min-w-[260px]">
      <div className="flex items-baseline justify-between mb-2">
        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">{titre}</h4>
        <span className="text-[11px] text-slate-500">
          {lignes.length} moyen{lignes.length > 1 ? "s" : ""} · {pays.length} pays
        </span>
      </div>

      {lignes.length === 0 ? (
        <p className="text-[13px] text-slate-400 italic py-2">Aucun moyen géré.</p>
      ) : (
        <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 max-h-[340px] overflow-y-auto">
          {/* Un rang par PAYS, moyens en pastilles. Le code natif et la devise
              ont ete retires : c'est du detail d'integration, pas de la
              couverture — et ils noyaient la seule question qui compte, « qui
              gere quoi ». */}
          {pays.map((c) => (
            <div key={c} className="flex items-start gap-2.5 px-3 py-2">
              <CountryFlag code={c} className="w-[20px] h-[13px] mt-0.5" />
              <div className="flex flex-wrap gap-1.5 flex-1">
                {lignes
                  .filter((l) => l.pays === c)
                  .map((l) => (
                    <span
                      key={l.operateur}
                      className="text-[12px] font-semibold text-slate-700 bg-slate-100 rounded-full px-2 py-0.5"
                    >
                      {/* Le pays est deja porte par le drapeau : le repeter dans
                          chaque libelle rendait la ligne illisible. */}
                      {l.label.replace(/\s*\([^)]*\)\s*$/, "")}
                    </span>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!actif && lignes.length > 0 && (
        <p className="text-[11px] text-amber-700 mt-2">
          Passerelle inactive ou non configurée : ces moyens sont déclarés mais n&apos;opèrent pas.
        </p>
      )}
    </div>
  );
}

export default function CouverturePasserelles() {
  const [data, setData] = useState<{
    passerelles: Passerelle[];
    paysFragiles: Array<{ pays: string; passerelle: string }>;
    totalPays: number;
  } | null>(null);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    fetch("/api/formations/admin/gateway-coverage")
      .then((r) => r.json())
      .then((j) => (j.error ? setErreur(j.error) : setData(j.data)))
      .catch(() => setErreur("Chargement impossible."));
  }, []);

  if (erreur) return <div className="p-6 text-sm text-red-600">{erreur}</div>;
  if (!data) return <div className="p-6 text-sm text-slate-500">Chargement…</div>;

  return (
    <div className="p-5 md:p-8 space-y-5 max-w-6xl">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">Couverture des passerelles</h1>
        <p className="text-sm text-slate-600 mt-1">
          Ce que chaque passerelle sait faire, moyen par moyen, à l&apos;encaissement et au
          versement. {data.totalPays} pays encaissables au total.
        </p>
      </div>

      {/* Pays a passerelle unique : l'information qui manque avant de retirer
          un fournisseur. Un pays fragile tombe ENTIEREMENT si elle s'eteint. */}
      {data.paysFragiles.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="text-sm font-extrabold text-amber-900">
            {data.paysFragiles.length} pays ne tiennent qu&apos;à une seule passerelle
          </h2>
          <p className="text-[12px] text-amber-800 mt-1 mb-3">
            Si elle s&apos;éteint, ces pays perdent toute possibilité de paiement — pas un moyen,
            tous. À vérifier avant de retirer un fournisseur.
          </p>
          <div className="flex flex-wrap gap-2">
            {data.paysFragiles.map((p) => (
              <span
                key={p.pays}
                className="inline-flex items-center gap-1.5 bg-white border border-amber-200 rounded-full pl-1.5 pr-2.5 py-1 text-[12px] font-semibold text-amber-900"
              >
                <CountryFlag code={p.pays} className="w-[18px] h-[12px]" />
                {p.pays.toUpperCase()} → {p.passerelle}
              </span>
            ))}
          </div>
        </div>
      )}

      {data.passerelles.map((g) => (
        <div key={g.id} className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3 flex-wrap mb-4">
            <h3 className="text-base font-extrabold text-slate-900">{g.label}</h3>
            <Puce actif={g.actifEncaissement} texte="Encaissement" />
            <Puce actif={g.actifVersement} texte="Versement" />
            {!g.directionsDeclarees.includes("payout") && (
              <span className="text-[11px] text-slate-500">
                — versement non implémenté côté code
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-6">
            <Colonne titre="Encaissement" lignes={g.encaissement} actif={g.actifEncaissement} />
            <Colonne titre="Versement" lignes={g.versement} actif={g.actifVersement} />
          </div>
        </div>
      ))}
    </div>
  );
}
