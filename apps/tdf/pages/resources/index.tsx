import Head from 'next/head';

// import { loadLocaleData } from 'closer/utils/locale.helpers';
import Faqs from 'closer/components/Faqs';
import PageError from 'closer/components/PageError';
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
  error: string | null;
}

const ResourcesPage = ({ generalConfig, error }: Props) => {
  const t = useTranslations();

  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;
  const { FAQS_GOOGLE_SHEET_ID } = useConfig() || {};
  const { faqs, error: faqsError } = useFaqs(FAQS_GOOGLE_SHEET_ID);

  if (error) {
    return <PageError error={error} />;
  }

  return (
    <div className="max-w-screen-lg mx-auto">
      <Head>
        <title>{`${t('resources_heading')} - ${PLATFORM_NAME}`}</title>
      </Head>
      <main className="pt-16 pb-24 md:flex-row flex-wrap">
        <div className="flex justify-center bg-cover bg-[center_top_6rem] sm:bg-[center_top_4rem] bg-no-repeat bg-[url(/images/resources/resources-hero.png)] h-[650px]">
          <div className="flex flex-col items-center">
            <Heading
              level={1}
              className="w-[300px] sm:w-[350px] font-extrabold mb-6 uppercase text-center text-2xl sm:text-5xl"
            >
              {t('resources_heading')}
            </Heading>
            <p className="mb-4 max-w-[630px]">{t('resources_subheading')}</p>
          </div>
        </div>
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
            <Faqs faqs={faqs} error={faqsError} />
          </div>
        </section>
        <section className="mb-12 max-w-6xl mx-auto pb-20">
          <div className="text-center  flex flex-wrap justify-center mb-20">
            <Heading
              level={2}
              className="mb-4 uppercase w-full font-extrabold text-5xl max-w-[700px] bg-[url(/images/resources/tea-cup.png)] bg-no-repeat pt-[250px] bg-top"
            >
              {t('resources_resources_heading')}
            </Heading>
            <p className="mb-4 w-full">{t('resources_resources_subheading')}</p>
          </div>
          <Resources />
        </section>
      </main>
    </div>
  );
};

ResourcesPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const [messages, generalRes] = await Promise.all([
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
      api.get('/config/general').catch(() => null),
    ]);
    const generalConfig = generalRes?.data?.results?.value;

    return { messages, generalConfig };
  } catch (err: unknown) {
    return {
      generalConfig: null,
      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default ResourcesPage;
