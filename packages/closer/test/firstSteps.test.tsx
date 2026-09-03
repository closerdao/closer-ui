import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useAuth } from '../contexts/auth';
import { usePlatform } from '../contexts/platform';
import FirstStepsPage from '../pages/first-steps';
import { renderWithNextIntl } from './utils';

/**
 * jest.config maps the bare `../utils/api` specifier to `test/__mocks__/api.js`,
 * which is a different module from the one the page actually loads. Mocking the
 * path with its extension targets the real module, which is what pages resolve
 * to — the same trick `affiliateApply.test.tsx` uses.
 */
jest.mock('../utils/api.js', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: { results: [] } })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
  },
  formatSearch: () => '',
  invalidateGetCache: jest.fn(),
}));

const api = jest.requireMock('../utils/api.js').default as {
  get: jest.Mock;
  post: jest.Mock;
};

jest.mock('../contexts/auth', () => ({ useAuth: jest.fn() }));
jest.mock('../contexts/platform', () => ({ usePlatform: jest.fn() }));
// The page imports the named export; the hook module offers both, so mock both
// with one function. `jest.mock` is hoisted above the file's consts, so the
// shared instance has to be created inside the factory and read back after.
jest.mock('../hooks/useRBAC', () => {
  const hook = jest.fn();
  return { __esModule: true, default: hook, useRBAC: hook };
});

const mockUseRBAC = jest.requireMock('../hooks/useRBAC').useRBAC as jest.Mock;

const mockRouter = {
  query: {} as Record<string, any>,
  push: jest.fn(),
  replace: jest.fn(),
  pathname: '/first-steps',
  asPath: '/first-steps',
  locales: ['en'],
};
jest.mock('next/router', () => ({ useRouter: () => mockRouter }));

/** Config rows as the platform store hands them back. */
const configRows = (bySlug: Record<string, any>) =>
  Object.entries(bySlug).map(([slug, value]) => ({ slug, value }));

const makePlatform = (rows: any[] = []) => ({
  config: {
    get: jest.fn().mockResolvedValue({ results: { toJS: () => rows } }),
    getOne: jest.fn().mockResolvedValue({}),
    find: jest.fn(() => ({ toJS: () => rows })),
    patch: jest.fn().mockResolvedValue({}),
    post: jest.fn().mockResolvedValue({}),
    put: jest.fn().mockResolvedValue({ type: 'PUT_SUCCESS' }),
  },
  page: { post: jest.fn().mockResolvedValue({}) },
  user: { patch: jest.fn().mockResolvedValue({}) },
});

const setup = ({
  config = {},
  step,
  hasAccess = true,
}: {
  config?: Record<string, any>;
  step?: string;
  hasAccess?: boolean;
} = {}) => {
  const platform = makePlatform(configRows(config));
  mockRouter.query = step ? { step } : {};
  (useAuth as jest.Mock).mockReturnValue({
    user: { _id: 'user-1', roles: ['admin'], settings: {} },
    refetchUser: jest.fn(),
  });
  (usePlatform as jest.Mock).mockReturnValue({ platform });
  mockUseRBAC.mockReturnValue({ hasAccess: () => hasAccess });
  return platform;
};

beforeEach(() => {
  jest.clearAllMocks();
  // Skips are mirrored to localStorage, so one test's skip would otherwise
  // arrive already-set in the next.
  window.localStorage.clear();
  api.get.mockResolvedValue({ data: { results: [] } });
  api.post.mockResolvedValue({ data: {} });
  delete process.env.NEXT_PUBLIC_FEATURE_BOOKING;
});

describe('FirstStepsPage access', () => {
  it('hides itself from anyone without FirstSteps access', () => {
    setup({ hasAccess: false });
    renderWithNextIntl(<FirstStepsPage />);
    expect(screen.queryByText('Name your village')).toBeNull();
  });
});

describe('the identity step', () => {
  it('opens first on a fresh instance', async () => {
    setup();
    renderWithNextIntl(<FirstStepsPage />);
    expect(await screen.findByText('Name your village')).toBeTruthy();
  });

  it('saves the general config with what was typed', async () => {
    const platform = setup();
    renderWithNextIntl(<FirstStepsPage />);
    await screen.findByText('Name your village');

    const field = screen.getByLabelText('Platform name');
    await userEvent.type(field, 'Moos');
    await userEvent.click(screen.getByTestId('first-steps-save'));

    await waitFor(() => {
      expect(platform.config.post).toHaveBeenCalled();
    });
    const [payload] = (platform.config.post as jest.Mock).mock.calls[0];
    expect(payload.slug).toBe('general');
    expect(payload.value.platformName).toBe('Moos');
  });

  it('patches rather than creates when the config already exists', async () => {
    const platform = setup({ config: { general: { platformName: 'Moos' } } });
    renderWithNextIntl(<FirstStepsPage />);
    await screen.findByText('Name your village');

    await userEvent.type(screen.getByLabelText('Team email'), 'a@b.co');
    await userEvent.click(screen.getByTestId('first-steps-save'));

    await waitFor(() => {
      expect(platform.config.patch).toHaveBeenCalled();
    });
    expect(platform.config.post).not.toHaveBeenCalled();
  });
});

describe('the features step', () => {
  it('offers a live toggle for a feature its environment allows', async () => {
    const platform = setup({ step: 'features' });
    renderWithNextIntl(<FirstStepsPage />);
    await screen.findByText('Pick your features');

    await userEvent.click(screen.getByTestId('first-steps-feature-events'));

    await waitFor(() => {
      expect(platform.config.post).toHaveBeenCalled();
    });
    const [payload] = (platform.config.post as jest.Mock).mock.calls[0];
    expect(payload.slug).toBe('events');
    expect(payload.value.enabled).toBe(true);
  });

  it('shows the environment variable instead of a toggle when locked', async () => {
    setup({ step: 'features' });
    renderWithNextIntl(<FirstStepsPage />);
    await screen.findByText('Pick your features');

    // Booking has no env flag set in this run, so it must not be switchable.
    expect(screen.queryByTestId('first-steps-feature-booking')).toBeNull();
    expect(screen.getByText('NEXT_PUBLIC_FEATURE_BOOKING=true')).toBeTruthy();
  });
});

describe('the pages step', () => {
  it('seeds a page with the identity that was just saved, not the snapshot', async () => {
    const platform = setup({
      step: 'pages',
      config: {
        general: {
          platformName: 'Moos',
          teamEmail: 'hi@moos.co',
          country: 'PT',
        },
      },
    });
    renderWithNextIntl(<FirstStepsPage />);
    await screen.findByText('Create your pages');

    await userEvent.click(screen.getByTestId('first-steps-create-page-home'));

    await waitFor(() => {
      expect(platform.page.post).toHaveBeenCalled();
    });
    const [payload] = (platform.page.post as jest.Mock).mock.calls[0];
    expect(payload.slug).toBe('/');
    // The virtual id and the unsaved marker must not reach the record.
    expect(payload._id).toBeUndefined();
    expect(payload.isDefault).toBeUndefined();
    // The live platform name reaches the seeded copy.
    expect(JSON.stringify(payload)).toContain('Moos');
  });
});

describe('the launch step', () => {
  it('triggers a deploy', async () => {
    setup({ step: 'launch' });
    renderWithNextIntl(<FirstStepsPage />);
    await screen.findByText('Go live');

    await userEvent.click(screen.getByTestId('first-steps-deploy'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/deploy', {});
    });
    expect(
      await screen.findByTestId('first-steps-deploy-started'),
    ).toBeTruthy();
  });

  it('lists what is still outstanding', async () => {
    setup({ step: 'launch' });
    renderWithNextIntl(<FirstStepsPage />);
    await screen.findByText('Go live');
    expect(screen.getByText('Still outstanding')).toBeTruthy();
  });
});

describe('skipping', () => {
  it('records an optional step as skipped on the user', async () => {
    const platform = setup({ step: 'money' });
    renderWithNextIntl(<FirstStepsPage />);
    await screen.findByText('Take payments');

    await userEvent.click(screen.getByText('Skip this step'));

    await waitFor(() => {
      expect(platform.user.patch).toHaveBeenCalled();
    });
    const [, payload] = (platform.user.patch as jest.Mock).mock.calls[0];
    expect(payload.settings.first_steps.skipped).toContain('money');
  });

  it('offers no skip on a required step', async () => {
    setup();
    renderWithNextIntl(<FirstStepsPage />);
    await screen.findByText('Name your village');
    expect(screen.queryByText('Skip this step')).toBeNull();
  });
});

describe('the full-screen shell', () => {
  it('owns the viewport instead of mounting the dashboard layout', async () => {
    setup();
    const { container } = renderWithNextIntl(<FirstStepsPage />);
    await screen.findByText('Name your village');

    // The dashboard sidebar would bring a second navigation onto the screen.
    expect(container.querySelector('aside')).toBeNull();
    expect(container.querySelector('.min-h-screen')).toBeTruthy();
  });

  it('offers one way out, back to the dashboard', async () => {
    setup();
    renderWithNextIntl(<FirstStepsPage />);
    await screen.findByText('Name your village');

    expect(screen.getByTestId('first-steps-exit')).toHaveAttribute(
      'href',
      '/dashboard',
    );
  });

  it('shows where the admin is in the flow', async () => {
    setup({ step: 'team' });
    renderWithNextIntl(<FirstStepsPage />);
    await screen.findByText('Invite your team');

    // `stays` is hidden without booking, so team is 6 of 7.
    expect(screen.getByText('Step 6 of 7')).toBeTruthy();
  });

  it('marks a skipped step in the header', async () => {
    setup({ step: 'money' });
    renderWithNextIntl(<FirstStepsPage />);
    await screen.findByText('Take payments');

    await userEvent.click(screen.getByText('Skip this step'));

    expect(
      await screen.findByTestId('first-steps-skipped-badge'),
    ).toBeTruthy();
  });
});
