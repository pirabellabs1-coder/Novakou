// Coque commune DashboardShell (2026-09-26) : barre latérale vert nuit,
// icônes Lucide (plus de Material Symbols), vraie cloche de notifications.
// La garde d'accès (AffiliateSpaceGuard) est inchangée.
"use client";

import Link from "next/link";
import { ArrowLeft, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { AffiliateSpaceGuard } from "@/components/formations/AffiliateSpaceGuard";
import { NovakouNotificationBell } from "@/components/notifications/NovakouNotificationBell";
import {
  DashboardShell,
  ShellStatusCard,
  ShellUserChip,
  initiales,
} from "@/components/formations/dashboard/DashboardShell";
import { SECTIONS_AFFILIE } from "@/components/formations/dashboard/nav/affilie";
import { inter } from "@/lib/fonts";

// Ce groupe de routes n'a pas de layout parent : --font-inter est posé ici.

function AffiliéFooter() {
  return (
    <footer className="border-t border-[#1e3a2f] bg-[#0d1f17] mt-auto">
      <div className="px-6 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[10px] text-[#5c9e7a]">© 2026 Novakou — Programme d&apos;affiliation</p>
          <div className="flex items-center gap-4">
            <Link href="/cgu-affiliation" className="text-[10px] text-[#5c9e7a] hover:text-white transition-colors">Conditions d&apos;affiliation</Link>
            <Link href="/aide" className="text-[10px] text-[#5c9e7a] hover:text-white transition-colors">Aide</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function AffiliéLayout({ children }: { children: React.ReactNode }) {
  return (
    <AffiliateSpaceGuard>
      <AffiliéLayoutInner>{children}</AffiliéLayoutInner>
    </AffiliateSpaceGuard>
  );
}

function AffiliéLayoutInner({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  const userName  = session?.user?.name ?? "Affilié";
  const userImage = session?.user?.image;
  const initials  = initiales(session?.user?.name, "?");

  return (
    <DashboardShell
      space="affilie"
      spaceLabel="Espace affilié"
      homeHref="/affilie/dashboard"
      sections={SECTIONS_AFFILIE}
      className={inter.variable}
      topEnd={
        <>
          <Link href="/apprenant/dashboard" className="nkd-btn nkd-btn--sm">
            <ArrowLeft aria-hidden="true" />
            Mon espace apprenant
          </Link>
          <div className="nkd__bell">
            <NovakouNotificationBell tone="light" viewAllHref="/apprenant/notifications" />
          </div>
          <ShellUserChip name={userName} subtitle="Affilié" src={userImage} initials={initials} />
        </>
      }
      sidebarCard={<ShellStatusCard title={userName} status="Affilié actif" src={userImage} initials={initials} />}
      sidebarFoot={
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="nkd-btn nkd-btn--danger nkd-btn--block"
        >
          <LogOut aria-hidden="true" />
          Se déconnecter
        </button>
      }
      footer={<AffiliéFooter />}
    >
      {children}
    </DashboardShell>
  );
}
