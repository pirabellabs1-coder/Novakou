"use client";

import React, { useEffect, useRef, useState } from "react";
import Script from "next/script";

// ─── Typage Puter ──────────────────────────────────────────────
type PuterContentBlock = { type?: string; text?: string };
type PuterChatResponse = {
  message: { content: string | PuterContentBlock[] };
};
declare global {
  interface Window {
    puter?: {
      ai: {
        chat: (
          prompt: string,
          options?: { model?: string; temperature?: number; max_tokens?: number; stream?: boolean },
        ) => Promise<PuterChatResponse>;
      };
    };
  }
}
function extractText(res: PuterChatResponse): string {
  const c = res.message?.content;
  if (typeof c === "string") return c;
  if (Array.isArray(c)) {
    return c.map((b) => (b && typeof b.text === "string" ? b.text : "")).join("");
  }
  return "";
}

// ─── Mini Markdown ─────────────────────────────────────────────
function md(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  lines.forEach((line, i) => {
    // Headings
    if (/^###\s/.test(line)) { nodes.push(<h3 key={i} className="text-base font-bold text-[#191c1e] mt-4 mb-2">{line.replace(/^###\s*/, "")}</h3>); return; }
    if (/^##\s/.test(line)) { nodes.push(<h2 key={i} className="text-lg font-extrabold text-[#191c1e] mt-5 mb-2">{line.replace(/^##\s*/, "")}</h2>); return; }
    if (/^#\s/.test(line)) { nodes.push(<h1 key={i} className="text-xl font-extrabold text-[#191c1e] mt-5 mb-3">{line.replace(/^#\s*/, "")}</h1>); return; }
    // List items
    if (/^[\-\*]\s/.test(line)) {
      nodes.push(<li key={i} className="ml-5 list-disc text-sm text-[#191c1e]">{inline(line.replace(/^[\-\*]\s*/, ""), i)}</li>);
      return;
    }
    if (/^\d+\.\s/.test(line)) {
      nodes.push(<li key={i} className="ml-5 list-decimal text-sm text-[#191c1e]">{inline(line.replace(/^\d+\.\s*/, ""), i)}</li>);
      return;
    }
    if (line.trim() === "") { nodes.push(<div key={i} className="h-2" />); return; }
    nodes.push(<p key={i} className="text-sm text-[#191c1e] leading-relaxed">{inline(line, i)}</p>);
  });
  return nodes;
}
function inline(text: string, lineIdx: number): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith("**")) parts.push(<strong key={`${lineIdx}-${m.index}`}>{t.slice(2, -2)}</strong>);
    else if (t.startsWith("`")) parts.push(<code key={`${lineIdx}-${m.index}`} className="px-1 py-0.5 rounded bg-gray-100 text-[12px] font-mono">{t.slice(1, -1)}</code>);
    else if (t.startsWith("*")) parts.push(<em key={`${lineIdx}-${m.index}`}>{t.slice(1, -1)}</em>);
    last = m.index + t.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

// ─── Types ─────────────────────────────────────────────────────
type Tab = "copilot" | "report" | "bug" | "coach";
type ChatMessage = { role: "user" | "assistant"; content: string };
type VendorItem = { id: string; name: string; email: string; totalEarned: number; status: string };

// ─── Helper : call Claude ──────────────────────────────────────
async function claudeChat(prompt: string, options?: { temperature?: number; max_tokens?: number }): Promise<string> {
  if (!window.puter) throw new Error("Puter.js non chargé");
  const res = await window.puter.ai.chat(prompt, {
    model: "claude-sonnet-4-6",
    temperature: options?.temperature ?? 0.3,
    max_tokens: options?.max_tokens ?? 4000,
  });
  return extractText(res);
}

// ─── Page ──────────────────────────────────────────────────────
export default function AIAssistantPage() {
  const [tab, setTab] = useState<Tab>("copilot");
  const [puterReady, setPuterReady] = useState(false);

  useEffect(() => {
    const check = () => {
      if (typeof window !== "undefined" && window.puter) { setPuterReady(true); return true; }
      return false;
    };
    if (!check()) {
      const i = setInterval(() => { if (check()) clearInterval(i); }, 300);
      return () => clearInterval(i);
    }
  }, []);

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto">
      <Script src="https://js.puter.com/v2/" strategy="afterInteractive" />

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
            <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>neurology</span>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">IA Admin Assistant</h1>
            <p className="text-sm text-[#5c647a]">4 outils Claude Sonnet 4.6 pour diagnostiquer, analyser et coacher</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className={`w-1.5 h-1.5 rounded-full ${puterReady ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
          <span className="text-[#5c647a]">{puterReady ? "SDK IA prêt · Claude Sonnet 4.6 via Puter" : "Chargement du SDK IA…"}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-gray-100 mb-6 overflow-x-auto">
        {([
          { id: "copilot", icon: "forum", label: "Copilot (chat)" },
          { id: "report", icon: "summarize", label: "Rapport du jour" },
          { id: "bug", icon: "bug_report", label: "Debug & Erreurs" },
          { id: "coach", icon: "psychology", label: "Coach vendeur" },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 min-w-max px-4 py-2.5 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors ${
              tab === t.id ? "bg-[#191c1e] text-white" : "text-[#5c647a] hover:bg-gray-50"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "copilot" && <CopilotTab puterReady={puterReady} />}
      {tab === "report" && <ReportTab puterReady={puterReady} />}
      {tab === "bug" && <BugTab puterReady={puterReady} />}
      {tab === "coach" && <CoachTab puterReady={puterReady} />}
    </div>
  );
}

// ─── TAB 1 : COPILOT (chat) ────────────────────────────────────
function CopilotTab({ puterReady }: { puterReady: boolean }) {
  const [snapshot, setSnapshot] = useState<Record<string, unknown> | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Bonjour ! Je suis votre copilot Novakou. Je connais les stats en temps réel de la plateforme. Posez-moi n'importe quelle question :\n\n- Combien de vendeurs actifs ?\n- Résumé des ventes aujourd'hui\n- Y a-t-il des retraits en attente ?\n- Quels sont les top vendeurs ce mois ?" },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/formations/admin/ai-snapshot").then(r => r.json()).then(j => setSnapshot(j.data ?? null));
  }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send() {
    if (!input.trim() || sending || !puterReady || !snapshot) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setSending(true);

    const prompt = `Tu es le copilot IA admin de la plateforme Novakou (marketplace de formations et produits digitaux pour l'Afrique francophone).

Ton role : repondre aux questions de l'admin avec les DONNEES reelles de la plateforme. Sois concis, factuel, utilise du Markdown pour la lisibilite.

REGLES :
- Reponds UNIQUEMENT sur la base du snapshot ci-dessous
- Si une info n'est pas dans le snapshot, dis-le clairement
- Formate les montants en FCFA
- Utilise des emojis pour les sections (📊 💰 ⚠️ ✅)
- Sois bref : 2-4 paragraphes max, sauf demande explicite

SNAPSHOT PLATEFORME (temps reel) :
${JSON.stringify(snapshot, null, 2)}

QUESTION ADMIN : ${userMsg}

Reponds maintenant en francais.`;

    try {
      const reply = await claudeChat(prompt, { temperature: 0.2 });
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: `⚠️ Erreur : ${e instanceof Error ? e.message : "inconnue"}` }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 flex flex-col" style={{ height: "calc(100vh - 280px)", minHeight: 500 }}>
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {!snapshot && <div className="text-xs text-[#5c647a]">Chargement du snapshot de la plateforme…</div>}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl ${m.role === "user" ? "bg-[#191c1e] text-white rounded-br-sm whitespace-pre-wrap" : "bg-gray-50 text-[#191c1e] rounded-bl-sm"}`}>
              {m.role === "assistant" ? md(m.content) : m.content}
            </div>
          </div>
        ))}
        {sending && <div className="flex justify-start"><div className="px-4 py-3 rounded-2xl bg-gray-50 text-[#5c647a] text-sm">Claude analyse…</div></div>}
        <div ref={endRef} />
      </div>
      <div className="border-t border-gray-100 p-3 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          placeholder={snapshot ? "Posez votre question…" : "Chargement…"}
          disabled={!snapshot || !puterReady || sending}
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm disabled:bg-gray-50"
        />
        <button
          onClick={send}
          disabled={!input.trim() || sending || !puterReady || !snapshot}
          className="px-4 py-2.5 rounded-xl bg-[#191c1e] text-white text-sm font-bold disabled:opacity-40 inline-flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[16px]">send</span>
          Envoyer
        </button>
      </div>
    </div>
  );
}

// ─── TAB 2 : RAPPORT QUOTIDIEN ─────────────────────────────────
function ReportTab({ puterReady }: { puterReady: boolean }) {
  const [snapshot, setSnapshot] = useState<Record<string, unknown> | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/formations/admin/ai-snapshot").then(r => r.json()).then(j => setSnapshot(j.data ?? null));
  }, []);

  async function generate() {
    if (!snapshot || !puterReady) return;
    setLoading(true);
    setReport(null);

    const prompt = `Tu es l'analyste IA de Novakou (marketplace de formations africaine). Genere un RAPPORT QUOTIDIEN pour l'admin, base uniquement sur les donnees ci-dessous.

Format Markdown attendu :

## 📊 Rapport du [DATE]

### Resume executif
(2-3 phrases : qu'est-ce qui s'est passe aujourd'hui ? bon jour ou non ?)

### 💰 Chiffre d'affaires
- Comparaison aujourd'hui vs hier (tendance)
- Evolution 7j et 30j

### 👥 Croissance
- Nouveaux utilisateurs aujourd'hui
- Nouveaux produits crees
- Vendeurs en attente d'approbation

### ⚠️ Points d'attention
- Retraits en attente (nombre + montant)
- Paiements echoues 7j
- Inquiries non repondues

### 🏆 Top vendeurs
(Liste des 3 meilleurs)

### 🎯 Recommandations (3 actions max pour l'admin aujourd'hui)
1. Action concrete + impact attendu
2. Action concrete + impact attendu
3. Action concrete + impact attendu

DONNEES :
${JSON.stringify(snapshot, null, 2)}

REGLES :
- Chiffres en FCFA formate (ex: 150 000 FCFA)
- Pourcentages pour les variations (ex: +12% vs hier)
- Si aucune donnee : "Aucune activite notable"
- Reponds en francais, ton professionnel mais chaleureux
- Utilise des emojis pour rendre le rapport scannable`;

    try {
      const r = await claudeChat(prompt, { temperature: 0.3, max_tokens: 3000 });
      setReport(r);
    } catch (e) {
      setReport(`⚠️ Erreur : ${e instanceof Error ? e.message : "inconnue"}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (snapshot && puterReady && !report && !loading) {
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot, puterReady]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-[#5c647a]">Rapport généré automatiquement à partir des données temps réel.</p>
        <button
          onClick={generate}
          disabled={loading || !snapshot || !puterReady}
          className="px-4 py-2 rounded-xl bg-[#006e2f] text-white text-xs font-bold disabled:opacity-50 inline-flex items-center gap-2"
        >
          <span className={`material-symbols-outlined text-[16px] ${loading ? "animate-spin" : ""}`}>{loading ? "progress_activity" : "refresh"}</span>
          {loading ? "Génération…" : "Régénérer"}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        {loading && <div className="flex items-center gap-3 text-sm text-[#5c647a]">
          <span className="material-symbols-outlined animate-spin">progress_activity</span>
          Claude analyse les données…
        </div>}
        {!loading && !report && <div className="text-center py-12 text-[#5c647a]">
          <span className="material-symbols-outlined text-5xl text-gray-300">summarize</span>
          <p className="text-sm mt-3">Rapport en cours de génération automatique…</p>
        </div>}
        {report && <div className="space-y-1">{md(report)}</div>}
      </div>

      {snapshot && (
        <details className="bg-gray-50 rounded-xl p-4">
          <summary className="text-xs font-bold text-[#5c647a] cursor-pointer">Voir le snapshot brut (debug)</summary>
          <pre className="text-[10px] text-[#5c647a] mt-2 overflow-x-auto">{JSON.stringify(snapshot, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}

// ─── TAB 3 : BUG ANALYZER ──────────────────────────────────────
function BugTab({ puterReady }: { puterReady: boolean }) {
  const [errorLog, setErrorLog] = useState("");
  const [context, setContext] = useState("");
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function analyze() {
    if (!errorLog.trim() || !puterReady) return;
    setLoading(true);
    setAnalysis(null);

    const prompt = `Tu es un ingenieur Full Stack senior expert en Next.js 14, Prisma, Supabase et React. Tu aides l'admin de Novakou a debugger.

L'admin te donne une ERREUR ou un BUG REPORT. Analyse-le et reponds en Markdown structure :

## 🔍 Diagnostic

**Type d'erreur** : [categorie]
**Severite** : [Critique / Haute / Moyenne / Basse]

## 💡 Cause probable
(2-3 phrases : qu'est-ce qui a cause ca)

## 🔧 Fix suggere
(Code + explication, OU etapes si pas de code)

\`\`\`typescript
// exemple de fix si applicable
\`\`\`

## ⚠️ Points d'attention
- Effets de bord potentiels
- Tests a faire avant de deployer
- Si fix risque, dire ce qu'il faut verifier

## 📚 Explication pour l'admin
(1 paragraphe simple pour comprendre le bug, sans jargon)

CONTEXTE FOURNI PAR L'ADMIN :
${context || "(aucun)"}

ERREUR / BUG :
\`\`\`
${errorLog}
\`\`\`

REGLES STRICTES :
- Reponds en francais
- Ne propose JAMAIS de fix qui toucherait une table DB sans le dire explicitement
- Si tu ne peux pas diagnostiquer sans plus d'info, dis quoi demander
- Ne dis jamais "je ne sais pas" sans alternative — propose au moins une piste`;

    try {
      const r = await claudeChat(prompt, { temperature: 0.2, max_tokens: 3500 });
      setAnalysis(r);
    } catch (e) {
      setAnalysis(`⚠️ Erreur : ${e instanceof Error ? e.message : "inconnue"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="text-base font-bold text-[#191c1e] mb-3">Collez l&apos;erreur ou le bug</h2>

        <label className="block text-xs font-bold text-[#191c1e] mb-1">Contexte (optionnel)</label>
        <input
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Ex: Vendeur sur page /vendeur/retraits, essaie de demander retrait"
          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm mb-3"
        />

        <label className="block text-xs font-bold text-[#191c1e] mb-1">Erreur ou message *</label>
        <textarea
          value={errorLog}
          onChange={(e) => setErrorLog(e.target.value)}
          rows={14}
          placeholder="Collez ici :&#10;- Une stack trace&#10;- Un message d'erreur Vercel&#10;- Un rapport de bug utilisateur&#10;- Un screenshot decrit&#10;- Un comportement inattendu"
          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono mb-3"
        />

        <button
          onClick={analyze}
          disabled={!errorLog.trim() || loading || !puterReady}
          className="w-full py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          {loading ? <>
            <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
            Claude analyse…
          </> : <>
            <span className="material-symbols-outlined text-[16px]">bug_report</span>
            Analyser avec Claude
          </>}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 min-h-[400px]">
        <h2 className="text-base font-bold text-[#191c1e] mb-3">Diagnostic IA</h2>
        {loading && <div className="flex items-center gap-3 text-sm text-[#5c647a]">
          <span className="material-symbols-outlined animate-spin">progress_activity</span>
          Analyse en cours…
        </div>}
        {!loading && !analysis && <div className="text-center py-12 text-[#5c647a]">
          <span className="material-symbols-outlined text-5xl text-gray-300">bug_report</span>
          <p className="text-sm mt-3">Collez une erreur à gauche pour un diagnostic instantané</p>
        </div>}
        {analysis && <div className="space-y-1">{md(analysis)}</div>}
      </div>
    </div>
  );
}

// ─── TAB 4 : VENDOR COACH ──────────────────────────────────────
function CoachTab({ puterReady }: { puterReady: boolean }) {
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<VendorItem | null>(null);
  const [vendorData, setVendorData] = useState<Record<string, unknown> | null>(null);
  const [coaching, setCoaching] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      fetch(`/api/formations/admin/ai-vendor-list${query ? `?q=${encodeURIComponent(query)}` : ""}`)
        .then(r => r.json())
        .then(j => setVendors(j.data ?? []));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  async function loadAndCoach(v: VendorItem) {
    setSelected(v);
    setCoaching(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/formations/admin/ai-vendor/${v.id}`);
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Erreur");
      setVendorData(j.data);
      // Auto-generate coaching
      if (puterReady) {
        const prompt = `Tu es un coach expert en ventes digitales, specialise dans le marche africain francophone. L'admin de Novakou veut comprendre ce vendeur et l'aider a progresser.

Analyse les donnees du vendeur ci-dessous et fournis un rapport Markdown :

## 👤 Profil express
(2 phrases : qui est ce vendeur, depuis quand, statut)

## 📈 Performances (points forts)
- Bullets avec chiffres-cles

## ⚠️ Points d'alerte
(Problemes observes dans les donnees : produits stagnants, peu d'avis, longue inactivite, retraits en attente, etc.)

## 🎯 Plan d'action (3 recos concretes)

### 1. [Titre court]
(Qu'est-ce qui faut faire, pourquoi, impact attendu)

### 2. [Titre court]
...

### 3. [Titre court]
...

## 💬 Message a envoyer au vendeur
(Propose un message court et chaleureux que l'admin pourrait envoyer directement — ton tutoiement, francophone, africain professionnel)

DONNEES VENDEUR :
${JSON.stringify(j.data, null, 2)}

REGLES :
- Reponds en francais
- Montants en FCFA
- Sois honnete : si le vendeur performe mal, dis-le sans l'humilier
- Recos concretes et realistes (pas de "optimisez votre SEO" flou)
- Si le vendeur a 0 ventes, concentre-toi sur le premier achat`;
        const r = await claudeChat(prompt, { temperature: 0.4, max_tokens: 3500 });
        setCoaching(r);
      }
    } catch (e) {
      setCoaching(`⚠️ Erreur : ${e instanceof Error ? e.message : "inconnue"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Vendor list */}
      <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-100 p-4 h-fit">
        <h2 className="text-sm font-bold text-[#191c1e] mb-3">Choisir un vendeur</h2>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nom, email ou slug boutique…"
          className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs mb-3"
        />
        <div className="max-h-[500px] overflow-y-auto space-y-1">
          {vendors.length === 0 && <p className="text-xs text-[#5c647a] py-6 text-center">Aucun vendeur trouvé</p>}
          {vendors.map((v) => (
            <button
              key={v.id}
              onClick={() => loadAndCoach(v)}
              className={`w-full text-left p-3 rounded-xl text-xs border transition-colors ${
                selected?.id === v.id ? "border-[#006e2f] bg-[#006e2f]/5" : "border-transparent hover:bg-gray-50"
              }`}
            >
              <p className="font-bold text-[#191c1e] truncate">{v.name}</p>
              <p className="text-[10px] text-[#5c647a] truncate">{v.email}</p>
              <p className="text-[10px] mt-1">
                <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">
                  {new Intl.NumberFormat("fr-FR").format(Math.round(v.totalEarned))} FCFA
                </span>
                <span className="ml-2 text-[#5c647a]">{v.status}</span>
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Coaching result */}
      <div className="lg:col-span-8 space-y-4">
        {!selected && (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-gray-300">psychology</span>
            <h3 className="text-base font-bold text-[#191c1e] mt-3">Sélectionnez un vendeur</h3>
            <p className="text-sm text-[#5c647a] mt-1">Claude analysera ses stats et vous donnera un plan d&apos;action personnalisé.</p>
          </div>
        )}
        {selected && (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h2 className="text-lg font-extrabold text-[#191c1e]">{selected.name}</h2>
                  <p className="text-xs text-[#5c647a]">{selected.email}</p>
                </div>
                <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                  {new Intl.NumberFormat("fr-FR").format(Math.round(selected.totalEarned))} FCFA
                </span>
              </div>
              {vendorData && typeof vendorData === "object" && "stats" in vendorData && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                  {Object.entries((vendorData as { stats: Record<string, unknown> }).stats).slice(0, 8).map(([k, v]) => (
                    <div key={k} className="bg-gray-50 rounded-xl p-2">
                      <p className="text-[10px] text-[#5c647a] uppercase">{k}</p>
                      <p className="text-sm font-bold text-[#191c1e]">{String(v)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              {loading && <div className="flex items-center gap-3 text-sm text-[#5c647a]">
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                Claude coache ce vendeur…
              </div>}
              {coaching && <div className="space-y-1">{md(coaching)}</div>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
