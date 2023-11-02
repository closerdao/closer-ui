import Head from 'next/head';

import { useEffect, useState } from 'react';
import {
  FacebookShareButton,
  LinkedinIcon,
  LinkedinShareButton,
  RedditIcon,
  RedditShareButton,
  TelegramIcon,
  TelegramShareButton,
  TwitterIcon,
  TwitterShareButton,
  WhatsappIcon,
  WhatsappShareButton,
} from 'react-share';
import { FacebookIcon } from 'react-share';
import { event } from 'nextjs-google-analytics';

import Modal from '../../components/Modal';
import YoutubeEmbed from '../../components/YoutubeEmbed';
import { Button, Card, Heading, LinkButton } from '../../components/ui';

import PageNotFound from '../404';
import { usePlatform } from '../../contexts/platform';
import api from '../../utils/api';
import { __ } from '../../utils/helpers';


interface Props {
  fundraisingConfig: {
    videoId: string;
    wandererUrl: string;
    pioneerUrl: string;
    oneMonthSharedUrl: string;
    oneMonthPrivateUrl: string;
    buy5TdfUrl: string;
    buy10TdfUrl: string;
    hostEventUrl: string;
  };
}

const SupportUsPage = ({ fundraisingConfig }: Props) => {
  const { platform }: any = usePlatform();
  const filter = {
    where: { 'subscription.plan': 'wanderer' }
  };

  const wandererCount = platform.user.findCount(filter) || 0;

  const [isInfoModalOpened, setIsInfoModalOpened] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const openModal = () => {
    setIsInfoModalOpened(true);
  };

  const closeModal = () => {
    setIsInfoModalOpened(false);
  };

  const loadData = async () => {
    try {
      await Promise.all([
        platform.user.get(filter),
        platform.user.getCount(filter),
      ]);
    } catch (err) {
    } finally {
    }
  };

  if (process.env.NEXT_PUBLIC_FEATURE_SUPPORT_US !== 'true') {
    return <PageNotFound />;
  }

  return (
    <>
      <Head>
        <title>{__('support_us_heading')}</title>
        <meta name="description" content="" />
        <meta property="og:type" content="event" />
      </Head>

      {isInfoModalOpened && (
        <Modal closeModal={closeModal}>
          <div>
            <p className="step-title mb-8">Share this page:</p>
            <div className="flex gap-2">
              <FacebookShareButton
                quote="Support Traditional Dream Factory"
                url="https://www.traditionaldreamfactory.com/support-us"
              >
                <FacebookIcon size={32} round={true} />
              </FacebookShareButton>
              <TwitterShareButton
                title="Support Traditional Dream Factory"
                url="https://www.traditionaldreamfactory.com/support-us"
                related={['@tdfinyourdreams']}
              >
                <TwitterIcon size={32} round={true} />
              </TwitterShareButton>

              <TelegramShareButton
                title="Support Traditional Dream Factory"
                url="https://www.traditionaldreamfactory.com/support-us"
              >
                <TelegramIcon size={32} round={true} />
              </TelegramShareButton>

              <WhatsappShareButton
                title="Support Traditional Dream Factory"
                url="https://www.traditionaldreamfactory.com/support-us"
              >
                <WhatsappIcon size={32} round={true} />
              </WhatsappShareButton>

              <LinkedinShareButton
                title="Support Traditional Dream Factory"
                url="https://www.traditionaldreamfactory.com/support-us"
              >
                <LinkedinIcon size={32} round={true} />
              </LinkedinShareButton>

              <RedditShareButton
                title="Support Traditional Dream Factory"
                url="https://www.traditionaldreamfactory.com/support-us"
              >
                <RedditIcon size={32} round={true} />
              </RedditShareButton>
            </div>
          </div>
        </Modal>
      )}

      <div className="w-full flex items-center flex-col gap-12 mt-6">
        <section className="w-full flex flex-col gap-4 sm:gap-0 sm:flex-row justify-center max-w-3xl">
          <div className="w-full sm:w-2/3 h-[288px] sm:rounded-l-md overflow-hidden">
            <YoutubeEmbed embedId={fundraisingConfig.videoId} />
          </div>
          <div className="flex flex-col gap-6 bg-accent-light w-full sm:w-1/3 sm:rounded-r-md p-5 text-center justify-center">
            <LinkButton
              href={fundraisingConfig.wandererUrl}
              className="font-bold text-xl p-1"
            >
              Subscribe
            </LinkButton>

            <div className="w-full rounded-full bg-gray-200">
              <div
                style={{ width: `${Math.min(wandererCount, 300) / 300}%` }}
                className="bg-accent h-[18px] rounded-full"
              ></div>
            </div>
            <strong>{wandererCount} of 300</strong>
          </div>
        </section>
        <section className=" w-full flex flex-col gap-6 justify-center max-w-3xl">
          <Heading level={1} className="uppercase text-accent">
            We need your support
          </Heading>
          <Heading level={2}>
            With the collective strength of just 300 supporters contributing €10
            per month, we can open the next iteration of TDF in 2024.
          </Heading>
          <p>
            Our journey over the last three years has laid the groundwork for a
            regenerative village, with architectural blueprints now approved and
            awaiting realization.
          </p>
          <Heading level={4}>
            Support us in making this a reality by subscribing and receive:
          </Heading>
          <ul>
            <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
              Weekly educational material on how we are building TDF
            </li>
            <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
              A free copy of the book &quot;How to build a regenerative
              village&quot;
            </li>
            <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
              Access to our co-living facilities and events
            </li>
            <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
              Access to community and our expansive network of regenerators
            </li>
          </ul>
          <Heading level={4}>Help us spread the word</Heading>
          <Button className="w-[200px]" onClick={openModal}>
            Share this
          </Button>
        </section>

        <section className=" w-full flex flex-col gap-6 justify-center max-w-3xl">
          <Heading level={1} className="uppercase">
            Ways to support
          </Heading>

          <p>
            You can support us with a monthly subscription and with one time
            packages.
          </p>

          <Card className="border-accent border-2">
            <Heading level={3}>Become a Wanderer</Heading>
            <ul>
              <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                Weekly educational material on how we are building TDF
              </li>
              <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                A free copy of the book &quot;How to build a regenerative
                village&quot;
              </li>
              <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                Priority access to our co-living facilities and events
              </li>
              <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                Access to community and our expansive network of regenerators
              </li>
              <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                Access to discord
              </li>
            </ul>
            <LinkButton
              href={fundraisingConfig.wandererUrl || '/subscriptions/checkout?priceId=price_1NGHnoGtt5D0VKR2SeTQxIYz'}
              className="w-[255px] text-[13px] sm:text-[16px] sm:w-[320px]"
              onClick={() =>
                event('click', {
                  category: 'Fundraiser',
                  label: 'Subscribe (€10 per month)',
                })
              }
            >
              Subscribe (€10 per month)
            </LinkButton>
          </Card>

          <Card className="border-accent border-2">
            <Heading level={3}>Become a Pioneer</Heading>
            <ul>
              <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                Everything from the Wanderer subscription
              </li>
              <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                Get 25% discount on stays by pre-paying every month
              </li>
            </ul>
            <LinkButton
              href={fundraisingConfig.pioneerUrl}
              className="w-[255px] text-[13px] sm:text-[16px] sm:w-[320px]"
              onClick={() =>
                event('click', {
                  category: 'Fundraiser',
                  label: 'Subscribe (from €30 per month)',
                })
              }
            >
              Subscribe (from €30 per month)
            </LinkButton>
          </Card>

          <Card className="border-gray-200 border-2">
            <Heading level={3}>
              Book one month co-living in shared glamping from March 2024 to June 2024.
            </Heading>

            <ul>
              <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                Meet in person with a thriving network of regenerative
                entrepreneurs
              </li>
              <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                30 nights of shared glamping
              </li>
              <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                Access to co-working
              </li>
            </ul>
            <LinkButton
              href={fundraisingConfig.oneMonthSharedUrl}
              className="w-[240px]"
              onClick={() =>
                event('click', {
                  category: 'Fundraiser',
                  label: 'Book one month co-living in shared glamping',
                })
              }
            >
              €395
            </LinkButton>
          </Card>

          <Card className="border-gray-200 border-2">
            <Heading level={3}>
              Book one month co-living in private glamping from March 2024 to June 2024.
            </Heading>
            <ul>
              <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                Meet in person with a thriving network of regenerative
                entrepreneurs
              </li>
              <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                30 nights of private glamping
              </li>
              <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                Access to co-working
              </li>
            </ul>
            <LinkButton
              href={fundraisingConfig.oneMonthPrivateUrl}
              className="w-[240px]"
              onClick={() =>
                event('click', {
                  category: 'Fundraiser',
                  label: 'Book one month co-living in private glamping',
                })
              }
            >
              €895
            </LinkButton>
          </Card>

          <Card className="border-gray-200 border-2">
            <Heading level={3}>Buy 5 TDF tokens</Heading>
            <p>
              Access TDF 5 nights, each year, forever - in a basic
              accommodation. The TDF Token is your key to our co-living space,
              and it also gives you governance rights in the TDF DAO so you can
              raise your voice on important topics.
            </p>
            <LinkButton
              href={fundraisingConfig.buy5TdfUrl || '/token/checkout?tokens=5'}
              className="w-[240px]"
            >
              ~€1250
            </LinkButton>
          </Card>

          <Card className="border-gray-200 border-2">
            <Heading level={3}>Buy 10 TDF tokens</Heading>
            <p>
              Access TDF 10 nights, each year, forever - in a basic
              accommodation. The TDF Token is your key to our co-living space,
              and it also gives you governance rights in the TDF DAO so you can
              raise your voice on important topics.
            </p>
            <LinkButton
              href={
                fundraisingConfig.buy10TdfUrl || '/token/checkout?tokens=10'
              }
              className="w-[240px]"
            >
              ~€2500
            </LinkButton>
          </Card>

          <Card className="border-gray-200 border-2">
            <Heading level={3}>Host an event at TDF in 2024</Heading>
            <p>
              We organize an all inclusive 3 day event for your startup, friends
              or family (up to 50 guests).
            </p>
            <LinkButton
              href="mailto:space@traditionaldreamfactory.com?subject=Host an event at TDF in 2024"
              className="w-[240px]"
            >
              €9500
            </LinkButton>
          </Card>
        </section>
      </div>
    </>
  );
};

SupportUsPage.getInitialProps = async () => {
  try {
    const {
      data: { results: fundraisingConfig },
    } = await api.get('/config/fundraiser');

    return {
      fundraisingConfig,
    };
  } catch (err) {
    return {
      fundraisingConfig: {},
      error: err,
    };
  }
};

export default SupportUsPage;
