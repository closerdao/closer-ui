import { useTranslations } from 'next-intl';

// Temporary: tells staff they are on next.* against production data; delete at the tRPC cutover.
export const isTestSite = () =>
  Boolean(process.env.NEXT_PUBLIC_TEST_SITE_SHEET_URL);

const TestSiteBanner = () => {
  const t = useTranslations();
  const sheetUrl = process.env.NEXT_PUBLIC_TEST_SITE_SHEET_URL;

  if (!sheetUrl) return null;

  return (
    <div
      className="flex h-8 items-center justify-center gap-2 bg-accent px-4 text-xs text-white sm:text-sm"
      data-testid="test-site-banner"
    >
      <span className="truncate">{t('test_site_banner_text')}</span>
      <a
        href={sheetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 font-bold underline"
      >
        {t('test_site_banner_link')}
      </a>
    </div>
  );
};

// The nav is fixed, so the page needs the banner's height pushed into the flow.
export const TestSiteBannerSpacer = () =>
  isTestSite() ? <div className="h-8" aria-hidden="true" /> : null;

export default TestSiteBanner;
