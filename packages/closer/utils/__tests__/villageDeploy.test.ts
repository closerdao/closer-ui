jest.mock('../api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: { results: [] } })),
    patch: jest.fn(() => Promise.resolve({ data: {} })),
  },
  formatSearch: (where: unknown) => encodeURIComponent(JSON.stringify(where)),
  cdn: '',
}));

import api from '../api';
import {
  deployVillageToCloser,
  fetchVillageCreatedBy,
  isValidVillageSubdomain,
  isVillageSubdomainTaken,
  normalizeVillageSubdomain,
  suggestVillageSubdomain,
} from '../village.utils';
import { Village } from '../../types/village';

const mockedGet = api.get as jest.Mock;
const mockedPatch = api.patch as jest.Mock;

beforeEach(() => {
  mockedGet.mockReset();
  mockedGet.mockResolvedValue({ data: { results: [] } });
  mockedPatch.mockReset();
  mockedPatch.mockResolvedValue({ data: {} });
});

describe('normalizeVillageSubdomain', () => {
  it('turns a village name into a hostname-safe slug', () => {
    expect(normalizeVillageSubdomain('Traditional Dream Factory')).toBe(
      'traditional-dream-factory',
    );
  });

  it('strips characters a hostname rejects and collapses hyphens', () => {
    expect(normalizeVillageSubdomain('  Aldeia -- do Sul!  ')).toBe(
      'aldeia-do-sul',
    );
  });

  it('caps the length without leaving a dangling hyphen', () => {
    const normalized = normalizeVillageSubdomain(
      'a-very-long-village-name-that-keeps-going-and-going',
    );
    expect(normalized.length).toBeLessThanOrEqual(30);
    expect(normalized.endsWith('-')).toBe(false);
  });
});

describe('isValidVillageSubdomain', () => {
  it.each(['tdf', 'my-village', 'a1b'])('accepts %s', (value) => {
    expect(isValidVillageSubdomain(value)).toBe(true);
  });

  it.each(['ab', '-abc', 'abc-', 'UPPER', 'my village', 'www', 'api', ''])(
    'rejects %s',
    (value) => {
      expect(isValidVillageSubdomain(value)).toBe(false);
    },
  );
});

describe('suggestVillageSubdomain', () => {
  it('prefers the existing slug over the name', () => {
    expect(
      suggestVillageSubdomain({ slug: 'tdf', name: 'Dream Factory' } as Village),
    ).toBe('tdf');
    expect(suggestVillageSubdomain({ name: 'Dream Factory' } as Village)).toBe(
      'dream-factory',
    );
  });
});

describe('isVillageSubdomainTaken', () => {
  it('is taken when another village answers to the slug', async () => {
    mockedGet.mockResolvedValueOnce({ data: { results: [{ _id: 'other' }] } });
    await expect(isVillageSubdomainTaken('tdf', 'mine')).resolves.toBe(true);
    // The village being deployed must not count as its own conflict.
    const [url] = mockedGet.mock.calls[0];
    expect(decodeURIComponent(url)).toContain('"$ne":"mine"');
  });

  it('reads as free when the directory cannot be reached', async () => {
    mockedGet.mockRejectedValueOnce(new Error('offline'));
    await expect(isVillageSubdomainTaken('tdf')).resolves.toBe(false);
  });
});

describe('deployVillageToCloser', () => {
  it('files the deploy request under the chosen address', async () => {
    mockedPatch.mockResolvedValueOnce({
      data: { results: { _id: 'v1', slug: 'tdf' } },
    });

    const result = await deployVillageToCloser('v1', 'tdf');

    expect(mockedPatch).toHaveBeenCalledWith(
      '/village/v1',
      expect.objectContaining({
        slug: 'tdf',
        appUrl: 'https://tdf.closer.earth',
        onboardingStatus: 'deploy_requested',
        deployRequest: expect.objectContaining({ status: 'requested' }),
      }),
    );
    expect(result).toEqual({ _id: 'v1', slug: 'tdf' });
  });
});

describe('fetchVillageCreatedBy', () => {
  it('returns the first village the user created, or null', async () => {
    mockedGet.mockResolvedValueOnce({ data: { results: [{ _id: 'v1' }] } });
    await expect(fetchVillageCreatedBy('u1')).resolves.toEqual({ _id: 'v1' });

    mockedGet.mockResolvedValueOnce({ data: { results: [] } });
    await expect(fetchVillageCreatedBy('u1')).resolves.toBeNull();
  });

  it('is null without a user id, without touching the API', async () => {
    await expect(fetchVillageCreatedBy(undefined)).resolves.toBeNull();
    expect(mockedGet).not.toHaveBeenCalled();
  });
});
