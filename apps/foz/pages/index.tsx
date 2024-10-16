import Head from 'next/head';

import { GeneralConfig, Heading, api, useConfig } from 'closer';
import { parseMessageFromError } from 'closer/utils/common';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { NextPageContext } from 'next';

interface Props {
  generalConfig: GeneralConfig | null;
}

const HomePage = ({ generalConfig }: Props) => {
  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;

  return (
    <div>
      <Head>
        <title>{`Welcome to ${PLATFORM_NAME}!`}</title>
        <meta
          name="description"
          content="Foz is a regenerative playground in Portugal."
        />
      </Head>
      <section className="flex justify-center w-full">
        <div className="max-w-3xl w-full p-6 flex flex-col gap-4">
          <Heading level={1}>Bemvindo a Foz da Cova!</Heading>
          <p>
            Dear Visitor, welcome to Foz Da Cova’s booking platform! We could
            not be happier that you are here :){' '}
          </p>

          <p>
            Foz da Cova is a Portuguese former and forgotten village, nestled in
            a valley somewhere between Goís and Arganil (close to Coimbra).
            After being uninhabited for more than 35 years, you and us, are
            currently in the process of rebuilding a magical place.
          </p>

          <p>
            Today, we are happy to host you in several perfectly inhabitable
            warm houses fitted with stoves, beds, fully working toilets, fast
            internet, running water and electricity from mains, several kitchen
            areas, a bath house and lots of boardgames and books. Around it,
            breathtaking scenery, our own little river, beautiful nature and
            farming structures (i.e. ancient terraces) constitute the backdrop
            for our little idyll.
          </p>

          <p>
            Our aim is to provide a sustainable co-living space that combines
            (y)our skills and resources to create a haven for the exchange of
            knowledge, ideas, inspiration, laughter and so much more. We have
            been collectively working on and are still working on developing it
            into a space for regenerative arts, music and (agri)culture. We
            would love to see how you can contribute to our mission. So what are
            you waiting for? Contact us, if you have any questions under (insert
            housenumber and current email address and of course:{' '}
          </p>

          <p>Please Register your stay 🙂</p>
          <p></p>
        </div>
        {/* <div className="h-[100vh]">
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
        </div> */}
        {/* <div className="absolute left-0 top-0 w-full h-full flex justify-center ">
          <div className="w-full flex justify-center flex-col items-center">
            <div className=' max-w-6xl w-full p-6'>
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
        </div> */}
      </section>

      <div className="relative top-[105vh]">
        {/* <section className="mb-12 max-w-6xl mx-auto md:pt-20 md:flex md:flex-cols-2">
          <div className="md:max-w-xl">
            <Heading
              level={2}
              display
              className="text-center md:text-left mb-6 md:text-6xl"
            >
              Traditional Dream Factory
            </Heading>
            <p className="text-center md:text-left mb-6">
              Our co-living quarters will be home to 14 large suites with a
              living room & kitchen, 3 loft studios with a music production
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
                className="mb-4 text-5xl font-bold max-w-[600px]"
              >
                {t('token_sale_meet_your_home_heading')}
              </Heading>
              <Heading level={3} className="text-md max-w-[600px]">
                {t('token_sale_meet_your_home_subheading')}
              </Heading>
            </div>
            <PhotoGallery className="mt-12" />
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
              We crafted different journeys for curious souls to visit and
              build, to see if there’s a vibe to join. Currently, our focus is
              on opening doors to share our work and co-create, all the while
              supporting our team’s work and our Roadmap construction.
              <strong>
                With this in mind, we put together a visit & support model built
                with reciprocity at its core. It combines TDF’s needs, whilst
                providing folks with a easy way to visit, surprises and
                gratitude nudges on the ground.
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
                        {t('generic_coming_soon')}
                      </Heading>
                    ) : (
                      <div className="w-full text-left ">
                        <ul className="mb-4 w-full">
                          {plan.perks.split(',').map((perk) 
                            => {
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
                When humans thrive together, magical things happen. OASA
                Projects have{' '}
                <strong>regeneration, creativity, innovation</strong> and{' '}
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
        </section> */}

        {/* <Ama id="ama" /> */}

        {/* <UpcomingEventsIntro /> */}

        {/* this is needed because video embed in the header causes layout to be cut off at the bottom of the page */}
        {/* <section className="mb-[120vh]"></section> */}
      </div>
    </div>
  );
};

HomePage.getInitialProps = async (context: NextPageContext) => {
  try {
    const [generalRes, messages] = await Promise.all([
      api.get('/config/general').catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const generalConfig = generalRes?.data?.results?.value;
    return {
      generalConfig,
      messages,
    };
  } catch (err: unknown) {
    return {
      generalConfig: null,
      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default HomePage;
