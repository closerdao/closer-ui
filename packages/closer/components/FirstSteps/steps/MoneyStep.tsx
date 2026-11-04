import { FC } from 'react';

import { useTranslations } from 'next-intl';

import { FirstStepDefinition } from '../../../constants/firstSteps';
import { AccountingEntitiesConfig } from '../../../types/api';
import PaymentConnectPanel from '../../StripeConnect/PaymentConnectPanel';
import ConfigFields from '../ConfigFields';
import SaveBar from '../SaveBar';

const ENTITY_FIELDS = [
  { key: 'legalName', labelKey: 'config_label_legalName' },
  { key: 'taxNumber', labelKey: 'config_label_taxNumber' },
  { key: 'iban', labelKey: 'config_label_iban' },
  { key: 'address', labelKey: 'config_label_address' },
];

export interface MoneyStepProps {
  step: FirstStepDefinition;
  paymentValue: Record<string, any>;
  onPaymentChange: (key: string, value: any) => void;
  entityValue: Record<string, any>;
  onEntityChange: (key: string, value: any) => void;
  accountingEntities: AccountingEntitiesConfig;
  onConnectChanged: () => void | Promise<unknown>;
  connectRefreshKey?: string;
  onSave: () => void;
  isSaving: boolean;
  isDirty: boolean;
}

const MoneyStep: FC<MoneyStepProps> = ({
  step,
  paymentValue,
  onPaymentChange,
  entityValue,
  onEntityChange,
  accountingEntities,
  onConnectChanged,
  connectRefreshKey,
  onSave,
  isSaving,
  isDirty,
}) => {
  const t = useTranslations();
  const paymentKeys = step.fields?.keys ?? [];
  const cardIndex = paymentKeys.indexOf('cardPayment');
  const keysBeforeCard =
    cardIndex === -1 ? paymentKeys : paymentKeys.slice(0, cardIndex + 1);
  const keysAfterCard =
    cardIndex === -1 ? [] : paymentKeys.slice(cardIndex + 1);
  const showStripe = paymentValue?.cardPayment === true;

  return (
    <>
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">{t('first_steps_money_payment')}</h2>
        <ConfigFields
          slug={step.fields!.slug}
          keys={keysBeforeCard}
          value={paymentValue}
          onChange={onPaymentChange}
          disabled={isSaving}
        />
        {showStripe ? (
          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-bold">
              {t('first_steps_money_stripe_title')}
            </h3>
            <PaymentConnectPanel
              paymentConfig={paymentValue}
              accountingEntities={accountingEntities}
              returnTo="/first-steps"
              refreshKey={connectRefreshKey}
              onChanged={onConnectChanged}
            />
          </div>
        ) : null}
        {keysAfterCard.length > 0 ? (
          <ConfigFields
            slug={step.fields!.slug}
            keys={keysAfterCard}
            value={paymentValue}
            onChange={onPaymentChange}
            disabled={isSaving}
          />
        ) : null}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">{t('first_steps_money_entity')}</h2>
        <p className="text-sm">{t('first_steps_money_entity_hint')}</p>

        <div className="flex flex-col gap-4">
          {ENTITY_FIELDS.map(({ key, labelKey }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label htmlFor={`entity-${key}`} className="font-bold">
                {t(labelKey)}
              </label>
              <input
                id={`entity-${key}`}
                className="w-full rounded-md bg-neutral p-2"
                value={entityValue?.[key] ?? ''}
                disabled={isSaving}
                onChange={(event) => onEntityChange(key, event.target.value)}
              />
            </div>
          ))}
        </div>
      </section>

      <SaveBar onSave={onSave} isSaving={isSaving} isDirty={isDirty} />
    </>
  );
};

export default MoneyStep;
