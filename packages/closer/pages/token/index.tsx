import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useContext, useEffect, useState } from 'react';

import Ama from '../../components/Ama';
import Modal from '../../components/Modal';
import PeekIntoFuture from '../../components/PeekIntoFuture';
import TokenCounterSimple from '../../components/TokenCounterSimple';
import YoutubeEmbed from '../../components/YoutubeEmbed';
import { Button, Card, Heading } from '../../components/ui';

import { MAX_LISTINGS_TO_FETCH } from '../../constants';
import { WalletState } from '../../contexts/wallet';
import { useBuyTokens } from '../../hooks/useBuyTokens';
import { useConfig } from '../../hooks/useConfig';
import { GeneralConfig, Listing } from '../../types';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { __ } from '../../utils/helpers';

const ACCOMMODATION_ICONS = ['van.png', 'camping.png', 'hotel.png'];
const DEFAULT_TOKENS = 10;

interface Props {
  listings: Listing[];
  generalConfig: GeneralConfig | null;
}

const PublicTokenSalePage = ({ listings, generalConfig }: Props) => {
  const defaultConfig = useConfig();
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

  const handleNext = async () => {
    router.push('/token/before-you-begin');
  };

  const openModal = () => {
    setIsInfoModalOpened(true);
  };

  const closeModal = () => {
    setIsInfoModalOpened(false);
  };

  const handleShowVideo = () => {
    openModal();
  };

  if (process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE !== 'true') {
    return (
      <>
        <Head>
          <title>{`${__(
            'token_sale_public_sale_heading',
          )} - ${PLATFORM_NAME}`}</title>
          <link
            rel="canonical"
            href="https://www.traditionaldreamfactory.com/token"
            key="canonical"
          />
        </Head>

        <div className="max-w-6xl mx-auto">
          <Heading level={1}>
            {__('token_sale_public_sale_heading')}
          </Heading>

          <Heading level={2}>Coming soon!</Heading>
        </div>
      </>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Head>
        <title>{`${__(
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
          <div className='rounded-lg h-[600px] md:h-[700px] flex  items-end md:items-center flex-col bg-center bg-[#333333] bg-cover bg-no-repeat text-white bg-[url("/images/token-sale/token-sale-hero.webp")]'>
            <Heading
              level={1}
              className="text-right  text-2xl md:text-5xl px-4 drop-shadow-lg mb-2 md:mb-8 md:text-center max-w-[700px] mt-1 md:mt-[100px] md:bg-[url('/images/token-sale/token-illy.png')] bg-no-repeat pt-[20px] md:pt-[130px] bg-top"
            >
              {__('token_sale_public_sale_subheading')}
            </Heading>
            <Heading
              level={2}
              className="text-right md:text-center px-4 text-lg md:text-md max-w-[700px] font-normal mb-4"
            >
              Secure your perpetual access to the first web3 powered
              regenerative co-living village in Portugal
            </Heading>

            {isWalletReady ? (
              <div className='p-4'>
                <TokenCounterSimple
                  tokensToBuy={tokensToBuy}
                  setTokensToBuy={setTokensToBuy}
                />

                <Button
                  className="!w-60 font-bold mb-3 md:mb-8 relative"
                  onClick={handleNext}
                >
                  {__('token_sale_public_sale_buy_token')}
                </Button>
              </div>
            ) : (
              <div>
                 <Button
                  className="!w-60 font-bold mb-3 md:mb-8 relative"
                  onClick={handleNext}
                >
                  {__('token_sale_public_sale_buy_token')}
                </Button>
              </div>
            )}

            {tokensAvailable && (
              <h3 className="font-bold text-xl text-white pb-2 text-center w-60 px-6 rounded-full">
                {tokensAvailable} {__('token_sale_public_sale_tokens_left')}
              </h3>
            )}
          </div>
        </section>

        {/* photo gallery */}
        {/* <section className="flex items-center flex-col py-24">
          <div className="text-center mb-20 w-full">
            <div className="w-full flex items-center flex-col">
              <Heading
                level={2}
                className="mb-4 text-5xl font-bold max-w-[600px]"
              >
                {__('token_sale_meet_your_home_heading')}
              </Heading>
              <Heading level={3} className="text-md max-w-[600px]">
                {__('token_sale_meet_your_home_subheading')}
              </Heading>
            </div>

            <PhotoGallery className="mt-12" />
          </div>
        </section> */}

        {/* <section className="flex items-center flex-col mb-32">
          <div className="w-full flex flex-col  gap-20">
            <div className="w-full flex items-center flex-col">
              <Heading level={2} className="text-center max-w-[420px] mb-6 text-4xl">
                {__('token_sale_tdf_intro_title')}
              </Heading>
              <p className="text-center max-w-[640px] text-lg">
                {__('token_sale_tdf_subtitle')}
              </p>
            </div>
            <div className="flex gap-10 justify-center items-center flex-col md:flex-row">
              <Image
                className="w-full md:w-1/2 max-w-[430px]"
                src="/images/token-sale/tdf-token.png"
                width={430}
                height={465}
                alt={__('token_sale_tdf_heading')}
              />
              <div className="w-full md:w-1/2 flex flex-col gap-7 max-w-[430px] ">
                <ul className="flex flex-col gap-5 ">
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    <Heading level={5} className=" font-bold uppercase">
                      {__('token_sale_tdf_token_1')}
                    </Heading>
                    <div>{__('token_sale_tdf_token_1_sub')}</div>
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    <Heading level={5} className=" font-bold uppercase">
                      {__('token_sale_tdf_token_2')}
                    </Heading>
                    <div>{__('token_sale_tdf_token_2_sub')}</div>
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    <Heading level={5} className=" font-bold uppercase">
                      {__('token_sale_tdf_token_3')}
                    </Heading>
                    <div>{__('token_sale_tdf_token_3_sub')}</div>
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    <Heading level={5} className=" font-bold uppercase">
                      {__('token_sale_tdf_token_4')}
                    </Heading>
                    <div>{__('token_sale_tdf_token_4_sub')}</div>
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    <Heading level={5} className=" font-bold uppercase">
                      {__('token_sale_tdf_token_5')}
                    </Heading>
                    <div>{__('token_sale_tdf_token_5_sub')}</div>
                  </li>
                </ul>
                <Button
                  isFullWidth={false}
                  type="secondary"
                  onClick={handleShowVideo}
                >
                  {__('token_sale_tdf_watch_video_button')}
                </Button>
              </div>
            </div>
          </div>
        </section> */}
        <section className="flex items-center flex-col mb-32">
          <div className="w-full flex flex-col  gap-20">
            <div className="w-full flex items-center flex-col">
              <Heading
                level={2}
                className="text-center mt-12 max-w-[620px] mb-6 text-3xl font-extrabold md:font-bold md:text-5xl uppercase md:normal-case"
              >
                {__('token_sale_tdf_intro_title')}
              </Heading>
              {/* <p className="text-center max-w-[640px] text-lg">
                {__('token_sale_tdf_subtitle')}
              </p> */}
            </div>
            <div className="flex gap-10 justify-center items-center flex-col md:flex-row">
              <Image
                className="w-full md:w-1/2 max-w-[430px]"
                src="/images/token-sale/tdf-token.png"
                width={430}
                height={465}
                alt={__('token_sale_tdf_heading')}
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
                $TDF Private Sale
              </Heading>
              <p className="text-center max-w-[660px] text-lg">
                To raise the $3.5M+ needed to finish building our regenerative
                village, we are selling 18600 tokens that will give the owners
                of those tokens a lifetime´s access to TDF.
              </p>
            </div>
            <div className="flex gap-10 justify-center items-center flex-col md:flex-row">
              <div className="w-full md:w-1/2 flex flex-col gap-7 max-w-[430px] ">
                <Heading className="text-xl uppercase text-center" level={3}>
                  WHY PURCHASE $TDF NOW?
                </Heading>
                <ul className="flex flex-col gap-5 ">
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    <Heading level={5} className=" font-bold uppercase">
                      {__('token_sale_tdf_token_4')}
                    </Heading>
                    <div>{__('token_sale_tdf_token_4_sub')}</div>
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    <Heading level={5} className=" font-bold uppercase">
                      Lifetime access
                    </Heading>
                    <div>
                      {' '}
                      Your tokens grant you a lifetime’s access to TDF, for as
                      long as you hold your tokens. The number of days you can
                      stay per year is proportional to the amount of tokens you
                      have and the kind of accommodation you choose.
                    </div>
                  </li>

                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    <Heading level={5} className=" font-bold uppercase">
                      {__('token_sale_tdf_token_3')}
                    </Heading>
                    <div>{__('token_sale_tdf_token_3_sub')}</div>
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    <Heading level={5} className=" font-bold uppercase">
                      {__('token_sale_tdf_token_5')}
                    </Heading>
                    <div>
                      Tokens can be resold after the Go-Live event (see{' '}
                      <Link
                        className="underline"
                        href="https://oasa.earth/papers/OASA-Whitepaper-V1.2.pdf"
                      >
                        Whitepaper
                      </Link>
                      )
                    </div>
                  </li>

                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    <Heading level={5} className=" font-bold uppercase">
                      {__('token_sale_tdf_token_2')}
                    </Heading>
                    <div>
                      Contribute to building a new, nature based economy. The
                      money gathered through the token sales helps to fund what
                      we are building here.
                    </div>
                  </li>
                </ul>
                <Button
                  isFullWidth={false}
                  type="secondary"
                  onClick={handleNext}
                >
                  UNLOCK ACCESS
                </Button>
                <div className="text-sm flex flex-col gap-4">
                  <p>Example:</p>
                  <p>
                    Fox was invited to participate in $TDF’s private sale. She
                    can get her $TDF at lower prices, as the token price
                    increases for every token sold and she’s in first hundred
                    purchasers. She’s not sure of how her life is going to roll
                    in the next few years, but she decides to buy 30 $TDF - she
                    can support the project construction for now, and if later
                    she decides not to spend time there, she can sell her tokens
                    after the go-live event.{' '}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <PeekIntoFuture />

        {/* <section className="flex items-center flex-col">
          <div className="w-full flex flex-col  gap-20">
            <div className="flex gap-10 justify-center items-center flex-col md:flex-row">
              <Heading level={2} className="text-4xl max-w-[640px]">
                {__('token_sale_tdf_accommodation_heading')}
              </Heading>
              <Image
                className="w-full md:w-1/2 max-w-[430px]"
                src="/images/token-sale/accommodation.png"
                width={577}
                height={535}
                alt={__('token_sale_tdf_accommodation_heading')}
              />
            </div>
            <div className="flex gap-10 justify-center items-start flex-col md:flex-row">
              <div className="flex flex-col w-full md:w-[460px]">
                <Heading level={3} className="mb-6">
                  {__('token_sale_public_sale_heading_accommodation_cost')}
                </Heading>
                <Card className="mb-8 px-6 py-8 text-left flex flex-col gap-1 text-md">
                  <div className="text-right text-sm">
                    {__('token_sale_public_sale_price_per_night')}
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

                              {(listing.name
                                .toLowerCase()
                                .includes('private') ||
                                listing.name
                                  .toLowerCase()
                                  .includes('camping') ||
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
                              {__('token_sale_public_sale_token_symbol')}{' '}
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
                      {__('token_sale_public_sale_shared_suite')}
                      <span className="block text-xs text-accent">
                        {__('token_sale_public_sale_coming_2023')}
                      </span>
                    </p>
                    <p className="text-right text-accent pt-2">
                      {__('token_sale_public_sale_token_symbol')} 1
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
                      {__('token_sale_public_sale_private_suite')}
                      <span className="block text-xs text-accent">
                        {__('token_sale_public_sale_coming_2023')}
                      </span>
                    </p>
                    <p className=" text-right text-accent pt-2">
                      {__('token_sale_public_sale_token_symbol')} 2
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
                      {__('token_sale_public_sale_studio')}
                      <span className="block text-xs text-accent">
                        {__('token_sale_public_sale_coming_2024')}
                      </span>
                    </p>
                    <p className=" text-right text-accent pt-2">
                      {__('token_sale_public_sale_token_symbol')} 3
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
                      {__('token_sale_public_sale_house')}
                      <span className="block text-xs text-accent">
                        {__('token_sale_public_sale_coming_2024')}
                      </span>
                    </p>
                    <p className=" text-right text-accent pt-2">
                      {__('token_sale_public_sale_token_symbol')} 5
                    </p>
                  </div>
                </Card>
                <div className="text-sm ">
                  {__('token_sale_public_sale_prices_disclaimer')}
                </div>
              </div>

              <div className="bg-accent-light p-8">
                <div className="text-2xl font-bold flex flex-col gap-6 mb-6">
                  <p>
                    {__('token_sale_tdf_utility_1')}
                    <Link className="text-accent underline" href="/events">
                      {__('token_sale_tdf_utility_2')}
                    </Link>{' '}
                    {__('token_sale_tdf_utility_3')}{' '}
                    <Link className="text-accent underline" href="/listings">
                      {__('token_sale_tdf_utility_4')}
                    </Link>
                  </p>

                  <p>{__('token_sale_tdf_utility_5')}</p>
                </div>

                <p>{__('token_sale_tdf_utility_note_1')}</p>
                <p>{__('token_sale_tdf_utility_note_2')}</p>
              </div>
            </div>
          </div>
        </section> */}

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
                {__('token_sale_public_sale_heading_accommodation_cost')}
              </Heading>
              <Card className="mb-8 px-6 py-8 text-left flex flex-col gap-1 text-md">
                <div className="text-right text-sm">
                  {__('token_sale_public_sale_price_per_night')}
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
                            {__('token_sale_public_sale_token_symbol')}{' '}
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
                    {__('token_sale_public_sale_shared_suite')}
                    <span className="block text-xs text-accent">
                      {__('token_sale_public_sale_coming_2023')}
                    </span>
                  </p>
                  <p className="text-right text-accent pt-2">
                    {__('token_sale_public_sale_token_symbol')} 1
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
                    {__('token_sale_public_sale_private_suite')}
                    <span className="block text-xs text-accent">
                      {__('token_sale_public_sale_coming_2023')}
                    </span>
                  </p>
                  <p className=" text-right text-accent pt-2">
                    {__('token_sale_public_sale_token_symbol')} 2
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
                    {__('token_sale_public_sale_studio')}
                    <span className="block text-xs text-accent">
                      {__('token_sale_public_sale_coming_2024')}
                    </span>
                  </p>
                  <p className=" text-right text-accent pt-2">
                    {__('token_sale_public_sale_token_symbol')} 3
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
                    {__('token_sale_public_sale_house')}
                    <span className="block text-xs text-accent">
                      {__('token_sale_public_sale_coming_2024')}
                    </span>
                  </p>
                  <p className=" text-right text-accent pt-2">
                    {__('token_sale_public_sale_token_symbol')} 5
                  </p>
                </div>
              </Card>

              <Heading level={3} className="mb-6">
                + utility fee
              </Heading>

              <div className="text-sm ">
                charged separately - supplies, insurance, accounting, energy,
                water, sewage, internet, food, maintenance.
              </div>
              <Heading level={3} className="my-6">
                ~10€ / day initial projection{' '}
              </Heading>

              <div className="text-sm ">likely to grow due to inflation </div>
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
                  Token holders must go through a Membersheep onboarding process
                  in order to stay more than 14 days. Once verified as member,
                  they get access to “instant book”. Non-members can submit
                  booking requests.
                </p>

                <p>$TDF tokens also give governance rights in the TDF DAO. </p>
              </div>
              <Image
                className="w-full md:w-1/2 max-w-[430px] w-2/3"
                src="/images/token-sale/accommodation.png"
                width={577}
                height={535}
                alt={__('token_sale_tdf_accommodation_heading')}
              />
            </div>
          </div>
          <Button isFullWidth={false} type="secondary" onClick={handleNext}>
            UNLOCK ACCESS
          </Button>
        </section>

        {/* <section className="flex items-center flex-col py-12 bg-accent-light my-20 px-2 sm:px-6">
          <div className="text-center w-full">
            <div className="w-full flex items-center flex-col gap-4">
              <Heading level={2} className="text-lg font-bold max-w-[600px]">
                {__('token_sale_investment_heading')}
              </Heading>

              <div className="flex w-full justify-center gap-4 mb-6 flex-col sm:flex-row">
                <div className="w-full sm:w-1/3 flex justify-center sm:justify-end">
                  {selectedInvestmentIndex > 0 ? (
                    <Button
                      type="secondary"
                      isFullWidth={false}
                      className="h-[25px]"
                      onClick={() =>
                        setSelectedInvestmentIndex((prevIndex) => prevIndex - 1)
                      }
                    >
                      ← {__('token_sale_decrease_button')}
                    </Button>
                  ) : null}
                </div>

                <Heading
                  level={3}
                  className="mb-4 text-5xl font-bold w-full sm:w-1/3"
                >
                  {selectedInvestment.amount}
                </Heading>

                <div className="w-full sm:w-1/3 flex justify-center sm:justify-start">
                  {selectedInvestmentIndex <
                  INVESTMENT_COMPARISON.length - 1 ? (
                    <Button
                      type="secondary"
                      isFullWidth={false}
                      className="h-[25px]"
                      onClick={() =>
                        setSelectedInvestmentIndex((prevIndex) => prevIndex + 1)
                      }
                    >
                      {__('token_sale_increase_button')} →
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="flex gap-1 sm:gap-10">
                <div className="bg-white shadow-md rounded-md p-2 sm:p-6 text-left flex flex-col justify-between w-1/2">
                  <Heading level={3} className="text-md font-normal mb-10 h-16">
                    {__('token_sale_renting_title')}
                  </Heading>
                  <Heading level={4} className="h-[120px]">
                    {selectedInvestment.renting.term[0]}
                  </Heading>

                  <div>
                    <Heading level={5} className="uppercase font-bold mb-4">
                      {__('token_sale_extra_costs')}
                    </Heading>
                    <div>
                      <p>{selectedInvestment.renting.extraCosts[0]}</p>
                      <p>{selectedInvestment.renting.extraCosts[1]}</p>
                      <p>{selectedInvestment.renting.extraCosts[2]}</p>
                      <p className="pt-4">{__('token_sale_asset_held')} €0</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white shadow-md rounded-md p-2 sm:p-6 text-left w-1/2">
                  <Heading level={3} className="text-md font-normal mb-10 h-16">
                    {__('token_sale_tdf_title')}
                  </Heading>

                  <div className="h-[120px]">
                    <Heading level={4}>
                      {selectedInvestment.tdf.term[0]}
                    </Heading>
                    <Heading level={4}>
                      {selectedInvestment.tdf.term[1]}
                    </Heading>
                  </div>

                  <Heading level={5} className="uppercase font-bold mb-4">
                    {__('token_sale_extra_costs')}
                  </Heading>

                  <div>
                    <p>{selectedInvestment.tdf.extraCosts[0]}</p>
                    <p>{selectedInvestment.tdf.extraCosts[1]}</p>
                    <p>{selectedInvestment.tdf.extraCosts[2]}</p>
                    <p className="pt-4">
                      {__('token_sale_asset_held')} {selectedInvestment.amount}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section> */}

        <section className="flex items-center flex-col mb-32 ">
          <div className="w-full flex flex-col  gap-20">
            <div className="flex gap-20 justify-center items-center flex-col md:flex-row">
              <Image
                className="w-full md:w-1/5 max-w-[413px]"
                src="/images/token-sale/dive-deeper.png"
                width={413}
                height={548}
                alt={__('token_sale_tdf_heading')}
              />
              <div className="w-full md:w-4/5 flex flex-col gap-7 max-w-[430px] ">
                <Heading level={2} className="text-3xl font-extrabold md:font-bold md:text-5xl uppercase md:normal-case">
                  {__('token_sale_dive_deeper_heading')}
                </Heading>
                <div className="flex gap-8">
                  <ul className="flex flex-col gap-5 ">
                    <li>
                      <Link
                        className="text-accent underline font-bold"
                        href="https://oasa.earth/papers/OASA-Whitepaper-V1.2.pdf"
                      >
                        {__('token_sale_white_paper')}
                      </Link>
                    </li>
                    <li>
                      <Link
                        className="text-accent underline font-bold"
                        href="https://docs.google.com/document/d/177JkHCy0AhplsaEEYpFHBsiI6d4uLk0TgURSKfBIewE/edit"
                      >
                        {__('token_sale_pink_paper')}
                      </Link>
                    </li>
                    <li>
                      <Link
                        className="text-accent underline font-bold"
                        href="https://oasa.earth/"
                      >
                        {__('token_sale_oasa_website')}
                      </Link>
                    </li>
                    <li>
                      <Link
                        className="text-accent underline font-bold"
                        href="/legal/terms"
                      >
                        {__('token_sale_terms')}
                      </Link>
                    </li>
                  </ul>
                  <ul className="flex flex-col gap-5 ">
                    <li>
                      <Link
                        className="text-accent underline font-bold"
                        href="/pdf/private-sale.pdf"
                      >
                        {__('token_sale_doc')}
                      </Link>
                    </li>
                    <li>
                      <Link
                        className="text-accent underline font-bold"
                        href="https://drive.google.com/file/d/1oQX49SQ5T_8c9_SuHQbGw9dNKM8jVLrq/view"
                      >
                        {__('token_sale_interior_design_report')}
                      </Link>
                    </li>
                    {/* <li>
                      <Link className="text-accent underline font-bold" href="">
                        {__('token_sale_smart_design_report')}
                      </Link>
                    </li> */}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Ama />

        {/* <section className="flex items-center flex-col py-24 ">
          <div className="w-full">
            <div className="flex items-center  w-full flex-col gap-16">
              <Heading
                level={2}
                className="mb-4 text-5xl font-bold max-w-[500px] text-center"
              >
                {__('token_sale_become_member_heading')}
              </Heading>
              <div className="bg-accent-light text-left p-6 max-w-[500px]">
                <ul className="font-bold text-lg ">
                  <li>{__('token_sale_member_benefit_1')}</li>
                  <li>{__('token_sale_member_benefit_2')}</li>
                  <li>{__('token_sale_member_benefit_3')}</li>
                </ul>
              </div>

              <div className="max-w-[500px] flex flex-col gap-3">
                <Heading level={5} className="text-accent">
                  {__('token_sale_member_step')} 1
                </Heading>
                <Heading level={5} className="font-bold">
                  {__('token_sale_member_step_1')}
                </Heading>
                <p>{__('token_sale_member_step_1_text')} </p>
              </div>
              <div className="max-w-[500px] flex flex-col gap-3">
                <Heading level={5} className="text-accent">
                  {__('token_sale_member_step')} 2
                </Heading>
                <Heading level={5} className="font-bold">
                  {__('token_sale_member_step_2')}
                </Heading>
                <p>{__('token_sale_member_step_2_text')} </p>
              </div>
              <div className="max-w-[500px] flex flex-col gap-3">
                <Heading level={5} className="text-accent">
                  {__('token_sale_member_step')} 3
                </Heading>
                <Heading level={5} className="font-bold">
                  {__('token_sale_member_step_3')}
                </Heading>
                <p>{__('token_sale_member_step_3_text')} </p>
              </div>
              <div className="max-w-[500px] w-full flex flex-col gap-3">
                <Heading level={5} className="text-accent">
                  {__('token_sale_member_step')} 4
                </Heading>
                <Heading level={5} className="font-bold">
                  {__('token_sale_member_step_4')}
                </Heading>
                <p>{__('token_sale_member_step_4_text')} </p>
              </div>
            </div>
          </div>
        </section> */}

        {/* <section className="flex flex-wrap justify-center">
          <div>
            <Heading
              className="text-4xl mb-6 max-w-3xl text-center mt-8  uppercase sm:text-5xl bg-[url(/images/landing/spade.png)] bg-no-repeat pt-[170px] bg-top"
              level={2}
            >
              The Journey of our decentralised co-living
            </Heading>
            <p className="text-center">
              Where we’ve been and where we’re going - see our{' '}
              <strong>Roadmap</strong>:
            </p>
          </div>
        </section>
        <section className="flex items-center flex-col py-24">
          <div className="w-full sm:w-[80%] flex items-center flex-col">
            <div className="max-w-[800px]">
              <div className="grid grid-cols-[37px_240px] sm:grid-cols-[37px_370px]">
                <div className="w-7 h-7 bg-accent-alt rounded-full"></div>
                <Heading level={4} className="uppercase text-accent">
                  <span className="font-normal">2021</span>
                </Heading>
                <div className="w-7 flex justify-center">
                  <div className="bg-accent-alt w-[4px] h-auto"></div>
                </div>
                <div className="pb-12">
                  <p className="uppercase font-bold">
                    Keys to the farm & basic infrastructure
                  </p>
                  <ul className=" my-4 list-none">
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Operational event venue (up to 100 guests)
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      10 glamping accommodations
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      2000 trees reforestation
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      7kw solar energy system
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Workshop
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Industrial kitchen
                    </li>
                  </ul>
                </div>
              </div>
              <div className="grid grid-cols-[37px_240px] sm:grid-cols-[37px_370px]">
                <div className="w-7 h-7 bg-accent-alt rounded-full"></div>
                <Heading level={4} className="uppercase text-accent">
                  <span className="font-normal">2022</span>
                </Heading>
                <div className="w-7 flex justify-center">
                  <div className="bg-accent-alt w-[4px] h-auto"></div>
                </div>
                <div className="pb-12">
                  <p className="uppercase font-bold">Operational CO-LIVING</p>
                  <ul className=" my-4 list-none">
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      1000 trees food forest
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Sauna
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Co-working
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      DAO prototype
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Architectural plans
                    </li>
                  </ul>
                </div>
              </div>
              <div className="grid grid-cols-[37px_240px] sm:grid-cols-[37px_370px]">
                <div className="w-7 h-7 bg-accent-alt rounded-full"></div>
                <Heading level={4} className="uppercase text-accent">
                  <span className="font-normal">2023</span>
                </Heading>
                <div className="w-7 flex justify-center">
                  <div className="bg-accent-alt w-[4px] h-auto"></div>
                </div>
                <div className="pb-12">
                  <p className="uppercase font-bold">
                    Platform & token launch, plans approved.
                  </p>
                  <ul className=" my-4 list-none">
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Starlink
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      14 glamping accommodations, 8 volunteer beds
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Market garden
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Grey water treatment (helophyte filter)
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Booking platform & token
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Engineering plans
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Biochar production
                    </li>
                  </ul>
                </div>
              </div>
              <div className="grid grid-cols-[37px_240px] sm:grid-cols-[37px_370px]">
                <div className="w-7 flex justify-center">
                  <div className="bg-accent-alt w-[4px] h-[40px]"></div>
                </div>
                <div className="text-accent-alt"></div>
                <div className="w-7 h-7 bg-accent-alt-light border-4 border-accent-alt rounded-full"></div>
                <Heading level={4} className="uppercase text-accent">
                  <span className="font-normal">2024</span>
                </Heading>
                <div className="w-7 flex justify-center">
                  <div className="bg-accent-alt-light w-[4px] h-auto"></div>
                </div>
                <div className="pb-12">
                  <Heading level={4} className="uppercase text-accent">
                    FUNDRAISING
                    <Link
                      href="/dataroom"
                      className="ml-4 text-xs italic underline text-primary"
                    >
                      (learn more)
                    </Link>
                  </Heading>
                  <p className="uppercase font-bold mt-6">We are here</p>
                  <ul>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Co-living construction: 14 suites
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Natural pool
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Exercice option to buy on the 25ha of land
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Build 2 lakes
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Start a tiny-house development
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Pay off loan & transfer property into the company
                    </li>
                  </ul>
                </div>
              </div>
              <div className="grid grid-cols-[37px_240px] sm:grid-cols-[37px_370px]">
                <div className="w-7 flex justify-center">
                  <div className="bg-accent-alt-light w-[4px] h-[40px]"></div>
                </div>
                <div className="text-accent-alt"></div>
                <div className="w-7 h-7 bg-accent-alt-light rounded-full"></div>
                <Heading
                  level={4}
                  className="font-normal uppercase text-accent"
                >
                  2025
                </Heading>
                <div className="w-7 flex justify-center">
                  <div className="bg-accent-alt-light w-[4px] h-auto"></div>
                </div>
                <div className="pb-12">
                  <ul>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Makerspace
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Restaurant
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Mushroom farm
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      10 000 fruit trees orchard
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Rewilding zone
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Biomorphic coworking garden
                    </li>
                  </ul>
                </div>
              </div>
              <div className="grid grid-cols-[37px_270px]">
                <div className="w-7 flex justify-center">
                  <div className="bg-accent-alt-light w-[4px] h-[40px]"></div>
                </div>
                <div className="text-accent"></div>
                <div className="w-7 h-7 bg-accent-alt-light rounded-full"></div>
                <Heading level={4} className="uppercase text-accent">
                  TDF: GO LIVE EVENT 🎉🎉🎉
                </Heading>
                <div className="w-7 flex justify-center">
                  <div className="bg-accent-alt-light w-[4px] h-auto"></div>
                </div>
                <div className="pb-12">
                  <ul className="mt-6">
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      TDF V1 IS READY!
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      $TDF UNSTAKED
                    </li>
                  </ul>
                </div>
              </div>
              <div className="grid grid-cols-[37px_270px]">
                <div className="w-7 flex justify-center">
                  <div className="bg-accent-alt-light w-[4px] h-[40px]"></div>
                </div>
                <div className="text-accent-alt"></div>
                <div className="w-7 h-7 bg-accent-alt-light rounded-full"></div>
                <Heading
                  level={4}
                  className="font-normal uppercase text-accent"
                >
                  2026
                </Heading>
                <div className="w-7 flex justify-center">
                  <div className="bg-accent-alt-light w-[4px] h-auto"></div>
                </div>
                <div className="pb-12">
                  <ul>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Co-housing expansion plans
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section> */}
      </main>
    </div>
  );
};

PublicTokenSalePage.getInitialProps = async () => {
  try {
    const [listingRes, generalRes] = await Promise.all([
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
    ]);

    const listings = listingRes?.data.results;
    const generalConfig = generalRes?.data?.results?.value;
    return {
      listings,
      generalConfig,
    };
  } catch (err: unknown) {
    return {
      listings: [],
      generalConfig: null,
      error: parseMessageFromError(err),
    };
  }
};

export default PublicTokenSalePage;
