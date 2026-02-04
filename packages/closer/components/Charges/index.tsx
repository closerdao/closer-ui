import Link from 'next/link';

import { Charge } from 'closer/types/booking';
import dayjs from 'dayjs';


import { priceFormat } from '../../utils/helpers';
import { IconHome } from '../BookingIcons';
import HeadingRow from '../ui/HeadingRow';
import { ExternalLink } from 'lucide-react';

const Charges = ({ charges }: { charges: Charge[] }) => {
  

  return (
    <div className="flex flex-col gap-6 pb-6">
      <HeadingRow>
        <IconHome className="mr-4" />
        <span>Charges</span>
      </HeadingRow>

      <div className="flex flex-col gap-1">
        <div className="grid grid-cols-4 grid-template-columns: 1fr 1fr 1fr 1fr; border-b border-gray-200 pb-1 font-semibold text-md">
          <p className="text-left">Date</p>
          <p>Method</p>
          <p>Status</p>
          <p className="text-right">Amount</p>
        </div>
        {charges?.map((charge) => (
          <div
            key={charge.id}
            className="grid grid-cols-4 grid-template-columns: 1fr 1fr 1fr 1fr; border-b border-gray-200 pb-1 text-md"
          >
            <p>{dayjs(charge.date).format('DD/MM/YYYY')}</p>
            <p>{charge.method}</p>
            <p>{charge.status}</p>
            <div className="text-right font-semibold">
              {charge.method === 'stripe' ? (
                <div className="flex justify-end ">
                  <Link
                    className="items-center flex gap-1 w-fit bg-accent p-1 rounded-md text-white no-underline"
                    href={`https://dashboard.stripe.com/payments/${charge?.meta?.stripePaymentIntentId}`}
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
                    <ExternalLink className="w-5 h-5" />
                  </Link>
                </div>
              ) : (
                priceFormat(charge.amount.total.val, charge.amount.total.cur)
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Charges;
