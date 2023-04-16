import React, { useEffect } from 'react';

import { useDebounce } from '../hooks/useDebounce';
import { Question } from '../types';
import { __ } from '../utils/helpers';

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
  const [answer, setAnswer] = React.useState(savedAnswer || '');
  const debouncedAnswer = useDebounce(answer, 500);

  useEffect(() => {
    handleAnswer(name, debouncedAnswer);
  }, [debouncedAnswer]);

  const onChange = (
    e:
      | React.ChangeEvent<HTMLSelectElement>
      | React.ChangeEvent<HTMLInputElement>,
  ) => {
    setAnswer(e.target.value);
  };

  if (!type || !name) {
    return null;
  }
  return (
    <div className="mb-16 last:mb-0">
      <label
        htmlFor={name}
        className="border-solid border-b border-neutral-200 pb-1 capitalize font-normal text-base text-black"
      >
        {name}
        {required && <span className="text-primary ml-1">*</span>}
      </label>
      {type === 'text' && (
        <>
          <input
            id={name}
            type="text"
            placeholder={__('generic_input_placeholder')}
            className="border-solid !border border-neutral-400 !px-4 py-2 w-full !mt-3 rounded-xl bg-neutral-100 placeholder:text-xs placeholder:text-neutral-400 peer" // TO DO how to resolve class clash with forms.css?
            value={answer}
            onChange={onChange}
            required={required}
          />
        </>
      )}
      {type === 'select' && options && (
        <select
          className="rounded-xl border-solid !border border-neutral-400 bg-neutral-100 px-4 block w-full appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent invalid:border-primary"
          value={answer || ''}
          onChange={onChange}
          required={required}
        >
          <option value="">{__('generic_select_placeholder')}</option>
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
