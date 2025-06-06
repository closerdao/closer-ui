import Link from 'next/link';

import { useEffect, useState } from 'react';

import { Charge } from 'closer/types/booking';
import dayjs from 'dayjs';

import api from '../../utils/api';
import { priceFormat } from '../../utils/helpers';
import HeadingRow from '../ui/HeadingRow';
import Spinner from '../ui/Spinner';

const Charges = ({ charges }: { charges: Charge[] }) => {
  const [chargesWithPaymentId, setChargesWithPaymentId] = useState<
    (Charge & { paymentId: string })[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const getChargesWithPaymentId = async (charges: Charge[]) => {
      try {
        setIsLoading(true);
        const localChargesWithPaymentId = await Promise.all(
          charges.map(async (charge) => {
            if (charge.method === 'stripe') {
              try {
                const res = await api.get(
                  `/stripe/get-connected-account-payment-id?paymentIntentId=${charge.meta.stripePaymentIntentId}`,
                );
                return { ...charge, paymentId: res?.data?.paymentId || '' };
              } catch (error) {
                console.error('error=', error);
                return { ...charge, paymentId: '' };
              }
            }
            return { ...charge, paymentId: '' };
          }),
        );
        setChargesWithPaymentId(localChargesWithPaymentId);
      } catch (error) {
        console.error('error=', error);
      } finally {
        setIsLoading(false);
      }
    };
    getChargesWithPaymentId(charges);
  }, []);

  return (
    <div className="flex flex-col gap-6 pb-6">
      <HeadingRow>
        <span className="mr-4">🏡</span>
        <span>Charges</span>
      </HeadingRow>

      <div className="flex flex-col gap-1">
        <div className="grid grid-cols-4 grid-template-columns: 1fr 1fr 1fr 1fr; border-b border-gray-200 pb-1 font-semibold text-md">
          <p className="text-left">Date</p>
          <p>Method</p>
          <p>Status</p>
          <p className="text-right">Amount</p>
        </div>
        {isLoading ? (
          <div className="flex p-2 h-full">
            <Spinner />
          </div>
        ) : (
          chargesWithPaymentId?.map((charge) => (
            <div
              key={charge.id}
              className="grid grid-cols-4 grid-template-columns: 1fr 1fr 1fr 1fr; border-b border-gray-200 pb-1 text-md"
            >
              <p>{dayjs(charge.date).format('DD/MM/YYYY')}</p>
              <p>{charge.method}</p>
              <p>{charge.status}</p>
              <div className="text-right font-semibold">
                {charge.method === 'stripe' ? (
                  <div>
                    <Link
                      className="bg-accent p-1 rounded-md text-white no-underline"
                      href={`https://dashboard.stripe.com/payments/${charge.paymentId}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {charge.status === 'paid'
                        ? priceFormat(
                            charge.amount.total?.val,
                            charge.amount.total?.cur,
                          )
                        : priceFormat(
                            charge.amount.totalRefunded?.val,
                            charge.amount.totalRefunded?.cur,
                          )}
                    </Link>
                  </div>
                ) : (
                  priceFormat(charge.amount.total.val, charge.amount.total.cur)
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Charges;
