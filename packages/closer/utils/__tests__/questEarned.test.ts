import type { Quest, QuestMe } from '../../types/quest';
import {
  getEarnedFromActions,
  getQuestActionCta,
  getVerifiedActionCount,
  isQuestActionCounted,
} from '../quests.helpers';

const quest = (over: Partial<Quest> = {}): Quest =>
  ({
    _id: 'q1',
    title: 'Tell the village story',
    slug: 'village-story',
    type: 'singleAction',
    status: 'live',
    start: '2026-09-01T00:00:00.000Z',
    end: '2026-09-08T00:00:00.000Z',
    actionConfig: { actionLabel: 'Publish', proofType: 'url', pointsPerAction: 10 },
    prize: { eachAction: { kind: 'currency', cur: 'carrots', val: 5 } },
    ...over,
  } as Quest);

const me = (entry: Partial<NonNullable<QuestMe['entry']>> | null): QuestMe =>
  ({ entry: entry as any } as QuestMe);

describe('getEarnedFromActions', () => {
  test('totals the per-action award against verified actions', () => {
    expect(
      getEarnedFromActions(quest(), me({ status: 'active', actionCount: 3 })),
    ).toEqual({ amount: 15, cur: 'carrots' });
  });

  test('falls back to deriving the count from points', () => {
    expect(
      getEarnedFromActions(quest(), me({ status: 'active', points: 30 })),
    ).toEqual({ amount: 15, cur: 'carrots' });
  });

  test('has nothing to total when the award is a perk', () => {
    expect(
      getEarnedFromActions(
        quest({ prize: { eachAction: { kind: 'perk', title: 'A hug' } } }),
        me({ status: 'active', actionCount: 3 }),
      ),
    ).toBeNull();
  });

  test('has nothing to total without a per-action award', () => {
    expect(
      getEarnedFromActions(
        quest({ prize: { ranked: { '1': { kind: 'currency', cur: 'TDF', val: 5 } } } }),
        me({ status: 'active', actionCount: 3 }),
      ),
    ).toBeNull();
  });

  test('has nothing to total before there is an entry', () => {
    expect(getEarnedFromActions(quest(), null)).toBeNull();
  });
});

describe('getVerifiedActionCount', () => {
  test('prefers the count the API reports', () => {
    expect(
      getVerifiedActionCount(
        quest(),
        me({ status: 'active', actionCount: 2, points: 90 }),
      ),
    ).toBe(2);
  });

  test('rounds down a partial point total rather than inventing an action', () => {
    expect(
      getVerifiedActionCount(quest(), me({ status: 'active', points: 25 })),
    ).toBe(2);
  });

  test('gives up when points cannot be converted', () => {
    expect(
      getVerifiedActionCount(
        quest({ actionConfig: { actionLabel: 'x', proofType: 'url' } }),
        me({ status: 'active', points: 25 }),
      ),
    ).toBeNull();
  });
});

describe('counted singleAction quests', () => {
  const counted = (event: string, filter: Record<string, unknown> = {}) =>
    quest({
      actionConfig: {
        actionLabel: 'Buy a token',
        proofType: 'automatic',
        trigger: { event, filter },
      },
    } as Partial<Quest>);

  test('knows when the backend counts the actions', () => {
    expect(isQuestActionCounted(counted('token.purchased'))).toBe(true);
  });

  test('a custom trigger is still submitted by hand', () => {
    expect(isQuestActionCounted(counted('custom'))).toBe(false);
  });

  test('a quest with no trigger at all keeps the old submitted behaviour', () => {
    expect(isQuestActionCounted(quest())).toBe(false);
  });

  test('a raffle is never a counted action quest', () => {
    expect(
      isQuestActionCounted(quest({ type: 'raffle' } as Partial<Quest>)),
    ).toBe(false);
  });

  test('sends a member to the token page to buy one', () => {
    expect(
      getQuestActionCta(counted('token.purchased', { token: 'TDF' })),
    ).toEqual({
      href: '/token',
      labelKey: 'quests_entry_cta_token',
      values: { token: 'TDF' },
    });
  });

  test('sends a member to the event they have to book', () => {
    expect(
      getQuestActionCta(counted('booking.confirmed', { eventId: 'e1' }), {
        eventsById: { e1: { slug: 'gathering', name: 'the Gathering' } },
      })?.href,
    ).toBe('/events/gathering');
  });

  test('offers nowhere to go for a custom trigger', () => {
    expect(getQuestActionCta(counted('custom'))).toBeNull();
  });
});
