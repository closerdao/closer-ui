import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

import { useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';

import Faqs from 'closer/components/Faqs';
import { Heading } from 'closer/components/ui';

import {
  GeneralConfig,
  Resources,
  YoutubeEmbed,
  api,
  useAuth,
  useConfig,
} from 'closer';
import { HOME_PAGE_CATEGORY } from 'closer/constants';
import { useFaqs } from 'closer/hooks/useFaqs';
import { formatSearch } from 'closer/utils/api';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

interface Props {
  generalConfig: GeneralConfig | null;
}

const HomePage = ({ generalConfig }: Props) => {
  const t = useTranslations();
  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;
  const { FAQS_GOOGLE_SHEET_ID } = useConfig() || {};
  const { faqs, error } = useFaqs(FAQS_GOOGLE_SHEET_ID);
  const { isAuthenticated } = useAuth();

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isAutoplaying, setIsAutoplaying] = useState(false);

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

  return (
    <div>
      <Head>
        <title>{`Welcome to ${PLATFORM_NAME}!`}</title>
        <meta name="description" content="Welcome Moos!" />
      </Head>
      <section className="w-[100vw] md:w-[calc(100vw+16px)] -mx-4 relative -top-6 overflow-hidden md:left-0 md:h-[100vh] md:min-w-[100vw] md:min-h-[100vh] bg-accent-alt mb-8">
        <div className="md:h-[100vh] ">
          {isSmallScreen && (
            <div className="h-[calc(100vh)]">
              <div
                className={`h-full ${!isAutoplaying ? 'visible' : 'hidden'} `}
              >
                <Image
                  className="w-full h-full object-cover"
                  src="/images/Moos-Halle.jpg"
                  width={731}
                  height={786}
                  alt="Moos Halle"
                />
              </div>
              <video
                ref={videoRef}
                loop={true}
                muted={true}
                autoPlay={true}
                playsInline={true}
                className={`w-full h-full object-cover ${
                  isAutoplaying ? 'visible' : 'hidden'
                } `}
              >
                <source
                  src="https://cdn.oasa.co/video/moos-mute-small.mp4"
                  type="video/mp4"
                />
              </video>
            </div>
          )}
          {!isSmallScreen && (
            <YoutubeEmbed isBackgroundVideo={true} embedId="zvC9c-hI6Fw" />
          )}
        </div>
        <div className="absolute left-0 top-0 w-full h-full bg-white/30 flex justify-center z-1000">
          <div className="w-full flex justify-center flex-col items-center">
            <div className="md:w-full md:max-w-6xl p-6 md:p-4 flex flex-col items-end gap-2 md:gap-10">
              <Heading
                className="h-full text-black uppercase text-3xl  sm:text-5xl font-extrabold w-full md:w-[700px] text-right flex items-center px-0 sm:px-6 pb-4"
                level={1}
              >
                {t('home_hero_heading')}
              </Heading>
              <div className="flex flex-col sm:flex-row justify-end gap-4 w-full px-0 sm:px-6">
                {!isAuthenticated && (
                  <Link
                    href="/signup"
                    type="submit"
                    className="bg-accent text-white text-center rounded-full py-2.5 px-8 text-md tracking-wide uppercase"
                  >
                    {t('home_join_dream_button')}
                  </Link>
                )}
                <Link
                  href="/pdf/moos-menu.pdf"
                  type="submit"
                  className="bg-accent text-white text-center rounded-full py-2.5 px-8 text-md tracking-wide uppercase"
                >
                  {t('home_download_menu_button')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex w-full justify-center ">
        <div className="max-w-6xl w-full pt-5 flex flex-col gap-20 items-center">
          <section className="max-w-2xl flex flex-col gap-12 ">
            <Heading
              className="text-accent text-2xl font-normal text-center"
              level={2}
            >
              {t('home_community_heading')}
            </Heading>

            <div className="flex flex-col sm:flex-row gap-8">
              <div className="flex-1 flex flex-col gap-4">
                <p>{t('home_community_intro_1')}</p>
                <p
                  dangerouslySetInnerHTML={{
                    __html: t('home_community_intro_2'),
                  }}
                />
                {/* <p>
                The Y Berlin, a new community design lab embedded within MOOS,
                tends to the blend of technology and community, reflecting
                MOOS’ aim to cultivate spaces that foster connections deeper
                than mere cohabitation.
              </p> */}
                {/* <p>
                Located in the heart of Berlin, next to Treptower Park.
                Hosting a regenerative community design lab, building local
                solutions for urban challenges.{' '}
              </p>
              <p>
                MOOS is a home where <strong>my story</strong> and{' '}
                <strong>your story</strong> becomes <strong>our story</strong>
                .{' '}
              </p>
              <p>
                Did you know that we run on{' '}
                <Link
                  href="/settings/credits"
                  className="text-accent font-bold"
                >
                  Vybes
                </Link>
                ?
              </p>
              <p>
                Vybes are community frequencies that open the portals to
                serendipity. We don’t rent spaces at MOOS. We gift
                experiences.{' '}
              </p> */}
              </div>
              <div className="flex-1 flex flex-col gap-4">
                <p
                  dangerouslySetInnerHTML={{
                    __html: t('home_community_intro_3'),
                  }}
                />
                <p
                  dangerouslySetInnerHTML={{
                    __html: t('home_community_intro_4'),
                  }}
                />
                <p>
                  <Link href="/support-us" className="text-accent font-bold ">
                    {t('home_community_join_vybes')}
                  </Link>
                </p>

                {/* <p>With the introduction of <Link
                  href="/settings/credits"
                  className="text-accent font-bold"
                >Vybes</Link>, seeded by the Y Berlin, we aim to fertilize community engagement with experiences and connections valued over transactions. Vybes encourages every member, new or old, to contribute their unique super power. Forget about normal transactions; at MOOS, it`s all about what you feel called to bring to the table—ideas, workshops, you name it. Vybes let you dive into everything MOOS has to offer and really be an active part of a resilient and growing community space.</p> */}
                {/* <p>
                Vybes can be used to create or gift experiences. Since 2012,
                MOOS has hosted a mycelial network of experience designers.
                Through vybes, you can organize an event at MOOS: a unique
                opportunity to interface with Berlin’s finest creatives and
                co-create a residential, experiential program for you and your
                community.
              </p>
              <p>
                Our design logistics experts can provide event support
                alongside your stay: complete with facilitation, event
                management, and multi-sensory experiences including catering &
                dining 🍛.
              </p> */}
              </div>
            </div>

            <div className="flex  gap-4 bg-accent-light rounded-md p-4">
              <p
                className="flex-1 text-lg font-bold"
                dangerouslySetInnerHTML={{
                  __html: t('home_dao_announcement'),
                }}
              />
            </div>
          </section>

          <section className="mb-12 max-w-6xl mx-auto pb-10 pt-10">
            <div className="text-center  flex flex-wrap justify-center mb-20">
              <Heading
                level={2}
                className="mb-4 uppercase w-full font-extrabold text-5xl max-w-[700px]"
              >
                {t('resources_resources_heading')}
              </Heading>
              <p className="mb-4 w-full">
                {t('resources_resources_subheading')}
              </p>
            </div>
            <Resources />
          </section>

          <section className="flex items-center flex-col max-w-4xl pb-12">
            <div className="w-full">
              <div className="text-center mb-6 flex flex-wrap justify-center">
                <Heading
                  level={2}
                  className="mb-4 uppercase w-full font-extrabold text-5xl max-w-[600px]"
                >
                  {t('resources_faq_heading')}
                </Heading>
                <p className="mb-4 w-full">{t('resources_faq_subheading')}</p>
              </div>
              {faqs && <Faqs faqs={faqs} error={error} />}
            </div>
          {/* <section className="mb-[90vh]"></section> */}
          </section>
        </div>
      </div>
    </div>
  );
};

HomePage.getInitialProps = async (context: NextPageContext) => {
  try {
    const search = formatSearch({ category: { $eq: HOME_PAGE_CATEGORY } });
    const [articleRes, generalRes, messages] = await Promise.all([
      api.get(`/article?where=${search}`).catch(() => {
        return null;
      }),
      api.get('/config/general').catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const article = articleRes?.data?.results[0];
    const generalConfig = generalRes?.data?.results?.value;
    return {
      article,
      generalConfig,
      messages,
    };
  } catch (err: unknown) {
    return {
      article: null,
      generalConfig: null,
      error: err,
      messages: null,
    };
  }
};

export default HomePage;
