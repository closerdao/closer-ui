import Head from 'next/head';

import { Card, Heading, LinkButton } from 'closer/components/ui';

import { GeneralConfig, __, api, useAuth, useConfig } from 'closer';
import { HOME_PAGE_CATEGORY } from 'closer/constants';
import { formatSearch } from 'closer/utils/api';

interface Props {
  article: any;
  generalConfig: GeneralConfig | null;
}

const HomePage = ({ article, generalConfig }: Props) => {
  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;

  const { user, isAuthenticated } = useAuth();

  return (
    <div>
      <Head>
        <title>{`Welcome to ${PLATFORM_NAME}!`}</title>
        <meta name="description" content="Welcome Moos!" />
      </Head>
      <div className="flex w-full justify-center">
        <div className="max-w-3xl w-full p-6 flex flex-col gap-4">
          {/* <Heading level={1}>Welcome to Moos!</Heading> */}
          {isAuthenticated && user?.roles.includes('admin') && (
            <Card className="block">
              {article ? (
                <LinkButton
                  type="inline"
                  isFullWidth={false}
                  href={`/blog/edit/${article?.slug}`}
                >
                  {__('edit_homepage_button')}
                </LinkButton>
              ) : (
                <LinkButton
                  type="inline"
                  isFullWidth={false}
                  href={'/blog/create'}
                >
                  {__('edit_homepage_button')}
                </LinkButton>
              )}
            </Card>
          )}
          {article ? (
            <section
              className="rich-text article limit-width padding-right"
              dangerouslySetInnerHTML={{ __html: article?.html }}
            />
          ) : (
            <Heading level={1}>{__('generic_coming_soon')}</Heading>
          )}
        </div>
      </div>
    </div>
  );
};

HomePage.getInitialProps = async () => {
  try {
    const search = formatSearch({ category: { $eq: HOME_PAGE_CATEGORY } });
    const [articleRes, generalRes] = await Promise.all([
      api.get(`/article?where=${search}`).catch(() => {
        return null;
      }),
      api.get('/config/general').catch(() => {
        return null;
      }),
    ]);

    const article = articleRes?.data?.results[0];
    const generalConfig = generalRes?.data?.results?.value;
    return {
      article,
      generalConfig,
    };
  } catch (err: unknown) {
    return {
      article: null,
      generalConfig: null,
      error: err,
    };
  }
};

export default HomePage;
