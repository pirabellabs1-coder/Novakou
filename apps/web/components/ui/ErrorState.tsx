"use client";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title = "Erreur de chargement",
  message = "Une erreur est survenue lors du chargement des donnees.",
  onRetry,
  retryLabel = "Reessayer",
  className = "",
}: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-20 px-6 text-center ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-5">
        <span className="material-symbols-outlined text-3xl text-red-400">error</span>
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:brightness-110 transition-all"
        >
          <span className="material-symbols-outlined text-lg">refresh</span>
          {retryLabel}
        </button>
      )}
    </div>
  );
}
