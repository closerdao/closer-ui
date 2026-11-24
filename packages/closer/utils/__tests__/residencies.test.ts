import api from '../api';
import {
  applyForResidency,
  approveResidency,
  cancelResidency,
  fetchResidencyAgreements,
} from '../residencies';
import { isTrpcEnabled, trpc } from '../trpc';

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(),
  trpc: {
    residency: {
      list: { query: jest.fn() },
      apply: { mutate: jest.fn() },
      approve: { mutate: jest.fn() },
      cancel: { mutate: jest.fn() },
    },
  },
}));

const mockedApi = api as unknown as { get: jest.Mock; post: jest.Mock };
const mockedEnabled = isTrpcEnabled as jest.Mock;
const list = trpc.residency.list.query as unknown as jest.Mock;
const apply = trpc.residency.apply.mutate as unknown as jest.Mock;
const approve = trpc.residency.approve.mutate as unknown as jest.Mock;
const cancel = trpc.residency.cancel.mutate as unknown as jest.Mock;

const agreement = { _id: 'r1', status: 'pending' };

beforeEach(() => {
  jest.clearAllMocks();
});

it('reads /residencies uncached on the legacy API', async () => {
  mockedEnabled.mockReturnValue(false);
  mockedApi.get.mockResolvedValue({ data: { results: [agreement] } });

  await expect(
    fetchResidencyAgreements({ limit: 50, status: 'pending', mine: true }),
  ).resolves.toEqual([agreement]);

  expect(mockedApi.get).toHaveBeenCalledWith('/residencies', {
    params: { limit: 50, status: 'pending', mine: true },
    cache: false,
  });
  expect(list).not.toHaveBeenCalled();
});

it('lists through residency.list on tRPC', async () => {
  mockedEnabled.mockReturnValue(true);
  list.mockResolvedValue([agreement]);

  await expect(fetchResidencyAgreements({ limit: 50 })).resolves.toEqual([
    agreement,
  ]);

  expect(list).toHaveBeenCalledWith({ limit: 50 });
  expect(mockedApi.get).not.toHaveBeenCalled();
});

const submission = { stay: { listing: 'l1' } } as any;
const result = { agreement, stay: null };

it('applies through POST /residencies/apply on the legacy API', async () => {
  mockedEnabled.mockReturnValue(false);
  mockedApi.post.mockResolvedValue({ data: { results: agreement } });

  await expect(applyForResidency(submission)).resolves.toEqual(agreement);

  expect(mockedEnabled).toHaveBeenCalledWith('11.4a');
  expect(mockedApi.post).toHaveBeenCalledWith('/residencies/apply', submission);
  expect(apply).not.toHaveBeenCalled();
});

it('applies through residency.apply on tRPC', async () => {
  mockedEnabled.mockReturnValue(true);
  apply.mockResolvedValue(agreement);

  await expect(applyForResidency(submission)).resolves.toEqual(agreement);

  expect(apply).toHaveBeenCalledWith(submission);
  expect(mockedApi.post).not.toHaveBeenCalled();
});

it('approves through POST /residencies/:id/approve on the legacy API', async () => {
  mockedEnabled.mockReturnValue(false);
  mockedApi.post.mockResolvedValue({ data: { results: result } });

  await expect(approveResidency('r1')).resolves.toEqual(result);

  expect(mockedApi.post).toHaveBeenCalledWith('/residencies/r1/approve', {});
  expect(approve).not.toHaveBeenCalled();
});

it('approves through residency.approve on tRPC', async () => {
  mockedEnabled.mockReturnValue(true);
  approve.mockResolvedValue(result);

  await expect(approveResidency('r1')).resolves.toEqual(result);

  expect(approve).toHaveBeenCalledWith({ id: 'r1' });
  expect(mockedApi.post).not.toHaveBeenCalled();
});

it('cancels through POST /residencies/:id/cancel on the legacy API, a blank reason sending nothing', async () => {
  mockedEnabled.mockReturnValue(false);
  mockedApi.post.mockResolvedValue({ data: { results: result } });

  await expect(cancelResidency('r1', 'moving on')).resolves.toEqual(result);
  await cancelResidency('r1', '');

  expect(mockedApi.post).toHaveBeenNthCalledWith(1, '/residencies/r1/cancel', {
    reason: 'moving on',
  });
  expect(mockedApi.post).toHaveBeenNthCalledWith(
    2,
    '/residencies/r1/cancel',
    {},
  );
  expect(cancel).not.toHaveBeenCalled();
});

it('cancels through residency.cancel on tRPC', async () => {
  mockedEnabled.mockReturnValue(true);
  cancel.mockResolvedValue(result);

  await expect(cancelResidency('r1', 'moving on')).resolves.toEqual(result);
  await cancelResidency('r1');

  expect(cancel).toHaveBeenNthCalledWith(1, { id: 'r1', reason: 'moving on' });
  expect(cancel).toHaveBeenNthCalledWith(2, { id: 'r1' });
  expect(mockedApi.post).not.toHaveBeenCalled();
});
