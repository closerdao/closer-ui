import { useTranslations } from 'next-intl';

import { Input } from '../ui';

interface Props {
  updateApplication: (key: string, value: any) => void;
  application: any;
  buyMore?: boolean;
}

const CitizenGoodToBuy = ({
  updateApplication,
  application,
  buyMore,
}: Props) => {
  const t = useTranslations();

  return (
    <>
      <Input
        label={t('subscriptions_citizen_good_why')}
        value={application?.why || ''}
        onChange={(e) => updateApplication('why', e.target.value)}
        placeholder={t('generic_input_placeholder')}
      />
      <p>{t('subscriptions_citizen_good_how')}</p>
      <div className="space-y-2">
        {buyMore && (
          <div className="flex items-center gap-2">
            <input
              type="radio"
              id="iWantToApply"
              name="tokenChoice"
              className="w-4 h-4"
              checked={application?.intent?.iWantToApply}
              onChange={() =>
                updateApplication('intent', {
                  iWantToApply: true,
                  iWantToBuyTokens: false,
                  iWantToFinanceTokens: false,
                })
              }
            />
            <label htmlFor="iWantToApply" className="whitespace-nowrap">
              {t('subscriptions_citizen_i_own_tokens')}
            </label>
          </div>)}
        <div className="flex items-center gap-2">
          <input
            type="radio"
            id="iWantToBuyTokens"
            name="tokenChoice"
            className="w-4 h-4"
            checked={application?.intent?.iWantToBuyTokens}
            onChange={() =>
              updateApplication('intent', {
                iWantToApply: false,
                iWantToBuyTokens: true,
                iWantToFinanceTokens: false,
              })
            }
          />
          <label htmlFor="iWantToBuyTokens" className="whitespace-nowrap">
            {buyMore
              ? t('subscriptions_citizen_i_own_tokens_and_wish_to_buy_now')
              : t('subscriptions_citizen_i_wish_to_buy_now')}
          </label>
        </div>
        <div className="flex items-center gap-2 p2">
          <input
            type="radio"
            id="iWantToFinanceTokens"
            name="tokenChoice"
            className="w-4 h-4"
            checked={application?.intent?.iWantToFinanceTokens}
            onChange={() =>
              updateApplication('intent', {
                iWantToApply: false,
                iWantToBuyTokens: false,
                iWantToFinanceTokens: true,
              })
            }
          />
          <label htmlFor="iWantToFinanceTokens" className="whitespace-nowrap">
            {buyMore
              ? t('subscriptions_citizen_i_own_tokens_and_wish_to_finance_tokens')
              : t('subscriptions_citizen_i_wish_to_finance_tokens')}
          </label>
        </div>
      </div>
    </>
  );
};

export default CitizenGoodToBuy;
