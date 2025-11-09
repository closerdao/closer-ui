import React, { useState } from 'react';

import { useTranslations } from 'next-intl';

import api from '../../utils/api';
import { Button, Card, LinkButton, Spinner } from '../ui';
import Heading from '../ui/Heading';

// Extended Charge type for expense tracking
interface IncomeCharge {
  _id: string;
  date: string;
  created: string;
  status: string;
  amount: {
    total: {
      val: number;
      cur: string;
    };
  };
  description?: string;
  category?: string;
  documentDate?: string;
  meta: {
    type: string;
    comment?: string;
    uploadedDocumentUrl?: string | null;
    paymentIntentId?: string;
    toconlineData?: {
      description?: string;
      category?: string;
      comment?: string;
      supplier_business_name?: string;
      document_date?: string;
      tax_exemption_reason_id?: string;
      lines?: Array<{
        description: string;
        tax_percentage: number;
        tax_code: string;
        unit_price: number;
      }>;
    };
  };
}

interface IncomeChargesListingProps {
  charges: IncomeCharge[];
  onSuccess?: () => void;
}

const IncomeChargesListing: React.FC<IncomeChargesListingProps> = ({
  charges,
  onSuccess,
}) => {
  const t = useTranslations();
  const [loadingChargeId, setLoadingChargeId] = useState<string | null>(null);

  const saveToToconline = async (chargeId: string) => {
    try {
      setLoadingChargeId(chargeId);

      const res = await api.post('/toconline/income', {
        chargeId,
      });

      if (res.status === 200) {
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error('Save to Toconline error:', error);
    } finally {
      setLoadingChargeId(null);
    }
  };

  if (!charges || charges.length === 0) {
    return (
      <section className="flex flex-col gap-4">
        <Card className="bg-background p-0 sm:p-4 shadow-none sm:shadow-md">
          <div className="flex justify-between items-center mb-4">
            <Heading level={3}>{t('income_tracking_historic_income')}</Heading>
          </div>
          <div className="p-8 text-center">
            <div className="text-gray-500 text-lg mb-2">
              {t('income_tracking_no_income_found')}
            </div>
        
          </div>
        </Card>
      </section>
    );
  }

  return (
    <>
      <section className="flex flex-col gap-4">
        <Card className="bg-background p-0 sm:p-4 shadow-none sm:shadow-md">
          <div className="flex justify-between items-center mb-4">
            <Heading level={3}>{t('income_tracking_historic_income')}</Heading>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('expense_tracking_date')}
                  </th>
                  <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('expense_tracking_amount')}
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('income_tracking_type')}
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('income_tracking_status')}
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('expense_tracking_actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {charges.map((charge) => {
                  const amount = charge.amount?.total?.val || 0;
                  const date = new Date(
                    charge.date || charge.created,
                  ).toLocaleDateString();

                  return (
                    <tr
                      key={charge._id}
                      className={` ${
                        charge.status === 'paid'
                          ? 'bg-yellow-50'
                          : 'bg-green-100'
                      }`}
                    >
                      <td className="px-2 py-1 text-sm text-gray-900">
                        {date}
                      </td>
                      <td className="px-2 py-1 text-sm font-medium text-gray-900 text-right">
                        €{amount.toFixed(2)}
                      </td>
                      <td className="px-2 py-1 text-sm text-gray-900">
                        {charge.meta.type || t('income_tracking_not_available')}
                      </td>
                      <td className="px-2 py-1 text-sm text-gray-900">
                        {charge.status === 'paid'
                          ? t('income_tracking_not_sent_to_toconline')
                          : t('income_tracking_sent_to_toconline')}
                      </td>
                      <td className="px-2 py-1 text-sm text-gray-900 text-center flex gap-2">
                        <Button
                          variant="secondary"
                          size="small"
                          className="text-xs py-0 min-h-[24px] w-fit "
                          onClick={() => {
                            saveToToconline(charge._id);
                          }}
                          isEnabled={loadingChargeId !== charge._id}
                        >
                          {loadingChargeId === charge._id ? (
                            <div className="flex items-center gap-1">
                              <Spinner />
                              {t('income_tracking_saving_to_toconline')}
                            </div>
                          ) : (
                            t('income_tracking_save_to_toconline')
                          )}
                        </Button>
                        <LinkButton
                          href={`https://dashboard.stripe.com/payments/${charge.meta.paymentIntentId}`}
                          variant="secondary"
                          target="_blank"
                          size="small"
                          className="text-xs py-0 min-h-[24px] w-fit bg-background"
                        >
                          {t('income_tracking_view_in_stripe')}
                        </LinkButton>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </>
  );
};

export default IncomeChargesListing;
