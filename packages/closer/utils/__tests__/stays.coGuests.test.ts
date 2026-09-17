import api from '../api';
import { addStayGuest, removeStayGuest, updateStayGuests } from '../stays.api';

jest.mock('../api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockedApi = api as unknown as {
  post: jest.Mock;
  delete: jest.Mock;
};

describe('stay co-guest endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('adds a co-guest by user id', async () => {
    mockedApi.post.mockResolvedValue({
      data: { results: { _id: 'stay_1', guests: ['user_2'] } },
    });

    const stay = await addStayGuest('stay_1', 'user_2');

    expect(mockedApi.post).toHaveBeenCalledWith('/stays/stay_1/guests', {
      userId: 'user_2',
    });
    expect(stay.guests).toEqual(['user_2']);
  });

  it('sends the user id in the body of the delete, not the path', async () => {
    mockedApi.delete.mockResolvedValue({
      data: { results: { _id: 'stay_1', guests: [] } },
    });

    await removeStayGuest('stay_1', 'user_2');

    expect(mockedApi.delete).toHaveBeenCalledWith('/stays/stay_1/guests', {
      data: { userId: 'user_2' },
    });
  });

  it('unwraps a booking-wrapped response', async () => {
    mockedApi.post.mockResolvedValue({
      data: { results: { booking: { _id: 'stay_1', guests: ['user_2'] } } },
    });

    const stay = await addStayGuest('stay_1', 'user_2');

    expect(stay._id).toBe('stay_1');
    expect(stay.guests).toEqual(['user_2']);
  });

  it('keeps head-count updates on the same path but without a userId', async () => {
    mockedApi.post.mockResolvedValue({
      data: { results: { _id: 'stay_1', adults: 3 } },
    });

    await updateStayGuests('stay_1', { adults: 3 });

    expect(mockedApi.post).toHaveBeenCalledWith('/stays/stay_1/guests', {
      adults: 3,
    });
  });
});
