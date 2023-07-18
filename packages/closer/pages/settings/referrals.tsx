import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

import { useEffect, useState } from 'react';

import { Card, Heading, Row } from '../../components/ui';
import Progress from '../../components/ui/ProgressBar/Progress';

import dayjs from 'dayjs';

import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import api, { formatSearch } from '../../utils/api';
import { __, getNextMonthName } from '../../utils/helpers';

const today = new Date();
const firstDayOfCurrentMonth = dayjs(
  new Date(today.getFullYear(), today.getMonth(), 1),
).format('YYYY-MM-DD');
const lastDayOfCurrentMonth = dayjs(
  new Date(today.getFullYear(), today.getMonth() + 1, 0),
).format('YYYY-MM-DD');

const ReferralsPage = () => {
  const config = useConfig();
  const { SEMANTIC_URL } = config || {};
  const { user } = useAuth();

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
  return (
    <>
      <Head>
        <title>{__('referrals_heading')}</title>
      </Head>
      <div className="max-w-screen-sm mx-auto md:p-8 h-full main-content w-full flex flex-col gap-14  min-h-screen py-2">
        <div className="bg-accent-light rounded-md p-6 flex flex-wrap content-center justify-center">
          <Heading level={1} className="flex justify-center flex-wrap">
            <div className="text-6xl w-full flex justify-center">🤙🏽</div>
            {__('referrals_heading')}
          </Heading>
          <Heading
            level={2}
            className="p-4 text-xl text-center font-normal w-full"
          >
            {__('referrals_subheading')}
          </Heading>
        </div>

        <Heading level={3} hasBorder={true}>
          {__('referrals_description_heading')}
        </Heading>
        <div>
          <p className="mb-4">{__('referrals_description_text_1')}</p>
          <p className="mb-4">{__('referrals_description_text_2')}</p>
          <p className="mb-4">{__('referrals_description_text_3')}</p>
          <p className="mb-4 text-accent font-bold">
            <Link href="/settings/credits">{__('referrals_credits_link')}</Link>
          </p>
        </div>
        <Heading level={3} hasBorder={true}>
          {__('referrals_your_link_heading')}
        </Heading>

        <Card className="bg-accent-light mb-10">
          <div className="flex justify-between ">
            <div className="w-2/3 sm:w-4/5 break-words select-all">
              {referralLink}
            </div>
            <div className="w-1/5">
              {copied ? __('referrals_link_copied') : ''}
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
          {__('referrals_monthly_progress_heading')}
        </Heading>
        <Progress icon="🥕" progress={creditsErnedThisMonth ?? 0} total={6} />
        <Row
          rowKey={__('referrals_next_refresh')}
          value={`${getNextMonthName()} 1`}
        />

        <Heading level={3} hasBorder={true}>
          {__('referrals_all_time_progress_heading')}
        </Heading>
        <Row
          rowKey={__('referrals_successfull_referrals')}
          value={usersReferredByMe}
        />
        <Row
          rowKey={__('referrals_earned')}
          value={`🥕 ${
            creditsEarnedFromReferrals === undefined
              ? ''
              : creditsEarnedFromReferrals
          }`}
        />
      </div>
    </>
  );
};

export default ReferralsPage;
