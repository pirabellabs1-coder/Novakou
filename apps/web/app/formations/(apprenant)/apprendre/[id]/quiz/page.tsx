"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle, XCircle, Clock, ArrowRight, Trophy, RotateCcw, ChevronRight,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────

interface Question {
  id: string;
  textFr: string;
  textEn: string;
  type: "CHOIX_UNIQUE" | "CHOIX_MULTIPLE" | "VRAI_FAUX" | "TEXTE_LIBRE";
  options: { fr: string; en: string; value: string }[];
  explanation: string | null;
}

interface Quiz {
  id: string;
  titleFr: string;
  titleEn: string;
  passingScore: number;
  timeLimit: number | null;
  questions: Question[];
  lessonId: string;
}

interface QuizResult {
  score: number;
  passed: boolean;
  correctAnswers: number;
  totalQuestions: number;
  details: { questionId: string; correct: boolean; explanation: string | null }[];
}

// ── Page ──────────────────────────────────────────────────────

export default function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: formationId } = use(params);
  const searchParams = useSearchParams();
  const quizId = searchParams.get("quizId");
  const locale = useLocale();
  const { data: session, status } = useSession();
  const router = useRouter();
  const fr = locale === "fr";

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") { router.replace("/formations/connexion"); return; }
    if (status !== "authenticated" || !quizId) return;

    fetch(`/api/formations/quiz/${quizId}`)
      .then((r) => r.json())
      .then((data) => {
        setQuiz(data);
        if (data.timeLimit) setTimeLeft(data.timeLimit * 60);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [quizId, status, router]);

  // Timer
  useEffect(() => {
    if (timeLeft === null || submitted) return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    const timer = setTimeout(() => setTimeLeft((t) => (t ?? 1) - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, submitted]);

  const handleSubmit = useCallback(async () => {
    if (!quiz || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/formations/${formationId}/quiz/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: quiz.id, answers }),
      });
      const data = await res.json();
      setResult(data);
      setSubmitted(true);
    } catch {
      setSubmitting(false);
    }
  }, [quiz, submitting, formationId, answers]);

  const setAnswer = (questionId: string, value: string, multi = false) => {
    if (multi) {
      setAnswers((prev) => {
        const current = (prev[questionId] as string[]) ?? [];
        return {
          ...prev,
          [questionId]: current.includes(value)
            ? current.filter((v) => v !== value)
            : [...current, value],
        };
      });
    } else {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
    }
  };

  if (loading || !quiz) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const currentQ = quiz.questions[currentIdx];
  const qText = fr ? currentQ.textFr : (currentQ.textEn || currentQ.textFr);
  const totalQ = quiz.questions.length;

  // Results screen
  if (submitted && result) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-lg w-full bg-white dark:bg-neutral-dark rounded-2xl shadow-lg overflow-hidden">
          {/* Result header */}
          <div className={`p-8 text-center ${result.passed ? "bg-gradient-to-br from-green-500 to-emerald-600" : "bg-gradient-to-br from-orange-500 to-red-500"}`}>
            <div className="flex justify-center mb-4">
              {result.passed ? (
                <Trophy className="w-16 h-16 text-white" />
              ) : (
                <XCircle className="w-16 h-16 text-white" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">
              {result.passed
                ? (fr ? "🎉 Quiz réussi !" : "🎉 Quiz passed!")
                : (fr ? "Presque ! Réessayez" : "Almost! Try again")}
            </h1>
            <p className="text-white/80">{fr ? "Score obtenu" : "Your score"}</p>
            <p className="text-5xl font-black text-white mt-2">{result.score}%</p>
            <p className="text-white/70 text-sm mt-1">
              {fr ? `Minimum requis : ${quiz.passingScore}%` : `Minimum required: ${quiz.passingScore}%`}
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-green-700">{result.correctAnswers}</p>
                <p className="text-xs text-slate-500">{fr ? "Réponses correctes" : "Correct answers"}</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <XCircle className="w-6 h-6 text-red-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-red-600">{result.totalQuestions - result.correctAnswers}</p>
                <p className="text-xs text-slate-500">{fr ? "Réponses incorrectes" : "Wrong answers"}</p>
              </div>
            </div>

            {/* Corrections */}
            {result.details.some((d) => d.explanation) && (
              <div className="mb-6">
                <h3 className="font-semibold text-slate-900 mb-3 text-sm">{fr ? "Corrections" : "Corrections"}</h3>
                {result.details.filter((d) => d.explanation).map((d, i) => (
                  <div key={d.questionId} className={`text-xs rounded-lg p-3 mb-2 ${d.correct ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"}`}>
                    <span className="font-medium">{fr ? `Question ${i + 1} :` : `Question ${i + 1}:`}</span>{" "}
                    {d.explanation}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              {!result.passed && (
                <button
                  onClick={() => { setSubmitted(false); setResult(null); setCurrentIdx(0); setAnswers({}); if (quiz.timeLimit) setTimeLeft(quiz.timeLimit * 60); }}
                  className="flex-1 flex items-center justify-center gap-2 border border-slate-300 text-slate-700 font-medium py-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  {fr ? "Réessayer" : "Try again"}
                </button>
              )}
              <button
                onClick={() => router.push(`/formations/apprendre/${formationId}`)}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors"
              >
                {result.passed ? (fr ? "Continuer" : "Continue") : (fr ? "Retour au cours" : "Back to course")}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-neutral-dark rounded-2xl shadow-sm border dark:border-border-dark p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-bold text-slate-900">{fr ? quiz.titleFr : (quiz.titleEn || quiz.titleFr)}</h1>
            {timeLeft !== null && (
              <div className={`flex items-center gap-1.5 text-sm font-medium ${timeLeft < 60 ? "text-red-500" : "text-slate-600"}`}>
                <Clock className="w-4 h-4" />
                {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
              </div>
            )}
          </div>
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-500">
              <span>{fr ? `Question ${currentIdx + 1} sur ${totalQ}` : `Question ${currentIdx + 1} of ${totalQ}`}</span>
              <span>{Math.round(((currentIdx) / totalQ) * 100)}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${((currentIdx) / totalQ) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white dark:bg-neutral-dark rounded-2xl shadow-sm border dark:border-border-dark p-6">
          <p className="font-semibold text-slate-900 mb-6 leading-relaxed">{qText}</p>

          {/* Answer options */}
          {(currentQ.type === "CHOIX_UNIQUE" || currentQ.type === "CHOIX_MULTIPLE") && (
            <div className="space-y-3">
              {currentQ.options.map((opt) => {
                const optLabel = fr ? opt.fr : (opt.en || opt.fr);
                const isMulti = currentQ.type === "CHOIX_MULTIPLE";
                const selected = isMulti
                  ? ((answers[currentQ.id] as string[]) ?? []).includes(opt.value)
                  : answers[currentQ.id] === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setAnswer(currentQ.id, opt.value, isMulti)}
                    className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all text-sm ${
                      selected
                        ? "border-primary bg-primary/5 text-primary font-medium"
                        : "border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <span className={`inline-flex w-6 h-6 rounded-${isMulti ? "md" : "full"} border-2 items-center justify-center mr-3 text-xs flex-shrink-0 ${
                      selected ? "bg-primary border-primary text-white" : "border-slate-300"
                    }`}>
                      {selected && "✓"}
                    </span>
                    {optLabel}
                  </button>
                );
              })}
            </div>
          )}

          {currentQ.type === "VRAI_FAUX" && (
            <div className="flex gap-4">
              {[
                { value: "true", label: fr ? "Vrai" : "True" },
                { value: "false", label: fr ? "Faux" : "False" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAnswer(currentQ.id, opt.value)}
                  className={`flex-1 py-4 rounded-xl border-2 font-semibold transition-all ${
                    answers[currentQ.id] === opt.value
                      ? "border-primary bg-primary text-white"
                      : "border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {currentQ.type === "TEXTE_LIBRE" && (
            <textarea
              value={(answers[currentQ.id] as string) ?? ""}
              onChange={(e) => setAnswer(currentQ.id, e.target.value)}
              rows={4}
              placeholder={fr ? "Votre réponse..." : "Your answer..."}
              className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary resize-none"
            />
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              disabled={currentIdx === 0}
              className="text-sm text-slate-500 hover:text-slate-700 disabled:opacity-30 transition-colors px-4 py-2"
            >
              ← {fr ? "Précédent" : "Previous"}
            </button>
            {currentIdx < totalQ - 1 ? (
              <button
                onClick={() => setCurrentIdx((i) => i + 1)}
                className="flex items-center gap-2 bg-primary text-white font-medium px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors"
              >
                {fr ? "Suivant" : "Next"}
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 bg-green-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {submitting ? "..." : (fr ? "Terminer le quiz" : "Finish quiz")}
                <CheckCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
