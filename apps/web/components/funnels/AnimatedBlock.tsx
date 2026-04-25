"use client";

import { useEffect, useRef, useState, type ReactNode, type ReactElement } from "react";

export type AnimationType = "none" | "fade-in" | "slide-up" | "slide-left" | "bounce" | "zoom";

interface AnimatedBlockProps {
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  children: ReactNode;
  className?: string;
}

export default function AnimatedBlock({
  animation = "none",
  delay = 0,
  duration = 600,
  children,
  className = "",
}: AnimatedBlockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(animation === "none");

  useEffect(() => {
    if (animation === "none") return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [animation, delay]);

  // No wrapper needed when no animation and no visibility class
  if (animation === "none" && !className) {
    return children as ReactElement;
  }

  // Visibility-only (no animation) — minimal wrapper
  if (animation === "none") {
    return <div className={className}>{children}</div>;
  }

  const animClass = visible ? `fh-anim-${animation}` : "fh-anim-hidden";

  return (
    <div
      ref={ref}
      className={`${animClass} ${className}`.trim()}
      style={{ animationDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
}
