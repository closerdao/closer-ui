import { useEffect, useState } from 'react';

import { CURRENCIES_WITH_LABELS } from '../constants';

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

const PriceEditor = ({
  value = { val: 0.0, cur: CURRENCIES_WITH_LABELS[0].value },
  onChange = /** @type {any} */ (undefined),
  placeholder,
  required,
  fixedCurrency = /** @type {any} */ (null),
}) => {
  const effectiveCur =
    fixedCurrency || (value && value.cur) || CURRENCIES_WITH_LABELS[0].value;
  const [price, setPrice] = useState(
    value && (value.val !== undefined || value.val === 0)
      ? { ...value, cur: fixedCurrency || value.cur }
      : { val: 0.0, cur: effectiveCur },
  );
  const [valDraft, setValDraft] = useState(() => formatValForDisplay(value?.val));
  const [valFocused, setValFocused] = useState(false);

  const emitChange = (next) => {
    setPrice(next);
    if (onChange) onChange(next);
  };

  useEffect(() => {
    if (!fixedCurrency && !(value && value.cur)) {
      setPrice((prev) => ({
        val: prev?.val ?? 0,
        cur: CURRENCIES_WITH_LABELS[0].value,
      }));
    }
  }, [CURRENCIES_WITH_LABELS, fixedCurrency, value]);

  useEffect(() => {
    if (!value || valFocused) return;
    const nextCur = fixedCurrency || value.cur;
    const hasVal = value.val !== undefined && value.val !== null;
    const next = hasVal ? { ...value, cur: nextCur } : { val: 0.0, cur: nextCur };
    setPrice(next);
    setValDraft(formatValForDisplay(hasVal ? value.val : ''));
  }, [value, fixedCurrency, valFocused]);

  useEffect(() => {
    if (!fixedCurrency || !onChange || !value) return;
    if (value.cur === fixedCurrency) return;
    const hasVal = value.val !== undefined && value.val !== null;
    onChange({
      ...value,
      cur: fixedCurrency,
      val: hasVal ? Number(value.val) : 0,
    });
  }, [fixedCurrency, value?.cur, value?.val, onChange]);

  const commitDraft = () => {
    const parsed = parseDecimalInput(valDraft);
    const num = parsed === null ? 0 : parsed;
    const next = { ...price, val: num, cur: fixedCurrency || price.cur };
    emitChange(next);
    setValDraft(formatValForDisplay(num));
  };

  const handleValChange = (e) => {
    let raw = e.target.value.replace(',', '.');
    if (raw !== '' && !DECIMAL_INPUT_PATTERN.test(raw)) return;
    setValDraft(raw);
    const parsed = parseDecimalInput(raw);
    if (parsed !== null) {
      emitChange({ ...price, val: parsed, cur: fixedCurrency || price.cur });
    }
  };

  const displayValue = valFocused ? valDraft : formatValForDisplay(price.val);

  return (
    <div className="currency-group flex justify-start items-center">
      {fixedCurrency ? (
        <span className="w-64 mr-3 text-sm text-foreground/80" aria-hidden>
          {getCurrencyDisplay(fixedCurrency)}
        </span>
      ) : (
        <select
          value={price.cur}
          onChange={(e) => {
            const cur = e.target.value;
            const next = { ...price, cur };
            emitChange(next);
          }}
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
          setValDraft(formatValForDisplay(price.val));
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
