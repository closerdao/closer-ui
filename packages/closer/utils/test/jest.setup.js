// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`
// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom/extend-expect';
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

jest.mock('p-try');

jest.mock('../../contexts/wallet/wagmiConfig', () => ({
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
  WagmiProvider: ({ children }) => children,
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
  RainbowKitProvider: ({ children }) => children,
  ConnectButton: {
    Custom: ({ children }) => children({ openConnectModal: jest.fn() }),
  },
  darkTheme: () => ({}),
  getDefaultConfig: jest.fn(() => ({})),
}));

jest.mock('@tanstack/react-query', () => ({
  QueryClient: jest.fn().mockImplementation(() => ({})),
  QueryClientProvider: ({ children }) => children,
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

jest.mock('../../firebaseConfig', () => ({
  auth: {
    currentUser: null,
  },
}));
