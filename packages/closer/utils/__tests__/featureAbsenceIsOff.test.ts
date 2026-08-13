/**
 * #950 — a feature with no config is off, uniformly.
 *
 * Absence of a config bucket (or of its `enabled` key) must never count as
 * enabled: not in the member menu, not in the page editor, not in the
 * enabled-configs listing used by the operator dashboard.
 */
import { getPageEditorFeatureFlags } from '../../components/PageEditor/featureFlags';
import { getEnabledConfigs } from '../config.utils';
import { deriveMemberMenuFeatureFlags } from '../memberMenuFeatureFlags';

describe('deriveMemberMenuFeatureFlags — events', () => {
  const loaded = { _configLoaded: true };

  it('is off when the events config is absent', () => {
    expect(deriveMemberMenuFeatureFlags({ ...loaded }).isEventsEnabled).toBe(
      false,
    );
  });

  it('is off when events config exists but enabled is not set', () => {
    expect(
      deriveMemberMenuFeatureFlags({ ...loaded, events: {} }).isEventsEnabled,
    ).toBe(false);
  });

  it('is on only when explicitly enabled', () => {
    expect(
      deriveMemberMenuFeatureFlags({ ...loaded, events: { enabled: true } })
        .isEventsEnabled,
    ).toBe(true);
    expect(
      deriveMemberMenuFeatureFlags({ ...loaded, events: { enabled: false } })
        .isEventsEnabled,
    ).toBe(false);
  });
});

describe('getPageEditorFeatureFlags — events', () => {
  it('is off when the events config is absent', () => {
    expect(getPageEditorFeatureFlags({}).events).toBe(false);
    expect(getPageEditorFeatureFlags(null).events).toBe(false);
  });

  it('is on only when explicitly enabled', () => {
    expect(getPageEditorFeatureFlags({ events: { enabled: true } }).events).toBe(
      true,
    );
    expect(
      getPageEditorFeatureFlags({ events: { enabled: false } }).events,
    ).toBe(false);
  });
});

describe('getEnabledConfigs — schema-less buckets', () => {
  it('does not count a bucket with no schema entry as enabled', () => {
    expect(getEnabledConfigs([], ['emails', 'rbac'])).toEqual([]);
  });

  it('still honours an explicit enabled row for a schema-less bucket', () => {
    expect(
      getEnabledConfigs(
        [{ slug: 'emails', value: { enabled: true } }],
        ['emails'],
      ),
    ).toEqual(['emails']);
  });

  it('keeps schema defaults working for described configs', () => {
    // `events` declares enabled.default: true in configDescription, so an
    // undefined row still counts as enabled; `volunteering` defaults false.
    expect(getEnabledConfigs([], ['events', 'volunteering'])).toEqual([
      'events',
    ]);
  });
});
