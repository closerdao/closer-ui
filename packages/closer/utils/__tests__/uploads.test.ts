/**
 * @jest-environment node
 */
import { parseMessageFromError } from '../common';
import { photoUploadUrl, uploadPhoto } from '../uploads';

const mockPost = jest.fn();
const mockGetAccessToken = jest.fn<string | undefined, []>();
const mockDoRefresh = jest.fn<Promise<unknown>, []>();
const mockNotifySessionInvalid = jest.fn();

jest.mock('../authStorage', () => ({
  getAccessToken: () => mockGetAccessToken(),
}));
jest.mock('../api', () => ({
  __esModule: true,
  default: { post: (...args: unknown[]) => mockPost(...args) },
  doRefresh: () => mockDoRefresh(),
  notifySessionInvalid: () => mockNotifySessionInvalid(),
}));

const fetchMock = jest.fn();
global.fetch = fetchMock;

const API_URL = 'http://legacy.test';
const TRPC_URL = 'http://api.test/trpc';
const UPLOAD_URL = 'http://api.test/upload/photo';

const photo = {
  _id: 'ph1',
  urls: { 'max-lg': 'https://cdn.test/ph1-max-lg.jpg' },
  fileType: 'image',
};

const respond = (status: number, body: unknown) =>
  fetchMock.mockResolvedValueOnce(
    new Response(typeof body === 'string' ? body : JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    }),
  );

const failureOf = async (call: Promise<unknown>) => {
  try {
    await call;
  } catch (error) {
    return error as Error & { response?: { status: number; data: unknown } };
  }
  throw new Error('expected the call to fail');
};

const formWithFile = () => {
  const formData = new FormData();
  formData.append('file', new Blob(['jpeg']), 'a.jpg');
  return formData;
};

beforeEach(() => {
  mockPost.mockReset();
  fetchMock.mockReset();
  mockGetAccessToken.mockReset();
  mockDoRefresh.mockReset();
  mockNotifySessionInvalid.mockReset();
  process.env.NEXT_PUBLIC_API_URL = API_URL;
});

describe('legacy (NEXT_PUBLIC_TRPC_URL unset)', () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_TRPC_URL;
  });

  it('posts the form to /upload/photo with the multipart header and returns the axios response', async () => {
    const response = { data: { results: photo }, status: 201 };
    mockPost.mockResolvedValueOnce(response);
    const formData = formWithFile();

    await expect(uploadPhoto(formData)).resolves.toBe(response);
    expect(mockPost).toHaveBeenCalledTimes(1);
    const [path, body, config] = mockPost.mock.calls[0];
    expect(path).toBe('/upload/photo');
    expect(body).toBe(formData);
    expect(config).toEqual({
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('passes the axios rejection through untouched', async () => {
    const error = Object.assign(new Error('Request failed'), {
      response: { status: 400, data: { error: 'Error: No file provided.' } },
    });
    mockPost.mockRejectedValueOnce(error);

    await expect(uploadPhoto(formWithFile())).rejects.toBe(error);
  });

  it('gives server routes the legacy API upload URL', () => {
    expect(photoUploadUrl()).toBe(`${API_URL}/upload/photo`);
  });
});

describe('tRPC (NEXT_PUBLIC_TRPC_URL set)', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_TRPC_URL = TRPC_URL;
  });

  it('gives server routes the upload URL on the tRPC origin', () => {
    expect(photoUploadUrl()).toBe(UPLOAD_URL);
    process.env.NEXT_PUBLIC_TRPC_URL = 'http://api.test/trpc/';
    expect(photoUploadUrl()).toBe(UPLOAD_URL);
  });

  it('posts the same form with the bearer token and returns {data: {results}}', async () => {
    mockGetAccessToken.mockReturnValue('tok');
    respond(201, { results: photo });
    const formData = formWithFile();

    await expect(uploadPhoto(formData)).resolves.toEqual({
      data: { results: photo },
    });
    expect(mockPost).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, { body, ...init }] = fetchMock.mock.calls[0];
    expect(url).toBe(UPLOAD_URL);
    expect(body).toBe(formData);
    expect(init).toEqual({
      method: 'POST',
      headers: { Authorization: 'Bearer tok' },
    });
    expect(body.get('file')).toBeInstanceOf(Blob);
  });

  it('sends no Authorization header without a token', async () => {
    respond(201, { results: photo });
    await uploadPhoto(formWithFile());
    expect(fetchMock.mock.calls[0][1].headers).toEqual({});
  });

  it.each([
    [400, 'Error: No file provided.'],
    [
      413,
      'Error: maxFileSize exceeded, received more than 209715200 bytes of file data',
    ],
    [502, 'Error: Photo storage failed.'],
  ])('maps a %i {error} body to response.data.error', async (status, text) => {
    mockGetAccessToken.mockReturnValue('tok');
    respond(status, { error: text });

    const error = await failureOf(uploadPhoto(formWithFile()));
    expect(error.response).toEqual({ status, data: { error: text } });
    expect(error.message).toBe(text);
    expect(parseMessageFromError(error)).toBe(text);
  });

  it('reads a non-JSON failure as "Something went wrong"', async () => {
    respond(502, '<html>Bad Gateway</html>');
    const error = await failureOf(uploadPhoto(formWithFile()));
    expect(parseMessageFromError(error)).toBe('Something went wrong');
  });

  it('reads a fetch rejection as axios "Network Error"', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));
    const error = await failureOf(uploadPhoto(formWithFile()));
    expect(parseMessageFromError(error)).toBe('Network Error');
  });

  it('refreshes once on 401 and retries with the new token', async () => {
    mockGetAccessToken.mockReturnValueOnce('old').mockReturnValueOnce('new');
    mockDoRefresh.mockResolvedValueOnce({});
    respond(401, { error: 'Please sign in to do this.' });
    respond(201, { results: photo });

    await expect(uploadPhoto(formWithFile())).resolves.toEqual({
      data: { results: photo },
    });
    expect(mockDoRefresh).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls.map(([, init]) => init.headers)).toEqual([
      { Authorization: 'Bearer old' },
      { Authorization: 'Bearer new' },
    ]);
  });

  it('retries once with the same form when the refreshed token still gets 401', async () => {
    mockGetAccessToken.mockReturnValueOnce('old').mockReturnValueOnce('new');
    mockDoRefresh.mockResolvedValueOnce({});
    respond(401, { error: 'Please sign in to do this.' });
    respond(401, { error: 'Please sign in to do this.' });
    const formData = formWithFile();

    const error = await failureOf(uploadPhoto(formData));
    expect(error.response?.status).toBe(401);
    expect(parseMessageFromError(error)).toBe('Please sign in to do this.');
    expect(mockDoRefresh).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1].body).toBe(formData);
    expect(fetchMock.mock.calls[1][1].body).toBe(formData);
    expect(mockNotifySessionInvalid).not.toHaveBeenCalled();
  });

  it('surfaces the 401 and ends the session when the refresh fails', async () => {
    mockGetAccessToken.mockReturnValue('old');
    mockDoRefresh.mockRejectedValueOnce(new Error('Invalid refresh response'));
    respond(401, { error: 'Please sign in to do this.' });

    const error = await failureOf(uploadPhoto(formWithFile()));
    expect(error.response?.status).toBe(401);
    expect(parseMessageFromError(error)).toBe('Please sign in to do this.');
    expect(mockNotifySessionInvalid).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('leaves the session to doRefresh on a silent auth redirect', async () => {
    mockDoRefresh.mockRejectedValueOnce(
      Object.assign(new Error('Not authenticated'), {
        silentAuthRedirect: true,
      }),
    );
    respond(401, { error: 'Please sign in to do this.' });

    await failureOf(uploadPhoto(formWithFile()));
    expect(mockNotifySessionInvalid).not.toHaveBeenCalled();
  });
});
