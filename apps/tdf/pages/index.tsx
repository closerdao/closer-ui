import Head from 'next/head';
import Link from 'next/link';
import { useFeatureFlagVariantKey } from 'posthog-js/react';
import { useRouter } from 'next/router';

import { useContext, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';

import ReportDownloadModal from '../components/ReportDownloadModal';
import PhotoGallery from 'closer/components/PhotoGallery';
import LinkButton from 'closer/components/ui/LinkButton';
import UpcomingEventsIntro from 'closer/components/UpcomingEventsIntro';

import {
  Button,
  Heading,
  Tag,
  WalletState,
  YoutubeEmbed,
  useAuth,
} from 'closer';
import { useBuyTokens } from 'closer/hooks/useBuyTokens';
import { withBoldStyle } from 'closer/utils/helpers';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';
import { event } from 'nextjs-google-analytics';

const HomePage = () => {
  const t = useTranslations();

  const { isAuthenticated } = useAuth();
  const { isWalletReady } = useContext(WalletState);
  const { getTokensAvailableForPurchase } = useBuyTokens();
  const router = useRouter();
  const variant = router.query.variant as string;
  const featureFlag = useFeatureFlagVariantKey('uiVariant') || '1';
  const uiVariant = variant || featureFlag;

  const [tokensAvailable, setTokensAvailable] = useState<number | null>(null);
  const [selectedReport, setSelectedReport] = useState<{
    year: string;
    url: string;
  } | null>(null);

  useEffect(() => {
    if (isWalletReady) {
      (async () => {
        const remainingAmount = await getTokensAvailableForPurchase();
        setTokensAvailable(remainingAmount);
      })();
    }
  }, [isWalletReady]);

  const CTA = (
    <>
      <Link
        href="/stay"
        type="submit"
        className="border-accent border-2 mr-2 text-accent rounded-full py-2 px-8 text-xl uppercase hover:scale-105 duration-150"
        onClick={() =>
          event('click', {
            category: 'HomePage',
            label: t('home_cta_book_a_stay_event'),
          })
        }
      >
        {t(`home_variant_${uiVariant}_cta_support`)}
      </Link>
      <Link
        href="/stay"
        type="submit"
        className="bg-accent text-white rounded-full py-2.5 px-8 text-xl uppercase"
        onClick={() =>
          event('click', {
            category: 'HomePage',
            label: t(`home_variant_${uiVariant}_cta_book_a_stay_event`),
          })
        }
      >
        {t(`home_variant_${uiVariant}_cta_book_a_stay`)}
      </Link>
      </>
  );

  return (
    <>
      <Head>
        <title>{t(`home_variant_${uiVariant}_title`)}</title>
        <meta name="description" content={t(`home_variant_${uiVariant}_meta_description`)} />
        <link
          rel="canonical"
          href="https://www.traditionaldreamfactory.com/"
          key="canonical"
        />
      </Head>

      <section className="md:absolute md:-top-2 overflow-hidden md:left-0 md:h-[100vh] md:min-w-[100vw] md:min-h-[100vh] bg-accent-light mb-8 md:mb-[100vh]">
        <div className="md:h-[100vh]">
          {isMobile ? (
            <video
              loop={true}
              muted={true}
              autoPlay={true}
              playsInline={true}
              className="w-full h-full object-cover"
            >
              <source
                src="https://cdn.oasa.co/video/tdf-360-mute.mp4"
                type="video/mp4"
              />
            </video>
          ) : (
            <YoutubeEmbed isBackgroundVideo={true} embedId="VkoqvPcaRpk" />
          )}
        </div>
        <div className="md:absolute md:left-0 md:top-0 md:w-full md:h-full md:bg-white/60 flex justify-center ">
          <div className="w-full flex justify-center flex-col items-center">
            <div className=" max-w-4xl p-6 rounded-xl p-12">
              <Heading
                className="mb-4 text-2xl md:text-4xl md:text-6xl"
                data-testid="page-title"
                display
                level={1}
              >
                {t(`home_variant_${uiVariant}_hero_title`)}
              </Heading>
              <div className="my-4">
                <p className="text-xl md:text-2xl max-w-3xl">
                  {t(`home_variant_${uiVariant}_hero_subtitle`)}
                </p>
              </div>
              <div>{CTA}</div>
            </div>
          </div>
        </div>
      </section>

      <div className="relative md:top-[105vh]">
        <section className="mb-12 max-w-6xl mx-auto md:pt-20 md:flex md:flex-cols-2 items-center content-center space-x-8">
          <div className="md:pl-4 mt-5">
            <img src="/images/maps/co-living.png" alt="TDF Orchard Map" />
          </div>
          <div className="max-w-prose">
            <Heading className="text-center md:text-left mb-6 uppercase text-2xl font-black flex">
              {t(`home_variant_${uiVariant}_coliving_title`)}
              <span className="justify-center align-center -mt-1 ml-4">
                <Tag color="primary">{t(`home_variant_${uiVariant}_coliving_plans_approved`)}</Tag>
              </span>
            </Heading>
            <div className="md:flex md:flex-cols-2 md:space-x-2">
              <ul className="space-y-6">
                <li className="">
                  <Heading className="uppercase bold" level={3}>
                    {t(`home_variant_${uiVariant}_coliving_building_14_suites`)}
                  </Heading>
                  <p>{t(`home_variant_${uiVariant}_coliving_building_14_suites_desc`)}</p>
                </li>
                <li className="">
                  <Heading className="uppercase bold" level={3}>
                    {t(`home_variant_${uiVariant}_coliving_bioclimatic_buildings`)}
                  </Heading>
                  <p>{t(`home_variant_${uiVariant}_coliving_bioclimatic_buildings_desc`)}</p>
                </li>
                <li className="">
                  <Heading className="uppercase bold" level={3}>
                    {t(`home_variant_${uiVariant}_coliving_mixed_use`)}
                  </Heading>
                  <p>{t(`home_variant_${uiVariant}_coliving_mixed_use_desc`)}</p>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section
          className="relative flex items-center justify-end h-screen my-20 w-full bg-cover bg-center bg-[url('/images/landing/land-plan.png')]"
        >
          <div className="w-1/2 bg-white bg-opacity-80 p-20">
            <Heading display level={2} className="mb-4">
              {t('home_land_development_title')}
            </Heading>
            <p>{withBoldStyle(t('home_land_development_body'), t('home_land_development_body_bold'))}</p>
          </div>
        </section>

        <section className='max-w-4xl mx-auto py-16 md:py-24'>
          <div className="bg-accent-light/20 rounded-2xl p-8 md:p-12 flex flex-col items-center text-center shadow-lg">
            <Heading
              level={1}
              className="text-2xl md:text-4xl font-extrabold uppercase px-4 mb-8 md:mb-10 md:bg-[url('/images/token-sale/token-illy.png')] bg-no-repeat pt-[20px] md:pt-[130px] bg-top"
            >
              {t(`home_variant_${uiVariant}_token_access_title`)}
            </Heading>
            
            <p className="text-xl md:text-2xl text-center max-w-2xl mb-10">
              <span className="font-semibold">{t(`home_variant_${uiVariant}_token_access_tagline`)}</span> <br />
              <span className="text-gray-700 mt-2 block">{t(`home_variant_${uiVariant}_token_access_desc`)}</span>
            </p>
            
            <ul className="space-y-4 mb-10 max-w-2xl">
              <li className="flex items-start">
                <div className="bg-accent text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-left text-lg">{t(`home_variant_${uiVariant}_token_bullet_1`)}</span>
              </li>
              <li className="flex items-start">
                <div className="bg-accent text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-left text-lg">{t(`home_variant_${uiVariant}_token_bullet_2`)}</span>
              </li>
              <li className="flex items-start">
                <div className="bg-accent text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-left text-lg">{t(`home_variant_${uiVariant}_token_bullet_3`)}</span>
              </li>
            </ul>
            
            <LinkButton
              className="!w-64 font-bold text-xl py-4 relative transition-all duration-300 hover:scale-105 hover:shadow-xl"
              href="/token"
              size="small"
            >
              {t(`home_variant_${uiVariant}_token_cta`)}
            </LinkButton>
          </div>
        </section>

        <section className="py-20 mt-12 text-white -mx-4">
          <div className="text-center mb-20">
            <PhotoGallery className="mt-8" />
          </div>
        </section>
        
        <section>
          <div className="w-full flex justify-center flex-wrap mb-24">
            <p className="w-full font-bold uppercase text-center mb-6">
              {t(`home_variant_${uiVariant}_reports_title`)}
            </p>
            <div className="flex w-full justify-center gap-4">
              <Button
                className="w-fit"
                variant="secondary"
                onClick={() =>
                  setSelectedReport({
                    year: '2021',
                    url: '/pdf/2021-TDF-report.pdf',
                  })
                }
              >
                {t(`home_variant_${uiVariant}_reports_2021`)}
              </Button>
              <Button
                className="w-fit"
                variant="secondary"
                onClick={() =>
                  setSelectedReport({
                    year: '2022',
                    url: '/pdf/2022-TDF-report.pdf',
                  })
                }
              >
                {t(`home_variant_${uiVariant}_reports_2022`)}
              </Button>
              <Button
                className="w-fit"
                onClick={() =>
                  setSelectedReport({
                    year: '2024',
                    url: '/pdf/2024-TDF-report.pdf',
                  })
                }
              >
                {t(`home_variant_${uiVariant}_reports_2024`)}
              </Button>
            </div>
          </div>
        </section>


        {/* <section className="mb-12" id="how-to-play">
          <div>
            <div className="max-w-prose mb-12 mx-auto">
              <Heading
                level={2}
                className="text-center md:text-left mb-4 uppercase text-2xl font-black"
              >
                {t(`home_variant_${uiVariant}_how_to_play_title`)}
              </Heading>
              <p>{t(`home_variant_${uiVariant}_how_to_play_desc_1`)}</p>
              <p>{t(`home_variant_${uiVariant}_how_to_play_desc_2`)}</p>
            </div>
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 justify-center align-center">
              <div className="p-4 border-2 border-primary rounded-xl md:w-[30%]">
                <div className="flex justify-between flex-col h-full">
                  <div>
                    <Heading level={4} className="text-center">
                      {t(`home_variant_${uiVariant}_how_to_play_guest_title`)}
                    </Heading>
                    <p className="my-2 italic">
                      {t(`home_variant_${uiVariant}_how_to_play_guest_desc`)}
                    </p>
                    <ul>
                      <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                        {t(`home_variant_${uiVariant}_how_to_play_guest_bullet_1`)}
                      </li>
                      <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                        {t(`home_variant_${uiVariant}_how_to_play_guest_bullet_2`)}
                      </li>
                      <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                        {t(`home_variant_${uiVariant}_how_to_play_guest_bullet_3`)}
                      </li>
                      <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                        {t(`home_variant_${uiVariant}_how_to_play_guest_bullet_4`)}
                      </li>
                    </ul>
                  </div>
                  <div className="mt-4 mb-4 flex justify-center align-center">
                    <Link href="/stay" className="uppercase btn-primary">
                      {t(`home_variant_${uiVariant}_how_to_play_guest_cta`)}
                    </Link>
                  </div>
                </div>
              </div>
              <div className="p-4 border-2 border-primary rounded-xl md:w-[30%]">
                <div className="flex justify-between flex-col h-full">
                  <div>
                    <Heading level={4} className="text-center">
                      {t(`home_variant_${uiVariant}_how_to_play_volunteer_title`)}
                    </Heading>
                    <p className="my-2 italic">
                      {t(`home_variant_${uiVariant}_how_to_play_volunteer_desc`)}
                    </p>
                    <ul>
                      <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                        {t(`home_variant_${uiVariant}_how_to_play_volunteer_bullet_1`)}
                      </li>
                      <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                        {t(`home_variant_${uiVariant}_how_to_play_volunteer_bullet_2`)}
                      </li>
                      <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                        {t(`home_variant_${uiVariant}_how_to_play_volunteer_bullet_3`)}
                      </li>
                    </ul>
                  </div>
                  <div className="mt-4 mb-4 flex justify-center align-center">
                    <Link href="/volunteer" className="uppercase btn-primary">
                      {t(`home_variant_${uiVariant}_how_to_play_volunteer_cta`)}
                    </Link>
                  </div>
                </div>
              </div>
              <div className="p-4 border-2 border-primary rounded-xl md:w-[30%]">
                <div className="flex justify-between flex-col h-full">
                  <div>
                    <Heading level={4} className="text-center">
                      {t(`home_variant_${uiVariant}_how_to_play_resident_title`)}
                    </Heading>
                    <p className="my-2 italic">
                      {t(`home_variant_${uiVariant}_how_to_play_resident_desc`)}
                    </p>
                    <ul>
                      <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                        {t(`home_variant_${uiVariant}_how_to_play_resident_bullet_1`)}
                      </li>
                      <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                        {t(`home_variant_${uiVariant}_how_to_play_resident_bullet_2`)}
                      </li>
                      <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                        {t(`home_variant_${uiVariant}_how_to_play_resident_bullet_3`)}
                      </li>
                      <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                        {t(`home_variant_${uiVariant}_how_to_play_resident_bullet_4`)}
                      </li>
                      <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                        {t(`home_variant_${uiVariant}_how_to_play_resident_bullet_5`)}
                      </li>
                    </ul>
                  </div>
                  <div className="mt-4 mb-4 flex justify-center align-center">
                    <Link href="/projects" className="uppercase btn-primary">
                      {t(`home_variant_${uiVariant}_how_to_play_resident_cta`)}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section> */}

        {/* <section className="flex justify-center my-20 -mx-4 p-4 py-12 bg-black text-white">
          <div className="max-w-prose flex flex-wrap">
            <Heading className="text-center md:text-left mb-6 uppercase text-2xl font-black">
              {t(`home_variant_${uiVariant}_movement_title`)}
            </Heading>
            <p className="mb-8">
              {t(`home_variant_${uiVariant}_movement_desc_1`)}{' '}
              <Link
                href="https://docs.google.com/document/d/1Ocv9rtRkDxsJmeRxrL6mV07EyWcHc2YqfN8mHoylO2E/edit"
                className="underline"
              >
                {t(`home_variant_${uiVariant}_movement_link`)}
              </Link>{' '}
              {t(`home_variant_${uiVariant}_movement_desc_2`)}
            </p>
            <Link
              href="https://oasa.earth/"
              target="_blank"
              className="underline"
            >
              {t(`home_variant_${uiVariant}_movement_learn_more`)}
            </Link>
          </div>
        </section> */}

        <UpcomingEventsIntro />

        {/* this is needed because video embed in the header causes layout to be cut off at the bottom of the page */}
        <section className="mb-[120vh]"></section>

        {selectedReport && (
          <ReportDownloadModal
            closeModal={() => setSelectedReport(null)}
            reportYear={selectedReport.year}
            reportUrl={selectedReport.url}
          />
        )}
      </div>
    </>
  );
};

export default HomePage;

export async function getStaticProps({ locale }: NextPageContext) {
  return {
    props: {
      messages: await loadLocaleData(locale, 'tdf'),
    },
  };
}
