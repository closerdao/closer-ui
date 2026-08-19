import { useRouter } from 'next/router';

import { FormEvent, useEffect, useMemo, useState } from 'react';

import dayjs from 'dayjs';
import timezonePlugin from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import objectPath from 'object-path';

import {
  QUEST_AUTOMATIC_TRIGGER_EVENTS,
  QUEST_MANUAL_TRIGGER_EVENT,
  QUEST_TRIGGER_EVENTS,
  getQuestAwardCurrencies,
  getQuestStatusOptions,
  getQuestTriggerEvent,
} from '../../constants/quests.constants';
import type { Event } from '../../types';
import type { Quest, QuestAward, QuestStatus } from '../../types/quest';
import api, { formatSearch } from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { createQuest, deleteQuest, updateQuest } from '../../utils/quests.api';
import { withTicketSourceKeys } from '../../utils/quests.helpers';
import DateTimePicker from '../DateTimePicker';
import FormField from '../FormField';
import { Button, ErrorMessage } from '../ui';
import { AwardEditor, FieldSet } from './QuestEditorFields';

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

interface Props {
  quest?: Quest | null;
  defaultTimezone?: string;
  /** Scopes a token.purchased trigger and offers the token as an award. */
  bookingToken?: string;
  fiatCurrency?: string;
}

type Errors = Record<string, string>;

const emptyTicketSource = () => ({
  key: '',
  label: '',
  hint: '',
  ticketsPerUnit: 1,
  maxTickets: 1,
  verification: 'automatic',
  trigger: { event: '', filter: {} as Record<string, unknown> },
});

const buildInitialData = (quest?: Quest | null, defaultTimezone?: string) => ({
  title: quest?.title || '',
  slug: quest?.slug || '',
  shortDescription: quest?.shortDescription || '',
  description: quest?.description || '',
  category: quest?.category || 'connection',
  status: (quest?.status || 'draft') as QuestStatus,
  type: quest?.type || 'raffle',
  emoji: quest?.visual?.emoji || '',
  coverImage: quest?.visual?.coverImage || '',
  start: quest?.start || '',
  end: quest?.end || '',
  timezone: quest?.timezone || defaultTimezone || '',
  roleRequired: (quest?.roleRequired || []).join(', '),
  raffleConfig: {
    ticketSources: quest?.raffleConfig?.ticketSources?.length
      ? quest.raffleConfig.ticketSources.map((source) => ({
          ...emptyTicketSource(),
          ...source,
          trigger: { filter: {}, event: '', ...(source.trigger || {}) },
        }))
      : [emptyTicketSource()],
    winnerCount: quest?.raffleConfig?.winnerCount ?? 1,
    maxTicketsPerUser: quest?.raffleConfig?.maxTicketsPerUser ?? '',
    showLeaderboard: quest?.raffleConfig?.showLeaderboard !== false,
    leaderboardSize: quest?.raffleConfig?.leaderboardSize ?? 5,
    allowRepeatWinners: Boolean(quest?.raffleConfig?.allowRepeatWinners),
    drawMethod: quest?.raffleConfig?.drawMethod || 'random',
  },
  actionConfig: {
    actionLabel: quest?.actionConfig?.actionLabel || '',
    proofType: quest?.actionConfig?.proofType || 'url',
    proofPrompt: quest?.actionConfig?.proofPrompt || '',
    maxActionsPerUser: quest?.actionConfig?.maxActionsPerUser ?? '',
    requiresApproval: quest?.actionConfig?.requiresApproval !== false,
    trigger: {
      event: quest?.actionConfig?.trigger?.event || QUEST_MANUAL_TRIGGER_EVENT,
      filter: quest?.actionConfig?.trigger?.filter || {},
    },
  },
  prizeNotes: quest?.prize?.notes || '',
  eligibility: {
    minAccountAgeDays: quest?.eligibility?.minAccountAgeDays ?? '',
    requiresVerifiedEmail: Boolean(quest?.eligibility?.requiresVerifiedEmail),
  },
});

const QuestEditor = ({
  quest,
  defaultTimezone,
  bookingToken,
  fiatCurrency,
}: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const isNew = !quest;

  /** The server freezes the terms once members can have entered under them. */
  const areTermsFrozen = Boolean(
    quest && quest.status !== 'draft' && quest.status !== 'scheduled',
  );
  const canDelete = Boolean(
    quest && (quest.status === 'draft' || quest.status === 'scheduled'),
  );

  const [data, setData] = useState(() =>
    buildInitialData(quest, defaultTimezone),
  );
  const [rankedAwards, setRankedAwards] = useState<QuestAward[]>(() =>
    Object.entries(quest?.prize?.ranked || {})
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, award]) => award),
  );
  const [eachAction, setEachAction] = useState<QuestAward | null>(
    quest?.prize?.eachAction || null,
  );
  const [participation, setParticipation] = useState<QuestAward | null>(
    quest?.prize?.participation || null,
  );

  const [events, setEvents] = useState<Event[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  /** status moves only along the lifecycle path, or aside to cancelled. */
  const statusOptions = useMemo(
    () =>
      getQuestStatusOptions(quest?.status || 'draft').map((value) => ({
        label: t(`quests_status_${value}` as string),
        value,
      })),
    [quest?.status, t],
  );

  const awardCurrencies = useMemo(
    () => getQuestAwardCurrencies({ bookingToken, fiatCurrency }),
    [bookingToken, fiatCurrency],
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const update = (name: string, value: unknown) => {
    setData((current) => {
      const copy = { ...current };
      objectPath.set(copy, name, value);
      return copy;
    });
  };

  const needsEventList = data.raffleConfig.ticketSources.some(
    (source) =>
      getQuestTriggerEvent(source.trigger?.event)?.requires === 'event',
  );

  // The booking trigger filters on a specific event, so offer the real ones.
  useEffect(() => {
    if (!needsEventList || events.length) return;
    api
      .get('/event', {
        params: {
          where: formatSearch({ end: { $gt: new Date() } }),
          limit: 100,
          sort_by: 'start',
        },
      })
      .then((res) => setEvents(res?.data?.results || []))
      .catch(() => setEvents([]));
  }, [needsEventList, events.length]);

  const validate = (): Errors => {
    const next: Errors = {};
    if (!data.title.trim()) next.title = t('quests_editor_error_required');

    if (!areTermsFrozen) {
      if (!data.start) next.start = t('quests_editor_error_required');
      if (!data.end) next.end = t('quests_editor_error_required');
      if (
        data.start &&
        data.end &&
        !dayjs(data.end).isAfter(dayjs(data.start))
      ) {
        next.end = t('quests_editor_error_end_before_start');
      }

      if (data.type === 'raffle') {
        const sources = data.raffleConfig.ticketSources;
        const validSources = sources.filter((source) => source.label.trim());
        if (!validSources.length) {
          next['raffleConfig.ticketSources'] = t(
            'quests_editor_error_need_source',
          );
        }
        sources.forEach((source, index) => {
          if (!source.label.trim() && source.trigger?.event) {
            next[`raffleConfig.ticketSources.${index}.label`] = t(
              'quests_editor_error_required',
            );
          }
          if (source.verification === 'automatic' && !source.trigger?.event) {
            next[`raffleConfig.ticketSources.${index}.trigger.event`] = t(
              'quests_editor_error_need_trigger',
            );
          }
          if (
            source.verification === 'automatic' &&
            getQuestTriggerEvent(source.trigger?.event)?.requires === 'event' &&
            !source.trigger?.filter?.eventId
          ) {
            next[`raffleConfig.ticketSources.${index}.trigger.filter.eventId`] =
              t('quests_editor_error_required');
          }
        });
        if (Number(data.raffleConfig.winnerCount) < 1) {
          next['raffleConfig.winnerCount'] = t('quests_editor_error_min_one');
        }
        if (rankedAwards.length > Number(data.raffleConfig.winnerCount)) {
          next.rankedAwards = t('quests_editor_ranked_overflow', {
            count: Number(data.raffleConfig.winnerCount),
          });
        }
      } else {
        if (!data.actionConfig.actionLabel.trim()) {
          next['actionConfig.actionLabel'] = t('quests_editor_error_required');
        }
        const actionTrigger = getQuestTriggerEvent(
          data.actionConfig.trigger.event,
        );
        if (
          actionTrigger?.requires === 'event' &&
          !data.actionConfig.trigger.filter?.eventId
        ) {
          next['actionConfig.trigger.filter.eventId'] = t(
            'quests_editor_error_required',
          );
        }
      }

      // The API only permits token prizes on tokenGrowth quests.
      const tokenOnly = new Set(
        awardCurrencies
          .filter((currency) => currency.tokenGrowthOnly)
          .map((currency) => currency.value),
      );
      const flagTokenPrize = (award: QuestAward | null, key: string) => {
        if (
          award &&
          award.kind === 'currency' &&
          tokenOnly.has(award.cur) &&
          data.category !== 'tokenGrowth'
        ) {
          next[key] = t('quests_editor_error_token_prize');
        }
      };
      rankedAwards.forEach((award, index) =>
        flagTokenPrize(award, `rankedAwards.${index}.cur`),
      );
      flagTokenPrize(eachAction, 'eachAction.cur');
      flagTokenPrize(participation, 'participation.cur');
    }
    return next;
  };

  // Once they have seen the errors, keep them honest as they fix things.
  useEffect(() => {
    if (hasSubmitted) setErrors(validate());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, rankedAwards, eachAction, participation, hasSubmitted]);

  const errorFor = (name: string) => (hasSubmitted ? errors[name] || '' : '');

  /** Scopes a trigger only with what that trigger actually accepts. */
  const buildTriggerFilter = (
    event: string,
    filter: Record<string, unknown> = {},
  ) => {
    const definition = getQuestTriggerEvent(event);
    const next: Record<string, unknown> = { ...filter };

    if (event === 'token.purchased') {
      if (bookingToken) next.token = bookingToken;
      next.withinQuestWindow = true;
    }
    // Optional scopes stay off the filter entirely when they are not set.
    if (definition?.acceptsEvent && !next.eventId) delete next.eventId;
    if (definition?.acceptsFullDuration && !next.fullDuration) {
      delete next.fullDuration;
    }
    return next;
  };

  /**
   * A source nothing can count automatically carries the `custom` trigger —
   * that is what `POST …/action` accepts, and without it a member could never
   * submit proof for it.
   */
  const buildSourceTrigger = (source: {
    verification: string;
    trigger?: { event?: string; filter?: Record<string, unknown> };
  }) => {
    if (source.verification !== 'automatic') {
      return { trigger: { event: QUEST_MANUAL_TRIGGER_EVENT, filter: {} } };
    }
    if (!source.trigger?.event) return {};
    return {
      trigger: {
        event: source.trigger.event,
        filter: buildTriggerFilter(source.trigger.event, source.trigger.filter),
      },
    };
  };

  const buildPayload = (): Partial<Quest> => {
    const copy: Partial<Quest> = {
      title: data.title.trim(),
      shortDescription: data.shortDescription.trim(),
      description: data.description.trim(),
      status: data.status,
      visual: {
        ...(quest?.visual || {}),
        emoji: data.emoji.trim(),
        coverImage: data.coverImage.trim(),
      },
    };
    if (data.slug.trim()) copy.slug = data.slug.trim();

    // Everything below is rejected server-side once the quest is past scheduled.
    if (areTermsFrozen) return copy;

    const prize: NonNullable<Quest['prize']> = {};
    if (rankedAwards.length) {
      prize.ranked = rankedAwards.reduce(
        (acc, award, index) => ({ ...acc, [String(index + 1)]: award }),
        {},
      );
    }
    if (eachAction) prize.eachAction = eachAction;
    if (participation) prize.participation = participation;
    if (data.prizeNotes.trim()) prize.notes = data.prizeNotes.trim();

    const terms: Partial<Quest> = {
      ...copy,
      category: data.category as Quest['category'],
      type: data.type as Quest['type'],
      start: dayjs(data.start).toISOString(),
      end: dayjs(data.end).toISOString(),
      timezone: data.timezone.trim() || undefined,
      roleRequired: data.roleRequired
        .split(',')
        .map((role) => role.trim())
        .filter(Boolean),
      eligibility: {
        ...(data.eligibility.minAccountAgeDays === ''
          ? {}
          : {
              minAccountAgeDays: Number(data.eligibility.minAccountAgeDays),
            }),
        requiresVerifiedEmail: data.eligibility.requiresVerifiedEmail,
      },
      ...(Object.keys(prize).length ? { prize } : {}),
    };

    if (data.type === 'raffle') {
      terms.raffleConfig = {
        ticketSources: withTicketSourceKeys(
          data.raffleConfig.ticketSources.filter((source) =>
            source.label.trim(),
          ),
        ).map((source) => ({
          key: source.key,
          label: source.label.trim(),
          hint: source.hint?.trim() || undefined,
          ticketsPerUnit: Number(source.ticketsPerUnit) || 1,
          maxTickets: Number(source.maxTickets) || 1,
          verification: source.verification,
          ...buildSourceTrigger(source),
        })),
        winnerCount: Number(data.raffleConfig.winnerCount) || 1,
        ...(data.raffleConfig.maxTicketsPerUser === ''
          ? {}
          : {
              maxTicketsPerUser: Number(data.raffleConfig.maxTicketsPerUser),
            }),
        allowRepeatWinners: data.raffleConfig.allowRepeatWinners,
        drawMethod: data.raffleConfig.drawMethod,
        showLeaderboard: data.raffleConfig.showLeaderboard,
        leaderboardSize: Number(data.raffleConfig.leaderboardSize) || 5,
      };
    } else {
      const actionTrigger = data.actionConfig.trigger.event;
      const isManualAction = actionTrigger === QUEST_MANUAL_TRIGGER_EVENT;

      terms.actionConfig = {
        actionLabel: data.actionConfig.actionLabel.trim(),
        // Nothing is submitted when the backend counts it, so there is no
        // proof to ask for and nothing to approve.
        proofType: isManualAction ? data.actionConfig.proofType : 'automatic',
        ...(isManualAction && data.actionConfig.proofPrompt.trim()
          ? { proofPrompt: data.actionConfig.proofPrompt.trim() }
          : {}),
        ...(data.actionConfig.maxActionsPerUser === ''
          ? {}
          : {
              maxActionsPerUser: Number(data.actionConfig.maxActionsPerUser),
            }),
        // Actions are not weighted against each other, so a point is an action
        // and the leaderboard reads as a count.
        pointsPerAction: 1,
        requiresApproval: isManualAction
          ? data.actionConfig.requiresApproval
          : false,
        trigger: {
          event: actionTrigger,
          filter: isManualAction
            ? {}
            : buildTriggerFilter(
                actionTrigger,
                data.actionConfig.trigger.filter,
              ),
        },
      };
    }

    return terms;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSaving) return;
    setHasSubmitted(true);
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setApiError(null);
    setIsSaving(true);
    try {
      const saved = isNew
        ? await createQuest(buildPayload())
        : await updateQuest(quest!.slug, buildPayload());
      router.push(`/quests/${saved?.slug || quest?.slug || ''}`);
    } catch (err) {
      setApiError(parseMessageFromError(err));
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!quest || isDeleting) return;
    if (
      typeof window !== 'undefined' &&
      !window.confirm(t('quests_editor_delete_confirm'))
    ) {
      return;
    }
    setApiError(null);
    setIsDeleting(true);
    try {
      await deleteQuest(quest._id);
      router.push('/quests');
    } catch (err) {
      setApiError(parseMessageFromError(err));
      setIsDeleting(false);
    }
  };

  const eventOptions = useMemo(
    () => [
      { label: t('quests_editor_select_event'), value: '' },
      ...events.map((item) => ({ label: item.name, value: item._id })),
    ],
    [events, t],
  );

  const triggerOptions = useMemo(
    () => [
      { label: t('quests_editor_select_trigger'), value: '' },
      ...QUEST_AUTOMATIC_TRIGGER_EVENTS.map((option) => ({
        label: t(option.labelKey as string),
        value: option.value,
      })),
    ],
    [t],
  );

  /** A singleAction quest can be counted the same ways a raffle source is. */
  const actionTrigger = getQuestTriggerEvent(data.actionConfig.trigger.event);
  const isManualActionTrigger =
    data.actionConfig.trigger.event === QUEST_MANUAL_TRIGGER_EVENT;

  const actionTriggerOptions = useMemo(
    () =>
      QUEST_TRIGGER_EVENTS.map((option) => ({
        label: t(option.labelKey as string),
        value: option.value,
      })),
    [t],
  );

  const errorCount = hasSubmitted ? Object.keys(errors).length : 0;

  return (
    <form
      onSubmit={handleSubmit}
      // Our own validation runs so the messages are translated and inline.
      noValidate
      className="flex flex-col gap-5 max-w-2xl"
    >
      {areTermsFrozen && (
        <p className="rounded-xl bg-neutral px-4 py-3 text-sm text-gray-600">
          {t('quests_editor_frozen')}
        </p>
      )}

      <FieldSet title={t('quests_editor_section_basics')}>
        <FormField
          data={data}
          update={update}
          name="title"
          label={t('quests_editor_title')}
          type="text"
          required
          placeholder="The Citizen Raffle"
          error={errorFor('title')}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormField
            data={data}
            update={update}
            name="slug"
            label={t('quests_editor_slug')}
            type="text"
            hint={t('quests_editor_slug_hint')}
          />
          <FormField
            data={data}
            update={update}
            name="emoji"
            label={t('quests_editor_emoji')}
            type="text"
            placeholder="🐑"
          />
        </div>
        <FormField
          data={data}
          update={update}
          name="shortDescription"
          label={t('quests_editor_short_description')}
          type="text"
        />
        <FormField
          data={data}
          update={update}
          name="description"
          label={t('quests_editor_description')}
          type="textarea"
        />
        <FormField
          data={data}
          update={update}
          name="coverImage"
          label={t('quests_editor_cover_image')}
          type="text"
          placeholder="https://…"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormField
            data={areTermsFrozen ? { ...data } : data}
            update={update}
            isDisabled={areTermsFrozen}
            name="category"
            label={t('quests_editor_category')}
            type="select"
            options={[
              {
                label: t('quests_category_token_growth'),
                value: 'tokenGrowth',
              },
              { label: t('quests_category_knowledge'), value: 'knowledge' },
              { label: t('quests_category_connection'), value: 'connection' },
              { label: t('quests_category_adoption'), value: 'adoption' },
            ]}
          />
          <FormField
            data={data}
            update={update}
            name="status"
            label={t('quests_editor_status')}
            type="select"
            options={statusOptions}
            hint={t('quests_editor_status_hint')}
          />
        </div>
      </FieldSet>

      <FieldSet title={t('quests_editor_section_window')}>
        <div className="mb-6">
          <label className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2">
            {t('quests_editor_window')} <span className="text-red-500">*</span>
          </label>
          {areTermsFrozen ? (
            <p className="text-sm text-gray-600">
              {dayjs(data.start).format('MMM D, YYYY HH:mm')} –{' '}
              {dayjs(data.end).format('MMM D, YYYY HH:mm')}
            </p>
          ) : (
            <DateTimePicker
              setStartDate={(date) => update('start', date)}
              setEndDate={(date) => update('end', date)}
              savedStartDate={data.start || null}
              savedEndDate={data.end || null}
              defaultMonth={new Date()}
              timeZone={data.timezone || undefined}
              isAdmin={true}
            />
          )}
          {(errorFor('start') || errorFor('end')) && (
            <p className="text-error text-sm mt-1">
              {errorFor('start') || errorFor('end')}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-3">
            {t('quests_editor_end_hint')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormField
            data={data}
            update={update}
            isDisabled={areTermsFrozen}
            name="timezone"
            label={t('quests_editor_timezone')}
            type="text"
            placeholder="Europe/Lisbon"
            hint={t('quests_editor_timezone_hint')}
          />
          <FormField
            data={data}
            update={update}
            isDisabled={areTermsFrozen}
            name="roleRequired"
            label={t('quests_editor_roles')}
            type="text"
            placeholder="citizen, steward"
            hint={t('quests_editor_roles_hint')}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormField
            data={data}
            update={update}
            isDisabled={areTermsFrozen}
            name="eligibility.minAccountAgeDays"
            label={t('quests_editor_min_account_age')}
            type="number"
            min={0}
            hint={t('quests_editor_blank_none')}
          />
          <FormField
            data={data}
            update={update}
            isDisabled={areTermsFrozen}
            name="eligibility.requiresVerifiedEmail"
            label={t('quests_editor_verified_email')}
            type="switch"
          />
        </div>
      </FieldSet>

      <FieldSet title={t('quests_editor_section_scoring')}>
        <FormField
          data={data}
          update={update}
          isDisabled={areTermsFrozen}
          name="type"
          label={t('quests_editor_type')}
          type="select"
          required
          options={[
            { label: t('quests_editor_type_raffle'), value: 'raffle' },
            { label: t('quests_editor_type_action'), value: 'singleAction' },
          ]}
        />

        {data.type === 'raffle' ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4">
              <FormField
                data={data}
                update={update}
                isDisabled={areTermsFrozen}
                name="raffleConfig.winnerCount"
                label={t('quests_editor_winner_count')}
                type="number"
                min={1}
                required
                error={errorFor('raffleConfig.winnerCount')}
              />
              <FormField
                data={data}
                update={update}
                isDisabled={areTermsFrozen}
                name="raffleConfig.maxTicketsPerUser"
                label={t('quests_editor_max_tickets')}
                type="number"
                min={1}
                hint={t('quests_editor_blank_none')}
              />
              <FormField
                data={data}
                update={update}
                isDisabled={areTermsFrozen}
                name="raffleConfig.leaderboardSize"
                label={t('quests_editor_leaderboard_size')}
                type="number"
                min={1}
              />
            </div>
            <FormField
              data={data}
              update={update}
              isDisabled={areTermsFrozen}
              name="raffleConfig.drawMethod"
              label={t('quests_editor_draw_method')}
              type="select"
              options={[
                { label: t('quests_editor_draw_random'), value: 'random' },
                {
                  label: t('quests_editor_draw_external'),
                  value: 'externalSeed',
                },
              ]}
              hint={t('quests_editor_draw_method_hint')}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <FormField
                data={data}
                update={update}
                isDisabled={areTermsFrozen}
                name="raffleConfig.showLeaderboard"
                label={t('quests_editor_show_leaderboard')}
                type="switch"
              />
              <FormField
                data={data}
                update={update}
                isDisabled={areTermsFrozen}
                name="raffleConfig.allowRepeatWinners"
                label={t('quests_editor_repeat_winners')}
                type="switch"
              />
            </div>

            <div className="mb-6">
              <label className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2">
                {t('quests_editor_ticket_sources')}{' '}
                <span className="text-red-500">*</span>
              </label>
              {errorFor('raffleConfig.ticketSources') && (
                <p className="text-error text-sm mb-2">
                  {errorFor('raffleConfig.ticketSources')}
                </p>
              )}
              <div className="flex flex-col gap-3">
                {data.raffleConfig.ticketSources.map((source, index) => {
                  const base = `raffleConfig.ticketSources.${index}`;
                  const trigger = getQuestTriggerEvent(source.trigger?.event);
                  return (
                    <div
                      key={index}
                      className="rounded-xl border border-gray-200 p-4"
                    >
                      <FormField
                        data={data}
                        update={update}
                        isDisabled={areTermsFrozen}
                        name={`${base}.label`}
                        label={t('quests_editor_source_label')}
                        type="text"
                        required
                        placeholder="$TDF bought during the quest"
                        isSecondary
                        error={errorFor(`${base}.label`)}
                      />
                      <FormField
                        data={data}
                        update={update}
                        isDisabled={areTermsFrozen}
                        name={`${base}.hint`}
                        label={t('quests_editor_source_hint')}
                        type="text"
                        isSecondary
                      />
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4">
                        <FormField
                          data={data}
                          update={update}
                          isDisabled={areTermsFrozen}
                          name={`${base}.ticketsPerUnit`}
                          label={t('quests_editor_source_per_unit')}
                          type="number"
                          min={1}
                          isSecondary
                        />
                        <FormField
                          data={data}
                          update={update}
                          isDisabled={areTermsFrozen}
                          name={`${base}.maxTickets`}
                          label={t('quests_editor_source_max')}
                          type="number"
                          min={1}
                          isSecondary
                        />
                        <FormField
                          data={data}
                          update={update}
                          isDisabled={areTermsFrozen}
                          name={`${base}.verification`}
                          label={t('quests_editor_source_verification')}
                          type="select"
                          isSecondary
                          options={[
                            {
                              label: t('quests_editor_verification_automatic'),
                              value: 'automatic',
                            },
                            {
                              label: t('quests_editor_verification_admin'),
                              value: 'admin',
                            },
                          ]}
                        />
                      </div>

                      {source.verification === 'automatic' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                          <FormField
                            data={data}
                            update={(name: string, value: unknown) => {
                              // A different trigger invalidates its filter.
                              update(`${base}.trigger.filter`, {});
                              update(name, value);
                            }}
                            isDisabled={areTermsFrozen}
                            name={`${base}.trigger.event`}
                            label={t('quests_editor_source_event')}
                            type="select"
                            required
                            isSecondary
                            options={triggerOptions}
                            error={errorFor(`${base}.trigger.event`)}
                          />
                          {(trigger?.requires === 'event' ||
                            trigger?.acceptsEvent) && (
                            <FormField
                              data={data}
                              update={update}
                              isDisabled={areTermsFrozen}
                              name={`${base}.trigger.filter.eventId`}
                              label={
                                trigger?.requires === 'event'
                                  ? t('quests_editor_source_which_event')
                                  : t('quests_editor_source_which_event_opt')
                              }
                              type="select"
                              required={trigger?.requires === 'event'}
                              isSecondary
                              options={eventOptions}
                              error={errorFor(`${base}.trigger.filter.eventId`)}
                            />
                          )}
                        </div>
                      )}

                      {source.verification === 'automatic' &&
                        trigger?.acceptsFullDuration && (
                          <FormField
                            data={data}
                            update={update}
                            isDisabled={areTermsFrozen}
                            name={`${base}.trigger.filter.fullDuration`}
                            label={t('quests_editor_source_full_duration')}
                            type="switch"
                            isSecondary
                          />
                        )}

                      {source.verification !== 'automatic' && (
                        <p className="text-xs text-gray-500 mb-4">
                          {t('quests_editor_source_manual_note')}
                        </p>
                      )}

                      {!areTermsFrozen &&
                        data.raffleConfig.ticketSources.length > 1 && (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 text-sm text-failure hover:underline"
                            onClick={() =>
                              update(
                                'raffleConfig.ticketSources',
                                data.raffleConfig.ticketSources.filter(
                                  (_, i) => i !== index,
                                ),
                              )
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                            {t('quests_editor_remove_source')}
                          </button>
                        )}
                    </div>
                  );
                })}
                {!areTermsFrozen && (
                  <button
                    type="button"
                    className="self-start inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
                    onClick={() =>
                      update('raffleConfig.ticketSources', [
                        ...data.raffleConfig.ticketSources,
                        emptyTicketSource(),
                      ])
                    }
                  >
                    <Plus className="w-4 h-4" />
                    {t('quests_editor_add_source')}
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <FormField
              data={data}
              update={update}
              isDisabled={areTermsFrozen}
              name="actionConfig.actionLabel"
              label={t('quests_editor_action_label')}
              type="text"
              required
              placeholder="Publish a story"
              error={errorFor('actionConfig.actionLabel')}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <FormField
                data={data}
                update={(name: string, value: unknown) => {
                  // A different trigger invalidates its filter.
                  update('actionConfig.trigger.filter', {});
                  update(name, value);
                }}
                isDisabled={areTermsFrozen}
                name="actionConfig.trigger.event"
                label={t('quests_editor_action_trigger')}
                type="select"
                required
                options={actionTriggerOptions}
                hint={t('quests_editor_action_trigger_hint')}
              />
              {(actionTrigger?.requires === 'event' ||
                actionTrigger?.acceptsEvent) && (
                <FormField
                  data={data}
                  update={update}
                  isDisabled={areTermsFrozen}
                  name="actionConfig.trigger.filter.eventId"
                  label={
                    actionTrigger?.requires === 'event'
                      ? t('quests_editor_source_which_event')
                      : t('quests_editor_source_which_event_opt')
                  }
                  type="select"
                  required={actionTrigger?.requires === 'event'}
                  options={eventOptions}
                  error={errorFor('actionConfig.trigger.filter.eventId')}
                />
              )}
            </div>

            {actionTrigger?.acceptsFullDuration && (
              <FormField
                data={data}
                update={update}
                isDisabled={areTermsFrozen}
                name="actionConfig.trigger.filter.fullDuration"
                label={t('quests_editor_source_full_duration')}
                type="switch"
              />
            )}

            {isManualActionTrigger && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <FormField
                  data={data}
                  update={update}
                  isDisabled={areTermsFrozen}
                  name="actionConfig.proofType"
                  label={t('quests_editor_proof_type')}
                  type="select"
                  options={[
                    { label: 'url', value: 'url' },
                    { label: 'text', value: 'text' },
                    { label: 'image', value: 'image' },
                    { label: 'automatic', value: 'automatic' },
                  ]}
                />
                <FormField
                  data={data}
                  update={update}
                  isDisabled={areTermsFrozen}
                  name="actionConfig.proofPrompt"
                  label={t('quests_editor_proof_prompt')}
                  type="text"
                />
              </div>
            )}
            <FormField
              data={data}
              update={update}
              isDisabled={areTermsFrozen}
              name="actionConfig.maxActionsPerUser"
              label={t('quests_editor_max_actions')}
              type="number"
              min={1}
              hint={t('quests_editor_blank_none')}
            />
            {isManualActionTrigger ? (
              <FormField
                data={data}
                update={update}
                isDisabled={areTermsFrozen}
                name="actionConfig.requiresApproval"
                label={t('quests_editor_requires_approval')}
                type="switch"
              />
            ) : (
              <p className="text-xs text-gray-500">
                {t('quests_editor_action_trigger_automatic_note')}
              </p>
            )}
          </>
        )}
      </FieldSet>

      <FieldSet title={t('quests_editor_section_prize')}>
        {errorFor('rankedAwards') && (
          <p className="text-error text-sm">{errorFor('rankedAwards')}</p>
        )}
        {rankedAwards.map((award, index) => (
          <div
            key={index}
            className="rounded-xl border border-gray-200 p-4 mb-3"
          >
            <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
              {t('quests_prize_rank', { rank: index + 1 })}
            </div>
            <AwardEditor
              award={award}
              isDisabled={areTermsFrozen}
              currencies={awardCurrencies}
              error={errorFor(`rankedAwards.${index}.cur`)}
              onChange={(next) =>
                setRankedAwards((awards) =>
                  awards.map((item, i) => (i === index ? next : item)),
                )
              }
            />
            {!areTermsFrozen && index === rankedAwards.length - 1 && (
              <button
                type="button"
                className="self-start inline-flex items-center gap-1.5 text-sm text-failure hover:underline"
                onClick={() => setRankedAwards((awards) => awards.slice(0, -1))}
              >
                <Trash2 className="w-4 h-4" />
                {t('quests_editor_remove_rank')}
              </button>
            )}
          </div>
        ))}
        {!areTermsFrozen && (
          <button
            type="button"
            className="self-start inline-flex items-center gap-1.5 text-sm text-accent hover:underline mb-2"
            onClick={() =>
              setRankedAwards((awards) => [
                ...awards,
                { kind: 'currency', cur: 'carrots', val: 1 },
              ])
            }
          >
            <Plus className="w-4 h-4" />
            {t('quests_editor_add_rank')}
          </button>
        )}

        <div className="border-t border-gray-200 pt-4 mt-2 mb-4 flex flex-col gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="accent-accent w-4 h-4"
              checked={Boolean(eachAction)}
              disabled={areTermsFrozen}
              onChange={(event) =>
                setEachAction(
                  event.target.checked
                    ? { kind: 'currency', cur: 'carrots', val: 1 }
                    : null,
                )
              }
            />
            {t('quests_editor_each_action_award')}
          </label>
          {eachAction && (
            <AwardEditor
              award={eachAction}
              isDisabled={areTermsFrozen}
              currencies={awardCurrencies}
              error={errorFor('eachAction.cur')}
              onChange={setEachAction}
            />
          )}
        </div>

        <div className="border-t border-gray-200 pt-4 mb-4 flex flex-col gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="accent-accent w-4 h-4"
              checked={Boolean(participation)}
              disabled={areTermsFrozen}
              onChange={(event) =>
                setParticipation(
                  event.target.checked
                    ? { kind: 'currency', cur: 'carrots', val: 1 }
                    : null,
                )
              }
            />
            {t('quests_editor_participation_award')}
          </label>
          {participation && (
            <AwardEditor
              award={participation}
              isDisabled={areTermsFrozen}
              currencies={awardCurrencies}
              error={errorFor('participation.cur')}
              onChange={setParticipation}
            />
          )}
        </div>

        <FormField
          data={data}
          update={update}
          isDisabled={areTermsFrozen}
          name="prizeNotes"
          label={t('quests_editor_prize_notes')}
          type="textarea"
        />
      </FieldSet>

      {apiError && <ErrorMessage error={apiError} />}

      {errorCount > 0 && (
        <p className="text-error text-sm">
          {t('quests_editor_error_summary', { count: errorCount })}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          isLoading={isSaving}
          isEnabled={!isSaving}
          isFullWidth={false}
        >
          {isNew ? t('quests_editor_create') : t('quests_editor_save')}
        </Button>
        {canDelete && (
          <button
            type="button"
            className="text-sm text-failure underline disabled:opacity-50"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {t('quests_editor_delete')}
          </button>
        )}
      </div>
    </form>
  );
};

export default QuestEditor;
