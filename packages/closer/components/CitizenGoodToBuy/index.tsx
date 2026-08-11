import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import {
  CitizenApplication,
  CitizenTokenIntent,
} from '../../types/subscriptions';

interface Props {
  updateApplication: (
    key: keyof CitizenApplication,
    value: CitizenApplication[keyof CitizenApplication],
  ) => void;
  application: CitizenApplication;
  buyMore?: boolean;
  balanceTotal?: number;
  tokensRequired: number;
}

const CitizenGoodToBuy = ({
  updateApplication,
  application,
  buyMore,
  balanceTotal,
  tokensRequired,
}: Props) => {
  const t = useTranslations();
  const { user } = useAuth();
  const isMember = user?.roles?.includes('member');

  const tokensToBuy =
    balanceTotal && balanceTotal < tokensRequired
      ? tokensRequired - balanceTotal
      : tokensRequired;

  const options: {
    id: keyof CitizenTokenIntent;
    label: string;
    intent: CitizenTokenIntent;
  }[] = [
    ...(buyMore && !isMember
      ? [
          {
            id: 'iWantToApply' as const,
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
    <div className="flex flex-col gap-3">
      <p className="text-sm text-gray-600">
        {t('subscriptions_citizen_good_how')}
      </p>

      <div className="flex flex-col gap-2">
        {options.map((option) => {
          const isSelected = Boolean(application?.intent?.[option.id]);

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
