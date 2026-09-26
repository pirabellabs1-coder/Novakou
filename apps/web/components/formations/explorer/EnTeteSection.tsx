import type { ReactNode } from "react";

/** Tête de section de la marketplace : eyebrow facultatif, h2, action à droite. */
export function EnTeteSection({
  id,
  eyebrow,
  titre,
  action,
}: {
  id: string;
  eyebrow?: string;
  titre: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3 md:mb-8">
      <div className="min-w-0">
        {eyebrow && <p className="nkx-eyebrow mb-3">{eyebrow}</p>}
        <h2 id={id} className="truncate text-xl font-extrabold tracking-tight text-[#0E1512] md:text-2xl">
          {titre}
        </h2>
      </div>
      {action}
    </div>
  );
}
