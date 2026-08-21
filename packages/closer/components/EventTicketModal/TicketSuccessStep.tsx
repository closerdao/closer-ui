import Link from 'next/link';

import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import ConfirmationCelebrationOverlay, {
  CONFIRMATION_CELEBRATION_DURATION_MS,
} from '../ConfirmationCelebrationOverlay';
import { Button } from '../ui';
import Heading from '../ui/Heading';

interface Props {
  ticketId: string;
  eventName: string;
  onClose: () => void;
}

/**
 * Step three. The confetti overlay covers the whole viewport for a moment and
 * then hands back to the modal, which keeps the link to the ticket itself.
 */
const TicketSuccessStep = ({ ticketId, eventName, onClose }: Props) => {
  const t = useTranslations();
  const [isCelebrating, setIsCelebrating] = useState(true);

  useEffect(() => {
    const timer = setTimeout(
      () => setIsCelebrating(false),
      CONFIRMATION_CELEBRATION_DURATION_MS,
    );
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <ConfirmationCelebrationOverlay
        show={isCelebrating}
        title={t('event_ticket_success_title', { event: eventName })}
      />
      <div className="flex flex-col items-center text-center gap-4 py-4">
        <span className="text-5xl" aria-hidden>
          🎟
        </span>
        <Heading level={2} className="text-xl">
          {t('event_ticket_success_title', { event: eventName })}
        </Heading>
        <p className="text-sm text-gray-600">
          {t('event_ticket_success_description')}
        </p>
        <Link
          href={`/tickets/${ticketId}`}
          className="text-accent underline"
          onClick={onClose}
        >
          {t('event_ticket_view_ticket')}
        </Link>
        <Button onClick={onClose}>{t('event_ticket_done')}</Button>
      </div>
    </>
  );
};

export default TicketSuccessStep;
