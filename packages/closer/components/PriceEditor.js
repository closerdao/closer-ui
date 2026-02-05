import { useEffect, useState } from 'react';

import { CURRENCIES_WITH_LABELS } from '../constants';

const getCurrencyDisplay = (cur) => {
  const found = CURRENCIES_WITH_LABELS.find((opt) => opt.value === cur);
  return found ? `${found.symbol} - ${found.label}` : cur;
};

const PriceEditor = ({ value = { val: 0.0, cur: CURRENCIES_WITH_LABELS[0].value }, onChange = /** @type {any} */ (undefined), placeholder, required, fixedCurrency = /** @type {any} */ (null) }) => {
  const effectiveCur = fixedCurrency || (value && value.cur) || CURRENCIES_WITH_LABELS[0].value;
  const [price, setPrice] = useState(
    value && (value.val !== undefined || value.val === 0)
      ? { ...value, cur: fixedCurrency || value.cur }
      : { val: 0.0, cur: effectiveCur },
  );
  const updateValue = (val) => {
    const update = { ...price, val: parseFloat(val), cur: fixedCurrency || price.cur };
    setPrice(update);
    onChange && onChange(update);
  };
  const updateCurrency = (cur) => {
    if (fixedCurrency) return;
    const update = { ...price, cur };
    setPrice(update);
    onChange && onChange(update);
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
    if (!value) return;
    const nextCur = fixedCurrency || value.cur;
    const hasVal = value.val !== undefined && value.val !== null;
    setPrice(hasVal ? { ...value, cur: nextCur } : { val: 0.0, cur: nextCur });
  }, [value, fixedCurrency]);

  return (
    <div className="currency-group flex justify-start items-center">
      {fixedCurrency ? (
        <span className="w-64 mr-3 text-sm text-foreground/80" aria-hidden>
          {getCurrencyDisplay(fixedCurrency)}
        </span>
      ) : (
        <select
          value={price.cur}
          onChange={(e) => updateCurrency(e.target.value)}
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
        type="Number"
        min="0.00"
        max="1000000.00"
        step="0.01"
        className="w-32"
        value={price.val}
        placeholder={placeholder}
        onChange={(e) => updateValue(e.target.value)}
        required={required}
      />
    </div>
  );
};

export default PriceEditor;
