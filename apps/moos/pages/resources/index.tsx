import Head from 'next/head';

import Faqs from 'closer/components/Faqs';
import Resources from 'closer/components/Resources';
import { Heading } from 'closer/components/ui';

import { GeneralConfig, api } from 'closer';
import { useConfig } from 'closer/hooks/useConfig';
import { useFaqs } from 'closer/hooks/useFaqs';
import { parseMessageFromError } from 'closer/utils/common';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

interface Props {
  generalConfig: GeneralConfig | null;
}

const ResourcesPage = ({ generalConfig }: Props) => {
  const t = useTranslations();
  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;
  const { APP_NAME, FAQS_GOOGLE_SHEET_ID } = useConfig() || {};
  const appName = APP_NAME.toLowerCase();
  const { faqs, error } = useFaqs(FAQS_GOOGLE_SHEET_ID);

  return (
    <div className="max-w-screen-lg mx-auto">
      <Head>
        <title>{`${t('resources_heading')} - ${PLATFORM_NAME}`}</title>
      </Head>
      <main className="pt-16 pb-24 flex flex-col gap-12">
        <section className="flex justify-center ">
          <div className="flex flex-col items-center">
            <Heading
              level={1}
              className="w-[300px] sm:w-[350px] font-extrabold mb-6 uppercase text-center text-2xl sm:text-5xl"
            >
              {t('resources_heading')}
            </Heading>
            <p className="mb-4 max-w-[630px]">{t('resources_subheading')}</p>
            <Resources />
          </div>
        </section>

        <section className="flex items-center flex-col py-24">
          <div className="w-full">
            <div className="text-center mb-6 flex flex-wrap justify-center">
              <Heading
                level={2}
                className="mb-4 uppercase w-full font-extrabold text-5xl max-w-[600px]"
              >
                {t('resources_faq_heading')}
              </Heading>
              <p className="mb-4 w-full">{t('resources_faq_subheading')}</p>
            </div>
            <Faqs faqs={faqs} error={error} />
          </div>
        </section>

        {appName === 'tdf' && (
          <section className="mb-12 max-w-6xl mx-auto pb-20">
            <div className="text-center  flex flex-wrap justify-center mb-20">
              <Heading
                level={2}
                className="mb-4 uppercase w-full font-extrabold text-5xl max-w-[700px] bg-[url(/images/resources/tea-cup.png)] bg-no-repeat pt-[250px] bg-top"
              >
                {t('resources_resources_heading')}
              </Heading>
              <p className="mb-4 w-full">
                {t('resources_resources_subheading')}
              </p>
            </div>

            <Resources />
          </section>
        )}
      </main>
    </div>
  );
};

ResourcesPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const [generalRes, messages] = await Promise.all([
      api.get('/config/general').catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const generalConfig = generalRes?.data?.results?.value;
    return {
      generalConfig,
      messages,
    };
  } catch (err: unknown) {
    return {
      generalConfig: null,
      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default ResourcesPage;
