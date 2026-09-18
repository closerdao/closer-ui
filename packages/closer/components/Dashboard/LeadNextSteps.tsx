import { ReactNode } from 'react';

import dayjs from 'dayjs';
import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Lead } from '../../types/lead';
import {
  leadCallDoneAt,
  leadCallIsOverdue,
  leadCallScheduledAt,
  leadCreateVillageHref,
  leadInvitedPrograms,
  leadJourney,
  leadOwnerInvitedAt,
  leadPrimaryVillage,
  leadSentEmailAt,
  leadVillageIsDraft,
} from '../../utils/leads.helpers';
import TimeSince from '../TimeSince';
import { Button, LinkButton } from '../ui';

interface Props {
  lead: Lead;
  isBusy: boolean;
  /** The owner's name, for the "taken by" line on the first step. */
  ownerName: string | null;
  onStart: () => void;
  /** Takes the team member to the call's date field, further down the card. */
  onScheduleCall: () => void;
  onCallDone: () => void;
  onInviteOwner: () => void;
  onSendNextStep: () => void;
  onPublish: () => void;
}

const Marker = ({
  done,
  blocked,
  index,
}: {
  done: boolean;
  blocked: boolean;
  index: number;
}) => (
  <span
    aria-hidden="true"
    className={`w-5 h-5 mt-0.5 shrink-0 rounded-full border text-[10px] font-semibold flex items-center justify-center ${
      done
        ? 'bg-green-600 border-green-600 text-white'
        : blocked
          ? 'bg-red-50 border-red-200 text-red-600'
          : 'bg-white border-gray-300 text-gray-500'
    }`}
  >
    {done ? <Check size={12} /> : index + 1}
  </span>
);

/**
 * The path from an application to a village on the map, with the one action
 * that moves it. Every step is drawn, done or not, so a team member can see
 * what has already happened to this lead and what is waiting on the founder
 * rather than on them. A ruled-out lead keeps the list, greyed, so the reason
 * nothing is offered is on the card rather than a mystery.
 */
const LeadNextSteps = ({
  lead,
  isBusy,
  ownerName,
  onStart,
  onScheduleCall,
  onCallDone,
  onInviteOwner,
  onSendNextStep,
  onPublish,
}: Props) => {
  const t = useTranslations();
  const steps = leadJourney(lead);
  if (steps.length === 0) return null;
  const programs = leadInvitedPrograms(lead);

  const village = leadPrimaryVillage(lead);
  const villageHref = village
    ? `/villages/${village.slug || village._id}`
    : null;
  const invitedAt = leadOwnerInvitedAt(lead);
  const nextStepSentAt = leadSentEmailAt(lead, 'lead_next_step');
  const callScheduledAt = leadCallScheduledAt(lead);
  const callDoneAt = leadCallDoneAt(lead);

  const detailFor = (key: string): ReactNode => {
    switch (key) {
      case 'start':
        return ownerName ? (
          <span className="text-xs text-gray-500">
            {t('dashboard_leads_owner_value', { name: ownerName })}
          </span>
        ) : null;
      case 'call':
        return callDoneAt ? (
          <span className="text-xs text-gray-500">
            <TimeSince time={callDoneAt} />
          </span>
        ) : callScheduledAt ? (
          <span
            className={`text-xs ${
              leadCallIsOverdue(lead) ? 'text-red-600' : 'text-gray-500'
            }`}
          >
            {t('dashboard_leads_call_at', {
              when: dayjs(callScheduledAt).format('D MMM, HH:mm'),
            })}
          </span>
        ) : null;
      case 'program':
        return programs.length > 0 ? (
          <span className="text-xs text-gray-500">
            {programs
              .map((program) => t(`dashboard_leads_program_${program}`))
              .join(' · ')}
          </span>
        ) : null;
      case 'village':
        return village && villageHref ? (
          <LinkButton
            href={villageHref}
            variant="inline"
            size="small"
            isFullWidth={false}
          >
            {village.name || t('dashboard_leads_view_village')}
            {leadVillageIsDraft(village)
              ? ` · ${t('dashboard_leads_village_draft')}`
              : ''}
          </LinkButton>
        ) : null;
      case 'owner':
        return village?.ownerClaimed ? null : invitedAt ? (
          <span className="text-xs text-gray-500">
            {t('dashboard_leads_step_owner_invited')}{' '}
            <TimeSince time={invitedAt} />
          </span>
        ) : null;
      case 'tell_us_more':
        return nextStepSentAt ? (
          <span className="text-xs text-gray-500">
            {t('dashboard_leads_step_sent')}{' '}
            {nextStepSentAt ? <TimeSince time={nextStepSentAt} /> : null}
          </span>
        ) : null;
      default:
        return null;
    }
  };

  const actionFor = (step: (typeof steps)[number]): ReactNode => {
    if (!step.available || step.done) return null;
    switch (step.key) {
      case 'start':
        return (
          <Button
            size="small"
            variant="primary"
            isFullWidth={false}
            isEnabled={!isBusy}
            onClick={onStart}
          >
            {t('dashboard_leads_action_start')}
          </Button>
        );
      case 'call':
        // Booked: the next move is to say it happened. Not booked: book it.
        return callScheduledAt ? (
          <Button
            size="small"
            variant="primary"
            isFullWidth={false}
            isEnabled={!isBusy}
            onClick={onCallDone}
          >
            {t('dashboard_leads_action_call_done')}
          </Button>
        ) : (
          <Button
            size="small"
            variant="secondary"
            isFullWidth={false}
            isEnabled={!isBusy}
            onClick={onScheduleCall}
          >
            {t('dashboard_leads_action_schedule_call')}
          </Button>
        );
      case 'village':
        return (
          <LinkButton
            href={leadCreateVillageHref(lead)}
            variant="secondary"
            size="small"
            isFullWidth={false}
          >
            {t('dashboard_leads_action_create_village')}
          </LinkButton>
        );
      case 'owner':
        return (
          <Button
            size="small"
            variant="secondary"
            isFullWidth={false}
            isEnabled={!isBusy}
            onClick={onInviteOwner}
          >
            {invitedAt
              ? t('dashboard_leads_action_resend_invite')
              : t('dashboard_leads_action_invite_owner')}
          </Button>
        );
      case 'tell_us_more':
        return (
          <Button
            size="small"
            variant="secondary"
            isFullWidth={false}
            isEnabled={!isBusy}
            onClick={onSendNextStep}
          >
            {t('dashboard_leads_action_send_next_step')}
          </Button>
        );
      case 'publish':
        return (
          <Button
            size="small"
            variant="primary"
            isFullWidth={false}
            isEnabled={!isBusy}
            onClick={onPublish}
          >
            {t('dashboard_leads_action_publish')}
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <ol className="flex flex-col gap-2" data-testid="lead-next-steps">
      {steps.map((step, index) => (
        <li
          key={step.key}
          className="flex items-start gap-3"
          data-testid={`lead-step-${step.key}`}
          data-state={step.done ? 'done' : step.blocked ? 'blocked' : 'open'}
        >
          <Marker done={step.done} blocked={step.blocked} index={index} />
          <div className="flex flex-col gap-1 min-w-0 grow">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span
                className={`text-sm ${
                  step.done
                    ? 'text-gray-500 line-through'
                    : step.blocked
                      ? 'text-gray-400'
                      : 'text-gray-900 font-medium'
                }`}
              >
                {t(`dashboard_leads_step_${step.key}`)}
              </span>
              {step.blocked && !step.done ? (
                <span className="text-xs text-red-600">
                  {t('dashboard_leads_step_blocked')}
                </span>
              ) : null}
              {detailFor(step.key)}
            </div>
            {!step.done &&
            !step.blocked &&
            step.key !== 'qualify' &&
            step.key !== 'program' ? (
              <span className="text-xs text-gray-500">
                {t(`dashboard_leads_step_${step.key}_hint`)}
              </span>
            ) : null}
          </div>
          <div className="shrink-0">{actionFor(step)}</div>
        </li>
      ))}
    </ol>
  );
};

export default LeadNextSteps;
