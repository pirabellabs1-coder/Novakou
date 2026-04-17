/**
 * Novakou — Dark Mode Email Layout
 * Layout et helpers HTML pour les emails en theme sombre.
 */

import { getAppUrl } from "@/lib/email";

// ── Layout principal dark mode ──

export function emailLayoutDark(content: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#030712;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#0B1120;border-radius:12px;overflow:hidden;margin-top:40px;margin-bottom:40px;border:1px solid #1E293B;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#6C2BD9,#8B5CF6);padding:32px 40px;text-align:center;">
      <h1 style="color:#ffffff;font-size:24px;font-weight:800;margin:0;">Novakou</h1>
      <p style="color:rgba(255,255,255,0.8);font-size:12px;margin:4px 0 0;letter-spacing:1px;">LA PLATEFORME FREELANCE</p>
    </div>
    <!-- Content -->
    <div style="padding:40px;">
      ${content}
    </div>
    <!-- Footer -->
    <div style="padding:24px 40px;background:#0F172A;border-top:1px solid #1E293B;text-align:center;">
      <p style="color:#94A3B8;font-size:12px;margin:0 0 8px;">L'equipe Novakou</p>
      <p style="color:#475569;font-size:11px;margin:0;">
        <a href="${getAppUrl()}/cgu" style="color:#8B5CF6;text-decoration:none;">CGU</a> ·
        <a href="${getAppUrl()}/confidentialite" style="color:#8B5CF6;text-decoration:none;">Confidentialite</a> ·
        <a href="${getAppUrl()}/contact" style="color:#8B5CF6;text-decoration:none;">Contact</a>
      </p>
      <p style="color:#334155;font-size:10px;margin:12px 0 0;">© 2026 Novakou — Fondee par Lissanon Gildas</p>
    </div>
  </div>
</body>
</html>`;
}

// ── Bouton CTA ──

type ButtonColor = "primary" | "green" | "blue" | "red" | "amber";

const BUTTON_COLORS: Record<ButtonColor, string> = {
  primary: "#6C2BD9",
  green: "#10B981",
  blue: "#0EA5E9",
  red: "#EF4444",
  amber: "#F59E0B",
};

export function buttonDark(text: string, url: string, color: ButtonColor = "primary"): string {
  const bg = BUTTON_COLORS[color];
  return `<a href="${url}" style="display:inline-block;background:${bg};color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;margin:16px 0;">${text}</a>`;
}

// ── Card container ──

export function cardDark(content: string): string {
  return `<div style="background:#111827;border:1px solid #1E293B;border-radius:8px;padding:20px;margin:0 0 24px;">${content}</div>`;
}

// ── Info block (left-border highlight) ──

export function infoDark(content: string, borderColor: string = "#6C2BD9"): string {
  return `<div style="background:#111827;border-left:4px solid ${borderColor};padding:16px 20px;margin:0 0 24px;border-radius:0 8px 8px 0;"><p style="color:#CBD5E1;margin:0;line-height:1.6;">${content}</p></div>`;
}

// ── Amount display (large centered) ──

export function amountDark(amount: string, label?: string, positive: boolean = true): string {
  const color = positive ? "#10B981" : "#EF4444";
  const prefix = positive ? "+" : "";
  return `
    <div style="background:#111827;border:1px solid #1E293B;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
      <p style="color:${color};font-size:32px;font-weight:800;margin:0;">${prefix}${amount}</p>
      ${label ? `<p style="color:#64748B;font-size:14px;margin:4px 0 0;">${label}</p>` : ""}
    </div>`;
}

// ── Table row helper ──

export function tableRowDark(label: string, value: string, highlight: boolean = false): string {
  const valueStyle = highlight
    ? "color:#8B5CF6;font-weight:700;text-align:right;font-size:16px;"
    : "color:#E5E7EB;font-weight:600;text-align:right;font-size:14px;";
  return `<tr><td style="color:#94A3B8;padding:6px 0;font-size:14px;">${label}</td><td style="${valueStyle}">${value}</td></tr>`;
}

// ── Table wrapper ──

export function tableDark(rows: string): string {
  return cardDark(`<table style="width:100%;border-collapse:collapse;">${rows}</table>`);
}

// ── Heading ──

export function headingDark(text: string): string {
  return `<h2 style="color:#F1F5F9;font-size:22px;margin:0 0 16px;">${text}</h2>`;
}

// ── Paragraph ──

export function textDark(text: string): string {
  return `<p style="color:#CBD5E1;line-height:1.6;margin:0 0 16px;">${text}</p>`;
}

// ── Muted text ──

export function mutedDark(text: string): string {
  return `<p style="color:#64748B;font-size:13px;margin:16px 0 0;">${text}</p>`;
}

// ── Error/rejection box ──

export function errorBoxDark(label: string, message: string): string {
  return `
    <div style="background:#1C1917;border:1px solid #7F1D1D;border-radius:8px;padding:16px;margin:0 0 24px;">
      <p style="color:#EF4444;font-weight:600;margin:0 0 4px;">${label}</p>
      <p style="color:#FCA5A5;margin:0;">${message}</p>
    </div>`;
}

// ── Success box ──

export function successBoxDark(text: string): string {
  return `
    <div style="background:#052E16;border:1px solid #166534;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px;">
      <p style="color:#10B981;font-size:18px;font-weight:700;margin:0;">${text}</p>
    </div>`;
}
