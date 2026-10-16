import { act, renderHook, waitFor } from '@testing-library/react';
import { BigNumber, Contract, providers } from 'ethers';
import { SWRConfig } from 'swr';

import api from '../../utils/api';
import { useStayTokenBalance } from '../useStayTokenBalance';

const address = `0x${'1'.repeat(40)}`;
const otherAddress = `0x${'2'.repeat(40)}`;
let user = { _id: 'guest', walletAddress: address };
const config = {
  BLOCKCHAIN_RPC_URL: 'https://rpc.example',
  BLOCKCHAIN_NETWORK_ID: 42220,
  BLOCKCHAIN_DAO_TOKEN: { address: `0x${'3'.repeat(40)}` },
  BLOCKCHAIN_DAO_DIAMOND_ADDRESS: `0x${'4'.repeat(40)}`,
};
jest.mock('../../contexts/auth', () => ({ useAuth: () => ({ user }) }));
jest.mock('../useConfig', () => ({ useConfig: () => config }));
jest.mock('ethers', () => {
  const actual = jest.requireActual('ethers');
  return {
    ...actual,
    Contract: jest.fn(),
    providers: { ...actual.providers, JsonRpcProvider: jest.fn() },
  };
});
const balanceOf = jest.fn();
const unlockedStake = jest.fn();
const getBlockNumber = jest.fn();
let cache: Map<any, any>;
const wrapper = ({ children }: any) => (
  <SWRConfig
    value={{
      provider: () => cache,
      dedupingInterval: 0,
      revalidateOnFocus: false,
    }}
  >
    {children}
  </SWRConfig>
);
const booking = { createdBy: 'guest' };

beforeEach(() => {
  jest.clearAllMocks();
  cache = new Map();
  user = { _id: 'guest', walletAddress: address };
  config.BLOCKCHAIN_NETWORK_ID = 42220;
  getBlockNumber.mockResolvedValue(100);
  balanceOf.mockResolvedValue(BigNumber.from('1234567890123456789'));
  unlockedStake.mockResolvedValue(BigNumber.from('2000000000000000000'));
  (providers.JsonRpcProvider as unknown as jest.Mock).mockImplementation(
    () => ({
      getBlockNumber,
    }),
  );
  (Contract as unknown as jest.Mock).mockImplementation(() => ({
    balanceOf,
    unlockedStake,
  }));
});

test('reads exact liquid plus unlocked tokens for the profile address at one block without a wallet', async () => {
  const { result } = renderHook(() => useStayTokenBalance(booking, true), {
    wrapper,
  });
  await waitFor(() =>
    expect(result.current.balanceWei).toBe('3234567890123456789'),
  );
  expect(balanceOf).toHaveBeenCalledWith(address, { blockTag: 100 });
  expect(unlockedStake).toHaveBeenCalledWith(address, { blockTag: 100 });
  expect(providers.JsonRpcProvider).toHaveBeenCalledWith(
    { url: config.BLOCKCHAIN_RPC_URL, timeout: 15000 },
    42220,
  );
});

test.each(['', 'invalid-address'])(
  'does not read a missing or invalid profile wallet (%s)',
  async (walletAddress) => {
    user.walletAddress = walletAddress;
    const { result } = renderHook(() => useStayTokenBalance(booking, true), {
      wrapper,
    });
    expect(result.current.walletAddress).toBeNull();
    expect(result.current.balanceWei).toBeNull();
    expect(Contract).not.toHaveBeenCalled();
  },
);

test('does not read contracts when token booking is disabled', () => {
  renderHook(() => useStayTokenBalance(booking, false), { wrapper });
  expect(Contract).not.toHaveBeenCalled();
});

test('reads the guest profile when a host views someone else’s booking', async () => {
  user = { _id: 'host', walletAddress: otherAddress };
  jest.spyOn(api, 'get').mockResolvedValue({
    data: { results: { walletAddress: address } },
  });
  const { result, rerender } = renderHook(
    () => useStayTokenBalance(booking, true),
    {
      wrapper,
    },
  );
  await waitFor(() =>
    expect(result.current.balanceWei).toBe('3234567890123456789'),
  );
  expect(api.get).toHaveBeenCalledWith('/user/guest', {
    params: { fields: 'walletAddress' },
  });
  expect(balanceOf).toHaveBeenCalledWith(address, { blockTag: 100 });
  // Private profile data fetched by one viewer must not carry over to another.
  user = { _id: 'another-host', walletAddress: otherAddress };
  jest.spyOn(api, 'get').mockRejectedValue(new Error('Not permitted'));
  rerender();
  expect(result.current.balanceWei).toBeNull();
  await waitFor(() => expect(result.current.error).toBeTruthy());
});

test('retries a failed owner lookup without substituting the host’s wallet', async () => {
  user = { _id: 'host', walletAddress: otherAddress };
  jest
    .spyOn(api, 'get')
    .mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValue({ data: { results: { walletAddress: address } } });
  const { result } = renderHook(() => useStayTokenBalance(booking, true), {
    wrapper,
  });
  await waitFor(() => expect(result.current.error).toBeTruthy());
  expect(balanceOf).not.toHaveBeenCalled();
  await act(async () => {
    await result.current.retry();
  });
  await waitFor(() => expect(result.current.balanceWei).not.toBeNull());
  expect(balanceOf).toHaveBeenCalledWith(address, { blockTag: 100 });
});

test('keeps a failed read unavailable and supports an explicit retry', async () => {
  balanceOf.mockRejectedValueOnce(new Error('RPC unavailable'));
  const { result } = renderHook(() => useStayTokenBalance(booking, true), {
    wrapper,
  });
  await waitFor(() => expect(result.current.error).toBeTruthy());
  expect(result.current.balanceWei).toBeNull();
  await act(async () => {
    await result.current.retry();
  });
  await waitFor(() =>
    expect(result.current.balanceWei).toBe('3234567890123456789'),
  );
  expect(result.current.error).toBeUndefined();
});

test('refreshes both contract values instead of reusing the displayed balance', async () => {
  const { result } = renderHook(() => useStayTokenBalance(booking, true), {
    wrapper,
  });
  await waitFor(() => expect(result.current.balanceWei).not.toBeNull());
  balanceOf.mockResolvedValue(BigNumber.from(0));
  unlockedStake.mockResolvedValue(BigNumber.from(0));
  let refreshed: string | undefined;
  await act(async () => {
    refreshed = await result.current.refresh();
  });
  expect(refreshed).toBe('0');
  expect(result.current.balanceWei).toBe('0');
});

test.each(['wallet', 'network'])(
  'never returns the old balance after the %s changes during a refresh',
  async (change) => {
    const { result, rerender } = renderHook(
      () => useStayTokenBalance(booking, true),
      { wrapper },
    );
    await waitFor(() => expect(result.current.balanceWei).not.toBeNull());
    let resolveRead!: (value: any) => void;
    balanceOf.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRead = resolve;
        }),
    );
    let refresh!: Promise<any>;
    await act(async () => {
      refresh = result.current.refresh().catch((error) => error);
    });
    if (change === 'wallet') user.walletAddress = otherAddress;
    else config.BLOCKCHAIN_NETWORK_ID = 11142220;
    balanceOf.mockResolvedValue(BigNumber.from(0));
    unlockedStake.mockResolvedValue(BigNumber.from(0));
    rerender();
    await waitFor(() => expect(result.current.balanceWei).toBe('0'));
    await act(async () => {
      resolveRead(BigNumber.from('999999999999999999999'));
      await refresh;
    });
    expect(await refresh).toBeInstanceOf(Error);
    expect(result.current.balanceWei).toBe('0');
  },
);
