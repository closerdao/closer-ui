import { useState } from 'react';

import { useWeb3React } from '@web3-react/core';
import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import { BigNumber, Contract } from 'ethers';
import useSWR from 'swr';

import {
  BLOCKCHAIN_DAO_DIAMOND_ADDRESS,
  BLOCKCHAIN_DAO_TOKEN,
  BLOCKCHAIN_DAO_TOKEN_ABI,
  BLOCKCHAIN_DIAMOND_ABI,
} from '../config_blockchain';
import { fetcher } from '../utils/blockchain';

dayjs.extend(dayOfYear);

export const useTokenPayment = ({ value, startDate, totalNights }) => {
  console.log('useTokenPayment', value);
  const { account, library } = useWeb3React();
  const [pendingTransactions, setPendingTransactions] = useState([]); //In general the following pendingTransactions state should be moved to the root of the app, and should be used as a dependency by all hooks that read blockchain state
  const [isPending, setPending] = useState(false); //Used when need to make several blockchain transactions in a row

  const start = dayjs(startDate);
  const bookingYear = start.year();
  let nights = [[bookingYear, dayjs(startDate).dayOfYear()]];
  for (var i = 1; i < totalNights; i++) {
    nights = [
      ...nights,
      [bookingYear, dayjs(startDate).add(i, 'day').dayOfYear()],
    ];
  }

  const { data: balanceLocked } = useSWR(
    [BLOCKCHAIN_DAO_DIAMOND_ADDRESS, 'lockedStake', account],
    {
      fetcher: fetcher(library, BLOCKCHAIN_DIAMOND_ABI),
    },
  );

  console.log('useTokenPayment balanceLocked', balanceLocked);

  const tokensToStake =
    balanceLocked &&
    BigNumber.from(value)
      .mul(BigNumber.from(10).pow(BLOCKCHAIN_DAO_TOKEN.decimals))
      .sub(balanceLocked);

  const stakeTokens = async () => {
    if (!library || !account) {
      return;
    }

    const DAOTokenContract = new Contract(
      BLOCKCHAIN_DAO_TOKEN.address,
      BLOCKCHAIN_DAO_TOKEN_ABI,
      library.getUncheckedSigner(),
    );

    const Diamond = new Contract(
      BLOCKCHAIN_DAO_DIAMOND_ADDRESS,
      BLOCKCHAIN_DIAMOND_ABI,
      library.getUncheckedSigner(),
    );

    setPending(true);
    //Approve the contract to spend tokens
    if (tokensToStake > 0) {
      try {
        const tx1 = await DAOTokenContract.approve(
          BLOCKCHAIN_DAO_DIAMOND_ADDRESS,
          tokensToStake,
        );
        setPendingTransactions([...pendingTransactions, tx1.hash]);
        await tx1.wait();
        console.log(`${tx1.hash} mined`);
        setPendingTransactions((pendingTransactions) =>
          pendingTransactions.filter((h) => h !== tx1.hash),
        );
      } catch (error) {
        console.error(error);
        setPending(false);
        return { error, success: null };
      }
    }

    //Now we can book the nights
    try {
      setPending(true);
      const tx3 = await Diamond.bookAccommodation(nights);
      setPendingTransactions([...pendingTransactions, tx3.hash]);
      await tx3.wait();
      console.log(`${tx3.hash} mined`);
      setPendingTransactions((pendingTransactions) =>
        pendingTransactions.filter((h) => h !== tx3.hash),
      );
      setPending(false);
      return { error: null, success: { transactionId: tx3.hash } };
    } catch (error) {
      //User rejected transaction
      setPending(false);
      return { error, success: null };
    }
  };

  return { stakeTokens, isPending };
};
