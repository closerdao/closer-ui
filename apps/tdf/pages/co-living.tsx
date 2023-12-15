import Head from 'next/head';
import Link from 'next/link';

import { Heading } from 'closer';
import { SubscriptionPlan } from 'closer/types/subscriptions';
import api from 'closer/utils/api';
import PhotoGallery from 'closer/components/PhotoGallery';

interface Props {
  subscriptionPlans: SubscriptionPlan[];
}
const HomePage = ({ subscriptionPlans }: Props) => {
  return (
    <div>
      <Head>
        <title>Traditional Dream Factory - a co-living in Alentejo, Portugal</title>
        <meta
          name="description"
          content="Traditional Dream Factory (TDF) is a co-living space in Alentejo, Portugal."
        />
        <link
          rel="canonical"
          href="https://www.traditionaldreamfactory.com/"
          key="canonical"
        />
      </Head>
      <section className="flex items-center flex-col py-12 ">
        <div className="text-center mb-20 w-full md:max-w-6xl">
          <div className="w-full flex items-center flex-col">
            <Heading
              level={1}
              className="w-6xl md:mb-4 text-2xl sm:text-4xl md:text-5xl text-center"
            >
              We are pioneers of a new way of living. We are entrepreneurs, artists, engineers.
            </Heading>
          </div>
          <PhotoGallery className="mt-8" />
          <Heading
            level={1}
            className="w-6xl md:mb-4 text-2xl sm:text-4xl md:text-5xl text-center mt-20"
          >
            We believe in leaving a <span className="text-accent-alt">positive trace</span>. We believe in the nature backed economy. We believe <span className="text-accent-alt">ecological restoration</span> and play go hand and in hand.
          </Heading>
          <Heading
            level={1}
            className="w-6xl md:mb-4 text-2xl sm:text-4xl md:text-5xl text-center mt-20"
          >
            Want to join us in 2024?
          </Heading>
          <p
            className="w-6xl md:mb-4 text-2xl sm:text-4xl md:text-5xl text-center mt-20"
          >
            <Link href="/stay" className="text-primary text-black">
              Join our co-living residency
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
};

HomePage.getInitialProps = async () => {
  try {
    const {
      data: { results: subscriptions },
    } = await api.get('/config/subscriptions');

    return {
      subscriptionPlans: subscriptions.value.plans,
    };
  } catch (err) {
    return {
      subscriptionPlans: [],
      error: err,
    };
  }
};

export default HomePage;
