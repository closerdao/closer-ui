import { Role } from '../../types/api';
import { Listing } from '../../types/booking';
import { ResidencySelection } from '../../types/residency';
import {
  buildAgreementSubmission,
  buildResidencyPlan,
  canVolunteerCancelResidency,
  getAgreementTemplate,
  getRequiredTier,
  getResidencyLivingCosts,
  getSeasonWindow,
  getTierForPresence,
  getUpcomingSeason,
  hasResidencyStarted,
  listingsToAccommodations,
  parseResidencyConfig,
  renderAgreement,
} from '../residency.helpers';

const CONFIG = {
  associationName: 'Associação Ambiental da Fábrica dos Sonhos Tradicionais',
  legalFramework: 'Lei n.º 71/98',
  legalFrameworkUrl: '/volunteering',
  jurisdiction: 'Santiago do Cacém',
  associationTaxNumber: '123 456 789',
  associationAddress: 'Fábrica dos Sonhos, Abela',
  signatoryName: 'Ana Silva',
  signatoryOffice: 'Presidente da Direção',
  privacyContactEmail: 'privacy@example.org',
  coordinatorContact: 'Rui, rui@example.org',
  insurancePolicy: 'Fidelidade, policy 12345',
  noticeWeeks: 2,
  expenseReimbursementDays: 30,
  presenceScaleMax: 930,
  sweatRate: 0,
  sweatMaxBonus: 0,
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
      { ...CONFIG, noticeWeeks: 0 },
      TOKEN_PRICE,
      true,
      LIVING,
    );
    expect(missing).toEqual([]);
    expect(none?.noticeWeeks).toBe(0);
  });

  it('names the inputs the apply endpoint reads even though the page does not', () => {
    // The API refuses to file a season without them, so a village is told
    // before anyone signs rather than in a 400 afterwards.
    const { missing } = parseResidencyConfig(
      { ...CONFIG, sweatRate: undefined, expenseReimbursementDays: '' },
      TOKEN_PRICE,
      true,
      LIVING,
    );
    expect(missing).toEqual(['expenseReimbursementDays', 'sweatRate']);
    // Zero sizes the allocation from the role's budget alone — a real answer.
    expect(params.sweatRate).toBe(0);
    expect(params.sweatMaxBonus).toBe(0);
    expect(params.expenseReimbursementDays).toBe(30);
  });

  it('carries the particulars the agreement names, blank when unset', () => {
    expect(params.associationTaxNumber).toBe('123 456 789');
    expect(params.signatoryOffice).toBe('Presidente da Direção');
    const { params: bare, missing } = parseResidencyConfig(
      { ...CONFIG, associationTaxNumber: undefined, signatoryName: '  ' },
      TOKEN_PRICE,
      true,
      LIVING,
    );
    // Optional, every one: nothing about them stops a season being laid out.
    expect(missing).toEqual([]);
    expect(bare?.associationTaxNumber).toBe('');
    expect(bare?.signatoryName).toBe('');
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
    expect(plan.upgradeFiatSeason).toBeCloseTo(2550, 5);
    expect(plan.upgradeTokensMonthly).toBeCloseTo(1.5, 5);
  });

  it('takes the upgrade out of the allocation before asking for a euro', () => {
    const plan = planFor({ accommodationId: 'private' });
    // Nothing spent out of the volunteer's own wallet.
    expect(plan.seasonTokensSpent).toBe(0);
    // 2550 of the 4321.60 budget left for the season, at the curve price.
    expect(plan.seasonTokensWithheld).toBeCloseTo(2550 / 266.5, 5);
    expect(plan.seasonTokensIssued).toBeCloseTo(
      plan.seasonTokensDistributed - 2550 / 266.5,
      5,
    );
    expect(plan.tokensIssuedMonthly).toBeCloseTo(
      plan.seasonTokensIssued / 5,
      5,
    );
    expect(plan.seasonFiatOwed).toBe(0);
  });

  it('asks for euros only once the allocation is exhausted', () => {
    // 1000 of budget at a 0.8 rhythm is 800 a month, of which 576 is what the
    // program already spends — leaving 224 a month, 1120 for the season.
    const plan = buildResidencyPlan({
      role: { ...ROLE, baseCompensation: 1000 },
      params,
      accommodations: ACCOMMODATIONS,
      standing: standingOf({ sweat: 0 }),
      selection: baseSelection({ accommodationId: 'private' }),
      now: NOW,
    })!;
    expect(plan.seasonTokensWithheld).toBeCloseTo(1120 / 266.5, 5);
    expect(plan.seasonTokensIssued).toBeCloseTo(0, 5);
    expect(plan.seasonFiatOwed).toBeCloseTo(2550 - 1120, 5);
  });

  it('bills the whole upgrade when there is no allocation to absorb it', () => {
    const plan = buildResidencyPlan({
      role: { ...ROLE, baseCompensation: 100 },
      params,
      accommodations: ACCOMMODATIONS,
      standing: standingOf({ sweat: 0 }),
      selection: baseSelection({ accommodationId: 'private' }),
      now: NOW,
    })!;
    expect(plan.seasonTokensDistributed).toBe(0);
    expect(plan.seasonTokensWithheld).toBe(0);
    expect(plan.seasonFiatOwed).toBeCloseTo(2550, 5);
  });

  it('lets the volunteer spend their own tokens to keep their allocation', () => {
    const plan = planFor({ accommodationId: 'private', tokensSpent: 7.5 });
    expect(plan.tokensNeeded).toBeCloseTo(7.5, 5);
    expect(plan.coverage).toBeCloseTo(1, 5);
    expect(plan.seasonFiatOwed).toBeCloseTo(0, 5);
    expect(plan.seasonTokensSpent).toBeCloseTo(7.5, 5);
    // Paid for out of their own holding, so the allocation is untouched.
    expect(plan.seasonTokensWithheld).toBe(0);
    expect(plan.seasonTokensIssued).toBeCloseTo(
      plan.seasonTokensDistributed,
      5,
    );
  });

  it('spends no more than the wallet actually holds', () => {
    const plan = planFor(
      { accommodationId: 'private', tokensSpent: 7.5 },
      standingOf({ lockableTokens: 3 }),
    );
    expect(plan.spendableMax).toBe(3);
    expect(plan.tokensSpent).toBe(3);
    // 40% of the upgrade covered by their own tokens; the remaining 1530 comes
    // out of the allocation, so there is still nothing to pay.
    expect(plan.seasonTokensWithheld).toBeCloseTo(1530 / 266.5, 5);
    expect(plan.seasonFiatOwed).toBe(0);
  });

  it('never spends tokens the cached balance only appears to hold', () => {
    const plan = planFor(
      { accommodationId: 'private', tokensSpent: 5 },
      standingOf({ lockableTokens: 0 }),
    );
    expect(plan.tokensSpent).toBe(0);
    // Nothing of theirs is spent, and the allocation still covers the room.
    expect(plan.seasonTokensWithheld).toBeCloseTo(2550 / 266.5, 5);
    expect(plan.seasonFiatOwed).toBe(0);
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
    // 1600 budget at full rhythm, less 336 food, 150 utilities and the 90
    // covered dorm. What the volunteer holds in $Sweat does not enter.
    expect(plan.budgetMonthly).toBeCloseTo(1600, 5);
    expect(plan.programCostsMonthly).toBeCloseTo(576, 5);
    expect(plan.netBudgetMonthly).toBeCloseTo(1024, 5);
    // Converted at the curve price into a quantity of tokens.
    expect(plan.tokensDistributedMonthly).toBeCloseTo(1024 / 266.5, 5);
    expect(plan.seasonTokensDistributed).toBeCloseTo((1024 / 266.5) * 5, 5);
    expect(
      planFor({ halfDaysPerWeek: 5 }, standingOf({ sweat: 100000 }))
        .budgetMonthly,
    ).toBeCloseTo(1600, 5);
    // No upgrade taken, so the whole allocation is issued.
    expect(plan.seasonTokensIssued).toBeCloseTo(
      plan.seasonTokensDistributed,
      5,
    );
  });

  it('scales the budget by the rhythm agreed', () => {
    const half = planFor({ halfDaysPerWeek: 2.5 });
    const full = planFor({ halfDaysPerWeek: 5 });
    expect(half.budgetMonthly).toBeCloseTo(full.budgetMonthly / 2, 5);
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

  it('sends what the volunteer chose, and their own words for it', () => {
    const submission = submissionFor({
      accommodationId: 'private',
      tokensSpent: 7.5,
    });
    expect(submission.roleId).toBe('role-1');
    expect(submission.agreementVersion).toBe('1.0');
    expect(submission.acknowledgedIds).toEqual(['unpaid']);
    expect(submission.selection.accommodationId).toBe('private');
    expect(submission.selection.tokensSpent).toBe(7.5);
    expect(submission.acceptedAt).toBe(NOW.toISOString());
  });

  it('names the stay and the selection as the same room', () => {
    const submission = submissionFor({ accommodationId: 'private' });
    // The two disagreeing is a 400 — the endpoint will not guess which is meant.
    expect(submission.stay!.listingId).toBe(
      submission.selection.accommodationId,
    );
  });

  it('sends only the dates that say which year is being joined', () => {
    /*
     * The association recomputes the whole season from its own inputs and
     * files its own result. Anything else on `program` is discarded there, so
     * sending it would only be arithmetic inviting someone to trust it.
     */
    const submission = submissionFor({ accommodationId: 'private' });
    expect(Object.keys(submission.program).sort()).toEqual([
      'endDate',
      'startDate',
    ]);
    expect(submission.program.startDate.slice(0, 10)).toBe('2026-02-01');
    expect(submission.program.endDate.slice(0, 10)).toBe('2026-06-30');
    expect(JSON.stringify(submission)).not.toMatch(
      /seasonTokensDistributed|upgradeFiat|presenceEarned|tokenFairValue/,
    );
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
    ).toBe(
      'Private room, chosen by the Volunteer — 7.5 TDF staked by the Volunteer',
    );
  });

  it('names the allocation the Association withheld for the room', () => {
    expect(render('{{upgradeLine}}', { accommodationId: 'private' })).toBe(
      'Private room, chosen by the Volunteer — 9.57 TDF withheld from the ' +
        'season allocation',
    );
  });

  it('states the allocation net of what the chosen room took', () => {
    const gross = planFor().seasonTokensIssued;
    const net = planFor({ accommodationId: 'private' }).seasonTokensIssued;
    expect(net).toBeLessThan(gross);
    expect(
      render('{{tokensDistributed}}', { accommodationId: 'private' }),
    ).toBe(String(Number(net.toFixed(2))));
  });

  it('states accident cover only where the association holds a policy', () => {
    expect(render('{{insuranceClause}}')).toContain(
      'does not currently hold a personal accident policy',
    );
    expect(render('{{insuranceAnnexLine}}')).toBe(
      'none held by the Association / não assegurado pela Associação',
    );
    const covered = renderAgreement({
      template: '{{insuranceClause}} · {{insuranceAnnexLine}}',
      role: ROLE,
      plan: planFor(),
      params: { ...params, providesInsurance: true },
      volunteerName: 'Tonya',
      platformName: 'TDF',
      tokenSymbol: 'TDF',
      formatCurrency: (value) => `€${Math.round(value)}`,
      formatDate: (date) => date.toISOString().slice(0, 10),
      now: NOW,
    });
    expect(covered).toContain('provides personal accident insurance');
    expect(covered).toContain('Fidelidade, policy 12345');
  });

  it('fills the association particulars, and leaves a visible blank where unset', () => {
    expect(
      render(
        'NIPC {{associationTaxNumber}} · {{associationAddress}} · {{signatoryName}}, {{signatoryOffice}} · {{privacyContactEmail}} · {{coordinatorContact}}',
      ),
    ).toBe(
      'NIPC 123 456 789 · Fábrica dos Sonhos, Abela · Ana Silva, Presidente da Direção · privacy@example.org · Rui, rui@example.org',
    );
    const blank = renderAgreement({
      template:
        'NIPC {{associationTaxNumber}} · {{signatoryName}} · {{insuranceAnnexLine}}',
      role: ROLE,
      plan: planFor(),
      params: {
        ...params,
        associationTaxNumber: '',
        signatoryName: '',
        providesInsurance: true,
        insurancePolicy: '',
      },
      volunteerName: 'Tonya',
      platformName: 'TDF',
      tokenSymbol: 'TDF',
      formatCurrency: (value) => `€${Math.round(value)}`,
      formatDate: (date) => date.toISOString().slice(0, 10),
      now: NOW,
    });
    // A blank a lawyer can see, never a clause that quietly names nobody.
    expect(blank).toBe('NIPC [•] · [•] · [insurer, policy no.]');
  });

  it('renders the role responsibilities as the focus areas', () => {
    expect(render('{{focusAreas}}')).toBe('- Restore the land');
  });

  it('leaves an unknown placeholder visible rather than blanking it', () => {
    expect(render('{{notAThing}}')).toBe('{{notAThing}}');
  });
});

describe('canVolunteerCancelResidency', () => {
  const agreementAt = (startDate: string, status = 'pending') =>
    ({ status, program: { startDate } } as any);

  /*
   * `now` is built from local components on purpose: the volunteer's own
   * calendar day is what decides the window, so a wall-clock date is what the
   * test should state — an instant would only be testing the runner's zone.
   */
  it('lets a volunteer end a season right up to the day before it starts', () => {
    expect(
      canVolunteerCancelResidency(
        agreementAt('2026-09-01T00:00:00.000Z'),
        new Date(2026, 7, 31, 23, 30),
      ),
    ).toBe(true);
  });

  it('closes the window on the first day of the season', () => {
    expect(
      canVolunteerCancelResidency(
        agreementAt('2026-09-01T00:00:00.000Z'),
        new Date(2026, 8, 1, 0, 30),
      ),
    ).toBe(false);
    expect(
      hasResidencyStarted('2026-09-01T00:00:00.000Z', new Date(2026, 8, 1)),
    ).toBe(true);
  });

  it('offers nothing on a season that has already been ended', () => {
    expect(
      canVolunteerCancelResidency(
        agreementAt('2026-09-01T00:00:00.000Z', 'cancelled'),
        new Date('2026-06-01T00:00:00.000Z'),
      ),
    ).toBe(false);
  });
});
