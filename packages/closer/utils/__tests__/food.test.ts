import api from '../api';
import { fetchFoodOptions, foodEditModelBackend } from '../food';
import { isTrpcEnabled, trpc } from '../trpc';

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(),
  trpc: {
    food: {
      list: { query: jest.fn() },
      get: { query: jest.fn() },
      create: { mutate: jest.fn() },
      update: { mutate: jest.fn() },
      remove: { mutate: jest.fn() },
    },
  },
}));

const mockedApi = api as unknown as { get: jest.Mock };
const mockedEnabled = isTrpcEnabled as jest.Mock;
const food = trpc.food as unknown as {
  list: { query: jest.Mock };
  get: { query: jest.Mock };
  create: { mutate: jest.Mock };
  update: { mutate: jest.Mock };
  remove: { mutate: jest.Mock };
};

const basic = { _id: 'f1', name: 'Basic', price: 12 };

beforeEach(() => {
  jest.clearAllMocks();
});

describe('fetchFoodOptions on the legacy API', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(false));

  it('makes the GET /food call it replaced and returns its results', async () => {
    mockedApi.get.mockResolvedValue({ data: { results: [basic] } });

    await expect(fetchFoodOptions()).resolves.toEqual([basic]);
    expect(mockedApi.get).toHaveBeenCalledWith('/food', { params: undefined });
    expect(food.list.query).not.toHaveBeenCalled();
  });

  it('passes the limit as a query param', async () => {
    mockedApi.get.mockResolvedValue({ data: { results: [] } });

    await fetchFoodOptions({ limit: 1 });

    expect(mockedApi.get).toHaveBeenCalledWith('/food', {
      params: { limit: 1 },
    });
  });

  it('rejects when the request fails, so callers keep their fallbacks', async () => {
    mockedApi.get.mockRejectedValue(new Error('boom'));

    await expect(fetchFoodOptions()).rejects.toThrow('boom');
  });
});

describe('fetchFoodOptions on tRPC', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(true));

  it('returns food.list in the legacy results shape', async () => {
    food.list.query.mockResolvedValue([basic, {}]);

    await expect(fetchFoodOptions({ limit: 1 })).resolves.toEqual([basic, {}]);
    expect(food.list.query).toHaveBeenCalledWith({ limit: 1 });
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('rejects when the request fails', async () => {
    food.list.query.mockRejectedValue(new Error('boom'));

    await expect(fetchFoodOptions()).rejects.toThrow('boom');
  });
});

describe('foodEditModelBackend', () => {
  it('is empty on the legacy API, leaving EditModel on axios', () => {
    mockedEnabled.mockReturnValue(false);

    expect(foodEditModelBackend()).toEqual({});
  });

  describe('on tRPC', () => {
    beforeEach(() => mockedEnabled.mockReturnValue(true));

    it('loads by id or slug', async () => {
      food.get.query.mockResolvedValue(basic);

      await expect(foodEditModelBackend().load!('f1')).resolves.toBe(basic);
      expect(food.get.query).toHaveBeenCalledWith({ idOrSlug: 'f1' });
    });

    it('creates without an id and updates with one', async () => {
      food.create.mutate.mockResolvedValue(basic);
      food.update.mutate.mockResolvedValue(basic);
      const { save } = foodEditModelBackend();

      await save!({ name: 'Basic' });
      await save!({ name: 'Basic' }, 'f1');

      expect(food.create.mutate).toHaveBeenCalledWith({ name: 'Basic' });
      expect(food.update.mutate).toHaveBeenCalledWith({
        idOrSlug: 'f1',
        data: { name: 'Basic' },
      });
    });

    it('removes by id', async () => {
      food.remove.mutate.mockResolvedValue({ deleted: false });

      await expect(foodEditModelBackend().remove!('f1')).resolves.toBe(
        undefined,
      );
      expect(food.remove.mutate).toHaveBeenCalledWith({ id: 'f1' });
    });

    it('rejects with the error EditModel already knows how to show', async () => {
      food.create.mutate.mockRejectedValue(new Error('Duplicate entry.'));

      await expect(foodEditModelBackend().save!({})).rejects.toThrow(
        'Duplicate entry.',
      );
    });
  });
});
