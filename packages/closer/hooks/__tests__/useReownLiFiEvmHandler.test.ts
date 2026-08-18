import { transactionMatchesAccount } from '../useReownLiFiEvmHandler';

describe('LI.FI Reown EVM handler', () => {
  const account = '0x1111111111111111111111111111111111111111';

  it('allows transactions from the connected account', () => {
    expect(
      transactionMatchesAccount([{ from: account.toUpperCase() }], account),
    ).toBe(true);
  });

  it('allows providers to fill a missing from address', () => {
    expect(transactionMatchesAccount([{ to: account }], account)).toBe(true);
  });

  it('rejects transactions from another account', () => {
    expect(
      transactionMatchesAccount(
        [{ from: '0x2222222222222222222222222222222222222222' }],
        account,
      ),
    ).toBe(false);
  });
});
