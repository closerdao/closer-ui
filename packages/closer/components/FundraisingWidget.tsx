import Link from 'next/link';

import { useEffect, useMemo, useState } from 'react';

import { CheckCircle2, PartyPopper } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useAuth } from '../contexts/auth';
import {
  FundraisingConfig,
  FundraisingMilestone,
} from '../types/api';
import api, { formatSearch } from '../utils/api';

interface FundraisingWidgetProps {
  variant?: 'nav' | 'hero';
  className?: string;
  fundraisingConfig?: FundraisingConfig;
}

interface FundraisingBreakdown {
  cryptoTokenSales: number;
  fiatTokenSales: number;
  loans: number;
  adjustments: number;
  total: number;
  target: number;
  progressPercent: number;
}

const DEFAULT_TARGET_AMOUNT = 295000;
const DEFAULT_END_DATE = '2026-05-31T23:59:59.999Z';

const findActiveMilestone = (milestones: FundraisingMilestone[] | undefined): FundraisingMilestone | null => {
  if (!milestones || milestones.length === 0) return null;
  
  const now = new Date();
  const FAR_FUTURE = new Date('2100-01-01T00:00:00.000Z');
  
  const sortedByStartDesc = [...milestones].sort((a, b) => {
    const startA = a.startDate ? new Date(a.startDate).getTime() : 0;
    const startB = b.startDate ? new Date(b.startDate).getTime() : 0;
    return startB - startA;
  });
  
  const activeMilestone = sortedByStartDesc.find(m => {
    if (!m.startDate) return false;
    
    const start = new Date(m.startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = m.endDate ? new Date(m.endDate) : FAR_FUTURE;
    if (m.endDate) end.setHours(23, 59, 59, 999);
    
    return now >= start && now <= end;
  });
  
  if (activeMilestone) return activeMilestone;
  
  const sortedByStartAsc = [...milestones].sort((a, b) => {
    const startA = a.startDate ? new Date(a.startDate).getTime() : Infinity;
    const startB = b.startDate ? new Date(b.startDate).getTime() : Infinity;
    return startA - startB;
  });
  
  const futureMilestones = sortedByStartAsc.filter(m => {
    if (!m.startDate) return false;
    const start = new Date(m.startDate);
    start.setHours(0, 0, 0, 0);
    return start > now;
  });
  
  if (futureMilestones.length > 0) return futureMilestones[0];
  
  return sortedByStartDesc[0] || null;
};

const FundraisingWidget = ({
  variant = 'nav',
  className = '',
  fundraisingConfig,
}: FundraisingWidgetProps) => {
  const t = useTranslations();
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('admin');
  const [breakdown, setBreakdown] = useState<FundraisingBreakdown>({
    cryptoTokenSales: 0,
    fiatTokenSales: 0,
    loans: 0,
    adjustments: 0,
    total: 0,
    target: DEFAULT_TARGET_AMOUNT,
    progressPercent: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [daysLeft, setDaysLeft] = useState(0);

  const activeMilestone = useMemo(() => {
    return findActiveMilestone(fundraisingConfig?.milestones);
  }, [fundraisingConfig?.milestones]);

  useEffect(() => {
    const endDate = activeMilestone?.endDate ? new Date(activeMilestone.endDate) : new Date(DEFAULT_END_DATE);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setDaysLeft(Math.max(0, diffDays));
  }, [activeMilestone]);

  useEffect(() => {
    const fetchTokenSales = async () => {
      try {
        const startDate = activeMilestone?.startDate || null;
        const endDate = activeMilestone?.endDate || DEFAULT_END_DATE;
        const targetAmount = Number(activeMilestone?.targetAmount) || DEFAULT_TARGET_AMOUNT;

        const dateFilter: Record<string, string> = {};
        if (startDate) {
          dateFilter.$gte = startDate;
        }
        if (endDate) {
          dateFilter.$lte = endDate;
        }

        const cryptoWhere: Record<string, unknown> = {
          type: 'tokenSale',
          status: 'paid',
        };
        const fiatWhere: Record<string, unknown> = {
          type: 'fiatTokenSale',
          status: 'paid',
        };

        if (Object.keys(dateFilter).length > 0) {
          cryptoWhere.created = dateFilter;
          fiatWhere.created = dateFilter;
        }

        const [cryptoRes, fiatRes] = await Promise.all([
          api
            .get('/charge', {
              params: {
                where: formatSearch(cryptoWhere),
                limit: 5000,
              },
            })
            .catch(() => null),
          api
            .get('/charge', {
              params: {
                where: formatSearch(fiatWhere),
                limit: 5000,
              },
            })
            .catch(() => null),
        ]);

        const cryptoTotal =
          cryptoRes?.data?.results?.reduce((sum: number, charge: any) => {
            const val = charge.amount?.total?.val;
            return sum + (typeof val === 'number' ? val : parseFloat(val || '0') || 0);
          }, 0) || 0;

        const fiatTotal =
          fiatRes?.data?.results?.reduce((sum: number, charge: any) => {
            const val = charge.amount?.total?.val;
            return sum + (typeof val === 'number' ? val : parseFloat(val || '0') || 0);
          }, 0) || 0;

        const loansTotal = (fundraisingConfig?.loans || [])
          .filter(loan => !activeMilestone || loan.countsTowardMilestone === activeMilestone.id)
          .reduce((sum, loan) => sum + (Number(loan.amount) || 0), 0);

        const adjustmentsTotal = (fundraisingConfig?.manualAdjustments || [])
          .filter(adj => !activeMilestone || adj.countsTowardMilestone === activeMilestone.id)
          .reduce((sum, adj) => sum + (Number(adj.amount) || 0), 0);

        const total = Number(cryptoTotal) + Number(fiatTotal) + Number(loansTotal) + Number(adjustmentsTotal);
        const progressPercent = Math.min((total / targetAmount) * 100, 100);

        setBreakdown({
          cryptoTokenSales: cryptoTotal,
          fiatTokenSales: fiatTotal,
          loans: loansTotal,
          adjustments: adjustmentsTotal,
          total,
          target: targetAmount,
          progressPercent,
        });
      } catch (error) {
        console.error('Error fetching token sales:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokenSales();
  }, [fundraisingConfig, activeMilestone]);

  const { total: totalRaised, target: goalAmount, progressPercent } = breakdown;

  const formatAmount = (amount: number) => {
    if (amount >= 1000) {
      return `€${Math.round(amount / 1000)}K`;
    }
    return `€${amount.toLocaleString()}`;
  };

  const milestoneName = activeMilestone?.name || t('invest_progress_milestone_default');
  const isGoalReached = !isLoading && totalRaised >= goalAmount;

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
              {formatAmount(totalRaised)} {t('invest_progress_raised')}
            </span>
            <span className="text-sm font-medium text-gray-500 line-through opacity-70">
              {formatAmount(goalAmount)} {t('invest_progress_goal')}
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
                <span className="text-right">€{breakdown.cryptoTokenSales.toLocaleString()}</span>
                <span>Fiat Token Sales:</span>
                <span className="text-right">€{breakdown.fiatTokenSales.toLocaleString()}</span>
                <span>Loans:</span>
                <span className="text-right">€{breakdown.loans.toLocaleString()}</span>
                <span>Adjustments:</span>
                <span className="text-right">€{breakdown.adjustments.toLocaleString()}</span>
                <span className="font-bold border-t border-accent/30 pt-1">Total:</span>
                <span className="text-right font-bold border-t border-accent/30 pt-1">€{breakdown.total.toLocaleString()}</span>
                <span>Target:</span>
                <span className="text-right">€{breakdown.target.toLocaleString()}</span>
                <span>Progress:</span>
                <span className="text-right">{breakdown.progressPercent.toFixed(2)}%</span>
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
            {isLoading ? '...' : formatAmount(totalRaised)}{' '}
            {t('invest_progress_raised')}
          </span>
          <span className="text-sm font-semibold text-gray-900">
            {formatAmount(goalAmount)} {t('invest_progress_goal')}
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
              <span className="text-right">€{breakdown.cryptoTokenSales.toLocaleString()}</span>
              <span>Fiat Token Sales:</span>
              <span className="text-right">€{breakdown.fiatTokenSales.toLocaleString()}</span>
              <span>Loans:</span>
              <span className="text-right">€{breakdown.loans.toLocaleString()}</span>
              <span>Adjustments:</span>
              <span className="text-right">€{breakdown.adjustments.toLocaleString()}</span>
              <span className="font-bold border-t border-gray-300 pt-1">Total:</span>
              <span className="text-right font-bold border-t border-gray-300 pt-1">€{breakdown.total.toLocaleString()}</span>
              <span>Target:</span>
              <span className="text-right">€{breakdown.target.toLocaleString()}</span>
              <span>Progress:</span>
              <span className="text-right">{breakdown.progressPercent.toFixed(2)}%</span>
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
        className={`hidden sm:flex items-center px-2 py-1.5 bg-accent/20 hover:bg-accent/30 rounded-lg transition-colors ${className}`}
      >
        <span className="text-xs font-medium text-accent">
          {t('invest_goal_reached_short')}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href="/invest"
      className={`hidden sm:flex items-center gap-2 px-2 py-1.5 bg-accent/10 hover:bg-accent/20 rounded-lg transition-colors ${className}`}
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
