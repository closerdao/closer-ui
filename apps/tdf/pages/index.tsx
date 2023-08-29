import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import router from 'next/router';

import EventsList from 'closer/components/EventsList';
import Newsletter from 'closer/components/Newsletter';
import Resources from 'closer/components/Resources';

import { Button, Card, Heading, Tag, useAuth } from 'closer';
import { YoutubeEmbed } from 'closer';
import { SubscriptionPlan } from 'closer/types/subscriptions';
import api from 'closer/utils/api';
import { __ } from 'closer/utils/helpers';
import { event } from 'nextjs-google-analytics';

const loadTime = new Date();

interface Props {
  subscriptionPlans: SubscriptionPlan[];
}
const HomePage = ({ subscriptionPlans }: Props) => {
  const { isAuthenticated } = useAuth();

  return (
    <div>
      <Head>
        <title>Traditional Dream Factory</title>
        <meta
          name="description"
          content="Traditional Dream Factory (TDF) is a regenerative playground in Abela, Portugal."
        />
      </Head>
      <section className="absolute overflow-hidden left-0 h-[100vh] min-h-[100vh] min-w-[100vw] bg-accent-light pb-12 -mt-6 mb-12 md:mb-[100vh] text-right">
        <div className="h-[100vh]">
          <YoutubeEmbed isBackgroundVideo={true} embedId="VkoqvPcaRpk" />
        </div>
        <div className="max-w-6xl absolute right-5 sm:right-10 top-10 ">
          <Heading
            className="drop-shadow-lg md:mt-6 mb-6 md:mb-12 text-4xl sm:text-7xl md:text-8xl text-white ml-8 text-right"
            data-testid="page-title"
            display
          >
            Discover <br />
            the power of <br />
            regenerative <br />
            co-living.
          </Heading>
          <p className="md:mt-10 mb-6 md:mb-12 text-2xl md:text-4xl text-white ml-8 font-bold">
            Your home for the future.
          </p>

          <div className="mb-4">
            <Link
              href="/subscriptions"
              type="submit"
              className="btn-primary btn-large"
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
      </section>

      <div className='relative top-[105vh]'>
        <section className="text-center flex justify-center flex-wrap mb-12 ">
          <div className="max-w-[720px]">
            <p className="mb-6 ">
              Traditional Dream Factory is a web3-powered regenerative co-living
              space in Abela, Portugal.
            </p>
            <p className="mb-6 font-bold">
              We are pioneering a model for regenerative co-living while creating
              positive loops in all interactions between stakeholders including
              nature, all life, and future generations. The idea is to prove we
              can optimise resources while nurturing a creative and thriving
              community and at the same time leave a positive trace on the
              environment.
            </p>
            <p className="mb-6">
              TDF opened its gates in April 2021 and been named as “synchronicity
              paradise” where solarpunks, artists, families, regenerators, crypto
              folks, entrepreneurs and digital nomads meet.
            </p>
          </div>
        </section>
        <section className="text-center  flex justify-center flex-wrap mb-12 ">
          <div className="w-full flex justify-center">
            <Heading level={1} className="uppercase max-w-[750px] mb-12 ">
              <span className="block text-5xl font-extrabold">Discover</span>
              <span className="block text-5xl sm:text-7xl font-extrabold">
                Traditional Dream Factory
              </span>
            </Heading>
          </div>
          <div className="flex flex-wrap gap-4 w-full max-w-6xl justify-center">
            <div className="relative p-4 text-left w-full md:w-[48%] bg-gradient-to-r from-accent-alt-light to-accent-alt-medium">
              <Image
                className="absolute right-[10px] top-[10px]"
                src="/images/landing/illy-land.png"
                width={191}
                height={131}
                alt="Land"
              />
              <Heading
                className="mt-24 sm:mt-8 mb-2 uppercase text-5xl"
                level={2}
              >
                The <br />
                land
              </Heading>
              <p className="text-md mb-4">
                In 2020, we set our sights on a small, arid plot of land in the
                village of Abela, Portugal. Home to an old chicken farm, the land
                is surrounded by beautiful hills and valleys, protected oak trees,
                a winter-and-soon-to-be-also-summer-flowing river, a farmhouse,
                and an old community mill.
              </p>
              <p className="text-md mb-4">
                We purchased the land in Spring 2021, and now this chicken farm is
                our playground for change. The ground is being relearned, rewilded
                and cultivated into a lusher, moister and greener future.
              </p>
            </div>
            <div className="relative p-4 text-left w-full md:w-[48%] bg-gradient-to-r from-[#ffeef8] to-accent-light">
              <Image
                className="absolute right-[10px] top-[-20px]"
                src="/images/landing/illy-dream.png"
                width={186}
                height={144}
                alt="Land"
              />
              <Heading
                className="mt-24 sm:mt-8 mb-2 uppercase text-5xl"
                level={2}
              >
                The <br />
                dream
              </Heading>
              <p className="text-md mb-4">
                A burgeoning web3-powered regenerative co-living, TDF is
                shepherded by creative, playful and innovative folks. Designed to
                be stewarded by 80-100 members, these continuously return to TDF
                year after year, deepening their connection with the land and each
                other. TDF is a beloved home — a modern, comfortable space where
                friends gather, dreams are pursued, and positive change is driven,
                all while having fun.
              </p>
              <p className="text-md mb-4">
                We are dreamers and futurists, and don’t worry - our dreams are
                rooted in realism. A new life of regeneration and co-living is
                emerging, and it starts at TDF in Abela.
              </p>
            </div>
            <div className="relative p-4 text-left w-full md:w-[48%] bg-gradient-to-r from-[#ffeef8] to-accent-light">
              <Image
                className="absolute right-[20px] top-[-25px]"
                src="/images/landing/illy-dao.png"
                width={158}
                height={155}
                alt="Land"
              />
              <Heading
                className="mt-24 sm:mt-8 mb-2 uppercase text-5xl"
                level={2}
              >
                <br />
                DAO
              </Heading>
              <p className="text-md mb-4">
                TDF is a Decentralised Autonomous Organisation - aka a DAO,
                legally recognised in Switzerland through OASA (read more about
                this in OASAs Whitepaper). TDF DAO makes decisions based on
                different governance parameters:
              </p>
              <ul className="mb-4 list-disc pl-5">
                <li>
                  <strong>$TDF</strong> (the amount of tokens you hold)
                </li>
                <li>
                  <strong>Proof of Presence</strong> (the amount of time you spend
                  at TDF per year)
                </li>
                <li>Proof of Sweat (how much labour you’ve put into TDF)</li>
              </ul>
              <p className="text-md mb-4">
                *Presence and Sweat collected only by TDF Members (Sheep 🐑)
              </p>
            </div>
            <div className="relative p-4 text-left w-full md:w-[48%] bg-gradient-to-r from-accent-alt-light to-accent-alt-medium">
              <Image
                className="absolute right-[20px] top-[-25px]"
                src="/images/landing/illy-governance.png"
                width={120}
                height={155}
                alt="Land"
              />
              <Heading
                className="mt-24 sm:mt-8 mb-2 uppercase text-4xl sm:text-5xl"
                level={2}
              >
                <br />
                Governance
              </Heading>
              <p className="text-md mb-4">
                TDF is operated on principles of decentralised decision-making,
                regenerative working cultures, agile development, Sociocracy 3.0
                and likely many more. By decentralisation we mean that
                decision-making considers people and the different ways they
                interact with the TDF ecosystem, local stakeholders, nature and
                future generations.
              </p>
              <p>
                We see decentralisation as a practice, a verb, rather than a noun.{' '}
              </p>
            </div>
            <div className="p-4 text-left w-full md:w-[48%] bg-neutral">
              <Heading
                className="mt-8 mb-2 uppercase text-4xl sm:text-5xl"
                level={2}
              >
                FROM OWNERSHIP TO STEWARDSHIP
              </Heading>
              <p className="text-md mb-4 max-w-3xl">
                We&apos;re exploring new models for living together and
                challenging traditional ideas of ownership:{' '}
                <strong>
                  TDF is a blueprint for a system where the land owns itself
                </strong>
                ! The land belongs to OASA (a Land Trust-like Association), whilst
                TDF Members have the right of utilising the facilities we build on
                it, paired with the duty to care for and to bring more life to its
                soils. It&apos;s a new way of seeing home that goes beyond owning
                it. We&apos;re designing and building 7 generations ahead,
                focusing on the kind of ancestors we want to be. Our model is
                circular, designed to generate multiple kinds of wealth and
                capital to stakeholders that go beyond TDF Members and include the
                land, the local socio-economical system and more. TDF is living
                example of a big playground for regenerative living systems. And
                it&apos;s only the start!
              </p>
            </div>
          </div>
        </section>
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
              Our co-living quarters will be home to 14 large suites with a living
              room & kitchen, 3 loft studios with a music production live-in
              studio, and a private house for families or friends.
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
                    <p className="text-sm font-light">(w/ 200+ trees)</p>
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
                    <small className="text-sm font-light">(for 30+ people)</small>
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
              Check out our yearly reports to see everything we have done so far!
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
                <Heading level={4} className="font-normal uppercase text-accent">
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
                <Heading level={4} className="font-normal uppercase text-accent">
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
        <section className="text-center flex justify-center flex-wrap mb-12">
          <div className="max-w-[720px]">
            <Heading
              className="text-4xl mb-6 max-w-3xl text-center mt-8 font-extrabold uppercase sm:text-5xl"
              level={2}
            >
              <p className="text-7xl">TDF </p>
              VISIT, BUILD & JOIN
            </Heading>
            <p className="font-bold mb-6">
              At TDF we’re a passionate and fun group of friends, doers and
              dreamers.
            </p>
            <p className="font-bold mb-6">
              We are actively looking for 80-100 folks to join our flock, to
              become a fellow Sheep.
            </p>
            <p className="mb-6">
              We crafted different journeys for curious souls to visit and build,
              to see if there’s a vibe to join. Currently, our focus is on opening
              doors to share our work and co-create, all the while supporting our
              team’s work and our Roadmap construction.
              <strong>
                With this in mind, we put together a visit & support model built
                with reciprocity at its core. It combines TDF’s needs, whilst
                providing folks with a easy way to visit, surprises and gratitude
                nudges on the ground.
              </strong>
            </p>
            <p className="mb-6">
              There’s different ways for you to interact with our ecosystem,
              depending on your capacity and desire to step in. All is well, all
              paths lead to the same beautiful chicken farm full of sheep 🐑.
            </p>
            <p className="mb-6">Come and visit us!</p>
          </div>
        </section>
        <section className="flex justify-center flex-wrap mb-[120px]">
          <div className="flex flex-col sm:flex-row gap-[2%] justify-between flex-wrap w-full sm:max-w-6xl">
            {subscriptionPlans &&
              subscriptionPlans.map((plan) => (
                <Card
                  key={plan.title}
                  className="mb-8 px-4 py-6 text-center items-center flex flex-col justify-between gap-4 w-full sm:w-[49%] lg:w-[23%]"
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
            <div className="p-6 text-left w-full bg-accent-alt-light rounded-md max-w-6xl">
              <Heading className="mb-2 uppercase" level={4}>
                Which path is for me?
              </Heading>
              <p className="text-md mb-4 max-w-3xl">
                Want to see how the subscriptions compare to one another to choose
                the best option is right for you?
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
        <section className="flex justify-center mb-[120px]">
          <div className="max-w-6xl flex flex-wrap">
            <div className="w-full md:w-3/5">
              <Image
                src="/images/landing/illy-oasa.png"
                alt="OASA"
                width={656}
                height={435}
              />
            </div>
            <div className="w-full md:w-2/5 px-4">
              <Heading level={2} className="text-5xl ">
                OASA
              </Heading>
              <Heading level={3} className="uppercase mb-6">
                A web3 powered <br />
                nature conservancy network <br />
                serving regenerative living places and the planet
              </Heading>
              <p className="mb-6  ">
                When humans thrive together, magical things happen. OASA Projects
                have <strong>regeneration, creativity, innovation</strong> and{' '}
                <strong>playfulness</strong> at their core.
              </p>
              <p className="mb-6 uppercase font-bold">The goal?</p>
              <p className="mb-6 ">
                To acquire 100.000he of land to be held in a land
                conservation-like set up. 100,000 hectares of beautiful land
                waiting to be rewilded, nutritious landscapes to be grown, homes
                to be cultivated.
              </p>
              <Button
                size="small"
                isFullWidth={false}
                onClick={() => {
                  router.push('https://oasa.earth/');
                }}
              >
                Learn more about OASA
              </Button>
            </div>
          </div>
        </section>
        <section className="mb-12 max-w-6xl mx-auto md:pt-20 pb-20">
          <Heading
            display
            level={3}
            className="text-center font-bold py-12 px-4 mb-6"
          >
            A prototype FOR regenerative living
          </Heading>
          <Resources />
        </section>
        <section className="mb-20 flex justify-center">
          <div className='w-full max-w-6xl h-[500px] md:h-[600px] flex items-center flex-col bg-center bg-[#333333] bg-cover bg-no-repeat  bg-[url("/images/landing/token-sale-inverted.jpg")]'>
            <Heading
              level={2}
              className="px-4 mb-8 mt-[180px] md:mt-[200px] max-w-[600px] text-center font-extrabold text-3xl sm:text-5xl md:text-6xl uppercase"
            >
              $TDF Public Sale Now OPEN!
            </Heading>
            <h2 className="px-4 mb-8 text-center leading-5 max-w-[460px] font-bold uppercase text-md">
              The first crypto token that provides you with housing & food, while
              regenerating the planet
            </h2>
            {process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE === 'true' ? (
              <Button
                onClick={() => router.push('/token')}
                className="!w-60 font-bold mb-3 md:mb-8 relative"
              >
                <Image
                  className="absolute left-[200px] w-14 h-18"
                  src="/images/token-sale/arrow.png"
                  alt="arrow"
                  width={85}
                  height={99}
                />
                Buy $TDF
              </Button>
            ) : (
              <Heading level={3} className="uppercase">
                Coming soon!
              </Heading>
            )}
          </div>
        </section>
        <section className="mb-20 max-w-6xl mx-auto md:pt-20 text-center md:text-left md:flex md:space-x-12">
          <div className="md:max-w-lg w-full md:w-1/3">
            <Heading display level={2} className="mb-6 text-3xl">
              JOIN FELLOW FUTURISTS FOR UPCOMING EVENTS
            </Heading>
            <p className="mb-6 text-sm md:text-base">
              TDF is more than the land from which we build. Regeneration
              transcends soil, bricks and mortar and farming practices. It is also
              about our souls. It gathers thinkers, artists, farmers, developers,
              entrepreneurs, healers, investors - all to supercharge a movement
              that will bring us all closer to a regenerative whole-system. Come
              to TDF for an event where you can meet all these folks.
            </p>
          </div>
          <div className="flex-grow">
            <EventsList
              limit={2}
              cols={2}
              where={{
                end: {
                  $gt: loadTime,
                },
              }}
            />
          </div>
        </section>
        
        <section className=" mb-[120vh] max-w-6xl mx-auto md:pt-20 text-center flex justify-center">
          <div className="md:max-w-lg" id="subscribe">
            <Heading display level={3} className="mb-6">
              <span className="text-4xl">Your guide to</span>
              <br />
              <span className="text-5xl">becoming a</span>
              <br />
              <span className="text-4xl">TDF VISIONARY</span>
            </Heading>
            <Heading display level={4} className="mb-6 max-w-xs">
              Ready to change the way we live for good?
            </Heading>
            <p className="mb-6">We’re excited to have you on board.</p>
            <Newsletter
              placement="Landing"
              className="card"
              ctaText="Download your VISIONARY packs"
              onSuccess={() => window.open('/pdf/private-sale.pdf')}
            />
          </div>
        </section>
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
