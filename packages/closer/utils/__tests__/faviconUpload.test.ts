import api from '../api';
import { uploadFaviconImage } from '../faviconUpload';

/**
 * The favicon endpoint ships after the UI, so the upload has to survive its
 * absence — but only its absence. See docs/tickets/favicon-upload-api.md.
 */
jest.mock('../api', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

const post = api.post as jest.Mock;

const makeError = (status: number) => {
  const err = new Error(
    `Request failed with status code ${status}`,
  ) as Error & {
    response: { status: number };
  };
  err.response = { status };
  return err;
};

const file = { name: 'favicon.png', type: 'image/png' } as unknown as File;

beforeEach(() => {
  post.mockReset();
});

it('stores the id returned by /upload/favicon', async () => {
  post.mockResolvedValueOnce({ data: { results: { _id: '6a1f' } } });

  await expect(uploadFaviconImage(file)).resolves.toBe('6a1f');
  expect(post).toHaveBeenCalledTimes(1);
  expect(post.mock.calls[0][0]).toBe('/upload/favicon');
});

it.each([404, 405, 501])(
  'falls back to /upload/file when the endpoint answers %i',
  async (status) => {
    post.mockRejectedValueOnce(makeError(status)).mockResolvedValueOnce({
      data: { results: { url: 'https://files.example.com/favicon.png' } },
    });

    await expect(uploadFaviconImage(file)).resolves.toBe(
      'https://files.example.com/favicon.png',
    );
    expect(post.mock.calls[1][0]).toBe('/upload/file');
  },
);

it.each([400, 413, 500])(
  'surfaces a rejected upload (%i) instead of falling back',
  async (status) => {
    post.mockRejectedValueOnce(makeError(status));

    await expect(uploadFaviconImage(file)).rejects.toThrow(
      `Request failed with status code ${status}`,
    );
    expect(post).toHaveBeenCalledTimes(1);
  },
);

it('posts the file as multipart form data', async () => {
  post.mockResolvedValueOnce({ data: { results: { _id: '6a1f' } } });

  await uploadFaviconImage(file);

  const [, body, options] = post.mock.calls[0];
  expect(body).toBeInstanceOf(FormData);
  expect(options.headers['Content-Type']).toBe('multipart/form-data');
});

describe('tRPC (NEXT_PUBLIC_TRPC_URL set)', () => {
  const fetchMock = jest.fn();
  const realFetch = global.fetch;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_TRPC_URL = 'http://api.test/trpc';
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_TRPC_URL;
    global.fetch = realFetch;
  });

  const respond = (status: number, body: unknown) =>
    fetchMock.mockResolvedValueOnce({
      status,
      ok: status < 400,
      json: async () => body,
    });

  it('stores the id from /upload/favicon on the tRPC origin', async () => {
    respond(201, { results: { _id: '6a1f' } });

    await expect(uploadFaviconImage(file)).resolves.toBe('6a1f');
    expect(fetchMock.mock.calls[0][0]).toBe('http://api.test/upload/favicon');
    expect(post).not.toHaveBeenCalled();
  });

  it('falls back to /upload/file on the tRPC origin when the endpoint answers 404', async () => {
    respond(404, { error: 'Not found' });
    respond(201, { results: { url: 'https://files.example.com/f.png' } });

    await expect(uploadFaviconImage(file)).resolves.toBe(
      'https://files.example.com/f.png',
    );
    expect(fetchMock.mock.calls[1][0]).toBe('http://api.test/upload/file');
  });

  it('falls back on a non-JSON 404 from a proxy', async () => {
    fetchMock.mockResolvedValueOnce({
      status: 404,
      ok: false,
      json: async () => {
        throw new SyntaxError('Unexpected token <');
      },
    });
    respond(201, { results: { url: 'https://files.example.com/f.png' } });

    await expect(uploadFaviconImage(file)).resolves.toBe(
      'https://files.example.com/f.png',
    );
    expect(fetchMock.mock.calls[1][0]).toBe('http://api.test/upload/file');
  });

  it('surfaces a 413 instead of falling back', async () => {
    respond(413, { error: 'too big' });

    await expect(uploadFaviconImage(file)).rejects.toThrow('too big');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
