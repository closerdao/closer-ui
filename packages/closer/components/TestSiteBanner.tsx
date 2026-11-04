import { useTranslations } from 'next-intl';

// Temporary: tells staff they are on next.* against production data; delete at the tRPC cutover.
const TestSiteBanner = () => {
  const t = useTranslations();
  const sheetUrl = process.env.NEXT_PUBLIC_TEST_SITE_SHEET_URL;

  if (!sheetUrl) return null;

  return (
    <div
      id="test-site-banner"
      className="fixed inset-x-0 bottom-0 z-40 flex h-8 items-center justify-center gap-2 bg-accent px-4 text-xs text-white sm:text-sm"
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

export default TestSiteBanner;
