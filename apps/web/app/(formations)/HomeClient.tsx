"use client";

import { useEffect, useState } from "react";

/**
 * Interactivité de la page d'accueil (progressive enhancement sur le HTML
 * rendu côté serveur, scopé sous .nkhome) : animations reveal, accordéon FAQ,
 * simulateur de revenus, bouton retour-en-haut, compteur du dashboard.
 */
export default function HomeClient() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const root = document.querySelector(".nkhome");
    if (!root) return;
    const fmt = (n: number) =>
      Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

    // Reveal
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
      { threshold: 0.1 },
    );
    root.querySelectorAll(".reveal").forEach((el) => io.observe(el));

    // FAQ accordéon
    const faqHandlers: Array<[Element, () => void]> = [];
    root.querySelectorAll<HTMLElement>(".faq-q").forEach((q) => {
      const handler = () => {
        const item = q.parentElement!;
        const a = item.querySelector<HTMLElement>(".faq-a")!;
        const open = item.classList.contains("open");
        root.querySelectorAll(".faq-item").forEach((i) => {
          i.classList.remove("open");
          const ia = i.querySelector<HTMLElement>(".faq-a");
          if (ia) ia.style.maxHeight = "";
        });
        if (!open) { item.classList.add("open"); a.style.maxHeight = a.scrollHeight + "px"; }
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
      audVal.textContent = fmt(a) + " contacts";
      priceVal.textContent = fmt(p) + " FCFA";
      out.textContent = fmt(rev) + " FCFA";
      net.textContent = fmt(rev * 0.9) + " FCFA";
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

    // Compteur revenus dashboard
    const dashRev = root.querySelector<HTMLElement>("#nk-dashRev");
    if (dashRev) {
      let done = false;
      const ioC = new IntersectionObserver((es) => es.forEach((e) => {
        if (e.isIntersecting && !done) {
          done = true;
          const target = 412000, dur = 1300, t0 = performance.now();
          const tick = (t: number) => {
            const k = Math.min((t - t0) / dur, 1), ease = 1 - Math.pow(1 - k, 3);
            dashRev.textContent = fmt(target * ease) + " F";
            if (k < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      }), { threshold: 0.4 });
      ioC.observe(dashRev);
    }

    // Retour en haut
    const onScroll = () => setShowTop(window.scrollY > 700);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      io.disconnect();
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
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 19V5M6 11l6-6 6 6" /></svg>
    </button>
  );
}
