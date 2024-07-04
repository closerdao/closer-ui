import { fireEvent } from '@testing-library/react';

import Input from './';
import { renderWithNextIntl } from '../../../test/utils';


describe('Input', () => {
  test('renders without crashing', () => {
    renderWithNextIntl(<Input />);
  });

  test('renders label when passed as prop', () => {
    const { getByLabelText } = renderWithNextIntl(<Input label="Name" />);
    const label = getByLabelText('Name');
    expect(label).toBeInTheDocument();
  });

  test('calls onBlur when user clicks outside the isInstantSave input', () => {
    const onBlur = jest.fn();
    const { getByLabelText } = renderWithNextIntl(
      <Input isInstantSave={true} label="Name" onBlur={onBlur} />,
    );
    const input = getByLabelText('Name');
    fireEvent.blur(input);
    expect(onBlur).toHaveBeenCalled();
  });

  test('calls onChange when user presses enter on isInstantSave input', () => {
    const onChange = jest.fn();
    const { getByLabelText } = renderWithNextIntl(
      <Input label="Name" isInstantSave={true} onChange={onChange} />,
    );
    const input = getByLabelText('Name');
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(onChange).toHaveBeenCalled();
  });

  test('disables input when passed isDisabled as true', () => {
    const { getByLabelText } = renderWithNextIntl(<Input label="Name" isDisabled={true} />);
    const input = getByLabelText('Name') as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });

  test('displays validation error when isInstantSave input is invalid', () => {
    const { getByLabelText, getByText } = renderWithNextIntl(
      <Input isInstantSave={true} label="Email" validation="email" />,
    );
    const input = getByLabelText('Email');
    fireEvent.change(input, { target: { value: 'invalid-email' } });
    const error = getByText('Email is not a valid email value.');
    expect(error).toBeInTheDocument();
  });

  test('does not display validation error when input is valid', () => {
    const { getByLabelText, queryByText } = renderWithNextIntl(
      <Input label="Email" validation="email" />,
    );
    const input = getByLabelText('Email');
    fireEvent.change(input, { target: { value: 'valid-email@example.com' } });
    const error = queryByText('Email is not a valid email value.');
    expect(error).not.toBeInTheDocument();
  });
});
