import { Village } from '../../types/village';
import {
  DeployVillageError,
  canDeployVillage,
  canManageVillageLifecycle,
  deployVillage,
  getDeployReadiness,
  getVillageAccessReason,
  isVillageSlugFrozen,
  reactivateVillage,
  resetVillageDeploy,
  resolveFounderEmail,
  retireVillage,
  suspendVillage,
  villageAdminSettableStatuses,
} from '../village.utils';

// jest.config maps the bare "../utils/api" specifier to test/__mocks__/api.js,
// which is a different module than the "./api" village.utils imports.
jest.mock('../api.js', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
  formatSearch: (where: unknown) => encodeURIComponent(JSON.stringify(where)),
  invalidateGetCache: jest.fn(),
}));

const api = jest.requireMock('../api.js').default as { post: jest.Mock };

const village = (overrides: Partial<Village> = {}): Village =>
  ({
    _id: 'v1',
    slug: 'riverbank',
    name: 'Riverbank',
    description: '',
    tags: [],
    country: 'Portugal',
    coords: [-8.6, 41.1],
    status: 'planning',
    ...overrides,
  } as Village);

const axiosError = (status: number, data: unknown) =>
  Object.assign(new Error(`Request failed with status code ${status}`), {
    response: { status, data },
  });

beforeEach(() => {
  api.post.mockReset();
});

describe('deployVillage', () => {
  it('posts to the singular /village/:id/deploy route', async () => {
    api.post.mockResolvedValue({ data: { results: village() } });

    await deployVillage('v1', 'ship it');

    expect(api.post).toHaveBeenCalledWith('/village/v1/deploy', {
      notes: 'ship it',
    });
  });

  it('returns the updated village on a clean 202', async () => {
    api.post.mockResolvedValue({
      data: { results: village({ onboardingStatus: 'deploy_requested' }) },
    });

    const result = await deployVillage('v1');

    expect(result.village?.onboardingStatus).toBe('deploy_requested');
    expect(result.warning).toBeUndefined();
  });

  it('keeps the warning when procurement did not answer', async () => {
    api.post.mockResolvedValue({
      data: {
        results: village({ onboardingStatus: 'deploy_requested' }),
        warning: 'procurement_unreachable',
      },
    });

    const result = await deployVillage('v1');

    expect(result.village?.onboardingStatus).toBe('deploy_requested');
    expect(result.warning).toBe('procurement_unreachable');
  });

  // The warning path can answer without a village. The old fallback chain
  // ended in the raw response body, so the page adopted an object with no
  // name or slug and rendered it as a village.
  it('returns no village when the response carries none', async () => {
    api.post.mockResolvedValue({
      data: { warning: 'procurement_unreachable' },
    });

    const result = await deployVillage('v1');

    expect(result.village).toBeUndefined();
    expect(result.warning).toBe('procurement_unreachable');
  });

  it('passes the procurement error text and code through verbatim', async () => {
    api.post.mockRejectedValue(
      axiosError(409, { error: 'Slug already taken', code: 'slug_taken' }),
    );

    await expect(deployVillage('v1')).rejects.toMatchObject({
      message: 'Slug already taken',
      status: 409,
      code: 'slug_taken',
    });
  });

  it('reads a nested {error: {message, code}} body too', async () => {
    api.post.mockRejectedValue(
      axiosError(422, {
        error: { message: 'No founder email', code: 'no_email' },
      }),
    );

    const error = await deployVillage('v1').catch((err) => err);

    expect(error).toBeInstanceOf(DeployVillageError);
    expect(error.message).toBe('No founder email');
    expect(error.code).toBe('no_email');
  });

  it('falls back to the thrown message when there is no response body', async () => {
    api.post.mockRejectedValue(new Error('Network Error'));

    await expect(deployVillage('v1')).rejects.toMatchObject({
      message: 'Network Error',
      status: 0,
    });
  });
});

describe('resetVillageDeploy', () => {
  it('posts to the singular /village/:id/reset-deploy route with no body', async () => {
    api.post.mockResolvedValue({
      data: { results: village({ onboardingStatus: 'subscribed' }) },
    });

    await resetVillageDeploy('v1');

    expect(api.post).toHaveBeenCalledWith('/village/v1/reset-deploy');
  });

  it('returns the reset village', async () => {
    api.post.mockResolvedValue({
      data: {
        results: village({
          onboardingStatus: 'subscribed',
          deployRequest: { status: 'none' },
          deployError: null,
        }),
      },
    });

    const result = await resetVillageDeploy('v1');

    expect(result.onboardingStatus).toBe('subscribed');
    expect(result.deployRequest?.status).toBe('none');
    expect(result.deployError).toBeNull();
  });

  it('passes a 409 reset_deploy_not_allowed through verbatim', async () => {
    api.post.mockRejectedValue(
      axiosError(409, {
        error: 'Village is managed by procurement.',
        code: 'reset_deploy_not_allowed',
      }),
    );

    await expect(resetVillageDeploy('v1')).rejects.toMatchObject({
      message: 'Village is managed by procurement.',
      status: 409,
      code: 'reset_deploy_not_allowed',
    });
  });

  it('passes a 403 through verbatim', async () => {
    api.post.mockRejectedValue(
      axiosError(403, { error: 'Must be admin to reset a village deploy.' }),
    );

    await expect(resetVillageDeploy('v1')).rejects.toMatchObject({
      message: 'Must be admin to reset a village deploy.',
      status: 403,
    });
  });
});

describe('canDeployVillage', () => {
  const managed = village({ managedBy: ['amb-1'], createdBy: 'founder-1' });

  it('lets admins and the team role in', () => {
    expect(canDeployVillage(managed, { _id: 'u', roles: ['admin'] })).toBe(
      true,
    );
    expect(canDeployVillage(managed, { _id: 'u', roles: ['team'] })).toBe(true);
  });

  it('lets the assigned ambassador of that village in', () => {
    expect(
      canDeployVillage(managed, { _id: 'amb-1', roles: ['ambassador'] }),
    ).toBe(true);
  });

  it('keeps an ambassador out of a village they are not assigned to', () => {
    expect(
      canDeployVillage(managed, { _id: 'amb-2', roles: ['ambassador'] }),
    ).toBe(false);
  });

  it('lets the founder in', () => {
    expect(
      canDeployVillage(managed, { _id: 'founder-1', roles: ['member'] }),
    ).toBe(true);
  });

  it('keeps an unrelated member out', () => {
    expect(
      canDeployVillage(managed, { _id: 'someone', roles: ['member'] }),
    ).toBe(false);
  });

  it('keeps anonymous visitors out', () => {
    expect(canDeployVillage(managed, null)).toBe(false);
    expect(canDeployVillage(null, { _id: 'u', roles: ['admin'] })).toBe(false);
  });
});

describe('getDeployReadiness', () => {
  it('blocks on a missing slug', () => {
    expect(getDeployReadiness(village({ slug: '' }))).toEqual({
      ready: false,
      missingSlug: true,
      missingEmail: true,
    });
  });

  // The route falls back to the creator's account email, which the client
  // cannot see — so a missing address is a warning, not a block.
  it('stays ready without a founder email', () => {
    const readiness = getDeployReadiness(village());
    expect(readiness.ready).toBe(true);
    expect(readiness.missingEmail).toBe(true);
  });

  it('is clean once an email is reachable', () => {
    expect(
      getDeployReadiness(village({ contact: { email: 'a@b.co' } })),
    ).toEqual({ ready: true, missingSlug: false, missingEmail: false });
  });
});

describe('resolveFounderEmail', () => {
  it('prefers the project manager over the public contact', () => {
    expect(
      resolveFounderEmail(
        village({
          projectManager: { email: 'pm@village.org' },
          contact: { email: 'hello@village.org' },
        }),
      ),
    ).toBe('pm@village.org');
  });

  it('falls back to the public contact', () => {
    expect(
      resolveFounderEmail(village({ contact: { email: 'hello@village.org' } })),
    ).toBe('hello@village.org');
  });

  it('returns null when there is nothing to send', () => {
    expect(
      resolveFounderEmail(village({ contact: { email: '  ' } })),
    ).toBeNull();
  });
});

describe('isVillageSlugFrozen', () => {
  it.each(['map_only', 'pre_assessed', 'intro_scheduled', 'subscribed'])(
    'leaves the slug editable at %s',
    (onboardingStatus) => {
      expect(
        isVillageSlugFrozen(village({ onboardingStatus } as Partial<Village>)),
      ).toBe(false);
    },
  );

  it.each(['deploy_requested', 'deploying', 'failed', 'live', 'suspended'])(
    'freezes the slug at %s',
    (onboardingStatus) => {
      expect(
        isVillageSlugFrozen(village({ onboardingStatus } as Partial<Village>)),
      ).toBe(true);
    },
  );

  it('freezes a managed village whatever its status', () => {
    expect(
      isVillageSlugFrozen(
        village({ onboardingStatus: 'subscribed', managed: true }),
      ),
    ).toBe(true);
  });
});

describe('villageAdminSettableStatuses', () => {
  it('lets an admin record an unmanaged village as live, failed or suspended', () => {
    const statuses = villageAdminSettableStatuses(
      village({ onboardingStatus: 'subscribed' }),
    );

    expect(statuses).toEqual(
      expect.arrayContaining(['failed', 'live', 'suspended']),
    );
  });

  it('withholds the deploy outcomes on a managed village', () => {
    const statuses = villageAdminSettableStatuses(
      village({ onboardingStatus: 'subscribed', managed: true }),
    );

    for (const status of ['failed', 'live', 'suspended']) {
      expect(statuses).not.toContain(status);
    }
    expect(statuses).toEqual([
      'map_only',
      'pre_assessed',
      'intro_scheduled',
      'subscribed',
    ]);
  });

  it('never offers the in-flight stages', () => {
    for (const managed of [true, false]) {
      // One `not.toContain` per status: `not.toEqual(arrayContaining([a, b]))`
      // passes as soon as ONE of them is missing, so it would let a regression
      // that still offers `deploying` through.
      const statuses = villageAdminSettableStatuses(village({ managed }));
      expect(statuses).not.toContain('deploy_requested');
      expect(statuses).not.toContain('deploying');
    }
  });

  it('treats a missing village as unmanaged', () => {
    expect(villageAdminSettableStatuses(undefined)).toContain('live');
  });
});

describe('getVillageAccessReason', () => {
  const village = {
    _id: 'v1',
    createdBy: 'founder',
    managedBy: ['amb-1'],
  } as Village;

  it('names the strongest reason first', () => {
    expect(
      getVillageAccessReason(village, { _id: 'founder', roles: ['admin'] }),
    ).toBe('admin');
    expect(
      getVillageAccessReason(village, { _id: 'amb-1', roles: ['team'] }),
    ).toBe('team');
  });

  it('tells an assigned ambassador apart from the creator', () => {
    expect(
      getVillageAccessReason(village, { _id: 'amb-1', roles: ['ambassador'] }),
    ).toBe('ambassador');
    expect(getVillageAccessReason(village, { _id: 'founder', roles: [] })).toBe(
      'creator',
    );
  });

  it('is null for public visitors and unassigned ambassadors', () => {
    expect(getVillageAccessReason(village, null)).toBeNull();
    expect(
      getVillageAccessReason(village, { _id: 'amb-2', roles: ['ambassador'] }),
    ).toBeNull();
    expect(
      getVillageAccessReason(null, { _id: 'founder', roles: [] }),
    ).toBeNull();
  });
});

describe('canManageVillageLifecycle', () => {
  it('allows admin and team, and nobody else', () => {
    expect(canManageVillageLifecycle({ roles: ['admin'] })).toBe(true);
    expect(canManageVillageLifecycle({ roles: ['team'] })).toBe(true);
    expect(canManageVillageLifecycle({ roles: ['ambassador'] })).toBe(false);
    expect(canManageVillageLifecycle({ roles: [] })).toBe(false);
    expect(canManageVillageLifecycle(null)).toBe(false);
    expect(canManageVillageLifecycle(undefined)).toBe(false);
  });
});

describe('villageAdminSettableStatuses — retired', () => {
  it('never offers retired, managed or not', () => {
    for (const managed of [true, false]) {
      expect(villageAdminSettableStatuses(village({ managed }))).not.toContain(
        'retired',
      );
    }
  });
});

describe('village lifecycle actions', () => {
  it('suspend posts to /village/:id/suspend with no body', async () => {
    api.post.mockResolvedValue({
      data: { results: village({ onboardingStatus: 'live' }) },
    });

    const result = await suspendVillage('v1');

    expect(api.post).toHaveBeenCalledWith('/village/v1/suspend', {});
    expect(result.village?.onboardingStatus).toBe('live');
  });

  it('reactivate posts to /village/:id/reactivate with no body', async () => {
    api.post.mockResolvedValue({
      data: { results: village({ onboardingStatus: 'suspended' }) },
    });

    await reactivateVillage('v1');

    expect(api.post).toHaveBeenCalledWith('/village/v1/reactivate', {});
  });

  it('retire posts to /village/:id/retire with the confirmSlug body', async () => {
    api.post.mockResolvedValue({
      data: { results: village({ onboardingStatus: 'live' }) },
    });

    await retireVillage('v1', 'riverbank');

    expect(api.post).toHaveBeenCalledWith('/village/v1/retire', {
      confirmSlug: 'riverbank',
    });
  });

  it('returns a warning without a village on an unconfirmed 202', async () => {
    api.post.mockResolvedValue({
      data: {
        results: village({ onboardingStatus: 'live' }),
        warning: 'Procurement could not be reached.',
      },
    });

    const result = await suspendVillage('v1');

    expect(result.warning).toBe('Procurement could not be reached.');
  });

  it('surfaces a 4xx from procurement verbatim', async () => {
    api.post.mockRejectedValue(
      axiosError(400, {
        error:
          'confirmSlug must equal the village slug (\'riverbank\') to retire.',
        code: 'confirm_slug_mismatch',
      }),
    );

    await expect(retireVillage('v1', 'wrong')).rejects.toMatchObject({
      message:
        'confirmSlug must equal the village slug (\'riverbank\') to retire.',
      status: 400,
      code: 'confirm_slug_mismatch',
    });
  });

  it('surfaces a 409 for an unmanaged village', async () => {
    api.post.mockRejectedValue(
      axiosError(409, {
        error: 'Village is not procurement-managed.',
        code: 'not_procurement_managed',
      }),
    );

    await expect(suspendVillage('v1')).rejects.toMatchObject({
      status: 409,
      code: 'not_procurement_managed',
    });
  });
});
