import { fireEvent, render } from '@testing-library/react';

import Input from './';

describe('Input', () => {
  test('renders without crashing', () => {
    render(<Input />);
  });

  test('renders label when passed as prop', () => {
    const { getByLabelText } = render(<Input label="Name" />);
    const label = getByLabelText('Name');
    expect(label).toBeInTheDocument();
  });

  test('calls onBlur when user clicks outside the input', () => {
    const onBlur = jest.fn();
    const { getByLabelText } = render(<Input label="Name" onBlur={onBlur} />);
    const input = getByLabelText('Name');
    fireEvent.blur(input);
    expect(onBlur).toHaveBeenCalled();
  });

  test('calls onChange when user presses enter', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(
      <Input label="Name" onChange={onChange} />,
    );
    const input = getByLabelText('Name');
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(onChange).toHaveBeenCalled();
  });

  test('disables input when passed isDisabled as true', () => {
    const { getByLabelText } = render(<Input label="Name" isDisabled={true} />);
    const input = getByLabelText('Name') as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });

  test('displays validation error when input is invalid', () => {
    const { getByLabelText, getByText } = render(
      <Input label="Email" validation="email" />,
    );
    const input = getByLabelText('Email');
    fireEvent.change(input, { target: { value: 'invalid-email' } });
    const error = getByText('Email is not a valid email value.');
    expect(error).toBeInTheDocument();
  });

  test('does not display validation error when input is valid', () => {
    const { getByLabelText, queryByText } = render(
      <Input label="Email" validation="email" />,
    );
    const input = getByLabelText('Email');
    fireEvent.change(input, { target: { value: 'valid-email@example.com' } });
    const error = queryByText('Email is not a valid email value.');
    expect(error).not.toBeInTheDocument();
  });
});
