import { useEffect, useRef, useState } from 'react';

import { CURRENCIES_WITH_LABELS } from '../constants';

const DEFAULT_CURRENCY = CURRENCIES_WITH_LABELS[0].value;

const getCurrencyDisplay = (cur) => {
  const found = CURRENCIES_WITH_LABELS.find((opt) => opt.value === cur);
  return found ? `${found.symbol} - ${found.label}` : cur;
};

const DECIMAL_INPUT_PATTERN = /^\d*\.?\d*$/;

const formatValForDisplay = (val) => {
  if (val === undefined || val === null || Number.isNaN(Number(val))) {
    return '';
  }
  const n = Number(val);
  if (!Number.isFinite(n)) return '';
  return String(n);
};

const parseDecimalInput = (raw) => {
  const s = String(raw).trim().replace(',', '.');
  if (s === '' || s === '.' || /\.$/.test(s)) return null;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
};

const toNumber = (val) =>
  val === undefined || val === null || Number.isNaN(Number(val))
    ? 0
    : Number(val);

// The price itself lives in the parent — mirroring it into local state and
// syncing that mirror back from `value` loops forever, because callers pass a
// fresh object literal on every render. Only the in-progress text is local.
const PriceEditor = ({
  value = /** @type {any} */ (undefined),
  onChange = /** @type {any} */ (undefined),
  placeholder,
  required,
  fixedCurrency = /** @type {any} */ (null),
}) => {
  const cur = fixedCurrency || value?.cur || DEFAULT_CURRENCY;
  const val = value?.val;

  const [valDraft, setValDraft] = useState(() => formatValForDisplay(val));
  const [valFocused, setValFocused] = useState(false);

  const valueRef = useRef(value);
  valueRef.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const emitChange = (next) => {
    if (onChange) onChange(next);
  };

  // Push the fixed currency back up once, when the stored record disagrees with
  // it. Depends on primitives only, so a new `value` identity can't re-trigger
  // it. A field the user has never filled in has nothing to normalise.
  useEffect(() => {
    const current = valueRef.current;
    if (!fixedCurrency || !current || current.cur === fixedCurrency) return;
    if (!onChangeRef.current) return;
    const isEmpty =
      (current.cur === undefined || current.cur === null) &&
      (current.val === undefined || current.val === null);
    if (isEmpty) return;
    onChangeRef.current({
      ...current,
      cur: fixedCurrency,
      val: toNumber(current.val),
    });
  }, [fixedCurrency, value?.cur]);

  const commitDraft = () => {
    const parsed = parseDecimalInput(valDraft);
    const num = parsed === null ? 0 : parsed;
    emitChange({ ...(value || {}), val: num, cur });
    setValDraft(formatValForDisplay(num));
  };

  const handleValChange = (e) => {
    const raw = e.target.value.replace(',', '.');
    if (raw !== '' && !DECIMAL_INPUT_PATTERN.test(raw)) return;
    setValDraft(raw);
    const parsed = parseDecimalInput(raw);
    if (parsed !== null) {
      emitChange({ ...(value || {}), val: parsed, cur });
    }
  };

  const displayValue = valFocused ? valDraft : formatValForDisplay(val);

  return (
    <div className="currency-group flex justify-start items-center">
      {fixedCurrency ? (
        <span className="w-64 mr-3 text-sm text-foreground/80" aria-hidden>
          {getCurrencyDisplay(fixedCurrency)}
        </span>
      ) : (
        <select
          value={cur}
          onChange={(e) =>
            emitChange({
              ...(value || {}),
              val: toNumber(val),
              cur: e.target.value,
            })
          }
          className="w-64 mr-3"
        >
          {CURRENCIES_WITH_LABELS.map((opt) => (
            <option value={opt.value} key={opt.value}>
              {opt.symbol} - {opt.label}
            </option>
          ))}
        </select>
      )}
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        className="w-32"
        value={displayValue}
        placeholder={placeholder}
        onFocus={() => {
          setValFocused(true);
          setValDraft(formatValForDisplay(val));
        }}
        onBlur={() => {
          setValFocused(false);
          commitDraft();
        }}
        onChange={handleValChange}
        required={required}
      />
    </div>
  );
};

export default PriceEditor;
