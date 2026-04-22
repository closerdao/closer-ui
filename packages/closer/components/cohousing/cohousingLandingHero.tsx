import { useTranslations } from 'next-intl';

import {
  COHOUSING_PHASES,
  COHOUSING_POOL_BASE,
  COHOUSING_POOL_GOAL,
  COHOUSING_STEP_BY_N,
} from '../../constants/cohousingFlow';
import Button from '../ui/Button';
import Heading from '../ui/Heading';

import { FlowBadge, FlowProgressBar } from './cohousingFlowUi';

export const CohousingLandingHero = ({
  committed,
  onStart,
  onReadAgreement,
}: {
  committed: number;
  onStart: () => void;
  onReadAgreement: () => void;
}) => {
  const t = useTranslations();

  const stepSummaryLine = (n: number) => {
    const def = COHOUSING_STEP_BY_N[n];
    if (!def) {
      return '';
    }
    const short = t(def.shortKey);
    if (short.trim().length > 0) {
      return short;
    }
    return t(def.titleKey);
  };

  return (
    <section className="pt-10 pb-8 text-center">
      <FlowBadge>{t('cohousing_flow_landing_badge')}</FlowBadge>
      <Heading
        level={1}
        className="text-2xl md:text-3xl font-normal text-gray-900 max-w-2xl mx-auto mt-5 mb-4 text-center"
      >
        {t('cohousing_flow_landing_headline')}
      </Heading>
      <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto mb-4 leading-relaxed">
        {t('cohousing_flow_landing_intro')}
      </p>
      <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">
        {t('cohousing_flow_landing_prereq')}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto mb-8">
        {(
          [
            ['cohousing_flow_stat_reservation_k', 'cohousing_flow_stat_reservation_v'],
            ['cohousing_flow_stat_term_k', 'cohousing_flow_stat_term_v'],
            ['cohousing_flow_stat_base_k', 'cohousing_flow_stat_base_v'],
            ['cohousing_flow_stat_commons_k', 'cohousing_flow_stat_commons_v'],
          ] as const
        ).map(([k, v]) => (
          <div
            key={k}
            className="px-3 py-4 rounded-xl text-center bg-accent/10 border border-accent/30"
          >
            <div className="text-lg sm:text-xl font-semibold text-accent leading-tight mb-1.5">
              {t(v)}
            </div>
            <div className="text-[11px] sm:text-xs text-gray-600 leading-snug">{t(k)}</div>
          </div>
        ))}
      </div>

      <div className="max-w-2xl mx-auto text-left mb-8">
        <Heading level={2} className="text-sm font-semibold text-gray-900 mb-3">
          {t('cohousing_flow_journey_title')}
        </Heading>
        <div className="space-y-5 text-sm text-gray-600 leading-relaxed">
          {COHOUSING_PHASES.map((phase) => (
            <div key={phase.id} className="border-l-2 border-accent/40 pl-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                {t('cohousing_flow_chapter', { num: phase.num })} — {t(phase.titleKey)}
              </p>
              <ul className="list-disc pl-4 space-y-1">
                {phase.steps.map((n) => (
                  <li key={n}>{stepSummaryLine(n)}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-600 leading-relaxed mt-6">
          {t('cohousing_flow_finance_summary')}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        <Button isFullWidth={false} onClick={onStart}>
          {t('cohousing_flow_start')}
        </Button>
        <Button isFullWidth={false} variant="secondary" onClick={onReadAgreement}>
          {t('cohousing_flow_read_agreement')}
        </Button>
      </div>

      <div className="max-w-md mx-auto mt-9">
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>{t('cohousing_flow_pool_label')}</span>
          <span className="text-gray-900 font-bold">
            €{committed.toLocaleString()} / €{COHOUSING_POOL_GOAL.toLocaleString()}
          </span>
        </div>
        <FlowProgressBar
          value={committed}
          max={COHOUSING_POOL_GOAL}
          className="h-1.5"
        />
      </div>
    </section>
  );
};

export const COHOUSING_DEFAULT_COMMITTED = COHOUSING_POOL_BASE;
