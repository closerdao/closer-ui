import { renderWithProviders } from '@/test/utils';

import { screen } from '@testing-library/react';
import { AuthContext } from 'closer';

import ManageUsersPage from '../../../pages/admin/manage-users';
import { adminUser, user } from '../../mocks';

jest.mock('js-cookie', () => ({
  ...jest.requireActual('js-cookie'),
  get: () => '123456789',
}));

const mockHasAccess = jest.fn((_page: string) => false);

jest.mock('closer/hooks/useRBAC', () => ({
  __esModule: true,
  default: () => ({
    hasAccess: (page: string) => mockHasAccess(page),
    rbacLiveRevision: 0,
  }),
}));

jest.mock('closer/utils/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn((url: string) => {
      if (url.includes('count'))
        return Promise.resolve({ data: { results: 0 } });
      return Promise.resolve({ data: { results: [] } });
    }),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    defaults: { headers: {} },
    setOnSessionInvalid: jest.fn(),
    refreshTokensProactively: jest.fn(() => Promise.resolve(null)),
  },
  setOnSessionInvalid: jest.fn(),
  refreshTokensProactively: jest.fn(() => Promise.resolve(null)),
}));

describe('ManageUsersPage', () => {
  beforeEach(() => {
    mockHasAccess.mockImplementation(() => false);
  });

  it('should render "Page not found" if user does not have "admin" role', async () => {
    renderWithProviders(
      <AuthContext.Provider
        value={{
          user: user as any,
          isAuthenticated: true,
          login: jest.fn(),
          setAuthentification: jest.fn(),
          isLoading: false,
          logout: jest.fn(),
          error: null,
          signup: jest.fn(),
          completeRegistration: jest.fn(),
          updatePassword: jest.fn(),
          setUser: jest.fn(),
          setError: jest.fn(),
          loadUserFromCookies: jest.fn(),
          refetchUser: jest.fn(),
          hasSignedUp: false,
          isGoogleLoading: false,
          authGoogle: jest.fn(),
        }}
      >
        <ManageUsersPage />
      </AuthContext.Provider>,
    );

    expect(await screen.findByText(/Page not found/i)).toBeInTheDocument();
  });

  it('should render user list page successfully if user has "admin" role ', async () => {
    mockHasAccess.mockImplementation(
      (page: string) => page === 'UserManagement',
    );

    renderWithProviders(
      <AuthContext.Provider
        value={{
          user: adminUser as any,
          isAuthenticated: true,
          login: jest.fn(),
          setAuthentification: jest.fn(),
          isLoading: false,
          logout: jest.fn(),
          error: null,
          signup: jest.fn(),
          completeRegistration: jest.fn(),
          updatePassword: jest.fn(),
          setUser: jest.fn(),
          setError: jest.fn(),
          loadUserFromCookies: jest.fn(),
          refetchUser: jest.fn(),
          hasSignedUp: false,
          isGoogleLoading: false,
          authGoogle: jest.fn(),
        }}
      >
        <ManageUsersPage />
      </AuthContext.Provider>,
    );

    expect(
      await screen.findByRole('heading', { name: /User Management/i }),
    ).toBeInTheDocument();
  });
});
