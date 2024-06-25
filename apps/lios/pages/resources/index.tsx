import Head from 'next/head';
import Image from 'next/image';

import Faqs from 'closer/components/Faqs';
import { Heading, LinkButton } from 'closer/components/ui';

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
  const { FAQS_GOOGLE_SHEET_ID } = useConfig() || {};
  const { faqs, error } = useFaqs(FAQS_GOOGLE_SHEET_ID);

  return (
    <div>
      <Head>
        <title>{`${t('resources_heading')} - ${PLATFORM_NAME}`}</title>
      </Head>
      <section className="h-[900px] overflow-scroll w-[100vw] -mx-4 px-4  pt-12 pb-20 flex justify-center bg-[url(/images/lios-faq.jpg)] bg-cover bg-center">
        <div className="flex flex-col gap-8 items-center w-full sm:w-[600px] ">
          <div className="text-center mb-6 flex flex-wrap justify-center">
            <Heading
              level={2}
              className="mb-4 uppercase w-full font-extrabold text-5xl max-w-[600px]"
            >
              {t('resources_heading')}
            </Heading>
            <p className="mb-4 w-full">{t('resources_faq_subheading')}</p>
          </div>
          <Faqs faqs={faqs} error={error} isExpanded />
        </div>
      </section>

      <section className="min-h-[600px] w-[100vw] -mx-4 pt-12 pb-10 px-4 md:flex justify-center bg-neutral">
        <div className="flex flex-col gap-8 items-center">
          <Image
            src="/images/planetary-movement.png"
            alt="Lios planetary movement"
            width={380}
            height={342}
          />

          <Heading level={2} className="text-2xl uppercase text-center">
            Desert Transformation lab
          </Heading>

          <LinkButton
            href="https://lios.io/deserttransformation"
            className="w-[150px]"
          >
            Website
          </LinkButton>
          <LinkButton href="https://lios.io/program" className="w-[250px]">
            PROGRAMME OUTLINE
          </LinkButton>
          <LinkButton
            href="https://drive.google.com/file/d/1W7wgWGboRayeAJZcTP9P9OrQgbhj4NkT/view?usp=drive_link"
            className="w-[250px]"
          >
            Desert Guidelines
          </LinkButton>
        </div>
      </section>
    </div>
  );
};

ResourcesPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const messages = await loadLocaleData(
      context?.locale,
      process.env.NEXT_PUBLIC_APP_NAME,
    );
    const generalRes = await api.get('/config/general').catch(() => null);
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
