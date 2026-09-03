import { useTranslations } from 'next-intl';

import { Lead, LeadQualificationKey } from '../../types/lead';
import {
  LEAD_QUALIFICATION_KEYS,
  leadQualificationAnswered,
  leadQualificationVerdict,
} from '../../utils/leads.helpers';

interface Props {
  lead: Lead;
  isBusy: boolean;
  onAnswer: (key: LeadQualificationKey, value: boolean | null) => void;
}

const choiceClass = (selected: boolean, tone: 'yes' | 'no' | 'clear') => {
  const base =
    'text-xs rounded-full px-2.5 py-1 border transition-colors disabled:opacity-60';
  if (!selected) {
    return `${base} bg-white text-gray-700 border-gray-300 hover:border-gray-500`;
  }
  if (tone === 'yes') return `${base} bg-green-600 text-white border-green-600`;
  if (tone === 'no') return `${base} bg-red-600 text-white border-red-600`;
  return `${base} bg-gray-200 text-gray-800 border-gray-300`;
};

/**
 * The four match criteria a team member answers by hand. Each row is a
 * yes / no with a way back to unanswered; every click saves on its own, so
 * a call can be scored one question at a time. The verdict line restates
 * what the API will do with the answers — one no rules the project out.
 */
const LeadQualification = ({ lead, isBusy, onAnswer }: Props) => {
  const t = useTranslations();
  const verdict = leadQualificationVerdict(lead);
  const answered = leadQualificationAnswered(lead);
  const total = LEAD_QUALIFICATION_KEYS.length;

  const statusText =
    verdict === 'qualified'
      ? t('dashboard_leads_qualification_status_qualified')
      : verdict === 'not_qualified'
      ? t('dashboard_leads_qualification_status_not_qualified')
      : t('dashboard_leads_qualification_status_pending', { answered, total });
  const statusClass =
    verdict === 'qualified'
      ? 'text-green-700'
      : verdict === 'not_qualified'
      ? 'text-red-700'
      : 'text-gray-600';

  return (
    <div className="flex flex-col gap-2" data-testid="lead-qualification">
      <p className="text-sm text-gray-600">
        {t('dashboard_leads_qualification_hint')}
      </p>
      <ul className="flex flex-col divide-y divide-gray-100 border border-gray-200 rounded-md">
        {LEAD_QUALIFICATION_KEYS.map((key) => {
          const value = lead.qualification?.[key];
          const label = t(`dashboard_leads_qualification_${key}`);
          return (
            <li
              key={key}
              className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
            >
              <div className="flex flex-col min-w-0">
                <span className="text-sm text-gray-900">{label}</span>
                <span className="text-xs text-gray-500">
                  {t(`dashboard_leads_qualification_${key}_hint`)}
                </span>
              </div>
              <div
                role="group"
                aria-label={label}
                className="flex items-center gap-1 shrink-0"
              >
                <button
                  type="button"
                  aria-pressed={value === true}
                  disabled={isBusy}
                  className={choiceClass(value === true, 'yes')}
                  onClick={() => onAnswer(key, true)}
                >
                  {t('dashboard_leads_qualification_yes')}
                </button>
                <button
                  type="button"
                  aria-pressed={value === false}
                  disabled={isBusy}
                  className={choiceClass(value === false, 'no')}
                  onClick={() => onAnswer(key, false)}
                >
                  {t('dashboard_leads_qualification_no')}
                </button>
                {typeof value === 'boolean' ? (
                  <button
                    type="button"
                    disabled={isBusy}
                    className={choiceClass(false, 'clear')}
                    onClick={() => onAnswer(key, null)}
                  >
                    {t('dashboard_leads_qualification_clear')}
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
      <p className={`text-sm ${statusClass}`} data-testid="lead-qualification-status">
        {statusText}
      </p>
    </div>
  );
};

export default LeadQualification;
