"use client";

import Script from "next/script";

interface Pixel {
  type: "FACEBOOK" | "GOOGLE" | "TIKTOK";
  pixelId: string;
  isActive: boolean;
}

interface PixelTrackerProps {
  pixels: Pixel[];
}

export function PixelTracker({ pixels }: PixelTrackerProps) {
  const activePixels = pixels.filter((p) => p.isActive);

  if (activePixels.length === 0) return null;

  return (
    <>
      {activePixels.map((pixel) => {
        switch (pixel.type) {
          case "FACEBOOK":
            return (
              <Script
                key={`fb-${pixel.pixelId}`}
                id={`fb-pixel-${pixel.pixelId}`}
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                  __html: `
                    !function(f,b,e,v,n,t,s)
                    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                    n.queue=[];t=b.createElement(e);t.async=!0;
                    t.src=v;s=b.getElementsByTagName(e)[0];
                    s.parentNode.insertBefore(t,s)}(window, document,'script',
                    'https://connect.facebook.net/en_US/fbevents.js');
                    fbq('init', '${pixel.pixelId}');
                    fbq('track', 'PageView');
                  `,
                }}
              />
            );

          case "GOOGLE":
            return (
              <Script
                key={`gtag-${pixel.pixelId}`}
                id={`gtag-${pixel.pixelId}`}
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${pixel.pixelId}`}
                onLoad={() => {
                  const w = window as unknown as Record<string, unknown>;
                  w.dataLayer = (w.dataLayer as unknown[]) || [];
                  function gtag(...args: unknown[]) {
                    (w.dataLayer as unknown[]).push(args);
                  }
                  gtag("js", new Date());
                  gtag("config", pixel.pixelId);
                }}
              />
            );

          case "TIKTOK":
            return (
              <Script
                key={`ttq-${pixel.pixelId}`}
                id={`ttq-pixel-${pixel.pixelId}`}
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                  __html: `
                    !function (w, d, t) {
                      w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
                      ttq.load('${pixel.pixelId}');
                      ttq.page();
                    }(window, document, 'ttq');
                  `,
                }}
              />
            );

          default:
            return null;
        }
      })}
    </>
  );
}

// ── Pixel event helpers ──

export function firePixelEvent(
  eventType: "AddToCart" | "Purchase" | "InitiateCheckout" | "PageView",
  data?: { value?: number; currency?: string; content_id?: string; content_name?: string }
) {
  const w = window as unknown as Record<string, unknown>;

  // Facebook Pixel
  if (typeof w.fbq === "function") {
    const fbEvent = eventType === "InitiateCheckout" ? "InitiateCheckout" : eventType;
    (w.fbq as (...args: unknown[]) => void)("track", fbEvent, {
      value: data?.value,
      currency: data?.currency || "EUR",
      content_ids: data?.content_id ? [data.content_id] : undefined,
      content_name: data?.content_name,
    });
  }

  // Google Ads
  if (typeof w.gtag === "function") {
    const gtagEvents: Record<string, string> = {
      AddToCart: "add_to_cart",
      Purchase: "purchase",
      InitiateCheckout: "begin_checkout",
      PageView: "page_view",
    };
    (w.gtag as (...args: unknown[]) => void)("event", gtagEvents[eventType] || eventType, {
      value: data?.value,
      currency: data?.currency || "EUR",
      items: data?.content_id ? [{ id: data.content_id, name: data.content_name }] : undefined,
    });
  }

  // TikTok Pixel
  if (typeof w.ttq !== "undefined" && w.ttq) {
    const ttqEvents: Record<string, string> = {
      AddToCart: "AddToCart",
      Purchase: "CompletePayment",
      InitiateCheckout: "InitiateCheckout",
      PageView: "ViewContent",
    };
    (w.ttq as { track: (...args: unknown[]) => void }).track(ttqEvents[eventType] || eventType, {
      value: data?.value,
      currency: data?.currency || "EUR",
      content_id: data?.content_id,
      content_name: data?.content_name,
    });
  }
}
