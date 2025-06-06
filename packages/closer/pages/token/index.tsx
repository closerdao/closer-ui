import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useContext, useEffect, useRef, useState } from 'react';

import Ama from '../../components/Ama';
import Modal from '../../components/Modal';
import PeekIntoFuture from '../../components/PeekIntoFuture';
import TokenCounterSimple from '../../components/TokenCounterSimple';
import YoutubeEmbed from '../../components/YoutubeEmbed';
import { Button, Card, Heading } from '../../components/ui';

import { NextPageContext } from 'next';
// import { INVESTMENT_COMPARISON } from '../../constants';
import { useTranslations } from 'next-intl';

import { MAX_LISTINGS_TO_FETCH } from '../../constants';
import { WalletState } from '../../contexts/wallet';
import { useBuyTokens } from '../../hooks/useBuyTokens';
import { useConfig } from '../../hooks/useConfig';
import { GeneralConfig, Listing } from '../../types';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { loadLocaleData } from '../../utils/locale.helpers';

const ACCOMMODATION_ICONS = ['van.png', 'camping.png', 'hotel.png'];
const DEFAULT_TOKENS = 10;

interface Props {
  listings: Listing[];
  generalConfig: GeneralConfig | null;
}

const PublicTokenSalePage = ({ listings, generalConfig }: Props) => {
  const t = useTranslations();
  const defaultConfig = useConfig();
  const hasComponentRendered = useRef(false);

  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;
  const { getTokensAvailableForPurchase } = useBuyTokens();
  const { isWalletReady } = useContext(WalletState);

  const router = useRouter();
  const { tokens } = router.query;

  const [tokensToBuy, setTokensToBuy] = useState<number>(
    tokens !== undefined ? Number(tokens) : DEFAULT_TOKENS,
  );

  const [tokensAvailable, setTokensAvailable] = useState<number | null>(null);
  const [isInfoModalOpened, setIsInfoModalOpened] = useState(false);

  useEffect(() => {
    if (isWalletReady) {
      (async () => {
        const remainingAmount = await getTokensAvailableForPurchase();
        setTokensAvailable(remainingAmount);
      })();
    }
  }, [isWalletReady]);

  useEffect(() => {
    if (!hasComponentRendered.current) {
      (async () => {
        try {
          await api.post('/metric', {
            event: 'page-view',
            value: 'token-sale',
            point: 0,
            category: 'engagement',
          });
          console.log('metric posted');
        } catch (error) {
          console.error('Error logging page view:', error);
        }
      })();
      hasComponentRendered.current = true;
    }
  }, []);

  const handleNext = async () => {
    router.push('/token/before-you-begin');
  };

  const closeModal = () => {
    setIsInfoModalOpened(false);
  };

  const logDownloadWhitepaperAction = async () => {
    await api.post('/metric', {
      event: 'download-whitepaper',
      value: 'token-sale',
      point: 0,
      category: 'engagement',
    });
  };

  if (process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE !== 'true') {
    return (
      <>
        <Head>
          <title>{`${t(
            'token_sale_public_sale_heading',
          )} - ${PLATFORM_NAME}`}</title>
          <link
            rel="canonical"
            href="https://www.traditionaldreamfactory.com/token"
            key="canonical"
          />
        </Head>

        <div className="max-w-6xl mx-auto">
          <Heading level={1} className="mb-14">
            {t('token_sale_public_sale_heading')}
          </Heading>

          <Heading level={2}>Coming soon!</Heading>
        </div>
      </>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Head>
        <title>{`${t(
          'token_sale_public_sale_announcement',
        )} - ${PLATFORM_NAME}`}</title>
      </Head>

      <section className="flex gap-2 flex-col">
        {isInfoModalOpened && (
          <Modal doesShowVideo={true} closeModal={closeModal}>
            <YoutubeEmbed embedId="VkoqvPcaRpk" />
          </Modal>
        )}
      </section>

      <main className="pt-4 pb-24 md:flex-row flex-wrap">
        <section className="mb-10">
          <div className='rounded-lg h-[500px] md:h-[700px] flex items-center flex-col bg-center bg-[#333333] bg-cover bg-no-repeat text-white bg-[url("/images/token-sale/token-sale-hero.webp")]'>
            {/* <h1 className="drop-shadow-[1px_2px_2px_rgba(254,79,183,1)] px-4 mb-2 sm:mb-8 mt-[20px] sm:mt-[70px] md:mt-[190px] max-w-[700px] text-center font-extrabold text-5xl md:text-6xl uppercase">
              {t('token_sale_public_sale_announcement')}
            </h1> */}
            <Heading
              level={1}
              className="text-right font-bold text-2xl md:text-5xl px-4 drop-shadow-lg mb-2 md:mb-8 md:text-center max-w-[700px] mt-1 md:mt-[100px] md:bg-[url('/images/token-sale/token-illy.png')] bg-no-repeat pt-[20px] md:pt-[130px] bg-top"
            >
              {t('token_sale_hero_heading')}
            </Heading>
            <Heading
              level={2}
              className="text-right md:text-center px-4 text-lg md:text-md max-w-[500px] font-normal mb-4"
            >
              {t('token_sale_hero_subheading')}
            </Heading>

            {isWalletReady ? (
              <div className="p-4">
                <TokenCounterSimple
                  tokensToBuy={tokensToBuy}
                  setTokensToBuy={setTokensToBuy}
                />

                <Button
                  className="!w-60 font-bold mb-3 md:mb-8 relative"
                  onClick={handleNext}
                >
                  {t('token_sale_public_sale_buy_token')}
                </Button>
              </div>
            ) : (
              <div>
                <Button
                  className="!w-60 font-bold mb-3 md:mb-8 relative"
                  onClick={handleNext}
                >
                  {t('token_sale_public_sale_buy_token')}
                </Button>
              </div>
            )}

            {tokensAvailable && (
              <h3 className="font-bold text-xl text-white pb-2 text-center w-60 px-6 rounded-full">
                {tokensAvailable} {t('token_sale_public_sale_tokens_left')}
              </h3>
            )}
          </div>
        </section>
        <section className="flex items-center flex-col mb-32">
          <div className="w-full flex flex-col  gap-20">
            <div className="w-full flex items-center flex-col">
              <Heading
                level={2}
                className="text-center mt-12 max-w-[620px] mb-6 text-3xl font-extrabold md:font-bold md:text-5xl uppercase md:normal-case"
              >
                {t('token_sale_tdf_intro_title')}
              </Heading>
              {/* <p className="text-center max-w-[640px] text-lg">
                {t('token_sale_tdf_subtitle')}
              </p> */}
            </div>
            <div className="flex gap-10 justify-center items-center flex-col md:flex-row">
              <Image
                className="w-full md:w-1/2 max-w-[430px]"
                src="/images/token-sale/tdf-token.png"
                width={430}
                height={465}
                alt={t('token_sale_public_sale_heading')}
              />
            </div>
          </div>
        </section>

        <section className="flex items-center flex-col mb-32">
          <div className="w-full flex flex-col  gap-20">
            <div className="w-full flex items-center flex-col">
              <Heading
                level={2}
                className="text-center mt-12 max-w-[620px] mb-6 text-3xl font-extrabold md:font-bold md:text-5xl uppercase md:normal-case"
              >
                $TDF Sale
              </Heading>
              <p className="text-center max-w-[660px] text-lg">
                To fund the development of our regenerative village, we are
                selling tokens that give the owners of those tokens a lifetime´s
                access to TDF.
              </p>
            </div>
            <div className="flex gap-10 justify-center items-center flex-col md:flex-row">
              <div className="w-full md:w-1/2 flex flex-col gap-7 max-w-[430px] ">
                <Heading className="text-xl uppercase text-center" level={3}>
                  {t('token_sale_why_purchase_now')}
                </Heading>
                <ul className="flex flex-col gap-5 ">
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    <Heading level={5} className=" font-bold uppercase">
                      {t('token_sale_tdf_token_4')}
                    </Heading>
                    <div>{t('token_sale_tdf_token_4_sub')}</div>
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    <Heading level={5} className=" font-bold uppercase">
                      {t('token_sale_lifetime_access')}
                    </Heading>
                    <div>
                      {t('token_sale_lifetime_access_desc_1')}{' '}
                      {t('token_sale_lifetime_access_desc_2')}{' '}
                      {t('token_sale_lifetime_access_desc_3')}{' '}
                      {t('token_sale_lifetime_access_desc_4')}
                    </div>
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    <Heading level={5} className=" font-bold uppercase">
                      {t('token_sale_tdf_token_3')}
                    </Heading>
                    <div>{t('token_sale_tdf_token_3_sub')}</div>
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    <Heading level={5} className=" font-bold uppercase">
                      {t('token_sale_tdf_token_5')}
                    </Heading>
                    <div>
                      {t('token_sale_tokens_resell_1')}{' '}
                      <Link
                        className="underline"
                        onClick={logDownloadWhitepaperAction}
                        href="https://oasa.earth/papers/OASA-Whitepaper-V1.2.pdf"
                      >
                        {t('token_sale_whitepaper')}
                      </Link>
                      {t('token_sale_tokens_resell_2')}
                    </div>
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    <Heading level={5} className=" font-bold uppercase">
                      {t('token_sale_tdf_token_2')}
                    </Heading>
                    <div>
                      {t('token_sale_contribute_1')}{' '}
                      {t('token_sale_contribute_2')}
                    </div>
                  </li>
                </ul>
                <Button
                  isFullWidth={false}
                  variant="secondary"
                  onClick={handleNext}
                >
                  {t('token_sale_unlock_access')}
                </Button>
              </div>
            </div>
          </div>
        </section>

        <PeekIntoFuture />

        <section className="flex items-center flex-col mb-32">
          <div className="w-full flex items-center flex-col">
            <Heading
              level={2}
              className="text-center mt-12 max-w-[620px] mb-6 text-3xl font-extrabold md:font-bold md:text-5xl uppercase md:normal-case"
            >
              $TDF unlocks Access to Accommodation at TDF
            </Heading>
            <p className="text-center max-w-[660px] text-lg">
              $TDF represents utility in the real world - in the forms of night
              of stay at TDF
            </p>
            <div className="mt-20 flex flex-col w-full md:w-[460px]">
              <Heading level={3} className="mb-6">
                {t('token_sale_public_sale_heading_accommodation_cost')}
              </Heading>
              <Card className="mb-8 px-6 py-8 text-left flex flex-col gap-1 text-md">
                <div className="text-right text-sm">
                  {t('token_sale_public_sale_price_per_night')}
                </div>
                {listings &&
                  listings.map((listing: any) => {
                    return (
                      <div key={listing.name}>
                        <div className="grid grid-cols-[55px_auto_65px]">
                          <p>
                            {listing.name.toLowerCase().includes('van') && (
                              <Image
                                src={`/images/token-sale/${ACCOMMODATION_ICONS[0]}`}
                                alt=""
                                width={38}
                                height={38}
                              />
                            )}

                            {(listing.name.toLowerCase().includes('private') ||
                              listing.name.toLowerCase().includes('camping') ||
                              listing.name.toLowerCase().includes('glamping') ||
                              listing.name
                                .toLowerCase()
                                .includes('shared')) && (
                              <Image
                                src={`/images/token-sale/${ACCOMMODATION_ICONS[1]}`}
                                alt=""
                                width={38}
                                height={38}
                              />
                            )}
                          </p>
                          <p className=" pt-1">{listing.name}</p>
                          <p className=" text-right text-accent pt-2">
                            {t('token_sale_public_sale_token_symbol')}{' '}
                            {listing.tokenPrice.val}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                <div className="grid grid-cols-[55px_auto_65px]">
                  <p>
                    <Image
                      src="/images/token-sale/hotel.png"
                      alt=""
                      width={38}
                      height={38}
                    />
                  </p>
                  <p className="pt-1">
                    {t('token_sale_public_sale_shared_suite')}
                    <span className="block text-xs text-accent">
                      {t('token_sale_public_sale_coming_2023')}
                    </span>
                  </p>
                  <p className="text-right text-accent pt-2">
                    {t('token_sale_public_sale_token_symbol')} 1
                  </p>
                </div>
                <div className="grid grid-cols-[55px_auto_65px]">
                  <p>
                    <Image
                      src="/images/token-sale/hotel.png"
                      alt=""
                      width={38}
                      height={38}
                    />
                  </p>
                  <p className=" pt-1">
                    {t('token_sale_public_sale_private_suite')}
                    <span className="block text-xs text-accent">
                      {t('token_sale_public_sale_coming_2023')}
                    </span>
                  </p>
                  <p className=" text-right text-accent pt-2">
                    {t('token_sale_public_sale_token_symbol')} 2
                  </p>
                </div>
                <div className="grid grid-cols-[55px_auto_65px]">
                  <p>
                    <Image
                      src="/images/token-sale/hotel.png"
                      alt=""
                      width={38}
                      height={38}
                    />
                  </p>
                  <p className=" pt-1">
                    {t('token_sale_public_sale_studio')}
                    <span className="block text-xs text-accent">
                      {t('token_sale_public_sale_coming_2024')}
                    </span>
                  </p>
                  <p className=" text-right text-accent pt-2">
                    {t('token_sale_public_sale_token_symbol')} 3
                  </p>
                </div>
                <div className="grid grid-cols-[55px_auto_65px]">
                  <p>
                    <Image
                      src="/images/token-sale/hotel.png"
                      alt=""
                      width={38}
                      height={38}
                    />
                  </p>
                  <p className=" pt-1">
                    {t('token_sale_public_sale_house')}
                    <span className="block text-xs text-accent">
                      {t('token_sale_public_sale_coming_2024')}
                    </span>
                  </p>
                  <p className=" text-right text-accent pt-2">
                    {t('token_sale_public_sale_token_symbol')} 5
                  </p>
                </div>
              </Card>

              <Heading level={3} className="mb-6">
                + utility fee
              </Heading>

              <div className="text-sm ">
                {t('token_sale_utility_fee_desc_1')}{' '}
                {t('token_sale_utility_fee_desc_2')}
              </div>
            </div>
          </div>

          <div className="w-full flex flex-col  gap-20 max-w-[700px] my-20">
            <div className="flex gap-10 justify-center items-center flex-col md:flex-row">
              <div className="text-sm flex flex-col gap-6 w-full md:w-1/3">
                <p className="text-accent">
                  1 $TDF = 1 night spent at utility cost per year, forever, in
                  standard accommodation.
                </p>

                <p className="text-accent">
                  Your $TDF tokens give you access to your chosen accommodation.
                  The utility fee includes energy, water, internet, taxes, food,
                  salaries, maintenance etc.
                </p>

                <p>
                  Bookings must be approved by Space Host. Citizen get access to
                  &quot;instant book&quot; (no approval).
                </p>

                <p>$TDF tokens also give governance rights in the TDF DAO.</p>
              </div>
              <Image
                className="w-full md:w-1/2 max-w-[430px] w-2/3"
                src="/images/token-sale/accommodation.png"
                width={577}
                height={535}
                alt={t('token_sale_tdf_accommodation_heading')}
              />
            </div>
          </div>
          <Button isFullWidth={false} variant="secondary" onClick={handleNext}>
            UNLOCK ACCESS
          </Button>
        </section>

        <section className="flex items-center flex-col mb-32 ">
          <div className="w-full flex flex-col  gap-20">
            <div className="flex gap-20 justify-center items-center flex-col md:flex-row">
              <Image
                className="w-full md:w-1/5 max-w-[413px]"
                src="/images/token-sale/dive-deeper.png"
                width={413}
                height={548}
                alt={t('token_sale_public_sale_heading')}
              />
              <div className="w-full md:w-4/5 flex flex-col gap-7 max-w-[430px] ">
                <Heading
                  level={2}
                  className="text-3xl font-extrabold md:font-bold md:text-5xl uppercase md:normal-case"
                >
                  {t('token_sale_dive_deeper_heading')}
                </Heading>
                <div className="flex gap-8">
                  <ul className="flex flex-col gap-5 ">
                    <li>
                      <Link
                        className="text-accent underline font-bold"
                        href="https://oasa.earth/papers/OASA-Whitepaper-V1.2.pdf"
                        onClick={logDownloadWhitepaperAction}
                      >
                        {t('token_sale_white_paper')}
                      </Link>
                    </li>
                    <li>
                      <Link
                        className="text-accent underline font-bold"
                        href="https://docs.google.com/document/d/177JkHCy0AhplsaEEYpFHBsiI6d4uLk0TgURSKfBIewE/edit"
                      >
                        {t('token_sale_pink_paper')}
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Ama />

        <section className="flex items-center flex-col mb-32">
          <div className="w-full flex flex-col  gap-20">
            <div className="flex gap-20 justify-center items-center flex-col md:flex-row">
              <Image
                className="w-full md:w-1/5 max-w-[413px]"
                src="/images/token-sale/dive-deeper.png"
                width={413}
                height={548}
                alt={t('token_sale_public_sale_heading')}
              />
              <div className="w-full md:w-4/5 flex flex-col gap-7 max-w-[430px] ">
                <Heading
                  level={2}
                  className="text-3xl font-extrabold md:font-bold md:text-5xl uppercase md:normal-case"
                >
                  {t('token_sale_unlocks_access_heading')}
                </Heading>
                <p className="text-center max-w-[660px] text-lg">
                  {t('token_sale_unlocks_access_desc_1')}{' '}
                  {t('token_sale_unlocks_access_desc_2')}
                </p>
                <div className="mt-20 flex flex-col w-full md:w-[460px]">
                  <Heading level={3} className="mb-6">
                    {t('token_sale_utility_fee')}
                  </Heading>

                  <div className="text-sm ">
                    {t('token_sale_utility_fee_desc_1')}{' '}
                    {t('token_sale_utility_fee_desc_2')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

PublicTokenSalePage.getInitialProps = async (context: NextPageContext) => {
  try {
    const [listingRes, generalRes, messages] = await Promise.all([
      api
        .get('/listing', {
          params: {
            limit: MAX_LISTINGS_TO_FETCH,
          },
        })
        .catch(() => {
          return null;
        }),
      api.get('/config/general').catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const listings = listingRes?.data.results;
    const generalConfig = generalRes?.data?.results?.value;
    return {
      listings,
      generalConfig,
      messages,
    };
  } catch (err: unknown) {
    return {
      listings: [],
      generalConfig: null,
      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default PublicTokenSalePage;
