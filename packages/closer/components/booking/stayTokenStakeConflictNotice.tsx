import Link from 'next/link';

import { useEffect, useState } from 'react';

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import type { Booking } from '../../types/booking';
import type { Stay } from '../../types/stay';
import { fetchStayHoldingNights } from '../../utils/stayTokenStakeConflict';
import { ErrorMessage } from '../ui';
import Button from '../ui/Button';

const formatStayRange = (start: string, end: string) =>
  `${dayjs(start).format('MMM D')} – ${dayjs(end).format('MMM D, YYYY')}`;

interface Props {
  stay: Stay;
  /** Omitted when this stay can no longer switch to fiat. */
  onPayInFiat?: () => void;
  isSwitchingToFiat?: boolean;
}

const StayTokenStakeConflictNotice = ({
  stay,
  onPayInFiat,
  isSwitchingToFiat = false,
}: Props) => {
  const t = useTranslations();
  const { user } = useAuth();
  const [holdingStay, setHoldingStay] = useState<Booking | null>(null);

  useEffect(() => {
    if (!user?._id) return;
    let cancelled = false;
    fetchStayHoldingNights(stay, user._id)
      .then((found) => {
        if (!cancelled) setHoldingStay(found);
      })
      // Without the owning booking the generic copy still names the way out.
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [stay._id, stay.start, stay.end, user?._id]);

  return (
    <div role="alert" aria-live="assertive" className="flex flex-col gap-3">
      <ErrorMessage
        error={
          holdingStay
            ? t('stay_create_token_stake_existing_conflict_booking', {
                dates: formatStayRange(holdingStay.start, holdingStay.end),
              })
            : t('stay_create_token_stake_existing_conflict')
        }
      />
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        {holdingStay && (
          <Link
            href={`/stay/${holdingStay._id}`}
            className="text-sm underline text-accent"
          >
            {t('stay_create_token_stake_existing_conflict_view_booking')}
          </Link>
        )}
        {onPayInFiat && (
          <Button
            size="small"
            isFullWidth={false}
            onClick={onPayInFiat}
            isEnabled={!isSwitchingToFiat}
            isLoading={isSwitchingToFiat}
            className="!normal-case tracking-normal min-h-[40px] text-sm"
          >
            {t('stay_create_token_stake_existing_conflict_pay_fiat')}
          </Button>
        )}
      </div>
    </div>
  );
};

export default StayTokenStakeConflictNotice;
