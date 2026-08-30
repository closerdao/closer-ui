import { User } from '../contexts/auth/types';

type UserSettings = User['settings'];

/**
 * `PATCH /user/:id` replaces `settings` wholesale — it does not deep merge.
 * Sending `{ settings: { homes } }` therefore wipes `newsletter_weekly`, the
 * push subscription and every other key the member had set.
 *
 * Build every settings payload through this helper so a patch only ever adds
 * or overwrites the keys it names. `user` is the caller's own authenticated
 * user (never the profile being viewed) — it is the only settings snapshot we
 * are allowed to write back.
 */
export const mergeUserSettings = (
  user: { settings?: Partial<UserSettings> } | null | undefined,
  changes: Record<string, unknown>,
): Record<string, unknown> => ({
  ...(user?.settings || {}),
  ...changes,
});
