import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

import { useEffect, useState } from 'react';

import CreditsBalance from 'closer/components/CreditsBalance';
import { Card, Heading, LinkButton } from 'closer/components/ui';

import { useConfig } from 'closer';
import { usePlatform } from 'closer/contexts/platform';
import { FundraisingConfig } from 'closer/types';
import api from 'closer/utils/api';
import { __ } from 'closer/utils/helpers';

import PageNotFound from '../404';

interface Props {
  fundraisingConfig: FundraisingConfig;
}

const SupportUsPage = ({ fundraisingConfig }: Props) => {
  const { APP_NAME } = useConfig();
  const isCreditsEnabled = process.env.NEXT_PUBLIC_FEATURE_CARROTS === 'true';

  const isFundraiserEnabled =
    process.env.NEXT_PUBLIC_FEATURE_SUPPORT_US === 'true' &&
    fundraisingConfig?.enabled;

  const { platform }: any = usePlatform();
  const wandererFilter = {
    where: { 'subscription.plan': 'wanderer' },
  };
  const pioneerFilter = {
    where: { 'subscription.plan': 'pioneer' },
  };

  const wandererCount = platform.user.findCount(wandererFilter) || 0;
  const pioneerCount = platform.user.findCount(pioneerFilter) || 0;

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
        platform.user.getCount(wandererFilter),
        platform.user.getCount(pioneerFilter),
      ]);
    } catch (err) {
    } finally {
    }
  };

  if (!isFundraiserEnabled) {
    return <PageNotFound />;
  }

  return (
    <>
      <Head>
        <title>Support the MOOS</title>
        <meta name="description" content="" />
        <meta property="og:type" content="event" />
      </Head>

      <div className="w-full flex items-center flex-col gap-20 mt-6">
        <section className=" w-full flex flex-col sm:flex-row gap-10 justify-center max-w-3xl">
          <div className="flex flex-col gap-4">
            <Heading level={1} className="uppercase text-4xl  font-extrabold">
              Support the MOOS
            </Heading>
            <p>
              <strong>The Y Berlin</strong> is the first of our collectives
              fundraising to support enriching residencies and epic events at
              Moos.
            </p>
            <p>
              With these subscription packages you can continuously support us
              and receive digital vouchers called{' '}
              <Link
                className="text-accent font-bold no-underline"
                href="/settings/credits"
              >
                Vybes
              </Link>{' '}
              that can be used at any time in the following 12 months. You can
              then use your{' '}
              <Link
                className="text-accent font-bold no-underline"
                href="/settings/credits"
              >
                Vybes
              </Link>{' '}
              to cover your <strong>Accommodation Fee</strong> or{' '}
              <strong>Event Fee</strong> at MOOS.
            </p>
            <p>
              Experience living or running an event at MOOS, with no specific
              dates or long-term commitment required.
            </p>
          </div>
          <div>
            <Card className="w-[260px] p-2">
              <Image
                src="/images/y.png"
                alt="The Y Berlin"
                width={240}
                height={93}
                className="rounded-md w-full"
              />
              <div className="flex flex-col gap-2">
                <Heading level={4}>The Y Berlin</Heading>
                <p className="flex gap-2 text-xs uppercase">
                  <span className="bg-accent text-white rounded-full px-3 pb-0.5">
                    Residencies
                  </span>
                  <span className="bg-accent text-white rounded-full px-3 pb-0.5">
                    Experience design
                  </span>
                </p>
              </div>
              <p className="text-sm">
                The Y Berlin is the MOOS community design lab, where we invite
                social designers, impact generators, and tech developers to
                co-create phygital solutions for community challenges.
              </p>
            </Card>
          </div>
        </section>

        <section className=" w-full flex flex-col gap-6 justify-center max-w-3xl">
          <Card className="flex-col sm:flex-row justify-between">
            <div className="flex items-center justify-center flex-col">
              <Heading level={3} className="uppercase">
                Vybe 30
              </Heading>
              <p className="text-gray-600 text-sm">
                €{fundraisingConfig.creditPrice30Credits} per Vybe
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="text-accent flex items-center justify-center flex-col rounded-full w-[70px] h-[70px] shadow-[0_0_10px_rgba(107,82,244,0.7)]">
                <div className="font-bold text-xl h-[25px]">30</div>
                <div className="text-xs uppercase">Vybes</div>
              </div>

              <div className="h-full p-6 sm:border-r sm:border-l font-bold text-lg">
                €{fundraisingConfig.creditPrice30Credits * 30}
              </div>

              <div className="pl-2">
                <LinkButton
                  href="/credits/checkout?amount=30"
                  className="w-[200px] text-md sm:w-[150px]"
                >
                  Invest
                </LinkButton>
              </div>
            </div>
          </Card>
          <Card className="flex-col sm:flex-row justify-between">
            <div className="flex items-center justify-center flex-col">
              <Heading level={3} className="uppercase">
                Vybe 90
              </Heading>
              <p className="text-gray-600 text-sm">
                €{fundraisingConfig.creditPrice90Credits} per Vybe
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="text-accent flex items-center justify-center flex-col rounded-full w-[70px] h-[70px] shadow-[0_0_10px_rgba(107,82,244,0.7)]">
                <div className="font-bold text-xl h-[25px]">90</div>
                <div className="text-xs uppercase">Vybes</div>
              </div>

              <div className="h-full p-6 sm:border-r sm:border-l font-bold text-lg">
                €{fundraisingConfig.creditPrice90Credits * 90}
              </div>

              <div className="pl-2">
                <LinkButton
                  href="/credits/checkout?amount=90"
                  className="w-[200px] text-md sm:w-[150px]"
                >
                  Invest
                </LinkButton>
              </div>
            </div>
          </Card>
          <Card className="flex-col sm:flex-row justify-between">
            <div className="flex items-center justify-center flex-col">
              <Heading level={3} className="uppercase">
                Vybe 180
              </Heading>
              <p className="text-gray-600 text-sm">
                €{fundraisingConfig.creditPrice180Credits} per Vybe
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="text-accent flex items-center justify-center flex-col rounded-full w-[70px] h-[70px] shadow-[0_0_10px_rgba(107,82,244,0.7)]">
                <div className="font-bold text-xl h-[25px]">180</div>
                <div className="text-xs uppercase">Vybes</div>
              </div>

              <div className="h-full p-6 sm:border-r sm:border-l font-bold text-lg">
                €{fundraisingConfig.creditPrice180Credits * 180}
              </div>

              <div className="pl-2">
                <LinkButton
                  href="/credits/checkout?amount=180"
                  className="w-[200px] text-md sm:w-[150px]"
                >
                  Invest
                </LinkButton>
              </div>
            </div>
          </Card>
        </section>
        <section className=" w-full flex flex-col gap-6 justify-center max-w-xl">
          <Heading
            level={1}
            className="uppercase text-4xl text-center font-extrabold"
          >
            Vybes
          </Heading>

          <p>
            <Link
              className="text-accent font-bold no-underline"
              href="/settings/credits"
            >
              Vybes
            </Link>{' '}
            are the digital voucher system of The Y Berlin
          </p>

          <Card className="flex-row justify-between">
            <p className="font-bold">Your Vybes</p>
            <div className="font-bold text-accent">
              {isCreditsEnabled && (
                <CreditsBalance className="text-md" isDemo={false} />
              )}
            </div>
          </Card>
          <Heading level={3}>
            {APP_NAME && __('carrots_subheading_what', APP_NAME)}
          </Heading>

          <div>
            <p className="mb-4">{APP_NAME && __('carrots_what_1', APP_NAME)}</p>
            <p className="mb-4">{APP_NAME && __('carrots_what_2', APP_NAME)}</p>
            <p className="mb-4">
              {APP_NAME && __('carrots_what_2.5', APP_NAME)}
            </p>
            <p className="mb-4">{APP_NAME && __('carrots_what_3', APP_NAME)}</p>
            <p className="mb-4">{APP_NAME && __('carrots_what_4', APP_NAME)}</p>
          </div>
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
      fundraisingConfig: fundraisingConfig.value,
    };
  } catch (err) {
    return {
      fundraisingConfig: {},
      error: err,
    };
  }
};

export default SupportUsPage;