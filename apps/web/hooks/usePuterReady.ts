"use client";

import { useEffect, useState, useCallback } from "react";

type PuterContentBlock = { type?: string; text?: string };
type PuterChatResponse = { message: { content: string | PuterContentBlock[] } };

declare global {
  interface Window {
    puter?: {
      ai: {
        chat: (
          prompt: string,
          options?: { model?: string; temperature?: number; max_tokens?: number; stream?: boolean },
        ) => Promise<PuterChatResponse>;
      };
    };
  }
}

export type PuterStatus = {
  ready: boolean;
  failed: boolean;
  retry: () => void;
  retryNonce: number;
};

/**
 * Detection du SDK Puter.com (charge via <Script src="https://js.puter.com/v2/" />).
 * Apres 15s sans window.puter, on considere le CDN bloque (adblock, VPN, panne Puter).
 *
 * Usage :
 *   const { ready, failed, retry, retryNonce } = usePuterReady();
 *   <Script key={`puter-${retryNonce}`} src="..." onError={...} />
 */
export function usePuterReady(timeoutMs = 15_000): PuterStatus {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);

  const retry = useCallback(() => {
    setReady(false);
    setFailed(false);
    setRetryNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.puter) { setReady(true); return; }

    const interval = setInterval(() => {
      if (window.puter) { setReady(true); clearInterval(interval); }
    }, 300);
    const timeout = setTimeout(() => {
      if (!window.puter) { setFailed(true); clearInterval(interval); }
    }, timeoutMs);

    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [retryNonce, timeoutMs]);

  return { ready, failed, retry, retryNonce };
}
