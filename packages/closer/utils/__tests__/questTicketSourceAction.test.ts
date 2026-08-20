import type { QuestTicketSource } from '../../types/quest';
import { getTicketSourceAction } from '../quests.helpers';

const source = (over: Partial<QuestTicketSource> = {}): QuestTicketSource => ({
  key: 's',
  label: 'A source',
  ticketsPerUnit: 1,
  maxTickets: 1,
  verification: 'automatic',
  ...over,
});

describe('getTicketSourceAction', () => {
  test('points a booking source at the event it filters on', () => {
    const action = getTicketSourceAction(
      source({
        trigger: { event: 'booking.confirmed', filter: { eventId: 'e1' } },
      }),
      { eventsById: { e1: { slug: 'citizen-gathering', name: 'Citizen Gathering' } } },
    );
    expect(action).toEqual({
      href: '/events/citizen-gathering',
      labelKey: 'quests_entry_cta_event',
      values: { name: 'Citizen Gathering' },
    });
  });

  test('falls back to the events list when the event has not resolved', () => {
    const action = getTicketSourceAction(
      source({
        trigger: { event: 'booking.confirmed', filter: { eventId: 'e1' } },
      }),
    );
    expect(action?.href).toBe('/events');
  });

  test('points a token source at the token page, named after the token', () => {
    const action = getTicketSourceAction(
      source({
        trigger: { event: 'token.purchased', filter: { token: 'TDF' } },
      }),
    );
    expect(action).toEqual({
      href: '/token',
      labelKey: 'quests_entry_cta_token',
      values: { token: 'TDF' },
    });
  });

  test('falls back to the platform token when the filter does not name one', () => {
    const action = getTicketSourceAction(
      source({ trigger: { event: 'token.purchased' } }),
      { bookingToken: 'TDF' },
    );
    expect(action?.values).toEqual({ token: 'TDF' });
  });

  test('points a stay source at the booking flow', () => {
    const action = getTicketSourceAction(
      source({ trigger: { event: 'stay.completed' } }),
    );
    expect(action?.href).toBe('/stay');
  });

  test('offers nothing for a source reviewed by hand', () => {
    expect(
      getTicketSourceAction(
        source({
          verification: 'admin',
          trigger: { event: 'stay.completed' },
        }),
      ),
    ).toBeNull();
  });

  test('offers nothing for a source with no trigger at all', () => {
    expect(getTicketSourceAction(source())).toBeNull();
  });
});

describe('publishQuest', () => {
  const updateQuest = jest.fn();

  beforeEach(() => {
    jest.resetModules();
    updateQuest.mockReset().mockResolvedValue({ status: 'live' });
  });

  const loadPublishQuest = async () => {
    jest.doMock('../api', () => ({
      __esModule: true,
      default: {
        get: jest.fn(),
        post: jest.fn(),
        patch: jest.fn((_url: string, body: { status: string }) =>
          updateQuest(_url, body).then(() => ({
            data: { results: { status: body.status } },
          })),
        ),
      },
      formatSearch: (w: unknown) => JSON.stringify(w),
      cdn: '',
      invalidateGetCache: jest.fn(),
    }));
    return (await import('../quests.api')).publishQuest;
  };

  test('walks a draft through scheduled on its way to live', async () => {
    const publishQuest = await loadPublishQuest();
    await publishQuest('citizen-raffle', 'draft');

    expect(updateQuest.mock.calls.map(([, body]) => body.status)).toEqual([
      'scheduled',
      'live',
    ]);
  });

  test('takes a scheduled quest straight to live', async () => {
    const publishQuest = await loadPublishQuest();
    await publishQuest('citizen-raffle', 'scheduled');

    expect(updateQuest.mock.calls.map(([, body]) => body.status)).toEqual([
      'live',
    ]);
  });

  test('does nothing for a quest that is already live', async () => {
    const publishQuest = await loadPublishQuest();
    await publishQuest('citizen-raffle', 'live');

    expect(updateQuest).not.toHaveBeenCalled();
  });

  test('does nothing for a locked quest', async () => {
    const publishQuest = await loadPublishQuest();
    await publishQuest('citizen-raffle', 'locked');

    expect(updateQuest).not.toHaveBeenCalled();
  });
});
