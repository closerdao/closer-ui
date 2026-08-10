import { useTranslations } from 'next-intl';
import Heading from '../ui/Heading';

interface FriendsBookingBlockProps {
  isFriendsBooking?: boolean;
}

const FriendsBookingBlock = ({
  isFriendsBooking,
}: FriendsBookingBlockProps) => {
  const t = useTranslations();

  if (!isFriendsBooking) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 mt-4 rounded-lg p-4 mb-4">
      <p className="text-blue-800 text-sm">
        <Heading level={3} className="font-semibold">
          {t('friends_booking_mode_title')}
        </Heading>{' '}
        {t('friends_booking_mode_description')}
      </p>
    </div>
  );
};

export default FriendsBookingBlock;
