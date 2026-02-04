import { FinanceApplication } from '../../types';

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import { User } from '../../contexts/auth/types';
import { Charge } from '../../types/booking';
import { Card, Heading } from '../ui';

interface Props {
  member: User;
  activeApplications: FinanceApplication[];
}

const FinancedTokenProgress = ({ member, activeApplications }: Props) => {
  const t = useTranslations();

  return (
    <Card className="w-full text-sm gap-2">
      <Heading level={3}>
        {t('subscriptions_citizen_finance_tokens_title')}
      </Heading>

      {activeApplications.map((application) => (
        <div
          key={application._id}
          className="bg-gray-100 p-4 rounded-md flex flex-col gap-2"
        >
          <p>
            {t('subscriptions_citizen_user_page_status')}{' '}
            <strong>{application.status}</strong>
          </p>
          <p>
            {t('subscriptions_citizen_user_page_tokens_to_finance')}{' '}
            <strong>{application.tokensToFinance}</strong>
          </p>
          <p>
            {' '}
            {t('subscriptions_citizen_user_page_total_to_pay')}{' '}
            <strong>€
            {application.totalToPayInFiat}</strong>
          </p>
          <p>
            {' '}
            {t('subscriptions_citizen_monthly_payment')}{' '}
            <strong>€{application.monthlyPaymentAmount}</strong>
          </p>
          <p>
            {t('subscriptions_citizen_user_page_down_payment')}{' '}
            <strong>€
            {application.downPaymentAmount}</strong>
          </p>

          <p>
            {t('subscriptions_citizen_user_page_created')}{' '}
            <strong>{dayjs(application.created).format('YYYY-MM-DD')}</strong>
          </p>

          {application?.charges && application?.charges?.length > 0 && (
            <div className="space-y-4">
              <Heading level={5}>
                {t('subscriptions_citizen_payment_history')}
              </Heading>
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-6 py-3 text-left text-sm font-medium   tracking-wider">
                      {t('subscriptions_citizen_payment_date')}
                    </th>
                    <th className="px-6 py-3  text-sm font-medium  tracking-wider text-right">
                      {t('subscriptions_citizen_payment_amount')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {application.charges.map((charge: Charge) => (
                    <tr key={charge.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm ">
                        {dayjs(charge.date).format('YYYY-MM-DD HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        €{charge.amount.total.val}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}

      <div>
        {member?.citizenship?.charges &&
          member?.citizenship?.charges?.length > 0 && (
            <div className="space-y-4">
              <Heading level={5}>
                {t('subscriptions_citizen_payment_history')}
              </Heading>
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-6 py-3 text-left text-sm font-medium   tracking-wider">
                      {t('subscriptions_citizen_payment_date')}
                    </th>
                    <th className="px-6 py-3  text-sm font-medium  tracking-wider text-right">
                      {t('subscriptions_citizen_payment_amount')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {member?.citizenship?.charges.map((charge: Charge) => (
                    <tr key={charge.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm ">
                        {dayjs(charge.date).format('YYYY-MM-DD HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        €{charge.amount.total.val}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </Card>
  );
};

export default FinancedTokenProgress;
