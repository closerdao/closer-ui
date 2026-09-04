import { useTranslations } from 'next-intl';

import { Lead } from '../../types/lead';
import { leadHistory } from '../../utils/leads.helpers';
import TimeSince from '../TimeSince';

interface Props {
  lead: Lead;
  /** Owner ids resolved to names by the board; an unknown id renders as itself. */
  actorNames: Record<string, string>;
}

/**
 * Who did what to this lead, and when. The API has been writing this timeline
 * all along — every qualification decision is stamped with the person who made
 * it — and nothing drew it, which left "why was this rejected, and by whom" a
 * question only the database could answer.
 *
 * Newest first: the last thing that happened is the thing worth reading.
 */
const LeadHistory = ({ lead, actorNames }: Props) => {
  const t = useTranslations();
  const entries = leadHistory(lead);
  if (entries.length === 0) return null;

  return (
    <ul className="flex flex-col gap-2" data-testid="lead-history">
      {entries.map((entry, index) => {
        const actor = entry.by ? actorNames[entry.by] ?? entry.by : null;
        const kindKey = `dashboard_leads_history_${entry.kind}`;
        return (
          <li
            key={`${lead._id}-history-${entry.at ?? index}-${index}`}
            className="flex flex-wrap items-baseline gap-x-2 text-sm"
          >
            <span className="text-gray-500 text-xs">
              {entry.at ? <TimeSince time={entry.at} /> : '—'}
            </span>
            <span className="text-gray-900">
              {t.has(kindKey) ? t(kindKey) : entry.kind}
            </span>
            {entry.from || entry.to ? (
              <span className="text-gray-600">
                {[entry.from, entry.to].filter(Boolean).join(' → ')}
              </span>
            ) : null}
            {actor ? (
              <span className="text-gray-500 text-xs">
                {t('dashboard_leads_history_by', { name: actor })}
              </span>
            ) : null}
            {entry.note ? (
              <span className="text-gray-600 break-words w-full">
                {entry.note}
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
};

export default LeadHistory;
