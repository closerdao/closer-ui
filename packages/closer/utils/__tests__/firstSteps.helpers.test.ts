/**
 * `/first-steps` derives its progress from the instance, not from stored
 * checkmarks. These cover the derivation rules that make that trustworthy:
 * a fresh instance reads as untouched, a feature-gated step disappears rather
 * than nagging, and a template page does not pass for a real one.
 */
import { FIRST_STEPS, FirstStepId } from '../../constants/firstSteps';
import {
  FirstStepsFacts,
  emptyFirstStepsFacts,
  emptyFirstStepsUserState,
  getAdjacentFirstSteps,
  getFirstStepsProgress,
  getVisibleFirstSteps,
  isFeatureLive,
  isFirstStepDone,
  mergeFirstStepsUserState,
  parseFirstStepsUserState,
  resolveFirstStep,
  toggleSkippedStep,
} from '../firstSteps.helpers';

const facts = (overrides: Partial<FirstStepsFacts> = {}): FirstStepsFacts => ({
  ...emptyFirstStepsFacts(),
  ...overrides,
});

const configuredIdentity = {
  general: {
    platformName: 'Traditional Dream Factory',
    teamEmail: 'space@tdf.com',
    country: 'PT',
  },
};

/** Booking passes both gates: the env flag and the saved `enabled`. */
const withBookingOn = (extra: Record<string, any> = {}) => {
  process.env.NEXT_PUBLIC_FEATURE_BOOKING = 'true';
  return { booking: { enabled: true, ...extra } };
};

afterEach(() => {
  delete process.env.NEXT_PUBLIC_FEATURE_BOOKING;
});

describe('a fresh instance', () => {
  it('has no step done', () => {
    const progress = getFirstStepsProgress(facts());
    expect(progress.doneCount).toBe(0);
    expect(progress.isComplete).toBe(false);
  });

  it('opens on the first step', () => {
    expect(resolveFirstStep(facts())).toBe('identity');
  });

  it('hides the booking-only step', () => {
    const visible = getVisibleFirstSteps(facts()).map((step) => step.id);
    expect(visible).not.toContain('stays');
  });
});

describe('isFeatureLive — both gates must pass', () => {
  it('is off when the env flag is missing, however the config reads', () => {
    expect(isFeatureLive('booking', { booking: { enabled: true } })).toBe(
      false,
    );
  });

  it('is off when the env flag is set but the config is not enabled', () => {
    process.env.NEXT_PUBLIC_FEATURE_BOOKING = 'true';
    expect(isFeatureLive('booking', { booking: { enabled: false } })).toBe(
      false,
    );
    expect(isFeatureLive('booking', {})).toBe(false);
  });

  it('is on when both agree', () => {
    process.env.NEXT_PUBLIC_FEATURE_BOOKING = 'true';
    expect(isFeatureLive('booking', { booking: { enabled: true } })).toBe(true);
  });

  it('needs only the config for a group with no env gate', () => {
    expect(isFeatureLive('events', { events: { enabled: true } })).toBe(true);
    expect(isFeatureLive('events', {})).toBe(false);
  });
});

describe('the conditional stays step', () => {
  it('appears and renumbers the steps after it once booking is live', () => {
    const withoutBooking = getVisibleFirstSteps(facts());
    const progress = getFirstStepsProgress(facts({ config: withBookingOn() }));
    const ids = progress.steps.map((step) => step.id);

    expect(ids).toContain('stays');
    expect(progress.total).toBe(withoutBooking.length + 1);
    // `stays` sits between `team` and `launch` in the definitions, so `launch`
    // shifts down by one rather than keeping a fixed number.
    expect(progress.steps.find((step) => step.id === 'launch')?.index).toBe(
      progress.total,
    );
  });

  it('needs a listing', () => {
    const config = withBookingOn();
    expect(isFirstStepDone('stays', facts({ config }))).toBe(false);
    expect(isFirstStepDone('stays', facts({ config, listingCount: 1 }))).toBe(
      true,
    );
  });

  it('also needs a food option once food is switched on', () => {
    const config = withBookingOn({ foodOptionEnabled: true });
    expect(isFirstStepDone('stays', facts({ config, listingCount: 2 }))).toBe(
      false,
    );
    expect(
      isFirstStepDone(
        'stays',
        facts({ config, listingCount: 2, foodCount: 1 }),
      ),
    ).toBe(true);
  });
});

describe('isFirstStepDone', () => {
  it('wants a name, an email and a country before identity counts', () => {
    expect(
      isFirstStepDone(
        'identity',
        facts({ config: { general: { platformName: 'TDF' } } }),
      ),
    ).toBe(false);
    expect(
      isFirstStepDone('identity', facts({ config: configuredIdentity })),
    ).toBe(true);
  });

  it('treats blank strings as unset', () => {
    expect(
      isFirstStepDone(
        'identity',
        facts({
          config: {
            general: { platformName: '  ', teamEmail: 'a@b.c', country: 'PT' },
          },
        }),
      ),
    ).toBe(false);
  });

  it('counts the theme once a primary colour is saved', () => {
    expect(isFirstStepDone('theme', facts())).toBe(false);
    expect(
      isFirstStepDone(
        'theme',
        facts({ config: { theming: { primaryColor: '#2f6f4e' } } }),
      ),
    ).toBe(true);
  });

  it('counts features once any decision is recorded, including a no', () => {
    expect(isFirstStepDone('features', facts({ config: { blog: {} } }))).toBe(
      false,
    );
    expect(
      isFirstStepDone(
        'features',
        facts({ config: { blog: { enabled: false } } }),
      ),
    ).toBe(true);
  });

  it('does not accept a template home page as created', () => {
    expect(
      isFirstStepDone(
        'pages',
        facts({ pages: [{ _id: 'std:/', slug: '/', isDefault: true }] }),
      ),
    ).toBe(false);
    expect(
      isFirstStepDone(
        'pages',
        facts({ pages: [{ _id: '65f0abc', slug: '/' }] }),
      ),
    ).toBe(true);
  });

  it('wants both a payment config and a named legal entity for money', () => {
    expect(
      isFirstStepDone(
        'money',
        facts({ config: { payment: { enabled: true } } }),
      ),
    ).toBe(false);
    expect(
      isFirstStepDone(
        'money',
        facts({
          config: {
            payment: { enabled: true },
            'accounting-entities': { elements: [{ legalName: 'OASA CRL' }] },
          },
        }),
      ),
    ).toBe(true);
  });

  it('derives the team step from other people holding a role', () => {
    expect(isFirstStepDone('team', facts())).toBe(false);
    expect(isFirstStepDone('team', facts({ teamCount: 1 }))).toBe(false);
    expect(isFirstStepDone('team', facts({ teamCount: 2 }))).toBe(true);
  });

  it('counts launch only after a deploy', () => {
    expect(isFirstStepDone('launch', facts({ hasDeployed: true }))).toBe(true);
  });
});

describe('completion', () => {
  const everythingDone = facts({
    config: {
      ...configuredIdentity,
      theming: { primaryColor: '#2f6f4e' },
      blog: { enabled: false },
    },
    pages: [{ _id: '65f0abc', slug: '/' }],
    hasDeployed: true,
  });

  it('is not complete while optional steps are merely untouched', () => {
    expect(getFirstStepsProgress(everythingDone).isComplete).toBe(false);
  });

  it('is complete once the optional steps are skipped', () => {
    const progress = getFirstStepsProgress({
      ...everythingDone,
      skipped: ['money', 'team'],
    });
    expect(progress.isComplete).toBe(true);
    expect(progress.nextStepId).toBeNull();
  });

  it('never lets a skip clear a required step', () => {
    const progress = getFirstStepsProgress({
      ...facts({ skipped: FIRST_STEPS.map((step) => step.id) }),
    });
    expect(progress.isComplete).toBe(false);
  });

  it('points at the first outstanding step', () => {
    expect(
      getFirstStepsProgress(facts({ config: configuredIdentity })).nextStepId,
    ).toBe('theme');
  });
});

describe('navigation', () => {
  it('honours an explicit step when it is visible', () => {
    expect(resolveFirstStep(facts(), 'team')).toBe('team');
  });

  it('ignores a step hidden by its feature gate', () => {
    expect(resolveFirstStep(facts(), 'stays')).toBe('identity');
  });

  it('ignores an unknown step', () => {
    expect(resolveFirstStep(facts(), 'nonsense')).toBe('identity');
  });

  it('walks neighbours over the visible steps only', () => {
    const { previousId, nextId } = getAdjacentFirstSteps(facts(), 'team');
    expect(previousId).toBe('money');
    // `stays` is hidden without booking, so `team` leads straight to `launch`.
    expect(nextId).toBe('launch');
  });

  it('has no previous before the first step or next after the last', () => {
    expect(getAdjacentFirstSteps(facts(), 'identity').previousId).toBeNull();
    expect(getAdjacentFirstSteps(facts(), 'launch').nextId).toBeNull();
  });
});

describe('per-user state', () => {
  it('drops anything that does not look like stored state', () => {
    expect(parseFirstStepsUserState(null).skipped).toEqual([]);
    expect(parseFirstStepsUserState('nope').hasBeenRedirected).toBe(false);
    expect(
      parseFirstStepsUserState({ skipped: ['money', 'not-a-step', 7] }).skipped,
    ).toEqual(['money']);
  });

  it('unions local and remote so an in-flight skip survives', () => {
    const merged = mergeFirstStepsUserState(
      {
        skipped: ['money'],
        hasBeenRedirected: true,
        hasDismissedBanner: false,
        hasDeployed: false,
      },
      {
        skipped: ['team'],
        hasBeenRedirected: false,
        hasDismissedBanner: true,
        hasDeployed: true,
      },
    );
    expect(merged.skipped.sort()).toEqual(['money', 'team']);
    expect(merged.hasBeenRedirected).toBe(true);
    expect(merged.hasDismissedBanner).toBe(true);
    expect(merged.hasDeployed).toBe(true);
  });

  it('remembers a deploy, which nothing else can observe', () => {
    expect(parseFirstStepsUserState({ hasDeployed: true }).hasDeployed).toBe(
      true,
    );
    expect(emptyFirstStepsUserState().hasDeployed).toBe(false);
  });

  it('toggles a skip both ways', () => {
    const once = toggleSkippedStep(
      emptyFirstStepsUserState(),
      'money' as FirstStepId,
    );
    expect(once.skipped).toEqual(['money']);
    expect(toggleSkippedStep(once, 'money' as FirstStepId).skipped).toEqual([]);
  });
});
