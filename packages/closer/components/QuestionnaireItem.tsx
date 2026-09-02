import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';

import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';

import { useDebounce } from '../hooks/useDebounce';
import { Question, QuestionnaireItemHandle } from '../types';
import Input from './ui/Input';

interface Props {
  question?: Question;
  savedAnswer: string;
  handleAnswer?: (name: string, answer: string) => void;
  /** Overrides the full-page spacing, e.g. for the questionnaire card. */
  className?: string;
}

const QuestionnaireItem = forwardRef<QuestionnaireItemHandle, Props>(
  (
    {
      question: { type, name, options, required } = {
        type: 'text',
        name: 'Question',
        options: [],
      },
      savedAnswer,
      handleAnswer = () => {},
      className,
    },
    ref,
  ) => {
    const t = useTranslations();
    const [answer, setAnswer] = React.useState(savedAnswer || '');
    const debouncedAnswer = useDebounce(answer, 300);

    // The answer we last reported up, and the last value the prop itself held.
    // Both are refs so they never re-trigger the effects below.
    const reportedAnswerRef = useRef(savedAnswer || '');
    const savedAnswerPropRef = useRef(savedAnswer || '');
    const handleAnswerRef = useRef(handleAnswer);
    handleAnswerRef.current = handleAnswer;
    const answerRef = useRef(answer);
    answerRef.current = answer;
    const nameRef = useRef(name);
    nameRef.current = name;

    useImperativeHandle(ref, () => ({
      flush: () => {
        const value = answerRef.current;
        const questionName = nameRef.current;
        if (value !== reportedAnswerRef.current) {
          reportedAnswerRef.current = value;
          handleAnswerRef.current(questionName, value);
        }
        return { name: questionName, value };
      },
    }));

    useEffect(() => {
      if (debouncedAnswer !== answerRef.current) {
        return;
      }
      if (debouncedAnswer === reportedAnswerRef.current) {
        return;
      }
      reportedAnswerRef.current = debouncedAnswer;
      handleAnswerRef.current(name, debouncedAnswer);
    }, [debouncedAnswer, name]);

    // Adopt the saved answer only when the prop itself changes (e.g. the booking
    // finished loading). Never sync off local state — that would wipe typing.
    useEffect(() => {
      const incoming = savedAnswer || '';
      if (incoming === savedAnswerPropRef.current) {
        return;
      }
      savedAnswerPropRef.current = incoming;
      reportedAnswerRef.current = incoming;
      setAnswer(incoming);
    }, [savedAnswer]);

    if (!type || !name) {
      return null;
    }

    const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setAnswer(e.target.value);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setAnswer(e.target.value);
    };

    return (
      <div
        className={twMerge('mb-16 last:mb-0 flex flex-col gap-2', className)}
      >
        <label
          htmlFor={name}
          className=" pb-1 capitalize font-normal text-base text-black"
        >
          {name}
          {required && <span className="text-accent ml-1">*</span>}
        </label>
        {type === 'text' && (
          <Input
            id={name}
            type="text"
            placeholder={t('generic_input_placeholder')}
            className="" // TO DO how to resolve class clash with forms.css?
            value={answer}
            onChange={handleInputChange}
            isRequired={required}
          />
        )}
        {type === 'select' && options && (
          <div className="relative">
            <select
              className="rounded-md border-none bg-neutral-dark px-4 py-2 block w-full appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent invalid:border-accent"
              value={answer || ''}
              onChange={onChange}
              required={required}
            >
              <option value="">{t('generic_select_placeholder')}</option>
              {options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    );
  },
);

QuestionnaireItem.displayName = 'QuestionnaireItem';

export default QuestionnaireItem;
