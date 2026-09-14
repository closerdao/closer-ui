import { useTranslations } from 'next-intl';

import config from '../configCached';
import { FIELD_CONTROL_CLASS } from '../constants/formStyles';
import type { CancellationPolicy } from '../types/event';
import Switch from './Switch';

type BucketKey = 'default' | 'lastmonth' | 'lastweek' | 'lastday';

/** Far from the event first, so the columns read as a countdown. */
const BUCKETS: {
  key: BucketKey;
  labelKey: string;
  configKey: string;
  platformDefault: number;
}[] = [
  {
    key: 'default',
    labelKey: 'event_cancellation_policy_bucket_default',
    configKey: 'cancellationPolicyDefault',
    platformDefault: 1,
  },
  {
    key: 'lastmonth',
    labelKey: 'event_cancellation_policy_bucket_lastmonth',
    configKey: 'cancellationPolicyLastmonth',
    platformDefault: 0.75,
  },
  {
    key: 'lastweek',
    labelKey: 'event_cancellation_policy_bucket_lastweek',
    configKey: 'cancellationPolicyLastweek',
    platformDefault: 0.5,
  },
  {
    key: 'lastday',
    labelKey: 'event_cancellation_policy_bucket_lastday',
    configKey: 'cancellationPolicyLastday',
    platformDefault: 0.5,
  },
];

const toPercent = (fraction: number) => Math.round(fraction * 10000) / 100;
const toFraction = (percent: number) => Math.round(percent * 100) / 10000;

interface Props {
  value?: CancellationPolicy | null;
  onChange: (value: CancellationPolicy) => void;
}

/**
 * The per-event override of the platform cancellation policy. Every bucket is
 * optional on purpose: an event that says nothing about a bucket keeps falling
 * back to the booking settings, which is what every event did before this
 * existed. Clearing an input is therefore a real action — it un-sets the
 * override rather than meaning "refund nothing".
 */
const CancellationPolicyEditor = ({ value, onChange }: Props) => {
  const t = useTranslations();
  const bookingConfig = (config as any)?.booking;

  const policy = value || {};
  // Only an explicit false turns refunds off — an untouched event is still
  // governed by the buckets below.
  const isRefundable = policy.refundable !== false;

  const updateBucket = (key: BucketKey, rawValue: string) => {
    const next: CancellationPolicy = { ...policy };
    if (rawValue === '') {
      delete next[key];
    } else {
      const percent = parseFloat(rawValue);
      if (isNaN(percent)) {
        return;
      }
      next[key] = toFraction(Math.min(100, Math.max(0, percent)));
    }
    onChange(next);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 flex flex-col gap-3">
      <Switch
        name="cancellationPolicyRefundable"
        label={t('event_cancellation_policy_refundable')}
        checked={isRefundable}
        onChange={(checked: boolean) =>
          onChange({ ...policy, refundable: checked })
        }
      />

      {isRefundable ? (
        <>
          <p className="text-xs text-gray-500 leading-relaxed">
            {t('event_cancellation_policy_intro')}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {BUCKETS.map(({ key, labelKey, configKey, platformDefault }) => {
              const fraction = policy[key];
              const isSet = typeof fraction === 'number';
              const fallback = toPercent(
                typeof bookingConfig?.[configKey] === 'number'
                  ? bookingConfig[configKey]
                  : platformDefault,
              );
              return (
                <div key={key} className="flex flex-col gap-1">
                  <label
                    htmlFor={`cancellationPolicy-${key}`}
                    className="text-[11px] uppercase tracking-[0.12em] text-gray-400 font-medium"
                  >
                    {t(labelKey)}
                  </label>
                  <div className="relative">
                    <input
                      id={`cancellationPolicy-${key}`}
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={isSet ? toPercent(fraction as number) : ''}
                      placeholder={String(fallback)}
                      className={`${FIELD_CONTROL_CLASS} !pr-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                      onChange={(e) => updateBucket(key, e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                      %
                    </span>
                  </div>
                  {!isSet && (
                    <span className="text-xs text-gray-400">
                      {t('event_cancellation_policy_uses_default', {
                        percent: `${fallback}%`,
                      })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <p className="text-xs text-gray-500 leading-relaxed">
          {t('event_cancellation_policy_non_refundable_hint')}
        </p>
      )}
    </div>
  );
};

export default CancellationPolicyEditor;
