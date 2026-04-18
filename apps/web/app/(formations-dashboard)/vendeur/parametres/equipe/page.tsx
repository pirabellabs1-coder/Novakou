"use client";

/**
 * Page /vendeur/parametres/equipe
 * Gestion des collaborateurs d'une boutique :
 *   - Propriétaire (OWNER) visible en haut (non retirable)
 *   - Liste des membres + rôle
 *   - Liste des invitations en attente
 *   - Bouton "Inviter" → modal avec email + rôle
 *   - Bouton "Retirer" sur chaque membre/invitation
 *
 * Permissions :
 *   - OWNER : tout (inviter MANAGER/EDITOR, retirer tout le monde)
 *   - MANAGER : inviter EDITOR uniquement, retirer EDITOR uniquement
 *   - EDITOR : lecture seule
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useToastStore } from "@/store/toast";
import { confirmAction } from "@/store/confirm";

type Role = "OWNER" | "MANAGER" | "EDITOR";

interface Member {
  id: string;
  userId: string;
  email: string;
  name: string | null;
  image: string | null;
  role: Role;
  createdAt: string;
}
interface Invitation {
  id: string;
  email: string;
  role: Role;
  expiresAt: string;
  createdAt: string;
}
interface ShopInfo {
  id: string;
  name: string;
  slug: string;
}

const ROLE_LABEL: Record<Role, string> = {
  OWNER: "Propriétaire",
  MANAGER: "Manager",
  EDITOR: "Éditeur",
};

const ROLE_DESC: Record<Role, string> = {
  OWNER: "Accès total — peut effectuer les retraits",
  MANAGER: "Gère l'équipe et les produits — pas de retrait",
  EDITOR: "Gère les produits uniquement — pas d'invitation ni retrait",
};

const ROLE_COLOR: Record<Role, string> = {
  OWNER: "bg-emerald-100 text-emerald-800 border-emerald-200",
  MANAGER: "bg-blue-100 text-blue-800 border-blue-200",
  EDITOR: "bg-zinc-100 text-zinc-800 border-zinc-200",
};

export default function VendorTeamPage() {
  const toast = useToastStore.getState().addToast;
  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<ShopInfo | null>(null);
  const [myRole, setMyRole] = useState<Role | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"MANAGER" | "EDITOR">("EDITOR");
  const [inviting, setInviting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/formations/vendeur/team");
      const j = await res.json();
      if (!res.ok) {
        toast("error", j.error ?? "Chargement impossible");
        return;
      }
      setShop(j.data.shop);
      setMyRole(j.data.myRole);
      setMembers(j.data.members);
      setInvitations(j.data.invitations);
    } catch {
      toast("error", "Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendInvite() {
    if (!inviteEmail.trim()) {
      toast("warning", "Email requis");
      return;
    }
    setInviting(true);
    try {
      const res = await fetch("/api/formations/vendeur/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const j = await res.json();
      if (!res.ok) {
        toast("error", j.error ?? "Échec de l'invitation");
        return;
      }
      toast("success", `Invitation envoyée à ${inviteEmail}`);
      setInviteEmail("");
      setInviteRole("EDITOR");
      setShowInvite(false);
      load();
    } catch {
      toast("error", "Erreur réseau");
    } finally {
      setInviting(false);
    }
  }

  async function removeItem(id: string, label: string) {
    const ok = await confirmAction({
      title: `Retirer ${label} ?`,
      message: `Cette personne perdra immédiatement l'accès à la boutique. Ses éventuels produits déjà publiés restent en place.`,
      confirmLabel: "Retirer",
      cancelLabel: "Annuler",
      confirmVariant: "danger",
      icon: "person_remove",
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/formations/vendeur/team/${id}`, { method: "DELETE" });
      const j = await res.json();
      if (!res.ok) {
        toast("error", j.error ?? "Échec");
        return;
      }
      toast("success", "Retiré");
      load();
    } catch {
      toast("error", "Erreur réseau");
    }
  }

  const canInvite = myRole === "OWNER" || myRole === "MANAGER";
  const canInviteManager = myRole === "OWNER";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] p-8">
        <div className="max-w-4xl mx-auto space-y-4 animate-pulse">
          <div className="h-8 w-64 bg-zinc-200 rounded" />
          <div className="h-32 bg-white rounded-2xl border border-gray-100" />
          <div className="h-32 bg-white rounded-2xl border border-gray-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb] p-5 md:p-8" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          href="/vendeur/parametres"
          className="text-sm font-semibold text-[#5c647a] hover:text-[#191c1e] inline-flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Paramètres
        </Link>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#006e2f] mb-1">
            Collaborateurs
          </p>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">
            Équipe de la boutique
          </h1>
          <p className="text-sm text-[#5c647a] mt-2">
            {shop ? <>Invitez des collaborateurs sur <span className="font-bold">{shop.name}</span>. Les personnes invitées gardent leur propre compte Novakou et peuvent être membres de plusieurs boutiques.</> : null}
          </p>
        </div>

        {/* CTA Inviter */}
        {canInvite && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowInvite(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold shadow-md shadow-emerald-500/20"
              style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Inviter un collaborateur
            </button>
            {!canInviteManager && (
              <p className="text-xs text-[#5c647a]">
                Vous pouvez inviter des Éditeurs uniquement (seul le propriétaire peut créer un Manager).
              </p>
            )}
          </div>
        )}

        {/* Modale invitation */}
        {showInvite && (
          <div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => !inviting && setShowInvite(false)}
          >
            <div
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-extrabold text-[#191c1e] mb-1">Inviter un collaborateur</h2>
              <p className="text-xs text-[#5c647a] mb-5">
                Un email sera envoyé avec un lien sécurisé. Le lien expire dans 14 jours.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#5c647a] mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="collaborateur@exemple.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#006e2f]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#5c647a] mb-1.5">
                    Rôle
                  </label>
                  <div className="space-y-2">
                    <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${inviteRole === "EDITOR" ? "border-[#006e2f] bg-emerald-50" : "border-gray-200 hover:bg-gray-50"}`}>
                      <input
                        type="radio"
                        checked={inviteRole === "EDITOR"}
                        onChange={() => setInviteRole("EDITOR")}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="text-sm font-bold text-[#191c1e]">Éditeur</p>
                        <p className="text-xs text-[#5c647a]">Gère les produits uniquement (création, édition, publication). Ne peut pas inviter ni retirer.</p>
                      </div>
                    </label>
                    {canInviteManager && (
                      <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${inviteRole === "MANAGER" ? "border-[#006e2f] bg-emerald-50" : "border-gray-200 hover:bg-gray-50"}`}>
                        <input
                          type="radio"
                          checked={inviteRole === "MANAGER"}
                          onChange={() => setInviteRole("MANAGER")}
                          className="mt-0.5"
                        />
                        <div>
                          <p className="text-sm font-bold text-[#191c1e]">Manager</p>
                          <p className="text-xs text-[#5c647a]">Gère l&apos;équipe et les produits. Peut inviter des Éditeurs. Ne peut pas retirer.</p>
                        </div>
                      </label>
                    )}
                  </div>
                </div>

                <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded">
                  <p className="text-[11px] text-amber-900">
                    <strong>Important :</strong> aucun rôle ne peut effectuer de retrait. Seul le propriétaire de la boutique peut retirer les fonds.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowInvite(false)}
                  disabled={inviting}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-sm font-semibold"
                >
                  Annuler
                </button>
                <button
                  onClick={sendInvite}
                  disabled={inviting || !inviteEmail.trim()}
                  className="px-5 py-2 rounded-xl text-white text-sm font-bold disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
                >
                  {inviting ? "Envoi…" : "Envoyer l'invitation"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Membres */}
        <section className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-extrabold text-[#191c1e]">Membres ({members.length})</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {members.map((m) => (
              <div key={m.id} className="px-6 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center flex-shrink-0">
                  {m.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.image} alt={m.name ?? ""} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    (m.name?.[0] ?? m.email[0]).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#191c1e] truncate">{m.name ?? m.email}</p>
                  <p className="text-xs text-[#5c647a] truncate">{m.email}</p>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${ROLE_COLOR[m.role]}`}>
                  {ROLE_LABEL[m.role]}
                </span>
                {m.role !== "OWNER" && canInvite && (
                  <button
                    onClick={() => removeItem(m.id, m.name ?? m.email)}
                    className="p-2 rounded-lg hover:bg-red-50 text-[#5c647a] hover:text-red-600 transition-colors"
                    title="Retirer"
                  >
                    <span className="material-symbols-outlined text-[18px]">person_remove</span>
                  </button>
                )}
              </div>
            ))}
            {members.length === 0 && (
              <p className="px-6 py-8 text-center text-sm text-[#5c647a]">Aucun membre pour l&apos;instant.</p>
            )}
          </div>
        </section>

        {/* Invitations en attente */}
        {invitations.length > 0 && (
          <section className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-extrabold text-[#191c1e]">
                Invitations en attente ({invitations.length})
              </h2>
              <p className="text-xs text-[#5c647a] mt-0.5">
                Ces personnes n&apos;ont pas encore accepté leur invitation. Elles ont reçu un email.
              </p>
            </div>
            <div className="divide-y divide-gray-100">
              {invitations.map((i) => (
                <div key={i.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[20px]">mail</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#191c1e] truncate">{i.email}</p>
                    <p className="text-xs text-[#5c647a]">
                      Envoyée le {new Date(i.createdAt).toLocaleDateString("fr-FR")} · Expire le {new Date(i.expiresAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${ROLE_COLOR[i.role]}`}>
                    {ROLE_LABEL[i.role]}
                  </span>
                  {canInvite && (
                    <button
                      onClick={() => removeItem(i.id, i.email)}
                      className="p-2 rounded-lg hover:bg-red-50 text-[#5c647a] hover:text-red-600 transition-colors"
                      title="Annuler l'invitation"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Info bas de page */}
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-[#5c647a]">Récapitulatif des rôles</p>
          {(["OWNER", "MANAGER", "EDITOR"] as Role[]).map((r) => (
            <div key={r} className="flex items-start gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border mt-0.5 ${ROLE_COLOR[r]}`}>
                {ROLE_LABEL[r]}
              </span>
              <p className="text-xs text-[#5c647a] flex-1">{ROLE_DESC[r]}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
