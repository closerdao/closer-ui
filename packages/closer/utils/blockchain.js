import { BigNumber, Contract, utils } from 'ethers';
import { isAddress } from 'ethers/lib/utils.js';

import {
  BLOCKCHAIN_DAO_TOKEN,
  BLOCKCHAIN_DAO_TOKEN_ABI,
} from '../config_blockchain.js';

export const fetcher =
  (library, abi) =>
  (...args) => {
    const [arg1, arg2, ...params] = args;
    //contract call
    if (isAddress(arg1)) {
      const address = arg1;
      const method = arg2;
      const contract = new Contract(address, abi, library.getSigner());
      const res = contract[method](...params);
      // console.log('fetcher method', method, ...params);
      return res;
    }
    //eth call
    const method = arg1;
    return library[method](arg2, ...params);
  };

export const multiFetcher = (library, abi) => (argsArray) => {
  const f = fetcher(library, abi);
  return Promise.all(argsArray.map((args) => f(...args)));
};

export function formatBigNumberForDisplay(
  bigNumber,
  tokenDecimals,
  displayDecimals = 0,
) {
  if (displayDecimals > 5 || displayDecimals > tokenDecimals) {
    //Prevent overflow errors
    throw new Error('Too many decimals');
  }
  if (BigNumber.isBigNumber(bigNumber)) {
    const divisor = BigNumber.from(10).pow(tokenDecimals - displayDecimals);
    return bigNumber.div(divisor).toString() / 10 ** displayDecimals;
  } else return null;
}

//Expects BigNumber for amount
export async function sendDAOToken(library, toAddress, amount) {
  if (!library || !toAddress) {
    return;
  }

  const DAOTokenContract = new Contract(
    BLOCKCHAIN_DAO_TOKEN.address,
    BLOCKCHAIN_DAO_TOKEN_ABI,
    library.getSigner(),
  );

  const tx = await DAOTokenContract.transfer(
    utils.getAddress(toAddress),
    amount,
  );

  return tx;
}

export const estimateNeededStakeForNewBooking = ({
  bookedDates,
  bookingYear,
  totalBookingTokenCost,
}) => {
  // given the bookedDates is an array of arrays, where
  // bookedDates[i] = [status, year, dayOfYear, price (BigNumber), timestamp(BigNumber)]
  // 1. we construct a Map - stakedByYear, where keys are years and values are the total price of bookings for that year in BigNumber
  // 2. we find how much tokens user spent already in the current year - currentYearStake
  // 3. we find the max stake among all years - maxStake
  // 4. we calculate how much tokens user needs to stake for the new booking
  // 5. we return either 0 if user already spent more than the max stake in the current year,
  // or the difference between bookingCost, maxStake and currentYearStake

  if (!bookedDates || !bookingYear || !totalBookingTokenCost) {
    console.error('Missing parameters in estimateNeededStakeForNewBooking');
    return null;
  }

  const stakedByYear = bookedDates.reduce((acc, curr) => {
    const year = curr[1];
    const price = curr[3];
    if (acc.has(year)) {
      acc.set(year, acc.get(year).add(price));
    } else {
      acc.set(year, price);
    }
    return acc;
  }, new Map());

  const currentYearStake = formatBigNumberForDisplay(
    stakedByYear.get(bookingYear),
    18,
  );

  const maxStakeBigNum = [...stakedByYear.values()].reduce((acc, curr) => {
    return acc.gt(curr) ? acc : curr;
  }, BigNumber.from(0));
  const maxStake = formatBigNumberForDisplay(maxStakeBigNum, 18);

  const tokensToStake = Math.max(
    totalBookingTokenCost - Math.max(maxStake, currentYearStake),
    0,
  );

  return tokensToStake;
};
