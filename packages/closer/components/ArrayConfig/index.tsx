import React, { ChangeEvent, useState } from 'react';

import { __ } from '../../utils/helpers';
import { Button, Card, Heading } from '../ui';

interface Props {
  currentValue: string | number | boolean | any[];
  handleChange: (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
    key?: string,
    index?: null | number,
  ) => void;
  handleAddElement: () => void;
  handleDeleteElement: (index: number) => void;
  elementsKey: string;
  description: any;
  slug: string;
  resetToDefault: (name: string) => void;
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
}: Props) => {
  const isEmailConfig = slug === 'emails';
  const [openCards, setOpenCards] = useState<boolean[]>([]);

  const toggleCard = (index: number) => {
    setOpenCards((prevOpenCards) => {
      const newOpenCards = [...prevOpenCards];
      newOpenCards[index] = !newOpenCards[index];
      return newOpenCards;
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {Array.isArray(currentValue) &&
        currentValue.map((element: any, index: number) => {
          return (
            <Card
              key={index}
              className={`${
                isEmailConfig
                  ? openCards[index]
                    ? 'h-auto '
                    : 'h-[60px] overflow-hidden'
                  : ''
              }`}
            >
              {Object.entries(element).map(([innerKey]) => {
                const inputType = description.elements.type[0][innerKey];

                return (
                  <div key={`${innerKey}2`} className="flex flex-col gap-1">
                    {isEmailConfig && innerKey === 'name' && (
                      <button
                        onClick={() => toggleCard(index)}
                        className="flex justify-between items-center"
                      >
                        <Heading level={3}>
                          {__(`config_email_${String(currentValue[index][innerKey])}`)}
                        </Heading>

                        <svg
                          className={`inline-block border-black transform ${
                            openCards[index] ? 'rotate-90' : ''
                          }`}
                          width="7"
                          height="14"
                          viewBox="0 0 7 14"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M7 7L0.25 13.0622L0.250001 0.937822L7 7Z"
                            fill="#313131"
                          />
                        </svg>
                      </button>
                    )}

                    {!(isEmailConfig && innerKey === 'name') && (
                      <>
                        <label>{__(`config_label_${innerKey}`)}:</label>

                        {inputType === 'boolean' && (
                          <div className="flex gap-3">
                            <label className="flex gap-1 items-center">
                              <input
                                type="radio"
                                name={`${innerKey}${index}`}
                                value="true"
                                checked={currentValue[index][innerKey] === true}
                                onChange={(event) =>
                                  handleChange(event, elementsKey, index)
                                }
                              />
                              {__('config_true')}
                            </label>
                            <label className="flex gap-1 items-center">
                              <input
                                type="radio"
                                name={`${innerKey}${index}`}
                                value="false"
                                checked={
                                  currentValue[index][innerKey] === false
                                }
                                onChange={(event) =>
                                  handleChange(event, elementsKey, index)
                                }
                              />
                              {__('config_false')}
                            </label>
                          </div>
                        )}
                        {inputType === 'text' && (
                          <input
                            className="bg-neutral rounded-md p-1"
                            name={innerKey}
                            onChange={(event) =>
                              handleChange(event, elementsKey, index)
                            }
                            type="text"
                            value={String(currentValue[index][innerKey])}
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
                          />
                        )}
                        {inputType?.type === 'select' && (
                          <select
                            className="px-2 py-1"
                            value={String(currentValue[index][innerKey])}
                            onChange={(event) =>
                              handleChange(event, elementsKey, index)
                            }
                            name={innerKey}
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
                      </>
                    )}
                  </div>
                );
              })}

              {isEmailConfig && (
                <Button
                  className="w-[300px]"
                  onClick={() => resetToDefault(currentValue[index].name)}
                  type="secondary"
                >
                  {__('config_reset_to_default')}
                </Button>
              )}

              {index > 0 && !isEmailConfig && (
                <Button
                  onClick={() => handleDeleteElement(index)}
                  className="w-40"
                  type="secondary"
                >
                  {__('generic_delete_button')}
                </Button>
              )}
            </Card>
          );
        })}

      {slug !== 'emails' && (
        <Button onClick={handleAddElement} type="secondary">
          {__('config_add_entry_button')}
        </Button>
      )}
    </div>
  );
};

export default ArrayConfig;
