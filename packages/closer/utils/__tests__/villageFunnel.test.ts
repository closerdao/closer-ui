/**
 * The five-step self-checkout: application → account → subscription → village →
 * deploy. Every surface reads its steps and its "next" prompt from here, so the
 * rules that keep the strip honest are worth pinning down.
 */
import {
  VILLAGE_FUNNEL_STEPS,
  getVillageFunnelDoneFlags,
  getVillageFunnelIndex,
  getVillageFunnelPrompt,
  getVillageFunnelSteps,
  hasVillageWebsiteQuestion,
} from '../villageFunnel';

describe('hasVillageWebsiteQuestion', () => {
  it('recognises a link question by type or by name', () => {
    expect(hasVillageWebsiteQuestion([{ name: 'site', type: 'url' }])).toBe(
      true,
    );
    expect(
      hasVillageWebsiteQuestion([{ name: 'Pitch deck', type: 'text' }]),
    ).toBe(true);
    expect(hasVillageWebsiteQuestion([{ name: 'website' }])).toBe(true);
  });

  it('is false for a config that only asks about the person', () => {
    expect(
      hasVillageWebsiteQuestion([
        { name: 'name', type: 'text' },
        { name: 'email', type: 'email' },
        { name: 'communitySize', type: 'select' },
      ]),
    ).toBe(false);
    expect(hasVillageWebsiteQuestion([])).toBe(false);
  });
});

describe('village funnel steps', () => {
  it('starts everybody on the application', () => {
    expect(getVillageFunnelIndex({})).toBe(0);
    expect(getVillageFunnelPrompt({})).toEqual({
      step: 'application',
      index: 0,
      // No route: the application lives in a modal.
      href: null,
    });
  });

  it('walks one step at a time', () => {
    expect(getVillageFunnelIndex({ hasApplication: true })).toBe(1);
    expect(
      getVillageFunnelIndex({ hasApplication: true, isAuthenticated: true }),
    ).toBe(2);
    expect(
      getVillageFunnelIndex({
        hasApplication: true,
        isAuthenticated: true,
        hasSubscription: true,
      }),
    ).toBe(3);
    expect(
      getVillageFunnelIndex({
        hasApplication: true,
        isAuthenticated: true,
        hasSubscription: true,
        village: { _id: 'v1', slug: 'ithaca', onboardingStatus: 'subscribed' },
      }),
    ).toBe(4);
  });

  it('sends the deploy prompt to the village itself', () => {
    expect(
      getVillageFunnelPrompt({
        village: { _id: 'v1', slug: 'ithaca', onboardingStatus: 'subscribed' },
      }),
    ).toEqual({ step: 'deploy', index: 4, href: '/villages/ithaca' });
  });

  it('has nothing left to ask of a live village', () => {
    const facts = {
      village: { _id: 'v1', slug: 'ithaca', onboardingStatus: 'live' as const },
    };
    expect(getVillageFunnelIndex(facts)).toBe(VILLAGE_FUNNEL_STEPS.length);
    expect(getVillageFunnelPrompt(facts)).toBeNull();
  });

  it('counts a suspended village as deployed — it ran, and can again', () => {
    expect(
      getVillageFunnelIndex({
        village: {
          _id: 'v1',
          slug: 'ithaca',
          onboardingStatus: 'suspended',
        },
      }),
    ).toBe(VILLAGE_FUNNEL_STEPS.length);
  });

  it('is still working on a deploy that has been requested or has failed', () => {
    (['deploy_requested', 'deploying', 'failed'] as const).forEach((status) => {
      expect(
        getVillageFunnelIndex({
          village: { _id: 'v1', slug: 'ithaca', onboardingStatus: status },
        }),
      ).toBe(4);
    });
  });

  it('lets a later fact settle the earlier steps', () => {
    // A page that only knows about the village must not draw "create your
    // account" as still pending behind it.
    expect(
      getVillageFunnelDoneFlags({
        village: { _id: 'v1', slug: 'ithaca', onboardingStatus: 'subscribed' },
      }),
    ).toEqual([true, true, true, true, false]);
  });

  it('never marks a done step after a pending one', () => {
    const flags = getVillageFunnelDoneFlags({
      hasApplication: false,
      isAuthenticated: true,
    });
    expect(flags.indexOf(false)).toBe(2);
    expect(flags.slice(2).every((done) => !done)).toBe(true);
  });

  it('marks exactly one step current', () => {
    const steps = getVillageFunnelSteps({ hasApplication: true });
    expect(steps.filter((step) => step.isCurrent)).toHaveLength(1);
    expect(steps.find((step) => step.isCurrent)?.step).toBe('account');
  });

  it('points a subscriber who has no village at the launcher', () => {
    expect(getVillageFunnelPrompt({ hasSubscription: true })).toEqual({
      step: 'village',
      index: 3,
      href: '/village/launch',
    });
  });
});
