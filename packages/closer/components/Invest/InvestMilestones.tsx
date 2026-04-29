import { AlertTriangle, CheckCircle2 } from 'lucide-react';

import { FundraisingMilestone, MilestoneStatus } from '../../types';
import {
  formatCompactCurrencyAmount,
  formatIsoFiatAmount,
} from '../../utils/currencyFormat';
import { getMilestoneGoal } from '../../utils/fundraising.helpers';

interface MilestoneState {
  status: MilestoneStatus;
  raised: number;
  progress: number;
  urgency?: boolean;
}

interface InvestMilestonesProps {
  milestones: FundraisingMilestone[];
  milestoneStates: Record<string, MilestoneState>;
  isLoadingFunds: boolean;
  t: (key: string) => string;
}

const InvestMilestones = ({
  milestones,
  milestoneStates,
  isLoadingFunds,
  t,
}: InvestMilestonesProps) => {
  if (milestones.length === 0) return null;

  const formatAmount = (amount: number, currency: string) => {
    return amount >= 1000
      ? formatCompactCurrencyAmount(amount, currency)
      : formatIsoFiatAmount(amount, currency);
  };

  const getBadgeLabel = (index: number, state: MilestoneState) => {
    if (state.status === 'completed') return t('invest_phase_completed');
    if (state.status === 'active') return t('invest_phase_current');
    const activeIndex = milestones.findIndex(
      (m) => milestoneStates[m.id]?.status === 'active',
    );
    if (index === activeIndex + 1) return t('invest_phase_next');
    return t('invest_phase_future');
  };

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
      <p className="text-xs uppercase tracking-widest text-accent font-semibold mb-3">
        {t('invest_roadmap_label')}
      </p>
      <h2 className="font-bold text-3xl text-gray-900 mb-3">
        {t('invest_roadmap_title')}
      </h2>
      <p className="text-base text-gray-600 max-w-xl mb-10">
        {t('invest_roadmap_subtitle')}
      </p>

      <div className="flex flex-col">
        {milestones.map((milestone, index) => {
          const state = milestoneStates[milestone.id] || {
            status: 'pending' as MilestoneStatus,
            raised: 0,
            progress: 0,
          };
          const isCompleted = state.status === 'completed';
          const isActive = state.status === 'active';
          const title = milestone.title || milestone.name;
          const description = milestone.description || '';
          const goal = getMilestoneGoal(milestone);
          const currency = milestone.currency || 'EUR';
          const isLast = index === milestones.length - 1;

          return (
            <div key={milestone.id} className="grid grid-cols-[40px_1fr] sm:grid-cols-[56px_1fr] gap-4 sm:gap-6">
              <div className="flex flex-col items-center">
                <div
                  className={`w-5 h-5 rounded-full border-[3px] flex-shrink-0 relative z-10 ${
                    isCompleted
                      ? 'border-green-500 bg-green-500'
                      : isActive
                        ? 'border-accent bg-accent shadow-[0_0_0_6px_rgba(254,79,183,0.15)]'
                        : 'border-gray-300 bg-white'
                  }`}
                >
                  {(isActive || isCompleted) && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </div>
                {!isLast && (
                  <div className="w-0.5 flex-1 bg-gray-300 min-h-[20px]" />
                )}
              </div>

              <div
                className={`mb-5 rounded-2xl border p-5 sm:p-6 transition-shadow ${
                  isCompleted
                    ? 'border-green-500 bg-green-50'
                    : isActive
                      ? 'border-accent shadow-md'
                      : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isActive
                          ? 'bg-accent text-white'
                          : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {isCompleted && (
                      <CheckCircle2 className="w-3 h-3 inline mr-1 -mt-0.5" />
                    )}
                    {getBadgeLabel(index, state)}
                  </span>
                  <span className="text-xl font-bold text-gray-900">
                    {formatAmount(goal, currency)}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>

                {description && (
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    {description}
                  </p>
                )}

                {isActive && !isLoadingFunds && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-semibold text-accent">
                        {formatAmount(state.raised, currency)} {t('invest_progress_raised')}
                      </span>
                      <span className="text-gray-500">
                        {formatAmount(goal, currency)} {t('invest_progress_goal')}
                      </span>
                    </div>
                    <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all duration-1000"
                        style={{ width: `${state.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {state.urgency && (
                  <div className="flex items-center gap-2 mt-3 p-2.5 bg-amber-50 rounded-lg text-xs text-amber-700 font-medium">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {t('invest_phase_urgency')}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default InvestMilestones;
