import React from 'react';

import { fireEvent, screen, waitFor, within } from '@testing-library/react';

import { renderWithNextIntl } from '../../../test/utils';
import { Role } from '../../../types/api';
import { WalletState } from '../../../contexts/wallet';
import RoleResidencyPage from './index';

const RESIDENCY_CONFIG = {
  enabled: true,
  cashMultiplier: 0.7,
  maxCashOut: 700,
  sweatRate: 1.67,
  sweatMaxBonus: 300,
  foodMonthly: 336,
  utilitiesMonthly: 150,
  graceDays: 5,
  boundaryPenalty: 2,
  presenceScaleMax: 930,
  agreementVersion: '1.0',
  agreementTemplate: '',
  presenceTiers: [
    { label: 'Newcomer', minPresence: 0, cashPct: 0, unlocks: 'Resident' },
    { label: 'Grown', minPresence: 100, cashPct: 30, unlocks: 'Cash out' },
    { label: 'Canopy', minPresence: 465, cashPct: 70, unlocks: 'Lead' },
  ],
  seasons: [
    {
      id: 'fall',
      label: 'Fall',
      startMonth: 9,
      durationMonths: 3,
      pace: 'high',
    },
    {
      id: 'spring',
      label: 'Spring',
      startMonth: 2,
      durationMonths: 5,
      pace: 'high',
    },
  ],
  acknowledgements: [
    { id: 'terms', label: 'I accept the terms.' },
    { id: 'notice', label: 'I will give notice.' },
  ],
};

jest.mock('../../../utils/cachedConfig.helpers', () => ({
  getCachedConfig: (slug: string) =>
    slug === 'residency'
      ? RESIDENCY_CONFIG
      : slug === 'roles'
        ? { enabled: true }
        : { platformName: 'TDF' },
}));

/** The member's existing stays, per test. */
const mockStays: any[] = [];

/**
 * What the chain reports, per test. It defaults to values deliberately unlike
 * the cached ones so a disconnected render proves it ignored them; a connected
 * test sets them to match, keeping the arithmetic below about one thing.
 */
const mockChain = { presence: '9999', sweat: '7777' };

jest.mock('../../../hooks/usePresenceToken', () => ({
  usePresenceToken: () => ({
    presenceBalance: mockChain.presence,
    isLoading: false,
    error: null,
  }),
}));
jest.mock('../../../hooks/useSweatToken', () => ({
  useSweatToken: () => ({
    sweatBalance: mockChain.sweat,
    isLoading: false,
    error: null,
  }),
}));
jest.mock('../../../hooks/useBuyTokens', () => ({
  useBuyTokens: () => ({
    getCurrentSupplyWithoutWallet: jest.fn().mockResolvedValue(0),
  }),
}));
// No wallet: the tool must price the season off the cached balances alone.
jest.mock('../../../contexts/wallet', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const react = require('react');
  return {
    WalletState: react.createContext({
      isWalletConnected: false,
      isWalletReady: false,
      isCorrectNetwork: false,
      hasSameConnectedAccount: false,
      balanceTotal: '0',
    }),
    WalletDispatch: react.createContext({ connectWallet: jest.fn() }),
  };
});


/**
 * The page's `../../../utils/api` resolves to the real module, so it needs its
 * own mock — the `.js` suffix is what the repo uses to sidestep the bare
 * `utils/api` moduleNameMapper entry (see test/eventReport.test.tsx).
 */
jest.mock('../../../utils/api.js', () => ({
  __esModule: true,
  default: {
    // The page reads the member's own stays here, to credit nights they have
    // already booked inside the season.
    get: jest.fn(() => Promise.resolve({ data: { results: mockStays } })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
  },
  formatSearch: (where: unknown) =>
    typeof where !== 'undefined'
      ? encodeURIComponent(JSON.stringify(where))
      : '',
  cdn: '',
  invalidateGetCache: jest.fn(),
  refreshTokensProactively: jest.fn(() => Promise.resolve(null)),
  setOnSessionInvalid: jest.fn(),
}));

const post = jest.requireMock('../../../utils/api.js').default.post as jest.Mock;

jest.mock('../../../contexts/auth', () => ({
  useAuth: () => ({
    user: {
      screenname: 'Tonya',
      _id: 'u1',
      stats: { wallet: { presence: 500, tdf: 100, sweat: 0 } },
    },
    isAuthenticated: true,
  }),
  AuthProvider: ({ children }: any) => children,
}));

/** The platform's listings, priced per night — 120 and 600 per 30-day month. */
const LISTINGS = [
  {
    _id: 'camping',
    name: 'Camping',
    description: '<p>Own tent</p>',
    photos: [],
    priceDuration: 'night',
    fiatPrice: { val: 120 / 30, cur: 'EUR' },
    tokenPrice: { val: 14 / 30, cur: 'TDF' },
    availableFor: ['team'],
  },
  {
    _id: 'loft',
    name: 'The loft',
    description: '<p>Loft</p>',
    photos: [],
    priceDuration: 'night',
    fiatPrice: { val: 600 / 30, cur: 'EUR' },
    tokenPrice: { val: 30 / 30, cur: 'TDF' },
    availableFor: ['team'],
  },
] as any;

const ROLE: Role = {
  _id: 'role-1',
  title: 'Mushroom Farm Lead',
  description: '',
  compensation: '',
  hoursPerWeek: 40,
  skillsRequired: [],
  responsibilities: ['Run the farm'],
  visibleBy: [],
  createdBy: '',
  updated: '',
  created: '',
  attributes: [],
  managedBy: [],
  isResidency: true,
  baseCompensation: 1800,
  minPresence: 465,
  minTermMonths: 6,
  daysPerWeek: 5,
  hoursPerDay: 8,
  team: 'executive',
};

/** A wallet the member has connected, on the right network, with 100 tokens. */
const CONNECTED_WALLET = {
  isWalletConnected: true,
  isWalletReady: true,
  isCorrectNetwork: true,
  hasSameConnectedAccount: true,
  balanceTotal: '100',
};

const renderPage = (
  role: Role = ROLE,
  listings: any = LISTINGS,
  wallet?: Record<string, unknown>,
) => {
  const page = (
    <RoleResidencyPage role={role} listings={listings} error={null} />
  );
  return renderWithNextIntl(
    wallet ? (
      <WalletState.Provider value={wallet as any}>{page}</WalletState.Provider>
    ) : (
      page
    ),
  );
};

const slider = (label: string) =>
  screen.getByLabelText(label, { selector: 'input[type=range]' });

/**
 * `Intl.NumberFormat` separates the amount from the symbol with a non-breaking
 * space in some locales, so a plain string match never lands on a formatted
 * price. Prices here render in the jsdom default (en-US): "€1,194".
 */
const normalized = (needle: string) => (content: string) =>
  content.replace(/\u00a0/g, ' ') === needle;

const containing = (needle: string) => (content: string) =>
  content.replace(/\u00a0/g, ' ').includes(needle);

describe('RoleResidencyPage', () => {
  beforeEach(() => {
    post.mockClear();
    mockChain.presence = '9999';
    mockChain.sweat = '7777';
    mockStays.length = 0;
  });

  /** Line the chain up with the cached numbers, for connected-wallet tests. */
  const chainMatchesCache = () => {
    mockChain.presence = '500';
    mockChain.sweat = '0';
  };

  it('renders the whole tool on first paint, with no loading step', () => {
    renderPage();
    expect(screen.getByText(/01 · Your standing/)).toBeInTheDocument();
    expect(screen.getByText(/06 · Your agreement/)).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('prices the settlement from the role and the cached standing', () => {
    renderPage();
    // 1800 base, no sweat, minus 486 living, minus 120 camping = 1194
    expect(screen.getByText(normalized('€1,194/mo'))).toBeInTheDocument();
  });

  it('reads the balances off the user record when no wallet is connected', () => {
    renderPage();
    // user.stats.wallet, not the 9999/7777 the chain hooks would report.
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.queryByText('9999')).not.toBeInTheDocument();
    expect(screen.queryByText('7777')).not.toBeInTheDocument();
    expect(screen.getAllByText('From your record').length).toBe(3);
    // Canopy comes from the cached 500 $Presence, so the tool is fully usable.
    expect(
      screen.getByRole('button', { name: /Canopy tier/ }),
    ).toBeInTheDocument();
  });

  it('prices the accommodation from the listing, per 30-day month', () => {
    renderPage();
    const card = (label: string) =>
      screen.getByText(label).closest('button')?.textContent?.replace(
        /\u00a0/g,
        ' ',
      ) ?? '';
    // Nightly listing rates restated in the 30-day month a season bills in.
    expect(card('Camping')).toContain('€120/mo or 14 TDF/mo');
    expect(card('The loft')).toContain('€600/mo or 30 TDF/mo');
    // The listing description carries over, stripped of its markup.
    expect(card('Camping')).toContain('Own tent');
  });

  it('recomputes when a costlier accommodation is picked', () => {
    renderPage();
    fireEvent.click(screen.getByText('The loft'));
    // 1800 − 486 − 600 = 714. No wallet, so no token cover to offset it.
    expect(screen.getByText(normalized('€714/mo'))).toBeInTheDocument();
  });

  it('offers the cash price and a connect prompt with no wallet', () => {
    renderPage();
    expect(
      screen.getByText(containing('Accommodation fiat due: €120/mo')),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /Connect wallet to use TDF to discount your stay/,
      }),
    ).toBeInTheDocument();
    // Nothing to drag: the member cannot spend what no wallet is holding.
    expect(
      screen.queryByLabelText('04 · Spend TDF on your stay', {
        selector: 'input[type=range]',
      }),
    ).not.toBeInTheDocument();
  });

  it('locking tokens against the stay raises the net allocation', () => {
    chainMatchesCache();
    renderPage(ROLE, LISTINGS, CONNECTED_WALLET);
    fireEvent.change(slider('04 · Spend TDF on your stay'), {
      target: { value: '42' },
    });
    expect(
      screen.getByText(/42 \/ 42 TDF locked \(100% covered\)/),
    ).toBeInTheDocument();
    expect(screen.getByText(normalized('€1,314/mo'))).toBeInTheDocument();
  });

  it('picking a place pre-locks what the connected wallet can cover', () => {
    chainMatchesCache();
    renderPage(ROLE, LISTINGS, CONNECTED_WALLET);
    fireEvent.click(screen.getByText('The loft'));
    // 3 months × 30 = 90 needed, and the wallet holds 100.
    expect(
      screen.getByText(/90 \/ 90 TDF locked \(100% covered\)/),
    ).toBeInTheDocument();
    expect(screen.getByText(normalized('€1,314/mo'))).toBeInTheDocument();
  });

  it('names the accommodation when the listing has no token price', () => {
    chainMatchesCache();
    const fiatOnly = [{ ...LISTINGS[0], tokenPrice: undefined }];
    renderPage(ROLE, fiatOnly, CONNECTED_WALLET);
    expect(
      screen.getByText(/Camping is priced in cash only/),
    ).toBeInTheDocument();
  });

  it('caps the cash slider at the tier share of the net', () => {
    renderPage();
    const cash = slider('05 · Cash out');
    // Canopy: 70% of 1194 = 835.8, under the 700 hard cap → cap is 700.
    expect(cash).toHaveAttribute('max', '700');
    fireEvent.change(cash, { target: { value: '700' } });
    expect(
      screen.getByText(containing('€700 requested → €490 paid')),
    ).toBeInTheDocument();
  });

  it('resets the dates when a different season is picked', () => {
    renderPage();
    const before = screen.getByText(/billed 3 mo/);
    expect(before).toBeInTheDocument();
    fireEvent.click(screen.getByText('Spring'));
    expect(screen.getByText(/billed 5 mo/)).toBeInTheDocument();
  });

  it('warns once the arrival passes the grace window', () => {
    renderPage();
    fireEvent.change(slider('Arrival'), { target: { value: '20' } });
    expect(
      screen.getByText(/beyond the 5-day grace|Arriving 20 days/),
    ).toBeInTheDocument();
  });

  it('opens the generated agreement in a modal', () => {
    renderPage();
    fireEvent.click(screen.getByText('Read the agreement'));
    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByText(/Mushroom Farm Lead · version 1.0/),
    ).toBeInTheDocument();
    // react-markdown is stubbed repo-wide, so the body shows as raw markdown.
    const body = dialog.textContent ?? '';
    expect(body).toContain('## Non-disclosure');
    expect(body).toContain('- Run the farm');
    expect(body).toContain('Season: **Fall**');
    expect(body).toContain('**Net allocation — €1,194 / month**');
    expect(body).not.toContain('{{');
  });

  it('credits nights already booked inside the season', async () => {
    // Fall runs 1 Sep – 30 Nov 2026: 91 days, 90 nights.
    mockStays.push({
      _id: 'stay-1',
      status: 'paid',
      start: '2026-09-10T00:00:00.000Z',
      end: '2026-09-20T00:00:00.000Z',
    });
    renderPage();

    await waitFor(() =>
      expect(
        screen.getByText(/You already have 10 of these 91 nights booked/),
      ).toBeInTheDocument(),
    );
    // 120/mo over 90 nights, 10 of them already paid for.
    const billable = (90 - 10) / 90;
    const accommodation = 120 * billable;
    const net = 1800 - 486 - accommodation;
    expect(
      screen.getByText(normalized(`€${Math.round(net).toLocaleString()}/mo`)),
    ).toBeInTheDocument();
  });

  it('ignores a cancelled stay when crediting nights', async () => {
    mockStays.push({
      _id: 'stay-1',
      status: 'cancelled',
      start: '2026-09-10T00:00:00.000Z',
      end: '2026-09-20T00:00:00.000Z',
    });
    renderPage();

    await waitFor(() =>
      expect(screen.getByText(normalized('€1,194/mo'))).toBeInTheDocument(),
    );
    expect(
      screen.queryByText(/nights booked/),
    ).not.toBeInTheDocument();
  });

  it('drops the lock clause from the CTA when nothing is being locked', () => {
    renderPage();
    expect(
      screen.getByRole('button', { name: 'Reserve Fall' }),
    ).toBeInTheDocument();
  });

  it('names the lock on the CTA once tokens are committed', () => {
    chainMatchesCache();
    renderPage(ROLE, LISTINGS, CONNECTED_WALLET);
    fireEvent.change(slider('04 · Spend TDF on your stay'), {
      target: { value: '42' },
    });
    expect(
      screen.getByRole('button', { name: 'Reserve Fall · lock 42 TDF' }),
    ).toBeInTheDocument();
  });

  it('keeps submit disabled until every box is ticked', () => {
    renderPage();
    const submit = screen.getByRole('button', { name: /Reserve Fall/ });
    expect(submit).toBeDisabled();

    fireEvent.click(screen.getByLabelText('I accept the terms.'));
    fireEvent.click(screen.getByLabelText('I will give notice.'));
    expect(submit).toBeDisabled();

    fireEvent.click(
      screen.getByLabelText(/I have read the Mushroom Farm Lead agreement/),
    );
    expect(submit).toBeEnabled();
  });

  it('submits a snapshot of the agreement and the quote', async () => {
    renderPage();
    fireEvent.click(screen.getByLabelText('I accept the terms.'));
    fireEvent.click(screen.getByLabelText('I will give notice.'));
    fireEvent.click(
      screen.getByLabelText(/I have read the Mushroom Farm Lead agreement/),
    );
    fireEvent.click(screen.getByRole('button', { name: /Reserve Fall/ }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const [url, payload] = post.mock.calls[0];
    expect(url).toBe('/residency-agreements');
    expect(payload.roleId).toBe('role-1');
    // The booking the server has to create, alongside the terms.
    expect(payload.stay.listingId).toBe('camping');
    expect(payload.stay.adults).toBe(1);
    expect(payload.stay.isTeamBooking).toBe(true);
    expect(payload.stay.start.slice(0, 10)).toBe('2026-09-01');
    expect(payload.stay.end.slice(0, 10)).toBe('2026-11-30');
    expect(payload.agreementVersion).toBe('1.0');
    expect(payload.acknowledgedIds).toEqual(['terms', 'notice']);
    expect(payload.agreementBody).toContain('Mushroom Farm Lead');
    expect(payload.quote.seasonId).toBe('fall');
    expect(Math.round(payload.quote.net)).toBe(1194);
    expect(payload.acceptedAt).toBeTruthy();

    await waitFor(() =>
      expect(screen.getByText(/Agreement submitted/)).toBeInTheDocument(),
    );
  });

  it('shows the tier ladder with the member marked on it', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Canopy tier/ }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('you · 500')).toBeInTheDocument();
    expect(within(dialog).getByText('70% cash')).toBeInTheDocument();
  });

  it('falls back to the plain listing for a non-residency role', () => {
    renderPage({ ...ROLE, isResidency: false });
    expect(
      screen.getByText(/This role is not offered as a seasonal residency/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/01 · Your standing/)).not.toBeInTheDocument();
  });
});
