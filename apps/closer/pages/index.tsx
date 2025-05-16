import Head from 'next/head';

import { useEffect } from 'react';

import Tag from 'closer/components/Tag';
import { Button } from 'closer/components/ui';
import Card from 'closer/components/ui/Card';
import Heading from 'closer/components/ui/Heading';
import Image from 'next/image';

import {
  GeneralConfig,
  Listing,
  Navigation,
  api,
  useAuth,
  useConfig,
  usePlatform,
} from 'closer';
import { User } from 'closer/contexts/auth/types';
import { parseMessageFromError } from 'closer/utils/common';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import {
  BookOpenText,
  Calendar,
  Globe,
  TicketCheck,
  Users,
  Wrench,
} from 'lucide-react';
import { NextPageContext } from 'next';

// const getPage = ({
//   listings,
//   hosts,
//   generalConfig,
// }: {
//   listings: Listing[] | null;
//   hosts: User[] | null;
//   generalConfig: GeneralConfig | null;
// }) => {
//   const localPage: Page = {
//     isHomePage: true,
//     sections: [
//       {
//         type: 'hero',
//         data: {
//           settings: {
//             alignText: 'bottom-left',
//             isInverted: true,
//           },
//           content: {
//             title: 'EARTHBOUND ECOVILLAGE',
//             body: 'A pilot project for regenerative & community living in Sweden',
//             imageUrl:
//               'https://cdn.oasa.co/custom-pages/earthbound/earthbound-hero.png',
//             cta: {
//               text: 'Join us',
//               url: '/',
//             },
//           },
//         },
//       },
//       {
//         type: 'promoCard',
//         data: {
//           settings: {
//             alignImage: 'left',
//             isColorful: true,
//             imageSize: 'large',
//           },
//           content: {
//             title: 'WHAT IS EARTHBOUND',
//             body: `<p>Earthbound is an upcoming eco-village and think tank for rural community - and regenerative living in Southern Sweden. We are creating a community of 30 people stewarding 73 ha of land with a lake, ancient forest and 9 buildings.
//             </p><p>We are hosting a Bed & Breakfast and a cultural center for a regenerative transformation. We play a key part in the transition to a future that is sustainable, local and holistic.</p>`,
//             imageUrl:
//               'https://cdn.oasa.co/custom-pages/earthbound/Mask%20group.png',
//           },
//         },
//       },

//       {
//         type: 'listing',
//         data: {
//           settings: {
//             numColumns: 3,
//             isSmallImage: true,
//             isColorful: true,
//           },
//           content: {
//             title: 'OUR CORE VALUES',
//             items: [
//               {
//                 title: 'Conscious Relationships',
//                 text: 'A socially well-functioning community with common ownership, common decision making methods and community processes.',
//                 imageUrl:
//                   'https://cdn.oasa.co/custom-pages/earthbound/conscious-relationships.png',
//               },
//               {
//                 title: 'Regenerative Living',
//                 text: 'We embody a lifestyle that regenerates the land through traditional and novel land practices, building techniques, infrastructures and community-driven behavioural change. ',
//                 imageUrl:
//                   'https://cdn.oasa.co/custom-pages/earthbound/regenerative-living.png',
//               },
//               {
//                 title: 'Earth-Centered Awareness',
//                 text: 'We base our daily rhythms, traditions and decisions on the land and a kincentric awareness, where humans and all other lifeforms are deeply interconnected.',
//                 imageUrl:
//                   'https://cdn.oasa.co/custom-pages/earthbound/earth-centered-awareness.png',
//               },
//             ],
//           },
//         },
//       },

//       {
//         type: 'promoCard',
//         data: {
//           settings: {
//             alignImage: 'right',
//             isColorful: true,
//             imageSize: 'large',
//           },
//           content: {
//             title: 'THE PLACE',
//             body: `<ul><li>The historical 300-year old estate of 'Grimsnäs Herrgard' is the home of Earthbound Ecovillage. It is located in the creative rural area of 'Glasriket' in Southern Småland.</li>
//             <li>We are both continuing the heritage of Grimsnäs and giving it new life and purpose.</li>
//             </ul>`,

//             imageUrl: 'https://cdn.oasa.co/custom-pages/earthbound/11.png',
//           },
//         },
//       },
//       {
//         type: 'promoCard',
//         data: {
//           settings: {
//             alignImage: 'left',
//             isColorful: true,
//             imageSize: 'large',
//           },
//           content: {
//             title: 'LAND',
//             body: `<ul>
//               <li>73 ha (~100 football fields) of diverse landscape including ancient forests, grazing lands, fields, a lake, and wetland</li>
//               <li>Swimming lake with an island</li>
//               <li>Own water source with high-quality purification system</li>
//               <li>Biodiverse forest with ancient oak and hazel trees</li>
//               <li>Part of the forest is under nature protection laws</li>
//               <li>Direct trains to:
//                 <ul>
//                   <li>Copenhagen (3h)</li>
//                   <li>Malmö (2.5h)</li>
//                   <li>Gothenburg (3h)</li>
//                   <li>Stockholm (4h, 1 stop)</li>
//                 </ul>
//               </li>
//             </ul>
//             `,

//             imageUrl: 'https://cdn.oasa.co/custom-pages/earthbound/22.png',
//           },
//         },
//       },
//       {
//         type: 'promoCard',
//         data: {
//           settings: {
//             alignImage: 'right',
//             isColorful: true,
//             imageSize: 'large',
//           },
//           content: {
//             title: 'BUILDINGS',
//             body: `<ul>
//               <li>7 well-maintained, solid wood (log) buildings and a large barn (45x10 m)</li>
//               <li>3 buildings are renovated & ready-to-move-in houses with:
//                 <ul style="margin-bottom: 0">
//                   <li>18 furnished bedrooms</li>
//                   <li>25 - 30 beds</li>
//                   <li>750 m² total area</li>
//                 </ul>
//               </li>
//               <li>Buildings are as old as 270 years and mostly wood-heated</li>
//               <li>We will take over the already established award-winning Bed & Breakfast business 'Grimsnäs Herrgaard'</li>
//             </ul>
//             `,

//             imageUrl: 'https://cdn.oasa.co/custom-pages/earthbound/33.png',
//           },
//         },
//       },
//       {
//         type: 'listing',
//         data: {
//           settings: {
//             numColumns: 3,
//             isSmallImage: true,
//             isColorful: true,
//           },
//           content: {
//             title: 'OUR IMPACT',
//             items: [
//               {
//                 title: 'Low-impact, Affordable and Non-speculative Housing',
//                 imageUrl:
//                   'https://cdn.oasa.co/custom-pages/earthbound/_0004_low-impact.png',
//               },
//               {
//                 title: 'Local and Bioregional Changemakers',
//                 imageUrl:
//                   'https://cdn.oasa.co/custom-pages/earthbound/_0003_Local-and-Bioregional-Changemakers.png',
//               },
//               {
//                 title: 'Community Research',
//                 imageUrl:
//                   'https://cdn.oasa.co/custom-pages/earthbound/_0000_Community-Research.png',
//               },

//               {
//                 title: 'Permaculture and Regenerative Agriculture',

//                 imageUrl:
//                   'https://cdn.oasa.co/custom-pages/earthbound/_0002_Permaculture-and-Regenerative-Agriculture.png',
//               },
//               {
//                 title: 'Sustainable Micro-Business Hub',

//                 imageUrl:
//                   'https://cdn.oasa.co/custom-pages/earthbound/sustainable.png',
//               },
//               {
//                 title: 'Land Stewardship',
//                 imageUrl:
//                   'https://cdn.oasa.co/custom-pages/earthbound/_0001_Land-Stewardship.png',
//               },
//               {
//                 title: 'Think Tank & Pilot Project',
//                 imageUrl:
//                   'https://cdn.oasa.co/custom-pages/earthbound/Think%20Thank%20&%20Pilot.png',
//               },
//             ],
//           },
//         },
//       },

//       {
//         type: 'listing',
//         data: {
//           settings: {
//             numColumns: 3,
//             isSmallImage: true,
//             isColorful: true,
//           },
//           content: {
//             title: 'THE PEOPLE',
//             description:
//               'In due time, Earthbound Ecovillage will be the home of 30 adults. We are currently 6 founders - all deeply inspired by communities and regenerative initiatives around the world. Meet the founding group here.',
//             items: hosts?.map((host) => ({
//               title: host.screenname,
//               text: host?.about || '',
//               imageUrl: host?.photo
//                 ? `${cdn}${host.photo}-profile-lg.jpg`
//                 : null,
//             })),
//           },
//         },
//       },

//       {
//         type: 'listing',
//         data: {
//           settings: {
//             numColumns: 3,
//             isSmallImage: true,
//             isColorful: true,
//           },
//           content: {
//             title: 'OUR MODEL ',
//             description:
//               'We\'re introducing a new model for communities in Scandinavia to own and govern together. Our format shapes a strong, ethical financial and legal structure based on "community logic". Designed to be easy to replicate, it paves the way for future community-led initiatives. You can read about the key aspects of our model below.',
//             items: [
//               {
//                 title: 'NON PROFIT, NON SPECULATIVE',
//                 imageUrl:
//                   'https://cdn.oasa.co/custom-pages/earthbound/_0002_non-profit.png',
//               },
//               {
//                 title: 'SAFE, ETHICAL AND IMPACTFUL INVESTMENTS',

//                 imageUrl:
//                   'https://cdn.oasa.co/custom-pages/earthbound/_0000_safe.png',
//               },
//               {
//                 title: 'SOCIOCRACY+',

//                 imageUrl:
//                   'https://cdn.oasa.co/custom-pages/earthbound/_0001_socio.png',
//               },
//             ],
//           },
//         },
//       },

//       {
//         type: 'listing',
//         data: {
//           settings: {
//             numColumns: 4,
//             isColorful: true,
//             id: 'how-to-join',
//           },
//           content: {
//             title: 'HOW TO JOIN',
//             description:
//               'We are still growing and invite you to be a part of this exciting phase and the movement!',
//             items: [
//               {
//                 title: 'IMPACT INVESTOR',
//                 text: 'Invest in a truly human-scale regenerative project. As an impact investor you are part of making Earthbound a reality and of steering the greater vision and direction.',
//                 imageUrl:
//                   'https://cdn.oasa.co/custom-pages/earthbound/impact-investor.png',
//                 cta: {
//                   text: 'More info',
//                   url: '/',
//                 },
//               },
//               {
//                 title: 'COMMUNITY MEMBER',
//                 text: 'Do you want to live in a deep and intergenerational community and steward the land and vision of Earthbound?',
//                 imageUrl:
//                   'https://cdn.oasa.co/custom-pages/earthbound/comm-member.png',
//                 cta: {
//                   text: 'More info',
//                   url: '/',
//                 },
//               },
//               {
//                 title: 'VISITOR',
//                 text: 'Do you want to experience the magic of Earthbound? Visit us, enjoy our B&B offers, slow down and get a taste of community life deep in the Swedish forest.',
//                 imageUrl:
//                   'https://cdn.oasa.co/custom-pages/earthbound/visitor.png',
//                 cta: {
//                   text: 'Book a stay',
//                   url: '/',
//                 },
//               },
//               {
//                 title: 'VOLUNTEER',
//                 text: 'We are planning to open up for volunteers in the future. Stay connected with us on our newsletter or telegram channel to be the first to hear about volunteering options.',
//                 imageUrl:
//                   'https://cdn.oasa.co/custom-pages/earthbound/volunteer.png',
//               },
//             ],
//           },
//         },
//       },
//       {
//         type: 'gallery',
//         data: {
//           settings: {
//             type: 'masonry',
//           },
//           content: {
//             items: [
//               {
//                 imageUrl:
//                   'https://cdn.oasa.co/custom-pages/earthbound/gallery/0.png',
//                 alt: 'EARTHBOUND ECOVILLAGE - A pilot project for regenerative & community living in Sweden',
//                 width: 1573,
//                 height: 1178,
//               },
//               {
//                 imageUrl:
//                   'https://cdn.oasa.co/custom-pages/earthbound/gallery/1.png',
//                 alt: 'EARTHBOUND ECOVILLAGE - A pilot project for regenerative & community living in Sweden',
//                 width: 885,
//                 height: 1180,
//               },
//               {
//                 imageUrl:
//                   'https://cdn.oasa.co/custom-pages/earthbound/gallery/2.png',
//                 alt: 'EARTHBOUND ECOVILLAGE - A pilot project for regenerative & community living in Sweden',
//                 width: 885,
//                 height: 1178,
//               },
//               {
//                 imageUrl:
//                   'https://cdn.oasa.co/custom-pages/earthbound/gallery/3.png',
//                 alt: 'EARTHBOUND ECOVILLAGE - A pilot project for regenerative & community living in Sweden',
//                 width: 2038,
//                 height: 1360,
//               },
//               {
//                 imageUrl:
//                   'https://cdn.oasa.co/custom-pages/earthbound/gallery/4.png',
//                 alt: 'EARTHBOUND ECOVILLAGE - A pilot project for regenerative & community living in Sweden',
//                 width: 1767,
//                 height: 1180,
//               },
//               {
//                 imageUrl:
//                   'https://cdn.oasa.co/custom-pages/earthbound/gallery/5.png',
//                 alt: 'EARTHBOUND ECOVILLAGE - A pilot project for regenerative & community living in Sweden',
//                 width: 787,
//                 height: 1180,
//               },
//               {
//                 imageUrl:
//                   'https://cdn.oasa.co/custom-pages/earthbound/gallery/6.png',
//                 alt: 'EARTHBOUND ECOVILLAGE - A pilot project for regenerative & community living in Sweden',
//                 width: 787,
//                 height: 1176,
//               },
//               {
//                 imageUrl:
//                   'https://cdn.oasa.co/custom-pages/earthbound/gallery/7.png',
//                 alt: 'EARTHBOUND ECOVILLAGE - A pilot project for regenerative & community living in Sweden',
//                 width: 1771,
//                 height: 1178,
//               },
//               {
//                 imageUrl:
//                   'https://cdn.oasa.co/custom-pages/earthbound/gallery/8.png',
//                 alt: 'EARTHBOUND ECOVILLAGE - A pilot project for regenerative & community living in Sweden',
//                 width: 1765,
//                 height: 1178,
//               },
//             ],
//           },
//         },
//       },
//     ],
//   };
//   return localPage;
// };

interface Props {
  generalConfig: GeneralConfig | null;
  listings: Listing[] | null;
  hosts: User[] | null;
}

const HomePage = ({ generalConfig, listings, hosts }: Props) => {
  // const page = getPage({
  //   listings,
  //   hosts,
  //   generalConfig,
  // });

  const { platform }: any = usePlatform();
  const { user } = useAuth();
  console.log('user=', user);
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

      {/* <CustomSections page={page} /> */}

      {/* Navigation bar */}
      <Navigation />

      {/* Hero Section */}
      <section className=" text-center py-[120px] ">
        <Heading
          level={1}
          className="mb-4 text-4xl sm:text-7xl font-bold bg-gradient-to-r from-[#5290DB] to-[#79FAC1] bg-clip-text text-transparent"
        >
          Build Communities That Thrive
        </Heading>
        <p className="text-lg font-bold mb-4">
          Closer is the operating system for regenerative communities
        </p>
        <p className="text-lg max-w-3xl mx-auto mb-8">
          Manage guests, spaces, events and resources through one intuitive
          platform designed specifically for land-based projects
        </p>
      </section>

      {/* Video Section */}
      <div className="video-section flex justify-center py-8 max-w-6xl mx-auto">
        <div className="relative video-thumbnail w-full h-[640px] bg-gray-200 rounded-xl flex items-center justify-center shadow-lg">
          <button className="play-button absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-4 shadow-md hover:scale-105 transition">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              width={40}
              height={40}
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M5 3L19 12L5 21V3Z" fill="#333" />
            </svg>
          </button>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="features py-16 bg-white">
        <div className="features-container max-w-6xl mx-auto">
          <Heading
            level={2}
            className="features-title mb-8 text-3xl font-bold text-center"
          >
            Community Building Tools
          </Heading>
          <div className="feature-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            <Card className="">
              <div className=" mb-4 bg-neutral-light w-fit rounded-md p-4">
                {/* Booking Icon */}

                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
              <Heading level={3} className=" mb-2 text-xl font-semibold">
                Booking & Stay Management
              </Heading>
              <p className="feature-desc">
                Streamline guest bookings, volunteer stays, and resident
                accommodations all in one system. Process payments, manage
                check-ins, and eliminate spreadsheet chaos with intuitive
                calendar views and automated notifications.
              </p>
            </Card>
            <Card className="">
              <div className=" mb-4 bg-neutral-light w-fit rounded-md p-4">
                {/* Event Icon */}

                <TicketCheck className="w-8 h-8 text-green-500" />
              </div>
              <Heading
                level={3}
                className="feature-title mb-2 text-xl font-semibold"
              >
                Event Coordination & Ticketing
              </Heading>
              <p className="feature-desc">
                Create and manage workshops, gatherings, and educational events
                with ease. Our integrated ticketing system handles registration,
                payments, and attendee communication with a unified calendar
                view for your community&apos;s activities.
              </p>
            </Card>
            <Card className="">
              <div className=" mb-4 bg-neutral-light w-fit rounded-md p-4">
                {/* Resource Icon */}
                <Wrench className="w-8 h-8 text-yellow-500" />
              </div>
              <Heading
                level={3}
                className="feature-title mb-2 text-xl font-semibold"
              >
                Resource & Space Sharing
              </Heading>
              <p className="feature-desc">
                Manage your community&apos;s shared spaces, tools, and equipment
                through a flexible inventory system. Set availability, track
                usage, and organize resources with different access settings
                based on membership levels and pricing options.
              </p>
            </Card>
            <Card className="">
              <div className=" mb-4 bg-neutral-light w-fit rounded-md p-4">
                {/* Membership Icon */}
                <Users className="w-8 h-8 text-red-500" />
              </div>
              <Heading
                level={3}
                className="feature-title mb-2 text-xl font-semibold"
              >
                Membership & Community Engagement
              </Heading>
              <p className="feature-desc">
                Create meaningful connections with member profiles, role
                management, and automated notifications. Manage subscriptions
                for recurring support and enable the community vouching system
                to build trust and belonging among members.
              </p>
            </Card>
            <Card className="">
              <div className=" mb-4 bg-neutral-light w-fit rounded-md p-4">
                {/* Learning Icon */}
                <BookOpenText className="w-8 h-8 text-violet-500" />
              </div>
              <Heading
                level={3}
                className="feature-title mb-2 text-xl font-semibold"
              >
                Learning Hub & Knowledge Sharing
              </Heading>
              <p className="feature-desc">
                Preserve and share community wisdom through collaborative
                documentation, course creation, and skill-sharing initiatives.
                Create a living repository of your community&apos;s practices
                that can be shared, taught, and even monetized through
                subscription access.
              </p>
            </Card>
            <Card className="">
              <div className=" mb-4 bg-neutral-light w-fit rounded-md p-4">
                {/* Governance Icon */}
                <Globe className="w-8 h-8 text-teal-500" />
              </div>
              <Heading
                level={3}
                className="feature-title mb-2 text-xl font-semibold"
              >
                Governance & Token System
              </Heading>
              <p className="feature-desc">
                Build toward community ownership with innovative features like
                Native Tokens, Proof of Presence, and Proof of Sweat. Start with
                basic tools and gradually transition to transparent governance
                and decentralized decision-making when your community is ready.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Projects/Communities Section */}
      <section id="communities" className="projects py-16 bg-[#f8f9fa]">
        <div className="projects-container max-w-6xl mx-auto">
          <Heading
            level={2}
            className="section-title mb-4 text-3xl font-bold text-center"
          >
            Thriving Communities
          </Heading>
          <p className="section-subtitle text-center mb-8">
            Explore how diverse communities are using Closer to create
            meaningful connection and impact
          </p>
          <div className="projects-grid grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Project Cards - static for now, can be mapped from data */}
            <Card className="project-card flex flex-col md:flex-row">
              <div className="project-image w-full md:w-1/2 h-48 md:h-auto relative">
                <Image
                  src="/api/placeholder/600/400"
                  alt="Harmony Ecovillage"
                  className="object-cover w-full h-full rounded-t-md md:rounded-l-md md:rounded-t-none"
                />
              </div>
              <div className="project-content p-6 flex flex-col justify-between w-full md:w-1/2">
                <Heading
                  level={3}
                  className="project-title mb-2 text-xl font-semibold"
                >
                  Traditional Dream Factory
                </Heading>
                <p className="project-description mb-4">
                  A regenerative community in Portugal pioneering innovations in
                  governance and community living. Closer helps them manage
                  guest stays, volunteer programs, and their vibrant events
                  calendar.
                </p>
                <div className="project-tags flex flex-wrap gap-2 mb-4">
                  <Tag color="primary">Regenerative Living</Tag>
                  <Tag color="primary">Token Governance</Tag>
                  <Tag color="primary">Land Stewardship</Tag>
                </div>
                <Button
                  variant="secondary"
                  size="small"
                  className="project-link w-fit"
                >
                  Explore Community
                </Button>
              </div>
            </Card>
            <Card className="project-card flex flex-col md:flex-row">
              <div className="project-image w-full md:w-1/2 h-48 md:h-auto relative">
                <img
                  src="/api/placeholder/600/400"
                  alt="Urban Oasis Collective"
                  className="object-cover w-full h-full rounded-t-md md:rounded-l-md md:rounded-t-none"
                />
              </div>
              <div className="project-content p-6 flex flex-col justify-between w-full md:w-1/2">
                <Heading
                  level={3}
                  className="project-title mb-2 text-xl font-semibold"
                >
                  Foz Da Cova
                </Heading>
                <p className="project-description mb-4">
                  A community in Portugal focused on sustainable agriculture and
                  education. Closer&apos;s platform streamlines their booking
                  system for workshops and provides tools for managing their
                  growing volunteer program.
                </p>
                <div className="project-tags flex flex-wrap gap-2 mb-4">
                  <Tag color="primary">Education</Tag>
                  <Tag color="primary">Agriculture</Tag>
                  <Tag color="primary">Volunteer Program</Tag>
                </div>
                <Button
                  variant="secondary"
                  size="small"
                  className="project-link w-fit"
                >
                  Explore Community
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Growth Path Section */}
      <section id="journey" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <Heading
            level={2}
            className="section-title mb-4 text-3xl font-bold text-center"
          >
            Your Community&apos;s Growth Journey
          </Heading>
          <p className="section-subtitle text-center mb-8">
            Closer grows with you, from solving day-to-day operations to
            building regenerative governance systems
          </p>
          <div className="flex flex-col gap-12 mt-12">
            {/* Step 1 */}
            <div className="flex flex-col md:flex-row items-start relative">
              <div className="bg-[#67F8C0] rounded-full w-16 h-16 flex items-center justify-center mr-6 mb-4 md:mb-0 z-10">
                <span className="text-2xl font-bold text-[#222]">1</span>
              </div>
              <div className="flex-1">
                <Heading level={3} className="mb-2 text-xl font-semibold">
                  Streamline Operations
                </Heading>
                <p className="text-gray-600 mb-2">
                  Begin with the essentials: booking management, space
                  coordination, and event planning. Eliminate spreadsheet chaos
                  and reduce administrative overhead so you can focus on your
                  community&apos;s core mission.
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Tag color="primary" size="small">
                    Booking System
                  </Tag>
                  <Tag color="primary" size="small">
                    Event Management
                  </Tag>
                  <Tag color="primary" size="small">
                    Resource Tracking
                  </Tag>
                </div>
              </div>
            </div>
            {/* Step 2 */}
            <div className="flex flex-col md:flex-row items-start relative">
              <div className="bg-[#5BC4DD] rounded-full w-16 h-16 flex items-center justify-center mr-6 mb-4 md:mb-0 z-10">
                <span className="text-2xl font-bold text-[#222]">2</span>
              </div>
              <div className="flex-1">
                <Heading level={3} className="mb-2 text-xl font-semibold">
                  Build Community Engagement
                </Heading>
                <p className="text-gray-600 mb-2">
                  As your community grows, leverage Closer&apos;s membership and
                  knowledge-sharing tools to deepen connections and preserve
                  collective wisdom. Create subscription tiers and learning
                  resources that reinforce your community&apos;s values.
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Tag color="primary" size="small">
                    Membership System
                  </Tag>
                  <Tag color="primary" size="small">
                    Learning Hub
                  </Tag>
                  <Tag color="primary" size="small">
                    Subscriptions
                  </Tag>
                </div>
              </div>
            </div>
            {/* Step 3 */}
            <div className="flex flex-col md:flex-row items-start relative">
              <div className="bg-[#3F91DD] rounded-full w-16 h-16 flex items-center justify-center mr-6 mb-4 md:mb-0 z-10">
                <span className="text-2xl font-bold text-[#222]">3</span>
              </div>
              <div className="flex-1">
                <Heading level={3} className="mb-2 text-xl font-semibold">
                  Evolve to Regenerative Governance
                </Heading>
                <p className="text-gray-600 mb-2">
                  When your community is ready, explore Closer&apos;s innovative
                  Web3 features—Native Tokens, Proof of Presence, and Proof of
                  Sweat—to create transparent governance systems that reward
                  active participation and care for your shared resources.
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Tag color="primary" size="small">
                    Community Tokens
                  </Tag>
                  <Tag color="primary" size="small">
                    Proof of Presence
                  </Tag>
                  <Tag color="primary" size="small">
                    Decentralized Governance
                  </Tag>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 bg-[#f8f9fa]">
        <div className="max-w-6xl mx-auto">
          <Heading
            level={2}
            className="section-title mb-4 text-3xl font-bold text-center"
          >
            Choose Your Scale
          </Heading>
          <p className="section-subtitle text-center mb-8">
            Select the plan that best fits your community&apos;s size and needs
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            {/* Seed Plan */}
            <Card className="bg-white border border-gray-100 p-8 flex flex-col items-center">
              <Heading level={3} className="mb-2 text-xl font-semibold">
                Seed
              </Heading>
              <p className="text-gray-600 mb-4">
                Perfect for small co-living spaces and communities
              </p>
              <div className="text-3xl font-bold mb-4">990 CHF</div>
              <div className="w-full h-px bg-gray-200 my-4"></div>
              <ul className="list-none p-0 mb-4 w-full">
                <li className="flex items-center mb-2">
                  <span className="mr-2">✔️</span>Booking system
                </li>
                <li className="flex items-center mb-2">
                  <span className="mr-2">✔️</span>User management
                </li>
                <li className="flex items-center mb-2">
                  <span className="mr-2">✔️</span>Payment integration
                </li>
                <li className="flex items-center mb-2">
                  <span className="mr-2">✔️</span>AI assistance
                </li>
                <li className="flex items-center mb-2">
                  <span className="mr-2">✔️</span>Basic landing page
                </li>
              </ul>
           
            </Card>
            {/* Plant Plan */}
            <Card className="bg-white border-2 border-[#67F8C0] p-8 flex flex-col items-center relative shadow-lg">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#67F8C0] to-[#3F91DD] text-white px-6 py-2 rounded-full font-semibold text-sm">
                Popular
              </div>
              <Heading level={3} className="mb-2 text-xl font-semibold">
                Plant
              </Heading>
              <p className="text-gray-600 mb-4">
                For established communities ready to scale
              </p>
              <div className="text-3xl font-bold mb-4">4,990 CHF</div>
              <div className="w-full h-px bg-gray-200 my-4"></div>
              <ul className="list-none p-0 mb-4 w-full">
                <li className="flex items-center mb-2">
                  <span className="mr-2">✔️</span>Token deployment
                </li>
                <li className="flex items-center mb-2">
                  <span className="mr-2">✔️</span>Advanced booking & events
                </li>
                <li className="flex items-center mb-2">
                  <span className="mr-2">✔️</span>Automated accounting
                </li>
                <li className="flex items-center mb-2">
                  <span className="mr-2">✔️</span>Marketing tools
                </li>
                <li className="flex items-center mb-2">
                  <span className="mr-2">✔️</span>Learning hub access
                </li>
                <li className="flex items-center mb-2">
                  <span className="mr-2">✔️</span>Custom landing page
                </li>
              </ul>
            
            </Card>
            {/* Forest Plan */}
            <Card className="bg-white border border-gray-100 p-8 flex flex-col items-center">
              <Heading level={3} className="mb-2 text-xl font-semibold">
                Forest
              </Heading>
              <p className="text-gray-600 mb-4">
                Full-scale regenerative development hub
              </p>
              <div className="text-3xl font-bold mb-4">39,990 CHF</div>
              <div className="w-full h-px bg-gray-200 my-4"></div>
              <ul className="list-none p-0 mb-4 w-full">
                <li className="flex items-center mb-2">
                  <span className="mr-2">✔️</span>Multiple entity support
                </li>
                <li className="flex items-center mb-2">
                  <span className="mr-2">✔️</span>Custom token economy
                </li>
                <li className="flex items-center mb-2">
                  <span className="mr-2">✔️</span>Advanced governance
                </li>
                <li className="flex items-center mb-2">
                  <span className="mr-2">✔️</span>White-label AI
                </li>
                <li className="flex items-center mb-2">
                  <span className="mr-2">✔️</span>Private API access
                </li>
                <li className="flex items-center mb-2">
                  <span className="mr-2">✔️</span>Premium support
                </li>
              </ul>
            
            </Card>
          </div>
        </div>
      </section>

      {/* Email Collector/CTA Section */}
      <section className="email-collector py-16 bg-white">
        <div className="email-container max-w-xl mx-auto text-center">
          <Heading level={2} className="email-title mb-4 text-3xl font-bold">
            Ready to Start Your Journey?
          </Heading>
          <p className="email-description mb-8">
            Join the growing network of regenerative communities powered by
            Closer.
          </p>
          <Button
            size="large"
            className="demo-button px-8 py-4 text-lg"
            variant="primary"
          >
            Get in touch
          </Button>
        </div>
      </section>
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
