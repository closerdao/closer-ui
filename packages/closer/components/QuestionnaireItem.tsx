import React, { useEffect, useRef, useState } from 'react';

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
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAnswer, setLastSavedAnswer] = useState(savedAnswer || '');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debouncedAnswer = useDebounce(answer, 300); // Reduced from 500ms to 300ms

  // Track when we're in the middle of saving
  const isCurrentlySaving = useRef(false);

  useEffect(() => {
    // Only save if the answer has actually changed and we're not already saving
    if (debouncedAnswer !== lastSavedAnswer && !isCurrentlySaving.current) {
      setIsSaving(true);
      isCurrentlySaving.current = true;
      
      // Clear any existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Add a small delay to ensure we don't have race conditions
      saveTimeoutRef.current = setTimeout(() => {
        handleAnswer(name, debouncedAnswer);
        setLastSavedAnswer(debouncedAnswer);
        setIsSaving(false);
        isCurrentlySaving.current = false;
      }, 100);
    }
  }, [debouncedAnswer, lastSavedAnswer, handleAnswer, name]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Update local state when savedAnswer prop changes (from parent)
  useEffect(() => {
    if (savedAnswer !== lastSavedAnswer) {
      setAnswer(savedAnswer || '');
      setLastSavedAnswer(savedAnswer || '');
    }
  }, [savedAnswer, lastSavedAnswer]);

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
            onChange={handleInputChange}
            isRequired={required}
          />
          {isSaving && (
            <div className="text-sm text-gray-500 mt-1">
              {t('saving') || 'Saving...'}
            </div>
          )}
        </>
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
          {isSaving && (
            <div className="text-sm text-gray-500 mt-1">
              {t('saving') || 'Saving...'}
            </div>
          )}
        </div>
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
