import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import router from 'next/router';

import React, { useEffect, useState } from 'react';

import {
  Button,
  EventsList,
  Heading,
  Newsletter,
  Tag,
  useAuth,
  usePlatform,
} from 'closer';
import { event } from 'nextjs-google-analytics';

const loadTime = new Date();
const RESOURCES_KEY = { sort_by: 'created' };
// interface Resource {
//   title: string;
//   slug: string;
//   url: string;
//   _id: string;
//   created: Date;
//   id: number;
// };
// : NextPage
const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const { platform } = usePlatform();
  const [loadedResources, setLoadedResources] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoadedResources(true);
      await platform.resource.get(RESOURCES_KEY);
    };

    if (!loadedResources) {
      loadData();
    }
  }, [platform]);

  return (
    <div>
      <Head>
        <title>Traditional Dream Factory</title>
        <meta
          name="description"
          content="Traditional Dream Factory (TDF) is a regenerative playground in Abela, Portugal."
        />
      </Head>
      <section className="pr-10 text-right -ml-6 -mr-6 pt-20 pb-12 -mt-6 mb-12 md:mb-32 md:min-h-screen p-6 bg-cover bg-[url('/images/landing/masthead-image.jpg')] md:bg-[url('/images/landing/masthead-image.jpg')]">
        <div className="max-w-6xl mx-auto">
          <Heading
            className="md:mt-20 mb-6 md:mb-12 text-4xl md:text-8xl text-white ml-8 "
            data-testid="page-title"
            display
          >
            Discover <br />
            the power of <br />
            regenerative <br />
            co-living.
          </Heading>
          <p className="md:mt-20 mb-6 md:mb-12 text-sm md:text-4xl text-white ml-8 font-bold">
            Your home for the future.
          </p>

          {!isAuthenticated && (
            <div className="mb-4">
              <Link
                href="/signup"
                type="submit"
                onClick={() =>
                  event('click', {
                    category: 'HomePage',
                    label: 'Join the Dream',
                  })
                }
                className="btn-primary btn-large"
              >
                JOIN THE DREAM
              </Link>
            </div>
          )}
          {!isAuthenticated ? (
            <div>
              <Link
                href="/pdf/tdf-private-sale.pdf"
                target="_blank"
                type="submit"
                onClick={(e) => {
                  e.preventDefault();
                  event('click', {
                    category: 'HomePage',
                    label: 'Download Investor Pack',
                  });
                  document.getElementById('subscribe').scrollIntoView();
                }}
                className="btn-primary-light md:text-xl"
              >
                Download Investor pack
              </Link>
            </div>
          ) : (
            <>
              <Link
                href="/subscriptions"
                type="submit"
                onClick={() =>
                  event('click', {
                    category: 'HomePage',
                    label: 'Get Membership',
                  })
                }
                className="btn-primary"
              >
                GET MEMBERSHIP
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="text-center flex justify-center flex-wrap mb-12">
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
        <Heading level={1} className="uppercase max-w-[750px] mb-12 ">
          <span className="block text-5xl font-extrabold">Discover</span>
          <span className="block text-7xl  font-extrabold">
            Traditional Dream Factory
          </span>
        </Heading>

        <div className="flex flex-wrap gap-4 w-full max-w-6xl">
          <div className="relative p-4 text-left w-full md:w-[48%] bg-gradient-to-r from-accent-alt-light to-accent-alt-medium">
            <Image
              className="absolute right-[10px] top-[10px]"
              src="/images/landing/illy-land.png"
              width={191}
              height={131}
              alt="Land"
            />
            <Heading className="mt-8 mb-2 uppercase text-5xl" level={2}>
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
            <Heading className="mt-8 mb-2 uppercase text-5xl" level={2}>
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
            <Heading className="mt-8 mb-2 uppercase text-5xl" level={2}>
              <br />
              DAO
            </Heading>
            <p className="text-md mb-4">
              TDF is a Decentralised Autonomous Organisation - aka a DAO,
              legally recognised in Switzerland through OASA (read more about
              this in OASAs Whitepaper). TDF DAO makes decisions based on
              different governance parameters:
            </p>
            <ul className="text-sm mb-4 list-disc pl-5">
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
            <Heading className="mt-8 mb-2 uppercase text-5xl" level={2}>
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

          <div className="relative p-4 text-left w-full  bg-neutral">
            <Heading className="mt-8 mb-2 uppercase text-5xl" level={2}>
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
            The TDF village will be made up of:
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
            href="/"
            target="_blank"
            className="bg-accent-light px-5 py-2 rounded-full uppercase mr-4"
          >
            {' '}
            2021 report
          </Link>
          <Link
            href="/"
            target="_blank"
            className="bg-accent-light px-5 py-2 rounded-full uppercase"
          >
            {' '}
            2022 report
          </Link>
        </div>
      </section>

      <section className="flex flex-wrap justify-center">
        <div>
          <Heading
            className="mb-6 max-w-3xl text-center mt-8  uppercase text-5xl bg-[url(/images/landing/spade.png)] bg-no-repeat pt-[170px] bg-top"
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
          <div className="max-w-[800px] border">
            <div className="grid grid-cols-[37px_370px]">
              <div className="w-7 h-7 bg-accent-alt rounded-full"></div>

              <Heading level={4} className="text-accent">
                APRIL 2021
              </Heading>

              <div className="w-7 flex justify-center">
                <div className="bg-accent-alt w-[4px] h-auto"></div>
              </div>
              <div className="pb-20 uppercase">
                <p>
                  <strong>Keys To The Chicken Farm. </strong>
                </p>
                <p>We move in to the ‘áviário’</p>
              </div>
            </div>

            <div className="grid grid-cols-[37px_370px]">
              <div className="w-7 h-7 bg-accent-alt rounded-full"></div>
              <Heading level={4} className="uppercase text-accent">
                <span className="font-normal">2021-2022</span> Phase 1 -
                Completed
              </Heading>
              <div className="w-7 flex justify-center">
                <div className="bg-accent-alt w-[4px] h-auto"></div>
              </div>
              <div className="pb-20">
                <p className="uppercase font-bold">Operational CO-LIVING</p>
                <ul className=" pl-5 my-4 list-none">
                  <li className="bg-[length:16px_16px] bg-[center_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    {' '}
                    Operational Event Venue (up to 100 guests)
                  </li>
                  <li className="bg-[length:16px_16px] bg-[center_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    10 Glamping Accommodations
                  </li>
                  <li className="bg-[length:16px_16px] bg-[center_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    Food Forest V1
                  </li>
                  <li className="bg-[length:16px_16px] bg-[center_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    Reforestation V1
                  </li>
                  <li className="bg-[length:16px_16px] bg-[center_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    Grey Water Treatment (Halophyte Filter) V1
                  </li>
                  <li className="bg-[length:16px_16px] bg-[center_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    {' '}
                    Solar Energy
                  </li>
                  <li className="bg-[length:16px_16px] bg-[center_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    {' '}
                    Functional Workshop and Makerspaces
                  </li>
                  <li className="bg-[length:16px_16px] bg-[center_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    {' '}
                    Industrial Kitchen
                  </li>
                  <li className="bg-[length:16px_16px] bg-[center_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    {' '}
                    Sauna
                  </li>
                  <li className="bg-[length:16px_16px] bg-[center_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    {' '}
                    Co-Working Space and Starlink{' '}
                  </li>
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-[37px_370px]">
              <div className="w-7 flex justify-center">
                <div className="bg-accent-alt w-[4px] h-[40px]"></div>
              </div>
              <div className="text-accent-alt"></div>
              <div className="w-7 h-7 bg-accent-alt-light border-4 border-accent-alt rounded-full"></div>
              <Heading level={4} className="uppercase text-accent">
                <span className="font-normal">2023 -2024</span> Phase 2 -
                FUNDRAISING
              </Heading>
              <div className="w-7 flex justify-center">
                <div className="bg-accent-alt-light w-[4px] h-auto"></div>
              </div>
              <div className="pb-20">
                <p className="uppercase font-bold">LAND, CO-LIVING & WATER</p>

                <p className="uppercase font-bold mt-6">We are here</p>

                {process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE && (
                  <Button
                    onClick={() => router.push('/token')}
                    className="my-6"
                  >
                    Help us fund phase 2
                  </Button>
                      )}
                      
                      <ul>
                        <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">Co-Living Building Renovation (roof, windows, insulation, flooring, energy and heating systems)</li>
                        <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">6 Suites with Private Bath</li>
                        <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">Natural Pool</li>
                        <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">Water Systems V2 (Co-Living Building & Land Water Capture)</li>
                        <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">Pay Off Loan & Transfer Chicken Farm Property Title into Enseada Sonhadora (local SPV owned by OASA, read Whitepaper) </li>
                        <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">Kitchen V2</li>
                        <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">Team Operations & Salaries</li>
                      </ul>
              </div>
            </div>

            <div className="grid grid-cols-[37px_370px]">
              <div className="w-7 flex justify-center">
                <div className="bg-accent-alt-light w-[4px] h-[40px]"></div>
              </div>
              <div className="text-accent-alt">6</div>
              <div className="w-7 h-7 bg-accent-alt-light rounded-full"></div>
              <Heading level={3} className="">
                7
              </Heading>
              <div className="w-7 flex justify-center">
                <div className="bg-accent-alt-light w-[4px] h-auto"></div>
              </div>
              <div className="pb-20">
                <ul className="list-disc pl-5 my-4">
                  <li>8</li>
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-[37px_270px]">
              <div className="w-7 flex justify-center">
                <div className="bg-accent-alt-light w-[4px] h-[40px]"></div>
              </div>
              <div className="text-accent-alt">9</div>
              <div className="w-7 h-7 bg-accent-alt-light rounded-full"></div>
              <Heading level={3} className="">
                9
              </Heading>
              <div className="w-7 flex justify-center">
                <div className="bg-accent-alt-light w-[4px] h-auto"></div>
              </div>
              <div className="pb-20">
                <ul className="list-disc pl-5 my-4">
                  <li>1111</li>
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-[37px_270px]">
              <div className="w-7 flex justify-center">
                <div className="bg-accent-alt-light w-[4px] h-[40px]"></div>
              </div>
              <div className="text-accent">1</div>
              <div className="w-7 h-7 bg-accent-alt-light rounded-full"></div>
              <Heading level={3} className="">
                1
              </Heading>
              <div className="w-7 flex justify-center">
                <div className="bg-accent-alt-light w-[4px] h-auto"></div>
              </div>
              <div className="pb-20">
                <ul className="list-disc pl-5 my-4">
                  <li>1</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* <section className="mb-12 max-w-6xl mx-auto md:flex md:space-x-20">
        <div className="relative mb-6 md:mb-0 card p-12 bg-secondary-light">
          <p className="mb-6 font-bold text-xl">
            Traditional Dream Factory are pioneers of regeneration, challengers
            of tomorrow, and prototypers of a better way of living. It’s our
            mission to co-create a more sustainable world for generations to
            come.
          </p>
          <p className="text-xl font-bold">Will you join us?</p>
          <div className="absolute -bottom-24 -right-24">
            <img
              src="/images/graphics/mushroom.png?"
              width="220"
              alt="TDF Mushroom"
            />
          </div>
        </div>
        <div className="relative text-right p-12">
          <Heading display level={3}>
            Co-create the regenerative dream
          </Heading>
          <p className="my-4">
            Invest in a DAO-based future of regenerative living. Help us
            transition to a land of freedom, and rewild a world we can all
            enjoy. Don’t just dream it. Sign up and join us as a key player in
            bringing this dream to reality.
          </p>
          {!isAuthenticated && (
            <div className="mb-4">
              <Link
                href="/signup"
                type="submit"
                onClick={() =>
                  event('click', {
                    category: 'HomePage',
                    label: 'Secure your place now',
                  })
                }
                className="btn-primary btn-large"
              >
                SECURE YOUR PLACE NOW
              </Link>
            </div>
          )}
        </div>
      </section> */}

      <section className="mb-12 max-w-6xl mx-auto md:pt-20">
        <Heading display level={3} className="text-center py-12 px-4 mb-6">
          A prototype for a future of beautiful, connected regenerative living
        </Heading>
        <ul className="flex flex-wrap text-center divide-x">
          <ul className="flex flex-wrap text-center divide-x">
            {platform.resource.find(RESOURCES_KEY) &&
              platform.resource.find(RESOURCES_KEY).map((resource) => (
                <li
                  key={resource.get('_id')}
                  className="w-1/2 md:w-1/3 lg:w-1/4 mb-4 p-3"
                >
                  <Heading display level={4} className="mb-4">
                    {resource.get('title')}
                  </Heading>
                  <p className="mb-4 text-xs">{resource.get('content')}</p>
                  <Link href={resource.get('url')} className="btn-primary">
                    {resource.get('ctaText')}
                  </Link>
                </li>
              ))}
          </ul>
        </ul>
      </section>

      <section className="mb-12 mt-24 max-w-6xl mx-auto text-center">
        <Heading display level={3}>
          Discover
          <br />
          <span className="md:text-7xl">Abela</span>
        </Heading>
        <p>a small Portuguese village of 400 inhabitants</p>
      </section>
      <section className="mb-12 max-w-6xl mx-auto md:pt-20 md:flex md:space-x-4">
        <div className="relative mb-6 md:mb-0">
          <img
            src="/images/landing/land.jpg"
            alt="Tree, at Traditional Dream Factory"
          />
          <div className="absolute bottom-0 left-0 right-0 text-white p-6 text-xs md:text-xl">
            <Heading display level={3} className="md:text-6xl text-xl">
              THE LAND
            </Heading>
            <p className="mt-2">
              In 2020, we set our sights on a small, arid plot of land in the
              village of Abela, Portugal. Home to an old poultry farm, the land
              is surrounded by beautiful hills and valleys, protected oak trees,
              a flowing river, an earth-built farmhouse, and the old community
              mill.
            </p>
            <p className="mt-2">
              This poultry farm is our playground for change. The ground is
              ready to be relearned, rewilded and reincarnated into a brighter,
              abundant future.
            </p>
          </div>
        </div>
        <div className="relative">
          <img src="/images/landing/dream.jpg" alt="Dream at TDF" />
          <div className="absolute bottom-0 left-0 right-0 text-white p-6 text-xs md:text-xl md:text-right">
            <Heading display level={3} className="md:text-6xl text-xl">
              THE DREAM
            </Heading>
            <p className="mt-2">
              A burgeoning web3-powered regenerative village, shepherded by an
              inclusive and indomitable community fighting for better. Shared
              between 80-100 villagers, members will co-live purposefully in
              tune with the earth’s cycles, co-create in a space that will help
              them foster their own dreams, and empower them to drive positive
              change, together. 
            </p>
            <p className="mt-2">
              We may be dreamers and futurists, but our dreams are rooted in
              realism. A new life of regeneration and co-living is waiting, and
              it starts at TDF in Abela.
            </p>
          </div>
        </div>
      </section>
      <section className="mb-12 max-w-6xl mx-auto md:pt-20 text-center md:text-left md:flex md:space-x-12">
        <div className="md:max-w-lg">
          <Heading display level={2} className="mb-6">
            JOIN FELLOW FUTURISTS FOR UPCOMING EVENTS
          </Heading>
          <p className="mb-6 text-xs md:text-base">
            TDF is more than the land from which we build. Regeneration
            transcends soil, bricks and mortar, and farming practices. It
            replenishes our souls, too, by uniting thinkers, earth warriors,
            travellers and impact investors, to supercharge a movement that will
            bring us all closer to a circular economy. Find a TDF event where
            you can get involved in the mission.
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

      <section className="mb-12 max-w-6xl mx-auto md:pt-20 text-center md:flex md:justify-center">
        <div className="md:max-w-lg" id="subscribe">
          <Heading display level={3} className="mb-6">
            Your guide to
            <br />
            <span className="text-3xl md:text-6xl">becoming a</span>
            <br />
            TDF VISIONARY
          </Heading>
          <Heading display level={4} className="mb-6">
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
  );
};

export default HomePage;
