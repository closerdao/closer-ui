import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';

import {
  BookingConfig,
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
import { useFaqs } from 'closer/hooks/useFaqs';
import { Page } from 'closer/types/customPages';
import { parseMessageFromError } from 'closer/utils/common';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

const getPage = ({
  listings,
  hosts,
}: {
  listings: Listing[] | null;
  hosts: User[] | null;
}) => {
  const localPage: Page = {
    isHomePage: true,
    sections: [
      {
        type: 'hero',
        data: {
          settings: {
            alignText: 'top-left',
          },
          content: {
            title: 'House of Auset / Isis, Aswan | Egypt',
            body: 'A land regeneration and temple community NGO reviving local and ancient heritage.',
            imageUrl:
              'https://cdn.oasa.co/custom-pages/per-auset/per-auset-hero.png',
            cta: {
              text: 'VIEW OUR PROPOSAL',
              url: '/',
            },
          },
        },
      },
      {
        type: 'promoCard',
        data: {
          settings: {
            alignImage: 'left',
          },
          content: {
            title: 'Welcome to Per Auset',
            body: `<p>Per Auset, translated from the ancient Egyptian language, means “House of Isis.” It is a land regeneration and temple community project reviving local and ancient heritage. This sacred land is being transformed into a temple village devoted to healing, creativity, and land regeneration. Our mission is to anchor the vibration of heaven on earth, creating a space where every soul feels welcomed, nourished, and aligned with their highest values.</p>
          <p>Per Auset is a micro-civilization on a land of ancient spiritual history, where we intend to anchor an emerging new culture in the spirit of sacred remembrance.</p>
          <p>Every being who visits the space will have the opportunity to immerse themselves in study groups, art, daily meditation, and eco-conscious activities.</p>
          <p><strong>Location:</strong> In Nubia, southern Egypt. An island in the Nile right next to the ancient temple of Auset/Isis.</p>`,
            imageUrl:
              'https://cdn.oasa.co/custom-pages/per-auset/Webversion-Per-Ausset-Jaqueline_Louan-36.png',
          },
        },
      },
      {
        type: 'listing',
        data: {
          settings: {
            numColumns: 3,
          },
          content: {
            title: 'Stay With Us',
            description: 'Here are a few ways to get involved',
            items: [
              {
                title: 'Guest',
                text: '<p>We offer our guests an opportunity to relax and get creative. With nourishing meals in our restaurant as well as healthy snacks and drinks in our cafe. You are welcome to help us water the garden or plant a tree, perhaps take some time to go for a silent walk or mediation in the rocks. Swimming in the Nile is always an option, or simply taking a moment to read or co-work. For a fixed rate per day per room and meals, you can come for as many days as you wish and visit the local temples and sites with our on ground support.</p>',
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/per-auset/stay-1.png',
                cta: {
                  text: 'BOOK A STAY',
                  url: '/stay',
                },
              },
              {
                title: 'Event Attendee',
                text: '<p>We offer events throughout the year which are a wonderful way to deeply immerse yourself in our culture and everyday temple life. From silent retreats, to dance, pottery or study groups.</p><p>To see our list of events please click below.</p>',
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/per-auset/stay-2.png',
                cta: {
                  text: 'SEE EVENTS LIST',
                  url: '/events',
                },
              },
              {
                title: 'Volunteer',
                text: '<p>We offer limited volunteer spaces which are so important to our eco system. For an exchange of food and accommodation volunteers can help us cook, garden, take care of the animals, construct, paint and design etc. We welcome your skills so please do get in touch. We offer different tiers of volunteering.</p><p>Some full exchange volunteer positions or some partial.<br>2 hours a day - €35.00 per night<br>4 hours - €20.00 per night<br>6 hours a day - free<br>(Prices for shared room)</p><p>Please do get in touch!</p>',
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/per-auset/stay-3.png',
                cta: {
                  text: 'APPLY AS A VOLUNTEER',
                  url: '/volunteer',
                },
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
          },
          content: {
            title: 'Be a Part of Per Auset',
            description: 'A few ways you can support our project',
            items: [
              {
                title: 'Sponsor',
                text: 'As a sponsor, you have the opportunity to make an upfront payment in exchange for credits toward future stays or events at Beija Island. We also offer a limited number of timeshare spaces within our homes, with a dedicated onboarding process that ensures a deep and meaningful connection to the land. Sponsors play an integral role in shaping the future of our regenerative village, enjoying exclusive access to our temple, healing spaces, and community.',
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/per-auset/Heru%20%202.png',
                cta: {
                  text: 'Contact us',
                  url: '/',
                },
              },
              {
                title: 'Member',
                text: 'As a member, you’ll gain access to our inner circle with three tiered membership options, each offering special discounts, unique gifts, and exclusive content. By paying a monthly fee, members remain connected to the village’s ongoing projects and spiritual practices, receiving ongoing updates and invitations to special events. Your membership ensures you stay plugged into the heart of Beija Island and its transformative journey.',
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/per-auset/Heru%20%202.png',
                cta: {
                  text: 'BECOME A MEMBER',
                  url: '/',
                },
              },
              {
                title: 'Donor',
                text: 'Donors provide essential gifts that help fund a variety of projects within our village. This might include the women’s shelter, emerging temple clinic, and school. Your contribution is an investment in the future of Beija Island, enabling us to create safe spaces for healing and empowerment, while honoring ancient Egyptian traditions. Every donation, no matter the size, helps bring us closer to realizing our shared vision.',
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/per-auset/Heru%20%202.png',
                cta: {
                  text: 'Contact us',
                  url: '/',
                },
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
            isAccommodations: true,
          },
          content: {
            title: 'Stay With Us',
            description: 'Here are a few ways to get involved',
            items: listings?.map((listing) => ({
              title: listing.name,
              text: listing.description,
              imageUrl: listing?.photos?.map((id) => {
                return `${cdn}${id}-post-md.jpg`;
              })[0],
              cta: {
                text: 'Book now',
                url: `/stay/${listing.slug}`,
              },
            })),
          },
        },
      },
      {
        type: 'listing',
        data: {
          settings: {
            numColumns: 3,
            isHosts: true,
          },
          content: {
            title: 'Stewards Of The Land',
            description:
              'We are the first temple land stewards living here full time and in service to the land and all that is emerging here…',
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
        type: 'gallery',
        data: {
          settings: {
            type: 'masonry'
          },
          content: {
            title: 'Some images of our current state of development. Of course the photos will keep changing every few months as the plants grow and buildings evolve. To stay up to date please feel free to join our <a href="https://t.me/perauset" target="_blank">telegram group</a>',
        
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
    ],
  };
  return localPage;
};

interface Props {
  generalConfig: GeneralConfig | null;
  bookingSettings: BookingConfig | null;
  listings: Listing[] | null;
  hosts: User[] | null;
}

const HomePage = ({
  generalConfig,
  bookingSettings,
  listings,
  hosts,
}: Props) => {
  const t = useTranslations();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const page = getPage({
    listings,
    hosts,
  });

  const { APP_NAME, FAQS_GOOGLE_SHEET_ID } = useConfig() || {};

  const { faqs, error } = useFaqs(FAQS_GOOGLE_SHEET_ID);
  const appName = APP_NAME && APP_NAME.toLowerCase();

  const config = useConfig();
  const discounts = {
    daily: bookingSettings?.discountsDaily,
    weekly: bookingSettings?.discountsWeekly,
    monthly: bookingSettings?.discountsMonthly,
  };

  const { TEAM_EMAIL } = config || {};
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
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isAutoplaying, setIsAutoplaying] = useState(false);

  const loadData = async () => {
    await Promise.all([
      platform.listing.get(listingFilter),
      platform.user.get(hostsFilter),
    ]);
  };

  useEffect(() => {
    loadData();
  }, [isTeamMember]);

  useEffect(() => {
    setIsSmallScreen(isMobile);

    if (videoRef.current) {
      videoRef.current
        .play()
        .then(() => {
          console.log('can autoplay');
          setIsAutoplaying(true);
        })
        .catch(() => {
          console.log('cant autoplay');
          setIsAutoplaying(false);
        });
    }
  }, [videoRef.current]);

  // const listings = platform.listing.find(listingFilter);

  // const hosts = platform.user.find(hostsFilter);

  const CTA = (
    <Link
      href="/learn/category/all"
      type="submit"
      className=" font-accent  lowercase bg-accent text-white rounded-full py-2.5 px-8 text-xl"
    >
      {t('navigation_see_courses')}
    </Link>
  );

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

      {/* <div className="relative top-[440px] md:top-[calc(100vh-60px)] ">
      <section className="mb-[120vh]"></section>
      </div> */}
    </div>
  );
};

HomePage.getInitialProps = async (context: NextPageContext) => {
  try {
    const messages = await loadLocaleData(
      context?.locale,
      process.env.NEXT_PUBLIC_APP_NAME,
    );
    const [bookingResponse, generalRes, listingsRes, hostsRes] =
      await Promise.all([
        api.get('/config/booking').catch((err) => {
          console.error('Error fetching booking config:', err);
          return null;
        }),
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

    const bookingSettings = bookingResponse?.data?.results?.value;
    const generalConfig = generalRes?.data?.results?.value;

    const listings = listingsRes?.data?.results;
    const hosts = hostsRes?.data?.results;
    return {
      generalConfig,
      bookingSettings,
      messages,
      listings,
      hosts,
    };
  } catch (err: unknown) {
    return {
      generalConfig: null,
      bookingSettings: null,
      error: parseMessageFromError(err),
      messages: null,
      listings: null,
      hosts: null,
    };
  }
};

export default HomePage;
