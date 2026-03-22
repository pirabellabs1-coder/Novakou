"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface KycStatusBannerProps {
  currentLevel: number;
  status: "not_verified" | "pending" | "approved" | "rejected";
  rejectionReason?: string;
  kycHref?: string;
}

const STEPS = [
  { level: 1, label: "Email", icon: "email" },
  { level: 3, label: "Identite", icon: "badge" },
  { level: 4, label: "Professionnel", icon: "workspace_premium" },
];

const STATUS_CONFIG = {
  not_verified: {
    label: "Non verifie",
    color: "text-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
    icon: "shield",
    dotColor: "bg-slate-500",
  },
  pending: {
    label: "En attente",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    icon: "schedule",
    dotColor: "bg-amber-500 animate-pulse",
  },
  approved: {
    label: "Approuve",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    icon: "verified",
    dotColor: "bg-emerald-500",
  },
  rejected: {
    label: "Refuse",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    icon: "gpp_bad",
    dotColor: "bg-red-500",
  },
};

export function KycStatusBanner({
  currentLevel,
  status,
  rejectionReason,
  kycHref = "/dashboard/kyc",
}: KycStatusBannerProps) {
  const config = STATUS_CONFIG[status];

  return (
    <div
      className={cn(
        "rounded-2xl border p-5 sm:p-6",
        config.border,
        config.bg
      )}
    >
      {/* Status badge */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
              status === "approved"
                ? "bg-emerald-500/10"
                : status === "pending"
                  ? "bg-amber-500/10"
                  : status === "rejected"
                    ? "bg-red-500/10"
                    : "bg-white/5"
            )}
          >
            <span
              className={cn(
                "material-symbols-outlined text-xl",
                config.color
              )}
            >
              {config.icon}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-sm sm:text-base">
                Niveau KYC : {currentLevel}/4
              </h3>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full",
                  config.bg,
                  config.color
                )}
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full flex-shrink-0",
                    config.dotColor
                  )}
                />
                {config.label}
              </span>
            </div>
            {status === "rejected" && rejectionReason && (
              <p className="text-xs text-red-400/80 mt-1">
                Motif : {rejectionReason}
              </p>
            )}
          </div>
        </div>

        {status !== "approved" && (
          <Link
            href={kycHref}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-colors flex-shrink-0 self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-sm">
              verified_user
            </span>
            {status === "rejected"
              ? "Resoumettre"
              : status === "pending"
                ? "Voir le statut"
                : "Verifier mon identite"}
          </Link>
        )}
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-0">
        {STEPS.map((step, index) => {
          const isCompleted = currentLevel >= step.level;
          const isCurrent = currentLevel === step.level - 1;

          return (
            <div key={step.level} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className={cn(
                    "w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all",
                    isCompleted
                      ? "bg-emerald-500/20 ring-2 ring-emerald-500/30"
                      : isCurrent
                        ? "bg-primary/20 ring-2 ring-primary/30"
                        : "bg-white/5"
                  )}
                >
                  {isCompleted ? (
                    <span className="material-symbols-outlined text-base text-emerald-400">
                      check
                    </span>
                  ) : (
                    <span
                      className={cn(
                        "material-symbols-outlined text-base",
                        isCurrent ? "text-primary" : "text-slate-600"
                      )}
                    >
                      {step.icon}
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] sm:text-xs mt-1.5 font-medium text-center",
                    isCompleted
                      ? "text-emerald-400"
                      : isCurrent
                        ? "text-primary"
                        : "text-slate-600"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-1 sm:mx-2 rounded-full -mt-4",
                    currentLevel > step.level
                      ? "bg-emerald-500/40"
                      : "bg-white/5"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
