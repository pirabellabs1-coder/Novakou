"use client";

/**
 * Pixels & tracking — espace vendeur. Design system « Stitch ».
 *
 * La liste des évènements affichée ici doit rester le reflet EXACT de ce que le
 * code envoie (components/formations/PixelInjector : PageView, ViewContent,
 * InitiateCheckout, Purchase). La version précédente promettait « ajout au
 * panier », « inscription », « leçon commencée » et « cours terminé » : aucun de
 * ces évènements n'était envoyé, et le vendeur cherchait en vain dans son
 * gestionnaire de publicités.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastStore } from "@/store/toast";
import { confirmAction } from "@/store/confirm";
import { safeFetch } from "@/lib/safe-fetch";
import {
  type LucideIcon,
  Facebook,
  Chrome,
  Music,
  Ghost,
  MapPin,
  Info,
  Pencil,
  Trash2,
  PlusCircle,
  Eye,
  FileSearch,
  CreditCard,
  BadgeCheck,
  ShieldCheck,
} from "lucide-react";
import { ST, StCard, StPageHeader, StChip, StButton, StSectionTitle } from "@/components/stitch";
import { StErreur, StRetourMarketing } from "@/components/formations/dashboard/MarketingKit";

type TypePixel = "FACEBOOK" | "GOOGLE" | "TIKTOK" | "SNAPCHAT" | "PINTEREST";

type Pixel = {
  id: string;
  type: TypePixel;
  pixelId: string;
  isActive: boolean;
  createdAt: string;
  hasAccessToken?: boolean;
};

const AIDE_CAPI: Partial<Record<TypePixel, string>> = {
  FACEBOOK:
    "Gestionnaire d'évènements Meta → votre pixel → Paramètres → « API de conversions » → Générer un token d'accès.",
  TIKTOK: "TikTok Events Manager → votre pixel → Settings → « Events API » → Generate Access Token.",
};

const PIXELS: Record<TypePixel, { label: string; icon: LucideIcon; fond: string; couleur: string; exemple: string; desc: string }> = {
  FACEBOOK: {
    label: "Facebook / Meta",
    icon: Facebook,
    fond: ST.blueSoft,
    couleur: ST.blueText,
    exemple: "123456789012345",
    desc: "Suivez les ventes venues de Facebook et Instagram, et créez des audiences similaires.",
  },
  GOOGLE: {
    label: "Google Analytics / Tag Manager",
    icon: Chrome,
    fond: "#fdecec",
    couleur: "#b03030",
    exemple: "G-XXXXXXXXXX ou GTM-XXXXXXX",
    desc: "Mesurez vos conversions Google Ads et votre audience dans Analytics 4.",
  },
  TIKTOK: {
    label: "TikTok",
    icon: Music,
    fond: "#f1f1f1",
    couleur: "#141414",
    exemple: "CXXXXXXXXXXXXXXXXX",
    desc: "Optimisez vos campagnes TikTok sur les achats réels, pas sur les clics.",
  },
  SNAPCHAT: {
    label: "Snapchat",
    icon: Ghost,
    fond: ST.amberSoft,
    couleur: ST.amberText,
    exemple: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    desc: "Suivez les conversions Snapchat Ads et constituez vos audiences.",
  },
  PINTEREST: {
    label: "Pinterest",
    icon: MapPin,
    fond: ST.roseSoft,
    couleur: ST.roseText,
    exemple: "2612xxxxxxxxx",
    desc: "Mesurez les achats venus de vos épingles.",
  },
};

const ORDRE: TypePixel[] = ["FACEBOOK", "GOOGLE", "TIKTOK", "SNAPCHAT", "PINTEREST"];

/**
 * Mêmes formats que la validation serveur (route pixels). Utilisés ici pour
 * alerter sur un identifiant DEJÀ enregistré qui ne peut pas fonctionner : un
 * vendeur avait saisi son adresse email, la page affichait « Connecté » et sa
 * régie ne recevait rien.
 */
const FORMATS: Record<TypePixel, RegExp> = {
  FACEBOOK: /^\d{10,20}$/,
  GOOGLE: /^(G-[A-Z0-9]{6,12}|GTM-[A-Z0-9]{5,10}|AW-\d{6,15}|UA-\d{4,12}-\d{1,4})$/i,
  TIKTOK: /^[A-Z0-9]{15,30}$/i,
  SNAPCHAT: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  PINTEREST: /^\d{10,16}$/,
};

/** Ce que le site envoie réellement, page par page. */
const EVENEMENTS: { icon: LucideIcon; nom: string; quand: string }[] = [
  { icon: Eye, nom: "PageView", quand: "Toute page publique portant vos pixels" },
  { icon: FileSearch, nom: "ViewContent", quand: "Fiche formation, fiche produit, lien de paiement" },
  { icon: CreditCard, nom: "InitiateCheckout", quand: "Entrée dans le paiement" },
  { icon: BadgeCheck, nom: "Purchase", quand: "Paiement confirmé, avec le montant en FCFA" },
];

export default function PixelsPage() {
  const qc = useQueryClient();
  const [enEdition, setEnEdition] = useState<TypePixel | null>(null);
  const [identifiants, setIdentifiants] = useState<Record<string, string>>({});
  const [tokens, setTokens] = useState<Record<string, string>>({});

  const { data: reponse, isLoading, isError, refetch } = useQuery<{ data: Pixel[] }>({
    queryKey: ["vendeur-pixels"],
    queryFn: async () => {
      const { data, error } = await safeFetch<{ data: Pixel[] }>("/api/formations/vendeur/marketing/pixels");
      if (error || !data) throw new Error(error ?? "Chargement impossible");
      return data;
    },
    staleTime: 60_000,
  });

  const pixels = reponse?.data ?? [];
  const parType = Object.fromEntries(pixels.map((p) => [p.type, p])) as Partial<Record<TypePixel, Pixel>>;

  const enregistrement = useMutation({
    mutationFn: async (corps: { type: TypePixel; pixelId: string; accessToken?: string }) => {
      const { error } = await safeFetch("/api/formations/vendeur/marketing/pixels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corps),
      });
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendeur-pixels"] });
      qc.invalidateQueries({ queryKey: ["vendeur-marketing-hub"] });
      useToastStore.getState().addToast("success", "Pixel enregistré.");
      setEnEdition(null);
    },
    onError: (e: Error) => useToastStore.getState().addToast("error", e.message),
  });

  const suppression = useMutation({
    mutationFn: async (type: TypePixel) => {
      const { error } = await safeFetch(`/api/formations/vendeur/marketing/pixels?type=${type}`, { method: "DELETE" });
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendeur-pixels"] });
      qc.invalidateQueries({ queryKey: ["vendeur-marketing-hub"] });
      useToastStore.getState().addToast("success", "Pixel supprimé.");
    },
    onError: (e: Error) => useToastStore.getState().addToast("error", e.message),
  });

  // On ne compte comme « connectée » qu'une régie dont l'identifiant peut
  // réellement fonctionner : annoncer « 2 régies connectées » alors que les deux
  // identifiants sont invalides, c'est exactement le piège qu'on corrige ici.
  const nbValides = pixels.filter((p) => FORMATS[p.type]?.test(p.pixelId.trim())).length;
  const nbInvalides = pixels.length - nbValides;

  return (
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[900px] mx-auto">
        <StRetourMarketing />

        <StPageHeader
          title="Pixels & tracking"
          subtitle={
            isLoading
              ? "Chargement…"
              : pixels.length === 0
                ? "Aucune régie connectée pour l'instant."
                : `${nbValides} régie${nbValides > 1 ? "s" : ""} connectée${nbValides > 1 ? "s" : ""} à vos ventes` +
                  (nbInvalides > 0
                    ? ` · ${nbInvalides} identifiant${nbInvalides > 1 ? "s" : ""} à corriger.`
                    : ".")
          }
        />

        <StCard className="mb-4 !p-4">
          <div className="flex items-start gap-3">
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[11px]"
              style={{ background: ST.blueSoft, color: ST.blueText }}
            >
              <Info size={18} />
            </div>
            <div>
              <p className="text-[13px] font-extrabold" style={{ color: ST.text }}>
                Collez l&apos;identifiant, nous posons le pixel
              </p>
              <p className="mt-0.5 text-[12px] font-semibold leading-relaxed" style={{ color: ST.textSecondary }}>
                Le pixel se charge sur vos pages publiques (fiches, boutique, tunnels, paiement) et remonte les
                évènements ci-dessous dans votre gestionnaire de publicités. Rien à installer.
              </p>
            </div>
          </div>
        </StCard>

        {isError ? (
          <StErreur onRetry={() => refetch()} />
        ) : (
          <div className="space-y-3.5">
            {ORDRE.map((type) => {
              const cfg = PIXELS[type];
              const Icone = cfg.icon;
              const existant = parType[type];
              const edition = enEdition === type;
              const capi = type === "FACEBOOK" || type === "TIKTOK";
              const identifiantValide = existant ? FORMATS[type].test(existant.pixelId.trim()) : true;

              return (
                <StCard key={type}>
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[13px]"
                      style={{ background: cfg.fond, color: cfg.couleur }}
                    >
                      <Icone size={21} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <h3 className="text-[14px] font-extrabold" style={{ color: ST.text }}>
                          {cfg.label}
                        </h3>
                        {isLoading ? (
                          <span className="h-4 w-20 animate-pulse rounded" style={{ background: "#eef2ef" }} />
                        ) : existant ? (
                          identifiantValide ? (
                            <StChip tone="green">Connecté</StChip>
                          ) : (
                            <StChip tone="rose">Identifiant invalide</StChip>
                          )
                        ) : (
                          <StChip tone="neutral">Non connecté</StChip>
                        )}
                      </div>
                      <p className="text-[12px] font-semibold leading-snug" style={{ color: ST.textSecondary }}>
                        {cfg.desc}
                      </p>

                      {existant && !identifiantValide && !edition && (
                        <p
                          className="mt-2 rounded-[10px] p-2.5 text-[11.5px] font-semibold"
                          style={{ background: ST.roseSoft, color: ST.roseText }}
                        >
                          Cet identifiant n&apos;a pas la forme attendue ({cfg.exemple}) : la régie l&apos;ignore et
                          aucune conversion ne remonte. Corrigez-le pour que le suivi reparte.
                        </p>
                      )}

                      {existant && !edition && (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <code
                            className="min-w-0 flex-1 basis-full truncate rounded-[10px] px-2.5 py-1.5 text-[12px] font-semibold tabular-nums sm:basis-auto"
                            style={{ background: "#f4f7f5", color: ST.text }}
                          >
                            {existant.pixelId}
                          </code>
                          {capi && existant.hasAccessToken && (
                            <StChip tone="blue" icon={ShieldCheck}>
                              API Conversion
                            </StChip>
                          )}
                          <div className="ml-auto flex items-center gap-1">
                            <button
                              type="button"
                              aria-label={`Modifier le pixel ${cfg.label}`}
                              onClick={() => {
                                setEnEdition(type);
                                setIdentifiants((p) => ({ ...p, [type]: existant.pixelId }));
                                setTokens((p) => ({ ...p, [type]: "" }));
                              }}
                              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-black/[.05]"
                              style={{ color: ST.textSecondary }}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              aria-label={`Supprimer le pixel ${cfg.label}`}
                              onClick={async () => {
                                const ok = await confirmAction({
                                  title: `Supprimer le pixel ${cfg.label} ?`,
                                  message: "Le suivi des conversions s'arrêtera immédiatement pour cette régie.",
                                  confirmLabel: "Supprimer",
                                  confirmVariant: "danger",
                                  icon: "delete",
                                });
                                if (ok) suppression.mutate(type);
                              }}
                              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[#fceef2]"
                              style={{ color: ST.textSecondary }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )}

                      {edition && (
                        <div className="mt-3 space-y-2.5">
                          <div>
                            <label
                              htmlFor={`pixel-${type}`}
                              className="mb-[6px] block text-[11.5px] font-extrabold"
                              style={{ color: ST.textLabel }}
                            >
                              Identifiant du pixel
                            </label>
                            <input
                              id={`pixel-${type}`}
                              type="text"
                              value={identifiants[type] ?? ""}
                              onChange={(e) => setIdentifiants((p) => ({ ...p, [type]: e.target.value }))}
                              placeholder={cfg.exemple}
                              className="w-full rounded-[12px] bg-white px-[14px] py-[10px] text-[13px] font-semibold tabular-nums focus:outline-none"
                              style={{ color: ST.text, border: "1px solid #dde6e0" }}
                            />
                          </div>

                          {capi && (
                            <div>
                              <label
                                htmlFor={`token-${type}`}
                                className="mb-[6px] block text-[11.5px] font-extrabold"
                                style={{ color: ST.textLabel }}
                              >
                                Token API de Conversion (facultatif)
                              </label>
                              <input
                                id={`token-${type}`}
                                type="password"
                                autoComplete="off"
                                value={tokens[type] ?? ""}
                                onChange={(e) => setTokens((p) => ({ ...p, [type]: e.target.value }))}
                                placeholder="Token d'accès"
                                className="w-full rounded-[12px] bg-white px-[14px] py-[10px] text-[13px] font-semibold focus:outline-none"
                                style={{ color: ST.text, border: "1px solid #dde6e0" }}
                              />
                              <p className="mt-1 text-[11px] font-semibold leading-snug" style={{ color: ST.textSecondary }}>
                                Remonte les achats de serveur à serveur : fiable, insensible aux bloqueurs de publicité
                                et à iOS. {AIDE_CAPI[type]}{" "}
                                {existant?.hasAccessToken && (
                                  <span className="font-extrabold" style={{ color: ST.blueText }}>
                                    Déjà configuré — laissez vide pour le conserver.
                                  </span>
                                )}
                              </p>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <StButton
                              size="sm"
                              disabled={!identifiants[type]?.trim() || enregistrement.isPending}
                              onClick={() =>
                                enregistrement.mutate({
                                  type,
                                  pixelId: identifiants[type] ?? "",
                                  accessToken: capi && tokens[type]?.trim() ? tokens[type].trim() : undefined,
                                })
                              }
                            >
                              {enregistrement.isPending ? "Enregistrement…" : "Enregistrer"}
                            </StButton>
                            <StButton size="sm" variant="secondary" onClick={() => setEnEdition(null)}>
                              Annuler
                            </StButton>
                          </div>
                        </div>
                      )}

                      {!existant && !edition && !isLoading && (
                        <button
                          type="button"
                          onClick={() => {
                            setEnEdition(type);
                            setIdentifiants((p) => ({ ...p, [type]: "" }));
                          }}
                          className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-extrabold hover:underline"
                          style={{ color: ST.green }}
                        >
                          <PlusCircle size={15} />
                          Connecter {cfg.label}
                        </button>
                      )}
                    </div>
                  </div>
                </StCard>
              );
            })}
          </div>
        )}

        <StCard className="mt-4">
          <StSectionTitle>Évènements envoyés automatiquement</StSectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {EVENEMENTS.map((e) => {
              const Icone = e.icon;
              return (
                <div
                  key={e.nom}
                  className="flex items-start gap-2.5 rounded-[12px] px-3 py-2.5"
                  style={{ background: "#f4f7f5", border: `1px solid ${ST.divider}` }}
                >
                  <Icone size={16} className="mt-0.5 flex-shrink-0" style={{ color: ST.green }} />
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-extrabold" style={{ color: ST.text }}>
                      {e.nom}
                    </p>
                    <p className="text-[11px] font-semibold leading-snug" style={{ color: ST.textSecondary }}>
                      {e.quand}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[11.5px] font-semibold" style={{ color: ST.textSecondary }}>
            Ce sont les quatre évènements standards dont les régies ont besoin pour optimiser vos campagnes sur les
            ventes réelles. Vérifiez-les avec l&apos;outil « Évènements de test » de votre régie.
          </p>
        </StCard>
      </main>
    </div>
  );
}
