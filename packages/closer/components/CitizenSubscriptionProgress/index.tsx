import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import { User } from '../../contexts/auth/types';
import { Card, Heading } from '../ui';

interface CitizenSubscriptionProgressProps {
  member: User;
}

const CitizenSubscriptionProgress = ({
  member,
}: CitizenSubscriptionProgressProps) => {
  const t = useTranslations();

  const isMember = member?.roles?.includes('member');

  return (
    <Card className="w-full text-sm gap-4">
      <Heading level={3}>{t('subscriptions_citizen_progress')}</Heading>

      {isMember && (
        <strong>{t('citizen_subscription_you_are_citizen')}</strong>
      )}

      <p>
        {t('subscriptions_citizen_user_page_created')}{' '}
        <span className="font-bold">
          {dayjs(member?.citizenship?.appliedAt).format('YYYY-MM-DD')}
        </span>
      </p>
      <p>
        {t('subscriptions_citizen_user_page_why')}{' '}
        <span className="font-bold">{member?.citizenship?.why}</span>
      </p>
    </Card>
  );
};

export default CitizenSubscriptionProgress;
