import { ChangeEvent } from 'react';

import { useTranslations } from 'next-intl';

import { normalizeSubscriptionBillingPeriod } from '../../utils/subscriptions.helpers';
import ConfigImageUpload from '../ConfigImageUpload';
import { Button, Card, ErrorMessage } from '../ui';

interface Props {
  currentValue: string | number | boolean | any[];
  handleChange: (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
    key?: string,
    index?: null | number,
  ) => void;
  handleAddElement: (elementsKey?: string) => void;
  handleDeleteElement: (index: number, elementsKey?: string) => void;
  elementsKey: string;
  description: any;
  slug: string;
  resetToDefault: (name: string) => void;
  errors: Record<string, string | null>;
}

const ArrayConfig = ({
  currentValue,
  handleChange,
  handleAddElement,
  handleDeleteElement,
  elementsKey,
  description,
  slug,
  errors,
}: Props) => {
  const t = useTranslations();
  const isSubscriptionsConfig = slug === 'subscriptions';

  /**
   * Inner keys are generic (`name`, `type`, `label`), so the same key means
   * different things per config. Prefer a slug scoped message when one exists.
   */
  const innerLabel = (innerKey: string) => {
    const scopedKey = `config_label_${slug}_${innerKey}`;
    if (t.has(scopedKey)) return t(scopedKey);
    return t(`config_label_${innerKey}`);
  };

  return (
    <div className="flex flex-col gap-4">
      {Array.isArray(currentValue) &&
        currentValue.map((element: any, index: number) => {
          if (!element || typeof element !== 'object') {
            return null;
          }
          const elementType =
            description?.[elementsKey]?.type?.[0] ||
            description?.elements?.type?.[0];
          if (!elementType) {
            return null;
          }
          const billingPeriod = normalizeSubscriptionBillingPeriod(
            currentValue[index]?.billingPeriod,
          );
          const isMonthlyPlan = billingPeriod === 'month';
          return (
            <Card key={index}>
              {Object.entries(elementType).map(([innerKey]) => {
                const inputType = elementType[innerKey];
                const fieldValue = currentValue[index]?.[innerKey];

                if (
                  isSubscriptionsConfig &&
                  innerKey === 'firstMonthFree' &&
                  !isMonthlyPlan
                ) {
                  return null;
                }

                return (
                  <div
                    key={`${innerKey}-${index}`}
                    className="flex flex-col gap-1"
                  >
                    <label>{innerLabel(innerKey)}:</label>
                    {inputType === 'boolean' && (
                      <div className="flex gap-3">
                        <label className="flex gap-1 items-center">
                          <input
                            type="radio"
                            name={`${innerKey}-${index}`}
                            value="true"
                            checked={fieldValue === true}
                            onChange={(event) =>
                              handleChange(event, elementsKey, index)
                            }
                          />
                          {t('config_true')}
                        </label>
                        <label className="flex gap-1 items-center">
                          <input
                            type="radio"
                            name={`${innerKey}-${index}`}
                            value="false"
                            checked={fieldValue !== true}
                            onChange={(event) =>
                              handleChange(event, elementsKey, index)
                            }
                          />
                          {t('config_false')}
                        </label>
                      </div>
                    )}
                    {inputType === 'readonly-text' && (
                      <div className="flex flex-col gap-1">
                        <input
                          className="bg-neutral-dark/30 rounded-md p-1 text-foreground/70"
                          name={`${innerKey}-${index}`}
                          type="text"
                          value={
                            fieldValue
                              ? String(fieldValue)
                              : t('config_subscriptions_not_synced')
                          }
                          readOnly
                          disabled
                          autoComplete="off"
                          data-lpignore="true"
                        />
                        {innerKey === 'priceId' && (
                          <p className="text-xs text-foreground/60">
                            {t('config_subscriptions_price_id_help')}
                          </p>
                        )}
                        {innerKey === 'couponId' && (
                          <p className="text-xs text-foreground/60">
                            {t('config_subscriptions_coupon_id_help')}
                          </p>
                        )}
                      </div>
                    )}
                    {inputType === 'image' && (
                      <ConfigImageUpload
                        value={String(fieldValue ?? '')}
                        onChange={(url) =>
                          // ConfigImageUpload hands back a URL, but the config
                          // editor updates entries from change events, so wrap
                          // it in the shape handleChange expects.
                          handleChange(
                            {
                              target: {
                                name: `${innerKey}-${index}`,
                                value: url,
                              },
                            } as ChangeEvent<HTMLInputElement>,
                            elementsKey,
                            index,
                          )
                        }
                      />
                    )}
                    {(inputType === 'text' || inputType === 'number') && (
                      <input
                        className="bg-neutral rounded-md p-1"
                        name={`${innerKey}-${index}`}
                        onChange={(event) =>
                          handleChange(event, elementsKey, index)
                        }
                        type="text"
                        value={String(fieldValue ?? '')}
                        autoComplete="off"
                        data-lpignore="true"
                      />
                    )}
                    {inputType === 'long-text' && (
                      <textarea
                        className="bg-neutral rounded-md p-1"
                        name={innerKey}
                        onChange={(event) =>
                          handleChange(event, elementsKey, index)
                        }
                        rows={innerKey === 'body' ? 16 : 2}
                        value={String(fieldValue ?? '')}
                        autoComplete="off"
                        data-lpignore="true"
                      />
                    )}
                    {inputType?.type === 'select' && (
                      <select
                        className="px-2 py-1"
                        value={
                          innerKey === 'billingPeriod'
                            ? billingPeriod
                            : String(fieldValue ?? '')
                        }
                        onChange={(event) =>
                          handleChange(event, elementsKey, index)
                        }
                        name={`${innerKey}-${index}`}
                        autoComplete="off"
                        data-lpignore="true"
                      >
                        {inputType.enum.map((option: string) => {
                          const labelKey =
                            innerKey === 'billingPeriod'
                              ? `config_subscriptions_billing_period_${option}`
                              : null;
                          return (
                            <option value={option} key={option}>
                              {labelKey && t.has(labelKey)
                                ? t(labelKey)
                                : option}
                            </option>
                          );
                        })}
                      </select>
                    )}
                    {inputType?.type === 'multiselect' && (
                      <div className="flex flex-wrap gap-2">
                        {inputType.enum.map((option: string) => {
                          const currentValues = Array.isArray(fieldValue)
                            ? fieldValue
                            : [];
                          const isChecked = currentValues.includes(option);
                          return (
                            <label
                              key={option}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm cursor-pointer transition-colors ${
                                isChecked
                                  ? 'bg-accent text-white'
                                  : 'bg-neutral hover:bg-neutral-dark'
                              }`}
                            >
                              <input
                                type="checkbox"
                                name={`${innerKey}-${index}`}
                                value={option}
                                checked={isChecked}
                                onChange={() => {
                                  const newValues = isChecked
                                    ? currentValues.filter(
                                        (v: string) => v !== option,
                                      )
                                    : [...currentValues, option];
                                  const syntheticEvent = {
                                    target: {
                                      name: `${innerKey}-${index}`,
                                      value: JSON.stringify(newValues),
                                    },
                                  } as ChangeEvent<HTMLInputElement>;
                                  handleChange(
                                    syntheticEvent,
                                    elementsKey,
                                    index,
                                  );
                                }}
                                className="sr-only"
                              />
                              {t(`config_product_${option}`)}
                            </label>
                          );
                        })}
                      </div>
                    )}
                    {Object.keys(errors).length > 0 &&
                      errors[`${innerKey}-${index}` as keyof typeof errors] !==
                        null &&
                      errors[`${innerKey}-${index}` as keyof typeof errors] && (
                        <ErrorMessage
                          error={
                            errors[
                              `${innerKey}-${index}` as keyof typeof errors
                            ]?.toString() || ''
                          }
                        ></ErrorMessage>
                      )}
                  </div>
                );
              })}

              {(index > 0 || isSubscriptionsConfig) && (
                <Button
                  onClick={() => handleDeleteElement(index, elementsKey)}
                  variant="secondary"
                  size="small"
                  isFullWidth={false}
                  className="self-start"
                >
                  {t('generic_delete_button')}
                </Button>
              )}
            </Card>
          );
        })}

      <Button
        onClick={() => handleAddElement(elementsKey)}
        variant="secondary"
        size="small"
        isFullWidth={false}
        className="self-start"
      >
        {t('config_add_entry_button')}
      </Button>
    </div>
  );
};

export default ArrayConfig;
