import React from 'react';

import { fireEvent, screen, waitFor } from '@testing-library/react';

import { WalletDispatch, WalletState } from '../contexts/wallet';
import {
  defaultWalletDispatch,
  defaultWalletState,
} from '../contexts/wallet/hooks';
import Login from '../pages/login';
import api from '../utils/api';
import { renderWithNextIntl } from './utils';

const mockAuthenticate = jest.fn();
jest.mock('../contexts/auth', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    setAuthentification: mockAuthenticate,
    setError: jest.fn(),
  }),
}));
jest.mock('../components/TurnstileWidget', () => () => null);
jest.mock('../contexts/newsletter', () => ({ useNewsletter: () => ({}) }));

const address = '0x1111111111111111111111111111111111111111';
const actions = () => ({
  ...defaultWalletDispatch,
  connectWallet: jest.fn(async (): Promise<string | null> => address),
  getConnectedAccount: jest.fn((): string | null => address),
  signMessage: jest.fn(async () => 'signature'),
});

function renderLogin(dispatch: ReturnType<typeof actions>) {
  // Deliberately leave React's account empty: the SDK can resolve before its
  // hooks publish the selected account on the first connection.
  renderWithNextIntl(
    <WalletState.Provider
      value={{ ...defaultWalletState, initializationStatus: 'ready' }}
    >
      <WalletDispatch.Provider value={dispatch}>
        <Login />
      </WalletDispatch.Provider>
    </WalletState.Provider>,
  );
  return screen.getByRole('button', { name: /sign in with wallet/i });
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET = 'true';
  jest.spyOn(api, 'post').mockImplementation(async (path) =>
    path.endsWith('pre-sign')
      ? { data: { nonce: 'nonce' } }
      : {
          data: {
            results: { _id: 'member' },
            access_token: 'access',
            refresh_token: 'refresh',
          },
        },
  );
});

test('mobile login works without an injected wallet or a second click', async () => {
  expect((window as any).ethereum).toBeUndefined();
  const dispatch = actions();
  const button = renderLogin(dispatch);
  expect(button).toBeEnabled();
  fireEvent.click(button);
  await waitFor(() =>
    expect(mockAuthenticate).toHaveBeenCalledWith(
      { _id: 'member' },
      'access',
      'refresh',
    ),
  );
  expect(dispatch.connectWallet).toHaveBeenCalledTimes(1);
  expect(dispatch.signMessage).toHaveBeenCalledWith(
    'Signing in with code nonce',
    address,
  );
});

test('a cancelled connection never requests a login signature', async () => {
  const dispatch = actions();
  dispatch.connectWallet.mockResolvedValue(null);
  fireEvent.click(renderLogin(dispatch));
  await waitFor(() => expect(dispatch.connectWallet).toHaveBeenCalledTimes(1));
  expect(dispatch.signMessage).not.toHaveBeenCalled();
  expect(api.post).not.toHaveBeenCalled();
  expect(mockAuthenticate).not.toHaveBeenCalled();
});

test('an account changed while login is in flight cannot authenticate', async () => {
  const dispatch = actions();
  jest.spyOn(api, 'post').mockImplementation(async (path) => {
    if (path.endsWith('pre-sign')) return { data: { nonce: 'nonce' } };
    dispatch.getConnectedAccount.mockReturnValue(null);
    return { data: { results: { _id: 'member' }, access_token: 'access' } };
  });
  fireEvent.click(renderLogin(dispatch));
  await waitFor(() =>
    expect(api.post).toHaveBeenCalledWith(
      '/auth/web3/login',
      expect.anything(),
    ),
  );
  expect(mockAuthenticate).not.toHaveBeenCalled();
});
