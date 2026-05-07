import { STATUS_COLOR } from '../constants';

const BOOKING_STATUS_BADGE_SURFACE: Record<string, string> = {
  failure: 'bg-failure',
  pending: 'bg-pending',
  success: 'bg-success',
};

export interface BookingStatusTagProps {
  status?: string;
  label?: string;
}

const BookingStatusTag = ({ status, label }: BookingStatusTagProps) => {
  if (!status) {
    return null;
  }
  const tone = STATUS_COLOR[status];
  const surface =
    tone && BOOKING_STATUS_BADGE_SURFACE[tone]
      ? BOOKING_STATUS_BADGE_SURFACE[tone]
      : null;
  const displayLabel =
    label ?? status.replace(/-/g, ' ');
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
