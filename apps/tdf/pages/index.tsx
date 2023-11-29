import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import router from 'next/router';

import { isMobile } from 'react-device-detect';

import PhotoGallery from 'closer/components/PhotoGallery';
import Resources from 'closer/components/Resources';
import UpcomingEventsIntro from 'closer/components/UpcomingEventsIntro';

import { Button, Card, Heading, Tag, YoutubeEmbed } from 'closer';
import { SubscriptionPlan } from 'closer/types/subscriptions';
import api from 'closer/utils/api';
import { __ } from 'closer/utils/helpers';
import { event } from 'nextjs-google-analytics';

interface Props {
  subscriptionPlans: SubscriptionPlan[];
}
const HomePage = ({ subscriptionPlans }: Props) => {
  return (
    <div>
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
      <section className="absolute overflow-hidden left-0 h-[100vh] min-h-[100vh] min-w-[100vw] bg-accent-light pb-12 -mt-6 mb-12 md:mb-[100vh] text-right">
        <div className="h-[100vh]">
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
        <div className="absolute left-0 top-0 w-full h-full flex justify-center ">
          <div className="w-full flex justify-center flex-col items-center">
            <div className=" max-w-6xl w-full p-6">
              <Heading
                className=" w-6xl text-right drop-shadow-lg mb-6 md:mb-4 text-4xl sm:text-7xl md:text-8xl text-white"
                data-testid="page-title"
                display
                level={1}
              >
                Discover <br />
                the power of <br />
                regenerative <br />
                co-living.
              </Heading>
              <p className="drop-shadow-lg md:mt-4 mb-6 md:mb-6 text-2xl md:text-4xl text-white font-bold">
                Your home for the future.
              </p>
              <div>
                <Link
                  href="/signup"
                  type="submit"
                  className="bg-accent text-white rounded-full py-2.5 px-8 text-xl"
                  onClick={() =>
                    event('click', {
                      category: 'HomePage',
                      label: 'Join the Dream',
                    })
                  }
                >
                  JOIN THE DREAM
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="relative top-[105vh]">
        <section className="mb-12 max-w-6xl mx-auto md:pt-20 md:flex md:flex-cols-2">
          <div className="md:max-w-xl">
            <Heading
              level={2}
              display
              className="text-center md:text-left mb-6 md:text-6xl"
            >
              Traditional Dream Factory [dev]
            </Heading>
            <p className="text-center md:text-left mb-6">
              Our co-living quarters will be home to 14 large suites with a
              living room & kitchen, 4 loft studios with a music production
              live-in studio, and a private house for families or friends.
            </p>
            <p className="text-center md:text-left mb-6 uppercase font-bold">
              The TDF village is made up of:
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
                    Veggie farm{' '}
                    <small className="text-sm font-light">
                      (for 30+ people)
                    </small>
                    <Tag className="m-1" color="primary">
                      Just arrived!
                    </Tag>
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
                <li className="flex justify-start items-center">
                  <img
                    src="/images/icons/cafe.png"
                    alt="TDF Cafe"
                    className="mr-1 w-12"
                  />
                  <Heading display level={4} className="md:text-sm">
                    Farm to table restaurant{' '}
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
                    Wellness area
                    <small className="text-sm font-light">
                      {' '}
                      (natural pool, sauna(s), yoga studio, massage parlor)
                    </small>{' '}
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
                    Pizza oven{' '}
                    <Tag className="m-1" color="primary">
                      Coming soon
                    </Tag>
                  </Heading>
                </li>
                <li className="flex justify-start items-center">
                  <img
                    src="/images/icons/foodforest.png"
                    alt="Greenhouse"
                    className="mr-1 w-12"
                  />
                  <Heading display level={4} className="md:text-sm">
                    Indoors forest and tropical greenhouse{' '}
                    <Tag className="m-1" color="primary">
                      Coming soon
                    </Tag>
                  </Heading>
                </li>
                <li className="flex justify-start items-center">
                  <img
                    src="/images/icons/makerspace.png"
                    alt="Makerspace"
                    className="mr-1 w-12"
                  />
                  <Heading display level={4} className="md:text-sm">
                    Makerspace
                    <small className="text-sm font-light">
                      {' '}
                      (Lab, Atelier, Artist Studio, Workshop, Music Studio)
                    </small>{' '}
                    <Tag className="m-1" color="primary">
                      Coming soon
                    </Tag>
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
              className="bg-accent-light px-5 py-2 rounded-full uppercase"
            >
              2022 report
            </Link>
          </div>
        </section>

        <section className="flex items-center flex-col py-12 ">
          <div className="text-center mb-20 w-full md:max-w-6xl">
            <div className="w-full flex items-center flex-col">
              <Heading
                level={2}
                className="text-2xl font-bold"
              >
                {'Meet your new home, way of life, and tribe. Join a unique blend of solarpunks, web3 aficionados, holistic healers, permaculture pioneers, tree enthusiasts, tech wizards, and regenerative innovators. Together, we\'re reshaping communal living.'}
              </Heading>
            </div>
            <PhotoGallery className="mt-8" />
          </div>
        </section>

        <section className="text-center flex justify-center flex-wrap mb-12">
          <div className="max-w-[720px]">
            <Heading
              className="text-2xl mb-6 max-w-3xl text-center mt-8 italic"
              level={2}
            >
              TDF is a model for a regenerative economy. We are looking for 300 forward-thinking doer-dreamers to co-create a habitat where nature thrives. No fleeting promises here, just a space designed for regenerative living and deep connection. 🐑
            </Heading>
            <div>
              <Link
                href="/signup"
                type="submit"
                className="bg-accent text-white rounded-full py-2.5 px-8 text-xl"
                onClick={() =>
                  event('click', {
                    category: 'HomePage',
                    label: 'Join the Dreamers',
                  })
                }
              >
                JOIN THE DREAMERS
              </Link>
            </div>
          </div>
        </section>
        <section className="flex justify-center flex-wrap mb-[120px]">
          <div className="flex flex-col sm:flex-row gap-5 justify-between flex-wrap w-full sm:max-w-6xl">
            {subscriptionPlans &&
              subscriptionPlans.map((plan) => (
                <Card
                  key={plan.title}
                  className="mb-8 px-4 py-6 text-center items-center flex flex-col justify-between gap-4 w-full sm:flex-1"
                >
                  <div className="flex items-center gap-4 flex-col">
                    <Heading level={2} className="uppercase mb-6">
                      {plan.title}
                    </Heading>
                    <Image
                      alt={plan.slug || ''}
                      src={`/images/subscriptions/${plan.slug}.png`}
                      width={200}
                      height={320}
                    />
                    {plan.available === false ? (
                      <Heading level={3} className="uppercase">
                        <span className="block">🤩</span>
                        {__('generic_coming_soon')}
                      </Heading>
                    ) : (
                      <div className="w-full text-left ">
                        <ul className="mb-4 w-full">
                          {plan.perks.map((perk) => {
                            return (
                              <li
                                key={perk}
                                className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5"
                              >
                                <span className="block">
                                  {perk.includes('<') ? (
                                    <span
                                      dangerouslySetInnerHTML={{ __html: perk }}
                                    />
                                  ) : (
                                    perk
                                  )}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="w-[180px] text-center flex flex-wrap justify-center">
                    <Button
                      onClick={() => {
                        router.push('/subscriptions');
                      }}
                      size="small"
                    >
                      Explore
                    </Button>
                  </div>
                </Card>
              ))}
          </div>
          <div className="w-full flex justify-center">
            <div className="p-6 text-left w-full rounded-md max-w-6xl">
              <Heading className="mb-2 uppercase" level={4}>
                Which path is for me?
              </Heading>
              <p className="text-md mb-4 max-w-3xl">
                Want to see how the subscriptions compare to one another to
                choose the best option is right for you?
              </p>
              <Button
                size="small"
                isFullWidth={false}
                onClick={() => {
                  router.push('/subscriptions');
                }}
              >
                Compare subscriptions
              </Button>
            </div>
          </div>
        </section>
        <section className="flex justify-center mb-[120px] py-16 bg-accent-alt-light">
          <div className="max-w-6xl flex flex-wrap">
            <Heading level={3} className="mb-8">
              TDF is part of the OASA network - transforming ownership into stewardship. The TDF project is bound by the <Link href="https://docs.google.com/document/d/1Ocv9rtRkDxsJmeRxrL6mV07EyWcHc2YqfN8mHoylO2E/edit" className="underline">Regenerative Land Stewardship Principles</Link> set forth by OASA. By accessing TDF lands, our members and visitors must abide by our regenerative ethos. OASA is on a bold mission to conserve 100.000 ha of land globally - and TDF is its first prototype in utilising real estate as a vehicle for ecological restoration.
            </Heading>
            <Button
              size="small"
              isFullWidth={false}
              onClick={() => {
                router.push('https://oasa.earth/');
              }}
              type="secondary"
            >
              Learn more about OASA
            </Button>
          </div>
        </section>
        <section className="mb-12 max-w-6xl mx-auto md:pt-20 pb-20">
          <Heading
            display
            level={3}
            className="text-center font-bold py-12 px-4 mb-6"
          >
            A prototype for regenerative living
          </Heading>
          <Resources />
        </section>

        {/* <Ama id="ama" /> */}

        <UpcomingEventsIntro />

        {/* this is needed because video embed in the header causes layout to be cut off at the bottom of the page */}
        <section className="mb-[120vh]"></section>
      </div>
    </div>
  );
};

HomePage.getInitialProps = async () => {
  try {
    const {
      data: { results: subscriptions },
    } = await api.get('/config/subscriptions');

    return {
      subscriptionPlans: subscriptions.value.plans,
    };
  } catch (err) {
    return {
      subscriptionPlans: [],
      error: err,
    };
  }
};

export default HomePage;
