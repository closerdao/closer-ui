import { act, screen } from '@testing-library/react';

import { renderWithNextIntl } from '../../test/utils';
import EditModel from './EditModel';

jest.mock('../../contexts/auth', () => ({
  useAuth: () => ({
    user: { _id: 'u1', roles: ['admin'] },
    isAuthenticated: true,
  }),
}));

// Rich editors such as the longtext field keep the first `update` they were handed.
const firstUpdate: Record<string, (name: string, value: unknown) => void> = {};
jest.mock('../FormField', () => ({
  __esModule: true,
  default: ({ name, data, update }: any) => {
    firstUpdate[name] ??= update;
    return <input aria-label={name} value={data[name] ?? ''} readOnly />;
  },
}));

const fields = [
  { name: 'name', type: 'text' },
  { name: 'price', type: 'number' },
  { name: 'description', type: 'longtext' },
];

describe('EditModel field updates from handlers captured before load', () => {
  it('keep the loaded fields', async () => {
    let resolveLoad: (value: unknown) => void = () => {};
    const load = jest.fn(
      () => new Promise((resolve) => (resolveLoad = resolve)),
    );

    renderWithNextIntl(
      <EditModel endpoint="/food" id="f1" fields={fields} load={load} />,
    );
    const staleUpdate = firstUpdate.description;

    await act(async () => {
      resolveLoad({
        _id: 'f1',
        name: 'Basic food',
        price: 12,
        description: 'Food package for bookings.',
      });
    });
    expect(screen.getByLabelText('name')).toHaveValue('Basic food');

    act(() => staleUpdate('description', 'Food package for bookings.'));

    expect(screen.getByLabelText('name')).toHaveValue('Basic food');
    expect(screen.getByLabelText('price')).toHaveValue('12');
    expect(screen.getByLabelText('description')).toHaveValue(
      'Food package for bookings.',
    );
  });
});
