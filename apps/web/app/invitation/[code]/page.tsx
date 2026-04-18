"use client";

/**
 * Page /invitation/[code]
 * Appelée par le lien email. Affiche les détails de l'invitation et permet d'accepter.
 *
 * Cas gérés :
 *   - Invitation invalide/expirée → message d'erreur
 *   - User non connecté → CTA vers /connexion?next=/invitation/[code]
 *   - User connecté avec mauvais email → warning + CTA vers /connexion
 *   - User connecté avec bon email → bouton "Accepter" → redirect /vendeur/choisir-boutique
 */

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface InviteData {
  id: string;
  email: string;
  role: "OWNER" | "MANAGER" | "EDITOR";
  shop: { id: string; name: string; slug: string; logoUrl: string | null };
  inviterName: string;
  expiresAt: string;
}

const ROLE_LABEL = { OWNER: "Propriétaire", MANAGER: "Manager", EDITOR: "Éditeur" };
const ROLE_DESC: Record<string, string> = {
  MANAGER: "Vous pourrez inviter d'autres membres, gérer les produits, voir les statistiques de la boutique. Vous ne pourrez pas effectuer de retraits.",
  EDITOR: "Vous pourrez créer et modifier les produits, et voir les statistiques. Vous ne pourrez pas inviter de membres ni faire de retraits.",
};

export default function InvitationAcceptPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InviteData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expectedEmail, setExpectedEmail] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/invitation/${code}`);
        const j = await res.json();
        if (!res.ok) {
          setError(j.error ?? "Invitation invalide");
        } else {
          setData(j.data);
        }
      } catch {
        setError("Impossible de charger l'invitation");
      } finally {
        setLoading(false);
      }
    })();
  }, [code]);

  async function accept() {
    setAccepting(true);
    try {
      const res = await fetch(`/api/invitation/${code}`, { method: "POST" });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error ?? "Échec de l'acceptation");
        if (j.expectedEmail) setExpectedEmail(j.expectedEmail);
        return;
      }
      // Redirect vers l'espace vendeur pour choisir la boutique
      router.push("/vendeur/choisir-boutique");
      router.refresh();
    } catch {
      setError("Erreur réseau");
    } finally {
      setAccepting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white p-5">
        <div className="animate-pulse text-sm text-[#5c647a]">Chargement de l&apos;invitation…</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-white p-5">
        <div className="max-w-md bg-white rounded-2xl border border-gray-100 shadow-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-[32px]">block</span>
          </div>
          <h1 className="text-xl font-extrabold text-[#191c1e] mb-2">Invitation invalide</h1>
          <p className="text-sm text-[#5c647a] mb-6">{error}</p>
          <Link href="/" className="inline-block px-5 py-2.5 rounded-xl bg-[#006e2f] text-white text-sm font-bold">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const loggedIn = sessionStatus === "authenticated";
  const currentEmail = (session?.user?.email ?? "").toLowerCase();
  const inviteEmail = data.email.toLowerCase();
  const emailMatches = loggedIn && currentEmail === inviteEmail;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-50 p-5">
      <div className="max-w-lg w-full bg-white rounded-3xl border border-gray-100 shadow-2xl overflow-hidden">
        {/* Hero */}
        <div className="bg-gradient-to-br from-[#006e2f] to-[#22c55e] p-8 text-white text-center">
          {data.shop.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.shop.logoUrl} alt={data.shop.name} className="w-20 h-20 mx-auto rounded-2xl object-cover border-4 border-white shadow-xl mb-4" />
          ) : (
            <div className="w-20 h-20 mx-auto rounded-2xl bg-white/20 border-4 border-white shadow-xl flex items-center justify-center text-3xl font-extrabold mb-4">
              {data.shop.name[0]?.toUpperCase()}
            </div>
          )}
          <p className="text-[11px] uppercase tracking-widest opacity-80 mb-1">Invitation</p>
          <h1 className="text-2xl md:text-3xl font-extrabold">{data.shop.name}</h1>
        </div>

        {/* Body */}
        <div className="p-8 space-y-5">
          <p className="text-sm text-[#5c647a] text-center">
            <strong className="text-[#191c1e]">{data.inviterName}</strong> vous invite à rejoindre cette boutique en tant que{" "}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              {ROLE_LABEL[data.role]}
            </span>
          </p>

          {ROLE_DESC[data.role] && (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-[#5c647a] leading-relaxed">{ROLE_DESC[data.role]}</p>
            </div>
          )}

          <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-xl p-3">
            <p className="text-[11px] text-amber-900 leading-relaxed">
              <strong>Bon à savoir :</strong> vous gardez votre propre compte Novakou. Rien n&apos;est créé à votre place. Vous pourrez continuer à créer vos propres boutiques en parallèle.
            </p>
          </div>

          {/* État action */}
          {!loggedIn && (
            <div className="space-y-3">
              <p className="text-xs text-center text-[#5c647a]">
                Connectez-vous ou créez un compte avec <strong>{data.email}</strong> pour accepter.
              </p>
              <div className="flex gap-2">
                <Link
                  href={`/connexion?next=${encodeURIComponent(`/invitation/${code}`)}`}
                  className="flex-1 px-5 py-3 rounded-xl bg-[#006e2f] text-white text-sm font-bold text-center"
                >
                  Me connecter
                </Link>
                <Link
                  href={`/inscription?email=${encodeURIComponent(data.email)}&next=${encodeURIComponent(`/invitation/${code}`)}`}
                  className="flex-1 px-5 py-3 rounded-xl bg-gray-100 text-[#191c1e] text-sm font-bold text-center"
                >
                  Créer un compte
                </Link>
              </div>
            </div>
          )}

          {loggedIn && !emailMatches && (
            <div className="space-y-3">
              <div className="bg-rose-50 border-l-4 border-rose-400 rounded-r-xl p-3">
                <p className="text-xs text-rose-900">
                  Vous êtes connecté avec <strong>{session?.user?.email}</strong>, mais cette invitation est pour{" "}
                  <strong>{data.email}</strong>. Déconnectez-vous et reconnectez-vous avec le bon compte.
                </p>
              </div>
              <Link
                href={`/api/auth/signout?callbackUrl=${encodeURIComponent(`/invitation/${code}`)}`}
                className="block w-full px-5 py-3 rounded-xl bg-[#006e2f] text-white text-sm font-bold text-center"
              >
                Se déconnecter
              </Link>
            </div>
          )}

          {loggedIn && emailMatches && !error && (
            <button
              onClick={accept}
              disabled={accepting}
              className="w-full px-5 py-3 rounded-xl text-white text-sm font-bold shadow-lg disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
            >
              {accepting ? "Acceptation…" : "Accepter l'invitation"}
            </button>
          )}

          {error && loggedIn && (
            <div className="bg-rose-50 border-l-4 border-rose-400 rounded-r-xl p-3">
              <p className="text-xs text-rose-900">{error}</p>
              {expectedEmail && (
                <p className="text-[11px] text-rose-700 mt-1">Email attendu : <strong>{expectedEmail}</strong></p>
              )}
            </div>
          )}

          <p className="text-[10px] text-[#5c647a] text-center pt-2">
            Expire le {new Date(data.expiresAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>
    </div>
  );
}
