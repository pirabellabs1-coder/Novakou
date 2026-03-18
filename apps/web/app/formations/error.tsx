"use client";

import Link from "next/link";

export default function FormationsError({
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
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <svg
            className="h-8 w-8 text-red-500 dark:text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>

        {/* Title */}
        <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
          Erreur sur la page formations
        </h2>

        {/* Description */}
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Une erreur inattendue est survenue lors du chargement de cette page.
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
