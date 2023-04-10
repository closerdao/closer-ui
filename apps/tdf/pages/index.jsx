import Head from 'next/head';
import Link from 'next/link';

import React, { useEffect } from 'react';

import { useAuth, EventsList, usePlatform } from 'closer';
import { event } from 'nextjs-google-analytics';

const loadTime = new Date();
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

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        platform.resource.get()
      ]);
    };

    loadData();
  }, [platform]);

  return (
    <div>
      <Head>
        <title>
          Traditional Dream Factory | Regenerative Playground in Alentejo, Portugal
        </title>
      </Head>
      <section className="text-right -ml-6 -mr-6 pt-20 pb-12 -mt-6 md:min-h-screen p-6 bg-cover bg-[url('/images/landing/sheep-mobile.jpg')] md:bg-[url('/images/landing/sheep-min.png')]">
        <div className="max-w-6xl mx-auto">
          <h1
            className="md:mt-20 mb-6 md:mb-12 text-4xl md:text-8xl text-white ml-8"
            data-testid="page-title"
          >
            A life of soils and souls regenerating together.
          </h1>
          <p
            className="md:mt-20 mb-6 md:mb-12 text-sm md:text-4xl text-white ml-8"
          >
            Traditional Dream Factory is the first  web3-powered
            regenerative village in Europe, on a mission to root a
            better way of living.
          </p>

          {!isAuthenticated && (
            <div className="mb-4">
              <Link
                href="/signup"
                type="submit"
                onClick={() =>
                  event('click', { category: 'HomePage', label: 'Join the Dream' })
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
                onClick={() =>
                  event('click', { category: 'HomePage', label: 'Download Investor Pack' })
                }
                className="btn-primary bg-primary-light md:text-xl"
              >
                Download Investor pack
              </Link>
            </div>
          ) : (
            <>
              <Link
                href="/subscribtions"
                type="submit"
                onClick={() =>
                  event('click', { category: 'HomePage', label: 'Get Membership' })
                }
                className="btn-primary"
              >
                GET MEMBERSHIP
              </Link>
            </>
          )}
        </div>
      </section>
      <section className="mb-12 max-w-6xl mx-auto md:pt-20">
        <h3 className="text-center py-12 px-4 mb-6">
          A prototype for a future of beautiful, connected regenerative living
        </h3>
        <ul className="flex flex-wrap text-center divide-x">
          { platform.resource.find() && platform.resource.find().map((resource) => (
            <li
              key={ resource.get('_id') }
              className="w-1/2 md:w-1/3 lg:w-1/4 mb-4 p-3"
            >
              <h4 className="mb-4">{resource.get('title')}</h4>
              <p className="mb-4 text-xs">{resource.get('content')}</p>
              <Link
                href={resource.get('url')}
                className="btn-primary"
              >
                {resource.get('ctaText')}
              </Link>
            </li>
          )) }
        </ul>
      </section>
      <section className="mb-12 max-w-6xl mx-auto md:pt-20 md:flex md:space-x-4">
        <div className="relative mb-6 md:mb-0">
          <img
            src="/images/landing/land.jpg"
            alt="Tree, at Traditional Dream Factory"
          />
          <div className="absolute bottom-0 left-0 right-0 text-white p-6 text-xs md:text-xl">
            <h3 className="md:text-6xl text-xl">
              THE  LAND
            </h3>
            <p className="mt-2">In 2020, we set our sights on a small, arid plot of land in the village of Abela, Portugal. Home to an old poultry farm, the land is surrounded by beautiful hills and valleys, protected oak trees, a flowing river, an earth-built farmhouse, and the old community mill.</p>
            <p className="mt-2">This poultry farm is our playground for change. The ground is ready to be relearned, rewilded and reincarnated into a brighter, abundant future.</p>
          </div>
        </div>
        <div className="relative">
          <img
            src="/images/landing/dream.jpg"
            alt="Dream at TDF"
          />
          <div className="absolute bottom-0 left-0 right-0 text-white p-6 text-xs md:text-xl md:text-right">
            <h3 className="md:text-6xl text-xl">
              THE DREAM
            </h3>
            <p className="mt-2">A burgeoning web3-powered regenerative village, shepherded by an inclusive and indomitable community fighting for better. Shared between 80-100 villagers, members will co-live purposefully in tune with the earth’s cycles, co-create in a space that will help them foster their own dreams, and empower them to drive positive change, together. </p>
            <p className="mt-2">We may be dreamers and futurists, but our dreams are rooted in realism. A new life of regeneration and co-living is waiting, and it starts at TDF in Abela.</p>
          </div>
        </div>
      </section>
      <section className="mb-12 max-w-6xl mx-auto md:pt-20 text-center md:text-left md:flex md:space-x-12">
        <div className="md:max-w-lg">
          <h2 className="mb-6">JOIN FELLOW FUTURISTS FOR UPCOMING EVENTS</h2>
          <p className="mb-6 text-xs md:text-base">TDF is more than the land from which we build. Regeneration transcends soil, bricks and mortar, and farming practices. It replenishes our souls, too, by uniting thinkers, earth warriors, travellers and impact investors, to supercharge a movement that will bring us all closer to a circular economy. Find a TDF event where you can get involved in the mission.</p>
        </div>
        <div className="flex-grow">
          <EventsList
            limit={2}
            cols={2}
            where={{
              end: {
                $gt: loadTime,
              }
            }}
          />
        </div>
      </section>
      <section className="mb-12 max-w-6xl mx-auto md:pt-20 md:flex md:flex-cols-2">
        <div className="md:max-w-lg">
          <h2 className="text-center md:text-left mb-6 md:text-6xl">
            Traditional Dream Factory
          </h2>
          <p className="text-center md:text-left mb-6">Our co-living quarters will be home to 14 large suites with a living room & kitchen, 3 loft studios with a music production live-in studio, and a private house for families or friends.</p>
          <p className="text-center md:text-left mb-6">The TDF village will be made up of:</p>
          <div className="md:flex md:flex-cols-2 md:space-x-6">
            <ul className="space-y-6">
              <li><h4 className="md:text-sm">Open Coworking, Coworking pods & Jungle phone booths</h4></li>
              <li><h4 className="md:text-sm">Indoors forest and tropical greenhouse</h4></li>
              <li><h4 className="md:text-sm">Experiential Restaurant</h4></li>
              <li><h4 className="md:text-sm">Café & Store</h4></li>
            </ul>
            <ul className="space-y-6">
              <li><h4 className="md:text-sm">Pop-up event space</h4></li>
              <li>
                <h4 className="md:text-sm">
                  Wellness area
                  <small className="text-sm">{' '}
                    (natural pool, sauna(s), yoga studio, massage parlor)
                  </small>
                </h4>
              </li>
              <li>
                <h4 className="md:text-sm">
                  Makerspace
                  <small className="text-sm">{' '}
                    (Lab, Atelier, Artist Studio, Workshop, Music Studio)
                  </small>
                </h4>
              </li>
            </ul>
          </div>
        </div>
        <div className="md:pl-32">
          <img src="/images/landing/map.svg" alt="TDF Map" />
        </div>
      </section>
      <section className="mb-12 max-w-6xl mx-auto md:pt-20 text-center md:flex md:justify-center">
        <div className="md:max-w-lg">
          <h3 className="mb-6">
            Your guide to<br/>
            <span className="text-3xl md:text-6xl">becoming a</span><br/>
            TDF VISIONARY
          </h3>
          <h4 className="mb-6">
            Ready to change the way  we live for good?  
          </h4>
          <p>We’re excited to have you on board.</p>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
