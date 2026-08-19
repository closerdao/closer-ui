import { createRef } from 'react';

import { act, fireEvent } from '@testing-library/react';

import QuestionnaireItem from './QuestionnaireItem';
import { renderWithNextIntl } from '../test/utils';
import { QuestionnaireItemHandle } from '../types';

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

  test('flush reports the latest typed answer without waiting for debounce', () => {
    const handleAnswer = jest.fn();
    const ref = createRef<QuestionnaireItemHandle>();
    const { getByRole } = renderWithNextIntl(
      <QuestionnaireItem
        ref={ref}
        question={question}
        savedAnswer=""
        handleAnswer={handleAnswer}
      />,
    );

    const input = getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'to rest' } });

    expect(handleAnswer).not.toHaveBeenCalled();

    const flushed = ref.current?.flush();
    expect(flushed).toEqual({ name: question.name, value: 'to rest' });
    expect(handleAnswer).toHaveBeenCalledTimes(1);
    expect(handleAnswer).toHaveBeenCalledWith(question.name, 'to rest');

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(handleAnswer).toHaveBeenCalledTimes(1);
    expect(input.value).toBe('to rest');
  });

  test('flush does not get overwritten by an older debounced value', () => {
    const handleAnswer = jest.fn();
    const ref = createRef<QuestionnaireItemHandle>();
    const { getByRole } = renderWithNextIntl(
      <QuestionnaireItem
        ref={ref}
        question={question}
        savedAnswer=""
        handleAnswer={handleAnswer}
      />,
    );

    const input = getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'first value' } });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    fireEvent.change(input, { target: { value: 'second value' } });
    ref.current?.flush();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(handleAnswer).toHaveBeenCalledTimes(1);
    expect(handleAnswer).toHaveBeenLastCalledWith(question.name, 'second value');
    expect(input.value).toBe('second value');
  });
});
