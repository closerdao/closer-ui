import { isNearbyMembersEnabled } from '../nearbyMembers.helpers';

describe('isNearbyMembersEnabled', () => {
  it('defaults to enabled when the setting is missing', () => {
    expect(isNearbyMembersEnabled({ settings: { newsletter_weekly: true } })).toBe(
      true,
    );
    expect(isNearbyMembersEnabled(null)).toBe(true);
  });

  it('returns false only when explicitly disabled', () => {
    expect(
      isNearbyMembersEnabled({
        settings: { newsletter_weekly: true, nearby_members_enabled: false },
      }),
    ).toBe(false);
    expect(
      isNearbyMembersEnabled({
        settings: { newsletter_weekly: true, nearby_members_enabled: true },
      }),
    ).toBe(true);
  });
});
