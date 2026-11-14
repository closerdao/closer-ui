import api from '../api';
import {
  appendEngagementHistory,
  dismissEngagementOpportunity,
  fetchEngagementOpportunities,
  fetchSampleEmail,
  patchEngagementOpportunity,
} from '../engagementOpportunities';
import { isTrpcEnabled, trpc } from '../trpc';

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
  formatSearch: (where: unknown) => JSON.stringify(where),
}));
jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(),
  trpc: {
    engagementOpportunity: {
      list: { query: jest.fn() },
      update: { mutate: jest.fn() },
      dismiss: { mutate: jest.fn() },
      sampleEmail: { mutate: jest.fn() },
      appendHistory: { mutate: jest.fn() },
    },
  },
}));

const mockedApi = api as unknown as Record<'get' | 'post' | 'patch', jest.Mock>;
const mockedEnabled = isTrpcEnabled as jest.Mock;
const eo = trpc.engagementOpportunity as unknown as Record<
  string,
  Record<string, jest.Mock>
>;

beforeEach(() => jest.clearAllMocks());

describe('with tRPC off', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(false));

  it('lists through the legacy route, newest score first', async () => {
    mockedApi.get.mockResolvedValue({ data: { results: [{ _id: 'a' }] } });
    await expect(
      fetchEngagementOpportunities({
        where: { status: 'draft' },
        limit: 20,
        page: 1,
      }),
    ).resolves.toEqual({ results: [{ _id: 'a' }] });
    expect(mockedApi.get).toHaveBeenCalledWith('/engagementopportunity', {
      params: {
        sort_by: '-score',
        where: '{"status":"draft"}',
        limit: 20,
        page: 1,
      },
      cache: false,
    });
  });

  it('patches, dismisses, previews and appends history through legacy', async () => {
    mockedApi.patch.mockResolvedValue({ data: { results: 'p' } });
    mockedApi.post.mockResolvedValue({ data: { results: 'x' } });
    await expect(
      patchEngagementOpportunity('a', { status: 'sent' }),
    ).resolves.toEqual({ results: 'p' });
    expect(mockedApi.patch).toHaveBeenCalledWith('/engagementopportunity/a', {
      status: 'sent',
    });
    await dismissEngagementOpportunity('a', {});
    expect(mockedApi.post).toHaveBeenCalledWith(
      '/engagementopportunity/a/dismiss',
      {},
    );
    await fetchSampleEmail({ email: 'a@b.c' });
    expect(mockedApi.post).toHaveBeenCalledWith(
      '/engagement-opportunities/sample-email',
      { email: 'a@b.c' },
    );
    await appendEngagementHistory('a', { note: 'n' } as never);
    expect(mockedApi.post).toHaveBeenCalledWith(
      '/engagement-opportunities/a/history',
      { note: 'n' },
    );
  });
});

describe('with tRPC on', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(true));

  it('calls each procedure and keeps the legacy body shape', async () => {
    eo.list.query.mockResolvedValue([{ _id: 'a' }]);
    eo.update.mutate.mockResolvedValue({ _id: 'a' });
    eo.dismiss.mutate.mockResolvedValue({ _id: 'a' });
    eo.sampleEmail.mutate.mockResolvedValue({ results: { subject: 's' } });
    eo.appendHistory.mutate.mockResolvedValue({ results: 'h' });

    await expect(
      fetchEngagementOpportunities({ limit: 20, page: 1 }),
    ).resolves.toEqual({ results: [{ _id: 'a' }] });
    await expect(
      patchEngagementOpportunity('a', { status: 'sent' }),
    ).resolves.toEqual({ results: { _id: 'a' } });
    await expect(dismissEngagementOpportunity('a')).resolves.toEqual({
      results: { _id: 'a' },
    });
    await expect(fetchSampleEmail({ email: 'a@b.c' })).resolves.toEqual({
      results: { results: { subject: 's' } },
    });
    await expect(
      appendEngagementHistory('a', { note: 'n' } as never),
    ).resolves.toEqual({ results: { results: 'h' } });

    expect(eo.update.mutate).toHaveBeenCalledWith({
      idOrSlug: 'a',
      data: { status: 'sent' },
    });
    expect(eo.dismiss.mutate).toHaveBeenCalledWith({ id: 'a' });
    expect(eo.sampleEmail.mutate).toHaveBeenCalledWith({ email: 'a@b.c' });
    expect(eo.appendHistory.mutate).toHaveBeenCalledWith({
      id: 'a',
      note: 'n',
    });
    expect(mockedApi.get).not.toHaveBeenCalled();
  });
});
