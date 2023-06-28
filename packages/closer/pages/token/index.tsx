import Head from 'next/head';
import Image from 'next/image';
import router from 'next/router';

import { useContext, useEffect, useState } from 'react';

import Wallet from '../../components/Wallet';
import { Button, Card, Heading } from '../../components/ui';

import { useAuth } from '../../contexts/auth';
import { WalletState } from '../../contexts/wallet';
import { useBuyTokens } from '../../hooks/useBuyTokens';
import { useConfig } from '../../hooks/useConfig';
import api from '../../utils/api';
import { __ } from '../../utils/helpers';

const ACCOMMODATION_ICONS = ['van.png', 'camping.png', 'hotel.png'];

const PublicTokenSalePage = () => {
  const { PLATFORM_NAME } = useConfig() || {};
  const { user } = useAuth();
  const { getTokensAvailableForPurchase } = useBuyTokens();
  const isWalletEnabled =
    process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET === 'true';
  const [tokensAvailable, setTokensAvailable] = useState<number | null>(null);

  const { isWalletReady } = useContext(WalletState);

  const [listings, setListings] = useState<any[]>([]);

  useEffect(() => {
    if (isWalletReady) {
      (async () => {
        const remainingAmount = await getTokensAvailableForPurchase();
        setTokensAvailable(remainingAmount);
      })();
    }
  }, [isWalletReady]);

  useEffect(() => {
    (async () => {
      const res = await api.get('/listing');
      setListings(res.data.results);

    })();
  }, []);

  const handleNext = async () => {
    if (user && user.kycPassed === true) {
      router.push('/token/token-counter');
    } else {
      router.push('/token/nationality');
    }
  };

  if (process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE !== 'true') {
    return (
      <>
        <Head>
          <title>{`${__(
            'token_sale_public_sale_heading',
          )} - ${PLATFORM_NAME}`}</title>
        </Head>

        <div className="max-w-6xl mx-auto">
          <Heading level={1} className="mb-14">
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

      <main className="pt-16 pb-24 md:flex-row flex-wrap">
        <section className="mb-10">
          <div className='rounded-lg h-[500px] md:h-[700px] flex items-center flex-col bg-center bg-[#333333] bg-cover bg-no-repeat text-white bg-[url("/images/token-sale/token-sale-hero.png")]'>
            <h1 className="px-4 mb-8 mt-[170px] md:mt-[280px] max-w-[600px] text-center font-extrabold text-3xl md:text-6xl uppercase">
              {__('token_sale_public_sale_announcement')}
            </h1>

            <h2 className="px-4 mb-8 text-center leading-5 max-w-[460px] font-bold uppercase text-md">
              {__('token_sale_public_sale_subheading')}
            </h2>
            {isWalletReady ? (
              <Button
                className="!w-60 font-bold mb-3 md:mb-8 relative"
                onClick={handleNext}
              >
                <Image
                  className="absolute left-[200px] w-14 h-18"
                  src="/images/token-sale/arrow.png"
                  alt="arrow"
                  width={85}
                  height={99}
                />
                {__('token_sale_public_sale_buy_token')}
              </Button>
            ) : (
              <div className="px-6 py-2 rounded-full bg-white text-black">
                {__('token_sale_buy_wallet_not_ready')}
              </div>
            )}

            {tokensAvailable && (
              <h3 className="font-bold text-2xl">
                {tokensAvailable} {__('token_sale_public_sale_tokens_left')}
              </h3>
            )}
          </div>
        </section>

        {isWalletEnabled && (
          <div className="mb-16">
            <Wallet />
          </div>
        )}

        <section className="flex items-center flex-col py-24">
          <div className="w-full sm:w-[80%] ">
            <div className="text-center mb-20">
              <h2 className="mb-4 text-5xl font-bold">
                {__('token_sale_public_sale_key_info')}
              </h2>
              <div>{__('token_sale_public_sale_key_info_subhead')}</div>
            </div>
            <div className="flex flex-col sm:flex-row divide-x flex-wrap">
              <div className="mb-8 px-6 py-8 text-center flex flex-col gap-8 w-full sm:w-1/2 lg:w-1/4">
                <Heading level={3} className="uppercase text-center">
                  {__('token_sale_public_sale_heading_pink_paper')}
                </Heading>
                <p>{__('token_sale_public_sale_intro_pink_paper')}</p>
                <Button
                  className="text-[16px]"
                  onClick={() => {
                    router.push(
                      'https://docs.google.com/document/d/177JkHCy0AhplsaEEYpFHBsiI6d4uLk0TgURSKfBIewE/edit',
                    );
                  }}
                >
                  {__('token_sale_public_sale_button_read')}
                </Button>
              </div>
              <div className="mb-8 px-6 py-8 text-center flex flex-col gap-8 w-full sm:w-1/2 lg:w-1/4">
                <Heading level={3} className="uppercase text-center">
                  {__('token_sale_public_sale_heading_white_paper')}
                </Heading>
                <p>{__('token_sale_public_sale_intro_white_paper')}</p>
                <Button
                  className="text-[16px]"
                  onClick={() => {
                    router.push(
                      'https://oasa.earth/papers/OASA-Whitepaper-V1.2.pdf',
                    );
                  }}
                >
                  {__('token_sale_public_sale_button_read')}
                </Button>
              </div>
              <div className="mb-8 px-6 py-8 text-center flex flex-col gap-8 w-full sm:w-1/2 lg:w-1/4">
                <Heading level={3} className="uppercase text-center">
                  {__('token_sale_public_sale_heading_oasa_website')}
                </Heading>
                <p>{__('token_sale_public_sale_intro_investor_doc')}</p>
                <Button
                  className="text-[16px]"
                  onClick={() => {
                    router.push('https://oasa.earth');
                  }}
                >
                  {__('token_sale_public_sale_visit_site_button')}
                </Button>
              </div>
              <div className="mb-8 px-6 py-8 text-center flex flex-col gap-8 w-full sm:w-1/2 lg:w-1/4">
                <Heading level={3} className="uppercase text-center">
                  {__('token_sale_public_sale_heading_terms')}
                </Heading>
                <p>{__('token_sale_public_sale_intro_terms')}</p>
                <Button
                  className="text-[16px]"
                  onClick={() => {
                    router.push('/legal/terms');
                  }}
                >
                  {__('token_sale_public_sale_button_read')}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Ask us anything — waiting for texts and links */}
        {/* <section className="flex items-center flex-col py-24">
          <div className="w-full sm:w-[80%] ">
            <div className="text-center mb-20">
              <h2 className="mb-4 text-5xl font-bold">
                {__('token_sale_public_sale_heading_ask_us_anything')}
              </h2>
              <div>{__('token_sale_public_sale_subheading_ask_us_anything')}</div>
            </div>
            <div className="flex flex-col sm:flex-row gap-[2%] flex-wrap">
              <Card className="mb-8 px-6 py-8 text-center items-center flex flex-col gap-4 w-full sm:w-[49%] lg:w-[23%]">
                <Heading level={3} className="uppercase text-center">
                  {__('token_sale_public_sale_sam')}
                  <span className="block text-sm font-normal capitalize">
                    {__('token_sale_public_sale_visionary')}
                  </span>
                </Heading>
                <Image
                  src={'/images/token-sale/sam.jpg'}
                  alt="Sam"
                  width={100}
                  height={100}
                />

                <div className="text-sm text-center w-auto">
                  <div className="bg-accent-light rounded-full px-3 py-1 mb-1">
                    {__('token_sale_public_sale_tokenomics')}
                  </div>
                  <div className="bg-accent-light rounded-full px-3 py-1 mb-1">
                    {__('token_sale_public_sale_vision')}
                  </div>
                </div>
                <Button
                  className="text-[16px]"
                  onClick={() => {
                    router.push('/');
                  }}
                >
                  {__('token_sale_public_sale_button_book_a_call')}
                </Button>
              </Card>
              <Card className="mb-8 py-8 text-center items-center flex flex-col gap-4 w-full sm:w-[49%] lg:w-[23%]">
                <Heading level={3} className="uppercase text-center">
                  {__('token_sale_public_sale_bea')}
                  <span className="block text-sm font-normal capitalize">
                    {__('token_sale_public_sale_exec')}
                  </span>
                </Heading>
                <Image
                  src={'/images/token-sale/bea.jpg'}
                  alt="Bea"
                  width={100}
                  height={100}
                />

                <div className="text-sm text-center w-auto">
                  <div className="bg-accent-light rounded-full px-3 py-1 mb-1">
                    {__('token_sale_public_sale_tokenomics')}
                  </div>
                  <div className="bg-accent-light rounded-full px-3 py-1 mb-1">
                    {__('token_sale_public_sale_lifestyle')}
                  </div>
                </div>
                <Button
                  className="text-[16px]"
                  onClick={() => {
                    router.push('/');
                  }}
                >
                  {__('token_sale_public_sale_button_book_a_call')}
                </Button>
              </Card>
              <Card className="mb-8 px-6 py-8 text-center items-center flex flex-col gap-4 w-full sm:w-[49%] lg:w-[23%]">
                <Heading level={3} className="uppercase text-center">
                  {__('token_sale_public_sale_sam')}
                  <span className="block text-sm font-normal capitalize">
                    {__('token_sale_public_sale_governance_lead')}
                  </span>
                </Heading>
                <Image
                  src={'/images/token-sale/charlie.jpg'}
                  alt="Cahrlie"
                  width={100}
                  height={100}
                />

                <div className="text-sm text-center w-auto">
                  <div className="bg-accent-light rounded-full px-3 py-1 mb-1">
                    {__('token_sale_public_sale_tokenomics')}
                  </div>
                  <div className="bg-accent-light rounded-full px-3 py-1 mb-1">
                    {__('token_sale_public_sale_governance')}
                  </div>
                </div>
                <Button
                  className="text-[16px]"
                  onClick={() => {
                    router.push('/');
                  }}
                >
                  {__('token_sale_public_sale_button_book_a_call')}
                </Button>
              </Card>
              <Card className="mb-8 px-6 py-8 text-center items-center flex flex-col gap-4 w-full sm:w-[49%] lg:w-[23%]">
                <Heading level={3} className="uppercase text-center">
                  {__('token_sale_public_sale_juliana')}
                  <span className="block text-sm font-normal capitalize">
                    {__('token_sale_public_sale_space_host')}
                  </span>
                </Heading>
                <Image
                  src={'/images/token-sale/juliana.jpg'}
                  alt="Juliana"
                  width={100}
                  height={100}
                />

                <div className="text-sm text-center w-auto">
                  <div className="bg-accent-light rounded-full px-3 py-1 mb-1">
                    {__('token_sale_public_sale_lifestyle')}
                  </div>
                  <div className="bg-accent-light rounded-full px-3 py-1 mb-1">
                    {__('token_sale_public_sale_community')}
                  </div>
                </div>
                <Button
                  className="text-[16px]"
                  onClick={() => {
                    router.push('/');
                  }}
                >
                  {__('token_sale_public_sale_button_book_a_call')}
                </Button>
              </Card>
            </div>
          </div>
        </section> */}

        <section className="flex items-center flex-col py-24">
          <div className="w-full sm:w-[80%] flex items-center flex-col">
            <div className="text-center mb-12">
              <h2 className="mb-4 text-5xl font-bold">
                {__('token_sale_public_sale_heading_utility')}
              </h2>
              <div>{__('token_sale_public_sale_subheading_utility')}</div>
            </div>

            <div className="flex flex-col w-full md:w-[460px]">
              <div className="text-sm mt-20 mb-6 text-center">
                {__('token_sale_public_sale_utility_info_1')}
              </div>
              <div className="text-sm mb-6 text-accent text-center">
                {__('token_sale_public_sale_utility_info_2')}
              </div>
              <div className="text-sm mb-6 text-center">
                {__('token_sale_public_sale_utility_info_3')}
              </div>
              <div className="text-sm mb-6 text-center">
                {__('token_sale_public_sale_utility_info_4')}
              </div>
            </div>

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

                {/* Future accommodation types: */}
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
                    {__('token_sale_public_sale_token_symbol')}1
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
                    {__('token_sale_public_sale_token_symbol')}2
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
                    {__('token_sale_public_sale_token_symbol')}3
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
                    {__('token_sale_public_sale_token_symbol')}5
                  </p>
                </div>
              </Card>
              <div className="text-accent text-sm text-center">
                {__('token_sale_public_sale_prices_disclaimer')}
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center flex-col py-24">
          <div className="w-full sm:w-[80%] flex items-center flex-col">
            <div className="text-center mb-20">
              <h2 className="mb-4 text-5xl font-bold">
                {__('token_sale_public_sale_heading_why_now')}
              </h2>
            </div>
            <div className="flex flex-col w-full md:w-[460px]">
              <div>
                <ul className="flex flex-col gap-3 mb-10">
                  <li className='bg-[url("/images/token-sale/bullet.png")] bg-no-repeat pl-8'>
                    {__('token_sale_public_sale_benefit_1')}
                  </li>
                  <li className='bg-[url("/images/token-sale/bullet.png")] bg-no-repeat pl-8'>
                    {__('token_sale_public_sale_benefit_2')}
                  </li>
                  <li className='bg-[url("/images/token-sale/bullet.png")] bg-no-repeat pl-8'>
                    {__('token_sale_public_sale_benefit_3')}
                  </li>
                  <li className='bg-[url("/images/token-sale/bullet.png")] bg-no-repeat pl-8'>
                    {__('token_sale_public_sale_benefit_4')}
                  </li>
                  <li className='bg-[url("/images/token-sale/bullet.png")] bg-no-repeat pl-8'>
                    {__('token_sale_public_sale_benefit_5')}
                  </li>
                </ul>
                <div>
                  <p className="text-xs mb-4">
                    {__('token_sale_public_sale_example')}
                  </p>
                  <p className="text-xs">
                    {__('token_sale_public_sale_example_text')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center flex-col py-24">
          <div className="w-full sm:w-[80%] flex items-center flex-col">
            <div className="text-center mb-20">
              <h2 className="mb-4 text-5xl font-bold">
                {__('token_sale_public_sale_heading_tokenomics')}
              </h2>
              <div>{__('token_sale_public_sale_subheading_tokenomics')}</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
              <Card className="mb-0">
                <Heading level={3} className="uppercase text-center">
                  {__('token_sale_public_sale_subheading_base_price')}
                </Heading>
                <Image
                  src="/images/token-sale/tokenomics1.png"
                  alt="tokenomics"
                  width={415}
                  height={227}
                />
              </Card>
              <Card className="!mb-0">
                <Heading level={3} className="uppercase text-center">
                  {__('token_sale_public_sale_subheading_target_supply')}
                </Heading>
                <Image
                  src="/images/token-sale/tokenomics2.png"
                  alt="tokenomics"
                  width={415}
                  height={227}
                />
              </Card>
              <Card className="">
                <Heading level={3} className="uppercase text-center">
                  {__('token_sale_public_sale_subheading_sale_price')}
                </Heading>
                <Image
                  src="/images/token-sale/tokenomics3.png"
                  alt="tokenomics"
                  width={415}
                  height={227}
                />
              </Card>
              <Card className="">
                <Heading level={3} className="uppercase text-center">
                  {__('token_sale_public_sale_subheading_liquidity')}
                </Heading>
                <Image
                  src="/images/token-sale/tokenomics4.png"
                  alt="tokenomics"
                  width={415}
                  height={227}
                />
              </Card>
              <Card className="">
                <Heading level={3} className="uppercase text-center">
                  {__('token_sale_public_sale_subheading_future_scenarios')}
                </Heading>
                <Image
                  src="/images/token-sale/tokenomics5.png"
                  alt="tokenomics"
                  width={415}
                  height={227}
                />
              </Card>
              <Card className="">
                <Heading level={3} className="uppercase text-center">
                  {__('token_sale_public_sale_subheading_distribution')}
                </Heading>
                <Image
                  src="/images/token-sale/tokenomics6.png"
                  alt="tokenomics"
                  width={415}
                  height={227}
                />
              </Card>
            </div>
          </div>
        </section>

        <section className="flex items-center flex-col py-24">
          <div className="w-full sm:w-[80%] flex items-center flex-col">
            <div className="text-center mb-20">
              <h2 className="mb-4 text-5xl font-bold">
                {__('token_sale_public_sale_heading_roadmap')}
              </h2>
              <div>{__('token_sale_public_sale_subheading_roadmap')}</div>
            </div>
            <div className="max-w-[600px]">
              <div className="grid grid-cols-[37px_270px]">
                <div className="w-7 flex justify-center">
                  <div className="bg-accent w-[4px] h-[40px]"></div>
                </div>
                <div className="text-accent">
                  {__('token_sale_public_sale_roadmap_subheading_1')}
                </div>
                <div className="w-7 h-7 bg-accent rounded-full"></div>
                <Heading level={3} className="">
                  {__('token_sale_public_sale_roadmap_heading_1')}
                </Heading>
                <div className="w-7 flex justify-center">
                  <div className="bg-accent w-[4px] h-auto"></div>
                </div>
                <div className="h-40"></div>
              </div>

              <div className="grid grid-cols-[37px_270px]">
                <div className="w-7 flex justify-center">
                  <div className="bg-accent w-[4px] h-[40px]"></div>
                </div>
                <div className="text-accent">
                  {__('token_sale_public_sale_roadmap_subheading_2')}
                </div>
                <div className="w-7 h-7 bg-accent rounded-full"></div>
                <Heading level={3} className="">
                  {__('token_sale_public_sale_roadmap_heading_2')}
                </Heading>
                <div className="w-7 flex justify-center">
                  <div className="bg-accent w-[4px] h-auto"></div>
                </div>
                <div className="pb-20">
                  <ul className="list-disc pl-5 my-4">
                    <li>{__('token_sale_public_sale_roadmap_2_point_1')}</li>
                    <li>{__('token_sale_public_sale_roadmap_2_point_2')}</li>
                    <li>{__('token_sale_public_sale_roadmap_2_point_3')}</li>
                    <li>{__('token_sale_public_sale_roadmap_2_point_4')}</li>
                    <li>{__('token_sale_public_sale_roadmap_2_point_5')}</li>
                    <li>{__('token_sale_public_sale_roadmap_2_point_6')}</li>
                    <li>{__('token_sale_public_sale_roadmap_2_point_7')}</li>
                    <li>{__('token_sale_public_sale_roadmap_2_point_8')}</li>
                    <li>{__('token_sale_public_sale_roadmap_2_point_9')}</li>
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-[37px_270px]">
                <div className="w-7 flex justify-center">
                  <div className="bg-accent w-[4px] h-[40px]"></div>
                </div>
                <div className="text-accent"></div>
                <div className="w-7 h-7 bg-accent-light border-4 border-accent rounded-full"></div>
                <Heading level={3} className="">
                  {__('token_sale_public_sale_roadmap_heading_3')}
                </Heading>
                <div className="w-7 flex justify-center">
                  <div className="bg-accent-light w-[4px] h-auto"></div>
                </div>
                <div className="pb-20">
                  <Button
                    onClick={() => router.push('/token')}
                    type="secondary"
                    className="my-6"
                  >
                    {' '}
                    {__('token_sale_public_sale_roadmap_3_cta_button')}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-[37px_270px]">
                <div className="w-7 flex justify-center">
                  <div className="bg-accent-light w-[4px] h-[40px]"></div>
                </div>
                <div className="text-accent">
                  {__('token_sale_public_sale_roadmap_subheading_4')}
                </div>
                <div className="w-7 h-7 bg-accent-light rounded-full"></div>
                <Heading level={3} className="">
                  {__('token_sale_public_sale_roadmap_heading_4')}
                </Heading>
                <div className="w-7 flex justify-center">
                  <div className="bg-accent-light w-[4px] h-auto"></div>
                </div>
                <div className="pb-20">
                  <ul className="list-disc pl-5 my-4">
                    <li>{__('token_sale_public_sale_roadmap_4_point_1')}</li>
                    <li>{__('token_sale_public_sale_roadmap_4_point_2')}</li>
                    <li>{__('token_sale_public_sale_roadmap_4_point_3')}</li>
                    <li>{__('token_sale_public_sale_roadmap_4_point_4')}</li>
                    <li>{__('token_sale_public_sale_roadmap_4_point_5')}</li>
                    <li>{__('token_sale_public_sale_roadmap_4_point_6')}</li>
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-[37px_270px]">
                <div className="w-7 flex justify-center">
                  <div className="bg-accent-light w-[4px] h-[40px]"></div>
                </div>
                <div className="text-accent">
                  {__('token_sale_public_sale_roadmap_subheading_5')}
                </div>
                <div className="w-7 h-7 bg-accent-light rounded-full"></div>
                <Heading level={3} className="">
                  {__('token_sale_public_sale_roadmap_heading_5')}
                </Heading>
                <div className="w-7 flex justify-center">
                  <div className="bg-accent-light w-[4px] h-auto"></div>
                </div>
                <div className="pb-20">
                  <ul className="list-disc pl-5 my-4">
                    <li>{__('token_sale_public_sale_roadmap_5_point_1')}</li>
                    <li>{__('token_sale_public_sale_roadmap_5_point_2')}</li>
                    <li>{__('token_sale_public_sale_roadmap_5_point_3')}</li>
                    <li>{__('token_sale_public_sale_roadmap_5_point_4')}</li>
                    <li>{__('token_sale_public_sale_roadmap_5_point_5')}</li>
                    <li>{__('token_sale_public_sale_roadmap_5_point_6')}</li>
                    <li>{__('token_sale_public_sale_roadmap_5_point_7')}</li>
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-[37px_270px]">
                <div className="w-7 flex justify-center">
                  <div className="bg-accent-light w-[4px] h-[40px]"></div>
                </div>
                <div className="text-accent">
                  {__('token_sale_public_sale_roadmap_subheading_6')}
                </div>
                <div className="w-7 h-7 bg-accent-light rounded-full"></div>
                <Heading level={3} className="">
                  {__('token_sale_public_sale_roadmap_heading_6')}
                </Heading>
                <div className="w-7 flex justify-center">
                  <div className="bg-accent-light w-[4px] h-auto"></div>
                </div>
                <div className="pb-20">
                  <ul className="list-disc pl-5 my-4">
                    <li>{__('token_sale_public_sale_roadmap_6_point_1')}</li>
                    <li>{__('token_sale_public_sale_roadmap_6_point_2')}</li>
                    <li>{__('token_sale_public_sale_roadmap_6_point_3')}</li>
                    <li>{__('token_sale_public_sale_roadmap_6_point_4')}</li>
                    <li>{__('token_sale_public_sale_roadmap_6_point_5')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PublicTokenSalePage;
