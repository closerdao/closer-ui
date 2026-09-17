import api from '../api';
import { cancelStay, deleteDraftStay } from '../stays.api';

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

describe('cancelling a draft stay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes the booking outright', async () => {
    mockedApi.delete.mockResolvedValue({ data: {} });

    await deleteDraftStay('stay_1');

    expect(mockedApi.delete).toHaveBeenCalledWith('/booking/stay_1');
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('leaves the refund-aware cancel endpoint for submitted stays', async () => {
    mockedApi.post.mockResolvedValue({
      data: { results: { booking: { _id: 'stay_1' }, refund: null } },
    });

    await cancelStay('stay_1');

    expect(mockedApi.post).toHaveBeenCalledWith('/stays/stay_1/cancel', {});
    expect(mockedApi.delete).not.toHaveBeenCalled();
  });
});
