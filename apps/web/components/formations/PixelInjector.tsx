"use client";

import { useEffect } from "react";
import Script from "next/script";

export interface Pixel {
  type: "FACEBOOK" | "GOOGLE" | "TIKTOK" | "SNAPCHAT" | "PINTEREST";
  pixelId: string;
}

// Mappe l'event générique (nomenclature Facebook) vers chaque plateforme.
const SNAP_EVENTS: Record<string, string> = { PageView: "PAGE_VIEW", ViewContent: "VIEW_CONTENT", InitiateCheckout: "START_CHECKOUT", Purchase: "PURCHASE" };
const PIN_EVENTS: Record<string, string> = { PageView: "pagevisit", ViewContent: "pagevisit", InitiateCheckout: "addtocart", Purchase: "checkout" };

interface Props {
  pixels: Pixel[];
  // Optional event to fire on mount (PageView/ViewContent/Purchase)
  event?: {
    name: string;
    value?: number;
    currency?: string;
  };
}

/**
 * Injects Facebook/Google/TikTok pixels into a public page and fires the page-view event.
 * Renders nothing visible.
 */
export function PixelInjector({ pixels, event }: Props) {
  const fbPixel = pixels.find((p) => p.type === "FACEBOOK");
  const gaPixel = pixels.find((p) => p.type === "GOOGLE");
  const ttPixel = pixels.find((p) => p.type === "TIKTOK");
  const snapPixel = pixels.find((p) => p.type === "SNAPCHAT");
  const pinPixel = pixels.find((p) => p.type === "PINTEREST");

  // Fire custom event after mount (if any)
  useEffect(() => {
    if (!event) return;
    const w = window as unknown as {
      fbq?: (action: string, eventName: string, params?: Record<string, unknown>) => void;
      gtag?: (...args: unknown[]) => void;
      ttq?: { track: (event: string, params?: Record<string, unknown>) => void };
      snaptr?: (action: string, eventName: string, params?: Record<string, unknown>) => void;
      pintrk?: (action: string, eventName: string, params?: Record<string, unknown>) => void;
    };
    setTimeout(() => {
      try {
        const val = event.value ? { value: event.value, currency: event.currency ?? "XOF" } : undefined;
        if (w.fbq) w.fbq("track", event.name, val);
        if (w.gtag) w.gtag("event", event.name, val ?? {});
        if (w.ttq) w.ttq.track(event.name, val);
        if (w.snaptr) w.snaptr("track", SNAP_EVENTS[event.name] ?? event.name, event.value ? { price: event.value, currency: event.currency ?? "XOF" } : undefined);
        if (w.pintrk && PIN_EVENTS[event.name]) w.pintrk("track", PIN_EVENTS[event.name], val);
      } catch {
        // pixel libs not yet ready; swallow errors
      }
    }, 800);
  }, [event]);

  return (
    <>
      {/* ── Facebook / Meta Pixel ──────────────────────────────────────── */}
      {fbPixel && (
        <Script id="fb-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${fbPixel.pixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}

      {/* ── Google Analytics 4 / Tag Manager ─────────────────────────── */}
      {gaPixel && (
        <>
          {gaPixel.pixelId.startsWith("GTM-") ? (
            <Script id="gtm-pixel" strategy="afterInteractive">
              {`
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gaPixel.pixelId}');
              `}
            </Script>
          ) : (
            <>
              <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${gaPixel.pixelId}`}
                strategy="afterInteractive"
              />
              <Script id="ga4-config" strategy="afterInteractive">
                {`
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaPixel.pixelId}');
                `}
              </Script>
            </>
          )}
        </>
      )}

      {/* ── TikTok Pixel ──────────────────────────────────────────────── */}
      {ttPixel && (
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`
            !function (w, d, t) {
              w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
              ttq.load('${ttPixel.pixelId}');
              ttq.page();
            }(window, document, 'ttq');
          `}
        </Script>
      )}

      {/* ── Snapchat Pixel ────────────────────────────────────────────── */}
      {snapPixel && (
        <Script id="snap-pixel" strategy="afterInteractive">
          {`
            (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};a.queue=[];var s='script';var r=t.createElement(s);r.async=!0;r.src=n;var u=t.getElementsByTagName(s)[0];u.parentNode.insertBefore(r,u);})(window,document,'https://sc-static.net/scevent.min.js');
            snaptr('init', '${snapPixel.pixelId}');
            snaptr('track', 'PAGE_VIEW');
          `}
        </Script>
      )}

      {/* ── Pinterest Tag ─────────────────────────────────────────────── */}
      {pinPixel && (
        <Script id="pinterest-tag" strategy="afterInteractive">
          {`
            !function(e){if(!window.pintrk){window.pintrk=function(){window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var n=window.pintrk;n.queue=[],n.version="3.0";var t=document.createElement("script");t.async=!0,t.src=e;var r=document.getElementsByTagName("script")[0];r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");
            pintrk('load', '${pinPixel.pixelId}');
            pintrk('page');
          `}
        </Script>
      )}
    </>
  );
}
