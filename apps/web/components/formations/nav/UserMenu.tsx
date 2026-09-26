"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { signOut } from "next-auth/react";
import { getDashboardForFormationsRole, getRoleLabel } from "@/lib/formations/role-routing";
import { NavIcon, type NavIconName } from "./icons";
import { reducedMotion, usePresence, useWillChange } from "./use-presence";

type FormationsRole = "apprenant" | "instructeur" | "mentor" | "affilie" | undefined;

function initials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function Row({ href, icon, label, onClick, main }: { href: string; icon: NavIconName; label: string; onClick: () => void; main?: boolean }) {
  return (
    <Link href={href} onClick={onClick} className={`nk-user__row${main ? " nk-user__row--main" : ""}`}>
      <NavIcon name={icon} />
      {label}
    </Link>
  );
}

/**
 * Menu du compte connecté. Même logique de rôles qu'avant (admin / vendeur /
 * mentor / affilié / apprenant et passerelles inter-espaces), habillage verre
 * et clavier : Échap referme, le focus qui sort referme.
 */
export function UserMenu({
  name, email, image, role, formationsRole,
}: {
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  formationsRole?: string;
}) {
  const panelId = `nk-user-${useId()}`;
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const phase = usePresence(open, reducedMotion() ? 0 : 160);
  const hot = useWillChange(phase);
  const ref = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => close(), [pathname, close]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape" && open) {
      e.preventDefault();
      e.stopPropagation();
      close();
      btnRef.current?.focus();
    }
  }
  function onBlur(e: React.FocusEvent<HTMLDivElement>) {
    if (!ref.current?.contains(e.relatedTarget as Node | null)) close();
  }

  const normalizedRole = role.toLowerCase();
  const isAdmin = normalizedRole === "admin";
  const isVendor = formationsRole === "instructeur";
  const isMentor = formationsRole === "mentor";
  const isAffilie = formationsRole === "affilie";
  const dashboardHref = getDashboardForFormationsRole(formationsRole as FormationsRole, role);
  const dashboardLabel = isAdmin ? "Espace admin"
    : isVendor ? "Mon espace vendeur"
    : isMentor ? "Mon espace mentor"
    : isAffilie ? "Mon espace affilié"
    : "Mon espace apprenant";
  const roleLabel = isAdmin ? "Admin" : getRoleLabel(formationsRole as FormationsRole);
  const settingsHref = isAdmin ? "/admin/configuration" : isVendor ? "/vendeur/parametres" : "/apprenant/parametres";

  const avatar = (
    <span className="nk-user__avatar" aria-hidden="true">
      {/* Avatars OAuth (Google, LinkedIn…) : domaines arbitraires, next/image ne convient pas. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {image ? <img src={image} alt="" /> : initials(name)}
    </span>
  );

  return (
    <div ref={ref} className="relative" onKeyDown={onKeyDown} onBlur={onBlur}>
      <button
        ref={btnRef}
        type="button"
        className="nk-user__btn"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`Mon compte — ${name ?? email}`}
        onClick={() => setOpen((o) => !o)}
      >
        {avatar}
        <span className="hidden max-w-[120px] truncate text-sm font-semibold text-[#0e1512] xl:inline">
          {name?.split(" ")[0] ?? "Mon compte"}
        </span>
        <NavIcon name="expand_more" className="nk-nav__chev text-[#5c6b62]" />
      </button>

      {phase !== "closed" && (
        <div id={panelId} data-phase={phase} className="nk-panel nk-panel--right" style={hot.style} onAnimationEnd={hot.onAnimationEnd}>
          <div className="nk-panel__core">
            <div className="border-b border-[#0e1512]/[.06] bg-gradient-to-br from-[#006e2f]/[.06] to-[#22c55e]/[.04] px-4 py-3">
              <div className="flex items-center gap-3">
                {avatar}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[#0e1512]">{name ?? "Utilisateur"}</p>
                  <p className="truncate text-[11px] text-[#5c6b62]">{email}</p>
                </div>
              </div>
              {formationsRole && (
                <span className="mt-2 inline-block rounded-full bg-[#006e2f] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  {roleLabel}
                </span>
              )}
            </div>

            <div className="p-1.5">
              <Row href={dashboardHref} icon="dashboard" label={dashboardLabel} onClick={close} main />
              {!isAdmin && !isVendor && (
                <>
                  <Row href="/apprenant/mes-formations" icon="school" label="Mes formations" onClick={close} />
                  <Row href="/apprenant/commandes" icon="receipt_long" label="Mes commandes" onClick={close} />
                </>
              )}
              {isVendor && (
                <>
                  <Row href="/vendeur/produits" icon="inventory_2" label="Mes produits" onClick={close} />
                  <Row href="/vendeur/transactions" icon="payments" label="Mes ventes" onClick={close} />
                </>
              )}

              {/* Passerelles inter-espaces — un créateur (et l'admin) peut être à
                  la fois vendeur, mentor et apprenant. Permet de basculer entre
                  les espaces (l'espace mentor était introuvable autrement). */}
              <div className="nk-user__sep" />
              <p className="nk-user__group">Mes espaces</p>
              {isAdmin && <Row href="/admin/dashboard" icon="admin_panel_settings" label="Espace admin" onClick={close} />}
              {!isVendor && <Row href="/vendeur/dashboard" icon="storefront" label="Espace vendeur" onClick={close} />}
              {!isMentor && <Row href="/mentor/dashboard" icon="support_agent" label="Espace mentor" onClick={close} />}
              <Row href="/apprenant/dashboard" icon="school" label="Espace apprenant" onClick={close} />

              <div className="nk-user__sep" />
              <Row href="/academie" icon="school" label="Académie" onClick={close} />
              <Row href={settingsHref} icon="settings" label="Paramètres" onClick={close} />
              <button
                type="button"
                onClick={() => { close(); signOut({ callbackUrl: "/" }); }}
                className="nk-user__row nk-user__row--danger"
              >
                <NavIcon name="logout" />
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
