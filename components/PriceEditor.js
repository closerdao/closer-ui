import { useEffect, useState } from 'react';

export const currencies = [
  {
    value: 'EUR',
    label: 'Euros',
    symbol: '€',
  },
  {
    value: 'USD',
    label: 'US Dollars',
    symbol: '$',
  },
];

const PriceEditor = ({ value, onChange, placeholder, required }) => {
  const [price, setPrice] = useState(value);
  const updateCurrency = (cur) => {
    const update = { ...price, cur };
    setPrice(update);
    onChange && onChange(update);
  };
  const updateValue = (val) => {
    const update = { ...price, val: parseFloat(val) };
    setPrice(update);
    onChange && onChange(update);
  };

  useEffect(() => {
    setPrice(value);
  }, [value]);

  return (
    <div className="currency-group flex justify-start items-center">
      <select
        value={price.cur}
        onChange={(e) => updateCurrency(e.target.value)}
        className="w-64 mr-3"
      >
        {currencies.map((opt) => (
          <option value={opt.value} key={opt.value}>
            {opt.symbol} - {opt.label}
          </option>
        ))}
      </select>
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

PriceEditor.defaultProps = {
  onChange: null,
  value: {
    val: 0.0,
    cur: currencies[0].value,
  },
};

export default PriceEditor;
