import React from 'react';

import CustomFundraiserDonate from '../components/custom-pages/CustomFundraiserDonate';

import { screen, waitFor } from '@testing-library/react';

import { renderWithNextIntl } from './utils';

jest.mock('../utils/cachedConfig.helpers', () => ({
  getCachedConfig: jest.fn(() => ({ enabled: true, milestones: [] })),
}));

jest.mock('../utils/fundraising.helpers', () => ({
  ...jest.requireActual('../utils/fundraising.helpers'),
  fetchFundraisingBreakdown: jest.fn(async () => ({
    totalRaised: 1000,
    donorCount: 5,
  })),
}));

const renderBlock = async (
  content?: React.ComponentProps<typeof CustomFundraiserDonate>['content'],
) => {
  const view = renderWithNextIntl(<CustomFundraiserDonate content={content} />);
  await waitFor(() =>
    expect(screen.getByText('raised', { exact: false })).toBeInTheDocument(),
  );
  return view;
};

describe('CustomFundraiserDonate', () => {
  beforeAll(() => {
    process.env.NEXT_PUBLIC_FEATURE_SUPPORT_US = 'true';
  });

  it('renders only the progress card when no side content is configured', async () => {
    await renderBlock({});
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(document.querySelector('iframe')).not.toBeInTheDocument();
  });

  it('shows title, text, and a video parsed from a full YouTube URL', async () => {
    await renderBlock({
      title: 'Build the village',
      description: 'Every contribution plants a tree.',
      videoEmbedId: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    });

    expect(
      screen.getByRole('heading', { name: 'Build the village' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Every contribution plants a tree.'),
    ).toBeInTheDocument();
    const iframe = document.querySelector('iframe');
    expect(iframe?.getAttribute('src')).toContain('embed/dQw4w9WgXcQ');
  });

  it('accepts a bare YouTube embed id', async () => {
    await renderBlock({ videoEmbedId: 'dQw4w9WgXcQ' });
    const iframe = document.querySelector('iframe');
    expect(iframe?.getAttribute('src')).toContain('embed/dQw4w9WgXcQ');
  });

  it('shows a photo when an image URL is set and no video is given', async () => {
    await renderBlock({
      title: 'Build the village',
      imageUrl: 'https://cdn.example.com/photo.jpg',
    });
    expect(screen.getByAltText('Build the village')).toBeInTheDocument();
    expect(document.querySelector('iframe')).not.toBeInTheDocument();
  });

  it('prefers the video when both video and photo are configured', async () => {
    await renderBlock({
      videoEmbedId: 'dQw4w9WgXcQ',
      imageUrl: 'https://cdn.example.com/photo.jpg',
    });
    expect(document.querySelector('iframe')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
