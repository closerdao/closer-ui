import { ReactNode } from 'react';

import { useTranslations } from 'next-intl';

import type { QuestAwardCurrency } from '../../constants/quests.constants';
import type { QuestAward } from '../../types/quest';
import FormField from '../FormField';

export const FieldSet = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <fieldset className="rounded-2xl border border-gray-200 p-5">
    <legend className="px-2 text-[11px] font-bold uppercase tracking-widest text-gray-500">
      {title}
    </legend>
    <div className="flex flex-col">{children}</div>
  </fieldset>
);

/**
 * An award is one of currency / perk / credit — the shape changes with the
 * kind, so the inputs swap with it.
 */
export const AwardEditor = ({
  award,
  onChange,
  isDisabled,
  currencies,
  error,
}: {
  award: QuestAward;
  onChange: (award: QuestAward) => void;
  isDisabled?: boolean;
  currencies: QuestAwardCurrency[];
  error?: string;
}) => {
  const t = useTranslations();
  const defaultCurrency = currencies[0]?.value || 'carrots';

  const update = (name: string, value: unknown) => {
    if (name === 'kind') {
      if (value === 'currency') {
        onChange({ kind: 'currency', cur: defaultCurrency, val: 1 });
      } else if (value === 'perk') {
        onChange({ kind: 'perk', title: '' });
      } else {
        onChange({ kind: 'credit', productId: '', qty: 1 });
      }
      return;
    }
    onChange({ ...award, [name]: value } as QuestAward);
  };

  return (
    <div>
      <FormField
        data={award}
        update={update}
        isDisabled={isDisabled}
        name="kind"
        label={t('quests_editor_award_kind')}
        type="select"
        isSecondary
        options={[
          { label: t('quests_editor_award_currency'), value: 'currency' },
          { label: t('quests_editor_award_perk'), value: 'perk' },
          { label: t('quests_editor_award_credit'), value: 'credit' },
        ]}
      />

      {award.kind === 'currency' && (
        <div className="grid grid-cols-2 gap-x-4">
          <FormField
            data={award}
            update={update}
            isDisabled={isDisabled}
            name="val"
            label={t('quests_editor_award_amount')}
            type="number"
            min={0}
            step="any"
            isSecondary
          />
          <FormField
            data={award}
            update={update}
            isDisabled={isDisabled}
            name="cur"
            label={t('quests_editor_award_currency_code')}
            type="select"
            isSecondary
            options={currencies.map((currency) => ({
              label: currency.label,
              value: currency.value,
            }))}
            error={error}
          />
        </div>
      )}

      {award.kind === 'perk' && (
        <>
          <FormField
            data={award}
            update={update}
            isDisabled={isDisabled}
            name="title"
            label={t('quests_editor_award_title')}
            type="text"
            required
            placeholder="Free treehouse upgrade"
            isSecondary
          />
          <div className="grid grid-cols-2 gap-x-4">
            <FormField
              data={award}
              update={update}
              isDisabled={isDisabled}
              name="type"
              label={t('quests_editor_award_perk_type')}
              type="text"
              placeholder="stay"
              isSecondary
            />
            <FormField
              data={award}
              update={update}
              isDisabled={isDisabled}
              name="description"
              label={t('quests_editor_award_description')}
              type="text"
              isSecondary
            />
          </div>
        </>
      )}

      {award.kind === 'credit' && (
        <div className="grid grid-cols-2 gap-x-4">
          <FormField
            data={award}
            update={update}
            isDisabled={isDisabled}
            name="productId"
            label={t('quests_editor_award_product')}
            type="text"
            required
            isSecondary
          />
          <FormField
            data={award}
            update={update}
            isDisabled={isDisabled}
            name="qty"
            label={t('quests_editor_award_qty')}
            type="number"
            min={1}
            isSecondary
          />
        </div>
      )}
    </div>
  );
};
