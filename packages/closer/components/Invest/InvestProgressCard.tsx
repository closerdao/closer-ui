import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

import {
  LinkedinShareButton,
  TelegramShareButton,
  TwitterShareButton,
  WhatsappShareButton,
} from 'react-share';

import {
  formatCompactCurrencyAmount,
  formatIsoFiatAmount,
} from '../../utils/currencyFormat';
import { getMilestoneGoal } from '../../utils/fundraising.helpers';
import { FundraisingMilestone } from '../../types';

interface InvestProgressCardProps {
  fundraisingTotal: number;
  isLoadingFunds: boolean;
  activeMilestone: FundraisingMilestone | null;
  totalGoal: number;
  backerCount?: number;
  tokenHolderCount?: number;
  daysLeft?: number;
  shareUrl: string;
  dataroomHref?: string;
  subscriptionHref?: string;
  donationHref?: string;
  twitterHandle?: string;
  t: (key: string) => string;
}

const InvestProgressCard = ({
  fundraisingTotal,
  isLoadingFunds,
  activeMilestone,
  totalGoal,
  backerCount,
  tokenHolderCount,
  daysLeft,
  shareUrl,
  dataroomHref,
  subscriptionHref,
  donationHref,
  twitterHandle,
  t,
}: InvestProgressCardProps) => {
  const router = useRouter();
  const goal = totalGoal || (activeMilestone ? getMilestoneGoal(activeMilestone) : 0);
  const progress = goal > 0 ? Math.min(100, (fundraisingTotal / goal) * 100) : 0;
  const [step, setStep] = useState<'idle' | 'choose' | 'donation'>('idle');
  const [donationAmount, setDonationAmount] = useState<number>(100);

  const donationPresets = [25, 50, 100, 250, 500, 1000];

  const formatAmount = (amount: number) => {
    return amount >= 1000
      ? formatCompactCurrencyAmount(amount, 'EUR')
      : formatIsoFiatAmount(amount, 'EUR');
  };

  const resetFlow = () => {
    setStep('idle');
    setDonationAmount(100);
  };

  const goTo = (href: string) => {
    resetFlow();
    router.push(href);
  };

  const handleParticipationSelect = (type: 'tokens' | 'donation' | 'subscription' | 'lender') => {
    if (type === 'tokens') {
      goTo('/token');
      return;
    }
    if (type === 'lender') {
      goTo(dataroomHref || '/dataroom');
      return;
    }
    if (type === 'subscription') {
      goTo(subscriptionHref || '/subscriptions');
      return;
    }
    setStep('donation');
  };

  const handleDonationCheckout = () => {
    goTo(`${donationHref || '/donate'}?amount=${donationAmount}`);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-md lg:sticky lg:top-24">
      {!isLoadingFunds && (
        <>
          <div className="text-4xl font-bold text-gray-900 leading-tight">
            {formatAmount(fundraisingTotal)}
          </div>
          <div className="text-sm text-gray-500 mb-4">
            {t('invest_progress_raised')} {t('invest_progress_goal')}: {formatAmount(goal)}
          </div>
          <div className="bg-gray-100 rounded-full h-2.5 overflow-hidden mb-3">
            <div
              className="h-full bg-accent rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="grid grid-cols-2 text-center mb-5">
            {daysLeft !== undefined && (
              <div className="py-3 border-r border-gray-100">
                <div className="text-xl font-bold text-gray-900">{daysLeft}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">
                  {t('invest_countdown_days_left')}
                </div>
              </div>
            )}
            {tokenHolderCount !== undefined && (
              <div className="py-3">
                <div className="text-xl font-bold text-gray-900">{tokenHolderCount}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">
                  {t('invest_stat_holders')}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {step === 'idle' && (
        <button
          type="button"
          onClick={() => setStep('choose')}
          className="block w-full py-3 bg-accent border-2 border-accent text-white text-center rounded-full font-semibold uppercase tracking-wide transition-all hover:bg-accent-dark hover:border-accent-dark"
        >
          {t('invest_cta_back_project')}
        </button>
      )}

      {step !== 'idle' && (
        <div className="mt-2 mb-3 pt-4 border-t border-gray-100 flex flex-col gap-3">
          {step === 'choose' && (
            <>
              <p className="text-sm font-semibold text-gray-900">
                {t('invest_cta_choose_contribution')}
              </p>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => handleParticipationSelect('tokens')}
                  className="w-full px-3 py-2.5 rounded-xl text-left border border-gray-200 bg-white hover:border-accent hover:text-accent transition-colors"
                >
                  {t('invest_cta_option_tokens')}
                </button>
                <button
                  type="button"
                  onClick={() => handleParticipationSelect('donation')}
                  className="w-full px-3 py-2.5 rounded-xl text-left border border-gray-200 bg-white hover:border-accent hover:text-accent transition-colors"
                >
                  {t('invest_cta_option_donation')}
                </button>
                <button
                  type="button"
                  onClick={() => handleParticipationSelect('subscription')}
                  className="w-full px-3 py-2.5 rounded-xl text-left border border-gray-200 bg-white hover:border-accent hover:text-accent transition-colors"
                >
                  {t('invest_cta_option_subscription')}
                </button>
                <button
                  type="button"
                  onClick={() => handleParticipationSelect('lender')}
                  className="w-full px-3 py-2.5 rounded-xl text-left border border-gray-200 bg-white hover:border-accent hover:text-accent transition-colors"
                >
                  {t('invest_cta_option_lender')}
                </button>
              </div>
            </>
          )}

          {step === 'donation' && (
            <>
              <p className="text-sm font-semibold text-gray-900">
                {t('invest_cta_donation_choose')}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {donationPresets.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setDonationAmount(amount)}
                    className={`w-full px-2 py-2 rounded-xl text-sm border transition-colors ${
                      donationAmount === amount
                        ? 'border-accent bg-accent text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-accent'
                    }`}
                  >
                    {formatIsoFiatAmount(amount, 'EUR')}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleDonationCheckout}
                className="w-full py-3 bg-accent border-2 border-accent text-white text-center rounded-full font-semibold uppercase tracking-wide transition-all hover:bg-accent-dark hover:border-accent-dark"
              >
                {t('invest_cta_continue')}
              </button>
            </>
          )}

          <button
            type="button"
            onClick={resetFlow}
            className="w-full py-2 text-xs text-gray-500 hover:text-gray-700 uppercase tracking-wide"
          >
            {t('buttons_cancel')}
          </button>
        </div>
      )}

      {step === 'idle' && dataroomHref && (
        <Link
          href={dataroomHref}
          className="block w-full py-3 mt-2.5 text-center text-accent border-2 border-accent rounded-full font-semibold uppercase tracking-wide transition-colors hover:bg-accent hover:text-white"
        >
          {t('invest_cta_dataroom')}
        </Link>
      )}

      {shareUrl && (
        <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-gray-100">
          <span className="text-xs text-gray-500">{t('invest_share_title')}</span>
          <TwitterShareButton
            title={t('invest_share_text')}
            url={shareUrl}
            related={twitterHandle ? [twitterHandle] : []}
          >
            <div className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors text-xs text-gray-600">
              X
            </div>
          </TwitterShareButton>
          <LinkedinShareButton title={t('invest_share_text')} url={shareUrl}>
            <div className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors text-xs text-gray-600">
              in
            </div>
          </LinkedinShareButton>
          <WhatsappShareButton title={t('invest_share_text')} url={shareUrl}>
            <div className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors text-xs text-gray-600">
              wa
            </div>
          </WhatsappShareButton>
          <TelegramShareButton title={t('invest_share_text')} url={shareUrl}>
            <div className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors text-xs text-gray-600">
              tg
            </div>
          </TelegramShareButton>
        </div>
      )}
    </div>
  );
};

export default InvestProgressCard;
