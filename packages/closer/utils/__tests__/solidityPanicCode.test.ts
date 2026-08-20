import {
  SOLIDITY_PANIC_UNDERFLOW,
  getSolidityPanicCode,
} from '../smartContractErrorParser';

const PANIC_11_DATA =
  '0x4e487b710000000000000000000000000000000000000000000000000000000000000011';

describe('getSolidityPanicCode', () => {
  it('reads the code from an ethers decoded Panic error', () => {
    expect(
      getSolidityPanicCode({
        errorName: 'Panic',
        errorArgs: [{ hex: '0x11' }],
      }),
    ).toBe(SOLIDITY_PANIC_UNDERFLOW);
  });

  it('reads the code from raw revert data on a nested rpc error', () => {
    // Shape returned by the Celo RPC for the reproduced bookAccommodation revert.
    expect(
      getSolidityPanicCode({
        code: 'CALL_EXCEPTION',
        error: {
          code: 3,
          message: 'execution reverted: panic: arithmetic underflow or overflow (0x11)',
          data: PANIC_11_DATA,
        },
      }),
    ).toBe(SOLIDITY_PANIC_UNDERFLOW);
  });

  it('reads the code from revert data nested two levels deep', () => {
    expect(
      getSolidityPanicCode({ error: { data: { data: PANIC_11_DATA } } }),
    ).toBe(SOLIDITY_PANIC_UNDERFLOW);
  });

  it('falls back to the parenthesised hex code in the message', () => {
    expect(
      getSolidityPanicCode({
        message:
          'execution reverted: panic: arithmetic underflow or overflow (0x11)',
      }),
    ).toBe(SOLIDITY_PANIC_UNDERFLOW);
  });

  it('falls back to the decimal "panic code" phrasing', () => {
    expect(
      getSolidityPanicCode({ message: 'reverted with panic code 17' }),
    ).toBe(17);
  });

  it('returns null for a plain require revert', () => {
    expect(
      getSolidityPanicCode({
        error: {
          message: 'execution reverted: ERC20: transfer amount exceeds balance',
        },
      }),
    ).toBeNull();
  });

  it('returns null for non-contract errors', () => {
    expect(getSolidityPanicCode(null)).toBeNull();
    expect(getSolidityPanicCode({ code: 4001, message: 'User denied' })).toBeNull();
  });
});
