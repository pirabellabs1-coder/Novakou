"use client";

import { useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useDashboardStore, useToastStore } from "@/store/dashboard";

// ---------------------------------------------------------------------------
// Escrow step statuses
// ---------------------------------------------------------------------------
type StepStatus = "completed" | "in_progress" | "pending";

interface EscrowStep {
  id: number;
  title: string;
  description: string;
  status: StepStatus;
  icon: string;
  hash?: string;
  statusNote?: string;
  statusLink?: string;
}

const ESCROW_STEPS: EscrowStep[] = [
  {
    id: 1,
    title: "Paiement Client Effectue",
    description:
      "Le client a initie le paiement de 1,250.00 USDT. Les fonds ont ete recus et verifies par le reseau Ethereum.",
    status: "completed",
    icon: "check_circle",
    hash: "0x7a3f...8b2c",
  },
  {
    id: 2,
    title: "Fonds Verrouilles dans l'Escrow",
    description:
      "Les fonds sont desormais securises dans le smart contract escrow. Aucune partie ne peut y acceder unilateralement.",
    status: "completed",
    icon: "check_circle",
    statusNote: "Contrat verifie sur Etherscan",
  },
  {
    id: 3,
    title: "Validation des Livrables",
    description:
      "Le client examine les livrables soumis par le freelance. Une fois approuves, les fonds seront liberes automatiquement.",
    status: "in_progress",
    icon: "pending",
    statusNote: "Revue en cours...",
    statusLink: "Details",
  },
  {
    id: 4,
    title: "Liberation des Fonds au Freelance",
    description:
      "Apres validation par le client (ou automatiquement apres le delai d'approbation), les fonds seront transferes vers le portefeuille du freelance.",
    status: "pending",
    icon: "lock",
  },
];

// ---------------------------------------------------------------------------
// Security features
// ---------------------------------------------------------------------------
const SECURITY_FEATURES = [
  {
    title: "Smart Contract Audite",
    description: "Audite par CertiK & OpenZeppelin",
    icon: "verified_user",
  },
  {
    title: "Multi-Signature 2/3",
    description: "Requiert 2 signatures sur 3 pour toute liberation",
    icon: "key",
  },
  {
    title: "Historique Immuable",
    description: "Toutes les transactions sont enregistrees sur la blockchain",
    icon: "history",
  },
];

// ---------------------------------------------------------------------------
// Escrow statuses mapped from order statuses
// ---------------------------------------------------------------------------
function getEscrowStatus(orderStatus: string): {
  label: string;
  color: string;
  icon: string;
} {
  switch (orderStatus) {
    case "en_attente":
      return {
        label: "Fonds en depot",
        color: "text-amber-400 bg-amber-500/10",
        icon: "hourglass_top",
      };
    case "en_cours":
      return {
        label: "Escrow actif",
        color: "text-primary bg-primary/10",
        icon: "lock",
      };
    case "livre":
      return {
        label: "En validation",
        color: "text-blue-400 bg-blue-500/10",
        icon: "pending",
      };
    case "revision":
      return {
        label: "En revision",
        color: "text-orange-400 bg-orange-500/10",
        icon: "rate_review",
      };
    case "termine":
      return {
        label: "Fonds liberes",
        color: "text-emerald-400 bg-emerald-500/10",
        icon: "check_circle",
      };
    case "annule":
      return {
        label: "Rembourse",
        color: "text-slate-400 bg-slate-500/10",
        icon: "undo",
      };
    case "litige":
      return {
        label: "Fonds geles",
        color: "text-red-400 bg-red-500/10",
        icon: "gavel",
      };
    default:
      return {
        label: "Inconnu",
        color: "text-slate-400 bg-slate-500/10",
        icon: "help",
      };
  }
}

// ---------------------------------------------------------------------------
// Step component
// ---------------------------------------------------------------------------
function EscrowStepItem({
  step,
  isLast,
}: {
  step: EscrowStep;
  isLast: boolean;
}) {
  const isCompleted = step.status === "completed";
  const isInProgress = step.status === "in_progress";
  const isPending = step.status === "pending";

  return (
    <div className="relative flex gap-4">
      {/* Vertical connector line */}
      {!isLast && (
        <div
          className={cn(
            "absolute left-[19px] top-10 w-0.5 bottom-0",
            isCompleted
              ? "bg-emerald-500/40"
              : isInProgress
                ? "bg-primary/30 border-l border-dashed border-primary/40"
                : "bg-border-dark"
          )}
          style={
            isInProgress ? { background: "none", width: "0" } : undefined
          }
        />
      )}
      {!isLast && isInProgress && (
        <div
          className="absolute left-[18px] top-10 bottom-0"
          style={{
            width: "2px",
            backgroundImage:
              "repeating-linear-gradient(to bottom, #0e7c66 0px, #0e7c66 4px, transparent 4px, transparent 8px)",
          }}
        />
      )}

      {/* Step circle */}
      <div className="relative z-10 flex-shrink-0">
        {isCompleted && (
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center">
            <span className="material-symbols-outlined text-emerald-400 text-lg">
              check
            </span>
          </div>
        )}
        {isInProgress && (
          <div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-primary border-dashed flex items-center justify-center animate-pulse">
            <span className="material-symbols-outlined text-primary text-lg">
              pending
            </span>
          </div>
        )}
        {isPending && (
          <div className="w-10 h-10 rounded-full bg-neutral-dark border-2 border-border-dark flex items-center justify-center">
            <span className="material-symbols-outlined text-slate-500 text-lg">
              lock
            </span>
          </div>
        )}
      </div>

      {/* Step content */}
      <div className={cn("flex-1 pb-8", isLast && "pb-0")}>
        <div className="flex items-center gap-2 mb-1">
          <h4
            className={cn(
              "font-bold text-sm",
              isCompleted && "text-emerald-400",
              isInProgress && "text-white",
              isPending && "text-slate-500"
            )}
          >
            {step.title}
          </h4>
          {isCompleted && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              Complete
            </span>
          )}
          {isInProgress && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full animate-pulse">
              En cours
            </span>
          )}
          {isPending && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-600/10 px-2 py-0.5 rounded-full">
              En attente
            </span>
          )}
        </div>
        <p
          className={cn(
            "text-sm leading-relaxed",
            isPending ? "text-slate-600" : "text-slate-400"
          )}
        >
          {step.description}
        </p>

        {/* Hash reference */}
        {step.hash && (
          <div className="mt-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-slate-500">
              tag
            </span>
            <code className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
              {step.hash}
            </code>
          </div>
        )}

        {/* Status note */}
        {step.statusNote && (
          <div className="mt-2 flex items-center gap-2">
            {isCompleted && (
              <span className="material-symbols-outlined text-sm text-emerald-500">
                verified
              </span>
            )}
            {isInProgress && (
              <span className="material-symbols-outlined text-sm text-amber-400 animate-spin">
                progress_activity
              </span>
            )}
            <span
              className={cn(
                "text-xs font-medium",
                isCompleted ? "text-emerald-400" : "text-amber-400"
              )}
            >
              {step.statusNote}
            </span>
            {step.statusLink && (
              <button className="text-xs font-semibold text-primary hover:underline">
                {step.statusLink}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function EscrowPage() {
  const { orders } = useDashboardStore();
  const addToast = useToastStore((s) => s.addToast);

  // All orders with their derived escrow status
  const allOrders = useMemo(() => {
    return orders.map((o) => ({
      ...o,
      escrow: getEscrowStatus(o.status),
    }));
  }, [orders]);

  function handleCopyTxId() {
    navigator.clipboard
      .writeText("ESC-8829-ETH")
      .then(() => addToast("success", "ID de transaction copie !"))
      .catch(() => addToast("error", "Echec de la copie"));
  }

  return (
    <div className="max-w-full space-y-8">
      {/* ---------------------------------------------------------------- */}
      {/* Header */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
              Actif
            </span>
            <button
              onClick={handleCopyTxId}
              className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-primary transition-colors"
              title="Copier l'ID"
            >
              <span className="material-symbols-outlined text-sm">
                content_copy
              </span>
              ESC-8829-ETH
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => addToast("info", "Redirection vers Etherscan...")}
              className="flex items-center gap-2 px-4 py-2 border border-border-dark rounded-lg text-sm font-semibold text-slate-300 hover:border-primary/50 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">
                open_in_new
              </span>
              Voir sur Etherscan
            </button>
            <button
              onClick={() =>
                addToast("info", "Code du contrat intelligent affiche")
              }
              className="flex items-center gap-2 px-4 py-2 border border-border-dark rounded-lg text-sm font-semibold text-slate-300 hover:border-primary/50 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">code</span>
              Code du Contrat
            </button>
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">
            Securite des Paiements par Escrow
          </h2>
          <p className="text-slate-400 mt-1">
            Vos fonds sont proteges par un smart contract USDT sur la blockchain
            Ethereum. Chaque etape est tracable et immuable.
          </p>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Two-column layout */}
      {/* ---------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ============================================================== */}
        {/* LEFT COLUMN — Transaction Flow */}
        {/* ============================================================== */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Transaction Flow Card */}
          <div className="bg-background-dark/50 border border-border-dark rounded-xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">
                  swap_vert
                </span>
              </div>
              <div>
                <h3 className="font-bold text-lg">Flux de Securisation</h3>
                <p className="text-xs text-slate-500">
                  Suivi en temps reel de votre transaction escrow
                </p>
              </div>
            </div>

            <div className="space-y-0">
              {ESCROW_STEPS.map((step, idx) => (
                <EscrowStepItem
                  key={step.id}
                  step={step}
                  isLast={idx === ESCROW_STEPS.length - 1}
                />
              ))}
            </div>
          </div>

          {/* Orders with Escrow Status */}
          <div className="bg-background-dark/50 border border-border-dark rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border-dark flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">
                  receipt_long
                </span>
                Commandes avec Escrow ({allOrders.length})
              </h3>
            </div>
            <div className="divide-y divide-border-dark">
              {allOrders.length === 0 && (
                <div className="p-12 text-center text-slate-500">
                  Aucune commande avec escrow.
                </div>
              )}
              {allOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/dashboard/commandes/${order.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-primary/5 transition-colors"
                >
                  {/* Client avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                    {order.clientAvatar}
                  </div>

                  {/* Order info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {order.serviceTitle}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {order.id} &middot; {order.clientName} &middot;{" "}
                      {order.clientCountry}
                    </p>
                  </div>

                  {/* Escrow status */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={cn(
                        "text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5",
                        order.escrow.color
                      )}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {order.escrow.icon}
                      </span>
                      {order.escrow.label}
                    </span>
                  </div>

                  {/* Amount */}
                  <p className="text-sm font-bold w-20 text-right flex-shrink-0">
                    &euro;{order.amount.toLocaleString("fr-FR")}
                  </p>

                  <span className="material-symbols-outlined text-slate-600 text-lg flex-shrink-0">
                    chevron_right
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* RIGHT COLUMN — Summary, Security, Help */}
        {/* ============================================================== */}
        <div className="flex flex-col gap-6">
          {/* Summary Card */}
          <div className="bg-primary rounded-xl p-6 text-white relative overflow-hidden">
            {/* Decorative background circle */}
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5" />

            <div className="relative z-10">
              <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-1">
                Montant en Escrow
              </p>
              <p className="text-4xl font-extrabold tracking-tight mb-1">
                1,250.00{" "}
                <span className="text-lg font-bold text-white/80">USDT</span>
              </p>
              <p className="text-sm text-white/60 mb-6">
                &asymp; 1,157.41 EUR
              </p>

              <div className="space-y-3 border-t border-white/10 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/60">Frais de Gas</span>
                  <span className="text-sm font-bold">4.50 USDT</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/60">
                    Frais d&apos;Escrow
                  </span>
                  <span className="text-sm font-bold">12.50 USDT</span>
                </div>
                <div className="flex justify-between items-center border-t border-white/10 pt-3">
                  <span className="text-xs text-white/80 font-semibold">
                    Total debite
                  </span>
                  <span className="text-sm font-extrabold">1,267.00 USDT</span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Info Card */}
          <div className="bg-background-dark/50 border border-border-dark rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="material-symbols-outlined text-primary text-xl">
                gpp_good
              </span>
              <h3 className="font-bold">Securite du Contrat</h3>
            </div>

            <div className="space-y-4">
              {SECURITY_FEATURES.map((feature) => (
                <div key={feature.title} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-primary text-lg">
                      {feature.icon}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold">{feature.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Contract address */}
            <div className="mt-5 pt-4 border-t border-border-dark">
              <p className="text-xs text-slate-500 mb-1.5">
                Adresse du contrat
              </p>
              <div className="flex items-center gap-2">
                <code className="text-[11px] font-mono text-primary bg-primary/10 px-2.5 py-1.5 rounded flex-1 truncate">
                  0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard
                      .writeText(
                        "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18"
                      )
                      .then(() =>
                        addToast("success", "Adresse du contrat copiee !")
                      )
                      .catch(() => addToast("error", "Echec de la copie"));
                  }}
                  className="flex-shrink-0 p-1.5 rounded-lg hover:bg-primary/10 text-slate-400 hover:text-primary transition-colors"
                  title="Copier l'adresse"
                >
                  <span className="material-symbols-outlined text-sm">
                    content_copy
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Transaction Timeline Mini */}
          <div className="bg-background-dark/50 border border-border-dark rounded-xl p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">
                timeline
              </span>
              Activité Récente
            </h3>
            <div className="space-y-3">
              {[
                {
                  time: "Il y a 2h",
                  text: "Livrables soumis pour revue",
                  icon: "upload_file",
                  color: "text-blue-400",
                },
                {
                  time: "Il y a 1j",
                  text: "Fonds verrouilles dans l'escrow",
                  icon: "lock",
                  color: "text-emerald-400",
                },
                {
                  time: "Il y a 2j",
                  text: "Paiement client confirme",
                  icon: "payments",
                  color: "text-emerald-400",
                },
                {
                  time: "Il y a 3j",
                  text: "Contrat escrow deploye",
                  icon: "rocket_launch",
                  color: "text-primary",
                },
              ].map((event, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-primary/5 transition-colors"
                >
                  <span
                    className={cn(
                      "material-symbols-outlined text-lg",
                      event.color
                    )}
                  >
                    {event.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-300 truncate">
                      {event.text}
                    </p>
                    <p className="text-[10px] text-slate-600">{event.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Help Box */}
          <div className="bg-neutral-dark border border-border-dark rounded-xl p-6 relative overflow-hidden">
            {/* Decorative */}
            <div className="absolute top-2 right-2">
              <span className="material-symbols-outlined text-5xl text-primary/10">
                support_agent
              </span>
            </div>

            <div className="relative z-10">
              <h3 className="font-bold mb-2">Besoin d&apos;aide ?</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Notre equipe de support est disponible 24/7 pour repondre a vos
                questions sur l&apos;escrow, les litiges et la liberation des
                fonds.
              </p>
              <button
                onClick={() =>
                  addToast(
                    "info",
                    "Redirection vers le support en cours..."
                  )
                }
                className="flex items-center gap-2 w-full justify-center px-4 py-2.5 bg-primary text-white font-bold rounded-lg text-sm hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
              >
                <span className="material-symbols-outlined text-lg">
                  headset_mic
                </span>
                Contacter le support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
