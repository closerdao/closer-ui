import { PropsWithChildren } from 'react';

import { act, renderHook } from '@testing-library/react';
import { BigNumber } from 'ethers';

import { ConfigProvider } from '../../contexts/config';
import { WalletDispatch, WalletState } from '../../contexts/wallet';
import { useBookingSmartContract } from '../useBookingSmartContract';

const contractMock: Record<string, any> = {};

jest.mock('ethers', () => {
  const actual = jest.requireActual('ethers');
  return {
    ...actual,
    Contract: jest.fn(() => contractMock),
  };
});

describe('useBookingSmartContract', () => {
  const account = '0x0000000000000000000000000000000000000001';
  const bookingNights = Array.from(
    { length: 10 },
    (_, index) => [2026, index + 1] as [number, number],
  );
  const updateWalletBalance = jest.fn();
  const refetchBookingDates = jest.fn();
  const sendTransaction = jest.fn();

  const wrapper = ({ children }: PropsWithChildren) => (
    <ConfigProvider
      config={{
        BLOCKCHAIN_DAO_DIAMOND_ADDRESS:
          '0x0000000000000000000000000000000000000002',
        BLOCKCHAIN_DAO_TOKEN: { address: '', decimals: 18 },
        BLOCKCHAIN_DIAMOND_ABI: [],
        BLOCKCHAIN_EXPECTED_BLOCK_GAS_LIMIT: 30_000_000,
      }}
    >
      <WalletState.Provider
        value={{
          account,
          isWalletReady: true,
          library: {
            getBlock: jest.fn(async () => ({
              gasLimit: BigNumber.from(30_000_000),
            })),
            getUncheckedSigner: jest.fn(() => ({ sendTransaction })),
          },
        }}
      >
        <WalletDispatch.Provider
          value={{ updateWalletBalance, refetchBookingDates }}
        >
          {children}
        </WalletDispatch.Provider>
      </WalletState.Provider>
    </ConfigProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_BOOK_ACCOMMODATION_GAS_LIMIT = '';

    Object.assign(contractMock, {
      address: '0x0000000000000000000000000000000000000002',
      callStatic: { bookAccommodation: jest.fn(async () => undefined) },
      estimateGas: {
        bookAccommodation: jest.fn(async (candidate: unknown[]) =>
          BigNumber.from(candidate.length).mul(3_000_000),
        ),
      },
      getAccommodationBookings: jest.fn(async () => []),
      getAccommodationYear: jest.fn(async (year: number) => [
        true,
        { enabled: true, end: BigNumber.from(year).mul(1_000_000) },
      ]),
      interface: {
        encodeFunctionData: jest.fn(() => '0x1234'),
      },
      lockedStakeAt: undefined,
      signer: { sendTransaction },
    });

    sendTransaction
      .mockResolvedValueOnce({
        hash: `0x${'1'.repeat(64)}`,
        wait: jest.fn(async () => ({
          transactionHash: `0x${'1'.repeat(64)}`,
          blockNumber: 1,
          blockHash: `0x${'a'.repeat(64)}`,
          gasUsed: BigNumber.from(21_000_000),
          logs: [],
          status: 1,
        })),
      })
      .mockResolvedValueOnce({
        hash: `0x${'2'.repeat(64)}`,
        wait: jest.fn(async () => ({
          transactionHash: `0x${'2'.repeat(64)}`,
          blockNumber: 2,
          blockHash: `0x${'b'.repeat(64)}`,
          gasUsed: BigNumber.from(9_000_000),
          logs: [],
          status: 1,
        })),
      });
  });

  it('sends the largest fitting batches sequentially and returns the last hash', async () => {
    const onProgress = jest.fn();
    const { result } = renderHook(
      () => useBookingSmartContract({ bookingNights }),
      { wrapper },
    );

    let stakingResult: any;
    await act(async () => {
      stakingResult = await result.current.stakeTokens('100', bookingNights, {
        completedNightCount: 0,
        onProgress,
      });
    });

    expect(sendTransaction).toHaveBeenCalledTimes(2);
    expect(sendTransaction.mock.calls[0][0].gasLimit.toString()).toBe(
      '26250000',
    );
    expect(sendTransaction.mock.calls[1][0].gasLimit.toString()).toBe(
      '11250000',
    );
    expect(onProgress).toHaveBeenNthCalledWith(1, {
      completedNightCount: 7,
      transactionId: `0x${'1'.repeat(64)}`,
    });
    expect(onProgress).toHaveBeenNthCalledWith(2, {
      completedNightCount: 10,
      transactionId: `0x${'2'.repeat(64)}`,
    });
    expect(stakingResult.success.transactionId).toBe(`0x${'2'.repeat(64)}`);
    expect(result.current.stakingProgress).toMatchObject({
      completedNights: 10,
      totalNights: 10,
      requiresMultipleTransactions: true,
      phase: 'idle',
    });
  });
});
