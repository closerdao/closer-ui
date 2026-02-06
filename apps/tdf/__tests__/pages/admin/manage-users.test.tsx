import { renderWithProviders } from '@/test/utils';

import { screen } from '@testing-library/react';
import { AuthContext } from 'closer';
import { BookingConfig } from 'closer/types/api';

import ManageUsersPage from '../../../pages/admin/manage-users';
import { adminUser, user } from '../../mocks';

jest.mock('js-cookie', () => ({
  ...jest.requireActual('js-cookie'),
  get: () => '123456789',
}));

jest.mock('closer/utils/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn((url: string) => {
      if (url.includes('count')) return Promise.resolve({ data: { results: 0 } });
      return Promise.resolve({ data: { results: [] } });
    }),
    post: jest.fn(() => Promise.resolve({ data: {} })),
  },
}));

const mockBookingConfig: BookingConfig = {
  enabled: true,
  minDuration: 1,
  maxDuration: 30,
  maxBookingHorizon: 365,
  memberMinDuration: 1,
  memberMaxDuration: 180,
  memberMaxBookingHorizon: 365,
  discountsDaily: 0,
  seasonsHighModifier: 0.3,
  seasonsLowModifier: 0,
  cancellationPolicyLastDay: 0.5,
  cancellationPolicyLastWeek: 0.5,
  cancellationPolicyLastMonth: 0.75,
  cancellationPolicyDefault: 1,
  checkinTime: 14,
  checkoutTime: 11,
  utilityFiat: { val: 10, cur: 'EUR' },
  utilityToken: { val: 0.01, cur: 'ETH' },
  questions: [],
};

describe('ManageUsersPage', () => {
  it('should render "Page not found" if user does not have "admin" role', async () => {
    renderWithProviders(
      <AuthContext.Provider value={{ user: user as any, isAuthenticated: true, login: jest.fn(), setAuthentification: jest.fn(), isLoading: false, logout: jest.fn(), signup: jest.fn(), resetPassword: jest.fn(), updateProfile: jest.fn(), deleteAccount: jest.fn(), connectWallet: jest.fn(), disconnectWallet: jest.fn(), isWalletConnected: false, walletAddress: null, nonce: null, verifyWallet: jest.fn() }}>
        <ManageUsersPage bookingConfig={mockBookingConfig} />
      </AuthContext.Provider>,
    );

    expect(await screen.findByText(/Page not found/i)).toBeInTheDocument();
  });

  it('should render user list page successfully if user has "admin" role ', async () => {

    renderWithProviders(
      <AuthContext.Provider value={{ user: adminUser as any, isAuthenticated: true, login: jest.fn(), setAuthentification: jest.fn(), isLoading: false, logout: jest.fn(), signup: jest.fn(), resetPassword: jest.fn(), updateProfile: jest.fn(), deleteAccount: jest.fn(), connectWallet: jest.fn(), disconnectWallet: jest.fn(), isWalletConnected: false, walletAddress: null, nonce: null, verifyWallet: jest.fn() }}>
        <ManageUsersPage bookingConfig={mockBookingConfig} />
      </AuthContext.Provider>,
    );

    expect(await screen.findByRole('heading', { name: /User Management/i })).toBeInTheDocument();
  });
});
