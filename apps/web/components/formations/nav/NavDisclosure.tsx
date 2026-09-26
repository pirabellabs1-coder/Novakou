"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { NavIcon } from "./icons";
import { reducedMotion, usePresence, useWillChange } from "./use-presence";

type Props = {
  label: string;
  /** La page courante appartient à ce menu (filet vert sous le déclencheur). */
  active: boolean;
  /** Panneau centré sous l'île entière (méga-menu) ou sous son déclencheur. */
  align: "island" | "trigger";
  children: (close: () => void) => ReactNode;
};

const HOVER_OPEN_MS = 60;
const HOVER_CLOSE_MS = 160;
const EXIT_MS = 160;

/**
 * Déclencheur + panneau d'un menu de la barre desktop.
 *
 * S'ouvre au survol (souris uniquement : au tactile, « enter » puis « click »
 * ouvriraient puis refermeraient dans la foulée) et au clavier : Entrée /
 * Espace basculent, Flèche bas ouvre et pose le focus sur la première entrée,
 * Échap referme et rend le focus. Le focus qui sort du bloc referme aussi —
 * c'est le piège « raisonnable » : on ne bloque personne dans le panneau.
 */
export function NavDisclosure({ label, active, align, children }: Props) {
  const panelId = `nk-panel-${useId()}`;
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const phase = usePresence(open, reducedMotion() ? 0 : EXIT_MS);
  const hot = useWillChange(phase);
  const rootRef = useRef<HTMLLIElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const viaHover = useRef(false);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  const close = useCallback(() => {
    clearTimer();
    viaHover.current = false;
    setOpen(false);
  }, []);

  // Navigation → le panneau se referme, quelle qu'en soit la cause.
  useEffect(() => close(), [pathname, close]);
  useEffect(() => clearTimer, []);

  // Clic ou tap hors du bloc pendant l'ouverture.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: globalThis.PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, close]);

  function focusFirstItem() {
    // Le panneau n'est monté qu'au rendu suivant.
    requestAnimationFrame(() => {
      rootRef.current?.querySelector<HTMLElement>("[data-panel] a[href]")?.focus();
    });
  }

  function onPointerEnter(e: PointerEvent) {
    if (e.pointerType !== "mouse") return;
    clearTimer();
    timer.current = setTimeout(() => {
      viaHover.current = true;
      setOpen(true);
    }, HOVER_OPEN_MS);
  }
  function onPointerLeave(e: PointerEvent) {
    if (e.pointerType !== "mouse") return;
    clearTimer();
    timer.current = setTimeout(close, HOVER_CLOSE_MS);
  }
  function onTriggerClick() {
    // Ouvert au survol : le clic n'a pas à refermer ce que la souris vient d'ouvrir.
    if (open && viaHover.current) {
      viaHover.current = false;
      return;
    }
    clearTimer();
    setOpen((o) => !o);
  }
  function onTriggerKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      focusFirstItem();
    }
  }
  function onRootKeyDown(e: KeyboardEvent<HTMLLIElement>) {
    if (e.key === "Escape" && open) {
      e.preventDefault();
      e.stopPropagation();
      close();
      triggerRef.current?.focus();
    }
  }
  function onRootBlur(e: React.FocusEvent<HTMLLIElement>) {
    if (!rootRef.current?.contains(e.relatedTarget as Node | null)) close();
  }

  return (
    <li
      ref={rootRef}
      className={align === "trigger" ? "relative" : undefined}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onKeyDown={onRootKeyDown}
      onBlur={onRootBlur}
    >
      <button
        ref={triggerRef}
        type="button"
        className="nk-nav__link"
        aria-expanded={open}
        aria-controls={panelId}
        data-active={active || undefined}
        onClick={onTriggerClick}
        onKeyDown={onTriggerKeyDown}
      >
        {label}
        <NavIcon name="expand_more" className="nk-nav__chev" />
      </button>

      {phase !== "closed" && (
        <div
          id={panelId}
          data-panel
          data-phase={phase}
          className={`nk-panel nk-panel--${align}`}
          style={hot.style}
          onAnimationEnd={hot.onAnimationEnd}
        >
          <div className="nk-panel__core">{children(close)}</div>
        </div>
      )}
    </li>
  );
}
