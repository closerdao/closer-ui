import React, { useEffect } from 'react';

import { useDebounce } from '../hooks/useDebounce';
import { __ } from '../utils/helpers';

export const QuestionnaireItem = ({
  question: { type, name, options },
  savedAnswer,
  handleAnswer,
}) => {
  const [answer, setAnswer] = React.useState(savedAnswer);
  const debouncedAnswer = useDebounce(answer, 500);
  console.log('QuestionnaireItem', name, answer);
  useEffect(() => {
    if (debouncedAnswer) {
      handleAnswer(name, debouncedAnswer);
    }
  }, [debouncedAnswer]);

  const onChange = (e) => {
    setAnswer(e.target.value);
  };
  return (
    <div className="mb-16 last:mb-0">
      <label
        htmlFor={name}
        className="border-solid border-b border-neutral-200 pb-1 capitalize font-normal text-base text-black"
      >
        {name}
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
            required
          />
          <label className="invisible peer-invalid:visible normal-case font-normal text-xs text-primary">
            Please, enter an answer
          </label>
        </>
      )}
      {type === 'select' && (
        <select
          type="text"
          className="rounded-xl border-solid !border border-neutral-400 bg-neutral-100 px-4 block w-full appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent invalid:border-primary"
          value={answer}
          onChange={onChange}
          defaultValue=""
          required
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
  handleAnswer: () => {},
};
