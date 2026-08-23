import { fireEvent, screen } from '@testing-library/react';

import { renderWithNextIntl } from '../test/utils';
import CancellationPolicyEditor from './CancellationPolicyEditor';

const getBucketInput = (label: string) =>
  screen.getByLabelText(label) as HTMLInputElement;

describe('CancellationPolicyEditor', () => {
  it('leaves every bucket empty when the event has no policy', () => {
    renderWithNextIntl(
      <CancellationPolicyEditor value={undefined} onChange={jest.fn()} />,
    );

    expect(getBucketInput('More than 30 days before')).toHaveValue(null);
    expect(getBucketInput('Less than 2 days before')).toHaveValue(null);
    // An unset bucket has to say what it falls back to, or "empty" reads as
    // "refund nothing".
    expect(screen.getAllByText(/Platform default:/)).toHaveLength(4);
  });

  it('shows saved fractions as percentages', () => {
    renderWithNextIntl(
      <CancellationPolicyEditor
        value={{ default: 1, lastweek: 0.25 }}
        onChange={jest.fn()}
      />,
    );

    expect(getBucketInput('More than 30 days before')).toHaveValue(100);
    expect(getBucketInput('7 to 2 days before')).toHaveValue(25);
    expect(getBucketInput('30 to 8 days before')).toHaveValue(null);
  });

  it('stores a typed percentage as a fraction', () => {
    const onChange = jest.fn();
    renderWithNextIntl(
      <CancellationPolicyEditor value={{ default: 1 }} onChange={onChange} />,
    );

    fireEvent.change(getBucketInput('7 to 2 days before'), {
      target: { value: '40' },
    });

    expect(onChange).toHaveBeenCalledWith({ default: 1, lastweek: 0.4 });
  });

  it('drops the bucket when the input is cleared, restoring the fallback', () => {
    const onChange = jest.fn();
    renderWithNextIntl(
      <CancellationPolicyEditor
        value={{ default: 1, lastday: 0 }}
        onChange={onChange}
      />,
    );

    fireEvent.change(getBucketInput('Less than 2 days before'), {
      target: { value: '' },
    });

    expect(onChange).toHaveBeenCalledWith({ default: 1 });
  });

  it('hides the buckets once the event is marked non-refundable', () => {
    const onChange = jest.fn();
    const { rerender } = renderWithNextIntl(
      <CancellationPolicyEditor value={{ default: 1 }} onChange={onChange} />,
    );

    fireEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith({ default: 1, refundable: false });

    rerender(
      <CancellationPolicyEditor
        value={{ default: 1, refundable: false }}
        onChange={onChange}
      />,
    );

    expect(
      screen.queryByLabelText('More than 30 days before'),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/non-refundable/)).toBeInTheDocument();
  });
});
