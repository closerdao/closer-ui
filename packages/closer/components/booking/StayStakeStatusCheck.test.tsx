import { act, fireEvent, render, screen } from '@testing-library/react';

import type { Stay } from '../../types/stay';
import { stakeStayTokens } from '../../utils/stays.api';
import {
  StayStakeStatusCheck,
  canCheckStakeStatus,
} from './StayStakeStatusCheck';

jest.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
jest.mock('../../contexts/auth', () => ({
  useAuth: () => ({ user: { _id: 'owner', walletAddress: '0x123' } }),
}));
jest.mock('../../utils/stays.api', () => ({
  ...jest.requireActual('../../utils/stays.api'),
  stakeStayTokens: jest.fn(),
}));
jest.mock('../ui', () => ({
  Button: ({ onClick, isEnabled, children }: any) => (
    <button disabled={!isEnabled} onClick={onClick}>
      {children}
    </button>
  ),
  ErrorMessage: ({ error }: any) => <div role="alert">{error}</div>,
  Information: ({ children }: any) => <div>{children}</div>,
}));
const stay = {
  _id: 'stay',
  createdBy: 'owner',
  status: 'confirmed',
  useTokens: true,
  tokensTarget: { val: 0 },
  tokensStaked: { val: 0 },
  start: '2025-01-01',
  end: '2025-01-02',
} as Stay;
beforeEach(() => {
  jest.clearAllMocks();
  process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING = 'true';
});

test('checks a past TDF stay with zero tokens owed, no wallet connection and no hash', async () => {
  jest.mocked(stakeStayTokens).mockResolvedValue({
    booking: stay,
    verified: false,
    stakingStatus: { status: 'partial' },
  });
  const onChecked = jest.fn();
  render(<StayStakeStatusCheck stay={stay} onChecked={onChecked} />);
  await act(async () => {
    fireEvent.click(
      screen.getByRole('button', { name: 'stay_stake_check_button' }),
    );
  });
  expect(stakeStayTokens).toHaveBeenCalledWith('stay', '', {
    syncBookingAlreadyOnChain: true,
    transactionIds: [],
    timeout: 30000,
    signal: expect.any(AbortSignal),
  });
  expect(screen.getByText('stay_stake_check_partial')).toBeInTheDocument();
  expect(onChecked).toHaveBeenCalledWith(stay);
});

test('does not start duplicate checks while waiting, and allows a fresh subsequent check', async () => {
  let finish: any;
  jest.mocked(stakeStayTokens).mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  render(<StayStakeStatusCheck stay={stay} onChecked={jest.fn()} />);
  fireEvent.click(screen.getByRole('button'));
  fireEvent.click(screen.getByRole('button'));
  expect(screen.getByRole('button')).toBeDisabled();
  expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  expect(stakeStayTokens).toHaveBeenCalledTimes(1);
  await act(async () => {
    finish({
      booking: stay,
      verified: true,
      stakingStatus: { status: 'complete' },
    });
  });
  expect(screen.getByRole('button')).toBeEnabled();
  expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'false');
  await act(async () => {
    fireEvent.click(screen.getByRole('button'));
  });
  expect(stakeStayTokens).toHaveBeenCalledTimes(2);
});

test.each(['draft', 'cancelled', 'rejected', 'pending', 'paid'])(
  'hidden for %s without a live modification',
  (status) => {
    expect(
      canCheckStakeStatus(
        { ...stay, status } as Stay,
        { _id: 'owner', walletAddress: 'wallet' },
        true,
      ),
    ).toBe(false);
  },
);

test('host sees it only with an owner wallet; unrelated users cannot check', () => {
  const enabled = { ...stay, stakeVerificationAvailable: true };
  expect(
    canCheckStakeStatus(enabled, { _id: 'host', roles: ['space-host'] }, true),
  ).toBe(true);
  expect(
    canCheckStakeStatus(
      stay,
      { _id: 'host', roles: ['space-host'], walletAddress: 'host-wallet' },
      true,
    ),
  ).toBe(false);
  expect(
    canCheckStakeStatus(
      enabled,
      { _id: 'friend', walletAddress: 'wallet' },
      true,
    ),
  ).toBe(false);
  expect(canCheckStakeStatus(enabled, { _id: 'owner' }, false)).toBe(false);
  expect(
    canCheckStakeStatus(
      {
        ...enabled,
        status: 'paid',
        pendingModification: {
          id: 'hold',
          status: 'pending-payment',
          requestedBy: 'owner',
          quote: { fiatDelta: 30, currency: 'EUR' },
        } as Stay['pendingModification'],
      },
      { _id: 'owner' },
      true,
    ),
  ).toBe(true);
});

test('hides the check after switching from TDF to fiat, even with verification available', () => {
  const { rerender } = render(
    <StayStakeStatusCheck stay={stay} onChecked={jest.fn()} />,
  );
  expect(screen.getByRole('button')).toBeInTheDocument();
  const fiatStay = {
    ...stay,
    useTokens: false,
    appliedTokens: { val: 0, cur: 'TDF' },
    stakeVerificationAvailable: true,
  };
  rerender(<StayStakeStatusCheck stay={fiatStay} onChecked={jest.fn()} />);
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(
    canCheckStakeStatus(fiatStay, { _id: 'host', roles: ['admin'] }, true),
  ).toBe(false);
});

test.each([
  { tokensTarget: { val: 2, cur: 'TDF' } },
  { tokensStaked: { val: 2, cur: 'TDF' } },
  { tokensTarget: undefined, appliedTokens: { val: 2, cur: 'TDF' } },
])(
  'keeps checks available for saved token amounts without the legacy flag: %j',
  (amounts) => {
    expect(
      canCheckStakeStatus(
        { ...stay, useTokens: undefined, ...amounts },
        { _id: 'owner', walletAddress: 'wallet' },
        true,
      ),
    ).toBe(true);
  },
);

test.each([
  { tokensDelta: 2, expiresAt: '2099-01-01', visible: true },
  { tokensDelta: 0, expiresAt: '2099-01-01', visible: false },
  { tokensDelta: 2, expiresAt: '2000-01-01', visible: false },
])(
  'checks a fiat stay extension only when it has a live TDF payment: %j',
  ({ tokensDelta, expiresAt, visible }) => {
    expect(
      canCheckStakeStatus(
        {
          ...stay,
          status: 'paid',
          useTokens: false,
          pendingModification: {
            id: 'hold',
            status: 'pending-payment',
            requestedBy: 'owner',
            expiresAt,
            quote: { fiatDelta: 30, currency: 'EUR', tokensDelta },
          } as Stay['pendingModification'],
        },
        { _id: 'owner', walletAddress: 'wallet' },
        true,
      ),
    ).toBe(visible);
  },
);

test('navigation aborts the request and cannot update a different booking', async () => {
  let finish: any;
  jest.mocked(stakeStayTokens).mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  const onChecked = jest.fn();
  const view = render(
    <StayStakeStatusCheck stay={stay} onChecked={onChecked} />,
  );
  fireEvent.click(screen.getByRole('button'));
  const signal = jest.mocked(stakeStayTokens).mock.calls[0][2]?.signal;
  view.rerender(
    <StayStakeStatusCheck
      stay={{ ...stay, _id: 'another-stay' }}
      onChecked={onChecked}
    />,
  );
  expect(signal?.aborted).toBe(true);
  await act(async () => {
    finish({ booking: stay, verified: true });
  });
  expect(onChecked).not.toHaveBeenCalled();
});

test('a host can check a checked-in booking, without enabling ordinary checkout', () => {
  expect(
    canCheckStakeStatus(
      { ...stay, status: 'checked-in', stakeVerificationAvailable: true },
      { _id: 'host', roles: ['space-host'] },
      true,
    ),
  ).toBe(true);
  expect(
    canCheckStakeStatus(
      { ...stay, status: 'checked-in' },
      { _id: 'other' },
      true,
    ),
  ).toBe(false);
});
