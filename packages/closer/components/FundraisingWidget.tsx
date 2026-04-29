import Link from 'next/link';

import { useEffect, useMemo, useState } from 'react';

import { CheckCircle2, PartyPopper } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useAuth } from '../contexts/auth';
import { FundraisingConfig } from '../types/api';
import { formatIsoFiatAmount } from '../utils/currencyFormat';
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
  const [showSparkle, setShowSparkle] = useState(false);
  const [showBubble, setShowBubble] = useState(false);

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

  useEffect(() => {
    const show = setTimeout(() => setShowSparkle(true), 5000);
    const hide = setTimeout(() => setShowSparkle(false), 11500);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowBubble(true), 2000);
    const dismiss = () => setShowBubble(false);
    window.addEventListener('scroll', dismiss, { once: true, passive: true });
    window.addEventListener('touchstart', dismiss, { once: true });
    window.addEventListener('click', dismiss, { once: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', dismiss);
      window.removeEventListener('touchstart', dismiss);
      window.removeEventListener('click', dismiss);
    };
  }, []);

  const displayRaised = activeMilestone ? activeRaised : totalRaised;
  const displayGoal = activeMilestone ? goalAmount : 0;

  const totalGoal = useMemo(
    () => sortedMilestones.reduce((sum, m) => sum + getMilestoneGoal(m), 0),
    [sortedMilestones],
  );
  const totalProgress =
    totalGoal > 0 ? Math.min(100, (totalRaised / totalGoal) * 100) : 0;

  const formatAmount = (amount: number) => {
    return formatIsoFiatAmount(Math.round(amount), 'EUR');
  };

  const milestoneName =
    activeMilestone?.title ??
    activeMilestone?.name ??
    t('invest_progress_milestone_default');
  const isGoalReached = !isLoading && displayGoal > 0 && displayRaised >= displayGoal;

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
                <span className="text-right">{formatAmount(cryptoTotal)}</span>
                <span>Fiat Token Sales:</span>
                <span className="text-right">{formatAmount(fiatTotal)}</span>
                <span className="font-bold border-t border-accent/30 pt-1">Total:</span>
                <span className="text-right font-bold border-t border-accent/30 pt-1">{formatAmount(totalRaised)}</span>
                <span>Target:</span>
                <span className="text-right">{formatAmount(displayGoal)}</span>
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-4">
          <p className="text-sm text-gray-500">{t('invest_progress_deadline')}</p>
          <p className="text-lg font-bold text-accent">
            {daysLeft} {t('invest_countdown_days_left')}
          </p>
        </div>

        {isAdmin && false && (
          <div className="mt-4 p-3 bg-gray-100 rounded-lg text-xs font-mono">
            <div className="grid grid-cols-2 gap-1 text-gray-600">
              <span>Crypto Token Sales:</span>
              <span className="text-right">{formatAmount(cryptoTotal)}</span>
              <span>Fiat Token Sales:</span>
              <span className="text-right">{formatAmount(fiatTotal)}</span>
              <span className="font-bold border-t border-gray-300 pt-1">Total:</span>
              <span className="text-right font-bold border-t border-gray-300 pt-1">{formatAmount(totalRaised)}</span>
              <span>Target:</span>
              <span className="text-right">{formatAmount(displayGoal)}</span>
              <span>Progress:</span>
              <span className="text-right">{progressPercent.toFixed(2)}%</span>
            </div>
            <p className="mt-2 text-gray-500">Milestone ID: {activeMilestone?.id || 'none'}</p>
          </div>
        )}
      </div>
    );
  }

  const circumference = 2 * Math.PI * 11;
  const navPercent = totalProgress;
  const strokeOffset = circumference - (circumference * Math.min(navPercent, 100)) / 100;

  const ProgressRing = () => (
    <svg width="28" height="28" viewBox="0 0 28 28" className="-rotate-90">
      <circle
        cx="14"
        cy="14"
        r="11"
        fill="none"
        strokeWidth="3"
        className="stroke-gray-300"
      />
      <circle
        cx="14"
        cy="14"
        r="11"
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        className="stroke-accent transition-all duration-500"
        strokeDasharray={circumference}
        strokeDashoffset={strokeOffset}
      />
    </svg>
  );

  const Sparkles = () => {
    if (!showSparkle) return null;
    return (
      <span className="absolute inset-0 pointer-events-none" aria-hidden>
        <span
          className="absolute animate-sparkle-float text-[10px] left-1/2 top-0"
          style={{ animationDelay: '0s' }}
        >
          ✦
        </span>
        <span
          className="absolute animate-sparkle-float text-[8px] left-[20%] top-[10%] text-accent"
          style={{ animationDelay: '0.6s' }}
        >
          ✧
        </span>
        <span
          className="absolute animate-sparkle-float text-[9px] left-[75%] top-[5%] text-accent"
          style={{ animationDelay: '1.1s' }}
        >
          ✦
        </span>
      </span>
    );
  };

  const InfoBubble = () => {
    if (!showBubble) return null;
    return (
      <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 pointer-events-none z-50 animate-fade-in">
        <span className="relative block bg-gray-900 text-white text-[10px] font-medium whitespace-nowrap rounded-md px-2.5 py-1.5 shadow-lg">
          {t('invest_bubble_fundraising')}
          <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
        </span>
      </span>
    );
  };

  if (isGoalReached) {
    return (
      <>
        <div className="relative flex sm:hidden items-center justify-center">
          <Link
            href="/fundraiser"
            className={`relative flex items-center justify-center w-8 h-8 bg-accent/20 hover:bg-accent/30 rounded-full transition-colors ${className}`}
            title={t('invest_goal_reached_short')}
          >
            <ProgressRing />
            <Sparkles />
          </Link>
          <InfoBubble />
        </div>
        <div className="relative hidden sm:flex items-center justify-center">
          <Link
            href="/fundraiser"
            className={`relative flex items-center min-w-0 max-w-full px-2 py-1.5 bg-accent/20 hover:bg-accent/30 rounded-lg transition-colors ${className}`}
          >
            <span className="text-xs font-medium text-accent truncate">
              {t('invest_goal_reached_short')}
            </span>
            <Sparkles />
          </Link>
          <InfoBubble />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="relative flex sm:hidden items-center justify-center">
        <Link
          href="/fundraiser"
          className={`relative flex items-center justify-center w-8 h-8 ${className}`}
          title={`${Math.round(navPercent)}% ${t('invest_progress_funded')}`}
        >
          <ProgressRing />
          <Sparkles />
        </Link>
        <InfoBubble />
      </div>
      <div className="relative hidden sm:flex items-center justify-center">
        <Link
          href="/fundraiser"
          className={`relative flex items-center gap-2.5 bg-gray-100 rounded-full py-1.5 px-4 pl-2 hover:bg-gray-200 transition-colors ${className}`}
        >
          <div className="w-7 h-7 flex-shrink-0"><ProgressRing /></div>
          <span className="text-xs font-medium text-gray-900">
            {isLoading ? '...' : formatAmount(totalRaised)}
          </span>
          <span className="text-xs text-gray-500">
            {Math.round(navPercent)}% {t('invest_progress_funded')}
          </span>
          <span className="text-xs text-gray-500">
            {daysLeft}{t('invest_nav_days_suffix')}
          </span>
          <Sparkles />
        </Link>
        <InfoBubble />
      </div>
    </>
  );
};

export default FundraisingWidget;
