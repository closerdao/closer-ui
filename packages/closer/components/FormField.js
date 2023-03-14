import React, { useState } from 'react';

import objectPath from 'object-path';

import { __ } from '../utils/helpers';
import Autocomplete from './Autocomplete';
import DateTimePicker from './DateTimePicker';
import DiscountsEditor from './DiscountsEditor';
import FieldsEditor from './FieldsEditor';
import PhotosEditor from './PhotosEditor';
import PriceEditor, { currencies } from './PriceEditor';
import Switch from './Switch';
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
}) => {
  const [addTag, setAddTag] = useState('');
  return (
    <div className={`form-field w-full mb-6 form-type-${type}`} key={name}>
      <label className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {
        <>
          {['text', 'email', 'phone', 'hidden', 'number', 'date'].includes(
            type,
          ) && (
            <input
              type={type}
              value={data[name]}
              placeholder={placeholder}
              min={min}
              max={max}
              className={'bg-transparent ' + className}
              onChange={(e) => update(name, e.target.value)}
              required={required}
            />
          )}
          {type === 'datetime' && (
            <DateTimePicker
              value={data[name]}
              onChange={(value) => update(name, value)}
            />
          )}
          {type === 'longtext' && (
            <textarea
              value={data[name]}
              placeholder={placeholder}
              onChange={(e) => update(name, e.target.value)}
              required={required}
              className={`${className} textarea bg-transparent`}
            />
          )}
          {type === 'currency' && (
            <PriceEditor
              value={data[name]}
              onChange={(value) => update(name, value)}
              placeholder={placeholder}
              required={required}
            />
          )}
          {type === 'photos' && (
            <PhotosEditor
              value={data[name]}
              onChange={(value) => update(name, value)}
              required={required}
            />
          )}
          {type === 'currencies' && (
            <div className="currencies-group">
              {(data[name] || []).map((currencyGroup, index) => (
                <div className="currency-group" key={`${name}.${index}.cur`}>
                  <select
                    value={data[name]?.cur}
                    onChange={(e) =>
                      update(`${name}.${index}.cur`, e.target.value)
                    }
                  >
                    {currencies.map((opt) => (
                      <option value={opt.value} key={opt.value}>
                        {opt.symbol} - {opt.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type={type}
                    value={data[name][index]?.val || ''}
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
                          (data[name] || []).filter((c, i) => i !== index),
                        );
                      }}
                    >
                      {__('form_field_remove_currency')}
                    </a>
                  )}
                </div>
              ))}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  update(name, (data[name] || []).concat(currencies[0]));
                }}
              >
                {__('form_field_add_currency')}
              </a>
            </div>
          )}
          {type === 'select' && (
            <select
              value={data[name]}
              onChange={(e) => update(name, e.target.value)}
              className={className}
            >
              {options.map((opt) => (
                <option value={opt.value} key={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
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
            <div className={`${className} tags`}>
              {data[name] &&
                data[name].length > 0 &&
                data[name].map((tag) => (
                  <div className="tag" key={tag}>
                    <span className="ellipsis">{tag}</span>
                    <a
                      href="#"
                      className="remove"
                      onClick={() => {
                        update(
                          name,
                          data[name].filter((el) => el !== tag),
                          tag,
                          'DELETE',
                        );
                      }}
                    >
                      X
                    </a>
                  </div>
                ))}
              <input
                type="text"
                className="inline"
                placeholder={placeholder || 'Add tag'}
                value={addTag}
                title="Press enter to add"
                onKeyPress={(e) => {
                  if (e.which === 13) {
                    e.preventDefault();
                    e.stopPropagation();
                    update(name, data[name].concat(addTag));
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
                {data[name].map(
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
                              data[name].filter((el) => el._id !== item._id),
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
                value={data[name]}
                onChange={(value, option, actionType) =>
                  update(name, value, option, actionType)
                }
              />
            </div>
          )}
          {type === 'ticketOptions' && (
            <TicketOptionsEditor
              value={data[name]}
              onChange={(value) => update(name, value)}
            />
          )}
          {type === 'discounts' && (
            <DiscountsEditor
              value={data[name]}
              onChange={(value) => update(name, value)}
            />
          )}
          {type === 'fields' && (
            <FieldsEditor
              value={data[name]}
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
