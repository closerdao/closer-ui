import { renderWithAuth } from '@/test/utils';

import { screen } from '@testing-library/react';

import PreferencesSettingsPage from '../../../pages/settings/preferences';

jest.mock('js-cookie', () => ({
  ...jest.requireActual('js-cookie'),
  get: () => '123456789',
}));

describe('PreferencesSettingsPage', () => {
  it('should render successfully', async () => {
    renderWithAuth(<PreferencesSettingsPage />);

    expect(
      await screen.findByText(/Recommended Preferences/),
    ).toBeInTheDocument();
  });

  const fields = ['What is your superpower?', 'What do you dream of creating?'];
  it.each(fields)('should render %s field', async (field) => {
    renderWithAuth(<PreferencesSettingsPage />);
    expect(await screen.findByLabelText(field)).toBeInTheDocument();
  });

  it('should link to the other settings sections', async () => {
    renderWithAuth(<PreferencesSettingsPage />);

    // The nav renders twice — desktop sidebar and mobile selector are both in
    // the DOM, only hidden by CSS.
    const [accountLink] = await screen.findAllByRole('link', {
      name: 'Account',
    });
    expect(accountLink).toHaveAttribute('href', '/settings/account');
  });
});
