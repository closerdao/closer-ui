import React from 'react';

import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';

import { WalletState } from '../../../contexts/wallet';
import { renderWithNextIntl } from '../../../test/utils';
import { Role } from '../../../types/api';
import RoleResidencyPage from './index';

const RESIDENCY_CONFIG = {
  enabled: true,
  associationName: 'Associação Ambiental da Fábrica dos Sonhos Tradicionais',
  legalFramework: 'Lei n.º 71/98',
  legalFrameworkUrl: '/volunteering',
  jurisdiction: 'Santiago do Cacém',
  noticeWeeks: 2,
  expenseReimbursementDays: 30,
  presenceScaleMax: 930,
  sweatRate: 1.67,
  sweatMaxBonus: 300,
  agreementVersion: '1.0',
  // Unset: the bilingual agreement the page ships with is what gets rendered.
  agreementTemplate: '',
  presenceTiers: [
    { label: 'Newcomer', minPresence: 0, unlocks: 'Season windows' },
    { label: 'Grown', minPresence: 100, unlocks: 'Mentor role' },
    { label: 'Canopy', minPresence: 465, unlocks: 'Coordinator role' },
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
    { id: 'unpaid', label: 'I understand this is unpaid.' },
    { id: 'conduct', label: 'I accept the Code of Conduct.' },
  ],
};

/**
 * The booking setup: the program feeds and powers its volunteers, at 336 + 150
 * a month. Internal figures — they size the token allocation and are never
 * shown to a volunteer.
 */
const BOOKING_CONFIG = {
  enabled: true,
  foodOptionEnabled: true,
  utilityOptionEnabled: true,
  utilityFiatVal: 5,
};

const FOOD_OPTIONS = [
  { _id: 'full', name: 'Full board', price: 11.2, isDefault: true },
] as any;

/** What this platform has actually saved, per test. */
let savedResidencyConfig: Record<string, unknown> | null = RESIDENCY_CONFIG;
let savedBookingConfig: Record<string, unknown> | null = BOOKING_CONFIG;

jest.mock('../../../utils/cachedConfig.helpers', () => ({
  // Both the feature switch and the roles page gate read as on here.
  getCachedConfig: (slug: string) =>
    slug === 'residency' || slug === 'roles'
      ? { enabled: true }
      : { platformName: 'TDF' },
  // The season is laid out from the documents as the platform saved them,
  // never from the schema defaults merged over them.
  getSavedConfig: (slug: string) => {
    if (slug === 'residency') return savedResidencyConfig;
    if (slug === 'booking') return savedBookingConfig;
    return null;
  },
}));

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
// No wallet: the season must lay out off the cached balances alone.
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
    get: jest.fn(() => Promise.resolve({ data: { results: [] } })),
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

const post = jest.requireMock('../../../utils/api.js').default
  .post as jest.Mock;

/*
 * There is no fallback token price, so the curve has to answer: the allocation
 * is sized by converting the association's budget at the live price. One
 * stable identity, as the real hook's useCallback gives — a fresh function per
 * render would re-run the price effect on every render.
 */
jest.mock('../../../hooks/useBuyTokens', () => {
  const getCurrentSupplyWithoutWallet = jest.fn().mockResolvedValue(1000);
  return { useBuyTokens: () => ({ getCurrentSupplyWithoutWallet }) };
});

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

/** The covered dorm at 90/mo, and a private room at 600/mo. */
const LISTINGS = [
  {
    _id: 'dorm',
    name: 'Seed Shared Dorm',
    description: '<p>Your covered base</p>',
    photos: [],
    priceDuration: 'night',
    fiatPrice: { val: 90 / 30, cur: 'EUR' },
    tokenPrice: { val: 3 / 30, cur: 'TDF' },
    availableFor: ['resident'],
  },
  {
    _id: 'private',
    name: 'Seed Private Room',
    description: '<p>Own room</p>',
    photos: [],
    priceDuration: 'night',
    fiatPrice: { val: 600 / 30, cur: 'EUR' },
    tokenPrice: { val: 4.5 / 30, cur: 'TDF' },
    availableFor: ['resident'],
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
  // The association's monthly budget for the role, never shown as pay.
  baseCompensation: 1800,
  minPresence: 465,
  minTermMonths: 6,
  daysPerWeek: 5,
  hoursPerDay: 8,
  team: 'executive',
};

/** A wallet the volunteer has connected, on the right network, with 100 TDF. */
const CONNECTED_WALLET = {
  isWalletConnected: true,
  isWalletReady: true,
  isCorrectNetwork: true,
  hasSameConnectedAccount: true,
  balanceTotal: '100',
};

/**
 * The token price is read off the bonding curve before the allocation can be
 * sized — there is no fallback price — so every test waits for that read to
 * settle rather than asserting against the placeholder.
 */
const renderPage = async (
  role: Role = ROLE,
  listings: any = LISTINGS,
  wallet?: Record<string, unknown>,
  foodOptions: any = FOOD_OPTIONS,
) => {
  const page = (
    <RoleResidencyPage
      role={role}
      listings={listings}
      foodOptions={foodOptions}
      error={null}
    />
  );
  const rendered = renderWithNextIntl(
    wallet ? (
      <WalletState.Provider value={wallet as any}>{page}</WalletState.Provider>
    ) : (
      page
    ),
  );
  // Flush the price read inside act, so a page that never showed the
  // placeholder (a non-residency role) does not settle after the test ends.
  await act(async () => {});
  await waitFor(() =>
    expect(screen.queryByRole('status')).not.toBeInTheDocument(),
  );
  return rendered;
};

const slider = (label: string) =>
  screen.getByLabelText(label, { selector: 'input[type=range]' });

/**
 * `Intl.NumberFormat` separates the amount from the symbol with a non-breaking
 * space in some locales, so a plain string match never lands on a formatted
 * price. Prices here render in the jsdom default (en-US): "€1,194".
 */
const normalized = (needle: string) => (content: string) =>
  content.replace(/ /g, ' ') === needle;

const containing = (needle: string) => (content: string) =>
  content.replace(/ /g, ' ').includes(needle);

describe('RoleResidencyPage', () => {
  beforeEach(() => {
    post.mockClear();
    mockChain.presence = '9999';
    mockChain.sweat = '7777';
    savedResidencyConfig = RESIDENCY_CONFIG;
    savedBookingConfig = BOOKING_CONFIG;
  });

  /** Line the chain up with the cached numbers, for connected-wallet tests. */
  const chainMatchesCache = () => {
    mockChain.presence = '500';
    mockChain.sweat = '0';
  };

  it('states the legal frame before anything a volunteer can choose', async () => {
    await renderPage();
    // A function matcher also matches every ancestor whose text contains it,
    // so count matches rather than insisting on exactly one node.
    expect(
      screen.getAllByText(
        containing(
          'Volunteer season · Associação Ambiental da Fábrica dos Sonhos Tradicionais',
        ),
      ).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(containing('Volunteering is unpaid')).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(containing('Lei n.º 71/98')).length,
    ).toBeGreaterThan(0);
  });

  it('renders the whole tool once the price behind the allocation is in', async () => {
    await renderPage();
    expect(screen.getByText(/01 · Your journey/)).toBeInTheDocument();
    expect(screen.getByText(/05 · Your agreement/)).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('allocates tokens for the season, at a fair market value of zero', async () => {
    const { container } = await renderPage();
    expect(
      screen.getByText(containing('its fair market value is €0')),
    ).toBeInTheDocument();
    // Never presented as pay for the hours given.
    expect(
      screen.getByText(containing('never calculated from the hours you give')),
    ).toBeInTheDocument();
    // The quantity is shown — once in the section, once in the summary — and
    // the budget behind it never is.
    expect(screen.getAllByText(/^[\d.]+ tk$/).length).toBe(2);
    const page = container.textContent ?? '';
    expect(page).not.toContain('1,800');
    expect(page).not.toContain('336');
  });

  it('never offers pay, a wage or a cash-out', async () => {
    const { container } = await renderPage();
    const page = container.textContent ?? '';
    // The token allocation is allowed to say "allocation"; nothing here may
    // read as money owed for the season.
    expect(page).not.toMatch(
      /cash out|net allocation|salary|gross|compensation|paid out/i,
    );
    expect(page).toMatch(/Included by the program/);
  });

  it('reads the balances off the user record when no wallet is connected', async () => {
    await renderPage();
    // user.stats.wallet, not the 9999/7777 the chain hooks would report.
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.queryByText('9999')).not.toBeInTheDocument();
    expect(screen.getAllByText('From your record').length).toBe(3);
    expect(screen.getByRole('button', { name: /Canopy/ })).toBeInTheDocument();
  });

  it('covers the cheapest room and prices the rest as an upgrade', async () => {
    await renderPage();
    const card = (label: string) =>
      screen
        .getByText(label)
        .closest('button')
        ?.textContent?.replace(/ /g, ' ') ?? '';
    expect(card('Seed Shared Dorm')).toContain('Included');
    expect(card('Seed Shared Dorm')).toContain('provided by the program');
    // 600 − 90 a month, and 4.5 − 3 in tokens.
    expect(card('Seed Private Room')).toContain('Upgrade');
    expect(card('Seed Private Room')).toContain('+€510/mo or 1.5 TDF/mo');
  });

  it('owes nothing for the season a volunteer takes as it comes', async () => {
    await renderPage();
    expect(screen.getByText('No upgrade taken')).toBeInTheDocument();
    // Nothing owed for the room, and nothing the allocation is worth.
    expect(screen.getAllByText(normalized('€0')).length).toBeGreaterThan(0);
  });

  it('takes an upgrade out of the allocation rather than billing for it', async () => {
    await renderPage();
    fireEvent.click(screen.getByText('Seed Private Room'));
    // 510 a month across the three months of the fall season — and the budget
    // for the role still has room for it, so no euro figure appears at all.
    expect(
      screen.getByText(containing('There is nothing to pay')),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Covered by your season allocation'),
    ).toBeInTheDocument();
    expect(screen.queryByText(normalized('€1,530'))).not.toBeInTheDocument();
  });

  it('asks for euros only for what the allocation could not absorb', async () => {
    // 700 of budget a month, of which 576 is already what the program spends:
    // 124 a month, 372 across the season, against a 1,530 upgrade.
    await renderPage({ ...ROLE, baseCompensation: 700 });
    fireEvent.click(screen.getByText('Seed Private Room'));
    expect(
      screen.getByText(containing('and €1,158 is left to pay')),
    ).toBeInTheDocument();
    // The slip carries the same figure, on its own line.
    expect(screen.getByText(normalized('€1,158'))).toBeInTheDocument();
  });

  it('leaves the wallet alone until the volunteer stakes from it', async () => {
    chainMatchesCache();
    await renderPage(ROLE, LISTINGS, CONNECTED_WALLET);
    fireEvent.click(screen.getByText('Seed Private Room'));
    // Nothing of theirs is touched by default: the allocation covers the room.
    expect(
      screen.getByText(/0 \/ 4\.5 TDF staked \(0% of the upgrade\)/),
    ).toBeInTheDocument();
    // 3 months × 1.5 TDF, and the wallet holds 100, so the whole upgrade is
    // within reach of the slider.
    fireEvent.change(slider('Stake $TDF on your upgrade'), {
      target: { value: '4.5' },
    });
    expect(
      screen.getByText(/4\.5 \/ 4\.5 TDF staked \(100% of the upgrade\)/),
    ).toBeInTheDocument();
  });

  it('lists what the program covers, at no cost', async () => {
    await renderPage();
    const summary = screen
      .getByText('Included by the program')
      .closest('div') as HTMLElement;
    expect(within(summary).getAllByText('Included').length).toBeGreaterThan(1);
    expect(
      within(summary).getByText(/Documented expenses \(within 30 days\)/),
    ).toBeInTheDocument();
    // Never promised on the association's behalf: a policy nobody ticked is a
    // policy nobody bought.
    expect(
      within(summary).queryByText(/Accident insurance/),
    ).not.toBeInTheDocument();
  });

  it('promises accident cover only where the association says it holds it', async () => {
    savedResidencyConfig = { ...RESIDENCY_CONFIG, providesInsurance: true };
    await renderPage();
    expect(screen.getByText(/Accident insurance/)).toBeInTheDocument();
  });

  it('records presence as days, and $Sweat as recognition only', async () => {
    await renderPage();
    expect(screen.getByText('+91 days')).toBeInTheDocument();
    expect(screen.getByText('Recognition only')).toBeInTheDocument();
  });

  it('asks for notice as a courtesy, never as a penalty', async () => {
    await renderPage();
    fireEvent.change(slider('Arrival'), { target: { value: '20' } });
    expect(
      screen.getByText(containing('we ask for 2 weeks')),
    ).toBeInTheDocument();
    // Arriving late is a choice, not a charge.
    expect(
      screen.getByText(
        containing('end your season at any time, without penalty'),
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/charged at|boundary/i)).not.toBeInTheDocument();
  });

  it('opens the bilingual agreement in a modal', async () => {
    await renderPage();
    fireEvent.click(screen.getByText('Read the agreement'));
    const dialog = screen.getByRole('dialog');
    const body = dialog.textContent ?? '';
    // react-markdown is stubbed repo-wide, so the body shows as raw markdown.
    expect(body).toContain('Acordo de Voluntariado');
    expect(body).toContain('Lei n.º 71/98');
    expect(body).toContain('Não cria, nem as partes pretendem criar');
    expect(body).toContain('Seed Shared Dorm');
    expect(body).toContain('5 half-days per week');
    expect(body).not.toContain('{{');
  });

  it('keeps submit disabled until every box is ticked', async () => {
    await renderPage();
    const submit = screen.getByRole('button', { name: /Join Fall/ });
    expect(submit).toBeDisabled();

    fireEvent.click(screen.getByLabelText('I understand this is unpaid.'));
    fireEvent.click(screen.getByLabelText('I accept the Code of Conduct.'));
    expect(submit).toBeDisabled();

    fireEvent.click(
      screen.getByLabelText(/I have read the Mushroom Farm Lead agreement/),
    );
    expect(submit).toBeEnabled();
  });

  it('submits the agreement and the season as signed', async () => {
    await renderPage();
    fireEvent.click(screen.getByLabelText('I understand this is unpaid.'));
    fireEvent.click(screen.getByLabelText('I accept the Code of Conduct.'));
    fireEvent.click(
      screen.getByLabelText(/I have read the Mushroom Farm Lead agreement/),
    );
    fireEvent.click(screen.getByRole('button', { name: /Join Fall/ }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const [url, payload] = post.mock.calls[0];
    // One call: the endpoint books the stay and files the agreement together.
    expect(url).toBe('/residencies/apply');
    expect(payload.roleId).toBe('role-1');
    expect(payload.stay.listingId).toBe('dorm');
    // The stay and the selection must name the same room, or it is a 400.
    expect(payload.stay.listingId).toBe(payload.selection.accommodationId);
    expect(payload.stay.adults).toBe(1);
    expect(payload.stay.start.slice(0, 10)).toBe('2026-09-01');
    expect(payload.stay.end.slice(0, 10)).toBe('2026-11-30');
    expect(payload.agreementVersion).toBe('1.0');
    expect(payload.acknowledgedIds).toEqual(['unpaid', 'conduct']);
    expect(payload.acceptedAt).toBeTruthy();

    /*
     * The association recomputes the season and files its own result, so all
     * the page sends is which year's instance is being joined. Sending our
     * arithmetic would only invite somebody to trust it.
     */
    expect(Object.keys(payload.program).sort()).toEqual([
      'endDate',
      'startDate',
    ]);
    expect(payload.program.startDate.slice(0, 10)).toBe('2026-09-01');
    expect(JSON.stringify(payload)).not.toMatch(
      /budgetMonthly|programCosts|tokenValue|seasonTokensDistributed/,
    );

    await waitFor(() =>
      expect(screen.getByText(/Agreement submitted/)).toBeInTheDocument(),
    );
  });

  it('confirms the season the association filed, not the one it drew', async () => {
    // The curve moved between the read that drew the page and the write that
    // filed the agreement: what comes back is what was signed.
    post.mockResolvedValueOnce({
      data: {
        results: {
          agreement: {
            _id: 'agr-1',
            roleId: 'role-1',
            roleTitle: 'Mushroom Farm Lead',
            agreementVersion: '1.0',
            agreementBody: '# Filed',
            acceptedAt: '2026-08-31T00:00:00.000Z',
            acknowledgedIds: ['unpaid', 'conduct'],
            stayId: 'stay-1',
            status: 'pending',
            createdBy: 'u1',
            created: '2026-08-31T00:00:00.000Z',
            selection: {},
            standing: {},
            program: {
              seasonId: 'fall',
              seasonLabel: 'Fall',
              startDate: '2026-09-01T00:00:00.000Z',
              endDate: '2026-11-30T00:00:00.000Z',
              months: 3,
              halfDaysPerWeek: 5,
              includedAccommodationId: 'dorm',
              accommodationId: 'dorm',
              needsAccommodation: true,
              isUpgrade: false,
              upgradeFiatMonthly: 0,
              upgradeTokensMonthly: 0,
              upgradeFiatSeason: 0,
              seasonFiatOwed: 0,
              seasonTokensSpent: 0,
              presenceEarned: 91,
              seasonTokensDistributed: 41.5,
              seasonTokensWithheld: 0,
              tokenFairValue: 0,
            },
          },
          stay: { _id: 'stay-1', status: 'draft' },
        },
      },
    });

    await renderPage();
    fireEvent.click(screen.getByLabelText('I understand this is unpaid.'));
    fireEvent.click(screen.getByLabelText('I accept the Code of Conduct.'));
    fireEvent.click(
      screen.getByLabelText(/I have read the Mushroom Farm Lead agreement/),
    );
    fireEvent.click(screen.getByRole('button', { name: /Join Fall/ }));

    expect(await screen.findByText('41.5 TDF')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Booking' })).toHaveAttribute(
      'href',
      '/stay/stay-1',
    );
  });

  it('quotes no presence for a volunteer who houses themselves', async () => {
    await renderPage();
    expect(screen.getByText('$Presence on check-out')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /I house myself/ }));

    /*
     * Presence counts days on the land, logged by check-in — a volunteer off
     * site logs none. The line goes rather than reading "+0 days", which makes
     * a season look like it was worth nothing.
     */
    await waitFor(() =>
      expect(screen.queryByText('$Presence on check-out')).toBeNull(),
    );
    expect(screen.queryByText('+0 days')).toBeNull();
  });

  it('shows the journey ladder with the volunteer marked on it', async () => {
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Canopy/ }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('you · 500')).toBeInTheDocument();
    expect(within(dialog).getByText(/Coordinator role/)).toBeInTheDocument();
    expect(within(dialog).queryByText(/cash/i)).not.toBeInTheDocument();
  });

  it('names every setting the platform has not filled in', async () => {
    savedResidencyConfig = { enabled: true };
    await renderPage();
    expect(
      screen.getByText(/This village has not set up its volunteer seasons/),
    ).toBeInTheDocument();
    expect(screen.getByText(/^Association —/)).toBeInTheDocument();
    expect(screen.getByText(/^Legal framework —/)).toBeInTheDocument();
    expect(screen.getByText(/^Seasons —/)).toBeInTheDocument();
    expect(screen.queryByText(/01 · Your journey/)).not.toBeInTheDocument();
  });

  it('says so when no listing is open to residents', async () => {
    await renderPage(ROLE, [{ ...LISTINGS[0], availableFor: ['guests'] }]);
    expect(
      screen.getByText(/no listing is marked available for residents/),
    ).toBeInTheDocument();
  });

  it('drops the meals line when the program feeds nobody', async () => {
    savedBookingConfig = {
      ...BOOKING_CONFIG,
      foodOptionEnabled: false,
      utilityOptionEnabled: false,
    };
    await renderPage(ROLE, LISTINGS, undefined, []);
    expect(screen.queryByText('Meals + utilities')).not.toBeInTheDocument();
  });

  it('falls back to the plain listing for a non-residency role', async () => {
    await renderPage({ ...ROLE, isResidency: false });
    expect(
      screen.getByText(/This role is not offered as a volunteer season/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/01 · Your journey/)).not.toBeInTheDocument();
  });
});
