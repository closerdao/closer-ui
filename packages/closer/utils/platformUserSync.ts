import type { User } from '../contexts/auth/types';

const PATCH_SUCCESS = 'PATCH_SUCCESS';

type PlatformPatchAction =
  | {
      type: string;
      results: { toJS: () => User };
    }
  | undefined;

export async function patchUserAndSyncAuthStore(options: {
  platform: {
    user: {
      patch: (id: string, data: Record<string, unknown>) => Promise<unknown>;
      getOne: (
        id: string,
        opts?: { force?: boolean },
      ) => Promise<unknown>;
      findOne: (id: string) => { toJS?: () => User } | undefined;
    };
  };
  userId: string;
  patchBody: Record<string, unknown>;
  setUser: (user: User | null) => void;
  refetchUser: () => Promise<void>;
}): Promise<void> {
  const { platform, userId, patchBody, setUser, refetchUser } = options;
  const action = (await platform.user.patch(
    userId,
    patchBody,
  )) as PlatformPatchAction;

  if (!action || action.type !== PATCH_SUCCESS || !action.results) {
    throw new Error('User update failed');
  }

  const fromPatch = action.results.toJS() as User;
  const stored = platform.user.findOne(userId);
  const fromStore = stored?.toJS?.() as User | undefined;
  const freshUser = fromPatch ?? fromStore;

  if (freshUser) {
    setUser(freshUser);
    return;
  }

  await refetchUser();
}
