"use client";

import { useEffect, useState } from "react";
import { lancerHero } from "@/components/home/animation-hero";
import { animerCompteurs, formaterNombre, observerReveals } from "@/components/home/reveal-compteurs";

/**
 * Interactivité de la page d'accueil (progressive enhancement sur le HTML
 * rendu côté serveur, scopé sous .nkhome) : chorégraphie du hero (anime.js,
 * chargé à la demande), reveals au défilement, compteurs, accordéon FAQ,
 * simulateur de revenus, bouton retour-en-haut.
 *
 * Sans JS ou en prefers-reduced-motion, tout le contenu est visible d'emblée
 * (voir <noscript> dans page.tsx et la media query de home.css).
 */
export default function HomeClient() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".nkhome");
    if (!root) return;
    const mouvementReduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Animations (chacune renvoie son nettoyage).
    const arreterHero = lancerHero(root, mouvementReduit);
    const arreterReveals = observerReveals(root, mouvementReduit);
    const arreterCompteurs = animerCompteurs(root, mouvementReduit);

    // FAQ accordéon (un seul ouvert à la fois, état exposé via aria-expanded)
    const faqHandlers: Array<[Element, () => void]> = [];
    root.querySelectorAll<HTMLElement>(".faq-q").forEach((q) => {
      const handler = () => {
        const item = q.parentElement!;
        const a = item.querySelector<HTMLElement>(".faq-a")!;
        const open = item.classList.contains("open");
        root.querySelectorAll(".faq-item").forEach((i) => {
          i.classList.remove("open");
          i.querySelector(".faq-q")?.setAttribute("aria-expanded", "false");
          const ia = i.querySelector<HTMLElement>(".faq-a");
          if (ia) ia.style.maxHeight = "";
        });
        if (!open) {
          item.classList.add("open");
          q.setAttribute("aria-expanded", "true");
          a.style.maxHeight = a.scrollHeight + "px";
        }
      };
      q.addEventListener("click", handler);
      faqHandlers.push([q, handler]);
    });

    // Simulateur
    const aud = root.querySelector<HTMLInputElement>("#nk-aud");
    const price = root.querySelector<HTMLInputElement>("#nk-price");
    const audVal = root.querySelector("#nk-audVal");
    const priceVal = root.querySelector("#nk-priceVal");
    const out = root.querySelector("#nk-simOut");
    const net = root.querySelector("#nk-simNet");
    const sim = () => {
      if (!aud || !price || !audVal || !priceVal || !out || !net) return;
      const a = +aud.value, p = +price.value, rev = a * 0.01 * p;
      audVal.textContent = formaterNombre(a) + " contacts";
      priceVal.textContent = formaterNombre(p) + " FCFA";
      out.textContent = formaterNombre(rev) + " FCFA";
      net.textContent = formaterNombre(rev * 0.9) + " FCFA";
    };
    aud?.addEventListener("input", sim);
    price?.addEventListener("input", sim);
    sim();

    // Sélection moyen de paiement (mockup)
    const payHandlers: Array<[Element, () => void]> = [];
    root.querySelectorAll<HTMLElement>(".pay-row").forEach((o) => {
      const h = () => {
        o.closest(".v-body")?.querySelectorAll(".pay-row").forEach((x) => x.classList.remove("on"));
        o.classList.add("on");
      };
      o.addEventListener("click", h);
      payHandlers.push([o, h]);
    });

    // Retour en haut
    const onScroll = () => setShowTop(window.scrollY > 700);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      arreterHero();
      arreterReveals();
      arreterCompteurs();
      faqHandlers.forEach(([el, h]) => el.removeEventListener("click", h));
      payHandlers.forEach(([el, h]) => el.removeEventListener("click", h));
      aud?.removeEventListener("input", sim);
      price?.removeEventListener("input", sim);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <button
      className={`nkhome-totop${showTop ? " show" : ""}`}
      aria-label="Retour en haut de page"
      onClick={() =>
        window.scrollTo({
          top: 0,
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        })
      }
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 19V5M6 11l6-6 6 6" /></svg>
    </button>
  );
}
