import { useEffect, useMemo, useState } from 'react';

import Button from '../ui/Button';
import { FlowDisclaimer, FlowProgressBar } from './cohousingFlowUi';
import { TDF_QUIZ_INTRO, TDF_QUIZ_QUESTIONS } from '../../constants/cohousingTdfQuiz';

export interface TdfQuizSubmitPayload {
  score: number;
  passed: boolean;
  answers: Record<string, string>;
}

interface TdfQuizDraft {
  idx: number;
  answers: Record<string, string>;
}

const parseDraft = (raw: string | null): TdfQuizDraft | null => {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as TdfQuizDraft;
    if (!parsed || typeof parsed !== 'object' || !parsed.answers) {
      return null;
    }
    return {
      idx: Math.min(Math.max(Number(parsed.idx) || 0, 0), TDF_QUIZ_QUESTIONS.length - 1),
      answers: parsed.answers,
    };
  } catch {
    return null;
  }
};

export const CohousingTdfQuiz = ({
  draftStorageKey,
  initialAnswers,
  onSubmit,
}: {
  draftStorageKey: string;
  initialAnswers?: Record<string, string>;
  onSubmit: (payload: TdfQuizSubmitPayload) => Promise<void>;
}) => {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers || {});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const current = TDF_QUIZ_QUESTIONS[idx];
  const currentAnswer = answers[current.id] || '';
  const completion = Object.keys(answers).filter((key) => {
    const value = (answers[key] || '').trim();
    return value.length > 0;
  }).length;
  const completedAll = completion >= TDF_QUIZ_QUESTIONS.length;
  const objectiveQuestions = TDF_QUIZ_QUESTIONS.filter((q) => q.correctOptionId);
  const score = objectiveQuestions.filter(
    (q) => answers[q.id] === q.correctOptionId,
  ).length;
  const totalObjective = objectiveQuestions.length;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const restored = parseDraft(window.localStorage.getItem(draftStorageKey));
    if (restored) {
      setIdx(restored.idx);
      setAnswers((prev) => ({ ...prev, ...restored.answers }));
    }
  }, [draftStorageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const payload: TdfQuizDraft = { idx, answers };
    window.localStorage.setItem(draftStorageKey, JSON.stringify(payload));
  }, [answers, draftStorageKey, idx]);

  const sectionLabel = useMemo(() => current.section, [current.section]);

  const handleAnswer = (value: string) => {
    setAnswers((prev) => ({ ...prev, [current.id]: value }));
  };

  const next = () => setIdx((prev) => Math.min(prev + 1, TDF_QUIZ_QUESTIONS.length - 1));
  const prev = () => setIdx((old) => Math.max(0, old - 1));

  const handleSubmit = async () => {
    if (!completedAll || submitting) {
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    try {
      await onSubmit({ score, passed: true, answers });
    } catch {
      setSubmitError('Could not submit your quiz yet. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{TDF_QUIZ_INTRO}</p>
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
          {sectionLabel} · Question {idx + 1} / {TDF_QUIZ_QUESTIONS.length}
        </span>
        <div className="w-28">
          <FlowProgressBar value={idx + 1} max={TDF_QUIZ_QUESTIONS.length} />
        </div>
      </div>
      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 leading-snug">
        {current.title}
      </h3>

      {(current.type === 'single' || current.type === 'boolean') && current.options && (
        <div className="flex flex-col gap-2">
          {current.options.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`text-left px-3.5 py-2.5 rounded-lg border text-sm transition-colors ${
                currentAnswer === option.id
                  ? 'bg-accent/10 border-accent text-accent'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-accent'
              }`}
              onClick={() => handleAnswer(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {current.type === 'text' && (
        <textarea
          rows={5}
          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm"
          placeholder={current.placeholder || 'Type your reflection'}
          value={currentAnswer}
          onChange={(e) => handleAnswer(e.target.value)}
        />
      )}

      {current.type === 'scale' && (
        <div className="space-y-3">
          <input
            type="range"
            min={current.min || 1}
            max={current.max || 10}
            step={1}
            className="w-full accent-accent"
            value={Number(currentAnswer || current.min || 1)}
            onChange={(e) => handleAnswer(e.target.value)}
          />
          <div className="text-sm text-gray-700">Selected: {currentAnswer || String(current.min || 1)}</div>
          <textarea
            rows={3}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm"
            placeholder={current.placeholder || 'Add context'}
            value={answers[`${current.id}_note`] || ''}
            onChange={(e) => setAnswers((prev) => ({ ...prev, [`${current.id}_note`]: e.target.value }))}
          />
        </div>
      )}

      <div className="flex justify-between items-center gap-2 pt-1">
        <Button isFullWidth={false} variant="secondary" size="small" isEnabled={idx > 0} onClick={prev}>
          Back
        </Button>
        {idx < TDF_QUIZ_QUESTIONS.length - 1 ? (
          <Button isFullWidth={false} size="small" isEnabled={Boolean(currentAnswer.trim())} onClick={next}>
            Next
          </Button>
        ) : (
          <Button isFullWidth={false} size="small" isEnabled={completedAll && !submitting} onClick={handleSubmit}>
            {submitting ? 'Submitting...' : 'Submit quiz'}
          </Button>
        )}
      </div>

      <div className="text-xs text-gray-600">
        Completed {completion} / {TDF_QUIZ_QUESTIONS.length} · Knowledge score {score}/{totalObjective}
      </div>
      {!completedAll && (
        <FlowDisclaimer tone="amber">
          Answer all questions to submit. Your progress is saved locally while you work.
        </FlowDisclaimer>
      )}
      {submitError && <FlowDisclaimer tone="red">{submitError}</FlowDisclaimer>}
    </div>
  );
};
