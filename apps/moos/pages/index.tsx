import Head from 'next/head';
import Link from 'next/link';

import Faqs from 'closer/components/Faqs';
import { Heading } from 'closer/components/ui';

import { GeneralConfig, Resources, __, api, useAuth, useConfig } from 'closer';
import { HOME_PAGE_CATEGORY } from 'closer/constants';
import { useFaqs } from 'closer/hooks/useFaqs';
import { formatSearch } from 'closer/utils/api';

interface Props {
  generalConfig: GeneralConfig | null;
}

const HomePage = ({ generalConfig }: Props) => {
  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;
  const { APP_NAME, FAQS_GOOGLE_SHEET_ID } = useConfig() || {};
  const { faqs, error } = useFaqs(FAQS_GOOGLE_SHEET_ID);
  const { isAuthenticated } = useAuth();

  return (
    <div>
      <Head>
        <title>{`Welcome to ${PLATFORM_NAME}!`}</title>
        <meta name="description" content="Welcome Moos!" />
      </Head>
      <div className="flex w-[100vw] justify-center bg-bottom bg-cover bg-[url('/images/Moos-Halle.jpg')] h-[600px] -ml-4 -mt-6">
        <div className="max-w-6xl w-full px-6 py-12 gap-4 flex flex-col  flex-grow ">
          <div className="w-full flex justify-end flex-grow-1 h-full">
            <Heading
              className="h-full text-white uppercase text-4xl  sm:text-5xl font-extrabold w-[700px] text-right flex items-center"
              level={1}
            >
              On the border of Berlin’s historic Treptower Park, something
              beautiful is growing...
         
            </Heading>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-4">
            {!isAuthenticated && (
              <Link
                href="/signup"
                type="submit"
                className="bg-accent text-white text-center rounded-full py-2.5 px-8 text-md tracking-wide uppercase"
              >
                JOIN THE DREAM
              </Link>
            )}
            <Link
              href="/pdf/moos-menu.pdf"
              type="submit"
              className="bg-accent-light text-accent text-center rounded-full py-2.5 px-8 text-md tracking-wide uppercase"
            >
              Download Our Menu
            </Link>
          </div>
        </div>
      </div>
      <div className="flex w-full justify-center ">
        <div className="max-w-6xl w-full pt-20 flex flex-col gap-20 items-center">
          <section className="max-w-2xl flex flex-col gap-12 ">
            <Heading
              className="text-accent text-2xl font-normal text-center"
              level={2}
            >
              MOOS is a community of communities.
            </Heading>

            <div className="flex flex-col sm:flex-row gap-8">
              <div className="flex-1 flex flex-col gap-4">
                <p>
                  Located in the heart of Berlin, next to Treptower Park.
                  Hosting a regenerative community design lab, building local
                  solutions for urban challenges.{' '}
                </p>
                <p>
                  MOOS is a home where <strong>my story</strong> and{' '}
                  <strong>your story</strong> becomes <strong>our story</strong>
                  .{' '}
                </p>
                <p>
                  Did you know that we run on{' '}
                  <Link
                    href="/settings/credits"
                    className="text-accent font-bold"
                  >
                    Vybes
                  </Link>
                  ?
                </p>
                <p>
                  Vybes are community frequencies that open the portals to
                  serendipity. We don’t rent spaces at MOOS. We gift
                  experiences.{' '}
                </p>
              </div>
              <div className="flex-1 flex flex-col gap-4">
                <p>
                  Vybes can be used to create or gift experiences. Since 2012,
                  MOOS has hosted a mycelial network of experience designers.
                  Through vybes, you can organize an event at MOOS: a unique
                  opportunity to interface with Berlin’s finest creatives and
                  co-create a residential, experiential program for you and your
                  community.
                </p>
                <p>
                  Our design logistics experts can provide event support
                  alongside your stay: complete with facilitation, event
                  management, and multi-sensory experiences including catering &
                  dining 🍛.
                </p>
              </div>
            </div>

            <div className="flex  gap-4 bg-accent-light rounded-md p-4">
              <p className="flex-1">
                Learn more about our experience design + residency programs in
                our Menu{' '}
                <Link href="/pdf/moos-menu.pdf" className="text-accent font-bold">
                  here
                </Link>
              </p>
              <p className="flex-1">
                Learn more about the History of MOOS{' '}
                <Link href="/history" className="text-accent font-bold">
                  here
                </Link>
              </p>
            </div>
          </section>

          <section className="mb-12 max-w-6xl mx-auto pb-10 pt-10">
            <div className="text-center  flex flex-wrap justify-center mb-20">
              <Heading
                level={2}
                className="mb-4 uppercase w-full font-extrabold text-5xl max-w-[700px]"
              >
                {APP_NAME && __('resources_resources_heading', APP_NAME)}
              </Heading>
              <p className="mb-4 w-full">
                {APP_NAME && __('resources_resources_subheading', APP_NAME)}
              </p>
            </div>
            <Resources />
          </section>

          <section className="flex items-center flex-col max-w-4xl pb-12">
            <div className="w-full">
              <div className="text-center mb-6 flex flex-wrap justify-center">
                <Heading
                  level={2}
                  className="mb-4 uppercase w-full font-extrabold text-5xl max-w-[600px]"
                >
                  {APP_NAME && __('resources_faq_heading', APP_NAME)}
                </Heading>
                <p className="mb-4 w-full">
                  {APP_NAME && __('resources_faq_subheading', APP_NAME)}
                </p>
              </div>
              {faqs && <Faqs faqs={faqs} error={error} />}
            </div>
          </section>
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
