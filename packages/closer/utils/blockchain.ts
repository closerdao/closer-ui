import { getDataSuffix, submitReferral } from '@divvi/referral-sdk';
import { formatUnits, isAddress, getAddress, encodeFunctionData, PublicClient, WalletClient } from 'viem';

import { blockchainConfig } from '../config_blockchain';

const dataSuffix = getDataSuffix({
  consumer: '0x9B5f6dF2C7A331697Cf2616CA884594F6afDC07d',
  providers: [
    '0x0423189886d7966f0dd7e7d256898daeee625dca',
    '0xc95876688026be9d6fa7a7c33328bd013effa2bb',
    '0x5f0a55fad9424ac99429f635dfb9bf20c3360ab8',
  ],
});

const { BLOCKCHAIN_DAO_TOKEN, BLOCKCHAIN_DAO_TOKEN_ABI } = blockchainConfig;

export const fetcher =
  (publicClient: PublicClient, abi: any) =>
  async (...args: any[]) => {
    if (!publicClient) {
      throw new Error('Public client not available');
    }
    const [arg1, arg2, ...params] = args;

    if (isAddress(arg1)) {
      const address = arg1 as `0x${string}`;
      const method = arg2 as string;
      const result = await publicClient.readContract({
        address,
        abi,
        functionName: method,
        args: params,
      });
      return result;
    }

    return null;
  };

export const multiFetcher = (publicClient: PublicClient, abi: any) => (argsArray: any[]) => {
  if (!publicClient) {
    throw new Error('Public client not available');
  }
  const f = fetcher(publicClient, abi);
  return Promise.all(argsArray.map((args) => f(...args)));
};

export function formatBigNumberForDisplay(
  value: bigint | null | undefined,
  tokenDecimals: number,
  displayDecimals: number = 0,
): number | null {
  if (displayDecimals > 5 || displayDecimals > tokenDecimals) {
    throw new Error('Too many decimals');
  }
  if (value !== null && value !== undefined) {
    return Number(formatUnits(value, tokenDecimals));
  }
  return null;
}

export async function sendDAOToken(
  publicClient: PublicClient,
  walletClient: WalletClient,
  toAddress: string,
  amount: bigint,
  chainId: number,
) {
  if (!publicClient || !walletClient || !toAddress) {
    return;
  }

  const txData = encodeFunctionData({
    abi: BLOCKCHAIN_DAO_TOKEN_ABI,
    functionName: 'transfer',
    args: [getAddress(toAddress), amount],
  });

  const fullData = `${txData}${dataSuffix.slice(2)}` as `0x${string}`;

  const hash = await walletClient.sendTransaction({
    to: BLOCKCHAIN_DAO_TOKEN.address as `0x${string}`,
    data: fullData,
    account: walletClient.account!,
    chain: walletClient.chain,
  });

  if (chainId !== 44787) {
    try {
      await submitReferral({
        txHash: hash,
        chainId,
      });
    } catch (error) {
      console.error('submitReferral error:', error);
    }
  }

  await publicClient.waitForTransactionReceipt({ hash });
  return { hash };
}

interface BookedDate {
  status: number;
  year: bigint;
  dayOfYear: bigint;
  price: bigint;
  timestamp: bigint;
}

export const estimateNeededStakeForNewBooking = ({
  bookedDates,
  bookingYear,
  totalBookingTokenCost,
}: {
  bookedDates: any[] | null;
  bookingYear: number;
  totalBookingTokenCost: number;
}): number | null => {
  if (!bookedDates || !bookingYear || !totalBookingTokenCost) {
    console.error('Missing parameters in estimateNeededStakeForNewBooking');
    return null;
  }

  const stakedByYear = bookedDates.reduce((acc: Map<number, bigint>, curr: any) => {
    const year = Number(curr[1] || curr.year);
    const price = BigInt(curr[3] || curr.price || 0);
    if (acc.has(year)) {
      acc.set(year, acc.get(year)! + price);
    } else {
      acc.set(year, price);
    }
    return acc;
  }, new Map<number, bigint>());

  const currentYearStakeBigInt = stakedByYear.get(bookingYear) || BigInt(0);
  const currentYearStake = formatBigNumberForDisplay(currentYearStakeBigInt, 18);

  const maxStakeBigInt = [...stakedByYear.values()].reduce((acc, curr) => {
    return acc > curr ? acc : curr;
  }, BigInt(0));
  const maxStake = formatBigNumberForDisplay(maxStakeBigInt, 18);

  const tokensToStake = Math.max(
    totalBookingTokenCost - Math.max(maxStake || 0, currentYearStake || 0),
    0,
  );

  return tokensToStake;
};
