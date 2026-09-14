import React from 'react';

import { fireEvent, screen, waitFor, within } from '@testing-library/react';

import { renderWithNextIntl } from '../../test/utils';
import { ResidencyAgreement } from '../../types/residency';
import ResidenciesPage from './index';

/**
 * The page's `../../utils/api` resolves to the real module, so it needs its own
 * mock — the `.js` suffix is what the repo uses to sidestep the bare
 * `utils/api` moduleNameMapper entry (see test/eventReport.test.tsx).
 */
jest.mock('../../utils/api.js', () => ({
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

const api = jest.requireMock('../../utils/api.js').default;
const get = api.get as jest.Mock;
const post = api.post as jest.Mock;

jest.mock('../../utils/cachedConfig.helpers', () => ({
  getCachedConfig: (slug: string) =>
    slug === 'residency' ? { enabled: true } : { platformName: 'TDF' },
  getSavedConfig: () => null,
}));

// The symbol is all the page takes from the residency hooks, and the module
// itself reaches for the chain.
jest.mock('../../hooks/useResidencyParams', () => ({
  RESIDENCY_TOKEN_SYMBOL: 'TDF',
}));

/** Who is looking, per test. */
let mockUser: Record<string, unknown> | null = null;

jest.mock('../../contexts/auth', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: Boolean(mockUser),
    isLoading: false,
  }),
  AuthProvider: ({ children }: any) => children,
}));

/** Names the page looks up so the list reads in words rather than ids. */
const LISTINGS = [{ _id: 'dorm', name: 'Seed Shared Dorm' }];
const USERS = [{ _id: 'u2', screenname: 'Rui' }];

const immutableList = (items: unknown[]) => ({ toJS: () => items });

jest.mock('../../contexts/platform', () => ({
  usePlatform: () => ({
    platform: {
      user: {
        get: jest.fn(() => Promise.resolve()),
        find: () => immutableList(USERS),
      },
      listing: {
        get: jest.fn(() => Promise.resolve()),
        find: () => immutableList(LISTINGS),
      },
    },
  }),
  PlatformProvider: ({ children }: any) => children,
}));

const NOW = new Date('2026-06-01T12:00:00.000Z');

const buildAgreement = (
  overrides: Partial<ResidencyAgreement> = {},
  programOverrides: Partial<ResidencyAgreement['program']> = {},
): ResidencyAgreement =>
  ({
    _id: 'a1',
    roleId: 'r1',
    roleTitle: 'Mushroom Farm Lead',
    agreementVersion: '1.0',
    agreementBody: '# Volunteer Agreement\n\nClause one.',
    acceptedAt: '2026-05-01T00:00:00.000Z',
    acknowledgedIds: ['unpaid'],
    stayId: 's1',
    status: 'pending',
    createdBy: 'u1',
    created: '2026-05-01T00:00:00.000Z',
    selection: {} as any,
    standing: {} as any,
    program: {
      seasonId: 'fall',
      seasonLabel: 'Fall',
      startDate: '2026-09-01T00:00:00.000Z',
      endDate: '2026-11-30T00:00:00.000Z',
      months: 3,
      halfDaysPerWeek: 4,
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
      seasonTokensDistributed: 13.35,
      seasonTokensWithheld: 0,
      tokenFairValue: 0,
      ...programOverrides,
    },
    ...overrides,
  } as ResidencyAgreement);

const serve = (agreements: ResidencyAgreement[]) =>
  get.mockImplementation(() =>
    Promise.resolve({ data: { results: agreements } }),
  );

const renderPage = async () => {
  const result = renderWithNextIntl(<ResidenciesPage />);
  await waitFor(() => expect(get).toHaveBeenCalled());
  return result;
};

describe('Residencies page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers({ now: NOW, doNotFake: ['nextTick'] } as any);
    mockUser = { _id: 'u1', screenname: 'Tonya', roles: ['member'] };
    serve([buildAgreement()]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('lists a signed season with links back to its role and its booking', async () => {
    await renderPage();

    expect(await screen.findByText('Mushroom Farm Lead')).toBeInTheDocument();
    expect(screen.getByText('Fall 2026')).toBeInTheDocument();
    expect(
      screen.getByText('1 Sep 2026 → 30 Nov 2026'),
    ).toBeInTheDocument();
    expect(screen.getByText('Seed Shared Dorm')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Role' })).toHaveAttribute(
      'href',
      '/roles/r1',
    );
    expect(screen.getByRole('link', { name: 'Booking' })).toHaveAttribute(
      'href',
      '/stay/s1',
    );
  });

  it('shows the allocation as a quantity with a fair market value of nothing', async () => {
    await renderPage();

    expect(await screen.findByText('13.35 TDF')).toBeInTheDocument();
    expect(screen.getByText('fair market value €0')).toBeInTheDocument();
    // Nothing to stake and nothing to pay in a normally-budgeted role, so
    // neither line is drawn — not even for zero.
    expect(screen.queryByText(/to stake against/)).toBeNull();
    expect(screen.queryByText(/still to settle/)).toBeNull();
  });

  /*
   * A room above the covered one, countersigned: the stay behind it says
   * whether the upgrade has been settled, and the volunteer is pointed at the
   * ordinary stay rails to do it. Nothing else on the season is owed.
   */
  it('points the volunteer at their booking while a room upgrade is unsettled', async () => {
    serve([
      buildAgreement(
        { status: 'countersigned' },
        { isUpgrade: true, seasonTokensSpent: 9, seasonFiatOwed: 0 },
      ),
    ]);
    get.mockImplementation((url: string) =>
      Promise.resolve({
        data: {
          results:
            url === '/stays/s1'
              ? {
                  _id: 's1',
                  status: 'confirmed',
                  residencyAgreementId: 'a1',
                  tokensTarget: { val: 9, cur: 'TDF' },
                  tokensStaked: { val: 0, cur: 'TDF' },
                }
              : [
                  buildAgreement(
                    { status: 'countersigned' },
                    { isUpgrade: true, seasonTokensSpent: 9 },
                  ),
                ],
        },
      }),
    );
    await renderPage();

    expect(
      await screen.findByText('9 TDF to stake against the room upgrade.'),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Still to settle before the booking reads paid: 9 TDF/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Complete booking' }),
    ).toHaveAttribute('href', '/stay/create/s1');
  });

  it('says the room is settled once the stay reads paid', async () => {
    get.mockImplementation((url: string) =>
      Promise.resolve({
        data: {
          results:
            url === '/stays/s1'
              ? {
                  _id: 's1',
                  status: 'paid',
                  residencyAgreementId: 'a1',
                  tokensTarget: { val: 9, cur: 'TDF' },
                  tokensStaked: { val: 9, cur: 'TDF' },
                }
              : [
                  buildAgreement(
                    { status: 'countersigned' },
                    { isUpgrade: true, seasonTokensSpent: 9 },
                  ),
                ],
        },
      }),
    );
    await renderPage();

    expect(
      await screen.findByText(/Room settled — nothing more is owed/),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Complete booking' })).toBeNull();
  });

  it('says there is no booking when the volunteer houses themselves', async () => {
    serve([
      buildAgreement({ stayId: null }, { needsAccommodation: false }),
    ]);
    await renderPage();

    expect(
      await screen.findByText('No booking — off-site'),
    ).toBeInTheDocument();
    expect(screen.getByText('Houses themselves')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Booking' })).toBeNull();
  });

  it('lets a volunteer end their own season before it starts', async () => {
    await renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'End season' }));

    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByRole('textbox'), {
      target: { value: '  Visa fell through.  ' },
    });
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'End season' }),
    );

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/residencies/a1/cancel', {
        reason: 'Visa fell through.',
      }),
    );
  });

  it('sends no reason when the volunteer leaves the box empty', async () => {
    await renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'End season' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'End season' }),
    );

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/residencies/a1/cancel', {}),
    );
  });

  it('withholds the end button once the season is under way', async () => {
    serve([
      buildAgreement({}, { startDate: '2026-05-01T00:00:00.000Z' }),
    ]);
    await renderPage();

    expect(
      await screen.findByText('Under way — ask your coordinator to end it.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'End season' })).toBeNull();
  });

  it('offers no approval to a volunteer', async () => {
    await renderPage();

    expect(await screen.findByText('Mushroom Farm Lead')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Approve' })).toBeNull();
  });

  it('lets a space host countersign a pending season', async () => {
    mockUser = { _id: 'u9', screenname: 'Host', roles: ['space-host'] };
    serve([buildAgreement({ createdBy: 'u2' })]);
    await renderPage();

    // Somebody else's season, so the volunteer is named on it.
    expect(await screen.findByText('Rui')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/residencies/a1/approve', {}),
    );
  });

  /*
   * Countersigning is where the stay's status starts to matter: `paid` is
   * done, `confirmed` means a room above the covered one still has something
   * to stake or pay on it. The volunteer is never sent to a payment screen
   * off the back of the approval itself.
   */
  it('says the room is confirmed and nothing owed when the stay came back paid', async () => {
    mockUser = { _id: 'u9', screenname: 'Host', roles: ['space-host'] };
    serve([buildAgreement({ createdBy: 'u2' })]);
    post.mockResolvedValueOnce({
      data: {
        results: {
          agreement: buildAgreement({ status: 'countersigned' }),
          stay: { _id: 's1', status: 'paid' },
        },
      },
    });
    await renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Approve' }));

    expect(
      await screen.findByText(
        'Countersigned. The room is confirmed and nothing is owed.',
      ),
    ).toBeInTheDocument();
  });

  it('names what the volunteer still has to settle when the stay stays confirmed', async () => {
    mockUser = { _id: 'u9', screenname: 'Host', roles: ['space-host'] };
    serve([buildAgreement({ createdBy: 'u2' })]);
    post.mockResolvedValueOnce({
      data: {
        results: {
          agreement: buildAgreement({ status: 'countersigned' }),
          stay: {
            _id: 's1',
            status: 'confirmed',
            tokensTarget: { val: 9, cur: 'TDF' },
            tokensStaked: { val: 0, cur: 'TDF' },
            fiatTarget: { val: 120, cur: 'EUR' },
            fiatPaid: { val: 0, cur: 'EUR' },
          },
        },
      },
    });
    await renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Approve' }));

    expect(
      await screen.findByText(/still has 9 TDF \+ €120 to settle/),
    ).toBeInTheDocument();
  });

  it('says so when a self-housed volunteer is countersigned', async () => {
    mockUser = { _id: 'u9', screenname: 'Host', roles: ['space-host'] };
    serve([
      buildAgreement(
        { createdBy: 'u2', stayId: null },
        { needsAccommodation: false },
      ),
    ]);
    post.mockResolvedValueOnce({
      data: {
        results: {
          agreement: buildAgreement({ status: 'countersigned', stayId: null }),
          stay: null,
        },
      },
    });
    await renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Approve' }));

    expect(
      await screen.findByText(/No room was reserved/),
    ).toBeInTheDocument();
  });

  it('gives a platform admin the same standing as a space host', async () => {
    mockUser = { _id: 'u9', screenname: 'Admin', roles: ['admin'] };
    serve([buildAgreement({ createdBy: 'u2' })]);
    await renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Approve' }));

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/residencies/a1/approve', {}),
    );
  });

  it('lets a space host end a season that has already started', async () => {
    mockUser = { _id: 'u9', screenname: 'Host', roles: ['space-host'] };
    serve([
      buildAgreement(
        { createdBy: 'u2', status: 'countersigned' },
        { startDate: '2026-05-01T00:00:00.000Z' },
      ),
    ]);
    await renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'End season' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'End season' }),
    );

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/residencies/a1/cancel', {}),
    );
  });

  const lastQuery = () =>
    get.mock.calls[get.mock.calls.length - 1][1].params;

  it('reads the caller-scoped list without asking for a scope', async () => {
    await renderPage();

    expect(get.mock.calls[0][0]).toBe('/residencies');
    // A plain member is scoped to their own by the endpoint; nothing to ask.
    expect(lastQuery()).toEqual({ limit: 50 });
  });

  it('asks the endpoint only for the status the host filtered on', async () => {
    mockUser = { _id: 'u9', screenname: 'Host', roles: ['space-host'] };
    await renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Countersigned' }));

    await waitFor(() =>
      expect(lastQuery()).toEqual({ limit: 50, status: 'countersigned' }),
    );
  });

  it('narrows a host back to their own seasons on request', async () => {
    mockUser = { _id: 'u9', screenname: 'Host', roles: ['space-host'] };
    await renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Mine' }));

    await waitFor(() => expect(lastQuery()).toEqual({ limit: 50, mine: true }));
  });

  it('shows the agreement the volunteer actually signed', async () => {
    await renderPage();

    fireEvent.click(
      await screen.findByRole('button', { name: 'Read agreement' }),
    );

    // `react-markdown` is stubbed in tests, so the raw body is what lands.
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Clause one.');
    expect(dialog).toHaveTextContent('version 1.0');
  });

  it('asks an unauthenticated visitor to sign in', async () => {
    mockUser = null;
    renderWithNextIntl(<ResidenciesPage />);

    expect(
      await screen.findByText('Sign in to see your volunteer seasons.'),
    ).toBeInTheDocument();
    expect(get).not.toHaveBeenCalled();
  });
});
