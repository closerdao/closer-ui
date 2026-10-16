import { fireEvent, screen, within } from '@testing-library/react';

import { blockchainConfig } from '../../config_blockchain';
import { ConfigProvider } from '../../contexts/config';
import { renderWithNextIntl } from '../../test/utils';
import type { Charge } from '../../types/booking';
import type { Stay } from '../../types/stay';
import {
  getDefaultCurrencyLocale,
  setDefaultCurrencyLocale,
} from '../../utils/currencyFormat';
import { StayPaymentHistory, StayPaymentSummary } from './StayPaymentSummary';

const money = (val: number, cur = 'EUR') => ({ val, cur });
const incident = {
  _id: 'stay_1',
  status: 'confirmed',
  duration: 5,
  adults: 1,
  fiatTarget: money(237.72),
  fiatPaid: money(187.15),
  tokensTarget: money(8.669192, 'TDF'),
  tokensStaked: money(8.669192, 'TDF'),
  creditsTarget: money(0, 'credits'),
  creditsPaid: money(0, 'credits'),
  priceLock: {
    total: money(237.72),
    vat: money(44.46),
    appliedTokens: money(10.836489, 'TDF'),
    appliedCredits: money(0, 'credits'),
    lines: {
      accommodation: money(97.15),
      food: money(70),
      utility: money(20),
      event: money(0),
      adjustment: {
        ...money(50.57),
        unstakedNights: {
          ...money(50.57),
          nights: [[2026, 278]],
          tokens: money(2.167298, 'TDF'),
          waived: false,
        },
      },
    },
    vatBreakdown: [
      { line: 'accommodation', rate: 0.23, amount: money(18.17) },
      { line: 'utility', rate: 0.23, amount: money(3.74) },
      { line: 'food', rate: 0.23, amount: money(13.09) },
      { line: 'adjustment', rate: 0.23, amount: money(9.46) },
    ],
  },
} as Stay;

const originalLocale = getDefaultCurrencyLocale();
beforeEach(() => setDefaultCurrencyLocale('en-US'));
afterAll(() => setDefaultCurrencyLocale(originalLocale));

test.each(['draft', 'pending'])(
  'does not present a %s booking as owing money',
  (status) => {
    const unapproved = {
      ...incident,
      status,
      fiatPaid: money(0),
      tokensStaked: money(0, 'TDF'),
    } as Stay;
    renderWithNextIntl(
      <StayPaymentSummary
        stay={unapproved}
        awaitingApprovalNote="You will not be charged now."
      />,
    );
    expect(screen.getByText('Booking total')).toBeInTheDocument();
    expect(
      screen.getByText('You will not be charged now.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Payment status')).not.toBeInTheDocument();
    expect(screen.queryByText('Amount due')).not.toBeInTheDocument();
    expect(screen.queryByText(/ due$/)).not.toBeInTheDocument();
  },
);

test('falls back to a neutral note for viewers other than the guest', () => {
  renderWithNextIntl(
    <StayPaymentSummary stay={{ ...incident, status: 'pending' } as Stay} />,
  );
  expect(
    screen.getByText('Payment opens once the booking is approved.'),
  ).toBeInTheDocument();
  expect(screen.queryByText('Amount due')).not.toBeInTheDocument();
});

test('groups the current TDF and EUR accommodation portions and shows the remaining fiat', () => {
  renderWithNextIntl(<StayPaymentSummary stay={incident} />);
  const costs = screen.getByRole('region', { name: 'Booking costs' });
  expect(within(costs).getByText('EUR portion')).toBeInTheDocument();
  expect(within(costs).getByText('TDF portion')).toBeInTheDocument();
  expect(within(costs).getByText('8.67 TDF')).toBeInTheDocument();
  expect(
    within(costs).queryByText(/10.84|15.00|Event/),
  ).not.toBeInTheDocument();
  expect(screen.getByText('€187.15 paid')).toBeInTheDocument();
  expect(screen.getByText('8.67 TDF staked')).toBeInTheDocument();
  expect(screen.getByText('Complete')).toBeInTheDocument();
  expect(screen.getByText('€50.57 due')).toBeInTheDocument();
  expect(
    screen.queryByText(/still to stake|Fully paid/),
  ).not.toBeInTheDocument();
  expect(screen.getByText('Includes €44.46 VAT')).toBeInTheDocument();
  expect(screen.queryByText('VAT details')).not.toBeInTheDocument();
  fireEvent.click(screen.getByText('Includes €44.46 VAT'));
  expect(screen.getByText('€18.17')).toBeVisible();
});

test('does not hide a real one-millionth outstanding stake', () => {
  renderWithNextIntl(
    <StayPaymentSummary
      stay={{ ...incident, tokensStaked: money(8.669191, 'TDF') }}
    />,
  );
  expect(screen.getByText('0.000001 TDF still to stake')).toBeInTheDocument();
  expect(screen.queryByText('Complete')).not.toBeInTheDocument();
});

test('shows redeemed credits separately from the selected credits and card balance', () => {
  renderWithNextIntl(
    <StayPaymentSummary
      stay={{
        ...incident,
        tokensTarget: money(0, 'TDF'),
        tokensStaked: money(0, 'TDF'),
        creditsTarget: money(10, 'credits'),
        creditsPaid: money(6, 'credits'),
      }}
    />,
  );
  expect(screen.getByText('Credits portion 🥕')).toBeInTheDocument();
  expect(screen.getByText('6.00 credits redeemed')).toBeInTheDocument();
  expect(screen.getByText('4.00 credits still to redeem')).toBeInTheDocument();
  expect(screen.getByText('€50.57 due')).toBeInTheDocument();
});

test('fully paid and overpaid stays are distinguished from an outstanding balance', () => {
  const { rerender } = renderWithNextIntl(
    <StayPaymentSummary
      stay={{ ...incident, status: 'paid', fiatPaid: money(237.72) }}
    />,
  );
  expect(screen.getByText('Fully paid')).toBeInTheDocument();
  expect(screen.getByText('No payment remaining.')).toBeInTheDocument();
  expect(screen.queryByText('Amount due')).not.toBeInTheDocument();
  expect(screen.queryByText('€0.00')).not.toBeInTheDocument();
  rerender(
    <StayPaymentSummary
      stay={{
        ...incident,
        fiatPaid: money(247.72),
        paymentDelta: { fiat: money(-10) },
      }}
    />,
  );
  expect(screen.getByText('Refund due: €10.00')).toBeInTheDocument();
  expect(screen.queryByText('Fully paid')).not.toBeInTheDocument();
  expect(screen.queryByText('No payment remaining.')).not.toBeInTheDocument();
  expect(screen.getByText('Amount due')).toBeInTheDocument();
});

test('a held extension stays separate from the confirmed booking and its paid totals', () => {
  const held = {
    ...incident,
    createdBy: 'guest',
    fiatPaid: money(237.72),
    pendingModification: {
      id: 'hold',
      status: 'pending-payment',
      requestedBy: 'guest',
      expiresAt: '2099-01-01',
      quote: { fiatDelta: 80, tokensDelta: 2, currency: 'EUR' },
    },
  } as Stay;
  renderWithNextIntl(<StayPaymentSummary stay={held} />);
  const total = screen.getByRole('region', { name: 'Booking total' });
  expect(within(total).getByText('€237.72')).toBeInTheDocument();
  expect(within(total).getByText('8.67 TDF')).toBeInTheDocument();
  const change = screen.getByRole('region', { name: 'Pending change' });
  expect(within(change).getByText('€80.00')).toBeInTheDocument();
  expect(within(change).getByText('2.00 TDF')).toBeInTheDocument();
  expect(
    within(change).getByText('Additional payment (EUR)'),
  ).toBeInTheDocument();
  expect(
    within(change).getByText('Additional TDF to stake'),
  ).toBeInTheDocument();
  expect(screen.getByText('€237.72 paid')).toBeInTheDocument();
  expect(screen.queryByText('Fully paid')).not.toBeInTheDocument();
});

test('a change that refunds money but needs more tokens labels each direction', () => {
  const held = {
    ...incident,
    createdBy: 'guest',
    pendingModification: {
      id: 'hold',
      status: 'pending-payment',
      requestedBy: 'guest',
      expiresAt: '2099-01-01',
      quote: {
        fiatDelta: -40,
        tokensDelta: 2,
        creditsDelta: 3,
        currency: 'EUR',
      },
    },
  } as Stay;
  renderWithNextIntl(<StayPaymentSummary stay={held} />);
  const change = screen.getByRole('region', { name: 'Pending change' });
  expect(within(change).getByText('Refund (EUR)')).toBeInTheDocument();
  expect(within(change).getByText('€40.00')).toBeInTheDocument();
  expect(
    within(change).getByText('Additional credits to redeem'),
  ).toBeInTheDocument();
  expect(
    within(change).getByText('Additional TDF to stake'),
  ).toBeInTheDocument();
});

test('a saved event discount code shows the list price it took money off', () => {
  const stay = {
    ...incident,
    eventId: 'event_1',
    adults: 2,
    ticketOption: { name: 'Regular ticket' },
    eventDiscount: { code: 'citizen' },
    priceLock: {
      ...incident.priceLock!,
      lines: { ...incident.priceLock!.lines, event: money(60) },
    },
  } as Stay;
  const ticketOptions = [
    { name: 'Regular ticket', price: 40, currency: 'EUR' },
  ];
  const { rerender } = renderWithNextIntl(
    <StayPaymentSummary stay={stay} eventTicketOptions={ticketOptions} />,
  );
  expect(screen.getByText('€80.00')).toBeInTheDocument();
  expect(screen.getByText('€60.00')).toBeInTheDocument();
  expect(screen.getByText('Discount (CITIZEN)')).toBeInTheDocument();
  expect(screen.getByText('−€20.00')).toBeInTheDocument();

  rerender(
    <StayPaymentSummary
      stay={{ ...stay, eventDiscount: null }}
      eventTicketOptions={ticketOptions}
    />,
  );
  expect(screen.queryByText(/Discount/)).not.toBeInTheDocument();
  expect(screen.queryByText('€80.00')).not.toBeInTheDocument();
});

test('uses only saved amounts for legacy stays and does not invent VAT details or payment completion', () => {
  const { rerender } = renderWithNextIntl(
    <StayPaymentSummary
      stay={{ status: 'confirmed' } as Stay}
      legacyCosts={{
        accommodation: money(99),
        total: money(119),
        utility: money(20),
      }}
    />,
  );
  expect(screen.getByText('€99.00')).toBeInTheDocument();
  expect(screen.queryByText('Fully paid')).not.toBeInTheDocument();
  rerender(
    <StayPaymentSummary
      stay={{
        ...incident,
        priceLock: { ...incident.priceLock!, vatBreakdown: undefined },
      }}
    />,
  );
  expect(screen.getByText('Includes €44.46 VAT')).toBeInTheDocument();
  expect(screen.queryByText('VAT details')).not.toBeInTheDocument();
});

test('a free linked event is included and fee help describes the saved average per night', () => {
  const { rerender } = renderWithNextIntl(
    <StayPaymentSummary stay={{ ...incident, eventId: 'event' }} />,
  );
  expect(screen.getByText('Included')).toBeInTheDocument();
  const info = screen.getByLabelText('About Food');
  fireEvent.click(info);
  expect(
    screen.getByText(
      '€70.00 over 5 nights: average €14.00/night for the whole booking.',
    ),
  ).toBeVisible();
  fireEvent.keyDown(info, { key: 'Escape' });
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  rerender(
    <StayPaymentSummary stay={{ ...incident, isHourlyBooking: true }} />,
  );
  expect(screen.queryByLabelText('About Food')).not.toBeInTheDocument();
});

test('a token-priced event is not labelled free or added to accommodation staking', () => {
  renderWithNextIntl(
    <StayPaymentSummary
      stay={{
        ...incident,
        eventId: 'event',
        priceLock: {
          ...incident.priceLock!,
          lines: { ...incident.priceLock!.lines, eventToken: money(5, 'TDF') },
        },
      }}
    />,
  );
  const costs = screen.getByRole('region', { name: 'Booking costs' });
  expect(within(costs).getByText('5.00 TDF')).toBeInTheDocument();
  expect(screen.queryByText('Included')).not.toBeInTheDocument();
  expect(
    screen.getByText(
      'Event token price; not included in the payment totals below.',
    ),
  ).toBeInTheDocument();
  expect(
    within(screen.getByRole('region', { name: 'Booking total' })).getByText(
      '8.67 TDF',
    ),
  ).toBeInTheDocument();
});

const charge = (
  id: string,
  method: string,
  amount: number,
  cur = 'EUR',
  extra = {},
): Charge =>
  ({
    id,
    status: 'paid',
    method,
    date: '2026-10-04T21:39:00Z',
    amount: { total: money(amount, cur) },
    ...extra,
  }) as unknown as Charge;

test('history deduplicates entries and displays locked stake, credits and refunds with restricted links', () => {
  const card = charge('card', 'stripe', 187.15, 'eur', {
    meta: { stripePaymentIntentId: 'pi_test' },
  });
  const charges = [
    card,
    card,
    charge('stake', 'tokens', 0, 'TDF', {
      lockedStake: money(8.669192, 'TDF'),
    }),
    charge('credits', 'credits', 3, 'credits'),
    charge('refund', 'stripe', 10, 'EUR', { status: 'refunded' }),
  ];
  const { rerender } = renderWithNextIntl(
    <StayPaymentHistory charges={charges} />,
  );
  expect(screen.getAllByRole('listitem')).toHaveLength(4);
  expect(screen.getByText('€187.15')).toBeInTheDocument();
  expect(screen.getByText('8.67 TDF')).toBeInTheDocument();
  expect(screen.getByText('3.00 credits')).toBeInTheDocument();
  expect(screen.getByText('Refunded')).toBeInTheDocument();
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
  rerender(<StayPaymentHistory charges={charges} canManage />);
  expect(screen.getByRole('link', { name: '€187.15' })).toHaveAttribute(
    'href',
    'https://dashboard.stripe.com/payments/pi_test',
  );
});

test.each(['paid', 'refunded', 'pending-refund'])(
  'history renders a legacy flat %s amount alongside modern payments',
  (status) => {
    renderWithNextIntl(
      <StayPaymentHistory
        charges={[
          charge('legacy', 'stripe', 75, 'EUR', { status, amount: money(75) }),
          charge('modern', 'stripe', 25),
          charge('stake', 'tokens', 0, 'EUR', { lockedStake: money(2, 'TDF') }),
        ]}
      />,
    );
    expect(screen.getByText('€75.00')).toBeInTheDocument();
    expect(screen.getByText('€25.00')).toBeInTheDocument();
    expect(screen.getByText('2.00 TDF')).toBeInTheDocument();
  },
);

test('an explicit zero refunded amount is not replaced by the paid amount', () => {
  renderWithNextIntl(
    <StayPaymentHistory
      charges={[
        charge('refund', 'stripe', 75, 'EUR', {
          status: 'refunded',
          amount: { total: money(75), totalRefunded: money(0) },
        }),
      ]}
    />,
  );
  expect(screen.getByText('€0.00')).toBeInTheDocument();
});

test('history errors offer retry and never pretend there are no recorded payments', () => {
  const retry = jest.fn();
  renderWithNextIntl(<StayPaymentHistory charges={[]} error onRetry={retry} />);
  expect(screen.getByRole('alert')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  expect(retry).toHaveBeenCalledTimes(1);
  expect(
    screen.queryByText('No payments recorded yet.'),
  ).not.toBeInTheDocument();
});

test.each([
  'https://explorer.celo.org/mainnet',
  'https://celo-sepolia.blockscout.com/',
])(
  'stake links use the configured explorer %s and the charge hash',
  (explorer) => {
    const txId = `0x${'a'.repeat(64)}`;
    renderWithNextIntl(
      <ConfigProvider
        config={
          { ...blockchainConfig, BLOCKCHAIN_EXPLORER_URL: explorer } as any
        }
      >
        <StayPaymentHistory
          charges={[
            charge('stake', 'tokens', 0, 'EUR', {
              lockedStake: money(8.669192, 'TDF'),
              meta: { txId },
            }),
            charge('recovered', 'tokens', 0, 'EUR', {
              lockedStake: money(2, 'TDF'),
            }),
            charge('placeholder', 'tokens', 0, 'EUR', {
              lockedStake: money(3, 'TDF'),
              meta: { txId: 'existing' },
            }),
          ]}
        />
      </ConfigProvider>,
    );
    const link = screen.getByRole('link', {
      name: '8.67 TDF — View stake transaction',
    });
    expect(link).toHaveAttribute(
      'href',
      `${explorer.replace(/\/$/, '')}/tx/${txId}`,
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(screen.getAllByRole('link')).toHaveLength(1);
  },
);

test('keeps stake refresh available without showing an empty TDF payment row', () => {
  const refresh = <button>Check staking status</button>;
  const { rerender } = renderWithNextIntl(
    <StayPaymentSummary stay={incident} tokenActions={refresh} />,
  );
  expect(screen.getByText('8.67 TDF staked').parentElement).toContainElement(
    screen.getByRole('button', { name: 'Check staking status' }),
  );
  rerender(
    <StayPaymentSummary
      stay={{
        ...incident,
        tokensTarget: money(0, 'TDF'),
        tokensStaked: money(0, 'TDF'),
      }}
      tokenActions={refresh}
    />,
  );
  expect(screen.queryByText('TDF')).not.toBeInTheDocument();
  expect(screen.queryByText('0.00 TDF staked')).not.toBeInTheDocument();
  expect(screen.queryByText('Complete')).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Check staking status' }),
  ).toBeVisible();
  rerender(
    <StayPaymentSummary
      stay={{
        ...incident,
        tokensTarget: undefined,
        tokensStaked: undefined,
        appliedTokens: undefined,
        priceLock: undefined,
      }}
      tokenActions={refresh}
    />,
  );
  expect(screen.queryByText('TDF')).not.toBeInTheDocument();
  expect(screen.queryByText('0.00 TDF staked')).not.toBeInTheDocument();
  expect(screen.queryByText('Complete')).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Check staking status' }),
  ).toBeVisible();
});

test.each([
  { target: 2, staked: 0, status: '2.00 TDF still to stake' },
  { target: 0, staked: 2, status: 'Complete' },
])(
  'preserves a TDF row with $target allocated and $staked staked',
  ({ target, staked, status }) => {
    renderWithNextIntl(
      <StayPaymentSummary
        stay={{
          ...incident,
          tokensTarget: money(target, 'TDF'),
          tokensStaked: money(staked, 'TDF'),
        }}
        tokenActions={<button>Check staking status</button>}
      />,
    );
    expect(
      screen.getByText(`${staked.toFixed(2)} TDF staked`).parentElement,
    ).toContainElement(
      screen.getByRole('button', { name: 'Check staking status' }),
    );
    expect(screen.getByText(status)).toBeInTheDocument();
  },
);

test('a combined stake charge links every verified transaction and deduplicates legacy references', () => {
  const hashes = ['a', 'b'].map((digit) => `0x${digit.repeat(64)}`);
  renderWithNextIntl(
    <ConfigProvider
      config={
        {
          ...blockchainConfig,
          BLOCKCHAIN_EXPLORER_URL: 'https://celoscan.io',
        } as any
      }
    >
      <StayPaymentHistory
        charges={[
          charge('batches', 'tokens', 0, 'EUR', {
            lockedStake: money(8.669192, 'TDF'),
            meta: {
              txHash: hashes[0],
              stakeTransactions: hashes.map((transactionId) => ({
                transactionId,
                date: '2026-10-05',
                nights: [],
              })),
            },
          }),
        ]}
      />
    </ConfigProvider>,
  );
  expect(
    screen.getAllByRole('link').map((link) => link.getAttribute('href')),
  ).toEqual(hashes.map((hash) => `https://celoscan.io/tx/${hash}`));
  expect(screen.getByText('8.67 TDF')).toBeInTheDocument();
});

test('a zero balance does not label an unsettled booking fully paid', () => {
  renderWithNextIntl(
    <StayPaymentSummary stay={{ ...incident, fiatPaid: money(237.72) }} />,
  );
  expect(screen.queryByText('Fully paid')).not.toBeInTheDocument();
});
