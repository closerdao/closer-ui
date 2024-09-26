// write smoke test for /Users/vladislavsorokin/Webprojects/closerdao/traditionaldreamfactory.com/packages/closer/pages/settings/index.tsx
// Path: apps/tdf/__tests__/pages/settings/index.tsx
import { renderWithProviders } from '@/test/utils';

import { screen } from '@testing-library/react';
import { AuthContext } from 'closer';

import ManageUsersPage from '../../../pages/admin/manage-users';
import { adminUser, user } from '../../mocks';

jest.mock('js-cookie', () => ({
  ...jest.requireActual('js-cookie'),
  get: () => '123456789',
}));

describe('SettingsPage', () => {
  it('should render "Page not found" if user does not have "admin" role', async () => {
    renderWithProviders(
      <AuthContext.Provider value={{ user: user as any }}>
        <ManageUsersPage />
      </AuthContext.Provider>,
    );

    expect(await screen.findByText(/Page not found/i)).toBeInTheDocument();
  });

  it('should render user list page successfully if user has "admin" role ', async () => {

    renderWithProviders(
      <AuthContext.Provider value={{ user: adminUser as any }}>
        <ManageUsersPage />
      </AuthContext.Provider>,
    );

    expect(await screen.findByText(/👀 User List/i)).toBeInTheDocument();
  });
});
