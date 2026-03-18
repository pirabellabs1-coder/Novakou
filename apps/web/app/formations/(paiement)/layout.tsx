export default function PaiementFormationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-white dark:bg-slate-900">
      <div className="w-full max-w-2xl">
        {children}
      </div>
    </div>
  );
}
