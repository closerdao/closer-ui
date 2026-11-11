import {
  getNextFinancePaymentRemainingDue,
  isAllowedFinancePaymentProofFile,
  uploadFinancePaymentProof,
} from '../financeApplyPayment';

const mockPost = jest.fn();
jest.mock('../api', () => ({
  __esModule: true,
  default: { post: (...args: unknown[]) => mockPost(...args) },
  doRefresh: jest.fn(),
  notifySessionInvalid: jest.fn(),
}));

describe('isAllowedFinancePaymentProofFile', () => {
  it('accepts images and PDFs', () => {
    expect(
      isAllowedFinancePaymentProofFile(
        new File(['x'], 'a.png', { type: 'image/png' }),
      ),
    ).toBe(true);
    expect(
      isAllowedFinancePaymentProofFile(
        new File(['x'], 'a.pdf', { type: 'application/pdf' }),
      ),
    ).toBe(true);
  });

  it('rejects other types', () => {
    expect(
      isAllowedFinancePaymentProofFile(
        new File(['x'], 'a.txt', { type: 'text/plain' }),
      ),
    ).toBe(false);
  });
});

describe('getNextFinancePaymentRemainingDue', () => {
  it('returns remaining due on the first unpaid month', () => {
    const remaining = getNextFinancePaymentRemainingDue(
      {
        paymentsScheduled: {
          '2026-01': {
            status: 'paid',
            amountDue: 250,
            amountPaid: 250,
            paymentDate: '',
          },
          '2026-02': {
            status: 'pending',
            amountDue: 250,
            amountPaid: 100,
            paymentDate: '',
          },
        },
      } as any,
      250,
    );
    expect(remaining).toBe(150);
  });

  it('falls back to the monthly installment when amountDue is missing', () => {
    const remaining = getNextFinancePaymentRemainingDue(
      {
        paymentsScheduled: {
          '2026-01': { status: 'pending', amountPaid: 0, paymentDate: '' },
        },
      } as any,
      433.33,
    );
    expect(remaining).toBe(433.33);
  });
});

describe('uploadFinancePaymentProof', () => {
  const file = new File(['x'], 'proof.pdf', { type: 'application/pdf' });
  const realFetch = global.fetch;

  beforeEach(() => {
    mockPost.mockReset();
  });
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_TRPC_URL;
    global.fetch = realFetch;
  });

  it('posts to /upload/file through axios and returns the url', async () => {
    delete process.env.NEXT_PUBLIC_TRPC_URL;
    mockPost.mockResolvedValueOnce({
      data: { results: { url: 'https://f/p' } },
    });

    await expect(uploadFinancePaymentProof(file)).resolves.toBe('https://f/p');
    expect(mockPost.mock.calls[0][0]).toBe('/upload/file');
    expect(mockPost.mock.calls[0][2]).toEqual({
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  });

  it('posts to /upload/file on the tRPC origin and returns the url', async () => {
    process.env.NEXT_PUBLIC_TRPC_URL = 'http://api.test/trpc';
    const fetchMock = jest.fn().mockResolvedValueOnce({
      status: 201,
      ok: 201 < 400,
      json: async () => ({ results: { url: 'https://f/p' } }),
    });
    global.fetch = fetchMock;

    await expect(uploadFinancePaymentProof(file)).resolves.toBe('https://f/p');
    expect(fetchMock.mock.calls[0][0]).toBe('http://api.test/upload/file');
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('throws when the response has no url', async () => {
    delete process.env.NEXT_PUBLIC_TRPC_URL;
    mockPost.mockResolvedValueOnce({ data: { results: {} } });

    await expect(uploadFinancePaymentProof(file)).rejects.toThrow(
      'Upload did not return a file URL',
    );
  });
});
