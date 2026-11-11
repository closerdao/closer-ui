import React from 'react';

import { fireEvent, waitFor } from '@testing-library/react';

import { renderWithNextIntl } from '../test/utils';
import ConfigImageUpload from './ConfigImageUpload';

const mockPost = jest.fn();
// utils/api.js is mapped by its .js path, so mock that path directly.
jest.mock('../utils/api.js', () => ({
  __esModule: true,
  default: { post: (...args: unknown[]) => mockPost(...args) },
  doRefresh: jest.fn(),
  notifySessionInvalid: jest.fn(),
}));

const realFetch = global.fetch;

const drop = () => {
  const input = document.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement;
  Object.defineProperty(input, 'files', {
    value: [new File(['x'], 'a.png', { type: 'image/png' })],
  });
  fireEvent.change(input);
};

beforeEach(() => {
  mockPost.mockReset();
});
afterEach(() => {
  delete process.env.NEXT_PUBLIC_TRPC_URL;
  global.fetch = realFetch;
});

it('uploads to /upload/file through axios and hands back the url', async () => {
  delete process.env.NEXT_PUBLIC_TRPC_URL;
  mockPost.mockResolvedValueOnce({ data: { results: { url: 'https://f/a' } } });
  const onChange = jest.fn();
  renderWithNextIntl(<ConfigImageUpload value="" onChange={onChange} />);

  drop();

  await waitFor(() => expect(onChange).toHaveBeenCalledWith('https://f/a'));
  expect(mockPost.mock.calls[0][0]).toBe('/upload/file');
});

it('uploads to /upload/file on the tRPC origin and hands back the url', async () => {
  process.env.NEXT_PUBLIC_TRPC_URL = 'http://api.test/trpc';
  const fetchMock = jest.fn().mockResolvedValueOnce({
    status: 201,
    ok: 201 < 400,
    json: async () => ({ results: { url: 'https://f/a' } }),
  });
  global.fetch = fetchMock;
  const onChange = jest.fn();
  renderWithNextIntl(<ConfigImageUpload value="" onChange={onChange} />);

  drop();

  await waitFor(() => expect(onChange).toHaveBeenCalledWith('https://f/a'));
  expect(fetchMock.mock.calls[0][0]).toBe('http://api.test/upload/file');
  expect(mockPost).not.toHaveBeenCalled();
});
