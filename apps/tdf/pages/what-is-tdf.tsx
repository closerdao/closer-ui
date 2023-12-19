import Head from 'next/head';
import Link from 'next/link';

import PhotoGallery from 'closer/components/PhotoGallery';

import { Button, Heading, Tag } from 'closer';
import api from 'closer/utils/api';

const HomePage = () => {
  return (
    <div>
      <Head>
        <title>Traditional Dream Factory</title>
        <meta
          name="description"
          content="Traditional Dream Factory (TDF) is a regenerative village in Abela, Portugal."
        />
        <link
          rel="canonical"
          href="https://www.traditionaldreamfactory.com/"
          key="canonical"
        />
      </Head>
      <section className="flex flex-wrap">
        <div className="max-w-6xl m-auto py-32">
          <Heading
            className="w-4xl text-3xl sm:text-5xl md:text-5xl text-center"
            data-testid="page-title"
            display
            level={1}
          >
            We are building co-living space, a regenerative farm and a
            co-housing village.
          </Heading>
        </div>
      </section>

      <section className="flex items-center flex-col py-12 ">
        <div className="text-center mb-20 w-full md:max-w-6xl">
          <div className="w-full flex items-center flex-col">
            <Heading
              level={1}
              className="w-6xl md:mb-4 text-xl sm:text-4xl md:text-2xl text-center font-light"
            >
              We are pioneers of a new way of living. We are entrepreneurs,
              artists, engineers.
            </Heading>
          </div>
          <PhotoGallery className="mt-8" />
        </div>
      </section>

      <section className="mb-12 max-w-6xl mx-auto md:pt-20 md:flex md:flex-cols-2">
        <div className="md:max-w-xl">
          <p className="text-center md:text-left mb-6 uppercase text-2xl font-black">
            Our current playground
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
                  Coworking & STARLINK WIFI
                </Heading>
              </li>
              <li className="flex justify-start items-center">
                <img
                  src="/images/icons/van.png"
                  alt="Van"
                  className="mr-1 w-12"
                />
                <Heading display level={4} className="md:text-sm">
                  Van parking areas
                </Heading>
              </li>
              <li className="flex justify-start items-center">
                <img
                  src="/images/icons/glamping.png"
                  alt="Glamping"
                  className="mr-1 w-12"
                />
                <Heading display level={4} className="md:text-sm">
                  14 Glamping Accommodations
                </Heading>
              </li>
              <li className="flex justify-start items-center">
                <img
                  src="/images/icons/foodforest.png"
                  alt="Syntropic food forest"
                  className="mr-1 w-12"
                />
                <Heading display level={4} className="md:text-sm">
                  Agroforest
                </Heading>
              </li>
              <li className="flex justify-start items-center">
                <img
                  src="/images/icons/veggies.png"
                  alt="Veggetable production"
                  className="mr-1 w-12"
                />
                <Heading display level={4} className="md:text-sm">
                  Market garden
                </Heading>
              </li>
              {/* <li className="flex justify-start items-center">
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
              </li> */}
            </ul>
            <ul className="space-y-6 md:w-1/2">
              <li className="flex justify-start items-center">
                <img
                  src="/images/icons/cafe.png"
                  alt="TDF Cafe"
                  className="mr-1 w-12"
                />
                <Heading display level={4} className="md:text-sm">
                  Farm to table restaurant
                </Heading>
              </li>
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
              {/* <li className="flex justify-start items-center">
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
              </li> */}
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
              {/* <li className="flex justify-start items-center">
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
              </li> */}
              <li className="flex justify-start items-center">
                <img
                  src="/images/icons/makerspace.png"
                  alt="Makerspace"
                  className="mr-1 w-12"
                />
                <Heading display level={4} className="md:text-sm">
                  Workshop
                </Heading>
              </li>
            </ul>
          </div>
        </div>
        <div className="md:pl-16 -mt-20">
          <img src="/images/landing/tdf-map.png" alt="TDF Map" />
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
              <li className="">
                <Heading className="uppercase bold" level={3}>
                  Studios (4 units):
                </Heading>
                <p>
                  Self-Sufficient: Perfect for residents who prefer a compact
                  and efficient living space. Design: Each studio is fully
                  furnished, offering a blend of modern convenience and mini
                </p>
              </li>
              malist style.
              <li className="">
                <Heading className="uppercase bold" level={3}>
                  Single House (1 unit):
                </Heading>
                <p>
                  Spacious Living: This house offers more extensive living
                  space, suitable for families or groups. Features: Comes with
                  multiple bedrooms, a private kitchen, and living areas.
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
                  Applying the biochar we produce to the orchard's soil is a
                  game-changer. This practice will improve soil fertility,
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
          <div className="w-4xl md:mb-4 text-center mt-20">
            <Heading className="uppercase bold" level={2}>
              Future opportunity
            </Heading>
            <p className="text-xl sm:text-2xl md:text-3xl">
              With options to build around 12 town homes (on 10.000m2 urban
              lands) as well as a tiny house park, we have many opportunities
              for expansion.
            </p>
            <img
              src="/images/maps/built-area.png"
              className="mx-auto w-2/3"
              alt="TDF Co-housing Map"
            />
          </div>

          <Heading
            level={1}
            className="w-6xl md:mb-4 text-2xl sm:text-4xl md:text-5xl text-center mt-20"
          >
            Want to join us in 2024?
          </Heading>
          <div className="w-6xl md:mb-4 flex justify-center items-center text-xl sm:text-xl md:text-2xl text-center mt-20">
            <Button onClick={() => (window.location.href = '/stay')}>
              Join our co-living residency
            </Button>
          </div>
          <p className="w-6xl md:mb-4 text-xl sm:text-2xl md:text-3xl text-center mt-20">
            <Link
              href="mailto:play@traditionaldreamfactory.com?subject=investment"
              className="text-primary text-black"
            >
              Inquire about investment opportunities
            </Link>
          </p>
        </div>
      </section>
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
