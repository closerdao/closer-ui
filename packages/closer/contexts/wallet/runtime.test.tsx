import React from 'react';

import { act, render } from '@testing-library/react';
import { BigNumber } from 'ethers';
import useSWR from 'swr';

import { appKit } from '../../appkit';
import api from '../../utils/api';
import { WalletProviderWithReown } from './WalletProviderWithReown';

let mockAccount: string | undefined;
let mockProvider: any;
let mockChain = 42220;
let mockUser: any;
const mockListeners = new Set<() => void>();
const mockMutate = jest.fn(async () => {});
const mockZero = BigNumber.from(0);
let mockBalancePending = false;
// Ethers performs its own asynchronous network detection. Isolate the runtime's
// switch verification from those unrelated background reads.
jest.mock('@ethersproject/providers', () => ({
  ...jest.requireActual('@ethersproject/providers'),
  Web3Provider: jest.fn(() => ({ getBalance: jest.fn() })),
}));
jest.mock('../../utils/api', () => ({
  __esModule: true,
  default: { post: jest.fn(), get: jest.fn() },
}));
jest.mock('../auth', () => ({
  useAuth: () => ({
    user: mockUser,
    setUser: (user: any) => {
      mockUser = user;
    },
  }),
}));
jest.mock('../../utils/posthog', () => ({ trackEvent: jest.fn() }));
jest.mock('../../appkit', () => ({
  appKitReady: Promise.resolve(),
  celoMainnet: { id: 42220 },
  celoSepolia: { id: 11142220 },
  appKit: {
    getAccount: () => ({
      address: mockAccount,
      isConnected: Boolean(mockAccount),
    }),
    getWalletProvider: () => mockProvider,
    getChainId: () => mockChain,
    open: jest.fn(async () => {}),
    switchNetwork: jest.fn(async () => {}),
    subscribeAccount: (listener: () => void) => {
      mockListeners.add(listener);
      return () => mockListeners.delete(listener);
    },
    subscribeProviders: (listener: () => void) => {
      mockListeners.add(listener);
      return () => mockListeners.delete(listener);
    },
    subscribeEvents: () => () => {},
  },
}));
jest.mock('@reown/appkit/react', () => ({
  useAppKitAccount: () => ({
    address: mockAccount,
    isConnected: Boolean(mockAccount),
  }),
  useAppKitProvider: () => ({ walletProvider: mockProvider }),
  useAppKitNetwork: () => ({ chainId: mockChain }),
  useAppKitState: () => ({ open: false }),
}));
jest.mock('../../config_blockchain', () => ({
  blockchainConfig: {
    BLOCKCHAIN_NETWORK_ID: 42220,
    BLOCKCHAIN_DAO_DIAMOND_ADDRESS:
      '0x1111111111111111111111111111111111111111',
    BLOCKCHAIN_DAO_TOKEN: { address: 'dao-token', decimals: 18 },
    BLOCKCHAIN_CEUR_TOKEN: { address: 'reserve-token', decimals: 18 },
    BLOCKCHAIN_CELO_TOKEN: { address: 'celo-token', decimals: 18 },
    BLOCKCHAIN_NATIVE_TOKEN: { decimals: 18 },
    BLOCKCHAIN_PRESENCE_TOKEN: { address: 'presence', decimals: 18 },
  },
}));
jest.mock('swr', () => ({
  __esModule: true,
  default: jest.fn((key: any) => ({
    data:
      !key || mockBalancePending || key.includes('getAccommodationYears')
        ? undefined
        : mockZero,
    mutate: mockMutate,
  })),
}));

const address = '0x1111111111111111111111111111111111111111';
beforeEach(() => {
  jest.clearAllMocks();
  (appKit!.switchNetwork as jest.Mock).mockReset();
  (appKit!.open as jest.Mock).mockReset();
  (appKit!.open as jest.Mock).mockResolvedValue(undefined);
  mockListeners.clear();
  mockAccount = undefined;
  mockProvider = undefined;
  mockChain = 42220;
  mockUser = { _id: 'member' };
  mockBalancePending = false;
  jest
    .spyOn(api, 'post')
    .mockImplementation(async (path) =>
      path.endsWith('pre-sign')
        ? { data: { nonce: 'nonce' } }
        : { data: { results: { _id: 'member', walletAddress: address } } },
    );
  jest.spyOn(api, 'get').mockResolvedValue({
    data: { results: { _id: 'member', walletAddress: address } },
  });
});

test('the real React runtime signs with the provider that arrives after connect was clicked', async () => {
  const publish = jest.fn();
  const view = render(<WalletProviderWithReown publish={publish} />);
  const dispatch = () => publish.mock.calls.at(-1)![1];
  let pending!: Promise<string | null>;
  await act(async () => {
    pending = dispatch().connectWallet();
  });
  expect(appKit!.open).toHaveBeenCalledTimes(1);
  mockAccount = address;
  await act(async () => {
    mockListeners.forEach((listener) => listener());
  });
  view.rerender(<WalletProviderWithReown publish={publish} />);
  expect(api.post).not.toHaveBeenCalled();
  mockProvider = { request: jest.fn(async () => 'signature') };
  await act(async () => {
    mockListeners.forEach((listener) => listener());
    await pending;
  });
  view.rerender(<WalletProviderWithReown publish={publish} />);
  expect(await pending).toBe(address);
  expect(mockProvider.request).toHaveBeenCalledWith({
    method: 'personal_sign',
    params: ['Signing in with code nonce', address],
  });
  expect(publish.mock.calls.at(-1)![0].isWalletReady).toBe(true);
});

test('balances remain loading until known and every read is scoped to the actual chain', () => {
  mockAccount = address;
  mockProvider = { request: jest.fn() };
  mockUser.walletAddress = address;
  mockBalancePending = true;
  const publish = jest.fn();
  const view = render(<WalletProviderWithReown publish={publish} />);
  expect(publish.mock.calls.at(-1)![0].balanceStatus).toBe('loading');
  const keys = (useSWR as jest.Mock).mock.calls
    .map(([key]) => key)
    .filter(Boolean);
  expect(keys.length).toBeGreaterThan(0);
  keys.forEach((key) => expect(key[0]).toBe(42220));
  mockBalancePending = false;
  view.rerender(<WalletProviderWithReown publish={publish} />);
  expect(publish.mock.calls.at(-1)![0].balanceStatus).toBe('ready');
  mockChain = 1;
  (useSWR as jest.Mock).mockClear();
  view.rerender(<WalletProviderWithReown publish={publish} />);
  expect(publish.mock.calls.at(-1)![0].isWalletReady).toBe(false);
  expect(publish.mock.calls.at(-1)![0].balanceStatus).toBe('idle');
  expect((useSWR as jest.Mock).mock.calls.every(([key]) => key === null)).toBe(
    true,
  );
});

test('switches through AppKit once, reports failure, and permits a later retry', async () => {
  mockAccount = address;
  mockProvider = { request: jest.fn(async () => '0xa4ec') };
  mockChain = 1;
  let reject!: (error: Error) => void;
  (appKit!.switchNetwork as jest.Mock).mockImplementationOnce(
    () =>
      new Promise((_resolve, no) => {
        reject = no;
      }),
  );
  const publish = jest.fn();
  render(<WalletProviderWithReown publish={publish} />);
  const dispatch = publish.mock.calls.at(-1)![1];
  let first!: Promise<void>;
  await act(async () => {
    first = dispatch.switchNetwork();
    expect(dispatch.switchNetwork()).toBe(first);
  });
  await act(async () => {
    reject(new Error('rejected'));
    await first;
  });
  expect(appKit!.switchNetwork).toHaveBeenCalledTimes(1);
  expect(publish.mock.calls.at(-1)![0].error.code).toBe('network_failed');
  (appKit!.switchNetwork as jest.Mock).mockImplementationOnce(async () => {
    mockChain = 42220;
  });
  await act(async () => {
    await dispatch.switchNetwork();
  });
  expect(appKit!.switchNetwork).toHaveBeenLastCalledWith(
    { id: 42220 },
    { throwOnFailure: true },
  );
  expect(publish.mock.calls.at(-1)![0].error).toBeNull();
  expect(
    mockProvider.request.mock.calls.some(
      ([request]: any[]) =>
        request.method === 'wallet_switchEthereumChain' ||
        request.method === 'wallet_addEthereumChain',
    ),
  ).toBe(false);
});

function connectedWallet(initialChain = 1) {
  let actualChain = initialChain;
  const listeners = new Set<() => void>();
  const provider = {
    request: jest.fn(async ({ method, params }: any) => {
      if (method === 'eth_chainId') return `0x${actualChain.toString(16)}`;
      if (method === 'wallet_switchEthereumChain') {
        actualChain = Number(params[0].chainId);
        return null;
      }
      throw new Error(`Unexpected request: ${method}`);
    }),
    on: jest.fn((_event: string, listener: () => void) =>
      listeners.add(listener),
    ),
    removeListener: jest.fn((_event: string, listener: () => void) =>
      listeners.delete(listener),
    ),
  };
  mockAccount = address;
  mockUser.walletAddress = address;
  mockChain = initialChain;
  mockProvider = provider;
  return {
    provider,
    setChain: (chain: number) => {
      actualChain = chain;
    },
    emitChainChanged: () => listeners.forEach((listener) => listener()),
  };
}

function runtime() {
  const publish = jest.fn();
  const view = render(<WalletProviderWithReown publish={publish} />);
  return {
    state: () => publish.mock.calls.at(-1)![0],
    dispatch: () => publish.mock.calls.at(-1)![1],
    rerender: () =>
      view.rerender(<WalletProviderWithReown publish={publish} />),
    unmount: view.unmount,
  };
}

test('ordinary connection and external network changes continue using Reown without extra RPCs', async () => {
  const wallet = connectedWallet(42220);
  const view = runtime();
  await act(async () => {
    expect(await view.dispatch().connectWallet()).toBe(address);
  });
  expect(view.state().isWalletReady).toBe(true);
  mockChain = 1;
  view.rerender();
  expect(view.state().isCorrectNetwork).toBe(false);
  expect(wallet.provider.request).not.toHaveBeenCalled();
  expect(wallet.provider.on).not.toHaveBeenCalled();
  expect(appKit!.switchNetwork).not.toHaveBeenCalled();
});

test('a successful AppKit switch, including auto-selection after adding, needs only one verification', async () => {
  const wallet = connectedWallet();
  let confirm!: () => void;
  (appKit!.switchNetwork as jest.Mock).mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        confirm = () => {
          wallet.setChain(42220);
          mockChain = 42220;
          resolve();
        };
      }),
  );
  const view = runtime();
  let pending!: Promise<void>;
  await act(async () => {
    pending = view.dispatch().switchNetwork();
  });
  expect(view.state().isWalletSwitchingNetwork).toBe(true);
  await act(async () => {
    confirm();
    await pending;
  });
  expect(wallet.provider.request.mock.calls).toEqual([
    [{ method: 'eth_chainId' }],
  ]);
  expect(view.state()).toMatchObject({
    chainId: 42220,
    isCorrectNetwork: true,
    isWalletConnected: true,
    hasSameConnectedAccount: true,
    isWalletReady: true,
    isWalletSwitchingNetwork: false,
    error: null,
  });
});

test('adding without selecting requires a follow-up switch and blocks reads until verification', async () => {
  const wallet = connectedWallet();
  let finishSwitch!: () => void;
  let didSwitch = false;
  wallet.provider.request.mockImplementation(async ({ method }: any) => {
    if (method === 'wallet_switchEthereumChain') {
      await new Promise<void>((resolve) => {
        finishSwitch = resolve;
      });
      didSwitch = true;
      return null;
    }
    return didSwitch ? '0xa4ec' : '0x1';
  });
  (appKit!.switchNetwork as jest.Mock).mockImplementation(async () => {
    // AppKit selected Celo after adding it, but the provider is still on Ethereum.
    mockChain = 42220;
  });
  const view = runtime();
  (useSWR as jest.Mock).mockClear();
  let pending!: Promise<void>;
  await act(async () => {
    pending = view.dispatch().switchNetwork();
  });
  expect(view.state()).toMatchObject({
    chainId: 42220,
    isCorrectNetwork: false,
    isWalletReady: false,
    isWalletSwitchingNetwork: true,
    balanceStatus: 'idle',
  });
  expect((useSWR as jest.Mock).mock.calls.every(([key]) => key === null)).toBe(
    true,
  );
  await act(async () => {
    finishSwitch();
    await pending;
  });
  expect(wallet.provider.request.mock.calls).toEqual([
    [{ method: 'eth_chainId' }],
    [{ method: 'wallet_switchEthereumChain', params: [{ chainId: '0xa4ec' }] }],
    [{ method: 'eth_chainId' }],
  ]);
  expect(view.state().isWalletReady).toBe(true);
});

test.each(['rejected', 'wrong chain', 'verification failed'])(
  'a %s recovery stays blocked despite AppKit reporting Celo, until a verified retry',
  async (failure) => {
    const wallet = connectedWallet();
    (appKit!.switchNetwork as jest.Mock).mockImplementation(async () => {
      mockChain = 42220;
    });
    wallet.provider.request.mockImplementation(async ({ method }: any) => {
      if (
        failure === 'verification failed' ||
        (failure === 'rejected' && method === 'wallet_switchEthereumChain')
      )
        throw new Error('Wallet failure');
      return method === 'eth_chainId' ? '0x1' : null;
    });
    const view = runtime();
    await act(async () => {
      await view.dispatch().switchNetwork();
    });
    expect(view.state()).toMatchObject({
      chainId: 42220,
      isCorrectNetwork: false,
      isWalletReady: false,
      isWalletSwitchingNetwork: false,
      balanceStatus: 'idle',
      error: { code: 'network_failed' },
    });
    // Connecting an already-linked wallet clears connection errors, not this failure.
    await act(async () => {
      await view.dispatch().connectWallet();
    });
    expect(view.state().isWalletReady).toBe(false);
    expect(view.state().error.code).toBe('network_failed');
    wallet.provider.request.mockResolvedValue('0xa4ec');
    await act(async () => {
      await view.dispatch().switchNetwork();
    });
    expect(view.state().isWalletReady).toBe(true);
    expect(view.state().error).toBeNull();
  },
);

test('manual network changes recover a failed switch only after verification, then remove the listener', async () => {
  const wallet = connectedWallet();
  (appKit!.switchNetwork as jest.Mock).mockRejectedValue(new Error('Rejected'));
  const view = runtime();
  await act(async () => {
    await view.dispatch().switchNetwork();
  });
  expect(wallet.provider.on).toHaveBeenCalledWith(
    'chainChanged',
    expect.any(Function),
  );
  // SDK state alone cannot release the failure guard.
  mockChain = 42220;
  await act(async () => {
    wallet.emitChainChanged();
  });
  expect(view.state().isWalletReady).toBe(false);
  wallet.setChain(42220);
  await act(async () => {
    wallet.emitChainChanged();
  });
  expect(view.state().isWalletReady).toBe(true);
  expect(view.state().error).toBeNull();
  expect(wallet.provider.removeListener).toHaveBeenCalledWith(
    'chainChanged',
    expect.any(Function),
  );
});

test.each(['resolve', 'reject'])(
  'an old provider switch that later %ss cannot finish or fail a replacement wallet switch',
  async (outcome) => {
    const oldWallet = connectedWallet();
    let resolveOld!: () => void;
    let rejectOld!: (error: Error) => void;
    let resolveNew!: () => void;
    (appKit!.switchNetwork as jest.Mock)
      .mockImplementationOnce(
        () =>
          new Promise<void>((yes, no) => {
            resolveOld = yes;
            rejectOld = no;
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise<void>((yes) => {
            resolveNew = yes;
          }),
      );
    const view = runtime();
    let oldPending!: Promise<void>;
    let newPending!: Promise<void>;
    await act(async () => {
      oldPending = view.dispatch().switchNetwork();
    });
    connectedWallet(42220);
    view.rerender();
    await act(async () => {
      newPending = view.dispatch().switchNetwork();
    });
    await act(async () => {
      if (outcome === 'resolve') resolveOld();
      else rejectOld(new Error('Old wallet rejected'));
      await oldPending;
    });
    expect(view.state().isWalletSwitchingNetwork).toBe(true);
    expect(view.state().error).toBeNull();
    expect(oldWallet.provider.request).not.toHaveBeenCalled();
    await act(async () => {
      resolveNew();
      await newPending;
    });
    expect(view.state().isWalletReady).toBe(true);
  },
);

test.each(['replace', 'disconnect', 'unmount'])(
  '%s cleans up failure recovery and ignores a pending verification',
  async (change) => {
    const wallet = connectedWallet();
    (appKit!.switchNetwork as jest.Mock).mockRejectedValue(
      new Error('Rejected'),
    );
    const view = runtime();
    await act(async () => {
      await view.dispatch().switchNetwork();
    });
    let resolve!: (value: string) => void;
    wallet.provider.request.mockImplementation(
      () =>
        new Promise((yes) => {
          resolve = yes;
        }),
    );
    await act(async () => {
      wallet.emitChainChanged();
    });
    if (change === 'unmount') view.unmount();
    else {
      if (change === 'replace') connectedWallet();
      else {
        mockAccount = undefined;
        mockProvider = undefined;
      }
      view.rerender();
      expect(view.state().error).toBeNull();
      if (change === 'replace') {
        await act(async () => {
          await view.dispatch().switchNetwork();
        });
      }
    }
    expect(wallet.provider.removeListener).toHaveBeenCalledWith(
      'chainChanged',
      expect.any(Function),
    );
    await act(async () => {
      resolve('0xa4ec');
    });
    if (change === 'replace')
      expect(view.state().error.code).toBe('network_failed');
    if (change === 'disconnect') expect(view.state().isWalletReady).toBe(false);
  },
);

test.each(['replacement', 'account change'])(
  '%s clears an account mismatch only once the linked wallet is connected',
  async (recovery) => {
    connectedWallet(42220);
    mockUser.walletAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
    const view = runtime();
    await act(async () => {
      await view.dispatch().connectWallet();
    });
    expect(view.state().error.code).toBe('account_mismatch');
    if (recovery === 'replacement') {
      await act(async () => {
        await view.dispatch().selectWallet();
      });
      view.rerender();
      expect(view.state().error.code).toBe('account_mismatch');
    }
    mockAccount = mockUser.walletAddress.toUpperCase();
    view.rerender();
    expect(view.state().error).toBeNull();
    expect(view.state().isWalletReady).toBe(true);
    expect(api.post).not.toHaveBeenCalled();
  },
);

test('matching the profile wallet does not clear an unrelated connection error', async () => {
  connectedWallet(42220);
  (appKit!.open as jest.Mock).mockRejectedValue(new Error('Modal failed'));
  const view = runtime();
  await act(async () => {
    await view.dispatch().selectWallet();
  });
  mockAccount = address.toUpperCase();
  view.rerender();
  expect(view.state().error.code).toBe('connection_failed');
});

test('the same recovery uses Celo Sepolia when that network is configured', async () => {
  let SepoliaRuntime!: typeof WalletProviderWithReown;
  let sdk: any;
  // Configuration is read when the module loads; keep React's renderer instance
  // while loading a runtime with the other supported network configuration.
  jest.isolateModules(() => {
    jest.doMock('react', () => React);
    const config = require('../../config_blockchain').blockchainConfig;
    const originalNetwork = config.BLOCKCHAIN_NETWORK_ID;
    try {
      config.BLOCKCHAIN_NETWORK_ID = 11142220;
      SepoliaRuntime =
        require('./WalletProviderWithReown').WalletProviderWithReown;
      sdk = require('../../appkit').appKit;
    } finally {
      config.BLOCKCHAIN_NETWORK_ID = originalNetwork;
      jest.dontMock('react');
    }
  });
  const wallet = connectedWallet();
  let confirm!: () => void;
  sdk.switchNetwork.mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        confirm = () => {
          mockChain = 11142220;
          resolve();
        };
      }),
  );
  const publish = jest.fn();
  render(<SepoliaRuntime publish={publish} />);
  let pending!: Promise<void>;
  await act(async () => {
    pending = publish.mock.calls.at(-1)![1].switchNetwork();
  });
  await act(async () => {
    confirm();
    await pending;
  });
  expect(sdk.switchNetwork).toHaveBeenCalledWith(
    { id: 11142220 },
    { throwOnFailure: true },
  );
  expect(wallet.provider.request.mock.calls).toEqual([
    [{ method: 'eth_chainId' }],
    [
      {
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa044c' }],
      },
    ],
    [{ method: 'eth_chainId' }],
  ]);
  expect(publish.mock.calls.at(-1)![0]).toMatchObject({
    chainId: 11142220,
    isCorrectNetwork: true,
    isWalletConnected: true,
    hasSameConnectedAccount: true,
    isWalletReady: true,
    isWalletSwitchingNetwork: false,
    error: null,
  });
});
