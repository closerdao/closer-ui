import type { ChangeEvent } from 'react';

import { useTranslations } from 'next-intl';

import type { Question } from '../../types';
import Input from '../ui/Input';

interface Props {
  questions: Question[];
  answers: Record<string, string>;
  onAnswerChange: (name: string, value: string) => void;
}

/**
 * The event's own questions, asked while the guest is picking their ticket.
 * The answers ride along to `POST /tickets/init` and live on the ticket, so
 * the host reads them next to the seat they were given.
 *
 * Answers are held by the modal rather than saved as they are typed — nothing
 * exists to save them to until the ticket is created.
 */
const TicketQuestions = ({ questions, answers, onAnswerChange }: Props) => {
  const t = useTranslations();

  if (!questions.length) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      <p className="text-sm font-medium">{t('event_ticket_questions_title')}</p>
      {questions.map((question) => {
        const value = answers[question.name] ?? '';
        return (
          <div key={question.name} className="flex flex-col gap-1">
            <label
              htmlFor={`ticket-question-${question.name}`}
              className="text-sm"
            >
              {question.name}
              {/* Decorative: the asterisk repeats what `required` already
                  tells assistive tech, and folding it into the label would
                  rename the field to "… *". */}
              {question.required && (
                <span aria-hidden="true" className="text-accent ml-1">
                  *
                </span>
              )}
            </label>
            {question.type === 'select' ? (
              <select
                id={`ticket-question-${question.name}`}
                className="border rounded-md px-3 py-2 text-sm"
                required={question.required}
                value={value}
                onChange={(event) =>
                  onAnswerChange(question.name, event.target.value)
                }
              >
                <option value="">{t('generic_select_placeholder')}</option>
                {question.options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                id={`ticket-question-${question.name}`}
                value={value}
                isRequired={question.required}
                placeholder={t('generic_input_placeholder')}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onAnswerChange(question.name, event.target.value)
                }
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TicketQuestions;
