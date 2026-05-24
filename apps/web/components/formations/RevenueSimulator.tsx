"use client";

import { useState } from "react";

const FCFA_RATE = 655.957;

export function RevenueSimulator() {
  const [audience, setAudience] = useState(5000);
  const [priceFcfa, setPriceFcfa] = useState(Math.round(97 * FCFA_RATE / 1000) * 1000);

  const revenueFcfa = Math.round(audience * priceFcfa * 0.01);
  const fmtPrice = new Intl.NumberFormat("fr-FR").format(priceFcfa);
  const fmtRevenue = new Intl.NumberFormat("fr-FR").format(revenueFcfa);

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        <div
          className="bg-white squircle p-6 md:p-12 relative overflow-hidden"
          style={{ boxShadow: "0 40px 100px rgba(0,110,47,0.08)" }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#006e2f]/5 rounded-full -translate-y-16 translate-x-16"></div>
          <h2 className="text-2xl md:text-3xl font-extrabold mb-8 text-center text-[#191c1e]">
            Simulez votre{" "}
            <span className="text-gradient">potentiel</span>
          </h2>

          <div className="space-y-10">
            {/* Slider 1 — Audience */}
            <div className="space-y-3">
              <label htmlFor="sim-audience" className="flex flex-col sm:flex-row sm:justify-between font-bold text-[#191c1e] gap-1 cursor-pointer">
                <span>Taille de l&apos;audience</span>
                <span className="text-[#006e2f]">{audience.toLocaleString("fr-FR")} contacts</span>
              </label>
              <input
                id="sim-audience"
                type="range"
                min={100}
                max={50000}
                step={100}
                value={audience}
                onChange={(e) => setAudience(Number(e.target.value))}
                aria-label="Taille de l'audience en nombre de contacts"
                aria-valuemin={100}
                aria-valuemax={50000}
                aria-valuenow={audience}
                className="w-full h-2 bg-[#eceef0] rounded-lg appearance-none cursor-pointer accent-[#006e2f]"
              />
            </div>

            {/* Slider 2 — Price en FCFA */}
            <div className="space-y-3">
              <label htmlFor="sim-price" className="flex flex-col sm:flex-row sm:justify-between font-bold text-[#191c1e] gap-1 cursor-pointer">
                <span>Prix de votre produit</span>
                <span className="text-[#006e2f]">{fmtPrice} FCFA</span>
              </label>
              <input
                id="sim-price"
                type="range"
                min={5000}
                max={650000}
                step={1000}
                value={priceFcfa}
                onChange={(e) => setPriceFcfa(Number(e.target.value))}
                aria-label="Prix du produit en FCFA"
                aria-valuemin={5000}
                aria-valuemax={650000}
                aria-valuenow={priceFcfa}
                className="w-full h-2 bg-[#eceef0] rounded-lg appearance-none cursor-pointer accent-[#006e2f]"
              />
            </div>

            {/* Result */}
            <div className="pt-6 border-t border-[#eceef0] flex flex-col items-center gap-2">
              <p className="text-[#5c647a] uppercase tracking-widest text-xs font-bold">Revenu estimé (par mois)</p>
              <div className="text-2xl sm:text-4xl md:text-5xl font-black text-[#006e2f] text-center leading-tight whitespace-nowrap">
                {fmtRevenue} FCFA
              </div>
              {/* Contraste : slate-400 (#94a3b8 ~3:1 sur blanc, fail WCAG AA).
                  slate-600 (#475569 ~7:1, pass AAA) */}
              <p className="text-sm text-slate-600 mt-2 italic text-center">Basé sur un taux de conversion conservateur de 1%.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
