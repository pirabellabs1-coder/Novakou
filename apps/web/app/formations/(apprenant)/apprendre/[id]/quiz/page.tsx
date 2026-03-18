"use client";

import { useState, useEffect, use, useCallback, useMemo } from "react";
import { useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle, XCircle, Clock, ArrowRight, ArrowLeft, Trophy, RotateCcw,
  ChevronRight, Eye, ChevronLeft,
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
  details: { questionId: string; correct: boolean; correctAnswer?: string | string[]; explanation: string | null }[];
}

// ── Question Navigator ─────────────────────────────────────────

function QuestionNavigator({
  totalQuestions,
  currentIdx,
  answers,
  questions,
  reviewMode,
  result,
  onSelect,
  fr,
}: {
  totalQuestions: number;
  currentIdx: number;
  answers: Record<string, string | string[]>;
  questions: Question[];
  reviewMode: boolean;
  result: QuizResult | null;
  onSelect: (idx: number) => void;
  fr: boolean;
}) {
  const getCircleStyle = (idx: number) => {
    const q = questions[idx];
    const isCurrent = idx === currentIdx;
    const isAnswered = q && answers[q.id] !== undefined && answers[q.id] !== "" &&
      (Array.isArray(answers[q.id]) ? (answers[q.id] as string[]).length > 0 : true);

    if (reviewMode && result) {
      const detail = result.details.find((d) => d.questionId === q.id);
      const base = "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all cursor-pointer flex-shrink-0";
      if (!detail || !isAnswered) {
        return `${base} bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-300 ${isCurrent ? "ring-2 ring-offset-2 dark:ring-offset-neutral-dark ring-slate-400 dark:ring-slate-300" : ""}`;
      }
      if (detail.correct) {
        return `${base} bg-green-500 text-white ${isCurrent ? "ring-2 ring-offset-2 dark:ring-offset-neutral-dark ring-green-400" : ""}`;
      }
      return `${base} bg-red-500 text-white ${isCurrent ? "ring-2 ring-offset-2 dark:ring-offset-neutral-dark ring-red-400" : ""}`;
    }

    const base = "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all cursor-pointer flex-shrink-0";
    if (isCurrent) {
      return `${base} bg-primary text-white ring-2 ring-offset-2 dark:ring-offset-neutral-dark ring-primary/50 dark:ring-primary/70`;
    }
    if (isAnswered) {
      return `${base} bg-primary/15 text-primary dark:bg-primary/25 dark:text-primary`;
    }
    return `${base} bg-slate-100 dark:bg-slate-800 dark:bg-slate-700 text-slate-400 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-2xl shadow-sm border dark:border-border-dark p-4">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">
        {reviewMode
          ? (fr ? "Navigation des corrections" : "Review navigation")
          : (fr ? "Navigation des questions" : "Question navigation")}
      </p>
      {/* Mobile: horizontal scroll. Desktop: wrap grid */}
      <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto md:overflow-visible md:max-h-none">
        {Array.from({ length: totalQuestions }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(idx)}
            className={getCircleStyle(idx)}
            aria-label={`${fr ? "Question" : "Question"} ${idx + 1}`}
          >
            {idx + 1}
          </button>
        ))}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t dark:border-border-dark text-[11px] text-slate-500 dark:text-slate-400">
        {reviewMode ? (
          <>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> {fr ? "Correct" : "Correct"}</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> {fr ? "Incorrect" : "Incorrect"}</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-600 inline-block" /> {fr ? "Non répondu" : "Unanswered"}</span>
          </>
        ) : (
          <>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-primary inline-block" /> {fr ? "Actuelle" : "Current"}</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-primary/15 dark:bg-primary/25 inline-block" /> {fr ? "Répondu" : "Answered"}</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-slate-100 dark:bg-slate-800 dark:bg-slate-700 inline-block" /> {fr ? "Non répondu" : "Unanswered"}</span>
          </>
        )}
      </div>
    </div>
  );
}

// ── Progress Bar ───────────────────────────────────────────────

function ProgressBar({
  current,
  total,
  fr,
  reviewMode,
}: {
  current: number;
  total: number;
  fr: boolean;
  reviewMode: boolean;
}) {
  const progress = Math.round(((current + 1) / total) * 100);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>
          {reviewMode
            ? (fr ? `Correction ${current + 1} sur ${total}` : `Review ${current + 1} of ${total}`)
            : (fr ? `Question ${current + 1} sur ${total}` : `Question ${current + 1} of ${total}`)}
        </span>
        <span className="font-medium">{current + 1}/{total} ({progress}%)</span>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-slate-800 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// ── Review Mode Question View ──────────────────────────────────

function ReviewQuestionView({
  question,
  questionIdx,
  userAnswer,
  detail,
  fr,
}: {
  question: Question;
  questionIdx: number;
  userAnswer: string | string[] | undefined;
  detail: QuizResult["details"][number] | undefined;
  fr: boolean;
}) {
  const qText = fr ? question.textFr : (question.textEn || question.textFr);
  const isCorrect = detail?.correct ?? false;
  const correctAnswer = detail?.correctAnswer;
  const explanation = detail?.explanation ?? question.explanation;

  const getUserAnswerForOption = (optValue: string) => {
    if (Array.isArray(userAnswer)) return userAnswer.includes(optValue);
    return userAnswer === optValue;
  };

  const isCorrectAnswer = (optValue: string) => {
    if (!correctAnswer) return false;
    if (Array.isArray(correctAnswer)) return correctAnswer.includes(optValue);
    return correctAnswer === optValue;
  };

  const getOptionStyle = (optValue: string) => {
    const userSelected = getUserAnswerForOption(optValue);
    const correct = isCorrectAnswer(optValue);

    if (userSelected && correct) {
      // User selected and it's correct
      return "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300";
    }
    if (userSelected && !correct) {
      // User selected but it's wrong
      return "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300";
    }
    if (!userSelected && correct) {
      // User didn't select but it's the correct answer
      return "border-green-400 bg-green-50/60 dark:bg-green-900/10 text-green-600 dark:text-green-400 border-dashed";
    }
    return "border-slate-200 dark:border-slate-700 dark:border-slate-600 text-slate-500 dark:text-slate-400";
  };

  const getOptionIcon = (optValue: string) => {
    const userSelected = getUserAnswerForOption(optValue);
    const correct = isCorrectAnswer(optValue);

    if (userSelected && correct) return <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />;
    if (userSelected && !correct) return <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />;
    if (!userSelected && correct) return <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />;
    return <span className="w-5 h-5 flex-shrink-0" />;
  };

  return (
    <div className="bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-2xl shadow-sm border dark:border-border-dark p-6">
      {/* Question header */}
      <div className="flex items-start gap-3 mb-5">
        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold flex-shrink-0 ${
          isCorrect
            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
            : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
        }`}>
          {questionIdx + 1}
        </span>
        <div className="flex-1">
          <p className="font-semibold text-slate-900 dark:text-white dark:text-slate-100 leading-relaxed">{qText}</p>
          <p className={`text-xs font-medium mt-1 ${isCorrect ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {isCorrect
              ? (fr ? "Bonne réponse" : "Correct answer")
              : (fr ? "Mauvaise réponse" : "Wrong answer")}
          </p>
        </div>
      </div>

      {/* Options for choice-based questions */}
      {(question.type === "CHOIX_UNIQUE" || question.type === "CHOIX_MULTIPLE") && (
        <div className="space-y-2.5">
          {question.options.map((opt) => {
            const optLabel = fr ? opt.fr : (opt.en || opt.fr);
            return (
              <div
                key={opt.value}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm ${getOptionStyle(opt.value)}`}
              >
                {getOptionIcon(opt.value)}
                <span>{optLabel}</span>
                {getUserAnswerForOption(opt.value) && (
                  <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide opacity-70">
                    {fr ? "Votre choix" : "Your choice"}
                  </span>
                )}
                {!getUserAnswerForOption(opt.value) && isCorrectAnswer(opt.value) && (
                  <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide text-green-500">
                    {fr ? "Bonne réponse" : "Correct"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* True/False review */}
      {question.type === "VRAI_FAUX" && (
        <div className="flex gap-4">
          {[
            { value: "true", label: fr ? "Vrai" : "True" },
            { value: "false", label: fr ? "Faux" : "False" },
          ].map((opt) => (
            <div
              key={opt.value}
              className={`flex-1 py-4 rounded-xl border-2 text-center font-semibold text-sm ${getOptionStyle(opt.value)}`}
            >
              <div className="flex items-center justify-center gap-2">
                {getOptionIcon(opt.value)}
                <span>{opt.label}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Free text review */}
      {question.type === "TEXTE_LIBRE" && (
        <div className="space-y-3">
          <div className={`rounded-xl border-2 px-4 py-3 text-sm ${
            isCorrect
              ? "border-green-400 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
              : "border-red-400 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
          }`}>
            <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70 mb-1">
              {fr ? "Votre réponse" : "Your answer"}
            </p>
            <p>{typeof userAnswer === "string" ? userAnswer : (fr ? "(Aucune réponse)" : "(No answer)")}</p>
          </div>
          {correctAnswer && (
            <div className="rounded-xl border-2 border-green-400 bg-green-50/60 dark:bg-green-900/10 px-4 py-3 text-sm text-green-600 dark:text-green-400 border-dashed">
              <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70 mb-1">
                {fr ? "Réponse attendue" : "Expected answer"}
              </p>
              <p>{Array.isArray(correctAnswer) ? correctAnswer.join(", ") : correctAnswer}</p>
            </div>
          )}
        </div>
      )}

      {/* Explanation */}
      {explanation && (
        <div className="mt-5 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">
            {fr ? "Explication" : "Explanation"}
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-400 leading-relaxed">{explanation}</p>
        </div>
      )}
    </div>
  );
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
  const [reviewMode, setReviewMode] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") { router.replace("/formations/connexion"); return; }
    if (status !== "authenticated" || !quizId) return;

    fetch(`/api/formations/quiz/${quizId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch quiz");
        return r.json();
      })
      .then((data) => {
        // Normalize question data from API:
        // - API returns `explanationFr` but our type expects `explanation`
        // - Options stored as { fr, en } without `value`; add index-based value
        const normalizedQuestions = (data.questions ?? []).map((q: Record<string, unknown>) => ({
          ...q,
          explanation: (q.explanationFr as string) ?? (q.explanation as string) ?? null,
          options: Array.isArray(q.options)
            ? (q.options as Record<string, string>[]).map((opt, optIdx) => ({
                fr: opt.fr ?? opt.textFr ?? "",
                en: opt.en ?? opt.textEn ?? "",
                value: opt.value ?? String(optIdx),
              }))
            : [],
        }));
        setQuiz({ ...data, questions: normalizedQuestions });
        if (data.timeLimit) setTimeLeft(data.timeLimit * 60);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [quizId, status, router]);

  const handleSubmit = useCallback(async () => {
    if (!quiz || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/formations/${formationId}/quiz/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: quiz.id, answers }),
      });
      if (!res.ok) throw new Error("Submit failed");
      const data = await res.json();
      setResult(data);
      setSubmitted(true);
    } catch {
      // Only reset submitting on failure so user can retry
    } finally {
      setSubmitting(false);
    }
  }, [quiz, submitting, formationId, answers]);

  // Timer
  useEffect(() => {
    if (timeLeft === null || submitted) return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    const timer = setTimeout(() => setTimeLeft((t) => (t ?? 1) - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, submitted, handleSubmit]);

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

  const answeredCount = useMemo(() => {
    if (!quiz) return 0;
    return quiz.questions.filter((q) => {
      const a = answers[q.id];
      if (a === undefined || a === "") return false;
      if (Array.isArray(a) && a.length === 0) return false;
      return true;
    }).length;
  }, [quiz, answers]);

  if (loading || !quiz) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const currentQ = quiz.questions[currentIdx];
  const qText = fr ? currentQ.textFr : (currentQ.textEn || currentQ.textFr);
  const totalQ = quiz.questions.length;

  // ── Review Mode ────────────────────────────────────────────
  if (reviewMode && submitted && result) {
    const currentQuestion = quiz.questions[currentIdx];
    const currentDetail = result.details.find((d) => d.questionId === currentQuestion.id);

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Review header */}
          <div className="bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-2xl shadow-sm border dark:border-border-dark p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-primary" />
                <h1 className="font-bold text-slate-900 dark:text-white dark:text-slate-100">
                  {fr ? "Correction du quiz" : "Quiz Review"}
                </h1>
              </div>
              <button
                onClick={() => { setReviewMode(false); }}
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                {fr ? "Retour aux résultats" : "Back to results"}
              </button>
            </div>

            {/* Score summary bar */}
            <div className="flex items-center gap-4 mb-4">
              <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                result.passed
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                  : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
              }`}>
                {result.score}%
              </div>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {fr
                  ? `${result.correctAnswers}/${result.totalQuestions} réponses correctes`
                  : `${result.correctAnswers}/${result.totalQuestions} correct answers`}
              </span>
            </div>

            {/* Progress bar */}
            <ProgressBar current={currentIdx} total={totalQ} fr={fr} reviewMode />
          </div>

          {/* Layout: navigator + question */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-4">
            {/* Question review */}
            <div>
              <ReviewQuestionView
                question={currentQuestion}
                questionIdx={currentIdx}
                userAnswer={answers[currentQuestion.id]}
                detail={currentDetail}
                fr={fr}
              />

              {/* Review navigation */}
              <div className="flex justify-between mt-4">
                <button
                  onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                  disabled={currentIdx === 0}
                  className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 transition-colors px-4 py-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {fr ? "Précédent" : "Previous"}
                </button>
                {currentIdx < totalQ - 1 ? (
                  <button
                    onClick={() => setCurrentIdx((i) => i + 1)}
                    className="flex items-center gap-2 bg-primary text-white font-medium px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors"
                  >
                    {fr ? "Suivant" : "Next"}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setReviewMode(false)}
                    className="flex items-center gap-2 bg-slate-700 dark:bg-slate-600 text-white font-medium px-6 py-2.5 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-500 transition-colors"
                  >
                    {fr ? "Terminer la correction" : "Finish review"}
                    <CheckCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Question navigator sidebar (desktop) / inline (mobile) */}
            <div className="order-first lg:order-last">
              <QuestionNavigator
                totalQuestions={totalQ}
                currentIdx={currentIdx}
                answers={answers}
                questions={quiz.questions}
                reviewMode
                result={result}
                onSelect={setCurrentIdx}
                fr={fr}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Results screen ─────────────────────────────────────────
  if (submitted && result) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900 flex items-center justify-center py-12 px-4">
        <div className="max-w-lg w-full bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-2xl shadow-lg overflow-hidden">
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
                ? (fr ? "Quiz réussi !" : "Quiz passed!")
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
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{result.correctAnswers}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{fr ? "Réponses correctes" : "Correct answers"}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center">
                <XCircle className="w-6 h-6 text-red-500 dark:text-red-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-red-600 dark:text-red-300">{result.totalQuestions - result.correctAnswers}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{fr ? "Réponses incorrectes" : "Wrong answers"}</p>
              </div>
            </div>

            {/* Question navigator mini preview */}
            <div className="mb-6">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                {fr ? "Aperçu des réponses" : "Answer overview"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {quiz.questions.map((q, idx) => {
                  const detail = result.details.find((d) => d.questionId === q.id);
                  const isAnswered = answers[q.id] !== undefined && answers[q.id] !== "" &&
                    (Array.isArray(answers[q.id]) ? (answers[q.id] as string[]).length > 0 : true);
                  let colorClass = "bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-300";
                  if (isAnswered && detail) {
                    colorClass = detail.correct
                      ? "bg-green-500 text-white"
                      : "bg-red-500 text-white";
                  }
                  return (
                    <span
                      key={q.id}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${colorClass}`}
                    >
                      {idx + 1}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Corrections summary */}
            {result.details.some((d) => d.explanation) && (
              <div className="mb-6">
                <h3 className="font-semibold text-slate-900 dark:text-white dark:text-slate-100 mb-3 text-sm">{fr ? "Corrections" : "Corrections"}</h3>
                {result.details.filter((d) => d.explanation).map((d) => {
                  const actualIdx = result.details.findIndex((det) => det.questionId === d.questionId);
                  return (
                    <div key={d.questionId} className={`text-xs rounded-lg p-3 mb-2 ${d.correct ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300" : "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300"}`}>
                      <span className="font-medium">{fr ? `Question ${actualIdx + 1} :` : `Question ${actualIdx + 1}:`}</span>{" "}
                      {d.explanation}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-3">
              {/* Review button - always shown */}
              <button
                onClick={() => { setReviewMode(true); setCurrentIdx(0); }}
                className="w-full flex items-center justify-center gap-2 border-2 border-primary text-primary font-semibold py-3 rounded-xl hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors"
              >
                <Eye className="w-4 h-4" />
                {fr ? "Revoir mes réponses" : "Review my answers"}
              </button>

              <div className="flex gap-3">
                {!result.passed && (
                  <button
                    onClick={() => { setSubmitted(false); setResult(null); setReviewMode(false); setCurrentIdx(0); setAnswers({}); if (quiz.timeLimit) setTimeLeft(quiz.timeLimit * 60); }}
                    className="flex-1 flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium py-3 rounded-xl hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-800 transition-colors"
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
      </div>
    );
  }

  // ── Quiz in progress ───────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with title, timer, progress */}
        <div className="bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-2xl shadow-sm border dark:border-border-dark p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-bold text-slate-900 dark:text-white dark:text-slate-100">{fr ? quiz.titleFr : (quiz.titleEn || quiz.titleFr)}</h1>
            <div className="flex items-center gap-4">
              {/* Answered count */}
              <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                {fr
                  ? `${answeredCount}/${totalQ} répondu${answeredCount > 1 ? "s" : ""}`
                  : `${answeredCount}/${totalQ} answered`}
              </span>
              {timeLeft !== null && (
                <div className={`flex items-center gap-1.5 text-sm font-medium ${timeLeft < 60 ? "text-red-500 animate-pulse" : "text-slate-600 dark:text-slate-300"}`}>
                  <Clock className="w-4 h-4" />
                  {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
                </div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <ProgressBar current={currentIdx} total={totalQ} fr={fr} reviewMode={false} />
        </div>

        {/* Layout: question + navigator */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-4">
          {/* Question card */}
          <div className="bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-2xl shadow-sm border dark:border-border-dark p-6">
            <p className="font-semibold text-slate-900 dark:text-white dark:text-slate-100 mb-6 leading-relaxed">{qText}</p>

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
                          ? "border-primary bg-primary/5 dark:bg-primary/10 text-primary font-medium"
                          : "border-slate-200 dark:border-slate-700 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500"
                      }`}
                    >
                      <span className={`inline-flex w-6 h-6 rounded-${isMulti ? "md" : "full"} border-2 items-center justify-center mr-3 text-xs flex-shrink-0 ${
                        selected ? "bg-primary border-primary text-white" : "border-slate-300 dark:border-slate-500"
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
                        : "border-slate-200 dark:border-slate-700 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500"
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
                className="w-full border-2 border-slate-200 dark:border-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary resize-none"
              />
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <button
                onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                disabled={currentIdx === 0}
                className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 transition-colors px-4 py-2"
              >
                <ChevronLeft className="w-4 h-4" />
                {fr ? "Précédent" : "Previous"}
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

          {/* Question navigator sidebar */}
          <div className="order-first lg:order-last">
            <QuestionNavigator
              totalQuestions={totalQ}
              currentIdx={currentIdx}
              answers={answers}
              questions={quiz.questions}
              reviewMode={false}
              result={null}
              onSelect={setCurrentIdx}
              fr={fr}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
