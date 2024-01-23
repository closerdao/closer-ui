import Head from 'next/head';
import Link from 'next/link';

import { useEffect, useState } from 'react';

import { Heading } from 'closer';
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
      <section>
        <div className="max-w-6xl mx-auto w-full px-4 md:h-full py-32 text-xl md:text-2xl">
          <div className="max-w-prose">
            <Heading
              className="text-3xl sm:text-4xl md:text-5xl mb-6"
              data-testid="page-title"
              display
              level={1}
            >
              TDF is a collective of doers & dreamers, prototyping a regenerative way of life.
            </Heading>
            <p className="mb-4">TDF was founded on by a group of burner friends as a prototype for creating a regenerative way of life.</p>
            <p className="mb-4">After being 3 years on the ground, in 2024 we are trying a new experiment:What if our village was completely free to access?</p>
            <p className="mb-4">In the spirit of co-creation and gifting economy, you are invited to be a part of creating the new paradigm. One where we are restoring local ecosystems, and using our time for play.</p>
            <p className="mb-4">This is a re-imagination of what human purpose can be. We need to become a keystone species that’s enabling more life to flourish on this planet.</p>
            <p className="mb-4">This is saying no to the extractive mentality of the past, and embracing a lovership with planet earth.</p>
            <p className="mb-4">Technology is increasingly making obsolete the notion that we should have a society that distributes it’s value based on productivity. As AI and AGI rise, some see doom and loss of jobs. We see a future where humans are focused on building things out of love rather than out of necessity. We see a future where machines will be doing the bulk of manual labor and humans will choose to surround themselves by nature.</p>
            <p className="mb-4"> We see a future where <b>play</b> becomes our primary way of being.</p>
            <p className="mb-8">Join us on this experiment, opening Feb 9.</p>
          </div>
          <div className="flex justify-start flex-col md:flex-row align-center mt-12 text-center">
            <Link
              href={ctaButton.link}
              className="bg-accent text-white rounded-full py-2.5 px-8 text-2xl"
              onClick={() =>
                event('click', {
                  category: 'HomePage',
                  label: 'Play',
                })
              }
            >
              I want to play!
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
