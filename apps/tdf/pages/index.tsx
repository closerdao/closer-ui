import Head from 'next/head';
import Link from 'next/link';

import { useContext, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';

import PhotoGallery from 'closer/components/PhotoGallery';
import UpcomingEventsIntro from 'closer/components/UpcomingEventsIntro';

import {
  Heading,
  LinkButton,
  Tag,
  WalletState,
  YoutubeEmbed,
  useAuth,
} from 'closer';
import { useBuyTokens } from 'closer/hooks/useBuyTokens';
import api from 'closer/utils/api';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { NextPageContext } from 'next';
import { event } from 'nextjs-google-analytics';
import { useTranslations } from 'next-intl';

const HomePage = () => {
  const t = useTranslations();

  const { isAuthenticated } = useAuth();
  const { isWalletReady } = useContext(WalletState);
  const { getTokensAvailableForPurchase } = useBuyTokens();

  const [tokensAvailable, setTokensAvailable] = useState<number | null>(null);

  useEffect(() => {
    if (isWalletReady) {
      (async () => {
        const remainingAmount = await getTokensAvailableForPurchase();
        setTokensAvailable(remainingAmount);
      })();
    }
  }, [isWalletReady]);

  const CTA = isAuthenticated ? (
    <Link
      href="/stay"
      type="submit"
      className="bg-accent text-white rounded-full py-2.5 px-8 text-xl uppercase"
      onClick={() =>
        event('click', {
          category: 'HomePage',
          label: 'Book a stay',
        })
      }
    >
      Book a stay
    </Link>
  ) : (
    <Link
      href="/signup"
      type="submit"
      className="bg-accent text-white rounded-full py-2.5 px-8 text-xl uppercase"
      onClick={() =>
        event('click', {
          category: 'HomePage',
          label: 'Join the Dream',
        })
      }
    >
      JOIN THE DREAM
    </Link>
  );

  return (
    <>
      <Head>
        <title>Traditional Dream Factory</title>
        <meta
          name="description"
          content="Traditional Dream Factory (TDF) is a regenerative playground in Abela, Portugal."
        />
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
                Ready to explore life in a regenerative village?
              </Heading>
              <div className="my-4">
                <p className="text-xl md:text-2xl max-w-3xl">
                  We are building a climate resilient neighborhood of the future
                  in Portugal - and you are invited to be a part of it.
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
              Traditional Dream Factory
            </Heading>
            <p className="text-center md:text-left mb-6">
              Our current project is a 5 hectare regenerative playground in
              Abela, where we have a reforestation, food forest, glamping
              accomodations, industrial kitchen, cafe, sauna and more:
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
                    OPEN Coworking & STARLINK WIFI
                  </Heading>
                </li>
                <li className="flex justify-start items-center">
                  <img
                    src="/images/icons/van.png"
                    alt="Van"
                    className="mr-1 w-12"
                  />
                  <Heading display level={4} className="md:text-sm">
                    6 Van parking areas
                  </Heading>
                </li>
                <li className="flex justify-start items-center">
                  <img
                    src="/images/icons/glamping.png"
                    alt="Glamping"
                    className="mr-1 w-12"
                  />
                  <Heading display level={4} className="md:text-sm">
                    10 Glamping Accommodations
                  </Heading>
                </li>
                <li className="flex justify-start items-center">
                  <img
                    src="/images/icons/foodforest.png"
                    alt="Syntropic food forest"
                    className="mr-1 w-12"
                  />
                  <Heading display level={4} className="md:text-sm">
                    Food Forest + REFORESTATION
                    <p className="text-sm font-light">(w/ 2000+ trees)</p>
                  </Heading>
                </li>
                <li className="flex justify-start items-center">
                  <img
                    src="/images/icons/veggies.png"
                    alt="Veggetable production"
                    className="mr-1 w-12"
                  />
                  <Heading display level={4} className="md:text-sm">
                    Market garden{' '}
                    <small className="text-sm font-light">
                      (producing vegetables for 30+ people)
                    </small>
                  </Heading>
                </li>
                <li className="flex justify-start items-center">
                  <img
                    src="/images/icons/cafe.png"
                    alt="TDF Cafe"
                    className="mr-1 w-12"
                  />
                  <Heading display level={4} className="md:text-sm">
                    Mushroom farm{' '}
                    <Tag className="m-1" color="primary">
                      Coming soon
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
                    Pop-up event space
                  </Heading>
                </li>
                <li className="flex justify-start items-center">
                  <img
                    src="/images/icons/event.png"
                    alt="Events"
                    className="mr-1 w-12"
                  />
                  <Heading display level={4} className="md:text-sm">
                    Sauna
                  </Heading>
                </li>
                <li className="flex justify-start items-center">
                  <img
                    src="/images/icons/wellness.png"
                    alt="Wellness candle"
                    className="mr-1 w-12"
                  />
                  <Heading display level={4} className="md:text-sm">
                    Natural pool
                    <Tag className="m-1" color="primary">
                      Coming soon
                    </Tag>
                  </Heading>
                </li>
                <li className="flex justify-start items-center">
                  <img
                    src="/images/icons/restaurant.png"
                    alt="Restaurant plate"
                    className="mr-1 w-12"
                  />
                  <Heading display level={4} className="md:text-sm">
                    Pizza oven
                  </Heading>
                </li>
                <li className="flex justify-start items-center">
                  <img
                    src="/images/icons/cafe.png"
                    alt="TDF Cafe"
                    className="mr-1 w-12"
                  />
                  <Heading display level={4} className="md:text-sm">
                    Coffee shop
                  </Heading>
                </li>
                <li className="flex justify-start items-center">
                  <img
                    src="/images/icons/makerspace.png"
                    alt="Makerspace"
                    className="mr-1 w-12"
                  />
                  <Heading display level={4} className="md:text-sm">
                    Makerspace & workshop
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
              Check out our yearly reports to see everything we have done so
              far!
            </p>
            <Link
              href="/pdf/2021-TDF-report.pdf"
              target="_blank"
              className="bg-accent-light px-5 py-2 rounded-full uppercase mr-4"
            >
              2021 report
            </Link>
            <Link
              href="/pdf/2022-TDF-report.pdf"
              target="_blank"
              className="bg-accent-light px-5 py-2 rounded-full uppercase mr-4"
            >
              2022 report
            </Link>
            <Link
              href="/pdf/2024-TDF-report.pdf"
              target="_blank"
              className="bg-accent-light px-5 py-2 rounded-full uppercase"
            >
              2024 report
            </Link>
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
              Co-living Development{' '}
              <span className="justify-center align-center -mt-1 ml-4">
                <Tag color="primary">Plans approved!</Tag>
              </span>
            </Heading>
            <div className="md:flex md:flex-cols-2 md:space-x-2">
              <ul className="space-y-6">
                <li className="">
                  <Heading className="uppercase bold" level={3}>
                    Building 14 suites
                  </Heading>
                  <p>
                    Each suite has over 20m2 of living space - giving ample
                    space for resident to have a desk, private bathroom, a
                    luxurious queen sized bed. We are tailoring the interior to
                    fit the needs of digital nomads, young families, yogies, and
                    other conscious individuals.
                  </p>
                </li>
                <li className="">
                  <Heading className="uppercase bold" level={3}>
                    Bioclimatic buildings
                  </Heading>
                  <p>
                    The building is designed to be energy efficient, with
                    passive solar design, natural ventilation, and a solar roof
                    - making it a comfortable place to live year round while
                    producing it&apos;s own energy.
                  </p>
                </li>
                <li className="">
                  <Heading className="uppercase bold" level={3}>
                    Mixed use co-living & hospitality
                  </Heading>
                  <p>
                    The property is ideal for hosting large events (up to 100
                    people), and we are planning to use it for retreats,
                    workshops, and other events for 3 months out of the year
                    while running our own co-living community for 9 months out
                    of the year.
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-12 max-w-6xl mx-auto md:pt-20 md:flex md:flex-cols-2 space-x-4">
          <div className="max-w-prose">
            <Heading className="text-center md:text-left mb-6 uppercase text-2xl font-black">
              Agroforestry and land developments
            </Heading>
            <p>
              With over 3000 trees already planted on the land, and a plan to
              create a productive agroforestry system with over 10 000 fruit
              trees (including almonds, olives, citrus, berries etc) over the
              next few years, TDF is committed to creating a regenerative
              landscape that hydrates the land, sequesters carbon, and
              nourrishes our village and the local community.
            </p>
            <div className="md:flex md:flex-cols-2 mt-6">
              <ul className="space-y-6">
                <li className="">
                  <Heading className="uppercase bold" level={3}>
                    Creating a water retention landscape
                  </Heading>
                  <p>
                    Our swales collect runoff waters from the landscape and will
                    be storing it in our 2 planned lakes. This will ensure a
                    steady water supply year round.
                  </p>
                </li>

                <li className="">
                  <Heading className="uppercase bold" level={3}>
                    Restorative Farming Practices
                  </Heading>
                  <p>
                    TDF is committed to organic farming, avoiding synthetic
                    fertilizers and pesticides. Organic practices are employed
                    to maintain a balanced ecosystem, focusing on natural pest
                    control and the use of compost for soil nutrition.
                  </p>
                </li>

                <li className="">
                  <Heading className="uppercase bold" level={3}>
                    Biochar Production
                  </Heading>
                  <p>
                    Using syntropic methods, our agroforestry landscape is set
                    to produce excess biomass we can process into biochar.
                    Biochar improves soil fertility, increase water retention
                    and stimulates microbial activity, leading to healthier
                    trees and better crop yields - all while capturing carbon
                    from the atmosphere and producing excess energy in the
                    process.
                  </p>
                </li>

                <li className="italic mt-6">
                  Scalability and Future Prospects: TDF envisions this orchard
                  as a scalable model for regenerative and profitable farming,
                  demonstrating how environmental responsibility can align with
                  commercial success. The project could serve as blueprint for
                  future villages around the world.
                </li>
              </ul>
            </div>
          </div>
          <div>
            <div className="md:pl-4 mt-5">
              <img src="/images/maps/orchard.png" alt="TDF Orchard Map" />
            </div>
          </div>
        </section>

        <section className="py-20 my-12 bg-black text-white -mx-4">
          <div className="text-center mb-20">
            <div className="w-full flex items-center flex-col">
              <div className="max-w-prose">
                <p className="text-2xl max-w-prose">
                  {`Meet your new home, way of life, and tribe. 
                    Join a unique collective of creatives, digital nomads, solarpunks, web3 aficionados, permaculturists & entrepreneurs. 
                    Together, we're reshaping communal living.`}
                </p>
              </div>
            </div>
            <PhotoGallery className="mt-8" />
          </div>
        </section>

        <section className='-ml-4 w-[calc(100vw)] mb-20 h-[600px] md:h-[700px] flex  items-end md:items-center flex-col bg-center bg-[#333333] bg-cover bg-no-repeat text-white bg-[url("/images/token-sale/token-sale-hero.webp")]'>
          <Heading
            level={1}
            className="text-right  text-3xl md:text-6xl font-extrabold uppercase px-4 drop-shadow-lg mb-2 md:mb-8 md:text-center max-w-[700px] mt-1 md:mt-[100px] md:bg-[url('/images/token-sale/token-illy.png')] bg-no-repeat pt-[20px] md:pt-[130px] bg-top"
          >
            Gain exclusive access to regenerative living
          </Heading>
          <Heading
            level={2}
            className="font-bold text-right uppercase md:text-center px-4 text-xl md:text-md max-w-[700px] mb-4"
          >
            $TDF Unlocks access to housing in our village.
          </Heading>
          <LinkButton
            className="!w-60 font-bold mb-3 md:mb-8 relative text-xl mx-4"
            href="/token"
            size="small"
          >
            {t('token_sale_public_sale_buy_token')}
          </LinkButton>

          {/* {isWalletReady ? (
              <div className='p-4'>
                <TokenCounterSimple
                  tokensToBuy={tokensToBuy}
                  setTokensToBuy={setTokensToBuy}
                />

                <Button
                  className="!w-60 font-bold mb-3 md:mb-8 relative"
                  onClick={handleNext}
                  size="small"
                >
                  {t('token_sale_public_sale_buy_token')}
                </Button>
              </div>
            ) : (
              <div>
                <Button
                  onClick={() => {
                    router.push('https://calendly.com/samueldelesque');
                  }}
                >
                  {t('token_sale_public_sale_button_book_a_call')}
                </Button>
              </div>
            )} */}

          {tokensAvailable && (
            <h3 className="font-bold text-xl text-white pb-2 text-center w-60 px-6 rounded-full">
              {tokensAvailable} {t('token_sale_public_sale_tokens_left')}
            </h3>
          )}
        </section>

        <section className="mb-12" id="how-to-play">
          <div>
            <div className="max-w-prose mb-12 mx-auto" >

              <Heading
                level={2}
                className="text-center md:text-left mb-4 uppercase text-2xl font-black"
              >
                How to play
              </Heading>
              <p>
                While the village is in development we offer multiple ways to
                come and visit. Whether you are looking for a short stay, a
                longer term residency, or a work exchange - we have something
                for you.
              </p>
              <p>
                Once we get to know each other, and if there is mutual interest
                - you&apos;ll be invited to become a full member of the village.
                Members are returning residents who co-own the village together
                and can participate in the decision making process, and can
                apply for work opportunities.
              </p>
            </div>
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 justify-center align-center">
              <div className="p-4 border-2 border-primary rounded-xl md:w-[30%]">
                <div className="flex justify-between flex-col h-full">
                  <div>
                    <Heading level={4} className="text-center">
                      Guest
                    </Heading>
                    <p className="my-2 italic">
                      Come and enjoy the nature - work from our co-working
                      space, connect with out community and enjoy our
                      facilities.
                    </p>
                    <ul>
                      <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                        Private or shared glamping or van
                      </li>
                      <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                        Work on your own projects
                      </li>
                      <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                        Get discounted rates if you book for a week or more
                      </li>
                      <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                        1 day minimum stay
                      </li>
                    </ul>
                  </div>
                  <div className="mt-4 mb-4 flex justify-center align-center">
                    <Link href="/stay" className="uppercase btn-primary">
                      Book a stay
                    </Link>
                  </div>
                </div>
              </div>
              <div className="p-4 border-2 border-primary rounded-xl md:w-[30%]">
                <div className="flex justify-between flex-col h-full">
                  <div>
                    <Heading level={4} className="text-center">
                      Volunteer
                    </Heading>
                    <p className="my-2 italic">
                      Learn about permaculture, bioconstruction & cooking while
                      doing a work exchange.
                    </p>
                    <ul>
                      <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                        Work 4h/day
                      </li>
                      <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                        Free accomodation (dorm, shared glamper, or camping)
                      </li>
                      <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                        2 week minimum stay
                      </li>
                    </ul>
                  </div>
                  <div className="mt-4 mb-4 flex justify-center align-center">
                    <Link href="/volunteer" className="uppercase btn-primary">
                      See opportunities
                    </Link>
                  </div>
                </div>
              </div>
              <div className="p-4 border-2 border-primary rounded-xl md:w-[30%]">
                <div className="flex justify-between flex-col h-full">
                  <div>
                    <Heading level={4} className="text-center">
                      Resident
                    </Heading>
                    <p className="my-2 italic">
                      Apply for a 1+ month residency and leave a mark on our
                      village - maybe you are an expert carpenter - or maybe you
                      want to practice a new craft. Make a proposal for what
                      you&apos;d like to build and we will have a conversation.
                    </p>
                    <ul>
                      <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                        Work ~6h/day (project based)
                      </li>
                      <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                        Free accomodation
                      </li>
                      <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                        Free food
                      </li>
                      <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                        Accrue real estate assets for completing work
                      </li>
                      <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                        1 month minimum stay
                      </li>
                    </ul>
                  </div>
                  <div className="mt-4 mb-4 flex justify-center align-center">
                    <Link
                      href="/projects"
                      className="uppercase btn-primary"
                    >
                      Apply
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex justify-center my-20 -mx-4 p-4 py-12 bg-black text-white">
          <div className="max-w-prose flex flex-wrap">
            <Heading className="text-center md:text-left mb-6 uppercase text-2xl font-black">
              Not just a co-living - become part of a movement conserving &
              regenerating land
            </Heading>
            <p className="mb-8">
              TDF is part of the OASA network - transforming ownership into
              stewardship. The TDF project is bound by the{' '}
              <Link
                href="https://docs.google.com/document/d/1Ocv9rtRkDxsJmeRxrL6mV07EyWcHc2YqfN8mHoylO2E/edit"
                className="underline"
              >
                Regenerative Land Stewardship Principles
              </Link>{' '}
              set forth by OASA. By accessing TDF lands, our members and
              visitors must abide by our regenerative ethos. OASA is on a bold
              mission to conserve 100.000 ha of land globally - and TDF is its
              first prototype in utilising real estate as a vehicle for
              ecological restoration.
            </p>
            <Link
              href="https://oasa.earth/"
              target="_blank"
              className="underline"
            >
              Learn more
            </Link>
          </div>
        </section>

        <UpcomingEventsIntro />

        {/* this is needed because video embed in the header causes layout to be cut off at the bottom of the page */}
        <section className="mb-[120vh]"></section>
      </div>
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
