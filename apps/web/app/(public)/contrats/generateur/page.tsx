"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/store/toast";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type TemplateId = "prestation" | "nda" | "sous-traitance";

interface Template {
  id: TemplateId;
  labelKey: string;
  icon: string;
  descKey: string;
}

type PaymentTerms =
  | "100_livraison"
  | "50_50"
  | "30_40_30"
  | "mensuel";

interface ContractForm {
  template: TemplateId;
  prestataire: {
    nom: string;
    email: string;
    adresse: string;
    siret: string;
  };
  client: {
    nom: string;
    email: string;
    adresse: string;
    societe: string;
  };
  mission: {
    titre: string;
    description: string;
    dateDebut: string;
    dateFin: string;
    montant: string;
    modalites: PaymentTerms;
  };
  clauses: {
    proprieteIntellectuelle: boolean;
    confidentialite: boolean;
    nonConcurrence: boolean;
    penalitesRetard: boolean;
    resiliation: boolean;
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const TEMPLATES: { id: TemplateId; labelKey: string; icon: string; descKey: string }[] = [
  {
    id: "prestation",
    labelKey: "contracts_tpl_prestation",
    icon: "description",
    descKey: "contracts_tpl_prestation_desc",
  },
  {
    id: "nda",
    labelKey: "contracts_tpl_nda",
    icon: "security",
    descKey: "contracts_tpl_nda_desc",
  },
  {
    id: "sous-traitance",
    labelKey: "contracts_tpl_sous_traitance",
    icon: "handshake",
    descKey: "contracts_tpl_sous_traitance_desc",
  },
];

const PAYMENT_OPTIONS: { value: PaymentTerms; labelKey: string }[] = [
  { value: "100_livraison", labelKey: "contracts_pay_100_livraison" },
  { value: "50_50", labelKey: "contracts_pay_50_50" },
  { value: "30_40_30", labelKey: "contracts_pay_30_40_30" },
  { value: "mensuel", labelKey: "contracts_pay_mensuel" },
];

const CLAUSES_META: { key: keyof ContractForm["clauses"]; labelKey: string; icon: string }[] = [
  { key: "proprieteIntellectuelle", labelKey: "contracts_clause_propriete_intellectuelle", icon: "copyright" },
  { key: "confidentialite", labelKey: "contracts_clause_confidentialite", icon: "lock" },
  { key: "nonConcurrence", labelKey: "contracts_clause_non_concurrence", icon: "block" },
  { key: "penalitesRetard", labelKey: "contracts_clause_penalites_retard", icon: "schedule" },
  { key: "resiliation", labelKey: "contracts_clause_resiliation", icon: "cancel" },
];

const INITIAL_FORM: ContractForm = {
  template: "prestation",
  prestataire: { nom: "", email: "", adresse: "", siret: "" },
  client: { nom: "", email: "", adresse: "", societe: "" },
  mission: {
    titre: "",
    description: "",
    dateDebut: "",
    dateFin: "",
    montant: "",
    modalites: "100_livraison",
  },
  clauses: {
    proprieteIntellectuelle: true,
    confidentialite: true,
    nonConcurrence: false,
    penalitesRetard: false,
    resiliation: true,
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getTemplateTitreKey(tpl: TemplateId): string {
  switch (tpl) {
    case "prestation":
      return "contracts_preview_title_prestation";
    case "nda":
      return "contracts_preview_title_nda";
    case "sous-traitance":
      return "contracts_preview_title_sous_traitance";
  }
}

function getPaymentTermsKey(terms: PaymentTerms): string {
  return PAYMENT_OPTIONS.find((o) => o.value === terms)?.labelKey ?? terms;
}

function formatDate(iso: string): string {
  if (!iso) return "___________";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function formatMontant(val: string): string {
  if (!val) return "___________";
  const n = parseFloat(val);
  if (isNaN(n)) return val;
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionHeading({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
        <span className="material-symbols-outlined text-primary text-lg">{icon}</span>
      </div>
      <h3 className="text-base font-bold">{title}</h3>
    </div>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full bg-background-dark border border-border-dark rounded-lg px-3.5 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all";

const textareaClass =
  "w-full bg-background-dark border border-border-dark rounded-lg px-3.5 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none";

// ---------------------------------------------------------------------------
// Signature Modal
// ---------------------------------------------------------------------------
function SignatureModal({
  open,
  onClose,
  prestataireEmail,
  clientEmail,
  t,
}: {
  open: boolean;
  onClose: () => void;
  prestataireEmail: string;
  clientEmail: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: string) => string;
}) {
  const addToast = useToastStore((s) => s.addToast);
  const [emailPrestataire, setEmailPrestataire] = useState(prestataireEmail);
  const [emailClient, setEmailClient] = useState(clientEmail);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Keep emails in sync with form
  useEffect(() => {
    setEmailPrestataire(prestataireEmail);
    setEmailClient(clientEmail);
  }, [prestataireEmail, clientEmail]);

  const handleSend = useCallback(async () => {
    if (!emailPrestataire || !emailClient) {
      addToast("error", t("contracts_error_emails_required"));
      return;
    }
    setSending(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1800));
    setSending(false);
    addToast("success", t("contracts_signature_sent"));
    onClose();
  }, [emailPrestataire, emailClient, addToast, onClose, t]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-neutral-dark border border-border-dark rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">draw</span>
          </div>
          <div>
            <h3 className="text-lg font-bold">{t("contracts_signature_title")}</h3>
            <p className="text-xs text-slate-400">
              {t("contracts_signature_subtitle")}
            </p>
          </div>
        </div>

        {/* Emails */}
        <div className="space-y-4 mb-4">
          <FormField label={t("contracts_prestataire_email")} required>
            <input
              type="email"
              value={emailPrestataire}
              onChange={(e) => setEmailPrestataire(e.target.value)}
              placeholder="prestataire@email.com"
              className={inputClass}
            />
          </FormField>
          <FormField label={t("contracts_client_email")} required>
            <input
              type="email"
              value={emailClient}
              onChange={(e) => setEmailClient(e.target.value)}
              placeholder="client@email.com"
              className={inputClass}
            />
          </FormField>
          <FormField label={t("contracts_custom_message")}>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("contracts_custom_message_placeholder")}
              rows={3}
              className={textareaClass}
            />
          </FormField>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-slate-200 bg-border-dark rounded-lg transition-colors"
          >
            {t("contracts_cancel")}
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-lg transition-all",
              sending
                ? "bg-primary/60 text-white/70 cursor-not-allowed"
                : "bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
            )}
          >
            {sending ? (
              <>
                <span className="material-symbols-outlined animate-spin text-base">
                  progress_activity
                </span>
                {t("contracts_sending")}
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">send</span>
                {t("contracts_send")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Contract Preview
// ---------------------------------------------------------------------------
function ContractPreview({
  form,
  onDownload,
  onSign,
  t,
}: {
  form: ContractForm;
  onDownload: () => void;
  onSign: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: string, values?: Record<string, string>) => string;
}) {
  const today = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const activeClauses = CLAUSES_META.filter((c) => form.clauses[c.key]);

  return (
    <div className="bg-neutral-dark border border-border-dark rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-primary/5 border-b border-border-dark px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">preview</span>
          <h3 className="text-sm font-bold">{t("contracts_preview")}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-border-dark hover:bg-border-dark/80 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            {t("contracts_download_pdf")}
          </button>
          <button
            onClick={onSign}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors shadow shadow-primary/20"
          >
            <span className="material-symbols-outlined text-sm">draw</span>
            {t("contracts_send_signature")}
          </button>
        </div>
      </div>

      {/* Preview Body */}
      <div className="p-6 max-h-[calc(100vh-220px)] overflow-y-auto">
        {/* Logo + brand */}
        <div className="flex items-center gap-2 mb-6">
          <span className="material-symbols-outlined text-primary text-2xl">public</span>
          <span className="text-lg font-extrabold tracking-tight">FreelanceHigh</span>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-lg font-extrabold tracking-wide uppercase text-primary">
            {t(getTemplateTitreKey(form.template))}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t("contracts_generated_on", { date: today })}
          </p>
        </div>

        {/* Separator */}
        <div className="h-px bg-border-dark mb-6" />

        {/* Parties */}
        <div className="mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">
            {t("contracts_article_parties")}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="bg-background-dark rounded-xl p-4 border border-border-dark">
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">{t("contracts_the_prestataire")}</p>
              <p className="font-semibold">{form.prestataire.nom || "\u2014"}</p>
              <p className="text-slate-400 text-xs mt-1">{form.prestataire.email || "\u2014"}</p>
              <p className="text-slate-400 text-xs">{form.prestataire.adresse || "\u2014"}</p>
              {form.prestataire.siret && (
                <p className="text-slate-400 text-xs">{t("contracts_siret_label")} : {form.prestataire.siret}</p>
              )}
            </div>
            <div className="bg-background-dark rounded-xl p-4 border border-border-dark">
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">{t("contracts_the_client")}</p>
              <p className="font-semibold">{form.client.nom || "\u2014"}</p>
              <p className="text-slate-400 text-xs mt-1">{form.client.email || "\u2014"}</p>
              <p className="text-slate-400 text-xs">{form.client.adresse || "\u2014"}</p>
              {form.client.societe && (
                <p className="text-slate-400 text-xs">{t("contracts_societe_label")} : {form.client.societe}</p>
              )}
            </div>
          </div>
        </div>

        {/* Mission */}
        <div className="mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">
            {t("contracts_article_mission")}
          </h4>
          <div className="bg-background-dark rounded-xl p-4 border border-border-dark text-sm space-y-2">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-primary text-base mt-0.5">
                work
              </span>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">{t("contracts_title_label")}</p>
                <p className="font-semibold">{form.mission.titre || "\u2014"}</p>
              </div>
            </div>
            {form.mission.description && (
              <div className="pl-7">
                <p className="text-xs font-bold text-slate-400 uppercase mt-2">{t("contracts_description_label")}</p>
                <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">
                  {form.mission.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Duration & payment */}
        <div className="mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">
            {t("contracts_article_duration")}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="bg-background-dark rounded-xl p-4 border border-border-dark">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary text-base">
                  calendar_today
                </span>
                <p className="text-xs font-bold text-slate-400 uppercase">{t("contracts_duration")}</p>
              </div>
              <p className="text-xs text-slate-300">
                {t("contracts_duration_from_to", { from: formatDate(form.mission.dateDebut), to: formatDate(form.mission.dateFin) })}
              </p>
            </div>
            <div className="bg-background-dark rounded-xl p-4 border border-border-dark">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary text-base">euro</span>
                <p className="text-xs font-bold text-slate-400 uppercase">{t("contracts_remuneration")}</p>
              </div>
              <p className="text-lg font-extrabold text-primary">
                {formatMontant(form.mission.montant)}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {t(getPaymentTermsKey(form.mission.modalites))}
              </p>
            </div>
          </div>
        </div>

        {/* Clauses */}
        {activeClauses.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">
              {t("contracts_article_clauses")}
            </h4>
            <div className="space-y-2">
              {activeClauses.map((clause, idx) => (
                <div
                  key={clause.key}
                  className="flex items-center gap-3 bg-background-dark rounded-xl px-4 py-3 border border-border-dark text-sm"
                >
                  <span className="material-symbols-outlined text-primary text-base">
                    {clause.icon}
                  </span>
                  <span className="text-xs text-slate-300">
                    <span className="font-semibold text-slate-100">
                      {idx + 1}. {t(clause.labelKey)}
                    </span>{" "}
                    {t("contracts_clause_applicable")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Signatures placeholder */}
        <div className="mt-8 pt-6 border-t border-border-dark">
          <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-4">
            {t("contracts_signatures")}
          </h4>
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-8">{t("contracts_the_prestataire")}</p>
              <div className="h-px bg-border-dark mx-4" />
              <p className="text-xs text-slate-400 mt-2">
                {form.prestataire.nom || t("contracts_name_and_signature")}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-8">{t("contracts_the_client")}</p>
              <div className="h-px bg-border-dark mx-4" />
              <p className="text-xs text-slate-400 mt-2">
                {form.client.nom || t("contracts_name_and_signature")}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-border-dark text-center">
          <p className="text-[10px] text-slate-500">
            {t("contracts_disclaimer")}
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function ContractGeneratorPage() {
  const t = useTranslations("legal");
  const addToast = useToastStore((s) => s.addToast);
  const [form, setForm] = useState<ContractForm>(INITIAL_FORM);
  const [signModalOpen, setSignModalOpen] = useState(false);

  // --- Form updaters ---
  const setTemplate = useCallback((id: TemplateId) => {
    setForm((f) => ({ ...f, template: id }));
  }, []);

  const updatePrestataire = useCallback(
    (key: keyof ContractForm["prestataire"], value: string) => {
      setForm((f) => ({ ...f, prestataire: { ...f.prestataire, [key]: value } }));
    },
    []
  );

  const updateClient = useCallback(
    (key: keyof ContractForm["client"], value: string) => {
      setForm((f) => ({ ...f, client: { ...f.client, [key]: value } }));
    },
    []
  );

  const updateMission = useCallback(
    (key: keyof ContractForm["mission"], value: string) => {
      setForm((f) => ({ ...f, mission: { ...f.mission, [key]: value } }));
    },
    []
  );

  const toggleClause = useCallback((key: keyof ContractForm["clauses"]) => {
    setForm((f) => ({
      ...f,
      clauses: { ...f.clauses, [key]: !f.clauses[key] },
    }));
  }, []);

  const handleReset = useCallback(() => {
    setForm(INITIAL_FORM);
    addToast("info", t("contracts_form_reset"));
  }, [addToast, t]);

  const handleGenerate = useCallback(() => {
    // Basic validation
    if (!form.prestataire.nom || !form.client.nom || !form.mission.titre) {
      addToast("error", t("contracts_error_fill_required"));
      return;
    }
    addToast("success", t("contracts_success_generated"));
  }, [form, addToast, t]);

  const handleDownload = useCallback(() => {
    addToast("info", t("contracts_download_in_progress"));
  }, [addToast, t]);

  const handleOpenSign = useCallback(() => {
    setSignModalOpen(true);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <div className="border-b border-border-dark bg-neutral-dark/50">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
            <Link href="/" className="hover:text-primary transition-colors">
              {t("contracts_breadcrumb_home")}
            </Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-slate-200 font-semibold">{t("contracts_breadcrumb_current")}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-2xl">gavel</span>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">{t("contracts_title")}</h1>
              <p className="text-sm text-slate-400 mt-0.5">
                {t("contracts_subtitle")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-column layout */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ========================= LEFT COLUMN — FORM ========================= */}
          <div className="space-y-6">
            {/* 1. Template selection */}
            <div className="bg-neutral-dark border border-border-dark rounded-2xl p-6">
              <SectionHeading icon="article" title={t("contracts_template_section")} />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => setTemplate(tpl.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all",
                      form.template === tpl.id
                        ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                        : "border-border-dark hover:border-primary/40 bg-background-dark"
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                        form.template === tpl.id
                          ? "bg-primary/20 text-primary"
                          : "bg-border-dark text-slate-400"
                      )}
                    >
                      <span className="material-symbols-outlined">{tpl.icon}</span>
                    </div>
                    <span className="text-xs font-bold leading-tight">{t(tpl.labelKey)}</span>
                    <span className="text-[10px] text-slate-500 leading-snug">
                      {t(tpl.descKey)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Parties */}
            <div className="bg-neutral-dark border border-border-dark rounded-2xl p-6">
              <SectionHeading icon="people" title={t("contracts_parties_section")} />

              {/* Prestataire */}
              <div className="mb-5">
                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">person</span>
                  {t("contracts_prestataire")}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label={t("contracts_full_name")} required>
                    <input
                      type="text"
                      value={form.prestataire.nom}
                      onChange={(e) => updatePrestataire("nom", e.target.value)}
                      placeholder="Jean Dupont"
                      className={inputClass}
                    />
                  </FormField>
                  <FormField label={t("contracts_email")} required>
                    <input
                      type="email"
                      value={form.prestataire.email}
                      onChange={(e) => updatePrestataire("email", e.target.value)}
                      placeholder="jean@email.com"
                      className={inputClass}
                    />
                  </FormField>
                  <FormField label={t("contracts_address")}>
                    <input
                      type="text"
                      value={form.prestataire.adresse}
                      onChange={(e) => updatePrestataire("adresse", e.target.value)}
                      placeholder="123 Rue Exemple, Paris"
                      className={inputClass}
                    />
                  </FormField>
                  <FormField label={t("contracts_siret")}>
                    <input
                      type="text"
                      value={form.prestataire.siret}
                      onChange={(e) => updatePrestataire("siret", e.target.value)}
                      placeholder="123 456 789 00012"
                      className={inputClass}
                    />
                  </FormField>
                </div>
              </div>

              {/* Separator */}
              <div className="h-px bg-border-dark my-5" />

              {/* Client */}
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">business</span>
                  {t("contracts_client")}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label={t("contracts_full_name")} required>
                    <input
                      type="text"
                      value={form.client.nom}
                      onChange={(e) => updateClient("nom", e.target.value)}
                      placeholder="Marie Martin"
                      className={inputClass}
                    />
                  </FormField>
                  <FormField label={t("contracts_email")} required>
                    <input
                      type="email"
                      value={form.client.email}
                      onChange={(e) => updateClient("email", e.target.value)}
                      placeholder="marie@entreprise.com"
                      className={inputClass}
                    />
                  </FormField>
                  <FormField label={t("contracts_address")}>
                    <input
                      type="text"
                      value={form.client.adresse}
                      onChange={(e) => updateClient("adresse", e.target.value)}
                      placeholder="456 Avenue Exemple, Lyon"
                      className={inputClass}
                    />
                  </FormField>
                  <FormField label={t("contracts_company")}>
                    <input
                      type="text"
                      value={form.client.societe}
                      onChange={(e) => updateClient("societe", e.target.value)}
                      placeholder={t("contracts_placeholder_company")}
                      className={inputClass}
                    />
                  </FormField>
                </div>
              </div>
            </div>

            {/* 3. Mission details */}
            <div className="bg-neutral-dark border border-border-dark rounded-2xl p-6">
              <SectionHeading icon="assignment" title={t("contracts_details_section")} />
              <div className="space-y-4">
                <FormField label={t("contracts_mission_title")} required>
                  <input
                    type="text"
                    value={form.mission.titre}
                    onChange={(e) => updateMission("titre", e.target.value)}
                    placeholder={t("contracts_placeholder_mission_title")}
                    className={inputClass}
                  />
                </FormField>
                <FormField label={t("contracts_detailed_description")}>
                  <textarea
                    value={form.mission.description}
                    onChange={(e) => updateMission("description", e.target.value)}
                    placeholder={t("contracts_placeholder_description")}
                    rows={5}
                    className={textareaClass}
                  />
                </FormField>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label={t("contracts_start_date")}>
                    <input
                      type="date"
                      value={form.mission.dateDebut}
                      onChange={(e) => updateMission("dateDebut", e.target.value)}
                      className={inputClass}
                    />
                  </FormField>
                  <FormField label={t("contracts_end_date")}>
                    <input
                      type="date"
                      value={form.mission.dateFin}
                      onChange={(e) => updateMission("dateFin", e.target.value)}
                      className={inputClass}
                    />
                  </FormField>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label={t("contracts_total_amount")} required>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">
                        &euro;
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.mission.montant}
                        onChange={(e) => updateMission("montant", e.target.value)}
                        placeholder="0.00"
                        className={cn(inputClass, "pl-8")}
                      />
                    </div>
                  </FormField>
                  <FormField label={t("contracts_payment_terms")}>
                    <select
                      value={form.mission.modalites}
                      onChange={(e) =>
                        updateMission("modalites", e.target.value as PaymentTerms)
                      }
                      className={inputClass}
                    >
                      {PAYMENT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {t(opt.labelKey)}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>
              </div>
            </div>

            {/* 4. Clauses */}
            <div className="bg-neutral-dark border border-border-dark rounded-2xl p-6">
              <SectionHeading icon="policy" title={t("contracts_clauses_section")} />
              <div className="space-y-2">
                {CLAUSES_META.map((clause) => (
                  <label
                    key={clause.key}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all",
                      form.clauses[clause.key]
                        ? "border-primary/40 bg-primary/5"
                        : "border-border-dark bg-background-dark hover:border-border-dark/80"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={form.clauses[clause.key]}
                      onChange={() => toggleClause(clause.key)}
                      className="sr-only"
                    />
                    <div
                      className={cn(
                        "w-5 h-5 rounded flex items-center justify-center border transition-all shrink-0",
                        form.clauses[clause.key]
                          ? "bg-primary border-primary"
                          : "border-slate-500 bg-transparent"
                      )}
                    >
                      {form.clauses[clause.key] && (
                        <span className="material-symbols-outlined text-white text-sm">
                          check
                        </span>
                      )}
                    </div>
                    <span
                      className={cn(
                        "material-symbols-outlined text-base",
                        form.clauses[clause.key] ? "text-primary" : "text-slate-500"
                      )}
                    >
                      {clause.icon}
                    </span>
                    <span className="text-sm font-semibold">{t(clause.labelKey)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 5. Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleGenerate}
                className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl px-6 py-3.5 text-sm font-bold shadow-lg shadow-primary/20 transition-all"
              >
                <span className="material-symbols-outlined text-base">auto_awesome</span>
                {t("contracts_generate")}
              </button>
              <button
                onClick={handleReset}
                className="flex items-center justify-center gap-2 bg-border-dark hover:bg-border-dark/80 rounded-xl px-6 py-3.5 text-sm font-semibold text-slate-400 hover:text-slate-200 transition-all"
              >
                <span className="material-symbols-outlined text-base">restart_alt</span>
                {t("contracts_reset")}
              </button>
            </div>
          </div>

          {/* ========================= RIGHT COLUMN — PREVIEW ========================= */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ContractPreview
              form={form}
              onDownload={handleDownload}
              onSign={handleOpenSign}
              t={t}
            />
          </div>
        </div>
      </div>

      {/* Signature Modal */}
      <SignatureModal
        open={signModalOpen}
        onClose={() => setSignModalOpen(false)}
        prestataireEmail={form.prestataire.email}
        clientEmail={form.client.email}
        t={t}
      />
    </div>
  );
}
