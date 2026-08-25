import { allNetworkConfigs } from '../../config_blockchain';
import messages from '../../locales/base-en.json';
import {
  formatBlockchainName,
  getBlockchainNetworkName,
  getStablecoinSymbol,
} from '../blockchainNetwork';

describe('formatBlockchainName', () => {
  it('title-cases the shouted config value', () => {
    expect(formatBlockchainName('CELO')).toBe('Celo');
    expect(formatBlockchainName('CELO SEPOLIA')).toBe('Celo Sepolia');
  });

  it('survives padding and empty values', () => {
    expect(formatBlockchainName('  celo   sepolia ')).toBe('Celo Sepolia');
    expect(formatBlockchainName('')).toBe('');
    expect(formatBlockchainName(undefined)).toBe('');
  });
});

describe('getBlockchainNetworkName', () => {
  it('names the chain the passed config points at', () => {
    expect(getBlockchainNetworkName({ BLOCKCHAIN_NAME: 'CELO SEPOLIA' })).toBe(
      'Celo Sepolia',
    );
  });

  it('falls back to the build config rather than to a blank', () => {
    expect(getBlockchainNetworkName({})).toBeTruthy();
    expect(getBlockchainNetworkName(null)).toBeTruthy();
  });
});

describe('getStablecoinSymbol', () => {
  it('reads the symbol off the passed config', () => {
    expect(
      getStablecoinSymbol({ BLOCKCHAIN_CEUR_TOKEN: { symbol: 'fakeEUR' } }),
    ).toBe('fakeEUR');
  });

  it('falls back to the build config', () => {
    expect(getStablecoinSymbol({})).toBeTruthy();
  });
});

describe('payment copy names the configured chain', () => {
  // The dev/staging builds run on Celo Sepolia, so any string that hard-codes
  // 'Celo' quietly tells the guest they are moving mainnet funds.
  const chainAwareKeys = [
    'stay_crypto_tab_intro',
    'stay_crypto_modal_description',
    'event_ticket_crypto_description',
    'event_ticket_switch_network',
    'donate_crypto_switch_network',
    'donate_crypto_wallet_hint',
    'donate_method_crypto',
  ] as const;

  it.each(chainAwareKeys)('%s takes the chain as a placeholder', (key) => {
    const message = (messages as Record<string, string>)[key];
    expect(message).toContain('{chain}');
    expect(message).not.toMatch(/\bCelo\b/);
  });

  it('resolves to Celo Sepolia on the testnet config', () => {
    expect(getBlockchainNetworkName(allNetworkConfigs.celoSepolia)).toBe(
      'Celo Sepolia',
    );
    expect(getBlockchainNetworkName(allNetworkConfigs.celo)).toBe('Celo');
  });

  it('names the testnet stablecoin on the testnet config', () => {
    expect(getStablecoinSymbol(allNetworkConfigs.celoSepolia)).toBe('fakeEUR');
    expect(getStablecoinSymbol(allNetworkConfigs.celo)).toBe('cEUR');
  });
});
