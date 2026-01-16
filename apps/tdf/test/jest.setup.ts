import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { TextEncoder, TextDecoder } from 'util';

import { server } from './server';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

jest.mock('closer/contexts/wallet/wagmiConfig', () => ({
  wagmiConfig: {},
  targetChainId: 44787,
  targetChain: { id: 44787, name: 'Alfajores' },
}));

jest.mock('wagmi', () => ({
  useAccount: () => ({ address: undefined, isConnected: false }),
  useChainId: () => 44787,
  usePublicClient: () => null,
  useWalletClient: () => ({ data: null }),
  useSwitchChain: () => ({ switchChain: jest.fn() }),
  WagmiProvider: ({ children }: { children: React.ReactNode }) => children,
  createConfig: jest.fn(() => ({})),
  http: jest.fn(),
  cookieStorage: {},
  createStorage: jest.fn(() => ({})),
}));

jest.mock('wagmi/connectors', () => ({
  injected: jest.fn(() => ({})),
  coinbaseWallet: jest.fn(() => ({})),
}));

jest.mock('wagmi/chains', () => ({
  celo: { id: 42220, name: 'Celo' },
  celoAlfajores: { id: 44787, name: 'Alfajores' },
}));

jest.mock('viem', () => ({
  formatUnits: jest.fn((val) => String(val)),
  parseUnits: jest.fn((val) => BigInt(val)),
  parseEther: jest.fn((val) => BigInt(val)),
  formatEther: jest.fn((val) => String(val)),
  createPublicClient: jest.fn(() => ({})),
  http: jest.fn(),
  encodeFunctionData: jest.fn(() => '0x'),
}));

jest.mock('@rainbow-me/rainbowkit', () => ({
  useConnectModal: () => ({ openConnectModal: jest.fn() }),
  RainbowKitProvider: ({ children }: { children: React.ReactNode }) => children,
  ConnectButton: {
    Custom: ({ children }: { children: (props: any) => React.ReactNode }) => 
      children({ openConnectModal: jest.fn() }),
  },
  darkTheme: () => ({}),
  getDefaultConfig: jest.fn(() => ({})),
}));

jest.mock('@tanstack/react-query', () => ({
  QueryClient: jest.fn().mockImplementation(() => ({})),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@divvi/referral-sdk', () => ({
  getDataSuffix: jest.fn(() => '0x'),
  submitReferral: jest.fn(),
}));

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
  getApp: jest.fn(() => ({})),
  getApps: jest.fn(() => [{ name: '[DEFAULT]' }]),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: null,
  })),
  signOut: jest.fn(() => Promise.resolve()),
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  onAuthStateChanged: jest.fn((auth, callback) => {
    callback(null);
    return jest.fn();
  }),
}));

jest.mock('closer/firebaseConfig', () => ({
  auth: {
    currentUser: null,
  },
}));

// Establish API mocking before all tests.
beforeAll(() => server.listen());
// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => server.resetHandlers());
// Clean up after the tests are finished.
afterAll(() => {
  cleanup();
  server.close();
});
