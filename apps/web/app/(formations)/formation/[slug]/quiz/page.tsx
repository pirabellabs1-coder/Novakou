"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

interface Choice { label: string }
interface Question { id: string; question: string; choices: Choice[] }
interface QuizConfig {
  id: string;
  title: string;
  description: string | null;
  passPct: number;
  questions: Question[];
}

interface Result {
  scorePct: number;
  correct: number;
  total: number;
  passed: boolean;
  threshold: number;
}

export default function FormationQuizPage(
  props: { params: Promise<{ slug: string }> }
) {
  const { slug } = use(props.params);
  const [formationId, setFormationId] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<QuizConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Resolve formation.id from slug
        const res = await fetch(`/api/formations/public/${slug}`);
        const j = await res.json();
        if (!cancelled && j.data?.id) {
          setFormationId(j.data.id);
          const qRes = await fetch(`/api/formations/quiz/${j.data.id}`);
          const qJson = await qRes.json();
          if (!cancelled) setQuiz(qJson.data);
        }
      } catch {
        if (!cancelled) setError("Impossible de charger le quiz.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  async function submit() {
    if (!quiz || !formationId) return;
    if (quiz.questions.some((q) => answers[q.id] === undefined)) {
      setError("Répondez à toutes les questions avant de valider.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const payload = quiz.questions.map((q) => ({ questionId: q.id, choiceIndex: answers[q.id] }));
      const res = await fetch(`/api/formations/quiz/${formationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: payload }),
      });
      const j = await res.json();
      if (!res.ok) { setError(j.error || "Erreur"); return; }
      setResult(j.data);
    } finally { setSubmitting(false); }
  }

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <span className="material-symbols-outlined text-3xl text-slate-400 animate-spin">progress_activity</span>
    </div>;
  }
  if (!quiz) {
    return <div className="min-h-screen flex items-center justify-center p-10 text-center">
      <div>
        <p className="text-lg font-bold text-slate-900 mb-2">Pas de quiz pour cette formation</p>
        <Link href={`/formation/${slug}`} className="text-sm text-emerald-700 hover:underline">Retour</Link>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      <div className="max-w-2xl mx-auto px-5">
        <Link href={`/formation/${slug}`} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 mb-4">
          <span className="material-symbols-outlined text-[14px]">arrow_back</span>
          Retour à la formation
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">{quiz.title}</h1>
          {quiz.description && <p className="text-sm text-slate-500 mt-1.5">{quiz.description}</p>}
          <p className="text-xs text-slate-400 mt-3">
            <strong>{quiz.questions.length}</strong> questions · Seuil de validation : <strong>{quiz.passPct}%</strong>
          </p>

          {result ? (
            <div className={`mt-6 p-6 rounded-2xl ${result.passed ? "bg-emerald-50 border border-emerald-200" : "bg-amber-50 border border-amber-200"}`}>
              <div className="flex items-center gap-3 mb-3">
                <span className={`material-symbols-outlined text-3xl ${result.passed ? "text-emerald-600" : "text-amber-600"}`}>
                  {result.passed ? "military_tech" : "emoji_events"}
                </span>
                <div>
                  <p className="text-lg font-extrabold text-slate-900">
                    {result.passed ? "Bravo, c'est validé !" : "Pas tout à fait…"}
                  </p>
                  <p className="text-xs text-slate-600">
                    Score : <strong className="tabular-nums">{result.scorePct}%</strong> ({result.correct}/{result.total} bonnes réponses)
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {result.passed && (
                  <Link
                    href={`/apprenant/mes-formations`}
                    className="px-4 py-2 rounded-xl text-white text-sm font-bold"
                    style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
                  >
                    Voir mon certificat
                  </Link>
                )}
                {!result.passed && (
                  <button
                    onClick={() => { setResult(null); setAnswers({}); }}
                    className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-bold"
                  >
                    Réessayer
                  </button>
                )}
                <Link
                  href={`/formation/${slug}`}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold"
                >
                  Retour au cours
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-6 space-y-5">
                {quiz.questions.map((q, idx) => (
                  <div key={q.id} className="border border-slate-100 rounded-xl p-4">
                    <p className="text-sm font-bold text-slate-900 mb-3">
                      <span className="text-emerald-700 mr-2">Q{idx + 1}.</span>
                      {q.question}
                    </p>
                    <div className="space-y-1.5">
                      {q.choices.map((c, i) => {
                        const selected = answers[q.id] === i;
                        return (
                          <label
                            key={i}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                              selected ? "bg-emerald-50 border border-emerald-300" : "bg-white border border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            <input
                              type="radio"
                              name={q.id}
                              checked={selected}
                              onChange={() => setAnswers((p) => ({ ...p, [q.id]: i }))}
                              className="w-4 h-4 accent-emerald-600"
                            />
                            <span className="text-sm text-slate-700">{c.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <p className="text-xs text-rose-600 font-medium mt-3">{error}</p>
              )}

              <button
                onClick={submit}
                disabled={submitting}
                className="mt-6 w-full px-5 py-3 rounded-xl text-white text-sm font-bold disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
              >
                {submitting ? "Correction…" : "Valider mes réponses"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
