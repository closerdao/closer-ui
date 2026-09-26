import { useTranslations } from 'next-intl';

import { STATUS_COLOR } from '../constants';

const BOOKING_STATUS_BADGE_SURFACE: Record<string, string> = {
  failure: 'bg-failure',
  pending: 'bg-pending',
  success: 'bg-success',
};

export interface BookingStatusTagProps {
  status?: string;
}

const BookingStatusTag = ({ status }: BookingStatusTagProps) => {
  const t = useTranslations();
  if (!status) {
    return null;
  }
  const tone = STATUS_COLOR[status];
  const surface =
    tone && BOOKING_STATUS_BADGE_SURFACE[tone]
      ? BOOKING_STATUS_BADGE_SURFACE[tone]
      : null;
  const displayLabel =
    status === 'confirmed'
      ? t('booking_status_confirmed_title')
      : status.replace(/-/g, ' ');
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
        surface ? `${surface} text-white` : 'bg-neutral text-foreground'
      }`}
    >
      {displayLabel}
    </span>
  );
};

export default BookingStatusTag;
