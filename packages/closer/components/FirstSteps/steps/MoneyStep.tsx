import Link from 'next/link';

import { FC } from 'react';

import { ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { FirstStepDefinition } from '../../../constants/firstSteps';
import ConfigFields from '../ConfigFields';
import SaveBar from '../SaveBar';

/**
 * Payment settings, the legal entity the money is owed to, and an honest
 * account of the Stripe steps this page cannot do for you.
 *
 * Stripe keys reach the app through build-time environment variables, and the
 * connect flow at `/stripe-connect` hands back an account id that still has to
 * be put into the environment by hand. Pretending otherwise would leave a
 * village believing they can take card payments when they cannot.
 */

const ENTITY_FIELDS = [
  { key: 'legalName', labelKey: 'config_label_legalName' },
  { key: 'taxNumber', labelKey: 'config_label_taxNumber' },
  { key: 'iban', labelKey: 'config_label_iban' },
  { key: 'address', labelKey: 'config_label_address' },
];

const STRIPE_ENV_VARS = [
  'NEXT_PUBLIC_PLATFORM_STRIPE_PUB_KEY',
  'NEXT_PUBLIC_STRIPE_CONNECTED_ACCOUNT',
  'PLATFORM_STRIPE_SECRET_KEY',
];

export interface MoneyStepProps {
  step: FirstStepDefinition;
  paymentValue: Record<string, any>;
  onPaymentChange: (key: string, value: any) => void;
  entityValue: Record<string, any>;
  onEntityChange: (key: string, value: any) => void;
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
  onSave,
  isSaving,
  isDirty,
}) => {
  const t = useTranslations();

  return (
    <>
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">{t('first_steps_money_payment')}</h2>
        <ConfigFields
          slug={step.fields!.slug}
          keys={step.fields!.keys}
          value={paymentValue}
          onChange={onPaymentChange}
          disabled={isSaving}
        />
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

      <section className="rounded-md border border-dashed border-neutral-dark p-4">
        <p className="mb-1 font-bold">{t('first_steps_money_stripe_title')}</p>
        <p className="mb-3 text-sm">
          {t('first_steps_money_stripe_description')}
        </p>
        <ul className="mb-3 flex flex-col gap-1">
          {STRIPE_ENV_VARS.map((name) => (
            <li key={name} className="font-mono text-xs">
              {name}
            </li>
          ))}
        </ul>
        <Link
          href="/stripe-connect"
          className="flex w-fit items-center gap-1.5 text-sm underline"
        >
          {t('first_steps_link_stripe')}
          <ExternalLink size={14} />
        </Link>
      </section>

      <SaveBar onSave={onSave} isSaving={isSaving} isDirty={isDirty} />
    </>
  );
};

export default MoneyStep;
