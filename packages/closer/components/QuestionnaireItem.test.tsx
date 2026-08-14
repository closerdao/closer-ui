import { act, fireEvent } from '@testing-library/react';

import QuestionnaireItem from './QuestionnaireItem';
import { renderWithNextIntl } from '../test/utils';

const question = {
  name: 'Why are you coming?',
  fieldType: 'text',
  type: 'text',
  required: true,
} as any;

describe('QuestionnaireItem', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('keeps typed text after the debounced answer is reported up', () => {
    const handleAnswer = jest.fn();
    const { getByRole } = renderWithNextIntl(
      <QuestionnaireItem
        question={question}
        savedAnswer=""
        handleAnswer={handleAnswer}
      />,
    );

    const input = getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'to rest' } });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(handleAnswer).toHaveBeenCalledWith(question.name, 'to rest');
    expect(input.value).toBe('to rest');
  });

  test('adopts a saved answer that arrives once the booking loads', () => {
    const handleAnswer = jest.fn();
    const { getByRole, rerender } = renderWithNextIntl(
      <QuestionnaireItem
        question={question}
        savedAnswer=""
        handleAnswer={handleAnswer}
      />,
    );

    rerender(
      <QuestionnaireItem
        question={question}
        savedAnswer="from the booking"
        handleAnswer={handleAnswer}
      />,
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    const input = getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('from the booking');
    expect(handleAnswer).not.toHaveBeenCalled();
  });
});
