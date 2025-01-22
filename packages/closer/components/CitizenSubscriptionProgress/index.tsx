import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import { User } from '../../contexts/auth/types';
import { Charge } from '../../types/booking';
import { Card, Heading } from '../ui';

interface CitizenSubscriptionProgressProps {
  member: User;
}

const CitizenSubscriptionProgress = ({
  member,
}: CitizenSubscriptionProgressProps) => {
  const t = useTranslations();

  const amountDue =
    (member?.citizenship?.totalToPayInFiat ?? 0) -
    (member?.citizenship?.charges?.reduce(
      (acc, charge) => acc + charge.amount.total.val,
      0,
    ) ?? 0);
  return (
    <Card className="w-full text-sm gap-4">
      <Heading level={3}>{t('subscriptions_citizen_progress')}</Heading>

      <p>
        {t('subscriptions_citizen_user_page_created')}{' '}
        <span className="font-bold">
          {dayjs(member?.citizenship?.createdAt).format(
            'YYYY-MM-DD',
          )}
        </span>
      </p>
      <p>
        {t('subscriptions_citizen_user_page_why')}{' '}
        <span className="font-bold">
          {member?.citizenship?.why}
        </span>
      </p>
      <p>
        {t('subscriptions_citizen_user_page_total_to_pay')}{' '}
        <span className="font-bold">
          €{member?.citizenship?.totalToPayInFiat}
        </span>
      </p>
      <p>
        {t('subscriptions_citizen_monthly_payment')}{' '}
        <span className="font-bold">
          €{member?.citizenship?.monthlyPaymentAmount}
        </span>
      </p>
      <p>
        {t('subscriptions_citizen_amount_due')}{' '}
        <span className="font-bold">€{amountDue}</span>
      </p>
      <p>
        {t('subscriptions_citizen_user_page_tokens_to_finance')}{' '}
        <span className="font-bold">
          {member?.citizenship?.tokensToFinance}
        </span>
      </p>
      {member?.citizenship?.charges &&
        member?.citizenship?.charges?.length > 0 && (
          <div className='space-y-4'>
            <Heading level={5}>
              Payment History
            </Heading>
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-6 py-3 text-left text-sm font-medium   tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3  text-sm font-medium  tracking-wider text-right">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {member?.citizenship?.charges.map(
                  (charge: Charge) => (
                    <tr key={charge.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm ">
                        {dayjs(charge.date).format('YYYY-MM-DD HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        €{charge.amount.total.val}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
    </Card>
  );
};

export default CitizenSubscriptionProgress;
