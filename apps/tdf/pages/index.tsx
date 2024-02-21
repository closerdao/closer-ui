import Head from 'next/head';
import Link from 'next/link';
import router from 'next/router';

import { isMobile } from 'react-device-detect';

import PhotoGallery from 'closer/components/PhotoGallery';
import UpcomingEventsIntro from 'closer/components/UpcomingEventsIntro';

import { Button, Heading, Tag, YoutubeEmbed, useAuth } from 'closer';
import api from 'closer/utils/api';
import { event } from 'nextjs-google-analytics';
const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const CTA = isAuthenticated ? (
    <Link
      href="/stay"
      type="submit"
      className="bg-accent text-white rounded-full py-2.5 px-8 text-xl"
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
      <section className="absolute overflow-hidden left-0 h-[100vh] min-h-[100vh] min-w-[100vw] bg-accent-light pb-12 -mt-6 mb-12 md:mb-[100vh]">
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
        <div className="absolute left-0 top-0 w-full h-full bg-white/60 flex justify-center ">
          <div className="w-full flex justify-center flex-col items-center">
            <div className=" max-w-4xl p-6 rounded-xl p-12">
              <Heading
                className="mb-6 md:mb-4 text-4xl sm:text-4xl md:text-6xl"
                data-testid="page-title"
                display
                level={1}
              >
                Ready to explore life in a regenerative village?
              </Heading>
              <div className="my-4">
                <p className="text-xl md:text-2xl max-w-3xl font-bold">
                  We are building a climate resilient neighborhood of the future in Portugal - and you are invited to be a part of it.
                </p>
              </div>
              <div>
                { CTA }
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
              Traditional Dream Factory
            </Heading>
            <p className="text-center md:text-left mb-6">
              Our current project is a 5 hectare regenerative playground in Abela, where we have a reforestation, food forest, glamping accomodations, industrial kitchen, cafe, sauna and more:
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
                    Pizza oven
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


        <section className="mb-12 max-w-6xl mx-auto md:pt-20 md:flex md:flex-cols-2">
          <div>
            <div className="md:pl-4 mt-5">
              <img src="/images/maps/co-living.png" alt="TDF Orchard Map" />
            </div>
          </div>
          <div className="md:max-w-xl">
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
                    Shared Suites (10 beds total):
                  </Heading>
                  <p>
                    Design: These suites are designed for shared living, offering
                    a bed per resident in a communal setting. Features: Ideal for
                    those who enjoy social living, these suites come with common
                    areas for interaction and collaboration.
                  </p>
                </li>
                <li className="">
                  <Heading className="uppercase bold" level={3}>
                    Private Suites (9 units):
                  </Heading>
                  <p>
                    Privacy and Comfort: These suites offer private space for
                    individuals or couples, balancing community engagement with
                    personal privacy. Amenities: Equipped with essential
                    amenities, these suites provide a comfortable and
                    self-contained living experience.
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-12 max-w-6xl mx-auto md:pt-20 md:flex md:flex-cols-2">
          <div className="md:max-w-xl">
            <Heading className="text-center md:text-left mb-6 uppercase text-2xl font-black">
              Agroforestry and land developments
            </Heading>
            <div className="md:flex md:flex-cols-2 md:space-x-2">
              <ul className="space-y-6">
                <li className="">
                  Orchard Development and Tree Selection: TDF plans to cultivate a
                  diverse range of fruit trees, with a focus on almonds and
                  olives, chosen for their market value, suitability to the
                  climate, and ecological benefits. These trees are ideal for
                  long-term agricultural projects due to their resilience and
                  minimal water needs.
                </li>

                <li className="">
                  <Heading className="uppercase bold" level={3}>
                    Productive orchard with 10k fruit trees
                  </Heading>
                  <p>
                    The orchard will be strategically laid out to ensure maximum
                    sun exposure, wind protection, and efficient land utilization.
                    The spacing between trees will be optimized for health and
                    productivity, and to facilitate maintenance and harvesting
                    activities.
                  </p>
                </li>

                <li className="">
                  <Heading className="uppercase bold" level={3}>
                    Creating a water retention landscape
                  </Heading>
                  <p>
                    A series of swales will lead runoff waters to our 2 planned
                    lakes. This will ensure a steady water supply year round.
                  </p>
                </li>

                <li className="">
                  <Heading className="uppercase bold" level={3}>
                    Restorative Farming Practices
                  </Heading>
                  <p>
                    TDF is committed to organic farming, avoiding synthetic
                    fertilizers and pesticides. Organic practices will be employed
                    to maintain a balanced ecosystem, focusing on natural pest
                    control and the use of compost for soil nutrition.
                  </p>
                </li>

                <li className="">
                  <Heading className="uppercase bold" level={3}>
                    Biochar Production
                  </Heading>
                  <p>
                    Using syntropic methods, the agroforest landscape is set to
                    produce excess biomass from pruning and other organic waste.
                    This biomass will be processed into biochar, a carbon-rich
                    material that significantly enhances soil quality - and which
                    we can export as an agricultural product.
                  </p>
                </li>

                <li className="">
                  <Heading className="uppercase bold" level={3}>
                    Transforming our soils into Terra Preta with Biochar
                  </Heading>
                  <p>
                    Applying the biochar we produce to the orchard&apos;s soil is
                    a game-changer. This practice will improve soil fertility,
                    increase water retention, and stimulate microbial activity,
                    leading to healthier trees and better crop yields - all while
                    capturing carbon from the atmosphere and producing excess
                    energy.
                  </p>
                </li>

                <li className="italic mt-6">
                  Scalability and Future Prospects: TDF envisions this orchard as
                  a scalable model for regenerative and profitable farming,
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

        <section className="flex items-center flex-col py-12 ">
          <div className="text-center mb-20 w-full md:max-w-6xl">
            <div className="w-full flex items-center flex-col">
              <Heading level={2} className="text-2xl font-bold">
                {`Meet your new home, way of life, and tribe. 
                  Join a unique blend of solarpunks, web3 aficionados, holistic healers, permaculture pioneers, tree enthusiasts, tech wizards, and regenerative innovators. 
                  Together, we're reshaping communal living.`}
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
              TDF is a model for a regenerative economy. We are looking for 300
              forward-thinking doer-dreamers to co-create a habitat where nature
              thrives. No fleeting promises here, just a space designed for
              regenerative living and deep connection.
            </Heading>
            {CTA}
          </div>
        </section>

        <section className="flex justify-center mb-[120px] py-16 bg-accent-alt-light">
          <div className="max-w-6xl flex flex-wrap">
            <Heading level={3} className="mb-8">
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

        <UpcomingEventsIntro />

        {/* this is needed because video embed in the header causes layout to be cut off at the bottom of the page */}
        <section className="mb-[120vh]"></section>
      </div>
    </>
  );
};

HomePage.getInitialProps = async () => {
  try {
    const {
      data: { results: subscriptions },
    } = await api.get('/config/subscriptions');

    return {
      subscriptionsConfig: subscriptions.value.plans,
    };
  } catch (err) {
    return {
      subscriptionsConfig: { enabled: false, plans: [] },
      error: err,
    };
  }
};

export default HomePage;
