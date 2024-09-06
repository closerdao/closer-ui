import { useTranslations } from 'next-intl';

import Heading from './ui/Heading';

const PageError = ({ error }) => {
  const t = useTranslations();

  return (
    <div className="max-w-screen-sm mx-auto p-8 h-full">
      <Heading className="page-title pb-2 flex space-x-1 items-center mt-8">
        <span className="mr-1">🚨</span>
        <span>{t('page_error_title')}</span>
      </Heading>
      <div className="mt-16 flex flex-col gap-16">
        <div className="text-center">
          <p className="text-lg">{error}</p>
        </div>
      </div>
    </div>
  );
};

export default PageError;
