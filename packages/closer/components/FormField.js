import { useState } from 'react';

import { useTranslations } from 'next-intl';
import objectPath from 'object-path';

import { CURRENCIES_WITH_LABELS } from '../constants';
import LearnEditor from './LearnEditor';
import Autocomplete from './Autocomplete';
import Checkbox from './Checkbox';
import DiscountsEditor from './DiscountsEditor';
import FieldsEditor from './FieldsEditor';
import PhotoEditor from './PhotoEditor';
import PhotosEditor from './PhotosEditor';
import PriceEditor from './PriceEditor';
import RichTextEditor from './RichTextEditor';
import Switch from './Switch';
import Tag from './Tag';
import TicketOptionsEditor from './TicketOptionsEditor';

const TOKEN_PRICE_FIELDS = ['tokenPrice', 'tokenHourlyPrice'];
const FIAT_PRICE_FIELDS = ['fiatPrice', 'fiatHourlyPrice'];

const controlClassName =
  'new-input w-full rounded-xl border border-gray-200 !bg-gray-50 px-3.5 py-2.5 text-[15px] leading-snug text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-accent focus:!bg-white focus:ring-2 focus:ring-accent/20 disabled:opacity-50 disabled:cursor-not-allowed';

const selectClassName =
  'new-input w-full rounded-xl border border-gray-200 !bg-gray-50 px-3.5 py-2.5 text-[15px] leading-snug text-gray-900 outline-none transition-colors focus:border-accent focus:!bg-white focus:ring-2 focus:ring-accent/20 appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-10';

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
  headingKey,
  messageKey,
  dynamicField = /** @type {any} */ (null),
  isPrimaryField = false,
  isSecondary = false,
  currencyConfig = /** @type {any} */ (null),
}) => {
  const fixedCurrency =
    type === 'currency' &&
    currencyConfig &&
    (TOKEN_PRICE_FIELDS.includes(name) ? currencyConfig.tokenCur : FIAT_PRICE_FIELDS.includes(name) ? currencyConfig.fiatCur : null);
  const t = useTranslations();

  const [addTag, setAddTag] = useState('');

  // A record saved before the field existed — or one that simply never had a
  // value set — has no array here at all, so read it as an empty selection.
  const getSelectedValues = () => {
    const value = objectPath.get(data, name);
    return Array.isArray(value) ? value : [];
  };

  const handleCheckboxChange = (optionValue) => {
    const selected = getSelectedValues();
    if (selected.includes(optionValue)) {
      update(
        name,
        selected.filter((value) => value !== optionValue),
      );
    } else {
      update(name, [...selected, optionValue]);
    }
  };

  const labelClass =
    'block text-[11px] uppercase tracking-[0.12em] text-gray-400 font-medium mb-1.5';
  const fieldWrapperClass = isSecondary ? 'mb-4' : 'mb-5';

  return (
    <div className={`form-field w-full ${fieldWrapperClass} form-type-${type}`} key={name}>
      {name !== 'start' && name !== 'end' && type !== 'note' && (
        <label className={labelClass}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {
        <>
          {type === 'note' && headingKey && messageKey && (
            <div className="border-t border-gray-100 pt-5 mt-1 space-y-2">
              <p className="text-[11px] uppercase tracking-[0.12em] text-gray-400 font-medium">
                {t(headingKey)}
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">{t(messageKey)}</p>
            </div>
          )}
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
              className={`${controlClassName} ${isSecondary ? 'text-sm py-2' : ''} ${className || ''}`}
              onChange={(e) => update(name, e.target.value)}
              required={required}
            />
          )}
          {type === 'longtext' && (
            <div className={isPrimaryField ? 'rich-text-editor-large min-h-[320px]' : ''}>
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
              className={`${controlClassName} resize-y min-h-[96px] ${className || ''}`}
              onChange={(e) => update(name, e.target.value)}
              required={required}
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
            <div className="currencies-group flex flex-col gap-3">
              {(objectPath.get(data, name) || []).map(
                (currencyGroup, index) => (
                  <div className="currency-group flex flex-wrap items-center gap-2" key={`${name}.${index}.cur`}>
                    <select
                      value={objectPath.get(data, name)?.cur}
                      className={`${selectClassName} max-w-[200px]`}
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
                      className={`${controlClassName} max-w-[160px]`}
                      onChange={(e) =>
                        update(`${name}.${index}.val`, e.target.value)
                      }
                      required={required}
                    />
                    {index > 0 && (
                      <a
                        href="#"
                        className="text-sm text-gray-500 hover:text-gray-800 underline underline-offset-2"
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
                className="text-sm font-medium text-accent hover:text-accent-dark"
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
                className={`${selectClassName} ${className || ''}`}
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")",
                }}
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
            <div className="flex flex-wrap gap-3 my-2">
              {(dynamicField?.name === name
                ? dynamicField?.options
                : options
              )?.map((option) => (
                <Checkbox
                  key={option}
                  onChange={() => handleCheckboxChange(option)}
                  checked={getSelectedValues().includes(option)}
                  className="mb-0"
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
                className={`${controlClassName} mt-2`}
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
        </>
      }
    </div>
  );
};

export default FormField;
