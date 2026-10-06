import { fireEvent, screen, waitFor } from '@testing-library/react';

import { renderWithNextIntl } from '../../test/utils';
import api, { invalidateGetCache } from '../../utils/api';
import EditModel from './EditModel';

const authState = {
  user: { _id: 'u1', roles: ['admin'] },
  isAuthenticated: true,
};

jest.mock('../../contexts/auth', () => ({
  useAuth: () => authState,
}));
// The moduleNameMapper misses SWC's `.js` specifier; mock the path EditModel really loads.
jest.mock('../../utils/api.js', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: { results: [] } })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    patch: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
  },
  invalidateGetCache: jest.fn(),
}));

const nameField = {
  name: 'name',
  label: 'Title',
  type: 'text',
  public: true,
  editable: true,
};

const renderModel = (endpoint: string, initialData?: Record<string, unknown>) =>
  renderWithNextIntl(
    <EditModel
      endpoint={endpoint}
      fields={[nameField] as any}
      initialData={initialData ?? { name: 'Seed project' }}
    />,
  );

// Both picker variants carry the `dates` testid; only the collapsed one — the
// variant the event form uses — renders it as a button that opens the calendar.
const isCollapsedPicker = (element: HTMLElement) =>
  element.tagName === 'BUTTON';

describe('EditModel date picker', () => {
  it('gives the project form the collapsed picker the event form uses', () => {
    renderModel('/project');

    expect(isCollapsedPicker(screen.getByTestId('dates'))).toBe(true);
  });

  it('spells out the span once the project has both dates', () => {
    renderModel('/project', {
      name: 'Seed project',
      start: '2026-03-01T09:00:00.000Z',
      end: '2026-03-05T09:00:00.000Z',
    });

    expect(screen.getByTestId('dates')).toHaveTextContent(/5 days/i);
  });

  it('leaves the volunteer form on the expanded picker', () => {
    renderModel('/volunteer');

    expect(isCollapsedPicker(screen.getByTestId('dates'))).toBe(false);
  });

  it('renders no picker for endpoints that do not schedule', () => {
    renderModel('/listing');

    expect(screen.queryByTestId('dates')).not.toBeInTheDocument();
  });
});

describe('EditModel with load, save and remove', () => {
  const mockedApi = api as unknown as Record<string, jest.Mock>;
  const food = { _id: 'f1', name: 'Basic food', createdBy: 'u1' };

  beforeEach(() => {
    jest.clearAllMocks();
    // jsdom has no layout, so the error banner's scroll into view is a no-op here.
    Element.prototype.scrollIntoView = jest.fn();
  });

  const renderBackedModel = (props: Record<string, unknown>) =>
    renderWithNextIntl(
      <EditModel endpoint="/food" fields={[nameField] as any} {...props} />,
    );

  it('keeps the axios calls on endpoint when none are given', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { results: food } });
    mockedApi.patch.mockResolvedValueOnce({ data: { results: food } });
    const onSave = jest.fn();

    renderBackedModel({ id: 'f1', onSave });
    await screen.findByDisplayValue('Basic food');
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith(food));
    expect(mockedApi.get).toHaveBeenCalledWith('/food/f1');
    expect(mockedApi.patch).toHaveBeenCalledWith(
      '/food/f1',
      expect.objectContaining({ name: 'Basic food' }),
    );
  });

  it('loads the model through load instead of GET', async () => {
    const load = jest.fn().mockResolvedValue(food);

    renderBackedModel({ id: 'f1', load });

    expect(await screen.findByDisplayValue('Basic food')).toBeInTheDocument();
    expect(load).toHaveBeenCalledWith('f1');
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('saves through save, then invalidates the cached list and calls onSave', async () => {
    const save = jest.fn().mockResolvedValue({ ...food, name: 'Saved' });
    const onSave = jest.fn();

    renderBackedModel({ id: 'f1', initialData: food, save, onSave });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({ ...food, name: 'Saved' }),
    );
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Basic food' }),
      'f1',
    );
    expect(invalidateGetCache).toHaveBeenCalledWith('/food');
    expect(mockedApi.patch).not.toHaveBeenCalled();
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('shows the error save rejects with', async () => {
    const save = jest.fn().mockRejectedValue(
      Object.assign(new Error('Duplicate entry.'), {
        response: { status: 400, data: { error: 'Duplicate entry.' } },
      }),
    );
    const onError = jest.fn();

    renderBackedModel({ initialData: { name: 'Basic food' }, save, onError });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Duplicate entry.',
    );
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Basic food' }),
      undefined,
    );
    expect(onError).toHaveBeenCalledWith('Duplicate entry.');
  });

  it('deletes through remove, then calls onDelete', async () => {
    const remove = jest.fn().mockResolvedValue(undefined);
    const onDelete = jest.fn();

    renderBackedModel({
      id: 'f1',
      initialData: food,
      remove,
      onDelete,
      allowDelete: true,
      deleteButton: 'Delete food',
    });
    fireEvent.click(screen.getByRole('button', { name: 'Delete food' }));
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Delete food' }).at(-1)!,
    );

    await waitFor(() => expect(onDelete).toHaveBeenCalled());
    expect(remove).toHaveBeenCalledWith('f1');
    expect(invalidateGetCache).toHaveBeenCalledWith('/food');
    expect(mockedApi.delete).not.toHaveBeenCalled();
  });
});
