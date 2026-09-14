import { User } from '../../contexts/auth/types';
import { mergeUserSettings } from '../userSettings.helpers';

const userWith = (settings: Partial<User['settings']>) =>
  ({ settings } as unknown as User);

describe('mergeUserSettings', () => {
  it('keeps settings the patch does not name', () => {
    const user = userWith({
      newsletter_weekly: true,
      push_notifications_enabled: true,
      token_onboarding_progress: { completed: ['intro'] },
    });

    expect(mergeUserSettings(user, { homes: [] })).toEqual({
      newsletter_weekly: true,
      push_notifications_enabled: true,
      token_onboarding_progress: { completed: ['intro'] },
      homes: [],
    });
  });

  it('overwrites the keys it does name', () => {
    const user = userWith({ newsletter_weekly: true });

    expect(mergeUserSettings(user, { newsletter_weekly: false })).toEqual({
      newsletter_weekly: false,
    });
  });

  it('tolerates a user with no settings yet', () => {
    expect(mergeUserSettings(null, { newsletter_weekly: true })).toEqual({
      newsletter_weekly: true,
    });
    expect(mergeUserSettings({}, { newsletter_weekly: true })).toEqual({
      newsletter_weekly: true,
    });
  });
});
