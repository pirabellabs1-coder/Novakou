"use client";

import Link from "next/link";

export default function ApprenantError({
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
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
          <svg
            className="h-8 w-8 text-blue-500 dark:text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5"
            />
          </svg>
        </div>

        {/* Title */}
        <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
          Erreur dans l&apos;espace apprenant
        </h2>

        {/* Description */}
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Un problème est survenu lors du chargement de votre espace
          d&apos;apprentissage. Votre progression est sauvegardée.
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
