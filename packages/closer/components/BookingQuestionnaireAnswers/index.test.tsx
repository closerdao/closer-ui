import { act, fireEvent, waitFor } from '@testing-library/react';

import BookingQuestionnaireAnswers from '.';
import { renderWithNextIntl } from '../../test/utils';
import { mapEventFieldsToQuestions } from '../../utils/booking.helpers';

const questions = mapEventFieldsToQuestions([
  { name: 'Telegram handle', fieldType: 'text' },
  {
    name: 'Which shift?',
    fieldType: 'select',
    options: ['Cooking', 'Cleaning'],
  },
]);

describe('BookingQuestionnaireAnswers', () => {
  it('renders nothing when the event asks nothing and nothing was answered', () => {
    const { container } = renderWithNextIntl(
      <BookingQuestionnaireAnswers fields={[]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('lists the questions an event asks even before they are answered', () => {
    const { getByText, getAllByText } = renderWithNextIntl(
      <BookingQuestionnaireAnswers
        fields={[{ 'Telegram handle': '@sam' }]}
        questions={questions}
      />,
    );

    expect(getByText('@sam')).toBeInTheDocument();
    expect(getByText('Which shift?')).toBeInTheDocument();
    expect(getAllByText('Not answered yet')).toHaveLength(1);
  });

  it('offers no form without a save handler, so hosts only read', () => {
    const { queryByRole } = renderWithNextIntl(
      <BookingQuestionnaireAnswers fields={[]} questions={questions} />,
    );

    expect(queryByRole('button')).not.toBeInTheDocument();
  });

  it('saves the answers typed into the form', async () => {
    jest.useFakeTimers();
    const onSave = jest.fn().mockResolvedValue(undefined);
    const { getByRole, getByText } = renderWithNextIntl(
      <BookingQuestionnaireAnswers
        fields={[]}
        questions={questions}
        onSave={onSave}
      />,
    );

    fireEvent.click(getByText('Answer questions'));
    fireEvent.change(getByRole('textbox'), { target: { value: '@sam' } });
    fireEvent.change(getByRole('combobox'), { target: { value: 'Cooking' } });

    // Saving before the input's debounce elapses must still send what was typed.
    await act(async () => {
      fireEvent.click(getByText('Save answers'));
    });

    expect(onSave).toHaveBeenCalledWith([
      { 'Telegram handle': '@sam' },
      { 'Which shift?': 'Cooking' },
    ]);
    jest.useRealTimers();
  });

  it('keeps the form open and shows why when the save is refused', async () => {
    const onSave = jest.fn().mockRejectedValue(new Error('Booking is locked'));
    const { getByText, queryByText } = renderWithNextIntl(
      <BookingQuestionnaireAnswers
        fields={[]}
        questions={questions}
        onSave={onSave}
      />,
    );

    fireEvent.click(getByText('Answer questions'));
    await act(async () => {
      fireEvent.click(getByText('Save answers'));
    });

    await waitFor(() =>
      expect(getByText('Booking is locked')).toBeInTheDocument(),
    );
    expect(queryByText('Save answers')).toBeInTheDocument();
  });
});
