import React, { useEffect } from 'react';

import { useTranslations } from 'next-intl';

import { useDebounce } from '../hooks/useDebounce';
import { Question } from '../types';
import Input from './ui/Input';

interface Props {
  question: Question;
  savedAnswer: string;
  handleAnswer: (name: string, answer: string) => void;
}

const QuestionnaireItem = ({
  question: { type, name, options, required },
  savedAnswer,
  handleAnswer,
}: Props) => {
  const t = useTranslations();
  const [answer, setAnswer] = React.useState(savedAnswer || '');
  const debouncedAnswer = useDebounce(answer, 500);

  useEffect(() => {
    handleAnswer(name, debouncedAnswer);
  }, [debouncedAnswer]);

  if (!type || !name) {
    return null;
  }

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAnswer(e.target.value);
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
        <>
          <Input
            id={name}
            type="text"
            placeholder={t('generic_input_placeholder')}
            className="" // TO DO how to resolve class clash with forms.css?
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            isRequired={required}
          />
        </>
      )}
      {type === 'select' && options && (
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
      )}
    </div>
  );
};

QuestionnaireItem.defaultProps = {
  question: {
    type: 'text',
    name: 'Question',
    options: [],
  },
  handleAnswer: () => null,
};

export default QuestionnaireItem;
