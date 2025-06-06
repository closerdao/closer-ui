import Head from 'next/head';

import { useEffect } from 'react';

import MembershipTimeline from '@/components/MembershipTimeline';

import {
  CustomSections, // CustomSections,
  GeneralConfig,
  Listing,
  api,
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
    isHomePage: false,
    sections: [
      {
        type: 'promoCard',
        data: {
          settings: {
            alignImage: 'left',
            isColorful: true,
            imageSize: 'large',
          },
          content: {
            title: 'JOIN EARTHBOUND AS PART OF THE LIVING COMMUNITY',
            body: `<p>Are you interested in becoming part of the living community of Earthbound?</p>

<p><b>We are now open for new members!</b> So if you want to explore what’s possible, read the information below and if you have any questions feel free to contact us on <a href="mailto:contact@earthbound.eco">contact@earthbound.eco</a>. </p>`,
            imageUrl:
              'https://cdn.oasa.co/custom-pages/earthbound/AWP04555.jpg',
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
         

              <h2 class='ql-align-center'>IN SHORT, AS PART OF LIVING IN THE COMMUNITY YOU WOULD BE:</h2>
              

              <ul>
                <li>Living in Earthbound as your permanent residency</li>
                <li>Taking an active part in the community including decision making, working groups and community work</li>
                <li>Encouraged to take part in community activities such as common dinners, community processes and events</li>
                <li>Paying a monthly fee to the community</li>
                <li>Co-owning and stewarding Earthbound and the land</li>
                <li>Dedicated to our mission and vision</li>
              </ul>

              <h2 class='ql-align-center'>WHAT IS THE PROCESS TO BECOMING A MEMBER?</h2>
              <p>The social cohesion of the living community is essential to making Earthbound a reality and to realize its potentials and impacts. That is why we have designed a multi-step joining process where we, with time and slowness, can truly sense whether it is the right match on both sides.
</p>

                        `,
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

const CommunityPage = ({ generalConfig, listings, hosts }: Props) => {
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
        <title>Join the Community - Earthbound Ecovillage & Community</title>
        <meta name="description" content="Join us at Earthbound Ecovillage, a community of 30 people stewarding 73 ha of land with a lake, ancient forest and 9 buildings in southern Sweden." />
      </Head>

      <main className="py-12">
        <CustomSections page={page} />
        <MembershipTimeline />
      </main>
    </div>
  );
};

CommunityPage.getInitialProps = async (context: NextPageContext) => {
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

export default CommunityPage;
