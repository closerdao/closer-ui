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
            alignText: 'top-left',
          },
          content: {
            title: 'House of Auset / Isis, Aswan | Egypt',
            body: 'A land regeneration and temple community NGO reviving local and ancient heritage.',
            imageUrl:
              'https://cdn.oasa.co/custom-pages/per-auset/per-auset-hero-3.jpg',
            cta: {
              text: 'VIEW OUR PROPOSAL',
              url: 'https://www.canva.com/design/DAGJO90IHuU/dB1o257xAmKG6Ah74kOpTQ/view?utm_content=DAGJO90IHuU&utm_campaign=share_your_design&utm_medium=link&utm_source=shareyourdesignpanel#11',
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
            body: `<p>Per Auset, translated from the ancient Egyptian language, means "House of Isis." It is a land regeneration and temple community project reviving local and ancient heritage. This sacred land is being transformed into a temple village devoted to healing, creativity, and land regeneration. Our mission is to anchor the vibration of heaven on earth, creating a space where every soul feels welcomed, nourished, and aligned with their highest values.</p>
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
                text: 'As a member, you&apos;ll gain access to our inner circle with three tiered membership options, each offering special discounts, unique gifts, and exclusive content. By paying a monthly fee, members remain connected to the village&apos;s ongoing projects and spiritual practices, receiving ongoing updates and invitations to special events. Your membership ensures you stay plugged into the heart of Beija Island and its transformative journey.',
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/per-auset/donor.png',
                cta: {
                  text: 'BECOME A MEMBER',
                  url: '/',
                },
              },
              {
                title: 'Donor',
                text: 'Donors provide essential gifts that help fund a variety of projects within our village. This might include the women&apos;s shelter, emerging temple clinic, and school. Your contribution is an investment in the future of Beija Island, enabling us to create safe spaces for healing and empowerment, while honoring ancient Egyptian traditions. Every donation, no matter the size, helps bring us closer to realizing our shared vision.',
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/per-auset/member.png',
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
            title: 'Accommodation Options',
            description: 'Here are a few ways to get involved',
            items: listings?.map((listing) => ({
              title: listing.name,
              price: listing?.fiatPrice?.val,
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
        type: 'promoCard',
        data: {
          settings: {
            alignImage: 'left',
          },
          content: {
            title: 'Food Options',
            body: `<p>We offer all our guests two daily meals at no extra cost: a brunch and early dinner. Any extra meals cost: 10 euros.</p>

            <p>At Per Auset, we are all about fresh, regenerative, and holistic living. And what better place to start than with what nourishes our bodies and gives us life? That's why we have planted—and continue to plant—many terraces and food gardens.</p>

            <p>We are currently under construction with our HAPI Café and MAMA'S WHOLESOME restaurant. For now, we serve food from our creative kitchen and small café, focusing on organic, fresh, local, mainly plant-based, vegetarian, and always colorful dishes!</p>

            <p>We've been told more than once that we make the best oat milk lattes in all of Egypt! We also serve oat matchas, fresh smoothies, cold-pressed juices, vibrant salads, and oven-baked goodies. Since we have our own livestock, we only serve meat on special occasions, always in honor and following local Nubian traditions. All proceeds go into our Per Auset wallet, circulating within our self-sustaining economy.</p>
            `,
            imageUrl:
              'https://cdn.oasa.co/custom-pages/per-auset/Webversion-Per-Ausset-Food-Jaqueline_Louan-5%201.png',
          },
        },
      },
      {
        type: 'listing',
        data: {
          settings: {
            numColumns: 3,
            isSmallImage: true,
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
            type: 'masonry',
          },
          content: {
            title:
              'Some images of our current state of development. Of course the photos will keep changing every few months as the plants grow and buildings evolve. To stay up to date please feel free to join our <a href="https://t.me/perauset" target="_blank">telegram group</a>',

            items: [
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/per-auset/gallery/2418d725-9d55-4dfb-9b6a-998c6cd8f33a.png',
                alt: 'Per Auset',
                width: 1573,
                height: 1178,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/per-auset/gallery/72124d1f-6314-4639-b3f7-e03199b10612.png',
                alt: 'Per Auset',
                width: 885,
                height: 1180,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/per-auset/gallery/ed582217-b00d-4265-a18b-aca6bc132176.png',
                alt: 'Per Auset',
                width: 885,
                height: 1178,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/per-auset/gallery/Per-Ausset-Food-Jaqueline_Louan-21%202.png',
                alt: 'Per Auset ',
                width: 2038,
                height: 1360,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/per-auset/gallery/Webversion-Per-Ausset-Jaqueline_Louan-10.png',
                alt: 'Per Auset',
                width: 1767,
                height: 1180,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/per-auset/gallery/Webversion-Per-Ausset-Jaqueline_Louan-11.png',
                alt: 'Per Auset',
                width: 787,
                height: 1180,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/per-auset/gallery/Webversion-Per-Ausset-Jaqueline_Louan-12.png',
                alt: 'Per Auset',
                width: 787,
                height: 1176,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/per-auset/gallery/Webversion-Per-Ausset-Jaqueline_Louan-28.png',
                alt: 'Per Auset',
                width: 1771,
                height: 1178,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/per-auset/gallery/Webversion-Per-Ausset-Jaqueline_Louan-31.png',
                alt: 'Per Auset',
                width: 1765,
                height: 1178,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/per-auset/gallery/Webversion-Per-Ausset-Jaqueline_Louan-35.png',
                alt: 'Per Auset',
                width: 1765,
                height: 1180,
              },
            ],
          },
        },
      },
      {
        type: 'events',
        data: {
          settings: {
            alignImage: 'left',
          },
          content: {
            title: '',
            body: '<p>We are building a regenerative village on the sacred grounds of Auset, where ancient wisdom and the future come together. Inspired by the Auset and Ausar mysteries, we honor the eternal cycle of life, death, and renewal—restoring what was lost and creating a sustainable way forward. This is more than a village; it is a living testament to regeneration, balance, and the timeless knowledge of our ancestors. Through our gardens, temples, and communal spaces, we revive the traditions of sacred living and harmony with nature. Here, we remember, rebuild, and lay the foundations for a future rooted in the wisdom of the past—one that thrives in beauty, truth, and Maat/ Divine law . In doing so, we are doing our best to create a template for the New Earth, where humanity and nature exist in harmony, and the sacred is woven into everyday life.</p>',
          },
        },
      },
      {
        type: 'text',
        data: {
          settings: {
            alignImage: 'left',
          },
          content: {
            title: '',
            body: '<p>We are building a regenerative village on the sacred grounds of Auset, where ancient wisdom and the future come together. Inspired by the Auset and Ausar mysteries, we honor the eternal cycle of life, death, and renewal—restoring what was lost and creating a sustainable way forward. This is more than a village; it is a living testament to regeneration, balance, and the timeless knowledge of our ancestors. Through our gardens, temples, and communal spaces, we revive the traditions of sacred living and harmony with nature. Here, we remember, rebuild, and lay the foundations for a future rooted in the wisdom of the past—one that thrives in beauty, truth, and Maat/ Divine law . In doing so, we are doing our best to create a template for the New Earth, where humanity and nature exist in harmony, and the sacred is woven into everyday life.</p>',
          },
        },
      },
      {
        type: 'faqs',
        data: {
          content: {
            googleSheetId: generalConfig?.faqsGoogleSheetId,
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
