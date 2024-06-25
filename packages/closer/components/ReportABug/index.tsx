import Link from 'next/link';

import { useTranslations } from 'next-intl';

const ReportABug = () => {
  const t = useTranslations();
  return (
    <p className="text-center mt-4">
      🐛
      <Link
        className="text-accent underline"
        href="https://forms.gle/uQQhTiFu5PRtu7Ei9"
        target="_blank"
      >
        {t('report_a_bug')}
      </Link>
    </p>
  );
};

export default ReportABug;
