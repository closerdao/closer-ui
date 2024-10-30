import Head from 'next/head';
import Image from 'next/image';

// import { loadLocaleData } from 'closer/utils/locale.helpers';
import PageError from 'closer/components/PageError';
import { Card, Heading, LinkButton } from 'closer/components/ui';

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
      <main className=" pb-24">
        <section className="w-full flex justify-center max-w-4xl mx-auto mb-4">
          <Image
            alt="Traditional Dream Factory Builders Residency"
            src="/images/builders-l.png"
            width={1344}
            height={600}
          />
        </section>
        <section className=" w-full flex justify-center">
          <div className="max-w-4xl w-full ">
            <div className="w-full py-2">
              <div className="w-full flex flex-col sm:flex-row gap-4 sm:gap-8">
                <div className="flex gap-1 items-center min-w-[120px]">
                  <Image
                    alt="calendar icon"
                    src="/images/icons/calendar-icon.svg"
                    width={20}
                    height={20}
                  />
                  <label className="text-sm uppercase font-bold flex gap-1">
                    October 2024 - December 2025
                  </label>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className=" w-full flex justify-center min-h-[400px]">
          <div className="max-w-4xl w-full">
            <div className="flex flex-col sm:flex-row">
              <div className="flex items-start justify-between gap-6 w-full">
                <div className="flex flex-col gap-10 w-full sm:w-2/3 overflow-hidden">
                  <Heading level={1} className="md:text-4xl mt-4 font-bold">
                    Builders Residency Open Call
                  </Heading>

                  <div className="flex flex-col gap-6">
             
                    <p>
                      We are starting to build! TDF has secured funding to start
                      major renovations. In Jan 2025, the first phase of
                      accommodation will start with a professional contractor,
                      and alongside that, we are self-building various projects
                      to support the opening of TDF V2.
                    </p>

                    <p>
                      <strong className='uppercase'>Requirements: </strong> 6 hours per day, 1 month minimum ✅. Free
                      accommodation & food (glamping tents and dorms available,
                      or bring your van)
                    </p>

                    <p>
                      <strong className="uppercase">
                        Token rewards for completed projects!💰
                      </strong>{' '}
                      We will be offering tokens to builders who take projects
                      from start to completion. Rewards will be negotiated with
                      the team.
                    </p>

                    <p>
                      <strong className="uppercase">Community culture: </strong>
                      Experience co-living with fellow builders and the TDF
                      team. We will have regular community activities, saunas,
                      experiential dinners, music jams, music jams, embodiment
                      practices, yoga, massage, and more 🥙💃🏽🔥🎶🎭
                    </p>

                    <Heading level={2} className='text-lg uppercase'>Build Projects 🛠🏡🛕</Heading>
                    <ul>
                      <li>
                        <strong>BioPool:</strong> Concrete & Geomembrane
                        installation with ceramic tiling.
                      </li>
                      <li>
                        <strong>Small House:</strong> New windows, insulation,
                        opening up central lounge, building mezzanine,
                        refurbishment, and furniture build.
                      </li>
                      <li>
                        <strong>Temple:</strong> Sealing the walls and pool
                        construction. Adding stretch roof.
                      </li>
                      <li>
                        <strong>Workshops</strong> 
                      </li>
                      <li>
                        <strong>Activity Space:</strong> Full refurbishment with
                        new floors and mezzanine, electrics, plumbing,
                        insulation, roof tiling.
                      </li>
                      <li>
                        <strong>Mushroom Farm:</strong> Design/construction of a
                        mushroom cultivation farm inside two containers, at the
                        back end of the biopool. Design of operation from
                        cultivation facilities to harvesting, processing,
                        storage, and packaging.
                      </li>
                      <li>
                        <strong>GreenHouse:</strong> Design/construction of
                        greenhouse at the edge of living spaces.
                      </li>
                    </ul>

                    <Heading level={2} className='text-lg uppercase'>Skill & qualifications that can support us 👍🏼</Heading>
                    <ul>
                      <li>Practical build skills</li>
                      <li>Electrical</li>
                      <li>Plumbing</li>
                      <li>Cement & plastering</li>
                      <li>Carpentry</li>
                      <li>Painting & decorating</li>
                      <li>Stoneworks</li>
                      <li>Tools & machinery operation</li>
                      <li>Design & drawing skills</li>
                    </ul>


                    <p>
                      <strong className="uppercase">Time frame: </strong> Starting October 2024 - December 2025 🗓.
                    </p>
                    <p>
                      We are ideally looking for people to join us from October
                      and stay with the team over winter, but the build will
                      continue to the end of next year.
                    </p>
                  </div>
                </div>
                <div className="h-auto fixed bottom-0 left-0 sm:sticky sm:top-[100px] w-full sm:w-[250px]">
                  <Card className="bg-white border border-gray-100">
                    <LinkButton href="/">{t('apply_submit_button')}</LinkButton>
                  </Card>
                </div>
              </div>
            </div>
          </div>
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
