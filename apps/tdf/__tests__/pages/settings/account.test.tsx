import { renderWithAuth } from '@/test/utils';

import { screen } from '@testing-library/react';

import AccountSettingsPage from '../../../pages/settings/account';

jest.mock('js-cookie', () => ({
  ...jest.requireActual('js-cookie'),
  get: () => '123456789',
}));

describe('AccountSettingsPage', () => {
  it('should render the account fields', async () => {
    renderWithAuth(<AccountSettingsPage />);

    expect(await screen.findByText(/Account Information/)).toBeInTheDocument();
    expect(
      await screen.findByLabelText('Full name (or business name)'),
    ).toBeInTheDocument();
  });
});
