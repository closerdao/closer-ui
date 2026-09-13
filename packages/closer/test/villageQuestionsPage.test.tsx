import { useRouter } from 'next/router';

import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useAuth } from '../contexts/auth';
import VillageQuestionsPage from '../pages/villages/[slug]/tell-us-more';
import { renderWithNextIntl } from './utils';

jest.mock('../contexts/auth', () => ({
  useAuth: jest.fn(),
}));

// jest.config maps the bare "../utils/api" specifier to test/__mocks__/api.js,
// which is a different module than the "./api" the utils import.
jest.mock('../utils/api.js', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
  formatSearch: (where: unknown) => encodeURIComponent(JSON.stringify(where)),
  invalidateGetCache: jest.fn(),
}));

const api = jest.requireMock('../utils/api.js').default as {
  get: jest.Mock;
  post: jest.Mock;
};

const village = {
  _id: 'v1',
  slug: 'riverbank',
  name: 'Riverbank',
  country: 'Portugal',
  description: '',
  coords: [-8.6, 41.1],
  onboardingStatus: 'live',
};

const questions = [
  { id: 'a1', question: 'Who owns the land?', source: 'enrichment' },
  {
    id: 'a2',
    question: 'How many people live there?',
    answer: 'Fourteen.',
    answeredAt: '2026-08-01T10:00:00.000Z',
    source: 'answered',
  },
];

/** The page reads the village first, then its questions. */
const mockRoutes = (rows = questions) => {
  api.get.mockImplementation((url: string) => {
    if (url.includes('/questions')) {
      return Promise.resolve({
        data: { villageId: 'v1', leadId: 'l1', questions: rows },
      });
    }
    return Promise.resolve({ data: { results: village } });
  });
};

const box = (label: string) =>
  screen
    .getByText(label)
    .closest('div')
    ?.parentElement?.querySelector('textarea') as HTMLTextAreaElement;

describe('the village questions page', () => {
  beforeEach(() => {
    api.get.mockReset();
    api.post.mockReset();
    (useRouter as jest.Mock).mockReturnValue({
      query: { slug: 'riverbank' },
      push: jest.fn(),
      isReady: true,
    });
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { _id: 'user-1', roles: [] },
    });
    mockRoutes();
  });

  it('asks what is open and folds what is already answered out of the way', async () => {
    renderWithNextIntl(<VillageQuestionsPage />);

    expect(await screen.findByText('Who owns the land?')).toBeInTheDocument();
    expect(screen.getByText('1 of 2 answered')).toBeInTheDocument();
    // The answered one is in the drawer, not in the founder's way.
    expect(screen.queryByText('How many people live there?')).toBeNull();
    expect(screen.getByText('1 answered question')).toBeInTheDocument();
  });

  it('opens the drawer so an answer can be corrected', async () => {
    renderWithNextIntl(<VillageQuestionsPage />);
    await screen.findByText('Who owns the land?');

    await userEvent.click(screen.getByText('1 answered question'));

    expect(screen.getByText('How many people live there?')).toBeInTheDocument();
    // The saved answer opens in the box, so editing it is not retyping it.
    expect(screen.getByDisplayValue('Fourteen.')).toBeInTheDocument();
  });

  it('never asks the questions route for the slug the URL carries', async () => {
    renderWithNextIntl(<VillageQuestionsPage />);

    await screen.findByText('Who owns the land?');
    expect(api.get).toHaveBeenCalledWith('/village/v1/questions', {
      cache: false,
    });
  });

  it('posts only the answer that changed, and adopts the list that comes back', async () => {
    api.post.mockResolvedValue({
      data: {
        villageId: 'v1',
        questions: [
          {
            id: 'a1',
            question: 'Who owns the land?',
            answer: 'A community land trust, since 2019.',
            answeredAt: '2026-09-02T09:00:00.000Z',
            source: 'answered',
          },
          questions[1],
        ],
      },
    });
    renderWithNextIntl(<VillageQuestionsPage />);
    await screen.findByText('Who owns the land?');

    await userEvent.type(
      box('Who owns the land?'),
      'A community land trust, since 2019.',
    );
    await userEvent.click(
      screen.getByRole('button', { name: /Save 1 answer/ }),
    );

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/village/v1/answers', {
        answers: [{ id: 'a1', answer: 'A community land trust, since 2019.' }],
      }),
    );
    expect(await screen.findByText('2 of 2 answered')).toBeInTheDocument();
    expect(
      screen.getByText('Thank you — we\u2019ll be in touch soon.'),
    ).toBeInTheDocument();
  });

  it('folds the answered question away, then tucks it into the drawer', async () => {
    api.post.mockResolvedValue({
      data: {
        villageId: 'v1',
        questions: [
          {
            id: 'a1',
            question: 'Who owns the land?',
            answer: 'A community land trust.',
            answeredAt: '2026-09-02T09:00:00.000Z',
            source: 'answered',
          },
          questions[1],
        ],
      },
    });
    renderWithNextIntl(<VillageQuestionsPage />);
    await screen.findByText('Who owns the land?');

    await userEvent.type(box('Who owns the land?'), 'A community land trust.');
    await userEvent.click(
      screen.getByRole('button', { name: /Save 1 answer/ }),
    );

    // It stays on screen to fold rather than vanishing between two frames.
    const row = await screen.findByTestId('village-question-row');
    await waitFor(() => expect(row).toHaveAttribute('data-folding', 'true'));
    expect(screen.getByText('Who owns the land?')).toBeInTheDocument();

    // ...and once the fold has run, the drawer holds both.
    await waitFor(() =>
      expect(screen.getByText('2 answered questions')).toBeInTheDocument(),
    );
    expect(screen.queryByTestId('village-question-row')).toBeNull();
  });

  it('leaves the thank-you standing after the fold, with the rest still to answer', async () => {
    mockRoutes([
      { id: 'a1', question: 'Who owns the land?' },
      { id: 'a3', question: 'What is the plan for water?' },
    ]);
    api.post.mockResolvedValue({
      data: {
        villageId: 'v1',
        questions: [
          {
            id: 'a1',
            question: 'Who owns the land?',
            answer: 'A land trust.',
            source: 'answered',
          },
          { id: 'a3', question: 'What is the plan for water?' },
        ],
      },
    });
    renderWithNextIntl(<VillageQuestionsPage />);
    await screen.findByText('Who owns the land?');

    await userEvent.type(box('Who owns the land?'), 'A land trust.');
    await userEvent.click(
      screen.getByRole('button', { name: /Save 1 answer/ }),
    );

    await waitFor(() =>
      expect(screen.getByText('1 answered question')).toBeInTheDocument(),
    );
    // The fold has finished, but the thank-you has not flashed past with it.
    expect(
      screen.getByText('Thank you \u2014 we\u2019ll be in touch soon.'),
    ).toBeInTheDocument();
    expect(screen.getByText('What is the plan for water?')).toBeInTheDocument();
  });

  it('keeps a cleared answer open instead of folding it away', async () => {
    api.post.mockResolvedValue({
      data: {
        villageId: 'v1',
        questions: [
          questions[0],
          { id: 'a2', question: 'How many people live there?', answer: null },
        ],
      },
    });
    renderWithNextIntl(<VillageQuestionsPage />);
    await screen.findByText('Who owns the land?');

    await userEvent.click(screen.getByText('1 answered question'));
    await userEvent.clear(screen.getByDisplayValue('Fourteen.'));
    await userEvent.click(
      screen.getByRole('button', { name: /Save 1 answer/ }),
    );

    await waitFor(() =>
      expect(screen.getByText('0 of 2 answered')).toBeInTheDocument(),
    );
    // Nothing was told to us, so nothing is thanked for.
    expect(screen.queryByText(/Thank you/)).toBeNull();
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('thanks a founder who has already answered everything', async () => {
    mockRoutes([
      { id: 'a2', question: 'How many people?', answer: 'Fourteen.' },
    ]);
    renderWithNextIntl(<VillageQuestionsPage />);

    expect(
      await screen.findByText('Thank you — we\u2019ll be in touch soon.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Save/ })).toBeNull();
  });

  it('cannot be saved until something is actually typed', async () => {
    renderWithNextIntl(<VillageQuestionsPage />);
    await screen.findByText('Who owns the land?');

    expect(screen.getByRole('button', { name: 'Save answers' })).toBeDisabled();
  });

  it('sends a viewer the route refuses to 401 rather than an error page', async () => {
    api.get.mockImplementation((url: string) => {
      if (url.includes('/questions')) {
        return Promise.reject({
          response: { status: 403, data: { error: 'Not your village' } },
        });
      }
      return Promise.resolve({ data: { results: village } });
    });

    renderWithNextIntl(<VillageQuestionsPage />);

    expect(await screen.findByText('401')).toBeInTheDocument();
    // The CRM's own reason for refusing never reaches the founder.
    expect(screen.queryByText('Not your village')).not.toBeInTheDocument();
  });

  it('says so plainly when there is nothing to answer', async () => {
    mockRoutes([]);
    renderWithNextIntl(<VillageQuestionsPage />);

    expect(
      await screen.findByText('Nothing to answer right now'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Save/ })).toBeNull();
  });
});
