"use client";

import { WorkflowAction } from "./types";

const ACTION_META: Record<
  WorkflowAction["type"],
  { label: string; icon: string; color: string; bg: string }
> = {
  SEND_EMAIL: { label: "Email", icon: "mail", color: "text-[#006e2f]", bg: "bg-[#006e2f]/10" },
  ADD_TAG: { label: "Tag", icon: "label", color: "text-violet-600", bg: "bg-violet-100" },
  ENROLL_SEQUENCE: {
    label: "Séquence",
    icon: "alt_route",
    color: "text-pink-600",
    bg: "bg-pink-100",
  },
  WEBHOOK: { label: "Webhook", icon: "webhook", color: "text-amber-600", bg: "bg-amber-100" },
  WAIT: { label: "Attendre", icon: "schedule", color: "text-gray-600", bg: "bg-gray-100" },
};

function describe(action: WorkflowAction): { title: string; summary: string } {
  switch (action.type) {
    case "SEND_EMAIL": {
      const { subject, to, delayMinutes } = action.config;
      const delayLabel =
        !delayMinutes || delayMinutes === 0
          ? "Envoyé immédiatement"
          : delayMinutes < 60
          ? `Délai ${delayMinutes} min`
          : delayMinutes < 1440
          ? `Délai ${Math.round(delayMinutes / 60)} h`
          : `Délai ${Math.round(delayMinutes / 1440)} j`;
      return {
        title: subject ? `Email : ${subject}` : "Email (sans objet)",
        summary: `${delayLabel} · à ${to || "{{customer.email}}"}`,
      };
    }
    case "ADD_TAG": {
      const { tagName, audienceType, productIds } = action.config;
      const audLabel: Record<typeof audienceType, string> = {
        all: "tous les clients",
        buyers: "acheteurs",
        prospects: "prospects",
        product_buyers: `${productIds?.length ?? 0} produit(s)`,
        custom: "filtre personnalisé",
      };
      return {
        title: `Tag : ${tagName || "(sans nom)"}`,
        summary: `Appliqué à ${audLabel[audienceType] ?? audienceType}`,
      };
    }
    case "ENROLL_SEQUENCE": {
      const { sequenceName, sequenceId } = action.config;
      return {
        title: `Séquence : ${sequenceName || "(sélectionnée)"}`,
        summary: sequenceId ? `ID ${sequenceId.slice(0, 10)}…` : "Aucune séquence",
      };
    }
    case "WEBHOOK": {
      const { url, method, selectedFields } = action.config;
      let host = "(sans URL)";
      try {
        host = url ? new URL(url).host : host;
      } catch {
        /* ignore */
      }
      return {
        title: `Webhook ${method} : ${host}`,
        summary: `${selectedFields.length} champ(s) envoyé(s)`,
      };
    }
    case "WAIT": {
      const hours = action.config.hours ?? 1;
      return {
        title: `Attendre ${hours} heure${hours > 1 ? "s" : ""}`,
        summary: "Pause avant la prochaine action",
      };
    }
    default:
      return { title: "Action", summary: "" };
  }
}

export default function ActionCard({
  action,
  index,
  onEdit,
  onDelete,
}: {
  action: WorkflowAction;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const meta = ACTION_META[action.type];
  const { title, summary } = describe(action);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 w-full max-w-md hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.bg} ${meta.color}`}
        >
          <span className="material-symbols-outlined text-[20px]">{meta.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Action {index + 1} · {meta.label}
            </p>
          </div>
          <p className="text-sm font-bold text-gray-900 truncate mt-0.5">{title}</p>
          <p className="text-[11px] text-gray-500 truncate">{summary}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-[#006e2f]"
            title="Éditer"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500"
            title="Supprimer"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
