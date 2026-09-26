import React from 'react';

import { fireEvent, waitFor } from '@testing-library/react';

import { renderWithNextIntl } from '../../test/utils';
import UploadPhoto from './UploadPhoto';

jest.mock('../../contexts/auth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { _id: 'u1' },
    refetchUser: jest.fn(),
  }),
}));

// The "../../utils/api" the component imports resolves to utils/api.js, which
// jest.config's mapper does not cover from this depth - mock it by that path.
jest.mock('../../utils/api.js', () => ({
  __esModule: true,
  default: { post: jest.fn(), patch: jest.fn() },
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const api = require('../../utils/api.js').default;

const PHOTO_ID = '507f1f77bcf86cd799439011';

const drop = (files: File[]) => {
  const input = document.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement;
  Object.defineProperty(input, 'files', { value: files });
  fireEvent.change(input);
};

beforeEach(() => {
  api.post.mockReset();
  api.patch.mockReset();
  api.post.mockResolvedValue({ data: { results: { _id: PHOTO_ID } } });
  api.patch.mockResolvedValue({ data: {} });
});

describe('UploadPhoto', () => {
  // Regression: the PATCH sent `photo: [id]`. Mongoose unwraps that, but the
  // API's safeWrite (non-admin writes) rejects a one-element array for a
  // single ObjectId field, so only admins could change their photo.
  it('patches a single-id photo field with the id string, not an array', async () => {
    const onSave = jest.fn();
    renderWithNextIntl(
      <UploadPhoto model="user" id="u1" onSave={onSave} isPrompt />,
    );

    drop([new File(['x'], 'me.png', { type: 'image/png' })]);

    await waitFor(() => expect(api.patch).toHaveBeenCalledTimes(1));
    expect(api.patch).toHaveBeenCalledWith('/user/u1', { photo: PHOTO_ID });
    expect(onSave).toHaveBeenCalledWith(PHOTO_ID);
  });
});
