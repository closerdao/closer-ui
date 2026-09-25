import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fromJS } from 'immutable';

import { renderWithNextIntl } from '../../test/utils';
import ConfigPage from './config';

const patch = jest.fn().mockResolvedValue({});
const post = jest.fn().mockResolvedValue({});
const getOne = jest.fn().mockResolvedValue({});
const get = jest.fn().mockResolvedValue({});

let storedConfigs: { slug: string; value: Record<string, unknown> }[] = [];
// Same reference per call, like the real store, or the page's `[myConfigs]` effect loops.
let storedConfigsImmutable: any = null;

jest.mock('../../contexts/auth', () => ({
  useAuth: () => ({ user: { _id: 'u1', roles: ['admin'] } }),
}));

// useRBAC fetches through a module the global api mock misses.
jest.mock('../../hooks/useRBAC', () => {
  const stub = () => ({
    hasAccess: () => true,
    config: {},
    rbacLiveRevision: 1,
  });
  return { __esModule: true, default: stub, useRBAC: stub };
});

jest.mock('../../contexts/platform', () => ({
  usePlatform: () => ({
    platform: {
      config: {
        get,
        getOne,
        patch,
        post,
        find: () => storedConfigsImmutable,
        findOne: (slug: string) => {
          const found = storedConfigs.find((c) => c.slug === slug);
          return found ? fromJS(found) : undefined;
        },
      },
    },
  }),
}));

describe('admin config — booking cancellation policy', () => {
  beforeEach(() => {
    storedConfigs = [
      { slug: 'general', value: { enabled: true, appName: 'tdf' } },
      {
        slug: 'booking',
        value: { enabled: true, cancellationPolicyDefault: 1 },
      },
    ];
    storedConfigsImmutable = fromJS(storedConfigs);
  });

  it('explains which date each refund reads the policy from', async () => {
    renderWithNextIntl(<ConfigPage />);

    await userEvent.click(screen.getByText('Booking'));

    expect(
      screen.getByText(
        /Cancelling a whole stay uses the fraction for the check-in date/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/average fraction of the nights given back/),
    ).toBeInTheDocument();
  });
});
