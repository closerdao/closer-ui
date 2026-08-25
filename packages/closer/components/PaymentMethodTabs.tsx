import { CreditCard, Landmark, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';

export type PaymentMethodTab = 'card' | 'crypto' | 'bank';

/** Segmented card/crypto switcher shared by every checkout that offers both. */
export function PaymentMethodTabs({
  active,
  onChange,
  isEnabled = true,
  withBank = false,
  className,
}: {
  active: PaymentMethodTab;
  onChange: (tab: PaymentMethodTab) => void;
  /** Held open while a payment is in flight, so a switch cannot orphan it. */
  isEnabled?: boolean;
  /** Adds a bank-transfer tab (donations). */
  withBank?: boolean;
  className?: string;
}) {
  const t = useTranslations();
  const tabs: {
    id: PaymentMethodTab;
    label: string;
    Icon: typeof CreditCard;
  }[] = [
    { id: 'card', label: t('payment_tab_card'), Icon: CreditCard },
    { id: 'crypto', label: t('payment_tab_crypto'), Icon: Wallet },
    ...(withBank
      ? [{ id: 'bank' as const, label: t('payment_tab_bank'), Icon: Landmark }]
      : []),
  ];
  return (
    <div
      role="tablist"
      aria-label={t('stay_create_card_title')}
      className={`flex rounded-xl bg-gray-100 p-1 ${className || ''}`}
    >
      {tabs.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={active === id}
          disabled={!isEnabled}
          onClick={() => onChange(id)}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors min-h-[40px] disabled:opacity-60 disabled:cursor-not-allowed ${
            active === id
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  );
}

export default PaymentMethodTabs;
