import { blockchainConfig } from '../config_blockchain';

/**
 * The chain the app is actually pointed at, as prose.
 *
 * `BLOCKCHAIN_NAME` is shouted ('CELO', 'CELO SEPOLIA') because it doubles as a
 * wallet-facing network label, so anything that drops it into a sentence needs
 * it title-cased first — and needs it read from config rather than written out,
 * or a testnet build tells the guest they are paying on mainnet.
 */
export const formatBlockchainName = (name?: string | null) =>
  (name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

type PartialBlockchainConfig = {
  BLOCKCHAIN_NAME?: string;
  BLOCKCHAIN_CEUR_TOKEN?: { symbol?: string };
} | null;

/** 'Celo' on mainnet, 'Celo Sepolia' on the testnet builds. */
export const getBlockchainNetworkName = (config?: PartialBlockchainConfig) =>
  formatBlockchainName(
    config?.BLOCKCHAIN_NAME || blockchainConfig.BLOCKCHAIN_NAME,
  ) || 'Celo';

/** The stablecoin a payment settles in — 'cEUR', or 'fakeEUR' on the testnet. */
export const getStablecoinSymbol = (config?: PartialBlockchainConfig) =>
  config?.BLOCKCHAIN_CEUR_TOKEN?.symbol ||
  blockchainConfig.BLOCKCHAIN_CEUR_TOKEN?.symbol ||
  'cEUR';
