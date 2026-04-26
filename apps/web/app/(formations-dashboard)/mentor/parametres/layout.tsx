"use client";

import { ShopProvider } from "@/components/formations/ShopProvider";

// Mentor settings reuse the vendor settings UI (same compte, domaine,
// paiements, notifications, sécurité, coaching tabs). VendorDomainTab and
// PaymentSettingsPanel both depend on ShopProvider, so we wrap this single
// route — the rest of the mentor space stays shop-agnostic.
export default function MentorParametresLayout({ children }: { children: React.ReactNode }) {
  return <ShopProvider>{children}</ShopProvider>;
}
