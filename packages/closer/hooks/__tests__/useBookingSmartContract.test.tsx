import { PropsWithChildren } from 'react';

import { act, renderHook } from '@testing-library/react';
import { BigNumber } from 'ethers';

import { ConfigProvider } from '../../contexts/config';
import { WalletDispatch, WalletState } from '../../contexts/wallet';
import { BOOK_ACCOMMODATION_EXISTING_CONFLICT_PREFIX } from '../../utils/stakeBookingError.helpers';
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
  const onChainBooking = (year: number, dayOfYear: number, price: number) => ({
    status: 0,
    year,
    dayOfYear,
    price: BigNumber.from(price),
  });

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
    sendTransaction.mockReset();
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
      lockedStakeAt: jest.fn(),
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
    expect(contractMock.getAccommodationBookings).not.toHaveBeenCalled();
    expect(contractMock.lockedStakeAt).not.toHaveBeenCalled();
    for (const call of contractMock.estimateGas.bookAccommodation.mock.calls) {
      expect(call[1].toString()).toBe('100');
    }
    for (const call of contractMock.callStatic.bookAccommodation.mock.calls) {
      expect(call[1].toString()).toBe('100');
    }
    for (const call of contractMock.interface.encodeFunctionData.mock.calls) {
      expect(call[1][1].toString()).toBe('100');
    }
    expect(result.current.stakingProgress).toMatchObject({
      completedNights: 10,
      totalNights: 10,
      requiresMultipleTransactions: true,
      phase: 'idle',
    });
  });

  it('returns a conflict instead of raising the API price for an existing booking', async () => {
    const selectedNights = bookingNights.slice(0, 2);
    contractMock.estimateGas.bookAccommodation.mockRejectedValue(
      new Error(
        'execution reverted: panic: arithmetic underflow or overflow (0x11)',
      ),
    );
    contractMock.getAccommodationBookings.mockResolvedValue([
      onChainBooking(2026, 1, 120),
    ]);
    const { result } = renderHook(
      () => useBookingSmartContract({ bookingNights: selectedNights }),
      { wrapper },
    );

    let stakingResult: any;
    await act(async () => {
      stakingResult = await result.current.stakeTokens('100', selectedNights);
    });

    expect(stakingResult.success).toBeNull();
    expect(stakingResult.error.message).toBe(
      BOOK_ACCOMMODATION_EXISTING_CONFLICT_PREFIX,
    );
    expect(sendTransaction).not.toHaveBeenCalled();
  });

  it('classifies a booking collision discovered during simulation', async () => {
    const selectedNights = bookingNights.slice(0, 2);
    contractMock.callStatic.bookAccommodation.mockRejectedValue(
      new Error('execution reverted: Booking already exists'),
    );
    contractMock.getAccommodationBookings.mockResolvedValue([
      onChainBooking(2026, 1, 100),
    ]);
    const { result } = renderHook(
      () => useBookingSmartContract({ bookingNights: selectedNights }),
      { wrapper },
    );

    let stakingResult: any;
    await act(async () => {
      stakingResult = await result.current.stakeTokens('100', selectedNights);
    });

    expect(stakingResult.success).toBeNull();
    expect(stakingResult.error.message).toBe(
      BOOK_ACCOMMODATION_EXISTING_CONFLICT_PREFIX,
    );
    expect(sendTransaction).not.toHaveBeenCalled();
  });

  it('returns existing only when every remaining night matches the API price', async () => {
    const selectedNights = bookingNights.slice(0, 2);
    contractMock.estimateGas.bookAccommodation.mockRejectedValue(
      new Error('execution reverted: Booking already exists'),
    );
    contractMock.getAccommodationBookings.mockResolvedValue(
      selectedNights.map(([year, day]) => onChainBooking(year, day, 100)),
    );
    const { result } = renderHook(
      () => useBookingSmartContract({ bookingNights: selectedNights }),
      { wrapper },
    );

    let stakingResult: any;
    await act(async () => {
      stakingResult = await result.current.stakeTokens('100', selectedNights);
    });

    expect(stakingResult).toEqual({
      error: null,
      success: { transactionId: 'existing' },
    });
    expect(sendTransaction).not.toHaveBeenCalled();
  });

  it('publishes full progress when a resumed stake already has exact remaining coverage', async () => {
    const selectedNights = bookingNights.slice(0, 3);
    const onProgress = jest.fn();
    contractMock.estimateGas.bookAccommodation.mockRejectedValue(
      new Error('execution reverted: Booking already exists'),
    );
    contractMock.getAccommodationBookings.mockResolvedValue(
      selectedNights.map(([year, day]) => onChainBooking(year, day, 100)),
    );
    const { result } = renderHook(
      () => useBookingSmartContract({ bookingNights: selectedNights }),
      { wrapper },
    );

    let stakingResult: any;
    await act(async () => {
      stakingResult = await result.current.stakeTokens('100', selectedNights, {
        completedNightCount: 1,
        onProgress,
      });
    });

    expect(stakingResult).toEqual({
      error: null,
      success: { transactionId: 'existing' },
    });
    expect(onProgress).toHaveBeenCalledTimes(1);
    expect(onProgress).toHaveBeenCalledWith({
      completedNightCount: 3,
      transactionId: null,
    });
    expect(result.current.stakingProgress).toMatchObject({
      completedNights: 3,
      totalNights: 3,
      requiresMultipleTransactions: true,
      phase: 'idle',
    });
    expect(sendTransaction).not.toHaveBeenCalled();
  });

  it('classifies a booking collision reported while submitting', async () => {
    const selectedNights = bookingNights.slice(0, 2);
    sendTransaction.mockReset();
    sendTransaction.mockRejectedValue(
      new Error('execution reverted: Booking already exists'),
    );
    contractMock.getAccommodationBookings.mockResolvedValue(
      selectedNights.map(([year, day]) => onChainBooking(year, day, 100)),
    );
    const { result } = renderHook(
      () => useBookingSmartContract({ bookingNights: selectedNights }),
      { wrapper },
    );

    let stakingResult: any;
    await act(async () => {
      stakingResult = await result.current.stakeTokens('100', selectedNights);
    });

    expect(stakingResult).toEqual({
      error: null,
      success: { transactionId: 'existing' },
    });
    expect(sendTransaction).toHaveBeenCalledTimes(1);
  });

  it('resumes after a verified recorded prefix', async () => {
    const onProgress = jest.fn();
    contractMock.getAccommodationBookings.mockResolvedValue(
      bookingNights
        .slice(0, 7)
        .map(([year, day]) => onChainBooking(year, day, 100)),
    );
    const { result } = renderHook(
      () => useBookingSmartContract({ bookingNights }),
      { wrapper },
    );

    let stakingResult: any;
    await act(async () => {
      stakingResult = await result.current.stakeTokens('100', bookingNights, {
        completedNightCount: 7,
        onProgress,
      });
    });

    expect(sendTransaction).toHaveBeenCalledTimes(1);
    expect(onProgress).toHaveBeenCalledWith({
      completedNightCount: 10,
      transactionId: `0x${'1'.repeat(64)}`,
    });
    expect(stakingResult.success.transactionId).toBe(`0x${'1'.repeat(64)}`);
  });

  it('rolls an invalid stored prefix back before continuing', async () => {
    const selectedNights = bookingNights.slice(0, 2);
    const onProgress = jest.fn();
    contractMock.getAccommodationBookings.mockResolvedValue([
      onChainBooking(2026, 1, 100),
    ]);
    const { result } = renderHook(
      () => useBookingSmartContract({ bookingNights: selectedNights }),
      { wrapper },
    );

    await act(async () => {
      await result.current.stakeTokens('100', selectedNights, {
        completedNightCount: 2,
        onProgress,
      });
    });

    expect(onProgress).toHaveBeenNthCalledWith(1, {
      completedNightCount: 1,
      transactionId: null,
    });
    expect(onProgress).toHaveBeenNthCalledWith(2, {
      completedNightCount: 2,
      transactionId: `0x${'1'.repeat(64)}`,
    });
  });
});
