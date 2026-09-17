/**
 * The source types the backend aggregates, plus `custom` for the ones nothing
 * can count on its own. `custom` is what `POST /quest/:slug/action` accepts, so
 * it is the trigger every member-submitted source carries.
 */
export interface QuestTriggerEventOption {
  value: string;
  labelKey: string;
  /** A follow-up choice the trigger filter needs before it can match. */
  requires?: 'event';
  /** The trigger accepts an optional eventId scope. */
  acceptsEvent?: boolean;
  /** The trigger accepts a fullDuration flag. */
  acceptsFullDuration?: boolean;
  /** Never offered in the dropdown — it follows from admin verification. */
  isManual?: boolean;
}

export const QUEST_TRIGGER_EVENTS: QuestTriggerEventOption[] = [
  {
    value: 'booking.confirmed',
    labelKey: 'quests_trigger_booking_confirmed',
    requires: 'event',
  },
  {
    value: 'stay.completed',
    labelKey: 'quests_trigger_stay_completed',
    acceptsEvent: true,
    acceptsFullDuration: true,
  },
  {
    value: 'token.purchased',
    labelKey: 'quests_trigger_token_purchased',
  },
  {
    value: 'custom',
    labelKey: 'quests_trigger_custom',
    isManual: true,
  },
];

/** What a source verified automatically can listen for. */
export const QUEST_AUTOMATIC_TRIGGER_EVENTS = QUEST_TRIGGER_EVENTS.filter(
  (option) => !option.isManual,
);

/** Member-submitted sources always carry this trigger. */
export const QUEST_MANUAL_TRIGGER_EVENT = 'custom';

export const getQuestTriggerEvent = (value?: string) =>
  QUEST_TRIGGER_EVENTS.find((option) => option.value === value);

/**
 * What a currency award can be paid in. Credits settle through the credits
 * ledger; the token and fiat awards are recorded as pending for whoever
 * fulfils them.
 */
export interface QuestAwardCurrency {
  value: string;
  label: string;
  /** The API only permits token prizes on tokenGrowth quests. */
  tokenGrowthOnly?: boolean;
}

export const getQuestAwardCurrencies = ({
  bookingToken,
  fiatCurrency,
}: {
  bookingToken?: string;
  fiatCurrency?: string;
} = {}): QuestAwardCurrency[] => {
  const currencies: QuestAwardCurrency[] = [
    { value: 'credits', label: 'Credits 🥕' },
  ];
  if (bookingToken) {
    currencies.push({
      value: bookingToken,
      label: `$${bookingToken}`,
      tokenGrowthOnly: true,
    });
  }
  if (fiatCurrency) {
    currencies.push({ value: fiatCurrency, label: fiatCurrency });
  }
  return currencies;
};

/**
 * status moves only along draft → scheduled → live → locked → settled, or
 * aside to cancelled. locked and settled are reached through the lock/draw/
 * settle routes, never by editing the quest.
 */
export const QUEST_STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['draft', 'scheduled', 'cancelled'],
  scheduled: ['scheduled', 'live', 'cancelled'],
  live: ['live', 'cancelled'],
  locked: ['locked'],
  settled: ['settled'],
  cancelled: ['cancelled'],
};

export const getQuestStatusOptions = (current: string): string[] =>
  QUEST_STATUS_TRANSITIONS[current] || [current];
