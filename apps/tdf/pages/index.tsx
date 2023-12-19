import Head from 'next/head';
import Link from 'next/link';

import { useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';

import { Heading, YoutubeEmbed } from 'closer';
import { useAuth } from 'closer/contexts/auth';
import { event } from 'nextjs-google-analytics';

const HomePage = () => {
  const { user, isAuthenticated } = useAuth();
  const [ctaButton, setCtaButton] = useState({
    text: 'join the dream',
    link: '/signup',
  });

  useEffect(() => {
    if (isAuthenticated && !user?.subscription?.plan) {
      setCtaButton({ text: 'subscribe', link: '/subscriptions' });
    }
    if (user && user?.subscription?.plan) {
      setCtaButton({ text: 'book a stay', link: '/stay' });
    }
  }, [user, isAuthenticated]);

  return (
    <div>
      <Head>
        <title>Traditional Dream Factory</title>
        <meta
          name="description"
          content="Traditional Dream Factory (TDF) is a regenerative playground in Abela, Portugal."
        />
        <link
          rel="canonical"
          href="https://www.traditionaldreamfactory.com/"
          key="canonical"
        />
      </Head>
      <section className="absolute overflow-hidden left-0 h-full min-w-[100vw] bg-accent-light pb-12 -mt-6 mb-12 md:mb-[100vh] text-right">
        <div className="h-[100vh]">
          {isMobile ? (
            <video
              loop={true}
              muted={true}
              autoPlay={true}
              playsInline={true}
              className="w-full h-full object-cover"
            >
              <source
                src="https://cdn.oasa.co/video/tdf-360-mute.mp4"
                type="video/mp4"
              />
            </video>
          ) : (
            <YoutubeEmbed isBackgroundVideo={true} embedId="VkoqvPcaRpk" />
          )}
        </div>
        <div className="absolute left-0 top-0 z-10 bg-opacity-50 bg-black w-full h-full flex justify-center ">
          <div className="w-full h-auto overflow-scroll flex justify-center flex-col items-center">
            <div className="max-w-6xl w-full py-32">
              {/* <Heading
                className="text-center text-white text-3xl sm:text-4xl md:text-5xl"
                data-testid="page-title"
                display
                level={1}
              >
                Traditional Dream Factory is a regenerative village. A playground for the future. A place to learn, grow and share. A place to live in harmony with nature and each other. A place to dream. A place to be. A place to become. A place to belong. A place to call home.
              </Heading> */}
              <Heading
                className="text-center text-white text-3xl font-light sm:text-4xl md:text-5xl"
                data-testid="page-title"
                display
                level={1}
              >
                <b className="font-black">Traditional Dream Factory</b> is a
                regenerative village blending together{' '}
                <b className="font-black">technology, nature & community</b>. Be
                a part of our journey to a place you can call{' '}
                <b className="font-black">home</b>.
              </Heading>
              <div className="flex justify-center align-center mt-12">
                <Link
                  href={ctaButton.link}
                  className="bg-accent text-white rounded-full py-2.5 px-8 text-xl"
                  onClick={() =>
                    event('click', {
                      category: 'HomePage',
                      label: ctaButton.text,
                    })
                  }
                >
                  {ctaButton.text.toUpperCase()}
                </Link>
                <Link
                  href="/what-is-tdf"
                  className="bg-transparent text-white px-8 py-2.5 uppercase"
                  onClick={() =>
                    event('click', {
                      category: 'HomePage',
                      label: 'Learn more',
                    })
                  }
                >
                  Learn more
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
