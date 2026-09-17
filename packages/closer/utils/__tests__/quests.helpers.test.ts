import { withTicketSourceKeys } from '../quests.helpers';

describe('withTicketSourceKeys', () => {
  test('mints a key from the label so admins never type one', () => {
    const [source] = withTicketSourceKeys([
      { label: '$TDF bought during the quest' },
    ]);
    expect(source.key).toBe('tdf_bought_during_the_quest');
  });

  test('keeps the key an existing source already carries', () => {
    const [source] = withTicketSourceKeys([
      { key: 'token_purchase', label: 'Renamed after launch' },
    ]);
    expect(source.key).toBe('token_purchase');
  });

  test('keeps generated keys unique when two labels collide', () => {
    const sources = withTicketSourceKeys([
      { label: 'Stayed the full event' },
      { label: 'Stayed the full event' },
      { label: 'Stayed the full event' },
    ]);
    expect(sources.map((source) => source.key)).toEqual([
      'stayed_the_full_event',
      'stayed_the_full_event_2',
      'stayed_the_full_event_3',
    ]);
  });

  test('does not collide with a key an existing source already holds', () => {
    const sources = withTicketSourceKeys([
      { key: 'gathering_ticket', label: 'Gathering ticket' },
      { label: 'Gathering ticket' },
    ]);
    expect(sources[1].key).toBe('gathering_ticket_2');
  });

  test('falls back to a usable key when the label has no letters', () => {
    const [source] = withTicketSourceKeys([{ label: '🎟️ !!!' }]);
    expect(source.key).toBe('source');
  });
});
