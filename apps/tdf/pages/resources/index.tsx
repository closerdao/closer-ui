import Head from 'next/head';

import Ama from '../../components/Ama';
import Faqs from 'closer/components/Faqs';
import Resources from 'closer/components/Resources';
import { Heading } from 'closer/components/ui';

import { useConfig } from 'closer/hooks/useConfig';
import { useFaqs } from 'closer/hooks/useFaqs';
import { __ } from 'closer/utils/helpers';

const ResourcesPage = () => {
  const { PLATFORM_NAME, APP_NAME, FAQS_GOOGLE_SHEET_ID } = useConfig() || {};
  const { faqs, error } = useFaqs(FAQS_GOOGLE_SHEET_ID);

  return (
    <div className="max-w-screen-lg mx-auto">
      <Head>
        <title>{`${__(
          'resources_heading',
          APP_NAME,
        )} - ${PLATFORM_NAME}`}</title>
      </Head>
      <main className="pt-16 pb-24 md:flex-row flex-wrap">
        <div className="flex justify-center bg-cover bg-[center_top_6rem] sm:bg-[center_top_4rem] bg-no-repeat bg-[url(/images/resources/resources-hero.png)] h-[650px]">
          <div className="flex flex-col items-center">
            <Heading
              level={1}
              className="w-[300px] sm:w-[350px] font-extrabold mb-6 uppercase text-center text-2xl sm:text-5xl"
            >
              {__('resources_heading', APP_NAME)}
            </Heading>
            <p className="mb-4 max-w-[630px]">
              {__('resources_subheading', APP_NAME)}
            </p>
          </div>
        </div>

        <section className="flex items-center flex-col py-24">
          <div className="w-full">
            <div className="text-center mb-6 flex flex-wrap justify-center">
              <Heading
                level={2}
                className="mb-4 uppercase w-full font-extrabold text-5xl max-w-[600px]"
              >
                {__('resources_faq_heading', APP_NAME)}
              </Heading>
              <p className="mb-4 w-full">
                {__('resources_faq_subheading', APP_NAME)}
              </p>
            </div>
            <Faqs faqs={faqs} error={error} />
          </div>
        </section>

        <section className="mb-12 max-w-6xl mx-auto pb-20">
          <div className="text-center  flex flex-wrap justify-center mb-20">
            <Heading
              level={2}
              className="mb-4 uppercase w-full font-extrabold text-5xl max-w-[700px] bg-[url(/images/resources/tea-cup.png)] bg-no-repeat pt-[250px] bg-top"
            >
              {__('resources_resources_heading', APP_NAME)}
            </Heading>
            <p className="mb-4 w-full">
              {__('resources_resources_subheading', APP_NAME)}
            </p>
          </div>
          <Resources />
        </section>

        <Ama id="ama" />
      </main>
    </div>
  );
};

export default ResourcesPage;
