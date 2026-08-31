import { Role } from '../../types/api';
import { Listing } from '../../types/booking';
import { ResidencySelection } from '../../types/residency';
import {
  buildAgreementSubmission,
  buildResidencyPlan,
  getAgreementTemplate,
  getRequiredTier,
  getResidencyLivingCosts,
  getSeasonWindow,
  getTierForPresence,
  getUpcomingSeason,
  listingsToAccommodations,
  parseResidencyConfig,
  renderAgreement,
} from '../residency.helpers';

const CONFIG = {
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
  agreementTemplate: '',
  presenceTiers: [
    { label: 'Newcomer', minPresence: 0, unlocks: 'Season windows' },
    { label: 'Rooted', minPresence: 30, unlocks: 'Priority booking' },
    { label: 'Grown', minPresence: 100, unlocks: 'Mentor role' },
    { label: 'Canopy', minPresence: 465, unlocks: 'Coordinator role' },
    { label: 'Keystone', minPresence: 930, unlocks: 'Steward role' },
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
  acknowledgements: [{ id: 'unpaid', label: 'I understand this is unpaid.' }],
};

/**
 * What the program spends on one volunteer a month, per the booking setup:
 * 336 of food and 150 of utilities. Internal figures — they size the token
 * allocation and are never shown.
 */
const LIVING = {
  foodMonthly: 336,
  utilitiesMonthly: 150,
  providesMeals: true,
  providesUtilities: true,
};

/** A token price off the curve, used to convert budget into a quantity. */
const TOKEN_PRICE = 266.5;

const params = parseResidencyConfig(CONFIG, TOKEN_PRICE, true, LIVING).params!;

const listing = (over: Partial<Listing> = {}): Listing =>
  ({
    _id: 'dorm',
    name: 'Shared dorm',
    description: '<p>A bunk</p>',
    photos: [],
    priceDuration: 'night',
    // A season bills in 30-day months, so a nightly rate scales by 30.
    fiatPrice: { val: 90 / 30, cur: 'EUR' },
    tokenPrice: { val: 3 / 30, cur: 'TDF' },
    availableFor: ['resident'],
    ...over,
  } as Listing);

/** The covered dorm at 90/mo, and a private room at 600/mo. */
const ACCOMMODATIONS = listingsToAccommodations([
  listing(),
  listing({
    _id: 'private',
    name: 'Private room',
    fiatPrice: { val: 600 / 30, cur: 'EUR' } as any,
    tokenPrice: { val: 4.5 / 30, cur: 'TDF' } as any,
  }),
]);

const ROLE: Role = {
  _id: 'role-1',
  title: 'Land steward',
  description: '',
  compensation: '',
  hoursPerWeek: 40,
  skillsRequired: [],
  responsibilities: ['Restore the land'],
  visibleBy: [],
  createdBy: '',
  updated: '',
  created: '',
  attributes: [],
  managedBy: [],
  isResidency: true,
  // The association's own monthly budget for the role — never shown as pay.
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
    accommodationId: 'dorm',
    tokensSpent: 0,
    halfDaysPerWeek: 4,
    needsAccommodation: true,
    ...patch,
  } as ResidencySelection;
};

const standingOf = (over: Partial<Record<string, number>> = {}) => ({
  presence: 500,
  tokensHeld: 78,
  sweat: 120,
  // Every plan test assumes a connected wallet unless it says otherwise.
  lockableTokens: 78,
  ...over,
});

const planFor = (
  selection: Partial<ResidencySelection> = {},
  standing = standingOf(),
  accommodations = ACCOMMODATIONS,
) =>
  buildResidencyPlan({
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

  it('invents nothing for a config the platform never filled in', () => {
    const bare = parseResidencyConfig({}, null, false);
    expect(bare.params).toBeNull();
    // Every setting is named, so the page can say what is actually missing.
    expect(bare.missing).toEqual([
      'associationName',
      'legalFramework',
      'agreementVersion',
      'noticeWeeks',
      'expenseReimbursementDays',
      'presenceScaleMax',
      'sweatRate',
      'sweatMaxBonus',
      'foodMonthly',
      'utilitiesMonthly',
      'presenceTiers',
      'seasons',
      'tokenPrice',
    ]);
  });

  it('keeps a zero the platform actually chose', () => {
    const { params: none, missing } = parseResidencyConfig(
      { ...CONFIG, noticeWeeks: 0, sweatRate: 0 },
      TOKEN_PRICE,
      true,
      LIVING,
    );
    expect(missing).toEqual([]);
    expect(none?.noticeWeeks).toBe(0);
    // A village that adds nothing for seniority says so, and is believed.
    expect(none?.sweatRate).toBe(0);
  });

  it('reports a ladder top of zero as unset', () => {
    const { missing } = parseResidencyConfig(
      { ...CONFIG, presenceScaleMax: 0 },
      TOKEN_PRICE,
      true,
      LIVING,
    );
    expect(missing).toEqual(['presenceScaleMax']);
  });

  it('carries the legal frame the agreement is concluded under', () => {
    expect(params.associationName).toContain('Associação Ambiental');
    expect(params.legalFramework).toBe('Lei n.º 71/98');
    expect(params.jurisdiction).toBe('Santiago do Cacém');
  });

  it('takes no agreement template as a request for the shipped one', () => {
    expect(params.agreementTemplate).toBe('');
  });
});

describe('getResidencyLivingCosts', () => {
  it('restates the booking rates in the month a season bills in', () => {
    expect(
      getResidencyLivingCosts({ utilityFiatVal: 5 }, [
        { _id: 'basic', name: 'Basic', price: 8 },
        { _id: 'full', name: 'Full board', price: 11.2, isDefault: true },
      ] as any),
    ).toEqual({
      // The default option, not the cheapest, at 30 days a month.
      foodMonthly: 336,
      utilitiesMonthly: 150,
      providesMeals: true,
      providesUtilities: true,
    });
  });

  it('costs nothing for an option the platform switched off', () => {
    expect(
      getResidencyLivingCosts(
        { foodOptionEnabled: false, utilityOptionEnabled: false },
        [],
      ),
    ).toEqual({
      foodMonthly: 0,
      utilitiesMonthly: 0,
      providesMeals: false,
      providesUtilities: false,
    });
  });

  it('reports an option left on but never priced', () => {
    const unpriced = getResidencyLivingCosts(
      { utilityOptionEnabled: true },
      [],
    );
    expect(unpriced.foodMonthly).toBeNull();
    expect(unpriced.utilitiesMonthly).toBeNull();
  });
});

describe('listingsToAccommodations', () => {
  it('restates a nightly listing price in the 30-day month a season bills in', () => {
    const [accommodation] = listingsToAccommodations([listing()]);
    expect(accommodation.fiatMonthly).toBeCloseTo(90, 5);
    expect(accommodation.tokensMonthly).toBeCloseTo(3, 5);
  });

  it('keeps only what the platform opened to residents', () => {
    expect(
      listingsToAccommodations([
        listing({ availableFor: ['resident'] }),
        listing({ availableFor: ['guests', 'resident'] }),
      ]),
    ).toHaveLength(2);
  });

  it('drops a listing nobody opened to residents', () => {
    expect(
      listingsToAccommodations([
        listing({ availableFor: ['guests'] }),
        listing({ availableFor: ['team'] }),
        // Unset reads as unrestricted elsewhere, but not for a whole season.
        listing({ availableFor: [] }),
        listing({ availableFor: undefined }),
      ]),
    ).toHaveLength(0);
  });

  it('drops hourly spaces — a desk is not somewhere you live', () => {
    expect(
      listingsToAccommodations([listing({ priceDuration: 'hour' })]),
    ).toHaveLength(0);
  });

  it('strips the markup out of the listing description', () => {
    const [accommodation] = listingsToAccommodations([
      listing({ description: '<p>Loft   +<br/> living space</p>' }),
    ]);
    expect(accommodation.note).toBe('Loft + living space');
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
});

describe('getUpcomingSeason', () => {
  it('picks the season whose window opens soonest', () => {
    expect(getUpcomingSeason(params.seasons, NOW)?.id).toBe('spring');
    // In April, spring has already opened, so summer is the next window in.
    expect(getUpcomingSeason(params.seasons, new Date(2026, 3, 15))?.id).toBe(
      'summer',
    );
  });

  it('has nothing to offer with no seasons configured', () => {
    expect(getUpcomingSeason([], NOW)).toBeNull();
  });
});

describe('tiers', () => {
  it('places a volunteer on the highest tier they have reached', () => {
    expect(getTierForPresence(params.presenceTiers, 0).label).toBe('Newcomer');
    expect(getTierForPresence(params.presenceTiers, 500).label).toBe('Canopy');
    expect(getTierForPresence(params.presenceTiers, 9999).label).toBe(
      'Keystone',
    );
  });

  it('names the lowest tier that clears a role gate', () => {
    expect(getRequiredTier(params.presenceTiers, 30).label).toBe('Rooted');
    expect(getRequiredTier(params.presenceTiers, 101).label).toBe('Canopy');
  });
});

describe('buildResidencyPlan', () => {
  it('covers the cheapest room open to residents, at no cost', () => {
    const plan = planFor();
    expect(plan.includedAccommodation.id).toBe('dorm');
    expect(plan.isUpgrade).toBe(false);
    expect(plan.upgradeFiatMonthly).toBe(0);
    expect(plan.seasonFiatOwed).toBe(0);
    expect(plan.seasonTokensSpent).toBe(0);
  });

  it('charges only the difference for an upgrade', () => {
    const plan = planFor({ accommodationId: 'private' });
    expect(plan.isUpgrade).toBe(true);
    // 600 − 90 a month, over the five months of the spring season.
    expect(plan.upgradeFiatMonthly).toBeCloseTo(510, 5);
    expect(plan.months).toBe(5);
    expect(plan.seasonFiatOwed).toBeCloseTo(2550, 5);
    expect(plan.upgradeTokensMonthly).toBeCloseTo(1.5, 5);
  });

  it('lets the volunteer spend their own tokens on the upgrade', () => {
    const plan = planFor({ accommodationId: 'private', tokensSpent: 7.5 });
    expect(plan.tokensNeeded).toBeCloseTo(7.5, 5);
    expect(plan.coverage).toBeCloseTo(1, 5);
    expect(plan.seasonFiatOwed).toBeCloseTo(0, 5);
    expect(plan.seasonTokensSpent).toBeCloseTo(7.5, 5);
  });

  it('spends no more than the wallet actually holds', () => {
    const plan = planFor(
      { accommodationId: 'private', tokensSpent: 7.5 },
      standingOf({ lockableTokens: 3 }),
    );
    expect(plan.spendableMax).toBe(3);
    expect(plan.tokensSpent).toBe(3);
    // 40% of the upgrade covered, so 60% of 2550 is still owed.
    expect(plan.seasonFiatOwed).toBeCloseTo(1530, 5);
  });

  it('never spends tokens the cached balance only appears to hold', () => {
    const plan = planFor(
      { accommodationId: 'private', tokensSpent: 5 },
      standingOf({ lockableTokens: 0 }),
    );
    expect(plan.tokensSpent).toBe(0);
    expect(plan.seasonFiatOwed).toBeCloseTo(2550, 5);
  });

  it('costs nothing at all when the volunteer houses themselves', () => {
    const plan = planFor({
      accommodationId: 'private',
      needsAccommodation: false,
    });
    expect(plan.isUpgrade).toBe(false);
    expect(plan.seasonFiatOwed).toBe(0);
    // No stay on site, so no days on the land are counted.
    expect(plan.presenceEarned).toBe(0);
  });

  it('counts every day of the stay towards $Presence', () => {
    expect(planFor().presenceEarned).toBe(150);
    expect(planFor({ departureDayOffset: 29 }).presenceEarned).toBe(30);
  });

  it('bills an upgrade by every calendar month the stay touches', () => {
    expect(planFor({ departureDayOffset: 27 }).months).toBe(1);
    expect(planFor({ departureDayOffset: 28 }).months).toBe(2);
  });

  it('keeps the arrival before the departure, inside the window', () => {
    const plan = planFor({ arrivalDayOffset: 200, departureDayOffset: -5 });
    expect(plan.arrival.getTime()).toBeLessThanOrEqual(
      plan.departure.getTime(),
    );
    expect(plan.spanDays).toBeGreaterThan(0);
  });

  it('flags a role the volunteer has not unlocked yet', () => {
    const plan = planFor({}, standingOf({ presence: 10, lockableTokens: 0 }));
    expect(plan.isRoleUnlocked).toBe(false);
    expect(plan.presenceShortfall).toBe(20);
    expect(plan.requiredTier.label).toBe('Rooted');
  });

  it('sizes the allocation from the budget left after program costs', () => {
    const plan = planFor({ halfDaysPerWeek: 5 });
    // 1600 budget + 200.4 seniority (120 $Sweat × 1.67) at full rhythm,
    // less 336 food, 150 utilities and the 90 covered dorm.
    expect(plan.budgetMonthly).toBeCloseTo(1800.4, 5);
    expect(plan.programCostsMonthly).toBeCloseTo(576, 5);
    expect(plan.netBudgetMonthly).toBeCloseTo(1224.4, 5);
    // Converted at the curve price into a quantity of tokens.
    expect(plan.tokensDistributedMonthly).toBeCloseTo(1224.4 / 266.5, 5);
    expect(plan.seasonTokensDistributed).toBeCloseTo((1224.4 / 266.5) * 5, 5);
  });

  it('scales the budget by the rhythm agreed, and caps seniority', () => {
    const half = planFor({ halfDaysPerWeek: 2.5 });
    const full = planFor({ halfDaysPerWeek: 5 });
    expect(half.budgetMonthly).toBeCloseTo(full.budgetMonthly / 2, 5);
    // $Sweat is capped, however much of it someone holds.
    expect(
      planFor({ halfDaysPerWeek: 5 }, standingOf({ sweat: 100000 })).sweatBonus,
    ).toBe(300);
  });

  it('never lets program costs turn into a debt', () => {
    const plan = buildResidencyPlan({
      role: { ...ROLE, baseCompensation: 100 },
      params,
      accommodations: ACCOMMODATIONS,
      standing: standingOf({ sweat: 0 }),
      selection: baseSelection(),
      now: NOW,
    })!;
    expect(plan.netBudgetMonthly).toBe(0);
    expect(plan.seasonTokensDistributed).toBe(0);
  });

  it('sizes the allocation off the covered room, not the upgrade', () => {
    // The volunteer buys the upgrade themselves, so the association's cost —
    // and therefore the allocation — is unchanged by it.
    expect(
      planFor({ accommodationId: 'private' }).programCostsMonthly,
    ).toBeCloseTo(planFor().programCostsMonthly, 5);
  });

  it('returns null when there is nowhere to stay', () => {
    expect(
      buildResidencyPlan({
        role: ROLE,
        params,
        accommodations: [],
        standing: standingOf(),
        selection: baseSelection(),
        now: NOW,
      }),
    ).toBeNull();
  });

  it('returns null when no season is configured to join', () => {
    expect(
      buildResidencyPlan({
        role: ROLE,
        params: { ...params, seasons: [] },
        accommodations: ACCOMMODATIONS,
        standing: standingOf(),
        selection: baseSelection(),
        now: NOW,
      }),
    ).toBeNull();
  });
});

describe('buildAgreementSubmission', () => {
  const submissionFor = (patch: Partial<ResidencySelection> = {}) => {
    const selection = baseSelection(patch);
    const plan = planFor(patch);
    return buildAgreementSubmission({
      role: ROLE,
      plan,
      params,
      standing: standingOf(),
      selection,
      agreementBody: '# Acordo',
      acknowledgedIds: ['unpaid'],
      now: NOW,
    });
  };

  it('describes the stay the server must create', () => {
    const { stay: request } = submissionFor();
    expect(request!.listingId).toBe('dorm');
    expect(request!.adults).toBe(1);
    expect(request!.isTeamBooking).toBe(true);
    expect(request!.start.slice(0, 10)).toBe('2026-02-01');
    expect(request!.end.slice(0, 10)).toBe('2026-06-30');
  });

  it('asks for no booking when the volunteer houses themselves', () => {
    expect(submissionFor({ needsAccommodation: false }).stay).toBeNull();
  });

  it('freezes the season as it was signed', () => {
    const submission = submissionFor({
      accommodationId: 'private',
      tokensSpent: 7.5,
    });
    expect(submission.roleId).toBe('role-1');
    expect(submission.agreementVersion).toBe('1.0');
    expect(submission.acknowledgedIds).toEqual(['unpaid']);
    expect(submission.program.seasonLabel).toBe('Spring');
    expect(submission.program.includedAccommodationId).toBe('dorm');
    expect(submission.program.accommodationId).toBe('private');
    expect(submission.program.isUpgrade).toBe(true);
    expect(submission.program.seasonTokensSpent).toBeCloseTo(7.5, 5);
    expect(submission.program.seasonFiatOwed).toBeCloseTo(0, 5);
    expect(submission.program.presenceEarned).toBe(150);
    expect(submission.program.halfDaysPerWeek).toBe(4);
    // A quantity of tokens, worth nothing on any market.
    expect(submission.program.seasonTokensDistributed).toBeGreaterThan(0);
    expect(submission.program.tokenFairValue).toBe(0);
    expect(submission.acceptedAt).toBe(NOW.toISOString());
  });

  it('carries no compensation of any kind', () => {
    const submission = submissionFor();
    expect(JSON.stringify(submission)).not.toMatch(
      /cash|salary|gross|allocation|compensation/i,
    );
  });
});

describe('getAgreementTemplate', () => {
  it('prefers the role, then the association, then the shipped body', () => {
    const shipped = '# Shipped';
    expect(
      getAgreementTemplate(
        { ...ROLE, agreementTemplate: '# Role' },
        params,
        shipped,
      ),
    ).toBe('# Role');
    expect(getAgreementTemplate(ROLE, params, shipped)).toBe(shipped);
    expect(
      getAgreementTemplate(
        ROLE,
        { ...params, agreementTemplate: '# Association' },
        shipped,
      ),
    ).toBe('# Association');
  });
});

describe('renderAgreement', () => {
  const render = (template: string, patch: Partial<ResidencySelection> = {}) =>
    renderAgreement({
      template,
      role: ROLE,
      plan: planFor(patch),
      params,
      volunteerName: 'Tonya',
      platformName: 'TDF',
      tokenSymbol: 'TDF',
      formatCurrency: (value) => `€${Math.round(value)}`,
      formatDate: (date) => date.toISOString().slice(0, 10),
      now: NOW,
    });

  it('fills the placeholders from the live season', () => {
    expect(
      render(
        '{{volunteerName}} · {{roleTitle}} · {{seasonLabel}} · {{halfDaysPerWeek}} · {{noticeWeeks}}',
      ),
    ).toBe('Tonya · Land steward · Spring · 4 · 2');
  });

  it('names the association and the law it runs under', () => {
    expect(render('{{associationName}} — {{legalFramework}}')).toBe(
      'Associação Ambiental da Fábrica dos Sonhos Tradicionais — Lei n.º 71/98',
    );
  });

  it('states the allocation as a quantity, valued at nothing', () => {
    const body = render(
      '{{tokensDistributed}} {{tokenSymbol}} · {{tokenFairValue}}',
    );
    expect(body).toMatch(/^[\d.]+ TDF · €0$/);
  });

  it('never puts the budget behind the allocation into the agreement', () => {
    // Unknown placeholders, because those values are not offered to it.
    expect(
      render('{{budgetMonthly}} {{netBudgetMonthly}} {{tokenValue}}'),
    ).toBe('{{budgetMonthly}} {{netBudgetMonthly}} {{tokenValue}}');
  });

  it('records the covered room, and any upgrade paid for on top', () => {
    expect(render('{{includedAccommodation}} / {{upgradeLine}}')).toBe(
      'Shared dorm / None',
    );
    expect(
      render('{{upgradeLine}}', {
        accommodationId: 'private',
        tokensSpent: 7.5,
      }),
    ).toBe('Private room, paid by the Volunteer (7.5 TDF)');
  });

  it('renders the role responsibilities as the focus areas', () => {
    expect(render('{{focusAreas}}')).toBe('- Restore the land');
  });

  it('leaves an unknown placeholder visible rather than blanking it', () => {
    expect(render('{{notAThing}}')).toBe('{{notAThing}}');
  });
});
