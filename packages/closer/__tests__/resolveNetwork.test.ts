import { resolveNetwork } from '../config_blockchain';

describe('resolveNetwork', () => {
  it('resolves the retired alfajores testnet to celoSepolia', () => {
    expect(resolveNetwork('alfajores')).toBe('celoSepolia');
  });

  it('keeps celoSepolia', () => {
    expect(resolveNetwork('celoSepolia')).toBe('celoSepolia');
  });

  it('defaults to celo mainnet', () => {
    expect(resolveNetwork('celo')).toBe('celo');
    expect(resolveNetwork(undefined)).toBe('celo');
  });
});
