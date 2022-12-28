import { BigNumber, Contract, utils } from 'ethers';
import { isAddress } from 'ethers/lib/utils.js';

import blockchainConfig from '../config_blockchain.js';

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
        return res;
      }
      //eth call
      const method = arg1;
      return library[method](arg2, ...params);
    };

export const multiFetcher = 
  (library, abi) => 
    (argsArray) => {
      const f = fetcher(library, abi)
      return Promise.all(argsArray.map(args => f(...args)))
    }

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
    blockchainConfig.BLOCKCHAIN_DAO_TOKEN.address,
    blockchainConfig.BLOCKCHAIN_DAO_TOKEN_ABI,
    library.getSigner(),
  );

  const tx = await DAOTokenContract.transfer(
    utils.getAddress(toAddress),
    amount,
  );

  return tx;
}
