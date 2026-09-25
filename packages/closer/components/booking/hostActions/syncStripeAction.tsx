import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import type { Stay, StayStripeIntent } from '../../../types/stay';
import { parseMessageFromError } from '../../../utils/common';
import {
  formatStayMoney,
  getStayStripeIntents,
  settleStayStripe,
} from '../../../utils/stays.api';
import { Information } from '../../ui';
import HostReasonModal from './hostReasonModal';

interface Props {
  stayId: string;
  onDone: (stay: Stay) => void | Promise<void>;
  onClose: () => void;
}

const SyncStripeAction = ({ stayId, onDone, onClose }: Props) => {
  const t = useTranslations();
  const [intents, setIntents] = useState<StayStripeIntent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getStayStripeIntents(stayId)
      .then((result) => {
        if (!cancelled) setIntents(result);
      })
      .catch((err) => {
        if (!cancelled) setError(parseMessageFromError(err));
      });
    return () => {
      cancelled = true;
    };
  }, [stayId]);

  const settleable = (intents ?? []).filter(
    (intent) => intent.action === 'settle',
  );

  return (
    <HostReasonModal
      title={t('host_actions_sync_stripe')}
      canSubmit={settleable.length > 0}
      onClose={onClose}
      onSubmit={async (reason) => {
        await onDone(await settleStayStripe(stayId, reason));
      }}
    >
      {error && (
        <Information className="border-error/30 bg-error/10 text-foreground">
          {error}
        </Information>
      )}
      {!intents && !error && (
        <p className="text-sm">{t('host_actions_sync_stripe_loading')}</p>
      )}
      {intents?.length === 0 && (
        <p className="text-sm">{t('host_actions_sync_stripe_none')}</p>
      )}
      {intents && intents.length > 0 && (
        <ul className="flex flex-col divide-y divide-line text-sm">
          {intents.map((intent) => (
            <li key={intent.id} className="flex flex-col gap-0.5 py-2">
              <p className="flex justify-between gap-2">
                <span className="break-all font-mono text-xs">{intent.id}</span>
                <span className="font-medium">
                  {formatStayMoney(intent.amount)}
                </span>
              </p>
              <p className="text-xs text-disabled">
                {intent.status} ·{' '}
                {t(
                  intent.action === 'settle'
                    ? 'host_actions_sync_stripe_will_settle'
                    : `host_actions_sync_stripe_${intent.reason}`,
                )}
              </p>
            </li>
          ))}
        </ul>
      )}
    </HostReasonModal>
  );
};

export default SyncStripeAction;
