import React from 'react';

import { fireEvent, waitFor } from '@testing-library/react';

import { renderWithNextIntl } from '../../test/utils';
import EventPhotoUploadSection from './EventPhotoUploadSection';

jest.mock('../EventPhoto', () => ({
  __esModule: true,
  default: () => null,
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

describe('EventPhotoUploadSection', () => {
  // Regression: `photo: [id]` is rejected by the API's safeWrite for
  // non-admin editors; the event's `photo` is a single ObjectId.
  it('patches the event photo with the id string, not an array', async () => {
    const setPhoto = jest.fn();
    renderWithNextIntl(
      <EventPhotoUploadSection
        event={{ _id: 'e1' }}
        photo={null}
        setPhoto={setPhoto}
        cdn=""
        canEditEvent
        isAuthenticated
        user={{ _id: 'u1' }}
      />,
    );

    drop([new File(['x'], 'cover.jpg', { type: 'image/jpeg' })]);

    await waitFor(() => expect(api.patch).toHaveBeenCalledTimes(1));
    expect(api.patch).toHaveBeenCalledWith('/event/e1', { photo: PHOTO_ID });
    expect(setPhoto).toHaveBeenCalledWith(PHOTO_ID);
  });
});
