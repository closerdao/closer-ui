/**
 * The favicon endpoint ships after the UI, so the upload has to survive its
 * absence — but only its absence. See docs/tickets/favicon-upload-api.md.
 */
jest.mock('../api', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

import api from '../api';
import { uploadFaviconImage } from '../faviconUpload';

const post = api.post as jest.Mock;

const makeError = (status: number) => {
  const err = new Error(`Request failed with status code ${status}`) as Error & {
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
    post
      .mockRejectedValueOnce(makeError(status))
      .mockResolvedValueOnce({
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
