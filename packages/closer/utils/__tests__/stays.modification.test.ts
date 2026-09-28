import type { PendingModification, Stay } from '../../types/stay';
import api from '../api';
import {
  approveStayModification,
  approveStayRequest,
  buildStayTokenStakePlan,
  confirmStayModification,
  discardStayModification,
  getStayModification,
  proposeStayModification,
  rejectStayRequest,
} from '../stays.api';

jest.mock('../api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockedApi = api as unknown as { get: jest.Mock; post: jest.Mock };

describe('stay modification endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('proposes one change rather than a route per kind', async () => {
    mockedApi.post.mockResolvedValue({
      data: { results: { booking: { _id: 'stay_1' } } },
    });

    await proposeStayModification('stay_1', {
      start: '2027-03-01',
      end: '2027-03-06',
      adults: 2,
    });

    expect(mockedApi.post).toHaveBeenCalledWith('/stays/stay_1/modification', {
      start: '2027-03-01',
      end: '2027-03-06',
      adults: 2,
    });
  });

  it('reads the held quote, and null once it has expired', async () => {
    mockedApi.get.mockResolvedValue({
      data: { results: { pendingModification: null } },
    });

    expect(await getStayModification('stay_1')).toBeNull();
    expect(mockedApi.get).toHaveBeenCalledWith('/stays/stay_1/modification');
  });

  it('confirms and hands back both the stay and the refund', async () => {
    mockedApi.post.mockResolvedValue({
      data: {
        results: {
          booking: { _id: 'stay_1', status: 'paid' },
          refund: { refundVal: 60 },
        },
      },
    });

    const result = await confirmStayModification('stay_1');

    expect(mockedApi.post).toHaveBeenCalledWith(
      '/stays/stay_1/modification/confirm',
      {},
    );
    expect(result.stay._id).toBe('stay_1');
    expect(result.refund).toEqual({ refundVal: 60 });
  });

  it('discards the hold and nothing else', async () => {
    mockedApi.post.mockResolvedValue({
      data: { results: { booking: { _id: 'stay_1' } } },
    });

    await discardStayModification('stay_1');

    expect(mockedApi.post).toHaveBeenCalledWith(
      '/stays/stay_1/modification/discard',
      {},
    );
  });

  it('a host sends the reason with confirm and discard', async () => {
    mockedApi.post.mockResolvedValue({
      data: { results: { booking: { _id: 'stay_1' } } },
    });

    await confirmStayModification('stay_1', 'Agreed by phone');
    await discardStayModification('stay_1', 'Guest changed their mind');

    expect(mockedApi.post).toHaveBeenCalledWith(
      '/stays/stay_1/modification/confirm',
      { reason: 'Agreed by phone' },
    );
    expect(mockedApi.post).toHaveBeenCalledWith(
      '/stays/stay_1/modification/discard',
      { reason: 'Guest changed their mind' },
    );
  });

  it('a host approves a held change on /modification/approve, with a reason', async () => {
    mockedApi.post.mockResolvedValue({
      data: { results: { booking: { _id: 'stay_1' } } },
    });

    await approveStayModification('stay_1', 'Room is free');

    expect(mockedApi.post).toHaveBeenCalledWith(
      '/stays/stay_1/modification/approve',
      { reason: 'Room is free' },
    );
  });
});

describe('host decisions on a stay request', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedApi.post.mockResolvedValue({
      data: { results: { _id: 'stay_1' } },
    });
  });

  it('approve and reject carry the reason', async () => {
    await approveStayRequest('stay_1', 'Returning guest');
    await rejectStayRequest('stay_1', 'Retreat week');

    expect(mockedApi.post).toHaveBeenCalledWith('/stays/stay_1/approve', {
      reason: 'Returning guest',
    });
    expect(mockedApi.post).toHaveBeenCalledWith('/stays/stay_1/reject', {
      reason: 'Retreat week',
    });
  });
});

describe('buildStayTokenStakePlan with a held change', () => {
  const nights = [
    [2027, 60],
    [2027, 61],
  ];
  const confirmedStay = {
    _id: 'stay_1',
    priceLock: {
      tokenStakePlan: {
        dates: nights,
        pricePerNightWei: '1000000000000000000',
        decimals: 18,
        displayDecimals: 6,
      },
    },
  } as unknown as Stay;

  it('signs the proposed nights while a quote is held', () => {
    const proposedNights = [...nights, [2027, 62]];
    const stay = {
      ...confirmedStay,
      pendingModification: {
        quote: {
          priceLockPreview: {
            tokenStakePlan: {
              dates: proposedNights,
              pricePerNightWei: '1000000000000000000',
              decimals: 18,
              displayDecimals: 6,
            },
          },
        },
      } as unknown as PendingModification,
    } as Stay;

    expect(buildStayTokenStakePlan(stay)?.bookingNights).toHaveLength(3);
  });

  it('falls back to the confirmed price lock when nothing is held', () => {
    expect(buildStayTokenStakePlan(confirmedStay)?.bookingNights).toHaveLength(
      2,
    );
  });
});
