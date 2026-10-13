import { render, screen } from '@testing-library/react';

import TestSiteBanner, { TestSiteBannerSpacer } from '../TestSiteBanner';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/test';

describe('TestSiteBanner', () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_TEST_SITE_SHEET_URL;
  });

  it('shows the notice and a new-tab link to the sheet when the URL is set', () => {
    process.env.NEXT_PUBLIC_TEST_SITE_SHEET_URL = SHEET_URL;
    render(<TestSiteBanner />);

    expect(screen.getByText('test_site_banner_text')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'test_site_banner_link' });
    expect(link).toHaveAttribute('href', SHEET_URL);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders nothing when the URL is unset', () => {
    const { container } = render(
      <>
        <TestSiteBanner />
        <TestSiteBannerSpacer />
      </>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when the URL is empty', () => {
    process.env.NEXT_PUBLIC_TEST_SITE_SHEET_URL = '';
    const { container } = render(
      <>
        <TestSiteBanner />
        <TestSiteBannerSpacer />
      </>,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
