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
            videoEmbedId: 'kic4AFJxbho',
            mobileVideoUrl:
              'https://cdn.oasa.co/custom-pages/earthbound/video/Earthbound_header_LQ2.mp4',
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
            <h2 style="text-transform: uppercase;">
              Do you want to put your savings in land, biodiversity and community, rather than the bank?
            </h2>
            <p>While you don’t need your savings, let them generate ‘passive change’ by placing them in a project that makes a real impact. Become part of the Earthbound Impact Investor Community where impact investments are based on real relationships and real land. </p>
                        `,
          },
        },
      },

      {
        type: 'videoEmbed',
        data: {
          content: {
            embedId: 'QKFIzNZ6L7s',
          },
        },
      },

      {
        type: 'listing',
        data: {
          settings: {
            numColumns: 2,
            isSmallImage: true,
            isColorful: true,
          },
          content: {
            title: '',
            description: '',
            items: [
              {
                title: 'Impact investments enable us to:',
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/_0001_Land-Stewardship.png',
                text: `
              
                 <ul style="text-align: left;">
                    <li>Take land out of the speculative, extractive market to - nature conservation and forest restoration</li>
                    <li>Create a blueprint of future regenerative living through bio-buildings and energy systems.</li>
                  </ul>
                `,
              },

              {
                title: 'By placing your savings with Earthbound they will be:',

                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/_0003_Local-and-Bioregional-Changemakers.png',
                text: `
              
                  <ul style="text-align: left;">
                    <li>Secured in real land and buildings</li>
                    <li>Regulated with inflation</li>
                    <li>Held by safe contracts developed in collaboration with WYZ Law Group</li>
                    <li>Safeguarded by a real on-site community with strong values</li>
                  </ul>
                `,
              },
            ],
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

            <p>If this sparks your interest, we would love to have a call with you to connect, get to know each other and share more details. </p>

            <h2 style="text-transform: uppercase;">
            You can put your money in Earthbound instead of the bank!
            <br/>
            </h2>
            <p>We welcome impact investments from 120.000 SEK to 3.000.000 SEK.</p>
            
            <p>
Support the creation of an ethical and regenerative project and create impact beyond your lifetime. We are calling in impact investors who want to make the vision of Earthbound a reality with us and who are committed to creating a life-centred and regenerative future . 
            </p>

              <h2>HOW TO BECOME AN IMPACT INVESTOR?</h2>
              
              
              <ol>
              <li>Reach out to us via Email, Telegram or WhatsApp</li>
              <li>Have a conversation with us about your needs and desires to invest into the project</li>
              <li>Together we shape your individual Impact Investor Agreement based on our templates and agree on the size of your investment</li>
              <li>You become a shareholder of Earthbound Housing Cooperative AB, can attend the yearly General Assembly, visit us and become an advisor of the project</li>
              </ol>
              
              <h2>WHAT ELSE DO WE OFFER?</h2>

              <ul><li>Be part of shaping the project by voting at the general assembly</li>
              <li>A voucher for a free extended weekend stay with us every year</li>
              <li>Discount on the yearly Earthbound Gathering</li>
              </ul>

                            <h2>HOW SAFE IS YOUR IMPACT INVESTMENT?</h2>

            

              <ul>
              <li>It is a long-term investment with a real estate collateral</li>
              <li>It is bound by clear contractual agreements with each investor</li>
              <li>You have freedom to withdraw your money at any time, with respect to the sustainability of the project</li>
              <li>Earthbound is safeguarding your money by making economic, ecological and social investments on a human scale</li>
              </ul>

          
             
                        <p>
                          For more information please contact us:
                          </p>
                          
                          <ul>
                            <li><strong>Email:</strong> <a href="mailto:contact@earthbound.eco">contact@earthbound.eco</a></li>
                            <li>
                            <strong>Telegram (Dicte):</strong> <a href="https://t.me/Dicte_Frost">@Dicte_Frost</a>
                            </li>
                            <li><strong>WhatsApp (Dicte):</strong> <a href="http://wa.me/+4560661280">+4560661280</a></li>
                           </ul>

                       
                        `,
          },
        },
      },

      {
        type: 'hero',
        data: {
          settings: {
            alignText: 'top-left',
            isInverted: true,
            isCompact: true,
          },
          content: {
            title:
              'NEXT PROJECT: PURCHASING 71HA FOR NATURE CONSERVATION AND REGENERATIVE AGRICULTURE',
            body: `
            
<p>The next impact investments will be used to buy the remaining 71ha of land around the property that we have already bought. The 71ha are reserved for us till September 2025.</p>

<p>The land includes protected forest, agricultural fields, grazing lands, wetland, a production forest and part of a lake. The land will be dedicated to nature conservation, regenerative agriculture and the further development of Earthbound.</p>

<p>We are raising 4 million SEK (approx. 400.000 €) to complete this project. </p>

            `,

            imageUrl:
              'https://cdn.oasa.co/custom-pages/earthbound/investor-hero.png',
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
                text: '"I am proud to be part of the backing team for Earthbound because they are doing something right. The model has the potential to spread and create real impact. I believe in this project, its vision, and its approach to building a better future. I trust in the Earthbound initiators and their vision, just as I know others will trust in me when it\'s my turn to develop a similar project. Until then, I am proud to be part of this backing team and to witness Earthbound blossom."',
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/camilla.png',
              },
              {
                title: 'PETER KÄMMERLING, Germany',
                text: '“Being a small part of a wonderful new community-led sustainable housing project with wonderful people in a great place makes me dream of a bright, peaceful, engaged, shared future for (wo-)mankind and earth.”',
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/peter.png',
              },
              {
                title: 'LEANN ERIKSSON, Sweden/USA',
                text: "“I'm an impact investor at Earthbound because it is aligned with what humans need the most now: conscious, heart-centered connection with each other and the rest of the natural world. The founders have meticulously put together the best model I've ever seen for a successful new community, where a new fusion of ancient and modern ways of humans being on Earth is midwifed in the next decade.\"",
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/leann.png',
              },
              {
                title: 'STEFAN TAYLOR, UK',
                text: '“We are thrilled to contribute in a small way and be part of Earthbound Ecovillage. An incredibly hopeful project in an often dark world."',
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/Stefan%20Taylor.jpeg',
              },
              {
                title: 'HANNA MORJAN, Findhorn Ecovillage, Scotland',
                text: '“It feels like a privilege to be able to support this group of young people in their vision and dreams to make Earthbound Ecovillage a reality. I am impressed by their thorough research to create a sustainable community sharing a vision of a better future., including intergenerational families, community minded elders and young ecologically minded families using sociocracy, an inclusive decision making process. I am delighted to be part of their journey!"',
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/Hanna%20Morjan.jpg',
              },
              {
                title: 'TASOS ZEMBYLAS, Austria',
                text: '“I have invested in Earthbound to participate in a well-designed social experiment run by a number of creative people. I refer to motives that cannot be fully expressed by words. When I first heard about this project bright colours, warm sounds and pleasurable images emerged in my mind. Or to put it differently: Imagine a living world without some promising social experiments."',

                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/Tasos%20Zembylas.jpg',
              },
              {
                title: 'ENRICO GHIDONI, Italy',
                text: '“I am happy to be one of the investors of Earthbound, as it feels like a beautiful community with the potential to bring regeneration and sustainable growth to our society. Knowing personally some of the founders gave me a good sense of trust in the development of the vision and that my investment will support a beautiful and solid project. I am excited to visit Earthbound soon, witness how this magic seed will germinate and contribute in the way I can to support it in flourishing 🌸."',
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/Enrico%20Ghidoni.jpg',
              },
              {
                title: 'JANET BANKS & HUGH ANDREWS',
                text: '“We wanted to support the Earthbound initiative, because so many of its values resonate with our own. We love the development of shared facilities that allow all to live a richer life both physically and socially. As a demonstration project of how we can live in harmony with the natural world and each other, we want it to succeed and hopefully be replicated in many ways throughout the world."',
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/Janet-Banks-&-Hugh-Andrews2.jpg',
              },
              {
                title: 'ANNEKE MUNS-KAANDORP, France',
                text: '“My partner and me were happy to invest some money in Earthbound Ecovillage. Why? Last year I met some of the ones that are now in the core group starting Earthbound. I was very impressed by the amount of experience, intelligence, knowledge, wisdom, warmth, connectedness, resilience and focus there was in the group. They had just "found" Grimsnäs and were determined that this would be the land where their dream-community would grow and flourish. I am convinced that this will be a beautiful place to share life in love and connection for many people and I\'m hopeful that one day I can be one of them."',
                imageUrl:
                  'https://cdn.oasa.co/custom-pages/earthbound/Anneke2.jpg',
              },
              // {
              //   title: 'NINA EWALD, Germany',
              //   text: '\“I invest in Earthbound Ecovillage because I believe another way of life is possible – one that reconnects us with the Earth, with authentic relationships, and with a true sense of home. For me, Earthbound is a resounding YES to a future where we rethink what it means to have a home. I had the privilege of being involved in the development over many months – as an investor and as part of a growing community. Through this experience, I\'ve seen what\'s possible when vision, structure, and heart come together: A place where sustainability, community, and spiritual values align. Earthbound Ecovillage is more than just a sustainable project for me; it\'s an invitation to place the Earth back at the center of our lives. It\'s about more than ecological awareness – it\'s about a deeper connection to what truly nourishes us: nature, community, and authentic exchange. As an impact investor, I see that this project will bring lasting change – not just today, but for the generations to come. It invites others to join this vision and help shape a livable and just future together.\"',
              //   imageUrl: 'https://cdn.oasa.co/custom-pages/earthbound/Nina-Ewald2.jpg',
              // },
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
