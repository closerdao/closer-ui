// write smoke test for /Users/vladislavsorokin/Webprojects/closerdao/traditionaldreamfactory.com/packages/closer/pages/settings/index.tsx
// Path: apps/tdf/__tests__/pages/settings/index.tsx
import React from 'react';

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

    expect(await screen.findByText(/Your Info/)).toBeInTheDocument();
  });

  const fields = ['Name', 'Email'];
  it.each(fields)('should render %s field', async (field) => {
    renderWithAuth(<SettingsPage />);
    expect(await screen.findByLabelText(field)).toBeInTheDocument();
  });
});
