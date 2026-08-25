import { ethers } from 'ethers';

import { blockchainConfig } from '../config_blockchain';
import { TransactionBuilderTransaction } from '../types/onchainAdmin';
import { parseTokenUnits } from './currencyFormat';

const sweatInterface = new ethers.utils.Interface([
  'function mintBatch(tuple(address account,uint256 amount,uint256 daysAgo)[] mintDataArray)',
  'function burn(address account,tuple(uint256 daysAgo,uint256 amount)[] burnDataArray) returns (uint256)',
]);

export const contributionDateToDaysAgo = (
  contributionDate: string,
  now = new Date(),
): number | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(contributionDate);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const contributionDay = Date.UTC(year, month - 1, day);
  const parsed = new Date(contributionDay);
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  if (contributionDay > today) return null;
  return Math.floor((today - contributionDay) / (24 * 60 * 60 * 1000));
};

export const buildTdfTransaction = (
  operation: 'mint' | 'transfer',
  walletAddress: string,
  amount: string,
): TransactionBuilderTransaction => ({
  to: blockchainConfig.BLOCKCHAIN_DAO_TOKEN.address,
  value: '0',
  data: null,
  contractMethod: {
    inputs: [
      {
        internalType: 'address',
        name: operation === 'mint' ? 'account' : 'to',
        type: 'address',
      },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: operation,
    payable: false,
  },
  contractInputsValues: {
    [operation === 'mint' ? 'account' : 'to']: walletAddress,
    amount: parseTokenUnits(
      amount,
      blockchainConfig.BLOCKCHAIN_DAO_TOKEN.decimals,
    ).toString(),
  },
});

export const buildSweatMintTransaction = (
  entries: Array<{
    walletAddress: string;
    amount: string;
    contributionDate: string;
  }>,
): TransactionBuilderTransaction => {
  const mintData = entries.map((entry) => {
    const daysAgo = contributionDateToDaysAgo(entry.contributionDate);
    if (daysAgo == null) throw new Error('Invalid contribution date');
    return {
      account: entry.walletAddress,
      amount: parseTokenUnits(
        entry.amount,
        blockchainConfig.BLOCKCHAIN_SWEAT_TOKEN.decimals,
      ).toString(),
      daysAgo,
    };
  });
  return {
    to: blockchainConfig.BLOCKCHAIN_SWEAT_TOKEN.address,
    value: '0',
    data: sweatInterface.encodeFunctionData('mintBatch', [mintData]),
    contractMethod: null,
    contractInputsValues: null,
  };
};

export const buildSweatBurnTransaction = (
  walletAddress: string,
  entries: Array<{ amount: string; contributionDate: string }>,
): TransactionBuilderTransaction => {
  const burnData = entries.map((entry) => {
    const daysAgo = contributionDateToDaysAgo(entry.contributionDate);
    if (daysAgo == null) throw new Error('Invalid contribution date');
    return {
      daysAgo,
      amount: parseTokenUnits(
        entry.amount,
        blockchainConfig.BLOCKCHAIN_SWEAT_TOKEN.decimals,
      ).toString(),
    };
  });
  return {
    to: blockchainConfig.BLOCKCHAIN_SWEAT_TOKEN.address,
    value: '0',
    data: sweatInterface.encodeFunctionData('burn', [walletAddress, burnData]),
    contractMethod: null,
    contractInputsValues: null,
  };
};

export const downloadTransactionBuilderJson = ({
  name,
  description,
  filename,
  transactions,
}: {
  name: string;
  description: string;
  filename: string;
  transactions: TransactionBuilderTransaction[];
}) => {
  const payload = {
    version: '1.0',
    chainId: String(blockchainConfig.BLOCKCHAIN_NETWORK_ID),
    createdAt: Date.now(),
    meta: {
      name,
      description,
      txBuilderVersion: '1.18.0',
      createdFromSafeAddress: '',
      createdFromOwnerAddress: '',
    },
    transactions,
  };
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
