import Link from 'next/link';

import { Charge } from 'closer/types/booking';
import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import { ExternalLink } from 'lucide-react';

import { formatBookingLedgerChargeDisplay } from '../../utils/bookingChargesLedger.helpers';
import { priceFormat } from '../../utils/helpers';
import { IconHome } from '../BookingIcons';
import HeadingRow from '../ui/HeadingRow';

const ChargesTable = ({
  charges,
  embedded,
}: {
  charges: Charge[];
  embedded?: boolean;
}) => {
  const t = useTranslations();

  return (
    <div className={`flex flex-col gap-0.5 ${embedded ? 'text-sm' : ''}`}>
      <div
        className={`grid grid-cols-4 border-b pb-1 font-semibold ${
          embedded
            ? 'border-line text-[11px] uppercase tracking-wide text-disabled'
            : 'border-gray-200 text-md'
        }`}
      >
        <p className="text-left">{t('dashboard_charges_date')}</p>
        <p>{t('dashboard_charges_method')}</p>
        <p>{t('dashboard_charges_status')}</p>
        <p className="text-right">{t('dashboard_charges_total')}</p>
      </div>
    {charges?.map((charge) => (
      <div
        key={charge.id}
        className={`grid grid-cols-4 border-b pb-1 ${
          embedded ? 'border-line text-sm' : 'border-gray-200 text-md'
        }`}
      >
        <p>{dayjs(charge.date).format('DD/MM/YYYY')}</p>
        <p className="truncate">{charge.method}</p>
        <p className="truncate">{charge.status}</p>
        <div className="text-right font-semibold">
          {charge.method === 'stripe' ? (
            <div className="flex justify-end">
              <Link
                className={`inline-flex items-center gap-1 font-semibold text-accent no-underline hover:underline ${
                  embedded ? 'text-xs' : 'w-fit rounded-md bg-accent p-1 text-white'
                }`}
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
                <ExternalLink className={embedded ? 'h-3.5 w-3.5' : 'h-5 w-5'} />
              </Link>
            </div>
          ) : (
            formatBookingLedgerChargeDisplay(charge)
          )}
        </div>
      </div>
    ))}
    </div>
  );
};

const Charges = ({
  charges,
  embedded,
}: {
  charges: Charge[];
  embedded?: boolean;
}) => {
  const t = useTranslations();

  if (embedded) {
    return (
      <div className="flex flex-col gap-2 border-t border-line pt-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-disabled">
          {t('dashboard_charges_title')}
        </p>
        <ChargesTable charges={charges} embedded />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-6">
      <HeadingRow>
        <IconHome className="mr-4" />
        <span>{t('dashboard_charges_title')}</span>
      </HeadingRow>
      <ChargesTable charges={charges} />
    </div>
  );
};

export default Charges;
