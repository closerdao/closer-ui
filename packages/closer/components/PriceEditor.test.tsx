import { useState } from 'react';

import { fireEvent, render, screen } from '@testing-library/react';

import { CURRENCIES_WITH_LABELS } from '../constants';
import PriceEditor from './PriceEditor';

const [FIRST_CURRENCY, SECOND_CURRENCY] = CURRENCIES_WITH_LABELS.map(
  (option) => option.value,
);

// Every real caller builds the value object inline, so PriceEditor gets a new
// object identity on each render. Anything keyed off that identity loops.
const Host = ({
  initial = {},
  fixedCurrency = null,
  onEmit,
}: {
  initial?: { val?: number; cur?: string };
  fixedCurrency?: string | null;
  onEmit?: (next: any) => void;
}) => {
  const [price, setPrice] = useState<any>(initial);
  return (
    <PriceEditor
      value={{ val: price.val, cur: price.cur }}
      fixedCurrency={fixedCurrency}
      onChange={(next: any) => {
        setPrice(next);
        onEmit?.(next);
      }}
    />
  );
};

describe('PriceEditor', () => {
  it('does not re-render forever when the parent passes a fresh value object', () => {
    render(<Host initial={{ val: 12, cur: FIRST_CURRENCY }} />);

    expect(screen.getByRole('textbox')).toHaveValue('12');
    expect(screen.getByRole('combobox')).toHaveValue(FIRST_CURRENCY);
  });

  it('settles when the parent has no value for the field at all', () => {
    // FormField reads the field straight off the record, so an unset price
    // arrives as undefined on every single render.
    const onChange = jest.fn();
    render(<PriceEditor onChange={onChange} fixedCurrency={FIRST_CURRENCY} />);

    expect(screen.getByRole('textbox')).toHaveValue('');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('leaves a field that has no stored price alone', () => {
    const onEmit = jest.fn();
    render(<Host fixedCurrency={FIRST_CURRENCY} onEmit={onEmit} />);

    expect(screen.getByRole('textbox')).toHaveValue('');
    expect(onEmit).not.toHaveBeenCalled();
  });

  it('normalises a mismatched currency to the fixed one exactly once', () => {
    const onEmit = jest.fn();
    render(
      <Host
        initial={{ val: 5, cur: SECOND_CURRENCY }}
        fixedCurrency={FIRST_CURRENCY}
        onEmit={onEmit}
      />,
    );

    expect(onEmit).toHaveBeenCalledTimes(1);
    expect(onEmit).toHaveBeenCalledWith({ val: 5, cur: FIRST_CURRENCY });
  });

  it('reports typed values to the parent and keeps the draft while focused', () => {
    const onEmit = jest.fn();
    render(<Host initial={{ val: 0, cur: FIRST_CURRENCY }} onEmit={onEmit} />);

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '10.' } });

    // A trailing separator is a half-typed number — shown, but not reported.
    expect(input).toHaveValue('10.');
    expect(onEmit).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: '10.5' } });
    fireEvent.blur(input);

    expect(onEmit).toHaveBeenLastCalledWith({ val: 10.5, cur: FIRST_CURRENCY });
    expect(input).toHaveValue('10.5');
  });

  it('keeps the current amount when the currency changes', () => {
    const onEmit = jest.fn();
    render(<Host initial={{ val: 7, cur: FIRST_CURRENCY }} onEmit={onEmit} />);

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: SECOND_CURRENCY },
    });

    expect(onEmit).toHaveBeenLastCalledWith({ val: 7, cur: SECOND_CURRENCY });
  });
});
