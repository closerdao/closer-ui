import { fromJS } from 'immutable';

import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithNextIntl } from '../../test/utils';
import ConfigPage from './config';

const patch = jest.fn().mockResolvedValue({});
const post = jest.fn().mockResolvedValue({});
const getOne = jest.fn().mockResolvedValue({});
const get = jest.fn().mockResolvedValue({});

let storedConfigs: { slug: string; value: Record<string, unknown> }[] = [];
/**
 * The real store hands back the same Immutable reference until something
 * changes; rebuilding it per call would make the page's `[myConfigs]` effect
 * fire on every render and spin forever.
 */
let storedConfigsImmutable: any = null;

jest.mock('../../contexts/auth', () => ({
  useAuth: () => ({ user: { _id: 'u1', roles: ['admin'] } }),
}));

// The admin shell asks the API for the live RBAC overlay through a module the
// suite's global api mock does not reach, so stub the hook itself rather than
// let jsdom attempt a real request.
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

const expandCreditSection = async () => {
  await userEvent.click(screen.getByText('Credit'));
};

/** The card holding one array field, found by its label. */
const fieldSection = (label: string) => {
  const heading = screen.getByText(label);
  return heading.parentElement as HTMLElement;
};

describe('admin config — credit volume discounts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_FEATURE_CARROTS = 'true';
    storedConfigs = [
      { slug: 'general', value: { enabled: true, appName: 'tdf' } },
      { slug: 'credit', value: { enabled: true, creditPricePerUnit: 30 } },
    ];
    storedConfigsImmutable = fromJS(storedConfigs);
  });

  it('saves a volume discount tier the admin adds', async () => {
    renderWithNextIntl(<ConfigPage />);

    await expandCreditSection();

    const section = fieldSection('Volume discounts');
    await userEvent.click(
      within(section).getByRole('button', { name: /add entry/i }),
    );

    const inputs = within(section).getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: '10' } });
    fireEvent.change(inputs[1], { target: { value: '15' } });

    await userEvent.click(
      screen.getAllByRole('button', { name: /^save/i })[0],
    );

    await waitFor(() => expect(patch).toHaveBeenCalled());
    const [, body] = patch.mock.calls[0];
    expect(body.slug).toBe('credit');
    expect(body.value.volumeDiscounts).toEqual([
      { minCredits: '10', discountPercent: '15' },
    ]);
  });

  it('can delete the only credit package', async () => {
    // The delete button used to be hidden on the first row, which left a
    // village unable to withdraw a package it had stopped selling.
    storedConfigs = [
      { slug: 'general', value: { enabled: true, appName: 'tdf' } },
      {
        slug: 'credit',
        value: {
          enabled: true,
          packages: [{ title: 'A month stay', credits: '15' }],
        },
      },
    ];
    storedConfigsImmutable = fromJS(storedConfigs);

    renderWithNextIntl(<ConfigPage />);
    await expandCreditSection();

    const section = fieldSection('Packages');
    await userEvent.click(
      within(section).getByRole('button', { name: /delete/i }),
    );

    await userEvent.click(
      screen.getAllByRole('button', { name: /^save/i })[0],
    );

    await waitFor(() => expect(patch).toHaveBeenCalled());
    expect(patch.mock.calls[0][1].value.packages).toEqual([]);
  });
});
