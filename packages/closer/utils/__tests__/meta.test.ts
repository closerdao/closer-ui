import { TRPCClientError } from '@trpc/client';

import api from '../api';
import { fetchCountries, fetchUrlPreview } from '../meta';
import { isTrpcEnabled, trpc } from '../trpc';

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(),
  trpc: {
    meta: {
      countries: { query: jest.fn() },
      urlPreview: { query: jest.fn() },
    },
  },
}));

const mockedApi = api as unknown as { get: jest.Mock };
const mockedEnabled = isTrpcEnabled as jest.Mock;
const meta = trpc.meta as unknown as Record<
  'countries' | 'urlPreview',
  { query: jest.Mock }
>;

const portugal = {
  code: 'PT',
  name: 'Portugal',
  latitude: 39.5,
  longitude: -8,
};
const preview = {
  title: 'Closer',
  description: 'Villages',
  image: 'https://closer.earth/og.png',
  url: 'https://closer.earth/?a=1&b=2',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('fetchCountries', () => {
  it('sends legacy GET /meta/countries with the flag off', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.get.mockResolvedValue({ data: { results: [portugal] } });

    await expect(fetchCountries()).resolves.toEqual([portugal]);
    expect(mockedApi.get).toHaveBeenCalledWith('/meta/countries');
    expect(meta.countries.query).not.toHaveBeenCalled();
  });

  it('calls meta.countries with the flag on', async () => {
    mockedEnabled.mockReturnValue(true);
    meta.countries.query.mockResolvedValue([portugal]);

    await expect(fetchCountries()).resolves.toEqual([portugal]);
    expect(mockedApi.get).not.toHaveBeenCalled();
  });
});

describe('fetchUrlPreview', () => {
  it('sends legacy GET /url-lookup/:url encoded with the flag off', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.get.mockResolvedValue({ data: { results: preview } });

    await expect(fetchUrlPreview(preview.url)).resolves.toBe(preview);
    expect(mockedApi.get).toHaveBeenCalledWith(
      `/url-lookup/${encodeURIComponent(preview.url)}`,
    );
  });

  it('calls meta.urlPreview with the url as written with the flag on', async () => {
    mockedEnabled.mockReturnValue(true);
    meta.urlPreview.query.mockResolvedValue(preview);

    await expect(fetchUrlPreview(preview.url)).resolves.toBe(preview);
    expect(meta.urlPreview.query).toHaveBeenCalledWith({ url: preview.url });
  });

  it('reshapes a refused URL into the axios error', async () => {
    mockedEnabled.mockReturnValue(true);
    meta.urlPreview.query.mockRejectedValue(
      new TRPCClientError('This URL cannot be previewed.', {
        result: {
          error: {
            message: 'This URL cannot be previewed.',
            code: -32600,
            data: { code: 'BAD_REQUEST', httpStatus: 400, zodError: null },
          },
        },
      }),
    );

    await expect(fetchUrlPreview('http://10.0.0.1')).rejects.toMatchObject({
      response: {
        status: 400,
        data: { error: 'This URL cannot be previewed.' },
      },
    });
  });
});
