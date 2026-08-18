import { shouldUseEurmForGas } from '../celoTransaction';

describe('conditional Celo fee currency', () => {
  it('keeps native CELO when it covers gas plus margin', () => {
    expect(shouldUseEurmForGas(120n, 10n, 10n)).toBe(false);
  });

  it('uses EURm when native CELO cannot cover gas plus margin', () => {
    expect(shouldUseEurmForGas(119n, 10n, 10n)).toBe(true);
  });
});
