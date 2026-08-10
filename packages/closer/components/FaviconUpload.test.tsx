import React from 'react';

import { screen, waitFor } from '@testing-library/react';

import { renderWithNextIntl } from '../test/utils';
import FaviconUpload from './FaviconUpload';

jest.mock('../utils/faviconImage', () => ({
  normalizeToSquarePng: jest.fn(),
}));

jest.mock('../utils/faviconUpload', () => ({
  uploadFaviconImage: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { normalizeToSquarePng } = require('../utils/faviconImage');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { uploadFaviconImage } = require('../utils/faviconUpload');

const makeFile = (
  { type = 'image/png', size = 1024 } = {} as {
    type?: string;
    size?: number;
  },
) => {
  const file = new File(['x'], 'logo.png', { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

const drop = (file: File) => {
  const input = document.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement;
  Object.defineProperty(input, 'files', { value: [file] });
  input.dispatchEvent(new Event('change', { bubbles: true }));
};

beforeEach(() => {
  (normalizeToSquarePng as jest.Mock).mockReset();
  (uploadFaviconImage as jest.Mock).mockReset();
  (global as any).URL.createObjectURL = jest.fn(() => 'blob:preview');
  (global as any).URL.revokeObjectURL = jest.fn();
});

describe('FaviconUpload', () => {
  it('previews a stored favicon id at 16px in a tab mock, not as a large image', () => {
    const { container } = renderWithNextIntl(
      <FaviconUpload value="6a1f" onChange={jest.fn()} platformName="Moos" />,
    );

    const icons = Array.from(container.querySelectorAll('img'));
    expect(icons.map((icon) => icon.getAttribute('width'))).toEqual([
      '16',
      '32',
    ]);
    expect(icons[0].getAttribute('src')).toContain('-32.png');
    expect(screen.getByText('Moos')).toBeInTheDocument();
  });

  it('rejects a file over 5 MB without uploading', async () => {
    renderWithNextIntl(<FaviconUpload value="" onChange={jest.fn()} />);

    drop(makeFile({ size: 6 * 1024 * 1024 }));

    await waitFor(() => {
      expect(screen.getByText(/larger than 5 MB/i)).toBeInTheDocument();
    });
    expect(uploadFaviconImage).not.toHaveBeenCalled();
    expect(normalizeToSquarePng).not.toHaveBeenCalled();
  });

  it('rejects a non-image file without uploading', async () => {
    renderWithNextIntl(<FaviconUpload value="" onChange={jest.fn()} />);

    drop(makeFile({ type: 'application/pdf' }));

    await waitFor(() => {
      expect(screen.getByText(/isn't an image we can use/i)).toBeInTheDocument();
    });
    expect(uploadFaviconImage).not.toHaveBeenCalled();
  });

  it('stores what the upload returns and tells the admin when it padded', async () => {
    const onChange = jest.fn();
    (normalizeToSquarePng as jest.Mock).mockResolvedValue({
      file: makeFile(),
      wasPadded: true,
    });
    (uploadFaviconImage as jest.Mock).mockResolvedValue('6a1f');

    renderWithNextIntl(<FaviconUpload value="" onChange={onChange} />);

    drop(makeFile());

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('6a1f');
    });
    expect(screen.getByText(/wasn't square/i)).toBeInTheDocument();
  });

  it('surfaces an upload failure and stores nothing', async () => {
    const onChange = jest.fn();
    (normalizeToSquarePng as jest.Mock).mockResolvedValue({
      file: makeFile(),
      wasPadded: false,
    });
    (uploadFaviconImage as jest.Mock).mockRejectedValue(
      new Error('That file is larger than 5 MB'),
    );

    renderWithNextIntl(<FaviconUpload value="" onChange={onChange} />);

    drop(makeFile());

    await waitFor(() => {
      expect(
        screen.getByText(/That file is larger than 5 MB/i),
      ).toBeInTheDocument();
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('clears the value when the favicon is removed', async () => {
    const onChange = jest.fn();
    const { container } = renderWithNextIntl(
      <FaviconUpload value="6a1f" onChange={onChange} />,
    );

    // The dropzone root also carries role="button", so target the real element.
    (container.querySelector('button[type="button"]') as HTMLButtonElement).click();

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('');
    });
  });
});
