import Head from 'next/head';

import { useEffect } from 'react';

import {
  CustomSections,
  GeneralConfig,
  Listing,
  api,
  useAuth,
  usePlatform,
} from 'closer';
import { User } from 'closer/contexts/auth/types';
import { Page } from 'closer/types/customPages';
import { parseMessageFromError } from 'closer/utils/common';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { NextPageContext } from 'next';

const getPage = ({}: {
  listings: Listing[] | null;
  hosts: User[] | null;
  generalConfig: GeneralConfig | null;
}) => {
  const localPage: Page = {
    isHomePage: false,
    sections: [
      // {
      //   type: 'hero',
      //   data: {
      //     settings: {
      //       alignText: 'top-left',
      //       isInverted: true,
      //     },
      //     content: {
      //       title: 'HOST AN EVENT',

      //       imageUrl:
      //         'https://cdn.oasa.co/custom-pages/earthbound/events-hero.jpeg',
      //     },
      //   },
      // },

      {
        type: 'richText',
        data: {
          settings: {
            isColorful: true,
          },
          content: {
            html: `
            <h2 style="text-transform: uppercase;">
Want to host an event at Earthbound Ecovillage, Grimsnäs Herrgaard?            </h2>
<p>It is with a lot of joy that we are now opening up to hosting events (courses, retreats, conferences and private celebrations) here at Earthbound Ecovillage, Grimsnäs Herrgaard.</p>
<p>We would like to focus on events that are aligned with our <a href='/#values'>values</a>, but we are also open to exploring unexpected synergies.</p>
                      <p><i>For inspiration, previous events we have hosted: a 10-day long breathwork retreat, body therapy and healing sessions, guided forest meditations, private weekend birthday celebration, folk dance event, day time conferences for project leaders, yoga sessions, outdoor big midsummer celebration.</i> </p>  

                      
                      `,
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
            title: 'Venue and facilities',
            body: `At our venue we have:

            <ul>
  <li>14 rooms with 22 beds (high-end, estate-style)</li>
  <li>One workshop space (high-end, estate-style) with the capacity of approx. 30 people (depending on the activity)</li>
  <li>A double–kitchen and living room hang-out space</li>
  <li>An outdoor stage</li>
  <li>An outdoor dancing space and covered pavilion</li>
  <li>Lake to dip/swim, 15 min walking distance</li>
  <li>Outdoor fire-pits (both at the lake + barn)</li>
  <li>Swedish moss forest surrounding the whole place (biodiverse protected forest!)</li>
  <li>A weightlifting gym in the barn</li>
  <li>A hot tub in the forest (available for extra hire)</li>
</ul>
            `,

            imageUrl:
              'https://cdn.oasa.co/custom-pages/earthbound/DSCF1013.JPG',
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
            title: 'Venue and facilities',
            body: `Extra equipment:
<ul>
  <li>12 massage tables</li>
  <li>36 + 9 m2 puzzle-mats for movement</li>
  <li>2 soundbox (moveable, high-quality) speakers</li>
  <li>Projector + screen</li>
  <li>Flipchart</li>
  <li>Whiteboard</li>
  <li>Dining tables + chairs both indoors and outdoors</li>
  <li>10 extra blankets and pillows</li>
  <li>Firewood and cooking equipment for outdoor cooking</li>
  <li>Weightlifting gym equipment</li>
  <li>Archery equipment (1 target, 3 bows and 20 arrows)</li>
</ul>


            `,

            imageUrl:
              'https://cdn.oasa.co/custom-pages/earthbound/DSCF6373.jpg',
          },
        },
      },

      {
        type: 'richText',
        data: {
          settings: {
            isColorful: true,
          },
          content: {
            html: `
            <h2 style="text-transform: uppercase;">
Food        </h2>
<p>We have chefs here at the venue with experience in cooking for large groups (including vegan and gluten free options). Our food is 99% organic/biodynamic, vegetarian and most ingredients are from local farms. If you wish to bring your own chef, it is also an option.</p>
                      `,
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
            title: 'Where are we located?',
            body: `       
            
            <p>We are located in the heart of the Småland forest, in the Swedish country-side. We are surrounded by endless forest, silence and tranquility. </p>

        <p>We are 10 min. drive from <b>Lessebo Train station</b>, where there are <b>direct trains to Copenhagen, Malmö, Lund and Gotheborg every hour</b>. </p>

                     <ul>
  <li>Copenhagen – Lessebo (3h)</li>
  <li>Malmö – Lessebo (2h 15m)</li>
  <li>Lund – Lessebo (2h)</li>
  <li>Gothenburg – Lessebo (3h 15m)</li>
</ul>

<p>We can arrange pick-ups from/to the station for an extra fee. </p>



            `,

            imageUrl:
              'https://cdn.oasa.co/custom-pages/earthbound/e5f0c79bb6dd7db302a227bc1a6a2209_MEDC5DCED52BB724D26A11FFEE261905295.jpeg',
          },
        },
      },

      {
        type: 'richText',
        data: {
          settings: {
            isColorful: true,
          },
          content: {
            html: `
            <h2 style="text-transform: uppercase;">
Pricing details        </h2>
                 

<p><b>Reach out if you are interested in pricing.</b></p>
<br/>




<h2 style="text-transform: uppercase;">
Event contact      </h2>

<p>
  Dicte will be your contact for all event related inquires.
  Reach out to her at <a href="mailto:dicte@earthbound.eco">dicte@earthbound.eco</a>
</p>

`,
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
                  'https://cdn.oasa.co/custom-pages/earthbound/events-gallery/19a3574ecbb0381b309c886e7e2b5985_MEDEB6D67C9C7394D07B9A3CC1FD0DB5A04.jpeg',
                alt: 'Host an event at Earthbound Ecovillage',
                width: 1573,
                height: 1178,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/events-gallery/50490c7cc25566eea3c820cb257e73b3_MEDDD7B9165159A4011B6F015556452420D.jpeg',
                alt: 'Host an event at Earthbound Ecovillage',
                width: 1573,
                height: 1178,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/events-gallery/ae1404fdf1605246d788fb223e369131_MED4307D29EE72A4D53A97F26223402E5D2.jpeg',
                alt: 'Host an event at Earthbound Ecovillage',
                width: 1573,
                height: 1178,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/events-gallery/d8986b42bb620e28bf5b31667b7e948d_MED842AC2F98F6A467DBACF5FBDFA193293.jpeg',
                alt: 'Host an event at Earthbound Ecovillage',
                width: 1573,
                height: 1178,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/events-gallery/DSCF0895.JPG',
                alt: 'Host an event at Earthbound Ecovillage',
                width: 1573,
                height: 1178,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/events-gallery/DSCF1013.JPG',
                alt: 'Host an event at Earthbound Ecovillage',
                width: 1573,
                height: 1178,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/events-gallery/DSCF1065.JPG',
                alt: 'Host an event at Earthbound Ecovillage',
                width: 1573,
                height: 1178,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/events-gallery/DSCF1153.JPG',
                alt: 'Host an event at Earthbound Ecovillage',
                width: 1573,
                height: 1178,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/events-gallery/DSCF6373.jpg',
                alt: 'Host an event at Earthbound Ecovillage',
                width: 1573,
                height: 1178,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/events-gallery/DSCF6390.JPG',
                alt: 'Host an event at Earthbound Ecovillage',
                width: 1573,
                height: 1178,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/events-gallery/DSCF6434.jpg',
                alt: 'Host an event at Earthbound Ecovillage',
                width: 1573,
                height: 1178,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/events-gallery/DSCF6451.jpg',
                alt: 'Host an event at Earthbound Ecovillage',
                width: 1573,
                height: 1178,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/events-gallery/DSCF6491.jpg',
                alt: 'Host an event at Earthbound Ecovillage',
                width: 1573,
                height: 1178,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/events-gallery/e5f0c79bb6dd7db302a227bc1a6a2209_MEDC5DCED52BB724D26A11FFEE261905295.jpeg',
                alt: 'Host an event at Earthbound Ecovillage',
                width: 1573,
                height: 1178,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/events-gallery/ea3afa715f87b004531151efd640a25c_MED46F20D33CF184645B62BB640649D2D0B.jpeg',
                alt: 'Host an event at Earthbound Ecovillage',
                width: 1573,
                height: 1178,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/events-gallery/feed8f0dea2efa3923d06e8f9f4640d4_MED2D7B6AD36F9249599C0DE8C1A559199E.jpeg',
                alt: 'Host an event at Earthbound Ecovillage',
                width: 1573,
                height: 1178,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/events-gallery/grimsnas066.jpeg',
                alt: 'Host an event at Earthbound Ecovillage',
                width: 1573,
                height: 1178,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/events-gallery/grimsnas077.jpeg',
                alt: 'Host an event at Earthbound Ecovillage',
                width: 1573,
                height: 1178,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/events-gallery/grimsnas079.jpeg',
                alt: 'Host an event at Earthbound Ecovillage',
                width: 1573,
                height: 1178,
              },
              {
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/events-gallery/grimsnas080.jpeg',
                alt: 'Host an event at Earthbound Ecovillage',
                width: 1573,
                height: 1178,
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

const EventsPage = ({ generalConfig, listings, hosts }: Props) => {
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

  return (
    <div>
      <Head>
        <title>Impact Investor - Earthbound Ecovillage & Community</title>
        <meta
          name="description"
          content="Become one of our impact investors and support the creation of an ethical, regenerative project that lasts beyond our lifetime."
        />
      </Head>

      <CustomSections page={page} />
    </div>
  );
};

EventsPage.getInitialProps = async (context: NextPageContext) => {
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

export default EventsPage;
