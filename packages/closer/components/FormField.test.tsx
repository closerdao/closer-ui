import { fireEvent, screen } from '@testing-library/react';

import { renderWithNextIntl } from '../test/utils';
import FormField from './FormField';

const skillsField = {
  name: 'skills',
  type: 'multi-select',
  label: 'Skills',
  options: ['Carpentry', 'Plumbing'],
};

describe('FormField multi-select', () => {
  it('renders a record saved without the field at all', () => {
    // Edit mode feeds the API record straight in, so a project created before
    // `skills` existed has no array here.
    renderWithNextIntl(
      <FormField {...skillsField} data={{}} update={jest.fn()} />,
    );

    const boxes = screen.getAllByRole('checkbox');
    expect(boxes).toHaveLength(2);
    boxes.forEach((box) => expect(box).not.toBeChecked());
  });

  it('starts the selection from empty when the field is missing', () => {
    const update = jest.fn();
    renderWithNextIntl(
      <FormField {...skillsField} data={{}} update={update} />,
    );

    fireEvent.click(screen.getAllByRole('checkbox')[0]);

    expect(update).toHaveBeenCalledWith('skills', ['Carpentry']);
  });

  it('reflects and toggles an existing selection', () => {
    const update = jest.fn();
    renderWithNextIntl(
      <FormField
        {...skillsField}
        data={{ skills: ['Carpentry'] }}
        update={update}
      />,
    );

    const [carpentry, plumbing] = screen.getAllByRole('checkbox');
    expect(carpentry).toBeChecked();
    expect(plumbing).not.toBeChecked();

    fireEvent.click(carpentry);
    expect(update).toHaveBeenCalledWith('skills', []);
  });

  it('renders options supplied by a dynamic field', () => {
    renderWithNextIntl(
      <FormField
        {...skillsField}
        data={{}}
        update={jest.fn()}
        dynamicField={{ name: 'skills', options: ['Stoneworks'] }}
      />,
    );

    expect(screen.getAllByRole('checkbox')).toHaveLength(1);
    expect(screen.getByText('Stoneworks')).toBeInTheDocument();
  });

  it('renders nothing rather than throwing when a dynamic field has no options', () => {
    renderWithNextIntl(
      <FormField
        {...skillsField}
        data={{}}
        update={jest.fn()}
        dynamicField={{ name: 'skills' }}
      />,
    );

    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });
});
