"use client";

import { useState, useEffect } from "react";
import { useMarketingAffiliate } from "@/lib/formations/hooks";
import Link from "next/link";
import {
  Users, Settings, ToggleLeft, ToggleRight, Clock, Link2,
  CheckCircle, XCircle, Pause, Play, TrendingUp, MousePointerClick,
  DollarSign, UserPlus, Shield, Loader2, Copy, Check,
  ChevronDown, ChevronUp, AlertCircle,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface AffiliateProfileSummary {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  affiliateCode: string;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  totalClicks: number;
  totalConversions: number;
  totalEarned: number;
  pendingEarnings: number;
  joinedAt: string;
}

interface AffiliateProgram {
  id: string;
  instructeurId: string;
  name: string;
  commissionPercent: number;
  cookieDays: number;
  isActive: boolean;
  minPayoutAmount: number;
  autoApprove: boolean;
  applyToAll: boolean;
  formationIds: string[];
  productIds: string[];
  totalAffiliates: number;
  totalClicks: number;
  totalConversions: number;
  totalPaidOut: number;
  affiliates: AffiliateProfileSummary[];
  createdAt: string;
  updatedAt: string;
}

const COOKIE_DAYS_OPTIONS = [7, 14, 30, 60, 90];

// ── Main Page ────────────────────────────────────────────────────────────────

export default function AffiliateManagementPage() {
  const { data: queryData, isLoading: loading, error: queryError } = useMarketingAffiliate();

  const [program, setProgram] = useState<AffiliateProgram | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Editable settings state
  const [commissionPercent, setCommissionPercent] = useState(25);
  const [cookieDays, setCookieDays] = useState(30);
  const [autoApprove, setAutoApprove] = useState(true);
  const [applyToAll, setApplyToAll] = useState(true);
  const [isActive, setIsActive] = useState(true);

  // Seed program and editable settings from query data on first load
  const [seeded, setSeeded] = useState(false);
  useEffect(() => {
    if (!seeded && queryData && !loading) {
      const d = queryData as { programs?: AffiliateProgram[] };
      if (d.programs && d.programs.length > 0) {
        const p = d.programs[0];
        setProgram(p);
        setCommissionPercent(p.commissionPercent);
        setCookieDays(p.cookieDays);
        setAutoApprove(p.autoApprove);
        setApplyToAll(p.applyToAll);
        setIsActive(p.isActive);
      }
      setSeeded(true);
    }
  }, [queryData, loading, seeded]);

  // Surface query error if present
  useEffect(() => {
    if (queryError && !error) setError("Erreur lors du chargement du programme");
  }, [queryError, error]);

  // ── Save settings ────────────────────────────────────────────────────────

  async function saveSettings() {
    setSaving(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/marketing/affiliate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commissionPercent,
          cookieDays,
          autoApprove,
          applyToAll,
          isActive,
        }),
      });
      const data = await res.json();
      if (data.success && data.program) {
        setProgram(data.program);
        setSuccessMsg("Parametres sauvegardes avec succes");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch {
      setError("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  // ── Toggle program active ────────────────────────────────────────────────

  async function toggleActive() {
    const newActive = !isActive;
    setIsActive(newActive);
    setSaving(true);
    try {
      const res = await fetch("/api/marketing/affiliate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newActive }),
      });
      const data = await res.json();
      if (data.success && data.program) {
        setProgram(data.program);
        setSuccessMsg(newActive ? "Programme active" : "Programme desactive");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch {
      setIsActive(!newActive);
      setError("Erreur lors du changement de statut");
    } finally {
      setSaving(false);
    }
  }

  // ── Affiliate actions ────────────────────────────────────────────────────

  async function handleAffiliateAction(affiliateId: string, action: "approve" | "reject" | "suspend" | "reactivate") {
    try {
      const res = await fetch("/api/marketing/affiliate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, affiliateId }),
      });
      const data = await res.json();
      if (data.success && data.program) {
        setProgram(data.program);
        const messages: Record<string, string> = {
          approve: "Affilie approuve",
          reject: "Affilie refuse",
          suspend: "Affilie suspendu",
          reactivate: "Affilie reactive",
        };
        setSuccessMsg(messages[action] || "Action effectuee");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch {
      setError("Erreur lors de l'action");
    }
  }

  // ── Copy link ────────────────────────────────────────────────────────────

  function copyProgramLink() {
    const link = `${window.location.origin}/formations?aff_program=${program?.id || "default"}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  // ── Loading state ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
      </div>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────────

  if (!program) {
    return (
      <div className="text-center py-16">
        <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-600 dark:text-slate-300">Programme d&apos;affiliation</h2>
        <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
          Creez un programme d&apos;affiliation pour permettre a d&apos;autres utilisateurs de promouvoir vos formations et produits en echange d&apos;une commission.
        </p>
        <button
          onClick={() => {
            setIsActive(true);
            saveSettings();
          }}
          className="mt-6 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
        >
          Creer le programme
        </button>
      </div>
    );
  }

  const pendingAffiliates = program.affiliates.filter((a) => a.status === "PENDING");
  const activeAffiliates = program.affiliates.filter((a) => a.status === "ACTIVE");
  const suspendedAffiliates = program.affiliates.filter((a) => a.status === "SUSPENDED");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Programme d&apos;affiliation</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gerez vos affilies et suivez les performances
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/formations/instructeur/marketing/affilies/tableau-de-bord"
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-800 transition-colors"
          >
            Mon tableau affilie
          </Link>
          <button
            onClick={toggleActive}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              isActive
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            {isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
            {isActive ? "Actif" : "Desactive"}
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          icon={<Users className="w-5 h-5" />}
          label="Affilies"
          value={program.totalAffiliates}
          color="text-violet-600 bg-violet-50 dark:bg-violet-900/20"
        />
        <KpiCard
          icon={<MousePointerClick className="w-5 h-5" />}
          label="Clics totaux"
          value={program.totalClicks}
          color="text-blue-600 bg-blue-50 dark:bg-blue-900/20"
        />
        <KpiCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Conversions"
          value={program.totalConversions}
          color="text-green-600 bg-green-50 dark:bg-green-900/20"
        />
        <KpiCard
          icon={<DollarSign className="w-5 h-5" />}
          label="Total verse"
          value={`${program.totalPaidOut.toFixed(0)}€`}
          color="text-amber-600 bg-amber-50 dark:bg-amber-900/20"
        />
      </div>

      {/* Share link + Settings toggle */}
      <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold">Lien d&apos;inscription affilie</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Partagez ce lien pour recruter de nouveaux affilies
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <code className="text-xs bg-slate-100 dark:bg-slate-800 dark:bg-slate-700 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 max-w-[280px] truncate">
              {typeof window !== "undefined" ? `${window.location.origin}/formations?aff_program=${program.id}` : "..."}
            </code>
            <button
              onClick={copyProgramLink}
              className="p-2 rounded-lg hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
              title="Copier le lien"
            >
              {copiedLink ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-slate-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* Settings Panel (collapsible) */}
      <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-full flex items-center justify-between p-5 text-left"
        >
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-sm font-bold">Parametres du programme</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Commission: {commissionPercent}% | Cookie: {cookieDays}j | {autoApprove ? "Auto-approbation" : "Approbation manuelle"}
              </p>
            </div>
          </div>
          {showSettings ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>

        {showSettings && (
          <div className="px-5 pb-5 border-t border-slate-200 dark:border-slate-700 pt-5 space-y-6">
            {/* Commission slider */}
            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                Commission par vente
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={5}
                  max={50}
                  step={1}
                  value={commissionPercent}
                  onChange={(e) => setCommissionPercent(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <span className="text-lg font-bold text-primary w-14 text-right">{commissionPercent}%</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                L&apos;affilie recevra {commissionPercent}% du montant de chaque vente generee
              </p>
            </div>

            {/* Cookie duration */}
            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                Duree du cookie de suivi
              </label>
              <div className="flex flex-wrap gap-2">
                {COOKIE_DAYS_OPTIONS.map((days) => (
                  <button
                    key={days}
                    onClick={() => setCookieDays(days)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      cookieDays === days
                        ? "bg-primary text-white"
                        : "bg-slate-100 dark:bg-slate-800 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                    }`}
                  >
                    {days} jours
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Si un visiteur achete dans les {cookieDays} jours apres avoir clique, la commission est attribuee
              </p>
            </div>

            {/* Auto-approve */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Approbation automatique</p>
                <p className="text-xs text-slate-400">Les nouveaux affilies sont automatiquement approuves</p>
              </div>
              <button
                onClick={() => setAutoApprove(!autoApprove)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  autoApprove
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                }`}
              >
                {autoApprove ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                {autoApprove ? "Active" : "Desactive"}
              </button>
            </div>

            {/* Scope */}
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Portee du programme</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setApplyToAll(true)}
                  className={`flex-1 px-4 py-3 rounded-xl border text-sm font-semibold transition-colors ${
                    applyToAll
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary/30"
                  }`}
                >
                  <Shield className="w-5 h-5 mx-auto mb-1" />
                  Tous les produits
                </button>
                <button
                  onClick={() => setApplyToAll(false)}
                  className={`flex-1 px-4 py-3 rounded-xl border text-sm font-semibold transition-colors ${
                    !applyToAll
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary/30"
                  }`}
                >
                  <Settings className="w-5 h-5 mx-auto mb-1" />
                  Selection specifique
                </button>
              </div>
            </div>

            {/* Save button */}
            <div className="flex justify-end">
              <button
                onClick={saveSettings}
                disabled={saving}
                className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Sauvegarder
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pending Affiliates */}
      {pendingAffiliates.length > 0 && (
        <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-amber-200 dark:border-amber-800/50 p-5">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-amber-500" />
            Demandes en attente ({pendingAffiliates.length})
          </h3>
          <div className="space-y-3">
            {pendingAffiliates.map((aff) => (
              <div
                key={aff.id}
                className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/10 rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-400 text-sm font-bold">
                    {aff.userName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{aff.userName}</p>
                    <p className="text-xs text-slate-400">
                      Demande le {new Date(aff.joinedAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAffiliateAction(aff.id, "approve")}
                    className="p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 transition-colors"
                    title="Approuver"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleAffiliateAction(aff.id, "reject")}
                    className="p-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 transition-colors"
                    title="Refuser"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Affiliates Table */}
      <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          Affilies actifs ({activeAffiliates.length})
        </h3>

        {activeAffiliates.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">
            Aucun affilie actif pour le moment. Partagez votre lien d&apos;inscription pour recruter.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-2 px-2 font-semibold text-slate-500 text-xs uppercase">Affilie</th>
                  <th className="text-left py-2 px-2 font-semibold text-slate-500 text-xs uppercase">Code</th>
                  <th className="text-right py-2 px-2 font-semibold text-slate-500 text-xs uppercase">Clics</th>
                  <th className="text-right py-2 px-2 font-semibold text-slate-500 text-xs uppercase">Conv.</th>
                  <th className="text-right py-2 px-2 font-semibold text-slate-500 text-xs uppercase">Gagne</th>
                  <th className="text-right py-2 px-2 font-semibold text-slate-500 text-xs uppercase">En attente</th>
                  <th className="text-center py-2 px-2 font-semibold text-slate-500 text-xs uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeAffiliates.map((aff) => (
                  <tr key={aff.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-700/30">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                          {aff.userName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{aff.userName}</p>
                          <p className="text-xs text-slate-400">
                            Depuis {new Date(aff.joinedAt).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <code className="text-xs bg-slate-100 dark:bg-slate-800 dark:bg-slate-700 px-2 py-0.5 rounded">
                        {aff.affiliateCode}
                      </code>
                    </td>
                    <td className="py-3 px-2 text-right font-semibold">{aff.totalClicks.toLocaleString()}</td>
                    <td className="py-3 px-2 text-right font-semibold">{aff.totalConversions}</td>
                    <td className="py-3 px-2 text-right font-semibold text-green-600">{aff.totalEarned.toFixed(0)}€</td>
                    <td className="py-3 px-2 text-right font-semibold text-amber-600">{aff.pendingEarnings.toFixed(0)}€</td>
                    <td className="py-3 px-2 text-center">
                      <button
                        onClick={() => handleAffiliateAction(aff.id, "suspend")}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors"
                        title="Suspendre"
                      >
                        <Pause className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Suspended Affiliates */}
      {suspendedAffiliates.length > 0 && (
        <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-slate-400">
            <Pause className="w-4 h-4" />
            Suspendus ({suspendedAffiliates.length})
          </h3>
          <div className="space-y-2">
            {suspendedAffiliates.map((aff) => (
              <div
                key={aff.id}
                className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-700/30 rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-slate-500 text-xs font-bold">
                    {aff.userName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-500">{aff.userName}</p>
                    <p className="text-xs text-slate-400">{aff.affiliateCode}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleAffiliateAction(aff.id, "reactivate")}
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  <Play className="w-3 h-3" />
                  Reactiver
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${color} mb-2`}>
        {icon}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
