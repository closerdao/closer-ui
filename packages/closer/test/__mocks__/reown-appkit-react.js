module.exports = {
  useAppKit: () => ({ open: jest.fn(), close: jest.fn() }),
  useAppKitAccount: () => ({ address: undefined, isConnected: false, status: 'disconnected' }),
  useAppKitNetwork: () => ({ chainId: undefined, switchNetwork: jest.fn() }),
  useAppKitProvider: () => ({ walletProvider: undefined }),
  useDisconnect: () => ({ disconnect: jest.fn() }),
  useAppKitState: () => ({ initialized: false, loading: false, open: false }),
};
