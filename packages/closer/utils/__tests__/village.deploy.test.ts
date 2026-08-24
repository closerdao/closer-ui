import { Village } from '../../types/village';
import {
  DeployVillageError,
  canDeployVillage,
  deployVillage,
  getDeployReadiness,
  isVillageSlugFrozen,
  resolveFounderEmail,
} from '../village.utils';

// jest.config maps the bare "../utils/api" specifier to test/__mocks__/api.js,
// which is a different module than the "./api" village.utils imports.
jest.mock('../api.js', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
  formatSearch: (where: unknown) => encodeURIComponent(JSON.stringify(where)),
}));

const api = jest.requireMock('../api.js').default as { post: jest.Mock };

const village = (overrides: Partial<Village> = {}): Village =>
  ({
    _id: 'v1',
    slug: 'riverbank',
    name: 'Riverbank',
    closer: false,
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

    expect(result.village.onboardingStatus).toBe('deploy_requested');
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

    expect(result.village.onboardingStatus).toBe('deploy_requested');
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

  // The API answers a founder with a 403 until the subscription gate lands.
  it('keeps the founder out', () => {
    expect(
      canDeployVillage(managed, { _id: 'founder-1', roles: ['member'] }),
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
