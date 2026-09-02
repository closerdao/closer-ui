import { useTranslations } from 'next-intl';

import { getBookingAnswers } from '../../utils/booking.helpers';
import BookingSurface, {
  BookingSectionEyebrow,
} from '../booking/bookingSurface';

interface Props {
  /**
   * `booking.fields` — one single-key object per question, keyed by the question
   * label the guest was shown (see `Booking['fields']`).
   */
  fields?: { [key: string]: string }[] | null;
  /** Renders as a bare list, for use inside an existing surface such as a card. */
  compact?: boolean;
  className?: string;
}

const BookingQuestionnaireAnswers = ({
  fields,
  compact = false,
  className,
}: Props) => {
  const t = useTranslations();
  const answers = getBookingAnswers(fields);

  if (!answers.length) {
    return null;
  }

  const list = (
    <div className="flex flex-col">
      {answers.map(({ question, answer }) => (
        <div
          key={question}
          className="flex flex-col gap-1 py-2 border-b border-line last:border-b-0 last:pb-0 first:pt-0"
        >
          <span className="text-xs uppercase tracking-wide text-complimentary-light">
            {question}
          </span>
          <p className="text-sm whitespace-pre-line break-words">{answer}</p>
        </div>
      ))}
    </div>
  );

  if (compact) {
    return (
      <div className={className}>
        <BookingSectionEyebrow className="mb-1">
          {t('booking_details_questionnaire_title')}
        </BookingSectionEyebrow>
        {list}
      </div>
    );
  }

  return (
    <BookingSurface
      tone="elevated"
      padding="md"
      className={`flex flex-col gap-3 ${className || ''}`}
    >
      <BookingSectionEyebrow>
        {t('booking_details_questionnaire_title')}
      </BookingSectionEyebrow>
      {list}
    </BookingSurface>
  );
};

export default BookingQuestionnaireAnswers;
