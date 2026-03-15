export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-background-dark text-slate-100">
      {children}
    </div>
  );
}
