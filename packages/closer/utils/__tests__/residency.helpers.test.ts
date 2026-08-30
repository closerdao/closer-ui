import { Role } from '../../types/api';
import { Listing } from '../../types/booking';
import { ResidencySelection } from '../../types/residency';
import {
  buildAgreementSubmission,
  buildResidencyQuote,
  getRequiredTier,
  getOverlappingStays,
  listingsToAccommodations,
  overlapNights,
  getSeasonWindow,
  getTierForPresence,
  getUpcomingSeason,
  parseResidencyConfig,
  renderAgreement,
} from '../residency.helpers';

const CONFIG = {
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
    { label: 'Rooted', minPresence: 30, cashPct: 0, unlocks: 'Team' },
    { label: 'Grown', minPresence: 100, cashPct: 30, unlocks: 'Cash out' },
    { label: 'Canopy', minPresence: 465, cashPct: 70, unlocks: 'Lead' },
    { label: 'Keystone', minPresence: 930, cashPct: 100, unlocks: 'Director' },
  ],
  seasons: [
    {
      id: 'spring',
      label: 'Spring',
      startMonth: 2,
      durationMonths: 5,
      pace: 'high',
    },
    {
      id: 'summer',
      label: 'Summer',
      startMonth: 7,
      durationMonths: 2,
      pace: 'slow',
    },
  ],
  acknowledgements: [{ id: 'nda', label: 'I agree to the NDA.' }],
};

const params = parseResidencyConfig(CONFIG, 266.5, true);

const listing = (over: Partial<Listing> = {}): Listing =>
  ({
    _id: 'van',
    name: 'Van parking',
    description: '<p>Your van</p>',
    photos: [],
    priceDuration: 'night',
    // The quote bills 30-day months, so a nightly rate scales by 30.
    fiatPrice: { val: 220 / 30, cur: 'EUR' },
    tokenPrice: { val: 11 / 30, cur: 'TDF' },
    availableFor: ['team'],
    ...over,
  }) as Listing;

/** No duration discount configured, so a night simply scales by 30. */
const ACCOMMODATIONS = listingsToAccommodations([listing()]);

/** Spring 2026 runs 1 Feb – 30 Jun. */
const stay = (start: string, end: string, over: Record<string, any> = {}) =>
  ({
    _id: `stay-${start}`,
    status: 'paid',
    start: `${start}T00:00:00.000Z`,
    end: `${end}T00:00:00.000Z`,
    ...over,
  }) as any;

const ROLE: Role = {
  _id: 'role-1',
  title: 'Team',
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
  baseCompensation: 1600,
  minPresence: 30,
  daysPerWeek: 5,
  hoursPerDay: 8,
  team: 'team',
};

/** Spring 2026: 1 Feb – 30 Jun, 150 days. */
const NOW = new Date(2026, 0, 15);

const baseSelection = (patch: Partial<ResidencySelection> = {}) => {
  const window = getSeasonWindow(params.seasons[0], NOW);
  return {
    seasonId: 'spring',
    arrivalDayOffset: 0,
    departureDayOffset: window.totalDays - 1,
    accommodationId: ACCOMMODATIONS[0].id,
    tokensLocked: 0,
    cashRequested: 0,
    daysPerWeek: 5,
    stayPct: 100,
    ...patch,
  } as ResidencySelection;
};

const standingOf = (over: Partial<Record<string, number>> = {}) => ({
  presence: 500,
  tokensHeld: 78,
  sweat: 120,
  // Every quote test assumes a connected wallet unless it says otherwise.
  lockableTokens: 78,
  ...over,
});

const quoteFor = (
  selection: Partial<ResidencySelection> = {},
  standing = standingOf(),
  accommodations = ACCOMMODATIONS,
) =>
  buildResidencyQuote({
    role: ROLE,
    params,
    accommodations,
    standing,
    selection: baseSelection(selection),
    now: NOW,
  })!;

describe('parseResidencyConfig', () => {
  it('shifts the stored 1-12 start month to a JS month index', () => {
    expect(params.seasons[0].startMonth).toBe(1); // February
    expect(params.seasons[1].startMonth).toBe(6); // July
  });

  it('falls back to the defaults for a config missing every field', () => {
    const bare = parseResidencyConfig({}, 100, false);
    expect(bare.cashMultiplier).toBe(0.7);
    expect(bare.presenceTiers.length).toBeGreaterThan(0);
    expect(bare.seasons).toEqual([]);
  });
});

describe('getSeasonWindow', () => {
  it('spans the whole window and marks each month boundary', () => {
    const window = getSeasonWindow(params.seasons[0], NOW);
    expect(window.start.getMonth()).toBe(1);
    expect(window.end.getMonth()).toBe(5);
    expect(window.totalDays).toBe(150); // Feb 1 – Jun 30 2026
    expect(window.monthMarks).toHaveLength(4);
  });

  it('rolls to next year when the season has already started', () => {
    const window = getSeasonWindow(params.seasons[0], new Date(2026, 8, 1));
    expect(window.start.getFullYear()).toBe(2027);
  });
});

describe('getUpcomingSeason', () => {
  it('picks the season whose window opens soonest', () => {
    expect(getUpcomingSeason(params.seasons, NOW)?.id).toBe('spring');
    expect(getUpcomingSeason(params.seasons, new Date(2026, 5, 1))?.id).toBe(
      'summer',
    );
  });
});

describe('tiers', () => {
  it('reads the tier a presence balance sits in', () => {
    expect(getTierForPresence(params.presenceTiers, 0).label).toBe('Newcomer');
    expect(getTierForPresence(params.presenceTiers, 99).label).toBe('Rooted');
    expect(getTierForPresence(params.presenceTiers, 500).label).toBe('Canopy');
    expect(getTierForPresence(params.presenceTiers, 9999).label).toBe(
      'Keystone',
    );
  });

  it('names the lowest tier that clears a role gate', () => {
    expect(getRequiredTier(params.presenceTiers, 30).label).toBe('Rooted');
    expect(getRequiredTier(params.presenceTiers, 1).label).toBe('Rooted');
    expect(getRequiredTier(params.presenceTiers, 0).label).toBe('Newcomer');
  });
});

describe('listingsToAccommodations', () => {
  it('restates a nightly listing price in the 30-day month a season bills in', () => {
    const [accommodation] = listingsToAccommodations([listing()]);
    expect(accommodation.fiatMonthly).toBeCloseTo(220, 5);
    expect(accommodation.tokensMonthly).toBeCloseTo(11, 5);
  });

  it('takes the label, id and photo off the listing', () => {
    const [accommodation] = listingsToAccommodations([
      listing({ _id: 'l1', name: 'The loft', photos: ['photo-1', 'photo-2'] }),
    ]);
    expect(accommodation.id).toBe('l1');
    expect(accommodation.label).toBe('The loft');
    expect(accommodation.photo).toBe('photo-1');
  });

  it('strips the markup out of the listing description', () => {
    const [accommodation] = listingsToAccommodations([
      listing({ description: '<p>Loft   +<br/> living space</p>' }),
    ]);
    expect(accommodation.note).toBe('Loft + living space');
  });

  it('drops hourly spaces — a desk is not somewhere you live', () => {
    expect(
      listingsToAccommodations([listing({ priceDuration: 'hour' })]),
    ).toHaveLength(0);
  });

  it('keeps a listing open to residents, or open to everyone', () => {
    expect(
      listingsToAccommodations([
        listing({ availableFor: ['resident'] }),
        listing({ availableFor: ['all'] }),
        listing({ availableFor: [] }),
        listing({ availableFor: undefined }),
      ]),
    ).toHaveLength(4);
  });

  it('drops a listing only bookable by guests', () => {
    expect(
      listingsToAccommodations([listing({ availableFor: ['guests'] })]),
    ).toHaveLength(0);
  });

  it('keeps a fiat-only listing, with no token rate', () => {
    const [accommodation] = listingsToAccommodations([
      listing({ tokenPrice: undefined }),
    ]);
    expect(accommodation.fiatMonthly).toBeCloseTo(220, 5);
    expect(accommodation.tokensMonthly).toBe(0);
  });

  it('drops a listing with no price at all', () => {
    expect(
      listingsToAccommodations([
        listing({ fiatPrice: undefined, tokenPrice: undefined }),
      ]),
    ).toHaveLength(0);
  });

  it('applies the monthly duration discount a long stay earns', () => {
    // A residency always runs past the 28-night threshold, so 66% off — the
    // same rate a guest booking the room for a month would get.
    const [accommodation] = listingsToAccommodations([listing()], {
      discountsDaily: 0,
      discountsWeekly: 0.33,
      discountsMonthly: 0.66,
    } as any);
    expect(accommodation.fiatMonthly).toBeCloseTo(220 * 0.34, 5);
    expect(accommodation.tokensMonthly).toBeCloseTo(11 * 0.34, 5);
  });

  it('leaves the rate alone when no discount is configured', () => {
    const [accommodation] = listingsToAccommodations([listing()], {
      discountsMonthly: 0,
    } as any);
    expect(accommodation.fiatMonthly).toBeCloseTo(220, 5);
  });

  it('survives an empty or missing listing set', () => {
    expect(listingsToAccommodations([])).toEqual([]);
    expect(listingsToAccommodations(null)).toEqual([]);
  });
});

describe('buildResidencyQuote', () => {
  it('computes gross, living and net for a full-time stay', () => {
    const quote = quoteFor();
    // sweat bonus caps at 300 (120 × 1.67 = 200.4, under the cap)
    expect(quote.sweatBonus).toBeCloseTo(200.4, 5);
    expect(quote.gross).toBeCloseTo(1800.4, 5);
    expect(quote.living).toBe(486);
    // 5 months × 11 tokens = 55 needed, none locked
    expect(quote.tokensNeeded).toBe(55);
    expect(quote.accommodationFiatMonthly).toBe(220);
    expect(quote.net).toBeCloseTo(1094.4, 5);
  });

  it('scales gross by the committed days but leaves living alone', () => {
    const half = quoteFor({ daysPerWeek: 2.5 });
    expect(half.fte).toBe(0.5);
    expect(half.gross).toBeCloseTo(900.2, 5);
    expect(half.living).toBe(486);
  });

  it('drops the accommodation fiat in proportion to tokens locked', () => {
    const covered = quoteFor({ tokensLocked: 55 });
    expect(covered.coverage).toBe(1);
    expect(covered.accommodationFiatMonthly).toBe(0);

    const partial = quoteFor({ tokensLocked: 27.5 });
    expect(partial.coverage).toBe(0.5);
    expect(partial.accommodationFiatMonthly).toBe(110);
  });

  it('cannot lock more tokens than the member holds', () => {
    const quote = quoteFor(
      { tokensLocked: 999 },
      standingOf({ tokensHeld: 20, lockableTokens: 20 }),
    );
    expect(quote.lockableMax).toBe(20);
    expect(quote.tokensLocked).toBe(20);
  });

  it('offers no token cover without a connected wallet', () => {
    const quote = quoteFor(
      { tokensLocked: 55 },
      standingOf({ lockableTokens: 0 }),
    );
    expect(quote.lockableMax).toBe(0);
    expect(quote.tokensLocked).toBe(0);
    expect(quote.coverage).toBe(0);
    // The full cash rate stands, even though the member holds 78 tokens.
    expect(quote.accommodationFiatMonthly).toBe(220);
  });

  it('charges the full fiat rate for a listing with no token price', () => {
    const fiatOnly = listingsToAccommodations([
      listing({ tokenPrice: undefined }),
    ]);
    const quote = quoteFor({ tokensLocked: 55 }, standingOf(), fiatOnly);
    expect(quote.tokensNeeded).toBe(0);
    expect(quote.coverage).toBe(0);
    // Never free: "nothing needed" is not "fully covered".
    expect(quote.accommodationFiatMonthly).toBe(220);
  });

  it('credits nights already booked against the accommodation', () => {
    // 149-night season (150 days) with 15 nights booked elsewhere.
    const quote = buildResidencyQuote({
      role: ROLE,
      params,
      accommodations: ACCOMMODATIONS,
      standing: standingOf(),
      selection: baseSelection(),
      existingStays: [stay('2026-02-10', '2026-02-25')],
      now: NOW,
    })!;
    const ratio = (149 - 15) / 149;
    expect(quote.nightsAlreadyBooked).toBe(15);
    expect(quote.billableRatio).toBeCloseTo(ratio, 5);
    expect(quote.accommodationFiatMonthly).toBeCloseTo(220 * ratio, 5);
    // Fewer nights to pay for means fewer tokens needed to cover them.
    expect(quote.tokensNeeded).toBeCloseTo(55 * ratio, 5);
  });

  it('charges no accommodation when the whole season is already booked', () => {
    const quote = buildResidencyQuote({
      role: ROLE,
      params,
      accommodations: ACCOMMODATIONS,
      standing: standingOf(),
      selection: baseSelection(),
      existingStays: [stay('2026-02-01', '2026-06-30')],
      now: NOW,
    })!;
    expect(quote.billableRatio).toBe(0);
    expect(quote.accommodationFiatMonthly).toBe(0);
    expect(quote.tokensNeeded).toBe(0);
  });

  it('never credits more nights than the season holds', () => {
    const quote = buildResidencyQuote({
      role: ROLE,
      params,
      accommodations: ACCOMMODATIONS,
      standing: standingOf(),
      selection: baseSelection(),
      // Two overlapping stays covering the window twice over.
      existingStays: [
        stay('2026-02-01', '2026-06-30'),
        stay('2026-02-01', '2026-06-30'),
      ],
      now: NOW,
    })!;
    expect(quote.nightsAlreadyBooked).toBe(quote.spanDays - 1);
    expect(quote.billableRatio).toBe(0);
    expect(quote.accommodationFiatMonthly).toBe(0);
  });

  it('caps cash at the tier share, the hard cap and the net', () => {
    // Canopy is 70% of 1094.4 = 766, above the 700 hard cap.
    const quote = quoteFor({ cashRequested: 5000 });
    expect(quote.cashCap).toBe(700);
    expect(quote.cashRequested).toBe(700);
    expect(quote.cashReceived).toBeCloseTo(490, 5);
  });

  it('gives no cash access below the first paying tier', () => {
    const quote = quoteFor(
      { cashRequested: 500 },
      standingOf({ presence: 50, tokensHeld: 0, sweat: 0, lockableTokens: 0 }),
    );
    expect(quote.tier.label).toBe('Rooted');
    expect(quote.cashCap).toBe(0);
    expect(quote.cashRequested).toBe(0);
  });

  it('converts everything not taken as cash into tokens', () => {
    const quote = quoteFor({ cashRequested: 0 });
    expect(quote.tokensEarnedMonthly).toBeCloseTo(1094.4 / 266.5, 5);
  });

  it('leaves the boundary untouched inside the grace window', () => {
    const quote = quoteFor({ arrivalDayOffset: 5, departureDayOffset: 144 });
    expect(quote.daysLateIn).toBe(5);
    expect(quote.daysEarlyOut).toBe(5);
    expect(quote.boundaryPenalty).toBe(0);
  });

  it('charges missed days once beyond the grace window', () => {
    const quote = quoteFor({ arrivalDayOffset: 10, cashRequested: 700 });
    const dailyRate = quote.gross / 30;
    expect(quote.latePenalty).toBeCloseTo(2 * dailyRate * 10, 5);
    expect(quote.earlyPenalty).toBe(0);
    // Settled against the season payout, cash first.
    expect(quote.seasonCash).toBeCloseTo(
      quote.cashReceived * quote.months - quote.boundaryPenalty,
      5,
    );
  });

  it('takes the rest of an unaffordable penalty out of the tokens', () => {
    const quote = quoteFor({
      arrivalDayOffset: 60,
      departureDayOffset: 89,
      cashRequested: 0,
    });
    expect(quote.boundaryPenalty).toBeGreaterThan(0);
    expect(quote.seasonCash).toBe(0);
    expect(quote.seasonTokens).toBeLessThan(
      quote.tokensEarnedMonthly * quote.months,
    );
  });

  it('flags a role the member has not unlocked yet', () => {
    const quote = quoteFor(
      {},
      standingOf({ presence: 10, tokensHeld: 0, sweat: 0, lockableTokens: 0 }),
    );
    expect(quote.isRoleUnlocked).toBe(false);
    expect(quote.presenceShortfall).toBe(20);
    expect(quote.requiredTier.label).toBe('Rooted');
  });

  it('bills whole months, rounding a partial month up', () => {
    expect(quoteFor({ departureDayOffset: 29 }).months).toBe(1);
    expect(quoteFor({ departureDayOffset: 30 }).months).toBe(2);
  });

  it('returns null when nothing is configured to quote against', () => {
    const empty = parseResidencyConfig({ seasons: [] }, 100, false);
    expect(
      buildResidencyQuote({
        role: ROLE,
        params: empty,
        accommodations: ACCOMMODATIONS,
        standing: standingOf(),
        selection: baseSelection(),
        now: NOW,
      }),
    ).toBeNull();
  });

  it('returns null when there is nowhere to sleep', () => {
    expect(
      buildResidencyQuote({
        role: ROLE,
        params,
        accommodations: [],
        standing: standingOf(),
        selection: baseSelection(),
        now: NOW,
      }),
    ).toBeNull();
  });
});

describe('overlapNights', () => {
  it('counts the nights two ranges share', () => {
    expect(
      overlapNights('2026-02-01', '2026-02-11', '2026-02-06', '2026-02-21'),
    ).toBe(5);
  });

  it('is zero for ranges that only touch', () => {
    // Checking out on the morning another stay checks in shares no night.
    expect(
      overlapNights('2026-02-01', '2026-02-10', '2026-02-10', '2026-02-20'),
    ).toBe(0);
  });

  it('is zero for ranges that never meet', () => {
    expect(
      overlapNights('2026-02-01', '2026-02-05', '2026-03-01', '2026-03-05'),
    ).toBe(0);
  });

  it('counts a range fully inside another', () => {
    expect(
      overlapNights('2026-02-10', '2026-02-15', '2026-02-01', '2026-03-01'),
    ).toBe(5);
  });
});

describe('getOverlappingStays', () => {
  const arrival = new Date(2026, 1, 1);
  const departure = new Date(2026, 5, 30);

  it('reports each overlapping stay and its nights', () => {
    const found = getOverlappingStays(
      [stay('2026-02-10', '2026-02-20')],
      arrival,
      departure,
    );
    expect(found).toHaveLength(1);
    expect(found[0].overlapNights).toBe(10);
  });

  it('ignores cancelled and rejected stays — they hold no space', () => {
    expect(
      getOverlappingStays(
        [
          stay('2026-02-10', '2026-02-20', { status: 'cancelled' }),
          stay('2026-03-10', '2026-03-20', { status: 'rejected' }),
        ],
        arrival,
        departure,
      ),
    ).toEqual([]);
  });

  it('ignores stays outside the window', () => {
    expect(
      getOverlappingStays([stay('2026-08-01', '2026-08-10')], arrival, departure),
    ).toEqual([]);
  });

  it('clips a stay that runs past the window to the shared nights', () => {
    const [found] = getOverlappingStays(
      [stay('2026-01-20', '2026-02-06')],
      arrival,
      departure,
    );
    expect(found.overlapNights).toBe(5); // Feb 1 → Feb 6
  });

  it('survives a missing stay list', () => {
    expect(getOverlappingStays(null, arrival, departure)).toEqual([]);
    expect(getOverlappingStays([], arrival, departure)).toEqual([]);
  });
});

describe('buildAgreementSubmission', () => {
  const submissionFor = (existingStays: any[] = []) => {
    const quote = buildResidencyQuote({
      role: ROLE,
      params,
      accommodations: ACCOMMODATIONS,
      standing: standingOf(),
      selection: baseSelection(),
      existingStays,
      now: NOW,
    })!;
    return buildAgreementSubmission({
      role: ROLE,
      quote,
      params,
      standing: standingOf(),
      selection: baseSelection(),
      agreementBody: '# Agreement',
      acknowledgedIds: ['nda'],
      now: NOW,
    });
  };

  it('describes the stay the server must create', () => {
    const { stay: request } = submissionFor();
    expect(request.listingId).toBe(ACCOMMODATIONS[0].id);
    expect(request.adults).toBe(1);
    expect(request.isTeamBooking).toBe(true);
    expect(request.start.slice(0, 10)).toBe('2026-02-01');
    expect(request.end.slice(0, 10)).toBe('2026-06-30');
  });

  it('reports the credited nights so the server can re-check them', () => {
    const { stay: request, quote } = submissionFor([
      stay('2026-02-10', '2026-02-25'),
    ]);
    expect(request.nightsAlreadyBooked).toBe(15);
    expect(quote.nightsAlreadyBooked).toBe(15);
    expect(quote.billableRatio).toBeCloseTo((149 - 15) / 149, 5);
  });

  it('freezes the terms that were signed', () => {
    const submission = submissionFor();
    expect(submission.roleId).toBe('role-1');
    expect(submission.agreementVersion).toBe('1.0');
    expect(submission.acknowledgedIds).toEqual(['nda']);
    expect(submission.agreementBody).toBe('# Agreement');
    expect(submission.quote.tokenValue).toBe(266.5);
    expect(submission.acceptedAt).toBe(NOW.toISOString());
  });
});

describe('renderAgreement', () => {
  const render = (template: string) =>
    renderAgreement({
      template,
      role: ROLE,
      quote: quoteFor(),
      params,
      standing: standingOf(),
      memberName: 'Tonya',
      platformName: 'TDF',
      tokenSymbol: 'TDF',
      formatCurrency: (value) => `€${Math.round(value)}`,
      formatDate: (date) => date.toISOString().slice(0, 10),
      now: NOW,
    });

  it('fills the placeholders from the live quote', () => {
    const body = render(
      '{{memberName}} · {{roleTitle}} · {{seasonLabel}} · {{net}} · {{tierLabel}}',
    );
    expect(body).toBe('Tonya · Team · Spring · €1094 · Canopy');
  });

  it('renders the role responsibilities as a list', () => {
    expect(render('{{responsibilities}}')).toBe('- Run the farm');
  });

  it('leaves an unknown placeholder visible rather than blanking it', () => {
    expect(render('{{notAThing}}')).toBe('{{notAThing}}');
  });

  it('falls back to the built-in template when none is configured', () => {
    const body = render('   ');
    expect(body).toContain('Team member agreement');
    expect(body).toContain('Non-disclosure');
    expect(body).not.toContain('{{');
  });
});
