"use client";

/**
 * Rend un bloc de données structurées JSON-LD de façon fiable.
 *
 * Pourquoi un composant client : dans une page 100 % « composant serveur »
 * (pur RSC, sans frontière client), un `<script type="application/ld+json">`
 * inline peut être omis du HTML rendu. Encapsulé dans ce composant client, le
 * script est rendu de manière fiable (SSR + DOM), sans exécuter de JS
 * supplémentaire.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
