import { useState } from 'react';

import { useTranslations } from 'next-intl';
import objectPath from 'object-path';

import { CURRENCIES_WITH_LABELS } from '../constants';
import LearnEditor from './LearnEditor';
import Autocomplete from './Autocomplete';
import Checkbox from './Checkbox';
import DiscountsEditor from './DiscountsEditor';
import FieldsEditor from './FieldsEditor';
import PhotosEditor from './PhotosEditor';
import PriceEditor from './PriceEditor';
import RichTextEditor from './RichTextEditor';
import Switch from './Switch';
import Tag from './Tag';
import TicketOptionsEditor from './TicketOptionsEditor';

const FormField = ({
  data,
  update,
  className,
  label,
  placeholder,
  name,
  type,
  required,
  options,
  endpoint,
  searchField,
  multi,
  min,
  max,
  step,
  dynamicField = null,
}) => {
  const t = useTranslations();

  const [addTag, setAddTag] = useState('');

  const handleCheckboxChange = (optionValue) => {
    if (objectPath.get(data, name).includes(optionValue)) {
      update(
        name,
        objectPath.get(data, name).filter((value) => value !== optionValue),
      );
    } else {
      update(name, [...objectPath.get(data, name), optionValue]);
    }
  };

  return (
    <div className={`form-field w-full mb-6 form-type-${type}`} key={name}>
      {name !== 'start' && name !== 'end' && (
        <label className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {
        <>
          {['text', 'email', 'phone', 'hidden', 'number', 'date'].includes(
            type,
          ) && (
            <input
              type={type}
              step={step || 1}
              value={objectPath.get(data, name)}
              placeholder={placeholder}
              min={min}
              max={max}
              className={'bg-transparent ' + className}
              onChange={(e) => update(name, e.target.value)}
              required={required}
            />
          )}
          {type === 'longtext' && (
            <RichTextEditor
              value={objectPath.get(data, name)}
              placeholder={placeholder}
              onChange={(value) => update(name, value)}
            />
          )}
          {type === 'currency' && (
            <PriceEditor
              value={objectPath.get(data, name)}
              onChange={(value) => update(name, value)}
              placeholder={placeholder}
              required={required}
            />
          )}
          {type === 'photos' && (
            <PhotosEditor
              value={objectPath.get(data, name)}
              onChange={(value) => update(name, value)}
              required={required}
            />
          )}
          {type === 'currencies' && (
            <div className="currencies-group">
              {(objectPath.get(data, name) || []).map(
                (currencyGroup, index) => (
                  <div className="currency-group" key={`${name}.${index}.cur`}>
                    <select
                      value={objectPath.get(data, name)?.cur}
                      onChange={(e) =>
                        update(`${name}.${index}.cur`, e.target.value)
                      }
                    >
                      {CURRENCIES_WITH_LABELS.map((opt) => (
                        <option value={opt.value} key={opt.value}>
                          {opt.symbol} - {opt.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type={type}
                      value={objectPath.get(data, name)[index]?.val || ''}
                      placeholder={placeholder}
                      onChange={(e) =>
                        update(`${name}.${index}.val`, e.target.value)
                      }
                      required={required}
                    />
                    {index > 0 && (
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          update(
                            name,
                            (objectPath.get(data, name) || []).filter(
                              (c, i) => i !== index,
                            ),
                          );
                        }}
                      >
                        {t('form_field_remove_currency')}
                      </a>
                    )}
                  </div>
                ),
              )}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  update(
                    name,
                    (objectPath.get(data, name) || []).concat(
                      CURRENCIES_WITH_LABELS[0],
                    ),
                  );
                }}
              >
                {t('form_field_add_currency')}
              </a>
            </div>
          )}
          {type === 'select' && (
            <>
              <select
                value={objectPath.get(data, name)}
                onChange={(e) => update(name, e.target.value)}
                className={`px-2 py-1 min-w-[180px] ${className}`}
              >
                {(dynamicField?.name === name
                  ? dynamicField?.options
                  : options
                )?.map((opt) => (
                  <option value={opt.value} key={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </>
          )}
          {type === 'multi-select' && (
            <div className="flex flex-wrap gap-4 my-6">
              {dynamicField?.name === name
                ? dynamicField?.options.map((option) => (
                    <Checkbox
                      key={option}
                      onChange={() => handleCheckboxChange(option)}
                      checked={objectPath.get(data, name).includes(option)}
                      className="mb-4"
                    >
                      {option}
                    </Checkbox>
                  ))
                : options.map((option) => (
                    <Checkbox
                      key={option}
                      onChange={() => handleCheckboxChange(option)}
                      checked={objectPath.get(data, name).includes(option)}
                      className="mb-4"
                    >
                      {option}
                    </Checkbox>
                  ))}
            </div>
          )}

          {type === 'switch' && (
            <Switch
              name={name}
              className={className}
              onChange={(checked) => update(name, checked)}
              checked={!!objectPath.get(data, name)}
            />
          )}
          {type === 'tags' && (
            <div className={`${className || ''} space-x-1`}>
              {objectPath.get(data, name) &&
                objectPath.get(data, name).map((tag) => (
                  <Tag
                    key={tag}
                    color="blue"
                    remove={() => {
                      update(
                        name,
                        objectPath.get(data, name).filter((el) => el !== tag),
                        tag,
                        'DELETE',
                      );
                    }}
                  >
                    {tag}
                  </Tag>
                ))}
              <input
                type="text"
                className="mt-2"
                placeholder={placeholder || 'Add tag'}
                value={addTag}
                title="Press enter to add"
                onKeyPress={(e) => {
                  if (e.which === 13) {
                    e.preventDefault();
                    e.stopPropagation();
                    update(
                      name,
                      (objectPath.get(data, name) || []).concat(addTag),
                    );
                    setAddTag('');
                  }
                }}
                onChange={(e) => setAddTag(e.target.value)}
              />
            </div>
          )}
          {type === 'autocomplete' && (
            <div className="autocomplete-container">
              <div className="tags">
                {objectPath.get(data, name).map(
                  (item) =>
                    item._id && (
                      <span className="tag" key={item._id}>
                        {item.screenname || item.name}
                        <a
                          href="#"
                          className="remove"
                          onClick={(e) => {
                            e.preventDefault();
                            update(
                              name,
                              objectPath
                                .get(data, name)
                                .filter((el) => el._id !== item._id),
                              item,
                              'DELETE',
                            );
                          }}
                        >
                          X
                        </a>
                      </span>
                    ),
                )}
              </div>
              <Autocomplete
                multi={multi}
                endpoint={endpoint}
                searchField={searchField}
                value={objectPath.get(data, name)}
                onChange={(value, option, actionType) =>
                  update(name, value, option, actionType)
                }
              />
            </div>
          )}
          {type === 'ticketOptions' && (
            <TicketOptionsEditor
              value={objectPath.get(data, name)}
              onChange={(value) => update(name, value)}
            />
          )}
          {type === 'learnEditor' && (
            <LearnEditor
              value={objectPath.get(data, name)}
              onChange={(value) => update(name, value)}
            />
          )}
          {type === 'discounts' && (
            <DiscountsEditor
              value={objectPath.get(data, name)}
              onChange={(value) => update(name, value)}
            />
          )}
          {type === 'fields' && (
            <FieldsEditor
              value={objectPath.get(data, name)}
              onChange={(value) => update(name, value)}
            />
          )}
        </>
      }
    </div>
  );
};

FormField.defaultProps = {};

export default FormField;
