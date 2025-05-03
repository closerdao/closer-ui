import Head from 'next/head';

import { useEffect } from 'react';

import {
  CustomSections,
  GeneralConfig,
  Listing,
  api,
  cdn,
  useAuth,
  useConfig,
  usePlatform,
} from 'closer';
import { User } from 'closer/contexts/auth/types';
import { Page } from 'closer/types/customPages';
import { parseMessageFromError } from 'closer/utils/common';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { NextPageContext } from 'next';

const getPage = ({
  listings,
  hosts,
  generalConfig,
}: {
  listings: Listing[] | null;
  hosts: User[] | null;
  generalConfig: GeneralConfig | null;
}) => {
  const localPage: Page = {
    isHomePage: true,
    sections: [
      {
        type: 'hero',
        data: {
          settings: {
            alignText: 'bottom-left',
            isInverted: true,
          },
          content: {
            title: 'EARTHBOUND ECOVILLAGE',
            body: 'A pilot project for regenerative <br/> & community living in Sweden',
            imageUrl:
              'https://cdn.oasa.co/custom-pages/earthbound/earthbound-hero.png',
            cta: {
              text: 'Join us',
              url: '/#how-to-join',
            },
          },
        },
      },
      {
        type: 'promoCard',
        data: {
          settings: {
            alignImage: 'left',
            isColorful: true,
            imageSize: 'large',
          },
          content: {
            title: 'WHAT IS EARTHBOUND',
            body: `<p>Earthbound is an upcoming ecovillage and think tank for rural community - and regenerative living in Southern Sweden. We are creating a community of 30 people stewarding 73 ha of land with a lake, ancient forest and 9 buildings. 
            </p><p>We are hosting a Bed & Breakfast and a cultural centre for a regenerative transformation. Our aim is to play a key part in the transition to a future that is sustainable, local and holistic.</p>`,
            imageUrl:
              'https://cdn.oasa.co/custom-pages/earthbound/Mask%20group.png',
          },
        },
      },

      {
        type: 'listing',
        data: {
          settings: {
            numColumns: 3,
            isSmallImage: true,
            isColorful: true,
          },
          content: {
            title: 'OUR CORE VALUES',
            items: [
              {
                title: 'Conscious Relationships',
                text: 'A socially well-functioning community with common ownership, common decision making methods and community processes.',
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/conscious-relationships.png',
              },
              {
                title: 'Regenerative Living',
                text: 'We embody a lifestyle that regenerates the land through traditional and novel land practices, building techniques, infrastructures and community-driven behavioural change. ',
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/regenerative-living.png',
              },
              {
                title: 'Earth-Centered Awareness',
                text: 'We base our daily rhythms, traditions and decisions on the land and a kincentric awareness, where humans and all other lifeforms are deeply interconnected.',
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/earth-centered-awareness.png',
              },
            ],
          },
        },
      },

      {
        type: 'promoCard',
        data: {
          settings: {
            alignImage: 'right',
            isColorful: true,
            imageSize: 'large',
          },
          content: {
            title: 'THE PLACE',
            body: `<ul><li>Located in the creative rural area of ‘Glasriket’ in Southern Småland, the historical 300-year old estate of ‘Grimsnäs Herrgard’ is the home of Earthbound Ecovillage</li>
            <li>EarthboundWe is continuing the heritage of Grimsnäs Herrgaard while giving it new life and purpose.</li>
            </ul>`,

            

            imageUrl: 'https://cdn.oasa.co/custom-pages/earthbound/11.png',
          },
        },
      },
      {
        type: 'promoCard',
        data: {
          settings: {
            alignImage: 'left',
            isColorful: true,
            imageSize: 'large',
          },
          content: {
            title: 'LAND',
            body: `<ul>
              <li>73 ha (~100 football fields) of diverse landscape including ancient forests, grazing lands, fields, a lake, and wetland</li>
              <li>Swimming lake with an island</li>
              <li>Own water source with high-quality purification system</li>
              <li>Biodiverse forest with ancient oak and hazel trees</li>
              <li>Part of the forest is under nature protection laws</li>
              <li>Direct trains to:
                <ul>
                  <li>Copenhagen (3h)</li>
                  <li>Malmö (2.5h)</li>
                  <li>Gothenburg (3h)</li>
                  <li>Stockholm (4h, 1 stop)</li>
                </ul>
              </li>
            </ul>
            `,

            imageUrl: 'https://cdn.oasa.co/custom-pages/earthbound/22.png',
          },
        },
      },
      {
        type: 'promoCard',
        data: {
          settings: {
            alignImage: 'right',
            isColorful: true,
            imageSize: 'large',
          },
          content: {
            title: 'BUILDINGS',
            body: `<ul>
              <li>7 well-maintained, solid wood (log) buildings and a large barn (45x10 m)</li>
              <li>3 buildings are renovated & ready-to-move-in houses with:
                <ul style="margin-bottom: 0">
                  <li>18 furnished bedrooms</li>
                  <li>25 - 30 beds</li>
                  <li>750 m² total area</li>
                </ul>
              </li>
              <li>Buildings are as old as 270 years and mostly wood-heated</li>
              <li>We will take over the already established award-winning Bed & Breakfast business 'Grimsnäs Herrgaard'</li>
            </ul>
            `,

            imageUrl: 'https://cdn.oasa.co/custom-pages/earthbound/33.png',
          },
        },
      },
      {
        type: 'listing',
        data: {
          settings: {
            numColumns: 3,
            isSmallImage: true,
            isColorful: true,
          },
          content: {
            title: 'OUR IMPACT',
            items: [
              {
                title: 'Low-impact, Affordable and Non-speculative Housing',
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/_0004_low-impact.png',
                text: `
                <ul style="text-align: left;">
                  <li>Natural and traditional building and restoration</li>
                  <li>Water catchment and greywater systems</li>
                  <li>Creating a renewable energy community</li>
                </ul>
                `
              },
              {
                title: 'Local and Bioregional Changemakers',
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/_0003_Local-and-Bioregional-Changemakers.png',
                text: `
                  
                Engaging with the local community by addressing regional needs, such as:

                
                <ul style="text-align: left;">
                  <li>Starting a local and organic shop with everyday necessities</li>
                  <li>Establishing creative and “co-sustainability” open workshops (e.g., ceramics studio, tools library, and home-production machinery)</li>
                  <li>Hosting community events and celebrations</li>
                  </ul>
                  `
              },
              {
                title: 'Community Research',
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/_0000_Community-Research.png',
                text: `
             
                  <ul style="text-align: left;">
                    <li>Integrating peaceful co-existence through community practices</li>
                    <li>Common decision-making and ownership</li>
                    <li>Community guidelines including conflict resolution</li>
                  </ul>
                  `
              },

              {
                title: 'Permaculture and Regenerative Agriculture',

                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/_0002_Permaculture-and-Regenerative-Agriculture.png',
                  text: `
                  <ul style="text-align: left;">
                  <li>Serving as a test field for future regenerative farming techniques</li>
                  <li>Providing food to the local region</li>

                  
                  </ul>
                  `
              },
              {
                title: 'Sustainable Micro-Business Hub',

                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/sustainable.png',
                  text: `
                  <ul style="text-align: left;">
                  <li>Renovating 600+ sqm of barn spaces to support sustainable micro-businesses</li>
                  <li>Encouraging community and regional positive change</li>

                   
                  </ul>
                  `
              },
              {
                title: 'Land Stewardship',
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/_0001_Land-Stewardship.png',
                text: `
                <ul style="text-align: left;">
                  <li>Stewarding 73 hectares of diverse landscapes, including biodiverse forest, wetlands, lakes, production forests, and fields</li>
                  <li>Maintaining grazing areas and restoring biodiverse forests</li>
               
                  </ul>
                  `
              },
              {
                title: 'Think Tank & Pilot Project',
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/Think%20Thank%20&%20Pilot.png',   
                  text: `
                  <ul style="text-align: left;">
                    <li>Tracking and gathering the successes and failures</li>
                    <li>Communicating our results through publications, events and embodied experiences</li>
                    <li>Collaborating with other actors in the field</li>
                  </ul>
                  `
              },
            ],
          },
        },
      },

      {
        type: 'listing',
        data: {
          settings: {
            numColumns: 3,
            isSmallImage: true,
            isColorful: true,
          },
          content: {
            title: 'THE PEOPLE',
            description:
              'In due time, Earthbound ecovillage will be the home of 30 adults. We are currently 6 founders - all deeply inspired by communities and regenerative initiatives around the world. Meet the founding group here.',
            items: hosts?.map((host) => ({
              title: host.screenname,
              text: host?.about || '',
              imageUrl: host?.photo
                ? `${cdn}${host.photo}-profile-lg.jpg`
                : null,
            })),
          },
        },
      },

      {
        type: 'listing',
        data: {
          settings: {
            numColumns: 3,
            isSmallImage: true,
            isColorful: true,
          },
          content: {
            title: 'OUR MODEL ',
            description:
              'We\'re introducing a new model for communities in Scandinavia to own and govern together. Our format shapes a strong, ethical financial and legal structure based on “community logic”. Designed to be easy to replicate, it paves the way for future community-led initiatives. You can read about the key aspects of our model below.',
            items: [
              {
                title: 'NON PROFIT, NON SPECULATIVE',
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/_0002_non-profit.png',
                text: 'All income is reinvested in the project, investments have a social and environmental return (rather than financial), and we have taken the real estate out of the speculative housing market.  '

              },
              
              {
                title: 'SAFE, ETHICAL AND IMPACTFUL INVESTMENTS',

                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/_0000_safe.png',
                text: 'Inspired and consulted by the French Les Pas-Sages model, Earthbound Ecovillage is owned by the community of individuals living in the ecovillage and impact investors who are aligned with our ethos. Read more about investing <a href="/pages/invest">here</a>.  '
              },
              {
                title: 'SOCIOCRACY+',

                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/_0001_socio.png',
                text: 'Our decision making and organising structures are based on sociocracy. This means that we make decisions through the consent of all members ensuring inclusivity and collective intelligence'
              },
            ],
          },
        },
      },

      {
        type: 'listing',
        data: {
          settings: {
            numColumns: 4,
            isColorful: true,
            id: 'how-to-join',
          },
          content: {
            title: 'HOW TO JOIN',
            description:
              'We are still growing and invite you to be a part of this exciting phase and the movement!',
            items: [
              {
                title: 'IMPACT INVESTOR',
                text: '<p>Invest in a truly human-scale regenerative project. As an impact investor you are part of making Earthbound a reality and of steering the greater vision and direction.',
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/impact-investor.png',
                cta: {
                  text: 'More info',
                  url: '/pages/invest',
                },
              },
              {
                title: 'COMMUNITY MEMBER',
                text: 'Do you want to live in a deep and intergenerational community and steward the land and vision of Earthbound?',
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/comm-member.png',
                cta: {
                  text: 'More info',
                  url: '/pages/community',
                },
              },
              {
                title: 'VISITOR',
                text: 'Do you want to experience the magic of Earthbound? Visit us, enjoy our B&B offers, slow down and get a taste of community life deep in the Swedish forest.',
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/visitor.png',
                cta: {
                  text: 'Book a stay',
                  url: '/stay',
                },
              },
              {
                title: 'VOLUNTEER',
                text: 'We are planning to open up for volunteers in the future. Stay connected with us on our newsletter or telegram channel to be the first to hear about volunteering options.',
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/volunteer.png',
              },
            ],
          },
        },
      },
      {
        type: 'gallery',
        data: {
          settings: {
            type: 'masonry',
          },
          content: {
            items: [
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/gallery/0.png',
                alt: 'EARTHBOUND ecovillage - A pilot project for regenerative & community living in Sweden',
                width: 1573,
                height: 1178,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/gallery/1.png',
                alt: 'EARTHBOUND ecovillage - A pilot project for regenerative & community living in Sweden',
                width: 885,
                height: 1180,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/gallery/2.png',
                alt: 'EARTHBOUND ecovillage - A pilot project for regenerative & community living in Sweden',
                width: 885,
                height: 1178,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/gallery/3.png',
                alt: 'EARTHBOUND ecovillage - A pilot project for regenerative & community living in Sweden',
                width: 2038,
                height: 1360,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/gallery/4.png',
                alt: 'EARTHBOUND ecovillage - A pilot project for regenerative & community living in Sweden',
                width: 1767,
                height: 1180,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/gallery/5.png',
                alt: 'EARTHBOUND ecovillage - A pilot project for regenerative & community living in Sweden',
                width: 787,
                height: 1180,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/gallery/6.png',
                alt: 'EARTHBOUND ecovillage - A pilot project for regenerative & community living in Sweden',
                width: 787,
                height: 1176,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/gallery/7.png',
                alt: 'EARTHBOUND ecovillage - A pilot project for regenerative & community living in Sweden',
                width: 1771,
                height: 1178,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/gallery/8.png',
                alt: 'EARTHBOUND ecovillage - A pilot project for regenerative & community living in Sweden',
                width: 1765,
                height: 1178,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/gallery/g9.jpg',
                alt: 'EARTHBOUND ecovillage - A pilot project for regenerative & community living in Sweden',
                width: 1600,
                height: 2133,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/gallery/g10.jpg',
                alt: 'EARTHBOUND ecovillage - A pilot project for regenerative & community living in Sweden',
                width: 1600,
                height: 1067,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/gallery/g11.jpg',
                alt: 'EARTHBOUND ecovillage - A pilot project for regenerative & community living in Sweden',
                width: 1600,
                height: 1066,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/gallery/g12.jpg',
                alt: 'EARTHBOUND ecovillage - A pilot project for regenerative & community living in Sweden',
                width: 1600,
                height: 2129,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/gallery/g13.jpg',
                alt: 'EARTHBOUND ecovillage - A pilot project for regenerative & community living in Sweden',
                width: 1600,
                height: 1555,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/gallery/g14.jpg',
                alt: 'EARTHBOUND ecovillage - A pilot project for regenerative & community living in Sweden',
                width: 1600,
                height: 2133,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/gallery/g15.jpg',
                alt: 'EARTHBOUND ecovillage - A pilot project for regenerative & community living in Sweden',
                width: 1600,
                height: 2844,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/gallery/g16.jpg',
                alt: 'EARTHBOUND ecovillage - A pilot project for regenerative & community living in Sweden',
                width: 1600,
                height: 1200,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/gallery/g17.jpg',
                alt: 'EARTHBOUND ecovillage - A pilot project for regenerative & community living in Sweden',
                width: 1600,
                height: 1067,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/gallery/g18.jpg',
                alt: 'EARTHBOUND ecovillage - A pilot project for regenerative & community living in Sweden',
                width: 1600,
                height: 1067,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/gallery/g19.jpg',
                alt: 'EARTHBOUND ecovillage - A pilot project for regenerative & community living in Sweden',
                width: 1600,
                height: 1170,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/gallery/g20.jpg',
                alt: 'EARTHBOUND ecovillage - A pilot project for regenerative & community living in Sweden',
                width: 1600,
                height: 1200,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/gallery/g21.jpg',
                alt: 'EARTHBOUND ecovillage - A pilot project for regenerative & community living in Sweden',
                width: 1600,
                height: 2133,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/gallery/g22.jpg',
                alt: 'EARTHBOUND ecovillage - A pilot project for regenerative & community living in Sweden',
                width: 1600,
                height: 2133,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/gallery/g23.jpg',
                alt: 'EARTHBOUND ecovillage - A pilot project for regenerative & community living in Sweden',
                width: 1600,
                height: 2133,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/gallery/g24.jpg',
                alt: 'EARTHBOUND ecovillage - A pilot project for regenerative & community living in Sweden',
                width: 1600,
                height: 1200,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/gallery/g25.jpg',
                alt: 'EARTHBOUND ecovillage - A pilot project for regenerative & community living in Sweden',
                width: 1600,
                height: 2133,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/gallery/g26.jpg',
                alt: 'EARTHBOUND ecovillage - A pilot project for regenerative & community living in Sweden',
                width: 1600,
                height: 1200,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/gallery/g27.jpg',
                alt: 'EARTHBOUND ecovillage - A pilot project for regenerative & community living in Sweden',
                width: 1600,
                height: 1200,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/gallery/g28.jpg',
                alt: 'EARTHBOUND ecovillage - A pilot project for regenerative & community living in Sweden',
                width: 1600,
                height: 2133,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/gallery/g29.jpg',
                alt: 'EARTHBOUND ecovillage - A pilot project for regenerative & community living in Sweden',
                width: 1600,
                height: 1200,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/gallery/g30.jpg',
                alt: 'EARTHBOUND ecovillage - A pilot project for regenerative & community living in Sweden',
                width: 1600,
                height: 2105,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/gallery/g31.jpg',
                alt: 'EARTHBOUND ecovillage - A pilot project for regenerative & community living in Sweden',
                width: 1600,
                height: 1083,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/gallery/g32.jpg',
                alt: 'EARTHBOUND ecovillage - A pilot project for regenerative & community living in Sweden',
                width: 1600,
                height: 2133,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/gallery/g33.jpg',
                alt: 'EARTHBOUND ecovillage - A pilot project for regenerative & community living in Sweden',
                width: 1600,
                height: 1117,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/gallery/g34.jpg',
                alt: 'EARTHBOUND ecovillage - A pilot project for regenerative & community living in Sweden',
                width: 1600,
                height: 2133,
              },
            ],
          },
        },
      },
    ],
  };
  return localPage;
};

interface Props {
  generalConfig: GeneralConfig | null;
  listings: Listing[] | null;
  hosts: User[] | null;
}

const HomePage = ({ generalConfig, listings, hosts }: Props) => {
  const page = getPage({
    listings,
    hosts,
    generalConfig,
  });

  const { platform }: any = usePlatform();
  const { user } = useAuth();
  const isTeamMember = user?.roles.some((roles) =>
    ['space-host', 'steward', 'land-manager', 'team'].includes(roles),
  );
  const listingFilter = {
    where: {
      availableFor: {
        $in: ['guests', isTeamMember ? 'team' : null].filter((e) => e),
      },
    },
  };
  const hostsFilter = {
    where: {
      roles: { $in: ['space-host', 'steward', 'team'].filter((e) => e) },
    },
  };

  const loadData = async () => {
    await Promise.all([
      platform.listing.get(listingFilter),
      platform.user.get(hostsFilter),
    ]);
  };

  useEffect(() => {
    loadData();
  }, [isTeamMember]);

  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;

  return (
    <div>
      <Head>
        <title>{`Welcome to ${PLATFORM_NAME}!`}</title>
        <meta name="description" content="School of Ecological Imagination" />
      </Head>

      <CustomSections page={page} />
    </div>
  );
};

HomePage.getInitialProps = async (context: NextPageContext) => {
  try {
    const messages = await loadLocaleData(
      context?.locale,
      process.env.NEXT_PUBLIC_APP_NAME,
    );
    const [generalRes, listingsRes, hostsRes] = await Promise.all([
      api.get('/config/general').catch(() => {
        return null;
      }),
      api
        .get('/listing', {
          params: {
            limit: 30,
          },
        })
        .catch(() => {
          return null;
        }),
      api
        .get('/user', {
          params: {
            where: {
              roles: {
                $in: ['space-host', 'steward', 'team'].filter((e) => e),
              },
            },
          },
        })
        .catch(() => {
          return null;
        }),
    ]);

    const generalConfig = generalRes?.data?.results?.value;

    const listings = listingsRes?.data?.results;
    const hosts = hostsRes?.data?.results;
    return {
      generalConfig,

      messages,
      listings,
      hosts,
    };
  } catch (err: unknown) {
    return {
      generalConfig: null,

      error: parseMessageFromError(err),
      messages: null,
      listings: null,
      hosts: null,
    };
  }
};

export default HomePage;
