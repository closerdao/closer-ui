import api from '../api';
import {
  applicationToVillage,
  fetchVillagesByApplicationIds,
  getApplicationLinkHrefs,
} from '../villageApplication.utils';

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
  formatSearch: (where: unknown) => encodeURIComponent(JSON.stringify(where)),
}));

const mockGet = api.get as jest.Mock;

describe('applicationToVillage', () => {
  it('prefills the listing from the free-form answers', () => {
    expect(
      applicationToVillage({
        _id: 'app-1',
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        phone: '+351000000',
        fields: {
          projectName: 'Riverbank',
          about: 'A regenerative village on the Douro.',
          country: 'Portugal',
          website: 'https://riverbank.pt',
          tags: 'permaculture, education',
          instagram: '@riverbank',
        },
      }),
    ).toEqual({
      applicationId: 'app-1',
      name: 'Riverbank',
      description: 'A regenerative village on the Douro.',
      country: 'Portugal',
      website: 'https://riverbank.pt',
      tags: ['permaculture', 'education'],
      contact: {
        email: 'ada@example.com',
        phone: '+351000000',
        social: {
          instagram: '@riverbank',
          twitter: undefined,
          facebook: undefined,
        },
      },
    });
  });

  it('falls back to the applicant name when no project name was asked for', () => {
    const village = applicationToVillage({
      _id: 'app-2',
      name: 'Grace Hopper',
      fields: { dream: 'A house by the river' },
    });

    expect(village.name).toBe('Grace Hopper');
    expect(village.description).toBe('A house by the river');
    // Nothing is invented for questions the platform never asked.
    expect(village.country).toBeUndefined();
    expect(village.website).toBeUndefined();
  });

  it('reads a "website or deck" link onto the village website', () => {
    expect(
      applicationToVillage({
        _id: 'app-3',
        fields: {
          'Link to your website or deck': 'https://pitch.com/riverbank',
        },
      }).website,
    ).toBe('https://pitch.com/riverbank');
    expect(
      applicationToVillage({ _id: 'app-4', fields: { deck: 'https://d.eck' } })
        .website,
    ).toBe('https://d.eck');
  });

  it('carries coordinates over in API (GeoJSON) order when the form collected them', () => {
    const village = applicationToVillage({
      _id: 'app-3',
      fields: { latitude: '38.72', longitude: '-9.14' },
    });

    expect(village.coords).toEqual([-9.14, 38.72]);
  });

  it('ignores coordinates that are out of range or unparseable', () => {
    expect(
      applicationToVillage({
        _id: 'app-4',
        fields: { lat: '120', lng: '10' },
      }).coords,
    ).toBeUndefined();
    expect(
      applicationToVillage({
        _id: 'app-5',
        fields: { lat: 'somewhere warm', lng: 'by the sea' },
      }).coords,
    ).toBeUndefined();
  });

  it('always links the village back to the application', () => {
    expect(applicationToVillage({ _id: 'app-6' }).applicationId).toBe('app-6');
  });
});

describe('fetchVillagesByApplicationIds', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it('looks the whole page up in one request and keys by application', async () => {
    mockGet.mockResolvedValue({
      data: {
        results: [
          { _id: 'v1', slug: 'riverbank', applicationId: 'app-1' },
          { _id: 'v2', applicationId: 'app-2' },
        ],
      },
    });

    const byApplication = await fetchVillagesByApplicationIds([
      'app-1',
      'app-2',
    ]);

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet.mock.calls[0][0]).toBe(
      `/village?where=${encodeURIComponent(
        JSON.stringify({ applicationId: { $in: ['app-1', 'app-2'] } }),
      )}`,
    );
    expect(byApplication['app-1'].slug).toBe('riverbank');
    expect(byApplication['app-2']._id).toBe('v2');
  });

  it('does not call the API for an empty page', async () => {
    expect(await fetchVillagesByApplicationIds([])).toEqual({});
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('returns nothing rather than throwing when the lookup fails', async () => {
    mockGet.mockRejectedValue(new Error('offline'));

    expect(await fetchVillagesByApplicationIds(['app-1'])).toEqual({});
  });
});

describe('getApplicationLinkHrefs', () => {
  it('prefers slugs and opens the lead board on the linked lead', () => {
    expect(
      getApplicationLinkHrefs({
        links: {
          lead: 'lead-1',
          village: 'v1',
          villageSlug: 'riverbank',
          user: 'user-9',
          userSlug: 'ada',
        },
      }),
    ).toEqual({
      village: '/villages/riverbank',
      lead: '/dashboard/leads/all?lead=lead-1',
      user: '/members/ada',
    });
  });

  it('falls back to ids when the sync carried no slug', () => {
    expect(
      getApplicationLinkHrefs({ links: { village: 'v1', user: 'user-9' } }),
    ).toEqual({ village: '/villages/v1', user: '/members/user-9' });
  });

  it('yields nothing for an application the sync has not linked', () => {
    expect(getApplicationLinkHrefs({})).toEqual({});
    expect(getApplicationLinkHrefs({ links: {} })).toEqual({});
    expect(getApplicationLinkHrefs({ links: { lead: '  ' } })).toEqual({});
  });
});
