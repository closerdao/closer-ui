import { renderWithAuth } from '@/test/utils';

import { waitFor } from '@testing-library/react';
import Router from 'next-router-mock';

import SettingsPage from '../../../pages/settings';

jest.mock('js-cookie', () => ({
  ...jest.requireActual('js-cookie'),
  get: () => '123456789',
}));

describe('SettingsPage', () => {
  it('sends /settings to the first section', async () => {
    renderWithAuth(<SettingsPage />, { route: '/settings' });

    await waitFor(() =>
      expect(Router.asPath).toEqual('/settings/preferences'),
    );
  });

  const legacyHashes: [string, string][] = [
    ['/settings#account', '/settings/account'],
    ['/settings#subscription', '/settings/subscription'],
    ['/settings#notifications', '/settings/notifications'],
    ['/settings/#recommended', '/settings/preferences'],
  ];

  it.each(legacyHashes)('translates %s to %s', async (from, to) => {
    renderWithAuth(<SettingsPage />, { route: from });

    await waitFor(() => expect(Router.asPath).toEqual(to));
  });
});
