import { trackEvent } from '../posthog';
import {
  formatStakeBookingErrorForUi,
  reportStakeBookingError,
  stakeErrorDetails,
} from '../stakeBookingError.helpers';

jest.mock('../posthog', () => ({ trackEvent: jest.fn() }));
const t = (key: string) => key;
test.each([
  ['ERC20: insufficient allowance', 'stay_stake_error_allowance'],
  [
    'ERC20: transfer amount exceeds balance',
    'error_insufficient_token_balance',
  ],
  ['ERC20: transfer to the zero address', 'stay_stake_error_unknown'],
  ['insufficient funds for gas * price + value', 'insufficient_celo_for_gas'],
  ['execution reverted: date must be future', 'stay_stake_error_deadline'],
  ['execution reverted: unknown contract reason', 'stay_stake_error_reverted'],
  ['user rejected transaction', 'stay_create_stake_error_user_rejected'],
])(
  'classifies %s without claiming every ERC20 failure is a balance problem',
  (message, expected) => {
    expect(formatStakeBookingErrorForUi(new Error(message), t)).toBe(expected);
  },
);
test('uses nested provider reason and sanitises original details before display/capture', () => {
  const error = {
    message: 'RPC https://private.example/key123 token=secret',
    error: { message: 'ERC20: insufficient allowance' },
    config: { headers: { Authorization: 'secret' } },
  };
  expect(formatStakeBookingErrorForUi(error, t)).toBe(
    'stay_stake_error_allowance',
  );
  expect(stakeErrorDetails(error)).not.toMatch(/private.example|key123|secret/);
  reportStakeBookingError(error, { bookingId: 'stay', stage: 'stake' });
  expect(trackEvent).toHaveBeenCalledWith(
    'stay_stake_error',
    expect.objectContaining({ booking_id: 'stay' }),
  );
  expect(JSON.stringify(jest.mocked(trackEvent).mock.calls)).not.toContain(
    'secret',
  );
});
test('records user rejection as cancellation, not an unexpected exception', () => {
  reportStakeBookingError(
    { code: 4001 },
    { bookingId: 'stay', stage: 'stake' },
  );
  expect(trackEvent).toHaveBeenLastCalledWith(
    'stay_stake_cancelled',
    expect.anything(),
  );
});

test('redacts credentials in stringified provider messages', () => {
  const detail = stakeErrorDetails(
    new Error(
      'RPC failed: {"apiKey":"private-api-key", "Authorization":"Bearer private-auth", "password":"private password"}',
    ),
  );
  expect(detail).not.toContain('private');
  expect(detail).toContain('RPC failed');
});
