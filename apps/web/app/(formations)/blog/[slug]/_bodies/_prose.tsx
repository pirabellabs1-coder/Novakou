// Helpers de mise en forme partagés entre tous les articles.
// Approche : pas de Tailwind Typography (poids supplémentaire), on stylise
// à la main les éléments les plus utilisés. Tout est inlinable, lisible.

import type { ReactNode } from "react";
import Link from "next/link";

export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="prose-novakou text-gray-700 text-base md:text-[17px] leading-[1.75]">
      {children}
    </div>
  );
}

export function H2({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2
      id={id}
      className="text-2xl md:text-3xl font-extrabold text-[#191c1e] mt-12 mb-4 scroll-mt-24"
    >
      {children}
    </h2>
  );
}

export function H3({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h3
      id={id}
      className="text-xl font-bold text-[#191c1e] mt-8 mb-3 scroll-mt-24"
    >
      {children}
    </h3>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p className="mb-5">{children}</p>;
}

/** Lien externe ou interne (utilise next/link si interne). */
export function A({ href, children }: { href: string; children: ReactNode }) {
  const isExternal = /^https?:\/\//.test(href);
  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#006e2f] font-semibold underline decoration-[#006e2f]/30 hover:decoration-[#006e2f] transition-all"
      >
        {children}
      </a>
    );
  }
  return (
    <Link
      href={href}
      className="text-[#006e2f] font-semibold underline decoration-[#006e2f]/30 hover:decoration-[#006e2f] transition-all"
    >
      {children}
    </Link>
  );
}

export function Ul({ children }: { children: ReactNode }) {
  return (
    <ul className="list-disc list-outside pl-6 mb-5 space-y-2 marker:text-[#006e2f]">
      {children}
    </ul>
  );
}

export function Ol({ children }: { children: ReactNode }) {
  return (
    <ol className="list-decimal list-outside pl-6 mb-5 space-y-2 marker:text-[#006e2f] marker:font-bold">
      {children}
    </ol>
  );
}

export function Li({ children }: { children: ReactNode }) {
  return <li className="pl-2">{children}</li>;
}

export function Strong({ children }: { children: ReactNode }) {
  return <strong className="font-bold text-[#191c1e]">{children}</strong>;
}

export function Em({ children }: { children: ReactNode }) {
  return <em className="italic">{children}</em>;
}

/** Encart à mettre en avant (conseil, attention, info). */
export function Callout({
  variant = "info",
  title,
  children,
}: {
  variant?: "info" | "success" | "warning" | "tip";
  title?: string;
  children: ReactNode;
}) {
  const styles = {
    info: { bg: "#eff6ff", border: "#bfdbfe", color: "#1d4ed8", icon: "info" },
    success: { bg: "#f0fdf4", border: "#bbf7d0", color: "#047857", icon: "check_circle" },
    warning: { bg: "#fef3c7", border: "#fde68a", color: "#b45309", icon: "warning" },
    tip: { bg: "#f5f3ff", border: "#ddd6fe", color: "#5b21b6", icon: "lightbulb" },
  }[variant];

  return (
    <div
      className="my-6 p-5 rounded-xl border-l-4 flex gap-3"
      style={{ backgroundColor: styles.bg, borderLeftColor: styles.color }}
    >
      <span
        className="material-symbols-outlined text-[22px] flex-shrink-0 mt-0.5"
        style={{ color: styles.color }}
      >
        {styles.icon}
      </span>
      <div className="flex-1 min-w-0">
        {title && (
          <p
            className="font-bold text-sm mb-1.5"
            style={{ color: styles.color }}
          >
            {title}
          </p>
        )}
        <div className="text-sm text-gray-700 leading-relaxed [&>p:last-child]:mb-0 [&>p]:mb-2">
          {children}
        </div>
      </div>
    </div>
  );
}

/** Table simple responsive. */
export function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: (ReactNode[])[];
}) {
  return (
    <div className="my-6 overflow-x-auto -mx-4 md:mx-0">
      <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className="text-left px-4 py-3 font-bold text-[#191c1e] text-xs uppercase tracking-wider border-b border-gray-200"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
            >
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="px-4 py-3 border-b border-gray-100 text-gray-700"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Sommaire avec liens vers les H2. */
export function TableOfContents({
  items,
}: {
  items: { id: string; label: string }[];
}) {
  return (
    <nav
      className="my-8 p-5 rounded-xl bg-gray-50 border border-gray-200"
      aria-label="Sommaire de l'article"
    >
      <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-3">
        Au sommaire
      </p>
      <ul className="space-y-1.5">
        {items.map((it) => (
          <li key={it.id}>
            <a
              href={`#${it.id}`}
              className="text-sm text-[#006e2f] hover:underline font-medium"
            >
              → {it.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
