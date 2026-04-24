"use client";

import { useEffect } from "react";

const FONT_URLS = [
  "https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap",
  "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600;9..144,700;9..144,800&display=swap",
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap",
];

export function FontLoader() {
  useEffect(() => {
    // Injecter les liens dans le <head> au montage du composant
    FONT_URLS.forEach((url) => {
      const existing = document.querySelector(`link[href="${url}"]`);
      if (!existing) {
        // Preconnect
        if (!document.querySelector('link[href="https://fonts.gstatic.com"][rel="preconnect"]')) {
          const preconnect = document.createElement("link");
          preconnect.rel = "preconnect";
          preconnect.href = "https://fonts.gstatic.com";
          preconnect.crossOrigin = "anonymous";
          document.head.appendChild(preconnect);
        }

        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = url;
        document.head.appendChild(link);
      }
    });
  }, []);

  return null;
}
