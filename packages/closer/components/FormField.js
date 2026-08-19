import { useState } from 'react';

import { useTranslations } from 'next-intl';
import objectPath from 'object-path';

import { CURRENCIES_WITH_LABELS } from '../constants';
import Autocomplete from './Autocomplete';
import Checkbox from './Checkbox';
import DiscountsEditor from './DiscountsEditor';
import FieldsEditor from './FieldsEditor';
import LearnEditor from './LearnEditor';
import PhotoEditor from './PhotoEditor';
import PhotosEditor from './PhotosEditor';
import PriceEditor from './PriceEditor';
import RichTextEditor from './RichTextEditor';
import Switch from './Switch';
import Tag from './Tag';
import TicketOptionsEditor from './TicketOptionsEditor';

const TOKEN_PRICE_FIELDS = ['tokenPrice', 'tokenHourlyPrice'];
const FIAT_PRICE_FIELDS = ['fiatPrice', 'fiatHourlyPrice'];

/**
 * The shared field renderer for EditModel-style forms. Everything except the
 * data/update pair is optional, so callers only pass what a field needs.
 */
const FormField = ({
  data,
  update,
  className = /** @type {any} */ (undefined),
  label = /** @type {any} */ (undefined),
  placeholder = /** @type {any} */ (undefined),
  name = /** @type {any} */ (undefined),
  type = /** @type {any} */ (undefined),
  required = /** @type {any} */ (false),
  options = /** @type {any} */ (undefined),
  endpoint = /** @type {any} */ (undefined),
  searchField = /** @type {any} */ (undefined),
  multi = /** @type {any} */ (undefined),
  min = /** @type {any} */ (undefined),
  max = /** @type {any} */ (undefined),
  step = /** @type {any} */ (undefined),
  headingKey = /** @type {any} */ (undefined),
  messageKey = /** @type {any} */ (undefined),
  dynamicField = /** @type {any} */ (null),
  isPrimaryField = false,
  isSecondary = false,
  currencyConfig = /** @type {any} */ (null),
  error = /** @type {any} */ (''),
  hint = /** @type {any} */ (''),
  isDisabled = false,
}) => {
  const fixedCurrency =
    type === 'currency' &&
    currencyConfig &&
    (TOKEN_PRICE_FIELDS.includes(name)
      ? currencyConfig.tokenCur
      : FIAT_PRICE_FIELDS.includes(name)
      ? currencyConfig.fiatCur
      : null);
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

  const labelClass = isSecondary
    ? 'block text-foreground/70 text-xs font-medium mb-1.5'
    : 'block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2';
  const fieldWrapperClass = isSecondary ? 'mb-4' : 'mb-6';

  // Global form CSS strips borders off number/date/email inputs, so the boxed
  // styling has to override it explicitly.
  const boxedClass = `new-input w-full !px-3 !py-2.5 !rounded-lg !border !border-solid outline-none ${
    isDisabled ? 'bg-neutral text-gray-500 cursor-not-allowed' : 'bg-white'
  } ${error ? '!border-error' : '!border-gray-200 focus:!border-accent'}`;

  return (
    <div
      className={`form-field w-full ${fieldWrapperClass} form-type-${type}`}
      key={name}
    >
      {name !== 'start' && name !== 'end' && type !== 'note' && (
        <label className={labelClass}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {
        <>
          {type === 'note' && headingKey && messageKey && (
            <div className="border-t border-neutral-dark/20 pt-6 mt-2 space-y-2">
              <p className="uppercase tracking-wide text-gray-700 text-xs font-bold">
                {t(headingKey)}
              </p>
              <p className="text-sm text-gray-600">{t(messageKey)}</p>
            </div>
          )}
          {['text', 'email', 'phone', 'hidden', 'number', 'date'].includes(
            type,
          ) && (
            <input
              type={type}
              step={step || 1}
              value={objectPath.get(data, name) ?? ''}
              placeholder={placeholder}
              min={min}
              max={max}
              className={`${boxedClass} ${isSecondary ? 'text-sm' : ''} ${
                className || ''
              }`}
              onChange={(e) => update(name, e.target.value)}
              required={required}
              disabled={isDisabled}
              aria-invalid={error ? 'true' : undefined}
            />
          )}
          {type === 'longtext' && (
            <div
              className={
                isPrimaryField ? 'rich-text-editor-large min-h-[320px]' : ''
              }
            >
              <RichTextEditor
                value={objectPath.get(data, name)}
                placeholder={placeholder}
                onChange={(value) => update(name, value)}
              />
            </div>
          )}
          {type === 'textarea' && (
            <textarea
              value={objectPath.get(data, name) || ''}
              placeholder={placeholder}
              rows={4}
              className={`${boxedClass} text-sm resize-y min-h-[80px] ${
                className || ''
              }`}
              onChange={(e) => update(name, e.target.value)}
              required={required}
              disabled={isDisabled}
              aria-invalid={error ? 'true' : undefined}
            />
          )}
          {type === 'currency' && (
            <PriceEditor
              value={objectPath.get(data, name)}
              onChange={(value) => update(name, value)}
              placeholder={placeholder}
              required={required}
              fixedCurrency={fixedCurrency}
            />
          )}
          {type === 'photos' && (
            <PhotosEditor
              value={objectPath.get(data, name)}
              onChange={(value) => update(name, value)}
              required={required}
            />
          )}
          {type === 'photo' && (
            <PhotoEditor
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
                value={objectPath.get(data, name) ?? ''}
                onChange={(e) => update(name, e.target.value)}
                className={`${boxedClass} min-w-[180px] ${className || ''}`}
                disabled={isDisabled}
                aria-invalid={error ? 'true' : undefined}
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
              disabled={isDisabled}
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
              fixedCurrency={currencyConfig?.fiatCur ?? null}
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
          {hint && !error && (
            <p className="text-xs text-gray-400 mt-1">{hint}</p>
          )}
          {error && <p className="text-error text-sm mt-1">{error}</p>}
        </>
      }
    </div>
  );
};

export default FormField;
