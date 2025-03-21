import Head from 'next/head';

import { useState } from 'react';

import { Heading } from 'closer/components/ui';

import { PageNotFound } from 'closer';
import { FundraisingConfig } from 'closer/types';
import api from 'closer/utils/api';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

const VYBE_PACKAGES = [84, 500, 2000];

interface Props {
  fundraisingConfig: FundraisingConfig;
}

const SupportUsPage = ({ fundraisingConfig }: Props) => {
  const t = useTranslations();
  const isCreditsEnabled = process.env.NEXT_PUBLIC_FEATURE_CARROTS === 'true';

  const isFundraiserEnabled =
    process.env.NEXT_PUBLIC_FEATURE_SUPPORT_US === 'true' &&
    fundraisingConfig?.enabled;

  const [creditsAmount, setCreditsAmount] = useState<number | string>(1);

  const isValidAmount = typeof creditsAmount === 'number' && creditsAmount > 0;

  const getTotal = (amount: number | string) => {
    const numericAmount = parseInt(amount as unknown as string);
    if (!fundraisingConfig) {
      return 0;
    }

    if (numericAmount < 90) {
      return numericAmount * fundraisingConfig.creditPrice30Credits;
    }
    if (numericAmount >= 90 && numericAmount < 180) {
      return numericAmount * fundraisingConfig.creditPrice90Credits;
    }
    if (numericAmount >= 180) {
      return numericAmount * fundraisingConfig.creditPrice180Credits;
    }
    return 0;
  };

  if (!isFundraiserEnabled) {
    return <PageNotFound />;
  }

  return (
    <>
      <Head>
        <title>Join the Vybes</title>
        <meta name="description" content="" />
        <meta property="og:type" content="event" />
      </Head>

      <div className="w-full flex items-center flex-col gap-20 mt-6">
        <section className="w-full flex flex-col gap-10 max-w-3xl min-h-[300px]">
          <Heading level={1} className="uppercase text-4xl  font-extrabold ">
            Support MOOS
          </Heading>
          <div className="flex flex-col gap-4">
            {' '}
            <p className="flex-1 text-lg font-bold">
              We are starting a MOOS DAO collective. You can purchase tokens
              (giving voting power){' '}
              <a href="https://juicebox.money/v2/p/750?tablet=about">here</a> or
              contribute to the GoFundMe{' '}
              <a href="https://www.gofundme.com/f/save-moos">here</a>
            </p>
          </div>
        </section>
        {/* <section className=" w-full flex flex-col sm:flex-row gap-10 justify-center max-w-3xl">
          <div className="flex flex-col gap-4">
            <Heading level={1} className="uppercase text-4xl  font-extrabold">
            <p>
              <strong>The Y Berlin</strong> is fundraising to support
              cutting-edge residencies and next-level events at MOOS.
            </p>
            <p>
              With the packages below you can join the Y and receive{' '}
              <Link
                className="text-accent font-bold no-underline"
                href="/settings/credits"
              >
                Vybes
              </Link>{' '}
              that can be exchanged for many of the resources at MOOS. This
              includes accommodation, event space, catering, and{' '}
              <Link
                className="text-accent font-bold no-underline"
                href="/pdf/moos-menu.pdf"
              >
                more.
              </Link>{' '}
              We are currently offering the first 25,000 Vybes at a discounted
              price of €4 per Vybe (worth €5).
            </p>
            <p>
              Stay or host at MOOS with unique flexibility. Secure your spot now
              - choose your vybe later.
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
                Vybe {VYBE_PACKAGES[0]}
              </Heading>
              <p className="text-gray-600 text-sm">
                €{fundraisingConfig.creditPrice30Credits} per Vybe
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="text-accent flex items-center justify-center flex-col rounded-full w-[70px] h-[70px] shadow-[0_0_10px_rgba(107,82,244,0.7)]">
                <div className="font-bold text-xl h-[25px]">
                  {VYBE_PACKAGES[0]}
                </div>
                <div className="text-xs uppercase">Vybes</div>
              </div>

              <div className="h-full p-6 sm:border-r sm:border-l font-bold text-lg">
                €{fundraisingConfig.creditPrice30Credits * VYBE_PACKAGES[0]}
              </div>

              <div className="pl-2">
                <LinkButton
                  href={`/credits/checkout?amount=${VYBE_PACKAGES[0]}`}
                  className="w-[200px] text-md sm:w-[150px]"
                >
                  Join
                </LinkButton>
              </div>
            </div>
          </Card>
          <Card className="flex-col sm:flex-row justify-between">
            <div className="flex items-center justify-center flex-col">
              <Heading level={3} className="uppercase">
                Vybe {VYBE_PACKAGES[1]}
              </Heading>
              <p className="text-gray-600 text-sm">
                €{fundraisingConfig.creditPrice90Credits} per Vybe
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="text-accent flex items-center justify-center flex-col rounded-full w-[70px] h-[70px] shadow-[0_0_10px_rgba(107,82,244,0.7)]">
                <div className="font-bold text-xl h-[25px]">
                  {VYBE_PACKAGES[1]}
                </div>
                <div className="text-xs uppercase">Vybes</div>
              </div>

              <div className="h-full p-6 sm:border-r sm:border-l font-bold text-lg">
                €{fundraisingConfig.creditPrice90Credits * VYBE_PACKAGES[1]}
              </div>

              <div className="pl-2">
                <LinkButton
                  href={`/credits/checkout?amount=${VYBE_PACKAGES[1]}`}
                  className="w-[200px] text-md sm:w-[150px]"
                >
                  Join
                </LinkButton>
              </div>
            </div>
          </Card>
          <Card className="flex-col sm:flex-row justify-between">
            <div className="flex items-center justify-center flex-col">
              <Heading level={3} className="uppercase">
                Vybe {VYBE_PACKAGES[2]}
              </Heading>
              <p className="text-gray-600 text-sm">
                €{fundraisingConfig.creditPrice180Credits} per Vybe
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="text-accent flex items-center justify-center flex-col rounded-full w-[70px] h-[70px] shadow-[0_0_10px_rgba(107,82,244,0.7)]">
                <div className="font-bold text-xl h-[25px]">
                  {VYBE_PACKAGES[2]}
                </div>
                <div className="text-xs uppercase">Vybes</div>
              </div>

              <div className="h-full p-6 sm:border-r sm:border-l font-bold text-lg">
                €{fundraisingConfig.creditPrice180Credits * VYBE_PACKAGES[2]}
              </div>

              <div className="pl-2">
                <LinkButton
                  href={`/credits/checkout?amount=${VYBE_PACKAGES[2]}`}
                  className="w-[200px] text-md sm:w-[150px]"
                >
                  Join
                </LinkButton>
              </div>
            </div>
          </Card>

          <Card className="flex-col sm:flex-row justify-between">
            <div className="flex items-start justify-center flex-col">
              <Heading level={3} className="uppercase">
                Vybe flex — 1/∞ vybes
              </Heading>
              <p className="text-gray-600 text-sm">
                {fundraisingConfig.creditPrice180Credits !==
                fundraisingConfig.creditPrice30Credits ? (
                  <>
                    {' '}
                    €{fundraisingConfig.creditPrice180Credits}- €
                    {fundraisingConfig.creditPrice30Credits}
                  </>
                ) : (
                  <> €{fundraisingConfig.creditPrice180Credits}</>
                )}{' '}
                per Vybe
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="h-full p-6 sm:border-r sm:border-l font-bold text-lg flex items-center  whitespace-nowrap gap-2">
                <div>Enter amount:</div>{' '}
                <input
                  value={creditsAmount}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setCreditsAmount('');
                    } else if (
                      typeof Number(value) === 'number' &&
                      Number(value) < 0
                    ) {
                      setCreditsAmount(1);
                    } else if (Number(value) === 0) {
                      setCreditsAmount(1);
                    } else {
                      const numericValue = parseInt(value);
                      if (!isNaN(numericValue)) {
                        setCreditsAmount(numericValue);
                      }
                    }
                  }}
                  type="number"
                  className="w-[60px] bg-neutral rounded-lg"
                />
                <div>= {priceFormat(getTotal(creditsAmount))}</div>
              </div>

              <div className="pl-2">
                <LinkButton
                  href={`${
                    isValidAmount
                      ? `/credits/checkout?amount=${creditsAmount}`
                      : '#'
                  }`}
                  className={`${
                    isValidAmount
                      ? ''
                      : 'bg-neutral border-neutral text-gray-400'
                  } w-[200px] text-md sm:w-[150px]`}
                >
                  Join
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
            Vybes are the digital voucher system of The Y Berlin - more info{' '}
            <Link
              className="text-accent font-bold no-underline"
              href="/settings/credits"
            >
              here.
            </Link>{' '}
          </p>

          <Card className="flex-row justify-between">
            <p className="font-bold">Your Vybes</p>
            <div className="font-bold text-accent">
              {isCreditsEnabled && (
                <CreditsBalance className="text-md" isDemo={false} />
              )}
            </div>
          </Card>
          <Heading level={3}>{t('carrots_subheading_what')}</Heading>

          <div>
            <p className="mb-4">{t('carrots_what_1')}</p>
            <p className="mb-4">{t('carrots_what_2')}</p>
            <p className="mb-4">{t('carrots_what_2_5')}</p>
            <p className="mb-4">{t('carrots_what_3')}</p>
            <p className="mb-4">{t('carrots_what_4')}</p>
          </div>
        </section> */}
      </div>
    </>
  );
};

SupportUsPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const [fundraisingConfigResponse, messages] = await Promise.all([
      api.get('/config/fundraiser').catch(() => null),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const fundraisingConfig = fundraisingConfigResponse?.data.results.value;

    return {
      fundraisingConfig,
      messages,
    };
  } catch (err) {
    return {
      fundraisingConfig: {},
      error: err,
      messages: null,
    };
  }
};

export default SupportUsPage;
