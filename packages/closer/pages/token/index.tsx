import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useContext, useEffect, useState } from 'react';

import Ama from '../../components/Ama';
import Modal from '../../components/Modal';
import PeekIntoFuture from '../../components/PeekIntoFuture';
import PhotoGallery from '../../components/PhotoGallery';
import TokenCounterSimple from '../../components/TokenCounterSimple';
import YoutubeEmbed from '../../components/YoutubeEmbed';
import { Button, Card, Heading } from '../../components/ui';

import { INVESTMENT_COMPARISON } from '../../constants';
import { WalletState } from '../../contexts/wallet';
import { useBuyTokens } from '../../hooks/useBuyTokens';
import { useConfig } from '../../hooks/useConfig';
import { Listing } from '../../types';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { __ } from '../../utils/helpers';

const ACCOMMODATION_ICONS = ['van.png', 'camping.png', 'hotel.png'];
const DEFAULT_TOKENS = 10;

interface Props {
  listings: Listing[];
}

const PublicTokenSalePage = ({ listings }: Props) => {
  const { PLATFORM_NAME } = useConfig() || {};
  const { getTokensAvailableForPurchase } = useBuyTokens();
  const { isWalletReady } = useContext(WalletState);
  const router = useRouter();
  const { tokens } = router.query;

  const [tokensToBuy, setTokensToBuy] = useState<number>(
    tokens !== undefined ? Number(tokens) : DEFAULT_TOKENS,
  );

  const [tokensAvailable, setTokensAvailable] = useState<number | null>(null);
  const [isInfoModalOpened, setIsInfoModalOpened] = useState(false);
  const [selectedInvestmentIndex, setSelectedInvestmentIndex] = useState(0);

  const selectedInvestment = INVESTMENT_COMPARISON[selectedInvestmentIndex];

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
            <h1 className="drop-shadow-[1px_2px_2px_rgba(254,79,183,1)] px-4 mb-2 sm:mb-8 mt-[20px] sm:mt-[70px] md:mt-[190px] max-w-[700px] text-center font-extrabold text-5xl md:text-6xl uppercase">
              {__('token_sale_public_sale_announcement')}
            </h1>

            <h2 className="drop-shadow-lg px-4 mb-8 text-center leading-7 max-w-[600px] font-bold text-lg sm:text-2xl">
              {__('token_sale_public_sale_subheading')}
            </h2>

            {isWalletReady && (
              <TokenCounterSimple
                tokensToBuy={tokensToBuy}
                setTokensToBuy={setTokensToBuy}
              />
            )}

            <Button
              className="!w-60 font-bold mb-3 md:mb-8 relative"
              onClick={handleNext}
              size="small"
            >
              {__('token_sale_public_sale_buy_token')}
            </Button>

            {tokensAvailable && (
              <h3 className="font-bold text-2xl bg-accent-light text-accent py-2 text-center w-60 px-6 rounded-full">
                {tokensAvailable} {__('token_sale_public_sale_tokens_left')}
              </h3>
            )}
          </div>
        </section>

        <section className="flex items-center flex-col py-24">
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
        </section>

        <section className="flex items-center flex-col mb-32">
          <div className="w-full flex flex-col  gap-20">
            <div className="w-full flex items-center flex-col">
              <Heading level={2} className="text-lg text-center max-w-[640px]">
                {__('token_sale_tdf_heading')}
              </Heading>
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
        </section>

        <section className="flex items-center flex-col">
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
                    <Link
                      className="text-accent underline"
                      href="/bookings/create/dates"
                    >
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
        </section>

        <section className="flex items-center flex-col py-12 bg-accent-light my-20 px-2 sm:px-6">
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
        </section>

        <section className="flex items-center flex-col mb-32">
          <div className="w-full flex flex-col  gap-20">
            <div className="flex gap-20 justify-center items-center flex-col md:flex-row">
              <Image
                className="w-full md:w-1/3 max-w-[413px]"
                src="/images/token-sale/dive-deeper.png"
                width={413}
                height={548}
                alt={__('token_sale_tdf_heading')}
              />
              <div className="w-full md:w-2/3 flex flex-col gap-7 max-w-[430px] ">
                <Heading level={2} className="text-5xl">
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

        <PeekIntoFuture />

        <Ama />

        <section className="flex items-center flex-col py-24 ">
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
        </section>

        <section className="flex flex-wrap justify-center">
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
                <Heading level={4} className="text-accent">
                  APRIL 2021
                </Heading>
                <div className="w-7 flex justify-center">
                  <div className="bg-accent-alt w-[4px] h-auto"></div>
                </div>
                <div className="pb-12 uppercase">
                  <p>
                    <strong>Keys To The Chicken Farm. </strong>
                  </p>
                  <p>We move in to the ‘áviário’</p>
                </div>
              </div>
              <div className="grid grid-cols-[37px_240px] sm:grid-cols-[37px_370px]">
                <div className="w-7 h-7 bg-accent-alt rounded-full"></div>
                <Heading level={4} className="uppercase text-accent">
                  <span className="font-normal">2021-2022 Phase 1 -</span>
                </Heading>
                <div className="w-7 flex justify-center">
                  <div className="bg-accent-alt w-[4px] h-auto"></div>
                </div>
                <div className="pb-12">
                  <Heading level={4} className="uppercase text-accent">
                    Completed
                  </Heading>
                  <p className="uppercase font-bold">Operational CO-LIVING</p>
                  <ul className=" my-4 list-none">
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Operational Event Venue (up to 100 guests)
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      10 Glamping Accommodations
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Food Forest V1
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Reforestation V1
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Grey Water Treatment (Halophyte Filter) V1
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Solar Energy
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Functional Workshop and Makerspaces
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Industrial Kitchen
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Sauna
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Co-Working Space and Starlink
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
                  <span className="font-normal">2023 - 2024 Phase 2 -</span>
                </Heading>
                <div className="w-7 flex justify-center">
                  <div className="bg-accent-alt-light w-[4px] h-auto"></div>
                </div>
                <div className="pb-12">
                  <Heading level={4} className="uppercase text-accent">
                    FUNDRAISING
                  </Heading>
                  <p className="uppercase font-bold">LAND, CO-LIVING & WATER</p>
                  <p className="uppercase font-bold mt-6">We are here</p>
                  {process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE && (
                    <Button
                      onClick={() => router.push('/token')}
                      className="my-6"
                      size="small"
                    >
                      Help us fund phase 2
                    </Button>
                  )}
                  <ul>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Co-Living Building Renovation (roof, windows, insulation,
                      flooring, energy and heating systems)
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      6 Suites with Private Bath
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Natural Pool
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Water Systems V2 (Co-Living Building & Land Water Capture)
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Pay Off Loan & Transfer Chicken Farm Property into Enseada
                      Sonhadora (local SPV owned by OASA){' '}
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Kitchen V2
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Team Operations & Salaries
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
                  2024-2025 Phase 3
                </Heading>
                <div className="w-7 flex justify-center">
                  <div className="bg-accent-alt-light w-[4px] h-auto"></div>
                </div>
                <div className="pb-12">
                  <p className="font-bold uppercase mb-6">
                    Dream Spaces & Expansion
                  </p>
                  <ul>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      8 Suites added to Co-Living
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Workshop Building Renovation
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Co-Working Garden
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Farm to Table Restaurant + Cafe + Industrial Kitchen
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Purchase Land (currently rent contract with option to buy,
                      25he)
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
                  2025 Phase 4
                </Heading>
                <div className="w-7 flex justify-center">
                  <div className="bg-accent-alt-light w-[4px] h-auto"></div>
                </div>
                <div className="pb-12">
                  <p className="font-bold uppercase mb-6">Finishing Touches</p>
                  <ul>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      4 Studios
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Family House
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Green Roof
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Greenhouse (made out of old warehouses windows)
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Spa
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
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      TDF V2 Dream Session: Co-housing and Permanent Living?
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      4000m2 of permits to build
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      Governance Structure V2: Post Roadmap Era
                    </li>
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

PublicTokenSalePage.getInitialProps = async () => {
  try {
    const {
      data: { results: listings },
    } = await api.get('/listing');
    return {
      listings: listings,
    };
  } catch (err: unknown) {
    return {
      listings: [],
      error: parseMessageFromError(err),
    };
  }
};

export default PublicTokenSalePage;
