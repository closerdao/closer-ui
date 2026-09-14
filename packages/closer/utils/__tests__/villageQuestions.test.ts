import {
  VillageQuestion,
  VillageQuestionsError,
  countAnsweredVillageQuestions,
  getVillageQuestions,
  normalizeVillageQuestions,
  saveVillageAnswers,
  villageAnswerChanges,
  villageAnswerDrafts,
} from '../villageQuestions';

// jest.config maps the bare "../utils/api" specifier to test/__mocks__/api.js,
// which is a different module than the "./api" villageQuestions imports.
jest.mock('../api.js', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
  formatSearch: (where: unknown) => encodeURIComponent(JSON.stringify(where)),
  invalidateGetCache: jest.fn(),
}));

const api = jest.requireMock('../api.js').default as {
  get: jest.Mock;
  post: jest.Mock;
};

const question = (overrides: Partial<VillageQuestion> = {}): VillageQuestion =>
  ({
    id: 'a1',
    question: 'Who owns the land?',
    answer: null,
    answeredAt: null,
    source: 'enrichment',
    ...overrides,
  } as VillageQuestion);

beforeEach(() => {
  api.get.mockReset();
  api.post.mockReset();
});

describe('normalizeVillageQuestions', () => {
  it('reads the documented payload', () => {
    const result = normalizeVillageQuestions({
      villageId: 'v1',
      leadId: 'l1',
      questions: [
        {
          id: 'a1',
          question: 'Who owns the land?',
          answer: 'A community land trust.',
          answeredAt: '2026-08-01T10:00:00.000Z',
          source: 'answered',
        },
      ],
    });

    expect(result.villageId).toBe('v1');
    expect(result.leadId).toBe('l1');
    expect(result.questions).toHaveLength(1);
    expect(result.questions[0].answer).toBe('A community land trust.');
  });

  it('unwraps a results envelope and falls back to the id it was given', () => {
    const result = normalizeVillageQuestions(
      { results: { questions: [{ id: 'a1', question: 'How many people?' }] } },
      'v1',
    );

    expect(result.villageId).toBe('v1');
    expect(result.leadId).toBeNull();
    expect(result.questions.map((row) => row.question)).toEqual([
      'How many people?',
    ]);
  });

  it('drops rows with no id or no question rather than rendering blank cards', () => {
    const result = normalizeVillageQuestions({
      questions: [
        { question: 'No id here' },
        { id: 'a2' },
        { id: 'a3', question: '   ' },
        { id: 'a4', question: 'Kept' },
      ],
    });

    expect(result.questions.map((row) => row.id)).toEqual(['a4']);
  });
});

describe('villageAnswerChanges', () => {
  const questions = [
    question({ id: 'a1', answer: 'A land trust.' }),
    question({ id: 'a2', question: 'How many people live there?' }),
  ];

  it('sends only what the draft changed', () => {
    const drafts = { a1: 'A land trust.', a2: 'Fourteen.' };

    expect(villageAnswerChanges(questions, drafts)).toEqual([
      { id: 'a2', answer: 'Fourteen.' },
    ]);
  });

  it('ignores whitespace-only edits so an untouched box is not re-saved', () => {
    const drafts = { a1: '  A land trust.  ', a2: '' };

    expect(villageAnswerChanges(questions, drafts)).toEqual([]);
  });

  it('clears an answer with null when the box is emptied', () => {
    const drafts = { a1: '   ', a2: '' };

    expect(villageAnswerChanges(questions, drafts)).toEqual([
      { id: 'a1', answer: null },
    ]);
  });

  it('leaves out questions the form never rendered', () => {
    expect(villageAnswerChanges(questions, { a2: 'Fourteen.' })).toEqual([
      { id: 'a2', answer: 'Fourteen.' },
    ]);
  });
});

describe('drafts and counts', () => {
  it('seeds the form from the saved answers', () => {
    expect(
      villageAnswerDrafts([
        question({ id: 'a1', answer: 'A land trust.' }),
        question({ id: 'a2' }),
      ]),
    ).toEqual({ a1: 'A land trust.', a2: '' });
  });

  it('counts a blank answer as unanswered', () => {
    expect(
      countAnsweredVillageQuestions([
        question({ id: 'a1', answer: 'A land trust.' }),
        question({ id: 'a2', answer: '   ' }),
        question({ id: 'a3' }),
      ]),
    ).toEqual({ answered: 1, total: 3 });
  });
});

describe('the routes', () => {
  it('reads the singular /village/:id/questions, past the cache', async () => {
    api.get.mockResolvedValue({
      data: { villageId: 'v1', questions: [{ id: 'a1', question: 'Who?' }] },
    });

    const result = await getVillageQuestions('v1');

    expect(api.get).toHaveBeenCalledWith('/village/v1/questions', {
      cache: false,
    });
    expect(result.questions).toHaveLength(1);
  });

  it('posts the answers and adopts the list that comes back', async () => {
    api.post.mockResolvedValue({
      data: {
        villageId: 'v1',
        questions: [
          { id: 'a1', question: 'Who?', answer: 'Us.', source: 'answered' },
        ],
      },
    });

    const result = await saveVillageAnswers('v1', [
      { id: 'a1', answer: 'Us.' },
    ]);

    expect(api.post).toHaveBeenCalledWith('/village/v1/answers', {
      answers: [{ id: 'a1', answer: 'Us.' }],
    });
    expect(result.questions[0].answer).toBe('Us.');
  });

  it('keeps the status so a caller can tell "not yours" from "went wrong"', async () => {
    api.get.mockRejectedValue({
      response: { status: 403, data: { error: 'Not your village' } },
    });

    await expect(getVillageQuestions('v1')).rejects.toMatchObject({
      status: 403,
      message: 'Not your village',
    });
    await expect(getVillageQuestions('v1')).rejects.toBeInstanceOf(
      VillageQuestionsError,
    );
  });
});
