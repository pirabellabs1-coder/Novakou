"use client";

import Link from "next/link";

export default function PortefeuilleWeb3Page() {
  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">Portefeuille Web3</h1>
        <p className="text-slate-400 text-sm mt-1">Gérez vos paiements en crypto-monnaie sur FreelanceHigh.</p>
      </div>

      {/* Coming Soon Banner */}
      <div className="bg-gradient-to-br from-primary/5 via-blue-500/5 to-emerald-500/5 rounded-2xl border border-primary/20 p-12 text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-primary text-4xl">account_balance_wallet</span>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-6">
          <span className="material-symbols-outlined text-sm">schedule</span>
          Disponible en Version 4
        </div>

        <h2 className="text-2xl font-black text-white mb-3">Paiements Crypto a venir</h2>
        <p className="text-slate-400 max-w-xl mx-auto mb-8 leading-relaxed">
          Le portefeuille Web3 vous permettra de payer vos commandes en USDC et USDT, avec un systeme d&apos;escrow securise sur la blockchain Base L2.
        </p>

        {/* Features preview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
          <div className="bg-neutral-dark rounded-xl border border-border-dark p-4">
            <span className="material-symbols-outlined text-primary text-2xl mb-2">paid</span>
            <p className="font-bold text-white text-sm">USDC & USDT</p>
            <p className="text-xs text-slate-500 mt-1">Stablecoins pour des paiements stables</p>
          </div>
          <div className="bg-neutral-dark rounded-xl border border-border-dark p-4">
            <span className="material-symbols-outlined text-primary text-2xl mb-2">lock</span>
            <p className="font-bold text-white text-sm">Escrow Blockchain</p>
            <p className="text-xs text-slate-500 mt-1">Sécurité et transparence garanties</p>
          </div>
          <div className="bg-neutral-dark rounded-xl border border-border-dark p-4">
            <span className="material-symbols-outlined text-primary text-2xl mb-2">speed</span>
            <p className="font-bold text-white text-sm">Frais reduits</p>
            <p className="text-xs text-slate-500 mt-1">Base L2 pour des frais minimaux</p>
          </div>
        </div>

        <Link
          href="/client"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 text-primary font-bold text-sm rounded-xl hover:bg-primary/20 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}
