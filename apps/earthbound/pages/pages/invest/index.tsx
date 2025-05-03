import Head from 'next/head';

import { useEffect } from 'react';

import {
  CustomSections,
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
        type: 'hero',
        data: {
          settings: {
            alignText: 'top-left',
            isInverted: true,
          },
          content: {
            title: 'BECOME AN IMPACT INVESTOR',
            imageUrl:
              'https://cdn.oasa.co/custom-pages/earthbound/investor-hero.png',
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
              <p>
                Support the creation of an ethical and regenerative project and create impact beyond our lifetime. We are calling in impact investors who want to make the vision of Earthbound a reality with us and who are committed to creating a life-centred and regenerative future.              </p>
              <blockquote>
                You can put your money in Earthbound instead of the bank!
                <br/>
                We welcome impact investments from 120.000 SEK to 3.000.000 SEK.
              </blockquote>
           

              <h2>HOW SAFE IS YOUR IMPACT INVESTMENT?</h2>
              <ul>
                <li>It is a long-term investment with a real estate collateral</li>
                <li>It is bound by clear contractual agreements with each investor</li>
                <li>You have freedom to withdraw your money at any time, with respect to the sustainability of the project</li>
                <li>Earthbound is safeguarding your money by making economic, ecological and social investments on a human scale</li>
              </ul>

              <h2>WHAT DO WE OFFER?</h2>
              <ul>
                <li>Be part of shaping the project by voting at the general assembly</li>
                          <li>A voucher for a free extended weekend stay with us every year</li>
                          <li>Discount on the yearly Earthbound Gathering</li>
                          <li>Interest rate based on inflation</li>
                        </ul>

                        <h2>HOW TO BECOME AN IMPACT INVESTOR?</h2>
                        <ol>
                          <li>Reach out to us via Email, Telegram or WhatsApp</li>
                          <li>Have a conversation with us about your needs and desires to invest into the project</li>
                          <li>Together we shape your individual Impact Investor Agreement based on our templates and agree on the size of your investment</li>
                          <li>You become a shareholder of Earthbound Housing Cooperative AB, can attend the yearly General Assembly, visit us and become an advisor of the project</li>
                        </ol>

                        <p>
                          For more information please contact us:<br>
                          <strong>Email:</strong> <a href="mailto:contact@earthbound.eco">contact@earthbound.eco</a>
                          <br/>
                          <strong>Telegram:</strong> <a href="https://t.me/earthboundecovillage">@earthboundecovillage</a>
                        </p>
                       
                        `,
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
            title: 'VOICES OF OTHER IMPACT INVESTORS',
            items: [
              {
                title: 'CAMILLA ENGLYST, Denmark',
                text: '\“I am proud to be part of the backing team for Earthbound because they are doing something right. The model has the potential to spread and create real impact. I believe in this project, its vision, and its approach to building a better future. I trust in the Earthbound initiators and their vision, just as I know others will trust in me when it\'s my turn to develop a similar project. Until then, I am proud to be part of this backing team and to witness Earthbound blossom.\”',
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/camilla.png',
              },
              {
                title: 'PETER KÄMMERLING, Germany',
                text: '“Being a small part of a wonderful new community-led sustainable housing project with wonderful people in a great place makes me dream of a bright, peaceful, engaged, shared future for (wo-)mankind and earth.”',
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/peter.png',
              },
              {
                title: 'LEANN ERIKSSON, Sweden/USA',
                text: '\“I\'m an impact investor at Earthbound because it is aligned with what humans need the most now: conscious, heart-centered connection with each other and the rest of the natural world. The founders have meticulously put together the best model I’ve ever seen for a successful new community, where a new fusion of ancient and modern ways of humans being on Earth is midwifed in the next decade.\“',
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/leann.png',
              },
              {
                title: 'Stefan Taylor, UK',
                text: '\“We are thrilled to contribute in a small way and be part of Earthbound Ecovillage. An incredibly hopeful project in an often dark world.\“',
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/Stefan%20Taylor.jpeg',
              },
              {
                title: 'Hanna Morjan, Findhorn Ecovillage, Scotland',
                text: '\“It feels like a privilege to be able to support this group of young people in their vision and dreams to make Earthbound Ecovillage a reality. I am impressed by their thorough research to create a sustainable community sharing a vision of a better future., including intergenerational families, community minded elders and young ecologically minded families using sociocracy, an inclusive decision making process. I am delighted to be part of their journey!\“',
                imageUrl:
                'https://cdn.oasa.co/custom-pages/earthbound/Hanna%20Morjan.jpg',
              },
              {
                title: 'Tasos Zembylas, Austria',
                text: '\“I have invested in Earthbound to participate in a well-designed social experiment run by a number of creative people. I refer to motives that cannot be fully expressed by words. When I first heard about this project bright colours, warm sounds and pleasurable images emerged in my mind. Or to put it differently: Imagine a living world without some promising social experiments.\“',
                
                imageUrl:
                'https://cdn.oasa.co/custom-pages/earthbound/Tasos%20Zembylas.jpg',
              },
              {
                title: 'Enrico Ghidoni, Italy',
                text: '\“I am happy to be one of the investors of Earthbound, as it feels like a beautiful community with the potential to bring regeneration and sustainable growth to our society. Knowing personally some of the founders gave me a good sense of trust in the development of the vision and that my investment will support a beautiful and solid project. I am excited to visit Earthbound soon, witness how this magic seed will germinate and contribute in the way I can to support it in flourishing 🌸.\“',
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/Enrico%20Ghidoni.jpg',
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

const InvestPage = ({ generalConfig, listings, hosts }: Props) => {
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

InvestPage.getInitialProps = async (context: NextPageContext) => {
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

export default InvestPage;
