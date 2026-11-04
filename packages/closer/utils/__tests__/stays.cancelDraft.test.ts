import { TRPCClientError } from '@trpc/client';

import api from '../api';
import { parseMessageFromError } from '../common';
import { cancelStay, deleteDraftStay } from '../stays.api';
import { isTrpcEnabled, trpc } from '../trpc';

jest.mock('../api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(() => false),
  trpc: { booking: { removeDraft: { mutate: jest.fn() } } },
}));

const mockedEnabled = isTrpcEnabled as jest.Mock;
const removeDraft = (
  trpc as unknown as { booking: { removeDraft: { mutate: jest.Mock } } }
).booking.removeDraft.mutate;

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

  describe('with tRPC', () => {
    beforeEach(() => {
      mockedEnabled.mockReturnValue(true);
    });

    afterEach(() => {
      mockedEnabled.mockReturnValue(false);
    });

    it('deletes the draft through booking.removeDraft', async () => {
      removeDraft.mockResolvedValue({ deleted: true });

      await deleteDraftStay('stay_1');

      expect(removeDraft).toHaveBeenCalledWith({ id: 'stay_1' });
      expect(mockedApi.delete).not.toHaveBeenCalled();
    });

    it('rejects when nothing was deleted', async () => {
      removeDraft.mockResolvedValue({ deleted: false });

      const error = await deleteDraftStay('stay_1').catch((e: unknown) => e);
      expect(parseMessageFromError(error)).toBe('Booking not found');
    });

    it('rejects with the API message for a stay that is no draft', async () => {
      removeDraft.mockRejectedValue(
        new TRPCClientError('Only a draft stay can be deleted.', {
          result: {
            error: {
              message: 'Only a draft stay can be deleted.',
              code: -32600,
              data: { code: 'BAD_REQUEST', httpStatus: 400, zodError: null },
            },
          },
        }),
      );

      const error = await deleteDraftStay('stay_1').catch((e: unknown) => e);
      expect(parseMessageFromError(error)).toBe(
        'Only a draft stay can be deleted.',
      );
    });
  });
});
