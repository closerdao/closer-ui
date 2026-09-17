import { User } from '../contexts/auth/types';

/** Near you is on unless the user has explicitly turned it off in Settings. */
export const isNearbyMembersEnabled = (
  user?: Pick<User, 'settings'> | null,
): boolean => user?.settings?.nearby_members_enabled !== false;
