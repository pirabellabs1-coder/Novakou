"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "fade";
  className?: string;
};

/**
 * Wrap children. Children deviennent opaques + translated vers leur position
 * initiale quand l'element entre dans le viewport (IntersectionObserver).
 * Zero dependance externe (pas de framer-motion).
 */
export function RevealOnScroll({ children, delay = 0, direction = "up", className = "" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setTimeout(() => setVisible(true), delay);
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  const initialTransform = {
    up: "translateY(40px)",
    down: "translateY(-40px)",
    left: "translateX(40px)",
    right: "translateX(-40px)",
    fade: "none",
  }[direction];

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : initialTransform,
        transition: "opacity 700ms ease-out, transform 700ms ease-out",
      }}
    >
      {children}
    </div>
  );
}

/**
 * Compteur qui s'anime de 0 a `value` quand il entre dans le viewport.
 */
export function AnimatedCounter({
  value,
  suffix = "",
  prefix = "",
  duration = 1800,
  format = "number",
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  format?: "number" | "currency";
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const startTime = performance.now();
            const animate = (now: number) => {
              const elapsed = Math.min((now - startTime) / duration, 1);
              const eased = 1 - Math.pow(1 - elapsed, 3); // ease-out-cubic
              setN(Math.floor(eased * value));
              if (elapsed < 1) requestAnimationFrame(animate);
              else setN(value);
            };
            requestAnimationFrame(animate);
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration]);

  const display = format === "currency"
    ? new Intl.NumberFormat("fr-FR").format(n)
    : n.toLocaleString("fr-FR");

  return <span ref={ref}>{prefix}{display}{suffix}</span>;
}
