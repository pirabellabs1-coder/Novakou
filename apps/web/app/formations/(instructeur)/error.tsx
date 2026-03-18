"use client";

import Link from "next/link";

export default function InstructeurError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const truncatedMessage =
    error.message && error.message.length > 200
      ? error.message.slice(0, 200) + "..."
      : error.message;

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-8 text-center shadow-lg dark:bg-gray-900">
        {/* Error icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
          <svg
            className="h-8 w-8 text-orange-500 dark:text-orange-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085"
            />
          </svg>
        </div>

        {/* Title */}
        <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
          Erreur dans l&apos;espace instructeur
        </h2>

        {/* Description */}
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Un problème est survenu lors du chargement de votre espace instructeur.
          Vos données sont en sécurité.
        </p>

        {/* Error message */}
        {truncatedMessage && (
          <div className="mb-6 rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800">
            <p className="text-xs text-gray-600 dark:text-gray-300 break-words">
              {truncatedMessage}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#6C2BD9] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#5a23b5] focus:outline-none focus:ring-2 focus:ring-[#6C2BD9]/50"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
              />
            </svg>
            Réessayer
          </button>
          <Link
            href="/formations"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white dark:bg-slate-900 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
              />
            </svg>
            Retour aux formations
          </Link>
        </div>
      </div>
    </div>
  );
}
