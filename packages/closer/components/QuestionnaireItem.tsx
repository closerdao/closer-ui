import React, { useEffect, useRef } from 'react';

import { useTranslations } from 'next-intl';

import { Question } from '../types';
import Input from './ui/Input';

interface Props {
  question?: Question;
  savedAnswer: string;
  handleAnswer?: (name: string, answer: string) => void;
}

const QuestionnaireItem = ({
  question: { type, name, options, required } = { type: 'text', name: 'Question', options: [] },
  savedAnswer,
  handleAnswer = () => {},
}: Props) => {
  const t = useTranslations();
  const [answer, setAnswer] = React.useState(savedAnswer || '');
  const savedAnswerPropRef = useRef(savedAnswer || '');
  const hasEditedRef = useRef(false);
  const handleAnswerRef = useRef(handleAnswer);
  handleAnswerRef.current = handleAnswer;

  // Adopt the saved answer only when the prop itself changes (e.g. the booking
  // finished loading) and the guest has not started typing.
  useEffect(() => {
    const incoming = savedAnswer || '';
    if (incoming === savedAnswerPropRef.current) {
      return;
    }
    savedAnswerPropRef.current = incoming;
    if (hasEditedRef.current) {
      return;
    }
    setAnswer(incoming);
  }, [savedAnswer]);

  if (!type || !name) {
    return null;
  }

  const updateAnswer = (value: string) => {
    hasEditedRef.current = true;
    setAnswer(value);
    handleAnswerRef.current(name, value);
  };

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateAnswer(e.target.value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateAnswer(e.target.value);
  };

  return (
    <div className="mb-16 last:mb-0 flex flex-col gap-2">
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
};

export default QuestionnaireItem;
