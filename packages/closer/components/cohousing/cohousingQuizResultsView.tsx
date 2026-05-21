import { useMemo } from 'react';

import { useTranslations } from 'next-intl';

import type { CohousingApplication } from '../../types/cohousingApplication';
import {
  countObjectiveQuizScore,
  getQuizAnswersFromApplication,
  gradeTdfQuizAnswers,
} from '../../utils/cohousingQuiz.helpers';

interface Props {
  application: CohousingApplication;
}

export const CohousingQuizResultsView = ({ application }: Props) => {
  const t = useTranslations();
  const answers = getQuizAnswersFromApplication(application);
  const graded = useMemo(() => gradeTdfQuizAnswers(answers), [answers]);
  const { score, total } = useMemo(
    () =>
      application.quiz?.score != null
        ? {
            score: application.quiz.score,
            total: countObjectiveQuizScore(answers).total,
          }
        : countObjectiveQuizScore(answers),
    [application.quiz?.score, answers],
  );

  const sections = useMemo(() => {
    const map = new Map<string, typeof graded>();
    for (const item of graded) {
      const list = map.get(item.question.section) ?? [];
      list.push(item);
      map.set(item.question.section, list);
    }
    return Array.from(map.entries());
  }, [graded]);

  if (!answers || Object.keys(answers).length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">
          {t('cohousing_app_admin_quiz_results')}
        </p>
        <p className="text-sm text-gray-600">
          {t('cohousing_app_admin_quiz_not_submitted')}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs uppercase tracking-wide text-gray-500">
          {t('cohousing_app_admin_quiz_results')}
        </p>
        <p className="text-sm font-medium text-gray-900">
          {t('cohousing_app_admin_quiz_score', { score, total })}
        </p>
      </div>

      {sections.map(([section, items]) => (
        <div key={section}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
            {section}
          </p>
          <ul className="space-y-2">
            {items.map((item) => {
              const isWrong =
                item.isGradable && item.isCorrect === false;
              return (
                <li
                  key={item.question.id}
                  className={`rounded-lg border px-3 py-2.5 text-sm ${
                    isWrong
                      ? 'border-red-200 bg-red-50 text-red-800'
                      : 'border-gray-200 bg-gray-50 text-gray-800'
                  }`}
                >
                  <p className="font-medium">{item.question.title}</p>
                  <p className="mt-1">
                    <span className="text-xs uppercase tracking-wide opacity-70">
                      {t('cohousing_app_admin_quiz_your_answer')}:{' '}
                    </span>
                    {item.answerLabel || '—'}
                  </p>
                  {isWrong && item.correctLabel && (
                    <p className="mt-1 text-red-700">
                      <span className="text-xs uppercase tracking-wide opacity-70">
                        {t('cohousing_app_admin_quiz_correct_answer')}:{' '}
                      </span>
                      {item.correctLabel}
                    </p>
                  )}
                  {!item.isGradable && (
                    <p className="mt-1 text-xs text-gray-500">
                      {t('cohousing_app_admin_quiz_ungraded')}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
};
