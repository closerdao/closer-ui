import { ChangeEvent } from 'react';

import { useTranslations } from 'next-intl';

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
  resetToDefault,
  errors,
}: Props) => {
  const t = useTranslations();
  const isSubscriptionsConfig = slug === 'subscriptions';

  return (
    <div className="flex flex-col gap-4">
      {Array.isArray(currentValue) &&
        currentValue.map((element: any, index: number) => {
          if (!element || typeof element !== 'object') {
            return null;
          }
          const elementType = description?.[elementsKey]?.type?.[0] || description?.elements?.type?.[0];
          if (!elementType) {
            return null;
          }
          return (
            <Card key={index}>
              {Object.entries(element).map(([innerKey]) => {
                const inputType = elementType[innerKey];

                return (
                <div
                  key={`${innerKey}-${index}`}
                  className="flex flex-col gap-1"
                >
                  <>
                        <label>{t(`config_label_${innerKey}`)}:</label>
                        {inputType === 'boolean' && (
                          <div className="flex gap-3">
                            <label className="flex gap-1 items-center">
                              <input
                                type="radio"
                                name={`${innerKey}-${index}`}
                                value="true"
                                checked={currentValue[index][innerKey] === true}
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
                                checked={
                                  currentValue[index][innerKey] === false
                                }
                                onChange={(event) =>
                                  handleChange(event, elementsKey, index)
                                }
                              />
                              {t('config_false')}
                            </label>
                          </div>
                        )}
                        {(inputType === 'text' || inputType === 'number') && (
                          <input
                            className="bg-neutral rounded-md p-1"
                            name={`${innerKey}-${index}`}
                            onChange={(event) =>
                              handleChange(event, elementsKey, index)
                            }
                            type="text"
                            value={String(currentValue[index][innerKey])}
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
                            value={String(currentValue[index][innerKey])}
                            autoComplete="off"
                            data-lpignore="true"
                          />
                        )}
                        {inputType?.type === 'select' && (
                          <select
                            className="px-2 py-1"
                            value={String(currentValue[index][innerKey] || '')}
                            onChange={(event) =>
                              handleChange(event, elementsKey, index)
                            }
                            name={`${innerKey}-${index}`}
                            autoComplete="off"
                            data-lpignore="true"
                          >
                            {inputType.enum.map((option: string) => {
                              return (
                                <option value={option} key={option}>
                                  {option}
                                </option>
                              );
                            })}
                          </select>
                        )}
                        {inputType?.type === 'multiselect' && (
                          <div className="flex flex-wrap gap-2">
                            {inputType.enum.map((option: string) => {
                              const currentValues = Array.isArray(currentValue[index][innerKey]) 
                                ? currentValue[index][innerKey] 
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
                                        ? currentValues.filter((v: string) => v !== option)
                                        : [...currentValues, option];
                                      const syntheticEvent = {
                                        target: {
                                          name: `${innerKey}-${index}`,
                                          value: JSON.stringify(newValues),
                                        },
                                      } as ChangeEvent<HTMLInputElement>;
                                      handleChange(syntheticEvent, elementsKey, index);
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
                          errors[
                            `${innerKey}-${index}` as keyof typeof errors
                          ] !== null &&
                          errors[
                            `${innerKey}-${index}` as keyof typeof errors
                          ] && (
                            <ErrorMessage
                              error={
                                errors[
                                  `${innerKey}-${index}` as keyof typeof errors
                                ]?.toString() || ''
                              }
                            ></ErrorMessage>
                          )}
                  </>
                </div>
                );
              })}

              {index > 0 && !isSubscriptionsConfig && (
                <Button
                  onClick={() => handleDeleteElement(index, elementsKey)}
                  className="w-40"
                  variant="secondary"
                >
                  {t('generic_delete_button')}
                </Button>
              )}
            </Card>
          );
        })}

      <Button onClick={() => handleAddElement(elementsKey)} variant="secondary">
        {t('config_add_entry_button')}
      </Button>
    </div>
  );
};

export default ArrayConfig;
