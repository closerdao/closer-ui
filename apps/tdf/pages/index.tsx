import Head from 'next/head';
import Link from 'next/link';

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
import api from 'closer/utils/api';
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

  const CTA = isAuthenticated ? (
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
        Support (10€/m)
      </Link>
      <Link
        href="/stay"
        type="submit"
        className="bg-accent text-white rounded-full py-2.5 px-8 text-xl uppercase hover:scale-105 duration-150"
        onClick={() =>
          event('click', {
            category: 'HomePage',
            label: t('home_cta_book_a_stay_event'),
          })
        }
      >
        {/* {t('home_cta_book_a_stay')} */}
        Come visit us
      </Link>
      </>
  ) : (
    <Link
      href="/signup"
      type="submit"
      className="bg-accent text-white rounded-full py-2.5 px-8 text-xl uppercase"
      onClick={() =>
        event('click', {
          category: 'HomePage',
          label: t('home_cta_join_the_dream_event'),
        })
      }
    >
      {t('home_cta_join_the_dream')}
    </Link>
  );

  return (
    <>
      <Head>
        <title>{t('home_title')}</title>
        <meta name="description" content={t('home_meta_description')} />
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
                {t('home_hero_title')}
              </Heading>
              <div className="my-4">
                <p className="text-xl md:text-2xl max-w-3xl">
                  {t('home_hero_subtitle')}
                </p>
              </div>
              <div>{CTA}</div>
            </div>
          </div>
        </div>
      </section>

      <div className="relative md:top-[105vh]">
        <section className="mb-12 max-w-6xl mx-auto md:pt-20 md:flex md:flex-cols-2">
          <div className="md:max-w-xl">
            <Heading
              level={2}
              display
              className="text-center md:text-left mb-6 md:text-6xl"
            >
              {t('home_about_title')}
            </Heading>

            <p className="text-center md:text-left mb-6">
              {t('home_about_subtitle')}
            </p>
            <div className="md:flex md:flex-cols-2 md:space-x-6">
              <ul className="space-y-6 md:w-1/2">
                <li className="flex justify-start items-center">
                  <img
                    src="/images/icons/cowork.png"
                    alt="Coworking"
                    className="mr-1 w-12"
                  />
                  <Heading display level={4} className="md:text-sm">
                    {t('home_about_coworking')}
                  </Heading>
                </li>
                <li className="flex justify-start items-center">
                  <img
                    src="/images/icons/van.png"
                    alt="Van"
                    className="mr-1 w-12"
                  />
                  <Heading display level={4} className="md:text-sm">
                    {t('home_about_van_parking')}
                  </Heading>
                </li>
                <li className="flex justify-start items-center">
                  <img
                    src="/images/icons/foodforest.png"
                    alt="Syntropic food forest"
                    className="mr-1 w-12"
                  />
                  <Heading display level={4} className="md:text-sm">
                    {t('home_about_food_forest')}
                    <p className="text-sm font-light">
                      {t('home_about_food_forest_sub')}
                    </p>
                  </Heading>
                </li>
                <li className="flex justify-start items-center">
                  <img
                    src="/images/icons/veggies.png"
                    alt="Veggetable production"
                    className="mr-1 w-12"
                  />
                  <Heading display level={4} className="md:text-sm">
                    {t('home_about_market_garden')}
                  </Heading>
                </li>
                <li className="flex justify-start items-center">
                  <img
                    src="/images/icons/cafe.png"
                    alt="TDF Cafe"
                    className="mr-1 w-12"
                  />
                  <Heading display level={4} className="md:text-sm">
                    {t('home_about_mushroom_farm')}
                    <Tag className="m-1" color="primary">
                      {t('home_about_coming_soon')}
                    </Tag>
                  </Heading>
                </li>
              </ul>
              <ul className="space-y-6 md:w-1/2">
                <li className="flex justify-start items-center">
                  <img
                    src="/images/icons/event.png"
                    alt="Events"
                    className="mr-1 w-12"
                  />
                  <Heading display level={4} className="md:text-sm">
                    {t('home_about_event_space')}
                  </Heading>
                </li>
                <li className="flex justify-start items-center">
                  <img
                    src="/images/icons/event.png"
                    alt="Events"
                    className="mr-1 w-12"
                  />
                  <Heading display level={4} className="md:text-sm">
                    {t('home_about_sauna')}
                  </Heading>
                </li>
                <li className="flex justify-start items-center">
                  <img
                    src="/images/icons/wellness.png"
                    alt="Wellness candle"
                    className="mr-1 w-12"
                  />
                  <Heading display level={4} className="md:text-sm">
                    {t('home_about_natural_pool')}
                    <Tag className="m-1" color="primary">
                      {t('home_about_coming_soon')}
                    </Tag>
                  </Heading>
                </li>
                {/* <li className="flex justify-start items-center">
                  <img
                    src="/images/icons/restaurant.png"
                    alt="Restaurant plate"
                    className="mr-1 w-12"
                  />
                  <Heading display level={4} className="md:text-sm">
                    {t('home_about_pizza_oven')}
                  </Heading>
                </li> */}
                <li className="flex justify-start items-center">
                  <img
                    src="/images/icons/cafe.png"
                    alt="TDF Cafe"
                    className="mr-1 w-12"
                  />
                  <Heading display level={4} className="md:text-sm">
                    {t('home_about_coffee_shop')}
                  </Heading>
                </li>
                <li className="flex justify-start items-center">
                  <img
                    src="/images/icons/makerspace.png"
                    alt="Makerspace"
                    className="mr-1 w-12"
                  />
                  <Heading display level={4} className="md:text-sm">
                    {t('home_about_makerspace')}
                  </Heading>
                </li>
              </ul>
            </div>
          </div>
          <div className="md:pl-16">
            <img src="/images/landing/tdf-map.png" alt="TDF Map" />
          </div>
        </section>
        <section>
          <div className="w-full flex justify-center flex-wrap mb-24">
            <p className="w-full font-bold uppercase text-center mb-6">
              {t('home_reports_title')}
            </p>
            <div className="flex w-full justify-center gap-4">
              <Button
                className="w-fit"
                onClick={() =>
                  setSelectedReport({
                    year: '2021',
                    url: '/pdf/2021-TDF-report.pdf',
                  })
                }
              >
                {t('home_reports_2021')}
              </Button>
              <Button
                className="w-fit"
                onClick={() =>
                  setSelectedReport({
                    year: '2022',
                    url: '/pdf/2022-TDF-report.pdf',
                  })
                }
              >
                {t('home_reports_2022')}
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
                {t('home_reports_2024')}
              </Button>
            </div>
          </div>
        </section>

        <section className="mb-12 max-w-6xl mx-auto md:pt-20 md:flex md:flex-cols-2 space-x-4">
          <div>
            <div className="md:pl-4 mt-5">
              <img src="/images/maps/co-living.png" alt="TDF Orchard Map" />
            </div>
          </div>
          <div className="max-w-prose">
            <Heading className="text-center md:text-left mb-6 uppercase text-2xl font-black flex">
              {t('home_coliving_title')}
              <span className="justify-center align-center -mt-1 ml-4">
                <Tag color="primary">{t('home_coliving_plans_approved')}</Tag>
              </span>
            </Heading>
            <div className="md:flex md:flex-cols-2 md:space-x-2">
              <ul className="space-y-6">
                <li className="">
                  <Heading className="uppercase bold" level={3}>
                    {t('home_coliving_building_14_suites')}
                  </Heading>
                  <p>{t('home_coliving_building_14_suites_desc')}</p>
                </li>
                <li className="">
                  <Heading className="uppercase bold" level={3}>
                    {t('home_coliving_bioclimatic_buildings')}
                  </Heading>
                  <p>{t('home_coliving_bioclimatic_buildings_desc')}</p>
                </li>
                <li className="">
                  <Heading className="uppercase bold" level={3}>
                    {t('home_coliving_mixed_use')}
                  </Heading>
                  <p>{t('home_coliving_mixed_use_desc')}</p>
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

        <section className='max-w-4xl mx-auto flex text-center items-center flex-col'>
          <Heading
            level={1}
            className="text-2xl md:text-4xl font-extrabold uppercase px-4 mt-1 md:mt-[100px] md:bg-[url('/images/token-sale/token-illy.png')] bg-no-repeat pt-[20px] md:pt-[130px] bg-top"
          >
            Liquid access & governance, <br />
            powered by the $TDF Token
          </Heading>
          <p
            className="text-xl text-center"
          >
            Think of <b>$TDF</b> as a perpetual digital access right—simple to buy, easy to hold. <br/>
            It turns guests into co-stewards and gives every holder a say in how the village grows.
          </p>
          <ul className="m-6">
            <li><strong>Unlock space.</strong> Tokens open doors to suites, studios, and future villages.</li>
            <li><strong>Have a voice.</strong> Vote on budgets, new builds, and community rules—no crypto know-how needed.</li>
            <li><strong>Share the upside.</strong> As the village earns, a slice funds land projects and stay credits for active members.</li>
          </ul>
          <LinkButton
            className="!w-60 font-bold mb-3 md:mb-8 relative text-xl mx-4"
            href="/token"
            size="small"
          >
            {t('token_sale_public_sale_buy_token')}
          </LinkButton>

          {tokensAvailable && (
            <h3 className="font-bold text-xl text-white pb-2 text-center w-60 px-6 rounded-full">
              {tokensAvailable} {t('token_sale_public_sale_tokens_left')}
            </h3>
          )}
        </section>
        {/* <section className='-ml-4 w-[calc(100vw)] mb-20 h-[600px] md:h-[700px] flex  items-end md:items-center flex-col bg-center bg-[#333333] bg-cover bg-no-repeat text-white bg-[url("/images/token-sale/token-sale-hero.webp")]'>
          <Heading
            level={1}
            className="text-right  text-3xl md:text-6xl font-extrabold uppercase px-4 drop-shadow-lg mb-2 md:mb-8 md:text-center max-w-[700px] mt-1 md:mt-[100px] md:bg-[url('/images/token-sale/token-illy.png')] bg-no-repeat pt-[20px] md:pt-[130px] bg-top"
          >
            {t('home_token_hero_title')}
          </Heading>
          <Heading
            level={2}
            className="font-bold text-right uppercase md:text-center px-4 text-xl md:text-md max-w-[700px] mb-4"
          >
            {t('home_token_hero_subtitle')}
          </Heading>
          <LinkButton
            className="!w-60 font-bold mb-3 md:mb-8 relative text-xl mx-4"
            href="/token"
            size="small"
          >
            {t('token_sale_public_sale_buy_token')}
          </LinkButton>

          {tokensAvailable && (
            <h3 className="font-bold text-xl text-white pb-2 text-center w-60 px-6 rounded-full">
              {tokensAvailable} {t('token_sale_public_sale_tokens_left')}
            </h3>
          )}
        </section> */}

        {/*  
        <section id="join" className="max-w-6xl mx-auto py-20">
          <h2 className="text-3xl font-bold mb-10 text-center">Three Ways to Join</h2>
          <article className="mb-12">
            <h3 className="text-2xl font-semibold">
              <strong>Book&nbsp;a&nbsp;Stay</strong>
            </h3>
            <p className="mt-2">
              Remote-work by day, harvest lunch from the garden, sauna at dusk.
              Discounts after one week.
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Remote-work by day, harvest lunch from the garden, sauna at dusk. <a href="">Book a stay</a></li>
              <li>Volunteer 4h/day</li>
            </ul>
          </article><article className="mb-12">
            <h3 className="text-2xl font-semibold">
              <span className="font-bold">&nbsp;Friend</span> — <strong>Support €10 / month</strong>
            </h3>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Access to our digital community</li>
              <li>Access to learning hub</li>
            </ul>
            <p className="mt-1 text-sm italic">Cancel anytime — no crypto required.</p>
          </article>

          <article>
            <h3 className="text-2xl font-semibold">
              <span className="font-bold">&nbsp;Co-Owner</span> — <strong>Buy $TDF</strong>
            </h3>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Lifetime <strong>access rights</strong></li>
              <li>Vote on governance proposals</li>
              <li>Path to Citizenship</li>
            </ul>
            <p className="mt-1 text-sm italic">
              No wallet? You can pay with bank transfer — we’ll sort the tech.
            </p>
          </article>
        </section> */}

        <section className="py-20 my-12 text-white -mx-4">
          <div className="text-center mb-20">
            <PhotoGallery className="mt-8" />
          </div>
        </section>


        {/* <section className="mb-12" id="how-to-play">
          <div>
            <div className="max-w-prose mb-12 mx-auto">
              <Heading
                level={2}
                className="text-center md:text-left mb-4 uppercase text-2xl font-black"
              >
                {t('home_how_to_play_title')}
              </Heading>
              <p>{t('home_how_to_play_desc_1')}</p>
              <p>{t('home_how_to_play_desc_2')}</p>
            </div>
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 justify-center align-center">
              <div className="p-4 border-2 border-primary rounded-xl md:w-[30%]">
                <div className="flex justify-between flex-col h-full">
                  <div>
                    <Heading level={4} className="text-center">
                      {t('home_how_to_play_guest_title')}
                    </Heading>
                    <p className="my-2 italic">
                      {t('home_how_to_play_guest_desc')}
                    </p>
                    <ul>
                      <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                        {t('home_how_to_play_guest_bullet_1')}
                      </li>
                      <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                        {t('home_how_to_play_guest_bullet_2')}
                      </li>
                      <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                        {t('home_how_to_play_guest_bullet_3')}
                      </li>
                      <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                        {t('home_how_to_play_guest_bullet_4')}
                      </li>
                    </ul>
                  </div>
                  <div className="mt-4 mb-4 flex justify-center align-center">
                    <Link href="/stay" className="uppercase btn-primary">
                      {t('home_how_to_play_guest_cta')}
                    </Link>
                  </div>
                </div>
              </div>
              <div className="p-4 border-2 border-primary rounded-xl md:w-[30%]">
                <div className="flex justify-between flex-col h-full">
                  <div>
                    <Heading level={4} className="text-center">
                      {t('home_how_to_play_volunteer_title')}
                    </Heading>
                    <p className="my-2 italic">
                      {t('home_how_to_play_volunteer_desc')}
                    </p>
                    <ul>
                      <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                        {t('home_how_to_play_volunteer_bullet_1')}
                      </li>
                      <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                        {t('home_how_to_play_volunteer_bullet_2')}
                      </li>
                      <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                        {t('home_how_to_play_volunteer_bullet_3')}
                      </li>
                    </ul>
                  </div>
                  <div className="mt-4 mb-4 flex justify-center align-center">
                    <Link href="/volunteer" className="uppercase btn-primary">
                      {t('home_how_to_play_volunteer_cta')}
                    </Link>
                  </div>
                </div>
              </div>
              <div className="p-4 border-2 border-primary rounded-xl md:w-[30%]">
                <div className="flex justify-between flex-col h-full">
                  <div>
                    <Heading level={4} className="text-center">
                      {t('home_how_to_play_resident_title')}
                    </Heading>
                    <p className="my-2 italic">
                      {t('home_how_to_play_resident_desc')}
                    </p>
                    <ul>
                      <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                        {t('home_how_to_play_resident_bullet_1')}
                      </li>
                      <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                        {t('home_how_to_play_resident_bullet_2')}
                      </li>
                      <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                        {t('home_how_to_play_resident_bullet_3')}
                      </li>
                      <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                        {t('home_how_to_play_resident_bullet_4')}
                      </li>
                      <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                        {t('home_how_to_play_resident_bullet_5')}
                      </li>
                    </ul>
                  </div>
                  <div className="mt-4 mb-4 flex justify-center align-center">
                    <Link href="/projects" className="uppercase btn-primary">
                      {t('home_how_to_play_resident_cta')}
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
              {t('home_movement_title')}
            </Heading>
            <p className="mb-8">
              {t('home_movement_desc_1')}{' '}
              <Link
                href="https://docs.google.com/document/d/1Ocv9rtRkDxsJmeRxrL6mV07EyWcHc2YqfN8mHoylO2E/edit"
                className="underline"
              >
                {t('home_movement_link')}
              </Link>{' '}
              {t('home_movement_desc_2')}
            </p>
            <Link
              href="https://oasa.earth/"
              target="_blank"
              className="underline"
            >
              {t('home_movement_learn_more')}
            </Link>
          </div>
        </section> */}

        <UpcomingEventsIntro />

        {/* this is needed because video embed in the header causes layout to be cut off at the bottom of the page */}
        <section className="mb-[120vh]"></section>
      </div>
      {selectedReport && (
        <ReportDownloadModal
          closeModal={() => setSelectedReport(null)}
          reportYear={selectedReport.year}
          reportUrl={selectedReport.url}
        />
      )}
    </>
  );
};

HomePage.getInitialProps = async (context: NextPageContext) => {
  try {
    const [subsRes, messages] = await Promise.all([
      api.get('/config/subscriptions').catch(() => null),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);
    const subscriptionsConfig = subsRes?.data?.results?.value.plans;

    return {
      subscriptionsConfig,
      messages,
    };
  } catch (err) {
    return {
      subscriptionsConfig: { enabled: false, plans: [] },
      error: err,
      messages: null,
    };
  }
};

export default HomePage;
