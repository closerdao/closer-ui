jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
  formatSearch: (where: unknown) => encodeURIComponent(JSON.stringify(where)),
  cdn: '',
}));

import {
  clearApplicationAnswers,
  readApplicationAnswers,
  saveApplicationAnswers,
  storedApplicationToVillageInitial,
} from '../applicationAnswersStorage';

beforeEach(() => {
  localStorage.clear();
});

describe('application answers storage', () => {
  it('round-trips what the applicant typed', () => {
    saveApplicationAnswers({
      _id: 'app1',
      name: 'Ada',
      email: 'ada@example.com',
      fields: { 'Project name': 'Dream Factory' },
    });

    expect(readApplicationAnswers()).toEqual({
      _id: 'app1',
      name: 'Ada',
      email: 'ada@example.com',
      fields: { 'Project name': 'Dream Factory' },
    });

    clearApplicationAnswers();
    expect(readApplicationAnswers()).toBeNull();
  });

  it('reads corrupt storage as nothing saved', () => {
    localStorage.setItem('closer:application-answers', '{not json');
    expect(readApplicationAnswers()).toBeNull();
  });
});

describe('storedApplicationToVillageInitial', () => {
  it('opens the village form on the application answers', () => {
    const initial = storedApplicationToVillageInitial({
      _id: 'app1',
      name: 'Ada',
      email: 'ada@example.com',
      fields: {
        'Project name': 'Dream Factory',
        Description: 'A village in the making.',
        Country: 'Portugal',
        Website: 'https://dream.example.com',
      },
    });

    expect(initial).toMatchObject({
      applicationId: 'app1',
      name: 'Dream Factory',
      description: 'A village in the making.',
      country: 'Portugal',
      website: 'https://dream.example.com',
    });
    expect(initial.contact?.email).toBe('ada@example.com');
  });

  it('drops the application link when the API never returned an id', () => {
    const initial = storedApplicationToVillageInitial({
      name: 'Ada',
      fields: {},
    });
    expect(initial.applicationId).toBeUndefined();
    // The applicant's own name is still the fallback for the village name.
    expect(initial.name).toBe('Ada');
  });
});
