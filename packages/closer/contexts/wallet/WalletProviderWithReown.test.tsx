import { useContext } from 'react';

import { act, render, waitFor } from '@testing-library/react';

import { linkWallet } from '../../utils/user';
import { WalletProviderWithReown } from './WalletProviderWithReown';
import { WalletDispatchContext } from './hooks';

const ADDRESS = '0x1111111111111111111111111111111111111111';

let appKit: { walletProvider: any; address?: string; isConnected: boolean };
const open = jest.fn(async () => undefined);

jest.mock('@reown/appkit/react', () => ({
  useAppKit: () => ({ open }),
  useAppKitAccount: () => ({
    address: appKit.address,
    isConnected: appKit.isConnected,
  }),
  useAppKitNetwork: () => ({ chainId: 42220, switchNetwork: jest.fn() }),
  useAppKitProvider: () => ({ walletProvider: appKit.walletProvider }),
  useAppKitState: () => ({ open: false }),
}));

jest.mock('swr', () => ({
  __esModule: true,
  default: (_key: unknown, options?: { fallbackData?: unknown }) => ({
    data: options?.fallbackData,
    mutate: jest.fn(),
  }),
}));

const user = { _id: 'u1', walletAddress: undefined };
jest.mock('../auth', () => ({
  useAuth: () => ({ user, refetchUser: jest.fn(async () => undefined) }),
}));

jest.mock('../../utils/auth', () => ({
  walletNonce: jest.fn(async () => ({ nonce: 'n1' })),
}));

jest.mock('../../utils/user', () => ({
  linkWallet: jest.fn(async () => ({})),
}));

const connectedProvider = () => ({
  request: jest.fn(async ({ method }: { method: string }) =>
    method === 'personal_sign' ? '0xsigned' : null,
  ),
});

let dispatch: any;
const Capture = () => {
  dispatch = useContext(WalletDispatchContext);
  return null;
};

const renderProvider = () =>
  render(
    <WalletProviderWithReown>
      <Capture />
    </WalletProviderWithReown>,
  );

describe('WalletProviderWithReown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    appKit = { walletProvider: undefined, isConnected: false };
  });

  it('signs with the provider connected after the caller took signMessage', async () => {
    const { rerender } = renderProvider();
    const { signMessage } = dispatch;

    const provider = connectedProvider();
    appKit = { walletProvider: provider, address: ADDRESS, isConnected: true };
    rerender(
      <WalletProviderWithReown>
        <Capture />
      </WalletProviderWithReown>,
    );

    await expect(signMessage('hello', ADDRESS)).resolves.toBe('0xsigned');
    expect(provider.request).toHaveBeenCalledWith({
      method: 'personal_sign',
      params: ['hello', ADDRESS],
    });
  });

  it('links the wallet with the provider the modal connected', async () => {
    const { rerender } = renderProvider();
    const { connectWallet } = dispatch;

    const connected: Promise<string | null> = connectWallet();
    await waitFor(() => expect(open).toHaveBeenCalled());

    const provider = connectedProvider();
    appKit = { walletProvider: provider, address: ADDRESS, isConnected: true };
    await act(async () => {
      rerender(
        <WalletProviderWithReown>
          <Capture />
        </WalletProviderWithReown>,
      );
    });

    await expect(connected).resolves.toBe(ADDRESS);
    expect(provider.request).toHaveBeenCalledWith({
      method: 'personal_sign',
      params: ['Signing in with code n1', ADDRESS],
    });
    expect(linkWallet).toHaveBeenCalledWith({
      signedMessage: '0xsigned',
      walletAddress: ADDRESS,
      message: 'Signing in with code n1',
    });
  });
});
