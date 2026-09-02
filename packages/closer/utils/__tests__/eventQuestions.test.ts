import {
  answersToTicketFields,
  areTicketQuestionsAnswered,
  mapEventFieldsToQuestions,
  ticketFieldsToAnswers,
} from '../events.helpers';

describe('mapEventFieldsToQuestions', () => {
  it('renames fieldType to the type the questionnaire renders on', () => {
    expect(
      mapEventFieldsToQuestions([
        {
          _id: 'a',
          name: 'Which theme draws you?',
          fieldType: 'select',
          options: ['Land', 'Finance'],
        },
        { _id: 'b', name: "What's your phone number?", fieldType: 'text' },
      ]),
    ).toEqual([
      {
        name: 'Which theme draws you?',
        type: 'select',
        options: ['Land', 'Finance'],
        required: false,
      },
      {
        name: "What's your phone number?",
        type: 'text',
        options: [],
        required: false,
      },
    ]);
  });

  it('drops the half-created rows the event editor leaves behind', () => {
    expect(
      mapEventFieldsToQuestions([
        { _id: 'a', name: '', fieldType: 'text', options: [] },
        { _id: 'b', name: '   ', fieldType: 'text' },
        { _id: 'c', name: 'Pick one', fieldType: 'select', options: [] },
        { _id: 'd', name: 'Pick one', fieldType: 'select', options: ['', ' '] },
      ]),
    ).toEqual([]);
  });

  it('returns an empty list when the event asks nothing', () => {
    expect(mapEventFieldsToQuestions(undefined)).toEqual([]);
    expect(mapEventFieldsToQuestions(null)).toEqual([]);
    expect(mapEventFieldsToQuestions('nonsense')).toEqual([]);
  });
});

describe('answersToTicketFields', () => {
  const questions = mapEventFieldsToQuestions([
    { name: 'Telegram handle', fieldType: 'text' },
    { name: 'Which shift?', fieldType: 'select', options: ['Cooking'] },
  ]);

  it('sends the answers in the order the event asks them', () => {
    expect(
      answersToTicketFields(questions, {
        'Which shift?': 'Cooking',
        'Telegram handle': ' @sam ',
      }),
    ).toEqual([
      { name: 'Telegram handle', value: '@sam' },
      { name: 'Which shift?', value: 'Cooking' },
    ]);
  });

  it('leaves an unanswered question off the ticket rather than storing it empty', () => {
    expect(
      answersToTicketFields(questions, { 'Telegram handle': '  ' }),
    ).toEqual([]);
  });

  it('ignores answers to questions the event no longer asks', () => {
    expect(
      answersToTicketFields(questions, { 'A removed question': 'stale' }),
    ).toEqual([]);
  });
});

describe('ticketFieldsToAnswers', () => {
  it('reads a started ticket back into the form', () => {
    expect(
      ticketFieldsToAnswers([{ name: 'Telegram handle', value: '@sam' }]),
    ).toEqual({ 'Telegram handle': '@sam' });
  });

  it('survives a ticket with no answers on it', () => {
    expect(ticketFieldsToAnswers(undefined)).toEqual({});
    expect(ticketFieldsToAnswers(null)).toEqual({});
    expect(ticketFieldsToAnswers([{ value: 'orphan' } as any])).toEqual({});
  });
});

describe('areTicketQuestionsAnswered', () => {
  const questions = mapEventFieldsToQuestions([
    { name: 'Telegram handle', fieldType: 'text', required: true },
    { name: 'Anything else?', fieldType: 'text' },
  ]);

  it('only holds the guest to the questions marked required', () => {
    expect(
      areTicketQuestionsAnswered(questions, { 'Telegram handle': '@sam' }),
    ).toBe(true);
    expect(areTicketQuestionsAnswered(questions, {})).toBe(false);
    expect(
      areTicketQuestionsAnswered(questions, { 'Telegram handle': '   ' }),
    ).toBe(false);
  });

  it('passes when the event marks nothing required', () => {
    expect(
      areTicketQuestionsAnswered(
        mapEventFieldsToQuestions([{ name: 'Optional', fieldType: 'text' }]),
        {},
      ),
    ).toBe(true);
  });
});
