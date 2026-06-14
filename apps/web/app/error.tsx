"use client";

import { AlertCircle } from "lucide-react";

/**
 * Segment-level error boundary. Never exposes raw error.message in production
 * (info-leak) — only the Next.js error digest, which is safe and queryable.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isDev = process.env.NODE_ENV !== "production";
  const digest = error.digest;

  return (
    <div className="flex min-h-screen items-center justify-center px-6 bg-[#f7f9fb]">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-red-50 flex items-center justify-center">
          <AlertCircle size={36} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-extrabold text-[#191c1e] mb-2">Une erreur est survenue</h2>
        <p className="text-[#5c647a] mb-1">
          Notre équipe a été notifiée. Vous pouvez réessayer ci-dessous.
        </p>
        {digest && (
          <p className="text-xs text-[#9ca3af] mb-6 font-mono select-all">
            ID erreur : {digest}
          </p>
        )}
        {isDev && error.message && (
          <details className="text-left mb-5 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs">
            <summary className="font-semibold text-amber-900 cursor-pointer">Dev details</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words text-amber-800">{error.message}</pre>
          </details>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
          >
            Réessayer
          </button>
          <a
            href={`mailto:support@novakou.com?subject=Erreur%20${encodeURIComponent(digest ?? "inconnue")}&body=Bonjour,%20j'ai%20rencontré%20une%20erreur%20${encodeURIComponent(digest ?? "")}`}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-[#191c1e] hover:bg-gray-50 transition-colors"
          >
            Contacter le support
          </a>
        </div>
      </div>
    </div>
  );
}
