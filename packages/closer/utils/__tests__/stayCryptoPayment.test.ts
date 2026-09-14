jest.mock('../api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: { results: [] } })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
  },
  cdn: '',
}));

import api from '../api';
import {
  clearPendingStayCryptoPayment,
  readPendingStayCryptoPayment,
  writePendingStayCryptoPayment,
} from '../stayCryptoPaymentPendingStorage';
import {
  confirmStayTokenPayment,
  isStayTokenPaymentNotIndexedError,
  quoteStayTokenPayment,
} from '../stays.api';

const mockedPost = api.post as jest.Mock;

describe('quoteStayTokenPayment', () => {
  beforeEach(() => {
    mockedPost.mockReset();
  });

  it('posts an empty body and unwraps the quote', async () => {
    const quote = {
      fiatAmount: 80,
      currency: 'EUR',
      chainId: 42220,
      treasuryAddress: '0xabc',
      stablecoinSymbol: 'CEUR',
      stablecoinAddresses: ['0xdef'],
    };
    mockedPost.mockResolvedValueOnce({ data: { results: quote } });

    const result = await quoteStayTokenPayment('stay_1');

    expect(mockedPost).toHaveBeenCalledWith('/stays/stay_1/token-payment', {});
    expect(result).toEqual(quote);
  });
});

describe('confirmStayTokenPayment', () => {
  beforeEach(() => {
    mockedPost.mockReset();
  });

  it('posts the tx hash and unwraps booking + verified', async () => {
    const booking = { _id: 'stay_1', status: 'paid' };
    mockedPost.mockResolvedValueOnce({
      data: { results: { booking, verified: true } },
    });

    const result = await confirmStayTokenPayment('stay_1', '0x123');

    expect(mockedPost).toHaveBeenCalledWith('/stays/stay_1/token-payment', {
      txHash: '0x123',
    });
    expect(result.booking).toEqual(booking);
    expect(result.verified).toBe(true);
  });

  it('falls back to fetching the stay when no booking is returned', async () => {
    const mockedGet = api.get as jest.Mock;
    mockedPost.mockResolvedValueOnce({ data: { results: { verified: true } } });
    mockedGet.mockResolvedValueOnce({
      data: { results: { _id: 'stay_1', status: 'paid' } },
    });

    const result = await confirmStayTokenPayment('stay_1', '0x123');

    expect(result.booking._id).toBe('stay_1');
    expect(result.verified).toBe(true);
  });
});

describe('isStayTokenPaymentNotIndexedError', () => {
  it('matches the not-yet-indexed message', () => {
    expect(
      isStayTokenPaymentNotIndexedError(
        'Transaction could not be verified for this stay.',
      ),
    ).toBe(true);
  });

  it('does not match other errors', () => {
    expect(
      isStayTokenPaymentNotIndexedError(
        'This transaction has already been used.',
      ),
    ).toBe(false);
    expect(isStayTokenPaymentNotIndexedError('Stay not found.')).toBe(false);
  });
});

describe('stayCryptoPaymentPendingStorage', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('round-trips a pending tx hash per stay', () => {
    writePendingStayCryptoPayment('stay_1', '0xaaa');
    expect(readPendingStayCryptoPayment('stay_1')).toBe('0xaaa');
    expect(readPendingStayCryptoPayment('stay_2')).toBeNull();
  });

  it('clears a pending tx hash', () => {
    writePendingStayCryptoPayment('stay_1', '0xaaa');
    clearPendingStayCryptoPayment('stay_1');
    expect(readPendingStayCryptoPayment('stay_1')).toBeNull();
  });

  it('ignores malformed stored payloads', () => {
    window.sessionStorage.setItem(
      'closer:stay-crypto-payment-pending:stay_1',
      'not json',
    );
    expect(readPendingStayCryptoPayment('stay_1')).toBeNull();
  });
});
