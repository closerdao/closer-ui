import Head from 'next/head';

import { Card, LinkButton } from 'closer/components/ui';

import { __, api, useAuth, useConfig } from 'closer';
import { HOME_PAGE_CATEGORY } from 'closer/constants';
import { formatSearch } from 'closer/utils/api';

interface Props {
  article: any;
}

const HomePage = ({ article }: Props) => {
  const { PLATFORM_NAME } = useConfig() || {};
  const { user, isAuthenticated } = useAuth();

  console.log('article=', article);
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
              <LinkButton
                type="inline"
                isFullWidth={false}
                href={`/blog/edit/${article.slug}`}
              >
                {__('edit_homepage_button')}
              </LinkButton>
            </Card>
          )}

          <section
            className="rich-text article limit-width padding-right"
            dangerouslySetInnerHTML={{ __html: article.html }}
          />
        </div>
      </div>
    </div>
  );
};

HomePage.getInitialProps = async () => {
  try {
    const search = formatSearch({ category: { $eq: HOME_PAGE_CATEGORY } });
    const res = await api.get(`/article?where=${search}`);
    console.log('res=', res.data);

    return {
      article: res.data?.results[0],
    };
  } catch (err: unknown) {
    return {
      error: err,
    };
  }
};

export default HomePage;
