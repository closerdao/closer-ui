import Head from 'next/head';

import { Card, Heading, LinkButton } from 'closer/components/ui';

import { GeneralConfig, api, useAuth, useConfig } from 'closer';
import { HOME_PAGE_CATEGORY } from 'closer/constants';
import { formatSearch } from 'closer/utils/api';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

interface Props {
  article: any;
  generalConfig: GeneralConfig | null;
}

const HistoryPage = ({ article, generalConfig }: Props) => {
  const t = useTranslations();
  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;

  const { user, isAuthenticated } = useAuth();

  return (
    <div>
      <Head>
        <title>{`History of ${PLATFORM_NAME}!`}</title>
        <meta name="description" content="Welcome Moos!" />
      </Head>

      <div className="flex w-full justify-center ">
        <div className="max-w-6xl w-full flex flex-col gap-4 items-center">
          <div>
            {isAuthenticated && user?.roles.includes('admin') && (
              <Card className="block w-full max-w-3xl mb-6">
                {article ? (
                  <LinkButton
                    variant="inline"
                    className="w-[200px]"
                    isFullWidth={false}
                    href={`/blog/edit/${article?.slug}`}
                  >
                    {t('edit_homepage_button')}
                  </LinkButton>
                ) : (
                  <LinkButton
                    variant="inline"
                    className="w-[200px]"
                    isFullWidth={false}
                    href={'/blog/create'}
                  >
                    {t('edit_homepage_button')}
                  </LinkButton>
                )}
              </Card>
            )}
            <Heading level={1}>History of MOOS</Heading>
            {article ? (
              <section
                className="rich-text article max-w-3xl padding-right"
                dangerouslySetInnerHTML={{ __html: article?.html }}
              />
            ) : (
              <Heading level={1}>{t('generic_coming_soon')}</Heading>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

HistoryPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const search = formatSearch({ category: { $eq: HOME_PAGE_CATEGORY } });
    const [articleRes, generalRes, messages] = await Promise.all([
      api.get(`/article?where=${search}`).catch(() => {
        return null;
      }),
      api.get('/config/general').catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const article = articleRes?.data?.results[0];
    const generalConfig = generalRes?.data?.results?.value;
    return {
      article,
      generalConfig,
      messages,
    };
  } catch (err: unknown) {
    return {
      article: null,
      generalConfig: null,
      error: err,
      messages: null,
    };
  }
};

export default HistoryPage;
