import React from 'react';

import { useRouter } from 'next/router';
import { useTranslations } from 'next-intl';

import StaySearchBar from '../StaySearchBar';
import { Heading } from '../ui';
import { useConfig } from '../../hooks/useConfig';
import { resolveBlockText } from '../../utils/blockI18n';

const CustomStaySearch: React.FC<{
  settings?: Record<string, unknown>;
  content: {
    title?: string;
    subtitle?: string;
  };
}> = ({ content }) => {
  const t = useTranslations();
  const router = useRouter();
  const config = useConfig();
  const bookingSettings = config?.booking ?? null;

  const title = content?.title?.trim()
    ? resolveBlockText(content.title, t)
    : '';
  const subtitle = content?.subtitle?.trim()
    ? resolveBlockText(content.subtitle, t)
    : '';

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col gap-6">
        {title ? (
          <Heading level={2} className="text-center text-3xl font-normal">
            {title}
          </Heading>
        ) : null}
        {subtitle ? (
          <p className="text-center text-gray-600">{subtitle}</p>
        ) : null}
        {bookingSettings?.enabled ? (
          <StaySearchBar
            bookingSettings={bookingSettings}
            onSearch={(params) =>
              router.push({
                pathname: '/stay/create',
                query: {
                  start: params.start,
                  end: params.end,
                  adults: String(params.adults),
                  children: String(params.children),
                  infants: String(params.infants),
                  pets: String(params.pets),
                },
              })
            }
          />
        ) : (
          <p className="text-center text-sm text-gray-500">
            {t('pages_editor_stay_search_unavailable')}
          </p>
        )}
      </div>
    </section>
  );
};

export default CustomStaySearch;
