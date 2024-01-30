import React, { ChangeEvent } from 'react';

import { __ } from '../../utils/helpers';
import { Button, Card } from '../ui';

interface Props {
  currentValue: string | number | boolean | any[];
  handleChange: (
    event: ChangeEvent<HTMLInputElement>,
    key?: string,
    index?: null | number,
  ) => void;
  handleAddElement: () => void;
  handleDeleteElement: (index: number) => void;
  plansKey: string;
}

const PlansConfig = ({
  currentValue,
  handleChange,
  handleAddElement,
  handleDeleteElement,
  plansKey,
}: Props) => {
  return (
    <div className="flex flex-col gap-4">
      {Array.isArray(currentValue) &&
        currentValue.map((element: any, index: number) => {
          return (
            <Card key={index}>
              {Object.entries(element).map(([innerKey], i: number) => {
                return (
                  <div key={`${innerKey}2`} className="flex flex-col gap-1">
                    <label>{__(`config_label_${innerKey}`)}:</label>

                    {typeof currentValue[index][innerKey] === 'boolean' ? (
                      <div className="flex gap-3">
                        <label className="flex gap-1 items-center">
                          <input
                            type="radio"
                            name={`${innerKey}${index}`}
                            value="true"
                            checked={currentValue[index][innerKey] === true}
                            onChange={(event) =>
                              handleChange(event, plansKey, index)
                            }
                          />
                          {__('config_true')}
                        </label>
                        <label className="flex gap-1 items-center">
                          <input
                            type="radio"
                            name={`${innerKey}${index}`}
                            value="false"
                            checked={currentValue[index][innerKey] === false}
                            onChange={(event) =>
                              handleChange(event, plansKey, index)
                            }
                          />
                          {__('config_false')}
                        </label>
                      </div>
                    ) : (
                      <input
                        className="bg-neutral rounded-md p-1"
                        name={innerKey}
                        onChange={(event) =>
                          handleChange(event, plansKey, index)
                        }
                        type="text"
                        value={String(currentValue[index][innerKey])}
                      />
                    )}
                  </div>
                );
              })}
              {index > 0 && (
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
      <Button onClick={handleAddElement} type="secondary">
        {__('config_add_plan_button')}
      </Button>
    </div>
  );
};

export default PlansConfig;
