import Link from 'next/link';

import {
  LinkedinShareButton,
  TelegramShareButton,
  TwitterShareButton,
  WhatsappShareButton,
} from 'react-share';

import { getCurrencySymbol } from '../../utils/currencyFormat';
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
  twitterHandle,
  t,
}: InvestProgressCardProps) => {
  const eur = getCurrencySymbol('EUR');
  const goal = totalGoal || (activeMilestone ? getMilestoneGoal(activeMilestone) : 0);
  const progress = goal > 0 ? Math.min(100, (fundraisingTotal / goal) * 100) : 0;

  const formatAmount = (amount: number) => {
    if (amount >= 1000) return `${eur}${Math.round(amount / 1000).toLocaleString()}K`;
    return `${eur}${amount.toLocaleString()}`;
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

      <Link
        href="/token/checkout?tokens=1"
        className="block w-full py-3 bg-accent border-2 border-accent text-white text-center rounded-full font-semibold uppercase tracking-wide transition-all hover:bg-accent-dark hover:border-accent-dark"
      >
        {t('invest_cta_back_project')}
      </Link>

      {dataroomHref && (
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
