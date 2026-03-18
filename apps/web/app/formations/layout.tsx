import { Suspense } from "react";
import { FormationsHeader } from "@/components/formations/FormationsHeader";
import { FormationsFooter } from "@/components/formations/FormationsFooter";
import { PixelTrackerLoader } from "@/components/formations/PixelTrackerLoader";
import SmartPopupRenderer from "@/components/marketing/SmartPopupRenderer";
import AffiliateTracker from "@/components/marketing/AffiliateTracker";

export default function FormationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-800/50 dark:bg-background-dark text-slate-900 dark:text-white dark:text-slate-100">
      <FormationsHeader />
      <main className="flex-1">{children}</main>
      <FormationsFooter />
      <PixelTrackerLoader />
      <SmartPopupRenderer />
      <Suspense fallback={null}>
        <AffiliateTracker />
      </Suspense>
    </div>
  );
}
