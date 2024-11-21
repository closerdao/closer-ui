import Link from 'next/link';

import { Charge } from 'closer/types/booking';
import dayjs from 'dayjs';

import { priceFormat } from '../../utils/helpers';
import HeadingRow from '../ui/HeadingRow';

const Charges = ({ charges }: { charges: Charge[] }) => {
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
        {charges.map((charge) => (
          <div
            key={charge.id}
            className="grid grid-cols-4 grid-template-columns: 1fr 1fr 1fr 1fr; border-b border-gray-200 pb-1 text-md"
          >
            <p>{dayjs(charge.date).format('DD/MM/YYYY')}</p>
            <p>{charge.method}</p>
            <p>{charge.status}</p>
            <p className="text-right font-semibold">
              {charge.method === 'stripe' ? (
                <Link
                  className="bg-accent p-1 rounded-md text-white no-underline"
                  href={`https://dashboard.stripe.com/payments/${charge.meta.stripePaymentIntentId}`}
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
              ) : (
                priceFormat(charge.amount.total.val, charge.amount.total.cur)
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Charges;
