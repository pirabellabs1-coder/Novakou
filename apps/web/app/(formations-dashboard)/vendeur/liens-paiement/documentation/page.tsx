"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  ShieldCheck,
  Webhook,
  MousePointerClick,
  KeyRound,
  Lock,
  ListChecks,
  FlaskConical,
} from "lucide-react";

/* ─── Bloc de code copiable ─────────────────────────────────────── */
function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative rounded-xl overflow-hidden border border-gray-800 my-3">
      {lang && (
        <div className="flex items-center justify-between bg-[#161b22] px-4 py-1.5 border-b border-gray-800">
          <span className="text-[11px] font-mono text-gray-400">{lang}</span>
        </div>
      )}
      <button
        type="button"
        onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1600); }}
        className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/10 text-gray-300 text-[11px] font-semibold hover:bg-white/20 transition-colors"
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}{copied ? "Copié" : "Copier"}
      </button>
      <pre className="bg-[#0d1117] text-[#e6edf3] text-[12px] leading-relaxed p-4 overflow-x-auto whitespace-pre">{code}</pre>
    </div>
  );
}

function Field({ name, type, desc }: { name: string; type: string; desc: string }) {
  return (
    <tr className="border-b border-gray-100">
      <td className="py-2 pr-4 align-top"><code className="text-[12px] text-[#006e2f] font-semibold">{name}</code></td>
      <td className="py-2 pr-4 align-top text-[12px] text-slate-400 font-mono">{type}</td>
      <td className="py-2 text-[13px] text-[#5c647a]">{desc}</td>
    </tr>
  );
}

const PAYLOAD_JSON = `{
  "event": "payment.succeeded",
  "paymentRef": "sub:abc123:1720800000000:x9f2",
  "linkId": "clx0product123",
  "linkSlug": "coaching-express-l8k2",
  "title": "Coaching express",
  "amount": 15000,
  "currency": "XOF",
  "buyerEmail": "client@example.com",
  "buyerName": "Awa Diop",
  "createdAt": "2026-07-12T10:30:00.000Z"
}`;

const NODE_VERIFY = `import crypto from "crypto";
import express from "express";

const app = express();
const NOVAKOU_SECRET = process.env.NOVAKOU_WEBHOOK_SECRET; // whsec_...

// IMPORTANT : lire le CORPS BRUT (raw) pour vérifier la signature.
app.post("/webhook-novakou", express.raw({ type: "application/json" }), (req, res) => {
  const rawBody = req.body; // Buffer
  const signature = req.headers["x-novakou-signature"];

  const expected = crypto
    .createHmac("sha256", NOVAKOU_SECRET)
    .update(rawBody)
    .digest("hex");

  // Comparaison à temps constant
  const ok =
    signature &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));

  if (!ok) return res.status(401).send("Signature invalide");

  const data = JSON.parse(rawBody.toString());
  if (data.event === "payment.succeeded") {
    // → débloquer l'accès pour data.buyerEmail (idempotent : dédupliquer sur data.paymentRef)
    grantAccess(data.buyerEmail, data.linkId, data.paymentRef);
  }
  res.status(200).send("OK");
});`;

const PHP_VERIFY = `<?php
$secret    = getenv("NOVAKOU_WEBHOOK_SECRET"); // whsec_...
$rawBody   = file_get_contents("php://input");
$signature = $_SERVER["HTTP_X_NOVAKOU_SIGNATURE"] ?? "";

$expected = hash_hmac("sha256", $rawBody, $secret);

if (!hash_equals($expected, $signature)) {
  http_response_code(401);
  exit("Signature invalide");
}

$data = json_decode($rawBody, true);
if (($data["event"] ?? "") === "payment.succeeded") {
  // → débloquer l'accès (idempotent : dédupliquer sur $data["paymentRef"])
  grant_access($data["buyerEmail"], $data["linkId"], $data["paymentRef"]);
}
http_response_code(200);
echo "OK";`;

const PYTHON_VERIFY = `import hmac, hashlib, os
from flask import Flask, request, abort

app = Flask(__name__)
SECRET = os.environ["NOVAKOU_WEBHOOK_SECRET"].encode()  # whsec_...

@app.post("/webhook-novakou")
def webhook():
    raw = request.get_data()  # corps brut
    signature = request.headers.get("X-Novakou-Signature", "")
    expected = hmac.new(SECRET, raw, hashlib.sha256).hexdigest()

    if not hmac.compare_digest(expected, signature):
        abort(401)

    data = request.get_json()
    if data.get("event") == "payment.succeeded":
        # → débloquer l'accès (idempotent : dédupliquer sur data["paymentRef"])
        grant_access(data["buyerEmail"], data["linkId"], data["paymentRef"])
    return "OK", 200`;

export default function PaylinkDocPage() {
  return (
    <div className="p-5 md:p-8 max-w-3xl mx-auto">
      {/* Fil d'Ariane */}
      <Link href="/vendeur/liens-paiement" className="inline-flex items-center gap-1.5 text-sm text-[#5c647a] hover:text-[#006e2f] transition-colors mb-4">
        <ArrowLeft size={15} /> Retour aux liens de paiement
      </Link>

      {/* Titre */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#006e2f] to-[#22c55e] flex items-center justify-center text-white shadow-lg">
          <Webhook size={22} />
        </div>
        <h1 className="text-xl md:text-2xl font-extrabold text-[#111827]">Intégrer un lien de paiement sur votre site</h1>
      </div>
      <p className="text-sm text-[#5c647a] leading-relaxed mb-8">
        Vendez depuis votre propre site ou application : l&apos;acheteur paie via Novakou, puis revient chez
        vous, et votre serveur débloque automatiquement l&apos;accès à ce qu&apos;il a acheté. Deux mécanismes
        complémentaires : la <strong>redirection</strong> (expérience) et le <strong>webhook</strong> (sécurité).
      </p>

      {/* Vue d'ensemble */}
      <section className="rounded-2xl border border-gray-100 bg-slate-50/60 p-5 mb-8">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex gap-3">
            <MousePointerClick size={20} className="text-[#006e2f] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#111827] text-sm">1. Redirection</p>
              <p className="text-[13px] text-[#5c647a] mt-0.5">Après paiement, l&apos;acheteur est renvoyé sur votre page (au lieu de rester sur Novakou).</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Webhook size={20} className="text-[#006e2f] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#111827] text-sm">2. Webhook signé</p>
              <p className="text-[13px] text-[#5c647a] mt-0.5">Votre serveur reçoit une notification signée à chaque vente — la source de vérité pour débloquer l&apos;accès.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Étape 1 */}
      <Section n="1" title="Configurer le lien">
        <p>
          Dans <Link href="/vendeur/liens-paiement" className="text-[#006e2f] font-semibold underline">Liens de paiement</Link> →
          <em> Créer un lien</em>, ouvrez la section <strong>« Intégration sur mon site »</strong> et renseignez :
        </p>
        <ul className="mt-2 space-y-1.5">
          <li className="flex gap-2"><ArrowRight size={15} className="text-[#006e2f] flex-shrink-0 mt-1" /><span><strong>URL de redirection</strong> — la page de votre site où renvoyer l&apos;acheteur après paiement (ex. votre page « Merci / Accès »).</span></li>
          <li className="flex gap-2"><ArrowRight size={15} className="text-[#006e2f] flex-shrink-0 mt-1" /><span><strong>URL de webhook</strong> (en <code>https</code>) — l&apos;URL de votre serveur qui recevra les notifications de vente.</span></li>
        </ul>
        <p className="mt-2">
          Un <strong>secret de signature</strong> (<code>whsec_…</code>) est alors généré et affiché sur votre lien.
          Copiez‑le et gardez‑le côté serveur (variable d&apos;environnement) — il sert à vérifier l&apos;authenticité des webhooks.
        </p>
      </Section>

      {/* Étape 2 — redirection */}
      <Section n="2" title="La redirection après paiement" icon={<MousePointerClick size={18} className="text-[#006e2f]" />}>
        <p>Après un paiement réussi, l&apos;acheteur est renvoyé sur votre URL de redirection avec deux paramètres :</p>
        <CodeBlock lang="Redirection" code={`https://votre-site.com/merci?ref=<référence_de_paiement>&status=success`} />
        <p className="text-[13px] bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-amber-900">
          <strong>Attention :</strong> la redirection est pratique pour l&apos;expérience, mais elle peut être <strong>falsifiée</strong>
          (n&apos;importe qui peut ouvrir cette URL). Ne débloquez <strong>jamais</strong> l&apos;accès sur la seule base de la
          redirection — utilisez le webhook (étape 3) comme source de vérité.
        </p>
      </Section>

      {/* Étape 3 — webhook */}
      <Section n="3" title="Le webhook de vente" icon={<Webhook size={18} className="text-[#006e2f]" />}>
        <p>
          À <strong>chaque vente réelle</strong> de ce lien, Novakou envoie une requête <code>POST</code> à votre URL de
          webhook, avec ces en‑têtes :
        </p>
        <CodeBlock lang="Headers" code={`Content-Type: application/json
X-Novakou-Event: payment.succeeded
X-Novakou-Signature: <signature HMAC-SHA256 en hexadécimal>`} />
        <p className="mt-3">Corps de la requête (JSON) :</p>
        <CodeBlock lang="Payload JSON" code={PAYLOAD_JSON} />
        <div className="overflow-x-auto">
          <table className="w-full text-left mt-2">
            <thead><tr className="border-b border-gray-200"><th className="py-1.5 pr-4 text-[11px] font-bold uppercase tracking-wide text-slate-400">Champ</th><th className="py-1.5 pr-4 text-[11px] font-bold uppercase tracking-wide text-slate-400">Type</th><th className="py-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">Description</th></tr></thead>
            <tbody>
              <Field name="event" type="string" desc="Toujours « payment.succeeded »." />
              <Field name="paymentRef" type="string" desc="Référence unique du paiement — utilisez-la pour dédupliquer (idempotence)." />
              <Field name="linkId" type="string" desc="Identifiant du lien de paiement." />
              <Field name="linkSlug" type="string" desc="Slug du lien (fin de l'URL /payer/…)." />
              <Field name="title" type="string" desc="Titre du lien de paiement." />
              <Field name="amount" type="number" desc="Montant payé (en FCFA, entier)." />
              <Field name="currency" type="string" desc="Devise — « XOF »." />
              <Field name="buyerEmail" type="string|null" desc="E-mail de l'acheteur." />
              <Field name="buyerName" type="string|null" desc="Nom de l'acheteur (si fourni)." />
              <Field name="createdAt" type="string" desc="Date ISO 8601 de la vente." />
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[13px] text-[#5c647a]">
          Votre serveur doit répondre <strong>200</strong> rapidement. Le webhook part une seule fois par vente réelle.
        </p>
      </Section>

      {/* Étape 4 — vérifier la signature */}
      <Section n="4" title="Vérifier la signature" icon={<KeyRound size={18} className="text-[#006e2f]" />}>
        <p>
          Avant de faire confiance à un webhook, vérifiez sa signature : calculez le HMAC‑SHA256 du <strong>corps brut</strong> de
          la requête avec votre <code>whsec_…</code>, et comparez au header <code>X-Novakou-Signature</code>.
        </p>
        <CodeBlock lang="Node.js (Express)" code={NODE_VERIFY} />
        <CodeBlock lang="PHP" code={PHP_VERIFY} />
        <CodeBlock lang="Python (Flask)" code={PYTHON_VERIFY} />
      </Section>

      {/* Étape 5 — débloquer l'accès */}
      <Section n="5" title="Débloquer l'accès (flux recommandé)" icon={<ListChecks size={18} className="text-[#006e2f]" />}>
        <ol className="space-y-2 list-none">
          {[
            "Recevez le webhook et VÉRIFIEZ la signature (rejetez si invalide).",
            "Vérifiez que vous n'avez pas déjà traité ce paymentRef (idempotence — le même webhook pourrait, rarement, arriver deux fois).",
            "Débloquez l'accès pour buyerEmail (créez le compte / l'accès / envoyez le lien de téléchargement).",
            "Répondez 200. La redirection, elle, se contente d'amener l'acheteur sur votre page de confirmation.",
          ].map((t, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#006e2f]/10 text-[#006e2f] font-bold text-xs flex items-center justify-center">{i + 1}</span>
              <span className="text-[14px] text-[#374151] leading-relaxed">{t}</span>
            </li>
          ))}
        </ol>
      </Section>

      {/* Sécurité */}
      <Section n="6" title="Sécurité & bonnes pratiques" icon={<Lock size={18} className="text-[#006e2f]" />}>
        <ul className="space-y-1.5">
          {[
            "Toujours vérifier la signature — ne faites jamais confiance à un webhook non signé/mal signé.",
            "Idempotence : stockez les paymentRef traités et ignorez les doublons.",
            "Gardez votre secret whsec_… côté serveur uniquement (jamais dans du code front / public).",
            "Le webhook doit être en https. Novakou refuse les adresses internes (localhost, réseaux privés).",
            "Ne débloquez pas l'accès depuis la redirection seule — c'est le rôle du webhook.",
          ].map((t, i) => (
            <li key={i} className="flex gap-2"><ShieldCheck size={15} className="text-[#006e2f] flex-shrink-0 mt-1" /><span className="text-[14px] text-[#374151]">{t}</span></li>
          ))}
        </ul>
      </Section>

      {/* Tester */}
      <Section n="7" title="Tester votre intégration" icon={<FlaskConical size={18} className="text-[#006e2f]" />}>
        <p>
          Créez un lien à petit montant avec vos URLs de redirection et de webhook, puis effectuez un paiement réel de test
          (Mobile Money ou carte). Vérifiez que : (1) vous êtes bien renvoyé sur votre page ; (2) votre serveur reçoit le
          <code> POST</code> signé ; (3) la vérification de signature passe ; (4) l&apos;accès est débloqué chez vous.
          La vente apparaît aussi dans vos statistiques Novakou (commission 10 % appliquée comme pour tout produit).
        </p>
      </Section>

      <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-5">
        <Link href="/vendeur/liens-paiement" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#006e2f] hover:underline">
          <ArrowLeft size={15} /> Mes liens de paiement
        </Link>
        <span className="text-[11px] text-slate-400">Besoin d&apos;aide ? support@novakou.com</span>
      </div>
    </div>
  );
}

function Section({ n, title, icon, children }: { n: string; title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="flex items-center gap-2.5 text-lg font-extrabold text-[#111827] mb-3">
        <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-[#006e2f]/10 text-[#006e2f] text-sm font-extrabold flex items-center justify-center">{n}</span>
        {icon}
        {title}
      </h2>
      <div className="text-[14px] text-[#374151] leading-relaxed [&_code]:text-[12.5px] [&_code]:bg-gray-100 [&_code]:text-slate-700 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono">
        {children}
      </div>
    </section>
  );
}
