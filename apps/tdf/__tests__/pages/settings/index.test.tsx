// write smoke test for /Users/vladislavsorokin/Webprojects/closerdao/traditionaldreamfactory.com/packages/closer/pages/settings/index.tsx
// Path: apps/tdf/__tests__/pages/settings/index.tsx
import { renderWithAuth } from '@/test/utils';

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SettingsPage from '../../../pages/settings';

jest.mock('js-cookie', () => ({
  ...jest.requireActual('js-cookie'),
  get: () => '123456789',
}));

describe('SettingsPage', () => {
  it('should render successfully', async () => {
    renderWithAuth(<SettingsPage />);

    expect(
      await screen.findByText(/Recommended Preferences/),
    ).toBeInTheDocument();
  });

  const fields = ['What is your superpower?', 'What do you dream of creating?'];
  it.each(fields)('should render %s field', async (field) => {
    renderWithAuth(<SettingsPage />);
    expect(await screen.findByLabelText(field)).toBeInTheDocument();
  });

  it('should show account fields when switching to the Account tab', async () => {
    renderWithAuth(<SettingsPage />);

    // The tab appears twice — desktop sidebar and mobile selector are both in
    // the DOM, only hidden by CSS.
    const [accountTab] = await screen.findAllByRole('button', {
      name: 'Account',
    });
    await userEvent.click(accountTab);

    expect(await screen.findByText(/Account Information/)).toBeInTheDocument();
    expect(
      await screen.findByLabelText('Full name (or business name)'),
    ).toBeInTheDocument();
  });
});
