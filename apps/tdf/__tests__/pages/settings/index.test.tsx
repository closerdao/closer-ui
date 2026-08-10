// write smoke test for /Users/vladislavsorokin/Webprojects/closerdao/traditionaldreamfactory.com/packages/closer/pages/settings/index.tsx
// Path: apps/tdf/__tests__/pages/settings/index.tsx
import { renderWithAuth } from '@/test/utils';

import { screen } from '@testing-library/react';

import SettingsPage from '../../../pages/settings';

jest.mock('js-cookie', () => ({
  ...jest.requireActual('js-cookie'),
  get: () => '123456789',
}));

describe('SettingsPage', () => {
  it('should render successfully', async () => {
    renderWithAuth(<SettingsPage />);

    expect(await screen.findByText(/Profile Information/)).toBeInTheDocument();
  });

  const fields = ['About you'];
  it.each(fields)('should render {var} field', async (field) => {
    renderWithAuth(<SettingsPage />);
    expect(await screen.findByLabelText(field)).toBeInTheDocument();
  });
});
