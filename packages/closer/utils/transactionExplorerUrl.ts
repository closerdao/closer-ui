import { blockchainConfig } from '../config_blockchain';

export function getTransactionExplorerUrl(txHash: string): string {
  const hash = txHash.trim();
  if (!hash) return '';
  const base = blockchainConfig.BLOCKCHAIN_EXPLORER_URL.replace(/\/$/, '');
  return `${base}/tx/${hash}`;
}
