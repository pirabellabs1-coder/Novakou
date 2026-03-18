"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const isDark = saved !== "light";
    setDark(isDark);
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");

    if (next) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  if (!mounted) return null;

  return (
    <button
      onClick={toggle}
      className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
        "border",
        dark
          ? "bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-600"
          : "bg-amber-50 border-amber-200 hover:bg-amber-100",
        className
      )}
      title={dark ? "Mode clair ☀️" : "Mode sombre 🌙"}
    >
      {dark ? (
        <span className="text-xl">🌙</span>
      ) : (
        <span className="text-xl">☀️</span>
      )}
    </button>
  );
}
