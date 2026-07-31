import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';

interface Props {
  updateApplication: (key: string, value: any) => void;
  application: any;
  buyMore?: boolean;
  balanceTotal?: number;
}

const TOKENS_REQUIRED = 30;

const CitizenGoodToBuy = ({
  updateApplication,
  application,
  buyMore,
  balanceTotal,
}: Props) => {
  const t = useTranslations();
  const { user } = useAuth();
  const isMember = user?.roles?.includes('member');

  const tokensToBuy =
    balanceTotal && balanceTotal < TOKENS_REQUIRED
      ? TOKENS_REQUIRED - balanceTotal
      : TOKENS_REQUIRED;

  const options = [
    ...(buyMore && !isMember
      ? [
          {
            id: 'iWantToApply',
            label: t('subscriptions_citizen_i_own_tokens'),
            intent: {
              iWantToApply: true,
              iWantToBuyTokens: false,
              iWantToFinanceTokens: false,
            },
          },
        ]
      : []),
    {
      id: 'iWantToFinanceTokens',
      label: buyMore
        ? t('subscriptions_citizen_i_own_tokens_and_wish_to_finance_tokens')
        : t('subscriptions_citizen_i_wish_to_finance_tokens'),
      intent: {
        iWantToApply: false,
        iWantToBuyTokens: false,
        iWantToFinanceTokens: true,
      },
    },
    {
      id: 'iWantToBuyTokens',
      label: buyMore
        ? t('subscriptions_citizen_i_own_tokens_and_wish_to_buy_now')
        : t('subscriptions_citizen_i_wish_to_buy_now', { var: tokensToBuy }),
      intent: {
        iWantToApply: false,
        iWantToBuyTokens: true,
        iWantToFinanceTokens: false,
      },
    },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        {t('subscriptions_citizen_good_how')}
      </p>

      <div className="space-y-2">
        {options.map((option) => {
          const isSelected = Boolean(
            application?.intent?.[option.id as keyof typeof application.intent],
          );

          return (
            <label
              key={option.id}
              htmlFor={option.id}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition-colors ${
                isSelected
                  ? 'border-accent bg-accent-light/40 font-bold'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                id={option.id}
                name="tokenChoice"
                className="h-4 w-4 shrink-0 accent-accent"
                checked={isSelected}
                onChange={() => updateApplication('intent', option.intent)}
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default CitizenGoodToBuy;
