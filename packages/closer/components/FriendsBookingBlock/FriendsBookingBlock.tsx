import { useTranslations } from 'next-intl';

import type { StayFriendEmails } from '../../types/stay';
import { friendEmailsToList } from '../../utils/bookingUtils';
import Heading from '../ui/Heading';

interface FriendsBookingBlockProps {
  isFriendsBooking?: boolean;
  friendEmails?: StayFriendEmails | null;
}

const FriendsBookingBlock = ({
  isFriendsBooking,
  friendEmails,
}: FriendsBookingBlockProps) => {
  const t = useTranslations();

  if (!isFriendsBooking) {
    return null;
  }

  const emails = friendEmailsToList(friendEmails);

  return (
    <div
      className="bg-blue-50 border border-blue-200 mt-4 rounded-lg p-4 mb-4 flex flex-col gap-1"
      data-testid="friends-booking-block"
    >
      <Heading level={3} className="font-semibold text-blue-800">
        {t('friends_booking_mode_title')}
      </Heading>
      <p className="text-blue-800 text-sm">
        {t('friends_booking_mode_description')}
      </p>
      {emails.length > 0 && (
        <p className="text-blue-800 text-sm break-all">
          {t('friends_booking_mode_for', { emails: emails.join(', ') })}
        </p>
      )}
    </div>
  );
};

export default FriendsBookingBlock;
