import Link from 'next/link';

import { useEffect, useMemo, useState } from 'react';

import { CheckCircle2, PartyPopper } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useAuth } from '../contexts/auth';
import { FundraisingConfig } from '../types/api';
import {
  computeMilestoneStates,
  fetchFundraisingBreakdown,
  findActiveMilestone,
  getMilestoneEnd,
  getMilestoneGoal,
  sortMilestonesByStartDate,
} from '../utils/fundraising.helpers';

interface FundraisingWidgetProps {
  variant?: 'nav' | 'hero';
  className?: string;
  fundraisingConfig?: FundraisingConfig;
}

const DEFAULT_END_DATE = '2026-05-31T23:59:59.999Z';

const FundraisingWidget = ({
  variant = 'nav',
  className = '',
  fundraisingConfig,
}: FundraisingWidgetProps) => {
  const t = useTranslations();
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('admin');
  const [totalRaised, setTotalRaised] = useState(0);
  const [cryptoTotal, setCryptoTotal] = useState(0);
  const [fiatTotal, setFiatTotal] = useState(0);
  const [activeRaised, setActiveRaised] = useState(0);
  const [goalAmount, setGoalAmount] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [daysLeft, setDaysLeft] = useState(0);

  const sortedMilestones = useMemo(
    () => sortMilestonesByStartDate(fundraisingConfig?.milestones ?? []),
    [fundraisingConfig?.milestones],
  );
  const activeMilestone = useMemo(
    () => findActiveMilestone(fundraisingConfig?.milestones),
    [fundraisingConfig?.milestones],
  );

  useEffect(() => {
    const endRaw = activeMilestone
      ? getMilestoneEnd(activeMilestone)
      : null;
    const endDate = endRaw ? new Date(endRaw) : new Date(DEFAULT_END_DATE);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setDaysLeft(Math.max(0, diffDays));
  }, [activeMilestone]);

  useEffect(() => {
    const load = async () => {
      try {
        const breakdown = await fetchFundraisingBreakdown(fundraisingConfig);
        setTotalRaised(breakdown.totalRaised);
        setCryptoTotal(breakdown.cryptoTotal);
        setFiatTotal(breakdown.fiatTotal);
        const states = computeMilestoneStates(
          sortedMilestones,
          breakdown.totalRaised,
        );
        const goal = activeMilestone
          ? getMilestoneGoal(activeMilestone)
          : 0;
        const state = activeMilestone
          ? states[activeMilestone.id]
          : null;
        setGoalAmount(goal);
        setActiveRaised(state?.raised ?? 0);
        setProgressPercent(state?.progress ?? 0);
      } catch (error) {
        console.error('Error fetching fundraising breakdown:', error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [fundraisingConfig, sortedMilestones, activeMilestone]);

  const displayRaised = activeMilestone ? activeRaised : totalRaised;
  const displayGoal = activeMilestone ? goalAmount : 0;

  const formatAmount = (amount: number) => {
    if (amount >= 1000) {
      return `€${Math.round(amount / 1000)}K`;
    }
    return `€${amount.toLocaleString()}`;
  };

  const milestoneName =
    activeMilestone?.title ??
    activeMilestone?.name ??
    t('invest_progress_milestone_default');
  const isGoalReached = !isLoading && displayRaised >= displayGoal;

  if (variant === 'hero') {
    if (isGoalReached) {
      return (
        <div className={`bg-gradient-to-br from-accent/5 to-accent/10 rounded-xl border-2 border-accent p-6 shadow-sm relative overflow-hidden ${className}`}>
          <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 opacity-10">
            <PartyPopper className="w-full h-full text-accent" />
          </div>
          
          <p className="text-xs text-accent mb-2 font-medium uppercase tracking-wide">{milestoneName}</p>
          
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-accent" />
            <span className="text-sm font-semibold text-gray-900">
              {t('invest_milestone_reached')}
            </span>
          </div>
          
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-bold text-accent">
              {formatAmount(displayRaised)} {t('invest_progress_raised')}
            </span>
            <span className="text-sm font-medium text-gray-500 line-through opacity-70">
              {formatAmount(displayGoal)} {t('invest_progress_goal')}
            </span>
          </div>
          
          <div className="w-full rounded-full bg-accent/20 overflow-hidden h-3 mb-3">
            <div className="bg-accent h-full rounded-full w-full animate-pulse" />
          </div>
          
          <p className="text-xs text-gray-700 font-medium text-center">
            {t('invest_milestone_thank_you')}
          </p>

          {isAdmin && (
            <div className="mt-4 p-3 bg-accent/10 rounded-lg text-xs font-mono">
              <div className="grid grid-cols-2 gap-1 text-gray-700">
                <span>Crypto Token Sales:</span>
                <span className="text-right">€{cryptoTotal.toLocaleString()}</span>
                <span>Fiat Token Sales:</span>
                <span className="text-right">€{fiatTotal.toLocaleString()}</span>
                <span className="font-bold border-t border-accent/30 pt-1">Total:</span>
                <span className="text-right font-bold border-t border-accent/30 pt-1">€{totalRaised.toLocaleString()}</span>
                <span>Target:</span>
                <span className="text-right">€{displayGoal.toLocaleString()}</span>
                <span>Progress:</span>
                <span className="text-right">{progressPercent.toFixed(2)}%</span>
              </div>
              <p className="mt-2 text-accent">Milestone ID: {activeMilestone?.id || 'none'}</p>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-6 shadow-sm ${className}`}>
        <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">{milestoneName}</p>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-600 font-medium">
            {isLoading ? '...' : formatAmount(displayRaised)}{' '}
            {t('invest_progress_raised')}
          </span>
          <span className="text-sm font-semibold text-gray-900">
            {formatAmount(displayGoal)} {t('invest_progress_goal')}
          </span>
        </div>
        <div className="w-full rounded-full bg-gray-200 overflow-hidden h-3 mb-3">
          <div
            className="bg-accent h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{t('invest_progress_deadline')}</p>
          <p className="text-lg font-bold text-accent">
            {daysLeft} {t('invest_countdown_days_left')}
          </p>
        </div>

        {isAdmin && false && (
          <div className="mt-4 p-3 bg-gray-100 rounded-lg text-xs font-mono">
            <div className="grid grid-cols-2 gap-1 text-gray-600">
              <span>Crypto Token Sales:</span>
              <span className="text-right">€{cryptoTotal.toLocaleString()}</span>
              <span>Fiat Token Sales:</span>
              <span className="text-right">€{fiatTotal.toLocaleString()}</span>
              <span className="font-bold border-t border-gray-300 pt-1">Total:</span>
              <span className="text-right font-bold border-t border-gray-300 pt-1">€{totalRaised.toLocaleString()}</span>
              <span>Target:</span>
              <span className="text-right">€{displayGoal.toLocaleString()}</span>
              <span>Progress:</span>
              <span className="text-right">{progressPercent.toFixed(2)}%</span>
            </div>
            <p className="mt-2 text-gray-500">Milestone ID: {activeMilestone?.id || 'none'}</p>
          </div>
        )}
      </div>
    );
  }

  if (isGoalReached) {
    return (
      <Link
        href="/invest"
        className={`hidden sm:flex items-center min-w-0 max-w-full px-2 py-1.5 bg-accent/20 hover:bg-accent/30 rounded-lg transition-colors ${className}`}
      >
        <span className="text-xs font-medium text-accent truncate">
          {t('invest_goal_reached_short')}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href="/invest"
      className={`hidden sm:flex items-center min-w-0 max-w-full gap-2 px-2 py-1.5 bg-accent/10 hover:bg-accent/20 rounded-lg transition-colors ${className}`}
    >
      <div className="flex flex-col items-start">
        <span className="text-[10px] text-gray-500 font-medium">
          {t('invest_nav_progress_label', { percent: Math.round(progressPercent) })}
        </span>
        <div className="w-24 h-1.5 rounded-full bg-gray-200 overflow-hidden mt-0.5">
          <div
            className="bg-accent h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>
      <div className="text-[10px] text-gray-500 font-medium whitespace-nowrap">
        {daysLeft}d
      </div>
    </Link>
  );
};

export default FundraisingWidget;
