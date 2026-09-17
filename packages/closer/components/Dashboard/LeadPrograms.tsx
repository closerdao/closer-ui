import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Lead, LeadProgramKey } from '../../types/lead';
import {
  LEAD_MANAGER_ONLY_PROGRAMS,
  LEAD_PROGRAM_KEYS,
  leadCanBeInvitedTo,
  leadProgramInvite,
} from '../../utils/leads.helpers';
import TimeSince from '../TimeSince';
import { Button } from '../ui';

interface Props {
  lead: Lead;
  isBusy: boolean;
  /** Only a manager may select a village for the fund. */
  isManager: boolean;
  /** Ids resolved to names, for "invited by". */
  actorNames: Record<string, string>;
  onInvite: (program: LeadProgramKey) => void;
}

/**
 * The two doors a village lead can be shown through, side by side so the
 * choice is explicit: running on Closer is open to anyone willing to pay the
 * subscription - the match criteria do not come into it - while the OASA
 * Village Fund is a selection the team makes among the villages that met
 * them. Each is one click - the API records the decision and sends the
 * matching email - and once made it stays on the card as a fact, not a
 * button.
 */
const LeadPrograms = ({
  lead,
  isBusy,
  isManager,
  actorNames,
  onInvite,
}: Props) => {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-2" data-testid="lead-programs">
      <p className="text-sm text-gray-600">
        {t('dashboard_leads_programs_hint')}
      </p>
      <ul className="flex flex-col divide-y divide-gray-100 border border-gray-200 rounded-md">
        {LEAD_PROGRAM_KEYS.map((program) => {
          const invite = leadProgramInvite(lead, program);
          const managersOnly = LEAD_MANAGER_ONLY_PROGRAMS.includes(program);
          const eligible = leadCanBeInvitedTo(lead, program);
          const canInvite = eligible && (!managersOnly || isManager);
          const invitedBy = invite?.invitedBy
            ? (actorNames[invite.invitedBy] ?? invite.invitedBy)
            : null;
          return (
            <li
              key={program}
              className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
              data-testid={`lead-program-${program}`}
              data-state={invite ? 'invited' : canInvite ? 'open' : 'closed'}
            >
              <div className="flex flex-col min-w-0">
                <span className="text-sm text-gray-900">
                  {t(`dashboard_leads_program_${program}`)}
                </span>
                <span className="text-xs text-gray-500">
                  {t(`dashboard_leads_program_${program}_hint`)}
                </span>
              </div>
              <div className="shrink-0">
                {invite ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-green-700">
                    <Check size={14} aria-hidden="true" />
                    {t('dashboard_leads_program_invited')}{' '}
                    {invite.invitedAt ? (
                      <TimeSince time={invite.invitedAt} />
                    ) : null}
                    {invitedBy
                      ? ` · ${t('dashboard_leads_history_by', { name: invitedBy })}`
                      : ''}
                  </span>
                ) : canInvite ? (
                  <Button
                    size="small"
                    variant={program === 'closer' ? 'primary' : 'secondary'}
                    isFullWidth={false}
                    isEnabled={!isBusy}
                    onClick={() => onInvite(program)}
                  >
                    {t(`dashboard_leads_action_invite_${program}`)}
                  </Button>
                ) : (
                  <span className="text-xs text-gray-400">
                    {!eligible
                      ? t('dashboard_leads_step_blocked')
                      : t('dashboard_leads_program_team_decision')}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default LeadPrograms;
