import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

import { useEffect, useState } from 'react';

import { Card, Heading, Row } from '../../components/ui';
import Progress from '../../components/ui/ProgressBar/Progress';

import dayjs from 'dayjs';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import api, { formatSearch } from '../../utils/api';
import { getNextMonthName } from '../../utils/helpers';
import { loadLocaleData } from '../../utils/locale.helpers';
import PageNotFound from '../not-found';

const today = new Date();
const firstDayOfCurrentMonth = dayjs(
  new Date(today.getFullYear(), today.getMonth(), 1),
).format('YYYY-MM-DD');
const lastDayOfCurrentMonth = dayjs(
  new Date(today.getFullYear(), today.getMonth() + 1, 0),
).format('YYYY-MM-DD');

const ReferralsPage = () => {
  const t = useTranslations();
  const { APP_NAME } = useConfig();
  const config = useConfig();
  const { SEMANTIC_URL } = config || {};
  const { isAuthenticated, user } = useAuth();

  const referralLink = `${SEMANTIC_URL}/signup/?referral=${user?._id}`;

  const [copied, setCopied] = useState(false);
  const [usersReferredByMe, setUsersReferredByMe] = useState();
  const [creditsEarnedFromReferrals, setCreditsEarnedFromReferrals] =
    useState();
  const [creditsErnedThisMonth, setCreditsErnedThisMonth] = useState();

  useEffect(() => {
    if (user) {
      (async () => {
        const res = await Promise.all([
          api.get('/count/user', {
            params: {
              where: formatSearch({ referredBy: user._id }),
            },
          }),
          api.get('/stay', {
            params: {
              where: formatSearch({
                userId: user._id,
                source: 'referral',
              }),
            },
          }),
          api.get('/stay', {
            params: {
              where: formatSearch({
                userId: user._id,
                source: 'referral',
                created: {
                  $gte: firstDayOfCurrentMonth,
                  $lte: lastDayOfCurrentMonth,
                },
              }),
            },
          }),
        ]);

        const creditsEarned = res[1].data.results.reduce(
          (acc: number, curr: { amount: number }) => {
            return acc + curr.amount;
          },
          0,
        );
        const creditsThisMonth = res[2].data.results.reduce(
          (acc: number, curr: { amount: number }) => {
            return acc + curr.amount;
          },
          0,
        );

        setUsersReferredByMe(res[0].data.results);
        setCreditsEarnedFromReferrals(creditsEarned);
        setCreditsErnedThisMonth(creditsThisMonth);
      })();
    }
  }, [user]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink).then(
      () => {
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      },
      (err) => {
        console.log('failed to copy', err.mesage);
      },
    );
  };

  if (!isAuthenticated || !user) {
    return <PageNotFound error="Please log in to see this page." />;
  }

  return (
    <>
      <Head>
        <title>{t('referrals_heading')}</title>
      </Head>
      <div className="max-w-screen-sm mx-auto md:p-8 h-full main-content w-full flex flex-col gap-14  min-h-screen py-2">
        <div className="bg-accent-light rounded-md p-6 flex flex-wrap content-center justify-center">
          <Heading level={1} className="flex justify-center flex-wrap">
            <div className="text-6xl w-full flex justify-center">🤙🏽</div>
            {t('referrals_heading')}
          </Heading>
          <Heading
            level={2}
            className="p-4 text-xl text-center font-normal w-full"
          >
            {APP_NAME && t('referrals_subheading')}
          </Heading>
        </div>

        {APP_NAME && APP_NAME !== 'moos' && ( 
          <>
            <Heading level={3} hasBorder={true}>
              {t('referrals_description_heading')}
            </Heading>
            <div>
              <p className="mb-4">
                { t('referrals_description_text_1', )}
              </p>
              <p className="mb-4">
                {  t('referrals_description_text_2', )}
              </p>
              <p className="mb-4">
                {  t('referrals_description_text_3', )}
              </p>
              <p className="mb-4 text-accent font-bold">
                <Link href="/settings/credits">
                  {  t('referrals_credits_link', )}
                </Link>
              </p>
            </div>
          </>
        )}

        {APP_NAME && APP_NAME === 'moos' && (
          <div>
            <section>
              <p className="mb-4">
                To see what&apos;s possible when we activate our community, we
                are opening our doors to new organizations to come and make
                magic at MOOS. Know any teams or DAOs looking for a summer
                gathering spot in central Berlin? Now is the moment to let them
                know about MOOS.
              </p>
              <Heading level={3} hasBorder={true}>
                How It Works:
              </Heading>
              <ol className="list-decimal pl-8 pb-8 md:pb-0">
                <li>
                  <b>Share Your Link:</b> Use your personalized referral link
                  below to invite teams and DAOs to MOOS.
                </li>
                <li>
                  <b>Automatic Association:</b> If your referral creates an
                  account using your link, any Vybes they purchase will be
                  automatically associated with your account.
                </li>
                <li>
                  <b>Earn Rewards:</b> For every 10 Vybes your referrals buy,
                  you earn 1 Vybe. It&apos;s as simple as that - a 10%
                  commission.
                </li>
              </ol>
            </section>
            <section>
              <Heading level={3} hasBorder={true}>
                The Rewards:
              </Heading>
              <ul className="mb-4 list-disc pl-5">
                <li>
                  Example: If a friend buys 500 Vybes, you get 50 Vybes (worth
                  250 Euros) as a reward. If a friend buys 1,000 Vybes, you get
                  100 Vybes (worth 500 Euros) as a reward.
                </li>
                <li>
                  Earn Vybes: Use your Vybes to book stays, attend events, or
                  rent spaces. Each Vybe is worth 5 Euros.
                </li>
                <li>
                  Vybes are valid for three years from the date of acquisition.
                </li>
              </ul>
            </section>

            <section>
              <Heading level={3} hasBorder={true}>
                Additional Referral Offer:
              </Heading>
              <p>
                Simply by creating an account using your referral link, both you
                and the account creator get a free Vybe, which can be used for
                play/stay at MOOS.
              </p>
            </section>

            <section>
              <Heading level={3} hasBorder={true}>
                Why Act Now:
              </Heading>
              <ul className="mb-4 list-disc pl-5">
                <li>
                  Vybe Launch Offer: For the first 100,000 Euros in Vybe
                  purchases (20,000 Vybes), Ambassadors (you) earn 1 Vybe for
                  every 10 Vybes purchased. This is a launch offer; we
                  don&apos;t plan on providing a commission like this in the
                  future.
                </li>
                <li>
                  Support Innovation: Your referrals help support The Y Berlin
                  and MOOS in leading community-driven solutions. Your support
                  is crucial for our upcoming community tech lab.
                </li>
              </ul>
            </section>
          </div>
        )}

        <Heading level={3} hasBorder={true}>
          {APP_NAME && t('referrals_your_link_heading')}
        </Heading>

        <Card className="bg-accent-light mb-10">
          <div className="flex justify-between ">
            <div className="w-2/3 sm:w-4/5 break-words select-all">
              {referralLink}
            </div>
            <div className="w-1/5">
              {copied ? t('referrals_link_copied') : ''}
            </div>

            <button onClick={copyToClipboard}>
              <Image
                src="/images/icon-copy.svg"
                alt="Copy"
                width={26}
                height={26}
              />
            </button>
          </div>
        </Card>
        <Heading level={3} hasBorder={true}>
          {t('referrals_monthly_progress_heading')}
        </Heading>
        <Progress
          icon={APP_NAME && t('carrots_balance')}
          progress={creditsErnedThisMonth ?? 0}
          total={6}
        />
        <Row
          rowKey={t('referrals_next_refresh')}
          value={`${getNextMonthName()} 1`}
        />

        <Heading level={3} hasBorder={true}>
          {t('referrals_all_time_progress_heading')}
        </Heading>
        <Row
          rowKey={t('referrals_successfull_referrals')}
          value={usersReferredByMe}
        />
        <Row
          rowKey={t('referrals_earned')}
          value={`${APP_NAME && t('carrots_balance')} ${
            creditsEarnedFromReferrals === undefined
              ? ''
              : creditsEarnedFromReferrals
          }`}
        />
      </div>
    </>
  );
};

ReferralsPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const messages = await loadLocaleData(
      context?.locale,
      process.env.NEXT_PUBLIC_APP_NAME,
    );
    return {
      messages,
    };
  } catch (err: unknown) {
    return {
      messages: null,
    };
  }
};

export default ReferralsPage;
